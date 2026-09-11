import re

with open('src/engine/GameEngine.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Config defaults
new_defaults = '''
      fogOfWarRadius: 0,
      scrambleInterval: 0,
      drunkChance: 0,
      appleGravity: false,
'''
js = js.replace('hungerDamage: false,', 'hungerDamage: false,' + new_defaults)

# Add Drunk logic in tick() right before processing input queue
drunk_logic = '''
    // Chaos: Drunk Snake
    if (this.config.drunkChance > 0 && Math.random() < this.config.drunkChance) {
      const turns = this.state.direction.x !== 0 
          ? [{x:0, y:1}, {x:0, y:-1}] 
          : [{x:1, y:0}, {x:-1, y:0}];
      const rndTurn = turns[Math.floor(Math.random() * turns.length)];
      this.state.direction = rndTurn;
      this.state.inputQueue = []; // clear user inputs to force the stumble
    }
'''
js = js.replace('    if (this.state.inputQueue.length > 0) {', drunk_logic + '\n    if (this.state.inputQueue.length > 0) {')

# Add Apple Gravity logic in tick() right before teleporting apples
gravity_logic = '''
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
'''
js = js.replace('// Teleporting Apples', gravity_logic + '\n    // Teleporting Apples')

with open('src/engine/GameEngine.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('GameEngine updated!')
