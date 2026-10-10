// ============================================
// main.js — Entry Point and Game Loop
// ============================================
import * as THREE from 'three';
import { GameEngine, InputManager, CHUNK_SIZE, CHUNK_HEIGHT, World } from './engine.js?v=98';
import { createTextureAtlas, getBlockProperties, getBlockName, BLOCKS, generateItemTexture, generateMobTexture, generateDetailedHandTexture, generateWandShaftTexture, createSteveBodyMaterials, createExtrudedItemMesh } from './textures.js?v=98';
import { generatePlanetParams, generateChunkTerrain, generateNetherChunk, generateAetherChunk, getBiomeParams } from './generation.js?v=98';
import { Player, EntityManager, Mob, MOB_TYPES, Item } from './entities.js?v=98';
import { LightingSystem, ParticleSystem, UISystem, TorchLightSystem, CloudSystem, MeteorShowerSystem } from './systems.js?v=98';
import { ProjectileManager, SpellProjectile, generateRandomSpell, generateRandomModifier, generateRandomWand } from './magic.js?v=98';
import { AudioManager } from './audio.js?v=98';
import { BiomeMap } from './map.js?v=98';
import { DevMode } from './dev.js?v=98';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Expose BLOCKS globally
window.BLOCKS = BLOCKS;
window.BLOCKS_REF = BLOCKS;

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
    'red_mushroom': 5
};

// Helper: find safe spawn location
function findSafeSpawn(params, dimension = 'overworld') {
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
        this.isPaused = false;
        
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
        this.world = new World(this.engine.scene, this.atlas);
        this.world.dimension = 'overworld';
        this.world.planetParams = this.planetParams;
        this.world.setCamera(this.engine.camera);

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
        this.world.onDoorGenerated = (x, y, z) => this._addDoor(x, y, z);
        this.world.onDoorPlaced = (x, y, z) => {
            // Check if there's already a door here or one below (since it's 2 blocks)
            if (this.world.getBlock(x, y - 1, z) !== window.BLOCKS.DUNGEON_DOOR) {
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
                if (this.world.getBlock(x, y+1, z) === window.BLOCKS.DUNGEON_DOOR) {
                    this.world.setBlock(x, y+1, z, window.BLOCKS.AIR);
                }
            } else if (this.doors.has(key2)) {
                this.engine.scene.remove(this.doors.get(key2).mesh);
                this.doors.delete(key2);
                // Also remove the bottom block if we broke the top
                if (this.world.getBlock(x, y-1, z) === window.BLOCKS.DUNGEON_DOOR) {
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
                BLOCKS.TALL_FERN_TOP,
                BLOCKS.TALL_FERN,
                BLOCKS.FERN,
                BLOCKS.TALL_GRASS,
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
        this.lighting = new LightingSystem(this.engine.scene);
        this.torchSystem = new TorchLightSystem(this.engine.scene);
        this.particles = new ParticleSystem(this.engine.scene);
        this.biomeMap = new BiomeMap(this);
        this.devMode = new DevMode(this);
        this.audio = new AudioManager();

        // Entities
        this.player = new Player();
        // Spawn player at safe location
        const spawnPos = findSafeSpawn(this.planetParams);
        this.player.position.set(spawnPos.x, spawnPos.y, spawnPos.z);

        this.entityManager = new EntityManager(this.engine.scene, this.atlas);
        this.projectileManager = new ProjectileManager(this.engine.scene);
        this.cloudSystem = new CloudSystem(this.engine.scene);
        this.meteorSystem = new MeteorShowerSystem(this.engine.scene, this.particles, this.audio, this.world);
        this.burningBlocks = new Map();

        document.addEventListener('keydown', (e) => {
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

        // Setup Scene
        const renderDistBlocks = (this.engine.renderDistance || 8) * 16;
        this.engine.scene.fog = new THREE.FogExp2(this.planetParams.skyColor || 0x87ceeb, 1.0 / (renderDistBlocks * 0.75));

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
            const dt = texLoader.load(`assets/mc/block/destroy_stage_${i}.png`);
            dt.magFilter = THREE.NearestFilter;
            dt.minFilter = THREE.NearestFilter;
            dt.generateMipmaps = false;
            this.destroyTextures.push(dt);
        }

        const overlayGeo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
        const overlayMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            map: this.destroyTextures[0],
            transparent: true,
            opacity: 0.85,
            alphaTest: 0.1,
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
        this.handMesh.position.set(0.4, -0.4, -0.5);
        this.handMesh.rotation.x = -Math.PI / 4;
        this.handMesh.rotation.z = -Math.PI / 6;
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

        const fovSlider = document.getElementById('fov-slider');
        const fovVal = document.getElementById('fov-val');
        if (fovSlider) {
            fovSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if(fovVal) fovVal.textContent = val;
                this.engine.camera.fov = val;
                this.engine.camera.updateProjectionMatrix();
            });
        }


        // Settings Handlers
        const slider = document.getElementById('render-distance-slider');
        const sliderVal = document.getElementById('render-distance-val');
        if (slider && sliderVal) {
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                sliderVal.textContent = val;
                if (this.world) this.world.setRenderDistance(val);
            });
        }

        // Pointer lock listener for pausing
        document.addEventListener('pointerlockchange', () => {
            const ps = document.getElementById('pause-screen');
            const devModeOpen = this.devMode && this.devMode.isOpen;
            const mapOpen = this.biomeMap && this.biomeMap.isOpen;
            if (!this.input.isLocked && !this.ui.isOpen && !devModeOpen && !mapOpen && document.getElementById('start-screen').classList.contains('hidden')) {
                // We lost pointer lock but the inventory/map/dev is not open, show pause
                if (ps) ps.classList.remove('hidden');
                this.isPaused = true;
            } else {
                if (ps) ps.classList.add('hidden');
                this.isPaused = false;
            }
        });

        document.addEventListener('pointerlockerror', () => {
            const ps = document.getElementById('pause-screen');
            if (ps && document.getElementById('start-screen').classList.contains('hidden')) {
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
                
                // Check for portal markers underneath the chest
                let portalType = null;
                if (this.world) {
                    const below = this.world.getBlock(x, y - 1, z);
                    if (below === window.BLOCKS.PORTAL) { portalType = 'nether'; this.world.setBlock(x, y - 1, z, window.BLOCKS.NETHERRACK); }
                    else if (below === window.BLOCKS.AETHER_PORTAL) { portalType = 'aether'; this.world.setBlock(x, y - 1, z, window.BLOCKS.AETHER_DIRT); }
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

                // Populate 3-8 slots randomly
                const numSlots = 3 + Math.floor(rng() * 6);
                for (let i = 0; i < numSlots; i++) {
                    const slotIdx = Math.floor(rng() * 27);
                    if (!inv[slotIdx]) {
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
        if (this.world.getBlock(x, y - 1, z) === window.BLOCKS.DUNGEON_DOOR) return;

        const key = `${x},${y},${z}`;
        if (this.doors.has(key)) {
            // Update position if needed (shouldn't be needed for static doors)
            return;
        }

        // Create door geometry (1 block high)
        const doorGeom = new THREE.BoxGeometry(1, 1, 0.125).toNonIndexed();
        
        // Create materials from texture atlas
        const uvInfoBot = this.atlas.getUV(window.BLOCKS.DUNGEON_DOOR);
        const uvInfoTop = this.atlas.getUV(window.BLOCKS.DUNGEON_DOOR_TOP);
        
        const doorGeomBot = doorGeom.clone();
        const doorGeomTop = doorGeom.clone();

        const uvsBot = doorGeomBot.attributes.uv.array;
        for (let i = 0; i < 6; i++) {
            for (let v = 0; v < 6; v++) {
                const baseU = uvsBot[i * 12 + v * 2];
                const baseV = uvsBot[i * 12 + v * 2 + 1];
                uvsBot[i * 12 + v * 2] = uvInfoBot.u + baseU * uvInfoBot.uSize;
                uvsBot[i * 12 + v * 2 + 1] = uvInfoBot.v + baseV * uvInfoBot.vSize;
            }
        }
        
        const uvsTop = doorGeomTop.attributes.uv.array;
        for (let i = 0; i < 6; i++) {
            for (let v = 0; v < 6; v++) {
                const baseU = uvsTop[i * 12 + v * 2];
                const baseV = uvsTop[i * 12 + v * 2 + 1];
                uvsTop[i * 12 + v * 2] = uvInfoTop.u + baseU * uvInfoTop.uSize;
                uvsTop[i * 12 + v * 2 + 1] = uvInfoTop.v + baseV * uvInfoTop.vSize;
            }
        }
        
        const mat = new THREE.MeshLambertMaterial({ 
            map: this.atlas.texture, 
            transparent: true, 
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });
        
        doorGeomBot.translate(0.5, 0.5, 0); 
        doorGeomTop.translate(0.5, 0.5, 0); 
        
        const doorGroup = new THREE.Group();
        const meshBot = new THREE.Mesh(doorGeomBot, mat);
        const meshTop = new THREE.Mesh(doorGeomTop, mat);
        meshTop.position.y = 1;
        
        doorGroup.add(meshBot);
        doorGroup.add(meshTop);
        
        // Determine orientation by checking neighbors
        const isWallX = this.world.getBlock(x - 1, y, z) !== window.BLOCKS.AIR && this.world.getBlock(x + 1, y, z) !== window.BLOCKS.AIR;
        const isWallZ = this.world.getBlock(x, y, z - 1) !== window.BLOCKS.AIR && this.world.getBlock(x, y, z + 1) !== window.BLOCKS.AIR;
        
        if (isWallX) {
            // Walls on X axis -> Tunnel on Z axis -> Door spans X
            doorGroup.position.set(x, y, z + 0.5);
            doorGroup.rotation.y = 0;
            this.doors.set(key, { mesh: doorGroup, isOpen: false, baseRotationY: 0, x, y, z });
        } else {
            // Walls on Z axis -> Tunnel on X axis -> Door spans Z
            doorGroup.position.set(x + 0.5, y, z);
            doorGroup.rotation.y = Math.PI / 2;
            this.doors.set(key, { mesh: doorGroup, isOpen: false, baseRotationY: Math.PI / 2, x, y, z });
        }
        
        this.engine.scene.add(doorGroup);
    }

    _updateFurnaces(dt) {
        // Simple smelting recipes
        const getSmeltResult = (inputItem) => {
            if (!inputItem || !inputItem.item) return null;
            const type = inputItem.item.type;
            const subtype = inputItem.item.subtype;
            
            if (type === 'block' && (subtype === window.BLOCKS.IRON_ORE || subtype === window.BLOCKS.GOLD_ORE || subtype === window.BLOCKS.CRYSTAL_ORE || subtype === window.BLOCKS.MANA_ORE)) {
                // Return INGOT or GEM
                let matSubtype = 'iron_ingot';
                if (subtype === window.BLOCKS.GOLD_ORE) matSubtype = 'gold_ingot';
                if (subtype === window.BLOCKS.CRYSTAL_ORE) matSubtype = 'crystal_shard';
                if (subtype === window.BLOCKS.MANA_ORE) matSubtype = 'mana_crystal';
                return { type: 'material', subtype: matSubtype, name: matSubtype.replace('_', ' '), stackable: true, maxStack: 64, id: `mat_${matSubtype}` };
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
        const isHoldingBucket = invSlot && invSlot.item && invSlot.item.type === 'material' && (invSlot.item.subtype === 'bucket' || invSlot.item.subtype === 'water_bucket' || invSlot.item.subtype === 'lava_bucket');
        const hit = this.world.raycast(eyePos, lookDir, 8, isHoldingBucket);
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
                } else {
                    const geom = new THREE.BoxGeometry(0.25, 0.25, 0.25).toNonIndexed();
                    const uvs = geom.attributes.uv.array;
                    const faceNames = ['side', 'side', 'top', 'bottom', 'side', 'side'];
                    for (let i = 0; i < 6; i++) {
                        const uvInfo = this.atlas.getUV(slot.item.subtype, faceNames[i]);
                        for (let v = 0; v < 6; v++) {
                            const baseU = uvs[i * 12 + v * 2];
                            const baseV = uvs[i * 12 + v * 2 + 1];
                            uvs[i * 12 + v * 2] = uvInfo.u + baseU * uvInfo.uSize;
                            uvs[i * 12 + v * 2 + 1] = uvInfo.v + baseV * uvInfo.vSize;
                        }
                    }
                    this.heldItemMesh = new THREE.Mesh(geom, mat);
                }
                this.heldItemMesh.position.set(0.4, -0.2, -0.8);
                if (!blockProps.isCross && slot.item.subtype !== BLOCKS.TORCH) {
                    this.heldItemMesh.rotation.y = -Math.PI / 4;
                    this.heldItemMesh.rotation.x = Math.PI / 8;
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

                this.heldItemMesh.position.set(0.4, -0.1, -0.8);
                this.heldItemMesh.rotation.x = Math.PI / 4;
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

            if (slot && slot.item.type === 'wand') {
                const castInfo = slot.item.data.wand.castCombined(this.player);
                if (castInfo) {
                    if (castInfo.stats.element === 'HEAL') {
                        this.player.health = Math.min(this.player.maxHealth, this.player.health + Math.abs(castInfo.stats.damage));
                    }
                    this.particles.emit(eyePos, 'magic', 10, castInfo.spell.color);
                    this.audio.playCast();
                    for (let i = 0; i < castInfo.stats.count; i++) {
                        let projDir = lookDir.clone();
                        if (castInfo.stats.count > 1) {
                            projDir.x += (Math.random() - 0.5) * 0.2;
                            projDir.y += (Math.random() - 0.5) * 0.2;
                            projDir.z += (Math.random() - 0.5) * 0.2;
                            projDir.normalize();
                        }
                        const proj = new SpellProjectile(eyePos, projDir, castInfo.stats, castInfo.spell.color);
                        this.projectileManager.add(proj);
                    }
                }
                this.input.mouse.leftClick = false; // single cast
            } else if (hit.hit && (hit.blockType === BLOCKS.FIRE || hit.blockType === BLOCKS.SOUL_FIRE)) {
                // Punching fire extinguishes it instantly like Minecraft
                this.world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, BLOCKS.AIR);
                this.extinguishBurningBlock(hit.blockPos.x, hit.blockPos.y - 1, hit.blockPos.z);
                if (this.audio && this.audio.playFizz) this.audio.playFizz();
                this.particles.emit({x: hit.blockPos.x + 0.5, y: hit.blockPos.y + 0.5, z: hit.blockPos.z + 0.5}, 'smoke', 8, 0x888888);
                this.breakTimer = 0;
                this.input.mouse.leftClick = false;
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
                    this.miningOverlay.material.color.setHex(0x000000);
                    this.miningOverlay.material.needsUpdate = true;
                }

                if (this.breakTimer >= breakTime) {
                    const blockType = this.world.getBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    // The setBlock call will trigger onBlockDestroyed which spawns the item
                    this.world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, BLOCKS.AIR);
                    
                    if (blockType === BLOCKS.TORCH || blockType === BLOCKS.GLOWSTONE) this.torchSystem.removeTorch(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    if (blockType === BLOCKS.TALL_FERN) {
                        if (this.world.getBlock(hit.blockPos.x, hit.blockPos.y + 1, hit.blockPos.z) === BLOCKS.TALL_FERN_TOP) {
                            this.world.setBlock(hit.blockPos.x, hit.blockPos.y + 1, hit.blockPos.z, BLOCKS.AIR);
                        }
                    } else if (blockType === BLOCKS.TALL_FERN_TOP) {
                        if (this.world.getBlock(hit.blockPos.x, hit.blockPos.y - 1, hit.blockPos.z) === BLOCKS.TALL_FERN) {
                            this.world.setBlock(hit.blockPos.x, hit.blockPos.y - 1, hit.blockPos.z, BLOCKS.AIR);
                        }
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
                if (this.audio && this.audio.playHit) this.audio.playHit();
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
            if (hit.hit && hit.blockType === window.BLOCKS.DUNGEON_DOOR) {
                const key = `${hit.blockPos.x},${hit.blockPos.y},${hit.blockPos.z}`;
                const keyLower = `${hit.blockPos.x},${hit.blockPos.y - 1},${hit.blockPos.z}`;
                
                let door = this.doors.get(key);
                if (!door) door = this.doors.get(keyLower);
                
                if (door) {
                    door.isOpen = !door.isOpen;
                    if (door.isOpen) this.audio.playDoorOpen(hit.blockPos);
                    else this.audio.playDoorClose(hit.blockPos);
                    const targetRotation = door.isOpen ? Math.PI / 2 : 0;
                    door.mesh.rotation.y = door.baseRotationY + targetRotation;
                }
                
                this.input.mouse.rightClick = false;
                return;
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
            } else if (slot && slot.item.type === 'material' && (slot.item.subtype === 'bucket' || slot.item.subtype === 'water_bucket' || slot.item.subtype === 'lava_bucket') && hit.hit) {
                // Bucket logic
                const bucketType = slot.item.subtype;
                if (bucketType === 'bucket') {
                    // Empty bucket - try to pick up liquid source block
                    const targetBlock = hit.blockType;
                    if (targetBlock === BLOCKS.WATER || targetBlock === BLOCKS.SWAMP_WATER) {
                        // Check if it's a source block (data === 0)
                        const data = this.world.getData(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                        if (data === 0) {
                            this.world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, BLOCKS.AIR);
                            // Replace bucket with water bucket
                            slot.item = { type: 'material', subtype: 'water_bucket', name: 'Water Bucket', stackable: false, maxStack: 1, data: {} };
                            this.audio.playWaterSplash(hit.blockPos);
                            this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        }
                    } else if (targetBlock === BLOCKS.LAVA) {
                        const data = this.world.getData(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                        if (data === 0) {
                            this.world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, BLOCKS.AIR);
                            slot.item = { type: 'material', subtype: 'lava_bucket', name: 'Lava Bucket', stackable: false, maxStack: 1, data: {} };
                            this.audio.playFizz(hit.blockPos);
                            this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                        }
                    }
                } else if (bucketType === 'water_bucket') {
                    // Place water source block
                    const placePos = { x: hit.blockPos.x + hit.normal.x, y: hit.blockPos.y + hit.normal.y, z: hit.blockPos.z + hit.normal.z };
                    const curBlock = this.world.getBlock(placePos.x, placePos.y, placePos.z);
                    if (curBlock === BLOCKS.AIR || curBlock === BLOCKS.LAVA) {
                        // Water on lava source = obsidian
                        if (curBlock === BLOCKS.LAVA) {
                            const lavaData = this.world.getData(placePos.x, placePos.y, placePos.z);
                            if (lavaData === 0) {
                                this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.OBSIDIAN);
                            } else {
                                this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.COBBLESTONE);
                            }
                        } else {
                            this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.WATER);
                            this.world.setData(placePos.x, placePos.y, placePos.z, 0); // Source block
                        }
                        // Convert back to empty bucket
                        slot.item = { type: 'material', subtype: 'bucket', name: 'Bucket', stackable: true, maxStack: 16, data: {} };
                        this.audio.playWaterSplash(placePos);
                        this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    }
                } else if (bucketType === 'lava_bucket') {
                    // Place lava source block
                    const placePos = { x: hit.blockPos.x + hit.normal.x, y: hit.blockPos.y + hit.normal.y, z: hit.blockPos.z + hit.normal.z };
                    const curBlock = this.world.getBlock(placePos.x, placePos.y, placePos.z);
                    if (curBlock === BLOCKS.AIR || curBlock === BLOCKS.WATER || curBlock === BLOCKS.SWAMP_WATER) {
                        // Lava on water = stone
                        if (curBlock === BLOCKS.WATER || curBlock === BLOCKS.SWAMP_WATER) {
                            this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.STONE);
                        } else {
                            this.world.setBlock(placePos.x, placePos.y, placePos.z, BLOCKS.LAVA);
                            this.world.setData(placePos.x, placePos.y, placePos.z, 0); // Source block
                            this.torchSystem.addTorch(placePos.x, placePos.y, placePos.z);
                        }
                        // Convert back to empty bucket
                        slot.item = { type: 'material', subtype: 'bucket', name: 'Bucket', stackable: true, maxStack: 16, data: {} };
                        this.audio.playFizz(placePos);
                        this.ui.renderGrid(this.ui.elements.mainHotbar, this.player.inventory.slots.slice(0, 9), 0, this.player, 'inventory');
                    }
                }
                this.input.mouse.rightClick = false;
                return;
            } else if (slot && slot.item.type === 'block' && hit.hit) {
                // Place block
                const placePos = { x: hit.blockPos.x + hit.normal.x, y: hit.blockPos.y + hit.normal.y, z: hit.blockPos.z + hit.normal.z };
                const curBlock = this.world.getBlock(placePos.x, placePos.y, placePos.z);
                // Prevent placing blocks inside the player's AABB (0.6 wide × 1.8 tall)
                const _pp = this.player.position;
                const _playerOverlap = (
                    _pp.x - 0.3 < placePos.x + 1 && _pp.x + 0.3 > placePos.x &&
                    _pp.y       < placePos.y + 1 && _pp.y + 1.8  > placePos.y &&
                    _pp.z - 0.3 < placePos.z + 1 && _pp.z + 0.3  > placePos.z
                );
                if (!_playerOverlap && (curBlock === BLOCKS.AIR || curBlock === BLOCKS.WATER || curBlock === BLOCKS.SWAMP_WATER || curBlock === BLOCKS.LAVA)) {
                    if (slot.item.subtype === BLOCKS.DUNGEON_DOOR) {
                        const curBlockTop = this.world.getBlock(placePos.x, placePos.y + 1, placePos.z);
                        const _topOverlap = (
                            _pp.x - 0.3 < placePos.x + 1 && _pp.x + 0.3 > placePos.x &&
                            _pp.y       < placePos.y + 2 && _pp.y + 1.8  > placePos.y + 1 &&
                            _pp.z - 0.3 < placePos.z + 1 && _pp.z + 0.3  > placePos.z
                        );
                        if (!_topOverlap && (curBlockTop === BLOCKS.AIR || curBlockTop === BLOCKS.WATER || curBlockTop === BLOCKS.SWAMP_WATER || curBlockTop === BLOCKS.LAVA)) {
                            this.world.setBlock(placePos.x, placePos.y, placePos.z, slot.item.subtype);
                            this.world.setBlock(placePos.x, placePos.y + 1, placePos.z, slot.item.subtype);
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

                        this.world.setBlock(placePos.x, placePos.y, placePos.z, slot.item.subtype, blockData);
                        if (slot.item.subtype === BLOCKS.TORCH || slot.item.subtype === BLOCKS.GLOWSTONE) this.torchSystem.addTorch(placePos.x, placePos.y, placePos.z);
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
                const healAmount = (slot.item.data && slot.item.data.heal) || FOOD_HEAL_MAP[subtype] || 15;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + healAmount);
                if (subtype === 'golden_apple') {
                    this.player.health = Math.min(this.player.maxHealth + 20, this.player.health + 20);
                }
                this.audio.playEat(this.player.position);
                const mouthPos = new THREE.Vector3(this.player.position.x, this.player.position.y + 1.2, this.player.position.z);
                this.particles.emit(mouthPos, 'explosion', 12, 0x88cc44);
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
            this.input.mouse.rightClick = false; // single action
        }
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
            const chunkGenFn = this.currentDimension === 'nether' ? generateNetherChunk : (this.currentDimension === 'aether' ? generateAetherChunk : generateChunkTerrain);
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
            this.player.update(dt, this.input.keys, this.input.mouse, this.world);
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
                // Respawn
                this.player.health = this.player.maxHealth;
                this.player.mana = this.player.maxMana;
                
                if (this.currentDimension === 'aether') {
                    // Warp to overworld on death
                    this.warpToNewPlanet('overworld');
                    return; // Skip standard respawn logic since warp handles it
                }
                
                const spawnPos = findSafeSpawn(this.planetParams, this.currentDimension);
                this.player.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
                this.player.velocity.set(0, 0, 0);
                this.audio.playMC('random/levelup', 0.6);
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

        const bobOffset = Math.sin(this.bobPhase) * 0.02; // Very subtle bob

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
        if (pBlock === BLOCKS.PORTAL && !this.isWarping) {
            this.warpToNewPlanet(this.currentDimension === 'nether' ? 'overworld' : 'nether');
            this.audio.playPortalTravel();
        } else if (pBlock === window.BLOCKS.AETHER_PORTAL && !this.isWarping) {
            this.warpToNewPlanet(this.currentDimension === 'aether' ? 'overworld' : 'aether');
            this.audio.playPortalTravel();
        }
        
        const chunkGenFn = this.currentDimension === 'nether' ? generateNetherChunk : (this.currentDimension === 'aether' ? generateAetherChunk : generateChunkTerrain);
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

        if (this.engine.scene.fog) {
            // Keep track of the original planet fog density for Systems to use
            if (this.engine.scene.fog.baseDensity === undefined) {
                this.engine.scene.fog.baseDensity = this.engine.scene.fog.density;
            }
        }
        this.particles.update(dt);

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
                // Trail particles
                if (this.particles && Math.random() < 0.4) {
                    this.particles.emit(pearl.mesh.position.clone(), 'magic', 1, 0x22cc88);
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
                        // Effects
                        this.particles.emit(this.player.position.clone(), 'magic', 30, 0x22cc88);
                        if (this.audio && this.audio.playHit) this.audio.playHit();
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

            // Check blocks
            let hitBlock = false;
            if (!hitFound) {
                const bx = Math.floor(proj.position.x);
                const by = Math.floor(proj.position.y);
                const bz = Math.floor(proj.position.z);
                const blockType = this.world.getBlock(bx, by, bz);
                if (blockType !== BLOCKS.AIR && blockType !== BLOCKS.WATER && blockType !== BLOCKS.SWAMP_WATER && blockType !== BLOCKS.LAVA) {
                    const props = getBlockProperties(blockType);
                    if (props && (props.solid || props.isCross)) {
                        hitFound = true;
                        hitBlock = true;
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
                
                if (proj.stats.element === 'WATER') {
                    this.particles.emit(hitPos, 'explosion', 20, 0x3399FF);
                    for(let x = bx - 1; x <= bx + 1; x++) {
                        for(let y = by - 1; y <= by + 1; y++) {
                            for(let z = bz - 1; z <= bz + 1; z++) {
                                const b = this.world.getBlock(x,y,z);
                                if (b === BLOCKS.FIRE) this.world.setBlock(x,y,z, BLOCKS.AIR);
                                else if (b === BLOCKS.LAVA) this.world.setBlock(x,y,z, BLOCKS.OBSIDIAN);
                            }
                        }
                    }
                } else if (proj.stats.element === 'LAVA') {
                    this.particles.emit(hitPos, 'explosion', 20, 0xFF6600);
                    if (!eHit.hit) {
                        const tgtY = this.world.getBlock(bx, by, bz) === BLOCKS.AIR ? by : by + 1;
                        if (this.world.getBlock(bx, tgtY, bz) === BLOCKS.AIR) this.world.setBlock(bx, tgtY, bz, BLOCKS.LAVA);
                    }
                } else if (proj.stats.element === 'BUILDER') {
                    this.particles.emit(hitPos, 'explosion', 10, 0xAAAAAA);
                    if (!eHit.hit) {
                        const px = Math.floor(proj.previousPosition.x);
                        const py = Math.floor(proj.previousPosition.y);
                        const pz = Math.floor(proj.previousPosition.z);
                        if (this.world.getBlock(px, py, pz) === BLOCKS.AIR || this.world.getBlock(px, py, pz) === BLOCKS.WATER) {
                            this.world.setBlock(px, py, pz, BLOCKS.STONE_BRICKS);
                        }
                    }
                } else if (proj.stats.element === 'FROST') {
                    this.particles.emit(hitPos, 'explosion', 40, 0xBBFFFF);
                    for (const mob of this.entityManager.mobs) {
                        if (mob.position.distanceTo(hitPos) < 5.0) {
                            mob.freeze(5.0);
                        }
                    }
                } else if (proj.stats.element === 'VOID') {
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
                } else if (proj.stats.element === 'STEAM') {
                    this.particles.emit(hitPos, 'explosion', 40, 0xDDDDDD);
                    for (const mob of this.entityManager.mobs) {
                        if (mob.position.distanceTo(hitPos) < 4.0) {
                            const knockbackDir = mob.position.clone().sub(hitPos).normalize();
                            mob.takeDamage(proj.stats.damage, knockbackDir.multiplyScalar(2));
                            mob.burnTimer = 0; // Steam extinguishes
                        }
                    }
                } else if (proj.stats.element === 'STORM') {
                    this.particles.emit(hitPos, 'explosion', 30, 0x44DDFF);
                    for (const mob of this.entityManager.mobs) {
                        if (mob.position.distanceTo(hitPos) < 6.0) {
                            const knockbackDir = mob.position.clone().sub(hitPos).normalize();
                            mob.takeDamage(proj.stats.damage, knockbackDir);
                            this.particles.emit(mob.position, 'explosion', 10, 0xFFFF00); // Zap
                        }
                    }
                } else if (proj.stats.element === 'FIRE' || proj.stats.element === 'MAGMA') {
                    // Explode! AOE damage
                    for (const mob of this.entityManager.mobs) {
                        if (mob.position.distanceTo(hitPos) < 4.0) {
                            const knockbackDir = mob.position.clone().sub(hitPos).normalize();
                            mob.takeDamage(proj.stats.damage, knockbackDir);
                            mob.burnTimer = 5.0; // Ignite AOE
                        }
                    }
                    this.particles.emit(hitPos, 'explosion', 30, 0xffaa00);
                    // Ignite blocks
                    if (!eHit.hit || !eHit.mob) {
                        const bx = Math.floor(hitPos.x);
                        const by = Math.floor(hitPos.y);
                        const bz = Math.floor(hitPos.z);
                        if (this.world.getBlock(bx, by + 1, bz) === BLOCKS.AIR) {
                            this.world.setBlock(bx, by + 1, bz, BLOCKS.FIRE);
                        } else if (this.world.getBlock(bx, by, bz) === BLOCKS.AIR) {
                            this.world.setBlock(bx, by, bz, proj.stats.element === 'MAGMA' ? BLOCKS.LAVA : BLOCKS.FIRE);
                        }
                    }
                } else if (proj.stats.element === 'EARTH') {
                    for (const mob of this.entityManager.mobs) {
                        if (mob.position.distanceTo(hitPos) < 3.0) {
                            const knockbackDir = mob.position.clone().sub(hitPos).normalize();
                            mob.takeDamage(proj.stats.damage * 0.7, knockbackDir);
                        }
                    }
                    this.particles.emit(hitPos, 'explosion', 20, 0x8B4513);
                    // Destroy weak blocks
                    const bx = Math.floor(hitPos.x), by = Math.floor(hitPos.y), bz = Math.floor(hitPos.z);
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
                } else if (proj.stats.element === 'ICE') {
                    this.particles.emit(hitPos, 'magic', 15, proj.color);
                    const bx = Math.floor(hitPos.x), by = Math.floor(hitPos.y), bz = Math.floor(hitPos.z);
                    for(let x = bx - 1; x <= bx + 1; x++) {
                        for(let y = by - 1; y <= by + 1; y++) {
                            for(let z = bz - 1; z <= bz + 1; z++) {
                                if (hitPos.distanceTo(new THREE.Vector3(x+0.5, y+0.5, z+0.5)) <= 2.0) {
                                    const b = this.world.getBlock(x, y, z);
                                    if (b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER) this.world.setBlock(x, y, z, BLOCKS.ICE);
                                    else if (b === BLOCKS.GRASS) this.world.setBlock(x, y, z, BLOCKS.SNOW);
                                    else if (b === BLOCKS.FIRE) this.world.setBlock(x, y, z, BLOCKS.AIR);
                                    else if (b === BLOCKS.LAVA) this.world.setBlock(x, y, z, BLOCKS.STONE);
                                }
                            }
                        }
                    }
                } else if (proj.stats.element === 'DARK') {
                    this.particles.emit(hitPos, 'magic', 15, proj.color);
                    const bx = Math.floor(hitPos.x), by = Math.floor(hitPos.y), bz = Math.floor(hitPos.z);
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
                } else if (proj.stats.element === 'THUNDER') {
                    this.particles.emit(hitPos, 'magic', 15, proj.color);
                    const bx = Math.floor(hitPos.x), by = Math.floor(hitPos.y), bz = Math.floor(hitPos.z);
                    for(let x = bx - 1; x <= bx + 1; x++) {
                        for(let y = by - 1; y <= by + 1; y++) {
                            for(let z = bz - 1; z <= bz + 1; z++) {
                                if (hitPos.distanceTo(new THREE.Vector3(x+0.5, y+0.5, z+0.5)) <= 1.5) {
                                    const b = this.world.getBlock(x, y, z);
                                    if (b === BLOCKS.SAND || b === BLOCKS.RED_SAND) this.world.setBlock(x, y, z, BLOCKS.GLASS);
                                    else if (b === BLOCKS.AIR && this.world.getBlock(x, y - 1, z) !== BLOCKS.AIR) {
                                        if (Math.random() < 0.3) this.world.setBlock(x, y, z, BLOCKS.FIRE);
                                    }
                                }
                            }
                        }
                    }
                } else if (proj.stats.element === 'WIND') {
                    this.particles.emit(hitPos, 'magic', 15, proj.color);
                    const bx = Math.floor(hitPos.x), by = Math.floor(hitPos.y), bz = Math.floor(hitPos.z);
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
                } else {
                    this.particles.emit(hitPos, 'magic', 15, proj.color);
                }
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
        if (this.composer) {
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
                for (const chunk of this.world.chunks.values()) {
                    if (chunk.mesh) chunk.mesh.visible = true;
                    if (chunk.waterMesh) chunk.waterMesh.visible = true;
                }
                
                this.engine.renderer.render(this.engine.scene, this.minimapCamera);
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
            if (this.engine.scene.fog) {
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
            if (mob.isBoss && mob.alive) {
                const dist = mob.position.distanceTo(this.player.position);
                if (dist < 32 && dist < closestDist) {
                    closestDist = dist;
                    activeBoss = mob;
                }
            }
        }
        
        if (bossUI) {
            if (activeBoss) {
                bossUI.style.display = 'block';
                const bossType = activeBoss.typeKey || 'BOSS';
                if (bossNameUI) bossNameUI.textContent = `${bossType} (${Math.ceil(activeBoss.health)}/${activeBoss.maxHealth})`;
                if (bossFillUI) bossFillUI.style.width = `${Math.max(0, (activeBoss.health / activeBoss.maxHealth) * 100)}%`;
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
                const isHoldingBucket = invSlot && invSlot.item && invSlot.item.type === 'material' && (invSlot.item.subtype === 'bucket' || invSlot.item.subtype === 'water_bucket' || invSlot.item.subtype === 'lava_bucket');
                const hit = this.world.raycast(eyePos, lookDir, 8, isHoldingBucket);

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
        
        // Remove old meshes
        for (let i = 0; i < this.waypointMeshes.length; i++) {
            this.engine.scene.remove(this.waypointMeshes[i]);
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

    warpToNewPlanet(targetDim = 'nether', overrideSpawnPos = null) {
        if (!this.isReady) return;
        this.isReady = false;
        this.isWarping = true;

        const isAether = targetDim === 'aether';
        const isWarpingToDim = targetDim !== 'overworld';

        if (isWarpingToDim && !overrideSpawnPos) {
            // Save the exact position we left from and the portal type
            this.overworldReturnPos = this.player.position.clone();
            this.lastPortalDim = targetDim;
        }

        // Simple screen fade
        const fade = document.createElement('div');
        fade.style.position = 'fixed';
        fade.style.top = '0'; fade.style.left = '0';
        fade.style.width = '100%'; fade.style.height = '100%';
        fade.style.backgroundColor = isWarpingToDim ? (isAether ? 'white' : '#400000') : (overrideSpawnPos ? '#c8e6ff' : 'white');
        fade.style.opacity = '0';
        fade.style.transition = 'opacity 1.5s ease-in-out';
        fade.style.zIndex = '9999';
        fade.style.pointerEvents = 'none';
        document.body.appendChild(fade);

        setTimeout(() => { fade.style.opacity = '1'; }, 50);

        setTimeout(() => {
            // Keep the same seed to preserve world generation
            this.planetParams = generatePlanetParams(this.currentSeed);
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

            // Clear entities
            for (const mob of this.entityManager.mobs) mob.dispose();
            this.entityManager.mobs = [];
            for (const item of this.entityManager.items) item.dispose();
            this.entityManager.items = [];

            // Reset Player
            let spawnPos;
            if (overrideSpawnPos) {
                spawnPos = overrideSpawnPos;
                this.pendingPortal = null;
            } else if (isWarpingToDim) {
                spawnPos = findSafeSpawn(this.planetParams, targetDim);
                this.pendingPortal = { pos: spawnPos, isNether: targetDim === 'nether', isAether: targetDim === 'aether' };
            } else {
                spawnPos = this.overworldReturnPos || findSafeSpawn(this.planetParams, 'overworld');
                const returnDim = this.lastPortalDim || 'nether';
                this.pendingPortal = { pos: spawnPos, isNether: returnDim === 'nether', isAether: returnDim === 'aether' };
            }

            if (overrideSpawnPos) {
                this.player.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
                this.player.velocity.set(0, -10, 0); // Gentle falling through clouds
            } else {
                // Center player in the block to avoid wall clipping
                this.player.position.set(spawnPos.x + 0.5, spawnPos.y, spawnPos.z + 0.5);
                this.player.velocity.set(0, 0, 0);
            }

            // Immediately preload the 3x3 surrounding chunks synchronously so the world is fully solid & visible when fade lifts
            const chunkGenFn = targetDim === 'nether' ? generateNetherChunk : (targetDim === 'aether' ? generateAetherChunk : generateChunkTerrain);
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
                }
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
}

// Start game on load
const initGame = () => {
    const game = new Game();
    window.game = game;
    const startBtn = document.getElementById('btn-new-game');

    const startBlurToggle = document.getElementById('start-blur-toggle');
    const pauseBlurToggle = document.getElementById('pause-blur-toggle');
    const useBlur = localStorage.getItem('slopcraft_blur') === 'true'; // default false
    if (startBlurToggle) {
        startBlurToggle.checked = useBlur;
        startBlurToggle.addEventListener('change', (e) => {
            localStorage.setItem('slopcraft_blur', e.target.checked);
            if (window.game && window.game.bokehPass) window.game.bokehPass.enabled = e.target.checked;
        });
    }
    if (pauseBlurToggle) {
        pauseBlurToggle.checked = useBlur;
        pauseBlurToggle.addEventListener('change', (e) => {
            localStorage.setItem('slopcraft_blur', e.target.checked);
            if (window.game && window.game.bokehPass) window.game.bokehPass.enabled = e.target.checked;
        });
    }


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

    if (startBtn) {
        startBtn.onclick = () => {
            document.getElementById('start-screen').classList.add('hidden');
            const hotbar = document.getElementById('geometric-hotbar');
            if (hotbar) hotbar.classList.remove('hidden');
            const mcHud = document.getElementById('mc-hud-container');
            if (mcHud) mcHud.classList.remove('hidden');
            game.start();
        };
    } else {
        game.start(); // fallback if no button
    }
};
initGame();
