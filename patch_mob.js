const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

// Remove MC_MOB_MAP so it doesn't trigger the cursed mob textures
code = code.replace(/const MC_MOB_MAP = \{[\s\S]*?\};\n\n/, '');

// Inside generateMobTexture, remove useMC logic
const oldMobLogic = `    const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
    if (useMC) {
        const mcName = MC_MOB_MAP[mobType];
        if (mcName) {
            loadMinecraftTexture(mcName).then(img => {
                if (img) {
                    ctx.clearRect(0, 0, 32, 32);
                    
                    // Draw a portion of the texture (usually the body) as the background skin
                    ctx.drawImage(img, 16, 16, 16, 16, 0, 0, 32, 32);
                    
                    // Draw the face in the middle
                    let fx = 8, fy = 8, fw = 8, fh = 8;
                    if (mobType === 'SPIDER') { fx = 32; fy = 8; }
                    else if (mobType === 'ENDERMAN') { fx = 8; fy = 8; }
                    else if (mobType === 'CHICKEN') { fx = 0; fy = 0; }
                    
                    ctx.drawImage(img, fx, fy, fw, fh, 6, 6, 20, 20);
                    
                    if (onLoaded) onLoaded(canvas);
                }
            });
        }
    }`;

code = code.replace(oldMobLogic, `    // MC textures for mobs removed due to cursed BoxGeometry mapping`);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
