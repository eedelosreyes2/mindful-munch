import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ReasonTag, Snack } from '../types/snack';

const LOCAL_KEY = 'snacks:v1';
const CLOUD_CACHE_KEY = 'snacks:cloudCache:v1';
const HIDDEN_QUICK_SELECT_KEY = 'hiddenQuickSelect:v1';
const PAGE_SIZE = 1000;

interface SnackRow {
  id: string;
  user_id?: string;
  text: string;
  reason: ReasonTag | null;
  logged_at: string;
}

interface Cloud {
  client: SupabaseClient;
  userId: string;
}

function toRow(snack: Snack, userId: string): SnackRow {
  return {
    id: snack.id,
    user_id: userId,
    text: snack.text,
    reason: snack.reason ?? null,
    logged_at: new Date(snack.timestamp).toISOString(),
  };
}

function fromRow(row: SnackRow): Snack {
  return {
    id: row.id,
    text: row.text,
    reason: row.reason ?? undefined,
    timestamp: Date.parse(row.logged_at),
  };
}

async function readStoredSnacks(key: string): Promise<Snack[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed: Snack[] = JSON.parse(raw);
    return parsed.sort((a, b) => a.timestamp - b.timestamp);
  } catch (err) {
    console.error('Failed to load snacks', err);
    return [];
  }
}

async function getCloud(): Promise<Cloud | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  return userId ? { client: supabase, userId } : null;
}

let migrationInFlight: Promise<void> | null = null;

function uploadLocalSnacks({ client, userId }: Cloud): Promise<void> {
  migrationInFlight ??= (async () => {
    const local = await readStoredSnacks(LOCAL_KEY);
    if (local.length === 0) return;
    const { error } = await client.from('snacks').upsert(local.map((s) => toRow(s, userId)));
    if (error) throw error;
    await AsyncStorage.removeItem(LOCAL_KEY);
  })().finally(() => {
    migrationInFlight = null;
  });
  return migrationInFlight;
}

async function fetchCloudSnacks({ client }: Cloud): Promise<Snack[]> {
  const rows: SnackRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from('snacks')
      .select('id, text, reason, logged_at')
      .order('logged_at')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data as SnackRow[]));
    if (data.length < PAGE_SIZE) return rows.map(fromRow);
  }
}

export async function getAllSnacks(): Promise<Snack[]> {
  const cloud = await getCloud();
  if (!cloud) return readStoredSnacks(LOCAL_KEY);

  try {
    await uploadLocalSnacks(cloud);
    const snacks = await fetchCloudSnacks(cloud);
    await AsyncStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(snacks));
    return snacks;
  } catch (err) {
    console.error('Failed to load snacks from the cloud', err);
    return readStoredSnacks(CLOUD_CACHE_KEY);
  }
}

export async function addSnack(snack: Omit<Snack, 'id'>): Promise<Snack> {
  const newSnack: Snack = {
    ...snack,
    id: `${snack.timestamp}-${Math.random().toString(36).slice(2, 9)}`,
  };

  const cloud = await getCloud();
  if (cloud) {
    const { error } = await cloud.client.from('snacks').insert(toRow(newSnack, cloud.userId));
    if (error) throw error;
    return newSnack;
  }

  const existing = await readStoredSnacks(LOCAL_KEY);
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify([...existing, newSnack]));
  return newSnack;
}

export async function updateSnack(id: string, updates: Omit<Snack, 'id'>): Promise<void> {
  const cloud = await getCloud();
  if (cloud) {
    const { error } = await cloud.client
      .from('snacks')
      .update({
        text: updates.text,
        reason: updates.reason ?? null,
        logged_at: new Date(updates.timestamp).toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
    return;
  }

  const existing = await readStoredSnacks(LOCAL_KEY);
  const updated = existing.map((s) => (s.id === id ? { ...updates, id } : s));
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
}

export async function deleteSnack(id: string): Promise<void> {
  const cloud = await getCloud();
  if (cloud) {
    const { error } = await cloud.client.from('snacks').delete().eq('id', id);
    if (error) throw error;
    return;
  }

  const existing = await readStoredSnacks(LOCAL_KEY);
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(existing.filter((s) => s.id !== id)));
}

export async function importSnacks(snacks: Snack[]): Promise<void> {
  const cloud = await getCloud();
  if (cloud) {
    for (let i = 0; i < snacks.length; i += PAGE_SIZE) {
      const batch = snacks.slice(i, i + PAGE_SIZE).map((s) => toRow(s, cloud.userId));
      const { error } = await cloud.client.from('snacks').upsert(batch);
      if (error) throw error;
    }
    return;
  }

  const byId = new Map((await readStoredSnacks(LOCAL_KEY)).map((s) => [s.id, s]));
  for (const s of snacks) byId.set(s.id, s);
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify([...byId.values()]));
}

export async function clearCloudCache(): Promise<void> {
  await AsyncStorage.removeItem(CLOUD_CACHE_KEY);
}

export async function getHiddenQuickSelectTexts(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HIDDEN_QUICK_SELECT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load hidden quick-select texts', err);
    return [];
  }
}

export async function hideQuickSelectText(text: string): Promise<void> {
  const key = text.trim().toLowerCase();
  const existing = await getHiddenQuickSelectTexts();
  if (existing.includes(key)) return;
  await AsyncStorage.setItem(HIDDEN_QUICK_SELECT_KEY, JSON.stringify([...existing, key]));
}

export function getFrequentSnackTexts(snacks: Snack[], limit = 5): string[] {
  const counts = new Map<string, { count: number; label: string; lastUsed: number }>();
  for (const s of snacks) {
    const key = s.text.trim().toLowerCase();
    if (!key) continue;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
      if (s.timestamp > existing.lastUsed) {
        existing.lastUsed = s.timestamp;
        existing.label = s.text.trim();
      }
    } else {
      counts.set(key, { count: 1, label: s.text.trim(), lastUsed: s.timestamp });
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, limit)
    .map((entry) => entry.label);
}

export function getSnacksForDay(snacks: Snack[], date: Date): Snack[] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return snacks.filter((s) => s.timestamp >= start.getTime() && s.timestamp < end.getTime());
}

export function getSnacksForWeek(snacks: Snack[], weekStart: Date): Snack[] {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return snacks.filter((s) => s.timestamp >= start.getTime() && s.timestamp < end.getTime());
}

// Sunday-start week, matching the week-overview chart.
// TODO: auto-detect the week start day from the device's locale/regional
// settings instead of hardcoding Sunday.
export function getCurrentWeekStart(reference: Date = new Date()): Date {
  const d = new Date(reference);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
