/** * Hacker-Sim: Web Audio API Synthesizers 
 */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClick() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.03);
}

function playError() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}

function playSuccess() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    let startTime = audioCtx.currentTime;
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, startTime + (i * 0.1)); gain.gain.exponentialRampToValueAtTime(0.01, startTime + (i * 0.1) + 0.3);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(startTime + (i * 0.1)); osc.stop(startTime + (i * 0.1) + 0.4);
    });
}

function playStartup() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc1 = audioCtx.createOscillator(); const osc2 = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc1.type = 'sine'; osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(220, audioCtx.currentTime); osc1.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.5); 
    osc2.frequency.setValueAtTime(110, audioCtx.currentTime); osc2.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 1.5); 
    gain.gain.setValueAtTime(0, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.5); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);
    osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
    osc1.start(); osc2.start(); osc1.stop(audioCtx.currentTime + 2.5); osc2.stop(audioCtx.currentTime + 2.5);
}

function playDialUp() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const osc2 = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc2.type = 'square';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 1);
    osc2.frequency.setValueAtTime(800, audioCtx.currentTime); osc2.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
    osc.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc2.start(); osc.stop(audioCtx.currentTime + 2); osc2.stop(audioCtx.currentTime + 2);
}

function playTune() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const notes = [440, 554, 659, 880, 659, 554, 440];
    let startTime = audioCtx.currentTime;
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, startTime + (i * 0.15)); gain.gain.exponentialRampToValueAtTime(0.01, startTime + (i * 0.15) + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(startTime + (i * 0.15)); osc.stop(startTime + (i * 0.15) + 0.15);
    });
}