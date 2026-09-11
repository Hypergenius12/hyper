export class GameEngine {
  constructor(config = {}) {
    this.config = {
      // Geometry & Physics
      gridWidth: 20,
      gridHeight: 20,
      tickRateMs: 120,
      speedUpMs: 0,
      wrapWalls: false,
      ghostWalls: false,
      explodingAppleChance: 0,

      invincibleWalls: false,
      bouncyWalls: false, // New!
      invincibleTail: false,
      invertControls: false,
      allow180: false, // New!
      winScore: 0,
      randomSpawn: false,
      autoStart: false,
      autoPilotAssist: false, // NEW
      screenShake: false,
      hungerDamage: false,
      fogOfWarRadius: 0,
      scrambleInterval: 0,
      drunkChance: 0,
      appleGravity: false,
      appleMultiplier: 1,
      randomTeleportTicks: 0,
      poopRocksTicks: 0,
      shrinkTicks: 0,
      reverseAppleChance: 0,
      tornadoTicks: 0,
      lengthSpeedMod: 0,
      appleWanderChance: 0,
      ghostAppleChance: 0,
      ghostDurationTicks: 30,

      renderStyle: 'square',





      // Mechanics
      initialLength: 3,
      maxSnakeLength: 0, // New! (0 = disabled)
      growthPerFood: 1,
      tailDecayTicks: 0,
      tailChop: false, // NEW
      dropFoodOnChop: false, // NEW
      scoreDrainTick: 0, // NEW
      
      // Spawners & Scoring
      foodSpawnCount: 1,
      goldenAppleChance: 0.05,
      poisonAppleChance: 0.05,
      foodLifespan: 0,
      poisonLifespan: 0, // NEW
      foodEvasionChance: 0, // New!
      teleportingAppleChance: 0,
      spoilageTicks: 0, // NEW
      scoreNormal: 10,
      scoreGolden: 50,
      scorePoison: -50,
      poisonClearsObstacles: false, // New!
      
      obstacleCount: 0,
      obstacleSpawnChance: 0.0,
      obstacleWanderChance: 0.0, // NEW
      invisibleObstacles: false, // New!

      // Visuals / Colors
      showGrid: true,
      rainbowMode: false, // NEW
      colorBg: '#ffffff',
      colorGrid: '#eeeeee',
      colorSnakeHead: '#15803d',
      colorSnakeBody: '#22c55e',
      colorFoodNormal: '#dc2626',
      colorFoodGolden: '#fbbf24',
      colorFoodPoison: '#9333ea',
      colorObstacle: '#64748b',

      ...config
    };

    this.events = new Map();
    this.modifiers = [];
    this.timerId = null;
    this.inputQueue = [];

    this.reset();
  }

  reset(newConfig = null) {
    if (newConfig) {
      this.config = { ...this.config, ...newConfig };
    }

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.inputQueue = [];
    this.currentTickRate = this.config.tickRateMs;

    let startX = Math.floor(this.config.gridWidth / 2);
    let startY = Math.floor(this.config.gridHeight / 2);

    if (this.config.randomSpawn) {
      startX = Math.floor(Math.random() * this.config.gridWidth);
      startY = Math.floor(Math.random() * this.config.gridHeight);
    }

    this.state = {
      status: 'IDLE', // 'IDLE' | 'RUNNING' | 'PAUSED' | 'GAME_OVER'
      tickCount: 0,
      score: 0,
      shakeTicks: 0,
        ghostTicks: 0,
      snake: [],
      direction: { x: 1, y: 0 },
      foods: [],
      obstacles: [],
      growthBuffer: 0,
      ticksSinceLastEat: 0
    };

    for (let i = 0; i < this.config.initialLength; i++) {
      let sx = startX - i;
      if (this.config.wrapWalls) {
        sx = (sx + this.config.gridWidth) % this.config.gridWidth;
      }
      this.state.snake.push({ x: sx, y: startY });
    }

    this.spawnObstacles();
    this.spawnFood();
    
    this.emit('reset', this.getState());
    this.emit('stateChange', this.state.status);

    if (this.config.autoStart) {
      setTimeout(() => this.start(), 0);
    }
  }

  updateConfig(newConfig) {
    if (newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
    this.emit('configChange', this.config);
  }

  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(handler);
    return () => this.events.get(event)?.delete(handler);
  }

  emit(event, data) {
    const handlers = this.events.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in event handler '${event}':`, err);
        }
      }
    }
  }

  addModifier(modifier) {
    this.modifiers.push(modifier);
    this.modifiers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    if (modifier.onInit) modifier.onInit(this);
  }

  removeModifier(id) {
    this.modifiers = this.modifiers.filter(m => m.id !== id);
  }

  setDirection(directionName) {
    if (this.config.scrambleInterval > 0) {
      const period = Math.floor(this.state.tickCount / this.config.scrambleInterval);
      if (period % 2 === 1) { // Every odd period, scramble!
        const scrambleMap = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT' };
        directionName = scrambleMap[directionName] || directionName;
      }
    }

    const DIRS = {
      'UP': { x: 0, y: -1 },
      'DOWN': { x: 0, y: 1 },
      'LEFT': { x: -1, y: 0 },
      'RIGHT': { x: 1, y: 0 }
    };

    let targetDir = DIRS[directionName];
    if (!targetDir) return;

    if (this.config.invertControls) {
      targetDir = { x: -targetDir.x, y: -targetDir.y };
    }

    if (this.state.status === 'GAME_OVER' || this.state.status === 'VICTORY') {
      this.reset();
      this.state.direction = targetDir;
      this.start();
      return;
    }

    if (this.state.status === 'IDLE') {
      this.state.direction = targetDir;
      this.start();
      return;
    }

    const lastDir = this.inputQueue.length > 0 
      ? this.inputQueue[this.inputQueue.length - 1] 
      : this.state.direction;

    if (!this.config.allow180 && targetDir.x + lastDir.x === 0 && targetDir.y + lastDir.y === 0) {
      return;
    }

    if (targetDir.x === lastDir.x && targetDir.y === lastDir.y) {
      return;
    }

    if (this.inputQueue.length < 2) {
      this.inputQueue.push(targetDir);
    }
  }

  start() {
    if (this.state.status === 'RUNNING') return;
    if (this.state.status === 'GAME_OVER') {
      this.reset();
    }

    this.state.status = 'RUNNING';
    this.emit('stateChange', this.state.status);

    this.timerId = setInterval(() => this.tick(), this.currentTickRate);
  }

  pause() {
    if (this.state.status !== 'RUNNING') return;
    clearInterval(this.timerId);
    this.timerId = null;
    this.state.status = 'PAUSED';
    this.emit('stateChange', this.state.status);
  }

  resume() {
    if (this.state.status !== 'PAUSED') return;
    this.state.status = 'RUNNING';
    this.emit('stateChange', this.state.status);
    this.timerId = setInterval(() => this.tick(), this.currentTickRate);
  }

  togglePause() {
    if (this.state.status === 'RUNNING') {
      this.pause();
    } else if (this.state.status === 'PAUSED' || this.state.status === 'IDLE') {
      this.start();
    } else if (this.state.status === 'GAME_OVER' || this.state.status === 'VICTORY') {
      this.reset();
      this.start();
    }
  }

  step() {
    if (this.state.status === 'RUNNING') {
      this.pause();
    }
    this.tick();
  }

  isCellEmpty(x, y) {
    if (x < 0 || x >= this.config.gridWidth || y < 0 || y >= this.config.gridHeight) return false;
    for (const s of this.state.snake) if (s.x === x && s.y === y) return false;
    for (const f of this.state.foods) if (f.x === x && f.y === y) return false;
    for (const o of this.state.obstacles) if (o.x === x && o.y === y) return false;
    return true;
  }

  tick() {
    if (this.state.status === 'GAME_OVER' || this.state.status === 'VICTORY') return;

    for (const mod of this.modifiers) {
      if (mod.beforeTick) mod.beforeTick(this.state, this);
    }

    // Chaos: Grid Shrink (Battle Royale)
    if (this.config.shrinkTicks > 0 && this.state.tickCount > 0 && this.state.tickCount % this.config.shrinkTicks === 0) {
      if (this.config.gridWidth > 5) {
        this.config.gridWidth--;
        this.emit('grid_change');
      }
      if (this.config.gridHeight > 5) {
        this.config.gridHeight--;
        this.emit('grid_change');
      }
      // Purge out-of-bounds entities
      if (this.state.snake.length > 0) {
        const h = this.state.snake[0];
        if (h.x >= this.config.gridWidth || h.y >= this.config.gridHeight) {
          this.handleGameOver('ZONE_ELIMINATION', h);
          return;
        }
      }
      this.state.foods = this.state.foods.filter(f => f.x < this.config.gridWidth && f.y < this.config.gridHeight);
      this.state.obstacles = this.state.obstacles.filter(o => o.x < this.config.gridWidth && o.y < this.config.gridHeight);
    }

    // Chaos: Tornado Shuffle
    if (this.config.tornadoTicks > 0 && this.state.tickCount > 0 && this.state.tickCount % this.config.tornadoTicks === 0 && this.state.snake.length > 0) {
      const dx = Math.random() < 0.5 ? -1 : 1;
      const dy = Math.random() < 0.5 ? -1 : 1;
      const wrapOrClamp = (obj) => {
        obj.x += dx;
        obj.y += dy;
        if (this.config.wrapWalls) {
          if (obj.x < 0) obj.x = this.config.gridWidth - 1;
          if (obj.x >= this.config.gridWidth) obj.x = 0;
          if (obj.y < 0) obj.y = this.config.gridHeight - 1;
          if (obj.y >= this.config.gridHeight) obj.y = 0;
        } else {
          obj.x = Math.max(0, Math.min(this.config.gridWidth - 1, obj.x));
          obj.y = Math.max(0, Math.min(this.config.gridHeight - 1, obj.y));
        }
      };
      for (const seg of this.state.snake) wrapOrClamp(seg);
      for (const f of this.state.foods) wrapOrClamp(f);
      for (const o of this.state.obstacles) wrapOrClamp(o);
    }

    // Chaos: Poop Rocks
    if (this.config.poopRocksTicks > 0 && this.state.tickCount > 0 && this.state.tickCount % this.config.poopRocksTicks === 0 && this.state.snake.length > 0) {
      const tail = this.state.snake[this.state.snake.length - 1];
      const hasObstacle = this.state.obstacles.some(o => o.x === tail.x && o.y === tail.y);
      const hasFood = this.state.foods.some(f => f.x === tail.x && f.y === tail.y);
      if (!hasObstacle && !hasFood) {
        this.state.obstacles.push({ x: tail.x, y: tail.y });
      }
    }

    // Chaos: Random Teleport
    if (this.config.randomTeleportTicks > 0 && this.state.tickCount > 0 && this.state.tickCount % this.config.randomTeleportTicks === 0 && this.state.snake.length > 0) {
      const empty = this.getRandomEmptyCell();
      if (empty) {
        this.state.snake[0].x = empty.x;
        this.state.snake[0].y = empty.y;
      }
    }

    // Chaos: Drunk Snake
    if (this.config.drunkChance > 0 && Math.random() < this.config.drunkChance) {
      const perpDirs = [
        { x: this.state.direction.y, y: -this.state.direction.x },
        { x: -this.state.direction.y, y: this.state.direction.x }
      ];
      this.state.direction = perpDirs[Math.floor(Math.random() * perpDirs.length)];
    }

    if (this.inputQueue.length > 0) {
      this.state.direction = this.inputQueue.shift();
    }

    this.state.tickCount++;
    if (this.state.ghostTicks > 0) this.state.ghostTicks--;
    if (this.state.shakeTicks > 0) this.state.shakeTicks--;
    this.state.ticksSinceLastEat++;
    
    // Score Drain
    if (this.config.scoreDrainTick > 0) {
      this.state.score -= this.config.scoreDrainTick;
    }

    
    
    // Chaos: Apple Gravity
    if (this.config.appleGravity && this.state.tickCount % 2 === 0 && this.state.snake.length > 0) {
      const head = this.state.snake[0];
      for (const f of this.state.foods) {
        const dx = Math.sign(head.x - f.x);
        const dy = Math.sign(head.y - f.y);
        // Only pull on one axis per tick to allow diagonal-like curving
        if (dx !== 0 && this.isCellEmpty(f.x + dx, f.y)) f.x += dx;
        else if (dy !== 0 && this.isCellEmpty(f.x, f.y + dy)) f.y += dy;
      }
    }

    // Teleporting Apples
    if (this.config.teleportingAppleChance > 0) {
      for (const f of this.state.foods) {
        if (Math.random() < this.config.teleportingAppleChance) {
          const np = this.getRandomEmptyCell();
          if (np) {
            f.x = np.x;
            f.y = np.y;
          }
        }
      }
    }


    // Wandering Apples
    if (this.config.appleWanderChance > 0) {
      for (const f of this.state.foods) {
        if (Math.random() < this.config.appleWanderChance) {
          const dirs = [{x:0,y:1},{x:0,y:-1},{x:1,y:0},{x:-1,y:0}];
          const d = dirs[Math.floor(Math.random() * dirs.length)];
          const nx = f.x + d.x;
          const ny = f.y + d.y;
          if (this.isCellEmpty(nx, ny) && nx >= 0 && nx < this.config.gridWidth && ny >= 0 && ny < this.config.gridHeight) {
            f.x = nx;
            f.y = ny;
          }
        }
      }
    }

    // Food Evasion Logic (Runaway apples)
    if (this.config.foodEvasionChance > 0) {
      for (const f of this.state.foods) {
        if (Math.random() < this.config.foodEvasionChance) {
          const dx = this.state.snake[0].x - f.x;
          const dy = this.state.snake[0].y - f.y;
          let nx = f.x;
          let ny = f.y;
          // Move away from the largest axis of distance
          if (Math.abs(dx) > Math.abs(dy)) {
            nx += dx > 0 ? -1 : 1;
          } else {
            ny += dy > 0 ? -1 : 1;
          }
          if (this.isCellEmpty(nx, ny)) {
            f.x = nx;
            f.y = ny;
          }
        }
      }
    }

    // Food Spoilage
    if (this.config.spoilageTicks > 0) {
      for (const f of this.state.foods) {
        if (f.type === 'NORMAL' && (this.state.tickCount - f.spawnTick) >= this.config.spoilageTicks) {
          f.type = 'POISON';
          f.spawnTick = this.state.tickCount; // Reset spawn tick so poisonLifespan can start counting from when it rotted
        }
      }
    }

    // Poison Lifespan
    if (this.config.poisonLifespan > 0) {
      const prevCount = this.state.foods.length;
      this.state.foods = this.state.foods.filter(f => 
        !(f.type === 'POISON' && (this.state.tickCount - f.spawnTick) >= this.config.poisonLifespan)
      );
      if (this.state.foods.length < prevCount) {
        this.spawnFood();
      }
    }

    if (this.config.foodLifespan > 0) {
      const prevCount = this.state.foods.length;
      this.state.foods = this.state.foods.filter(f => 
        !(f.type === 'NORMAL' && (this.state.tickCount - f.spawnTick) >= this.config.foodLifespan)
      );
      if (this.state.foods.length < prevCount) {
        this.spawnFood();
      }
    }

    if (this.config.obstacleSpawnChance > 0 && Math.random() < this.config.obstacleSpawnChance) {
      const emptyCells = this.getEmptyCells();
      if (emptyCells.length > 0) {
        this.state.obstacles.push(emptyCells[Math.floor(Math.random() * emptyCells.length)]);
      }
    }
    
    // Wandering Obstacles
    if (this.config.obstacleWanderChance > 0) {
      for (const obs of this.state.obstacles) {
        if (Math.random() < this.config.obstacleWanderChance) {
          const opts = [
            { x: obs.x + 1, y: obs.y }, { x: obs.x - 1, y: obs.y },
            { x: obs.x, y: obs.y + 1 }, { x: obs.x, y: obs.y - 1 }
          ];
          const valid = opts.filter(o => this.isCellEmpty(o.x, o.y) && o.x >= 0 && o.x < this.config.gridWidth && o.y >= 0 && o.y < this.config.gridHeight);
          if (valid.length > 0) {
            const pick = valid[Math.floor(Math.random() * valid.length)];
            obs.x = pick.x;
            obs.y = pick.y;
          }
        }
      }
    }

    const head = this.state.snake[0];
    let isHalted = (this.state.direction.x === 0 && this.state.direction.y === 0);
    
    // Auto Pilot Assist (Avoid Walls / Obstacles)
    if (this.config.autoPilotAssist && !isHalted) {
      let nx = head.x + this.state.direction.x;
      let ny = head.y + this.state.direction.y;
      
      let willCrash = false;
      if (!this.config.wrapWalls && (nx < 0 || nx >= this.config.gridWidth || ny < 0 || ny >= this.config.gridHeight)) willCrash = true;
      if (!willCrash && this.state.obstacles.some(o => o.x === nx && o.y === ny)) willCrash = true;
      
      if (willCrash) {
        // Evaluate turning 90 degrees left or right
        const options = [
          { x: this.state.direction.y, y: -this.state.direction.x },
          { x: -this.state.direction.y, y: this.state.direction.x }
        ];
        
        for (const opt of options) {
          let tx = head.x + opt.x;
          let ty = head.y + opt.y;
          let crash = false;
          if (!this.config.wrapWalls && (tx < 0 || tx >= this.config.gridWidth || ty < 0 || ty >= this.config.gridHeight)) crash = true;
          if (!crash && this.state.obstacles.some(o => o.x === tx && o.y === ty)) crash = true;
          if (!crash) {
            this.state.direction = opt;
            break;
          }
        }
      }
    }

    let newHead = {
      x: head.x + this.state.direction.x,
      y: head.y + this.state.direction.y
    };

    if (!isHalted) {
      let collidedWithWall = false;
      if (newHead.x < 0 || newHead.x >= this.config.gridWidth ||
          newHead.y < 0 || newHead.y >= this.config.gridHeight) {
        if (this.config.wrapWalls || (this.config.ghostWalls && this.state.ghostTicks > 0)) {
          newHead.x = (newHead.x + this.config.gridWidth) % this.config.gridWidth;
          newHead.y = (newHead.y + this.config.gridHeight) % this.config.gridHeight;
        } else {
          collidedWithWall = true;
        }
      }

      if (collidedWithWall) {
        if (this.config.bouncyWalls) {
          // Reverse direction instantly and clear inputs
          this.state.direction = { x: -this.state.direction.x, y: -this.state.direction.y };
          newHead = { x: head.x + this.state.direction.x, y: head.y + this.state.direction.y };
          this.inputQueue = []; // Prevent conflicting rapid inputs
        } else if (this.config.invincibleWalls) {
          this.state.direction = { x: 0, y: 0 };
          isHalted = true;
        } else {
          this.handleGameOver('WALL_COLLISION', newHead);
          return;
        }
      }
    }

    if (!isHalted) {
      const hitObstacle = this.state.obstacles.some(o => o.x === newHead.x && o.y === newHead.y);
      if (hitObstacle) {
        if (this.config.invincibleWalls) {
          this.state.direction = { x: 0, y: 0 };
          isHalted = true;
        } else {
          this.handleGameOver('OBSTACLE_COLLISION', newHead);
          return;
        }
      }
    }

    if (!isHalted) {
      const isGrowing = this.state.growthBuffer > 0;
      const bodyToCheck = isGrowing 
        ? this.state.snake 
        : this.state.snake.slice(0, -1);

      const hitSelfIndex = bodyToCheck.findIndex(seg => seg.x === newHead.x && seg.y === newHead.y);
      if (hitSelfIndex !== -1 && !this.config.invincibleTail) {
        if (this.config.tailChop) {
          // Sever the tail
          const chopped = this.state.snake.splice(hitSelfIndex);
          if (this.config.dropFoodOnChop) {
            for (const piece of chopped) {
              this.state.foods.push({ x: piece.x, y: piece.y, type: 'NORMAL', spawnTick: this.state.tickCount });
            }
          }
        } else {
          this.handleGameOver('SELF_COLLISION', newHead);
          return;
        }
      }
      
      this.state.snake.unshift(newHead);

      let ateFoodIndex = -1;
      for (let i = 0; i < this.state.foods.length; i++) {
        if (newHead.x === this.state.foods[i].x && newHead.y === this.state.foods[i].y) {
          ateFoodIndex = i;
          break;
        }
      }

      if (ateFoodIndex !== -1) {
        const eatenFood = this.state.foods[ateFoodIndex];
        this.state.ticksSinceLastEat = 0;
        
        let spedUp = false;

        if (eatenFood.type === 'NORMAL') {
          this.state.score += this.config.scoreNormal;
          this.state.growthBuffer += this.config.growthPerFood;
          spedUp = true;
         } else if (eatenFood.type === 'GOLDEN') {
          this.state.score += this.config.scoreGolden;
          this.state.growthBuffer += (this.config.growthPerFood * 3);
          spedUp = true;
        } else if (eatenFood.type === 'GHOST') {
          this.state.score += this.config.scoreNormal;
          this.state.growthBuffer += this.config.growthPerFood;
          this.state.ghostTicks += this.config.ghostDurationTicks;
          spedUp = true;
        } else if (eatenFood.type === 'POISON') {
          this.state.score += this.config.scorePoison;
          this.state.growthBuffer -= 3;
          if (this.config.poisonClearsObstacles) {
            this.state.obstacles = [];
          }
        }

        // Handle Max Snake Length Cap
        if (this.config.maxSnakeLength > 0) {
          const projectedLen = this.state.snake.length + this.state.growthBuffer;
          if (projectedLen > this.config.maxSnakeLength) {
            this.state.growthBuffer = Math.max(0, this.config.maxSnakeLength - this.state.snake.length);
          }
        }

        const foodType = eatenFood.type;
        this.state.foods.splice(ateFoodIndex, 1);

        // Chaos: Reverse Apple
        if (this.config.reverseAppleChance > 0 && Math.random() < this.config.reverseAppleChance) {
          this.state.snake.reverse();
          if (this.state.snake.length > 1) {
            const rh = this.state.snake[0];
            const rn = this.state.snake[1];
            let rdx = rh.x - rn.x;
            let rdy = rh.y - rn.y;
            if (rdx > 1) rdx = -1; else if (rdx < -1) rdx = 1;
            if (rdy > 1) rdy = -1; else if (rdy < -1) rdy = 1;
            this.state.direction = { x: Math.sign(rdx), y: Math.sign(rdy) };
          }
        }

        // Chaos: Apple Multiplier
        if (this.config.appleMultiplier > 1) {
          for (let m = 1; m < this.config.appleMultiplier; m++) {
            this.spawnFood();
          }
        }
        // Chaos: Exploding Apples
        if (this.config.explodingAppleChance > 0 && Math.random() < this.config.explodingAppleChance) {
          const ex = newHead.x;
          const ey = newHead.y;
          this.state.obstacles = this.state.obstacles.filter(o => Math.abs(o.x - ex) > 1 || Math.abs(o.y - ey) > 1);
          let severIndex = -1;
          for (let i = 1; i < this.state.snake.length; i++) {
            const seg = this.state.snake[i];
            if (Math.abs(seg.x - ex) <= 1 && Math.abs(seg.y - ey) <= 1) {
              severIndex = i;
              break;
            }
          }
          if (severIndex !== -1) {
            this.state.snake.splice(severIndex);
            if (this.config.screenShake) this.state.shakeTicks += 5;
          }
        }

        
        if (spedUp && this.config.speedUpMs > 0 && this.currentTickRate > 10) {
          this.currentTickRate = Math.max(10, this.currentTickRate - this.config.speedUpMs);
          if (this.state.status === 'RUNNING') {
            clearInterval(this.timerId);
            this.timerId = setInterval(() => this.tick(), this.currentTickRate);
          }
        }

        if (this.config.screenShake) this.state.shakeTicks = 3;
        this.emit('eat', {
          type: foodType,
          food: eatenFood,
          score: this.state.score,
          length: this.state.snake.length
        });

        // Win Condition
        if (this.config.winScore > 0 && this.state.score >= this.config.winScore) {
          this.handleVictory();
          return;
        }

        this.spawnFood();
      }

      while (this.state.growthBuffer < 0) {
        if (this.state.snake.length > 1) {
          this.state.snake.pop();
          this.state.growthBuffer++;
        } else {
          this.state.growthBuffer = 0;
          this.handleGameOver('STARVED', this.state.snake[0]);
          return;
        }
      }

      if (this.state.growthBuffer > 0) {
        this.state.growthBuffer--;
      } else if (ateFoodIndex === -1) {
        this.state.snake.pop();
      }
    }

    if (this.config.tailDecayTicks > 0 && this.state.ticksSinceLastEat > this.config.tailDecayTicks) {
      if (this.state.snake.length > 1) {
        this.state.snake.pop();
        this.state.ticksSinceLastEat = 0;
      } else {
        this.handleGameOver('STARVED', this.state.snake[0]);
        return;
      }
    }

    for (const mod of this.modifiers) {
      if (mod.afterTick) mod.afterTick(this.state, this);
    }

    this.emit('tick', this.getState());
  }

  getEmptyCells() {
    const occupied = new Set();
    for (const s of this.state.snake) occupied.add(`${s.x},${s.y}`);
    for (const f of this.state.foods) occupied.add(`${f.x},${f.y}`);
    for (const o of this.state.obstacles) occupied.add(`${o.x},${o.y}`);

    const emptyCells = [];
    for (let x = 0; x < this.config.gridWidth; x++) {
      for (let y = 0; y < this.config.gridHeight; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }
    return emptyCells;
  }

  spawnObstacles() {
    if (this.config.obstacleCount <= 0) return;
    
    for (let i = 0; i < this.config.obstacleCount; i++) {
      const emptyCells = this.getEmptyCells();
      if (emptyCells.length === 0) break;
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      this.state.obstacles.push(emptyCells[randomIndex]);
    }
  }

  spawnFood() {
    while (this.state.foods.length < this.config.foodSpawnCount) {
      const emptyCells = this.getEmptyCells();
      if (emptyCells.length === 0) break;

      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const cell = emptyCells[randomIndex];
      
      let type = 'NORMAL';
      const rand = Math.random();
      if (rand < this.config.goldenAppleChance) {
        type = 'GOLDEN';
      } else if (rand < this.config.goldenAppleChance + this.config.poisonAppleChance) {
        type = 'POISON';
      } else if (rand < this.config.goldenAppleChance + this.config.poisonAppleChance + (this.config.ghostAppleChance || 0)) {
        type = 'GHOST';
      }

      const newFood = { x: cell.x, y: cell.y, type, spawnTick: this.state.tickCount };
      this.state.foods.push(newFood);
      this.emit('foodSpawned', newFood);
    }

    if (this.state.foods.length === 0 && this.getEmptyCells().length === 0) {
      this.emit('victory', this.getState());
      this.handleGameOver('VICTORY', this.state.snake[0]);
      return;
    }
  }


  getRandomEmptyCell() {
    const cells = this.getEmptyCells();
    if (cells.length === 0) return null;
    return cells[Math.floor(Math.random() * cells.length)];
  }

  handleVictory() {
    this.state.status = 'VICTORY';
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.inputQueue = [];
    this.emit('victory');
    this.emit('stateChange', this.state.status);
  }

  handleGameOver(reason, position) {
    this.state.status = 'GAME_OVER';
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.inputQueue = [];
    this.emit('collision', { reason, position });
    this.emit('gameOver', {
      reason,
      score: this.state.score,
      ticks: this.state.tickCount,
      length: this.state.snake.length
    });
    this.emit('stateChange', this.state.status);
  }

  getState() {
    return {
      status: this.state.status,
      tickCount: this.state.tickCount,
      score: this.state.score,
      shakeTicks: this.state.shakeTicks,
      ghostTicks: this.state.ghostTicks,
      snake: this.state.snake.map(s => ({ ...s })),
      direction: { ...this.state.direction },
      foods: this.state.foods.map(f => ({ ...f })),
      obstacles: this.state.obstacles.map(o => ({ ...o })),
      growthBuffer: this.state.growthBuffer,
      ticksSinceLastEat: this.state.ticksSinceLastEat,
      currentTickRate: this.currentTickRate,
      config: { ...this.config }
    };
  }
}
