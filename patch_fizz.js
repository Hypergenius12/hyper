const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regexHit = /    playHit\(position\) \{/;
const replacementHit = `    playFizz(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('random/fizz', 0.8, position);
        } else this.playNoise(0.2, 0.4, position);
    }

    playHit(position) {`;

code = code.replace(regexHit, replacementHit);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
