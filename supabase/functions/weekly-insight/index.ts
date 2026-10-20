import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { INSIGHT_COUNT, INSIGHT_TITLE, InsightSnack, pickInsight } from '../_shared/insights.ts';

const SEND_WEEKDAY = 0; // Sunday
const SEND_HOUR = 18;
const OPEN_URL = '/log?initialViewMode=week&initialWeekOffset=1';
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Subscription {
  endpoint: string;
  user_id: string;
  p256dh: string;
  auth: string;
  time_zone: string;
  rotation_index: number;
  last_sent_week: string | null;
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

function localParts(instant: number, timeZone: string): LocalParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
    })
      .formatToParts(new Date(instant))
      .map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

// The UTC instant of local midnight on a calendar date in the given time zone.
function localMidnight(year: number, month: number, day: number, timeZone: string): number {
  const guess = Date.UTC(year, month - 1, day);
  let instant = guess;
  for (let i = 0; i < 2; i++) {
    const p = localParts(instant, timeZone);
    const shownAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    instant -= shownAsUtc - guess;
  }
  return instant;
}

// The Sunday-to-Saturday week that most recently finished, in the subscriber's time zone.
function lastFullWeek(now: number, timeZone: string): { start: number; end: number; key: string } {
  const today = localParts(now, timeZone);
  const thisSunday = new Date(Date.UTC(today.year, today.month - 1, today.day - today.weekday));
  const lastSunday = new Date(thisSunday.getTime() - 7 * DAY_MS);
  const ymd = (d: Date) => [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()] as const;
  return {
    start: localMidnight(...ymd(lastSunday), timeZone),
    end: localMidnight(...ymd(thisSunday), timeZone),
    key: thisSunday.toISOString().slice(0, 10),
  };
}

const capitalize = (reason: string) => reason.charAt(0).toUpperCase() + reason.slice(1);

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { force = false, userId } = await req.json().catch(() => ({}));

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT')!,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

  let query = supabase.from('push_subscriptions').select('*');
  if (userId) query = query.eq('user_id', userId);
  const { data: subscriptions, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const results: Record<string, string> = {};

  for (const sub of subscriptions as Subscription[]) {
    const id = sub.endpoint.slice(-12);
    const local = localParts(now, sub.time_zone);
    if (!force && !(local.weekday === SEND_WEEKDAY && local.hour === SEND_HOUR)) continue;

    const week = lastFullWeek(now, sub.time_zone);
    if (!force && sub.last_sent_week === week.key) {
      results[id] = 'already sent';
      continue;
    }

    const { data: rows, error: snackError } = await supabase
      .from('snacks')
      .select('reason, logged_at')
      .eq('user_id', sub.user_id)
      .gte('logged_at', new Date(week.start).toISOString())
      .lt('logged_at', new Date(week.end).toISOString());
    if (snackError) {
      results[id] = `snack query failed: ${snackError.message}`;
      continue;
    }

    const snacks: InsightSnack[] = rows.map((r) => {
      const p = localParts(Date.parse(r.logged_at), sub.time_zone);
      return { hour: p.hour, dayIndex: p.weekday, reason: r.reason };
    });
    const insight = pickInsight(snacks, capitalize, sub.rotation_index);
    if (!insight) {
      await supabase.from('push_subscriptions').update({ last_sent_week: week.key }).eq('endpoint', sub.endpoint);
      results[id] = 'nothing logged';
      continue;
    }

    const request = webpush.generateRequestDetails(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title: INSIGHT_TITLE, body: insight.body, url: OPEN_URL }),
      { TTL: 12 * 60 * 60 }
    );
    const response = await fetch(request.endpoint, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    if (response.status === 404 || response.status === 410) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      results[id] = 'expired, removed';
    } else if (response.ok) {
      await supabase
        .from('push_subscriptions')
        .update({ last_sent_week: week.key, rotation_index: (insight.usedIndex + 1) % INSIGHT_COUNT })
        .eq('endpoint', sub.endpoint);
      results[id] = 'sent';
    } else {
      results[id] = `push failed: ${response.status} ${await response.text()}`;
    }
  }

  return Response.json({ checked: subscriptions.length, results });
});
