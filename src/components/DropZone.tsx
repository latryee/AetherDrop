import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, Smartphone, Users } from 'lucide-react';
import type { DeviceInfo } from '../types/transfer';
import { Logo } from './Logo';

interface DropZoneProps {
  peers: DeviceInfo[];
  selectedPeerId: string;
  onSelectPeer: (peerId: string) => void;
  onSendFiles: (peerId: string, files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  peers,
  selectedPeerId,
  onSelectPeer,
  onSendFiles,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      dispatchFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      dispatchFiles(files);
      e.target.value = ''; // Reset input for repeated selections
    }
  };

  const dispatchFiles = (files: File[]) => {
    if (peers.length === 0) {
      alert('Dosya göndermek için önce en az bir cihaz bağlamalısınız. Sağ üstteki "Cihaz Bağla / QR" butonunu kullanın.');
      return;
    }

    const targetId = selectedPeerId || peers[0]?.id;
    if (targetId) {
      onSendFiles(targetId, files);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4">
      {/* Target Device Selector when peers exist */}
      {peers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>Hedef Cihaz:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {peers.map((peer) => (
              <button
                key={peer.id}
                onClick={() => onSelectPeer(peer.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                  selectedPeerId === peer.id || (peers.length === 1 && (!selectedPeerId || selectedPeerId === peer.id))
                    ? 'bg-purple-600/80 text-white border border-purple-400/40 shadow-sm shadow-purple-900/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>{peer.name}</span>
              </button>
            ))}

            {peers.length > 1 && (
              <button
                onClick={() => onSelectPeer('ALL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                  selectedPeerId === 'ALL'
                    ? 'bg-cyan-600/80 text-white border border-cyan-400/40'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-cyan-300" />
                <span>Tümüne Gönder</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Drag-and-Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 shadow-2xl shadow-cyan-500/20 scale-[1.01]'
            : 'border-white/15 hover:border-purple-500/40 glass-panel hover:bg-slate-900/70 shadow-lg'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
          <Logo size="lg" />
          <span className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-purple-600/90 border border-white/20 text-white shadow-lg">
            <UploadCloud className="w-4 h-4 text-cyan-200" />
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1">
          {isDragOver ? 'Dosyaları Şimdi Bırakın!' : 'Dosyaları Buraya Sürükleyin veya Seçin'}
        </h3>

        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-4">
          iPad fotoğrafları, videolar, belgeler veya arşivler. Boyut sınırı yok, doğrudan cihazınıza aktarılır.
        </p>

        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-cyan-600 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition-all active:scale-95">
          <FileUp className="w-4 h-4" />
          <span>Cihazdan Dosya Seç</span>
        </div>
      </div>
    </div>
  );
};
