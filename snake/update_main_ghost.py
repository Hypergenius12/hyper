import re

with open('src/main.js', 'r', encoding='utf-8') as f:
    js = f.read()

dom_els = '''
const cfgGhostPct = document.getElementById('cfg-ghost-pct');
const cfgGhostDur = document.getElementById('cfg-ghost-dur');
const cfgFatness = document.getElementById('cfg-fatness');
const cfgColGhost = document.getElementById('cfg-col-ghost');
'''
js = js.replace("const cfgWinScore = document.getElementById('cfg-win-score');", "const cfgWinScore = document.getElementById('cfg-win-score');\n" + dom_els)

config_mapping = '''
    ghostAppleChance: parseFloat(cfgGhostPct.value) / 100 || 0,
    ghostDurationTicks: parseInt(cfgGhostDur.value, 10) || 30,
    snakeFatness: parseFloat(cfgFatness.value) || 1.0,
    colorFoodGhost: cfgColGhost.value,
'''
js = js.replace('winScore: parseInt(cfgWinScore.value, 10) || 0,', 'winScore: parseInt(cfgWinScore.value, 10) || 0,\n' + config_mapping)

ui_mapping = '''
  cfgGhostPct.value = (engine.config.ghostAppleChance || 0) * 100;
  cfgGhostDur.value = engine.config.ghostDurationTicks || 30;
  cfgFatness.value = engine.config.snakeFatness || 1.0;
  cfgColGhost.value = engine.config.colorFoodGhost || '#06b6d4';
'''
js = js.replace('cfgWinScore.value = engine.config.winScore || 0;', 'cfgWinScore.value = engine.config.winScore || 0;\n' + ui_mapping)

# Add SFX for Ghost Apple
sfx_add = '''  } else if (data.type === 'GHOST') {
    playTone(500, 'sine', 0.2, 1);
    setTimeout(() => playTone(700, 'sine', 0.4, 1), 100);
'''
js = js.replace("} else if (data.type === 'POISON') {", sfx_add + "} else if (data.type === 'POISON') {")


with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('main.js updated!')
