import React, { useState } from 'react';
import { X, Trash2, ArrowUpRight, Copy, Check, Heart, Plus } from 'lucide-react';
import { ColorItem, SavedPalette } from '../types';

interface SavedPalettesModalProps {
  currentPalette: ColorItem[];
  savedPalettes: SavedPalette[];
  isOpen: boolean;
  onClose: () => void;
  onLoadPalette: (colors: string[]) => void;
  onSaveCurrent: (name: string) => void;
  onDeletePalette: (id: string) => void;
}

export const SavedPalettesModal: React.FC<SavedPalettesModalProps> = ({
  currentPalette,
  savedPalettes,
  isOpen,
  onClose,
  onLoadPalette,
  onSaveCurrent,
  onDeletePalette,
}) => {
  const [newPaletteName, setNewPaletteName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPaletteName.trim() || `Palette #${savedPalettes.length + 1}`;
    onSaveCurrent(name);
    setNewPaletteName('');
  };

  const handleCopyPalette = (palette: SavedPalette) => {
    navigator.clipboard.writeText(palette.colors.join(', '));
    setCopiedId(palette.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                Saved Palettes Library ({savedPalettes.length})
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Save your favorite palettes and reload them anytime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Save Current Palette Bar */}
        <form
          onSubmit={handleSave}
          className="p-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex gap-2 items-center shrink-0"
        >
          <div className="flex -space-x-1 overflow-hidden pr-2">
            {currentPalette.map(c => (
              <div
                key={c.id}
                className="w-5 h-5 rounded-full border border-white dark:border-zinc-900 shadow-sm"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <input
            type="text"
            placeholder="Name current palette (e.g. Midnight Cyberpunk)..."
            value={newPaletteName}
            onChange={(e) => setNewPaletteName(e.target.value)}
            className="flex-1 text-xs py-2 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Save Current
          </button>
        </form>

        {/* List of Saved Palettes */}
        <div className="p-4 flex-1 overflow-y-auto min-h-0 space-y-3">
          {savedPalettes.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 space-y-2">
              <Heart className="w-8 h-8 mx-auto stroke-1 opacity-50" />
              <p className="text-sm font-semibold">No saved palettes yet</p>
              <p className="text-xs">
                Click "Save Current" above or use the heart icon to bookmark palettes.
              </p>
            </div>
          ) : (
            savedPalettes.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all bg-white dark:bg-zinc-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100 truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Swatches strip */}
                  <div className="h-8 rounded-lg overflow-hidden flex shadow-inner border border-black/10">
                    {item.colors.map((hex, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    onClick={() => handleCopyPalette(item)}
                    title="Copy hex codes"
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => onDeletePalette(item.id)}
                    title="Delete saved palette"
                    className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      onLoadPalette(item.colors);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    <span>Load</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
