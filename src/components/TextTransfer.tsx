import React, { useState } from 'react';
import type { TextMessageItem, DeviceInfo } from '../types/transfer';
import { Send, Copy, Check, ExternalLink, MessageSquare, Clipboard } from 'lucide-react';

interface TextTransferProps {
  messages: TextMessageItem[];
  peers: DeviceInfo[];
  selectedPeerId: string;
  onSendText: (text: string, targetPeerId?: string) => void;
}

export const TextTransfer: React.FC<TextTransferProps> = ({
  messages,
  peers,
  selectedPeerId,
  onSendText,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (peers.length === 0) {
      alert('Metin göndermek için önce en az bir cihaza bağlanmalısınız.');
      return;
    }

    onSendText(inputText.trim(), selectedPeerId || undefined);
    setInputText('');
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
      }
    } catch {
      // Browser permission prompt or unsupported
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isUrl = (text: string) => {
    try {
      return text.startsWith('http://') || text.startsWith('https://');
    } catch {
      return false;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4">
      <div className="p-5 rounded-3xl glass-panel border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-slate-200">
              Hızlı Metin & Bağlantı Paylaşımı
            </h4>
          </div>

          <button
            type="button"
            onClick={handlePasteClipboard}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-slate-300 transition-colors cursor-pointer"
          >
            <Clipboard className="w-3.5 h-3.5 text-purple-300" />
            <span>Panodan Yapıştır</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="space-y-3">
          <div className="relative">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="iPad veya bilgisayarınıza bir web linki, not ya da metin gönderin..."
              className="w-full p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 resize-none transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-md shadow-purple-900/30 transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gönder</span>
            </button>
          </div>
        </form>

        {/* Message Log */}
        {messages.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-2xl text-xs flex items-start justify-between gap-3 ${
                  msg.isSelf
                    ? 'bg-purple-950/20 border border-purple-500/20'
                    : 'bg-cyan-950/20 border border-cyan-500/20'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-semibold ${
                        msg.isSelf ? 'text-purple-300' : 'text-cyan-300'
                      }`}
                    >
                      {msg.isSelf ? 'Siz' : msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-slate-200 break-words whitespace-pre-wrap selection:bg-purple-600/40">
                    {msg.text}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {isUrl(msg.text) && (
                    <a
                      href={msg.text}
                      target="_blank"
                      rel="noreferrer"
                      title="Tarayıcıda Aç"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    </a>
                  )}

                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    title="Kopyala"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
