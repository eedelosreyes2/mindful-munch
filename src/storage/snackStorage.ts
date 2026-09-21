import AsyncStorage from '@react-native-async-storage/async-storage';
import { Snack } from '../types/snack';

const STORAGE_KEY = 'snacks:v1';

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

export async function deleteSnack(id: string): Promise<void> {
  const existing = await getAllSnacks();
  const updated = existing.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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

// Monday-start week, matching the week-overview chart.
export function getCurrentWeekStart(reference: Date = new Date()): Date {
  const d = new Date(reference);
  const day = d.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}
