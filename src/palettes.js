// 9-Color Dynamic Chapter Biome Palette Engine
// Default: Dynamic Mountain Themes (Auto-adapts every 5 levels to chapter biome!)
// Includes custom preset studio, CSS variables binding, and persistence

export const BIOME_PALETTES = [
  // 0: Forsaken City (Chapters 1-5)
  {
    name: 'Forsaken City (Ch. 1-5)',
    colors: [
      '#0b0e14', // 0: Deep Alpine Night Sky / Void
      '#1a1f2c', // 1: Dark Slate Silhouette
      '#263347', // 2: Cold Basalt Shadow
      '#3b516d', // 3: Mountain Cliff Stone
      '#5e7c9f', // 4: Frozen Stone Ledge Trim
      '#ff3b56', // 5: Strawberry Crimson / Spikes Hazard
      '#29adff', // 6: Cyan Ice / Dash Glow / Scarf
      '#00e436', // 7: Emerald Strawberry Leaves / Flora
      '#fff1e8'  // 8: Pure Summit Snow / Highlights
    ]
  },
  // 1: Old Site / Celestial Gateway (Chapters 6-10)
  {
    name: 'Old Site / Gateway (Ch. 6-10)',
    colors: [
      '#080614', // 0: Deep Dream Void
      '#1a1233', // 1: Midnight Amethyst Silhouette
      '#321f57', // 2: Cosmic Violet Shadow
      '#4f2e7d', // 3: Dream Keystone Stone
      '#7d4fad', // 4: Luminescent Rune Ledge
      '#ff3377', // 5: Eerie Hazard Crimson
      '#00f0ff', // 6: Dream Phasing Cyan
      '#c084fc', // 7: Starlight Amethyst Sparkle
      '#ffffff'  // 8: Pure Astral White
    ]
  },
  // 2: Celestial Resort (Chapters 11-15)
  {
    name: 'Celestial Resort (Ch. 11-15)',
    colors: [
      '#120d0b', // 0: Deep Hotel Attic Void
      '#261a14', // 1: Dark Mahogany Silhouette
      '#3d261b', // 2: Aged Walnut Shadow
      '#5e3b2b', // 3: Cedar Wood Platform
      '#8c5839', // 4: Polished Ledge Oak
      '#e63946', // 5: Plush Velvet Carpet / Hazard
      '#2a9d8f', // 6: Oshiro Ghostly Jade Teak
      '#e9c46a', // 7: Resort Brass Chandelier
      '#f4a261'  // 8: Warm Fireplace Glow
    ]
  },
  // 3: Golden Ridge (Chapters 16-20)
  {
    name: 'Golden Ridge (Ch. 16-20)',
    colors: [
      '#170b05', // 0: Deep Canyon Shadow
      '#331407', // 1: Dark Bordeaux Silhouette
      '#59230a', // 2: Terracotta Ridge Shadow
      '#873812', // 3: Autumn Mountain Stone
      '#b55219', // 4: Sunlit Sandstone Ledge
      '#d62828', // 5: Fiery Hazard Rust
      '#f77f00', // 6: Sunset Amber Glow
      '#fcbf49', // 7: Autumn Wind Leaf Gold
      '#eae2b7'  // 8: Sunbeam Highlight
    ]
  },
  // 4: Mirror Temple (Chapters 21-25)
  {
    name: 'Mirror Temple (Ch. 21-25)',
    colors: [
      '#05050d', // 0: Abyssal Mirror Void
      '#121124', // 1: Dark Obsidian Shadow
      '#1f1e3d', // 2: Submerged Slate
      '#34305c', // 3: Mirror Sanctuary Block
      '#564f8c', // 4: Prismatic Edge Glint
      '#e01a4f', // 5: Doppelganger Red Glow
      '#70a9ff', // 6: Mirror Glass Shimmer
      '#b388ff', // 7: Eerie Lavender Rune
      '#f1e4ff'  // 8: Pure Prismatic Flash
    ]
  },
  // 5: The Chasm Abyss (Chapters 26-30)
  {
    name: 'The Chasm Abyss (Ch. 26-30)',
    colors: [
      '#030c12', // 0: Subterranean Abyssal Black
      '#091e26', // 1: Damp Cavern Slate
      '#0e323d', // 2: Submerged Mineral Shadow
      '#174d59', // 3: Luminescent Grotto Stone
      '#24727d', // 4: Crystal Vein Shelf
      '#ff2a6d', // 5: Bioluminescent Hazard
      '#05d9e8', // 6: Cyan Cave Water / Spores
      '#00ff9f', // 7: Emerald Glow Moss
      '#d1f7ff'  // 8: Pure Crystal Gleam
    ]
  },
  // 6: The Molten Core (Chapters 31-35)
  {
    name: 'The Molten Core (Ch. 31-35)',
    colors: [
      '#0f0505', // 0: Volcanic Ash Black
      '#240a0a', // 1: Cooling Magma Crust
      '#3d1212', // 2: Basalt Rock Shadow
      '#611c14', // 3: Obsidian Volcanic Block
      '#942e16', // 4: Smoldering Rim Ledge
      '#ff1e00', // 5: Blazing Lava Hazard
      '#ff6b00', // 6: Molten Magma Flow
      '#ffb703', // 7: Sulfur Flame Yellow
      '#fff3b0'  // 8: White-Hot Core Heat
    ]
  },
  // 7: Celestial Apex 4000M / Summit (Chapters 36-40)
  {
    name: 'Celestial Apex 4000M (Ch. 36-40)',
    colors: [
      '#080b18', // 0: High Stratosphere Navy
      '#131930', // 1: Cold Pinnacle Silhouette
      '#1f2947', // 2: Glacier Shadow Stone
      '#36456a', // 3: Alpine Summit Rock
      '#60739c', // 4: Glacial Ice Trim
      '#ff2a5f', // 5: Summit Crimson Banner
      '#38b6ff', // 6: Celestial Breeze Cyan
      '#ffd166', // 7: Dawn God-Ray Golden Light
      '#ffffff'  // 8: Pure Pristine Summit Snow
    ]
  }
];

export const DEFAULT_PALETTES = [
  {
    id: 'dynamic-mountain',
    name: '01. Dynamic Mountain Themes (Default)',
    author: 'Auto-adapts every 5 levels',
    isDynamic: true,
    colors: BIOME_PALETTES[0].colors
  },
  {
    id: 'celeste-classic',
    name: '02. Celeste Classic (Fixed)',
    author: 'Original Celeste Palette',
    colors: [
      '#0b0e14', // 0: Deep Alpine Night Sky / Void
      '#1a1f2c', // 1: Dark Slate Silhouette
      '#263347', // 2: Cold Basalt Shadow
      '#3b516d', // 3: Mountain Cliff Stone
      '#5e7c9f', // 4: Frozen Stone Ledge Trim
      '#ff3b56', // 5: Strawberry Crimson / Spikes Hazard
      '#29adff', // 6: Cyan Ice / Dash Glow / Scarf
      '#00e436', // 7: Emerald Strawberry Leaves / Flora
      '#fff1e8'  // 8: Pure Summit Snow / Highlights
    ]
  },
  {
    id: 'cyber-neon',
    name: '03. Cyber Neon',
    author: 'Synthwave Preset',
    colors: [
      '#050818', // 0: Deep Void Blue / Sky
      '#0d163a', // 1: Dark Indigo Silhouette
      '#152e60', // 2: Midnight Blue Shadow
      '#1c4e8f', // 3: Deep Cobalt Terrain
      '#0084d1', // 4: Neon Cyan Platform Edge
      '#00bbf9', // 5: Electric Blue Hazard Accent
      '#00f5d4', // 6: Mint Cyan Player Body / Scarf
      '#70e000', // 7: Lime Green Strawberries / Collectibles
      '#ffff3f'  // 8: Neon Yellow Player Hair (Dash Ready) / Sparkles
    ]
  },
  {
    id: 'autumn-rust-bordeaux',
    name: '04. Autumn Rust & Bordeaux',
    author: 'User Image Palette',
    colors: [
      '#371101', // 0: Night
      '#4C1C0B', // 1: Bordeaux Dark
      '#5E1503', // 2: Bordeaux
      '#811E04', // 3: Maroon
      '#A53405', // 4: Rust
      '#C8580B', // 5: Burnt Orange
      '#E07D1C', // 6: Ochre
      '#B97D3D', // 7: Ochre Warm
      '#E39334'  // 8: Tiger's Eye
    ]
  },
  {
    id: 'nordic-sea-gold',
    name: '05. Nordic Sea Gold',
    author: 'User Palette',
    colors: [
      '#02254B', // 0: Oxford Blue
      '#034E70', // 1: Deep Sea
      '#07738B', // 2: Teal
      '#2D9BA3', // 3: Zomp
      '#95D0C2', // 4: Celadon
      '#D0D7A5', // 5: Champagne Pink
      '#E0BF51', // 6: Old Gold
      '#D79B06', // 7: Goldenrod
      '#CC7C05', // 8: Dark Goldenrod
    ]
  },
  {
    id: 'coffee-mocha',
    name: '06. Coffee & Mocha',
    author: 'User Text Palette 1',
    colors: [
      '#33251A', // 0: Jet Black
      '#433325', // 1: Mocha
      '#6A5237', // 2: Coffee
      '#997851', // 3: Khaki Brown
      '#C2A070', // 4: Hazelnut
      '#DCC39C', // 5: Burlywood
      '#EAD8B8', // 6: Wheat
      '#C2B39C', // 7: Khaki
      '#38291E', // 8: Dark Tone / Accent
    ]
  },
  {
    id: 'byzantium-sunset',
    name: '07. Byzantium Sunset',
    author: 'User Text Palette 2',
    colors: [
      '#242F23', // 0: Dark Base
      '#321F3D', // 1: Dark Purple
      '#6A215C', // 2: Byzantium
      '#AB3671', // 3: Boysenberry
      '#B95547', // 4: Sienna
      '#DE6A6C', // 5: Terra Cotta
      '#F2783E', // 6: Crayola Orange
      '#F79D2E', // 7: Tiger\'s Eye
      '#EDC93B', // 8: Saffron
    ]
  },
  {
    id: 'forest-acid-matrix',
    name: '08. Forest Acid Matrix',
    author: 'User Text Palette 3',
    colors: [
      '#113209', // 0: Jet Black Deep
      '#122A09', // 1: Night Green
      '#124509', // 2: Deep Pine
      '#16650B', // 3: Forest Green
      '#21A213', // 4: Forest Green Bright
      '#30D820', // 5: Lime Green
      '#53FB3D', // 6: Neon Green
      '#9CFC79', // 7: Celadon
      '#162E05', // 8: Dark Accent / Matrix
    ]
  },
  {
    id: 'midnight-amethyst',
    name: '09. Midnight Amethyst',
    author: 'Curated Preset',
    colors: [
      '#0f051d', '#1f0d3d', '#381366', '#591a99', '#8a2be2',
      '#b545ff', '#d980ff', '#ff66cc', '#ffffff'
    ]
  },
  {
    id: 'solar-flare',
    name: '10. Solar Flare',
    author: 'Curated Preset',
    colors: [
      '#140500', '#2d0c00', '#4d1400', '#7a2200', '#b83b00',
      '#f05b00', '#ff8800', '#ffc000', '#fff3a8'
    ]
  },
  {
    id: 'emerald-synthwave',
    name: '11. Emerald Synthwave',
    author: 'Curated Preset',
    colors: [
      '#041512', '#082924', '#0d433b', '#13675a', '#1da38f',
      '#2ce0c4', '#5ffff0', '#ff3385', '#ffffff'
    ]
  },
  {
    id: 'tokyo-dream',
    name: '12. Tokyo Dream',
    author: 'Curated Preset',
    colors: [
      '#0d0c1d', '#1a1838', '#2b2654', '#473b7b', '#7353ba',
      '#9b6b9e', '#e07a5f', '#f2cc8f', '#ffffff'
    ]
  },
  {
    id: 'frozen-summit',
    name: '13. Frozen Summit',
    author: 'Curated Preset',
    colors: [
      '#0a1128', '#101f42', '#1c3866', '#295b8a', '#4187b5',
      '#63b3db', '#90d7f2', '#c2f0fc', '#ffffff'
    ]
  },
  {
    id: 'gameboy-pocket',
    name: '14. GameBoy 9-Tone',
    author: 'Curated Preset',
    colors: [
      '#081820', '#132b26', '#214238', '#345f4c', '#4f7d63',
      '#6b9e7b', '#88bf95', '#aee0b4', '#e0f8d0'
    ]
  }
];

const STORAGE_KEY = 'celeste_custom_palettes_v5';
const ACTIVE_PALETTE_KEY = 'celeste_active_palette_idx_v5';

export class PaletteManager {
  constructor() {
    this.palettes = [...DEFAULT_PALETTES];
    this.currentBiome = 0;
    this.onPaletteChanged = null;
    this.loadCustomPalettes();
    
    const savedIdx = parseInt(localStorage.getItem(ACTIVE_PALETTE_KEY) || '0', 10);
    this.activeIndex = (savedIdx >= 0 && savedIdx < this.palettes.length) ? savedIdx : 0;
    this.applyToCSS();
  }

  loadCustomPalettes() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const custom = JSON.parse(data);
        if (Array.isArray(custom)) {
          this.palettes = [...DEFAULT_PALETTES, ...custom];
        }
      }
    } catch (e) {
      console.warn('Failed to load custom palettes from localStorage', e);
    }
  }

  saveCustomPalettes() {
    try {
      const custom = this.palettes.filter(p => !DEFAULT_PALETTES.some(dp => dp.id === p.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    } catch (e) {
      console.warn('Failed to save custom palettes to localStorage', e);
    }
  }

  getAll() {
    return this.palettes;
  }

  getCurrent() {
    const base = this.palettes[this.activeIndex] || this.palettes[0];
    if (base.isDynamic) {
      const bIdx = Math.max(0, Math.min(BIOME_PALETTES.length - 1, this.currentBiome));
      const bPal = BIOME_PALETTES[bIdx];
      return {
        id: 'dynamic-mountain',
        name: `01. Dynamic: ${bPal.name}`,
        author: 'Auto-adapts every 5 levels',
        isDynamic: true,
        colors: bPal.colors
      };
    }
    return base;
  }

  getColors() {
    return this.getCurrent().colors;
  }

  getColor(index) {
    const c = this.getCurrent().colors;
    return c[Math.max(0, Math.min(8, index))];
  }

  black() {
    return '#000000';
  }

  white() {
    return '#ffffff';
  }

  setBiome(biome) {
    const newBiome = Math.max(0, Math.min(BIOME_PALETTES.length - 1, biome));
    this.currentBiome = newBiome;
    const cur = this.getCurrent();
    if (cur.isDynamic) {
      this.applyToCSS();
      if (this.onPaletteChanged) this.onPaletteChanged(cur);
    }
  }

  setIndex(index) {
    if (index >= 0 && index < this.palettes.length) {
      this.activeIndex = index;
      localStorage.setItem(ACTIVE_PALETTE_KEY, index.toString());
      this.applyToCSS();
      if (this.onPaletteChanged) this.onPaletteChanged(this.getCurrent());
      return true;
    }
    return false;
  }

  next() {
    const nextIdx = (this.activeIndex + 1) % this.palettes.length;
    this.setIndex(nextIdx);
    return this.getCurrent();
  }

  prev() {
    const prevIdx = (this.activeIndex - 1 + this.palettes.length) % this.palettes.length;
    this.setIndex(prevIdx);
    return this.getCurrent();
  }

  addCustomPalette(name, hexArray) {
    if (!Array.isArray(hexArray) || hexArray.length !== 9) {
      throw new Error('Palette must contain exactly 9 hex colors');
    }
    const cleanColors = hexArray.map(c => {
      let hex = c.trim();
      if (!hex.startsWith('#')) hex = '#' + hex;
      return hex.toUpperCase();
    });

    const newPal = {
      id: 'custom-' + Date.now(),
      name: name.trim() || 'Custom Palette',
      author: 'User Created',
      colors: cleanColors
    };

    this.palettes.push(newPal);
    this.saveCustomPalettes();
    this.setIndex(this.palettes.length - 1);
    return newPal;
  }

  deleteCurrentIfCustom() {
    const cur = this.getCurrent();
    const isDefault = DEFAULT_PALETTES.some(p => p.id === cur.id);
    if (isDefault) return false;

    this.palettes.splice(this.activeIndex, 1);
    this.activeIndex = Math.max(0, this.activeIndex - 1);
    this.saveCustomPalettes();
    this.setIndex(this.activeIndex);
    return true;
  }

  applyToCSS() {
    const cur = this.getCurrent();
    const root = document.documentElement;
    cur.colors.forEach((hex, idx) => {
      root.style.setProperty(`--p${idx}`, hex);
    });
    root.style.setProperty('--color-bg', cur.colors[0]);
    root.style.setProperty('--color-shadow', cur.colors[1]);
    root.style.setProperty('--color-surface-dark', cur.colors[2]);
    root.style.setProperty('--color-surface', cur.colors[3]);
    root.style.setProperty('--color-border', cur.colors[4]);
    root.style.setProperty('--color-accent-hazard', cur.colors[5]);
    root.style.setProperty('--color-accent-warm', cur.colors[6]);
    root.style.setProperty('--color-highlight', cur.colors[7]);
    root.style.setProperty('--color-bright', cur.colors[8]);
  }
}
