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

    playFootstep(blockType) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        const doFallback = () => {
            this.playNoise(0.05, 0.1);
        };
        if (useMC) {
            const v = Math.floor(Math.random() * 4) + 1;
            let path = `step/stone${v}`;
            if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) path = `step/wood${v}`;
            else if ([BLOCKS.SAND, BLOCKS.RED_SAND].includes(blockType)) path = `step/sand${v}`;
            else if ([BLOCKS.GRAVEL].includes(blockType)) path = `step/gravel${v}`;
            else if ([BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) path = `step/grass${v}`;
            else if ([BLOCKS.SNOW].includes(blockType)) path = `step/snow${v}`;
            
            this.playMC(path, 0.4).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playWaterSplash() {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        const doFallback = () => {
            this.playNoise(0.3, 0.4);
        };
        if (useMC) {
            this.playMC('random/splash', 0.6).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playBreak(blockType) {
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
            let path = `dig/stone${v}`;
            if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) path = `dig/wood${v}`;
            else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) path = `dig/grass${v}`;
            else if ([BLOCKS.GLASS, BLOCKS.ICE, BLOCKS.ALIEN_CRYSTAL].includes(blockType)) path = `dig/glass${v}`;
            
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
            let path = `dig/stone${v}`;
            if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) path = `dig/wood${v}`;
            else if ([BLOCKS.SAND, BLOCKS.GRAVEL, BLOCKS.RED_SAND, BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) path = `dig/grass${v}`;
            else if ([BLOCKS.GLASS, BLOCKS.ICE, BLOCKS.ALIEN_CRYSTAL].includes(blockType)) path = `dig/glass${v}`;
            
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
        this.playTone(600, 'sine', 0.3, 0.3, 400, position);
    }


}
