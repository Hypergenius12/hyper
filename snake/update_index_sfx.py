import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Audio and Win Condition UI
# Put Audio right under Chaos and Fun
audio_ui = '''    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">
      <summary style="cursor: pointer; margin-bottom: 10px;"><b>Audio & Sound Effects</b></summary>
      <label><input type="checkbox" id="cfg-sfx" checked> Enable Synthesizer SFX</label>
      <br><br>
      <label>Volume %: <input type="number" id="cfg-vol" value="10" min="0" max="100" style="width: 50px;"></label>
    </details>
'''
html = html.replace('    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">\n      <summary style="cursor: pointer; margin-bottom: 10px;"><b>Visual Colors (Hex) & UI</b></summary>', audio_ui + '    <details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">\n      <summary style="cursor: pointer; margin-bottom: 10px;"><b>Visual Colors (Hex) & UI</b></summary>')

# Add Win Condition to Physics
win_ui = '''      <br><br>
      <label>Score to Win: <input type="number" id="cfg-win-score" value="0" min="0" style="width: 70px;" title="0 = Endless. Set to a number to win the game!"></label>
'''
html = html.replace('      <label style="margin-left: 10px;">Length Speed Mod (ms/seg): <input type="number" id="cfg-len-speed" value="0" step="any" style="width: 50px;" title="Negative = faster as you grow. Positive = slower."></label>\n', '      <label style="margin-left: 10px;">Length Speed Mod (ms/seg): <input type="number" id="cfg-len-speed" value="0" step="any" style="width: 50px;" title="Negative = faster as you grow. Positive = slower."></label>\n' + win_ui)

# Bump version
html = re.sub(r'src="\./src/main\.js\?v=\d+"', 'src="./src/main.js?v=25"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('index.html updated with Audio and Win Condition!')
