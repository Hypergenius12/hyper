import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_chaos_settings = '''      <label>Poop Rocks (ticks): <input type="number" id="cfg-poop-rocks" value="0" min="0" style="width: 50px;" title="0 = disabled. Leaves obstacles out your tail"></label>
      <label style="margin-left: 10px;"><input type="checkbox" id="cfg-acid-mode"> Acid Mode (Psychedelic smears)</label>
      <br><br>
      <label>Grid Shrink (ticks): <input type="number" id="cfg-shrink" value="0" min="0" style="width: 50px;" title="0 = disabled. Battle Royale mode!"></label>
      <label style="margin-left: 10px;">Reverse Apple Chance %: <input type="number" id="cfg-rev-apple" value="0" min="0" max="100" step="any" style="width: 50px;"></label>
      <br><br>
      <label>Tornado Shuffle (ticks): <input type="number" id="cfg-tornado" value="0" min="0" style="width: 50px;" title="0 = disabled. Scrambles board!"></label>
      <label style="margin-left: 10px;">Invert Colors (ticks): <input type="number" id="cfg-invert-cols" value="0" min="0" style="width: 50px;"></label>'''

html = re.sub(r'      <label>Poop Rocks \(ticks\):.*?</label>\s*<label.*?</label>', new_chaos_settings, html, flags=re.DOTALL)

# Bump version
html = re.sub(r'src="\./src/main\.js\?v=\d+"', 'src="./src/main.js?v=23"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated index.html!')
