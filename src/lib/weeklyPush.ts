// The iPhone build schedules its weekly insight locally (see notifications/weeklyInsight.ts),
// so web push is a web-only feature.
export type WeeklyPushAvailability = 'available' | 'needs-home-screen' | 'unsupported';

export function getWeeklyPushAvailability(): WeeklyPushAvailability {
  return 'unsupported';
}

export async function isWeeklyPushEnabled(): Promise<boolean> {
  return false;
}

export async function enableWeeklyPush(): Promise<'enabled' | 'denied'> {
  return 'denied';
}

export async function disableWeeklyPush(): Promise<void> {}
