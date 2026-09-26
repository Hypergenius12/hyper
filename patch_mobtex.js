const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

const mapInsert = `
const MC_MOB_MAP = {
    'COW': 'cow/cow',
    'PIG': 'pig/pig',
    'ZOMBIE': 'zombie/zombie',
    'SKELETON': 'skeleton/skeleton',
    'SHEEP': 'sheep/sheep',
    'SLIME': 'slime/slime',
    'SPIDER': 'spider/spider',
    'CHICKEN': 'chicken',
    'WOLF': 'wolf/wolf',
    'ENDERMAN': 'enderman/enderman',
    'COD': 'fish/cod',
    'TROPICAL_FISH': 'fish/tropical_a',
    'TURTLE': 'turtle/big_sea_turtle',
    'PIGLIN_BRUISER': 'piglin/piglin_brute'
};
`;

code = code.replace('export function generateMobTexture(mobType) {', mapInsert + '\nexport function generateMobTexture(mobType, onLoaded) {');

const fetchLogic = `
    const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
    if (useMC) {
        const mcName = MC_MOB_MAP[mobType];
        if (mcName) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
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
            };
            img.src = MINECRAFT_ASSETS_BASE + 'entity/' + mcName + '.png';
        }
    }
`;

code = code.replace(/export function generateMobTexture\(mobType(?:, onLoaded)?\) \{\s*const canvas = document.createElement\('canvas'\);\s*canvas\.width = 32;\s*canvas\.height = 32;\s*const ctx = canvas\.getContext\('2d'\);/, `export function generateMobTexture(mobType, onLoaded) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
${fetchLogic}`);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
