export type DeviceType = 'ipad' | 'iphone' | 'android' | 'mac' | 'windows' | 'linux' | 'desktop' | 'mobile';

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  browser: string;
  os: string;
  isSelf?: boolean;
  connectedAt: number;
}

export type TransferStatus = 'waiting' | 'in-progress' | 'completed' | 'failed' | 'rejected';

export interface TransferItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  direction: 'incoming' | 'outgoing';
  targetPeerId: string;
  targetPeerName: string;
  status: TransferStatus;
  bytesTransferred: number;
  progressPercent: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  blobUrl?: string;
  file?: File;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface TextMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
}

export type PacketType =
  | 'HANDSHAKE'
  | 'FILE_HEADER'
  | 'FILE_CHUNK'
  | 'FILE_COMPLETE'
  | 'FILE_ACCEPT'
  | 'FILE_REJECT'
  | 'TEXT_MSG'
  | 'PING'
  | 'PONG';

export interface HandshakePacket {
  type: 'HANDSHAKE';
  device: DeviceInfo;
}

export interface FileHeaderPacket {
  type: 'FILE_HEADER';
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  totalChunks: number;
  chunkSize: number;
}

export interface FileChunkPacket {
  type: 'FILE_CHUNK';
  fileId: string;
  chunkIndex: number;
  data: ArrayBuffer;
}

export interface FileCompletePacket {
  type: 'FILE_COMPLETE';
  fileId: string;
}

export interface FileResponsePacket {
  type: 'FILE_ACCEPT' | 'FILE_REJECT';
  fileId: string;
}

export interface TextMsgPacket {
  type: 'TEXT_MSG';
  id: string;
  text: string;
  senderName: string;
  timestamp: number;
}

export type DataPacket =
  | HandshakePacket
  | FileHeaderPacket
  | FileChunkPacket
  | FileCompletePacket
  | FileResponsePacket
  | TextMsgPacket;
