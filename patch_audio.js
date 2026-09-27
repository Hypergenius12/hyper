const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const fetchLogic = `    async _loadMCFile(path) {
        if (!this.mcCache) this.mcCache = {};
        if (this.mcCache[path]) return this.mcCache[path];
        if (this.mcCache[path] === 'loading') return null; // Avoid spamming
        this.mcCache[path] = 'loading';
        
        try {
            const res = await fetch(\`https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.16.5/assets/minecraft/sounds/\${path}.ogg\`);
            const arrayBuffer = await res.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.mcCache[path] = audioBuffer;
            return audioBuffer;
        } catch (e) {
            this.mcCache[path] = null;
            return null;
        }
    }
    
    async playMC(path, vol=1.0, position=null) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const buffer = await this._loadMCFile(path);
        if (!buffer || buffer === 'loading') return false;
        
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = vol;
        source.connect(gain);
        
        if (position && this.camera) {
            this._connectWithPanner(gain, position);
        } else {
            gain.connect(this.masterGain);
        }
        source.start();
        return true;
    }
`;

code = code.replace(/    playTone\(freq, type, duration, vol = 1\.0, slide = 0, position = null\) \{/, fetchLogic + "\n    playTone(freq, type, duration, vol = 1.0, slide = 0, position = null) {");

const oldPlayBreak = `    playBreak(blockType) {
        if ([BLOCKS.STONE, BLOCKS.COBBLESTONE, BLOCKS.IRON_ORE, BLOCKS.GOLD_ORE, BLOCKS.CRYSTAL_ORE, BLOCKS.MANA_ORE, BLOCKS.OBSIDIAN, BLOCKS.DUNGEON_BRICK, BLOCKS.BEDROCK, BLOCKS.ALIEN_STONE].includes(blockType)) {
            // Deep rocky crunch
            this.playNoise(0.2, 0.4);
            this.playTone(80, 'triangle', 0.1, 0.5, -40);
        } else if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) {
            // Wood crack
            this.playNoise(0.1, 0.2);
            this.playTone(200, 'square', 0.05, 0.3, -50);
        } else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) {
            // Soft sandy dig
            this.playNoise(0.15, 0.2);
        } else if ([BLOCKS.GLASS, BLOCKS.ICE, BLOCKS.ALIEN_CRYSTAL].includes(blockType)) {
            // Glass shatter
            this.playNoise(0.1, 0.3);
            this.playTone(800, 'sine', 0.05, 0.4, -200);
        } else {
            // Default generic break
            this.playNoise(0.15, 0.3);
        }
    }`;

const newPlayBreak = `    playBreak(blockType) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        if (useMC) {
            const v = Math.floor(Math.random() * 4) + 1;
            if ([BLOCKS.STONE, BLOCKS.COBBLESTONE, BLOCKS.IRON_ORE, BLOCKS.GOLD_ORE, BLOCKS.CRYSTAL_ORE, BLOCKS.MANA_ORE, BLOCKS.OBSIDIAN, BLOCKS.DUNGEON_BRICK, BLOCKS.BEDROCK, BLOCKS.ALIEN_STONE].includes(blockType)) {
                this.playMC(\`dig/stone\${v}\`, 0.6); return;
            } else if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) {
                this.playMC(\`dig/wood\${v}\`, 0.6); return;
            } else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) {
                this.playMC(\`dig/grass\${v}\`, 0.6); return;
            } else if ([BLOCKS.GLASS, BLOCKS.ICE, BLOCKS.ALIEN_CRYSTAL].includes(blockType)) {
                this.playMC(\`dig/glass\${v}\`, 0.6); return;
            }
            this.playMC(\`dig/stone\${v}\`, 0.6); return;
        }

        if ([BLOCKS.STONE, BLOCKS.COBBLESTONE, BLOCKS.IRON_ORE, BLOCKS.GOLD_ORE, BLOCKS.CRYSTAL_ORE, BLOCKS.MANA_ORE, BLOCKS.OBSIDIAN, BLOCKS.DUNGEON_BRICK, BLOCKS.BEDROCK, BLOCKS.ALIEN_STONE].includes(blockType)) {
            // Deep rocky crunch
            this.playNoise(0.2, 0.4);
            this.playTone(80, 'triangle', 0.1, 0.5, -40);
        } else if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) {
            // Wood crack
            this.playNoise(0.1, 0.2);
            this.playTone(200, 'square', 0.05, 0.3, -50);
        } else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) {
            // Soft sandy dig
            this.playNoise(0.15, 0.2);
        } else if ([BLOCKS.GLASS, BLOCKS.ICE, BLOCKS.ALIEN_CRYSTAL].includes(blockType)) {
            // Glass shatter
            this.playNoise(0.1, 0.3);
            this.playTone(800, 'sine', 0.05, 0.4, -200);
        } else {
            // Default generic break
            this.playNoise(0.15, 0.3);
        }
    }`;

code = code.replace(oldPlayBreak, newPlayBreak);

const oldPlayPlace = `    playPlace(blockType) {
        if ([BLOCKS.STONE, BLOCKS.COBBLESTONE, BLOCKS.IRON_ORE, BLOCKS.GOLD_ORE, BLOCKS.CRYSTAL_ORE, BLOCKS.MANA_ORE, BLOCKS.OBSIDIAN, BLOCKS.DUNGEON_BRICK, BLOCKS.ALIEN_STONE].includes(blockType)) {
            this.playTone(100, 'triangle', 0.1, 0.4, -20);
        } else if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) {
            this.playTone(180, 'square', 0.08, 0.3, -30);
        } else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) {
            this.playNoise(0.08, 0.15);
        } else {
            this.playTone(150, 'triangle', 0.1, 0.3, -50);
        }
    }`;

const newPlayPlace = `    playPlace(blockType) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        if (useMC) {
            const v = Math.floor(Math.random() * 4) + 1;
            if ([BLOCKS.STONE, BLOCKS.COBBLESTONE, BLOCKS.IRON_ORE, BLOCKS.GOLD_ORE, BLOCKS.CRYSTAL_ORE, BLOCKS.MANA_ORE, BLOCKS.OBSIDIAN, BLOCKS.DUNGEON_BRICK, BLOCKS.ALIEN_STONE].includes(blockType)) {
                this.playMC(\`dig/stone\${v}\`, 0.6); return;
            } else if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) {
                this.playMC(\`dig/wood\${v}\`, 0.6); return;
            } else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) {
                this.playMC(\`dig/grass\${v}\`, 0.6); return;
            }
            this.playMC(\`dig/stone\${v}\`, 0.6); return;
        }

        if ([BLOCKS.STONE, BLOCKS.COBBLESTONE, BLOCKS.IRON_ORE, BLOCKS.GOLD_ORE, BLOCKS.CRYSTAL_ORE, BLOCKS.MANA_ORE, BLOCKS.OBSIDIAN, BLOCKS.DUNGEON_BRICK, BLOCKS.ALIEN_STONE].includes(blockType)) {
            this.playTone(100, 'triangle', 0.1, 0.4, -20);
        } else if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) {
            this.playTone(180, 'square', 0.08, 0.3, -30);
        } else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) {
            this.playNoise(0.08, 0.15);
        } else {
            this.playTone(150, 'triangle', 0.1, 0.3, -50);
        }
    }`;
    
code = code.replace(oldPlayPlace, newPlayPlace);

const oldPlayHit = `    playHit(position = null) {
        this.playNoise(0.12, 0.4, position);
        this.playTone(200, 'square', 0.1, 0.3, -100, position);
    }`;
const newPlayHit = `    playHit(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('damage/hit1', 0.7, position); return;
        }
        this.playNoise(0.12, 0.4, position);
        this.playTone(200, 'square', 0.1, 0.3, -100, position);
    }`;
code = code.replace(oldPlayHit, newPlayHit);

const oldPlayClick = `    playClick() {
        this.playTone(800, 'sine', 0.05, 0.2);
    }`;
const newPlayClick = `    playClick() {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('random/click', 0.7); return;
        }
        this.playTone(800, 'sine', 0.05, 0.2);
    }`;
code = code.replace(oldPlayClick, newPlayClick);

const oldPlayHurt = `    playHurt(position = null) {
        this.playNoise(0.2, 0.6, position);
        this.playTone(100, 'sawtooth', 0.2, 0.4, -50, position);
    }`;
const newPlayHurt = `    playHurt(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('damage/hit2', 0.7, position); return;
        }
        this.playNoise(0.2, 0.6, position);
        this.playTone(100, 'sawtooth', 0.2, 0.4, -50, position);
    }`;
code = code.replace(oldPlayHurt, newPlayHurt);

fs.writeFileSync('slopcraft 3D/js/audio.js', code);
