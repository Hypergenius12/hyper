const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regex = /    async _loadMCFile\(path\) \{[\s\S]*?return null;\n        \}\n    \}/;
const replacement = `    _loadMCFile(path) {
        if (!this.mcCache) this.mcCache = {};
        if (this.mcCache[path]) return this.mcCache[path];
        
        this.mcCache[path] = (async () => {
            try {
                const res = await fetch(\`https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.4/assets/minecraft/sounds/\${path}.ogg\`);
                if (!res.ok) throw new Error("HTTP error");
                const arrayBuffer = await res.arrayBuffer();
                const audioBuffer = await new Promise((resolve, reject) => {
                    this.ctx.decodeAudioData(arrayBuffer, resolve, reject);
                });
                return audioBuffer;
            } catch (e) {
                return null;
            }
        })();
        
        return this.mcCache[path];
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
