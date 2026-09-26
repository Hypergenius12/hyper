// ============================================
// audio.js — SFX Synthesizer using Web Audio API
// ============================================

import { BLOCKS } from './textures.js';

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.camera = null;
    }

    _ensureContext() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.ctx.destination);
    }

    _loadMCFile(path) {
        if (!this.mcCache) this.mcCache = {};
        if (this.mcCache[path]) return this.mcCache[path];
        
        this.mcCache[path] = (async () => {
            try {
                const res = await fetch(`https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.11/assets/minecraft/sounds/${path}.ogg`);
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
    }
    
    async playMC(path, vol=1.0, position=null) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        const buffer = await this._loadMCFile(path);
        if (!buffer) return false;
        
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

    playTone(freq, type, duration, vol = 1.0, slide = 0, position = null) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slide !== 0) {
            osc.frequency.exponentialRampToValueAtTime(freq + slide, this.ctx.currentTime + duration);
        }
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        this._connectWithPanner(gain, position);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, vol = 1.0, position = null) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;
        
        // Simple lowpass filter for noise
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        noiseSource.connect(filter);
        filter.connect(gain);
        this._connectWithPanner(gain, position);
        
        noiseSource.start();
    }

    _connectWithPanner(sourceNode, position) {
        if (position && this.camera) {
            const panner = this.ctx.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 1;
            panner.maxDistance = 50;
            panner.rolloffFactor = 1;
            
            panner.positionX.value = position.x;
            panner.positionY.value = position.y;
            panner.positionZ.value = position.z;

            if (this.ctx.listener && this.ctx.listener.positionX) {
                this.ctx.listener.positionX.value = this.camera.position.x;
                this.ctx.listener.positionY.value = this.camera.position.y;
                this.ctx.listener.positionZ.value = this.camera.position.z;
                
                // Hacky way to get forward vector for Three.js camera
                const vector = new THREE.Vector3(0, 0, -1);
                vector.applyQuaternion(this.camera.quaternion);
                
                if (this.ctx.listener.forwardX) {
                    this.ctx.listener.forwardX.value = vector.x;
                    this.ctx.listener.forwardY.value = vector.y;
                    this.ctx.listener.forwardZ.value = vector.z;
                    
                    const up = new THREE.Vector3(0, 1, 0);
                    up.applyQuaternion(this.camera.quaternion);
                    this.ctx.listener.upX.value = up.x;
                    this.ctx.listener.upY.value = up.y;
                    this.ctx.listener.upZ.value = up.z;
                }
            }
            
            sourceNode.connect(panner);
            panner.connect(this.masterGain);
        } else {
            sourceNode.connect(this.masterGain);
        }
    }

    _getMCBlockMaterial(blockType) {
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
            this.playMC(`step/${mat}${v}`, 0.4).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playSwim(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            const v = Math.floor(Math.random() * 4) + 1;
            this.playMC(`liquid/swim${v}`, 0.6, position);
        } else this.playNoise(0.1, 0.2, position);
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
                this.playMC(`random/glass${v}`, 0.6).then(s => { if(!s) doFallback(); });
                return;
            }
            const v = Math.floor(Math.random() * 4) + 1;
            this.playMC(`dig/${mat}${v}`, 0.6).then(s => { if(!s) doFallback(); });
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
            this.playMC(`dig/${mat}${v}`, 0.4, position).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playExplode(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            const v = Math.floor(Math.random() * 4) + 1;
            this.playMC(`random/explode${v}`, 0.9, position);
        } else this.playNoise(0.5, 0.8, position);
    }

    playFizz(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('random/fizz', 0.8, position);
        } else this.playNoise(0.2, 0.4, position);
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

    playChestOpen(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('block/chest/open', 0.8, position);
        } else this.playNoise(0.1, 0.3, position);
    }
    
    playChestClose(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('block/chest/close1', 0.8, position);
        } else this.playNoise(0.1, 0.3, position);
    }
    
    playDoorOpen(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('random/door_open', 0.8, position);
        } else this.playNoise(0.1, 0.2, position);
    }
    
    playDoorClose(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('random/door_close', 0.8, position);
        } else this.playNoise(0.1, 0.2, position);
    }



    playEat(position = null) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        const doFallback = () => {
            this.playNoise(0.2, 0.4, position);
            this.playTone(300, 'square', 0.1, 0.3, -50, position);
        };
        if (useMC) {
            const v = Math.floor(Math.random() * 3) + 1;
            this.playMC(`random/eat${v}`, 0.7, position).then(s => { if(!s) doFallback(); });
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
    }

    playCast(position = null) {
        if (localStorage.getItem('slopcraft_mc_textures') === 'true') {
            this.playMC('random/bow', 0.8, position);
        } else this.playTone(600, 'sine', 0.3, 0.3, 400, position);
    }


}
