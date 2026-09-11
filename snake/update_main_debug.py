import re

with open('src/main.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add DOM elements
dom_els = '''
const cfgLenSpeed = document.getElementById('cfg-len-speed');
const cfgAppleWander = document.getElementById('cfg-apple-wander');
const cfgRenderStyle = document.getElementById('cfg-render-style');
'''
js = js.replace("const cfgInvertCols = document.getElementById('cfg-invert-cols');", "const cfgInvertCols = document.getElementById('cfg-invert-cols');" + dom_els)

config_mapping = '''
    lengthSpeedMod: parseFloat(cfgLenSpeed.value) || 0,
    appleWanderChance: parseFloat(cfgAppleWander.value) / 100 || 0,
    renderStyle: cfgRenderStyle.value,
'''
js = js.replace('invertColorsTicks: parseInt(cfgInvertCols.value, 10) || 0,', 'invertColorsTicks: parseInt(cfgInvertCols.value, 10) || 0,' + config_mapping)

ui_mapping = '''
  cfgLenSpeed.value = engine.config.lengthSpeedMod || 0;
  cfgAppleWander.value = (engine.config.appleWanderChance || 0) * 100;
  if (engine.config.renderStyle) cfgRenderStyle.value = engine.config.renderStyle;
'''
js = js.replace('cfgInvertCols.value = engine.config.invertColorsTicks || 0;', 'cfgInvertCols.value = engine.config.invertColorsTicks || 0;' + ui_mapping)

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('main.js updated!')
