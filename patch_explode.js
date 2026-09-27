const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regexHit = /    playHit\(position\) \{/;
const replacementHit = `    playExplode(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            const v = Math.floor(Math.random() * 4) + 1;
            this.playMC(\`random/explode\${v}\`, 0.9, position);
        } else this.playNoise(0.5, 0.8, position);
    }

    playHit(position) {`;

code = code.replace(regexHit, replacementHit);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
