const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

const generateItemTextureRegex = /    const useMC = localStorage\.getItem\('slopcraft_mc_textures'\) === 'true';\n    if \(useMC\) \{\n        const mcName = MC_ITEM_MAP\[itemSubtype\];\n        if \(mcName\) \{\n            loadMinecraftTexture\(mcName\)\.then\(img => \{\n                if \(img\) \{\n                    ctx\.clearRect\(0, 0, TEX_SIZE, TEX_SIZE\);\n                    ctx\.drawImage\(img, 0, 0, TEX_SIZE, TEX_SIZE\);\n                    if \(onLoaded\) onLoaded\(canvas\);\n                \}\n            \}\);\n        \}\n        return canvas;\n    \}/;

const generateItemTextureReplace = `    const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
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
    }`;

code = code.replace(generateItemTextureRegex, generateItemTextureReplace);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
