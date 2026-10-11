// Multi-Biome Parallax Pixel Art Backgrounds with Rich Living Atmospheric Effects
// 8 Biomes (5 Chapters Each = 40 Chapters Total):
// 0: Cyber Metropolis / Skyline with pulsing windows, flying skycars & beacon towers
// 1: Cosmic Dream Nebulae with dithered star clouds, ringed gas giant & comet
// 2: High Alpine Mountain Ridge with stepped snow peaks, pine slopes & blizzard sheets
// 3: The Aurora Summit 3000M with giant glowing moon, waving auroras & summit flurry
// 4: Mirror Temple / Ancient Crypts with gothic arches, gargoyles & floating mirror runes
// 5: The Chasm Abyss with hanging stalactites, underground waterfalls & glowing crystals
// 6: The Molten Core with bubbling lava lake, industrial girders & volcanic cinders
// 7: Celestial Apex 4000M with curved planetary horizon, solar corona & crystal monoliths

export class Background {
  constructor() {
    this.cloudOffset = 0;
    this.stars = [];
    this.shootingStars = [];
    this.shootingStarTimer = 3.5;
    this.ambientMotes = [];
    this.cityBldgs = [];
    this.time = 0;

    // Biome 0: Flying Skycars
    this.skyCars = [
      { x: 30, y: 68, speed: 52, dir: 1, len: 14 },
      { x: 210, y: 94, speed: 70, dir: -1, len: 16 },
      { x: 120, y: 118, speed: 42, dir: 1, len: 12 }
    ];

    // Biome 1: Cosmic Comet
    this.comet = { x: 30, y: 22, vx: 50, vy: 16 };

    // Biome 6: Real Animated Fluid Magma Physics (Spring Columns + Splashing Droplets)
    this.lavaSpringCols = 80;
    this.lavaSprings = [];
    for (let i = 0; i < this.lavaSpringCols; i++) {
      this.lavaSprings.push({ y: 0, v: 0 });
    }
    this.lavaDroplets = [];
    this.lavaBubbleTimer = 0;

    // Biome 6: Lava Bubbles (Deep boiling churning magma bubbles)
    this.lavaBubbles = [];
    for (let i = 0; i < 28; i++) {
      this.lavaBubbles.push({
        x: Math.random() * 320,
        y: 135 + Math.random() * 45,
        speed: 12 + Math.random() * 22,
        r: 1 + Math.random() * 3.0,
        wobble: Math.random() * Math.PI * 2
      });
    }

    this.initStars();
    this.initMotes();
    this.initCity();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 75; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * 320),
        y: Math.floor(Math.random() * 140),
        twinkleSpeed: 1.5 + Math.random() * 3.5,
        phase: Math.random() * Math.PI * 2,
        isCross: Math.random() > 0.82,
        size: Math.random() > 0.75 ? 2 : 1
      });
    }
  }

  initMotes() {
    this.ambientMotes = [];
    for (let i = 0; i < 40; i++) {
      this.ambientMotes.push({
        x: Math.random() * 320,
        y: Math.random() * 180,
        speedY: 8 + Math.random() * 18,
        speedX: (Math.random() - 0.5) * 8,
        size: Math.random() > 0.7 ? 2 : 1,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  initCity() {
    this.cityBldgs = [];
    let curX = 0;
    while (curX < 450) {
      const w = 20 + Math.floor(Math.random() * 26);
      const h = 45 + Math.floor(Math.random() * 65);
      const windowRows = Math.floor(h / 8);
      const windowCols = Math.floor((w - 6) / 5);
      const windowGrid = [];

      for (let r = 0; r < windowRows; r++) {
        for (let c = 0; c < windowCols; c++) {
          windowGrid.push(Math.random() > 0.45);
        }
      }

      this.cityBldgs.push({
        x: curX,
        w,
        h,
        windowCols,
        windowRows,
        windowGrid,
        antenna: Math.random() > 0.4,
        neonSign: Math.random() > 0.7
      });
      curX += w + 2 + Math.floor(Math.random() * 6);
    }
  }

  update(dt) {
    this.time += dt;
    this.cloudOffset = (this.cloudOffset + dt * 10) % 640;

    // Twinkle stars
    for (const star of this.stars) {
      star.phase += dt * star.twinkleSpeed;
    }

    // Skycars in Cyber City
    for (const sc of this.skyCars) {
      sc.x += sc.speed * sc.dir * dt;
      if (sc.x > 360) sc.x = -40;
      if (sc.x < -40) sc.x = 360;
    }

    // Comet in Cosmic Nebula
    this.comet.x += this.comet.vx * dt * 0.15;
    this.comet.y += this.comet.vy * dt * 0.15;
    if (this.comet.x > 380) {
      this.comet.x = -60;
      this.comet.y = 15 + Math.random() * 35;
    }

    // Real Animated Fluid Magma Simulation (Spring Physics + Wave Propagation)
    const springs = this.lavaSprings;
    const n = springs.length;
    const k = 0.06;
    const d = 0.15;
    const spread = 0.20;

    for (let i = 0; i < n; i++) {
      const s = springs[i];
      s.v += -k * s.y - d * s.v;
      s.y += s.v * Math.min(1.0, 35 * dt);
    }

    // Ripple wave propagation between neighbors
    const leftDeltas = new Float32Array(n);
    const rightDeltas = new Float32Array(n);
    for (let iter = 0; iter < 4; iter++) {
      for (let i = 0; i < n; i++) {
        if (i > 0) {
          leftDeltas[i] = spread * (springs[i].y - springs[i - 1].y);
          springs[i - 1].v += leftDeltas[i];
        }
        if (i < n - 1) {
          rightDeltas[i] = spread * (springs[i].y - springs[i + 1].y);
          springs[i + 1].v += rightDeltas[i];
        }
      }
      for (let i = 0; i < n; i++) {
        if (i > 0) springs[i - 1].y += leftDeltas[i];
        if (i < n - 1) springs[i + 1].y += rightDeltas[i];
      }
    }

    // Spontaneous viscous magma bubble pop surges
    this.lavaBubbleTimer -= dt;
    if (this.lavaBubbleTimer <= 0) {
      this.lavaBubbleTimer = 0.20 + Math.random() * 0.40;
      const popCol = Math.floor(Math.random() * n);
      const splashPower = 5.0 + Math.random() * 7.0;
      springs[popCol].v -= splashPower;
      if (popCol > 0) springs[popCol - 1].v -= splashPower * 0.5;
      if (popCol < n - 1) springs[popCol + 1].v -= splashPower * 0.5;

      // Spawn glowing molten droplets arcing into the air
      const popX = popCol * 4 + 2;
      for (let dr = 0; dr < 3; dr++) {
        this.lavaDroplets.push({
          x: popX + (Math.random() - 0.5) * 6,
          y: 126 + springs[popCol].y,
          vx: (Math.random() - 0.5) * 50,
          vy: -45 - Math.random() * 55,
          life: 0.6 + Math.random() * 0.35,
          maxLife: 0.95
        });
      }
    }

    // Update active lava droplets
    for (let i = this.lavaDroplets.length - 1; i >= 0; i--) {
      const drop = this.lavaDroplets[i];
      drop.life -= dt;
      drop.vy += 175 * dt; // gravity
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      if (drop.life <= 0 || drop.y > 178) {
        this.lavaDroplets.splice(i, 1);
      }
    }

    // Lava bubbles in Molten Core depths
    for (const lb of this.lavaBubbles) {
      lb.wobble += dt * 3;
      lb.y -= lb.speed * dt;
      lb.x += Math.sin(lb.wobble) * 8 * dt;
      if (lb.y < 122) {
        lb.y = 180 + Math.random() * 12;
        lb.x = Math.random() * 320;
      }
    }

    // Ambient floating motes
    for (const mote of this.ambientMotes) {
      mote.wobble += dt * 2.5;
      mote.y += mote.speedY * dt;
      mote.x += (mote.speedX + Math.sin(mote.wobble) * 6) * dt;

      if (mote.y > 185) {
        mote.y = -5;
        mote.x = Math.random() * 320;
      } else if (mote.y < -5) {
        mote.y = 185;
      }
      if (mote.x > 325) mote.x = -5;
      if (mote.x < -5) mote.x = 325;
    }

    // Shooting stars
    this.shootingStarTimer -= dt;
    if (this.shootingStarTimer <= 0) {
      this.shootingStarTimer = 4 + Math.random() * 6;
      this.shootingStars.push({
        x: 40 + Math.random() * 220,
        y: 8 + Math.random() * 45,
        vx: 240 + Math.random() * 130,
        vy: 110 + Math.random() * 60,
        life: 0.35,
        maxLife: 0.35
      });
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.life -= dt;
      ss.x += ss.vx * dt;
      ss.y += ss.vy * dt;
      if (ss.life <= 0) {
        this.shootingStars.splice(i, 1);
      }
    }
  }

  render(ctx, palette, camX = 0, camY = 0, biome = 0) {
    const p = palette;

    if (biome === 0) {
      this.renderCyberCity(ctx, p, camX, camY);
    } else if (biome === 1) {
      this.renderCosmicNebula(ctx, p, camX, camY);
    } else if (biome === 2) {
      this.renderAlpineRidge(ctx, p, camX, camY);
    } else if (biome === 3) {
      this.renderSummitSky(ctx, p, camX, camY);
    } else if (biome === 4) {
      this.renderMirrorTemple(ctx, p, camX, camY);
    } else if (biome === 5) {
      this.renderChasmAbyss(ctx, p, camX, camY);
    } else if (biome === 6) {
      this.renderMoltenCore(ctx, p, camX, camY);
    } else {
      this.renderCelestialApex(ctx, p, camX, camY);
    }

    // Shooting stars
    for (const ss of this.shootingStars) {
      const alpha = Math.max(0, ss.life / ss.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(ss.x), Math.round(ss.y), 2, 2);
      ctx.fillStyle = p.getColor(6);
      ctx.fillRect(Math.round(ss.x - ss.vx * 0.04), Math.round(ss.y - ss.vy * 0.04), 2, 1);
      ctx.fillRect(Math.round(ss.x - ss.vx * 0.08), Math.round(ss.y - ss.vy * 0.08), 1, 1);
      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // BIOME 0: CYBER METROPOLIS SKYLINE
  // -------------------------------------------------------------
  renderCyberCity(ctx, p, camX, camY) {
    ctx.fillStyle = p.getColor(0);
    ctx.fillRect(0, 0, 320, 180);

    // Subtle horizon gradient glow
    ctx.fillStyle = p.getColor(1);
    ctx.fillRect(0, 120, 320, 60);
    ctx.fillStyle = p.getColor(2);
    ctx.fillRect(0, 148, 320, 32);

    // Stars
    for (const s of this.stars) {
      const bright = Math.sin(s.phase) > 0.2;
      ctx.fillStyle = bright ? '#ffffff' : p.getColor(4);
      const sx = Math.round((s.x - camX * 0.04 + 320) % 320);
      ctx.fillRect(sx, s.y, 1, 1);
      if (s.isCross && bright) {
        ctx.fillRect(sx - 1, s.y, 3, 1);
        ctx.fillRect(sx, s.y - 1, 1, 3);
      }
    }

    // Sweeping Searchlight Beams from distant towers
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 2; i++) {
      const beamOriginX = (i === 0 ? 80 : 250) - camX * 0.08;
      const beamAngle = Math.sin(this.time * 0.7 + i * 2.2) * 0.55;
      ctx.beginPath();
      ctx.moveTo(beamOriginX, 130);
      ctx.lineTo(beamOriginX + Math.sin(beamAngle - 0.12) * 160, 0);
      ctx.lineTo(beamOriginX + Math.sin(beamAngle + 0.12) * 160, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Distant background skyline (darkest silhouette)
    const farOffset = -camX * 0.12;
    ctx.fillStyle = p.getColor(1);
    for (const b of this.cityBldgs) {
      const bx = Math.round(b.x + farOffset);
      const by = 180 - b.h;
      ctx.fillRect(bx, by, b.w, b.h);

      if (b.antenna) {
        const ax = bx + Math.floor(b.w / 2);
        ctx.fillRect(ax, by - 14, 1, 14);
        // Blinking red beacon
        const beaconOn = Math.sin(this.time * 6 + b.x) > 0.2;
        ctx.fillStyle = beaconOn ? '#ff3333' : '#440000';
        ctx.fillRect(ax - 1, by - 16, 3, 2);
        ctx.fillStyle = p.getColor(1);
      }
    }

    // Flying Mag-Lev Skycars zipping between towers
    for (const sc of this.skyCars) {
      const cx = Math.round(sc.x - camX * 0.18);
      const cy = sc.y;
      ctx.fillStyle = p.getColor(4);
      ctx.fillRect(cx, cy, sc.len, 3);
      // Headlight & taillight
      if (sc.dir > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx + sc.len, cy + 1, 2, 1);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(cx - 1, cy + 1, 2, 1);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 2, cy + 1, 2, 1);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(cx + sc.len, cy + 1, 2, 1);
      }
    }

    // Midground city layer with glowing windows & neon signs
    const midOffset = -camX * 0.22;
    ctx.fillStyle = p.getColor(2);
    for (let i = 0; i < this.cityBldgs.length; i++) {
      const b = this.cityBldgs[i];
      const bx = Math.round((b.x * 0.85 + 40) + midOffset);
      const bh = Math.max(30, b.h - 15);
      const by = 180 - bh;
      ctx.fillRect(bx, by, b.w - 2, bh);

      // Neon rooftop signs
      if (b.neonSign && by > 60) {
        ctx.fillStyle = (Math.sin(this.time * 4 + i) > 0) ? p.getColor(7) : p.getColor(8);
        ctx.fillRect(bx + 2, by - 5, b.w - 6, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + 4, by - 4, 3, 1);
      }

      // Windows
      let wIdx = 0;
      for (let r = 0; r < b.windowRows; r++) {
        const wy = by + 6 + r * 7;
        if (wy > 172) break;
        for (let c = 0; c < b.windowCols; c++) {
          const wx = bx + 4 + c * 5;
          const lit = b.windowGrid[wIdx % b.windowGrid.length];
          wIdx++;
          if (lit) {
            ctx.fillStyle = ((r + c + i) % 3 === 0) ? p.getColor(8) : p.getColor(6);
            ctx.fillRect(wx, wy, 2, 3);
            ctx.fillStyle = p.getColor(2);
          }
        }
      }
    }

    // Rising atmospheric cyber dust motes
    ctx.fillStyle = p.getColor(7);
    ctx.globalAlpha = 0.55;
    for (const m of this.ambientMotes) {
      const my = 180 - ((m.y + this.time * 20) % 180);
      const mx = Math.round((m.x - camX * 0.15 + 320) % 320);
      ctx.fillRect(mx, Math.round(my), m.size, m.size);
    }
    ctx.globalAlpha = 1.0;
  }

  // -------------------------------------------------------------
  // BIOME 1: COSMIC NEBULAE & RINGED CELESTIAL PLANET
  // -------------------------------------------------------------
  renderCosmicNebula(ctx, p, camX, camY) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 320, 180);

    // Deep cosmic indigo band towards bottom
    ctx.fillStyle = p.getColor(0);
    ctx.fillRect(0, 95, 320, 85);

    // 2x2 Bayer dithering between deep void and cosmic indigo
    for (let y = 80; y < 95; y++) {
      for (let x = 0; x < 320; x += 2) {
        if ((x + y) % 4 === 0) {
          ctx.fillStyle = p.getColor(0);
          ctx.fillRect(x, y, 2, 1);
        }
      }
    }

    // Multi-Depth Twinkling Starfield
    for (const s of this.stars) {
      const bright = Math.sin(s.phase) > 0.05;
      const sx = Math.round((s.x - camX * 0.03 + 320) % 320);
      ctx.fillStyle = bright ? '#ffffff' : p.getColor(4);
      ctx.fillRect(sx, s.y, s.size, s.size);
      if (s.isCross && bright) {
        ctx.fillStyle = p.getColor(8);
        ctx.fillRect(sx - 1, s.y, 3, 1);
        ctx.fillRect(sx, s.y - 1, 1, 3);
      }
    }

    // Cosmic Drifting Comet with luminous ion tail
    const cx = Math.round(this.comet.x - camX * 0.02);
    const cy = Math.round(this.comet.y);
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx, cy, 3, 3);
    for (let t = 1; t <= 12; t++) {
      ctx.fillStyle = t < 5 ? p.getColor(6) : p.getColor(5);
      ctx.globalAlpha = Math.max(0, 1 - t / 12);
      ctx.fillRect(cx - t * 3, cy - t * 1, 2, 2);
    }
    ctx.restore();

    // Sweeping Ethereal Dithered Wispy Nebulae
    this.drawWispyNebulae(ctx, p, camX);

    // Giant Majestic Ringed Celestial Planet
    const planetX = 230 - Math.round(camX * 0.04);
    const planetY = 48;
    this.drawRingedPlanet(ctx, p, planetX, planetY, 17);

    // Companion Moon
    ctx.fillStyle = '#ffffff';
    this.drawPixelCircle(ctx, planetX - 42, planetY + 28, 4);
    ctx.fillStyle = p.getColor(1);
    ctx.fillRect(planetX - 44, planetY + 26, 3, 4);

    // Distant Asteroid / Mountain Ridge Silhouette on Horizon
    ctx.fillStyle = p.getColor(1);
    this.drawSteppedRidge(ctx, -Math.round(camX * 0.08), 138, [
      [0, 155], [45, 132], [90, 150], [145, 126], [200, 152], [260, 134], [320, 158], [380, 130]
    ]);

    // Swirling Iridescent Stardust Motes
    for (const m of this.ambientMotes) {
      const mx = Math.round((m.x - camX * 0.12 + 320) % 320);
      const my = Math.round(m.y);
      ctx.fillStyle = (m.size === 2) ? p.getColor(8) : p.getColor(7);
      ctx.fillRect(mx, my, m.size, m.size);
    }
  }

  // -------------------------------------------------------------
  // BIOME 2: HIGH ALPINE MOUNTAIN RIDGE & SNOW
  // -------------------------------------------------------------
  renderAlpineRidge(ctx, p, camX, camY) {
    ctx.fillStyle = p.getColor(0);
    ctx.fillRect(0, 0, 320, 180);

    // Distant mountain ridge (Color 1)
    const farOff = -Math.round(camX * 0.1);
    ctx.fillStyle = p.getColor(1);
    this.drawSteppedRidge(ctx, farOff, 110, [
      [0, 130], [50, 70], [105, 115], [165, 65], [225, 120], [285, 60], [360, 130]
    ]);

    // Mid snow-capped mountains (Color 2)
    const midOff = -Math.round(camX * 0.22);
    ctx.fillStyle = p.getColor(2);
    this.drawSteppedRidge(ctx, midOff, 135, [
      [0, 145], [60, 90], [125, 130], [195, 85], [265, 125], [335, 88], [410, 145]
    ]);

    // White snowcaps with pixel overhang
    ctx.fillStyle = '#ffffff';
    const peaks = [60, 195, 335];
    for (const pk of peaks) {
      const px = pk + midOff;
      ctx.fillRect(px - 10, 92, 20, 3);
      ctx.fillRect(px - 6, 88, 12, 4);
      ctx.fillRect(px - 2, 85, 4, 3);
    }

    // High Alpine Cable Car Tramline
    ctx.save();
    ctx.strokeStyle = p.getColor(3);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(30 + midOff, 96);
    ctx.lineTo(260 + midOff, 132);
    ctx.stroke();
    // Gondola car
    const gondolaProgress = (this.time * 0.08) % 1.0;
    const gx = Math.round(30 + midOff + gondolaProgress * 230);
    const gy = Math.round(96 + gondolaProgress * 36);
    ctx.fillStyle = p.getColor(7);
    ctx.fillRect(gx - 3, gy + 3, 6, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gx - 1, gy + 4, 2, 2);
    ctx.restore();

    // Pine Tree Silhouettes along the ridge
    ctx.fillStyle = p.getColor(1);
    const treeX = [40, 75, 110, 150, 180, 220, 250, 290];
    for (const tx of treeX) {
      const px = tx + midOff;
      const py = 142 + (tx % 15);
      this.drawPineTree(ctx, px, py, 10);
    }

    // Drifting alpine wind clouds
    ctx.fillStyle = p.getColor(3);
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 4; i++) {
      const cx = (this.cloudOffset * (1.1 + i * 0.25) + i * 95 - camX * 0.15) % 400 - 40;
      const cy = 25 + i * 20;
      ctx.fillRect(Math.round(cx), cy, 48, 5);
      ctx.fillRect(Math.round(cx + 6), cy - 2, 34, 3);
    }
    ctx.globalAlpha = 1.0;

    // Swaying mountain snowflakes
    ctx.fillStyle = '#ffffff';
    for (const m of this.ambientMotes) {
      const sx = Math.round((m.x + Math.sin(m.wobble) * 14 - camX * 0.25 + 320) % 320);
      const sy = Math.round(m.y);
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  // -------------------------------------------------------------
  // BIOME 3: THE CELESTIAL SUMMIT 3000M (Moon & Waving Auroras)
  // -------------------------------------------------------------
  renderSummitSky(ctx, p, camX, camY) {
    ctx.fillStyle = p.getColor(0);
    ctx.fillRect(0, 0, 320, 180);

    // Twinkling stars (drawn first so moon renders on top)
    for (const s of this.stars) {
      const bright = Math.sin(s.phase) > 0.1;
      ctx.fillStyle = bright ? '#ffffff' : p.getColor(8);
      ctx.fillRect((s.x - Math.round(camX * 0.05) + 320) % 320, s.y, s.size, s.size);
    }

    // Triple-Layer Waving Aurora Borealis Curtains (drawn before moon so moon renders on top)
    for (let layer = 0; layer < 3; layer++) {
      const col = layer === 0 ? p.getColor(5) : layer === 1 ? p.getColor(6) : p.getColor(7);
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.32 - layer * 0.08;
      const baseAy = 55 + layer * 16;

      for (let x = 0; x < 320; x += 4) {
        const wave = Math.sin(this.time * 1.6 + x * 0.02 + layer) * 9 + Math.cos(this.time * 2.2 + x * 0.04) * 5;
        ctx.fillRect(x, Math.round(baseAy + wave), 4, 16);
      }
    }
    ctx.globalAlpha = 1.0;

    // Radiant Giant Pixel Moon with aura ring (drawn AFTER aurora so it's always visible on top)
    const mx = 240 - Math.round(camX * 0.05);
    const my = 38 + Math.round(camY * 0.03); // slight camY parallax keeps moon anchored to sky

    // Soft outer glow halo
    ctx.fillStyle = p.getColor(2);
    ctx.globalAlpha = 0.55;
    this.drawPixelCircle(ctx, mx, my, 28);
    ctx.globalAlpha = 1.0;

    // Moon body
    ctx.fillStyle = '#ffffff';
    this.drawPixelCircle(ctx, mx, my, 22);

    // Moon craters (dark grey, not palette color which could be wrong tone)
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(mx - 8, my - 6, 5, 3);
    ctx.fillRect(mx + 5, my + 3, 4, 3);
    ctx.fillRect(mx - 3, my + 8, 3, 2);

    // High mountain silhouettes at base
    ctx.fillStyle = p.getColor(1);
    this.drawSteppedRidge(ctx, -Math.round(camX * 0.12), 130, [
      [0, 145], [75, 100], [155, 135], [230, 98], [305, 140], [385, 105]
    ]);

    // Summit Weather Station & Blinking Tower
    const stX = Math.round(230 - camX * 0.12);
    ctx.fillStyle = p.getColor(2);
    ctx.fillRect(stX - 4, 90, 8, 8);
    ctx.fillRect(stX - 1, 76, 2, 14);
    const strobe = Math.sin(this.time * 7) > 0.3;
    ctx.fillStyle = strobe ? '#ff2255' : '#440022';
    ctx.fillRect(stX - 2, 74, 4, 2);

    // Summit flurry motes
    for (const m of this.ambientMotes) {
      const sx = Math.round((m.x + Math.sin(m.wobble) * 8 - camX * 0.2 + 320) % 320);
      const sy = Math.round(m.y);
      ctx.fillStyle = (m.size === 2) ? '#ffffff' : p.getColor(8);
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  // -------------------------------------------------------------
  // BIOME 4: MIRROR TEMPLE / ANCIENT CRYPTS (Chapter 5)
  // -------------------------------------------------------------
  renderMirrorTemple(ctx, p, camX, camY) {
    // 0. Deep eerie indigo crypt void
    ctx.fillStyle = p.getColor(0);
    ctx.fillRect(0, 0, 320, 180);

    // 1. Far Parallax Background: Receding Gothic Vault Corridors & Stained Glass Backlight
    const farOff = -Math.round(camX * 0.06);
    ctx.fillStyle = p.getColor(1);
    for (let i = 0; i < 5; i++) {
      const ax = i * 72 - 15 + (farOff % 72);
      // Tall gothic crypt arch silhouette
      ctx.fillRect(ax, 20, 10, 160);
      ctx.fillRect(ax + 48, 20, 10, 160);
      // Pointed arch crest
      for (let dy = 0; dy < 25; dy++) {
        const span = Math.round((dy / 25) * 24);
        ctx.fillRect(ax + 29 - span, 20 - dy, 4, 2);
        ctx.fillRect(ax + 29 + span, 20 - dy, 4, 2);
      }
      // Distant lancet window deep glow
      ctx.fillStyle = p.getColor(2);
      ctx.fillRect(ax + 22, 28, 14, 48);
      ctx.fillStyle = p.getColor(5);
      ctx.globalAlpha = 0.35 + Math.sin(this.time * 2 + i) * 0.1;
      ctx.fillRect(ax + 25, 34, 8, 36);
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = p.getColor(1);
    }

    // 2. Midground: Massive Carved Obsidian Columns with Heavy Chains
    const midOff = -Math.round(camX * 0.12);
    ctx.fillStyle = p.getColor(2);
    for (let c = 0; c < 4; c++) {
      const colX = c * 95 + 10 + (midOff % 95);
      // Column shaft with fluted masonry
      ctx.fillRect(colX, 0, 20, 180);
      // Carved capital & plinth
      ctx.fillStyle = p.getColor(3);
      ctx.fillRect(colX - 4, 15, 28, 6);
      ctx.fillRect(colX - 2, 21, 24, 4);
      ctx.fillRect(colX - 4, 158, 28, 8);
      ctx.fillRect(colX - 2, 154, 24, 4);

      // Hanging ancient iron chain links swinging with parallax
      ctx.fillStyle = p.getColor(1);
      const chainSway = Math.sin(this.time * 1.5 + c) * 3;
      for (let y = 25; y < 90; y += 7) {
        ctx.fillRect(Math.round(colX + 10 + (y / 90) * chainSway), y, 3, 5);
      }
      // Heavy iron weight / talisman at bottom of chain
      ctx.fillStyle = p.getColor(4);
      ctx.fillRect(Math.round(colX + 9 + chainSway), 90, 5, 8);

      ctx.fillStyle = p.getColor(2);
    }

    // 3. Central Temple Wall: The Ancient Obsidian Mirror Portal
    const shrineX = 160 - Math.round(camX * 0.08);
    const shrineY = 32;
    ctx.save();
    // Heavy stepped stone portal frame
    ctx.fillStyle = p.getColor(2);
    ctx.fillRect(shrineX - 32, shrineY, 64, 110);
    ctx.fillStyle = p.getColor(1);
    ctx.fillRect(shrineX - 36, shrineY - 4, 72, 8); // Header lintel
    ctx.fillRect(shrineX - 38, shrineY + 104, 76, 12); // Base dais

    // Carved runic moldings on frame
    ctx.fillStyle = p.getColor(4);
    ctx.fillRect(shrineX - 26, shrineY + 8, 4, 94);
    ctx.fillRect(shrineX + 22, shrineY + 8, 4, 94);

    // Deep reflective obsidian mirror glass surface
    ctx.fillStyle = '#080312';
    ctx.fillRect(shrineX - 20, shrineY + 10, 40, 90);

    // Dynamic undulating reflective ripples inside mirror
    ctx.fillStyle = p.getColor(5);
    ctx.globalAlpha = 0.18 + Math.sin(this.time * 2.2) * 0.06;
    for (let my = shrineY + 14; my < shrineY + 95; my += 6) {
      const ripple = Math.sin(this.time * 2.5 + my * 0.2) * 4;
      ctx.fillRect(shrineX - 16 + Math.round(ripple), my, 32, 2);
    }

    // Authentic fine diagonal mirror fractures with silver glints
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(shrineX - 12, shrineY + 30, 24, 1);
    ctx.fillRect(shrineX + 2, shrineY + 22, 1, 28);
    ctx.fillRect(shrineX - 6, shrineY + 48, 16, 1);
    ctx.fillRect(shrineX + 5, shrineY + 45, 2, 2); // Specular glass glint

    // Floating detached mirror shards drifting around the shrine
    for (let s = 0; s < 4; s++) {
      const sAngle = this.time * 0.8 + s * (Math.PI / 2);
      const sx = shrineX + Math.cos(sAngle) * 36;
      const sy = shrineY + 50 + Math.sin(sAngle) * 26;
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = p.getColor(5);
      ctx.fillRect(Math.round(sx), Math.round(sy), 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(sx + 1), Math.round(sy + 1), 2, 2);
    }
    ctx.restore();

    // 4. Floating Ancient Carved Rune Bricks
    const runeBlocks = [
      [45, 80], [105, 120], [225, 115], [285, 75]
    ];
    for (const [bx, by] of runeBlocks) {
      const rx = bx + (midOff % 320);
      const bob = Math.sin(this.time * 2 + bx) * 2;
      ctx.fillStyle = p.getColor(2);
      ctx.fillRect(rx, Math.round(by + bob), 18, 10);
      ctx.fillStyle = p.getColor(6);
      ctx.globalAlpha = 0.65 + Math.sin(this.time * 3 + bx) * 0.25;
      // Glowing ancient glyph
      ctx.fillRect(rx + 5, Math.round(by + bob + 3), 8, 1);
      ctx.fillRect(rx + 8, Math.round(by + bob + 2), 2, 6);
      ctx.globalAlpha = 1.0;
    }

    // 5. Creeping Shadow Tendrils & Fog at Floor
    ctx.save();
    ctx.fillStyle = p.getColor(1);
    ctx.globalAlpha = 0.45;
    for (let y = 155; y < 180; y += 6) {
      ctx.fillRect(0, y, 320, 4);
    }
    ctx.restore();

    // 6. Ambient Shadow Motes & Dust
    ctx.fillStyle = p.getColor(6);
    for (const m of this.ambientMotes) {
      const mx = Math.round((m.x + Math.sin(m.wobble) * 10 - camX * 0.14 + 320) % 320);
      const my = 180 - ((m.y + this.time * 16) % 180);
      ctx.globalAlpha = 0.45;
      ctx.fillRect(mx, Math.round(my), m.size, m.size);
    }
    ctx.globalAlpha = 1.0;
  }

  // -------------------------------------------------------------
  // BIOME 5: THE CHASM ABYSS / CAVERN DEPTHS (Chapter 6)
  // Deep Subterranean Rift: Colossal Abyssal Chasm, Vertical Cliffs,
  // Bottomless Ethereal Void Fog, Massive Hanging Stalactites & Ancient Chains
  // -------------------------------------------------------------
  renderChasmAbyss(ctx, p, camX, camY) {
    // 0. Bottomless pitch-black abyss void
    ctx.fillStyle = p.getColor(0);
    ctx.fillRect(0, 0, 320, 180);

    // 1. Far Deep Abyssal Rift Backdrop with Vertical Chasm Strata
    const riftOff = -Math.round(camX * 0.05);
    ctx.fillStyle = p.getColor(1);
    // Left & right sheer abyssal trench cliff walls descending into nothingness
    for (let y = 0; y < 180; y += 4) {
      const leftW = Math.round(55 + Math.sin(y * 0.04 + riftOff * 0.03) * 16 + Math.cos(y * 0.12) * 6);
      const rightW = Math.round(55 + Math.cos(y * 0.05 + riftOff * 0.03) * 16 + Math.sin(y * 0.1) * 6);
      ctx.fillRect(0, y, leftW, 4);
      ctx.fillRect(320 - rightW, y, rightW, 4);
    }

    // 2. Midground Colossal Basalt Pillars & Ancient Hanging Abyssal Chains
    const midOff = -Math.round(camX * 0.10);
    // Suspended heavy iron chain links spanning the dark void
    ctx.save();
    ctx.fillStyle = p.getColor(2);
    const chains = [
      { x1: 0, y1: 35, x2: 320, y2: 65, sag: 28 },
      { x1: 0, y1: 110, x2: 320, y2: 95, sag: 22 }
    ];
    for (const ch of chains) {
      const steps = 32;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const cx = Math.round(ch.x1 + (ch.x2 - ch.x1) * t);
        const cy = Math.round(ch.y1 + (ch.y2 - ch.y1) * t + Math.sin(t * Math.PI) * ch.sag);
        // Alternate links
        if (i % 2 === 0) {
          ctx.fillRect(cx - 2, cy - 2, 5, 4);
        } else {
          ctx.fillRect(cx - 1, cy - 3, 3, 6);
        }
      }
    }
    ctx.restore();

    // Distant monolithic rock pillars standing in the chasm depths
    const pillars = [
      [90 + midOff, 40, 22],
      [215 + midOff, 25, 26]
    ];
    for (const [px, py, pw] of pillars) {
      ctx.fillStyle = p.getColor(1);
      ctx.fillRect(px, py, pw, 180 - py);
      ctx.fillStyle = p.getColor(2);
      ctx.fillRect(px + 2, py, pw - 4, 180 - py);
      // Weathered horizontal masonry strata
      ctx.fillStyle = p.getColor(0);
      for (let y = py + 8; y < 180; y += 14) {
        ctx.fillRect(px, y, pw, 2);
      }
    }

    // 3. Massive Hanging Colossal Stalactites Dripping Cave Moisture
    const stalOff = -Math.round(camX * 0.16);
    ctx.fillStyle = p.getColor(2);
    const jaggedStalactites = [
      [24, 75, 14], [52, 45, 10], [105, 95, 18], [150, 55, 12],
      [185, 80, 16], [235, 105, 20], [275, 60, 12], [305, 85, 16]
    ];
    for (const [sx, sh, sw] of jaggedStalactites) {
      const rx = sx + stalOff;
      for (let y = 0; y < sh; y++) {
        const span = Math.round(((sh - y) / sh) * (sw / 2));
        ctx.fillStyle = p.getColor(2);
        ctx.fillRect(rx - span, y, span * 2 + 1, 1);
        if (span > 2) {
          ctx.fillStyle = p.getColor(3);
          ctx.fillRect(rx - span + 1, y, Math.max(1, span - 2), 1);
        }
      }
      // Water droplet at the sharp apex of stalactite
      const dropTimer = (this.time * 2.2 + sx) % 3.0;
      if (dropTimer < 0.6) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx, sh + Math.round(dropTimer * 12), 1, 2);
      }
    }

    // 4. Bioluminescent Deep Chasm Crystal Clusters on Cliff Edges
    const crystalFormations = [
      [42 + midOff, 85, 14],
      [145 + midOff, 125, 16],
      [268 + midOff, 70, 15]
    ];
    for (const [cx, cy, radius] of crystalFormations) {
      const pulse = Math.sin(this.time * 2.5 + cx) * 0.12;

      // Soft diffuse eerie blue-green crystal glow
      ctx.save();
      ctx.fillStyle = p.getColor(5);
      ctx.globalAlpha = 0.22 + pulse;
      this.drawPixelCircle(ctx, cx, cy, radius);
      ctx.restore();

      // Sharp multifaceted spire needles
      ctx.fillStyle = p.getColor(4);
      ctx.fillRect(cx - 3, cy - 8, 4, 14);
      ctx.fillRect(cx - 7, cy - 3, 4, 9);
      ctx.fillRect(cx + 2, cy - 5, 4, 11);

      // Bright specular energy spines
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, cy - 7, 2, 10);
      ctx.fillRect(cx + 3, cy - 4, 1, 8);
    }

    // 5. Ominous Multi-Layered Bottomless Abyss Void Fog
    // The deeper you look, the thicker the spectral chasm fog rises
    ctx.save();
    const fogLayers = [
      { y: 125, h: 55, alpha: 0.18, speed: 0.5, col: p.getColor(2) },
      { y: 142, h: 38, alpha: 0.28, speed: 0.8, col: p.getColor(3) },
      { y: 158, h: 22, alpha: 0.42, speed: 1.2, col: p.getColor(4) }
    ];
    for (const fl of fogLayers) {
      ctx.fillStyle = fl.col;
      ctx.globalAlpha = fl.alpha;
      const wave = Math.sin(this.time * fl.speed) * 16 - (camX * 0.08);
      ctx.fillRect(-20, fl.y + Math.round(Math.sin(this.time * fl.speed * 1.5) * 3), 360, fl.h);
      // Floating fog puffs
      for (let x = 0; x < 320; x += 36) {
        const puffY = fl.y - 4 + Math.round(Math.sin(x * 0.1 + this.time * fl.speed) * 4);
        ctx.fillRect(x + Math.round(wave % 36), puffY, 28, 6);
      }
    }
    ctx.restore();

    // 6. Upward Drifting Ethereal Chasm Spores & Moisture Motes
    ctx.fillStyle = p.getColor(6);
    for (const m of this.ambientMotes) {
      const my = 180 - ((m.y + this.time * 22) % 180);
      const mx = Math.round((m.x + Math.sin(m.wobble) * 10 - camX * 0.12 + 320) % 320);
      ctx.globalAlpha = 0.5;
      ctx.fillRect(mx, Math.round(my), m.size, m.size);
      if (m.size > 1 && my > 130) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mx, Math.round(my), 1, 1);
        ctx.fillStyle = p.getColor(6);
      }
    }
    ctx.globalAlpha = 1.0;
  }

  // -------------------------------------------------------------
  // BIOME 6: THE MOLTEN CORE / FOUNDRY (Chapter 7)
  // Real Animated Fluid Magma Simulation (No Flat Moving Overlay!)
  // -------------------------------------------------------------
  // BIOME 6: THE MOLTEN CORE / VOLCANIC CALDERA (Chapter 7)
  // Deep Subterranean Magma Chamber: Volcanic Caverns, Cascading Lavafalls,
  // Glowing Basalt Spires, Smoldering Cracks, Living Magma Physics & Atmospheric Embers
  // -------------------------------------------------------------
  renderMoltenCore(ctx, p, camX, camY) {
    const t = this.time;

    // 0. Deep volcanic obsidian rock void
    ctx.fillStyle = p.getColor(0);
    ctx.fillRect(0, 0, 320, 180);

    // 1. Distant Smoldering Cavern Ceiling & Volcanic Strata
    ctx.save();
    const strataOff = -Math.round(camX * 0.04);
    // Upper cavern roof silhouette with natural volcanic rock ridges
    ctx.fillStyle = p.getColor(1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= 320; x += 10) {
      const roofH = 22 + Math.sin(x * 0.04 + strataOff * 0.02) * 8 + Math.cos(x * 0.09) * 5;
      ctx.lineTo(x, roofH);
    }
    ctx.lineTo(320, 0);
    ctx.closePath();
    ctx.fill();

    // Distant volcanic heat glow gradient bands across the cavern backwall
    ctx.fillStyle = p.getColor(1);
    ctx.globalAlpha = 0.65;
    ctx.fillRect(0, 48, 320, 132);
    ctx.fillStyle = p.getColor(2);
    ctx.globalAlpha = 0.50;
    ctx.fillRect(0, 85, 320, 95);
    ctx.restore();

    // 2. Colossal Background Basalt Columns / Volcanic Pillars
    const colOff = -Math.round(camX * 0.07);
    const pillars = [
      { x: 38 + colOff, w: 22, topY: 18, botY: 140 },
      { x: 145 + colOff, w: 18, topY: 26, botY: 140 },
      { x: 260 + colOff, w: 26, topY: 14, botY: 140 }
    ];
    for (const pil of pillars) {
      const px = pil.x;
      const pw = pil.w;
      // Dark basalt column body
      ctx.fillStyle = p.getColor(1);
      ctx.fillRect(px, pil.topY, pw, pil.botY - pil.topY);
      ctx.fillStyle = p.getColor(2);
      ctx.fillRect(px + 2, pil.topY, pw - 4, pil.botY - pil.topY);

      // Searing glowing magma fissures / fissures running vertically down the rock
      ctx.fillStyle = p.getColor(6);
      for (let y = pil.topY + 10; y < pil.botY - 10; y += 7) {
        const crackX = px + Math.round(pw / 2 + Math.sin(y * 0.35 + px) * (pw / 3 - 2));
        const pulse = Math.sin(t * 3.5 + y * 0.2 + px) > 0.1;
        ctx.fillStyle = pulse ? p.getColor(7) : p.getColor(5);
        ctx.fillRect(crackX, y, 2, 4);
      }
    }

    // 3. GORGEOUS ORGANIC CASCADING LAVAFALLS
    // Streaming down from hanging cavern ledges with flowing magma textures,
    // glowing borders, hot white core cascades, and splash mist at the impact pool
    const fallOff = -Math.round(camX * 0.10);
    const lavaFalls = [
      { x: 78 + fallOff, w: 11, topY: 28, botY: 145, speed: 65 },
      { x: 218 + fallOff, w: 14, topY: 22, botY: 145, speed: 75 }
    ];

    for (const lf of lavaFalls) {
      const fx = lf.x;
      const fw = lf.w;
      const topY = lf.topY;
      const botY = lf.botY;

      // Hanging rock source shelf above the falls
      ctx.fillStyle = p.getColor(2);
      ctx.fillRect(fx - 5, topY - 5, fw + 10, 6);
      ctx.fillStyle = p.getColor(3);
      ctx.fillRect(fx - 4, topY - 1, fw + 8, 2);

      // Background heat aura glow behind each lavafall
      ctx.save();
      ctx.fillStyle = p.getColor(5);
      ctx.globalAlpha = 0.28 + Math.sin(t * 4 + fx) * 0.08;
      ctx.fillRect(fx - 4, topY, fw + 8, botY - topY);
      ctx.restore();

      // Outer flowing lava rim (deep orange/crimson fluid)
      ctx.fillStyle = p.getColor(6);
      for (let y = topY; y < botY; y += 3) {
        const sway = Math.sin(y * 0.12 + t * 4) * 1.0;
        ctx.fillRect(Math.round(fx + sway), y, fw, 3);
      }

      // Middle bright golden magma stream with natural undulating contours
      ctx.fillStyle = p.getColor(7);
      for (let y = topY; y < botY; y += 2) {
        const sway = Math.sin(y * 0.12 + t * 4) * 1.0;
        const curW = fw - 4;
        ctx.fillRect(Math.round(fx + 2 + sway), y, curW, 2);
      }

      // Incandescent white-hot center core ribbons rushing downward
      ctx.fillStyle = '#ffffff';
      const flowStep = 7;
      const flowOffset = Math.round(t * lf.speed) % flowStep;
      for (let y = topY + flowOffset; y < botY; y += flowStep) {
        const sway = Math.sin(y * 0.12 + t * 4) * 1.0;
        ctx.fillRect(Math.round(fx + Math.floor(fw / 2) - 1 + sway), y, 2, 4);
      }

      // Fiery splash foam & impact mist at the base of the lavafall
      ctx.save();
      const splashPulse = Math.sin(t * 6 + fx) * 1.5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx - 2, botY - 3, fw + 4, 2);
      ctx.fillStyle = p.getColor(7);
      ctx.fillRect(fx - 4, botY - 2, fw + 8, 3);
      // Small arcing splash beads from impact
      for (let s = 0; s < 4; s++) {
        const spAngle = (s / 4) * Math.PI - Math.PI / 2;
        const spDist = 5 + splashPulse;
        const sx = Math.round(fx + fw / 2 + Math.cos(spAngle) * spDist);
        const sy = Math.round(botY - 2 + Math.sin(spAngle) * spDist * 0.5);
        ctx.fillStyle = s % 2 === 0 ? '#ffffff' : p.getColor(7);
        ctx.fillRect(sx, sy, 1, 1);
      }
      ctx.restore();
    }

    // 4. Midground Volcanic Girders & Smoldering Catwalk Archway
    const catOff = -Math.round(camX * 0.14);
    ctx.fillStyle = p.getColor(1);
    ctx.fillRect(0, 118, 320, 3);
    // Industrial truss supports
    for (let x = (catOff % 36 + 36) % 36; x < 320; x += 36) {
      ctx.fillRect(x, 121, 3, 20);
      ctx.fillRect(x + 3, 123, 12, 1);
      ctx.fillRect(x + 3, 131, 12, 1);
      // Cross brace
      ctx.fillRect(x + 7, 121, 1, 8);
    }

    // 5. VOLUMETRIC LIVING MOLTEN MAGMA RIVER LAKE
    // Completely fills the lower third of the chamber (Y: 124 -> 180)
    // Dynamic fluid surface, bubbling convective cells, glowing crust rafts, and violent magma pops
    const baseLavaY = 126;
    const wavePoints = new Array(320);
    const springs = this.lavaSprings;
    const colCount = this.lavaSpringCols;

    // First calculate continuous fluid surface heights across the 320px width
    for (let x = 0; x < 320; x++) {
      const colFloat = (x / 320) * (colCount - 1);
      const c0 = Math.floor(colFloat);
      const c1 = Math.min(colCount - 1, c0 + 1);
      const frac = colFloat - c0;
      const springDisp = springs[c0].y * (1 - frac) + springs[c1].y * frac;

      // Compound organic boiling swell
      const swell1 = Math.sin(t * 2.2 + x * 0.038) * 2.4;
      const swell2 = Math.cos(t * 3.4 + x * 0.082) * 1.5;
      const swell3 = Math.sin(t * 5.0 + x * 0.16) * 0.8;
      const surfaceY = Math.round(baseLavaY + springDisp + swell1 + swell2 + swell3);
      wavePoints[x] = surfaceY;
    }

    // A. Deep Solid Magma Base Fill (Fills entire bottom from lowest surface down to canvas edge)
    // Searing hot dense molten fluid body
    ctx.fillStyle = p.getColor(3); // Deep volcanic obsidian red/brown
    for (let x = 0; x < 320; x++) {
      const sy = wavePoints[x];
      ctx.fillRect(x, sy + 18, 1, 180 - (sy + 18));
    }

    // B. Convective Magma Current Strata (Middle viscous churning layers)
    for (let x = 0; x < 320; x++) {
      const sy = wavePoints[x];

      // Layer 1: Searing Molten Core Flow (Deep rich lava red)
      ctx.fillStyle = p.getColor(5);
      ctx.fillRect(x, sy + 7, 1, 12);

      // Layer 2: Swirling Convective Current Tendrils
      const currentCell = Math.sin(x * 0.12 - t * 2.6) + Math.cos(sy * 0.2 + t * 3.0);
      if (currentCell > 0.4) {
        ctx.fillStyle = p.getColor(6);
        ctx.fillRect(x, sy + 9, 1, 6);
      }
      if (currentCell > 1.1) {
        ctx.fillStyle = p.getColor(7);
        ctx.fillRect(x, sy + 11, 1, 3);
      }
    }

    // C. Upper Fluid Surface Horizon (Bright incandescent heat gradient)
    for (let x = 0; x < 320; x++) {
      const sy = wavePoints[x];

      // Glowing molten orange transition (3px)
      ctx.fillStyle = p.getColor(6);
      ctx.fillRect(x, sy + 4, 1, 3);

      // Golden boiling froth layer (2px)
      ctx.fillStyle = p.getColor(7);
      ctx.fillRect(x, sy + 2, 1, 2);

      // White-hot incandescent bubbling crest (2px)
      const crestSparkle = Math.sin(x * 0.4 + t * 7) > 0.4;
      ctx.fillStyle = crestSparkle ? '#ffffff' : p.getColor(8);
      ctx.fillRect(x, sy, 1, 2);
    }

    // 6. Deep Submerged & Rising Churning Magma Bubbles
    for (const lb of this.lavaBubbles) {
      const bx = Math.round((lb.x - camX * 0.08 + 320) % 320);
      const by = Math.round(lb.y);
      const waveAtX = wavePoints[bx] || 126;

      // If bubble is beneath the surface, draw rich glowing bubble orb with specular highlight
      if (by >= waveAtX + 3 && by < 178) {
        // Outer hot golden rim
        ctx.fillStyle = p.getColor(7);
        this.drawPixelCircle(ctx, bx, by, Math.round(lb.r));
        // Inner white-hot glowing gas core
        if (lb.r >= 2) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx - 1, by - 1, 2, 2);
        }
      } else if (by >= waveAtX - 2 && by < waveAtX + 3) {
        // Bubble popping at surface: expands into a bursting magma dome!
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, waveAtX, lb.r + 1.5, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = p.getColor(7);
        ctx.fillRect(bx - Math.round(lb.r), waveAtX - 1, Math.round(lb.r * 2), 1);
        ctx.restore();
      }
    }

    // 7. Floating Semi-Cooled Basalt Crust Islands & Dark Pumice Rafts
    // Rocking realistically on the undulating molten fluid surface
    for (let r = 0; r < 6; r++) {
      const raftBaseX = ((t * 8 + r * 58) % 360) - 20;
      const rx = Math.round(raftBaseX);
      if (rx >= 4 && rx < 300) {
        const ry = wavePoints[rx];
        const rw = 16 + (r % 3) * 7;
        const slope = (wavePoints[Math.min(319, rx + rw)] - ry);
        const tilt = Math.round(slope * 0.35);

        // Dark volcanic basalt crust
        ctx.fillStyle = '#1c0307';
        ctx.fillRect(rx, ry + tilt + 1, rw, 4);
        ctx.fillStyle = p.getColor(1);
        ctx.fillRect(rx + 1, ry + tilt + 1, rw - 2, 1);

        // Glowing red/orange fissure seam cracks across the raft
        ctx.fillStyle = p.getColor(6);
        ctx.fillRect(rx + 3, ry + tilt + 2, 3, 1);
        ctx.fillRect(rx + rw - 6, ry + tilt + 2, 4, 1);
        // Searing underglow rim
        ctx.fillStyle = p.getColor(5);
        ctx.fillRect(rx + 2, ry + tilt + 4, rw - 4, 1);
      }
    }

    // 8. Active Erupting Molten Magma Droplets & Searing Spatter
    for (const drop of this.lavaDroplets) {
      const dx = Math.round(drop.x);
      const dy = Math.round(drop.y);
      if (dx >= 0 && dx < 320 && dy >= 0 && dy < 180) {
        // Bright hot drop core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dx, dy, drop.size, drop.size);
        // Glowing ember spark tail
        ctx.fillStyle = p.getColor(7);
        ctx.fillRect(Math.round(dx - drop.vx * 0.04), Math.round(dy - drop.vy * 0.04), 1, 1);
        ctx.fillStyle = p.getColor(5);
        ctx.fillRect(Math.round(dx - drop.vx * 0.08), Math.round(dy - drop.vy * 0.08), 1, 1);
      }
    }

    // 9. Convective Heat Shimmer Glow & Atmospheric Volcanic Cinders
    ctx.save();
    // Warm atmospheric thermal glow blooming above the lava lake surface
    ctx.fillStyle = p.getColor(5);
    ctx.globalAlpha = 0.22 + Math.sin(t * 3.2) * 0.06;
    ctx.fillRect(0, baseLavaY - 22, 320, 24);
    ctx.fillStyle = p.getColor(6);
    ctx.globalAlpha = 0.12 + Math.sin(t * 4.5) * 0.04;
    ctx.fillRect(0, baseLavaY - 38, 320, 18);
    ctx.restore();

    // Rising burning ash sparks & embers billowing upward from the lava river
    ctx.fillStyle = p.getColor(8);
    for (const m of this.ambientMotes) {
      const cy = 180 - ((m.y + t * 40) % 180);
      const cx = Math.round((m.x + Math.sin(m.wobble * 2.2 + t * 1.5) * 14 - camX * 0.16 + 320) % 320);
      ctx.fillRect(cx, Math.round(cy), m.size, m.size);
    }
  }

  // -------------------------------------------------------------
  // BIOME 7: CELESTIAL APEX 4000M / STRATOSPHERE (Chapter 8)
  // The Sun on the Curved Earth Horizon with Crepuscular Sunbeams!
  // -------------------------------------------------------------
  renderCelestialApex(ctx, p, camX, camY) {
    // 0. Deep cosmic twilight sky
    ctx.fillStyle = p.getColor(0);
    ctx.fillRect(0, 0, 320, 180);

    // Glowing stratospheric dawn twilight band
    ctx.fillStyle = p.getColor(1);
    ctx.fillRect(0, 85, 320, 95);
    ctx.fillStyle = p.getColor(2);
    ctx.fillRect(0, 120, 320, 60);

    // 1. Shimmering Multicolored Aurora Borealis Ribbons across upper sky
    ctx.save();
    for (let l = 0; l < 3; l++) {
      const aColor = l === 0 ? p.getColor(5) : (l === 1 ? p.getColor(6) : p.getColor(7));
      ctx.fillStyle = aColor;
      ctx.globalAlpha = 0.22 + Math.sin(this.time * 1.5 + l) * 0.08;
      ctx.beginPath();
      ctx.moveTo(0, 16 + l * 12);
      for (let x = 0; x <= 320; x += 16) {
        const fold = Math.sin(this.time * 1.8 + x * 0.02 + l * 2) * 16 +
                     Math.cos(this.time * 2.5 + x * 0.05) * 8;
        ctx.lineTo(x, 24 + l * 12 + fold);
      }
      ctx.lineTo(320, 60 + l * 15);
      ctx.lineTo(0, 60 + l * 15);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 2. Sparkling Cosmos & Shooting Stars
    for (const s of this.stars) {
      const bright = Math.sin(s.phase) > 0.05;
      const sx = Math.round((s.x - camX * 0.02 + 320) % 320);
      ctx.fillStyle = bright ? '#ffffff' : p.getColor(5);
      ctx.fillRect(sx, s.y, s.size, s.size);
      if (s.isCross && bright) {
        ctx.fillStyle = p.getColor(7);
        ctx.fillRect(sx - 1, s.y, 3, 1);
        ctx.fillRect(sx, s.y - 1, 1, 3);
      }
    }

    // 3. THE SUN ON THE PLANETARY HORIZON CURVATURE
    // The Earth's majestic convex curvature viewed from the 4000M summit:
    // Only the top arc of the sun peeks out; the center and bottom are blocked by the Earth's curve!
    const sunX = 160 - Math.round(camX * 0.03);
    const sunRadius = 26;
    const sunCenterY = 138; // Placed low so center is below horizon

    // A. Radiant Crepuscular Sunbeams (God Rays) fanning out from behind the curve
    ctx.save();
    const beamCount = 11;
    for (let b = 0; b < beamCount; b++) {
      const angle = -Math.PI * 0.88 + (b / (beamCount - 1)) * Math.PI * 0.76;
      const beamWobble = Math.sin(this.time * 1.2 + b * 0.8) * 0.03;
      const rayAngle = angle + beamWobble;
      const len = 175;

      ctx.fillStyle = (b % 2 === 0) ? '#fff8db' : p.getColor(6);
      ctx.globalAlpha = 0.14 + Math.sin(this.time * 2 + b) * 0.04;
      ctx.beginPath();
      ctx.moveTo(sunX, sunCenterY - 12);
      ctx.lineTo(sunX + Math.cos(rayAngle - 0.06) * len, sunCenterY - 12 + Math.sin(rayAngle - 0.06) * len);
      ctx.lineTo(sunX + Math.cos(rayAngle + 0.06) * len, sunCenterY - 12 + Math.sin(rayAngle + 0.06) * len);
      ctx.closePath();
      ctx.fill();
    }

    // B. Brilliant Solar Corona Glow
    ctx.fillStyle = '#ffeedd';
    ctx.globalAlpha = 0.28 + Math.sin(this.time * 2.5) * 0.05;
    this.drawPixelCircle(ctx, sunX, sunCenterY, sunRadius + 14);
    ctx.fillStyle = '#ffd166';
    ctx.globalAlpha = 0.45;
    this.drawPixelCircle(ctx, sunX, sunCenterY, sunRadius + 6);

    // C. The Incandescent White Sun Disc itself
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#ffffff';
    this.drawPixelCircle(ctx, sunX, sunCenterY, sunRadius);
    ctx.restore();

    // D. The Earth's Silhouette Curvature:
    // This majestic convex curve covers the center and bottom of the sun completely!
    ctx.save();
    for (let x = 0; x < 320; x++) {
      const distFromCenter = (x - 160) / 160;
      // Convex curvature of the globe (peaks at center y=124, drops to 146 at edges)
      const curveY = Math.round(124 + distFromCenter * distFromCenter * 22);

      // Glowing atmospheric horizon rim
      ctx.fillStyle = p.getColor(5);
      ctx.fillRect(x, curveY - 2, 1, 2);

      // Deep dark Earth silhouette mass below curve, occluding the sun's center/bottom!
      ctx.fillStyle = p.getColor(1);
      ctx.fillRect(x, curveY, 1, 180 - curveY);
    }
    ctx.restore();

    // 4. Majestic 3-Layered Alpine Summit Ridges (In front of the planetary dawn)
    // Ridge Layer 1: Far background sharp jagged peaks
    const r1Off = -Math.round(camX * 0.07);
    ctx.fillStyle = p.getColor(2);
    this.drawSteppedRidge(ctx, r1Off % 160, 110, [
      [0, 142], [25, 115], [50, 138], [85, 102], [120, 134], [160, 142]
    ]);
    this.drawSteppedRidge(ctx, (r1Off % 160) + 160, 110, [
      [0, 142], [25, 115], [50, 138], [85, 102], [120, 134], [160, 142]
    ]);

    // Ridge Layer 2: Midground towering snow-capped summits
    const r2Off = -Math.round(camX * 0.14);
    ctx.fillStyle = p.getColor(3);
    this.drawSteppedRidge(ctx, r2Off % 180, 122, [
      [0, 155], [35, 118], [75, 150], [110, 108], [145, 145], [180, 155]
    ]);
    this.drawSteppedRidge(ctx, (r2Off % 180) + 180, 122, [
      [0, 155], [35, 118], [75, 150], [110, 108], [145, 145], [180, 155]
    ]);
    // Pure white snow caps on peaks
    ctx.fillStyle = '#ffffff';
    for (let pk of [35, 110, 215, 290]) {
      const px = pk + (r2Off % 180);
      ctx.fillRect(px - 6, 112, 12, 4);
      ctx.fillRect(px - 2, 108, 4, 4);
    }

    // 5. Drifting High-Altitude Sea-of-Clouds beneath the peaks
    ctx.save();
    ctx.fillStyle = p.getColor(4);
    ctx.globalAlpha = 0.45;
    for (let c = 0; c < 5; c++) {
      const cx = (c * 75 + this.time * 6 - camX * 0.1) % 360 - 20;
      this.drawPixelCircle(ctx, Math.round(cx), 146, 18);
      this.drawPixelCircle(ctx, Math.round(cx + 14), 143, 14);
      this.drawPixelCircle(ctx, Math.round(cx - 12), 147, 12);
    }
    ctx.restore();

    // 6. Blowing Summit Snow Flurry Crystals in the High Winds
    ctx.fillStyle = '#ffffff';
    for (const m of this.ambientMotes) {
      const sx = Math.round((m.x + Math.sin(m.wobble) * 14 - camX * 0.22 + 320) % 320);
      const sy = Math.round((m.y + this.time * 25) % 180);
      ctx.fillRect(sx, sy, m.size, m.size);
    }
  }

  // -------------------------------------------------------------
  // HELPER DRAWING UTILITIES
  // -------------------------------------------------------------
  drawSteppedRidge(ctx, offsetX, baseY, points) {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const x1 = p1[0] + offsetX;
      const y1 = p1[1];
      const x2 = p2[0] + offsetX;
      const y2 = p2[1];

      const steps = Math.abs(x2 - x1);
      for (let s = 0; s < steps; s++) {
        const curX = Math.round(x1 + (x2 - x1) * (s / steps));
        const curY = Math.round(y1 + (y2 - y1) * (s / steps));
        if (curX >= -2 && curX <= 322) {
          ctx.fillRect(curX, curY, 2, 180 - curY);
        }
      }
    }
  }

  drawPineTree(ctx, x, y, h) {
    for (let i = 0; i < h; i++) {
      const w = Math.round((i / h) * 7);
      ctx.fillRect(x - w, y + i, w * 2 + 1, 1);
    }
    // Trunk
    ctx.fillRect(x, y + h, 1, 3);
  }

  drawPointedArch(ctx, x, y, w, h, thickness) {
    ctx.fillRect(x, y + h * 0.4, thickness, h * 0.6);
    ctx.fillRect(x + w - thickness, y + h * 0.4, thickness, h * 0.6);
    // Pointed top arc
    for (let dy = 0; dy < h * 0.4; dy++) {
      const span = (dy / (h * 0.4)) * (w / 2);
      ctx.fillRect(Math.round(x + w / 2 - span), Math.round(y + dy), thickness, 1);
      ctx.fillRect(Math.round(x + w / 2 + span - thickness), Math.round(y + dy), thickness, 1);
    }
  }

  drawStalactites(ctx, offsetX, baseY, points, isCeiling) {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const x1 = p1[0] + offsetX;
      const y1 = p1[1];
      const x2 = p2[0] + offsetX;
      const y2 = p2[1];

      const steps = Math.abs(x2 - x1);
      for (let s = 0; s < steps; s++) {
        const curX = Math.round(x1 + (x2 - x1) * (s / steps));
        const curY = Math.round(y1 + (y2 - y1) * (s / steps));
        if (curX >= -2 && curX <= 322) {
          if (isCeiling) {
            ctx.fillRect(curX, 0, 2, curY);
          } else {
            ctx.fillRect(curX, curY, 2, 180 - curY);
          }
        }
      }
    }
  }

  drawPixelCircle(ctx, cx, cy, r) {
    for (let y = -r; y <= r; y++) {
      const hw = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
      ctx.fillRect(cx - hw, cy + y, hw * 2, 1);
    }
  }

  drawWispyNebulae(ctx, p, camX) {
    const t = this.time * 0.2;
    for (let x = 0; x < 320; x += 2) {
      const worldX = x + camX * 0.04;
      const wave1 = Math.sin(worldX * 0.015 + t) * 22;
      const wave2 = Math.cos(worldX * 0.035 - t * 0.7) * 12;
      const wave3 = Math.sin(worldX * 0.008 + 1.2) * 18;
      const centerY = 65 + wave1 + wave2 + wave3;
      const thickness = 20 + Math.sin(worldX * 0.02) * 10;

      for (let dy = -thickness; dy <= thickness; dy += 2) {
        const y = Math.round(centerY + dy);
        if (y < 0 || y >= 180) continue;
        const normDist = Math.abs(dy) / thickness;

        if (normDist < 0.3) {
          if ((x + y) % 4 === 0) {
            ctx.fillStyle = p.getColor(6);
            ctx.fillRect(x, y, 2, 2);
          } else if ((x + y) % 2 === 0) {
            ctx.fillStyle = p.getColor(4);
            ctx.fillRect(x, y, 2, 2);
          }
        } else if (normDist < 0.7) {
          if ((x % 4 === 0 && y % 4 === 0) || (x % 4 === 2 && y % 4 === 2)) {
            ctx.fillStyle = p.getColor(2);
            ctx.fillRect(x, y, 2, 2);
          }
        } else {
          if (x % 4 === 0 && y % 4 === 0) {
            ctx.fillStyle = p.getColor(1);
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
    }
  }

  drawRingedPlanet(ctx, p, cx, cy, r) {
    this.drawPlanetaryRing(ctx, p, cx, cy, r, false);

    for (let dy = -r; dy <= r; dy++) {
      const hw = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
      if (hw <= 0) continue;
      const y = cy + dy;

      const band = Math.abs(dy) % 6;
      let bandColor = p.getColor(2);
      if (band === 0 || band === 1) bandColor = p.getColor(3);
      else if (band === 2 || band === 3) bandColor = p.getColor(4);
      else bandColor = p.getColor(5);

      for (let dx = -hw; dx <= hw; dx++) {
        const x = cx + dx;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        if (distFromCenter > r) continue;

        const sunDot = (-dx * 0.7 - dy * 0.3) / r;

        if (sunDot > 0.58) {
          ctx.fillStyle = '#ffffff';
        } else if (sunDot > 0.12) {
          ctx.fillStyle = bandColor;
        } else if (sunDot > -0.18) {
          if ((x + y) % 2 === 0) ctx.fillStyle = p.getColor(1);
          else ctx.fillStyle = '#000000';
        } else {
          ctx.fillStyle = '#000000';
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }

    this.drawPlanetaryRing(ctx, p, cx, cy, r, true);
  }

  drawPlanetaryRing(ctx, p, cx, cy, r, isFront) {
    const rx = r * 2.2;
    const ry = r * 0.65;
    const innerRx = r * 1.35;
    const cassiniRx = r * 1.75;

    for (let angle = 0; angle < Math.PI * 2; angle += 0.025) {
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);

      if (isFront && sinA <= 0.05) continue;
      if (!isFront && sinA > 0.05) continue;

      for (let dist = innerRx; dist <= rx; dist += 1.3) {
        if (Math.abs(dist - cassiniRx) < 1.0) continue;

        const x = Math.round(cx + cosA * dist);
        const y = Math.round(cy + sinA * (dist * (ry / rx)));

        if ((x + y) % 2 === 0) {
          if (dist > cassiniRx) {
            ctx.fillStyle = p.getColor(6);
          } else {
            ctx.fillStyle = '#ffffff';
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
}
