import re
import json
import demjson3

with open('script.js', 'r') as f:
    content = f.read()

# Extract PETAL_DATA
match = re.search(r'const PETAL_DATA = (\{[\s\S]*?\n\});\n', content)
if match:
    data_str = match.group(1)
    try:
        # Evaluate as JS object string to dict (requires parsing, we can just use regex for basic empty stats)
        # We can just search for "name": { desc: "...", stats: { \s* } }
        pass
    except Exception:
        pass

# Simple regex check for empty stats block
empty_stats = re.findall(r'"([^"]+)": \{\s*desc: [^,]+,\s*stats: \{\s*\},\s*\},', content)
print("Empty stats overall:", empty_stats)

# Regex check for any petal missing stats for a specific rarity
for petal_match in re.finditer(r'"([^"]+)": \{\s*desc:(?:.*?),\s*stats: \{([\s\S]*?)\},\s*\},', content, re.MULTILINE | re.DOTALL):
    petal_name = petal_match.group(1)
    stats_block = petal_match.group(2)
    empty_rarities = re.findall(r'"([^"]+)": \{\s*\},', stats_block)
    if empty_rarities:
        print(f"{petal_name} missing rarities:", empty_rarities)
