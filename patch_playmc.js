const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regex = /    async playMC\(path, vol=1\.0, position=null\) \{[\s\S]*?const buffer = await this\._loadMCFile\(path\);/;
const replacement = `    async playMC(path, vol=1.0, position=null) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        const buffer = await this._loadMCFile(path);`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
