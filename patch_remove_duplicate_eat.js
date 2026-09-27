const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regex = /    playEat\(position = null\) \{[\s\S]*?\n    \}/;
// Replace just the first match
code = code.replace(regex, "");

fs.writeFileSync('slopcraft 3D/js/audio.js', code);
