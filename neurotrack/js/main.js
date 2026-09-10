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
    GARAGE: 4
};

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

// Editor State
let editorSelectedTile = 1;
let isPainting = false;
let paintTileType = 0;
let lastPaintPos = { col: -1, row: -1 };

let editorHistory = [];
let editorRedoHistory = [];

function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d', { alpha: false });
    collisionCanvas = document.createElement('canvas');
    sensorCanvas = document.createElement('canvas');

    resize();
    window.addEventListener('resize', resize);

    camera = new Camera();
    loadCustomTracks();
    loadTrack(currentTrackName);

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
    window.addEventListener('beforeunload', () => {
        if (currentTrack) {
            const session = {
                trackGrid: Array.from(currentTrack.grid)
            };
            if (currentTrack.autoGrid) {
                session.autoGrid = Array.from(currentTrack.autoGrid);
            }
            if (typeof bestBotCar !== 'undefined' && bestBotCar && bestBotCar.brain) {
                session.bestBrain = bestBotCar.brain.serialize();
            }
            localStorage.setItem('neurotrack_session', JSON.stringify(session));
        }
    });

    const prevSession = localStorage.getItem('neurotrack_session');
    if (prevSession) {
        setTimeout(() => {
            try {
                const session = JSON.parse(prevSession);
                if (session.trackGrid && session.trackGrid.length === currentTrack.grid.length) {
                    currentTrack.grid.set(session.trackGrid);
                    if (currentTrack.autoGrid) {
                        if (session.autoGrid && session.autoGrid.length === currentTrack.autoGrid.length) {
                            currentTrack.autoGrid.set(session.autoGrid);
                        } else {
                            currentTrack.autoGrid.fill(0);
                        }
                    }
                    currentTrack.computeCheckpoints();
                    currentTrack.markDirty();
                    currentTrack.renderCollisionCanvas(collisionCanvas);
                    const cCtx = collisionCanvas.getContext('2d');
                    collisionGrid = { width: collisionCanvas.width, height: collisionCanvas.height, data: cCtx.getImageData(0, 0, collisionCanvas.width, collisionCanvas.height).data };
                    
                    if (typeof currentTrack.renderSensorCanvas === 'function') {
                        currentTrack.renderSensorCanvas(sensorCanvas);
                        const sCtx = sensorCanvas.getContext('2d');
                        sensorGrid = { width: sensorCanvas.width, height: sensorCanvas.height, data: sCtx.getImageData(0, 0, sensorCanvas.width, sensorCanvas.height).data };
                    }
                }
                if (session.bestBrain) {
                    const restoredBrain = NeuralNetwork.deserialize(session.bestBrain);
                    bestBotCar = new Car(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startAngle, true);
                    bestBotCar.brain = restoredBrain;
                }
            } catch (e) {
                console.error("Failed to restore session", e);
            }
        }, 100);
    }
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
    
    for (const name in customTracks) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.text = name;
        select.appendChild(opt);
    }
    select.value = currentTrackName;
}

function loadTrack(name) {
    currentTrackName = name;
    if (name === 'Default Oval') {
        currentTrack = Track.createDefaultOval();
    } else if (name === 'Figure Eight') {
        currentTrack = Track.createFigureEight();
    } else if (customTracks[name]) {
        currentTrack = Track.importJSON(customTracks[name]);
        if (!currentTrack) currentTrack = Track.createDefaultOval();
    }
    currentTrack.renderCollisionCanvas(collisionCanvas);
    
    const editorName = document.getElementById('editor-track-name');
    if (editorName) {
        editorName.value = (name === 'Default Oval' || name === 'Figure Eight') ? 'My Custom Track' : name;
    }
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
        if (e.key === 'p' || e.key === 'P') {
            if (currentState === GAME_STATES.TRAIN) {
                togglePlayPause();
            }
        }
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            if (currentState === GAME_STATES.EDITOR && editorHistory.length > 0) {
                const currentStateObj = {
                    grid: new Uint8Array(currentTrack.grid),
                    autoGrid: new Uint32Array(currentTrack.autoGrid)
                };
                editorRedoHistory.push(currentStateObj);
                
                const prevState = editorHistory.pop();
                currentTrack.grid.set(prevState.grid);
                currentTrack.autoGrid.set(prevState.autoGrid);
                currentTrack.computeCheckpoints();
                currentTrack.markDirty();
                currentTrack.renderCollisionCanvas(collisionCanvas);
                updateLimits();
            }
        }
        if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
            if (currentState === GAME_STATES.EDITOR && editorRedoHistory.length > 0) {
                const currentStateObj = {
                    grid: new Uint8Array(currentTrack.grid),
                    autoGrid: new Uint32Array(currentTrack.autoGrid)
                };
                editorHistory.push(currentStateObj);
                
                const nextState = editorRedoHistory.pop();
                currentTrack.grid.set(nextState.grid);
                currentTrack.autoGrid.set(nextState.autoGrid);
                currentTrack.computeCheckpoints();
                currentTrack.markDirty();
                currentTrack.renderCollisionCanvas(collisionCanvas);
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
    let paintTileType = 1;
    let lastPaintPos = null;
    let lastAutoDrawDir = { dx: 0, dy: 0 };
    let currentStrokeId = 1;

    function updateLimits() {
        let hasStart = false, teleCount = 0;
        if (!currentTrack || !window.TILE_FAMILIES) return {hasStart, teleCount};
        
        const startFamily = window.TILE_FAMILIES.find(f => f.includes(7)) || [];
        const teleportFamily = window.TILE_FAMILIES.find(f => f.includes(32)) || [];
        
        for(let c=0; c<currentTrack.cols; c++){
            for(let r=0; r<currentTrack.rows; r++){
                const id = currentTrack.getTile(c,r);
                if (startFamily.includes(id)) hasStart = true;
                if (teleportFamily.includes(id)) teleCount++;
            }
        }
        const startBtn = document.getElementById('btn-tile-family-7');
        const teleBtn = document.getElementById('btn-tile-family-32');
        
        if (startBtn) { startBtn.disabled = hasStart; startBtn.style.opacity = hasStart ? '0.3' : '1'; }
        if (teleBtn) { teleBtn.disabled = teleCount >= 2; teleBtn.style.opacity = teleCount >= 2 ? '0.3' : '1'; }
        return { hasStart, teleCount };
    }

    function applyPaint(c, r) {
        if (paintTileType !== 99 && paintTileType !== 0) {
            const limits = updateLimits();
            const currentTile = currentTrack.getTile(c, r);
            
            const startFamily = window.TILE_FAMILIES.find(f => f.includes(7)) || [];
            const teleportFamily = window.TILE_FAMILIES.find(f => f.includes(32)) || [];
            
            if (startFamily.includes(paintTileType) && limits.hasStart && !startFamily.includes(currentTile)) return;
            if (teleportFamily.includes(paintTileType) && limits.teleCount >= 2 && !teleportFamily.includes(currentTile)) return;
        }

        if (paintTileType === 99 || paintTileType === 0) {
            const wasEmpty = currentTrack.getTile(c, r) === 0;
            const newId = paintTileType === 99 ? (wasEmpty ? TILE_TYPES.STRAIGHT_H.id : currentTrack.getTile(c, r)) : 0;
            currentTrack.setTile(c, r, newId, paintTileType === 99 ? currentStrokeId : 0);
            currentTrack.autoResolveTile(c, r, lastAutoDrawDir.dx, lastAutoDrawDir.dy, currentStrokeId);
            currentTrack.autoResolveTile(c, r - 1, 0, 0, currentStrokeId);
            currentTrack.autoResolveTile(c + 1, r, 0, 0, currentStrokeId);
            currentTrack.autoResolveTile(c, r + 1, 0, 0, currentStrokeId);
            currentTrack.autoResolveTile(c - 1, r, 0, 0, currentStrokeId);
        } else {
            currentTrack.setTile(c, r, paintTileType);
        }
        updateLimits();
    }

    function saveEditorState() {
        if (!currentTrack) return;
        const state = {
            grid: new Uint8Array(currentTrack.grid),
            autoGrid: new Uint32Array(currentTrack.autoGrid)
        };
        editorHistory.push(state);
        if (editorHistory.length > 50) editorHistory.shift();
        editorRedoHistory = [];
    }

    canvas.addEventListener('mousedown', e => {
        if (currentState === GAME_STATES.EDITOR) {
            if (e.button === 0) {
                const worldPos = camera.screenToWorld(e.clientX, e.clientY, canvas);
                const col = Math.floor(worldPos.x / TILE_SIZE);
                const row = Math.floor(worldPos.y / TILE_SIZE);
                isPainting = true; 
                paintTileType = editorSelectedTile;
                lastPaintPos = { col, row };
                lastAutoDrawDir = { dx: 0, dy: 0 };
                if (paintTileType === 99) {
                    currentStrokeId++;
                }
                
                saveEditorState();
                
                applyPaint(col, row);
                return;
            }
        }
        
        if (currentState === GAME_STATES.TRAIN || currentState === GAME_STATES.EDITOR) {
            if (currentState === GAME_STATES.EDITOR && e.button !== 1 && e.button !== 2) return; // Editor pans on middle or right click
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
        }
        
        if (currentState === GAME_STATES.EDITOR && isPainting) {
            const worldPos = camera.screenToWorld(e.clientX, e.clientY, canvas);
            const col = Math.floor(worldPos.x / TILE_SIZE);
            const row = Math.floor(worldPos.y / TILE_SIZE);
            
            if (lastPaintPos) {
                // Orthogonal line algorithm to ensure connected tiles
                let cx = lastPaintPos.col;
                let cy = lastPaintPos.row;
                
                while (cx !== col || cy !== row) {
                    // Step in the direction of the largest gap
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
                }
            } else {
                lastAutoDrawDir = { dx: 0, dy: 0 };
                applyPaint(col, row);
            }
            lastPaintPos = { col, row };
            return;
        }
        if (isPanning) {
            const dx = (e.clientX - lastPanPos.x) / camera.zoom;
            const dy = (e.clientY - lastPanPos.y) / camera.zoom;
            camera.targetX -= dx;
            camera.targetY -= dy;
            lastPanPos = { x: e.clientX, y: e.clientY };
        }
    });
    
    window.addEventListener('mouseup', () => {
        if (isPainting) { 
            isPainting = false; 
            lastPaintPos = null;
            currentTrack.renderCollisionCanvas(collisionCanvas); 
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
    }
    if (currentState === GAME_STATES.TRAIN && geneticAlgo) {
        endGeneration();
    }
    if (currentState === GAME_STATES.RACE && playerCar && bestBotCar) {
        playerCar.reset(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle);
        bestBotCar.reset(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle);
    }
}

function setupUI() {
    document.getElementById('btn-play').onclick = startPlayMode;
    document.getElementById('btn-race').onclick = startRaceMode;
    document.getElementById('btn-editor').onclick = startEditorMode;
    document.getElementById('btn-train').onclick = startTrainMode;

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.onclick = () => {
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
            if (name === 'Default Oval' || name === 'Figure Eight') { customAlert("Cannot overwrite default tracks."); return; }
            
            saveBestBrain(true);
            customTracks[name] = currentTrack.exportJSON();
            saveCustomTracks();
            currentTrackName = name;
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
            currentTrack.grid.fill(0);
            if (currentTrack.autoGrid) currentTrack.autoGrid.fill(false);
            currentTrack.markDirty();
            
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
            const dataStr = currentTrack.exportJSON();
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.href = url;
            downloadAnchorNode.download = "track.json";
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
                        customAlert("Invalid track file!");
                        return;
                    }
                    currentTrack = importedTrack;
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
                } catch (err) {
                    customAlert("Invalid track file!");
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
        [36, 37], // ROUGH STRAIGHT
        [38, 39, 40, 41], // ROUGH CURVE
        [42, 43], // ICE STRAIGHT
        [44, 45, 46, 47], // ICE CURVE
        [48], // INTERSECTION
        [49, 50], // BOUNCY STRAIGHT
        [51, 52, 53, 54], // BOUNCY CURVE
        [55, 56], // PUDDLE STRAIGHT
        [57, 58, 59, 60], // PUDDLE CURVE
        [61, 62], // FAST STRAIGHT
        [63, 64, 65, 66] // FAST CURVE
    ];
    window.TILE_FAMILIES = TILE_FAMILIES; // For limits check

    const friendlyNames = {
        0: '⌫ Eraser', 99: '✨ Auto-Draw', 1: '│ Straight', 3: '╰ Curve', 7: '▶ Start', 9: '┼ Crossroad', 
        14: '─ Bottleneck', 16: '▲ Boost', 20: '╰ Bottleneck Curve', 24: '┴ Split', 28: '▲ Ramp',
        32: '▲ Teleport', 36: '⌇ Rough Straight', 38: '⌇ Rough Curve', 42: '❆ Ice Straight', 44: '❆ Ice Curve',
        48: '✥ Intersection', 49: '⤧ Bouncy Straight', 51: '⤧ Bouncy Curve',
        55: '⌇ Puddle Straight', 57: '⌇ Puddle Curve', 61: '▶ Fast Straight', 63: '▶ Fast Curve'
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
            document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (!family.includes(editorSelectedTile)) {
                editorSelectedTile = baseId;
            }
        };
        palette.appendChild(btn);
    }

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

    document.getElementById('btn-start-training').onclick = () => {
        if (!trainRunning) { trainRunning = true; startTrainMode(); }
    };
    document.getElementById('btn-pause-training').onclick = () => { trainRunning = !trainRunning; };
    document.getElementById('btn-reset-training').onclick = () => {
        if (geneticAlgo) { geneticAlgo.generation = 0; trainTimer = 0; startTrainMode(); }
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
        'train-population': document.getElementById('train-population').value,
        'train-mutation': document.getElementById('train-mutation').value,
        'train-strength': document.getElementById('train-strength').value,
        'train-elitism': document.getElementById('train-elitism').value,
        'train-sensors': document.getElementById('train-sensors').value,
        'train-hidden': document.getElementById('train-hidden').value,
        'train-timelimit': document.getElementById('train-timelimit').value,
        'train-speed': document.getElementById('train-speed').value,
        'car-max-speed': document.getElementById('car-max-speed').value,
        'car-turn-speed': document.getElementById('car-turn-speed').value,
        'car-accel': document.getElementById('car-accel').value,
        'car-friction': document.getElementById('car-friction').value,
        'car-offroad-friction': document.getElementById('car-offroad-friction').value
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
                            el.value = val;
                            el.dispatchEvent(new Event('input')); // trigger labels to update
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
    if (currentState === GAME_STATES.PLAY && newState !== GAME_STATES.PLAY && typeof stopAudio === 'function') {
        stopAudio();
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
    playerCar.turnRate = parseFloat(document.getElementById('car-turn-speed')?.value) || 3.2;
    playerCar.acceleration = parseFloat(document.getElementById('car-accel')?.value) || 420;

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
}

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
        const savedBrain = loadBestBrain();
        if (savedBrain && geneticAlgo.population.length > 0) {
            // Only inject the saved brain if its topology matches the current config!
            if (savedBrain.layerSizes.join(',') === geneticAlgo.layerSizes.join(',')) {
                geneticAlgo.population[0].brain = savedBrain;
                geneticAlgo.bestBrain = savedBrain.clone();
                geneticAlgo.bestFitness = 0;
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

    camera.targetZoom = 0.9;
    switchState(GAME_STATES.TRAIN);
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
    geneticAlgo.evolve();
    trainTimer = 0;
    spawnAICars();
}

window.addEventListener('beforeunload', () => {
    saveBestBrain(true);
});

function spawnAICars() {
    aiCars = [];
    
    // Always use the geneticAlgo's topology if it exists to prevent crashes if the user drags the slider mid-training
    const sc = (geneticAlgo && geneticAlgo.sensorCount) 
        ? geneticAlgo.sensorCount 
        : parseInt(document.getElementById('train-sensors')?.value) || 7;
        
    const maxSpd = parseFloat(document.getElementById('car-max-speed')?.value) || 380;
    const tSpd = parseFloat(document.getElementById('car-turn-speed')?.value) || 3.2;
    const accel = parseFloat(document.getElementById('car-accel')?.value) || 420;

    const brains = geneticAlgo.getBrains ? geneticAlgo.getBrains() : geneticAlgo.population.map(p => p.brain);

    for (let i = 0; i < brains.length; i++) {
        const car = new Car(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle, '#ff0055');
        car.sensorCount = sc;
        car.maxSpeed = maxSpd;
        car.turnRate = tSpd;
        car.acceleration = accel;
        car.brain = brains[i];
        aiCars.push(car);
    }
}

function gameLoop(time) {
    const rawDt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    update(rawDt);
    render();
    
    camera.applyTransform(ctx, canvas);

    if (currentState === GAME_STATES.EDITOR && hoverCol !== -1 && hoverRow !== -1 && editorSelectedTile !== 99 && editorSelectedTile !== 0) {
        ctx.globalAlpha = 0.5;
        const t = Object.values(TILE_TYPES).find(t => t.id === editorSelectedTile);
        if (t && t.render) {
            t.render(ctx, hoverCol * TILE_SIZE, hoverRow * TILE_SIZE, TILE_SIZE);
        }
        ctx.globalAlpha = 1.0;
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
            playerCar.checkCheckpoints(currentTrack.checkpoints);
            physicsAccumulator -= FIXED_DT;
        }
        camera.follow(playerCar);
        document.getElementById('lap-time').innerText = playerCar.lapTime.toFixed(2);
        document.getElementById('best-time').innerText = playerCar.bestLap === Infinity ? '--' : playerCar.bestLap.toFixed(2);
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
            }

            const isInf = document.getElementById('train-timelimit-inf')?.checked;

            if (isInf) {
                const deadCount = aiCars.length - aliveCount;
                if (deadCount / aiCars.length > 0.75) allDead = true;
            } else {
                if (trainTimer >= trainTimeLimit) allDead = true;
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

    // Scan the current generation's running cars in case the record was broken mid-generation
    if (typeof aiCars !== 'undefined' && aiCars.length > 0) {
    // Scan the current active cars to see if any of them beat the current allTimeBestLap or fitness.
    let bestCurrentCar = null;
    for (const car of aiCars) {
        if (!bestCurrentCar) {
            bestCurrentCar = car;
            continue;
        }
        
        const hasLap = car.bestLap !== Infinity;
        const bestHasLap = bestCurrentCar.bestLap !== Infinity;
        
        if (hasLap && !bestHasLap) {
            bestCurrentCar = car;
        } else if (hasLap && bestHasLap) {
            if (car.bestLap < bestCurrentCar.bestLap) bestCurrentCar = car;
        } else if (!hasLap && !bestHasLap) {
            if (car.fitness > bestCurrentCar.fitness) bestCurrentCar = car;
        }
    }

    if (bestCurrentCar) {
        const hasLap = bestCurrentCar.bestLap !== Infinity;
        const isRecordLap = hasLap && bestCurrentCar.bestLap < geneticAlgo.allTimeBestLap;
        const isBetterFitness = !hasLap && geneticAlgo.allTimeBestLap === Infinity && bestCurrentCar.fitness > geneticAlgo.bestFitness;

        if (isRecordLap || isBetterFitness || geneticAlgo.bestBrain === null) {
            if (hasLap && bestCurrentCar.bestLap < geneticAlgo.allTimeBestLap) {
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
    const key = 'neurotrack_brain_' + currentTrackName;
    localStorage.setItem(key, JSON.stringify(data));
    
    if (!quiet) {
        let msg = 'Best brain saved to local storage for track: ' + currentTrackName + '\n\n';
        if (data.bestLap < 9999) {
            msg += 'Record Time: ' + data.bestLap.toFixed(2) + 's\n';
        } else {
            msg += 'Fitness: ' + data.fitness.toFixed(0) + '\n';
        }
        msg += 'Generation: ' + data.generation;
        customAlert(msg, 'BOT SAVED');
    }
}

function loadBestBrain() {
    const key = 'neurotrack_brain_' + currentTrackName;
    const jsonStr = localStorage.getItem(key);
    if (!jsonStr) return null;
    try {
        const data = JSON.parse(jsonStr);
        // Handle wrapper object from exportBest, or fallback to raw brain data
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
    if (!geneticAlgo || !geneticAlgo.bestBrain) {
        customAlert('No best brain available to watch. Let them train!', 'NO BRAIN');
        return;
    }
    isWatchingReplay = true;
    wasTrainingRunning = trainRunning;
    
    replayCar = new Car(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle, '#eab308');
    replayCar.sensorCount = geneticAlgo.sensorCount;
    replayCar.brain = geneticAlgo.bestBrain.clone();
    
    // Copy settings so they drive identically
    replayCar.maxSpeed = parseFloat(document.getElementById('car-max-speed')?.value) || 380;
    replayCar.turnSpeed = parseFloat(document.getElementById('car-turn-speed')?.value) || 3.2;
    replayCar.accel = parseFloat(document.getElementById('car-accel')?.value) || 420;
}

function endWatchReplay() {
    isWatchingReplay = false;
    replayCar = null;
    trainRunning = wasTrainingRunning;
}

function startRaceMode() {
    let brain = null;
    if (geneticAlgo && geneticAlgo.bestBrain) {
        brain = geneticAlgo.bestBrain.clone();
    } else {
        brain = loadBestBrain();
    }
    
    if (!brain) {
        customAlert('No trained brain available! Evolve a network or load one first.');
        return;
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
    playerCar.turnRate = parseFloat(document.getElementById('car-turn-speed')?.value) || 3.2;
    playerCar.acceleration = parseFloat(document.getElementById('car-accel')?.value) || 420;

    bestBotCar = new Car(currentTrack.startPos.x, currentTrack.startPos.y, currentTrack.startPos.angle, '#ff0055');
    bestBotCar.maxSpeed = playerCar.maxSpeed;
    bestBotCar.turnRate = playerCar.turnRate;
    bestBotCar.acceleration = playerCar.acceleration;
    bestBotCar.sensorCount = brain.layerSizes[0] - 1;
    bestBotCar.brain = brain;

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
