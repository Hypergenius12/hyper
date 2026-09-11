import re

with open('src/engine/GameEngine.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add config defaults
js = js.replace('autoPilotAssist: false, // NEW', 'autoPilotAssist: false, // NEW\n      screenShake: false,\n      hungerDamage: false,')
js = js.replace('foodEvasionChance: 0, // New!', 'foodEvasionChance: 0, // New!\n      teleportingAppleChance: 0,')

# Add hungerDamage logic
new_decay = '''    if (this.config.tailDecayTicks > 0 && this.state.ticksSinceLastEat > this.config.tailDecayTicks) {
      if (this.config.hungerDamage) {
        this.handleGameOver('STARVED', this.state.snake[0]);
        return;
      } else if (this.state.snake.length > 1) {
        this.state.snake.pop();
        this.state.ticksSinceLastEat = 0;
      } else {
        this.handleGameOver('STARVED', this.state.snake[0]);
        return;
      }
    }'''
js = re.sub(r'    if \(this\.config\.tailDecayTicks > 0 && this\.state\.ticksSinceLastEat > this\.config\.tailDecayTicks\) \{.*?(?=    // Check food counts)', new_decay + '\n', js, flags=re.DOTALL)

# Add Teleporting Apple logic
teleport_logic = '''
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
    }'''
js = js.replace('// Food Evasion Logic (Runaway apples)', teleport_logic + '\n\n    // Food Evasion Logic (Runaway apples)')

# Add Screen shake emit. The Renderer can just hook it. Wait, the Renderer doesn't know when things happen except tick? 
# The engine emits 'eat', 'collision', 'gameover'. The Renderer doesn't listen to that directly in its renderLoop. 
# It's better if `GameEngine` has `state.shakeTicks = X` and tick decrements it, and the Renderer offsets the canvas if shakeTicks > 0.
js = js.replace('score: 0,', 'score: 0,\n      shakeTicks: 0,')

# When eaten:
js = js.replace("this.emit('eat',", "if (this.config.screenShake) this.state.shakeTicks = 3;\n        this.emit('eat',")
# When game over
js = js.replace("this.emit('gameover',", "if (this.config.screenShake) this.state.shakeTicks = 8;\n    this.emit('gameover',")

# Tick decrement
js = js.replace('this.state.tickCount++;', 'this.state.tickCount++;\n    if (this.state.shakeTicks > 0) this.state.shakeTicks--;')

with open('src/engine/GameEngine.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('GameEngine updated!')
