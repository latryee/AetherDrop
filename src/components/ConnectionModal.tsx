import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ArrowRight, Share2, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  myPeerId: string;
  onJoinRoom: (targetCode: string) => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  myPeerId,
  onJoinRoom,
}) => {
  const [joinInput, setJoinInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const shareUrl = `${currentUrl}#room=${roomCode}&peer=${encodeURIComponent(myPeerId)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinInput.trim()) {
      onJoinRoom(joinInput.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl glass-panel-glow border border-purple-500/30 p-6 sm:p-7 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Logo */}
        <div className="flex flex-col items-center text-center mb-5">
          <Logo size="md" className="mb-2" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1 Saniyede Eşleşme</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100">Cihazınızı Bağlayın</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            iPad veya telefonunuzun kamerasıyla QR kodu tarayın, anında bağlanıp dosya gönderebilirsiniz.
          </p>
        </div>

        {/* QR Code Container with Center Logo */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white mb-5 shadow-2xl">
          <QRCodeSVG
            value={shareUrl}
            size={180}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: '/favicon.svg',
              x: undefined,
              y: undefined,
              height: 38,
              width: 38,
              excavate: true,
            }}
          />
          <span className="text-[11px] text-slate-700 font-semibold mt-2.5 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-purple-600" />
            iPad / Telefon Kamerasıyla Okutun
          </span>
        </div>

        {/* 6-Digit PIN Display & Copy */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Oda PIN Kodu
            </span>
            <span className="text-lg font-mono font-bold tracking-widest text-purple-300">
              {roomCode}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Kopyalandı' : 'PIN Kopyala'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              title="Davet Bağlantısını Kopyala"
              className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Join Other Room Form */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-xs font-semibold text-slate-300 mb-2">Başka Bir Cihazın Odasına Katıl:</p>
          <form onSubmit={handleJoinSubmit} className="flex gap-2">
            <input
              type="text"
              maxLength={12}
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              placeholder="Örn: 8K2M19"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono uppercase tracking-wider text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
            />
            <button
              type="submit"
              disabled={!joinInput.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <span>Bağlan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Step-by-step guidance */}
        <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span>1. iPad veya telefonunuzla QR kodu tarayın.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span>2. Sayfa açıldığında cihazlar otomatik eşleşir.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span>3. Dosyaları sürükleyin veya seçin; anında aktarılır!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
