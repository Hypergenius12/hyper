const fs = require('fs');
let code = fs.readFileSync('js/audio.js', 'utf8');

// Add cherry biome to temp logic
code = code.replace(/const isDesert = temp > 0\.25;/g, 'const isDesert = temp > 0.25;\n        const isCherry = temp > 0.1 && temp <= 0.25;');

// If in cherry, play day birds
code = code.replace(/} else if \(isDesert\) \{/g, '} else if (isCherry) {\n                this.targetVolumes.day = 0.8 * dimFactor;\n            } else if (isDesert) {');

// Add a 3D spatial wind node
const spatialWind = `
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
`;

code = code.replace(/this\.activeCaveTrack = 'cave1';/g, "this.activeCaveTrack = 'cave1';\n" + spatialWind);

const spatialWindUpdate = `
        // Update Spatial Audio Listener
        if (this.ctx.listener && this.ctx.listener.positionX) {
            this.ctx.listener.positionX.value = px;
            this.ctx.listener.positionY.value = playerY;
            this.ctx.listener.positionZ.value = pz;
            
            // Set listener orientation based on camera
            const fw = new THREE.Vector3();
            window.camera.getWorldDirection(fw);
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
`;

code = code.replace(/const playerY = player\.yawObject\.position\.y;/g, "const playerY = player.yawObject.position.y;\n" + spatialWindUpdate);

fs.writeFileSync('js/audio.js', code);
