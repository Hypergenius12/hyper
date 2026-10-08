import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ColorItem,
  HarmonyMode,
  ColorBlindnessType,
  DisplayFormat,
  SavedPalette,
} from './types';
import {
  DEFAULT_INITIAL_PALETTE,
  createColorItem,
  generatePaletteColors,
  resamplePalette,
  interpolateColor,
  normalizeHex,
  isValidHex,
  simulateColorBlindness,
} from './utils/colorUtils';
import { Navbar } from './components/Navbar';
import { PaletteColumn } from './components/PaletteColumn';
import { ShadesModal } from './components/ShadesModal';
import { ContrastModal } from './components/ContrastModal';
import { VisualizerModal } from './components/VisualizerModal';
import { ExportModal } from './components/ExportModal';
import { ImageExtractorModal } from './components/ImageExtractorModal';
import { SavedPalettesModal } from './components/SavedPalettesModal';
import { ShortcutsModal } from './components/ShortcutsModal';

const STORAGE_SAVED_KEY = 'chromacraft_saved_palettes';

export default function App() {
  // Parse initial colors from URL hash if present
  const getInitialColors = (): ColorItem[] => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) {
        const parts = hash.split('-').filter(p => /^[0-9a-fA-F]{6}$/.test(p));
        if (parts.length >= 2 && parts.length <= 10) {
          return parts.map(p => createColorItem(`#${p}`));
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_INITIAL_PALETTE.map(hex => createColorItem(hex));
  };

  const [palette, setPalette] = useState<ColorItem[]>(getInitialColors);
  const [history, setHistory] = useState<ColorItem[][]>([getInitialColors()]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>('balanced');
  const [colorBlindness, setColorBlindness] = useState<ColorBlindnessType>('none');
  const [format, setFormat] = useState<DisplayFormat>('hex');

  // Modals state
  const [shadesColor, setShadesColor] = useState<{ color: ColorItem; index: number } | null>(null);
  const [contrastColor, setContrastColor] = useState<ColorItem | null>(null);
  const [isContrastOpen, setIsContrastOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImageExtractorOpen, setIsImageExtractorOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Saved Palettes
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SAVED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep URL hash in sync with current palette
  useEffect(() => {
    const hash = palette.map(c => c.hex.replace('#', '').toLowerCase()).join('-');
    window.history.replaceState(null, '', `#${hash}`);
  }, [palette]);

  // Persist saved palettes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(savedPalettes));
    } catch {
      // ignore
    }
  }, [savedPalettes]);

  // Update history helper
  const pushToHistory = useCallback((newPalette: ColorItem[]) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, newPalette];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Generate colors
  const handleGenerate = useCallback((overrideMode?: HarmonyMode) => {
    const activeMode = overrideMode || harmonyMode;
    const rawColors = generatePaletteColors(
      palette.length,
      activeMode,
      palette.map(c => ({ hex: c.hex, locked: c.locked }))
    );

    const nextPalette = palette.map((item, idx) => {
      if (item.locked) return item;
      return createColorItem(rawColors[idx], false);
    });

    setPalette(nextPalette);
    pushToHistory(nextPalette);
  }, [palette, harmonyMode, pushToHistory]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      setPalette(history[targetIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      setPalette(history[targetIndex]);
    }
  }, [historyIndex, history]);

  // Global keyboard listener for spacebar and undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If focus is in an input or modal is open, don't trigger spacebar generation
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT';

      const anyModalOpen =
        shadesColor !== null ||
        isContrastOpen ||
        isVisualizerOpen ||
        isExportOpen ||
        isImageExtractorOpen ||
        isSavedOpen ||
        isShortcutsOpen;

      if (e.key === 'Escape') {
        setShadesColor(null);
        setIsContrastOpen(false);
        setIsVisualizerOpen(false);
        setIsExportOpen(false);
        setIsImageExtractorOpen(false);
        setIsSavedOpen(false);
        setIsShortcutsOpen(false);
        return;
      }

      if (isInput || anyModalOpen) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleGenerate();
      } else if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        // Quick copy first unlocked or active
        const hex = palette[0]?.hex;
        if (hex) navigator.clipboard.writeText(hex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleGenerate,
    handleUndo,
    handleRedo,
    palette,
    shadesColor,
    isContrastOpen,
    isVisualizerOpen,
    isExportOpen,
    isImageExtractorOpen,
    isSavedOpen,
    isShortcutsOpen,
  ]);

  // Toggle lock on column
  const handleToggleLock = (id: string) => {
    setPalette(prev =>
      prev.map(c => (c.id === id ? { ...c, locked: !c.locked } : c))
    );
  };

  // Remove column
  const handleRemove = (id: string) => {
    if (palette.length <= 2) return;
    const next = palette.filter(c => c.id !== id);
    setPalette(next);
    pushToHistory(next);
  };

  // Move column left or right
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= palette.length) return;

    const next = [...palette];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    setPalette(next);
    pushToHistory(next);
  };

  // Update hex code for column
  const handleUpdateHex = (id: string, newHex: string) => {
    const next = palette.map(c => {
      if (c.id === id) {
        return createColorItem(newHex, c.locked);
      }
      return c;
    });
    setPalette(next);
    pushToHistory(next);
  };

  // Insert harmonious interpolated color between two columns
  const handleInsertAfter = (index: number) => {
    if (palette.length >= 10) return;
    const color1 = palette[index].hex;
    const color2 = palette[index + 1]?.hex || color1;
    const middleHex = interpolateColor(color1, color2, 0.5);

    const next = [...palette];
    next.splice(index + 1, 0, createColorItem(middleHex, false));
    setPalette(next);
    pushToHistory(next);
  };

  // Change color count via Navbar adjuster - smoothly resamples so all colors match!
  const handleColorCountChange = (newCount: number) => {
    const count = Math.max(2, Math.min(10, newCount));
    if (count === palette.length) return;

    // Resample current palette along its curve so new colors always blend smoothly
    const currentHexes = palette.map(c => c.hex);
    const resampled = resamplePalette(currentHexes, count);

    const next = resampled.map((hex, idx) => {
      // Preserve locked state if the column was previously locked
      const existing = palette[idx];
      const isLocked = existing ? existing.locked : false;
      return createColorItem(isLocked ? existing.hex : hex, isLocked);
    });

    setPalette(next);
    pushToHistory(next);
  };

  // Load palette from Saved / Image Extractor
  const handleLoadPalette = (hexes: string[]) => {
    const next = hexes.map(h => createColorItem(h, false));
    setPalette(next);
    pushToHistory(next);
  };

  // Save current palette to library
  const handleSaveCurrent = (name: string) => {
    const newSaved: SavedPalette = {
      id: `pal-${Date.now()}`,
      name,
      colors: palette.map(c => c.hex),
      createdAt: Date.now(),
    };
    setSavedPalettes(prev => [newSaved, ...prev]);
  };

  // Delete saved palette
  const handleDeleteSaved = (id: string) => {
    setSavedPalettes(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 font-sans">
      {/* Top Coolors-style Navbar */}
      <Navbar
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onGenerate={handleGenerate}
        colorCount={palette.length}
        onColorCountChange={handleColorCountChange}
        harmonyMode={harmonyMode}
        onHarmonyModeChange={(mode) => {
          setHarmonyMode(mode);
          handleGenerate(mode);
        }}
        colorBlindness={colorBlindness}
        onColorBlindnessChange={setColorBlindness}
        format={format}
        onFormatChange={setFormat}
        onOpenVisualizer={() => setIsVisualizerOpen(true)}
        onOpenContrast={() => {
          setContrastColor(palette[0] || null);
          setIsContrastOpen(true);
        }}
        onOpenImageExtractor={() => setIsImageExtractorOpen(true)}
        onOpenSaved={() => setIsSavedOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        savedCount={savedPalettes.length}
      />

      {/* Main Fullscreen Color Columns */}
      <main className="flex-1 flex flex-col md:flex-row w-full h-[calc(100vh-53px)] overflow-y-auto md:overflow-hidden relative min-h-0">
        {palette.map((color, idx) => {
          const displayHex = simulateColorBlindness(color.hex, colorBlindness);

          return (
            <PaletteColumn
              key={color.id}
              color={color}
              displayHex={displayHex}
              index={idx}
              totalColors={palette.length}
              format={format}
              onToggleLock={handleToggleLock}
              onRemove={handleRemove}
              onMove={handleMove}
              onOpenShades={(col, cIdx) => setShadesColor({ color: col, index: cIdx })}
              onOpenContrast={(col) => {
                setContrastColor(col);
                setIsContrastOpen(true);
              }}
              onUpdateHex={handleUpdateHex}
              onInsertAfter={handleInsertAfter}
            />
          );
        })}
      </main>

      {/* Shades Modal */}
      {shadesColor && (
        <ShadesModal
          color={shadesColor.color}
          columnIndex={shadesColor.index}
          isOpen={shadesColor !== null}
          onClose={() => setShadesColor(null)}
          onSelectShade={(newHex) => handleUpdateHex(shadesColor.color.id, newHex)}
        />
      )}

      {/* Accessibility / Contrast Modal */}
      <ContrastModal
        palette={palette}
        initialColor={contrastColor || palette[0]}
        isOpen={isContrastOpen}
        onClose={() => setIsContrastOpen(false)}
      />

      {/* Visualizer Mockups Modal */}
      <VisualizerModal
        palette={palette}
        isOpen={isVisualizerOpen}
        onClose={() => setIsVisualizerOpen(false)}
      />

      {/* Export Modal */}
      <ExportModal
        palette={palette}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Image Palette Extractor */}
      <ImageExtractorModal
        isOpen={isImageExtractorOpen}
        onClose={() => setIsImageExtractorOpen(false)}
        onApplyPalette={handleLoadPalette}
      />

      {/* Saved Palettes Library */}
      <SavedPalettesModal
        currentPalette={palette}
        savedPalettes={savedPalettes}
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        onLoadPalette={handleLoadPalette}
        onSaveCurrent={handleSaveCurrent}
        onDeletePalette={handleDeleteSaved}
      />

      {/* Shortcuts Guide */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
