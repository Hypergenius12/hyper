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
        
        // Voice Mode & Playability (Portamento / Glide / Velocity)
        this.voiceMode = 'poly'; // 'poly', 'mono', 'legato'
        this.glideTime = 0.05; // seconds (0 to 1.0s)
        this.velocitySensitivity = 1.0; // 0 to 1.0
        this.pitchBend = 0; // cents (-200 to +200)
        this.heldNotes = []; // Stack of held notes for Mono/Legato [{ freq, velocity, time }]
        this.currentMonoVoice = null; // Active voice in Mono/Legato mode
        
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
        this.glideTime = clamp(jitter(this.glideTime, 0.05), 0, 1);
        
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
            voiceMode: this.voiceMode,
            glideTime: this.glideTime,
            velocitySensitivity: this.velocitySensitivity,
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
        if (this.voiceMode === undefined) this.voiceMode = 'poly';
        if (this.glideTime === undefined) this.glideTime = 0.05;
        if (this.velocitySensitivity === undefined) this.velocitySensitivity = 1.0;
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

        // Update real-time pitch bend on active sources
        if (this.activeSources && this.activeSources.length > 0) {
            this.activeSources.forEach(({ source }) => {
                if (source && source.detune) {
                    source.detune.setValueAtTime(this.detune + this.pitchBend, this.ctx.currentTime);
                }
            });
        }
    }

    setPitchBend(cents) {
        this.pitchBend = cents;
        if (this.activeSources && this.activeSources.length > 0) {
            this.activeSources.forEach(({ source }) => {
                if (source && source.detune) {
                    source.detune.setValueAtTime(this.detune + this.pitchBend, this.ctx.currentTime);
                }
            });
        }
    }
    
    connect(destination) {
        this.destination = destination;
        this.gainNode.connect(destination);
    }
    
    disconnect() {
        this.gainNode.disconnect();
    }

    _calculateVelocityGain(velocity) {
        const vel = Math.max(0, Math.min(1, typeof velocity === 'number' ? velocity : 1.0));
        // Exponential velocity curve blended with sensitivity
        const scaledCurve = Math.pow(vel, 1.4);
        return scaledCurve * this.velocitySensitivity + (1.0 - this.velocitySensitivity);
    }

    _createVoice(time, targetFreq, velGain) {
        let source;
        if (this.type === 'oscillator') {
            source = this.ctx.createOscillator();
            if (this.waveType === 'custom' && this.customWave) {
                source.setPeriodicWave(this.customWave);
            } else {
                source.type = this.waveType;
            }
            source.frequency.value = targetFreq;
            source.detune.value = this.detune + this.pitchBend;
        } else if (this.type === 'buffer' && this.buffer) {
            source = this.ctx.createBufferSource();
            source.buffer = this.buffer;
            source.detune.value = this.detune + this.pitchBend;
            source.playbackRate.value = targetFreq / 440;
        } else {
            return null;
        }

        const envGain = this.ctx.createGain();
        envGain.gain.setValueAtTime(0, time);
        envGain.gain.linearRampToValueAtTime(velGain, time + Math.max(0.001, this.attack));
        envGain.gain.linearRampToValueAtTime(velGain * this.sustain, time + Math.max(0.001, this.attack) + Math.max(0.001, this.decay));

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
                lfoGain.gain.value = this.lfoDepth * 10;
                if (source.detune) {
                    lfoOsc.connect(lfoGain);
                    lfoGain.connect(source.detune);
                }
            } else if (this.lfoTarget === 'filter') {
                lfoGain.gain.value = this.lfoDepth * 50;
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

        return {
            source,
            envGain,
            lfoOsc,
            lfoGain,
            fmOsc,
            fmGain,
            freq: targetFreq,
            currentFreq: targetFreq,
            velGain,
            startTime: time
        };
    }
    
    play(time, freqOverride = null, velocity = 1.0) {
        const targetFreq = freqOverride !== null ? freqOverride : this.frequency;
        const velGain = this._calculateVelocityGain(velocity);

        // --- POLYPHONIC MODE ---
        if (this.voiceMode === 'poly') {
            const voice = this._createVoice(time, targetFreq, velGain);
            if (voice) {
                this.activeSources.push(voice);
            }
            return voice;
        }

        // --- MONOPHONIC & LEGATO MODES ---
        // Push note to held stack (remove previous duplicate if any)
        this.heldNotes = this.heldNotes.filter(n => Math.abs(n.freq - targetFreq) > 0.01);
        this.heldNotes.push({ freq: targetFreq, velocity, velGain, time });

        if (this.currentMonoVoice && this.currentMonoVoice.source) {
            const voice = this.currentMonoVoice;
            const prevFreq = voice.currentFreq || voice.freq;
            const glideDur = Math.max(0.001, this.glideTime);

            // 1. Portamento / Glide Pitch Transition
            if (voice.source.frequency) {
                voice.source.frequency.cancelScheduledValues(time);
                voice.source.frequency.setValueAtTime(prevFreq, time);
                if (this.glideTime > 0.002) {
                    voice.source.frequency.exponentialRampToValueAtTime(Math.max(10, targetFreq), time + glideDur);
                } else {
                    voice.source.frequency.setValueAtTime(targetFreq, time);
                }
            } else if (voice.source.playbackRate) {
                // For sample buffers
                voice.source.playbackRate.cancelScheduledValues(time);
                voice.source.playbackRate.setValueAtTime(prevFreq / 440, time);
                if (this.glideTime > 0.002) {
                    voice.source.playbackRate.exponentialRampToValueAtTime(Math.max(0.01, targetFreq / 440), time + glideDur);
                } else {
                    voice.source.playbackRate.setValueAtTime(targetFreq / 440, time);
                }
            }

            // Glide FM modulator frequency if present
            if (voice.fmOsc) {
                voice.fmOsc.frequency.cancelScheduledValues(time);
                voice.fmOsc.frequency.setValueAtTime(prevFreq * this.fmRatio, time);
                if (this.glideTime > 0.002) {
                    voice.fmOsc.frequency.exponentialRampToValueAtTime(Math.max(10, targetFreq * this.fmRatio), time + glideDur);
                } else {
                    voice.fmOsc.frequency.setValueAtTime(targetFreq * this.fmRatio, time);
                }
            }

            voice.currentFreq = targetFreq;
            voice.velGain = velGain;

            // 2. Envelope Handling: Mono vs Legato
            if (this.voiceMode === 'mono') {
                // Mono: Retrigger ADSR envelope on every note
                const curVal = voice.envGain.gain.value;
                voice.envGain.gain.cancelScheduledValues(time);
                voice.envGain.gain.setValueAtTime(curVal, time);
                voice.envGain.gain.linearRampToValueAtTime(velGain, time + Math.max(0.001, this.attack));
                voice.envGain.gain.linearRampToValueAtTime(velGain * this.sustain, time + Math.max(0.001, this.attack) + Math.max(0.001, this.decay));
            } else if (this.voiceMode === 'legato') {
                // Legato: Do NOT retrigger attack envelope! Smoothly adjust sustain level to new velocity
                voice.envGain.gain.cancelScheduledValues(time);
                voice.envGain.gain.linearRampToValueAtTime(velGain * this.sustain, time + 0.02);
            }

            return voice;
        } else {
            // No active mono voice running: trigger fresh attack
            const voice = this._createVoice(time, targetFreq, velGain);
            if (voice) {
                this.currentMonoVoice = voice;
                this.activeSources = [voice];
            }
            return voice;
        }
    }
    
    stop(time, freqOverride = null) {
        // --- POLYPHONIC MODE ---
        if (this.voiceMode === 'poly') {
            const rel = Math.max(0.001, this.release);
            this.activeSources = this.activeSources.filter(srcObj => {
                const { source, envGain, lfoOsc, fmOsc, freq } = srcObj;
                if (freqOverride === null || Math.abs(freq - freqOverride) < 0.01) {
                    envGain.gain.cancelScheduledValues(time);
                    envGain.gain.setValueAtTime(envGain.gain.value, this.ctx.currentTime);
                    envGain.gain.linearRampToValueAtTime(0, time + rel);
                    source.stop(time + rel);
                    if (lfoOsc) lfoOsc.stop(time + rel);
                    if (fmOsc) fmOsc.stop(time + rel);
                    return false;
                }
                return true;
            });
            return;
        }

        // --- MONOPHONIC & LEGATO MODES ---
        if (freqOverride !== null) {
            this.heldNotes = this.heldNotes.filter(n => Math.abs(n.freq - freqOverride) > 0.01);
        } else {
            this.heldNotes = [];
        }

        if (this.heldNotes.length > 0) {
            // Keys are still held down: glide back to most recent held note (last-note priority)
            const priorNote = this.heldNotes[this.heldNotes.length - 1];
            if (this.currentMonoVoice && this.currentMonoVoice.source) {
                const voice = this.currentMonoVoice;
                const prevFreq = voice.currentFreq || voice.freq;
                const targetFreq = priorNote.freq;
                const glideDur = Math.max(0.001, this.glideTime);

                if (voice.source.frequency) {
                    voice.source.frequency.cancelScheduledValues(time);
                    voice.source.frequency.setValueAtTime(prevFreq, time);
                    if (this.glideTime > 0.002) {
                        voice.source.frequency.exponentialRampToValueAtTime(Math.max(10, targetFreq), time + glideDur);
                    } else {
                        voice.source.frequency.setValueAtTime(targetFreq, time);
                    }
                } else if (voice.source.playbackRate) {
                    voice.source.playbackRate.cancelScheduledValues(time);
                    voice.source.playbackRate.setValueAtTime(prevFreq / 440, time);
                    if (this.glideTime > 0.002) {
                        voice.source.playbackRate.exponentialRampToValueAtTime(Math.max(0.01, targetFreq / 440), time + glideDur);
                    } else {
                        voice.source.playbackRate.setValueAtTime(targetFreq / 440, time);
                    }
                }

                if (voice.fmOsc) {
                    voice.fmOsc.frequency.cancelScheduledValues(time);
                    voice.fmOsc.frequency.setValueAtTime(prevFreq * this.fmRatio, time);
                    if (this.glideTime > 0.002) {
                        voice.fmOsc.frequency.exponentialRampToValueAtTime(Math.max(10, targetFreq * this.fmRatio), time + glideDur);
                    } else {
                        voice.fmOsc.frequency.setValueAtTime(targetFreq * this.fmRatio, time);
                    }
                }

                voice.currentFreq = targetFreq;
                voice.velGain = priorNote.velGain;

                if (this.voiceMode === 'mono') {
                    // Retrigger envelope when falling back to held note in mono
                    const curVal = voice.envGain.gain.value;
                    voice.envGain.gain.cancelScheduledValues(time);
                    voice.envGain.gain.setValueAtTime(curVal, time);
                    voice.envGain.gain.linearRampToValueAtTime(priorNote.velGain, time + Math.max(0.001, this.attack));
                    voice.envGain.gain.linearRampToValueAtTime(priorNote.velGain * this.sustain, time + Math.max(0.001, this.attack) + Math.max(0.001, this.decay));
                } else if (this.voiceMode === 'legato') {
                    // Legato: smoothly sustain prior note
                    voice.envGain.gain.cancelScheduledValues(time);
                    voice.envGain.gain.linearRampToValueAtTime(priorNote.velGain * this.sustain, time + 0.02);
                }
            }
        } else {
            // No keys held: Release envelope to 0 and terminate mono voice
            if (this.currentMonoVoice) {
                const { source, envGain, lfoOsc, fmOsc } = this.currentMonoVoice;
                const rel = Math.max(0.001, this.release);
                envGain.gain.cancelScheduledValues(time);
                envGain.gain.setValueAtTime(envGain.gain.value, this.ctx.currentTime);
                envGain.gain.linearRampToValueAtTime(0, time + rel);
                source.stop(time + rel);
                if (lfoOsc) lfoOsc.stop(time + rel);
                if (fmOsc) fmOsc.stop(time + rel);
                this.currentMonoVoice = null;
                this.activeSources = [];
            }
        }
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
            fmOsc.frequency.value = this.frequency * this.fmRatio;
            
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
