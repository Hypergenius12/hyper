import React, { useState, useEffect, useMemo } from 'react';
import {
  Link2,
  ClipboardPaste,
  X,
  Search,
  ExternalLink,
  Download,
  Terminal,
  Star,
  AlertTriangle,
  RefreshCw,
  FolderDown,
  Share2,
  ChevronDown,
  ChevronUp,
  Compass,
  MessageSquare,
  Maximize2,
  ImageIcon,
  ThumbsUp,
  Filter,
} from 'lucide-react';
import { ExtractedGame, ExamplePreset, ItchFile, ItchComment } from '../types';
import { FileCard } from './FileCard';
import { PlatformBadge } from './PlatformBadge';
import { ExportModal } from './ExportModal';
import { ScreenshotModal } from './ScreenshotModal';
import { getProxiedImageUrl } from '../utils/imageUtils';

interface SingleInspectorProps {
  initialGame?: ExtractedGame | null;
  initialUrl?: string | null;
  onSaveToHistory?: (game: ExtractedGame) => void;
  onNavigateToBrowse?: () => void;
}

export const SingleInspector: React.FC<SingleInspectorProps> = ({
  initialGame,
  initialUrl,
  onSaveToHistory,
  onNavigateToBrowse,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<ExtractedGame | null>(initialGame || null);
  const [examples, setExamples] = useState<ExamplePreset[]>([]);

  // Selected files for batch download/export
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [fileSearchTerm, setFileSearchTerm] = useState<string>('');
  const [fileExtensionFilter, setFileExtensionFilter] = useState<string>('all');

  // Fullscreen Screenshot Modal
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState<number | null>(null);

  // Tabs / Collapsibles
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [commentSearchTerm, setCommentSearchTerm] = useState('');
  const [commentFilter, setCommentFilter] = useState<'all' | 'top'>('all');

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [downloadQueueProgress, setDownloadQueueProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Deduplicate screenshots cleanly across both URLs and base64 hashes
  const screenshots = useMemo(() => {
    if (!game?.screenshots) return [];
    const seen = new Set<string>();
    const list: string[] = [];
    for (const s of game.screenshots) {
      if (!s) continue;
      const key = s.includes('img.itch.zone/') ? s.split('/')[4] : s;
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(s);
      }
    }
    return list;
  }, [game?.screenshots]);

  // Update game if initialGame changes
  useEffect(() => {
    if (initialGame) {
      setGame(initialGame);
      setUrlInput(initialGame.canonicalUrl || initialGame.url);
      setSelectedFileIds(initialGame.files.map((f) => f.id));
    } else if (initialUrl) {
      setUrlInput(initialUrl);
      triggerExtract(initialUrl);
    }
  }, [initialGame, initialUrl]);

  // Load example presets
  useEffect(() => {
    fetch('/api/examples')
      .then((r) => r.json())
      .then((data) => setExamples(data))
      .catch((e) => console.error('Failed to load examples', e));
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
        triggerExtract(text.trim());
      }
    } catch {
      // Fallback
    }
  };

  const triggerExtract = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    setLoadingStep('Connecting to itch.io manifest...');

    try {
      setTimeout(() => setLoadingStep('Extracting files and bypassing purchase prompt...'), 500);
      setTimeout(() => setLoadingStep('Resolving signed storage endpoints and comments...'), 1200);

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract itch.io downloads');
      }

      setGame(data);
      setSelectedFileIds(data.files.map((f: ItchFile) => f.id));
      if (onSaveToHistory) {
        onSaveToHistory(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve download links');
      setGame(null);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerExtract(urlInput);
  };

  const handleToggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiles = () => {
    if (!game) return;
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map((f) => f.id));
    }
  };

  // Filter files by platform, extension, and search query
  const filteredFiles = useMemo(() => {
    if (!game) return [];
    return game.files.filter((f) => {
      // Platform filter
      if (platformFilter !== 'all') {
        const matchesPlat = f.platforms.some((p) =>
          p.toLowerCase().includes(platformFilter.toLowerCase())
        );
        if (!matchesPlat) return false;
      }

      // Extension filter
      if (fileExtensionFilter !== 'all') {
        const lowerName = f.filename.toLowerCase();
        if (fileExtensionFilter === 'zip' && !lowerName.endsWith('.zip')) return false;
        if (fileExtensionFilter === 'exe' && !lowerName.endsWith('.exe')) return false;
        if (fileExtensionFilter === 'dmg' && !lowerName.endsWith('.dmg') && !lowerName.endsWith('.pkg')) return false;
        if (fileExtensionFilter === 'apk' && !lowerName.endsWith('.apk')) return false;
        if (
          fileExtensionFilter === 'linux' &&
          !lowerName.endsWith('.tar.gz') &&
          !lowerName.endsWith('.deb') &&
          !lowerName.endsWith('.rpm') &&
          !lowerName.endsWith('.appimage') &&
          !lowerName.endsWith('.sh')
        )
          return false;
        if (
          fileExtensionFilter === 'audio' &&
          !lowerName.endsWith('.mp3') &&
          !lowerName.endsWith('.wav') &&
          !lowerName.endsWith('.flac') &&
          !lowerName.endsWith('.ogg')
        )
          return false;
      }

      // Keyword Search
      if (fileSearchTerm.trim()) {
        const term = fileSearchTerm.toLowerCase().trim();
        const matchesName = f.filename.toLowerCase().includes(term);
        const matchesPlat = f.platforms.some((p) => p.toLowerCase().includes(term));
        const matchesSize = f.filesize.toLowerCase().includes(term);
        if (!matchesName && !matchesPlat && !matchesSize) return false;
      }

      return true;
    });
  }, [game, platformFilter, fileExtensionFilter, fileSearchTerm]);

  // Filtered comments
  const filteredComments = useMemo(() => {
    if (!game?.comments) return [];
    let list = [...game.comments];

    if (commentFilter === 'top') {
      list = list.filter((c) => c.votes && !c.votes.includes('-'));
    }

    if (commentSearchTerm.trim()) {
      const term = commentSearchTerm.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.author.name.toLowerCase().includes(term) ||
          c.body.toLowerCase().includes(term)
      );
    }

    return list;
  }, [game?.comments, commentFilter, commentSearchTerm]);

  // Sequential download trigger
  const handleDownloadSelectedFiles = () => {
    if (!game) return;
    const filesToDownload = game.files.filter((f) => selectedFileIds.includes(f.id));
    if (filesToDownload.length === 0) return;

    setDownloadQueueProgress({ current: 0, total: filesToDownload.length });

    filesToDownload.forEach((file, index) => {
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

        setDownloadQueueProgress({ current: index + 1, total: filesToDownload.length });
        if (index === filesToDownload.length - 1) {
          setTimeout(() => setDownloadQueueProgress(null), 2000);
        }
      }, index * 1200);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & URL Input Hero */}
      <div className="rounded-2xl neu-card p-5 sm:p-7">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-center space-y-1.5 mb-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Paste itch.io Link
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Extract direct signed file download links, sizes, and platform builds without going to itch.io
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3.5 text-zinc-500 pointer-events-none">
                <Link2 className="w-4 h-4" />
              </span>

              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://creator.itch.io/game-title"
                className="w-full pl-10 pr-24 py-3 rounded-xl neu-inset text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#fa5c5c]/40 transition"
              />

              <div className="absolute right-2 flex items-center gap-1">
                {urlInput && (
                  <button
                    type="button"
                    onClick={() => setUrlInput('')}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono neu-button text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                  title="Paste from clipboard and extract"
                >
                  <ClipboardPaste className="w-3 h-3 text-[#fa5c5c]" />
                  <span>Paste</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white neu-btn-accent disabled:opacity-50 transition cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Get Downloads</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Examples */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-zinc-500 font-mono text-[11px]">Quick Test:</span>
            {examples.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUrlInput(ex.url);
                  triggerExtract(ex.url);
                }}
                className="px-2.5 py-1 rounded-lg neu-button text-zinc-300 hover:text-zinc-100 transition cursor-pointer font-mono text-[11px] truncate max-w-[200px]"
                title={ex.url}
              >
                {ex.title.split('(')[0].trim()}
              </button>
            ))}
          </div>

          {onNavigateToBrowse && !game && !isLoading && (
            <div className="pt-4 mt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl neu-inset">
              <div className="text-left text-xs">
                <span className="text-zinc-200 font-semibold block">
                  Don't have an itch.io link ready?
                </span>
                <span className="text-zinc-400">
                  Browse and search thousands of free games, assets, and tools directly in the catalog.
                </span>
              </div>
              <button
                type="button"
                onClick={onNavigateToBrowse}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg neu-button text-xs font-semibold text-zinc-200 hover:text-white transition cursor-pointer shrink-0"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Open Browser</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Progress State */}
      {isLoading && (
        <div className="rounded-2xl neu-card p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-[#fa5c5c] border-zinc-800 animate-spin mx-auto"></div>
          <div>
            <h3 className="text-base font-semibold text-zinc-200">
              Extracting direct download links
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              {loadingStep || 'Connecting to itch.io storage...'}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="p-4 rounded-xl border border-rose-900/80 bg-rose-950/40 text-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-rose-300/80">
              Verify the URL is a public game or asset on itch.io.
            </p>
          </div>
        </div>
      )}

      {/* Game Details & Files Dashboard */}
      {game && !isLoading && (
        <div className="space-y-6">
          {/* Main Game Banner Card */}
          <div className="rounded-2xl neu-card p-5 sm:p-6">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              {/* Cover Image */}
              {game.coverImage ? (
                <img
                  src={getProxiedImageUrl(game.coverImage)}
                  alt={game.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full md:w-56 h-40 object-cover rounded-xl neu-inset shrink-0 bg-black"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes('/api/image-proxy')) {
                      target.src = game.coverImage || '';
                    }
                  }}
                />
              ) : (
                <div className="w-full md:w-56 h-40 rounded-xl neu-inset flex items-center justify-center text-zinc-500 font-mono text-xs shrink-0">
                  NO COVER ART
                </div>
              )}

              {/* Game Meta */}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {game.title}
                  </h2>

                  <div className="flex items-center gap-2">
                    {/* Clean unboxed price metadata */}
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      {game.pricingType === 'paid' ? game.priceText || 'Paid' : 'Free Download'}
                    </span>

                    <a
                      href={game.canonicalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg neu-button text-zinc-300 hover:text-white transition"
                      title="Open source page on itch.io"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Author, rating, and unboxed platform text */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  {game.author.name && (
                    <>
                      <span>by {game.author.name}</span>
                      <span aria-hidden="true" className="text-zinc-600">·</span>
                    </>
                  )}

                  {game.rating && game.rating.average && (
                    <>
                      <span className="inline-flex items-center gap-1 text-amber-400 font-mono tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{game.rating.average.toFixed(1)}</span>
                      </span>
                      <span aria-hidden="true" className="text-zinc-600">·</span>
                    </>
                  )}

                  <div className="flex items-center gap-2">
                    {game.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} size="sm" />
                    ))}
                  </div>
                </div>

                {/* Short description */}
                {game.shortDescription && (
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2">
                    {game.shortDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Requires payment warning if paid */}
            {!game.canDownloadFree && game.requiresPaymentMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Paid Product:</strong> {game.requiresPaymentMessage}. Itch requires purchasing this item on itch.io to generate download tokens.
                  </span>
                </div>
                <a
                  href={game.canonicalUrl + '/purchase'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 transition"
                >
                  Buy on itch.io
                </a>
              </div>
            )}
          </div>

          {/* Screenshots Gallery Section (with Fullscreen Lightbox trigger) */}
          {screenshots.length > 0 && (
            <div className="rounded-2xl neu-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg neu-inset text-emerald-400">
                    <ImageIcon className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                      <span>Screenshots</span>
                      <span className="text-xs font-mono text-zinc-400">({screenshots.length})</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Click any screenshot to open in fullscreen lightbox
                    </p>
                  </div>
                </div>
              </div>

              {/* Deduplicated screenshot cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {screenshots.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedScreenshotIndex(idx)}
                    className="group relative aspect-video rounded-xl overflow-hidden neu-inset cursor-pointer hover:ring-2 hover:ring-[#fa5c5c] transition duration-150 bg-black flex items-center justify-center"
                    title={`Click to view screenshot ${idx + 1} fullscreen`}
                  >
                    <img
                      src={getProxiedImageUrl(s)}
                      alt={`Screenshot ${idx + 1}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.includes('/api/image-proxy')) {
                          target.src = s;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-1.5 rounded-full bg-black/70 text-white shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 font-mono text-[9px] text-zinc-300">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files & Downloads Section with Search & Filtering */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl neu-card">
              <div className="flex items-center gap-3">
                <span className="p-1.5 rounded-lg neu-inset text-[#fa5c5c]">
                  <FolderDown className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-zinc-100 flex items-center gap-2">
                    <span>Available Download Files</span>
                    <span className="text-xs font-mono text-zinc-400 tabular-nums">
                      ({filteredFiles.length}{filteredFiles.length !== game.files.length ? ` of ${game.files.length}` : ''})
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Direct Cloudflare R2 &amp; AWS S3 storage mirrors
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {game.files.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiles}
                    className="px-2.5 py-1.5 rounded-lg neu-button text-xs text-zinc-300 transition cursor-pointer"
                  >
                    {selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg neu-button text-xs text-zinc-200 transition cursor-pointer"
                  title="Export curl / wget script or JSON"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Script</span>
                </button>

                {game.files.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadSelectedFiles}
                    disabled={selectedFileIds.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg neu-btn-accent text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Selected ({selectedFileIds.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Files Search & Filter Toolbar */}
            {game.files.length > 1 && (
              <div className="p-3.5 rounded-xl neu-card space-y-2.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      value={fileSearchTerm}
                      onChange={(e) => setFileSearchTerm(e.target.value)}
                      placeholder="Search files by name or extension (e.g. zip, apk, mac, patch)..."
                      className="w-full pl-9 pr-8 py-1.5 rounded-lg neu-inset text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#fa5c5c]/40"
                    />
                    {fileSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setFileSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Platform Quick Filter */}
                  <div className="flex flex-wrap items-center gap-1 text-xs font-mono">
                    <span className="text-zinc-500 text-[11px] mr-1">OS:</span>
                    <button
                      type="button"
                      onClick={() => setPlatformFilter('all')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        platformFilter === 'all'
                          ? 'neu-button-active'
                          : 'neu-button text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      All
                    </button>
                    {['windows', 'mac', 'linux', 'android'].map((plat) => {
                      const count = game.files.filter((f) =>
                        f.platforms.some((p) => p.toLowerCase().includes(plat))
                      ).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => setPlatformFilter(plat)}
                          className={`px-2 py-1 rounded-md transition cursor-pointer capitalize ${
                            platformFilter === plat
                              ? 'neu-button-active'
                              : 'neu-button text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {plat} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Extension Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
                  <span className="text-zinc-500 mr-1">Type:</span>
                  {[
                    { id: 'all', label: 'All Types' },
                    { id: 'zip', label: '.ZIP' },
                    { id: 'exe', label: '.EXE (Windows)' },
                    { id: 'dmg', label: '.DMG (macOS)' },
                    { id: 'apk', label: '.APK (Android)' },
                    { id: 'linux', label: 'Linux (.tar / .deb)' },
                    { id: 'audio', label: 'Soundtrack / Audio' },
                  ].map((ext) => (
                    <button
                      key={ext.id}
                      type="button"
                      onClick={() => setFileExtensionFilter(ext.id)}
                      className={`px-2 py-0.5 rounded transition cursor-pointer ${
                        fileExtensionFilter === ext.id
                          ? 'neu-button-active text-emerald-400'
                          : 'neu-button text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {ext.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Download queue banner */}
            {downloadQueueProgress && (
              <div className="p-3 rounded-lg neu-card text-emerald-300 text-xs flex items-center justify-between font-mono">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    Triggering browser downloads: {downloadQueueProgress.current} of{' '}
                    {downloadQueueProgress.total} files...
                  </span>
                </span>
                <span className="font-bold tabular-nums">
                  {Math.round((downloadQueueProgress.current / downloadQueueProgress.total) * 100)}%
                </span>
              </div>
            )}

            {/* File Cards List */}
            {filteredFiles.length > 0 ? (
              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    gameUrl={game.canonicalUrl}
                    isSelected={selectedFileIds.includes(file.id)}
                    onToggleSelect={() => handleToggleSelectFile(file.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl neu-card text-zinc-400 text-xs space-y-2">
                <p>No files match the active filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setPlatformFilter('all');
                    setFileSearchTerm('');
                    setFileExtensionFilter('all');
                  }}
                  className="px-3 py-1 rounded-lg neu-button text-[#fa5c5c] hover:text-white transition cursor-pointer font-mono"
                >
                  Reset File Filters
                </button>
              </div>
            )}
          </div>

          {/* External Mirrors */}
          {game.externalMirrors && game.externalMirrors.length > 0 && (
            <div className="rounded-2xl neu-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>External Mirrors Detected in Description</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {game.externalMirrors.map((mirror, idx) => (
                  <a
                    key={idx}
                    href={mirror.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl neu-inset hover:border-zinc-700 transition text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-zinc-200 truncate">
                        {mirror.title}
                      </p>
                      <span className="text-[11px] font-mono text-sky-400">
                        {mirror.type}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Community Comments Section */}
          <div className="rounded-2xl neu-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg neu-inset text-amber-400">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-zinc-100 flex items-center gap-2">
                    <span>Community Comments</span>
                    <span className="text-xs font-mono text-zinc-400">
                      ({game.comments?.length || 0})
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Player reviews, tips, and feedback extracted from itch.io
                  </p>
                </div>
              </div>

              {/* Comment search and sort filters */}
              {game.comments && game.comments.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={commentSearchTerm}
                      onChange={(e) => setCommentSearchTerm(e.target.value)}
                      placeholder="Filter comments..."
                      className="w-36 sm:w-48 pl-7 pr-6 py-1 rounded-lg neu-inset text-xs font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#fa5c5c]"
                    />
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                    {commentSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setCommentSearchTerm('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCommentFilter(commentFilter === 'all' ? 'top' : 'all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1 ${
                      commentFilter === 'top'
                        ? 'neu-button-active text-amber-400'
                        : 'neu-button text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Filter upvoted comments"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Top</span>
                  </button>
                </div>
              )}
            </div>

            {/* Comments List */}
            {filteredComments.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3.5 rounded-xl neu-card transition text-xs space-y-2 ${
                      comment.isReply ? 'ml-4 sm:ml-8 border-l-2 border-[#fa5c5c]/40' : ''
                    }`}
                  >
                    {/* Comment Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {comment.author.avatar ? (
                          <img
                            src={getProxiedImageUrl(comment.author.avatar)}
                            alt={comment.author.name}
                            loading="lazy"
                            className="w-6 h-6 rounded-full object-cover neu-inset shrink-0 bg-zinc-800"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src.includes('/api/image-proxy')) {
                                target.src = comment.author.avatar || '';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full neu-inset flex items-center justify-center font-bold text-[10px] text-zinc-400 shrink-0">
                            {comment.author.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex items-center gap-2">
                          {comment.author.url ? (
                            <a
                              href={comment.author.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-zinc-200 hover:text-[#fa5c5c] transition truncate"
                            >
                              {comment.author.name}
                            </a>
                          ) : (
                            <span className="font-semibold text-zinc-200 truncate">
                              {comment.author.name}
                            </span>
                          )}

                          {comment.isReply && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono neu-inset text-zinc-400">
                              reply
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {comment.votes && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              comment.votes.includes('-')
                                ? 'text-rose-400 neu-inset'
                                : 'text-emerald-400 neu-inset'
                            }`}
                          >
                            {comment.votes}
                          </span>
                        )}

                        <span
                          className="text-[11px] font-mono text-zinc-500"
                          title={comment.timestamp || comment.date}
                        >
                          {comment.date}
                        </span>
                      </div>
                    </div>

                    {/* Comment Body */}
                    <div className="text-zinc-300 leading-relaxed break-words whitespace-pre-wrap pl-8">
                      {comment.body}
                    </div>
                  </div>
                ))}
              </div>
            ) : game.comments && game.comments.length > 0 ? (
              <div className="p-6 text-center rounded-xl neu-inset text-xs text-zinc-400 space-y-1">
                <p>No comments match "{commentSearchTerm}".</p>
                <button
                  type="button"
                  onClick={() => setCommentSearchTerm('')}
                  className="text-[#fa5c5c] underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl neu-inset text-xs text-zinc-500 space-y-1">
                <p>No community comments posted on this itch.io page yet.</p>
              </div>
            )}
          </div>

          {/* Page Description Collapsible */}
          <div className="rounded-2xl neu-card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <span>View Full itch.io Page Description</span>
              {showFullDesc ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>

            {showFullDesc && (
              <div className="p-5 border-t border-zinc-800/80 text-xs">
                {game.fullDescriptionHtml ? (
                  <div
                    className="text-zinc-400 leading-relaxed space-y-2 max-h-96 overflow-y-auto p-4 rounded-xl neu-inset"
                    dangerouslySetInnerHTML={{ __html: game.fullDescriptionHtml }}
                  />
                ) : (
                  <p className="text-zinc-500 font-mono">No description provided on page.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {game && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          game={game}
          selectedFiles={game.files.filter((f) => selectedFileIds.includes(f.id))}
        />
      )}

      {/* Fullscreen Screenshot Modal */}
      {game && (
        <ScreenshotModal
          isOpen={selectedScreenshotIndex !== null}
          onClose={() => setSelectedScreenshotIndex(null)}
          screenshots={screenshots}
          initialIndex={selectedScreenshotIndex ?? 0}
          gameTitle={game.title}
        />
      )}
    </div>
  );
};
