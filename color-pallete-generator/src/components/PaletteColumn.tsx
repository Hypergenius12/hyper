import React, { useState, useRef } from 'react';
import {
  Lock,
  Unlock,
  X,
  Grid,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Pipette,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { ColorItem, DisplayFormat } from '../types';
import {
  formatColorValue,
  getReadableTextColor,
  getContrastRatio,
  getWcagRating,
  isValidHex,
  normalizeHex
} from '../utils/colorUtils';

interface PaletteColumnProps {
  color: ColorItem;
  displayHex: string;
  index: number;
  totalColors: number;
  format: DisplayFormat;
  onToggleLock: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'left' | 'right') => void;
  onOpenShades: (color: ColorItem, index: number) => void;
  onOpenContrast: (color: ColorItem) => void;
  onUpdateHex: (id: string, newHex: string) => void;
  onInsertAfter?: (index: number) => void;
}

export const PaletteColumn: React.FC<PaletteColumnProps> = ({
  color,
  displayHex,
  index,
  totalColors,
  format,
  onToggleLock,
  onRemove,
  onMove,
  onOpenShades,
  onOpenContrast,
  onUpdateHex,
  onInsertAfter
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(color.hex);
  const [isHovered, setIsHovered] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const textColor = getReadableTextColor(displayHex);
  const isDarkText = textColor === '#000000';
  const contrastRatio = getContrastRatio(displayHex, textColor);
  const wcag = getWcagRating(contrastRatio);

  const formattedValue = formatColorValue(displayHex, format);

  const handleCopy = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(formattedValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleHexSubmit = () => {
    if (isValidHex(editValue)) {
      onUpdateHex(color.id, normalizeHex(editValue));
    } else {
      setEditValue(color.hex);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleHexSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(color.hex);
      setIsEditing(false);
    }
  };

  // Dynamic text size based on number of colors to prevent horizontal clipping
  const getHexTextSize = () => {
    if (format !== 'hex') return 'text-xs md:text-sm';
    if (totalColors <= 5) return 'text-lg md:text-2xl';
    if (totalColors <= 7) return 'text-base md:text-xl';
    return 'text-xs md:text-base';
  };

  return (
    <div
      className="relative flex-1 flex flex-col justify-between items-center transition-colors duration-200 min-h-[380px] md:min-h-0 h-full group select-none min-w-0"
      style={{ backgroundColor: displayHex }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Action Tools: Vertically stacked on narrow columns or adaptive to never clip */}
      <div
        className={`w-full pt-3 md:pt-4 px-1 flex justify-center transition-all duration-200 z-10 ${
          isHovered
            ? 'opacity-100 translate-y-0'
            : 'opacity-70 md:opacity-0 md:-translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
        }`}
      >
        <div
          className={`flex items-center justify-center p-1 rounded-2xl backdrop-blur-md shadow-md border ${
            totalColors > 6 ? 'flex-col gap-1' : 'flex-wrap sm:flex-nowrap gap-1'
          }`}
          style={{
            backgroundColor: isDarkText ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.45)',
            borderColor: isDarkText ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.18)',
            color: textColor
          }}
        >
          {/* Remove column button */}
          <button
            onClick={() => onRemove(color.id)}
            disabled={totalColors <= 2}
            title={totalColors <= 2 ? "Minimum 2 colors" : "Remove color (X)"}
            className={`p-1.5 rounded-lg transition-transform active:scale-90 ${
              totalColors <= 2
                ? 'opacity-25 cursor-not-allowed'
                : 'hover:bg-black/15 dark:hover:bg-white/15'
            }`}
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>

          {/* View shades ladder */}
          <button
            onClick={() => onOpenShades(color, index)}
            title="View shades & tints"
            className="p-1.5 rounded-lg hover:bg-black/15 dark:hover:bg-white/15 transition-transform active:scale-90"
          >
            <Grid className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>

          {/* Move Left */}
          <button
            onClick={() => onMove(index, 'left')}
            disabled={index === 0}
            title="Move left"
            className={`p-1.5 rounded-lg transition-transform active:scale-90 ${
              index === 0 ? 'opacity-25 cursor-not-allowed' : 'hover:bg-black/15 dark:hover:bg-white/15'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>

          {/* Move Right */}
          <button
            onClick={() => onMove(index, 'right')}
            disabled={index === totalColors - 1}
            title="Move right"
            className={`p-1.5 rounded-lg transition-transform active:scale-90 ${
              index === totalColors - 1
                ? 'opacity-25 cursor-not-allowed'
                : 'hover:bg-black/15 dark:hover:bg-white/15'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>

          {/* Contrast checker preview */}
          <button
            onClick={() => onOpenContrast(color)}
            title={`Contrast against text: ${contrastRatio}:1 (${wcag.badge})`}
            className="p-1.5 rounded-lg hover:bg-black/15 dark:hover:bg-white/15 transition-transform active:scale-90"
          >
            <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>

          {/* Color Picker launcher */}
          <button
            onClick={() => colorInputRef.current?.click()}
            title="Pick custom color"
            className="p-1.5 rounded-lg hover:bg-black/15 dark:hover:bg-white/15 transition-transform active:scale-90 relative"
          >
            <Pipette className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <input
              ref={colorInputRef}
              type="color"
              value={color.hex}
              onChange={(e) => onUpdateHex(color.id, normalizeHex(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
            />
          </button>
        </div>
      </div>

      {/* Lock Button (Iconic Center Lock) */}
      <div className="z-10 flex flex-col items-center my-auto py-2">
        <button
          onClick={() => onToggleLock(color.id)}
          title={color.locked ? "Unlock color" : "Lock color (stays on spacebar)"}
          className={`p-3 md:p-3.5 rounded-full backdrop-blur-md transition-all duration-200 transform active:scale-95 shadow-md flex items-center justify-center ${
            color.locked
              ? 'scale-105 ring-2'
              : 'opacity-70 md:opacity-30 group-hover:opacity-100 hover:scale-105'
          }`}
          style={{
            backgroundColor: isDarkText ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.4)',
            color: textColor,
            borderColor: textColor,
            // @ts-ignore
            '--tw-ring-color': textColor,
          }}
        >
          {color.locked ? (
            <Lock className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
          ) : (
            <Unlock className="w-4 h-4 md:w-5 md:h-5 stroke-[2]" />
          )}
        </button>
        {color.locked && (
          <span
            className="text-[9px] uppercase font-bold tracking-widest mt-1 opacity-85"
            style={{ color: textColor }}
          >
            Locked
          </span>
        )}
      </div>

      {/* Bottom Color Code & Name Info: fully responsive to avoid overflow */}
      <div
        className="w-full pb-6 md:pb-8 px-1.5 flex flex-col items-center text-center z-10 min-w-0"
        style={{ color: textColor }}
      >
        {/* Copied notification bubble */}
        {copied && (
          <div
            className="mb-1.5 py-0.5 px-2.5 text-[10px] font-bold rounded-full shadow-lg flex items-center gap-1 animate-bounce"
            style={{
              backgroundColor: textColor,
              color: displayHex,
            }}
          >
            <Check className="w-3 h-3" />
            <span>COPIED!</span>
          </div>
        )}

        {/* Color Value */}
        {isEditing ? (
          <div className="flex items-center justify-center max-w-full px-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleHexSubmit}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-24 text-center font-mono font-bold py-1 px-1 rounded bg-black/20 backdrop-blur-sm border border-current outline-none text-sm"
              style={{ color: textColor }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center max-w-full px-1">
            <button
              onClick={handleCopy}
              onDoubleClick={() => {
                setEditValue(color.hex);
                setIsEditing(true);
              }}
              title="Click to copy, double click to edit"
              className={`group/val flex items-center gap-1 font-mono font-black tracking-wide uppercase hover:opacity-80 transition-opacity max-w-full ${getHexTextSize()}`}
            >
              <span className="truncate">{format === 'hex' ? displayHex.replace('#', '') : formattedValue}</span>
              <Copy className="w-3 h-3 opacity-0 group-hover/val:opacity-80 transition-opacity shrink-0 hidden sm:inline" />
            </button>
          </div>
        )}

        {/* Color Name */}
        <p className="text-[11px] md:text-xs font-semibold tracking-tight mt-1 opacity-85 max-w-full px-1 truncate">
          {color.name}
        </p>

        {/* Format & WCAG Badge */}
        <div className="flex items-center gap-1.5 mt-1 opacity-70 hover:opacity-100 transition-opacity text-[10px] font-mono">
          <span className="uppercase">{format}</span>
          <span>•</span>
          <span className="font-bold">{wcag.badge}</span>
        </div>
      </div>

      {/* Floating "+" Button Between Columns: clean absolute overlay with no clip */}
      {onInsertAfter && index < totalColors - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInsertAfter(index);
          }}
          title="Add color here (+)"
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-40 w-7 h-7 rounded-full items-center justify-center cursor-pointer bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-xl border border-zinc-300 dark:border-zinc-700 opacity-0 group-hover:opacity-75 hover:!opacity-100 hover:scale-115 active:scale-95 transition-all duration-150"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      )}
    </div>
  );
};
