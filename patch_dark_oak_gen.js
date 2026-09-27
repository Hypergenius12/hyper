const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/generation.js', 'utf8');

code = code.replace(
    /    else if \(isDark\) \{ trunkType = BLOCKS.WOOD; leafType = BLOCKS.PINE_LEAVES; \}/,
    "    else if (isDark) { trunkType = BLOCKS.DARK_OAK_WOOD; leafType = BLOCKS.DARK_OAK_LEAVES; }"
);

// Add the extra depth for trunks
code = code.replace(
    /        for \(let i = 0; i < height; i\+\+\) \{\n            safeSetBlock\(blocks, x, y \+ i, z, trunkType\);\n            safeSetBlock\(blocks, x\+1, y \+ i, z, trunkType\);\n            safeSetBlock\(blocks, x, y \+ i, z\+1, trunkType\);\n            safeSetBlock\(blocks, x\+1, y \+ i, z\+1, trunkType\);\n        \}/,
    "        for (let i = -2; i < height; i++) {\n            const onlyAir = i < 0;\n            safeSetBlock(blocks, x, y + i, z, trunkType, onlyAir);\n            safeSetBlock(blocks, x+1, y + i, z, trunkType, onlyAir);\n            safeSetBlock(blocks, x, y + i, z+1, trunkType, onlyAir);\n            safeSetBlock(blocks, x+1, y + i, z+1, trunkType, onlyAir);\n        }"
);

fs.writeFileSync('slopcraft 3D/js/generation.js', code);
