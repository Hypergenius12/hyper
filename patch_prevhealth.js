const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

const regex = /this\.entityManager\.update\(dt, this\.world, this\.player\.position, this\.player\.inventory, this\.player, this\.lighting\.timeOfDay, this\.currentDimension\);/;

const replacement = `const prevHealth = this.player.health;
        this.entityManager.update(dt, this.world, this.player.position, this.player.inventory, this.player, this.lighting.timeOfDay, this.currentDimension);
        if (this.player.health < prevHealth) {
            this.audio.playHurt(this.player.position);
        }`;

code = code.replace(regex, replacement);

fs.writeFileSync('slopcraft 3D/js/main.js', code);
