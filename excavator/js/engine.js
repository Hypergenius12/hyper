// ============================================================
// THE DOM EXCAVATOR — 2D ENGINE
// Canvas2D rendering + WebGL post-processing shaders
// ============================================================

import { BIOMES, getBiomeAtDepth } from './biomes.js?v=12';

// ========== CONSTANTS ==========
const COLS = 24;
const SKY_ROWS = 3;
const INITIAL_ROWS = 150;
const GENERATE_BUFFER = 60;

// ========== HELPERS ==========
function hexToCSS(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

function hexToRGB(hex) {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

// ========== WEBGL SHADERS ==========
const VERT_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG_SRC = `
precision highp float;
uniform sampler2D u_texture;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_vignette;
uniform float u_scanlines;
uniform float u_chroma;
uniform float u_glow;
uniform float u_pixelate;
uniform float u_invert;
uniform float u_grain;
uniform float u_hue;
varying vec2 v_uv;

// Hue shift helper
vec3 hueShift(vec3 color, float hue) {
    const vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosAngle = cos(hue);
    return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

void main() {
  vec2 uv = v_uv;

  // Pixelate
  if (u_pixelate > 0.0) {
      float dx = u_pixelate / u_resolution.x;
      float dy = u_pixelate / u_resolution.y;
      uv = vec2(dx * floor(uv.x / dx), dy * floor(uv.y / dy));
  }

  // Chromatic aberration
  vec2 dir = (uv - 0.5) * u_chroma;
  float r = texture2D(u_texture, uv + dir).r;
  float g = texture2D(u_texture, uv).g;
  float b = texture2D(u_texture, uv - dir).b;
  vec3 color = vec3(r, g, b);

  // Bloom (8-tap blur on bright areas)
  float px = 3.0 / u_resolution.x;
  float py = 3.0 / u_resolution.y;
  vec3 blur = vec3(0.0);
  blur += texture2D(u_texture, uv + vec2(px, 0.0)).rgb;
  blur += texture2D(u_texture, uv - vec2(px, 0.0)).rgb;
  blur += texture2D(u_texture, uv + vec2(0.0, py)).rgb;
  blur += texture2D(u_texture, uv - vec2(0.0, py)).rgb;
  blur += texture2D(u_texture, uv + vec2(px, py)).rgb;
  blur += texture2D(u_texture, uv - vec2(px, py)).rgb;
  blur += texture2D(u_texture, uv + vec2(px, -py)).rgb;
  blur += texture2D(u_texture, uv - vec2(px, -py)).rgb;
  blur /= 8.0;
  vec3 bright = max(blur - 0.35, 0.0) * u_glow;
  color += bright;

  // Scanlines
  float scan = sin(gl_FragCoord.y * 1.5 + u_time * 2.0) * 0.5 + 0.5;
  color -= scan * u_scanlines * 0.1;

  // Vignette
  float d = length(uv - 0.5) * 1.414;
  float vig = smoothstep(0.5, 1.1, d);
  color *= 1.0 - vig * u_vignette;

  // Hue Shift
  if (u_hue > 0.0) {
      color = hueShift(color, u_hue);
  }

  // Invert
  if (u_invert > 0.0) {
      color = mix(color, 1.0 - color, u_invert);
  }

  // Film Grain
  if (u_grain > 0.0) {
      float noise = fract(sin(dot(uv, vec2(12.9898, 78.233)) + u_time) * 43758.5453);
      color += (noise - 0.5) * u_grain;
  }

  gl_FragColor = vec4(color, 1.0);
}`;

// ========== ENGINE ==========
export class Engine {
  constructor() {
    this.gameState = {
      depth: 0,
      maxDepth: 0,
      bandwidth: 600,
      totalMined: 0,
      currentBiomeIndex: 0,
      prestigeShards: 0,
      upgrades: {
        miningPower: 0,
        autoMiner: 0,
        bandwidthMulti: 0,
        explosionRadius: 0,
        critChance: 0,
        particleBoost: 0,
        depthBoost: 0,
        cacheBoost: 0,
      },
    };
  }

  init(glCanvas) {
    // Canvases
    this.glCanvas = glCanvas;
    this.offscreen = document.createElement('canvas');
    this.ctx = this.offscreen.getContext('2d');

    // World
    this.blocks = [];
    this.generatedRows = 0;
    this.activeRow = SKY_ROWS;

    // Camera
    this.cameraY = 0;
    this.targetCameraY = 0;

    // Input
    this.keys = {};
    this.mousePixelX = 0;
    this.mousePixelY = 0;
    this.isMouseDown = false;
    this.hoveredRow = -1;
    this.hoveredCol = -1;

    // Upgrades state
    this.cacheDmgPool = 0;
    this.autoMineTimer = 0;
    this.mineTimer = 0;
    this.nextMineTarget = 0.166 + Math.random() * 0.034;
    this.isCatchingUp = false;

    // Particles
    this.particles = [];

    // Audio
    this.audioCtx = null;
    this.masterGain = null;

    // Time
    this.time = 0;
    this.lastTime = performance.now();

    // Callbacks
    this.onBiomeChange = null;
    this.onBlockMined = null;

    // Current biome shader values (for smooth transitions)
    this.shaderVignette = 0.3;
    this.shaderScanlines = 0;
    this.shaderChroma = 0;
    this.shaderGlow = 0.5;
    this.shaderPixelate = 0;
    this.shaderInvert = 0;
    this.shaderGrain = 0;
    this.shaderHue = 0;

    // Size
    this._resize();
    this._setupWebGL();
    this._setupEvents();

    // Generate world
    this._generateSky();
    this._generateRows(INITIAL_ROWS);
  }

  // ========== CANVAS & WEBGL SETUP ==========
  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.height = h;
    this.glCanvas.width = w;
    this.glCanvas.height = h;
    this.offscreen.width = w;
    this.offscreen.height = h;
    this.blockSize = Math.max(20, Math.floor(w / COLS));
    this.offsetX = Math.floor((w - this.blockSize * COLS) / 2);

    if (this.gl) {
      this.gl.viewport(0, 0, w, h);
    }
  }

  _setupWebGL() {
    const gl = this.glCanvas.getContext('webgl', {
      premultipliedAlpha: false,
      alpha: false,
    });

    if (!gl) {
      this.useWebGL = false;
      this.fallbackCtx = this.glCanvas.getContext('2d');
      return;
    }

    this.gl = gl;
    this.useWebGL = true;

    // Compile shaders
    const vs = this._compileShader(gl.VERTEX_SHADER, VERT_SRC);
    const fs = this._compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);
    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(this.program));
      this.useWebGL = false;
      this.fallbackCtx = this.glCanvas.getContext('2d');
      return;
    }

    // Fullscreen quad
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    gl.useProgram(this.program);
    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Uniform locations
    this.uniforms = {
      texture: gl.getUniformLocation(this.program, 'u_texture'),
      time: gl.getUniformLocation(this.program, 'u_time'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      vignette: gl.getUniformLocation(this.program, 'u_vignette'),
      scanlines: gl.getUniformLocation(this.program, 'u_scanlines'),
      chroma: gl.getUniformLocation(this.program, 'u_chroma'),
      glow: gl.getUniformLocation(this.program, 'u_glow'),
      pixelate: gl.getUniformLocation(this.program, 'u_pixelate'),
      invert: gl.getUniformLocation(this.program, 'u_invert'),
      grain: gl.getUniformLocation(this.program, 'u_grain'),
      hue: gl.getUniformLocation(this.program, 'u_hue'),
    };
  }

  _compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  initAudio() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio not supported");
    }
  }

  playSFX(type) {
    if (this.isCatchingUp) return;
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

  // ========== EVENTS ==========
  _setupEvents() {
    window.addEventListener('resize', () => this._resize());

    const el = this.glCanvas;
    el.addEventListener('mousemove', (e) => this._onMouseMove(e));
    el.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this._tryMine();
      }
    });
    el.addEventListener('mouseup', () => (this.isMouseDown = false));
    el.addEventListener('mouseleave', () => (this.isMouseDown = false));

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this._onMouseMove(t);
      this.isMouseDown = true;
      this._tryMine();
    }, { passive: false });
    el.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this._onMouseMove(e.touches[0]);
    }, { passive: false });
    el.addEventListener('touchend', () => (this.isMouseDown = false));
  }

  _onMouseMove(e) {
    this.mousePixelX = e.clientX;
    this.mousePixelY = e.clientY;
    const col = Math.floor((e.clientX - this.offsetX) / this.blockSize);
    const row = Math.floor((e.clientY + this.cameraY) / this.blockSize);
    if (col >= 0 && col < COLS && row >= SKY_ROWS && row < this.blocks.length) {
      this.hoveredCol = col;
      this.hoveredRow = row;
    } else {
      this.hoveredCol = -1;
      this.hoveredRow = -1;
    }
  }

  // ========== WORLD GENERATION ==========
  _generateSky() {
    for (let i = 0; i < SKY_ROWS; i++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        row.push({ alive: false, color: null, hp: 0, maxHp: 0 });
      }
      this.blocks.push(row);
      this.generatedRows++;
    }
  }

  _generateRows(count) {
    for (let i = 0; i < count; i++) {
      const depth = this.generatedRows - SKY_ROWS;
      const { biome } = getBiomeAtDepth(depth);
      const isFirewall = (depth >= biome.depthEnd - 3) && (depth < biome.depthEnd);
      const depthScale = Math.pow(1.00025, depth);
      const bypassLevel = this.gameState.upgrades.firewallBypass || 0;
      const fwMultiplier = Math.max(5, 15 - bypassLevel * 1);
      const baseHp = Math.max(1, Math.round(biome.blockHardness * depthScale * (isFirewall ? fwMultiplier : 1)));
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const colorHex = biome.blockColors[Math.floor(Math.random() * biome.blockColors.length)];
        const variation = 0.9 + Math.random() * 0.2;
        const [r, g, b] = hexToRGB(colorHex);
        const rv = Math.min(255, Math.round(r * variation));
        const gv = Math.min(255, Math.round(g * variation));
        const bv = Math.min(255, Math.round(b * variation));
        row.push({
          alive: true,
          color: `rgb(${rv},${gv},${bv})`,
          hp: baseHp,
          maxHp: baseHp,
          seed: Math.random(),
          style: biome.blockStyle || 'solid',
          isFirewall: isFirewall
        });
      }
      this.blocks.push(row);
      this.generatedRows++;
    }
  }

  // ========== MINING ==========
  _tryMine() {
    const { hoveredRow: row, hoveredCol: col } = this;
    if (row < 0 || col < 0) return;
    const block = this.blocks[row]?.[col];
    if (!block || !block.alive) return;
    if (row !== this.activeRow) return; // Only mine the current layer

    const zeroDayLv = this.gameState.upgrades.zeroDay || 0;
    if (zeroDayLv > 0 && Math.random() < (zeroDayLv * 0.01)) {
      for (let c = 0; c < COLS; c++) {
        if (this.blocks[this.activeRow][c].alive) {
          this._destroyBlock(this.activeRow, c, true);
        }
      }
      return;
    }

    const prestigeMulti = 1 + (this.gameState.prestigeShards || 0) * 0.50;
    const power = Math.max(1, Math.floor((1 + (this.gameState.upgrades.miningPower || 0)) * prestigeMulti));
    const critChance = (this.gameState.upgrades.critChance || 0) * 0.05;
    const isCrit = Math.random() < critChance;

    const damage = (isCrit ? power * 5 : power);

    block.hp -= damage;

    if (block.hp <= 0) {
      this._destroyBlock(row, col);
    } else {
      this.playSFX('mine');
      this._spawnParticles(col, row, block.color, 2);
    }
  }

  _destroyBlock(row, col, awardPoints = true, isExplosion = false) {
    if (row < 0 || row >= this.blocks.length || col < 0 || col >= COLS) return;
    const block = this.blocks[row][col];
    if (!block.alive) return;
    block.alive = false;

    if (awardPoints) {
      // Bandwidth
      const depth = row - SKY_ROWS;
      const { biome } = getBiomeAtDepth(depth);
      const depthScale = Math.pow(1.00025, depth);
      const multi = Math.pow(1.5, this.gameState.upgrades.bandwidthMulti || 0);
      const prestigeMulti = 1 + (this.gameState.prestigeShards || 0) * 0.50;
      let earned = Math.max(1, Math.round(biome.bandwidthDrop * depthScale * multi * prestigeMulti));
      
      const hijackLv = this.gameState.upgrades.cryptoHijack || 0;
      if (hijackLv > 0 && Math.random() < (hijackLv * 0.03)) {
        earned *= 10;
        this._spawnParticles(col, row, '#ffaa00', 15);
      }

      this.gameState.bandwidth += earned;
      this.gameState.totalMined++;

      // Depth is strictly 1 block = 1 meter
      this.gameState.depth = Math.max(this.gameState.depth, this.activeRow - SKY_ROWS);
      this.gameState.maxDepth = Math.max(this.gameState.maxDepth, this.gameState.depth);

      // Callback
      if (this.onBlockMined) {
        this.onBlockMined('mined', {
          earned,
          screenX: this.mousePixelX,
          screenY: this.mousePixelY,
        });

        if (biome.shakeOnMine) {
          this.onBlockMined('shake');
        }
      }
    }

    // Particles
    const pCount = 6;
    this._spawnParticles(col, row, block.color, pCount);

    // Sound
    if (awardPoints) {
      this._playMineSound();
    }

    // End of explosion block removed

    // Check layer clear
    if (row === this.activeRow) {
      this._checkRowClear();
    }
  }

  _checkRowClear() {
    if (this._isClearing) return;
    
    let dead = 0;
    for (let c = 0; c < COLS; c++) {
      if (!this.blocks[this.activeRow][c].alive) dead++;
    }

    const sweepLv = this.gameState.upgrades.ramSweep || 0;
    const thresholdPct = 0.90 - (sweepLv * 0.04);

    // threshold to clear the layer
    if (dead >= COLS * thresholdPct) {
      this._isClearing = true;
      for (let c = 0; c < COLS; c++) {
        if (this.blocks[this.activeRow][c].alive) {
          this._destroyBlock(this.activeRow, c, false);
        }
      }
      this.activeRow++;
      this._checkBiomeChange();
      this._playCollapseSound();
      
      // SQL Injection - Deals massive damage to the new layer
      const sqlLv = this.gameState.upgrades.sqlInjection || 0;
      if (sqlLv > 0 && this.activeRow < this.blocks.length) {
        const sqlDmg = sqlLv * 3;
        for (let c = 0; c < COLS; c++) {
          const b = this.blocks[this.activeRow][c];
          if (b && b.alive) {
            b.hp = Math.max(1, b.hp - sqlDmg);
            this._spawnParticles(c, this.activeRow, '#00ff00', 2);
          }
        }
      }
      
      this.gameState.depth = Math.max(this.gameState.depth, this.activeRow - SKY_ROWS);
      this._isClearing = false;
    }
  }

  // ========== PARTICLES ==========
  _spawnParticles(col, row, color, count) {
    if (this.isCatchingUp) return;
    const bs = this.blockSize;
    const cx = this.offsetX + col * bs + bs / 2;
    const cy = row * bs + bs / 2;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * bs * 0.5,
        y: cy + (Math.random() - 0.5) * bs * 0.5,
        vx: (Math.random() - 0.5) * 250,
        vy: -Math.random() * 200 - 40,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.35,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  // ========== AUDIO ==========
  initAudio() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.12;
      this.masterGain.connect(this.audioCtx.destination);
    } catch (e) { /* silent */ }
  }

  _playMineSound() {
    this.playSFX('mine');
  }

  _playHitSound() {
    this.playSFX('crit');
  }

  _playCollapseSound() {
    this.playSFX('collapse');
  }

  // ========== BIOME ==========
  _checkBiomeChange() {
    const { biome, index } = getBiomeAtDepth(this.gameState.depth);
    if (index !== this.gameState.currentBiomeIndex) {
      this.gameState.currentBiomeIndex = index;
      if (this.onBiomeChange) {
        this.onBiomeChange(biome, this.gameState.depth);
      }
    }
  }

  // ========== RENDER (CANVAS 2D) ==========
  _render() {
    const ctx = this.ctx;
    const bs = this.blockSize;
    const w = this.width;
    const h = this.height;
    const camY = this.cameraY;

    // Current biome for styling
    const { biome } = getBiomeAtDepth(this.gameState.depth);
    const [bgR, bgG, bgB] = biome.bgColor;

    // Background
    const bgTop = `rgb(${Math.round(bgR*255)},${Math.round(bgG*255)},${Math.round(bgB*255)})`;
    const bgBot = `rgb(${Math.max(0,Math.round(bgR*180))},${Math.max(0,Math.round(bgG*180))},${Math.max(0,Math.round(bgB*180))})`;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, bgTop);
    grad.addColorStop(1, bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Visible row range
    const startRow = Math.max(0, Math.floor(camY / bs) - 1);
    const endRow = Math.min(this.blocks.length, startRow + Math.ceil(h / bs) + 2);

    // Draw blocks
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < COLS; col++) {
        const block = this.blocks[row][col];
        if (!block.alive) continue;

        const x = this.offsetX + col * bs;
        const y = row * bs - camY;

        // Check if reachable (has nothing above it)
        const reachable = (row === this.activeRow);

        // Base block rendering based on style
        ctx.fillStyle = block.color;
        
        if (block.style === 'wireframe') {
          ctx.strokeStyle = block.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1, y + 1, bs - 3, bs - 3);
        } else if (block.style === 'dots') {
          ctx.beginPath();
          ctx.arc(x + bs*0.3, y + bs*0.3, bs*0.15, 0, Math.PI*2);
          ctx.arc(x + bs*0.7, y + bs*0.3, bs*0.15, 0, Math.PI*2);
          ctx.arc(x + bs*0.3, y + bs*0.7, bs*0.15, 0, Math.PI*2);
          ctx.arc(x + bs*0.7, y + bs*0.7, bs*0.15, 0, Math.PI*2);
          ctx.fill();
        } else if (block.style === 'stripes') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath();
          ctx.moveTo(x, y + bs/2);
          ctx.lineTo(x + bs/2, y);
          ctx.lineTo(x + bs, y + bs/2);
          ctx.lineTo(x + bs/2, y + bs);
          ctx.fill();
        } else if (block.style === 'hollow') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = '#050505';
          ctx.fillRect(x + bs*0.2, y + bs*0.2, bs*0.6, bs*0.6);
        } else if (block.style === 'glitch') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + block.seed*bs*0.5, y + block.seed*bs*0.5, bs*0.3, bs*0.1);
          ctx.fillRect(x + (1-block.seed)*bs*0.5, y + (1-block.seed)*bs*0.5, bs*0.1, bs*0.3);
        } else if (block.style === 'rounded') {
          ctx.beginPath();
          ctx.roundRect(x, y, bs - 1, bs - 1, bs * 0.3);
          ctx.fill();
        } else if (block.style === 'x-mark') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + bs*0.2, y + bs*0.2); ctx.lineTo(x + bs*0.8, y + bs*0.8);
          ctx.moveTo(x + bs*0.8, y + bs*0.2); ctx.lineTo(x + bs*0.2, y + bs*0.8);
          ctx.stroke();
        } else if (block.style === 'circle') {
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.45, 0, Math.PI*2);
          ctx.fill();
        } else if (block.style === 'checkerboard') {
          ctx.fillRect(x, y, bs/2, bs/2);
          ctx.fillRect(x + bs/2, y + bs/2, bs/2 - 1, bs/2 - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x + bs/2, y, bs/2 - 1, bs/2);
          ctx.fillRect(x, y + bs/2, bs/2, bs/2 - 1);
        } else if (block.style === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(x + bs/2, y);
          ctx.lineTo(x + bs - 1, y + bs/2);
          ctx.lineTo(x + bs/2, y + bs - 1);
          ctx.lineTo(x, y + bs/2);
          ctx.fill();
        } else if (block.style === 'crosshair') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + bs/2, y + bs*0.2); ctx.lineTo(x + bs/2, y + bs*0.8);
          ctx.moveTo(x + bs*0.2, y + bs/2); ctx.lineTo(x + bs*0.8, y + bs/2);
          ctx.stroke();
        } else if (block.style === 'brackets') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + bs*0.3, y + bs*0.2); ctx.lineTo(x + bs*0.2, y + bs*0.2); ctx.lineTo(x + bs*0.2, y + bs*0.8); ctx.lineTo(x + bs*0.3, y + bs*0.8);
          ctx.moveTo(x + bs*0.7, y + bs*0.2); ctx.lineTo(x + bs*0.8, y + bs*0.2); ctx.lineTo(x + bs*0.8, y + bs*0.8); ctx.lineTo(x + bs*0.7, y + bs*0.8);
          ctx.stroke();
        } else if (block.style === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(x + bs/2, y + bs*0.15);
          ctx.lineTo(x + bs*0.85, y + bs*0.85);
          ctx.lineTo(x + bs*0.15, y + bs*0.85);
          ctx.fill();
        } else if (block.style === 'inset-1') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(x + bs*0.1, y + bs*0.1, bs*(1.0-0.2), bs*(1.0-0.2));
        } else if (block.style === 'inset-2') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(x + bs*0.2, y + bs*0.2, bs*(1.0-0.4), bs*(1.0-0.4));
        } else if (block.style === 'inset-3') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(x + bs*0.30000000000000004, y + bs*0.30000000000000004, bs*(1.0-0.6000000000000001), bs*(1.0-0.6000000000000001));
        } else if (block.style === 'inset-4') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(x + bs*0.4, y + bs*0.4, bs*(1.0-0.8), bs*(1.0-0.8));
        } else if (block.style === 'inset-5') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(x + bs*0.5, y + bs*0.5, bs*(1.0-1.0), bs*(1.0-1.0));
        } else if (block.style === 'hlines-2') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.25);
          ctx.fillRect(x, y + bs*0.5, bs, bs*0.25);
        } else if (block.style === 'hlines-3') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.16666666666666666);
          ctx.fillRect(x, y + bs*0.3333333333333333, bs, bs*0.16666666666666666);
          ctx.fillRect(x, y + bs*0.6666666666666666, bs, bs*0.16666666666666666);
        } else if (block.style === 'hlines-4') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.125);
          ctx.fillRect(x, y + bs*0.25, bs, bs*0.125);
          ctx.fillRect(x, y + bs*0.5, bs, bs*0.125);
          ctx.fillRect(x, y + bs*0.75, bs, bs*0.125);
        } else if (block.style === 'hlines-5') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.1);
          ctx.fillRect(x, y + bs*0.2, bs, bs*0.1);
          ctx.fillRect(x, y + bs*0.4, bs, bs*0.1);
          ctx.fillRect(x, y + bs*0.6, bs, bs*0.1);
          ctx.fillRect(x, y + bs*0.8, bs, bs*0.1);
        } else if (block.style === 'hlines-6') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.08333333333333333);
          ctx.fillRect(x, y + bs*0.16666666666666666, bs, bs*0.08333333333333333);
          ctx.fillRect(x, y + bs*0.3333333333333333, bs, bs*0.08333333333333333);
          ctx.fillRect(x, y + bs*0.5, bs, bs*0.08333333333333333);
          ctx.fillRect(x, y + bs*0.6666666666666666, bs, bs*0.08333333333333333);
          ctx.fillRect(x, y + bs*0.8333333333333334, bs, bs*0.08333333333333333);
        } else if (block.style === 'hlines-7') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.07142857142857142);
          ctx.fillRect(x, y + bs*0.14285714285714285, bs, bs*0.07142857142857142);
          ctx.fillRect(x, y + bs*0.2857142857142857, bs, bs*0.07142857142857142);
          ctx.fillRect(x, y + bs*0.42857142857142855, bs, bs*0.07142857142857142);
          ctx.fillRect(x, y + bs*0.5714285714285714, bs, bs*0.07142857142857142);
          ctx.fillRect(x, y + bs*0.7142857142857143, bs, bs*0.07142857142857142);
          ctx.fillRect(x, y + bs*0.8571428571428571, bs, bs*0.07142857142857142);
        } else if (block.style === 'hlines-8') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.0625);
          ctx.fillRect(x, y + bs*0.125, bs, bs*0.0625);
          ctx.fillRect(x, y + bs*0.25, bs, bs*0.0625);
          ctx.fillRect(x, y + bs*0.375, bs, bs*0.0625);
          ctx.fillRect(x, y + bs*0.5, bs, bs*0.0625);
          ctx.fillRect(x, y + bs*0.625, bs, bs*0.0625);
          ctx.fillRect(x, y + bs*0.75, bs, bs*0.0625);
          ctx.fillRect(x, y + bs*0.875, bs, bs*0.0625);
        } else if (block.style === 'hlines-9') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.05555555555555555);
          ctx.fillRect(x, y + bs*0.1111111111111111, bs, bs*0.05555555555555555);
          ctx.fillRect(x, y + bs*0.2222222222222222, bs, bs*0.05555555555555555);
          ctx.fillRect(x, y + bs*0.3333333333333333, bs, bs*0.05555555555555555);
          ctx.fillRect(x, y + bs*0.4444444444444444, bs, bs*0.05555555555555555);
          ctx.fillRect(x, y + bs*0.5555555555555556, bs, bs*0.05555555555555555);
          ctx.fillRect(x, y + bs*0.6666666666666666, bs, bs*0.05555555555555555);
          ctx.fillRect(x, y + bs*0.7777777777777778, bs, bs*0.05555555555555555);
          ctx.fillRect(x, y + bs*0.8888888888888888, bs, bs*0.05555555555555555);
        } else if (block.style === 'hlines-10') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.05);
          ctx.fillRect(x, y + bs*0.1, bs, bs*0.05);
          ctx.fillRect(x, y + bs*0.2, bs, bs*0.05);
          ctx.fillRect(x, y + bs*0.3, bs, bs*0.05);
          ctx.fillRect(x, y + bs*0.4, bs, bs*0.05);
          ctx.fillRect(x, y + bs*0.5, bs, bs*0.05);
          ctx.fillRect(x, y + bs*0.6, bs, bs*0.05);
          ctx.fillRect(x, y + bs*0.7, bs, bs*0.05);
          ctx.fillRect(x, y + bs*0.8, bs, bs*0.05);
          ctx.fillRect(x, y + bs*0.9, bs, bs*0.05);
        } else if (block.style === 'hlines-11') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.045454545454545456);
          ctx.fillRect(x, y + bs*0.09090909090909091, bs, bs*0.045454545454545456);
          ctx.fillRect(x, y + bs*0.18181818181818182, bs, bs*0.045454545454545456);
          ctx.fillRect(x, y + bs*0.2727272727272727, bs, bs*0.045454545454545456);
          ctx.fillRect(x, y + bs*0.36363636363636365, bs, bs*0.045454545454545456);
          ctx.fillRect(x, y + bs*0.45454545454545453, bs, bs*0.045454545454545456);
          ctx.fillRect(x, y + bs*0.5454545454545454, bs, bs*0.045454545454545456);
          ctx.fillRect(x, y + bs*0.6363636363636364, bs, bs*0.045454545454545456);
          ctx.fillRect(x, y + bs*0.7272727272727273, bs, bs*0.045454545454545456);
          ctx.fillRect(x, y + bs*0.8181818181818182, bs, bs*0.045454545454545456);
          ctx.fillRect(x, y + bs*0.9090909090909091, bs, bs*0.045454545454545456);
        } else if (block.style === 'vlines-2') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + bs*0.0, y, bs*0.25, bs);
          ctx.fillRect(x + bs*0.5, y, bs*0.25, bs);
        } else if (block.style === 'vlines-3') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + bs*0.0, y, bs*0.16666666666666666, bs);
          ctx.fillRect(x + bs*0.3333333333333333, y, bs*0.16666666666666666, bs);
          ctx.fillRect(x + bs*0.6666666666666666, y, bs*0.16666666666666666, bs);
        } else if (block.style === 'vlines-4') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + bs*0.0, y, bs*0.125, bs);
          ctx.fillRect(x + bs*0.25, y, bs*0.125, bs);
          ctx.fillRect(x + bs*0.5, y, bs*0.125, bs);
          ctx.fillRect(x + bs*0.75, y, bs*0.125, bs);
        } else if (block.style === 'vlines-5') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + bs*0.0, y, bs*0.1, bs);
          ctx.fillRect(x + bs*0.2, y, bs*0.1, bs);
          ctx.fillRect(x + bs*0.4, y, bs*0.1, bs);
          ctx.fillRect(x + bs*0.6, y, bs*0.1, bs);
          ctx.fillRect(x + bs*0.8, y, bs*0.1, bs);
        } else if (block.style === 'vlines-6') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + bs*0.0, y, bs*0.08333333333333333, bs);
          ctx.fillRect(x + bs*0.16666666666666666, y, bs*0.08333333333333333, bs);
          ctx.fillRect(x + bs*0.3333333333333333, y, bs*0.08333333333333333, bs);
          ctx.fillRect(x + bs*0.5, y, bs*0.08333333333333333, bs);
          ctx.fillRect(x + bs*0.6666666666666666, y, bs*0.08333333333333333, bs);
          ctx.fillRect(x + bs*0.8333333333333334, y, bs*0.08333333333333333, bs);
        } else if (block.style === 'vlines-7') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + bs*0.0, y, bs*0.07142857142857142, bs);
          ctx.fillRect(x + bs*0.14285714285714285, y, bs*0.07142857142857142, bs);
          ctx.fillRect(x + bs*0.2857142857142857, y, bs*0.07142857142857142, bs);
          ctx.fillRect(x + bs*0.42857142857142855, y, bs*0.07142857142857142, bs);
          ctx.fillRect(x + bs*0.5714285714285714, y, bs*0.07142857142857142, bs);
          ctx.fillRect(x + bs*0.7142857142857143, y, bs*0.07142857142857142, bs);
          ctx.fillRect(x + bs*0.8571428571428571, y, bs*0.07142857142857142, bs);
        } else if (block.style === 'vlines-8') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + bs*0.0, y, bs*0.0625, bs);
          ctx.fillRect(x + bs*0.125, y, bs*0.0625, bs);
          ctx.fillRect(x + bs*0.25, y, bs*0.0625, bs);
          ctx.fillRect(x + bs*0.375, y, bs*0.0625, bs);
          ctx.fillRect(x + bs*0.5, y, bs*0.0625, bs);
          ctx.fillRect(x + bs*0.625, y, bs*0.0625, bs);
          ctx.fillRect(x + bs*0.75, y, bs*0.0625, bs);
          ctx.fillRect(x + bs*0.875, y, bs*0.0625, bs);
        } else if (block.style === 'vlines-9') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + bs*0.0, y, bs*0.05555555555555555, bs);
          ctx.fillRect(x + bs*0.1111111111111111, y, bs*0.05555555555555555, bs);
          ctx.fillRect(x + bs*0.2222222222222222, y, bs*0.05555555555555555, bs);
          ctx.fillRect(x + bs*0.3333333333333333, y, bs*0.05555555555555555, bs);
          ctx.fillRect(x + bs*0.4444444444444444, y, bs*0.05555555555555555, bs);
          ctx.fillRect(x + bs*0.5555555555555556, y, bs*0.05555555555555555, bs);
          ctx.fillRect(x + bs*0.6666666666666666, y, bs*0.05555555555555555, bs);
          ctx.fillRect(x + bs*0.7777777777777778, y, bs*0.05555555555555555, bs);
          ctx.fillRect(x + bs*0.8888888888888888, y, bs*0.05555555555555555, bs);
        } else if (block.style === 'vlines-10') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + bs*0.0, y, bs*0.05, bs);
          ctx.fillRect(x + bs*0.1, y, bs*0.05, bs);
          ctx.fillRect(x + bs*0.2, y, bs*0.05, bs);
          ctx.fillRect(x + bs*0.3, y, bs*0.05, bs);
          ctx.fillRect(x + bs*0.4, y, bs*0.05, bs);
          ctx.fillRect(x + bs*0.5, y, bs*0.05, bs);
          ctx.fillRect(x + bs*0.6, y, bs*0.05, bs);
          ctx.fillRect(x + bs*0.7, y, bs*0.05, bs);
          ctx.fillRect(x + bs*0.8, y, bs*0.05, bs);
          ctx.fillRect(x + bs*0.9, y, bs*0.05, bs);
        } else if (block.style === 'vlines-11') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x + bs*0.0, y, bs*0.045454545454545456, bs);
          ctx.fillRect(x + bs*0.09090909090909091, y, bs*0.045454545454545456, bs);
          ctx.fillRect(x + bs*0.18181818181818182, y, bs*0.045454545454545456, bs);
          ctx.fillRect(x + bs*0.2727272727272727, y, bs*0.045454545454545456, bs);
          ctx.fillRect(x + bs*0.36363636363636365, y, bs*0.045454545454545456, bs);
          ctx.fillRect(x + bs*0.45454545454545453, y, bs*0.045454545454545456, bs);
          ctx.fillRect(x + bs*0.5454545454545454, y, bs*0.045454545454545456, bs);
          ctx.fillRect(x + bs*0.6363636363636364, y, bs*0.045454545454545456, bs);
          ctx.fillRect(x + bs*0.7272727272727273, y, bs*0.045454545454545456, bs);
          ctx.fillRect(x + bs*0.8181818181818182, y, bs*0.045454545454545456, bs);
          ctx.fillRect(x + bs*0.9090909090909091, y, bs*0.045454545454545456, bs);
        } else if (block.style === 'grid-2') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.1);
          ctx.fillRect(x + bs*0.0, y, bs*0.1, bs);
          ctx.fillRect(x, y + bs*0.5, bs, bs*0.1);
          ctx.fillRect(x + bs*0.5, y, bs*0.1, bs);
        } else if (block.style === 'grid-3') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.06666666666666667);
          ctx.fillRect(x + bs*0.0, y, bs*0.06666666666666667, bs);
          ctx.fillRect(x, y + bs*0.3333333333333333, bs, bs*0.06666666666666667);
          ctx.fillRect(x + bs*0.3333333333333333, y, bs*0.06666666666666667, bs);
          ctx.fillRect(x, y + bs*0.6666666666666666, bs, bs*0.06666666666666667);
          ctx.fillRect(x + bs*0.6666666666666666, y, bs*0.06666666666666667, bs);
        } else if (block.style === 'grid-4') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.05);
          ctx.fillRect(x + bs*0.0, y, bs*0.05, bs);
          ctx.fillRect(x, y + bs*0.25, bs, bs*0.05);
          ctx.fillRect(x + bs*0.25, y, bs*0.05, bs);
          ctx.fillRect(x, y + bs*0.5, bs, bs*0.05);
          ctx.fillRect(x + bs*0.5, y, bs*0.05, bs);
          ctx.fillRect(x, y + bs*0.75, bs, bs*0.05);
          ctx.fillRect(x + bs*0.75, y, bs*0.05, bs);
        } else if (block.style === 'grid-5') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.04);
          ctx.fillRect(x + bs*0.0, y, bs*0.04, bs);
          ctx.fillRect(x, y + bs*0.2, bs, bs*0.04);
          ctx.fillRect(x + bs*0.2, y, bs*0.04, bs);
          ctx.fillRect(x, y + bs*0.4, bs, bs*0.04);
          ctx.fillRect(x + bs*0.4, y, bs*0.04, bs);
          ctx.fillRect(x, y + bs*0.6, bs, bs*0.04);
          ctx.fillRect(x + bs*0.6, y, bs*0.04, bs);
          ctx.fillRect(x, y + bs*0.8, bs, bs*0.04);
          ctx.fillRect(x + bs*0.8, y, bs*0.04, bs);
        } else if (block.style === 'grid-6') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.03333333333333333);
          ctx.fillRect(x + bs*0.0, y, bs*0.03333333333333333, bs);
          ctx.fillRect(x, y + bs*0.16666666666666666, bs, bs*0.03333333333333333);
          ctx.fillRect(x + bs*0.16666666666666666, y, bs*0.03333333333333333, bs);
          ctx.fillRect(x, y + bs*0.3333333333333333, bs, bs*0.03333333333333333);
          ctx.fillRect(x + bs*0.3333333333333333, y, bs*0.03333333333333333, bs);
          ctx.fillRect(x, y + bs*0.5, bs, bs*0.03333333333333333);
          ctx.fillRect(x + bs*0.5, y, bs*0.03333333333333333, bs);
          ctx.fillRect(x, y + bs*0.6666666666666666, bs, bs*0.03333333333333333);
          ctx.fillRect(x + bs*0.6666666666666666, y, bs*0.03333333333333333, bs);
          ctx.fillRect(x, y + bs*0.8333333333333334, bs, bs*0.03333333333333333);
          ctx.fillRect(x + bs*0.8333333333333334, y, bs*0.03333333333333333, bs);
        } else if (block.style === 'grid-7') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.028571428571428574);
          ctx.fillRect(x + bs*0.0, y, bs*0.028571428571428574, bs);
          ctx.fillRect(x, y + bs*0.14285714285714285, bs, bs*0.028571428571428574);
          ctx.fillRect(x + bs*0.14285714285714285, y, bs*0.028571428571428574, bs);
          ctx.fillRect(x, y + bs*0.2857142857142857, bs, bs*0.028571428571428574);
          ctx.fillRect(x + bs*0.2857142857142857, y, bs*0.028571428571428574, bs);
          ctx.fillRect(x, y + bs*0.42857142857142855, bs, bs*0.028571428571428574);
          ctx.fillRect(x + bs*0.42857142857142855, y, bs*0.028571428571428574, bs);
          ctx.fillRect(x, y + bs*0.5714285714285714, bs, bs*0.028571428571428574);
          ctx.fillRect(x + bs*0.5714285714285714, y, bs*0.028571428571428574, bs);
          ctx.fillRect(x, y + bs*0.7142857142857143, bs, bs*0.028571428571428574);
          ctx.fillRect(x + bs*0.7142857142857143, y, bs*0.028571428571428574, bs);
          ctx.fillRect(x, y + bs*0.8571428571428571, bs, bs*0.028571428571428574);
          ctx.fillRect(x + bs*0.8571428571428571, y, bs*0.028571428571428574, bs);
        } else if (block.style === 'grid-8') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.025);
          ctx.fillRect(x + bs*0.0, y, bs*0.025, bs);
          ctx.fillRect(x, y + bs*0.125, bs, bs*0.025);
          ctx.fillRect(x + bs*0.125, y, bs*0.025, bs);
          ctx.fillRect(x, y + bs*0.25, bs, bs*0.025);
          ctx.fillRect(x + bs*0.25, y, bs*0.025, bs);
          ctx.fillRect(x, y + bs*0.375, bs, bs*0.025);
          ctx.fillRect(x + bs*0.375, y, bs*0.025, bs);
          ctx.fillRect(x, y + bs*0.5, bs, bs*0.025);
          ctx.fillRect(x + bs*0.5, y, bs*0.025, bs);
          ctx.fillRect(x, y + bs*0.625, bs, bs*0.025);
          ctx.fillRect(x + bs*0.625, y, bs*0.025, bs);
          ctx.fillRect(x, y + bs*0.75, bs, bs*0.025);
          ctx.fillRect(x + bs*0.75, y, bs*0.025, bs);
          ctx.fillRect(x, y + bs*0.875, bs, bs*0.025);
          ctx.fillRect(x + bs*0.875, y, bs*0.025, bs);
        } else if (block.style === 'grid-9') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.022222222222222223);
          ctx.fillRect(x + bs*0.0, y, bs*0.022222222222222223, bs);
          ctx.fillRect(x, y + bs*0.1111111111111111, bs, bs*0.022222222222222223);
          ctx.fillRect(x + bs*0.1111111111111111, y, bs*0.022222222222222223, bs);
          ctx.fillRect(x, y + bs*0.2222222222222222, bs, bs*0.022222222222222223);
          ctx.fillRect(x + bs*0.2222222222222222, y, bs*0.022222222222222223, bs);
          ctx.fillRect(x, y + bs*0.3333333333333333, bs, bs*0.022222222222222223);
          ctx.fillRect(x + bs*0.3333333333333333, y, bs*0.022222222222222223, bs);
          ctx.fillRect(x, y + bs*0.4444444444444444, bs, bs*0.022222222222222223);
          ctx.fillRect(x + bs*0.4444444444444444, y, bs*0.022222222222222223, bs);
          ctx.fillRect(x, y + bs*0.5555555555555556, bs, bs*0.022222222222222223);
          ctx.fillRect(x + bs*0.5555555555555556, y, bs*0.022222222222222223, bs);
          ctx.fillRect(x, y + bs*0.6666666666666666, bs, bs*0.022222222222222223);
          ctx.fillRect(x + bs*0.6666666666666666, y, bs*0.022222222222222223, bs);
          ctx.fillRect(x, y + bs*0.7777777777777778, bs, bs*0.022222222222222223);
          ctx.fillRect(x + bs*0.7777777777777778, y, bs*0.022222222222222223, bs);
          ctx.fillRect(x, y + bs*0.8888888888888888, bs, bs*0.022222222222222223);
          ctx.fillRect(x + bs*0.8888888888888888, y, bs*0.022222222222222223, bs);
        } else if (block.style === 'grid-10') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.02);
          ctx.fillRect(x + bs*0.0, y, bs*0.02, bs);
          ctx.fillRect(x, y + bs*0.1, bs, bs*0.02);
          ctx.fillRect(x + bs*0.1, y, bs*0.02, bs);
          ctx.fillRect(x, y + bs*0.2, bs, bs*0.02);
          ctx.fillRect(x + bs*0.2, y, bs*0.02, bs);
          ctx.fillRect(x, y + bs*0.3, bs, bs*0.02);
          ctx.fillRect(x + bs*0.3, y, bs*0.02, bs);
          ctx.fillRect(x, y + bs*0.4, bs, bs*0.02);
          ctx.fillRect(x + bs*0.4, y, bs*0.02, bs);
          ctx.fillRect(x, y + bs*0.5, bs, bs*0.02);
          ctx.fillRect(x + bs*0.5, y, bs*0.02, bs);
          ctx.fillRect(x, y + bs*0.6, bs, bs*0.02);
          ctx.fillRect(x + bs*0.6, y, bs*0.02, bs);
          ctx.fillRect(x, y + bs*0.7, bs, bs*0.02);
          ctx.fillRect(x + bs*0.7, y, bs*0.02, bs);
          ctx.fillRect(x, y + bs*0.8, bs, bs*0.02);
          ctx.fillRect(x + bs*0.8, y, bs*0.02, bs);
          ctx.fillRect(x, y + bs*0.9, bs, bs*0.02);
          ctx.fillRect(x + bs*0.9, y, bs*0.02, bs);
        } else if (block.style === 'grid-11') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x, y + bs*0.0, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.0, y, bs*0.018181818181818184, bs);
          ctx.fillRect(x, y + bs*0.09090909090909091, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.09090909090909091, y, bs*0.018181818181818184, bs);
          ctx.fillRect(x, y + bs*0.18181818181818182, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.18181818181818182, y, bs*0.018181818181818184, bs);
          ctx.fillRect(x, y + bs*0.2727272727272727, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.2727272727272727, y, bs*0.018181818181818184, bs);
          ctx.fillRect(x, y + bs*0.36363636363636365, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.36363636363636365, y, bs*0.018181818181818184, bs);
          ctx.fillRect(x, y + bs*0.45454545454545453, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.45454545454545453, y, bs*0.018181818181818184, bs);
          ctx.fillRect(x, y + bs*0.5454545454545454, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.5454545454545454, y, bs*0.018181818181818184, bs);
          ctx.fillRect(x, y + bs*0.6363636363636364, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.6363636363636364, y, bs*0.018181818181818184, bs);
          ctx.fillRect(x, y + bs*0.7272727272727273, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.7272727272727273, y, bs*0.018181818181818184, bs);
          ctx.fillRect(x, y + bs*0.8181818181818182, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.8181818181818182, y, bs*0.018181818181818184, bs);
          ctx.fillRect(x, y + bs*0.9090909090909091, bs, bs*0.018181818181818184);
          ctx.fillRect(x + bs*0.9090909090909091, y, bs*0.018181818181818184, bs);
        } else if (block.style === 'plus-1') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + bs*(0.5-0.05), y, bs*0.1, bs);
          ctx.fillRect(x, y + bs*(0.5-0.05), bs, bs*0.1);
        } else if (block.style === 'plus-2') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + bs*(0.5-0.1), y, bs*0.2, bs);
          ctx.fillRect(x, y + bs*(0.5-0.1), bs, bs*0.2);
        } else if (block.style === 'plus-3') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + bs*(0.5-0.15000000000000002), y, bs*0.30000000000000004, bs);
          ctx.fillRect(x, y + bs*(0.5-0.15000000000000002), bs, bs*0.30000000000000004);
        } else if (block.style === 'plus-4') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + bs*(0.5-0.2), y, bs*0.4, bs);
          ctx.fillRect(x, y + bs*(0.5-0.2), bs, bs*0.4);
        } else if (block.style === 'plus-5') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + bs*(0.5-0.25), y, bs*0.5, bs);
          ctx.fillRect(x, y + bs*(0.5-0.25), bs, bs*0.5);
        } else if (block.style === 'plus-6') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + bs*(0.5-0.30000000000000004), y, bs*0.6000000000000001, bs);
          ctx.fillRect(x, y + bs*(0.5-0.30000000000000004), bs, bs*0.6000000000000001);
        } else if (block.style === 'plus-7') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + bs*(0.5-0.35000000000000003), y, bs*0.7000000000000001, bs);
          ctx.fillRect(x, y + bs*(0.5-0.35000000000000003), bs, bs*0.7000000000000001);
        } else if (block.style === 'plus-8') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + bs*(0.5-0.4), y, bs*0.8, bs);
          ctx.fillRect(x, y + bs*(0.5-0.4), bs, bs*0.8);
        } else if (block.style === 'circles-1') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.4, 0, Math.PI*2);
          ctx.stroke();
        } else if (block.style === 'circles-2') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.2, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.4, 0, Math.PI*2);
          ctx.stroke();
        } else if (block.style === 'circles-3') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.13333333333333333, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.26666666666666666, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.4, 0, Math.PI*2);
          ctx.stroke();
        } else if (block.style === 'circles-4') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.1, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.2, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.30000000000000004, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.4, 0, Math.PI*2);
          ctx.stroke();
        } else if (block.style === 'circles-5') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.08, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.16, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.24, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.32, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.4, 0, Math.PI*2);
          ctx.stroke();
        } else if (block.style === 'circles-6') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.06666666666666667, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.13333333333333333, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.2, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.26666666666666666, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.3333333333333333, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.4, 0, Math.PI*2);
          ctx.stroke();
        } else if (block.style === 'circles-7') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.05714285714285715, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.1142857142857143, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.17142857142857143, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.2285714285714286, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.28571428571428575, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.34285714285714286, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.4, 0, Math.PI*2);
          ctx.stroke();
        } else if (block.style === 'circles-8') {
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.05, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.1, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.15000000000000002, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.2, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.25, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.30000000000000004, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.35000000000000003, 0, Math.PI*2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*0.4, 0, Math.PI*2);
          ctx.stroke();

        } else {
          ctx.fillRect(x, y, bs - 1, bs - 1);
        }

        if (block.isFirewall) {
          ctx.strokeStyle = '#ff3366';
          ctx.lineWidth = 3;
          ctx.strokeRect(x+1.5, y+1.5, bs-4, bs-4);
          ctx.fillStyle = 'rgba(255, 51, 102, 0.15)';
          ctx.fillRect(x, y, bs - 1, bs - 1);
        }

        // Bevel: lighter top-left edges
        if (block.style !== 'circle' && block.style !== 'diamond') {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(x, y, bs - 1, 1);
          ctx.fillRect(x, y, 1, bs - 1);

          // Bevel: darker bottom-right edges
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(x, y + bs - 2, bs - 1, 1);
          ctx.fillRect(x + bs - 2, y, 1, bs - 1);
        }

        // Unreachable blocks are darker (depth illusion)
        if (!reachable) {
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(x, y, bs - 1, bs - 1);
        }

        // Damage overlay
        if (block.hp < block.maxHp) {
          const damageRatio = 1 - (block.hp / block.maxHp);
          if (damageRatio > 0.1) {
            ctx.strokeStyle = `rgba(0,0,0,${0.3 + damageRatio * 0.5})`;
            ctx.lineWidth = 1.5 + damageRatio * 2;
            ctx.beginPath();
            
            const s1 = block.seed;
            const s2 = (block.seed * 13.37) % 1;
            
            // Main central crack
            ctx.moveTo(x + bs*(0.2 + s1*0.6), y + bs*0.1);
            ctx.lineTo(x + bs*(0.4 + s2*0.2), y + bs*0.5);
            ctx.lineTo(x + bs*(0.1 + s1*0.8), y + bs*0.9);
            
            // Secondary branch if very damaged
            if (damageRatio > 0.4) {
              ctx.moveTo(x + bs*(0.4 + s2*0.2), y + bs*0.5);
              ctx.lineTo(x + bs*(s1 > 0.5 ? 0.9 : 0.1), y + bs*(0.3 + s2*0.4));
            }
            
            // Shatter if extremely damaged
            if (damageRatio > 0.7) {
              ctx.moveTo(x + bs*0.1, y + bs*(0.8 - s1*0.6));
              ctx.lineTo(x + bs*0.9, y + bs*(0.2 + s2*0.6));
            }
            
            ctx.stroke();
          }
        }

        // Hover highlight
        if (row === this.hoveredRow && col === this.hoveredCol && reachable) {
          ctx.strokeStyle = 'rgba(0,255,136,0.7)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, bs - 3, bs - 3);

          // Soft glow
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 12;
          ctx.strokeRect(x + 1, y + 1, bs - 3, bs - 3);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Depth and Biome Canvas Texts Removed for clarity.

    // Particles
    for (const p of this.particles) {
      const screenY = p.y - camY;
      if (screenY < -20 || screenY > h + 20) continue;
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, screenY - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Edge walls (decorative dark strips on sides)
    const wallGrad = ctx.createLinearGradient(0, 0, this.offsetX, 0);
    wallGrad.addColorStop(0, 'rgba(5,5,8,0.9)');
    wallGrad.addColorStop(1, 'rgba(5,5,8,0)');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, this.offsetX, h);

    const wallGrad2 = ctx.createLinearGradient(w, 0, w - this.offsetX, 0);
    wallGrad2.addColorStop(0, 'rgba(5,5,8,0.9)');
    wallGrad2.addColorStop(1, 'rgba(5,5,8,0)');
    ctx.fillStyle = wallGrad2;
    ctx.fillRect(this.offsetX + COLS * bs, 0, this.offsetX + 20, h);
  }

  // ========== WEBGL POST-PROCESSING ==========
  _postProcess() {
    if (!this.useWebGL) {
      this.fallbackCtx.drawImage(this.offscreen, 0, 0);
      return;
    }

    const gl = this.gl;
    const { biome } = getBiomeAtDepth(this.gameState.depth);

    // Smoothlerp shader uniform targets
    const vTarget = biome.vignetteIntensity || 0;
    const sTarget = biome.scanlines ? 1.0 : 0.0;
    const cTarget = biome.chromaticAberration || 0;
    const gTarget = biome.bloomStrength || 0.0;
    const pTarget = biome.pixelate || 0.0;
    const iTarget = biome.invert || 0.0;
    const grTarget = biome.grain || 0.0;
    const hTarget = biome.hueShift || 0.0;

    const lerpSpeed = 2.0 * dt;
    this.shaderVignette += (vTarget - this.shaderVignette) * lerpSpeed;
    this.shaderScanlines += (sTarget - this.shaderScanlines) * lerpSpeed;
    this.shaderChroma += (cTarget - this.shaderChroma) * lerpSpeed;
    this.shaderGlow += (gTarget - this.shaderGlow) * lerpSpeed;
    this.shaderPixelate += (pTarget - this.shaderPixelate) * lerpSpeed;
    this.shaderInvert += (iTarget - this.shaderInvert) * lerpSpeed;
    this.shaderGrain += (grTarget - this.shaderGrain) * lerpSpeed;
    this.shaderHue += (hTarget - this.shaderHue) * lerpSpeed;

    // Upload canvas to texture
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.offscreen);

    // Set uniforms
    gl.useProgram(this.program);
    gl.uniform1i(this.uniforms.texture, 0);
    gl.uniform1f(this.uniforms.time, this.time);
    gl.uniform2f(this.uniforms.resolution, this.width, this.height);
      gl.uniform1f(this.uniforms.vignette, this.shaderVignette);
      gl.uniform1f(this.uniforms.scanlines, this.shaderScanlines);
      gl.uniform1f(this.uniforms.chroma, this.shaderChroma);
      gl.uniform1f(this.uniforms.glow, this.shaderGlow);
      gl.uniform1f(this.uniforms.pixelate, this.shaderPixelate);
      gl.uniform1f(this.uniforms.invert, this.shaderInvert);
      gl.uniform1f(this.uniforms.grain, this.shaderGrain);
      gl.uniform1f(this.uniforms.hue, this.shaderHue);

    // Draw fullscreen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // ========== GAME LOOP ==========
  update(ts) {
    const delta = (ts - this.lastTime) / 1000;
    this.lastTime = ts;

    this.isCatchingUp = false;

    if (delta > 1.0) {
      this.isCatchingUp = true;
      const step = 0.1;
      const limit = Math.min(delta, 1800); // Max 30 mins catchup
      let accumulated = 0;
      while (accumulated < limit) {
        this._updateLogic(step);
        accumulated += step;
      }
      this.isCatchingUp = false;
      const remainder = limit % step;
      if (remainder > 0.001) {
        this._updateLogic(remainder);
      }
    } else {
      this._updateLogic(Math.min(delta, 0.1));
    }

    // Camera
    const targetRow = this.activeRow - 1;
    this.targetCameraY = Math.max(0, targetRow * this.blockSize - this.height * 0.25);
    if (delta > 1.0) {
      this.cameraY = this.targetCameraY;
    } else {
      this.cameraY += (this.targetCameraY - this.cameraY) * 0.05;
    }

    // Generate more rows if approaching bottom
    const visibleBottom = Math.ceil((this.cameraY + this.height) / this.blockSize);
    if (visibleBottom + GENERATE_BUFFER > this.generatedRows) {
      this._generateRows(100);
    }

    // Update Particles
    let aliveParticles = 0;
    const pDelta = Math.min(delta, 0.1);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * pDelta;
      p.y += p.vy * pDelta;
      p.life -= pDelta;
      if (p.life > 0) {
        this.particles[aliveParticles++] = p;
      }
    }
    this.particles.length = aliveParticles;

    // Render
    this._render();
    this._postProcess();
  }

  _updateLogic(delta) {
    // HARD SYNC DEPTH EVERY FRAME
    this.gameState.depth = Math.max(0, this.activeRow - SKY_ROWS);
    this.time += delta;

    // Hold-to-mine
    if (this.isMouseDown && this.hoveredRow >= 0 && this.gameState.upgrades.holdToClick > 0) {
      this.mineTimer += delta;
      while (this.mineTimer >= this.nextMineTarget) {
        this.mineTimer -= this.nextMineTarget;
        this.nextMineTarget = 0.166 + Math.random() * 0.034;
        this._tryMine();
      }
    }

    // Auto miners
    const autoMiners = this.gameState.upgrades.autoMiner || 0;
    if (autoMiners > 0) {
      const speedLv = this.gameState.upgrades.autoSpeed || 0;
      const interval = 0.35 / (1 + speedLv * 0.1);
      
      this.autoMineTimer += delta;
      while (this.autoMineTimer >= interval) {
        this.autoMineTimer -= interval;
        
        // Drones attempt to mine alive blocks
        const baseDmg = 1 + (this.gameState.upgrades.miningPower || 0) * 0.1;
        const prestigeMulti = 1 + (this.gameState.prestigeShards || 0) * 0.50;
        const overclockChance = (this.gameState.upgrades.overclock || 0) * 0.025;
        const isOverclock = Math.random() < overclockChance;
        const dmg = Math.max(1, Math.floor(baseDmg * prestigeMulti * (isOverclock ? 3 : 1)));

        let mined = 0;
        let attempts = 0;
        const maxAttempts = autoMiners * 3;
        while (mined < autoMiners && attempts < maxAttempts) {
          const col = Math.floor(Math.random() * COLS);
          attempts++;
          if (this.activeRow < this.blocks.length) {
            const b = this.blocks[this.activeRow][col];
            if (b.alive) {
              b.hp -= dmg;
              if (isOverclock) {
                this._spawnParticles(col, this.activeRow, '#ffaa00', 3);
              }
              if (b.hp <= 0) {
                this._destroyBlock(this.activeRow, col, true);
              }
              mined++;
            }
          }
        }
      }
    }
  }
}
