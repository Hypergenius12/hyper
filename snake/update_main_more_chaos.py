import re

with open('src/main.js', 'r', encoding='utf-8') as f:
    js = f.read()

dom_els = '''
const cfgShrink = document.getElementById('cfg-shrink');
const cfgRevApple = document.getElementById('cfg-rev-apple');
const cfgTornado = document.getElementById('cfg-tornado');
const cfgInvertCols = document.getElementById('cfg-invert-cols');
'''
js = js.replace("const cfgAcidMode = document.getElementById('cfg-acid-mode');", "const cfgAcidMode = document.getElementById('cfg-acid-mode');" + dom_els)

config_mapping = '''
    shrinkTicks: parseInt(cfgShrink.value, 10) || 0,
    reverseAppleChance: parseFloat(cfgRevApple.value) / 100 || 0,
    tornadoTicks: parseInt(cfgTornado.value, 10) || 0,
    invertColorsTicks: parseInt(cfgInvertCols.value, 10) || 0,
'''
js = js.replace('acidMode: cfgAcidMode.checked,', 'acidMode: cfgAcidMode.checked,' + config_mapping)

ui_mapping = '''
  cfgShrink.value = engine.config.shrinkTicks || 0;
  cfgRevApple.value = (engine.config.reverseAppleChance || 0) * 100;
  cfgTornado.value = engine.config.tornadoTicks || 0;
  cfgInvertCols.value = engine.config.invertColorsTicks || 0;
'''
js = js.replace('cfgAcidMode.checked = engine.config.acidMode || false;', 'cfgAcidMode.checked = engine.config.acidMode || false;' + ui_mapping)

# Also when config changes, we need to call renderer.setupCanvas() if width/height shrink, but main.js handles that on manual config load.
# GameEngine will shrink its own bounds, we should make sure GameEngine can tell renderer to update.
# But for now let's just make the changes.

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('main.js updated!')
