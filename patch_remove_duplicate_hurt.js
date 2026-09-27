const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regex = /    playHurt\(position = null\) \{[\s\S]*?\n    \}/;
code = code.replace(regex, "");
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
