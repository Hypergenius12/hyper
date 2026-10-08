import React, { useState } from 'react';
import {
  X,
  Layout,
  Smartphone,
  Sparkles,
  Layers,
  Copy,
  Check,
  TrendingUp,
  Heart,
  Share2,
  Calendar,
  Compass
} from 'lucide-react';
import { ColorItem } from '../types';
import { getReadableTextColor } from '../utils/colorUtils';

interface VisualizerModalProps {
  palette: ColorItem[];
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'website' | 'mobile' | 'poster' | 'gradients';

export const VisualizerModal: React.FC<VisualizerModalProps> = ({
  palette,
  isOpen,
  onClose,
}) => {
  const [tab, setTab] = useState<TabType>('website');
  const [copiedGradient, setCopiedGradient] = useState(false);

  if (!isOpen || palette.length === 0) return null;

  const c0 = palette[0]?.hex || '#1E293B';
  const c1 = palette[1]?.hex || '#0EA5E9';
  const c2 = palette[2]?.hex || '#F59E0B';
  const c3 = palette[3]?.hex || '#10B981';
  const c4 = palette[4]?.hex || '#8B5CF6';

  const c0Text = getReadableTextColor(c0);
  const c1Text = getReadableTextColor(c1);
  const c2Text = getReadableTextColor(c2);

  const linearGradientCss = `linear-gradient(135deg, ${palette.map(c => c.hex).join(', ')})`;
  const meshGradientCss = `radial-gradient(circle at 10% 20%, ${c0} 0%, transparent 40%),
radial-gradient(circle at 90% 80%, ${c1} 0%, transparent 45%),
radial-gradient(circle at 50% 50%, ${c2} 0%, transparent 50%),
radial-gradient(circle at 80% 20%, ${c3} 0%, transparent 40%),
${c4}`;

  const copyGradient = (css: string) => {
    navigator.clipboard.writeText(`background: ${css};`);
    setCopiedGradient(true);
    setTimeout(() => setCopiedGradient(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-base md:text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
              Palette Visualizer
            </h3>

            {/* Quick mini palette strip */}
            <div className="hidden sm:flex items-center gap-1">
              {palette.map((c) => (
                <div
                  key={c.id}
                  className="w-4 h-4 rounded-full border border-black/10 shadow-sm shrink-0"
                  style={{ backgroundColor: c.hex }}
                  title={`${c.name} (${c.hex})`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* View Tabs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar">
              <button
                onClick={() => setTab('website')}
                className={`px-2.5 md:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                  tab === 'website'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                Website
              </button>
              <button
                onClick={() => setTab('mobile')}
                className={`px-2.5 md:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                  tab === 'mobile'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile App
              </button>
              <button
                onClick={() => setTab('poster')}
                className={`px-2.5 md:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                  tab === 'poster'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Poster Art
              </button>
              <button
                onClick={() => setTab('gradients')}
                className={`px-2.5 md:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                  tab === 'gradients'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Gradients
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8 bg-zinc-100 dark:bg-zinc-900 flex justify-center items-start">
          {tab === 'website' && (
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-black/10 flex flex-col text-slate-800">
              {/* Fake Browser Top Bar */}
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 max-w-xs mx-auto bg-white rounded-md px-3 py-0.5 text-xs text-slate-400 font-mono text-center shadow-inner">
                  https://your-product.com
                </div>
              </div>

              {/* Website Navbar */}
              <header
                className="px-6 py-4 flex items-center justify-between"
                style={{ backgroundColor: c0, color: c0Text }}
              >
                <div className="font-extrabold text-xl tracking-tight flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c2 }} />
                  Aurora Studio
                </div>
                <nav className="flex items-center gap-5 text-sm font-semibold opacity-90">
                  <span className="cursor-pointer hover:underline">Features</span>
                  <span className="cursor-pointer hover:underline">Showcase</span>
                  <span className="cursor-pointer hover:underline">Pricing</span>
                </nav>
                <button
                  className="px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-95"
                  style={{ backgroundColor: c1, color: c1Text }}
                >
                  Get Started
                </button>
              </header>

              {/* Hero Section */}
              <div className="p-8 md:p-12 text-center flex flex-col items-center gap-4 bg-slate-50">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm"
                  style={{ backgroundColor: c2, color: c2Text }}
                >
                  Introducing Next-Gen Design
                </span>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight max-w-2xl text-slate-900 leading-tight">
                  Design beautiful experiences with harmonic color.
                </h1>
                <p className="text-base text-slate-600 max-w-xl">
                  Empower your creative process with instant palette inspiration, dynamic contrast audits, and visual fidelity checks.
                </p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    className="px-6 py-3 rounded-xl font-bold shadow-md transition-transform active:scale-95"
                    style={{ backgroundColor: c0, color: c0Text }}
                  >
                    Start Free Trial
                  </button>
                  <button
                    className="px-6 py-3 rounded-xl font-bold border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 transition-colors"
                  >
                    Explore Documentation
                  </button>
                </div>
              </div>

              {/* Feature Cards Grid */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
                <div
                  className="p-6 rounded-2xl border transition-all shadow-sm"
                  style={{ borderColor: `${c1}40`, backgroundColor: `${c1}08` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold mb-4 shadow-sm"
                    style={{ backgroundColor: c1, color: c1Text }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-slate-900">Perceptual Contrast</h3>
                  <p className="text-sm text-slate-600">
                    Precision color theory calculations ensuring WCAG 2.1 compliance.
                  </p>
                </div>

                <div
                  className="p-6 rounded-2xl border transition-all shadow-sm"
                  style={{ borderColor: `${c2}40`, backgroundColor: `${c2}08` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold mb-4 shadow-sm"
                    style={{ backgroundColor: c2, color: c2Text }}
                  >
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-slate-900">Export Anywhere</h3>
                  <p className="text-sm text-slate-600">
                    Export directly into CSS, Tailwind configs, SVG, or high-res cards.
                  </p>
                </div>

                <div
                  className="p-6 rounded-2xl border transition-all shadow-sm"
                  style={{ borderColor: `${c3}40`, backgroundColor: `${c3}08` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold mb-4 shadow-sm"
                    style={{ backgroundColor: c3, color: getReadableTextColor(c3) }}
                  >
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-slate-900">Adaptive Themes</h3>
                  <p className="text-sm text-slate-600">
                    Seamlessly test light and dark variations across your visual assets.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'mobile' && (
            <div className="w-80 bg-slate-900 text-white rounded-[40px] p-4 shadow-2xl border-4 border-slate-800">
              {/* Notch */}
              <div className="w-28 h-5 bg-black rounded-full mx-auto mb-4" />

              {/* App Screen Content */}
              <div className="space-y-4 px-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Welcome Back</span>
                    <h2 className="text-lg font-bold">Alex Mercer</h2>
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md"
                    style={{ backgroundColor: c1, color: c1Text }}
                  >
                    AM
                  </div>
                </div>

                {/* Main Card */}
                <div
                  className="p-5 rounded-3xl shadow-lg relative overflow-hidden"
                  style={{ backgroundColor: c0, color: c0Text }}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs uppercase font-mono tracking-wider opacity-80">
                      Portfolio Balance
                    </span>
                    <TrendingUp className="w-5 h-5 opacity-80" />
                  </div>
                  <div className="text-2xl font-black mt-2 font-mono">
                    $14,892.40
                  </div>
                  <div className="text-xs opacity-75 mt-1 font-mono">
                    +18.4% this month
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 py-2 rounded-xl text-xs font-bold shadow-sm"
                      style={{ backgroundColor: c2, color: c2Text }}
                    >
                      Deposit
                    </button>
                    <button
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/20 backdrop-blur-sm"
                    >
                      Transfer
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3.5 rounded-2xl"
                    style={{ backgroundColor: `${c1}25`, borderColor: `${c1}40` }}
                  >
                    <span className="text-xs opacity-80 block">Activity</span>
                    <span className="text-lg font-bold font-mono" style={{ color: c1 }}>
                      2,480 pts
                    </span>
                  </div>
                  <div
                    className="p-3.5 rounded-2xl"
                    style={{ backgroundColor: `${c3}25`, borderColor: `${c3}40` }}
                  >
                    <span className="text-xs opacity-80 block">Streak</span>
                    <span className="text-lg font-bold font-mono" style={{ color: c3 }}>
                      14 Days 🔥
                    </span>
                  </div>
                </div>

                {/* Bottom navigation pill */}
                <div className="bg-slate-800 rounded-full p-2 flex justify-around items-center text-slate-400">
                  <Compass className="w-5 h-5" style={{ color: c1 }} />
                  <Heart className="w-5 h-5" />
                  <Calendar className="w-5 h-5" />
                  <Share2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {tab === 'poster' && (
            <div
              className="w-full max-w-md aspect-[3/4] rounded-2xl shadow-2xl p-8 flex flex-col justify-between relative overflow-hidden"
              style={{ backgroundColor: c0, color: c0Text }}
            >
              {/* Graphic background shapes */}
              <div
                className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-40 blur-2xl"
                style={{ backgroundColor: c1 }}
              />
              <div
                className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full opacity-40 blur-2xl"
                style={{ backgroundColor: c2 }}
              />

              <div className="z-10 flex justify-between items-start font-mono text-xs uppercase tracking-widest opacity-80">
                <span>Issue Nº 42</span>
                <span>Visual Arts Exhibition</span>
              </div>

              <div className="z-10 my-auto space-y-3">
                <div
                  className="w-16 h-2 rounded-full mb-4"
                  style={{ backgroundColor: c2 }}
                />
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none uppercase">
                  Harmonic <br />
                  <span style={{ color: c1 }}>Spectrum</span>
                </h2>
                <p className="text-sm opacity-80 max-w-xs font-mono">
                  An exploration of chromatic resonance, dynamic visual hierarchy, and emotion through color.
                </p>
              </div>

              <div className="z-10 pt-6 border-t border-current/20 flex justify-between items-end">
                <div className="font-mono text-xs">
                  <div>OCTOBER 2026</div>
                  <div className="opacity-70">METROPOLIS GALLERY</div>
                </div>
                <div className="flex gap-1.5">
                  {palette.map((c) => (
                    <div
                      key={c.id}
                      className="w-5 h-5 rounded-md shadow-sm border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'gradients' && (
            <div className="w-full max-w-3xl space-y-6">
              {/* Linear Gradient */}
              <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Linear Gradient (135°)
                  </h4>
                  <button
                    onClick={() => copyGradient(linearGradientCss)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 flex items-center gap-1 text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    {copiedGradient ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy CSS
                  </button>
                </div>
                <div
                  className="h-36 rounded-xl shadow-inner border border-black/10 transition-all duration-300"
                  style={{ background: linearGradientCss }}
                />
                <code className="block mt-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
                  background: {linearGradientCss};
                </code>
              </div>

              {/* Mesh Gradient */}
              <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Radial Mesh Gradient
                  </h4>
                  <button
                    onClick={() => copyGradient(meshGradientCss)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 flex items-center gap-1 text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy CSS
                  </button>
                </div>
                <div
                  className="h-44 rounded-xl shadow-inner border border-black/10 transition-all duration-300"
                  style={{ background: meshGradientCss }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
          Visualizers render the active palette in real time. Press spacebar at any time to regenerate!
        </div>
      </div>
    </div>
  );
};
