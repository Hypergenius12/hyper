let audioCtx = null;
let engineOsc = null;
let engineGain = null;
let isAudioInitialized = false;

function initAudio() {
    if (isAudioInitialized) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return;
    }
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        
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

function updateAudio(playerCar) {
    if (!isAudioInitialized || !audioCtx) return;
    
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
