class Track {
    constructor(id, name, ctx) {
        this.id = id;
        this.name = name;
        this.ctx = ctx;
        
        // Parameters
        this.type = 'oscillator'; // 'oscillator' or 'buffer'
        this.waveType = 'sine'; // 'sine', 'square', 'sawtooth', 'triangle', 'custom'
        this.customWave = null; // PeriodicWave if custom
        this.buffer = null; // AudioBuffer if type is 'buffer'
        this.frequency = 440;
        this.detune = 0;
        
        // Envelope (ADSR)
        this.attack = 0.1;
        this.decay = 0.2;
        this.sustain = 0.5;
        this.release = 0.5;
        
        // Filter
        this.filterType = 'lowpass';
        this.filterFreq = 20000;
        this.filterQ = 1;
        
        // Effects
        this.delayTime = 0; // seconds
        this.delayFeedback = 0; // 0 to 1
        this.reverbMix = 0; // 0 to 1
        
        // Output mix
        this.gain = 0.8;
        this.panX = 0;
        this.panY = 0;
        this.panZ = 0;
        
        this.isMuted = false;
        this.isSolo = false;
        
        // LFO
        this.lfoRate = 5; // Hz
        this.lfoDepth = 0;
        this.lfoTarget = 'none'; // 'none', 'pitch', 'filter'
        
        // Distortion
        this.distortionAmount = 0; // 0 to 100
        
        // FM Synthesis
        this.fmRatio = 2; // Ratio of modulator to carrier freq
        this.fmDepth = 0; // 0 to 1000
        
        // Chorus
        this.chorusMix = 0; // 0 to 1
        
        // Audio Nodes
        this.filterNode = this.ctx.createBiquadFilter();
        
        this.distortionNode = this.ctx.createWaveShaper();
        this.distortionNode.curve = this.makeDistortionCurve(0);
        this.distortionNode.oversample = '4x';
        
        this.delayNode = this.ctx.createDelay();
        this.delayNode.delayTime.value = 0;
        this.delayFeedbackNode = this.ctx.createGain();
        this.delayFeedbackNode.gain.value = 0;
        this.delayMixNode = this.ctx.createGain();
        this.delayMixNode.gain.value = 1; // dry signal passes through
        
        // Delay loop
        this.delayNode.connect(this.delayFeedbackNode);
        this.delayFeedbackNode.connect(this.delayNode);
        // Delay wet output
        this.delayWetGain = this.ctx.createGain();
        this.delayWetGain.gain.value = 1;
        this.delayNode.connect(this.delayWetGain);
        
        this.reverbNode = this.ctx.createConvolver();
        if (window.audioEngine && window.audioEngine.reverbImpulse) {
            this.reverbNode.buffer = window.audioEngine.reverbImpulse;
        }
        this.reverbWetNode = this.ctx.createGain();
        this.reverbDryNode = this.ctx.createGain();
        this.reverbNode.connect(this.reverbWetNode);
        
        this.chorusDelayNode = this.ctx.createDelay();
        this.chorusDelayNode.delayTime.value = 0.03; // 30ms
        this.chorusOsc = this.ctx.createOscillator();
        this.chorusOsc.type = 'sine';
        this.chorusOsc.frequency.value = 1.5; // 1.5Hz sweep
        this.chorusGain = this.ctx.createGain();
        this.chorusGain.gain.value = 0.005; // 5ms modulation depth
        this.chorusOsc.connect(this.chorusGain);
        this.chorusGain.connect(this.chorusDelayNode.delayTime);
        this.chorusOsc.start();
        
        this.chorusWetGain = this.ctx.createGain();
        this.chorusDryGain = this.ctx.createGain();
        this.chorusWetGain.gain.value = 0;
        this.chorusDryGain.gain.value = 1;
        
        this.pannerNode = this.ctx.createPanner();
        this.pannerNode.panningModel = 'HRTF';
        this.pannerNode.distanceModel = 'inverse';
        this.pannerNode.refDistance = 1;
        this.pannerNode.maxDistance = 10000;
        this.pannerNode.rolloffFactor = 1;
        this.gainNode = this.ctx.createGain();
        
        // Setup persistent routing chain
        // envGain -> filterNode -> distortionNode -> delay/reverb -> panner -> gain
        this.filterNode.connect(this.distortionNode);
        
        // Split from distortion
        this.distortionNode.connect(this.delayNode);
        this.distortionNode.connect(this.delayMixNode);
        
        this.delayWetGain.connect(this.reverbNode);
        this.delayWetGain.connect(this.reverbDryNode);
        this.delayMixNode.connect(this.reverbNode);
        this.delayMixNode.connect(this.reverbDryNode);
        
        this.reverbWetNode.connect(this.chorusDelayNode);
        this.reverbWetNode.connect(this.chorusDryGain);
        this.reverbDryNode.connect(this.chorusDelayNode);
        this.reverbDryNode.connect(this.chorusDryGain);
        
        this.chorusDelayNode.connect(this.chorusWetGain);
        
        this.chorusWetGain.connect(this.pannerNode);
        this.chorusDryGain.connect(this.pannerNode);
        
        this.pannerNode.connect(this.gainNode);
        
        this.updateNodes();
        
        this.activeSources = [];
    }
    
    makeDistortionCurve(amount) {
        let k = typeof amount === 'number' ? amount : 50,
            n_samples = 44100,
            curve = new Float32Array(n_samples),
            deg = Math.PI / 180,
            i = 0,
            x;
        for ( ; i < n_samples; ++i ) {
            x = i * 2 / n_samples - 1;
            curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
        }
        return curve;
    }
    
    
    mutate() {
        const jitter = (val, amt) => val + (Math.random() * amt * 2 - amt);
        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
        
        this.attack = clamp(jitter(this.attack, 0.2), 0, 5);
        this.decay = clamp(jitter(this.decay, 0.2), 0, 5);
        this.sustain = clamp(jitter(this.sustain, 0.2), 0, 1);
        this.release = clamp(jitter(this.release, 0.2), 0, 5);
        
        this.filterFreq = clamp(jitter(this.filterFreq, 2000), 20, 20000);
        this.filterQ = clamp(jitter(this.filterQ, 2), 0.0001, 100);
        
        if (Math.random() > 0.7) {
            const types = ['sine', 'square', 'sawtooth', 'triangle'];
            this.waveType = types[Math.floor(Math.random() * types.length)];
        }
        
        this.lfoRate = clamp(jitter(this.lfoRate, 2), 0.1, 20);
        this.fmDepth = clamp(jitter(this.fmDepth, 100), 0, 1000);
        this.distortionAmount = clamp(jitter(this.distortionAmount, 10), 0, 100);
        
        this.updateNodes();
    }

    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            gain: this.gain,
            panX: this.panX,
            panY: this.panY,
            panZ: this.panZ,
            waveType: this.waveType,
            attack: this.attack,
            decay: this.decay,
            sustain: this.sustain,
            release: this.release,
            filterType: this.filterType,
            filterFreq: this.filterFreq,
            filterQ: this.filterQ,
            distortionAmount: this.distortionAmount,
            delayTime: this.delayTime,
            delayFeedback: this.delayFeedback,
            reverbMix: this.reverbMix,
            chorusMix: this.chorusMix,
            fmRatio: this.fmRatio,
            fmDepth: this.fmDepth,
            lfoTarget: this.lfoTarget,
            lfoRate: this.lfoRate,
            lfoDepth: this.lfoDepth
        };
    }
    
    fromJSON(data) {
        Object.assign(this, data);
        this.updateNodes();
    }

    _createReverbBuffer() {
        const length = this.ctx.sampleRate * 2.0; // 2 seconds
        const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        for (let i = 0; i < length; i++) {
            const decay = Math.exp(-i / (this.ctx.sampleRate * 0.5));
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }
        return impulse;
    }

    updateNodes() {
        this.gainNode.gain.value = this.gain;
        this.pannerNode.positionX.value = this.panX;
        this.pannerNode.positionY.value = this.panY;
        this.pannerNode.positionZ.value = this.panZ;
        this.filterNode.type = this.filterType;
        this.filterNode.frequency.value = this.filterFreq;
        this.filterNode.Q.value = this.filterQ;
        
        this.distortionNode.curve = this.makeDistortionCurve(this.distortionAmount);
        
        this.delayNode.delayTime.value = this.delayTime;
        this.delayFeedbackNode.gain.value = this.delayFeedback;
        this.chorusWetGain.gain.value = this.chorusMix;
        this.chorusDryGain.gain.value = 1 - (this.chorusMix * 0.5); // Slight dip in dry when wet is high
        
        this.reverbWetNode.gain.value = this.reverbMix;
        this.reverbDryNode.gain.value = 1 - this.reverbMix;
    }
    
    connect(destination) {
        this.destination = destination;
        this.gainNode.connect(destination);
    }
    
    disconnect() {
        this.gainNode.disconnect();
    }
    
    play(time, freqOverride = null) {
        let source;
        const targetFreq = freqOverride !== null ? freqOverride : this.frequency;
        
        if (this.type === 'oscillator') {
            source = this.ctx.createOscillator();
            if (this.waveType === 'custom' && this.customWave) {
                source.setPeriodicWave(this.customWave);
            } else {
                source.type = this.waveType;
            }
            source.frequency.value = targetFreq;
            source.detune.value = this.detune;
        } else if (this.type === 'buffer' && this.buffer) {
            source = this.ctx.createBufferSource();
            source.buffer = this.buffer;
            source.detune.value = this.detune;
            source.playbackRate.value = targetFreq / 440;
        } else {
            return;
        }
        
        const envGain = this.ctx.createGain();
        envGain.gain.setValueAtTime(0, time);
        envGain.gain.linearRampToValueAtTime(1, time + this.attack);
        envGain.gain.linearRampToValueAtTime(this.sustain, time + this.attack + this.decay);
        
        source.connect(envGain);
        envGain.connect(this.filterNode);
        
        // Setup LFO
        let lfoOsc = null;
        let lfoGain = null;
        
        if (this.lfoTarget !== 'none' && this.lfoDepth > 0) {
            lfoOsc = this.ctx.createOscillator();
            lfoOsc.type = 'sine';
            lfoOsc.frequency.value = this.lfoRate;
            
            lfoGain = this.ctx.createGain();
            
            if (this.lfoTarget === 'pitch') {
                // Pitch LFO depth usually ranges 0 to 1000 cents
                lfoGain.gain.value = this.lfoDepth * 10;
                if (source.detune) {
                    lfoOsc.connect(lfoGain);
                    lfoGain.connect(source.detune);
                }
            } else if (this.lfoTarget === 'filter') {
                // Filter LFO depth modulates frequency around cutoff
                lfoGain.gain.value = this.lfoDepth * 50; // up to 5000Hz variation
                lfoOsc.connect(lfoGain);
                lfoGain.connect(this.filterNode.frequency);
            }
            
            lfoOsc.start(time);
        }
        
        
        // FM Modulator
        let fmOsc = null;
        let fmGain = null;
        if (this.fmDepth > 0 && this.type === 'oscillator') {
            fmOsc = this.ctx.createOscillator();
            fmOsc.type = 'sine';
            fmOsc.frequency.value = targetFreq * this.fmRatio;
            
            fmGain = this.ctx.createGain();
            fmGain.gain.value = this.fmDepth * 10;
            
            fmOsc.connect(fmGain);
            fmGain.connect(source.frequency);
            fmOsc.start(time);
        }

        source.start(time);
        
        const sourceObj = { source, envGain, lfoOsc, fmOsc, freq: targetFreq };
        this.activeSources.push(sourceObj);
        return sourceObj;
    }
    
    stop(time, freqOverride = null) {
        const toStop = [];
        this.activeSources = this.activeSources.filter(srcObj => {
            const { source, envGain, lfoOsc, fmOsc, freq } = srcObj;
            if (freqOverride === null || freq === freqOverride) {
                envGain.gain.cancelScheduledValues(time);
                // Only set value if time is very close to now, else we don't know the exact value at 'time'
                // Actually it's safer to just linear ramp to 0 from the current value
                envGain.gain.setValueAtTime(envGain.gain.value, this.ctx.currentTime);
                envGain.gain.linearRampToValueAtTime(0, time + this.release);
                source.stop(time + this.release);
                if (lfoOsc) lfoOsc.stop(time + this.release);
                if (fmOsc) fmOsc.stop(time + this.release);
                
                toStop.push(srcObj);
                return false; // Remove from active sources array
            }
            return true;
        });
        
        // Wait! We actually DO want to remove it from activeSources immediately so we don't double stop it,
        // BUT the visualizer checks `activeSources.length > 0`.
        // To fix the visualizer, we can add a `stoppingSources` array, or just accept it.
        // The problem is Arpeggiator calls track.play() and then track.stop(time_in_future).
        // Since it's removed immediately, the next arpeggiator step's `if(lastArpFreq) track.stop()` 
        // does nothing (which is fine! it was already scheduled to stop).
        // Why wasn't arp working? 
    }
    
    // For Exporting
    cloneToOffline(offlineCtx, destination, time, offlineReverbImpulse) {
        const gainNode = offlineCtx.createGain();
        const pannerNode = offlineCtx.createPanner();
        pannerNode.panningModel = 'HRTF';
        pannerNode.positionX.value = this.panX;
        pannerNode.positionY.value = this.panY;
        pannerNode.positionZ.value = this.panZ;
        const filterNode = offlineCtx.createBiquadFilter();
        
        gainNode.gain.value = this.gain;
        
        filterNode.type = this.filterType;
        filterNode.frequency.value = this.filterFreq;
        filterNode.Q.value = this.filterQ;
        
        const distortionNode = offlineCtx.createWaveShaper();
        distortionNode.curve = this.makeDistortionCurve(this.distortionAmount);
        distortionNode.oversample = '4x';
        
        const delayNode = offlineCtx.createDelay();
        delayNode.delayTime.value = this.delayTime;
        const delayFeedbackNode = offlineCtx.createGain();
        delayFeedbackNode.gain.value = this.delayFeedback;
        const delayMixNode = offlineCtx.createGain();
        delayMixNode.gain.value = 1;
        
        const delayWetGain = offlineCtx.createGain();
        delayWetGain.gain.value = 1;
        
        delayNode.connect(delayFeedbackNode);
        delayFeedbackNode.connect(delayNode);
        delayNode.connect(delayWetGain);
        
        const reverbNode = offlineCtx.createConvolver();
        if (offlineReverbImpulse) reverbNode.buffer = offlineReverbImpulse;
        const reverbWetNode = offlineCtx.createGain();
        reverbWetNode.gain.value = this.reverbMix;
        const reverbDryNode = offlineCtx.createGain();
        reverbDryNode.gain.value = 1 - this.reverbMix;
        
        filterNode.connect(distortionNode);
        distortionNode.connect(delayNode);
        distortionNode.connect(delayMixNode);
        
        delayMixNode.connect(reverbNode);
        delayMixNode.connect(reverbDryNode);
        delayWetGain.connect(reverbNode);
        delayWetGain.connect(reverbDryNode);
        
        reverbNode.connect(reverbWetNode);
        reverbWetNode.connect(pannerNode);
        reverbDryNode.connect(pannerNode);
        
        pannerNode.connect(gainNode);
        gainNode.connect(destination);
        
        let source;
        if (this.type === 'oscillator') {
            source = offlineCtx.createOscillator();
            if (this.waveType === 'custom' && this.customWaveData) {
                try {
                    const customOffline = offlineCtx.createPeriodicWave(this.customWaveData.real, this.customWaveData.imag);
                    source.setPeriodicWave(customOffline);
                } catch(e) { source.type = 'sine'; }
            } else {
                source.type = this.waveType;
            }
            source.frequency.value = this.frequency;
            source.detune.value = this.detune;
        } else if (this.type === 'buffer' && this.buffer) {
            source = offlineCtx.createBufferSource();
            source.buffer = this.buffer;
            source.detune.value = this.detune;
            source.playbackRate.value = this.frequency / 440;
        } else {
            return;
        }
        
        const envGain = offlineCtx.createGain();
        envGain.gain.setValueAtTime(0, time);
        envGain.gain.linearRampToValueAtTime(1, time + this.attack);
        envGain.gain.linearRampToValueAtTime(this.sustain, time + this.attack + this.decay);
        const sustainDuration = 5.0; 
        envGain.gain.setValueAtTime(this.sustain, time + this.attack + this.decay + sustainDuration);
        envGain.gain.linearRampToValueAtTime(0, time + this.attack + this.decay + sustainDuration + this.release);
        
        source.connect(envGain);
        envGain.connect(filterNode);
        
        let lfoOsc = null;
        if (this.lfoTarget !== 'none' && this.lfoDepth > 0) {
            lfoOsc = offlineCtx.createOscillator();
            lfoOsc.type = 'sine';
            lfoOsc.frequency.value = this.lfoRate;
            let lfoGain = offlineCtx.createGain();
            
            if (this.lfoTarget === 'pitch') {
                lfoGain.gain.value = this.lfoDepth * 10;
                if (source.detune) {
                    lfoOsc.connect(lfoGain);
                    lfoGain.connect(source.detune);
                }
            } else if (this.lfoTarget === 'filter') {
                lfoGain.gain.value = this.lfoDepth * 50;
                lfoOsc.connect(lfoGain);
                lfoGain.connect(filterNode.frequency);
            }
            lfoOsc.start(time);
            lfoOsc.stop(time + this.attack + this.decay + sustainDuration + this.release);
        }
        
        
        // FM Modulator
        let fmOsc = null;
        let fmGain = null;
        if (this.fmDepth > 0 && this.type === 'oscillator') {
            fmOsc = this.ctx.createOscillator();
            fmOsc.type = 'sine';
            fmOsc.frequency.value = targetFreq * this.fmRatio;
            
            fmGain = this.ctx.createGain();
            fmGain.gain.value = this.fmDepth * 10;
            
            fmOsc.connect(fmGain);
            fmGain.connect(source.frequency);
            fmOsc.start(time);
        }

        source.start(time);
        source.stop(time + this.attack + this.decay + sustainDuration + this.release);
    }
}
