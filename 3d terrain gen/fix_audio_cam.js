const fs = require('fs');
let code = fs.readFileSync('js/audio.js', 'utf8');

code = code.replace(/window\.camera\.getWorldDirection\(fw\);/g, 'player.camera.getWorldDirection(fw);');

fs.writeFileSync('js/audio.js', code);
