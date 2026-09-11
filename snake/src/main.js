import { GameEngine } from './engine/GameEngine.js';
import { InputManager } from './engine/InputManager.js';
import { Renderer } from './engine/Renderer.js';

// ---- DOM Elements ----
const canvas = document.getElementById('game-canvas');
const scoreEl = document.getElementById('stat-score');
const lengthEl = document.getElementById('stat-length');
const ticksEl = document.getElementById('stat-ticks');
const speedStatEl = document.getElementById('stat-speed');
const statusEl = document.getElementById('stat-status');

const btnPause = document.getElementById('btn-pause');
const btnStep = document.getElementById('btn-step');
const btnRestart = document.getElementById('btn-restart');

// Config DOM
const cfgGridW = document.getElementById('cfg-grid-w');
const cfgGridH = document.getElementById('cfg-grid-h');
const cfgZoom = document.getElementById('cfg-zoom');
const cfgWrap = document.getElementById('cfg-wrap');
const cfgInvincWalls = document.getElementById('cfg-invinc-walls');
const cfgBouncyWalls = document.getElementById('cfg-bouncy-walls');
const cfgInvincTail = document.getElementById('cfg-invinc-tail');
const cfgInvert = document.getElementById('cfg-invert');
const cfgAllow180 = document.getElementById('cfg-allow-180');
const cfgAutoPilot = document.getElementById('cfg-auto-pilot');
const cfgAutoStart = document.getElementById('cfg-auto-start');
const cfgRndSpawn = document.getElementById('cfg-rnd-spawn');

const cfgSpeed = document.getElementById('cfg-speed');
const cfgSpeedup = document.getElementById('cfg-speedup');
const cfgInitLen = document.getElementById('cfg-init-len');
const cfgMaxLen = document.getElementById('cfg-max-len');
const cfgGrowth = document.getElementById('cfg-growth');
const cfgDecay = document.getElementById('cfg-decay');
const cfgHungerDamage = document.getElementById('cfg-hunger-damage');
const cfgTailChop = document.getElementById('cfg-tail-chop');
const cfgDropFood = document.getElementById('cfg-drop-food');

const cfgFoodCount = document.getElementById('cfg-food-count');
const cfgFoodLife = document.getElementById('cfg-food-life');
const cfgSpoilage = document.getElementById('cfg-spoilage');
const cfgPoisonLife = document.getElementById('cfg-poison-life');
const cfgTeleport = document.getElementById('cfg-teleport');
const cfgFoodEvade = document.getElementById('cfg-food-evade');
const cfgScoreDrain = document.getElementById('cfg-score-drain');
const cfgScoreN = document.getElementById('cfg-score-n');
const cfgScoreG = document.getElementById('cfg-score-g');
const cfgScoreP = document.getElementById('cfg-score-p');
const cfgGoldPct = document.getElementById('cfg-gold-pct');
const cfgPoisonPct = document.getElementById('cfg-poison-pct');
const cfgObstacles = document.getElementById('cfg-obstacles');
const cfgObsSpawnPct = document.getElementById('cfg-obs-spawn-pct');
const cfgObsWander = document.getElementById('cfg-obs-wander');
const cfgPoisonBomb = document.getElementById('cfg-poison-bomb');
const cfgInvisObs = document.getElementById('cfg-invis-obs');

const cfgShowGrid = document.getElementById('cfg-show-grid');
const cfgRainbow = document.getElementById('cfg-rainbow');
const cfgScreenShake = document.getElementById('cfg-screen-shake');
const cfgFog = document.getElementById('cfg-fog');
const cfgScramble = document.getElementById('cfg-scramble');
const cfgDrunk = document.getElementById('cfg-drunk');
const cfgAppleGravity = document.getElementById('cfg-apple-gravity');
const cfgAppleMult = document.getElementById('cfg-apple-mult');
const cfgRndTeleport = document.getElementById('cfg-rnd-teleport');
const cfgPoopRocks = document.getElementById('cfg-poop-rocks');
const cfgAcidMode = document.getElementById('cfg-acid-mode');
const cfgShrink = document.getElementById('cfg-shrink');
const cfgRevApple = document.getElementById('cfg-rev-apple');
const cfgTornado = document.getElementById('cfg-tornado');
const cfgInvertCols = document.getElementById('cfg-invert-cols');
const cfgLenSpeed = document.getElementById('cfg-len-speed');
const cfgAppleWander = document.getElementById('cfg-apple-wander');
const cfgRenderStyle = document.getElementById('cfg-render-style');
const cfgSfx = document.getElementById('cfg-sfx');
const cfgVol = document.getElementById('cfg-vol');
const cfgWinScore = document.getElementById('cfg-win-score');

const cfgGhostPct = document.getElementById('cfg-ghost-pct');
const cfgGhostDur = document.getElementById('cfg-ghost-dur');
const cfgFatness = document.getElementById('cfg-fatness');
const cfgColGhost = document.getElementById('cfg-col-ghost');
const cfgGhostWalls = document.getElementById('cfg-ghost-walls');
const cfgExplodePct = document.getElementById('cfg-explode-pct');






const cfgColBg = document.getElementById('cfg-col-bg');
const cfgColGrid = document.getElementById('cfg-col-grid');
const cfgColHead = document.getElementById('cfg-col-head');
const cfgColBody = document.getElementById('cfg-col-body');
const cfgColFood = document.getElementById('cfg-col-food');
const cfgColGold = document.getElementById('cfg-col-gold');
const cfgColPoison = document.getElementById('cfg-col-poison');
const cfgColObs = document.getElementById('cfg-col-obs');

const btnApplyCfg = document.getElementById('btn-apply-cfg');

// Bot DOM
const botCodeEl = document.getElementById('bot-code');
const btnInjectBot = document.getElementById('btn-inject-bot');
const btnStopBot = document.getElementById('btn-stop-bot');
const botStatus = document.getElementById('bot-status');

// Export DOM
const btnExportCfg = document.getElementById('btn-export-cfg');
const fileCfg = document.getElementById('file-cfg');

// Modal DOM
const apiModal = document.getElementById('api-modal');
const btnApiGuide = document.getElementById('btn-api-guide');
const btnCloseModal = document.getElementById('btn-close-modal');

// ---- Initialization ----
const engine = new GameEngine();
const input = new InputManager();
const renderer = new Renderer(canvas, engine);

let activeBot = null;
let loadedMacro = null;

// ---- Bot Utils API ----
const botUtils = {
  distance: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
  isWalkable: (x, y, state) => {
    let chkX = x;
    let chkY = y;
    if (state.config.wrapWalls) {
      chkX = (chkX + state.config.gridWidth) % state.config.gridWidth;
      chkY = (chkY + state.config.gridHeight) % state.config.gridHeight;
    } else {
      if (chkX < 0 || chkX >= state.config.gridWidth || chkY < 0 || chkY >= state.config.gridHeight) {
        return !!state.config.invincibleWalls || !!state.config.bouncyWalls; 
      }
    }

    if (state.obstacles.some(o => o.x === chkX && o.y === chkY)) {
      if (!state.config.invincibleWalls) return false;
    }

    if (!state.config.invincibleTail) {
      const isGrowing = state.growthBuffer > 0;
      const bodyToCheck = isGrowing ? state.snake : state.snake.slice(0, -1);
      if (bodyToCheck.some(seg => seg.x === chkX && seg.y === chkY)) {
        return false;
      }
    }
    return true;
  }
};

// ---- Modal Logic ----
btnApiGuide?.addEventListener('click', () => {
  apiModal.showModal();
});
btnCloseModal?.addEventListener('click', () => {
  apiModal.close();
});

// ---- Inputs ----
input.onAction((action, source) => {
  switch (action) {
    case 'UP':
    case 'DOWN':
    case 'LEFT':
    case 'RIGHT':
      engine.setDirection(action);
      break;
    case 'PAUSE':
      engine.togglePause();
      break;
    case 'STEP':
      engine.step();
      break;
    case 'RESTART':
      engine.reset();
      engine.start();
      break;
  }
});

// Update HUD
function updateHUD() {
  const state = engine.getState();
  if (scoreEl) scoreEl.textContent = state.score;
  if (lengthEl) lengthEl.textContent = state.snake.length;
  if (ticksEl) ticksEl.textContent = state.tickCount;
  if (speedStatEl) speedStatEl.textContent = state.currentTickRate;
  if (statusEl) statusEl.textContent = state.status;
  if (btnPause) btnPause.textContent = state.status === 'RUNNING' ? 'Pause' : 'Resume';
}

engine.on('tick', () => updateHUD());
engine.on('stateChange', () => updateHUD());
engine.on('eat', () => updateHUD());
engine.on('reset', () => updateHUD());

// Primary Controls
btnPause?.addEventListener('click', () => engine.togglePause());
btnStep?.addEventListener('click', () => engine.step());
btnRestart?.addEventListener('click', () => { engine.reset(); engine.start(); });

// ---- Config / Settings Logic ----
function applyConfigFromUI() {
  const newConfig = {
    gridWidth: parseInt(cfgGridW.value, 10),
    gridHeight: parseInt(cfgGridH.value, 10),
    wrapWalls: cfgWrap.checked,
    invincibleWalls: cfgInvincWalls.checked,
    bouncyWalls: cfgBouncyWalls.checked,
    invincibleTail: cfgInvincTail.checked,
    invertControls: cfgInvert.checked,
    allow180: cfgAllow180.checked,
    winScore: parseInt(cfgWinScore.value, 10) || 0,

        ghostWalls: cfgGhostWalls?.checked ?? false,
    explodingAppleChance: parseFloat(cfgExplodePct?.value) / 100 || 0,
ghostAppleChance: parseFloat(cfgGhostPct.value) / 100 || 0,
    ghostDurationTicks: parseInt(cfgGhostDur.value, 10) || 30,
    snakeFatness: parseFloat(cfgFatness.value) || 1.0,
    colorFoodGhost: cfgColGhost.value,


    autoPilotAssist: cfgAutoPilot.checked,
    autoStart: cfgAutoStart.checked,
    randomSpawn: cfgRndSpawn.checked,
    
    tickRateMs: parseFloat(cfgSpeed.value) || 120,
    speedUpMs: parseFloat(cfgSpeedup.value) || 0,
    initialLength: parseInt(cfgInitLen.value, 10),
    maxSnakeLength: parseInt(cfgMaxLen.value, 10),
    growthPerFood: parseFloat(cfgGrowth.value) || 0,
    tailDecayTicks: parseInt(cfgDecay.value, 10),
    tailChop: cfgTailChop.checked,
    dropFoodOnChop: cfgDropFood.checked,
    
    foodSpawnCount: parseInt(cfgFoodCount.value, 10),
    foodLifespan: parseInt(cfgFoodLife.value, 10),
    spoilageTicks: parseInt(cfgSpoilage.value, 10),
    poisonLifespan: parseInt(cfgPoisonLife.value, 10),
    foodEvasionChance: parseFloat(cfgFoodEvade.value) / 100,
    
    scoreDrainTick: parseFloat(cfgScoreDrain.value) || 0,
    scoreNormal: parseFloat(cfgScoreN.value) || 0,
    scoreGolden: parseFloat(cfgScoreG.value) || 0,
    scorePoison: parseFloat(cfgScoreP.value) || 0,
    goldenAppleChance: parseFloat(cfgGoldPct.value) / 100,
    poisonAppleChance: parseFloat(cfgPoisonPct.value) / 100,
    
    obstacleCount: parseInt(cfgObstacles.value, 10),
    obstacleSpawnChance: parseFloat(cfgObsSpawnPct.value) / 100,
    obstacleWanderChance: parseFloat(cfgObsWander.value) / 100,
    poisonClearsObstacles: cfgPoisonBomb.checked,
    invisibleObstacles: cfgInvisObs.checked,
    screenShake: cfgScreenShake.checked,
    fogOfWarRadius: parseFloat(cfgFog.value) || 0,
    scrambleInterval: parseInt(cfgScramble.value, 10) || 0,
    drunkChance: parseFloat(cfgDrunk.value) / 100 || 0,
    appleGravity: cfgAppleGravity.checked,
    appleMultiplier: parseInt(cfgAppleMult.value, 10) || 1,
    randomTeleportTicks: parseInt(cfgRndTeleport.value, 10) || 0,
    poopRocksTicks: parseInt(cfgPoopRocks.value, 10) || 0,
    acidMode: cfgAcidMode.checked,
    shrinkTicks: parseInt(cfgShrink.value, 10) || 0,
    reverseAppleChance: parseFloat(cfgRevApple.value) / 100 || 0,
    tornadoTicks: parseInt(cfgTornado.value, 10) || 0,
    invertColorsTicks: parseInt(cfgInvertCols.value, 10) || 0,
    lengthSpeedMod: parseFloat(cfgLenSpeed.value) || 0,
    appleWanderChance: parseFloat(cfgAppleWander.value) / 100 || 0,
    renderStyle: cfgRenderStyle.value,




    teleportingAppleChance: parseFloat(cfgTeleport.value) / 100,
    hungerDamage: cfgHungerDamage.checked,

    showGrid: cfgShowGrid.checked,
    rainbowMode: cfgRainbow.checked,
    colorBg: cfgColBg.value,
    colorGrid: cfgColGrid.value,
    colorSnakeHead: cfgColHead.value,
    colorSnakeBody: cfgColBody.value,
    colorFoodNormal: cfgColFood.value,
    colorFoodGolden: cfgColGold.value,
    colorFoodPoison: cfgColPoison.value,
    colorObstacle: cfgColObs.value,
  };
  
  const zoom = parseInt(cfgZoom.value, 10);
  if (zoom >= 1) {
    renderer.cellSize = zoom;
  }
  
  if (arguments[0] === true) {
    engine.reset(newConfig);
  } else {
    engine.updateConfig(newConfig);
  }
  renderer.setupCanvas();
}

function updateUIFromConfig() {
  cfgGridW.value = engine.config.gridWidth;
  cfgGridH.value = engine.config.gridHeight;
  cfgWrap.checked = engine.config.wrapWalls;
  cfgInvincWalls.checked = engine.config.invincibleWalls;
  cfgBouncyWalls.checked = engine.config.bouncyWalls;
  cfgInvincTail.checked = engine.config.invincibleTail;
  cfgInvert.checked = engine.config.invertControls;
  cfgAllow180.checked = engine.config.allow180;
  cfgWinScore.value = engine.config.winScore || 0;

    if (cfgGhostWalls) cfgGhostWalls.checked = engine.config.ghostWalls;
  if (cfgExplodePct) cfgExplodePct.value = (engine.config.explodingAppleChance || 0) * 100;
cfgGhostPct.value = (engine.config.ghostAppleChance || 0) * 100;
  cfgGhostDur.value = engine.config.ghostDurationTicks || 30;
  cfgFatness.value = engine.config.snakeFatness || 1.0;
  cfgColGhost.value = engine.config.colorFoodGhost || '#06b6d4';


  cfgAutoPilot.checked = engine.config.autoPilotAssist;
  cfgAutoStart.checked = engine.config.autoStart;
  cfgRndSpawn.checked = engine.config.randomSpawn;
  cfgSpeed.value = engine.config.tickRateMs;
  cfgSpeedup.value = engine.config.speedUpMs;
  cfgInitLen.value = engine.config.initialLength;
  cfgMaxLen.value = engine.config.maxSnakeLength;
  cfgGrowth.value = engine.config.growthPerFood;
  cfgDecay.value = engine.config.tailDecayTicks;
  cfgTailChop.checked = engine.config.tailChop;
  cfgDropFood.checked = engine.config.dropFoodOnChop;
  cfgFoodCount.value = engine.config.foodSpawnCount;
  cfgFoodLife.value = engine.config.foodLifespan;
  cfgSpoilage.value = engine.config.spoilageTicks;
  cfgPoisonLife.value = engine.config.poisonLifespan;
  cfgFoodEvade.value = engine.config.foodEvasionChance * 100;
  cfgScoreDrain.value = engine.config.scoreDrainTick;
  cfgScoreN.value = engine.config.scoreNormal;
  cfgScoreG.value = engine.config.scoreGolden;
  cfgScoreP.value = engine.config.scorePoison;
  cfgGoldPct.value = engine.config.goldenAppleChance * 100;
  cfgPoisonPct.value = engine.config.poisonAppleChance * 100;
  cfgObstacles.value = engine.config.obstacleCount;
  cfgObsSpawnPct.value = engine.config.obstacleSpawnChance * 100;
  cfgObsWander.value = engine.config.obstacleWanderChance * 100;
  cfgPoisonBomb.checked = engine.config.poisonClearsObstacles;
  cfgInvisObs.checked = engine.config.invisibleObstacles;
  cfgScreenShake.checked = engine.config.screenShake;
  cfgFog.value = engine.config.fogOfWarRadius;
  cfgScramble.value = engine.config.scrambleInterval;
  cfgDrunk.value = engine.config.drunkChance * 100;
  cfgAppleGravity.checked = engine.config.appleGravity;
  cfgAppleMult.value = engine.config.appleMultiplier || 1;
  cfgRndTeleport.value = engine.config.randomTeleportTicks || 0;
  cfgPoopRocks.value = engine.config.poopRocksTicks || 0;
  cfgAcidMode.checked = engine.config.acidMode || false;
  cfgShrink.value = engine.config.shrinkTicks || 0;
  cfgRevApple.value = (engine.config.reverseAppleChance || 0) * 100;
  cfgTornado.value = engine.config.tornadoTicks || 0;
  cfgInvertCols.value = engine.config.invertColorsTicks || 0;
  cfgLenSpeed.value = engine.config.lengthSpeedMod || 0;
  cfgAppleWander.value = (engine.config.appleWanderChance || 0) * 100;
  if (engine.config.renderStyle) cfgRenderStyle.value = engine.config.renderStyle;




  cfgTeleport.value = engine.config.teleportingAppleChance * 100;
  cfgHungerDamage.checked = engine.config.hungerDamage;

  cfgShowGrid.checked = engine.config.showGrid;
  cfgRainbow.checked = engine.config.rainbowMode;
  cfgColBg.value = engine.config.colorBg;
  cfgColGrid.value = engine.config.colorGrid;
  cfgColHead.value = engine.config.colorSnakeHead;
  cfgColBody.value = engine.config.colorSnakeBody;
  cfgColFood.value = engine.config.colorFoodNormal;
  cfgColGold.value = engine.config.colorFoodGolden;
  cfgColPoison.value = engine.config.colorFoodPoison;
  cfgColObs.value = engine.config.colorObstacle;

  cfgZoom.value = renderer.cellSize;
}

btnApplyCfg?.addEventListener('click', () => applyConfigFromUI(true));

const btnResetCfg = document.getElementById('btn-reset-cfg');
btnResetCfg?.addEventListener('click', () => {
  engine.reset({}); // Passing empty triggers default because GameEngine constructor uses default
  // Wait, reset({}) merges with this.config. We need to reset to base defaults.
  const baseEngine = new GameEngine();
  engine.reset(baseEngine.config);
  renderer.setupCanvas();
  updateUIFromConfig();
});

// Auto-apply on any config change (live update, no restart)
const allInputs = document.querySelectorAll('input, select');
allInputs.forEach(el => {
  if (el.id && el.id.startsWith('cfg-')) {
    el.addEventListener('change', () => applyConfigFromUI(false));
  }
});

// ---- Bot Injection Logic ----
btnInjectBot?.addEventListener('click', () => {
  try {
    const code = botCodeEl.value;
    activeBot = new Function('state', 'utils', code);
    botStatus.style.display = 'inline';
    botStatus.textContent = 'Bot Active!';
    botStatus.style.color = 'green';
    
    engine.reset();
    engine.start();
  } catch (err) {
    alert('Bot script error: ' + err.message);
    activeBot = null;
  }
});

btnStopBot?.addEventListener('click', () => {
  activeBot = null;
  botStatus.style.display = 'none';
});


engine.on('grid_change', () => {
  renderer.setupCanvas();
  updateUIFromConfig();
});


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
    } else if (data.type === 'GHOST') {
    playTone(500, 'sine', 0.2, 1);
    setTimeout(() => playTone(700, 'sine', 0.4, 1), 100);
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

// Run bot before each tick

engine.on('tick', () => {
  if (activeBot && engine.getState().status === 'RUNNING') {
    try {
      const action = activeBot(engine.getState(), botUtils);
      if (action) {
        input.dispatch(action, 'bot');
      }
    } catch (err) {
      console.error('Bot execution error:', err);
      activeBot = null;
      botStatus.textContent = 'Bot Error!';
      botStatus.style.color = 'red';
    }
  }
});

// ---- Mod Logic ----
const btnInjectMod = document.getElementById('btn-inject-mod');
const modCodeEl = document.getElementById('mod-code');
const modStatus = document.getElementById('mod-status');

btnInjectMod?.addEventListener('click', () => {
  try {
    const code = modCodeEl.value;
    const modFn = new Function(code);
    modFn();
    modStatus.style.display = 'inline';
    modStatus.textContent = 'Mod Injected!';
    modStatus.style.color = 'green';
    setTimeout(() => { modStatus.style.display = 'none'; }, 3000);
  } catch (err) {
    alert('Mod script error: ' + err.message);
    modStatus.style.display = 'inline';
    modStatus.textContent = 'Error!';
    modStatus.style.color = 'red';
  }
});

// ---- Export / Import Config ----
btnExportCfg?.addEventListener('click', () => {
  const exportData = {
    ...engine.config,
    zoom: renderer.cellSize
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `snake-config-${Date.now()}.json`);
});

fileCfg?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const config = JSON.parse(ev.target.result);
      if (config.zoom) {
        renderer.cellSize = config.zoom;
      }
      engine.reset(config);
      renderer.setupCanvas();
      updateUIFromConfig();
      alert('Configuration imported successfully!');
    } catch (err) {
      alert('Failed to parse config JSON');
    }
  };
  reader.readAsText(file);
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Render loop
function renderLoop() {
  renderer.render();
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

// Init
updateHUD();
updateUIFromConfig();

// Dev Console API
window.SNAKE_DEV = { engine, input, renderer, utils: botUtils };
