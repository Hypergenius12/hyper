// ============================================
// engine.js — Core Engine, Rendering, Chunks, Physics
// ============================================
import * as THREE from 'three';
import { BLOCKS, getBlockProperties, ATLAS_SIZE } from './textures.js?v=28';
import { getBiomeParams } from './generation.js';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

// ============================================
// InputManager
// ============================================
export class InputManager {
    constructor() {
        this.keys = { forward: false, backward: false, left: false, right: false, jump: false, sprint: false, crouch: false };
        this.mouse = { dx: 0, dy: 0, leftClick: false, rightClick: false, scrollDelta: 0 };
        this.menuKeys = { inventory: false, spellConfig: false, pause: false, planet: false, debug: false, dropItem: false, map: false, devMode: false };
        this._menuKeysDown = { inventory: false, spellConfig: false, pause: false, planet: false, debug: false, dropItem: false, map: false, devMode: false };
        this.hotbarIndex = -1;
        this.isLocked = false;
        this.canvas = null;
        this.keySequence = '';
        this.devModeUnlocked = false;
    }

    init(canvas) {
        this.canvas = canvas;

        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp(e), false);

        document.addEventListener('mousemove', (e) => {
            if (this.isLocked) {
                this.mouse.dx += e.movementX || 0;
                this.mouse.dy += e.movementY || 0;
            }
        }, false);

        document.addEventListener('mousedown', (e) => {
            if (!this.isLocked) return;
            if (e.button === 0) this.mouse.leftClick = true;
            if (e.button === 2) this.mouse.rightClick = true;
        }, false);

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.leftClick = false;
            if (e.button === 2) this.mouse.rightClick = false;
        }, false);

        document.addEventListener('wheel', (e) => {
            if (this.isLocked) {
                this.mouse.scrollDelta = Math.sign(e.deltaY);
            }
        }, { passive: true });

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.canvas;
        }, false);

        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    requestPointerLock() {
        if (!this.isLocked && this.canvas) {
            try {
                const promise = this.canvas.requestPointerLock();
                if (promise) {
                    promise.catch(e => {
                        console.warn('Pointer lock prevented:', e);
                        document.dispatchEvent(new Event('pointerlockerror'));
                    });
                }
            } catch (e) {
                console.warn('Pointer lock prevented:', e);
                document.dispatchEvent(new Event('pointerlockerror'));
            }
        }
    }

    resetMouse() {
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        this.mouse.scrollDelta = 0;
        this.hotbarIndex = -1;
        // Edge triggered keys reset
        this.menuKeys.inventory = false;
        this.menuKeys.spellConfig = false;
        this.menuKeys.pause = false;
        this.menuKeys.planet = false;
        this.menuKeys.map = false;
        this.menuKeys.devMode = false;
    }

    isPointerLocked() {
        return this.isLocked;
    }

    onKeyDown(e) {
        // Dev Mode sequence tracking
        if (!this.devModeUnlocked) {
            this.keySequence += e.key.toLowerCase();
            if (this.keySequence.length > 6) {
                this.keySequence = this.keySequence.substring(this.keySequence.length - 6);
            }
            if (this.keySequence.endsWith('1001')) {
                this.devModeUnlocked = true;
                this.keySequence = '';
                console.log("Dev Mode Unlocked! Press 'U' to toggle.");
            }
        } else if (e.key.toLowerCase() === 'u') {
            if (!this._menuKeysDown.devMode) {
                this.menuKeys.devMode = true;
                this._menuKeysDown.devMode = true;
            }
        }

        if (e.code === 'Tab' || e.code === 'F3') e.preventDefault();
        if (!this.isLocked && !['Escape', 'KeyE', 'KeyF', 'KeyP', 'Tab', 'KeyI', 'F3', 'KeyQ', 'KeyM', 'KeyU'].includes(e.code)) return;

        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
            case 'Space': this.keys.jump = true; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.crouch = true; break;
            case 'ControlLeft': case 'ControlRight': this.keys.sprint = true; break;
            case 'KeyC': this.keys.crouch = true; break;

            case 'Tab':
            case 'KeyI':
            case 'KeyE':
                if (!this._menuKeysDown.inventory) { this.menuKeys.inventory = true; this._menuKeysDown.inventory = true; }
                break;
            case 'KeyF':
                if (!this._menuKeysDown.spellConfig) { this.menuKeys.spellConfig = true; this._menuKeysDown.spellConfig = true; }
                break;
            case 'KeyP':
                if (!this._menuKeysDown.planet) { this.menuKeys.planet = true; this._menuKeysDown.planet = true; }
                break;
            case 'KeyM':
                if (!this._menuKeysDown.map) { this.menuKeys.map = true; this._menuKeysDown.map = true; }
                break;
            case 'Escape':
                if (!this._menuKeysDown.pause) { this.menuKeys.pause = true; this._menuKeysDown.pause = true; }
                break;
            case 'F3':
                if (!this._menuKeysDown.debug) { this.menuKeys.debug = true; this._menuKeysDown.debug = true; }
                break;
            case 'KeyQ':
                if (!this._menuKeysDown.dropItem) { this.menuKeys.dropItem = true; this._menuKeysDown.dropItem = true; }
                break;

            case 'Digit1': this.hotbarIndex = 0; break;
            case 'Digit2': this.hotbarIndex = 1; break;
            case 'Digit3': this.hotbarIndex = 2; break;
            case 'Digit4': this.hotbarIndex = 3; break;
            case 'Digit5': this.hotbarIndex = 4; break;
            case 'Digit6': this.hotbarIndex = 5; break;
            case 'Digit7': this.hotbarIndex = 6; break;
            case 'Digit8': this.hotbarIndex = 7; break;
            case 'Digit9': this.hotbarIndex = 8; break;
        }
    }

    onKeyUp(e) {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
            case 'Space': this.keys.jump = false; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.crouch = false; break;
            case 'ControlLeft': case 'ControlRight': this.keys.sprint = false; break;
            case 'KeyC': this.keys.crouch = false; break;

            case 'Tab': case 'KeyI': case 'KeyE': this._menuKeysDown.inventory = false; break;
            case 'KeyF': this._menuKeysDown.spellConfig = false; break;
            case 'KeyP': this._menuKeysDown.planet = false; break;
            case 'KeyM': this._menuKeysDown.map = false; break;
            case 'Escape': this._menuKeysDown.pause = false; break;
            case 'F3': case 'ControlLeft': case 'ControlRight': this._menuKeysDown.debug = false; break;
            case 'KeyQ': this._menuKeysDown.dropItem = false; break;
            case 'KeyU': this._menuKeysDown.devMode = false; break;
        }
    }
}

// ============================================
// GameEngine
// ============================================
export class GameEngine {
    constructor() {
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this._renderer = null;
    }

    get scene() { return this._scene; }
    get camera() { return this._camera; }
    get renderer() { return this._renderer; }

    init(canvas) {
        this._renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Shadows disabled for performance. Voxel terrain uses AO and sky colors instead.
        this._renderer.shadowMap.enabled = false;
        this._renderer.shadowMap.type = THREE.PCFShadowMap;

        // Color management
        this._renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this._renderer || !this._camera) return;
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setFog(color, near, far) {
        this._scene.fog = new THREE.Fog(color, near, far);
    }
}

// ============================================
// Chunk
// ============================================

// Face definitions: normal, vertices (x,y,z), ambient occlusion vertex indices
const FACES = [
    { dir: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], name: 'top' }, // top
    { dir: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], name: 'bottom' }, // bottom
    { dir: [1, 0, 0], v: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], name: 'side' }, // right
    { dir: [-1, 0, 0], v: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], name: 'side' }, // left
    { dir: [0, 0, 1], v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], name: 'front' }, // front
    { dir: [0, 0, -1], v: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], name: 'side' }, // back
];
// ============================================
// Mesh Generation Buffers (Shared to eliminate GC)
// ============================================
const MAX_VERTICES = 2000000; // ~600k vertices is typical for a fully solid chunk, 2M is very safe
const MAX_INDICES = Math.floor(MAX_VERTICES / 4 * 6);

const _positions = new Float32Array(MAX_VERTICES * 3);
const _normals = new Float32Array(MAX_VERTICES * 3);
const _uvs = new Float32Array(MAX_VERTICES * 2);
const _colors = new Float32Array(MAX_VERTICES * 3);

const _opaqueIndices = new Uint32Array(MAX_INDICES);
const _crossIndices = new Uint32Array(MAX_INDICES);
const _glowCrossIndices = new Uint32Array(MAX_INDICES);
const _waterIndices = new Uint32Array(MAX_INDICES);
const _transparentIndices = new Uint32Array(MAX_INDICES);
const _glowOpaqueIndices = new Uint32Array(MAX_INDICES);
const _glowTransparentIndices = new Uint32Array(MAX_INDICES);


const _meshPool = [];

export class Chunk {
    constructor(cx, cz) {
        this.cx = cx;
        this.cz = cz;
        this.blocks = new Uint16Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        this.data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        this.mesh = null;
        this.dirty = false;
    }

    getBlock(lx, ly, lz) {
        if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE) return BLOCKS.AIR;
        return this.blocks[(ly * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx];
    }

    setBlock(lx, ly, lz, type) {
        if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE) return;
        this.blocks[(ly * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx] = type;
        this.dirty = true;
    }

    getData(lx, ly, lz) {
        if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE) return 0;
        return this.data[(ly * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx];
    }

    setData(lx, ly, lz, dataValue) {
        if (lx < 0 || lx >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE) return;
        this.data[(ly * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx] = dataValue;
    }

    buildMesh(atlas, neighborChunks) {
        // Create an optimized local getter to avoid Hash Map lookups across chunk boundaries
        const getBlockOptimized = (wx, wy, wz) => {
            if (wy < 0 || wy >= CHUNK_HEIGHT) return BLOCKS.AIR;
            const dcx = Math.floor(wx / CHUNK_SIZE) - this.cx;
            const dcz = Math.floor(wz / CHUNK_SIZE) - this.cz;
            if (dcx >= -1 && dcx <= 1 && dcz >= -1 && dcz <= 1) {
                const c = neighborChunks[dcx + 1][dcz + 1];
                if (c) {
                    const lx = wx - (this.cx + dcx) * CHUNK_SIZE;
                    const lz = wz - (this.cz + dcz) * CHUNK_SIZE;
                    return c.blocks[(wy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx];
                }
            }
            return BLOCKS.AIR;
        };

        let posCount = 0;
        let uvCount = 0;
        let colorCount = 0;

        let opaqueIndexCount = 0;
        let crossIndexCount = 0;
        let glowCrossIndexCount = 0;
        let waterIndexCount = 0;
        let transparentIndexCount = 0;
        let glowOpaqueIndexCount = 0;
        let glowTransparentIndexCount = 0;

        let vertexCount = 0;

        const wxBase = this.cx * CHUNK_SIZE;
        const wzBase = this.cz * CHUNK_SIZE;

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const blockType = this.getBlock(x, y, z);
                    if (blockType === BLOCKS.AIR || blockType === BLOCKS.CHEST_BLOCK || blockType === BLOCKS.DUNGEON_DOOR) continue;

                    const wx = wxBase + x;
                    const wz = wzBase + z;
                    const props = getBlockProperties(blockType);

                    if (props.isCross) {
                        const uvInfo = atlas.getUV(blockType, 'side');
                        // Diagonal 1
                        _positions[posCount++] = x; _positions[posCount++] = y; _positions[posCount++] = z;
                        _positions[posCount++] = x + 1; _positions[posCount++] = y; _positions[posCount++] = z + 1;
                        _positions[posCount++] = x + 1; _positions[posCount++] = y + 1; _positions[posCount++] = z + 1;
                        _positions[posCount++] = x; _positions[posCount++] = y + 1; _positions[posCount++] = z;
                        
                        _normals[posCount - 12] = 0; _normals[posCount - 11] = 1; _normals[posCount - 10] = 0;
                        _normals[posCount - 9] = 0; _normals[posCount - 8] = 1; _normals[posCount - 7] = 0;
                        _normals[posCount - 6] = 0; _normals[posCount - 5] = 1; _normals[posCount - 4] = 0;
                        _normals[posCount - 3] = 0; _normals[posCount - 2] = 1; _normals[posCount - 1] = 0;

                        _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v;
                        _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v;
                        _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                        _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;

                        _colors[colorCount++] = 1; _colors[colorCount++] = 1; _colors[colorCount++] = 1;
                        _colors[colorCount++] = 1; _colors[colorCount++] = 1; _colors[colorCount++] = 1;
                        _colors[colorCount++] = 1; _colors[colorCount++] = 1; _colors[colorCount++] = 1;
                        _colors[colorCount++] = 1; _colors[colorCount++] = 1; _colors[colorCount++] = 1;

                        // Diagonal 2
                        _positions[posCount++] = x; _positions[posCount++] = y; _positions[posCount++] = z + 1;
                        _positions[posCount++] = x + 1; _positions[posCount++] = y; _positions[posCount++] = z;
                        _positions[posCount++] = x + 1; _positions[posCount++] = y + 1; _positions[posCount++] = z;
                        _positions[posCount++] = x; _positions[posCount++] = y + 1; _positions[posCount++] = z + 1;

                        _normals[posCount - 12] = 0; _normals[posCount - 11] = 1; _normals[posCount - 10] = 0;
                        _normals[posCount - 9] = 0; _normals[posCount - 8] = 1; _normals[posCount - 7] = 0;
                        _normals[posCount - 6] = 0; _normals[posCount - 5] = 1; _normals[posCount - 4] = 0;
                        _normals[posCount - 3] = 0; _normals[posCount - 2] = 1; _normals[posCount - 1] = 0;

                        _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v;
                        _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v;
                        _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;
                        _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize;

                        _colors[colorCount++] = 1; _colors[colorCount++] = 1; _colors[colorCount++] = 1;
                        _colors[colorCount++] = 1; _colors[colorCount++] = 1; _colors[colorCount++] = 1;
                        _colors[colorCount++] = 1; _colors[colorCount++] = 1; _colors[colorCount++] = 1;
                        _colors[colorCount++] = 1; _colors[colorCount++] = 1; _colors[colorCount++] = 1;

                        if (blockType === BLOCKS.TORCH) {
                            _glowCrossIndices[glowCrossIndexCount++] = vertexCount; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 1; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 2;
                            _glowCrossIndices[glowCrossIndexCount++] = vertexCount; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 2; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 3;
                            _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 4; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 5; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 6;
                            _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 4; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 6; _glowCrossIndices[glowCrossIndexCount++] = vertexCount + 7;
                        } else {
                            _crossIndices[crossIndexCount++] = vertexCount; _crossIndices[crossIndexCount++] = vertexCount + 1; _crossIndices[crossIndexCount++] = vertexCount + 2;
                            _crossIndices[crossIndexCount++] = vertexCount; _crossIndices[crossIndexCount++] = vertexCount + 2; _crossIndices[crossIndexCount++] = vertexCount + 3;
                            _crossIndices[crossIndexCount++] = vertexCount + 4; _crossIndices[crossIndexCount++] = vertexCount + 5; _crossIndices[crossIndexCount++] = vertexCount + 6;
                            _crossIndices[crossIndexCount++] = vertexCount + 4; _crossIndices[crossIndexCount++] = vertexCount + 6; _crossIndices[crossIndexCount++] = vertexCount + 7;
                        }
                        vertexCount += 8;
                    } // Missing brace added here

                    let currentBlockType = blockType;
                    let currentProps = props;

                    if (props.isCross) {
                        if (props.isWaterlogged) {
                            currentBlockType = window.BLOCKS.WATER;
                            currentProps = getBlockProperties(window.BLOCKS.WATER);
                        } else {
                            continue;
                        }
                    }

                    for (const face of FACES) {
                        const nx = x + face.dir[0];
                        const ny = y + face.dir[1];
                        const nz = z + face.dir[2];

                        let neighborType;
                        if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE || ny < 0 || ny >= CHUNK_HEIGHT) {
                            neighborType = getBlockOptimized(wx + face.dir[0], ny, wz + face.dir[2]);
                        } else {
                            // Fast path for blocks inside chunk
                            neighborType = this.blocks[(ny * CHUNK_SIZE * CHUNK_SIZE) + (nz * CHUNK_SIZE) + nx];
                        }

                        const neighborProps = getBlockProperties(neighborType);
                        
                        let effectiveNeighborType = neighborType;
                        let effectiveNeighborProps = neighborProps;
                        
                        if (neighborProps.isWaterlogged) {
                            effectiveNeighborType = window.BLOCKS.WATER;
                            effectiveNeighborProps = getBlockProperties(window.BLOCKS.WATER);
                        }

                        const bothLiquids = currentProps.isLiquid && effectiveNeighborProps.isLiquid;

                        // Render face if neighbor is transparent (and not the same transparent block, like water or leaves)
                        if (effectiveNeighborType === BLOCKS.AIR || (effectiveNeighborProps.transparent && currentBlockType !== effectiveNeighborType && !bothLiquids)) {

                            const uvInfo = atlas.getUV(currentBlockType, face.name);

                            // 4 vertices per face
                            for (let i = 0; i < 4; i++) {
                                const v = face.v[i];
                                _positions[posCount++] = x + v[0];
                                _positions[posCount++] = y + v[1];
                                _positions[posCount++] = z + v[2];
                                
                                _normals[posCount - 3] = face.dir[0];
                                _normals[posCount - 2] = face.dir[1];
                                _normals[posCount - 1] = face.dir[2];
                            }

                            // UVs mapping
                            _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v; // bottom left
                            _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v; // bottom right
                            _uvs[uvCount++] = uvInfo.u + uvInfo.uSize; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize; // top right
                            _uvs[uvCount++] = uvInfo.u; _uvs[uvCount++] = uvInfo.v + uvInfo.vSize; // top left

                            // Calculate ambient occlusion
                            const aoColor = calculateVertexAO(wx, y, wz, face, getBlockOptimized, blockType);
                            
                            let waterFade = 0;
                            if (effectiveNeighborType === BLOCKS.WATER || effectiveNeighborType === BLOCKS.SWAMP_WATER || neighborType === BLOCKS.WATER || neighborType === BLOCKS.SWAMP_WATER) {
                                let depth = Math.max(0, 22 - y);
                                waterFade = Math.min(1.0, depth / 10.0);
                            }
                            
                            const wc = { r: 0x11/255, g: 0x33/255, b: 0x66/255 };

                            for (let i = 0; i < 4; i++) {
                                let c = aoColor[i];
                                if (waterFade > 0) {
                                    _colors[colorCount++] = c * (1 - waterFade) + wc.r * waterFade;
                                    _colors[colorCount++] = c * (1 - waterFade) + wc.g * waterFade;
                                    _colors[colorCount++] = c * (1 - waterFade) + wc.b * waterFade;
                                } else {
                                    _colors[colorCount++] = c;
                                    _colors[colorCount++] = c;
                                    _colors[colorCount++] = c;
                                }
                            }

                            // Add indices — use currentProps/currentBlockType so waterlogged blocks sort as water
                            if (currentProps.transparent) {
                                if (currentBlockType === BLOCKS.WATER || currentBlockType === BLOCKS.SWAMP_WATER || currentBlockType === BLOCKS.LAVA) {
                                    _waterIndices[waterIndexCount++] = vertexCount; _waterIndices[waterIndexCount++] = vertexCount + 1; _waterIndices[waterIndexCount++] = vertexCount + 2;
                                    _waterIndices[waterIndexCount++] = vertexCount; _waterIndices[waterIndexCount++] = vertexCount + 2; _waterIndices[waterIndexCount++] = vertexCount + 3;
                                } else if (currentProps.emissive > 0) {
                                    _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 1; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 2;
                                    _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 2; _glowTransparentIndices[glowTransparentIndexCount++] = vertexCount + 3;
                                } else {
                                    _transparentIndices[transparentIndexCount++] = vertexCount; _transparentIndices[transparentIndexCount++] = vertexCount + 1; _transparentIndices[transparentIndexCount++] = vertexCount + 2;
                                    _transparentIndices[transparentIndexCount++] = vertexCount; _transparentIndices[transparentIndexCount++] = vertexCount + 2; _transparentIndices[transparentIndexCount++] = vertexCount + 3;
                                }
                            } else {
                                if (currentProps.emissive > 0) {
                                    _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 1; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 2;
                                    _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 2; _glowOpaqueIndices[glowOpaqueIndexCount++] = vertexCount + 3;
                                } else {
                                    _opaqueIndices[opaqueIndexCount++] = vertexCount; _opaqueIndices[opaqueIndexCount++] = vertexCount + 1; _opaqueIndices[opaqueIndexCount++] = vertexCount + 2;
                                    _opaqueIndices[opaqueIndexCount++] = vertexCount; _opaqueIndices[opaqueIndexCount++] = vertexCount + 2; _opaqueIndices[opaqueIndexCount++] = vertexCount + 3;
                                }
                            }
                            vertexCount += 4;
                        }
                    }
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        
        // Merge indices into one big index array
        const totalIndices = opaqueIndexCount + crossIndexCount + glowCrossIndexCount + waterIndexCount + transparentIndexCount + glowOpaqueIndexCount + glowTransparentIndexCount;
        const allIndices = new Uint32Array(totalIndices);
        
        let offset = 0;
        allIndices.set(_opaqueIndices.subarray(0, opaqueIndexCount), offset); offset += opaqueIndexCount;
        allIndices.set(_crossIndices.subarray(0, crossIndexCount), offset); offset += crossIndexCount;
        allIndices.set(_glowCrossIndices.subarray(0, glowCrossIndexCount), offset); offset += glowCrossIndexCount;
        allIndices.set(_waterIndices.subarray(0, waterIndexCount), offset); offset += waterIndexCount;
        allIndices.set(_transparentIndices.subarray(0, transparentIndexCount), offset); offset += transparentIndexCount;
        allIndices.set(_glowOpaqueIndices.subarray(0, glowOpaqueIndexCount), offset); offset += glowOpaqueIndexCount;
        allIndices.set(_glowTransparentIndices.subarray(0, glowTransparentIndexCount), offset); offset += glowTransparentIndexCount;

        geometry.setIndex(new THREE.BufferAttribute(allIndices, 1));

        let groupOffset = 0;
        geometry.addGroup(groupOffset, opaqueIndexCount, 0); groupOffset += opaqueIndexCount;
        geometry.addGroup(groupOffset, crossIndexCount, 1); groupOffset += crossIndexCount;
        geometry.addGroup(groupOffset, glowCrossIndexCount, 2); groupOffset += glowCrossIndexCount;
        geometry.addGroup(groupOffset, waterIndexCount, 3); groupOffset += waterIndexCount;
        geometry.addGroup(groupOffset, transparentIndexCount, 4); groupOffset += transparentIndexCount;
        geometry.addGroup(groupOffset, glowOpaqueIndexCount, 5); groupOffset += glowOpaqueIndexCount;
        geometry.addGroup(groupOffset, glowTransparentIndexCount, 6); groupOffset += glowTransparentIndexCount;

        geometry.setAttribute('position', new THREE.BufferAttribute(_positions.slice(0, posCount), 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(_normals.slice(0, posCount), 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(_uvs.slice(0, uvCount), 2));
        geometry.setAttribute('color', new THREE.BufferAttribute(_colors.slice(0, colorCount), 3));

        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(CHUNK_SIZE/2, CHUNK_HEIGHT/2, CHUNK_SIZE/2), 65);
        geometry.boundingBox = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE));

        // Use shared materials instead of allocating new ones
        const materials = atlas.sharedMaterials;

        if (this.mesh) {
            this.mesh.geometry.dispose();
            // DO NOT dispose materials since they are shared globally
            this.mesh.geometry = geometry;
            this.mesh.material = materials;
        } else if (_meshPool.length > 0) {
            this.mesh = _meshPool.pop();
            this.mesh.geometry = geometry;
            this.mesh.material = materials;
            this.mesh.position.set(this.cx * CHUNK_SIZE, 0, this.cz * CHUNK_SIZE);
        } else {
            this.mesh = new THREE.Mesh(geometry, materials);
            this.mesh.position.set(this.cx * CHUNK_SIZE, 0, this.cz * CHUNK_SIZE);
            this.mesh.castShadow = false; // Massive performance gain: voxel terrain doesn't need to cast shadows on itself
            this.mesh.receiveShadow = false; // Voxel terrain uses AO and sunlight baked into colors, receiving shadows kills FPS
        }
        this.dirty = false;
        return this.mesh;
    }

    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.geometry = null;
            // DO NOT dispose materials since they are shared globally
            _meshPool.push(this.mesh);
            this.mesh = null;
        }
    }
}

const _aoResult = [1, 1, 1, 1];

function _isSolid(wx, wy, wz, dx, dy, dz, getNeighborBlock) {
    const type = getNeighborBlock(wx + dx, wy + dy, wz + dz);
    const props = getBlockProperties(type);
    if (type === window.BLOCKS.AIR || props.isLiquid || type === window.BLOCKS.GLASS || type === window.BLOCKS.LEAVES || type === window.BLOCKS.TORCH || props.isCross || type === window.BLOCKS.CHEST_BLOCK || type === window.BLOCKS.DUNGEON_DOOR) return false;
    return true;
}

function _vertexAO(wx, wy, wz, vx, vy, vz, face, getNeighborBlock) {
    let dx1 = 0, dy1 = 0, dz1 = 0;
    let dx2 = 0, dy2 = 0, dz2 = 0;

    if (face.dir[0] !== 0) { // X face
        dy1 = vy === 1 ? 1 : -1;
        dz2 = vz === 1 ? 1 : -1;
    } else if (face.dir[1] !== 0) { // Y face
        dx1 = vx === 1 ? 1 : -1;
        dz2 = vz === 1 ? 1 : -1;
    } else { // Z face
        dx1 = vx === 1 ? 1 : -1;
        dy2 = vy === 1 ? 1 : -1;
    }

    const side1 = _isSolid(wx, wy, wz, face.dir[0] + dx1, face.dir[1] + dy1, face.dir[2] + dz1, getNeighborBlock);
    const side2 = _isSolid(wx, wy, wz, face.dir[0] + dx2, face.dir[1] + dy2, face.dir[2] + dz2, getNeighborBlock);
    const corner = _isSolid(wx, wy, wz, face.dir[0] + dx1 + dx2, face.dir[1] + dy1 + dy2, face.dir[2] + dz1 + dz2, getNeighborBlock);

    if (side1 && side2) return 0.2;
    return 1.0 - (side1 + side2 + corner) * 0.25;
}

function calculateVertexAO(wx, wy, wz, face, getNeighborBlock, blockType) {
    if (blockType === window.BLOCKS.WATER || blockType === window.BLOCKS.LAVA || blockType === window.BLOCKS.GLASS || blockType === window.BLOCKS.TORCH) {
        _aoResult[0] = 1; _aoResult[1] = 1; _aoResult[2] = 1; _aoResult[3] = 1;
        return _aoResult;
    }

    _aoResult[0] = _vertexAO(wx, wy, wz, face.v[0][0], face.v[0][1], face.v[0][2], face, getNeighborBlock);
    _aoResult[1] = _vertexAO(wx, wy, wz, face.v[1][0], face.v[1][1], face.v[1][2], face, getNeighborBlock);
    _aoResult[2] = _vertexAO(wx, wy, wz, face.v[2][0], face.v[2][1], face.v[2][2], face, getNeighborBlock);
    _aoResult[3] = _vertexAO(wx, wy, wz, face.v[3][0], face.v[3][1], face.v[3][2], face, getNeighborBlock);
    
    return _aoResult;
}

// ============================================
// World
// ============================================
export class World {
    constructor(scene, textureAtlas, onChunkUnloaded = null, onBlockDestroyed = null) {
        this.scene = scene;
        this.textureAtlas = textureAtlas;
        this.chunks = new Map();
        this.chunksToBuild = [];
        this.chunksToGenerate = []; // Chunks waiting for blocks
        this.renderDistance = 6;
        this.onChunkUnloaded = onChunkUnloaded;
        this.onBlockDestroyed = onBlockDestroyed;
        
        // Block change hooks
        this.onChestPlaced = null;
        this.onChestRemoved = null;
        this.onDoorPlaced = null;
        this.onDoorRemoved = null;
        this.onTorchPlaced = null;
        this.onTorchRemoved = null;

        // Ambient Occlusion settings
        this.enableAO = true;

        this.liquidUpdates = new Set();
        
        // Persistent modifications map: chunkKey -> Map<idx, {block, data}>
        this.modifications = new Map();
        
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        
        // Initialize shared materials to drastically reduce GC and WebGL overhead
        // MeshPhongMaterial gives per-pixel shading + specular highlights vs flat Lambert
        const matOpaque = new THREE.MeshPhongMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: false,
            side: THREE.FrontSide, // Massive performance gain for opaque blocks
            shininess: 2,
            specular: new THREE.Color(0x111111)
        });
        const matCross = new THREE.MeshPhongMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: false,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            shininess: 0
        });
        const matGlowCross = new THREE.MeshPhongMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: false,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: textureAtlas.texture,
            emissiveIntensity: 1.5,
            shininess: 0
        });
        const matWater = new THREE.MeshPhongMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            shininess: 80,
            specular: new THREE.Color(0x4488bb)
        });
        const matTransparent = new THREE.MeshPhongMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            shininess: 0
        });
        const matGlowOpaque = new THREE.MeshPhongMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: false,
            side: THREE.FrontSide, // Massive performance gain for opaque blocks
            emissive: new THREE.Color(0xffffff),
            emissiveMap: textureAtlas.texture,
            emissiveIntensity: 2.0,
            shininess: 5,
            specular: new THREE.Color(0x333333)
        });
        const matGlowTransparent = new THREE.MeshPhongMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: textureAtlas.texture,
            emissiveIntensity: 2.0,
            shininess: 5
        });
        this.sharedMaterials = [matOpaque, matCross, matGlowCross, matWater, matTransparent, matGlowOpaque, matGlowTransparent];

        // Chunk queues to avoid stuttering
        this.chunksToGenerate = [];
        this.chunksToBuild = [];

        // Fluid tick queue
        this.liquidUpdates = new Set(); // Stores strings of "x,y,z"
        this.tickTimer = 0;
    }

    setRenderDistance(d) {
        this.renderDistance = d;
        if (this.scene.fog) {
            const blocks = d * 16;
            this.scene.fog.density = 1.0 / (blocks * 0.75);
            this.scene.fog.baseDensity = this.scene.fog.density;
        }
    }

    setCamera(camera) {
        this.camera = camera;
    }

    getChunkKey(cx, cz) {
        return `${this.dimension || 'overworld'},${cx},${cz}`;
    }

    getBiomeAt(wx, wz) {
        if (!this.planetParams) return null;
        return getBiomeParams(wx, wz, this.planetParams).biome;
    }

    getBlock(wx, wy, wz) {
        wx = Math.floor(wx); wy = Math.floor(wy); wz = Math.floor(wz);
        if (wy < 0 || wy >= CHUNK_HEIGHT) return BLOCKS.AIR;

        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        const chunk = this.chunks.get(this.getChunkKey(cx, cz));
        if (chunk) return chunk.getBlock(lx, wy, lz);
        return BLOCKS.AIR;
    }

    getData(wx, wy, wz) {
        wx = Math.floor(wx); wy = Math.floor(wy); wz = Math.floor(wz);
        if (wy < 0 || wy >= CHUNK_HEIGHT) return 0;

        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        const chunk = this.chunks.get(this.getChunkKey(cx, cz));
        if (chunk) return chunk.getData(lx, wy, lz);
        return 0;
    }

    setData(wx, wy, wz, dataValue) {
        wx = Math.floor(wx); wy = Math.floor(wy); wz = Math.floor(wz);
        if (wy < 0 || wy >= CHUNK_HEIGHT) return;
        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const chunk = this.getChunkAt(wx, wz);
        
        // Record modification
        const chunkKey = this.getChunkKey(cx, cz);
        let mods = this.modifications.get(chunkKey);
        if (!mods) {
            mods = new Map();
            this.modifications.set(chunkKey, mods);
        }
        const idx = (wy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
        let mod = mods.get(idx);
        if (!mod) {
            const block = chunk ? chunk.getBlock(lx, wy, lz) : 0;
            mod = { block: block, data: dataValue };
            mods.set(idx, mod);
        } else {
            mod.data = dataValue;
        }

        if (chunk) chunk.setData(lx, wy, lz, dataValue);
    }

    checkSupport(x, y, z) {
        const type = this.getBlock(x, y, z);
        if (type === window.BLOCKS.AIR) return;

        let needsBreak = false;
        const blockBelow = this.getBlock(x, y - 1, z);
        
        // Plant-like blocks need dirt/grass below
        if ([window.BLOCKS.TALL_GRASS, window.BLOCKS.FLOWER_RED, window.BLOCKS.FLOWER_YELLOW, window.BLOCKS.FERN, window.BLOCKS.MUSHROOM_RED, window.BLOCKS.MUSHROOM_BROWN].includes(type)) {
            if (![window.BLOCKS.GRASS, window.BLOCKS.DIRT, window.BLOCKS.MYCELIUM, window.BLOCKS.CRIMSON_NYLIUM, window.BLOCKS.PODZOL].includes(blockBelow)) {
                needsBreak = true;
            }
        }
        else if (type === window.BLOCKS.CACTUS) {
            if (blockBelow !== window.BLOCKS.SAND && blockBelow !== window.BLOCKS.CACTUS && blockBelow !== window.BLOCKS.RED_SAND) needsBreak = true;
        }
        else if (type === window.BLOCKS.SUGARCANE) {
            if (blockBelow === window.BLOCKS.SUGARCANE) {
                needsBreak = false;
            } else if ([window.BLOCKS.SAND, window.BLOCKS.DIRT, window.BLOCKS.GRASS, window.BLOCKS.PODZOL, window.BLOCKS.MYCELIUM, window.BLOCKS.COARSE_DIRT].includes(blockBelow)) {
                // Must be adjacent to water horizontally or diagonally below
                const neighbors = [
                    this.getBlock(x + 1, y - 1, z),
                    this.getBlock(x - 1, y - 1, z),
                    this.getBlock(x, y - 1, z + 1),
                    this.getBlock(x, y - 1, z - 1),
                    this.getBlock(x + 1, y - 2, z),
                    this.getBlock(x - 1, y - 2, z),
                    this.getBlock(x, y - 2, z + 1),
                    this.getBlock(x, y - 2, z - 1)
                ];
                if (!neighbors.includes(window.BLOCKS.WATER) && !neighbors.includes(window.BLOCKS.SWAMP_WATER)) {
                    needsBreak = true;
                }
            } else {
                needsBreak = true;
            }
        }
        else if (type === window.BLOCKS.TORCH) {
            // Needs ANY solid adjacent block
            let hasSupport = false;
            const dirs = [[0,-1,0], [0,1,0], [1,0,0], [-1,0,0], [0,0,1], [0,0,-1]];
            for (let d of dirs) {
                const adj = this.getBlock(x + d[0], y + d[1], z + d[2]);
                const p = getBlockProperties(adj);
                if (p && p.solid) { hasSupport = true; break; }
            }
            if (!hasSupport) needsBreak = true;
        }
        else if (type === window.BLOCKS.LADDER) {
            // Needs ANY solid adjacent block except top/bottom
            let hasSupport = false;
            const dirs = [[1,0,0], [-1,0,0], [0,0,1], [0,0,-1]];
            for (let d of dirs) {
                const adj = this.getBlock(x + d[0], y + d[1], z + d[2]);
                const p = getBlockProperties(adj);
                if (p && p.solid) { hasSupport = true; break; }
            }
            if (!hasSupport) needsBreak = true;
        }

        if (needsBreak) {
            // Break the block and spawn item (setBlock triggers onBlockDestroyed which spawns the item)
            this.setBlock(x, y, z, window.BLOCKS.AIR);
        }
    }

    checkAdjacentSupports(wx, wy, wz) {
        // Only run if we aren't already deep in a recursive update stack to prevent infinite loops just in case
        this._updateDepth = (this._updateDepth || 0) + 1;
        if (this._updateDepth > 10) {
            this._updateDepth--;
            return;
        }

        this.checkSupport(wx, wy + 1, wz);
        this.checkSupport(wx, wy - 1, wz);
        this.checkSupport(wx + 1, wy, wz);
        this.checkSupport(wx - 1, wy, wz);
        this.checkSupport(wx, wy, wz + 1);
        this.checkSupport(wx, wy, wz - 1);

        this._updateDepth--;
    }

    setBlock(wx, wy, wz, type) {
        wx = Math.floor(wx); wy = Math.floor(wy); wz = Math.floor(wz);
        if (wy < 0 || wy >= CHUNK_HEIGHT) return;

        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        
        // Record modification
        const chunkKey = this.getChunkKey(cx, cz);
        let mods = this.modifications.get(chunkKey);
        if (!mods) {
            mods = new Map();
            this.modifications.set(chunkKey, mods);
        }
        const idx = (wy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
        let mod = mods.get(idx);
        if (!mod) {
            const chunk = this.getChunkAt(wx, wz);
            const data = chunk ? chunk.getData(lx, wy, lz) : 0;
            mod = { block: type, data: data };
            mods.set(idx, mod);
        } else {
            mod.block = type;
        }

        const chunk = this.getChunkAt(wx, wz);
        if (chunk) {
            const oldType = chunk.getBlock(lx, wy, lz);
            chunk.setBlock(lx, wy, lz, type);
            
            if (this.onBlockDestroyed) {
                this.onBlockDestroyed(wx, wy, wz, oldType, type);
            }
            
            // Register chest placement/removal
            if (oldType === window.BLOCKS.CHEST_BLOCK && type !== window.BLOCKS.CHEST_BLOCK) {
                if (this.onChestRemoved) this.onChestRemoved(wx, wy, wz);
            } else if (oldType !== window.BLOCKS.CHEST_BLOCK && type === window.BLOCKS.CHEST_BLOCK) {
                if (this.onChestPlaced) this.onChestPlaced(wx, wy, wz);
            }

            // Register door placement/removal
            if (oldType === window.BLOCKS.DUNGEON_DOOR && type !== window.BLOCKS.DUNGEON_DOOR) {
                if (this.onDoorRemoved) this.onDoorRemoved(wx, wy, wz);
            } else if (oldType !== window.BLOCKS.DUNGEON_DOOR && type === window.BLOCKS.DUNGEON_DOOR) {
                if (this.onDoorPlaced) this.onDoorPlaced(wx, wy, wz);
            }

            if (oldType !== type) {
                this.checkAdjacentSupports(wx, wy, wz);
            }

            if (!this.chunksToBuild.includes(chunk)) {
                this.chunksToBuild.push(chunk);
            }
            // Trigger neighbor fluid updates
            this.queueLiquidUpdate(wx, wy + 1, wz);
            this.queueLiquidUpdate(wx, wy, wz + 1);
            this.queueLiquidUpdate(wx, wy, wz - 1);
            this.queueLiquidUpdate(wx + 1, wy, wz);
            this.queueLiquidUpdate(wx - 1, wy, wz);
            if (type === BLOCKS.WATER || type === BLOCKS.LAVA) this.queueLiquidUpdate(wx, wy, wz);
            // Check neighbors if block is on border
            if (lx === 0) this._markChunkDirty(cx - 1, cz);
            if (lx === CHUNK_SIZE - 1) this._markChunkDirty(cx + 1, cz);
            if (lz === 0) this._markChunkDirty(cx, cz - 1);
            if (lz === CHUNK_SIZE - 1) this._markChunkDirty(cx, cz + 1);
        }
    }

    _markChunkDirty(cx, cz) {
        const chunk = this.chunks.get(this.getChunkKey(cx, cz));
        if (chunk) {
            chunk.dirty = true;
            if (!this.chunksToBuild.includes(chunk)) {
                this.chunksToBuild.push(chunk);
            }
        }
    }

    getChunkAt(wx, wz) {
        const cx = Math.floor(Math.floor(wx) / CHUNK_SIZE);
        const cz = Math.floor(Math.floor(wz) / CHUNK_SIZE);
        return this.chunks.get(this.getChunkKey(cx, cz));
    }

    queueLiquidUpdate(x, y, z) {
        const t = this.getBlock(x, y, z);
        const props = getBlockProperties(t);
        if (props.isLiquid) {
            this.liquidUpdates.add(`${x},${y},${z}`);
        }
    }

    tickFluids() {
        const updates = Array.from(this.liquidUpdates);
        this.liquidUpdates.clear();        for (const key of updates) {
            const [x, y, z] = key.split(',').map(Number);
            const type = this.getBlock(x, y, z);
            const props = getBlockProperties(type);

            if (!props.isLiquid) continue;

            const isWater = type === BLOCKS.WATER || type === BLOCKS.SWAMP_WATER;
            const isLava = type === BLOCKS.LAVA;
            const maxLevel = isLava ? 3 : 7;
            
            const data = this.getData(x, y, z);
            const isFalling = (data === 8);
            const currentLevel = (data === 0 || isFalling) ? maxLevel : data;

            // 1. Decay check: if not a source block, it needs a valid feed to survive
            if (data !== 0) {
                let hasFeed = false;
                const aboveBlock = this.getBlock(x, y + 1, z);
                if (aboveBlock === type) hasFeed = true;
                
                if (!hasFeed && !isFalling) {
                    const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    for (const [dx, dz] of sides) {
                        const sideBlock = this.getBlock(x + dx, y, z + dz);
                        if (sideBlock === type) {
                            const sideData = this.getData(x + dx, y, z + dz);
                            const sideLevel = (sideData === 0 || sideData === 8) ? maxLevel : sideData;
                            if (sideLevel > currentLevel) { hasFeed = true; break; }
                        }
                    }
                }
                
                if (!hasFeed) {
                    this.setBlock(x, y, z, BLOCKS.AIR);
                    const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    for (const [dx, dz] of sides) {
                        this.queueLiquidUpdate(x + dx, y, z + dz);
                    }
                    this.queueLiquidUpdate(x, y - 1, z);
                    continue; // Stop processing, the block is gone
                }
            }

            const bBelow = this.getBlock(x, y - 1, z);
            const belowProps = getBlockProperties(bBelow);

            // 2. Flow downwards
            if (bBelow === BLOCKS.AIR || belowProps.isCross || belowProps.isGrass) {
                this.setBlock(x, y - 1, z, type);
                this.setData(x, y - 1, z, 8); // 8 indicates falling fluid
                this.queueLiquidUpdate(x, y - 1, z);
            } 
            // 3. Water-lava interactions
            else if (belowProps.isLiquid && bBelow !== type) {
                if (isWater && bBelow === BLOCKS.LAVA) {
                    this.setBlock(x, y - 1, z, BLOCKS.OBSIDIAN);
                } else if (isLava && (bBelow === BLOCKS.WATER || bBelow === BLOCKS.SWAMP_WATER)) {
                    this.setBlock(x, y - 1, z, BLOCKS.STONE);
                }
            } 
            // 4. Spread sideways if blocked below (solid block)
            else if (!belowProps.isLiquid) {
                if (currentLevel > 1) {
                    const nextLevel = currentLevel - 1;
                    const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    for (const [dx, dz] of sides) {
                        const sideBlock = this.getBlock(x + dx, y, z + dz);
                        const sideProps = getBlockProperties(sideBlock);

                        if (sideBlock === BLOCKS.AIR || (sideProps.isCross || sideProps.isGrass)) {
                            this.setBlock(x + dx, y, z + dz, type);
                            this.setData(x + dx, y, z + dz, nextLevel);
                            this.queueLiquidUpdate(x + dx, y, z + dz);
                        } else if (sideProps.isLiquid && sideBlock !== type) {
                            // Sideways mixing
                            const sideIsLava = sideBlock === BLOCKS.LAVA;
                            if (isWater && sideIsLava) this.setBlock(x + dx, y, z + dz, BLOCKS.OBSIDIAN);
                            else if (isLava && !sideIsLava) this.setBlock(x, y, z, BLOCKS.COBBLESTONE);
                        } else if (sideBlock === type) {
                            const sideData = this.getData(x + dx, y, z + dz);
                            if (sideData !== 0 && sideData !== 8) {
                                if (nextLevel > sideData) {
                                    this.setData(x + dx, y, z + dz, nextLevel);
                                    this.queueLiquidUpdate(x + dx, y, z + dz);
                                }
                            }
                        }
                    }
                }
            } }
    }

    update(playerPos, terrainGenerator, dt) {
        const px = Math.floor(playerPos.x / CHUNK_SIZE);
        const pz = Math.floor(playerPos.z / CHUNK_SIZE);

        const chunksToKeep = new Set();

        // Find chunks that should be loaded
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                if (x * x + z * z <= this.renderDistance * this.renderDistance) {
                    const cx = px + x;
                    const cz = pz + z;
                    const key = this.getChunkKey(cx, cz);
                    chunksToKeep.add(key);

                    if (!this.chunks.has(key)) {
                        const chunk = new Chunk(cx, cz);
                        this.chunks.set(key, chunk);
                        this.chunksToGenerate.push(chunk);
                    }
                }
            }
        }

        // Process a few chunks per frame for generating blocks
        let gensThisFrame = 0;
        
        while (this.chunksToGenerate.length > 0 && gensThisFrame < 1) {
            let bestIdx = -1;
            let bestDist = Infinity;
            for (let i = 0; i < this.chunksToGenerate.length; i++) {
                const chunk = this.chunksToGenerate[i];
                const dist = Math.abs(chunk.cx - px) + Math.abs(chunk.cz - pz);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            let chunk;
            if (bestIdx > -1) {
                const lastIdx = this.chunksToGenerate.length - 1;
                chunk = this.chunksToGenerate[bestIdx];
                this.chunksToGenerate[bestIdx] = this.chunksToGenerate[lastIdx];
                this.chunksToGenerate.length = lastIdx;
            } else {
                chunk = this.chunksToGenerate.pop();
            }
            // Don't generate if it was removed
            if (!this.chunks.has(this.getChunkKey(chunk.cx, chunk.cz))) continue;

            chunk.blocks = terrainGenerator(chunk.cx, chunk.cz);
            
            // Apply persistent modifications
            const chunkKey = this.getChunkKey(chunk.cx, chunk.cz);
            const mods = this.modifications.get(chunkKey);
            if (mods) {
                for (const [idx, mod] of mods.entries()) {
                    chunk.blocks[idx] = mod.block;
                    chunk.data[idx] = mod.data;
                }
            }

            chunk.dirty = true;
            this.chunksToBuild.push(chunk);

            // Register chests, doors, torches, and furnaces
            if (this.onChestGenerated || this.onDoorGenerated || this.onTorchGenerated || this.onFurnaceGenerated) {
                for (let i = 0; i < chunk.blocks.length; i++) {
                    const blockType = chunk.blocks[i];
                    if (blockType === window.BLOCKS.CHEST_BLOCK || blockType === window.BLOCKS.DUNGEON_DOOR || blockType === window.BLOCKS.TORCH || blockType === window.BLOCKS.FURNACE) {
                        const y = Math.floor(i / (16 * 16));
                        const rem = i % (16 * 16);
                        const z = Math.floor(rem / 16);
                        const x = rem % 16;
                        const wx = chunk.cx * 16 + x;
                        const wz = chunk.cz * 16 + z;
                        if (blockType === window.BLOCKS.CHEST_BLOCK && this.onChestGenerated) {
                            this.onChestGenerated(wx, y, wz);
                        } else if (blockType === window.BLOCKS.DUNGEON_DOOR && this.onDoorGenerated) {
                            this.onDoorGenerated(wx, y, wz);
                        } else if (blockType === window.BLOCKS.TORCH && this.onTorchGenerated) {
                            this.onTorchGenerated(wx, y, wz);
                        } else if (blockType === window.BLOCKS.FURNACE && this.onFurnaceGenerated) {
                            this.onFurnaceGenerated(wx, y, wz);
                        }
                    }
                }
            }

            // Mark neighbors dirty
            const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dz] of neighbors) {
                const nKey = this.getChunkKey(chunk.cx + dx, chunk.cz + dz);
                const nChunk = this.chunks.get(nKey);
                if (nChunk && nChunk.blocks[0] !== undefined) { // Check if neighbor is generated
                    nChunk.dirty = true;
                    if (!this.chunksToBuild.includes(nChunk)) {
                        this.chunksToBuild.push(nChunk);
                    }
                }
            }
            gensThisFrame++;
        }

        // Unload far chunks
        for (const [key, chunk] of this.chunks.entries()) {
            if (!chunksToKeep.has(key)) {
                chunk.dispose();
                if (this.onChunkUnloaded) this.onChunkUnloaded(chunk.cx, chunk.cz);
                this.chunks.delete(key);
                // Remove from build queues
                const index = this.chunksToBuild.indexOf(chunk);
                if (index > -1) this.chunksToBuild.splice(index, 1);
                const gIndex = this.chunksToGenerate.indexOf(chunk);
                if (gIndex > -1) this.chunksToGenerate.splice(gIndex, 1);
            }
        }

        // Process a few chunks per frame
        let buildsThisFrame = 0;
        // Limit to 1 build per frame to ensure smooth 60 FPS
        while (this.chunksToBuild.length > 0 && buildsThisFrame < 1) {
            let bestIdx = -1;
            let bestDist = Infinity;
            for (let i = 0; i < this.chunksToBuild.length; i++) {
                const chunk = this.chunksToBuild[i];
                const dist = Math.abs(chunk.cx - px) + Math.abs(chunk.cz - pz);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            let chunk;
            if (bestIdx > -1) {
                const lastIdx = this.chunksToBuild.length - 1;
                chunk = this.chunksToBuild[bestIdx];
                this.chunksToBuild[bestIdx] = this.chunksToBuild[lastIdx];
                this.chunksToBuild.length = lastIdx;
            } else {
                chunk = this.chunksToBuild.pop();
            }
            if (chunk.dirty) {
                // Pass shared materials through atlas for convenience
                this.textureAtlas.sharedMaterials = this.sharedMaterials;
                const neighborChunks = [
                    [null, null, null],
                    [null, null, null],
                    [null, null, null]
                ];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        const key = this.getChunkKey(chunk.cx + dx, chunk.cz + dz);
                        neighborChunks[dx + 1][dz + 1] = this.chunks.get(key) || null;
                    }
                }
                const mesh = chunk.buildMesh(this.textureAtlas, neighborChunks);
                if (mesh && !mesh.parent) {
                    this.scene.add(mesh);
                }
                buildsThisFrame++;
            }
        }

        // Frustum culling is immediately after chunk meshing now

        // Frustum culling
        if (this.camera) {
            this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
            this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
            const _box = new THREE.Box3();
            for (const chunk of this.chunks.values()) {
                if (chunk.mesh) {
                    const cx = chunk.cx * 16;
                    const cz = chunk.cz * 16;
                    _box.min.set(cx, 0, cz);
                    _box.max.set(cx + 16, 128, cz + 16);
                    chunk.mesh.visible = this.frustum.intersectsBox(_box);
                }
            }
        }

        if (dt) {
            this.tickTimer += dt;
            if (this.tickTimer >= 1.2) { // tick every 1.2s
                this.tickTimer = 0;
                this.tickFluids();
                this.tickRandomBlocks();
            }
        }
    }

    isFlammable(block) {
        return block === window.BLOCKS.WOOD || block === window.BLOCKS.LEAVES || block === window.BLOCKS.PLANKS || 
               block === window.BLOCKS.ACACIA_WOOD || block === window.BLOCKS.ACACIA_LEAVES || block === window.BLOCKS.ACACIA_PLANKS ||
               block === window.BLOCKS.CHERRY_WOOD || block === window.BLOCKS.CHERRY_LEAVES || block === window.BLOCKS.CHERRY_PLANKS ||
               block === window.BLOCKS.AUTUMN_WOOD || block === window.BLOCKS.AUTUMN_LEAVES || block === window.BLOCKS.AUTUMN_PLANKS ||
               block === window.BLOCKS.PALM_WOOD || block === window.BLOCKS.PALM_LEAVES || block === window.BLOCKS.PALM_PLANKS ||
               block === window.BLOCKS.PINE_WOOD || block === window.BLOCKS.PINE_LEAVES || block === window.BLOCKS.PINE_PLANKS ||
               block === window.BLOCKS.WOOL || block === window.BLOCKS.TALL_GRASS || block === window.BLOCKS.DEAD_BUSH;
    }

    tickRandomBlocks() {
        // Pick 96 random blocks per active chunk (approx 3 per subchunk like Minecraft)
        for (const chunk of this.chunks.values()) {
            if (!chunk.blocks || chunk.blocks[0] === undefined) continue;
            
            for (let i = 0; i < 96; i++) {
                const rx = Math.floor(Math.random() * 16);
                const ry = Math.floor(Math.random() * CHUNK_HEIGHT);
                const rz = Math.floor(Math.random() * 16);
                
                const index = ry * 256 + rz * 16 + rx;
                const block = chunk.blocks[index];
                
                if (block === window.BLOCKS.SUGARCANE) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    // Check if air is above
                    if (wy < CHUNK_HEIGHT - 1 && this.getBlock(wx, wy + 1, wz) === window.BLOCKS.AIR) {
                        // Find how many sugarcane blocks are below
                        let height = 1;
                        let checkY = wy - 1;
                        while (checkY > 0 && this.getBlock(wx, checkY, wz) === window.BLOCKS.SUGARCANE) {
                            height++;
                            checkY--;
                        }
                        if (height < 3 && Math.random() < 0.2) { // Grow!
                            this.setBlock(wx, wy + 1, wz, window.BLOCKS.SUGARCANE);
                        }
                    }
                } else if (block === window.BLOCKS.FIRE) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    
                    const dirs = [
                        [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
                    ];
                    
                    // 1. Check if supported (needs solid block below, or adjacent flammable block)
                    let supported = false;
                    const blockBelow = this.getBlock(wx, wy - 1, wz);
                    if (blockBelow !== window.BLOCKS.AIR && blockBelow !== window.BLOCKS.WATER && blockBelow !== window.BLOCKS.LAVA && blockBelow !== window.BLOCKS.FIRE) {
                        supported = true;
                    } else {
                        for (const [dx, dy, dz] of dirs) {
                            if (this.isFlammable(this.getBlock(wx + dx, wy + dy, wz + dz))) {
                                supported = true;
                                break;
                            }
                        }
                    }
                    
                    if (!supported) {
                        this.setBlock(wx, wy, wz, window.BLOCKS.AIR);
                        continue;
                    }
                    
                    // 2. Spread to nearby AIR blocks that are next to flammable blocks
                    if (Math.random() < 0.4) {
                        // Pick a random nearby position (-1 to 1)
                        const rx_spread = Math.floor(Math.random() * 3) - 1;
                        const ry_spread = Math.floor(Math.random() * 3) - 1;
                        const rz_spread = Math.floor(Math.random() * 3) - 1;
                        
                        if (rx_spread !== 0 || ry_spread !== 0 || rz_spread !== 0) {
                            const nx = wx + rx_spread;
                            const ny = wy + ry_spread;
                            const nz = wz + rz_spread;
                            
                            if (this.getBlock(nx, ny, nz) === window.BLOCKS.AIR) {
                                // Check if this air block is adjacent to something flammable
                                let canCatch = false;
                                for (const [dx, dy, dz] of dirs) {
                                    if (this.isFlammable(this.getBlock(nx + dx, ny + dy, nz + dz))) {
                                        canCatch = true;
                                        break;
                                    }
                                }
                                if (canCatch) {
                                    this.setBlock(nx, ny, nz, window.BLOCKS.FIRE);
                                }
                            }
                        }
                    }
                    
                    // 3. Destroy adjacent flammable blocks (burn them up)
                    if (Math.random() < 0.2) {
                        dirs.sort(() => Math.random() - 0.5); // shuffle
                        for (const [dx, dy, dz] of dirs) {
                            const nx = wx + dx, ny = wy + dy, nz = wz + dz;
                            if (this.isFlammable(this.getBlock(nx, ny, nz))) {
                                this.setBlock(nx, ny, nz, window.BLOCKS.AIR);
                                break; // Only burn one at a time
                            }
                        }
                    }
                    
                    // 4. Fire naturally dies out sometimes
                    if (Math.random() < 0.1) {
                        this.setBlock(wx, wy, wz, window.BLOCKS.AIR);
                    }
                } else if (block === window.BLOCKS.LAVA) {
                    // Lava has a chance to light nearby blocks on fire
                    if (Math.random() < 0.1) {
                        const wx = chunk.cx * 16 + rx;
                        const wy = ry;
                        const wz = chunk.cz * 16 + rz;
                        
                        const nx = wx + (Math.floor(Math.random() * 3) - 1);
                        const ny = wy + (Math.floor(Math.random() * 3) - 1);
                        const nz = wz + (Math.floor(Math.random() * 3) - 1);
                        
                        // If it found an air block...
                        if (this.getBlock(nx, ny, nz) === window.BLOCKS.AIR) {
                            // Check if that air block is adjacent to something flammable
                            const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
                            let canCatch = false;
                            for (const [dx, dy, dz] of dirs) {
                                if (this.isFlammable(this.getBlock(nx + dx, ny + dy, nz + dz))) {
                                    canCatch = true;
                                    break;
                                }
                            }
                            if (canCatch) {
                                this.setBlock(nx, ny, nz, window.BLOCKS.FIRE);
                            }
                        }
                    }
                }
            }
        }
    }

    raycast(origin, direction, maxDist = 8, hitLiquids = false) {
        // Fast voxel raycast algorithm (Amanatides & Woo)
        let t = 0;
        let ix = Math.floor(origin.x);
        let iy = Math.floor(origin.y);
        let iz = Math.floor(origin.z);

        const stepX = Math.sign(direction.x);
        const stepY = Math.sign(direction.y);
        const stepZ = Math.sign(direction.z);

        const tDeltaX = stepX !== 0 ? Math.abs(1 / direction.x) : Infinity;
        const tDeltaY = stepY !== 0 ? Math.abs(1 / direction.y) : Infinity;
        const tDeltaZ = stepZ !== 0 ? Math.abs(1 / direction.z) : Infinity;

        let tMaxX = stepX > 0 ? (ix + 1 - origin.x) * tDeltaX : (origin.x - ix) * tDeltaX;
        let tMaxY = stepY > 0 ? (iy + 1 - origin.y) * tDeltaY : (origin.y - iy) * tDeltaY;
        let tMaxZ = stepZ > 0 ? (iz + 1 - origin.z) * tDeltaZ : (origin.z - iz) * tDeltaZ;

        let steppedIndex = -1;

        while (t <= maxDist) {
            const blockType = this.getBlock(ix, iy, iz);
            const props = getBlockProperties(blockType);

            const isLiquidHit = hitLiquids && props.isLiquid;
            if (blockType !== BLOCKS.AIR && (isLiquidHit || (blockType !== BLOCKS.WATER && blockType !== BLOCKS.LAVA && blockType !== BLOCKS.SWAMP_WATER && (props.solid || props.isCross)))) {
                const hitNormal = new THREE.Vector3(0, 0, 0);
                if (steppedIndex === 0) hitNormal.x = -stepX;
                if (steppedIndex === 1) hitNormal.y = -stepY;
                if (steppedIndex === 2) hitNormal.z = -stepZ;

                return {
                    hit: true,
                    position: origin.clone().add(direction.clone().multiplyScalar(t)),
                    normal: hitNormal,
                    blockPos: { x: ix, y: iy, z: iz },
                    blockType: blockType
                };
            }

            if (tMaxX < tMaxY) {
                if (tMaxX < tMaxZ) {
                    ix += stepX;
                    t = tMaxX;
                    tMaxX += tDeltaX;
                    steppedIndex = 0;
                } else {
                    iz += stepZ;
                    t = tMaxZ;
                    tMaxZ += tDeltaZ;
                    steppedIndex = 2;
                }
            } else {
                if (tMaxY < tMaxZ) {
                    iy += stepY;
                    t = tMaxY;
                    tMaxY += tDeltaY;
                    steppedIndex = 1;
                } else {
                    iz += stepZ;
                    t = tMaxZ;
                    tMaxZ += tDeltaZ;
                    steppedIndex = 2;
                }
            }
        }

        return { hit: false };
    }

    collide(position, velocity, entityWidth = 0.6, entityHeight = 1.8, isSneaking = false) {
        // AABB vs Voxel Grid collision
        const hw = entityWidth / 2;

        let targetX = position.x + velocity.x;
        let targetY = position.y + velocity.y;
        let targetZ = position.z + velocity.z;
        let grounded = false;

        // Function to check if an AABB overlaps solid blocks
        const checkCollision = (px, py, pz) => {
            const minX = Math.floor(px - hw + 0.01);
            const maxX = Math.floor(px + hw - 0.01);
            const minY = Math.floor(py);
            const maxY = Math.floor(py + entityHeight - 0.01);
            const minZ = Math.floor(pz - hw + 0.01);
            const maxZ = Math.floor(pz + hw - 0.01);

            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        const block = this.getBlock(x, y, z);
                        if (getBlockProperties(block).solid) {
                            if (block === window.BLOCKS.DUNGEON_DOOR && this.isDoorOpen && this.isDoorOpen(x, y, z)) {
                                continue;
                            }
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        // Sneak edge detection
        if (isSneaking && checkCollision(position.x, position.y - 0.1, position.z)) {
            if (!checkCollision(targetX, position.y - 0.1, position.z)) {
                velocity.x = 0;
                targetX = position.x;
            }
            if (!checkCollision(targetX, position.y - 0.1, targetZ)) { // Use targetX because it might have been reset
                velocity.z = 0;
                targetZ = position.z;
            }
        }

        // Y-axis
        if (checkCollision(position.x, targetY, position.z)) {
            velocity.y = 0;
            if (targetY < position.y) { // Falling down
                grounded = true;
                targetY = Math.floor(targetY) + 1.0;
            } else { // Jumping up and hitting ceiling
                targetY = Math.floor(targetY + entityHeight - 0.01) - entityHeight;
            }
        }

        // X-axis
        if (checkCollision(targetX, targetY, position.z)) {
            velocity.x = 0;
            targetX = position.x;
        }

        // Z-axis
        if (checkCollision(targetX, targetY, targetZ)) {
            velocity.z = 0;
            targetZ = position.z;
        }

        position.set(targetX, targetY, targetZ);
        return { position, velocity, grounded };
    }
}
