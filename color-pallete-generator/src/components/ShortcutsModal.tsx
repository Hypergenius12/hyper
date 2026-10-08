import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Spacebar', desc: 'Generate a new color palette' },
    { key: '← / →', desc: 'Undo / Redo previously generated palettes' },
    { key: 'Click Hex', desc: 'Copy color value to clipboard' },
    { key: 'Double Click Hex', desc: 'Directly edit HEX code' },
    { key: 'Lock Icon', desc: 'Lock color in place while generating' },
    { key: '+ (between columns)', desc: 'Insert intermediate harmonious color' },
    { key: 'Grid Icon', desc: 'View 20+ tints and shades of a color' },
    { key: 'Shield Icon', desc: 'Check WCAG contrast & accessibility' },
    { key: 'Pipette Icon', desc: 'Open native color wheel / eyedropper' },
    { key: 'Esc', desc: 'Close any open modal or cancel editing' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              Keyboard Shortcuts & Controls
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs overflow-y-auto min-h-0 flex-1">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-bold text-zinc-800 dark:text-zinc-200 shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
          Tip: Hit <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono font-bold">Space</kbd> anytime to get fresh colors!
        </div>
      </div>
    </div>
  );
};
