import { drawPixelText, drawSprite, SPRITES } from './sprites.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.ghosts = [];
    this.floaters = [];
    this.shockwaves = [];
  }

  clear() {
    this.particles = [];
    this.ghosts = [];
    this.floaters = [];
    this.shockwaves = [];
  }

  // Generic pixel particle
  emit(x, y, vx, vy, colorIdx, life = 0.3, size = 2, gravity = 0) {
    this.particles.push({
      x, y, vx, vy,
      colorIdx,
      life,
      maxLife: life,
      size,
      gravity
    });
  }

  // Dust puff on jump / land / wall slide
  emitDustPuff(x, y, count = 4, dirX = 0, colorIdx = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) + (dirX > 0 ? -0.5 : dirX < 0 ? 0.5 : 0);
      const speed = 15 + Math.random() * 35;
      const vx = Math.cos(angle) * speed + dirX * 20;
      const vy = -Math.sin(angle) * speed * 0.6;
      this.emit(
        x + (Math.random() * 4 - 2),
        y + (Math.random() * 2 - 1),
        vx, vy,
        colorIdx,
        0.2 + Math.random() * 0.15,
        Math.random() > 0.5 ? 2 : 1,
        20
      );
    }
  }

  // Dash ghost afterimage trail
  addGhost(sprite, x, y, flipX, colorIdx = 7) {
    this.ghosts.push({
      sprite,
      x: Math.round(x),
      y: Math.round(y),
      flipX,
      colorIdx,
      life: 0.22,
      maxLife: 0.22
    });
  }

  // Dash diamond shockwave
  addShockwave(x, y, colorIdx = 8) {
    this.shockwaves.push({
      x: Math.round(x),
      y: Math.round(y),
      radius: 2,
      maxRadius: 22,
      colorIdx,
      life: 0.2,
      maxLife: 0.2
    });
  }

  // Floating text like "+1 STRAWBERRY" with bouncy upward float
  addFloater(text, x, y, colorIdx = 8, isBerry = false) {
    this.floaters.push({
      text,
      x,
      y,
      vy: -22,
      life: 0.95,
      maxLife: 0.95,
      colorIdx,
      isBerry
    });
  }

  // Alias supporting both (x, y, text) and (text, x, y)
  emitFloatingText(arg1, arg2, arg3, colorIdx = 8) {
    if (typeof arg1 === 'string') {
      this.addFloater(arg1, arg2, arg3, colorIdx);
    } else {
      this.addFloater(arg3, arg1, arg2, colorIdx);
    }
  }

  // Death explosion of pixel shards
  emitDeathBurst(x, y) {
    const colors = [5, 6, 7, 8];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const speed = 60 + Math.random() * 90;
      this.emit(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        colors[i % colors.length],
        0.5 + Math.random() * 0.3,
        Math.random() > 0.4 ? 3 : 2,
        80
      );
    }
    this.addShockwave(x, y, 8);
  }

  // Strawberry collect celebration sparkles (+1 with strawberry icon floating up and fading)
  emitBerryCollect(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 75;
      this.emit(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() > 0.5 ? 8 : 7,
        0.45 + Math.random() * 0.3,
        2,
        40
      );
    }
    this.addFloater('+1', x + 4, y - 6, '#ffffff', true);
    this.addShockwave(x, y, 8);
  }

  // Hero swap celebration sparkles (No strawberry text!)
  emitHeroSwap(x, y, heroName) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      this.emit(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() > 0.5 ? 8 : 6,
        0.35 + Math.random() * 0.2,
        2,
        20
      );
    }
    if (heroName) {
      this.addFloater(heroName.toUpperCase(), x - 18, y - 10, 8);
    }
    this.addShockwave(x, y, 6);
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Update ghosts
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const g = this.ghosts[i];
      g.life -= dt;
      if (g.life <= 0) {
        this.ghosts.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const progress = 1 - (s.life / s.maxLife);
      s.radius = 2 + progress * (s.maxRadius - 2);
    }

    // Update floaters
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.floaters.splice(i, 1);
        continue;
      }
      f.y += f.vy * dt;
    }
  }

  render(ctx, palette) {
    // 1. Render Dash Ghosts
    for (const g of this.ghosts) {
      const alpha = Math.max(0, g.life / g.maxLife) * 0.65;
      const sprite = g.sprite;
      if (!sprite || !sprite.length) continue;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(g.x, g.y);
      if (g.flipX) {
        ctx.scale(-1, 1);
        ctx.translate(-sprite[0].length, 0);
      }
      ctx.fillStyle = palette.getColor(g.colorIdx);

      for (let r = 0; r < sprite.length; r++) {
        for (let c = 0; c < sprite[0].length; c++) {
          if (sprite[r][c] >= 0) {
            ctx.fillRect(c, r, 1, 1);
          }
        }
      }
      ctx.restore();
    }

    // 2. Render Shockwaves (Crisp diamond shape in pixels)
    for (const s of this.shockwaves) {
      const alpha = Math.max(0, s.life / s.maxLife);
      const r = Math.round(s.radius);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = palette.getColor(s.colorIdx);
      // Diamond perimeter points
      for (let d = 0; d <= r; d++) {
        const inv = r - d;
        ctx.fillRect(s.x + d, s.y + inv, 1, 1);
        ctx.fillRect(s.x - d, s.y + inv, 1, 1);
        ctx.fillRect(s.x + d, s.y - inv, 1, 1);
        ctx.fillRect(s.x - d, s.y - inv, 1, 1);
      }
      ctx.restore();
    }

    // 3. Render Particles
    for (const p of this.particles) {
      const alpha = Math.min(1.0, Math.max(0, p.life / p.maxLife * 1.5));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = palette.getColor(p.colorIdx);
      const size = (p.life / p.maxLife > 0.4) ? p.size : Math.max(1, p.size - 1);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), size, size);
      ctx.restore();
    }

    // 4. Render Floaters (Smooth bouncy easing with optional strawberry icon)
    for (const f of this.floaters) {
      const progress = 1 - (f.life / f.maxLife);
      // Bouncy ease-out pop: overshoot up slightly, float slowly, then fade out
      let scale = 1.0;
      if (progress < 0.25) {
        // Elastic pop 0.0 -> 1.25 -> 1.0
        const pNorm = progress / 0.25;
        scale = Math.sin(pNorm * Math.PI * 0.5) * 1.2;
      } else if (progress < 0.4) {
        scale = 1.2 - ((progress - 0.25) / 0.15) * 0.2;
      }

      // Smooth fade out at the end
      const alpha = progress > 0.65 ? Math.max(0, (1 - progress) / 0.35) : 1.0;

      ctx.save();
      ctx.globalAlpha = alpha;

      const fx = Math.round(f.x);
      const fy = Math.round(f.y);

      // Draw mini strawberry icon before text if marked as strawberry
      if (f.isBerry) {
        drawSprite(ctx, SPRITES.strawberry[0], fx - 10, fy - 1, palette, false, 0.85);
      }

      const textColor = typeof f.colorIdx === 'string' ? f.colorIdx : palette.getColor(f.colorIdx);
      // Subtle 1px drop shadow for crisp readability
      drawPixelText(ctx, f.text, fx + 1, fy + 1, '#000000', 1);
      drawPixelText(ctx, f.text, fx, fy, textColor, 1);

      ctx.restore();
    }
  }
}

// Crisp Camera Shake with pixel rounding
export class ScreenShake {
  constructor() {
    this.intensity = 0;
    this.decay = 16;
    this.x = 0;
    this.y = 0;
  }

  add(amount) {
    this.intensity = Math.min(2.5, this.intensity + amount * 0.35);
  }

  update(dt) {
    if (this.intensity > 0) {
      this.intensity = Math.max(0, this.intensity - this.decay * dt);
      const angle = Math.random() * Math.PI * 2;
      this.x = Math.round(Math.cos(angle) * this.intensity * 0.7);
      this.y = Math.round(Math.sin(angle) * this.intensity * 0.7);
    } else {
      this.x = 0;
      this.y = 0;
    }
  }
}
