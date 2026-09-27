const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regex = /    playCast\(position = null\) \{[\s\S]*?\n    \}/;
const replacement = `    playCast(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('random/bow', 0.8, position);
        } else this.playTone(600, 'sine', 0.3, 0.3, 400, position);
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
