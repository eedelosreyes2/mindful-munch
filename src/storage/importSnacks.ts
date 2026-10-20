export type ImportResult =
  | { status: 'cancelled' }
  | { status: 'invalid' }
  | { status: 'imported'; count: number };

// Importing a file is only offered on web; the native build exports instead.
export const isImportAvailable = false;

export async function pickAndImportSnacks(): Promise<ImportResult> {
  return { status: 'cancelled' };
}
