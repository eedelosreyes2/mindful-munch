// expo-notifications only supports iOS and Android, so the web build skips the weekly insight.
export const WEEKLY_INSIGHT_DEEP_LINK = 'week';

export function useLastNotificationResponse(): null {
  return null;
}

export async function scheduleWeeklyInsightNotification(): Promise<void> {}
