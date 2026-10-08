// Curated list of named colors inspired by standard design color systems
export interface NamedColor {
  name: string;
  hex: string;
}

export const COLOR_NAMES_DICTIONARY: NamedColor[] = [
  { name: "Black", hex: "#000000" },
  { name: "Night", hex: "#0C090A" },
  { name: "Charcoal", hex: "#36454F" },
  { name: "Jet Black", hex: "#2C2C2C" },
  { name: "Onyx", hex: "#353839" },
  { name: "Rich Black", hex: "#010B13" },
  { name: "Gunmetal", hex: "#2a3439" },
  { name: "Dark Slate Gray", hex: "#2F4F4F" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Ghost White", hex: "#F8F8FF" },
  { name: "Snow", hex: "#FFFAFA" },
  { name: "Floral White", hex: "#FFFAF0" },
  { name: "Off White", hex: "#FAF9F6" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "Alabaster", hex: "#EDEAE0" },
  { name: "Baby Powder", hex: "#FEFEFA" },
  { name: "Sea Salt", hex: "#F8F9FA" },
  { name: "Anti-Flash White", hex: "#F0F2F5" },
  { name: "Platinum", hex: "#E5E4E2" },
  { name: "Timberwolf", hex: "#D8D8D8" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "French Gray", hex: "#BDBDBD" },
  { name: "Battleship Gray", hex: "#848482" },
  { name: "Dim Gray", hex: "#696969" },
  { name: "Cool Gray", hex: "#8F9CA7" },
  { name: "Slate Gray", hex: "#708090" },
  { name: "Outer Space", hex: "#414A4C" },
  { name: "Davy's Gray", hex: "#555555" },
  { name: "Ash Gray", hex: "#B2BEB5" },
  
  // Reds & Pinks
  { name: "Ruby Red", hex: "#E0115F" },
  { name: "Crimson", hex: "#DC143C" },
  { name: "Scarlet", hex: "#FF2400" },
  { name: "Imperial Red", hex: "#E63946" },
  { name: "Fire Engine Red", hex: "#CE2029" },
  { name: "Madder Lake", hex: "#CC3333" },
  { name: "Cardinal", hex: "#C41E3A" },
  { name: "Rust", hex: "#B7410E" },
  { name: "Auburn", hex: "#A52A2A" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Maroon", hex: "#800000" },
  { name: "Wine", hex: "#722F37" },
  { name: "Cordovan", hex: "#893F45" },
  { name: "Bordeaux", hex: "#5C061F" },
  { name: "Carmine", hex: "#960018" },
  { name: "Claret", hex: "#7F1734" },
  { name: "Rose Pompadour", hex: "#ED7A9E" },
  { name: "Blush", hex: "#DE5D83" },
  { name: "Amaranth", hex: "#E52B50" },
  { name: "Cerise", hex: "#DE3163" },
  { name: "Raspberry", hex: "#E30B5C" },
  { name: "Watermelon", hex: "#FC6C85" },
  { name: "Salmon", hex: "#FA8072" },
  { name: "Light Coral", hex: "#F08080" },
  { name: "Flamingo Pink", hex: "#FC8EAC" },
  { name: "Carnation Pink", hex: "#FFA6C9" },
  { name: "Thulian Pink", hex: "#DE6FA1" },
  { name: "Bubblegum", hex: "#FFC1CC" },
  { name: "Pastel Pink", hex: "#FFD1DC" },
  { name: "Misty Rose", hex: "#FFE4E1" },
  { name: "Champagne Pink", hex: "#F1DCA7" },

  // Oranges & Peaches
  { name: "Coral", hex: "#FF7F50" },
  { name: "Burnt Orange", hex: "#CC5500" },
  { name: "Tangerine", hex: "#F28500" },
  { name: "Atomic Tangerine", hex: "#FF9966" },
  { name: "Persimmon", hex: "#EC5800" },
  { name: "Tiger's Eye", hex: "#E08D3C" },
  { name: "Ochre", hex: "#CC7722" },
  { name: "Raw Sienna", hex: "#D68A59" },
  { name: "Burnt Sienna", hex: "#E76F51" },
  { name: "Sandy Brown", hex: "#F4A261" },
  { name: "Sunset Orange", hex: "#FD5E53" },
  { name: "Peach", hex: "#FFE5B4" },
  { name: "Apricot", hex: "#FBCEB1" },
  { name: "Melon", hex: "#FEBAAD" },
  { name: "Terra Cotta", hex: "#E2725B" },
  { name: "Cinnabar", hex: "#E44D2E" },
  { name: "Pumpkin", hex: "#FF7518" },
  { name: "Crayola Orange", hex: "#FF7538" },
  { name: "Safety Orange", hex: "#FF5F1F" },
  { name: "Dark Orange", hex: "#FF8C00" },

  // Yellows & Golds
  { name: "Gold", hex: "#FFD700" },
  { name: "Saffron", hex: "#F4C430" },
  { name: "Amber", hex: "#FFBF00" },
  { name: "Sunglow", hex: "#FFCC33" },
  { name: "Mustard", hex: "#FFDB58" },
  { name: "Banana Yellow", hex: "#FFE135" },
  { name: "Lemon Chiffon", hex: "#FFFACD" },
  { name: "Flax", hex: "#EEDC82" },
  { name: "Canary", hex: "#FFFF99" },
  { name: "Goldenrod", hex: "#DAA520" },
  { name: "Dark Goldenrod", hex: "#B8860B" },
  { name: "Brass", hex: "#B5A642" },
  { name: "Old Gold", hex: "#CFB53B" },
  { name: "Cornsilk", hex: "#FFF8DC" },
  { name: "Khaki", hex: "#C3B091" },
  { name: "Vanilla", hex: "#F3E5AB" },
  { name: "Jasmine", hex: "#F8DE7E" },
  { name: "Aureolin", hex: "#FDEE00" },
  { name: "Chartreuse Yellow", hex: "#DFFF00" },

  // Greens
  { name: "Emerald", hex: "#50C878" },
  { name: "Jade", hex: "#00A86B" },
  { name: "Forest Green", hex: "#228B22" },
  { name: "Hunter Green", hex: "#355E3B" },
  { name: "Pine Green", hex: "#01796F" },
  { name: "Jungle Green", hex: "#29AB87" },
  { name: "Mint", hex: "#3EB489" },
  { name: "Sea Green", hex: "#2E8B57" },
  { name: "Celadon", hex: "#ACE1AF" },
  { name: "Sage", hex: "#9DC183" },
  { name: "Olive", hex: "#808000" },
  { name: "Olive Drab", hex: "#6B8E23" },
  { name: "Fern Green", hex: "#4F7942" },
  { name: "Moss Green", hex: "#8A9A5B" },
  { name: "Pistachio", hex: "#93C572" },
  { name: "Lime Green", hex: "#32CD32" },
  { name: "Neon Green", hex: "#39FF14" },
  { name: "Harlequin", hex: "#3FFF00" },
  { name: "Kelly Green", hex: "#4CBB17" },
  { name: "Persian Green", hex: "#00A693" },
  { name: "Zomp", hex: "#39A78E" },
  { name: "Keppel", hex: "#3AB09E" },
  { name: "Dark Spring Green", hex: "#177245" },
  { name: "Malachite", hex: "#0BDA51" },
  { name: "Viridian", hex: "#40826D" },
  { name: "Brunswick Green", hex: "#1B4D3E" },
  { name: "Artichoke Green", hex: "#4B6F44" },
  { name: "Tea Green", hex: "#D0F0C0" },

  // Cyans, Teals & Aquas
  { name: "Teal", hex: "#008080" },
  { name: "Dark Cyan", hex: "#008B8B" },
  { name: "Light Sea Green", hex: "#20B2AA" },
  { name: "Turquoise", hex: "#40E0D0" },
  { name: "Medium Turquoise", hex: "#48D1CC" },
  { name: "Aquamarine", hex: "#7FFFD4" },
  { name: "Robin Egg Blue", hex: "#00CCCC" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Tiffany Blue", hex: "#0ABAB5" },
  { name: "Pacific Cyan", hex: "#1CA9C9" },
  { name: "Verdigris", hex: "#43B3AE" },
  { name: "Moonstone", hex: "#3AA8C1" },
  { name: "Cadet Blue", hex: "#5F9EA0" },
  { name: "Deep Sea", hex: "#095859" },

  // Blues
  { name: "Cerulean", hex: "#007BA7" },
  { name: "Cobalt Blue", hex: "#0047AB" },
  { name: "Lapis Lazuli", hex: "#26619C" },
  { name: "Royal Blue", hex: "#4169E1" },
  { name: "Dodger Blue", hex: "#1E90FF" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Baby Blue", hex: "#89CFF0" },
  { name: "Powder Blue", hex: "#B0E0E6" },
  { name: "Steel Blue", hex: "#4682B4" },
  { name: "Cornflower Blue", hex: "#6495ED" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "Midnight Blue", hex: "#191970" },
  { name: "Prussian Blue", hex: "#003153" },
  { name: "Space Cadet", hex: "#1D2951" },
  { name: "YInMn Blue", hex: "#2E5090" },
  { name: "Marian Blue", hex: "#E1EBEE" },
  { name: "Glaucous", hex: "#6082B6" },
  { name: "Denim", hex: "#1560BD" },
  { name: "Sapphire", hex: "#0F52BA" },
  { name: "Electric Blue", hex: "#7DF9FF" },
  { name: "Air Force Blue", hex: "#5D8AA8" },
  { name: "Payne's Gray", hex: "#536878" },
  { name: "Independence", hex: "#4C516D" },
  { name: "Delft Blue", hex: "#1F305E" },
  { name: "Oxford Blue", hex: "#002147" },
  { name: "Yale Blue", hex: "#0F4D92" },
  { name: "Peacock Blue", hex: "#33A1C9" },

  // Purples & Violets
  { name: "Indigo", hex: "#4B0082" },
  { name: "Violet", hex: "#8F00FF" },
  { name: "Amethyst", hex: "#9966CC" },
  { name: "Lavender", hex: "#E6E6FA" },
  { name: "Lilac", hex: "#C8A2C8" },
  { name: "Mauve", hex: "#E0B0FF" },
  { name: "Periwinkle", hex: "#CCCCFF" },
  { name: "Orchid", hex: "#DA70D6" },
  { name: "Plum", hex: "#DDA0DD" },
  { name: "Thistle", hex: "#D8BFD8" },
  { name: "Wisteria", hex: "#C9A0DC" },
  { name: "Byzantium", hex: "#702963" },
  { name: "Tyrian Purple", hex: "#66023C" },
  { name: "Mulberry", hex: "#C54B8C" },
  { name: "Boysenberry", hex: "#873260" },
  { name: "Electric Indigo", hex: "#6F00FF" },
  { name: "Dark Purple", hex: "#301934" },
  { name: "Russian Violet", hex: "#32174D" },
  { name: "Grape", hex: "#6F2DA8" },
  { name: "Palatinate", hex: "#72246C" },
  { name: "Iris", hex: "#5A4FCF" },
  { name: "French Violet", hex: "#8806CE" },

  // Browns & Neutrals
  { name: "Chocolate", hex: "#7B3F00" },
  { name: "Coffee", hex: "#6F4E37" },
  { name: "Mocha", hex: "#3B2F2F" },
  { name: "Chestnut", hex: "#954535" },
  { name: "Mahogany", hex: "#C04000" },
  { name: "Sepia", hex: "#704214" },
  { name: "Sienna", hex: "#A0522D" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Sand", hex: "#C2B280" },
  { name: "Wheat", hex: "#F5DEB3" },
  { name: "Bisque", hex: "#FFE4C4" },
  { name: "Burlywood", hex: "#DEB887" },
  { name: "Almond", hex: "#EFDECD" },
  { name: "Hazelnut", hex: "#BDA55D" },
  { name: "Caramel", hex: "#AF6F09" },
  { name: "Cinnamon", hex: "#D2691E" },
  { name: "Taupe", hex: "#483C32" },
  { name: "Khaki Brown", hex: "#9E8B67" },
  { name: "Ecru", hex: "#C2B078" },
  { name: "Umber", hex: "#635147" }
];

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return [r, g, b];
}

// Perceptual color distance using redmean formula (fast and human-accurate)
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const rmean = (rgb1[0] + rgb2[0]) / 2;
  const r = rgb1[0] - rgb2[0];
  const g = rgb1[1] - rgb2[1];
  const b = rgb1[2] - rgb2[2];
  return Math.sqrt(
    (((512 + rmean) * r * r) >> 8) +
    4 * g * g +
    (((767 - rmean) * b * b) >> 8)
  );
}

export function getColorName(hex: string): string {
  try {
    const targetRgb = hexToRgb(hex);
    let minDistance = Infinity;
    let closestName = "Color";

    for (const item of COLOR_NAMES_DICTIONARY) {
      const itemRgb = hexToRgb(item.hex);
      const dist = colorDistance(targetRgb, itemRgb);
      if (dist < minDistance) {
        minDistance = dist;
        closestName = item.name;
        if (dist === 0) break;
      }
    }
    return closestName;
  } catch {
    return "Custom Shade";
  }
}
