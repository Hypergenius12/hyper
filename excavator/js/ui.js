// ============================================================
// THE DOM EXCAVATOR — UI
// HUD, Shop, Biome Announcements (no emojis)
// ============================================================

export const UPGRADES = [
  { id: 'miningPower', tag: 'DMG', name: 'OVERCLOCK', desc: 'Increase mining damage per click.', baseCost: 50, costScale: 1.8, maxLevel: 50, effect: lv => `${1 + lv} DMG/click` },
  { id: 'critChance', tag: 'CRIT', name: 'REGEX CRIT', desc: 'Chance to deal 5x damage on hit.', baseCost: 150, costScale: 1.8, maxLevel: 18, effect: lv => `${lv * 5}% chance` },
  
  { id: 'autoMiner', tag: 'BOT', name: 'BOTNET DRONE', desc: 'Drones that mine blocks passively.', baseCost: 350, costScale: 2.1, maxLevel: 30, effect: lv => `${lv} drone${lv!==1?'s':''}` },
  { id: 'autoSpeed', tag: 'SPD', name: 'CPU THREADS', desc: 'Increases Botnet Drone attack speed.', baseCost: 600, costScale: 2.1, maxLevel: 25, effect: lv => `+${lv * 10}% speed` },

  { id: 'bandwidthMulti', tag: 'BW', name: 'BANDWIDTH AMP', desc: 'Multiply bandwidth earned per block.', baseCost: 150, costScale: 2.0, maxLevel: 50, effect: lv => `${(1 + lv * 0.5).toFixed(1)}x earn` },
  { id: 'cryptoHijack', tag: 'BTC', name: 'CRYPTO HIJACK', desc: 'Chance to mine a block worth 10x bandwidth.', baseCost: 600, costScale: 2.2, maxLevel: 20, effect: lv => `${lv * 3}% chance` },
  
  { id: 'sqlInjection', tag: 'SQL', name: 'SQL INJECTION', desc: 'Deals damage to the entire new layer upon dropping down.', baseCost: 700, costScale: 2.3, maxLevel: 30, effect: lv => `${lv * 3} DMG AoE` },
  { id: 'ramSweep', tag: 'SWP', name: 'RAM SWEEP', desc: 'Lower the threshold needed to collapse a layer.', baseCost: 1200, costScale: 2.2, maxLevel: 15, effect: lv => `${90 - (lv * 4)}% clear req` },
  { id: 'zeroDay', tag: '0DAY', name: 'ZERO-DAY', desc: 'Small chance on click to collapse the entire layer.', baseCost: 2000, costScale: 2.4, maxLevel: 10, effect: lv => `${lv}% chance` },
  { id: 'holdToClick', tag: 'AUTO', name: 'HOLD TO CLICK', desc: 'Hold down the mouse to rapidly mine blocks automatically.', baseCost: 250, costScale: 1.0, maxLevel: 1, effect: lv => 'UNLOCKED' },
];

function upgradeCost(u, lv) {
  return Math.floor(u.baseCost * Math.pow(u.costScale, lv));
}

function fmtBW(bits) {
  if (bits < 1000) return `${Math.floor(bits)} bits`;
  if (bits < 1e6) return `${(bits / 1e3).toFixed(1)} KB`;
  if (bits < 1e9) return `${(bits / 1e6).toFixed(1)} MB`;
  if (bits < 1e12) return `${(bits / 1e9).toFixed(1)} GB`;
  return `${(bits / 1e12).toFixed(2)} TB`;
}

export class UI {
  constructor() {
    this.els = {
      depth: document.getElementById('hud-depth'),
      bw: document.getElementById('hud-bandwidth'),
      biome: document.getElementById('hud-biome'),
      progress: document.getElementById('hud-progress'),
      progressLabel: document.getElementById('hud-progress-label'),
      shopBtn: document.getElementById('shop-btn'),
      shopOverlay: document.getElementById('shop-overlay'),
      shopClose: document.getElementById('shop-close'),
      shopGrid: document.getElementById('shop-grid'),
      shopBalance: document.getElementById('shop-balance-value'),
      announce: document.getElementById('biome-announce'),
      announceName: document.querySelector('.biome-announce-name'),
      announceDepth: document.querySelector('.biome-announce-depth'),
      announceDesc: document.querySelector('.biome-announce-desc'),
      popups: document.getElementById('bandwidth-popups'),
      loading: document.getElementById('loading-screen'),
      loaderBar: document.getElementById('loader-bar'),
    };

    this.shopOpen = false;
    this._upgradeCb = null;
    this._announceTimer = null;
    
    this.shopItemCache = [];
    this._initShop();
    this._bind();
  }

  _initShop() {
    this.els.shopGrid.innerHTML = '';
    for (const u of UPGRADES) {
      const el = document.createElement('div');
      el.className = 'shop-item';
      
      el.innerHTML = `
        <div class="shop-item-tag">${u.tag}</div>
        <div class="shop-item-header">
          <span class="shop-item-name">${u.name}</span>
          <span class="shop-item-level" id="shop-lv-${u.id}">LV.0/${u.maxLevel}</span>
        </div>
        <div class="shop-item-desc">${u.desc}</div>
        <div class="shop-item-effect" id="shop-ef-${u.id}">${u.effect(0)}</div>
        <div class="shop-item-cost" id="shop-cost-${u.id}"></div>
      `;

      el.addEventListener('click', () => {
        if (this._upgradeCb && el._currentCost !== undefined && el._currentCost !== Infinity) {
          this._upgradeCb(u.id, el._currentCost);
        }
      });

      this.els.shopGrid.appendChild(el);
      this.shopItemCache.push({ u, el });
    }
  }

  _bind() {
    this.els.shopBtn.addEventListener('click', () => this.toggleShop());
    this.els.shopClose.addEventListener('click', () => this.toggleShop(false));
    this.els.shopOverlay.addEventListener('click', (e) => {
      if (e.target === this.els.shopOverlay) this.toggleShop(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.shopOpen) this.toggleShop(false);
      if (e.key === 'e' || e.key === 'E') this.toggleShop();
    });
  }

  setLoadProgress(pct) {
    this.els.loaderBar.style.width = `${pct}%`;
  }

  hideLoading() {
    this.els.loading.classList.add('fade-out');
    setTimeout(() => (this.els.loading.style.display = 'none'), 700);
  }

  toggleShop(force) {
    this.shopOpen = force !== undefined ? force : !this.shopOpen;
    this.els.shopOverlay.classList.toggle('hidden', !this.shopOpen);
  }

  onUpgrade(cb) { this._upgradeCb = cb; }

  updateHUD(gs, biome, nextBiome) {
    const depthStr = `${Math.floor(gs.depth)}m`;
    if (this.els.depth.textContent !== depthStr) this.els.depth.textContent = depthStr;
    
    const bwStr = fmtBW(gs.bandwidth);
    if (this.els.bw.textContent !== bwStr) this.els.bw.textContent = bwStr;
    
    if (this.els.biome.textContent !== biome.name) this.els.biome.textContent = biome.name;
    
    if (nextBiome) {
      const range = biome.depthEnd - biome.depthStart;
      const pct = ((gs.depth - biome.depthStart) / range) * 100;
      const widthStr = `${Math.min(pct, 100).toFixed(1)}%`;
      if (this.els.progress.style.width !== widthStr) this.els.progress.style.width = widthStr;
      
      const lblStr = `Next: ${nextBiome.name} @ ${biome.depthEnd}m`;
      if (this.els.progressLabel.textContent !== lblStr) this.els.progressLabel.textContent = lblStr;
    } else {
      this.els.progress.style.width = '100%';
      this.els.progressLabel.textContent = 'MAX DEPTH';
    }
  }

  renderShop(gs) {
    this.els.shopBalance.textContent = fmtBW(gs.bandwidth);
    const shardsEl = document.getElementById('prestige-shards');
    if (shardsEl) shardsEl.textContent = gs.prestigeShards || 0;

    for (const item of this.shopItemCache) {
      const { u, el } = item;
      const lv = gs.upgrades[u.id] || 0;
      const maxed = lv >= u.maxLevel;
      const cost = maxed ? Infinity : upgradeCost(u, lv);
      const afford = gs.bandwidth >= cost;

      el._currentCost = cost;
      
      if (!afford && !maxed) {
        el.classList.add('locked');
      } else {
        el.classList.remove('locked');
      }

      const lvEl = document.getElementById(`shop-lv-${u.id}`);
      const efEl = document.getElementById(`shop-ef-${u.id}`);
      const costEl = document.getElementById(`shop-cost-${u.id}`);
      
      if (lvEl) lvEl.textContent = `LV.${lv}/${u.maxLevel}`;
      if (efEl) efEl.textContent = u.effect(lv);
      if (costEl) costEl.textContent = maxed ? 'MAXED' : fmtBW(cost);
    }
  }

  announceBiome(biome, depth) {
    this.els.announceName.textContent = biome.name.toUpperCase();
    this.els.announceDepth.textContent = `DEPTH: ${Math.floor(depth)}m`;
    this.els.announceDesc.textContent = biome.description;
    this.els.announce.classList.add('active');
    clearTimeout(this._announceTimer);
    this._announceTimer = setTimeout(() => {
      this.els.announce.classList.remove('active');
    }, 2500);
  }

  spawnBandwidthPopup(sx, sy, amount) {
    const el = document.createElement('div');
    el.className = 'bw-popup';
    el.textContent = `+${fmtBW(amount)}`;
    el.style.left = `${sx}px`;
    el.style.top = `${sy}px`;
    this.els.popups.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  screenShake() {
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 120);
  }
}

export { fmtBW };
