import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReasonTag, REASON_LABELS } from '../types/snack';
import {
  INSIGHT_COUNT,
  INSIGHT_TITLE,
  pickInsight,
} from '../../supabase/functions/_shared/insights';
import { getAllSnacks, getSnacksForWeek, getCurrentWeekStart } from '../storage/snackStorage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const useLastNotificationResponse = Notifications.useLastNotificationResponse;

const ROTATION_KEY = 'weeklyInsight:rotationIndex';
const SCHEDULED_ID_KEY = 'weeklyInsight:scheduledId';
export const WEEKLY_INSIGHT_DEEP_LINK = 'week';

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
    const fireAt = nextSundayAt6pm();
    const weekStart = getCurrentWeekStart(fireAt);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekSnacks = getSnacksForWeek(allSnacks, weekStart);

    const rotationRaw = await AsyncStorage.getItem(ROTATION_KEY);
    const startIndex = rotationRaw ? Number(rotationRaw) % INSIGHT_COUNT : 0;
    const insight = pickInsight(
      weekSnacks.map((s) => {
        const at = new Date(s.timestamp);
        return { hour: at.getHours(), dayIndex: at.getDay(), reason: s.reason };
      }),
      (reason) => REASON_LABELS[reason as ReasonTag],
      startIndex
    );
    if (!insight) return;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: INSIGHT_TITLE,
        body: insight.body,
        data: { deepLink: WEEKLY_INSIGHT_DEEP_LINK },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    });

    await AsyncStorage.setItem(SCHEDULED_ID_KEY, id);
    await AsyncStorage.setItem(
      ROTATION_KEY,
      String((insight.usedIndex + 1) % INSIGHT_COUNT)
    );
  } catch (err) {
    console.error('Failed to schedule weekly insight notification', err);
  }
}
