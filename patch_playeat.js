const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regex = /    playClick\(\) \{/;
const replacement = `    playEat(position = null) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        const doFallback = () => {
            this.playNoise(0.2, 0.4, position);
            this.playTone(300, 'square', 0.1, 0.3, -50, position);
        };
        if (useMC) {
            const v = Math.floor(Math.random() * 3) + 1;
            this.playMC(\`random/eat\${v}\`, 0.7, position).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playClick() {`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
