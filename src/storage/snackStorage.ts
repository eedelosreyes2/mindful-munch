import AsyncStorage from '@react-native-async-storage/async-storage';
import { Snack } from '../types/snack';

const STORAGE_KEY = 'snacks:v1';
const HIDDEN_QUICK_SELECT_KEY = 'hiddenQuickSelect:v1';

export async function getAllSnacks(): Promise<Snack[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: Snack[] = JSON.parse(raw);
    return parsed.sort((a, b) => a.timestamp - b.timestamp);
  } catch (err) {
    console.error('Failed to load snacks', err);
    return [];
  }
}

export async function addSnack(snack: Omit<Snack, 'id'>): Promise<Snack> {
  const newSnack: Snack = {
    ...snack,
    id: `${snack.timestamp}-${Math.random().toString(36).slice(2, 9)}`,
  };
  const existing = await getAllSnacks();
  const updated = [...existing, newSnack];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newSnack;
}

export async function updateSnack(id: string, updates: Omit<Snack, 'id'>): Promise<void> {
  const existing = await getAllSnacks();
  const updated = existing.map((s) => (s.id === id ? { ...updates, id } : s));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function deleteSnack(id: string): Promise<void> {
  const existing = await getAllSnacks();
  const updated = existing.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
