// ============================================
// generation.js — Procedural Generation, Biomes, Dungeons
// ============================================
import { createNoise2D, createNoise3D, fbm2D, fbm3D, ridgeFbm2D, seededRandom, hashSeed } from './noise.js?v=100';
import { BLOCKS } from './textures.js?v=100';

import { CHUNK_SIZE, CHUNK_HEIGHT } from './engine.js?v=100';

// Planet configurations
export const BIOMES = {
    FOREST: { name: 'Forest', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 1.0, hasTrees: true, grassColor: [0.475, 0.753, 0.353], foliageColor: [0.349, 0.682, 0.188] },
    BIRCH_FOREST: { name: 'Birch Forest', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 0.8, hasTrees: true, isBirch: true, grassColor: [0.502, 0.765, 0.373], foliageColor: [0.380, 0.690, 0.220] },
    PLAINS: { name: 'Plains', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 1.0, hasTrees: false, grassColor: [0.569, 0.741, 0.349], foliageColor: [0.467, 0.671, 0.184] },
    DESERT: { name: 'Desert', surface: BLOCKS.SAND, dirt: BLOCKS.SAND, freq: 0.5, hasTrees: false, hasDeadBush: true, hasCactus: true, grassColor: [0.749, 0.718, 0.333], foliageColor: [0.682, 0.643, 0.165] },
    BEACH: { name: 'Beach', surface: BLOCKS.SAND, dirt: BLOCKS.SAND, freq: 0.5, hasTrees: false, isBeach: true, grassColor: [0.569, 0.741, 0.349], foliageColor: [0.467, 0.671, 0.184] },
    BADLANDS: { name: 'Badlands', surface: BLOCKS.RED_SAND, dirt: BLOCKS.TERRACOTTA, freq: 0.5, hasTrees: false, hasDeadBush: true, hasDeadTrees: true, grassColor: [0.565, 0.506, 0.302], foliageColor: [0.620, 0.506, 0.302] },
    TUNDRA: { name: 'Tundra', surface: BLOCKS.SNOW, dirt: BLOCKS.DIRT, freq: 0.8, hasTrees: true, grassColor: [0.502, 0.706, 0.592], foliageColor: [0.376, 0.631, 0.482] },
    ICE_SPIKES: { name: 'Ice Spikes', surface: BLOCKS.SNOW, dirt: BLOCKS.ICE, freq: 0.3, hasTrees: false, hasIceSpikes: true, grassColor: [0.502, 0.706, 0.592], foliageColor: [0.376, 0.631, 0.482] },
    MUSHROOM: { name: 'Mushroom', surface: BLOCKS.MYCELIUM, dirt: BLOCKS.DIRT, freq: 0.2, hasTrees: false, hasMushrooms: true, grassColor: [0.333, 0.788, 0.247], foliageColor: [0.333, 0.788, 0.247] },
    VOLCANIC: { name: 'Volcanic', surface: BLOCKS.BASALT, dirt: BLOCKS.BLACKSTONE, freq: 0.5, hasTrees: false, isVolcanic: true, grassColor: [0.333, 0.333, 0.333], foliageColor: [0.267, 0.267, 0.267] },
    SWAMP: { name: 'Swamp', surface: BLOCKS.SWAMP_GRASS, dirt: BLOCKS.MUD, freq: 0.6, hasTrees: true, swampFlora: true, grassColor: [0.416, 0.439, 0.224], foliageColor: [0.416, 0.439, 0.224] },
    JUNGLE: { name: 'Jungle', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 0.7, hasTrees: true, jungleFlora: true, grassColor: [0.349, 0.788, 0.235], foliageColor: [0.188, 0.733, 0.043] },
    SAVANNA: { name: 'Savanna', surface: BLOCKS.SAVANNA_GRASS, dirt: BLOCKS.DIRT, freq: 0.8, hasTrees: true, savannaFlora: true, grassColor: [0.749, 0.718, 0.333], foliageColor: [0.682, 0.643, 0.165] },
    MOUNTAINS: { name: 'Mountains', surface: BLOCKS.SNOW, dirt: BLOCKS.STONE, freq: 0.4, hasTrees: true, grassColor: [0.541, 0.714, 0.537], foliageColor: [0.427, 0.639, 0.447] },
    DEEP_OCEAN: { name: 'Deep Ocean', surface: BLOCKS.SAND, dirt: BLOCKS.STONE, freq: 0.3, hasTrees: false, grassColor: [0.557, 0.725, 0.443], foliageColor: [0.443, 0.655, 0.302] },
    CHERRY_GROVE: { name: 'Cherry Grove', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 0.7, hasTrees: true, isCherry: true, grassColor: [0.714, 0.859, 0.404], foliageColor: [0.467, 0.671, 0.184] },
    OASIS: { name: 'Oasis', surface: BLOCKS.SAND, dirt: BLOCKS.SAND, freq: 0.2, hasTrees: true, isOasis: true, grassColor: [0.380, 0.776, 0.278], foliageColor: [0.282, 0.714, 0.157] },
    CORAL_REEF: { name: 'Coral Reef', surface: BLOCKS.SAND, dirt: BLOCKS.SAND, freq: 0.3, hasTrees: false, isCoralReef: true, grassColor: [0.557, 0.725, 0.443], foliageColor: [0.443, 0.655, 0.302] },
    DARK_FOREST: { name: 'Dark Forest', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 0.8, hasTrees: true, isDark: true, hasMushrooms: true, grassColor: [0.314, 0.478, 0.196], foliageColor: [0.314, 0.478, 0.196] },
    MYSTIC_GROVE: { name: 'Mystic Grove', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 0.6, hasTrees: true, isMystic: true, grassColor: [0.478, 0.902, 0.710], foliageColor: [0.322, 0.851, 0.639] },
    TAIGA: { name: 'Taiga', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 0.8, hasTrees: true, isTaiga: true, grassColor: [0.410, 0.680, 0.440], foliageColor: [0.340, 0.580, 0.360] },
    REDWOOD_FOREST: { name: 'Redwood Forest', surface: BLOCKS.PODZOL, dirt: BLOCKS.DIRT, freq: 0.5, hasTrees: true, isRedwood: true, isTaiga: true, grassColor: [0.525, 0.718, 0.514], foliageColor: [0.408, 0.647, 0.369] }
};

export function generateAetherChunk(cx, cz, params) {
    const blocks = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    const rng = seededRandom(params.seed + cx * 314159 + cz);

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = cx * CHUNK_SIZE + x;
            const wz = cz * CHUNK_SIZE + z;

            // Determine Aether biome using temp and moist noise
            const temp = (params.tempNoise(wx * 0.002, wz * 0.002) + 1) / 2;
            const moist = (params.moistNoise(wx * 0.002, wz * 0.002) + 1) / 2;
            
            let biome = 'CRYSTAL_PLAINS';
            if (temp > 0.8) {
                biome = 'QUICKSOIL_DESERT';
            } else if (temp > 0.6) {
                biome = 'GOLDEN_FOREST';
            } else if (temp < 0.2) {
                biome = 'HOLYSTONE_MOUNTAINS';
            } else if (temp < 0.4) {
                biome = 'CLOUD_FOREST';
            } else if (moist > 0.7) {
                biome = 'CLOUD_PEAKS';
            } else if (moist > 0.5 && temp > 0.4 && temp < 0.6) {
                biome = 'ENCHANTED_WOODLANDS';
            }

            const colRng = seededRandom(params.seed + wx * 1234 + wz);

            let maxSolidY = -1;

            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

                if (y === 0 || y === CHUNK_HEIGHT - 1) {
                    blocks[idx] = BLOCKS.AIR; // No bedrock in Aether!
                    continue;
                }

                // 3D noise to create floating islands
                const nval = fbm3D(params.caveNoise, wx * 0.015, y * 0.02, wz * 0.015, 3);
                
                // Density drop-off: island band in middle
                const midY = CHUNK_HEIGHT / 2;
                const distFromMid = Math.abs(y - midY) / (CHUNK_HEIGHT / 4); 
                
                // Density threshold
                let density = nval - (distFromMid * 1.5) + 0.3;
                
                if (biome === 'CLOUD_PEAKS') {
                    density += 0.2 + (y * 0.002);
                } else if (biome === 'HOLYSTONE_MOUNTAINS') {
                    density += 0.4 - Math.abs(distFromMid) * 0.5;
                } else if (biome === 'QUICKSOIL_DESERT') {
                    density -= 0.1;
                }

                if (density > 0) {
                    blocks[idx] = (biome === 'HOLYSTONE_MOUNTAINS') ? BLOCKS.HOLYSTONE : BLOCKS.AETHER_STONE;
                    if (y > maxSolidY) maxSolidY = y;

                    // Ores generation in solid island rock
                    const oreRoll = colRng();
                    if (oreRoll < 0.03) {
                        blocks[idx] = BLOCKS.AMBROSIUM_ORE;
                    } else if (oreRoll < 0.045) {
                        blocks[idx] = BLOCKS.ZANITE_ORE;
                    } else if (y < CHUNK_HEIGHT / 2 && oreRoll < 0.053) {
                        blocks[idx] = BLOCKS.GRAVITITE_ORE;
                    }
                } else {
                    blocks[idx] = BLOCKS.AIR;
                }
            }

            // Second pass: Decorate the column from top to bottom
            for (let y = CHUNK_HEIGHT - 2; y >= 1; y--) {
                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                const idxAbove = ((y + 1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

                const b = blocks[idx];
                const above = blocks[idxAbove];

                if ((b === BLOCKS.AETHER_STONE || b === BLOCKS.HOLYSTONE) && above === BLOCKS.AIR) {
                    // Surface block
                    if (biome === 'CLOUD_PEAKS') {
                        const cloudType = colRng() < 0.4 ? BLOCKS.BLUE_AERCLOUD : (colRng() < 0.7 ? BLOCKS.GOLDEN_AERCLOUD : BLOCKS.AETHER_CLOUD);
                        blocks[idx] = cloudType;
                        if (colRng() < 0.3) {
                            safeSetBlock(blocks, x, y + 1, z, cloudType, true);
                            if (colRng() < 0.5) safeSetBlock(blocks, x, y + 2, z, cloudType, true);
                        }
                    } else if (biome === 'QUICKSOIL_DESERT') {
                        blocks[idx] = BLOCKS.QUICKSOIL;
                        for (let dy = 1; dy <= 3; dy++) {
                            const subIdx = ((y - dy) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                            if (y - dy > 0 && (blocks[subIdx] === BLOCKS.AETHER_STONE || blocks[subIdx] === BLOCKS.HOLYSTONE)) {
                                blocks[subIdx] = BLOCKS.QUICKSOIL;
                            }
                        }
                        if (colRng() < 0.01) {
                            safeSetBlock(blocks, x, y + 1, z, BLOCKS.DEAD_BUSH, true);
                        } else if (colRng() < 0.005) {
                            safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_CRYSTAL, true);
                        }
                    } else if (biome === 'HOLYSTONE_MOUNTAINS') {
                        blocks[idx] = BLOCKS.HOLYSTONE;
                        for (let dy = 1; dy <= 3; dy++) {
                            const subIdx = ((y - dy) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                            if (y - dy > 0 && blocks[subIdx] === BLOCKS.AETHER_STONE) {
                                blocks[subIdx] = BLOCKS.HOLYSTONE;
                            }
                        }
                        if (y > CHUNK_HEIGHT / 2 + 15) {
                            blocks[idx] = BLOCKS.SNOW;
                        }
                    } else {
                        blocks[idx] = BLOCKS.AETHER_GRASS;
                        for (let dy = 1; dy <= 3; dy++) {
                            const subIdx = ((y - dy) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                            if (y - dy > 0 && (blocks[subIdx] === BLOCKS.AETHER_STONE || blocks[subIdx] === BLOCKS.HOLYSTONE)) {
                                blocks[subIdx] = BLOCKS.AETHER_DIRT;
                            }
                        }

                        // Surface flora
                        if (biome === 'GOLDEN_FOREST') {
                            if (colRng() < 0.04) {
                                generateGoldenOakTree(blocks, x, y + 1, z, rng);
                            } else if (colRng() < 0.02) {
                                generateAetherTree(blocks, x, y + 1, z, rng);
                            } else if (colRng() < 0.15) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_TALL_GRASS, true);
                            } else if (colRng() < 0.05) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_FLOWER, true);
                            }
                        } else if (biome === 'ENCHANTED_WOODLANDS') {
                            if (colRng() < 0.04) {
                                generateEnchantedAetherTree(blocks, x, y + 1, z, rng);
                            } else if (colRng() < 0.03) {
                                generateAetherTree(blocks, x, y + 1, z, rng);
                            } else if (colRng() < 0.2) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_TALL_GRASS, true);
                            } else if (colRng() < 0.1) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_FLOWER, true);
                            }
                        } else if (biome === 'CLOUD_FOREST') {
                            if (colRng() < 0.05) {
                                for (let ty = 0; ty < 4; ty++) safeSetBlock(blocks, x, y + 1 + ty, z, BLOCKS.AETHER_WOOD, true);
                                const cloudMat = colRng() < 0.5 ? BLOCKS.BLUE_AERCLOUD : BLOCKS.AETHER_CLOUD;
                                for (let dx = -2; dx <= 2; dx++) {
                                    for (let dz = -2; dz <= 2; dz++) {
                                        for (let dy = 3; dy <= 5; dy++) {
                                            if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy === 5) continue;
                                            safeSetBlock(blocks, x + dx, y + 1 + dy, z + dz, cloudMat, false);
                                        }
                                    }
                                }
                            } else if (colRng() < 0.02) {
                                generateAetherTree(blocks, x, y + 1, z, rng);
                            } else if (colRng() < 0.3) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_FLOWER, true);
                            }
                        } else if (biome === 'CRYSTAL_PLAINS') {
                            if (colRng() < 0.01) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_CRYSTAL, true);
                                if (colRng() < 0.5) safeSetBlock(blocks, x, y + 2, z, BLOCKS.AETHER_CRYSTAL, true);
                            } else if (colRng() < 0.02) {
                                generateAetherTree(blocks, x, y + 1, z, rng);
                            } else if (colRng() < 0.2) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_TALL_GRASS, true);
                            }
                        } else {
                            // Default biome coverage (HOLYSTONE_MOUNTAINS base etc.) — sparse aether trees
                            if (colRng() < 0.025) {
                                generateAetherTree(blocks, x, y + 1, z, rng);
                            } else if (colRng() < 0.1) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_TALL_GRASS, true);
                            } else if (colRng() < 0.03) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_FLOWER, true);
                            }
                        }
                    }
                }
            }
        }
    }

    // High altitude aercloud formations (banks of clouds drifting in sky)
    if (rng() < 0.3) {
        const cloudX = Math.floor(rng() * (CHUNK_SIZE - 4)) + 2;
        const cloudZ = Math.floor(rng() * (CHUNK_SIZE - 4)) + 2;
        const cloudY = 85 + Math.floor(rng() * 15);
        const cloudType = rng() < 0.33 ? BLOCKS.BLUE_AERCLOUD : (rng() < 0.66 ? BLOCKS.GOLDEN_AERCLOUD : BLOCKS.AETHER_CLOUD);
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                if (dx * dx + dz * dz <= 9) {
                    safeSetBlock(blocks, cloudX + dx, cloudY, cloudZ + dz, cloudType, true);
                    if (rng() < 0.4) safeSetBlock(blocks, cloudX + dx, cloudY + 1, cloudZ + dz, cloudType, true);
                }
            }
        }
    }

    // Floating Temple Ruins / Bronze Dungeon (rare floating sanctuary)
    if (rng() < 0.06) {
        const tx = Math.floor(CHUNK_SIZE / 2);
        const tz = Math.floor(CHUNK_SIZE / 2);
        let groundY = -1;
        for (let y = CHUNK_HEIGHT - 5; y > 30; y--) {
            const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
            if (blocks[idx] !== BLOCKS.AIR && blocks[idx] !== BLOCKS.AETHER_CLOUD && blocks[idx] !== BLOCKS.BLUE_AERCLOUD && blocks[idx] !== BLOCKS.GOLDEN_AERCLOUD) {
                groundY = y;
                break;
            }
        }
        if (groundY > 20 && groundY < CHUNK_HEIGHT - 12) {
            generateAetherTemple(blocks, tx, groundY + 1, tz, rng);
        }
    }

    // Floating Crystal Shrines / Ambrosium Geodes
    if (rng() < 0.08) {
        const sx = Math.floor(rng() * (CHUNK_SIZE - 6)) + 3;
        const sz = Math.floor(rng() * (CHUNK_SIZE - 6)) + 3;
        const sy = 60 + Math.floor(rng() * 30);
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                for (let dz = -2; dz <= 2; dz++) {
                    const dsq = dx * dx + dy * dy + dz * dz;
                    if (dsq <= 4) {
                        const mat = (dx === 0 && dy === 0 && dz === 0) 
                            ? (rng() < 0.5 ? BLOCKS.GRAVITITE_ORE : BLOCKS.ZANITE_ORE)
                            : (dsq <= 2 ? BLOCKS.AMBROSIUM_ORE : BLOCKS.CARVED_HOLYSTONE);
                        safeSetBlock(blocks, sx + dx, sy + dy, sz + dz, mat, true);
                    } else if (dsq <= 6 && rng() < 0.35) {
                        safeSetBlock(blocks, sx + dx, sy + dy, sz + dz, BLOCKS.BLUE_AERCLOUD, true);
                    }
                }
            }
        }
    }

    return blocks;
}

function generateAetherTemple(blocks, startX, startY, startZ, rng) {
    const r = 4;
    // Temple foundation and floor
    for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
            safeSetBlock(blocks, startX + dx, startY, startZ + dz, BLOCKS.CARVED_HOLYSTONE);
            safeSetBlock(blocks, startX + dx, startY - 1, startZ + dz, BLOCKS.HOLYSTONE);
            
            // Outer decorative pillars on corners and wall midpoints
            const isCorner = Math.abs(dx) === r && Math.abs(dz) === r;
            const isMid = (Math.abs(dx) === r && dz === 0) || (Math.abs(dz) === r && dx === 0);
            if (isCorner || isMid) {
                for (let py = 1; py <= 4; py++) {
                    safeSetBlock(blocks, startX + dx, startY + py, startZ + dz, BLOCKS.SENTRY_STONE);
                }
                safeSetBlock(blocks, startX + dx, startY + 5, startZ + dz, BLOCKS.GLOWSTONE);
            }
        }
    }
    // Temple altar with Aether loot
    safeSetBlock(blocks, startX, startY + 1, startZ, BLOCKS.CARVED_HOLYSTONE);
    safeSetBlock(blocks, startX, startY + 2, startZ, BLOCKS.CHEST_BLOCK);
    safeSetBlock(blocks, startX, startY + 3, startZ, BLOCKS.GOLDEN_AERCLOUD);
    // Surrounding candelabra torches
    safeSetBlock(blocks, startX - 2, startY + 1, startZ - 2, BLOCKS.TORCH);
    safeSetBlock(blocks, startX + 2, startY + 1, startZ - 2, BLOCKS.TORCH);
    safeSetBlock(blocks, startX - 2, startY + 1, startZ + 2, BLOCKS.TORCH);
    safeSetBlock(blocks, startX + 2, startY + 1, startZ + 2, BLOCKS.TORCH);
}

function generateGoldenOakTree(blocks, x, y, z, rng) {
    const h = 5 + Math.floor(rng() * 3);
    for (let py = y; py < y + h; py++) {
        safeSetBlock(blocks, x, py, z, BLOCKS.GOLDEN_OAK_WOOD, true);
    }
    for (let px = x - 2; px <= x + 2; px++) {
        for (let pz = z - 2; pz <= z + 2; pz++) {
            for (let py = y + h - 2; py <= y + h + 1; py++) {
                if (Math.abs(px - x) === 2 && Math.abs(pz - z) === 2 && py === y + h + 1) continue;
                safeSetBlock(blocks, px, py, pz, BLOCKS.GOLDEN_OAK_LEAVES, true);
            }
        }
    }
}

function generateEnchantedAetherTree(blocks, x, y, z, rng) {
    const height = 5 + Math.floor(rng() * 4);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.ENCHANTED_AETHER_LOG, true);
    }
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
                if (Math.abs(dy) === 2 && (Math.abs(dx) > 1 || Math.abs(dz) > 1)) continue;
                safeSetBlock(blocks, x + dx, y + height + dy, z + dz, BLOCKS.ENCHANTED_AETHER_LEAVES, false);
            }
        }
    }
}

function generateAetherTree(blocks, x, y, z, rng) {
    const h = 5 + Math.floor(rng() * 3);
    for (let py = y; py < y + h; py++) {
        safeSetBlock(blocks, x, py, z, BLOCKS.AETHER_WOOD, true);
    }
    for (let px = x - 2; px <= x + 2; px++) {
        for (let pz = z - 2; pz <= z + 2; pz++) {
            for (let py = y + h - 2; py <= y + h + 1; py++) {
                if (Math.abs(px - x) === 2 && Math.abs(pz - z) === 2 && py === y + h + 1) continue;
                safeSetBlock(blocks, px, py, pz, BLOCKS.AETHER_LEAVES, true);
            }
        }
    }
}

export function isSuperflatSeed(seed) {
    if (typeof seed !== 'string') return false;
    const clean = seed.trim().toLowerCase().replace(/[\s_\-]+/g, '');
    return clean === 'superflat' || clean === 'flat' || clean.startsWith('superflat') || clean.startsWith('flat');
}

export function matchBiomeSeed(seed) {
    if (typeof seed !== 'string') return null;
    let s = seed.trim().toLowerCase();
    // Strip leading "superflat" or "flat" so e.g. "superflat desert" identifies desert as well
    s = s.replace(/^(superflat|flat)[\s_\-]*/, '');
    const clean = s.replace(/[\s_\-]+/g, '');
    if (!clean) return null;

    const mapping = {
        'plains': BIOMES.PLAINS,
        'plain': BIOMES.PLAINS,
        'forest': BIOMES.FOREST,
        'oak': BIOMES.FOREST,
        'oakforest': BIOMES.FOREST,
        'birch': BIOMES.BIRCH_FOREST,
        'birchforest': BIOMES.BIRCH_FOREST,
        'desert': BIOMES.DESERT,
        'beach': BIOMES.BEACH,
        'sandybeach': BIOMES.BEACH,
        'badlands': BIOMES.BADLANDS,
        'mesa': BIOMES.BADLANDS,
        'terracotta': BIOMES.BADLANDS,
        'tundra': BIOMES.TUNDRA,
        'snow': BIOMES.TUNDRA,
        'snowy': BIOMES.TUNDRA,
        'snowytundra': BIOMES.TUNDRA,
        'snowyplains': BIOMES.TUNDRA,
        'icespikes': BIOMES.ICE_SPIKES,
        'icespike': BIOMES.ICE_SPIKES,
        'ice': BIOMES.ICE_SPIKES,
        'mushroom': BIOMES.MUSHROOM,
        'mushroomisland': BIOMES.MUSHROOM,
        'mushroomfields': BIOMES.MUSHROOM,
        'mushroomfield': BIOMES.MUSHROOM,
        'mycelium': BIOMES.MUSHROOM,
        'volcanic': BIOMES.VOLCANIC,
        'volcano': BIOMES.VOLCANIC,
        'basalt': BIOMES.VOLCANIC,
        'swamp': BIOMES.SWAMP,
        'swampland': BIOMES.SWAMP,
        'mangrove': BIOMES.SWAMP,
        'jungle': BIOMES.JUNGLE,
        'rainforest': BIOMES.JUNGLE,
        'savanna': BIOMES.SAVANNA,
        'savannah': BIOMES.SAVANNA,
        'mountains': BIOMES.MOUNTAINS,
        'mountain': BIOMES.MOUNTAINS,
        'peaks': BIOMES.MOUNTAINS,
        'extremehills': BIOMES.MOUNTAINS,
        'ocean': BIOMES.DEEP_OCEAN,
        'deepocean': BIOMES.DEEP_OCEAN,
        'sea': BIOMES.DEEP_OCEAN,
        'cherry': BIOMES.CHERRY_GROVE,
        'cherrygrove': BIOMES.CHERRY_GROVE,
        'cherryblossom': BIOMES.CHERRY_GROVE,
        'oasis': BIOMES.OASIS,
        'coral': BIOMES.CORAL_REEF,
        'coralreef': BIOMES.CORAL_REEF,
        'darkforest': BIOMES.DARK_FOREST,
        'darkoak': BIOMES.DARK_FOREST,
        'roofedforest': BIOMES.DARK_FOREST,
        'mystic': BIOMES.MYSTIC_GROVE,
        'mysticgrove': BIOMES.MYSTIC_GROVE,
        'taiga': BIOMES.TAIGA,
        'spruce': BIOMES.TAIGA,
        'pine': BIOMES.TAIGA,
        'redwood': BIOMES.REDWOOD_FOREST,
        'redwoodforest': BIOMES.REDWOOD_FOREST,
        'megataiga': BIOMES.REDWOOD_FOREST,
        'oldgrowthtaiga': BIOMES.REDWOOD_FOREST
    };

    if (mapping[clean]) return mapping[clean];

    for (const [key, b] of Object.entries(BIOMES)) {
        const kClean = key.toLowerCase().replace(/[\s_\-]+/g, '');
        const nClean = b.name.toLowerCase().replace(/[\s_\-]+/g, '');
        if (clean === kClean || clean === nClean) {
            return b;
        }
    }

    return null;
}

export class PlanetParams {
    constructor(seed) {
        this.rawSeed = seed;
        this.isSuperflat = isSuperflatSeed(seed);
        this.forcedBiome = matchBiomeSeed(seed);
        this.seed = typeof seed === 'string' ? hashSeed(seed) : seed;
        const rng = seededRandom(this.seed);
        
        // Generate name
        const prefix = ['Zor', 'Gla', 'Xen', 'Kry', 'Nova', 'Sol', 'Vyr', 'Thal', 'Kor'];
        const suffix = ['ia', 'on', 'us', 'prime', 'ax', 'eth', 'os'];
        this.name = prefix[Math.floor(rng() * prefix.length)] + suffix[Math.floor(rng() * suffix.length)];

        // Aesthetics
        // Pick a realistic, vibrant daytime sky blue color
        const skyBlues = ['#78A7FF', '#87CEEB', '#88CCEE', '#66B2FF', '#99CCFF'];
        this.skyColor = skyBlues[Math.floor(rng() * skyBlues.length)];
        // Use a much lower fog density so the world looks clearer and less eerie
        this.fogDensity = 0.003 + (rng() * 0.003);

        // Terrain
        // Terrain parameters tweaked for Minecraft-like ruggedness
        this.terrainScale = 300 + rng() * 200; // Large macro shapes
        this.terrainHeight = 40 + rng() * 20; // Taller hills and mountains (40-60 range)
        this.baseHeight = 45 + rng() * 10; // Ensure enough depth for oceans and height for peaks
        this.seaLevel = this.baseHeight - 8;
        
        // Caves
        this.caveScale = 15 + rng() * 15; // Tighter noise to make them more distinct
        this.caveThreshold = 0.25 + rng() * 0.1; // Lowered significantly to create massive sprawling caves

        this.dungeonFrequency = 0.08 + rng() * 0.04; // Dungeons are rare but findable

        this.noise2D = createNoise2D(this.seed);
        this.noise3D = createNoise3D(this.seed);
        this.caveNoise = createNoise3D(this.seed + 123);
        this.tempNoise = createNoise2D(this.seed + 456);
        this.moistNoise = createNoise2D(this.seed + 789);

        if (this.isSuperflat) {
            this.terrainHeight = 0;
            this.baseHeight = 4;
            this.seaLevel = -1;
            this.skyColor = '#78A7FF';
        } else if (this.forcedBiome) {
            if (this.forcedBiome === BIOMES.DEEP_OCEAN || this.forcedBiome === BIOMES.CORAL_REEF) {
                this.baseHeight = 35;
                this.seaLevel = 62;
            } else if (this.forcedBiome === BIOMES.BEACH) {
                this.baseHeight = 62;
                this.seaLevel = 62;
            }
        }
    }
}

export function generatePlanetParams(seed) {
    return new PlanetParams(seed);
}

export function getBiomeParams(wx, wz, params) {
    if (params && params.isSuperflat) {
        return {
            biome: params.forcedBiome || BIOMES.PLAINS,
            terraceWeight: 0,
            contNoise: 0.8,
            erosionNoise: 1.0,
            weirdness: 0,
            temp: 0.5,
            moist: 0.5
        };
    }

    if (params && params.forcedBiome) {
        const forced = params.forcedBiome;
        let forcedContNoise = 0.6; // Inland dry land by default (no unwanted ocean cuts)
        if (forced === BIOMES.DEEP_OCEAN || forced === BIOMES.CORAL_REEF) {
            forcedContNoise = 0.15; // Deep ocean
        } else if (forced === BIOMES.BEACH) {
            forcedContNoise = 0.32; // Coastal beach
        } else if (forced === BIOMES.SWAMP) {
            forcedContNoise = 0.45; // Inland wetland
        }
        
        let forcedTemp = 0.5;
        let forcedMoist = 0.5;
        
        if (forced === BIOMES.DESERT || forced === BIOMES.BADLANDS || forced === BIOMES.OASIS) {
            forcedTemp = 0.9;
            forcedMoist = 0.1;
        } else if (forced === BIOMES.TUNDRA || forced === BIOMES.ICE_SPIKES) {
            forcedTemp = 0.1;
            forcedMoist = 0.2;
        } else if (forced === BIOMES.JUNGLE) {
            forcedTemp = 0.85;
            forcedMoist = 0.85;
        } else if (forced === BIOMES.SWAMP) {
            forcedTemp = 0.6;
            forcedMoist = 0.85;
        } else if (forced === BIOMES.SAVANNA) {
            forcedTemp = 0.85;
            forcedMoist = 0.3;
        } else if (forced === BIOMES.TAIGA || forced === BIOMES.REDWOOD_FOREST) {
            forcedTemp = 0.22;
            forcedMoist = 0.5;
        }

        const noise2D = params.noise2D;
        let erosionNoise = (noise2D(wx * 0.0004 + 1000, wz * 0.0004 + 1000) + 1) / 2;
        if (forced === BIOMES.MOUNTAINS) {
            erosionNoise = Math.min(0.22, erosionNoise * 0.4); // Force extreme jagged mountain erosion
        }
        const weirdness = (noise2D(wx * 0.0006 + 15000, wz * 0.0006 + 15000) + 1) / 2;

        return {
            biome: forced,
            terraceWeight: (forced === BIOMES.BADLANDS || forced === BIOMES.VOLCANIC) ? 0.6 : 0,
            contNoise: forcedContNoise,
            erosionNoise: erosionNoise,
            weirdness: weirdness,
            temp: forcedTemp,
            moist: forcedMoist
        };
    }

    const noise2D = params.noise2D;
    const tempNoise = params.tempNoise;
    const moistNoise = params.moistNoise;

    // Continentalness and Erosion
    const contNoise = (noise2D(wx * 0.00028, wz * 0.00028) + 1) / 2;
    const erosionNoise = (noise2D(wx * 0.0004 + 1000, wz * 0.0004 + 1000) + 1) / 2;

    // Domain warp the coordinates to make biome borders wavy and organically fractal
    let warpX = noise2D(wx * 0.003 + 2000, wz * 0.003 + 2000) * 60;
    let warpZ = noise2D(wz * 0.003 + 3000, wx * 0.003 + 3000) * 60;
    // High-frequency micro domain warping (eliminates rectilinear grid seams between biomes)
    warpX += noise2D(wx * 0.015 + 4000, wz * 0.015 + 4000) * 14;
    warpZ += noise2D(wz * 0.015 + 7000, wx * 0.015 + 7000) * 14;
    
    // Kept large offsets to prevent spawning exactly at (0.5, 0.5) forest every seed
    const temp = (tempNoise((wx + warpX) * 0.00028 + 5000, (wz + warpZ) * 0.00028 + 5000) + 1) / 2;
    const moist = (moistNoise((wx + warpX) * 0.00028 + 8000, (wz + warpZ) * 0.00028 + 8000) + 1) / 2;
    const weirdness = (noise2D((wx + warpX) * 0.0006 + 15000, (wz + warpZ) * 0.0006 + 15000) + 1) / 2;

    const isOcean = contNoise < 0.3;
    const isMountain = erosionNoise < 0.35 && contNoise >= 0.38;
    const isFlat = erosionNoise > 0.65;
    // Authentic Minecraft Beach Biome: coastal boundary ribbon along oceans
    const isCoast = contNoise >= 0.285 && contNoise < 0.35 && !isMountain;

    let biome = BIOMES.PLAINS;
    let terraceWeight = 0;

    if (isOcean) {
        if (contNoise < 0.15 && weirdness > 0.82) biome = BIOMES.MUSHROOM; // Rare isolated Minecraft Mushroom Island in deep ocean
        else if (temp > 0.75 && moist > 0.5) biome = BIOMES.CORAL_REEF;
        else if (temp < 0.25) biome = weirdness > 0.42 ? BIOMES.ICE_SPIKES : BIOMES.TUNDRA; // Authentic Frozen Ocean with Ice Spikes!
        else biome = BIOMES.DEEP_OCEAN; // Default ocean
    } else if (isCoast) {
        if (temp < 0.15) biome = weirdness > 0.45 ? BIOMES.ICE_SPIKES : BIOMES.TUNDRA;
        else if (temp < 0.26) biome = BIOMES.TAIGA;
        else if (temp > 0.55 && moist > 0.65) biome = BIOMES.SWAMP;
        else biome = BIOMES.BEACH; // Authentic Sandy beach for coastal shores
    } else if (isMountain) {
        let tw = Math.max(0, Math.min(1, (temp - 0.6) / 0.1));
        let mw = Math.max(0, Math.min(1, (0.5 - moist) / 0.1));
        terraceWeight = Math.max(terraceWeight, tw * mw);
        
        if (temp > 0.75 && moist < 0.4) biome = BIOMES.BADLANDS;
        else if (temp < 0.25) biome = BIOMES.MOUNTAINS; // Snowy Peaks
        else if (temp > 0.72 && moist < 0.5) biome = BIOMES.VOLCANIC;
        else biome = BIOMES.MOUNTAINS;
    } else {
        // Inland
        if (temp > 0.75) { // Hot
            if (moist < 0.3) {
                let ww = Math.max(0, Math.min(1, (weirdness - 0.7) / 0.1));
                terraceWeight = Math.max(terraceWeight, ww);
                biome = weirdness > 0.75 ? BIOMES.VOLCANIC : (weirdness > 0.4 ? BIOMES.BADLANDS : BIOMES.DESERT);
                if (biome === BIOMES.DESERT && moist > 0.18) biome = BIOMES.OASIS;
            } else if (moist < 0.45) {
                biome = weirdness > 0.6 ? BIOMES.SAVANNA : BIOMES.DESERT;
            } else if (moist > 0.6) {
                biome = weirdness > 0.3 ? BIOMES.JUNGLE : BIOMES.SWAMP;
            } else {
                biome = BIOMES.SAVANNA;
            }
        } else if (temp < 0.26) { // Cold / Cool
            if (weirdness > 0.6 && moist > 0.4) {
                biome = BIOMES.ICE_SPIKES;
            } else if (temp < 0.12) {
                biome = BIOMES.TUNDRA;
            } else {
                biome = BIOMES.TAIGA;
            }
        } else { // Temperate (0.26 to 0.75)
            if (moist < 0.35) {
                biome = BIOMES.PLAINS;
            } else if (moist > 0.65) {
                if (weirdness > 0.75) biome = BIOMES.MYSTIC_GROVE;
                else if (weirdness > 0.45) biome = BIOMES.DARK_FOREST;
                else biome = BIOMES.SWAMP;
            } else {
                if (weirdness > 0.78) biome = BIOMES.CHERRY_GROVE;
                else if (weirdness > 0.55) biome = BIOMES.REDWOOD_FOREST;
                else if (isFlat) biome = BIOMES.PLAINS;
                else if (weirdness > 0.30) biome = BIOMES.BIRCH_FOREST;
                else biome = BIOMES.FOREST;
            }
        }
    }

    return { biome, terraceWeight, contNoise, erosionNoise, weirdness, temp, moist };
}

export function getColumnInfo(wx, wz, params) {
    if (params && params.isSuperflat) {
        return {
            biome: params.forcedBiome || BIOMES.PLAINS,
            surfaceY: 4,
            targetHeight: 4,
            erosionNoise: 1.0,
            contNoise: 0.8,
            weirdness: 0,
            temp: 0.5,
            moist: 0.5,
            factor: 0,
            colRng: seededRandom(params.seed + wx * 3141 + wz),
            bData: { isTerraced: false, lakeSurfaceY: 0 }
        };
    }

    const colRng = seededRandom(params.seed + wx * 3141 + wz);
    
    let { biome, terraceWeight, contNoise, erosionNoise, weirdness, temp, moist } = getBiomeParams(wx, wz, params);
    
    const smoothstep = (min, max, v) => {
        const t = Math.max(0, Math.min(1, (v - min) / (max - min)));
        return t * t * (3 - 2 * t);
    };

    // 1. Continentalness Base with smooth cubic hermite curves (eliminates coastline angle kinks)
    let baseElevation = params.seaLevel;
    if (contNoise < 0.3) {
        // Ocean (deep to shallow)
        const t = smoothstep(0, 0.3, contNoise);
        baseElevation = (params.seaLevel - 25) + t * 23; // -25 to -2 below sea level
    } else if (contNoise < 0.35) {
        // Coastline/Beach
        const t = smoothstep(0.3, 0.35, contNoise);
        baseElevation = (params.seaLevel - 2) + t * 5; // -2 to +3 relative to sea level
    } else {
        // Inland (safely elevated above sea level so plains/forest don't create accidental ocean dips)
        const t = smoothstep(0.35, 1.0, contNoise);
        baseElevation = (params.seaLevel + 3) + t * 32; // +3 to +35 relative to sea level
    }

    // 2. Erosion Factor
    let factor = 1.0;
    if (erosionNoise > 0.7) factor = 0.15; // Very flat
    else if (erosionNoise > 0.5) factor = 0.15 + ((0.7 - erosionNoise) / 0.2) * 0.35; // 0.15 to 0.5
    else if (erosionNoise > 0.3) factor = 0.5 + ((0.5 - erosionNoise) / 0.2) * 0.7; // 0.5 to 1.2
    else factor = 1.2 + ((0.3 - erosionNoise) / 0.3) * 2.8; // 1.2 to 4.0 (Mountains)

    // Smooth continuous climate shaping:
    // Replaces abrupt per-biome step functions with continuous smoothstep gradients,
    // ensuring seamless, cliff-free terrain height transitions between biomes like Minecraft.
    const desertInfluence = smoothstep(0.68, 0.78, temp) * (1.0 - smoothstep(0.25, 0.45, moist));
    const swampInfluence = smoothstep(0.25, 0.35, temp) * smoothstep(0.55, 0.70, moist) * (1.0 - smoothstep(0.40, 0.60, weirdness));
    const plainsInfluence = smoothstep(0.55, 0.75, erosionNoise) * (1.0 - smoothstep(0.45, 0.65, weirdness));

    // In Minecraft, swamps are sea-level wetlands:
    // Centered around sea level (+0.6) with natural relief (factor 0.32)
    // allowing gentle channels (y=60-61) and lush grassy islands/banks (y=63-65)
    if (swampInfluence > 0 && contNoise >= 0.35) {
        const targetSwampElev = params.seaLevel + 0.6;
        baseElevation = baseElevation * (1.0 - swampInfluence) + targetSwampElev * swampInfluence;
    }

    let climateMultiplier = 1.0;
    climateMultiplier = climateMultiplier * (1.0 - desertInfluence) + 0.35 * desertInfluence;
    climateMultiplier = climateMultiplier * (1.0 - plainsInfluence * 0.45) + 0.30 * (plainsInfluence * 0.45);
    factor *= climateMultiplier;
    // For swamps, guarantee gentle rolling wetland relief (channels dipping 1-2 blocks below seaLevel, banks 1-3 blocks above)
    if (swampInfluence > 0) {
        factor = factor * (1.0 - swampInfluence) + 0.32 * swampInfluence;
    }

    // Smooth roughness in deep oceans while preserving natural gentle coastal slopes
    if (contNoise < 0.22) {
        factor *= 0.25;
    } else if (contNoise < 0.35) {
        let t = (contNoise - 0.22) / 0.13;
        factor *= (0.25 + t * 0.75);
    }

    // 3. Peaks and Valleys (Weirdness)
    let hNoise = fbm2D(params.noise2D, wx / params.terrainScale, wz / params.terrainScale, 3);
    
    // Add detail noise
    let detailNoise = fbm2D(params.noise2D, wx / (params.terrainScale * 0.3), wz / (params.terrainScale * 0.3), 2);
    hNoise += detailNoise * 0.3;

    // High frequency micro noise
    let microNoise = params.noise2D(wx / 15, wz / 15);
    hNoise += microNoise * 0.05;

    let terrainOffset = hNoise * 40 * factor;

    // Shape valleys vs peaks
    if (terrainOffset < 0) {
        terrainOffset = -(Math.pow(Math.abs(terrainOffset), 0.8));
    } else {
        terrainOffset = Math.pow(terrainOffset, 1.1);
    }
    
    // Add ridges to mountainous areas
    if (erosionNoise < 0.4) {
        let ridge = ridgeFbm2D(params.noise2D, wx / (params.terrainScale * 0.5), wz / (params.terrainScale * 0.5), 4);
        let ridgeWeight = (0.4 - erosionNoise) / 0.4; // 0 to 1
        terrainOffset += ridge * 15 * ridgeWeight;
    }

    let elevation = baseElevation + terrainOffset;
    
    // Apply terracing (e.g. for Badlands)
    if (terraceWeight > 0) {
        const terraceStep = 6;
        const terracedElevation = Math.floor(elevation / terraceStep) * terraceStep;
        const targetTerraced = elevation * 0.2 + terracedElevation * 0.8;
        elevation = elevation * (1.0 - terraceWeight) + targetTerraced * terraceWeight;
    }

    // Guarantee strict Minecraft terrain boundaries:
    // 1. Inland dry biomes (contNoise >= 0.35 and not swamp/water) MUST NEVER dip below seaLevel + 1.2 (surfaceY >= 63).
    //    This creates a solid natural dam/bank holding back any adjacent ocean or swamp water, completely eliminating
    //    floating walls of water and sub-sea-level dry grass basins.
    // 2. Swamps are shallow wetlands: channels dip 1-2 blocks below seaLevel (y=60-61) for shallow water; banks rise 1-3 blocks above (y=63-65).
    // 3. Coastal transitions ramp smoothly up to inland elevation.
    const isWaterBiome = (biome === BIOMES.DEEP_OCEAN || biome === BIOMES.OCEAN || biome === BIOMES.CORAL_REEF || biome === BIOMES.FROZEN_OCEAN || biome.isOcean || biome.isBeach || biome === BIOMES.BEACH);
    const isSwamp = (biome === BIOMES.SWAMP || biome.name === 'Swamp');

    if (!isWaterBiome) {
        if (isSwamp) {
            // Swamp wetland: channels dip 1-2 blocks below seaLevel for shallow water; banks rise 1-3 blocks above
            elevation = Math.max(params.seaLevel - 2.0, Math.min(params.seaLevel + 3.0, elevation));
        } else if (contNoise >= 0.35) {
            // Inland dry land: guaranteed to be at least seaLevel + 1.2 (surfaceY >= 63)
            elevation = Math.max(params.seaLevel + 1.2, elevation);
        } else {
            // Coastal transition: smoothly ramp between coast and inland
            const coastT = smoothstep(0.30, 0.35, contNoise);
            const minCoastElev = (params.seaLevel - 1.5) + coastT * 2.7;
            elevation = Math.max(minCoastElev, elevation);
        }
    }
    let surfaceY = Math.floor(elevation);
    if (surfaceY < 1) surfaceY = 1;
    if (surfaceY >= CHUNK_HEIGHT - 1) surfaceY = CHUNK_HEIGHT - 2;

    return {
        biome,
        surfaceY,
        targetHeight: elevation,
        erosionNoise,
        contNoise,
        weirdness,
        temp,
        moist,
        factor,
        colRng,
        bData: { isTerraced: terraceWeight > 0.5, lakeSurfaceY: 0 }
    };
}

function safeSetBlock(blocks, x, y, z, type, onlyAir = false, dataVal = 0) {
    if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < CHUNK_HEIGHT && z >= 0 && z < CHUNK_SIZE) {
        const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
        if (!onlyAir || blocks[idx] === BLOCKS.AIR) {
            blocks[idx] = type;
            if (blocks.data) {
                blocks.data[idx] = dataVal;
            }
        }
    }
}

function hasDirectAdjacentWater(blocks, tx, groundY, tz, wx, wz, params) {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dz] of dirs) {
        const nx = tx + dx;
        const nz = tz + dz;
        const nwx = wx + dx;
        const nwz = wz + dz;
        // In Minecraft Java, sugarcane strictly requires a water block directly horizontally adjacent
        // to the supporting soil block (at groundY or groundY - 1)
        for (const testY of [groundY, groundY - 1]) {
            if (testY < 1 || testY >= CHUNK_HEIGHT) continue;
            if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE) {
                const b = blocks[(testY * CHUNK_SIZE * CHUNK_SIZE) + (nz * CHUNK_SIZE) + nx];
                if (b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER) return true;
            } else {
                const nCol = getColumnInfo(nwx, nwz, params);
                if (nCol.bData && nCol.bData.lakeSurfaceY > 0) {
                    if (testY > nCol.surfaceY && testY <= nCol.bData.lakeSurfaceY && nCol.biome !== BIOMES.VOLCANIC) return true;
                }
                if (testY <= params.seaLevel && testY > nCol.surfaceY) {
                    if (nCol.biome !== BIOMES.VOLCANIC) return true;
                }
            }
        }
    }
    return false;
}

function generateSugarcane(blocks, x, y, z, rng) {
    // Generate 2 to 3 blocks high
    const height = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.SUGARCANE, true);
    }
}

function generateTallFern(blocks, x, y, z) {
    if (y + 1 < CHUNK_HEIGHT) {
        safeSetBlock(blocks, x, y, z, BLOCKS.TALL_FERN, true);
        safeSetBlock(blocks, x, y + 1, z, BLOCKS.TALL_FERN_TOP, true);
    } else {
        safeSetBlock(blocks, x, y, z, BLOCKS.FERN, true);
    }
}

function isFloraOrAir(b) {
    return b === BLOCKS.AIR || b === BLOCKS.TALL_GRASS || b === BLOCKS.FERN || 
           b === BLOCKS.TALL_FERN || b === BLOCKS.TALL_FERN_TOP || 
           b === BLOCKS.RED_FLOWER || b === BLOCKS.YELLOW_FLOWER || 
           b === BLOCKS.BLUE_FLOWER || b === BLOCKS.WHITE_FLOWER || 
           b === BLOCKS.PURPLE_FLOWER || b === BLOCKS.DEAD_BUSH || 
           b === BLOCKS.PINK_PETALS || b === BLOCKS.RED_MUSHROOM || 
           b === BLOCKS.BROWN_MUSHROOM;
}

function generateFallenLog(blocks, startX, startY, startZ, woodType, rng) {
    const length = 3 + Math.floor(rng() * 3); // 3 to 5 blocks
    const isXAxis = rng() < 0.5;
    const dx = isXAxis ? 1 : 0;
    const dz = isXAxis ? 0 : 1;
    const logAxisData = isXAxis ? 1 : 2; // 1 for X-axis, 2 for Z-axis

    const placedLogBlocks = [];

    for (let i = 0; i < length; i++) {
        const lx = startX + dx * i;
        const lz = startZ + dz * i;
        if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) break;

        let groundY = Math.min(CHUNK_HEIGHT - 3, startY + 2);
        while (groundY > 1 && isFloraOrAir(blocks[(groundY * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx])) {
            groundY--;
        }
        const bAt = blocks[(groundY * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx];
        if (bAt !== BLOCKS.GRASS && bAt !== BLOCKS.DIRT && bAt !== BLOCKS.PODZOL && bAt !== BLOCKS.MYCELIUM && bAt !== BLOCKS.MUD && bAt !== BLOCKS.SWAMP_GRASS) continue;

        const logY = groundY + 1;
        if (logY >= CHUNK_HEIGHT - 2) continue;

        const currentAtLog = blocks[(logY * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx];
        if (currentAtLog !== BLOCKS.AIR && !isFloraOrAir(currentAtLog)) {
            continue;
        }

        safeSetBlock(blocks, lx, logY, lz, woodType, false, logAxisData);
        placedLogBlocks.push({ lx, logY, lz });
    }

    // Place red or brown mushrooms on top of the fallen log only in dark or shaded forests (Dark Oak / Pine)
    const canHaveLogMushrooms = (woodType === BLOCKS.DARK_OAK_WOOD || woodType === BLOCKS.PINE_WOOD);
    if (canHaveLogMushrooms && placedLogBlocks.length > 0) {
        for (const pos of placedLogBlocks) {
            if (rng() < 0.18) {
                const shroomType = rng() < 0.5 ? BLOCKS.BROWN_MUSHROOM : BLOCKS.RED_MUSHROOM;
                safeSetBlock(blocks, pos.lx, pos.logY + 1, pos.lz, shroomType, false);
            }
        }
    }
}

function generateMangroveTree(blocks, x, y, z, rng) {
    // Mangrove tree features arching stilt root cages (MANGROVE_ROOTS and MUDDY_MANGROVE_ROOTS),
    // an elevated MANGROVE_LOG trunk, and a full dome canopy of MANGROVE_LEAVES with hanging VINES.
    const rootHeight = 2 + Math.floor(rng() * 3); // 2 to 4 blocks root cage height
    const trunkHeight = 5 + Math.floor(rng() * 4); // 5 to 8 blocks trunk
    const hubY = y + rootHeight;
    if (hubY + trunkHeight + 5 >= CHUNK_HEIGHT) return;

    // 1. Root cage: arching tendrils descending from hubY
    const rootDirs = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [-1, -1], [1, -1], [-1, 1]
    ];
    for (const [rdx, rdz] of rootDirs) {
        if (rng() < 0.85) {
            let rx = x;
            let rz = z;
            let ry = hubY;
            while (ry >= y - 1 && ry > 0) {
                ry--;
                if (rng() < 0.7) {
                    rx += rdx;
                    rz += rdz;
                }
                const cur = (rx >= 0 && rx < CHUNK_SIZE && rz >= 0 && rz < CHUNK_SIZE) ? blocks[(ry * CHUNK_SIZE * CHUNK_SIZE) + (rz * CHUNK_SIZE) + rx] : BLOCKS.AIR;
                const isMuddy = (cur === BLOCKS.MUD || cur === BLOCKS.DIRT || cur === BLOCKS.SWAMP_GRASS);
                const rootType = isMuddy ? BLOCKS.MUDDY_MANGROVE_ROOTS : BLOCKS.MANGROVE_ROOTS;
                safeSetBlock(blocks, rx, ry, rz, rootType, false);
                if (isMuddy) break;
            }
        }
    }
    // Central root core under hub
    for (let cy = y; cy <= hubY; cy++) {
        const cur = (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) ? blocks[(cy * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x] : BLOCKS.AIR;
        const rootType = (cur === BLOCKS.MUD || cur === BLOCKS.DIRT) ? BLOCKS.MUDDY_MANGROVE_ROOTS : BLOCKS.MANGROVE_ROOTS;
        safeSetBlock(blocks, x, cy, z, rootType, false);
    }

    // 2. Elevated trunk (Mangrove Log) rising up from hubY
    let tx = x;
    let tz = z;
    for (let ty = hubY; ty <= hubY + trunkHeight; ty++) {
        safeSetBlock(blocks, tx, ty, tz, BLOCKS.MANGROVE_LOG, false, 0); // 0 = Y axis
        // Natural organic curve in trunk
        if (ty === hubY + Math.floor(trunkHeight * 0.5) && rng() < 0.45) {
            const bDir = rootDirs[Math.floor(rng() * 4)];
            tx += bDir[0];
            tz += bDir[1];
            safeSetBlock(blocks, tx, ty, tz, BLOCKS.MANGROVE_LOG, false, 0);
        }
    }

    // 3. Canopy: dome of Mangrove Leaves with hanging Vines
    const topY = hubY + trunkHeight;
    const leafRadius = 3;
    for (let dy = -2; dy <= 2; dy++) {
        const r = (dy === 2) ? 1 : (dy === -2 ? 2 : leafRadius);
        for (let ldx = -r; ldx <= r; ldx++) {
            for (let ldz = -r; ldz <= r; ldz++) {
                if (Math.abs(ldx) + Math.abs(ldz) > r + 1.2) continue;
                const ly = topY + dy;
                const lx = tx + ldx;
                const lz = tz + ldz;
                safeSetBlock(blocks, lx, ly, lz, BLOCKS.MANGROVE_LEAVES, true);

                // Hanging vines dangling from canopy perimeter
                if (dy <= 0 && (Math.abs(ldx) === r || Math.abs(ldz) === r) && rng() < 0.4) {
                    const vineLen = 1 + Math.floor(rng() * 3);
                    for (let vi = 1; vi <= vineLen; vi++) {
                        safeSetBlock(blocks, lx, ly - vi, lz, BLOCKS.VINES, true);
                    }
                }
            }
        }
    }
}

function generateMushroomClump(blocks, centerX, startY, centerZ, rng) {
    const count = 2 + Math.floor(rng() * 3); // 2 to 4 mushrooms in a sparse clump
    const baseType = rng() < 0.5 ? BLOCKS.BROWN_MUSHROOM : BLOCKS.RED_MUSHROOM;

    for (let i = 0; i < count; i++) {
        const ox = Math.floor((rng() - 0.5) * 4);
        const oz = Math.floor((rng() - 0.5) * 4);
        const mx = centerX + ox;
        const mz = centerZ + oz;
        if (mx < 0 || mx >= CHUNK_SIZE || mz < 0 || mz >= CHUNK_SIZE) continue;

        let groundY = Math.min(CHUNK_HEIGHT - 3, startY + 2);
        while (groundY > 1 && isFloraOrAir(blocks[(groundY * CHUNK_SIZE * CHUNK_SIZE) + (mz * CHUNK_SIZE) + mx])) {
            groundY--;
        }
        const groundB = blocks[(groundY * CHUNK_SIZE * CHUNK_SIZE) + (mz * CHUNK_SIZE) + mx];
        if (groundB === BLOCKS.GRASS || groundB === BLOCKS.DIRT || groundB === BLOCKS.PODZOL || groundB === BLOCKS.MYCELIUM || groundB === BLOCKS.DARK_OAK_WOOD || groundB === BLOCKS.REDWOOD_LOG || groundB === BLOCKS.WOOD) {
            const shroomType = rng() < 0.3 ? (baseType === BLOCKS.BROWN_MUSHROOM ? BLOCKS.RED_MUSHROOM : BLOCKS.BROWN_MUSHROOM) : baseType;
            safeSetBlock(blocks, mx, groundY + 1, mz, shroomType, false);
        }
    }
}

function generateOreVein(blocks, wx, y, wz, oreType, minSize, maxSize, rng) {
    const size = minSize + Math.floor(rng() * (maxSize - minSize + 1));
    let currentX = wx;
    let currentY = y;
    let currentZ = wz;
    
    for (let i = 0; i < size; i++) {
        // Place ore if it's within chunk bounds and is stone
        if (currentX >= 0 && currentX < CHUNK_SIZE && currentY >= 0 && currentY < CHUNK_HEIGHT && currentZ >= 0 && currentZ < CHUNK_SIZE) {
            const idx = (currentY * CHUNK_SIZE * CHUNK_SIZE) + (currentZ * CHUNK_SIZE) + currentX;
            if (blocks[idx] === BLOCKS.STONE) {
                blocks[idx] = oreType;
            }
        }
        
        // Random walk to adjacent block
        const dir = Math.floor(rng() * 6);
        if (dir === 0) currentX++;
        else if (dir === 1) currentX--;
        else if (dir === 2) currentY++;
        else if (dir === 3) currentY--;
        else if (dir === 4) currentZ++;
        else if (dir === 5) currentZ--;
    }
}

function generateWizardTower(blocks, baseX, baseY, baseZ, rng) {
    const radius = 4;
    const height = 20;
    
    for (let y = 0; y < height; y++) {
        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                // Circle check
                if (x*x + z*z <= radius*radius) {
                    const isEdge = x*x + z*z > (radius-1)*(radius-1);
                    const localY = baseY + y;
                    
                    if (isEdge) {
                        // Wall
                        let type = rng() < 0.2 ? BLOCKS.MOSSY_COBBLESTONE : BLOCKS.STONE_BRICKS;
                        // Windows on each floor
                        if ((y === 3 || y === 4 || y === 10 || y === 11 || y === 17 || y === 18) && (x === 0 || z === 0)) {
                            type = BLOCKS.GLASS;
                        }
                        // Door
                        if (y === 0 && x === 0 && z === radius) {
                            type = BLOCKS.DUNGEON_DOOR;
                        } else if (y === 1 && x === 0 && z === radius) {
                            type = BLOCKS.DUNGEON_DOOR_TOP;
                        }
                        safeSetBlock(blocks, baseX + x, localY, baseZ + z, type);
                    } else {
                        // Interior
                        let type = BLOCKS.AIR;
                        
                        // Floors
                        if (y === 0 || y === 7 || y === 14) {
                            type = BLOCKS.PLANKS;
                        }
                        
                        // Ladder column
                        if (x === 1 && z === 0) {
                            type = BLOCKS.LADDER;
                        }
                        
                        // Furniture
                        if (y === 1 && x === -2 && z === -2) type = BLOCKS.FURNACE;
                        if (y === 1 && x === -radius+1 && z > 0) type = BLOCKS.BOOKSHELF;
                        
                        if (y === 8 && x === 0 && z === 0) type = BLOCKS.GLOWSTONE;
                        if (y === 8 && (Math.abs(x) === 2 && Math.abs(z) === 2)) type = BLOCKS.ALIEN_CRYSTAL;
                        if (y === 8 && x === -radius+1 && z === -radius+1) type = BLOCKS.CHEST_BLOCK;
                        
                        if (y === 15 && x === 0 && z === 0) type = BLOCKS.MANA_ORE;
                        if (y === 15 && x === -radius+1 && z === radius-1) type = BLOCKS.CHEST_BLOCK;
                        
                        // Roof dome
                        if (y === height - 1 && x*x + z*z <= (radius-2)*(radius-2)) {
                            type = BLOCKS.GLASS;
                        }
                        
                        safeSetBlock(blocks, baseX + x, localY, baseZ + z, type);
                    }
                }
            }
        }
    }
}

function generateAncientPyramid(blocks, baseX, baseY, baseZ, rng) {
    const size = 15; // Must be odd
    const half = Math.floor(size / 2);
    
    for (let y = 0; y < half + 1; y++) {
        const curRadius = half - y;
        for (let x = -curRadius; x <= curRadius; x++) {
            for (let z = -curRadius; z <= curRadius; z++) {
                const localY = baseY + y;
                // Hollow inside
                const isEdge = Math.abs(x) === curRadius || Math.abs(z) === curRadius || y === 0;
                
                if (isEdge) {
                    let type = rng() < 0.2 ? BLOCKS.SANDSTONE : BLOCKS.SMOOTH_SANDSTONE;
                    // Entrance
                    if (y > 0 && y < 3 && x === 0 && z === curRadius) {
                        type = BLOCKS.AIR;
                    }
                    safeSetBlock(blocks, baseX + x, localY, baseZ + z, type);
                } else {
                    safeSetBlock(blocks, baseX + x, localY, baseZ + z, BLOCKS.AIR);
                }
            }
        }
    }
    
    // Center loot
    safeSetBlock(blocks, baseX, baseY + 1, baseZ, BLOCKS.CHEST_BLOCK);
    safeSetBlock(blocks, baseX, baseY + 2, baseZ, BLOCKS.TORCH);
}
// Generate the chunk terrain via Multi-Pass Feature Placement Pipeline
export function generateChunkTerrain(cx, cz, params) {
    const blocks = new Uint16Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    blocks.data = data;

    const blockIndex = (x, y, z) => (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

    if (params && params.isSuperflat) {
        const surfaceBlock = (params.forcedBiome && params.forcedBiome.surface) ? params.forcedBiome.surface : BLOCKS.GRASS;
        const subBlock = (params.forcedBiome && params.forcedBiome.dirt) ? params.forcedBiome.dirt : BLOCKS.DIRT;
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                blocks[blockIndex(x, 0, z)] = BLOCKS.BEDROCK;
                blocks[blockIndex(x, 1, z)] = subBlock;
                blocks[blockIndex(x, 2, z)] = subBlock;
                blocks[blockIndex(x, 3, z)] = subBlock;
                blocks[blockIndex(x, 4, z)] = surfaceBlock;
            }
        }
        return blocks;
    }

    const wxBase = cx * CHUNK_SIZE;
    const wzBase = cz * CHUNK_SIZE;

    // Cache column infos for the 16x16 chunk
    const columns = [];
    for (let x = 0; x < CHUNK_SIZE; x++) {
        columns[x] = [];
        for (let z = 0; z < CHUNK_SIZE; z++) {
            columns[x][z] = getColumnInfo(wxBase + x, wzBase + z, params);
        }
    }

    // Helper to query actual top solid ground block in chunk for placing features
    function getTopGround(tx, tz) {
        if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE) return -1;
        for (let y = CHUNK_HEIGHT - 3; y >= 1; y--) {
            const b = blocks[(y * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx];
            if (b !== BLOCKS.AIR && b !== BLOCKS.WATER && b !== BLOCKS.SWAMP_WATER && b !== BLOCKS.LAVA) {
                return y;
            }
        }
        return -1;
    }

    // ============================================
    // PASS 1: Base Terrain Shape via Minecraft 3D Noise Density Field
    // ============================================
    const CELL_H = 4;
    const CELL_V = 4;
    const GRID_X = (CHUNK_SIZE / CELL_H) + 1;   // 5
    const GRID_Z = (CHUNK_SIZE / CELL_H) + 1;   // 5
    const GRID_Y = (CHUNK_HEIGHT / CELL_V) + 1; // 33

    // Sample 5x33x5 coarse density grid
    const densityGrid = new Float32Array(GRID_X * GRID_Y * GRID_Z);
    const gridIndex = (gx, gy, gz) => (gy * GRID_X * GRID_Z) + (gz * GRID_X) + gx;

    for (let gx = 0; gx < GRID_X; gx++) {
        for (let gz = 0; gz < GRID_Z; gz++) {
            const lx = Math.min(gx * CELL_H, CHUNK_SIZE - 1);
            const lz = Math.min(gz * CELL_H, CHUNK_SIZE - 1);
            const col = columns[lx][lz];
            const targetHeight = col.targetHeight;
            const erosion = col.erosionNoise;
            const biome = col.biome;

            const wx = wxBase + gx * CELL_H;
            const wz = wzBase + gz * CELL_H;

            // In Minecraft:
            // High erosion = gentle rolling hills & flat plains
            // Low erosion = dramatic cliffs, bluffs, and mountain ranges.
            // Continuous overhang strength ensures seamless blends without cliff seams at biome borders:
            const mountainBlend = Math.max(0, Math.min(1, (0.42 - erosion) / 0.16));
            let overhangStrength = 0.06 + mountainBlend * 0.45;
            if (biome.name === 'Badlands' || biome.name === 'Savanna') {
                overhangStrength = Math.max(overhangStrength, 0.12);
            }

            for (let gy = 0; gy < GRID_Y; gy++) {
                const wy = gy * CELL_V;

                // 1. Base vertical height gradient (positive below targetHeight, negative above)
                // Divisor of 3.5 gives crisp authentic Minecraft rolling hills
                let grad = (targetHeight - wy) / 3.5;

                // Bedrock solid floor enforcement near world bottom
                if (wy < 4) {
                    grad += (4 - wy) * 3.0;
                }
                // Ceiling taper to keep mountains inside the chunk height limit
                if (wy > CHUNK_HEIGHT - 12) {
                    grad -= (wy - (CHUNK_HEIGHT - 12)) * 2.2;
                }

                // Guarantee solid ground below sea level for inland dry terrain:
                // Prevents accidental subterranean dips or air pockets below seaLevel in inland dry biomes
                const isWaterBiome = (biome.isOcean || biome.isBeach || biome === BIOMES.SWAMP || col.contNoise < 0.33);
                if (!isWaterBiome && wy <= params.seaLevel) {
                    grad = Math.max(grad, 0.45);
                }

                // 2. 3D Noise (Minecraft 3D Perlin shape + detail)
                const n3D = params.noise3D(wx * 0.022, wy * 0.028, wz * 0.022);
                const detail3D = params.caveNoise(wx * 0.055, wy * 0.070, wz * 0.055);
                const combined3D = n3D + detail3D * 0.35;

                // 3. Final density
                const density = grad + (combined3D * overhangStrength);
                densityGrid[gridIndex(gx, gy, gz)] = density;
            }
        }
    }

    // Trilinearly interpolate inside each 4x4x4 block cell
    for (let cx_cell = 0; cx_cell < CHUNK_SIZE / CELL_H; cx_cell++) {
        for (let cz_cell = 0; cz_cell < CHUNK_SIZE / CELL_H; cz_cell++) {
            for (let cy_cell = 0; cy_cell < CHUNK_HEIGHT / CELL_V; cy_cell++) {
                const c000 = densityGrid[gridIndex(cx_cell, cy_cell, cz_cell)];
                const c100 = densityGrid[gridIndex(cx_cell + 1, cy_cell, cz_cell)];
                const c010 = densityGrid[gridIndex(cx_cell, cy_cell + 1, cz_cell)];
                const c110 = densityGrid[gridIndex(cx_cell + 1, cy_cell + 1, cz_cell)];
                const c001 = densityGrid[gridIndex(cx_cell, cy_cell, cz_cell + 1)];
                const c101 = densityGrid[gridIndex(cx_cell + 1, cy_cell, cz_cell + 1)];
                const c011 = densityGrid[gridIndex(cx_cell, cy_cell + 1, cz_cell + 1)];
                const c111 = densityGrid[gridIndex(cx_cell + 1, cy_cell + 1, cz_cell + 1)];

                const baseX = cx_cell * CELL_H;
                const baseZ = cz_cell * CELL_H;
                const baseY = cy_cell * CELL_V;

                for (let dx = 0; dx < CELL_H; dx++) {
                    const fx = dx * 0.25;
                    const d00 = c000 + (c100 - c000) * fx;
                    const d10 = c010 + (c110 - c010) * fx;
                    const d01 = c001 + (c101 - c001) * fx;
                    const d11 = c011 + (c111 - c011) * fx;

                    const blockX = baseX + dx;

                    for (let dz = 0; dz < CELL_H; dz++) {
                        const fz = dz * 0.25;
                        const d0 = d00 + (d01 - d00) * fz;
                        const d1 = d10 + (d11 - d10) * fz;

                        const blockZ = baseZ + dz;
                        const { biome, bData } = columns[blockX][blockZ];

                        for (let dy = 0; dy < CELL_V; dy++) {
                            const fy = dy * 0.25;
                            const density = d0 + (d1 - d0) * fy;
                            const blockY = baseY + dy;

                            const idx = blockIndex(blockX, blockY, blockZ);

                            if (blockY === 0) {
                                blocks[idx] = BLOCKS.BEDROCK;
                            } else if (density > 0) {
                                blocks[idx] = BLOCKS.STONE;
                            } else if (bData.lakeSurfaceY > 0 && blockY <= bData.lakeSurfaceY) {
                                const waterType = biome === BIOMES.VOLCANIC ? BLOCKS.LAVA : (biome === BIOMES.SWAMP ? BLOCKS.SWAMP_WATER : BLOCKS.WATER);
                                blocks[idx] = (blockY === bData.lakeSurfaceY && (biome === BIOMES.TUNDRA || biome === BIOMES.ICE_SPIKES || biome === BIOMES.MOUNTAINS)) ? BLOCKS.ICE : waterType;
                            } else if (blockY <= params.seaLevel) {
                                const waterType = biome === BIOMES.VOLCANIC ? BLOCKS.LAVA : (biome === BIOMES.SWAMP ? BLOCKS.SWAMP_WATER : BLOCKS.WATER);
                                if (biome === BIOMES.ICE_SPIKES) {
                                    // Frozen Ocean under Ice Spikes: authentic ice surface sheet of packed ice & blue ice
                                    if (blockY === params.seaLevel) {
                                        const rIce = (params.noise2D((wxBase + blockX) * 0.15, (wzBase + blockZ) * 0.15) + 1) / 2;
                                        blocks[idx] = rIce < 0.55 ? BLOCKS.PACKED_ICE : (rIce < 0.85 ? BLOCKS.BLUE_ICE : BLOCKS.ICE);
                                    } else if (blockY >= params.seaLevel - 2) {
                                        const rSub = (params.noise2D((wxBase + blockX) * 0.15 + 50, (wzBase + blockZ) * 0.15 + 50) + 1) / 2;
                                        blocks[idx] = rSub < 0.65 ? BLOCKS.PACKED_ICE : BLOCKS.BLUE_ICE;
                                    } else {
                                        blocks[idx] = BLOCKS.WATER;
                                    }
                                } else {
                                    blocks[idx] = (blockY === params.seaLevel && (biome === BIOMES.TUNDRA || biome === BIOMES.MOUNTAINS)) ? BLOCKS.ICE : waterType;
                                }
                            } else {
                                blocks[idx] = BLOCKS.AIR;
                            }
                        }
                    }
                }
            }
        }
    }

    // ============================================
    // PASS 2: 3D Cave Carvers & Global Dungeons (Subterranean Only)
    // ============================================
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = wxBase + x;
            const wz = wzBase + z;
            const col = columns[x][z];

            // Subterranean rule: Caves strictly carve underground (never pierce top 5 blocks of surface)
            const maxCaveY = Math.min(54, col.surfaceY - 5);

            for (let y = 1; y <= maxCaveY; y++) {
                const idx = blockIndex(x, y, z);
                if (blocks[idx] !== BLOCKS.STONE) continue;

                const c = fbm3D(params.caveNoise, wx / params.caveScale, y / (params.caveScale * 0.8), wz / params.caveScale, 3);
                if (c > params.caveThreshold) {
                    if (y <= 9) {
                        blocks[idx] = BLOCKS.LAVA; // Deep underground lava lakes
                    } else {
                        blocks[idx] = BLOCKS.AIR;
                    }
                }
            }
        }
    }
    carveGlobalDungeons(blocks, cx, cz, params);

    // ============================================
    // PASS 2B: Very Rare Deep Underground Dripstone Clumps
    // ============================================
    const dripRng = seededRandom(params.seed + cx * 7919 + cz * 31337);
    if (dripRng() < 0.05) { // Very rare chance per chunk (~5%) strictly deep underground
        for (let attempt = 0; attempt < 2; attempt++) {
            const rx = 3 + Math.floor(dripRng() * (CHUNK_SIZE - 6));
            const rz = 3 + Math.floor(dripRng() * (CHUNK_SIZE - 6));
            const ry = 10 + Math.floor(dripRng() * 16); // Deep subterranean: y 10 to 26
            const idx = blockIndex(rx, ry, rz);
            if (blocks[idx] === BLOCKS.AIR) {
                let hasStoneNearby = false;
                for (let dy = -3; dy <= 3; dy++) {
                    const checkY = ry + dy;
                    if (checkY > 0 && checkY < CHUNK_HEIGHT) {
                        if (blocks[blockIndex(rx, checkY, rz)] === BLOCKS.STONE) {
                            hasStoneNearby = true;
                            break;
                        }
                    }
                }
                if (hasStoneNearby) {
                    generateDripstoneClump(blocks, rx, ry, rz, dripRng, columns, params);
                    break;
                }
            }
        }
    }

    // ============================================
    // PASS 3: Multi-Layer Surface Rules (Arches, Overhangs, Soil, Mud, Beaches)
    // ============================================
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = wxBase + x;
            const wz = wzBase + z;
            const { biome, colRng, bData, temp, moist, contNoise, erosionNoise, weirdness } = columns[x][z];
            const isSwamp = (biome === BIOMES.SWAMP || biome.name === 'Swamp' || biome.swampFlora);

            // Check if swamp has natural mud bogs here
            let isSwampMud = false;
            if (isSwamp) {
                const bogNoise = (params.noise2D(wx * 0.035 + 888, wz * 0.035 + 888) + 1) / 2;
                if (bogNoise > 0.68) {
                    isSwampMud = true;
                }
            }

            const isColdBiome = (biome === BIOMES.TUNDRA || biome === BIOMES.ICE_SPIKES || biome === BIOMES.MOUNTAINS || biome.name === 'Tundra' || biome.name === 'Ice Spikes' || biome.name === 'Mountains');
            const hasSandyBeach = (biome === BIOMES.BEACH || biome === BIOMES.DESERT || biome === BIOMES.OASIS || biome.name === 'Beach' || biome.name === 'Desert');

            // High-frequency surface dither noise (3 to 6 block patch wavelength) for organic Minecraft-like boundary blending
            const dither1 = params.noise2D(wx * 0.22 + 400, wz * 0.22 + 400);
            const dither2 = params.noise2D(wx * 0.44 + 800, wz * 0.44 + 800) * 0.4;
            const surfaceNoise = dither1 + dither2;

            // Organic topsoil depth (2 to 4 blocks deep, varies by slope and noise like Minecraft)
            const soilLimit = 2 + Math.floor((params.noise2D(wx * 0.08 + 111, wz * 0.08 + 111) + 1.0) * 1.1);

            let depth = -1;
            let hitTrueSurface = false;
            for (let y = CHUNK_HEIGHT - 2; y >= 1; y--) {
                const idx = blockIndex(x, y, z);
                const b = blocks[idx];

                if (b === BLOCKS.AIR || b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER || b === BLOCKS.LAVA || b === BLOCKS.ICE) {
                    if (!hitTrueSurface) {
                        depth = -1; // Reset surface depth only before hitting the true sky surface
                    }
                    continue;
                }

                if (b !== BLOCKS.STONE) {
                    continue; // Skip blocks already altered
                }

                if (depth === -1 && !hitTrueSurface) {
                    // Top exposed surface!
                    hitTrueSurface = true;
                    depth = 0;
                    const aboveIdx = blockIndex(x, y + 1, z);
                    const aboveBlock = blocks[aboveIdx];
                    const isUnderwater = aboveBlock === BLOCKS.WATER || aboveBlock === BLOCKS.SWAMP_WATER || aboveBlock === BLOCKS.ICE;
                    const isNearSeaShore = (y <= params.seaLevel + 3 && y >= params.seaLevel - 4);
                    const isActualCoastalBeach = hasSandyBeach || (contNoise < 0.35 && !isColdBiome && !isSwamp && biome.name !== 'Mountains');

                    let type;
                    if (isUnderwater) {
                        const waterDepth = Math.max(0, params.seaLevel - y);
                        if (isColdBiome) {
                            type = BLOCKS.GRAVEL;
                        } else if (isSwamp) {
                            type = BLOCKS.MUD; // Underwater beds in swamps are always rich mud
                        } else if (isActualCoastalBeach) {
                            // Shallow water shelf is authentic Minecraft sand with gravel transitions on coastal shores
                            type = (waterDepth <= 3 || surfaceNoise > -0.25) ? BLOCKS.SAND : BLOCKS.GRAVEL;
                        } else {
                            // Inland waterbeds in Plains / Forest / etc: dirt, gravel (like Minecraft, NO sand!)
                            type = (surfaceNoise < -0.3) ? BLOCKS.GRAVEL : BLOCKS.DIRT;
                        }
                    } else if (isNearSeaShore && isActualCoastalBeach) {
                        // Authentic Minecraft Shoreline: Sandy beach only on actual coastal beaches / beach biomes
                        if (hasSandyBeach) {
                            type = BLOCKS.SAND;
                        } else if (y <= params.seaLevel + 1) {
                            type = (surfaceNoise < -0.5) ? BLOCKS.GRAVEL : BLOCKS.SAND;
                        } else {
                            type = biome.surface;
                        }
                    } else if (biome.isVolcanic) {
                        const vRoll = colRng();
                        if (vRoll < 0.15) type = BLOCKS.MAGMA;
                        else if (vRoll < 0.25) type = BLOCKS.SMOOTH_BASALT;
                        else if (vRoll < 0.30) type = BLOCKS.CRYING_OBSIDIAN;
                        else if (vRoll < 0.40) type = BLOCKS.OBSIDIAN;
                        else type = BLOCKS.BASALT;
                    } else if (isSwamp) {
                        const isWaterEdge = (y <= params.seaLevel + 1);
                        type = (isSwampMud || (isWaterEdge && surfaceNoise > 0.15)) ? BLOCKS.MUD : BLOCKS.SWAMP_GRASS;
                    } else if (biome === BIOMES.BADLANDS || biome.name === 'Badlands') {
                        type = (weirdness < 0.44 && temp > 0.74) ? BLOCKS.RED_SAND : BLOCKS.TERRACOTTA;
                    } else if (biome === BIOMES.ICE_SPIKES || biome.name === 'Ice Spikes') {
                        // Authentic Ice Spikes: packed ice and blue ice floor (no snow on bottom)
                        const iceRoll = colRng();
                        if (iceRoll < 0.60) type = BLOCKS.PACKED_ICE;
                        else if (iceRoll < 0.88) type = BLOCKS.BLUE_ICE;
                        else type = BLOCKS.ICE;
                    } else if (biome.isRedwood) {
                        type = BLOCKS.PODZOL;
                    } else if (biome.name === 'Mountains' || biome === BIOMES.MOUNTAINS) {
                        // Authentic Minecraft Mountains: lush grass on lower slopes, rock and snow at high altitudes
                        if (y >= 95) {
                            type = (surfaceNoise > 0.2) ? BLOCKS.STONE : BLOCKS.SNOW;
                        } else if (y >= 80) {
                            type = (surfaceNoise > 0.1) ? BLOCKS.STONE : BLOCKS.GRASS;
                        } else {
                            type = BLOCKS.GRASS;
                        }
                    } else {
                        type = biome.surface;
                    }
                    blocks[idx] = type;
                } else if (depth < soilLimit) {
                    // Subsurface soil layer (depth 1 to soilLimit)
                    depth++;
                    const surfaceBlock = blocks[blockIndex(x, y + depth, z)];
                    let type;
                    if (biome.isVolcanic) {
                        type = colRng() < 0.5 ? BLOCKS.BLACKSTONE : BLOCKS.SMOOTH_BASALT;
                    } else if (biome === BIOMES.ICE_SPIKES || biome.name === 'Ice Spikes') {
                        type = (colRng() < 0.65) ? BLOCKS.PACKED_ICE : BLOCKS.BLUE_ICE;
                    } else if (surfaceBlock === BLOCKS.SAND) {
                        type = (depth >= 3 && (temp > 0.75 || hasSandyBeach)) ? BLOCKS.SANDSTONE : BLOCKS.SAND;
                    } else if (surfaceBlock === BLOCKS.RED_SAND || surfaceBlock === BLOCKS.TERRACOTTA) {
                        type = BLOCKS.TERRACOTTA;
                    } else if (surfaceBlock === BLOCKS.MUD) {
                        type = (colRng() < 0.6) ? BLOCKS.MUD : BLOCKS.DIRT;
                    } else if (surfaceBlock === BLOCKS.GRAVEL) {
                        type = BLOCKS.GRAVEL;
                    } else if (surfaceBlock === BLOCKS.DIRT || surfaceBlock === BLOCKS.ROOTED_DIRT) {
                        type = BLOCKS.DIRT;
                    } else if (surfaceBlock === BLOCKS.SNOW && biome.name === 'Mountains') {
                        type = (colRng() < 0.4) ? BLOCKS.STONE : BLOCKS.DIRT;
                    } else {
                        type = biome.dirt;
                    }
                    blocks[idx] = type;
                } else {
                    depth++;
                }
            }
            // In cold biomes, freeze surface water exposed directly to air
            if (isColdBiome) {
                for (let y = CHUNK_HEIGHT - 2; y >= 1; y--) {
                    const idx = blockIndex(x, y, z);
                    const b = blocks[idx];
                    if (b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER) {
                        const aboveIdx = blockIndex(x, y + 1, z);
                        if (blocks[aboveIdx] === BLOCKS.AIR) {
                            blocks[idx] = BLOCKS.ICE;
                        }
                        break; // Only the top water layer freezes!
                    } else if (b !== BLOCKS.AIR) {
                        break;
                    }
                }
            }
        }
    }

    // ============================================
    // PASS 3B: Shoreline & Beach Lone Water Cleanup
    // Eliminates isolated 1x1/pothole water blocks along beaches and shorelines
    // ============================================
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const col = columns[x][z];
            if (col.biome === BIOMES.SWAMP || col.biome.name === 'Swamp') continue; // Preserve authentic wetland water channels!
            for (let y = params.seaLevel; y >= params.seaLevel - 1; y--) {
                const idx = blockIndex(x, y, z);
                const b = blocks[idx];
                if (b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER) {
                    let solidNeighbors = 0;
                    let sandNeighbors = 0;
                    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    for (const [dx, dz] of dirs) {
                        const nx = x + dx;
                        const nz = z + dz;
                        let isSolid = false;
                        if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE) {
                            const nb = blocks[blockIndex(nx, y, nz)];
                            if (nb !== BLOCKS.AIR && nb !== BLOCKS.WATER && nb !== BLOCKS.SWAMP_WATER && nb !== BLOCKS.LAVA && nb !== BLOCKS.ICE) {
                                isSolid = true;
                                if (nb === BLOCKS.SAND || nb === BLOCKS.SANDSTONE) sandNeighbors++;
                            }
                        } else {
                            const nCol = getColumnInfo(wxBase + nx, wzBase + nz, params);
                            if (nCol.surfaceY >= y) {
                                isSolid = true;
                                if (nCol.biome === BIOMES.BEACH || nCol.biome === BIOMES.DESERT || nCol.biome === BIOMES.OASIS) sandNeighbors++;
                            }
                        }
                        if (isSolid) solidNeighbors++;
                    }

                    const isBeachCol = col.biome === BIOMES.BEACH || col.biome === BIOMES.DESERT || col.biome === BIOMES.OASIS || col.biome.name === 'Beach' || col.biome.name === 'Desert';
                    const isIsolatedPothole = solidNeighbors >= 3;

                    if (isIsolatedPothole) {
                        const fillBlock = isBeachCol ? BLOCKS.SAND : col.biome.surface;
                        const fillSub = isBeachCol ? BLOCKS.SAND : col.biome.dirt;
                        blocks[idx] = fillBlock;
                        for (let dy = y - 1; dy >= Math.max(1, y - 4); dy--) {
                            const underIdx = blockIndex(x, dy, z);
                            const ub = blocks[underIdx];
                            if (ub === BLOCKS.WATER || ub === BLOCKS.SWAMP_WATER || ub === BLOCKS.AIR) {
                                blocks[underIdx] = fillSub;
                            } else {
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    // ============================================
    // PASS 4: Ore Veins
    // ============================================
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const { surfaceY, colRng } = columns[x][z];
            for (let y = 1; y < surfaceY - 4; y++) {
                const idx = blockIndex(x, y, z);
                if (blocks[idx] === BLOCKS.STONE && colRng() < 0.02) {
                    let oreType = BLOCKS.IRON_ORE;
                    let minS = 1, maxS = 6;
                    if (y < 15 && colRng() < 0.15) { oreType = BLOCKS.DIAMOND_ORE; minS = 1; maxS = 4; }
                    else if (y < 22 && colRng() < 0.18) { oreType = BLOCKS.RUBY_ORE; minS = 1; maxS = 4; }
                    else if (y < 22 && colRng() < 0.18) { oreType = BLOCKS.SAPPHIRE_ORE; minS = 1; maxS = 4; }
                    else if (y < 20 && colRng() < 0.2) { oreType = BLOCKS.CRYSTAL_ORE; minS = 1; maxS = 3; }
                    else if (y < 30 && colRng() < 0.3) { oreType = BLOCKS.MANA_ORE; minS = 1; maxS = 3; }
                    else if (colRng() < 0.1) { oreType = BLOCKS.GOLD_ORE; minS = 2; maxS = 5; }
                    else if (colRng() < 0.3) { oreType = BLOCKS.COAL_ORE; minS = 3; maxS = 10; }

                    generateOreVein(blocks, x, y, z, oreType, minS, maxS, colRng);
                }
            }
        }
    }

    // ============================================
    // PASS 5: Structures
    // ============================================
    const isAreaValidForStructure = (centerX, centerZ, baseSurfaceY, radius) => {
        if (baseSurfaceY <= params.seaLevel + 1) return false;
        for (let dx = -radius; dx <= radius; dx += 2) {
            for (let dz = -radius; dz <= radius; dz += 2) {
                const wx = wxBase + centerX + dx;
                const wz = wzBase + centerZ + dz;
                const col = getColumnInfo(wx, wz, params);
                if (col.surfaceY <= params.seaLevel) return false;
                if (col.biome === BIOMES.DEEP_OCEAN || col.biome === BIOMES.OCEAN || col.biome === BIOMES.CORAL_REEF || col.biome === BIOMES.FROZEN_OCEAN) return false;
                if (col.bData && col.bData.lakeSurfaceY && col.surfaceY <= col.bData.lakeSurfaceY) return false;

                const qx = centerX + dx;
                const qz = centerZ + dz;
                if (qx >= 0 && qx < CHUNK_SIZE && qz >= 0 && qz < CHUNK_SIZE) {
                    const topG = getTopGround(qx, qz);
                    if (topG <= params.seaLevel) return false;
                    if (Math.abs(topG - baseSurfaceY) > 5) return false; // Steep cliff or hole
                    for (let sy = Math.max(1, baseSurfaceY - 1); sy <= Math.min(CHUNK_HEIGHT - 2, baseSurfaceY + 4); sy++) {
                        const b = blocks[(sy * CHUNK_SIZE * CHUNK_SIZE) + (qz * CHUNK_SIZE) + qx];
                        if (b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER || b === BLOCKS.LAVA) return false;
                    }
                }
            }
        }
        return true;
    };

    for (let tx = -3; tx <= CHUNK_SIZE + 2; tx++) {
        for (let tz = -3; tz <= CHUNK_SIZE + 2; tz++) {
            const wx = wxBase + tx;
            const wz = wzBase + tz;
            const colInfo = getColumnInfo(wx, wz, params);
            const biome = colInfo.biome;
            let surfaceY = getTopGround(tx, tz);
            if (surfaceY <= 0) surfaceY = colInfo.surfaceY;
            if (surfaceY <= params.seaLevel + 1 || surfaceY >= CHUNK_HEIGHT - 10) continue;
            if (colInfo.bData && colInfo.bData.lakeSurfaceY && surfaceY <= colInfo.bData.lakeSurfaceY) continue;
            if (biome === BIOMES.DEEP_OCEAN || biome === BIOMES.OCEAN || biome === BIOMES.CORAL_REEF || biome === BIOMES.FROZEN_OCEAN) continue;

            const structRng = seededRandom(params.seed + wx * 7777 + wz);
            const r = structRng();

            if (r < 0.0000008) {
                if (isAreaValidForStructure(tx, tz, surfaceY, 6)) {
                    generateWizardTower(blocks, tx, surfaceY + 1, tz, structRng);
                }
            } else if (biome === BIOMES.DESERT && r < 0.0000025) {
                if (isAreaValidForStructure(tx, tz, surfaceY, 8)) {
                    generateAncientPyramid(blocks, tx, surfaceY, tz, structRng);
                }
            } else if (r < 0.000022) {
                if (isAreaValidForStructure(tx, tz, surfaceY, 4)) {
                    generatePortalStructure(blocks, tx, surfaceY + 1, tz, structRng, 'nether');
                }
            } else if (r < 0.000075) {
                if (isAreaValidForStructure(tx, tz, surfaceY, 4)) {
                    generateCabin(blocks, tx, surfaceY + 1, tz, structRng);
                }
            }
        }
    }

    // ============================================
    // PASS 5.5: Underground Stronghold (Rare)
    // ============================================
    const strongholds = getStrongholdPositions(params.seed);
    for (const shPos of strongholds) {
        if (Math.abs(cx * CHUNK_SIZE + 8 - shPos.x) <= 24 && Math.abs(cz * CHUNK_SIZE + 8 - shPos.z) <= 24) {
            generateStronghold(blocks, cx, cz, shPos, params);
            break;
        }
    }

    // ============================================
    // PASS 6: Large Features, Trees & Fallen Logs
    // ============================================
    for (let tx = -3; tx <= CHUNK_SIZE + 2; tx++) {
        for (let tz = -3; tz <= CHUNK_SIZE + 2; tz++) {
            const wx = wxBase + tx;
            const wz = wzBase + tz;
            const colInfo = getColumnInfo(wx, wz, params);
            const biome = colInfo.biome;
            const bData = colInfo.bData;
            let surfaceY = getTopGround(tx, tz);
            if (surfaceY <= 0) surfaceY = colInfo.surfaceY;
            if (surfaceY >= CHUNK_HEIGHT - 10) continue;

            const floraRng = seededRandom(params.seed + wx * 7777 + wz);
            const r = floraRng();
            const isUnderwater = surfaceY < params.seaLevel || (bData && bData.lakeSurfaceY && surfaceY < bData.lakeSurfaceY);
            if (isUnderwater) {
                // In swamps, Mangrove Trees can grow directly out of shallow wetland water (1-2 blocks deep)
                const isSwamp = (biome.swampFlora || biome === BIOMES.SWAMP || biome.name === 'Swamp');
                if (isSwamp && surfaceY >= params.seaLevel - 2 && r < 0.035) {
                    generateMangroveTree(blocks, tx, surfaceY + 1, tz, floraRng);
                }
                continue;
            }

            // Ground validity check
            const currentGroundIdx = (surfaceY * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
            const currentGroundBlock = (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE) ? blocks[currentGroundIdx] : BLOCKS.AIR;
            const isValidGround = currentGroundBlock === BLOCKS.GRASS || currentGroundBlock === BLOCKS.DIRT || currentGroundBlock === BLOCKS.SAND || currentGroundBlock === BLOCKS.SNOW || currentGroundBlock === BLOCKS.MYCELIUM || currentGroundBlock === BLOCKS.SWAMP_GRASS || currentGroundBlock === BLOCKS.SAVANNA_GRASS || currentGroundBlock === BLOCKS.ALIEN_GRASS || currentGroundBlock === BLOCKS.ALIEN_STONE || currentGroundBlock === BLOCKS.RED_SAND || currentGroundBlock === BLOCKS.PODZOL || currentGroundBlock === BLOCKS.BASALT || currentGroundBlock === BLOCKS.SMOOTH_BASALT || currentGroundBlock === BLOCKS.BLACKSTONE || currentGroundBlock === BLOCKS.MUD || currentGroundBlock === BLOCKS.SWAMP_WATER || currentGroundBlock === BLOCKS.PACKED_ICE || currentGroundBlock === BLOCKS.BLUE_ICE || currentGroundBlock === BLOCKS.ICE;
            if (!isValidGround) continue;

            // Border tree density feathering (prevents abrupt walls of trees hitting desert borders)
            if (colInfo.temp > 0.69 && !biome.jungleFlora && biome !== BIOMES.JUNGLE && biome.name !== 'Jungle') {
                const heatTaper = Math.max(0, Math.min(1, (0.76 - colInfo.temp) / 0.07));
                if (floraRng() > heatTaper) continue;
            }

            // Volcanic Spire Columns
            if (biome.isVolcanic) {
                if (r < 0.035) {
                    generateBasaltColumn(blocks, tx, surfaceY + 1, tz, 10 + Math.floor(floraRng() * 15), floraRng);
                } else if (r < 0.08) {
                    safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.FIRE, true);
                }
                continue;
            }

            // Swamp Biome: Swamp Oaks with hanging vines & Mangrove Trees
            if (biome.swampFlora || biome === BIOMES.SWAMP || biome.name === 'Swamp') {
                if (r < 0.048) {
                    if (floraRng() < 0.65) {
                        generateSwampOakTree(blocks, tx, surfaceY + 1, tz, floraRng);
                    } else {
                        generateMangroveTree(blocks, tx, surfaceY + 1, tz, floraRng);
                    }
                    continue;
                }
            }

            // Redwood Forest Trees & Mushroom Clumps (No fallen logs)
            if (biome.isRedwood) {
                if (r < 0.025) {
                    generateRedwoodTree(blocks, tx, surfaceY + 1, tz, floraRng);
                    continue;
                } else if (r < 0.035) {
                    generateMushroomClump(blocks, tx, surfaceY, tz, floraRng);
                    continue;
                }
            }

            // Mystic Grove Trees
            if (biome.isMystic && r < 0.035) {
                generateMysticTree(blocks, tx, surfaceY + 1, tz, floraRng);
                continue;
            }

            // Dark Forest: Trees, Giant Mushrooms, Fallen Logs with mushrooms & Mushroom Clumps
            if (biome.isDark || biome === BIOMES.DARK_FOREST || biome.name === 'Dark Forest') {
                if (r < 0.052) {
                    generateTree(blocks, tx, surfaceY + 1, tz, biome, floraRng);
                    continue;
                } else if (r < 0.056) {
                    generateMushroom(blocks, tx, surfaceY + 1, tz, floraRng);
                    continue;
                } else if (r < 0.0575) {
                    generateFallenLog(blocks, tx, surfaceY, tz, BLOCKS.DARK_OAK_WOOD, floraRng);
                    continue;
                } else if (r < 0.070) {
                    generateMushroomClump(blocks, tx, surfaceY, tz, floraRng);
                    continue;
                }
            }

            // Birch Forest: Birch Trees & Fallen Birch Logs with mushrooms
            if (biome.isBirch || biome === BIOMES.BIRCH_FOREST || biome.name === 'Birch Forest') {
                if (r < 0.028) {
                    generateBirchTree(blocks, tx, surfaceY + 1, tz, floraRng);
                    continue;
                } else if (r < 0.0295) {
                    generateFallenLog(blocks, tx, surfaceY, tz, BLOCKS.BIRCH_WOOD, floraRng);
                    continue;
                }
            }

            // Taiga (Tiaga): Pine Trees, Fallen Pine Logs with mushrooms & Boulders
            if ((biome === BIOMES.TAIGA || biome.name === 'Taiga' || (biome.isTaiga && !biome.isRedwood))) {
                if (r < 0.028) {
                    generatePineTree(blocks, tx, surfaceY + 1, tz, floraRng);
                    continue;
                } else if (r < 0.0295) {
                    generateFallenLog(blocks, tx, surfaceY, tz, BLOCKS.PINE_WOOD, floraRng);
                    continue;
                } else if (r >= 0.08 && r < 0.086) {
                    // Rare Minecraft natural boulders - Taiga exclusive
                    generateBoulder(blocks, tx, surfaceY, tz, floraRng);
                    continue;
                } else if (r >= 0.086 && r < 0.091) {
                    // Rare rock patches - Taiga exclusive
                    generateRockPatch(blocks, tx, surfaceY, tz, floraRng);
                    continue;
                }
            }

            // Normal Forest: Trees & Fallen Oak Logs with mushrooms
            if (biome === BIOMES.FOREST || biome.name === 'Forest') {
                if (r < 0.028) {
                    generateTree(blocks, tx, surfaceY + 1, tz, biome, floraRng);
                    continue;
                } else if (r < 0.0295) {
                    generateFallenLog(blocks, tx, surfaceY, tz, BLOCKS.WOOD, floraRng);
                    continue;
                }
            }

            // Other Biome Trees & Features (with smooth woodland border density feathering)
            let treeProbability = 0;
            if (biome.hasTrees) {
                treeProbability = 0.022;
                // Feather tree density as we approach flat open plains
                if (colInfo.erosionNoise > 0.60) {
                    treeProbability *= Math.max(0.35, 1.0 - (colInfo.erosionNoise - 0.60) / 0.15 * 0.65);
                }
            } else if (biome === BIOMES.PLAINS || biome.name === 'Plains') {
                // Solitary oak trees in plains, more common near water edges (riparian willow/oak) and forest borders
                const isNearWater = surfaceY <= params.seaLevel + 4;
                treeProbability = isNearWater ? 0.015 : ((colInfo.weirdness > 0.48 && colInfo.weirdness < 0.58) ? 0.006 : 0.002);
            }

            const isSoilForTree = currentGroundBlock === BLOCKS.GRASS || currentGroundBlock === BLOCKS.DIRT || currentGroundBlock === BLOCKS.PODZOL || currentGroundBlock === BLOCKS.MYCELIUM || currentGroundBlock === BLOCKS.SWAMP_GRASS || currentGroundBlock === BLOCKS.SAVANNA_GRASS || currentGroundBlock === BLOCKS.MUD || (biome.isOasis && currentGroundBlock === BLOCKS.SAND);
            if (treeProbability > 0 && r < treeProbability && isSoilForTree) {
                generateTree(blocks, tx, surfaceY + 1, tz, biome, floraRng);
            } else if (biome.hasDeadTrees && r < 0.005) {
                generateDeadTree(blocks, tx, surfaceY + 1, tz, floraRng);
            } else if (biome.hasMushrooms && r < 0.05) {
                generateMushroom(blocks, tx, surfaceY + 1, tz, floraRng);
            } else if (biome.hasCrystals && r < 0.03) {
                generateCrystal(blocks, tx, surfaceY + 1, tz, floraRng);
            } else if (biome.hasIceSpikes && r < 0.025) {
                generateIceSpike(blocks, tx, surfaceY + 1, tz, floraRng);
            } else if (biome.hasCactus && r < 0.01 && currentGroundBlock === BLOCKS.SAND) {
                generateCactus(blocks, tx, surfaceY + 1, tz, floraRng);
            }
        }
    }

    // ============================================
    // PASS 7: Ground Cover & Aquatic Flora
    // ============================================
    for (let tx = -3; tx <= CHUNK_SIZE + 2; tx++) {
        for (let tz = -3; tz <= CHUNK_SIZE + 2; tz++) {
            const wx = wxBase + tx;
            const wz = wzBase + tz;
            const colInfo = getColumnInfo(wx, wz, params);
            const biome = colInfo.biome;
            const bData = colInfo.bData;
            let surfaceY = getTopGround(tx, tz);
            if (surfaceY <= 0) surfaceY = colInfo.surfaceY;
            if (surfaceY >= CHUNK_HEIGHT - 10) continue;

            const floraRng = seededRandom(params.seed + wx * 7777 + wz);
            const r = floraRng();
            const isUnderwater = surfaceY < params.seaLevel || (bData && bData.lakeSurfaceY && surfaceY < bData.lakeSurfaceY);

            // Aquatic vegetation
            if (isUnderwater) {
                const isOcean = biome.isOcean || biome.isCoralReef || biome === BIOMES.CORAL_REEF || biome === BIOMES.OCEAN || biome === BIOMES.DEEP_OCEAN || biome === BIOMES.FROZEN_OCEAN;
                if (isOcean && r < 0.04 && surfaceY < params.seaLevel - 1) {
                    const floorIdx = (surfaceY * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
                    const floorBlock = blocks[floorIdx];
                    if (floorBlock === BLOCKS.SAND || floorBlock === BLOCKS.GRAVEL) {
                        const aboveIdx = ((surfaceY + 1) * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
                        const aboveBlock = (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE) ? blocks[aboveIdx] : BLOCKS.WATER;
                        if (aboveBlock === BLOCKS.WATER) {
                            const shellRng = floraRng();
                            const shell = shellRng < 0.33 ? BLOCKS.SEASHELL_1 : (shellRng < 0.66 ? BLOCKS.SEASHELL_2 : BLOCKS.SEASHELL_3);
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, shell, false);
                            continue;
                        }
                    }
                }
                if (biome.isCoralReef && r < 0.3 && surfaceY < params.seaLevel - 1) {
                    const cRng = floraRng();
                    let coralType;
                    if (cRng < 0.2) coralType = BLOCKS.TUBE_CORAL;
                    else if (cRng < 0.4) coralType = BLOCKS.BRAIN_CORAL;
                    else if (cRng < 0.6) coralType = BLOCKS.FIRE_CORAL;
                    else if (cRng < 0.8) coralType = BLOCKS.HORN_CORAL;
                    else if (cRng < 0.9) coralType = BLOCKS.BUBBLE_CORAL;
                    else coralType = BLOCKS.SAND;
                    if (coralType !== BLOCKS.SAND) {
                        const aboveIdx = ((surfaceY + 1) * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
                        const aboveBlock = (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE) ? blocks[aboveIdx] : BLOCKS.WATER;
                        if (aboveBlock === BLOCKS.WATER) {
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, coralType, false);
                        }
                    }
                } else if (r < 0.2) {
                    const cRng = floraRng();
                    if (cRng < 0.1) {
                        const kHeight = 2 + Math.floor(floraRng() * 6);
                        let maxHeight = 0;
                        for (let i = 1; i <= kHeight; i++) {
                            const y = surfaceY + i;
                            if (y < params.seaLevel - 1) {
                                const aboveIdx = (y * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
                                const aboveBlock = (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE && y < CHUNK_HEIGHT) ? blocks[aboveIdx] : BLOCKS.WATER;
                                if (aboveBlock === BLOCKS.WATER) {
                                    maxHeight = i;
                                } else {
                                    break;
                                }
                            } else {
                                break;
                            }
                        }
                        for (let i = 1; i <= maxHeight; i++) {
                            const y = surfaceY + i;
                            // Use kelp_plant for middle and bottom kelps, kelp on top
                            const kelpBlock = (i === maxHeight) ? BLOCKS.KELP : BLOCKS.KELP_PLANT;
                            safeSetBlock(blocks, tx, y, tz, kelpBlock, false);
                        }
                    } else {
                        const y = surfaceY + 1;
                        const aboveIdx = (y * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
                        const aboveBlock = (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE && y < CHUNK_HEIGHT) ? blocks[aboveIdx] : BLOCKS.WATER;
                        if (biome === BIOMES.SWAMP || biome === BIOMES.OASIS) {
                            if (cRng < 0.5) {
                                if (aboveBlock === BLOCKS.WATER || aboveBlock === BLOCKS.SWAMP_WATER) {
                                    safeSetBlock(blocks, tx, y, tz, BLOCKS.ALGAE, false);
                                }
                            } else {
                                const waterTopY = (bData && bData.lakeSurfaceY > 0) ? bData.lakeSurfaceY : params.seaLevel;
                                const padY = waterTopY + 1;
                                const waterIdx = (waterTopY * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
                                const waterBlock = (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE && waterTopY < CHUNK_HEIGHT) ? blocks[waterIdx] : BLOCKS.AIR;
                                const padIdx = (padY * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
                                const padBlock = (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE && padY < CHUNK_HEIGHT) ? blocks[padIdx] : BLOCKS.AIR;
                                if ((waterBlock === BLOCKS.WATER || waterBlock === BLOCKS.SWAMP_WATER) && (padBlock === BLOCKS.AIR || padBlock === BLOCKS.WATER || padBlock === BLOCKS.SWAMP_WATER)) {
                                    safeSetBlock(blocks, tx, padY, tz, BLOCKS.LILY_PAD, false);
                                }
                            }
                        } else {
                            if (aboveBlock === BLOCKS.WATER) {
                                safeSetBlock(blocks, tx, y, tz, BLOCKS.SEAGRASS, false);
                            }
                        }
                    }
                }
                continue;
            }

            // Sugarcane logic: generates along water shores in all non-frozen biomes (authentic Minecraft behavior)
            const canHaveSugarcane = biome !== BIOMES.TUNDRA && biome !== BIOMES.ICE_SPIKES && !biome.isVolcanic && colInfo.temp >= 0.20;
            
            const groundIdx = (surfaceY * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
            const groundBlock = (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE) ? blocks[groundIdx] : BLOCKS.AIR;
            const isSugarcaneSoil = groundBlock === BLOCKS.SAND || groundBlock === BLOCKS.RED_SAND || groundBlock === BLOCKS.DIRT || groundBlock === BLOCKS.GRASS || groundBlock === BLOCKS.SWAMP_GRASS || groundBlock === BLOCKS.SAVANNA_GRASS || groundBlock === BLOCKS.MUD;

            if (canHaveSugarcane && isSugarcaneSoil && surfaceY >= params.seaLevel && surfaceY <= params.seaLevel + 3 && r < 0.14) {
                if (hasDirectAdjacentWater(blocks, tx, surfaceY, tz, wx, wz, params)) {
                    generateSugarcane(blocks, tx, surfaceY + 1, tz, floraRng);
                    continue;
                }
            }

            // Only place ground flora on solid non-air ground
            const curGroundIdx = (surfaceY * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
            const curGround = (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE) ? blocks[curGroundIdx] : BLOCKS.AIR;
            const isSoil = curGround === BLOCKS.GRASS || curGround === BLOCKS.DIRT || curGround === BLOCKS.PODZOL || curGround === BLOCKS.MYCELIUM || curGround === BLOCKS.SWAMP_GRASS || curGround === BLOCKS.SAVANNA_GRASS || curGround === BLOCKS.MUD;
            const isSandSoil = curGround === BLOCKS.SAND || curGround === BLOCKS.RED_SAND;
            const canSupportFlora = isSoil || isSandSoil;
            if (!canSupportFlora) continue;

            // Sand blocks on land: only place dead bushes in desert/badlands (never seashells on land!)
            if (isSandSoil) {
                if (biome.hasDeadBush && r < 0.04) {
                    safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.DEAD_BUSH, true);
                }
                continue;
            }

            // Vegetation strictly requires soil (grass/dirt/podzol) - never grows on snow or ice!
            if (!isSoil) continue;

            // Ground cover vegetation
            if (biome.hasDeadBush && r < 0.04) {
                safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.DEAD_BUSH, true);
            } else if (biome.isBeach) {
                // Beaches on land are clean sandy shores (seashells are strictly underwater)
                continue;
            } else if (biome.jungleFlora && r < 0.08) {
                if (floraRng() < 0.5) generateTree(blocks, tx, surfaceY + 1, tz, biome, floraRng);
                else safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.LEAVES, true);
            } else if (biome.name !== 'Desert' && biome.name !== 'Badlands' && !biome.isVolcanic && biome.name !== 'Ice Spikes' && biome.name !== 'Deep Ocean' && !biome.isCoralReef && !biome.isBeach) {
                let fr = floraRng();
                if (biome === BIOMES.CHERRY_GROVE && fr < 0.3) {
                    if (fr < 0.05) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.PINK_PETALS, true);
                    else if (fr < 0.1) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.WHITE_FLOWER, true);
                    else if (fr < 0.15) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.PURPLE_FLOWER, true);
                    else safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                } else if (biome.isMystic && fr < 0.35) {
                    if (fr < 0.12) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.GLOW_SHROOM, true);
                    else if (fr < 0.22) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.PURPLE_FLOWER, true);
                    else safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.WHITE_FLOWER, true);
                } else if (biome === BIOMES.OASIS && fr < 0.2) {
                    safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.DEAD_BUSH, true);
                } else if (biome.isRedwood) {
                    if (fr < 0.35) {
                        const fernRoll = floraRng();
                        if (fernRoll < 0.45) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.FERN, true);
                        else if (fernRoll < 0.8) generateTallFern(blocks, tx, surfaceY + 1, tz);
                        else safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                    }
                } else if (biome === BIOMES.TUNDRA || biome.name === 'Tundra') {
                    // Snowy Tundra: ferns and flora strictly never spawn on snow
                    continue;
                } else if (biome === BIOMES.TAIGA || biome.name === 'Taiga' || biome.isTaiga) {
                    if (isSoil && fr < 0.25) {
                        const taigaRoll = floraRng();
                        if (taigaRoll < 0.35) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.FERN, true);
                        else if (taigaRoll < 0.6) generateTallFern(blocks, tx, surfaceY + 1, tz);
                        else safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                    }
                } else if (biome.jungleFlora || biome === BIOMES.JUNGLE || biome.name === 'Jungle') {
                    if (fr < 0.32) {
                        const jungleRoll = floraRng();
                        if (jungleRoll < 0.65) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                        else {
                            const fl = floraRng() < 0.5 ? BLOCKS.RED_FLOWER : BLOCKS.YELLOW_FLOWER;
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, fl, true);
                        }
                    }
                } else if (biome.swampFlora || biome === BIOMES.SWAMP || biome.name === 'Swamp') {
                    if (fr < 0.12) {
                        const swRoll = floraRng();
                        if (swRoll < 0.82) {
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                        } else if (swRoll < 0.92) {
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.BLUE_FLOWER, true);
                        } else {
                            const swShroom = floraRng() < 0.5 ? BLOCKS.BROWN_MUSHROOM : BLOCKS.RED_MUSHROOM;
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, swShroom, true);
                        }
                    }
                } else if (biome.isDark || biome === BIOMES.DARK_FOREST || biome.name === 'Dark Forest') {
                    if (fr < 0.25) {
                        const dfRoll = floraRng();
                        if (dfRoll < 0.65) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                        else if (dfRoll < 0.85) {
                            const shroom = floraRng() < 0.5 ? BLOCKS.BROWN_MUSHROOM : BLOCKS.RED_MUSHROOM;
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, shroom, true);
                        } else {
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.RED_FLOWER, true);
                        }
                    }
                } else if (biome.savannaFlora || biome === BIOMES.SAVANNA || biome.name === 'Savanna') {
                    if (fr < 0.2) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                } else if (biome === BIOMES.MOUNTAINS || biome.name === 'Mountains') {
                    if (fr < 0.15) {
                        if (floraRng() < 0.8) safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                        else safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.WHITE_FLOWER, true);
                    }
                } else if (biome === BIOMES.PLAINS || biome.name === 'Plains') {
                    // Authentic Minecraft Plains: tall grass with scattered dandelions and poppies (strictly NO mushrooms!)
                    if (fr < 0.22) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                    } else if (fr < 0.26) {
                        const fl = floraRng() < 0.55 ? BLOCKS.YELLOW_FLOWER : BLOCKS.RED_FLOWER;
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, fl, true);
                    }
                } else {
                    if (fr < 0.22) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                    } else if (fr >= 0.22 && fr < 0.27) {
                        const r3 = floraRng();
                        const flowerType = r3 < 0.3 ? BLOCKS.RED_FLOWER : (r3 < 0.55 ? BLOCKS.YELLOW_FLOWER : (r3 < 0.75 ? BLOCKS.BLUE_FLOWER : (r3 < 0.9 ? BLOCKS.WHITE_FLOWER : BLOCKS.PURPLE_FLOWER)));
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, flowerType, true);
                    }
                }
            }
        }
    }

    return blocks;
}

// getDungeonInfo removed — dungeon data is embedded in chunk generation

// ============================================
// Flora Generation
// ============================================

function generateBasaltColumn(blocks, x, y, z, height, rng) {
    for (let dy = 0; dy < height; dy++) {
        safeSetBlock(blocks, x, y + dy, z, BLOCKS.BASALT);
        if (rng() < 0.6) safeSetBlock(blocks, x + 1, y + dy, z, BLOCKS.BASALT);
        if (rng() < 0.6) safeSetBlock(blocks, x, y + dy, z + 1, BLOCKS.BASALT);
        if (rng() < 0.3) safeSetBlock(blocks, x + 1, y + dy, z + 1, BLOCKS.SMOOTH_BASALT);
    }
    if (rng() < 0.3) safeSetBlock(blocks, x, y + height, z, BLOCKS.MAGMA);
}

function generateRedwoodTree(blocks, x, y, z, rng) {
    const height = 18 + Math.floor(rng() * 10);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.REDWOOD_LOG);
        safeSetBlock(blocks, x + 1, y + i, z, BLOCKS.REDWOOD_LOG);
        safeSetBlock(blocks, x, y + i, z + 1, BLOCKS.REDWOOD_LOG);
        safeSetBlock(blocks, x + 1, y + i, z + 1, BLOCKS.REDWOOD_LOG);
    }
    const startLeaves = y + Math.floor(height * 0.38);
    for (let ly = startLeaves; ly <= y + height + 2; ly++) {
        const progress = (ly - startLeaves) / (height * 0.62);
        const radius = Math.max(1, Math.floor((1 - progress * 0.65) * 4) - (ly % 2));
        for (let dx = -radius; dx <= radius + 1; dx++) {
            for (let dz = -radius; dz <= radius + 1; dz++) {
                if (Math.abs(dx - 0.5) + Math.abs(dz - 0.5) > radius + 1.2) continue;
                safeSetBlock(blocks, x + dx, ly, z + dz, BLOCKS.REDWOOD_LEAVES, true);
            }
        }
    }
}

function generateBoulder(blocks, cx, cy, cz, rng) {
    const radius = 1 + Math.floor(rng() * 2); // 1 to 2 radius (3x3 to 5x5 natural boulder)
    const isMossy = rng() < 0.45;
    const blockType = isMossy ? BLOCKS.MOSSY_COBBLESTONE : (rng() < 0.5 ? BLOCKS.COBBLESTONE : BLOCKS.STONE);

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -1; dy <= radius; dy++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const dist = Math.sqrt(dx * dx + dy * dy * 1.3 + dz * dz);
                if (dist <= radius + (rng() * 0.4 - 0.2)) {
                    safeSetBlock(blocks, cx + dx, cy + dy, cz + dz, blockType);
                }
            }
        }
    }
}

function generateRockPatch(blocks, cx, cy, cz, rng) {
    const size = 2 + Math.floor(rng() * 2);
    for (let dx = -size; dx <= size; dx++) {
        for (let dz = -size; dz <= size; dz++) {
            if (dx * dx + dz * dz <= size * size + (rng() * 0.6)) {
                if (rng() < 0.75) {
                    const rockType = rng() < 0.35 ? BLOCKS.MOSSY_COBBLESTONE : (rng() < 0.65 ? BLOCKS.COBBLESTONE : BLOCKS.STONE);
                    safeSetBlock(blocks, cx + dx, cy, cz + dz, rockType);
                }
            }
        }
    }
}

function generateDripstoneClump(blocks, cx, cy, cz, rng, columns, params) {
    const radius = 1 + Math.floor(rng() * 2); // Tight 1 to 2 radius clump
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
            const px = cx + dx;
            const pz = cz + dz;
            if (px < 0 || px >= CHUNK_SIZE || pz < 0 || pz >= CHUNK_SIZE) continue;
            const distSq = dx * dx + dz * dz;
            if (distSq > radius * radius + (rng() * 0.7)) continue;

            const maxAllowedY = columns ? Math.min(30, columns[px][pz].bData.surfaceY - 12) : 30;
            if (maxAllowedY <= 10) continue;

            // Search column around cy for subterranean cave ceiling and cave floor (strictly subterranean)
            for (let y = Math.max(8, cy - 5); y <= Math.min(maxAllowedY, cy + 5); y++) {
                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (pz * CHUNK_SIZE) + px;
                if (blocks[idx] !== BLOCKS.AIR) continue;

                const belowIdx = ((y - 1) * CHUNK_SIZE * CHUNK_SIZE) + (pz * CHUNK_SIZE) + px;
                const aboveIdx = ((y + 1) * CHUNK_SIZE * CHUNK_SIZE) + (pz * CHUNK_SIZE) + px;

                // Floor stalagmite (pointing UP)
                if (blocks[belowIdx] === BLOCKS.STONE && rng() < 0.5) {
                    blocks[belowIdx] = BLOCKS.DRIPSTONE_BLOCK;
                    if (rng() < 0.4) {
                        const spikeH = 1 + (rng() < 0.25 ? 1 : 0);
                        for (let s = 0; s < spikeH && y + s <= maxAllowedY; s++) {
                            const sIdx = ((y + s) * CHUNK_SIZE * CHUNK_SIZE) + (pz * CHUNK_SIZE) + px;
                            if (blocks[sIdx] === BLOCKS.AIR) {
                                blocks[sIdx] = (s === spikeH - 1) ? BLOCKS.POINTED_DRIPSTONE_UP : BLOCKS.DRIPSTONE_BLOCK;
                            } else break;
                        }
                    }
                }

                // Ceiling stalactite (pointing DOWN)
                if (blocks[aboveIdx] === BLOCKS.STONE && rng() < 0.5) {
                    blocks[aboveIdx] = BLOCKS.DRIPSTONE_BLOCK;
                    if (rng() < 0.4) {
                        const spikeH = 1 + (rng() < 0.25 ? 1 : 0);
                        for (let s = 0; s < spikeH && y - s >= 8; s++) {
                            const sIdx = ((y - s) * CHUNK_SIZE * CHUNK_SIZE) + (pz * CHUNK_SIZE) + px;
                            if (blocks[sIdx] === BLOCKS.AIR) {
                                blocks[sIdx] = (s === spikeH - 1) ? BLOCKS.POINTED_DRIPSTONE_DOWN : BLOCKS.DRIPSTONE_BLOCK;
                            } else break;
                        }
                    }
                }
            }
        }
    }
}

function generateMysticTree(blocks, x, y, z, rng) {
    const height = 6 + Math.floor(rng() * 3);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.MAGIC_WOOD);
    }
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                if (Math.abs(dx) + Math.abs(dz) > 4) continue;
                if (Math.abs(dy) === 2 && (Math.abs(dx) > 2 || Math.abs(dz) > 2)) continue;
                safeSetBlock(blocks, x + dx, y + height + dy, z + dz, BLOCKS.MAGIC_LEAVES, true);
            }
        }
    }
    safeSetBlock(blocks, x, y + height, z, BLOCKS.MAGIC_WOOD, false);
}

function generateAcaciaCanopy(blocks, cx, cy, cz, maxRadius, rng) {
    // 1. Lower umbrella disk at branch terminal (cy)
    for (let dx = -maxRadius; dx <= maxRadius; dx++) {
        for (let dz = -maxRadius; dz <= maxRadius; dz++) {
            if (Math.abs(dx) === maxRadius && Math.abs(dz) === maxRadius) continue;
            if (maxRadius >= 3 && Math.abs(dx) + Math.abs(dz) > maxRadius + 1) continue;
            safeSetBlock(blocks, cx + dx, cy, cz + dz, BLOCKS.ACACIA_LEAVES, true);
        }
    }
    // 2. Upper disk at cy + 1 (radius - 1)
    const upperRadius = Math.max(1, maxRadius - 1);
    for (let dx = -upperRadius; dx <= upperRadius; dx++) {
        for (let dz = -upperRadius; dz <= upperRadius; dz++) {
            if (Math.abs(dx) === upperRadius && Math.abs(dz) === upperRadius) continue;
            safeSetBlock(blocks, cx + dx, cy + 1, cz + dz, BLOCKS.ACACIA_LEAVES, true);
        }
    }
    // 3. Under-leaves at cy - 1 around branch terminal
    safeSetBlock(blocks, cx + 1, cy - 1, cz, BLOCKS.ACACIA_LEAVES, true);
    safeSetBlock(blocks, cx - 1, cy - 1, cz, BLOCKS.ACACIA_LEAVES, true);
    safeSetBlock(blocks, cx, cy - 1, cz + 1, BLOCKS.ACACIA_LEAVES, true);
    safeSetBlock(blocks, cx, cy - 1, cz - 1, BLOCKS.ACACIA_LEAVES, true);
}

function generateAcaciaTree(blocks, x, y, z, rng) {
    const baseHeight = 1 + Math.floor(rng() * 2); // 1 to 2 base vertical trunk
    
    // Vertical base
    for (let i = 0; i < baseHeight; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.ACACIA_WOOD, false, 0); // 0 = Y axis
    }

    // Branch 1: Primary diagonal branch
    const cardinalDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const dir1 = cardinalDirs[Math.floor(rng() * 4)];
    const branch1Len = 3 + Math.floor(rng() * 2);
    let bx1 = x;
    let bz1 = z;
    let by1 = y + baseHeight;

    for (let step = 0; step < branch1Len; step++) {
        if (rng() < 0.85 || step === 0) {
            bx1 += dir1[0];
            bz1 += dir1[1];
        }
        by1++;
        const axis = (dir1[0] !== 0) ? 1 : 2; // 1 = X axis, 2 = Z axis
        safeSetBlock(blocks, bx1, by1, bz1, BLOCKS.ACACIA_WOOD, false, (step === branch1Len - 1 && rng() < 0.4) ? 0 : axis);
    }

    // Umbrella canopy on branch 1
    generateAcaciaCanopy(blocks, bx1, by1, bz1, 3, rng);

    // Branch 2: Secondary fork (75% chance)
    if (rng() < 0.75) {
        const otherDirs = cardinalDirs.filter(d => !(d[0] === dir1[0] && d[1] === dir1[1]));
        const dir2 = otherDirs[Math.floor(rng() * otherDirs.length)];
        const branch2Len = 2 + Math.floor(rng() * 2);
        let bx2 = x;
        let bz2 = z;
        let by2 = y + baseHeight + (rng() < 0.5 ? 0 : 1);

        for (let step = 0; step < branch2Len; step++) {
            if (rng() < 0.85 || step === 0) {
                bx2 += dir2[0];
                bz2 += dir2[1];
            }
            by2++;
            const axis = (dir2[0] !== 0) ? 1 : 2;
            safeSetBlock(blocks, bx2, by2, bz2, BLOCKS.ACACIA_WOOD, false, (step === branch2Len - 1) ? 0 : axis);
        }

        // Umbrella canopy on branch 2
        generateAcaciaCanopy(blocks, bx2, by2, bz2, 2, rng);
    }
}

function generateFancyOakTree(blocks, x, y, z, rng) {
    const height = 8 + Math.floor(rng() * 5); // 8 to 12 blocks
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.WOOD, false, 0);
    }

    const branchCount = 2 + Math.floor(rng() * 2);
    const branchDirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    
    for (let b = 0; b < branchCount; b++) {
        const startH = Math.floor(height * (0.45 + (b * 0.22)));
        const dir = branchDirs[Math.floor(rng() * branchDirs.length)];
        const branchLen = 2 + Math.floor(rng() * 2);
        let bx = x;
        let bz = z;
        let by = y + startH;

        for (let step = 0; step < branchLen; step++) {
            bx += dir[0];
            bz += dir[1];
            if (step % 2 === 0) by++;
            const axis = (dir[0] !== 0 && dir[1] === 0) ? 1 : ((dir[1] !== 0 && dir[0] === 0) ? 2 : 0);
            safeSetBlock(blocks, bx, by, bz, BLOCKS.WOOD, false, axis);
        }

        // Spherical foliage balloon at branch tip
        for (let dy = -1; dy <= 2; dy++) {
            const rad = (dy === 2) ? 1 : 2;
            for (let dx = -rad; dx <= rad; dx++) {
                for (let dz = -rad; dz <= rad; dz++) {
                    if (Math.abs(dx) === rad && Math.abs(dz) === rad && (dy === -1 || dy >= 1)) continue;
                    safeSetBlock(blocks, bx + dx, by + dy, bz + dz, BLOCKS.LEAVES, true);
                }
            }
        }
    }

    // Main crown dome at top of trunk
    const topY = y + height;
    for (let dy = -1; dy <= 2; dy++) {
        const rad = (dy === 2) ? 1 : (dy === -1 ? 2 : 3);
        for (let dx = -rad; dx <= rad; dx++) {
            for (let dz = -rad; dz <= rad; dz++) {
                if (Math.abs(dx) === rad && Math.abs(dz) === rad && rng() < 0.6) continue;
                safeSetBlock(blocks, x + dx, topY + dy, z + dz, BLOCKS.LEAVES, true);
            }
        }
    }
}

function generateSwampOakTree(blocks, x, y, z, rng) {
    const height = 5 + Math.floor(rng() * 3);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.WOOD, false, 0);
    }
    const topY = y + height;
    for (let dy = -1; dy <= 1; dy++) {
        const rad = (dy === 1) ? 2 : 3;
        for (let dx = -rad; dx <= rad; dx++) {
            for (let dz = -rad; dz <= rad; dz++) {
                if (Math.abs(dx) === rad && Math.abs(dz) === rad) continue;
                safeSetBlock(blocks, x + dx, topY + dy, z + dz, BLOCKS.LEAVES, true);
                
                // Hanging vines dangling down from edge leaves
                if (dy <= 0 && (Math.abs(dx) >= 2 || Math.abs(dz) >= 2) && rng() < 0.35) {
                    const vineLen = 2 + Math.floor(rng() * 3);
                    for (let v = 1; v <= vineLen; v++) {
                        safeSetBlock(blocks, x + dx, topY + dy - v, z + dz, BLOCKS.VINES, true);
                    }
                }
            }
        }
    }
}

function generateOakTree(blocks, x, y, z, biome, rng) {
    const isSwamp = biome.swampFlora || biome.name === 'Swamp';
    
    if (isSwamp) {
        generateSwampOakTree(blocks, x, y, z, rng);
        return;
    }

    // 25% chance in Forest/Plains to generate Fancy Branching Oak ("Balloon Oak")
    if (rng() < 0.25) {
        generateFancyOakTree(blocks, x, y, z, rng);
        return;
    }

    // Standard Minecraft Oak Tree (Blob shape)
    const height = 4 + Math.floor(rng() * 3);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.WOOD, false, 0);
    }

    const topY = y + height;
    // Lower 2 layers: 5x5 with clipped corners
    for (let ly = topY - 2; ly <= topY - 1; ly++) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (Math.abs(dx) === 2 && Math.abs(dz) === 2) {
                    if (ly === topY - 1 || rng() < 0.6) continue;
                }
                safeSetBlock(blocks, x + dx, ly, z + dz, BLOCKS.LEAVES, true);
            }
        }
    }
    // Upper layer: 3x3 with clipped corners
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && rng() < 0.45) continue;
            safeSetBlock(blocks, x + dx, topY, z + dz, BLOCKS.LEAVES, true);
        }
    }
    // Top cross cap at topY + 1
    safeSetBlock(blocks, x, topY + 1, z, BLOCKS.LEAVES, true);
    safeSetBlock(blocks, x + 1, topY + 1, z, BLOCKS.LEAVES, true);
    safeSetBlock(blocks, x - 1, topY + 1, z, BLOCKS.LEAVES, true);
    safeSetBlock(blocks, x, topY + 1, z + 1, BLOCKS.LEAVES, true);
    safeSetBlock(blocks, x, topY + 1, z - 1, BLOCKS.LEAVES, true);
}

function generatePineTree(blocks, x, y, z, rng) {
    const height = 10 + Math.floor(rng() * 6);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.PINE_WOOD, false, 0);
    }

    const topY = y + height;
    safeSetBlock(blocks, x, topY + 1, z, BLOCKS.PINE_LEAVES, true);
    safeSetBlock(blocks, x, topY, z, BLOCKS.PINE_LEAVES, true);

    const startLeavesY = y + Math.max(3, Math.floor(height * 0.35));
    for (let ly = topY; ly >= startLeavesY; ly--) {
        const distFromTop = topY - ly;
        let radius = 1;
        if (distFromTop === 0) {
            radius = 1;
        } else if (distFromTop % 2 === 1) {
            radius = Math.min(3, 1 + Math.floor(distFromTop / 3));
        } else {
            radius = Math.max(1, Math.min(2, Math.floor(distFromTop / 4)));
        }

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                if (Math.abs(dx) === radius && Math.abs(dz) === radius) {
                    if (radius > 1 || distFromTop % 2 === 0) continue;
                }
                safeSetBlock(blocks, x + dx, ly, z + dz, BLOCKS.PINE_LEAVES, true);
            }
        }
    }
}

function generateDarkOakTree(blocks, x, y, z, rng) {
    const height = 6 + Math.floor(rng() * 4);
    for (let i = -1; i < height; i++) {
        const onlyAir = i < 0;
        safeSetBlock(blocks, x, y + i, z, BLOCKS.DARK_OAK_WOOD, onlyAir, 0);
        safeSetBlock(blocks, x + 1, y + i, z, BLOCKS.DARK_OAK_WOOD, onlyAir, 0);
        safeSetBlock(blocks, x, y + i, z + 1, BLOCKS.DARK_OAK_WOOD, onlyAir, 0);
        safeSetBlock(blocks, x + 1, y + i, z + 1, BLOCKS.DARK_OAK_WOOD, onlyAir, 0);
    }

    if (rng() < 0.7) {
        const ex = rng() < 0.5 ? x - 1 : x + 2;
        const ez = rng() < 0.5 ? z : z + 1;
        safeSetBlock(blocks, ex, y + height - 2, ez, BLOCKS.DARK_OAK_WOOD, false, 1);
        safeSetBlock(blocks, ex, y + height - 1, ez, BLOCKS.DARK_OAK_WOOD, false, 0);
    }

    const topY = y + height;
    for (let dy = -2; dy <= 1; dy++) {
        const rad = (dy === 1) ? 2 : (dy === -2 ? 3 : 4);
        for (let dx = -rad; dx <= rad + 1; dx++) {
            for (let dz = -rad; dz <= rad + 1; dz++) {
                const distSq = (dx - 0.5) * (dx - 0.5) + (dz - 0.5) * (dz - 0.5);
                if (distSq > (rad + 0.6) * (rad + 0.6)) continue;
                if (distSq > (rad - 0.5) * (rad - 0.5) && rng() < 0.05) continue;
                safeSetBlock(blocks, x + dx, topY + dy, z + dz, BLOCKS.DARK_OAK_LEAVES, true);
            }
        }
    }
}

function generatePalmTree(blocks, x, y, z, rng) {
    const height = 6 + Math.floor(rng() * 3);
    let px = x;
    let pz = z;
    const curveDir = rng() < 0.5 ? 1 : -1;
    const curveAxis = rng() < 0.5 ? 'x' : 'z';

    for (let i = 0; i < height; i++) {
        if (i > 2 && rng() < 0.4) {
            if (curveAxis === 'x') px += curveDir;
            else pz += curveDir;
        }
        safeSetBlock(blocks, px, y + i, pz, BLOCKS.PALM_WOOD, false, 0);
    }

    const topY = y + height;
    safeSetBlock(blocks, px, topY, pz, BLOCKS.PALM_LEAVES, true);
    const frondDirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    for (const [fdx, fdz] of frondDirs) {
        safeSetBlock(blocks, px + fdx, topY, pz + fdz, BLOCKS.PALM_LEAVES, true);
        safeSetBlock(blocks, px + fdx * 2, topY, pz + fdz * 2, BLOCKS.PALM_LEAVES, true);
        safeSetBlock(blocks, px + fdx * 2, topY - 1, pz + fdz * 2, BLOCKS.PALM_LEAVES, true);
        safeSetBlock(blocks, px + fdx * 3, topY - 1, pz + fdz * 3, BLOCKS.PALM_LEAVES, true);
        safeSetBlock(blocks, px + fdx * 3, topY - 2, pz + fdz * 3, BLOCKS.PALM_LEAVES, true);
    }
}

function generateCherryTree(blocks, x, y, z, rng) {
    const height = 5 + Math.floor(rng() * 3);
    let cx = x;
    let cz = z;
    const slantX = rng() < 0.5 ? 1 : -1;
    for (let i = 0; i < height; i++) {
        if (i === Math.floor(height / 2)) cx += slantX;
        safeSetBlock(blocks, cx, y + i, cz, BLOCKS.CHERRY_LOG, false, 0);
    }
    const topY = y + height;
    for (let dy = -2; dy <= 2; dy++) {
        const rad = (dy === 2 || dy === -2) ? 1 : (dy === 0 ? 3 : 2);
        for (let dx = -rad; dx <= rad; dx++) {
            for (let dz = -rad; dz <= rad; dz++) {
                if (Math.abs(dx) === rad && Math.abs(dz) === rad && rng() < 0.6) continue;
                safeSetBlock(blocks, cx + dx, topY + dy, cz + dz, BLOCKS.CHERRY_LEAVES, true);
            }
        }
    }
}

function generateJungleTree(blocks, x, y, z, rng) {
    const isMega = rng() < 0.35;
    if (isMega) {
        const height = 12 + Math.floor(rng() * 8);
        for (let i = -1; i < height; i++) {
            const onlyAir = i < 0;
            safeSetBlock(blocks, x, y + i, z, BLOCKS.WOOD, onlyAir, 0);
            safeSetBlock(blocks, x + 1, y + i, z, BLOCKS.WOOD, onlyAir, 0);
            safeSetBlock(blocks, x, y + i, z + 1, BLOCKS.WOOD, onlyAir, 0);
            safeSetBlock(blocks, x + 1, y + i, z + 1, BLOCKS.WOOD, onlyAir, 0);
        }
        const topY = y + height;
        for (let dy = -3; dy <= 1; dy++) {
            const rad = (dy === 1) ? 2 : (dy === -3 ? 3 : 4);
            for (let dx = -rad; dx <= rad + 1; dx++) {
                for (let dz = -rad; dz <= rad + 1; dz++) {
                    const distSq = (dx - 0.5) * (dx - 0.5) + (dz - 0.5) * (dz - 0.5);
                    if (distSq > (rad + 0.8) * (rad + 0.8)) continue;
                    safeSetBlock(blocks, x + dx, topY + dy, z + dz, BLOCKS.LEAVES, true);
                    if (dy <= -1 && distSq > rad * rad && rng() < 0.3) {
                        const vLen = 2 + Math.floor(rng() * 5);
                        for (let v = 1; v <= vLen; v++) {
                            safeSetBlock(blocks, x + dx, topY + dy - v, z + dz, BLOCKS.VINES, true);
                        }
                    }
                }
            }
        }
    } else {
        const height = 6 + Math.floor(rng() * 4);
        for (let i = 0; i < height; i++) {
            safeSetBlock(blocks, x, y + i, z, BLOCKS.WOOD, false, 0);
            if (rng() < 0.4) safeSetBlock(blocks, x + 1, y + i, z, BLOCKS.VINES, true);
            if (rng() < 0.4) safeSetBlock(blocks, x - 1, y + i, z, BLOCKS.VINES, true);
        }
        const topY = y + height;
        for (let dy = -2; dy <= 1; dy++) {
            const rad = (dy === 1) ? 1 : 2;
            for (let dx = -rad; dx <= rad; dx++) {
                for (let dz = -rad; dz <= rad; dz++) {
                    if (Math.abs(dx) === rad && Math.abs(dz) === rad && rng() < 0.5) continue;
                    safeSetBlock(blocks, x + dx, topY + dy, z + dz, BLOCKS.LEAVES, true);
                }
            }
        }
    }
}

function generateBirchTree(blocks, x, y, z, rng) {
    const height = 5 + Math.floor(rng() * 3); // 5 to 7 blocks tall slender birch trunk
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.BIRCH_WOOD, false, 0);
    }

    const topY = y + height;
    // Lower 2 layers: 5x5 with clipped corners
    for (let ly = topY - 2; ly <= topY - 1; ly++) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (Math.abs(dx) === 2 && Math.abs(dz) === 2) {
                    if (ly === topY - 1 || rng() < 0.6) continue;
                }
                safeSetBlock(blocks, x + dx, ly, z + dz, BLOCKS.BIRCH_LEAVES, true);
            }
        }
    }
    // Upper layer: 3x3 with clipped corners
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && rng() < 0.45) continue;
            safeSetBlock(blocks, x + dx, topY, z + dz, BLOCKS.BIRCH_LEAVES, true);
        }
    }
    // Top cross cap at topY + 1
    safeSetBlock(blocks, x, topY + 1, z, BLOCKS.BIRCH_LEAVES, true);
    safeSetBlock(blocks, x + 1, topY + 1, z, BLOCKS.BIRCH_LEAVES, true);
    safeSetBlock(blocks, x - 1, topY + 1, z, BLOCKS.BIRCH_LEAVES, true);
    safeSetBlock(blocks, x, topY + 1, z + 1, BLOCKS.BIRCH_LEAVES, true);
    safeSetBlock(blocks, x, topY + 1, z - 1, BLOCKS.BIRCH_LEAVES, true);
}

function generateTree(blocks, x, y, z, biome, rng) {
    if (biome.isMystic) { generateMysticTree(blocks, x, y, z, rng); return; }
    if (biome.isRedwood) { generateRedwoodTree(blocks, x, y, z, rng); return; }
    if (biome.savannaFlora || biome.name === 'Savanna') { generateAcaciaTree(blocks, x, y, z, rng); return; }
    if (biome.name === 'Tundra' || biome.name === 'Ice Spikes' || biome.name === 'Mountains' || biome.name === 'Taiga' || biome.isTaiga) { generatePineTree(blocks, x, y, z, rng); return; }
    if (biome.isDark || biome.name === 'Dark Forest') { generateDarkOakTree(blocks, x, y, z, rng); return; }
    if (biome.isBirch || biome.name === 'Birch Forest' || biome === BIOMES.BIRCH_FOREST) { generateBirchTree(blocks, x, y, z, rng); return; }
    if (biome.isCherry || biome.name === 'Cherry Grove') { generateCherryTree(blocks, x, y, z, rng); return; }
    if (biome.isOasis || biome.name === 'Oasis') { generatePalmTree(blocks, x, y, z, rng); return; }
    if (biome.jungleFlora || biome.name === 'Jungle') { generateJungleTree(blocks, x, y, z, rng); return; }

    generateOakTree(blocks, x, y, z, biome, rng);
}

function generateMushroom(blocks, x, y, z, rng) {
    const rFunc = rng || Math.random;
    const isBrown = rFunc() < 0.5;
    const height = 4 + Math.floor(rFunc() * 4);
    for (let i = 0; i < height; i++) safeSetBlock(blocks, x, y + i, z, BLOCKS.MUSHROOM_STEM);
    
    const capBlock = isBrown ? BLOCKS.BROWN_MUSHROOM_BLOCK : BLOCKS.MUSHROOM_CAP;
    if (isBrown) {
        // Minecraft-style flat brown mushroom cap (5x5 with clipped corners)
        for (let lx = x - 2; lx <= x + 2; lx++) {
            for (let lz = z - 2; lz <= z + 2; lz++) {
                if (Math.abs(lx - x) === 2 && Math.abs(lz - z) === 2) continue; // Clipped corners
                safeSetBlock(blocks, lx, y + height, lz, capBlock);
            }
        }
    } else {
        // Minecraft-style curved red mushroom cap (3x3 top with 5x5 drooping skirt)
        for (let lx = x - 1; lx <= x + 1; lx++) {
            for (let lz = z - 1; lz <= z + 1; lz++) {
                safeSetBlock(blocks, lx, y + height, lz, capBlock);
            }
        }
        for (let lx = x - 2; lx <= x + 2; lx++) {
            for (let lz = z - 2; lz <= z + 2; lz++) {
                if (Math.abs(lx - x) === 2 && Math.abs(lz - z) === 2) continue; // Corners
                if (Math.abs(lx - x) < 2 && Math.abs(lz - z) < 2) continue; // Skip inner under top
                safeSetBlock(blocks, lx, y + height - 1, lz, capBlock);
            }
        }
    }
}

function generateCrystal(blocks, x, y, z, rng) {
    const height = 2 + Math.floor((rng ? rng() : Math.random()) * 4);
    for (let i = 0; i < height; i++) safeSetBlock(blocks, x, y + i, z, BLOCKS.ALIEN_CRYSTAL);
}

function generateIceSpike(blocks, x, y, z, rng) {
    const random = rng || Math.random;
    // Minecraft ice spikes: 75% standard spikes (height 12-22), 25% giant spikes (height 28-42)
    const isGiant = random() < 0.25;
    const height = isGiant ? (26 + Math.floor(random() * 16)) : (10 + Math.floor(random() * 12));
    const baseRadius = isGiant ? 3 : (random() < 0.45 ? 2 : 1);

    // Anchor base into ground/ice sheet (down to 2 blocks below surface)
    for (let dy = -2; dy <= 0; dy++) {
        for (let dx = -baseRadius; dx <= baseRadius; dx++) {
            for (let dz = -baseRadius; dz <= baseRadius; dz++) {
                if (dx * dx + dz * dz <= baseRadius * baseRadius) {
                    const block = random() < 0.65 ? BLOCKS.PACKED_ICE : BLOCKS.BLUE_ICE;
                    safeSetBlock(blocks, x + dx, y + dy, z + dz, block);
                }
            }
        }
    }

    // Build tapered ice spire
    for (let dy = 0; dy < height; dy++) {
        const progress = dy / height; // 0 to 1
        let radius = Math.round(baseRadius * (1 - progress));
        if (progress > 0.85) radius = 0; // tapered tip

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const distSq = dx * dx + dz * dz;
                if (distSq <= radius * radius + 0.35) {
                    const isCore = (distSq <= Math.max(0, radius - 1) * Math.max(0, radius - 1));
                    let iceType;
                    if (isCore) {
                        iceType = random() < 0.7 ? BLOCKS.BLUE_ICE : BLOCKS.PACKED_ICE;
                    } else {
                        iceType = random() < 0.75 ? BLOCKS.PACKED_ICE : (random() < 0.5 ? BLOCKS.BLUE_ICE : BLOCKS.ICE);
                    }
                    safeSetBlock(blocks, x + dx, y + dy, z + dz, iceType);
                }
            }
        }
    }

    // Sharp spire needle at top
    safeSetBlock(blocks, x, y + height, z, BLOCKS.PACKED_ICE);
    if (isGiant) {
        safeSetBlock(blocks, x, y + height + 1, z, BLOCKS.BLUE_ICE);
    }
}

function generateCactus(blocks, x, y, z, rng) {
    const height = 2 + Math.floor((rng ? rng() : Math.random()) * 3);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.CACTUS);
    }
}

function generateDeadTree(blocks, x, y, z, rng) {
    const height = 7 + Math.floor(rng() * 6); // 7-12 blocks tall
    // Trunk
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.WOOD, true);
    }
    // Branch stubs at random heights
    const numBranches = 2 + Math.floor(rng() * 4);
    for (let b = 0; b < numBranches; b++) {
        const bh = Math.floor(rng() * (height - 2)) + 2; // Don't branch at base or top
        const bLen = 1 + Math.floor(rng() * 3); // 1-3 blocks long
        const bDir = Math.floor(rng() * 4); // 0=+x, 1=-x, 2=+z, 3=-z
        const dx = bDir === 0 ? 1 : bDir === 1 ? -1 : 0;
        const dz = bDir === 2 ? 1 : bDir === 3 ? -1 : 0;
        // Branches go out then up one at the end for gnarled look
        for (let i = 1; i <= bLen; i++) {
            safeSetBlock(blocks, x + dx * i, y + bh, z + dz * i, BLOCKS.WOOD, true);
        }
        // Branch-end: dead bush or upward stub
        if (rng() < 0.6) {
            safeSetBlock(blocks, x + dx * bLen, y + bh + 1, z + dz * bLen, BLOCKS.DEAD_BUSH, true);
        } else {
            safeSetBlock(blocks, x + dx * bLen, y + bh + 1, z + dz * bLen, BLOCKS.WOOD, true);
        }
    }
    // Small dead bush cluster at crown
    if (rng() < 0.7) {
        safeSetBlock(blocks, x, y + height, z, BLOCKS.DEAD_BUSH, true);
        if (rng() < 0.5) safeSetBlock(blocks, x + 1, y + height - 1, z, BLOCKS.DEAD_BUSH, true);
        if (rng() < 0.5) safeSetBlock(blocks, x - 1, y + height - 1, z, BLOCKS.DEAD_BUSH, true);
    }
}

// ============================================
// Dungeon Generation
// ============================================

const DUNGEON_THEMES = [
    { brick: BLOCKS.DUNGEON_BRICK, floor: BLOCKS.DUNGEON_FLOOR, name: 'normal' },
    { brick: BLOCKS.DUNGEON_FIRE_BRICK, floor: BLOCKS.DUNGEON_FIRE_FLOOR, name: 'fire' },
    { brick: BLOCKS.DUNGEON_ICE_BRICK, floor: BLOCKS.DUNGEON_ICE_FLOOR, name: 'ice' },
    { brick: BLOCKS.DUNGEON_JUNGLE_BRICK, floor: BLOCKS.DUNGEON_JUNGLE_FLOOR, name: 'jungle' },
    { brick: BLOCKS.DUNGEON_DESERT_BRICK, floor: BLOCKS.DUNGEON_DESERT_FLOOR, name: 'desert' },
    { brick: BLOCKS.DUNGEON_UNDEAD_BRICK, floor: BLOCKS.DUNGEON_UNDEAD_FLOOR, name: 'undead' }
];



// Cache dungeon room layouts by origin chunk key to avoid recomputing per-adjacent-chunk
const _dungeonCache = new Map();

function carveGlobalDungeons(blocks, cx, cz, params) {
    const searchRadius = 3; // Reduced from 6 to eliminate huge lag spikes
    for (let sx = cx - searchRadius; sx <= cx + searchRadius; sx++) {
        for (let sz = cz - searchRadius; sz <= cz + searchRadius; sz++) {
            // Determine if a dungeon starts at chunk (sx, sz)
            const seedStr = params.seed + "_" + sx + "_" + sz;
            const cacheKey = seedStr;
            
            let dungeonData = _dungeonCache.get(cacheKey);
            if (dungeonData === undefined) {
                const startRng = seededRandom(hashSeed(seedStr));
                const dCol = getColumnInfo(sx * CHUNK_SIZE + 8, sz * CHUNK_SIZE + 8, params);
                const isOcean = dCol.biome === BIOMES.DEEP_OCEAN || dCol.biome === BIOMES.OCEAN || dCol.biome === BIOMES.CORAL_REEF || dCol.biome === BIOMES.FROZEN_OCEAN;
                if (!isOcean && dCol.surfaceY > params.seaLevel + 3 && startRng() < params.dungeonFrequency * 0.012) { // Slightly reduced for less density
                    const themeIndex = Math.floor(startRng() * DUNGEON_THEMES.length);
                    const theme = DUNGEON_THEMES[themeIndex];
                    const rooms = generateDungeonStructure(startRng, sx * CHUNK_SIZE + 8, 15, sz * CHUNK_SIZE + 8);
                    for (const room of rooms) room.theme = theme;
                    dungeonData = rooms;
                } else {
                    dungeonData = null; // No dungeon here
                }
                // Cap cache size to avoid unbounded memory growth
                if (_dungeonCache.size > 512) {
                    const firstKey = _dungeonCache.keys().next().value;
                    _dungeonCache.delete(firstKey);
                }
                _dungeonCache.set(cacheKey, dungeonData);
            }
            
            if (dungeonData) {
                // Carve any room that intersects current chunk in prioritized layers:
                // 1. Base rooms and halls
                for (const room of dungeonData) {
                    if (room.type !== 'corridor' && room.type !== 'doorway') {
                        carveRoomInChunk(blocks, cx, cz, room);
                    }
                }
                // 2. Corridors connecting rooms
                for (const room of dungeonData) {
                    if (room.type === 'corridor') {
                        carveRoomInChunk(blocks, cx, cz, room);
                    }
                }
                // 3. Doorways punching through walls for clear passageways
                for (const room of dungeonData) {
                    if (room.type === 'doorway') {
                        carveRoomInChunk(blocks, cx, cz, room);
                    }
                }
            }

        }
    }
}

function generateDungeonStructure(rng, startX, startY, startZ) {
    const rooms = [];
    
    // Starting antechamber room
    rooms.push({ x: startX, y: startY, z: startZ, w: 9, h: 6, d: 9, type: 'start', shape: 'square' });
    
    const GRID_SIZE = 5;
    const CELL_SIZE = 16;
    
    const grid = [];
    for (let x=0; x<GRID_SIZE; x++) {
        grid[x] = [];
        for (let z=0; z<GRID_SIZE; z++) {
            grid[x][z] = { visited: false, connections: [], type: 'normal', shape: 'square' };
        }
    }
    
    // Randomized DFS for spanning tree
    const stack = [{x: 2, z: 2}];
    grid[2][2].visited = true;
    grid[2][2].type = 'start';
    
    let bossPlaced = false;
    
    while(stack.length > 0) {
        const curr = stack[stack.length - 1];
        
        const neighbors = [];
        if (curr.x > 0 && !grid[curr.x-1][curr.z].visited) neighbors.push({x: curr.x-1, z: curr.z});
        if (curr.x < GRID_SIZE-1 && !grid[curr.x+1][curr.z].visited) neighbors.push({x: curr.x+1, z: curr.z});
        if (curr.z > 0 && !grid[curr.x][curr.z-1].visited) neighbors.push({x: curr.x, z: curr.z-1});
        if (curr.z < GRID_SIZE-1 && !grid[curr.x][curr.z+1].visited) neighbors.push({x: curr.x, z: curr.z+1});
        
        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(rng() * neighbors.length)];
            
            if (rng() < 0.15 && stack.length > 1) {
                stack.pop();
            } else {
                grid[curr.x][curr.z].connections.push(next);
                grid[next.x][next.z].connections.push(curr);
                grid[next.x][next.z].visited = true;
                stack.push(next);
            }
        } else {
            const node = stack.pop();
            if (!bossPlaced && grid[node.x][node.z].connections.length === 1 && (node.x !== 2 || node.z !== 2)) {
                grid[node.x][node.z].type = 'boss';
                bossPlaced = true;
            }
        }
    }
    
    // Extended shape list with room types
    const shapes = ['square', 'circle', 'cross', 'pillars', 'pit', 'library'];
    
    for (let gx=0; gx<GRID_SIZE; gx++) {
        for (let gz=0; gz<GRID_SIZE; gz++) {
            const cell = grid[gx][gz];
            if (!cell.visited) continue;
            
            cell.shape = shapes[Math.floor(rng() * shapes.length)];
            if (cell.type === 'boss') cell.shape = 'square';
            
            const rx = startX + (gx - 2) * CELL_SIZE;
            const rz = startZ + (gz - 2) * CELL_SIZE;
            
            const roomW = cell.type === 'boss' ? 15 : 11;
            const roomH = cell.type === 'boss' ? 8 : 5;
            const roomD = cell.type === 'boss' ? 15 : 11;
            
            rooms.push({
                x: rx, y: startY, z: rz,
                w: roomW, h: roomH, d: roomD,
                type: cell.type,
                shape: cell.shape
            });
            
            // Build corridors and doorways placed directly in the walls
            for (const conn of cell.connections) {
                if (conn.x > gx) { 
                    // Right corridor (along X axis)
                    const wall1X = rx + Math.floor(roomW / 2);
                    const nextRx = startX + (conn.x - 2) * CELL_SIZE;
                    const nextRoomW = grid[conn.x][conn.z].type === 'boss' ? 15 : 11;
                    const wall2X = nextRx - Math.floor(nextRoomW / 2);
                    
                    const corrX = Math.round((wall1X + wall2X) / 2);
                    const corrW = Math.max(3, (wall2X - wall1X) + 1);
                    rooms.push({ x: corrX, y: startY, z: rz, w: corrW, h: 5, d: 5, type: 'corridor', shape: 'square' });
                    
                    // Doorway embedded right in the wall of room 1
                    rooms.push({ 
                        x: wall1X, y: startY, z: rz,
                        w: 3, h: 5, d: 3, type: 'doorway', orient: 'x'
                    });
                    // Doorway embedded right in the wall of room 2
                    rooms.push({ 
                        x: wall2X, y: startY, z: rz,
                        w: 3, h: 5, d: 3, type: 'doorway', orient: 'x'
                    });
                }
                if (conn.z > gz) { 
                    // Down corridor (along Z axis)
                    const wall1Z = rz + Math.floor(roomD / 2);
                    const nextRz = startZ + (conn.z - 2) * CELL_SIZE;
                    const nextRoomD = grid[conn.x][conn.z].type === 'boss' ? 15 : 11;
                    const wall2Z = nextRz - Math.floor(nextRoomD / 2);
                    
                    const corrZ = Math.round((wall1Z + wall2Z) / 2);
                    const corrD = Math.max(3, (wall2Z - wall1Z) + 1);
                    rooms.push({ x: rx, y: startY, z: corrZ, w: 5, h: 5, d: corrD, type: 'corridor', shape: 'square' });
                    
                    // Doorway embedded right in the wall of room 1
                    rooms.push({ 
                        x: rx, y: startY, z: wall1Z,
                        w: 3, h: 5, d: 3, type: 'doorway', orient: 'z'
                    });
                    // Doorway embedded right in the wall of room 2
                    rooms.push({ 
                        x: rx, y: startY, z: wall2Z,
                        w: 3, h: 5, d: 3, type: 'doorway', orient: 'z'
                    });
                }
            }
        }
    }
    
    return rooms;
}

function carveRoomInChunk(blocks, cx, cz, room) {

    const minX = Math.floor(room.x - room.w / 2);
    const maxX = Math.floor(room.x + room.w / 2);
    const minZ = Math.floor(room.z - room.d / 2);
    const maxZ = Math.floor(room.z + room.d / 2);
    const minY = room.y;
    const maxY = room.y + room.h;

    // Check intersection with chunk
    const cMinX = cx * CHUNK_SIZE;
    const cMaxX = cMinX + CHUNK_SIZE - 1;
    const cMinZ = cz * CHUNK_SIZE;
    const cMaxZ = cMinZ + CHUNK_SIZE - 1;

    if (maxX < cMinX || minX > cMaxX || maxZ < cMinZ || minZ > cMaxZ) return;

    // Carve locally
    for (let wy = minY; wy <= maxY; wy++) {
        if (wy < 0 || wy >= CHUNK_HEIGHT) continue;
        for (let wx = minX; wx <= Math.min(maxX, cMaxX); wx++) {
            if (wx < cMinX) continue;
            for (let wz = minZ; wz <= Math.min(maxZ, cMaxZ); wz++) {
                if (wz < cMinZ) continue;
                
                const lx = wx - cMinX;
                const lz = wz - cMinZ;
                
                // Doorway: embeds a door in the wall between rooms and corridors for actual passageways
                if (room.type === 'doorway') {
                    const dwx = Math.floor(room.x);
                    const dwz = Math.floor(room.z);
                    const orient = room.orient; // 'x' or 'z'

                    if (orient === 'x') {
                        // Wall plane is at wx === dwx, passage runs along X
                        if (wx === dwx) {
                            if (wz === dwz) {
                                // Exact door opening through the wall
                                if (wy === minY) {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.floor : BLOCKS.STONE_BRICKS, false);
                                } else if (wy === minY + 1) {
                                    safeSetBlock(blocks, lx, wy, lz, BLOCKS.DUNGEON_DOOR, false); // Door bottom
                                } else if (wy === minY + 2) {
                                    safeSetBlock(blocks, lx, wy, lz, BLOCKS.DUNGEON_DOOR_TOP, false); // Door top
                                } else {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.brick : BLOCKS.STONE_BRICKS, false); // Solid lintel header over door
                                }
                            } else if (wz === dwz - 1 || wz === dwz + 1) {
                                // Solid wall flanking the door
                                if (wy === minY) {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.floor : BLOCKS.STONE_BRICKS, false);
                                } else {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.brick : BLOCKS.STONE_BRICKS, false);
                                }
                            }
                        } else if (wx === dwx - 1 || wx === dwx + 1) {
                            // Approach spaces immediately in front of and behind door
                            if (wz === dwz) {
                                if (wy === minY) {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.floor : BLOCKS.STONE_BRICKS, false);
                                } else if (wy === minY + 1 || wy === minY + 2) {
                                    safeSetBlock(blocks, lx, wy, lz, BLOCKS.AIR, false); // Clear 2-block tall passageway
                                } else if (wy >= minY + 3) {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.brick : BLOCKS.STONE_BRICKS, false); // Ceiling/lintel
                                }
                            }
                        }
                    } else {
                        // Wall plane is at wz === dwz, passage runs along Z
                        if (wz === dwz) {
                            if (wx === dwx) {
                                // Exact door opening through the wall
                                if (wy === minY) {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.floor : BLOCKS.STONE_BRICKS, false);
                                } else if (wy === minY + 1) {
                                    safeSetBlock(blocks, lx, wy, lz, BLOCKS.DUNGEON_DOOR, false); // Door bottom
                                } else if (wy === minY + 2) {
                                    safeSetBlock(blocks, lx, wy, lz, BLOCKS.DUNGEON_DOOR_TOP, false); // Door top
                                } else {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.brick : BLOCKS.STONE_BRICKS, false); // Solid lintel header over door
                                }
                            } else if (wx === dwx - 1 || wx === dwx + 1) {
                                // Solid wall flanking the door
                                if (wy === minY) {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.floor : BLOCKS.STONE_BRICKS, false);
                                } else {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.brick : BLOCKS.STONE_BRICKS, false);
                                }
                            }
                        } else if (wz === dwz - 1 || wz === dwz + 1) {
                            // Approach spaces immediately in front of and behind door
                            if (wx === dwx) {
                                if (wy === minY) {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.floor : BLOCKS.STONE_BRICKS, false);
                                } else if (wy === minY + 1 || wy === minY + 2) {
                                    safeSetBlock(blocks, lx, wy, lz, BLOCKS.AIR, false); // Clear 2-block tall passageway
                                } else if (wy >= minY + 3) {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.brick : BLOCKS.STONE_BRICKS, false); // Ceiling/lintel
                                }
                            }
                        }
                    }
                    continue;
                }

                let inside = false;
                let isWall = false;
                
                const dx = Math.abs(wx - room.x);
                const dz = Math.abs(wz - room.z);
                const rw = room.w / 2;
                const rd = room.d / 2;

                if (room.shape === 'circle') {
                    const distSq = dx*dx + dz*dz;
                    if (distSq <= rw*rd) {
                        inside = true;
                        if (distSq >= (rw-1)*(rd-1)) isWall = true;
                    }
                } else if (room.shape === 'cross') {
                    const coreW = rw; const coreD = rd;
                    const armW = rw * 0.4; const armD = rd * 0.4;
                    const inCore = (dx <= coreW && dz <= armD);
                    const inArm = (dz <= coreD && dx <= armW);
                    
                    if (inCore || inArm) {
                        inside = true;
                        const inCoreInner = (dx <= coreW - 1 && dz <= armD - 1);
                        const inArmInner = (dz <= coreD - 1 && dx <= armW - 1);
                        if (!inCoreInner && !inArmInner) isWall = true;
                    }
                } else if (room.shape === 'L_shaped') {
                    // L-shape: full bottom half + left half of top
                    const inBottom = (dx <= rw && dz <= rd * 0.5);
                    const inLeft = (dx <= rw * 0.5 && dz <= rd);
                    if (inBottom || inLeft) {
                        inside = true;
                        const inBottomInner = (dx <= rw - 1 && dz <= rd * 0.5 - 1);
                        const inLeftInner = (dx <= rw * 0.5 - 1 && dz <= rd - 1);
                        if (!inBottomInner && !inLeftInner) isWall = true;
                    }
                } else if (room.shape === 'pillars') {
                    // Square room with 4 pillars inside
                    if (dx <= rw && dz <= rd) {
                        inside = true;
                        if (dx >= rw - 0.5 || dz >= rd - 0.5) isWall = true;
                        // Pillars at 1/3 positions
                        const pillarX = Math.floor(rw * 0.5);
                        const pillarZ = Math.floor(rd * 0.5);
                        if ((dx === pillarX || dx === pillarX - 1) && (dz === pillarZ || dz === pillarZ - 1)) {
                            isWall = true; // Pillar block
                        }
                    }
                } else if (room.shape === 'pit') {
                    // Square room with sunken center
                    if (dx <= rw && dz <= rd) {
                        inside = true;
                        if (dx >= rw - 0.5 || dz >= rd - 0.5) isWall = true;
                    }
                } else if (room.shape === 'library') {
                    // Rectangular room with bookshelf blocks along walls
                    if (dx <= rw && dz <= rd) {
                        inside = true;
                        if (dx >= rw - 0.5 || dz >= rd - 0.5) isWall = true;
                        // Shelves 1 block inward from walls, 1-2 blocks tall
                        if (wy >= minY + 1 && wy <= minY + 2) {
                            if ((dx === Math.floor(rw) - 1 || dz === Math.floor(rd) - 1) && dx < rw - 0.5 && dz < rd - 0.5) {
                                // Don't place shelves at the exact center (leave walkways)
                                if (dx > 1 && dz > 1) isWall = true;
                            }
                        }
                    }
                } else {
                    // square (default)
                    if (dx <= rw && dz <= rd) {
                        inside = true;
                        if (dx >= rw - 0.5 || dz >= rd - 0.5) isWall = true;
                    }
                }
                
                if (wy === minY || wy === Math.min(maxY, CHUNK_HEIGHT - 1)) {
                    if (inside) isWall = true;
                }
                
                if (!inside) continue;
                
                if (isWall) {
                    if (room.type === 'boss') safeSetBlock(blocks, lx, wy, lz, BLOCKS.POLISHED_BLACKSTONE_BRICKS);
                    else if (room.shape === 'library' && wy >= minY + 1 && wy <= minY + 2) {
                        // Use planks for bookshelves in interior, themed brick for outer walls
                        const isOuterWall = dx >= rw - 0.5 || dz >= rd - 0.5 || wy === minY || wy === maxY;
                        if (isOuterWall) {
                            if (wy === minY) safeSetBlock(blocks, lx, wy, lz, room.theme.floor);
                            else safeSetBlock(blocks, lx, wy, lz, room.theme.brick);
                        } else {
                            safeSetBlock(blocks, lx, wy, lz, BLOCKS.PLANKS); // Bookshelf
                        }
                    } else if (room.shape === 'pillars' && dx < rw - 0.5 && dz < rd - 0.5 && wy > minY && wy < maxY) {
                        // Pillar columns: use cobblestone for contrast
                        safeSetBlock(blocks, lx, wy, lz, BLOCKS.STONE_BRICKS);
                    } else {
                        const wallRng = Math.random();
                        if (wy === minY) safeSetBlock(blocks, lx, wy, lz, room.theme.floor);
                        else if (wallRng < 0.15) safeSetBlock(blocks, lx, wy, lz, BLOCKS.COBBLESTONE);
                        else safeSetBlock(blocks, lx, wy, lz, room.theme.brick);
                    }
                } else {
                    // Interior air or special features
                    if (room.type === 'entrance' && wy <= minY + 2) {
                        safeSetBlock(blocks, lx, wy, lz, BLOCKS.WATER);
                    } else if (room.shape === 'pit' && dx <= rw * 0.4 && dz <= rd * 0.4 && wy === minY + 1) {
                        // Sunken pit center — use lava for fire theme, water for ice, etc.
                        safeSetBlock(blocks, lx, wy, lz, BLOCKS.AIR); // Dig the pit
                        if (wy === minY + 1) {
                            safeSetBlock(blocks, lx, minY, lz, BLOCKS.AIR); // Remove floor for pit
                            safeSetBlock(blocks, lx, minY - 1, lz, room.theme.floor); // New pit floor
                        }
                    } else {
                        safeSetBlock(blocks, lx, wy, lz, BLOCKS.AIR);
                    }
                    
                    // Boss Spawner
                    if (room.type === 'boss' && wy === minY + 1 && wx === Math.floor(room.x) && wz === Math.floor(room.z)) {
                        safeSetBlock(blocks, lx, wy, lz, BLOCKS.BOSS_SPAWNER);
                    }
                    
                    // Chests
                    if (room.type === 'normal' && wy === minY + 1 && wx === Math.floor(room.x) && wz === Math.floor(room.z)) {
                        const chestRng = Math.random();
                        if (chestRng < 0.3) {
                            safeSetBlock(blocks, lx, wy, lz, BLOCKS.CHEST_BLOCK);
                        }
                    }
                    
                    // Torches in rooms for light
                    if (wy === minY + 3 && room.type !== 'entrance' && room.type !== 'corridor') {
                        if (wx === Math.floor(room.x) && (wz === Math.floor(room.z - rd + 2) || wz === Math.floor(room.z + rd - 2))) {
                            safeSetBlock(blocks, lx, wy, lz, BLOCKS.TORCH);
                        }
                        if (wz === Math.floor(room.z) && (wx === Math.floor(room.x - rw + 2) || wx === Math.floor(room.x + rw - 2))) {
                            safeSetBlock(blocks, lx, wy, lz, BLOCKS.TORCH);
                        }
                    }
                }
            }
        }
    }
}

export function generatePortalStructure(blocks, x, y, z, rng, type = 'nether') {
    let frame1, frame2, base;
    if (type === 'nether') { frame1 = BLOCKS.OBSIDIAN; frame2 = BLOCKS.CRYING_OBSIDIAN; base = BLOCKS.NETHERRACK; }
    else if (type === 'aether') { frame1 = BLOCKS.GLOWSTONE; frame2 = BLOCKS.AETHER_STONE; base = BLOCKS.AETHER_DIRT; }
    else if (type === 'cavern') { frame1 = BLOCKS.DIRT; frame2 = BLOCKS.GRASS; base = BLOCKS.STONE; }
    else if (type === 'highlands') { frame1 = BLOCKS.STONE; frame2 = BLOCKS.COBBLESTONE; base = BLOCKS.DIRT; }

    // 4x5 ruined portal
    for (let px = x; px < x + 4; px++) {
        for (let py = y; py < y + 5; py++) {
            // More degraded frame
            if (rng() < 0.3) continue; // missing blocks
            
            if (px === x || px === x + 3 || py === y || py === y + 4) {
                safeSetBlock(blocks, px, py, z, rng() < 0.2 ? frame1 : frame2, true);
            }
        }
    }
    // Base platform
    for (let px = x - 1; px < x + 5; px++) {
        for (let pz = z - 2; pz < z + 3; pz++) {
            if (rng() < 0.6) safeSetBlock(blocks, px, y - 1, pz, base, true);
        }
    }
    // Add a chest with loot
    if (rng() < 0.8) {
        safeSetBlock(blocks, x + 1, y, z + 1, BLOCKS.CHEST_BLOCK, true);
        if (type === 'nether') safeSetBlock(blocks, x + 1, y - 1, z + 1, BLOCKS.PORTAL, false);
        else if (type === 'aether') safeSetBlock(blocks, x + 1, y - 1, z + 1, BLOCKS.AETHER_PORTAL, false);
        else if (type === 'cavern') safeSetBlock(blocks, x + 1, y - 1, z + 1, BLOCKS.CAVERN_PORTAL, false);
        else if (type === 'highlands') safeSetBlock(blocks, x + 1, y - 1, z + 1, BLOCKS.HIGHLANDS_PORTAL, false);
    }
}

export function generateCabin(blocks, x, y, z, rng) {
    // Solid foundation down into ground so house never floats on uneven terrain
    for (let px = x - 3; px <= x + 3; px++) {
        for (let pz = z - 3; pz <= z + 3; pz++) {
            for (let dy = 1; dy <= 5; dy++) {
                const fy = y - dy;
                if (fy < 1) break;
                const idx = (fy * CHUNK_SIZE * CHUNK_SIZE) + (pz * CHUNK_SIZE) + px;
                const cur = (px >= 0 && px < CHUNK_SIZE && pz >= 0 && pz < CHUNK_SIZE) ? blocks[idx] : BLOCKS.AIR;
                if (cur === BLOCKS.AIR || cur === BLOCKS.WATER || cur === BLOCKS.SWAMP_WATER) {
                    safeSetBlock(blocks, px, fy, pz, BLOCKS.COBBLESTONE);
                } else {
                    break; // hit solid ground
                }
            }
        }
    }

    // Floor at y - 1
    for (let px = x - 3; px <= x + 3; px++) {
        for (let pz = z - 3; pz <= z + 3; pz++) {
            const isBorder = px === x - 3 || px === x + 3 || pz === z - 3 || pz === z + 3;
            safeSetBlock(blocks, px, y - 1, pz, isBorder ? BLOCKS.COBBLESTONE : BLOCKS.PLANKS);
        }
    }

    // Clear interior volume
    for (let py = y; py <= y + 4; py++) {
        for (let px = x - 2; px <= x + 2; px++) {
            for (let pz = z - 2; pz <= z + 2; pz++) {
                safeSetBlock(blocks, px, py, pz, BLOCKS.AIR);
            }
        }
    }

    // Walls from y to y + 3
    for (let py = y; py < y + 4; py++) {
        for (let px = x - 3; px <= x + 3; px++) {
            for (let pz = z - 3; pz <= z + 3; pz++) {
                const isCorner = (px === x - 3 || px === x + 3) && (pz === z - 3 || pz === z + 3);
                const isWall = px === x - 3 || px === x + 3 || pz === z - 3 || pz === z + 3;

                if (isCorner) {
                    safeSetBlock(blocks, px, py, pz, BLOCKS.WOOD); // Corner log pillars
                } else if (isWall) {
                    if (pz === z - 3 && px === x) {
                        // Front door doorway: replaces wall blocks for an actual passageway!
                        if (py === y) {
                            safeSetBlock(blocks, px, py, pz, BLOCKS.DUNGEON_DOOR); // Bottom door block
                        } else if (py === y + 1) {
                            safeSetBlock(blocks, px, py, pz, BLOCKS.DUNGEON_DOOR_TOP); // Top door block
                        } else {
                            safeSetBlock(blocks, px, py, pz, BLOCKS.PLANKS); // Solid lintel header over door
                        }
                    } else if (py === y) {
                        safeSetBlock(blocks, px, py, pz, BLOCKS.COBBLESTONE); // Stone foundation base
                    } else if (py === y + 1 || py === y + 2) {
                        // Glass windows
                        const isWindow = (
                            (px === x - 3 && (pz === z - 1 || pz === z + 1)) ||
                            (px === x + 3 && (pz === z - 1 || pz === z + 1)) ||
                            (pz === z + 3 && (px === x - 1 || px === x + 1))
                        );
                        safeSetBlock(blocks, px, py, pz, isWindow ? BLOCKS.GLASS : BLOCKS.PLANKS);
                    } else {
                        safeSetBlock(blocks, px, py, pz, BLOCKS.PLANKS);
                    }
                }
            }
        }
    }

    // Doorstep outside & clear entryway
    safeSetBlock(blocks, x, y - 1, z - 4, BLOCKS.COBBLESTONE);
    safeSetBlock(blocks, x, y, z - 4, BLOCKS.AIR);
    safeSetBlock(blocks, x, y + 1, z - 4, BLOCKS.AIR);
    safeSetBlock(blocks, x, y, z - 2, BLOCKS.AIR);
    safeSetBlock(blocks, x, y + 1, z - 2, BLOCKS.AIR);

    // Exterior entrance lanterns/torches
    safeSetBlock(blocks, x - 1, y + 2, z - 4, BLOCKS.TORCH);
    safeSetBlock(blocks, x + 1, y + 2, z - 4, BLOCKS.TORCH);

    // Pitched A-Frame Gable Roof
    // Slopes up towards center ridge (x) along the Z axis, with front & back overhangs (z - 4 to z + 4)
    for (let pz = z - 4; pz <= z + 4; pz++) {
        const isEaveEdgeZ = (pz === z - 4 || pz === z + 4);

        // Tier 1: Eaves overhang at x ± 4, height y + 3
        safeSetBlock(blocks, x - 4, y + 3, pz, BLOCKS.COBBLESTONE);
        safeSetBlock(blocks, x + 4, y + 3, pz, BLOCKS.COBBLESTONE);

        // Tier 2: Slope step at x ± 3 and x ± 2, height y + 4
        const t2Mat = isEaveEdgeZ ? BLOCKS.COBBLESTONE : BLOCKS.PLANKS;
        safeSetBlock(blocks, x - 3, y + 4, pz, t2Mat);
        safeSetBlock(blocks, x - 2, y + 4, pz, t2Mat);
        safeSetBlock(blocks, x + 2, y + 4, pz, t2Mat);
        safeSetBlock(blocks, x + 3, y + 4, pz, t2Mat);

        // Tier 3: Upper slope at x ± 1, height y + 5
        const t3Mat = isEaveEdgeZ ? BLOCKS.COBBLESTONE : BLOCKS.PLANKS;
        safeSetBlock(blocks, x - 1, y + 5, pz, t3Mat);
        safeSetBlock(blocks, x + 1, y + 5, pz, t3Mat);

        // Tier 4: Peak Ridge Line at x, height y + 6
        safeSetBlock(blocks, x, y + 6, pz, isEaveEdgeZ ? BLOCKS.COBBLESTONE : BLOCKS.WOOD);
    }

    // Enclose triangular gables on front and back
    for (const pz of [z - 3, z + 3]) {
        safeSetBlock(blocks, x - 2, y + 4, pz, BLOCKS.PLANKS);
        safeSetBlock(blocks, x - 1, y + 4, pz, BLOCKS.PLANKS);
        safeSetBlock(blocks, x,     y + 4, pz, BLOCKS.GLASS); // Attic roundel / window
        safeSetBlock(blocks, x + 1, y + 4, pz, BLOCKS.PLANKS);
        safeSetBlock(blocks, x + 2, y + 4, pz, BLOCKS.PLANKS);
        safeSetBlock(blocks, x - 1, y + 5, pz, BLOCKS.PLANKS);
        safeSetBlock(blocks, x,     y + 5, pz, BLOCKS.PLANKS);
        safeSetBlock(blocks, x + 1, y + 5, pz, BLOCKS.PLANKS);
    }

    // Ceiling beams inside
    for (let px = x - 2; px <= x + 2; px++) {
        safeSetBlock(blocks, px, y + 3, z - 1, BLOCKS.WOOD);
        safeSetBlock(blocks, px, y + 3, z + 1, BLOCKS.WOOD);
    }

    // Interior Furnishings
    // Bed (Back Left)
    safeSetBlock(blocks, x - 2, y, z + 2, BLOCKS.WOOL); // Bed foot
    safeSetBlock(blocks, x - 2, y, z + 1, BLOCKS.SNOW); // Pillow / head
    // Chest (Back Right)
    safeSetBlock(blocks, x + 2, y, z + 2, BLOCKS.CHEST_BLOCK);
    // Furnace (Right Wall)
    safeSetBlock(blocks, x + 2, y, z, BLOCKS.FURNACE);
    // Crafting Table (Left Wall)
    safeSetBlock(blocks, x - 2, y, z - 1, BLOCKS.CRAFTING_TABLE);
    // Bookshelf (Left Wall)
    safeSetBlock(blocks, x - 2, y, z, BLOCKS.BOOKSHELF);
    // Cozy Lighting
    safeSetBlock(blocks, x - 1, y + 2, z + 2, BLOCKS.TORCH);
    safeSetBlock(blocks, x + 1, y + 2, z + 2, BLOCKS.TORCH);
}

function carveGlobalNetherStructures(blocks, cx, cz, params) {
    const searchRadius = 3;
    for (let sx = cx - searchRadius; sx <= cx + searchRadius; sx++) {
        for (let sz = cz - searchRadius; sz <= cz + searchRadius; sz++) {
            const seedStr = params.seed + "_nether_" + sx + "_" + sz;
            const startRng = seededRandom(hashSeed(seedStr));
            if (startRng() < 0.05) { // 5% chance per chunk to start a fortress
                const theme = { brick: BLOCKS.NETHER_BRICKS, floor: BLOCKS.NETHER_BRICKS };
                // Generate high up above lava lakes
                const rooms = generateDungeonStructure(startRng, sx * CHUNK_SIZE + 8, 40, sz * CHUNK_SIZE + 8);
                
                for (const room of rooms) {
                    // Remove the massive entrance shaft for nether fortresses
                    if (room.type === 'entrance') continue;
                    
                    room.theme = theme;
                    carveRoomInChunk(blocks, cx, cz, room);
                    
                    // Add blaze spawners in boss rooms
                    if (room.type === 'boss') {
                        const minX = Math.floor(room.x - room.w / 2);
                        const maxX = Math.floor(room.x + room.w / 2);
                        const minZ = Math.floor(room.z - room.d / 2);
                        const maxZ = Math.floor(room.z + room.d / 2);
                        const minY = room.y;
                        const cMinX = cx * CHUNK_SIZE;
                        const cMaxX = cMinX + CHUNK_SIZE - 1;
                        const cMinZ = cz * CHUNK_SIZE;
                        const cMaxZ = cMinZ + CHUNK_SIZE - 1;
                        
                        if (Math.floor(room.x) >= cMinX && Math.floor(room.x) <= cMaxX && 
                            Math.floor(room.z) >= cMinZ && Math.floor(room.z) <= cMaxZ) {
                            const lx = Math.floor(room.x) - cMinX;
                            const lz = Math.floor(room.z) - cMinZ;
                            // Re-purpose boss spawner or just use it (it will spawn FIRE_GOLEM since floor is NETHER_BRICKS if we mapped it, wait no, let's let boss spawner work normally or just use it as is)
                        }
                    }
                }
            }
        }
    }
}

export function generateNetherChunk(cx, cz, params) {
    const blocks = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    const rng = seededRandom(params.seed + cx * 314159 + cz);

    const seaLevel = 32;

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = cx * CHUNK_SIZE + x;
            const wz = cz * CHUNK_SIZE + z;

            // Determine Nether biome using temp and moist noise
            const temp = (params.tempNoise(wx * 0.002, wz * 0.002) + 1) / 2;
            const moist = (params.moistNoise(wx * 0.002, wz * 0.002) + 1) / 2;
            
            let biome = 'NETHER_WASTES';
            if (temp > 0.65) {
                biome = 'CRIMSON_FOREST';
            } else if (temp < 0.35 && moist > 0.45) {
                biome = 'WARPED_FOREST';
            } else if (moist < 0.32 && temp < 0.6) {
                biome = 'SOUL_SAND_VALLEY';
            } else if (temp > 0.52 && moist < 0.42) {
                biome = 'BASALT_DELTAS';
            }

            const colRng = seededRandom(params.seed + wx * 1234 + wz);

            let nextNval = fbm3D(params.caveNoise, wx * 0.015, 0 * 0.02, wz * 0.015, 2);
            for (let y = 0; y < CHUNK_HEIGHT; y += 4) {
                const nval0 = nextNval;
                nextNval = fbm3D(params.caveNoise, wx * 0.015, (y + 4) * 0.02, wz * 0.015, 2);

                for (let dy = 0; dy < 4 && y + dy < CHUNK_HEIGHT; dy++) {
                    const cy = y + dy;
                    const idx = (cy * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

                    if (cy === 0 || cy === CHUNK_HEIGHT - 1) {
                        blocks[idx] = BLOCKS.BEDROCK;
                        continue;
                    }

                    const lerpFactor = dy / 4;
                    const nval = nval0 * (1 - lerpFactor) + nextNval * lerpFactor;
                    
                    const midY = 48;
                    let distFromMid = Math.abs(cy - midY) / 48.0; 
                    if (cy > 96) distFromMid += (cy - 96) * 0.1; // Ceiling solidness
                    const threshold = -0.1 + (distFromMid * 0.6); 

                    if (nval <= threshold || cy > 110) {
                        if (biome === 'SOUL_SAND_VALLEY') {
                            blocks[idx] = colRng() < 0.4 ? BLOCKS.SOUL_SOIL : BLOCKS.SOUL_SAND;
                        } else if (biome === 'BASALT_DELTAS') {
                            blocks[idx] = colRng() < 0.5 ? BLOCKS.BASALT : BLOCKS.BLACKSTONE;
                        } else {
                            blocks[idx] = BLOCKS.NETHERRACK;
                        }
                    } else if (cy <= seaLevel) {
                        blocks[idx] = BLOCKS.LAVA;
                    } else {
                        blocks[idx] = BLOCKS.AIR;
                    }
                }
            }

            // Second pass for this column to apply floor/ceiling decorations
            for (let y = CHUNK_HEIGHT - 2; y >= 1; y--) {
                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                const idxAbove = ((y + 1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                const idxBelow = ((y - 1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

                const b = blocks[idx];
                const above = y < CHUNK_HEIGHT - 1 ? blocks[idxAbove] : BLOCKS.BEDROCK;
                const below = y > 0 ? blocks[idxBelow] : BLOCKS.BEDROCK;

                // Floor block (air above)
                if (b !== BLOCKS.AIR && b !== BLOCKS.LAVA && above === BLOCKS.AIR) {
                    if (biome === 'CRIMSON_FOREST') {
                        blocks[idx] = BLOCKS.CRIMSON_NYLIUM;
                        if (colRng() < 0.04) {
                            generateCrimsonTree(blocks, x, y + 1, z, rng);
                        } else if (colRng() < 0.12) {
                            safeSetBlock(blocks, x, y + 1, z, BLOCKS.MUSHROOM_STEM, true);
                        }
                    } else if (biome === 'WARPED_FOREST') {
                        blocks[idx] = BLOCKS.WARPED_NYLIUM;
                        if (colRng() < 0.04) {
                            generateWarpedTree(blocks, x, y + 1, z, rng);
                        } else if (colRng() < 0.12) {
                            safeSetBlock(blocks, x, y + 1, z, BLOCKS.WARPED_ROOTS, true);
                        } else if (colRng() < 0.08) {
                            safeSetBlock(blocks, x, y + 1, z, BLOCKS.NETHER_SPROUTS, true);
                        } else if (colRng() < 0.04) {
                            const vH = 2 + Math.floor(colRng() * 3);
                            for (let v = 1; v <= vH; v++) {
                                safeSetBlock(blocks, x, y + v, z, BLOCKS.TWISTING_VINES, true);
                            }
                        }
                    } else if (biome === 'SOUL_SAND_VALLEY') {
                        blocks[idx] = colRng() < 0.4 ? BLOCKS.SOUL_SOIL : BLOCKS.SOUL_SAND;
                        // Blue soul fire flickering on the ground!
                        if (colRng() < 0.045) {
                            safeSetBlock(blocks, x, y + 1, z, BLOCKS.SOUL_FIRE, true);
                        }
                    } else if (biome === 'BASALT_DELTAS') {
                        const bRoll = colRng();
                        if (bRoll < 0.45) blocks[idx] = BLOCKS.BASALT;
                        else if (bRoll < 0.7) blocks[idx] = BLOCKS.BLACKSTONE;
                        else if (bRoll < 0.85) blocks[idx] = BLOCKS.SMOOTH_BASALT;
                        else blocks[idx] = BLOCKS.MAGMA;

                        if (colRng() < 0.03) {
                            generateBasaltColumn(blocks, x, y + 1, z, 6 + Math.floor(colRng() * 12), colRng);
                        }
                    } else {
                        // NETHER_WASTES
                        blocks[idx] = BLOCKS.NETHERRACK;
                        if (colRng() < 0.03) {
                            safeSetBlock(blocks, x, y + 1, z, BLOCKS.FIRE, true);
                        }
                        if (colRng() < 0.04) blocks[idx] = BLOCKS.CRYSTAL_ORE;
                        if (colRng() < 0.02) blocks[idx] = BLOCKS.GOLD_ORE;
                    }
                }

                // Ceiling block (air below)
                if (b !== BLOCKS.AIR && b !== BLOCKS.LAVA && below === BLOCKS.AIR) {
                    if (colRng() < 0.025) {
                        // Glowstone stalactites
                        safeSetBlock(blocks, x, y - 1, z, BLOCKS.GLOWSTONE, true);
                        if (colRng() < 0.5) safeSetBlock(blocks, x, y - 2, z, BLOCKS.GLOWSTONE, true);
                    } else if (biome === 'CRIMSON_FOREST' && colRng() < 0.08) {
                        // Weeping vines from ceiling
                        const vLen = 2 + Math.floor(colRng() * 5);
                        for (let v = 1; v <= vLen; v++) {
                            safeSetBlock(blocks, x, y - v, z, BLOCKS.CRIMSON_LEAVES, true);
                        }
                    }
                }
            }
        }
    }

    // Soul Sand Valley Giant Bone Fossils
    if (rng() < 0.12) {
        const fx = Math.floor(rng() * (CHUNK_SIZE - 6)) + 3;
        const fz = Math.floor(rng() * (CHUNK_SIZE - 6)) + 3;
        let groundY = -1;
        for (let y = 80; y > 33; y--) {
            const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (fz * CHUNK_SIZE) + fx;
            if (blocks[idx] === BLOCKS.SOUL_SAND || blocks[idx] === BLOCKS.SOUL_SOIL) {
                groundY = y;
                break;
            }
        }
        if (groundY > 32) {
            generateNetherFossil(blocks, fx, groundY, fz, rng);
        }
    }

    // Fortress generation
    carveGlobalNetherStructures(blocks, cx, cz, params);

    return blocks;
}

function generateNetherFossil(blocks, x, y, z, rng) {
    const isArch = rng() < 0.6;
    if (isArch) {
        const height = 4 + Math.floor(rng() * 3);
        const width = 3 + Math.floor(rng() * 2);
        for (let dy = 0; dy <= height; dy++) {
            safeSetBlock(blocks, x - width, y + dy, z, BLOCKS.BONE_BLOCK);
            safeSetBlock(blocks, x + width, y + dy, z, BLOCKS.BONE_BLOCK);
        }
        for (let dx = -width; dx <= width; dx++) {
            safeSetBlock(blocks, x + dx, y + height, z, BLOCKS.BONE_BLOCK);
        }
        // Second rib arch
        if (rng() < 0.75) {
            const z2 = z + 2;
            for (let dy = 0; dy <= height - 1; dy++) {
                safeSetBlock(blocks, x - width, y + dy, z2, BLOCKS.BONE_BLOCK);
                safeSetBlock(blocks, x + width, y + dy, z2, BLOCKS.BONE_BLOCK);
            }
            for (let dx = -width; dx <= width; dx++) {
                safeSetBlock(blocks, x + dx, y + height - 1, z2, BLOCKS.BONE_BLOCK);
            }
        }
    } else {
        // Spine
        const len = 6 + Math.floor(rng() * 5);
        for (let i = 0; i < len; i++) {
            safeSetBlock(blocks, x + i, y + 1, z, BLOCKS.BONE_BLOCK);
            if (i % 2 === 0) {
                safeSetBlock(blocks, x + i, y + 1, z - 1, BLOCKS.BONE_BLOCK);
                safeSetBlock(blocks, x + i, y + 1, z + 1, BLOCKS.BONE_BLOCK);
                safeSetBlock(blocks, x + i, y + 2, z - 2, BLOCKS.BONE_BLOCK);
                safeSetBlock(blocks, x + i, y + 2, z + 2, BLOCKS.BONE_BLOCK);
            }
        }
    }
}

function generateWarpedTree(blocks, x, y, z, rng) {
    const h = 5 + Math.floor(rng() * 4);
    for (let py = y; py < y + h; py++) {
        safeSetBlock(blocks, x, py, z, BLOCKS.WARPED_STEM, true);
    }
    for (let px = x - 2; px <= x + 2; px++) {
        for (let pz = z - 2; pz <= z + 2; pz++) {
            for (let py = y + h - 2; py <= y + h + 1; py++) {
                if (Math.abs(px - x) === 2 && Math.abs(pz - z) === 2 && py === y + h + 1) continue;
                safeSetBlock(blocks, px, py, pz, BLOCKS.WARPED_WART_BLOCK, true);
            }
        }
    }
    safeSetBlock(blocks, x, y + h - 1, z, BLOCKS.SHROOMLIGHT, false);
}

function generateCrimsonTree(blocks, x, y, z, rng) {
    const h = 5 + Math.floor(rng() * 4);
    for (let py = y; py < y + h; py++) {
        safeSetBlock(blocks, x, py, z, BLOCKS.CRIMSON_STEM, true);
    }
    for (let px = x - 2; px <= x + 2; px++) {
        for (let pz = z - 2; pz <= z + 2; pz++) {
            for (let py = y + h - 2; py <= y + h + 1; py++) {
                if (Math.abs(px - x) === 2 && Math.abs(pz - z) === 2 && py === y + h + 1) continue;
                safeSetBlock(blocks, px, py, pz, BLOCKS.NETHER_WART_BLOCK, true);
                
                // Weeping vines from canopy
                if (py === y + h - 2 && rng() < 0.35) {
                    const vLen = 1 + Math.floor(rng() * 3);
                    for (let v = 1; v <= vLen; v++) {
                        safeSetBlock(blocks, px, py - v, pz, BLOCKS.CRIMSON_LEAVES, true);
                    }
                }
            }
        }
    }
    safeSetBlock(blocks, x, y + h - 1, z, BLOCKS.SHROOMLIGHT, false);
}

// Backwards-compatible stubs for removed dimensions
export function generateCavernsChunk() {
    return new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
}

export function generateHighlandsChunk() {
    return new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
}

// ============================================
// The Stronghold & The End Dimension Generation
// ============================================
export function getStrongholdPositions(seed = 12345) {
    const s = Math.abs(typeof seed === 'string' ? hashSeed(seed) : seed) || 12345;
    const rng = seededRandom(s + 888123);
    const baseAngle = rng() * Math.PI * 2;
    const strongholds = [];
    for (let i = 0; i < 3; i++) {
        const angle = baseAngle + (i * (2 * Math.PI / 3)) + (rng() - 0.5) * 0.3;
        const dist = 1400 + Math.floor(rng() * 800); // 1,400 to 2,200 blocks away from spawn (really rare!)
        const x = Math.round(Math.cos(angle) * dist);
        const z = Math.round(Math.sin(angle) * dist);
        strongholds.push({ x, y: 22, z });
    }
    return strongholds;
}

export function getClosestStrongholdPosition(px, pz, seed = 12345) {
    const list = getStrongholdPositions(seed);
    let best = list[0];
    let bestDist = Infinity;
    for (const sh of list) {
        const dx = sh.x - px;
        const dz = sh.z - pz;
        const d = dx * dx + dz * dz;
        if (d < bestDist) {
            bestDist = d;
            best = sh;
        }
    }
    return best;
}

export function getStrongholdPosition(seed = 12345) {
    return getStrongholdPositions(seed)[0];
}

function generateStronghold(blocks, cx, cz, sh, params) {
    const wxBase = cx * CHUNK_SIZE;
    const wzBase = cz * CHUNK_SIZE;

    const stoneBricks = (window.BLOCKS && window.BLOCKS.STONE_BRICKS) ? window.BLOCKS.STONE_BRICKS : (BLOCKS.STONE_BRICKS || 16);
    const crackedBricks = (window.BLOCKS && window.BLOCKS.CRACKED_STONE_BRICKS) ? window.BLOCKS.CRACKED_STONE_BRICKS : stoneBricks;
    const frameId = (window.BLOCKS && window.BLOCKS.PORTAL_FRAME) ? window.BLOCKS.PORTAL_FRAME : (BLOCKS.PORTAL_FRAME || 26);
    const frameEyeId = (window.BLOCKS && window.BLOCKS.END_PORTAL_FRAME_EYE) ? window.BLOCKS.END_PORTAL_FRAME_EYE : 326;
    const lavaId = (window.BLOCKS && window.BLOCKS.LAVA) ? window.BLOCKS.LAVA : (BLOCKS.LAVA || 25);
    const torchId = (window.BLOCKS && window.BLOCKS.TORCH) ? window.BLOCKS.TORCH : (BLOCKS.TORCH || 32);
    const ironBarsId = (window.BLOCKS && window.BLOCKS.IRON_BARS) ? window.BLOCKS.IRON_BARS : stoneBricks;
    const bookshelfId = (window.BLOCKS && window.BLOCKS.BOOKSHELF) ? window.BLOCKS.BOOKSHELF : stoneBricks;
    const chestId = (window.BLOCKS && window.BLOCKS.CHEST_BLOCK) ? window.BLOCKS.CHEST_BLOCK : stoneBricks;
    const spawnerId = (window.BLOCKS && window.BLOCKS.BOSS_SPAWNER) ? window.BLOCKS.BOSS_SPAWNER : stoneBricks;

    const rng = seededRandom(params.seed + cx * 1013 + cz);

    const setW = (wx, wy, wz, blockType, onlyAir = false) => {
        const lx = wx - wxBase;
        const lz = wz - wzBase;
        safeSetBlock(blocks, lx, wy, lz, blockType, onlyAir);
    };

    // 1. Portal Room: 11x11 hollow chamber centered at (sh.x, sh.y, sh.z)
    const px = sh.x, py = sh.y, pz = sh.z;
    for (let dx = -5; dx <= 5; dx++) {
        for (let dz = -5; dz <= 5; dz++) {
            const isWall = Math.abs(dx) === 5 || Math.abs(dz) === 5;
            for (let dy = -1; dy <= 5; dy++) {
                const isFloor = dy === -1;
                const isCeiling = dy === 5;
                const wx = px + dx;
                const wy = py + dy;
                const wz = pz + dz;

                if (isWall || isFloor || isCeiling) {
                    const brick = (rng() < 0.25) ? crackedBricks : stoneBricks;
                    setW(wx, wy, wz, brick);
                } else {
                    setW(wx, wy, wz, BLOCKS.AIR);
                }
            }
        }
    }

    // Portal platform in center (5x5 at py, with 3x3 lava pit)
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            const wx = px + dx;
            const wz = pz + dz;
            setW(wx, py - 1, wz, stoneBricks);

            if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) {
                setW(wx, py, wz, lavaId);
                setW(wx, py + 1, wz, BLOCKS.AIR);
            } else {
                setW(wx, py, wz, stoneBricks);
            }
        }
    }

    // Portal Frame Ring at py + 1: 12 frames forming a 5x5 ring (corners empty)
    const frameCoords = [
        // North
        { dx: -1, dz: -2 }, { dx: 0, dz: -2 }, { dx: 1, dz: -2 },
        // South
        { dx: -1, dz: 2 }, { dx: 0, dz: 2 }, { dx: 1, dz: 2 },
        // West
        { dx: -2, dz: -1 }, { dx: -2, dz: 0 }, { dx: -2, dz: 1 },
        // East
        { dx: 2, dz: -1 }, { dx: 2, dz: 0 }, { dx: 2, dz: 1 }
    ];

    for (const fc of frameCoords) {
        const wx = px + fc.dx;
        const wy = py + 1;
        const wz = pz + fc.dz;
        const frameRng = seededRandom(params.seed + wx * 19 + wz * 37)();
        // 15% chance to have eye pre-inserted, matching vanilla Minecraft
        const isEye = frameRng < 0.15;
        setW(wx, wy, wz, isEye ? frameEyeId : frameId);
    }

    // Stairs leading to platform from dz = 3
    setW(px, py, pz + 3, stoneBricks);
    setW(px - 1, py, pz + 3, stoneBricks);
    setW(px + 1, py, pz + 3, stoneBricks);

    // Silverfish Spawner under/in front of the stairs
    setW(px, py + 1, pz + 4, spawnerId);

    // Corner decorative iron bars and torches
    setW(px - 4, py + 2, pz - 4, ironBarsId);
    setW(px + 4, py + 2, pz - 4, ironBarsId);
    setW(px - 4, py + 2, pz + 4, ironBarsId);
    setW(px + 4, py + 2, pz + 4, ironBarsId);

    setW(px - 4, py + 3, pz, torchId);
    setW(px + 4, py + 3, pz, torchId);
    setW(px, py + 3, pz - 4, torchId);

    // 2. Stronghold Corridor & Library extending South from dz = 5 to 14
    for (let dz = 6; dz <= 14; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -1; dy <= 4; dy++) {
                const isWall = Math.abs(dx) === 2;
                const isFloor = dy === -1;
                const isCeiling = dy === 4;
                const wx = px + dx;
                const wy = py + dy;
                const wz = pz + dz;
                if (isWall || isFloor || isCeiling) {
                    setW(wx, wy, wz, stoneBricks);
                } else {
                    setW(wx, wy, wz, BLOCKS.AIR);
                }
            }
        }
    }

    // Doorway opening between portal room and corridor
    setW(px, py, pz + 5, BLOCKS.AIR);
    setW(px, py + 1, pz + 5, BLOCKS.AIR);
    setW(px, py + 2, pz + 5, BLOCKS.AIR);

    // Corridor Torches, Chest, and Bookshelves
    setW(px - 1, py + 2, pz + 9, torchId);
    setW(px + 1, py + 2, pz + 9, torchId);
    setW(px - 1, py, pz + 12, chestId);
    setW(px + 1, py, pz + 12, bookshelfId);
    setW(px + 1, py + 1, pz + 12, bookshelfId);
}

export function generateEndChunk(cx, cz, params) {
    const blocks = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    const rng = seededRandom(params.seed + cx * 65537 + cz);

    const endStoneId = (window.BLOCKS && window.BLOCKS.END_STONE) ? window.BLOCKS.END_STONE : ((typeof BLOCKS !== 'undefined' && BLOCKS.END_STONE) ? BLOCKS.END_STONE : 328);
    const obsidianId = (window.BLOCKS && window.BLOCKS.OBSIDIAN) ? window.BLOCKS.OBSIDIAN : (BLOCKS.OBSIDIAN || 14);
    const bedrockId = (window.BLOCKS && window.BLOCKS.BEDROCK) ? window.BLOCKS.BEDROCK : (BLOCKS.BEDROCK || 28);
    const torchId = (window.BLOCKS && window.BLOCKS.TORCH) ? window.BLOCKS.TORCH : (BLOCKS.TORCH || 32);

    const wxBase = cx * CHUNK_SIZE;
    const wzBase = cz * CHUNK_SIZE;

    // 1. Central Floating End Stone Island
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            const wx = wxBase + lx;
            const wz = wzBase + lz;
            const dist = Math.hypot(wx, wz);

            if (dist < 60) {
                const normDist = dist / 60;
                const surfaceNoise = Math.sin(wx * 0.15) * Math.cos(wz * 0.15) * 2;
                const bottomNoise = Math.cos(wx * 0.1) * Math.sin(wz * 0.1) * 3;
                const topY = Math.round(55 + surfaceNoise - Math.pow(normDist, 2.2) * 14);
                const botY = Math.round(38 + bottomNoise - (1 - Math.pow(normDist, 2)) * 16);

                for (let y = Math.max(1, botY); y <= Math.min(CHUNK_HEIGHT - 2, topY); y++) {
                    const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                    blocks[idx] = endStoneId;
                }
            }
        }
    }

    // 2. Obsidian Pillars (8 pillars arranged in circle at radius 38 blocks)
    const pillarCount = 8;
    const pillarRadius = 38;
    for (let p = 0; p < pillarCount; p++) {
        const pAngle = p * (Math.PI * 2 / pillarCount);
        const px = Math.round(Math.cos(pAngle) * pillarRadius);
        const pz = Math.round(Math.sin(pAngle) * pillarRadius);
        const pHeight = 18 + (p % 4) * 6; // pillar heights: 18, 24, 30, 36 above island
        const pTopY = 55 + pHeight;

        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (dx * dx + dz * dz > 5) continue; // rounded pillar
                const wx = px + dx;
                const wz = pz + dz;
                const lx = wx - wxBase;
                const lz = wz - wzBase;
                if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
                    for (let y = 42; y <= pTopY; y++) {
                        const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                        blocks[idx] = obsidianId;
                    }
                    if (dx === 0 && dz === 0) {
                        const idx = (pTopY * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                        blocks[idx] = bedrockId;
                    }
                }
            }
        }
    }

    // 3. Bedrock Exit Portal structure at center (0, y, 0)
    if (Math.abs(cx) <= 1 && Math.abs(cz) <= 1) {
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                const wx = dx;
                const wz = dz;
                const lx = wx - wxBase;
                const lz = wz - wzBase;
                if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
                    const r2 = dx * dx + dz * dz;
                    if (r2 <= 10) {
                        const idxFloor = (54 * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                        blocks[idxFloor] = bedrockId;

                        if (r2 >= 7) {
                            const idxRim = (55 * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                            blocks[idxRim] = bedrockId;
                        }
                    }
                    // Center pillar
                    if (dx === 0 && dz === 0) {
                        for (let y = 55; y <= 58; y++) {
                            const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                            blocks[idx] = bedrockId;
                        }
                    }
                    // 4 torch pillars around fountain
                    const isTorchPillar = (Math.abs(dx) === 2 && dz === 0) || (Math.abs(dz) === 2 && dx === 0);
                    if (isTorchPillar) {
                        const idxPillar = (55 * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                        blocks[idxPillar] = bedrockId;
                        const idxTorch = (56 * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                        blocks[idxTorch] = torchId;
                    }
                }
            }
        }
    }

    // 4. Obsidian Spawn Platform at (100, 48, 0)
    if (Math.abs(cx * CHUNK_SIZE + 8 - 100) <= 16 && Math.abs(cz * CHUNK_SIZE + 8) <= 16) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                const wx = 100 + dx;
                const wz = dz;
                const lx = wx - wxBase;
                const lz = wz - wzBase;
                if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
                    const idx = (48 * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                    blocks[idx] = obsidianId;
                    for (let cy = 49; cy <= 52; cy++) {
                        const idxAir = (cy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                        blocks[idxAir] = 0;
                    }
                }
            }
        }
    }

    return blocks;
}

