import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReasonTag, REASON_LABELS, Snack } from '../types/snack';
import { getAllSnacks, getSnacksForWeek, getCurrentWeekStart } from '../storage/snackStorage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ROTATION_KEY = 'weeklyInsight:rotationIndex';
const SCHEDULED_ID_KEY = 'weeklyInsight:scheduledId';
export const WEEKLY_INSIGHT_DEEP_LINK = 'week';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYPART_LABELS = ['morning', 'afternoon', 'evening', 'night'];

function daypartForHour(hour: number): number {
  if (hour >= 6 && hour <= 11) return 0;
  if (hour >= 12 && hour <= 16) return 1;
  if (hour >= 17 && hour <= 20) return 2;
  return 3; // night: 21–23 and 0–5, wraps past midnight
}

function computeTopReasonInsight(snacks: Snack[]): string | null {
  const counts: Partial<Record<ReasonTag, number>> = {};
  for (const s of snacks) {
    if (s.reason) counts[s.reason] = (counts[s.reason] ?? 0) + 1;
  }
  const entries = Object.entries(counts) as [ReasonTag, number][];
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const [topReason] = entries[0];
  return `${REASON_LABELS[topReason]} was your most common reason for snacking this week.`;
}

function computeTimeOfDayInsight(snacks: Snack[]): string | null {
  if (snacks.length === 0) return null;
  const counts = [0, 0, 0, 0];
  for (const s of snacks) {
    counts[daypartForHour(new Date(s.timestamp).getHours())] += 1;
  }
  const maxCount = Math.max(...counts);
  if (maxCount === 0) return null;
  const topIndex = counts.indexOf(maxCount);
  return `Most of your snacks this week happened in the ${DAYPART_LABELS[topIndex]}.`;
}

function computeSteadiestDayInsight(snacks: Snack[], weekStart: Date): string | null {
  if (snacks.length === 0) return null;
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const s of snacks) {
    const diffDays = Math.floor((s.timestamp - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) dayCounts[diffDays] += 1;
  }
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

const INSIGHT_COMPUTERS: Array<(snacks: Snack[], weekStart: Date) => string | null> = [
  computeTopReasonInsight,
  computeTimeOfDayInsight,
  computeSteadiestDayInsight,
];

function pickInsight(
  snacks: Snack[],
  weekStart: Date,
  startIndex: number
): { body: string; usedIndex: number } | null {
  for (let offset = 0; offset < INSIGHT_COMPUTERS.length; offset++) {
    const index = (startIndex + offset) % INSIGHT_COMPUTERS.length;
    const body = INSIGHT_COMPUTERS[index](snacks, weekStart);
    if (body) return { body, usedIndex: index };
  }
  return null;
}

function nextSundayAt6pm(): Date {
  const now = new Date();
  const result = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7;
  result.setDate(now.getDate() + daysUntilSunday);
  result.setHours(18, 0, 0, 0);
  if (result.getTime() <= now.getTime()) {
    result.setDate(result.getDate() + 7);
  }
  return result;
}

// Recomputes and reschedules the one-off weekly insight notification. Local
// notifications can't regenerate their own content between firings, so this
// is meant to be called on every app launch — it always cancels whatever was
// previously scheduled and books a fresh one for the upcoming Sunday using
// the latest data, rotating which kind of insight gets used each time.
export async function scheduleWeeklyInsightNotification(): Promise<void> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    const finalStatus =
      existingStatus === 'granted'
        ? existingStatus
        : (await Notifications.requestPermissionsAsync()).status;
    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Weekly insight',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const previousId = await AsyncStorage.getItem(SCHEDULED_ID_KEY);
    if (previousId) {
      await Notifications.cancelScheduledNotificationAsync(previousId).catch(() => {});
    }

    const allSnacks = await getAllSnacks();
    const weekStart = getCurrentWeekStart();
    const weekSnacks = getSnacksForWeek(allSnacks, weekStart);

    const rotationRaw = await AsyncStorage.getItem(ROTATION_KEY);
    const startIndex = rotationRaw ? Number(rotationRaw) % INSIGHT_COMPUTERS.length : 0;
    const insight = pickInsight(weekSnacks, weekStart, startIndex);
    if (!insight) return;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your week in snacks',
        body: insight.body,
        data: { deepLink: WEEKLY_INSIGHT_DEEP_LINK },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextSundayAt6pm(),
      },
    });

    await AsyncStorage.setItem(SCHEDULED_ID_KEY, id);
    await AsyncStorage.setItem(
      ROTATION_KEY,
      String((insight.usedIndex + 1) % INSIGHT_COMPUTERS.length)
    );
  } catch (err) {
    console.error('Failed to schedule weekly insight notification', err);
  }
}
