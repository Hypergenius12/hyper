const fs = require('fs');
let code = fs.readFileSync('js/audio.js', 'utf8');

const oldCode = `        // Update Spatial Audio Listener
        if (this.ctx.listener && this.ctx.listener.positionX) {
            this.ctx.listener.positionX.value = px;
            this.ctx.listener.positionY.value = playerY;
            this.ctx.listener.positionZ.value = pz;`;

const newCode = `        // Update Spatial Audio Listener
        if (this.ctx.listener && this.ctx.listener.positionX) {
            this.ctx.listener.positionX.value = isNaN(px) ? 0 : px;
            this.ctx.listener.positionY.value = isNaN(playerY) ? 0 : playerY;
            this.ctx.listener.positionZ.value = isNaN(pz) ? 0 : pz;`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('js/audio.js', code);
