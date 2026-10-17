// ============================================
// ============================================
// main.js - Entry Point and Game Loop
// ============================================
// ============================================
import * as THREE from 'three';
import { GameEngine, InputManager, CHUNK_SIZE, CHUNK_HEIGHT, World, Chunk, growSapling } from './engine.js?v=130';
import { createTextureAtlas, getBlockProperties, getBlockName, BLOCKS, generateItemTexture, generateMobTexture, generateDetailedHandTexture, generateWandShaftTexture, createSteveBodyMaterials, createExtrudedItemMesh } from './textures.js?v=130';
import { generatePlanetParams, generateChunkTerrain, generateNetherChunk, generateAetherChunk, generateEndChunk, getBiomeParams, getStrongholdPosition, getClosestStrongholdPosition } from './generation.js?v=130';
import { Player, EntityManager, Mob, MOB_TYPES, Item } from './entities.js?v=130';
import { LightingSystem, ParticleSystem, UISystem, TorchLightSystem, CloudSystem, MeteorShowerSystem } from './systems.js?v=130';
import { ProjectileManager, SpellProjectile, Spell, Wand, SPELL_TYPES, MODIFIER_TYPES, generateRandomSpell, generateRandomModifier, generateRandomWand } from './magic.js?v=130';
import { AudioManager } from './audio.js?v=130';
import { BiomeMap } from './map.js?v=130';
import { DevMode } from './dev.js?v=130';
import { ChatSystem } from './chat.js?v=130';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Expose BLOCKS and systems globally
window.BLOCKS = BLOCKS;
window.BLOCKS_REF = BLOCKS;
window.THREE = THREE;
window.Mob = Mob;
window.MOB_TYPES = MOB_TYPES;
window.Item = Item;
window.getBlockProperties = getBlockProperties;
window.getBlockName = getBlockName;

const FOOD_HEAL_MAP = {
    'apple': 15,
    'golden_apple': 40,
    'bread': 20,
    'raw_beef': 12,
    'cooked_beef': 30,
    'raw_porkchop': 12,
    'cooked_porkchop': 30,
    'raw_chicken': 8,
    'cooked_chicken': 24,
    'raw_mutton': 10,
    'cooked_mutton': 25,
    'raw_fish': 10,
    'cooked_fish': 25,
    'cookie': 10,
    'carrot': 15,
    'baked_potato': 20,
    'melon_slice': 10,
    'sweet_berries': 10,
    'glow_shroom': 10,
    'brown_mushroom': 5,
    'red_mushroom': 5,
    'chorus_fruit': 15
};

const FOOD_PARTICLE_COLORS = {
    'chorus_fruit': [0x925f92, 0xc469c4, 0x582658, 0xdda0dd],
    'sweet_berries': [0xbf1818, 0xdf2929, 0x486414, 0x8a1010],
    'apple': [0xbf1919, 0xd42929, 0x801010, 0x486414],
    'golden_apple': [0xffd700, 0xffea00, 0xffaa00, 0xffee55],
    'bread': [0xb7803a, 0x8f591f, 0xd8a556, 0x6e3d11],
    'raw_beef': [0x9e2b2b, 0x6e1b1b, 0xba3c3c, 0xc95b5b],
    'cooked_beef': [0x522718, 0x6e3621, 0x3d1c10, 0x82442b],
    'raw_porkchop': [0xee8e8e, 0xcc6c6c, 0xf7afaf, 0xd65f5f],
    'cooked_porkchop': [0xa06745, 0xb87b55, 0x7a4a2e, 0xcf956d],
    'raw_chicken': [0xdb9688, 0xc77868, 0xebaba0, 0xaf5b4b],
    'cooked_chicken': [0xb46b33, 0x8a4b1e, 0xcb8146, 0x633110],
    'raw_mutton': [0x963737, 0x6a2121, 0xb84b4b, 0xcc6868],
    'cooked_mutton': [0x5a2d1f, 0x411f15, 0x733c2b, 0x33160e],
    'raw_fish': [0x486b7f, 0x375363, 0x6f91a3, 0x8bb1c5],
    'cooked_fish': [0xbc9d75, 0x9e7f59, 0xd2b58e, 0x785d3b],
    'raw_cod': [0x486b7f, 0x375363, 0x6f91a3, 0x8bb1c5],
    'cooked_cod': [0xbc9d75, 0x9e7f59, 0xd2b58e, 0x785d3b],
    'raw_salmon': [0xbc4848, 0x993535, 0xd46868, 0x486b7f],
    'cooked_salmon': [0xa24d35, 0xbf6349, 0x7e3521, 0xd68068],
    'cookie': [0xc48c46, 0x9b6b2c, 0x432810, 0x2d1b0b],
    'carrot': [0xe66c12, 0xff8820, 0x388219, 0xc7560a],
    'golden_carrot': [0xffd700, 0xffa500, 0xffea00, 0x489619],
    'baked_potato': [0xc99c4c, 0xad7e30, 0xdec078, 0x7f571b],
    'potato': [0xb89552, 0x9a7738, 0x7e5f29, 0xcca65f],
    'poisonous_potato': [0x5e8c31, 0x8aa844, 0x9a7738, 0x40611d],
    'melon_slice': [0xbc2626, 0x931a1a, 0x3a7e28, 0x1d4d12],
    'sweet_berries': [0xa81c20, 0xd42a30, 0x466620, 0x791216],
    'glow_shroom': [0x2ad1b0, 0x1a8f77, 0x5fffe0, 0x136353],
    'brown_mushroom': [0x886246, 0x694830, 0xa57d5c, 0x513521],
    'red_mushroom': [0xd82020, 0xffffff, 0xa21414, 0xeeeef2],
    'beetroot': [0x831a29, 0xa22336, 0x530e17, 0x3e7428],
    'pumpkin_pie': [0xc96924, 0xde873e, 0xb87b40, 0x884310],
    'honey_bottle': [0xf39c12, 0xe67e22, 0xf1c40f, 0xffeaa7]
};

// Helper: find safe spawn location
function findSafeSpawn(params, dimension = 'overworld') {
    if (dimension === 'end') {
        return { x: 100.5, y: 50.0, z: 0.5 };
    }
    if (params && params.isSuperflat && dimension === 'overworld') {
        return { x: 0.5, y: 5.05, z: 0.5 };
    }
    const searchRadiusChunks = 10;
    for (let cr = 0; cr <= searchRadiusChunks; cr++) {
        for (let cx = -cr; cx <= cr; cx++) {
            for (let cz = -cr; cz <= cr; cz++) {
                if (Math.max(Math.abs(cx), Math.abs(cz)) !== cr) continue;
                
                let centerBlocks;
                if (dimension === 'nether') centerBlocks = generateNetherChunk(cx, cz, params);
                else if (dimension === 'aether') centerBlocks = generateAetherChunk(cx, cz, params);
                else centerBlocks = generateChunkTerrain(cx, cz, params);

                const searchRadius = Math.floor(CHUNK_SIZE / 2);
                for (let r = 0; r < searchRadius; r++) {
                    for (let x = CHUNK_SIZE / 2 - r; x <= CHUNK_SIZE / 2 + r; x++) {
                        for (let z = CHUNK_SIZE / 2 - r; z <= CHUNK_SIZE / 2 + r; z++) {
                            if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;

                            const startY = (dimension === 'nether' || dimension === 'aether') ? 100 : CHUNK_HEIGHT - 3;
                            for (let y = startY; y > 0; y--) {
                                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                                const block = centerBlocks[idx];

                                if (dimension === 'overworld' && (block === BLOCKS.WATER || block === BLOCKS.SWAMP_WATER || block === BLOCKS.LAVA)) {
                                    break; // Reject columns that are ocean or lava lakes from the top
                                }

                                if (block !== BLOCKS.AIR && block !== BLOCKS.WATER && block !== BLOCKS.LAVA && block !== BLOCKS.SWAMP_WATER) {
                                    const bProps = getBlockProperties(block);
                                    if (!bProps.solid) continue; // Must be solid block to stand on
                                    
                                    // In overworld, reject spawning on tree canopies / leaves / logs so player spawns in open meadow
                                    if (dimension === 'overworld') {
                                        const isFoliage = bProps.isLeaves || (bProps.name && (bProps.name.toLowerCase().includes('leaves') || bProps.isLog));
                                        if (isFoliage) break;
                                    }

                                    const idxUp1 = ((y + 1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                                    const idxUp2 = ((y + 2) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                                    const bUp1 = centerBlocks[idxUp1];
                                    const bUp2 = centerBlocks[idxUp2];
                                    const pUp1 = getBlockProperties(bUp1);
                                    const pUp2 = getBlockProperties(bUp2);
                                    if (!pUp1.solid && !pUp2.solid && bUp1 !== BLOCKS.WATER && bUp1 !== BLOCKS.LAVA && bUp1 !== BLOCKS.SWAMP_WATER) {
                                        return { x: cx * CHUNK_SIZE + x + 0.5, y: y + 1.05, z: cz * CHUNK_SIZE + z + 0.5 };
                                    } else if (dimension === 'overworld') {
                                        break; // Overworld: if the top block isn't safe, reject column. Don't look underground.
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return { x: CHUNK_SIZE / 2 + 0.5, y: (dimension === 'nether' || dimension === 'aether') ? 60 : CHUNK_HEIGHT + 10, z: CHUNK_SIZE / 2 + 0.5 };
}

let _chestMatsPromise = null;
let _chestBaseMaterials = null;
let _chestLidMaterials = null;
let _chestLatchMaterial = null;

function initChestEntityMaterials(atlas) {
    if (_chestBaseMaterials) return;
    
    // Create initial materials using atlas texture as immediate fallback
    const tex = atlas.texture;
    const makeMat = (uvData) => {
        const faceTex = tex.clone();
        faceTex.repeat.set(uvData.uSize, uvData.vSize);
        faceTex.offset.set(uvData.u, uvData.v);
        faceTex.needsUpdate = true;
        return new THREE.MeshLambertMaterial({ map: faceTex });
    };
    const sideMat = makeMat(atlas.getUV(window.BLOCKS.CHEST_BLOCK, 'side'));
    const topMat = makeMat(atlas.getUV(window.BLOCKS.CHEST_BLOCK, 'top'));
    const botMat = makeMat(atlas.getUV(window.BLOCKS.CHEST_BLOCK, 'bottom'));
    const frontMat = makeMat(atlas.getUV(window.BLOCKS.CHEST_BLOCK, 'front'));
    
    _chestBaseMaterials = [sideMat.clone(), sideMat.clone(), topMat.clone(), botMat.clone(), frontMat.clone(), sideMat.clone()];
    _chestLidMaterials = [sideMat.clone(), sideMat.clone(), topMat.clone(), botMat.clone(), frontMat.clone(), sideMat.clone()];
    _chestLatchMaterial = new THREE.MeshLambertMaterial({ color: 0xd8d8d8 });

    // Load actual Minecraft chest entity texture
    if (!_chestMatsPromise) {
        _chestMatsPromise = new Promise((resolve) => {
            const applyChestTexture = (sourceImg) => {
                const sliceMat = (sx, sy, sw, sh) => {
                    const c = document.createElement('canvas');
                    c.width = sw; c.height = sh;
                    const ctx = c.getContext('2d');
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(sourceImg, sx, sy, sw, sh, 0, 0, sw, sh);
                    const t = new THREE.CanvasTexture(c);
                    t.magFilter = THREE.NearestFilter;
                    t.minFilter = THREE.NearestFilter;
                    t.colorSpace = THREE.SRGBColorSpace;
                    return new THREE.MeshLambertMaterial({ map: t });
                };
                
                // Lid faces (width: 14, depth: 14, height: 5)
                const lidTop = sliceMat(28, 0, 14, 14);
                const lidBot = sliceMat(14, 0, 14, 14);
                const lidFront = sliceMat(14, 14, 14, 5);
                const lidBack = sliceMat(42, 14, 14, 5);
                const lidRight = sliceMat(0, 14, 14, 5);
                const lidLeft = sliceMat(28, 14, 14, 5);
                
                // Base faces (width: 14, depth: 14, height: 10)
                const baseTop = sliceMat(28, 19, 14, 14);
                const baseBot = sliceMat(14, 19, 14, 14);
                const baseFront = sliceMat(14, 33, 14, 10);
                const baseBack = sliceMat(42, 33, 14, 10);
                const baseRight = sliceMat(0, 33, 14, 10);
                const baseLeft = sliceMat(28, 33, 14, 10);
                
                // Latch face (2 x 4)
                const latch = sliceMat(1, 1, 2, 4);

                // Update shared materials in place
                const updateMats = (mats, newMats) => {
                    for (let i = 0; i < 6; i++) {
                        mats[i].map = newMats[i].map;
                        mats[i].color.setHex(0xffffff);
                        mats[i].needsUpdate = true;
                    }
                };
                updateMats(_chestBaseMaterials, [baseRight, baseLeft, baseTop, baseBot, baseFront, baseBack]);
                updateMats(_chestLidMaterials, [lidRight, lidLeft, lidTop, lidBot, lidFront, lidBack]);
                _chestLatchMaterial.map = latch.map;
                _chestLatchMaterial.color.setHex(0xffffff);
                _chestLatchMaterial.needsUpdate = true;
            };

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                applyChestTexture(img);
                resolve();
            };
            img.onerror = () => {
                const cdnImg = new Image();
                cdnImg.crossOrigin = 'anonymous';
                cdnImg.onload = () => {
                    applyChestTexture(cdnImg);
                    resolve();
                };
                cdnImg.onerror = () => resolve();
                cdnImg.src = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/entity/chest/normal.png';
            };
            img.src = 'assets/mc/entity/chest/normal.png';
        });
    }
}

class ChestVisual {
    constructor(scene, x, y, z, atlas) {
        this.scene = scene;
        this.pos = { x, y, z };
        this.isOpen = false;
        this.lidAngle = 0;
        this.targetAngle = 0;
        
        this.group = new THREE.Group();
        this.group.position.set(x + 0.5, y, z + 0.5);

        initChestEntityMaterials(atlas);

        // Base (14/16 x 10/16 x 14/16)
        const baseGeo = new THREE.BoxGeometry(0.875, 0.625, 0.875);
        baseGeo.translate(0, 0.3125, 0); // Origin at bottom center
        const baseMesh = new THREE.Mesh(baseGeo, _chestBaseMaterials);
        this.group.add(baseMesh);

        // Lid (14/16 x 5/16 x 14/16)
        const lidGeo = new THREE.BoxGeometry(0.875, 0.25, 0.875);
        lidGeo.translate(0, 0.125, 0.4375); // Origin at hinge (back edge)
        this.lidMesh = new THREE.Mesh(lidGeo, _chestLidMaterials);
        this.lidMesh.position.set(0, 0.625, -0.4375);
        this.group.add(this.lidMesh);

        // Latch (2/16 x 4/16 x 1/16) on front of lid
        const latchGeo = new THREE.BoxGeometry(0.125, 0.25, 0.0625);
        const latchMesh = new THREE.Mesh(latchGeo, _chestLatchMaterial);
        latchMesh.position.set(0, 0.05, 0.875 + 0.03125);
        this.lidMesh.add(latchMesh);

        this.scene.add(this.group);
    }

    update(dt) {
        this.targetAngle = this.isOpen ? -Math.PI / 2.5 : 0;
        this.lidAngle += (this.targetAngle - this.lidAngle) * 10 * dt;
        this.lidMesh.rotation.x = this.lidAngle;
    }

    dispose() {
        this.scene.remove(this.group);
        for (let i = this.group.children.length - 1; i >= 0; i--) {
            const c = this.group.children[i];
            if (c.geometry) c.geometry.dispose();
        }
    }
}



class Game {
    constructor() {
        this.engine = new GameEngine();
        this.input = new InputManager();
        this.ui = new UISystem();

        this.lastTime = performance.now();
        this.clock = new THREE.Clock();

        this.isReady = false;
        this.fps = 0;
        this.frames = 0;
        this.lastFpsTime = performance.now();
        this.breakTimer = 0;
        this.primedTNT = [];
        this.thrownPearls = [];
        this.beds = new Map();
        this.isPaused = false;

        // Settings / Options defaults and saved state
        const storedRenderDist = localStorage.getItem('slopcraft_render_dist');
        this.renderDistance = storedRenderDist ? parseInt(storedRenderDist) : 8;

        const storedFov = localStorage.getItem('slopcraft_fov');
        this.fov = storedFov ? parseInt(storedFov) : 75;

        const storedSens = localStorage.getItem('slopcraft_sensitivity');
        this.sensitivityVal = storedSens ? parseInt(storedSens) : 100;
        this.mouseSensitivity = (this.sensitivityVal / 100) * 0.002;

        const storedVol = localStorage.getItem('slopcraft_volume');
        this.masterVolume = (storedVol !== null) ? parseInt(storedVol) / 100 : 1.0;

        const storedBright = localStorage.getItem('slopcraft_brightness');
        this.brightnessVal = (storedBright !== null) ? parseInt(storedBright) : 100;

        this.autoJumpEnabled = localStorage.getItem('slopcraft_autojump') !== 'false';
        this.viewBobbingEnabled = localStorage.getItem('slopcraft_viewbobbing') !== 'false';
        this.tpsHistory = [];
        
        this._boundLoop = this.loop.bind(this);

        // UI start is handled in window.onload
    }

    async start() {
        if (this.hasStarted) return;
        this.hasStarted = true;
        
        // Show hotbar when game begins
        const hotbar = document.getElementById('geometric-hotbar');
        if (hotbar) hotbar.classList.remove('hidden');

        const canvas = document.getElementById('game-canvas');
        this.engine.init(canvas);
        if (this.fov) {
            this.engine.camera.fov = this.fov;
            this.engine.camera.updateProjectionMatrix();
        }

        // Setup Post-processing
        this.renderPass = new RenderPass(this.engine.scene, this.engine.camera);
        this.bokehPass = new BokehPass(this.engine.scene, this.engine.camera, {
            focus: 5.0,
            aperture: 0.00005,
            maxblur: 0.003, // Slight blur
            width: window.innerWidth,
            height: window.innerHeight
        });
        const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            type: THREE.HalfFloatType
        });
        this.composer = new EffectComposer(this.engine.renderer, renderTarget);
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.bokehPass);
        this.bokehPass.enabled = localStorage.getItem('slopcraft_blur') === 'true'; // default false
        this.outputPass = new OutputPass();
        this.composer.addPass(this.outputPass);

        window.addEventListener('resize', () => {
            if (this.composer) {
                this.composer.setSize(window.innerWidth, window.innerHeight);
            }
        });

        // Create dynamic HUD elements
        this._createHUDElements();
        this.input.init(canvas);

        this.atlas = await createTextureAtlas(true);

        // Preload core Minecraft entity textures so mobs render with authentic skins immediately
        ['COW', 'PIG', 'SHEEP', 'CHICKEN', 'ZOMBIE', 'SKELETON', 'CREEPER', 'SPIDER', 'ENDERMAN'].forEach(m => {
            generateMobTexture(m, 'body');
            generateMobTexture(m, 'head_front');
        });


        // Seed: use typed value or generate random
        const seedInput = document.getElementById('seed-input');
        const rawSeed = seedInput && seedInput.value.trim() ? seedInput.value.trim() : (Math.random() * 1000000 | 0).toString();
        this.worldSeed = rawSeed;

        // Planet Generation
        this.currentSeed = rawSeed;
        this.currentDimension = 'overworld'; // 'overworld' or 'nether'
        this.planetParams = generatePlanetParams(rawSeed);
        window.worldGenParams = this.planetParams;
        this.world = new World(this.engine.scene, this.atlas);
        this.world.dimension = 'overworld';
        this.world.planetParams = this.planetParams;
        this.world.setCamera(this.engine.camera);
        if (this.renderDistance) {
            this.world.setRenderDistance(this.renderDistance);
        }
        this.engine.matEndPortal = this.world.matEndPortal;

        // Chest Management
        this.chestInventories = new Map();
        this.chestVisuals = new Map();
        
        // Furnace Management
        this.furnaces = new Map(); // key -> { input, fuel, output, progress, isSmelting }

        this.world.onChestGenerated = (x, y, z) => this._addChest(x, y, z, true);
        this.world.onTorchGenerated = (x, y, z) => this.torchSystem.addTorch(x, y, z);
        this.world.onChestPlaced = (x, y, z) => this._addChest(x, y, z, false);
        this.world.onFurnacePlaced = (x, y, z) => this._addFurnace(x, y, z);
        this.world.onFurnaceGenerated = (x, y, z) => this._addFurnace(x, y, z);
        
        this.doors = new Map(); // key -> { mesh, isOpen, baseRotationY }
        const isDoorBlock = (b) => b === window.BLOCKS.DUNGEON_DOOR || b === window.BLOCKS.DUNGEON_DOOR_TOP;
        this.world.onDoorGenerated = (x, y, z) => this._addDoor(x, y, z);
        this.world.onDoorPlaced = (x, y, z) => {
            // Check if there's already a door here or one below (since it's 2 blocks)
            if (!isDoorBlock(this.world.getBlock(x, y - 1, z))) {
                this._addDoor(x, y, z);
            }
        };
        this.world.onDoorRemoved = (x, y, z) => {
            const key1 = `${x},${y},${z}`;
            const key2 = `${x},${y-1},${z}`;
            
            if (this.doors.has(key1)) {
                this.engine.scene.remove(this.doors.get(key1).mesh);
                this.doors.delete(key1);
                // Also remove the top block if we broke the bottom
                if (isDoorBlock(this.world.getBlock(x, y+1, z))) {
                    this.world.setBlock(x, y+1, z, window.BLOCKS.AIR);
                }
            } else if (this.doors.has(key2)) {
                this.engine.scene.remove(this.doors.get(key2).mesh);
                this.doors.delete(key2);
                // Also remove the bottom block if we broke the top
                if (isDoorBlock(this.world.getBlock(x, y-1, z))) {
                    this.world.setBlock(x, y-1, z, window.BLOCKS.AIR);
                }
            }
        };
        
        this.world.isDoorOpen = (x, y, z) => {
            const key1 = `${x},${y},${z}`;
            const key2 = `${x},${y-1},${z}`; // check bottom block too
            let d = this.doors.get(key1);
            if (!d) d = this.doors.get(key2);
            return d ? d.isOpen : false;
        };

        // Fence gates
        this.fenceGates = new Map(); // key -> { mesh, isOpen, updateVisuals }
        this.world.onGateGenerated = (x, y, z, bt) => this._addFenceGate(x, y, z, bt);
        this.world.onGatePlaced = (x, y, z, bt) => this._addFenceGate(x, y, z, bt);
        this.world.onGateRemoved = (x, y, z) => {
            const key = `${x},${y},${z}`;
            if (this.fenceGates.has(key)) {
                this.engine.scene.remove(this.fenceGates.get(key).mesh);
                this.fenceGates.delete(key);
            }
        };
        this.world.isGateOpen = (x, y, z) => {
            const g = this.fenceGates.get(`${x},${y},${z}`);
            return g ? g.isOpen : false;
        };

        // Bed management
        this.beds = new Map();
        this.world.onBedPlaced = (x, y, z, bt) => {
            const props = getBlockProperties(bt);
            if (!props || !props.isBed || props.isBedHead) return;
            if (this.beds.has(`${x},${y},${z}`)) return;

            let hx = null, hz = null, dir = 0;
            if (this.world.getBlock(x, y, z - 1) === window.BLOCKS.BED_HEAD) { hx = x; hz = z - 1; dir = 0; }
            else if (this.world.getBlock(x + 1, y, z) === window.BLOCKS.BED_HEAD) { hx = x + 1; hz = z; dir = 1; }
            else if (this.world.getBlock(x, y, z + 1) === window.BLOCKS.BED_HEAD) { hx = x; hz = z + 1; dir = 2; }
            else if (this.world.getBlock(x - 1, y, z) === window.BLOCKS.BED_HEAD) { hx = x - 1; hz = z; dir = 3; }
            if (hx !== null && hz !== null) {
                this._addBed(x, y, z, hx, y, hz, bt, dir);
            }
        };
        this.world.onBedRemoved = (x, y, z) => this._removeBed(x, y, z);

        this.world.onChestRemoved = (x, y, z) => {
            const key = `${x},${y},${z}`;
            if (this.chestVisuals.has(key)) {
                this.chestVisuals.get(key).dispose();
                this.chestVisuals.delete(key);
            }
            if (this.chestInventories.has(key)) {
                // Drop items from chest
                const inv = this.chestInventories.get(key);
                for (let i=0; i<inv.length; i++) {
                    if (inv[i]) {
                        this.entityManager.spawnItem(inv[i].item, inv[i].count, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                    }
                }
                this.chestInventories.delete(key);
            }
        };

        this.world.onFurnaceRemoved = (x, y, z) => {
            const key = `${x},${y},${z}`;
            if (this.furnaces.has(key)) {
                const f = this.furnaces.get(key);
                const pos = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
                if (f.input) this.entityManager.spawnItem(f.input.item, f.input.count, pos);
                if (f.fuel) this.entityManager.spawnItem(f.fuel.item, f.fuel.count, pos);
                if (f.output) this.entityManager.spawnItem(f.output.item, f.output.count, pos);
                this.furnaces.delete(key);
            }
        };



        this.world.onBlockDestroyed = (x, y, z, oldType, newType) => {
            // Leaf blocks drop saplings (5% chance, matching Minecraft)
            const leafSaplingMap = {
                [BLOCKS.LEAVES]: { sapling: BLOCKS.OAK_SAPLING, name: 'Oak Sapling' },
                [BLOCKS.PINE_LEAVES]: { sapling: BLOCKS.SPRUCE_SAPLING, name: 'Spruce Sapling' },
                [BLOCKS.BIRCH_LEAVES]: { sapling: BLOCKS.BIRCH_SAPLING, name: 'Birch Sapling' },
                [BLOCKS.JUNGLE_LEAVES]: { sapling: BLOCKS.JUNGLE_SAPLING, name: 'Jungle Sapling' },
                [BLOCKS.ACACIA_LEAVES]: { sapling: BLOCKS.ACACIA_SAPLING, name: 'Acacia Sapling' },
                [BLOCKS.DARK_OAK_LEAVES]: { sapling: BLOCKS.DARK_OAK_SAPLING, name: 'Dark Oak Sapling' },
            };
            if (leafSaplingMap[oldType]) {
                if (Math.random() < 0.05) {
                    const info = leafSaplingMap[oldType];
                    const item = new Item('block', info.sapling, {}, info.name);
                    item.stackable = true;
                    item.maxStack = 64;
                    this.entityManager.spawnItem(item, 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                }
                if (oldType === BLOCKS.LEAVES && Math.random() < 0.005) {
                    const appleItem = new Item('food', 'apple', {}, 'Apple');
                    appleItem.stackable = true;
                    appleItem.maxStack = 64;
                    this.entityManager.spawnItem(appleItem, 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                }
                return;
            }

            // Tall grass / Fern / Tall Fern drop wheat seeds (50% chance, 20% chance of dropping 2)
            if (oldType === BLOCKS.TALL_GRASS || oldType === BLOCKS.FERN || oldType === BLOCKS.TALL_FERN) {
                if (Math.random() < 0.50) {
                    const count = Math.random() < 0.20 ? 2 : 1;
                    const seedItem = new Item('material', 'wheat_seeds', {}, 'Wheat Seeds');
                    seedItem.stackable = true;
                    seedItem.maxStack = 64;
                    this.entityManager.spawnItem(seedItem, count, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                }
                return;
            }

            // Crops drops (matching Minecraft exact drop quantities)
            if (oldType >= (BLOCKS.WHEAT_0 || 349) && oldType <= (BLOCKS.WHEAT_7 || 356)) {
                const isMature = (oldType === (BLOCKS.WHEAT_7 || 356));
                if (isMature) {
                    const wheatItem = new Item('material', 'wheat', {}, 'Wheat');
                    wheatItem.stackable = true;
                    wheatItem.maxStack = 64;
                    this.entityManager.spawnItem(wheatItem, 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));

                    const seedCount = 1 + Math.floor(Math.random() * 4); // 1-4 seeds in Minecraft
                    const seedItem = new Item('material', 'wheat_seeds', {}, 'Wheat Seeds');
                    seedItem.stackable = true;
                    seedItem.maxStack = 64;
                    this.entityManager.spawnItem(seedItem, seedCount, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                } else {
                    const seedItem = new Item('material', 'wheat_seeds', {}, 'Wheat Seeds');
                    seedItem.stackable = true;
                    seedItem.maxStack = 64;
                    this.entityManager.spawnItem(seedItem, 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                }
                return;
            }

            if (oldType >= (BLOCKS.CARROTS_0 || 357) && oldType <= (BLOCKS.CARROTS_3 || 360)) {
                const isMature = (oldType === (BLOCKS.CARROTS_3 || 360));
                const carrotCount = isMature ? (2 + Math.floor(Math.random() * 4)) : 1; // 2-5 carrots in Minecraft
                const carrotItem = new Item('food', 'carrot', {}, 'Carrot');
                carrotItem.stackable = true;
                carrotItem.maxStack = 64;
                this.entityManager.spawnItem(carrotItem, carrotCount, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                return;
            }

            if (oldType >= (BLOCKS.POTATOES_0 || 361) && oldType <= (BLOCKS.POTATOES_3 || 364)) {
                const isMature = (oldType === (BLOCKS.POTATOES_3 || 364));
                const potatoCount = isMature ? (2 + Math.floor(Math.random() * 4)) : 1; // 2-5 potatoes in Minecraft
                const potatoItem = new Item('food', 'potato', {}, 'Potato');
                potatoItem.stackable = true;
                potatoItem.maxStack = 64;
                this.entityManager.spawnItem(potatoItem, potatoCount, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                if (isMature && Math.random() < 0.02) {
                    const pItem = new Item('food', 'poisonous_potato', {}, 'Poisonous Potato');
                    pItem.stackable = true;
                    pItem.maxStack = 64;
                    this.entityManager.spawnItem(pItem, 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                }
                return;
            }

            if (oldType >= (BLOCKS.BEETROOTS_0 || 365) && oldType <= (BLOCKS.BEETROOTS_3 || 368)) {
                const isMature = (oldType === (BLOCKS.BEETROOTS_3 || 368));
                if (isMature) {
                    const beetItem = new Item('food', 'beetroot', {}, 'Beetroot');
                    beetItem.stackable = true;
                    beetItem.maxStack = 64;
                    this.entityManager.spawnItem(beetItem, 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));

                    const seedCount = 1 + Math.floor(Math.random() * 4); // 1-4 seeds in Minecraft
                    const seedItem = new Item('material', 'beetroot_seeds', {}, 'Beetroot Seeds');
                    seedItem.stackable = true;
                    seedItem.maxStack = 64;
                    this.entityManager.spawnItem(seedItem, seedCount, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                } else {
                    const seedItem = new Item('material', 'beetroot_seeds', {}, 'Beetroot Seeds');
                    seedItem.stackable = true;
                    seedItem.maxStack = 64;
                    this.entityManager.spawnItem(seedItem, 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                }
                return;
            }

            if (oldType === (BLOCKS.PUMPKIN_STEM || 371)) {
                const seedCount = Math.floor(Math.random() * 4);
                if (seedCount > 0) {
                    const seedItem = new Item('material', 'pumpkin_seeds', {}, 'Pumpkin Seeds');
                    seedItem.stackable = true;
                    seedItem.maxStack = 64;
                    this.entityManager.spawnItem(seedItem, seedCount, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                }
                return;
            }

            if (oldType === (BLOCKS.MELON_STEM || 372)) {
                const seedCount = Math.floor(Math.random() * 4);
                if (seedCount > 0) {
                    const seedItem = new Item('material', 'melon_seeds', {}, 'Melon Seeds');
                    seedItem.stackable = true;
                    seedItem.maxStack = 64;
                    this.entityManager.spawnItem(seedItem, seedCount, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                }
                return;
            }

            if (oldType === BLOCKS.MELON) {
                const sliceCount = 3 + Math.floor(Math.random() * 5); // 3-7
                const sliceItem = new Item('food', 'melon_slice', {}, 'Melon Slice');
                sliceItem.stackable = true;
                sliceItem.maxStack = 64;
                this.entityManager.spawnItem(sliceItem, sliceCount, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                return;
            }

            const NO_DROP_BLOCKS = new Set([
                BLOCKS.AIR,
                BLOCKS.WATER,
                BLOCKS.LAVA,
                BLOCKS.SWAMP_WATER,
                BLOCKS.FIRE,
                BLOCKS.SOUL_FIRE,
                BLOCKS.BEDROCK,
                BLOCKS.PORTAL,
                window.BLOCKS.AETHER_PORTAL,
                BLOCKS.TNT,
                BLOCKS.GLASS,
                BLOCKS.BOSS_SPAWNER,
                BLOCKS.DUNGEON_DOOR_TOP,
                BLOCKS.BED_HEAD,
                BLOCKS.TALL_FERN_TOP,
                BLOCKS.TALL_FERN,
                BLOCKS.FERN,
                BLOCKS.TALL_GRASS,
                BLOCKS.PORTAL_FRAME,
                window.BLOCKS.END_PORTAL_FRAME_EYE,
                window.BLOCKS.END_PORTAL,
                window.BLOCKS.END_GATEWAY,
            ]);
            if (NO_DROP_BLOCKS.has(oldType)) return;
            const props = getBlockProperties(oldType);
            
            // Check held tool for special attributes (e.g. Ruby auto-smelt)
            const selSlot = this.player ? this.player.inventory.slots[this.player.selectedSlot] : null;
            const isRubyPickaxe = selSlot && selSlot.item && selSlot.item.subtype === 'pickaxe_ruby';

            // Ore blocks drop material items instead of themselves
            const ORE_DROPS = {
                [BLOCKS.IRON_ORE]:          { subtype: isRubyPickaxe ? 'iron_ingot' : 'raw_iron', name: isRubyPickaxe ? 'Iron Ingot' : 'Raw Iron' },
                [BLOCKS.GOLD_ORE]:          { subtype: isRubyPickaxe ? 'gold_ingot' : 'raw_gold', name: isRubyPickaxe ? 'Gold Ingot' : 'Raw Gold' },
                [BLOCKS.NETHER_GOLD_ORE]:   { subtype: isRubyPickaxe ? 'gold_ingot' : 'gold_nugget', name: isRubyPickaxe ? 'Gold Ingot' : 'Gold Nugget' },
                [BLOCKS.CRYSTAL_ORE]:       { subtype: 'diamond', name: 'Diamond' },
                [BLOCKS.DIAMOND_ORE]:       { subtype: 'diamond', name: 'Diamond' },
                [BLOCKS.MANA_ORE]:          { subtype: 'mana_crystal', name: 'Mana Crystal' },
                [BLOCKS.COAL_ORE]:          { subtype: 'coal', name: 'Coal' },
                [BLOCKS.RUBY_ORE]:          { subtype: 'ruby', name: 'Ruby' },
                [BLOCKS.SAPPHIRE_ORE]:      { subtype: 'sapphire', name: 'Sapphire' },
                [BLOCKS.ZANITE_ORE]:        { subtype: 'zanite_gemstone', name: 'Zanite Gemstone' },
                [BLOCKS.GRAVITITE_ORE]:     { subtype: 'gravitite_ore', name: 'Gravitite Ore' },
                [BLOCKS.AMBROSIUM_ORE]:     { subtype: 'ambrosium_shard', name: 'Ambrosium Shard' },
                [BLOCKS.NETHER_QUARTZ_ORE]: { subtype: 'quartz', name: 'Nether Quartz' },
                [BLOCKS.ANCIENT_DEBRIS]:    { subtype: 'netherite_scrap', name: 'Netherite Scrap' },
            };
            const oreDrop = ORE_DROPS[oldType];
            if (oreDrop) {
                const matItem = new Item('material', oreDrop.subtype, {}, oreDrop.name);
                matItem.stackable = true;
                matItem.maxStack = 64;
                this.entityManager.spawnItem(matItem, 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
            } else {
                if (oldType === BLOCKS.LEAVES && Math.random() < 0.10) {
                    const appleItem = new Item('food', 'apple', { heal: 15 }, 'Apple', 'Sweet and crunchy.');
                    appleItem.stackable = true;
                    appleItem.maxStack = 64;
                    this.entityManager.spawnItem(appleItem, 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                }
                const dropType = (props.drops !== undefined && props.drops !== null) ? props.drops : oldType;
                if (dropType !== BLOCKS.AIR) {
                    this.entityManager.spawnItem(Item.blockItem(dropType, getBlockName(dropType)), 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
                }
            }
        };

        this.world.onChunkUnloaded = (cx, cz) => {
            const minX = cx * 16; // CHUNK_SIZE
            const maxX = minX + 16;
            const minZ = cz * 16;
            const maxZ = minZ + 16;
            
            // Cleanup chest visuals in unloaded chunk
            for (const [key, visual] of this.chestVisuals.entries()) {
                if (visual.pos.x >= minX && visual.pos.x < maxX && visual.pos.z >= minZ && visual.pos.z < maxZ) {
                    visual.dispose();
                    this.chestVisuals.delete(key);
                }
            }
        };

        // Expose BLOCKS globally for UISystem recipe matching
        window.BLOCKS = BLOCKS;
        window.BLOCKS_REF = BLOCKS;

        // Systems
        this.lighting = new LightingSystem(this.engine.scene, this.world);
        this.torchSystem = new TorchLightSystem(this.engine.scene);
        this.particles = new ParticleSystem(this.engine.scene);
        this.biomeMap = new BiomeMap(this);
        this.devMode = new DevMode(this);
        this.audio = new AudioManager();
        this.audio.camera = this.engine.camera;
        this.chat = new ChatSystem(this);
        this.chat.init();
        window.game = this;
        window.chatSystem = this.chat;

        // Entities
        this.player = new Player();
        if (this.selectedGameMode === 'Hardcore') {
            this.player.isHardcore = true;
            this.player.isCreative = false;
        } else if (this.selectedGameMode === 'Creative') {
            this.player.isCreative = true;
            this.player.isHardcore = false;
            if (this.input && this.input.keys) this.input.keys._creativeMode = true;
        } else {
            this.player.isHardcore = false;
            this.player.isCreative = false;
            if (this.input && this.input.keys) this.input.keys._creativeMode = false;
        }
        // Spawn player at safe location
        const spawnPos = findSafeSpawn(this.planetParams);
        this.player.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
        this.player.fallStartY = spawnPos.y;
        this.player.fallDistance = 0;
        this.player.velocity.set(0, 0, 0);
        this.player.spawnGraceTimer = 5.0;

        // Apply initial options state to systems and player
        if (this.lighting && this.brightnessVal !== undefined) {
            this.lighting.brightnessMultiplier = 0.75 + (this.brightnessVal / 100) * 0.5;
        }
        if (this.audio && this.masterVolume !== undefined) {
            this.audio.setMasterVolume(this.masterVolume);
        }
        if (this.player) {
            this.player.stepHeight = (this.autoJumpEnabled !== false) ? 0.55 : 0.0;
        }

        this.entityManager = new EntityManager(this.engine.scene, this.atlas);
        this.projectileManager = new ProjectileManager(this.engine.scene);
        this.cloudSystem = new CloudSystem(this.engine.scene);
        this.meteorSystem = new MeteorShowerSystem(this.engine.scene, this.particles, this.audio, this.world);
        this.burningBlocks = new Map();
        this.thrownEnderPearls = [];
        this.flyingEyesOfEnder = [];
        this.arrows = [];
        this.bowCharge = 0;
        this.dragonDefeated = false;
        this.showingCredits = false;

        this.entityManager.shootMobFireball = (fromPos, targetPos) => {
            const dir = targetPos.clone().sub(fromPos).normalize();
            const stats = {
                speed: 16,
                damage: 6,
                lifetime: 5,
                count: 1,
                pierce: 0,
                radius: 1.5,
                element: 'FIRE'
            };
            const proj = new SpellProjectile(fromPos, dir, stats, 0xff6600);
            proj.isMobProjectile = true;
            this.projectileManager.add(proj);
            if (this.audio && this.audio.playCast) this.audio.playCast();
        };

        this.entityManager.shootDragonFireball = (fromPos, targetPos) => {
            const dir = targetPos.clone().sub(fromPos).normalize();
            const stats = {
                speed: 18,
                damage: 12,
                lifetime: 6,
                count: 1,
                pierce: 0,
                radius: 2.5,
                element: 'VOID'
            };
            const proj = new SpellProjectile(fromPos, dir, stats, 0xbf00ff);
            proj.isMobProjectile = true;
            this.projectileManager.add(proj);
            if (this.audio && this.audio.playCast) this.audio.playCast();
        };

        this.entityManager.createExplosion = (pos, radius = 5) => {
            this.explode(pos.x, pos.y, pos.z, radius);
        };

        this.entityManager.shootSkeletonArrow = (fromPos, targetPos) => {
            const eyePos = fromPos.clone().add(new THREE.Vector3(0, 1.2, 0));
            const targetEye = targetPos.clone().add(new THREE.Vector3(0, 1.0, 0));
            const dir = targetEye.clone().sub(eyePos).normalize();
            const stats = {
                speed: 22,
                damage: 6,
                lifetime: 4,
                count: 1,
                pierce: 0,
                radius: 0.8,
                element: 'PHYSICAL'
            };
            const proj = new SpellProjectile(eyePos, dir, stats, 0xd4d4d4);
            proj.isMobProjectile = true;
            this.projectileManager.add(proj);
            if (this.audio && this.audio.playShoot) this.audio.playShoot();
            else if (this.audio && this.audio.playHit) this.audio.playHit(eyePos);
        };

        document.getElementById('btn-skip-credits')?.addEventListener('click', () => {
            this.closeEndCredits();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.showingCredits) {
                e.preventDefault();
                this.closeEndCredits();
                return;
            }
            if (e.code === 'F2') {
                e.preventDefault();
                this.engine.renderer.domElement.toBlob((blob) => {
                    const link = document.createElement('a');
                    link.download = `screenshot_${Date.now()}.png`;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                    // Clean up URL to avoid memory leak
                    setTimeout(() => URL.revokeObjectURL(link.href), 100);
                });
            }
        });

        // Setup Scene: Use authentic Minecraft linear fog for smooth distant horizon blending without close-range haze
        const renderDistBlocks = (this.world?.renderDistance || this.engine.renderDistance || 8) * 16;
        this.engine.scene.fog = new THREE.Fog(this.planetParams.skyColor || 0x87ceeb, renderDistBlocks * 0.65, renderDistBlocks * 0.98);

        // Block outline
        const outlineGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
        const outlineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        this.blockOutline = new THREE.LineSegments(new THREE.EdgesGeometry(outlineGeo), outlineMat);
        this.engine.scene.add(this.blockOutline);
        this.blockOutline.visible = false;

        // Minecraft Block Mining Crack Textures (destroy_stage_0 to destroy_stage_9)
        const texLoader = new THREE.TextureLoader();
        this.destroyTextures = [];
        for (let i = 0; i <= 9; i++) {
            const dt = texLoader.load(
                `assets/mc/block/destroy_stage_${i}.png`,
                undefined,
                undefined,
                () => {
                    texLoader.load(`https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/destroy_stage_${i}.png`, (cdnTex) => {
                        cdnTex.magFilter = THREE.NearestFilter;
                        cdnTex.minFilter = THREE.NearestFilter;
                        this.destroyTextures[i] = cdnTex;
                    });
                }
            );
            dt.magFilter = THREE.NearestFilter;
            dt.minFilter = THREE.NearestFilter;
            dt.generateMipmaps = false;
            this.destroyTextures.push(dt);
        }

        const overlayGeo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
        const overlayMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: this.destroyTextures[0],
            transparent: true,
            opacity: 0.95,
            alphaTest: 0.05,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        this.miningOverlay = new THREE.Mesh(overlayGeo, overlayMat);
        this.engine.scene.add(this.miningOverlay);
        this.miningOverlay.visible = false;
        this.lastMiningPos = null;

        // View Model (Detailed Hands/Wand)
        this.viewModel = new THREE.Group();
        const rightArmMats = createSteveBodyMaterials('rightArm');
        this.handMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.6, 0.2),
            rightArmMats
        );
        this.handMesh.position.set(0.48, -0.46, -0.62);
        this.handMesh.rotation.x = -Math.PI / 4.5;
        this.handMesh.rotation.z = -Math.PI / 6.5;
        this.viewModel.add(this.handMesh);
        this.engine.camera.add(this.viewModel);
        this.engine.scene.add(this.engine.camera); // Needed for child objects to render
        this.heldItemMesh = null;

        // Player 3D Character Model (for 3rd person view)
        this.playerMesh = this.player.createPlayerMesh();
        this.engine.scene.add(this.playerMesh);
        this.playerMesh.visible = false; // Hidden in 1st person

        // Perspective Camera Mode: 0 = First Person, 1 = Third Person Back, 2 = Third Person Front
        this.cameraMode = 0;

        // Minimap Camera
        const d = 40; // minimap view half-size in blocks
        // Render true top-down view (far plane large enough to see ground)
        this.minimapCamera = new THREE.OrthographicCamera(-d, d, d, -d, 1, 300);
        this.minimapCamera.position.set(0, 250, 0);
        this.minimapCamera.lookAt(0, 0, 0);

        this.input.requestPointerLock();
        this.isReady = true;

        // Pause Menu Handlers
        document.getElementById('btn-resume').onclick = () => {
            document.getElementById('pause-screen').classList.add('hidden');
            this.input.requestPointerLock();
        };

        document.getElementById('btn-quit').onclick = () => {
            location.reload(); // Simple quit
        };

        // Copy Seed button
        const copyBtn = document.getElementById('btn-copy-seed');
        const seedDisplay = document.getElementById('current-seed-display');
        if (seedDisplay) seedDisplay.textContent = this.worldSeed;
        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(this.worldSeed).catch(() => {});
                copyBtn.textContent = 'Copied!';
                setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
            };
        }

        if (this.syncOptionsUI) this.syncOptionsUI();

        // Pointer lock listener for pausing
        document.addEventListener('pointerlockchange', () => {
            const ps = document.getElementById('pause-screen');
            const devModeOpen = this.devMode && this.devMode.isOpen;
            const mapOpen = this.biomeMap && this.biomeMap.isOpen;
            const chatOpen = this.chat && this.chat.isOpen;
            if (!this.input.isLocked && !this.ui.isOpen && !devModeOpen && !mapOpen && !chatOpen && document.getElementById('start-screen').classList.contains('hidden')) {
                // We lost pointer lock but the inventory/map/dev/chat is not open, show pause
                if (ps) ps.classList.remove('hidden');
                this.isPaused = true;
            } else {
                if (ps) ps.classList.add('hidden');
                if (this.input.isLocked) {
                    this.isPaused = false;
                }
            }
        });

        document.addEventListener('pointerlockerror', () => {
            const ps = document.getElementById('pause-screen');
            const chatOpen = this.chat && this.chat.isOpen;
            if (ps && !chatOpen && document.getElementById('start-screen').classList.contains('hidden')) {
                ps.classList.remove('hidden');
                this.isPaused = true;
            }
        });

        this._boundLoop = this.loop.bind(this);
        this.loop();
    }

    _addChest(x, y, z, isGenerated = false) {
        const key = `${x},${y},${z}`;
        if (!this.chestInventories.has(key)) {
            // Default empty 27-slot inventory
            const inv = new Array(27).fill(null);
            this.chestInventories.set(key, inv);

            if (isGenerated) {
                // Randomly generate loot
                const rng = () => Math.random();
                let lootTable = [];
                const guaranteedItems = [];
                
                // Check for portal markers underneath the chest
                let portalType = null;
                if (this.world) {
                    const below = this.world.getBlock(x, y - 1, z);
                    if (below === window.BLOCKS.PORTAL) { portalType = 'nether'; this.world.setBlock(x, y - 1, z, window.BLOCKS.NETHERRACK); }
                    else if (below === window.BLOCKS.AETHER_PORTAL) { portalType = 'aether'; this.world.setBlock(x, y - 1, z, window.BLOCKS.AETHER_DIRT); }
                }

                // Check environment context (Igloo, Blacksmith, Library, House)
                let isIgloo = false;
                let isBlacksmith = false;
                let isLibrary = false;
                let isHouse = false;

                if (this.world) {
                    for (let dx = -3; dx <= 3; dx++) {
                        for (let dy = -2; dy <= 2; dy++) {
                            for (let dz = -3; dz <= 3; dz++) {
                                const b = this.world.getBlock(x + dx, y + dy, z + dz);
                                if (b === window.BLOCKS.BREWING_STAND || b === window.BLOCKS.CAULDRON) isIgloo = true;
                                if (b === window.BLOCKS.LAVA || b === window.BLOCKS.STONECUTTER) isBlacksmith = true;
                                if (b === window.BLOCKS.BOOKSHELF) isLibrary = true;
                            }
                        }
                    }
                }

                if (!isIgloo && y < 52 && typeof window.getClosestIglooPosition === 'function') {
                    const seed = (window.worldGenParams ? window.worldGenParams.seed : 12345);
                    const ig = window.getClosestIglooPosition(x, z, seed);
                    if (ig && Math.hypot(x - ig.x, z - ig.z) < 22) isIgloo = true;
                }

                if (y >= 40 && !isIgloo && !portalType) {
                    isHouse = true;
                }

                if (portalType === 'nether') {
                    lootTable = [
                        { item: Item.blockItem(window.BLOCKS.OBSIDIAN, 'Obsidian'), maxCount: 8, chance: 1.0 },
                        { item: Item.equipmentItem('flint_and_steel', { damage: 0 }, 'Flint and Steel'), maxCount: 1, chance: 1.0 },
                        { item: new Item('material', 'gold_ingot', {}, 'Gold Ingot'), maxCount: 5, chance: 0.6 },
                        { item: Item.equipmentItem('sword_gold', { damage: 6 }, 'Gold Sword'), maxCount: 1, chance: 0.3 }
                    ];
                } else if (portalType === 'aether') {
                    lootTable = [
                        { item: Item.blockItem(window.BLOCKS.GLOWSTONE, 'Glowstone'), maxCount: 8, chance: 1.0 },
                        { item: new Item('material', 'diamond', {}, 'Diamond'), maxCount: 3, chance: 0.5 },
                        { item: Item.equipmentItem('sword_diamond', { damage: 10 }, 'Diamond Sword'), maxCount: 1, chance: 0.3 },
                        { item: Item.equipmentItem('pickaxe_diamond', { mineSpeed: 3, damage: 5 }, 'Diamond Pickaxe'), maxCount: 1, chance: 0.3 }
                    ];
                } else if (isIgloo) {
                    // Authentic Minecraft Igloo Basement Chest: Guaranteed Golden Apple, Emeralds, and Bread!
                    guaranteedItems.push({ item: new Item('food', 'golden_apple', { heal: 40 }, 'Golden Apple', 'Powerful restorative food.'), count: 1 });
                    guaranteedItems.push({ item: new Item('material', 'emerald', {}, 'Emerald'), count: 1 + Math.floor(rng() * 3) });
                    guaranteedItems.push({ item: new Item('food', 'bread', { heal: 20 }, 'Bread'), count: 2 + Math.floor(rng() * 5) });

                    lootTable = [
                        { item: new Item('material', 'gold_ingot', {}, 'Gold Ingot'), maxCount: 4, chance: 0.8 },
                        { item: new Item('material', 'iron_ingot', {}, 'Iron Ingot'), maxCount: 5, chance: 0.8 },
                        { item: new Item('material', 'coal', {}, 'Coal'), maxCount: 6, chance: 0.7 },
                        { item: new Item('food', 'apple', { heal: 15 }, 'Apple'), maxCount: 4, chance: 0.6 },
                        { item: new Item('material', 'wheat', {}, 'Wheat'), maxCount: 6, chance: 0.7 },
                        { item: Item.equipmentItem('axe_iron', { chopSpeed: 2.5, damage: 5 }, 'Iron Axe'), maxCount: 1, chance: 0.35 }
                    ];
                } else if (isBlacksmith) {
                    // Authentic Minecraft Blacksmith Chest: Iron ingots, bread, diamonds, obsidian, armor/weapons
                    guaranteedItems.push({ item: new Item('material', 'iron_ingot', {}, 'Iron Ingot'), count: 3 + Math.floor(rng() * 5) });
                    guaranteedItems.push({ item: new Item('food', 'bread', { heal: 20 }, 'Bread'), count: 3 + Math.floor(rng() * 4) });
                    if (rng() < 0.7) {
                        guaranteedItems.push({ item: new Item('material', 'diamond', {}, 'Diamond'), count: 1 + Math.floor(rng() * 3) });
                    }

                    lootTable = [
                        { item: Item.blockItem(window.BLOCKS.OBSIDIAN, 'Obsidian'), maxCount: 6, chance: 0.75 },
                        { item: new Item('material', 'gold_ingot', {}, 'Gold Ingot'), maxCount: 4, chance: 0.6 },
                        { item: Item.equipmentItem('sword_iron', { damage: 8 }, 'Iron Sword'), maxCount: 1, chance: 0.4 },
                        { item: Item.equipmentItem('pickaxe_iron', { mineSpeed: 3.0, damage: 4 }, 'Iron Pickaxe'), maxCount: 1, chance: 0.4 },
                        { item: Item.equipmentItem('helmet_iron', { protection: 2 }, 'Iron Helmet'), maxCount: 1, chance: 0.35 },
                        { item: Item.equipmentItem('chestplate_iron', { protection: 5 }, 'Iron Chestplate'), maxCount: 1, chance: 0.3 },
                        { item: Item.equipmentItem('boots_iron', { protection: 2 }, 'Iron Boots'), maxCount: 1, chance: 0.35 },
                        { item: new Item('food', 'apple', { heal: 15 }, 'Apple'), maxCount: 5, chance: 0.7 }
                    ];
                } else if (isLibrary) {
                    // Village Library Chest: Books, emeralds, spells, bread
                    guaranteedItems.push({ item: new Item('material', 'emerald', {}, 'Emerald'), count: 2 + Math.floor(rng() * 3) });
                    guaranteedItems.push({ item: new Item('food', 'bread', { heal: 20 }, 'Bread'), count: 3 + Math.floor(rng() * 4) });

                    lootTable = [
                        { factory: () => Item.spellItem(generateRandomSpell()), maxCount: 1, chance: 0.5 },
                        { factory: () => Item.modifierItem(generateRandomModifier()), maxCount: 1, chance: 0.4 },
                        { item: Item.blockItem(window.BLOCKS.BOOKSHELF, 'Bookshelf'), maxCount: 3, chance: 0.6 },
                        { item: new Item('material', 'emerald', {}, 'Emerald'), maxCount: 4, chance: 0.8 },
                        { item: new Item('food', 'apple', { heal: 15 }, 'Apple'), maxCount: 4, chance: 0.6 }
                    ];
                } else if (isHouse) {
                    // Village House / Farmhouse / Cabin Chest: Bread, apples, emeralds, wheat, torches, tools
                    guaranteedItems.push({ item: new Item('food', 'bread', { heal: 20 }, 'Bread'), count: 2 + Math.floor(rng() * 6) });
                    guaranteedItems.push({ item: new Item('food', 'apple', { heal: 15 }, 'Apple'), count: 1 + Math.floor(rng() * 4) });
                    if (rng() < 0.75) {
                        guaranteedItems.push({ item: new Item('material', 'emerald', {}, 'Emerald'), count: 1 + Math.floor(rng() * 3) });
                    }

                    lootTable = [
                        { item: Item.blockItem(window.BLOCKS.TORCH, 'Torch'), maxCount: 8, chance: 0.8 },
                        { item: new Item('material', 'wheat', {}, 'Wheat'), maxCount: 8, chance: 0.8 },
                        { item: new Item('material', 'iron_ingot', {}, 'Iron Ingot'), maxCount: 3, chance: 0.6 },
                        { item: new Item('material', 'coal', {}, 'Coal'), maxCount: 8, chance: 0.7 },
                        { item: Item.blockItem(window.BLOCKS.PLANKS, 'Oak Planks'), maxCount: 16, chance: 0.7 },
                        { item: Item.equipmentItem('sword_stone', { damage: 5 }, 'Stone Sword'), maxCount: 1, chance: 0.35 },
                        { item: Item.equipmentItem('pickaxe_stone', { mineSpeed: 2.0, damage: 3 }, 'Stone Pickaxe'), maxCount: 1, chance: 0.35 },
                        { factory: () => Item.spellItem(generateRandomSpell()), maxCount: 1, chance: 0.25 }
                    ];
                } else if (y < 40) {
                    // Dungeon loot - spells, modifiers, and rare gear
                    lootTable = [
                        { factory: () => Item.spellItem(generateRandomSpell()), maxCount: 1, chance: 0.7 },
                        { factory: () => Item.modifierItem(generateRandomModifier()), maxCount: 1, chance: 0.5 },
                        { factory: () => Item.wandItem(generateRandomWand()), maxCount: 1, chance: 0.2 },
                        { item: new Item('material', 'iron_ingot', {}, 'Iron Ingot'), maxCount: 8, chance: 0.6 },
                        { item: new Item('material', 'gold_ingot', {}, 'Gold Ingot'), maxCount: 4, chance: 0.4 },
                        { item: new Item('material', 'diamond', {}, 'Diamond'), maxCount: 2, chance: 0.2 },
                        { item: new Item('material', 'mana_crystal', {}, 'Mana Crystal'), maxCount: 6, chance: 0.5 },
                        { item: Item.equipmentItem('sword_iron', { damage: 8 }, 'Iron Sword'), maxCount: 1, chance: 0.2 },
                        { item: new Item('material', 'ender_pearl', {}, 'Ender Pearl', true, 16), maxCount: 2, chance: 0.15 },
                    ];
                } else {
                    lootTable = [
                        { item: Item.blockItem(window.BLOCKS.WOOD, 'Wood Log'), maxCount: 16, chance: 0.7 },
                        { item: Item.blockItem(window.BLOCKS.COBBLESTONE, 'Cobblestone'), maxCount: 32, chance: 0.8 },
                        { item: new Item('material', 'coal', {}, 'Coal'), maxCount: 12, chance: 0.5 },
                        { item: Item.equipmentItem('pickaxe_stone', { mineSpeed: 1.5, damage: 3 }, 'Stone Pickaxe'), maxCount: 1, chance: 0.3 },
                        { factory: () => Item.spellItem(generateRandomSpell()), maxCount: 1, chance: 0.2 },
                        { factory: () => Item.modifierItem(generateRandomModifier()), maxCount: 1, chance: 0.2 }
                    ];
                }

                // Place guaranteed items first in distinct slots
                for (let g = 0; g < guaranteedItems.length; g++) {
                    const gEntry = guaranteedItems[g];
                    const gSlot = g < 27 ? g * 2 + Math.floor(rng() * 2) : Math.floor(rng() * 27);
                    const slotIdx = Math.min(26, Math.max(0, gSlot));
                    const clone = Object.assign(Object.create(Object.getPrototypeOf(gEntry.item)), gEntry.item);
                    clone.stackable = gEntry.item.stackable || gEntry.count > 1;
                    inv[slotIdx] = { item: clone, count: gEntry.count };
                }

                // Populate additional slots from loot table
                const numSlots = 3 + Math.floor(rng() * 5);
                for (let i = 0; i < numSlots; i++) {
                    const slotIdx = Math.floor(rng() * 27);
                    if (!inv[slotIdx] && lootTable.length > 0) {
                        const entry = lootTable[Math.floor(rng() * lootTable.length)];
                        if (rng() < entry.chance) {
                            const count = 1 + Math.floor(rng() * entry.maxCount);
                            let itemClone;
                            if (entry.factory) {
                                itemClone = entry.factory();
                            } else {
                                itemClone = Object.assign(Object.create(Object.getPrototypeOf(entry.item)), entry.item);
                            }
                            itemClone.stackable = entry.maxCount > 1;
                            inv[slotIdx] = { item: itemClone, count: count };
                        }
                    }
                }
            }
        }
        if (!this.chestVisuals.has(key)) {
            const visual = new ChestVisual(this.engine.scene, x, y, z, this.atlas);
            this.chestVisuals.set(key, visual);
        }
    }
    _addFurnace(x, y, z) {
        const key = `${x},${y},${z}`;
        if (!this.furnaces.has(key)) {
            // Initial furnace state
            this.furnaces.set(key, {
                input: null,
                fuel: null,
                output: null,
                progress: 0,
                isSmelting: false
            });
        }
    }

    _addDoor(x, y, z) {
        // Since a door is 2 blocks high, generating a mesh on the top block and bottom block would duplicate it.
        // We only generate the mesh for the bottom block. We assume y is bottom if y-1 is not a door.
        const isDoor = (b) => b === window.BLOCKS.DUNGEON_DOOR || b === window.BLOCKS.DUNGEON_DOOR_TOP;
        if (isDoor(this.world.getBlock(x, y - 1, z))) return;

        const key = `${x},${y},${z}`;
        if (this.doors.has(key)) return;

        // Create door geometry (1 block high per piece)
        const doorGeom = new THREE.BoxGeometry(1, 1, 0.125).toNonIndexed();
        
        // Create materials from texture atlas
        const uvInfoBot = this.atlas.getUV(window.BLOCKS.DUNGEON_DOOR);
        const uvInfoTop = this.atlas.getUV(window.BLOCKS.DUNGEON_DOOR_TOP);
        
        const doorGeomBot = doorGeom.clone();
        const doorGeomTop = doorGeom.clone();

        const mapFaceUVs = (geom, uvInfo) => {
            const uvs = geom.attributes.uv.array;
            for (let f = 0; f < 6; f++) {
                for (let v = 0; v < 6; v++) {
                    const idx = (f * 6 + v) * 2;
                    let baseU = uvs[idx];
                    let baseV = uvs[idx + 1];
                    if (f === 5) baseU = 1 - baseU; // Un-mirror back face
                    if (f === 0 || f === 1) {
                        baseU = (f === 0 ? 0.875 : 0.0) + baseU * 0.125;
                    } else if (f === 2 || f === 3) {
                        baseV = (f === 2 ? 0.875 : 0.0) + baseV * 0.125;
                    }
                    uvs[idx] = uvInfo.u + baseU * uvInfo.uSize;
                    uvs[idx + 1] = uvInfo.v + baseV * uvInfo.vSize;
                }
            }
            geom.attributes.uv.needsUpdate = true;
        };
        mapFaceUVs(doorGeomBot, uvInfoBot);
        mapFaceUVs(doorGeomTop, uvInfoTop);
        
        const mat = new THREE.MeshLambertMaterial({ 
            map: this.atlas.texture, 
            transparent: true, 
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });
        
        doorGeomBot.translate(0.5, 0.5, 0.0625); 
        doorGeomTop.translate(0.5, 0.5, 0.0625); 
        
        const doorGroup = new THREE.Group();
        const meshBot = new THREE.Mesh(doorGeomBot, mat);
        const meshTop = new THREE.Mesh(doorGeomTop, mat);
        meshTop.position.y = 1;
        
        doorGroup.add(meshBot);
        doorGroup.add(meshTop);
        
        // Determine orientation by checking neighbors
        const hasWallX = (this.world.getBlock(x - 1, y, z) !== window.BLOCKS.AIR || this.world.getBlock(x + 1, y, z) !== window.BLOCKS.AIR);
        const hasWallZ = (this.world.getBlock(x, y, z - 1) !== window.BLOCKS.AIR || this.world.getBlock(x, y, z + 1) !== window.BLOCKS.AIR);
        
        let baseRot = 0;
        if (hasWallZ && !hasWallX) {
            baseRot = -Math.PI / 2;
        }
        doorGroup.position.set(x, y, z);
        doorGroup.rotation.y = baseRot;
        this.doors.set(key, { mesh: doorGroup, isOpen: false, baseRotationY: baseRot, x, y, z });
        
        this.engine.scene.add(doorGroup);
    }

    _addFenceGate(x, y, z, blockType = window.BLOCKS.OAK_FENCE_GATE) {
        const key = `${x},${y},${z}`;
        if (this.fenceGates.has(key)) return;

        const gateGroup = new THREE.Group();
        const uvInfo = this.atlas.getUV(blockType, 'side');
        const mat = new THREE.MeshLambertMaterial({ 
            map: this.atlas.texture, 
            transparent: true, 
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });

        const createCustomBoxGeom = (w, h, d, uvRect) => {
            const geom = new THREE.BoxGeometry(w, h, d).toNonIndexed();
            const uvs = geom.attributes.uv.array;
            // Proportional UV scaling based on face dimensions
            const faceDims = [
                [d, h], [d, h], // +X, -X
                [w, d], [w, d], // +Y, -Y
                [w, h], [w, h]  // +Z, -Z
            ];
            for (let f = 0; f < 6; f++) {
                const [fw, fh] = faceDims[f];
                for (let v = 0; v < 6; v++) {
                    const idx = (f * 6 + v) * 2;
                    let baseU = uvs[idx] * fw;
                    let baseV = uvs[idx + 1] * fh;
                    uvs[idx] = uvRect.u + baseU * uvRect.uSize;
                    uvs[idx + 1] = uvRect.v + baseV * uvRect.vSize;
                }
            }
            geom.attributes.uv.needsUpdate = true;
            return geom;
        };

        // Fixed outer fence posts (2/16 thick, 12/16 tall)
        const postGeom = createCustomBoxGeom(2/16, 12/16, 2/16, uvInfo);
        const leftPost = new THREE.Mesh(postGeom, mat);
        leftPost.position.set(-7/16, 6/16, 0);
        gateGroup.add(leftPost);

        const rightPost = new THREE.Mesh(postGeom.clone(), mat);
        rightPost.position.set(7/16, 6/16, 0);
        gateGroup.add(rightPost);

        // Left swinging door
        const leftDoorGroup = new THREE.Group();
        leftDoorGroup.position.set(-6/16, 0, 0); // hinge at left post
        
        // Top rail (6/16 wide, 2.5/16 high, 2/16 deep)
        const topRailGeomLeft = createCustomBoxGeom(6/16, 2.5/16, 2/16, uvInfo);
        topRailGeomLeft.translate(3/16, 9.5/16, 0);
        leftDoorGroup.add(new THREE.Mesh(topRailGeomLeft, mat));

        // Bottom rail (6/16 wide, 2.5/16 high, 2/16 deep)
        const botRailGeomLeft = createCustomBoxGeom(6/16, 2.5/16, 2/16, uvInfo);
        botRailGeomLeft.translate(3/16, 4/16, 0);
        leftDoorGroup.add(new THREE.Mesh(botRailGeomLeft, mat));

        // Latch post on inner swinging edge (2/16 wide, 8/16 tall, 2/16 deep)
        const latchGeomLeft = createCustomBoxGeom(2/16, 8/16, 2/16, uvInfo);
        latchGeomLeft.translate(5/16, 6.75/16, 0);
        leftDoorGroup.add(new THREE.Mesh(latchGeomLeft, mat));

        gateGroup.add(leftDoorGroup);

        // Right swinging door
        const rightDoorGroup = new THREE.Group();
        rightDoorGroup.position.set(6/16, 0, 0); // hinge at right post
        
        // Top rail
        const topRailGeomRight = createCustomBoxGeom(6/16, 2.5/16, 2/16, uvInfo);
        topRailGeomRight.translate(-3/16, 9.5/16, 0);
        rightDoorGroup.add(new THREE.Mesh(topRailGeomRight, mat));

        // Bottom rail
        const botRailGeomRight = createCustomBoxGeom(6/16, 2.5/16, 2/16, uvInfo);
        botRailGeomRight.translate(-3/16, 4/16, 0);
        rightDoorGroup.add(new THREE.Mesh(botRailGeomRight, mat));

        // Latch post on inner swinging edge
        const latchGeomRight = createCustomBoxGeom(2/16, 8/16, 2/16, uvInfo);
        latchGeomRight.translate(-5/16, 6.75/16, 0);
        rightDoorGroup.add(new THREE.Mesh(latchGeomRight, mat));

        gateGroup.add(rightDoorGroup);

        // Orientation: align with connecting fences or walls
        const getP = (bx, by, bz) => getBlockProperties(this.world.getBlock(bx, by, bz));
        const hasFenceX = getP(x - 1, y, z).isFence || getP(x + 1, y, z).isFence || getP(x - 1, y, z).isWall || getP(x + 1, y, z).isWall;
        const hasFenceZ = getP(x, y, z - 1).isFence || getP(x, y, z + 1).isFence || getP(x, y, z - 1).isWall || getP(x, y, z + 1).isWall;

        let baseRot = 0;
        if (hasFenceZ && !hasFenceX) {
            baseRot = Math.PI / 2;
        }

        gateGroup.position.set(x + 0.5, y, z + 0.5);
        gateGroup.rotation.y = baseRot;

        const gateData = {
            mesh: gateGroup,
            isOpen: false,
            baseRotationY: baseRot,
            x, y, z,
            updateVisuals() {
                const targetAngle = this.isOpen ? Math.PI / 2 : 0;
                leftDoorGroup.rotation.y = targetAngle;
                rightDoorGroup.rotation.y = -targetAngle;
            }
        };

        this.fenceGates.set(key, gateData);
        this.engine.scene.add(gateGroup);
    }

    _addBed(footX, footY, footZ, headX, headY, headZ, blockType, dir = 0) {
        const footKey = `${footX},${footY},${footZ}`;
        const headKey = `${headX},${headY},${headZ}`;
        if (this.beds.has(footKey) || this.beds.has(headKey)) return;

        if (!this._bedMaterialCache) {
            this._bedMaterialCache = new Map();
            this._bedTextureLoader = new THREE.TextureLoader();
        }

        const props = getBlockProperties(blockType);
        const bedColor = (props && props.bedColor) ? props.bedColor : 'red';
        let mat = this._bedMaterialCache.get(bedColor);
        if (!mat) {
            const texPath = `assets/mc/entity/bed_${bedColor}.png`;
            const tex = this._bedTextureLoader.load(texPath);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.colorSpace = THREE.SRGBColorSpace;
            mat = new THREE.MeshLambertMaterial({
                map: tex,
                transparent: true,
                alphaTest: 0.1
            });
            this._bedMaterialCache.set(bedColor, mat);
        }

        const bedGroup = new THREE.Group();

        // Custom box UV builder: maps each face to exact pixel coordinates [0..64, 0..64]
        // Corners order for BoxGeometry: [a (ix=0,iy=0), b (ix=0,iy=1), c (ix=1,iy=1), d (ix=1,iy=0)]
        const createCustomUVBox = (w, h, d, faceCorners) => {
            const geom = new THREE.BoxGeometry(w, h, d).toNonIndexed();
            const uvs = geom.attributes.uv.array;
            for (let f = 0; f < 6; f++) {
                const corners = faceCorners[f];
                if (!corners) continue;
                const [a, b, c, d] = corners;
                const uv_a = [a[0] / 64, 1.0 - a[1] / 64];
                const uv_b = [b[0] / 64, 1.0 - b[1] / 64];
                const uv_c = [c[0] / 64, 1.0 - c[1] / 64];
                const uv_d = [d[0] / 64, 1.0 - d[1] / 64];

                const fOffset = f * 12; // 6 vertices * 2 coords
                // Triangle 1: a, b, d
                uvs[fOffset + 0] = uv_a[0]; uvs[fOffset + 1] = uv_a[1];
                uvs[fOffset + 2] = uv_b[0]; uvs[fOffset + 3] = uv_b[1];
                uvs[fOffset + 4] = uv_d[0]; uvs[fOffset + 5] = uv_d[1];
                // Triangle 2: b, c, d
                uvs[fOffset + 6] = uv_b[0]; uvs[fOffset + 7] = uv_b[1];
                uvs[fOffset + 8] = uv_c[0]; uvs[fOffset + 9] = uv_c[1];
                uvs[fOffset + 10] = uv_d[0]; uvs[fOffset + 11] = uv_d[1];
            }
            geom.attributes.uv.needsUpdate = true;
            return geom;
        };

        // Head piece (1.0 wide, 6/16 tall, 1.0 long)
        // Authentic Minecraft entity UV coordinates from 64x64 texture:
        // +X (right):          a:[22, 22], b:[28, 22], c:[28, 6],  d:[22, 6]
        // -X (left):           a:[6, 6],   b:[0, 6],   c:[0, 22],  d:[6, 22]
        // +Y (top / pillow):   a:[6, 6],   b:[6, 22],  c:[22, 22], d:[22, 6]
        // -Y (bottom):         a:[28, 22], b:[28, 6],  c:[44, 6],  d:[44, 22]
        // +Z (front / seam):   a:[22, 22], b:[22, 28], c:[38, 28], d:[38, 22]
        // -Z (back / head):    a:[22, 6],  b:[22, 0],  c:[6, 0],   d:[6, 6]
        const headGeom = createCustomUVBox(1.0, 6/16, 1.0, [
            [[22, 22], [28, 22], [28, 6],  [22, 6]],
            [[6, 6],   [0, 6],   [0, 22],  [6, 22]],
            [[6, 6],   [6, 22],  [22, 22], [22, 6]],
            [[28, 22], [28, 6],  [44, 6],  [44, 22]],
            [[22, 22], [22, 28], [38, 28], [38, 22]],
            [[22, 6],  [22, 0],  [6, 0],   [6, 6]]
        ]);
        const headMesh = new THREE.Mesh(headGeom, mat);
        headMesh.position.set(0, 6/16, -0.5);
        bedGroup.add(headMesh);

        // Foot piece (1.0 wide, 6/16 tall, 1.0 long)
        // +X (right):          a:[22, 44], b:[28, 44], c:[28, 28], d:[22, 28]
        // -X (left):           a:[6, 28],  b:[0, 28],  c:[0, 44],  d:[6, 44]
        // +Y (top / blanket):  a:[6, 28],  b:[6, 44],  c:[22, 44], d:[22, 28]
        // -Y (bottom):         a:[28, 44], b:[28, 28], c:[44, 28], d:[44, 44]
        // +Z (front / foot):   a:[22, 28], b:[22, 22], c:[38, 22], d:[38, 28]
        // -Z (back / seam):    a:[22, 22], b:[22, 28], c:[38, 28], d:[38, 22]
        const footGeom = createCustomUVBox(1.0, 6/16, 1.0, [
            [[22, 44], [28, 44], [28, 28], [22, 28]],
            [[6, 28],  [0, 28],  [0, 44],  [6, 44]],
            [[6, 28],  [6, 44],  [22, 44], [22, 28]],
            [[28, 44], [28, 28], [44, 28], [44, 44]],
            [[22, 28], [22, 22], [38, 22], [38, 28]],
            [[22, 22], [22, 28], [38, 28], [38, 22]]
        ]);
        const footMesh = new THREE.Mesh(footGeom, mat);
        footMesh.position.set(0, 6/16, 0.5);
        bedGroup.add(footMesh);

        // 4 Corner Legs (3/16 x 3/16 x 3/16), height from y=0 to y=3/16 (center y=1.5/16)
        const createLegGeom = (v0) => {
            return createCustomUVBox(3/16, 3/16, 3/16, [
                [[50, v0 + 3], [50, v0 + 6], [53, v0 + 6], [53, v0 + 3]],
                [[56, v0 + 3], [56, v0 + 6], [59, v0 + 6], [59, v0 + 3]],
                [[53, v0],     [53, v0 + 3], [56, v0 + 3], [56, v0]],
                [[56, v0 + 3], [56, v0],     [59, v0],     [59, v0 + 3]],
                [[53, v0 + 3], [53, v0 + 6], [56, v0 + 6], [56, v0 + 3]],
                [[62, v0 + 3], [62, v0 + 6], [59, v0 + 6], [59, v0 + 3]]
            ]);
        };
        const legFL = new THREE.Mesh(createLegGeom(0), mat);
        legFL.position.set(-6.5/16, 1.5/16, 14.5/16);
        bedGroup.add(legFL);

        const legFR = new THREE.Mesh(createLegGeom(6), mat);
        legFR.position.set(6.5/16, 1.5/16, 14.5/16);
        bedGroup.add(legFR);

        const legHL = new THREE.Mesh(createLegGeom(12), mat);
        legHL.position.set(-6.5/16, 1.5/16, -14.5/16);
        bedGroup.add(legHL);

        const legHR = new THREE.Mesh(createLegGeom(18), mat);
        legHR.position.set(6.5/16, 1.5/16, -14.5/16);
        bedGroup.add(legHR);

        // Midpoint and rotation (total height is 9/16 = 0.5625 blocks, flush with Minecraft bounding box)
        const midX = (footX + headX + 1) / 2;
        const midY = footY;
        const midZ = (footZ + headZ + 1) / 2;
        bedGroup.position.set(midX, midY, midZ);

        let rotY = 0;
        if (dir === 1) rotY = -Math.PI / 2;
        else if (dir === 2) rotY = Math.PI;
        else if (dir === 3) rotY = Math.PI / 2;
        bedGroup.rotation.y = rotY;

        const bedData = {
            mesh: bedGroup,
            blockType,
            footPos: { x: footX, y: footY, z: footZ },
            headPos: { x: headX, y: headY, z: headZ },
            dir
        };

        this.beds.set(footKey, bedData);
        this.beds.set(headKey, bedData);
        this.engine.scene.add(bedGroup);
    }

    _removeBed(x, y, z) {
        const key = `${x},${y},${z}`;
        const bedData = this.beds.get(key);
        if (!bedData) return;

        this.engine.scene.remove(bedData.mesh);
        bedData.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
        });

        const footKey = `${bedData.footPos.x},${bedData.footPos.y},${bedData.footPos.z}`;
        const headKey = `${bedData.headPos.x},${bedData.headPos.y},${bedData.headPos.z}`;
        this.beds.delete(footKey);
        this.beds.delete(headKey);

        if (key === footKey) {
            if (this.world.getBlock(bedData.headPos.x, bedData.headPos.y, bedData.headPos.z) === window.BLOCKS.BED_HEAD) {
                this.world.setBlock(bedData.headPos.x, bedData.headPos.y, bedData.headPos.z, window.BLOCKS.AIR);
            }
        } else {
            const curFoot = this.world.getBlock(bedData.footPos.x, bedData.footPos.y, bedData.footPos.z);
            const p = getBlockProperties(curFoot);
            if (p && p.isBed) {
                this.world.setBlock(bedData.footPos.x, bedData.footPos.y, bedData.footPos.z, window.BLOCKS.AIR);
            }
        }
    }

    interactBed(x, y, z, blockType) {
        if (this.currentDimension === 'nether' || this.currentDimension === 'aether' || this.currentDimension === 'end') {
            this._removeBed(x, y, z);
            this.world.setBlock(x, y, z, window.BLOCKS.AIR);
            this.explode(x + 0.5, y + 0.5, z + 0.5, 5);
            this.showToast("Intentional Game Design", 2500);
            return;
        }

        const key = `${x},${y},${z}`;
        const bedData = this.beds.get(key);
        let bFootX = x, bFootY = y, bFootZ = z;
        if (!bedData && blockType === window.BLOCKS.BED_HEAD) {
            if (this.world.getBlock(x, y, z + 1) === window.BLOCKS.RED_BED || getBlockProperties(this.world.getBlock(x, y, z + 1)).isBed) bFootZ = z + 1;
            else if (this.world.getBlock(x - 1, y, z) === window.BLOCKS.RED_BED || getBlockProperties(this.world.getBlock(x - 1, y, z)).isBed) bFootX = x - 1;
            else if (this.world.getBlock(x, y, z - 1) === window.BLOCKS.RED_BED || getBlockProperties(this.world.getBlock(x, y, z - 1)).isBed) bFootZ = z - 1;
            else if (this.world.getBlock(x + 1, y, z) === window.BLOCKS.RED_BED || getBlockProperties(this.world.getBlock(x + 1, y, z)).isBed) bFootX = x + 1;
        }
        const footPos = bedData ? bedData.footPos : { x: bFootX, y: bFootY, z: bFootZ };
        const spawnX = footPos.x + 0.5;
        const spawnY = footPos.y + 0.6;
        const spawnZ = footPos.z + 0.5;

        this.player.spawnPoint = {
            x: spawnX,
            y: spawnY,
            z: spawnZ,
            bedPos: { x: footPos.x, y: footPos.y, z: footPos.z },
            isBed: true,
            dimension: 'overworld'
        };

        const time = this.lighting.timeOfDay;
        const isNight = (time > 0.72 || time < 0.23);

        if (!isNight) {
            this.showToast("Respawn point set. You can only sleep at night or during thunderstorms.", 2500);
            if (this.audio && this.audio.playPop) this.audio.playPop();
            return;
        }

        this.showToast("Sleeping...", 2000);
        if (this.audio && this.audio.playMC) this.audio.playMC('random/levelup', 0.5);

        let fade = document.getElementById('bed-sleep-overlay');
        if (!fade) {
            fade = document.createElement('div');
            fade.id = 'bed-sleep-overlay';
            fade.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;opacity:0;transition:opacity 0.8s ease-in-out;pointer-events:none;z-index:9998;';
            document.body.appendChild(fade);
        }
        fade.style.opacity = '1';

        setTimeout(() => {
            this.lighting.timeOfDay = 0.28;
            if (this.player.health < this.player.maxHealth) {
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 6);
            }
            this.showToast("Good morning! Respawn point set.", 2500);
            setTimeout(() => {
                fade.style.opacity = '0';
            }, 300);
        }, 1000);
    }

    resolveSafeOverworldSpawn() {
        const sp = this.player.spawnPoint;
        if (!sp) {
            return findSafeSpawn(this.planetParams, 'overworld');
        }

        // If explicitly a non-bed spawnpoint (e.g. /spawnpoint command)
        if (sp.isBed === false) {
            return { x: sp.x, y: sp.y, z: sp.z };
        }

        // Locate bed block in the Overworld
        const targetX = sp.bedPos ? sp.bedPos.x : Math.floor(sp.x);
        const targetY = sp.bedPos ? sp.bedPos.y : Math.floor(sp.y - 0.5);
        const targetZ = sp.bedPos ? sp.bedPos.z : Math.floor(sp.z);

        // Search in a 1-block box around target for any bed block
        let foundBedX = null, foundBedY = null, foundBedZ = null;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const testX = targetX + dx;
                    const testY = targetY + dy;
                    const testZ = targetZ + dz;
                    const b = this.world.getBlock(testX, testY, testZ);
                    const bp = getBlockProperties(b);
                    if (bp && (bp.isBed || bp.isBedHead)) {
                        foundBedX = testX;
                        foundBedY = testY;
                        foundBedZ = testZ;
                        break;
                    }
                }
                if (foundBedX !== null) break;
            }
            if (foundBedX !== null) break;
        }

        if (foundBedX === null) {
            // Bed is missing or destroyed!
            this.showToast("Your home bed was missing or obstructed", 3000);
            this.player.spawnPoint = null;
            return findSafeSpawn(this.planetParams, 'overworld');
        }

        // Bed exists! Now find the safe adjacent block (standard Minecraft Java logic)
        // Check surrounding horizontal positions around the bed:
        const offsets = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [-1, 1], [1, -1], [-1, -1],
            [2, 0], [-2, 0], [0, 2], [0, -2]
        ];

        for (const [dx, dz] of offsets) {
            for (const dy of [0, 1, -1]) {
                const cx = foundBedX + dx;
                const cy = foundBedY + dy;
                const cz = foundBedZ + dz;

                const bFeet = this.world.getBlock(cx, cy, cz);
                const pFeet = getBlockProperties(bFeet);
                if (pFeet && pFeet.solid) continue;
                if (pFeet && (pFeet.isBed || pFeet.isBedHead)) continue;
                if (bFeet === window.BLOCKS.WATER || bFeet === window.BLOCKS.SWAMP_WATER || bFeet === window.BLOCKS.LAVA || bFeet === window.BLOCKS.FIRE) continue;

                const bHead = this.world.getBlock(cx, cy + 1, cz);
                const pHead = getBlockProperties(bHead);
                if (pHead && pHead.solid) continue;
                if (bHead === window.BLOCKS.LAVA || bHead === window.BLOCKS.FIRE) continue;

                const bGround = this.world.getBlock(cx, cy - 1, cz);
                const pGround = getBlockProperties(bGround);
                if (!pGround || !pGround.solid) continue;
                if (pGround.isBed || pGround.isBedHead) continue;
                if (bGround === window.BLOCKS.LAVA || bGround === window.BLOCKS.FIRE || bGround === window.BLOCKS.CACTUS) continue;

                // Found safe unobstructed adjacent spot on solid ground
                return { x: cx + 0.5, y: cy + 0.05, z: cz + 0.5 };
            }
        }

        // If no adjacent spot is available, check if player can stand directly on top of the bed
        const topY = foundBedY + 1;
        const bTop1 = this.world.getBlock(foundBedX, topY, foundBedZ);
        const pTop1 = getBlockProperties(bTop1);
        const bTop2 = this.world.getBlock(foundBedX, topY + 1, foundBedZ);
        const pTop2 = getBlockProperties(bTop2);

        if ((!pTop1 || !pTop1.solid) && (!pTop2 || !pTop2.solid) && bTop1 !== window.BLOCKS.LAVA && bTop2 !== window.BLOCKS.LAVA && bTop1 !== window.BLOCKS.FIRE) {
            return { x: foundBedX + 0.5, y: topY + 0.05, z: foundBedZ + 0.5 };
        }

        // Bed is fully obstructed
        this.showToast("Your home bed was missing or obstructed", 3000);
        this.player.spawnPoint = null;
        return findSafeSpawn(this.planetParams, 'overworld');
    }

    respawnPlayer() {
        this.player.health = this.player.maxHealth;
        this.player.mana = this.player.maxMana;
        this.player.hunger = 20;
        this.player.saturation = 5.0;
        this.player.exhaustion = 0;
        this.player.hungerEffectTimer = 0;
        this.player.burnTimer = 0;
        this.player.velocity.set(0, 0, 0);
        this.player.fallDistance = 0;
        this.player.spawnGraceTimer = 5.0;

        if (this.currentDimension !== 'overworld') {
            // Player died in End, Nether, or Aether -> MUST warp to Overworld at last set spawnpoint
            this.isWarping = false;
            this.warpToNewPlanet('overworld', null, true);
        } else {
            // Already in Overworld: find safe bed spawnpoint or world spawn
            const spawnPos = this.resolveSafeOverworldSpawn();
            this.player.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
            this.player.velocity.set(0, 0, 0);
            this.player.fallDistance = 0;
            this.player.fallStartY = spawnPos.y;
            this.player.spawnGraceTimer = 5.0;
            if (this.loadChunksAroundPlayer) this.loadChunksAroundPlayer();
            if (this.audio && this.audio.playMC) this.audio.playMC('random/levelup', 0.6);
        }
    }

    handleHardcoreGameOver() {
        if (this._isHardcoreGameOver) return;
        this._isHardcoreGameOver = true;
        if (document.exitPointerLock) document.exitPointerLock();
        const screen = document.getElementById('hardcore-game-over-screen');
        if (screen) {
            screen.classList.remove('hidden');
        }
        const scoreVal = document.getElementById('hardcore-score-val');
        if (scoreVal) {
            const score = Math.floor(this.player.score || 0);
            scoreVal.textContent = `${score}`;
        }
        if (this.audio && this.audio.playMC) {
            this.audio.playMC('random/classic_hurt', 0.8);
        }
    }

    showToast(msg, duration = 2500) {
        const el = document.getElementById('creative-toast');
        if (!el) return;
        el.innerText = msg;
        el.classList.remove('hidden');
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            el.classList.add('hidden');
        }, duration);
    }

    _updateFurnaces(dt) {
        // Simple smelting recipes
        const getSmeltResult = (inputItem) => {
            if (!inputItem || !inputItem.item) return null;
            const type = inputItem.item.type;
            const subtype = inputItem.item.subtype;
            
            if (type === 'block' && (
                subtype === window.BLOCKS.IRON_ORE ||
                subtype === window.BLOCKS.GOLD_ORE ||
                subtype === window.BLOCKS.NETHER_GOLD_ORE ||
                subtype === window.BLOCKS.NETHER_QUARTZ_ORE ||
                subtype === window.BLOCKS.CRYSTAL_ORE ||
                subtype === window.BLOCKS.MANA_ORE
            )) {
                // Return INGOT or GEM
                let matSubtype = 'iron_ingot';
                if (subtype === window.BLOCKS.GOLD_ORE || subtype === window.BLOCKS.NETHER_GOLD_ORE) matSubtype = 'gold_ingot';
                if (subtype === window.BLOCKS.NETHER_QUARTZ_ORE) matSubtype = 'quartz';
                if (subtype === window.BLOCKS.CRYSTAL_ORE) matSubtype = 'crystal_shard';
                if (subtype === window.BLOCKS.MANA_ORE) matSubtype = 'mana_crystal';
                const matName = matSubtype === 'quartz' ? 'Nether Quartz' : matSubtype.replace('_', ' ');
                return { type: 'material', subtype: matSubtype, name: matName, stackable: true, maxStack: 64, id: `mat_${matSubtype}` };
            }
            // Raw ore smelting (from mining drops)
            if (type === 'material' && subtype === 'raw_iron') {
                return { type: 'material', subtype: 'iron_ingot', name: 'Iron Ingot', stackable: true, maxStack: 64, id: 'mat_iron_ingot' };
            }
            if (type === 'material' && subtype === 'raw_gold') {
                return { type: 'material', subtype: 'gold_ingot', name: 'Gold Ingot', stackable: true, maxStack: 64, id: 'mat_gold_ingot' };
            }
            if (type === 'block' && subtype === window.BLOCKS.SAND) {
                return { type: 'block', subtype: window.BLOCKS.GLASS, name: 'Glass', stackable: true, maxStack: 64, id: `block_${window.BLOCKS.GLASS}` };
            }
            if (type === 'block' && subtype === window.BLOCKS.COBBLESTONE) {
                return { type: 'block', subtype: window.BLOCKS.STONE, name: 'Stone', stackable: true, maxStack: 64, id: `block_${window.BLOCKS.STONE}` };
            }
            if (type === 'block' && subtype === window.BLOCKS.CACTUS) {
                return { type: 'material', subtype: 'green_dye', name: 'Green Dye', stackable: true, maxStack: 64, id: 'mat_green_dye' };
            }
            if (type === 'food') {
                if (subtype === 'raw_beef') return { type: 'food', subtype: 'cooked_beef', name: 'Cooked Beef', stackable: true, maxStack: 64, data: { heal: 30 }, id: `food_cooked_beef` };
                if (subtype === 'raw_porkchop') return { type: 'food', subtype: 'cooked_porkchop', name: 'Cooked Porkchop', stackable: true, maxStack: 64, data: { heal: 30 }, id: `food_cooked_porkchop` };
                if (subtype === 'raw_chicken') return { type: 'food', subtype: 'cooked_chicken', name: 'Cooked Chicken', stackable: true, maxStack: 64, data: { heal: 25 }, id: `food_cooked_chicken` };
                if (subtype === 'raw_mutton') return { type: 'food', subtype: 'cooked_mutton', name: 'Cooked Mutton', stackable: true, maxStack: 64, data: { heal: 25 }, id: `food_cooked_mutton` };
                if (subtype === 'raw_fish') return { type: 'food', subtype: 'cooked_fish', name: 'Cooked Fish', stackable: true, maxStack: 64, data: { heal: 25 }, id: `food_cooked_fish` };
            }
            if (type === 'block' && (
                subtype === window.BLOCKS.WOOD ||
                subtype === window.BLOCKS.ACACIA_WOOD ||
                subtype === window.BLOCKS.AUTUMN_WOOD ||
                subtype === window.BLOCKS.PALM_WOOD ||
                subtype === window.BLOCKS.PINE_WOOD ||
                subtype === window.BLOCKS.AETHER_WOOD ||
                subtype === window.BLOCKS.DARK_OAK_WOOD ||
                subtype === window.BLOCKS.BIRCH_WOOD ||
                subtype === window.BLOCKS.CHERRY_LOG ||
                subtype === window.BLOCKS.CRIMSON_STEM
            )) {
                return { type: 'material', subtype: 'coal', name: 'Charcoal', stackable: true, maxStack: 64, id: 'mat_coal' };
            }
            return null;
        };

        const isFuel = (fuelItem) => {
            if (!fuelItem || !fuelItem.item) return false;
            const t = fuelItem.item.type;
            const s = fuelItem.item.subtype;
            if (t === 'material' && (s === 'coal' || s === 'stick')) return true;
            if (t === 'block' && (
                s === window.BLOCKS.PLANKS || 
                s === window.BLOCKS.WOOD || 
                s === window.BLOCKS.ACACIA_WOOD ||
                s === window.BLOCKS.AUTUMN_WOOD ||
                s === window.BLOCKS.PALM_WOOD ||
                s === window.BLOCKS.PINE_WOOD ||
                s === window.BLOCKS.AETHER_WOOD ||
                s === window.BLOCKS.DARK_OAK_WOOD ||
                s === window.BLOCKS.BIRCH_WOOD ||
                s === window.BLOCKS.BIRCH_PLANKS ||
                s === window.BLOCKS.CHERRY_LOG ||
                s === window.BLOCKS.CRIMSON_STEM ||
                s === window.BLOCKS.LEAVES ||
                s === window.BLOCKS.ACACIA_LEAVES ||
                s === window.BLOCKS.CHERRY_LEAVES ||
                s === window.BLOCKS.AUTUMN_LEAVES ||
                s === window.BLOCKS.PALM_LEAVES ||
                s === window.BLOCKS.GLOW_LEAVES ||
                s === window.BLOCKS.BIRCH_LEAVES ||
                s === window.BLOCKS.CRAFTING_TABLE ||
                s === window.BLOCKS.BOOKSHELF ||
                s === window.BLOCKS.CHEST_BLOCK ||
                s === window.BLOCKS.COAL_BLOCK
            )) return true;
            if (typeof s === 'string' && (s.includes('wood') || s.includes('plank') || s.includes('log') || s.includes('stick') || s.includes('coal'))) return true;
            if (t === 'equipment' && (
                s === 'wood_pickaxe' || s === 'wood_axe' || s === 'wood_sword' || s === 'wood_shovel' ||
                s === 'wooden_pickaxe' || s === 'wooden_axe' || s === 'wooden_sword' || s === 'wooden_shovel' ||
                s === 'shovel_wood' || s === 'pickaxe_wood' || s === 'axe_wood' || s === 'sword_wood'
            )) return true;
            return false;
        };

        for (const [key, f] of this.furnaces.entries()) {
            const resultItem = getSmeltResult(f.input);
            const canSmelt = resultItem && 
                (!f.output || (f.output.item.type === resultItem.type && f.output.item.subtype === resultItem.subtype && f.output.count < f.output.item.maxStack));

            // Initialize burn time properties if missing
            if (typeof f.burnTime === 'undefined') f.burnTime = 0;
            if (typeof f.maxBurnTime === 'undefined') f.maxBurnTime = 0;

            let isBurning = f.burnTime > 0;

            // Consume fuel if we can smelt but aren't burning
            if (canSmelt && !isBurning && isFuel(f.fuel)) {
                let fuelVal = 10.0; // Sticks/Planks/Tools
                const fs = f.fuel.item.subtype;
                if (fs === 'coal') fuelVal = 76.0;
                else if (fs === window.BLOCKS.COAL_BLOCK) fuelVal = 684.0;
                else if (fs === window.BLOCKS.WOOD || fs === window.BLOCKS.ACACIA_WOOD || fs === window.BLOCKS.AUTUMN_WOOD || fs === window.BLOCKS.PALM_WOOD || fs === window.BLOCKS.PINE_WOOD || fs === window.BLOCKS.AETHER_WOOD || fs === window.BLOCKS.DARK_OAK_WOOD || fs === window.BLOCKS.CHERRY_LOG || (typeof fs === 'string' && fs.includes('log'))) fuelVal = 20.0;
                
                f.maxBurnTime = fuelVal;
                f.burnTime = fuelVal;
                isBurning = true;
                
                f.fuel.count--;
                if (f.fuel.count <= 0) f.fuel = null;
            }

            if (isBurning) {
                f.burnTime -= dt;
                f.isSmelting = true;
                
                if (canSmelt) {
                    f.progress += dt / 9.5; // ~9.5 seconds to smelt 1 item
                    if (f.progress >= 1.0) {
                        f.progress = 0;
                        f.input.count--;
                        if (f.input.count <= 0) f.input = null;
                        
                        if (f.output) {
                            f.output.count++;
                        } else {
                            f.output = { item: resultItem, count: 1 };
                        }
                    }
                } else {
                    f.progress = 0;
                }
                
                if (f.burnTime <= 0) {
                    f.burnTime = 0;
                    f.isSmelting = false;
                }
            } else {
                f.isSmelting = false;
                if (f.progress > 0) {
                    f.progress -= dt / 2.0;
                    if (f.progress < 0) f.progress = 0;
                }
            }
        }
    }

    _createHUDElements() {
        // Crosshair
        if (!document.getElementById('crosshair')) {
            const ch = document.createElement('div');
            ch.id = 'crosshair';
            document.body.appendChild(ch);
        }
        // Damage flash
        if (!document.getElementById('damage-flash')) {
            const df = document.createElement('div');
            df.id = 'damage-flash';
            document.body.appendChild(df);
        }
        // Minimap Overlay
        if (!document.getElementById('minimap-overlay')) {
            const mmo = document.createElement('div');
            mmo.id = 'minimap-overlay';
            mmo.style.cssText = 'position: absolute; top: 20px; right: 20px; width: 200px; height: 200px; pointer-events: none; z-index: 100; font-family: Minecraftia, monospace, sans-serif; border: 4px solid black; box-shadow: 0 0 15px rgba(0,0,0,0.8);';
            mmo.innerHTML = `
                <div style="position: absolute; top: 8px; left: 50%; transform: translateX(-50%); color: white; font-weight: bold; text-shadow: 1px 1px 2px #000; font-size: 14px;">N</div>
                <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); color: white; font-weight: bold; text-shadow: 1px 1px 2px #000; font-size: 14px;">S</div>
                <div style="position: absolute; top: 50%; left: 8px; transform: translateY(-50%); color: white; font-weight: bold; text-shadow: 1px 1px 2px #000; font-size: 14px;">W</div>
                <div style="position: absolute; top: 50%; right: 8px; transform: translateY(-50%); color: white; font-weight: bold; text-shadow: 1px 1px 2px #000; font-size: 14px;">E</div>
                <div id="minimap-player-arrow" style="position: absolute; top: 50%; left: 50%; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 16px solid #ff3333; transform-origin: 50% 50%; margin-left: -6px; margin-top: -8px; filter: drop-shadow(0 0 3px black);"></div>
            `;
            document.body.appendChild(mmo);
        }
    }

    // UI functions removed by user request

    handleInput(dt) {
        if (!this.input.isPointerLocked()) return;
        if (this.player && this.player.isSpectator) {
            if (this.viewModel) this.viewModel.visible = false;
            return;
        }

        // Hotbar selection via keys
        if (this.input.hotbarIndex >= 0) {
            this.player.selectedSlot = this.input.hotbarIndex;
        }
        // Hotbar selection via scroll wheel
        if (this.input.mouse.scrollDelta !== 0) {
            this.player.selectedSlot = ((this.player.selectedSlot + this.input.mouse.scrollDelta) % 9 + 9) % 9;
        }

        // Raycast for interactions
        const lookDir = this.player.getLookDirection();
        const eyePos = this.player.getEyePosition();
        
        const invSlot = this.player.inventory.slots[this.player.selectedSlot];
        const isHoldingLiquidInteractable = invSlot && invSlot.item && (invSlot.item.subtype === 'bucket' || invSlot.item.subtype === 'water_bucket' || invSlot.item.subtype === 'lava_bucket');
        const hit = this.world.raycast(eyePos, lookDir, 8, isHoldingLiquidInteractable);
        const entityHit = this.entityManager.raycast(eyePos, lookDir, 4); // Melee range

        // View model bobbing and item display
        const speed = Math.sqrt(this.player.velocity.x ** 2 + this.player.velocity.z ** 2);
        if (this.player.grounded && speed > 0.5) {
            this.viewModel.position.y = Math.sin(performance.now() * 0.01) * 0.05;
            this.viewModel.position.x = Math.cos(performance.now() * 0.005) * 0.05;
        } else {
            this.viewModel.position.lerp(new THREE.Vector3(0, 0, 0), 0.1);
        }

        // Update held item visual
        const slot = this.player.inventory.slots[this.player.selectedSlot];
        if (!slot && this.heldItemMesh) {
            this.viewModel.remove(this.heldItemMesh);
            this.heldItemMesh = null;
        } else if (slot && (!this.heldItemMesh || !this.heldItemMesh.userData.item || this.heldItemMesh.userData.item.type !== slot.item.type || this.heldItemMesh.userData.item.subtype !== slot.item.subtype)) {
            if (this.heldItemMesh) {
                this.viewModel.remove(this.heldItemMesh);
                if (this.heldItemMesh.geometry) this.heldItemMesh.geometry.dispose();
                if (this.heldItemMesh.material) {
                    if (this.heldItemMesh.material.map) this.heldItemMesh.material.map.dispose();
                    this.heldItemMesh.material.dispose();
                }
            }

            if (slot.item.type === 'block') {
                const blockProps = getBlockProperties(slot.item.subtype);
                const mat = new THREE.MeshLambertMaterial({
                    map: this.atlas.texture,
                    alphaTest: 0.5,
                    transparent: blockProps.transparent || blockProps.isCross || false,
                    side: blockProps.isCross ? THREE.DoubleSide : THREE.FrontSide
                });

                if (blockProps.isCross || slot.item.subtype === BLOCKS.TORCH) {
                    const geom = new THREE.BufferGeometry();
                    const s = 0.15; // slightly smaller
                    const positions = [
                        -s, -s, -s, s, -s, s, s, s, s, -s, s, -s,
                        -s, -s, s, s, -s, -s, s, s, -s, -s, s, s
                    ];
                    const uvInfo = this.atlas.getUV(slot.item.subtype, 'side');
                    const uvs = [];
                    for (let i = 0; i < 2; i++) {
                        uvs.push(uvInfo.u, uvInfo.v, uvInfo.u + uvInfo.uSize, uvInfo.v, uvInfo.u + uvInfo.uSize, uvInfo.v + uvInfo.vSize, uvInfo.u, uvInfo.v + uvInfo.vSize);
                    }
                    const indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7];
                    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                    geom.setIndex(indices);
                    geom.computeVertexNormals();
                    this.heldItemMesh = new THREE.Mesh(geom, mat);
                } else if (blockProps.isBed || blockProps.isBedHead || blockProps.isLantern || blockProps.isFence || blockProps.isFenceGate || blockProps.isWall || slot.item.subtype === BLOCKS.CHORUS_PLANT || slot.item.subtype === BLOCKS.CHORUS_FLOWER) {
                    // Bed/Lantern/Fence/Gate/Wall/Chorus held in hand: Extruded 2D item sprite like authentic Minecraft
                    const iconCanvas = generateItemTexture(slot.item.type, slot.item.subtype, (c) => {
                        if (this.heldItemMesh && this.heldItemMesh.userData && this.heldItemMesh.userData.item === slot.item) {
                            const newExtruded = createExtrudedItemMesh(c, 0.45, 0.035);
                            newExtruded.position.copy(this.heldItemMesh.position);
                            newExtruded.rotation.copy(this.heldItemMesh.rotation);
                            newExtruded.userData.item = slot.item;
                            this.viewModel.remove(this.heldItemMesh);
                            if (this.heldItemMesh.geometry) this.heldItemMesh.geometry.dispose();
                            if (this.heldItemMesh.material) this.heldItemMesh.material.dispose();
                            this.heldItemMesh = newExtruded;
                            this.viewModel.add(this.heldItemMesh);
                        }
                    });
                    this.heldItemMesh = createExtrudedItemMesh(iconCanvas, 0.45, 0.035);
                    this.heldItemMesh.position.set(0.35, -0.32, -0.58);
                    this.heldItemMesh.rotation.set(-0.2, 0.35, -0.75);
                } else {
                    const isCactus = slot.item.subtype === BLOCKS.CACTUS;
                    const geom = new THREE.BoxGeometry(isCactus ? 0.21875 : 0.25, 0.25, isCactus ? 0.21875 : 0.25).toNonIndexed();
                    const uvs = geom.attributes.uv.array;
                    const faceNames = ['side', 'side', 'top', 'bottom', 'side', 'side'];
                    for (let i = 0; i < 6; i++) {
                        const uvInfo = this.atlas.getUV(slot.item.subtype, faceNames[i]);
                        for (let v = 0; v < 6; v++) {
                            let baseU = uvs[i * 12 + v * 2];
                            let baseV = uvs[i * 12 + v * 2 + 1];
                            if (isCactus) {
                                baseU = 0.0625 + baseU * 0.875;
                                if (i === 2 || i === 3) baseV = 0.0625 + baseV * 0.875;
                            }
                            uvs[i * 12 + v * 2] = uvInfo.u + baseU * uvInfo.uSize;
                            uvs[i * 12 + v * 2 + 1] = uvInfo.v + baseV * uvInfo.vSize;
                        }
                    }
                    this.heldItemMesh = new THREE.Mesh(geom, mat);
                }
                if (!blockProps.isBed && !blockProps.isBedHead && !blockProps.isLantern && !blockProps.isFence && !blockProps.isFenceGate && !blockProps.isWall) {
                    this.heldItemMesh.position.set(0.4, -0.2, -0.8);
                    if (!blockProps.isCross && slot.item.subtype !== BLOCKS.TORCH) {
                        this.heldItemMesh.rotation.y = -Math.PI / 4;
                        this.heldItemMesh.rotation.x = Math.PI / 8;
                    }
                }

            } else if (slot.item.type === 'wand') {
                this.heldItemMesh = new THREE.Group();
                // Textured wooden staff handle with golden rune rings
                const wandShaftCanvas = generateWandShaftTexture();
                const wandTex = new THREE.CanvasTexture(wandShaftCanvas);
                wandTex.magFilter = THREE.NearestFilter;
                wandTex.minFilter = THREE.NearestFilter;
                wandTex.colorSpace = THREE.SRGBColorSpace;
                const staffMat = new THREE.MeshLambertMaterial({ map: wandTex });

                const staff = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.016, 0.024, 0.62, 8),
                    staffMat
                );
                staff.position.y = -0.1;
                this.heldItemMesh.add(staff);

                // Golden crown / prongs cradling the gem
                const crownGeo = new THREE.CylinderGeometry(0.038, 0.02, 0.08, 6, 1, true);
                const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 });
                const crownMesh = new THREE.Mesh(crownGeo, crownMat);
                crownMesh.position.y = 0.22;
                this.heldItemMesh.add(crownMesh);
                
                // Gem top
                let activeColor = 0x88ccff; // Default cyan/arcane
                if (slot.item.data && slot.item.data.wand) {
                    let r = 0, g = 0, b = 0, count = 0;
                    for (const spellItem of slot.item.data.wand.spellSlots) {
                        if (spellItem) {
                            let s = spellItem;
                            if (spellItem.type === 'spell' && spellItem.data && spellItem.data.spell) s = spellItem.data.spell;
                            else if (spellItem.item && spellItem.item.type === 'spell') s = spellItem.item.data.spell;
                            if (s.color) {
                                r += (s.color >> 16) & 255;
                                g += (s.color >> 8) & 255;
                                b += s.color & 255;
                                count++;
                            }
                        }
                    }
                    if (count > 0) {
                        activeColor = (Math.floor(r / count) << 16) | (Math.floor(g / count) << 8) | Math.floor(b / count);
                    }
                }
                const gem = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.06, 0),
                    new THREE.MeshBasicMaterial({ color: activeColor })
                );
                gem.position.y = 0.25;
                this.heldItemMesh.add(gem);
                
                // Glow point light
                const gemLight = new THREE.PointLight(activeColor, 0.8, 2);
                gemLight.position.y = 0.25;
                this.heldItemMesh.add(gemLight);

                this.heldItemMesh.position.set(0.42, -0.30, -0.72);
                this.heldItemMesh.rotation.x = Math.PI / 4.8;
            } else {
                const iconCanvas = generateItemTexture(slot.item.type, slot.item.subtype, (c) => {
                    // Update extruded mesh if texture loads asynchronously
                    if (this.heldItemMesh && this.heldItemMesh.userData && this.heldItemMesh.userData.item === slot.item) {
                        const newExtruded = createExtrudedItemMesh(c, 0.45, 0.035);
                        newExtruded.position.copy(this.heldItemMesh.position);
                        newExtruded.rotation.copy(this.heldItemMesh.rotation);
                        newExtruded.userData.item = slot.item;
                        this.viewModel.remove(this.heldItemMesh);
                        if (this.heldItemMesh.geometry) this.heldItemMesh.geometry.dispose();
                        if (this.heldItemMesh.material) this.heldItemMesh.material.dispose();
                        this.heldItemMesh = newExtruded;
                        this.viewModel.add(this.heldItemMesh);
                    }
                });

                // Create extruded 3D pixelated mesh
                this.heldItemMesh = createExtrudedItemMesh(iconCanvas, 0.45, 0.035);
                // Position diagonally in Steve's hand pointing forward and slightly tilted
                this.heldItemMesh.position.set(0.35, -0.32, -0.58);
                this.heldItemMesh.rotation.set(-0.2, 0.35, -0.75); // Diagonal sword/tool grip
            }
            this.heldItemMesh.userData.item = slot.item;
            this.viewModel.add(this.heldItemMesh);
        }

        // Ensure first-person hand & held weapon are strictly hidden in 3rd person
        this.viewModel.visible = (this.cameraMode === 0);

        // Track and animate authentic Minecraft swing arc
        if (!this.swingProgress) this.swingProgress = 0;
        if (!this.isSwinging) this.isSwinging = false;

        if (this.input.mouse.leftClick) {
            this.isSwinging = true;
        }

        if (this.isSwinging) {
            this.swingProgress += dt * 4.5; // Fast snappy Minecraft swing cycle
            if (this.swingProgress >= 1.0) {
                if (this.input.mouse.leftClick) {
                    this.swingProgress = 0; // Continuous mining swing cycle
                } else {
                    this.swingProgress = 0;
                    this.isSwinging = false;
                }
            }
        } else {
            this.swingProgress = 0;
        }

        // Apply authentic Minecraft swing arc to viewModel: dip down, chop inward, rotate forward
        const swingSin = Math.sin(this.swingProgress * Math.PI);
        const swingCos = Math.sin(Math.sqrt(this.swingProgress) * Math.PI * 2);
        this.viewModel.rotation.x = -swingSin * 0.75;
        this.viewModel.rotation.y = swingSin * 0.45;
        this.viewModel.rotation.z = -swingCos * 0.25;
        this.viewModel.position.x = -swingSin * 0.12;
        this.viewModel.position.y = -swingSin * 0.08;
        this.viewModel.position.z = -swingSin * 0.15;

        // Left click (Attack / Mine / Magic)
        if (this.input.mouse.leftClick) {

            if (slot && (slot.item.type === 'wand' || slot.item.type === 'spell')) {
                let castInfo = null;
                if (slot.item.type === 'wand') {
                    if (!slot.item.data) slot.item.data = {};
                    if (!slot.item.data.wand) {
                        let innate = 'BOLT';
                        const sub = (slot.item.subtype || '').toLowerCase();
                        if (sub.includes('fire')) innate = 'BURST';
                        else if (sub.includes('ice')) innate = 'BOLT';
                        else if (sub.includes('nature')) innate = 'HEAL';
                        else if (sub.includes('lightning') || sub.includes('thunder') || sub.includes('master')) innate = 'THUNDER';
                        else if (sub.includes('void')) innate = 'VOID';
                        else if (sub.includes('meteor')) innate = 'METEOR';
                        else if (sub.includes('earth')) innate = 'EARTH';
                        else if (sub.includes('wind')) innate = 'WIND';
                        const slots = sub.includes('master') ? 6 : (sub.includes('meteor') ? 5 : 4);
                        slot.item.data.wand = new Wand(slot.item.name || 'Wand', slots, innate);
                    }
                    castInfo = slot.item.data.wand.castCombined(this.player);
                } else if (slot.item.type === 'spell') {
                    let spellObj = (slot.item.data && slot.item.data.spell) ? slot.item.data.spell : null;
                    if (!spellObj) {
                        const spellKey = (slot.item.subtype || 'BOLT').toUpperCase();
                        spellObj = new Spell(SPELL_TYPES[spellKey] ? spellKey : 'BOLT');
                    }
                    const stats = spellObj.getCalculatedStats();
                    if (this.player.isCreative || this.player.useMana(stats.manaCost)) {
                        castInfo = { spell: spellObj, stats: stats };
                    }
                }

                if (castInfo) {
                    if (castInfo.stats.element === 'HEAL') {
                        this.player.health = Math.min(this.player.maxHealth, this.player.health + Math.abs(castInfo.stats.damage));
                    }
                    this.particles.emit(eyePos, 'magic', 12, castInfo.spell.color || 0x88ccff);
                    if (this.audio && this.audio.playCast) this.audio.playCast(castInfo.stats.element, eyePos);
                    for (let i = 0; i < castInfo.stats.count; i++) {
                        let projDir = lookDir.clone();
                        if (castInfo.stats.count > 1) {
                            projDir.x += (Math.random() - 0.5) * 0.2;
                            projDir.y += (Math.random() - 0.5) * 0.2;
                            projDir.z += (Math.random() - 0.5) * 0.2;
                            projDir.normalize();
                        }
                        const proj = new SpellProjectile(eyePos, projDir, castInfo.stats, castInfo.spell.color);
                        proj.spell = castInfo.spell;
                        this.projectileManager.add(proj);
                    }
                }
                this.input.mouse.leftClick = false; // single cast
            } else if (hit.hit && (() => {
                const bx = hit.blockPos.x, by = hit.blockPos.y, bz = hit.blockPos.z;
                const isF = (b) => b === BLOCKS.FIRE || b === BLOCKS.SOUL_FIRE || (window.BLOCKS && (b === window.BLOCKS.FIRE || b === window.BLOCKS.SOUL_FIRE));
                let extinguished = false;
                if (isF(hit.blockType)) {
                    this.world.setBlock(bx, by, bz, BLOCKS.AIR);
                    this.extinguishBurningBlock(bx, by, bz);
                    this.extinguishBurningBlock(bx, by - 1, bz);
                    extinguished = true;
                } else if (hit.face && isF(this.world.getBlock(bx + hit.face.x, by + hit.face.y, bz + hit.face.z))) {
                    this.world.setBlock(bx + hit.face.x, by + hit.face.y, bz + hit.face.z, BLOCKS.AIR);
                    this.extinguishBurningBlock(bx, by, bz);
                    extinguished = true;
                } else if (isF(this.world.getBlock(bx, by + 1, bz))) {
                    this.world.setBlock(bx, by + 1, bz, BLOCKS.AIR);
                    this.extinguishBurningBlock(bx, by, bz);
                    extinguished = true;
                } else if (this.burningBlocks && this.burningBlocks.has(`${bx},${by},${bz}`)) {
                    this.extinguishBurningBlock(bx, by, bz);
                    extinguished = true;
                }
                if (extinguished) {
                    if (this.audio && this.audio.playFizz) this.audio.playFizz();
                    this.particles.emit({ x: bx + 0.5, y: by + 0.5, z: bz + 0.5 }, 'smoke', 10, 0x888888);
                    this.breakTimer = 0;
                    this.miningOverlay.visible = false;
                    this.input.mouse.leftClick = false;
                    return true;
                }
                return false;
            })()) {
                // Handled in condition above
            } else if (entityHit.hit && this.breakTimer === 0) { // Attack entity
                let damage = 5; // Unarmed base damage
                let appliedDir = lookDir.clone();
                if (slot && slot.item.type === 'equipment' && slot.item.data.equipData && slot.item.data.equipData.damage) {
                    damage = slot.item.data.equipData.damage;
                    const sub = slot.item.subtype || '';
                    if (sub.includes('ruby')) {
                        entityHit.mob.burnTimer = 4.5;
                        this.particles.emit(entityHit.mob.position, 'fire', 8, 0xff4400);
                    } else if (sub.includes('sapphire')) {
                        if (entityHit.mob.freezeTimer !== undefined) entityHit.mob.freezeTimer = 3.5;
                        this.particles.emit(entityHit.mob.position, 'magic', 8, 0x66ccff);
                    } else if (sub.includes('gravitite')) {
                        appliedDir.y += 0.8;
                        appliedDir.multiplyScalar(2.0);
                        this.particles.emit(entityHit.mob.position, 'magic', 10, 0xcc66ff);
                    } else if (sub.includes('netherite')) {
                        appliedDir.multiplyScalar(1.6);
                    }
                } else if (slot && slot.item.type === 'wand') {
                    damage = 10;
                }
                entityHit.mob.takeDamage(damage, appliedDir);
                this.audio.playHit();

                this.particles.emit(entityHit.mob.position, 'blood', 5, 0xff0000);
                this.input.mouse.leftClick = false; // single attack per click
                this.breakTimer = 0.5; // attack cooldown reuse breakTimer
            } else if (hit.hit && this.breakTimer >= 0) { // Mine block
                this.breakTimer += dt;

                // Breaking particles (cracks)
                if (Math.random() < 0.2) this.particles.emit(hit.position, 'block_break', 1, 0x555555);

                const blockProps = getBlockProperties(hit.blockType);
                
                let mineMult = 1.0;
                if (slot && slot.item.type === 'equipment' && slot.item.data.equipData) {
                    const eq = slot.item.data.equipData;
                    if (eq.mineSpeed) mineMult = eq.mineSpeed;
                    if (blockProps.flammable && eq.chopSpeed) mineMult = Math.max(mineMult, eq.chopSpeed);
                    if (eq.digSpeed && (blockProps.isDirt || hit.blockType === BLOCKS.DIRT || hit.blockType === BLOCKS.GRASS || hit.blockType === BLOCKS.SAND || hit.blockType === BLOCKS.SOUL_SAND || hit.blockType === BLOCKS.SOUL_SOIL)) {
                        mineMult = Math.max(mineMult, eq.digSpeed);
                    }
                }
                
                const breakTime = this.input.creativeMode ? 0.001 : (((blockProps.health || 1) * 0.1) / mineMult);
                
                // Track mining position: if target changes, reset progress
                if (!this.lastMiningPos || this.lastMiningPos.x !== hit.blockPos.x || this.lastMiningPos.y !== hit.blockPos.y || this.lastMiningPos.z !== hit.blockPos.z) {
                    this.breakTimer = 0;
                    this.lastMiningPos = { x: hit.blockPos.x, y: hit.blockPos.y, z: hit.blockPos.z };
                }

                const stage = Math.min(9, Math.max(0, Math.floor((this.breakTimer / breakTime) * 10)));
                const isSmall = blockProps.isCross || hit.blockType === BLOCKS.TORCH || hit.blockType === BLOCKS.DEAD_BUSH || hit.blockType === BLOCKS.MUSHROOM_STEM;
                const size = isSmall ? 0.4 : 1.004;

                this.miningOverlay.visible = true;
                this.miningOverlay.scale.set(size, size, size);
                this.miningOverlay.position.set(hit.blockPos.x + 0.5, hit.blockPos.y + (isSmall ? 0.2 : 0.5), hit.blockPos.z + 0.5);
                if (this.destroyTextures && this.destroyTextures[stage] && this.miningOverlay.material.map !== this.destroyTextures[stage]) {
                    this.miningOverlay.material.map = this.destroyTextures[stage];
                    this.miningOverlay.material.color.setHex(0xffffff);
                    this.miningOverlay.material.needsUpdate = true;
                }

                if (this.breakTimer >= breakTime) {
                    const blockType = this.world.getBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    const props = getBlockProperties(blockType);
                    const replaceType = (props && props.isWaterlogged) ? BLOCKS.WATER : BLOCKS.AIR;
                    // The setBlock call will trigger onBlockDestroyed which spawns the item
                    this.world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, replaceType);
                    if (this.player && !this.player.isCreative) {
                        this.player.exhaustion = (this.player.exhaustion || 0) + 0.005;
                    }
                    
                    if (blockType === BLOCKS.TORCH || blockType === BLOCKS.GLOWSTONE || blockType === BLOCKS.LANTERN || blockType === BLOCKS.SOUL_LANTERN) this.torchSystem.removeTorch(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    if (blockType === BLOCKS.TALL_FERN) {
                        if (this.world.getBlock(hit.blockPos.x, hit.blockPos.y + 1, hit.blockPos.z) === BLOCKS.TALL_FERN_TOP) {
                            this.world.setBlock(hit.blockPos.x, hit.blockPos.y + 1, hit.blockPos.z, BLOCKS.AIR);
                        }
                    } else if (blockType === BLOCKS.TALL_FERN_TOP) {
                        if (this.world.getBlock(hit.blockPos.x, hit.blockPos.y - 1, hit.blockPos.z) === BLOCKS.TALL_FERN) {
                            this.world.setBlock(hit.blockPos.x, hit.blockPos.y - 1, hit.blockPos.z, BLOCKS.AIR);
                        }
                    } else if (blockType === BLOCKS.KELP || blockType === BLOCKS.KELP_PLANT) {
                        this.world.checkAdjacentSupports(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    }
                    
                    this.audio.playBreak(blockType);
                    this.breakTimer = 0;
                    this.lastMiningPos = null;
                    this.miningOverlay.visible = false;
                }
            }
        } else {
            this.breakTimer = 0;
            this.lastMiningPos = null;
            this.miningOverlay.visible = false;
        }

        // Hover Outline
        if (hit.hit && !entityHit.hit) {
            const props = getBlockProperties(hit.blockType);
            if (props.isLiquid) {
                this.blockOutline.visible = false;
            } else {
                const isSmall = props.isCross || hit.blockType === BLOCKS.TORCH || hit.blockType === BLOCKS.DEAD_BUSH || hit.blockType === BLOCKS.MUSHROOM_STEM;
                const size = isSmall ? 0.4 : 1.02;

                this.blockOutline.geometry.dispose();
                this.blockOutline.geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size));

                if (isSmall) {
                    this.blockOutline.position.set(hit.blockPos.x + 0.5, hit.blockPos.y + 0.2, hit.blockPos.z + 0.5);
                } else {
                    this.blockOutline.position.set(hit.blockPos.x + 0.5, hit.blockPos.y + 0.5, hit.blockPos.z + 0.5);
                }
                this.blockOutline.visible = true;
            }
        } else {
            this.blockOutline.visible = false;
        }

        // Middle click (Pick-block in Creative: gives 64 of targeted block)
        if (this.input.mouse.middleClick) {
            this.input.mouse.middleClick = false;
            if (this.player.isCreative && hit && hit.hit && hit.blockType) {
                let targetType = hit.blockType;
                if (targetType === BLOCKS.BED_HEAD) targetType = BLOCKS.BED;
                else if (targetType === BLOCKS.TALL_FERN_TOP) targetType = BLOCKS.TALL_FERN;
                else if (targetType === BLOCKS.DUNGEON_DOOR_TOP) targetType = BLOCKS.DUNGEON_DOOR;
                else if (targetType === BLOCKS.KELP_PLANT) targetType = BLOCKS.KELP;

                const blockName = getBlockName(targetType) || 'Block';

                // Check if already in hotbar (slots 0..8)
                let existingSlot = -1;
                for (let i = 0; i < 9; i++) {
                    const s = this.player.inventory.slots[i];
                    if (s && s.item && s.item.type === 'block' && s.item.subtype === targetType) {
                        existingSlot = i;
                        break;
                    }
                }

                if (existingSlot !== -1) {
                    this.player.selectedSlot = existingSlot;
                    this.player.inventory.slots[existingSlot].count = 64;
                } else {
                    const activeSlot = this.player.selectedSlot;
                    this.player.inventory.slots[activeSlot] = {
                        item: Item.blockItem(targetType, blockName),
                        count: 64
                    };
                }
                if (this.audio && this.audio.playClick) this.audio.playClick();
                if (this.ui && this.ui.updateHotbar) this.ui.updateHotbar(this.player);
            }
        }

        // Bow Charging and Shooting
        const curHeldSlot = this.player ? this.player.inventory.slots[this.player.selectedSlot] : null;
        const isHoldingBow = curHeldSlot && curHeldSlot.item && curHeldSlot.item.subtype === 'bow';
        if (isHoldingBow) {
            const hasArrow = this.player.isCreative || this.input.creativeMode || 
                (this.player.inventory.slots && this.player.inventory.slots.some(s => s && s.item && s.item.subtype === 'arrow'));

            if (this.input.mouse.rightDown) {
                if (!hasArrow) {
                    if (this.input.mouse.rightClick) {
                        this.showToast('You have no arrows!', 2000);
                        if (this.audio && this.audio.playClick) this.audio.playClick();
                        this.input.mouse.rightClick = false;
                    }
                    this.bowCharge = 0;
                } else {
                    this.bowCharge = Math.min(1.0, (this.bowCharge || 0) + dt / 1.0);
                    // Visual pull animation: draw back bow viewmodel
                    if (this.viewModel) {
                        this.viewModel.position.z = -this.bowCharge * 0.18;
                        this.viewModel.position.x = -this.bowCharge * 0.08;
                        this.viewModel.rotation.y = this.bowCharge * 0.25;
                    }
                    this.input.mouse.rightClick = false; // consume right click so it doesn't place blocks
                }
            } else {
                if (this.bowCharge && this.bowCharge > 0.1) {
                    this.shootArrow(this.bowCharge);
                }
                this.bowCharge = 0;
            }
        } else {
            this.bowCharge = 0;
        }

        // Right click actions
        if (this.input.mouse.rightClick) {
            const slot = this.player.inventory.slots[this.player.selectedSlot];

            // Ender Pearl throw
            if (slot && slot.item.subtype === 'ender_pearl') {
                const cam = this.engine.camera;
                const dir = new THREE.Vector3();
                cam.getWorldDirection(dir);
                const pearlCanvas = generateItemTexture('material', 'ender_pearl');
                const pearlTex = new THREE.CanvasTexture(pearlCanvas);
                pearlTex.magFilter = THREE.NearestFilter;
                pearlTex.minFilter = THREE.NearestFilter;
                pearlTex.colorSpace = THREE.SRGBColorSpace;
                const pearlMat = new THREE.SpriteMaterial({ map: pearlTex, transparent: true });
                const pearlMesh = new THREE.Sprite(pearlMat);
                pearlMesh.scale.set(0.35, 0.35, 0.35);
                pearlMesh.position.copy(this.player.position).add(new THREE.Vector3(0, 1.5, 0));
                this.engine.scene.add(pearlMesh);
                this.thrownPearls.push({
                    mesh: pearlMesh,
                    velocity: dir.clone().multiplyScalar(28).add(new THREE.Vector3(0, 6, 0)),
                    age: 0
                });
                // Consume one pearl
                slot.count--;
                if (slot.count <= 0) this.player.inventory.slots[this.player.selectedSlot] = null;
                if (this.audio && this.audio.playEnderPearlThrow) {
                    this.audio.playEnderPearlThrow();
                } else if (this.audio && this.audio.playHit) {
                    this.audio.playHit();
                }
                this.input.mouse.rightClick = false;
                return;
            }

            if (slot && slot.item.subtype === 'flint_and_steel' && hit.hit) {
                const bx = hit.blockPos.x, by = hit.blockPos.y, bz = hit.blockPos.z;
                const clickedBlock = hit.blockType;
                const key = `${bx},${by},${bz}`;
                const topBlock = this.world.getBlock(bx, by + 1, bz);

                // 1. Extinguish: if clicked directly on fire or soul fire
                if (clickedBlock === window.BLOCKS.FIRE || clickedBlock === window.BLOCKS.SOUL_FIRE) {
                    this.world.setBlock(bx, by, bz, window.BLOCKS.AIR);
                    this.extinguishBurningBlock(bx, by - 1, bz);
                    if (this.audio && this.audio.playFizz) this.audio.playFizz();
                    this.particles.emit({x: bx + 0.5, y: by + 0.5, z: bz + 0.5}, 'smoke', 15, 0x888888);
                    this.input.mouse.rightClick = false;
                    return;
                }

                // Extinguish: if clicking a block that is burning or has fire on top/adjacent
                if (this.burningBlocks.has(key) || topBlock === window.BLOCKS.FIRE || topBlock === window.BLOCKS.SOUL_FIRE) {
                    if (topBlock === window.BLOCKS.FIRE || topBlock === window.BLOCKS.SOUL_FIRE) {
                        this.world.setBlock(bx, by + 1, bz, window.BLOCKS.AIR);
                    }
                    const dirs = [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]];
                    for (const [dx, dy, dz] of dirs) {
                        const adj = this.world.getBlock(bx + dx, by + dy, bz + dz);
                        if (adj === window.BLOCKS.FIRE || adj === window.BLOCKS.SOUL_FIRE) {
                            this.world.setBlock(bx + dx, by + dy, bz + dz, window.BLOCKS.AIR);
                        }
                    }
                    this.extinguishBurningBlock(bx, by, bz);
                    if (this.audio && this.audio.playFizz) this.audio.playFizz();
                    this.particles.emit({x: bx + 0.5, y: by + 1.2, z: bz + 0.5}, 'smoke', 15, 0x888888);
                    this.input.mouse.rightClick = false;
                    return;
                }

                // If face adjacent block is fire, clicking face also puts it out
                if (hit.face) {
                    const nx = bx + hit.face.x;
                    const ny = by + hit.face.y;
                    const nz = bz + hit.face.z;
                    const faceBlock = this.world.getBlock(nx, ny, nz);
                    if (faceBlock === window.BLOCKS.FIRE || faceBlock === window.BLOCKS.SOUL_FIRE) {
                        this.world.setBlock(nx, ny, nz, window.BLOCKS.AIR);
                        this.extinguishBurningBlock(bx, by, bz);
                        if (this.audio && this.audio.playFizz) this.audio.playFizz();
                        this.particles.emit({x: nx + 0.5, y: ny + 0.5, z: nz + 0.5}, 'smoke', 15, 0x888888);
                        this.input.mouse.rightClick = false;
                        return;
                    }
                }

                // 2. Portal lighting (Obsidian / Glowstone only)
                let portalLit = false;
                if (hit.blockType === window.BLOCKS.OBSIDIAN || hit.blockType === window.BLOCKS.GLOWSTONE || hit.blockType === window.BLOCKS.PORTAL_FRAME) {
                    portalLit = this.tryLightPortal(bx, by, bz);
                    if (portalLit) this.audio.playHit();
                }

                // 3. TNT ignition & Ground/Block fire
                if (!portalLit) {
                    if (hit.blockType === window.BLOCKS.TNT) {
                        this.igniteTNT(bx, by, bz);
                        this.audio.playFizz();
                    } else if (hit.face) {
                        const nx = bx + hit.face.x;
                        const ny = by + hit.face.y;
                        const nz = bz + hit.face.z;
                        const faceBlock = this.world.getBlock(nx, ny, nz);
                        const blockUnderFace = this.world.getBlock(nx, ny - 1, nz);

                        // Soul Fire on Soul Sand or Soul Soil
                        const isSoul = (clickedBlock === window.BLOCKS.SOUL_SAND || clickedBlock === window.BLOCKS.SOUL_SOIL ||
                                        blockUnderFace === window.BLOCKS.SOUL_SAND || blockUnderFace === window.BLOCKS.SOUL_SOIL);
                        const fireType = isSoul ? window.BLOCKS.SOUL_FIRE : window.BLOCKS.FIRE;

                        // Place fire on the face-adjacent air block
                        if (faceBlock === window.BLOCKS.AIR &&
                            blockUnderFace !== window.BLOCKS.WATER &&
                            blockUnderFace !== window.BLOCKS.SWAMP_WATER) {
                            this.world.setBlock(nx, ny, nz, fireType);
                            this.audio.playHit();
                            this.particles.emit({x: nx + 0.5, y: ny + 0.5, z: nz + 0.5}, isSoul ? 'portal' : 'fire', 8, isSoul ? 0x00ffff : 0xff5500);
                        }

                        // If clicked block is combustible (wood, planks, leaves, etc.), ignite it with 3D burning fire overlay!
                        const clickedProps = window.getBlockProperties ? window.getBlockProperties(clickedBlock) : null;
                        const isFlammable = clickedProps && clickedProps.flammable;
                        if (isFlammable) {
                            const topB = this.world.getBlock(bx, by + 1, bz);
                            if (topB === window.BLOCKS.AIR) {
                                this.world.setBlock(bx, by + 1, bz, fireType);
                            }
                            this.igniteBurningBlock(bx, by, bz, isSoul);
                            this.audio.playHit();
                            this.particles.emit({x: bx + 0.5, y: by + 1.2, z: bz + 0.5}, isSoul ? 'portal' : 'fire', 12, isSoul ? 0x00ffff : 0xff5500);
                        }
                    }
                }
                this.input.mouse.rightClick = false;
                return;
            }

            if (hit.hit && hit.blockType === window.BLOCKS.CHEST_BLOCK) {
                // Open Chest
                this.audio.playChestOpen();
                const key = `${hit.blockPos.x},${hit.blockPos.y},${hit.blockPos.z}`;
                if (!this.chestInventories.has(key)) {
                    this._addChest(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, true);
                }
                const visual = this.chestVisuals.get(key);
                if (visual) visual.isOpen = true;
                
                this.ui.toggleChest(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, this.chestInventories.get(key), () => {
                    // On close callback
                    if (visual) visual.isOpen = false;
                    this.input.requestPointerLock();
                });
                document.exitPointerLock();
                this.input.mouse.rightClick = false;
                return;
            }

            if (hit.hit && hit.blockType === window.BLOCKS.CRAFTING_TABLE) {
                // Open Crafting Table
                this.audio.playClick();
                this.ui.toggleCraftingTable();
                document.exitPointerLock();
                this.input.mouse.rightClick = false;
                return;
            }

            if (hit.hit && hit.blockType === window.BLOCKS.FURNACE) {
                // Open Furnace
                this.audio.playClick(); 
                const key = `${hit.blockPos.x},${hit.blockPos.y},${hit.blockPos.z}`;
                if (!this.furnaces.has(key)) {
                    this._addFurnace(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                }
                this.ui.toggleFurnace(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, this.furnaces.get(key), () => {
                    this.input.requestPointerLock();
                });
                document.exitPointerLock();
                this.input.mouse.rightClick = false;
                return;
            }

            if (hit.hit && (hit.blockType === window.BLOCKS.DUNGEON_DOOR || hit.blockType === window.BLOCKS.DUNGEON_DOOR_TOP)) {
                const key = `${hit.blockPos.x},${hit.blockPos.y},${hit.blockPos.z}`;
                const keyLower = `${hit.blockPos.x},${hit.blockPos.y - 1},${hit.blockPos.z}`;
                
                let door = this.doors.get(key);
                if (!door) door = this.doors.get(keyLower);
                
                if (door) {
                    door.isOpen = !door.isOpen;
                    if (door.isOpen) this.audio.playDoorOpen(hit.blockPos);
                    else this.audio.playDoorClose(hit.blockPos);
                    const targetRotation = door.isOpen ? (door.baseRotationY === 0 ? -Math.PI / 2 : 0) : door.baseRotationY;
                    door.mesh.rotation.y = targetRotation;
                }
                
                this.input.mouse.rightClick = false;
                return;
            }

            const hitProps = hit.hit ? getBlockProperties(hit.blockType) : null;
            if (hit.hit && hitProps && hitProps.isFenceGate) {
                const key = `${hit.blockPos.x},${hit.blockPos.y},${hit.blockPos.z}`;
                let gate = this.fenceGates.get(key);
                if (gate) {
                    gate.isOpen = !gate.isOpen;
                    if (gate.isOpen) this.audio.playDoorOpen(hit.blockPos);
                    else this.audio.playDoorClose(hit.blockPos);
                    gate.updateVisuals();
                }
                this.input.mouse.rightClick = false;
                return;
            }

            if (hit.hit) {
                const hitProps = getBlockProperties(hit.blockType);
                if (hitProps && (hitProps.isBed || hitProps.isBedHead)) {
                    this.interactBed(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, hit.blockType);
                    this.input.mouse.rightClick = false;
                    return;
                }
            }

            if (hit.hit && hit.blockType === window.BLOCKS.BOOKSHELF) {
                // Restore Mana
                if (this.player.mana < this.player.maxMana) {
                    this.player.mana += 20;
                    if (this.player.mana > this.player.maxMana) this.player.mana = this.player.maxMana;
                    this.audio.playMC('random/levelup', 0.6); 
                    
                    // Consume bookshelf? Or let it be reusable? Let's make it reusable but with a tiny cooldown maybe? 
                    // No cooldown mentioned. 
                }
                this.input.mouse.rightClick = false;
                return;
            }
            if (slot && slot.item.type === 'wand') {
                if (this.player.activeSpellIndex === undefined) this.player.activeSpellIndex = 0;
                this.player.activeSpellIndex = (this.player.activeSpellIndex + 1) % slot.item.data.wand.maxSlots;
                this.audio.playClick();
                this.input.mouse.rightClick = false;
                return;
            }
            if (slot && slot.item && slot.item.subtype === 'ender_pearl') {
                this.isSwinging = true;
                this.swingProgress = 0;
                if (!this.input.creativeMode) {
                    slot.count--;
                    if (slot.count <= 0) {
                        this.player.inventory.slots[this.player.selectedSlot] = null;
                    }
                    this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    if (this.ui.isOpen) {
                        this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    }
                }
                if (this.audio && this.audio.playBow) this.audio.playBow();
                
                const eyePos = this.player.getEyePosition();
                const lookDir = this.player.getLookDirection();
                const pearlGeo = new THREE.DodecahedronGeometry(0.2);
                const pearlMat = new THREE.MeshStandardMaterial({
                    color: 0x18443e,
                    emissive: 0x09302b,
                    roughness: 0.3
                });
                const pearlMesh = new THREE.Mesh(pearlGeo, pearlMat);
                pearlMesh.position.copy(eyePos);
                this.engine.scene.add(pearlMesh);
                
                this.thrownEnderPearls.push({
                    mesh: pearlMesh,
                    position: eyePos.clone(),
                    velocity: lookDir.clone().multiplyScalar(24),
                    life: 0
                });
                
                this.input.mouse.rightClick = false;
                return;
            } else if (slot && slot.item && slot.item.subtype === 'eye_of_ender') {
                this.isSwinging = true;
                this.swingProgress = 0;
                
                const frameId = window.BLOCKS.PORTAL_FRAME || 26;
                const frameEyeId = window.BLOCKS.END_PORTAL_FRAME_EYE || 326;
                if (hit.hit && hit.blockType === frameId) {
                    // Place eye into frame without breaking or resetting orientation data
                    const curData = this.world.getData(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    this.world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, frameEyeId, curData);
                    this.particles.emit(new THREE.Vector3(hit.blockPos.x + 0.5, hit.blockPos.y + 0.8, hit.blockPos.z + 0.5), 'spell', 15, 0x11ffaa);
                    if (this.audio && this.audio.playEyePlace) this.audio.playEyePlace(hit.blockPos);
                    else if (this.audio && this.audio.playClick) this.audio.playClick();
                    
                    if (!this.input.creativeMode) {
                        slot.count--;
                        if (slot.count <= 0) {
                            this.player.inventory.slots[this.player.selectedSlot] = null;
                        }
                        this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        if (this.ui.isOpen) {
                            this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        }
                    }
                    
                    this.checkAndActivateEndPortal(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    this.input.mouse.rightClick = false;
                    return;
                } else if (hit.hit && hit.blockType === frameEyeId) {
                    // Frame already has an eye — do nothing, don't waste eye or break frame!
                    this.input.mouse.rightClick = false;
                    return;
                } else {
                    // Throw Eye of Ender towards Stronghold
                    if (!this.input.creativeMode) {
                        slot.count--;
                        if (slot.count <= 0) {
                            this.player.inventory.slots[this.player.selectedSlot] = null;
                        }
                        this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        if (this.ui.isOpen) {
                            this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        }
                    }
                    if (this.audio && this.audio.playEnderEyeLaunch) this.audio.playEnderEyeLaunch(this.player.position);
                    else if (this.audio && this.audio.playBow) this.audio.playBow();
                    
                    const sh = getClosestStrongholdPosition(this.player.position.x, this.player.position.z, this.currentSeed);
                    const dist = Math.round(Math.hypot(sh.x - this.player.position.x, sh.z - this.player.position.z));
                    this.showToast(`Closest Stronghold located at X: ${sh.x}, Z: ${sh.z} (~${dist} blocks away)`, 4500);
                    
                    const eyePos = this.player.getEyePosition();
                    const dir = new THREE.Vector3(sh.x - eyePos.x, 0, sh.z - eyePos.z).normalize();
                    dir.y = 0.45;
                    dir.normalize();
                    
                    const eyeGeo = new THREE.SphereGeometry(0.22, 8, 8);
                    const eyeMat = new THREE.MeshStandardMaterial({
                        color: 0x1be3b1,
                        emissive: 0x0a664e,
                        roughness: 0.2
                    });
                    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
                    eyeMesh.position.copy(eyePos);
                    this.engine.scene.add(eyeMesh);
                    
                    this.flyingEyesOfEnder.push({
                        mesh: eyeMesh,
                        position: eyePos.clone(),
                        velocity: dir.multiplyScalar(14),
                        life: 0,
                        maxLife: 3.2
                    });
                    
                    this.input.mouse.rightClick = false;
                    return;
                }
            } else if (slot && slot.item && (slot.item.subtype === 'bucket' || slot.item.subtype === 'water_bucket' || slot.item.subtype === 'lava_bucket') && hit.hit) {
                // Bucket logic
                const bucketType = slot.item.subtype;
                if (bucketType === 'bucket') {
                    // Empty bucket - try to pick up liquid source block
                    const targetBlock = hit.blockType;
                    if (targetBlock === BLOCKS.WATER || targetBlock === BLOCKS.SWAMP_WATER || targetBlock === BLOCKS.LAVA) {
                        const isLava = (targetBlock === BLOCKS.LAVA);
                        const data = this.world.getData(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                        if (data === 0 || !data) {
                            this.world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, BLOCKS.AIR);
                            const newSubtype = isLava ? 'lava_bucket' : 'water_bucket';
                            const newName = isLava ? 'Lava Bucket' : 'Water Bucket';
                            const newItem = { type: 'equipment', subtype: newSubtype, name: newName, stackable: false, maxStack: 1, data: {} };
                            if (!this.input.creativeMode) {
                                if (slot.count > 1) {
                                    slot.count--;
                                    if (!this.player.inventory.addItem(newItem, 1)) {
                                        this.entityManager.spawnItem(newItem, 1, this.player.getEyePosition());
                                    }
                                } else {
                                    slot.item = newItem;
                                }
                            }
                            if (isLava) {
                                this.audio.playFizz(hit.blockPos);
                            } else {
                                this.audio.playWaterSplash(hit.blockPos);
                            }
                            this.isSwinging = true;
                            this.swingProgress = 0;
                            this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                            if (this.ui.isOpen) {
                                this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                            }
                        }
                    }
                } else if (bucketType === 'water_bucket' || bucketType === 'lava_bucket') {
                    const isLava = (bucketType === 'lava_bucket');
                    const hitProps = getBlockProperties(hit.blockType);
                    let placePos;
                    if (!hitProps.solid || hitProps.isCross || hit.blockType === BLOCKS.SNOW) {
                        placePos = { x: hit.blockPos.x, y: hit.blockPos.y, z: hit.blockPos.z };
                    } else {
                        placePos = { x: hit.blockPos.x + hit.normal.x, y: hit.blockPos.y + hit.normal.y, z: hit.blockPos.z + hit.normal.z };
                    }
                    const curBlock = this.world.getBlock(placePos.x, placePos.y, placePos.z);
                    const curProps = getBlockProperties(curBlock);
                    const isReplaceable = curBlock === BLOCKS.AIR || !curProps.solid || curProps.isCross || curBlock === BLOCKS.SNOW || curProps.isLiquid;

                    if (isReplaceable) {
                        if (!isLava) {
                            // Placing water
                            if (curBlock === BLOCKS.LAVA) {
                                const lavaData = this.world.getData(placePos.x, placePos.y, placePos.z);
                                if (lavaData === 0 || !lavaData) {
                                    this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.OBSIDIAN);
                                } else {
                                    this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.COBBLESTONE);
                                }
                            } else {
                                this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.WATER);
                                this.world.setData(placePos.x, placePos.y, placePos.z, 0); // Source block
                                this.world.queueLiquidUpdate(placePos.x, placePos.y, placePos.z);
                                this.world.tickFluids();
                            }
                            this.audio.playWaterSplash(placePos);
                        } else {
                            // Placing lava
                            if (curBlock === BLOCKS.WATER || curBlock === BLOCKS.SWAMP_WATER) {
                                this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.STONE);
                            } else {
                                this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.LAVA);
                                this.world.setData(placePos.x, placePos.y, placePos.z, 0); // Source block
                                if (this.torchSystem) this.torchSystem.addTorch(placePos.x, placePos.y, placePos.z);
                                this.world.queueLiquidUpdate(placePos.x, placePos.y, placePos.z);
                                this.world.tickFluids();
                            }
                            this.audio.playFizz(placePos);
                        }

                        if (!this.input.creativeMode) {
                            slot.item = { type: 'equipment', subtype: 'bucket', name: 'Bucket', stackable: true, maxStack: 16, data: {} };
                        }
                        this.isSwinging = true;
                        this.swingProgress = 0;
                        this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        if (this.ui.isOpen) {
                            this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        }
                    }
                }
                this.input.mouse.rightClick = false;
                return;
            }

            // Hoe Tilling -> Farmland
            const subtypeStr = (slot && slot.item && typeof slot.item.subtype === 'string') ? slot.item.subtype : '';
            const isHoe = slot && slot.item && (
                subtypeStr.startsWith('hoe_') ||
                subtypeStr.endsWith('_hoe') ||
                (slot.item.data && slot.item.data.equipData && slot.item.data.equipData.isHoe)
            );
            if (isHoe && hit.hit) {
                const targetBlock = hit.blockType;
                const canTill = (targetBlock === BLOCKS.GRASS || targetBlock === BLOCKS.DIRT || targetBlock === BLOCKS.COARSE_DIRT);
                const bx = hit.blockPos.x, by = hit.blockPos.y, bz = hit.blockPos.z;
                const aboveBlock = this.world.getBlock(bx, by + 1, bz);
                const aboveProps = getBlockProperties(aboveBlock);
                if (canTill && (aboveBlock === BLOCKS.AIR || !aboveProps.solid)) {
                    // Check if water nearby for initial moistness
                    let hasWater = false;
                    for (let dx = -4; dx <= 4; dx++) {
                        for (let dz = -4; dz <= 4; dz++) {
                            for (let dy = -1; dy <= 1; dy++) {
                                const b = this.world.getBlock(bx + dx, by + dy, bz + dz);
                                if (b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER) {
                                    hasWater = true;
                                    break;
                                }
                            }
                            if (hasWater) break;
                        }
                        if (hasWater) break;
                    }
                    const farmlandId = hasWater ? (BLOCKS.FARMLAND_MOIST || 348) : (BLOCKS.FARMLAND || 347);
                    this.world.setBlock(bx, by, bz, farmlandId);
                    if (this.audio && this.audio.playTill) {
                        this.audio.playTill(hit.blockPos);
                    } else if (this.audio && this.audio.playDig) {
                        this.audio.playDig(BLOCKS.DIRT, hit.blockPos);
                    }
                    this.particles.emit({ x: bx + 0.5, y: by + 1.0, z: bz + 0.5 }, 'block_break', 8, 0x795548);

                    // Durability deduction
                    if (!this.input.creativeMode) {
                        if (slot.item.data && slot.item.data.equipData) {
                            const eq = slot.item.data.equipData;
                            if (eq.durability !== undefined) {
                                eq.durability -= 1;
                                if (eq.durability <= 0) {
                                    this.player.inventory.slots[this.player.selectedSlot] = null;
                                    if (this.audio && this.audio.playHit) this.audio.playHit(this.player.position);
                                }
                            }
                        }
                    }
                    this.isSwinging = true;
                    this.swingProgress = 0;
                    this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    if (this.ui.isOpen) {
                        this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    }
                    this.input.mouse.rightClick = false;
                    return;
                }
            }

            // Shovel Flattening -> Dirt Path
            const isShovel = slot && slot.item && (
                subtypeStr.startsWith('shovel_') ||
                subtypeStr.endsWith('_shovel') ||
                (slot.item.data && slot.item.data.equipData && slot.item.data.equipData.isShovel)
            );
            if (isShovel && hit.hit) {
                const targetBlock = hit.blockType;
                const canFlatten = (targetBlock === BLOCKS.GRASS || targetBlock === BLOCKS.DIRT || targetBlock === BLOCKS.COARSE_DIRT || targetBlock === BLOCKS.SWAMP_GRASS || targetBlock === BLOCKS.SAVANNA_GRASS || targetBlock === BLOCKS.PODZOL);
                const bx = hit.blockPos.x, by = hit.blockPos.y, bz = hit.blockPos.z;
                const aboveBlock = this.world.getBlock(bx, by + 1, bz);
                const aboveProps = getBlockProperties(aboveBlock);
                if (canFlatten && (aboveBlock === BLOCKS.AIR || !aboveProps.solid)) {
                    const pathBlockId = (BLOCKS.DIRT_PATH || 383);
                    this.world.setBlock(bx, by, bz, pathBlockId);
                    if (this.audio && this.audio.playDig) {
                        this.audio.playDig(BLOCKS.DIRT, hit.blockPos);
                    }
                    this.particles.emit({ x: bx + 0.5, y: by + 1.0, z: bz + 0.5 }, 'block_break', 8, 0x8b6534);

                    // Durability deduction
                    if (!this.input.creativeMode) {
                        if (slot.item.data && slot.item.data.equipData) {
                            const eq = slot.item.data.equipData;
                            if (eq.durability !== undefined) {
                                eq.durability -= 1;
                                if (eq.durability <= 0) {
                                    this.player.inventory.slots[this.player.selectedSlot] = null;
                                    if (this.audio && this.audio.playHit) this.audio.playHit(this.player.position);
                                }
                            }
                        }
                    }
                    this.isSwinging = true;
                    this.swingProgress = 0;
                    this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    if (this.ui.isOpen) {
                        this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    }
                    this.input.mouse.rightClick = false;
                    return;
                }
            }

            // Crop planting on Farmland
            const SEED_TO_CROP = {
                'wheat_seeds': BLOCKS.WHEAT_0,
                'carrot': BLOCKS.CARROTS_0,
                'potato': BLOCKS.POTATOES_0,
                'beetroot_seeds': BLOCKS.BEETROOTS_0,
                'pumpkin_seeds': BLOCKS.PUMPKIN_STEM,
                'melon_seeds': BLOCKS.MELON_STEM
            };
            if (slot && slot.item && SEED_TO_CROP[slot.item.subtype] !== undefined && hit.hit) {
                const targetBlock = hit.blockType;
                if (targetBlock === BLOCKS.FARMLAND || targetBlock === BLOCKS.FARMLAND_MOIST) {
                    const bx = hit.blockPos.x, by = hit.blockPos.y, bz = hit.blockPos.z;
                    const aboveBlock = this.world.getBlock(bx, by + 1, bz);
                    if (aboveBlock === BLOCKS.AIR) {
                        const cropId = SEED_TO_CROP[slot.item.subtype];
                        this.world.setBlock(bx, by + 1, bz, cropId);
                        this.audio.playPlace(BLOCKS.GRASS, { x: bx, y: by + 1, z: bz });
                        if (!this.input.creativeMode) {
                            slot.count--;
                            if (slot.count <= 0) {
                                this.player.inventory.slots[this.player.selectedSlot] = null;
                            }
                        }
                        this.isSwinging = true;
                        this.swingProgress = 0;
                        this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        if (this.ui.isOpen) {
                            this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        }
                        this.input.mouse.rightClick = false;
                        return;
                    }
                }
            }

            // Bone meal on crops
            if (slot && slot.item && slot.item.subtype === 'bone_meal' && hit.hit) {
                const b = hit.blockType;
                const bx = hit.blockPos.x, by = hit.blockPos.y, bz = hit.blockPos.z;
                let advanced = false;
                let nextCrop = null;

                if (b >= BLOCKS.WHEAT_0 && b < BLOCKS.WHEAT_7) {
                    const inc = Math.floor(2 + Math.random() * 4); // 2-5 stages
                    nextCrop = Math.min(BLOCKS.WHEAT_7, b + inc);
                    advanced = true;
                } else if (b >= BLOCKS.CARROTS_0 && b < BLOCKS.CARROTS_3) {
                    const inc = Math.floor(1 + Math.random() * 3);
                    nextCrop = Math.min(BLOCKS.CARROTS_3, b + inc);
                    advanced = true;
                } else if (b >= BLOCKS.POTATOES_0 && b < BLOCKS.POTATOES_3) {
                    const inc = Math.floor(1 + Math.random() * 3);
                    nextCrop = Math.min(BLOCKS.POTATOES_3, b + inc);
                    advanced = true;
                } else if (b >= BLOCKS.BEETROOTS_0 && b < BLOCKS.BEETROOTS_3) {
                    const inc = Math.floor(1 + Math.random() * 2);
                    nextCrop = Math.min(BLOCKS.BEETROOTS_3, b + inc);
                    advanced = true;
                } else if (b === BLOCKS.PUMPKIN_STEM || b === BLOCKS.MELON_STEM) {
                    // Try to grow fruit immediately on adjacent block
                    const fruitBlock = (b === BLOCKS.PUMPKIN_STEM) ? (BLOCKS.PUMPKIN || 370) : (BLOCKS.MELON || 103);
                    const offsets = [[1,0], [-1,0], [0,1], [0,-1]];
                    for (const [ox, oz] of offsets) {
                        const adjB = this.world.getBlock(bx + ox, by, bz + oz);
                        const belowAdj = this.world.getBlock(bx + ox, by - 1, bz + oz);
                        const pBelow = getBlockProperties(belowAdj);
                        if (adjB === BLOCKS.AIR && pBelow && pBelow.solid) {
                            this.world.setBlock(bx + ox, by, bz + oz, fruitBlock);
                            advanced = true;
                            break;
                        }
                    }
                } else {
                    const hitProps = getBlockProperties(b);
                    if (hitProps && hitProps.isSapling) {
                        // 45% chance to advance/grow sapling immediately into full tree (or 2x2 mega tree)
                        if (Math.random() < 0.45) {
                            growSapling(this.world, bx, by, bz, b, this.particles, this.audio);
                        }
                        advanced = true;
                    }
                }

                if (advanced) {
                    if (nextCrop !== null) {
                        this.world.setBlock(bx, by, bz, nextCrop);
                    }
                    if (this.audio && this.audio.playBoneMeal) {
                        this.audio.playBoneMeal(hit.blockPos);
                    } else if (this.audio && this.audio.playPop) {
                        this.audio.playPop(hit.blockPos);
                    }
                    // Authentic Minecraft happy_villager / bone meal green sparkle particles
                    const greenShades = [0x2ecc71, 0x44dd55, 0x55ff55, 0x88ff66, 0x00ff44];
                    for (let i = 0; i < 16; i++) {
                        const px = bx + 0.1 + Math.random() * 0.8;
                        const py = by + 0.1 + Math.random() * 0.8;
                        const pz = bz + 0.1 + Math.random() * 0.8;
                        const col = greenShades[Math.floor(Math.random() * greenShades.length)];
                        this.particles.emit({ x: px, y: py, z: pz }, 'bonemeal', 1, col);
                    }
                    if (!this.input.creativeMode) {
                        slot.count--;
                        if (slot.count <= 0) {
                            this.player.inventory.slots[this.player.selectedSlot] = null;
                        }
                    }
                    this.isSwinging = true;
                    this.swingProgress = 0;
                    this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    if (this.ui.isOpen) {
                        this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    }
                    this.input.mouse.rightClick = false;
                    return;
                }
            }

            if (slot && slot.item.type === 'block' && hit.hit) {
                // Place block
                const placePos = { x: hit.blockPos.x + hit.normal.x, y: hit.blockPos.y + hit.normal.y, z: hit.blockPos.z + hit.normal.z };
                const curBlock = this.world.getBlock(placePos.x, placePos.y, placePos.z);
                // Prevent placing blocks inside the player's AABB (0.6 wide �- 1.8 tall)
                const placeProps = getBlockProperties(slot.item.subtype);
                const isWaterPlant = placeProps.isWaterlogged || [
                    BLOCKS.SEAGRASS, BLOCKS.KELP, BLOCKS.KELP_PLANT, BLOCKS.RED_KELP, BLOCKS.BROWN_KELP,
                    BLOCKS.TUBE_CORAL, BLOCKS.BRAIN_CORAL, BLOCKS.BUBBLE_CORAL, BLOCKS.FIRE_CORAL, BLOCKS.HORN_CORAL,
                    BLOCKS.SEASHELL_1, BLOCKS.SEASHELL_2, BLOCKS.SEASHELL_3, BLOCKS.ALGAE
                ].includes(slot.item.subtype);

                if (isWaterPlant) {
                    // Water plants can ONLY be placed inside water! Never on dry land / air
                    if (curBlock !== BLOCKS.WATER && curBlock !== BLOCKS.SWAMP_WATER) {
                        this.input.mouse.rightClick = false;
                        return;
                    }
                    const belowType = this.world.getBlock(placePos.x, placePos.y - 1, placePos.z);
                    const belowP = getBlockProperties(belowType);
                    const kelpAllowed = (slot.item.subtype === BLOCKS.KELP && (belowType === BLOCKS.KELP || belowType === BLOCKS.KELP_PLANT));
                    if (!belowP.solid && !kelpAllowed) {
                        this.input.mouse.rightClick = false;
                        return;
                    }
                }

                if (slot.item.subtype === BLOCKS.LILY_PAD) {
                    // Lily pad must be placed on top of water
                    const belowType = this.world.getBlock(placePos.x, placePos.y - 1, placePos.z);
                    if ((belowType !== BLOCKS.WATER && belowType !== BLOCKS.SWAMP_WATER) || curBlock !== BLOCKS.AIR) {
                        this.input.mouse.rightClick = false;
                        return;
                    }
                }
                const _pp = this.player.position;
                const _playerOverlap = (
                    _pp.x - 0.3 < placePos.x + 1 && _pp.x + 0.3 > placePos.x &&
                    _pp.y       < placePos.y + 1 && _pp.y + 1.8  > placePos.y &&
                    _pp.z - 0.3 < placePos.z + 1 && _pp.z + 0.3  > placePos.z
                );

                if (!_playerOverlap && (curBlock === BLOCKS.AIR || curBlock === BLOCKS.WATER || curBlock === BLOCKS.SWAMP_WATER || curBlock === BLOCKS.LAVA)) {
                    if (placeProps.isBed) {
                        const forward = new THREE.Vector3();
                        this.engine.camera.getWorldDirection(forward);
                        let dir = 0;
                        let headPos = { x: placePos.x, y: placePos.y, z: placePos.z };
                        if (Math.abs(forward.x) > Math.abs(forward.z)) {
                            if (forward.x > 0) {
                                dir = 1; // East (+X)
                                headPos.x += 1;
                            } else {
                                dir = 3; // West (-X)
                                headPos.x -= 1;
                            }
                        } else {
                            if (forward.z > 0) {
                                dir = 2; // South (+Z)
                                headPos.z += 1;
                            } else {
                                dir = 0; // North (-Z)
                                headPos.z -= 1;
                            }
                        }

                        const curBlockHead = this.world.getBlock(headPos.x, headPos.y, headPos.z);
                        const canReplace = (b) => b === BLOCKS.AIR || b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER || b === BLOCKS.LAVA;

                        if (!canReplace(curBlock) || !canReplace(curBlockHead)) {
                            this.input.mouse.rightClick = false;
                            return;
                        }

                        const overlapHead = (
                            _pp.x - 0.3 < headPos.x + 1 && _pp.x + 0.3 > headPos.x &&
                            _pp.y       < headPos.y + 0.6 && _pp.y + 1.8  > headPos.y &&
                            _pp.z - 0.3 < headPos.z + 1 && _pp.z + 0.3  > headPos.z
                        );
                        if (overlapHead) {
                            this.input.mouse.rightClick = false;
                            return;
                        }

                        this._addBed(placePos.x, placePos.y, placePos.z, headPos.x, headPos.y, headPos.z, slot.item.subtype, dir);
                        this.world.setBlock(placePos.x, placePos.y, placePos.z, slot.item.subtype, dir);
                        this.world.setBlock(headPos.x, headPos.y, headPos.z, BLOCKS.BED_HEAD, dir);
                        this.audio.playPlace(BLOCKS.OAK_PLANKS, placePos);

                        if (!this.input.creativeMode) {
                            slot.count--;
                            if (slot.count <= 0) {
                                this.player.inventory.slots[this.player.selectedSlot] = null;
                            }
                        }
                        this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        if (this.ui.isOpen) {
                            this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        }
                        this.input.mouse.rightClick = false;
                        return;
                    } else if (slot.item.subtype === BLOCKS.DUNGEON_DOOR) {
                        const curBlockTop = this.world.getBlock(placePos.x, placePos.y + 1, placePos.z);
                        const _topOverlap = (
                            _pp.x - 0.3 < placePos.x + 1 && _pp.x + 0.3 > placePos.x &&
                            _pp.y       < placePos.y + 2 && _pp.y + 1.8  > placePos.y + 1 &&
                            _pp.z - 0.3 < placePos.z + 1 && _pp.z + 0.3  > placePos.z
                        );
                        if (!_topOverlap && (curBlockTop === BLOCKS.AIR || curBlockTop === BLOCKS.WATER || curBlockTop === BLOCKS.SWAMP_WATER || curBlockTop === BLOCKS.LAVA)) {
                            this.world.setBlock(placePos.x, placePos.y, placePos.z, slot.item.subtype);
                            this.world.setBlock(placePos.x, placePos.y + 1, placePos.z, BLOCKS.DUNGEON_DOOR_TOP);
                            this.audio.playPlace(slot.item.subtype, placePos);
                            slot.count--;
                            if (slot.count <= 0) {
                                this.player.inventory.slots[this.player.selectedSlot] = null;
                            }
                            this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                            if (this.ui.isOpen) {
                                this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                            }
                        }
                    } else if (slot.item.subtype === BLOCKS.TALL_FERN) {
                        const curBlockTop = this.world.getBlock(placePos.x, placePos.y + 1, placePos.z);
                        if (curBlockTop === BLOCKS.AIR || curBlockTop === BLOCKS.WATER || curBlockTop === BLOCKS.SWAMP_WATER || curBlockTop === BLOCKS.LAVA) {
                            this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.TALL_FERN);
                            this.world.setBlock(placePos.x, placePos.y + 1, placePos.z, BLOCKS.TALL_FERN_TOP);
                            this.audio.playPlace(BLOCKS.TALL_FERN, placePos);
                            slot.count--;
                            if (slot.count <= 0) {
                                this.player.inventory.slots[this.player.selectedSlot] = null;
                            }
                            this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                            if (this.ui.isOpen) {
                                this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                            }
                        }
                    } else {
                        let blockData = 0;
                        const placeProps = getBlockProperties(slot.item.subtype);
                        if (placeProps.isLog) {
                            if (Math.abs(hit.normal.x) > 0.5) {
                                blockData = 1; // X axis
                            } else if (Math.abs(hit.normal.z) > 0.5) {
                                blockData = 2; // Z axis
                            } else {
                                blockData = 0; // Y axis
                            }
                        } else if (placeProps.hasFacing) {
                            const forward = new THREE.Vector3();
                            this.engine.camera.getWorldDirection(forward);
                            if (Math.abs(forward.x) > Math.abs(forward.z)) {
                                blockData = forward.x > 0 ? 1 : 3; // looking East -> faces West; looking West -> faces East
                            } else {
                                blockData = forward.z > 0 ? 2 : 0; // looking South -> faces North; looking North -> faces South
                            }
                        }

                        if (slot.item.subtype === BLOCKS.KELP) {
                            const belowBlock = this.world.getBlock(placePos.x, placePos.y - 1, placePos.z);
                            if (belowBlock === BLOCKS.KELP) {
                                this.world.setBlock(placePos.x, placePos.y - 1, placePos.z, BLOCKS.KELP_PLANT);
                            }
                        }

                        let blockToPlace = slot.item.subtype;
                        if (blockToPlace === BLOCKS.POINTED_DRIPSTONE_DOWN || blockToPlace === BLOCKS.POINTED_DRIPSTONE_UP) {
                            // Auto-orient based on hit normal and neighbor blocks like real Minecraft
                            const bAbove = this.world.getBlock(placePos.x, placePos.y + 1, placePos.z);
                            const bBelow = this.world.getBlock(placePos.x, placePos.y - 1, placePos.z);
                            if (hit.normal.y < 0 || bAbove === BLOCKS.POINTED_DRIPSTONE_DOWN || getBlockProperties(bAbove).solid) {
                                blockToPlace = BLOCKS.POINTED_DRIPSTONE_DOWN;
                            } else if (hit.normal.y > 0 || bBelow === BLOCKS.POINTED_DRIPSTONE_UP || getBlockProperties(bBelow).solid) {
                                blockToPlace = BLOCKS.POINTED_DRIPSTONE_UP;
                            }
                        }

                        this.world.setBlock(placePos.x, placePos.y, placePos.z, blockToPlace, blockData);
                        if (slot.item.subtype === BLOCKS.TORCH || slot.item.subtype === BLOCKS.GLOWSTONE || slot.item.subtype === BLOCKS.LANTERN || slot.item.subtype === BLOCKS.SOUL_LANTERN) this.torchSystem.addTorch(placePos.x, placePos.y, placePos.z);
                        this.audio.playPlace(slot.item.subtype, placePos);
                        if (!this.input.creativeMode) {
                            slot.count--;
                            if (slot.count <= 0) {
                                this.player.inventory.slots[this.player.selectedSlot] = null;
                            }
                        }
                        this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        if (this.ui.isOpen) {
                            this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        }
                    }
                }
            } else if (slot && slot.item.type === 'spawn_egg' && hit.hit) {
                const spawnPos = new THREE.Vector3(
                    hit.blockPos.x + hit.normal.x + 0.5,
                    hit.blockPos.y + (hit.normal.y < 0 ? -0.5 : (hit.normal.y > 0 ? 0.05 : 0)),
                    hit.blockPos.z + hit.normal.z + 0.5
                );
                let mobKey = (slot.item.data && slot.item.data.mobType) ? slot.item.data.mobType : slot.item.subtype;
                mobKey = String(mobKey).replace(/^spawn_egg_/, '').replace(/_spawn_egg$/, '').toUpperCase();
                if (mobKey === 'LAVASLIME' || mobKey === 'MAGMA_CUBE') mobKey = 'LAVASLIME';
                if (mobKey === 'PIGLIN_BRUTE' || mobKey === 'PIGLIN_BRUISER') mobKey = 'PIGLIN_BRUISER';
                if (mobKey === 'IRON_GOLEM' || mobKey === 'GOLEM') mobKey = 'GOLEM';

                if (MOB_TYPES[mobKey]) {
                    const mob = new Mob(mobKey, spawnPos);
                    this.entityManager.addMob(mob);
                    this.particles.emit(spawnPos, 'smoke', 10, 0xcccccc);
                    if (this.audio && this.audio.playPop) this.audio.playPop(); else this.audio.playClick();
                    if (!this.input.creativeMode) {
                        slot.count--;
                        if (slot.count <= 0) {
                            this.player.inventory.slots[this.player.selectedSlot] = null;
                        }
                    }
                    this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    if (this.ui.isOpen) {
                        this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    }
                }
                this.input.mouse.rightClick = false;
                return;
            } else if (slot && (slot.item.type === 'food' || FOOD_HEAL_MAP[slot.item.subtype] !== undefined || (slot.item.data && slot.item.data.heal > 0))) {
                const subtype = slot.item.subtype;
                const ate = this.player.eatFood(subtype, slot.item.data);
                if (ate) {
                    this.audio.playEat(this.player.position);
                    if (this.player.hunger >= 20 && this.audio && this.audio.playBurp && Math.random() < 0.4) {
                        this.audio.playBurp(this.player.position);
                    }
                    
                    // Emitting food crumbs in front of player's mouth
                    const lookDir = this.player.getLookDirection();
                    const eyePos = this.player.getEyePosition();
                    const mouthPos = eyePos.clone().add(lookDir.clone().multiplyScalar(0.42)).add(new THREE.Vector3(0, -0.18, 0));
                    const colors = FOOD_PARTICLE_COLORS[subtype] || [0xb7803a, 0x8f591f, 0xd8a556];
                    for (let i = 0; i < 16; i++) {
                        const col = colors[Math.floor(Math.random() * colors.length)];
                        this.particles.emit(mouthPos, 'eat', 1, col);
                    }

                    // Chorus fruit teleportation
                    if (subtype === 'chorus_fruit') {
                        const oldPos = this.player.position.clone();
                        this.particles.emit(oldPos, 'portal', 30, 0xc469c4);
                        let targetX = oldPos.x, targetY = oldPos.y, targetZ = oldPos.z;
                        let foundSafe = false;
                        for (let attempt = 0; attempt < 24; attempt++) {
                            const rx = Math.floor(oldPos.x + (Math.random() - 0.5) * 16);
                            const rz = Math.floor(oldPos.z + (Math.random() - 0.5) * 16);
                            const ryBase = Math.floor(oldPos.y + (Math.random() - 0.5) * 12);
                            for (let dy = 6; dy >= -6; dy--) {
                                const cy = ryBase + dy;
                                const bFloor = this.world.getBlock(rx, cy, rz);
                                const bFeet = this.world.getBlock(rx, cy + 1, rz);
                                const bHead = this.world.getBlock(rx, cy + 2, rz);
                                const pFloor = getBlockProperties(bFloor);
                                const pFeet = getBlockProperties(bFeet);
                                const pHead = getBlockProperties(bHead);
                                if (pFloor.solid && !pFeet.solid && !pHead.solid && bFloor !== BLOCKS.LAVA && bFloor !== BLOCKS.FIRE) {
                                    targetX = rx + 0.5;
                                    targetY = cy + 1.0;
                                    targetZ = rz + 0.5;
                                    foundSafe = true;
                                    break;
                                }
                            }
                            if (foundSafe) break;
                        }
                        if (foundSafe) {
                            this.player.position.set(targetX, targetY, targetZ);
                            this.player.velocity.set(0, 0, 0);
                            this.particles.emit(this.player.position, 'portal', 35, 0xc469c4);
                            if (this.audio && this.audio.playChorusTeleport) {
                                this.audio.playChorusTeleport(this.player.position);
                            } else if (this.audio && this.audio.playPop) {
                                this.audio.playPop(this.player.position);
                            }
                        }
                    }

                    // Arm swing animation when eating
                    this.isSwinging = true;
                    this.swingProgress = 0;

                    if (!this.input.creativeMode) {
                        slot.count--;
                        if (slot.count <= 0) {
                            this.player.inventory.slots[this.player.selectedSlot] = null;
                        }
                    }
                    this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    if (this.ui.isOpen) {
                        this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    }
                }
            }
            this.input.mouse.rightClick = false; // single action
        }
    }

    getTPS() {
        if (!this.tpsHistory || this.tpsHistory.length === 0) {
            return { tps1s: 20.0, tps5s: 20.0, tps15s: 20.0, mspt: 16.6 };
        }
        const now = performance.now();
        const calcWindow = (windowMs) => {
            const cutoff = now - windowMs;
            let count = 0;
            let sumDt = 0;
            for (let i = this.tpsHistory.length - 1; i >= 0; i--) {
                const entry = this.tpsHistory[i];
                if (entry.time < cutoff) break;
                count++;
                sumDt += entry.dt;
            }
            if (count === 0 || sumDt <= 0) return 20.0;
            const avgDt = sumDt / count;
            // Minecraft target TPS is 20. If average dt <= 0.05s (20+ FPS), TPS is 20.0.
            // If dt > 0.05s, TPS drops to (1 / avgDt)
            const tps = avgDt <= 0.05 ? 20.0 : Math.min(20.0, 1.0 / avgDt);
            return Math.round(tps * 10) / 10;
        };

        const tps1s = calcWindow(1000);
        const tps5s = calcWindow(5000);
        const tps15s = calcWindow(15000);

        const recentEntries = this.tpsHistory.filter(e => e.time >= now - 1000);
        const mspt = recentEntries.length > 0
            ? Math.round((recentEntries.reduce((acc, e) => acc + e.dt, 0) / recentEntries.length) * 10000) / 10
            : 16.6;

        return { tps1s, tps5s, tps15s, mspt };
    }

    loop() {
        requestAnimationFrame(this._boundLoop);

        if (!this.isReady) return;

        // Check if we need to build a pending portal
        if (this.pendingPortal && this.pendingPortal.pos) {
            const p = this.pendingPortal.pos;
            // Wait for chunk to be generated before building portal
            if (this.world.getChunkAt(p.x, p.z)) {
                this.buildLitPortal(p.x, p.y, p.z, this.pendingPortal.isNether, this.pendingPortal.isAether);
                this.pendingPortal = null;
            }
        }

        const time = performance.now();
        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        // TPS history tracking (rolling 15 seconds)
        if (!this.tpsHistory) this.tpsHistory = [];
        this.tpsHistory.push({ time, dt });
        const tpsCutoff = time - 15000;
        while (this.tpsHistory.length > 0 && this.tpsHistory[0].time < tpsCutoff) {
            this.tpsHistory.shift();
        }

        // FPS counter
        this.frames++;
        if (time - this.lastFpsTime > 1000) {
            this.fps = this.frames;
            this.frames = 0;
            this.lastFpsTime = time;
        }

        if (this.input.menuKeys.inventory) {
            if (this.input.creativeMode) {
                this.ui.toggleCreative(this.atlas);
                if (this.ui.isOpen) {
                    if (this.input.isPointerLocked()) document.exitPointerLock();
                } else {
                    this.input.requestPointerLock();
                }
            } else {
                this.ui.toggle();
                if (this.ui.isOpen) {
                    if (this.input.isPointerLocked()) document.exitPointerLock();
                } else {
                    this.input.requestPointerLock();
                }
            }
        }

        if (this.input.menuKeys.map) {
            if (this.biomeMap.isOpen) {
                this.biomeMap.close();
            } else if (!this.ui.isInventoryOpen && !this.ui.isSpellConfigOpen) {
                this.biomeMap.open();
            }
            this.input.menuKeys.map = false;
        }

        if (this.input.menuKeys.devMode && this.input.devModeUnlocked) {
            this.input.menuKeys.devMode = false;
            this.devMode.toggle();
        }

        if (this.input.menuKeys.togglePerspective) {
            this.input.menuKeys.togglePerspective = false;
            this.cameraMode = (this.cameraMode + 1) % 3;
            // 0: 1st person, 1: 3rd person behind, 2: 3rd person front
            if (this.playerMesh) {
                this.playerMesh.visible = (this.cameraMode !== 0);
            }
            if (this.viewModel) {
                this.viewModel.visible = (this.cameraMode === 0);
            }
            const crosshair = document.getElementById('crosshair');
            if (crosshair) {
                crosshair.style.display = (this.cameraMode === 0) ? 'block' : 'none';
            }
        }

        if (this.input.menuKeys.debug) {
            this.input.menuKeys.debug = false;
            const di = document.getElementById('debug-info');
            if (di) di.classList.toggle('hidden');
        }

        if (this.isPaused) {
            this.input.resetMouse();
            // Continue loading chunks while paused
            const chunkGenFn = this.currentDimension === 'nether' ? generateNetherChunk : (this.currentDimension === 'aether' ? generateAetherChunk : (this.currentDimension === 'end' ? generateEndChunk : generateChunkTerrain));
            this.world.update(this.player.position, (cx, cz) => {
                const start = performance.now();
                const res = chunkGenFn(cx, cz, this.planetParams);
                if (this.devMode) this.devMode.reportChunkGenTime(performance.now() - start);
                return res;
            }, dt);
            return;
        }

        if (this.input.menuKeys.dropItem) {
            const slot = this.player.inventory.slots[this.player.selectedSlot];
            if (slot && slot.item) {
                const dropCount = this.input.keys.sprint ? slot.count : 1;
                const lookDir = this.player.getLookDirection();
                const eyePos = this.player.getEyePosition();
                const dropPos = eyePos.clone().add(lookDir.clone().multiplyScalar(0.5));
                const velocity = lookDir.clone().multiplyScalar(10);
                
                this.entityManager.spawnItem(slot.item, dropCount, dropPos, velocity);
                
                slot.count -= dropCount;
                if (slot.count <= 0) {
                    this.player.inventory.slots[this.player.selectedSlot] = null;
                }
            }
            this.input.menuKeys.dropItem = false;
        }

        if (this.input.isPointerLocked()) {
            // Footsteps
            if (this.player.grounded && (this.input.keys.forward || this.input.keys.backward || this.input.keys.left || this.input.keys.right)) {
                this.footstepTimer = (this.footstepTimer || 0) + dt;
                const footstepInterval = this.input.keys.sprint ? 0.3 : 0.45;
                if (this.footstepTimer >= footstepInterval) {
                    this.footstepTimer = 0;
                    if (this.player.inWater) {
                        this.audio.playSwim();
                    } else {
                        const blockUnder = this.world.getBlock(Math.floor(this.player.position.x), Math.floor(this.player.position.y - 0.1), Math.floor(this.player.position.z));
                        this.audio.playFootstep(blockUnder);
                    }
                }
            } else {
                this.footstepTimer = 0.45; // trigger immediately next step
            }

            if (this.currentDimension === 'aether') {
                this.player.speedMult = 1.15;
                this.player.jumpSpeed = 10.5; // Floaty aether jump
            } else {
                this.player.speedMult = 1.0;
                this.player.jumpSpeed = 8.0;
            }
            
            this.input.keys._creativeFlying = this.input.creativeMode && this.input._creativeFlying;
            this.input.keys._creativeMode = this.input.creativeMode;
            const sensitivity = (this.mouseSensitivity !== undefined) ? this.mouseSensitivity : 0.002;
            this.player.update(dt, this.input.keys, this.input.mouse, this.world, sensitivity);
            this.handleInput(dt);

            // Sync fresh swing state and update Steve's 3D model exactly once per frame
            this.player.isSwinging = this.isSwinging;
            this.player.swingProgress = this.swingProgress;
            this.player.updatePlayerModel(dt, this.input.keys);

            // Falling from Aether sky islands into the Overworld sky
            if (this.currentDimension === 'aether' && this.player.position.y < -3 && !this.isWarping) {
                const targetX = this.player.position.x;
                const targetZ = this.player.position.z;
                this.warpToNewPlanet('overworld', { x: targetX, y: 220, z: targetZ });
                if (this.audio && this.audio.playPortalTravel) this.audio.playPortalTravel();
                return;
            }

            if (this.player.health <= 0) {
                if (this.player.isHardcore) {
                    this.handleHardcoreGameOver();
                    return;
                }
                this.respawnPlayer();
                return;
            }
        }

        this.input.resetMouse();

        if (!this.bobPhase) this.bobPhase = 0;

        if (this.player.grounded && (this.input.keys.forward || this.input.keys.backward || this.input.keys.left || this.input.keys.right)) {
            const speed = this.input.keys.sprint ? 7.5 : 5.0;
            this.bobPhase += dt * speed;
        } else {
            // Decay back to neutral
            this.bobPhase *= Math.pow(0.5, dt * 10);
        }

        const bobOffset = (this.viewBobbingEnabled !== false) ? Math.sin(this.bobPhase) * 0.02 : 0; // Very subtle bob

        // Update Camera to match perspective mode
        const eyePos = this.player.getEyePosition();
        const lookDir = this.player.getLookDirection();

        if (this.cameraMode === 0) {
            // First Person
            this.engine.camera.position.copy(eyePos);
            this.engine.camera.position.y += Math.abs(bobOffset); // Upward bounce
            this.engine.camera.lookAt(eyePos.clone().add(lookDir));
            this.engine.camera.rotateZ(bobOffset * 0.05);
        } else {
            // Third Person (1: Behind player, 2: In front of player facing player)
            const isFront = (this.cameraMode === 2);
            const camDist = 3.2;
            const camDir = isFront ? lookDir.clone() : lookDir.clone().negate();
            const targetPos = eyePos.clone().addScaledVector(camDir, camDist);
            targetPos.y += 0.3; // slightly elevated angle

            // Simple raycast against world to avoid clipping inside solid blocks
            const raySteps = 16;
            let actualPos = eyePos.clone();
            for (let step = 1; step <= raySteps; step++) {
                const sample = eyePos.clone().lerp(targetPos, step / raySteps);
                const sb = this.world.getBlock(Math.floor(sample.x), Math.floor(sample.y), Math.floor(sample.z));
                const sp = getBlockProperties(sb);
                if (sp && sp.solid) {
                    break;
                }
                actualPos.copy(sample);
            }
            this.engine.camera.position.copy(actualPos);
            if (isFront) {
                this.engine.camera.lookAt(eyePos.clone().add(new THREE.Vector3(0, -0.1, 0)));
            } else {
                this.engine.camera.lookAt(eyePos.clone().addScaledVector(lookDir, 5));
            }
        }
        // Check Portal Warp
        const pbx = Math.floor(this.player.position.x);
        const pby = Math.floor(this.player.position.y);
        const pbz = Math.floor(this.player.position.z);
        const pBlock = this.world.getBlock(pbx, pby, pbz);
        const pBlockBelow = this.world.getBlock(pbx, Math.floor(this.player.position.y - 0.2), pbz);
        if ((pBlock === BLOCKS.PORTAL || pBlockBelow === BLOCKS.PORTAL) && !this.isWarping) {
            this.warpToNewPlanet(this.currentDimension === 'nether' ? 'overworld' : 'nether');
            this.audio.playPortalTravel();
        } else if ((pBlock === window.BLOCKS.AETHER_PORTAL || pBlockBelow === window.BLOCKS.AETHER_PORTAL) && !this.isWarping) {
            this.warpToNewPlanet(this.currentDimension === 'aether' ? 'overworld' : 'aether');
            this.audio.playPortalTravel();
        } else if ((pBlock === window.BLOCKS.END_PORTAL || pBlockBelow === window.BLOCKS.END_PORTAL) && !this.isWarping) {
            if (this.currentDimension === 'end') {
                this.showEndCredits();
            } else {
                this.warpToNewPlanet('end');
            }
            if (this.audio && this.audio.playPortalTravel) this.audio.playPortalTravel();
        } else if ((pBlock === window.BLOCKS.END_GATEWAY || pBlockBelow === window.BLOCKS.END_GATEWAY) && !this.isWarping) {
            this.isWarping = true;
            const pPos = this.player.position;
            const distToCenter = Math.hypot(pPos.x, pPos.z);
            this.particles.emit(pPos, 'portal', 40, 0xaa00ff);
            if (this.audio && this.audio.playEndGatewayTeleport) this.audio.playEndGatewayTeleport();
            else if (this.audio && this.audio.playPortalTravel) this.audio.playPortalTravel();

            let dest;
            if (distToCenter < 200) {
                dest = new THREE.Vector3(424, 66, 8);
                this.showToast("Warped through End Gateway to Outer Islands!", 3500);
            } else {
                dest = new THREE.Vector3(0, 60, 0);
                this.showToast("Returned through End Gateway to Main Island!", 3500);
            }

            this.player.position.copy(dest);
            this.player.velocity.set(0, 0, 0);
            this.particles.emit(dest, 'portal', 40, 0xaa00ff);
            setTimeout(() => {
                this.isWarping = false;
            }, 1200);
        }
        
        const chunkGenFn = this.currentDimension === 'nether' ? generateNetherChunk : (this.currentDimension === 'aether' ? generateAetherChunk : (this.currentDimension === 'end' ? generateEndChunk : generateChunkTerrain));
        this.world.update(this.player.position, (cx, cz) => {
            const start = performance.now();
            const chunkBlocks = chunkGenFn(cx, cz, this.planetParams);
            if (this.devMode) this.devMode.reportChunkGenTime(performance.now() - start);
            return chunkBlocks;
        }, dt);

        // Check if player is underwater for lighting
        const headX = Math.floor(this.engine.camera.position.x);
        const headY = Math.floor(this.engine.camera.position.y);
        const headZ = Math.floor(this.engine.camera.position.z);
        const headBlock = this.world.getBlock(headX, headY, headZ);
        const headProps = window.getBlockProperties ? window.getBlockProperties(headBlock) : (getBlockProperties ? getBlockProperties(headBlock) : null);
        const isUnderwater = headProps ? (headProps.isLiquid || headProps.isWaterlogged) : false;

        if (this.audio && this.audio.setUnderwater) {
            this.audio.setUnderwater(isUnderwater);
        }

        this.lighting.update(dt, this.engine.camera.position, isUnderwater, this.currentDimension);

        // Atmospheric Weather Effects (Rain & Thunderstorm & Snowfall)
        if (this.currentDimension === 'overworld') {
            const rawBiome = (this.world && this.world.getBiomeAt && this.world.getBiomeAt(this.player.position.x, this.player.position.z)?.name) || '';
            const isCold = (rawBiome === 'Tundra' || rawBiome === 'Ice Spikes' || rawBiome === 'Mountains');

            if (this.lighting && (this.lighting.weather === 'rain' || this.lighting.weather === 'thunder')) {
                for (let i = 0; i < 6; i++) {
                    const rx = this.player.position.x + (Math.random() - 0.5) * 26;
                    const rz = this.player.position.z + (Math.random() - 0.5) * 26;
                    const ry = this.player.position.y + 7 + Math.random() * 8;
                    if (isCold) {
                        this.particles.emit(new THREE.Vector3(rx, ry, rz), 'snow', 1, 0xffffff);
                    } else {
                        this.particles.emit(new THREE.Vector3(rx, ry, rz), 'rain', 1, 0x5a9ee6);
                    }
                }
                if (this.lighting.weather === 'thunder' && Math.random() < 0.003) {
                    // Occasional thunder flash
                    const prevColor = this.engine.scene.background ? this.engine.scene.background.clone() : new THREE.Color(0x000000);
                    this.engine.scene.background = new THREE.Color(0xeeeeff);
                    if (this.lighting.ambientLight) this.lighting.ambientLight.intensity = 2.5;
                    if (this.audio && this.audio.playExplode) this.audio.playExplode();
                    setTimeout(() => {
                        this.engine.scene.background = prevColor;
                        if (this.lighting.ambientLight) this.lighting.ambientLight.intensity = (this.lighting.lastAmbientIntensity !== undefined ? this.lighting.lastAmbientIntensity : 0.36);
                    }, 70);
                }
            } else if (isCold && Math.random() < 0.35) {
                // Ambient gentle snow flurries in Snowy Tundra even in clear weather
                const rx = this.player.position.x + (Math.random() - 0.5) * 26;
                const rz = this.player.position.z + (Math.random() - 0.5) * 26;
                const ry = this.player.position.y + 4 + Math.random() * 7;
                this.particles.emit(new THREE.Vector3(rx, ry, rz), 'snow', 1, 0xffffff);
            }
        }

        if (this.engine.scene.fog && this.engine.scene.fog.isFogExp2) {
            // Keep track of the original planet fog density for Systems to use
            if (this.engine.scene.fog.baseDensity === undefined) {
                this.engine.scene.fog.baseDensity = this.engine.scene.fog.density;
            }
        }

        // Update Primed TNT entities
        if (this.primedTNT && this.primedTNT.length > 0) {
            for (let i = this.primedTNT.length - 1; i >= 0; i--) {
                const tnt = this.primedTNT[i];
                tnt.fuse -= dt;

                // Physics: apply gravity and vertical velocity
                tnt.velY -= 15 * dt;
                tnt.y += tnt.velY * dt;
                
                // Collision with floor below
                const floorY = Math.floor(tnt.y - 0.45);
                const blockBelow = this.world.getBlock(Math.floor(tnt.x), floorY, Math.floor(tnt.z));
                if (blockBelow !== window.BLOCKS.AIR && blockBelow !== window.BLOCKS.WATER) {
                    tnt.y = floorY + 1 + 0.49;
                    tnt.velY = 0;
                }
                tnt.mesh.position.set(tnt.x, tnt.y, tnt.z);

                // Flashing white fuse animation!
                // Frequency increases as fuse gets closer to 0
                const flashFreq = 3 + (1 - tnt.fuse / tnt.maxFuse) * 15;
                const flash = Math.sin(tnt.fuse * flashFreq * Math.PI) > 0;
                if (flash) {
                    tnt.mat.emissive.setHex(0xffffff);
                    tnt.mesh.scale.set(1.08, 1.08, 1.08); // Slight swell
                } else {
                    tnt.mat.emissive.setHex(0x000000);
                    tnt.mesh.scale.set(1.0, 1.0, 1.0);
                }

                // Smoke puff while ticking
                if (Math.random() < dt * 6) {
                    this.particles.emit(new THREE.Vector3(tnt.x, tnt.y + 0.5, tnt.z), 'smoke', 2, 0xcccccc);
                }

                if (tnt.fuse <= 0) {
                    // Detonate!
                    this.engine.scene.remove(tnt.mesh);
                    tnt.mesh.geometry.dispose();
                    tnt.mat.dispose();
                    this.primedTNT.splice(i, 1);
                    this.explodeTNT(tnt.x, tnt.y, tnt.z);
                }
            }
        }
        // Update thrown ender pearls
        if (this.thrownPearls && this.thrownPearls.length > 0) {
            for (let i = this.thrownPearls.length - 1; i >= 0; i--) {
                const pearl = this.thrownPearls[i];
                pearl.age += dt;
                // Apply gravity
                pearl.velocity.y -= 22 * dt;
                // Move
                pearl.mesh.position.x += pearl.velocity.x * dt;
                pearl.mesh.position.y += pearl.velocity.y * dt;
                pearl.mesh.position.z += pearl.velocity.z * dt;
                // Spin pearl sprite in flight
                if (pearl.mesh.material && typeof pearl.mesh.material.rotation === 'number') {
                    pearl.mesh.material.rotation += 8 * dt;
                }
                // Trail particles - authentic Minecraft portal motes
                if (this.particles && Math.random() < 0.6) {
                    const col = Math.random() < 0.5 ? 0xc469c4 : 0x9a369a;
                    this.particles.emit(pearl.mesh.position.clone(), 'portal', 1, col);
                }
                // Check block collision
                const px = Math.floor(pearl.mesh.position.x);
                const py = Math.floor(pearl.mesh.position.y);
                const pz = Math.floor(pearl.mesh.position.z);
                const block = this.world.getBlock(px, py, pz);
                const hitBlock = block !== window.BLOCKS.AIR && block !== window.BLOCKS.WATER && block !== window.BLOCKS.SWAMP_WATER && block !== window.BLOCKS.FIRE;
                if (hitBlock || pearl.age > 10) {
                    if (hitBlock) {
                        // Teleport player to landing position
                        const landX = pearl.mesh.position.x;
                        const landZ = pearl.mesh.position.z;
                        // Find safe Y (top of block)
                        let landY = py + 1;
                        for (let ty = py + 3; ty >= py - 1; ty--) {
                            if (this.world.getBlock(px, ty, pz) !== window.BLOCKS.AIR) {
                                landY = ty + 1;
                                break;
                            }
                        }
                        this.player.position.set(landX, landY, landZ);
                        this.player.velocity.set(0, 0, 0);
                        // Take 2 damage from pearl teleport (like Minecraft)
                        this.player.takeDamage(2);
                        // Authentic Minecraft portal burst particles
                        const pCols = [0xc469c4, 0x9a369a, 0x800080, 0xa020f0];
                        for (let k = 0; k < 35; k++) {
                            const c = pCols[Math.floor(Math.random() * pCols.length)];
                            const offset = new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 1.8, (Math.random() - 0.5) * 0.8);
                            this.particles.emit(this.player.position.clone().add(offset), 'portal', 1, c);
                        }
                        if (this.audio && this.audio.playEnderPearlTeleport) {
                            this.audio.playEnderPearlTeleport(this.player.position);
                        } else if (this.audio && this.audio.playHit) {
                            this.audio.playHit();
                        }
                    }
                    // Clean up
                    this.engine.scene.remove(pearl.mesh);
                    if (pearl.mesh.material) {
                        if (pearl.mesh.material.map) pearl.mesh.material.map.dispose();
                        pearl.mesh.material.dispose();
                    }
                    if (pearl.mesh.geometry && !pearl.mesh.isSprite && pearl.mesh.geometry.dispose) {
                        pearl.mesh.geometry.dispose();
                    }
                    this.thrownPearls.splice(i, 1);
                }
            }
        }
        this.torchSystem.update(dt, this.engine.camera.position);
        this.cloudSystem.update(dt, this.engine.camera.position);
        const prevHealth = this.player.health;
        this.entityManager.update(dt, this.world, this.player.position, this.player.inventory, this.player, this.lighting.timeOfDay, this.currentDimension);
        if (this.player.health < prevHealth) {
            this.audio.playHurt(this.player.position);
        }

        // Process mob spell casting
        for (const mob of this.entityManager.mobs) {
            if (mob.wantsToCastWind) {
                const dir = mob.wantsToCastWind;
                mob.wantsToCastWind = null;
                const stats = {
                    damage: mob.damage,
                    manaCost: 0,
                    speed: 25,
                    count: 3,
                    pierce: false,
                    homing: false,
                    castTwo: false,
                    effects: [],
                    element: 'WIND',
                    cooldown: 0
                };
                
                const eyePos = mob.position.clone();
                eyePos.y += 0.5; // From mob center/head
                
                for (let i = 0; i < stats.count; i++) {
                    let projDir = dir.clone();
                    projDir.x += (Math.random() - 0.5) * 0.4;
                    projDir.y += (Math.random() - 0.5) * 0.4;
                    projDir.z += (Math.random() - 0.5) * 0.4;
                    projDir.normalize();
                    // We color the wind projectile cyan
                    const proj = new window.SpellProjectile(eyePos, projDir, stats, 0xaaffff);
                    // Flag it so it hits the player, not mobs
                    proj.isMobProjectile = true;
                    this.projectileManager.add(proj);
                }
                this.audio.playCast();
            }
        }

        for (let visual of this.chestVisuals.values()) {
            visual.update(dt);
        }

        this._updateFurnaces(dt);
        if (this.ui.furnacePos) {
            this.ui._updateFurnaceSlots();
        }

        // Update Burning Blocks with animated 3D fire overlay
        if (this.burningBlocks && this.burningBlocks.size > 0) {
            const now = performance.now();
            for (const [key, burn] of this.burningBlocks.entries()) {
                const currentBlock = this.world.getBlock(burn.x, burn.y, burn.z);
                const props = getBlockProperties(currentBlock);
                if (!props.solid || currentBlock === BLOCKS.AIR || currentBlock === BLOCKS.FIRE || currentBlock === BLOCKS.SOUL_FIRE) {
                    if (burn.mesh) {
                        this.engine.scene.remove(burn.mesh);
                        if (burn.mesh.geometry) burn.mesh.geometry.dispose();
                        if (burn.mesh.material) burn.mesh.material.dispose();
                    }
                    this.burningBlocks.delete(key);
                    continue;
                }

                if (burn.mesh && burn.mesh.material) {
                    burn.mesh.material.opacity = 0.65 + 0.3 * Math.sin(now * 0.012 + burn.x * 3 + burn.z);
                }

                if (Math.random() < 0.25) {
                    this.particles.emit({
                        x: burn.x + 0.1 + Math.random() * 0.8,
                        y: burn.y + 0.8 + Math.random() * 0.4,
                        z: burn.z + 0.1 + Math.random() * 0.8
                    }, burn.isSoul ? 'portal' : 'fire', 2, burn.isSoul ? 0x00ffff : 0xff6600);
                }

                if (now - burn.startTime >= burn.duration) {
                    const burnResult = (Math.random() < 0.6) ? (burn.isSoul ? BLOCKS.SOUL_FIRE : BLOCKS.FIRE) : BLOCKS.AIR;
                    this.world.setBlock(burn.x, burn.y, burn.z, burnResult);
                    this.audio.playBreak(currentBlock);
                    this.particles.emit({ x: burn.x + 0.5, y: burn.y + 0.5, z: burn.z + 0.5 }, 'smoke', 10, 0x555555);
                    
                    if (burn.mesh) {
                        this.engine.scene.remove(burn.mesh);
                        if (burn.mesh.geometry) burn.mesh.geometry.dispose();
                        if (burn.mesh.material) burn.mesh.material.dispose();
                    }
                    this.burningBlocks.delete(key);
                }
            }
        }

        // Ambient Biome Particles
        if (Math.random() < 0.5) {
            const px = this.player.position.x;
            const pz = this.player.position.z;
            if (this.currentDimension === 'overworld') {
                const { biome } = getBiomeParams(px, pz, this.planetParams);
                
                if (biome.isCherry || biome.name === 'Cherry Grove') {
                    for (let k = 0; k < 2; k++) {
                        const pos = this.player.position.clone();
                        pos.x += (Math.random() - 0.5) * 24; pos.z += (Math.random() - 0.5) * 24; pos.y += 4 + Math.random() * 6;
                        this.particles.emit(pos, 'leaf', 1, Math.random() < 0.3 ? 0xffc0cb : 0xffb7c5);
                    }
                } else if (biome.name === 'Mystic Grove') {
                    const pos = this.player.position.clone();
                    pos.x += (Math.random() - 0.5) * 24; pos.z += (Math.random() - 0.5) * 24; pos.y += 2 + Math.random() * 5;
                    const colors = [0xdd88ff, 0xee99ff, 0xccaaff, 0x88eebb];
                    this.particles.emit(pos, 'magic', 1, colors[Math.floor(Math.random()*colors.length)]);
                } else if (biome.name === 'Volcanic') {
                    const pos = this.player.position.clone();
                    pos.x += (Math.random() - 0.5) * 24; pos.z += (Math.random() - 0.5) * 24; pos.y += 1 + Math.random() * 5;
                    this.particles.emit(pos, Math.random() < 0.5 ? 'smoke' : 'fire', 1, Math.random() < 0.5 ? 0x333333 : 0xff4400);
                } else if (biome.name === 'Forest' || biome.name === 'Dark Forest' || biome.name === 'Redwood Forest' || biome.jungleFlora || biome.name === 'Jungle' || biome.hasTrees) {
                    for (let k = 0; k < 2; k++) {
                        const pos = this.player.position.clone();
                        pos.x += (Math.random() - 0.5) * 24; pos.z += (Math.random() - 0.5) * 24; pos.y += 4 + Math.random() * 7;
                        const colors = [0x228B22, 0x2E8B57, 0x3CB371, 0x6B8E23, 0x556B2F, 0x4d7c0f];
                        this.particles.emit(pos, 'leaf', 1, colors[Math.floor(Math.random() * colors.length)]);
                    }
                }
            } else if (this.currentDimension === 'nether') {
                const pos = this.player.position.clone();
                pos.x += (Math.random() - 0.5) * 24; pos.z += (Math.random() - 0.5) * 24; pos.y += (Math.random() - 0.5) * 8;
                this.particles.emit(pos, 'smoke', 1, 0x221111);
            }
        }

        const _tempVec3 = new THREE.Vector3();
        const _tempVec4 = new THREE.Vector3();
        
        this.projectileManager.update(dt, (proj) => {
            let hitFound = false;
            let hitPos = _tempVec3.copy(proj.position);

            // Check entities
            _tempVec3.copy(proj.velocity).normalize();
            
            let playerHit = false;
            let eHit = { hit: false, mob: null };
            
            if (proj.isMobProjectile) {
                // Check player collision
                const distToPlayer = proj.position.distanceTo(this.player.position);
                // Player height is ~1.8, width ~0.6
                if (distToPlayer < 1.0 || (Math.abs(proj.position.x - this.player.position.x) < 0.5 && 
                                           Math.abs(proj.position.z - this.player.position.z) < 0.5 && 
                                           proj.position.y >= this.player.position.y && 
                                           proj.position.y <= this.player.position.y + 1.8)) {
                    hitFound = true;
                    playerHit = true;
                    hitPos.copy(this.player.position);
                    if (!this.player.isCreative) {
                        this.player.takeDamage(proj.stats.damage);
                        const d = document.getElementById('damage-flash');
                        if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                    }
                }
            } else {
                eHit = this.entityManager.raycast(proj.position, _tempVec3, dt * proj.stats.speed + 0.5);
                if (eHit.hit && eHit.mob) {
                    hitFound = true;
                    hitPos.copy(eHit.mob.position);
                }
            }

            if (hitFound && !playerHit) {
                if (proj.stats.element === 'ICE') {
                    eHit.mob.takeDamage(proj.stats.damage, _tempVec3);
                    eHit.mob.freeze(3.0); // 3 seconds freeze
                } else if (proj.stats.element === 'THUNDER') {
                    eHit.mob.takeDamage(proj.stats.damage * 1.5, _tempVec3);
                } else if (proj.stats.element === 'DARK') {
                    eHit.mob.takeDamage(proj.stats.damage, _tempVec3);
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + Math.abs(proj.stats.damage) * 0.5);
                } else if (proj.stats.element === 'VAMPIRIC') {
                    eHit.mob.takeDamage(proj.stats.damage, _tempVec3);
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + Math.abs(proj.stats.damage));
                } else if (proj.stats.element === 'WIND') {
                    const windKnock = _tempVec4.copy(_tempVec3).multiplyScalar(3);
                    eHit.mob.takeDamage(proj.stats.damage, windKnock);
                } else if (proj.stats.element === 'WATER') {
                    const waterKnock = _tempVec4.copy(_tempVec3).multiplyScalar(4);
                    eHit.mob.takeDamage(proj.stats.damage, waterKnock);
                    eHit.mob.burnTimer = 0; // Extinguish
                } else if (proj.stats.element === 'POISON') {
                    eHit.mob.takeDamage(proj.stats.damage, _tempVec3);
                    eHit.mob.poisonTimer = 5.0; // 5 sec poison
                } else if (proj.stats.element === 'FIRE') {
                    eHit.mob.burnTimer = 5.0; // Fireburst ignites directly hit mobs
                } else if (proj.stats.element === 'MAGMA') {
                    eHit.mob.takeDamage(proj.stats.damage, _tempVec3);
                    eHit.mob.burnTimer = 8.0; 
                } else {
                    // Normal hit
                    eHit.mob.takeDamage(proj.stats.damage, _tempVec3);
                }
                if (proj.stats.effects && proj.stats.effects.includes('burn')) {
                    eHit.mob.burnTimer = 5.0; // 5 seconds of burning
                }
            }

            // Check blocks with anti-tunneling continuous collision sub-stepping
            let hitBlock = false;
            if (!hitFound) {
                const start = proj.previousPosition || proj.position;
                const end = proj.position;
                const dist = start.distanceTo(end);
                const steps = Math.max(1, Math.ceil(dist * 2.5));
                for (let s = 1; s <= steps; s++) {
                    const frac = s / steps;
                    const testX = Math.floor(start.x + (end.x - start.x) * frac);
                    const testY = Math.floor(start.y + (end.y - start.y) * frac);
                    const testZ = Math.floor(start.z + (end.z - start.z) * frac);
                    const blockType = this.world.getBlock(testX, testY, testZ);
                    if (blockType !== BLOCKS.AIR && blockType !== BLOCKS.WATER && blockType !== BLOCKS.SWAMP_WATER && blockType !== BLOCKS.LAVA) {
                        const props = getBlockProperties(blockType);
                        if (props && (props.solid || props.isCross)) {
                            hitFound = true;
                            hitBlock = true;
                            hitPos.set(testX + 0.5, testY + 0.5, testZ + 0.5);
                            proj.position.set(start.x + (end.x - start.x) * frac, start.y + (end.y - start.y) * frac, start.z + (end.z - start.z) * frac);
                            break;
                        }
                    }
                }
            }

            if (hitFound) {
                if (proj.spell && proj.spell.type === 'METEOR') {
                    this.meteorSystem.startShower();
                }

                const bx = Math.floor(hitPos.x);
                const by = Math.floor(hitPos.y);
                const bz = Math.floor(hitPos.z);
                
                const hasEl = (el) => (proj.hasElement ? proj.hasElement(el) : ((proj.stats && proj.stats.elements && proj.stats.elements.includes(el)) || (proj.stats && proj.stats.element === el)));

                // 1. Stone Wall Construction (BUILDER) - builds an authentic 3x3 stone wall perpendicular to flight
                if (hasEl('BUILDER') || (proj.spell && proj.spell.type === 'BUILDER')) {
                    const hitX = Math.floor(proj.previousPosition.x);
                    const hitY = Math.floor(proj.previousPosition.y);
                    const hitZ = Math.floor(proj.previousPosition.z);

                    const velX = Math.abs(proj.velocity.x);
                    const velZ = Math.abs(proj.velocity.z);
                    const faceZ = velZ >= velX; // If moving mainly along Z, wall spans horizontally along X

                    // Wall material reflects combined elements!
                    let wallBlock = BLOCKS.STONE_BRICKS;
                    if (hasEl('FIRE') || hasEl('LAVA') || hasEl('MAGMA')) {
                        wallBlock = (window.BLOCKS && window.BLOCKS.MAGMA_BLOCK) ? window.BLOCKS.MAGMA_BLOCK : ((window.BLOCKS && window.BLOCKS.NETHER_BRICKS) ? window.BLOCKS.NETHER_BRICKS : BLOCKS.STONE_BRICKS);
                    } else if (hasEl('ICE') || hasEl('FROST')) {
                        wallBlock = (window.BLOCKS && window.BLOCKS.PACKED_ICE) ? window.BLOCKS.PACKED_ICE : ((window.BLOCKS && window.BLOCKS.ICE) ? window.BLOCKS.ICE : BLOCKS.STONE_BRICKS);
                    } else if (hasEl('VOID') || hasEl('DARK')) {
                        wallBlock = (window.BLOCKS && window.BLOCKS.CRYING_OBSIDIAN) ? window.BLOCKS.CRYING_OBSIDIAN : (BLOCKS.OBSIDIAN || BLOCKS.STONE_BRICKS);
                    } else if (hasEl('EARTH')) {
                        wallBlock = (window.BLOCKS && window.BLOCKS.MOSSY_STONE_BRICKS) ? window.BLOCKS.MOSSY_STONE_BRICKS : (BLOCKS.COBBLESTONE || BLOCKS.STONE_BRICKS);
                    }

                    const wallRadius = (proj.stats.count > 1 || proj.stats.castTwo) ? 2 : 1;
                    const wallHeight = 3;
                    let placedCount = 0;

                    for (let d = -wallRadius; d <= wallRadius; d++) {
                        for (let dy = 0; dy < wallHeight; dy++) {
                            const wx = faceZ ? (hitX + d) : hitX;
                            const wy = hitY + dy;
                            const wz = faceZ ? hitZ : (hitZ + d);
                            const curB = this.world.getBlock(wx, wy, wz);
                            const curProps = getBlockProperties(curB);
                            if (curB === BLOCKS.AIR || curProps.isLiquid || curProps.isCross || curB === BLOCKS.SNOW || !curProps.solid) {
                                this.world.setBlock(wx, wy, wz, wallBlock);
                                placedCount++;
                                this.particles.emit({ x: wx + 0.5, y: wy + 0.5, z: wz + 0.5 }, 'smoke', 2, 0x888888);
                            }
                        }
                    }
                    if (placedCount > 0 && this.audio) {
                        if (this.audio.playBlockPlace) this.audio.playBlockPlace(wallBlock, hitPos);
                        else if (this.audio.playPop) this.audio.playPop(hitPos);
                    }
                    this.particles.emit(hitPos, 'explosion', 16, 0x55ffff);
                }

                // 2. Water / Steam Effect
                if (hasEl('WATER') || hasEl('STEAM')) {
                    this.particles.emit(hitPos, 'explosion', 20, 0x3399FF);
                    for(let x = bx - 1; x <= bx + 1; x++) {
                        for(let y = by - 1; y <= by + 1; y++) {
                            for(let z = bz - 1; z <= bz + 1; z++) {
                                const b = this.world.getBlock(x,y,z);
                                if (b === BLOCKS.FIRE || (window.BLOCKS && (b === window.BLOCKS.FIRE || b === window.BLOCKS.SOUL_FIRE))) this.world.setBlock(x,y,z, BLOCKS.AIR);
                                else if (b === BLOCKS.LAVA) this.world.setBlock(x,y,z, BLOCKS.OBSIDIAN);
                            }
                        }
                    }
                }

                // 3. Lava Effect
                if (hasEl('LAVA')) {
                    this.particles.emit(hitPos, 'explosion', 20, 0xFF6600);
                    if (!eHit.hit) {
                        const tgtY = this.world.getBlock(bx, by, bz) === BLOCKS.AIR ? by : by + 1;
                        if (this.world.getBlock(bx, tgtY, bz) === BLOCKS.AIR) this.world.setBlock(bx, tgtY, bz, BLOCKS.LAVA);
                    }
                }

                // 4. Frost / Ice Freezing Effect
                if (hasEl('FROST') || hasEl('ICE')) {
                    this.particles.emit(hitPos, 'explosion', 35, 0xBBFFFF);
                    for (const mob of this.entityManager.mobs) {
                        if (mob.position.distanceTo(hitPos) < 5.0) {
                            mob.freeze(5.0);
                        }
                    }
                    for(let x = bx - 1; x <= bx + 1; x++) {
                        for(let y = by - 1; y <= by + 1; y++) {
                            for(let z = bz - 1; z <= bz + 1; z++) {
                                if (hitPos.distanceTo(new THREE.Vector3(x+0.5, y+0.5, z+0.5)) <= 2.0) {
                                    const b = this.world.getBlock(x, y, z);
                                    if (b === BLOCKS.WATER || (window.BLOCKS && b === window.BLOCKS.SWAMP_WATER)) this.world.setBlock(x, y, z, BLOCKS.ICE);
                                    else if (b === BLOCKS.GRASS) this.world.setBlock(x, y, z, BLOCKS.SNOW);
                                    else if (b === BLOCKS.FIRE) this.world.setBlock(x, y, z, BLOCKS.AIR);
                                    else if (b === BLOCKS.LAVA) this.world.setBlock(x, y, z, BLOCKS.OBSIDIAN);
                                }
                            }
                        }
                    }
                }

                // 5. Void Destruction Effect
                if (hasEl('VOID')) {
                    this.particles.emit(hitPos, 'explosion', 40, 0x220033);
                    for(let x = bx - 2; x <= bx + 2; x++) {
                        for(let y = by - 2; y <= by + 2; y++) {
                            for(let z = bz - 2; z <= bz + 2; z++) {
                                if (hitPos.distanceTo(new THREE.Vector3(x+0.5, y+0.5, z+0.5)) <= 2.5) {
                                    if (this.world.getBlock(x,y,z) !== BLOCKS.BEDROCK) {
                                        this.world.setBlock(x,y,z, BLOCKS.AIR);
                                        this.particles.emit(new THREE.Vector3(x+0.5, y+0.5, z+0.5), 'blockBreak', 2, 0x220033);
                                    }
                                }
                            }
                        }
                    }
                }

                // 6. Steam / Storm Shockwave
                if (hasEl('STEAM')) {
                    this.particles.emit(hitPos, 'explosion', 30, 0xDDDDDD);
                    for (const mob of this.entityManager.mobs) {
                        if (mob.position.distanceTo(hitPos) < 4.0) {
                            const knockbackDir = mob.position.clone().sub(hitPos).normalize();
                            mob.takeDamage(proj.stats.damage, knockbackDir.multiplyScalar(2));
                            mob.burnTimer = 0;
                        }
                    }
                }
                if (hasEl('STORM') || hasEl('THUNDER')) {
                    this.particles.emit(hitPos, 'explosion', 30, 0x44DDFF);
                    for (const mob of this.entityManager.mobs) {
                        if (mob.position.distanceTo(hitPos) < 6.0) {
                            const knockbackDir = mob.position.clone().sub(hitPos).normalize();
                            mob.takeDamage(proj.stats.damage, knockbackDir);
                            this.particles.emit(mob.position, 'explosion', 10, 0xFFFF00);
                        }
                    }
                    for(let x = bx - 1; x <= bx + 1; x++) {
                        for(let y = by - 1; y <= by + 1; y++) {
                            for(let z = bz - 1; z <= bz + 1; z++) {
                                if (hitPos.distanceTo(new THREE.Vector3(x+0.5, y+0.5, z+0.5)) <= 1.5) {
                                    const b = this.world.getBlock(x, y, z);
                                    if (b === BLOCKS.SAND) this.world.setBlock(x, y, z, BLOCKS.GLASS);
                                }
                            }
                        }
                    }
                }

                // 7. Fire / Magma Effect
                if (hasEl('FIRE') || hasEl('MAGMA')) {
                    for (const mob of this.entityManager.mobs) {
                        if (mob.position.distanceTo(hitPos) < 4.0) {
                            const knockbackDir = mob.position.clone().sub(hitPos).normalize();
                            mob.takeDamage(proj.stats.damage, knockbackDir);
                            mob.burnTimer = 5.0;
                        }
                    }
                    this.particles.emit(hitPos, 'explosion', 30, 0xffaa00);
                    if (!eHit.hit || !eHit.mob) {
                        const bx = Math.floor(hitPos.x);
                        const by = Math.floor(hitPos.y);
                        const bz = Math.floor(hitPos.z);
                        if (this.world.getBlock(bx, by + 1, bz) === BLOCKS.AIR) {
                            this.world.setBlock(bx, by + 1, bz, BLOCKS.FIRE);
                        } else if (this.world.getBlock(bx, by, bz) === BLOCKS.AIR) {
                            this.world.setBlock(bx, by, bz, hasEl('MAGMA') ? BLOCKS.LAVA : BLOCKS.FIRE);
                        }
                    }
                }

                // 8. Earth Boulder Effect
                if (hasEl('EARTH')) {
                    for (const mob of this.entityManager.mobs) {
                        if (mob.position.distanceTo(hitPos) < 3.0) {
                            const knockbackDir = mob.position.clone().sub(hitPos).normalize();
                            mob.takeDamage(proj.stats.damage * 0.7, knockbackDir);
                        }
                    }
                    this.particles.emit(hitPos, 'explosion', 20, 0x8B4513);
                    const weakBlocks = [BLOCKS.DIRT, BLOCKS.GRASS, BLOCKS.SAND, BLOCKS.RED_SAND, BLOCKS.LEAVES, BLOCKS.ACACIA_LEAVES, BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.ACACIA_WOOD, BLOCKS.GLASS, BLOCKS.TALL_GRASS, BLOCKS.ALIEN_TALL_GRASS, BLOCKS.RED_FLOWER, BLOCKS.BLUE_FLOWER, BLOCKS.YELLOW_FLOWER, BLOCKS.DEAD_BUSH, BLOCKS.VINES];
                    for(let x = bx - 1; x <= bx + 1; x++) {
                        for(let y = by - 1; y <= by + 1; y++) {
                            for(let z = bz - 1; z <= bz + 1; z++) {
                                if (hitPos.distanceTo(new THREE.Vector3(x+0.5, y+0.5, z+0.5)) <= 2.0) {
                                    const b = this.world.getBlock(x, y, z);
                                    if (weakBlocks.includes(b)) {
                                        this.world.setBlock(x, y, z, BLOCKS.AIR);
                                        this.particles.emit(new THREE.Vector3(x+0.5, y+0.5, z+0.5), 'blockBreak', 5, 0x8B4513);
                                    }
                                }
                            }
                        }
                    }
                }

                // 9. Dark / Void Vegetation Wither
                if (hasEl('DARK')) {
                    this.particles.emit(hitPos, 'magic', 15, proj.color);
                    for(let x = bx - 1; x <= bx + 1; x++) {
                        for(let y = by - 1; y <= by + 1; y++) {
                            for(let z = bz - 1; z <= bz + 1; z++) {
                                if (hitPos.distanceTo(new THREE.Vector3(x+0.5, y+0.5, z+0.5)) <= 2.0) {
                                    const b = this.world.getBlock(x, y, z);
                                    if (b === BLOCKS.GRASS || b === BLOCKS.ALIEN_GRASS || b === BLOCKS.SWAMP_GRASS) this.world.setBlock(x, y, z, BLOCKS.DIRT);
                                    else if (b === BLOCKS.LEAVES || b === BLOCKS.ACACIA_LEAVES || b === BLOCKS.RED_FLOWER || b === BLOCKS.BLUE_FLOWER || b === BLOCKS.YELLOW_FLOWER) this.world.setBlock(x, y, z, BLOCKS.AIR);
                                    else if (b === BLOCKS.TALL_GRASS) this.world.setBlock(x, y, z, BLOCKS.DEAD_BUSH);
                                }
                            }
                        }
                    }
                }

                // 10. Wind / Air Vegetation Blowaway
                if (hasEl('WIND') || hasEl('AIR')) {
                    this.particles.emit(hitPos, 'magic', 15, proj.color);
                    const vegetation = [BLOCKS.TALL_GRASS, BLOCKS.ALIEN_TALL_GRASS, BLOCKS.RED_FLOWER, BLOCKS.BLUE_FLOWER, BLOCKS.YELLOW_FLOWER, BLOCKS.DEAD_BUSH, BLOCKS.VINES];
                    for(let x = bx - 1; x <= bx + 1; x++) {
                        for(let y = by - 1; y <= by + 1; y++) {
                            for(let z = bz - 1; z <= bz + 1; z++) {
                                if (hitPos.distanceTo(new THREE.Vector3(x+0.5, y+0.5, z+0.5)) <= 2.5) {
                                    if (vegetation.includes(this.world.getBlock(x, y, z))) {
                                        this.world.setBlock(x, y, z, BLOCKS.AIR);
                                        this.particles.emit(new THREE.Vector3(x+0.5, y+0.5, z+0.5), 'blockBreak', 5, 0x88cc88);
                                    }
                                }
                            }
                        }
                    }
                }
                this.particles.emit(hitPos, 'magic', 10, proj.color);
                this.audio.playHit();
                return { hit: true, hitType: hitBlock ? 'block' : 'entity' };
            }
            return null;
        }, this.entityManager.mobs);

        if (this.player.burnTimer > 0 && Math.random() < 0.2) {
            const rx = (Math.random() - 0.5) * 0.8;
            const ry = Math.random() * 1.5;
            const rz = (Math.random() - 0.5) * 0.8;
            this.particles.emit(this.player.position.clone().add(new THREE.Vector3(rx, ry, rz)), 'magic', 1, 0xff5500);
            if (Math.random() < 0.1) this.audio.playFizz();
        }

        // Update thrown ender pearls
        for (let i = this.thrownEnderPearls.length - 1; i >= 0; i--) {
            const p = this.thrownEnderPearls[i];
            p.life += dt;
            p.velocity.y -= 20 * dt; // gravity
            const nextPos = p.position.clone().addScaledVector(p.velocity, dt);
            
            if (Math.random() < 0.7) {
                const col = Math.random() < 0.5 ? 0xc469c4 : 0x9a369a;
                this.particles.emit(p.position, 'portal', 1, col);
            }
            
            const rayDir = nextPos.clone().sub(p.position).normalize();
            const rayDist = p.position.distanceTo(nextPos);
            const blockHit = this.world.raycast(p.position, rayDir, rayDist);
            
            const hit = blockHit && blockHit.hit;
            const hitPos = (blockHit && blockHit.hit) ? blockHit.point : nextPos;
            
            if (hit || p.life > 6.0) {
                if (hit) {
                    const oldPos = this.player.position.clone();
                    this.particles.emit(oldPos.add(new THREE.Vector3(0, 1, 0)), 'portal', 25, 0xc469c4);
                    
                    this.player.position.set(hitPos.x, hitPos.y + 0.1, hitPos.z);
                    this.player.velocity.set(0, 0, 0);
                    this.player.fallDistance = 0;
                    
                    this.particles.emit(this.player.position.clone().add(new THREE.Vector3(0, 1, 0)), 'portal', 35, 0xc469c4);
                    if (this.audio && this.audio.playEnderPearlTeleport) {
                        this.audio.playEnderPearlTeleport(this.player.position);
                    } else if (this.audio && this.audio.playHit) {
                        this.audio.playHit();
                    }
                    
                    if (!this.player.isCreative) {
                        this.player.takeDamage(5); // 5 pearl damage (2.5 hearts)
                        const d = document.getElementById('damage-flash');
                        if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                    }
                }
                this.engine.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.thrownEnderPearls.splice(i, 1);
            } else {
                p.position.copy(nextPos);
                p.mesh.position.copy(nextPos);
            }
        }

        // Update flying eyes of ender
        for (let i = this.flyingEyesOfEnder.length - 1; i >= 0; i--) {
            const eye = this.flyingEyesOfEnder[i];
            eye.life += dt;
            if (eye.life < eye.maxLife * 0.7) {
                eye.position.addScaledVector(eye.velocity, dt);
            } else {
                eye.velocity.multiplyScalar(Math.max(0, 1 - dt * 3));
                eye.position.addScaledVector(eye.velocity, dt);
            }
            eye.mesh.position.copy(eye.position);
            if (Math.random() < 0.8) {
                this.particles.emit(eye.position, 'spell', 1, 0x1be3b1);
            }
            if (eye.life >= eye.maxLife) {
                if (Math.random() < 0.8) {
                    this.entityManager.spawnItem(Item.materialItem('eye_of_ender', 'Eye of Ender', 'Locates strongholds.'), 1, eye.position.clone());
                } else {
                    this.particles.emit(eye.position, 'spell', 12, 0x115544);
                }
                this.engine.scene.remove(eye.mesh);
                eye.mesh.geometry.dispose();
                eye.mesh.material.dispose();
                this.flyingEyesOfEnder.splice(i, 1);
            }
        }

        // Update Bow Arrow Projectiles
        if (this.arrows && this.arrows.length > 0) {
            for (let i = this.arrows.length - 1; i >= 0; i--) {
                const arr = this.arrows[i];
                arr.life += dt;
                arr.velocity.y -= 18 * dt; // authentic Minecraft arrow gravity
                const nextPos = arr.position.clone().addScaledVector(arr.velocity, dt);
                const stepVec = nextPos.clone().sub(arr.position);
                const stepDist = stepVec.length();
                const stepDir = stepVec.clone().normalize();

                // Rotate arrow mesh along travel direction
                if (stepDist > 0.001) {
                    arr.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), stepDir);
                }

                // Crit particle trail
                if (arr.critical && Math.random() < 0.6) {
                    this.particles.emit(arr.position, 'crit', 1, 0xffff66);
                }

                // 1. Check mob collisions
                let mobHit = null;
                if (this.entityManager && this.entityManager.mobs) {
                    const eHit = this.entityManager.raycast(arr.position, stepDir, stepDist + 0.3);
                    if (eHit && eHit.hit && eHit.mob) {
                        mobHit = eHit.mob;
                    }
                }

                if (mobHit) {
                    mobHit.takeDamage(arr.damage, stepDir.clone().multiplyScalar(2.0));
                    if (this.audio && this.audio.playHit) this.audio.playHit();
                    if (arr.critical) {
                        this.particles.emit(arr.position, 'crit', 12, 0xffff33);
                    } else {
                        this.particles.emit(arr.position, 'blood', 6, 0xff2222);
                    }
                    this.engine.scene.remove(arr.mesh);
                    this.arrows.splice(i, 1);
                    continue;
                }

                // 2. Check world block collisions
                const blockHit = this.world.raycast(arr.position, stepDir, stepDist);
                if (blockHit && blockHit.hit) {
                    if (this.audio && this.audio.playPop) this.audio.playPop(blockHit.point);
                    this.particles.emit(blockHit.point, 'smoke', 4, 0xaaaaaa);
                    this.engine.scene.remove(arr.mesh);
                    this.arrows.splice(i, 1);
                    continue;
                }

                // 3. Despawn if out of bounds or expired
                if (arr.life > 10.0 || arr.position.y < -30) {
                    this.engine.scene.remove(arr.mesh);
                    this.arrows.splice(i, 1);
                    continue;
                }

                arr.position.copy(nextPos);
                arr.mesh.position.copy(nextPos);
            }
        }

        // Update particles
        if (this.particles) this.particles.update(dt);
        
        // Update Dev Mode
        if (this.devMode) this.devMode.update(dt);

        this.updateWaypoints();

        // Render
        if (this.atlas && this.atlas.updateAnimatedTextures) {
            this.atlas.updateAnimatedTextures(time);
        }
        
        // 1. Main Render Pass
        this.engine.renderer.autoClear = false;
        this.engine.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this.engine.renderer.setScissorTest(false);
        this.engine.renderer.clear();
        if (this.composer && this.bokehPass && this.bokehPass.enabled) {
            this.composer.render(dt);
        } else {
            this.engine.renderer.render(this.engine.scene, this.engine.camera);
        }

        // 2. Minimap Render Pass
        const mmo = document.getElementById('minimap-overlay');
        if (this.minimapCamera && !this.ui.isOpen) {
            if (mmo) mmo.style.display = 'block';
            const mapSize = 200;
            const padding = 20;
            const rx = window.innerWidth - mapSize - padding;
            const ry = window.innerHeight - mapSize - padding;
            
            // Tilt the camera for a 2.5D map look but fixed height to avoid jump parallax
            const isUnderground = this.currentDimension === 'nether' || (this.engine.planetParams && this.engine.planetParams.theme === 'nether');
            const camY = isUnderground ? this.player.position.y + 40 : 250;
            const lookY = isUnderground ? camY - 250 : 0;
            this.minimapCamera.position.set(this.player.position.x, camY, this.player.position.z + 40);
            this.minimapCamera.lookAt(this.player.position.x, lookY, this.player.position.z);
            
            this.engine.renderer.setViewport(rx, ry, mapSize, mapSize);
            this.engine.renderer.setScissor(rx, ry, mapSize, mapSize);
            this.engine.renderer.setScissorTest(true);
            
            // Clear color and depth so minimap has a clean background (sky color or black)
            this.engine.renderer.clear(); 
            
            this.viewModel.visible = false; // Don't render hands in minimap
            if (this.cloudSystem && this.cloudSystem.clouds) this.cloudSystem.clouds.visible = false; // Hide clouds
            if (this.lighting && this.lighting.sunMesh) {
                this.lighting.sunMesh.visible = false;
                if (this.lighting.moonMesh) this.lighting.moonMesh.visible = false;
            } // Hide sun and moon
            
            // Optional: disable fog for minimap so we can see clearly
            const oldFog = this.engine.scene.fog;
            this.engine.scene.fog = null;
            
            // Disable minimap rendering in underground dimensions to avoid massive lag from drawing millions of ceiling faces
            if (!isUnderground) {
                const pChunkX = Math.floor(this.player.position.x / 16);
                const pChunkZ = Math.floor(this.player.position.z / 16);
                const prevVisibility = [];

                // Only render chunks within the minimap viewport (~80 blocks radius, 5 chunks)
                for (const chunk of this.world.chunks.values()) {
                    const isNear = Math.abs(chunk.cx - pChunkX) <= 5 && Math.abs(chunk.cz - pChunkZ) <= 5;
                    prevVisibility.push({
                        chunk,
                        meshVis: chunk.mesh ? chunk.mesh.visible : false,
                        waterVis: chunk.waterMesh ? chunk.waterMesh.visible : false
                    });
                    if (chunk.mesh) chunk.mesh.visible = isNear;
                    if (chunk.waterMesh) chunk.waterMesh.visible = isNear;
                }
                
                if (this.particles && this.particles.mesh) this.particles.mesh.visible = false;
                this.engine.renderer.render(this.engine.scene, this.minimapCamera);
                if (this.particles && this.particles.mesh) this.particles.mesh.visible = true;

                // Restore previous frustum culling visibility for main scene
                for (let i = 0; i < prevVisibility.length; i++) {
                    const pv = prevVisibility[i];
                    if (pv.chunk.mesh) pv.chunk.mesh.visible = pv.meshVis;
                    if (pv.chunk.waterMesh) pv.chunk.waterMesh.visible = pv.waterVis;
                }
            }
            
            // Update player indicator rotation
            const arrow = document.getElementById('minimap-player-arrow');
            if (arrow) {
                const lookDir = this.player.getLookDirection();
                const angle = Math.atan2(lookDir.x, -lookDir.z); 
                arrow.style.transform = `rotate(${angle}rad)`;
            }
            
            this.engine.scene.fog = oldFog;
            this.viewModel.visible = true;
            if (this.cloudSystem && this.cloudSystem.clouds) this.cloudSystem.clouds.visible = true; // Restore clouds
            if (this.lighting && this.lighting.sunMesh) {
                this.lighting.sunMesh.visible = true;
                if (this.lighting.moonMesh) this.lighting.moonMesh.visible = true;
            } // Restore sun and moon
            if (this.engine.scene.fog && this.engine.scene.fog.isFogExp2) {
                this.engine.scene.fog.density = this.engine.scene.fog.baseDensity;
            }
        } else {
            if (mmo) mmo.style.display = 'none';
        }
        
        // Reset viewport for UI
        this.engine.renderer.setScissorTest(false);
        this.engine.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this.ui.updateHUD(this.player, this.fps, this.atlas);

        // Update HUD bars
        const hf = document.getElementById('health-fill');
        const ht = document.getElementById('health-text');
        const mf = document.getElementById('mana-fill');
        const mt = document.getElementById('mana-text');
        if (hf) hf.style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
        if (ht) ht.textContent = `${Math.ceil(this.player.health)}/${this.player.maxHealth}`;
        if (mf) mf.style.width = `${(this.player.mana / this.player.maxMana) * 100}%`;
        if (mt) mt.textContent = `${Math.ceil(this.player.mana)}/${this.player.maxMana}`;
        
        // Update Boss Health Bar UI
        const bossUI = document.getElementById('boss-health-container');
        const bossNameUI = document.getElementById('boss-name');
        const bossFillUI = document.getElementById('boss-health-fill');
        let activeBoss = null;
        let closestDist = Infinity;
        
        for (const mob of this.entityManager.mobs) {
            if (mob.alive && (mob.isBoss || mob.type === 'ENDER_DRAGON' || mob.type === 'CORRUPTED_SENTINEL')) {
                const dist = mob.position.distanceTo(this.player.position);
                const maxRange = (mob.type === 'ENDER_DRAGON') ? 500 : 36;
                if (dist < maxRange && dist < closestDist) {
                    closestDist = dist;
                    activeBoss = mob;
                }
            }
        }
        
        if (bossUI) {
            if (activeBoss) {
                bossUI.style.display = 'block';
                const isDragon = activeBoss.type === 'ENDER_DRAGON';
                const bossType = isDragon ? 'Ender Dragon' : (activeBoss.name || activeBoss.typeKey || 'Boss');
                if (bossNameUI) {
                    bossNameUI.textContent = `${bossType} (${Math.ceil(activeBoss.health)}/${activeBoss.maxHealth})`;
                    bossNameUI.style.color = isDragon ? '#e066ff' : '#ffaa00';
                }
                if (bossFillUI) {
                    bossFillUI.style.width = `${Math.max(0, (activeBoss.health / activeBoss.maxHealth) * 100)}%`;
                    bossFillUI.style.background = isDragon ? 'linear-gradient(90deg, #9900cc, #cc33ff)' : 'linear-gradient(90deg, #ff0000, #ff5555)';
                }
            } else {
                bossUI.style.display = 'none';
            }
        }

        const di = document.getElementById('debug-info');
        const dLeft = document.getElementById('debug-left');
        const dRight = document.getElementById('debug-right');
        if (di && !di.classList.contains('hidden')) {
            try {
                const px = this.player.position.x;
                const py = this.player.position.y;
                const pz = this.player.position.z;
                const bx = Math.floor(px);
                const by = Math.floor(py);
                const bz = Math.floor(pz);
                const cx = Math.floor(bx / 16);
                const cz = Math.floor(bz / 16);
                const subX = ((bx % 16) + 16) % 16;
                const subY = ((by % 16) + 16) % 16;
                const subZ = ((bz % 16) + 16) % 16;

                const lookDir = this.player.getLookDirection();
                const yawDeg = ((this.player.rotation.yaw * 180 / Math.PI) % 360 + 360) % 360 - 180;
                const pitchDeg = this.player.rotation.pitch * 180 / Math.PI;
                let facingDir = 'north';
                let facingAxis = 'Towards negative Z';
                if (Math.abs(lookDir.x) > Math.abs(lookDir.z)) {
                    if (lookDir.x > 0) {
                        facingDir = 'east';
                        facingAxis = 'Towards positive X';
                    } else {
                        facingDir = 'west';
                        facingAxis = 'Towards negative X';
                    }
                } else {
                    if (lookDir.z > 0) {
                        facingDir = 'south';
                        facingAxis = 'Towards positive Z';
                    } else {
                        facingDir = 'north';
                        facingAxis = 'Towards negative Z';
                    }
                }

                const rawBiome = this.world.getBiomeAt(bx, bz)?.name || 'Plains';
                const biomeId = rawBiome.toLowerCase().replace(/\s+/g, '_');

                const eyePos = this.player.getEyePosition();
                const invSlot = this.player.inventory.slots[this.player.selectedSlot];
                const isHoldingLiquidInteractable = invSlot && invSlot.item && (invSlot.item.subtype === 'bucket' || invSlot.item.subtype === 'water_bucket' || invSlot.item.subtype === 'lava_bucket');
                const hit = this.world.raycast(eyePos, lookDir, 8, isHoldingLiquidInteractable);

                const leftLines = [
                    `SlopCraft 3D 1.20.4 (Vanilla / WebGL)`,
                    `${this.fps || 60} fps T: 60, B: 0, I: 0`,
                    `C: ${this.world.chunks.size} (s) D: ${this.world.renderDistance}, L: 0`,
                    `E: ${this.entityManager.mobs.length}/${this.entityManager.mobs.length}`,
                    ``,
                    `XYZ: ${px.toFixed(3)} / ${py.toFixed(3)} / ${pz.toFixed(3)}`,
                    `Block: ${bx} ${by} ${bz} [${subX} ${subY} ${subZ}]`,
                    `Chunk: ${cx} ${cz} in [${subX} ${subY} ${subZ}]`,
                    `Facing: ${facingDir} (${facingAxis}) (${yawDeg.toFixed(1)} / ${pitchDeg.toFixed(1)})`,
                    `Biome: minecraft:${biomeId}`,
                    `Light: 15 (15 sky, 0 block)`,
                    `Dimension: ${this.currentDimension || 'overworld'}`
                ];

                const rightLines = [
                    `SlopCraft WebEngine (Three.js r160)`,
                    `Display: ${window.innerWidth}x${window.innerHeight}`,
                    `Renderer: WebGL2 (Browser GPU)`
                ];

                if (hit && hit.hit) {
                    const blockName = getBlockName(hit.blockType) || 'Unknown';
                    const blockId = blockName.toLowerCase().replace(/\s+/g, '_');
                    rightLines.push(``);
                    rightLines.push(`Targeted Block: ${hit.blockPos.x}, ${hit.blockPos.y}, ${hit.blockPos.z}`);
                    rightLines.push(`minecraft:${blockId}`);
                }

                if (dLeft && dRight) {
                    dLeft.innerHTML = leftLines.map(l => l ? `<span class="mc-debug-line">${l}</span>` : `<div style="height:4px;"></div>`).join('');
                    dRight.innerHTML = rightLines.map(l => l ? `<span class="mc-debug-line">${l}</span>` : `<div style="height:4px;"></div>`).join('');
                } else {
                    di.innerHTML = leftLines.filter(Boolean).join('<br>');
                }
            } catch (e) {
                if (dLeft) dLeft.innerHTML = `<span class="mc-debug-line">F3 Error: ${e.message}</span>`;
            }
        }
    }

    updateWaypoints() {
        if (!this.waypointMeshes) this.waypointMeshes = [];
        const waypoints = this.waypoints || [];
        
        // Only rebuild waypoint meshes if waypoints or dimension changed
        const currentCount = waypoints.length;
        if (!this._waypointsDirty && this._lastWaypointCount === currentCount && this._lastWaypointDim === this.currentDimension) {
            return;
        }
        this._waypointsDirty = false;
        this._lastWaypointCount = currentCount;
        this._lastWaypointDim = this.currentDimension;

        // Cleanly dispose and remove old meshes
        for (let i = 0; i < this.waypointMeshes.length; i++) {
            const m = this.waypointMeshes[i];
            this.engine.scene.remove(m);
            if (m.geometry) m.geometry.dispose();
            if (m.material) m.material.dispose();
        }
        this.waypointMeshes = [];

        for (const wp of waypoints) {
            if (wp.dim !== this.currentDimension) continue;

            // Draw a glowing green pillar
            const geo = new THREE.CylinderGeometry(0.2, 0.2, 200, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
            const mesh = new THREE.Mesh(geo, mat);
            // Height
            mesh.position.set(wp.x, 100, wp.z);
            mesh.renderOrder = 999;
            this.engine.scene.add(mesh);
            this.waypointMeshes.push(mesh);
        }
    }

    warpToNewPlanet(targetDim = 'nether', overrideSpawnPos = null, isDeathRespawn = false) {
        if (!this.isReady) return;
        this.isReady = false;
        this.isWarping = true;

        const isAether = targetDim === 'aether';
        const isEnd = targetDim === 'end';
        const isWarpingToDim = targetDim !== 'overworld';

        if (isWarpingToDim && !overrideSpawnPos && !isDeathRespawn) {
            // Save the exact position we left from and the portal type
            this.overworldReturnPos = this.player.position.clone();
            this.lastPortalDim = targetDim;
        }

        // Simple screen fade
        const fade = document.createElement('div');
        fade.style.position = 'fixed';
        fade.style.top = '0'; fade.style.left = '0';
        fade.style.width = '100%'; fade.style.height = '100%';
        fade.style.backgroundColor = isDeathRespawn ? '#000000' : (isWarpingToDim ? (isAether ? 'white' : (isEnd ? '#0b0217' : '#400000')) : (overrideSpawnPos ? '#c8e6ff' : 'white'));
        fade.style.opacity = '0';
        fade.style.transition = 'opacity 1.5s ease-in-out';
        fade.style.zIndex = '9999';
        fade.style.pointerEvents = 'none';
        document.body.appendChild(fade);

        setTimeout(() => { fade.style.opacity = '1'; }, 50);

        setTimeout(() => {
            // Keep the same seed to preserve world generation
            this.planetParams = generatePlanetParams(this.currentSeed);
            window.worldGenParams = this.planetParams;
            this.world.planetParams = this.planetParams;
            this.currentDimension = targetDim;
            this.world.dimension = targetDim;

            // Thoroughly clear World and remove any leftover scene chunk meshes
            this.world.clearAll();

            // Clear doors from old dimension
            for (const door of this.doors.values()) {
                if (door && door.mesh) this.engine.scene.remove(door.mesh);
            }
            this.doors.clear();

            // Clear chest visuals from old dimension
            for (const visual of this.chestVisuals.values()) {
                visual.dispose();
            }
            this.chestVisuals.clear();

            // Clear burning blocks
            for (const burn of this.burningBlocks.values()) {
                if (burn && burn.mesh) this.engine.scene.remove(burn.mesh);
            }
            this.burningBlocks.clear();

            // Clear bed meshes from old dimension
            for (const bed of this.beds.values()) {
                if (bed && bed.mesh) this.engine.scene.remove(bed.mesh);
            }
            this.beds.clear();

            // Clear entities
            for (const mob of this.entityManager.mobs) mob.dispose();
            this.entityManager.mobs = [];
            for (const item of this.entityManager.items) item.dispose();
            this.entityManager.items = [];

            // Reset Player
            let spawnPos;
            if (isDeathRespawn) {
                this.pendingPortal = null;
                if (this.player.spawnPoint) {
                    spawnPos = { x: this.player.spawnPoint.x, y: this.player.spawnPoint.y, z: this.player.spawnPoint.z };
                } else {
                    spawnPos = findSafeSpawn(this.planetParams, 'overworld');
                }
            } else if (overrideSpawnPos) {
                spawnPos = overrideSpawnPos;
                this.pendingPortal = null;
            } else if (isWarpingToDim) {
                spawnPos = findSafeSpawn(this.planetParams, targetDim);
                this.pendingPortal = (targetDim === 'end') ? null : { pos: spawnPos, isNether: targetDim === 'nether', isAether: targetDim === 'aether' };
            } else {
                spawnPos = this.overworldReturnPos || findSafeSpawn(this.planetParams, 'overworld');
                const returnDim = this.lastPortalDim || 'nether';
                this.pendingPortal = (returnDim === 'end') ? null : { pos: spawnPos, isNether: returnDim === 'nether', isAether: returnDim === 'aether' };
            }

            if (isDeathRespawn) {
                this.player.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
                this.player.velocity.set(0, 0, 0);
                this.player.fallDistance = 0;
                this.player.fallStartY = spawnPos.y;
                this.player.spawnGraceTimer = 5.0;
            } else if (overrideSpawnPos) {
                this.player.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
                this.player.velocity.set(0, -10, 0); // Gentle falling through clouds
                this.player.fallDistance = 0;
                this.player.fallStartY = spawnPos.y;
                this.player.spawnGraceTimer = 5.0;
            } else {
                // Center player in the block to avoid wall clipping
                this.player.position.set(spawnPos.x + 0.5, spawnPos.y, spawnPos.z + 0.5);
                this.player.velocity.set(0, 0, 0);
                this.player.fallDistance = 0;
                this.player.fallStartY = spawnPos.y;
                this.player.spawnGraceTimer = 5.0;
            }

            // Immediately preload the 3x3 surrounding chunks synchronously so the world is fully solid & visible when fade lifts
            const chunkGenFn = targetDim === 'nether' ? generateNetherChunk : (targetDim === 'aether' ? generateAetherChunk : (targetDim === 'end' ? generateEndChunk : generateChunkTerrain));
            this.world.update(this.player.position, (cx, cz) => chunkGenFn(cx, cz, this.planetParams), 0);
            while (this.world.chunksToGenerate.length > 0) {
                const chunk = this.world.chunksToGenerate.shift();
                if (!this.world.chunks.has(this.world.getChunkKey(chunk.cx, chunk.cz))) continue;
                const genRes = chunkGenFn(chunk.cx, chunk.cz, this.planetParams);
                chunk.blocks = genRes;
                if (genRes && genRes.data) chunk.data.set(genRes.data);
                chunk.dirty = true;
                this.world.chunksToBuild.push(chunk);
            }
            while (this.world.chunksToBuild.length > 0) {
                const chunk = this.world.chunksToBuild.shift();
                if (chunk.dirty) {
                    this.world.textureAtlas.sharedMaterials = this.world.sharedMaterials;
                    const neighborChunks = [
                        [null, null, null],
                        [null, null, null],
                        [null, null, null]
                    ];
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dz = -1; dz <= 1; dz++) {
                            const key = this.world.getChunkKey(chunk.cx + dx, chunk.cz + dz);
                            neighborChunks[dx + 1][dz + 1] = this.world.chunks.get(key) || null;
                        }
                    }
                    const mesh = chunk.buildMesh(this.world.textureAtlas, neighborChunks, this.world.planetParams);
                    if (mesh && !mesh.parent) {
                        this.world.scene.add(mesh);
                    }
                    if (chunk.waterMesh && !chunk.waterMesh.parent) {
                        this.world.scene.add(chunk.waterMesh);
                    }
                }
            }

            // If death respawn, validate bed spawnpoint and finalize safe position now that Overworld chunks are loaded
            if (isDeathRespawn) {
                const finalSpawn = this.resolveSafeOverworldSpawn();
                this.player.position.set(finalSpawn.x, finalSpawn.y, finalSpawn.z);
                this.player.velocity.set(0, 0, 0);
                this.player.fallDistance = 0;
                this.player.fallStartY = finalSpawn.y;
                this.player.spawnGraceTimer = 5.0;

                if (Math.hypot(finalSpawn.x - spawnPos.x, finalSpawn.z - spawnPos.z) > 16) {
                    this.world.update(this.player.position, (cx, cz) => chunkGenFn(cx, cz, this.planetParams), 0);
                }
                if (this.audio && this.audio.playMC) this.audio.playMC('random/levelup', 0.6);
            }

            if (targetDim === 'end') {
                const pillarHeights = [73, 79, 85, 91, 73, 79, 85, 91];
                for (let i = 0; i < 8; i++) {
                    const angle = i * Math.PI / 4;
                    const px = Math.round(Math.cos(angle) * 38);
                    const pz = Math.round(Math.sin(angle) * 38);
                    const py = pillarHeights[i] + 1;
                    const crystal = new Mob('END_CRYSTAL', px + 0.5, py, pz + 0.5);
                    this.entityManager.addMob(crystal);
                }
                
                // Spawn Ender Dragon if not defeated
                if (!this.dragonDefeated) {
                    const dragon = new Mob('ENDER_DRAGON', 0, 72, 0);
                    this.entityManager.addMob(dragon);
                }

                this.entityManager.onDragonDefeated = (pos) => {
                    if (this.dragonDefeated) return;
                    this.dragonDefeated = true;
                    
                    if (this.audio && this.audio.playExplode) this.audio.playExplode();
                    for (let i = 0; i < 12; i++) {
                        setTimeout(() => {
                            const fxPos = pos.clone().add(new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*10, (Math.random()-0.5)*20));
                            this.particles.emit(fxPos, 'explosion', 40, 0xff00ff);
                            if (this.audio && this.audio.playExplode) this.audio.playExplode();
                        }, i * 250);
                    }

                    // Fill 3x3 exit portal at (0, 55, 0)
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dz = -1; dz <= 1; dz++) {
                            if (dx === 0 && dz === 0) continue; // center pillar
                            this.world.setBlock(dx, 55, dz, window.BLOCKS.END_PORTAL || 327);
                        }
                    }

                    // Dragon Egg atop central pillar
                    this.world.setBlock(0, 59, 0, window.BLOCKS.DRAGON_EGG || 329);

                    // Spawn End Gateway portal structure on rim of main island (64, 58, 32)
                    const gx = 64, gy = 58, gz = 32;
                    const bedrockId = window.BLOCKS.BEDROCK || 28;
                    const gatewayId = window.BLOCKS.END_GATEWAY || 333;
                    for (let dx = -2; dx <= 2; dx++) {
                        for (let dz = -2; dz <= 2; dz++) {
                            this.world.setBlock(gx + dx, gy - 2, gz + dz, window.BLOCKS.END_STONE || 328);
                        }
                    }
                    this.world.setBlock(gx, gy - 1, gz, bedrockId);
                    this.world.setBlock(gx, gy, gz, gatewayId);
                    this.world.setBlock(gx, gy + 1, gz, bedrockId);
                    for (let dy = gy - 1; dy <= gy + 2; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            for (let dz = -1; dz <= 1; dz++) {
                                if (dx === 0 && dz === 0) continue;
                                this.world.setBlock(gx + dx, dy, gz + dz, 0);
                            }
                        }
                    }
                    for (let h = 0; h < 40; h++) {
                        this.particles.emit(new THREE.Vector3(gx + 0.5, gy + 1 + h * 0.5, gz + 0.5), 'portal', 10, 0xaa00ff);
                    }

                    this.showToast("The Ender Dragon has been defeated! The Exit Portal & an End Gateway to Outer Islands are open!", 6000);
                };
            }

            // Update UI/Env
            this.lighting.timeOfDay = 0.5;

            // Fade out
            fade.style.opacity = '0';
            setTimeout(() => {
                fade.remove();
                this.isWarping = false;
                this.isReady = true; // Resume game loop
            }, 1500);

        }, 1500);
    }

    buildLitPortal(px, py, pz, isNether, isAether = false) {
        const startX = Math.floor(px) - 1;
        const startY = Math.floor(py);
        const startZ = Math.floor(pz) - 3; // Offset portal 3 blocks away
        
        let frameBlock = isAether ? window.BLOCKS.GLOWSTONE : window.BLOCKS.OBSIDIAN;
        let interiorBlock = isAether ? window.BLOCKS.AETHER_PORTAL : window.BLOCKS.PORTAL;

        // Build 4x5 lit portal with obsidian/glowstone frame
        for (let x = startX; x < startX + 4; x++) {
            for (let y = startY; y < startY + 5; y++) {
                if (x === startX || x === startX + 3 || y === startY || y === startY + 4) {
                    this.world.setBlock(x, y, startZ, frameBlock);
                } else {
                    this.world.setBlock(x, y, startZ, interiorBlock);
                }
            }
        }
        
        // Platform block
        let floorBlock = isAether ? window.BLOCKS.AETHER_STONE : (isNether ? window.BLOCKS.NETHERRACK : window.BLOCKS.OBSIDIAN);

        // Clear space and build platform
        for (let x = startX - 2; x <= startX + 5; x++) {
            for (let z = startZ - 2; z <= startZ + 4; z++) {
                // Ensure there is solid ground
                if (this.world.getBlock(x, startY - 1, z) === window.BLOCKS.AIR || 
                    this.world.getBlock(x, startY - 1, z) === window.BLOCKS.LAVA) {
                    this.world.setBlock(x, startY - 1, z, floorBlock);
                }
                
                // Clear air above platform (skip the portal itself)
                for (let y = startY; y < startY + 5; y++) {
                    if (z === startZ && x >= startX && x < startX + 4) continue; // Don't delete portal
                    this.world.setBlock(x, y, z, window.BLOCKS.AIR);
                }
            }
        }

        // Spread authentic Netherrack, Magma, Crying Obsidian, and Fire around Nether portals
        if (!isAether && window.BLOCKS.NETHERRACK) {
            const centerX = startX + 1.5;
            const centerZ = startZ + 0.5;
            for (let dx = -6; dx <= 6; dx++) {
                for (let dz = -6; dz <= 6; dz++) {
                    const dist = Math.hypot(dx, dz) + (Math.random() * 2 - 1);
                    if (dist <= 5.8) {
                        const wx = Math.floor(centerX + dx);
                        const wz = Math.floor(centerZ + dz);
                        // Bleed nether blocks down into the ground
                        for (let dy = 0; dy <= 2; dy++) {
                            const curY = startY - 1 - dy;
                            const curB = this.world.getBlock(wx, curY, wz);
                            if (curB !== window.BLOCKS.AIR && curB !== window.BLOCKS.BEDROCK && curB !== window.BLOCKS.PORTAL && curB !== window.BLOCKS.OBSIDIAN) {
                                const roll = Math.random();
                                let bleedBlock = window.BLOCKS.NETHERRACK;
                                if (roll < 0.22 && window.BLOCKS.MAGMA) bleedBlock = window.BLOCKS.MAGMA;
                                else if (roll < 0.32 && window.BLOCKS.CRYING_OBSIDIAN) bleedBlock = window.BLOCKS.CRYING_OBSIDIAN;
                                else if (roll < 0.40 && window.BLOCKS.SOUL_SOIL) bleedBlock = window.BLOCKS.SOUL_SOIL;
                                this.world.setBlock(wx, curY, wz, bleedBlock);
                            }
                        }
                        // Occasional fire on top surface
                        if (Math.random() < 0.16 && dist > 1.8 && window.BLOCKS.FIRE) {
                            const topBlock = this.world.getBlock(wx, startY, wz);
                            const belowBlock = this.world.getBlock(wx, startY - 1, wz);
                            if (topBlock === window.BLOCKS.AIR && belowBlock !== window.BLOCKS.AIR && belowBlock !== window.BLOCKS.LAVA) {
                                this.world.setBlock(wx, startY, wz, window.BLOCKS.FIRE);
                            }
                        }
                    }
                }
            }
        }
    }

    createFireOverlayMesh(x, y, z, isSoul = false) {
        const geom = new THREE.BoxGeometry(1.02, 1.02, 1.02);
        const fireBlock = isSoul ? window.BLOCKS.SOUL_FIRE : window.BLOCKS.FIRE;
        const fireUV = this.atlas ? this.atlas.getUV(fireBlock, 'side') : null;

        if (this.atlas && fireUV) {
            const uvAttr = geom.attributes.uv;
            const u0 = fireUV.u, v0 = fireUV.v;
            const u1 = fireUV.u + fireUV.uSize, v1 = fireUV.v + fireUV.vSize;
            for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
                const base = faceIdx * 8;
                uvAttr.array[base + 0] = u0; uvAttr.array[base + 1] = v1;
                uvAttr.array[base + 2] = u1; uvAttr.array[base + 3] = v1;
                uvAttr.array[base + 4] = u0; uvAttr.array[base + 5] = v0;
                uvAttr.array[base + 6] = u1; uvAttr.array[base + 7] = v0;
            }
            uvAttr.needsUpdate = true;
        }

        const mat = new THREE.MeshBasicMaterial({
            map: this.atlas ? this.atlas.texture : null,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        this.engine.scene.add(mesh);
        return mesh;
    }

    igniteBurningBlock(x, y, z, isSoul = false) {
        const key = `${x},${y},${z}`;
        if (this.burningBlocks.has(key)) return;
        const bType = this.world.getBlock(x, y, z);
        const mesh = this.createFireOverlayMesh(x, y, z, isSoul);
        this.burningBlocks.set(key, {
            x, y, z,
            blockType: bType,
            isSoul,
            startTime: performance.now(),
            duration: 4000,
            mesh
        });
    }

    extinguishBurningBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        const burn = this.burningBlocks.get(key);
        if (burn) {
            if (burn.mesh) {
                this.engine.scene.remove(burn.mesh);
                if (burn.mesh.geometry) burn.mesh.geometry.dispose();
                if (burn.mesh.material) burn.mesh.material.dispose();
            }
            this.burningBlocks.delete(key);
            return true;
        }
        return false;
    }

    switchDimension(dim) {
        this.warpToNewPlanet(dim);
    }

    igniteTNT(x, y, z) {
        // Prevent double ignition of the same block
        const key = `${x},${y},${z}`;
        if (this.world.getBlock(x, y, z) !== window.BLOCKS.TNT) return;

        // Remove the block from the voxel world
        this.world.setBlock(x, y, z, window.BLOCKS.AIR);

        // Spawn a 3D Primed TNT mesh that flashes white like real Minecraft
        const geom = new THREE.BoxGeometry(0.98, 0.98, 0.98);
        const tntTopUV = this.atlas ? this.atlas.getUV(window.BLOCKS.TNT, 'top') : null;
        const tntSideUV = this.atlas ? this.atlas.getUV(window.BLOCKS.TNT, 'side') : null;
        const tntBotUV = this.atlas ? this.atlas.getUV(window.BLOCKS.TNT, 'bottom') : null;

        // Use Phong material with flashing white emissive
        const mat = new THREE.MeshPhongMaterial({
            map: this.atlas ? this.atlas.texture : null,
            emissive: new THREE.Color(0x000000),
            shininess: 0
        });

        // Set UVs for the BoxGeometry
        if (this.atlas && tntSideUV && tntTopUV && tntBotUV) {
            const uvAttr = geom.attributes.uv;
            const setFaceUV = (faceIdx, uvInfo) => {
                // getUV returns { u, v, uSize, vSize }
                const u0 = uvInfo.u, v0 = uvInfo.v;
                const u1 = uvInfo.u + uvInfo.uSize, v1 = uvInfo.v + uvInfo.vSize;
                const base = faceIdx * 8;
                uvAttr.array[base + 0] = u0; uvAttr.array[base + 1] = v1;
                uvAttr.array[base + 2] = u1; uvAttr.array[base + 3] = v1;
                uvAttr.array[base + 4] = u0; uvAttr.array[base + 5] = v0;
                uvAttr.array[base + 6] = u1; uvAttr.array[base + 7] = v0;
            };
            setFaceUV(0, tntSideUV); // right (+X)
            setFaceUV(1, tntSideUV); // left (-X)
            setFaceUV(2, tntTopUV);  // top (+Y)
            setFaceUV(3, tntBotUV);  // bottom (-Y)
            setFaceUV(4, tntSideUV); // front (+Z)
            setFaceUV(5, tntSideUV); // back (-Z)
            uvAttr.needsUpdate = true;
        }

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        this.engine.scene.add(mesh);

        // Sound effect
        if (this.audio && this.audio.playFizz) this.audio.playFizz();

        // Primed TNT object with fuse countdown and jump velocity
        const primed = {
            mesh,
            mat,
            fuse: 3.2, // 3.2 seconds
            maxFuse: 3.2,
            velY: 3.5, // slight pop up
            x: x + 0.5,
            y: y + 0.5,
            z: z + 0.5
        };
        this.primedTNT.push(primed);
    }

    explode(x, y, z, radius = 4) {
        this.explodeTNT(x, y, z);
    }

    explodeTNT(x, y, z) {
        const radius = 4; // Expanded destruction radius
        const radiusSq = radius * radius;
        const blockAIR = window.BLOCKS.AIR;
        const blockBEDROCK = window.BLOCKS.BEDROCK;
        const blockWATER = window.BLOCKS.WATER;

        for (let ix = Math.floor(x - radius); ix <= Math.ceil(x + radius); ix++) {
            for (let iy = Math.floor(y - radius); iy <= Math.ceil(y + radius); iy++) {
                for (let iz = Math.floor(z - radius); iz <= Math.ceil(z + radius); iz++) {
                    const distSq = (ix - x) ** 2 + (iy - y) ** 2 + (iz - z) ** 2;
                    if (distSq <= radiusSq) {
                        const block = this.world.getBlock(ix, iy, iz);
                        if (block !== blockAIR && block !== blockBEDROCK && block !== blockWATER) {
                            if (block === window.BLOCKS.TNT) {
                                // Chain reaction!
                                this.igniteTNT(ix, iy, iz);
                            } else {
                                this.world.setBlock(ix, iy, iz, blockAIR);
                                // Spawn block debris particles
                                if (Math.random() < 0.2) {
                                    this.particles.emit(new THREE.Vector3(ix + 0.5, iy + 0.5, iz + 0.5), 'block_break', 1, 0x888888);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Damage nearby entities (mobs & bosses)
        for (const mob of this.entityManager.mobs) {
            const dist = mob.position.distanceTo(new THREE.Vector3(x, y, z));
            if (dist < radius + 2.5) {
                const dmg = Math.floor(65 * (1 - dist / (radius + 2.5)));
                mob.health -= dmg;
                // Knockback
                const knockDir = mob.position.clone().sub(new THREE.Vector3(x, y, z)).normalize();
                mob.velocity.add(knockDir.multiplyScalar(14));
                this.particles.emit(mob.position, 'blood', 6, 0xff0000);
            }
        }

        // Damage player
        const pDist = this.player.position.distanceTo(new THREE.Vector3(x, y, z));
        if (pDist < radius + 3.0) {
            const dmg = Math.floor(65 * (1 - pDist / (radius + 3.0)));
            if (!this.player.isCreative) {
                this.player.takeDamage(dmg);
            }
            // Knockback player
            const knockDir = this.player.position.clone().sub(new THREE.Vector3(x, y, z)).normalize();
            this.player.velocity.add(knockDir.multiplyScalar(15));
        }

        // Spectacular visual effects
        this.particles.emit(new THREE.Vector3(x, y, z), 'explosion', 70, 0xffaa00);
        this.particles.emit(new THREE.Vector3(x, y + 0.5, z), 'smoke', 25, 0x444444);
        if (this.audio && this.audio.playExplode) this.audio.playExplode();
    }

    tryLightPortal(startX, startY, startZ) {
        // First try Obsidian -> Nether Portal
        if (this._tryLightPortalType(startX, startY, startZ, [window.BLOCKS.OBSIDIAN, window.BLOCKS.PORTAL_FRAME], window.BLOCKS.PORTAL)) return;
        
        // Then try Glowstone -> Aether Portal
        if (this._tryLightPortalType(startX, startY, startZ, [window.BLOCKS.GLOWSTONE], window.BLOCKS.AETHER_PORTAL)) return;
    }

    _tryLightPortalType(startX, startY, startZ, frameBlocks, portalBlock) {
        const dirs = [
            [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
        ];
        
        for (const [dx, dy, dz] of dirs) {
            const sx = startX + dx;
            const sy = startY + dy;
            const sz = startZ + dz;
            
            if (this.world.getBlock(sx, sy, sz) !== window.BLOCKS.AIR) continue;
            
            // Try Z-plane (fixed Z)
            if (dz === 0) {
                if (this._floodFillPortal(sx, sy, startZ, 'z', frameBlocks, portalBlock)) return true;
            }
            // Try X-plane (fixed X)
            if (dx === 0) {
                if (this._floodFillPortal(startX, sy, sz, 'x', frameBlocks, portalBlock)) return true;
            }
        }
        return false;
    }

    _floodFillPortal(sx, sy, sz, plane, frameBlocks, portalBlock) {
        const MAX_AREA = 441; // max 21x21 interior
        const visited = new Set();
        const queue = [{x: sx, y: sy, z: sz}];
        const interior = [];
        
        while(queue.length > 0) {
            if (interior.length > MAX_AREA) return false;
            
            const curr = queue.shift();
            const key = `${curr.x},${curr.y},${curr.z}`;
            if (visited.has(key)) continue;
            visited.add(key);
            
            const b = this.world.getBlock(curr.x, curr.y, curr.z);
            if (b === window.BLOCKS.AIR) {
                interior.push(curr);
                
                queue.push({x: curr.x, y: curr.y + 1, z: curr.z});
                queue.push({x: curr.x, y: curr.y - 1, z: curr.z});
                if (plane === 'z') {
                    queue.push({x: curr.x + 1, y: curr.y, z: curr.z});
                    queue.push({x: curr.x - 1, y: curr.y, z: curr.z});
                } else {
                    queue.push({x: curr.x, y: curr.y, z: curr.z + 1});
                    queue.push({x: curr.x, y: curr.y, z: curr.z - 1});
                }
            } else if (!frameBlocks.includes(b)) {
                return false;
            }
        }
        
        if (interior.length !== 6) return false; // Exactly 2x3 interior
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        for (const p of interior) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
            if (p.z < minZ) minZ = p.z;
            if (p.z > maxZ) maxZ = p.z;
        }
        
        if (plane === 'z') {
            if (maxX - minX !== 1 || maxY - minY !== 2 || maxZ - minZ !== 0) return false;
        } else {
            if (maxZ - minZ !== 1 || maxY - minY !== 2 || maxX - minX !== 0) return false;
        }
        
        for (const p of interior) {
            this.world.setBlock(p.x, p.y, p.z, portalBlock);
        }
        return true;
    }

    shootArrow(charge) {
        // In survival mode, consume 1 arrow from inventory
        if (!this.player.isCreative && !this.input.creativeMode) {
            const arrowSlot = this.player.inventory.slots.find(s => s && s.item && s.item.subtype === 'arrow');
            if (arrowSlot) {
                arrowSlot.count--;
                if (arrowSlot.count <= 0) {
                    const idx = this.player.inventory.slots.indexOf(arrowSlot);
                    if (idx !== -1) this.player.inventory.slots[idx] = null;
                }
                if (this.ui) {
                    this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    if (this.ui.isOpen) {
                        this.ui.renderGrid(this.ui.elements.invHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        this.ui.renderGrid(this.ui.elements.mainGrid, this.player.inventory.slots.slice(9, 36), 9, this.player, 'inventory');
                    }
                }
            }
        }

        if (this.audio && this.audio.playBow) {
            this.audio.playBow();
        }

        this.isSwinging = true;
        this.swingProgress = 0;

        const eyePos = this.player.getEyePosition();
        const lookDir = this.player.getLookDirection();

        // Authentic 3D Arrow Mesh: shaft, flint tip, feather fletching
        const arrowGroup = new THREE.Group();
        
        // Shaft: slender brown wooden rod (0.04 x 0.04 x 0.6)
        const shaftGeo = new THREE.BoxGeometry(0.04, 0.04, 0.6);
        const shaftMat = new THREE.MeshLambertMaterial({ color: 0x8a603c });
        const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
        arrowGroup.add(shaftMesh);

        // Arrowhead: sharp gray flint tip (0.08 x 0.08 x 0.12)
        const tipGeo = new THREE.ConeGeometry(0.06, 0.14, 4);
        tipGeo.rotateX(Math.PI / 2);
        const tipMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const tipMesh = new THREE.Mesh(tipGeo, tipMat);
        tipMesh.position.set(0, 0, 0.35);
        arrowGroup.add(tipMesh);

        // Fletching: white feather vanes at back (0.12 x 0.12 x 0.15)
        const fletchGeo = new THREE.BoxGeometry(0.02, 0.12, 0.15);
        const fletchMat = new THREE.MeshBasicMaterial({ color: 0xdddddd });
        const fletch1 = new THREE.Mesh(fletchGeo, fletchMat);
        fletch1.position.set(0, 0, -0.22);
        const fletch2 = new THREE.Mesh(fletchGeo, fletchMat);
        fletch2.rotation.z = Math.PI / 2;
        fletch2.position.set(0, 0, -0.22);
        arrowGroup.add(fletch1);
        arrowGroup.add(fletch2);

        const spawnPos = eyePos.clone().addScaledVector(lookDir, 0.5);
        arrowGroup.position.copy(spawnPos);
        arrowGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), lookDir);

        this.engine.scene.add(arrowGroup);

        const speed = 18 + charge * 24; // 18 to 42 blocks/sec
        const damage = Math.round(4 + charge * 6); // 4 to 10 damage
        const isCrit = charge >= 0.95;

        this.arrows.push({
            mesh: arrowGroup,
            position: spawnPos,
            velocity: lookDir.clone().multiplyScalar(speed),
            damage: damage,
            critical: isCrit,
            life: 0
        });
    }

    checkAndActivateEndPortal(bx, by, bz) {
        const frameEye = window.BLOCKS.END_PORTAL_FRAME_EYE || 326;
        const portalBlock = window.BLOCKS.END_PORTAL || 327;
        
        for (let cx = bx - 2; cx <= bx + 2; cx++) {
            for (let cz = bz - 2; cz <= bz + 2; cz++) {
                const frames = [
                    { x: cx - 1, z: cz - 2 }, { x: cx, z: cz - 2 }, { x: cx + 1, z: cz - 2 },
                    { x: cx - 1, z: cz + 2 }, { x: cx, z: cz + 2 }, { x: cx + 1, z: cz + 2 },
                    { x: cx - 2, z: cz - 1 }, { x: cx - 2, z: cz }, { x: cx - 2, z: cz + 1 },
                    { x: cx + 2, z: cz - 1 }, { x: cx + 2, z: cz }, { x: cx + 2, z: cz + 1 }
                ];
                
                const allEyes = frames.every(f => this.world.getBlock(f.x, by, f.z) === frameEye);
                if (allEyes) {
                    for (let px = cx - 1; px <= cx + 1; px++) {
                        for (let pz = cz - 1; pz <= cz + 1; pz++) {
                            this.world.setBlock(px, by, pz, portalBlock);
                            this.particles.emit(new THREE.Vector3(px + 0.5, by + 0.5, pz + 0.5), 'spell', 20, 0x050110);
                        }
                    }
                    if (this.audio && this.audio.playEndPortalSpawn) this.audio.playEndPortalSpawn(new THREE.Vector3(cx, by, cz));
                    else {
                        if (this.audio && this.audio.playExplode) this.audio.playExplode();
                        if (this.audio && this.audio.playPortalTravel) this.audio.playPortalTravel();
                    }
                    this.showToast("The End Portal opens...", 3500);
                    return true;
                }
            }
        }
        return false;
    }

    showEndCredits() {
        if (this.showingCredits) return;
        this.showingCredits = true;
        document.exitPointerLock?.();
        
        const scr = document.getElementById('credits-screen');
        const container = document.getElementById('credits-scroll-container');
        if (scr && container) {
            scr.classList.remove('hidden');
            container.scrollTop = 0;
            
            const scrollSpeed = 42; // pixels per second
            let lastT = performance.now();
            const doScroll = (now) => {
                if (!this.showingCredits) return;
                const dt = (now - lastT) / 1000;
                lastT = now;
                container.scrollTop += scrollSpeed * dt;
                
                if (container.scrollTop >= container.scrollHeight - container.clientHeight - 10) {
                    setTimeout(() => this.closeEndCredits(), 4000);
                    return;
                }
                this._creditsScrollAnim = requestAnimationFrame(doScroll);
            };
            this._creditsScrollAnim = requestAnimationFrame(doScroll);
        }
        if (this.audio && this.audio.playMC) this.audio.playMC('random/levelup', 0.8);
    }

    closeEndCredits() {
        if (!this.showingCredits) return;
        this.showingCredits = false;
        if (this._creditsScrollAnim) cancelAnimationFrame(this._creditsScrollAnim);
        
        const scr = document.getElementById('credits-screen');
        if (scr) scr.classList.add('hidden');
        
        if (this.currentDimension === 'end') {
            this.warpToNewPlanet('overworld', null, true);
        }
    }

    loadChunksAroundPlayer() {
        if (!this.world || !this.player) return;
        const chunkGenFn = this.currentDimension === 'nether' ? generateNetherChunk : (this.currentDimension === 'aether' ? generateAetherChunk : (this.currentDimension === 'end' ? generateEndChunk : generateChunkTerrain));
        this.world.update(this.player.position, (cx, cz) => chunkGenFn(cx, cz, this.planetParams), 0);
    }

}

// Global Options UI Manager - keeps Start screen & Pause menu in two-way sync
function setupOptionsUI(game) {
    const formatPercent = (v) => `${v}%`;
    const formatBrightness = (v) => {
        if (v <= 0) return 'Moody';
        if (v >= 100) return 'Bright';
        return `+${v}%`;
    };
    const formatRaw = (v) => `${v}`;

    const registeredSyncs = [];

    function bindRangeOption({
        startSliderId,
        pauseSliderId,
        startValId,
        pauseValId,
        storageKey,
        defaultVal,
        formatFn = formatRaw,
        onApply
    }) {
        const startSlider = document.getElementById(startSliderId);
        const pauseSlider = document.getElementById(pauseSliderId);
        const startVal = document.getElementById(startValId);
        const pauseVal = document.getElementById(pauseValId);

        const updateAll = (val, triggerApply = true) => {
            const formatted = formatFn(val);
            if (startSlider && parseInt(startSlider.value) !== val) startSlider.value = val;
            if (pauseSlider && parseInt(pauseSlider.value) !== val) pauseSlider.value = val;
            if (startVal) startVal.textContent = formatted;
            if (pauseVal) pauseVal.textContent = formatted;
            try {
                localStorage.setItem(storageKey, val.toString());
            } catch (e) {}
            if (triggerApply && onApply) onApply(val);
        };

        if (startSlider) {
            startSlider.addEventListener('input', (e) => updateAll(parseInt(e.target.value)));
        }
        if (pauseSlider) {
            pauseSlider.addEventListener('input', (e) => updateAll(parseInt(e.target.value)));
        }

        const syncFn = () => {
            let val = defaultVal;
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored !== null) val = parseInt(stored);
            } catch (e) {}
            updateAll(val, true);
        };

        registeredSyncs.push(syncFn);
        syncFn();
    }

    function bindToggleOption({
        startToggleId,
        pauseToggleId,
        storageKey,
        defaultVal,
        onApply
    }) {
        const startToggle = document.getElementById(startToggleId);
        const pauseToggle = document.getElementById(pauseToggleId);

        const updateAll = (val, triggerApply = true) => {
            if (startToggle && startToggle.checked !== val) startToggle.checked = val;
            if (pauseToggle && pauseToggle.checked !== val) pauseToggle.checked = val;
            try {
                localStorage.setItem(storageKey, val ? 'true' : 'false');
            } catch (e) {}
            if (triggerApply && onApply) onApply(val);
        };

        if (startToggle) {
            startToggle.addEventListener('change', (e) => updateAll(e.target.checked));
        }
        if (pauseToggle) {
            pauseToggle.addEventListener('change', (e) => updateAll(e.target.checked));
        }

        const syncFn = () => {
            let val = defaultVal;
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored !== null) val = (stored === 'true');
            } catch (e) {}
            updateAll(val, true);
        };

        registeredSyncs.push(syncFn);
        syncFn();
    }

    // 1. Render Distance (2-16 chunks)
    bindRangeOption({
        startSliderId: 'start-render-distance-slider',
        pauseSliderId: 'render-distance-slider',
        startValId: 'start-render-distance-val',
        pauseValId: 'render-distance-val',
        storageKey: 'slopcraft_render_dist',
        defaultVal: 8,
        onApply: (val) => {
            if (game) game.renderDistance = val;
            if (game && game.world) game.world.setRenderDistance(val);
        }
    });

    // 2. Field of View (30-110)
    bindRangeOption({
        startSliderId: 'start-fov-slider',
        pauseSliderId: 'fov-slider',
        startValId: 'start-fov-val',
        pauseValId: 'fov-val',
        storageKey: 'slopcraft_fov',
        defaultVal: 75,
        onApply: (val) => {
            if (game) game.fov = val;
            if (game && game.engine && game.engine.camera) {
                game.engine.camera.fov = val;
                game.engine.camera.updateProjectionMatrix();
            }
        }
    });

    // 3. Mouse Sensitivity (20%-200%)
    bindRangeOption({
        startSliderId: 'start-sensitivity-slider',
        pauseSliderId: 'sensitivity-slider',
        startValId: 'start-sensitivity-val',
        pauseValId: 'sensitivity-val',
        storageKey: 'slopcraft_sensitivity',
        defaultVal: 100,
        formatFn: formatPercent,
        onApply: (val) => {
            if (game) {
                game.sensitivityVal = val;
                game.mouseSensitivity = (val / 100) * 0.002;
            }
        }
    });

    // 4. Volume (0%-100%)
    bindRangeOption({
        startSliderId: 'start-volume-slider',
        pauseSliderId: 'volume-slider',
        startValId: 'start-volume-val',
        pauseValId: 'volume-val',
        storageKey: 'slopcraft_volume',
        defaultVal: 100,
        formatFn: formatPercent,
        onApply: (val) => {
            const vol = val / 100;
            if (game) {
                game.masterVolume = vol;
                if (game.audio) game.audio.setMasterVolume(vol);
            }
        }
    });

    // 5. Brightness (0%-100%)
    bindRangeOption({
        startSliderId: 'start-brightness-slider',
        pauseSliderId: 'brightness-slider',
        startValId: 'start-brightness-val',
        pauseValId: 'brightness-val',
        storageKey: 'slopcraft_brightness',
        defaultVal: 100,
        formatFn: formatBrightness,
        onApply: (val) => {
            if (game) {
                game.brightnessVal = val;
                if (game.lighting) {
                    game.lighting.brightnessMultiplier = 0.75 + (val / 100) * 0.5;
                }
            }
        }
    });

    // 6. Auto-Jump (Step-Assist half-block)
    bindToggleOption({
        startToggleId: 'start-autojump-toggle',
        pauseToggleId: 'pause-autojump-toggle',
        storageKey: 'slopcraft_autojump',
        defaultVal: true,
        onApply: (val) => {
            if (game) {
                game.autoJumpEnabled = val;
                if (game.player) {
                    game.player.stepHeight = val ? 0.55 : 0.0;
                }
            }
        }
    });

    // 7. View Bobbing
    bindToggleOption({
        startToggleId: 'start-viewbobbing-toggle',
        pauseToggleId: 'pause-viewbobbing-toggle',
        storageKey: 'slopcraft_viewbobbing',
        defaultVal: true,
        onApply: (val) => {
            if (game) {
                game.viewBobbingEnabled = val;
            }
        }
    });

    // 8. Distance Blur (Bokeh)
    bindToggleOption({
        startToggleId: 'start-blur-toggle',
        pauseToggleId: 'pause-blur-toggle',
        storageKey: 'slopcraft_blur',
        defaultVal: false,
        onApply: (val) => {
            if (game && game.bokehPass) {
                game.bokehPass.enabled = val;
            }
        }
    });

    if (game) {
        game.syncOptionsUI = () => {
            registeredSyncs.forEach(fn => fn());
        };
    }
}

// Start game on load
const initGame = () => {
    const game = new Game();
    window.game = game;

    // Clean up any custom panorama from localStorage to ensure default menu background
    try {
        localStorage.removeItem('slopcraft_custom_panorama');
    } catch (e) {}

    const startBtn = document.getElementById('btn-new-game');

    // Global Options UI Manager - keeps Start screen & Pause menu in two-way sync
    setupOptionsUI(game);


    // Random Splash Text
    const splashEl = document.getElementById('mc-splash-text');
    if (splashEl) {
        const splashes = [
            "It's literally dirt!",
            "Now with liquid layers!",
            "100% pure slop!",
            "Also try Terraria!",
            "Cactus is skinny!",
            "May contain magic wands!",
            "Dungeons inside!",
            "Woo, 3D voxels!",
            "Smelt your ores!",
            "Infinite worlds!",
            "Watch out for Creepers!",
            "Made with Three.js!",
            "Bigger, better, sloppier!",
            "Fly fast with WASD!",
            "Don't dig straight down!",
            "Blue mana XP bar!",
            "Pixel perfect!"
        ];
        splashEl.textContent = splashes[Math.floor(Math.random() * splashes.length)];
    }

    // Start Screen Options Toggle
    const optBtn = document.getElementById('btn-toggle-options');
    const optPanel = document.getElementById('start-options-panel');
    if (optBtn && optPanel) {
        optBtn.onclick = () => {
            optPanel.classList.toggle('hidden');
        };
    }

    // Game Mode Cycle (Survival -> Hardcore -> Creative -> Survival)
    let selectedGameMode = 'Survival';
    const modeBtn = document.getElementById('btn-gamemode');
    if (modeBtn) {
        modeBtn.onclick = () => {
            if (selectedGameMode === 'Survival') selectedGameMode = 'Hardcore';
            else if (selectedGameMode === 'Hardcore') selectedGameMode = 'Creative';
            else selectedGameMode = 'Survival';

            modeBtn.textContent = `Mode: ${selectedGameMode}`;
            if (selectedGameMode === 'Hardcore') {
                modeBtn.style.color = '#ff5555';
            } else if (selectedGameMode === 'Creative') {
                modeBtn.style.color = '#55ff55';
            } else {
                modeBtn.style.color = '';
            }
        };
    }

    // Hardcore Game Over screen buttons
    const spectateBtn = document.getElementById('btn-hardcore-spectate');
    if (spectateBtn) {
        spectateBtn.onclick = () => {
            const goScreen = document.getElementById('hardcore-game-over-screen');
            if (goScreen) goScreen.classList.add('hidden');
            if (game.player) {
                game.player.isSpectator = true;
                game.player.health = 100;
                game.player.hunger = 20;
            }
            game._isHardcoreGameOver = false;
            if (game.canvas && game.canvas.requestPointerLock) {
                game.canvas.requestPointerLock();
            }
        };
    }

    const titleBtn = document.getElementById('btn-hardcore-title');
    if (titleBtn) {
        titleBtn.onclick = () => {
            window.location.reload();
        };
    }

    if (startBtn) {
        startBtn.onclick = () => {
            document.getElementById('start-screen').classList.add('hidden');
            const hotbar = document.getElementById('geometric-hotbar');
            if (hotbar) hotbar.classList.remove('hidden');
            const mcHud = document.getElementById('mc-hud-container');
            if (mcHud) mcHud.classList.remove('hidden');

            game.selectedGameMode = selectedGameMode;
            game.start();
        };
    } else {
        game.start(); // fallback if no button
    }
};
initGame();

