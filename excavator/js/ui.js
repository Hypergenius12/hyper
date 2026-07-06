// ============================================================
// THE DOM EXCAVATOR — UI
// HUD, Shop, Biome Announcements (no emojis)
// ============================================================

export const UPGRADES = [
  { id: 'miningPower', tag: 'DMG', name: 'PROCESSOR CORE', desc: 'Increases click mining power.', baseCost: 10, costScale: 1.22, maxLevel: 500, effect: lv => `+${lv} click power` },
  { id: 'autoMiner', tag: 'BOT', name: 'BOTNET DRONE', desc: 'Drones that mine blocks passively.', baseCost: 350, costScale: 1.35, maxLevel: 150, effect: lv => `${lv} drone${lv!==1?'s':''}` },
  { id: 'autoSpeed', tag: 'SPD', name: 'CPU THREADS', desc: 'Increases Botnet Drone attack speed.', baseCost: 600, costScale: 1.35, maxLevel: 160, effect: lv => `+${lv * 10}% speed` },

  { id: 'bandwidthMulti', tag: 'BW', name: 'BANDWIDTH AMP', desc: 'Multiply bandwidth earned per block.', baseCost: 150, costScale: 1.55, maxLevel: 200, effect: lv => { const v = Math.pow(1.5, lv); return v >= 1000 ? `${(v/1000).toFixed(1)}k x earn` : `${v.toFixed(1)}x earn`; } },
  { id: 'cryptoHijack', tag: 'BTC', name: 'CRYPTO HIJACK', desc: 'Chance to mine a block worth 10x bandwidth.', baseCost: 600, costScale: 1.5, maxLevel: 60, effect: lv => `${(lv * 1.5).toFixed(1)}% chance` },
  
  { id: 'sqlInjection', tag: 'SQL', name: 'SQL INJECTION', desc: 'Deals damage to the entire new layer upon dropping down.', baseCost: 700, costScale: 1.45, maxLevel: 200, effect: lv => `${lv * 3} DMG AoE` },
  { id: 'ramSweep', tag: 'SWP', name: 'RAM SWEEP', desc: 'Lower the threshold needed to collapse a layer.', baseCost: 1200, costScale: 1.5, maxLevel: 40, effect: lv => `${90 - (lv * 2)}% clear req` },
  { id: 'zeroDay', tag: '0DAY', name: 'ZERO-DAY', desc: 'Small chance on click to collapse the entire layer.', baseCost: 2000, costScale: 1.6, maxLevel: 40, effect: lv => `${lv}% chance` },
  { id: 'holdToClick', tag: 'AUTO', name: 'HOLD TO CLICK', desc: 'Hold down the mouse to rapidly mine blocks automatically.', baseCost: 300, costScale: 1.0, maxLevel: 1, effect: lv => 'UNLOCKED' },
  { id: 'overclock', tag: 'CLK', name: 'OVERCLOCK', desc: 'Botnet Drones have a chance to deal 3x damage.', baseCost: 800, costScale: 1.4, maxLevel: 40, effect: lv => `${(lv * 2.5).toFixed(1)}% chance` },
  { id: 'firewallBypass', tag: 'BYP', name: 'FIREWALL BYPASS', desc: 'Reduce the extra HP of Firewall blocks.', baseCost: 1500, costScale: 1.5, maxLevel: 40, effect: lv => `-${lv}x HP multiplier` },
];

function upgradeCost(u, lv) {
  return Math.floor(u.baseCost * Math.pow(u.costScale, lv));
}

function calcMultiBuy(u, startLv, bandwidth, multiplierStr) {
  const maxLevels = u.maxLevel - startLv;
  if (maxLevels <= 0) return { count: 0, cost: Infinity };
  
  const targetCount = multiplierStr === 'max' ? maxLevels : Math.min(maxLevels, parseInt(multiplierStr));
  let cost = 0;
  let count = 0;
  
  for (let i = 0; i < targetCount; i++) {
    const nextCost = upgradeCost(u, startLv + i);
    if (multiplierStr === 'max') {
      if (cost + nextCost > bandwidth) break;
    }
    cost += nextCost;
    count++;
  }
  
  if (multiplierStr !== 'max' && count < targetCount && bandwidth < cost) {
    // Cannot afford the fixed amount
    return { count: 0, cost: cost };
  }
  
  return { count, cost };
}

function fmtBW(bits) {
  if (bits < 1000) return `${Math.floor(bits)} bits`;
  if (bits < 1e6) return `${(bits / 1e3).toFixed(1)} KB`;
  if (bits < 1e9) return `${(bits / 1e6).toFixed(1)} MB`;
  if (bits < 1e12) return `${(bits / 1e9).toFixed(1)} GB`;
  if (bits < 1e15) return `${(bits / 1e12).toFixed(2)} TB`;
  if (bits < 1e18) return `${(bits / 1e15).toFixed(2)} PB`;
  if (bits < 1e21) return `${(bits / 1e18).toFixed(2)} EB`;
  if (bits < 1e24) return `${(bits / 1e21).toFixed(2)} ZB`;
  return `${(bits / 1e24).toFixed(2)} YB`;
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
    this.shopMultiplier = '1';
    
    // Bind multiplier buttons
    const multBtns = document.querySelectorAll('.shop-mult-btn');
    multBtns.forEach(b => {
      b.addEventListener('click', () => {
        multBtns.forEach(x => {
          x.style.background = '#222';
          x.style.color = '#aaa';
          x.style.borderColor = '#555';
        });
        b.style.background = 'rgba(0,255,136,0.2)';
        b.style.color = 'var(--accent)';
        b.style.borderColor = 'var(--accent)';
        this.shopMultiplier = b.dataset.mult;
        // force re-render
        if (this._lastGS) this.renderShop(this._lastGS);
      });
    });

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
        <div class="shop-item-effect" id="shop-ef-${u.id}">Next: ${u.effect(1)}</div>
        <div class="shop-item-cost" id="shop-cost-${u.id}"></div>
      `;

      el.addEventListener('click', () => {
        if (this._upgradeCb && el._currentCost !== undefined && el._currentLevels > 0) {
          this._upgradeCb(u.id, el._currentCost, el._currentLevels);
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
    this._lastGS = gs;
    this.els.shopBalance.textContent = fmtBW(gs.bandwidth);
    const shardsEl = document.getElementById('prestige-shards');
    if (shardsEl) shardsEl.textContent = gs.prestigeShards || 0;

    for (const item of this.shopItemCache) {
      const { u, el } = item;
      const lv = gs.upgrades[u.id] || 0;
      const maxed = lv >= u.maxLevel;
      
      const { count, cost } = calcMultiBuy(u, lv, gs.bandwidth, this.shopMultiplier);
      const afford = count > 0 && gs.bandwidth >= cost;

      el._currentCost = cost;
      el._currentLevels = count;
      
      if (!afford && !maxed) {
        el.classList.add('locked');
      } else {
        el.classList.remove('locked');
      }

      const lvEl = document.getElementById(`shop-lv-${u.id}`);
      const efEl = document.getElementById(`shop-ef-${u.id}`);
      const costEl = document.getElementById(`shop-cost-${u.id}`);
      
      if (lvEl) {
        if (count > 1) {
          lvEl.textContent = `LV.${lv}/${u.maxLevel} (+${count})`;
        } else {
          lvEl.textContent = `LV.${lv}/${u.maxLevel}`;
        }
      }
      
      if (efEl) {
        efEl.textContent = maxed ? u.effect(lv) : `Next: ${u.effect(lv + Math.max(1, count))}`;
      }
      
      if (costEl) {
        costEl.textContent = maxed ? 'MAXED' : fmtBW(cost);
      }
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

  renderMap(maxDepth, biomes) {
    const rulerEl = document.getElementById('map-scale-ruler');
    const depthEl = document.getElementById('map-max-depth');
    
    if (depthEl) depthEl.textContent = `${Math.floor(maxDepth)}m`;
    rulerEl.innerHTML = '';
    
    const hoverName = document.getElementById('map-hover-name');
    const hoverDepth = document.getElementById('map-hover-depth');
    const hoverDesc = document.getElementById('map-hover-desc');
    const hoverCanvas = document.getElementById('map-hover-preview-canvas');
    const statHard = document.getElementById('map-stat-hard');
    const statBw = document.getElementById('map-stat-bw');
    const statBg = document.getElementById('map-stat-bg');
    const statStyle = document.getElementById('map-stat-style');
    const statGlow = document.getElementById('map-stat-glow');
    const statPart = document.getElementById('map-stat-part');
    
    // Build ruler and list items
    let totalHeight = 0;
    biomes.forEach(b => {
      const isDiscovered = b.depthStart <= maxDepth;
      const rRange = (b.depthEnd === 99999 ? 12000 : b.depthEnd) - b.depthStart;
      totalHeight += rRange;
    });

    biomes.forEach(b => {
      const isDiscovered = b.depthStart <= maxDepth;
      const c = isDiscovered ? `#${b.blockColors[0].toString(16).padStart(6,'0')}` : '#333';
      
      const title = isDiscovered ? b.name : '???';
      const desc = isDiscovered ? b.description : 'UNKNOWN STRATA';
      const rangeText = b.depthEnd === 99999 ? `${b.depthStart}m - ∞` : `${b.depthStart}m - ${b.depthEnd}m`;
      
      // Ruler segment
      const seg = document.createElement('div');
      seg.className = 'map-ruler-seg';
      const rRange = (b.depthEnd === 99999 ? 12000 : b.depthEnd) - b.depthStart;
      const pct = (rRange / totalHeight) * 100;
      seg.style.height = `${pct}%`;
      seg.style.width = '100%';
      seg.style.background = isDiscovered ? c : 'rgba(255,255,255,0.05)';
      seg.style.borderBottom = '1px solid rgba(0,0,0,0.5)';
      seg.style.cursor = 'pointer';
      seg.style.transition = 'all 0.1s';
      
      seg.addEventListener('mouseenter', () => {
        hoverName.textContent = title;
        hoverName.style.color = isDiscovered ? c : '#666';
        hoverDepth.textContent = rangeText;
        hoverDesc.textContent = desc;

        const ctx = hoverCanvas.getContext('2d');
        ctx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);

        if (!isDiscovered) {
          statHard.textContent = '???';
          statBw.textContent = '???';
          statBg.textContent = '???';
          statStyle.textContent = '???';
          statGlow.textContent = '???';
          statPart.textContent = '???';
          return;
        }

        statHard.textContent = b.blockHardness.toFixed(1);
        statBw.textContent = b.bandwidthDrop.toFixed(1);
        statBg.textContent = `RGB(${(b.bgColor[0]*255).toFixed()}, ${(b.bgColor[1]*255).toFixed()}, ${(b.bgColor[2]*255).toFixed()})`;
        statStyle.textContent = b.blockStyle.toUpperCase();
        statGlow.textContent = b.emissiveIntensity > 0 ? `YES (${b.emissiveIntensity})` : 'NO';
        statPart.textContent = b.particleStyle.toUpperCase();

        const bs = 40;
        const x = 10;
        const y = 10;
        ctx.fillStyle = c;
        const style = b.blockStyle;
        
        if (style === 'wireframe') {
          ctx.strokeStyle = c;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, bs - 3, bs - 3);
        } else if (style === 'dots') {
          ctx.beginPath();
          ctx.arc(x + bs*0.3, y + bs*0.3, bs*0.15, 0, Math.PI*2);
          ctx.arc(x + bs*0.7, y + bs*0.3, bs*0.15, 0, Math.PI*2);
          ctx.arc(x + bs*0.3, y + bs*0.7, bs*0.15, 0, Math.PI*2);
          ctx.arc(x + bs*0.7, y + bs*0.7, bs*0.15, 0, Math.PI*2);
          ctx.fill();
        } else if (style === 'stripes') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath();
          ctx.moveTo(x, y + bs/2);
          ctx.lineTo(x + bs/2, y);
          ctx.lineTo(x + bs, y + bs/2);
          ctx.lineTo(x + bs/2, y + bs);
          ctx.fill();
        } else if (style === 'hollow') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = '#050505';
          ctx.fillRect(x + bs*0.2, y + bs*0.2, bs*0.6, bs*0.6);
        } else if (style === 'glitch') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + 0.3*bs, y + 0.3*bs, bs*0.3, bs*0.1);
          ctx.fillRect(x + 0.7*bs, y + 0.7*bs, bs*0.1, bs*0.3);
        } else if (style === 'rounded') {
          ctx.beginPath();
          ctx.roundRect(x, y, bs - 1, bs - 1, bs * 0.3);
          ctx.fill();
        } else if (style === 'x-mark') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + bs*0.2, y + bs*0.2); ctx.lineTo(x + bs*0.8, y + bs*0.8);
          ctx.moveTo(x + bs*0.8, y + bs*0.2); ctx.lineTo(x + bs*0.2, y + bs*0.8);
          ctx.stroke();
        } else if (style === 'circle') {
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.45, 0, Math.PI*2);
          ctx.fill();
        } else if (style === 'checkerboard') {
          ctx.fillRect(x, y, bs/2, bs/2);
          ctx.fillRect(x + bs/2, y + bs/2, bs/2 - 1, bs/2 - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x + bs/2, y, bs/2 - 1, bs/2);
          ctx.fillRect(x, y + bs/2, bs/2, bs/2 - 1);
        } else if (style === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(x + bs/2, y);
          ctx.lineTo(x + bs - 1, y + bs/2);
          ctx.lineTo(x + bs/2, y + bs - 1);
          ctx.lineTo(x, y + bs/2);
          ctx.fill();
        } else if (style === 'crosshair') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + bs/2, y + bs*0.2); ctx.lineTo(x + bs/2, y + bs*0.8);
          ctx.moveTo(x + bs*0.2, y + bs/2); ctx.lineTo(x + bs*0.8, y + bs/2);
          ctx.stroke();
        } else if (style === 'brackets') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + bs*0.3, y + bs*0.2); ctx.lineTo(x + bs*0.2, y + bs*0.2); ctx.lineTo(x + bs*0.2, y + bs*0.8); ctx.lineTo(x + bs*0.3, y + bs*0.8);
          ctx.moveTo(x + bs*0.7, y + bs*0.2); ctx.lineTo(x + bs*0.8, y + bs*0.2); ctx.lineTo(x + bs*0.8, y + bs*0.8); ctx.lineTo(x + bs*0.7, y + bs*0.8);
          ctx.stroke();
        } else if (style === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(x + bs/2, y + bs*0.15);
          ctx.lineTo(x + bs*0.85, y + bs*0.85);
          ctx.lineTo(x + bs*0.15, y + bs*0.85);
          ctx.fill();
        } else if (style && style.startsWith('inset-')) {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          const p = 0.1 * parseInt(style.split('-')[1]);
          ctx.fillRect(x + bs*p, y + bs*p, bs*(1.0 - p*2), bs*(1.0 - p*2));
        } else if (style && style.startsWith('hlines')) {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          const n = parseInt(style.split('-')[1]);
          for(let i=0; i<n; i++) ctx.fillRect(x, y + bs*(i/n) + bs/(n*2), bs - 1, bs/(n*4));
        } else if (style && style.startsWith('vlines')) {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          const n = parseInt(style.split('-')[1]);
          for(let i=0; i<n; i++) ctx.fillRect(x + bs*(i/n) + bs/(n*2), y, bs/(n*4), bs - 1);
        } else if (style && style.startsWith('grid')) {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          const n = parseInt(style.split('-')[1]);
          ctx.beginPath();
          for(let i=1; i<n; i++) {
            ctx.moveTo(x + bs*(i/n), y); ctx.lineTo(x + bs*(i/n), y + bs);
            ctx.moveTo(x, y + bs*(i/n)); ctx.lineTo(x + bs, y + bs*(i/n));
          }
          ctx.stroke();
        } else {
          ctx.fillRect(x, y, bs - 1, bs - 1);
        }
      });
      
      rulerEl.appendChild(seg);
    });
  }

  screenShake() {
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 120);
  }
}

export { fmtBW };
