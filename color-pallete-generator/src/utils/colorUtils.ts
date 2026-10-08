import { ColorBlindnessType, DisplayFormat, HarmonyMode } from '../types';
import { getColorName } from './colorNames';
import { THEMED_PALETTES, ThemedPreset } from './themePresets';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

// Ensure hex has a leading # and is 6 characters
export function normalizeHex(hex: string): string {
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(clean)) {
    return '#000000';
  }
  return `#${clean.toUpperCase()}`;
}

export function isValidHex(hex: string): boolean {
  const clean = hex.trim().replace(/^#/, '');
  return (clean.length === 3 || clean.length === 6) && /^[0-9a-fA-F]+$/.test(clean);
}

export function hexToRgb(hex: string): RgbColor {
  const normalized = normalizeHex(hex);
  const num = parseInt(normalized.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): HslColor {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): RgbColor {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

// Convert RGB to CIELAB
export function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  // sRGB to XYZ
  let rL = r / 255;
  let gL = g / 255;
  let bL = b / 255;

  rL = rL > 0.04045 ? Math.pow((rL + 0.055) / 1.055, 2.4) : rL / 12.92;
  gL = gL > 0.04045 ? Math.pow((gL + 0.055) / 1.055, 2.4) : gL / 12.92;
  bL = bL > 0.04045 ? Math.pow((bL + 0.055) / 1.055, 2.4) : bL / 12.92;

  let x = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) / 0.95047;
  let y = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) / 1.00000;
  let z = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) / 1.08883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  return {
    l: Math.round(116 * y - 16),
    a: Math.round(500 * (x - y)),
    b: Math.round(200 * (y - z)),
  };
}

// Format color value into human-readable string for column display
export function formatColorValue(hex: string, format: DisplayFormat): string {
  const norm = normalizeHex(hex);
  if (format === 'hex') {
    return norm;
  }
  const rgb = hexToRgb(norm);
  if (format === 'rgb') {
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  }
  if (format === 'hsl') {
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;
  }
  if (format === 'cmyk') {
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    return `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`;
  }
  if (format === 'lab') {
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    return `${lab.l}, ${lab.a}, ${lab.b}`;
  }
  return norm;
}

// WCAG relative luminance
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Contrast ratio between two colors (e.g. 1.0 to 21.0)
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

// Determines if white or black text will have higher contrast against the color
export function getReadableTextColor(bgHex: string): '#000000' | '#FFFFFF' {
  const whiteContrast = getContrastRatio(bgHex, '#FFFFFF');
  const blackContrast = getContrastRatio(bgHex, '#000000');
  return whiteContrast >= blackContrast ? '#FFFFFF' : '#000000';
}

export function getWcagRating(ratio: number): {
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  badge: 'AAA' | 'AA' | 'AA+' | 'Fail';
} {
  const aaLarge = ratio >= 3.0;
  const aaNormal = ratio >= 4.5;
  const aaaLarge = ratio >= 4.5;
  const aaaNormal = ratio >= 7.0;

  let badge: 'AAA' | 'AA' | 'AA+' | 'Fail' = 'Fail';
  if (aaaNormal) badge = 'AAA';
  else if (aaNormal) badge = 'AA';
  else if (aaLarge) badge = 'AA+';

  return { aaNormal, aaLarge, aaaNormal, aaaLarge, badge };
}

// Generates 19 shade/tint steps for a color from 95% light to 5% light
export function generateShades(baseHex: string, count = 21): string[] {
  const rgb = hexToRgb(baseHex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const shades: string[] = [];

  for (let i = 0; i < count; i++) {
    // Lightness from 98 down to 4
    const l = Math.round(98 - (i * 94) / (count - 1));
    const newRgb = hslToRgb(hsl.h, hsl.s, l);
    shades.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }

  return shades;
}

// Interpolate between two hex colors (used for inserting between colors)
export function interpolateColor(hex1: string, hex2: string, factor = 0.5): string {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
  const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
  const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));

  return rgbToHex(r, g, b);
}

// Color blindness simulator matrices
export function simulateColorBlindness(hex: string, type: ColorBlindnessType): string {
  if (type === 'none') return hex;

  const { r, g, b } = hexToRgb(hex);

  // Standard simulation matrices
  let rSim = r;
  let gSim = g;
  let bSim = b;

  switch (type) {
    case 'protanopia': // Red-blind
      rSim = 0.56667 * r + 0.43333 * g + 0.0 * b;
      gSim = 0.55833 * r + 0.44167 * g + 0.0 * b;
      bSim = 0.0 * r + 0.24167 * g + 0.75833 * b;
      break;
    case 'protanomaly': // Red-weak
      rSim = 0.81667 * r + 0.18333 * g + 0.0 * b;
      gSim = 0.33333 * r + 0.66667 * g + 0.0 * b;
      bSim = 0.0 * r + 0.12500 * g + 0.87500 * b;
      break;
    case 'deuteranopia': // Green-blind
      rSim = 0.625 * r + 0.375 * g + 0.0 * b;
      gSim = 0.7 * r + 0.3 * g + 0.0 * b;
      bSim = 0.0 * r + 0.3 * g + 0.7 * b;
      break;
    case 'deuteranomaly': // Green-weak
      rSim = 0.8 * r + 0.2 * g + 0.0 * b;
      gSim = 0.25833 * r + 0.74167 * g + 0.0 * b;
      bSim = 0.0 * r + 0.14167 * g + 0.85833 * b;
      break;
    case 'tritanopia': // Blue-blind
      rSim = 0.95 * r + 0.05 * g + 0.0 * b;
      gSim = 0.0 * r + 0.43333 * g + 0.56667 * b;
      bSim = 0.0 * r + 0.475 * g + 0.525 * b;
      break;
    case 'tritanomaly': // Blue-weak
      rSim = 0.96667 * r + 0.03333 * g + 0.0 * b;
      gSim = 0.0 * r + 0.73333 * g + 0.26667 * b;
      bSim = 0.0 * r + 0.18333 * g + 0.81667 * b;
      break;
    case 'achromatopsia': // Total color blindness (monochrome)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      rSim = gray;
      gSim = gray;
      bSim = gray;
      break;
    case 'achromatomaly': // Partial color blindness
      const grayPart = 0.299 * r + 0.587 * g + 0.114 * b;
      rSim = 0.618 * r + 0.382 * grayPart;
      gSim = 0.618 * g + 0.382 * grayPart;
      bSim = 0.618 * b + 0.382 * grayPart;
      break;
  }

  return rgbToHex(rSim, gSim, bSim);
}

// Smoothly resample an array of colors to `targetCount` colors using multi-stop interpolation
export function resamplePalette(baseColors: string[], targetCount: number): string[] {
  if (baseColors.length === 0) return [];
  if (targetCount === baseColors.length) return [...baseColors];
  if (targetCount < baseColors.length) {
    const sampled: string[] = [];
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.round((i * (baseColors.length - 1)) / (targetCount - 1));
      sampled.push(baseColors[idx]);
    }
    return sampled;
  }

  // targetCount > baseColors.length (e.g. expanding 5 to 6, 7, 8, 9, 10 colors)
  // Interpolates between adjacent color nodes along the thematic spline
  const result: string[] = [];
  const segments = baseColors.length - 1;

  for (let i = 0; i < targetCount; i++) {
    const progress = i / (targetCount - 1);
    const rawIndex = progress * segments;
    const lowerIdx = Math.floor(rawIndex);
    const upperIdx = Math.min(segments, Math.ceil(rawIndex));
    const factor = rawIndex - lowerIdx;

    if (lowerIdx === upperIdx) {
      result.push(baseColors[lowerIdx]);
    } else {
      result.push(interpolateColor(baseColors[lowerIdx], baseColors[upperIdx], factor));
    }
  }

  return result;
}

// Add subtle organic variation so each Spacebar press generates a distinct unique palette
function applyThemeVariation(palette: string[]): string[] {
  const hueDrift = Math.floor(Math.random() * 24 - 12); // -12 to +12 degrees
  return palette.map(hex => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const h = (hsl.h + hueDrift + 360) % 360;
    const s = Math.max(15, Math.min(95, hsl.s + Math.floor(Math.random() * 8 - 4)));
    const l = Math.max(10, Math.min(94, hsl.l + Math.floor(Math.random() * 6 - 3)));
    const newRgb = hslToRgb(h, s, l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  });
}

// Generate harmonious, cohesive themed colors
export function generatePaletteColors(
  count: number,
  mode: HarmonyMode,
  existingColors: { hex: string; locked: boolean }[] = []
): string[] {
  // Check locked colors
  const lockedEntries: { index: number; hex: string }[] = [];
  existingColors.forEach((c, idx) => {
    if (c.locked && idx < count) {
      lockedEntries.push({ index: idx, hex: normalizeHex(c.hex) });
    }
  });

  // Base generator without locked constraints
  let candidatePalette: string[] = [];

  if (mode === 'random') {
    for (let i = 0; i < count; i++) {
      const h = Math.floor(Math.random() * 360);
      const s = Math.floor(35 + Math.random() * 60);
      const l = Math.floor(20 + Math.random() * 60);
      const rgb = hslToRgb(h, s, l);
      candidatePalette.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  } else if (mode === 'monochromatic') {
    let baseHue = Math.floor(Math.random() * 360);
    let baseSat = 50;
    if (lockedEntries.length > 0) {
      const rgb = hexToRgb(lockedEntries[0].hex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      baseHue = hsl.h;
      baseSat = hsl.s;
    }
    candidatePalette = [];
    for (let i = 0; i < count; i++) {
      const l = Math.round(16 + (i * 72) / Math.max(1, count - 1));
      const s = Math.max(25, Math.min(85, baseSat + (Math.random() * 10 - 5)));
      const rgb = hslToRgb(baseHue, s, l);
      candidatePalette.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  } else if (mode === 'analogous') {
    let baseHue = Math.floor(Math.random() * 360);
    if (lockedEntries.length > 0) {
      const rgb = hexToRgb(lockedEntries[0].hex);
      baseHue = rgbToHsl(rgb.r, rgb.g, rgb.b).h;
    }
    candidatePalette = [];
    for (let i = 0; i < count; i++) {
      const h = (baseHue + (i - Math.floor(count / 2)) * 18 + 360) % 360;
      const s = Math.floor(45 + Math.random() * 35);
      const l = Math.round(20 + (i * 65) / Math.max(1, count - 1));
      const rgb = hslToRgb(h, s, l);
      candidatePalette.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  } else if (mode === 'complementary') {
    let baseHue = Math.floor(Math.random() * 360);
    if (lockedEntries.length > 0) {
      const rgb = hexToRgb(lockedEntries[0].hex);
      baseHue = rgbToHsl(rgb.r, rgb.g, rgb.b).h;
    }
    candidatePalette = [];
    const oppHue = (baseHue + 180) % 360;
    for (let i = 0; i < count; i++) {
      const isBase = i < Math.ceil(count / 2);
      const h = isBase ? (baseHue + i * 8) % 360 : (oppHue + (i - Math.ceil(count / 2)) * 8) % 360;
      const s = Math.floor(50 + Math.random() * 35);
      const l = Math.round(20 + (i * 65) / Math.max(1, count - 1));
      const rgb = hslToRgb(h, s, l);
      candidatePalette.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
  } else {
    // Themed Palettes (sunset, forest, ocean, coffee, retro, pastel, cyberpunk, luxury, autumn, nordic, desert, or balanced)
    let themeList = THEMED_PALETTES;
    if (mode !== 'balanced') {
      const filtered = THEMED_PALETTES.filter(p => p.category === mode);
      if (filtered.length > 0) themeList = filtered;
    }

    // Pick random themed preset
    const preset = themeList[Math.floor(Math.random() * themeList.length)];
    const variedPreset = applyThemeVariation(preset.colors);

    // Resample to exact target count
    candidatePalette = resamplePalette(variedPreset, count);
  }

  // If no locked colors, return candidate
  if (lockedEntries.length === 0) {
    return candidatePalette;
  }

  // If there are locked colors, harmonize the candidate colors with the locked color
  const lockedColor = lockedEntries[0];
  const lockedRgb = hexToRgb(lockedColor.hex);
  const lockedHsl = rgbToHsl(lockedRgb.r, lockedRgb.g, lockedRgb.b);

  const result: string[] = [...candidatePalette];

  // Adjust unlocked colors toward the locked color's temperature / chroma family
  for (let i = 0; i < count; i++) {
    const isLocked = lockedEntries.some(l => l.index === i);
    if (isLocked) {
      const found = lockedEntries.find(l => l.index === i);
      result[i] = found ? found.hex : result[i];
    } else {
      // Blend candidate color slightly with locked color's saturation and subtle hue pull
      const candRgb = hexToRgb(result[i]);
      const candHsl = rgbToHsl(candRgb.r, candRgb.g, candRgb.b);

      // Harmonize saturation within ±15% of locked saturation for visual cohesion
      const harmonizedS = Math.max(15, Math.min(95, (candHsl.s * 0.6) + (lockedHsl.s * 0.4)));
      const adjustedRgb = hslToRgb(candHsl.h, harmonizedS, candHsl.l);
      result[i] = rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
    }
  }

  return result;
}

// Initial curated demo palette (matching classic iconic coolors feel)
export const DEFAULT_INITIAL_PALETTE = [
  '#264653',
  '#2A9D8F',
  '#E9C46A',
  '#F4A261',
  '#E76F51',
];

// Helper to create ColorItem objects
export function createColorItem(hex: string, locked = false): { id: string; hex: string; locked: boolean; name: string } {
  const normHex = normalizeHex(hex);
  return {
    id: `col-${Math.random().toString(36).substring(2, 9)}`,
    hex: normHex,
    locked,
    name: getColorName(normHex),
  };
}
