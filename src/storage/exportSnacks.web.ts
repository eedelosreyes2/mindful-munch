import { getAllSnacks } from './snackStorage';

export async function exportSnacks(): Promise<void> {
  const snacks = await getAllSnacks();
  const blob = new Blob([JSON.stringify(snacks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `mindfulmunch-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
