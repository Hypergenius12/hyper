const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regexEat = /    playEat\(position = null\) \{/;
const replacementEat = `    playChestOpen(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('block/chest/open', 0.8, position);
        } else this.playNoise(0.1, 0.3, position);
    }
    
    playChestClose(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('block/chest/close1', 0.8, position);
        } else this.playNoise(0.1, 0.3, position);
    }
    
    playDoorOpen(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('random/door_open', 0.8, position);
        } else this.playNoise(0.1, 0.2, position);
    }
    
    playDoorClose(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('random/door_close', 0.8, position);
        } else this.playNoise(0.1, 0.2, position);
    }

    playEat(position = null) {`;
code = code.replace(regexEat, replacementEat);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
