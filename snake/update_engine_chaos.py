import re

with open('src/engine/GameEngine.js', 'r', encoding='utf-8') as f:
    js = f.read()

new_defaults = '''
      appleMultiplier: 1,
      randomTeleportTicks: 0,
      poopRocksTicks: 0,
'''
js = js.replace('appleGravity: false,', 'appleGravity: false,' + new_defaults)

# 1. Apple Multiplier
eat_logic = '''
      // Remove eaten food
      this.state.foods.splice(ateFoodIndex, 1);
      
      // Spawn new foods (Apple Multiplier)
      const mult = this.config.appleMultiplier || 1;
      for (let i = 0; i < mult; i++) {
        this.spawnFood();
      }
'''
js = re.sub(r'// Remove eaten food\s*this\.state\.foods\.splice\(ateFoodIndex, 1\);\s*this\.spawnFood\(\);', eat_logic, js)

# 2. Random Teleport (in tick(), right before input queue processing)
teleport_logic = '''
    // Chaos: Random Teleport
    if (this.config.randomTeleportTicks > 0 && this.state.tickCount % this.config.randomTeleportTicks === 0 && this.state.snake.length > 0) {
      const np = this.getRandomEmptyCell();
      if (np) {
        this.state.snake[0].x = np.x;
        this.state.snake[0].y = np.y;
      }
    }
'''
js = js.replace('    if (this.state.inputQueue.length > 0) {', teleport_logic + '\n    if (this.state.inputQueue.length > 0) {')

# 3. Poop Rocks (in tick(), right after tail logic)
poop_logic = '''
    // Chaos: Poop Rocks
    if (this.config.poopRocksTicks > 0 && this.state.tickCount % this.config.poopRocksTicks === 0 && this.state.snake.length > 0) {
      const tail = this.state.snake[this.state.snake.length - 1];
      if (this.isCellEmpty(tail.x, tail.y)) {
        this.state.obstacles.push({ x: tail.x, y: tail.y });
      }
    }
'''
js = js.replace('// Collision Detection', poop_logic + '\n    // Collision Detection')

with open('src/engine/GameEngine.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('GameEngine updated!')
