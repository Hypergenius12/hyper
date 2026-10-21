import re
with open('index.html', 'r') as f:
    content = f.read()

content = re.sub(r'\?v=\d+', '?v=74', content)

with open('index.html', 'w') as f:
    f.write(content)
