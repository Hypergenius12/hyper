const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

// We will completely replace playBreak, playPlace, playHit, playHurt, playClick
const regex = /    playBreak\(blockType\) \{[\s\S]*?    playClick\(\) \{[\s\S]*?\n    \}/;

const replacement = `    playBreak(blockType) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        
        const doFallback = () => {
            if ([BLOCKS.STONE, BLOCKS.COBBLESTONE, BLOCKS.IRON_ORE, BLOCKS.GOLD_ORE, BLOCKS.CRYSTAL_ORE, BLOCKS.MANA_ORE, BLOCKS.OBSIDIAN, BLOCKS.DUNGEON_BRICK, BLOCKS.BEDROCK, BLOCKS.ALIEN_STONE].includes(blockType)) {
                this.playNoise(0.2, 0.4);
                this.playTone(80, 'triangle', 0.1, 0.5, -40);
            } else if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) {
                this.playNoise(0.1, 0.2);
                this.playTone(200, 'square', 0.05, 0.3, -50);
            } else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) {
                this.playNoise(0.15, 0.2);
            } else if ([BLOCKS.GLASS, BLOCKS.ICE, BLOCKS.ALIEN_CRYSTAL].includes(blockType)) {
                this.playNoise(0.1, 0.3);
                this.playTone(800, 'sine', 0.05, 0.4, -200);
            } else {
                this.playNoise(0.15, 0.3);
                this.playTone(150, 'square', 0.05, 0.2, -50);
            }
        };

        if (useMC) {
            const v = Math.floor(Math.random() * 4) + 1;
            let path = \`dig/stone\${v}\`;
            if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) path = \`dig/wood\${v}\`;
            else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) path = \`dig/grass\${v}\`;
            else if ([BLOCKS.GLASS, BLOCKS.ICE, BLOCKS.ALIEN_CRYSTAL].includes(blockType)) path = \`dig/glass\${v}\`;
            
            this.playMC(path, 0.6).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playPlace(blockType, position) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        
        const doFallback = () => {
            if ([BLOCKS.STONE, BLOCKS.COBBLESTONE].includes(blockType)) {
                this.playNoise(0.1, 0.3, position);
            } else if ([BLOCKS.WOOD, BLOCKS.PLANKS].includes(blockType)) {
                this.playNoise(0.05, 0.2, position);
                this.playTone(150, 'square', 0.05, 0.2, -30, position);
            } else {
                this.playNoise(0.1, 0.2, position);
            }
        };

        if (useMC) {
            const v = Math.floor(Math.random() * 4) + 1;
            let path = \`dig/stone\${v}\`;
            if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) path = \`dig/wood\${v}\`;
            else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) path = \`dig/grass\${v}\`;
            else if ([BLOCKS.GLASS, BLOCKS.ICE, BLOCKS.ALIEN_CRYSTAL].includes(blockType)) path = \`dig/glass\${v}\`;
            
            this.playMC(path, 0.6, position).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playHit(position) {
        const doFallback = () => {
            this.playNoise(0.05, 0.4, position);
            this.playTone(300, 'square', 0.05, 0.2, -100, position);
        };
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('damage/hit1', 0.7, position).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playHurt(position) {
        const doFallback = () => {
            this.playTone(400, 'sawtooth', 0.2, 0.4, -200, position);
            this.playNoise(0.1, 0.5, position);
        };
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('damage/hit2', 0.7, position).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playClick() {
        const doFallback = () => {
            this.playTone(800, 'sine', 0.05, 0.2);
        };
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('random/click', 0.7).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
