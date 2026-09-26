const fs = require('fs');

const MC_MAP = {
    GRASS: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    DIRT: 'dirt',
    STONE: 'stone',
    SAND: 'sand',
    WATER: 'water_flow',
    WOOD: { top: 'oak_log_top', side: 'oak_log', bottom: 'oak_log_top' },
    LEAVES: 'oak_leaves',
    PLANKS: 'oak_planks',
    COBBLESTONE: 'cobblestone',
    IRON_ORE: 'iron_ore',
    GOLD_ORE: 'gold_ore',
    CRYSTAL_ORE: 'diamond_ore',
    MANA_ORE: 'lapis_ore',
    OBSIDIAN: 'obsidian',
    GLOWSTONE: 'glowstone',
    MUSHROOM_STEM: 'mushroom_stem',
    MUSHROOM_CAP: 'red_mushroom_block',
    ALIEN_STONE: 'end_stone',
    ALIEN_GRASS: { top: 'mycelium_top', side: 'mycelium_side', bottom: 'end_stone' },
    ALIEN_CRYSTAL: 'purpur_block',
    SNOW: 'snow',
    ICE: 'ice',
    LAVA: 'lava_flow',
    PORTAL_FRAME: 'end_portal_frame_side',
    PORTAL: 'nether_portal',
    BEDROCK: 'bedrock',
    GRAVEL: 'gravel',
    CLAY: 'clay',
    GLASS: 'glass',
    TORCH: 'torch',
    SANDSTONE: { top: 'sandstone_top', side: 'sandstone', bottom: 'sandstone_bottom' },
    RED_SAND: 'red_sand',
    TERRACOTTA: 'terracotta',
    DEAD_BUSH: 'dead_bush',
    ALIEN_TALL_GRASS: 'crimson_roots',
    SAVANNA_GRASS: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    ACACIA_WOOD: { top: 'acacia_log_top', side: 'acacia_log', bottom: 'acacia_log_top' },
    ACACIA_LEAVES: 'acacia_leaves',
    MUD: 'podzol_top',
    SWAMP_GRASS: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    SWAMP_WATER: 'water_flow',
    ALIEN_SPORE_STEM: 'warped_stem',
    ALIEN_SPORE_BLOCK: 'warped_wart_block',
    VINES: 'vine',
    TALL_GRASS: 'tall_grass_top',
    RED_FLOWER: 'poppy',
    CACTUS: { top: 'cactus_top', side: 'cactus_side', bottom: 'cactus_bottom' },
    BLUE_FLOWER: 'cornflower',
    YELLOW_FLOWER: 'dandelion',
    FERN: 'fern',
    WHITE_FLOWER: 'lily_of_the_valley',
    PURPLE_FLOWER: 'allium',
    ORANGE_FLOWER: 'orange_tulip',
    CHERRY_LOG: { top: 'cherry_log_top', side: 'cherry_log', bottom: 'cherry_log_top' },
    CHERRY_LEAVES: 'cherry_leaves',
    PINK_PETALS: 'pink_petals',
    AUTUMN_WOOD: { top: 'spruce_log_top', side: 'spruce_log', bottom: 'spruce_log_top' },
    AUTUMN_LEAVES: 'spruce_leaves',
    FALLEN_LEAVES: 'podzol_top',
    GLOW_STEM: 'crimson_stem',
    GLOW_LEAVES: 'shroomlight',
    GLOW_SHROOM: 'red_mushroom',
    BOSS_SPAWNER: 'spawner',
    COAL_ORE: 'coal_ore',
    DIAMOND_ORE: 'diamond_ore',
    STONE_BRICKS: 'stone_bricks',
    BRICKS: 'bricks',
    BOOKSHELF: 'bookshelf',
    MOSSY_COBBLESTONE: 'mossy_cobblestone',
    CHEST_BLOCK: { top: 'crafting_table_top', side: 'crafting_table_side', bottom: 'oak_planks', front: 'crafting_table_front' }, 
    LADDER: 'ladder',
    IRON_BLOCK: 'iron_block',
    GOLD_BLOCK: 'gold_block',
    DIAMOND_BLOCK: 'diamond_block',
    WOOL: 'white_wool',
    FURNACE: { top: 'furnace_top', side: 'furnace_side', bottom: 'furnace_top', front: 'furnace_front' },
    NETHERRACK: 'netherrack',
    SOUL_SAND: 'soul_sand',
    NETHER_BRICKS: 'nether_bricks',
    CRIMSON_NYLIUM: { top: 'crimson_nylium', side: 'crimson_nylium_side', bottom: 'netherrack' },
    CRIMSON_STEM: { top: 'crimson_stem_top', side: 'crimson_stem', bottom: 'crimson_stem_top' },
    CRIMSON_LEAVES: 'crimson_roots',
    NETHER_WART_BLOCK: 'nether_wart_block',
    TUBE_CORAL: 'tube_coral',
    BRAIN_CORAL: 'brain_coral',
    FIRE_CORAL: 'fire_coral',
    HORN_CORAL: 'horn_coral',
    PINE_WOOD: { top: 'spruce_log_top', side: 'spruce_log', bottom: 'spruce_log_top' },
    PINE_LEAVES: 'spruce_leaves',
    ACACIA_PLANKS: 'acacia_planks',
    CHERRY_PLANKS: 'cherry_planks',
    AUTUMN_PLANKS: 'spruce_planks',
    PALM_PLANKS: 'jungle_planks',
    PINE_PLANKS: 'spruce_planks',
    CRIMSON_PLANKS: 'crimson_planks',
    SUGARCANE: 'sugar_cane',
    FIRE: 'fire_0',
    TNT: { top: 'tnt_top', side: 'tnt_side', bottom: 'tnt_bottom' },
    CRAFTING_TABLE: { top: 'crafting_table_top', side: 'crafting_table_side', bottom: 'oak_planks', front: 'crafting_table_front' },
    AETHER_STONE: 'end_stone',
    AETHER_DIRT: 'end_stone_bricks',
    AETHER_GRASS: { top: 'end_stone', side: 'end_stone_bricks', bottom: 'end_stone_bricks' },
    AETHER_WOOD: { top: 'quartz_pillar_top', side: 'quartz_pillar', bottom: 'quartz_pillar_top' },
    AETHER_LEAVES: 'cyan_wool',
    AETHER_PORTAL: 'end_gateway_beam',
    AETHER_CLOUD: 'white_wool',
    AETHER_TALL_GRASS: 'end_rod',
    AETHER_FLOWER: 'chorus_flower',
    AETHER_CRYSTAL: 'sea_lantern',
    CAVERN_STONE: 'andesite',
    CAVERN_DIRT: 'dirt',
    CAVERN_PORTAL: 'obsidian',
    MAGMA_STONE: 'magma_block',
    HIGHLANDS_STONE: 'diorite',
    HIGHLANDS_DIRT: 'dirt',
    HIGHLANDS_GRASS: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    HIGHLANDS_PORTAL: 'emerald_block',
    SEAGRASS: 'seagrass',
    KELP: 'kelp',
    BUBBLE_CORAL: 'bubble_coral',
    SEASHELL_1: 'bone_block_top',
    SEASHELL_2: 'nautilus_shell',
    SEASHELL_3: 'scute',
    LILY_PAD: 'lily_pad',
    ALGAE: 'lily_pad',
    RED_KELP: 'crimson_roots',
    BROWN_KELP: 'weeping_vines',
    QUICKSOIL: 'sand',
    HOLYSTONE: 'end_stone_bricks',
    ENCHANTED_AETHER_LOG: { top: 'purpur_pillar_top', side: 'purpur_pillar', bottom: 'purpur_pillar_top' },
    ENCHANTED_AETHER_LEAVES: 'purple_stained_glass'
};

const scriptStr = `
const MINECRAFT_ASSETS_BASE = "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.16.5/assets/minecraft/textures/";

const MC_TEXTURE_MAP = {
` + Object.keys(MC_MAP).map(k => {
    let v = MC_MAP[k];
    if (typeof v === 'string') {
        return `    [BLOCKS.${k}]: '${v}'`;
    } else {
        return `    [BLOCKS.${k}]: { top: '${v.top}', side: '${v.side}', bottom: '${v.bottom}'${v.front ? `, front: '${v.front}'` : ''} }`;
    }
}).join(',\n') + `
};

function loadMinecraftTexture(name) {
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
        img.src = MINECRAFT_ASSETS_BASE + 'block/' + name + '.png';
    });
}
`;

let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

// Insert MC_TEXTURE_MAP before createTextureAtlas
code = code.replace('export function createTextureAtlas()', scriptStr + '\nexport async function createTextureAtlas(useMinecraft = false)');

// Find the end of createTextureAtlas to add the fetching logic
const insertPoint = `    const texture = new THREE.CanvasTexture(canvas);`;

const fetchLogic = `    // Fetch Minecraft textures if enabled
    if (useMinecraft) {
        const promises = [];
        for (const entry of entries) {
            const bt = entry.blockType;
            let mcName = MC_TEXTURE_MAP[bt];
            if (!mcName) continue;
            
            let texName;
            if (typeof mcName === 'string') {
                texName = mcName;
            } else {
                texName = mcName[entry.face] || mcName['side'];
            }
            
            if (texName) {
                promises.push(loadMinecraftTexture(texName).then(img => {
                    if (img) {
                        ctx.clearRect(entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                        ctx.drawImage(img, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                    }
                }));
            }
        }
        await Promise.all(promises);
    }

    const texture = new THREE.CanvasTexture(canvas);`;

code = code.replace(insertPoint, fetchLogic);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
