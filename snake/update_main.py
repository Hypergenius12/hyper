import re

with open('src/main.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add DOM elements
dom_els = '''const cfgFog = document.getElementById('cfg-fog');
const cfgScramble = document.getElementById('cfg-scramble');
const cfgDrunk = document.getElementById('cfg-drunk');
const cfgAppleGravity = document.getElementById('cfg-apple-gravity');
'''
js = js.replace('const cfgScreenShake = document.getElementById(\'cfg-screen-shake\');', 'const cfgScreenShake = document.getElementById(\'cfg-screen-shake\');\n' + dom_els)

# Add to newConfig obj
config_mapping = '''
    fogOfWarRadius: parseFloat(cfgFog.value) || 0,
    scrambleInterval: parseInt(cfgScramble.value, 10) || 0,
    drunkChance: parseFloat(cfgDrunk.value) / 100 || 0,
    appleGravity: cfgAppleGravity.checked,
'''
js = js.replace('screenShake: cfgScreenShake.checked,', 'screenShake: cfgScreenShake.checked,' + config_mapping)

# Add to updateUIFromConfig
ui_mapping = '''
  cfgFog.value = engine.config.fogOfWarRadius;
  cfgScramble.value = engine.config.scrambleInterval;
  cfgDrunk.value = engine.config.drunkChance * 100;
  cfgAppleGravity.checked = engine.config.appleGravity;
'''
js = js.replace('cfgScreenShake.checked = engine.config.screenShake;', 'cfgScreenShake.checked = engine.config.screenShake;' + ui_mapping)

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('main.js updated!')
