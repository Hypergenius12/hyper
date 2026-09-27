const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regexHit = /    playWaterSplash\(\) \{/;
const replacementHit = `    playSwim(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            const v = Math.floor(Math.random() * 4) + 1;
            this.playMC(\`liquid/swim\${v}\`, 0.6, position);
        } else this.playNoise(0.1, 0.2, position);
    }

    playWaterSplash() {`;

code = code.replace(regexHit, replacementHit);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
