// Celeste-Grade Player Controller
// Zero-glitch separated-axis subpixel movement, accurate 8x11 hitbox,
// flawless floor docking, coyote time, jump buffering, wall tech, 8-way dash,
// dream block phasing & super dream jump!

import { SPRITES, drawSprite } from './sprites.js';
import { sfx } from './audio.js';
import { CHARACTERS } from './characters.js';

export class Player {
  constructor(x, y, character = null) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.character = character || CHARACTERS[0];
    this.vx = 0;
    this.vy = 0;
    this.xRem = 0;
    this.yRem = 0;

    // Sleek, responsive 6x9 Celeste hitbox (guarantees fitting everywhere)
    this.width = 6;
    this.height = 9;

    // Movement tuning
    this.runSpeed = 95;
    this.groundAccel = 1000;
    this.groundFric = 1400;
    this.airAccel = 700;
    this.airFric = 380;
    this.gravity = 650;
    this.maxFall = 190;
    this.fastFall = 270;
    this.jumpSpeed = -215;

    // Celeste feel variables
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.facing = 1;
    this.facingWall = 0;
    this.lastWallDir = 0;
    this.wallJumpGrace = 0;
    this.wallJumpLock = 0;

    // Dash
    this.dashAvailable = true;
    this.isDashing = false;
    this.isDreamPhasing = false;
    this.dashTimer = 0;
    this.dashDuration = 0.14;
    this.dashSpeed = 290;
    this.dashDirX = 0;
    this.dashDirY = 0;
    this.ghostTimer = 0;
    this.dashCooldown = 0;

    // Wall Climb
    this.isClimbing = false;
    this.stamina = 3.5;
    this.maxStamina = 3.5;

    // Visuals & Squash/Stretch
    this.scaleX = 1;
    this.scaleY = 1;
    this.animState = 'idle';
    this.animFrame = 0;
    this.animTimer = 0;

    // Hair nodes (Madeline flowing hair ribbon)
    this.hairNodes = [
      { x: this.x - 1, y: this.y - 2 },
      { x: this.x - 2, y: this.y - 1 },
      { x: this.x - 3, y: this.y },
      { x: this.x - 4, y: this.y + 1 }
    ];

    // Scarf nodes (Theo fluttering adventurer scarf)
    this.scarfNodes = [
      { x: this.x, y: this.y + 3 },
      { x: this.x - 2, y: this.y + 4 },
      { x: this.x - 4, y: this.y + 5 }
    ];

    // Leaves trail particles (Granny mountain elder autumn foliage)
    this.leafParticles = [];

    this.dead = false;
    this.respawnTimer = 0;
    this.springBounceTimer = 0;

    // Golden Feather 360 DEG flight state
    this.isFeatherFlying = false;
    this.featherTimer = 0;
    const savedFeatherTime = parseFloat(localStorage.getItem('seleste_feather_duration') || '2.0');
    this.featherMaxTimer = (!isNaN(savedFeatherTime) && savedFeatherTime > 0) ? savedFeatherTime : 2.0;

    // Haptic vibration callback (Gamepad dual-rumble)
    this.onHaptic = null;

    // Dash buffer: stores a queued dash pressed during dream block phasing
    this.dashBuffer = 0;
  }

  setCharacter(character) {
    if (character) {
      this.character = character;
    }
  }

  startFeatherFlight(particleSystem, customDuration = null) {
    this.isFeatherFlying = true;
    if (typeof customDuration === 'number' && customDuration > 0) {
      this.featherMaxTimer = customDuration;
    }
    this.featherTimer = this.featherMaxTimer;
    this.isDashing = false;
    this.dashAvailable = true;
    this.onGround = false;
    this.vy = -60;
    if (particleSystem) {
      particleSystem.addShockwave(this.x + this.width / 2, this.y + this.height / 2, 8);
    }
  }

  // Safe reset with automatic floor docking
  reset(x = this.startX, y = this.startY, level = null) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.xRem = 0;
    this.yRem = 0;
    this.onGround = false;
    this.dashAvailable = true;
    this.isDashing = false;
    this.isDreamPhasing = false;
    this.isFeatherFlying = false;
    this.featherTimer = 0;
    sfx.stopDreamDrone();
    sfx.setLowPass(false);
    this.dashTimer = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.dead = false;
    this.stamina = this.maxStamina;
    this.springBounceTimer = 0;
    this.dashBuffer = 0;
    this.leafParticles = [];

    // If level provided, dock player cleanly onto floor if overlapping
    if (level) {
      // If currently colliding with ground on spawn, nudge upward until free
      while (this.collideAt(this.x, this.y, level) && this.y > 0) {
        this.y -= 1;
      }
    }

    const rootX = this.x + (this.facing === 1 ? -0.5 : 5.5);
    const rootY = this.y - 1.5;
    this.hairNodes.forEach((node, i) => {
      node.x = rootX - this.facing * i * 0.6;
      node.y = rootY + i * 0.7;
    });

    const neckX = this.x + (this.facing === 1 ? 1 : 5);
    const neckY = this.y + 3.5;
    this.scarfNodes.forEach((node, i) => {
      node.x = neckX - this.facing * i * 1.0;
      node.y = neckY + i * 0.8;
    });
  }

  kill(particleSystem, screenShake, onFreeze) {
    if (this.dead) return;
    this.dead = true;
    this.respawnTimer = 0.35;
    this.vx = 0;
    this.vy = 0;
    this.isDashing = false;
    this.isDreamPhasing = false;
    this.isFeatherFlying = false;
    this.dashBuffer = 0;
    sfx.stopDreamDrone();
    sfx.setLowPass(true);
    sfx.playDeath();
    if (this.onHaptic) this.onHaptic('death');
    particleSystem.emitDeathBurst(this.x + this.width / 2, this.y + this.height / 2);
    screenShake.add(4.5);
    if (onFreeze) onFreeze(0.06);
  }

  refillDash(particleSystem) {
    if (!this.dashAvailable) {
      this.dashAvailable = true;
      sfx.playCrystalRefill();
      particleSystem.addFloater('DASH READY', this.x - 12, this.y - 12, 8);
      for (let i = 0; i < 6; i++) {
        particleSystem.emit(
          this.x + this.width / 2,
          this.y + this.height / 2,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          8, 0.25, 2
        );
      }
    }
  }

  update(dt, input, level, particleSystem, screenShake, onFreeze) {
    if (this.dead) {
      this.respawnTimer -= dt;
      return;
    }

    // Squash & stretch recovery spring
    this.scaleX += (1.0 - this.scaleX) * Math.min(1.0, 16 * dt);
    this.scaleY += (1.0 - this.scaleY) * Math.min(1.0, 16 * dt);

    if (this.wallJumpLock > 0) this.wallJumpLock -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;

    // ---------------------------------------------------------
    // GOLDEN FEATHER 360 DEG FREE FLIGHT
    // ---------------------------------------------------------
    if (this.isFeatherFlying) {
      this.featherTimer -= dt;
      this.isDashing = false;
      this.dashAvailable = true;
      this.onGround = false;
      this.coyoteTimer = 0;

      let fx = 0;
      let fy = 0;
      if (input.analogX !== undefined && Math.hypot(input.analogX, input.analogY) > 0.2) {
        fx = input.analogX;
        fy = input.analogY;
      } else {
        if (input.left) fx -= 1;
        if (input.right) fx += 1;
        if (input.up) fy -= 1;
        if (input.down) fy += 1;
      }

      const fLen = Math.hypot(fx, fy);
      const targetVx = fLen > 0 ? (fx / fLen) * 135 : 0;
      const targetVy = fLen > 0 ? (fy / fLen) * 135 : 0;

      this.vx += (targetVx - this.vx) * Math.min(1.0, 11 * dt);
      this.vy += (targetVy - this.vy) * Math.min(1.0, 11 * dt);

      this.moveX(this.vx * dt, level);
      this.moveY(this.vy * dt, level);

      if (fLen > 0) {
        this.facing = fx > 0 ? 1 : (fx < 0 ? -1 : this.facing);
      }

      // Rainbow / stardust particle trail
      if (Math.random() < 0.45) {
        const rainbowColors = [5, 6, 7, 8];
        const rc = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        particleSystem.emit(this.x + this.width / 2, this.y + this.height / 2, -this.vx * 0.12, -this.vy * 0.12, rc, 0.25, 2);
      }

      if (this.featherTimer <= 0) {
        this.isFeatherFlying = false;
        this.refillDash(particleSystem);
        sfx.playFeatherEnd();
        screenShake.add(2);
        particleSystem.addShockwave(this.x + this.width / 2, this.y + this.height / 2, 8);
      }

      this.updateHair(dt);
      return;
    }

    // Jump buffer
    if (input.jumpPressed) {
      this.jumpBufferTimer = 0.12;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // ---------------------------------------------------------
    // DASH & DREAM BLOCK PHASING
    // ---------------------------------------------------------

    // Tick down dash buffer timer each frame
    if (this.dashBuffer > 0) this.dashBuffer -= dt;

    if (this.isDashing) {
      this.dashTimer -= dt;
      this.ghostTimer -= dt;

      if (this.ghostTimer <= 0) {
        this.ghostTimer = 0.035;
        particleSystem.addGhost(
          this.character.sprites.dash,
          this.x - 3,
          this.y - 3,
          this.facing === -1,
          this.character.dashGhostColor || 7
        );
      }

      // Check Dream Block Phasing (Authentic Celeste Dream Dash)
      const inDream = level.overlapsDreamBlock(this.x, this.y, this.width, this.height) ||
                      level.overlapsDreamBlock(this.x + Math.sign(this.dashDirX) * 2, this.y + Math.sign(this.dashDirY) * 2, this.width, this.height);
      if (!this.isDreamPhasing && inDream) {
        this.isDreamPhasing = true;
        sfx.playDreamDash();
        sfx.startDreamDrone();
        screenShake.add(1.5);
        this.dashTimer = 0.45;
        particleSystem.addShockwave(this.x + this.width / 2, this.y + this.height / 2, 8);
      } else if (this.isDreamPhasing) {
        // Continuous stardust motes & maintain exact dash speed while traversing block
        this.dashTimer = 0.35; // Prevents dash from expiring midway through block
        const dirX = this.dashDirX !== 0 ? this.dashDirX : (this.facing !== 0 ? this.facing : 1);
        this.vx = dirX * this.dashSpeed;
        this.vy = this.dashDirY * this.dashSpeed;

        if (Math.random() < 0.6) {
          particleSystem.emit(
            this.x + Math.random() * this.width,
            this.y + Math.random() * this.height,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            8, 0.25, 1.5
          );
        }

        // Buffer a dash press made while inside the dream block
        if (input.dashPressed && this.dashCooldown <= 0) {
          this.dashBuffer = 0.15;
        }

        if (!inDream) {
          // Exited Dream Block!
          this.isDreamPhasing = false;
          this.isDashing = false;
          this.refillDash(particleSystem);
          sfx.stopDreamDrone();
          sfx.playDreamExit();
          screenShake.add(2.5);
          particleSystem.addShockwave(this.x + this.width / 2, this.y + this.height / 2, 9);

          if (this.jumpBufferTimer > 0) {
            // Dream Jump super boost!
            this.jumpBufferTimer = 0;
            this.vy = this.jumpSpeed * 1.4;
            this.vx = dirX * this.runSpeed * 1.85;
            this.scaleX = 0.55;
            this.scaleY = 1.6;
            particleSystem.emitDustPuff(this.x + this.width / 2, this.y + this.height, 8, -this.facing, 8);
            sfx.playJump();
          } else if (this.dashBuffer > 0) {
            // Dash was buffered during dream phasing — fire it immediately on exit!
            this.dashBuffer = 0;

            let bdx = input.left ? -1 : (input.right ? 1 : 0);
            let bdy = input.up ? -1 : (input.down ? 1 : 0);
            if (bdx === 0 && bdy === 0) bdx = this.facing;

            const bLen = Math.hypot(bdx, bdy) || 1;
            this.dashDirX = bdx / bLen;
            this.dashDirY = bdy / bLen;
            this.vx = this.dashDirX * this.dashSpeed;
            this.vy = this.dashDirY * this.dashSpeed;

            this.isDashing = true;
            this.dashAvailable = false;
            this.dashTimer = this.dashDuration;
            this.ghostTimer = 0;
            this.dashCooldown = 0.18;

            sfx.playDash();
            if (this.onHaptic) this.onHaptic('dash');
            screenShake.add(3);
            if (onFreeze) onFreeze(0.04);
            particleSystem.addShockwave(this.x + this.width / 2, this.y + this.height / 2, 8);
            particleSystem.emitDustPuff(this.x + this.width / 2, this.y + this.height / 2, 8, -this.dashDirX, 7);
            this.scaleX = Math.abs(this.dashDirX) > 0.5 ? 1.4 : 0.8;
            this.scaleY = Math.abs(this.dashDirY) > 0.5 ? 1.4 : 0.8;
          } else {
            this.vx *= 1.15;
            this.vy *= 1.15;
          }
        }
      }

      // Wall Bounce (Upward dash near wall + Jump)
      if (this.dashDirY < -0.5 && this.jumpBufferTimer > 0) {
        const wallLeft = level.isSolidTile(Math.floor((this.x - 3) / 10), Math.floor((this.y + 4) / 10));
        const wallRight = level.isSolidTile(Math.floor((this.x + this.width + 3) / 10), Math.floor((this.y + 4) / 10));
        const wallDir = wallLeft ? -1 : (wallRight ? 1 : 0);

        if (wallDir !== 0) {
          this.isDashing = false;
          this.jumpBufferTimer = 0;
          this.vy = this.jumpSpeed * 1.55; // Vertical kick ~-333 px/s
          this.vx = -wallDir * 80;
          this.facing = -wallDir;
          this.scaleX = 0.5;
          this.scaleY = 1.7;
          sfx.playWallBounce();
          screenShake.add(3);
          if (onFreeze) onFreeze(0.04);
          particleSystem.addFloater('WALL BOUNCE!', this.x - 14, this.y - 12, 8);
          particleSystem.addShockwave(this.x + (wallDir === -1 ? 0 : this.width), this.y + 4, 8);
          particleSystem.emitDustPuff(this.x + (wallDir === -1 ? 0 : this.width), this.y + 4, 8, wallDir, 8);
        }
      }

      // Wavedash & Extended Hyperdash / Superdash Cancel on Ground
      const isGroundedOrNear = this.onGround || this.coyoteTimer > 0 || this.collideAt(this.x, this.y + 2, level);
      if (this.jumpBufferTimer > 0 && isGroundedOrNear && !this.isDreamPhasing) {
        this.isDashing = false;
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;

        const isDownDiag = this.dashDirY > 0.3 && this.dashDirX !== 0;
        const isHorizontalDash = Math.abs(this.dashDirY) <= 0.3 && this.dashDirX !== 0;

        if (isDownDiag || isHorizontalDash) {
          // Authentic Celeste Hyperdash / Wavedash: rocket speed launch!
          // Extended hyperdash window: jump late in dash (dashTimer <= 0.10) to restore dash
          const isExtended = this.dashTimer <= 0.10;
          this.vx = Math.sign(this.dashDirX) * 275;
          this.vy = this.jumpSpeed * 0.82; // Flat horizontal rocket trajectory (-176 px/s)
          this.scaleX = 0.55;
          this.scaleY = 1.6;

          if (isExtended) {
            // Extended Hyperdash / Full Wavedash: restores dash!
            this.refillDash(particleSystem);
            sfx.playWaveDash();
            screenShake.add(2.5);
            particleSystem.addFloater(isDownDiag ? 'WAVEDASH!' : 'EXTENDED HYPER!', this.x - 18, this.y - 12, 8);
            particleSystem.emitDustPuff(this.x + this.width / 2, this.y + this.height, 10, -Math.sign(this.dashDirX), 8);
            particleSystem.addShockwave(this.x + this.width / 2, this.y + this.height, 8);
          } else {
            // Early Hyperdash
            sfx.playJump();
            screenShake.add(2);
            particleSystem.addFloater('HYPERDASH!', this.x - 12, this.y - 12, 7);
            particleSystem.emitDustPuff(this.x + this.width / 2, this.y + this.height, 8, -Math.sign(this.dashDirX), 8);
          }
        } else {
          // Upward or vertical dash cancel
          this.vy = this.jumpSpeed;
          this.vx = (this.dashDirX !== 0 ? Math.sign(this.dashDirX) : this.facing) * this.runSpeed * 1.5;
          this.scaleX = 0.7;
          this.scaleY = 1.4;
          sfx.playJump();
          particleSystem.emitDustPuff(this.x + this.width / 2, this.y + this.height, 6, -this.facing, 8);
          screenShake.add(1.5);
        }
      } else if (this.dashTimer <= 0 && !this.isDreamPhasing) {
        this.isDashing = false;
        this.vx *= 0.65;
        this.vy *= 0.4;
      } else {
        // Move with dash velocity
        this.moveX(this.vx * dt, level);
        this.moveY(this.vy * dt, level);
        this.updateHair(dt);
        return;
      }
    }

    // Initiate Dash
    if (input.dashPressed && this.dashAvailable && this.dashCooldown <= 0) {
      let dx = 0;
      let dy = 0;
      if (input.left) dx -= 1;
      if (input.right) dx += 1;
      if (input.up) dy -= 1;
      if (input.down) dy += 1;

      if (dx === 0 && dy === 0) {
        dx = this.facing;
      }

      const len = Math.hypot(dx, dy);
      this.dashDirX = dx / len;
      this.dashDirY = dy / len;

      this.vx = this.dashDirX * this.dashSpeed;
      this.vy = this.dashDirY * this.dashSpeed;

      this.isDashing = true;
      this.dashAvailable = false;
      this.dashTimer = this.dashDuration;
      this.ghostTimer = 0;
      this.dashCooldown = 0.18;

      sfx.playDash();
      if (this.onHaptic) this.onHaptic('dash');
      screenShake.add(3);
      if (onFreeze) onFreeze(0.04);
      particleSystem.addShockwave(this.x + this.width / 2, this.y + this.height / 2, 8);
      particleSystem.emitDustPuff(this.x + this.width / 2, this.y + this.height / 2, 8, -this.dashDirX, 7);

      this.scaleX = Math.abs(this.dashDirX) > 0.5 ? 1.4 : 0.8;
      this.scaleY = Math.abs(this.dashDirY) > 0.5 ? 1.4 : 0.8;

      this.updateHair(dt);
      return;
    }

    // ---------------------------------------------------------
    // GROUND & WALL SENSING
    // ---------------------------------------------------------
    const wasOnGround = this.onGround;
    this.onGround = this.collideAt(this.x, this.y + 1, level);

    if (this.onGround) {
      this.coyoteTimer = 0.12;
      this.dashAvailable = true;
      this.stamina = this.maxStamina;

      if (!wasOnGround) {
        this.scaleX = 1.35;
        this.scaleY = 0.65;
        sfx.playLand();
        particleSystem.emitDustPuff(this.x + this.width / 2, this.y + this.height, 4, 0, 6);
      }
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    // Wall checks (generous 2.5px reach for fluid wall jumps and clings)
    const leftWall = this.collideAt(this.x - 2.5, this.y, level);
    const rightWall = this.collideAt(this.x + 2.5, this.y, level);

    if (leftWall) {
      this.facingWall = -1;
      this.lastWallDir = -1;
      this.wallJumpGrace = 0.15; // 150ms buffer
    } else if (rightWall) {
      this.facingWall = 1;
      this.lastWallDir = 1;
      this.wallJumpGrace = 0.15; // 150ms buffer
    } else {
      this.facingWall = 0;
      this.wallJumpGrace = Math.max(0, this.wallJumpGrace - dt);
    }

    // ---------------------------------------------------------
    // HORIZONTAL RUNNING (Instant, responsive, zero-glitch!)
    // ---------------------------------------------------------
    // Mountain Wind calculation
    const rawWind = (level && level.wind) ? level.wind : 0;
    const windVal = Math.abs(rawWind) === 1 ? rawWind * 22 : rawWind;

    let targetVx = 0;
    if (this.wallJumpLock <= 0) {
      if (input.left) {
        targetVx -= this.runSpeed;
        this.facing = -1;
      }
      if (input.right) {
        targetVx += this.runSpeed;
        this.facing = 1;
      }

      // Mountain Wind influence on target speed
      if (windVal !== 0) {
        if (!this.onGround && !this.isClimbing) {
          // Airborne: wind carries player and alters max speeds
          if (targetVx === 0) {
            targetVx = windVal * 2.2;
          } else if (Math.sign(targetVx) === Math.sign(windVal)) {
            targetVx += windVal * 1.1; // Tailwind boost
          } else {
            targetVx += windVal * 1.2; // Headwind resistance
          }
        } else if (this.onGround) {
          // On Ground: gentle push when idle, resisted when pushing against
          if (targetVx === 0 && !input.down) {
            targetVx = windVal * 0.75;
          } else if (Math.sign(targetVx) === Math.sign(windVal)) {
            targetVx += windVal * 0.5;
          } else {
            targetVx += windVal * 0.6;
          }
        }
      }

      const accel = this.onGround ? this.groundAccel : this.airAccel;
      const fric = this.onGround ? this.groundFric : this.airFric;

      if (targetVx !== 0) {
        if (Math.sign(this.vx) !== Math.sign(targetVx) && this.vx !== 0) {
          this.vx = this.approach(this.vx, targetVx, fric * dt);
        } else if (Math.abs(this.vx) > Math.abs(targetVx)) {
          // If already moving faster than runSpeed (hyperdash, super jump), gradually ease down instead of slamming down
          const preserveFric = this.onGround ? 280 : 180;
          this.vx = this.approach(this.vx, targetVx, preserveFric * dt);
        } else {
          this.vx = this.approach(this.vx, targetVx, accel * dt);
        }
      } else {
        this.vx = this.approach(this.vx, 0, fric * dt);
      }
    }

    // ---------------------------------------------------------
    // WALL CLIMB / WALL SLIDE
    // ---------------------------------------------------------
    const pushingWall = (input.left && this.facingWall === -1) || (input.right && this.facingWall === 1);
    this.isClimbing = false;

    if (this.facingWall !== 0 && !this.onGround) {
      if (input.climb && this.stamina > 0) {
        this.isClimbing = true;
        this.stamina = Math.max(0, this.stamina - dt * 10);
        if (input.up) this.vy = -65;
        else if (input.down) this.vy = 80;
        else this.vy = 0;

        if (Math.random() < 0.2) {
          particleSystem.emit(
            this.facingWall === -1 ? this.x : this.x + this.width,
            this.y + this.height - 2,
            -this.facingWall * 10, -5,
            6, 0.2, 1
          );
        }
      } else if (pushingWall && this.vy > 0) {
        // Wall Slide (gentle friction slide down)
        const maxSlide = 40;
        if (this.vy > maxSlide) {
          this.vy = this.approach(this.vy, maxSlide, 900 * dt);
        }
        if (Math.random() < 0.25) {
          particleSystem.emit(
            this.facingWall === -1 ? this.x : this.x + this.width,
            this.y + this.height - 1,
            -this.facingWall * 15, -10,
            6, 0.2, 1
          );
        }
      }
    }

    // ---------------------------------------------------------
    // JUMPING & WALL JUMPING
    // ---------------------------------------------------------
    if (this.jumpBufferTimer > 0) {
      // Ground / Coyote Jump
      if (this.coyoteTimer > 0) {
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.vy = this.jumpSpeed;
        this.scaleX = 0.7;
        this.scaleY = 1.35;
        sfx.playJump();
        particleSystem.emitDustPuff(this.x + this.width / 2, this.y + this.height, 5, 0, 6);
      }
      // Wall Jump (authentic Celeste 3-directional response)
      else if (this.wallJumpGrace > 0 || this.facingWall !== 0) {
        const wallDir = this.facingWall !== 0 ? this.facingWall : (this.lastWallDir || (leftWall ? -1 : 1));
        this.jumpBufferTimer = 0;
        this.wallJumpGrace = 0;

        const holdingToward = (wallDir === -1 && input.left) || (wallDir === 1 && input.right);
        const holdingAway = (wallDir === -1 && input.right) || (wallDir === 1 && input.left);

        if (holdingToward || (input.climb && this.stamina > 0)) {
          // 1. Climb Jump: Upward scale, slight push away
          this.vy = -245;
          this.vx = -wallDir * 45;
          this.wallJumpLock = 0.08;
          if (input.climb) this.stamina = Math.max(0, this.stamina - 15);
        } else if (holdingAway) {
          // 2. Wall Jump Away: High leap away with strong horizontal speed
          this.vy = -205;
          this.vx = -wallDir * 175;
          this.wallJumpLock = 0.14;
        } else {
          // 3. Neutral Wall Jump: High upward leap with steady clearance
          this.vy = -230;
          this.vx = -wallDir * 115;
          this.wallJumpLock = 0.1;
        }

        this.facing = -wallDir;
        this.scaleX = 0.75;
        this.scaleY = 1.3;
        sfx.playWallJump();
        particleSystem.emitDustPuff(
          wallDir === -1 ? this.x : this.x + this.width,
          this.y + this.height / 2,
          5, -wallDir, 6
        );
      }
    }

    // Variable jump height & spring bounce preservation
    if (this.springBounceTimer > 0) {
      this.springBounceTimer -= dt;
      // Celeste Super Spring boost if player presses jump during spring bounce
      if (input.jumpPressed) {
        this.vy = -430;
        this.scaleX = 0.5;
        this.scaleY = 1.8;
        sfx.playJump();
        particleSystem.emitDustPuff(this.x + this.width / 2, this.y + this.height, 8, 0, 8);
      }
    } else {
      if (!input.jump && this.vy < -75) {
        this.vy = -75;
      }
    }

    // Gravity
    if (!this.isClimbing) {
      const termVel = (input.down && !this.onGround) ? this.fastFall : this.maxFall;
      this.vy = this.approach(this.vy, termVel, this.gravity * dt);
    }

    // Mountain Wind (Continuous air boost / drift)
    if (windVal !== 0) {
      if (!this.onGround && !this.isClimbing) {
        this.vx += windVal * 5.0 * dt;
      } else if (this.isClimbing) {
        // Wind buffeting against wall climber
        if ((windVal > 0 && this.facingWall === -1) || (windVal < 0 && this.facingWall === 1)) {
          this.stamina = Math.max(0, this.stamina - dt * 3.5);
        }
      }
    }

    // Execute Separated Axis Movement
    this.moveX(this.vx * dt, level);
    this.moveY(this.vy * dt, level);

    // Update animations & hair
    this.updateAnimation(dt, input);
    this.updateHair(dt);
  }

  approach(curr, target, maxDelta) {
    if (curr < target) return Math.min(curr + maxDelta, target);
    return Math.max(curr - maxDelta, target);
  }

  // Separated-Axis X Movement with Corner & Step Correction
  moveX(dx, level) {
    this.xRem += dx;
    let move = Math.round(this.xRem);
    if (move !== 0) {
      this.xRem -= move;
      const sign = Math.sign(move);
      while (move !== 0) {
        if (!this.collideAt(this.x + sign, this.y, level)) {
          this.x += sign;
          move -= sign;
        } else if (this.onGround && !this.collideAt(this.x + sign, this.y - 2, level)) {
          // Smooth 1-2px step-up assist
          this.y -= 2;
          this.x += sign;
          move -= sign;
        } else {
          // Horizontal dash corner nudge
          let nudged = false;
          if (this.isDashing) {
            for (let n = 1; n <= 4; n++) {
              if (!this.collideAt(this.x + sign, this.y - n, level)) {
                this.y -= n;
                this.x += sign;
                move -= sign;
                nudged = true;
                break;
              } else if (!this.collideAt(this.x + sign, this.y + n, level)) {
                this.y += n;
                this.x += sign;
                move -= sign;
                nudged = true;
                break;
              }
            }
          }
          if (!nudged) {
            if (!this.isDreamPhasing) {
              this.vx = 0;
            }
            break;
          }
        }
      }
    }
  }

  // Separated-Axis Y Movement with Ceiling & Landing Corner Correction
  moveY(dy, level) {
    this.yRem += dy;
    let move = Math.round(this.yRem);
    if (move !== 0) {
      this.yRem -= move;
      const sign = Math.sign(move);
      while (move !== 0) {
        if (!this.collideAt(this.x, this.y + sign, level)) {
          this.y += sign;
          move -= sign;
        } else {
          let nudged = false;
          if (sign < 0) {
            // Ceiling Corner Correction when jumping up
            for (let n = 1; n <= 4; n++) {
              if (!this.collideAt(this.x + n, this.y + sign, level)) {
                this.x += n;
                this.y += sign;
                move -= sign;
                nudged = true;
                break;
              } else if (!this.collideAt(this.x - n, this.y + sign, level)) {
                this.x -= n;
                this.y += sign;
                move -= sign;
                nudged = true;
                break;
              }
            }
          } else if (sign > 0 && !this.onGround) {
            // Ledge landing assist when falling near corners
            for (let n = 1; n <= 3; n++) {
              if (!this.collideAt(this.x + n, this.y + sign, level)) {
                this.x += n;
                this.y += sign;
                move -= sign;
                nudged = true;
                break;
              } else if (!this.collideAt(this.x - n, this.y + sign, level)) {
                this.x -= n;
                this.y += sign;
                move -= sign;
                nudged = true;
                break;
              }
            }
          }
          if (!nudged) {
            if (!this.isDreamPhasing) {
              this.vy = 0;
            }
            break;
          }
        }
      }
    }
  }

  // AABB collision against level grid
  collideAt(px, py, level) {
    const left = Math.floor(px / 10);
    const right = Math.floor((px + this.width - 1) / 10);
    const top = Math.floor(py / 10);
    const bottom = Math.floor((py + this.height - 1) / 10);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (level.isSolidTile(c, r, this.isDreamPhasing, this.isDashing)) return true;
      }
    }

    // Check active crumbling blocks & moving platforms
    if (level.isMovingOrCrumblingSolid(px, py, this.width, this.height)) {
      return true;
    }

    return false;
  }

  updateAnimation(dt, input) {
    this.animTimer += dt;

    if (this.isDashing) {
      this.animState = 'dash';
    } else if (this.facingWall !== 0 && !this.onGround && (this.isClimbing || input.left || input.right)) {
      this.animState = 'wall';
    } else if (!this.onGround) {
      this.animState = this.vy < -20 ? 'jump' : 'fall';
    } else if (Math.abs(this.vx) > 10) {
      this.animState = 'run';
    } else {
      this.animState = 'idle';
    }

    if (this.animState === 'idle') {
      if (this.animTimer > 0.16) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % this.character.sprites.idle.length;
      }
    } else if (this.animState === 'run') {
      const runInterval = Math.max(0.06, 0.11 - (Math.abs(this.vx) / this.runSpeed) * 0.04);
      if (this.animTimer > runInterval) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % this.character.sprites.run.length;
      }
    } else {
      this.animFrame = 0;
    }
  }

  updateHair(dt) {
    const rawWind = (this.game && this.game.level ? this.game.level.wind : 0) || 0;
    const windVal = Math.abs(rawWind) === 1 ? rawWind * 22 : rawWind;
    const windEffect = windVal !== 0 ? (windVal * 0.08) : 0;

    // 1. Madeline Compact Natural Hair Physics (Classic Celeste Inverse Kinematics)
    const rootX = this.x + (this.facing === 1 ? 0.5 : 5.5);
    const rootY = this.y - 0.5;

    this.hairNodes[0].x = rootX;
    this.hairNodes[0].y = rootY;

    for (let i = 1; i < this.hairNodes.length; i++) {
      const prev = this.hairNodes[i - 1];
      const curr = this.hairNodes[i];
      // Resting position: hangs down naturally against neck when idle; trails with speed when moving
      const inertiaX = -this.vx * 0.035;
      const inertiaY = -this.vy * 0.02;
      const flutter = windVal !== 0 ? Math.sin(this.animTimer * 16 + i * 2) * 0.35 : 0;
      const targetX = prev.x - this.facing * 0.75 + inertiaX + windEffect + flutter;
      const targetY = prev.y + 0.7 + inertiaY;

      const dx = targetX - curr.x;
      const dy = targetY - curr.y;
      curr.x += dx * Math.min(1.0, 24 * dt);
      curr.y += dy * Math.min(1.0, 24 * dt);

      // Strict distance constraint clamp (keeps hair compact, never stretched or broken!)
      const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      if (dist > 1.8) {
        const factor = 1.8 / dist;
        curr.x = prev.x + (curr.x - prev.x) * factor;
        curr.y = prev.y + (curr.y - prev.y) * factor;
      }
    }

    // 2. Theo Fluttering Adventurer Scarf Physics
    const neckX = this.x + (this.facing === 1 ? 1 : 5);
    const neckY = this.y + 3.5;
    this.scarfNodes[0].x = neckX;
    this.scarfNodes[0].y = neckY;

    for (let i = 1; i < this.scarfNodes.length; i++) {
      const prev = this.scarfNodes[i - 1];
      const curr = this.scarfNodes[i];
      const flutter = Math.sin(this.animTimer * 14 + i * 1.5) * (windVal !== 0 ? 1.8 : 1.2);
      const windX = -this.facing * 1.0 - (this.vx * 0.05) + (windEffect * 1.4);
      const windY = 0.6 + flutter - (this.vy * 0.02);
      const targetX = prev.x + windX;
      const targetY = prev.y + windY;

      const dx = targetX - curr.x;
      const dy = targetY - curr.y;
      curr.x += dx * Math.min(1.0, 24 * dt);
      curr.y += dy * Math.min(1.0, 24 * dt);

      const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      if (dist > 2.2) {
        const factor = 2.2 / dist;
        curr.x = prev.x + (curr.x - prev.x) * factor;
        curr.y = prev.y + (curr.y - prev.y) * factor;
      }
    }

    // 3. Granny Mountain Elder Swirling Autumn Leaves Physics
    if (this.character.trailType === 'leaves') {
      const speed = Math.hypot(this.vx, this.vy);
      const spawnChance = this.isDashing ? 0.95 : (speed > 15 ? 0.35 : 0.08);
      if (Math.random() < spawnChance && this.leafParticles.length < 24) {
        const colors = ['#e09f3e', '#c8580b', '#ff3b56', '#ffd166', '#d4a373'];
        this.leafParticles.push({
          x: this.x + (this.facing === 1 ? -1 : 6) + (Math.random() * 4 - 2),
          y: this.y + 4 + (Math.random() * 4 - 2),
          vx: -this.facing * (15 + Math.random() * 25) - this.vx * 0.1,
          vy: -8 + Math.random() * 16,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 4 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1.0,
          decay: 1.2 + Math.random() * 0.8
        });
      }

      for (let i = this.leafParticles.length - 1; i >= 0; i--) {
        const p = this.leafParticles[i];
        p.life -= dt * p.decay;
        p.wobble += p.wobbleSpeed * dt;
        p.x += (p.vx + Math.sin(p.wobble) * 12) * dt;
        p.y += (p.vy + 10) * dt;
        if (p.life <= 0) {
          this.leafParticles.splice(i, 1);
        }
      }
    }
  }

  render(ctx, palette) {
    if (this.dead) return;

    const px = Math.round(this.x);
    const py = Math.round(this.y);

    // Golden Feather Free Flight Visuals
    if (this.isFeatherFlying) {
      const t = performance.now() * 0.01;
      ctx.save();
      const rainbow = [palette.getColor(8), palette.getColor(7), palette.getColor(6), '#ffffff'];
      const auraCol = rainbow[Math.floor(t * 3) % rainbow.length];
      ctx.fillStyle = auraCol;
      ctx.beginPath();
      ctx.arc(px + 3, py + 4, 7 + Math.sin(t * 2) * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Golden core
      ctx.fillStyle = palette.getColor(8);
      ctx.beginPath();
      ctx.arc(px + 3, py + 4, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Sparkling center star
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 2, py + 3, 2, 2);

      // Radial timer progress ring above
      const pct = Math.max(0, this.featherTimer / this.featherMaxTimer);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px + 3, py - 6, 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = palette.getColor(8);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px + 3, py - 6, 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Render Unique Character Trails & Auras
    ctx.save();
    if (this.character.trailType === 'hair') {
      // Madeline: Authentic compact pixel-art flowing hair locks (Classic Celeste)
      const hairColor = this.dashAvailable ? (this.character.hairColorReady || '#ff2a55') : (this.character.hairColorSpent || '#29adff');
      const hairShadow = this.dashAvailable ? (this.character.hairShadowReady || '#9e0b32') : (this.character.hairShadowSpent || '#0b4f7a');

      // Connecting pixel link between nodes
      for (let i = 0; i < this.hairNodes.length - 1; i++) {
        const n1 = this.hairNodes[i];
        const n2 = this.hairNodes[i + 1];
        const midX = Math.round((n1.x + n2.x) / 2);
        const midY = Math.round((n1.y + n2.y) / 2);
        ctx.fillStyle = hairShadow;
        ctx.fillRect(midX - 1, midY - 1, 3, 3);
        ctx.fillStyle = hairColor;
        ctx.fillRect(midX, midY, 2, 2);
      }

      // Draw rounded pixel stamps for each node (from tail to root)
      for (let i = this.hairNodes.length - 1; i >= 0; i--) {
        const node = this.hairNodes[i];
        const nx = Math.round(node.x);
        const ny = Math.round(node.y);

        if (i <= 1) {
          // Node 0 & 1: 4x4 rounded pixel disc
          ctx.fillStyle = hairShadow;
          ctx.fillRect(nx - 2, ny - 1, 4, 3);
          ctx.fillRect(nx - 1, ny - 2, 2, 5);

          ctx.fillStyle = hairColor;
          ctx.fillRect(nx - 1, ny - 1, 3, 3);

          if (i === 0 && this.dashAvailable) {
            // Specular shine glint on crown node
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(nx, ny - 1, 1, 1);
          }
        } else if (i === 2) {
          // Node 2: 3x3 pixel disc
          ctx.fillStyle = hairShadow;
          ctx.fillRect(nx - 1, ny - 1, 3, 3);
          ctx.fillStyle = hairColor;
          ctx.fillRect(nx - 1, ny, 2, 2);
        } else {
          // Node 3: 2x2 pixel tail tip
          ctx.fillStyle = hairShadow;
          ctx.fillRect(nx - 1, ny - 1, 2, 2);
          ctx.fillStyle = hairColor;
          ctx.fillRect(nx, ny, 1, 1);
        }
      }
    } else if (this.character.trailType === 'shadow_orbs') {
      // Badeline: Swirling dark ether shadow orbs
      const t = performance.now() * 0.007;
      const orbColor = this.dashAvailable ? palette.getColor(7) : palette.getColor(1);
      const auraColor = palette.getColor(2);
      for (let i = 0; i < 3; i++) {
        const angle = t + (i * Math.PI * 2) / 3;
        const ox = Math.round(px + 3 + Math.cos(angle) * 7);
        const oy = Math.round(py + 4 + Math.sin(angle) * 4);
        ctx.fillStyle = auraColor;
        ctx.fillRect(ox - 1, oy - 1, 4, 4);
        ctx.fillStyle = orbColor;
        ctx.fillRect(ox, oy, 2, 2);
        if (this.dashAvailable) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ox, oy, 1, 1);
        }
      }
    } else if (this.character.trailType === 'scarf' || this.character.trailType === 'beanie') {
      // Theo: Flowing cozy adventurer scarf with fluttering fringe tails
      const sColor = this.character.scarfColor || '#ff9f1c';
      const sShadow = this.character.scarfShadow || '#994d00';
      const sFringe = this.character.scarfFringeColor || '#ffd166';

      // 1. Shadow outline ribbon
      ctx.strokeStyle = sShadow;
      ctx.lineWidth = 3.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.scarfNodes[0].x, this.scarfNodes[0].y);
      for (let i = 1; i < this.scarfNodes.length; i++) {
        ctx.lineTo(this.scarfNodes[i].x, this.scarfNodes[i].y);
      }
      ctx.stroke();

      // 2. Main bright woven scarf body
      ctx.strokeStyle = sColor;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(this.scarfNodes[0].x, this.scarfNodes[0].y);
      for (let i = 1; i < this.scarfNodes.length; i++) {
        ctx.lineTo(this.scarfNodes[i].x, this.scarfNodes[i].y);
      }
      ctx.stroke();

      // 3. Scarf neck wrap / knot over collar
      const kx = Math.round(this.scarfNodes[0].x);
      const ky = Math.round(this.scarfNodes[0].y);
      ctx.fillStyle = sShadow;
      ctx.fillRect(kx - 1, ky - 1, 4, 3);
      ctx.fillStyle = sColor;
      ctx.fillRect(kx, ky, 3, 2);

      // 4. Fluttering fringe tassels at end of scarf
      const tx = Math.round(this.scarfNodes[2].x);
      const ty = Math.round(this.scarfNodes[2].y);
      ctx.fillStyle = sFringe;
      ctx.fillRect(tx, ty, 2, 2);
      ctx.fillRect(tx - this.facing * 1, ty + 1, 1, 1);
      ctx.fillRect(tx, ty - 1, 1, 1);
    } else if (this.character.trailType === 'phantom') {
      // Oshiro: Spectral will-o'-the-wisp ectoplasm mist
      const t = performance.now() * 0.005;
      const mistColor = this.dashAvailable ? palette.getColor(6) : palette.getColor(2);
      ctx.fillStyle = mistColor;
      for (let i = 0; i < 3; i++) {
        const node = this.hairNodes[i];
        const wobble = Math.sin(t * 3 + i * 2) * 2;
        ctx.fillRect(Math.round(node.x + wobble), Math.round(node.y + 3), 2, 2);
      }
    } else if (this.character.trailType === 'cyber') {
      // Voxel: Twin pulse-ion micro-thrusters
      const thrusterX = px + (this.facing === 1 ? -1 : 5);
      const thrusterY = py + 3;
      const ionGlow = this.dashAvailable ? palette.getColor(6) : palette.getColor(0);
      ctx.fillStyle = ionGlow;
      ctx.fillRect(thrusterX, thrusterY, 2, 3);
      if (Math.abs(this.vx) > 10 || this.vy < 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(thrusterX - this.facing * 2, thrusterY + 1, 2, 1);
      }
    } else if (this.character.trailType === 'leaves') {
      // Granny: Fluttering autumn mountain leaves swirling in the wind
      for (const leaf of this.leafParticles) {
        const lx = Math.round(leaf.x);
        const ly = Math.round(leaf.y);
        ctx.fillStyle = leaf.color;
        ctx.globalAlpha = Math.max(0, Math.min(1.0, leaf.life));
        ctx.fillRect(lx, ly, 2, 2);
        if (leaf.life > 0.4) {
          ctx.fillRect(lx + 1, ly - 1, 1, 1);
        }
      }
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();

    // Player Sprite with Squash & Stretch
    ctx.save();
    const centerX = px + this.width / 2;
    const centerY = py + this.height;

    ctx.translate(centerX, centerY);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.translate(-centerX, -centerY);

    let sprite;
    if (this.animState === 'idle') {
      sprite = this.character.sprites.idle[this.animFrame % this.character.sprites.idle.length];
    } else if (this.animState === 'run') {
      sprite = this.character.sprites.run[this.animFrame % this.character.sprites.run.length];
    } else if (this.animState === 'jump') {
      sprite = this.character.sprites.jump;
    } else if (this.animState === 'fall') {
      sprite = this.character.sprites.fall;
    } else if (this.animState === 'dash') {
      sprite = this.character.sprites.dash;
    } else if (this.animState === 'wall') {
      sprite = this.character.sprites.wall;
    }

    if (sprite) {
      let overrides = null;
      if (this.character.trailType === 'hair') {
        const hColor = this.dashAvailable ? (this.character.hairColorReady || '#ff2a55') : (this.character.hairColorSpent || '#29adff');
        const hShadow = this.dashAvailable ? (this.character.hairShadowReady || '#9e0b32') : (this.character.hairShadowSpent || '#0b4f7a');
        overrides = { 'R': hColor, 'D': hShadow };
      } else if (this.character.trailType === 'leaves') {
        const beanieColor = this.dashAvailable ? '#ffd166' : '#e09f3e';
        overrides = { 'Y': beanieColor };
      }
      drawSprite(ctx, sprite, px - 3, py - 3, palette, this.facing === -1, 1, 1.0, overrides);
    }
    ctx.restore();

    // Stamina indicator while climbing
    if (this.isClimbing && this.stamina < 2.5) {
      const staminaW = 12;
      const barW = Math.max(0, Math.round((this.stamina / this.maxStamina) * staminaW));
      ctx.fillStyle = '#000000';
      ctx.fillRect(px - 2, py - 6, staminaW + 2, 3);
      ctx.fillStyle = this.stamina < 1.0 ? '#ff2a2a' : '#ffffff';
      ctx.fillRect(px - 1, py - 5, barW, 1);
    }
  }
}
