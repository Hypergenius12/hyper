import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { rgbToHex } from '../utils/colorUtils';

interface ImageExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPalette: (hexes: string[]) => void;
}

const SAMPLE_IMAGES = [
  {
    title: 'Warm Sunset',
    url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Lush Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Neon Cyberpunk',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
  },
];

export const ImageExtractorModal: React.FC<ImageExtractorModalProps> = ({
  isOpen,
  onClose,
  onApplyPalette,
}) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>(SAMPLE_IMAGES[0].url);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [colorCount, setColorCount] = useState<number>(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractColorsFromImage = (imgSrc: string, count: number) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 120;
      const h = 120;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      try {
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const colorSamples: { r: number; g: number; b: number; count: number }[] = [];

        // Sample pixels with a step of 4
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue; // Skip transparency

          // Quantize into buckets of 24 to group similar colors
          const qR = Math.round(r / 24) * 24;
          const qG = Math.round(g / 24) * 24;
          const qB = Math.round(b / 24) * 24;

          const existing = colorSamples.find(
            s => Math.abs(s.r - qR) < 28 && Math.abs(s.g - qG) < 28 && Math.abs(s.b - qB) < 28
          );

          if (existing) {
            existing.count++;
          } else {
            colorSamples.push({ r: qR, g: qG, b: qB, count: 1 });
          }
        }

        // Sort by occurrence and pick diverse top colors
        colorSamples.sort((a, b) => b.count - a.count);

        const chosen: string[] = [];
        for (const sample of colorSamples) {
          const hex = rgbToHex(sample.r, sample.g, sample.b);
          if (!chosen.includes(hex)) {
            chosen.push(hex);
          }
          if (chosen.length >= count) break;
        }

        // If not enough unique, fill with variations
        while (chosen.length < count) {
          chosen.push('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase());
        }

        setExtractedColors(chosen);
      } catch (err) {
        console.error('Extraction error:', err);
      }
    };
    img.src = imgSrc;
  };

  useEffect(() => {
    if (isOpen && selectedImageUrl) {
      extractColorsFromImage(selectedImageUrl, colorCount);
    }
  }, [isOpen, selectedImageUrl, colorCount]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setSelectedImageUrl(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-500" />
            <div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                Extract Palette from Photo
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Upload any picture or choose a sample to extract harmonic colors
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

        {/* Hidden Canvas for Sampling */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Content */}
        <div className="p-4 md:p-5 overflow-y-auto min-h-0 space-y-4 flex-1">
          {/* Sample Photo Thumbnails */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Presets:</span>
            {SAMPLE_IMAGES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageUrl(sample.url)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  selectedImageUrl === sample.url
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-purple-400'
                }`}
              >
                {sample.title}
              </button>
            ))}

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="ml-auto text-xs px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Image Preview Box */}
          <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-inner flex items-center justify-center">
            <img
              src={selectedImageUrl}
              alt="Extraction Source"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Color Count Slider */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-zinc-600 dark:text-zinc-400">
              Palette Size: {colorCount} colors
            </span>
            <input
              type="range"
              min={3}
              max={8}
              value={colorCount}
              onChange={(e) => setColorCount(Number(e.target.value))}
              className="w-32 accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Extracted Swatches Strip */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
              Extracted Colors:
            </span>
            <div className="h-16 rounded-xl overflow-hidden flex shadow-md border border-black/10">
              {extractedColors.map((hex, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col justify-end items-center pb-2 text-[11px] font-mono font-bold tracking-tight"
                  style={{
                    backgroundColor: hex,
                    color: '#FFFFFF',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  <span>{hex.replace('#', '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApplyPalette(extractedColors);
              onClose();
            }}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center gap-2 transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Apply to Generator
          </button>
        </div>
      </div>
    </div>
  );
};
