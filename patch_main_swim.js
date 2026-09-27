const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

code = code.replace(
    /                    const blockUnder = this\.world\.getBlock\(Math\.floor\(this\.player\.position\.x\), Math\.floor\(this\.player\.position\.y - 0\.1\), Math\.floor\(this\.player\.position\.z\)\);\n                    this\.audio\.playFootstep\(blockUnder\);/,
    "                    if (this.player.inWater) {\n                        this.audio.playWaterSplash();\n                    } else {\n                        const blockUnder = this.world.getBlock(Math.floor(this.player.position.x), Math.floor(this.player.position.y - 0.1), Math.floor(this.player.position.z));\n                        this.audio.playFootstep(blockUnder);\n                    }"
);

fs.writeFileSync('slopcraft 3D/js/main.js', code);
