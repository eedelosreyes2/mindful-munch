import { REASON_TAGS, ReasonTag, Snack } from '../types/snack';
import { importSnacks } from './snackStorage';
import type { ImportResult } from './importSnacks';

export const isImportAvailable = true;

function pickFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

function toSnack(item: unknown): Snack | null {
  if (typeof item !== 'object' || item === null) return null;
  const { id, text, timestamp, reason } = item as Record<string, unknown>;
  if (typeof id !== 'string' || !id) return null;
  if (typeof text !== 'string' || !text.trim()) return null;
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return null;
  const validReason = REASON_TAGS.includes(reason as ReasonTag) ? (reason as ReasonTag) : undefined;
  return { id, text: text.trim(), timestamp, reason: validReason };
}

export async function pickAndImportSnacks(): Promise<ImportResult> {
  const file = await pickFile();
  if (!file) return { status: 'cancelled' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return { status: 'invalid' };
  }

  const snacks = Array.isArray(parsed)
    ? parsed.map(toSnack).filter((s): s is Snack => s !== null)
    : [];
  if (snacks.length === 0) return { status: 'invalid' };

  await importSnacks(snacks);
  return { status: 'imported', count: snacks.length };
}
