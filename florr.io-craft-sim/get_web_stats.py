import urllib.request
import json
import re

req = urllib.request.Request("https://m28n.surge.sh/data/petals.json", headers={'User-Agent': 'Mozilla'})
data = json.loads(urllib.request.urlopen(req).read().decode())
for p in data:
    if p.get('name', '').lower() == 'electric web':
        print(json.dumps(p, indent=2))
