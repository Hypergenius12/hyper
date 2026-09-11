import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_cat = '''    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">
      <summary style="cursor: pointer; margin-bottom: 10px;"><b>Chaos & Environmental Hazards</b></summary>
      <label>Fog of War Radius (px): <input type="number" id="cfg-fog" value="0" min="0" max="1000" style="width: 50px;" title="0 = disabled. Draws shadows outside radius"></label>
      <label style="margin-left: 10px;">Scramble Controls (ticks): <input type="number" id="cfg-scramble" value="0" min="0" style="width: 50px;" title="0 = disabled. Reverses controls every N ticks"></label>
      <br><br>
      <label>Drunk Snake Chance %: <input type="number" id="cfg-drunk" value="0" min="0" max="100" step="any" style="width: 50px;" title="Chance per tick to randomly turn"></label>
      <label style="margin-left: 10px;"><input type="checkbox" id="cfg-apple-gravity"> Black Hole Apples (Pull towards you)</label>
    </details>
'''

html = html.replace('<details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">\n      <summary style="cursor: pointer; margin-bottom: 10px;"><b>Visual Colors (Hex) & UI</b></summary>', new_cat + '\n    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">\n      <summary style="cursor: pointer; margin-bottom: 10px;"><b>Visual Colors (Hex) & UI</b></summary>')

html = re.sub(r'src="\./src/main\.js\?v=\d+"', 'src="./src/main.js?v=21"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated HTML!')
