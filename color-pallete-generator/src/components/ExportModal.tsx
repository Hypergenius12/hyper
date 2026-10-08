import React, { useState, useRef } from 'react';
import { X, Copy, Check, Download, Image, Code, FileText, Link2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ColorItem } from '../types';
import { getReadableTextColor } from '../utils/colorUtils';

interface ExportModalProps {
  palette: ColorItem[];
  isOpen: boolean;
  onClose: () => void;
}

type ExportType = 'png' | 'svg' | 'css' | 'tailwind' | 'json' | 'link' | 'txt';

export const ExportModal: React.FC<ExportModalProps> = ({
  palette,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<ExportType>('png');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen || palette.length === 0) return null;

  const hexList = palette.map(c => c.hex);
  const urlHash = hexList.map(h => h.replace('#', '').toLowerCase()).join('-');
  const shareableUrl = `${window.location.origin}${window.location.pathname}#${urlHash}`;

  // CSS variables format
  const cssCode = `:root {\n${palette
    .map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.name} */`)
    .join('\n')}\n}`;

  // Tailwind configuration format
  const tailwindCode = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${palette
    .map(
      (c, i) =>
        `        'palette-${i + 1}': '${c.hex}', // ${c.name}`
    )
    .join('\n')}\n      }\n    }\n  }\n};`;

  // JSON format
  const jsonCode = JSON.stringify(
    palette.map(c => ({
      name: c.name,
      hex: c.hex,
    })),
    null,
    2
  );

  // Plain text
  const textCode = palette.map(c => `${c.hex} - ${c.name}`).join('\n');

  // SVG representation
  const width = 1200;
  const height = 630;
  const colWidth = width / palette.length;
  const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${palette
  .map((c, i) => {
    const x = i * colWidth;
    const txtColor = getReadableTextColor(c.hex);
    return `  <g>
    <rect x="${x}" y="0" width="${colWidth}" height="${height}" fill="${c.hex}" />
    <text x="${x + colWidth / 2}" y="${height - 70}" fill="${txtColor}" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle">${c.hex.replace('#', '')}</text>
    <text x="${x + colWidth / 2}" y="${height - 35}" fill="${txtColor}" font-family="sans-serif" font-size="18" opacity="0.85" text-anchor="middle">${c.name}</text>
  </g>`;
  })
  .join('\n')}
</svg>`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
    });
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    const w = 1600;
    const h = 900;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colW = w / palette.length;

    // Draw background columns
    palette.forEach((col, i) => {
      ctx.fillStyle = col.hex;
      ctx.fillRect(i * colW, 0, colW, h);

      // Draw text
      const textColor = getReadableTextColor(col.hex);
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';

      // Hex code
      ctx.font = 'bold 36px "JetBrains Mono", monospace';
      ctx.fillText(col.hex.replace('#', ''), i * colW + colW / 2, h - 110);

      // Color name
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(col.name, i * colW + colW / 2, h - 60);
    });

    const link = document.createElement('a');
    link.download = `chromacraft-palette-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chromacraft-palette-${Date.now()}.svg`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              Export Palette
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Export to your favorite design format, code framework, or image
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('png')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'png'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            Image (PNG)
          </button>
          <button
            onClick={() => setActiveTab('svg')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'svg'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Vector (SVG)
          </button>
          <button
            onClick={() => setActiveTab('css')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'css'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            CSS Variables
          </button>
          <button
            onClick={() => setActiveTab('tailwind')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'tailwind'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            Tailwind
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'json'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            JSON
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'link'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Share URL
          </button>
          <button
            onClick={() => setActiveTab('txt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'txt'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Plain Text
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto min-h-0 space-y-4">
          {/* Mini preview bar */}
          <div className="h-14 rounded-xl overflow-hidden flex shadow-inner border border-black/10">
            {palette.map(c => (
              <div
                key={c.id}
                className="flex-1 flex flex-col justify-end p-1.5 font-mono text-[10px] font-bold"
                style={{
                  backgroundColor: c.hex,
                  color: getReadableTextColor(c.hex),
                }}
              >
                <span>{c.hex.replace('#', '')}</span>
              </div>
            ))}
          </div>

          {activeTab === 'png' && (
            <div className="space-y-4 text-center py-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Download a crisp 1600x900 graphic card with all colors, names, and hex codes.
              </p>
              <button
                onClick={handleDownloadPng}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 mx-auto shadow-md transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download PNG Image
              </button>
            </div>
          )}

          {activeTab === 'svg' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 font-mono">1200 x 630 vector</span>
                <button
                  onClick={handleDownloadSvg}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .svg file
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-950 text-xs font-mono overflow-x-auto max-h-56 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800">
                {svgCode}
              </pre>
            </div>
          )}

          {activeTab === 'css' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => handleCopy(cssCode)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy CSS'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-950 text-xs font-mono overflow-x-auto max-h-56 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800">
                {cssCode}
              </pre>
            </div>
          )}

          {activeTab === 'tailwind' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => handleCopy(tailwindCode)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Tailwind Config'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-950 text-xs font-mono overflow-x-auto max-h-56 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800">
                {tailwindCode}
              </pre>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => handleCopy(jsonCode)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-950 text-xs font-mono overflow-x-auto max-h-56 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800">
                {jsonCode}
              </pre>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Share this URL to reload this exact palette anytime:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="flex-1 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs text-zinc-700 dark:text-zinc-300"
                />
                <button
                  onClick={() => handleCopy(shareableUrl)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'txt' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => handleCopy(textCode)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-950 text-xs font-mono overflow-x-auto max-h-56 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800">
                {textCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
