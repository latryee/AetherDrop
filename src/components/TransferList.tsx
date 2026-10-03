import React from 'react';
import type { TransferItem } from '../types/transfer';
import { formatBytes, formatEta } from '../services/fileChunker';
import {
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  File,
  Trash2,
  Share2,
} from 'lucide-react';

interface TransferListProps {
  transfers: TransferItem[];
  onDownload: (item: TransferItem) => void;
  onShare?: (item: TransferItem) => void;
  onClearCompleted: () => void;
}

export const TransferList: React.FC<TransferListProps> = ({
  transfers,
  onDownload,
  onShare,
  onClearCompleted,
}) => {
  if (transfers.length === 0) {
    return null;
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="w-5 h-5 text-cyan-400" />;
    if (fileType.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-400" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-emerald-400" />;
    if (fileType.includes('zip') || fileType.includes('tar') || fileType.includes('rar'))
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    if (fileType.includes('pdf') || fileType.includes('text') || fileType.includes('document'))
      return <FileText className="w-5 h-5 text-blue-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const hasCompleted = transfers.some((t) => t.status === 'completed');

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <span>Dosya Aktarımları</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
            {transfers.length}
          </span>
        </h4>

        {hasCompleted && (
          <button
            onClick={onClearCompleted}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tamamlananları Temizle</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {transfers.map((item) => {
          const isIncoming = item.direction === 'incoming';
          const isDone = item.status === 'completed';
          const isFailed = item.status === 'failed';
          const isRunning = item.status === 'in-progress';

          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl glass-panel border border-white/10 transition-all hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left side: Icon & File info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-slate-800/80 border border-white/10">
                    {item.blobUrl && item.fileType.startsWith('image/') ? (
                      <img
                        src={item.blobUrl}
                        alt={item.fileName}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      getFileIcon(item.fileType)
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate" title={item.fileName}>
                      {item.fileName}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatBytes(item.fileSize)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {isIncoming ? (
                          <>
                            <Download className="w-3 h-3 text-cyan-400" />
                            <span>{item.targetPeerName} cihazından</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3 text-purple-400" />
                            <span>{item.targetPeerName} cihazına</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Status / Action button */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {isDone && (
                    <div className="flex items-center gap-1.5">
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tamamlandı
                      </span>

                      {item.blobUrl && (
                        <div className="flex items-center gap-1.5">
                          {/* Apple / Mobile native share button (Saves directly to Photos or Files) */}
                          {item.blob && typeof navigator !== 'undefined' && 'canShare' in navigator && (
                            <button
                              onClick={() => onShare && onShare(item)}
                              title="iPad Dosyalarına veya Fotoğraflara Kaydet"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md active:scale-95 cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Kaydet / Paylaş</span>
                            </button>
                          )}

                          {/* Force direct file download (prevents Safari preview on screen) */}
                          <button
                            onClick={() => onDownload(item)}
                            title="İndirilenlere Kaydet"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white shadow-md active:scale-95 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>İndir</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {isFailed && (
                    <span className="flex items-center gap-1 text-xs text-rose-400 font-medium px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Başarısız
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar & Live Transfer Speed */}
              {isRunning && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                    <span>
                      {formatBytes(item.bytesTransferred)} / {formatBytes(item.fileSize)} (
                      {Math.round(item.progressPercent)}%)
                    </span>
                    <span>
                      {item.speedBytesPerSec > 0 && `${formatBytes(item.speedBytesPerSec)}/s`}
                      {item.etaSeconds > 0 && ` • Kalan: ${formatEta(item.etaSeconds)}`}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-200"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
