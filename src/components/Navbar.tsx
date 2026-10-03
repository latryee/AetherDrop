import React, { useState } from 'react';
import { QrCode, Volume2, VolumeX, Settings, Copy, Check, ShieldCheck, Loader2 } from 'lucide-react';
import { soundEffects } from '../services/audio';
import type { ConnectionState } from '../services/webrtc';
import { Logo } from './Logo';

interface NavbarProps {
  roomCode: string;
  connectedCount: number;
  connectionState?: ConnectionState;
  onOpenConnectModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  connectedCount,
  connectionState = 'connected',
  onOpenConnectModal,
  onOpenSettingsModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(() => soundEffects.isEnabled());

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    soundEffects.setEnabled(next);
    setSoundOn(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 sm:px-6 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <Logo size="md" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                AetherDrop
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-300">
                PRO P2P
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Doğrudan Cihazlar Arası Güvenli Aktarım
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Room Code Badge */}
          {roomCode && (
            <button
              onClick={handleCopyCode}
              title="Oda kodunu kopyalamak için tıkla"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-slate-400 font-mono text-[11px]">ODA:</span>
              <span className="font-mono font-bold tracking-wider text-purple-300">
                {roomCode}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          )}

          {/* Connection status indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
            {connectionState === 'connecting' ? (
              <>
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-amber-200">Ağ Başlatılıyor...</span>
              </>
            ) : connectionState === 'error' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-rose-300">Bağlantı Hatası</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">
                  {connectedCount > 0 ? `${connectedCount} Cihaz Bağlı` : 'Hazır (P2P Aktif)'}
                </span>
              </>
            )}
          </div>

          {/* QR Code Connect Modal Button */}
          <button
            onClick={onOpenConnectModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/30 text-xs font-medium text-white shadow-md shadow-purple-900/30 transition-all active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Cihaz Bağla / QR</span>
            <span className="sm:hidden">Bağlan</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Ses efektlerini kapat' : 'Ses efektlerini aç'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all active:scale-95 cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-purple-300" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            title="Ayarlar"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all active:scale-95 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
