// textures.js
// Procedurally generates basic 64x64 pixel textures for the raycaster

const TEX_WIDTH = 64;
const TEX_HEIGHT = 64;
const textures = [];

// Helper to generate a Uint32Array texture (ABGR format for fast canvas putImageData)
function createTexture() {
    return new Uint32Array(TEX_WIDTH * TEX_HEIGHT);
}

// Generate classic DOOM-style procedural textures
function initTextures() {
    // 0: Empty / Air (not used for walls)
    textures.push(createTexture());

    // 1: Red Brick
    const texBrick = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            let color = 0xFF222288; // Default dark red
            
            // Mortar lines
            if (y % 16 === 0 || y % 16 === 1) {
                color = 0xFF555555;
            } else if ((y < 16 || (y >= 32 && y < 48)) && (x % 32 === 0 || x % 32 === 1)) {
                color = 0xFF555555;
            } else if (((y >= 16 && y < 32) || y >= 48) && ((x + 16) % 32 === 0 || (x + 16) % 32 === 1)) {
                color = 0xFF555555;
            } else {
                // Noise
                let noise = Math.random() * 40 - 20;
                let r = Math.min(255, Math.max(0, 150 + noise));
                let g = Math.min(255, Math.max(0, 30 + noise));
                let b = Math.min(255, Math.max(0, 30 + noise));
                color = (255 << 24) | (b << 16) | (g << 8) | r;
            }
            texBrick[y * TEX_WIDTH + x] = color;
        }
    }
    textures.push(texBrick);

    // 2: Blue Metal
    const texMetal = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            let color = 0xFF884422; // Default blueish (ABGR)
            
            // Panels
            if (x % 32 === 0 || y % 32 === 0) {
                color = 0xFF552211; // Darker border
            } else if (x % 32 === 1 || y % 32 === 1) {
                color = 0xFFAA6644; // Highlight border
            } else {
                // Rivets
                if ((x % 32 === 4 || x % 32 === 28) && (y % 32 === 4 || y % 32 === 28)) {
                    color = 0xFF333333;
                } else {
                    let noise = Math.random() * 20;
                    let r = 20 + noise;
                    let g = 60 + noise;
                    let b = 150 + noise;
                    color = (255 << 24) | (b << 16) | (g << 8) | r;
                }
            }
            texMetal[y * TEX_WIDTH + x] = color;
        }
    }
    textures.push(texMetal);

    // 3: Wood
    const texWood = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            let noise = Math.sin(x * 0.1 + Math.sin(y * 0.05) * 5) * 20 + Math.random() * 10;
            let r = 100 + noise;
            let g = 60 + noise;
            let b = 30 + noise;
            
            // Planks
            if (x % 16 === 0) {
                r *= 0.5; g *= 0.5; b *= 0.5;
            }
            
            texWood[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
    }
    textures.push(texWood);

    // 4: Warning Stripes
    const texWarn = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            if ((x + y) % 32 < 16) {
                // Yellow
                texWarn[y * TEX_WIDTH + x] = 0xFF00DDFF; // ABGR -> Yellow
            } else {
                // Black
                texWarn[y * TEX_WIDTH + x] = 0xFF222222;
            }
        }
    }
    textures.push(texWarn);

    // 5: Tech Panel
    const texTech = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            let r = 40, g = 40, b = 40;
            if (x === 0 || y === 0 || x === TEX_WIDTH - 1 || y === TEX_HEIGHT - 1) {
                r = 80; g = 80; b = 80;
            } else if (Math.random() > 0.98) {
                // Blinking lights
                if (Math.random() > 0.5) {
                    r = 255; g = 50; b = 50;
                } else {
                    r = 50; g = 255; b = 50;
                }
            } else {
                let noise = Math.random() * 10;
                r += noise; g += noise; b += noise;
            }
            texTech[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
    }
    textures.push(texTech);
    // 6: Mossy Stone
    const texMoss = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            let r = 80, g = 80, b = 80; // Gray stone
            let noise = Math.random() * 40 - 20;
            r += noise; g += noise; b += noise;

            // Moss patches
            if (Math.sin(x * 0.2) * Math.cos(y * 0.2) > 0.2) {
                r = 30 + noise * 0.5;
                g = 100 + noise * 0.5;
                b = 20 + noise * 0.5;
            }

            // Stone cracks
            if (Math.sin(x * 0.5 + y * 0.5) > 0.8) {
                r *= 0.3; g *= 0.3; b *= 0.3;
            }

            texMoss[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
    }
    textures.push(texMoss);

    // 7: Sci-Fi Hex
    const texHex = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            // Hexagon pattern math approximation
            let cx = x % 16;
            let cy = y % 16;
            let color = 0xFF222222; // Dark gray
            
            if (cx + cy < 8 || cx - cy > 8 || cy - cx > 8 || cx + cy > 24) {
                color = 0xFF111111; // Border
            } else if (cx === 8 && cy === 8) {
                color = 0xFF00FFFF; // Neon center
            } else {
                color = 0xFF444444; // Inner hex
            }
            texHex[y * TEX_WIDTH + x] = color;
        }
    }
    textures.push(texHex);

    // 8: Flesh Wall
    const texFlesh = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            let noise = Math.sin(x * 0.3 + Math.cos(y * 0.2) * 5) * 30 + Math.random() * 20;
            let r = Math.min(255, 150 + noise);
            let g = Math.min(255, 50 + noise * 0.5);
            let b = Math.min(255, 50 + noise * 0.5);
            
            // Veins
            if (Math.sin(x * 0.1 - y * 0.4) > 0.9) {
                r = 80; g = 10; b = 10;
            }
            
            texFlesh[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
    }
    textures.push(texFlesh);

    // SPRITES (Transparent background is magenta: 0xFFFF00FF in ABGR)
    const MAGENTA = 0xFFFF00FF;

    // 9: Enemy Skull Sprite
    const texEnemy = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texEnemy[y * TEX_WIDTH + x] = MAGENTA;
            
            let cx = x - 32;
            let cy = y - 32;
            let distSq = cx * cx + cy * cy;
            
            // Skull base (circle)
            if (distSq < 400 && cy < 10) {
                texEnemy[y * TEX_WIDTH + x] = 0xFFEEEEEE;
                // Eyes (glowing red)
                if (cy > -5 && cy < 5 && (cx > -10 && cx < -2 || cx > 2 && cx < 10)) {
                    texEnemy[y * TEX_WIDTH + x] = 0xFF0000FF; // Red in ABGR
                }
            } 
            // Jaw
            else if (cy >= 10 && cy < 25 && cx > -12 && cx < 12) {
                texEnemy[y * TEX_WIDTH + x] = 0xFFCCCCCC;
                // Teeth lines
                if (cx % 4 === 0) texEnemy[y * TEX_WIDTH + x] = 0xFF222222;
            }
        }
    }
    textures.push(texEnemy);

    // 10: Barrel Sprite (Static)
    const texBarrel = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texBarrel[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32;
            if (cx >= -15 && cx <= 15 && y >= 20 && y <= 60) {
                let r = 20, g = 150, b = 20; 
                let shade = 1 - Math.abs(cx) / 15;
                r *= shade; g *= shade; b *= shade;
                if (y === 25 || y === 40 || y === 55) { r = 50; g = 50; b = 50; }
                if (y < 22 && Math.random() > 0.5) { r = 50; g = 255; b = 50; }
                texBarrel[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
            }
        }
    }
    textures.push(texBarrel);

    // 11: Floating Eye (Frame 1)
    const texEye1 = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texEye1[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32, cy = y - 32;
            let distSq = cx*cx + cy*cy;
            if (distSq < 200) {
                texEye1[y * TEX_WIDTH + x] = 0xFFEEEEEE; // White sclera
                if (distSq < 40) texEye1[y * TEX_WIDTH + x] = 0xFF00AA00; // Green iris
                if (distSq < 10) texEye1[y * TEX_WIDTH + x] = 0xFF000000; // Pupil
            }
        }
    }
    textures.push(texEye1);

    // 12: Slime (Frame 1)
    const texSlime1 = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texSlime1[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32, cy = y - 45;
            // Ellipse shape
            if ((cx*cx)/400 + (cy*cy)/150 < 1) {
                let r = 20, g = 50, b = 200; // Blue slime
                let noise = Math.random() * 40;
                texSlime1[y * TEX_WIDTH + x] = (255 << 24) | ((b+noise) << 16) | ((g+noise) << 8) | (r);
            }
        }
    }
    textures.push(texSlime1);

    // 13: Skull (Frame 2 - Mouth open)
    const texEnemy2 = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texEnemy2[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32, cy = y - 32;
            let distSq = cx * cx + cy * cy;
            if (distSq < 400 && cy < 10) {
                texEnemy2[y * TEX_WIDTH + x] = 0xFFEEEEEE;
                if (cy > -5 && cy < 5 && (cx > -10 && cx < -2 || cx > 2 && cx < 10)) {
                    texEnemy2[y * TEX_WIDTH + x] = 0xFF0000FF; 
                }
            } else if (cy >= 15 && cy < 30 && cx > -12 && cx < 12) { // Dropped jaw
                texEnemy2[y * TEX_WIDTH + x] = 0xFFCCCCCC;
                if (cx % 4 === 0) texEnemy2[y * TEX_WIDTH + x] = 0xFF222222;
            }
        }
    }
    textures.push(texEnemy2);

    // 14: Skull (Dead - Pile of bone)
    const texEnemyDead = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texEnemyDead[y * TEX_WIDTH + x] = MAGENTA;
            if (y > 50 && Math.abs(x - 32) < 20) {
                let noise = Math.random();
                texEnemyDead[y * TEX_WIDTH + x] = noise > 0.5 ? 0xFFEEEEEE : 0xFFCCCCCC;
            }
        }
    }
    textures.push(texEnemyDead);

    // 15: Eye (Frame 2 - Blink/Squint)
    const texEye2 = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texEye2[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32, cy = y - 32;
            let distSq = cx*cx + cy*cy;
            // Squished ellipse
            if ((cx*cx)/200 + (cy*cy)/50 < 1) {
                texEye2[y * TEX_WIDTH + x] = 0xFFEEEEEE;
                if (distSq < 20) texEye2[y * TEX_WIDTH + x] = 0xFF00AA00;
                if (distSq < 5) texEye2[y * TEX_WIDTH + x] = 0xFF000000;
            }
        }
    }
    textures.push(texEye2);

    // 16: Eye (Dead - Blood puddle)
    const texEyeDead = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texEyeDead[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32, cy = y - 55;
            if ((cx*cx)/300 + (cy*cy)/40 < 1) {
                texEyeDead[y * TEX_WIDTH + x] = 0xFF000088; // Dark red ABGR
            }
        }
    }
    textures.push(texEyeDead);

    // 17: Slime (Frame 2 - Squished)
    const texSlime2 = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texSlime2[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32, cy = y - 50;
            // Wider ellipse
            if ((cx*cx)/500 + (cy*cy)/100 < 1) {
                let r = 20, g = 50, b = 200; 
                let noise = Math.random() * 40;
                texSlime2[y * TEX_WIDTH + x] = (255 << 24) | ((b+noise) << 16) | ((g+noise) << 8) | (r);
            }
        }
    }
    textures.push(texSlime2);

    // 18: Slime (Dead - Splat)
    const texSlimeDead = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texSlimeDead[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32, cy = y - 58;
            if ((cx*cx)/600 + (cy*cy)/20 < 1) {
                let r = 10, g = 20, b = 150; 
                texSlimeDead[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | (r);
            }
        }
    }
    textures.push(texSlimeDead);

    // 19: Sliding Door (Grey metal with a yellow stripe)
    const texDoor = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            let r = 80, g = 80, b = 80;
            // Vertical panels
            if (x % 16 === 0 || x % 16 === 15) {
                r = 40; g = 40; b = 40;
            }
            // Horizontal yellow caution stripe in the middle
            if (y > 24 && y < 40) {
                if ((x + y) % 8 < 4) {
                    r = 200; g = 200; b = 0; // Yellow
                } else {
                    r = 20; g = 20; b = 20; // Black
                }
            }
            // Door frame
            if (x < 4 || x > TEX_WIDTH - 5 || y < 4 || y > TEX_HEIGHT - 5) {
                r = 60; g = 60; b = 60;
            }
            texDoor[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
    }
    textures.push(texDoor);

    // 20: Medkit (White box with red cross)
    const texMedkit = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texMedkit[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32, cy = y - 48; // Sits on the floor
            // Box shape
            if (cx > -16 && cx < 16 && cy > -16 && cy < 16) {
                let r = 240, g = 240, b = 240; // White box
                // Red Cross
                if ((cx > -4 && cx < 4 && cy > -10 && cy < 10) || 
                    (cx > -10 && cx < 10 && cy > -4 && cy < 4)) {
                    r = 220; g = 20; b = 20;
                }
                // Outline
                if (cx === -15 || cx === 15 || cy === -15 || cy === 15) {
                    r = 100; g = 100; b = 100;
                }
                texMedkit[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
            }
        }
    }
    textures.push(texMedkit);

    // 21: Ammo Box (Green box with gold shells)
    const texAmmo = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texAmmo[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32, cy = y - 48; // Sits on the floor
            // Box shape
            if (cx > -12 && cx < 12 && cy > -10 && cy < 16) {
                let r = 40, g = 100, b = 40; // Green box
                // Shells pattern
                if (cy > -5 && cy < 5 && cx % 4 === 0) {
                    r = 200; g = 180; b = 20; // Gold
                }
                // Outline
                if (cx === -11 || cx === 11 || cy === -9 || cy === 15) {
                    r = 20; g = 50; b = 20;
                }
                texAmmo[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
            }
        }
    }
    textures.push(texAmmo);

    // 22: Fireball Projectile
    const texFireball = createTexture();
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            texFireball[y * TEX_WIDTH + x] = MAGENTA;
            let cx = x - 32, cy = y - 32;
            let distSq = cx*cx + cy*cy;
            if (distSq < 60) { // Core (was 150)
                let r = 255, g = 200, b = 50; // Yellow/White
                texFireball[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
            } else if (distSq < 150) { // Halo (was 300)
                let r = 255, g = 100 + Math.random()*50, b = 0; // Orange/Red
                // Add some fiery noise trails upwards
                if (cy < 0 && Math.random() > 0.5) cy -= Math.random() * 10;
                distSq = cx*cx + cy*cy;
                if (distSq < 150) {
                    texFireball[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
                }
            }
        }
    }
    textures.push(texFireball);

    // 23: Waterfall
    const texWaterfall = createTexture();
    textures.push(texWaterfall); // Will be dynamically generated

    // 24: Lava Fall
    const texLava = createTexture();
    textures.push(texLava); // Will be dynamically generated

    // 25: Static Noise
    const texStatic = createTexture();
    textures.push(texStatic); // Will be dynamically generated

    // 26: Pulsing Flesh
    const texPulseFlesh = createTexture();
    textures.push(texPulseFlesh); // Will be dynamically generated
    
    // 27: Matrix Code Rain
    const texMatrix = createTexture();
    textures.push(texMatrix);

    // 28: Disco Floor
    const texDisco = createTexture();
    textures.push(texDisco);
    
    // 29: Psychedelic Warp
    const texWarp = createTexture();
    textures.push(texWarp);
    
    // 30: Conveyor Belt
    const texConveyor = createTexture();
    textures.push(texConveyor);

    initCustomTextureUpload();
}

// Custom Texture Upload Logic
function initCustomTextureUpload() {
    const fileInput = document.getElementById('custom-texture-upload');
    if (!fileInput) return;
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = TEX_WIDTH;
                canvas.height = TEX_HEIGHT;
                const ctx = canvas.getContext('2d', {willReadFrequently: true});
                ctx.drawImage(img, 0, 0, TEX_WIDTH, TEX_HEIGHT);
                
                const imgData = ctx.getImageData(0, 0, TEX_WIDTH, TEX_HEIGHT);
                const data32 = new Uint32Array(imgData.data.buffer);
                
                const newTex = createTexture();
                for (let i = 0; i < TEX_WIDTH * TEX_HEIGHT; i++) {
                    newTex[i] = data32[i];
                }
                const newId = textures.length;
                textures.push(newTex);
                
                if (window.addCustomTextureToUI) {
                    window.addCustomTextureToUI(newId, "Custom " + newId);
                }
                
                // Reset input so the same file can be selected again
                fileInput.value = '';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Dynamically update procedural textures based on time
function updateDynamicTextures(time) {
    if (textures.length < 6) return; // Not initialized
    
    // Tech Panel (Id 5) - Blinking lights
    const texTech = textures[5];
    for (let y = 0; y < TEX_HEIGHT; y++) {
        for (let x = 0; x < TEX_WIDTH; x++) {
            if (x > 0 && y > 0 && x < TEX_WIDTH - 1 && y < TEX_HEIGHT - 1) {
                let seed = x * 13 + y * 7;
                if (seed % 100 > 98) {
                    let r, g, b;
                    let blink = Math.sin(time * 0.005 + seed) > 0;
                    if (blink) { r = 255; g = 50; b = 50; } 
                    else { r = 50; g = 255; b = 50; }
                    texTech[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
                }
            }
        }
    }

    // 23: Waterfall
    if (textures[23]) {
        const texWater = textures[23];
        const offset = Math.floor(time * 0.05) % TEX_HEIGHT;
        for (let y = 0; y < TEX_HEIGHT; y++) {
            let actualY = (y - offset + TEX_HEIGHT) % TEX_HEIGHT;
            for (let x = 0; x < TEX_WIDTH; x++) {
                let noise = Math.sin(x * 0.8 + actualY * 0.2) * 20 + Math.random() * 20;
                let r = 20, g = 100 + noise, b = 200 + noise;
                if (x % 8 < 2) { r += 50; g += 50; b += 50; } // foam lines
                texWater[y * TEX_WIDTH + x] = (255 << 24) | (Math.min(255, b) << 16) | (Math.min(255, g) << 8) | Math.min(255, r);
            }
        }
    }

    // 24: Lava Fall
    if (textures[24]) {
        const texLava = textures[24];
        const offset = Math.floor(time * 0.02) % TEX_HEIGHT; // Slower than water
        for (let y = 0; y < TEX_HEIGHT; y++) {
            let actualY = (y - offset + TEX_HEIGHT) % TEX_HEIGHT;
            for (let x = 0; x < TEX_WIDTH; x++) {
                let noise = Math.sin(x * 0.5 + actualY * 0.1) * 30 + Math.random() * 40;
                let r = 200 + noise, g = 50 + noise * 0.5, b = 10;
                if (x % 12 < 3 && Math.sin(y*0.2 + time*0.001) > 0) { r = 255; g = 200; } // bright hot spots
                texLava[y * TEX_WIDTH + x] = (255 << 24) | (Math.min(255, b) << 16) | (Math.min(255, g) << 8) | Math.min(255, r);
            }
        }
    }

    // 25: Static Noise
    if (textures[25]) {
        const texStatic = textures[25];
        for (let y = 0; y < TEX_HEIGHT; y++) {
            for (let x = 0; x < TEX_WIDTH; x++) {
                let val = Math.random() > 0.5 ? 200 : 20;
                texStatic[y * TEX_WIDTH + x] = (255 << 24) | (val << 16) | (val << 8) | val;
            }
        }
    }

    // 26: Pulsing Flesh
    if (textures[26]) {
        const texPulseFlesh = textures[26];
        const pulse = Math.sin(time * 0.003) * 30; // -30 to 30
        for (let y = 0; y < TEX_HEIGHT; y++) {
            for (let x = 0; x < TEX_WIDTH; x++) {
                let noise = Math.sin(x * 0.3 + Math.cos(y * 0.2) * 5) * 30 + pulse;
                let r = Math.min(255, Math.max(0, 150 + noise));
                let g = Math.min(255, Math.max(0, 50 + noise * 0.5));
                let b = Math.min(255, Math.max(0, 50 + noise * 0.5));
                
                if (Math.sin(x * 0.1 - y * 0.4 + time * 0.002) > 0.9) { // pulsing veins
                    r = 120 + pulse; g = 10; b = 10;
                }
                texPulseFlesh[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
            }
        }
    }

    // 27: Matrix Code Rain
    if (textures[27]) {
        const texMatrix = textures[27];
        const offset = Math.floor(time * 0.05) % TEX_HEIGHT;
        for (let y = 0; y < TEX_HEIGHT; y++) {
            for (let x = 0; x < TEX_WIDTH; x++) {
                // Determine 'drop' pos per column
                let columnSeed = (x * 17) % TEX_HEIGHT;
                let actualY = (y + offset + columnSeed) % TEX_HEIGHT;
                
                let g = 0;
                if (actualY > TEX_HEIGHT - 10) {
                    // Bright head of the trail
                    g = 255 - (TEX_HEIGHT - actualY) * 15;
                    if (Math.random() > 0.5) g = 255; // Flickering characters
                } else if (actualY > TEX_HEIGHT - 40 && Math.random() > 0.8) {
                    // Fading trail
                    g = Math.floor((actualY / TEX_HEIGHT) * 100);
                }
                
                texMatrix[y * TEX_WIDTH + x] = (255 << 24) | (0 << 16) | (g << 8) | 0;
            }
        }
    }

    // 28: Disco Floor
    if (textures[28]) {
        const texDisco = textures[28];
        const beat = Math.floor(time * 0.003); // Changes every ~300ms
        for (let y = 0; y < TEX_HEIGHT; y++) {
            let gridY = Math.floor(y / 16);
            for (let x = 0; x < TEX_WIDTH; x++) {
                let gridX = Math.floor(x / 16);
                
                // Borders
                if (x % 16 === 0 || y % 16 === 0) {
                    texDisco[y * TEX_WIDTH + x] = 0xFF222222;
                    continue;
                }
                
                // Color based on grid pos + beat
                let seed = (gridX * 7 + gridY * 13 + beat * 17) % 3;
                let r=0, g=0, b=0;
                if (seed === 0) { r = 255; g = 50; b = 50; } // Red
                else if (seed === 1) { r = 50; g = 255; b = 50; } // Green
                else { r = 50; g = 50; b = 255; } // Blue
                
                // Inner glow
                if (x % 16 > 4 && x % 16 < 12 && y % 16 > 4 && y % 16 < 12) {
                    r = Math.min(255, r + 100);
                    g = Math.min(255, g + 100);
                    b = Math.min(255, b + 100);
                }

                texDisco[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
            }
        }
    }

    // 29: Psychedelic Warp
    if (textures[29]) {
        const texWarp = textures[29];
        let t = time * 0.002;
        for (let y = 0; y < TEX_HEIGHT; y++) {
            for (let x = 0; x < TEX_WIDTH; x++) {
                let v = Math.sin(x*0.1 + t) + Math.cos(y*0.1 + t) + Math.sin((x+y)*0.05 - t);
                v = (v + 3) / 6; // Normalize 0-1
                
                let r = Math.floor(Math.sin(v * Math.PI * 2) * 127 + 128);
                let g = Math.floor(Math.sin(v * Math.PI * 2 + 2) * 127 + 128);
                let b = Math.floor(Math.sin(v * Math.PI * 2 + 4) * 127 + 128);
                
                texWarp[y * TEX_WIDTH + x] = (255 << 24) | (b << 16) | (g << 8) | r;
            }
        }
    }

    // 30: Conveyor Belt
    if (textures[30]) {
        const texConveyor = textures[30];
        const offset = Math.floor(time * 0.04) % TEX_HEIGHT; // Moving horizontally
        for (let y = 0; y < TEX_HEIGHT; y++) {
            for (let x = 0; x < TEX_WIDTH; x++) {
                let actualX = (x + offset) % TEX_WIDTH;
                let color = 0xFF555555; // Base dark grey
                
                // Horizontal borders of the belt
                if (y < 4 || y > TEX_HEIGHT - 5) {
                    color = 0xFF333333; // Dark edges
                } else {
                    // Tread pattern
                    if (actualX % 16 < 4) {
                        color = 0xFF222222; // Groove
                    } else if (actualX % 16 === 4) {
                        color = 0xFF777777; // Highlight
                    }
                    // Warning stripe line in middle
                    if (y > 28 && y < 36) {
                        if ((actualX + y) % 16 < 8) color = 0xFF00DDFF; // Yellow (ABGR)
                        else color = 0xFF222222; // Black
                    }
                }
                texConveyor[y * TEX_WIDTH + x] = color;
            }
        }
    }
}

// Extract a color from texture (for the map editor palette)
function getTextureAvgColor(texId) {
    if (texId === 0 || texId >= textures.length) return '#000000';
    const tex = textures[texId];
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < tex.length; i++) {
        const color = tex[i];
        r += color & 0xFF;
        g += (color >> 8) & 0xFF;
        b += (color >> 16) & 0xFF;
    }
    r = Math.floor(r / tex.length);
    g = Math.floor(g / tex.length);
    b = Math.floor(b / tex.length);
    return `rgb(${r},${g},${b})`;
}
