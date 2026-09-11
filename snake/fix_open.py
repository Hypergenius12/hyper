with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace <details open style="..." border: 1px solid #ccc;> with closed version
html = html.replace('<details open style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">', '<details style="margin-top: 10px; padding: 10px; border: 1px solid #ccc;">')

# Also bump the version number to v=18
import re
html = re.sub(r'src="\./src/main\.js\?v=\d+"', 'src="./src/main.js?v=18"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
