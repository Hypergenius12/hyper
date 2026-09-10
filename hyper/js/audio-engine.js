class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master Compressor
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -12;
        this.compressor.knee.value = 10;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.005;
        this.compressor.release.value = 0.25;
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;
        
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        
        this.tracks = [];
        this.isPlaying = false;
        
        // Shared Reverb Impulse Response
        this.reverbImpulse = this.createReverbImpulse(this.ctx, 2.0, 2.0);
    }
    
    // Generates a simple synthetic impulse response for reverb
    createReverbImpulse(ctx, duration, decay) {
        const length = ctx.sampleRate * duration;
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            const n = i === 0 ? 1 : Math.random() * 2 - 1;
            left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
        return impulse;
    }

    addTrack(track) {
        this.tracks.push(track);
        track.connect(this.masterGain);
    }

    removeTrack(id) {
        const index = this.tracks.findIndex(t => t.id === id);
        if (index > -1) {
            this.tracks[index].disconnect();
            this.tracks.splice(index, 1);
        }
    }

    getTrack(id) {
        return this.tracks.find(t => t.id === id);
    }

    play() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        const now = this.ctx.currentTime;
        this.tracks.forEach(track => {
            if (!track.isMuted) {
                track.play(now);
            }
        });
        this.isPlaying = true;
    }

    stop() {
        const now = this.ctx.currentTime;
        this.tracks.forEach(track => {
            track.stop(now);
        });
        this.isPlaying = false;
    }
    
    // For Exporting
    async renderOffline(durationSeconds = 10) {
        const sampleRate = this.ctx.sampleRate;
        const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSeconds, sampleRate);
        
        const offlineCompressor = offlineCtx.createDynamicsCompressor();
        offlineCompressor.threshold.value = -12;
        offlineCompressor.knee.value = 10;
        offlineCompressor.ratio.value = 4;
        offlineCompressor.attack.value = 0.005;
        offlineCompressor.release.value = 0.25;
        
        const offlineMasterGain = offlineCtx.createGain();
        offlineMasterGain.gain.value = 0.8;
        
        offlineMasterGain.connect(offlineCompressor);
        offlineCompressor.connect(offlineCtx.destination);
        
        const offlineReverbImpulse = this.createReverbImpulse(offlineCtx, 2.0, 2.0);
        
        // Clone tracks for offline rendering
        this.tracks.forEach(track => {
            if (!track.isMuted) {
                track.cloneToOffline(offlineCtx, offlineMasterGain, 0, offlineReverbImpulse);
            }
        });
        
        const renderedBuffer = await offlineCtx.startRendering();
        return renderedBuffer;
    }
}

window.audioEngine = new AudioEngine();
