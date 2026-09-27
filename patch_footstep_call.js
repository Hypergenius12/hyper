const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

const regex = /this\.footstepTimer = 0;\n                    this\.audio\.playFootstep\(\);/;
const replacement = `this.footstepTimer = 0;
                    const blockUnder = this.chunkManager.getBlock(Math.floor(this.player.position.x), Math.floor(this.player.position.y - 0.1), Math.floor(this.player.position.z));
                    this.audio.playFootstep(blockUnder);`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/main.js', code);
