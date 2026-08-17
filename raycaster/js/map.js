// map.js
// Handles the 2D grid, collision logic, and the map editor

const MAP_SIZE_MAX = 64; // Max allowed
let MAP_SIZE = 24; // 24x24 grid
let mapGrid = new Uint8Array(MAP_SIZE * MAP_SIZE);
let entities = []; // Array of Entity objects
let playerSpawn = { x: 12.5, y: 12.5 };

// Current editor state
let currentTool = 1; // 1 to 8 for walls, 9+ for sprites, 0 for eraser, -1 for player spawn

const mapCanvas = document.getElementById('map-canvas');
const mapCtx = mapCanvas.getContext('2d', { willReadFrequently: true });
let CELL_SIZE = mapCanvas.width / MAP_SIZE;

let isDrawing = false;

// Initialize a default map with borders
function initMap() {
    entities = [];
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (x === 0 || x === MAP_SIZE - 1 || y === 0 || y === MAP_SIZE - 1) {
                mapGrid[y * MAP_SIZE + x] = 1; // Wall
            } else {
                mapGrid[y * MAP_SIZE + x] = 0; // Air
            }
        }
    }
}

function resizeMap(newSize) {
    const oldSize = MAP_SIZE;
    const oldGrid = new Uint8Array(mapGrid);
    
    MAP_SIZE = newSize;
    CELL_SIZE = mapCanvas.width / MAP_SIZE;
    mapGrid = new Uint8Array(MAP_SIZE * MAP_SIZE);
    
    // Copy old map over or reset empty
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (x === 0 || x === MAP_SIZE - 1 || y === 0 || y === MAP_SIZE - 1) {
                mapGrid[y * MAP_SIZE + x] = 1; // Wall
            } else if (x < oldSize && y < oldSize) {
                mapGrid[y * MAP_SIZE + x] = oldGrid[y * oldSize + x];
            } else {
                mapGrid[y * MAP_SIZE + x] = 0; // Air
            }
        }
    }
    
    // Remove entities that are now out of bounds
    entities = entities.filter(e => e.x < MAP_SIZE - 1 && e.y < MAP_SIZE - 1);
    
    // Reset player spawn if out of bounds
    if (playerSpawn.x >= MAP_SIZE - 1 || playerSpawn.y >= MAP_SIZE - 1) {
        playerSpawn = { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
    }
    
    drawMapEditor();
}

// Get tile at coordinates
function getTile(x, y) {
    if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return 1; // Out of bounds is solid
    return mapGrid[Math.floor(y) * MAP_SIZE + Math.floor(x)];
}

// Set tile at coordinates
function setTile(x, y, value) {
    if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return;
    mapGrid[Math.floor(y) * MAP_SIZE + Math.floor(x)] = value;
}

// Draw the 2D map editor view
function drawMapEditor() {
    mapCtx.fillStyle = '#000000';
    mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

    // Draw Grid Lines (Dark Grey)
    mapCtx.strokeStyle = '#333333';
    mapCtx.lineWidth = 1;
    for (let i = 0; i <= MAP_SIZE; i++) {
        mapCtx.beginPath();
        mapCtx.moveTo(i * CELL_SIZE, 0);
        mapCtx.lineTo(i * CELL_SIZE, mapCanvas.height);
        mapCtx.stroke();
        mapCtx.beginPath();
        mapCtx.moveTo(0, i * CELL_SIZE);
        mapCtx.lineTo(mapCanvas.width, i * CELL_SIZE);
        mapCtx.stroke();
    }

    // Draw Blocks
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = mapGrid[y * MAP_SIZE + x];
            if (tile > 0) {
                // Classic DOS Solid Blocks
                mapCtx.fillStyle = '#AAAAAA';
                mapCtx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                
                // Draw ID number on the block
                mapCtx.fillStyle = '#000000';
                mapCtx.font = '10px monospace';
                mapCtx.textAlign = 'center';
                mapCtx.textBaseline = 'middle';
                mapCtx.fillText(tile, x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
            }
        }
    }

    // Draw Entities
    for (const s of entities) {
        // Draw a solid colored square instead of a circle
        let color = '#FF00FF';
        let label = 'E';
        if (s.type === 9) { color = '#FFFFFF'; label = 'S'; } // Skull
        if (s.type === 10) { color = '#00FF00'; label = 'B'; } // Barrel
        if (s.type === 11) { color = '#FF0000'; label = 'O'; } // Eye
        if (s.type === 12) { color = '#0000FF'; label = 'M'; } // Slime
        if (s.type === 20) { color = '#FFFFFF'; label = '+'; } // Medkit
        if (s.type === 21) { color = '#228B22'; label = 'A'; } // AmmoBox

        mapCtx.fillStyle = color;
        mapCtx.fillRect(
            (s.x * CELL_SIZE) - (CELL_SIZE / 3), 
            (s.y * CELL_SIZE) - (CELL_SIZE / 3), 
            CELL_SIZE * 0.66, 
            CELL_SIZE * 0.66
        );

        mapCtx.fillStyle = '#000000';
        mapCtx.font = 'bold 12px monospace';
        mapCtx.fillText(label, s.x * CELL_SIZE, s.y * CELL_SIZE);
    }

    // Draw Player Spawn
    mapCtx.fillStyle = '#FFFF00'; // DOS Yellow
    mapCtx.fillRect(
        (playerSpawn.x * CELL_SIZE) - (CELL_SIZE / 3), 
        (playerSpawn.y * CELL_SIZE) - (CELL_SIZE / 3), 
        CELL_SIZE * 0.66, 
        CELL_SIZE * 0.66
    );
    mapCtx.fillStyle = '#000000';
    mapCtx.font = 'bold 12px monospace';
    mapCtx.fillText('P', playerSpawn.x * CELL_SIZE, playerSpawn.y * CELL_SIZE);
}

// Editor interaction
function handleMapClick(e) {
    const rect = mapCanvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * MAP_SIZE);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * MAP_SIZE);

    if (currentTool === -1) {
        playerSpawn.x = x + 0.5;
        playerSpawn.y = y + 0.5;
    } else if ([9, 10, 11, 12, 20, 21].includes(currentTool)) {
        // Sprite/Entity
        entities = entities.filter(s => Math.floor(s.x) !== x || Math.floor(s.y) !== y);
        
        // Ensure the selected tool is an actual entity type
        if ([9, 10, 11, 12, 20, 21].includes(currentTool)) {
            entities.push(new Entity(x + 0.5, y + 0.5, currentTool));
        }
    } else if (currentTool === 0) {
        // Eraser
        setTile(x, y, 0);
        entities = entities.filter(s => Math.floor(s.x) !== x || Math.floor(s.y) !== y);
    } else {
        // Wall (1-8, 19)
        setTile(x, y, currentTool);
    }
    drawMapEditor();
}

mapCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    handleMapClick(e);
});
mapCanvas.addEventListener('mousemove', (e) => {
    if (isDrawing && currentTool !== -1) handleMapClick(e);
});
window.addEventListener('mouseup', () => isDrawing = false);

// Editor UI Buttons
function setupEditorUI() {
    const paletteGrid = document.getElementById('palette-grid');
    const spritePaletteGrid = document.getElementById('sprite-palette-grid');
    
    // Add eraser
    const eraser = document.createElement('div');
    eraser.className = 'palette-block';
    eraser.style.background = '#000';
    eraser.innerHTML = '<span style="color:#f00;display:flex;justify-content:center;align-items:center;height:100%;">X</span>';
    eraser.onclick = () => selectTool(0, eraser);
    spritePaletteGrid.appendChild(eraser); // Put eraser in sprite palette too for easier reach, or just one global eraser

    const eraserWall = eraser.cloneNode(true);
    eraserWall.onclick = () => selectTool(0, eraserWall);
    paletteGrid.appendChild(eraserWall);

    let wallCount = 1; // Eraser is 1
    
    // Add texture blocks
    const availableTools = [1, 2, 3, 4, 5, 6, 7, 8, 19, 23, 24, 25, 26, 27, 28, 29, 30, 9, 10, 11, 12, 20, 21];
    
    for (let i of availableTools) {
        if (!textures[i]) continue;
        const block = document.createElement('div');
        block.className = 'palette-block';
        if (i === 1) block.classList.add('selected'); // Default
        
        // Render texture preview on a tiny canvas
        const canvas = document.createElement('canvas');
        canvas.width = TEX_WIDTH;
        canvas.height = TEX_HEIGHT;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(TEX_WIDTH, TEX_HEIGHT);
        const tex = textures[i];
        
        // Convert ABGR to RGBA for canvas
        const data32 = new Uint32Array(imgData.data.buffer);
        for(let j=0; j<tex.length; j++) {
            data32[j] = tex[j];
        }
        ctx.putImageData(imgData, 0, 0);
        
        block.style.backgroundImage = `url(${canvas.toDataURL()})`;
        block.onclick = () => selectTool(i, block);
        
        if ([9, 10, 11, 12, 20, 21].includes(i)) {
            spritePaletteGrid.appendChild(block);
        } else {
            paletteGrid.appendChild(block);
            wallCount++;
            if (wallCount === 12) {
                const uploadBlock = document.createElement('label');
                uploadBlock.setAttribute('for', 'custom-texture-upload');
                uploadBlock.className = 'palette-block';
                uploadBlock.style.display = 'flex';
                uploadBlock.style.justifyContent = 'center';
                uploadBlock.style.alignItems = 'center';
                uploadBlock.style.fontSize = '2rem';
                uploadBlock.style.color = '#888';
                uploadBlock.style.background = '#111';
                uploadBlock.style.cursor = 'pointer';
                uploadBlock.innerHTML = '+';
                uploadBlock.title = "Upload Custom Texture";
                paletteGrid.appendChild(uploadBlock);
            }
        }
    }

    document.getElementById('tool-player').onclick = (e) => {
        selectTool(-1, null);
        document.getElementById('tool-player').classList.add('selected');
    };

    document.getElementById('map-size').addEventListener('change', (e) => {
        resizeMap(parseInt(e.target.value));
    });
}

window.addCustomTextureToUI = function(id, name) {
    const paletteGrid = document.getElementById('palette-grid');
    const block = document.createElement('div');
    block.className = 'palette-block';
    
    // Render texture preview on a tiny canvas
    const canvas = document.createElement('canvas');
    canvas.width = 64; // TEX_WIDTH
    canvas.height = 64; // TEX_HEIGHT
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(64, 64);
    const tex = textures[id];
    
    const data32 = new Uint32Array(imgData.data.buffer);
    for(let j=0; j<tex.length; j++) {
        data32[j] = tex[j];
    }
    ctx.putImageData(imgData, 0, 0);
    
    block.style.backgroundImage = `url(${canvas.toDataURL()})`;
    block.onclick = () => selectTool(id, block);
    
    paletteGrid.appendChild(block);
    
    // Add to floor/ceiling dropdowns
    const floorSelect = document.getElementById('tex-floor-select');
    const ceilSelect = document.getElementById('tex-ceil-select');
    if (floorSelect) floorSelect.insertAdjacentHTML('beforeend', `<option value="${id}">${name}</option>`);
    if (ceilSelect) ceilSelect.insertAdjacentHTML('beforeend', `<option value="${id}">${name}</option>`);
};

function selectTool(toolId, element) {
    currentTool = toolId;
    document.querySelectorAll('.palette-block, .tool-btn').forEach(el => el.classList.remove('selected'));
    if (element) element.classList.add('selected');
}

// Save/Load
function saveMap() {
    const data = {
        grid: Array.from(mapGrid),
        entities: entities.map(e => ({x: e.x, y: e.y, type: e.type})), // Serialize base properties
        spawn: playerSpawn,
        floor: document.getElementById('color-floor').value,
        ceiling: document.getElementById('color-ceiling').value
    };
    localStorage.setItem('raycaster_map', JSON.stringify(data));
    alert('Map Saved!');
}

function loadMap() {
    const dataStr = localStorage.getItem('raycaster_map');
    if (!dataStr) {
        alert('No saved map found.');
        return;
    }
    const data = JSON.parse(dataStr);
    mapGrid = new Uint8Array(data.grid);
    entities = data.entities ? data.entities.map(e => new Entity(e.x, e.y, e.type)) : [];
    // Fallback for old save format
    if (data.sprites && !data.entities) {
        entities = data.sprites.map(s => new Entity(s.x, s.y, s.tex));
    }
    playerSpawn = data.spawn;
    if (data.floor) document.getElementById('color-floor').value = data.floor;
    if (data.ceiling) document.getElementById('color-ceiling').value = data.ceiling;
    drawMapEditor();
}

document.getElementById('btn-save').addEventListener('click', saveMap);
document.getElementById('btn-load').addEventListener('click', loadMap);
document.getElementById('btn-clear').addEventListener('click', () => {
    if (confirm('Clear entire map?')) {
        mapGrid.fill(0);
        entities = [];
        drawMapEditor();
    }
});
