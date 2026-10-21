import json

try:
    with open("m28n.json", "r") as f:
        m28n = json.load(f)
except Exception as e:
    import urllib.request
    req = urllib.request.Request("https://florr.io/static/m28n.json", headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req).read()
    m28n = json.loads(data.decode('utf-8'))
    with open("m28n.json", "w") as f:
        json.dump(m28n, f)

petals_data = m28n.get('petals', {})
for id_str, p in petals_data.items():
    if p.get('name', '').lower() == 'electric web':
        print(f"Found Electric Web! ID: {id_str}")
        print(json.dumps(p, indent=2))
        break
