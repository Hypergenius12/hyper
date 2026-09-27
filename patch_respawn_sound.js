const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

code = code.replace(
    /this\.player\.velocity\.set\(0, 0, 0\);\n                this\.audio\.playHit\(\);/,
    "this.player.velocity.set(0, 0, 0);\n                if (localStorage.getItem('slopcraft_mc_textures') === 'true') this.audio.playMC('random/levelup', 0.6); else this.audio.playCast();"
);

fs.writeFileSync('slopcraft 3D/js/main.js', code);
