import React from 'react';
import {
  Sparkles,
  Undo2,
  Redo2,
  Eye,
  SlidersHorizontal,
  Share2,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import { ColorBlindnessType, DisplayFormat, HarmonyMode } from '../types';

interface NavbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onGenerate: () => void;
  colorCount: number;
  onColorCountChange: (newCount: number) => void;
  harmonyMode: HarmonyMode;
  onHarmonyModeChange: (mode: HarmonyMode) => void;
  colorBlindness: ColorBlindnessType;
  onColorBlindnessChange: (type: ColorBlindnessType) => void;
  format: DisplayFormat;
  onFormatChange: (format: DisplayFormat) => void;
  onOpenVisualizer: () => void;
  onOpenContrast: () => void;
  onOpenImageExtractor: () => void;
  onOpenSaved: () => void;
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onGenerate,
  colorCount,
  onColorCountChange,
  harmonyMode,
  onHarmonyModeChange,
  colorBlindness,
  onColorBlindnessChange,
  format,
  onFormatChange,
  onOpenVisualizer,
  onOpenContrast,
  onOpenImageExtractor,
  onOpenSaved,
  onOpenExport,
  onOpenShortcuts,
  savedCount,
}) => {
  return (
    <header className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-2.5 md:px-4 py-2 flex items-center justify-between gap-2 z-20 shadow-xs overflow-x-auto no-scrollbar">
      {/* Brand & Spacebar Hint */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2 font-black text-base md:text-xl tracking-tight text-zinc-900 dark:text-zinc-100 select-none">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-pink-500 via-amber-400 to-indigo-600 shadow-sm flex items-center justify-center text-white shrink-0">
            <span className="text-xs font-black">C</span>
          </div>
          <span className="hidden sm:inline">ChromaCraft</span>
        </div>

        {/* Spacebar Callout Badge */}
        <div
          onClick={onGenerate}
          title="Click or press Spacebar to generate"
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors shrink-0"
        >
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono font-bold shadow-xs">
            SPACEBAR
          </kbd>
          <span>to generate</span>
        </div>
      </div>

      {/* Middle Controls (History, Color Count, Harmony Mode, Format) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z or Left Arrow)"
            className={`p-1.5 rounded-md transition-colors ${
              canUndo
                ? 'hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                : 'opacity-30 cursor-not-allowed text-zinc-400'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y or Right Arrow)"
            className={`p-1.5 rounded-md transition-colors ${
              canRedo
                ? 'hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                : 'opacity-30 cursor-not-allowed text-zinc-400'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Number of Colors Adjuster */}
        <div className="hidden sm:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <button
            onClick={() => onColorCountChange(colorCount - 1)}
            disabled={colorCount <= 2}
            title="Decrease colors"
            className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono px-1">{colorCount} colors</span>
          <button
            onClick={() => onColorCountChange(colorCount + 1)}
            disabled={colorCount >= 10}
            title="Increase colors"
            className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Theme & Harmony Mode Dropdown */}
        <div className="relative">
          <select
            value={harmonyMode}
            onChange={(e) => onHarmonyModeChange(e.target.value as HarmonyMode)}
            className="text-xs font-semibold py-1.5 pl-2.5 pr-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 appearance-none cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors focus:outline-none"
            title="Palette Theme & Harmony Mode"
          >
            <option value="balanced">✨ Auto Curated (Themed)</option>
            <option value="sunset">🌅 Sunset & Terracotta</option>
            <option value="forest">🌿 Forest & Sage</option>
            <option value="ocean">🌊 Ocean & Azure</option>
            <option value="coffee">☕ Coffee & Warm Neutrals</option>
            <option value="retro">📻 Retro 70s</option>
            <option value="pastel">🍬 Pastel Dream</option>
            <option value="cyberpunk">🌌 Cyberpunk Neon</option>
            <option value="luxury">👑 Dark Luxury</option>
            <option value="autumn">🍂 Autumn Harvest</option>
            <option value="nordic">🏔️ Nordic Minimal</option>
            <option value="desert">🏜️ Desert Dune</option>
            <option value="monochromatic">🎭 Monochromatic</option>
            <option value="analogous">🌈 Analogous Flow</option>
            <option value="complementary">⚖️ Complementary</option>
            <option value="random">🎲 Pure Random</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-[10px]">
            ▼
          </div>
        </div>

        {/* Display Format Dropdown (HEX, RGB, HSL...) */}
        <div className="hidden md:block relative">
          <select
            value={format}
            onChange={(e) => onFormatChange(e.target.value as DisplayFormat)}
            className="text-xs font-semibold py-1.5 pl-2.5 pr-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 appearance-none cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors uppercase font-mono"
            title="Display Format"
          >
            <option value="hex">HEX</option>
            <option value="rgb">RGB</option>
            <option value="hsl">HSL</option>
            <option value="cmyk">CMYK</option>
            <option value="lab">LAB</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-[10px]">
            ▼
          </div>
        </div>

        {/* Color Blindness Filter Dropdown */}
        <div className="hidden lg:block relative">
          <select
            value={colorBlindness}
            onChange={(e) => onColorBlindnessChange(e.target.value as ColorBlindnessType)}
            className={`text-xs font-semibold py-1.5 pl-2.5 pr-6 rounded-lg border appearance-none cursor-pointer transition-colors ${
              colorBlindness !== 'none'
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
            }`}
            title="Simulate Color Blindness"
          >
            <option value="none">Color Vision: Normal</option>
            <option value="protanopia">Protanopia (Red-blind)</option>
            <option value="protanomaly">Protanomaly (Red-weak)</option>
            <option value="deuteranopia">Deuteranopia (Green-blind)</option>
            <option value="deuteranomaly">Deuteranomaly (Green-weak)</option>
            <option value="tritanopia">Tritanopia (Blue-blind)</option>
            <option value="tritanomaly">Tritanomaly (Blue-weak)</option>
            <option value="achromatopsia">Achromatopsia (Monochrome)</option>
            <option value="achromatomaly">Achromatomaly (Partial)</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-[10px]">
            ▼
          </div>
        </div>
      </div>

      {/* Right Tools (Visualizer, Contrast, Photo Extract, Saved, Export) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Visualizer Mockups Button */}
        <button
          onClick={onOpenVisualizer}
          title="Preview palette on website & mobile mockups"
          className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Contrast Checker Button */}
        <button
          onClick={onOpenContrast}
          title="WCAG Contrast Checker"
          className="hidden sm:flex p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>

        {/* Extract from Image Button */}
        <button
          onClick={onOpenImageExtractor}
          title="Extract palette from image / photo"
          className="hidden sm:flex p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Saved Palettes Heart */}
        <button
          onClick={onOpenSaved}
          title={`Saved Palettes (${savedCount})`}
          className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors relative"
        >
          <Heart className={`w-4 h-4 ${savedCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
          {savedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          title="Export palette (PNG, SVG, CSS, Tailwind, URL)"
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Keyboard Shortcuts Help */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts & guide"
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Mobile Generate Button */}
        <button
          onClick={onGenerate}
          title="Generate new palette"
          className="lg:hidden px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gen</span>
        </button>
      </div>
    </header>
  );
};
