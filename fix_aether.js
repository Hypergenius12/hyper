const fs = require('fs');
let tex = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

// Add Aether CDN base
tex = tex.replace(
    `const MINECRAFT_ASSETS_BASE = "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.11/assets/minecraft/textures/";`,
    `const MINECRAFT_ASSETS_BASE = "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.11/assets/minecraft/textures/";
const AETHER_ASSETS_BASE = "https://raw.githubusercontent.com/The-Aether-Team/The-Aether/1.21.1-develop/src/main/resources/assets/aether/textures/block/natural/";`
);

// Update loadMinecraftTexture to handle aether:// prefix
tex = tex.replace(
    `function loadMinecraftTexture(name) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
            // Some names might be items instead of blocks
            const altImg = new Image();
            altImg.crossOrigin = 'anonymous';
            altImg.onload = () => resolve(altImg);
            altImg.onerror = () => resolve(null);
            altImg.src = MINECRAFT_ASSETS_BASE + 'item/' + name + '.png';
        };
        if (name.includes('/')) img.src = MINECRAFT_ASSETS_BASE + name + '.png';
        else img.src = MINECRAFT_ASSETS_BASE + 'block/' + name + '.png';
    });
}`,
    `function loadMinecraftTexture(name) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
            // Some names might be items instead of blocks
            const altImg = new Image();
            altImg.crossOrigin = 'anonymous';
            altImg.onload = () => resolve(altImg);
            altImg.onerror = () => resolve(null);
            altImg.src = MINECRAFT_ASSETS_BASE + 'item/' + name + '.png';
        };
        if (name.startsWith('aether://')) {
            img.src = AETHER_ASSETS_BASE + name.slice(9) + '.png';
        } else if (name.includes('/')) {
            img.src = MINECRAFT_ASSETS_BASE + name + '.png';
        } else {
            img.src = MINECRAFT_ASSETS_BASE + 'block/' + name + '.png';
        }
    });
}`
);

// Fix aether MC_TEXTURE_MAP entries
tex = tex.replace(
    `    [BLOCKS.AETHER_GRASS]: { top: 'end_stone', side: 'end_stone_bricks', bottom: 'end_stone_bricks' },`,
    `    [BLOCKS.AETHER_GRASS]: { top: 'aether://aether_grass_block_top', side: 'aether://aether_grass_block_side', bottom: 'aether://aether_grass_block_top' },`
);
tex = tex.replace(
    `    [BLOCKS.AETHER_LEAVES]: 'cyan_wool',`,
    `    [BLOCKS.AETHER_LEAVES]: 'aether://golden_oak_leaves',`
);
tex = tex.replace(
    `    [BLOCKS.AETHER_TALL_GRASS]: 'end_rod',`,
    `    [BLOCKS.AETHER_TALL_GRASS]: 'aether://skyroot_leaves',`
);
tex = tex.replace(
    `    [BLOCKS.AETHER_FLOWER]: 'chorus_flower',`,
    `    [BLOCKS.AETHER_FLOWER]: 'aether://white_flower',`
);

// Also fix aether:// paths in the tint detection — they have no biome tint needed (they're already coloured)
// The requiresTint check uses texName includes-based matching, aether:// names won't match 'leaves' etc — good.

fs.writeFileSync('slopcraft 3D/js/textures.js', tex);
console.log("Done");
