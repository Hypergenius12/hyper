const fs = require('fs');

// ─── 1. textures.js: add global item texture cache + fix chest texture ───
let tex = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

// Add a module-level texture cache right above generateItemTexture
tex = tex.replace(
    /export function generateItemTexture\(itemType, itemSubtype, onLoaded\) \{/,
    `// Global cache: subtype -> data URL (populated once MC texture loads)
const _itemTextureCache = new Map();

export function generateItemTexture(itemType, itemSubtype, onLoaded) {
    // If already cached, return immediately and fire callback synchronously
    if (_itemTextureCache.has(itemSubtype)) {
        const cached = _itemTextureCache.get(itemSubtype);
        const canvas = document.createElement('canvas');
        canvas.width = 16; canvas.height = 16;
        const img = new Image();
        img.onload = () => {
            canvas.getContext('2d').drawImage(img, 0, 0);
            if (onLoaded) onLoaded(canvas);
        };
        img.src = cached;
        // Still return the procedural version synchronously as placeholder
    }`
);

// After the MC texture loads successfully, store it in the cache
tex = tex.replace(
    /                if \(img\) \{\n                    ctx\.clearRect\(0, 0, TEX_SIZE, TEX_SIZE\);\n                    ctx\.drawImage\(img, 0, 0, TEX_SIZE, TEX_SIZE\);\n                    if \(onLoaded\) onLoaded\(canvas\);\n                \}/,
    `                if (img) {
                    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                    ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                    _itemTextureCache.set(itemSubtype, canvas.toDataURL());
                    if (onLoaded) onLoaded(canvas);
                }`
);

// Fix chest procedural texture to look like a real Minecraft chest
tex = tex.replace(
    /        case BLOCKS\.CHEST_BLOCK:\n            if \(face === 'top'\) \{[\s\S]*?            \}\n            break;\n        case BLOCKS\.LADDER:/,
    `        case BLOCKS.CHEST_BLOCK: {
            // Warm oak plank base
            fillBase(ctx, 168, 114, 58);
            // Draw planks as vertical grain lines
            ctx.fillStyle = 'rgba(100,60,20,0.25)';
            for (let px = 3; px < 16; px += 4) ctx.fillRect(px, 0, 1, 16);
            // Trim border
            ctx.fillStyle = 'rgba(60,35,8,0.9)';
            ctx.fillRect(0, 0, 16, 1);
            ctx.fillRect(0, 15, 16, 1);
            ctx.fillRect(0, 0, 1, 16);
            ctx.fillRect(15, 0, 1, 16);
            if (face === 'top') {
                // Iron cross-bands
                ctx.fillStyle = 'rgba(55,45,35,0.85)';
                ctx.fillRect(0, 7, 16, 2);
                ctx.fillRect(7, 0, 2, 16);
                // Central iron buckle
                ctx.fillStyle = '#aaa';
                ctx.fillRect(7, 7, 2, 2);
                ctx.fillStyle = '#ccc';
                ctx.fillRect(7, 7, 1, 1);
            } else if (face === 'front') {
                // Lid split line
                ctx.fillStyle = 'rgba(55,35,8,0.9)';
                ctx.fillRect(1, 8, 14, 1);
                // Iron corner studs (top-left, top-right of lid)
                ctx.fillStyle = '#888';
                ctx.fillRect(1, 1, 2, 2);
                ctx.fillRect(13, 1, 2, 2);
                // Iron latch background
                ctx.fillStyle = '#777';
                ctx.fillRect(6, 7, 4, 4);
                // Latch face
                ctx.fillStyle = '#bbb';
                ctx.fillRect(7, 8, 2, 2);
                ctx.fillStyle = '#999';
                ctx.fillRect(7, 9, 2, 1);
                // Keyhole dot
                ctx.fillStyle = '#333';
                ctx.fillRect(7, 9, 1, 1);
            } else if (face === 'bottom') {
                ctx.fillStyle = 'rgba(55,35,8,0.7)';
                ctx.fillRect(0, 7, 16, 1);
                ctx.fillRect(7, 0, 1, 16);
                ctx.fillStyle = '#888';
                ctx.fillRect(7, 7, 1, 1);
            } else {
                // Side: horizontal lid band only
                ctx.fillStyle = 'rgba(55,35,8,0.85)';
                ctx.fillRect(1, 8, 14, 1);
                ctx.fillStyle = '#888';
                ctx.fillRect(1, 1, 2, 2);
                ctx.fillRect(13, 1, 2, 2);
            }
            break;
        }
        case BLOCKS.LADDER:`
);

fs.writeFileSync('slopcraft 3D/js/textures.js', tex);

// ─── 2. systems.js: use cached texture for drag icon, add image-rendering to all icons ───
let sys = fs.readFileSync('slopcraft 3D/js/systems.js', 'utf8');

// Make all item-icon images pixelated 
sys = sys.replace(
    /inner = `<img src="\$\{dataURL\}" class="item-icon" draggable="false" \/>`/,
    'inner = `<img src="${dataURL}" class="item-icon" draggable="false" style="image-rendering:pixelated;width:100%;height:100%;" />`'
);

fs.writeFileSync('slopcraft 3D/js/systems.js', sys);

// ─── 3. CSS: make drag icon also pixelated ───
let css = fs.readFileSync('slopcraft 3D/css/geometric.css', 'utf8');
css = css.replace(
    /#drag-item-icon \{/,
    '#drag-item-icon {\n    image-rendering: pixelated;'
);
fs.writeFileSync('slopcraft 3D/css/geometric.css', css);

console.log("Done");
