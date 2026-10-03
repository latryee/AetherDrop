import React, { useEffect } from 'react';
import type { TransferItem } from '../types/transfer';
import { X, Download, Share2, FileText, File } from 'lucide-react';
import { formatBytes } from '../services/fileChunker';

interface PreviewModalProps {
  item: TransferItem | null;
  onClose: () => void;
  onDownload: (item: TransferItem) => void;
  onShare: (item: TransferItem) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  item,
  onClose,
  onDownload,
  onShare,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item || !item.blobUrl) return null;

  const isImage = item.fileType.startsWith('image/');
  const isVideo = item.fileType.startsWith('video/');
  const isAudio = item.fileType.startsWith('audio/');
  const isText = item.fileType.startsWith('text/') || item.fileName.endsWith('.txt') || item.fileName.endsWith('.md');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl glass-panel-glow border border-purple-500/30 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="min-w-0 pr-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate" title={item.fileName}>
              {item.fileName}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {formatBytes(item.fileSize)} • {item.fileType || 'Dosya'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {item.blob && typeof navigator !== 'undefined' && 'canShare' in navigator && (
              <button
                onClick={() => onShare(item)}
                title="Paylaş / Fotoğraflara veya Dosyalara Kaydet"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kaydet / Paylaş</span>
              </button>
            )}

            <button
              onClick={() => onDownload(item)}
              title="İndirilenlere Kaydet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>İndir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Preview Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center min-h-[250px] bg-slate-950/60">
          {isImage ? (
            <img
              src={item.blobUrl}
              alt={item.fileName}
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-2xl shadow-lg border border-white/10"
            />
          ) : isVideo ? (
            <video
              src={item.blobUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[65vh] w-auto max-w-full rounded-2xl shadow-lg border border-white/10"
            />
          ) : isAudio ? (
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-white/10 text-center flex flex-col items-center">
              <audio src={item.blobUrl} controls className="w-full mt-2" />
            </div>
          ) : isText ? (
            <div className="w-full max-h-[60vh] p-4 rounded-2xl bg-slate-900/90 border border-white/10 overflow-auto font-mono text-xs text-slate-200 whitespace-pre-wrap">
              <FileText className="w-6 h-6 text-cyan-400 mb-2" />
              Metin önizlemesi hazır.
            </div>
          ) : (
            <div className="text-center py-10">
              <File className="w-16 h-16 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">Bu dosya türü için canlı önizleme yok.</p>
              <p className="text-xs text-slate-500 mt-1">Dosyayı cihazınıza kaydederek açabilirsiniz.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
