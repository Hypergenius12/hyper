const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

const regex1 = /this\.footstepTimer = 0;\n                    this\.audio\.playFootstep\(\);/;
const replacement1 = `this.footstepTimer = 0;
                    const blockUnder = this.chunkManager.getBlock(Math.floor(this.player.position.x), Math.floor(this.player.position.y - 0.1), Math.floor(this.player.position.z));
                    this.audio.playFootstep(blockUnder);`;

code = code.replace(regex1, replacement1);

const regex2 = /this\.entityManager\.update\(dt, this\.chunkManager, this\.player\.position, this\.player\.inventory, this\.player, this\.skySystem\.time, this\.currentDimension\);/;
const replacement2 = `const prevHealth = this.player.health;
            this.entityManager.update(dt, this.chunkManager, this.player.position, this.player.inventory, this.player, this.skySystem.time, this.currentDimension);
            if (this.player.health < prevHealth) {
                this.audio.playHurt(this.player.position);
            }`;

code = code.replace(regex2, replacement2);

const regex3 = /this\.player\.health = Math\.min\(this\.player\.maxHealth, this\.player\.health \+ \(slot\.item\.data\.heal \|\| 10\)\);\n                    this\.audio\.playHit\(\);/;
const replacement3 = `this.player.health = Math.min(this.player.maxHealth, this.player.health + (slot.item.data.heal || 10));
                    this.audio.playEat();`;

code = code.replace(regex3, replacement3);

fs.writeFileSync('slopcraft 3D/js/main.js', code);
