import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  FileArchive,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ItchFile } from '../types';
import { PlatformBadge } from './PlatformBadge';

interface FileCardProps {
  file: ItchFile;
  gameUrl: string;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onDownloadFile?: (file: ItchFile) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  gameUrl,
  isSelected,
  onToggleSelect,
  onDownloadFile,
}) => {
  const [copied, setCopied] = useState(false);
  const [showUrlDetails, setShowUrlDetails] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [currentDirectUrl, setCurrentDirectUrl] = useState(file.directUrl || '');

  // Detect file extension
  const extension = file.filename.split('.').pop()?.toUpperCase() || 'FILE';

  // Handle direct download
  const handleDownload = () => {
    if (onDownloadFile) {
      onDownloadFile(file);
      return;
    }
    const downloadEndpoint = file.uploadId
      ? `/api/download?gameUrl=${encodeURIComponent(gameUrl)}&uploadId=${file.uploadId}`
      : currentDirectUrl || '#';
    window.location.href = downloadEndpoint;
  };

  // Handle copying direct link
  const handleCopyLink = async () => {
    try {
      let targetUrl = currentDirectUrl;
      if (!targetUrl && file.uploadId) {
        setIsResolving(true);
        const res = await fetch('/api/resolve-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameUrl, uploadId: file.uploadId }),
        });
        const json = await res.json();
        if (json.directUrl) {
          targetUrl = json.directUrl;
          setCurrentDirectUrl(targetUrl);
        }
        setIsResolving(false);
      }

      const urlToCopy =
        targetUrl ||
        `${window.location.origin}/api/download?gameUrl=${encodeURIComponent(gameUrl)}&uploadId=${file.uploadId}`;
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div
      className={`relative rounded-xl transition-all duration-150 overflow-hidden ${
        isSelected
          ? 'neu-card ring-1 ring-[#fa5c5c]/60'
          : 'neu-card hover:border-zinc-700/80'
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Checkbox + File Info */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#fa5c5c] focus:ring-[#fa5c5c]/40 cursor-pointer accent-[#fa5c5c]"
              aria-label={`Select ${file.filename}`}
            />
          )}

          <div className="w-10 h-10 shrink-0 rounded-lg neu-inset flex flex-col items-center justify-center text-zinc-300">
            <FileArchive className="w-4 h-4 text-[#fa5c5c]" />
            <span className="text-[9px] font-mono font-bold text-zinc-400 mt-0.5 tracking-tighter">
              {extension.slice(0, 4)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="font-semibold text-zinc-100 text-sm sm:text-base truncate max-w-full mb-1"
              title={file.filename}
            >
              {file.filename}
            </h3>

            {/* Unboxed Metadata Line with typographic separators */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono">
              {file.filesize && (
                <span className="tabular-nums font-semibold text-zinc-200">
                  {file.filesize}
                </span>
              )}

              {file.platforms && file.platforms.length > 0 && (
                <>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <div className="flex items-center gap-2">
                    {file.platforms.map((plat) => (
                      <PlatformBadge key={plat} platform={plat} size="sm" />
                    ))}
                  </div>
                </>
              )}

              {file.date && (
                <>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="text-zinc-500">{file.date}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={isResolving}
            title="Copy direct download URL"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg neu-button text-zinc-300 cursor-pointer disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : isResolving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>Resolving...</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg neu-btn-accent text-white cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUrlDetails(!showUrlDetails)}
            className="p-2 rounded-lg neu-button text-zinc-400 hover:text-zinc-200 cursor-pointer"
            title="Inspect CDN storage endpoint"
          >
            {showUrlDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable storage details drawer */}
      {showUrlDetails && (
        <div className="px-4 py-3 neu-inset border-t border-zinc-800/80 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-zinc-300 font-semibold">
              Storage CDN Endpoint (Cloudflare R2 / AWS S3)
            </span>
            <div className="flex items-center gap-2">
              <a
                href={currentDirectUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#fa5c5c] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open direct link in browser</span>
              </a>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0c0d12] border border-zinc-850 text-zinc-400 break-all select-all selection:bg-[#fa5c5c]/40 text-[11px]">
            {currentDirectUrl || (
              <span className="text-zinc-600 italic">
                Direct signed URL dynamically resolved via /api/download on click.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
