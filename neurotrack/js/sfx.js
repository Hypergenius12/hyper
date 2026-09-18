let audioCtx = null;
let engineOsc = null;
let engineGain = null;
let isAudioInitialized = false;

function initAudio() {
    if (isAudioInitialized) {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return;
    }
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        
        // Engine sound: low saw wave
        engineOsc = audioCtx.createOscillator();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = 50; // Idle freq
        
        engineGain = audioCtx.createGain();
        engineGain.gain.value = 0; // Start silent
        
        // Lowpass filter to muffle the harsh saw
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        
        engineOsc.connect(filter);
        filter.connect(engineGain);
        engineGain.connect(audioCtx.destination);
        
        engineOsc.start();
        isAudioInitialized = true;
    } catch (e) {
        console.warn('Web Audio API not supported', e);
    }
}

// Auto-unlock audio on first user key or click
window.addEventListener('keydown', () => { initAudio(); }, { once: true });
window.addEventListener('pointerdown', () => { initAudio(); }, { once: true });

function updateAudio(playerCar) {
    if (!isAudioInitialized || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    
    // Map speed to frequency and volume
    const speedRatio = Math.abs(playerCar.speed) / playerCar.maxSpeed;
    
    // Idle 50Hz, max 250Hz
    const targetFreq = 50 + speedRatio * 200;
    engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
    
    // Vol
    const targetVol = 0.05 + speedRatio * 0.15;
    engineGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.1);
}

function playCrashSound() {
    if (!isAudioInitialized || !audioCtx) return;
    
    // Noise burst
    const bufferSize = audioCtx.sampleRate * 0.3; // 0.3 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5; // Scale down a bit
    }
    
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800; // Deep crash
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noiseSource.start();
}

function stopAudio() {
    if (!isAudioInitialized) return;
    engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
}

function playTeleportSound() {
    if (!isAudioInitialized || !audioCtx) return;
    try {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    } catch (e) {}
}
