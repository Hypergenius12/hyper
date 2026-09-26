const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

// Remove BokehPass creation
code = code.replace(/window\.bokehPass = new THREE\.BokehPass[\s\S]*?composer\.addPass\(window\.bokehPass\);/g, '');

// Remove BokehPass update logic
code = code.replace(/if \(window\.bokehPass\) \{[\s\S]*?\}\n\s*\}/g, '');

fs.writeFileSync('js/main.js', code);
