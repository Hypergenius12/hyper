// ========================================
// Main.js — Core Game Loop and State Machine
// ========================================

let mouseX = 0, mouseY = 0;
let isDragging = false;
let hoverCol = -1;
let hoverRow = -1;

const GAME_STATES = {
    MENU: 0,
    EDITOR: 1,
    TRAIN: 2,
    RACE: 3,
    GARAGE: 4,
    PLAY: 5
};
window.GAME_STATES = GAME_STATES;

let currentState = GAME_STATES.MENU;
let canvas, ctx, collisionCanvas, sensorCanvas;
let collisionGrid = null;
let sensorGrid = null;
let camera;
let currentTrack = null;
let playerCar = null;
let aiCars = [];
let bestBotCar = null;
let bestTrainLap = Infinity;
let raceStarted = false;
window.enableDrift = false;
let geneticAlgo = null;
let trainTimeLimit = 15;
let trainTimer = 0;
let trainSpeed = 1;
let trainRunning = false;
let physicsAccumulator = 0;

Object.defineProperty(window, 'bestTrainLap', { get: () => bestTrainLap, set: v => { bestTrainLap = v; }, configurable: true });
Object.defineProperty(window, 'geneticAlgo', { get: () => geneticAlgo, set: v => { geneticAlgo = v; }, configurable: true });
Object.defineProperty(window, 'aiCars', { get: () => aiCars, set: v => { aiCars = v; }, configurable: true });
Object.defineProperty(window, 'currentTrack', { get: () => currentTrack, set: v => { currentTrack = v; }, configurable: true });
Object.defineProperty(window, 'currentTrackName', { get: () => currentTrackName, set: v => { currentTrackName = v; }, configurable: true });
Object.defineProperty(window, 'bestBotCar', { get: () => bestBotCar, set: v => { bestBotCar = v; }, configurable: true });
Object.defineProperty(window, 'currentState', { get: () => currentState, set: v => { currentState = v; }, configurable: true });
Object.defineProperty(window, 'trainRunning', { get: () => trainRunning, set: v => { trainRunning = v; }, configurable: true });
Object.defineProperty(window, 'trackPersonalBest', { get: () => trackPersonalBest, set: v => { trackPersonalBest = v; }, configurable: true });
Object.defineProperty(window, 'camera', { get: () => camera, set: v => { camera = v; }, configurable: true });
Object.defineProperty(window, 'editorSelectedTile', { get: () => editorSelectedTile, set: v => { editorSelectedTile = v; }, configurable: true });
Object.defineProperty(window, 'editorMode', { get: () => editorMode, set: v => { editorMode = v; }, configurable: true });
let showSensors = true;
let manualCamera = false;
let isWatchingReplay = false;
let replayCar = null;
let wasTrainingRunning = false;

let keys = { up: false, down: false, left: false, right: false };
let lastTime = 0;

// Custom Tracks
let customTracks = {};
let currentTrackName = 'Default Oval';

// Ghost Car & Track Records (Time Trial)
let trackPersonalBest = Infinity;
let bestGhostPath = null;
let currentLapRecording = [];
let showGhost = localStorage.getItem('neurotrack_show_ghost') !== 'false';

function setGhostEnabled(val) {
    showGhost = !!val;
    try {
        localStorage.setItem('neurotrack_show_ghost', showGhost ? 'true' : 'false');
    } catch (e) {}
    const hudToggle = document.getElementById('hud-ghost');
    if (hudToggle) hudToggle.checked = showGhost;
    const menuToggle = document.getElementById('menu-ghost');
    if (menuToggle) menuToggle.checked = showGhost;
}
window.setGhostEnabled = setGhostEnabled;

function isBetterCandidate(a, b) {
    if (!a || !a.brain) return false;
    if (!b || !b.brain) return true;

    const aLap = (a.bestLap !== undefined && a.bestLap !== null && a.bestLap < Infinity) ? a.bestLap : Infinity;
    const bLap = (b.bestLap !== undefined && b.bestLap !== null && b.bestLap < Infinity) ? b.bestLap : Infinity;

    // Both finished a lap
    if (aLap < Infinity && bLap < Infinity) {
        if (Math.abs(aLap - bLap) > 0.005) {
            return aLap < bLap; // Faster time wins
        }
        return (a.fitness || 0) > (b.fitness || 0); // Tie-break with higher fitness
    }

    // One finished a lap, other did not
    if (aLap < Infinity && bLap === Infinity) return true;
    if (aLap === Infinity && bLap < Infinity) return false;

    // Neither finished a lap -> furthest (highest fitness) wins!
    return (a.fitness || 0) > (b.fitness || 0);
}
window.isBetterCandidate = isBetterCandidate;

function isStartTile(id) {
    return id === 7 || id === 8 || (id >= 10 && id <= 13);
}

function loadTrackRecords(name) {
    trackPersonalBest = Infinity;
    bestGhostPath = null;
    currentLapRecording = [];
    if (!name) {
        const bestTimeEl = document.getElementById('best-time');
        if (bestTimeEl) bestTimeEl.innerText = '--';
        return;
    }
    try {
        const savedTime = localStorage.getItem('neurotrack_best_time_' + name);
        if (savedTime) {
            const parsedTime = parseFloat(savedTime);
            if (!isNaN(parsedTime) && parsedTime > 0) {
                trackPersonalBest = parsedTime;
            }
        }
        const savedGhost = localStorage.getItem('neurotrack_ghost_' + name);
        if (savedGhost) {
            const parsedGhost = JSON.parse(savedGhost);
            if (Array.isArray(parsedGhost) && parsedGhost.length > 0) {
                bestGhostPath = parsedGhost;
            }
        }
    } catch (e) {
        console.warn('Could not load track records for ' + name, e);
        trackPersonalBest = Infinity;
        bestGhostPath = null;
    }
    const bestTimeEl = document.getElementById('best-time');
    if (bestTimeEl) {
        bestTimeEl.innerText = trackPersonalBest === Infinity ? '--' : trackPersonalBest.toFixed(2);
    }
}

function getGhostSample(path, t) {
    if (!path || path.length === 0) return null;
    if (t <= path[0].t) return path[0];
    if (t >= path[path.length - 1].t) return path[path.length - 1];

    let low = 0;
    let high = path.length - 1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (path[mid].t < t) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    const idx1 = Math.max(0, low - 1);
    const idx2 = Math.min(path.length - 1, low);
    if (idx1 === idx2) return path[idx1];

    const p1 = path[idx1];
    const p2 = path[idx2];
    const span = p2.t - p1.t;
    const factor = span > 0.0001 ? (t - p1.t) / span : 0;

    let da = p2.angle - p1.angle;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;

    return {
        x: p1.x + (p2.x - p1.x) * factor,
        y: p1.y + (p2.y - p1.y) * factor,
        angle: p1.angle + da * factor,
        overpass: factor < 0.5 ? p1.overpass : p2.overpass
    };
}

// Editor State
let editorSelectedTile = 1;
let isPainting = false;
let paintTileType = 0;
let lastPaintPos = { col: -1, row: -1 };

let editorMode = 'place'; // 'place', 'select', 'checkpoint'
let selectedTiles = new Set(); // Set of "c,r" strings
let selectedRoadAttr = 'default';
let selectedWallAttr = 'default';
let isMarquee = false;
let marqueeStart = null;
let marqueeEnd = null;
let checkpointDrawing = null; // { x1, y1, x2, y2 }
let autoDrawPath = []; // Path of tiles drawn in current stroke
let originalTiles = new Map(); // Maps "c,r" -> tileId before current stroke

function getBaseTileForIntersection(c, r) {
    const key = `${c},${r}`;
    const orig = originalTiles.has(key) ? originalTiles.get(key) : (currentTrack ? currentTrack.getTile(c, r) : 0);
    if (Track.isStraightOrIntersection(orig)) {
        return orig;
    }
    const current = currentTrack ? currentTrack.getTile(c, r) : 0;
    if (Track.isStraightOrIntersection(current)) {
        return current;
    }
    return orig;
}

let editorHistory = [];
let editorRedoHistory = [];

function saveEditorState() {
    if (!currentTrack) return;
    const state = {
        grid: new Uint8Array(currentTrack.grid),
        autoGrid: new Uint32Array(currentTrack.autoGrid),
        portals: JSON.parse(JSON.stringify(currentTrack.portals || [])),
        tileAttrs: JSON.parse(JSON.stringify(currentTrack.tileAttrs || {})),
        autoCheckpoints: currentTrack.autoCheckpoints !== false,
        customCheckpoints: JSON.parse(JSON.stringify(currentTrack.customCheckpoints || []))
    };
    editorHistory.push(state);
    if (editorHistory.length > 50) editorHistory.shift();
    editorRedoHistory = [];
}
window.saveEditorState = saveEditorState;

function updateSelectionUI() {
    const count = selectedTiles ? selectedTiles.size : 0;
    const infoEl = document.getElementById('selection-info');
    if (infoEl) {
        infoEl.textContent = `${count} tile${count === 1 ? '' : 's'} selected`;
    }
}
window.updateSelectionUI = updateSelectionUI;

function syncEditorUIWithTrack() {
    if (!currentTrack) return;
    const autoCpEl = document.getElementById('editor-auto-checkpoints');
    if (autoCpEl) {
        autoCpEl.checked = currentTrack.autoCheckpoints !== false;
    }
    const manualCpControls = document.getElementById('manual-checkpoint-controls');
    if (manualCpControls) {
        manualCpControls.style.display = (currentTrack.autoCheckpoints === false) ? 'block' : 'none';
    }
    updateSelectionUI();
}
window.syncEditorUIWithTrack = syncEditorUIWithTrack;

function setEditorMode(mode) {
    editorMode = mode;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('tool-btn-' + mode);
    if (activeBtn) activeBtn.classList.add('active');

    const attrPanel = document.getElementById('editor-attribute-panel');
    if (attrPanel) {
        attrPanel.style.display = (mode === 'select') ? 'block' : 'none';
    }

    const palette = document.getElementById('editor-palette');
    if (palette) {
        palette.style.opacity = (mode === 'place') ? '1' : '0.4';
        palette.style.pointerEvents = (mode === 'place') ? 'auto' : 'none';
    }

    if (mode === 'checkpoint') {
        if (currentTrack && currentTrack.autoCheckpoints !== false) {
            saveEditorState();
            currentTrack.autoCheckpoints = false;
            const autoCpEl = document.getElementById('editor-auto-checkpoints');
            if (autoCpEl) autoCpEl.checked = false;
            const manualCpControls = document.getElementById('manual-checkpoint-controls');
            if (manualCpControls) manualCpControls.style.display = 'block';
            currentTrack.computeCheckpoints();
            currentTrack.markDirty();
        }
    }
}
window.setEditorMode = setEditorMode;

function selectAttribute(type, val) {
    if (type === 'road') {
        selectedRoadAttr = val;
        document.querySelectorAll('.road-attr-group .attr-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-val') === val);
        });
        const lbl = document.getElementById('active-road-label');
        if (lbl) lbl.textContent = val.toUpperCase();
    } else if (type === 'wall') {
        selectedWallAttr = val;
        document.querySelectorAll('.wall-attr-group .attr-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-val') === val);
        });
        const lbl = document.getElementById('active-wall-label');
        if (lbl) lbl.textContent = (val === 'default' ? 'CRASH' : val.toUpperCase());
    }

    if (selectedTiles && selectedTiles.size > 0 && currentTrack) {
        saveEditorState();
        for (const key of selectedTiles) {
            const [c, r] = key.split(',').map(Number);
            currentTrack.setTileAttrs(c, r, selectedRoadAttr, selectedWallAttr);
        }
        currentTrack.markDirty();
        if (collisionCanvas) currentTrack.renderCollisionCanvas(collisionCanvas);
    }
    saveSession();
}
window.selectAttribute = selectAttribute;

function saveSession() {
    if (!currentTrack) return;
    try {
        const session = {
            trackName: currentTrackName || 'Default Oval',
            cols: currentTrack.cols,
            rows: currentTrack.rows,
            trackGrid: Array.from(currentTrack.grid),
            autoGrid: currentTrack.autoGrid ? Array.from(currentTrack.autoGrid) : null,
            portals: currentTrack.portals || [],
            tileAttrs: currentTrack.tileAttrs || {},
            selectedRoadAttr: selectedRoadAttr || 'default',
            selectedWallAttr: selectedWallAttr || 'default'
        };
        if (typeof bestBotCar !== 'undefined' && bestBotCar && bestBotCar.brain) {
            session.bestBrain = bestBotCar.brain.serialize();
        }
        localStorage.setItem('neurotrack_session', JSON.stringify(session));
    } catch (e) {
        console.warn("Failed to save session", e);
    }
}
window.saveSession = saveSession;

function restoreSession() {
    const prevSession = localStorage.getItem('neurotrack_session');
    if (!prevSession) return false;
    try {
        const session = JSON.parse(prevSession);
        if (!session || !session.trackGrid) return false;

        const trackName = session.trackName || currentTrackName;
        currentTrackName = trackName;

        const cols = session.cols || (session.trackGrid.length === 768 ? 32 : 16);
        const rows = session.rows || (session.trackGrid.length === 768 ? 24 : 12);

        currentTrack = new Track(cols, rows);
        currentTrack.name = trackName;
        currentTrack.grid.set(session.trackGrid);
        if (session.autoGrid && currentTrack.autoGrid && session.autoGrid.length === currentTrack.autoGrid.length) {
            currentTrack.autoGrid.set(session.autoGrid);
        }
        if (Array.isArray(session.portals)) {
            currentTrack.portals = session.portals;
        }
        if (session.tileAttrs && typeof session.tileAttrs === 'object') {
            currentTrack.tileAttrs = JSON.parse(JSON.stringify(session.tileAttrs));
            for (const key in currentTrack.tileAttrs) {
                if (currentTrack.tileAttrs[key] && currentTrack.tileAttrs[key].wall === 'repulsor') {
                    currentTrack.tileAttrs[key].wall = 'default';
                }
            }
        } else {
            currentTrack.tileAttrs = {};
        }

        currentTrack.sanitizePortals();
        currentTrack.computeCheckpoints();
        currentTrack.markDirty();
        if (collisionCanvas) currentTrack.renderCollisionCanvas(collisionCanvas);
        if (sensorCanvas && typeof currentTrack.renderSensorCanvas === 'function') {
            currentTrack.renderSensorCanvas(sensorCanvas);
        }

        if (session.selectedRoadAttr) {
            selectAttribute('road', session.selectedRoadAttr);
        }
        if (session.selectedWallAttr) {
            selectAttribute('wall', session.selectedWallAttr === 'repulsor' ? 'default' : session.selectedWallAttr);
        }

        const editorName = document.getElementById('editor-track-name');
        if (editorName && trackName) {
            editorName.value = (trackName === 'Default Oval' || trackName === 'Figure Eight' || trackName === 'Dead End Track') ? 'My Custom Track' : trackName;
        }
        const select = document.getElementById('track-select');
        if (select && trackName) {
            select.value = trackName;
        }

        loadTrackRecords(trackName);

        if (session.bestBrain) {
            const restoredBrain = NeuralNetwork.deserialize(session.bestBrain);
            bestBotCar = new Car(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startAngle, true);
            bestBotCar.brain = restoredBrain;
        }
        return true;
    } catch (e) {
        console.error("Failed to restore session", e);
        return false;
    }
}

function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d', { alpha: false });
    collisionCanvas = document.createElement('canvas');
    sensorCanvas = document.createElement('canvas');

    resize();
    window.addEventListener('resize', resize);

    camera = new Camera();
    loadCustomTracks();
    if (!restoreSession()) {
        loadTrack(currentTrackName);
    }

    setupInput();
    setupUI();
    
    // Audio Initialization
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
        bgMusic.volume = 0.5;
        const playAudioOnInteract = () => {
            bgMusic.play().catch(e => console.log('Audio autoplay prevented'));
            document.removeEventListener('click', playAudioOnInteract);
            document.removeEventListener('keydown', playAudioOnInteract);
        };
        document.addEventListener('click', playAudioOnInteract);
        document.addEventListener('keydown', playAudioOnInteract);
    }
    
    requestAnimationFrame(gameLoop);

    // Auto-save session
    window.addEventListener('beforeunload', saveSession);
    window.addEventListener('pagehide', saveSession);
}

// ========================================
// Custom Modals
// ========================================
function customAlert(message, title = 'NOTICE') {
    return new Promise(resolve => {
        document.getElementById('modal-overlay').style.display = 'flex';
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-message').innerText = message;
        document.getElementById('modal-input').style.display = 'none';
        document.getElementById('btn-modal-cancel').style.display = 'none';
        
        document.getElementById('btn-modal-ok').onclick = () => {
            document.getElementById('modal-overlay').style.display = 'none';
            resolve();
        };
    });
}

function customPrompt(message, defaultValue = '', title = 'INPUT REQUIRED') {
    return new Promise(resolve => {
        document.getElementById('modal-overlay').style.display = 'flex';
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-message').innerText = message;
        
        const input = document.getElementById('modal-input');
        input.style.display = 'block';
        input.value = defaultValue;
        input.focus();
        
        document.getElementById('btn-modal-cancel').style.display = 'block';
        
        document.getElementById('btn-modal-cancel').onclick = () => {
            document.getElementById('modal-overlay').style.display = 'none';
            resolve(null);
        };
        
        document.getElementById('btn-modal-ok').onclick = () => {
            document.getElementById('modal-overlay').style.display = 'none';
            resolve(input.value);
        };
    });
}

// ========================================
// Track Management
// ========================================
function loadCustomTracks() {
    try {
        const data = localStorage.getItem('neurotrack_custom_tracks');
        if (data) customTracks = JSON.parse(data);
    } catch (e) { console.error("Failed to load custom tracks"); }
    updateTrackSelectUI();
}

function saveCustomTracks() {
    localStorage.setItem('neurotrack_custom_tracks', JSON.stringify(customTracks));
    updateTrackSelectUI();
}

function updateTrackSelectUI() {
    const select = document.getElementById('track-select');
    if (!select) return;
    select.innerHTML = '';
    
    // Default tracks
    const def1 = document.createElement('option'); def1.value = 'Default Oval'; def1.text = 'Default Oval'; select.appendChild(def1);
    const def2 = document.createElement('option'); def2.value = 'Figure Eight'; def2.text = 'Figure Eight'; select.appendChild(def2);
    const def3 = document.createElement('option'); def3.value = 'Dead End Track'; def3.text = 'Dead End Track'; select.appendChild(def3);
    
    for (const name in customTracks) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.text = name;
        select.appendChild(opt);
    }
    select.value = currentTrackName;
}

function loadTrack(name) {
    if (name !== currentTrackName) {
        geneticAlgo = null;
        bestTrainLap = Infinity;
        trainTelemetry = [];
        renderTrainTelemetryChart();
        const lapEl = document.getElementById('best-train-lap');
        if (lapEl) lapEl.textContent = '--';
        const fitEl = document.getElementById('best-fitness');
        if (fitEl) fitEl.textContent = '0';
        const genEl = document.getElementById('gen-count');
        if (genEl) genEl.textContent = '0';
    }
    currentTrackName = name;
    if (name === 'Default Oval') {
        currentTrack = Track.createDefaultOval();
    } else if (name === 'Figure Eight') {
        currentTrack = Track.createFigureEight();
    } else if (name === 'Dead End Track' || name === 'Dead End') {
        currentTrack = Track.createDeadEndTrack();
    } else if (customTracks[name]) {
        currentTrack = Track.importJSON(customTracks[name]);
        if (!currentTrack) currentTrack = Track.createDefaultOval();
    }
    if (collisionCanvas) {
        currentTrack.renderCollisionCanvas(collisionCanvas);
    }
    
    const editorName = document.getElementById('editor-track-name');
    if (editorName) {
        editorName.value = (name === 'Default Oval' || name === 'Figure Eight' || name === 'Dead End Track') ? 'My Custom Track' : name;
    }
    const select = document.getElementById('track-select');
    if (select) {
        select.value = name;
    }
    loadTrackRecords(name);
    if (selectedTiles) selectedTiles.clear();
    syncEditorUIWithTrack();
    saveSession();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function setupInput() {
    window.addEventListener('keydown', e => {
        if (e.key === 'Shift' && currentState === GAME_STATES.EDITOR) {
            const family = window.TILE_FAMILIES.find(f => f.includes(editorSelectedTile));
            if (family && family.length > 1) {
                const idx = family.indexOf(editorSelectedTile);
                editorSelectedTile = family[(idx + 1) % family.length];
                const activeBtn = document.querySelector('.tile-btn.active canvas');
                if (activeBtn) {
                    const ctx = activeBtn.getContext('2d');
                    ctx.clearRect(0, 0, 60, 60);
                    Track.renderTilePreview(editorSelectedTile, activeBtn);
                }
            }
        }
        if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = true;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
        if (e.code === 'KeyR') restartCurrent();
        if ((e.key === 'g' || e.key === 'G') && (!e.target || e.target.tagName !== 'INPUT')) {
            setGhostEnabled(!showGhost);
        }
        if (e.key === 'p' || e.key === 'P') {
            if (currentState === GAME_STATES.TRAIN) {
                togglePlayPause();
            }
        }
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            if (currentState === GAME_STATES.EDITOR && editorHistory.length > 0) {
                const currentStateObj = {
                    grid: new Uint8Array(currentTrack.grid),
                    autoGrid: new Uint32Array(currentTrack.autoGrid),
                    portals: JSON.parse(JSON.stringify(currentTrack.portals || [])),
                    tileAttrs: JSON.parse(JSON.stringify(currentTrack.tileAttrs || {})),
                    autoCheckpoints: currentTrack.autoCheckpoints !== false,
                    customCheckpoints: JSON.parse(JSON.stringify(currentTrack.customCheckpoints || []))
                };
                editorRedoHistory.push(currentStateObj);
                
                const prevState = editorHistory.pop();
                currentTrack.grid.set(prevState.grid);
                currentTrack.autoGrid.set(prevState.autoGrid);
                currentTrack.portals = JSON.parse(JSON.stringify(prevState.portals || []));
                currentTrack.tileAttrs = JSON.parse(JSON.stringify(prevState.tileAttrs || {}));
                currentTrack.autoCheckpoints = prevState.autoCheckpoints !== false;
                currentTrack.customCheckpoints = JSON.parse(JSON.stringify(prevState.customCheckpoints || []));
                currentTrack.sanitizePortals();
                currentTrack.computeCheckpoints();
                currentTrack.markDirty();
                currentTrack.renderCollisionCanvas(collisionCanvas);
                syncEditorUIWithTrack();
                updateLimits();
            }
        }
        if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
            if (currentState === GAME_STATES.EDITOR && editorRedoHistory.length > 0) {
                const currentStateObj = {
                    grid: new Uint8Array(currentTrack.grid),
                    autoGrid: new Uint32Array(currentTrack.autoGrid),
                    portals: JSON.parse(JSON.stringify(currentTrack.portals || [])),
                    tileAttrs: JSON.parse(JSON.stringify(currentTrack.tileAttrs || {})),
                    autoCheckpoints: currentTrack.autoCheckpoints !== false,
                    customCheckpoints: JSON.parse(JSON.stringify(currentTrack.customCheckpoints || []))
                };
                editorHistory.push(currentStateObj);
                
                const nextState = editorRedoHistory.pop();
                currentTrack.grid.set(nextState.grid);
                currentTrack.autoGrid.set(nextState.autoGrid);
                currentTrack.portals = JSON.parse(JSON.stringify(nextState.portals || []));
                currentTrack.tileAttrs = JSON.parse(JSON.stringify(nextState.tileAttrs || {}));
                currentTrack.autoCheckpoints = nextState.autoCheckpoints !== false;
                currentTrack.customCheckpoints = JSON.parse(JSON.stringify(nextState.customCheckpoints || []));
                currentTrack.sanitizePortals();
                currentTrack.computeCheckpoints();
                currentTrack.markDirty();
                currentTrack.renderCollisionCanvas(collisionCanvas);
                syncEditorUIWithTrack();
                updateLimits();
            }
        }
    });
    window.addEventListener('keyup', e => {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    });

    let isPanning = false;
    let lastPanPos = { x: 0, y: 0 };
    paintTileType = 1;
    lastPaintPos = null;
    lastAutoDrawDir = { dx: 0, dy: 0 };
    currentStrokeId = 1;

    function updateLimits() {
        let hasStart = false, teleCount = 0;
        if (!currentTrack || !window.TILE_FAMILIES) return { hasStart, teleCount };
        
        const teleportFamily = window.TILE_FAMILIES.find(f => f.includes(32)) || [];
        
        for (let c = 0; c < currentTrack.cols; c++) {
            for (let r = 0; r < currentTrack.rows; r++) {
                const id = currentTrack.getTile(c, r);
                if (isStartTile(id)) hasStart = true;
                if (teleportFamily.includes(id)) teleCount++;
            }
        }
        const startBtn = document.getElementById('btn-tile-family-7');
        const startCurveBtn = document.getElementById('btn-tile-family-10');
        const teleBtn = document.getElementById('btn-tile-family-32');
        
        // Start buttons and Teleporters are never disabled
        if (startBtn) { startBtn.disabled = false; startBtn.style.opacity = '1'; }
        if (startCurveBtn) { startCurveBtn.disabled = false; startCurveBtn.style.opacity = '1'; }
        if (teleBtn) { teleBtn.disabled = false; teleBtn.style.opacity = '1'; }
        return { hasStart, teleCount };
    }

    function applyPaint(c, r, tileToPaint = null) {
        if (c < 0 || c >= currentTrack.cols || r < 0 || r >= currentTrack.rows) return;
        const activeTile = (tileToPaint !== null && tileToPaint !== undefined) ? tileToPaint : paintTileType;

        if (activeTile !== 99 && activeTile !== 0) {
            updateLimits();
        }

        if (isStartTile(activeTile)) {
            // Automatically relocate previous Start tile (straight or curved alike)
            for (let col = 0; col < currentTrack.cols; col++) {
                for (let row = 0; row < currentTrack.rows; row++) {
                    if (col === c && row === r) continue;
                    const tid = currentTrack.getTile(col, row);
                    if (isStartTile(tid)) {
                        currentTrack.setTile(col, row, 0);
                    }
                }
            }
            currentTrack.setTile(c, r, activeTile);
            updateLimits();
            return;
        }

        if (activeTile === 0) {
            currentTrack.setTile(c, r, 0);
            currentTrack.autoResolveTile(c, r - 1, 0, 0, currentStrokeId);
            currentTrack.autoResolveTile(c + 1, r, 0, 0, currentStrokeId);
            currentTrack.autoResolveTile(c, r + 1, 0, 0, currentStrokeId);
            currentTrack.autoResolveTile(c - 1, r, 0, 0, currentStrokeId);
        } else if (activeTile === 99) {
            currentTrack.autoResolveTile(c, r, lastAutoDrawDir.dx, lastAutoDrawDir.dy, currentStrokeId);
            currentTrack.autoResolveTile(c, r - 1, 0, 0, currentStrokeId);
            currentTrack.autoResolveTile(c + 1, r, 0, 0, currentStrokeId);
            currentTrack.autoResolveTile(c, r + 1, 0, 0, currentStrokeId);
            currentTrack.autoResolveTile(c - 1, r, 0, 0, currentStrokeId);
        } else {
            currentTrack.setTile(c, r, activeTile);
        }
        if (currentState === GAME_STATES.EDITOR) {
            bestGhostPath = null;
            trackPersonalBest = Infinity;
            try {
                localStorage.removeItem('neurotrack_best_time_' + currentTrackName);
                localStorage.removeItem('neurotrack_ghost_' + currentTrackName);
            } catch (e) {}
            const bestTimeEl = document.getElementById('best-time');
            if (bestTimeEl) bestTimeEl.innerText = '--';
        }
        updateLimits();
    }
    window.updateLimits = updateLimits;
    window.applyPaint = applyPaint;

    canvas.addEventListener('mousedown', e => {
        if (currentState === GAME_STATES.EDITOR) {
            const worldPos = camera.screenToWorld(e.clientX, e.clientY, canvas);
            const col = Math.floor(worldPos.x / TILE_SIZE);
            const row = Math.floor(worldPos.y / TILE_SIZE);
            const hasTile = (col >= 0 && col < currentTrack.cols && row >= 0 && row < currentTrack.rows && currentTrack.getTile(col, row) !== 0);

            // Right-click: if clicking an existing track tile, delete it immediately.
            // If clicking on empty space, pan the camera!
            if (e.button === 2) {
                if (hasTile) {
                    saveEditorState();
                    applyPaint(col, row, 0);
                    currentTrack.computeCheckpoints();
                    currentTrack.markDirty();
                    currentTrack.renderCollisionCanvas(collisionCanvas);
                    selectedTiles.delete(`${col},${row}`);
                    updateSelectionUI();
                    saveSession();
                    return;
                } else {
                    isPanning = true;
                    manualCamera = true;
                    lastPanPos = { x: e.clientX, y: e.clientY };
                    return;
                }
            }

            // Middle click: always pan
            if (e.button === 1) {
                isPanning = true;
                manualCamera = true;
                lastPanPos = { x: e.clientX, y: e.clientY };
                return;
            }

            // Left click:
            if (e.button === 0) {
                if (editorMode === 'place') {
                    isPainting = true; 
                    paintTileType = editorSelectedTile;
                    lastPaintPos = { col, row };
                    lastAutoDrawDir = { dx: 0, dy: 0 };
                    saveEditorState();

                    if (paintTileType === 99) {
                        currentStrokeId++;
                        autoDrawPath = [];
                        originalTiles = new Map();

                        const key = `${col},${row}`;
                        const existing = currentTrack.getTile(col, row);
                        originalTiles.set(key, existing);

                        let inPort = -1;
                        let outPort = -1;

                        if (Track.isStraightOrIntersection(existing)) {
                            // Starting stroke on an existing straight or intersection:
                            // Keep existing tile for now until drag direction is known.
                            autoDrawPath.push({ c: col, r: row, inPort: -1, outPort: -1, isStartNode: true });
                        } else if (!currentTrack.getTileType(col, row).isStart) {
                            const openNeighbors = currentTrack.getOpenNeighborPorts(col, row);
                            let tileId = TILE_TYPES.STRAIGHT_H.id;

                            if (openNeighbors.length >= 2) {
                                inPort = openNeighbors[0];
                                outPort = openNeighbors[1];
                                tileId = Track.getTileForPorts(inPort, outPort);
                            } else if (openNeighbors.length === 1) {
                                inPort = openNeighbors[0];
                                outPort = (inPort + 2) % 4;
                                tileId = Track.getTileForPorts(inPort, outPort);
                            }

                            currentTrack.setTile(col, row, tileId, currentStrokeId);
                            if (selectedRoadAttr !== 'default' || selectedWallAttr !== 'default') {
                                currentTrack.setTileAttrs(col, row, selectedRoadAttr, selectedWallAttr);
                            }
                            autoDrawPath.push({ c: col, r: row, inPort, outPort, isStartNode: true });
                        } else {
                            autoDrawPath.push({ c: col, r: row, inPort: -1, outPort: -1, isStartNode: true });
                        }

                        currentTrack.markDirty();
                        return;
                    }

                    applyPaint(col, row);
                    if (paintTileType !== 0 && (selectedRoadAttr !== 'default' || selectedWallAttr !== 'default')) {
                        currentTrack.setTileAttrs(col, row, selectedRoadAttr, selectedWallAttr);
                        currentTrack.markDirty();
                    }
                    return;
                }

                if (editorMode === 'select') {
                    isMarquee = true;
                    marqueeStart = { x: worldPos.x, y: worldPos.y, clientX: e.clientX, clientY: e.clientY };
                    marqueeEnd = { x: worldPos.x, y: worldPos.y };
                    return;
                }

                if (editorMode === 'checkpoint') {
                    checkpointDrawing = { x1: worldPos.x, y1: worldPos.y, x2: worldPos.x, y2: worldPos.y };
                    return;
                }
            }
        }
        
        if (currentState === GAME_STATES.TRAIN) {
            isPanning = true;
            manualCamera = true;
            lastPanPos = { x: e.clientX, y: e.clientY };
        }
    });
    
    canvas.addEventListener('mousemove', e => {
        if (currentState === GAME_STATES.EDITOR) {
            const worldPos = camera.screenToWorld(e.clientX, e.clientY, canvas);
            hoverCol = Math.floor(worldPos.x / TILE_SIZE);
            hoverRow = Math.floor(worldPos.y / TILE_SIZE);

            if (isPainting && editorMode === 'place') {
                const col = Math.floor(worldPos.x / TILE_SIZE);
                const row = Math.floor(worldPos.y / TILE_SIZE);

                if (paintTileType === 99) {
                    if (!lastPaintPos) lastPaintPos = { col, row };
                    let cx = lastPaintPos.col;
                    let cy = lastPaintPos.row;

                    while (cx !== col || cy !== row) {
                        let stepX = 0, stepY = 0;
                        if (Math.abs(col - cx) > Math.abs(row - cy)) {
                            stepX = Math.sign(col - cx);
                            cx += stepX;
                            lastAutoDrawDir = { dx: stepX, dy: 0 };
                        } else {
                            stepY = Math.sign(row - cy);
                            cy += stepY;
                            lastAutoDrawDir = { dx: 0, dy: stepY };
                        }

                        if (cx < 0 || cx >= currentTrack.cols || cy < 0 || cy >= currentTrack.rows) break;

                        const prevIdx = autoDrawPath.length - 1;
                        const prevNode = autoDrawPath[prevIdx];
                        if (prevNode && prevNode.c === cx && prevNode.r === cy) continue;

                        // Direction leaving prevNode towards (cx, cy)
                        let exitPortFromPrev = -1;
                        if (stepX === 1) exitPortFromPrev = 1; // RIGHT
                        else if (stepX === -1) exitPortFromPrev = 3; // LEFT
                        else if (stepY === 1) exitPortFromPrev = 2; // DOWN
                        else if (stepY === -1) exitPortFromPrev = 0; // UP

                        const entryPortOfCurr = (exitPortFromPrev + 2) % 4;

                        // Update prevNode with exitPort and resolve its tile
                        if (prevNode) {
                            prevNode.outPort = exitPortFromPrev;
                            const prevBaseId = getBaseTileForIntersection(prevNode.c, prevNode.r);

                            if (!currentTrack.getTileType(prevNode.c, prevNode.r).isStart) {
                                let resolvedPrevId;
                                if (prevNode.isStartNode) {
                                    if (Track.isStraightOrIntersection(prevBaseId)) {
                                        // Dragging out of an existing straight or intersection tile:
                                        resolvedPrevId = Track.getIntersectionTile(prevBaseId, [prevNode.outPort]);
                                    } else {
                                        if (prevNode.inPort === -1) {
                                            prevNode.inPort = (prevNode.outPort + 2) % 4;
                                        }
                                        resolvedPrevId = Track.getTileForPorts(prevNode.inPort, prevNode.outPort);
                                    }
                                } else {
                                    if (Track.isStraightOrIntersection(prevBaseId)) {
                                        resolvedPrevId = Track.getIntersectionTile(prevBaseId, [prevNode.inPort, prevNode.outPort]);
                                    } else {
                                        resolvedPrevId = Track.getTileForPorts(prevNode.inPort, prevNode.outPort);
                                    }
                                }

                                currentTrack.setTile(prevNode.c, prevNode.r, resolvedPrevId, currentStrokeId);
                                if (selectedRoadAttr !== 'default' || selectedWallAttr !== 'default') {
                                    currentTrack.setTileAttrs(prevNode.c, prevNode.r, selectedRoadAttr, selectedWallAttr);
                                }
                            }
                        }

                        // Record current cell in originalTiles before modifying
                        const currKey = `${cx},${cy}`;
                        if (!originalTiles.has(currKey)) {
                            originalTiles.set(currKey, currentTrack.getTile(cx, cy));
                        }
                        const currBaseId = getBaseTileForIntersection(cx, cy);

                        // Check if loop closed back to autoDrawPath[0]
                        if (autoDrawPath.length > 2 && autoDrawPath[0].c === cx && autoDrawPath[0].r === cy) {
                            const startNode = autoDrawPath[0];
                            startNode.inPort = entryPortOfCurr;
                            const startBaseId = getBaseTileForIntersection(startNode.c, startNode.r);
                            if (!currentTrack.getTileType(startNode.c, startNode.r).isStart) {
                                let loopStartTile;
                                if (Track.isStraightOrIntersection(startBaseId)) {
                                    loopStartTile = Track.getIntersectionTile(startBaseId, [startNode.inPort, startNode.outPort]);
                                } else {
                                    loopStartTile = Track.getTileForPorts(startNode.inPort, startNode.outPort);
                                }
                                currentTrack.setTile(startNode.c, startNode.r, loopStartTile, currentStrokeId);
                                if (selectedRoadAttr !== 'default' || selectedWallAttr !== 'default') {
                                    currentTrack.setTileAttrs(startNode.c, startNode.r, selectedRoadAttr, selectedWallAttr);
                                }
                            }
                        } else {
                            if (!currentTrack.getTileType(cx, cy).isStart) {
                                let resolvedCurrId;
                                if (Track.isStraightOrIntersection(currBaseId)) {
                                    // Dragging into a straight or intersection block:
                                    // Resolve as 3-way or 4-way intersection based on entry port!
                                    resolvedCurrId = Track.getIntersectionTile(currBaseId, [entryPortOfCurr]);
                                } else {
                                    const openAhead = currentTrack.getOpenNeighborPorts(cx, cy, prevNode ? prevNode.c : -1, prevNode ? prevNode.r : -1);
                                    let currOutPort = -1;
                                    if (openAhead.length > 0) {
                                        const forwardPort = (stepX === 1) ? 1 : (stepX === -1) ? 3 : (stepY === 1) ? 2 : 0;
                                        if (openAhead.includes(forwardPort)) {
                                            currOutPort = forwardPort;
                                        } else {
                                            currOutPort = openAhead[0];
                                        }
                                    } else {
                                        currOutPort = (entryPortOfCurr + 2) % 4;
                                    }
                                    resolvedCurrId = Track.getTileForPorts(entryPortOfCurr, currOutPort);
                                }

                                currentTrack.setTile(cx, cy, resolvedCurrId, currentStrokeId);
                                if (selectedRoadAttr !== 'default' || selectedWallAttr !== 'default') {
                                    currentTrack.setTileAttrs(cx, cy, selectedRoadAttr, selectedWallAttr);
                                }
                            }

                            autoDrawPath.push({
                                c: cx,
                                r: cy,
                                inPort: entryPortOfCurr,
                                outPort: -1
                            });
                        }
                    }
                    lastPaintPos = { col, row };
                    currentTrack.markDirty();
                    return;
                }

                // Normal tile painting
                if (lastPaintPos) {
                    let cx = lastPaintPos.col;
                    let cy = lastPaintPos.row;
                    
                    while (cx !== col || cy !== row) {
                        if (Math.abs(col - cx) > Math.abs(row - cy)) {
                            let step = Math.sign(col - cx);
                            cx += step;
                            lastAutoDrawDir = { dx: step, dy: 0 };
                        } else {
                            let step = Math.sign(row - cy);
                            cy += step;
                            lastAutoDrawDir = { dx: 0, dy: step };
                        }
                        applyPaint(cx, cy);
                        if (paintTileType !== 0 && (selectedRoadAttr !== 'default' || selectedWallAttr !== 'default')) {
                            currentTrack.setTileAttrs(cx, cy, selectedRoadAttr, selectedWallAttr);
                        }
                    }
                } else {
                    lastAutoDrawDir = { dx: 0, dy: 0 };
                    applyPaint(col, row);
                    if (paintTileType !== 0 && (selectedRoadAttr !== 'default' || selectedWallAttr !== 'default')) {
                        currentTrack.setTileAttrs(col, row, selectedRoadAttr, selectedWallAttr);
                    }
                }
                lastPaintPos = { col, row };
                return;
            }

            if (isMarquee && marqueeStart) {
                marqueeEnd = { x: worldPos.x, y: worldPos.y };
                return;
            }

            if (checkpointDrawing) {
                checkpointDrawing.x2 = worldPos.x;
                checkpointDrawing.y2 = worldPos.y;
                return;
            }
        }

        if (isPanning) {
            const dx = (e.clientX - lastPanPos.x) / camera.zoom;
            const dy = (e.clientY - lastPanPos.y) / camera.zoom;
            camera.targetX -= dx;
            camera.targetY -= dy;
            lastPanPos = { x: e.clientX, y: e.clientY };
        }
    });
    
    window.addEventListener('mouseup', e => {
        if (isPainting) { 
            isPainting = false; 
            lastPaintPos = null;

            if (paintTileType === 99 && autoDrawPath.length > 0) {
                const headNode = autoDrawPath[autoDrawPath.length - 1];
                const prevNode = autoDrawPath.length > 1 ? autoDrawPath[autoDrawPath.length - 2] : null;
                const headBaseId = getBaseTileForIntersection(headNode.c, headNode.r);

                if (!currentTrack.getTileType(headNode.c, headNode.r).isStart) {
                    if (Track.isStraightOrIntersection(headBaseId)) {
                        if (headNode.inPort !== -1) {
                            const finalTileId = Track.getIntersectionTile(headBaseId, [headNode.inPort]);
                            currentTrack.setTile(headNode.c, headNode.r, finalTileId, currentStrokeId);
                            if (selectedRoadAttr !== 'default' || selectedWallAttr !== 'default') {
                                currentTrack.setTileAttrs(headNode.c, headNode.r, selectedRoadAttr, selectedWallAttr);
                            }
                        }
                    } else if (headNode.inPort !== -1) {
                        // Check if headNode has any open neighbors to connect to
                        const openAroundHead = currentTrack.getOpenNeighborPorts(headNode.c, headNode.r, prevNode ? prevNode.c : -1, prevNode ? prevNode.r : -1);
                        if (openAroundHead.length > 0) {
                            headNode.outPort = openAroundHead[0];
                            const headTileId = Track.getTileForPorts(headNode.inPort, headNode.outPort);
                            currentTrack.setTile(headNode.c, headNode.r, headTileId, currentStrokeId);
                            if (selectedRoadAttr !== 'default' || selectedWallAttr !== 'default') {
                                currentTrack.setTileAttrs(headNode.c, headNode.r, selectedRoadAttr, selectedWallAttr);
                            }
                        }
                    }
                }
                autoDrawPath = [];
                originalTiles = new Map();
            }

            currentTrack.computeCheckpoints();
            currentTrack.markDirty();
            if (collisionCanvas) currentTrack.renderCollisionCanvas(collisionCanvas); 
            saveSession();
        }

        if (isMarquee && marqueeStart && marqueeEnd) {
            const dragDist = Math.hypot(e.clientX - marqueeStart.clientX, e.clientY - marqueeStart.clientY);
            if (dragDist < 6) {
                // Single click selection
                const c = Math.floor(marqueeStart.x / TILE_SIZE);
                const r = Math.floor(marqueeStart.y / TILE_SIZE);
                if (c >= 0 && c < currentTrack.cols && r >= 0 && r < currentTrack.rows && currentTrack.getTile(c, r) !== 0) {
                    saveEditorState();
                    selectedTiles.clear();
                    selectedTiles.add(`${c},${r}`);
                    currentTrack.setTileAttrs(c, r, selectedRoadAttr, selectedWallAttr);
                    currentTrack.markDirty();
                    currentTrack.renderCollisionCanvas(collisionCanvas);
                } else {
                    selectedTiles.clear();
                }
            } else {
                // Drag marquee selection
                const minX = Math.min(marqueeStart.x, marqueeEnd.x);
                const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
                const minY = Math.min(marqueeStart.y, marqueeEnd.y);
                const maxY = Math.max(marqueeStart.y, marqueeEnd.y);

                const minC = Math.max(0, Math.floor(minX / TILE_SIZE));
                const maxC = Math.min(currentTrack.cols - 1, Math.floor(maxX / TILE_SIZE));
                const minR = Math.max(0, Math.floor(minY / TILE_SIZE));
                const maxR = Math.min(currentTrack.rows - 1, Math.floor(maxY / TILE_SIZE));

                let changed = false;
                selectedTiles.clear();
                for (let c = minC; c <= maxC; c++) {
                    for (let r = minR; r <= maxR; r++) {
                        if (currentTrack.getTile(c, r) !== 0) {
                            if (!changed) {
                                saveEditorState();
                                changed = true;
                            }
                            selectedTiles.add(`${c},${r}`);
                            currentTrack.setTileAttrs(c, r, selectedRoadAttr, selectedWallAttr);
                        }
                    }
                }
                if (changed) {
                    currentTrack.markDirty();
                    currentTrack.renderCollisionCanvas(collisionCanvas);
                }
            }
            isMarquee = false;
            marqueeStart = null;
            marqueeEnd = null;
            updateSelectionUI();
        }

        if (checkpointDrawing) {
            const len = Math.hypot(checkpointDrawing.x2 - checkpointDrawing.x1, checkpointDrawing.y2 - checkpointDrawing.y1);
            if (len >= 20) {
                saveEditorState();
                if (!currentTrack.customCheckpoints) currentTrack.customCheckpoints = [];
                currentTrack.autoCheckpoints = false;
                const autoCpEl = document.getElementById('editor-auto-checkpoints');
                if (autoCpEl) autoCpEl.checked = false;
                const manualCpControls = document.getElementById('manual-checkpoint-controls');
                if (manualCpControls) manualCpControls.style.display = 'block';

                currentTrack.customCheckpoints.push({
                    id: currentTrack.customCheckpoints.length + 1,
                    x1: checkpointDrawing.x1,
                    y1: checkpointDrawing.y1,
                    x2: checkpointDrawing.x2,
                    y2: checkpointDrawing.y2
                });
                currentTrack.computeCheckpoints();
                currentTrack.markDirty();
            }
            checkpointDrawing = null;
        }

        if (isPanning) { isPanning = false; }
    });
    
    canvas.addEventListener('wheel', e => {
        if (currentState === GAME_STATES.TRAIN || currentState === GAME_STATES.EDITOR) {
            manualCamera = true;
            const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
            camera.targetZoom *= zoomDelta;
            camera.targetZoom = Math.max(0.1, Math.min(5, camera.targetZoom));
        }
    });

    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

function restartCurrent() {
    if (currentState === GAME_STATES.PLAY && playerCar) {
        playerCar.reset(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle);
        playerCar.bestLap = trackPersonalBest;
        currentLapRecording = [];
    }
    if (currentState === GAME_STATES.TRAIN && geneticAlgo) {
        endGeneration();
    }
    if (currentState === GAME_STATES.RACE && playerCar && bestBotCar) {
        playerCar.reset(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle);
        bestBotCar.reset(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle);
        raceStarted = false;
    }
}

function setupUI() {
    document.getElementById('btn-play').onclick = startPlayMode;
    document.getElementById('btn-race').onclick = startRaceMode;
    document.getElementById('btn-editor').onclick = startEditorMode;
    document.getElementById('btn-train').onclick = startTrainMode;

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.onclick = () => {
            if (currentState === GAME_STATES.TRAIN && trainRunning) {
                saveBestBrain(true);
            }
            trainRunning = false;
            switchState(GAME_STATES.MENU);
            updateTrackSelectUI();
        };
    });
    
    document.getElementById('track-select').onchange = (e) => {
        loadTrack(e.target.value);
    };

    const btnSaveTrack = document.getElementById('btn-save-track');
    if (btnSaveTrack) {
        btnSaveTrack.onclick = () => {
            const name = document.getElementById('editor-track-name').value.trim();
            if (!name) { customAlert("Please enter a track name!"); return; }
            if (name === 'Default Oval' || name === 'Figure Eight' || name === 'Dead End Track') { customAlert("Cannot overwrite default tracks."); return; }
            
            saveBestBrain(true);
            customTracks[name] = currentTrack.exportJSON();
            saveCustomTracks();
            currentTrackName = name;
            loadTrackRecords(name);
            updateTrackSelectUI();
            saveSession();
            customAlert("Track and AI saved successfully!");
        };
    }
    
    const btnDeleteTrack = document.getElementById('btn-delete-track');
    if (btnDeleteTrack) {
        btnDeleteTrack.onclick = () => {
            const name = document.getElementById('editor-track-name').value.trim();
            if (customTracks[name]) {
                delete customTracks[name];
                saveCustomTracks();
                loadTrack('Default Oval');
                customAlert("Track deleted!");
            } else {
                customAlert("Cannot delete this track.");
            }
        };
    }

    const btnClearTrack = document.getElementById('btn-clear-track');
    if (btnClearTrack) {
        btnClearTrack.onclick = () => {
            saveEditorState();
            currentTrack.grid.fill(0);
            if (currentTrack.autoGrid) currentTrack.autoGrid.fill(0);
            currentTrack.portals = [];
            currentTrack.computeCheckpoints();
            currentTrack.markDirty();
            
            bestGhostPath = null;
            trackPersonalBest = Infinity;
            bestTrainLap = Infinity;
            if (geneticAlgo) {
                geneticAlgo.allTimeBestLap = Infinity;
                geneticAlgo.bestFitness = 0;
                geneticAlgo.bestBrain = null;
            }
            try {
                localStorage.removeItem('neurotrack_best_time_' + currentTrackName);
                localStorage.removeItem('neurotrack_ghost_' + currentTrackName);
                localStorage.removeItem('neurotrack_brain_' + currentTrackName);
            } catch (e) {}
            const bestTimeEl = document.getElementById('best-time');
            if (bestTimeEl) bestTimeEl.innerText = '--';
            const lapEl = document.getElementById('best-train-lap');
            if (lapEl) lapEl.textContent = '--';
            const fitEl = document.getElementById('best-fitness');
            if (fitEl) fitEl.textContent = '0';
            const genEl = document.getElementById('gen-count');
            if (genEl) genEl.textContent = '0';

            currentTrack.renderCollisionCanvas(collisionCanvas);
            const cCtx = collisionCanvas.getContext('2d');
            collisionGrid = { width: collisionCanvas.width, height: collisionCanvas.height, data: cCtx.getImageData(0, 0, collisionCanvas.width, collisionCanvas.height).data };
            
            if (typeof currentTrack.renderSensorCanvas === 'function') {
                currentTrack.renderSensorCanvas(sensorCanvas);
                const sCtx = sensorCanvas.getContext('2d');
                sensorGrid = { width: sensorCanvas.width, height: sensorCanvas.height, data: sCtx.getImageData(0, 0, sensorCanvas.width, sensorCanvas.height).data };
            }
        };
    }
    const btnExportTrack = document.getElementById('btn-export-track');
    if (btnExportTrack) {
        btnExportTrack.onclick = () => {
            const editorNameInput = document.getElementById('editor-track-name');
            let trackName = (editorNameInput && editorNameInput.value.trim()) 
                ? editorNameInput.value.trim() 
                : (currentTrackName || 'My Custom Track');
            const dataStr = currentTrack.exportJSON(trackName);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.href = url;
            const safeFileName = trackName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'My Custom Track';
            downloadAnchorNode.download = `${safeFileName}.json`;
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            URL.revokeObjectURL(url);
        };
    }

    const btnImportTrack = document.getElementById('btn-import-track');
    const trackFileInput = document.getElementById('track-file-input');
    if (btnImportTrack && trackFileInput) {
        btnImportTrack.onclick = () => {
            trackFileInput.click();
        };
        trackFileInput.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    saveEditorState();
                    const importedTrack = Track.importJSON(ev.target.result);
                    if (!importedTrack) {
                        customAlert("Invalid track file: could not parse grid data.");
                        return;
                    }
                    currentTrack = importedTrack;
                    
                    // Create a name for the imported track
                    let importedName = (importedTrack.name && importedTrack.name.trim())
                        ? importedTrack.name.trim()
                        : (file.name ? file.name.replace(/\.json$/i, '').trim() : '');
                    if (!importedName || importedName.toLowerCase() === 'track') importedName = 'Imported Track';
                    let name = importedName;
                    let counter = 1;
                    while (customTracks[name] || name === 'Default Oval' || name === 'Figure Eight' || name === 'Dead End Track') {
                        name = importedName + ' ' + counter;
                        counter++;
                    }
                    currentTrackName = name;
                    geneticAlgo = null;
                    bestTrainLap = Infinity;
                    const lapEl = document.getElementById('best-train-lap');
                    if (lapEl) lapEl.textContent = '--';
                    const fitEl = document.getElementById('best-fitness');
                    if (fitEl) fitEl.textContent = '0';
                    const genEl = document.getElementById('gen-count');
                    if (genEl) genEl.textContent = '0';

                    customTracks[currentTrackName] = currentTrack.exportJSON();
                    saveCustomTracks();
                    loadTrackRecords(currentTrackName);
                    updateTrackSelectUI();

                    const trackSelect = document.getElementById('track-select');
                    if (trackSelect) trackSelect.value = currentTrackName;

                    const editorNameInput = document.getElementById('editor-track-name');
                    if (editorNameInput) editorNameInput.value = currentTrackName;

                    currentTrack.markDirty();
                    currentTrack.renderCollisionCanvas(collisionCanvas);
                    const cCtx = collisionCanvas.getContext('2d');
                    collisionGrid = { width: collisionCanvas.width, height: collisionCanvas.height, data: cCtx.getImageData(0, 0, collisionCanvas.width, collisionCanvas.height).data };
                    
                    if (typeof currentTrack.renderSensorCanvas === 'function') {
                        currentTrack.renderSensorCanvas(sensorCanvas);
                        const sCtx = sensorCanvas.getContext('2d');
                        sensorGrid = { width: sensorCanvas.width, height: sensorCanvas.height, data: sCtx.getImageData(0, 0, sensorCanvas.width, sensorCanvas.height).data };
                    }
                    updateLimits();
                    customAlert(`Imported as "${currentTrackName}"`);
                } catch (err) {
                    console.error("Track import failed:", err);
                    customAlert("Invalid track file: " + (err.message || err));
                }
            };
            reader.readAsText(file);
            trackFileInput.value = ""; // reset
        };
    }

    const palette = document.getElementById('editor-palette');
    const TILE_FAMILIES = [
        [0], // ERASER
        [99], // AUTO_DRAW
        [1, 2], // STRAIGHT
        [3, 4, 5, 6], // CURVE
        [7, 8], // START
        [10, 11, 12, 13], // START_CURVE
        [9, 67], // CROSSROAD
        [14, 15], // BOTTLENECK
        [16, 17, 18, 19], // BOOST
        [20, 21, 22, 23], // BOTTLENECK_CURVE
        [24, 25, 26, 27], // SPLIT
        [28, 29, 30, 31], // RAMP
        [32, 33, 34, 35], // TELEPORT
        [48], // INTERSECTION
        [68, 69, 70, 71] // DEAD END
    ];
    window.TILE_FAMILIES = TILE_FAMILIES; // For limits check

    const friendlyNames = {
        0: '⌫ Eraser', 99: '✨ Auto-Draw', 1: '│ Straight', 3: '╰ Curve', 7: '▶ Start', 10: '▶ Curved Start', 9: '┼ Crossroad', 
        14: '─ Bottleneck', 16: '▲ Boost', 20: '╰ Bottleneck Curve', 24: '┬ Split', 28: '▲ Ramp',
        32: '▲ Teleport', 48: '✥ Intersection', 68: '⛔ Dead End'
    };

    for (const family of TILE_FAMILIES) {
        const baseId = family[0];
        const btn = document.createElement('button');
        btn.className = 'tile-btn' + (family.includes(editorSelectedTile) ? ' active' : '');
        btn.id = 'btn-tile-family-' + baseId;
        
        let renderId = baseId;
        if (family.includes(editorSelectedTile)) renderId = editorSelectedTile;
        
        const preview = document.createElement('canvas');
        preview.width = 60; preview.height = 60;
        if (typeof Track.renderTilePreview === 'function') {
            Track.renderTilePreview(renderId, preview);
        }
        btn.appendChild(preview);

        const label = document.createElement('span');
        label.textContent = friendlyNames[baseId] || 'Tile';
        btn.appendChild(label);

        btn.onclick = () => {
            if (btn.disabled) return;
            setEditorMode('place');
            document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (!family.includes(editorSelectedTile)) {
                editorSelectedTile = baseId;
            }
        };
        palette.appendChild(btn);
    }

    // Editor tools
    const toolPlaceBtn = document.getElementById('tool-btn-place');
    if (toolPlaceBtn) toolPlaceBtn.onclick = () => setEditorMode('place');
    const toolSelectBtn = document.getElementById('tool-btn-select');
    if (toolSelectBtn) toolSelectBtn.onclick = () => setEditorMode('select');
    const toolCpBtn = document.getElementById('tool-btn-checkpoint');
    if (toolCpBtn) toolCpBtn.onclick = () => setEditorMode('checkpoint');

    // Auto Checkpoints toggle
    const autoCpEl = document.getElementById('editor-auto-checkpoints');
    if (autoCpEl) {
        autoCpEl.onchange = e => {
            if (!currentTrack) return;
            saveEditorState();
            currentTrack.autoCheckpoints = e.target.checked;
            const manualCpControls = document.getElementById('manual-checkpoint-controls');
            if (manualCpControls) {
                manualCpControls.style.display = currentTrack.autoCheckpoints ? 'none' : 'block';
            }
            if (currentTrack.autoCheckpoints && editorMode === 'checkpoint') {
                setEditorMode('place');
            }
            currentTrack.computeCheckpoints();
            currentTrack.markDirty();
        };
    }

    const btnClearCheckpoints = document.getElementById('btn-clear-checkpoints');
    if (btnClearCheckpoints) {
        btnClearCheckpoints.onclick = () => {
            if (!currentTrack) return;
            saveEditorState();
            currentTrack.customCheckpoints = [];
            currentTrack.computeCheckpoints();
            currentTrack.markDirty();
            customAlert('Manual gates cleared.');
        };
    }

    // Attribute buttons
    document.querySelectorAll('.attr-btn').forEach(btn => {
        btn.onclick = () => {
            const type = btn.getAttribute('data-type');
            const val = btn.getAttribute('data-val');
            selectAttribute(type, val);
        };
    });

    // Train panel sliders
    setupSlider('train-population', 'train-pop-val', v => v);
    setupSlider('train-mutation', 'train-mut-val', v => v + '%');
    setupSlider('train-strength', 'train-str-val', v => v + '%');
    setupSlider('train-elitism', 'train-eli-val', v => v + '%');
    setupSlider('train-sensors', 'train-sen-val', v => v);
    setupSlider('train-timelimit', 'train-tl-val', v => v + 's');
    setupSlider('train-speed', 'train-spd-val', v => v + 'x');

    document.getElementById('btn-editor').addEventListener('click', () => {
    switchState(GAME_STATES.EDITOR);
});
document.getElementById('btn-garage').addEventListener('click', () => {
    switchState(GAME_STATES.GARAGE);
});

    document.getElementById('train-speed').addEventListener('input', (e) => {
        trainSpeed = parseFloat(e.target.value);
        document.getElementById('train-spd-val').innerText = trainSpeed.toFixed(1) + 'x';
    });

    const syncCarSettings = (type, val) => {
        if (type === 'maxSpeed') {
            document.getElementById('car-max-speed').value = val;
            document.getElementById('car-max-spd-val').innerText = val;
            document.getElementById('hud-max-speed').value = val;
            document.getElementById('hud-max-spd-val').innerText = val;
            if (typeof playerCar !== 'undefined' && playerCar) playerCar.maxSpeed = parseFloat(val);
            if (typeof bestBotCar !== 'undefined' && bestBotCar) bestBotCar.maxSpeed = parseFloat(val);
            if (typeof aiCars !== 'undefined' && aiCars) aiCars.forEach(c => c.maxSpeed = parseFloat(val));
        } else if (type === 'turnSpeed') {
            document.getElementById('car-turn-speed').value = val;
            document.getElementById('car-turn-spd-val').innerText = val;
            document.getElementById('hud-turn-speed').value = val;
            document.getElementById('hud-turn-spd-val').innerText = val;
            if (typeof playerCar !== 'undefined' && playerCar) playerCar.turnRate = parseFloat(val);
            if (typeof bestBotCar !== 'undefined' && bestBotCar) bestBotCar.turnRate = parseFloat(val);
            if (typeof aiCars !== 'undefined' && aiCars) aiCars.forEach(c => c.turnRate = parseFloat(val));
        } else if (type === 'accel') {
            document.getElementById('car-accel').value = val;
            document.getElementById('car-accel-val').innerText = val;
            document.getElementById('hud-accel').value = val;
            document.getElementById('hud-accel-val').innerText = val;
            if (typeof playerCar !== 'undefined' && playerCar) playerCar.acceleration = parseFloat(val);
            if (typeof bestBotCar !== 'undefined' && bestBotCar) bestBotCar.acceleration = parseFloat(val);
            if (typeof aiCars !== 'undefined' && aiCars) aiCars.forEach(c => c.acceleration = parseFloat(val));
        } else if (type === 'drift') {
            document.getElementById('train-drift').checked = val;
            document.getElementById('hud-drift').checked = val;
            window.enableDrift = val;
        }
    };

    document.getElementById('car-max-speed').addEventListener('input', (e) => syncCarSettings('maxSpeed', e.target.value));
    document.getElementById('hud-max-speed').addEventListener('input', (e) => syncCarSettings('maxSpeed', e.target.value));
    document.getElementById('car-turn-speed').addEventListener('input', (e) => syncCarSettings('turnSpeed', e.target.value));
    document.getElementById('hud-turn-speed').addEventListener('input', (e) => syncCarSettings('turnSpeed', e.target.value));
    document.getElementById('car-accel').addEventListener('input', (e) => syncCarSettings('accel', e.target.value));
    document.getElementById('hud-accel').addEventListener('input', (e) => syncCarSettings('accel', e.target.value));
    document.getElementById('train-drift').addEventListener('change', (e) => syncCarSettings('drift', e.target.checked));
    document.getElementById('hud-drift').addEventListener('change', (e) => syncCarSettings('drift', e.target.checked));

    const hudGhost = document.getElementById('hud-ghost');
    if (hudGhost) {
        hudGhost.checked = showGhost;
        hudGhost.addEventListener('change', (e) => setGhostEnabled(e.target.checked));
    }
    const menuGhost = document.getElementById('menu-ghost');
    if (menuGhost) {
        menuGhost.checked = showGhost;
        menuGhost.addEventListener('change', (e) => setGhostEnabled(e.target.checked));
    }

    document.getElementById('btn-start-training').onclick = () => {
        if (!trainRunning) { trainRunning = true; startTrainMode(); }
    };
    document.getElementById('btn-pause-training').onclick = () => { trainRunning = !trainRunning; };
    document.getElementById('btn-reset-training').onclick = () => {
        bestTrainLap = Infinity;
        trainTimer = 0;
        trainTelemetry = [];
        renderTrainTelemetryChart();
        localStorage.removeItem('neurotrack_brain_' + currentTrackName);
        if (geneticAlgo) {
            geneticAlgo.initialize();
            geneticAlgo.bestBrain = null;
            geneticAlgo.allTimeBestLap = Infinity;
            geneticAlgo.bestFitness = 0;
            geneticAlgo.generation = 0;
            spawnAICars();
        }
        if (typeof aiCars !== 'undefined') {
            for (const car of aiCars) {
                car.bestLap = Infinity;
                car.lapCount = 0;
                car.lapTime = 0;
                car.fitness = 0;
                car.baseFitness = 0;
            }
        }
        const lapEl = document.getElementById('best-train-lap');
        if (lapEl) lapEl.textContent = '--';
        const fitEl = document.getElementById('best-fitness');
        if (fitEl) fitEl.textContent = '0';
        const genEl = document.getElementById('gen-count');
        if (genEl) genEl.textContent = '0';
        const timerEl = document.getElementById('gen-timer');
        if (timerEl) timerEl.textContent = '0/' + trainTimeLimit;
    };

    document.getElementById('btn-save-brain').onclick = saveBestBrain;
    document.getElementById('btn-watch-replay').onclick = watchBestReplay;
    document.getElementById('btn-export-brain').onclick = exportBrain;
    document.getElementById('btn-import-brain').onclick = importBrain;
    document.getElementById('btn-clear-brain').onclick = clearBestBrain;
    const sensorBtn = document.getElementById('btn-toggle-sensors');
    sensorBtn.onclick = () => { 
        showSensors = !showSensors; 
        sensorBtn.innerText = 'SENSORS: ' + (showSensors ? 'ON' : 'OFF');
    };

    const btnToggleChart = document.getElementById('btn-toggle-chart');
    if (btnToggleChart) {
        btnToggleChart.onclick = () => {
            showTrainChart = !showTrainChart;
            const chartContainer = document.getElementById('train-chart-container');
            if (chartContainer) {
                chartContainer.style.display = showTrainChart ? 'block' : 'none';
            }
            btnToggleChart.textContent = showTrainChart ? '📈 CHART: ON' : '📈 CHART: OFF';
        };
    }

    const volumeSlider = document.getElementById('menu-volume');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const bgMusic = document.getElementById('bg-music');
            if (bgMusic) bgMusic.volume = parseFloat(e.target.value);
        });
    }
}

function setupSlider(sliderId, labelId, format) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (!slider || !label) return;
    label.textContent = format(slider.value);
    slider.oninput = () => { label.textContent = format(slider.value); };
}

function exportBrain() {
    if (!geneticAlgo) return;
    const data = geneticAlgo.exportBest();
    if (!data) { customAlert('No trained brain to export!'); return; }
    
    // Bundle the track along with the AI
    data.trackJSON = currentTrack.exportJSON();
    data.trackName = currentTrackName;
    
    // Bundle all settings so the user can resume exactly where they left off
    data.settings = {
        'train-population': document.getElementById('train-population')?.value,
        'train-mutation': document.getElementById('train-mutation')?.value,
        'train-strength': document.getElementById('train-strength')?.value,
        'train-elitism': document.getElementById('train-elitism')?.value,
        'train-sensors': document.getElementById('train-sensors')?.value,
        'train-hidden': document.getElementById('train-hidden')?.value,
        'train-timelimit': document.getElementById('train-timelimit')?.value,
        'train-speed': document.getElementById('train-speed')?.value,
        'car-max-speed': document.getElementById('car-max-speed')?.value,
        'car-turn-speed': document.getElementById('car-turn-speed')?.value,
        'car-accel': document.getElementById('car-accel')?.value,
        'train-drift': document.getElementById('train-drift')?.checked
    };
    
    // Bundle the entire population
    data.population = geneticAlgo.population.map(c => c.brain.toJSON());
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'neurotrack_brain_gen' + geneticAlgo.generation + '.json';
    a.click();
}

function importBrain() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = ev => {
            if (!geneticAlgo) return;
            try {
                const data = JSON.parse(ev.target.result);
                
                // If it has bundled track data, load it first
                if (data.trackJSON) {
                    currentTrackName = data.trackName || 'Imported Track';
                    customTracks[currentTrackName] = data.trackJSON;
                    updateTrackSelectUI();
                    document.getElementById('track-select').value = currentTrackName;
                    loadTrack(currentTrackName);
                }

                // Restore UI settings if they exist in the exported file
                if (data.settings) {
                    for (const [id, val] of Object.entries(data.settings)) {
                        const el = document.getElementById(id);
                        if (el && val !== undefined) {
                            if (el.type === 'checkbox') {
                                el.checked = val;
                                el.dispatchEvent(new Event('change'));
                            } else {
                                el.value = val;
                                el.dispatchEvent(new Event('input')); // trigger labels to update
                            }
                        }
                    }
                }
                
                // Read configurations for GA from the UI (which were just restored)
                const popSize = parseInt(document.getElementById('train-population').value) || 50;
                const mutRate = parseInt(document.getElementById('train-mutation').value) || 10;
                const mutStr = parseInt(document.getElementById('train-strength').value) || 30;
                const elitism = parseInt(document.getElementById('train-elitism').value) || 10;
                const sensorCount = parseInt(document.getElementById('train-sensors').value) || 7;
                const hiddenLayers = (document.getElementById('train-hidden').value || '8,6').trim().split(',').map(Number).filter(n => n > 0);
                
                // Re-initialize GA perfectly so topologies match
                geneticAlgo = new GeneticAlgorithm({
                    populationSize: popSize, mutationRate: mutRate, mutationStrength: mutStr,
                    elitism: elitism, sensorCount: sensorCount, hiddenLayers: hiddenLayers,
                    timeLimit: parseInt(document.getElementById('train-timelimit').value) || 15
                });
                geneticAlgo.initialize();
                
                // Load the best brain (this sets generation, bestFitness, etc.)
                const brainData = data.brain ? data : { brain: data };
                const brain = geneticAlgo.importBrain(brainData);
                
                if (brain) {
                    // Inject full population if it was bundled
                    if (data.population && Array.isArray(data.population)) {
                        for (let i = 0; i < geneticAlgo.population.length && i < data.population.length; i++) {
                            geneticAlgo.population[i].brain = NeuralNetwork.fromJSON(data.population[i], geneticAlgo.layerSizes);
                        }
                    } else if (geneticAlgo.population.length > 0) {
                        geneticAlgo.population[0].brain = brain;
                        geneticAlgo.population[0].fitness = 999;
                    }
                    
                    customAlert('Brain and track imported! It will seed the next generation.');
                    if (currentState === GAME_STATES.EDITOR) {
                        switchState(GAME_STATES.TRAIN);
                    }
                    
                    // Physically reset cars to adopt new settings immediately
                    if (currentState === GAME_STATES.TRAIN) {
                        spawnAICars();
                    }
                }
            } catch (err) {
                console.error(err);
                customAlert('Failed to parse the imported file.');
            }
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
}

function switchState(newState) {
    if (currentState === GAME_STATES.PLAY && newState !== GAME_STATES.PLAY) {
        if (typeof stopAudio === 'function') stopAudio();
        currentLapRecording = [];
    }
    currentState = newState;
    manualCamera = false;
    document.getElementById('menu-screen').style.display = newState === GAME_STATES.MENU ? 'flex' : 'none';
    document.getElementById('hud-screen').style.display = (newState === GAME_STATES.PLAY || newState === GAME_STATES.RACE) ? 'block' : 'none';
    document.getElementById('editor-screen').style.display = newState === GAME_STATES.EDITOR ? 'block' : 'none';
    document.getElementById('train-screen').style.display = newState === GAME_STATES.TRAIN ? 'block' : 'none';
    document.getElementById('garage-screen').style.display = newState === GAME_STATES.GARAGE ? 'flex' : 'none';
    
    if (newState === GAME_STATES.GARAGE) {
        initGarage();
    }
}

function startPlayMode() {
    const trackSelect = document.getElementById('track-select');
    if (trackSelect && trackSelect.value && trackSelect.value !== currentTrackName) {
        loadTrack(trackSelect.value);
    } else {
        loadTrackRecords(currentTrackName);
    }

    const validity = currentTrack.isValid();
    if (!validity.valid) { customAlert("Track invalid: " + validity.reason); return; }
    currentTrack.computeCheckpoints();
    currentTrack.renderCollisionCanvas(collisionCanvas);
    const cCtx = collisionCanvas.getContext('2d');
    collisionGrid = { width: collisionCanvas.width, height: collisionCanvas.height, data: cCtx.getImageData(0, 0, collisionCanvas.width, collisionCanvas.height).data };
    currentTrack.renderSensorCanvas(sensorCanvas);
    const sCtx = sensorCanvas.getContext('2d');
    sensorGrid = { width: sensorCanvas.width, height: sensorCanvas.height, data: sCtx.getImageData(0, 0, sensorCanvas.width, sensorCanvas.height).data };
    playerCar = new Car(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle, '#00ffff');
    
    playerCar.maxSpeed = parseFloat(document.getElementById('car-max-speed')?.value) || 380;
    playerCar.turnRate = parseFloat(document.getElementById('car-turn-speed')?.value) || 4.0;
    playerCar.acceleration = parseFloat(document.getElementById('car-accel')?.value) || 420;

    playerCar.bestLap = trackPersonalBest;
    currentLapRecording = [];

    camera.setPosition(playerCar.x, playerCar.y);
    camera.targetZoom = 1.4;
    switchState(GAME_STATES.PLAY);
    
    if (typeof initAudio === 'function') initAudio();
}

function startEditorMode() {
    camera.setPosition(currentTrack.cols * TILE_SIZE / 2, currentTrack.rows * TILE_SIZE / 2);
    const scaleX = (window.innerWidth - 300) / (currentTrack.cols * TILE_SIZE);
    const scaleY = window.innerHeight / (currentTrack.rows * TILE_SIZE);
    camera.targetZoom = Math.min(scaleX, scaleY) * 0.85;
    camera.zoom = camera.targetZoom;
    switchState(GAME_STATES.EDITOR);
    setEditorMode('place');
    syncEditorUIWithTrack();
}

let trainTelemetry = [];
window.trainTelemetry = trainTelemetry;
let showTrainChart = true;
window.showTrainChart = showTrainChart;

function renderTrainTelemetryChart() {
    const chartCanvas = document.getElementById('train-fitness-chart');
    if (!chartCanvas) return;
    const chartCtx = chartCanvas.getContext('2d');
    if (!chartCtx) return;

    const w = chartCanvas.width;
    const h = chartCanvas.height;

    // Clear background
    chartCtx.fillStyle = '#0a0e18';
    chartCtx.fillRect(0, 0, w, h);

    const padLeft = 32;
    const padRight = 36;
    const padTop = 14;
    const padBottom = 20;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Draw subtle grid lines
    chartCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    chartCtx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padTop + (plotH / 4) * i;
        chartCtx.beginPath();
        chartCtx.moveTo(padLeft, y);
        chartCtx.lineTo(w - padRight, y);
        chartCtx.stroke();
    }

    const teleData = (window.trainTelemetry && window.trainTelemetry.length) ? window.trainTelemetry : trainTelemetry;

    if (!teleData || teleData.length === 0) {
        chartCtx.fillStyle = '#64748b';
        chartCtx.font = '10px "Segoe UI", Arial, sans-serif';
        chartCtx.textAlign = 'center';
        chartCtx.fillText('Awaiting Generation 1 telemetry...', w / 2, h / 2 + 4);
        return;
    }

    const n = teleData.length;

    // Range for Fitness
    let maxFit = 50;
    for (const d of teleData) {
        if (d.topFitness > maxFit) maxFit = d.topFitness;
    }
    maxFit = Math.ceil(maxFit * 1.1);

    // Range for Lap Times
    const validLaps = teleData.filter(d => d.bestLap !== null && d.bestLap !== undefined && d.bestLap < Infinity).map(d => d.bestLap);
    let minLap = 0, maxLap = 0;
    if (validLaps.length > 0) {
        minLap = Math.min(...validLaps);
        maxLap = Math.max(...validLaps);
        if (minLap === maxLap) {
            minLap = Math.max(0, minLap - 3);
            maxLap += 3;
        }
    }

    // Y Axis labels (Left: Fitness in green)
    chartCtx.fillStyle = '#22c55e';
    chartCtx.font = '9px monospace';
    chartCtx.textAlign = 'right';
    chartCtx.fillText(Math.round(maxFit), padLeft - 4, padTop + 8);
    chartCtx.fillText(Math.round(maxFit / 2), padLeft - 4, padTop + plotH / 2 + 3);
    chartCtx.fillText('0', padLeft - 4, padTop + plotH);

    // Y Axis labels (Right: Lap Record in yellow)
    if (validLaps.length > 0) {
        chartCtx.fillStyle = '#eab308';
        chartCtx.textAlign = 'left';
        chartCtx.fillText(maxLap.toFixed(1) + 's', w - padRight + 4, padTop + 8);
        chartCtx.fillText(minLap.toFixed(1) + 's', w - padRight + 4, padTop + plotH);
    }

    // X Axis labels (Generations)
    chartCtx.fillStyle = '#64748b';
    chartCtx.textAlign = 'center';
    chartCtx.fillText('G' + (teleData[0].gen || 1), padLeft, h - 5);
    const lastGen = teleData[n - 1].gen || n;
    chartCtx.fillText('G' + lastGen, w - padRight, h - 5);

    const getX = (i) => {
        if (n <= 1) return padLeft + plotW / 2;
        return padLeft + (i / (n - 1)) * plotW;
    };
    const getFitY = (fit) => {
        const clamped = Math.max(0, Math.min(maxFit, fit));
        return padTop + plotH - (clamped / maxFit) * plotH;
    };
    const getLapY = (lap) => {
        if (maxLap === minLap) return padTop + plotH / 2;
        return padTop + ((lap - minLap) / (maxLap - minLap)) * plotH;
    };

    // 1) Draw Average Fitness (Blue line)
    chartCtx.beginPath();
    for (let i = 0; i < n; i++) {
        const x = getX(i);
        const y = getFitY(teleData[i].avgFitness);
        if (i === 0) chartCtx.moveTo(x, y);
        else chartCtx.lineTo(x, y);
    }
    chartCtx.strokeStyle = '#38bdf8';
    chartCtx.lineWidth = 1.8;
    chartCtx.stroke();

    // 2) Draw Top Fitness (Green line)
    chartCtx.beginPath();
    for (let i = 0; i < n; i++) {
        const x = getX(i);
        const y = getFitY(teleData[i].topFitness);
        if (i === 0) chartCtx.moveTo(x, y);
        else chartCtx.lineTo(x, y);
    }
    chartCtx.strokeStyle = '#22c55e';
    chartCtx.lineWidth = 2.2;
    chartCtx.stroke();

    // 3) Draw Lap Record Drop Timeline (Yellow dashed line with drop markers)
    if (validLaps.length > 0) {
        chartCtx.beginPath();
        let started = false;
        for (let i = 0; i < n; i++) {
            const lap = teleData[i].bestLap;
            if (lap !== null && lap !== undefined && lap < Infinity) {
                const x = getX(i);
                const y = getLapY(lap);
                if (!started) {
                    chartCtx.moveTo(x, y);
                    started = true;
                } else {
                    chartCtx.lineTo(x, y);
                }
            }
        }
        chartCtx.strokeStyle = '#eab308';
        chartCtx.lineWidth = 2;
        chartCtx.setLineDash([4, 3]);
        chartCtx.stroke();
        chartCtx.setLineDash([]);

        // Record drop dots
        for (let i = 0; i < n; i++) {
            const lap = teleData[i].bestLap;
            if (lap !== null && lap !== undefined && lap < Infinity) {
                const prevLap = i > 0 ? teleData[i - 1].bestLap : null;
                if (!prevLap || lap < prevLap) {
                    const x = getX(i);
                    const y = getLapY(lap);
                    chartCtx.fillStyle = '#eab308';
                    chartCtx.beginPath();
                    chartCtx.arc(x, y, 3.5, 0, Math.PI * 2);
                    chartCtx.fill();
                }
            }
        }
    }
}
window.renderTrainTelemetryChart = renderTrainTelemetryChart;

function startTrainMode() {
    const validity = currentTrack.isValid();
    if (!validity.valid) { customAlert("Track invalid: " + validity.reason); return; }
    currentTrack.computeCheckpoints();
    currentTrack.renderCollisionCanvas(collisionCanvas);
    const cCtx = collisionCanvas.getContext('2d');
    collisionGrid = { width: collisionCanvas.width, height: collisionCanvas.height, data: cCtx.getImageData(0, 0, collisionCanvas.width, collisionCanvas.height).data };
    currentTrack.renderSensorCanvas(sensorCanvas);
    const sCtx = sensorCanvas.getContext('2d');
    sensorGrid = { width: sensorCanvas.width, height: sensorCanvas.height, data: sCtx.getImageData(0, 0, sensorCanvas.width, sensorCanvas.height).data };

    const popSize = parseInt(document.getElementById('train-population').value) || 50;
    const mutRate = parseInt(document.getElementById('train-mutation').value) || 10;
    const mutStr = parseInt(document.getElementById('train-strength').value) || 30;
    const elitism = parseInt(document.getElementById('train-elitism').value) || 10;
    const sensorCount = parseInt(document.getElementById('train-sensors').value) || 7;
    const hiddenStr = (document.getElementById('train-hidden').value || '8,6').trim();
    const hiddenLayers = hiddenStr.split(',').map(Number).filter(n => n > 0);
    trainTimeLimit = parseInt(document.getElementById('train-timelimit').value) || 15;
    trainSpeed = parseInt(document.getElementById('train-speed').value) || 1;

    const archChanged = !geneticAlgo || geneticAlgo.sensorCount !== sensorCount || geneticAlgo.hiddenLayers.join(',') !== hiddenLayers.join(',');

    // Initialize or re-use GA
    if (archChanged || geneticAlgo.populationSize !== popSize) {
        geneticAlgo = new GeneticAlgorithm({
            populationSize: popSize,
            mutationRate: mutRate,
            mutationStrength: mutStr,
            elitism: elitism,
            sensorCount: sensorCount,
            hiddenLayers: hiddenLayers,
            timeLimit: trainTimeLimit
        });
        geneticAlgo.initialize();
        const savedData = loadBestBrainData();
        if (savedData && savedData.brain && geneticAlgo.population.length > 0) {
            const savedBrain = NeuralNetwork.fromJSON(savedData.brain);
            // Only inject the saved brain if its topology matches the current config!
            if (savedBrain && savedBrain.layerSizes.join(',') === geneticAlgo.layerSizes.join(',')) {
                geneticAlgo.population[0].brain = savedBrain;
                geneticAlgo.bestBrain = savedBrain.clone();
                geneticAlgo.bestFitness = savedData.fitness || 0;
                geneticAlgo.allTimeBestLap = (savedData.bestLap !== undefined && savedData.bestLap !== null && savedData.bestLap < Infinity) ? savedData.bestLap : Infinity;
                geneticAlgo.generation = savedData.generation || 0;
                if (geneticAlgo.allTimeBestLap < Infinity) {
                    bestTrainLap = geneticAlgo.allTimeBestLap;
                }
            } else {
                console.warn('Saved brain has incompatible topology. Cannot inject into new population.');
            }
        }
    }
    geneticAlgo.updateConfig({
        mutationRate: mutRate,
        mutationStrength: mutStr,
        elitism: elitism,
        timeLimit: trainTimeLimit
    });

    trainTimer = 0;
    trainRunning = true;
    spawnAICars();

    const lapEl = document.getElementById('best-train-lap');
    if (lapEl) lapEl.textContent = (bestTrainLap && bestTrainLap < Infinity) ? bestTrainLap.toFixed(2) : '--';
    const fitEl = document.getElementById('best-fitness');
    if (fitEl) fitEl.textContent = (geneticAlgo && geneticAlgo.bestFitness) ? geneticAlgo.bestFitness.toFixed(1) : '0';
    const genEl = document.getElementById('gen-count');
    if (genEl) genEl.textContent = (geneticAlgo && geneticAlgo.generation) ? geneticAlgo.generation : '0';

    camera.targetZoom = 0.9;
    switchState(GAME_STATES.TRAIN);
    renderTrainTelemetryChart();
}

function endGeneration() {
    if (!geneticAlgo) return;

    // Pass raw integer values — updateConfig() divides by 100 internally
    const mutRate = parseInt(document.getElementById('train-mutation').value) || 10;
    const mutStr = parseInt(document.getElementById('train-strength').value) || 50;
    const elitism = parseInt(document.getElementById('train-elitism').value) || 10;
    trainTimeLimit = parseFloat(document.getElementById('train-timelimit')?.value) || 15;

    geneticAlgo.updateConfig({
        mutationRate: mutRate,
        mutationStrength: mutStr,
        elitism: elitism,
        timeLimit: trainTimeLimit
    });

    const evaluateData = aiCars.map(c => ({ fitness: c.fitness, bestLap: c.bestLap }));
    geneticAlgo.evaluate(evaluateData);
    saveBestBrain(true);

    // Record training telemetry for mini-chart
    const fitnesses = aiCars.map(c => c.fitness || 0);
    const topFit = fitnesses.length > 0 ? Math.max(...fitnesses) : 0;
    const avgFit = fitnesses.length > 0 ? (fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length) : 0;
    const currentBestLap = (bestTrainLap < Infinity) ? bestTrainLap : (geneticAlgo.allTimeBestLap < Infinity ? geneticAlgo.allTimeBestLap : null);
    trainTelemetry.push({
        gen: geneticAlgo.generation || 1,
        topFitness: Number(topFit.toFixed(1)),
        avgFitness: Number(avgFit.toFixed(1)),
        bestLap: currentBestLap ? Number(currentBestLap.toFixed(2)) : null
    });
    if (trainTelemetry.length > 100) trainTelemetry.shift();
    renderTrainTelemetryChart();

    geneticAlgo.evolve();
    trainTimer = 0;
    spawnAICars();
}

window.addEventListener('beforeunload', () => {
    saveBestBrain(true);
});

function spawnAICars() {
    // Always use the geneticAlgo's topology if it exists to prevent crashes if the user drags the slider mid-training
    const sc = (geneticAlgo && geneticAlgo.sensorCount) 
        ? geneticAlgo.sensorCount 
        : parseInt(document.getElementById('train-sensors')?.value) || 7;
        
    const maxSpd = parseFloat(document.getElementById('car-max-speed')?.value) || 380;
    const tSpd = parseFloat(document.getElementById('car-turn-speed')?.value) || 4.0;
    const accel = parseFloat(document.getElementById('car-accel')?.value) || 420;

    const brains = geneticAlgo.getBrains ? geneticAlgo.getBrains() : geneticAlgo.population.map(p => p.brain);

    // Reuse existing Car instances in aiCars to prevent GC stutter
    while (aiCars.length > brains.length) {
        aiCars.pop();
    }

    for (let i = 0; i < brains.length; i++) {
        let car;
        if (i < aiCars.length) {
            car = aiCars[i];
            car.reset(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle);
            car.color = '#ff0055';
            car.baseFitness = 0;
            car.accumulatedWallPenalty = 0;
            car.recentCheckpoints = [];
            car.isOnOverpass = false;
            car.airborne = false;
            car.z = 0;
            car.vz = 0;
        } else {
            car = new Car(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle, '#ff0055');
            aiCars.push(car);
        }
        car.sensorCount = sc;
        car.maxSpeed = maxSpd;
        car.turnRate = tSpd;
        car.acceleration = accel;
        car.brain = brains[i];
    }
}

function gameLoop(time) {
    const rawDt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    update(rawDt);
    render();
    
    camera.applyTransform(ctx, canvas);

    if (currentState === GAME_STATES.EDITOR) {
        // 1. Hover tile preview in place mode
        if (editorMode === 'place' && hoverCol !== -1 && hoverRow !== -1 && editorSelectedTile !== 99 && editorSelectedTile !== 0) {
            ctx.globalAlpha = 0.5;
            const t = Object.values(TILE_TYPES).find(t => t.id === editorSelectedTile);
            if (t && t.render) {
                const roadColor = Track.getRoadColor(selectedRoadAttr);
                const wallColor = Track.getWallColor(selectedWallAttr);
                t.render(ctx, hoverCol * TILE_SIZE, hoverRow * TILE_SIZE, TILE_SIZE, null, roadColor, wallColor);
            }
            ctx.globalAlpha = 1.0;
        }

        // 2. Selected tiles highlight in select mode
        if (selectedTiles && selectedTiles.size > 0) {
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00ffcc';
            ctx.setLineDash([4, 4]);
            for (const key of selectedTiles) {
                const [c, r] = key.split(',').map(Number);
                ctx.fillStyle = 'rgba(0, 255, 204, 0.15)';
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeRect(c * TILE_SIZE + 1.5, r * TILE_SIZE + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
            }
            ctx.restore();
        }

        // 3. Marquee drag box
        if (isMarquee && marqueeStart && marqueeEnd) {
            const minX = Math.min(marqueeStart.x, marqueeEnd.x);
            const minY = Math.min(marqueeStart.y, marqueeEnd.y);
            const bw = Math.abs(marqueeEnd.x - marqueeStart.x);
            const bh = Math.abs(marqueeEnd.y - marqueeStart.y);
            ctx.save();
            ctx.fillStyle = 'rgba(0, 255, 204, 0.2)';
            ctx.fillRect(minX, minY, bw, bh);
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 2]);
            ctx.strokeRect(minX, minY, bw, bh);
            ctx.restore();
        }

        // 4. Checkpoint gate drawing live guide line
        if (checkpointDrawing) {
            ctx.save();
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(checkpointDrawing.x1, checkpointDrawing.y1);
            ctx.lineTo(checkpointDrawing.x2, checkpointDrawing.y2);
            ctx.stroke();

            ctx.fillStyle = '#00ffcc';
            ctx.beginPath(); ctx.arc(checkpointDrawing.x1, checkpointDrawing.y1, 5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(checkpointDrawing.x2, checkpointDrawing.y2, 5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }
    
    camera.restore(ctx);
    
    requestAnimationFrame(gameLoop);
}

function update(rawDt) {
    if (currentState === GAME_STATES.PLAY && playerCar) {
        physicsAccumulator += rawDt;
        const FIXED_DT = 1 / 60;
        while (physicsAccumulator >= FIXED_DT) {
            playerCar.update(FIXED_DT, keys, collisionGrid, sensorGrid);

            // Record telemetry for ghost replay while player is driving an active lap
            if (playerCar.started && playerCar.alive) {
                const lastSample = currentLapRecording[currentLapRecording.length - 1];
                if (!lastSample || (playerCar.lapTime - lastSample.t >= 0.015)) {
                    currentLapRecording.push({
                        t: Number(playerCar.lapTime.toFixed(3)),
                        x: Number(playerCar.x.toFixed(2)),
                        y: Number(playerCar.y.toFixed(2)),
                        angle: Number(playerCar.angle.toFixed(3)),
                        overpass: playerCar.isOnOverpass ? 1 : 0
                    });
                }
            }

            const prevLaps = playerCar.lapCount;
            playerCar.checkCheckpoints(currentTrack.checkpoints);

            if (playerCar.lapCount > prevLaps) {
                // Completed a lap! Check if it's a new personal best
                const finishedLapTime = currentLapRecording.length > 0 
                    ? currentLapRecording[currentLapRecording.length - 1].t 
                    : playerCar.bestLap;

                if (finishedLapTime > 0.5 && finishedLapTime < trackPersonalBest) {
                    trackPersonalBest = finishedLapTime;
                    playerCar.bestLap = trackPersonalBest;
                    bestGhostPath = currentLapRecording.slice();
                    try {
                        localStorage.setItem('neurotrack_best_time_' + currentTrackName, trackPersonalBest.toString());
                        localStorage.setItem('neurotrack_ghost_' + currentTrackName, JSON.stringify(bestGhostPath));
                    } catch (e) {
                        console.warn("Could not save best lap/ghost", e);
                    }
                }
                currentLapRecording = [];
            }

            physicsAccumulator -= FIXED_DT;
        }
        camera.follow(playerCar);
        document.getElementById('lap-time').innerText = playerCar.lapTime.toFixed(2);
        document.getElementById('best-time').innerText = trackPersonalBest === Infinity ? '--' : trackPersonalBest.toFixed(2);
        document.getElementById('speed').innerText = Math.floor(Math.abs(playerCar.speed));
        document.getElementById('lap-count').innerText = playerCar.lapCount;
        
        if (typeof updateAudio === 'function') updateAudio(playerCar);
    }

    if (currentState === GAME_STATES.RACE && playerCar && bestBotCar) {
        if (!raceStarted) {
            const hasInput = keys.up || keys.down || keys.left || keys.right;
            if (hasInput) raceStarted = true;
        }

        physicsAccumulator += rawDt;
        const FIXED_DT = 1 / 60;
        while (physicsAccumulator >= FIXED_DT) {
            if (raceStarted) {
                playerCar.update(FIXED_DT, keys, collisionGrid, sensorGrid);
                bestBotCar.update(FIXED_DT, null, collisionGrid, sensorGrid);
            }
            playerCar.checkCheckpoints(currentTrack.checkpoints);
            bestBotCar.checkCheckpoints(currentTrack.checkpoints);
            physicsAccumulator -= FIXED_DT;
        }
        
        camera.follow(playerCar);
        
        document.getElementById('lap-time').innerText = playerCar.lapTime.toFixed(2);
        document.getElementById('best-time').innerText = playerCar.bestLap === Infinity ? '--' : playerCar.bestLap.toFixed(2);
        document.getElementById('speed').innerText = Math.floor(Math.abs(playerCar.speed));
        document.getElementById('lap-count').innerText = playerCar.lapCount;
        
        if (typeof updateAudio === 'function') updateAudio(playerCar);
    }

    if (currentState === GAME_STATES.TRAIN && geneticAlgo && trainRunning) {
        if (isWatchingReplay && replayCar) {
            // Replay mode runs at 1x speed
            physicsAccumulator += rawDt;
            const FIXED_DT = 1 / 60;
            while (physicsAccumulator >= FIXED_DT) {
                replayCar.update(FIXED_DT, null, collisionGrid, sensorGrid);
                replayCar.checkCheckpoints(currentTrack.checkpoints);
                physicsAccumulator -= FIXED_DT;
            }
            camera.follow(replayCar);
            
            if (!replayCar.alive || replayCar.lapCount >= 1) {
                endWatchReplay();
            }
            return;
        }

        physicsAccumulator += rawDt * trainSpeed;
        const FIXED_DT = 1 / 60;
        
        let steps = 0;
        let allDead = true;
        let bestCar = null;
        let maxFitness = -1;
        let aliveCount = 0;
        
        while (physicsAccumulator >= FIXED_DT && steps < 1000) {
            trainTimer += FIXED_DT;
            allDead = true;
            aliveCount = 0;
            bestCar = null;
            maxFitness = -1;

            for (const car of aiCars) {
                car.update(FIXED_DT, null, collisionGrid, sensorGrid);
                car.checkCheckpoints(currentTrack.checkpoints);
                if (car.alive) { allDead = false; aliveCount++; }
                if (car.fitness > maxFitness) { maxFitness = car.fitness; bestCar = car; }
                if (car.bestLap < bestTrainLap) { bestTrainLap = car.bestLap; }
                if (car.bestLap < Infinity) {
                    const currentBest = { brain: geneticAlgo.bestBrain, bestLap: geneticAlgo.allTimeBestLap, fitness: geneticAlgo.bestFitness };
                    if (isBetterCandidate(car, currentBest)) {
                        geneticAlgo.allTimeBestLap = car.bestLap;
                        if (car.fitness > geneticAlgo.bestFitness) geneticAlgo.bestFitness = car.fitness;
                        geneticAlgo.bestBrain = car.brain.clone();
                        saveBestBrain(true);
                    }
                }
            }

            const isInf = document.getElementById('train-timelimit-inf')?.checked;

            if (isInf) {
                const deadCount = aiCars.length - aliveCount;
                if (deadCount / aiCars.length > 0.75) allDead = true;
            } else {
                if (trainTimer >= trainTimeLimit || aliveCount === 0) allDead = true;
            }

            if (allDead) {
                endGeneration();
                physicsAccumulator = 0;
                break;
            }
            
            physicsAccumulator -= FIXED_DT;
            steps++;
        }

        if (bestCar && bestCar.alive && !manualCamera) camera.follow(bestCar);

        // Update train HUD
        const genEl = document.getElementById('gen-count');
        const fitEl = document.getElementById('best-fitness');
        const aliveEl = document.getElementById('alive-count');
        const timerEl = document.getElementById('gen-timer');
        const lapEl = document.getElementById('best-train-lap');
        
        // bestTrainLap is now updated inside the inner simulation step loop

        if (genEl) genEl.textContent = geneticAlgo.generation;
        if (fitEl) fitEl.textContent = maxFitness.toFixed(1);
        if (aliveEl) aliveEl.textContent = aliveCount;
        const isInf = document.getElementById('train-timelimit-inf')?.checked;
        if (timerEl) timerEl.textContent = isInf ? trainTimer.toFixed(1) + '/∞' : trainTimer.toFixed(1) + '/' + trainTimeLimit;
        if (lapEl) lapEl.textContent = bestTrainLap === Infinity ? '--' : bestTrainLap.toFixed(2);
    }

    camera.update(rawDt);
}

function render() {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (currentState === GAME_STATES.MENU) return;

    camera.applyTransform(ctx, canvas);
    currentTrack.render(ctx, currentState === GAME_STATES.EDITOR);

    const drawCars = (filter) => {
        if (currentState === GAME_STATES.PLAY && playerCar && filter(playerCar)) {
            playerCar.render(ctx);
        }
        if (showGhost && currentState === GAME_STATES.PLAY && bestGhostPath && bestGhostPath.length > 0 && playerCar) {
            const sampleTime = playerCar.started ? playerCar.lapTime : 0;
            const ghost = getGhostSample(bestGhostPath, sampleTime);
            if (ghost && filter({ isOnOverpass: !!ghost.overpass })) {
                Car.renderGhost(ctx, ghost.x, ghost.y, ghost.angle);
            }
        }
        if (currentState === GAME_STATES.RACE && playerCar && bestBotCar) {
            if (filter(bestBotCar)) bestBotCar.render(ctx);
            if (filter(playerCar)) playerCar.render(ctx);
        }
        if (currentState === GAME_STATES.TRAIN) {
            for (const car of aiCars) {
                if (!car.alive && filter(car)) { ctx.globalAlpha = 0.15; car.render(ctx); ctx.globalAlpha = 1.0; }
            }
            for (const car of aiCars) {
                if (car.alive && filter(car)) { car.render(ctx); if (showSensors) car.renderSensors(ctx); }
            }
        }
    };

    const isOverpass = (car) => car.isOnOverpass;
    const isUnderpassOrNormal = (car) => !car.isOnOverpass;

    if (isWatchingReplay && replayCar) {
        if (isUnderpassOrNormal(replayCar)) { replayCar.render(ctx); if (showSensors) replayCar.renderSensors(ctx); }
        if (typeof currentTrack.renderOverlays === 'function') {
            currentTrack.renderOverlays(ctx);
        }
        if (isOverpass(replayCar)) { replayCar.render(ctx); if (showSensors) replayCar.renderSensors(ctx); }
        
        // Draw Replay Text
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 24px Courier';
        ctx.textAlign = 'center';
        ctx.fillText('WATCHING REPLAY', camera.x, camera.y - canvas.height / 2 + 50);
    } else {
        drawCars(isUnderpassOrNormal);
        if (typeof currentTrack.renderOverlays === 'function') {
            currentTrack.renderOverlays(ctx);
        }
        drawCars(isOverpass);
    }

    camera.restore(ctx);


}

function saveBestBrain(quiet = false) {
    if (!geneticAlgo) return;

    // Scan the current generation's running cars in case a car beat the record or fitness
    if (typeof aiCars !== 'undefined' && aiCars.length > 0) {
        let bestCurrentCar = null;
        for (const car of aiCars) {
            if (!bestCurrentCar || isBetterCandidate(car, bestCurrentCar)) {
                bestCurrentCar = car;
            }
        }

        if (bestCurrentCar) {
            const currentBest = { brain: geneticAlgo.bestBrain, bestLap: geneticAlgo.allTimeBestLap, fitness: geneticAlgo.bestFitness };
            if (isBetterCandidate(bestCurrentCar, currentBest)) {
                if (bestCurrentCar.bestLap < Infinity) {
                    geneticAlgo.allTimeBestLap = bestCurrentCar.bestLap;
                }
                if (bestCurrentCar.fitness > geneticAlgo.bestFitness) {
                    geneticAlgo.bestFitness = bestCurrentCar.fitness;
                }
                geneticAlgo.bestBrain = bestCurrentCar.brain.clone();
                geneticAlgo.generation = geneticAlgo.generation || 1;
            }
        }
    }

    const data = geneticAlgo.exportBest();
    if (!data || !data.brain) { 
        if (!quiet) customAlert('No trained brain to save!'); 
        return; 
    }

    // Preserve physics tuning settings so the bot always drives with the exact physics it was trained on
    data.settings = {
        maxSpeed: parseFloat(document.getElementById('car-max-speed')?.value) || 380,
        turnRate: parseFloat(document.getElementById('car-turn-speed')?.value) || 4.0,
        acceleration: parseFloat(document.getElementById('car-accel')?.value) || 420,
        drift: document.getElementById('train-drift')?.checked || false
    };

    const key = 'neurotrack_brain_' + currentTrackName;
    const existing = loadBestBrainData();
    if (existing && existing.brain) {
        const candidateNew = { brain: data.brain, bestLap: data.bestLap, fitness: data.fitness };
        const candidateExisting = { brain: existing.brain, bestLap: existing.bestLap, fitness: existing.fitness };
        if (!isBetterCandidate(candidateNew, candidateExisting)) {
            // Existing saved brain is better than current candidate!
            if (!quiet) {
                let msg = 'Track already has a superior bot saved:\n\n';
                if (candidateExisting.bestLap && candidateExisting.bestLap < Infinity) {
                    msg += 'Existing Record Time: ' + candidateExisting.bestLap.toFixed(2) + 's\n';
                } else {
                    msg += 'Existing Fitness: ' + (candidateExisting.fitness || 0).toFixed(0) + '\n';
                }
                msg += 'Existing Generation: ' + (existing.generation || 0);
                customAlert(msg, 'PREVIOUS BOT BETTER');
            }
            return;
        }
    }

    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn("Could not save best brain to localStorage:", e);
    }
    
    if (!quiet) {
        let msg = 'Best brain saved to local storage for track: ' + currentTrackName + '\n\n';
        if (data.bestLap && data.bestLap < Infinity) {
            msg += 'Record Time: ' + data.bestLap.toFixed(2) + 's\n';
        } else {
            msg += 'Fitness: ' + (data.fitness || 0).toFixed(0) + '\n';
        }
        msg += 'Generation: ' + (data.generation || 0);
        customAlert(msg, 'BOT SAVED');
    }
}

function loadBestBrainData() {
    const key = 'neurotrack_brain_' + currentTrackName;
    const jsonStr = localStorage.getItem(key);
    if (!jsonStr) return null;
    try {
        const data = JSON.parse(jsonStr);
        return data;
    } catch (e) {
        console.error("Failed to parse brain data:", e);
        return null;
    }
}

function loadBestBrain() {
    const data = loadBestBrainData();
    if (!data) return null;
    try {
        const brainData = data.brain ? data.brain : data;
        return NeuralNetwork.fromJSON(brainData);
    } catch (e) {
        console.error("Failed to load brain:", e);
        return null;
    }
}

function clearBestBrain() {
    const key = 'neurotrack_brain_' + currentTrackName;
    localStorage.removeItem(key);
    if (geneticAlgo) {
        geneticAlgo.bestBrain = null;
        geneticAlgo.allTimeBestLap = Infinity;
        geneticAlgo.bestFitness = 0;
    }
    customAlert('Best brain cleared for ' + currentTrackName, 'CLEARED');
}

function watchBestReplay() {
    let gaCandidate = null;
    if (geneticAlgo && geneticAlgo.bestBrain) {
        gaCandidate = {
            brain: geneticAlgo.bestBrain,
            bestLap: geneticAlgo.allTimeBestLap,
            fitness: geneticAlgo.bestFitness,
            sensorCount: geneticAlgo.sensorCount,
            settings: {
                maxSpeed: parseFloat(document.getElementById('car-max-speed')?.value) || 380,
                turnRate: parseFloat(document.getElementById('car-turn-speed')?.value) || 4.0,
                acceleration: parseFloat(document.getElementById('car-accel')?.value) || 420
            }
        };
    }
    if (typeof aiCars !== 'undefined' && aiCars.length > 0) {
        for (const car of aiCars) {
            if (car.brain && isBetterCandidate(car, gaCandidate)) {
                gaCandidate = {
                    brain: car.brain,
                    bestLap: car.bestLap,
                    fitness: car.fitness,
                    sensorCount: car.sensorCount || (geneticAlgo ? geneticAlgo.sensorCount : 7),
                    settings: {
                        maxSpeed: car.maxSpeed || 380,
                        turnRate: car.turnRate || 4.0,
                        acceleration: car.acceleration || 420
                    }
                };
            }
        }
    }

    let savedCandidate = null;
    const savedData = loadBestBrainData();
    if (savedData && savedData.brain) {
        savedCandidate = {
            brain: NeuralNetwork.fromJSON(savedData.brain),
            bestLap: savedData.bestLap,
            fitness: savedData.fitness,
            sensorCount: savedData.sensorCount,
            settings: savedData.settings
        };
    }

    let bestChoice = null;
    if (gaCandidate && savedCandidate) {
        bestChoice = isBetterCandidate(gaCandidate, savedCandidate) ? gaCandidate : savedCandidate;
    } else {
        bestChoice = gaCandidate || savedCandidate;
    }

    if (!bestChoice || !bestChoice.brain) {
        customAlert('No best brain available to watch. Let them train!', 'NO BRAIN');
        return;
    }

    isWatchingReplay = true;
    wasTrainingRunning = trainRunning;
    
    replayCar = new Car(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle, '#eab308');
    const brain = bestChoice.brain.clone ? bestChoice.brain.clone() : NeuralNetwork.fromJSON(bestChoice.brain);
    
    let botSensorCount = bestChoice.sensorCount;
    const memCount = Math.max(0, brain.layerSizes[brain.layerSizes.length - 1] - 4);
    const inferredSensors = Math.max(1, brain.layerSizes[0] - 1 - memCount);
    if (!botSensorCount) botSensorCount = inferredSensors;

    replayCar.sensorCount = botSensorCount;
    replayCar.brain = brain;
    
    // Copy settings so they drive identically
    replayCar.maxSpeed = (bestChoice.settings && bestChoice.settings.maxSpeed) ? bestChoice.settings.maxSpeed : (parseFloat(document.getElementById('car-max-speed')?.value) || 380);
    replayCar.turnRate = (bestChoice.settings && bestChoice.settings.turnRate) ? bestChoice.settings.turnRate : (parseFloat(document.getElementById('car-turn-speed')?.value) || 4.0);
    replayCar.acceleration = (bestChoice.settings && bestChoice.settings.acceleration) ? bestChoice.settings.acceleration : (parseFloat(document.getElementById('car-accel')?.value) || 420);
}

function endWatchReplay() {
    isWatchingReplay = false;
    replayCar = null;
    trainRunning = wasTrainingRunning;
}

function startRaceMode() {
    let gaCandidate = null;
    if (geneticAlgo && geneticAlgo.bestBrain) {
        gaCandidate = {
            brain: geneticAlgo.bestBrain,
            bestLap: geneticAlgo.allTimeBestLap,
            fitness: geneticAlgo.bestFitness,
            sensorCount: geneticAlgo.sensorCount,
            settings: {
                maxSpeed: parseFloat(document.getElementById('car-max-speed')?.value) || 380,
                turnRate: parseFloat(document.getElementById('car-turn-speed')?.value) || 4.0,
                acceleration: parseFloat(document.getElementById('car-accel')?.value) || 420
            }
        };
    }
    if (typeof aiCars !== 'undefined' && aiCars.length > 0) {
        for (const car of aiCars) {
            if (car.brain && isBetterCandidate(car, gaCandidate)) {
                gaCandidate = {
                    brain: car.brain,
                    bestLap: car.bestLap,
                    fitness: car.fitness,
                    sensorCount: car.sensorCount || (geneticAlgo ? geneticAlgo.sensorCount : 7),
                    settings: {
                        maxSpeed: car.maxSpeed || 380,
                        turnRate: car.turnRate || 4.0,
                        acceleration: car.acceleration || 420
                    }
                };
            }
        }
    }

    let savedCandidate = null;
    const savedData = loadBestBrainData();
    if (savedData && savedData.brain) {
        savedCandidate = {
            brain: NeuralNetwork.fromJSON(savedData.brain),
            bestLap: savedData.bestLap,
            fitness: savedData.fitness,
            sensorCount: savedData.sensorCount,
            settings: savedData.settings
        };
    }

    let bestChoice = null;
    if (gaCandidate && savedCandidate) {
        bestChoice = isBetterCandidate(gaCandidate, savedCandidate) ? gaCandidate : savedCandidate;
    } else {
        bestChoice = gaCandidate || savedCandidate;
    }

    if (!bestChoice || !bestChoice.brain) {
        customAlert('No trained brain available! Evolve a network or load one first.');
        return;
    }

    const brain = bestChoice.brain.clone ? bestChoice.brain.clone() : NeuralNetwork.fromJSON(bestChoice.brain);
    let botSensorCount = bestChoice.sensorCount;
    const botSettings = bestChoice.settings;

    const validity = currentTrack.isValid();
    if (!validity.valid) { customAlert("Track invalid: " + validity.reason); return; }
    currentTrack.computeCheckpoints();
    currentTrack.renderCollisionCanvas(collisionCanvas);
    const cCtx = collisionCanvas.getContext('2d');
    collisionGrid = { width: collisionCanvas.width, height: collisionCanvas.height, data: cCtx.getImageData(0, 0, collisionCanvas.width, collisionCanvas.height).data };
    currentTrack.renderSensorCanvas(sensorCanvas);
    const sCtx = sensorCanvas.getContext('2d');
    sensorGrid = { width: sensorCanvas.width, height: sensorCanvas.height, data: sCtx.getImageData(0, 0, sensorCanvas.width, sensorCanvas.height).data };

    playerCar = new Car(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle, '#00ffff');
    playerCar.maxSpeed = parseFloat(document.getElementById('car-max-speed')?.value) || 380;
    playerCar.turnRate = parseFloat(document.getElementById('car-turn-speed')?.value) || 4.0;
    playerCar.acceleration = parseFloat(document.getElementById('car-accel')?.value) || 420;

    // Calculate exact sensor count matching the neural network architecture
    const memCount = Math.max(0, brain.layerSizes[brain.layerSizes.length - 1] - 4);
    const inferredSensors = Math.max(1, brain.layerSizes[0] - 1 - memCount);
    if (!botSensorCount) botSensorCount = inferredSensors;

    bestBotCar = new Car(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle, '#ff0055');
    bestBotCar.sensorCount = botSensorCount;
    bestBotCar.brain = brain;

    // Use the exact physics settings the bot was trained with
    bestBotCar.maxSpeed = (botSettings && botSettings.maxSpeed) ? botSettings.maxSpeed : playerCar.maxSpeed;
    bestBotCar.turnRate = (botSettings && botSettings.turnRate) ? botSettings.turnRate : playerCar.turnRate;
    bestBotCar.acceleration = (botSettings && botSettings.acceleration) ? botSettings.acceleration : playerCar.acceleration;

    camera.setPosition(playerCar.x, playerCar.y);
    camera.targetZoom = 1.4;
    raceStarted = false;
    switchState(GAME_STATES.RACE);
    
    if (typeof initAudio === 'function') initAudio();
}

// ==================== GARAGE LOGIC ====================
const GARAGE_CARS = [
    { id: 'f1', name: 'FORMULA 1', src: 'img/car_sprite.png' },
    { id: 'rally', name: 'RALLY CAR', src: 'img/car_rally.png' },
    { id: 'lambo', name: 'LAMBO', src: 'img/car_lambo.png' },
    { id: 'sport', name: 'SPORTS CAR', src: 'img/car_sport.png' },
    { id: 'limo', name: 'LIMO', src: 'img/car_limo.png' }
];

window.userCarType = localStorage.getItem('nt_carType') || 'f1';
window.userHueShift = parseInt(localStorage.getItem('nt_hueShift')) || 0;
window.userBrightness = parseInt(localStorage.getItem('nt_brightness'));
if (isNaN(window.userBrightness)) window.userBrightness = 100;
let currentGarageIndex = Math.max(0, GARAGE_CARS.findIndex(c => c.id === window.userCarType));

const garageCanvas = document.getElementById('garage-canvas');
const garageCtx = garageCanvas.getContext('2d');
const garageCarImages = {};
GARAGE_CARS.forEach(car => {
    const img = new Image();
    img.src = car.src;
    img.onload = drawGarageCar; // Redraw when loaded
    garageCarImages[car.id] = img;
});

function drawGarageCar() {
    if (!garageCtx) return;
    garageCtx.clearRect(0, 0, garageCanvas.width, garageCanvas.height);
    const car = GARAGE_CARS[currentGarageIndex];
    document.getElementById('garage-car-name').innerText = car.name;
    const img = garageCarImages[car.id];
    if (img.complete && img.naturalWidth > 0) {
        garageCtx.save();
        garageCtx.translate(garageCanvas.width / 2, garageCanvas.height / 2);
        
        // Dynamic scaling to fit nicely in the 300x150 preview box
        const targetWidth = 260;
        const targetHeight = 130;
        const scaleX = targetWidth / img.width;
        const scaleY = targetHeight / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        garageCtx.filter = `hue-rotate(${window.userHueShift}deg) brightness(${window.userBrightness}%)`;
        garageCtx.drawImage(img, -(img.width * scale) / 2, -(img.height * scale) / 2, img.width * scale, img.height * scale);
        garageCtx.restore();
    }
}

function initGarage() {
    currentGarageIndex = Math.max(0, GARAGE_CARS.findIndex(c => c.id === window.userCarType));
    document.getElementById('garage-hue').value = window.userHueShift;
    
    const brightnessSlider = document.getElementById('garage-brightness');
    if (brightnessSlider) brightnessSlider.value = window.userBrightness;
    
    drawGarageCar();
}

document.getElementById('btn-garage-prev').addEventListener('click', () => {
    currentGarageIndex = (currentGarageIndex - 1 + GARAGE_CARS.length) % GARAGE_CARS.length;
    window.userCarType = GARAGE_CARS[currentGarageIndex].id;
    drawGarageCar();
});
document.getElementById('btn-garage-next').addEventListener('click', () => {
    currentGarageIndex = (currentGarageIndex + 1) % GARAGE_CARS.length;
    window.userCarType = GARAGE_CARS[currentGarageIndex].id;
    drawGarageCar();
});
document.getElementById('garage-hue').addEventListener('input', (e) => {
    window.userHueShift = parseInt(e.target.value);
    drawGarageCar();
});
const brightnessSlider = document.getElementById('garage-brightness');
if (brightnessSlider) {
    brightnessSlider.addEventListener('input', (e) => {
        window.userBrightness = parseInt(e.target.value);
        drawGarageCar();
    });
}
document.getElementById('btn-garage-back').addEventListener('click', () => {
    localStorage.setItem('nt_carType', window.userCarType);
    localStorage.setItem('nt_hueShift', window.userHueShift);
    localStorage.setItem('nt_brightness', window.userBrightness);
    switchState(GAME_STATES.MENU);
});

window.onload = init;
