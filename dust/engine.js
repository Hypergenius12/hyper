const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const glowCanvas = document.getElementById('glow-canvas');
const glowCtx = glowCanvas.getContext('2d', { willReadFrequently: true });
const brushCursor = document.getElementById('brush-cursor');
const fpsCounter = document.getElementById('fps-counter');

// Config
const SCALE = 4; // 1 pixel = 4x4 on screen
const GRAVITY_Y = 1;

// Global inputs for player elements
const KEYS = { up: false, down: false, left: false, right: false };
window.addEventListener('keydown', (e) => {
    // Don't capture keys when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'w' || e.key === 'ArrowUp') KEYS.up = true;
    if (e.key === 's' || e.key === 'ArrowDown') KEYS.down = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') KEYS.left = true;
    if (e.key === 'd' || e.key === 'ArrowRight') KEYS.right = true;
});
window.addEventListener('keyup', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'w' || e.key === 'ArrowUp') KEYS.up = false;
    if (e.key === 's' || e.key === 'ArrowDown') KEYS.down = false;
    if (e.key === 'a' || e.key === 'ArrowLeft') KEYS.left = false;
    if (e.key === 'd' || e.key === 'ArrowRight') KEYS.right = false;
});
const WIDTH = Math.floor((window.innerWidth * 0.7) / SCALE);
const HEIGHT = Math.floor((window.innerHeight * 0.9) / SCALE);
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.width = `${WIDTH * SCALE}px`;
canvas.style.height = `${HEIGHT * SCALE}px`;
glowCanvas.width = WIDTH;
glowCanvas.height = HEIGHT;
glowCanvas.style.width = `${WIDTH * SCALE}px`;
glowCanvas.style.height = `${HEIGHT * SCALE}px`;

// Elements
const ELEMENTS = {
    EMPTY: { id: 0, name: 'Erase', color: [0, 0, 0], uiColor: '#000000', type: 'tool', defaultTemp: 70, density: 0, dispersion: 0 },
    SAND: { id: 1, name: 'Sand', color: [234, 179, 8], uiColor: '#eab308', type: 'solid', gravity: true, defaultTemp: 70, density: 2.0 },
    WATER: { id: 2, name: 'Water', color: [59, 130, 246], uiColor: '#3b82f6', type: 'liquid', gravity: true, defaultTemp: 70, density: 1.0, dispersion: 4 },
    WALL: { id: 3, name: 'Wall', color: [113, 113, 122], uiColor: '#71717a', type: 'solid', gravity: false, defaultTemp: 70, density: 10.0 },
    FIRE: { id: 4, name: 'Fire', color: [239, 68, 68], uiColor: '#ef4444', type: 'gas', gravity: -1, defaultTemp: 1200, density: 0.1, dispersion: 2 },
    SMOKE: { id: 5, name: 'Smoke', color: [161, 161, 170], uiColor: '#a1a1aa', type: 'gas', gravity: -1, defaultTemp: 200, density: 0.2, dispersion: 3 },
    DYNAMITE: { id: 6, name: 'Dynamite', color: [185, 28, 28], uiColor: '#b91c1c', type: 'solid', gravity: false, flammable: true, defaultTemp: 70, density: 5.0 },
    STEAM: { id: 7, name: 'Steam', color: [220, 220, 230], uiColor: '#dcdce6', type: 'gas', gravity: -1, defaultTemp: 220, density: 0.05, dispersion: 4 },
    ICE: { id: 8, name: 'Ice', color: [165, 243, 252], uiColor: '#a5f3fc', type: 'solid', gravity: false, defaultTemp: 20, density: 0.9 },
    WOOD: { id: 9, name: 'Wood', color: [120, 53, 15], uiColor: '#78350f', type: 'solid', gravity: false, flammable: true, defaultTemp: 70, density: 0.8 },
    LAVA: { id: 10, name: 'Lava', color: [249, 115, 22], uiColor: '#f97316', type: 'liquid', gravity: true, defaultTemp: 2000, density: 3.0, dispersion: 1 },
    STONE: { id: 11, name: 'Stone', color: [168, 162, 158], uiColor: '#a8a29e', type: 'solid', gravity: false, defaultTemp: 70, density: 5.0 },
    GLASS: { id: 12, name: 'Glass', color: [224, 242, 254], uiColor: '#e0f2fe', type: 'solid', gravity: false, defaultTemp: 70, density: 2.5, acidResistant: true },
    OBSIDIAN: { id: 13, name: 'Obsidian', color: [41, 37, 36], uiColor: '#292524', type: 'solid', gravity: false, defaultTemp: 70, density: 4.0, acidResistant: true },
    CLONER: { id: 17, name: 'Cloner', color: [168, 85, 247], uiColor: '#a855f7', type: 'solid', gravity: false, acidResistant: true },
    ACID: { id: 18, name: 'Acid', color: [132, 204, 22], uiColor: '#84cc16', type: 'liquid', gravity: true, density: 1.2, dispersion: 4, acidic: 0.1 },
    VIRUS: { id: 19, name: 'Virus', color: [236, 72, 153], uiColor: '#ec4899', type: 'solid', gravity: true, density: 2.0 }
};


const IS_LIQUID = new Uint8Array(256);
const IS_GAS = new Uint8Array(256);
const HAS_GRAVITY = new Uint8Array(256);
const IS_FLAMMABLE = new Uint8Array(256);
const DENSITY = new Float32Array(256);
const DISPERSION = new Float32Array(256);
const IS_PLANT = new Uint8Array(256);
const IS_LIFE = new Uint8Array(256);
const IS_PLAYER = new Uint8Array(256);
const GROWTH_RATE = new Float32Array(256);
const GROWS_ON = new Array(256);
const BEHAVIOR = new Array(256);
const CONDUCTIVE = new Uint8Array(256);
const ACIDIC = new Float32Array(256);
const ACID_RESISTANT = new Uint8Array(256);
const THERMAL_CONDUCTIVITY = new Float32Array(256);
const DEFAULT_TEMP = new Float32Array(256).fill(70);

// Reverse lookup: element ID -> name string (for debug display)
const ID_TO_NAME = new Array(256).fill('Empty');

const TRANSITIONS = {};
const REACTIONS = {};
const CUSTOM_UPDATE = {};
const CUSTOM_DRAW = {};
const ERRORED_SCRIPTS = new Set();
const ERRORED_TOOLS = new Set();

window.buildLookupTables = function() {
    IS_LIQUID.fill(0);
    IS_GAS.fill(0);
    HAS_GRAVITY.fill(0);
    IS_FLAMMABLE.fill(0);
    DENSITY.fill(0);
    DISPERSION.fill(0);
    IS_PLANT.fill(0);
    IS_LIFE.fill(0);
    IS_PLAYER.fill(0);
    GROWTH_RATE.fill(0);
    CONDUCTIVE.fill(0);
    ACIDIC.fill(0);
    ACID_RESISTANT.fill(0);
    THERMAL_CONDUCTIVITY.fill(0);
    DEFAULT_TEMP.fill(70);
    ID_TO_NAME.fill('Empty');
    
    // Clear objects
    for (let key in GROWS_ON) delete GROWS_ON[key];
    for (let key in BEHAVIOR) delete BEHAVIOR[key];

    Object.values(ELEMENTS).forEach(el => {
        if (el.type === 'liquid') IS_LIQUID[el.id] = 1;
        if (el.type === 'gas') IS_GAS[el.id] = 1;
        if (el.type === 'plant') IS_PLANT[el.id] = 1;
        if (el.type === 'life') IS_LIFE[el.id] = 1;
        if (el.type === 'player') IS_PLAYER[el.id] = 1;
        
        if (el.gravity === true) HAS_GRAVITY[el.id] = 1;
        if (el.flammable === true) IS_FLAMMABLE[el.id] = 1;
        if (el.conductive === true) CONDUCTIVE[el.id] = 1;
        if (el.acidic !== undefined) ACIDIC[el.id] = el.acidic;
        if (el.acidResistant === true) ACID_RESISTANT[el.id] = 1;
        
        DENSITY[el.id] = el.density !== undefined ? el.density : (el.type === 'solid' ? 10 : (el.type === 'liquid' ? 1 : (el.type === 'gas' ? 0.5 : 0)));
        DISPERSION[el.id] = el.dispersion !== undefined ? el.dispersion : (el.type === 'liquid' ? 3 : (el.type === 'gas' ? 2 : 0));
        THERMAL_CONDUCTIVITY[el.id] = el.thermalConductivity !== undefined ? el.thermalConductivity : (el.type === 'gas' ? 0.01 : (el.type === 'liquid' ? 0.1 : 0.05));
        GROWTH_RATE[el.id] = el.growthRate || 0.05;
        
        // growsOn is usually an array of strings like ["WATER", "DIRT"]
        if (el.growsOn && Array.isArray(el.growsOn)) {
            GROWS_ON[el.id] = el.growsOn.map(name => ELEMENTS[name] ? ELEMENTS[name].id : 0);
        }
        if (el.behavior) {
            BEHAVIOR[el.id] = el.behavior;
        }
        DEFAULT_TEMP[el.id] = el.defaultTemp !== undefined ? el.defaultTemp : 70;
        ID_TO_NAME[el.id] = el.name || 'Unknown';
    });
}
window.buildLookupTables();

// Set initial transitions
TRANSITIONS[ELEMENTS.ICE.id] = [{ type: 'HOT', threshold: 32, becomes: 'WATER' }];
TRANSITIONS[ELEMENTS.WATER.id] = [
    { type: 'HOT', threshold: 212, becomes: 'STEAM' },
    { type: 'COLD', threshold: 32, becomes: 'ICE' }
];
TRANSITIONS[ELEMENTS.WOOD.id] = [{ type: 'HOT', threshold: 451, becomes: 'FIRE' }];
TRANSITIONS[ELEMENTS.LAVA.id] = [{ type: 'COLD', threshold: 1400, becomes: 'STONE' }];
TRANSITIONS[ELEMENTS.STONE.id] = [{ type: 'HOT', threshold: 2700, becomes: 'LAVA' }];
TRANSITIONS[ELEMENTS.SAND.id] = [{ type: 'HOT', threshold: 3000, becomes: 'GLASS' }];
TRANSITIONS[ELEMENTS.STEAM.id] = [{ type: 'COLD', threshold: 200, becomes: 'WATER' }];
TRANSITIONS[ELEMENTS.DYNAMITE.id] = [{ type: 'HOT', threshold: 400, becomes: 'EXPLODE' }];

// Set initial reactions
REACTIONS[ELEMENTS.FIRE.id] = [
    { touches: 'WOOD', turnSelfInto: 'FIRE', turnOtherInto: 'FIRE', chance: 0.05 },
    { touches: 'WATER', turnSelfInto: 'EMPTY', turnOtherInto: 'STEAM', chance: 0.2 },
    { touches: 'ICE', turnSelfInto: 'FIRE', turnOtherInto: 'WATER', chance: 0.2 },
    { touches: 'DYNAMITE', turnSelfInto: 'EXPLODE', chance: 1.0 }
];
REACTIONS[ELEMENTS.WATER.id] = [
    { touches: 'LAVA', turnSelfInto: 'STEAM', turnOtherInto: 'STONE', chance: 1.0 }
];

window.RAW_CONFIGS = {};

window.injectElement = function(config) {
    window.RAW_CONFIGS[config.idName] = Object.assign({}, config);
    if (config._delete) {
        if (ELEMENTS[config.idName]) {
            const id = ELEMENTS[config.idName].id;
            delete ELEMENTS[config.idName];
            delete TRANSITIONS[id];
            delete REACTIONS[id];
            delete CUSTOM_UPDATE[id];
            delete RAW_CONFIGS[config.idName];
            // Clear it from the grid
            if (typeof grid !== 'undefined' && grid) {
                for (let i = 0; i < grid.length; i++) {
                    if (grid[i] === id) {
                        grid[i] = 0;
                        updated[i] = 1;
                    }
                }
            }
        }
        if (TOOLS[config.idName]) {
            delete TOOLS[config.idName];
            delete CUSTOM_DRAW[config.idName];
        }
        
        window.buildLookupTables();
        setupUI();
        if (window.saveElementsToStorage) window.saveElementsToStorage();
        return;
    }

    if (config.type === 'tool') {
        TOOLS[config.idName] = {
            id: config.idName,
            name: config.name,
            uiColor: config.uiColor || '#ffffff',
            toolAction: config.toolAction,
            tempChange: config.tempChange || 0
        };
        
        if (config.toolOnDraw) {
            try {
                // Compile the AI's string into a function
                CUSTOM_DRAW[config.idName] = new Function('x', 'y', 'idx', 'grid', 'stateGrid', 'tempGrid', 'ELEMENTS', 'WIDTH', 'HEIGHT', 'getIndex', 'swap', 'updated', 'Math', config.toolOnDraw);
            } catch (e) {
                console.error("Failed to compile toolOnDraw for", config.name, e);
                throw e; // Rethrow so ai.js can catch it and self-correct
            }
        } else {
            delete CUSTOM_DRAW[config.idName];
        }
        
        setupUI();
        if (window.saveElementsToStorage) window.saveElementsToStorage();
        return;
    }

    const existing = ELEMENTS[config.idName];
    let maxId = 0;
    for (let key in ELEMENTS) {
        if (ELEMENTS[key].id > maxId) maxId = ELEMENTS[key].id;
    }
    const newId = existing ? existing.id : (maxId + 1);
    
    ELEMENTS[config.idName] = Object.assign({}, config, {
        id: newId,
        flammable: config.flammable || false,
        defaultTemp: config.defaultTemp || 20
    });
    
    if (config.transitions) TRANSITIONS[newId] = config.transitions;
    else delete TRANSITIONS[newId];
    
    if (config.reactions) REACTIONS[newId] = config.reactions;
    else delete REACTIONS[newId];
    
    if (config.onUpdate) {
        try {
            // Compile the AI's string into a function
            CUSTOM_UPDATE[newId] = new Function('x', 'y', 'i', 'grid', 'stateGrid', 'tempGrid', 'ELEMENTS', 'WIDTH', 'HEIGHT', 'getIndex', 'swap', 'updated', 'Math', config.onUpdate);
        } catch (e) {
            console.error("Failed to compile onUpdate for", config.name, e);
            throw e; // Rethrow so ai.js can catch it
        }
    } else {
        delete CUSTOM_UPDATE[newId];
    }

    PALETTES[newId] = new Uint32Array(256);
    for (let v = 0; v < 256; v++) {
        const shift = (v % 31) - 15;
        const r = Math.min(255, Math.max(0, config.color[0] + shift));
        const g = Math.min(255, Math.max(0, config.color[1] + shift));
        const b = Math.min(255, Math.max(0, config.color[2] + shift));
        PALETTES[newId][v] = (255 << 24) | (b << 16) | (g << 8) | r;
    }

    window.buildLookupTables();
    setupUI();
    if (window.saveElementsToStorage) window.saveElementsToStorage();
};

const TOOLS = {
    MIX: { id: 'MIX', name: 'Mix', uiColor: '#d946ef', toolAction: 'mix' },
    HEAT: { id: 'HEAT', name: 'Heat', uiColor: '#f97316', toolAction: 'heat', tempChange: 10 },
    COOL: { id: 'COOL', name: 'Cool', uiColor: '#0ea5e9', toolAction: 'cool', tempChange: -10 },
    CLEAR: { id: 'CLEAR', name: 'Clear', uiColor: '#ef4444' },
    UNDO: { id: 'UNDO', name: 'Undo', uiColor: '#8b5cf6' }
};

let currentElement = ELEMENTS.SAND.id;
let brushSize = 5;
let isDrawing = false;
let mouseX = 0;
let mouseY = 0;

// Grids
// We use typed arrays for speed. Grid stores element IDs. 
// stateGrid stores life/metadata (e.g. fire duration).
let grid = new Uint8Array(WIDTH * HEIGHT);
let stateGrid = new Uint8Array(WIDTH * HEIGHT);
let updated = new Uint8Array(WIDTH * HEIGHT);
let tempGrid = new Float32Array(WIDTH * HEIGHT).fill(70);
let tempBuffer = new Float32Array(WIDTH * HEIGHT).fill(70);

// History for Undo
const MAX_HISTORY = 30;
let history = [];
let framesSinceLastSave = 0;

function saveHistory() {
    if (history.length >= MAX_HISTORY) history.shift();
    history.push({
        grid: new Uint8Array(grid),
        stateGrid: new Uint8Array(stateGrid),
        tempGrid: new Float32Array(tempGrid)
    });
}

function undo() {
    if (history.length > 0) {
        const state = history.pop();
        grid.set(state.grid);
        stateGrid.set(state.stateGrid);
        tempGrid.set(state.tempGrid);
        render();
    }
}

// UI Setup
function setupUI() {
    const elGrid = document.getElementById('element-grid');
    elGrid.innerHTML = '';
    Object.values(ELEMENTS).forEach(el => {
        const btn = document.createElement('button');
        btn.className = `tool-btn ${currentElement === el.id ? 'active' : ''}`;
        btn.innerHTML = `<div class="color-swatch" style="background: ${el.uiColor}; border: 1px solid rgba(255,255,255,0.2)"></div> ${el.name}`;
        btn.onclick = () => {
            currentElement = el.id;
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        btn.oncontextmenu = (e) => {
            e.preventDefault();
            if (window.openCodeEditor) window.openCodeEditor(el.idName || Object.keys(ELEMENTS).find(k => ELEMENTS[k].id === el.id));
        };
        elGrid.appendChild(btn);
    });

    const actGrid = document.getElementById('action-grid');
    actGrid.innerHTML = '';
    Object.values(TOOLS).forEach(tool => {
        const btn = document.createElement('button');
        btn.className = 'tool-btn';
        btn.innerHTML = `<div class="color-swatch" style="background: ${tool.uiColor}"></div> ${tool.name}`;
        btn.onclick = () => {
            if (tool.id === 'CLEAR') {
                saveHistory();
                grid.fill(0);
                stateGrid.fill(0);
            } else if (tool.id === 'UNDO') {
                undo();
            } else {
                currentElement = tool.id;
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        };
        btn.oncontextmenu = (e) => {
            e.preventDefault();
            if (window.openCodeEditor) window.openCodeEditor(tool.id);
        };
        actGrid.appendChild(btn);
    });

    const brushSlider = document.getElementById('brush-size');
    brushSlider.oninput = (e) => {
        brushSize = parseInt(e.target.value);
        updateCursorSize();
    };

    // Keyboard shortcuts registered once in init, not here (prevents stacking)
}

function updateCursorSize() {
    const sizeStr = (brushSize * 2 * SCALE) + 'px';
    brushCursor.style.width = sizeStr;
    brushCursor.style.height = sizeStr;
    brushCursor.style.borderRadius = isSquareBrush ? '0' : '50%';
}

// Physics Loop
function getIndex(x, y) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return -1;
    return y * WIDTH + x;
}

function isEmpty(idx) {
    return idx >= 0 && idx < grid.length && grid[idx] === 0;
}

function isLiquid(idx) {
    if (idx < 0 || idx >= grid.length) return false;
    return IS_LIQUID[grid[idx]] === 1;
}

function swap(i, j) {
    const tmp = grid[i];
    grid[i] = grid[j];
    grid[j] = tmp;
    
    const tmpS = stateGrid[i];
    stateGrid[i] = stateGrid[j];
    stateGrid[j] = tmpS;
    
    const tmpT = tempGrid[i];
    tempGrid[i] = tempGrid[j];
    tempGrid[j] = tmpT;
    
    updated[i] = 1;
    updated[j] = 1;
}

function explode(cx, cy, radius) {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (dx*dx + dy*dy <= radius*radius) {
                const idx = getIndex(cx + dx, cy + dy);
                if (idx !== -1) {
                    const id = grid[idx];
                    if (id !== 0 && !HAS_GRAVITY[id]) {
                        // Much lower chance to destroy static objects like walls/glass
                        if (Math.random() < 0.95) continue; 
                    }
                    if (Math.random() < 0.6) {
                        grid[idx] = ELEMENTS.FIRE.id;
                        stateGrid[idx] = 30 + Math.random() * 30;
                        tempGrid[idx] = 1000; // Explosions are super hot
                    } else if (Math.random() < 0.8) {
                        grid[idx] = ELEMENTS.SMOKE.id;
                        stateGrid[idx] = 50 + Math.random() * 50;
                        tempGrid[idx] = 600;
                    } else {
                        grid[idx] = 0;
                    }
                    updated[idx] = 1;
                }
            }
        }
    }
}

let physicsFrame = 0;

function updatePhysics() {
    // 1. Heat Diffusion (Jacobi Iteration)
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const i = y * WIDTH + x;
            const id = grid[i];
            
            if (id === 0) {
                // Air is perfectly insulated and stays at ambient
                tempBuffer[i] = 70;
                continue;
            }

            let tempSum = 0;
            let count = 0;
            const neighbors = [
                getIndex(x+1, y), getIndex(x-1, y), getIndex(x, y+1), getIndex(x, y-1)
            ];
            
            for (let n of neighbors) {
                if (n !== -1 && grid[n] !== 0) {
                    tempSum += tempGrid[n];
                    count++;
                }
            }
            
            let k = THERMAL_CONDUCTIVITY[id];
            
            let avg = tempGrid[i];
            if (count > 0) {
                avg = tempSum / count;
            }
            
            tempBuffer[i] = tempGrid[i] + k * (avg - tempGrid[i]);
            
            if (tempBuffer[i] < -200) tempBuffer[i] = -200;
            if (tempBuffer[i] > 3000) tempBuffer[i] = 3000;
        }
    }
    
    const t = tempGrid;
    tempGrid = tempBuffer;
    tempBuffer = t;

    updated.fill(0);
    
    // Bottom-to-top, alternating left-to-right to prevent directional bias
    physicsFrame++;
    const dir = physicsFrame % 2 === 0 ? 1 : -1;
    
    for (let y = HEIGHT - 1; y >= 0; y--) {
        const startX = dir === 1 ? 0 : WIDTH - 1;
        const endX = dir === 1 ? WIDTH : -1;
        
        for (let x = startX; x !== endX; x += dir) {
            const i = y * WIDTH + x;
            if (updated[i]) continue;
            
            const elId = grid[i];
            if (elId === 0) continue;
            
            const temp = tempGrid[i];
            let transitioned = false;
            
            // 1. Phase Transitions
            if (TRANSITIONS[elId]) {
                for (let t of TRANSITIONS[elId]) {
                    if ((t.type === 'HOT' && temp > t.threshold) || (t.type === 'COLD' && temp < t.threshold)) {
                        // 10% chance per frame once threshold is reached prevents instant mass flashing
                        if (Math.random() < 0.1) {
                            if (t.becomes === 'EXPLODE') {
                                explode(x, y, 15);
                            } else if (ELEMENTS[t.becomes]) {
                                grid[i] = ELEMENTS[t.becomes].id;
                                if (ELEMENTS[t.becomes].type === 'gas') stateGrid[i] = 100;
                                if (t.becomes === 'FIRE') stateGrid[i] = 120;
                            }
                            updated[i] = 1;
                            transitioned = true;
                            break;
                        }
                    }
                }
            }
            if (transitioned) continue;

            const below = getIndex(x, y + 1);
            const belowL = getIndex(x - 1, y + 1);
            const belowR = getIndex(x + 1, y + 1);
            const above = getIndex(x, y - 1);
            
            // 2. Reactions
            if (REACTIONS[elId]) {
                const neighbors = [below, belowL, belowR, above, getIndex(x-1, y), getIndex(x+1, y)];
                for (let n of neighbors) {
                    if (n !== -1 && grid[n] !== 0) {
                        const touchId = grid[n];
                        for (let r of REACTIONS[elId]) {
                            const targetEl = ELEMENTS[r.touches];
                            if ((r.touches === 'ANY' && touchId !== elId) || (targetEl && targetEl.id === touchId)) {
                                if (Math.random() <= (r.chance !== undefined ? r.chance : 1.0)) {
                                    if (r.turnSelfInto === 'EXPLODE') {
                                        explode(x, y, 15);
                                        transitioned = true;
                                        break;
                                    }
                                    if (r.turnOtherInto === 'EXPLODE') {
                                        explode(x + (n%WIDTH - x), y + (Math.floor(n/WIDTH) - y), 15); // approx
                                    }
                                    
                                    if (r.turnSelfInto) {
                                        if (r.turnSelfInto === 'EMPTY') grid[i] = 0;
                                        else if (ELEMENTS[r.turnSelfInto]) grid[i] = ELEMENTS[r.turnSelfInto].id;
                                        if (r.turnSelfInto === 'FIRE') stateGrid[i] = 100;
                                        updated[i] = 1;
                                    }
                                    if (r.turnOtherInto) {
                                        if (r.turnOtherInto === 'EMPTY') grid[n] = 0;
                                        else if (ELEMENTS[r.turnOtherInto]) grid[n] = ELEMENTS[r.turnOtherInto].id;
                                        if (r.turnOtherInto === 'FIRE') stateGrid[n] = 100;
                                        updated[n] = 1;
                                    }
                                    transitioned = true;
                                    break;
                                }
                            }
                        }
                        if (transitioned) break;
                    }
                }
            }
            if (transitioned) continue;
            
            const neighborsList = [below, belowL, belowR, above, getIndex(x-1, y), getIndex(x+1, y)];

            // 2b. Automatic fire spreading to flammable elements
            // This makes the "flammable" flag actually work for ALL elements
            if (IS_FLAMMABLE[elId]) {
                for (let n of neighborsList) {
                    if (n !== -1) {
                        const nId = grid[n];
                        // Catch fire from adjacent fire, lava, or extremely hot neighbors
                        if (nId === ELEMENTS.FIRE.id || nId === ELEMENTS.LAVA.id || tempGrid[n] > 800) {
                            if (Math.random() < 0.03) {
                                grid[i] = ELEMENTS.FIRE.id;
                                stateGrid[i] = 80 + Math.floor(Math.random() * 60);
                                tempGrid[i] = 1000;
                                updated[i] = 1;
                                transitioned = true;
                                break;
                            }
                        }
                    }
                }
            }
            if (transitioned) continue;
            
            // Advanced Custom Mechanics
            if (CUSTOM_UPDATE[elId] && !ERRORED_SCRIPTS.has(elId)) {
                try {
                    // Call AI-generated custom behavior
                    CUSTOM_UPDATE[elId](x, y, i, grid, stateGrid, tempGrid, ELEMENTS, WIDTH, HEIGHT, getIndex, swap, updated, Math);
                } catch (e) {
                    ERRORED_SCRIPTS.add(elId);
                    console.error(`[AI SCRIPT DISABLED] Runtime error for element ID ${elId}:`, e.message);
                }
            }
            if (updated[i]) continue;

            if (ACIDIC[elId] > 0 && Math.random() < ACIDIC[elId]) {
                for (let n of neighborsList) {
                    if (n !== -1 && grid[n] !== 0 && !ACID_RESISTANT[grid[n]] && grid[n] !== elId) {
                        grid[n] = ELEMENTS.SMOKE.id;
                        stateGrid[n] = 50;
                        updated[n] = 1;
                        if (Math.random() < 0.2) {
                            grid[i] = 0;
                            updated[i] = 1;
                            transitioned = true;
                            break;
                        }
                    }
                }
            }
            if (transitioned) continue;

            if (elId === ELEMENTS.VIRUS.id && Math.random() < 0.1) {
                for (let n of neighborsList) {
                    if (n !== -1 && grid[n] !== 0 && grid[n] !== elId) {
                        grid[n] = elId;
                        updated[n] = 1;
                        break;
                    }
                }
            }
            
            if (elId === ELEMENTS.CLONER.id) {
                if (stateGrid[i] === 0) {
                    for (let n of neighborsList) {
                        if (n !== -1 && grid[n] !== 0 && grid[n] !== elId) {
                            stateGrid[i] = grid[n];
                            break;
                        }
                    }
                } else if (Math.random() < 0.5) {
                    for (let n of neighborsList) {
                        if (n !== -1 && grid[n] === 0) {
                            grid[n] = stateGrid[i];
                            updated[n] = 1;
                            break;
                        }
                    }
                }
            }

            // 3. Movement
            const isLiq = IS_LIQUID[elId];
            const isGas = IS_GAS[elId];
            const hasGrav = HAS_GRAVITY[elId];
            const dens = DENSITY[elId];

            const flowDir = Math.random() > 0.5 ? 1 : -1;
            const b1 = getIndex(x + flowDir, y + 1);
            const b2 = getIndex(x - flowDir, y + 1);
            
            // Helper for density swap
            const canSink = (targetIdx) => {
                if (targetIdx === -1) return false;
                const tEl = grid[targetIdx];
                if (tEl === 0) return true;
                if (tEl === elId) return false;
                const tIsSolid = !IS_LIQUID[tEl] && !IS_GAS[tEl];
                if (tIsSolid) return false; 
                return dens > DENSITY[tEl];
            };
            
            const canRise = (targetIdx) => {
                if (targetIdx === -1) return false;
                const tEl = grid[targetIdx];
                if (tEl === 0) return true;
                if (tEl === elId) return false;
                const tIsSolid = !IS_LIQUID[tEl] && !IS_GAS[tEl];
                if (tIsSolid) return false; 
                return dens < DENSITY[tEl];
            };

            if (IS_PLAYER[elId]) {
                let moved = false;
                if (KEYS.up) { const t = getIndex(x, y - 1); if (t !== -1 && grid[t] === 0) { swap(i, t); moved = true; } }
                else if (KEYS.down) { const t = getIndex(x, y + 1); if (t !== -1 && grid[t] === 0) { swap(i, t); moved = true; } }
                if (!moved && KEYS.left) { const t = getIndex(x - 1, y); if (t !== -1 && grid[t] === 0) { swap(i, t); moved = true; } }
                if (!moved && KEYS.right) { const t = getIndex(x + 1, y); if (t !== -1 && grid[t] === 0) { swap(i, t); moved = true; } }
                if (!moved && hasGrav) {
                    if (canSink(below)) swap(i, below);
                }
            } else if (IS_LIFE[elId]) {
                const behavior = BEHAVIOR[elId] || "wander";
                if (behavior === "fly") {
                    const rx = x + (Math.floor(Math.random() * 3) - 1);
                    const ry = y + (Math.floor(Math.random() * 3) - 1);
                    const t = getIndex(rx, ry);
                    if (t !== -1 && grid[t] === 0) swap(i, t);
                } else if (behavior === "crawl") {
                    if (!isEmpty(below)) {
                        const side = getIndex(x + dir, y);
                        if (side !== -1 && grid[side] === 0) swap(i, side);
                    } else if (hasGrav && canSink(below)) {
                        swap(i, below);
                    }
                } else { // wander
                    const side = getIndex(x + dir, y);
                    if (side !== -1 && grid[side] === 0) swap(i, side);
                    else if (hasGrav && canSink(below)) swap(i, below);
                }
            } else if (IS_PLANT[elId]) {
                if (Math.random() < GROWTH_RATE[elId]) {
                    let canGrow = false;
                    const reqs = GROWS_ON[elId] || [];
                    if (reqs.length > 0) {
                        const neighbors = [getIndex(x+1, y), getIndex(x-1, y), getIndex(x, y+1), getIndex(x, y-1)];
                        for (let n of neighbors) {
                            if (n !== -1 && reqs.includes(grid[n])) { canGrow = true; break; }
                        }
                    } else {
                        canGrow = true; // grows anywhere
                    }
                    if (canGrow) {
                        const growTargets = [getIndex(x+1, y), getIndex(x-1, y), getIndex(x, y+1), getIndex(x, y-1)];
                        const emptyTargets = growTargets.filter(t => t !== -1 && grid[t] === 0);
                        if (emptyTargets.length > 0) {
                            const target = emptyTargets[Math.floor(Math.random() * emptyTargets.length)];
                            grid[target] = elId;
                            updated[target] = 1;
                        }
                    }
                }
                if (hasGrav && canSink(below)) swap(i, below);
            }
            
            const uL = getIndex(x - 1, y - 1);
            const uR = getIndex(x + 1, y - 1);
            
            const gravityChance = 0.95; // Adds organic stochastic flow
            
            if (hasGrav && !isLiq && !isGas) { 
                // Falling solid
                if (Math.random() < gravityChance) {
                    if (canSink(below)) swap(i, below);
                    else if (canSink(belowL) && canSink(belowR)) swap(i, Math.random() > 0.5 ? belowL : belowR);
                    else if (canSink(belowL)) swap(i, belowL);
                    else if (canSink(belowR)) swap(i, belowR);
                }
            }
            else if (isLiq) { 
                // Liquid
                if (Math.random() < gravityChance) {
                    if (canSink(below)) swap(i, below);
                    else if (canSink(belowL) && canSink(belowR)) swap(i, Math.random() > 0.5 ? belowL : belowR);
                    else if (canSink(belowL)) swap(i, belowL);
                    else if (canSink(belowR)) swap(i, belowR);
                    else {
                        // Dispersion (flow rate)
                        const dispVal = DISPERSION[elId] || 1;
                        let disp = Math.floor(dispVal);
                        if (Math.random() < (dispVal - disp)) disp++;

                        if (disp > 0) {
                            const fDir = Math.random() > 0.5 ? 1 : -1;
                            
                            let furthest1 = -1;
                            for (let d = 1; d <= disp; d++) {
                                const s1 = getIndex(x + (fDir * d), y);
                                if (canSink(s1)) furthest1 = s1;
                                else break;
                            }
                            if (furthest1 !== -1) {
                                swap(i, furthest1);
                            } else {
                                let furthest2 = -1;
                                for (let d = 1; d <= disp; d++) {
                                    const s2 = getIndex(x - (fDir * d), y);
                                    if (canSink(s2)) furthest2 = s2;
                                    else break;
                                }
                                if (furthest2 !== -1) swap(i, furthest2);
                            }
                        }
                    }
                }
            }
            else if (isGas) { 
                // Gas
                if (Math.random() < gravityChance) {
                    if (canRise(above)) swap(i, above);
                    else if (canRise(uL) && canRise(uR)) swap(i, Math.random() > 0.5 ? uL : uR);
                    else if (canRise(uL)) swap(i, uL);
                    else if (canRise(uR)) swap(i, uR);
                    else {
                        const disp = DISPERSION[elId] || 2;
                        const fDir = Math.random() > 0.5 ? 1 : -1;
                        
                        let furthest1 = -1;
                        for (let d = 1; d <= disp; d++) {
                            const s1 = getIndex(x + (fDir * d), y);
                            if (canRise(s1)) furthest1 = s1;
                            else break;
                        }
                        if (furthest1 !== -1) {
                            swap(i, furthest1);
                        } else {
                            let furthest2 = -1;
                            for (let d = 1; d <= disp; d++) {
                                const s2 = getIndex(x - (fDir * d), y);
                                if (canRise(s2)) furthest2 = s2;
                                else break;
                            }
                            if (furthest2 !== -1) swap(i, furthest2);
                        }
                    }
                }
                
                // Gas lifetime
                if (stateGrid[i] === 0) {
                    stateGrid[i] = 100 + Math.floor(Math.random() * 150);
                } else {
                    stateGrid[i]--;
                    if (stateGrid[i] <= 0) {
                        // Check if it has a COLD transition, apply it, else die out
                        let morphed = false;
                        if (TRANSITIONS[elId]) {
                            for (let t of TRANSITIONS[elId]) {
                                if (t.type === 'COLD') {
                                    grid[i] = ELEMENTS[t.becomes] ? ELEMENTS[t.becomes].id : 0;
                                    stateGrid[i] = Math.floor(Math.random() * 255); // Reset state for the new element
                                    morphed = true;
                                    break;
                                }
                            }
                        }
                        if (!morphed) {
                            grid[i] = 0; // Dies out
                        }
                        updated[i] = 1;
                    }
                }
            }
        }
    }
}

// Rendering
const imgData = ctx.createImageData(WIDTH, HEIGHT);
const buf = new Uint32Array(imgData.data.buffer);
const glowImgData = glowCtx.createImageData(WIDTH, HEIGHT);
const glowBuf = new Uint32Array(glowImgData.data.buffer);

const PALETTES = {};
Object.values(ELEMENTS).forEach(el => {
    if (el.id !== 0) {
        PALETTES[el.id] = new Uint32Array(256);
        for (let v = 0; v < 256; v++) {
            // Provide a varied texture shift based on state 'v'
            // Noise between -15 and +15
            const shift = (v % 31) - 15;
            const r = Math.min(255, Math.max(0, el.color[0] + shift));
            const g = Math.min(255, Math.max(0, el.color[1] + shift));
            const b = Math.min(255, Math.max(0, el.color[2] + shift));
            // ABGR format for little-endian Uint32Array
            PALETTES[el.id][v] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
    }
});

function render() {
    buf.fill(0);
    glowBuf.fill(0);
    for (let i = 0; i < grid.length; i++) {
        let id = grid[i];
        if (id === 0) continue;
        
        if (id === ELEMENTS.FIRE.id || (IS_GAS[id] && tempGrid[i] > 400)) {
            // Flicker fire or extremely hot gases
            const r = 200 + Math.random() * 55;
            const g = 50 + Math.random() * 100;
            glowBuf[i] = (255 << 24) | (0 << 16) | (g << 8) | r;
        } else if (id === ELEMENTS.SMOKE.id || id === ELEMENTS.STEAM.id || IS_GAS[id]) {
            glowBuf[i] = PALETTES[id] ? PALETTES[id][stateGrid[i]] : 0;
        } else if (id === ELEMENTS.LAVA.id || (IS_LIQUID[id] && tempGrid[i] > 800)) {
            const px = i % WIDTH;
            const py = Math.floor(i / WIDTH);
            const flicker = (Math.sin(px*0.1 + frames*0.05) * Math.cos(py*0.1 + frames*0.05)) * 20 + 20;
            const r = Math.min(255, 220 + flicker);
            const g = Math.min(255, 70 + flicker * 2);
            const b = Math.max(0, 10 - flicker);
            const col = (255 << 24) | (b << 16) | (g << 8) | r;
            buf[i] = col;
            glowBuf[i] = col;
        } else if (CONDUCTIVE[id] && stateGrid[i] > 0) {
            buf[i] = PALETTES[id] ? PALETTES[id][stateGrid[i]] : 0;
            // Bright cyan/yellow glow for electricity
            glowBuf[i] = (255 << 24) | (255 << 16) | (255 << 8) | 50; 
        } else {
            buf[i] = PALETTES[id] ? PALETTES[id][stateGrid[i]] : 0;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    glowCtx.putImageData(glowImgData, 0, 0);
}

// Main Loop
let lastTime = 0;
let frames = 0;

function loop(t) {
    if (t - lastTime >= 1000) {
        fpsCounter.innerText = `FPS: ${frames}`;
        frames = 0;
        lastTime = t;
    }
    frames++;

    if (isDrawing) draw(mouseX, mouseY);
    
    updatePhysics();
    render();
    
    requestAnimationFrame(loop);
}

let isRightClick = false;
let isSquareBrush = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Input Handling
function draw(mx, my) {
    const cx = Math.floor(mx / SCALE);
    const cy = Math.floor(my / SCALE);
    
    if (cx < 0 || cx >= WIDTH || cy < 0 || cy >= HEIGHT) return;

    if (framesSinceLastSave > 30) {
        saveHistory();
        framesSinceLastSave = 0;
    }
    framesSinceLastSave++;

    const activeEl = isRightClick ? ELEMENTS.EMPTY.id : currentElement;

    for (let dy = -brushSize; dy <= brushSize; dy++) {
        for (let dx = -brushSize; dx <= brushSize; dx++) {
            if (isSquareBrush || (dx*dx + dy*dy <= brushSize*brushSize)) {
                const x = cx + dx;
                const y = cy + dy;
                const idx = getIndex(x, y);
                if (idx !== -1) {
                    const toolDef = TOOLS[activeEl];
                    if (toolDef) {
                        if (CUSTOM_DRAW[activeEl] && !ERRORED_TOOLS.has(activeEl)) {
                            try {
                                CUSTOM_DRAW[activeEl](x, y, idx, grid, stateGrid, tempGrid, ELEMENTS, WIDTH, HEIGHT, getIndex, swap, updated, Math);
                            } catch (e) {
                                ERRORED_TOOLS.add(activeEl);
                                console.error(`[AI TOOL DISABLED] Runtime error for tool ID ${activeEl}:`, e.message);
                            }
                        } else if (toolDef.toolAction === 'heat' || toolDef.toolAction === 'cool') {
                            const change = toolDef.tempChange || 150;
                            tempGrid[idx] = Math.max(-200, Math.min(3000, tempGrid[idx] + change));
                        } else if (toolDef.toolAction === 'shock') {
                            if (grid[idx] !== 0) {
                                stateGrid[idx] = 15;
                                updated[idx] = 1;
                            }
                        } else if (toolDef.toolAction === 'mix') {
                            const rdx = Math.floor(Math.random() * (brushSize * 2 + 1)) - brushSize;
                            const rdy = Math.floor(Math.random() * (brushSize * 2 + 1)) - brushSize;
                            if (isSquareBrush || (rdx*rdx + rdy*rdy <= brushSize*brushSize)) {
                                const nidx = getIndex(cx + rdx, cy + rdy);
                                if (nidx !== -1 && nidx !== idx) {
                                    swap(idx, nidx);
                                }
                            }
                        } else if (toolDef.toolAction === 'delete') {
                            grid[idx] = 0;
                        }
                    } else if (activeEl === ELEMENTS.EMPTY.id || grid[idx] === 0) {
                        grid[idx] = activeEl;
                        if (activeEl === ELEMENTS.FIRE.id) {
                            stateGrid[idx] = 60 + Math.floor(Math.random() * 20);
                        } else if (IS_GAS[activeEl]) {
                            stateGrid[idx] = 150 + Math.floor(Math.random() * 100);
                        } else {
                            stateGrid[idx] = Math.floor(Math.random() * 255);
                        }
                        tempGrid[idx] = DEFAULT_TEMP[activeEl] || 70;
                    }
                }
            }
        }
    }
}

canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    isRightClick = e.button === 2;
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    framesSinceLastSave = 999; // Force save on first click
    draw(mouseX, mouseY);
});

window.addEventListener('mouseup', () => isDrawing = false);

canvas.addEventListener('mousemove', (e) => {
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    
    if (isDrawing) {
        // Interpolate to avoid gaps when moving fast
        const dx = mouseX - lastMouseX;
        const dy = mouseY - lastMouseY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        // Step size based on brush radius so we don't leave gaps
        const stepSize = Math.max(1, (SCALE * brushSize) / 2);
        const steps = Math.max(1, Math.ceil(distance / stepSize));
        
        for (let i = 1; i <= steps; i++) {
            const ix = lastMouseX + dx * (i / steps);
            const iy = lastMouseY + dy * (i / steps);
            draw(ix, iy);
        }
    }
    
    // Debug info logic
    const cx = Math.floor(mouseX / SCALE);
    const cy = Math.floor(mouseY / SCALE);
    if (cx >= 0 && cx < WIDTH && cy >= 0 && cy < HEIGHT) {
        const idx = getIndex(cx, cy);
        const id = grid[idx];
        const state = stateGrid[idx];
        
        const elName = ID_TO_NAME[id] || 'Empty';

        document.getElementById('dbg-name').innerText = elName;
        document.getElementById('dbg-id').innerText = id;
        document.getElementById('dbg-state').innerText = state;
        document.getElementById('dbg-coord').innerText = `(${cx}, ${cy})`;
        document.getElementById('dbg-temp-val').innerText = `${Math.round(tempGrid[idx])}°F`;
    }
    
    brushCursor.style.display = 'block';
    brushCursor.style.left = (e.clientX - brushSize * SCALE) + 'px';
    brushCursor.style.top = (e.clientY - brushSize * SCALE) + 'px';
});

canvas.addEventListener('mouseleave', () => {
    brushCursor.style.display = 'none';
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) brushSize = Math.min(50, brushSize + 1);
    else brushSize = Math.max(1, brushSize - 1);
    document.getElementById('brush-size').value = brushSize;
    updateCursorSize();
});

document.getElementById('btn-clear').addEventListener('click', () => {
    grid.fill(0);
    stateGrid.fill(0);
    tempGrid.fill(70);
    updated.fill(0);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    glowCtx.clearRect(0, 0, WIDTH, HEIGHT);
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Are you sure you want to FACTORY RESET? This will delete all AI-generated elements and clear your canvas!")) {
        localStorage.removeItem('dustSandbox_elements');
        location.reload();
    }
});

// Global keyboard shortcuts (registered once, outside setupUI to prevent stacking)
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.ctrlKey && e.key === 'z') undo();
    if (e.key === 'Tab') {
        e.preventDefault();
        isSquareBrush = !isSquareBrush;
        updateCursorSize();
    }
});

// Persistence: save AI elements to localStorage on every injection
window.saveElementsToStorage = function() {
    const custom = {};
    for (let key in RAW_CONFIGS) {
        custom[key] = RAW_CONFIGS[key];
    }
    try {
        localStorage.setItem('dustSandbox_elements', JSON.stringify(custom));
    } catch (e) {
        console.warn('Failed to save elements to localStorage:', e);
    }
};

// Persistence: restore AI elements from localStorage on load
(function restoreElements() {
    try {
        const saved = localStorage.getItem('dustSandbox_elements');
        if (saved) {
            const configs = JSON.parse(saved);
            for (let key in configs) {
                try {
                    window.injectElement(configs[key]);
                } catch (e) {
                    console.warn('Failed to restore element:', key, e);
                }
            }
        }
    } catch (e) {
        console.warn('Failed to restore elements from localStorage:', e);
    }
})();

// Init
setupUI();
updateCursorSize();
requestAnimationFrame(loop);

// Code Editor Logic
window.openCodeEditor = function(idName) {
    let config = RAW_CONFIGS[idName];
    if (!config) {
        // Fallback for built-in elements that don't have a RAW_CONFIGS entry yet
        if (ELEMENTS[idName]) {
            config = Object.assign({}, ELEMENTS[idName]);
            config.idName = idName;
            if (TRANSITIONS[config.id]) config.transitions = TRANSITIONS[config.id];
            if (REACTIONS[config.id]) config.reactions = REACTIONS[config.id];
        } else if (TOOLS[idName]) {
            config = Object.assign({}, TOOLS[idName]);
            config.idName = idName;
            config.type = 'tool';
        }
    }
    
    if (!config) return;
    
    document.getElementById('code-editor-textarea').value = JSON.stringify([config], null, 2);
    document.getElementById('code-editor-modal').style.display = 'flex';
};

document.getElementById('code-editor-cancel').addEventListener('click', () => {
    document.getElementById('code-editor-modal').style.display = 'none';
});

document.getElementById('code-editor-save').addEventListener('click', () => {
    const rawCode = document.getElementById('code-editor-textarea').value;
    try {
        const parsed = JSON.parse(rawCode);
        if (Array.isArray(parsed)) {
            parsed.forEach(cfg => window.injectElement(cfg));
        } else {
            window.injectElement(parsed);
        }
        document.getElementById('code-editor-modal').style.display = 'none';
    } catch (e) {
        alert("Invalid JSON format! Check for syntax errors.\n\n" + e.message);
    }
});
