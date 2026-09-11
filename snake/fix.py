import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Make it look like a fieldset by appending border rule to style, or adding style.
# The original fieldsets look like: <fieldset style="margin-top: 10px; padding: 10px;">
html = re.sub(r'<fieldset style="([^"]+)">', r'<details open style="\1 border: 1px solid #ccc;">', html)
html = html.replace('<fieldset>', '<details open style="border: 1px solid #ccc; padding: 10px; margin-top: 10px;">')
html = html.replace('</fieldset>', '</details>')

html = html.replace('<legend>', '<summary style="cursor: pointer; margin-bottom: 10px;">')
html = html.replace('</legend>', '</summary>')

# Bump version in script tag
html = re.sub(r'src="\./src/main\.js\?v=\d+"', 'src="./src/main.js?v=17"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Done!')
