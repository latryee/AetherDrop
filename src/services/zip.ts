import JSZip from 'jszip';
import type { TransferItem } from '../types/transfer';

/**
 * Packs multiple completed TransferItems into a single ZIP file.
 */
export async function createZipFromTransfers(
  items: TransferItem[],
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const nameCounts = new Map<string, number>();

  for (const item of items) {
    if (!item.blob) continue;

    let finalName = item.fileName;
    // Handle duplicate filenames inside the zip
    const count = nameCounts.get(finalName) || 0;
    if (count > 0) {
      const dotIndex = finalName.lastIndexOf('.');
      if (dotIndex > 0) {
        const base = finalName.substring(0, dotIndex);
        const ext = finalName.substring(dotIndex);
        finalName = `${base} (${count})${ext}`;
      } else {
        finalName = `${finalName} (${count})`;
      }
    }
    nameCounts.set(item.fileName, count + 1);

    zip.file(finalName, item.blob);
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  return zipBlob;
}
