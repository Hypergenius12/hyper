const fs = require('fs');

// Fix 1: audio.js - add plants to grass category
let audioCode = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');
audioCode = audioCode.replace(
    /        const grasses = \[BLOCKS\.GRASS, BLOCKS\.DIRT, BLOCKS\.SAVANNA_GRASS, BLOCKS\.SWAMP_GRASS, BLOCKS\.ALIEN_GRASS, BLOCKS\.PINE_GRASS, BLOCKS\.MUD, BLOCKS\.MYCELIUM, BLOCKS\.AETHER_GRASS, BLOCKS\.AETHER_DIRT, BLOCKS\.CRIMSON_NYLIUM, BLOCKS\.LEAVES, BLOCKS\.ACACIA_LEAVES, BLOCKS\.CHERRY_LEAVES, BLOCKS\.AUTUMN_LEAVES, BLOCKS\.PALM_LEAVES, BLOCKS\.PINE_LEAVES, BLOCKS\.DARK_OAK_LEAVES, BLOCKS\.GLOW_LEAVES, BLOCKS\.ENCHANTED_AETHER_LEAVES, BLOCKS\.CRIMSON_WART, BLOCKS\.MUSHROOM_CAP, BLOCKS\.ALIEN_SPORE_BLOCK\];/,
    `        const plants = [BLOCKS.TALL_GRASS, BLOCKS.ALIEN_TALL_GRASS, BLOCKS.AETHER_TALL_GRASS, BLOCKS.RED_FLOWER, BLOCKS.BLUE_FLOWER, BLOCKS.YELLOW_FLOWER, BLOCKS.WHITE_FLOWER, BLOCKS.PURPLE_FLOWER, BLOCKS.ORANGE_FLOWER, BLOCKS.FERN, BLOCKS.OASIS_FERN, BLOCKS.AETHER_FLOWER, BLOCKS.VINES, BLOCKS.SUGARCANE, BLOCKS.SEAGRASS, BLOCKS.ALGAE, BLOCKS.LILY_PAD, BLOCKS.CACTUS, BLOCKS.NETHER_WART_BLOCK, BLOCKS.TUBE_CORAL, BLOCKS.BRAIN_CORAL, BLOCKS.FIRE_CORAL, BLOCKS.HORN_CORAL, BLOCKS.BUBBLE_CORAL];
        if (plants.includes(blockType)) return 'grass';
        const grasses = [BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.SAVANNA_GRASS, BLOCKS.SWAMP_GRASS, BLOCKS.ALIEN_GRASS, BLOCKS.PINE_GRASS, BLOCKS.MUD, BLOCKS.MYCELIUM, BLOCKS.AETHER_GRASS, BLOCKS.AETHER_DIRT, BLOCKS.CRIMSON_NYLIUM, BLOCKS.LEAVES, BLOCKS.ACACIA_LEAVES, BLOCKS.CHERRY_LEAVES, BLOCKS.AUTUMN_LEAVES, BLOCKS.PALM_LEAVES, BLOCKS.PINE_LEAVES, BLOCKS.DARK_OAK_LEAVES, BLOCKS.GLOW_LEAVES, BLOCKS.ENCHANTED_AETHER_LEAVES, BLOCKS.CRIMSON_WART, BLOCKS.MUSHROOM_CAP, BLOCKS.ALIEN_SPORE_BLOCK];`
);
fs.writeFileSync('slopcraft 3D/js/audio.js', audioCode);

// Fix 2: main.js - default MC textures to true if not set
let mainCode = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');
// Change: localStorage.getItem('slopcraft_mc_textures') === 'true'
// To: localStorage.getItem('slopcraft_mc_textures') !== 'false'
// (so null = default on, only explicitly 'false' turns it off)
mainCode = mainCode.replace(
    /const useMC = localStorage\.getItem\('slopcraft_mc_textures'\) === 'true';/g,
    "const useMC = localStorage.getItem('slopcraft_mc_textures') !== 'false';"
);
mainCode = mainCode.replace(
    /if \(localStorage\.getItem\('slopcraft_mc_textures'\) === 'true'\)/g,
    "if (localStorage.getItem('slopcraft_mc_textures') !== 'false')"
);
fs.writeFileSync('slopcraft 3D/js/main.js', mainCode);

// Fix 3: audio.js - same defaulting for useMC checks
audioCode = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');
audioCode = audioCode.replace(
    /localStorage\.getItem\('slopcraft_mc_textures'\) === 'true'/g,
    "localStorage.getItem('slopcraft_mc_textures') !== 'false'"
);
fs.writeFileSync('slopcraft 3D/js/audio.js', audioCode);

// Fix 4: textures.js - same defaulting
let texCode = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');
texCode = texCode.replace(
    /localStorage\.getItem\('slopcraft_mc_textures'\) === 'true'/g,
    "localStorage.getItem('slopcraft_mc_textures') !== 'false'"
);
fs.writeFileSync('slopcraft 3D/js/textures.js', texCode);

console.log("Done");
