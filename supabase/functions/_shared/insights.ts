// Shared by the iPhone app's local notification and the weekly-insight Edge Function.
// Callers convert each snack to local time first, since the server runs in UTC.

export interface InsightSnack {
  hour: number;
  dayIndex: number; // 0 = Sunday
  reason?: string | null;
}

export type ReasonLabeler = (reason: string) => string;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYPART_LABELS = ['morning', 'afternoon', 'evening', 'night'];

function daypartForHour(hour: number): number {
  if (hour >= 6 && hour <= 11) return 0;
  if (hour >= 12 && hour <= 16) return 1;
  if (hour >= 17 && hour <= 20) return 2;
  return 3; // night: 21–23 and 0–5, wraps past midnight
}

function topReasonInsight(snacks: InsightSnack[], label: ReasonLabeler): string | null {
  const counts = new Map<string, number>();
  for (const s of snacks) {
    if (s.reason) counts.set(s.reason, (counts.get(s.reason) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  const [topReason] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return `${label(topReason)} was your most common reason for snacking this week.`;
}

function timeOfDayInsight(snacks: InsightSnack[]): string | null {
  if (snacks.length === 0) return null;
  const counts = [0, 0, 0, 0];
  for (const s of snacks) counts[daypartForHour(s.hour)] += 1;
  const topIndex = counts.indexOf(Math.max(...counts));
  return `Most of your snacks this week happened in the ${DAYPART_LABELS[topIndex]}.`;
}

function steadiestDayInsight(snacks: InsightSnack[]): string | null {
  if (snacks.length === 0) return null;
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const s of snacks) dayCounts[s.dayIndex] += 1;
  const average = snacks.length / 7;
  let bestIndex = 0;
  let bestDiff = Infinity;
  dayCounts.forEach((count, i) => {
    const diff = Math.abs(count - average);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  });
  return `${DAY_NAMES[bestIndex]} was your most typical day this week.`;
}

const INSIGHTS: Array<(snacks: InsightSnack[], label: ReasonLabeler) => string | null> = [
  topReasonInsight,
  timeOfDayInsight,
  steadiestDayInsight,
];

export const INSIGHT_COUNT = INSIGHTS.length;

export const INSIGHT_TITLE = 'Your week in snacks';

export function pickInsight(
  snacks: InsightSnack[],
  label: ReasonLabeler,
  startIndex: number
): { body: string; usedIndex: number } | null {
  for (let offset = 0; offset < INSIGHTS.length; offset++) {
    const index = (startIndex + offset) % INSIGHTS.length;
    const body = INSIGHTS[index](snacks, label);
    if (body) return { body, usedIndex: index };
  }
  return null;
}
