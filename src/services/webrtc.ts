import { Peer, type DataConnection } from 'peerjs';
import type { DeviceInfo, TransferItem, TextMessageItem, DataPacket, HandshakePacket, FileHeaderPacket, FileChunkPacket } from '../types/transfer';
import { createLocalDeviceInfo, getStoredDeviceName } from './device';
import { FileReceiver, sendFileInChunks } from './fileChunker';
import { soundEffects } from './audio';
import confetti from 'canvas-confetti';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebRTCServiceEvents {
  onStateChange: (state: ConnectionState) => void;
  onMyIdReady: (id: string, roomCode: string, isHost: boolean) => void;
  onPeerConnected: (peer: DeviceInfo) => void;
  onPeerDisconnected: (peerId: string) => void;
  onTransferUpdate: (item: TransferItem) => void;
  onTextMessage: (msg: TextMessageItem) => void;
  onError: (err: string) => void;
}

export class WebRTCService {
  private peer: Peer | null = null;
  private myId: string = '';
  private roomCode: string = '';
  private isHost: boolean = false;
  private myDevice: DeviceInfo | null = null;
  private connections: Map<string, { conn: DataConnection; device: DeviceInfo }> = new Map();
  private activeReceivers: Map<string, FileReceiver> = new Map();
  private activeTransfers: Map<string, TransferItem> = new Map();
  private abortControllers: Map<string, boolean> = new Map();
  private autoDownload: boolean = true;
  private events: WebRTCServiceEvents;

  constructor(events: WebRTCServiceEvents) {
    this.events = events;
    try {
      const savedAuto = localStorage.getItem('aetherdrop_auto_download');
      if (savedAuto !== null) {
        this.autoDownload = savedAuto === 'true';
      }
    } catch {
      // ignore
    }
  }

  public setAutoDownload(val: boolean) {
    this.autoDownload = val;
    try {
      localStorage.setItem('aetherdrop_auto_download', String(val));
    } catch {
      // ignore
    }
  }

  public isAutoDownload(): boolean {
    return this.autoDownload;
  }

  public getMyDevice(): DeviceInfo | null {
    return this.myDevice;
  }

  public getMyId(): string {
    return this.myId;
  }

  public getRoomCode(): string {
    return this.roomCode;
  }

  public isRoomHost(): boolean {
    return this.isHost;
  }

  public getConnectedPeers(): DeviceInfo[] {
    return Array.from(this.connections.values()).map((c) => c.device);
  }

  /**
   * Initializes WebRTC connection with robust deterministic host-client routing.
   * If targetRoomCode is provided, this device joins as a CLIENT and auto-connects to host.
   * If targetPeerId is provided, it connects directly to that peer ID.
   */
  public init(targetRoomCode?: string, targetPeerId?: string) {
    this.cleanup();
    this.events.onStateChange('connecting');

    const isJoining = Boolean(targetRoomCode || targetPeerId);
    this.isHost = !isJoining;

    const code = targetRoomCode?.toUpperCase().trim() || this.generateRoomCode();
    this.roomCode = code;

    // Host has fixed predictable ID: `aetherdrop-host-${code}`
    // Client has unique ID: `aetherdrop-peer-${code}-${random}`
    const peerId = this.isHost
      ? `aetherdrop-host-${code.toLowerCase()}`
      : `aetherdrop-peer-${code.toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`;

    this.myId = peerId;
    this.myDevice = createLocalDeviceInfo(peerId);

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('open', (id) => {
        this.myId = id;
        if (this.myDevice) {
          this.myDevice.id = id;
        }
        this.events.onMyIdReady(id, this.roomCode, this.isHost);
        this.events.onStateChange('connected');

        // If this device is joining an existing room, connect to the host or target peer automatically!
        if (isJoining) {
          const connectTarget = targetPeerId || `aetherdrop-host-${code.toLowerCase()}`;
          // Short delay to ensure STUN discovery readiness
          setTimeout(() => {
            this.connectToPeer(connectTarget);
          }, 300);
        }
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn, false);
      });

      this.peer.on('error', (err: { type?: string; message?: string }) => {
        console.warn('PeerJS Notice:', err);

        // If ID taken (e.g. host already exists when trying to be host), join as client instead!
        if (err.type === 'unavailable-id' && this.isHost) {
          console.log('Host ID already active, joining room as client...');
          this.init(code, undefined);
          return;
        }

        if (err.type === 'peer-unavailable') {
          console.log('Target peer unavailable, will retry shortly...');
          return;
        }

        this.events.onError(err.message || 'Bağlantı hatası oluştu');
      });

      this.peer.on('disconnected', () => {
        this.events.onStateChange('disconnected');
        // Attempt auto reconnect to signaling server
        if (this.peer && !this.peer.destroyed) {
          this.peer.reconnect();
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'WebRTC başlatılamadı';
      this.events.onError(message);
      this.events.onStateChange('error');
    }
  }

  /**
   * Connect to another peer by their peerId or Room Code
   */
  public connectToPeer(targetIdOrCode: string) {
    if (!this.peer || this.peer.destroyed) return;

    let targetId = targetIdOrCode.trim();
    // If it's a 6-digit room code, connect to that room's host
    if (targetId.length <= 8 && !targetId.startsWith('aetherdrop-')) {
      targetId = `aetherdrop-host-${targetId.toLowerCase()}`;
    }

    if (targetId === this.myId) {
      return; // Do not connect to self
    }

    if (this.connections.has(targetId)) {
      return; // Already connected
    }

    try {
      const conn = this.peer.connect(targetId, {
        reliable: true,
      });

      this.setupConnection(conn, true);
    } catch (err) {
      console.warn('Connect error:', err);
    }
  }

  /**
   * Set up event listeners for a data connection
   */
  private setupConnection(conn: DataConnection, isInitiator: boolean) {
    conn.on('open', () => {
      // Send initial handshake with local device info
      if (this.myDevice) {
        this.myDevice.name = getStoredDeviceName(this.myDevice.name);
        const handshake: HandshakePacket = {
          type: 'HANDSHAKE',
          device: this.myDevice,
          isAck: false,
        };
        conn.send(handshake);
      }

      // Initial placeholder device info
      const tempDevice: DeviceInfo = {
        id: conn.peer,
        name: isInitiator ? 'Eşleşen Cihaz' : 'Bağlanan Cihaz',
        type: 'desktop',
        browser: 'Web',
        os: 'Bilinmiyor',
        connectedAt: Date.now(),
      };

      this.connections.set(conn.peer, { conn, device: tempDevice });
    });

    conn.on('data', (data: unknown) => {
      this.handleIncomingData(conn.peer, data as DataPacket, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.events.onPeerDisconnected(conn.peer);
    });

    conn.on('error', (err) => {
      console.warn(`Connection error with ${conn.peer}:`, err);
    });
  }

  /**
   * Process all incoming data packets (Handshake, File chunks, Text messages)
   */
  private handleIncomingData(peerId: string, packet: DataPacket, conn: DataConnection) {
    if (!packet || typeof packet !== 'object') return;

    switch (packet.type) {
      case 'HANDSHAKE': {
        const handshakePkt = packet as HandshakePacket;
        const existing = this.connections.get(peerId);
        const wasAlreadyNotified = existing && existing.device.os !== 'Bilinmiyor';

        const updatedDevice: DeviceInfo = {
          ...handshakePkt.device,
          id: peerId,
          isSelf: false,
        };

        if (existing) {
          this.connections.set(peerId, { ...existing, device: updatedDevice });
        } else {
          this.connections.set(peerId, { conn, device: updatedDevice });
        }

        // Only reply if this packet is NOT already an ACK (breaks the ping-pong loop)
        if (!handshakePkt.isAck && this.myDevice && conn.open) {
          conn.send({
            type: 'HANDSHAKE',
            device: {
              ...this.myDevice,
              name: getStoredDeviceName(this.myDevice.name),
            },
            isAck: true,
          } as HandshakePacket);
        }

        // Only trigger sound and peerConnected event ONCE per peer session
        if (!wasAlreadyNotified) {
          this.events.onPeerConnected(updatedDevice);
          soundEffects.playConnectSound();
        }
        break;
      }

      case 'FILE_HEADER': {
        const header = packet as FileHeaderPacket;
        const receiver = new FileReceiver({
          fileId: header.fileId,
          fileName: header.fileName,
          fileSize: header.fileSize,
          fileType: header.fileType,
          totalChunks: header.totalChunks,
        });
        this.activeReceivers.set(header.fileId, receiver);

        const peerInfo = this.connections.get(peerId)?.device;
        const transferItem: TransferItem = {
          id: header.fileId,
          fileName: header.fileName,
          fileSize: header.fileSize,
          fileType: header.fileType,
          direction: 'incoming',
          targetPeerId: peerId,
          targetPeerName: peerInfo?.name || 'Bilinmeyen Cihaz',
          status: 'in-progress',
          bytesTransferred: 0,
          progressPercent: 0,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          startedAt: Date.now(),
        };

        this.activeTransfers.set(header.fileId, transferItem);
        this.events.onTransferUpdate(transferItem);
        soundEffects.playSendSound();
        break;
      }

      case 'FILE_CHUNK': {
        const chunk = packet as FileChunkPacket;
        const receiver = this.activeReceivers.get(chunk.fileId);
        if (!receiver) return;

        const result = receiver.addChunk(chunk.chunkIndex, chunk.data);
        const item = this.activeTransfers.get(chunk.fileId);

        if (item) {
          item.bytesTransferred = result.bytesReceived;
          item.progressPercent = result.progress;
          item.speedBytesPerSec = result.speedBps;
          item.etaSeconds = result.etaSeconds;

          if (result.isComplete) {
            item.status = 'completed';
            item.completedAt = Date.now();
            const blob = receiver.assembleBlob();
            const blobUrl = URL.createObjectURL(blob);
            item.blobUrl = blobUrl;

            soundEffects.playSuccessSound();
            this.triggerConfetti();

            if (this.autoDownload) {
              this.triggerDownload(blobUrl, item.fileName);
            }
          }

          this.events.onTransferUpdate({ ...item });
        }
        break;
      }

      case 'FILE_COMPLETE': {
        const item = this.activeTransfers.get(packet.fileId);
        const receiver = this.activeReceivers.get(packet.fileId);
        if (item && receiver && item.status !== 'completed') {
          item.status = 'completed';
          item.progressPercent = 100;
          item.completedAt = Date.now();
          const blob = receiver.assembleBlob();
          const blobUrl = URL.createObjectURL(blob);
          item.blobUrl = blobUrl;

          soundEffects.playSuccessSound();
          this.triggerConfetti();

          if (this.autoDownload) {
            this.triggerDownload(blobUrl, item.fileName);
          }
          this.events.onTransferUpdate({ ...item });
        }
        break;
      }

      case 'TEXT_MSG': {
        soundEffects.playMessageSound();
        this.events.onTextMessage({
          id: packet.id,
          senderId: peerId,
          senderName: packet.senderName,
          text: packet.text,
          timestamp: packet.timestamp,
          isSelf: false,
        });
        break;
      }
    }
  }

  /**
   * Send a file to a specific connected peer
   */
  public async sendFile(targetPeerId: string, file: File): Promise<string> {
    const connEntry = this.connections.get(targetPeerId);
    if (!connEntry || !connEntry.conn.open) {
      throw new Error('Hedef cihaza bağlı değilsiniz');
    }

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const totalChunks = Math.ceil(file.size / (64 * 1024));

    // Send File Header
    const header: FileHeaderPacket = {
      type: 'FILE_HEADER',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      totalChunks,
      chunkSize: 64 * 1024,
    };

    connEntry.conn.send(header);

    const transferItem: TransferItem = {
      id: fileId,
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      direction: 'outgoing',
      targetPeerId,
      targetPeerName: connEntry.device.name,
      status: 'in-progress',
      bytesTransferred: 0,
      progressPercent: 0,
      speedBytesPerSec: 0,
      etaSeconds: 0,
      startedAt: Date.now(),
    };

    this.activeTransfers.set(fileId, transferItem);
    this.events.onTransferUpdate({ ...transferItem });
    soundEffects.playSendSound();

    this.abortControllers.set(fileId, false);

    // Stream chunks
    const dataChannel = (connEntry.conn as unknown as { dataChannel: RTCDataChannel }).dataChannel;
    if (!dataChannel) {
      throw new Error('WebRTC DataChannel hazır değil');
    }

    try {
      const success = await sendFileInChunks(
        file,
        fileId,
        dataChannel,
        (fId, index, buffer) => {
          connEntry.conn.send({
            type: 'FILE_CHUNK',
            fileId: fId,
            chunkIndex: index,
            data: buffer,
          } as FileChunkPacket);
        },
        (progress, bytesSent, speedBps, etaSeconds) => {
          const current = this.activeTransfers.get(fileId);
          if (current) {
            current.progressPercent = progress;
            current.bytesTransferred = bytesSent;
            current.speedBytesPerSec = speedBps;
            current.etaSeconds = etaSeconds;
            this.events.onTransferUpdate({ ...current });
          }
        },
        () => !!this.abortControllers.get(fileId)
      );

      if (success) {
        connEntry.conn.send({
          type: 'FILE_COMPLETE',
          fileId,
        });

        const completed = this.activeTransfers.get(fileId);
        if (completed) {
          completed.status = 'completed';
          completed.progressPercent = 100;
          completed.completedAt = Date.now();
          this.events.onTransferUpdate({ ...completed });
          soundEffects.playSuccessSound();
          this.triggerConfetti();
        }
      }
    } catch (err: unknown) {
      console.error('File transfer error:', err);
      const failed = this.activeTransfers.get(fileId);
      if (failed) {
        failed.status = 'failed';
        failed.error = err instanceof Error ? err.message : 'Aktarım hatası';
        this.events.onTransferUpdate({ ...failed });
      }
    }

    return fileId;
  }

  /**
   * Broadcast or send text snippet / link to connected peers
   */
  public sendTextMessage(text: string, targetPeerId?: string): TextMessageItem {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const senderName = this.myDevice?.name || 'Ben';
    const packet: DataPacket = {
      type: 'TEXT_MSG',
      id: msgId,
      text,
      senderName,
      timestamp: Date.now(),
    };

    if (targetPeerId) {
      const conn = this.connections.get(targetPeerId)?.conn;
      if (conn && conn.open) {
        conn.send(packet);
      }
    } else {
      this.connections.forEach(({ conn }) => {
        if (conn.open) {
          conn.send(packet);
        }
      });
    }

    soundEffects.playSendSound();

    const localMsg: TextMessageItem = {
      id: msgId,
      senderId: this.myId,
      senderName,
      text,
      timestamp: Date.now(),
      isSelf: true,
    };

    this.events.onTextMessage(localMsg);
    return localMsg;
  }

  /**
   * Helper to trigger instant file download in browser
   */
  public triggerDownload(blobUrl: string, fileName: string) {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Celebratory confetti particles
   */
  private triggerConfetti() {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#a855f7', '#3b82f6', '#06b6d4', '#10b981'],
      });
    } catch {
      // ignore
    }
  }

  public updateMyDeviceName(newName: string) {
    if (this.myDevice) {
      this.myDevice.name = newName;
      this.connections.forEach(({ conn }) => {
        if (conn.open) {
          conn.send({
            type: 'HANDSHAKE',
            device: this.myDevice!,
          });
        }
      });
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public cleanup() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.activeReceivers.clear();
    this.activeTransfers.clear();
    this.abortControllers.clear();
  }
}
