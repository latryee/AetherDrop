import React from 'react';
import type { DeviceInfo } from '../types/transfer';
import { DeviceIcon } from './DeviceIcon';
import { Send, MessageSquare, QrCode } from 'lucide-react';
import { Logo } from './Logo';

interface RadarViewProps {
  myDevice: DeviceInfo | null;
  peers: DeviceInfo[];
  onSelectPeerForFile: (peerId: string) => void;
  onSelectPeerForText: (peerId: string) => void;
  onOpenConnectModal: () => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  myDevice,
  peers,
  onSelectPeerForFile,
  onSelectPeerForText,
  onOpenConnectModal,
}) => {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 flex flex-col items-center justify-center overflow-hidden">
      {/* Outer ambient glow */}
      <div className="absolute w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Radar Container with Concentric Circles */}
      <div className="relative w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] flex items-center justify-center">
        {/* Concentric rings */}
        <div className="absolute w-full h-full rounded-full border border-purple-500/10 pointer-events-none" />
        <div className="absolute w-[75%] h-[75%] rounded-full border border-purple-500/15 pointer-events-none" />
        <div className="absolute w-[50%] h-[50%] rounded-full border border-cyan-500/20 pointer-events-none" />
        <div className="absolute w-[25%] h-[25%] rounded-full border border-purple-500/25 pointer-events-none" />

        {/* Dynamic Pulse Waves */}
        <div className="absolute w-24 h-24 rounded-full border border-purple-500/30 animate-radar-wave-1 pointer-events-none" />
        <div className="absolute w-24 h-24 rounded-full border border-cyan-500/30 animate-radar-wave-2 pointer-events-none" />
        <div className="absolute w-24 h-24 rounded-full border border-indigo-500/20 animate-radar-wave-3 pointer-events-none" />

        {/* Center Node: Local Device (ME) */}
        <div className="relative z-10 flex flex-col items-center group">
          <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-900/90 border-2 border-purple-500/50 shadow-xl shadow-purple-500/20 backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-purple-500/10 to-cyan-500/10 pointer-events-none" />
            {myDevice && <DeviceIcon type={myDevice.type} className="w-9 h-9 sm:w-10 sm:h-10" />}

            {/* Online Badge */}
            <span className="absolute bottom-0 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>

          <div className="mt-2 text-center">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
              Bu Cihaz (Siz)
            </span>
            <p className="text-sm font-medium text-slate-200 mt-1 truncate max-w-[140px]">
              {myDevice?.name || 'Cihazım'}
            </p>
            <p className="text-[11px] text-slate-400">
              {myDevice?.os} • {myDevice?.browser}
            </p>
          </div>
        </div>

        {/* Connected Peer Nodes in Orbit */}
        {peers.map((peer, idx) => {
          // Calculate orbital positions evenly around the center
          const angle = (idx * (360 / Math.max(1, peers.length)) - 90) * (Math.PI / 180);
          const radius = window.innerWidth < 640 ? 115 : 160;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={peer.id}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              className="absolute z-20 flex flex-col items-center group transition-all duration-300"
            >
              <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/90 border-2 border-cyan-500/60 shadow-xl shadow-cyan-500/25 backdrop-blur-md cursor-pointer transition-transform duration-300 group-hover:scale-110">
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 pointer-events-none" />
                <DeviceIcon type={peer.type} className="w-7 h-7 sm:w-8 sm:h-8" />

                {/* Status beacon */}
                <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border-2 border-slate-900"></span>
                </span>
              </div>

              {/* Peer Card Info */}
              <div className="mt-1.5 flex flex-col items-center text-center">
                <span className="text-xs font-semibold text-slate-100 max-w-[120px] truncate px-2 py-0.5 rounded-md bg-slate-900/80 border border-white/10">
                  {peer.name}
                </span>
                <span className="text-[10px] text-cyan-300 font-mono mt-0.5">
                  {peer.os}
                </span>

                {/* Quick Action buttons */}
                <div className="flex items-center gap-1.5 mt-2 opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onSelectPeerForFile(peer.id)}
                    title="Dosya Gönder"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-[11px] font-medium text-white shadow-md active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Gönder</span>
                  </button>
                  <button
                    onClick={() => onSelectPeerForText(peer.id)}
                    title="Metin / Not Gönder"
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State / Help guide when no peers are connected */}
      {peers.length === 0 && (
        <div className="mt-8 text-center max-w-md px-6 py-6 rounded-3xl glass-panel-glow border border-purple-500/30 flex flex-col items-center">
          <Logo size="md" className="mb-3" />
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-200 mb-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Cihaz Eşleşmesi Bekleniyor</span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed max-w-xs">
            iPad veya telefonunuzun kamerasıyla QR kodu okutun. Cihazlar doğrudan birbirine bağlanacak ve dosya gönderebileceksiniz.
          </p>

          <button
            onClick={onOpenConnectModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-xs font-bold text-white shadow-xl shadow-purple-900/40 transition-all active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Kodu Aç & Bağlan</span>
          </button>
        </div>
      )}
    </div>
  );
};
