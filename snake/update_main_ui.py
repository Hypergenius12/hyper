import re

with open('src/main.js', 'r', encoding='utf-8') as f:
    js = f.read()

dom_els = '''
const cfgAppleMult = document.getElementById('cfg-apple-mult');
const cfgRndTeleport = document.getElementById('cfg-rnd-teleport');
const cfgPoopRocks = document.getElementById('cfg-poop-rocks');
const cfgAcidMode = document.getElementById('cfg-acid-mode');
'''
js = js.replace("const cfgAppleGravity = document.getElementById('cfg-apple-gravity');", "const cfgAppleGravity = document.getElementById('cfg-apple-gravity');" + dom_els)

config_mapping = '''
    appleMultiplier: parseInt(cfgAppleMult.value, 10) || 1,
    randomTeleportTicks: parseInt(cfgRndTeleport.value, 10) || 0,
    poopRocksTicks: parseInt(cfgPoopRocks.value, 10) || 0,
    acidMode: cfgAcidMode.checked,
'''
js = js.replace('appleGravity: cfgAppleGravity.checked,', 'appleGravity: cfgAppleGravity.checked,' + config_mapping)

ui_mapping = '''
  cfgAppleMult.value = engine.config.appleMultiplier || 1;
  cfgRndTeleport.value = engine.config.randomTeleportTicks || 0;
  cfgPoopRocks.value = engine.config.poopRocksTicks || 0;
  cfgAcidMode.checked = engine.config.acidMode || false;
'''
js = js.replace('cfgAppleGravity.checked = engine.config.appleGravity;', 'cfgAppleGravity.checked = engine.config.appleGravity;' + ui_mapping)

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('main.js updated!')
