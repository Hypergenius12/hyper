// player.js
// Handles movement, mouse look, and physics

const player = {
    x: 0,
    y: 0,
    dirX: 1,
    dirY: 0,
    planeX: 0,
    planeY: 0.66, // FOV multiplier (0.66 is roughly 66 degrees FOV)
    moveSpeed: 5.0,
    rotSpeed: 3.0,
    health: 100,
    maxHealth: 100,
    ammo: 50, // Shotgun shells
    maxAmmo: 100,
    bullets: 100, // Pistol ammo
    maxBullets: 200,
    currentWeapon: 2, // 1: Knife, 2: Pistol, 3: Shotgun
    state: 'alive'
};

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ' ': false
};

// Input handling
window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase() === ' ' ? ' ' : e.key.toLowerCase();
    if (keys.hasOwnProperty(k)) keys[k] = true;
});

window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase() === ' ' ? ' ' : e.key.toLowerCase();
    if (keys.hasOwnProperty(k)) keys[k] = false;
    
    // Interaction (Doors) on keyup
    if (k === ' ' && isPointerLocked && player.state === 'alive') {
        interact();
    }
    
    // Weapon switching
    if (isPointerLocked && player.state === 'alive') {
        if (k === '1') { player.currentWeapon = 1; initWeapon(); updateHUD(); } // Knife
        if (k === '2') { player.currentWeapon = 2; initWeapon(); updateHUD(); } // Pistol
        if (k === '3') { player.currentWeapon = 3; initWeapon(); updateHUD(); } // Shotgun
    }
});

// Pointer Lock for Mouse Look
let isPointerLocked = false;
const gameCanvas = document.getElementById('game-canvas');

gameCanvas.addEventListener('click', () => {
    if (!isPointerLocked) {
        gameCanvas.requestPointerLock();
    }
});

window.addEventListener('mousedown', (e) => {
    if (!isPointerLocked) return;
    if (player.state === 'dead') {
        resetGame();
        return;
    }
    // Left click to shoot
    if (e.button === 0 && !isShooting && typeof fireWeapon === 'function') {
        fireWeapon();
    }
});

document.addEventListener('pointerlockchange', () => {
    isPointerLocked = (document.pointerLockElement === gameCanvas);
});

document.addEventListener('mousemove', (e) => {
    if (!isPointerLocked || player.state === 'dead') return;
    
    // Mouse sensitivity (positive multiplier so moving right rotates right)
    const sensMultiplier = parseFloat(document.getElementById('mouse-sens').value) / 10;
    const rotSpeed = e.movementX * 0.003 * sensMultiplier; 
    
    // Rotate dir and plane
    const oldDirX = player.dirX;
    player.dirX = player.dirX * Math.cos(rotSpeed) - player.dirY * Math.sin(rotSpeed);
    player.dirY = oldDirX * Math.sin(rotSpeed) + player.dirY * Math.cos(rotSpeed);
    
    const oldPlaneX = player.planeX;
    player.planeX = player.planeX * Math.cos(rotSpeed) - player.planeY * Math.sin(rotSpeed);
    player.planeY = oldPlaneX * Math.sin(rotSpeed) + player.planeY * Math.cos(rotSpeed);
});

// Setup FOV
function updateFOV() {
    const fovDeg = parseFloat(document.getElementById('fov').value);
    // Plane magnitude determines FOV. Plane length = tan(FOV/2).
    const radians = (fovDeg / 2) * (Math.PI / 180);
    const planeLen = Math.tan(radians);
    
    // Re-scale plane while keeping it perpendicular to dir
    const crossX = -player.dirY;
    const crossY = player.dirX;
    
    player.planeX = crossX * planeLen;
    player.planeY = crossY * planeLen;
}

// Export isMoving for the weapon animation
let isPlayerMoving = false;

// Update player position
function updatePlayer(dt) {
    if (!isPointerLocked || player.state === 'dead') {
        isPlayerMoving = false;
        return; // Only move when focused and alive
    }

    // Base speed multiplied by UI setting
    const speedSetting = parseFloat(document.getElementById('move-speed').value);
    const moveStep = speedSetting * dt;
    let dx = 0;
    let dy = 0;
    isPlayerMoving = false;

    if (keys.w) {
        dx += player.dirX * moveStep;
        dy += player.dirY * moveStep;
        isPlayerMoving = true;
    }
    if (keys.s) {
        dx -= player.dirX * moveStep;
        dy -= player.dirY * moveStep;
        isPlayerMoving = true;
    }
    if (keys.d) {
        // Strafe right (perpendicular to dir)
        dx += player.planeX * moveStep;
        dy += player.planeY * moveStep;
        isPlayerMoving = true;
    }
    if (keys.a) {
        // Strafe left
        dx -= player.planeX * moveStep;
        dy -= player.planeY * moveStep;
        isPlayerMoving = true;
    }

    if (isPlayerMoving && typeof playWalkSFX === 'function') {
        playWalkSFX(dt);
    }

    // Collision detection (Slide along walls)
    const padding = parseFloat(document.getElementById('hitbox-radius').value); // Player hit radius
    
    // X-axis collision (Tile 0 is air)
    if (getTile(player.x + dx + (dx > 0 ? padding : -padding), player.y) === 0) {
        player.x += dx;
    }
    
    // Y-axis collision
    if (getTile(player.x, player.y + dy + (dy > 0 ? padding : -padding)) === 0) {
        player.y += dy;
    }
}

// Interacting with the world
function interact() {
    // Check block directly in front of player
    const interactDist = 1.0;
    const targetX = Math.floor(player.x + player.dirX * interactDist);
    const targetY = Math.floor(player.y + player.dirY * interactDist);
    
    const tile = getTile(targetX, targetY);
    // If it's a door (ID 6 is our designated door texture)
    if (tile === 6) {
        // Open door (set to air)
        setTile(targetX, targetY, 0);
        if (typeof playDoorSFX === 'function') playDoorSFX();
    }
}

function damagePlayer(amount) {
    if (player.state === 'dead') return;
    
    player.health -= amount;
    if (typeof playPlayerHurtSFX === 'function') playPlayerHurtSFX();
    
    // Red flash effect
    const gameCanvas = document.getElementById('game-canvas');
    gameCanvas.style.boxShadow = 'inset 0 0 100px red';
    setTimeout(() => {
        gameCanvas.style.boxShadow = 'none';
    }, 200);
    
    if (player.health <= 0) {
        player.health = 0;
        player.state = 'dead';
        console.log("Player Died!");
    }
    
    updateHUD();
}

function resetGame() {
    player.health = player.maxHealth;
    player.ammo = 50;
    player.state = 'alive';
    // Respawn to start
    player.x = playerSpawn.x;
    player.y = playerSpawn.y;
    updateHUD();
}

function updateHUD() {
    const healthEl = document.getElementById('hud-health');
    const ammoEl = document.getElementById('hud-ammo');
    const labelEl = document.querySelector('#hud-ammo').previousElementSibling; // The "AMMO" label
    
    if (healthEl) healthEl.innerText = player.health + '%';
    
    if (ammoEl && labelEl) {
        if (player.currentWeapon === 1) {
            ammoEl.innerText = 'INF';
            labelEl.innerText = 'KNIFE';
        } else if (player.currentWeapon === 2) {
            ammoEl.innerText = player.bullets;
            labelEl.innerText = 'BULLETS';
        } else {
            ammoEl.innerText = player.ammo;
            labelEl.innerText = 'SHELLS';
        }
    }
    
    // Draw Face
    const faceCanvas = document.getElementById('face-canvas');
    if (!faceCanvas) return;
    const ctx = faceCanvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    
    // Background
    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, 64, 64);
    
    // Face Base
    ctx.fillStyle = '#fcae91';
    ctx.fillRect(16, 16, 32, 32);
    
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(20, 24, 8, 8);
    ctx.fillRect(36, 24, 8, 8);
    
    // Pupils (Look left/right randomly over time or center)
    const lookX = (Math.floor(Date.now() / 1000) % 3) - 1; // -1, 0, 1
    ctx.fillStyle = '#000';
    ctx.fillRect(24 + lookX * 2, 26, 4, 4);
    ctx.fillRect(40 + lookX * 2, 26, 4, 4);
    
    // Mouth
    ctx.fillRect(26, 40, 12, 4);
    
    // Damage (Blood)
    if (player.health < 80) {
        ctx.fillStyle = '#a50f15';
        ctx.fillRect(16, 16, 8, 8); // Forehead cut
    }
    if (player.health < 50) {
        ctx.fillStyle = '#a50f15';
        ctx.fillRect(40, 32, 8, 8); // Cheek cut
        ctx.fillRect(24, 42, 4, 8); // Bloody lip
    }
    if (player.health < 25) {
        ctx.fillStyle = '#a50f15';
        ctx.fillRect(20, 24, 8, 8); // Black eye
        ctx.fillRect(16, 32, 8, 16); // Bloody face side
    }
    if (player.health <= 0) {
        // Dead face
        ctx.fillStyle = '#000';
        // X eyes
        ctx.fillRect(20, 24, 8, 8);
        ctx.fillRect(36, 24, 8, 8);
        ctx.fillStyle = '#a50f15';
        ctx.fillRect(26, 40, 12, 8); // Open mouth
    }
}
