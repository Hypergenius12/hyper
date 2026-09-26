const fs = require('fs');
let code = fs.readFileSync('js/textureGen.js', 'utf8');

if (!code.includes('Textures.leavesCherry')) {
    code = code.replace(/Textures\.leaves = createSeamlessTexture\(16, \[40, 110, 40\], 50, 'leaves'\);/,
    `Textures.leaves = createSeamlessTexture(16, [40, 110, 40], 50, 'leaves');
    Textures.leavesCherry = createSeamlessTexture(16, [255, 183, 197], 50, 'leaves');`);
    
    fs.writeFileSync('js/textureGen.js', code);
}
