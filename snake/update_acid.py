import re

with open('src/engine/Renderer.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add acid mode to Renderer
acid_logic = '''
    // Background (Acid mode skips clear to smear!)
    if (!config.acidMode) {
      ctx.fillStyle = config.colorBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (state.tickCount === 0) {
      // Just clear once on start for acid mode
      ctx.fillStyle = config.colorBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
'''

js = re.sub(r'\s*// Background\s*ctx\.fillStyle = config\.colorBg;\s*ctx\.fillRect\(0, 0, canvas\.width, canvas\.height\);', acid_logic, js)

with open('src/engine/Renderer.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Renderer updated for Acid Mode!')
