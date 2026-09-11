import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Ghost Apples to Spawners
spawn_add = '''      <label>Poison Apple Chance %: <input type="number" id="cfg-poison-pct" value="5" min="0" max="100" step="any" style="width: 50px;"></label>
      <label style="margin-left: 10px;">Ghost Apple Chance %: <input type="number" id="cfg-ghost-pct" value="0" min="0" max="100" step="any" style="width: 50px;" title="Grants invincibility to tail/walls!"></label>
      <br><br>'''
html = html.replace('      <label>Poison Apple Chance %: <input type="number" id="cfg-poison-pct" value="5" min="0" max="100" step="any" style="width: 50px;"></label>\n      <br><br>', spawn_add)

# Add Ghost Duration to Snake Mechanics
mech_add = '''      <label><input type="checkbox" id="cfg-hunger-damage"> Hunger Damage (Die instead of shrink)</label>
      <br><br>
      <label>Ghost Duration (ticks): <input type="number" id="cfg-ghost-dur" value="30" min="0" style="width: 50px;"></label>'''
html = html.replace('      <label><input type="checkbox" id="cfg-hunger-damage"> Hunger Damage (Die instead of shrink)</label>', mech_add)

# Add Fatness to Visuals
vis_add = '''      <label style="margin-left: 10px;">Snake Fatness (0.1 - 1.5): <input type="number" id="cfg-fatness" value="1.0" min="0.1" max="1.5" step="0.1" style="width: 50px;"></label>
      <br><br>'''
html = html.replace('          <option value="circle">Circle / Rounded</option>\n        </select>\n      </label>\n      <br><br>', '          <option value="circle">Circle / Rounded</option>\n        </select>\n      </label>\n' + vis_add)

# Add Color for Ghost Apple
col_add = '''      <label style="margin-left: 10px;">Poison Food: <input type="color" id="cfg-col-poison" value="#9333ea"></label>
      <label style="margin-left: 10px;">Ghost Food: <input type="color" id="cfg-col-ghost" value="#06b6d4"></label>'''
html = html.replace('      <label style="margin-left: 10px;">Poison Food: <input type="color" id="cfg-col-poison" value="#9333ea"></label>', col_add)


# Bump version
html = re.sub(r'src="\./src/main\.js\?v=\d+"', 'src="./src/main.js?v=26"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('index.html updated with Ghost mode and Fatness!')
