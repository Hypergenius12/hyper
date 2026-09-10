import re
import random

new_styles = []

# Generate inset styles (5)
for i in range(1, 6):
    d = i * 0.1
    s = f"""        }} else if (block.style === 'inset-{i}') {{
          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(x + bs*{d}, y + bs*{d}, bs*(1.0-{d*2}), bs*(1.0-{d*2}));\n"""
    new_styles.append(('inset-'+str(i), s))

# Generate lines styles (10)
for i in range(2, 12):
    code = f"          ctx.fillRect(x, y, bs - 1, bs - 1);\n          ctx.fillStyle = 'rgba(0,0,0,0.4)';\n"
    for j in range(i):
        code += f"          ctx.fillRect(x, y + bs*{j/i}, bs, bs*{0.5/i});\n"
    s = f"        }} else if (block.style === 'hlines-{i}') {{\n{code}"
    new_styles.append(('hlines-'+str(i), s))

# Vertical lines (10)
for i in range(2, 12):
    code = f"          ctx.fillRect(x, y, bs - 1, bs - 1);\n          ctx.fillStyle = 'rgba(0,0,0,0.4)';\n"
    for j in range(i):
        code += f"          ctx.fillRect(x + bs*{j/i}, y, bs*{0.5/i}, bs);\n"
    s = f"        }} else if (block.style === 'vlines-{i}') {{\n{code}"
    new_styles.append(('vlines-'+str(i), s))

# Grid (10)
for i in range(2, 12):
    code = f"          ctx.fillRect(x, y, bs - 1, bs - 1);\n          ctx.fillStyle = 'rgba(0,0,0,0.3)';\n"
    for j in range(i):
        code += f"          ctx.fillRect(x, y + bs*{j/i}, bs, bs*{0.2/i});\n"
        code += f"          ctx.fillRect(x + bs*{j/i}, y, bs*{0.2/i}, bs);\n"
    s = f"        }} else if (block.style === 'grid-{i}') {{\n{code}"
    new_styles.append(('grid-'+str(i), s))

# Plus styles (8)
for i in range(1, 9):
    w = i * 0.05
    code = f"""          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(x + bs*(0.5-{w}), y, bs*{w*2}, bs);
          ctx.fillRect(x, y + bs*(0.5-{w}), bs, bs*{w*2});\n"""
    s = f"        }} else if (block.style === 'plus-{i}') {{\n{code}"
    new_styles.append(('plus-'+str(i), s))

# Concentric circles (8)
for i in range(1, 9):
    code = f"""          ctx.fillRect(x, y, bs - 1, bs - 1);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;\n"""
    for j in range(1, i+1):
        r = j * (0.4/i)
        code += f"""          ctx.beginPath();
          ctx.arc(x + bs/2, y + bs/2, bs*{r}, 0, Math.PI*2);
          ctx.stroke();\n"""
    s = f"        }} else if (block.style === 'circles-{i}') {{\n{code}"
    new_styles.append(('circles-'+str(i), s))

existing_styles = ['wireframe', 'dots', 'stripes', 'hollow', 'glitch', 'rounded', 'x-mark', 'circle', 'checkerboard', 'diamond', 'crosshair', 'brackets', 'triangle']
all_new_styles = new_styles[:51]

print("Generated", len(all_new_styles), "new styles.")

with open('excavator/js/engine.js', 'r') as f:
    engine_code = f.read()

target_end = """        } else if (block.style === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(x + bs/2, y + bs*0.15);
          ctx.lineTo(x + bs*0.85, y + bs*0.85);
          ctx.lineTo(x + bs*0.15, y + bs*0.85);
          ctx.fill();"""

replacement = target_end + "\n" + "".join([s[1] for s in all_new_styles])
engine_code = engine_code.replace(target_end, replacement)

with open('excavator/js/engine.js', 'w') as f:
    f.write(engine_code)

with open('excavator/js/biomes.js', 'r') as f:
    biomes_code = f.read()

all_style_names = existing_styles + [s[0] for s in all_new_styles]
random.seed(42) # Deterministic for testing
random.shuffle(all_style_names)

def replace_block_style(match):
    s = all_style_names.pop()
    pixelate = random.choice([0.0, 0.0, 0.0, 0.0, 3.0, 6.0])
    invert = random.choice([0.0, 0.0, 0.0, 0.0, 0.0, 1.0])
    grain = random.choice([0.0, 0.0, 0.0, 0.2, 0.5])
    hueShift = random.choice([0.0, 0.0, 0.0, 0.0, 1.5, 3.14])
    return f'pixelate: {pixelate}, invert: {invert}, grain: {grain}, hueShift: {hueShift}, blockStyle: "{s}"'

biomes_code = re.sub(r'blockStyle:\s*"[^"]+"', replace_block_style, biomes_code)

with open('excavator/js/biomes.js', 'w') as f:
    f.write(biomes_code)

print("Done.")
