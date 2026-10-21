import React, { useState } from 'react';
import {
  ListPlus,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { BatchItem, ExtractedGame } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { getProxiedImageUrl } from '../utils/imageUtils';

interface BatchExtractorProps {
  onSelectGame?: (game: ExtractedGame) => void;
  onSaveToHistory?: (game: ExtractedGame) => void;
}

export const BatchExtractor: React.FC<BatchExtractorProps> = ({
  onSelectGame,
  onSaveToHistory,
}) => {
  const [inputUrls, setInputUrls] = useState<string>(
    'https://samandev.itch.io/tamaweb\nhttps://nopanamaman.itch.io/z-a-t-o-i-love-the-world-and-everything-in-it\nhttps://funday-games.itch.io/booster-pack-heroes'
  );
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedBatch, setCopiedBatch] = useState(false);

  const handleStartBatch = async () => {
    const rawLines = inputUrls
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l.includes('itch.io'));

    if (rawLines.length === 0) return;

    const initialBatch: BatchItem[] = rawLines.map((url) => ({
      url,
      status: 'pending',
    }));

    setItems(initialBatch);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/extract-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: rawLines }),
      });

      const json = await res.json();
      if (json.results && Array.isArray(json.results)) {
        const updated: BatchItem[] = json.results.map((r: any) => {
          if (r.success && r.data) {
            if (onSaveToHistory) onSaveToHistory(r.data);
            return {
              url: r.url,
              status: 'success',
              data: r.data,
            };
          } else {
            return {
              url: r.url,
              status: 'error',
              error: r.error || 'Failed to extract',
            };
          }
        });
        setItems(updated);
      }
    } catch (err: any) {
      console.error('Batch error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const allSuccessfulFiles = items.flatMap((item) =>
    item.data ? item.data.files.map((f) => ({ file: f, game: item.data! })) : []
  );

  const handleCopyAllLinks = async () => {
    const links = allSuccessfulFiles.map(({ file, game }) => {
      const url = file.uploadId
        ? `${window.location.origin}/api/download?gameUrl=${encodeURIComponent(game.canonicalUrl)}&uploadId=${file.uploadId}`
        : file.directUrl || '';
      return `${game.title} - ${file.filename}: ${url}`;
    });

    await navigator.clipboard.writeText(links.join('\n'));
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  const handleDownloadBatchSequentially = () => {
    allSuccessfulFiles.forEach(({ file, game }, idx) => {
      setTimeout(() => {
        const downloadUrl = file.uploadId
          ? `/api/download?gameUrl=${encodeURIComponent(game.canonicalUrl)}&uploadId=${file.uploadId}`
          : file.directUrl || '';
        if (downloadUrl) {
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = file.filename;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }, idx * 1200);
    });
  };

  return (
    <div className="space-y-6">
      {/* Input panel */}
      <div className="rounded-2xl neu-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg neu-inset text-[#fa5c5c]">
              <ListPlus className="w-4 h-4" />
            </span>
            <h2 className="text-base font-semibold text-zinc-100">
              Batch URL Extractor
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Paste one itch.io link per line (up to 10)
          </span>
        </div>

        <textarea
          rows={4}
          value={inputUrls}
          onChange={(e) => setInputUrls(e.target.value)}
          placeholder="https://creator.itch.io/game-one&#10;https://another.itch.io/game-two"
          className="w-full rounded-xl neu-inset p-3.5 text-xs sm:text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#fa5c5c]/50 resize-y"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span>
              {inputUrls.split('\n').filter((l) => l.trim().length > 0).length} URLs entered
            </span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setItems([])}
                className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300 ml-2 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartBatch}
            disabled={isProcessing || !inputUrls.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white neu-btn-accent disabled:opacity-50 transition cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting Batch...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Extract All Links</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Header / Stats */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl neu-card">
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-zinc-300 font-semibold">
              Batch Summary:
            </span>
            <span className="text-emerald-400 flex items-center gap-1 tabular-nums">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {items.filter((i) => i.status === 'success').length} Success
            </span>
            {items.some((i) => i.status === 'error') && (
              <span className="text-rose-400 flex items-center gap-1 tabular-nums">
                <AlertCircle className="w-3.5 h-3.5" />
                {items.filter((i) => i.status === 'error').length} Failed
              </span>
            )}
            <span className="text-zinc-400">
              Total files found: <strong className="text-zinc-200 tabular-nums">{allSuccessfulFiles.length}</strong>
            </span>
          </div>

          {allSuccessfulFiles.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAllLinks}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg neu-button text-xs text-zinc-200 transition cursor-pointer"
              >
                {copiedBatch ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy All Links</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadBatchSequentially}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg neu-btn-accent text-xs font-semibold text-white transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Batch Cards */}
      <div className="space-y-4">
        {items.map((item, idx) => {
          const game = item.data;

          return (
            <div
              key={idx}
              className="rounded-xl neu-card p-4 sm:p-5 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-3 min-w-0">
                  {game?.coverImage ? (
                    <img
                      src={getProxiedImageUrl(game.coverImage)}
                      alt={game.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-12 h-10 object-cover rounded-md neu-inset shrink-0 bg-black"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.includes('/api/image-proxy')) {
                          target.src = game.coverImage || '';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-12 h-10 rounded-md neu-inset flex items-center justify-center text-[10px] font-mono text-zinc-500 shrink-0">
                      ITCH
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-100 truncate">
                      {game ? game.title : item.url}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate font-mono">
                      {item.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'success' && game && (
                    <>
                      {onSelectGame && (
                        <button
                          type="button"
                          onClick={() => onSelectGame(game)}
                          className="px-2.5 py-1 text-xs rounded-lg neu-button text-zinc-300 transition cursor-pointer"
                        >
                          View Details
                        </button>
                      )}
                      <span className="text-xs font-mono text-emerald-400 tabular-nums">
                        {game.files.length} file{game.files.length === 1 ? '' : 's'}
                      </span>
                    </>
                  )}

                  {item.status === 'error' && (
                    <span className="text-xs font-mono text-rose-400">
                      {item.error || 'Failed'}
                    </span>
                  )}

                  {item.status === 'pending' && (
                    <span className="text-xs font-mono text-zinc-500">
                      Queued...
                    </span>
                  )}
                </div>
              </div>

              {/* Files in this batch item */}
              {game && game.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {game.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg neu-inset text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-semibold text-zinc-200 truncate">
                          {file.filename}
                        </span>
                        {file.filesize && (
                          <span className="shrink-0 font-mono text-zinc-400 tabular-nums">
                            {file.filesize}
                          </span>
                        )}
                        {file.platforms.map((p) => (
                          <PlatformBadge key={p} platform={p} size="sm" />
                        ))}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={
                            file.uploadId
                              ? `/api/download?gameUrl=${encodeURIComponent(game.canonicalUrl)}&uploadId=${file.uploadId}`
                              : file.directUrl || '#'
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md neu-btn-accent text-white font-medium text-[11px] transition"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
