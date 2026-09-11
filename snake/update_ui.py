import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Strip layout divs
html = html.replace('<div class="layout-container">\n  <div class="game-panel">\n    <div id="stat-panel">', '<div id="stat-panel">')
html = html.replace('<button id="btn-restart">Restart</button>\n  </div>\n  </div>\n  <div class="settings-panel">', '<button id="btn-restart">Restart</button>\n  </div>')
html = html.replace('  </div>\n</div>\n\n  <script type="module"', '  <script type="module"')

# 2. Rename category and add new settings
old_chaos = '''    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">
      <summary style="cursor: pointer; margin-bottom: 10px;"><b>Chaos & Environmental Hazards</b></summary>
      <label>Fog of War Radius (px): <input type="number" id="cfg-fog" value="0" min="0" max="1000" style="width: 50px;" title="0 = disabled. Draws shadows outside radius"></label>
      <label style="margin-left: 10px;">Scramble Controls (ticks): <input type="number" id="cfg-scramble" value="0" min="0" style="width: 50px;" title="0 = disabled. Reverses controls every N ticks"></label>
      <br><br>
      <label>Drunk Snake Chance %: <input type="number" id="cfg-drunk" value="0" min="0" max="100" step="any" style="width: 50px;" title="Chance per tick to randomly turn"></label>
      <label style="margin-left: 10px;"><input type="checkbox" id="cfg-apple-gravity"> Black Hole Apples (Pull towards you)</label>
    </details>'''

new_chaos = '''    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">
      <summary style="cursor: pointer; margin-bottom: 10px;"><b>Chaos and Fun</b></summary>
      <label>Fog of War Radius (px): <input type="number" id="cfg-fog" value="0" min="0" max="1000" style="width: 50px;"></label>
      <label style="margin-left: 10px;">Scramble Controls (ticks): <input type="number" id="cfg-scramble" value="0" min="0" style="width: 50px;"></label>
      <br><br>
      <label>Drunk Snake Chance %: <input type="number" id="cfg-drunk" value="0" min="0" max="100" step="any" style="width: 50px;"></label>
      <label style="margin-left: 10px;"><input type="checkbox" id="cfg-apple-gravity"> Black Hole Apples (Pull towards you)</label>
      <br><br>
      <label>Apple Multiplier: <input type="number" id="cfg-apple-mult" value="1" min="1" style="width: 50px;" title="Spawns N apples when you eat one!"></label>
      <label style="margin-left: 10px;">Random Teleport (ticks): <input type="number" id="cfg-rnd-teleport" value="0" min="0" style="width: 50px;" title="0 = disabled. Warps you randomly!"></label>
      <br><br>
      <label>Poop Rocks (ticks): <input type="number" id="cfg-poop-rocks" value="0" min="0" style="width: 50px;" title="0 = disabled. Leaves obstacles out your tail"></label>
      <label style="margin-left: 10px;"><input type="checkbox" id="cfg-acid-mode"> Acid Mode (Psychedelic smears)</label>
    </details>'''

html = html.replace(old_chaos, new_chaos)

# Bump version
html = re.sub(r'src="\./src/main\.js\?v=\d+"', 'src="./src/main.js?v=22"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated HTML!')
