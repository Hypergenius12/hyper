import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Compass,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Gamepad2,
  Box,
  Wrench,
  Music,
  X,
  SlidersHorizontal,
  Flame,
  Clock,
  Tag,
  DollarSign,
  BookOpen,
} from 'lucide-react';
import { BrowseItem, BrowseResponse } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { getProxiedImageUrl } from '../utils/imageUtils';

interface BrowseCatalogProps {
  onSelectGameUrl: (url: string) => void;
}

const CATEGORIES = [
  { id: 'games-free', label: 'Free Games', category: 'games', filter: 'free', icon: Gamepad2 },
  { id: 'games-top', label: 'Top Rated', category: 'games', filter: 'top-rated', icon: Sparkles },
  { id: 'games-popular', label: 'New & Popular', category: 'games', filter: 'new-and-popular', icon: Flame },
  { id: 'games-newest', label: 'Most Recent', category: 'games', filter: 'newest', icon: Clock },
  { id: 'assets-free', label: 'Game Assets', category: 'game-assets', filter: 'free', icon: Box },
  { id: 'tools-free', label: 'Tools', category: 'tools', filter: 'free', icon: Wrench },
  { id: 'audio-free', label: 'Audio & Music', category: 'soundtracks', filter: 'free', icon: Music },
  { id: 'comics-free', label: 'Comics & Books', category: 'comics', filter: 'free', icon: BookOpen },
];

const PLATFORMS = [
  { id: 'all', label: 'All OS' },
  { id: 'windows', label: 'Windows' },
  { id: 'osx', label: 'macOS' },
  { id: 'linux', label: 'Linux' },
  { id: 'android', label: 'Android' },
  { id: 'web', label: 'Web' },
];

const GENRES = [
  { id: 'all', label: 'All Genres' },
  { id: 'action', label: 'Action' },
  { id: 'horror', label: 'Horror' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'rpg', label: 'RPG' },
  { id: 'puzzle', label: 'Puzzle' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'visual-novel', label: 'Visual Novel' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'platformer', label: 'Platformer' },
  { id: 'survival', label: 'Survival' },
];

const PRICE_FILTERS = [
  { id: 'free', label: 'Free' },
  { id: 'on-sale', label: 'On Sale' },
  { id: 'all', label: 'Any Price' },
];

export const BrowseCatalog: React.FC<BrowseCatalogProps> = ({ onSelectGameUrl }) => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('free');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [instantFilter, setInstantFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<BrowseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch items
  const fetchCatalog = async (targetPage: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('category', selectedCategory.category);
      // If user chose custom price filter override, otherwise use category filter
      const effectiveFilter = selectedPrice !== 'free' ? selectedPrice : selectedCategory.filter;
      params.set('filter', effectiveFilter);
      params.set('page', targetPage.toString());

      if (activeQuery.trim()) {
        params.set('query', activeQuery.trim());
      } else {
        if (selectedPlatform !== 'all') params.set('platform', selectedPlatform);
        if (selectedGenre !== 'all') params.set('genre', selectedGenre);
      }

      const res = await fetch(`/api/browse?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load catalog (HTTP ${res.status})`);
      }

      const data: BrowseResponse = await res.json();
      setItems(data.items || []);
      setHasMore(data.hasMore);
      setPage(data.page);
    } catch (err: any) {
      setError(err.message || 'Error browsing itch.io catalog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCatalog(1);
  }, [selectedCategory, selectedPlatform, selectedGenre, selectedPrice, activeQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveQuery('');
  };

  const handleResetFilters = () => {
    setSelectedCategory(CATEGORIES[0]);
    setSelectedPlatform('all');
    setSelectedGenre('all');
    setSelectedPrice('free');
    setSearchQuery('');
    setActiveQuery('');
    setInstantFilter('');
  };

  const isCustomFiltered =
    selectedCategory.id !== CATEGORIES[0].id ||
    selectedPlatform !== 'all' ||
    selectedGenre !== 'all' ||
    selectedPrice !== 'free' ||
    !!activeQuery;

  // Filter visible items in real-time
  const visibleItems = useMemo(() => {
    if (!instantFilter.trim()) return items;
    const term = instantFilter.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.author.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        (item.genre && item.genre.toLowerCase().includes(term))
    );
  }, [items, instantFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchCatalog(newPage);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="rounded-2xl neu-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl neu-inset text-[#fa5c5c]">
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Browse Games &amp; Assets</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Explore the itch.io catalog and grab direct download links without visiting itch.io
              </p>
            </div>
          </div>

          {/* Search Input & Advanced Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search itch.io catalog..."
                className="w-full pl-10 pr-20 py-2.5 rounded-xl neu-inset text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#fa5c5c]/40 font-mono"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg neu-btn-accent text-white text-xs font-semibold cursor-pointer"
                >
                  Find
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                showAdvancedFilters || isCustomFiltered
                  ? 'neu-button-active text-[#fa5c5c]'
                  : 'neu-button text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle extended search filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        {!activeQuery && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedGenre('all');
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'neu-button-active'
                      : 'neu-button text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Extended Search Filters Bar */}
        {(showAdvancedFilters || !activeQuery) && (
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Platform filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-zinc-500 font-mono text-[11px] mr-1">Platform:</span>
                {PLATFORMS.map((plat) => (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setSelectedPlatform(plat.id)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition cursor-pointer ${
                      selectedPlatform === plat.id
                        ? 'neu-button-active'
                        : 'neu-button text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {plat.label}
                  </button>
                ))}
              </div>

              {/* Price Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-mono text-[11px]">Price:</span>
                {PRICE_FILTERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPrice(p.id)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition cursor-pointer ${
                      selectedPrice === p.id
                        ? 'neu-button-active'
                        : 'neu-button text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Genre dropdown */}
              {selectedCategory.category === 'games' && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-mono text-[11px]">Genre:</span>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="neu-inset rounded-lg px-2.5 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#fa5c5c] cursor-pointer"
                  >
                    {GENRES.map((g) => (
                      <option key={g.id} value={g.id} className="bg-zinc-900 text-zinc-200">
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Instant Filter within loaded items */}
            {items.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={instantFilter}
                    onChange={(e) => setInstantFilter(e.target.value)}
                    placeholder="Instant filter on page (title, author, genre)..."
                    className="w-full pl-8 pr-8 py-1.5 rounded-lg neu-inset text-xs font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#fa5c5c]/40"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                  {instantFilter && (
                    <button
                      type="button"
                      onClick={() => setInstantFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-mono text-zinc-400">
                  <span>
                    Showing <strong className="text-zinc-200">{visibleItems.length}</strong> of{' '}
                    {items.length} items
                  </span>
                  {isCustomFiltered && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-2 py-0.5 rounded text-[11px] neu-button text-[#fa5c5c] hover:text-white transition cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl neu-card p-4 space-y-3 animate-pulse"
            >
              <div className="w-full h-36 rounded-lg bg-zinc-800/40"></div>
              <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
              <div className="h-3 bg-zinc-800/50 rounded w-1/2"></div>
              <div className="h-8 bg-zinc-800/60 rounded mt-3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-6 text-center rounded-2xl border border-rose-900/80 bg-rose-950/40 text-rose-200 space-y-3">
          <p className="font-semibold text-sm">{error}</p>
          <button
            type="button"
            onClick={() => fetchCatalog(page)}
            className="px-4 py-2 rounded-xl neu-button text-xs text-white transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Grid of Browse Items */}
      {!isLoading && visibleItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl neu-card transition flex flex-col justify-between overflow-hidden"
            >
              {/* Card Thumbnail */}
              <div className="relative aspect-[315/250] bg-black overflow-hidden neu-inset">
                {item.thumbnail ? (
                  <img
                    src={getProxiedImageUrl(item.thumbnail)}
                    alt={item.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src.includes('/api/image-proxy')) {
                        target.src = item.thumbnail || '';
                      }
                    }}
                  />
                ) : (
                  <div
                    style={{ backgroundColor: item.coverColor || '#12141a' }}
                    className="w-full h-full flex items-center justify-center text-xs font-mono text-zinc-500 font-bold"
                  >
                    ITCH.IO
                  </div>
                )}

                {/* Clean unboxed price overlay */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold neu-inset text-emerald-400">
                    {item.price || 'FREE'}
                  </span>
                </div>

                {item.genre && (
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono neu-inset text-zinc-300">
                      {item.genre}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3
                    className="font-semibold text-zinc-100 text-sm line-clamp-1 group-hover:text-[#fa5c5c] transition"
                    title={item.title}
                  >
                    {item.title}
                  </h3>

                  {/* Unboxed Metadata Line */}
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1 font-mono">
                    <span>by {item.author || 'creator'}</span>
                    {item.platforms && item.platforms.length > 0 && (
                      <>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <div className="flex items-center gap-1">
                          {item.platforms.slice(0, 3).map((p) => (
                            <PlatformBadge key={p} platform={p} size="sm" />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5 leading-snug">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-3.5 py-2.5 neu-inset border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 transition"
                  title="View original on itch.io"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => onSelectGameUrl(item.url)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg neu-btn-accent text-white text-xs font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Get Downloads</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && visibleItems.length === 0 && items.length > 0 && (
        <div className="p-8 text-center rounded-2xl neu-card space-y-2 text-xs text-zinc-400">
          <p>No items match "{instantFilter}" on this page.</p>
          <button
            type="button"
            onClick={() => setInstantFilter('')}
            className="text-[#fa5c5c] underline cursor-pointer"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && items.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl neu-card">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg neu-button text-xs font-medium text-zinc-200 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-zinc-400 tabular-nums">
            Page <strong className="text-zinc-200">{page}</strong>
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasMore}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg neu-button text-xs font-medium text-zinc-200 disabled:opacity-40 transition cursor-pointer"
          >
            <span>Next Page</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
