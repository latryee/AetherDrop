import React, { useState } from 'react';
import { X, Check, Volume2, Download, Smartphone, Shield, Zap } from 'lucide-react';
import type { DeviceInfo } from '../types/transfer';
import { soundEffects } from '../services/audio';
import { saveStoredDeviceName } from '../services/device';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  myDevice: DeviceInfo | null;
  autoDownload: boolean;
  onToggleAutoDownload: (val: boolean) => void;
  onUpdateDeviceName: (name: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  myDevice,
  autoDownload,
  onToggleAutoDownload,
  onUpdateDeviceName,
}) => {
  const [name, setName] = useState(myDevice?.name || '');
  const [savedNameSuccess, setSavedNameSuccess] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundEffects.isEnabled());

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      saveStoredDeviceName(name.trim());
      onUpdateDeviceName(name.trim());
      setSavedNameSuccess(true);
      setTimeout(() => setSavedNameSuccess(false), 2000);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundEffects.setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      soundEffects.playConnectSound();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl glass-panel-glow border border-purple-500/30 p-6 sm:p-7 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-100 mb-5 flex items-center gap-2">
          <span>Ayarlar & Tercihler</span>
        </h3>

        {/* Device Name Form */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span>Cihaz İsmi</span>
          </label>
          <form onSubmit={handleSaveName} className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Mehmet'in iPad'i"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              {savedNameSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
              <span>{savedNameSuccess ? 'Kaydedildi' : 'Kaydet'}</span>
            </button>
          </form>
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-2 border-t border-white/10">
          {/* Auto Download */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/50 border border-white/5">
            <div className="flex items-start gap-3">
              <Download className="w-4 h-4 text-cyan-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Otomatik İndirme</p>
                <p className="text-[11px] text-slate-400">
                  Gelen dosyaları sormadan İndirilenler klasörüne kaydet
                </p>
              </div>
            </div>
            <button
              onClick={() => onToggleAutoDownload(!autoDownload)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                autoDownload ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  autoDownload ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Sound FX */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/50 border border-white/5">
            <div className="flex items-start gap-3">
              <Volume2 className="w-4 h-4 text-purple-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Ses Efektleri</p>
                <p className="text-[11px] text-slate-400">
                  Bağlantı ve aktarım tamamlama sesli bildirimleri
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                soundEnabled ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  soundEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Diagnostic info */}
        <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              Şifreleme:
            </span>
            <span className="text-slate-400">WebRTC DTLS-SRTP (Uçtan Uca)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Aktarım Protokolü:
            </span>
            <span className="text-slate-400">P2P Doğrudan Veri Kanalı</span>
          </div>
        </div>
      </div>
    </div>
  );
};
