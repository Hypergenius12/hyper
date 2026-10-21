import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { getProxiedImageUrl } from '../utils/imageUtils';

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshots: string[];
  initialIndex?: number;
  gameTitle?: string;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  isOpen,
  onClose,
  screenshots,
  initialIndex = 0,
  gameTitle = 'Screenshot',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, screenshots.length - 1)));
      setIsZoomed(false);
      setImageLoaded(false);
    }
  }, [isOpen, initialIndex, screenshots.length]);

  const handlePrev = useCallback(() => {
    setImageLoaded(false);
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : screenshots.length - 1));
  }, [screenshots.length]);

  const handleNext = useCallback(() => {
    setImageLoaded(false);
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev < screenshots.length - 1 ? prev + 1 : 0));
  }, [screenshots.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || screenshots.length === 0) return null;

  const currentUrl = screenshots[currentIndex];
  const proxiedUrl = getProxiedImageUrl(currentUrl);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = proxiedUrl;
    a.download = `${gameTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_screenshot_${currentIndex + 1}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot fullscreen viewer"
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Top Bar Controls */}
      <div
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800/80 bg-[#12131a]/80 shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <span className="p-1.5 rounded-lg neu-inset text-[#fa5c5c] shrink-0">
            <ImageIcon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">
              {gameTitle}
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              Screenshot {currentIndex + 1} of {screenshots.length}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-lg neu-button text-zinc-300 hover:text-white transition cursor-pointer"
            title={isZoomed ? 'Fit to screen' : 'Zoom 100%'}
          >
            {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-lg neu-button text-zinc-300 hover:text-white transition cursor-pointer"
            title="Download screenshot image"
          >
            <Download className="w-4 h-4" />
          </button>

          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg neu-button text-zinc-300 hover:text-white transition cursor-pointer"
            title="Open original high-res image in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg neu-button text-zinc-300 hover:text-rose-400 transition cursor-pointer ml-1"
            title="Close viewer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport Area */}
      <div
        className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-auto"
        onClick={onClose}
      >
        {/* Loading Spinner */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-t-[#fa5c5c] border-zinc-700 animate-spin"></div>
          </div>
        )}

        {/* Previous Button */}
        {screenshots.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full neu-button text-zinc-200 hover:text-white hover:scale-110 active:scale-95 transition cursor-pointer z-20 shadow-xl"
            title="Previous screenshot (Left arrow)"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Image Display */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(!isZoomed);
          }}
        >
          <img
            src={proxiedUrl}
            alt={`${gameTitle} screenshot ${currentIndex + 1}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.includes('/api/image-proxy')) {
                target.src = currentUrl;
              }
            }}
            className={`rounded-lg transition-all duration-150 ${
              isZoomed
                ? 'max-w-none w-auto h-auto'
                : 'max-w-full max-h-[72vh] sm:max-h-[78vh] object-contain shadow-2xl neu-card'
            }`}
          />
        </div>

        {/* Next Button */}
        {screenshots.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full neu-button text-zinc-200 hover:text-white hover:scale-110 active:scale-95 transition cursor-pointer z-20 shadow-xl"
            title="Next screenshot (Right arrow)"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {screenshots.length > 1 && (
        <div
          className="w-full px-4 py-3 border-t border-zinc-800/80 bg-[#12131a]/90 shrink-0 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 overflow-x-auto pb-1">
            {screenshots.map((s, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (idx !== currentIndex) {
                      setImageLoaded(false);
                      setIsZoomed(false);
                      setCurrentIndex(idx);
                    }
                  }}
                  className={`relative shrink-0 rounded-lg overflow-hidden transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'ring-2 ring-[#fa5c5c] ring-offset-2 ring-offset-[#12131a] scale-105 opacity-100'
                      : 'opacity-50 hover:opacity-90 hover:scale-100 neu-card'
                  }`}
                  title={`View screenshot ${idx + 1}`}
                >
                  <img
                    src={getProxiedImageUrl(s)}
                    alt={`Thumbnail ${idx + 1}`}
                    loading="lazy"
                    className="w-14 h-10 sm:w-16 sm:h-12 object-cover bg-black"
                  />
                  <span className="absolute bottom-0 right-0 bg-black/70 px-1 text-[9px] font-mono text-zinc-300">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
