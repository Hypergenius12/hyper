const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/engine.js', 'utf8');

const regex = /const _glowTransparentIndices = new Uint32Array\(MAX_INDICES\);/g;
const replacement = "const _glowTransparentIndices = new Uint32Array(MAX_INDICES);\nconst _slightGlowOpaqueIndices = new Uint32Array(MAX_INDICES);\nconst _slightGlowTransparentIndices = new Uint32Array(MAX_INDICES);";

code = code.replace(regex, replacement);

fs.writeFileSync('slopcraft 3D/js/engine.js', code);
