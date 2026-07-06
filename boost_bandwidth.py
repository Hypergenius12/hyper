import re

with open('excavator/js/biomes.js', 'r') as f:
    content = f.read()

def multiply_bandwidth(match):
    value = float(match.group(1))
    # slightly more bandwidth: +30%
    new_value = int(value * 1.3)
    return f"bandwidthDrop: {new_value}"

content = re.sub(r'bandwidthDrop:\s*(\d+(?:\.\d+)?)', multiply_bandwidth, content)

with open('excavator/js/biomes.js', 'w') as f:
    f.write(content)

print("Boosted bandwidth successfully.")
