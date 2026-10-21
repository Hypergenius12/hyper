import React, { useState } from 'react';
import {
  History,
  Search,
  Trash2,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ExtractedGame } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { getProxiedImageUrl } from '../utils/imageUtils';

interface HistoryViewProps {
  history: ExtractedGame[];
  onSelectGame: (game: ExtractedGame) => void;
  onClearHistory: () => void;
  onRemoveItem: (url: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectGame,
  onClearHistory,
  onRemoveItem,
}) => {
  const [search, setSearch] = useState('');

  const filtered = history.filter((game) => {
    const q = search.toLowerCase();
    return (
      game.title.toLowerCase().includes(q) ||
      game.url.toLowerCase().includes(q) ||
      game.author.name.toLowerCase().includes(q) ||
      game.files.some((f) => f.filename.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl neu-card">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl neu-inset text-amber-400">
            <History className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Saved Downloads Library
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Saved offline in browser ({history.length} games recorded)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 neu-button rounded-lg transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      {history.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved titles, files, or creators..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl neu-inset text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#fa5c5c]/40 font-mono"
          />
        </div>
      )}

      {/* History Grid */}
      {history.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl neu-inset">
          <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">
            No saved games in your library yet
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            Whenever you extract download links from itch.io, games are saved here for instant re-download.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl neu-card text-zinc-400 text-xs">
          No saved games matched "{search}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((game, idx) => (
            <div
              key={idx}
              className="group relative rounded-xl neu-card transition overflow-hidden flex flex-col justify-between"
            >
              <div className="p-4 sm:p-5 flex gap-4">
                {game.coverImage ? (
                  <img
                    src={getProxiedImageUrl(game.coverImage)}
                    alt={game.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-cover rounded-lg neu-inset shrink-0 bg-black"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src.includes('/api/image-proxy')) {
                        target.src = game.coverImage || '';
                      }
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg neu-inset flex items-center justify-center text-xs font-mono text-zinc-500 shrink-0">
                    NO IMG
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-semibold text-zinc-100 text-sm truncate group-hover:text-[#fa5c5c] transition"
                      title={game.title}
                    >
                      {game.title}
                    </h3>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(game.url)}
                      title="Remove from history"
                      className="text-zinc-600 hover:text-rose-400 transition cursor-pointer p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    by {game.author.name || 'Unknown Author'}
                  </p>

                  {/* Clean unboxed metadata */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono mt-2">
                    <span className="tabular-nums font-semibold text-zinc-300">
                      {game.files.length} file{game.files.length === 1 ? '' : 's'}
                    </span>
                    {game.platforms.length > 0 && (
                      <>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <div className="flex items-center gap-1">
                          {game.platforms.slice(0, 3).map((p) => (
                            <PlatformBadge key={p} platform={p} size="sm" />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-500 mt-2 font-mono tabular-nums">
                    Extracted on {new Date(game.extractedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="px-4 py-2.5 neu-inset border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <a
                  href={game.canonicalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300 font-mono text-[11px]"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>itch.io</span>
                </a>

                <button
                  type="button"
                  onClick={() => onSelectGame(game)}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#fa5c5c] hover:text-[#ff7878] cursor-pointer"
                >
                  <span>Open &amp; Download</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
