import re

with open('src/engine/GameEngine.js', 'r', encoding='utf-8') as f:
    js = f.read()

new_defaults = '''
      shrinkTicks: 0,
      reverseAppleChance: 0,
      tornadoTicks: 0,
'''
js = js.replace('poopRocksTicks: 0,', 'poopRocksTicks: 0,' + new_defaults)

# 1. Reverse Apple Chance
eat_logic = '''
      // Remove eaten food
      this.state.foods.splice(ateFoodIndex, 1);

      // Chaos: Reverse Apple
      if (this.config.reverseAppleChance > 0 && Math.random() < this.config.reverseAppleChance) {
        this.state.snake.reverse();
        // Recalculate direction
        if (this.state.snake.length > 1) {
          const h = this.state.snake[0];
          const n = this.state.snake[1];
          // Determine step
          let dx = h.x - n.x;
          let dy = h.y - n.y;
          // Handle wrap around when calculating direction
          if (dx > 1) dx = -1;
          if (dx < -1) dx = 1;
          if (dy > 1) dy = -1;
          if (dy < -1) dy = 1;
          this.state.direction = { x: Math.sign(dx), y: Math.sign(dy) };
        }
      }

      // Spawn new foods
'''
js = re.sub(r'// Remove eaten food\s*this\.state\.foods\.splice\(ateFoodIndex, 1\);\s*// Spawn new foods', eat_logic, js)

# 2. Grid Shrink & Tornado in tick()
tick_logic = '''
    // Chaos: Grid Shrink
    if (this.config.shrinkTicks > 0 && this.state.tickCount % this.config.shrinkTicks === 0) {
      if (this.config.gridWidth > 5) {
        this.config.gridWidth--;
        this.emit('grid_change');
      }
      if (this.config.gridHeight > 5) {
        this.config.gridHeight--;
        this.emit('grid_change');
      }
    }

    // Chaos: Tornado Shuffle
    if (this.config.tornadoTicks > 0 && this.state.tickCount > 0 && this.state.tickCount % this.config.tornadoTicks === 0 && this.state.snake.length > 0) {
      const dx = Math.random() < 0.5 ? -1 : 1;
      const dy = Math.random() < 0.5 ? -1 : 1;
      for (const seg of this.state.snake) {
        seg.x += dx;
        seg.y += dy;
      }
      for (const f of this.state.foods) {
        f.x += dx;
        f.y += dy;
      }
      for (const o of this.state.obstacles) {
        o.x += dx;
        o.y += dy;
      }
    }

    if (this.state.inputQueue.length > 0) {
'''
js = js.replace('    if (this.state.inputQueue.length > 0) {', tick_logic)

with open('src/engine/GameEngine.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('GameEngine updated!')
