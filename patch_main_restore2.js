const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

const regex1 = /this\.chunkManager\.getBlock\(/;
const replacement1 = `this.world.getBlock(`;
code = code.replace(regex1, replacement1);

const regex2 = /const prevHealth = this\.player\.health;\n            this\.entityManager\.update\(dt, this\.chunkManager, this\.player\.position, this\.player\.inventory, this\.player, this\.skySystem\.time, this\.currentDimension\);\n            if \(this\.player\.health < prevHealth\) \{\n                this\.audio\.playHurt\(this\.player\.position\);\n            \}/;

const replacement2 = `const prevHealth = this.player.health;
        this.entityManager.update(dt, this.world, this.player.position, this.player.inventory, this.player, this.lighting.timeOfDay, this.currentDimension);
        if (this.player.health < prevHealth) {
            this.audio.playHurt(this.player.position);
        }`;

code = code.replace(regex2, replacement2);

fs.writeFileSync('slopcraft 3D/js/main.js', code);
