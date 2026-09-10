const fs = require('fs');

let enginePath = '/Users/2013mbp4gb128gb/Downloads/hypergenius12/excavator/js/engine.js';
let engine = fs.readFileSync(enginePath, 'utf8');

const audioLogic = `
  initAudio() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio not supported");
    }
  }

  playSFX(type) {
    if (!this.audioCtx) return;
    const sfxToggle = document.getElementById('setting-sfx');
    if (sfxToggle && !sfxToggle.checked) return;

    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    const now = this.audioCtx.currentTime;
    
    if (type === 'mine') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150 + Math.random() * 50, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'crit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300 + Math.random() * 100, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'collapse') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(20, now + 0.4);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }
`;

engine = engine.replace("initAudio() {", audioLogic + "\n  //");

fs.writeFileSync(enginePath, engine);
