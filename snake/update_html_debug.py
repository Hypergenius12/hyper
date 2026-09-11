import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Physics - Length Speed Mod
phys_add = '''      <label>Speedup per Apple (ms): <input type="number" id="cfg-speedup" value="0" min="0" step="any" style="width: 50px;"></label>
      <label style="margin-left: 10px;">Length Speed Mod (ms/seg): <input type="number" id="cfg-len-speed" value="0" step="any" style="width: 50px;" title="Negative = faster as you grow. Positive = slower."></label>
'''
html = html.replace('      <label>Speedup per Apple (ms): <input type="number" id="cfg-speedup" value="0" min="0" step="any" style="width: 50px;"></label>\n', phys_add)


# 2. Spawners - Apple Wander
spawn_add = '''      <label>Food Evasion Chance %: <input type="number" id="cfg-food-evade" value="0" min="0" max="100" step="any" style="width: 50px;" title="Chance per tick for food to run away"></label>
      <label style="margin-left: 10px;">Apple Wander Chance %: <input type="number" id="cfg-apple-wander" value="0" min="0" max="100" step="any" style="width: 50px;" title="Chance per tick to roam aimlessly"></label>
      <br><br>
'''
html = html.replace('      <label>Food Evasion Chance %: <input type="number" id="cfg-food-evade" value="0" min="0" max="100" step="any" style="width: 50px;" title="Chance per tick for food to run away"></label>\n      <label style="margin-left: 10px;">Score Drain per Tick:', spawn_add + '      <label>Score Drain per Tick:')

# 3. Visuals - Render Style
vis_add = '''    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">
      <summary style="cursor: pointer; margin-bottom: 10px;"><b>Visual Colors (Hex) & UI</b></summary>
      <label>Render Style: 
        <select id="cfg-render-style">
          <option value="square">Square</option>
          <option value="circle">Circle / Rounded</option>
        </select>
      </label>
      <br><br>
'''
html = html.replace('    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">\n      <summary style="cursor: pointer; margin-bottom: 10px;"><b>Visual Colors (Hex) & UI</b></summary>\n', vis_add)

# Bump version
html = re.sub(r'src="\./src/main\.js\?v=\d+"', 'src="./src/main.js?v=24"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated HTML!')
