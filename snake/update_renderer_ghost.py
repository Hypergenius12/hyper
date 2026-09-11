import re

with open('src/engine/Renderer.js', 'r', encoding='utf-8') as f:
    js = f.read()

fatness_logic = '''
    const drawEntity = (x, y, color, scale = 1.0) => {
      ctx.fillStyle = color;
      const size = cellSize * scale;
      const offset = (cellSize - size) / 2;
      
      if (config.renderStyle === 'circle') {
        ctx.beginPath();
        ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x * cellSize + offset, y * cellSize + offset, size, size);
      }
    };
'''
js = re.sub(r'    const drawEntity = \(x, y, color\) => \{.*?    \};', fatness_logic, js, flags=re.DOTALL)


food_draw = '''    // Foods
    for (const food of state.foods) {
      let col = config.colorFoodNormal;
      if (food.type === 'GOLDEN') col = config.colorFoodGolden;
      else if (food.type === 'POISON') col = config.colorFoodPoison;
      else if (food.type === 'GHOST') col = config.colorFoodGhost || '#06b6d4';
      drawEntity(food.x, food.y, col);
    }
'''
js = re.sub(r'    // Foods\s*for \(const food of state\.foods\) \{.*?    \}', food_draw, js, flags=re.DOTALL)


snake_draw = '''    // Snake
    if (state.ghostTicks > 0) ctx.globalAlpha = 0.5;
    const fatness = config.snakeFatness || 1.0;
    
    state.snake.forEach((seg, idx) => {
      let col;
      if (config.rainbowMode) {
        const hue = (state.tickCount * 5 + idx * -10) % 360;
        col = `hsl(${hue}, 100%, 50%)`;
      } else {
        col = idx === 0 ? config.colorSnakeHead : config.colorSnakeBody;
      }
      drawEntity(seg.x, seg.y, col, fatness);
    });
    ctx.globalAlpha = 1.0;
'''
js = re.sub(r'    // Snake\s*state\.snake\.forEach.*?\}\);\n', snake_draw + '\n', js, flags=re.DOTALL)

with open('src/engine/Renderer.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Renderer updated with fatness and ghost logic!')
