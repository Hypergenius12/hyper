class AudioManager {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        this.tracks = {
            winter: new Audio('winter ambiant.mp3'),
            beach: new Audio('beach ambiance.mp3'),
            day: new Audio('day birds.mp3'),
            night: new Audio('night crickets.mp3'),
            underwater: new Audio('underwater ambient.mp3'),
            shallowWalk: new Audio('shallow water.mp3'),
            desert: new Audio('desert ambiance.mp3'),
            snowWalk: new Audio('snowsteps.mp3'),
            rain: new Audio('rain.mp3'),
            blizzard: new Audio('blizzard.mp3'),
            cave1: new Audio('cave1.mp3'),
            cave2: new Audio('cave2.mp3'),
            cave3: new Audio('cave3.mp3')
        };
        
        // Reverb / Echo network
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.value = 0.0;
        
        this.delay = this.ctx.createDelay();
        this.delay.delayTime.value = 0.4;
        this.feedback = this.ctx.createGain();
        this.feedback.gain.value = 0.3;
        
        this.reverbGain.connect(this.delay);
        this.delay.connect(this.feedback);
        this.feedback.connect(this.delay);
        this.delay.connect(this.ctx.destination);
        
        for (const [key, audio] of Object.entries(this.tracks)) {
            audio.loop = true;
            audio.volume = 0;
            const source = this.ctx.createMediaElementSource(audio);
            source.connect(this.ctx.destination);
            source.connect(this.reverbGain);
            audio.play().catch(() => {}); 
        }
        
        this.sfx = {
            splash: new Audio('water splash.mp3')
        };
        for (const audio of Object.values(this.sfx)) {
            const source = this.ctx.createMediaElementSource(audio);
            source.connect(this.ctx.destination);
            source.connect(this.reverbGain);
        }
        
        this.targetVolumes = {
            winter: 0, beach: 0, day: 0, night: 0, underwater: 0,
            shallowWalk: 0, desert: 0, snowWalk: 0, rain: 0, blizzard: 0,
            cave1: 0, cave2: 0, cave3: 0
        };
        
        this.fadeSpeed = 0.8;
        this.started = false;
        
        this.activeCaveTrack = 'cave1';

        // Procedural Spatial Wind
        this.windOsc = this.ctx.createBufferSource();
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // White noise
        }
        this.windOsc.buffer = buffer;
        this.windOsc.loop = true;
        
        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'lowpass';
        this.windFilter.frequency.value = 400;
        
        this.windPanner = this.ctx.createPanner();
        this.windPanner.panningModel = 'HRTF';
        this.windPanner.distanceModel = 'inverse';
        this.windPanner.refDistance = 1;
        this.windPanner.maxDistance = 100;
        this.windPanner.rolloffFactor = 1;
        
        this.windGain = this.ctx.createGain();
        this.windGain.gain.value = 0;
        
        this.windOsc.connect(this.windFilter);
        this.windFilter.connect(this.windPanner);
        this.windPanner.connect(this.windGain);
        this.windGain.connect(this.ctx.destination);
        this.windOsc.start();

        
        document.addEventListener('click', () => {
            if (!this.started) {
                this.started = true;
                this.ctx.resume();
                for (const audio of Object.values(this.tracks)) {
                    audio.play().catch(() => {});
                }
            }
        }, { once: true });
    }
    update(delta, player, isDay) {
        if (!this.started) return;
        
        // Pick new random cave ambiance when entering a cave
        if (window.player && window.player.inCave) {
            if (!this.wasInCave) {
                const picks = ['cave1', 'cave2', 'cave3'];
                this.activeCaveTrack = picks[Math.floor(Math.random() * picks.length)];
                this.wasInCave = true;
            }
            this.reverbGain.gain.value = Math.min(0.6, this.reverbGain.gain.value + delta * 0.2);
        } else {
            this.wasInCave = false;
            this.reverbGain.gain.value = Math.max(0.0, this.reverbGain.gain.value - delta * 0.2);
        }
        
        // Reset targets
        for (let key in this.targetVolumes) this.targetVolumes[key] = 0;
        
        const playerY = player.yawObject.position.y;

        

        const px = player.yawObject.position.x;
        const pz = player.yawObject.position.z;

        // Update Spatial Audio Listener
        if (this.ctx.listener && this.ctx.listener.positionX) {
            this.ctx.listener.positionX.value = isNaN(px) ? 0 : px;
            this.ctx.listener.positionY.value = isNaN(playerY) ? 0 : playerY;
            this.ctx.listener.positionZ.value = isNaN(pz) ? 0 : pz;
            
            // Set listener orientation based on camera
            const fw = new THREE.Vector3();
            player.camera.getWorldDirection(fw);
            this.ctx.listener.forwardX.value = fw.x;
            this.ctx.listener.forwardY.value = fw.y;
            this.ctx.listener.forwardZ.value = fw.z;
        }

        // Spin the wind around the player
        const windTime = Date.now() * 0.001;
        const windX = px + Math.sin(windTime * 0.5) * 20;
        const windZ = pz + Math.cos(windTime * 0.5) * 20;
        this.windPanner.positionX.value = windX;
        this.windPanner.positionY.value = playerY + 10;
        this.windPanner.positionZ.value = windZ;
        
        // Modulate wind volume and pitch
        let targetWind = 0;
        if (playerY > 40) targetWind = (playerY - 40) / 20 * 0.5;
        if (window.sky && window.sky.weatherIntensity > 0) targetWind = Math.max(targetWind, window.sky.weatherIntensity * 0.5);
        
        this.windGain.gain.value += (targetWind - this.windGain.gain.value) * delta;
        this.windFilter.frequency.value = 200 + targetWind * 800 + Math.sin(windTime) * 100;
        
        const isUnderwater = playerY < WATER_LEVEL;
        const groundY = getExactHeight(px, pz);
        const depth = WATER_LEVEL - groundY;
        const isBeach = !isUnderwater && depth > -3 && depth < 2; 
        const isShallowWater = playerY >= WATER_LEVEL && groundY <= WATER_LEVEL + 0.05 && groundY >= WATER_LEVEL - 0.8;
        
        const temp = simplex.noise2D(px * 0.0005 + 5000, pz * 0.0005 + 5000);
        const isTaiga = temp < -0.5;
        const isDesert = temp > 0.25;
        const isCherry = temp > 0.1 && temp <= 0.25;
        
        const isMoving = Math.abs(player.velocity.x) > 1.0 || Math.abs(player.velocity.z) > 1.0;
        
        const rainVol = (window.sky && window.sky.weatherIntensity > 0) ? window.sky.weatherIntensity : 0;
        const dimFactor = 1.0 - rainVol * 0.8;
        
        if (window.player && window.player.inCave) {
            this.targetVolumes[this.activeCaveTrack] = 1.0;
        } else if (isUnderwater) {
            this.targetVolumes.underwater = 1.0;
        } else {
            if (isTaiga) {
                this.targetVolumes.winter = 0.8 * dimFactor;
            } else if (isCherry) {
                this.targetVolumes.day = 0.8 * dimFactor;
            } else if (isDesert) {
                this.targetVolumes.desert = 0.8 * dimFactor;
            } else if (isBeach) {
                this.targetVolumes.beach = 0.8 * dimFactor;
            } else {
                if (isDay) {
                    this.targetVolumes.day = 0.6 * dimFactor;
                }
                else {
                    this.targetVolumes.night = 0.6 * dimFactor;
                }
            }
            
            // Snowstorm dynamic intensity
            if (window.sky && window.sky.weatherIntensity > 0) {
                if (isTaiga) {
                    if (window.sky.weatherIntensity > 0.7) {
                        this.targetVolumes.blizzard = window.sky.weatherIntensity;
                    }
                } else {
                    this.targetVolumes.rain = window.sky.weatherIntensity * 1.5;
                }
            }
            
            const onIce = isTaiga && groundY === WATER_LEVEL;
            
            if (isShallowWater && isMoving && !isTaiga) {
                this.targetVolumes.shallowWalk = 1.0;
            } else if (isTaiga && isMoving && !onIce) {
                this.targetVolumes.snowWalk = 0.4;
            }
        }
        
        // Lerp volumes
        for (const [key, target] of Object.entries(this.targetVolumes)) {
            const audio = this.tracks[key];
            if (!audio) continue;
            let currentFade = this.fadeSpeed;
            if (key === 'snowWalk' || key === 'shallowWalk') {
                currentFade = target === 0 ? 1.0 : 2.0;
            }
            
            const targetScaled = target * (window.masterVolume !== undefined ? window.masterVolume : 0.5);
            if (audio.volume < targetScaled) {
                audio.volume = Math.max(0, Math.min(1, Math.min(targetScaled, audio.volume + currentFade * delta)));
            } else if (audio.volume > targetScaled) {
                audio.volume = Math.max(0, Math.min(1, Math.max(targetScaled, audio.volume - currentFade * delta)));
            }
        }
    }
    
    playSplash() {
        if (!this.started) return;
        this.sfx.splash.currentTime = 0;
        this.sfx.splash.volume = 0.8;
        this.sfx.splash.play().catch(() => {});
    }
}
