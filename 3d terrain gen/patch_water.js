const fs = require('fs');
let code = fs.readFileSync('js/water.js', 'utf8');

// Update water material for reflections
code = code.replace(/roughness: 0\.1,\n\s*metalness: 0\.1/, 'roughness: 0.1,\n        metalness: 0.8');

fs.writeFileSync('js/water.js', code);
