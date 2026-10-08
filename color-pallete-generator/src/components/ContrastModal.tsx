import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Shuffle } from 'lucide-react';
import { ColorItem } from '../types';
import { getContrastRatio, getWcagRating, getReadableTextColor } from '../utils/colorUtils';

interface ContrastModalProps {
  palette: ColorItem[];
  initialColor?: ColorItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ContrastModal: React.FC<ContrastModalProps> = ({
  palette,
  initialColor,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [bgIndex, setBgIndex] = useState(
    initialColor ? Math.max(0, palette.findIndex(c => c.id === initialColor.id)) : 0
  );
  const [textIndex, setTextIndex] = useState(
    palette.length > 1 ? (bgIndex === 0 ? 1 : 0) : 0
  );

  const bgColor = palette[bgIndex]?.hex || '#FFFFFF';
  const textColor = palette[textIndex]?.hex || '#000000';

  const ratio = getContrastRatio(bgColor, textColor);
  const wcag = getWcagRating(ratio);

  const swapColors = () => {
    const temp = bgIndex;
    setBgIndex(textIndex);
    setTextIndex(temp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              Contrast & Accessibility Checker
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Evaluate WCAG 2.1 color contrast compliance between colors in your palette
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto min-h-0 space-y-6 flex-1">
          {/* Color Pair Selector */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            {/* Background Color Picker */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Background Color
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {palette.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setBgIndex(i)}
                    className={`w-9 h-9 rounded-lg border-2 transition-transform active:scale-90 ${
                      bgIndex === i ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' : 'border-black/10'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={`${c.name} (${c.hex})`}
                  />
                ))}
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center md:col-span-1">
              <button
                onClick={swapColors}
                title="Swap colors"
                className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors shadow-sm"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>

            {/* Text Color Picker */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Text / Foreground Color
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {palette.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setTextIndex(i)}
                    className={`w-9 h-9 rounded-lg border-2 transition-transform active:scale-90 ${
                      textIndex === i ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' : 'border-black/10'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={`${c.name} (${c.hex})`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Live Sample Box */}
          <div
            className="p-6 rounded-xl border shadow-sm transition-colors duration-200 flex flex-col justify-center gap-2"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            <div className="flex items-center justify-between border-b pb-3 border-current/20">
              <span className="text-xs font-mono uppercase tracking-widest font-bold opacity-80">
                Live Contrast Preview
              </span>
              <span className="text-sm font-mono font-bold">
                {ratio}:1 Ratio
              </span>
            </div>
            <h4 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Bold Headline Text
            </h4>
            <p className="text-base font-normal opacity-90 leading-relaxed">
              Good typography starts with readable contrast. This paragraph simulates regular body text readability (16px).
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                className="px-4 py-2 text-xs font-bold rounded-lg border border-current hover:opacity-80 transition-opacity"
              >
                Sample Button
              </button>
              <span className="text-xs font-mono opacity-70">
                BG: {bgColor} • TEXT: {textColor}
              </span>
            </div>
          </div>

          {/* WCAG Compliance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
              <div className="text-xs font-semibold text-zinc-500">Normal Text (AA)</div>
              <div className="flex items-center gap-1.5 mt-2">
                {wcag.aaNormal ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Pass (4.5:1)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" />
                    <span className="font-bold text-rose-600 dark:text-rose-400">Fail (&lt;4.5:1)</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
              <div className="text-xs font-semibold text-zinc-500">Large Text (AA)</div>
              <div className="flex items-center gap-1.5 mt-2">
                {wcag.aaLarge ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Pass (3.0:1)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" />
                    <span className="font-bold text-rose-600 dark:text-rose-400">Fail (&lt;3.0:1)</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
              <div className="text-xs font-semibold text-zinc-500">Normal Text (AAA)</div>
              <div className="flex items-center gap-1.5 mt-2">
                {wcag.aaaNormal ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Pass (7.0:1)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-amber-600 dark:text-amber-400">Fail (&lt;7.0:1)</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
              <div className="text-xs font-semibold text-zinc-500">Overall Rating</div>
              <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
                {wcag.badge}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Close Checker
          </button>
        </div>
      </div>
    </div>
  );
};
