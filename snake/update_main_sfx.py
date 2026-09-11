import re

with open('src/main.js', 'r', encoding='utf-8') as f:
    js = f.read()

dom_els = '''
const cfgSfx = document.getElementById('cfg-sfx');
const cfgVol = document.getElementById('cfg-vol');
const cfgWinScore = document.getElementById('cfg-win-score');
'''
js = js.replace("const cfgRenderStyle = document.getElementById('cfg-render-style');", "const cfgRenderStyle = document.getElementById('cfg-render-style');" + dom_els)

config_mapping = '''
    winScore: parseInt(cfgWinScore.value, 10) || 0,
'''
js = js.replace('allow180: cfgAllow180.checked,', 'allow180: cfgAllow180.checked,' + config_mapping)

ui_mapping = '''
  cfgWinScore.value = engine.config.winScore || 0;
'''
js = js.replace('cfgAllow180.checked = engine.config.allow180;', 'cfgAllow180.checked = engine.config.allow180;' + ui_mapping)

audio_engine = '''
// ---- Synthesizer Audio Engine ----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, duration, volMod = 1) {
  if (!cfgSfx.checked) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  const masterVol = (parseInt(cfgVol.value, 10) / 100) * 0.2; // Base volume reduction
  gain.gain.setValueAtTime(masterVol * volMod, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

engine.on('eat', (data) => {
  if (data.type === 'GOLDEN') {
    playTone(600, 'sine', 0.1, 1);
    setTimeout(() => playTone(800, 'sine', 0.2, 1), 100);
  } else if (data.type === 'POISON') {
    playTone(200, 'sawtooth', 0.3, 1);
  } else {
    playTone(400, 'square', 0.1, 0.5);
    setTimeout(() => playTone(600, 'square', 0.1, 0.5), 50);
  }
});

engine.on('collision', () => {
  playTone(150, 'sawtooth', 0.3, 1);
});

engine.on('gameover', () => {
  playTone(100, 'sawtooth', 0.5, 1.5);
  setTimeout(() => playTone(80, 'sawtooth', 0.8, 1.5), 300);
});

engine.on('victory', () => {
  playTone(400, 'sine', 0.2, 1);
  setTimeout(() => playTone(500, 'sine', 0.2, 1), 200);
  setTimeout(() => playTone(600, 'sine', 0.4, 1), 400);
});
'''
js = js.replace('// Run bot before each tick', audio_engine + '\n// Run bot before each tick')

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('main.js updated with audio engine!')
