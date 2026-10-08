export interface ColorItem {
  id: string;
  hex: string;
  locked: boolean;
  name: string;
}

export type HarmonyMode =
  | 'balanced'
  | 'sunset'
  | 'forest'
  | 'ocean'
  | 'coffee'
  | 'retro'
  | 'pastel'
  | 'cyberpunk'
  | 'luxury'
  | 'autumn'
  | 'nordic'
  | 'desert'
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'random';

export type ColorBlindnessType =
  | 'none'
  | 'protanopia'
  | 'protanomaly'
  | 'deuteranopia'
  | 'deuteranomaly'
  | 'tritanopia'
  | 'tritanomaly'
  | 'achromatopsia'
  | 'achromatomaly';

export type DisplayFormat = 'hex' | 'rgb' | 'hsl' | 'cmyk' | 'lab';

export interface SavedPalette {
  id: string;
  name: string;
  colors: string[];
  createdAt: number;
}
