import { supabase } from './supabase.web';
import type { WeeklyPushAvailability } from './weeklyPush';

export type { WeeklyPushAvailability };

const VAPID_PUBLIC_KEY =
  'BLMGzGTWWq3IgL1cybzgX0F-rvtax4ZWNYKTjfdYshxOCd3mOZOgMEyl0pRlEKhCRrArOvr7PsO3u4n5pK92VUs';
const SERVICE_WORKER_URL = '/sw.js';

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function base64UrlToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export function getWeeklyPushAvailability(): WeeklyPushAvailability {
  if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
    return 'available';
  }
  return isIOS() && !isStandalone() ? 'needs-home-screen' : 'unsupported';
}

export async function isWeeklyPushEnabled(): Promise<boolean> {
  if (getWeeklyPushAvailability() !== 'available' || Notification.permission !== 'granted') {
    return false;
  }
  return (await currentSubscription()) !== null;
}

// Must be called directly from a tap: iOS only shows the permission prompt in response to one.
export async function enableWeeklyPush(): Promise<'enabled' | 'denied'> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error('Sign in to turn on the weekly insight.');

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY),
    }));

  const { keys } = subscription.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: subscription.endpoint,
    user_id: userId,
    p256dh: keys?.p256dh,
    auth: keys?.auth,
    time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  if (error) throw error;
  return 'enabled';
}

export async function disableWeeklyPush(): Promise<void> {
  if (getWeeklyPushAvailability() !== 'available') return;
  const subscription = await currentSubscription();
  if (!subscription) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  await subscription.unsubscribe();
}
