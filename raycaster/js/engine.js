// engine.js
// 2.5D Raycasting Engine using DDA

const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 400;
const gameCtx = gameCanvas.getContext('2d', { willReadFrequently: true });

// Offscreen buffer for fast pixel rendering
const imageData = gameCtx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
// 32-bit array view for fast ABGR pixel writing
const buffer = new Uint32Array(imageData.data.buffer);

// Convert hex color to ABGR Uint32 for fast buffer writes
function hexToABGR(hex) {
    // Expects #RRGGBB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    return (255 << 24) | (b << 16) | (g << 8) | r;
}

// Z-Buffer for 1D sprite occlusion
const ZBuffer = new Float64Array(SCREEN_WIDTH);

function renderFrame() {
    updateDynamicTextures(performance.now());
    
    const floorColorHex = document.getElementById('color-floor').value;
    const ceilColorHex = document.getElementById('color-ceiling').value;
    const maxDist = parseFloat(document.getElementById('render-dist').value);
    const fogIntensity = parseFloat(document.getElementById('fog-intensity').value);
    
    const useTexFloor = document.getElementById('use-tex-floor').checked;
    const useTexCeil = document.getElementById('use-tex-ceil').checked;
    const texFloorId = parseInt(document.getElementById('tex-floor-select').value) || 8;
    const texCeilId = parseInt(document.getElementById('tex-ceil-select').value) || 7;
    const ceilHeight = parseFloat(document.getElementById('ceil-height').value) || 1.0;
    
    const ceilColor = hexToABGR(ceilColorHex);
    const floorColor = hexToABGR(floorColorHex);

    // Floor and Ceiling Casting
    const texFloor = textures[texFloorId] || textures[1];
    const texCeil = textures[texCeilId] || textures[1];

    for (let y = SCREEN_HEIGHT / 2 + 1; y < SCREEN_HEIGHT; y++) {
        // rayDir for leftmost and rightmost rays
        const rayDirX0 = player.dirX - player.planeX;
        const rayDirY0 = player.dirY - player.planeY;
        const rayDirX1 = player.dirX + player.planeX;
        const rayDirY1 = player.dirY + player.planeY;

        // Current y position compared to the center of the screen
        const p = y - SCREEN_HEIGHT / 2;
        const posZ = 0.5 * SCREEN_HEIGHT * ceilHeight; // Vertical position of the camera (scaled by ceilHeight)
        const rowDistance = posZ / p; // Horizontal distance from the camera to the floor for the current row

        // Calculate the real world step vector we have to add for each x
        const floorStepX = rowDistance * (rayDirX1 - rayDirX0) / SCREEN_WIDTH;
        const floorStepY = rowDistance * (rayDirY1 - rayDirY0) / SCREEN_WIDTH;

        // Real world coordinates of the leftmost column
        let floorX = player.x + rowDistance * rayDirX0;
        let floorY = player.y + rowDistance * rayDirY0;

        // Calculate distance shading for floor/ceiling
        let distRatio = Math.max(0, 1.0 - (rowDistance / maxDist) * fogIntensity);
        let shadeMultiplier = distRatio * distRatio;

        for (let x = 0; x < SCREEN_WIDTH; x++) {
            // The cell coordinate is simply got from the integer parts of floorX and floorY
            const cellX = Math.floor(floorX);
            const cellY = Math.floor(floorY);

            // Get the texture coordinate from the fractional part
            const tx = Math.floor(TEX_WIDTH * (floorX - cellX)) & (TEX_WIDTH - 1);
            const ty = Math.floor(TEX_HEIGHT * (floorY - cellY)) & (TEX_HEIGHT - 1);

            floorX += floorStepX;
            floorY += floorStepY;

            // Texture pixel index
            const texIdx = ty * TEX_WIDTH + tx;
            
            // Floor
            let colorFloor = useTexFloor ? texFloor[texIdx] : floorColor;
            if (shadeMultiplier < 0.99) {
                let a = (colorFloor >> 24) & 0xFF;
                let b = Math.floor(((colorFloor >> 16) & 0xFF) * shadeMultiplier);
                let g = Math.floor(((colorFloor >> 8) & 0xFF) * shadeMultiplier);
                let r = Math.floor((colorFloor & 0xFF) * shadeMultiplier);
                colorFloor = (a << 24) | (b << 16) | (g << 8) | r;
            }
            buffer[y * SCREEN_WIDTH + x] = colorFloor;

            // Ceiling (symmetrical)
            let colorCeil = useTexCeil ? texCeil[texIdx] : ceilColor;
            if (shadeMultiplier < 0.99) {
                let a = (colorCeil >> 24) & 0xFF;
                let b = Math.floor(((colorCeil >> 16) & 0xFF) * shadeMultiplier);
                let g = Math.floor(((colorCeil >> 8) & 0xFF) * shadeMultiplier);
                let r = Math.floor((colorCeil & 0xFF) * shadeMultiplier);
                colorCeil = (a << 24) | (b << 16) | (g << 8) | r;
            }
            buffer[(SCREEN_HEIGHT - y - 1) * SCREEN_WIDTH + x] = colorCeil;
        }
    }

    // Raycasting Loop (Walls)
    for (let x = 0; x < SCREEN_WIDTH; x++) {
        const cameraX = 2 * x / SCREEN_WIDTH - 1; 
        const rayDirX = player.dirX + player.planeX * cameraX;
        const rayDirY = player.dirY + player.planeY * cameraX;

        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);

        let sideDistX;
        let sideDistY;

        const deltaDistX = (rayDirX === 0) ? 1e30 : Math.abs(1 / rayDirX);
        const deltaDistY = (rayDirY === 0) ? 1e30 : Math.abs(1 / rayDirY);

        let perpWallDist;

        let stepX;
        let stepY;

        let hit = 0; 
        let side;    

        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (player.x - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
        }
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (player.y - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
        }

        let distTraveled = 0;
        let hitType = 0;
        while (hit === 0 && distTraveled < maxDist) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
                distTraveled = sideDistX;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
                distTraveled = sideDistY;
            }
            
            if (mapX >= 0 && mapX < MAP_SIZE && mapY >= 0 && mapY < MAP_SIZE) {
                hitType = mapGrid[mapY * MAP_SIZE + mapX];
                if (hitType > 0) hit = 1;
            }
        }

        if (hit === 1) {
            if (side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
            else           perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;

            // Set ZBuffer for this column
            ZBuffer[x] = perpWallDist;

            const lineHeight = Math.floor(SCREEN_HEIGHT / perpWallDist);

            // Calculate start and end with ceilHeight modifier
            const heightOffset = Math.floor((ceilHeight - 1.0) * (SCREEN_HEIGHT / perpWallDist) * 0.5);
            
            let drawStart = -lineHeight / 2 + SCREEN_HEIGHT / 2 - heightOffset;
            let drawEnd = lineHeight / 2 + SCREEN_HEIGHT / 2 + heightOffset;

            let renderStart = Math.max(0, Math.floor(drawStart));
            let renderEnd = Math.min(SCREEN_HEIGHT - 1, Math.floor(drawEnd));

            const texNum = hitType; 
            const tex = textures[texNum] || textures[1];

            let wallX; 
            if (side === 0) wallX = player.y + perpWallDist * rayDirY;
            else           wallX = player.x + perpWallDist * rayDirX;
            wallX -= Math.floor(wallX);

            let texX = Math.floor(wallX * TEX_WIDTH);
            if (side === 0 && rayDirX > 0) texX = TEX_WIDTH - texX - 1;
            if (side === 1 && rayDirY < 0) texX = TEX_WIDTH - texX - 1;

            const step = TEX_HEIGHT / (lineHeight + heightOffset * 2);
            let texPos = (renderStart - SCREEN_HEIGHT / 2 + (lineHeight + heightOffset * 2) / 2) * step;

            let shadeMultiplier = side === 1 ? 0.7 : 1.0;
            // Smoother quadratic falloff for distance shading
            let distRatio = Math.max(0, 1.0 - (perpWallDist / maxDist) * fogIntensity);
            shadeMultiplier *= distRatio * distRatio;

            for (let y = renderStart; y < renderEnd; y++) {
                let texY = Math.floor(texPos) & (TEX_HEIGHT - 1);
                texPos += step;
                
                let color = tex[texY * TEX_WIDTH + texX];
                
                if (shadeMultiplier < 0.99) {
                    let a = (color >> 24) & 0xFF;
                    let b = Math.floor(((color >> 16) & 0xFF) * shadeMultiplier);
                    let g = Math.floor(((color >> 8) & 0xFF) * shadeMultiplier);
                    let r = Math.floor((color & 0xFF) * shadeMultiplier);
                    color = (a << 24) | (b << 16) | (g << 8) | r;
                }
                
                buffer[y * SCREEN_WIDTH + x] = color;
            }
        } else {
            ZBuffer[x] = maxDist; // No wall hit
        }
    }

    // Sprite/Entity Casting
    if (typeof entities !== 'undefined' && entities.length > 0) {
        // Create an array to sort entities based on distance
        let entityOrder = [];
        let entityDistance = [];
        
        for (let i = 0; i < entities.length; i++) {
            entityOrder[i] = i;
            // Euclidean distance squared
            entityDistance[i] = ((player.x - entities[i].x) * (player.x - entities[i].x) + 
                                 (player.y - entities[i].y) * (player.y - entities[i].y));
        }
        
        // Sort entities from farthest to closest (Painter's Algorithm)
        entityOrder.sort((a, b) => entityDistance[b] - entityDistance[a]);
        
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[entityOrder[i]];
            const texNum = entity.getTextureId();
            const tex = textures[texNum] || textures[9]; // default enemy
            
            // Translate entity position to relative to camera
            const spriteX = entity.x - player.x;
            const spriteY = entity.y - player.y;
            
            // Transform sprite with the inverse camera matrix
            // [ planeX   dirX ] -1                                       [ dirY      -dirX ]
            // [               ]       =  1/(planeX*dirY-dirX*planeY) *   [                 ]
            // [ planeY   dirY ]                                          [ -planeY  planeX ]
            const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
            
            const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
            const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY); // Depth inside camera view
            
            // Prevent division by zero or rendering stuff behind camera
            if (transformY <= 0) continue;
            
            // Screen X coordinate of the sprite center
            const spriteScreenX = Math.floor((SCREEN_WIDTH / 2) * (1 + transformX / transformY));
            
            // Calculate height of the sprite on screen
            // Using transformY (depth) to prevent fisheye effect
            const spriteHeight = Math.abs(Math.floor(SCREEN_HEIGHT / transformY));
            
            // Calculate lowest and highest pixel to fill
            let drawStartY = -spriteHeight / 2 + SCREEN_HEIGHT / 2;
            if (drawStartY < 0) drawStartY = 0;
            let drawEndY = spriteHeight / 2 + SCREEN_HEIGHT / 2;
            if (drawEndY >= SCREEN_HEIGHT) drawEndY = SCREEN_HEIGHT - 1;
            
            // Calculate width of the sprite
            const spriteWidth = Math.abs(Math.floor(SCREEN_HEIGHT / transformY));
            let drawStartX = -spriteWidth / 2 + spriteScreenX;
            if (drawStartX < 0) drawStartX = 0;
            let drawEndX = spriteWidth / 2 + spriteScreenX;
            if (drawEndX >= SCREEN_WIDTH) drawEndX = SCREEN_WIDTH - 1;
            
            // Draw sprite columns
            for (let stripe = Math.floor(drawStartX); stripe < drawEndX; stripe++) {
                const texX = Math.floor(256 * (stripe - (-spriteWidth / 2 + spriteScreenX)) * TEX_WIDTH / spriteWidth) / 256;
                
                // Conditions to draw:
                // 1) It's in front of camera plane
                // 2) It's on the screen (left)
                // 3) It's on the screen (right)
                // 4) ZBuffer, with perpendicular distance (transformY)
                if (transformY > 0 && stripe > 0 && stripe < SCREEN_WIDTH && transformY < ZBuffer[stripe]) {
                    
                    // Distance shading for sprites
                    let shadeMultiplier = Math.max(0, 1.0 - (transformY / maxDist) * fogIntensity);
                    shadeMultiplier *= shadeMultiplier; // quadratic falloff
                    
                    for (let y = Math.floor(drawStartY); y < drawEndY; y++) {
                        const d = (y) * 256 - SCREEN_HEIGHT * 128 + spriteHeight * 128; // 256 and 128 factors to avoid floats
                        const texY = ((d * TEX_HEIGHT) / spriteHeight) / 256;
                        
                        let color = tex[Math.floor(texY) * TEX_WIDTH + Math.floor(texX)];
                        
                        // Check for transparency (MAGENTA = 0xFFFF00FF in ABGR)
                        if (color !== 0xFFFF00FF) {
                            if (shadeMultiplier < 0.99) {
                                let a = (color >> 24) & 0xFF;
                                let b = Math.floor(((color >> 16) & 0xFF) * shadeMultiplier);
                                let g = Math.floor(((color >> 8) & 0xFF) * shadeMultiplier);
                                let r = Math.floor((color & 0xFF) * shadeMultiplier);
                                color = (a << 24) | (b << 16) | (g << 8) | r;
                            }
                            buffer[y * SCREEN_WIDTH + stripe] = color;
                        }
                    }
                }
            }
        }
    }

    // Write buffer to canvas
    gameCtx.putImageData(imageData, 0, 0);

    // Draw Weapon Overlay
    if (typeof drawWeapon === 'function') {
        drawWeapon(gameCtx, SCREEN_WIDTH, SCREEN_HEIGHT, window.currentDt || 0.016, isPlayerMoving);
    }
}

// Shooting Mechanics
function fireWeapon() {
    let range = 20; // Default max range
    let damage = 1;
    let spreadHitDetection = 3.5; // Lower is wider

    if (player.currentWeapon === 1) { // KNIFE
        range = 1.5;
        if (typeof playKnifeSFX === 'function') playKnifeSFX();
    } else if (player.currentWeapon === 2) { // PISTOL
        if (player.bullets <= 0) {
            if (typeof playEmptyClickSFX === 'function') playEmptyClickSFX();
            return;
        }
        player.bullets--;
        spreadHitDetection = 4.0; // Accurate
        if (typeof playPistolSFX === 'function') playPistolSFX();
    } else { // SHOTGUN
        if (player.ammo <= 0) {
            if (typeof playEmptyClickSFX === 'function') playEmptyClickSFX();
            return;
        }
        player.ammo--;
        damage = 3; // High damage
        spreadHitDetection = 2.0; // Wide spread
        if (typeof playShootSFX === 'function') playShootSFX();
    }

    isShooting = true;
    shootAnimTimer = 0;
    if (typeof updateHUD === 'function') updateHUD();
    
    let hitEntityIndex = -1;
    let minHitDist = Math.min(parseFloat(document.getElementById('render-dist').value), range);
    
    const centerDist = ZBuffer[Math.floor(SCREEN_WIDTH / 2)];
    if (centerDist && centerDist < minHitDist) minHitDist = centerDist;
    
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        if (entity.state === 'dead' || entity.isItem) continue; // Don't shoot dead bodies or items
        
        const spriteX = entity.x - player.x;
        const spriteY = entity.y - player.y;
        
        const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
        const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);
        
        if (transformY > 0) {
            const spriteScreenX = Math.floor((SCREEN_WIDTH / 2) * (1 + transformX / transformY));
            const spriteWidth = Math.abs(Math.floor(SCREEN_HEIGHT / transformY));
            
            if (Math.abs(spriteScreenX - SCREEN_WIDTH / 2) < spriteWidth / spreadHitDetection) {
                if (transformY < minHitDist) {
                    minHitDist = transformY;
                    hitEntityIndex = i;
                }
            }
        }
    }
    
    if (hitEntityIndex !== -1) {
        // Hit!
        if (typeof playHitSFX === 'function') playHitSFX();
        // Deal damage
        entities[hitEntityIndex].damage(damage);
    }
}
