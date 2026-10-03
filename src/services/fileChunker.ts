// High-performance streaming file chunker with SCTP flow control and backpressure handling

export const CHUNK_SIZE = 64 * 1024; // 64 KB chunks (safest across iOS Safari & Chromium)
export const MAX_BUFFERED_AMOUNT = 1024 * 1024; // 1 MB backpressure threshold

export interface FileChunkMeta {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  totalChunks: number;
}

export class FileReceiver {
  private fileId: string;
  private fileName: string;
  private fileSize: number;
  private fileType: string;
  private totalChunks: number;
  private receivedChunks: (ArrayBuffer | null)[];
  private receivedBytes: number = 0;
  private receivedCount: number = 0;
  private startTime: number;
  private lastProgressTime: number;
  private lastBytes: number = 0;
  private currentSpeed: number = 0;

  constructor(meta: FileChunkMeta) {
    this.fileId = meta.fileId;
    this.fileName = meta.fileName;
    this.fileSize = meta.fileSize;
    this.fileType = meta.fileType || 'application/octet-stream';
    this.totalChunks = meta.totalChunks;
    this.receivedChunks = new Array(meta.totalChunks).fill(null);
    this.startTime = Date.now();
    this.lastProgressTime = this.startTime;
  }

  public addChunk(index: number, data: ArrayBuffer): {
    isComplete: boolean;
    progress: number;
    bytesReceived: number;
    speedBps: number;
    etaSeconds: number;
  } {
    if (index >= 0 && index < this.totalChunks && !this.receivedChunks[index]) {
      this.receivedChunks[index] = data;
      this.receivedBytes += data.byteLength;
      this.receivedCount++;
    }

    const now = Date.now();
    const timeDelta = (now - this.lastProgressTime) / 1000;

    if (timeDelta >= 0.25 || this.receivedCount === this.totalChunks) {
      const bytesDelta = this.receivedBytes - this.lastBytes;
      const instantSpeed = timeDelta > 0 ? bytesDelta / timeDelta : 0;
      this.currentSpeed = this.currentSpeed === 0 ? instantSpeed : this.currentSpeed * 0.7 + instantSpeed * 0.3;
      this.lastProgressTime = now;
      this.lastBytes = this.receivedBytes;
    }

    const progress = Math.min(100, (this.receivedBytes / (this.fileSize || 1)) * 100);
    const remainingBytes = Math.max(0, this.fileSize - this.receivedBytes);
    const etaSeconds = this.currentSpeed > 0 ? Math.ceil(remainingBytes / this.currentSpeed) : 0;
    const isComplete = this.receivedCount === this.totalChunks || this.receivedBytes >= this.fileSize;

    return {
      isComplete,
      progress,
      bytesReceived: this.receivedBytes,
      speedBps: this.currentSpeed,
      etaSeconds,
    };
  }

  public assembleBlob(): Blob {
    const validParts: ArrayBuffer[] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      if (this.receivedChunks[i]) {
        validParts.push(this.receivedChunks[i]!);
      }
    }
    return new Blob(validParts, { type: this.fileType });
  }

  public getMeta(): FileChunkMeta {
    return {
      fileId: this.fileId,
      fileName: this.fileName,
      fileSize: this.fileSize,
      fileType: this.fileType,
      totalChunks: this.totalChunks,
    };
  }
}

/**
 * Reads and sends a file in chunks over a WebRTC DataChannel with flow control.
 */
export async function sendFileInChunks(
  file: File,
  fileId: string,
  dataChannel: RTCDataChannel,
  sendChunkPacket: (fileId: string, chunkIndex: number, buffer: ArrayBuffer) => void,
  onProgress: (progress: number, bytesSent: number, speedBps: number, etaSeconds: number) => void,
  shouldAbort: () => boolean
): Promise<boolean> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let bytesSent = 0;
  const startTime = Date.now();
  let lastTime = startTime;
  let lastBytes = 0;
  let currentSpeed = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (shouldAbort()) {
      return false;
    }

    // Flow control: Wait if buffer is congested
    if (dataChannel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
      await waitForBufferLow(dataChannel);
    }

    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const slice = file.slice(start, end);
    const buffer = await slice.arrayBuffer();

    sendChunkPacket(fileId, chunkIndex, buffer);
    bytesSent += buffer.byteLength;

    const now = Date.now();
    const timeDelta = (now - lastTime) / 1000;
    if (timeDelta >= 0.25 || chunkIndex === totalChunks - 1) {
      const bytesDelta = bytesSent - lastBytes;
      const instantSpeed = timeDelta > 0 ? bytesDelta / timeDelta : 0;
      currentSpeed = currentSpeed === 0 ? instantSpeed : currentSpeed * 0.7 + instantSpeed * 0.3;
      lastTime = now;
      lastBytes = bytesSent;

      const progress = Math.min(100, (bytesSent / file.size) * 100);
      const remainingBytes = Math.max(0, file.size - bytesSent);
      const etaSeconds = currentSpeed > 0 ? Math.ceil(remainingBytes / currentSpeed) : 0;
      onProgress(progress, bytesSent, currentSpeed, etaSeconds);
    }
  }

  return true;
}

function waitForBufferLow(dataChannel: RTCDataChannel): Promise<void> {
  return new Promise((resolve) => {
    if (dataChannel.bufferedAmount <= MAX_BUFFERED_AMOUNT) {
      resolve();
      return;
    }

    const handleLow = () => {
      dataChannel.removeEventListener('bufferedamountlow', handleLow);
      resolve();
    };

    dataChannel.addEventListener('bufferedamountlow', handleLow);

    // Safety timeout in case event is missed
    setTimeout(() => {
      dataChannel.removeEventListener('bufferedamountlow', handleLow);
      resolve();
    }, 150);
  });
}

/**
 * Format bytes into human-readable representation (e.g. 14.2 MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format seconds into mm:ss or ss representation
 */
export function formatEta(seconds: number): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return '--';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}
