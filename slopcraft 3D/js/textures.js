// ============================================
// textures.js — Procedural Texture Atlas + Block Definitions
// ============================================
import * as THREE from 'three';
import { seededRandom } from './noise.js';

// Block type IDs
export const BLOCKS = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    SAND: 4,
    WATER: 5,
    WOOD: 6,
    LEAVES: 7,
    PLANKS: 8,
    COBBLESTONE: 9,
    IRON_ORE: 10,
    GOLD_ORE: 11,
    CRYSTAL_ORE: 12,
    MANA_ORE: 13,
    OBSIDIAN: 14,
    GLOWSTONE: 15,
    DUNGEON_BRICK: 16,
    DUNGEON_FLOOR: 17,
    MUSHROOM_STEM: 18,
    MUSHROOM_CAP: 19,
    ALIEN_STONE: 20,
    ALIEN_GRASS: 21,
    ALIEN_CRYSTAL: 22,
    SNOW: 23,
    ICE: 24,
    LAVA: 25,
    PORTAL_FRAME: 26,
    PORTAL: 27,
    BEDROCK: 28,
    GRAVEL: 29,
    CLAY: 30,
    GLASS: 31,
    TORCH: 32,
    SANDSTONE: 33,
    RED_SAND: 34,
    TERRACOTTA: 35,
    DEAD_BUSH: 36,
    ALIEN_TALL_GRASS: 37,
    SAVANNA_GRASS: 38,
    ACACIA_WOOD: 39,
    ACACIA_LEAVES: 40,
    MUD: 41,
    SWAMP_GRASS: 42,
    SWAMP_WATER: 43,
    ALIEN_SPORE_STEM: 44,
    ALIEN_SPORE_BLOCK: 45,
    VINES: 46,
    TALL_GRASS: 47,
    RED_FLOWER: 48,
    CACTUS: 49,
    BLUE_FLOWER: 50,
    YELLOW_FLOWER: 51,
    FERN: 52,
    TALL_FERN: 143,
    TALL_FERN_TOP: 144,
    WHITE_FLOWER: 53,
    PURPLE_FLOWER: 185,
    ORANGE_FLOWER: 186,
    CHERRY_LOG: 54,
    CHERRY_LEAVES: 55,
    PINK_PETALS: 56,
    AUTUMN_WOOD: 57,
    AUTUMN_LEAVES: 58,
    FALLEN_LEAVES: 59,
    GLOW_STEM: 60,
    GLOW_LEAVES: 61,
    GLOW_SHROOM: 62,
    PALM_WOOD: 63,
    PALM_LEAVES: 64,
    OASIS_FERN: 65,
    DUNGEON_FIRE_BRICK: 66,
    DUNGEON_FIRE_FLOOR: 67,
    DUNGEON_ICE_BRICK: 68,
    DUNGEON_ICE_FLOOR: 69,
    DUNGEON_JUNGLE_BRICK: 70,
    DUNGEON_JUNGLE_FLOOR: 71,
    DUNGEON_DESERT_BRICK: 72,
    DUNGEON_DESERT_FLOOR: 73,
    DUNGEON_UNDEAD_BRICK: 74,
    DUNGEON_UNDEAD_FLOOR: 75,
    DUNGEON_DOOR: 76,
    DUNGEON_DOOR_TOP: 194,
    BOSS_SPAWNER: 77,
    COAL_ORE: 78,
    DIAMOND_ORE: 79,
    STONE_BRICKS: 80,
    BRICKS: 81,
    BOOKSHELF: 82,
    MOSSY_COBBLESTONE: 83,
    CHEST_BLOCK: 84,
    LADDER: 85,
    IRON_BLOCK: 86,
    GOLD_BLOCK: 87,
    DIAMOND_BLOCK: 88,
    WOOL: 89,
    FURNACE: 90,
    NETHERRACK: 91,
    SOUL_SAND: 92,
    NETHER_BRICKS: 93,
    CRIMSON_NYLIUM: 94,
    CRIMSON_STEM: 95,
    CRIMSON_LEAVES: 96,
    NETHER_WART_BLOCK: 97,
    TUBE_CORAL: 98,
    BRAIN_CORAL: 99,
    FIRE_CORAL: 100,
    HORN_CORAL: 101,
    PINE_WOOD: 102,
    PINE_LEAVES: 103,
    ACACIA_PLANKS: 104,
    CHERRY_PLANKS: 105,
    AUTUMN_PLANKS: 106,
    PALM_PLANKS: 107,
    PINE_PLANKS: 108,
    CRIMSON_PLANKS: 109,
    SUGARCANE: 110,
    FIRE: 111,
    TNT: 112,
    CRAFTING_TABLE: 113,
    AETHER_STONE: 114,
    AETHER_DIRT: 115,
    AETHER_GRASS: 116,
    AETHER_WOOD: 117,
    AETHER_LEAVES: 118,
    AETHER_PORTAL: 119,
    AETHER_CLOUD: 120,
    AETHER_TALL_GRASS: 121,
    AETHER_FLOWER: 122,
    AETHER_CRYSTAL: 123,
    CAVERN_STONE: 124,
    CAVERN_DIRT: 125,
    CAVERN_PORTAL: 126,
    MAGMA_STONE: 127,
    HIGHLANDS_STONE: 128,
    HIGHLANDS_DIRT: 129,
    HIGHLANDS_GRASS: 130,
    HIGHLANDS_PORTAL: 131,
    SEAGRASS: 132,
    KELP: 133,
    BUBBLE_CORAL: 134,
    SEASHELL_1: 135,
    SEASHELL_2: 136,
    SEASHELL_3: 137,
    LILY_PAD: 138,
    ALGAE: 139,
    RED_KELP: 140,
    BROWN_KELP: 141,
    QUICKSOIL: 187,
    HOLYSTONE: 188,
    ENCHANTED_AETHER_LOG: 189,
    ENCHANTED_AETHER_LEAVES: 190,
    DARK_OAK_WOOD: 191,
    DARK_OAK_LEAVES: 192,
    DARK_OAK_PLANKS: 193,
    CRYING_OBSIDIAN: 195,
    MYCELIUM: 196,
    WARPED_NYLIUM: 197,
    WARPED_STEM: 198,
    WARPED_WART_BLOCK: 199,
    WARPED_ROOTS: 200,
    TWISTING_VINES: 201,
    NETHER_SPROUTS: 202,
    SOUL_SOIL: 203,
    BONE_BLOCK: 204,
    SOUL_FIRE: 205,
    BASALT: 206,
    SMOOTH_BASALT: 207,
    MAGMA: 208,
    BLACKSTONE: 209,
    SHROOMLIGHT: 210,
    ZANITE_ORE: 211,
    GRAVITITE_ORE: 212,
    AMBROSIUM_ORE: 213,
    CARVED_HOLYSTONE: 214,
    SENTRY_STONE: 215,
    BLUE_AERCLOUD: 216,
    GOLDEN_AERCLOUD: 217,
    GOLDEN_OAK_WOOD: 218,
    GOLDEN_OAK_LEAVES: 219,
    MAGIC_WOOD: 220,
    MAGIC_LEAVES: 221,
    REDWOOD_LOG: 222,
    REDWOOD_LEAVES: 223,
    LAVENDER: 224,
    PODZOL: 225,
    RUBY_ORE: 226,
    SAPPHIRE_ORE: 227,
    FLETCHING_TABLE: 142,
    SMOKER: 145,
    STONECUTTER: 149,
    EMERALD_BLOCK: 150,
    LAPIS_BLOCK: 151,
    REDSTONE_BLOCK: 152,
    COAL_BLOCK: 153,
    RED_MUSHROOM: 228,
    BROWN_MUSHROOM: 229,
    BROWN_MUSHROOM_BLOCK: 230,
    MANGROVE_LOG: 231,
    MANGROVE_LEAVES: 232,
    MANGROVE_ROOTS: 233,
    MUDDY_MANGROVE_ROOTS: 234,
    MANGROVE_PLANKS: 235
};

// Block properties
const BLOCK_PROPS = {
    [BLOCKS.RED_MUSHROOM]:          { name: 'Red Mushroom',          health: 1, transparent: true, emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.BROWN_MUSHROOM]:        { name: 'Brown Mushroom',        health: 1, transparent: true, emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.BROWN_MUSHROOM_BLOCK]:  { name: 'Brown Mushroom Block',  health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.MANGROVE_LOG]:          { name: 'Mangrove Log',          health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.MANGROVE_LEAVES]:       { name: 'Mangrove Leaves',       health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true, isFoliageTinted: true },
    [BLOCKS.MANGROVE_ROOTS]:        { name: 'Mangrove Roots',        health: 2, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.MUDDY_MANGROVE_ROOTS]:  { name: 'Muddy Mangrove Roots',  health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.MANGROVE_PLANKS]:       { name: 'Mangrove Planks',       health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.FLETCHING_TABLE]:   { name: 'Fletching Table',   health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.SMOKER]:            { name: 'Smoker',            health: 6, transparent: false, emissive: 0, solid: true, drops: null, hasFacing: true },
    [BLOCKS.STONECUTTER]:       { name: 'Stonecutter',       health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.EMERALD_BLOCK]:     { name: 'Emerald Block',     health: 8, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.LAPIS_BLOCK]:       { name: 'Lapis Block',       health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.REDSTONE_BLOCK]:    { name: 'Redstone Block',    health: 6, transparent: false, emissive: 0.6, solid: true, drops: null },
    [BLOCKS.COAL_BLOCK]:        { name: 'Coal Block',        health: 6, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.AIR]:           { name: 'Air',           health: 0, transparent: true,  emissive: 0, solid: false, drops: null },
    [BLOCKS.GRASS]:         { name: 'Grass',         health: 3, transparent: false, emissive: 0, solid: true, drops: BLOCKS.DIRT, isGrassTinted: true },
    [BLOCKS.DIRT]:          { name: 'Dirt',           health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.STONE]:         { name: 'Stone',          health: 6, transparent: false, emissive: 0, solid: true, drops: BLOCKS.COBBLESTONE },
    [BLOCKS.SAND]:          { name: 'Sand',           health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.WATER]:         { name: 'Water',          health: 0, transparent: true,  emissive: 0, solid: false, isLiquid: true, drops: null },
    [BLOCKS.WOOD]:          { name: 'Wood',           health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.LEAVES]:        { name: 'Leaves',         health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true, isFoliageTinted: true },
    [BLOCKS.PLANKS]:        { name: 'Planks',         health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.COBBLESTONE]:   { name: 'Cobblestone',    health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.IRON_ORE]:      { name: 'Iron Ore',       health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.GOLD_ORE]:      { name: 'Gold Ore',       health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CRYSTAL_ORE]:   { name: 'Crystal Ore',    health: 10, transparent: false, emissive: 0.3, solid: true, drops: null },
    [BLOCKS.MANA_ORE]:      { name: 'Mana Ore',       health: 10, transparent: false, emissive: 0.5, solid: true, drops: null },
    [BLOCKS.OBSIDIAN]:      { name: 'Obsidian',       health: 15, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CRAFTING_TABLE]:{ name: 'Crafting Table', health: 4, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.GLOWSTONE]:     { name: 'Glowstone',      health: 4, transparent: false, emissive: 1.0, solid: true, drops: null },
    [BLOCKS.DUNGEON_BRICK]: { name: 'Dungeon Brick',  health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_FLOOR]: { name: 'Dungeon Floor',  health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.MUSHROOM_STEM]: { name: 'Mushroom Stem',  health: 3, transparent: false, emissive: 0, solid: true, drops: null, isLog: true },
    [BLOCKS.MUSHROOM_CAP]:  { name: 'Mushroom Cap',   health: 2, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.ALIEN_STONE]:   { name: 'Alien Stone',    health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.ALIEN_GRASS]:   { name: 'Alien Grass',    health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.ALIEN_CRYSTAL]: { name: 'Alien Crystal',  health: 10, transparent: true, emissive: 0.8, solid: true, drops: null },
    [BLOCKS.SNOW]:          { name: 'Snow',           health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.ICE]:           { name: 'Ice',            health: 3, transparent: true,  emissive: 0, solid: true, drops: null },
    [BLOCKS.LAVA]:          { name: 'Lava',           health: 0, transparent: false, emissive: 1.0, solid: false, isLiquid: true, drops: null },
    [BLOCKS.PORTAL_FRAME]:  { name: 'Portal Frame',   health: 20, transparent: false, emissive: 0.4, solid: true, drops: null },
    [BLOCKS.PORTAL]:        { name: 'Portal',         health: 0, transparent: true,  emissive: 1.0, solid: false, drops: null },
    [BLOCKS.BEDROCK]:       { name: 'Bedrock',        health: Infinity, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.GRAVEL]:        { name: 'Gravel',         health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CLAY]:          { name: 'Clay',           health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.GLASS]:         { name: 'Glass',          health: 1, transparent: true,  emissive: 0, solid: true, drops: null },
    [BLOCKS.TORCH]:         { name: 'Torch',          health: 1, transparent: true,  emissive: 1.0, solid: false, isCross: true, drops: null },
    [BLOCKS.SANDSTONE]:     { name: 'Sandstone',      health: 5, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.RED_SAND]:      { name: 'Red Sand',       health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.TERRACOTTA]:    { name: 'Terracotta',     health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DEAD_BUSH]:     { name: 'Dead Bush',      health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.ALIEN_TALL_GRASS]:{ name: 'Alien Spores', health: 1, transparent: true,  emissive: 0.3, solid: false, isCross: true, drops: null },
    [BLOCKS.SAVANNA_GRASS]: { name: 'Savanna Grass',  health: 3, transparent: false, emissive: 0, solid: true, drops: BLOCKS.DIRT, isGrassTinted: true },
    [BLOCKS.ACACIA_WOOD]:   { name: 'Acacia Wood',    health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.ACACIA_LEAVES]: { name: 'Acacia Leaves',  health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.MUD]:           { name: 'Mud',            health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.SWAMP_GRASS]:   { name: 'Swamp Grass',    health: 3, transparent: false, emissive: 0, solid: true, drops: BLOCKS.DIRT, isGrassTinted: true },
    [BLOCKS.SWAMP_WATER]:   { name: 'Swamp Water',    health: 0, transparent: true,  emissive: 0, solid: false, isLiquid: true, drops: null },
    [BLOCKS.ALIEN_SPORE_STEM]:{name: 'Spore Stem',    health: 4, transparent: false, emissive: 0, solid: true, drops: null, isLog: true },
    [BLOCKS.ALIEN_SPORE_BLOCK]:{name:'Spore Block',   health: 2, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.VINES]:         { name: 'Vines',          health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null, flammable: true, isFoliageTinted: true },
    [BLOCKS.TALL_GRASS]:    { name: 'Tall Grass',     health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null, isGrassTinted: true },
    [BLOCKS.RED_FLOWER]:    { name: 'Red Flower',     health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.CACTUS]:        { name: 'Cactus',         health: 2, transparent: true,  emissive: 0, solid: true, drops: BLOCKS.CACTUS },
    [BLOCKS.BLUE_FLOWER]:   { name: 'Blue Flower',    health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.YELLOW_FLOWER]: { name: 'Yellow Flower',  health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.FERN]:          { name: 'Fern',           health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: BLOCKS.AIR, flammable: true, isGrassTinted: true },
    [BLOCKS.TALL_FERN]:     { name: 'Large Fern',     health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: BLOCKS.AIR, flammable: true, isGrassTinted: true },
    [BLOCKS.TALL_FERN_TOP]: { name: 'Large Fern Top', health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: BLOCKS.AIR, flammable: true, isGrassTinted: true },
    [BLOCKS.WHITE_FLOWER]:  { name: 'White Flower',   health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.PURPLE_FLOWER]: { name: 'Purple Flower',  health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.ORANGE_FLOWER]: { name: 'Orange Flower',  health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.CHERRY_LOG]:    { name: 'Cherry Log',     health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.CHERRY_LEAVES]: { name: 'Cherry Leaves',  health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.PINK_PETALS]:   { name: 'Pink Petals',    health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.AUTUMN_WOOD]:   { name: 'Autumn Wood',    health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.AUTUMN_LEAVES]: { name: 'Autumn Leaves',  health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.FALLEN_LEAVES]: { name: 'Fallen Leaves',  health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null, flammable: true },
    [BLOCKS.GLOW_STEM]:     { name: 'Glow Stem',      health: 4, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.GLOW_LEAVES]:   { name: 'Glow Leaves',    health: 1, transparent: true,  emissive: 0.5, solid: true, drops: null },
    [BLOCKS.GLOW_SHROOM]:   { name: 'Glow Shroom',    health: 1, transparent: true,  emissive: 0.8, solid: false, isCross: true, drops: null },
    [BLOCKS.PALM_WOOD]:     { name: 'Palm Wood',      health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.PALM_LEAVES]:   { name: 'Palm Leaves',    health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.OASIS_FERN]:    { name: 'Oasis Fern',     health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null, flammable: true },
    [BLOCKS.DUNGEON_FIRE_BRICK]: { name: 'Fire Brick', health: 12, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.DUNGEON_FIRE_FLOOR]: { name: 'Fire Floor', health: 12, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.DUNGEON_ICE_BRICK]:  { name: 'Ice Brick',  health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_ICE_FLOOR]:  { name: 'Ice Floor',  health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_JUNGLE_BRICK]:{name: 'Jungle Brick',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_JUNGLE_FLOOR]:{name: 'Jungle Floor',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_DESERT_BRICK]:{name: 'Desert Brick',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_DESERT_FLOOR]:{name: 'Desert Floor',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_UNDEAD_BRICK]:{name: 'Undead Brick',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_UNDEAD_FLOOR]:{name: 'Undead Floor',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_DOOR]:  { name: 'Dungeon Door',   health: 5, transparent: true, emissive: 0, solid: true, drops: BLOCKS.DUNGEON_DOOR },
    [BLOCKS.DUNGEON_DOOR_TOP]:  { name: 'Dungeon Door Top', health: 5, transparent: true, emissive: 0, solid: true, drops: null },
    [BLOCKS.BOSS_SPAWNER]:  { name: 'Boss Spawner',   health: Infinity, transparent: true, emissive: 0, solid: false, drops: null },
    [BLOCKS.COAL_ORE]:      { name: 'Coal Ore',       health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DIAMOND_ORE]:   { name: 'Diamond Ore',    health: 10, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.STONE_BRICKS]:  { name: 'Stone Bricks',   health: 7, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.BRICKS]:        { name: 'Bricks',         health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.BOOKSHELF]:     { name: 'Bookshelf',      health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.MOSSY_COBBLESTONE]:{ name: 'Mossy Cobble', health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CHEST_BLOCK]:   { name: 'Chest',          health: 4, transparent: true, emissive: 0, solid: true, drops: null },
    [BLOCKS.LADDER]:        { name: 'Ladder',         health: 2, transparent: true,  emissive: 0, solid: false, isCross: true, isClimbable: true, drops: null },
    [BLOCKS.IRON_BLOCK]:    { name: 'Iron Block',     health: 10, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.GOLD_BLOCK]:    { name: 'Gold Block',     health: 10, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.DIAMOND_BLOCK]: { name: 'Diamond Block',  health: 12, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.WOOL]:          { name: 'Wool',           health: 2, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.FURNACE]:       { name: 'Furnace',        health: 6, transparent: false, emissive: 0, solid: true, drops: null, hasFacing: true },
    [BLOCKS.NETHERRACK]:    { name: 'Netherrack',     health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.SOUL_SAND]:     { name: 'Soul Sand',      health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.NETHER_BRICKS]: { name: 'Nether Bricks',  health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CRIMSON_NYLIUM]:{ name: 'Crimson Nylium', health: 4, transparent: false, emissive: 0, solid: true, drops: 91 }, // drops netherrack
    [BLOCKS.CRIMSON_STEM]:  { name: 'Crimson Stem',   health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true }, // Will make it drop custom wood in drops logic if needed
    [BLOCKS.CRIMSON_LEAVES]:{ name: 'Crimson Leaves', health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.NETHER_WART_BLOCK]: { name: 'Nether Wart Block', health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.SEAGRASS]:      { name: 'Seagrass',       health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.KELP]:          { name: 'Green Kelp',     health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.RED_KELP]:        { name: 'Red Kelp',       health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.BROWN_KELP]:      { name: 'Brown Kelp',     health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.TUBE_CORAL]:    { name: 'Tube Coral',     health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.BRAIN_CORAL]:   { name: 'Brain Coral',    health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.BUBBLE_CORAL]:  { name: 'Bubble Coral',   health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.FIRE_CORAL]:    { name: 'Fire Coral',     health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.HORN_CORAL]:    { name: 'Horn Coral',     health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.SEASHELL_1]:    { name: 'Seashell',       health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.SEASHELL_2]:    { name: 'Seashell',       health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.SEASHELL_3]:    { name: 'Seashell',       health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.LILY_PAD]:      { name: 'Lily Pad',       health: 1, transparent: true, emissive: 0, solid: false, isCross: true, drops: null, isGrassTinted: true },
    [BLOCKS.ALGAE]:         { name: 'Algae',          health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.PINE_WOOD]:     { name: 'Pine Wood',      health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.PINE_LEAVES]:   { name: 'Pine Leaves',    health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.ACACIA_PLANKS]: { name: 'Acacia Planks',  health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.CHERRY_PLANKS]: { name: 'Cherry Planks',  health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.AUTUMN_PLANKS]: { name: 'Autumn Planks',  health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.PALM_PLANKS]:   { name: 'Palm Planks',    health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.PINE_PLANKS]:   { name: 'Pine Planks',    health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.CRIMSON_PLANKS]:{ name: 'Crimson Planks', health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.SUGARCANE]:     { name: 'Sugarcane',      health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: BLOCKS.SUGARCANE, flammable: true },
    [BLOCKS.FIRE]:          { name: 'Fire',           health: 0, transparent: true,  emissive: 1.0, solid: false, isCross: true, drops: null },
    [BLOCKS.TNT]:           { name: 'TNT',            health: 1, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.AETHER_STONE]:  { name: 'Aether Stone',   health: 10, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.AETHER_DIRT]:   { name: 'Aether Dirt',    health: 4, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.AETHER_GRASS]:  { name: 'Aether Grass',   health: 4, transparent: false, emissive: 0.1, solid: true, drops: 115 },
    [BLOCKS.AETHER_WOOD]:   { name: 'Aether Wood',    health: 7, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.DARK_OAK_WOOD]: { name: 'Dark Oak Wood',  health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.DARK_OAK_LEAVES]: { name: 'Dark Oak Leaves', health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true, isFoliageTinted: true },
    [BLOCKS.DARK_OAK_PLANKS]: { name: 'Dark Oak Planks', health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.CRYING_OBSIDIAN]: { name: 'Crying Obsidian', health: 15, transparent: false, emissive: 0.6, solid: true, drops: null },
    [BLOCKS.MYCELIUM]:      { name: 'Mycelium',       health: 3, transparent: false, emissive: 0, solid: true, drops: BLOCKS.DIRT },
    [BLOCKS.AETHER_LEAVES]: { name: 'Aether Leaves',  health: 1, transparent: true, emissive: 0.2, solid: true, drops: null, flammable: true },
    [BLOCKS.AETHER_PORTAL]: { name: 'Aether Portal',  health: 0, transparent: true, emissive: 0.5, solid: false, drops: null },
    [BLOCKS.AETHER_CLOUD]:  { name: 'Aether Cloud',   health: 1, transparent: true, emissive: 0.5, solid: true, drops: null },
    [BLOCKS.AETHER_TALL_GRASS]: { name: 'Aether Tall Grass', health: 1, transparent: true, emissive: 0.2, solid: false, isCross: true, drops: null },
    [BLOCKS.AETHER_FLOWER]: { name: 'Aether Flower',  health: 1, transparent: true, emissive: 0.4, solid: false, isCross: true, drops: null },
    [BLOCKS.AETHER_CRYSTAL]:{ name: 'Aether Crystal', health: 8, transparent: false, emissive: 0.8, solid: true, drops: null },
    [BLOCKS.CAVERN_STONE]:  { name: 'Cavern Stone',   health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CAVERN_DIRT]:   { name: 'Cavern Dirt',    health: 5, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CAVERN_PORTAL]: { name: 'Cavern Portal',  health: 0, transparent: true, emissive: 1.0, solid: false, drops: null },
    [BLOCKS.MAGMA_STONE]:   { name: 'Magma Stone',    health: 15, transparent: false, emissive: 0.8, solid: true, drops: null },
    [BLOCKS.HIGHLANDS_STONE]:{ name: 'Highlands Stone',health: 10, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.HIGHLANDS_DIRT]:{ name: 'Highlands Dirt', health: 4, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.HIGHLANDS_GRASS]:{ name: 'Highlands Grass',health: 4, transparent: false, emissive: 0.1, solid: true, drops: 129 }, // drops HIGHLANDS_DIRT
    [BLOCKS.HIGHLANDS_PORTAL]:{ name: 'Highlands Portal',health: 0, transparent: true, emissive: 1.0, solid: false, drops: null },
    [BLOCKS.QUICKSOIL]:     { name: 'Quicksoil',      health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.HOLYSTONE]:     { name: 'Holystone',      health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.ENCHANTED_AETHER_LOG]: { name: 'Enchanted Log', health: 5, transparent: false, emissive: 0.2, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.ENCHANTED_AETHER_LEAVES]: { name: 'Enchanted Leaves', health: 1, transparent: true, emissive: 0.2, solid: true, drops: null, flammable: true },
    [BLOCKS.WARPED_NYLIUM]: { name: 'Warped Nylium',  health: 4, transparent: false, emissive: 0.1, solid: true, drops: BLOCKS.NETHERRACK },
    [BLOCKS.WARPED_STEM]:   { name: 'Warped Stem',    health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.WARPED_WART_BLOCK]: { name: 'Warped Wart Block', health: 2, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.WARPED_ROOTS]:  { name: 'Warped Roots',   health: 1, transparent: true, emissive: 0.2, solid: false, isCross: true, drops: null },
    [BLOCKS.TWISTING_VINES]:{ name: 'Twisting Vines', health: 1, transparent: true, emissive: 0.2, solid: false, isCross: true, drops: null },
    [BLOCKS.NETHER_SPROUTS]:{ name: 'Nether Sprouts', health: 1, transparent: true, emissive: 0.2, solid: false, isCross: true, drops: null },
    [BLOCKS.SOUL_SOIL]:     { name: 'Soul Soil',      health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.BONE_BLOCK]:    { name: 'Bone Block',     health: 4, transparent: false, emissive: 0, solid: true, drops: null, isLog: true },
    [BLOCKS.SOUL_FIRE]:     { name: 'Soul Fire',      health: 0, transparent: true, emissive: 1.0, solid: false, isCross: true, drops: null },
    [BLOCKS.BASALT]:        { name: 'Basalt',         health: 6, transparent: false, emissive: 0, solid: true, drops: null, isLog: true },
    [BLOCKS.SMOOTH_BASALT]: { name: 'Smooth Basalt',  health: 6, transparent: false, emissive: 0, solid: true, drops: null, isLog: true },
    [BLOCKS.MAGMA]:         { name: 'Magma Block',    health: 3, transparent: false, emissive: 0.6, solid: true, drops: null },
    [BLOCKS.BLACKSTONE]:    { name: 'Blackstone',     health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.SHROOMLIGHT]:   { name: 'Shroomlight',    health: 2, transparent: false, emissive: 1.0, solid: true, drops: null },
    [BLOCKS.ZANITE_ORE]:    { name: 'Zanite Ore',     health: 8, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.GRAVITITE_ORE]: { name: 'Gravitite Ore',  health: 10, transparent: false, emissive: 0.5, solid: true, drops: null },
    [BLOCKS.AMBROSIUM_ORE]: { name: 'Ambrosium Ore',  health: 6, transparent: false, emissive: 0.4, solid: true, drops: null },
    [BLOCKS.CARVED_HOLYSTONE]: { name: 'Carved Holystone', health: 9, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.SENTRY_STONE]:  { name: 'Sentry Stone',   health: 12, transparent: false, emissive: 0.3, solid: true, drops: null },
    [BLOCKS.BLUE_AERCLOUD]: { name: 'Blue Aercloud',  health: 1, transparent: true, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.GOLDEN_AERCLOUD]: { name: 'Golden Aercloud', health: 1, transparent: true, emissive: 0.3, solid: true, drops: null },
    [BLOCKS.GOLDEN_OAK_WOOD]: { name: 'Golden Oak Wood', health: 6, transparent: false, emissive: 0.1, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.GOLDEN_OAK_LEAVES]: { name: 'Golden Oak Leaves', health: 1, transparent: true, emissive: 0.4, solid: true, drops: null, flammable: true },
    [BLOCKS.MAGIC_WOOD]:    { name: 'Magic Wood',     health: 5, transparent: false, emissive: 0.2, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.MAGIC_LEAVES]:  { name: 'Magic Leaves',   health: 1, transparent: true, emissive: 0.5, solid: true, drops: null, flammable: true },
    [BLOCKS.REDWOOD_LOG]:   { name: 'Redwood Log',    health: 6, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.REDWOOD_LEAVES]:{ name: 'Redwood Leaves', health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.LAVENDER]:      { name: 'Lavender',       health: 1, transparent: true, emissive: 0, solid: false, isCross: true, drops: null, flammable: true },
    [BLOCKS.PODZOL]:        { name: 'Podzol',         health: 3, transparent: false, emissive: 0, solid: true, drops: BLOCKS.DIRT },
    [BLOCKS.RUBY_ORE]:      { name: 'Ruby Ore',       health: 8, transparent: false, emissive: 0.3, solid: true, drops: null },
    [BLOCKS.SAPPHIRE_ORE]:  { name: 'Sapphire Ore',   health: 8, transparent: false, emissive: 0.3, solid: true, drops: null }
};

export function getBlockProperties(type) {
    return BLOCK_PROPS[type] || BLOCK_PROPS[BLOCKS.AIR];
}

export function getBlockName(type) {
    return (BLOCK_PROPS[type] || BLOCK_PROPS[BLOCKS.AIR]).name;
}

// Texture generation config
const TEX_SIZE = 16; // pixels per texture
const ATLAS_COLS = 8;
const BLOCK_COUNT = Object.keys(BLOCKS).length;
const ATLAS_ROWS = Math.ceil(BLOCK_COUNT / ATLAS_COLS);
export const ATLAS_SIZE = { cols: ATLAS_COLS, rows: ATLAS_ROWS, texSize: TEX_SIZE };

// ---- Pixel art texture generators ----

function fillBase(ctx, r, g, b) {
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
}

function addNoise(ctx, rng, intensity = 20) {
    const id = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
        const v = ((rng() - 0.5) * intensity) | 0;
        d[i] = Math.max(0, Math.min(255, d[i] + v));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + v));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + v));
    }
    ctx.putImageData(id, 0, 0);
}

function addPixels(ctx, rng, color, count) {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        ctx.fillRect((rng() * TEX_SIZE) | 0, (rng() * TEX_SIZE) | 0, 1, 1);
    }
}

function addLeaves(ctx, rng, c1, c2, c3) {
    const colors = [c1, c2, c3 || c1];
    for (let i = 0; i < 90; i++) {
        const x = (rng() * TEX_SIZE) | 0;
        const y = (rng() * TEX_SIZE) | 0;
        const w = 1 + ((rng() * 2) | 0);
        const h = 1 + ((rng() * 2) | 0);
        ctx.fillStyle = colors[(rng() * colors.length) | 0];
        ctx.fillRect(x, y, w, h);
    }
}

function addStripes(ctx, rng, color, axis = 'h', count = 3) {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        if (axis === 'h') {
            const y = (rng() * TEX_SIZE) | 0;
            ctx.fillRect(0, y, TEX_SIZE, 1);
        } else {
            const x = (rng() * TEX_SIZE) | 0;
            ctx.fillRect(x, 0, 1, TEX_SIZE);
        }
    }
}

function drawOreSpots(ctx, rng, color, count = 4) {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        const x = (rng() * (TEX_SIZE - 2)) | 0;
        const y = (rng() * (TEX_SIZE - 2)) | 0;
        const s = 1 + ((rng() * 2) | 0);
        ctx.fillRect(x, y, s, s);
    }
}

function drawPlanks(ctx, rng, r, g, b, strokeColor1, strokeColor2) {
    fillBase(ctx, r, g, b);
    addNoise(ctx, rng, 15);
    ctx.fillStyle = strokeColor1;
    for (let x = 0; x < TEX_SIZE; x += 4) {
        ctx.fillRect(x, 0, 1, TEX_SIZE);
    }
    ctx.fillStyle = strokeColor2;
    for (let i = 0; i < 40; i++) {
        const x = (rng() * TEX_SIZE) | 0;
        const y = (rng() * TEX_SIZE) | 0;
        const h = 2 + (rng() * 5) | 0;
        if (x % 4 !== 0) ctx.fillRect(x, y, 1, h);
    }
    ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
    for (let x = 2; x < TEX_SIZE; x += 4) {
        ctx.fillRect(x, 1, 1, 1);
        ctx.fillRect(x, TEX_SIZE - 2, 1, 1);
    }
}

function drawBricks(ctx, rng, mortarColor, brickVariation = 15) {
    const id = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    const d = id.data;
    // Draw mortar lines
    ctx.fillStyle = mortarColor;
    for (let y = 0; y < TEX_SIZE; y += 4) {
        ctx.fillRect(0, y, TEX_SIZE, 1);
    }
    for (let row = 0; row < 4; row++) {
        const offset = row % 2 === 0 ? 0 : 4;
        for (let x = offset; x < TEX_SIZE; x += 8) {
            ctx.fillRect(x, row * 4, 1, 4);
        }
    }
    addNoise(ctx, rng, brickVariation);
}

function addRings(ctx, rng, ringColor, borderColor = 'rgba(60, 45, 25, 0.9)') {
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(TEX_SIZE/2, TEX_SIZE/2, 3, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(TEX_SIZE/2, TEX_SIZE/2, 6, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, TEX_SIZE, TEX_SIZE);
}

// Generate texture for a block type
function generateBlockTexture(ctx, blockType, face, rng) {
    switch (blockType) {
        case BLOCKS.GRASS:
            if (face === 'top') {
                fillBase(ctx, 114, 161, 69);
                addNoise(ctx, rng, 15);
                addPixels(ctx, rng, 'rgba(90, 130, 50, 0.8)', 20);
                addPixels(ctx, rng, 'rgba(130, 180, 80, 0.8)', 15);
            } else if (face === 'bottom') {
                const id = ctx.createImageData(TEX_SIZE, TEX_SIZE);
                for (let i = 0; i < id.data.length; i += 4) {
                    let r = 114, g = 80, b = 56;
                    const noise = (rng() - 0.5) * 35;
                    id.data[i] = Math.min(255, Math.max(0, r + noise));
                    id.data[i+1] = Math.min(255, Math.max(0, g + noise));
                    id.data[i+2] = Math.min(255, Math.max(0, b + noise));
                    id.data[i+3] = 255;
                }
                ctx.putImageData(id, 0, 0);
            } else {
                // Exact Grass Side Mask (classic pattern)
                const grassMask = [
                    "GGGGGGGGGGGGGGGG",
                    "GGGGGGGGGGGGGGGG",
                    "GGGGGGGGGGGGGGGG",
                    "GGGGGGGGGGGGGGGG",
                    "GGGGGGGDGGGGGGGD",
                    "GDGGGGGDDGGGGDGD",
                    "GDDGGDDDDGDGDDDD",
                    "DDDDGDDDDDDDDDDD",
                    "DDDDDDDDDDDDDDDD",
                    "DDDDDDDDDDDDDDDD",
                    "DDDDDDDDDDDDDDDD",
                    "DDDDDDDDDDDDDDDD",
                    "DDDDDDDDDDDDDDDD",
                    "DDDDDDDDDDDDDDDD",
                    "DDDDDDDDDDDDDDDD",
                    "DDDDDDDDDDDDDDDD"
                ];

                const id = ctx.createImageData(TEX_SIZE, TEX_SIZE);
                const d = id.data;

                for (let y = 0; y < TEX_SIZE; y++) {
                    for (let x = 0; x < TEX_SIZE; x++) {
                        const i = (y * TEX_SIZE + x) * 4;
                        const isGrass = grassMask[y][x] === 'G';

                        let r, g, b;
                        if (isGrass) {
                            // Grass base color matching image
                            r = 106; g = 158; b = 59;
                        } else {
                            // Dirt base color matching image
                            r = 114; g = 80; b = 56;
                        }

                        // Add distinct blocky noise
                        const noise = (rng() - 0.5) * 35;
                        r = Math.min(255, Math.max(0, r + noise));
                        g = Math.min(255, Math.max(0, g + noise));
                        b = Math.min(255, Math.max(0, b + noise));

                        // If dirt and right under grass, add a tiny bit of shadow
                        if (!isGrass && y > 0 && grassMask[y-1][x] === 'G') {
                            r *= 0.8; g *= 0.8; b *= 0.8;
                        }

                        d[i] = r;
                        d[i+1] = g;
                        d[i+2] = b;
                        d[i+3] = 255;
                    }
                }
                ctx.putImageData(id, 0, 0);
            }
            break;
        case BLOCKS.DIRT:
            const dirtId = ctx.createImageData(TEX_SIZE, TEX_SIZE);
            for (let i = 0; i < dirtId.data.length; i += 4) {
                let r = 114, g = 80, b = 56;
                const noise = (rng() - 0.5) * 35;
                dirtId.data[i] = Math.min(255, Math.max(0, r + noise));
                dirtId.data[i+1] = Math.min(255, Math.max(0, g + noise));
                dirtId.data[i+2] = Math.min(255, Math.max(0, b + noise));
                dirtId.data[i+3] = 255;
            }
            ctx.putImageData(dirtId, 0, 0);
            break;
        case BLOCKS.STONE:
            fillBase(ctx, 125, 125, 125);
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, 'rgba(90, 90, 90, 0.6)', 30);
            addPixels(ctx, rng, 'rgba(160, 160, 160, 0.5)', 20);
            break;
        case BLOCKS.SAND:
            const sandId = ctx.createImageData(TEX_SIZE, TEX_SIZE);
            for (let i = 0; i < sandId.data.length; i += 4) {
                let r = 225, g = 215, b = 170;
                const noise = (rng() - 0.5) * 25;
                sandId.data[i] = Math.min(255, Math.max(0, r + noise));
                sandId.data[i+1] = Math.min(255, Math.max(0, g + noise));
                sandId.data[i+2] = Math.min(255, Math.max(0, b + noise));
                sandId.data[i+3] = 255;
            }
            ctx.putImageData(sandId, 0, 0);
            // Add a few larger grain specs for detail
            addPixels(ctx, rng, 'rgba(190, 180, 130, 0.8)', 15);
            addPixels(ctx, rng, 'rgba(250, 240, 200, 0.6)', 15);
            break;
        case BLOCKS.WATER:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            const wImgData = ctx.createImageData(TEX_SIZE, TEX_SIZE);
            for (let y = 0; y < TEX_SIZE; y++) {
                for (let x = 0; x < TEX_SIZE; x++) {
                    const u = (x / TEX_SIZE) * Math.PI * 2;
                    const v = (y / TEX_SIZE) * Math.PI * 2;
                    const wave = (Math.sin(u) * 0.5 + Math.cos(v) * 0.5 + Math.sin(u - v) * 0.25) / 1.25;
                    let r, g, b;
                    if (wave > 0) {
                        r = Math.round(43 + (110 - 43) * wave);
                        g = Math.round(95 + (165 - 95) * wave);
                        b = Math.round(232 + (250 - 232) * wave);
                    } else {
                        r = Math.round(43 - (43 - 28) * (-wave));
                        g = Math.round(95 - (95 - 72) * (-wave));
                        b = Math.round(232 - (232 - 195) * (-wave));
                    }
                    const pIdx = (y * TEX_SIZE + x) * 4;
                    wImgData.data[pIdx] = r;
                    wImgData.data[pIdx + 1] = g;
                    wImgData.data[pIdx + 2] = b;
                    wImgData.data[pIdx + 3] = 200;
                }
            }
            ctx.putImageData(wImgData, 0, 0);
            break;
        case BLOCKS.WOOD:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 160, 130, 80); // Lighter inner wood
                addNoise(ctx, rng, 15);
                // Draw rings
                ctx.strokeStyle = 'rgba(120, 90, 50, 0.8)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(8, 8, 3, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(8, 8, 6, 0, Math.PI*2); ctx.stroke();
                // Draw bark border
                ctx.strokeStyle = 'rgba(60, 45, 25, 0.9)';
                ctx.lineWidth = 2;
                ctx.strokeRect(0, 0, TEX_SIZE, TEX_SIZE);
            } else {
                fillBase(ctx, 80, 60, 35); // Darker brown bark base
                addNoise(ctx, rng, 10);
                // Vertical bark stripes
                ctx.fillStyle = 'rgba(40, 25, 15, 0.8)'; // Dark crevices
                for (let x = 0; x < TEX_SIZE; x += 2 + (rng()*2)|0) {
                    ctx.fillRect(x, 0, 1, TEX_SIZE);
                }
                ctx.fillStyle = 'rgba(100, 75, 45, 0.7)'; // Lighter ridges
                for (let x = 1; x < TEX_SIZE; x += 3 + (rng()*2)|0) {
                    ctx.fillRect(x, 0, 1, TEX_SIZE);
                }
                // Break up stripes slightly
                ctx.fillStyle = 'rgba(60, 40, 20, 0.5)';
                for (let i = 0; i < 30; i++) {
                    const x = (rng() * TEX_SIZE) | 0;
                    const y = (rng() * TEX_SIZE) | 0;
                    ctx.fillRect(x, y, 2, 2);
                }
            }
            break;
        case BLOCKS.LEAVES:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            fillBase(ctx, 25, 80, 20); // Darker base green
            addNoise(ctx, rng, 20);
            
            // Random leafy clusters
            for (let i = 0; i < 80; i++) {
                const x = (rng() * TEX_SIZE) | 0;
                const y = (rng() * TEX_SIZE) | 0;
                const shade = rng();
                if (shade < 0.3) {
                    ctx.fillStyle = 'rgba(15, 60, 15, 0.9)'; // deep shadow
                } else if (shade < 0.6) {
                    ctx.fillStyle = 'rgba(50, 120, 35, 0.9)'; // midtone
                } else {
                    ctx.fillStyle = 'rgba(80, 160, 50, 0.9)'; // highlight
                }
                const w = 1 + (rng() * 2) | 0;
                const h = 1 + (rng() * 2) | 0;
                ctx.fillRect(x, y, w, h);
            }
            
            // Very small transparent gaps (makes it dense but still slightly see-through)
            for (let i = 0; i < 40; i++) {
                const x = (rng() * TEX_SIZE) | 0;
                const y = (rng() * TEX_SIZE) | 0;
                ctx.clearRect(x, y, 1, 1);
            }
            break;

        case BLOCKS.COBBLESTONE:
            fillBase(ctx, 100, 100, 100);
            addNoise(ctx, rng, 15);
            // Draw stone borders
            ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
            for (let y = 0; y < TEX_SIZE; y++) {
                for (let x = 0; x < TEX_SIZE; x++) {
                    const cx = (x + (y % 6 > 2 ? 3 : 0)) % 5;
                    const cy = y % 4;
                    if (cx === 0 || cy === 0 || (rng() < 0.05)) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            // Add highlights
            ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
            for (let y = 0; y < TEX_SIZE; y++) {
                for (let x = 0; x < TEX_SIZE; x++) {
                    const cx = (x + (y % 6 > 2 ? 3 : 0)) % 5;
                    const cy = y % 4;
                    if (cx === 1 && cy === 1 && rng() < 0.8) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            break;
        case BLOCKS.IRON_ORE:
            fillBase(ctx, 128, 128, 128);
            addNoise(ctx, rng, 16);
            drawOreSpots(ctx, rng, 'rgba(200, 180, 160, 0.9)', 5);
            break;
        case BLOCKS.GOLD_ORE:
            fillBase(ctx, 128, 128, 128);
            addNoise(ctx, rng, 16);
            drawOreSpots(ctx, rng, 'rgba(255, 220, 50, 0.9)', 5);
            break;
        case BLOCKS.CRYSTAL_ORE:
            fillBase(ctx, 100, 100, 120);
            addNoise(ctx, rng, 14);
            drawOreSpots(ctx, rng, 'rgba(180, 100, 255, 0.9)', 6);
            drawOreSpots(ctx, rng, 'rgba(220, 160, 255, 0.6)', 3);
            break;
        case BLOCKS.MANA_ORE:
            fillBase(ctx, 90, 100, 130);
            addNoise(ctx, rng, 14);
            drawOreSpots(ctx, rng, 'rgba(50, 150, 255, 0.9)', 6);
            drawOreSpots(ctx, rng, 'rgba(100, 200, 255, 0.6)', 3);
            break;
        case BLOCKS.OBSIDIAN:
            fillBase(ctx, 20, 15, 30);
            addNoise(ctx, rng, 8);
            addPixels(ctx, rng, 'rgba(40,20,60,0.5)', 10);
            addPixels(ctx, rng, 'rgba(60,30,80,0.2)', 5);
            break;
        case BLOCKS.GLOWSTONE:
            fillBase(ctx, 200, 180, 80);
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, 'rgba(255,240,120,0.5)', 15);
            addPixels(ctx, rng, 'rgba(180,160,60,0.4)', 8);
            break;
        case BLOCKS.DUNGEON_BRICK:
            fillBase(ctx, 60, 55, 70);
            drawBricks(ctx, rng, 'rgba(40,38,50,0.7)', 12);
            addPixels(ctx, rng, 'rgba(80,70,90,0.3)', 5);
            break;
        case BLOCKS.DUNGEON_FLOOR:
            fillBase(ctx, 50, 48, 55);
            addNoise(ctx, rng, 12);
            ctx.fillStyle = 'rgba(35,33,40,0.5)';
            ctx.fillRect(0, 0, TEX_SIZE, 1);
            ctx.fillRect(0, 8, TEX_SIZE, 1);
            ctx.fillRect(0, 0, 1, TEX_SIZE);
            ctx.fillRect(8, 0, 1, TEX_SIZE);
            break;
        case BLOCKS.DUNGEON_FIRE_BRICK:
            fillBase(ctx, 90, 30, 20);
            drawBricks(ctx, rng, 'rgba(50,15,10,0.8)', 15);
            break;
        case BLOCKS.DUNGEON_FIRE_FLOOR:
            fillBase(ctx, 80, 25, 15); addNoise(ctx, rng, 10);
            ctx.fillStyle = 'rgba(40,10,5,0.6)'; ctx.fillRect(0,0,TEX_SIZE,1); ctx.fillRect(0,8,TEX_SIZE,1); ctx.fillRect(0,0,1,TEX_SIZE); ctx.fillRect(8,0,1,TEX_SIZE);
            break;
        case BLOCKS.DUNGEON_ICE_BRICK:
            fillBase(ctx, 120, 180, 220);
            drawBricks(ctx, rng, 'rgba(80,120,160,0.8)', 10);
            break;
        case BLOCKS.DUNGEON_ICE_FLOOR:
            fillBase(ctx, 110, 160, 200); addNoise(ctx, rng, 10);
            ctx.fillStyle = 'rgba(60,100,140,0.6)'; ctx.fillRect(0,0,TEX_SIZE,1); ctx.fillRect(0,8,TEX_SIZE,1); ctx.fillRect(0,0,1,TEX_SIZE); ctx.fillRect(8,0,1,TEX_SIZE);
            break;
        case BLOCKS.DUNGEON_JUNGLE_BRICK:
            fillBase(ctx, 50, 70, 50);
            drawBricks(ctx, rng, 'rgba(25,45,25,0.8)', 15);
            break;
        case BLOCKS.DUNGEON_JUNGLE_FLOOR:
            fillBase(ctx, 40, 60, 40); addNoise(ctx, rng, 10);
            ctx.fillStyle = 'rgba(20,35,20,0.6)'; ctx.fillRect(0,0,TEX_SIZE,1); ctx.fillRect(0,8,TEX_SIZE,1); ctx.fillRect(0,0,1,TEX_SIZE); ctx.fillRect(8,0,1,TEX_SIZE);
            break;
        case BLOCKS.DUNGEON_DESERT_BRICK:
            fillBase(ctx, 180, 160, 100);
            drawBricks(ctx, rng, 'rgba(120,100,60,0.8)', 12);
            break;
        case BLOCKS.DUNGEON_DESERT_FLOOR:
            fillBase(ctx, 160, 140, 80); addNoise(ctx, rng, 10);
            ctx.fillStyle = 'rgba(100,80,40,0.6)'; ctx.fillRect(0,0,TEX_SIZE,1); ctx.fillRect(0,8,TEX_SIZE,1); ctx.fillRect(0,0,1,TEX_SIZE); ctx.fillRect(8,0,1,TEX_SIZE);
            break;
        case BLOCKS.DUNGEON_UNDEAD_BRICK:
            fillBase(ctx, 40, 40, 45);
            drawBricks(ctx, rng, 'rgba(20,20,25,0.9)', 18);
            break;
        case BLOCKS.DUNGEON_UNDEAD_FLOOR:
            fillBase(ctx, 35, 35, 40); addNoise(ctx, rng, 10);
            ctx.fillStyle = 'rgba(15,15,20,0.6)'; ctx.fillRect(0,0,TEX_SIZE,1); ctx.fillRect(0,8,TEX_SIZE,1); ctx.fillRect(0,0,1,TEX_SIZE); ctx.fillRect(8,0,1,TEX_SIZE);
            break;
        case BLOCKS.DUNGEON_DOOR_TOP:
            ctx.fillStyle = '#654321';
            ctx.fillRect(0,0,16,16);
            ctx.fillStyle = '#111';
            ctx.fillRect(2,2,4,4);
            ctx.fillRect(10,2,4,4);
            ctx.fillRect(2,10,4,4);
            ctx.fillRect(10,10,4,4);
            break;
        case BLOCKS.DUNGEON_DOOR:
            fillBase(ctx, 40, 40, 45); // Dark stone base
            addNoise(ctx, rng, 8);
            
            // Outer stone border
            ctx.fillStyle = 'rgba(20, 20, 25, 0.8)';
            ctx.fillRect(0, 0, TEX_SIZE, 2);
            ctx.fillRect(0, 0, 2, TEX_SIZE);
            ctx.fillRect(TEX_SIZE - 2, 0, 2, TEX_SIZE);
            ctx.fillRect(0, TEX_SIZE - 2, TEX_SIZE, 2);
            
            // Glowing magical runes / seal
            ctx.fillStyle = 'rgba(255, 50, 50, 0.6)';
            ctx.fillRect(6, 6, 4, 4);
            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.fillRect(7, 7, 2, 2);
            
            // Crossbars
            ctx.fillStyle = 'rgba(15, 15, 20, 0.9)';
            ctx.fillRect(0, 7, TEX_SIZE, 2);
            ctx.fillRect(7, 0, 2, TEX_SIZE);
            break;
        case BLOCKS.BOSS_SPAWNER:
            ctx.clearRect(0,0,TEX_SIZE,TEX_SIZE); // Invisible
            break;
        case BLOCKS.MUSHROOM_STEM:
            fillBase(ctx, 200, 190, 170);
            addNoise(ctx, rng, 10);
            addStripes(ctx, rng, 'rgba(180,170,150,0.4)', 'h', 3);
            break;
        case BLOCKS.MUSHROOM_CAP:
            fillBase(ctx, 180, 40, 40);
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, 'rgba(255,255,255,0.7)', 4);
            break;
        case BLOCKS.BROWN_MUSHROOM_BLOCK:
            fillBase(ctx, 138, 92, 56);
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, 'rgba(110,70,40,0.5)', 6);
            break;
        case BLOCKS.ALIEN_STONE:
            fillBase(ctx, 50, 70, 80);
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, 'rgba(30,100,100,0.4)', 8);
            addPixels(ctx, rng, 'rgba(80,120,100,0.2)', 5);
            break;
        case BLOCKS.ALIEN_GRASS:
            if (face === 'top') {
                fillBase(ctx, 40, 180, 140);
                addNoise(ctx, rng, 18);
                addPixels(ctx, rng, 'rgba(80,220,180,0.4)', 10);
            } else if (face === 'bottom') {
                fillBase(ctx, 50, 70, 80);
                addNoise(ctx, rng, 12);
            } else {
                fillBase(ctx, 50, 70, 80);
                addNoise(ctx, rng, 10);
                ctx.fillStyle = 'rgba(40,180,140,0.8)';
                ctx.fillRect(0, 0, TEX_SIZE, 3);
            }
            break;
        case BLOCKS.ALIEN_CRYSTAL:
            fillBase(ctx, 120, 60, 200);
            addNoise(ctx, rng, 18);
            addPixels(ctx, rng, 'rgba(200,150,255,0.6)', 10);
            addPixels(ctx, rng, 'rgba(255,200,255,0.3)', 5);
            break;
        case BLOCKS.SNOW:
            fillBase(ctx, 235, 245, 255);
            addNoise(ctx, rng, 8);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            for (let i = 0; i < 30; i++) {
                ctx.fillRect((rng() * TEX_SIZE) | 0, (rng() * TEX_SIZE) | 0, 1, 1);
            }
            ctx.fillStyle = 'rgba(210, 225, 240, 0.8)';
            for (let i = 0; i < 20; i++) {
                ctx.fillRect((rng() * TEX_SIZE) | 0, (rng() * TEX_SIZE) | 0, 1, 1);
            }
            break;
        case BLOCKS.ICE:
            fillBase(ctx, 160, 210, 240);
            addNoise(ctx, rng, 10);
            ctx.fillStyle = 'rgba(200,230,255,0.3)';
            ctx.fillRect((rng() * 12) | 0, 0, 2, TEX_SIZE);
            ctx.fillRect(0, (rng() * 12) | 0, TEX_SIZE, 2);
            break;
        case BLOCKS.LAVA:
            fillBase(ctx, 200, 60, 10);
            addNoise(ctx, rng, 25);
            addPixels(ctx, rng, 'rgba(255,120,20,0.6)', 10);
            addPixels(ctx, rng, 'rgba(255,200,50,0.4)', 6);
            addPixels(ctx, rng, 'rgba(150,30,0,0.5)', 8);
            break;
        case BLOCKS.PORTAL_FRAME:
            fillBase(ctx, 30, 20, 50);
            addNoise(ctx, rng, 10);
            drawOreSpots(ctx, rng, 'rgba(130,80,255,0.7)', 6);
            addPixels(ctx, rng, 'rgba(180,120,255,0.4)', 5);
            break;
        case BLOCKS.PORTAL:
            fillBase(ctx, 45, 10, 85);
            addNoise(ctx, rng, 20);
            for (let r = 2; r <= 8; r += 2) {
                ctx.strokeStyle = `rgba(${140 + r * 10}, ${30 + r * 8}, ${220 + r * 4}, 0.7)`;
                ctx.beginPath();
                ctx.arc(8, 8, r, rng() * Math.PI, rng() * Math.PI + Math.PI * 1.5);
                ctx.stroke();
            }
            addPixels(ctx, rng, 'rgba(210,130,255,0.8)', 20);
            addPixels(ctx, rng, 'rgba(255,200,255,0.9)', 10);
            break;
        case BLOCKS.BEDROCK:
            fillBase(ctx, 40, 40, 40);
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, 'rgba(25,25,25,0.5)', 15);
            addPixels(ctx, rng, 'rgba(60,60,60,0.3)', 8);
            break;
        case BLOCKS.GRAVEL:
            fillBase(ctx, 130, 125, 120);
            addNoise(ctx, rng, 22);
            addPixels(ctx, rng, 'rgba(110,105,100,0.5)', 12);
            addPixels(ctx, rng, 'rgba(150,145,140,0.4)', 8);
            break;
        case BLOCKS.CLAY:
            fillBase(ctx, 155, 145, 140);
            addNoise(ctx, rng, 10);
            break;
        case BLOCKS.GLASS:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = 'rgba(180, 210, 230, 0.2)';
            ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
            // Edge highlight
            ctx.fillStyle = 'rgba(200,230,255,0.7)';
            ctx.fillRect(0, 0, TEX_SIZE, 1);
            ctx.fillRect(0, 0, 1, TEX_SIZE);
            ctx.fillRect(TEX_SIZE-1, 0, 1, TEX_SIZE);
            ctx.fillRect(0, TEX_SIZE-1, TEX_SIZE, 1);
            break;
        case BLOCKS.TORCH:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#6b4f2c'; // stick
            ctx.fillRect(6, 4, 4, 12);
            ctx.fillStyle = '#ffaa00'; // flame
            ctx.fillRect(6, 2, 4, 4);
            ctx.fillStyle = '#ffee00'; // hot flame
            ctx.fillRect(7, 3, 2, 2);
            break;
        case BLOCKS.SANDSTONE:
            fillBase(ctx, 220, 205, 155);
            addNoise(ctx, rng, 15);
            if (face === 'side') {
                addStripes(ctx, rng, 'rgba(190, 175, 125, 0.5)', 'h', 4);
            }
            break;
        case BLOCKS.PINE_WOOD:
        case BLOCKS.DARK_OAK_WOOD:
            // Bark (dark brown with vertical striations)
            fillBase(ctx, 60, 40, 20);
            addNoise(ctx, rng, 15);
            ctx.fillStyle = 'rgba(40, 25, 10, 0.6)';
            for (let i=0; i<16; i+=2) {
                if (rng() > 0.5) ctx.fillRect(i, 0, 1, 16);
            }
            break;
        case BLOCKS.PINE_LEAVES:
        case BLOCKS.DARK_OAK_LEAVES:
            // Dark green dense needles
            fillBase(ctx, 20, 60, 30);
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, 'rgba(10, 40, 15, 0.9)', 80);
            addPixels(ctx, rng, 'rgba(40, 90, 50, 0.6)', 40);
            break;
        case BLOCKS.RED_SAND:
            fillBase(ctx, 180, 80, 30);
            addNoise(ctx, rng, 12);
            addPixels(ctx, rng, 'rgba(150, 60, 20, 0.4)', 8);
            break;
        case BLOCKS.TERRACOTTA:
            fillBase(ctx, 160, 90, 50);
            addNoise(ctx, rng, 5);
            break;
        case BLOCKS.DEAD_BUSH:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.strokeStyle = '#8c603b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(8, 16); ctx.lineTo(8, 6);
            ctx.moveTo(8, 12); ctx.lineTo(4, 4);
            ctx.moveTo(8, 10); ctx.lineTo(12, 5);
            ctx.moveTo(8, 8); ctx.lineTo(10, 3);
            ctx.stroke();
            break;
        case BLOCKS.ALIEN_TALL_GRASS:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = 'rgba(100, 255, 100, 0.8)';
            ctx.fillRect(7, 4, 2, 12);
            ctx.fillStyle = 'rgba(255, 100, 200, 0.9)';
            ctx.beginPath(); ctx.arc(8, 4, 3, 0, Math.PI*2); ctx.fill();
            break;
        case BLOCKS.SAVANNA_GRASS:
            if (face === 'top') {
                fillBase(ctx, 160, 150, 60); // Dry yellow/green
                addNoise(ctx, rng, 20);
                addPixels(ctx, rng, 'rgba(120,110,40,0.8)', 15);
            } else if (face === 'bottom') {
                fillBase(ctx, 100, 65, 45);
                addNoise(ctx, rng, 20);
            } else {
                fillBase(ctx, 100, 65, 45);
                addNoise(ctx, rng, 20);
                const id = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
                const d = id.data;
                const blades = [];
                for (let x = 0; x < TEX_SIZE; x++) blades.push(3 + (rng() * 6) | 0);
                for (let y = 0; y < TEX_SIZE; y++) {
                    for (let x = 0; x < TEX_SIZE; x++) {
                        let isGrass = false;
                        if (y < blades[x]) {
                            isGrass = true;
                            if (y > 3 && rng() > 0.8) isGrass = false;
                        }
                        if (isGrass) {
                            const i = (y * TEX_SIZE + x) * 4;
                            const v = ((rng() - 0.5) * 30) | 0;
                            d[i] = Math.max(0, Math.min(255, 160 + v));
                            d[i+1] = Math.max(0, Math.min(255, 150 + v));
                            d[i+2] = Math.max(0, Math.min(255, 60 + v));
                        } else if (y > 0) {
                            const aboveI = ((y - 1) * TEX_SIZE + x) * 4;
                            if (d[aboveI+1] > 120 && d[aboveI] < 170) {
                                const i = (y * TEX_SIZE + x) * 4;
                                d[i] = Math.max(0, d[i] - 40);
                                d[i+1] = Math.max(0, d[i+1] - 40);
                                d[i+2] = Math.max(0, d[i+2] - 40);
                            }
                        }
                    }
                }
                ctx.putImageData(id, 0, 0);
            }
            break;
        case BLOCKS.ACACIA_WOOD:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 160, 90, 50); // Orange-ish inner
                addNoise(ctx, rng, 10);
                ctx.strokeStyle = '#444';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(8, 8, 3, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(8, 8, 6, 0, Math.PI*2); ctx.stroke();
            } else {
                fillBase(ctx, 100, 95, 90); // Gray bark
                addNoise(ctx, rng, 10);
                addStripes(ctx, rng, 'rgba(70,65,60,0.5)', 'v', 3);
            }
            break;
        case BLOCKS.ACACIA_LEAVES:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            fillBase(ctx, 90, 130, 40); // Olive green
            addNoise(ctx, rng, 30);
            for (let i = 0; i < 70; i++) {
                const x = (rng() * TEX_SIZE) | 0;
                const y = (rng() * TEX_SIZE) | 0;
                ctx.clearRect(x, y, 2, 2);
            }
            ctx.fillStyle = 'rgba(110, 150, 50, 0.9)';
            for (let i = 0; i < 40; i++) {
                ctx.fillRect((rng() * TEX_SIZE) | 0, (rng() * TEX_SIZE) | 0, 1, 1);
            }
            break;
        case BLOCKS.MUD:
            fillBase(ctx, 70, 50, 40);
            addNoise(ctx, rng, 10);
            break;
        case BLOCKS.SWAMP_GRASS:
            if (face === 'top') {
                fillBase(ctx, 70, 90, 40); // Dark murky green
                addNoise(ctx, rng, 20);
                addPixels(ctx, rng, 'rgba(50,70,30,0.8)', 15);
            } else if (face === 'bottom') {
                fillBase(ctx, 70, 50, 40); // Mud bottom
                addNoise(ctx, rng, 10);
            } else {
                fillBase(ctx, 70, 50, 40);
                addNoise(ctx, rng, 20);
                const id = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
                const d = id.data;
                const blades = [];
                for (let x = 0; x < TEX_SIZE; x++) blades.push(3 + (rng() * 6) | 0);
                for (let y = 0; y < TEX_SIZE; y++) {
                    for (let x = 0; x < TEX_SIZE; x++) {
                        let isGrass = false;
                        if (y < blades[x]) {
                            isGrass = true;
                            if (y > 3 && rng() > 0.8) isGrass = false;
                        }
                        if (isGrass) {
                            const i = (y * TEX_SIZE + x) * 4;
                            const v = ((rng() - 0.5) * 30) | 0;
                            d[i] = Math.max(0, Math.min(255, 70 + v));
                            d[i+1] = Math.max(0, Math.min(255, 90 + v));
                            d[i+2] = Math.max(0, Math.min(255, 40 + v));
                        } else if (y > 0) {
                            const aboveI = ((y - 1) * TEX_SIZE + x) * 4;
                            if (d[aboveI+1] > 75 && d[aboveI] < 100) { 
                                const i = (y * TEX_SIZE + x) * 4;
                                d[i] = Math.max(0, d[i] - 30);
                                d[i+1] = Math.max(0, d[i+1] - 30);
                                d[i+2] = Math.max(0, d[i+2] - 30);
                            }
                        }
                    }
                }
                ctx.putImageData(id, 0, 0);
            }
            break;
        case BLOCKS.SWAMP_WATER:
            fillBase(ctx, 40, 80, 60);
            ctx.fillStyle = 'rgba(30,60,40,0.5)';
            ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
            addNoise(ctx, rng, 10);
            break;
        case BLOCKS.ALIEN_SPORE_STEM:
            fillBase(ctx, 50, 120, 60);
            addNoise(ctx, rng, 20);
            addStripes(ctx, rng, 'rgba(30,90,40,0.6)', 'v', 4);
            break;
        case BLOCKS.ALIEN_SPORE_BLOCK:
            fillBase(ctx, 150, 40, 180);
            addNoise(ctx, rng, 30);
            drawOreSpots(ctx, rng, 'rgba(255,100,255,0.8)', 6);
            break;
        case BLOCKS.VINES:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            // Vine 1 (left)
            ctx.fillStyle = '#2d6a25'; // Darker green
            ctx.fillRect(2, 0, 1, 4); ctx.fillRect(2, 4, 2, 1);
            ctx.fillRect(3, 5, 1, 3); ctx.fillRect(3, 8, 2, 1);
            ctx.fillRect(4, 9, 1, 4); ctx.fillRect(4, 13, 2, 1);
            ctx.fillRect(5, 14, 1, 2);
            // Vine 2 (middle)
            ctx.fillStyle = '#3ca02d'; // Mid green
            ctx.fillRect(8, 0, 2, 2); ctx.fillRect(7, 2, 1, 3);
            ctx.fillRect(6, 5, 1, 2); ctx.fillRect(7, 7, 2, 2);
            ctx.fillRect(8, 9, 1, 3);
            // Vine 3 (right)
            ctx.fillStyle = '#1f4c19'; // Very dark green
            ctx.fillRect(12, 0, 1, 6); ctx.fillRect(13, 6, 1, 2);
            ctx.fillRect(12, 8, 1, 3); ctx.fillRect(11, 11, 1, 4);
            // Additional leaves/details
            ctx.fillStyle = '#4cc736'; // Light green highlight
            ctx.fillRect(1, 2, 1, 1); ctx.fillRect(4, 6, 1, 1);
            ctx.fillRect(9, 1, 1, 1); ctx.fillRect(5, 4, 1, 1);
            ctx.fillRect(14, 7, 1, 1); ctx.fillRect(10, 10, 1, 1);
            break;
        case BLOCKS.TALL_GRASS:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#5ac43c'; // Bright mid green
            // Blade 1
            ctx.fillRect(4, 15, 1, 1); ctx.fillRect(4, 14, 1, 1);
            ctx.fillRect(3, 13, 1, 1); ctx.fillRect(3, 12, 1, 1);
            ctx.fillRect(2, 11, 1, 1);
            // Blade 2
            ctx.fillRect(7, 15, 2, 1); ctx.fillRect(7, 13, 1, 2);
            ctx.fillRect(8, 10, 1, 3); ctx.fillRect(9, 7, 1, 3);
            // Blade 3
            ctx.fillRect(11, 15, 1, 1); ctx.fillRect(11, 14, 1, 1);
            ctx.fillRect(12, 13, 1, 1); ctx.fillRect(12, 12, 1, 1);
            ctx.fillRect(13, 11, 1, 1);
            // Highlights
            ctx.fillStyle = '#80df60';
            ctx.fillRect(8, 11, 1, 1); ctx.fillRect(8, 14, 1, 1);
            ctx.fillRect(3, 12, 1, 1); ctx.fillRect(12, 12, 1, 1);
            // Shadows
            ctx.fillStyle = '#3e9a2a';
            ctx.fillRect(7, 14, 1, 2); ctx.fillRect(8, 15, 1, 1);
            ctx.fillRect(4, 15, 1, 1); ctx.fillRect(11, 15, 1, 1);
            break;
        case BLOCKS.RED_FLOWER:
        case BLOCKS.BLUE_FLOWER:
        case BLOCKS.YELLOW_FLOWER:
        case BLOCKS.WHITE_FLOWER:
        case BLOCKS.PURPLE_FLOWER:
        case BLOCKS.ORANGE_FLOWER:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#3ca02d'; // Stem
            ctx.fillRect(7, 9, 2, 7);
            ctx.fillRect(6, 12, 1, 1);
            ctx.fillRect(9, 13, 1, 1);
            // Flower head
            if (blockType === BLOCKS.RED_FLOWER) ctx.fillStyle = '#ff2222';
            if (blockType === BLOCKS.BLUE_FLOWER) ctx.fillStyle = '#2266ff';
            if (blockType === BLOCKS.YELLOW_FLOWER) ctx.fillStyle = '#ffee22';
            if (blockType === BLOCKS.WHITE_FLOWER) ctx.fillStyle = '#ffffff';
            if (blockType === BLOCKS.PURPLE_FLOWER) ctx.fillStyle = '#aa33ff';
            if (blockType === BLOCKS.ORANGE_FLOWER) ctx.fillStyle = '#ff8800';

            ctx.fillRect(6, 5, 4, 4);
            ctx.fillRect(7, 4, 2, 1);
            ctx.fillRect(5, 6, 1, 2);
            ctx.fillRect(10, 6, 1, 2);

            if (blockType === BLOCKS.WHITE_FLOWER) ctx.fillStyle = '#eeeeee';
            if (blockType === BLOCKS.RED_FLOWER) ctx.fillStyle = '#cc0000';
            if (blockType === BLOCKS.BLUE_FLOWER) ctx.fillStyle = '#0044cc';
            if (blockType === BLOCKS.YELLOW_FLOWER) ctx.fillStyle = '#ccaa00';
            if (blockType === BLOCKS.PURPLE_FLOWER) ctx.fillStyle = '#8811cc';
            if (blockType === BLOCKS.ORANGE_FLOWER) ctx.fillStyle = '#cc5500';
            else ctx.fillStyle = '#ddaa00'; // center
            ctx.fillRect(7, 6, 2, 2);
            break;
        case BLOCKS.RED_MUSHROOM:
        case BLOCKS.BROWN_MUSHROOM:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            // Stem
            ctx.fillStyle = '#ded9ce';
            ctx.fillRect(7, 9, 2, 7);
            // Cap
            ctx.fillStyle = blockType === BLOCKS.RED_MUSHROOM ? '#d42c2c' : '#8a5c38';
            ctx.fillRect(4, 5, 8, 4);
            ctx.fillRect(5, 4, 6, 1);
            if (blockType === BLOCKS.RED_MUSHROOM) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(5, 6, 1, 1);
                ctx.fillRect(9, 6, 1, 1);
                ctx.fillRect(7, 5, 1, 1);
            }
            break;
        case BLOCKS.FERN:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#5ac43c'; // Bright green
            // Central stem
            ctx.fillRect(7, 8, 2, 8);
            // Fronds left
            ctx.fillRect(5, 10, 2, 1);
            ctx.fillRect(3, 9, 2, 1);
            ctx.fillRect(5, 13, 2, 1);
            ctx.fillRect(4, 12, 1, 1);
            // Fronds right
            ctx.fillRect(9, 11, 2, 1);
            ctx.fillRect(11, 10, 2, 1);
            ctx.fillRect(9, 14, 2, 1);
            ctx.fillRect(11, 13, 1, 1);
            // Highlight
            ctx.fillStyle = '#80df60';
            ctx.fillRect(7, 8, 1, 8); // Stem highlight
            ctx.fillRect(6, 10, 1, 1);
            ctx.fillRect(4, 9, 1, 1);
            ctx.fillRect(10, 11, 1, 1);
            ctx.fillRect(12, 10, 1, 1);
            // Shadows
            ctx.fillStyle = '#3e9a2a';
            ctx.fillRect(8, 10, 1, 6); // Inner stem shadow
            ctx.fillRect(5, 14, 2, 1); ctx.fillRect(9, 15, 2, 1);
            break;
        case BLOCKS.TALL_FERN:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#5ac43c';
            ctx.fillRect(7, 0, 2, 16);
            ctx.fillRect(3, 4, 4, 2);
            ctx.fillRect(9, 7, 4, 2);
            ctx.fillRect(2, 11, 5, 2);
            ctx.fillRect(9, 13, 5, 2);
            ctx.fillStyle = '#3e9a2a';
            ctx.fillRect(8, 2, 1, 14);
            break;
        case BLOCKS.TALL_FERN_TOP:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#5ac43c';
            ctx.fillRect(7, 4, 2, 12);
            ctx.fillRect(5, 6, 2, 2);
            ctx.fillRect(9, 7, 2, 2);
            ctx.fillRect(4, 10, 3, 2);
            ctx.fillRect(9, 11, 3, 2);
            ctx.fillStyle = '#80df60';
            ctx.fillRect(7, 3, 2, 3);
            break;
        case BLOCKS.PLANKS:
            drawPlanks(ctx, rng, 160, 130, 75, 'rgba(90, 65, 30, 0.7)', 'rgba(120, 90, 50, 0.5)');
            break;
        case BLOCKS.ACACIA_PLANKS:
            drawPlanks(ctx, rng, 160, 90, 50, 'rgba(120, 50, 30, 0.7)', 'rgba(140, 70, 40, 0.5)');
            break;
        case BLOCKS.CHERRY_PLANKS:
            drawPlanks(ctx, rng, 230, 150, 160, 'rgba(180, 100, 120, 0.7)', 'rgba(200, 120, 140, 0.5)');
            break;
        case BLOCKS.AUTUMN_PLANKS:
            drawPlanks(ctx, rng, 180, 100, 60, 'rgba(130, 60, 30, 0.7)', 'rgba(150, 80, 40, 0.5)');
            break;
        case BLOCKS.PALM_PLANKS:
            drawPlanks(ctx, rng, 200, 170, 120, 'rgba(150, 120, 80, 0.7)', 'rgba(170, 140, 90, 0.5)');
            break;
        case BLOCKS.PINE_PLANKS:
        case BLOCKS.DARK_OAK_PLANKS:
            drawPlanks(ctx, rng, 110, 80, 50, 'rgba(70, 50, 30, 0.7)', 'rgba(90, 60, 40, 0.5)');
            break;
        case BLOCKS.CRIMSON_PLANKS:
            drawPlanks(ctx, rng, 120, 40, 60, 'rgba(80, 20, 40, 0.7)', 'rgba(100, 30, 50, 0.5)');
            break;
        case BLOCKS.CACTUS:
            if (face === 'top') {
                fillBase(ctx, 92, 148, 48); // light cactus green
                addNoise(ctx, rng, 8);
                // Indented dark green star center
                ctx.fillStyle = '#406c20';
                ctx.fillRect(6, 6, 4, 4);
                ctx.fillRect(4, 7, 8, 2);
                ctx.fillRect(7, 4, 2, 8);
                // Dark valley notches around edges
                ctx.fillStyle = '#345718';
                ctx.fillRect(0, 0, 2, 2); ctx.fillRect(14, 0, 2, 2);
                ctx.fillRect(0, 14, 2, 2); ctx.fillRect(14, 14, 2, 2);
                ctx.fillRect(7, 0, 2, 2); ctx.fillRect(7, 14, 2, 2);
                ctx.fillRect(0, 7, 2, 2); ctx.fillRect(14, 7, 2, 2);
            } else if (face === 'bottom') {
                fillBase(ctx, 67, 109, 34); // darker bottom
                addNoise(ctx, rng, 10);
            } else {
                // Cactus side: vertical ridges and valleys with authentic thorns
                fillBase(ctx, 88, 142, 44);
                // Valley stripes (dark green)
                ctx.fillStyle = '#497824';
                for (let x = 0; x < TEX_SIZE; x += 4) {
                    ctx.fillRect(x, 0, 2, TEX_SIZE);
                }
                // Ridge highlights (light green)
                ctx.fillStyle = '#6da838';
                for (let x = 2; x < TEX_SIZE; x += 4) {
                    ctx.fillRect(x, 0, 1, TEX_SIZE);
                }
                // Thorns: white spines with black shadow
                const thornY = [2, 6, 10, 14];
                for (let i = 0; i < thornY.length; i++) {
                    const y = thornY[i];
                    const x = ((i % 2 === 0 ? 2 : 10) + ((rng() > 0.5) ? 0 : 4)) % 16;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x, y, 1, 1);
                    ctx.fillStyle = '#1c320d';
                    ctx.fillRect(x, y + 1, 1, 1);
                }
            }
            break;
        case BLOCKS.CHERRY_LOG:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 220, 180, 190);
                addRings(ctx, rng, 'rgba(200, 150, 160, 0.8)');
            } else {
                fillBase(ctx, 60, 40, 40);
                addNoise(ctx, rng, 10);
                addStripes(ctx, rng, 'rgba(40, 25, 25, 0.5)', 'v', 3);
            }
            break;
        case BLOCKS.CHERRY_LEAVES:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            // Draw leafy clusters instead of solid background
            for (let i = 0; i < 150; i++) {
                const x = (rng() * TEX_SIZE) | 0;
                const y = (rng() * TEX_SIZE) | 0;
                const shade = rng();
                if (shade < 0.3) {
                    ctx.fillStyle = 'rgba(230, 140, 160, 0.9)'; // deep shadow pink
                } else if (shade < 0.6) {
                    ctx.fillStyle = 'rgba(255, 170, 190, 0.9)'; // midtone pink
                } else {
                    ctx.fillStyle = 'rgba(255, 200, 220, 0.9)'; // highlight pink
                }
                const w = 1 + (rng() * 2) | 0;
                const h = 1 + (rng() * 2) | 0;
                ctx.fillRect(x, y, w, h);
            }
            break;
        case BLOCKS.PINK_PETALS:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#ffb3cc';
            ctx.fillRect(4, 14, 2, 1);
            ctx.fillRect(9, 15, 3, 1);
            ctx.fillRect(11, 13, 2, 1);
            ctx.fillRect(2, 12, 2, 1);
            ctx.fillStyle = '#ff80aa';
            ctx.fillRect(5, 14, 1, 1);
            ctx.fillRect(10, 15, 1, 1);
            break;
        case BLOCKS.AUTUMN_WOOD:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 160, 130, 90);
                addRings(ctx, rng, 'rgba(120, 90, 60, 0.8)');
            } else {
                fillBase(ctx, 100, 70, 40);
                addNoise(ctx, rng, 15);
                addStripes(ctx, rng, 'rgba(60, 40, 20, 0.6)', 'v', 4);
            }
            break;
        case BLOCKS.AUTUMN_LEAVES:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            for (let i = 0; i < 150; i++) {
                const x = (rng() * TEX_SIZE) | 0;
                const y = (rng() * TEX_SIZE) | 0;
                const shade = rng();
                if (shade < 0.3) {
                    ctx.fillStyle = 'rgba(180, 60, 10, 0.9)'; // deep shadow orange/red
                } else if (shade < 0.6) {
                    ctx.fillStyle = 'rgba(220, 100, 20, 0.9)'; // midtone orange
                } else {
                    ctx.fillStyle = 'rgba(255, 150, 40, 0.9)'; // highlight yellow/orange
                }
                const w = 1 + (rng() * 2) | 0;
                const h = 1 + (rng() * 2) | 0;
                ctx.fillRect(x, y, w, h);
            }
            break;
        case BLOCKS.FALLEN_LEAVES:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#dd6611';
            ctx.fillRect(3, 14, 2, 1);
            ctx.fillRect(10, 15, 2, 1);
            ctx.fillRect(7, 13, 3, 1);
            ctx.fillStyle = '#ff9900';
            ctx.fillRect(4, 14, 1, 1);
            ctx.fillRect(11, 15, 1, 1);
            ctx.fillRect(8, 13, 1, 1);
            break;
        case BLOCKS.GLOW_STEM:
            fillBase(ctx, 20, 60, 60);
            addNoise(ctx, rng, 10);
            addStripes(ctx, rng, 'rgba(10, 200, 200, 0.4)', 'v', 5); // glowing lines
            break;
        case BLOCKS.GLOW_LEAVES:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            for (let i = 0; i < 150; i++) {
                const x = (rng() * TEX_SIZE) | 0;
                const y = (rng() * TEX_SIZE) | 0;
                const shade = rng();
                if (shade < 0.3) {
                    ctx.fillStyle = 'rgba(5, 80, 80, 0.9)'; // deep shadow
                } else if (shade < 0.6) {
                    ctx.fillStyle = 'rgba(10, 120, 120, 0.9)'; // midtone
                } else {
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.9)'; // glowing spots
                }
                const w = 1 + (rng() * 2) | 0;
                const h = 1 + (rng() * 2) | 0;
                ctx.fillRect(x, y, w, h);
            }
            break;
        case BLOCKS.GLOW_SHROOM:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#118888'; // Stem
            ctx.fillRect(7, 8, 2, 8);
            ctx.fillStyle = '#00ffff'; // Glowing cap
            ctx.fillRect(5, 5, 6, 3);
            ctx.fillRect(4, 6, 8, 2);
            ctx.fillStyle = '#aaffff'; // Highlights
            ctx.fillRect(6, 5, 2, 1);
            break;
        case BLOCKS.PALM_WOOD:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 200, 170, 130);
                addRings(ctx, rng, 'rgba(160, 130, 90, 0.8)');
            } else {
                fillBase(ctx, 150, 120, 80);
                addNoise(ctx, rng, 15);
                addStripes(ctx, rng, 'rgba(100, 80, 50, 0.6)', 'h', 6); // Palm trees have horizontal lines
            }
            break;
        case BLOCKS.PALM_LEAVES:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            for (let i = 0; i < 150; i++) {
                const x = (rng() * TEX_SIZE) | 0;
                const y = (rng() * TEX_SIZE) | 0;
                const shade = rng();
                if (shade < 0.3) {
                    ctx.fillStyle = 'rgba(30, 90, 30, 0.9)'; // deep shadow
                } else if (shade < 0.6) {
                    ctx.fillStyle = 'rgba(80, 180, 60, 0.9)'; // midtone
                } else {
                    ctx.fillStyle = 'rgba(110, 210, 80, 0.9)'; // highlight
                }
                const w = 1 + (rng() * 2) | 0;
                const h = 1 + (rng() * 2) | 0;
                ctx.fillRect(x, y, w, h);
            }
            break;
        case BLOCKS.OASIS_FERN:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#22cc44'; // Bright oasis green
            ctx.fillRect(7, 6, 2, 10); // Central stem
            ctx.fillRect(5, 8, 2, 1); // Large fronds
            ctx.fillRect(9, 8, 2, 1);
            ctx.fillRect(4, 11, 3, 1);
            ctx.fillRect(9, 11, 3, 1);
            ctx.fillRect(3, 14, 4, 1);
            ctx.fillRect(9, 14, 4, 1);
            ctx.fillStyle = '#66ff88'; // Highlight
            ctx.fillRect(7, 6, 1, 10);
            ctx.fillRect(6, 8, 1, 1);
            ctx.fillRect(5, 11, 1, 1);
            break;
        case BLOCKS.COAL_ORE:
            fillBase(ctx, 128, 128, 128);
            addNoise(ctx, rng, 16);
            drawOreSpots(ctx, rng, 'rgba(25, 25, 25, 0.95)', 7);
            drawOreSpots(ctx, rng, 'rgba(10, 10, 10, 0.7)', 3);
            break;
        case BLOCKS.DIAMOND_ORE:
            fillBase(ctx, 128, 128, 128);
            addNoise(ctx, rng, 16);
            drawOreSpots(ctx, rng, 'rgba(50, 220, 220, 0.95)', 5);
            drawOreSpots(ctx, rng, 'rgba(100, 255, 240, 0.6)', 3);
            break;
        case BLOCKS.STONE_BRICKS:
            fillBase(ctx, 130, 130, 130);
            drawBricks(ctx, rng, 'rgb(100,100,100)', 10);
            break;
        case BLOCKS.BRICKS:
            fillBase(ctx, 160, 80, 60);
            drawBricks(ctx, rng, 'rgb(180,170,155)', 12);
            break;
        case BLOCKS.BOOKSHELF:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 160, 130, 80);
                addNoise(ctx, rng, 15);
                addStripes(ctx, rng, 'rgba(100, 70, 40, 0.4)', 'v', 4);
            } else {
                fillBase(ctx, 80, 50, 30); // dark back
                // books
                const colors = ['#d32f2f', '#388e3c', '#1976d2', '#fbc02d', '#7b1fa2', '#795548', '#ffffff'];
                for (let row = 0; row < 2; row++) {
                    const y = row * 8 + 1;
                    ctx.fillStyle = '#6d4c41'; // shelf
                    ctx.fillRect(0, y + 6, TEX_SIZE, 1);
                    
                    let xOffset = 1;
                    for (let b = 0; b < 4; b++) {
                        const bw = 2 + (rng() * 2 | 0);
                        if (xOffset + bw > 14) break;
                        ctx.fillStyle = colors[(rng() * colors.length) | 0];
                        ctx.fillRect(xOffset, y, bw, 6);
                        ctx.fillStyle = 'rgba(0,0,0,0.3)';
                        ctx.fillRect(xOffset, y+2, bw, 1);
                        xOffset += bw + 1;
                    }
                }
            }
            break;
        case BLOCKS.MOSSY_COBBLESTONE:
            fillBase(ctx, 120, 120, 120);
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, 'rgba(80, 80, 80, 0.7)', 30);
            addPixels(ctx, rng, 'rgba(60, 120, 40, 0.8)', 25);
            addPixels(ctx, rng, 'rgba(40, 100, 30, 0.6)', 20);
            break;
        case BLOCKS.CHEST_BLOCK: {
            // Warm oak plank base
            fillBase(ctx, 168, 114, 58);
            // Draw planks as vertical grain lines
            ctx.fillStyle = 'rgba(100,60,20,0.25)';
            for (let px = 3; px < 16; px += 4) ctx.fillRect(px, 0, 1, 16);
            // Trim border
            ctx.fillStyle = 'rgba(60,35,8,0.9)';
            ctx.fillRect(0, 0, 16, 1);
            ctx.fillRect(0, 15, 16, 1);
            ctx.fillRect(0, 0, 1, 16);
            ctx.fillRect(15, 0, 1, 16);
            if (face === 'top') {
                // Iron cross-bands
                ctx.fillStyle = 'rgba(55,45,35,0.85)';
                ctx.fillRect(0, 7, 16, 2);
                ctx.fillRect(7, 0, 2, 16);
                // Central iron buckle
                ctx.fillStyle = '#aaa';
                ctx.fillRect(7, 7, 2, 2);
                ctx.fillStyle = '#ccc';
                ctx.fillRect(7, 7, 1, 1);
            } else if (face === 'front') {
                // Lid split line
                ctx.fillStyle = 'rgba(55,35,8,0.9)';
                ctx.fillRect(1, 8, 14, 1);
                // Iron corner studs (top-left, top-right of lid)
                ctx.fillStyle = '#888';
                ctx.fillRect(1, 1, 2, 2);
                ctx.fillRect(13, 1, 2, 2);
                // Iron latch background
                ctx.fillStyle = '#777';
                ctx.fillRect(6, 7, 4, 4);
                // Latch face
                ctx.fillStyle = '#bbb';
                ctx.fillRect(7, 8, 2, 2);
                ctx.fillStyle = '#999';
                ctx.fillRect(7, 9, 2, 1);
                // Keyhole dot
                ctx.fillStyle = '#333';
                ctx.fillRect(7, 9, 1, 1);
            } else if (face === 'bottom') {
                ctx.fillStyle = 'rgba(55,35,8,0.7)';
                ctx.fillRect(0, 7, 16, 1);
                ctx.fillRect(7, 0, 1, 16);
                ctx.fillStyle = '#888';
                ctx.fillRect(7, 7, 1, 1);
            } else {
                // Side: horizontal lid band only
                ctx.fillStyle = 'rgba(55,35,8,0.85)';
                ctx.fillRect(1, 8, 14, 1);
                ctx.fillStyle = '#888';
                ctx.fillRect(1, 1, 2, 2);
                ctx.fillRect(13, 1, 2, 2);
            }
            break;
        }
        case BLOCKS.LADDER:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = 'rgb(120, 80, 40)';
            ctx.fillRect(2, 0, 2, TEX_SIZE); // left rail
            ctx.fillRect(12, 0, 2, TEX_SIZE); // right rail
            for (let y = 2; y < TEX_SIZE; y += 4) {
                ctx.fillRect(4, y, 8, 2); // rungs
            }
            addNoise(ctx, rng, 10);
            break;
        case BLOCKS.SEAGRASS:
        case BLOCKS.KELP:
        case BLOCKS.RED_KELP:
        case BLOCKS.BROWN_KELP:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            if (blockType === BLOCKS.SEAGRASS) {
                const baseColor = [60, 160, 80];
                const highlight = [100, 200, 100];
                const shadow = [40, 120, 60];
                
                const bladesCount = 5 + Math.floor(rng() * 4);
                for (let i = 0; i < bladesCount; i++) {
                    let h = 5 + Math.floor(rng() * 7);
                    let startX = 2 + Math.floor(rng() * 12);
                    let xOffset = 0;
                    let bendDir = rng() < 0.5 ? -1 : 1;
                    
                    for (let y = 0; y < h; y++) {
                        let drawY = TEX_SIZE - 1 - y;
                        let drawX = startX + Math.floor(xOffset);
                        if (drawX >= 0 && drawX < TEX_SIZE) {
                            let col = baseColor;
                            let r = rng();
                            if (r < 0.3) col = highlight;
                            else if (r < 0.6) col = shadow;
                            
                            ctx.fillStyle = `rgb(${col[0]}, ${col[1]}, ${col[2]})`;
                            ctx.fillRect(drawX, drawY, 2, 1);
                        }
                        if (rng() < 0.5) {
                            xOffset += bendDir * (0.5 + rng() * 0.7);
                        }
                    }
                }
            } else {
                let baseColor, highlight, shadow;
                if (blockType === BLOCKS.RED_KELP) {
                    baseColor = [180, 50, 50]; highlight = [220, 90, 90]; shadow = [120, 30, 30];
                } else if (blockType === BLOCKS.BROWN_KELP) {
                    baseColor = [150, 110, 40]; highlight = [190, 150, 70]; shadow = [100, 70, 20];
                } else {
                    baseColor = [70, 150, 50]; highlight = [120, 200, 90]; shadow = [40, 110, 30];
                }
                
                const stalks = 1 + Math.floor(rng() * 2);
                for (let s = 0; s < stalks; s++) {
                    let startX = 4 + Math.floor(rng() * 8);
                    let phase = rng() * Math.PI * 2;
                    let freq = 0.15 + rng() * 0.2;
                    let amp = 1.0 + rng() * 1.5;
                    
                    for (let y = TEX_SIZE - 1; y >= 0; y--) {
                        let drawX = startX + Math.floor(Math.sin((TEX_SIZE - 1 - y) * freq + phase) * amp);
                        
                        let r = rng();
                        let stalkCol = r < 0.2 ? highlight : (r < 0.5 ? shadow : baseColor);
                        ctx.fillStyle = `rgb(${stalkCol[0]}, ${stalkCol[1]}, ${stalkCol[2]})`;
                        ctx.fillRect(drawX, y, 2, 1);
                        
                        if (y < TEX_SIZE - 1 && y > 1 && rng() < 0.4) {
                            let dir = rng() < 0.5 ? -1 : 1;
                            let leafLen = 2 + Math.floor(rng() * 3);
                            for (let l = 1; l <= leafLen; l++) {
                                let lx = drawX + (dir > 0 ? 1 : 0) + (l * dir);
                                let ly = y - Math.floor(l * 0.5);
                                if (lx >= 0 && lx < TEX_SIZE && ly >= 0) {
                                    let c = rng() < 0.5 ? highlight : baseColor;
                                    ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
                                    ctx.fillRect(lx, ly, 2, 1);
                                }
                            }
                        }
                    }
                }
            }
            break;
        case BLOCKS.TUBE_CORAL:
        case BLOCKS.BRAIN_CORAL:
        case BLOCKS.BUBBLE_CORAL:
        case BLOCKS.FIRE_CORAL:
        case BLOCKS.HORN_CORAL:
            let corBase;
            if (blockType === BLOCKS.TUBE_CORAL) corBase = [0, 100, 255]; // blue
            else if (blockType === BLOCKS.BRAIN_CORAL) corBase = [255, 100, 200]; // pink
            else if (blockType === BLOCKS.BUBBLE_CORAL) corBase = [150, 0, 150]; // purple
            else if (blockType === BLOCKS.FIRE_CORAL) corBase = [255, 50, 0]; // red
            else corBase = [255, 200, 50]; // yellow
            
            fillBase(ctx, corBase[0], corBase[1], corBase[2]);
            addNoise(ctx, rng, 30);
            
            // Draw coral details
            ctx.fillStyle = `rgba(255,255,255,0.4)`;
            for (let i = 0; i < 8; i++) {
                ctx.fillRect(Math.floor(rng() * 14), Math.floor(rng() * 14), 2, 2);
            }
            break;
        case BLOCKS.SEASHELL_1:
        case BLOCKS.SEASHELL_2:
        case BLOCKS.SEASHELL_3:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            let shColor = blockType === BLOCKS.SEASHELL_1 ? 'rgb(255, 230, 200)' : (blockType === BLOCKS.SEASHELL_2 ? 'rgb(255, 180, 180)' : 'rgb(200, 220, 255)');
            ctx.fillStyle = shColor;
            
            // Draw a small shell shape at the bottom
            if (blockType === BLOCKS.SEASHELL_1) {
                // Spiral shell
                ctx.fillRect(6, 12, 4, 4);
                ctx.fillRect(7, 10, 2, 2);
            } else if (blockType === BLOCKS.SEASHELL_2) {
                // Clam shell
                ctx.fillRect(5, 13, 6, 3);
                ctx.fillRect(6, 11, 4, 2);
            } else {
                // Starfish / weird shell
                ctx.fillRect(6, 12, 4, 4);
                ctx.fillRect(4, 13, 2, 2);
                ctx.fillRect(10, 13, 2, 2);
            }
            break;
        case BLOCKS.LILY_PAD:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#2d7a2d'; // dark green pad
            // Draw a flat pad in the middle
            ctx.beginPath();
            ctx.arc(8, 14, 6, 0, Math.PI * 2);
            ctx.fill();
            // Draw a pink flower
            ctx.fillStyle = '#ff99cc';
            ctx.fillRect(7, 12, 2, 2);
            break;
        case BLOCKS.ALGAE:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#558833'; // muddy green
            for (let i = 0; i < 15; i++) {
                ctx.fillRect(Math.floor(rng() * 14) + 1, Math.floor(rng() * 14) + 1, 2, 2);
            }
            break;
        case BLOCKS.IRON_BLOCK:
            fillBase(ctx, 210, 210, 210);
            addNoise(ctx, rng, 5);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.strokeRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.8)';
            ctx.strokeRect(1, 1, TEX_SIZE-1, TEX_SIZE-1);
            break;
        case BLOCKS.GOLD_BLOCK:
            fillBase(ctx, 250, 200, 50);
            addNoise(ctx, rng, 10);
            ctx.fillStyle = '#fff9c4';
            ctx.fillRect(1, 1, 4, 1);
            ctx.fillRect(1, 1, 1, 4);
            ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)';
            ctx.strokeRect(0, 0, TEX_SIZE, TEX_SIZE);
            break;
        case BLOCKS.DIAMOND_BLOCK:
            fillBase(ctx, 80, 220, 220);
            addNoise(ctx, rng, 15);
            ctx.fillStyle = '#e0f7fa';
            ctx.fillRect(1, 1, 3, 3);
            ctx.fillStyle = '#006064';
            ctx.fillRect(12, 12, 3, 3);
            ctx.strokeStyle = '#26c6da';
            ctx.strokeRect(0, 0, TEX_SIZE, TEX_SIZE);
            break;
        case BLOCKS.WOOL:
            fillBase(ctx, 235, 235, 235);
            addNoise(ctx, rng, 10);
            addPixels(ctx, rng, 'rgba(200, 200, 200, 0.5)', 40);
            break;
        case BLOCKS.FURNACE:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 110, 110, 110);
                addNoise(ctx, rng, 20);
                ctx.fillStyle = 'rgba(70, 70, 70, 0.8)';
                ctx.fillRect(0, 0, 16, 1);
                ctx.fillRect(0, 15, 16, 1);
                ctx.fillRect(0, 0, 1, 16);
                ctx.fillRect(15, 0, 1, 16);
                ctx.fillRect(7, 0, 2, 16);
            } else {
                fillBase(ctx, 120, 120, 120);
                addNoise(ctx, rng, 20);
                // Outer stone frame
                ctx.fillStyle = 'rgba(70, 70, 70, 0.9)';
                ctx.fillRect(0, 0, 16, 2);
                ctx.fillRect(0, 14, 16, 2);
                ctx.fillRect(0, 0, 2, 16);
                ctx.fillRect(14, 0, 2, 16);
                
                if (face === 'front') {
                    // Front panel with grill and fire pit
                    ctx.fillStyle = '#444';
                    ctx.fillRect(4, 4, 8, 3); // upper grill
                    ctx.fillStyle = '#111';
                    ctx.fillRect(5, 5, 2, 1);
                    ctx.fillRect(9, 5, 2, 1);

                    ctx.fillStyle = '#222';
                    ctx.fillRect(4, 9, 8, 4); // lower fire pit
                    addPixels(ctx, rng, 'rgba(255, 80, 0, 0.9)', 5);
                    addPixels(ctx, rng, 'rgba(255, 200, 0, 1.0)', 4);
                } else {
                    // Side stone brick lines
                    ctx.fillStyle = 'rgba(80, 80, 80, 0.8)';
                    ctx.fillRect(0, 7, 16, 2);
                    ctx.fillRect(7, 0, 2, 16);
                }
            }
            break;
        case BLOCKS.NETHERRACK:
            fillBase(ctx, 110, 30, 30);
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, 'rgba(80, 20, 20, 0.8)', 30);
            addPixels(ctx, rng, 'rgba(150, 40, 40, 0.6)', 30);
            break;
        case BLOCKS.SOUL_SAND:
            fillBase(ctx, 80, 50, 40);
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, 'rgba(60, 30, 20, 0.8)', 40);
            // Draw some "faces"
            ctx.fillStyle = 'rgba(40, 20, 10, 0.8)';
            for(let i=0; i<3; i++) {
                let fx = Math.floor(rng() * 12);
                let fy = Math.floor(rng() * 12);
                ctx.fillRect(fx, fy, 1, 2);
                ctx.fillRect(fx+2, fy, 1, 2);
                ctx.fillRect(fx+1, fy+2, 1, 1);
            }
            break;
        case BLOCKS.NETHER_BRICKS:
            fillBase(ctx, 60, 20, 25);
            drawBricks(ctx, rng, 'rgba(30, 10, 15, 0.9)', 5);
            break;
        case BLOCKS.CRIMSON_NYLIUM:
            if (face === 'top') {
                fillBase(ctx, 140, 20, 20);
                addNoise(ctx, rng, 20);
                addPixels(ctx, rng, 'rgba(180, 40, 40, 0.8)', 30);
            } else if (face === 'bottom') {
                fillBase(ctx, 110, 30, 30); // Netherrack
                addNoise(ctx, rng, 20);
            } else {
                // Side
                fillBase(ctx, 110, 30, 30); // Netherrack bottom
                addNoise(ctx, rng, 20);
                ctx.fillStyle = 'rgba(140, 20, 20, 0.9)'; // Nylium top
                for(let x=0; x<TEX_SIZE; x++) {
                    let h = 4 + Math.floor(rng() * 4);
                    ctx.fillRect(x, 0, 1, h);
                }
            }
            break;
        case BLOCKS.CRIMSON_STEM:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 100, 30, 40);
                // rings
                ctx.strokeStyle = 'rgba(130, 40, 50, 0.8)';
                ctx.beginPath();
                ctx.arc(8, 8, 3, 0, Math.PI*2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(8, 8, 6, 0, Math.PI*2);
                ctx.stroke();
            } else {
                fillBase(ctx, 80, 20, 30);
                addStripes(ctx, rng, 'rgba(60, 15, 20, 0.6)', 'vertical', 6);
                addNoise(ctx, rng, 10);
            }
            break;
        case BLOCKS.CRIMSON_LEAVES:
            fillBase(ctx, 120, 5, 5);
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, 'rgba(180, 20, 20, 0.7)', 30);
            addPixels(ctx, rng, 'rgba(60, 0, 0, 0.6)', 20);
            break;
        case BLOCKS.NETHER_WART_BLOCK:
            fillBase(ctx, 110, 0, 0);
            addNoise(ctx, rng, 25);
            addPixels(ctx, rng, 'rgba(80, 0, 0, 0.8)', 40);
            break;
        case BLOCKS.TUBE_CORAL:
            ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0,0,16,16);
            ctx.fillStyle = 'rgb(50, 100, 200)'; ctx.fillRect(6, 6, 4, 10); ctx.fillRect(4, 4, 2, 8); ctx.fillRect(10, 5, 2, 7);
            ctx.fillStyle = 'rgb(100, 150, 255)'; ctx.fillRect(6, 4, 4, 2); ctx.fillRect(4, 2, 2, 2); ctx.fillRect(10, 3, 2, 2);
            addPixels(ctx, rng, 'rgba(0, 50, 150, 0.5)', 10);
            break;
        case BLOCKS.BRAIN_CORAL:
            ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0,0,16,16);
            ctx.fillStyle = 'rgb(200, 80, 150)'; ctx.beginPath(); ctx.arc(8, 10, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgb(255, 120, 180)'; ctx.beginPath(); ctx.arc(6, 8, 2, 0, Math.PI * 2); ctx.fill();
            addPixels(ctx, rng, 'rgba(150, 50, 100, 0.8)', 20);
            break;
        case BLOCKS.FIRE_CORAL:
            ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0,0,16,16);
            ctx.fillStyle = 'rgb(200, 50, 20)'; ctx.beginPath(); ctx.moveTo(8, 16); ctx.lineTo(4, 2); ctx.lineTo(6, 10); ctx.lineTo(8, 0); ctx.lineTo(10, 10); ctx.lineTo(12, 4); ctx.lineTo(8, 16); ctx.fill();
            ctx.fillStyle = 'rgb(250, 150, 50)'; ctx.fillRect(4, 2, 1, 2); ctx.fillRect(8, 0, 1, 2); ctx.fillRect(12, 4, 1, 2);
            break;
        case BLOCKS.HORN_CORAL:
            ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0,0,16,16);
            ctx.fillStyle = 'rgb(200, 200, 50)'; ctx.fillRect(5, 12, 6, 4); ctx.fillRect(3, 8, 4, 4); ctx.fillRect(9, 6, 4, 6);
            ctx.fillStyle = 'rgb(250, 250, 100)'; ctx.fillRect(3, 6, 2, 2); ctx.fillRect(9, 4, 2, 2); ctx.fillRect(11, 4, 2, 2);
            break;
        case BLOCKS.SUGARCANE:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = 'rgb(90, 150, 60)';
            ctx.fillRect(4, 0, 3, 16);
            ctx.fillRect(9, 0, 3, 16);
            ctx.fillStyle = 'rgb(120, 180, 80)';
            ctx.fillRect(4, 0, 1, 16);
            ctx.fillRect(9, 0, 1, 16);
            ctx.fillStyle = 'rgb(60, 110, 40)';
            for (let i = 2; i < 16; i += 5) {
                ctx.fillRect(4, i, 3, 1);
                ctx.fillRect(9, i+2, 3, 1);
            }
            break;
        case BLOCKS.FIRE:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE); // Transparent base
            // Draw flame pixel art
            ctx.fillStyle = 'rgb(255, 100, 0)';
            ctx.fillRect(4, 6, 8, 10);
            ctx.fillStyle = 'rgb(255, 200, 0)';
            ctx.fillRect(6, 10, 4, 6);
            ctx.fillStyle = 'rgb(255, 255, 0)';
            ctx.fillRect(7, 12, 2, 4);
            // Some scattered fire pixels
            addPixels(ctx, rng, 'rgb(255, 150, 0)', 10);
            addPixels(ctx, rng, 'rgb(255, 50, 0)', 5);
            break;

        case BLOCKS.TNT:
            if (face === 'top' || face === 'bottom') {
                // Red and white pattern
                fillBase(ctx, 220, 50, 50); // Red base
                ctx.fillStyle = 'rgb(220, 220, 220)';
                // Draw 4 white lines going across
                ctx.fillRect(2, 0, 2, 16);
                ctx.fillRect(6, 0, 2, 16);
                ctx.fillRect(10, 0, 2, 16);
                ctx.fillRect(14, 0, 2, 16);
            } else {
                // Side pattern with TNT text
                fillBase(ctx, 220, 50, 50); // Red base
                // Draw white band in the middle
                ctx.fillStyle = 'rgb(220, 220, 220)';
                ctx.fillRect(0, 5, 16, 6);
                // Draw TNT text in black
                ctx.fillStyle = 'rgb(0, 0, 0)';
                // T
                ctx.fillRect(1, 6, 3, 1);
                ctx.fillRect(2, 7, 1, 3);
                // N
                ctx.fillRect(6, 6, 1, 4);
                ctx.fillRect(7, 7, 1, 1);
                ctx.fillRect(8, 8, 1, 1);
                ctx.fillRect(9, 6, 1, 4);
                // T
                ctx.fillRect(12, 6, 3, 1);
                ctx.fillRect(13, 7, 1, 3);
            }
            break;
            
        case BLOCKS.CRAFTING_TABLE:
            if (face === 'top' || face === 'bottom') {
                // 3x3 grid pattern on top with border
                fillBase(ctx, 170, 110, 60); // Wooden base
                addNoise(ctx, rng, 10);
                ctx.fillStyle = 'rgba(90, 45, 15, 0.9)';
                
                // Outer rim
                ctx.fillRect(0, 0, 16, 2);
                ctx.fillRect(0, 14, 16, 2);
                ctx.fillRect(0, 0, 2, 16);
                ctx.fillRect(14, 0, 2, 16);
                
                // 3x3 Grid lines
                ctx.fillRect(6, 2, 1, 12);
                ctx.fillRect(10, 2, 1, 12);
                ctx.fillRect(2, 6, 12, 1);
                ctx.fillRect(2, 10, 12, 1);
            } else {
                // Sides: Wood with nicely detailed tool outlines
                fillBase(ctx, 150, 90, 45);
                addStripes(ctx, rng, 'rgba(110, 55, 25, 0.8)', 'y', 4);
                
                // Workbench thick wooden edge at top
                ctx.fillStyle = 'rgba(80, 40, 15, 0.9)';
                ctx.fillRect(0, 0, 16, 4);
                ctx.fillStyle = 'rgba(60, 30, 10, 0.9)';
                ctx.fillRect(0, 4, 16, 1);

                // Tools hanging on the side
                if (face === 'front' || face === 'back') {
                    // Detailed Hammer
                    ctx.fillStyle = 'rgb(100, 50, 20)'; // handle
                    ctx.fillRect(11, 7, 2, 7);
                    ctx.fillStyle = 'rgb(180, 180, 180)'; // head
                    ctx.fillRect(10, 5, 4, 2);
                    ctx.fillStyle = 'rgb(150, 150, 150)'; // head shade
                    ctx.fillRect(10, 7, 4, 1);
                } else {
                    // Detailed Saw
                    ctx.fillStyle = 'rgb(200, 200, 200)'; // blade
                    ctx.fillRect(3, 7, 9, 3);
                    // Saw teeth
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.fillRect(3, 10, 1, 1); ctx.fillRect(5, 10, 1, 1);
                    ctx.fillRect(7, 10, 1, 1); ctx.fillRect(9, 10, 1, 1); ctx.fillRect(11, 10, 1, 1);
                    // Saw handle
                    ctx.fillStyle = 'rgb(120, 60, 20)';
                    ctx.fillRect(12, 6, 3, 5);
                    ctx.fillStyle = 'rgb(80, 40, 10)'; // handle hole
                    ctx.fillRect(13, 7, 1, 2);
                }
            }
            break;

        case BLOCKS.AETHER_STONE:
            fillBase(ctx, 220, 240, 255);
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, 'rgba(180, 220, 255, 0.5)', 30);
            addPixels(ctx, rng, 'rgba(255, 255, 255, 0.8)', 20);
            break;
        case BLOCKS.QUICKSOIL:
            fillBase(ctx, 255, 250, 200); // Yellowish sand
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, 'rgba(220, 210, 150, 0.7)', 40);
            // Add glassy swirls
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fillRect(Math.floor(rng()*TEX_SIZE), Math.floor(rng()*TEX_SIZE), 2, 1);
            }
            break;
        case BLOCKS.HOLYSTONE:
            fillBase(ctx, 240, 250, 255); // Pale bluish-white
            addNoise(ctx, rng, 10);
            addPixels(ctx, rng, 'rgba(200, 220, 230, 0.8)', 25);
            addPixels(ctx, rng, 'rgba(150, 180, 200, 0.5)', 15);
            // Slight cracks
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = 'rgba(180, 200, 210, 0.6)';
                ctx.fillRect(Math.floor(rng()*TEX_SIZE), Math.floor(rng()*TEX_SIZE), 3, 1);
            }
            break;
        case BLOCKS.AETHER_DIRT:
            fillBase(ctx, 160, 180, 200);
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, 'rgba(120, 140, 160, 0.6)', 30);
            break;
        case BLOCKS.AETHER_GRASS:
            if (face === 'top') {
                fillBase(ctx, 255, 240, 160); // Golden hue
                addNoise(ctx, rng, 10);
                addPixels(ctx, rng, 'rgba(255, 220, 100, 0.8)', 20);
            } else if (face === 'bottom') {
                fillBase(ctx, 160, 180, 200);
                addNoise(ctx, rng, 20);
            } else {
                fillBase(ctx, 160, 180, 200); // Dirt base
                addNoise(ctx, rng, 20);
                ctx.fillStyle = 'rgba(255, 240, 160, 1)';
                for (let x = 0; x < TEX_SIZE; x++) {
                    const depth = 3 + Math.floor(rng() * 3);
                    ctx.fillRect(x, 0, 1, depth);
                }
            }
            break;
        case BLOCKS.AETHER_WOOD:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 255, 245, 230); // White inner wood
                addNoise(ctx, rng, 5);
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
                ctx.beginPath();
                ctx.arc(8, 8, 3, 0, Math.PI * 2);
                ctx.arc(8, 8, 6, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                fillBase(ctx, 230, 240, 250); // White/blue bark
                addNoise(ctx, rng, 10);
                addStripes(ctx, rng, 'rgba(180, 200, 220, 0.5)', 'x', 5);
            }
            break;
        case BLOCKS.AETHER_LEAVES:
            fillBase(ctx, 255, 220, 100); // Golden leaves
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, 'rgba(0,0,0,0.4)', 40); // Transparency gaps
            break;
        case BLOCKS.AETHER_PORTAL:
            fillBase(ctx, 15, 60, 110);
            addNoise(ctx, rng, 20);
            for (let r = 2; r <= 8; r += 2) {
                ctx.strokeStyle = `rgba(${30 + r * 10}, ${180 + r * 8}, ${240 + r * 2}, 0.7)`;
                ctx.beginPath();
                ctx.arc(8, 8, r, rng() * Math.PI, rng() * Math.PI + Math.PI * 1.5);
                ctx.stroke();
            }
            addPixels(ctx, rng, 'rgba(100,225,255,0.85)', 25);
            addPixels(ctx, rng, 'rgba(220,250,255,0.95)', 12);
            break;
        case BLOCKS.AETHER_CLOUD:
            fillBase(ctx, 255, 255, 255);
            ctx.fillStyle = 'rgba(230, 240, 255, 0.8)';
            ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
            addPixels(ctx, rng, 'rgba(200, 220, 255, 0.3)', 50); // Fluffy light shadows
            break;
        case BLOCKS.AETHER_TALL_GRASS:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = 'rgba(255, 240, 160, 1)'; // Golden grass
            ctx.fillRect(4, 15, 1, 1); ctx.fillRect(4, 14, 1, 1);
            ctx.fillRect(3, 13, 1, 1); ctx.fillRect(3, 12, 1, 1);
            ctx.fillRect(7, 15, 2, 1); ctx.fillRect(7, 13, 1, 2);
            ctx.fillRect(8, 10, 1, 3); ctx.fillRect(9, 7, 1, 3);
            ctx.fillRect(11, 15, 1, 1); ctx.fillRect(11, 14, 1, 1);
            ctx.fillRect(12, 13, 1, 1); ctx.fillRect(13, 11, 1, 2);
            break;
        case BLOCKS.AETHER_FLOWER:
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = 'rgba(150, 200, 100, 1)'; // Stem
            ctx.fillRect(7, 6, 2, 10);
            ctx.fillStyle = 'rgba(0, 255, 255, 1)'; // Cyan flower top
            ctx.fillRect(6, 2, 4, 4);
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.fillRect(7, 3, 2, 2);
            break;
        case BLOCKS.AETHER_CRYSTAL:
            fillBase(ctx, 150, 220, 255); // Blue crystal
            addNoise(ctx, rng, 20);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(2, 14);
            ctx.lineTo(8, 2);
            ctx.lineTo(14, 14);
            ctx.fill();
            break;
        case BLOCKS.CAVERN_STONE:
            fillBase(ctx, 30, 40, 30); // Very dark greenish grey
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, 'rgba(50, 60, 50, 1.0)', 60);
            addPixels(ctx, rng, 'rgba(10, 20, 10, 1.0)', 60);
            break;
        case BLOCKS.CAVERN_DIRT:
            fillBase(ctx, 45, 30, 20); // Darker brown
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, 'rgba(30, 20, 15, 1.0)', 80);
            break;
        case BLOCKS.CAVERN_PORTAL:
            fillBase(ctx, 50, 100, 50); // Dark translucent green/brown
            ctx.fillStyle = 'rgba(30, 80, 30, 0.5)';
            ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
            addPixels(ctx, rng, 'rgba(150, 255, 150, 0.6)', 100);
            addPixels(ctx, rng, 'rgba(100, 200, 100, 0.8)', 50);
            break;

        case BLOCKS.MAGMA_STONE:
            fillBase(ctx, 40, 20, 20); // Dark reddish stone
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, 'rgba(255, 100, 0, 0.8)', 40); // Magma cracks
            addPixels(ctx, rng, 'rgba(255, 50, 0, 1.0)', 20);
            break;
        case BLOCKS.HIGHLANDS_STONE:
            fillBase(ctx, 160, 170, 180); // Light bluish/grey stone
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, 'rgba(200, 210, 220, 1.0)', 60);
            addPixels(ctx, rng, 'rgba(120, 130, 140, 1.0)', 60);
            break;
        case BLOCKS.HIGHLANDS_DIRT:
            fillBase(ctx, 100, 80, 70); // Light, dusty brown
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, 'rgba(80, 60, 50, 1.0)', 80);
            break;
        case BLOCKS.HIGHLANDS_GRASS:
            if (face === 'top') {
                fillBase(ctx, 80, 180, 140); // Bright teal/cyan grass
                addNoise(ctx, rng, 20);
                addPixels(ctx, rng, 'rgba(100, 200, 160, 1.0)', 50);
            } else if (face === 'bottom') {
                fillBase(ctx, 100, 80, 70); // Dirt bottom
                addNoise(ctx, rng, 15);
                addPixels(ctx, rng, 'rgba(80, 60, 50, 1.0)', 80);
            } else {
                fillBase(ctx, 100, 80, 70); // Dirt base
                addNoise(ctx, rng, 15);
                addPixels(ctx, rng, 'rgba(80, 60, 50, 1.0)', 80);
                // Grass overlay on side
                ctx.fillStyle = 'rgba(80, 180, 140, 1)';
                ctx.fillRect(0, 0, TEX_SIZE, (TEX_SIZE / 3) | 0);
                for (let i = 0; i < TEX_SIZE; i += 2) {
                    if (rng() > 0.5) ctx.fillRect(i, (TEX_SIZE / 3) | 0, 1, 1 + (rng() * 3) | 0);
                }
            }
            break;
        case BLOCKS.HIGHLANDS_PORTAL:
            fillBase(ctx, 100, 255, 255); // Very bright cyan
            ctx.fillStyle = 'rgba(0, 200, 255, 0.5)';
            ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
            addPixels(ctx, rng, 'rgba(255, 255, 255, 0.8)', 80);
            addPixels(ctx, rng, 'rgba(50, 255, 255, 0.9)', 50);
            break;

        case BLOCKS.MYCELIUM:
            if (face === 'top') {
                fillBase(ctx, 111, 99, 105); // Purple-grey mycelium mat
                addNoise(ctx, rng, 18);
                addPixels(ctx, rng, 'rgba(145, 130, 140, 0.7)', 30);
                addPixels(ctx, rng, 'rgba(165, 140, 160, 0.8)', 20);
                addPixels(ctx, rng, 'rgba(85, 75, 80, 0.6)', 25);
            } else if (face === 'bottom') {
                fillBase(ctx, 114, 80, 56); // Dirt bottom
                addNoise(ctx, rng, 20);
            } else {
                fillBase(ctx, 114, 80, 56); // Dirt base
                addNoise(ctx, rng, 20);
                ctx.fillStyle = 'rgba(111, 99, 105, 0.95)';
                ctx.fillRect(0, 0, TEX_SIZE, 3);
                for (let i = 0; i < TEX_SIZE; i += 2) {
                    if (rng() > 0.4) ctx.fillRect(i, 3, 1, 1 + (rng() * 3) | 0);
                }
            }
            break;

        case BLOCKS.SOUL_FIRE:
            fillBase(ctx, 0, 0, 0, 0);
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#00f0ff';
            for (let fx = 2; fx < 14; fx += 2) {
                const fh = 4 + (rng() * 8) | 0;
                ctx.fillRect(fx, TEX_SIZE - fh, 2, fh);
            }
            ctx.fillStyle = '#80ffff';
            for (let fx = 3; fx < 13; fx += 3) {
                const fh = 2 + (rng() * 5) | 0;
                ctx.fillRect(fx, TEX_SIZE - fh, 1, fh);
            }
            break;

        case BLOCKS.RUBY_ORE: {
            fillBase(ctx, 110, 110, 110);
            addNoise(ctx, rng, 20);
            const clusters = [[3, 3], [10, 2], [5, 9], [11, 10]];
            for (const [cx, cy] of clusters) {
                ctx.fillStyle = '#4a0014'; ctx.fillRect(cx - 1, cy - 1, 4, 4);
                ctx.fillStyle = '#9b0032'; ctx.fillRect(cx, cy, 3, 3);
                ctx.fillStyle = '#e0115f'; ctx.fillRect(cx, cy, 2, 2);
                ctx.fillStyle = '#ff6088'; ctx.fillRect(cx, cy, 1, 1);
                ctx.fillStyle = '#ffffff'; ctx.fillRect(cx + 1, cy, 1, 1);
            }
            break;
        }

        case BLOCKS.SAPPHIRE_ORE: {
            fillBase(ctx, 110, 110, 110);
            addNoise(ctx, rng, 20);
            const clusters = [[2, 4], [9, 3], [4, 10], [11, 9]];
            for (const [cx, cy] of clusters) {
                ctx.fillStyle = '#081c52'; ctx.fillRect(cx - 1, cy - 1, 4, 4);
                ctx.fillStyle = '#0e3a96'; ctx.fillRect(cx, cy, 3, 3);
                ctx.fillStyle = '#2f80ed'; ctx.fillRect(cx, cy, 2, 2);
                ctx.fillStyle = '#56ccf2'; ctx.fillRect(cx, cy, 1, 1);
                ctx.fillStyle = '#ffffff'; ctx.fillRect(cx + 1, cy, 1, 1);
            }
            break;
        }

        case BLOCKS.FLETCHING_TABLE: {
            if (face === 'top') {
                fillBase(ctx, 196, 178, 140);
                addNoise(ctx, rng, 12);
                ctx.strokeStyle = '#8a6e45';
                ctx.strokeRect(3, 3, 10, 10);
                ctx.fillStyle = '#b52b2b';
                ctx.fillRect(7, 7, 2, 2);
            } else {
                fillBase(ctx, 190, 165, 125);
                addNoise(ctx, rng, 15);
                ctx.fillStyle = '#e8e8e8';
                ctx.fillRect(4, 5, 2, 7);
                ctx.fillStyle = '#654321';
                ctx.fillRect(5, 4, 1, 9);
            }
            break;
        }

        case BLOCKS.SMOKER: {
            if (face === 'top') {
                fillBase(ctx, 65, 65, 65);
                addNoise(ctx, rng, 15);
                ctx.fillStyle = '#353535';
                ctx.fillRect(4, 4, 8, 8);
            } else {
                fillBase(ctx, 80, 80, 80);
                addNoise(ctx, rng, 15);
                ctx.fillStyle = '#222222';
                ctx.fillRect(3, 4, 10, 8);
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(5, 7, 6, 3);
            }
            break;
        }

        case BLOCKS.STONECUTTER: {
            fillBase(ctx, 120, 120, 125);
            addNoise(ctx, rng, 15);
            ctx.fillStyle = '#9095a0';
            ctx.fillRect(0, 10, 16, 6);
            ctx.fillStyle = '#dcdfe5';
            ctx.fillRect(6, 2, 4, 8);
            ctx.fillRect(4, 4, 8, 4);
            break;
        }

        case BLOCKS.EMERALD_BLOCK: {
            fillBase(ctx, 23, 181, 74);
            addNoise(ctx, rng, 15);
            ctx.strokeStyle = '#108535';
            ctx.strokeRect(1, 1, 14, 14);
            ctx.strokeStyle = '#32e36d';
            ctx.strokeRect(2, 2, 12, 12);
            ctx.fillStyle = '#108535';
            ctx.fillRect(5, 5, 6, 6);
            ctx.fillStyle = '#4ef588';
            ctx.fillRect(6, 6, 4, 4);
            break;
        }

        case BLOCKS.LAPIS_BLOCK: {
            fillBase(ctx, 24, 58, 153);
            addNoise(ctx, rng, 20);
            ctx.strokeStyle = '#112a6e';
            ctx.strokeRect(1, 1, 14, 14);
            addPixels(ctx, rng, '#396be8', 25);
            addPixels(ctx, rng, '#ffd700', 8);
            break;
        }

        case BLOCKS.REDSTONE_BLOCK: {
            fillBase(ctx, 210, 18, 18);
            addNoise(ctx, rng, 20);
            ctx.strokeStyle = '#b80808';
            ctx.strokeRect(1, 1, 14, 14);
            addPixels(ctx, rng, '#ff5555', 30);
            addPixels(ctx, rng, '#ffffff', 8);
            break;
        }

        case BLOCKS.COAL_BLOCK: {
            fillBase(ctx, 22, 22, 22);
            addNoise(ctx, rng, 20);
            ctx.strokeStyle = '#111111';
            ctx.strokeRect(1, 1, 14, 14);
            addPixels(ctx, rng, '#363636', 30);
            addPixels(ctx, rng, '#080808', 20);
            break;
        }

        case BLOCKS.ENCHANTED_AETHER_LEAVES: {
            fillBase(ctx, 0, 0, 0, 0);
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            addLeaves(ctx, rng, 'rgba(217, 70, 239, 0.9)', 'rgba(134, 25, 143, 0.95)', 'rgba(0, 245, 212, 0.85)');
            addPixels(ctx, rng, '#ffffff', 8);
            break;
        }

        case BLOCKS.ENCHANTED_AETHER_LOG: {
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 220, 230, 240);
                addNoise(ctx, rng, 15);
                ctx.strokeStyle = '#a855f7';
                ctx.strokeRect(2, 2, 12, 12);
                ctx.strokeStyle = '#c084fc';
                ctx.strokeRect(4, 4, 8, 8);
                ctx.fillStyle = '#e879f9';
                ctx.fillRect(7, 7, 2, 2);
            } else {
                fillBase(ctx, 180, 195, 210);
                addNoise(ctx, rng, 20);
                addPixels(ctx, rng, '#93c5fd', 30);
                addPixels(ctx, rng, '#c084fc', 20);
            }
            break;
        }

        case BLOCKS.CRYING_OBSIDIAN: {
            fillBase(ctx, 20, 10, 30);
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, '#100518', 40);
            addPixels(ctx, rng, '#a855f7', 25);
            addPixels(ctx, rng, '#c084fc', 15);
            addPixels(ctx, rng, '#e879f9', 8);
            break;
        }

        case BLOCKS.WARPED_NYLIUM: {
            if (face === 'top') {
                fillBase(ctx, 22, 115, 105);
                addNoise(ctx, rng, 25);
                addPixels(ctx, rng, '#14b8a6', 40);
                addPixels(ctx, rng, '#5eead4', 20);
                addPixels(ctx, rng, '#0f766e', 30);
            } else if (face === 'bottom') {
                fillBase(ctx, 110, 35, 35);
                addNoise(ctx, rng, 30);
                addPixels(ctx, rng, '#701a1a', 40);
            } else {
                fillBase(ctx, 110, 35, 35);
                addNoise(ctx, rng, 30);
                ctx.fillStyle = '#14b8a6';
                ctx.fillRect(0, 0, TEX_SIZE, 3);
                for (let i = 0; i < TEX_SIZE; i += 2) {
                    if (rng() > 0.35) ctx.fillRect(i, 3, 1, 1 + (rng() * 3) | 0);
                }
            }
            break;
        }

        case BLOCKS.WARPED_STEM: {
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 45, 110, 105);
                addNoise(ctx, rng, 15);
                ctx.strokeStyle = '#0f766e';
                ctx.strokeRect(3, 3, 10, 10);
                ctx.strokeRect(5, 5, 6, 6);
            } else {
                fillBase(ctx, 30, 85, 80);
                addNoise(ctx, rng, 20);
                addPixels(ctx, rng, '#14b8a6', 35);
                addPixels(ctx, rng, '#0f766e', 35);
            }
            break;
        }

        case BLOCKS.WARPED_WART_BLOCK: {
            fillBase(ctx, 20, 110, 105);
            addNoise(ctx, rng, 25);
            addPixels(ctx, rng, '#14b8a6', 40);
            addPixels(ctx, rng, '#042f2e', 35);
            addPixels(ctx, rng, '#5eead4', 15);
            break;
        }

        case BLOCKS.WARPED_ROOTS: {
            fillBase(ctx, 0, 0, 0, 0);
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#14b8a6';
            for (let rx = 3; rx < 13; rx += 3) {
                const rh = 6 + (rng() * 6) | 0;
                ctx.fillRect(rx, TEX_SIZE - rh, 2, rh);
            }
            addPixels(ctx, rng, '#5eead4', 10);
            break;
        }

        case BLOCKS.TWISTING_VINES: {
            fillBase(ctx, 0, 0, 0, 0);
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#14b8a6';
            for (let y = 0; y < TEX_SIZE; y++) {
                const vx = 7 + Math.sin(y * 0.8) * 3 | 0;
                ctx.fillRect(vx, y, 2, 1);
            }
            addPixels(ctx, rng, '#5eead4', 12);
            break;
        }

        case BLOCKS.NETHER_SPROUTS: {
            fillBase(ctx, 0, 0, 0, 0);
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#06b6d4';
            for (let rx = 2; rx < 14; rx += 2) {
                const rh = 2 + (rng() * 4) | 0;
                ctx.fillRect(rx, TEX_SIZE - rh, 1, rh);
            }
            break;
        }

        case BLOCKS.SOUL_SOIL: {
            fillBase(ctx, 75, 55, 45);
            addNoise(ctx, rng, 20);
            addPixels(ctx, rng, '#36231a', 40);
            addPixels(ctx, rng, '#593e32', 30);
            break;
        }

        case BLOCKS.BONE_BLOCK: {
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 225, 220, 200);
                addNoise(ctx, rng, 10);
                ctx.strokeStyle = '#a8a29e';
                ctx.strokeRect(3, 3, 10, 10);
                ctx.fillStyle = '#78716c';
                ctx.fillRect(6, 6, 4, 4);
            } else {
                fillBase(ctx, 225, 220, 200);
                addNoise(ctx, rng, 15);
                addPixels(ctx, rng, '#d6d3d1', 40);
                addPixels(ctx, rng, '#a8a29e', 20);
            }
            break;
        }

        case BLOCKS.BASALT: {
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 110, 110, 115);
                addNoise(ctx, rng, 15);
                ctx.strokeStyle = '#505055';
                ctx.strokeRect(3, 3, 10, 10);
            } else {
                fillBase(ctx, 60, 60, 65);
                addNoise(ctx, rng, 15);
                for (let x = 0; x < TEX_SIZE; x += 3) {
                    ctx.fillStyle = (x % 6 === 0) ? '#45454a' : '#75757d';
                    ctx.fillRect(x, 0, 2, TEX_SIZE);
                }
            }
            break;
        }

        case BLOCKS.SMOOTH_BASALT: {
            fillBase(ctx, 70, 70, 75);
            addNoise(ctx, rng, 12);
            addPixels(ctx, rng, '#505055', 30);
            addPixels(ctx, rng, '#8a8a92', 20);
            break;
        }

        case BLOCKS.MAGMA: {
            fillBase(ctx, 40, 10, 5);
            addNoise(ctx, rng, 15);
            ctx.fillStyle = '#ff6b00';
            ctx.fillRect(2, 4, 8, 2);
            ctx.fillRect(7, 4, 2, 7);
            ctx.fillRect(3, 11, 10, 2);
            ctx.fillStyle = '#ffb703';
            ctx.fillRect(3, 4, 5, 1);
            ctx.fillRect(7, 5, 1, 5);
            ctx.fillRect(5, 11, 6, 1);
            addPixels(ctx, rng, '#d00000', 30);
            break;
        }

        case BLOCKS.BLACKSTONE: {
            fillBase(ctx, 40, 36, 40);
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, '#201c22', 40);
            addPixels(ctx, rng, '#58525b', 25);
            break;
        }

        case BLOCKS.SHROOMLIGHT: {
            fillBase(ctx, 245, 140, 65);
            addNoise(ctx, rng, 15);
            addPixels(ctx, rng, '#fb923c', 40);
            addPixels(ctx, rng, '#fdba74', 35);
            addPixels(ctx, rng, '#ea580c', 20);
            break;
        }

        case BLOCKS.ZANITE_ORE: {
            fillBase(ctx, 160, 165, 180);
            addNoise(ctx, rng, 20);
            const clusters = [[3, 4], [10, 3], [5, 10], [11, 11]];
            for (const [cx, cy] of clusters) {
                ctx.fillStyle = '#581c87'; ctx.fillRect(cx - 1, cy - 1, 4, 4);
                ctx.fillStyle = '#9333ea'; ctx.fillRect(cx, cy, 3, 3);
                ctx.fillStyle = '#c084fc'; ctx.fillRect(cx, cy, 2, 2);
                ctx.fillStyle = '#ffffff'; ctx.fillRect(cx + 1, cy, 1, 1);
            }
            break;
        }

        case BLOCKS.GRAVITITE_ORE: {
            fillBase(ctx, 160, 165, 180);
            addNoise(ctx, rng, 20);
            const clusters = [[4, 3], [9, 4], [3, 10], [10, 10]];
            for (const [cx, cy] of clusters) {
                ctx.fillStyle = '#831843'; ctx.fillRect(cx - 1, cy - 1, 4, 4);
                ctx.fillStyle = '#db2777'; ctx.fillRect(cx, cy, 3, 3);
                ctx.fillStyle = '#f472b6'; ctx.fillRect(cx, cy, 2, 2);
                ctx.fillStyle = '#ffffff'; ctx.fillRect(cx + 1, cy, 1, 1);
            }
            break;
        }

        case BLOCKS.AMBROSIUM_ORE: {
            fillBase(ctx, 160, 165, 180);
            addNoise(ctx, rng, 20);
            const clusters = [[3, 3], [10, 4], [4, 11], [11, 9]];
            for (const [cx, cy] of clusters) {
                ctx.fillStyle = '#78350f'; ctx.fillRect(cx - 1, cy - 1, 4, 4);
                ctx.fillStyle = '#d97706'; ctx.fillRect(cx, cy, 3, 3);
                ctx.fillStyle = '#fbbf24'; ctx.fillRect(cx, cy, 2, 2);
                ctx.fillStyle = '#fef08a'; ctx.fillRect(cx + 1, cy, 1, 1);
            }
            break;
        }

        case BLOCKS.CARVED_HOLYSTONE: {
            fillBase(ctx, 175, 180, 195);
            addNoise(ctx, rng, 15);
            ctx.strokeStyle = '#94a3b8';
            ctx.strokeRect(1, 1, 14, 14);
            ctx.strokeRect(4, 4, 8, 8);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(7, 7, 2, 2);
            break;
        }

        case BLOCKS.SENTRY_STONE: {
            fillBase(ctx, 50, 55, 65);
            addNoise(ctx, rng, 15);
            ctx.strokeStyle = '#334155';
            ctx.strokeRect(1, 1, 14, 14);
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(4, 7, 8, 2);
            ctx.fillStyle = '#67e8f9';
            ctx.fillRect(6, 7, 4, 1);
            break;
        }

        case BLOCKS.GOLDEN_OAK_WOOD: {
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 210, 165, 75);
                addNoise(ctx, rng, 15);
                ctx.strokeStyle = '#b45309';
                ctx.strokeRect(2, 2, 12, 12);
                ctx.strokeRect(4, 4, 8, 8);
            } else {
                fillBase(ctx, 160, 110, 45);
                addNoise(ctx, rng, 20);
                addPixels(ctx, rng, '#d97706', 35);
                addPixels(ctx, rng, '#92400e', 35);
            }
            break;
        }

        case BLOCKS.GOLDEN_OAK_LEAVES: {
            fillBase(ctx, 0, 0, 0, 0);
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            addLeaves(ctx, rng, '#eab308', '#ca8a04', '#fef08a');
            break;
        }

        case BLOCKS.PODZOL: {
            if (face === 'top') {
                fillBase(ctx, 95, 60, 35);
                addNoise(ctx, rng, 20);
                addPixels(ctx, rng, '#5c3317', 40);
                addPixels(ctx, rng, '#3d200e', 30);
                addPixels(ctx, rng, '#784620', 30);
            } else if (face === 'bottom') {
                fillBase(ctx, 134, 96, 67);
                addNoise(ctx, rng, 25);
            } else {
                fillBase(ctx, 134, 96, 67);
                addNoise(ctx, rng, 25);
                ctx.fillStyle = '#5c3317';
                ctx.fillRect(0, 0, TEX_SIZE, 3);
                for (let i = 0; i < TEX_SIZE; i += 2) {
                    if (rng() > 0.4) ctx.fillRect(i, 3, 1, 1 + (rng() * 2) | 0);
                }
            }
            break;
        }

        case BLOCKS.MAGIC_WOOD:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 60, 40, 80);
                addNoise(ctx, rng, 15);
                ctx.strokeStyle = '#9c27b0';
                ctx.strokeRect(3, 3, 10, 10);
                ctx.strokeRect(5, 5, 6, 6);
            } else {
                fillBase(ctx, 45, 30, 60);
                addNoise(ctx, rng, 20);
                addPixels(ctx, rng, '#7b1fa2', 30);
                addPixels(ctx, rng, '#4a148c', 30);
            }
            break;

        case BLOCKS.MAGIC_LEAVES:
            fillBase(ctx, 156, 39, 176);
            addNoise(ctx, rng, 25);
            addPixels(ctx, rng, '#e1bee7', 40);
            addPixels(ctx, rng, '#ba68c8', 40);
            addPixels(ctx, rng, '#00e5ff', 15);
            break;

        case BLOCKS.REDWOOD_LOG:
            if (face === 'top' || face === 'bottom') {
                fillBase(ctx, 160, 95, 60);
                addNoise(ctx, rng, 15);
                ctx.strokeStyle = '#8d4024';
                ctx.strokeRect(2, 2, 12, 12);
                ctx.strokeRect(4, 4, 8, 8);
                ctx.strokeRect(6, 6, 4, 4);
            } else {
                fillBase(ctx, 110, 48, 25);
                addNoise(ctx, rng, 25);
                addPixels(ctx, rng, '#7a2f14', 40);
                addPixels(ctx, rng, '#d06035', 30);
            }
            break;

        case BLOCKS.REDWOOD_LEAVES:
            fillBase(ctx, 35, 75, 45);
            addNoise(ctx, rng, 25);
            addPixels(ctx, rng, '#1e5230', 50);
            addPixels(ctx, rng, '#4b8b58', 40);
            break;

        case BLOCKS.LAVENDER:
            fillBase(ctx, 0, 0, 0, 0);
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.fillStyle = '#388e3c';
            ctx.fillRect(7, 6, 2, 10);
            ctx.fillStyle = '#7e57c2';
            ctx.fillRect(6, 2, 4, 7);
            ctx.fillStyle = '#b39ddb';
            ctx.fillRect(7, 1, 2, 3);
            ctx.fillStyle = '#512da8';
            ctx.fillRect(6, 5, 1, 3);
            ctx.fillRect(9, 4, 1, 3);
            break;

        case BLOCKS.BLUE_AERCLOUD:
            fillBase(ctx, 180, 235, 255);
            addNoise(ctx, rng, 12);
            addPixels(ctx, rng, 'rgba(255, 255, 255, 0.8)', 60);
            addPixels(ctx, rng, 'rgba(100, 200, 255, 0.6)', 40);
            break;

        case BLOCKS.GOLDEN_AERCLOUD:
            fillBase(ctx, 255, 240, 180);
            addNoise(ctx, rng, 12);
            addPixels(ctx, rng, 'rgba(255, 255, 255, 0.8)', 60);
            addPixels(ctx, rng, 'rgba(255, 200, 80, 0.6)', 40);
            break;

        default:
            fillBase(ctx, 255, 0, 255);
            break;
    }
}
function hasFaceVariants(blockType) {
    return [
        BLOCKS.GRASS, BLOCKS.WOOD, BLOCKS.MUSHROOM_STEM, BLOCKS.SAVANNA_GRASS, BLOCKS.ACACIA_WOOD, BLOCKS.SWAMP_GRASS, BLOCKS.ALIEN_GRASS, BLOCKS.PORTAL_FRAME, BLOCKS.CHERRY_LOG, BLOCKS.AUTUMN_WOOD, BLOCKS.PALM_WOOD, BLOCKS.PINE_WOOD, BLOCKS.DARK_OAK_WOOD,
        BLOCKS.CHEST_BLOCK, BLOCKS.FURNACE, BLOCKS.CRIMSON_NYLIUM, BLOCKS.CRIMSON_STEM, BLOCKS.TNT, BLOCKS.CRAFTING_TABLE, BLOCKS.AETHER_GRASS, BLOCKS.AETHER_WOOD, BLOCKS.HIGHLANDS_GRASS,
        BLOCKS.CACTUS, BLOCKS.SANDSTONE, BLOCKS.BOOKSHELF, BLOCKS.MYCELIUM,
        BLOCKS.WARPED_NYLIUM, BLOCKS.WARPED_STEM, BLOCKS.BONE_BLOCK, BLOCKS.BASALT, BLOCKS.BLACKSTONE, BLOCKS.PODZOL, BLOCKS.GOLDEN_OAK_WOOD, BLOCKS.MAGIC_WOOD, BLOCKS.REDWOOD_LOG,
        BLOCKS.FLETCHING_TABLE, BLOCKS.SMOKER, BLOCKS.STONECUTTER,
        BLOCKS.MANGROVE_LOG, BLOCKS.MANGROVE_ROOTS, BLOCKS.MUDDY_MANGROVE_ROOTS, BLOCKS.ENCHANTED_AETHER_LOG
    ].includes(blockType);
}

// Build the atlas: for face-variant blocks, store 3 rows (top, side, bottom)
// For uniform blocks, store 1 texture and use the same UV for all faces


const MINECRAFT_ASSETS_BASE = "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.11/assets/minecraft/textures/";
const AETHER_ASSETS_BASE = "https://raw.githubusercontent.com/The-Aether-Team/The-Aether/1.21.1-develop/src/main/resources/assets/aether/textures/block/natural/";

const MC_TEXTURE_MAP = {
    [BLOCKS.GRASS]: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    [BLOCKS.DIRT]: 'dirt',
    [BLOCKS.STONE]: 'stone',
    [BLOCKS.SAND]: 'sand',
    [BLOCKS.WATER]: 'water_still',
    [BLOCKS.WOOD]: { top: 'oak_log_top', side: 'oak_log', bottom: 'oak_log_top' },
    [BLOCKS.LEAVES]: 'oak_leaves',
    [BLOCKS.PLANKS]: 'oak_planks',
    [BLOCKS.COBBLESTONE]: 'cobblestone',
    [BLOCKS.IRON_ORE]: 'iron_ore',
    [BLOCKS.GOLD_ORE]: 'gold_ore',
    [BLOCKS.CRYSTAL_ORE]: 'diamond_ore',
    [BLOCKS.MANA_ORE]: 'lapis_ore',
    [BLOCKS.OBSIDIAN]: 'obsidian',
    [BLOCKS.CRYING_OBSIDIAN]: 'crying_obsidian',
    [BLOCKS.GLOWSTONE]: 'glowstone',
    [BLOCKS.DUNGEON_DOOR]: 'oak_door_bottom',
    [BLOCKS.DUNGEON_DOOR_TOP]: 'oak_door_top',
    [BLOCKS.MUSHROOM_STEM]: 'mushroom_stem',
    [BLOCKS.MUSHROOM_CAP]: 'red_mushroom_block',
    [BLOCKS.RED_MUSHROOM]: 'red_mushroom',
    [BLOCKS.BROWN_MUSHROOM]: 'brown_mushroom',
    [BLOCKS.BROWN_MUSHROOM_BLOCK]: 'brown_mushroom_block',
    [BLOCKS.ALIEN_STONE]: 'end_stone',
    [BLOCKS.ALIEN_GRASS]: { top: 'mycelium_top', side: 'mycelium_side', bottom: 'end_stone' },
    [BLOCKS.MYCELIUM]: { top: 'mycelium_top', side: 'mycelium_side', bottom: 'dirt' },
    [BLOCKS.ALIEN_CRYSTAL]: 'purpur_block',
    [BLOCKS.SNOW]: 'snow',
    [BLOCKS.ICE]: 'ice',
    [BLOCKS.LAVA]: 'lava_flow',
    [BLOCKS.PORTAL_FRAME]: { top: 'end_portal_frame_top', side: 'end_portal_frame_side', bottom: 'end_stone' },
    [BLOCKS.PORTAL]: 'nether_portal',
    [BLOCKS.BEDROCK]: 'bedrock',
    [BLOCKS.GRAVEL]: 'gravel',
    [BLOCKS.CLAY]: 'clay',
    [BLOCKS.GLASS]: 'glass',
    [BLOCKS.TORCH]: 'torch',
    [BLOCKS.SANDSTONE]: { top: 'sandstone_top', side: 'sandstone', bottom: 'sandstone_bottom' },
    [BLOCKS.RED_SAND]: 'red_sand',
    [BLOCKS.TERRACOTTA]: 'terracotta',
    [BLOCKS.DEAD_BUSH]: 'dead_bush',
    [BLOCKS.ALIEN_TALL_GRASS]: 'crimson_roots',
    [BLOCKS.SAVANNA_GRASS]: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    [BLOCKS.ACACIA_WOOD]: { top: 'acacia_log_top', side: 'acacia_log', bottom: 'acacia_log_top' },
    [BLOCKS.ACACIA_LEAVES]: 'acacia_leaves',
    [BLOCKS.MUD]: 'mud',
    [BLOCKS.SWAMP_GRASS]: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    [BLOCKS.SWAMP_WATER]: 'water_still',
    [BLOCKS.ALIEN_SPORE_STEM]: 'warped_stem',
    [BLOCKS.ALIEN_SPORE_BLOCK]: 'warped_wart_block',
    [BLOCKS.VINES]: 'vine',
    [BLOCKS.TALL_GRASS]: 'tall_grass_top',
    [BLOCKS.RED_FLOWER]: 'poppy',
    [BLOCKS.CACTUS]: { top: 'cactus_top', side: 'cactus_side', bottom: 'cactus_bottom' },
    [BLOCKS.BLUE_FLOWER]: 'cornflower',
    [BLOCKS.YELLOW_FLOWER]: 'dandelion',
    [BLOCKS.FERN]: 'fern',
    [BLOCKS.TALL_FERN]: 'large_fern_bottom',
    [BLOCKS.TALL_FERN_TOP]: 'large_fern_top',
    [BLOCKS.WHITE_FLOWER]: 'lily_of_the_valley',
    [BLOCKS.PURPLE_FLOWER]: 'allium',
    [BLOCKS.ORANGE_FLOWER]: 'orange_tulip',
    [BLOCKS.CHERRY_LOG]: { top: 'cherry_log_top', side: 'cherry_log', bottom: 'cherry_log_top' },
    [BLOCKS.CHERRY_LEAVES]: 'cherry_leaves',
    [BLOCKS.PINK_PETALS]: 'pink_petals',
    [BLOCKS.AUTUMN_WOOD]: { top: 'pale_oak_log_top', side: 'pale_oak_log', bottom: 'pale_oak_log_top' },
    [BLOCKS.AUTUMN_LEAVES]: 'pale_oak_leaves',
    [BLOCKS.DARK_OAK_WOOD]: { top: 'dark_oak_log_top', side: 'dark_oak_log', bottom: 'dark_oak_log_top' },
    [BLOCKS.DARK_OAK_LEAVES]: 'dark_oak_leaves',
    [BLOCKS.DARK_OAK_PLANKS]: 'dark_oak_planks',
    [BLOCKS.FALLEN_LEAVES]: 'podzol_top',
    [BLOCKS.GLOW_STEM]: 'crimson_stem',
    [BLOCKS.GLOW_LEAVES]: 'shroomlight',
    [BLOCKS.GLOW_SHROOM]: 'red_mushroom',
    [BLOCKS.BOSS_SPAWNER]: 'spawner',
    [BLOCKS.COAL_ORE]: 'coal_ore',
    [BLOCKS.DIAMOND_ORE]: 'diamond_ore',
    [BLOCKS.STONE_BRICKS]: 'stone_bricks',
    [BLOCKS.BRICKS]: 'bricks',
    [BLOCKS.BOOKSHELF]: { top: 'oak_planks', bottom: 'oak_planks', side: 'bookshelf', front: 'bookshelf' },
    [BLOCKS.CHEST_BLOCK]: { top: 'chest://top', bottom: 'chest://bottom', side: 'chest://side', front: 'chest://front' },
    [BLOCKS.MOSSY_COBBLESTONE]: 'mossy_cobblestone',
    [BLOCKS.LADDER]: 'ladder',
    [BLOCKS.IRON_BLOCK]: 'iron_block',
    [BLOCKS.GOLD_BLOCK]: 'gold_block',
    [BLOCKS.DIAMOND_BLOCK]: 'diamond_block',
    [BLOCKS.EMERALD_BLOCK]: 'emerald_block',
    [BLOCKS.LAPIS_BLOCK]: 'lapis_block',
    [BLOCKS.REDSTONE_BLOCK]: 'redstone_block',
    [BLOCKS.COAL_BLOCK]: 'coal_block',
    [BLOCKS.FLETCHING_TABLE]: { top: 'fletching_table_top', side: 'fletching_table_side', bottom: 'birch_planks', front: 'fletching_table_front' },
    [BLOCKS.SMOKER]: { top: 'smoker_top', side: 'smoker_side', bottom: 'smoker_bottom', front: 'smoker_front' },
    [BLOCKS.STONECUTTER]: { top: 'stonecutter_top', side: 'stonecutter_side', bottom: 'stonecutter_bottom', front: 'stonecutter_side' },
    [BLOCKS.WOOL]: 'white_wool',
    [BLOCKS.FURNACE]: { top: 'furnace_top', side: 'furnace_side', bottom: 'furnace_top', front: 'furnace_front' },
    [BLOCKS.NETHERRACK]: 'netherrack',
    [BLOCKS.SOUL_SAND]: 'soul_sand',
    [BLOCKS.NETHER_BRICKS]: 'nether_bricks',
    [BLOCKS.CRIMSON_NYLIUM]: { top: 'crimson_nylium', side: 'crimson_nylium_side', bottom: 'netherrack' },
    [BLOCKS.CRIMSON_STEM]: { top: 'crimson_stem_top', side: 'crimson_stem', bottom: 'crimson_stem_top' },
    [BLOCKS.CRIMSON_LEAVES]: 'nether_wart_block',
    [BLOCKS.NETHER_WART_BLOCK]: 'nether_wart_block',
    [BLOCKS.TUBE_CORAL]: 'tube_coral',
    [BLOCKS.BRAIN_CORAL]: 'brain_coral',
    [BLOCKS.FIRE_CORAL]: 'fire_coral',
    [BLOCKS.HORN_CORAL]: 'horn_coral',
    [BLOCKS.PINE_WOOD]: { top: 'spruce_log_top', side: 'spruce_log', bottom: 'spruce_log_top' },
    [BLOCKS.PINE_LEAVES]: 'spruce_leaves',
    [BLOCKS.ACACIA_PLANKS]: 'acacia_planks',
    [BLOCKS.CHERRY_PLANKS]: 'cherry_planks',
    [BLOCKS.AUTUMN_PLANKS]: 'spruce_planks',
    [BLOCKS.PALM_PLANKS]: 'jungle_planks',
    [BLOCKS.PINE_PLANKS]: 'spruce_planks',
    [BLOCKS.CRIMSON_PLANKS]: 'crimson_planks',
    [BLOCKS.SUGARCANE]: 'sugar_cane',
    [BLOCKS.FIRE]: 'fire_0',
    [BLOCKS.TNT]: { top: 'tnt_top', side: 'tnt_side', bottom: 'tnt_bottom' },
    [BLOCKS.CRAFTING_TABLE]: { top: 'crafting_table_top', side: 'crafting_table_side', bottom: 'oak_planks', front: 'crafting_table_front' },
    [BLOCKS.AETHER_STONE]: 'aether://holystone',
    [BLOCKS.AETHER_DIRT]: 'aether://aether_dirt',
    [BLOCKS.AETHER_GRASS]: { top: 'aether://aether_grass_block_top', side: 'aether://aether_grass_block_side', bottom: 'aether://aether_dirt' },
    [BLOCKS.AETHER_WOOD]: { top: 'aether://skyroot_log_top', side: 'aether://skyroot_log', bottom: 'aether://skyroot_log_top' },
    [BLOCKS.AETHER_LEAVES]: 'aether://golden_oak_leaves',
    [BLOCKS.AETHER_PORTAL]: 'aether_portal',
    [BLOCKS.AETHER_CLOUD]: 'white_wool',
    [BLOCKS.AETHER_TALL_GRASS]: 'aether://skyroot_leaves',
    [BLOCKS.AETHER_FLOWER]: 'aether://white_flower',
    [BLOCKS.AETHER_CRYSTAL]: 'sea_lantern',
    [BLOCKS.CAVERN_STONE]: 'andesite',
    [BLOCKS.CAVERN_DIRT]: 'dirt',
    [BLOCKS.CAVERN_PORTAL]: 'obsidian',
    [BLOCKS.MAGMA_STONE]: 'magma',
    [BLOCKS.HIGHLANDS_STONE]: 'diorite',
    [BLOCKS.HIGHLANDS_DIRT]: 'dirt',
    [BLOCKS.HIGHLANDS_GRASS]: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    [BLOCKS.HIGHLANDS_PORTAL]: 'emerald_block',
    [BLOCKS.SEAGRASS]: 'seagrass',
    [BLOCKS.KELP]: 'kelp',
    [BLOCKS.BUBBLE_CORAL]: 'bubble_coral',
    [BLOCKS.SEASHELL_1]: 'bone_block_top',
    [BLOCKS.SEASHELL_2]: 'item/nautilus_shell',
    [BLOCKS.SEASHELL_3]: 'item/turtle_scute',
    [BLOCKS.LILY_PAD]: 'lily_pad',
    [BLOCKS.ALGAE]: 'seagrass',
    [BLOCKS.RED_KELP]: 'kelp',
    [BLOCKS.BROWN_KELP]: 'kelp_plant',
    [BLOCKS.QUICKSOIL]: 'aether://quicksoil',
    [BLOCKS.HOLYSTONE]: 'aether://holystone',
    [BLOCKS.ENCHANTED_AETHER_LOG]: { top: 'aether://golden_oak_log', side: 'aether://golden_oak_log', bottom: 'aether://golden_oak_log' },
    [BLOCKS.ENCHANTED_AETHER_LEAVES]: 'aether://crystal_leaves',
    [BLOCKS.WARPED_NYLIUM]: { top: 'warped_nylium', side: 'warped_nylium_side', bottom: 'netherrack' },
    [BLOCKS.WARPED_STEM]: { top: 'warped_stem_top', side: 'warped_stem', bottom: 'warped_stem_top' },
    [BLOCKS.WARPED_WART_BLOCK]: 'warped_wart_block',
    [BLOCKS.WARPED_ROOTS]: 'warped_roots',
    [BLOCKS.TWISTING_VINES]: 'twisting_vines',
    [BLOCKS.NETHER_SPROUTS]: 'nether_sprouts',
    [BLOCKS.SOUL_SOIL]: 'soul_soil',
    [BLOCKS.BONE_BLOCK]: { top: 'bone_block_top', side: 'bone_block_side', bottom: 'bone_block_top' },
    [BLOCKS.SOUL_FIRE]: 'soul_fire_0',
    [BLOCKS.BASALT]: { top: 'basalt_top', side: 'basalt_side', bottom: 'basalt_top' },
    [BLOCKS.SMOOTH_BASALT]: 'smooth_basalt',
    [BLOCKS.MAGMA]: 'magma',
    [BLOCKS.BLACKSTONE]: { top: 'blackstone_top', side: 'blackstone', bottom: 'blackstone_top' },
    [BLOCKS.SHROOMLIGHT]: 'shroomlight',
    [BLOCKS.PODZOL]: { top: 'podzol_top', side: 'podzol_side', bottom: 'dirt' },
    [BLOCKS.ZANITE_ORE]: 'zanite_ore',
    [BLOCKS.GRAVITITE_ORE]: 'gravitite_ore',
    [BLOCKS.AMBROSIUM_ORE]: 'ambrosium_ore',
    [BLOCKS.CARVED_HOLYSTONE]: 'carved_holystone',
    [BLOCKS.SENTRY_STONE]: 'sentry_stone',
    [BLOCKS.BLUE_AERCLOUD]: 'cold_aercloud',
    [BLOCKS.GOLDEN_AERCLOUD]: 'cold_aercloud',
    [BLOCKS.GOLDEN_OAK_WOOD]: { top: 'golden_oak_log', side: 'golden_oak_log', bottom: 'golden_oak_log' },
    [BLOCKS.GOLDEN_OAK_LEAVES]: 'golden_oak_leaves',
    [BLOCKS.MAGIC_WOOD]: { top: 'dark_oak_log_top', side: 'dark_oak_log', bottom: 'dark_oak_log_top' },
    [BLOCKS.MAGIC_LEAVES]: 'cherry_leaves',
    [BLOCKS.REDWOOD_LOG]: { top: 'spruce_log_top', side: 'spruce_log', bottom: 'spruce_log_top' },
    [BLOCKS.REDWOOD_LEAVES]: 'spruce_leaves',
    [BLOCKS.LAVENDER]: 'allium',
    [BLOCKS.RUBY_ORE]: 'ruby_ore',
    [BLOCKS.SAPPHIRE_ORE]: 'sapphire_ore',
    [BLOCKS.MANGROVE_LOG]: { top: 'mangrove_log_top', side: 'mangrove_log', bottom: 'mangrove_log_top' },
    [BLOCKS.MANGROVE_LEAVES]: 'mangrove_leaves',
    [BLOCKS.MANGROVE_ROOTS]: { top: 'mangrove_roots_top', side: 'mangrove_roots_side', bottom: 'mangrove_roots_top' },
    [BLOCKS.MUDDY_MANGROVE_ROOTS]: { top: 'muddy_mangrove_roots_top', side: 'muddy_mangrove_roots_side', bottom: 'muddy_mangrove_roots_top' },
    [BLOCKS.MANGROVE_PLANKS]: 'mangrove_planks'
};

let _mcChestPromise = null;
function loadMinecraftChestTexture(face) {
    if (!_mcChestPromise) {
        _mcChestPromise = new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.11/assets/minecraft/textures/entity/chest/normal.png';
        });
    }
    return _mcChestPromise.then(img => {
        if (!img) return null;
        const c = document.createElement('canvas');
        c.width = TEX_SIZE; c.height = TEX_SIZE;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        if (face === 'top') {
            // Lid top exterior: (28, 0, 14, 14)
            ctx.drawImage(img, 28, 0, 14, 14, 0, 0, TEX_SIZE, TEX_SIZE);
        } else if (face === 'bottom') {
            // Base bottom: (28, 19, 14, 14)
            ctx.drawImage(img, 28, 19, 14, 14, 0, 0, TEX_SIZE, TEX_SIZE);
        } else if (face === 'side') {
            // Lid side (0, 14, 14, 5) -> top 5px
            ctx.drawImage(img, 0, 14, 14, 5, 0, 0, TEX_SIZE, 5);
            // Base side (0, 33, 14, 10) -> bottom 11px
            ctx.drawImage(img, 0, 33, 14, 10, 0, 5, TEX_SIZE, 11);
        } else if (face === 'front') {
            // Lid front (14, 14, 14, 5)
            ctx.drawImage(img, 14, 14, 14, 5, 0, 0, TEX_SIZE, 5);
            // Base front (14, 33, 14, 10)
            ctx.drawImage(img, 14, 33, 14, 10, 0, 5, TEX_SIZE, 11);
            // Latch (1, 1, 2, 4) at center (x: 7, y: 3)
            ctx.drawImage(img, 1, 1, 2, 4, 7, 3, 2, 5);
        }
        return c;
    });
}

const LOCAL_ASSET_MAP = {
    "aether_dirt": "assets/aether/block/aether_dirt.png",
    "aether_grass_side": "assets/aether/block/aether_grass_side.png",
    "aether_grass_top": "assets/aether/block/aether_grass_top.png",
    "ambrosium_ore": "assets/aether/block/ambrosium_ore.png",
    "carved_holystone": "assets/aether/block/carved_holystone.png",
    "cold_aercloud": "assets/aether/block/cold_aercloud.png",
    "golden_oak_leaves": "assets/aether/block/golden_oak_leaves.png",
    "golden_oak_log": "assets/aether/block/golden_oak_log.png",
    "gravitite_ore": "assets/aether/block/gravitite_ore.png",
    "holystone": "assets/aether/block/holystone.png",
    "sentry_stone": "assets/aether/block/sentry_stone.png",
    "zanite_ore": "assets/aether/block/zanite_ore.png",
    "ambrosium_shard": "assets/aether/item/ambrosium_shard.png",
    "gravitite_axe": "assets/aether/item/gravitite_axe.png",
    "gravitite_pickaxe": "assets/aether/item/gravitite_pickaxe.png",
    "gravitite_shovel": "assets/aether/item/gravitite_shovel.png",
    "gravitite_sword": "assets/aether/item/gravitite_sword.png",
    "zanite_axe": "assets/aether/item/zanite_axe.png",
    "zanite_gem": "assets/aether/item/zanite_gem.png",
    "zanite_pickaxe": "assets/aether/item/zanite_pickaxe.png",
    "zanite_shovel": "assets/aether/item/zanite_shovel.png",
    "zanite_sword": "assets/aether/item/zanite_sword.png",
    "acacia_leaves": "assets/mc/block/acacia_leaves.png",
    "acacia_log": "assets/mc/block/acacia_log.png",
    "acacia_log_top": "assets/mc/block/acacia_log_top.png",
    "acacia_planks": "assets/mc/block/acacia_planks.png",
    "allium": "assets/mc/block/allium.png",
    "andesite": "assets/mc/block/andesite.png",
    "basalt_side": "assets/mc/block/basalt_side.png",
    "basalt_top": "assets/mc/block/basalt_top.png",
    "bedrock": "assets/mc/block/bedrock.png",
    "blackstone": "assets/mc/block/blackstone.png",
    "blackstone_top": "assets/mc/block/blackstone_top.png",
    "bone_block_side": "assets/mc/block/bone_block_side.png",
    "bone_block_top": "assets/mc/block/bone_block_top.png",
    "bookshelf": "assets/mc/block/bookshelf.png",
    "brain_coral": "assets/mc/block/brain_coral.png",
    "bricks": "assets/mc/block/bricks.png",
    "bubble_coral": "assets/mc/block/bubble_coral.png",
    "cactus_bottom": "assets/mc/block/cactus_bottom.png",
    "cactus_side": "assets/mc/block/cactus_side.png",
    "cactus_top": "assets/mc/block/cactus_top.png",
    "cherry_leaves": "assets/mc/block/cherry_leaves.png",
    "cherry_log": "assets/mc/block/cherry_log.png",
    "cherry_log_top": "assets/mc/block/cherry_log_top.png",
    "cherry_planks": "assets/mc/block/cherry_planks.png",
    "clay": "assets/mc/block/clay.png",
    "coal_ore": "assets/mc/block/coal_ore.png",
    "cobblestone": "assets/mc/block/cobblestone.png",
    "cornflower": "assets/mc/block/cornflower.png",
    "crafting_table_front": "assets/mc/block/crafting_table_front.png",
    "crafting_table_side": "assets/mc/block/crafting_table_side.png",
    "crafting_table_top": "assets/mc/block/crafting_table_top.png",
    "crimson_nylium": "assets/mc/block/crimson_nylium.png",
    "crimson_nylium_side": "assets/mc/block/crimson_nylium_side.png",
    "crimson_planks": "assets/mc/block/crimson_planks.png",
    "crimson_roots": "assets/mc/block/crimson_roots.png",
    "crimson_stem": "assets/mc/block/crimson_stem.png",
    "crimson_stem_top": "assets/mc/block/crimson_stem_top.png",
    "crying_obsidian": "assets/mc/block/crying_obsidian.png",
    "dandelion": "assets/mc/block/dandelion.png",
    "dark_oak_leaves": "assets/mc/block/dark_oak_leaves.png",
    "dark_oak_log": "assets/mc/block/dark_oak_log.png",
    "dark_oak_log_top": "assets/mc/block/dark_oak_log_top.png",
    "dark_oak_planks": "assets/mc/block/dark_oak_planks.png",
    "dead_bush": "assets/mc/block/dead_bush.png",
    "diamond_block": "assets/mc/block/diamond_block.png",
    "diamond_ore": "assets/mc/block/diamond_ore.png",
    "diorite": "assets/mc/block/diorite.png",
    "dirt": "assets/mc/block/dirt.png",
    "emerald_block": "assets/mc/block/emerald_block.png",
    "lapis_block": "assets/mc/block/lapis_block.png",
    "redstone_block": "assets/mc/block/redstone_block.png",
    "coal_block": "assets/mc/block/coal_block.png",
    "birch_planks": "assets/mc/block/birch_planks.png",
    "fletching_table_top": "assets/mc/block/fletching_table_top.png",
    "fletching_table_side": "assets/mc/block/fletching_table_side.png",
    "fletching_table_front": "assets/mc/block/fletching_table_front.png",
    "smoker_top": "assets/mc/block/smoker_top.png",
    "smoker_side": "assets/mc/block/smoker_side.png",
    "smoker_bottom": "assets/mc/block/smoker_bottom.png",
    "smoker_front": "assets/mc/block/smoker_front.png",
    "stonecutter_top": "assets/mc/block/stonecutter_top.png",
    "stonecutter_side": "assets/mc/block/stonecutter_side.png",
    "stonecutter_bottom": "assets/mc/block/stonecutter_bottom.png",
    "emerald": "assets/mc/item/emerald.png",
    "redstone": "assets/mc/item/redstone.png",
    "bow": "assets/mc/item/bow.png",
    "arrow": "assets/mc/item/arrow.png",
    "golden_apple": "assets/mc/item/golden_apple.png",
    "flint": "assets/mc/item/flint.png",
    "feather": "assets/mc/item/feather.png",
    "string": "assets/mc/item/string.png",
    "sugar": "assets/mc/item/sugar.png",
    "paper": "assets/mc/item/paper.png",
    "book": "assets/mc/item/book.png",
    "wheat": "assets/mc/item/wheat.png",
    "compass": "assets/mc/item/compass.png",
    "clock": "assets/mc/item/clock.png",
    "destroy_stage_0": "assets/mc/block/destroy_stage_0.png",
    "destroy_stage_1": "assets/mc/block/destroy_stage_1.png",
    "destroy_stage_2": "assets/mc/block/destroy_stage_2.png",
    "destroy_stage_3": "assets/mc/block/destroy_stage_3.png",
    "destroy_stage_4": "assets/mc/block/destroy_stage_4.png",
    "destroy_stage_5": "assets/mc/block/destroy_stage_5.png",
    "destroy_stage_6": "assets/mc/block/destroy_stage_6.png",
    "destroy_stage_7": "assets/mc/block/destroy_stage_7.png",
    "destroy_stage_8": "assets/mc/block/destroy_stage_8.png",
    "destroy_stage_9": "assets/mc/block/destroy_stage_9.png",
    "aether_portal": "assets/mc/block/aether_portal.png",
    "end_gateway_beam": "assets/mc/block/end_gateway_beam.png",
    "end_portal_frame_side": "assets/mc/block/end_portal_frame_side.png",
    "end_portal_frame_top": "assets/mc/block/end_portal_frame_top.png",
    "end_stone": "assets/mc/block/end_stone.png",
    "fern": "assets/mc/block/fern.png",
    "fire_0": "assets/mc/block/fire_0.png",
    "fire_coral": "assets/mc/block/fire_coral.png",
    "furnace_front": "assets/mc/block/furnace_front.png",
    "furnace_side": "assets/mc/block/furnace_side.png",
    "furnace_top": "assets/mc/block/furnace_top.png",
    "glass": "assets/mc/block/glass.png",
    "glowstone": "assets/mc/block/glowstone.png",
    "gold_block": "assets/mc/block/gold_block.png",
    "gold_ore": "assets/mc/block/gold_ore.png",
    "grass_block_side": "assets/mc/block/grass_block_side.png",
    "grass_block_top": "assets/mc/block/grass_block_top.png",
    "gravel": "assets/mc/block/gravel.png",
    "horn_coral": "assets/mc/block/horn_coral.png",
    "ice": "assets/mc/block/ice.png",
    "iron_block": "assets/mc/block/iron_block.png",
    "iron_ore": "assets/mc/block/iron_ore.png",
    "jungle_planks": "assets/mc/block/jungle_planks.png",
    "kelp": "assets/mc/block/kelp.png",
    "kelp_plant": "assets/mc/block/kelp_plant.png",
    "ladder": "assets/mc/block/ladder.png",
    "lapis_ore": "assets/mc/block/lapis_ore.png",
    "lava_flow": "assets/mc/block/lava_flow.png",
    "lily_of_the_valley": "assets/mc/block/lily_of_the_valley.png",
    "lily_pad": "assets/mc/block/lily_pad.png",
    "magma": "assets/mc/block/magma.png",
    "mossy_cobblestone": "assets/mc/block/mossy_cobblestone.png",
    "mushroom_stem": "assets/mc/block/mushroom_stem.png",
    "mycelium_side": "assets/mc/block/mycelium_side.png",
    "mycelium_top": "assets/mc/block/mycelium_top.png",
    "nautilus_shell": "assets/mc/block/nautilus_shell.png",
    "netherrack": "assets/mc/block/netherrack.png",
    "nether_bricks": "assets/mc/block/nether_bricks.png",
    "nether_portal": "assets/mc/block/nether_portal.png",
    "nether_sprouts": "assets/mc/block/nether_sprouts.png",
    "nether_wart_block": "assets/mc/block/nether_wart_block.png",
    "oak_door_bottom": "assets/mc/block/oak_door_bottom.png",
    "oak_door_top": "assets/mc/block/oak_door_top.png",
    "oak_leaves": "assets/mc/block/oak_leaves.png",
    "oak_log": "assets/mc/block/oak_log.png",
    "oak_log_top": "assets/mc/block/oak_log_top.png",
    "oak_planks": "assets/mc/block/oak_planks.png",
    "mangrove_log": "assets/mc/block/mangrove_log.png",
    "mangrove_log_top": "assets/mc/block/mangrove_log_top.png",
    "mangrove_leaves": "assets/mc/block/mangrove_leaves.png",
    "mangrove_roots_side": "assets/mc/block/mangrove_roots_side.png",
    "mangrove_roots_top": "assets/mc/block/mangrove_roots_top.png",
    "muddy_mangrove_roots_side": "assets/mc/block/muddy_mangrove_roots_side.png",
    "muddy_mangrove_roots_top": "assets/mc/block/muddy_mangrove_roots_top.png",
    "mangrove_planks": "assets/mc/block/mangrove_planks.png",
    "obsidian": "assets/mc/block/obsidian.png",
    "orange_tulip": "assets/mc/block/orange_tulip.png",
    "pale_oak_leaves": "assets/mc/block/pale_oak_leaves.png",
    "pale_oak_log": "assets/mc/block/pale_oak_log.png",
    "pale_oak_log_top": "assets/mc/block/pale_oak_log_top.png",
    "pink_petals": "assets/mc/block/pink_petals.png",
    "podzol_side": "assets/mc/block/podzol_side.png",
    "podzol_top": "assets/mc/block/podzol_top.png",
    "poppy": "assets/mc/block/poppy.png",
    "purpur_block": "assets/mc/block/purpur_block.png",
    "redstone_ore": "assets/mc/block/redstone_ore.png",
    "red_mushroom": "assets/mc/block/red_mushroom.png",
    "red_mushroom_block": "assets/mc/block/red_mushroom_block.png",
    "brown_mushroom": "assets/mc/block/brown_mushroom.png",
    "brown_mushroom_block": "assets/mc/block/brown_mushroom_block.png",
    "red_sand": "assets/mc/block/red_sand.png",
    "sand": "assets/mc/block/sand.png",
    "sandstone": "assets/mc/block/sandstone.png",
    "sandstone_bottom": "assets/mc/block/sandstone_bottom.png",
    "sandstone_top": "assets/mc/block/sandstone_top.png",
    "seagrass": "assets/mc/block/seagrass.png",
    "sea_lantern": "assets/mc/block/sea_lantern.png",
    "shroomlight": "assets/mc/block/shroomlight.png",
    "smooth_basalt": "assets/mc/block/smooth_basalt.png",
    "snow": "assets/mc/block/snow.png",
    "soul_fire_0": "assets/mc/block/soul_fire_0.png",
    "soul_sand": "assets/mc/block/soul_sand.png",
    "soul_soil": "assets/mc/block/soul_soil.png",
    "spawner": "assets/mc/block/spawner.png",
    "spruce_leaves": "assets/mc/block/spruce_leaves.png",
    "spruce_log": "assets/mc/block/spruce_log.png",
    "spruce_log_top": "assets/mc/block/spruce_log_top.png",
    "spruce_planks": "assets/mc/block/spruce_planks.png",
    "stone": "assets/mc/block/stone.png",
    "stone_bricks": "assets/mc/block/stone_bricks.png",
    "sugar_cane": "assets/mc/block/sugar_cane.png",
    "tall_grass_top": "assets/mc/block/tall_grass_top.png",
    "terracotta": "assets/mc/block/terracotta.png",
    "tnt_bottom": "assets/mc/block/tnt_bottom.png",
    "tnt_side": "assets/mc/block/tnt_side.png",
    "tnt_top": "assets/mc/block/tnt_top.png",
    "torch": "assets/mc/block/torch.png",
    "tube_coral": "assets/mc/block/tube_coral.png",
    "turtle_scute": "assets/mc/block/turtle_scute.png",
    "twisting_vines": "assets/mc/block/twisting_vines.png",
    "vine": "assets/mc/block/vine.png",
    "warped_nylium": "assets/mc/block/warped_nylium.png",
    "warped_nylium_side": "assets/mc/block/warped_nylium_side.png",
    "warped_roots": "assets/mc/block/warped_roots.png",
    "warped_stem": "assets/mc/block/warped_stem.png",
    "warped_stem_top": "assets/mc/block/warped_stem_top.png",
    "warped_wart_block": "assets/mc/block/warped_wart_block.png",
    "water_flow": "assets/mc/block/water_flow.png",
    "water_still": "assets/mc/block/water_still.png",
    "white_wool": "assets/mc/block/white_wool.png",
    "apple": "assets/mc/item/apple.png",
    "beef": "assets/mc/item/beef.png",
    "blaze_rod": "assets/mc/item/blaze_rod.png",
    "bread": "assets/mc/item/bread.png",
    "bucket": "assets/mc/item/bucket.png",
    "chicken": "assets/mc/item/chicken.png",
    "coal": "assets/mc/item/coal.png",
    "cod": "assets/mc/item/cod.png",
    "cooked_beef": "assets/mc/item/cooked_beef.png",
    "cooked_chicken": "assets/mc/item/cooked_chicken.png",
    "cooked_cod": "assets/mc/item/cooked_cod.png",
    "cooked_mutton": "assets/mc/item/cooked_mutton.png",
    "cooked_porkchop": "assets/mc/item/cooked_porkchop.png",
    "diamond": "assets/mc/item/diamond.png",
    "diamond_axe": "assets/mc/item/diamond_axe.png",
    "diamond_boots": "assets/mc/item/diamond_boots.png",
    "diamond_chestplate": "assets/mc/item/diamond_chestplate.png",
    "diamond_helmet": "assets/mc/item/diamond_helmet.png",
    "diamond_leggings": "assets/mc/item/diamond_leggings.png",
    "diamond_pickaxe": "assets/mc/item/diamond_pickaxe.png",
    "diamond_shovel": "assets/mc/item/diamond_shovel.png",
    "diamond_sword": "assets/mc/item/diamond_sword.png",
    "ender_pearl": "assets/mc/item/ender_pearl.png",
    "flint_and_steel": "assets/mc/item/flint_and_steel.png",
    "golden_axe": "assets/mc/item/golden_axe.png",
    "golden_boots": "assets/mc/item/golden_boots.png",
    "golden_chestplate": "assets/mc/item/golden_chestplate.png",
    "golden_helmet": "assets/mc/item/golden_helmet.png",
    "golden_leggings": "assets/mc/item/golden_leggings.png",
    "golden_pickaxe": "assets/mc/item/golden_pickaxe.png",
    "golden_shovel": "assets/mc/item/golden_shovel.png",
    "golden_sword": "assets/mc/item/golden_sword.png",
    "gold_ingot": "assets/mc/item/gold_ingot.png",
    "iron_axe": "assets/mc/item/iron_axe.png",
    "iron_boots": "assets/mc/item/iron_boots.png",
    "iron_chestplate": "assets/mc/item/iron_chestplate.png",
    "iron_helmet": "assets/mc/item/iron_helmet.png",
    "iron_ingot": "assets/mc/item/iron_ingot.png",
    "iron_leggings": "assets/mc/item/iron_leggings.png",
    "iron_pickaxe": "assets/mc/item/iron_pickaxe.png",
    "iron_shovel": "assets/mc/item/iron_shovel.png",
    "iron_sword": "assets/mc/item/iron_sword.png",
    "lapis_lazuli": "assets/mc/item/lapis_lazuli.png",
    "lava_bucket": "assets/mc/item/lava_bucket.png",
    "mutton": "assets/mc/item/mutton.png",
    "netherite_axe": "assets/mc/item/netherite_axe.png",
    "netherite_ingot": "assets/mc/item/netherite_ingot.png",
    "netherite_pickaxe": "assets/mc/item/netherite_pickaxe.png",
    "netherite_shovel": "assets/mc/item/netherite_shovel.png",
    "netherite_sword": "assets/mc/item/netherite_sword.png",
    "nether_star": "assets/mc/item/nether_star.png",
    "porkchop": "assets/mc/item/porkchop.png",
    "prismarine_shard": "assets/mc/item/prismarine_shard.png",
    "raw_copper": "assets/mc/item/raw_copper.png",
    "raw_gold": "assets/mc/item/raw_gold.png",
    "raw_iron": "assets/mc/item/raw_iron.png",
    "stick": "assets/mc/item/stick.png",
    "stone_axe": "assets/mc/item/stone_axe.png",
    "stone_pickaxe": "assets/mc/item/stone_pickaxe.png",
    "stone_shovel": "assets/mc/item/stone_shovel.png",
    "stone_sword": "assets/mc/item/stone_sword.png",
    "water_bucket": "assets/mc/item/water_bucket.png",
    "wooden_axe": "assets/mc/item/wooden_axe.png",
    "wooden_pickaxe": "assets/mc/item/wooden_pickaxe.png",
    "wooden_shovel": "assets/mc/item/wooden_shovel.png",
    "wooden_sword": "assets/mc/item/wooden_sword.png",
    "icons": "assets/mc/icons.png",
    "mana_bar_bg": "assets/mc/mana_bar_bg.png",
    "mana_bar_fill": "assets/mc/mana_bar_fill.png",
    "steve": "assets/mc/steve.png",
    "widgets": "assets/mc/widgets.png",
    "aether_grass_block_top": "assets/aether/block/aether_grass_top.png",
    "aether_grass_block_side": "assets/aether/block/aether_grass_side.png",
    "skyroot_log": "assets/aether/block/golden_oak_log.png",
    "skyroot_log_top": "assets/aether/block/golden_oak_log.png",
    "skyroot_leaves": "assets/aether/block/golden_oak_leaves.png",
    "crystal_leaves": "assets/aether/block/crystal_leaves.png",
    "white_flower": "assets/mc/block/lily_of_the_valley.png",
    "quicksoil": "assets/mc/block/sand.png",
    "ruby_ore": "assets/mc/block/ruby_ore.png",
    "sapphire_ore": "assets/mc/block/sapphire_ore.png",
    "ruby": "assets/mc/item/ruby.png",
    "sapphire": "assets/mc/item/sapphire.png",
    "mud": "assets/mc/block/mud.png",
    "ruby_sword": "assets/mc/item/ruby_sword.png",
    "ruby_pickaxe": "assets/mc/item/ruby_pickaxe.png",
    "ruby_axe": "assets/mc/item/ruby_axe.png",
    "ruby_shovel": "assets/mc/item/ruby_shovel.png",
    "sapphire_sword": "assets/mc/item/sapphire_sword.png",
    "sapphire_pickaxe": "assets/mc/item/sapphire_pickaxe.png",
    "sapphire_axe": "assets/mc/item/sapphire_axe.png",
    "sapphire_shovel": "assets/mc/item/sapphire_shovel.png",
    "quartz": "assets/mc/item/quartz.png",
    "netherite_scrap": "assets/mc/item/netherite_scrap.png",
    "large_fern_bottom": "assets/mc/block/large_fern_bottom.png",
    "large_fern_top": "assets/mc/block/large_fern_top.png",
    "bat_spawn_egg": "assets/mc/item/bat_spawn_egg.png",
    "camel_spawn_egg": "assets/mc/item/camel_spawn_egg.png",
    "chicken_spawn_egg": "assets/mc/item/chicken_spawn_egg.png",
    "cod_spawn_egg": "assets/mc/item/cod_spawn_egg.png",
    "cow_spawn_egg": "assets/mc/item/cow_spawn_egg.png",
    "frog_spawn_egg": "assets/mc/item/frog_spawn_egg.png",
    "iron_golem_spawn_egg": "assets/mc/item/iron_golem_spawn_egg.png",
    "magma_cube_spawn_egg": "assets/mc/item/magma_cube_spawn_egg.png",
    "piglin_brute_spawn_egg": "assets/mc/item/piglin_brute_spawn_egg.png",
    "pig_spawn_egg": "assets/mc/item/pig_spawn_egg.png",
    "salmon_spawn_egg": "assets/mc/item/salmon_spawn_egg.png",
    "sheep_spawn_egg": "assets/mc/item/sheep_spawn_egg.png",
    "skeleton_spawn_egg": "assets/mc/item/skeleton_spawn_egg.png",
    "slime_spawn_egg": "assets/mc/item/slime_spawn_egg.png",
    "spider_spawn_egg": "assets/mc/item/spider_spawn_egg.png",
    "tropical_fish_spawn_egg": "assets/mc/item/tropical_fish_spawn_egg.png",
    "turtle_spawn_egg": "assets/mc/item/turtle_spawn_egg.png",
    "zombie_spawn_egg": "assets/mc/item/zombie_spawn_egg.png",
    "creeper_spawn_egg": "assets/mc/item/creeper_spawn_egg.png",
    "enderman_spawn_egg": "assets/mc/item/enderman_spawn_egg.png",
    "pufferfish_spawn_egg": "assets/mc/item/pufferfish_spawn_egg.png"
};

function loadMinecraftTexture(name) {
    if (name.startsWith('chest://')) {
        return loadMinecraftChestTexture(name.slice(8));
    }
    const cleanName = name.replace(/^aether:\/\//, '');
    const localPath = LOCAL_ASSET_MAP[cleanName] || LOCAL_ASSET_MAP[cleanName.replace(/^.*\//, '')];

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            // Local fallback failed, try remote (jsdelivr CDN for reliability)
            const remoteImg = new Image();
            remoteImg.crossOrigin = 'anonymous';
            remoteImg.onload = () => resolve(remoteImg);
            remoteImg.onerror = () => {
                // Secondary fallback to raw github
                const rawImg = new Image();
                rawImg.crossOrigin = 'anonymous';
                rawImg.onload = () => resolve(rawImg);
                rawImg.onerror = () => resolve(null);
                const subPath = cleanName.includes('/') ? cleanName : ('block/' + cleanName);
                rawImg.src = MINECRAFT_ASSETS_BASE + subPath + '.png';
            };
            const subPath = cleanName.includes('/') ? cleanName : ('block/' + cleanName);
            remoteImg.src = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/" + subPath + '.png';
        };

        if (localPath) {
            img.src = localPath;
        } else {
            img.crossOrigin = 'anonymous';
            const subPath = cleanName.includes('/') ? cleanName : ('block/' + cleanName);
            img.src = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/" + subPath + '.png';
        }
    });
}

export async function createTextureAtlas(useMinecraft = true) {
    // Calculate atlas layout
    // Each block gets at most 3 faces (top, side, bottom)
    // We lay them out linearly
    const entries = []; // { blockType, face, col, row }
    let col = 0, row = 0;

    const uvMap = {}; // blockType -> { top: {u,v}, side: {u,v}, bottom: {u,v} }

    for (const key of Object.keys(BLOCKS)) {
        const bt = BLOCKS[key];
        if (bt === BLOCKS.AIR) continue;

        if (hasFaceVariants(bt)) {
            // Top
            uvMap[bt] = {};
            for (const face of ['top', 'side', 'bottom', 'front']) {
                entries.push({ blockType: bt, face, col, row });
                uvMap[bt][face] = { col, row };
                col++;
                if (col >= ATLAS_COLS) { col = 0; row++; }
            }
        } else {
            entries.push({ blockType: bt, face: 'all', col, row });
            uvMap[bt] = { top: { col, row }, side: { col, row }, bottom: { col, row }, front: { col, row } };
            col++;
            if (col >= ATLAS_COLS) { col = 0; row++; }
        }
    }

    const totalRows = row + (col > 0 ? 1 : 0);
    const atlasW = ATLAS_COLS * TEX_SIZE;
    const atlasH = totalRows * TEX_SIZE;

    const canvas = document.createElement('canvas');
    canvas.width = atlasW;
    canvas.height = atlasH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;

    // Temp canvas for per-texture generation
    const tmp = document.createElement('canvas');
    tmp.width = TEX_SIZE;
    tmp.height = TEX_SIZE;
    const tmpCtx = tmp.getContext('2d', { willReadFrequently: true });
    tmpCtx.imageSmoothingEnabled = false;

    const rng = seededRandom(42);

    const animatedFrames = [];

    for (const entry of entries) {
        tmpCtx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
        generateBlockTexture(tmpCtx, entry.blockType, entry.face === 'all' ? 'side' : entry.face, rng);
        ctx.drawImage(tmp, entry.col * TEX_SIZE, entry.row * TEX_SIZE);

        if (entry.blockType === BLOCKS.WATER || entry.blockType === BLOCKS.LAVA || entry.blockType === BLOCKS.SWAMP_WATER || entry.blockType === BLOCKS.FIRE || entry.blockType === BLOCKS.SOUL_FIRE) {
            const fCanvas = document.createElement('canvas');
            fCanvas.width = TEX_SIZE; fCanvas.height = TEX_SIZE;
            fCanvas.getContext('2d').drawImage(tmp, 0, 0);
            animatedFrames.push({
                x: entry.col * TEX_SIZE,
                y: entry.row * TEX_SIZE,
                canvas: fCanvas
            });
        }
    }

    // Fetch Minecraft textures if enabled
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
                        
                        // Dynamic colormap tinted textures are kept grayscale in atlas so vertex colors blend dynamically
                        const isWater = (texName === 'water_flow' || texName === 'water_still');
                        const isDynamicTint = (texName === 'grass_block_top' || texName === 'oak_leaves' || texName === 'dark_oak_leaves' || texName === 'mangrove_leaves' || texName === 'vine' || texName.includes('fern') || texName.includes('tall_grass') || texName === 'lily_pad');
                        const requiresFixedTint = !isDynamicTint && (texName.includes('leaves') || isWater);
                        
                        // Helper: force all pixels in atlas region to fully opaque
                        const forceOpaque = (ax, ay) => {
                            const pd = ctx.getImageData(ax, ay, TEX_SIZE, TEX_SIZE);
                            for (let pi = 3; pi < pd.data.length; pi += 4) pd.data[pi] = 255;
                            ctx.putImageData(pd, ax, ay);
                        };

                        let tintColor = null;
                        if (isDynamicTint) {
                            // Keep texture raw/grayscale in atlas so chunk mesh vertex colors can apply dynamic per-biome tinting and smooth biome blending
                            ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                        } else if (requiresFixedTint) {
                            // Draw the image first to a temporary canvas so we can tint it
                            const tCanvas = document.createElement('canvas');
                            tCanvas.width = TEX_SIZE; tCanvas.height = TEX_SIZE;
                            const tCtx = tCanvas.getContext('2d');
                            
                            // Determine tint color
                            let tint = '#8ee066'; // default
                            
                            if (isWater) {
                                tint = (bt === BLOCKS.SWAMP_WATER) ? '#617B59' : '#3F76E4';
                            } else {
                                if (bt === BLOCKS.SWAMP_GRASS) tint = '#6a7039';
                                else if (bt === BLOCKS.SAVANNA_GRASS) tint = '#bfb755';
                                else if (bt === BLOCKS.HIGHLANDS_GRASS) tint = '#659c40';
                                else if (bt === BLOCKS.AETHER_GRASS) tint = '#b3ffb3';
                                else if (bt === BLOCKS.ACACIA_LEAVES) tint = '#aea42a';
                                else if (bt === BLOCKS.PINE_LEAVES) tint = '#4f855f';
                                else if (bt === BLOCKS.AUTUMN_LEAVES) tint = '#659c40';
                                else if (bt === BLOCKS.CHERRY_LEAVES) tint = '#ffffff';
                                else tint = '#6fc042';
                            }

                            tCtx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                            tCtx.globalCompositeOperation = 'multiply';
                            tintColor = tint;
                            tCtx.fillStyle = tint;
                            tCtx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
                            // Restore alpha channel using destination-in
                            tCtx.globalCompositeOperation = 'destination-in';
                            tCtx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                            ctx.drawImage(tCanvas, entry.col * TEX_SIZE, entry.row * TEX_SIZE);
                            if (isWater) {
                                forceOpaque(entry.col * TEX_SIZE, entry.row * TEX_SIZE);
                            }
                        } else if (texName === 'end_portal_frame_side') {
                            ctx.drawImage(img, 0, 3, TEX_SIZE, 13, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                        } else {
                            ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                        }

                        // For water blocks: force all atlas pixels fully opaque so material opacity controls transparency
                        if (isWater) {
                            forceOpaque(entry.col * TEX_SIZE, entry.row * TEX_SIZE);
                        }
                        
                        // If animated strip, save it to animatedFrames
                        if (img.height > TEX_SIZE) {
                            const forceOpaqueFlag = isWater;
                            const frameInfo = animatedFrames.find(f => f.x === entry.col * TEX_SIZE && f.y === entry.row * TEX_SIZE);
                            if (frameInfo) {
                                frameInfo.isMC = true;
                                frameInfo.img = img;
                                frameInfo.frames = img.height / TEX_SIZE;
                                frameInfo.tint = tintColor;
                                frameInfo.forceOpaque = forceOpaqueFlag;
                            } else {
                                animatedFrames.push({
                                    x: entry.col * TEX_SIZE,
                                    y: entry.row * TEX_SIZE,
                                    isMC: true,
                                    img: img,
                                    frames: img.height / TEX_SIZE,
                                    tint: tintColor,
                                    forceOpaque: forceOpaqueFlag,
                                });
                            }
                        }
                    }
                }));
            }
        }
        await Promise.all(promises);

        // Preload all Minecraft item textures so slots never glitch or pop
        const itemPromises = [];
        for (const [subtype, mcName] of Object.entries(MC_ITEM_MAP)) {
            if (!_itemCanvasCache.has(subtype)) {
                itemPromises.push(loadMinecraftTexture(mcName).then(img => {
                    if (img) {
                        const itemCvs = document.createElement('canvas');
                        itemCvs.width = TEX_SIZE; itemCvs.height = TEX_SIZE;
                        const ictx = itemCvs.getContext('2d');
                        ictx.imageSmoothingEnabled = false;
                        ictx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                        _itemCanvasCache.set(subtype, itemCvs);
                        _itemTextureCache.set(subtype, itemCvs.toDataURL());
                    }
                }));
            }
        }
        await Promise.all(itemPromises);
    }

    // Ensure Steve skin is initialized and fully loaded
    await initSteveSkin();

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    // UV helper: returns u,v coordinates (0-1) and size for a face
    const uUnit = 1 / ATLAS_COLS;
    const vUnit = 1 / totalRows;

    function getUV(blockType, face) {
        const map = uvMap[blockType];
        if (!map) return { u: 0, v: 0, uSize: uUnit, vSize: vUnit }; // fallback
        let faceKey = 'side';
        if (face === 'top' || face === 'py') faceKey = 'top';
        else if (face === 'bottom' || face === 'ny') faceKey = 'bottom';
        else if (face === 'front' || face === 'pz') faceKey = 'front';
        const entry = map[faceKey] || map.side || map.top;
        
        return {
            u: entry.col * uUnit,
            v: 1 - (entry.row + 1) * vUnit, // flip Y for Three.js
            uSize: uUnit,
            vSize: vUnit
        };
    }

    // Generate small icon canvases for inventory display
    function getBlockIcon(blockType) {
        const SCALE = 4; // Upscale for crisp isometric rendering
        const iconCanvas = document.createElement('canvas');
        iconCanvas.width = TEX_SIZE * 2 * SCALE;
        iconCanvas.height = TEX_SIZE * 2 * SCALE;
        const iconCtx = iconCanvas.getContext('2d', { willReadFrequently: true });
        iconCtx.imageSmoothingEnabled = false;
        
        const props = getBlockProperties(blockType);
        
        const getFaceCanvas = (faceKey) => {
            const map = uvMap[blockType];
            const entry = map ? (map[faceKey] || map.side || map.top) : null;
            const faceCvs = document.createElement('canvas'); 
            faceCvs.width = TEX_SIZE; faceCvs.height = TEX_SIZE;
            const ctx = faceCvs.getContext('2d');
            if (entry && canvas) {
                ctx.drawImage(canvas, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
            } else {
                generateBlockTexture(ctx, blockType, faceKey, seededRandom(blockType * 1000 + 77));
            }

            // Tint inventory icon for dynamically tinted grass and foliage blocks
            if (props.isGrassTinted && (faceKey === 'top' || props.isCross)) {
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = '#8ee066';
                ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
                ctx.globalCompositeOperation = 'destination-in';
                if (entry && canvas) {
                    ctx.drawImage(canvas, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                }
                ctx.globalCompositeOperation = 'source-over';
            } else if (props.isFoliageTinted) {
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = '#59ae30';
                ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
                ctx.globalCompositeOperation = 'destination-in';
                if (entry && canvas) {
                    ctx.drawImage(canvas, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                }
                ctx.globalCompositeOperation = 'source-over';
            }

            return faceCvs;
        };

        if (props.isCross) {
            // Flat 2D for cross models (torch, flowers, saplings) - enlarged to fill slot nicely
            const tmp = getFaceCanvas('side');
            const pad = 2 * SCALE;
            const drawSize = (TEX_SIZE * 2 - 4) * SCALE;
            iconCtx.drawImage(tmp, 0, 0, TEX_SIZE, TEX_SIZE, pad, pad, drawSize, drawSize);
            return iconCanvas;
        }

        // Generate 3 faces from atlas
        const top = getFaceCanvas('top');
        const side1 = getFaceCanvas('side');
        // For blocks with a distinct front face (chest, furnace, etc.), show it on the right face of the icon
        const hasFront = uvMap[blockType] && uvMap[blockType]['front'];
        const side2 = getFaceCanvas(hasFront ? 'front' : 'side');

        // Darken faces for 3D effect
        const s2Ctx = side2.getContext('2d');
        s2Ctx.fillStyle = 'rgba(0,0,0,0.4)';
        s2Ctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);
        
        const s1Ctx = side1.getContext('2d');
        s1Ctx.fillStyle = 'rgba(0,0,0,0.15)';
        s1Ctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);

        // Upscale canvases to prevent anti-aliasing blur during transform
        const topScaled = document.createElement('canvas'); topScaled.width = TEX_SIZE * SCALE; topScaled.height = TEX_SIZE * SCALE;
        const tCtx = topScaled.getContext('2d'); tCtx.imageSmoothingEnabled = false;
        tCtx.drawImage(top, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE * SCALE, TEX_SIZE * SCALE);

        const side1Scaled = document.createElement('canvas'); side1Scaled.width = TEX_SIZE * SCALE; side1Scaled.height = TEX_SIZE * SCALE;
        const s1sCtx = side1Scaled.getContext('2d'); s1sCtx.imageSmoothingEnabled = false;
        s1sCtx.drawImage(side1, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE * SCALE, TEX_SIZE * SCALE);

        const side2Scaled = document.createElement('canvas'); side2Scaled.width = TEX_SIZE * SCALE; side2Scaled.height = TEX_SIZE * SCALE;
        const s2sCtx = side2Scaled.getContext('2d'); s2sCtx.imageSmoothingEnabled = false;
        s2sCtx.drawImage(side2, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE * SCALE, TEX_SIZE * SCALE);

        iconCtx.save();
        
        // Top face
        iconCtx.setTransform(1, 0.5, -1, 0.5, TEX_SIZE * SCALE, 0);
        iconCtx.drawImage(topScaled, 0, 0);

        // Left face
        iconCtx.setTransform(1, 0.5, 0, 1, 0, TEX_SIZE * SCALE * 0.5);
        iconCtx.drawImage(side1Scaled, 0, 0);

        // Right face
        iconCtx.setTransform(1, -0.5, 0, 1, TEX_SIZE * SCALE, TEX_SIZE * SCALE);
        iconCtx.drawImage(side2Scaled, 0, 0);
        
        iconCtx.restore();

        return iconCanvas;
    }

    function updateAnimatedTextures(time) {
        if (animatedFrames.length === 0) return;
        const shift = Math.floor(time * 0.05) % TEX_SIZE;
        let didUpdate = false;
        
        for (const frame of animatedFrames) {
            if (frame.isMC) {
                const totalFrames = frame.frames || 1;
                const currentFrame = Math.floor(time / 100) % totalFrames;
                if (frame.lastFrame === currentFrame) continue;
                frame.lastFrame = currentFrame;
                
                ctx.clearRect(frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(frame.img, 0, currentFrame * TEX_SIZE, TEX_SIZE, TEX_SIZE, frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                
                // If it requires tint, multiply tint color over it
                if (frame.tint) {
                    tmpCtx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                    tmpCtx.drawImage(frame.img, 0, currentFrame * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                    tmpCtx.globalCompositeOperation = 'multiply';
                    tmpCtx.fillStyle = frame.tint;
                    tmpCtx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
                    // Restore alpha
                    tmpCtx.globalCompositeOperation = 'destination-in';
                    tmpCtx.drawImage(frame.img, 0, currentFrame * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                    tmpCtx.globalCompositeOperation = 'source-over';
                    
                    ctx.clearRect(frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                    ctx.drawImage(tmp, 0, 0, TEX_SIZE, TEX_SIZE, frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                }
                
                // Force water pixels opaque so material opacity controls transparency
                if (frame.forceOpaque) {
                    const pd = ctx.getImageData(frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                    for (let pi = 3; pi < pd.data.length; pi += 4) pd.data[pi] = 255;
                    ctx.putImageData(pd, frame.x, frame.y);
                }
                
                didUpdate = true;
            } else {
                if (useMinecraft) continue;
                if (texture.userData.lastShift === shift) continue;
                tmpCtx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                tmpCtx.drawImage(frame.canvas, 0, shift);
                tmpCtx.drawImage(frame.canvas, 0, shift - TEX_SIZE);
                ctx.clearRect(frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(tmp, frame.x, frame.y);
                didUpdate = true;
            }
        }
        
        texture.userData.lastShift = shift;
        if (didUpdate) texture.needsUpdate = true;
    }

    return { texture, getUV, atlasW, atlasH, totalRows, getBlockIcon, updateAnimatedTextures };
}

// ----------------------------------------------------
// Procedural Item Pixel Art Generator
// ----------------------------------------------------

const MC_ITEM_MAP = {

    'iron_ingot': 'iron_ingot',
    'gold_ingot': 'gold_ingot',
    'diamond': 'diamond',
    'coal': 'coal',
    'mana_crystal': 'lapis_lazuli',
    'boss': 'nether_star',
    'stick': 'stick',
    'wand_basic': 'stick',
    'wand_fire': 'blaze_rod',
    'wand_ice': 'prismarine_shard',
    'wood': 'oak_log',
    'stone': 'cobblestone',
    'apple': 'apple',
    'bread': 'bread',
    'cooked_beef': 'cooked_beef',
    'sword_wood': 'wooden_sword',
    'sword_stone': 'stone_sword',
    'sword_iron': 'iron_sword',
    'sword_gold': 'golden_sword',
    'sword_diamond': 'diamond_sword',
    'pickaxe_wood': 'wooden_pickaxe',
    'pickaxe_stone': 'stone_pickaxe',
    'pickaxe_iron': 'iron_pickaxe',
    'pickaxe_gold': 'golden_pickaxe',
    'pickaxe_diamond': 'diamond_pickaxe',
    'axe_wood': 'wooden_axe',
    'axe_stone': 'stone_axe',
    'axe_iron': 'iron_axe',
    'axe_gold': 'golden_axe',
    'axe_diamond': 'diamond_axe',
    'shovel_wood': 'wooden_shovel',
    'shovel_stone': 'stone_shovel',
    'shovel_iron': 'iron_shovel',
    'shovel_gold': 'golden_shovel',
    'shovel_diamond': 'diamond_shovel',
    'wood_shovel': 'wooden_shovel',
    'stone_shovel': 'stone_shovel',
    'iron_shovel': 'iron_shovel',
    'gold_shovel': 'golden_shovel',
    'golden_shovel': 'golden_shovel',
    'diamond_shovel': 'diamond_shovel',
    'raw_beef': 'beef',
    'beef': 'beef',
    'steak': 'cooked_beef',
    'cooked_beef': 'cooked_beef',
    'raw_porkchop': 'porkchop',
    'porkchop': 'porkchop',
    'cooked_porkchop': 'cooked_porkchop',
    'raw_chicken': 'chicken',
    'chicken': 'chicken',
    'cooked_chicken': 'cooked_chicken',
    'raw_mutton': 'mutton',
    'mutton': 'mutton',
    'cooked_mutton': 'cooked_mutton',
    'raw_fish': 'cod',
    'cooked_fish': 'cooked_cod',
    'cod': 'cod',
    'cooked_cod': 'cooked_cod',
    'raw_iron': 'raw_iron',
    'raw_gold': 'raw_gold',
    'raw_copper': 'raw_copper',
    'ender_pearl': 'ender_pearl',
    'helmet_iron': 'iron_helmet',
    'chest_iron': 'iron_chestplate',
    'legs_iron': 'iron_leggings',
    'boots_iron': 'iron_boots',
    'helmet_gold': 'golden_helmet',
    'chest_gold': 'golden_chestplate',
    'legs_gold': 'golden_leggings',
    'boots_gold': 'golden_boots',
    'helmet_diamond': 'diamond_helmet',
    'chest_diamond': 'diamond_chestplate',
    'legs_diamond': 'diamond_leggings',
    'boots_diamond': 'diamond_boots',
    'flint_and_steel': 'flint_and_steel',
    'bucket': 'bucket',
    'water_bucket': 'water_bucket',
    'lava_bucket': 'lava_bucket',
    'netherite_ingot': 'netherite_ingot',
    'sword_netherite': 'netherite_sword',
    'pickaxe_netherite': 'netherite_pickaxe',
    'axe_netherite': 'netherite_axe',
    'shovel_netherite': 'netherite_shovel',
    'ruby': 'ruby',
    'sapphire': 'sapphire',
    'sword_ruby': 'ruby_sword',
    'pickaxe_ruby': 'ruby_pickaxe',
    'axe_ruby': 'ruby_axe',
    'shovel_ruby': 'ruby_shovel',
    'sword_sapphire': 'sapphire_sword',
    'pickaxe_sapphire': 'sapphire_pickaxe',
    'axe_sapphire': 'sapphire_axe',
    'shovel_sapphire': 'sapphire_shovel',
    'zanite_gem': 'zanite_gem',
    'zanite_gemstone': 'zanite_gem',
    'ambrosium_shard': 'ambrosium_shard',
    'sword_zanite': 'zanite_sword',
    'pickaxe_zanite': 'zanite_pickaxe',
    'axe_zanite': 'zanite_axe',
    'shovel_zanite': 'zanite_shovel',
    'gravitite_ingot': 'gravitite_sword',
    'gravitite_ore': 'gravitite_ore',
    'sword_gravitite': 'gravitite_sword',
    'pickaxe_gravitite': 'gravitite_pickaxe',
    'axe_gravitite': 'gravitite_axe',
    'shovel_gravitite': 'gravitite_shovel',
    'quartz': 'quartz',
    'netherite_scrap': 'netherite_scrap',
    'lapis_lazuli': 'lapis_lazuli',
    'lapis': 'lapis_lazuli',
    'emerald': 'emerald',
    'redstone': 'redstone',
    'bow': 'bow',
    'arrow': 'arrow',
    'golden_apple': 'golden_apple',
    'flint': 'flint',
    'feather': 'feather',
    'string': 'string',
    'sugar': 'sugar',
    'paper': 'paper',
    'book': 'book',
    'wheat': 'wheat',
    'compass': 'compass',
    'clock': 'clock',
    'emerald_block': 'emerald_block',
    'lapis_block': 'lapis_block',
    'redstone_block': 'redstone_block',
    'coal_block': 'coal_block',
    'fletching_table': 'fletching_table_front',
    'smoker': 'smoker_front',
    'stonecutter': 'stonecutter_side',
    'bat_spawn_egg': 'bat_spawn_egg',
    'camel_spawn_egg': 'camel_spawn_egg',
    'chicken_spawn_egg': 'chicken_spawn_egg',
    'cod_spawn_egg': 'cod_spawn_egg',
    'cow_spawn_egg': 'cow_spawn_egg',
    'frog_spawn_egg': 'frog_spawn_egg',
    'iron_golem_spawn_egg': 'iron_golem_spawn_egg',
    'magma_cube_spawn_egg': 'magma_cube_spawn_egg',
    'piglin_brute_spawn_egg': 'piglin_brute_spawn_egg',
    'pig_spawn_egg': 'pig_spawn_egg',
    'salmon_spawn_egg': 'salmon_spawn_egg',
    'sheep_spawn_egg': 'sheep_spawn_egg',
    'skeleton_spawn_egg': 'skeleton_spawn_egg',
    'slime_spawn_egg': 'slime_spawn_egg',
    'spider_spawn_egg': 'spider_spawn_egg',
    'tropical_fish_spawn_egg': 'tropical_fish_spawn_egg',
    'turtle_spawn_egg': 'turtle_spawn_egg',
    'zombie_spawn_egg': 'zombie_spawn_egg',
    'creeper_spawn_egg': 'creeper_spawn_egg',
    'enderman_spawn_egg': 'enderman_spawn_egg',
    'pufferfish_spawn_egg': 'pufferfish_spawn_egg',
    'spawn_egg_bat': 'bat_spawn_egg',
    'spawn_egg_camel': 'camel_spawn_egg',
    'spawn_egg_chicken': 'chicken_spawn_egg',
    'spawn_egg_cod': 'cod_spawn_egg',
    'spawn_egg_cow': 'cow_spawn_egg',
    'spawn_egg_creeper': 'creeper_spawn_egg',
    'spawn_egg_enderman': 'enderman_spawn_egg',
    'spawn_egg_frog': 'frog_spawn_egg',
    'spawn_egg_golem': 'iron_golem_spawn_egg',
    'spawn_egg_lavaslime': 'magma_cube_spawn_egg',
    'spawn_egg_piglin_bruiser': 'piglin_brute_spawn_egg',
    'spawn_egg_pig': 'pig_spawn_egg',
    'spawn_egg_pufferfish': 'pufferfish_spawn_egg',
    'spawn_egg_salmon': 'salmon_spawn_egg',
    'spawn_egg_sheep': 'sheep_spawn_egg',
    'spawn_egg_skeleton': 'skeleton_spawn_egg',
    'spawn_egg_slime': 'slime_spawn_egg',
    'spawn_egg_spider': 'spider_spawn_egg',
    'spawn_egg_tropical_fish': 'tropical_fish_spawn_egg',
    'spawn_egg_turtle': 'turtle_spawn_egg',
    'spawn_egg_zombie': 'zombie_spawn_egg'
};

const SPAWN_EGG_COLORS = {
    'cow':             { c: '#443626', d: '#2b2116', h: '#5e4c36', e: '#a1a1a1' },
    'pig':             { c: '#f0a5a2', d: '#db7d78', h: '#f7c3c1', e: '#db7d78' },
    'sheep':           { c: '#e7e7e7', d: '#bababa', h: '#ffffff', e: '#ffb5b5' },
    'chicken':         { c: '#a1a1a1', d: '#707070', h: '#c8c8c8', e: '#ff0000' },
    'zombie':          { c: '#00afaf', d: '#007070', h: '#00dfdf', e: '#799c65' },
    'skeleton':        { c: '#c1c1c1', d: '#919191', h: '#dedede', e: '#494949' },
    'creeper':         { c: '#0da70b', d: '#076106', h: '#12d60e', e: '#000000' },
    'enderman':        { c: '#161616', d: '#0a0a0a', h: '#2a2a2a', e: '#cc00ff' },
    'spider':          { c: '#342d27', d: '#1f1a16', h: '#4b4138', e: '#a80e0e' },
    'slime':           { c: '#51a03e', d: '#38732a', h: '#70cf57', e: '#7eb75b' },
    'lavaslime':       { c: '#340000', d: '#1c0000', h: '#540000', e: '#fcfc00' },
    'magma_cube':      { c: '#340000', d: '#1c0000', h: '#540000', e: '#fcfc00' },
    'bat':             { c: '#4c3e30', d: '#2e251b', h: '#6a5743', e: '#0f0f0f' },
    'piglin_bruiser':  { c: '#995f40', d: '#6b3f27', h: '#bf7952', e: '#ffd83d' },
    'piglin_brute':    { c: '#995f40', d: '#6b3f27', h: '#bf7952', e: '#ffd83d' },
    'golem':           { c: '#d0c8b0', d: '#9a9482', h: '#ece6d0', e: '#5e8238' },
    'iron_golem':      { c: '#d0c8b0', d: '#9a9482', h: '#ece6d0', e: '#5e8238' },
    'turtle':          { c: '#e7e7e7', d: '#a3a3a3', h: '#ffffff', e: '#00afaf' },
    'frog':            { c: '#597d36', d: '#38521f', h: '#78a649', e: '#9bb869' },
    'camel':           { c: '#c4975a', d: '#876435', h: '#dfb57b', e: '#6b4d24' },
    'cod':             { c: '#c1a176', d: '#876e4c', h: '#dec39e', e: '#e5cbb0' },
    'salmon':          { c: '#8f2525', d: '#5e1717', h: '#b83b3b', e: '#0e4435' },
    'tropical_fish':   { c: '#ef6915', d: '#ab4609', h: '#ff8a42', e: '#ffffff' },
    'pufferfish':      { c: '#e8a93a', d: '#a87720', h: '#ffc766', e: '#337ab7' }
};

// Global cache: subtype -> canvas / data URL
const _itemTextureCache = new Map();
const _itemCanvasCache = new Map();

export function generateItemTexture(itemType, itemSubtype, onLoaded) {
    const TEX_SIZE = 16;
    const canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // If already cached in memory, draw immediately and return synchronously
    if (_itemCanvasCache.has(itemSubtype)) {
        ctx.drawImage(_itemCanvasCache.get(itemSubtype), 0, 0);
        return canvas;
    }

    // Clear transparent
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);

    const useMC = true;
    if (useMC) {
        const mcKey = (itemType === 'spawn_egg') 
            ? (MC_ITEM_MAP['spawn_egg_' + itemSubtype] || MC_ITEM_MAP[itemSubtype + '_spawn_egg'] || MC_ITEM_MAP[itemSubtype])
            : MC_ITEM_MAP[itemSubtype];
        const mcName = mcKey;
        if (mcName) {
            loadMinecraftTexture(mcName).then(img => {
                if (img) {
                    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                    ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                    const savedCvs = document.createElement('canvas');
                    savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
                    savedCvs.getContext('2d').drawImage(canvas, 0, 0);
                    _itemCanvasCache.set(itemSubtype, savedCvs);
                    _itemTextureCache.set(itemSubtype, canvas.toDataURL());
                    if (onLoaded) onLoaded(canvas);
                }
            });
        }
    }


    const palettes = {
        'wood': { c: '#8d6e63', d: '#5d4037', h: '#a1887f' },
        'stone': { c: '#9e9e9e', d: '#616161', h: '#e0e0e0' },
        'iron_ingot': { c: '#e0e0e0', d: '#9e9e9e', h: '#ffffff' },
        'gold_ingot': { c: '#fbc02d', d: '#f57f17', h: '#fff176' },
        'diamond': { c: '#00bcd4', d: '#00838f', h: '#84ffff' },
        'coal': { c: '#212121', d: '#000000', h: '#424242' },
        'mana_crystal': { c: '#03a9f4', d: '#01579b', h: '#b3e5fc' },
        'boss': { c: '#aa00ff', d: '#5500aa', h: '#d580ff' },
        'stick': { c: '#795548', d: '#4e342e', h: '#a1887f' },
        'ruby': { c: '#d32f2f', d: '#8b0000', h: '#ff6666' },
        'sapphire': { c: '#1976d2', d: '#0d47a1', h: '#64b5f6' },
        'zanite': { c: '#ab47bc', d: '#6a1b9a', h: '#ea80fc' },
        'gravitite': { c: '#f06292', d: '#ad1457', h: '#ff80ab' },
        'netherite': { c: '#3e383c', d: '#221e21', h: '#5e565c' },
        'amber': { c: '#ffb300', d: '#ff8f00', h: '#ffe082' },
        'ambrosium': { c: '#fff176', d: '#fbc02d', h: '#ffffff' },
        'wand_basic': { c: '#795548', d: '#4e342e', g: '#e0e0e0' },
        'wand_fire': { c: '#795548', d: '#4e342e', g: '#ff3d00' },
        'wand_ice': { c: '#795548', d: '#4e342e', g: '#00b0ff' },
        'wand_nature': { c: '#795548', d: '#4e342e', g: '#00e676' },
        'spell_fire': { c: '#ff3d00', d: '#dd2c00', h: '#ff9e80' },
        'spell_ice': { c: '#00b0ff', d: '#0091ea', h: '#80d8ff' },
        'spell_nature': { c: '#00e676', d: '#00c853', h: '#b9f6ca' },
        'spell_basic': { c: '#e0e0e0', d: '#9e9e9e', h: '#ffffff' },
        'spell_earth': { c: '#8B4513', d: '#5D2906', h: '#C4A882' },
        'spell_thunder': { c: '#FFD700', d: '#CC8800', h: '#FFFF88' },
        'spell_dark': { c: '#6600CC', d: '#440088', h: '#AA66FF' },
        'spell_wind': { c: '#66CC99', d: '#339966', h: '#CCFFEE' },
        'spell_poison': { c: '#33cc33', d: '#1f7a1f', h: '#80ff80' },
        'spell_frost': { c: '#00FFFF', d: '#008888', h: '#88FFFF' },
        'spell_light': { c: '#FFFFAA', d: '#CCCC55', h: '#FFFFFF' },
        'spell_void': { c: '#8800CC', d: '#440066', h: '#CC66FF' },
        'spell_lava': { c: '#CC3300', d: '#991100', h: '#FF6600' },
        'spell_builder': { c: '#AAAAAA', d: '#777777', h: '#CCCCCC' },
        'raw_porkchop': { c: '#ffaeb9', d: '#cd8c95', h: '#ffc0cb' },
        'cooked_porkchop': { c: '#8b4513', d: '#5c2e00', h: '#a0522d' },
        'raw_beef': { c: '#cd3333', d: '#8b2323', h: '#ee3b3b' },
        'cooked_beef': { c: '#5c2e00', d: '#3e1f00', h: '#8b4513' },
        'raw_chicken': { c: '#ffe4e1', d: '#cdb7b5', h: '#fff0f5' },
        'cooked_chicken': { c: '#cd853f', d: '#8b5a2b', h: '#d2b48c' },
        'raw_mutton': { c: '#c85a5a', d: '#8b3a3a', h: '#e07a7a' },
        'cooked_mutton': { c: '#7a3e1d', d: '#4e250f', h: '#9e5227' },
        'raw_fish': { c: '#98c4d6', d: '#609cb5', h: '#bfe3f2' },
        'cooked_fish': { c: '#d2b48c', d: '#a08560', h: '#e6ccab' },
        'lizard_tail': { c: '#3cb371', d: '#2e8b57', h: '#48d1cc' },
        'turtle_scute': { c: '#228b22', d: '#006400', h: '#32cd32' },
        'shark_tooth': { c: '#ffffff', d: '#d3d3d3', h: '#f5f5f5' },
        'lavaslime_ball': { c: '#ff4500', d: '#8b0000', h: '#ff6347' },
        'nether_scrap': { c: '#4b0082', d: '#2a0052', h: '#6a0dad' },
        'feather': { c: '#f8f8ff', d: '#dcdcdc', h: '#ffffff' },
        'bucket': { c: '#C0C0C0', d: '#808080', h: '#E8E8E8' },
        'water_bucket': { c: '#C0C0C0', d: '#808080', h: '#E8E8E8', l: '#3366CC', w: '#66AAFF' },
        'lava_bucket': { c: '#C0C0C0', d: '#808080', h: '#E8E8E8', l: '#CC3300', w: '#FF6600' },
        'emerald': { c: '#17b045', d: '#0e702c', h: '#55f085' },
        'redstone': { c: '#cc1111', d: '#880000', h: '#ff5555' },
        'lapis_lazuli': { c: '#19429e', d: '#0e265c', h: '#3e6ce6' },
        'flint': { c: '#444444', d: '#222222', h: '#666666' },
        'string': { c: '#f5f5f5', d: '#cccccc', h: '#ffffff' },
        'wheat': { c: '#e6c640', d: '#a6871c', h: '#fff385' },
        'arrow': { c: '#ffffff', d: '#999999', h: '#f5f5f5', b: '#444444' },
        'bow': { c: '#8d6e63', d: '#5d4037', h: '#ffffff' },
        'compass': { c: '#888888', d: '#555555', h: '#cccccc', b: '#ff2222' },
        'clock': { c: '#3366cc', d: '#cc9900', h: '#ffee44', b: '#222222' },
        'golden_apple': { c: '#ffcc00', d: '#c69200', h: '#fff480' }
    };

    // Helper to determine material tier from subtype
    let matName = 'iron_ingot';
    if (itemSubtype.includes('wood')) matName = 'wood';
    else if (itemSubtype.includes('stone') || itemSubtype.includes('cobble')) matName = 'stone';
    else if (itemSubtype.includes('gold')) matName = 'gold_ingot';
    else if (itemSubtype.includes('diamond')) matName = 'diamond';
    else if (itemSubtype.includes('ruby')) matName = 'ruby';
    else if (itemSubtype.includes('sapphire')) matName = 'sapphire';
    else if (itemSubtype.includes('zanite')) matName = 'zanite';
    else if (itemSubtype.includes('gravitite')) matName = 'gravitite';
    else if (itemSubtype.includes('netherite')) matName = 'netherite';
    else if (itemSubtype.includes('amber')) matName = 'amber';
    else if (itemSubtype.includes('ambrosium')) matName = 'ambrosium';
    else if (itemSubtype.includes('iron')) matName = 'iron_ingot';
    else if (itemSubtype.includes('boss')) matName = 'boss';

    let p = palettes[matName] || palettes['iron_ingot'];
    
    // Override palette for specific material items
    // Override palette for specific material items
    if (itemType === 'material' || itemType === 'food') {
        p = palettes[itemSubtype] || p;
    } else if (itemType === 'wand') {
        p = palettes[itemSubtype] || palettes['wand_basic'];
    } else if (itemType === 'spawn_egg' || itemSubtype.includes('spawn_egg')) {
        const cleanSub = itemSubtype.replace(/^spawn_egg_/, '').replace(/_spawn_egg$/, '').toLowerCase();
        p = SPAWN_EGG_COLORS[cleanSub] || { c: '#888888', d: '#555555', h: '#aaaaaa', e: '#ffffff' };
    }
    // Fallback if p is somehow undefined
    if (!p) p = palettes['iron_ingot'];

    const drawGrid = (grid) => {
        for (let y = 0; y < grid.length; y++) {
            const row = grid[y];
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char === ' ') continue;
                if (char === 'C') ctx.fillStyle = p.c; // core
                else if (char === 'D') ctx.fillStyle = p.d; // dark
                else if (char === 'H') ctx.fillStyle = p.h || p.c; // highlight
                else if (char === 'S') ctx.fillStyle = palettes.stick.c; // stick
                else if (char === 'T') ctx.fillStyle = palettes.stick.d; // stick dark
                else if (char === 'G') ctx.fillStyle = p.g || p.h || p.c; // glow/gem
                else if (char === 'B') ctx.fillStyle = '#000000'; // black border
                else if (char === 'O') ctx.fillStyle = '#222222'; // outline
                else if (char === 'L') ctx.fillStyle = p.l || '#3366CC'; // liquid dark
                else if (char === 'W') ctx.fillStyle = p.w || '#66AAFF'; // liquid light
                else if (char === 'A') ctx.fillStyle = '#111111'; // accent/dark shade
                else if (char === 'E') ctx.fillStyle = p.e || '#ffffff'; // egg spot
                else continue;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    };

    let shape = [];

    if (itemType === 'equipment') {
        if (itemSubtype.includes('sword')) {
            shape = [
                "            OBO ",
                "           OBHBO",
                "          OBHCBO",
                "         OBHCBO ",
                "        OBHCBO  ",
                "       OBHCBO   ",
                "      OBHCBO    ",
                "     OBHCBO     ",
                "  OOOBHCBO      ",
                " OSSDDCBO       ",
                "OSSSSDOO        ",
                "OSSSDSO         ",
                " OODOO          ",
                " OOO            ",
                "                ",
                "                "
            ];
        } else if (itemSubtype === 'flint_and_steel') {
            shape = [
                "                ",
                "       OOOOO    ",
                "      OHHCCD    ",
                "     OHD  CD    ",
                "    OHD   CD    ",
                "   OHD    CD    ",
                "   OD    CD     ",
                "        CCO     ",
                "  OO   CCO      ",
                " OGBO CCO       ",
                " OGBBCOO        ",
                "  OGBBO         ",
                "   OOO          ",
                "                ",
                "                ",
                "                "
            ];
            // Override palette colors manually for flint and steel
            ctx.fillStyle = '#666'; // For steel C
            ctx.fillStyle = '#444'; // For steel D
            ctx.fillStyle = '#333'; // For flint G
            ctx.fillStyle = '#222'; // For flint B
            // Just use the parser with a custom palette override
            const fsPalette = { c: '#999', d: '#555', h: '#ccc', g: '#333', b: '#222' };
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const char = shape[y][x];
                    if (char === 'C') ctx.fillStyle = fsPalette.c;
                    else if (char === 'D') ctx.fillStyle = fsPalette.d;
                    else if (char === 'H') ctx.fillStyle = fsPalette.h;
                    else if (char === 'G') ctx.fillStyle = fsPalette.g;
                    else if (char === 'B') ctx.fillStyle = fsPalette.b;
                    else if (char === 'O') ctx.fillStyle = '#000000';
                    else continue;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            return canvas;
        } else if (itemSubtype.includes('pickaxe')) {
            shape = [
                "      OOOOOO    ",
                "    OOOBHHHDOO  ",
                "  OOBHCBCCCCDDO ",
                "  OBCBOOOOOSSDO ",
                "  ODO     OSSO  ",
                "  OO      OSSO  ",
                "         OSSO   ",
                "         OSSO   ",
                "        OSSO    ",
                "        OSSO    ",
                "       OSSO     ",
                "       OSSO     ",
                "      OSSO      ",
                "      OSSO      ",
                "       OO       ",
                "                "
            ];
        } else if (itemSubtype.includes('axe')) {
            shape = [
                "     OOOO       ",
                "    OBHHDO      ",
                "   OBHCCDDO     ",
                "   OBCCOSDO     ",
                "   OBCOSSO      ",
                "   ODOSSO       ",
                "   OOSSO        ",
                "    OSSO        ",
                "    OSSO        ",
                "   OSSO         ",
                "   OSSO         ",
                "  OSSO          ",
                "  OSSO          ",
                "   OO           ",
                "                ",
                "                "
            ];
        } else if (itemSubtype.includes('shovel')) {
            shape = [
                "            OO  ",
                "           OHHDO",
                "          OHCCDO",
                "          ODDDO ",
                "         OSSO   ",
                "        OSSO    ",
                "       OSSO     ",
                "      OSSO      ",
                "     OSSO       ",
                "    OSSO        ",
                "   OSSO         ",
                "  OSSO          ",
                " OSSO           ",
                " OSO            ",
                "  O             ",
                "                "
            ];
        } else if (itemSubtype.includes('head')) {
            shape = [
                "                ",
                "   OOOOOOOOOO   ",
                "  OOHHHHHHHHDO  ",
                "  OHCCCCCCCCDO  ",
                " OHCCOOOOAOCDDO ",
                " OHCO     AOCDO ",
                " OHD       ADOO ",
                " OHO       AOO  ",
                " OOO       AA   ",
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                "                "
            ];
        } else if (itemSubtype.includes('chest')) {
            shape = [
                "   OO      OO   ",
                "  OHDO    OHDO  ",
                " OHCCOOOOOCCCDO ",
                " OHCCHHHHHHCDDO ",
                " OHCCCCCCCCCDDO ",
                " OHCCOOOOAOCDDO ",
                " OHD      AODDO ",
                " OHO OOOOAO ODO ",
                " OOO OHCCDO OOO ",
                "     OHCCDO     ",
                "     OHCCDO     ",
                "     ODDDDO     ",
                "      OOOO      ",
                "                ",
                "                ",
                "                "
            ];
        } else if (itemSubtype.includes('legs')) {
            shape = [
                "                ",
                "  OOOOOOOOOOOO  ",
                " OOHHHHHHHHHHDO ",
                " OHCCCCCCCCCDDO ",
                " OHCCCCCCCCCDDO ",
                " OHCCCCDDCCCCDO ",
                " OHCDDOAOHCCDDO ",
                " OHDO  AO ODCDO ",
                " OHO   AO  ODOO ",
                " OHO   AO  ODOO ",
                " OHO   AO  ODOO ",
                " OHO   AO  ODOO ",
                " OHO   AO  ODOO ",
                " OOO   AO  OOOO ",
                "                ",
                "                "
            ];
        } else if (itemSubtype.includes('boots')) {
            shape = [
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                " OOOO      OOOO ",
                " OHCO      OHCO ",
                " OHDO      OHDO ",
                " OHDO      OHDO ",
                " OHDO      OHDO ",
                " OHCDOOOO OHCDDO",
                " ODDDDDDO ODDDDD",
                " OOOOOOOO OOOOOO",
                "                "
            ];
        } else if (itemSubtype === 'bow') {
            shape = [
                "       OOOO     ",
                "     OOH  DO    ",
                "    OHD   DO    ",
                "   OHD    DO    ",
                "  OHD     DO    ",
                "  OD      DO    ",
                "  OD      DO    ",
                "  OD      DO    ",
                "  OD      DO    ",
                "  OD      DO    ",
                "  OHD     DO    ",
                "   OHD    DO    ",
                "    OHD   DO    ",
                "     OOH  DO    ",
                "       OOOO     ",
                "                "
            ];
            p = palettes['bow'];
        }
    } else if (itemType === 'material') {
        if (itemSubtype === 'book') {
            shape = [
                "                ",
                "     OOOOOOO    ",
                "    OBBDDDDBO   ",
                "   OBBBDDDDBBO  ",
                "   OBDHDDDBBBO  ",
                "   OBDDDDDBBBO  ",
                "   OBDHDDDBBBO  ",
                "   OBDDDDDBBBO  ",
                "   OBDHDDDBBBO  ",
                "   OBDDDDDBBBO  ",
                "   OBDHDDDBBBO  ",
                "   OBDDDDDBBBO  ",
                "    OBBDDDDBO   ",
                "     OOOOOOO    ",
                "                ",
                "                "
            ];
            p = { c: '#8d6e63', d: '#5d4037', h: '#d7ccc8', g: '#ffffff', b: '#ff0000' };
        } else if (itemSubtype === 'sugar') {
            shape = [
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                "       O O      ",
                "      OCCOO     ",
                "     OCCCCO     ",
                "     OCCCCO     ",
                "     OCCCCO     ",
                "     OCCCCO     ",
                "      OOOO      ",
                "                ",
                "                ",
                "                "
            ];
            p = { c: '#ffffff', d: '#e0e0e0', h: '#ffffff' };
        } else if (itemSubtype === 'paper') {
            shape = [
                "                ",
                "                ",
                "    OOOOOOOO    ",
                "   ODCCCCCDO    ",
                "  ODCCCCCCDO    ",
                "  ODCCCCCCDO    ",
                "  ODCCCCCCDO    ",
                "  ODCCCCCCDO    ",
                "  ODCCCCCCDO    ",
                "  ODCCCCCCDO    ",
                "  ODCCCCCCDO    ",
                "  ODCCCCCCDO    ",
                "   ODCCCCCDO    ",
                "    OOOOOOOO    ",
                "                ",
                "                "
            ];
            p = { c: '#ffffff', d: '#e0e0e0', h: '#ffffff' };
        } else if (itemSubtype === 'coal' || itemSubtype === 'diamond' || itemSubtype === 'mana_crystal' || itemSubtype === 'ruby' || itemSubtype === 'sapphire' || itemSubtype === 'zanite_gem' || itemSubtype === 'zanite_gemstone' || itemSubtype === 'ambrosium_shard' || itemSubtype === 'quartz' || itemSubtype === 'netherite_scrap' || itemSubtype === 'emerald' || itemSubtype === 'lapis_lazuli' || itemSubtype === 'lapis') {
            shape = [
                "                ",
                "      OOOO      ",
                "    OOOHHDOO    ",
                "   OOHHCHCDDO   ",
                "  OOHCCHCCCDDO  ",
                "  OHCBBBBBCDDO  ",
                " OHCBBBBBBCDDOO ",
                " OHCBBBBBBCDDDO ",
                " OHCBBBBBBCDDDO ",
                " OOHCBBBBCDDDOO ",
                "  OOHCCCCCDDDO  ",
                "   OOHCCCDDDO   ",
                "    OOODDDOO    ",
                "      OOOO      ",
                "                ",
                "                "
            ];
        } else if (itemSubtype === 'arrow') {
            shape = [
                "             OO ",
                "            OBO ",
                "           OBDO ",
                "          OBDO  ",
                "         OSDO   ",
                "        OSDO    ",
                "       OSDO     ",
                "      OSDO      ",
                "     OSDO       ",
                "    OSDO        ",
                "  OOODO         ",
                " OHHDO          ",
                " OHDDO          ",
                " ODO            ",
                "                ",
                "                "
            ];
            p = palettes['arrow'];
        } else if (itemSubtype === 'compass') {
            shape = [
                "      OOOO      ",
                "    OOHHHHOO    ",
                "   OOHDDDDHOO   ",
                "  OHD  DB  DHO  ",
                "  OHD  DB  DHO  ",
                " OHD  BBBB  DHO ",
                " OHD   DB   DHO ",
                " OHD  BBD   DHO ",
                "  OHD  DD  DHO  ",
                "  OHD      DHO  ",
                "   OOHDDDDHOO   ",
                "    OOHHHHOO    ",
                "      OOOO      ",
                "                ",
                "                ",
                "                "
            ];
            p = palettes['compass'];
        } else if (itemSubtype === 'clock') {
            shape = [
                "      OOOO      ",
                "    OOHHHHOO    ",
                "   OOHDDDDHOO   ",
                "  OHD  CB  DHO  ",
                "  OHD  CB  DHO  ",
                " OHD  CBBC  DHO ",
                " OHD   CB   DHO ",
                " OHD  CCCB  DHO ",
                "  OHD  CC  DHO  ",
                "  OHD      DHO  ",
                "   OOHDDDDHOO   ",
                "    OOHHHHOO    ",
                "      OOOO      ",
                "                ",
                "                ",
                "                "
            ];
            p = palettes['clock'];
        } else if (itemSubtype === 'wheat') {
            shape = [
                "            OO  ",
                "           OHDO ",
                "          OHCDO ",
                "         OHCDO  ",
                "        OHCDO   ",
                "       OHCDO    ",
                "      OHCDO     ",
                "     OHCDO      ",
                "    OHCDO       ",
                "   OSCDO        ",
                "  OSDO          ",
                " OSDO           ",
                " OSO            ",
                "  O             ",
                "                ",
                "                "
            ];
            p = palettes['wheat'];
        } else if (itemSubtype === 'string') {
            shape = [
                "                ",
                "      OO        ",
                "     OHDO       ",
                "    OHCDO       ",
                "   OHCDO        ",
                "   OHCDO        ",
                "    OHCDO       ",
                "     OHCDO      ",
                "      OHCDO     ",
                "       OHCDO    ",
                "       OHCDO    ",
                "      OHCDO     ",
                "     OHDO       ",
                "     OO         ",
                "                ",
                "                "
            ];
            p = palettes['string'];
        } else if (itemSubtype === 'flint') {
            shape = [
                "                ",
                "       OO       ",
                "      OHDO      ",
                "     OHCDO      ",
                "    OHCCCDO     ",
                "   OHCCCCDDO    ",
                "   OHCCCCCDO    ",
                "  OHCCCCCCDDO   ",
                "  OHDDDDDDDO    ",
                "   OOOOOOOO     ",
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                "                "
            ];
            p = palettes['flint'];
        } else if (itemSubtype === 'redstone') {
            shape = [
                "                ",
                "                ",
                "                ",
                "       OO       ",
                "     OOHHOO     ",
                "    OOHCCHDO    ",
                "   OOHCCCCDDO   ",
                "   OHCCCCCCDO   ",
                "   OHCCCCCCDO   ",
                "    OHDDDDDDO   ",
                "     OODDDOO    ",
                "       OO       ",
                "                ",
                "                ",
                "                ",
                "                "
            ];
            p = palettes['redstone'];
        } else if (itemSubtype === 'iron_ingot' || itemSubtype === 'gold_ingot' || itemSubtype === 'netherite_ingot' || itemSubtype === 'gravitite_ingot' || itemSubtype === 'gravitite_ore') {
            shape = [
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                "      OOOOOO    ",
                "    OOOHHHHDOO  ",
                "   OOHCCCCCCDDO ",
                "  OOHCCCCCCCCDDO",
                " OOHCCCCCCCCCDDO",
                " OODDDDDDDDDDDDO",
                "  OOOOOOOOOOOOO ",
                "                ",
                "                ",
                "                ",
                "                "
            ];
        } else if (itemSubtype === 'sugar') {
            shape = [
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                "                ",
                "     OOOO       ",
                "    OHHHOO      ",
                "   OHHHHHHO     ",
                "   OHCHCHCO     ",
                "   OHC CHCO     ",
                "    OHHHHO      ",
                "     OOOO       ",
                "                ",
                "                ",
                "                "
            ];
            p = { c: '#fff', d: '#ddd', h: '#fff' };
        } else if (itemSubtype === 'paper') {
            shape = [
                "                ",
                "                ",
                "   OOOOOOOO     ",
                "  OHHHHHHHO     ",
                "  OHCCCCCCO     ",
                "  OHCDDDDDO     ",
                "  OHCCCCCCO     ",
                "  OHCDDDDDO     ",
                "  OHCCCCCCO     ",
                "  OHCDDDDDO     ",
                "  OHCCCCCCO     ",
                "  OHHHHHHHO     ",
                "   OOOOOOOO     ",
                "                ",
                "                ",
                "                "
            ];
            p = { c: '#f5f5dc', d: '#e6e6fa', h: '#fff' };
        } else if (itemSubtype === 'sugarcane') {
            shape = [
                "                ",
                "      OOOO      ",
                "     OHHHO      ",
                "     OHCHO      ",
                "     ODDDO      ",
                "     OHHHO      ",
                "     OHCHO      ",
                "     ODDDO      ",
                "     OHHHO      ",
                "     OHCHO      ",
                "     ODDDO      ",
                "     OHHHO      ",
                "     OHCHO      ",
                "      OOOO      ",
                "                ",
                "                "
            ];
            p = { c: '#5a963c', d: '#3c6e28', h: '#78b450' };
        } else if (itemSubtype === 'stick') {
            shape = [
                "            OO  ",
                "           OHO  ",
                "          OHDO  ",
                "         OHDO   ",
                "        OHDO    ",
                "       OHDO     ",
                "      OHDO      ",
                "     OHDO       ",
                "    OHDO        ",
                "   OHDO         ",
                "  OHDO          ",
                "  ODO           ",
                "  OO            ",
                "                ",
                "                ",
                "                "
            ];
        } else if (itemSubtype === 'bucket') {
            shape = [
                "                ",
                "                ",
                "                ",
                "                ",
                "   HHHHHHHHHH   ",
                "  HCHCHCHCHCHC  ",
                "  CDCDCDCDCDCD  ",
                "  HCHCHCHCHCHC  ",
                "   CDCDCDCDCD   ",
                "   HCHCHCHCHC   ",
                "    CDCDCDCD    ",
                "    HCHCHCHC    ",
                "     CDCDCD     ",
                "     HCHCHC     ",
                "      DDDD      ",
                "                "
            ];
            p = palettes['bucket'];
        } else if (itemSubtype === 'water_bucket') {
            shape = [
                "                ",
                "                ",
                "                ",
                "                ",
                "   HHHHHHHHHH   ",
                "  HLWLWLWLWLWC  ",
                "  CWWLWLWLWLWD  ",
                "  HLWLWLWLWLWC  ",
                "   CWWLWLWLWD   ",
                "   HLWLWLWLWC   ",
                "    CWWLWLWD    ",
                "    HLWLWLWC    ",
                "     CWWLWD     ",
                "     HLWLWC     ",
                "      DDDD      ",
                "                "
            ];
            p = palettes['water_bucket'];
        } else if (itemSubtype === 'lava_bucket') {
            shape = [
                "                ",
                "                ",
                "                ",
                "                ",
                "   HHHHHHHHHH   ",
                "  HLWLWLWLWLWC  ",
                "  CWWLWLWLWLWD  ",
                "  HLWLWLWLWLWC  ",
                "   CWWLWLWLWD   ",
                "   HLWLWLWLWC   ",
                "    CWWLWLWD    ",
                "    HLWLWLWC    ",
                "     CWWLWD     ",
                "     HLWLWC     ",
                "      DDDD      ",
                "                "
            ];
            p = palettes['lava_bucket'];

        } else if (itemSubtype === 'lavaslime_ball' || itemSubtype === 'nether_scrap' || itemSubtype === 'turtle_scute') {
            shape = [
                "                ",
                "                ",
                "                ",
                "     OOOOOO     ",
                "   OOOHHHHDOO   ",
                "  OOHCCHHHCDDO  ",
                "  OHCCCCCHCCDO  ",
                " OOHCCCCCCCDDDO ",
                " OHCCCCCCCCCDDO ",
                " OHCCCCDDCCCDDO ",
                " OOHCCDDDDDCDDO ",
                "  OHDDDDDDDDDO  ",
                "  OODDDDDDDDOO  ",
                "   OOOOOOOOOO   ",
                "                ",
                "                "
            ];
        } else if (itemSubtype === 'shark_tooth' || itemSubtype === 'lizard_tail') {
            shape = [
                "                ",
                "       OO       ",
                "      OHDO      ",
                "     OHCCDO     ",
                "    OHCCCCDO    ",
                "    OHCCCCDO    ",
                "   OHCCCCCCDO   ",
                "   OHCCCCCCDO   ",
                "  OHCCCCCCCCDO  ",
                "  OHCDDDDDCCDO  ",
                " OHCDO    ODCDO ",
                " OHO        ODO ",
                " OO          OO ",
                "                ",
                "                ",
                "                "
            ];
        } else if (itemSubtype === 'feather') {
            shape = [
                "                ",
                "             OO ",
                "            OHDO",
                "           OHCDO",
                "          OHC DO",
                "   O     OHCD O ",
                "  OHO   OHCD O  ",
                "  OHCO OHCD O   ",
                "  OHCDOHCD O    ",
                "   OHDCCD O     ",
                "    ODCD O      ",
                "     ODOO       ",
                "     OO         ",
                "                ",
                "                ",
                "                "
            ];
        }
    } else if (itemType === 'wand') {
        shape = [
            "            OO  ",
            "           OGGO ",
            "          OGGGO ",
            "         OHGGO  ",
            "        OHDO    ",
            "       OHDO     ",
            "      OHDO      ",
            "     OHDO       ",
            "    OHDO        ",
            "   OHDO         ",
            "  OHDO          ",
            "  ODO           ",
            "  OO            ",
            "                ",
            "                ",
            "                "
        ];
    } else if (itemType === 'food') {
            p = palettes[itemSubtype] || palettes['raw_porkchop'];
            if (itemSubtype.includes('chicken')) {
                shape = [
                    "                ",
                    "                ",
                    "                ",
                    "      OOOO      ",
                    "     OHCHDO     ",
                    "    OHCCCCDO    ",
                    "    OHCCCCDO    ",
                    "   OHCCCCCCDO   ",
                    "  OHCCCCCCCCDO  ",
                    "  OHCCCCDDCCDO  ",
                    "   OHCCDOODDO   ",
                    "    ODO OHO     ",
                    "    OO  OHO     ",
                    "        OOO     ",
                    "                ",
                    "                "
                ];
            } else if (itemSubtype.includes('fish')) {
                shape = [
                    "                ",
                    "                ",
                    "                ",
                    "        OOOO    ",
                    "      OOHHCDO   ",
                    "   OOOHHCCCDDO  ",
                    "  OHHHHHCCCCDDO ",
                    "  OHHHHCCCCCCDO ",
                    " OHHHCCCCCCCDDO ",
                    "  OHHHHCCCCCCDO ",
                    "  OHHHHHCCCCDDO ",
                    "   OOODDDDDDOO  ",
                    "      OOOOOO    ",
                    "                ",
                    "                ",
                    "                "
                ];
            } else if (itemSubtype.includes('beef')) {
                shape = [
                    "                ",
                    "                ",
                    "    OOOOOOO     ",
                    "   OHHHHCHDO    ",
                    "  OHHHHHHCHDOO  ",
                    "  OHHHCCCCHCDO  ",
                    "  OHHCCCCCCCDO  ",
                    "  OHHCCCCCCCDO  ",
                    "  OHHCCCCCCCDO  ",
                    "  OHCCCCCCCDDO  ",
                    "   OHDDDDDDDDO  ",
                    "    OOOOOOOOO   ",
                    "                ",
                    "                ",
                    "                ",
                    "                "
                ];
            } else if (itemSubtype === 'golden_apple') {
                shape = [
                    "                ",
                    "       OO       ",
                    "      OSSO      ",
                    "     OSSO       ",
                    "   OOHH  HHOO   ",
                    "  OHHHCCCCCDDO  ",
                    " OHHHCCCCCCCDDO ",
                    " OHHHCCCCCCCDDO ",
                    " OHHHCCCCCCCDDO ",
                    "  OHHCCCCCCCDO  ",
                    "  OHDCCCCCCDDO  ",
                    "   OHDCCCCDDO   ",
                    "    OODDDDOO    ",
                    "      OOOO      ",
                    "                ",
                    "                "
                ];
                p = palettes['golden_apple'];
            } else {
                shape = [
                    "                ",
                    "                ",
                    "     OOOOO      ",
                    "   OOCHHDOO     ",
                    "  OCHHHHCDOO    ",
                    "  OHHHHHCCDOO   ",
                    "  OHHHHCCCCDO   ",
                    "  OHHHCCCCCDO   ",
                    "   OHCCCCCDO    ",
                    "    ODDDDOO     ",
                    "      OOO       ",
                    "                ",
                    "                ",
                    "                ",
                    "                ",
                    "                "
                ];
            }
        } else if (itemType === 'spell') {
        let sc = 'spell_basic';
        if (itemSubtype === 'FIRE') sc = 'spell_fire';
        if (itemSubtype === 'ICE') sc = 'spell_ice';
        if (itemSubtype === 'HEAL') sc = 'spell_nature';
        if (itemSubtype === 'EARTH') sc = 'spell_earth';
        if (itemSubtype === 'THUNDER') sc = 'spell_thunder';
        if (itemSubtype === 'DARK') sc = 'spell_dark';
        if (itemSubtype === 'WIND') sc = 'spell_wind';
        if (itemSubtype === 'POISON') sc = 'spell_poison';
        if (itemSubtype === 'FROST') sc = 'spell_frost';
        if (itemSubtype === 'LIGHT') sc = 'spell_light';
        if (itemSubtype === 'VOID') sc = 'spell_void';
        if (itemSubtype === 'LAVA') sc = 'spell_lava';
        if (itemSubtype === 'BUILDER') sc = 'spell_builder';
        p = palettes[sc];
        shape = [
            "                ",
            "      OOOO      ",
            "    OOCHHDOO    ",
            "   OCHHHHCDDO   ",
            "  OCHHHHCCCCDO  ",
            "  OHHHCCCCCCDO  ",
            " OHHHCCCCCCCCDO ",
            " OHHCCCCCCCCCDO ",
            " OHHCCCCCCCCCDO ",
            " OHCCCCCCCCCCDO ",
            "  OCCCCCCCCDDO  ",
            "  OCDDDDDDDCDO  ",
            "   OODDDDDDOO   ",
            "    OOOOOOOO    ",
            "                ",
            "                "
        ];
    } else if (itemType === 'modifier') {
        p = palettes['spell_basic']; // Fallback
        if (itemSubtype === 'DAMAGE_UP') p = { c: '#ff5555', d: '#aa0000', h: '#ffaaaa' };
        else if (itemSubtype === 'SPEED_UP') p = { c: '#55ffff', d: '#00aaaa', h: '#aaffff' };
        else if (itemSubtype === 'MANA_EFF') p = { c: '#ff55ff', d: '#aa00aa', h: '#ffaaff' };
        else if (itemSubtype === 'PIERCE') p = { c: '#55ff55', d: '#00aa00', h: '#aaffaa' };
        else if (itemSubtype === 'HOMING') p = { c: '#ffff55', d: '#aaaa00', h: '#ffffaa' };
        else if (itemSubtype === 'BURN') p = palettes['spell_fire'];
        else if (itemSubtype === 'MULTIPLY') p = palettes['spell_ice'];
        else if (itemSubtype === 'CAST_TWO') p = { c: '#ffaa00', d: '#aa5500', h: '#ffff00' };

        shape = [
            "                ",
            "       OO       ",
            "      OHHO      ",
            "     OHCCHO     ",
            "    OHCCCCHO    ",
            "   OHCCCCCCHO   ",
            "  OHCCCCCCCCHO  ",
            " OHCCCCCCCCCCHO ",
            " OHCDDDDDDDDCHO ",
            "  OHDDDDDDDDHO  ",
            "   OHDDDDDDHO   ",
            "    OHDDDDHO    ",
            "     OHDCHO     ",
            "      OHHO      ",
            "       OO       ",
            "                "
        ];
    } else if (itemType === 'spawn_egg' || itemSubtype.includes('spawn_egg')) {
        shape = [
            "                ",
            "     OOOOOO     ",
            "    OHHCCCDO    ",
            "   OHHEECCCDO   ",
            "  OHHCEECCCDDO  ",
            "  OHCCCCECCCDO  ",
            " OHCCECCCCCCCDO ",
            " OHCCECCCCECCDO ",
            " OCCCCCEECECCDO ",
            " OCCEECCCCECCDO ",
            " OCCEECCCCCCCDO ",
            " OCCECCCCECCCDO ",
            "  OCCECCCCCDDO  ",
            "  ODCCEECCDDDO  ",
            "   ODDDDDDDDO   ",
            "    ODDDDDDO    "
        ];
    } else if (itemSubtype === 'ender_pearl') {
        // Draw ender pearl as a glowing teal orb directly
        const cx2 = TEX_SIZE / 2, cy2 = TEX_SIZE / 2, r2 = TEX_SIZE / 2 - 1;
        const grad = ctx.createRadialGradient(cx2 - 2, cy2 - 2, 1, cx2, cy2, r2);
        grad.addColorStop(0, '#aaffee');
        grad.addColorStop(0.3, '#44ccaa');
        grad.addColorStop(0.7, '#117755');
        grad.addColorStop(1, '#002211');
        ctx.beginPath();
        ctx.arc(cx2, cy2, r2, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // Swirl marks
        ctx.strokeStyle = 'rgba(100,255,200,0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(cx2, cy2, r2 * 0.6, r2 * 0.3, 0.5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx2, cy2, r2 * 0.3, r2 * 0.6, -0.5, 0, Math.PI * 2); ctx.stroke();
        // Outline
        ctx.beginPath(); ctx.arc(cx2, cy2, r2, 0, Math.PI * 2);
        ctx.strokeStyle = '#003322'; ctx.lineWidth = 1; ctx.stroke();
        return canvas;
    }

    if (shape.length > 0) {
        drawGrid(shape);
    } else {
        // Fallback generic box
        ctx.fillStyle = p.c || '#ff00ff';
        ctx.fillRect(4, 4, 8, 8);
        ctx.fillStyle = p.d || '#880088';
        ctx.fillRect(4, 12, 8, 2);
        ctx.fillRect(12, 4, 2, 10);
    }

    return canvas;
}

export function generateSpellTexture(element) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Create a radial gradient for a glowing orb
    const cx = 16, cy = 16, r = 16;
    let colorInner, colorOuter;
    
    if (element === 'FIRE') { colorInner = 'rgba(255,255,255,1)'; colorOuter = 'rgba(255,64,0,0)'; }
    else if (element === 'ICE') { colorInner = 'rgba(200,255,255,1)'; colorOuter = 'rgba(0,128,255,0)'; }
    else if (element === 'HEAL') { colorInner = 'rgba(200,255,200,1)'; colorOuter = 'rgba(64,255,64,0)'; }
    else if (element === 'EARTH') { colorInner = 'rgba(200,160,100,1)'; colorOuter = 'rgba(139,69,19,0)'; }
    else if (element === 'THUNDER') { colorInner = 'rgba(255,255,200,1)'; colorOuter = 'rgba(255,255,0,0)'; }
    else if (element === 'DARK') { colorInner = 'rgba(180,100,255,1)'; colorOuter = 'rgba(102,0,204,0)'; }
    else if (element === 'WIND') { colorInner = 'rgba(200,255,220,1)'; colorOuter = 'rgba(153,255,204,0)'; }
    else if (element === 'POISON') { colorInner = 'rgba(150,255,150,1)'; colorOuter = 'rgba(51,204,51,0)'; }
    else if (element === 'FROST') { colorInner = 'rgba(150,255,255,1)'; colorOuter = 'rgba(0,255,255,0)'; }
    else if (element === 'LIGHT') { colorInner = 'rgba(255,255,150,1)'; colorOuter = 'rgba(255,200,0,0)'; }
    else if (element === 'VOID') { colorInner = 'rgba(150,0,200,1)'; colorOuter = 'rgba(80,0,150,0)'; }
    else if (element === 'LAVA') { colorInner = 'rgba(255,100,0,1)'; colorOuter = 'rgba(200,40,0,0)'; }
    else if (element === 'BUILDER') { colorInner = 'rgba(200,200,200,1)'; colorOuter = 'rgba(100,100,100,0)'; }
    else { colorInner = 'rgba(255,255,255,1)'; colorOuter = 'rgba(128,0,255,0)'; } // Arcane/Default
    
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    grad.addColorStop(0, colorInner);
    grad.addColorStop(0.3, colorOuter.replace(',0)', ',0.8)'));
    grad.addColorStop(1, colorOuter);
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    
    // Add some random spark pixels for detail
    for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 10;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(cx + Math.cos(a)*d, cy + Math.sin(a)*d, 1, 1);
    }
    
    return canvas;
}


// ============================================================
// MC Entity Skin Config — maps each mob to CDN URL + face UVs
// [sx, sy, sw, sh] = source rect in skin sheet → scaled to 16x16
// ============================================================
const _ENTITY_LOCAL_BASE = 'assets/mc/entity/';
const _ENTITY_CDN_BASE = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/entity/';
const MC_MOB_SKIN_CONFIG = {
    // --- Quadrupeds ---
    COW: { path: 'cow/cow.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [18,20,10,14], leg: [0,16,4,16], horn: [22,0,4,4], snout: [1,5,4,3] },
    PIG: { path: 'pig/pig.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [28,16,8,14], leg: [0,16,4,16], snout: [16,16,4,3] },
    SHEEP: { path: 'sheep/sheep.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [28,16,8,14], leg: [0,16,4,16] },
    CHICKEN: { path: 'chicken.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [26,0,3,5], wing: [24,13,8,9] },
    // --- Humanoids ---
    ZOMBIE: { path: 'zombie/zombie.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [4,20,4,12], arm: [44,20,4,12] },
    SKELETON: { path: 'skeleton/skeleton.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [4,20,4,12], arm: [44,20,4,12] },
    CREEPER: { path: 'creeper/creeper.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [0,16,4,6] },
    ENDERMAN: { path: 'enderman/enderman.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [56,0,2,30], arm: [56,0,2,30] },
    PIGLIN_BRUISER: { path: 'piglin/piglin_brute.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [4,20,4,12], arm: [44,20,4,12] },
    GOLEM: { path: 'iron_golem/iron_golem.png',
        head_front: [6,10,8,10], head_back: [20,10,8,10], head_top: [6,0,8,6], head_bottom: [14,0,8,6], head_side: [0,10,6,10],
        body: [18,40,18,12], leg: [37,0,6,16], arm: [60,58,8,30] },
    // --- Other ---
    SPIDER: { path: 'spider/spider.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [0,16,16,8] },
    SLIME: { path: 'slime/slime.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [8,8,8,8] },
    LAVASLIME: { path: 'slime/magmacube.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [8,8,8,8] },
    BAT: { path: 'bat.png',
        head_front: [0,0,6,6], head_back: [12,0,6,6], head_top: [6,0,6,6], head_bottom: [12,0,6,6], head_side: [0,0,6,6],
        body: [0,6,6,10] },
    TURTLE: { path: 'turtle/big_sea_turtle.png',
        head_front: [9,6,6,5], head_back: [21,6,6,5], head_top: [9,0,6,6], head_bottom: [15,0,6,6], head_side: [3,6,6,5],
        body: [22,24,15,13], leg: [0,16,6,6] },
    FROG: { path: 'frog/temperate_frog.png',
        head_front: [23,13,7,5], head_back: [35,13,7,5], head_top: [23,8,7,5], head_bottom: [23,8,7,5], head_side: [18,13,5,5],
        body: [0,9,8,9], leg: [0,14,4,6] },
    CAMEL: { path: 'camel/camel.png',
        head_front: [60,24,7,8], head_back: [74,24,7,8], head_top: [60,10,7,14], head_bottom: [67,10,7,14], head_side: [46,24,14,8],
        body: [0,40,20,27], leg: [0,18,4,14] },
    // --- Fish ---
    COD: { path: 'fish/cod.png',
        head_front: [0,0,8,8], head_back: [16,0,8,8], head_top: [8,0,8,4], head_bottom: [16,0,8,4], head_side: [0,0,4,8],
        body: [0,8,8,8] },
    SALMON: { path: 'fish/salmon.png',
        head_front: [0,0,8,8], head_back: [16,0,8,8], head_top: [8,0,8,4], head_bottom: [16,0,8,4], head_side: [0,0,4,8],
        body: [0,8,8,8] },
    TROPICAL_FISH: { path: 'fish/tropical_a.png',
        head_front: [0,0,8,8], head_back: [16,0,8,8], head_top: [8,0,8,4], head_bottom: [16,0,8,4], head_side: [0,0,4,8],
        body: [0,8,8,8] },
    PUFFERFISH: { path: 'fish/pufferfish.png',
        head_front: [0,0,8,8], head_back: [0,0,8,8], head_top: [8,0,8,4], head_bottom: [0,0,8,4], head_side: [0,0,4,8],
        body: [0,8,8,8] },
};
// Preloaded skin image cache to avoid redundant network requests
const _mobSkinCache = {};

export function generateMobTexture(mobType, part = 'body', onLoaded = null) {
    if (typeof part === 'function') {
        onLoaded = part;
        part = 'body';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;

    const fill = (c) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 16, 16);
    };
    const rect = (x, y, rw, rh, c) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, rw, rh);
    };
    const dot = (x, y, c) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
    };
    const noise = (r, g, b, range = 15, count = 25) => {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            const delta = (Math.random() - 0.5) * range;
            const nr = Math.min(255, Math.max(0, Math.round(r + delta)));
            const ng = Math.min(255, Math.max(0, Math.round(g + delta)));
            const nb = Math.min(255, Math.max(0, Math.round(b + delta)));
            ctx.fillStyle = `rgb(${nr},${ng},${nb})`;
            ctx.fillRect(x, y, 1, 1);
        }
    };

    // --- COW ---
    if (mobType === 'COW') {
        if (part === 'head_front') {
            fill('#443224'); noise(68, 50, 36, 15, 30);
            rect(6, 2, 4, 5, '#ded6cb');
            rect(7, 1, 2, 2, '#ded6cb');
            rect(1, 6, 3, 2, '#ffffff'); rect(2, 6, 2, 2, '#18120c');
            rect(12, 6, 3, 2, '#ffffff'); rect(12, 6, 2, 2, '#18120c');
            rect(3, 9, 10, 7, '#bba496'); rect(2, 11, 12, 5, '#ad9486');
            rect(4, 11, 2, 3, '#322018'); rect(10, 11, 2, 3, '#322018');
            rect(6, 14, 4, 1, '#786054');
        } else if (part === 'head_top') {
            fill('#443224'); noise(68, 50, 36, 12, 20);
            rect(6, 4, 4, 12, '#ded6cb');
            rect(1, 1, 2, 2, '#c4baa8'); rect(13, 1, 2, 2, '#c4baa8');
        } else if (part === 'head_side') {
            fill('#443224'); noise(68, 50, 36, 15, 25);
            rect(0, 10, 4, 6, '#bba496');
            rect(12, 2, 3, 3, '#302016');
        } else if (part === 'head_bottom') {
            fill('#ad9486'); noise(173, 148, 134, 10, 15);
        } else if (part === 'horn') {
            fill('#e6dece'); noise(230, 222, 206, 10, 20);
            rect(0, 12, 16, 4, '#5c483a');
        } else if (part === 'snout') { // udder
            fill('#f4a8b8'); noise(244, 168, 184, 10, 15);
            rect(3, 4, 3, 3, '#d87e90'); rect(10, 4, 3, 3, '#d87e90');
            rect(3, 10, 3, 3, '#d87e90'); rect(10, 10, 3, 3, '#d87e90');
        } else if (part === 'leg') {
            fill('#e4ddd3'); noise(228, 221, 211, 10, 20);
            rect(0, 0, 16, 5, '#221c18');
            rect(0, 12, 16, 4, '#221e1c');
            rect(0, 11, 16, 1, '#443c38');
        } else { // body
            fill('#e4ddd3'); noise(228, 221, 211, 12, 25);
            rect(1, 2, 6, 5, '#221c18'); rect(2, 7, 4, 3, '#221c18');
            rect(9, 6, 6, 7, '#221c18'); rect(8, 1, 5, 4, '#221c18');
            rect(0, 11, 4, 4, '#221c18'); rect(12, 0, 4, 3, '#221c18');
        }
    }

    // --- PIG ---
    else if (mobType === 'PIG') {
        if (part === 'head_front') {
            fill('#f3aab6'); noise(243, 170, 182, 12, 25);
            rect(2, 6, 3, 2, '#2d161d'); dot(2, 6, '#ffffff');
            rect(11, 6, 3, 2, '#2d161d'); dot(11, 6, '#ffffff');
            rect(2, 5, 3, 1, '#e294a2'); rect(11, 5, 3, 1, '#e294a2');
            rect(4, 9, 8, 5, '#e494a2');
        } else if (part === 'snout') {
            fill('#e88ea0'); noise(232, 142, 160, 10, 15);
            rect(0, 0, 16, 1, '#cf7286'); rect(0, 15, 16, 1, '#b8586c');
            rect(0, 0, 1, 16, '#cf7286'); rect(15, 0, 1, 16, '#b8586c');
            rect(3, 5, 3, 6, '#5e1c28'); rect(10, 5, 3, 6, '#5e1c28');
        } else if (part === 'leg') {
            fill('#f3aab6'); noise(243, 170, 182, 10, 20);
            rect(0, 12, 16, 4, '#4c222b');
            rect(7, 11, 2, 5, '#281016');
        } else { // body / head sides
            fill('#f3aab6'); noise(243, 170, 182, 12, 30);
            rect(0, 0, 16, 3, '#e699a6');
            rect(0, 13, 16, 3, '#f9bcc6');
        }
    }

    // --- SHEEP ---
    else if (mobType === 'SHEEP') {
        if (part === 'head_front') {
            fill('#d8b898'); noise(216, 184, 152, 10, 25);
            rect(0, 0, 16, 5, '#f0f0f0'); rect(2, 5, 12, 2, '#eaeaea');
            rect(1, 8, 3, 2, '#ffffff'); rect(2, 8, 2, 2, '#2a1e16');
            rect(12, 8, 3, 2, '#ffffff'); rect(12, 8, 2, 2, '#2a1e16');
            rect(6, 12, 4, 2, '#b88274'); dot(7, 13, '#88584c'); dot(8, 13, '#88584c');
        } else if (part === 'head_bottom') {
            fill('#d8b898'); noise(216, 184, 152, 10, 15);
        } else if (part === 'leg') {
            fill('#d8b898'); noise(216, 184, 152, 10, 20);
            rect(0, 13, 16, 3, '#38261c');
        } else { // wool
            fill('#ececec'); noise(236, 236, 236, 15, 40);
            for (let i = 0; i < 16; i++) {
                const cx = (i * 5) % 16, cy = Math.floor((i * 5) / 16) * 4;
                rect(cx, cy, 3, 3, '#dbdbdb');
                rect(cx + 1, cy + 1, 2, 2, '#fafafa');
            }
        }
    }

    // --- CHICKEN ---
    else if (mobType === 'CHICKEN') {
        if (part === 'head_front') {
            fill('#fafafa'); noise(250, 250, 250, 10, 25);
            rect(1, 5, 2, 2, '#181818'); dot(1, 5, '#ffffff');
            rect(13, 5, 2, 2, '#181818'); dot(13, 5, '#ffffff');
            rect(5, 7, 6, 4, '#f5a200');
            dot(6, 8, '#b26b00'); dot(9, 8, '#b26b00');
            rect(6, 11, 4, 4, '#d81824'); rect(7, 15, 2, 1, '#a80c14');
        } else if (part === 'head_side') {
            fill('#fafafa'); noise(250, 250, 250, 10, 25);
            rect(6, 5, 3, 3, '#181818'); dot(6, 5, '#ffffff');
            rect(13, 7, 3, 3, '#f5a200');
        } else if (part === 'wing') {
            fill('#f4f4f4'); noise(244, 244, 244, 10, 25);
            rect(0, 8, 16, 3, '#dedede'); rect(0, 12, 16, 4, '#cccccc');
        } else if (part === 'leg') {
            fill('#f5a200'); noise(245, 162, 0, 10, 20);
            rect(0, 12, 16, 4, '#cf8000');
        } else { // body
            fill('#fafafa'); noise(250, 250, 250, 12, 35);
            rect(2, 4, 12, 2, '#eaeaea'); rect(3, 8, 10, 2, '#e0e0e0');
            rect(4, 12, 8, 2, '#d6d6d6');
        }
    }

    // --- ZOMBIE ---
    else if (mobType === 'ZOMBIE') {
        if (part === 'head_front') {
            fill('#567e45'); noise(86, 126, 69, 15, 30);
            rect(0, 0, 16, 4, '#263b1f');
            rect(0, 4, 3, 2, '#263b1f'); rect(13, 4, 3, 2, '#263b1f'); rect(6, 4, 4, 1, '#263b1f');
            rect(2, 6, 4, 3, '#142010'); dot(3, 7, '#d64024'); dot(4, 7, '#ead23a');
            rect(10, 6, 4, 3, '#142010'); dot(11, 7, '#ead23a'); dot(12, 7, '#d64024');
            rect(5, 12, 6, 2, '#182612'); dot(6, 12, '#38502a'); dot(9, 12, '#38502a');
        } else if (part.startsWith('head_')) {
            fill('#263b1f'); noise(38, 59, 31, 15, 30);
            rect(2, 8, 4, 4, '#567e45');
        } else if (part === 'body') {
            fill('#009a9a'); noise(0, 154, 154, 12, 25);
            rect(5, 0, 6, 4, '#567e45'); rect(6, 4, 4, 2, '#567e45');
            rect(0, 0, 16, 1, '#007878'); rect(0, 14, 16, 2, '#006c6c');
        } else if (part === 'arm') {
            fill('#567e45'); noise(86, 126, 69, 15, 25);
            rect(0, 0, 16, 5, '#009a9a'); rect(0, 4, 16, 1, '#007878');
            rect(0, 13, 16, 3, '#466838');
        } else if (part === 'leg') {
            fill('#362a58'); noise(54, 42, 88, 12, 25);
            rect(0, 12, 16, 4, '#1e1e24'); rect(0, 11, 16, 1, '#2c2246');
        } else {
            fill('#567e45'); noise(86, 126, 69, 15, 25);
        }
    }

    // --- SKELETON ---
    else if (mobType === 'SKELETON') {
        if (part === 'head_front') {
            fill('#dedad0'); noise(222, 218, 208, 12, 25);
            rect(2, 5, 4, 4, '#101010'); rect(10, 5, 4, 4, '#101010');
            dot(3, 6, '#301818'); dot(11, 6, '#301818');
            rect(7, 8, 2, 2, '#101010');
            rect(4, 11, 8, 3, '#101010');
            for (let t = 4; t < 12; t += 2) rect(t, 11, 1, 3, '#dedad0');
        } else if (part === 'body') {
            fill('#141414');
            rect(7, 0, 2, 16, '#dedad0');
            for (let r = 2; r <= 12; r += 3) {
                rect(1, r, 14, 1, '#dedad0');
                rect(0, r + 1, 2, 1, '#dedad0');
                rect(14, r + 1, 2, 1, '#dedad0');
            }
        } else {
            fill('#dedad0'); noise(222, 218, 208, 10, 20);
            rect(0, 0, 16, 2, '#b8b2a6'); rect(0, 14, 16, 2, '#b8b2a6');
            rect(6, 2, 4, 12, '#eae6dc');
        }
    }

    // --- SPIDER ---
    else if (mobType === 'SPIDER') {
        if (part === 'head_front') {
            fill('#1a1616'); noise(26, 22, 22, 10, 25);
            rect(5, 8, 2, 2, '#ff1800'); dot(5, 8, '#ff8800');
            rect(9, 8, 2, 2, '#ff1800'); dot(9, 8, '#ff8800');
            rect(2, 7, 2, 2, '#e01000'); dot(3, 7, '#ff5500');
            rect(12, 7, 2, 2, '#e01000'); dot(12, 7, '#ff5500');
            dot(5, 6, '#ff4400'); dot(7, 6, '#ff6600'); dot(8, 6, '#ff6600'); dot(10, 6, '#ff4400');
            rect(5, 12, 2, 3, '#0e0b0b'); rect(9, 12, 2, 3, '#0e0b0b');
        } else if (part === 'body') {
            fill('#161212'); noise(22, 18, 18, 12, 35);
            rect(5, 2, 6, 2, '#281e1e'); rect(4, 5, 8, 2, '#2c2020');
            rect(5, 9, 6, 2, '#281e1e'); rect(6, 12, 4, 2, '#241a1a');
        } else {
            fill('#181414'); noise(24, 20, 20, 8, 15);
            rect(0, 6, 16, 2, '#382626'); rect(0, 12, 16, 2, '#382626');
        }
    }

    // --- SLIME & LAVASLIME ---
    else if (mobType === 'SLIME') {
        fill('#3edd3e'); noise(62, 221, 62, 15, 30);
        if (part === 'head_front' || part === 'body') {
            rect(2, 6, 3, 3, '#0a240a'); dot(2, 6, '#ffffff');
            rect(11, 6, 3, 3, '#0a240a'); dot(11, 6, '#ffffff');
            rect(6, 11, 4, 2, '#0a240a');
        }
    }
    else if (mobType === 'LAVASLIME') {
        fill('#241008'); noise(36, 16, 8, 12, 25);
        rect(0, 3, 16, 2, '#ff5500'); rect(4, 4, 8, 1, '#ffcc00');
        rect(0, 9, 16, 2, '#ff5500'); rect(2, 10, 10, 1, '#ffcc00');
        if (part === 'head_front' || part === 'body') {
            rect(2, 5, 4, 3, '#ffff22'); dot(3, 6, '#ffffff');
            rect(10, 5, 4, 3, '#ffff22'); dot(11, 6, '#ffffff');
        }
    }

    // --- CREEPER ---
    else if (mobType === 'CREEPER') {
        fill('#4ba635'); noise(75, 166, 53, 30, 45);
        if (part === 'head_front') {
            // Authentic Minecraft Creeper Face
            rect(2, 4, 3, 3, '#101010'); rect(11, 4, 3, 3, '#101010');
            rect(6, 7, 4, 4, '#101010');
            rect(4, 9, 8, 5, '#101010');
            rect(6, 11, 4, 3, '#4ba635');
        } else {
            // Mottled darker green patches
            for (let i = 0; i < 5; i++) {
                const x = (i * 7) % 14, y = (i * 9) % 14;
                rect(x, y, 3, 3, '#2e7a1e');
            }
        }
    }

    // --- ENDERMAN ---
    else if (mobType === 'ENDERMAN') {
        fill('#161616'); noise(22, 22, 22, 8, 20);
        if (part === 'head_front') {
            // Glowing magenta/purple eyes
            rect(1, 7, 4, 2, '#cc00ff'); rect(11, 7, 4, 2, '#cc00ff');
            dot(2, 7, '#ff88ff'); dot(12, 7, '#ff88ff');
        } else {
            for (let i = 0; i < 4; i++) {
                dot(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), '#2c1438');
            }
        }
    }

    // --- IRON GOLEM ---
    else if (mobType === 'GOLEM') {
        fill('#d4cfc5'); noise(212, 207, 197, 12, 22);
        if (part === 'head_front') {
            // Long cylindrical nose & red eyes
            rect(7, 6, 2, 5, '#997c6c');
            rect(3, 7, 3, 2, '#701010'); dot(4, 7, '#ff1010');
            rect(10, 7, 3, 2, '#701010'); dot(11, 7, '#ff1010');
            rect(3, 6, 10, 1, '#666058');
        } else if (part === 'body') {
            // Iron plating with moss/vines
            rect(2, 3, 3, 10, '#4f7d38');
            rect(9, 2, 2, 12, '#4f7d38');
            rect(0, 12, 16, 2, '#b8b2a6');
        } else if (part === 'arm') {
            rect(1, 6, 3, 6, '#4f7d38');
            rect(0, 14, 16, 2, '#9a9488');
        } else if (part === 'leg') {
            rect(0, 13, 16, 3, '#888278');
        }
    }

    // --- PUFFERFISH ---
    else if (mobType === 'PUFFERFISH') {
        fill('#e8a635'); noise(232, 166, 53, 15, 25);
        if (part === 'head_front' || part === 'body') {
            rect(0, 11, 16, 5, '#d0e5ff');
            rect(2, 5, 3, 3, '#101010'); dot(3, 5, '#ffffff');
            rect(11, 5, 3, 3, '#101010'); dot(12, 5, '#ffffff');
            rect(6, 9, 4, 2, '#443010');
        } else {
            rect(0, 10, 16, 6, '#d0e5ff');
        }
    }

    // --- PIGLIN_BRUISER ---
    else if (mobType === 'PIGLIN_BRUISER') {
        if (part === 'head_front') {
            fill('#d87858'); noise(216, 120, 88, 15, 25);
            rect(0, 0, 16, 3, '#e8b830');
            rect(2, 5, 3, 2, '#ffffff'); rect(3, 5, 2, 2, '#201010');
            rect(11, 5, 3, 2, '#ffffff'); rect(11, 5, 2, 2, '#201010');
            rect(4, 7, 8, 5, '#e48868');
            dot(5, 9, '#4a2018'); dot(10, 9, '#4a2018');
            rect(2, 10, 2, 4, '#fff0b0'); dot(2, 9, '#fff0b0');
            rect(12, 10, 2, 4, '#fff0b0'); dot(13, 9, '#fff0b0');
        } else if (part === 'body') {
            fill('#30282c'); noise(48, 40, 44, 10, 20);
            rect(0, 10, 16, 3, '#947020'); rect(6, 10, 4, 3, '#f5c830');
        } else if (part === 'arm') {
            fill('#d87858'); noise(216, 120, 88, 12, 20);
            rect(0, 0, 16, 5, '#30282c');
        } else if (part === 'leg') {
            fill('#242024'); noise(36, 32, 36, 8, 15);
            rect(0, 12, 16, 4, '#181418');
        } else {
            fill('#d87858'); noise(216, 120, 88, 15, 20);
        }
    }

    // --- CAMEL ---
    else if (mobType === 'CAMEL') {
        if (part === 'head_front') {
            fill('#cda56b'); noise(205, 165, 107, 15, 20);
            rect(0, 0, 3, 2, '#b88d4c'); rect(13, 0, 3, 2, '#b88d4c');
            rect(1, 4, 3, 2, '#302010'); dot(2, 4, '#ffffff');
            rect(12, 4, 3, 2, '#302010'); dot(13, 4, '#ffffff');
            rect(4, 7, 8, 8, '#dfbe88'); noise(223, 190, 136, 10, 15);
            dot(5, 10, '#3d2618'); dot(6, 10, '#3d2618');
            dot(9, 10, '#3d2618'); dot(10, 10, '#3d2618');
            rect(6, 12, 4, 1, '#66442c');
        } else if (part === 'leg') {
            fill('#cda56b'); noise(205, 165, 107, 10, 15);
            rect(0, 12, 16, 4, '#38281e');
        } else if (part === 'hump') {
            fill('#ba8e4e'); noise(186, 142, 78, 15, 25);
            rect(4, 2, 8, 6, '#dfbe88');
        } else {
            fill('#cda56b'); noise(205, 165, 107, 12, 22);
            rect(2, 4, 12, 8, '#c29759');
        }
    }

    // --- FROG ---
    else if (mobType === 'FROG') {
        if (part === 'head_front') {
            fill('#5e7c2e'); noise(94, 124, 46, 12, 20);
            rect(1, 0, 5, 5, '#7c9e3e'); rect(10, 0, 5, 5, '#7c9e3e');
            rect(2, 1, 3, 3, '#f59e0b'); rect(11, 1, 3, 3, '#f59e0b');
            rect(2, 2, 3, 1, '#111111'); rect(11, 2, 3, 1, '#111111');
            rect(3, 9, 10, 7, '#e2d5a3'); noise(226, 213, 163, 8, 12);
            rect(2, 8, 12, 1, '#3a4e1d');
        } else if (part === 'head_top') {
            fill('#5e7c2e'); noise(94, 124, 46, 10, 15);
            rect(1, 1, 5, 5, '#7c9e3e'); rect(10, 1, 5, 5, '#7c9e3e');
        } else if (part === 'leg') {
            fill('#5e7c2e'); noise(94, 124, 46, 10, 15);
            rect(2, 12, 12, 4, '#b8ad80');
        } else {
            fill('#5e7c2e'); noise(94, 124, 46, 15, 25);
            rect(3, 4, 10, 8, '#435a20');
        }
    }

    // --- TURTLE ---
    else if (mobType === 'TURTLE') {
        if (part === 'head_front') {
            fill('#2f7d3a'); noise(47, 125, 58, 12, 20);
            rect(2, 5, 3, 3, '#111111'); dot(3, 5, '#ffffff');
            rect(11, 5, 3, 3, '#111111'); dot(12, 5, '#ffffff');
            rect(4, 10, 8, 5, '#d6cf7a');
        } else if (part === 'body' || part === 'shell') {
            fill('#24582a'); noise(36, 88, 42, 10, 18);
            rect(2, 2, 5, 5, '#3b8b45'); rect(9, 2, 5, 5, '#3b8b45');
            rect(5, 7, 6, 6, '#4e9b3a'); rect(1, 9, 3, 5, '#3b8b45'); rect(12, 9, 3, 5, '#3b8b45');
        } else if (part === 'flipper' || part === 'leg') {
            fill('#2f7d3a'); noise(47, 125, 58, 10, 18);
            dot(4, 6, '#69b56f'); dot(10, 8, '#69b56f');
        } else {
            fill('#2f7d3a'); noise(47, 125, 58, 12, 20);
        }
    }

    // --- BAT ---
    else if (mobType === 'BAT') {
        if (part === 'head_front') {
            fill('#292524'); noise(41, 37, 36, 10, 18);
            rect(3, 5, 2, 2, '#ef4444'); dot(3, 5, '#ffffff');
            rect(11, 5, 2, 2, '#ef4444'); dot(11, 5, '#ffffff');
            dot(5, 9, '#ffffff'); dot(10, 9, '#ffffff');
            rect(6, 8, 4, 1, '#1c1917');
        } else if (part === 'wing') {
            fill('#1c1917'); noise(28, 25, 23, 8, 12);
            for (let i = 2; i < 16; i += 4) {
                rect(i, 0, 1, 16, '#44403c');
            }
        } else {
            fill('#292524'); noise(41, 37, 36, 12, 22);
        }
    }

    // --- FISH (COD, SALMON, TROPICAL_FISH) ---
    else if (mobType === 'COD' || mobType === 'SALMON' || mobType === 'TROPICAL_FISH') {
        let fishBase = '#a09880';
        let fishR = 160, fishG = 152, fishB = 128;
        if (mobType === 'SALMON') { fishBase = '#be3636'; fishR = 190; fishG = 54; fishB = 54; }
        else if (mobType === 'TROPICAL_FISH') { fishBase = '#ff8800'; fishR = 255; fishG = 136; fishB = 0; }

        fill(fishBase); noise(fishR, fishG, fishB, 12, 20);
        if (part === 'head_front') {
            rect(2, 5, 3, 3, '#000000'); dot(3, 5, '#ffffff');
            rect(11, 5, 3, 3, '#000000'); dot(12, 5, '#ffffff');
            if (mobType === 'SALMON') rect(0, 0, 16, 5, '#2f5938');
        } else {
            rect(0, 7, 16, 2, 'rgba(0,0,0,0.2)');
            rect(0, 12, 16, 4, 'rgba(255,255,255,0.25)');
        }
    }

    // --- DEFAULT & OTHER CREATURES ---
    else {
        fill('#888888'); noise(136, 136, 136, 15, 25);
        if (part === 'head_front') {
            rect(2, 6, 2, 2, '#000000'); dot(2, 6, '#ffffff');
            rect(12, 6, 2, 2, '#000000'); dot(12, 6, '#ffffff');
        }
    }

    // --- MC Entity Skin loading: replace procedural texture with real MC skin face ---
    const _skinCfg = MC_MOB_SKIN_CONFIG[mobType];
    if (_skinCfg) {
        const _uvRect = _skinCfg[part];
        if (_uvRect) {
            const _applyFace = (img) => {
                const [sx, sy, sw, sh] = _uvRect;
                ctx.clearRect(0, 0, 16, 16);
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 16, 16);
                if (onLoaded) onLoaded(canvas);
            };
            const _skinKey = _skinCfg.path;
            const _cached = _mobSkinCache[_skinKey];
            if (_cached instanceof HTMLImageElement && _cached.complete && _cached.naturalWidth > 0) {
                // Already loaded — apply immediately (synchronous)
                _applyFace(_cached);
            } else if (Array.isArray(_cached)) {
                // Currently loading — queue our callback for when image arrives
                _cached.push(_applyFace);
            } else if (_cached === null) {
                // Previously failed — keep procedural fallback
                if (onLoaded) onLoaded(canvas);
            } else {
                // Not started yet — begin loading and store pending callbacks array
                const _pendingList = [_applyFace];
                _mobSkinCache[_skinKey] = _pendingList;
                const _img = new Image();
                _img.crossOrigin = 'anonymous';
                _img.onload = () => {
                    _mobSkinCache[_skinKey] = _img;
                    for (const _cb of _pendingList) _cb(_img);
                };
                _img.onerror = () => {
                    // Try CDN fallback if local path fails
                    const _cdnImg = new Image();
                    _cdnImg.crossOrigin = 'anonymous';
                    _cdnImg.onload = () => {
                        _mobSkinCache[_skinKey] = _cdnImg;
                        for (const _cb of _pendingList) _cb(_cdnImg);
                    };
                    _cdnImg.onerror = () => {
                        _mobSkinCache[_skinKey] = null;
                        if (onLoaded) onLoaded(canvas);
                    };
                    _cdnImg.src = _ENTITY_CDN_BASE + _skinCfg.path;
                };
                _img.src = _ENTITY_LOCAL_BASE + _skinCfg.path;
            }
        } else {
            if (onLoaded) onLoaded(canvas);
        }
    } else {
        if (onLoaded) onLoaded(canvas);
    }
    return canvas;
}

// Authentic Minecraft Steve Skin (64x64 PNG)
export const STEVE_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAdVBMVEUAAAAKvLwAzMwmGgokGAgrHg0zJBE/KhW3g2uzeV5SPYn///+qclmbY0mQWT8Af38AaGhVVVWUYD52SzOBUzmPXj5JJRBCHQp3QjVqQDA0JRIoKCg3Nzc/Pz9KSko6MYlBNZtGOqUDenoFiIgElZUApKQAr6/wvakZAAAAAXRSTlMAQObYZgAAAolJREFUeNrt1l1rHucZReFrj/whu5hSCCQtlOTE/f+/Jz4q9Cu0YIhLcFVpVg+FsOCVehi8jmZgWOzZz33DM4CXlum3gH95GgeAzQZVeL4gTm6Cbp4vqFkD8HwBazPY8wWbMq9utu3mNZ5fotVezbzOE3kBEFbaZuc8kb00NTMUbWJp678Xf2GV7RRtx1TDQQ6XBNvsmL2+2vHq1TftmMPIyAWujtN2cl274ua2jpVpZneXEjjo7XW1q53V9ds4ODO5xIuhvGHvfLI3aixauig415uuO2+vl9+cncfsFw25zL650fXn687jqnXuP68/X3+eV3zE7y6u9eB73MlfAcfbTf3yR8CfAX+if8S/H5/EAbAxj5LN48tULvEBOh8V1AageMTXe2YHAOwHbZxrzPkSR3+ffr8TR2JDzE/4Fj8CDgEwDsW+q+9GsR07hhg2CsALBgMo2v5wNxXnQXMeGQVW7gUAyKI2m6KDsJ8Au3++F5RZO+kKNQjQcLLWgjwUjBXLltFgWWMUUlviocBgNoxNGgMjSxiYAA7zgLFo2hgIENiDU8gQCzDOmViGFAsEuBcQSDCothhpJaDRA8E5fHqH2nTbYm5fHLo1V0u3B7DAuheoeScRYabjjjuzs17cHVaTrTXmK78m9swP34d9oK/dfeXSIH2PW/MXwPvxN/bJlxw8zlYAcEyeI6gNgA/O8P8neN8xe1IHP2gTzegjvhUDfuRygmwEs2GE4mkCDIAzm2R4yAuPsIdR9k8AvMc+3L9+2UEjo4WP0FpgP19O0MzCsqxIoMsdDBvYcQyGmO0ZJRoYCKjLJWY0BAhYwGUBCgkh8MRdOKt+ruqMwAB2OcEX94U1TPbYJP0PkyyAI1S6cSIAAAAASUVORK5CYII=';

let _steveImg = null;
let _steveCanvas = null;
let _stevePartCanvases = null;
const _activeSteveTextures = new Set();

function renderProceduralSteveSkin(ctx) {
    // Fill transparent initial
    ctx.clearRect(0, 0, 64, 64);

    const hair = '#4a3219';
    const skin = '#bc8a65';
    const skinDark = '#9e6b48';
    const shirt = '#00a8a8';
    const jeans = '#2b3d68';
    const boots = '#3a3a3a';

    // 1. Head (0, 0 to 32, 16)
    // Top of head (8, 0, 8, 8)
    ctx.fillStyle = hair; ctx.fillRect(8, 0, 8, 8);
    // Neck / Bottom of head (16, 0, 8, 8)
    ctx.fillStyle = skin; ctx.fillRect(16, 0, 8, 8);
    // Right head (0, 8, 8, 8)
    ctx.fillStyle = hair; ctx.fillRect(0, 8, 8, 4);
    ctx.fillStyle = skin; ctx.fillRect(0, 12, 8, 4);
    // Left head (16, 8, 8, 8)
    ctx.fillStyle = hair; ctx.fillRect(16, 8, 8, 4);
    ctx.fillStyle = skin; ctx.fillRect(16, 12, 8, 4);
    // Back of head (24, 8, 8, 8)
    ctx.fillStyle = hair; ctx.fillRect(24, 8, 8, 8);
    // Front face (8, 8, 8, 8)
    ctx.fillStyle = hair; ctx.fillRect(8, 8, 8, 2);
    ctx.fillStyle = skin; ctx.fillRect(8, 10, 8, 6);
    // Eyes
    ctx.fillStyle = '#ffffff'; ctx.fillRect(9, 11, 2, 1); ctx.fillRect(13, 11, 2, 1);
    ctx.fillStyle = '#2f4ba3'; ctx.fillRect(10, 11, 1, 1); ctx.fillRect(13, 11, 1, 1);
    // Nose
    ctx.fillStyle = skinDark; ctx.fillRect(11, 12, 2, 1);
    // Mouth / Beard
    ctx.fillStyle = '#543820'; ctx.fillRect(10, 13, 4, 1);

    // 2. Torso (16, 16 to 40, 32)
    // Top of torso (20, 16, 8, 4)
    ctx.fillStyle = shirt; ctx.fillRect(20, 16, 8, 4);
    // Bottom of torso (28, 16, 8, 4)
    ctx.fillStyle = shirt; ctx.fillRect(28, 16, 8, 4);
    // Sides & Back of torso
    ctx.fillStyle = shirt; ctx.fillRect(16, 20, 24, 12);
    // Front V-neck skin
    ctx.fillStyle = skin; ctx.fillRect(23, 20, 2, 2);

    // 3. Right Arm (40, 16 to 56, 32)
    // Top shoulder (44, 16, 4, 4)
    ctx.fillStyle = shirt; ctx.fillRect(44, 16, 4, 4);
    // Bottom palm (48, 16, 4, 4)
    ctx.fillStyle = skin; ctx.fillRect(48, 16, 4, 4);
    // Arm sides (40, 20, 16, 12)
    ctx.fillStyle = shirt; ctx.fillRect(40, 20, 16, 4); // Sleeve
    ctx.fillStyle = skin;  ctx.fillRect(40, 24, 16, 8); // Bare arm & hand

    // 4. Left Arm (32, 48 to 48, 64)
    ctx.fillStyle = shirt; ctx.fillRect(36, 48, 4, 4);
    ctx.fillStyle = skin;  ctx.fillRect(40, 48, 4, 4);
    ctx.fillStyle = shirt; ctx.fillRect(32, 52, 16, 4);
    ctx.fillStyle = skin;  ctx.fillRect(32, 56, 16, 8);

    // 5. Right Leg (0, 16 to 16, 32)
    ctx.fillStyle = jeans; ctx.fillRect(4, 16, 4, 4);
    ctx.fillStyle = boots; ctx.fillRect(8, 16, 4, 4);
    ctx.fillStyle = jeans; ctx.fillRect(0, 20, 16, 10);
    ctx.fillStyle = boots; ctx.fillRect(0, 30, 16, 2);

    // 6. Left Leg (16, 48 to 32, 64)
    ctx.fillStyle = jeans; ctx.fillRect(20, 48, 4, 4);
    ctx.fillStyle = boots; ctx.fillRect(24, 48, 4, 4);
    ctx.fillStyle = jeans; ctx.fillRect(16, 52, 16, 10);
    ctx.fillStyle = boots; ctx.fillRect(16, 62, 16, 2);
}

function updateStevePartCanvases() {
    if (!_stevePartCanvases) return;
    const skin = getSteveSkinCanvas();
    const copy = (c, x, y, w, h) => {
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(skin, x, y, w, h, 0, 0, w, h);
    };

    const p = _stevePartCanvases;
    copy(p.head.right, 0, 8, 8, 8);
    copy(p.head.left, 16, 8, 8, 8);
    copy(p.head.top, 8, 0, 8, 8);
    copy(p.head.bottom, 16, 0, 8, 8);
    copy(p.head.back, 24, 8, 8, 8);
    copy(p.head.front, 8, 8, 8, 8);

    copy(p.torso.right, 16, 20, 4, 12);
    copy(p.torso.left, 28, 20, 4, 12);
    copy(p.torso.top, 20, 16, 8, 4);
    copy(p.torso.bottom, 28, 16, 8, 4);
    copy(p.torso.back, 32, 20, 8, 12);
    copy(p.torso.front, 20, 20, 8, 12);

    copy(p.rightArm.right, 40, 20, 4, 12);
    copy(p.rightArm.left, 48, 20, 4, 12);
    copy(p.rightArm.top, 44, 16, 4, 4);
    copy(p.rightArm.bottom, 48, 16, 4, 4);
    copy(p.rightArm.back, 52, 20, 4, 12);
    copy(p.rightArm.front, 44, 20, 4, 12);

    copy(p.leftArm.right, 32, 52, 4, 12);
    copy(p.leftArm.left, 40, 52, 4, 12);
    copy(p.leftArm.top, 36, 48, 4, 4);
    copy(p.leftArm.bottom, 40, 48, 4, 4);
    copy(p.leftArm.back, 44, 52, 4, 12);
    copy(p.leftArm.front, 36, 52, 4, 12);

    copy(p.rightLeg.right, 0, 20, 4, 12);
    copy(p.rightLeg.left, 8, 20, 4, 12);
    copy(p.rightLeg.top, 4, 16, 4, 4);
    copy(p.rightLeg.bottom, 8, 16, 4, 4);
    copy(p.rightLeg.back, 12, 20, 4, 12);
    copy(p.rightLeg.front, 4, 20, 4, 12);

    copy(p.leftLeg.right, 16, 52, 4, 12);
    copy(p.leftLeg.left, 24, 52, 4, 12);
    copy(p.leftLeg.top, 20, 48, 4, 4);
    copy(p.leftLeg.bottom, 24, 48, 4, 4);
    copy(p.leftLeg.back, 28, 52, 4, 12);
    copy(p.leftLeg.front, 20, 52, 4, 12);

    for (const tex of _activeSteveTextures) {
        tex.needsUpdate = true;
    }
}

export function getSteveSkinCanvas() {
    if (_steveCanvas) return _steveCanvas;
    const cvs = document.createElement('canvas');
    cvs.width = 64; cvs.height = 64;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;

    // Synchronously paint procedural Steve immediately so the skin is never black!
    renderProceduralSteveSkin(ctx);
    _steveCanvas = cvs;
    return cvs;
}

export async function initSteveSkin() {
    const cvs = getSteveSkinCanvas();
    const ctx = cvs.getContext('2d', { willReadFrequently: true });

    return new Promise((resolve) => {
        const local = new Image();
        local.crossOrigin = 'anonymous';
        local.onload = () => {
            _steveImg = local;
            ctx.clearRect(0, 0, 64, 64);
            ctx.drawImage(local, 0, 0);
            updateStevePartCanvases();
            resolve(cvs);
        };
        local.onerror = () => {
            // Fallback to base64 embedded Steve skin
            const b64 = new Image();
            b64.onload = () => {
                _steveImg = b64;
                ctx.clearRect(0, 0, 64, 64);
                ctx.drawImage(b64, 0, 0);
                updateStevePartCanvases();
                resolve(cvs);
            };
            b64.onerror = () => resolve(cvs);
            b64.src = STEVE_B64;
        };
        local.src = 'assets/mc/steve.png';
    });
}

export function getStevePartTextures() {
    if (_stevePartCanvases) return _stevePartCanvases;
    const make = (w, h) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return c;
    };

    _stevePartCanvases = {
        head: {
            right:  make(8, 8),
            left:   make(8, 8),
            top:    make(8, 8),
            bottom: make(8, 8),
            back:   make(8, 8),
            front:  make(8, 8)
        },
        torso: {
            right:  make(4, 12),
            left:   make(4, 12),
            top:    make(8, 4),
            bottom: make(8, 4),
            back:   make(8, 12),
            front:  make(8, 12)
        },
        rightArm: {
            right:  make(4, 12),
            left:   make(4, 12),
            top:    make(4, 4),
            bottom: make(4, 4),
            back:   make(4, 12),
            front:  make(4, 12)
        },
        leftArm: {
            right:  make(4, 12),
            left:   make(4, 12),
            top:    make(4, 4),
            bottom: make(4, 4),
            back:   make(4, 12),
            front:  make(4, 12)
        },
        rightLeg: {
            right:  make(4, 12),
            left:   make(4, 12),
            top:    make(4, 4),
            bottom: make(4, 4),
            back:   make(4, 12),
            front:  make(4, 12)
        },
        leftLeg: {
            right:  make(4, 12),
            left:   make(4, 12),
            top:    make(4, 4),
            bottom: make(4, 4),
            back:   make(4, 12),
            front:  make(4, 12)
        }
    };

    updateStevePartCanvases();
    return _stevePartCanvases;
}

export function createSteveBodyMaterials(partName) {
    const parts = getStevePartTextures()[partName];
    if (!parts) return null;
    const makeTex = (canvas) => {
        const t = new THREE.CanvasTexture(canvas);
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true;
        _activeSteveTextures.add(t);
        return t;
    };
    const emissive = new THREE.Color(0x222222);
    return [
        new THREE.MeshLambertMaterial({ map: makeTex(parts.right), emissive }),
        new THREE.MeshLambertMaterial({ map: makeTex(parts.left), emissive }),
        new THREE.MeshLambertMaterial({ map: makeTex(parts.top), emissive }),
        new THREE.MeshLambertMaterial({ map: makeTex(parts.bottom), emissive }),
        new THREE.MeshLambertMaterial({ map: makeTex(parts.back), emissive }),
        new THREE.MeshLambertMaterial({ map: makeTex(parts.front), emissive })
    ];
}

// Procedural Player Character Skin Textures (Steve face on front, hair on back)
export function generatePlayerSkinTextures() {
    const parts = getStevePartTextures();
    return {
        headCanvas: parts.head.front,
        torsoCanvas: parts.torso.front,
        armCanvas: parts.rightArm.front,
        legCanvas: parts.rightLeg.front
    };
}

export function generatePlayerSkinTexture() {
    return generatePlayerSkinTextures().headCanvas;
}

// First-Person Steve Hand Texture
export function generateDetailedHandTexture() {
    const skin = getSteveSkinCanvas();
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // Steve right arm front: (x: 44, y: 20, w: 4, h: 12) stretched to 16x32
    ctx.drawImage(skin, 44, 20, 4, 12, 0, 0, 16, 32);
    return canvas;
}

// Procedural Carved Wand Staff Texture (rich grain + golden rune filigree)
export function generateWandShaftTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Rich dark carved mahogany/skyroot wood base
    ctx.fillStyle = '#3a2312';
    ctx.fillRect(0, 0, 32, 128);

    // Vertical wood grains
    for (let x = 0; x < 32; x += 3) {
        ctx.fillStyle = (x % 6 === 0) ? '#4a2f19' : '#29180b';
        ctx.fillRect(x, 0, 2, 128);
    }

    // Polished golden rings & rune bands
    ctx.fillStyle = '#d4af37';
    // Top collar (holding gem socket)
    ctx.fillRect(0, 0, 32, 10);
    ctx.fillStyle = '#ffdf78';
    ctx.fillRect(0, 2, 32, 3); // Gold highlight
    ctx.fillStyle = '#997a15';
    ctx.fillRect(0, 9, 32, 2); // Gold shadow

    // Middle grip band
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 56, 32, 8);
    ctx.fillStyle = '#ffdf78';
    ctx.fillRect(0, 58, 32, 2);

    // Pommel band at bottom
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 118, 32, 10);
    ctx.fillStyle = '#ffdf78';
    ctx.fillRect(0, 120, 32, 2);

    // Mystical cyan glowing rune engravings down shaft
    ctx.fillStyle = '#00ffff';
    const runePattern = [14, 22, 34, 42, 70, 78, 90, 98, 106];
    for (const y of runePattern) {
        ctx.fillRect(14, y, 4, 3);
        ctx.fillRect(12, y + 1, 8, 1);
    }

    // Noise
    const id = ctx.getImageData(0, 0, 32, 128);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 12;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
        d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
    }
    ctx.putImageData(id, 0, 0);

    return canvas;
}

