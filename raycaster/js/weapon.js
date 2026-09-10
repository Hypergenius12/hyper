// weapon.js
// Procedurally generates and animates the player's weapon (Shotgun)

const weaponCanvas = document.createElement('canvas');
weaponCanvas.width = 128;
weaponCanvas.height = 128;
const weaponCtx = weaponCanvas.getContext('2d');

let weaponBobTimer = 0;
let isShooting = false;
let shootAnimTimer = 0;

function initWeapon() {
    weaponCtx.clearRect(0, 0, 128, 128);
    
    if (typeof player === 'undefined' || player.currentWeapon === 3) {
        // --- 3: SHOTGUN ---
        // FPS Perspective Double-Barrel Shotgun - Held on the RIGHT side
        // Pointing diagonally from bottom-right towards the center crosshair
        
        // Left Barrel
        weaponCtx.fillStyle = '#333';
        weaponCtx.beginPath();
        weaponCtx.moveTo(48, 50); // Tip top-left
        weaponCtx.lineTo(58, 48); // Tip top-right
        weaponCtx.lineTo(100, 128); // Base right
        weaponCtx.lineTo(75, 128); // Base left
        weaponCtx.fill();
        
        // Right Barrel
        weaponCtx.fillStyle = '#333';
        weaponCtx.beginPath();
        weaponCtx.moveTo(60, 48); // Tip top-left
        weaponCtx.lineTo(70, 46); // Tip top-right
        weaponCtx.lineTo(120, 128); // Base right
        weaponCtx.lineTo(105, 128); // Base left
        weaponCtx.fill();
        
        // Barrel Highlights (Top edges)
        weaponCtx.fillStyle = '#666';
        weaponCtx.beginPath();
        weaponCtx.moveTo(50, 50);
        weaponCtx.lineTo(54, 48);
        weaponCtx.lineTo(85, 128);
        weaponCtx.lineTo(75, 128);
        weaponCtx.fill();

        weaponCtx.beginPath();
        weaponCtx.moveTo(62, 48);
        weaponCtx.lineTo(66, 46);
        weaponCtx.lineTo(110, 128);
        weaponCtx.lineTo(105, 128);
        weaponCtx.fill();

        // Muzzle ends (dark holes)
        weaponCtx.fillStyle = '#050505';
        weaponCtx.beginPath();
        weaponCtx.ellipse(53, 50, 5, 2, Math.PI / 4, 0, 2 * Math.PI);
        weaponCtx.fill();
        weaponCtx.beginPath();
        weaponCtx.ellipse(65, 48, 5, 2, Math.PI / 4, 0, 2 * Math.PI);
        weaponCtx.fill();
        
        // Central gap shadow
        weaponCtx.fillStyle = '#111';
        weaponCtx.beginPath();
        weaponCtx.moveTo(58, 48);
        weaponCtx.lineTo(60, 48);
        weaponCtx.lineTo(105, 128);
        weaponCtx.lineTo(100, 128);
        weaponCtx.fill();

        // Iron sight bead
        weaponCtx.fillStyle = '#888';
        weaponCtx.fillRect(58, 45, 2, 2);
        
        // Hand gripping underneath
        weaponCtx.fillStyle = '#4a6b33'; // Green glove
        weaponCtx.beginPath();
        weaponCtx.moveTo(70, 100);
        weaponCtx.lineTo(128, 90);
        weaponCtx.lineTo(128, 128);
        weaponCtx.lineTo(80, 128);
        weaponCtx.fill();

        // Knuckle lines
        weaponCtx.fillStyle = '#2d441d';
        weaponCtx.beginPath();
        weaponCtx.moveTo(85, 98);
        weaponCtx.lineTo(100, 128);
        weaponCtx.stroke();
        weaponCtx.beginPath();
        weaponCtx.moveTo(105, 95);
        weaponCtx.lineTo(115, 128);
        weaponCtx.stroke();

    } else if (player.currentWeapon === 1) {
        // --- 1: KNIFE ---
        // Blade
        weaponCtx.fillStyle = '#aaa';
        weaponCtx.beginPath();
        weaponCtx.moveTo(60, 30); // Tip
        weaponCtx.lineTo(65, 40);
        weaponCtx.lineTo(65, 100);
        weaponCtx.lineTo(55, 100);
        weaponCtx.lineTo(55, 40);
        weaponCtx.fill();
        
        // Blood on tip
        weaponCtx.fillStyle = '#800';
        weaponCtx.beginPath();
        weaponCtx.moveTo(60, 30);
        weaponCtx.lineTo(62, 38);
        weaponCtx.lineTo(58, 38);
        weaponCtx.fill();

        // Crossguard
        weaponCtx.fillStyle = '#333';
        weaponCtx.fillRect(45, 100, 30, 8);
        
        // Handle (Held in middle)
        weaponCtx.fillStyle = '#4a6b33'; // Green glove
        weaponCtx.beginPath();
        weaponCtx.moveTo(40, 108);
        weaponCtx.lineTo(80, 108);
        weaponCtx.lineTo(75, 128);
        weaponCtx.lineTo(45, 128);
        weaponCtx.fill();

    } else if (player.currentWeapon === 2) {
        // --- 2: PISTOL ---
        // Barrel
        weaponCtx.fillStyle = '#444';
        weaponCtx.fillRect(56, 60, 16, 68);
        
        // Slide highlight
        weaponCtx.fillStyle = '#777';
        weaponCtx.fillRect(58, 60, 4, 68);
        
        // Muzzle
        weaponCtx.fillStyle = '#111';
        weaponCtx.fillRect(60, 60, 8, 4);
        
        // Front Sight
        weaponCtx.fillStyle = '#222';
        weaponCtx.fillRect(62, 57, 4, 3);
        
        // Hands gripping
        weaponCtx.fillStyle = '#4a6b33'; // Green glove
        weaponCtx.beginPath();
        weaponCtx.moveTo(45, 110);
        weaponCtx.lineTo(83, 110);
        weaponCtx.lineTo(80, 128);
        weaponCtx.lineTo(48, 128);
        weaponCtx.fill();
    }
}

// Ensure it's drawn at startup
initWeapon();

function drawWeapon(ctx, screenWidth, screenHeight, dt, isMoving) {
    let bobOffset = 0;
    
    // Bobbing animation when walking
    if (isMoving && !isShooting) {
        weaponBobTimer += dt * 10; // Bobbing speed
        // Sine wave for vertical bob, absolute sine for bounce
        bobOffset = Math.sin(weaponBobTimer) * 15;
    } else {
        // Return to center smoothly
        weaponBobTimer = 0;
    }

    let recoilY = 0;
    let recoilX = 0; // Recoil should kick back and slightly right
    let scaleMultiplier = 1.0;
    
    // Shooting animation
    if (isShooting) {
        shootAnimTimer += dt;
        
        // Muzzle flash at the tip of the gun (offset from center)
        if (shootAnimTimer < 0.1) {
            const flashX = (screenWidth / 2) + (screenWidth * 0.1); 
            const flashY = screenHeight - 250 - bobOffset;
            
            ctx.fillStyle = 'rgba(255, 150, 0, 0.9)';
            ctx.beginPath();
            ctx.arc(flashX, flashY, 80 + Math.random() * 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(flashX, flashY, 40 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Recoil pull back (down and right)
        if (shootAnimTimer < 0.1) {
            // Kick down/right quickly
            recoilY = (shootAnimTimer / 0.1) * 80;
            recoilX = (shootAnimTimer / 0.1) * 40;
        } else if (shootAnimTimer < 0.5) {
            // Settle down slowly
            recoilY = 80 - ((shootAnimTimer - 0.1) / 0.4) * 80;
            recoilX = 40 - ((shootAnimTimer - 0.1) / 0.4) * 40;
        } else {
            isShooting = false; // Animation done
            shootAnimTimer = 0;
        }
    }

    // Draw the weapon on the main canvas
    // It's scaled down and anchored to the right side
    const weaponWidth = Math.floor(screenWidth * 0.6); // Take up 60% of screen width
    const weaponHeight = weaponWidth; // Maintain 1:1 aspect ratio of the 128x128 canvas
    
    // Anchor to the bottom right
    const drawX = screenWidth - (weaponWidth * 0.8) + recoilX; 
    const drawY = screenHeight - (weaponHeight * 0.9) + bobOffset + recoilY;

    // We can use image smoothing false to keep it pixelated
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(weaponCanvas, drawX, drawY, weaponWidth, weaponHeight);
}
