import re

with open('src/engine/GameEngine.js', 'r', encoding='utf-8') as f:
    js = f.read()

new_defaults = '''
      ghostAppleChance: 0,
      ghostDurationTicks: 30,
'''
js = js.replace('appleWanderChance: 0,', 'appleWanderChance: 0,' + new_defaults)

# Add ghostTicks to state
js = js.replace('shakeTicks: 0,', 'shakeTicks: 0,\n        ghostTicks: 0,')

# Spawn food logic
spawn_logic = '''
      let type = 'NORMAL';
      const r = Math.random();
      if (r < this.config.goldenAppleChance) {
        type = 'GOLDEN';
      } else if (r < this.config.goldenAppleChance + this.config.poisonAppleChance) {
        type = 'POISON';
      } else if (r < this.config.goldenAppleChance + this.config.poisonAppleChance + this.config.ghostAppleChance) {
        type = 'GHOST';
      }
'''
js = re.sub(r"      let type = 'NORMAL';\s*const r = Math\.random\(\);\s*if \(r < this\.config\.goldenAppleChance\) \{\s*type = 'GOLDEN';\s*\} else if \(r < this\.config\.goldenAppleChance \+ this\.config\.poisonAppleChance\) \{\s*type = 'POISON';\s*\}", spawn_logic, js)


# Eat food logic (Ghost duration)
eat_logic = '''
      } else if (foodType === 'POISON') {
        addedScore = this.config.scorePoison;
      } else if (foodType === 'GHOST') {
        addedScore = this.config.scoreNormal;
        this.state.ghostTicks += this.config.ghostDurationTicks;
      }
'''
js = re.sub(r"      \} else if \(foodType === 'POISON'\) \{\s*addedScore = this\.config\.scorePoison;\s*\}", eat_logic, js)

# Tick Logic (decrement ghostTicks)
js = js.replace('this.state.tickCount++;', 'this.state.tickCount++;\n    if (this.state.ghostTicks > 0) this.state.ghostTicks--;')

# Collision logic
collide_logic = '''
    const head = this.state.snake[0];
    const isGhost = this.state.ghostTicks > 0;

    // Check bounds
    if (
      head.x < 0 ||
      head.x >= this.config.gridWidth ||
      head.y < 0 ||
      head.y >= this.config.gridHeight
    ) {
      if (!this.config.wrapWalls && !this.config.invincibleWalls) {
        this.handleGameOver('WALL_COLLISION', head);
        return;
      }
    }

    // Check tail
    if (this.state.snake.length > 1) {
      const hitTailIndex = this.state.snake.findIndex((seg, idx) => idx > 0 && seg.x === head.x && seg.y === head.y);
      if (hitTailIndex !== -1 && !this.config.invincibleTail && !isGhost) {
'''
js = re.sub(r'    const head = this\.state\.snake\[0\];.*?if \(hitTailIndex !== -1 && !this\.config\.invincibleTail\) \{', collide_logic, js, flags=re.DOTALL)

with open('src/engine/GameEngine.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('GameEngine updated with Ghost logic!')
