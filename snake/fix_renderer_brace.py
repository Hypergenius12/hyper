import re

with open('src/engine/Renderer.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix the duplicate loop
buggy_loop = '''    // Foods
    for (const food of state.foods) {
      for (const food of state.foods) {
      let col = config.colorFoodNormal;
      if (food.type === 'GOLDEN') col = config.colorFoodGolden;
      if (food.type === 'POISON') col = config.colorFoodPoison;
      drawEntity(food.x, food.y, col);
    }'''

fixed_loop = '''    // Foods
    for (const food of state.foods) {
      let col = config.colorFoodNormal;
      if (food.type === 'GOLDEN') col = config.colorFoodGolden;
      if (food.type === 'POISON') col = config.colorFoodPoison;
      drawEntity(food.x, food.y, col);
    }'''

js = js.replace(buggy_loop, fixed_loop)

with open('src/engine/Renderer.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Renderer syntax fixed!')
