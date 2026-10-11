// Celeste Engine Core - Main Game Loop, Camera Scrolling & Coordinator

import { PaletteManager } from './palettes.js';
import { sfx } from './audio.js';
import { SPRITES, drawPixelText, measurePixelText, drawSprite } from './sprites.js';
import { ParticleSystem, ScreenShake } from './particles.js';
import { Player } from './player.js';
import { Level, LEVEL_DATA, getTotalStrawberries } from './levels.js';
import { Background } from './background.js';
import { CharacterManager, CHARACTERS } from './characters.js';
import { GamepadManager } from './gamepad.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.palette = new PaletteManager();
    this.characters = new CharacterManager();
    this.particles = new ParticleSystem();
    this.screenShake = new ScreenShake();
    this.background = new Background();
    this.gamepad = new GamepadManager(this);

    this.onPaletteChanged = null;
    this.palette.onPaletteChanged = (cur) => {
      if (this.onPaletteChanged) this.onPaletteChanged(cur);
    };

    // Camera with smooth tracking
    this.camera = { x: 0, y: 0 };

    // Keyboard input state (separated from merged input)
    this.keyboardInput = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      jumpPressed: false,
      dash: false,
      dashPressed: false,
      climb: false
    };

    // Merged input state (keyboard + gamepad)
    this.input = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      jumpPressed: false,
      dash: false,
      dashPressed: false,
      climb: false,
      analogX: 0,
      analogY: 0
    };

    // Game state: 'title', 'playing', 'room_transition', 'victory'
    this.state = 'title';

    // Levels & Player
    this.level = new Level(0);
    this.palette.setBiome(this.level.biome);
    this.player = new Player(this.level.spawnX, this.level.spawnY, this.characters.getCurrent());
    this.player.reset(this.level.spawnX, this.level.spawnY, this.level);
    this.player.onHaptic = (type) => this.handleHaptic(type);

    // Stats
    this.deaths = 0;
    this.timer = 0;
    this.roomTimer = 0;
    this.timerRunning = false;
    this.totalBerriesCount = getTotalStrawberries();

    this.doppelgangerEnabled = false;
    try {
      this.doppelgangerEnabled = (localStorage.getItem('seleste_doppelganger') ?? localStorage.getItem('celeste_doppelganger')) === 'true';
    } catch (_) {}
    this.playerHistory = [];
    this.activeDoppelganger = null;
    this.doppelgangerActive = false;
    this.restartHolding = false;
    this.restartHoldTimer = 0;

    this.speedrunHUD = true;
    try {
      this.speedrunHUD = (localStorage.getItem('seleste_speedrun_hud') ?? localStorage.getItem('celeste_speedrun_hud')) !== 'false';
    } catch (_) {}

    // Completed level rooms set
    this.completedRooms = new Set();
    try {
      const savedCompleted = localStorage.getItem('seleste_completed_rooms');
      if (savedCompleted) {
        JSON.parse(savedCompleted).forEach(idx => this.completedRooms.add(idx));
      }
    } catch (_) {}

    // Transition state
    this.transitionAlpha = 0;
    this.transitionDir = 0;
    this.nextRoomIdx = 0;

    // Victory
    this.victoryTimer = 0;
    this.confettiTimer = 0;
    this.hitstopTimer = 0;

    // Timing
    this.lastTime = performance.now();

    this.setupInputs();
    this.startLoop();
  }

  toggleDoppelganger() {
    this.doppelgangerEnabled = !this.doppelgangerEnabled;
    try {
      localStorage.setItem('seleste_doppelganger', this.doppelgangerEnabled ? 'true' : 'false');
    } catch (_) {}
    this.playerHistory = [];
    this.activeDoppelganger = null;
    return this.doppelgangerEnabled;
  }

  toggleSpeedrunHUD() {
    this.speedrunHUD = !this.speedrunHUD;
    try {
      localStorage.setItem('seleste_speedrun_hud', this.speedrunHUD ? 'true' : 'false');
    } catch (_) {}
    return this.speedrunHUD;
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      // Ignore game inputs when typing in text fields
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyZ', 'KeyX', 'KeyC'].includes(e.code)) {
        e.preventDefault();
      }

      sfx.ensureContext();

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keyboardInput.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keyboardInput.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keyboardInput.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keyboardInput.down = true;

      if (e.code === 'Space' || e.code === 'KeyZ') {
        if (!this.keyboardInput.jump) this.keyboardInput.jumpPressed = true;
        this.keyboardInput.jump = true;

        if (this.state === 'title') {
          this.startGame();
        } else if (this.state === 'victory' && this.victoryTimer > 2.0) {
          this.restartGame();
        }
      }

      if (e.code === 'KeyX' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ') {
        if (!this.keyboardInput.dash) this.keyboardInput.dashPressed = true;
        this.keyboardInput.dash = true;
      }

      if (e.code === 'KeyC' || e.code === 'KeyK') {
        this.keyboardInput.climb = true;
      }

      if (e.code === 'KeyR' && this.state === 'playing') {
        if (!this.player.dead) {
          this.player.kill(this.particles, this.screenShake, (t) => this.freeze(t));
        }
      }

      if (e.code === 'KeyV') {
        this.cycleCharacter();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keyboardInput.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keyboardInput.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keyboardInput.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keyboardInput.down = false;

      if (e.code === 'Space' || e.code === 'KeyZ') this.keyboardInput.jump = false;
      if (e.code === 'KeyX' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ') this.keyboardInput.dash = false;
      if (e.code === 'KeyC' || e.code === 'KeyK') this.keyboardInput.climb = false;
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      sfx.ensureContext();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      if (this.state === 'title') {
        if (clickX >= 100 && clickX <= 220 && clickY >= 62 && clickY <= 96) {
          sfx.playClick();
          this.startGame();
        } else if (clickX >= 100 && clickX <= 220 && clickY >= 98 && clickY <= 118) {
          sfx.playClick();
          if (this.onOpenChapterSelect) this.onOpenChapterSelect();
        } else if (clickX >= 80 && clickX <= 240 && clickY >= 119 && clickY <= 132) {
          sfx.playClick();
          if (this.onOpenRosterSelect) {
            this.onOpenRosterSelect();
          } else {
            this.cycleCharacter();
          }
        }
      } else if (this.state === 'victory' && this.victoryTimer > 1.5) {
        if (clickX >= 100 && clickX <= 220 && clickY >= 120 && clickY <= 150) {
          sfx.playClick();
          this.restartGame();
        }
      }
    });
  }

  startGame() {
    this.state = 'playing';
    this.timerRunning = true;
    this.roomTimer = 0;
    this.playerHistory = [];
    this.activeDoppelganger = null;
    sfx.playJump();
    sfx.setBiome(this.level.biome);
    this.palette.setBiome(this.level.biome);
    this.player.reset(this.level.spawnX, this.level.spawnY, this.level);
    this.particles.emitBerryCollect(160, 90);
  }

  warpToLevel(roomIndex) {
    if (roomIndex < 0 || roomIndex >= LEVEL_DATA.length) return;
    this.state = 'playing';
    this.timerRunning = true;
    this.roomTimer = 0;
    this.playerHistory = [];
    this.activeDoppelganger = null;
    this.nextRoomIdx = roomIndex;
    this.level.loadRoom(roomIndex);
    this.totalBerriesCount = getTotalStrawberries();
    this.player.reset(this.level.spawnX, this.level.spawnY, this.level);
    this.camera.x = Math.max(0, Math.min(this.level.width - 320, this.player.x - 160));
    this.camera.y = Math.max(0, Math.min(this.level.height - 180, this.player.y - 90));
    this.particles.clear();
    sfx.playWarp();
    sfx.setBiome(this.level.biome);
    this.palette.setBiome(this.level.biome);
  }

  restartGame() {
    if (this.level && this.level.isCustomPlaytest && this.currentCustomRoom) {
      this.playtestCustomLevel(this.currentCustomRoom);
      return;
    }
    this.deaths = 0;
    this.timer = 0;
    this.roomTimer = 0;
    this.playerHistory = [];
    this.activeDoppelganger = null;
    this.timerRunning = true;
    this.level = new Level(0);
    this.totalBerriesCount = getTotalStrawberries();
    this.player = new Player(this.level.spawnX, this.level.spawnY, this.characters.getCurrent());
    this.player.reset(this.level.spawnX, this.level.spawnY, this.level);
    this.player.onHaptic = (type) => this.handleHaptic(type);
    this.state = 'playing';
    this.victoryTimer = 0;
    this.particles.clear();
    sfx.setBiome(this.level.biome);
    this.palette.setBiome(this.level.biome);
  }

  selectCharacter(id) {
    const char = this.characters.select(id);
    if (char) {
      this.player.setCharacter(char);
      this.particles.emitHeroSwap(this.player.x + 3, this.player.y + 4, char.name);
      sfx.playWarp();
      if (this.onCharacterChanged) this.onCharacterChanged(char);
    }
  }

  cycleCharacter() {
    const char = this.characters.next();
    this.player.setCharacter(char);
    this.particles.emitHeroSwap(this.player.x + 3, this.player.y + 4, char.name);
    sfx.playJump();
    if (this.onCharacterChanged) this.onCharacterChanged(char);
  }

  markRoomCompleted(roomIdx) {
    this.completedRooms.add(roomIdx);
    try {
      localStorage.setItem('seleste_completed_rooms', JSON.stringify(Array.from(this.completedRooms)));
      if (this.completedRooms.size >= LEVEL_DATA.length) {
        localStorage.setItem('seleste_editor_unlocked', 'true');
        window.dispatchEvent(new CustomEvent('editorUnlocked'));
      }
    } catch (_) {}
  }

  nextRoom() {
    if (this.state === 'room_transition') return;
    if (this.level.isCustomPlaytest) {
      sfx.playVictory();
      this.particles.emitBerryCollect(this.player.x, this.player.y);
      this.particles.addFloater('CUSTOM LEVEL COMPLETE!', this.player.x - 30, this.player.y - 10, 8);
      this.triggerVictory();
      return;
    }
    this.markRoomCompleted(this.level.currentRoomIndex);
    this.nextRoomIdx = this.level.currentRoomIndex + 1;
    if (this.nextRoomIdx >= LEVEL_DATA.length) {
      this.triggerVictory();
      return;
    }
    this.state = 'room_transition';
    this.transitionDir = 1;
    this.transitionAlpha = 0;
  }

  freeze(duration) {
    this.hitstopTimer = Math.max(this.hitstopTimer, duration);
  }

  handleHaptic(type) {
    if (!this.gamepad) return;
    switch (type) {
      case 'dash':    this.gamepad.vibrate(70,  0.5, 0.8); break;
      case 'death':   this.gamepad.vibrate(300, 0.8, 1.0); break;
      case 'spring':  this.gamepad.vibrate(120, 0.3, 0.6); break;
      case 'berry':   this.gamepad.vibrate(60,  0.2, 0.4); break;
      case 'heart':   this.gamepad.vibrate(500, 0.6, 0.9); break;
      case 'feather': this.gamepad.vibrate(200, 0.3, 0.6); break;
      default:        this.gamepad.vibrate(50,  0.2, 0.3); break;
    }
  }

  triggerVictory() {
    if (!this.level.isCustomPlaytest) {
      this.markRoomCompleted(this.level.currentRoomIndex);
    }
    this.state = 'victory';
    this.timerRunning = false;
    this.victoryTimer = 0;
    sfx.playVictory();
    this.screenShake.add(4);

    try {
      localStorage.setItem('seleste_editor_unlocked', 'true');
      window.dispatchEvent(new CustomEvent('editorUnlocked'));
    } catch (_) {}
  }

  playtestCustomLevel(customRoom) {
    this.currentCustomRoom = customRoom;
    this.level.loadCustomRoom(customRoom);
    this.player.reset(this.level.spawnX, this.level.spawnY, this.level);
    this.camera.x = Math.max(0, Math.min(this.level.width - 320, this.player.x - 160));
    this.camera.y = Math.max(0, Math.min(this.level.height - 180, this.player.y - 90));
    this.particles.clear();
    sfx.playWarp();
    sfx.setBiome(this.level.biome);
    this.palette.setBiome(this.level.biome);
    this.state = 'playing';
    this.timerRunning = true;
    this.roomTimer = 0;
    this.playerHistory = [];
    this.activeDoppelganger = null;
    this.doppelgangerActive = false;
  }

  startLoop() {
    const loop = (currentTime) => {
      const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
      this.lastTime = currentTime;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    // Poll gamepad and merge with keyboard input every frame
    const gpInput = this.gamepad.poll();

    this.input.left  = this.keyboardInput.left  || gpInput.left;
    this.input.right = this.keyboardInput.right || gpInput.right;
    this.input.up    = this.keyboardInput.up    || gpInput.up;
    this.input.down  = this.keyboardInput.down  || gpInput.down;
    this.input.jump  = this.keyboardInput.jump  || gpInput.jump;
    this.input.dash  = this.keyboardInput.dash  || gpInput.dash;
    this.input.climb = this.keyboardInput.climb || gpInput.climb;
    this.input.jumpPressed  = this.keyboardInput.jumpPressed  || gpInput.jumpPressed;
    this.input.dashPressed  = this.keyboardInput.dashPressed  || gpInput.dashPressed;
    this.input.analogX = gpInput.analogX;
    this.input.analogY = gpInput.analogY;

    // Gamepad shortcuts: Start/A on title → start game; on victory → restart
    if (gpInput.startPressed || (gpInput.jumpPressed && this.state === 'title')) {
      if (this.state === 'title') {
        sfx.ensureContext();
        this.startGame();
      } else if (this.state === 'victory' && this.victoryTimer > 2.0) {
        this.restartGame();
      }
    }

    // Gamepad shortcut: Select/Back/R3 → restart room (kill player)
    if (gpInput.restartPressed && this.state === 'playing' && !this.player.dead) {
      this.player.kill(this.particles, this.screenShake, (t) => this.freeze(t));
    }

    // Gamepad shortcut: L3 → cycle character
    if (gpInput.cyclePressed) {
      this.cycleCharacter();
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      // Still clear pressed flags so they don't queue up during hitstop
      this.keyboardInput.jumpPressed = false;
      this.keyboardInput.dashPressed = false;
      return;
    }

    if (this.timerRunning) {
      this.timer += dt;
      this.roomTimer += dt;
    }

    this.background.update(dt);
    this.particles.update(dt);
    this.screenShake.update(dt);

    if (this.state === 'title') {
      this.player.update(dt, { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, dash: false, dashPressed: false, climb: false }, this.level, this.particles, this.screenShake, (t) => this.freeze(t));
      this.camera.x = 0;
      this.camera.y = 0;
    } else if (this.state === 'playing') {
      this.level.update(
        dt,
        this.player,
        this.particles,
        this.screenShake,
        () => this.nextRoom(),
        () => this.triggerVictory(),
        (t) => this.freeze(t),
        (type) => this.handleHaptic(type)
      );

      this.player.update(dt, this.input, this.level, this.particles, this.screenShake, (t) => this.freeze(t));

      // Mirror Doppelganger (Badeline Shadow Chaser with Spawn Safety)
      if (this.doppelgangerEnabled && !this.player.dead) {
        const distFromSpawn = Math.hypot(this.player.x - this.level.spawnX, this.player.y - this.level.spawnY);
        if (!this.doppelgangerActive && distFromSpawn > 24) {
          this.doppelgangerActive = true;
        }

        if (this.doppelgangerActive) {
          this.playerHistory.push({
            x: this.player.x,
            y: this.player.y,
            facing: this.player.facing,
            animState: this.player.animState,
            animFrame: this.player.animFrame,
            scaleX: this.player.scaleX,
            scaleY: this.player.scaleY,
            hairNodes: this.player.hairNodes.map(h => ({ x: h.x, y: h.y }))
          });

          // ~66 frame delay (approx 1.1s behind player)
          if (this.playerHistory.length > 66) {
            this.activeDoppelganger = this.playerHistory.shift();

            const pCenterX = this.player.x + this.player.width / 2;
            const pCenterY = this.player.y + this.player.height / 2;
            const gCenterX = this.activeDoppelganger.x + this.player.width / 2;
            const gCenterY = this.activeDoppelganger.y + this.player.height / 2;
            const dist = Math.hypot(pCenterX - gCenterX, pCenterY - gCenterY);

            // Proximity tension audio
            if (dist < 28 && dist > 11 && Math.random() < 0.05) {
              sfx.playDoppelgangerWarning();
            }

            // Deadly shadow contact only when outside spawn safe zone
            if (dist < 8 && distFromSpawn > 20) {
              this.player.kill(this.particles, this.screenShake, (t) => this.freeze(t));
              this.particles.emitDeathBurst(gCenterX, gCenterY);
              this.playerHistory = [];
              this.activeDoppelganger = null;
              this.doppelgangerActive = false;
            }
          }
        }
      }

      // Respawn handling
      if (this.player.dead && this.player.respawnTimer <= 0) {
        this.deaths++;
        this.player.reset(this.level.spawnX, this.level.spawnY, this.level);
        this.particles.emitDustPuff(this.level.spawnX + 4, this.level.spawnY + 8, 6, 0, 8);
        this.playerHistory = [];
        this.activeDoppelganger = null;
        this.doppelgangerActive = false;
        this.restartHolding = false;
        this.restartHoldTimer = 0;
      }

      // Smooth Camera Tracking with Room Boundaries
      const targetCamX = Math.max(0, Math.min(this.level.width - 320, this.player.x + this.player.width / 2 - 160));
      const targetCamY = Math.max(0, Math.min(this.level.height - 180, this.player.y + this.player.height / 2 - 90));
      this.camera.x += (targetCamX - this.camera.x) * Math.min(1.0, 10 * dt);
      this.camera.y += (targetCamY - this.camera.y) * Math.min(1.0, 10 * dt);

    } else if (this.state === 'room_transition') {
      if (this.transitionDir === 1) {
        this.transitionAlpha += dt * 2.8;
        if (this.transitionAlpha >= 1) {
          this.transitionAlpha = 1;
          this.level.loadRoom(this.nextRoomIdx);
          this.totalBerriesCount = getTotalStrawberries();
          this.roomTimer = 0;
          this.playerHistory = [];
          this.activeDoppelganger = null;
          sfx.setBiome(this.level.biome);
          this.palette.setBiome(this.level.biome);
          this.player.reset(this.level.spawnX, this.level.spawnY, this.level);
          this.camera.x = Math.max(0, Math.min(this.level.width - 320, this.player.x - 160));
          this.camera.y = Math.max(0, Math.min(this.level.height - 180, this.player.y - 90));
          this.transitionDir = -1;
        }
      } else {
        this.transitionAlpha -= dt * 2.8;
        if (this.transitionAlpha <= 0) {
          this.transitionAlpha = 0;
          this.state = 'playing';
        }
      }
    } else if (this.state === 'victory') {
      this.victoryTimer += dt;
      this.confettiTimer += dt;
      if (this.confettiTimer > 0.07) {
        this.confettiTimer = 0;
        const col = Math.floor(Math.random() * 9);
        this.particles.emit(
          Math.random() * 320,
          -5,
          (Math.random() - 0.5) * 50,
          40 + Math.random() * 70,
          col,
          2.5,
          Math.random() > 0.5 ? 2 : 1,
          25
        );
      }
    }

    this.keyboardInput.jumpPressed = false;
    this.keyboardInput.dashPressed = false;
  }

  render() {
    const ctx = this.ctx;
    const p = this.palette;

    ctx.save();

    // 1. Parallax Multi-Biome Background (Rendered in screen coordinates)
    this.background.render(ctx, p, this.camera.x, this.camera.y, this.level.biome);

    // 2. World Space Elements (Offset by Camera & Screen Shake)
    ctx.save();
    const camRenderX = Math.round(this.camera.x) - this.screenShake.x;
    const camRenderY = Math.round(this.camera.y) - this.screenShake.y;
    ctx.translate(-camRenderX, -camRenderY);

    // Level Tiles & Entities
    this.level.render(ctx, p);

    // Badeline Mirror Doppelganger (Authentic shadow twin sprite with ethereal aura)
    if (this.doppelgangerEnabled && this.activeDoppelganger) {
      const gx = Math.round(this.activeDoppelganger.x);
      const gy = Math.round(this.activeDoppelganger.y);
      const facing = this.activeDoppelganger.facing || 1;
      const bChar = CHARACTERS.find(c => c.id === 'badeline');

      ctx.save();

      // 1. Ethereal dark magenta & violet pulse aura
      const auraPulse = 0.25 + Math.sin(performance.now() * 0.008) * 0.12;
      ctx.fillStyle = '#ff0055';
      ctx.globalAlpha = auraPulse;
      ctx.beginPath();
      ctx.arc(gx + 4, gy + 5, 11, 0, Math.PI * 2);
      ctx.fill();

      // 2. Swirling shadow ether orbs around Badeline
      ctx.globalAlpha = 0.9;
      const t = performance.now() * 0.008;
      for (let i = 0; i < 3; i++) {
        const angle = t + (i * Math.PI * 2) / 3;
        const ox = Math.round(gx + 3 + Math.cos(angle) * 8);
        const oy = Math.round(gy + 4 + Math.sin(angle) * 5);
        ctx.fillStyle = '#7b2cbf';
        ctx.fillRect(ox - 1, oy - 1, 4, 4);
        ctx.fillStyle = '#29ffb6';
        ctx.fillRect(ox, oy, 2, 2);
      }

      // 3. Ethereal flowing hair nodes in emerald green
      if (this.activeDoppelganger.hairNodes) {
        for (let i = 0; i < this.activeDoppelganger.hairNodes.length; i++) {
          const hn = this.activeDoppelganger.hairNodes[i];
          const hx = Math.round(hn.x);
          const hy = Math.round(hn.y);
          ctx.fillStyle = '#0f4c3a';
          ctx.fillRect(hx - 1, hy - 1, 4, 4);
          ctx.fillStyle = '#29ffb6';
          ctx.fillRect(hx, hy, 2, 2);
        }
      }

      // 4. Render Badeline's animated character sprite
      if (bChar && bChar.sprites) {
        const animState = this.activeDoppelganger.animState || 'run';
        const animFrame = this.activeDoppelganger.animFrame || 0;
        let s;
        if (animState === 'idle') {
          s = bChar.sprites.idle[animFrame % bChar.sprites.idle.length];
        } else if (animState === 'run') {
          s = bChar.sprites.run[animFrame % bChar.sprites.run.length];
        } else if (animState === 'jump') {
          s = bChar.sprites.jump;
        } else if (animState === 'fall') {
          s = bChar.sprites.fall;
        } else if (animState === 'dash') {
          s = bChar.sprites.dash;
        } else if (animState === 'wall') {
          s = bChar.sprites.wall;
        } else {
          s = bChar.sprites.idle[0];
        }

        if (s) {
          ctx.save();
          // Squash & stretch if present
          if (this.activeDoppelganger.scaleX && this.activeDoppelganger.scaleY) {
            const centerX = gx + 4;
            const centerY = gy + 8;
            ctx.translate(centerX, centerY);
            ctx.scale(this.activeDoppelganger.scaleX, this.activeDoppelganger.scaleY);
            ctx.translate(-centerX, -centerY);
          }
          // Draw authentic Badeline sprite
          drawSprite(ctx, s, gx - 3, gy - 3, p, facing === -1, 1, 0.95);
          ctx.restore();
        }
      }

      ctx.restore();
    }

    // Player
    this.player.render(ctx, p);

    // Particles
    this.particles.render(ctx, p);

    ctx.restore();

    // 3. Screen Space HUD
    if (this.state === 'playing' || this.state === 'room_transition') {
      this.renderHUD(ctx, p);
    }

    // 4. Title Screen Overlay (Big Pixel Art Play Button)
    if (this.state === 'title') {
      this.renderTitleOverlay(ctx, p);
    }

    // 5. Victory Screen Overlay
    if (this.state === 'victory') {
      this.renderVictoryOverlay(ctx, p);
    }

    // 6. Smooth Circular Iris Wipe & Crossfade Screen Transition
    if (this.state === 'room_transition' && this.transitionAlpha > 0) {
      ctx.save();

      // Smooth cosine easing on alpha curve for seamless cinematic feel
      const easedT = (1 - Math.cos(this.transitionAlpha * Math.PI)) * 0.5;

      const focusX = (this.transitionDir === 1)
        ? Math.round(this.player.x + 5 - this.camera.x)
        : Math.round(this.level.spawnX + 5 - this.camera.x);
      const focusY = (this.transitionDir === 1)
        ? Math.round(this.player.y + 6 - this.camera.y)
        : Math.round(this.level.spawnY + 6 - this.camera.y);

      const maxRadius = 240;
      const radius = Math.max(0, (1 - easedT) * maxRadius);

      // 1. Iris mask hole
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.rect(0, 0, 320, 180);
      ctx.arc(focusX, focusY, radius, 0, Math.PI * 2, true);
      ctx.fill();

      // 2. Glowing cyan aperture ring along iris boundary
      if (radius > 4 && radius < maxRadius - 4) {
        ctx.strokeStyle = '#29ffb6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(focusX, focusY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Ambient soft crossfade shading over entire viewport
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = easedT * 0.35;
      ctx.fillRect(0, 0, 320, 180);

      ctx.restore();
    }

    ctx.restore();
  }

  renderHUD(ctx, p) {
    // Room Toast Notification
    if (this.level.roomTitleTimer > 0) {
      const alpha = Math.min(1.0, this.level.roomTitleTimer);
      ctx.save();
      ctx.globalAlpha = alpha;
      const room = LEVEL_DATA[this.level.currentRoomIndex];
      const titleW = measurePixelText(room.name, 1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(160 - titleW / 2 - 8, 12, titleW + 16, 13);
      ctx.fillStyle = p.getColor(4);
      ctx.strokeRect(160 - titleW / 2 - 8, 12, titleW + 16, 13);
      drawPixelText(ctx, room.name, 160 - titleW / 2, 15, '#ffffff', 1);
      ctx.restore();
    }

    // Top-left Strawberries
    drawSprite(ctx, SPRITES.strawberry[0], 5, 5, p, false, 1);
    drawPixelText(ctx, `${this.level.collectedBerries.size}/${this.totalBerriesCount}`, 19, 6, '#ffffff', 1);

    // Secret Crystal Heart indicator
    if (this.level.collectedHeart) {
      drawSprite(ctx, SPRITES.heart[0], 46, 5, p, false, 0.8);
    }

    // Deaths
    const deathX = this.level.collectedHeart ? 62 : 48;
    ctx.fillStyle = p.getColor(5);
    ctx.fillRect(deathX, 7, 4, 4);
    ctx.fillRect(deathX + 1, 11, 2, 2);
    drawPixelText(ctx, `D:${this.deaths}`, deathX + 7, 6, p.getColor(7), 1);

    // Room tally
    if (this.level.isCustomPlaytest) {
      drawPixelText(ctx, `CUSTOM: ${(this.level.name || 'LEVEL').toUpperCase()}`, deathX + 38, 6, p.getColor(6), 1);
    } else {
      drawPixelText(ctx, `ROOM ${this.level.currentRoomIndex + 1}/${LEVEL_DATA.length}`, deathX + 38, 6, p.getColor(6), 1);
    }

    // Top-right Speedrun Timer
    const mins = Math.floor(this.timer / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.timer % 60).toString().padStart(2, '0');
    const ms = Math.floor((this.timer % 1) * 100).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}.${ms}`;
    const timeW = measurePixelText(timeStr, 1);
    drawPixelText(ctx, timeStr, 320 - timeW - 8, 6, '#ffffff', 1);

    // Speedrun Splits HUD Overlay (#19)
    if (this.speedrunHUD) {
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = 0.72;
      ctx.fillRect(6, 142, 108, 32);
      ctx.fillStyle = p.getColor(4);
      ctx.strokeRect(6, 142, 108, 32);
      ctx.globalAlpha = 1.0;

      const roomSecs = Math.floor(this.roomTimer).toString().padStart(2, '0');
      const roomMs = Math.floor((this.roomTimer % 1) * 100).toString().padStart(2, '0');
      drawPixelText(ctx, `ROOM: ${roomSecs}.${roomMs}s`, 10, 146, p.getColor(7), 1);

      drawPixelText(ctx, `RUN:  ${mins}:${secs}.${ms}`, 10, 155, '#ffffff', 1);

      const splitStatus = `D:${this.deaths}`;
      drawPixelText(ctx, splitStatus, 10, 164, p.getColor(5), 1);
      ctx.restore();
    }

    // Bottom-right Dash Diamond Indicator
    const dashReady = this.player.dashAvailable;
    const dashColor = dashReady ? '#ffffff' : p.getColor(2);
    ctx.fillStyle = dashColor;
    ctx.fillRect(308, 168, 4, 4);
    ctx.fillRect(306, 170, 8, 2);
    ctx.fillRect(308, 172, 4, 2);
  }

  renderTitleOverlay(ctx, p) {
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.65;
    ctx.fillRect(0, 0, 320, 180);
    ctx.globalAlpha = 1.0;

    // Title: SELESTE
    const title = 'SELESTE';
    const titleW = measurePixelText(title, 2);
    drawPixelText(ctx, title, 160 - titleW / 2 + 1, 19, '#000000', 2);
    drawPixelText(ctx, title, 160 - titleW / 2, 18, '#ffffff', 2);

    const sub = '40-CHAPTER SUMMIT EXPEDITION';
    const subW = measurePixelText(sub, 1);
    drawPixelText(ctx, sub, 160 - subW / 2, 38, p.getColor(7), 1);

    // ---------------------------------------------------------
    // THE BIG PIXEL ART PLAY BUTTON
    // ---------------------------------------------------------
    const btnX = 105;
    const btnY = 56;
    const btnW = 110;
    const btnH = 32;

    const bob = Math.sin(performance.now() * 0.005) * 1.5;
    const by = Math.round(btnY + bob);

    ctx.fillStyle = '#000000';
    ctx.fillRect(btnX + 3, by + 4, btnW, btnH);
    ctx.fillStyle = p.getColor(2);
    ctx.fillRect(btnX, by, btnW, btnH);
    ctx.fillStyle = p.getColor(4);
    ctx.fillRect(btnX + 2, by + 2, btnW - 4, btnH - 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(btnX + 2, by + 2, btnW - 4, 2);
    ctx.fillRect(btnX + 2, by + 2, 2, btnH - 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(btnX + 2, by + btnH - 6, btnW - 4, 2);
    ctx.fillRect(btnX + btnW - 4, by + 2, 2, btnH - 6);

    const triX = btnX + 24;
    const triY = by + 9;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(triX + i * 2, triY + i, 2, 12 - i * 2);
    }
    drawPixelText(ctx, 'PLAY', btnX + 46, by + 8, '#ffffff', 2);

    // ---------------------------------------------------------
    // CHAPTER SELECT BUTTON
    // ---------------------------------------------------------
    const cBtnX = 105;
    const cBtnY = 96;
    const cBtnW = 110;
    const cBtnH = 22;

    ctx.fillStyle = '#000000';
    ctx.fillRect(cBtnX + 2, cBtnY + 3, cBtnW, cBtnH);
    ctx.fillStyle = p.getColor(3);
    ctx.fillRect(cBtnX, cBtnY, cBtnW, cBtnH);
    ctx.fillStyle = p.getColor(1);
    ctx.fillRect(cBtnX + 2, cBtnY + 2, cBtnW - 4, cBtnH - 4);
    ctx.fillStyle = p.getColor(5);
    ctx.fillRect(cBtnX + 2, cBtnY + 2, cBtnW - 4, 1);
    drawPixelText(ctx, 'MAP CHAPTERS', cBtnX + 16, cBtnY + 8, '#ffffff', 1);

    // Active Hero Tag
    const curHero = this.characters.getCurrent();
    const heroTag = `HERO: ${curHero.name.toUpperCase()} (PRESS V)`;
    drawPixelText(ctx, heroTag, 160 - measurePixelText(heroTag, 1) / 2, 122, p.getColor(8), 1);

    // Controls Legend Banner
    const isPad = this.gamepad && this.gamepad.connected;
    const ctrl1 = isPad ? 'PAD: STICK/D-PAD: MOVE   A: JUMP' : 'ARROWS/WASD: MOVE   Z/SPACE: JUMP';
    const ctrl2 = isPad ? 'X/B/RB: DASH   Y/LB: CLIMB   L3: HERO' : 'X/SHIFT: DASH   C: CLIMB   V: HERO';
    const c1W = measurePixelText(ctrl1, 1);
    const c2W = measurePixelText(ctrl2, 1);
    const maxW = Math.max(c1W, c2W);

    ctx.fillStyle = '#000000';
    ctx.fillRect(160 - maxW / 2 - 8, 132, maxW + 16, 26);
    ctx.fillStyle = isPad ? '#00ffaa' : p.getColor(4);
    ctx.strokeRect(160 - maxW / 2 - 8, 132, maxW + 16, 26);

    drawPixelText(ctx, ctrl1, 160 - c1W / 2, 136, '#ffffff', 1);
    drawPixelText(ctx, ctrl2, 160 - c2W / 2, 146, isPad ? '#00ffaa' : p.getColor(7), 1);
  }

  renderVictoryOverlay(ctx, p) {
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, 0, 320, 180);
    ctx.globalAlpha = 1.0;

    const boxX = 50;
    const boxY = 16;
    const boxW = 220;
    const boxH = 148;

    ctx.fillStyle = p.getColor(1);
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.fillStyle = '#ffffff';
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    const title = this.level.isCustomPlaytest ? 'CUSTOM LEVEL CONQUERED!' : 'SUMMIT 4000M CONQUERED!';
    const tW = measurePixelText(title, 1);
    drawPixelText(ctx, title, 160 - tW / 2, 26, '#ffffff', 1);

    const mins = Math.floor(this.timer / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.timer % 60).toString().padStart(2, '0');
    const ms = Math.floor((this.timer % 1) * 100).toString().padStart(2, '0');
    const timeStr = `TIME: ${mins}:${secs}.${ms}`;
    const berriesStr = `STRAWBERRIES: ${this.level.collectedBerries.size} / ${this.totalBerriesCount}`;
    const deathsStr = `DEATHS: ${this.deaths}`;
    const heartStr = this.level.collectedHeart ? 'CRYSTAL HEART: [FOUND]' : 'CRYSTAL HEART: [MISSED]';

    drawPixelText(ctx, berriesStr, 62, 44, '#ffffff', 1);
    drawPixelText(ctx, heartStr, 62, 56, this.level.collectedHeart ? '#ffffff' : p.getColor(2), 1);
    drawPixelText(ctx, deathsStr, 62, 68, p.getColor(7), 1);
    drawPixelText(ctx, timeStr, 62, 80, '#ffffff', 1);

    let rank = 'A';
    if (this.deaths <= 25 && this.level.collectedBerries.size >= 30 && this.level.collectedHeart) rank = 'S+';
    else if (this.level.collectedBerries.size >= 20 || this.level.collectedHeart) rank = 'S';
    else if (this.deaths > 80) rank = 'B';
    drawPixelText(ctx, `RANK: ${rank}`, 62, 94, '#ffffff', 1);

    const rX = 100;
    const rY = 120;
    const rW = 120;
    const rH = 26;

    ctx.fillStyle = p.getColor(3);
    ctx.fillRect(rX, rY, rW, rH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rX + 1, rY + 1, rW - 2, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(rX + 1, rY + rH - 3, rW - 2, 2);

    const playAgain = (this.gamepad && this.gamepad.connected) ? 'PLAY AGAIN [A / Z]' : 'PLAY AGAIN [Z]';
    const pW = measurePixelText(playAgain, 1);
    drawPixelText(ctx, playAgain, 160 - pW / 2, rY + 9, '#ffffff', 1);
  }
}
