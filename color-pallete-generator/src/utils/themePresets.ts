export interface ThemedPreset {
  name: string;
  category: string;
  colors: string[]; // Master 5-8 color palette that is cohesive
}

export const THEMED_PALETTES: ThemedPreset[] = [
  // Warm Sunset & Terracotta
  {
    name: 'Sunset Terracotta',
    category: 'sunset',
    colors: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#D64045', '#3D348B']
  },
  {
    name: 'Desert Dusk',
    category: 'sunset',
    colors: ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C', '#D90429', '#E63946', '#F1FAEE']
  },
  {
    name: 'Malibu Golden Hour',
    category: 'sunset',
    colors: ['#2D006B', '#7C1983', '#C73E73', '#F3795C', '#FFBA52', '#FEE280', '#1F0038']
  },
  {
    name: 'Sedona Clay',
    category: 'sunset',
    colors: ['#3A1F1B', '#7A3E2E', '#C2593F', '#E0855A', '#F4B27F', '#F9D8B9', '#241411']
  },

  // Forest, Botanicals & Sage
  {
    name: 'Earthy Sage & Moss',
    category: 'forest',
    colors: ['#283618', '#606C38', '#DDA15E', '#BC6C25', '#FEFAE0', '#4A572C', '#1B2410']
  },
  {
    name: 'Pacific Pine',
    category: 'forest',
    colors: ['#0B2B26', '#163832', '#235347', '#8EB69B', '#DAF1DE', '#4F772D', '#31572C']
  },
  {
    name: 'Matcha & Cream',
    category: 'forest',
    colors: ['#1C2A1A', '#385030', '#6F8F5C', '#A8C395', '#DDE8D2', '#F7FAF4', '#4B6340']
  },
  {
    name: 'Eucalyptus & Fern',
    category: 'forest',
    colors: ['#1E3231', '#324F4B', '#5A7D75', '#8EAEA2', '#CADCD5', '#F0F5F3', '#12201F']
  },

  // Deep Ocean & Coastal
  {
    name: 'Oceanic Abyssal',
    category: 'ocean',
    colors: ['#03045E', '#023E8A', '#0077B6', '#0096C7', '#00B4D8', '#48CAE4', '#90E0EF']
  },
  {
    name: 'Mediterranean Teal',
    category: 'ocean',
    colors: ['#0A192F', '#172A45', '#305252', '#488286', '#7FB7BE', '#D3F3EE', '#B5E2FA']
  },
  {
    name: 'Nordic Coast',
    category: 'ocean',
    colors: ['#1E293B', '#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0']
  },
  {
    name: 'Amalfi Coast',
    category: 'ocean',
    colors: ['#002B49', '#005F73', '#0A9396', '#94D2BD', '#E9D8A6', '#EE9B00', '#CA6702']
  },

  // Coffee & Warm Neutrals
  {
    name: 'Café Espresso',
    category: 'coffee',
    colors: ['#2C1810', '#4A2810', '#7E4E2C', '#B5835A', '#E0C3A0', '#F5EBE1', '#382215']
  },
  {
    name: 'Almond Latte',
    category: 'coffee',
    colors: ['#382E2B', '#574640', '#7A645B', '#A89284', '#D4C4B5', '#F0E7DD', '#FAF6F0']
  },
  {
    name: 'Cashmere & Taupe',
    category: 'coffee',
    colors: ['#1F1A17', '#3F352E', '#6B5E54', '#9E8E81', '#CFC2B4', '#EBE4DB', '#F7F3EE']
  },

  // Retro 70s & Mid-Century
  {
    name: 'Groovy 70s Vinyl',
    category: 'retro',
    colors: ['#3D2645', '#832161', '#DA4167', '#F0DE36', '#FF9F1C', '#E76F51', '#2A2B2A']
  },
  {
    name: 'Mid-Century Palm Springs',
    category: 'retro',
    colors: ['#1A3038', '#2C5D63', '#E3A857', '#C25953', '#E08E79', '#F1D4AF', '#3B4842']
  },
  {
    name: 'Mustard & Avocado',
    category: 'retro',
    colors: ['#443825', '#5C6B37', '#97A94B', '#DFB15B', '#E87D3E', '#9B412B', '#272A1C']
  },

  // Pastel Dream & Bakery
  {
    name: 'Tokyo Macaron',
    category: 'pastel',
    colors: ['#FFC6FF', '#BDB2FF', '#A0C4FF', '#9BF6FF', '#CAFFBF', '#FDFFB6', '#FFD6A5']
  },
  {
    name: 'Spring Blossom',
    category: 'pastel',
    colors: ['#FDE2E4', '#FAD2E1', '#E2ECE9', '#BEE1E6', '#F0EFEB', '#DFE7FD', '#CDDAFD']
  },
  {
    name: 'Lavender Gelato',
    category: 'pastel',
    colors: ['#EAE4E9', '#FFF1E6', '#FDE2E4', '#FAD2E1', '#E2ECE9', '#BEE1E6', '#DFE7FD']
  },

  // Cyberpunk & Neon Nights
  {
    name: 'Neo Shinjuku',
    category: 'cyberpunk',
    colors: ['#0D0221', '#0F084B', '#26408B', '#00F0FF', '#7000FF', '#FF0055', '#FFE600']
  },
  {
    name: 'Synthwave Skyline',
    category: 'cyberpunk',
    colors: ['#12072B', '#2E0854', '#6A0572', '#AB83A1', '#FF2A85', '#05D9E8', '#01012B']
  },
  {
    name: 'Matrix Circuit',
    category: 'cyberpunk',
    colors: ['#050801', '#0C1805', '#163308', '#25660D', '#39B314', '#55FF22', '#B4FF80']
  },

  // Dark Luxury & Royal Jewel Tones
  {
    name: 'Midnight Velvet',
    category: 'luxury',
    colors: ['#0B0914', '#1B142F', '#372554', '#523A78', '#C5A880', '#E5D4B8', '#140D26']
  },
  {
    name: 'Emerald & Gold Dynasty',
    category: 'luxury',
    colors: ['#0B1A13', '#133023', '#1D4D38', '#8A6D3B', '#C9A86A', '#EED9AC', '#18241D']
  },
  {
    name: 'Bordeaux Royalty',
    category: 'luxury',
    colors: ['#1F030C', '#45091C', '#6E142F', '#8E1B38', '#C48D3F', '#DFC18E', '#2A0611']
  },

  // Autumn Harvest & Warmth
  {
    name: 'Harvest Amber',
    category: 'autumn',
    colors: ['#3A1700', '#6F2200', '#A83B00', '#DE6B00', '#FFA400', '#FFD166', '#47220B']
  },
  {
    name: 'Maple Foliage',
    category: 'autumn',
    colors: ['#28110D', '#541A12', '#8C271E', '#BF432B', '#D97736', '#EBB059', '#3D1C16']
  },

  // Nordic Minimalist
  {
    name: 'Copenhagen Calm',
    category: 'nordic',
    colors: ['#1A1C20', '#2E3440', '#434C5E', '#4C566A', '#D8DEE9', '#E5E9F0', '#ECEFF4']
  },
  {
    name: 'Fjord Slate',
    category: 'nordic',
    colors: ['#18232C', '#283747', '#34495E', '#5D6D7E', '#85929E', '#BDC3C7', '#EBF5FB']
  },

  // Desert Dunes & Sand
  {
    name: 'Sahara Mirage',
    category: 'desert',
    colors: ['#2E2018', '#543D2B', '#8C6849', '#C49A6C', '#E5C9A6', '#F5E6D3', '#3B291F']
  },
  {
    name: 'Mojave Twilight',
    category: 'desert',
    colors: ['#241B2F', '#3D2F4F', '#734B66', '#A26769', '#D5B9B2', '#ECE2D0', '#2F243A']
  }
];

export const THEME_CATEGORIES = [
  { id: 'balanced', label: '✨ Auto Curated', icon: 'Sparkles' },
  { id: 'sunset', label: '🌅 Sunset & Warm', icon: 'Sun' },
  { id: 'forest', label: '🌿 Forest & Sage', icon: 'Leaf' },
  { id: 'ocean', label: '🌊 Ocean & Azure', icon: 'Droplets' },
  { id: 'coffee', label: '☕ Coffee & Neutral', icon: 'Coffee' },
  { id: 'retro', label: '📻 Retro 70s', icon: 'Music' },
  { id: 'pastel', label: '🍬 Pastel Dream', icon: 'Heart' },
  { id: 'cyberpunk', label: '🌌 Cyberpunk Neon', icon: 'Zap' },
  { id: 'luxury', label: '👑 Dark Luxury', icon: 'Crown' },
  { id: 'autumn', label: '🍂 Autumn Harvest', icon: 'Flame' },
  { id: 'nordic', label: '🏔️ Nordic Minimal', icon: 'Compass' },
  { id: 'desert', label: '🏜️ Desert Dune', icon: 'Wind' },
  { id: 'monochromatic', label: '🎭 Monochromatic', icon: 'Layers' },
  { id: 'analogous', label: '🌈 Analogous Flow', icon: 'Palette' },
];
