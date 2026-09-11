import re

with open('src/engine/Renderer.js', 'r', encoding='utf-8') as f:
    js = f.read()

invert_logic = '''
    const state = this.engine.getState();
    const config = this.engine.config;
    const { ctx, canvas, cellSize } = this;
    const { gridWidth, gridHeight } = config;

    ctx.save();
    
    // Chaos: Invert Colors
    if (config.invertColorsTicks > 0) {
      const cycle = Math.floor(state.tickCount / config.invertColorsTicks);
      if (cycle % 2 === 1) {
        ctx.filter = 'invert(100%)';
      }
    }

    if (state.shakeTicks > 0) {
'''
js = js.replace('''    const state = this.engine.getState();
    const config = this.engine.config;
    const { ctx, canvas, cellSize } = this;
    const { gridWidth, gridHeight } = config;

    ctx.save();
    if (state.shakeTicks > 0) {''', invert_logic)

with open('src/engine/Renderer.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Renderer updated with invert colors!')
