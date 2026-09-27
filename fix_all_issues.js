const fs = require('fs');

// ==========================================
// 1. textures.js: Real Aether textures
// ==========================================
let tex = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

// Update loadMinecraftTexture to handle both natural and classic_base for aether
tex = tex.replace(
    /if \(name\.startsWith\('aether:\/\/'\)\) \{\s*img\.src = AETHER_ASSETS_BASE \+ name\.slice\(9\) \+ '\.png';\s*\}/,
    `if (name.startsWith('aether://')) {
            const rawName = name.slice(9);
            if (rawName === 'aether_dirt') {
                img.src = 'https://raw.githubusercontent.com/The-Aether-Team/The-Aether/1.21.1-develop/src/main/resources/packs/classic_base/assets/aether/textures/block/natural/aether_dirt.png';
            } else {
                img.src = AETHER_ASSETS_BASE + rawName + '.png';
            }
        }`
);

// Update Aether mappings in MC_TEXTURE_MAP
tex = tex.replace(
    /\[BLOCKS\.AETHER_STONE\]:\s*'end_stone',\s*\[BLOCKS\.AETHER_DIRT\]:\s*'end_stone_bricks',\s*\[BLOCKS\.AETHER_GRASS\]:\s*\{ top: 'aether:\/\/aether_grass_block_top', side: 'aether:\/\/aether_grass_block_side', bottom: 'aether:\/\/aether_grass_block_top' \},\s*\[BLOCKS\.AETHER_WOOD\]:\s*\{ top: 'quartz_pillar_top', side: 'quartz_pillar', bottom: 'quartz_pillar_top' \},\s*\[BLOCKS\.AETHER_LEAVES\]:\s*'aether:\/\/golden_oak_leaves',\s*\[BLOCKS\.AETHER_PORTAL\]:\s*'entity\/end_gateway_beam',\s*\[BLOCKS\.AETHER_CLOUD\]:\s*'white_wool',\s*\[BLOCKS\.AETHER_TALL_GRASS\]:\s*'aether:\/\/skyroot_leaves',\s*\[BLOCKS\.AETHER_FLOWER\]:\s*'aether:\/\/white_flower',\s*\[BLOCKS\.AETHER_CRYSTAL\]:\s*'sea_lantern',/,
    `[BLOCKS.AETHER_STONE]: 'aether://holystone',
    [BLOCKS.AETHER_DIRT]: 'aether://aether_dirt',
    [BLOCKS.AETHER_GRASS]: { top: 'aether://aether_grass_block_top', side: 'aether://aether_grass_block_side', bottom: 'aether://aether_dirt' },
    [BLOCKS.AETHER_WOOD]: { top: 'aether://skyroot_log_top', side: 'aether://skyroot_log', bottom: 'aether://skyroot_log_top' },
    [BLOCKS.AETHER_LEAVES]: 'aether://golden_oak_leaves',
    [BLOCKS.AETHER_PORTAL]: 'entity/end_gateway_beam',
    [BLOCKS.AETHER_CLOUD]: 'white_wool',
    [BLOCKS.AETHER_TALL_GRASS]: 'aether://skyroot_leaves',
    [BLOCKS.AETHER_FLOWER]: 'aether://white_flower',
    [BLOCKS.AETHER_CRYSTAL]: 'sea_lantern',`
);

tex = tex.replace(
    /\[BLOCKS\.QUICKSOIL\]:\s*'sand',\s*\[BLOCKS\.HOLYSTONE\]:\s*'end_stone_bricks',\s*\[BLOCKS\.ENCHANTED_AETHER_LOG\]:\s*\{ top: 'purpur_pillar_top', side: 'purpur_pillar', bottom: 'purpur_pillar_top' \},\s*\[BLOCKS\.ENCHANTED_AETHER_LEAVES\]:\s*'purple_stained_glass'/,
    `[BLOCKS.QUICKSOIL]: 'aether://quicksoil',
    [BLOCKS.HOLYSTONE]: 'aether://holystone',
    [BLOCKS.ENCHANTED_AETHER_LOG]: { top: 'aether://golden_oak_log', side: 'aether://golden_oak_log', bottom: 'aether://golden_oak_log' },
    [BLOCKS.ENCHANTED_AETHER_LEAVES]: 'aether://crystal_leaves'`
);

// Remove biome tint for AETHER_LEAVES if present so leaves keep their true mod textures
tex = tex.replace(/else if \(bt === BLOCKS\.AETHER_LEAVES\) tint = '#b3ffb3';\s*/, '');

fs.writeFileSync('slopcraft 3D/js/textures.js', tex);

// ==========================================
// 2. engine.js: Key handling, typing in inputs, C key un-toggle
// ==========================================
let eng = fs.readFileSync('slopcraft 3D/js/engine.js', 'utf8');

// A: If typing in input/textarea, ignore all game shortcuts!
eng = eng.replace(
    /onKeyDown\(e\) \{/,
    `onKeyDown(e) {
        // If the user is typing in an input field (like creative search), ignore game hotkeys!
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
            if (e.code === 'Escape') {
                document.activeElement.blur();
            }
            return;
        }`
);

// B: Handle 'KeyC' properly so pressing C toggles and un-toggles every single press
eng = eng.replace(
    /if \(e\.key\.toLowerCase\(\) === 'c' && !this\._menuKeysDown\.creative\) \{[\s\S]*?\}\s*}/,
    `if ((e.code === 'KeyC' || e.key.toLowerCase() === 'c') && !this._menuKeysDown.creative) {
            this._menuKeysDown.creative = true;
            this.creativeMode = !this.creativeMode;
            this._creativeFlying = false;
            const toast = document.getElementById('creative-toast');
            if (toast) {
                toast.textContent = this.creativeMode ? '✦ Creative Mode ON' : '✦ Creative Mode OFF';
                toast.classList.remove('hidden');
                clearTimeout(this._toastTimer);
                this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 2000);
            }
        }`
);

// In onKeyUp: clear _menuKeysDown.creative on KeyC release
eng = eng.replace(
    /case 'KeyU': this\._menuKeysDown\.devMode = false; break;/,
    `case 'KeyU': this._menuKeysDown.devMode = false; break;
            case 'KeyC': this._menuKeysDown.creative = false; break;`
);

fs.writeFileSync('slopcraft 3D/js/engine.js', eng);

console.log('Patch complete!');
