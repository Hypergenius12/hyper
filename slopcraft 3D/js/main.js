// ============================================
// main.js — Entry Point and Game Loop
// ============================================
import * as THREE from 'three';
import { GameEngine, InputManager, CHUNK_SIZE, CHUNK_HEIGHT, World } from './engine.js';
import { createTextureAtlas, getBlockProperties, getBlockName, BLOCKS, generateItemTexture } from './textures.js';
import { generatePlanetParams, generateChunkTerrain, generateNetherChunk, generateAetherChunk, generateCavernsChunk, generateHighlandsChunk, getBiomeParams } from './generation.js';
import { Player, EntityManager, Mob, MOB_TYPES, Item } from './entities.js';
import { LightingSystem, ParticleSystem, UISystem, TorchLightSystem, CloudSystem, MeteorShowerSystem } from './systems.js';
import { ProjectileManager, SpellProjectile, generateRandomSpell, generateRandomModifier, generateRandomWand } from './magic.js';
import { AudioManager } from './audio.js';
import { BiomeMap } from './map.js';
import { DevMode } from './dev.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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
                else if (dimension === 'caverns') centerBlocks = generateCavernsChunk(cx, cz, params);
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
                                    const idxUp1 = ((y + 1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                                    const idxUp2 = ((y + 2) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                                    if (centerBlocks[idxUp1] === BLOCKS.AIR && centerBlocks[idxUp2] === BLOCKS.AIR) {
                                        return { x: cx * CHUNK_SIZE + x, y: y + 1, z: cz * CHUNK_SIZE + z };
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

    return { x: CHUNK_SIZE / 2, y: (dimension === 'nether' || dimension === 'aether') ? 60 : CHUNK_HEIGHT + 10, z: CHUNK_SIZE / 2 };
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

        const tex = atlas.texture;
        
        // Helper to clone texture for a specific face to set its UVs
        const makeMat = (uvData) => {
            const faceTex = tex.clone();
            faceTex.repeat.set(uvData.uSize, uvData.vSize);
            faceTex.offset.set(uvData.u, uvData.v);
            faceTex.needsUpdate = true;
            return new THREE.MeshLambertMaterial({ map: faceTex });
        };
        
        // Materials order for BoxGeometry: right (+x), left (-x), top (+y), bottom (-y), front (+z), back (-z)
        const sideMat = makeMat(atlas.getUV(window.BLOCKS.CHEST_BLOCK, 'side'));
        const topMat = makeMat(atlas.getUV(window.BLOCKS.CHEST_BLOCK, 'top'));
        const botMat = makeMat(atlas.getUV(window.BLOCKS.CHEST_BLOCK, 'bottom'));
        const frontMat = makeMat(atlas.getUV(window.BLOCKS.CHEST_BLOCK, 'front'));
        
        const chestMaterials = [sideMat, sideMat, topMat, botMat, frontMat, sideMat];
        
        // Base
        const baseGeo = new THREE.BoxGeometry(0.875, 0.625, 0.875);
        baseGeo.translate(0, 0.3125, 0); // Origin at bottom center
        const baseMesh = new THREE.Mesh(baseGeo, chestMaterials);
        this.group.add(baseMesh);

        // Lid
        const lidGeo = new THREE.BoxGeometry(0.875, 0.25, 0.875);
        lidGeo.translate(0, 0.125, 0.4375); // Origin at hinge (back edge)
        this.lidMesh = new THREE.Mesh(lidGeo, chestMaterials);
        this.lidMesh.position.set(0, 0.625, -0.4375);
        this.group.add(this.lidMesh);

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
            if (c.material) {
                if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                else c.material.dispose();
            }
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
        this.isPaused = false;
        
        this._boundLoop = this.loop.bind(this);

        // UI start is handled in window.onload
    }

    start() {
        if (this.hasStarted) return;
        this.hasStarted = true;

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
        this.composer = new EffectComposer(this.engine.renderer);
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.bokehPass);
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

        // Generate textures
        this.atlas = createTextureAtlas();

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
            if (oldType === BLOCKS.AIR || oldType === BLOCKS.WATER || oldType === BLOCKS.LAVA || oldType === BLOCKS.SWAMP_WATER) return;
            // When replaced by a fluid (water or lava) or air (player breaking)
            const props = getBlockProperties(oldType);
            
            // Ore blocks drop material items instead of themselves
            const ORE_DROPS = {
                [BLOCKS.IRON_ORE]:    { subtype: 'iron_ingot', name: 'Iron Ingot' },
                [BLOCKS.GOLD_ORE]:    { subtype: 'gold_ingot', name: 'Gold Ingot' },
                [BLOCKS.CRYSTAL_ORE]: { subtype: 'diamond', name: 'Diamond' },
                [BLOCKS.DIAMOND_ORE]: { subtype: 'diamond', name: 'Diamond' },
                [BLOCKS.MANA_ORE]:    { subtype: 'mana_crystal', name: 'Mana Crystal' },
                [BLOCKS.COAL_ORE]:    { subtype: 'coal', name: 'Coal' },
            };
            const oreDrop = ORE_DROPS[oldType];
            if (oreDrop) {
                const matItem = new Item('material', oreDrop.subtype, {}, oreDrop.name);
                matItem.stackable = true;
                matItem.maxStack = 64;
                this.entityManager.spawnItem(matItem, 1, new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
            } else {
                const dropType = props.drops !== undefined && props.drops !== null ? props.drops : oldType;
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

        const overlayGeo = new THREE.BoxGeometry(1.03, 1.03, 1.03);
        const overlayMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0 });
        this.miningOverlay = new THREE.Mesh(overlayGeo, overlayMat);
        this.engine.scene.add(this.miningOverlay);
        this.miningOverlay.visible = false;

        // View Model (Hands/Wand)
        this.viewModel = new THREE.Group();
        this.handMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.6, 0.2),
            new THREE.MeshLambertMaterial({ color: 0xe0ac69 }) // skin tone
        );
        this.handMesh.position.set(0.4, -0.4, -0.5);
        this.handMesh.rotation.x = -Math.PI / 4;
        this.handMesh.rotation.z = -Math.PI / 6;
        this.viewModel.add(this.handMesh);
        this.engine.camera.add(this.viewModel);
        this.engine.scene.add(this.engine.camera); // Needed for child objects to render
        this.heldItemMesh = null;

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
                    else if (below === window.BLOCKS.CAVERN_PORTAL) { portalType = 'cavern'; this.world.setBlock(x, y - 1, z, window.BLOCKS.STONE); }
                    else if (below === window.BLOCKS.HIGHLANDS_PORTAL) { portalType = 'highlands'; this.world.setBlock(x, y - 1, z, window.BLOCKS.DIRT); }
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
                } else if (portalType === 'cavern') {
                    lootTable = [
                        { item: Item.blockItem(window.BLOCKS.COAL_ORE, 'Coal Ore'), maxCount: 10, chance: 0.8 },
                        { item: new Item('material', 'iron_ingot', {}, 'Iron Ingot'), maxCount: 6, chance: 0.7 },
                        { item: Item.equipmentItem('pickaxe_iron', { mineSpeed: 2, damage: 4 }, 'Iron Pickaxe'), maxCount: 1, chance: 0.5 }
                    ];
                } else if (portalType === 'highlands') {
                    lootTable = [
                        { item: Item.blockItem(window.BLOCKS.COBBLESTONE, 'Cobblestone'), maxCount: 20, chance: 1.0 },
                        { item: new Item('material', 'emerald', {}, 'Emerald'), maxCount: 4, chance: 0.4 },
                        { item: Item.equipmentItem('sword_stone', { damage: 5 }, 'Stone Sword'), maxCount: 1, chance: 0.6 }
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
        
        // Build material from texture atlas
        const uvInfo = this.atlas.getUV(window.BLOCKS.DUNGEON_DOOR);
        
        // Map the UVs correctly so the door texture maps cleanly to the 1x1 face
        const uvs = doorGeom.attributes.uv.array;
        for (let i = 0; i < 6; i++) {
            for (let v = 0; v < 6; v++) {
                const baseU = uvs[i * 12 + v * 2];
                const baseV = uvs[i * 12 + v * 2 + 1];
                uvs[i * 12 + v * 2] = uvInfo.u + baseU * uvInfo.uSize;
                uvs[i * 12 + v * 2 + 1] = uvInfo.v + baseV * uvInfo.vSize;
            }
        }
        
        const mat = new THREE.MeshLambertMaterial({ 
            map: this.atlas.texture, 
            transparent: false, 
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });
        
        // Pivot point should be on the edge, not center
        doorGeom.translate(0.5, 0.5, 0); 
        
        const doorGroup = new THREE.Group();
        const meshBot = new THREE.Mesh(doorGeom, mat);
        const meshTop = new THREE.Mesh(doorGeom, mat);
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
                if (subtype === 'raw_fish') return { type: 'food', subtype: 'cooked_fish', name: 'Cooked Fish', stackable: true, maxStack: 64, data: { heal: 25 }, id: `food_cooked_fish` };
            }
            return null;
        };

        const isFuel = (fuelItem) => {
            if (!fuelItem || !fuelItem.item) return false;
            const t = fuelItem.item.type;
            const s = fuelItem.item.subtype;
            if (t === 'material' && (s === 'coal' || s === 'stick')) return true;
            if (t === 'block' && (s === window.BLOCKS.PLANKS || s === window.BLOCKS.WOOD || s === window.BLOCKS.LEAVES)) return true;
            if (t === 'equipment' && (s === 'wood_pickaxe' || s === 'wood_axe' || s === 'wood_sword' || s === 'wood_shovel')) return true;
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
                // Determine fuel value
                let fuelVal = 10.0; // Sticks/Planks
                if (f.fuel.item.subtype === 'coal') fuelVal = 40.0; // 8 items (5s each)
                
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
                    f.progress += dt / 5.0; // 5 seconds to smelt 1 item
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
            ch.innerHTML = '<div class="ch ch-h"></div><div class="ch ch-v"></div><div class="ch ch-dot"></div>';
            document.body.appendChild(ch);
        }
        // Damage flash
        if (!document.getElementById('damage-flash')) {
            const df = document.createElement('div');
            df.id = 'damage-flash';
            document.body.appendChild(df);
        }
        // HUD bars
        if (!document.getElementById('health-container')) {
            const hud = document.createElement('div');
            hud.innerHTML = `
                <div id="health-container" class="bar-container">
                    <span class="bar-icon">♥</span>
                    <div class="bar-track"><div class="bar-fill health-fill" id="health-fill"></div></div>
                    <span class="bar-text" id="health-text">100/100</span>
                </div>
                <div id="mana-container" class="bar-container">
                    <span class="bar-icon">★</span>
                    <div class="bar-track"><div class="bar-fill mana-fill" id="mana-fill"></div></div>
                    <span class="bar-text" id="mana-text">100/100</span>
                </div>
            `;
            document.body.appendChild(hud);
        }
        // Minimap Overlay
        if (!document.getElementById('minimap-overlay')) {
            const mmo = document.createElement('div');
            mmo.id = 'minimap-overlay';
            mmo.style.cssText = 'position: absolute; top: 20px; right: 20px; width: 200px; height: 200px; pointer-events: none; z-index: 100; font-family: Outfit, sans-serif; border: 4px solid black; box-shadow: 0 0 15px rgba(0,0,0,0.8);';
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
                // Wooden staff handle
                const staff = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.015, 0.025, 0.6, 6),
                    new THREE.MeshLambertMaterial({ color: 0x5c4033 })
                );
                staff.position.y = -0.1;
                this.heldItemMesh.add(staff);
                
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
                const iconCanvas = generateItemTexture(slot.item.type, slot.item.subtype);
                const tex = new THREE.CanvasTexture(iconCanvas);
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                tex.colorSpace = THREE.SRGBColorSpace;

                const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
                this.heldItemMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), mat);
                this.heldItemMesh.position.set(0.4, -0.2, -0.8);
            }
            this.heldItemMesh.userData.item = slot.item;
            this.viewModel.add(this.heldItemMesh);
        }

        // Left click (Attack / Mine / Magic)
        if (this.input.mouse.leftClick) {
            this.viewModel.rotation.x += (-0.5 - this.viewModel.rotation.x) * 0.2; // swing animation (lerp)

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
            } else if (entityHit.hit && this.breakTimer === 0) { // Attack entity
                let damage = 5; // Unarmed base damage
                if (slot && slot.item.type === 'equipment' && slot.item.data.equipData && slot.item.data.equipData.damage) {
                    damage = slot.item.data.equipData.damage;
                } else if (slot && slot.item.type === 'wand') {
                    damage = 10;
                }
                entityHit.mob.takeDamage(damage, lookDir);
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
                if (slot && slot.item.type === 'equipment' && slot.item.data.equipData && slot.item.data.equipData.mineSpeed) {
                    mineMult = slot.item.data.equipData.mineSpeed;
                }
                
                const breakTime = ((blockProps.health || 1) * 0.1) / mineMult;
                
                this.miningOverlay.visible = true;
                this.miningOverlay.position.set(hit.blockPos.x + 0.5, hit.blockPos.y + 0.5, hit.blockPos.z + 0.5);
                this.miningOverlay.material.opacity = (this.breakTimer / breakTime) * 0.8;

                if (this.breakTimer >= breakTime) {
                    const blockType = this.world.getBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    // The setBlock call will trigger onBlockDestroyed which spawns the item
                    this.world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, BLOCKS.AIR);
                    
                    if (blockType === BLOCKS.TORCH || blockType === BLOCKS.GLOWSTONE) this.torchSystem.removeTorch(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    
                    this.audio.playBreak(blockType);
                    this.breakTimer = 0;
                    this.miningOverlay.visible = false;
                }
            }
        } else {
            this.viewModel.rotation.x = 0;
            this.breakTimer = 0;
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

            if (slot && slot.item.subtype === 'flint_and_steel' && hit.hit) {
                // If clicked on Obsidian, Glowstone, Dirt, Stone, or Cobblestone, try to light a portal
                if (hit.blockType === window.BLOCKS.OBSIDIAN || hit.blockType === window.BLOCKS.GLOWSTONE || hit.blockType === window.BLOCKS.DIRT || hit.blockType === window.BLOCKS.GRASS || hit.blockType === window.BLOCKS.STONE || hit.blockType === window.BLOCKS.COBBLESTONE) {
                    this.tryLightPortal(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    this.audio.playHit();
                } else if (hit.blockType === window.BLOCKS.TNT) {
                    this.igniteTNT(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    this.audio.playHit(); // Play fizz sound ideally
                } else if (hit.face) {
                    const nx = hit.blockPos.x + hit.face.x;
                    const ny = hit.blockPos.y + hit.face.y;
                    const nz = hit.blockPos.z + hit.face.z;
                    if (this.world.getBlock(nx, ny, nz) === window.BLOCKS.AIR) {
                        this.world.setBlock(nx, ny, nz, window.BLOCKS.FIRE);
                        this.audio.playHit();
                    }
                }
                this.input.mouse.rightClick = false;
                return;
            }

            if (hit.hit && hit.blockType === window.BLOCKS.CHEST_BLOCK) {
                // Open Chest
                this.audio.playClick(); // Or a specific chest open sound
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
                
                this.ui.toggleFurnace(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, this.furnaces.get(key), () => {
                    this.input.requestPointerLock();
                });
                document.exitPointerLock();
                this.input.mouse.rightClick = false;
                return;
            }
            if (hit.hit && hit.blockType === window.BLOCKS.DUNGEON_DOOR) {
                this.audio.playClick();
                
                const key = `${hit.blockPos.x},${hit.blockPos.y},${hit.blockPos.z}`;
                const keyLower = `${hit.blockPos.x},${hit.blockPos.y - 1},${hit.blockPos.z}`;
                
                let door = this.doors.get(key);
                if (!door) door = this.doors.get(keyLower);
                
                if (door) {
                    door.isOpen = !door.isOpen;
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
                    this.audio.playHit(); // Magical sound 
                    
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
                            this.audio.playPlace();
                        }
                    } else if (targetBlock === BLOCKS.LAVA) {
                        const data = this.world.getData(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                        if (data === 0) {
                            this.world.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, BLOCKS.AIR);
                            slot.item = { type: 'material', subtype: 'lava_bucket', name: 'Lava Bucket', stackable: false, maxStack: 1, data: {} };
                            this.audio.playPlace();
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
                        this.audio.playPlace();
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
                        this.audio.playPlace();
                    }
                }
                this.input.mouse.rightClick = false;
                return;
            } else if (slot && slot.item.type === 'block' && hit.hit) {
                // Place block
                const placePos = { x: hit.blockPos.x + hit.normal.x, y: hit.blockPos.y + hit.normal.y, z: hit.blockPos.z + hit.normal.z };
                const curBlock = this.world.getBlock(placePos.x, placePos.y, placePos.z);
                if (curBlock === BLOCKS.AIR || curBlock === BLOCKS.WATER || curBlock === BLOCKS.SWAMP_WATER || curBlock === BLOCKS.LAVA) {
                    if (slot.item.subtype === BLOCKS.DUNGEON_DOOR) {
                        const curBlockTop = this.world.getBlock(placePos.x, placePos.y + 1, placePos.z);
                        if (curBlockTop === BLOCKS.AIR || curBlockTop === BLOCKS.WATER || curBlockTop === BLOCKS.SWAMP_WATER || curBlockTop === BLOCKS.LAVA) {
                            this.world.setBlock(placePos.x, placePos.y, placePos.z, slot.item.subtype);
                            this.world.setBlock(placePos.x, placePos.y + 1, placePos.z, slot.item.subtype);
                            this.audio.playPlace();
                            slot.count--;
                            if (slot.count <= 0) {
                                this.player.inventory.slots[this.player.selectedSlot] = null;
                            }
                        }
                    } else {
                        this.world.setBlock(placePos.x, placePos.y, placePos.z, slot.item.subtype);
                        if (slot.item.subtype === BLOCKS.TORCH || slot.item.subtype === BLOCKS.GLOWSTONE) this.torchSystem.addTorch(placePos.x, placePos.y, placePos.z);
                        this.audio.playPlace();
                        slot.count--;
                        if (slot.count <= 0) {
                            this.player.inventory.slots[this.player.selectedSlot] = null;
                        }
                    }
                }
            } else if (slot && slot.item.type === 'food') {
                if (this.player.health < this.player.maxHealth) {
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + (slot.item.data.heal || 10));
                    this.audio.playHit();
                    this.particles.emit(this.player.position, 'explosion', 10, 0x33cc33);
                    slot.count--;
                    if (slot.count <= 0) {
                        this.player.inventory.slots[this.player.selectedSlot] = null;
                    }
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
                this.buildLitPortal(p.x, p.y, p.z, this.pendingPortal.isNether, this.pendingPortal.isAether, this.pendingPortal.isCaverns, this.pendingPortal.isHighlands);
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
            this.ui.toggle();
            if (this.ui.isOpen) {
                if (this.input.isPointerLocked()) document.exitPointerLock();
            } else {
                this.input.requestPointerLock();
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

        if (this.input.menuKeys.debug) {
            this.input.menuKeys.debug = false;
            const di = document.getElementById('debug-info');
            if (di) di.classList.toggle('hidden');
        }

        if (this.isPaused) {
            this.input.resetMouse();
            // Continue loading chunks while paused
            const chunkGenFn = this.currentDimension === 'nether' ? generateNetherChunk : (this.currentDimension === 'aether' ? generateAetherChunk : (this.currentDimension === 'caverns' ? generateCavernsChunk : generateChunkTerrain));
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
                    this.audio.playFootstep();
                }
            } else {
                this.footstepTimer = 0.45; // trigger immediately next step
            }

            if (this.currentDimension === 'highlands') {
                this.player.speedMult = 3.0; // Super fast speed
                this.player.jumpSpeed = 16.0; // 2x jump height (base is 8.0)
            } else {
                this.player.speedMult = 1.0;
                this.player.jumpSpeed = 8.0;
            }
            
            this.player.update(dt, this.input.keys, this.input.mouse, this.world);
            this.handleInput(dt);

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
                this.audio.playHit();
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

        // Update Camera to match player eyes
        const eyePos = this.player.getEyePosition();
        this.engine.camera.position.copy(eyePos);
        this.engine.camera.position.y += Math.abs(bobOffset); // Upward bounce

        const lookDir = this.player.getLookDirection();
        this.engine.camera.lookAt(eyePos.clone().add(lookDir));
        // Add subtle tilt based on bob
        this.engine.camera.rotateZ(bobOffset * 0.05);
        // Check Portal Warp
        const pbx = Math.floor(this.player.position.x);
        const pby = Math.floor(this.player.position.y);
        const pbz = Math.floor(this.player.position.z);
        const pBlock = this.world.getBlock(pbx, pby, pbz);
        if (pBlock === BLOCKS.PORTAL && !this.isWarping) {
            this.warpToNewPlanet(this.currentDimension === 'nether' ? 'overworld' : 'nether');
            this.audio.playHit();
        } else if (pBlock === window.BLOCKS.AETHER_PORTAL && !this.isWarping) {
            this.warpToNewPlanet(this.currentDimension === 'aether' ? 'overworld' : 'aether');
            this.audio.playHit();
        } else if (pBlock === window.BLOCKS.CAVERN_PORTAL && !this.isWarping) {
            this.warpToNewPlanet(this.currentDimension === 'caverns' ? 'overworld' : 'caverns');
            this.audio.playHit();
        } else if (pBlock === window.BLOCKS.HIGHLANDS_PORTAL && !this.isWarping) {
            this.warpToNewPlanet(this.currentDimension === 'highlands' ? 'overworld' : 'highlands');
            this.audio.playHit();
        }
        
        const chunkGenFn = this.currentDimension === 'nether' ? generateNetherChunk : (this.currentDimension === 'aether' ? generateAetherChunk : (this.currentDimension === 'caverns' ? generateCavernsChunk : (this.currentDimension === 'highlands' ? generateHighlandsChunk : generateChunkTerrain)));
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

        this.lighting.update(dt, this.engine.camera.position, isUnderwater, this.currentDimension);

        if (this.engine.scene.fog) {
            // Keep track of the original planet fog density for Systems to use
            if (this.engine.scene.fog.baseDensity === undefined) {
                this.engine.scene.fog.baseDensity = this.engine.scene.fog.density;
            }
        }
        this.particles.update(dt);
        this.torchSystem.update(dt, this.engine.camera.position);
        this.cloudSystem.update(dt, this.engine.camera.position);
        this.entityManager.update(dt, this.world, this.player.position, this.player.inventory, this.player, this.lighting.timeOfDay, this.currentDimension);

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

        // Ambient Biome Particles
        if (Math.random() < 0.3 && this.currentDimension === 'overworld') {
            const px = this.player.position.x;
            const pz = this.player.position.z;
            const { biome } = getBiomeParams(px, pz, this.planetParams);
            
            if (biome.isCherry || biome.name === 'Cherry Grove') {
                const pos = this.player.position.clone();
                pos.x += (Math.random() - 0.5) * 20;
                pos.z += (Math.random() - 0.5) * 20;
                pos.y += 5 + Math.random() * 5;
                this.particles.emit(pos, 'leaf', 1, 0xffb7c5);
            } else if (biome.name === 'Autumn Forest') {
                const pos = this.player.position.clone();
                pos.x += (Math.random() - 0.5) * 20;
                pos.z += (Math.random() - 0.5) * 20;
                pos.y += 5 + Math.random() * 5;
                const colors = [0xff8800, 0xcc4400, 0xffaa00];
                this.particles.emit(pos, 'leaf', 1, colors[Math.floor(Math.random()*colors.length)]);
            } else if (biome.alienFlora) {
                const pos = this.player.position.clone();
                pos.x += (Math.random() - 0.5) * 20;
                pos.z += (Math.random() - 0.5) * 20;
                pos.y += Math.random() * 5;
                this.particles.emit(pos, 'leaf', 1, 0x00ffcc);
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
                    this.player.takeDamage(proj.stats.damage);
                    const d = document.getElementById('damage-flash');
                    if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
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
            if (Math.random() < 0.1) this.audio.playHit(); // small sizzle sound
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
            const isUnderground = this.currentDimension === 'nether' || this.currentDimension === 'caverns' || (this.engine.planetParams && this.engine.planetParams.theme === 'nether');
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
        if (di && !di.classList.contains('hidden')) {
            try {
                const bx = Math.floor(this.player.position.x);
                const by = Math.floor(this.player.position.y);
                const bz = Math.floor(this.player.position.z);
                const biome = this.world.getBiomeAt(bx, bz)?.name || 'Unknown';
                
                const lookDir = this.player.getLookDirection();
                const eyePos = this.player.getEyePosition();
                
                const invSlot = this.player.inventory.slots[this.player.selectedSlot];
                const isHoldingBucket = invSlot && invSlot.item && invSlot.item.type === 'material' && (invSlot.item.subtype === 'bucket' || invSlot.item.subtype === 'water_bucket' || invSlot.item.subtype === 'lava_bucket');
                const hit = this.world.raycast(eyePos, lookDir, 8, isHoldingBucket);
                const lookBlockName = hit.hit ? `${getBlockName(hit.blockType)} [${hit.blockPos.x}, ${hit.blockPos.y}, ${hit.blockPos.z}]` : 'None';
                
                di.innerHTML = `SlopCraft 3D (Debug Mode)<br>
FPS: ${this.fps}<br>
XYZ: ${this.player.position.x.toFixed(2)}, ${this.player.position.y.toFixed(2)}, ${this.player.position.z.toFixed(2)}<br>
Biome: ${biome}<br>
Looking at: ${lookBlockName}<br>
Chunks: ${this.world.chunks.size} | Mobs: ${this.entityManager.mobs.length} | Render Distance: ${this.world.renderDistance}`;
            } catch (e) {
                di.innerHTML = `F3 Error: ${e.message}`;
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

    warpToNewPlanet(targetDim = 'nether') {
        if (!this.isReady) return;
        this.isReady = false;
        this.isWarping = true;

        const isAether = targetDim === 'aether';
        const isCaverns = targetDim === 'caverns';
        const isHighlands = targetDim === 'highlands';
        const isWarpingToDim = targetDim !== 'overworld';

        if (isWarpingToDim) {
            // Save the exact position we left from and the portal type
            this.overworldReturnPos = this.player.position.clone();
            this.lastPortalDim = targetDim;
        }

        // Simple screen fade
        const fade = document.createElement('div');
        fade.style.position = 'fixed';
        fade.style.top = '0'; fade.style.left = '0';
        fade.style.width = '100%'; fade.style.height = '100%';
        fade.style.backgroundColor = isWarpingToDim ? (isAether ? 'white' : (isHighlands ? '#00ffff' : '#400000')) : 'white';
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

            // Clear World
            for (const chunk of this.world.chunks.values()) {
                chunk.dispose();
            }
            this.world.chunks.clear();
            this.world.chunksToGenerate = [];
            this.world.chunksToBuild = [];

            // Clear entities
            for (const mob of this.entityManager.mobs) mob.dispose();
            this.entityManager.mobs = [];
            for (const item of this.entityManager.items) item.dispose();
            this.entityManager.items = [];

            // Reset Player
            let spawnPos;
            if (isWarpingToDim) {
                spawnPos = findSafeSpawn(this.planetParams, targetDim);
                this.pendingPortal = { pos: spawnPos, isNether: targetDim === 'nether', isAether: targetDim === 'aether', isCaverns: targetDim === 'caverns', isHighlands: targetDim === 'highlands' };
            } else {
                spawnPos = this.overworldReturnPos || findSafeSpawn(this.planetParams, 'overworld');
                // Use the saved portal type for the return portal
                const returnDim = this.lastPortalDim || 'nether';
                this.pendingPortal = { pos: spawnPos, isNether: returnDim === 'nether', isAether: returnDim === 'aether', isCaverns: returnDim === 'caverns', isHighlands: returnDim === 'highlands' };
            }
            // Center player in the block to avoid wall clipping
            this.player.position.set(spawnPos.x + 0.5, spawnPos.y, spawnPos.z + 0.5);
            this.player.velocity.set(0, 0, 0);

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

    buildLitPortal(px, py, pz, isNether, isAether = false, isCaverns = false, isHighlands = false) {
        const startX = Math.floor(px) - 1;
        const startY = Math.floor(py);
        const startZ = Math.floor(pz) - 3; // Offset portal 3 blocks away
        
        let frameBlock = window.BLOCKS.OBSIDIAN;
        if (isAether) frameBlock = window.BLOCKS.GLOWSTONE;
        if (isCaverns) frameBlock = window.BLOCKS.DIRT;
        if (isHighlands) frameBlock = window.BLOCKS.STONE;

        let interiorBlock = window.BLOCKS.PORTAL;
        if (isAether) interiorBlock = window.BLOCKS.AETHER_PORTAL;
        if (isCaverns) interiorBlock = window.BLOCKS.CAVERN_PORTAL;
        if (isHighlands) interiorBlock = window.BLOCKS.HIGHLANDS_PORTAL;

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
        let floorBlock = window.BLOCKS.OBSIDIAN;
        if (isNether) floorBlock = window.BLOCKS.NETHERRACK;
        if (isAether) floorBlock = window.BLOCKS.AETHER_STONE;
        if (isCaverns) floorBlock = window.BLOCKS.CAVERN_STONE;
        if (isHighlands) floorBlock = window.BLOCKS.HIGHLANDS_STONE;

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

    igniteTNT(x, y, z) {
        // Replace TNT with air
        this.world.setBlock(x, y, z, window.BLOCKS.AIR);
        // Spawn some smoke to show it's lit
        this.particles.emit({x: x + 0.5, y: y + 1, z: z + 0.5}, 'smoke', 5, 0xaaaaaa);
        
        // Wait 2 seconds then explode
        setTimeout(() => {
            this.explodeTNT(x, y, z);
        }, 2000);
    }

    explodeTNT(x, y, z) {
        const radius = 3;
        for (let ix = x - radius; ix <= x + radius; ix++) {
            for (let iy = y - radius; iy <= y + radius; iy++) {
                for (let iz = z - radius; iz <= z + radius; iz++) {
                    const distSq = (ix - x) ** 2 + (iy - y) ** 2 + (iz - z) ** 2;
                    if (distSq <= radius ** 2) {
                        const block = this.world.getBlock(ix, iy, iz);
                        if (block !== window.BLOCKS.AIR && block !== window.BLOCKS.BEDROCK && block !== window.BLOCKS.WATER) {
                            this.world.setBlock(ix, iy, iz, window.BLOCKS.AIR);
                        }
                    }
                }
            }
        }
        
        // Damage nearby entities
        for (const [id, entity] of this.entities.entries()) {
            const dist = entity.mesh.position.distanceTo(new THREE.Vector3(x, y, z));
            if (dist < radius + 2) {
                // Damage falls off over distance, max 40 damage
                const dmg = Math.floor(40 * (1 - dist / (radius + 2)));
                this.damageEntity(entity, dmg);
            }
        }
        // Also damage player
        const pDist = this.player.camera.position.distanceTo(new THREE.Vector3(x, y, z));
        if (pDist < radius + 2) {
            const dmg = Math.floor(40 * (1 - pDist / (radius + 2)));
            this.player.takeDamage(dmg);
        }

        // Effects
        this.particles.emit(new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5), 'explosion', 50, 0xffaa00);
        this.audio.playHit(); // Ideally an explosion sound
    }

    tryLightPortal(startX, startY, startZ) {
        // First try Obsidian -> Nether Portal
        if (this._tryLightPortalType(startX, startY, startZ, [window.BLOCKS.OBSIDIAN, window.BLOCKS.PORTAL_FRAME], window.BLOCKS.PORTAL)) return;
        
        // Then try Glowstone -> Aether Portal
        if (this._tryLightPortalType(startX, startY, startZ, [window.BLOCKS.GLOWSTONE], window.BLOCKS.AETHER_PORTAL)) return;
        
        // Then try Dirt -> Caverns Portal
        if (this._tryLightPortalType(startX, startY, startZ, [window.BLOCKS.DIRT, window.BLOCKS.GRASS], window.BLOCKS.CAVERN_PORTAL)) return;

        // Then try Stone or Cobblestone -> Highlands Portal
        if (this._tryLightPortalType(startX, startY, startZ, [window.BLOCKS.STONE, window.BLOCKS.COBBLESTONE], window.BLOCKS.HIGHLANDS_PORTAL)) return;
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
window.onload = () => {
    const game = new Game();
    window.game = game;
    const startBtn = document.getElementById('btn-new-game');
    if (startBtn) {
        startBtn.onclick = () => {
            document.getElementById('start-screen').classList.add('hidden');
            game.start();
        };
    } else {
        game.start(); // fallback if no button
    }
};
