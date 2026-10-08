import React from 'react';
import { X, Check } from 'lucide-react';
import { ColorItem } from '../types';
import { generateShades, getReadableTextColor, normalizeHex } from '../utils/colorUtils';

interface ShadesModalProps {
  color: ColorItem;
  columnIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectShade: (newHex: string) => void;
}

export const ShadesModal: React.FC<ShadesModalProps> = ({
  color,
  columnIndex,
  isOpen,
  onClose,
  onSelectShade,
}) => {
  if (!isOpen) return null;

  const shades = generateShades(color.hex, 25);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Shades & Tints</span>
              <span
                className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-inner"
                style={{ backgroundColor: color.hex }}
              />
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {color.name} ({color.hex}) - Column {columnIndex + 1}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shades Ladder */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-black/5 dark:divide-white/5">
          {shades.map((shadeHex, idx) => {
            const isCurrent = normalizeHex(shadeHex) === normalizeHex(color.hex);
            const textColor = getReadableTextColor(shadeHex);

            return (
              <button
                key={idx}
                onClick={() => {
                  onSelectShade(shadeHex);
                  onClose();
                }}
                className="w-full h-11 px-5 flex items-center justify-between transition-transform active:scale-[0.99] hover:brightness-105"
                style={{
                  backgroundColor: shadeHex,
                  color: textColor,
                }}
              >
                <span className="font-mono font-bold text-sm tracking-wider uppercase">
                  {shadeHex}
                </span>

                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-xs font-semibold py-0.5 px-2 rounded-full bg-black/20 backdrop-blur-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Current
                    </span>
                  )}
                  <span className="text-xs font-mono opacity-60">
                    {Math.round(((shades.length - idx) / shades.length) * 100)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 text-center text-xs text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
          Click any tint or shade to replace this color
        </div>
      </div>
    </div>
  );
};
