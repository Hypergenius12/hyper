const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const uiPanel = document.getElementById('ui-panel');
const btnTogglePanel = document.getElementById('toggle-panel');
const btnRestorePanel = document.getElementById('btn-restore-panel');

const btnAdd = document.getElementById('btn-add');
const btnRemove = document.getElementById('btn-remove');
const btnClear = document.getElementById('btn-clear');
const btnReset = document.getElementById('btn-reset');
const inpSpawnAmount = document.getElementById('spawn-amount');
const txtLogoCount = document.getElementById('logo-count');
const statWall = document.getElementById('stat-wall');
const statCorner = document.getElementById('stat-corner');
const cornerFlash = document.getElementById('corner-flash');
const vhsOverlay = document.getElementById('vhs-overlay');
const vhsText = document.getElementById('vhs-text');

const selAudioScale = document.getElementById('audio-scale');
const selAudioSynth = document.getElementById('audio-synth');
const selAudioStyle = document.getElementById('audio-style');
const sldFilter = document.getElementById('filter-slider');
const txtFilter = document.getElementById('filter-val');
const tglEcho = document.getElementById('echo-toggle');

const sldSpeed = document.getElementById('speed-slider');
const txtSpeed = document.getElementById('speed-val');
const sldSize = document.getElementById('size-slider');
const txtSize = document.getElementById('size-val');
const sldRepel = document.getElementById('repel-slider');
const txtRepel = document.getElementById('repel-val');

const tglRepel = document.getElementById('repel-toggle');
const tglChaos = document.getElementById('chaos-toggle');
const tglDisco = document.getElementById('disco-toggle');
const tglTrail = document.getElementById('trail-toggle');
const tglSfx = document.getElementById('sfx-toggle');
const tglFlash = document.getElementById('flash-toggle');
const tglVhs = document.getElementById('vhs-toggle');

// =======================
// FIREBASE LEADERBOARD
// =======================
const firebaseConfig = {
  // TODO: PASTE YOUR FIREBASE CONFIG HERE
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let dbRef = null;
let runFbTransaction = null;
const globalHitsEl = document.getElementById('global-hits-val');

setTimeout(() => {
  if (window.firebaseModules && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
      const app = window.firebaseModules.initializeApp(firebaseConfig);
      const db = window.firebaseModules.getDatabase(app);
      dbRef = window.firebaseModules.ref(db, 'globalCornerHits');
      runFbTransaction = window.firebaseModules.runTransaction;
      
      // Listen for live updates
      window.firebaseModules.onValue(dbRef, (snapshot) => {
        const val = snapshot.val();
        if (val !== null) globalHitsEl.textContent = val;
      });
    } catch(e) {
      console.error("Firebase Initialization Error", e);
      globalHitsEl.textContent = "ERR";
    }
  } else {
    // Reminder for user to set up Firebase
    globalHitsEl.textContent = "0 (SETUP FIREBASE)";
  }
}, 1000); // delay to ensure module scripts load

// =======================
// AUDIO ENGINE (ADVANCED)
// =======================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let sfxEnabled = true;
let echoEnabled = true;

// Master Bus
const compressor = audioCtx.createDynamicsCompressor();
compressor.threshold.setValueAtTime(-15, audioCtx.currentTime);
compressor.knee.setValueAtTime(10, audioCtx.currentTime);
compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
compressor.attack.setValueAtTime(0, audioCtx.currentTime);
compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.8;

const globalFilter = audioCtx.createBiquadFilter();
globalFilter.type = 'lowpass';
globalFilter.frequency.value = 8000;

// Delay Bus
const delayNode = audioCtx.createDelay(2.0);
delayNode.delayTime.value = 0.4; // 400ms delay
const feedbackGain = audioCtx.createGain();
feedbackGain.gain.value = 0.4;
delayNode.connect(feedbackGain);
feedbackGain.connect(delayNode);

// Routing
globalFilter.connect(masterGain);
masterGain.connect(compressor);
compressor.connect(audioCtx.destination);
delayNode.connect(globalFilter);

const SCALES = {
  pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00], // C Maj Pentatonic
  minor: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25, 587.33, 622.25], // C Minor
  lydian: [261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25], // C Lydian
  wholetone: [261.63, 293.66, 329.63, 369.99, 415.30, 466.16, 523.25, 587.33, 659.25, 739.99], // C Whole Tone
  blues: [261.63, 311.13, 349.23, 369.99, 392.00, 466.16, 523.25, 622.25, 698.46, 739.99], // C Blues
  chromatic: [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25] // Chromatic
};

function playBounce(yRatio) {
  if (!sfxEnabled) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const scale = SCALES[selAudioScale.value];
  let index = Math.floor((1 - yRatio) * scale.length);
  if (index < 0) index = 0;
  if (index >= scale.length) index = scale.length - 1;
  const freq = scale[index];
  
  const osc = audioCtx.createOscillator();
  const synthGain = audioCtx.createGain();
  
  osc.type = selAudioSynth.value;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  // Dynamic scaling based on logo count to prevent muddy pileups
  const baseVolume = 0.2 / Math.max(1, Math.sqrt(logos.length * 0.5));
  const style = selAudioStyle.value;
  
  synthGain.gain.setValueAtTime(0, audioCtx.currentTime);
  
  osc.connect(synthGain);
  synthGain.connect(globalFilter);
  if (echoEnabled) synthGain.connect(delayNode);
  
  osc.start();
  
  if (style === 'pad') {
    synthGain.gain.linearRampToValueAtTime(baseVolume, audioCtx.currentTime + 0.05);
    synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
    osc.stop(audioCtx.currentTime + 1.5);
  } else {
    // Pluck
    synthGain.gain.linearRampToValueAtTime(baseVolume * 1.5, audioCtx.currentTime + 0.01);
    synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.stop(audioCtx.currentTime + 0.2);
  }
}

function playCornerHit() {
  if (!sfxEnabled) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const baseVolume = 0.3 / Math.max(1, Math.sqrt(logos.length * 0.5));
  
  [300, 400, 600, 800].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const synthGain = audioCtx.createGain();
    osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq/2, audioCtx.currentTime + 0.5);
    
    synthGain.gain.setValueAtTime(baseVolume, audioCtx.currentTime);
    synthGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
    
    osc.connect(synthGain);
    synthGain.connect(globalFilter);
    if (echoEnabled) synthGain.connect(delayNode);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 1.0);
  });
}

// =======================
// PHYSICS & SIMULATION
// =======================
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

let globalSpeedMult = 1.0;
let globalScaleMult = 1.0;
let repelRadius = 150;
let repelEnabled = false;
let chaosEnabled = false;
let discoEnabled = false;
let trailEnabled = true;
let flashEnabled = true;
let vhsEnabled = false;

let wallHits = 0;
let cornerHits = 0;
let logos = [];

let mouseX = -1000;
let mouseY = -1000;
let globalHue = 0;

// Palette
const colors = [
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
  '#ff00ff', '#00ffff', '#ffffff', '#ff8800'
];

// Load DVD Logo SVG
const logoImg = new Image();
logoImg.src = 'dvd.svg';

class DVDLogo {
  constructor(spawnX, spawnY) {
    this.baseW = 200;
    this.baseH = 90;
    
    this.x = spawnX !== undefined ? spawnX - (this.baseW*globalScaleMult)/2 : Math.random() * (width - this.baseW);
    this.y = spawnY !== undefined ? spawnY - (this.baseH*globalScaleMult)/2 : Math.random() * (height - this.baseH);
    
    const angle = Math.random() * Math.PI * 2;
    this.dx = Math.cos(angle) * 4;
    this.dy = Math.sin(angle) * 4;
    
    if (Math.abs(this.dx) < 1) this.dx = this.dx < 0 ? -2 : 2;
    if (Math.abs(this.dy) < 1) this.dy = this.dy < 0 ? -2 : 2;

    this.colorIdx = Math.floor(Math.random() * colors.length);
    this.cacheCanvas = document.createElement('canvas');
    this.cacheCtx = this.cacheCanvas.getContext('2d');
    this.updateCache();
  }

  updateCache() {
    this.cacheCanvas.width = this.baseW;
    this.cacheCanvas.height = this.baseH;
    
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      this.cacheCtx.clearRect(0, 0, this.baseW, this.baseH);
      this.cacheCtx.drawImage(logoImg, 0, 0, this.baseW, this.baseH);
      this.cacheCtx.globalCompositeOperation = 'source-in';
      this.cacheCtx.fillStyle = colors[this.colorIdx];
      this.cacheCtx.fillRect(0, 0, this.baseW, this.baseH);
      this.cacheCtx.globalCompositeOperation = 'source-over';
    }
  }

  changeColor() {
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * colors.length);
    } while (nextIdx === this.colorIdx);
    this.colorIdx = nextIdx;
    this.updateCache();
  }

  update() {
    const w = this.baseW * globalScaleMult;
    const h = this.baseH * globalScaleMult;
    
    if (repelEnabled) {
      const cx = this.x + w/2;
      const cy = this.y + h/2;
      const dxMouse = cx - mouseX;
      const dyMouse = cy - mouseY;
      const dist = Math.sqrt(dxMouse*dxMouse + dyMouse*dyMouse);
      
      if (dist < repelRadius && dist > 0) {
        const force = (repelRadius - dist) / repelRadius;
        this.dx += (dxMouse / dist) * force * 2;
        this.dy += (dyMouse / dist) * force * 2;
        
        const currentSpeed = Math.sqrt(this.dx*this.dx + this.dy*this.dy);
        const targetSpeed = 4 + (chaosEnabled ? Math.random()*2 : 0);
        this.dx = (this.dx / currentSpeed) * targetSpeed;
        this.dy = (this.dy / currentSpeed) * targetSpeed;
      }
    }
    
    if (chaosEnabled) {
      if (Math.random() < 0.02) this.dx += (Math.random()-0.5) * 4;
      if (Math.random() < 0.02) this.dy += (Math.random()-0.5) * 4;
      
      if (this.dx > 10) this.dx = 10;
      if (this.dx < -10) this.dx = -10;
      if (this.dy > 10) this.dy = 10;
      if (this.dy < -10) this.dy = -10;
    }

    const nextX = this.x + this.dx * globalSpeedMult;
    const nextY = this.y + this.dy * globalSpeedMult;

    let hitX = false;
    let hitY = false;

    if (nextX <= 0) {
      this.x = 0;
      this.dx *= -1;
      hitX = true;
    } else if (nextX + w >= width) {
      this.x = width - w;
      this.dx *= -1;
      hitX = true;
    } else {
      this.x = nextX;
    }

    if (nextY <= 0) {
      this.y = 0;
      this.dy *= -1;
      hitY = true;
    } else if (nextY + h >= height) {
      this.y = height - h;
      this.dy *= -1;
      hitY = true;
    } else {
      this.y = nextY;
    }

    if (hitX || hitY) {
      this.changeColor();
      
      const maxH = height - h;
      const yRatio = maxH <= 0 ? 0.5 : (this.y / maxH);
      playBounce(yRatio);
      
      if (hitX && hitY) {
        cornerHits++;
        statCorner.textContent = cornerHits;
        triggerCornerHit();
      } else {
        wallHits++;
        statWall.textContent = wallHits;
      }
    }
  }

  draw() {
    const w = this.baseW * globalScaleMult;
    const h = this.baseH * globalScaleMult;

    if (logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.drawImage(this.cacheCanvas, this.x, this.y, w, h);
    } else {
      ctx.fillStyle = colors[this.colorIdx];
      ctx.fillRect(this.x, this.y, w, h);
    }
  }
}

function triggerCornerHit() {
  playCornerHit();
  
  if (dbRef && runFbTransaction) {
    runFbTransaction(dbRef, (currentValue) => {
      return (currentValue || 0) + 1;
    });
  }
  
  if (flashEnabled) {
    cornerFlash.classList.add('active');
    document.body.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px)`;
    setTimeout(() => {
      document.body.style.transform = 'translate(0,0)';
    }, 50);
    
    setTimeout(() => {
      cornerFlash.classList.remove('active');
    }, 2000);
  }
}

logoImg.onload = () => {
  logos.forEach(l => l.updateCache());
};

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

// Track Mouse
window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});
window.addEventListener('mouseout', () => {
  mouseX = -1000;
  mouseY = -1000;
});

// Menu toggles
btnTogglePanel.addEventListener('click', () => {
  uiPanel.style.display = 'none';
  btnRestorePanel.style.display = 'block';
});

btnRestorePanel.addEventListener('click', () => {
  uiPanel.style.display = 'flex';
  btnRestorePanel.style.display = 'none';
});

// Spawn Controls
btnAdd.addEventListener('click', () => {
  const amt = parseInt(inpSpawnAmount.value) || 1;
  for (let i = 0; i < amt; i++) {
    logos.push(new DVDLogo());
  }
  txtLogoCount.textContent = logos.length;
});

btnRemove.addEventListener('click', () => {
  const amt = parseInt(inpSpawnAmount.value) || 1;
  for (let i = 0; i < amt; i++) {
    if (logos.length > 0) logos.pop();
  }
  txtLogoCount.textContent = logos.length;
});

btnClear.addEventListener('click', () => {
  logos = [];
  txtLogoCount.textContent = 0;
});

btnReset.addEventListener('click', () => {
  wallHits = 0;
  cornerHits = 0;
  statWall.textContent = 0;
  statCorner.textContent = 0;
  logos = [new DVDLogo()];
  txtLogoCount.textContent = 1;
  
  globalSpeedMult = 1.0;
  globalScaleMult = 1.0;
  repelRadius = 150;
  sldSpeed.value = 1;
  sldSize.value = 1;
  sldRepel.value = 150;
  sldFilter.value = 8000;
  globalFilter.frequency.value = 8000;
  
  txtSpeed.textContent = "1.0x";
  txtSize.textContent = "1.0x";
  txtRepel.textContent = "150";
  txtFilter.textContent = "100%";
  
  selAudioScale.value = 'pentatonic';
  selAudioSynth.value = 'sine';
  selAudioStyle.value = 'pad';
  
  repelEnabled = false;
  chaosEnabled = false;
  discoEnabled = false;
  trailEnabled = true;
  sfxEnabled = true;
  echoEnabled = true;
  flashEnabled = true;
  vhsEnabled = false;
  
  tglRepel.checked = false;
  tglChaos.checked = false;
  tglDisco.checked = false;
  tglTrail.checked = true;
  tglSfx.checked = true;
  tglEcho.checked = true;
  tglFlash.checked = true;
  tglVhs.checked = false;
  
  vhsOverlay.classList.remove('active');
  vhsText.classList.remove('active');
});

canvas.addEventListener('mousedown', (e) => {
  if (e.target !== canvas) return;
  logos.push(new DVDLogo(e.clientX, e.clientY));
  txtLogoCount.textContent = logos.length;
});

// Sliders
sldSpeed.addEventListener('input', (e) => {
  globalSpeedMult = parseFloat(e.target.value);
  txtSpeed.textContent = globalSpeedMult.toFixed(1) + 'x';
});

sldSize.addEventListener('input', (e) => {
  globalScaleMult = parseFloat(e.target.value);
  txtSize.textContent = globalScaleMult.toFixed(1) + 'x';
  logos.forEach(l => {
    const w = l.baseW * globalScaleMult;
    const h = l.baseH * globalScaleMult;
    if (l.x + w > width) l.x = width - w;
    if (l.y + h > height) l.y = height - h;
  });
});

sldRepel.addEventListener('input', (e) => {
  repelRadius = parseInt(e.target.value);
  txtRepel.textContent = repelRadius;
});

sldFilter.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  globalFilter.frequency.value = val;
  txtFilter.textContent = Math.floor((val / 8000) * 100) + '%';
});

// Checkboxes
tglRepel.addEventListener('change', (e) => { repelEnabled = e.target.checked; });
tglChaos.addEventListener('change', (e) => { chaosEnabled = e.target.checked; });
tglDisco.addEventListener('change', (e) => { discoEnabled = e.target.checked; });
tglTrail.addEventListener('change', (e) => { trailEnabled = e.target.checked; });
tglSfx.addEventListener('change', (e) => { sfxEnabled = e.target.checked; });
tglEcho.addEventListener('change', (e) => { echoEnabled = e.target.checked; });
tglFlash.addEventListener('change', (e) => { flashEnabled = e.target.checked; });

tglVhs.addEventListener('change', (e) => {
  vhsEnabled = e.target.checked;
  if (vhsEnabled) {
    vhsOverlay.classList.add('active');
    vhsText.classList.add('active');
  } else {
    vhsOverlay.classList.remove('active');
    vhsText.classList.remove('active');
  }
});

// Render Loop
function animate() {
  globalHue = (globalHue + 0.5) % 360;

  if (trailEnabled) {
    if (discoEnabled) {
      ctx.fillStyle = `hsla(${globalHue}, 100%, 8%, 0.15)`;
    } else {
      ctx.fillStyle = `rgba(0, 0, 0, 0.15)`;
    }
    ctx.fillRect(0, 0, width, height);
  } else {
    if (discoEnabled) {
      ctx.fillStyle = `hsl(${globalHue}, 100%, 8%)`;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }

  logos.forEach(logo => {
    logo.update();
    logo.draw();
  });

  requestAnimationFrame(animate);
}

// Start
logos.push(new DVDLogo());
animate();
