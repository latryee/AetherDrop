import { useState, useEffect, useRef } from 'react';
import type { DeviceInfo, TransferItem, TextMessageItem } from './types/transfer';
import { WebRTCService } from './services/webrtc';
import type { ConnectionState } from './services/webrtc';
import { Navbar } from './components/Navbar';
import { RadarView } from './components/RadarView';
import { DropZone } from './components/DropZone';
import { TransferList } from './components/TransferList';
import { TextTransfer } from './components/TextTransfer';
import { ConnectionModal } from './components/ConnectionModal';
import { SettingsModal } from './components/SettingsModal';
import { Radio, MessageSquare, History, Sparkles, Smartphone, ShieldCheck, Zap } from 'lucide-react';

export function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [myId, setMyId] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [myDevice, setMyDevice] = useState<DeviceInfo | null>(null);
  const [peers, setPeers] = useState<DeviceInfo[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [messages, setMessages] = useState<TextMessageItem[]>([]);
  const [selectedPeerId, setSelectedPeerId] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'radar' | 'text' | 'history'>('radar');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);

  const webrtcRef = useRef<WebRTCService | null>(null);

  useEffect(() => {
    // Check URL Hash for shared room and peer parameters (e.g. #room=8K2M19&peer=aetherdrop-host-8k2m19)
    let initialRoomCode: string | undefined = undefined;
    let targetPeerId: string | undefined = undefined;

    const hash = window.location.hash;
    if (hash.includes('room=')) {
      const match = hash.match(/room=([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        initialRoomCode = match[1].toUpperCase();
      }
    }
    if (hash.includes('peer=')) {
      const matchPeer = hash.match(/peer=([^&]+)/);
      if (matchPeer && matchPeer[1]) {
        targetPeerId = decodeURIComponent(matchPeer[1]);
      }
    }

    const service = new WebRTCService({
      onStateChange: (state) => setConnectionState(state),
      onMyIdReady: (id, code) => {
        setMyId(id);
        setRoomCode(code);
        setMyDevice(service.getMyDevice());
      },
      onPeerConnected: (peer) => {
        setPeers((prev) => {
          const filtered = prev.filter((p) => p.id !== peer.id);
          return [...filtered, peer];
        });
        setSelectedPeerId((curr) => curr || peer.id);
        setToast(`⚡ ${peer.name} eşleşti! Artık dosya gönderebilirsiniz.`);
        setTimeout(() => setToast(null), 4000);
      },
      onPeerDisconnected: (peerId) => {
        setPeers((prev) => prev.filter((p) => p.id !== peerId));
        setSelectedPeerId((curr) => (curr === peerId ? '' : curr));
      },
      onTransferUpdate: (item) => {
        setTransfers((prev) => {
          const index = prev.findIndex((t) => t.id === item.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = item;
            return next;
          }
          return [item, ...prev];
        });
      },
      onTextMessage: (msg) => {
        setMessages((prev) => [msg, ...prev]);
        setToast(`💬 ${msg.senderName}: Yeni bir metin gönderdi`);
        setTimeout(() => setToast(null), 4000);
      },
      onError: (err) => {
        console.warn('WebRTC Event Error:', err);
      },
    });

    webrtcRef.current = service;
    setAutoDownload(service.isAutoDownload());
    service.init(initialRoomCode, targetPeerId);

    return () => {
      service.cleanup();
    };
  }, []);

  const handleSendFiles = async (peerId: string, files: File[]) => {
    if (!webrtcRef.current) return;

    if (peerId === 'ALL') {
      for (const file of files) {
        for (const peer of peers) {
          try {
            await webrtcRef.current.sendFile(peer.id, file);
          } catch (err) {
            console.error('Send error:', err);
          }
        }
      }
    } else {
      for (const file of files) {
        try {
          await webrtcRef.current.sendFile(peerId, file);
        } catch (err) {
          console.error('Send error:', err);
        }
      }
    }
  };

  const handleSendText = (text: string, targetPeerId?: string) => {
    if (!webrtcRef.current) return;
    webrtcRef.current.sendTextMessage(text, targetPeerId);
  };

  const handleJoinRoom = (targetCode: string) => {
    if (!webrtcRef.current) return;
    webrtcRef.current.connectToPeer(targetCode);
  };

  const handleDownload = (blobUrl: string, fileName: string) => {
    if (!webrtcRef.current) return;
    webrtcRef.current.triggerDownload(blobUrl, fileName);
  };

  const handleClearCompleted = () => {
    setTransfers((prev) => prev.filter((t) => t.status !== 'completed'));
  };

  const handleToggleAutoDownload = (val: boolean) => {
    setAutoDownload(val);
    if (webrtcRef.current) {
      webrtcRef.current.setAutoDownload(val);
    }
  };

  const handleUpdateDeviceName = (name: string) => {
    if (webrtcRef.current) {
      webrtcRef.current.updateMyDeviceName(name);
      setMyDevice(webrtcRef.current.getMyDevice());
    }
  };

  const activeTransfersCount = transfers.filter((t) => t.status === 'in-progress').length;

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col font-sans selection:bg-purple-600/30">
      {/* Top Navigation */}
      <Navbar
        roomCode={roomCode}
        connectedCount={peers.length}
        connectionState={connectionState}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center p-1 rounded-2xl glass-panel border border-white/10 shadow-lg">
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
                activeTab === 'radar'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Radar & Aktarım</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Metin / Link</span>
              {messages.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Geçmiş</span>
              {transfers.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                  {transfers.length}
                </span>
              )}
              {activeTransfersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Radar & File Transfer */}
        {activeTab === 'radar' && (
          <div className="flex-1 flex flex-col justify-center animate-fadeIn">
            <RadarView
              myDevice={myDevice}
              peers={peers}
              onSelectPeerForFile={(id) => {
                setSelectedPeerId(id);
                // trigger file picker
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (input) input.click();
              }}
              onSelectPeerForText={(id) => {
                setSelectedPeerId(id);
                setActiveTab('text');
              }}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
            />

            <DropZone
              peers={peers}
              selectedPeerId={selectedPeerId}
              onSelectPeer={(id) => setSelectedPeerId(id)}
              onSendFiles={handleSendFiles}
            />

            {/* Quick Mini Transfer List inside radar tab */}
            {transfers.length > 0 && (
              <div className="mt-4">
                <TransferList
                  transfers={transfers.slice(0, 3)}
                  onDownload={handleDownload}
                  onClearCompleted={handleClearCompleted}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Text / Link Instant Transfer */}
        {activeTab === 'text' && (
          <div className="flex-1 flex flex-col justify-start animate-fadeIn">
            <TextTransfer
              messages={messages}
              peers={peers}
              selectedPeerId={selectedPeerId}
              onSendText={handleSendText}
            />
          </div>
        )}

        {/* Tab 3: Detailed Transfer History & Downloads */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col justify-start animate-fadeIn">
            {transfers.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Henüz bir dosya aktarımı yapılmadı.</p>
              </div>
            ) : (
              <TransferList
                transfers={transfers}
                onDownload={handleDownload}
                onClearCompleted={handleClearCompleted}
              />
            )}
          </div>
        )}

        {/* Quick Feature Badges Footer */}
        <div className="mt-auto pt-8 pb-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Sınırsız Boyut & Hız</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Doğrudan P2P Şifreli</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>iPad, Mobil & Masaüstü Uyumlu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Netlify Hazır</span>
          </div>
        </div>
      </main>

      {/* Toast notification banner */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl glass-panel-glow border border-cyan-500/50 text-xs sm:text-sm font-semibold text-white shadow-2xl flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* Modals */}
      <ConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        roomCode={roomCode}
        myPeerId={myId}
        onJoinRoom={handleJoinRoom}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        myDevice={myDevice}
        autoDownload={autoDownload}
        onToggleAutoDownload={handleToggleAutoDownload}
        onUpdateDeviceName={handleUpdateDeviceName}
      />
    </div>
  );
}

export default App;
