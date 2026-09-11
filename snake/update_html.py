import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_mods_html = '''  <details style="margin-bottom: 15px; width: 100%; max-width: 800px;">
    <summary><b>Custom Mods & Setup</b></summary>
    
    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">
      <summary style="cursor: pointer; margin-bottom: 10px;">JavaScript Mod Injection</summary>
      <p style="font-size: 12px; margin-bottom: 5px;">
        Inject arbitrary code into the global console context. Overwrite <code>SNAKE_DEV.engine</code> functions or add events here!
      </p>
      <textarea id="mod-code" style="width: 100%; height: 100px; font-family: monospace;">
// Example: Console log every time an apple is eaten
SNAKE_DEV.engine.on('eat', (data) => {
  console.log('Nom! Score is now: ' + SNAKE_DEV.engine.getState().score);
});
      </textarea>
      <br>
      <button id="btn-inject-mod" style="margin-top: 5px; font-weight: bold; background-color: #d1d5db; padding: 5px 10px;">Inject Mod Code</button>
      <span id="mod-status" style="margin-left: 10px; font-size: 12px; color: green; display: none;">Mod Injected!</span>
    </details>

    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">
      <summary style="cursor: pointer; margin-bottom: 10px;">Config Import/Export</summary>
      <button id="btn-export-cfg" style="padding: 5px 15px; font-weight: bold;">Export Current Settings (.json)</button>
      <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ccc;">
      <label>Import Settings JSON: <input type="file" id="file-cfg" accept=".json"></label>
    </details>
  </details>'''

html = re.sub(r'<details style="margin-bottom: 15px; width: 100%; max-width: 800px;">\s*<summary><b>Macros & Import/Export</b>.*?</details>\s*</details>', new_mods_html, html, flags=re.DOTALL)

# Add 3 new settings: screenShake, teleportingFood, hungerDamage
# 1. screenShake to Visual Colors
html = html.replace('<label><input type="checkbox" id="cfg-rainbow"> Rainbow Snake Mode</label>', '<label><input type="checkbox" id="cfg-rainbow"> Rainbow Snake Mode</label>\n      <label style="margin-left: 15px;"><input type="checkbox" id="cfg-screen-shake"> Screen Shake Effect</label>')

# 2. teleportingFood to Board Spawners
html = html.replace('Food Evasion Chance %:', 'Teleporting Apple Chance %: <input type="number" id="cfg-teleport" value="0" min="0" max="100" step="any" style="width: 50px;"></label>\n      <br><br>\n      <label>Food Evasion Chance %:')

# 3. hungerDamage to Snake Mechanics
html = html.replace('Tail Decay (ticks without food): <input type="number" id="cfg-decay" value="0" min="0" style="width: 60px;" title="0 = disabled"></label>', 'Tail Decay (ticks without food): <input type="number" id="cfg-decay" value="0" min="0" style="width: 60px;" title="0 = disabled"></label>\n      <br><br>\n      <label><input type="checkbox" id="cfg-hunger-damage"> Hunger Damage (Die instead of shrink)</label>')

# Remove Macro tutorials from API Guide
html = re.sub(r'<div style="background: #f4f4f4; padding: 15px; border-left: 4px solid #333; margin-bottom: 20px;">\s*<h3 style="margin-top: 0;">Beginner\'s Tutorial: Using and Coding Macros.*?</div>', '', html, flags=re.DOTALL)

# Bump version
html = re.sub(r'src="\./src/main\.js\?v=\d+"', 'src="./src/main.js?v=20"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated HTML!')
