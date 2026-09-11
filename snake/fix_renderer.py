import re

with open('src/engine/Renderer.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace('col = hsl(, 100%, 50%);', 'col = `hsl(${hue}, 100%, 50%)`;')
js = js.replace('col = `hsl(, 100%, 50%)`;', 'col = `hsl(${hue}, 100%, 50%)`;')

with open('src/engine/Renderer.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Renderer fixed!')
