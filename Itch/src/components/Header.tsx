import React from 'react';
import { Download, ClipboardPaste } from 'lucide-react';

interface HeaderProps {
  currentTab: 'browse' | 'single' | 'batch' | 'history';
  onTabChange: (tab: 'browse' | 'single' | 'batch' | 'history') => void;
  onQuickPaste?: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onQuickPaste,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#12131a]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark (Single text element in display face, no pill badges) */}
        <button
          type="button"
          onClick={() => onTabChange('browse')}
          className="text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 font-sans cursor-pointer flex items-center gap-2.5 hover:opacity-95 transition"
        >
          <span className="w-8 h-8 rounded-lg neu-btn-accent flex items-center justify-center text-white">
            <Download className="w-4 h-4" />
          </span>
          <span className="font-extrabold">Itch<span className="text-[#fa5c5c]">Link</span></span>
        </button>

        {/* Zone 2: Navigation Links (single-line, tactile neumorphic tabs) */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onTabChange('browse')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'browse'
                ? 'neu-button-active'
                : 'neu-button text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Browse
          </button>

          <button
            type="button"
            onClick={() => onTabChange('single')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'single'
                ? 'neu-button-active'
                : 'neu-button text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Extractor
          </button>

          <button
            type="button"
            onClick={() => onTabChange('batch')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'batch'
                ? 'neu-button-active'
                : 'neu-button text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Batch
          </button>

          <button
            type="button"
            onClick={() => onTabChange('history')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'history'
                ? 'neu-button-active'
                : 'neu-button text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Library</span>
            {historyCount > 0 && (
              <span className="font-mono text-xs text-zinc-400 tabular-nums">
                ({historyCount})
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onQuickPaste) {
                onQuickPaste();
              } else {
                onTabChange('single');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg neu-btn-accent text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paste Link</span>
            <span className="sm:hidden">Paste</span>
          </button>
        </div>
      </div>
    </header>
  );
};
