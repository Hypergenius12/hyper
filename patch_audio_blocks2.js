const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regex = /    playFootstep\(blockType\) \{[\s\S]*?    playHit\(position\) \{/;

const replacement = `    _getMCBlockMaterial(blockType) {
        if (!blockType) return 'stone';
        const woods = [BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.ACACIA_WOOD, BLOCKS.ACACIA_PLANKS, BLOCKS.CHERRY_LOG, BLOCKS.CHERRY_PLANKS, BLOCKS.AUTUMN_WOOD, BLOCKS.AUTUMN_PLANKS, BLOCKS.PALM_WOOD, BLOCKS.PALM_PLANKS, BLOCKS.PINE_WOOD, BLOCKS.PINE_PLANKS, BLOCKS.DARK_OAK_WOOD, BLOCKS.DARK_OAK_PLANKS, BLOCKS.CRIMSON_STEM, BLOCKS.CRIMSON_PLANKS, BLOCKS.MUSHROOM_STEM, BLOCKS.CRAFTING_TABLE, BLOCKS.CHEST_BLOCK, BLOCKS.BARREL, BLOCKS.ENCHANTED_AETHER_LOG, BLOCKS.PORTAL_FRAME];
        if (woods.includes(blockType)) return 'wood';
        
        const grasses = [BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.SAVANNA_GRASS, BLOCKS.SWAMP_GRASS, BLOCKS.ALIEN_GRASS, BLOCKS.PINE_GRASS, BLOCKS.MUD, BLOCKS.MYCELIUM, BLOCKS.AETHER_GRASS, BLOCKS.AETHER_DIRT, BLOCKS.CRIMSON_NYLIUM, BLOCKS.LEAVES, BLOCKS.ACACIA_LEAVES, BLOCKS.CHERRY_LEAVES, BLOCKS.AUTUMN_LEAVES, BLOCKS.PALM_LEAVES, BLOCKS.PINE_LEAVES, BLOCKS.DARK_OAK_LEAVES, BLOCKS.GLOW_LEAVES, BLOCKS.ENCHANTED_AETHER_LEAVES, BLOCKS.CRIMSON_WART, BLOCKS.MUSHROOM_CAP, BLOCKS.ALIEN_SPORE_BLOCK];
        if (grasses.includes(blockType)) return 'grass';
        
        const sands = [BLOCKS.SAND, BLOCKS.RED_SAND];
        if (sands.includes(blockType)) return 'sand';
        
        const gravels = [BLOCKS.GRAVEL, BLOCKS.QUICKSOIL];
        if (gravels.includes(blockType)) return 'gravel';
        
        const snows = [BLOCKS.SNOW];
        if (snows.includes(blockType)) return 'snow';
        
        const glasses = [BLOCKS.GLASS, BLOCKS.ALIEN_CRYSTAL, BLOCKS.GLOWSTONE, BLOCKS.SEA_LANTERN, BLOCKS.ICE];
        if (glasses.includes(blockType)) return 'glass';
        
        return 'stone';
    }

    playFootstep(blockType) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        const doFallback = () => { this.playNoise(0.05, 0.1); };
        if (useMC) {
            let mat = this._getMCBlockMaterial(blockType);
            if (mat === 'glass') mat = 'stone'; // stepping on glass sounds like stone
            const v = Math.floor(Math.random() * 4) + 1;
            this.playMC(\`step/\${mat}\${v}\`, 0.4).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playWaterSplash() {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        const doFallback = () => { this.playNoise(0.3, 0.4); };
        if (useMC) {
            this.playMC('random/splash', 0.6).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playBreak(blockType) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        const doFallback = () => {
            this.playNoise(0.15, 0.3);
            this.playTone(150, 'square', 0.05, 0.2, -50);
        };
        if (useMC) {
            let mat = this._getMCBlockMaterial(blockType);
            if (mat === 'glass') {
                const v = Math.floor(Math.random() * 3) + 1;
                this.playMC(\`random/glass\${v}\`, 0.6).then(s => { if(!s) doFallback(); });
                return;
            }
            const v = Math.floor(Math.random() * 4) + 1;
            this.playMC(\`dig/\${mat}\${v}\`, 0.6).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playPlace(blockType, position) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        const doFallback = () => {
            this.playNoise(0.1, 0.2, position);
        };
        if (useMC) {
            let mat = this._getMCBlockMaterial(blockType);
            if (mat === 'glass') mat = 'stone'; // placing glass sounds like stone
            const v = Math.floor(Math.random() * 4) + 1;
            this.playMC(\`dig/\${mat}\${v}\`, 0.4, position).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playHit(position) {`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
