// ============================================================
// THE DOM EXCAVATOR — MAIN
// Entry point, game loop, save/load
// ============================================================

import { Engine } from './engine.js?v=10';
import { UI } from './ui.js?v=10';
import { BIOMES, getBiomeAtDepth } from './biomes.js?v=10';

const engine = new Engine();
const ui = new UI();

let ready = false;
let started = false;
let isResetting = false;

// Loading bar
let loadPct = 0;
const loadInterval = setInterval(() => {
  loadPct += Math.random() * 18 + 6;
  if (loadPct >= 100) {
    loadPct = 100;
    clearInterval(loadInterval);
    ready = true;
  }
  ui.setLoadProgress(Math.min(loadPct, 100));
}, 180);

// Click to start
document.getElementById('loading-screen').addEventListener('click', () => {
  if (!ready || started) return;
  started = true;

  const canvas = document.getElementById('game-canvas');
  engine.init(canvas);

  // Load save
  loadGame();

  // Apply current biome visuals
  const { biome } = getBiomeAtDepth(engine.gameState.depth);
  engine.gameState.currentBiomeIndex = getBiomeAtDepth(engine.gameState.depth).index;

  // Wire callbacks
  engine.onBiomeChange = (biome, depth) => ui.announceBiome(biome, depth);
  engine.onBlockMined = (type, data) => {
    if (type === 'mined') ui.spawnBandwidthPopup(data.screenX, data.screenY, data.earned);
    if (type === 'shake') ui.screenShake();
  };

  // Wire shop
  ui.onUpgrade((id, cost) => {
    if (engine.gameState.bandwidth >= cost) {
      engine.gameState.bandwidth -= cost;
      engine.gameState.upgrades[id] = (engine.gameState.upgrades[id] || 0) + 1;
    }
  });

  // Init audio on gesture
  engine.initAudio();

  // Announce biome
  ui.announceBiome(biome, engine.gameState.depth);

  // Hide loading
  ui.hideLoading();

  // Reset button logic
  document.getElementById('prestige-btn').addEventListener('click', () => {
    const shardsEarned = Math.floor(engine.gameState.depth / 1000);
    if (shardsEarned < 1) {
      alert("You need to reach at least 1000m to Format the Drive!");
      return;
    }
    if (confirm("Format the Drive? You will gain " + shardsEarned + " Quantum Shards, but lose all depth and upgrades!")) {
      engine.gameState.prestigeShards += shardsEarned;
      engine.gameState.depth = 0;
      engine.gameState.bandwidth = 400;
      engine.gameState.upgrades = {};
      isResetting = true;
      saveState();
      location.reload();
    }
  });

  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = settingsModal.style.display === 'none' ? 'block' : 'none';
  });
  
  const bgm = document.getElementById('bgm');
  const bgmToggle = document.getElementById('setting-bgm');
  bgmToggle.addEventListener('change', () => {
    if (bgmToggle.checked) bgm.play().catch(e => console.log("Audio play failed"));
    else bgm.pause();
  });
  
  // Try to start BGM on first interaction
  document.body.addEventListener('click', () => {
    if (bgmToggle.checked && bgm.paused) {
      bgm.volume = 0.4;
      bgm.play().catch(e => console.log("Audio play failed"));
    }
  }, { once: true });

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm("Are you sure you want to completely wipe your save? This cannot be undone.")) {
      isResetting = true;
      localStorage.clear();
      location.reload();
    }
  });

  // Start loop
  function loop(ts) {
    requestAnimationFrame(loop);
    engine.update(ts);

    const { biome: b, index: i } = getBiomeAtDepth(engine.gameState.depth);
    const next = i < BIOMES.length - 1 ? BIOMES[i + 1] : null;
    ui.updateHUD(engine.gameState, b, next);

    if (ui.shopOpen) ui.renderShop(engine.gameState);
  }
  requestAnimationFrame(loop);
});

// Save / Load
function saveGame() {
  if (isResetting) return;
  try {
    const s = {
      depth: engine.gameState.depth,
      bandwidth: engine.gameState.bandwidth,
      totalMined: engine.gameState.totalMined,
      currentBiomeIndex: engine.gameState.currentBiomeIndex,
      prestigeShards: engine.gameState.prestigeShards,
      upgrades: { ...engine.gameState.upgrades },
    };
    localStorage.setItem('dom-excavator-save', JSON.stringify(s));
  } catch (e) { /* silent */ }
}

function loadGame() {
  try {
    const raw = localStorage.getItem('dom-excavator-save');
    if (!raw) return;
    const s = JSON.parse(raw);
    engine.gameState.depth = s.depth || 0;
    engine.gameState.bandwidth = s.bandwidth !== undefined ? s.bandwidth : 400;
    engine.gameState.totalMined = s.totalMined || 0;
    engine.gameState.currentBiomeIndex = s.currentBiomeIndex || 0;
    engine.gameState.prestigeShards = s.prestigeShards || 0;
    const defaults = {
      miningPower:0, autoMiner:0, bandwidthMulti:0,
      sqlInjection:0, critChance:0, particleBoost:0,
      depthBoost:0, cacheBoost:0, pierce:0, autoSpeed:0, 
      cryptoHijack:0, ramSweep:0, zeroDay:0,
    };
    engine.gameState.upgrades = { ...defaults, ...(s.upgrades || {}) };

    // Restore active row and camera if we have saved depth
    if (engine.gameState.depth > 0) {
      const SKY_ROWS = 8;
      engine.activeRow = SKY_ROWS + Math.floor(engine.gameState.depth);
      
      const targetRow = engine.activeRow - 1;
      engine.targetCameraY = Math.max(0, targetRow * engine.blockSize - engine.height * 0.25);
      engine.cameraY = engine.targetCameraY;
      
      const visibleBottom = Math.ceil((engine.cameraY + engine.height) / engine.blockSize);
      while (engine.generatedRows < visibleBottom + 5) {
        engine._generateRow(engine.generatedRows);
        engine.generatedRows++;
      }
    }
  } catch (e) { /* corrupt save */ }
}

setInterval(saveGame, 30000);
window.addEventListener('beforeunload', saveGame);
