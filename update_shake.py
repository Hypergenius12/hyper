import re

with open('/Users/2013mbp4gb128gb/Downloads/hypergenius12/excavator/js/biomes.js', 'r') as f:
    content = f.read()

content = re.sub(r'shakeOnMine:\s*true', 'shakeOnMine: false', content)

with open('/Users/2013mbp4gb128gb/Downloads/hypergenius12/excavator/js/biomes.js', 'w') as f:
    f.write(content)
