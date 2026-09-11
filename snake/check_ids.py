import re

with open('src/main.js', 'r', encoding='utf-8') as f:
    js = f.read()

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

ids_in_js = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", js)
ids_in_html = re.findall(r'id="([^"]+)"', html)

missing = []
for js_id in ids_in_js:
    if js_id not in ids_in_html:
        missing.append(js_id)

if missing:
    print('MISSING IDs (in JS but NOT in HTML):')
    for m in missing:
        print(f'  - {m}')
else:
    print('All DOM IDs in main.js exist in index.html!')

print(f'\nTotal IDs in main.js: {len(ids_in_js)}')
print(f'Total IDs in HTML: {len(ids_in_html)}')
