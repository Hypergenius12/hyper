// ============================================
// generation.js — Procedural Generation, Biomes, Dungeons
// ============================================
import { createNoise2D, createNoise3D, fbm2D, fbm3D, ridgeFbm2D, seededRandom, hashSeed } from './noise.js';
import { BLOCKS } from './textures.js';

import { CHUNK_SIZE, CHUNK_HEIGHT } from './engine.js';

// Planet configurations
const BIOMES = {
    FOREST: { name: 'Forest', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 1.0, hasTrees: true },
    PLAINS: { name: 'Plains', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 1.0, hasTrees: false },
    DESERT: { name: 'Desert', surface: BLOCKS.SAND, dirt: BLOCKS.SAND, freq: 0.5, hasTrees: false, hasDeadBush: true, hasCactus: true },
    BEACH: { name: 'Beach', surface: BLOCKS.SAND, dirt: BLOCKS.SAND, freq: 0.5, hasTrees: false, isBeach: true },
    BADLANDS: { name: 'Badlands', surface: BLOCKS.RED_SAND, dirt: BLOCKS.TERRACOTTA, freq: 0.5, hasTrees: false, hasDeadBush: true },
    TUNDRA: { name: 'Tundra', surface: BLOCKS.SNOW, dirt: BLOCKS.DIRT, freq: 0.8, hasTrees: true },
    ICE_SPIKES: { name: 'Ice Spikes', surface: BLOCKS.SNOW, dirt: BLOCKS.ICE, freq: 0.3, hasTrees: false, hasIceSpikes: true },
    MUSHROOM: { name: 'Mushroom', surface: BLOCKS.DIRT, dirt: BLOCKS.DIRT, freq: 0.2, hasTrees: false, hasMushrooms: true },
    CRYSTAL: { name: 'Crystal', surface: BLOCKS.ALIEN_STONE, dirt: BLOCKS.STONE, freq: 0.1, hasTrees: false, hasCrystals: true },
    ALIEN: { name: 'Alien', surface: BLOCKS.ALIEN_STONE, dirt: BLOCKS.ALIEN_STONE, freq: 1.0, hasTrees: true, alienFlora: true },
    VOLCANIC: { name: 'Volcanic', surface: BLOCKS.OBSIDIAN, dirt: BLOCKS.STONE, freq: 0.5, hasTrees: false },
    SWAMP: { name: 'Swamp', surface: BLOCKS.SWAMP_GRASS, dirt: BLOCKS.MUD, freq: 0.6, hasTrees: true, swampFlora: true },
    JUNGLE: { name: 'Jungle', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 0.7, hasTrees: true, jungleFlora: true },
    SAVANNA: { name: 'Savanna', surface: BLOCKS.SAVANNA_GRASS, dirt: BLOCKS.DIRT, freq: 0.8, hasTrees: true, savannaFlora: true },
    MOUNTAINS: { name: 'Mountains', surface: BLOCKS.SNOW, dirt: BLOCKS.STONE, freq: 0.4, hasTrees: true },
    DEEP_OCEAN: { name: 'Deep Ocean', surface: BLOCKS.SAND, dirt: BLOCKS.STONE, freq: 0.3, hasTrees: false },
    CHERRY_GROVE: { name: 'Cherry Grove', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 0.7, hasTrees: true, isCherry: true },
    AUTUMN_FOREST: { name: 'Autumn Forest', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 0.7, hasTrees: true, isAutumn: true },
    GLOW_FOREST: { name: 'Glow Forest', surface: BLOCKS.ALIEN_GRASS, dirt: BLOCKS.ALIEN_STONE, freq: 0.5, hasTrees: true, isGlow: true },
    OASIS: { name: 'Oasis', surface: BLOCKS.SAND, dirt: BLOCKS.SAND, freq: 0.2, hasTrees: true, isOasis: true },
    CORAL_REEF: { name: 'Coral Reef', surface: BLOCKS.SAND, dirt: BLOCKS.SAND, freq: 0.3, hasTrees: false, isCoralReef: true },
    DARK_FOREST: { name: 'Dark Forest', surface: BLOCKS.GRASS, dirt: BLOCKS.DIRT, freq: 0.8, hasTrees: true, isDark: true, hasMushrooms: true }
};

export function generateAetherChunk(cx, cz, params) {
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
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
                
                // Density drop-off: we want an island-like band in the middle
                const midY = CHUNK_HEIGHT / 2;
                const distFromMid = Math.abs(y - midY) / (CHUNK_HEIGHT / 4); 
                
                // Density threshold
                let density = nval - (distFromMid * 1.5) + 0.3; // +0.3 makes more solid mass
                
                if (biome === 'CLOUD_PEAKS') {
                    // Cloud peaks have higher density, pushing them higher up
                    density += 0.2 + (y * 0.002);
                } else if (biome === 'HOLYSTONE_MOUNTAINS') {
                    density += 0.4 - Math.abs(distFromMid) * 0.5; // Very thick, large islands
                } else if (biome === 'QUICKSOIL_DESERT') {
                    density -= 0.1; // Flatter islands
                }

                if (density > 0) {
                    // Solid block
                    blocks[idx] = BLOCKS.AETHER_STONE;
                    if (y > maxSolidY) maxSolidY = y;
                } else {
                    blocks[idx] = BLOCKS.AIR;
                }
            }

            // Second pass: Decorate the column
            // We iterate from top to bottom
            for (let y = CHUNK_HEIGHT - 2; y >= 1; y--) {
                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                const idxAbove = ((y + 1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

                const b = blocks[idx];
                const above = blocks[idxAbove];

                if (b === BLOCKS.AETHER_STONE && above === BLOCKS.AIR) {
                    // This is a top surface block
                    if (biome === 'CLOUD_PEAKS') {
                        blocks[idx] = BLOCKS.AETHER_CLOUD;
                        // Build cloud formations up
                        if (colRng() < 0.3) {
                            safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_CLOUD, true);
                            if (colRng() < 0.5) safeSetBlock(blocks, x, y + 2, z, BLOCKS.AETHER_CLOUD, true);
                        }
                    } else if (biome === 'QUICKSOIL_DESERT') {
                        blocks[idx] = BLOCKS.QUICKSOIL;
                        for (let dy = 1; dy <= 3; dy++) {
                            const subIdx = ((y - dy) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                            if (y - dy > 0 && blocks[subIdx] === BLOCKS.AETHER_STONE) {
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
                        // Put dirt below grass
                        for (let dy = 1; dy <= 3; dy++) {
                            const subIdx = ((y - dy) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                            if (y - dy > 0 && blocks[subIdx] === BLOCKS.AETHER_STONE) {
                                blocks[subIdx] = BLOCKS.AETHER_DIRT;
                            }
                        }

                        // Surface decorations
                        if (biome === 'GOLDEN_FOREST') {
                            if (colRng() < 0.03) {
                                generateAetherTree(blocks, x, y + 1, z, rng);
                            } else if (colRng() < 0.15) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_TALL_GRASS, true);
                            } else if (colRng() < 0.05) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_FLOWER, true);
                            }
                        } else if (biome === 'ENCHANTED_WOODLANDS') {
                            if (colRng() < 0.04) {
                                generateEnchantedAetherTree(blocks, x, y + 1, z, rng);
                            } else if (colRng() < 0.2) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_TALL_GRASS, true);
                            } else if (colRng() < 0.1) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_FLOWER, true);
                            }
                        } else if (biome === 'CLOUD_FOREST') {
                            // Cloud forest has dense cloud trees
                            if (colRng() < 0.05) {
                                // Simple cloud tree
                                for(let ty=0; ty<4; ty++) safeSetBlock(blocks, x, y+1+ty, z, BLOCKS.AETHER_WOOD, true);
                                for(let dx=-2; dx<=2; dx++) {
                                    for(let dz=-2; dz<=2; dz++) {
                                        for(let dy=3; dy<=5; dy++) {
                                            if (Math.abs(dx)===2 && Math.abs(dz)===2 && dy===5) continue;
                                            safeSetBlock(blocks, x+dx, y+1+dy, z+dz, BLOCKS.AETHER_CLOUD, false);
                                        }
                                    }
                                }
                            } else if (colRng() < 0.3) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_FLOWER, true);
                            }
                        } else if (biome === 'CRYSTAL_PLAINS') {
                            if (colRng() < 0.01) {
                                // Crystal cluster
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_CRYSTAL, true);
                                if (colRng() < 0.5) safeSetBlock(blocks, x, y + 2, z, BLOCKS.AETHER_CRYSTAL, true);
                            } else if (colRng() < 0.2) {
                                safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_TALL_GRASS, true);
                            }
                        }
                    }
                } else if (b === BLOCKS.AETHER_STONE && above !== BLOCKS.AIR) {
                    if (biome === 'HOLYSTONE_MOUNTAINS') {
                        blocks[idx] = BLOCKS.HOLYSTONE;
                    }
                    // Underground decorations (maybe embedded crystals)
                    if (colRng() < 0.005) {
                        blocks[idx] = BLOCKS.AETHER_CRYSTAL;
                    }
                }
            }
        }
    }

    return blocks;
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
    // Golden Canopy
    for (let px = x - 2; px <= x + 2; px++) {
        for (let pz = z - 2; pz <= z + 2; pz++) {
            for (let py = y + h - 2; py <= y + h + 1; py++) {
                if (Math.abs(px - x) === 2 && Math.abs(pz - z) === 2 && py === y + h + 1) continue;
                safeSetBlock(blocks, px, py, pz, BLOCKS.AETHER_LEAVES, true);
            }
        }
    }
}

export class PlanetParams {
    constructor(seed) {
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
    }
}

export function generatePlanetParams(seed) {
    return new PlanetParams(seed);
}

export function getBiomeParams(wx, wz, params) {
    const noise2D = params.noise2D;
    const tempNoise = params.tempNoise;
    const moistNoise = params.moistNoise;

    // Continentalness and Erosion
    const contNoise = (noise2D(wx * 0.00028, wz * 0.00028) + 1) / 2;
    const erosionNoise = (noise2D(wx * 0.0004 + 1000, wz * 0.0004 + 1000) + 1) / 2;

    // Domain warp the coordinates slightly to make biome borders wavy/organic
    const warpX = noise2D(wx * 0.003 + 2000, wz * 0.003 + 2000) * 60;
    const warpZ = noise2D(wz * 0.003 + 3000, wx * 0.003 + 3000) * 60;
    
    // Kept large offsets to prevent spawning exactly at (0.5, 0.5) forest every seed
    const temp = (tempNoise((wx + warpX) * 0.00028 + 5000, (wz + warpZ) * 0.00028 + 5000) + 1) / 2;
    const moist = (moistNoise((wx + warpX) * 0.00028 + 8000, (wz + warpZ) * 0.00028 + 8000) + 1) / 2;
    const weirdness = (noise2D((wx + warpX) * 0.0006 + 15000, (wz + warpZ) * 0.0006 + 15000) + 1) / 2;

    const isOcean = contNoise < 0.3;
    const isCoast = contNoise >= 0.3 && contNoise < 0.35;
    const isMountain = erosionNoise < 0.35 && contNoise >= 0.38;
    const isFlat = erosionNoise > 0.65;

    let biome = BIOMES.PLAINS;
    let terraceWeight = 0;

    if (isOcean) {
        if (temp > 0.75 && moist > 0.5) biome = BIOMES.CORAL_REEF;
        else if (temp < 0.25) biome = BIOMES.TUNDRA; // Frozen ocean equivalent
        else biome = BIOMES.DEEP_OCEAN; // Default ocean
    } else if (isCoast) {
        if (temp < 0.25) biome = BIOMES.TUNDRA;
        else if (temp > 0.4) biome = BIOMES.BEACH; // Sandy beach
        else biome = BIOMES.PLAINS; // Grassy/stony shore
    } else if (isMountain) {
        let tw = Math.max(0, Math.min(1, (temp - 0.6) / 0.1));
        let mw = Math.max(0, Math.min(1, (0.5 - moist) / 0.1));
        terraceWeight = Math.max(terraceWeight, tw * mw);
        
        if (temp > 0.75 && moist < 0.4) biome = BIOMES.BADLANDS;
        else if (temp < 0.25) biome = BIOMES.ICE_SPIKES;
        else if (temp > 0.8) biome = BIOMES.VOLCANIC;
        else biome = BIOMES.MOUNTAINS;
    } else {
        // Inland
        if (temp > 0.75) { // Hot
            if (moist < 0.4) {
                let ww = Math.max(0, Math.min(1, (weirdness - 0.7) / 0.1));
                terraceWeight = Math.max(terraceWeight, ww);
                biome = weirdness > 0.7 ? BIOMES.BADLANDS : BIOMES.DESERT;
                if (biome === BIOMES.DESERT && moist > 0.2) biome = BIOMES.OASIS;
            } else if (moist > 0.6) {
                biome = weirdness > 0.6 ? BIOMES.JUNGLE : BIOMES.SWAMP;
            } else {
                biome = BIOMES.SAVANNA;
            }
        } else if (temp < 0.2) { // Cold
            biome = (weirdness > 0.6 && moist > 0.4) ? BIOMES.AUTUMN_FOREST : BIOMES.TUNDRA;
        } else { // Temperate (0.3 to 0.75)
            if (moist < 0.35) {
                biome = weirdness > 0.7 ? BIOMES.MUSHROOM : BIOMES.PLAINS;
            } else if (moist > 0.7) {
                if (weirdness > 0.75) biome = BIOMES.ALIEN;
                else if (weirdness > 0.6) biome = BIOMES.GLOW_FOREST;
                else if (weirdness > 0.4) biome = BIOMES.DARK_FOREST;
                else biome = BIOMES.SWAMP;
            } else {
                if (weirdness > 0.75) biome = BIOMES.CHERRY_GROVE;
                else if (weirdness > 0.5) biome = BIOMES.CRYSTAL;
                else if (isFlat) biome = BIOMES.PLAINS;
                else biome = BIOMES.FOREST;
            }
        }
    }

    return { biome, terraceWeight, contNoise, erosionNoise, weirdness };
}

export function getColumnInfo(wx, wz, params) {
    const colRng = seededRandom(params.seed + wx * 3141 + wz);
    
    let { biome, terraceWeight, contNoise, erosionNoise, weirdness } = getBiomeParams(wx, wz, params);
    
    // 1. Continentalness Base
    let baseElevation = params.seaLevel;
    if (contNoise < 0.3) {
        // Ocean (deep to shallow)
        baseElevation = (params.seaLevel - 25) + (contNoise / 0.3) * 23; // e.g. -25 to -2 below sea level
    } else if (contNoise < 0.4) {
        // Coastline/Beach
        baseElevation = (params.seaLevel - 2) + ((contNoise - 0.3) / 0.1) * 6; // e.g. -2 to +4 relative to sea level
    } else {
        // Inland
        baseElevation = (params.seaLevel + 4) + ((contNoise - 0.4) / 0.6) * 30; // e.g. +4 to +34 relative to sea level
    }

    // 2. Erosion Factor
    let factor = 1.0;
    if (erosionNoise > 0.7) factor = 0.15; // Very flat
    else if (erosionNoise > 0.5) factor = 0.15 + ((0.7 - erosionNoise) / 0.2) * 0.35; // 0.15 to 0.5
    else if (erosionNoise > 0.3) factor = 0.5 + ((0.5 - erosionNoise) / 0.2) * 0.7; // 0.5 to 1.2
    else factor = 1.2 + ((0.3 - erosionNoise) / 0.3) * 2.8; // 1.2 to 4.0 (Mountains)

    // Reduce roughness in oceans
    if (contNoise < 0.3) factor *= 0.3;

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
    // Rare Lakes in non-ocean biomes (Grid-based to prevent biome spread issues)
    let lakeSurfaceY = 0;
    let inLake = false;
    let lakeDepth = 0;
    
    // Size of the lake cells
    const cellSize = 80;
    const cx = Math.floor(wx / cellSize);
    const cz = Math.floor(wz / cellSize);
    
    // Check neighboring cells for lakes that might overlap
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            const nx = cx + dx;
            const nz = cz + dz;
            // Predictable random for this cell
            const cellSeed = params.seed + nx * 13371 + nz * 918273;
            const rng = seededRandom(cellSeed);
            
            // 20% chance for a lake in this cell
            if (rng() < 0.2) {
                const lx = nx * cellSize + rng() * cellSize;
                const lz = nz * cellSize + rng() * cellSize;
                
                // Get the biome and elevation strictly at the center of the lake
                const lContNoise = (params.noise2D(lx * 0.00028, lz * 0.00028) + 1) / 2;
                if (lContNoise >= 0.3) {
                    const lBaseElev = (params.seaLevel + 4) + ((lContNoise - 0.4) / 0.6) * 30;
                    // Get biome params just for the center point
                    const temp = (params.tempNoise(lx * 0.00028 + 5000, lz * 0.00028 + 5000) + 1) / 2;
                    const moist = (params.moistNoise(lx * 0.00028 + 8000, lz * 0.00028 + 8000) + 1) / 2;
                    const weird = (params.noise2D(lx * 0.0006 + 15000, lz * 0.0006 + 15000) + 1) / 2;
                    
                    let lBiome = BIOMES.PLAINS;
                    if (temp < 0.2) lBiome = BIOMES.TUNDRA;
                    else if (temp > 0.75 && moist < 0.4) lBiome = BIOMES.DESERT;
                    else if (temp > 0.75 && moist > 0.6) lBiome = BIOMES.SWAMP;
                    else if (moist > 0.7 && weird > 0.75) lBiome = BIOMES.ALIEN;
                    else if (moist > 0.7 && weird > 0.6) lBiome = BIOMES.GLOW_FOREST;
                    else if (temp > 0.75) lBiome = BIOMES.SAVANNA;
                    
                    const isNoLakeBiome = lBiome.name === 'Alien' || lBiome.name === 'Crystal' || lBiome.name === 'Volcanic';
                    if (!isNoLakeBiome) {
                        const maxR = 12 + rng() * 10;
                        const dist = Math.hypot(wx - lx, wz - lz);
                        const distortedDist = dist + params.noise2D(wx / 10, wz / 10) * (maxR * 0.3); // organic shape
                        
                        if (distortedDist < maxR) {
                            inLake = true;
                            lakeSurfaceY = Math.floor(lBaseElev);
                            lakeDepth = (1 - (distortedDist / maxR)) * 7;
                            biome = lBiome; // Override the entire lake to the central biome!
                        }
                    }
                }
            }
        }
    }
    
    // Check for biome-specific puddles
    const isSwamp = biome.name === 'Swamp';
    const isOasis = biome.name === 'Oasis';
    let puddleNoise = 0;
    if (isSwamp || isOasis) {
        puddleNoise = fbm2D(params.noise2D, wx / 12, wz / 12, 2);
    }
    
    const hasPuddle = (isSwamp || isOasis) && puddleNoise > 0.35 && factor < 0.6; // Only on flat terrain
    
    if (inLake || hasPuddle) {
        let depth;
        if (inLake) {
            depth = lakeDepth; 
        } else {
            depth = (puddleNoise - 0.35) * 15; // shallower puddles
            let smoothOffset = hNoise * 40 * (factor * 0.2); 
            lakeSurfaceY = Math.floor(baseElevation + smoothOffset);
        }
        
        elevation = lakeSurfaceY - depth;
        
        // Flatten the bottom a bit
        if (depth > 2) elevation += 1;
    }

    let surfaceY = Math.floor(elevation);
    if (surfaceY < 1) surfaceY = 1;
    if (surfaceY >= CHUNK_HEIGHT - 1) surfaceY = CHUNK_HEIGHT - 2;

    return { biome, surfaceY, colRng, bData: { isTerraced: terraceWeight > 0.5, lakeSurfaceY } };
}

function safeSetBlock(blocks, x, y, z, type, onlyAir = false) {
    if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < CHUNK_HEIGHT && z >= 0 && z < CHUNK_SIZE) {
        const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
        if (!onlyAir || blocks[idx] === BLOCKS.AIR) {
            blocks[idx] = type;
        }
    }
}

function generateSugarcane(blocks, x, y, z, rng) {
    // Generate 1 to 3 blocks high
    const height = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.SUGARCANE, true);
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
                            type = BLOCKS.DUNGEON_DOOR;
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
// Generate the chunk terrain
export function generateChunkTerrain(cx, cz, params) {
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);

    const wxBase = cx * CHUNK_SIZE;
    const wzBase = cz * CHUNK_SIZE;

    const blockIndex = (x, y, z) => (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

    // 1. Generate base terrain for chunk exactly
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = wxBase + x;
            const wz = wzBase + z;
            
            const { biome, surfaceY, colRng, bData } = getColumnInfo(wx, wz, params);

            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                let type = BLOCKS.AIR;

                if (y === 0) {
                    type = BLOCKS.BEDROCK;
                } else if (y < surfaceY - 3) {
                    type = BLOCKS.STONE;
                    
                    if (y > 5 && y < surfaceY - 5) {
                        const c = fbm3D(params.caveNoise, wx / params.caveScale, y / (params.caveScale * 0.8), wz / params.caveScale, 3);
                        if (c > params.caveThreshold) type = BLOCKS.AIR;
                    }
                    
                    if (type === BLOCKS.STONE && colRng() < 0.02) {
                        let oreType = BLOCKS.IRON_ORE;
                        let minS = 1, maxS = 6;
                        if (y < 15 && colRng() < 0.15) { oreType = BLOCKS.DIAMOND_ORE; minS = 1; maxS = 4; }
                        else if (y < 20 && colRng() < 0.2) { oreType = BLOCKS.CRYSTAL_ORE; minS = 1; maxS = 3; }
                        else if (y < 30 && colRng() < 0.3) { oreType = BLOCKS.MANA_ORE; minS = 1; maxS = 3; }
                        else if (colRng() < 0.1) { oreType = BLOCKS.GOLD_ORE; minS = 2; maxS = 5; }
                        else if (colRng() < 0.3) { oreType = BLOCKS.COAL_ORE; minS = 3; maxS = 10; }
                        
                        generateOreVein(blocks, x, y, z, oreType, minS, maxS, colRng);
                    }
                } else if (y <= surfaceY) {
                    type = (y === surfaceY) ? biome.surface : biome.dirt;
                    
                    const isSurfaceLike = type === BLOCKS.GRASS || type === BLOCKS.SWAMP_GRASS || type === BLOCKS.SAVANNA_GRASS || type === BLOCKS.ALIEN_GRASS || type === BLOCKS.SNOW;
                    const isDirt = type === BLOCKS.DIRT || type === BLOCKS.COARSE_DIRT || type === BLOCKS.PODZOL || type === BLOCKS.MYCELIUM;
                    
                    // Replace surface under water or lake water with sand/dirt/gravel
                    if ((y < params.seaLevel || y < bData.lakeSurfaceY) && isSurfaceLike) {
                        type = (biome === BIOMES.PLAINS || biome === BIOMES.DESERT || biome === BIOMES.SWAMP || biome === BIOMES.TUNDRA || biome === BIOMES.BEACH) ? BLOCKS.SAND : BLOCKS.DIRT;
                    }
                    
                    // Create beaches near water levels
                    if (y <= params.seaLevel + 1 && y >= params.seaLevel - 2 && y >= surfaceY - 3 && (isSurfaceLike || isDirt)) {
                        type = BLOCKS.SAND;
                    }
                    if (bData.lakeSurfaceY > 0 && y <= bData.lakeSurfaceY + 1 && y >= bData.lakeSurfaceY - 1 && y >= surfaceY - 2 && (isSurfaceLike || isDirt)) {
                        type = BLOCKS.SAND; // Lake shores
                    }
                } else if (bData.lakeSurfaceY > 0 && y <= bData.lakeSurfaceY) {
                    type = biome === BIOMES.VOLCANIC ? BLOCKS.LAVA : (biome === BIOMES.SWAMP ? BLOCKS.SWAMP_WATER : BLOCKS.WATER);
                    // Freeze top layer in cold biomes
                    if (y === bData.lakeSurfaceY && (biome === BIOMES.TUNDRA || biome === BIOMES.ICE_SPIKES || biome === BIOMES.MOUNTAINS)) {
                        type = BLOCKS.ICE;
                    }
                } else if (y <= params.seaLevel) {
                    type = biome === BIOMES.VOLCANIC ? BLOCKS.LAVA : (biome === BIOMES.SWAMP ? BLOCKS.SWAMP_WATER : BLOCKS.WATER);
                    // Freeze top layer in cold biomes
                    if (y === params.seaLevel && (biome === BIOMES.TUNDRA || biome === BIOMES.ICE_SPIKES || biome === BIOMES.MOUNTAINS)) {
                        type = BLOCKS.ICE;
                    }
                }

                blocks[blockIndex(x, y, z)] = type;
            }
        }
    }

    // 2. Flora Projection: Iterate over neighborhood to draw trees that overlap this chunk
    for (let tx = -3; tx <= CHUNK_SIZE + 2; tx++) {
        for (let tz = -3; tz <= CHUNK_SIZE + 2; tz++) {
            const wx = wxBase + tx;
            const wz = wzBase + tz;
            const { biome, surfaceY, colRng, bData } = getColumnInfo(wx, wz, params);
            
            const floraRng = seededRandom(params.seed + wx * 7777 + wz);

            if (surfaceY < CHUNK_HEIGHT - 10) {
                const r = floraRng();
                const isUnderwater = surfaceY < params.seaLevel || (bData && bData.lakeSurfaceY && surfaceY < bData.lakeSurfaceY);
                
                if (isUnderwater) {
                    if (biome.isCoralReef && r < 0.3) {
                        const cRng = floraRng();
                        let coralType;
                        if (cRng < 0.2) coralType = BLOCKS.TUBE_CORAL;
                        else if (cRng < 0.4) coralType = BLOCKS.BRAIN_CORAL;
                        else if (cRng < 0.6) coralType = BLOCKS.FIRE_CORAL;
                        else if (cRng < 0.8) coralType = BLOCKS.HORN_CORAL;
                        else if (cRng < 0.9) coralType = BLOCKS.BUBBLE_CORAL;
                        else coralType = BLOCKS.SAND; // Blank space
                        if (coralType !== BLOCKS.SAND) {
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, coralType, true);
                        }
                    } else if (r < 0.2) {
                        const cRng = floraRng();
                        if (cRng < 0.1) {
                            // Kelp column
                            const kHeight = 2 + Math.floor(floraRng() * 6);
                            for(let i = 1; i <= kHeight; i++) {
                                if (surfaceY + i < params.seaLevel - 1) {
                                    safeSetBlock(blocks, tx, surfaceY + i, tz, BLOCKS.KELP, true);
                                }
                            }
                        } else {
                            if (biome === BIOMES.SWAMP || biome === BIOMES.OASIS) {
                                if (cRng < 0.5) {
                                    safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.ALGAE, true);
                                } else {
                                    // Lily pads go on top of the water surface
                                    const waterTopY = (bData && bData.lakeSurfaceY > 0) ? bData.lakeSurfaceY : params.seaLevel;
                                    safeSetBlock(blocks, tx, waterTopY + 1, tz, BLOCKS.LILY_PAD, true); // Places above water surface
                                }
                            } else {
                                safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.SEAGRASS, true);
                            }
                        }
                    }
                    continue; // Done with underwater flora
                }
                
                // Sugarcane logic
                if ((surfaceY === params.seaLevel || surfaceY === params.seaLevel + 1) && r < 0.1 && (biome === BIOMES.PLAINS || biome === BIOMES.FOREST || biome === BIOMES.SWAMP || biome === BIOMES.DESERT)) {
                    // It must be placed exactly near water. We know beaches are sand here.
                    const left = getColumnInfo(wx - 1, wz, params).surfaceY;
                    const right = getColumnInfo(wx + 1, wz, params).surfaceY;
                    const top = getColumnInfo(wx, wz - 1, params).surfaceY;
                    const bottom = getColumnInfo(wx, wz + 1, params).surfaceY;
                    if (left < surfaceY || right < surfaceY || top < surfaceY || bottom < surfaceY) {
                        generateSugarcane(blocks, tx, surfaceY + 1, tz, floraRng);
                        continue; // Skip other flora here
                    }
                }

                // Structures (checked first so they can spawn in any biome, not overridden by trees)
                if (r < 0.000001) {
                    generateWizardTower(blocks, tx, surfaceY + 1, tz, floraRng);
                    continue;
                } else if (biome === BIOMES.DESERT && r < 0.000003) {
                    generateAncientPyramid(blocks, tx, surfaceY, tz, floraRng);
                    continue;
                } else if (r < 0.000003) {
                    generatePortalStructure(blocks, tx, surfaceY + 1, tz, floraRng, 'nether');
                    continue;
                } else if (r < 0.000005) {
                    generatePortalStructure(blocks, tx, surfaceY + 1, tz, floraRng, 'cavern');
                    continue;
                } else if (r < 0.000007) {
                    generatePortalStructure(blocks, tx, surfaceY + 1, tz, floraRng, 'highlands');
                    continue;
                } else if (r < 0.000011) {
                    generateCabin(blocks, tx, surfaceY + 1, tz, floraRng);
                    continue;
                }

                // Don't spawn flora if a structure overwrote the ground (e.g., placed planks/cobblestone)
                const groundIdx = (surfaceY * CHUNK_SIZE * CHUNK_SIZE) + (tz * CHUNK_SIZE) + tx;
                const groundBlock = blocks[groundIdx];
                const isValidGround = groundBlock === BLOCKS.GRASS || groundBlock === BLOCKS.DIRT || groundBlock === BLOCKS.SAND || groundBlock === BLOCKS.SNOW || groundBlock === BLOCKS.MYCELIUM || groundBlock === BLOCKS.SWAMP_GRASS || groundBlock === BLOCKS.SAVANNA_GRASS || groundBlock === BLOCKS.ALIEN_GRASS || groundBlock === BLOCKS.ALIEN_STONE || groundBlock === BLOCKS.RED_SAND;
                if (!isValidGround) continue;

                if (biome.hasTrees && r < (biome.isDark ? 0.06 : 0.02)) {
                    generateTree(blocks, tx, surfaceY + 1, tz, biome, floraRng);
                } else if (biome.hasMushrooms && r < 0.05) {
                    generateMushroom(blocks, tx, surfaceY + 1, tz, floraRng);
                } else if (biome.hasCrystals && r < 0.03) {
                    generateCrystal(blocks, tx, surfaceY + 1, tz, floraRng);
                } else if (biome.hasIceSpikes && r < 0.02) {
                    generateIceSpike(blocks, tx, surfaceY + 1, tz, floraRng);
                } else if (biome.hasCactus && r < 0.01) {
                    generateCactus(blocks, tx, surfaceY + 1, tz, floraRng);
                } else if (biome.hasDeadBush && r < 0.04) {
                    safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.DEAD_BUSH, true);
                } else if (biome.isBeach && r < 0.08) {
                    const shellRng = floraRng();
                    const shell = shellRng < 0.33 ? BLOCKS.SEASHELL_1 : (shellRng < 0.66 ? BLOCKS.SEASHELL_2 : BLOCKS.SEASHELL_3);
                    safeSetBlock(blocks, tx, surfaceY + 1, tz, shell, true);
                } else if (biome.jungleFlora && r < 0.08) {
                    if (floraRng() < 0.5) generateTree(blocks, tx, surfaceY + 1, tz, biome, floraRng);
                    else safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.LEAVES, true); // Bush
                } else if (biome.alienFlora && r < 0.15) {
                    safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.ALIEN_TALL_GRASS, true);
                } else if (biome.name !== 'Desert' && biome.name !== 'Badlands' && biome.name !== 'Volcanic' && biome.name !== 'Ice Spikes' && biome.name !== 'Deep Ocean' && !biome.isCoralReef && !biome.isBeach) {
                    // Normal grass logic
                    let fr = floraRng();
                    if (biome === BIOMES.CHERRY_GROVE && fr < 0.4) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.PINK_PETALS, true);
                    } else if (biome === BIOMES.AUTUMN_FOREST && fr < 0.4) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.FALLEN_LEAVES, true);
                    } else if (biome === BIOMES.GLOW_FOREST && fr < 0.1) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.GLOW_SHROOM, true);
                    } else if (biome === BIOMES.OASIS && fr < 0.2) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.OASIS_FERN, true);
                    } else if (fr < 0.2) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, floraRng() > 0.3 ? BLOCKS.TALL_GRASS : BLOCKS.FERN, true);
                    } else if (fr >= 0.2 && fr < 0.25) {
                        const r3 = floraRng();
                        const flowerType = r3 < 0.25 ? BLOCKS.RED_FLOWER : (r3 < 0.5 ? BLOCKS.YELLOW_FLOWER : (r3 < 0.75 ? BLOCKS.BLUE_FLOWER : BLOCKS.WHITE_FLOWER));
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, flowerType, true);
                    }
                }
            }
        }
    }

    // Carve Global Dungeons
    carveGlobalDungeons(blocks, cx, cz, params);

    return blocks;
}

// getDungeonInfo removed — dungeon data is embedded in chunk generation

// ============================================
// Flora Generation
// ============================================

function generateTree(blocks, x, y, z, biome, rng) {
    const isAlien = biome.alienFlora;
    const isSavanna = biome.savannaFlora;
    const isSwamp = biome.swampFlora;
    const isPine = biome.name === 'Tundra' || biome.name === 'Ice Spikes' || biome.name === 'Mountains';
    const isJungle = biome.jungleFlora;
    const isCherry = biome.isCherry;
    const isDark = biome.isDark;
    
    let trunkType = BLOCKS.WOOD;
    let leafType = BLOCKS.LEAVES;
    
    if (isAlien) { trunkType = BLOCKS.ALIEN_SPORE_STEM; leafType = BLOCKS.ALIEN_SPORE_BLOCK; }
    else if (isSavanna) { trunkType = BLOCKS.ACACIA_WOOD; leafType = BLOCKS.ACACIA_LEAVES; }
    else if (isCherry) { trunkType = BLOCKS.CHERRY_LOG; leafType = BLOCKS.CHERRY_LEAVES; }
    else if (biome.isAutumn) { trunkType = BLOCKS.AUTUMN_WOOD; leafType = BLOCKS.AUTUMN_LEAVES; }
    else if (biome.isGlow) { trunkType = BLOCKS.GLOW_STEM; leafType = BLOCKS.GLOW_LEAVES; }
    else if (biome.isOasis) { trunkType = BLOCKS.PALM_WOOD; leafType = BLOCKS.PALM_LEAVES; }
    else if (isPine) { trunkType = BLOCKS.PINE_WOOD; leafType = BLOCKS.PINE_LEAVES; }
    else if (isDark) { trunkType = BLOCKS.WOOD; leafType = BLOCKS.PINE_LEAVES; }
    
    // Height generation
    let height = 4 + Math.floor(rng() * 3);
    if (isJungle) height = 7 + Math.floor(rng() * 4); // Scaled down jungle tree height
    else if (isPine) height = 10 + Math.floor(rng() * 6); // Taller pine trees (10-15 blocks)
    else if (isSavanna) height = 5 + Math.floor(rng() * 2);
    else if (isCherry) height = 5 + Math.floor(rng() * 2);
    else if (isDark) height = 6 + Math.floor(rng() * 3);

    // Trunk generation
    if (isJungle || isDark) {
        // Massive 2x2 trunk for jungle and dark forest
        for (let i = 0; i < height; i++) {
            safeSetBlock(blocks, x, y + i, z, trunkType);
            safeSetBlock(blocks, x+1, y + i, z, trunkType);
            safeSetBlock(blocks, x, y + i, z+1, trunkType);
            safeSetBlock(blocks, x+1, y + i, z+1, trunkType);
        }
    } else {
        // Normal 1x1 trunk
        for (let i = 0; i < height; i++) {
            safeSetBlock(blocks, x, y + i, z, trunkType);
        }
    }
    
    // Canopy Generation based on tree type
    if (biome.isOasis) {
        // Simple Palm Tree top
        safeSetBlock(blocks, x, y + height, z, leafType, true);
        for(let d=1; d<=2; d++) {
            safeSetBlock(blocks, x+d, y + height, z, leafType, true);
            safeSetBlock(blocks, x-d, y + height, z, leafType, true);
            safeSetBlock(blocks, x, y + height, z+d, leafType, true);
            safeSetBlock(blocks, x, y + height, z-d, leafType, true);
        }
        safeSetBlock(blocks, x+2, y + height - 1, z, leafType, true);
        safeSetBlock(blocks, x-2, y + height - 1, z, leafType, true);
        safeSetBlock(blocks, x, y + height - 1, z+2, leafType, true);
        safeSetBlock(blocks, x, y + height - 1, z-2, leafType, true);
    } 
    else if (isPine) {
        // Cone shaped pine tree, alternating layers like Minecraft spruce
        const topY = y + height + 1;
        let radius = 1;
        let layerCount = 0;
        const bottomY = y + Math.floor(height / 2);
        for (let ly = topY; ly >= bottomY; ly--) {
            if (ly === topY) {
                safeSetBlock(blocks, x, ly, z, leafType, true);
                layerCount++;
                continue;
            }
            
            for (let lx = x - radius; lx <= x + radius; lx++) {
                for (let lz = z - radius; lz <= z + radius; lz++) {
                    // Randomly skip corners
                    if (Math.abs(lx - x) === radius && Math.abs(lz - z) === radius && rng() < 0.3) continue;
                    safeSetBlock(blocks, lx, ly, lz, leafType, true);
                }
            }
            
            layerCount++;
            if (layerCount % 2 === 0) {
                radius = Math.min(radius + 1, 3);
            } else {
                radius = Math.max(1, radius - 1);
            }
        }
    }
    else if (isJungle || isDark) {
        // Thick canopy for 2x2 trunk
        for (let ly = y + height - 3; ly <= y + height + 1; ly++) {
            const radius = ly > y + height - 1 ? 2 : (isDark ? 4 : 3); // Dark forest has wider canopy
            for (let lx = x - radius; lx <= x + radius + 1; lx++) {
                for (let lz = z - radius; lz <= z + radius + 1; lz++) {
                    if (Math.abs(lx - x - 0.5) + Math.abs(lz - z - 0.5) > radius + 1) continue;
                    if (rng() < (isDark ? 0.1 : 0.2)) continue; // Dark forest is denser
                    safeSetBlock(blocks, lx, ly, lz, leafType, true);
                }
            }
        }
    }
    else if (isSavanna) {
        // Flat top acacia
        const branchDirX = rng() > 0.5 ? 1 : -1;
        const branchDirZ = rng() > 0.5 ? 1 : -1;
        const bx = x + branchDirX * 2;
        const bz = z + branchDirZ * 2;
        const by = y + height;
        // Diagonal branch
        safeSetBlock(blocks, x + branchDirX, y + height - 2, z + branchDirZ, trunkType);
        safeSetBlock(blocks, bx, y + height - 1, bz, trunkType);
        safeSetBlock(blocks, bx, by, bz, trunkType);
        
        // Small canopy on main trunk
        for (let ly = y + height - 1; ly <= y + height; ly++) {
            const radius = ly === y + height - 1 ? 2 : 1;
            for (let lx = x - radius; lx <= x + radius; lx++) {
                for (let lz = z - radius; lz <= z + radius; lz++) {
                    if (Math.abs(lx - x) === radius && Math.abs(lz - z) === radius) continue;
                    safeSetBlock(blocks, lx, ly, lz, leafType, true);
                }
            }
        }

        // Flat canopy on branch
        for (let ly = by; ly <= by + 1; ly++) {
            const radius = ly === by ? 3 : 2;
            for (let lx = bx - radius; lx <= bx + radius; lx++) {
                for (let lz = bz - radius; lz <= bz + radius; lz++) {
                    if (Math.abs(lx - bx) === radius && Math.abs(lz - bz) === radius) continue;
                    safeSetBlock(blocks, lx, ly, lz, leafType, true);
                }
            }
        }
    }
    else if (isCherry) {
        // Spherical canopy
        for (let ly = y + height - 2; ly <= y + height + 2; ly++) {
            const radius = ly === y + height ? 3 : (ly === y + height + 2 || ly === y + height - 2 ? 1 : 2); // Reduced from 4
            for (let lx = x - radius; lx <= x + radius; lx++) {
                for (let lz = z - radius; lz <= z + radius; lz++) {
                    if (Math.abs(lx - x) === radius && Math.abs(lz - z) === radius && rng() < 0.7) continue;
                    safeSetBlock(blocks, lx, ly, lz, leafType, true);
                }
            }
        }
    }
    else {
        // Default Minecraft-style Oak Tree Canopy
        for (let ly = y + height - 2; ly <= y + height - 1; ly++) {
            for (let lx = x - 2; lx <= x + 2; lx++) {
                for (let lz = z - 2; lz <= z + 2; lz++) {
                    if (Math.abs(lx - x) === 2 && Math.abs(lz - z) === 2) continue;
                    if (rng() < 0.15) continue; // jitter leaves
                    safeSetBlock(blocks, lx, ly, lz, leafType, true);
                }
            }
        }
        for (let ly = y + height; ly <= y + height + 1; ly++) {
            for (let lx = x - 1; lx <= x + 1; lx++) {
                for (let lz = z - 1; lz <= z + 1; lz++) {
                    if (ly === y + height + 1 && Math.abs(lx - x) === 1 && Math.abs(lz - z) === 1) continue;
                    if (ly === y + height + 1 && rng() < 0.3) continue; // thinner top layer
                    safeSetBlock(blocks, lx, ly, lz, leafType, true);
                }
            }
        }
    }
    
    if (isSwamp) {
        // Add vines/moss hanging from leaves
        for (let ly = y + height - 2; ly <= y + height; ly++) {
            for (let lx = x - 2; lx <= x + 2; lx++) {
                for (let lz = z - 2; lz <= z + 2; lz++) {
                    if (rng() < 0.2 && Math.abs(lx - x) + Math.abs(lz - z) > 1) {
                        for(let drop=1; drop <= 2 + Math.floor(rng()*3); drop++) {
                            safeSetBlock(blocks, lx, ly - drop, lz, BLOCKS.VINES, true); // pseudo-vine
                        }
                    }
                }
            }
        }
    }
}

function generateMushroom(blocks, x, y, z, rng) {
    const height = 3 + Math.floor((rng ? rng() : Math.random()) * 3);
    for (let i = 0; i < height; i++) safeSetBlock(blocks, x, y + i, z, BLOCKS.MUSHROOM_STEM);
    
    for (let lx = x - 1; lx <= x + 1; lx++) {
        for (let lz = z - 1; lz <= z + 1; lz++) {
            safeSetBlock(blocks, lx, y + height, lz, BLOCKS.MUSHROOM_CAP);
        }
    }
}

function generateCrystal(blocks, x, y, z, rng) {
    const height = 2 + Math.floor((rng ? rng() : Math.random()) * 4);
    for (let i = 0; i < height; i++) safeSetBlock(blocks, x, y + i, z, BLOCKS.ALIEN_CRYSTAL);
}

function generateIceSpike(blocks, x, y, z, rng) {
    const height = 5 + Math.floor((rng ? rng() : Math.random()) * 8);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.ICE);
        if (i < height - 2) {
            safeSetBlock(blocks, x+1, y + i, z, BLOCKS.ICE);
            safeSetBlock(blocks, x-1, y + i, z, BLOCKS.ICE);
            safeSetBlock(blocks, x, y + i, z+1, BLOCKS.ICE);
            safeSetBlock(blocks, x, y + i, z-1, BLOCKS.ICE);
        }
    }
}

function generateCactus(blocks, x, y, z, rng) {
    const height = 2 + Math.floor((rng ? rng() : Math.random()) * 3);
    for (let i = 0; i < height; i++) {
        safeSetBlock(blocks, x, y + i, z, BLOCKS.CACTUS);
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


function carveGlobalDungeons(blocks, cx, cz, params) {
    const searchRadius = 3; // Reduced from 6 to eliminate huge lag spikes
    for (let sx = cx - searchRadius; sx <= cx + searchRadius; sx++) {
        for (let sz = cz - searchRadius; sz <= cz + searchRadius; sz++) {
            // Determine if a dungeon starts at chunk (sx, sz)
            const seedStr = params.seed + "_" + sx + "_" + sz;
            const startRng = seededRandom(hashSeed(seedStr));
            if (startRng() < params.dungeonFrequency * 0.02) { // increased frequency for better discoverability
                const themeIndex = Math.floor(startRng() * DUNGEON_THEMES.length);
                const theme = DUNGEON_THEMES[themeIndex];
                const rooms = generateDungeonStructure(startRng, sx * CHUNK_SIZE + 8, 15, sz * CHUNK_SIZE + 8);
                
                // Carve any room that intersects the current chunk (cx, cz)
                for (const room of rooms) {
                    room.theme = theme;
                    carveRoomInChunk(blocks, cx, cz, room);
                }
            }
        }
    }
}

function generateDungeonStructure(rng, startX, startY, startZ) {
    const rooms = [];
    
    // Add a huge entrance shaft piercing the surface to make it discoverable
    rooms.push({ x: startX, y: startY, z: startZ, w: 7, h: 180, d: 7, type: 'entrance', shape: 'square' });
    
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
    
    // Extended shape list with new room types
    const shapes = ['square', 'circle', 'cross', 'L_shaped', 'pillars', 'pit', 'library'];
    
    for (let gx=0; gx<GRID_SIZE; gx++) {
        for (let gz=0; gz<GRID_SIZE; gz++) {
            const cell = grid[gx][gz];
            if (!cell.visited) continue;
            
            cell.shape = shapes[Math.floor(rng() * shapes.length)];
            if (cell.type === 'boss') cell.shape = 'square';
            
            const rx = startX + (gx - 2) * CELL_SIZE;
            const rz = startZ + (gz - 2) * CELL_SIZE;
            
            const roomW = cell.type === 'boss' ? 15 : 13;
            const roomH = cell.type === 'boss' ? 8 : 6;
            const roomD = cell.type === 'boss' ? 15 : 13;
            
            rooms.push({
                x: rx, y: startY, z: rz,
                w: roomW, h: roomH, d: roomD,
                type: cell.type,
                shape: cell.shape
            });
            
            // Build corridors and doorways between connected rooms
            for (const conn of cell.connections) {
                if (conn.x > gx) { 
                    // Right corridor (along X axis)
                    const corrX = rx + CELL_SIZE / 2;
                    const corrZ = rz;
                    rooms.push({ x: corrX, y: startY, z: corrZ, w: CELL_SIZE - 6, h: 5, d: 5, type: 'corridor', shape: 'square' });
                    
                    // Doorway at the LEFT side of corridor (where it meets this room)
                    rooms.push({ 
                        x: rx + Math.floor(roomW / 2) + 1, y: startY, z: rz,
                        w: 1, h: 5, d: 3, type: 'doorway', orient: 'x'
                    });
                    // Doorway at the RIGHT side of corridor (where it meets next room)
                    const nextRx = startX + (conn.x - 2) * CELL_SIZE;
                    const nextRoomW = grid[conn.x][conn.z].type === 'boss' ? 15 : 13;
                    rooms.push({ 
                        x: nextRx - Math.floor(nextRoomW / 2) - 1, y: startY, z: rz,
                        w: 1, h: 5, d: 3, type: 'doorway', orient: 'x'
                    });
                }
                if (conn.z > gz) { 
                    // Down corridor (along Z axis)
                    const corrX = rx;
                    const corrZ = rz + CELL_SIZE / 2;
                    rooms.push({ x: corrX, y: startY, z: corrZ, w: 5, h: 5, d: CELL_SIZE - 6, type: 'corridor', shape: 'square' });
                    
                    // Doorway at TOP of corridor (meets this room)
                    rooms.push({ 
                        x: rx, y: startY, z: rz + Math.floor(roomD / 2) + 1,
                        w: 3, h: 5, d: 1, type: 'doorway', orient: 'z'
                    });
                    // Doorway at BOTTOM of corridor (meets next room)
                    const nextRz = startZ + (conn.z - 2) * CELL_SIZE;
                    const nextRoomD = grid[conn.x][conn.z].type === 'boss' ? 15 : 13;
                    rooms.push({ 
                        x: rx, y: startY, z: nextRz - Math.floor(nextRoomD / 2) - 1,
                        w: 3, h: 5, d: 1, type: 'doorway', orient: 'z'
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
                
                // Doorway: carve a proper archway with door blocks in the opening and frame around it
                if (room.type === 'doorway') {
                    const dx = Math.abs(wx - room.x);
                    const dz = Math.abs(wz - room.z);
                    
                    if (room.orient === 'x') {
                        // Doorway faces along X — opening is 2 wide on Z, 3 tall
                        if (dz <= 1) {
                            if (wy >= minY + 1 && wy <= minY + 3) {
                                if (dz === 0) {
                                    if (wy === minY + 1 || wy === minY + 2) {
                                        safeSetBlock(blocks, lx, wy, lz, BLOCKS.DUNGEON_DOOR);
                                    } else {
                                        safeSetBlock(blocks, lx, wy, lz, BLOCKS.AIR);
                                    }
                                } else {
                                    // Frame sides
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.brick : BLOCKS.STONE_BRICKS);
                                }
                            } else if (wy === minY + 4 && dz === 0) {
                                // Archway top
                                safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.brick : BLOCKS.STONE_BRICKS);
                            } else if (wy === minY) {
                                safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.floor : BLOCKS.STONE_BRICKS);
                            }
                        }
                    } else {
                        // Doorway faces along Z — opening is 2 wide on X, 3 tall
                        if (dx <= 1) {
                            if (wy >= minY + 1 && wy <= minY + 3) {
                                if (dx === 0) {
                                    if (wy === minY + 1 || wy === minY + 2) {
                                        safeSetBlock(blocks, lx, wy, lz, BLOCKS.DUNGEON_DOOR);
                                    } else {
                                        safeSetBlock(blocks, lx, wy, lz, BLOCKS.AIR);
                                    }
                                } else {
                                    safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.brick : BLOCKS.STONE_BRICKS);
                                }
                            } else if (wy === minY + 4 && dx === 0) {
                                safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.brick : BLOCKS.STONE_BRICKS);
                            } else if (wy === minY) {
                                safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.floor : BLOCKS.STONE_BRICKS);
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
                    if (room.type === 'boss') safeSetBlock(blocks, lx, wy, lz, BLOCKS.PORTAL_FRAME);
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
    if (type === 'nether') { frame1 = BLOCKS.OBSIDIAN; frame2 = BLOCKS.PORTAL_FRAME; base = BLOCKS.NETHERRACK; }
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
    // 5x5 cabin
    for (let py = y; py < y + 4; py++) {
        for (let px = x - 2; px <= x + 2; px++) {
            for (let pz = z - 2; pz <= z + 2; pz++) {
                const isWall = px === x - 2 || px === x + 2 || pz === z - 2 || pz === z + 2;
                if (isWall) {
                    if (py === y + 1 && (px === x || pz === z) && rng() < 0.5) {
                        safeSetBlock(blocks, px, py, pz, BLOCKS.GLASS); // Window
                    } else if (py === y && px === x && pz === z - 2) {
                        safeSetBlock(blocks, px, py, pz, BLOCKS.DUNGEON_DOOR); // Door bottom
                    } else if (py === y + 1 && px === x && pz === z - 2) {
                        safeSetBlock(blocks, px, py, pz, BLOCKS.DUNGEON_DOOR); // Door top
                    } else {
                        safeSetBlock(blocks, px, py, pz, BLOCKS.WOOD); // Wall
                    }
                } else if (py === y + 3) {
                    safeSetBlock(blocks, px, py, pz, BLOCKS.PLANKS); // Roof
                } else {
                    safeSetBlock(blocks, px, py, pz, BLOCKS.AIR); // Inside
                }
            }
        }
    }
    
    // Add interior
    safeSetBlock(blocks, x - 1, y, z + 1, BLOCKS.FURNACE); // Real furnace
    safeSetBlock(blocks, x + 1, y, z + 1, BLOCKS.CHEST_BLOCK); // Chest instead of table
    safeSetBlock(blocks, x, y + 2, z + 1, BLOCKS.TORCH); // Wall torch
    // Floor
    for (let px = x - 1; px <= x + 1; px++) {
        for (let pz = z - 1; pz <= z + 1; pz++) {
            safeSetBlock(blocks, px, y - 1, pz, BLOCKS.PLANKS);
        }
    }
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
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
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
            let floorBlock = BLOCKS.NETHERRACK;
            if (temp > 0.6) {
                biome = 'CRIMSON_FOREST';
                floorBlock = BLOCKS.CRIMSON_NYLIUM;
            } else if (moist < 0.4) {
                biome = 'SOUL_SAND_VALLEY';
                floorBlock = BLOCKS.SOUL_SAND;
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
                    
                    const midY = 48; // Lower mid point
                    let distFromMid = Math.abs(cy - midY) / 48.0; 
                    if (cy > 96) distFromMid += (cy - 96) * 0.1; // Heavily weight towards solid near the top
                    const threshold = -0.1 + (distFromMid * 0.6); 

                    if (nval <= threshold || cy > 110) { // Force solid ceiling at very top
                        blocks[idx] = (biome === 'SOUL_SAND_VALLEY') ? BLOCKS.SOUL_SAND : BLOCKS.NETHERRACK;
                    } else if (cy <= seaLevel) {
                        blocks[idx] = BLOCKS.LAVA;
                    } else {
                        blocks[idx] = BLOCKS.AIR;
                    }
                }
            }

            // Second pass for this column to apply floor/ceiling decorations
            let topSolidY = -1;
            for (let y = CHUNK_HEIGHT - 2; y >= 1; y--) {
                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                const idxAbove = ((y + 1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                const idxBelow = ((y - 1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

                const b = blocks[idx];
                const above = y < CHUNK_HEIGHT - 1 ? blocks[idxAbove] : BLOCKS.BEDROCK;
                const below = y > 0 ? blocks[idxBelow] : BLOCKS.BEDROCK;

                // If this is a floor block (air above)
                if (b !== BLOCKS.AIR && b !== BLOCKS.LAVA && above === BLOCKS.AIR) {
                    topSolidY = y;
                    
                    // Apply floor biome blocks
                    if (biome === 'CRIMSON_FOREST' && b === BLOCKS.NETHERRACK) {
                        blocks[idx] = BLOCKS.CRIMSON_NYLIUM;
                        // Trees - increased frequency
                        if (colRng() < 0.04) {
                            generateCrimsonTree(blocks, x, y + 1, z, rng);
                        } else if (colRng() < 0.15) {
                            safeSetBlock(blocks, x, y + 1, z, BLOCKS.MUSHROOM_STEM, true);
                        }
                    } else if (biome === 'SOUL_SAND_VALLEY') {
                        blocks[idx] = BLOCKS.SOUL_SAND;
                        if (colRng() < 0.05) {
                            safeSetBlock(blocks, x, y + 1, z, BLOCKS.TORCH, true); 
                        }
                    }

                    if (colRng() < 0.05) blocks[idx] = BLOCKS.CRYSTAL_ORE;
                    if (colRng() < 0.02) blocks[idx] = BLOCKS.GOLD_ORE;
                }

                // If this is a ceiling block (air below)
                if (b !== BLOCKS.AIR && b !== BLOCKS.LAVA && below === BLOCKS.AIR) {
                    if (colRng() < 0.02) {
                        // Glowstone clusters
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

    // Fortress generation
    carveGlobalNetherStructures(blocks, cx, cz, params);

    // Rare ruined aether portal in the Nether
    if (rng() < 0.005) {
        const px = Math.floor(rng() * CHUNK_SIZE);
        const pz = Math.floor(rng() * CHUNK_SIZE);
        let py = 35;
        for (let y = 80; y > 20; y--) {
            const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (pz * CHUNK_SIZE) + px;
            if (blocks[idx] === BLOCKS.NETHERRACK || blocks[idx] === BLOCKS.CRIMSON_NYLIUM) {
                py = y;
                break;
            }
        }
        generatePortalStructure(blocks, px, py + 1, pz, rng, 'aether');
    }

    return blocks;
}

function generateCrimsonTree(blocks, x, y, z, rng) {
    const h = 4 + Math.floor(rng() * 4);
    for (let py = y; py < y + h; py++) {
        safeSetBlock(blocks, x, py, z, BLOCKS.CRIMSON_STEM, true);
    }
    // Leaves canopy
    for (let px = x - 2; px <= x + 2; px++) {
        for (let pz = z - 2; pz <= z + 2; pz++) {
            for (let py = y + h - 2; py <= y + h + 1; py++) {
                if (Math.abs(px - x) === 2 && Math.abs(pz - z) === 2 && py === y + h + 1) continue;
                safeSetBlock(blocks, px, py, pz, BLOCKS.CRIMSON_LEAVES, true);
                
                // Weeping vines from canopy
                if (py === y + h - 2 && rng() < 0.3) {
                    const vLen = 1 + Math.floor(rng() * 3);
                    for (let v = 1; v <= vLen; v++) {
                        safeSetBlock(blocks, px, py - v, pz, BLOCKS.CRIMSON_LEAVES, true);
                    }
                }
            }
        }
    }
}
export function generateCavernsChunk(cx, cz, params) {
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    const rng = seededRandom(params.seed + cx * 54321 + cz);

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = cx * CHUNK_SIZE + x;
            const wz = cz * CHUNK_SIZE + z;
            const colRng = seededRandom(params.seed + wx * 1234 + wz);

            // Determine Cavern biome
            const biomeNoise = params.tempNoise(wx * 0.005, wz * 0.005);
            let biome = 'GENERIC';
            if (biomeNoise > 0.4) biome = 'MAGMA_CAVES';
            else if (biomeNoise < -0.4) biome = 'CRYSTAL_CAVES';

            let nextNval = fbm3D(params.caveNoise, wx * 0.03, 0 * 0.04, wz * 0.03, 2);
            for (let y = 0; y < CHUNK_HEIGHT; y += 4) {
                const nval0 = nextNval;
                nextNval = fbm3D(params.caveNoise, wx * 0.03, (y + 4) * 0.04, wz * 0.03, 2);

                for (let dy = 0; dy < 4 && y + dy < CHUNK_HEIGHT; dy++) {
                    const cy = y + dy;
                    const idx = (cy * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

                    if (cy === 0 || cy === CHUNK_HEIGHT - 1) {
                        blocks[idx] = BLOCKS.BEDROCK;
                        continue;
                    }

                    const lerpFactor = dy / 4;
                    const nval = nval0 * (1 - lerpFactor) + nextNval * lerpFactor;
                    
                    const midY = CHUNK_HEIGHT / 2;
                    const distFromMid = Math.abs(cy - midY) / (CHUNK_HEIGHT / 2); 
                    const threshold = -0.2 + (distFromMid * 0.5); 

                    if (nval > threshold) {
                        if (biome === 'MAGMA_CAVES' && cy < 15) {
                            blocks[idx] = BLOCKS.LAVA;
                        } else {
                            blocks[idx] = BLOCKS.AIR;
                        }
                    } else {
                        if (biome === 'MAGMA_CAVES') blocks[idx] = BLOCKS.MAGMA_STONE;
                        else blocks[idx] = BLOCKS.CAVERN_STONE;
                    }
                }
            }

            // Second pass for decorations
            for (let y = CHUNK_HEIGHT - 2; y >= 1; y--) {
                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                const idxAbove = ((y + 1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                const idxBelow = ((y - 1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

                const b = blocks[idx];
                const above = y < CHUNK_HEIGHT - 1 ? blocks[idxAbove] : BLOCKS.BEDROCK;
                const below = y > 0 ? blocks[idxBelow] : BLOCKS.BEDROCK;

                // Floor decorations
                if ((b === BLOCKS.CAVERN_STONE || b === BLOCKS.MAGMA_STONE) && above === BLOCKS.AIR) {
                    if (biome === 'GENERIC') {
                        if (colRng() < 0.15) blocks[idx] = BLOCKS.CAVERN_DIRT;
                        if (colRng() < 0.02) safeSetBlock(blocks, x, y + 1, z, BLOCKS.GLOW_SHROOM, true);
                    } else if (biome === 'CRYSTAL_CAVES') {
                        if (colRng() < 0.05) safeSetBlock(blocks, x, y + 1, z, BLOCKS.CRYSTAL_ORE, true);
                        else if (colRng() < 0.05) safeSetBlock(blocks, x, y + 1, z, BLOCKS.MANA_ORE, true);
                        else if (colRng() < 0.1) safeSetBlock(blocks, x, y + 1, z, BLOCKS.AETHER_CRYSTAL, true);
                    } else if (biome === 'MAGMA_CAVES') {
                        if (colRng() < 0.05) safeSetBlock(blocks, x, y + 1, z, BLOCKS.FIRE, true);
                    }
                }

                // Ceiling decorations
                if ((b === BLOCKS.CAVERN_STONE || b === BLOCKS.MAGMA_STONE) && below === BLOCKS.AIR) {
                    if (biome === 'GENERIC') {
                        if (colRng() < 0.03) safeSetBlock(blocks, x, y - 1, z, BLOCKS.GLOW_SHROOM, true);
                    } else if (biome === 'CRYSTAL_CAVES') {
                        if (colRng() < 0.05) safeSetBlock(blocks, x, y - 1, z, BLOCKS.GLOWSTONE, true);
                    }
                }
            }
        }
    }

    return blocks;
}

function generateHighlandTree(blocks, x, y, z, treeType, rng) {
    let logBlock = BLOCKS.WOOD;
    let leavesBlock = BLOCKS.LEAVES;
    
    if (treeType === 'PINE') {
        logBlock = BLOCKS.PINE_WOOD;
        leavesBlock = BLOCKS.PINE_LEAVES;
        const height = 6 + Math.floor(rng() * 4);
        for (let i = 0; i < height; i++) safeSetBlock(blocks, x, y + i, z, logBlock, true);
        let radius = 2;
        for (let ty = Math.floor(height/2); ty <= height + 1; ty++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (Math.abs(dx) === radius && Math.abs(dz) === radius && rng() < 0.5) continue;
                    if (dx === 0 && dz === 0 && ty < height) continue;
                    safeSetBlock(blocks, x + dx, y + ty, z + dz, leavesBlock, false);
                }
            }
            if (ty % 2 === 1) radius = Math.max(1, radius - 1);
        }
    } else { // MEADOW
        if (rng() < 0.5) {
            logBlock = BLOCKS.CHERRY_LOG;
            leavesBlock = BLOCKS.CHERRY_LEAVES;
        } else {
            logBlock = BLOCKS.AUTUMN_WOOD;
            leavesBlock = BLOCKS.AUTUMN_LEAVES;
        }
        const height = 4 + Math.floor(rng() * 3);
        for (let i = 0; i < height; i++) safeSetBlock(blocks, x, y + i, z, logBlock, true);
        for (let dy = -2; dy <= 1; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
                    if (dy === 1 && (Math.abs(dx) > 1 || Math.abs(dz) > 1)) continue;
                    safeSetBlock(blocks, x + dx, y + height + dy, z + dz, leavesBlock, false);
                }
            }
        }
    }
}

function getHighlandsColumnInfo(wx, wz, params) {
    const colRng = seededRandom(params.seed + wx * 1234 + wz);

    const biomeNoiseVal = params.noise2D(wx * 0.002 + 5000, wz * 0.002 + 5000);
    let biome = 'JAGGED_PEAKS';
    if (biomeNoiseVal < -0.3) biome = 'VOLCANIC';
    else if (biomeNoiseVal < 0.2) biome = 'MEADOWS';
    else if (biomeNoiseVal < 0.6) biome = 'FROZEN_WASTES';

    let surfaceY = 20;
    let topBlock = BLOCKS.HIGHLANDS_GRASS;
    let subBlock = BLOCKS.HIGHLANDS_DIRT;
    let baseBlock = BLOCKS.HIGHLANDS_STONE;

    if (biome === 'JAGGED_PEAKS') {
        const n1 = params.noise2D(wx * 0.005, wz * 0.005);
        const n2 = params.noise2D(wx * 0.015, wz * 0.015) * 0.5;
        const n3 = params.noise2D(wx * 0.05, wz * 0.05) * 0.25;
        let heightVal = (n1 + n2 + n3 + 1) / 2;
        heightVal = Math.pow(heightVal, 2.5);
        surfaceY = 20 + Math.floor(heightVal * (CHUNK_HEIGHT - 40));
        
        topBlock = surfaceY > 90 ? BLOCKS.SNOW : BLOCKS.HIGHLANDS_GRASS;
        if (surfaceY > 70 && surfaceY <= 90) topBlock = BLOCKS.HIGHLANDS_STONE;

    } else if (biome === 'VOLCANIC') {
        const n1 = params.noise2D(wx * 0.01, wz * 0.01);
        let heightVal = (n1 + 1) / 2;
        heightVal = Math.pow(heightVal, 1.2);
        surfaceY = 30 + Math.floor(heightVal * 20);
        
        const craterNoise = params.noise2D(wx * 0.04 + 1000, wz * 0.04 + 1000);
        if (craterNoise > 0.4) {
            surfaceY -= Math.floor((craterNoise - 0.4) * 40);
        }

        topBlock = (surfaceY < 32) ? BLOCKS.OBSIDIAN : BLOCKS.STONE;
        subBlock = BLOCKS.STONE;
    } else if (biome === 'MEADOWS') {
        const n1 = params.noise2D(wx * 0.008, wz * 0.008);
        const n2 = params.noise2D(wx * 0.02, wz * 0.02) * 0.5;
        let heightVal = (n1 + n2 + 1) / 2;
        surfaceY = 30 + Math.floor(heightVal * 25);
    } else if (biome === 'FROZEN_WASTES') {
        const n1 = params.noise2D(wx * 0.01, wz * 0.01);
        const n2 = params.noise2D(wx * 0.03, wz * 0.03) * 0.3;
        let heightVal = (n1 + n2 + 1) / 2;
        surfaceY = 35 + Math.floor(heightVal * 25);
        topBlock = BLOCKS.SNOW;
        subBlock = BLOCKS.DIRT;
    }
    
    return { biome, surfaceY, topBlock, subBlock, baseBlock, colRng };
}

export function generateHighlandsChunk(cx, cz, params) {
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    const rng = seededRandom(params.seed + cx * 9999 + cz);
    const wxBase = cx * CHUNK_SIZE;
    const wzBase = cz * CHUNK_SIZE;

    // Pass 1: Terrain
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = wxBase + x;
            const wz = wzBase + z;
            const { biome, surfaceY, topBlock, subBlock, baseBlock } = getHighlandsColumnInfo(wx, wz, params);

            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                
                if (y === 0) {
                    blocks[idx] = BLOCKS.BEDROCK;
                    continue;
                }

                if (y <= surfaceY) {
                    if (y === surfaceY) {
                        blocks[idx] = topBlock;
                    } else if (y > surfaceY - 3) {
                        blocks[idx] = subBlock;
                    } else {
                        blocks[idx] = baseBlock;
                    }
                } else {
                    if (biome === 'VOLCANIC' && y < 32) {
                        blocks[idx] = BLOCKS.LAVA;
                    } else {
                        blocks[idx] = BLOCKS.AIR;
                    }
                }
            }
        }
    }

    // Pass 2: Decorations
    for (let tx = -3; tx <= CHUNK_SIZE + 2; tx++) {
        for (let tz = -3; tz <= CHUNK_SIZE + 2; tz++) {
            const wx = wxBase + tx;
            const wz = wzBase + tz;
            const { biome, surfaceY, colRng } = getHighlandsColumnInfo(wx, wz, params);

            if (surfaceY < CHUNK_HEIGHT - 10 && surfaceY >= 32) {
                if (biome === 'MEADOWS') {
                    if (colRng() < 0.005) {
                        generateHighlandTree(blocks, tx, surfaceY + 1, tz, 'MEADOW', rng);
                    } else if (colRng() < 0.2) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                    } else if (colRng() < 0.1) {
                        const flowers = [BLOCKS.RED_FLOWER, BLOCKS.BLUE_FLOWER, BLOCKS.YELLOW_FLOWER, BLOCKS.WHITE_FLOWER, BLOCKS.PURPLE_FLOWER, BLOCKS.ORANGE_FLOWER];
                        const flower = flowers[Math.floor(colRng() * flowers.length)];
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, flower, true);
                    }
                } else if (biome === 'FROZEN_WASTES') {
                    if (colRng() < 0.01) {
                        generateHighlandTree(blocks, tx, surfaceY + 1, tz, 'PINE', rng);
                    } else if (colRng() < 0.01) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.PACKED_ICE, true);
                        if (colRng() < 0.5) safeSetBlock(blocks, tx, surfaceY + 2, tz, BLOCKS.PACKED_ICE, true);
                    }
                } else if (biome === 'VOLCANIC') {
                    if (colRng() < 0.01 && surfaceY > 32) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.OBSIDIAN, true);
                        if (colRng() < 0.3) safeSetBlock(blocks, tx, surfaceY + 2, tz, BLOCKS.OBSIDIAN, true);
                    } else if (colRng() < 0.005) {
                        safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.DEAD_BUSH, true);
                    }
                } else if (biome === 'JAGGED_PEAKS') {
                    if (colRng() < 0.005) {
                        safeSetBlock(blocks, tx, surfaceY + 5 + Math.floor(colRng()*10), tz, BLOCKS.AETHER_CLOUD, true);
                    }
                }
            }
        }
    }

    return blocks;
}
