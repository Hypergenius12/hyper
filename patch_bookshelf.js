const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

code = code.replace(
    /                    this\.audio\.playHit\(\); \/\/ Magical sound/,
    "                    if (localStorage.getItem('slopcraft_mc_textures') === 'true') this.audio.playMC('random/levelup', 0.6); else this.audio.playHit();"
);

fs.writeFileSync('slopcraft 3D/js/main.js', code);
