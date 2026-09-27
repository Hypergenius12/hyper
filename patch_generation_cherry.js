const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/generation.js', 'utf8');

const regex = /if \(biome === BIOMES.CHERRY_GROVE && fr < 0.6\) \{\n                        if \(fr < 0.35\) \{/g;
const replacement = `if (biome === BIOMES.CHERRY_GROVE && fr < 0.3) {
                        if (fr < 0.1) {`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/generation.js', code);
