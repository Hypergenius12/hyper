import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SingleInspector } from './components/SingleInspector';
import { BatchExtractor } from './components/BatchExtractor';
import { HistoryView } from './components/HistoryView';
import { BrowseCatalog } from './components/BrowseCatalog';
import { ExtractedGame } from './types';

const STORAGE_KEY = 'itchlink_history_v1';

export default function App() {
  const [tab, setTab] = useState<'browse' | 'single' | 'batch' | 'history'>('browse');
  const [history, setHistory] = useState<ExtractedGame[]>([]);
  const [activeGame, setActiveGame] = useState<ExtractedGame | null>(null);
  const [queuedUrl, setQueuedUrl] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Save to history helper
  const handleSaveToHistory = (newGame: ExtractedGame) => {
    setHistory((prev) => {
      const filtered = prev.filter((g) => g.canonicalUrl !== newGame.canonicalUrl);
      const updated = [newGame, ...filtered].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save history', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your saved extraction history?')) {
      setHistory([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('Failed to clear history', e);
      }
    }
  };

  const handleRemoveHistoryItem = (url: string) => {
    setHistory((prev) => {
      const updated = prev.filter((g) => g.url !== url && g.canonicalUrl !== url);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update history', e);
      }
      return updated;
    });
  };

  const handleSelectGame = (game: ExtractedGame) => {
    setActiveGame(game);
    setQueuedUrl(null);
    setTab('single');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBrowseUrl = (url: string) => {
    setActiveGame(null);
    setQueuedUrl(url);
    setTab('single');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.includes('itch.io')) {
        handleSelectBrowseUrl(text.trim());
      } else {
        setTab('single');
      }
    } catch {
      setTab('single');
    }
  };

  return (
    <div className="min-h-screen bg-[#111218] text-zinc-100 flex flex-col font-sans selection:bg-[#fa5c5c]/30 selection:text-white">
      {/* Top Navigation */}
      <Header
        currentTab={tab}
        onTabChange={(newTab) => setTab(newTab)}
        onQuickPaste={handleQuickPaste}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {tab === 'browse' && (
          <BrowseCatalog onSelectGameUrl={handleSelectBrowseUrl} />
        )}

        {tab === 'single' && (
          <SingleInspector
            initialGame={activeGame}
            initialUrl={queuedUrl}
            onSaveToHistory={handleSaveToHistory}
            onNavigateToBrowse={() => setTab('browse')}
          />
        )}

        {tab === 'batch' && (
          <BatchExtractor
            onSelectGame={handleSelectGame}
            onSaveToHistory={handleSaveToHistory}
          />
        )}

        {tab === 'history' && (
          <HistoryView
            history={history}
            onSelectGame={handleSelectGame}
            onClearHistory={handleClearHistory}
            onRemoveItem={handleRemoveHistoryItem}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#0e0f14] py-6 text-xs text-zinc-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-semibold">ItchLink</span>
            <span className="text-zinc-700">·</span>
            <span>Direct CDN Link Extractor &amp; Downloader for itch.io</span>
          </div>

          <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
            <span>Same-Origin Image Proxy</span>
            <span className="text-zinc-700">·</span>
            <span>Signed CDN Mirrors</span>
            <span className="text-zinc-700">·</span>
            <span>No Trackers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
