import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllSnacks } from './snackStorage';

export async function exportSnacks(): Promise<void> {
  const snacks = await getAllSnacks();
  const json = JSON.stringify(snacks, null, 2);

  const file = new File(Paths.cache, `mindfulmunch-export-${Date.now()}.json`);
  file.write(json);

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Export MindfulMunch data',
  });
}
