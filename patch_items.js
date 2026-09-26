const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

const mapInsert = `
const MC_ITEM_MAP = {
    'iron_ingot': 'iron_ingot',
    'gold_ingot': 'gold_ingot',
    'diamond': 'diamond',
    'coal': 'coal',
    'mana_crystal': 'lapis_lazuli',
    'boss': 'nether_star',
    'stick': 'stick',
    'wand_basic': 'stick',
    'wand_fire': 'blaze_rod',
    'wand_ice': 'prismarine_shard',
    'wood': 'oak_log',
    'stone': 'cobblestone',
    'apple': 'apple',
    'bread': 'bread',
    'cooked_beef': 'cooked_beef'
};
`;

code = code.replace('export function generateItemTexture(itemType, itemSubtype) {', mapInsert + '\nexport function generateItemTexture(itemType, itemSubtype, onLoaded) {');

const fetchLogic = `
    const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
    if (useMC) {
        const mcName = MC_ITEM_MAP[itemSubtype];
        if (mcName) {
            loadMinecraftTexture(mcName).then(img => {
                if (img) {
                    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                    ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                    if (onLoaded) onLoaded(canvas);
                }
            });
        }
    }
`;

code = code.replace('    // Clear transparent\n    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);', '    // Clear transparent\n    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);\n' + fetchLogic);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
