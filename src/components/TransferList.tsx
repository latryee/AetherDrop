import React, { useState } from 'react';
import type { TransferItem } from '../types/transfer';
import { formatBytes, formatEta } from '../services/fileChunker';
import { createZipFromTransfers } from '../services/zip';
import { PreviewModal } from './PreviewModal';
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
  Archive,
  CheckSquare,
  Square,
  Loader2,
  Eye,
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
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState(false);
  const [previewItem, setPreviewItem] = useState<TransferItem | null>(null);

  if (transfers.length === 0) {
    return null;
  }

  const completedItems = transfers.filter((t) => t.status === 'completed' && Boolean(t.blobUrl));
  const completedIncoming = completedItems.filter((t) => t.direction === 'incoming');

  const filteredTransfers = transfers.filter((t) => {
    if (filter === 'incoming') return t.direction === 'incoming';
    if (filter === 'outgoing') return t.direction === 'outgoing';
    return true;
  });

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

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === completedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(completedItems.map((item) => item.id)));
    }
  };

  const handleBatchZipDownload = async (itemsToZip: TransferItem[]) => {
    if (itemsToZip.length === 0 || isZipping) return;
    setIsZipping(true);
    try {
      const zipBlob = await createZipFromTransfers(itemsToZip);
      const zipFileName = `AetherDrop_${new Date().toISOString().slice(0, 10)}_toplu.zip`;

      // Trigger download via octet-stream
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (err) {
      console.error('ZIP creation error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleBatchDownloadSequential = (itemsToDownload: TransferItem[]) => {
    itemsToDownload.forEach((item, index) => {
      setTimeout(() => {
        onDownload(item);
      }, index * 400);
    });
  };

  const selectedItems = completedItems.filter((item) => selectedIds.has(item.id));
  const targetBatchItems = selectedItems.length > 0 ? selectedItems : completedIncoming.length > 0 ? completedIncoming : completedItems;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 animate-fadeIn">
      {/* Header with Title and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Aktarılan Dosyalar</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
              {transfers.length}
            </span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Tüm transferler anlık olarak listelenir; toplu indirebilir veya önizleyebilirsiniz.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/10 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tümü ({transfers.length})
          </button>
          <button
            onClick={() => setFilter('incoming')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filter === 'incoming' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gelenler ({transfers.filter((t) => t.direction === 'incoming').length})
          </button>
          <button
            onClick={() => setFilter('outgoing')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filter === 'outgoing' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gidenler ({transfers.filter((t) => t.direction === 'outgoing').length})
          </button>
        </div>
      </div>

      {/* Batch Action Bar (When 2 or more completed items exist) */}
      {completedItems.length > 0 && (
        <div className="mb-4 p-3 rounded-2xl glass-panel-glow border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {selectedIds.size === completedItems.length ? (
                <CheckSquare className="w-4 h-4 text-purple-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{selectedIds.size > 0 ? `${selectedIds.size} Seçildi` : 'Tümünü Seç'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download as ZIP */}
            <button
              onClick={() => handleBatchZipDownload(targetBatchItems)}
              disabled={isZipping || targetBatchItems.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md active:scale-95 cursor-pointer"
            >
              {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              <span>
                {selectedItems.length > 0
                  ? `Seçilenleri ZIP İndir (${selectedItems.length})`
                  : `Tümünü ZIP İndir (${targetBatchItems.length})`}
              </span>
            </button>

            {/* Download all sequentially */}
            <button
              onClick={() => handleBatchDownloadSequential(targetBatchItems)}
              disabled={targetBatchItems.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 transition-colors active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tek Tek İndir</span>
            </button>

            <button
              onClick={onClearCompleted}
              title="Tamamlananları Listeden Kaldır"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Transfer Items List (Full, Scrollable, No Arbitrary Cutoff) */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filteredTransfers.map((item) => {
          const isIncoming = item.direction === 'incoming';
          const isDone = item.status === 'completed';
          const isFailed = item.status === 'failed';
          const isRunning = item.status === 'in-progress';
          const isSelected = selectedIds.has(item.id);

          return (
            <div
              key={item.id}
              className={`p-3.5 sm:p-4 rounded-2xl glass-panel border transition-all ${
                isSelected ? 'border-purple-500/60 bg-purple-950/20 shadow-lg' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Checkbox (if completed) & Thumbnail/Icon */}
                <div className="flex items-center gap-3 min-w-0">
                  {isDone && (
                    <button
                      onClick={() => handleToggleSelect(item.id)}
                      className="cursor-pointer text-slate-400 hover:text-white"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  )}

                  {/* Thumbnail / Icon with click-to-preview */}
                  <div
                    onClick={() => isDone && item.blobUrl && setPreviewItem(item)}
                    className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-slate-800/80 border border-white/10 overflow-hidden relative group/thumb ${
                      isDone && item.blobUrl ? 'cursor-pointer' : ''
                    }`}
                  >
                    {item.blobUrl && item.fileType.startsWith('image/') ? (
                      <>
                        <img
                          src={item.blobUrl}
                          alt={item.fileName}
                          className="w-full h-full object-cover rounded-xl group-hover/thumb:scale-110 transition-transform"
                        />
                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-4 h-4 text-white" />
                        </span>
                      </>
                    ) : (
                      getFileIcon(item.fileType)
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      onClick={() => isDone && item.blobUrl && setPreviewItem(item)}
                      className={`text-sm font-semibold text-slate-100 truncate ${
                        isDone && item.blobUrl ? 'cursor-pointer hover:text-purple-300 transition-colors' : ''
                      }`}
                      title={item.fileName}
                    >
                      {item.fileName}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">{formatBytes(item.fileSize)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate">
                        {isIncoming ? (
                          <>
                            <Download className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                            <span className="truncate">{item.targetPeerName} cihazından</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3 text-purple-400 flex-shrink-0" />
                            <span className="truncate">{item.targetPeerName} cihazına</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2">
                  {isDone && item.blobUrl && (
                    <div className="flex items-center gap-1.5">
                      {/* Apple Native Share */}
                      {item.blob && typeof navigator !== 'undefined' && 'canShare' in navigator && (
                        <button
                          onClick={() => onShare && onShare(item)}
                          title="iPad Dosyalarına veya Fotoğraflara Kaydet"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md active:scale-95 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Kaydet</span>
                        </button>
                      )}

                      {/* Download */}
                      <button
                        onClick={() => onDownload(item)}
                        title="İndir"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white shadow-md active:scale-95 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>İndir</span>
                      </button>
                    </div>
                  )}

                  {isDone && !item.blobUrl && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Gönderildi
                    </span>
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
                      {formatBytes(item.bytesTransferred)} / {formatBytes(item.fileSize)} ({Math.round(item.progressPercent)}%)
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

      {/* Lightbox Preview Modal */}
      <PreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onDownload={onDownload}
        onShare={(item) => onShare && onShare(item)}
      />
    </div>
  );
};
