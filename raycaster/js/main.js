// main.js
// Handles initialization, UI toggles, and the main game loop

let lastTime = 0;
let isPlaying = false;
let animationFrameId = null;

const btnEditor = document.getElementById('btn-editor');
const btnPlay = document.getElementById('btn-play');
const viewEditor = document.getElementById('view-editor');
const viewGame = document.getElementById('view-game');

// Initialization
function init() {
    initTextures(); // From textures.js
    updateDynamicTextures(0); // Populate dynamic textures for previews
    initMap();      // From map.js
    setupEditorUI();// From map.js
    updateFOV();    // From player.js
    drawMapEditor();
}

// UI Toggles
btnEditor.addEventListener('click', () => {
    if (!isPlaying) return;
    stopGame();
});

btnPlay.addEventListener('click', () => {
    if (isPlaying) return;
    startGame();
});

// Update FOV when range slider changes
document.getElementById('fov').addEventListener('input', () => {
    if (isPlaying) updateFOV();
});

// CRT Toggle
document.getElementById('crt-toggle').addEventListener('change', (e) => {
    document.getElementById('crt-overlay').style.display = e.target.checked ? 'block' : 'none';
});

function startGame() {
    isPlaying = true;
    btnPlay.classList.add('active');
    btnEditor.classList.remove('active');
    
    viewGame.classList.add('active');
    viewEditor.classList.remove('active');

    // Make sure FOV is up to date
    updateFOV();
    
    // Set player position and direction to spawn
    player.x = playerSpawn.x;
    player.y = playerSpawn.y;
    
    // Request pointer lock
    gameCanvas.requestPointerLock();

    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function stopGame() {
    isPlaying = false;
    btnEditor.classList.add('active');
    btnPlay.classList.remove('active');
    
    viewEditor.classList.add('active');
    viewGame.classList.remove('active');

    if (document.pointerLockElement === gameCanvas) {
        document.exitPointerLock();
    }

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    // Refresh the editor map in case something changed
    drawMapEditor();
}

// Exit game on ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPlaying) {
        stopGame();
    }
});

// Main Game Loop
function gameLoop(time) {
    if (!isPlaying) return;

    // Calculate delta time in seconds
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    // Cap dt to prevent massive jumps if tab is inactive
    const safeDt = Math.min(dt, 0.1);
    window.currentDt = safeDt;

    updatePlayer(safeDt);
    if (typeof updateEntities === 'function') {
        updateEntities(safeDt);
    }
    renderFrame();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Boot up
window.onload = init;
