import urllib.request
import re

try:
    bg_req = urllib.request.Request("https://florr.io/petals/0_9.svg", headers={'User-Agent': 'Mozilla/5.0'})
    bg_svg = urllib.request.urlopen(bg_req).read().decode('utf-8')
    
    p_req = urllib.request.Request("https://florr.io/petals/74.svg", headers={'User-Agent': 'Mozilla/5.0'})
    p_svg = urllib.request.urlopen(p_req).read().decode('utf-8')
except Exception as e:
    print(f"Error fetching: {e}")
    exit(1)
    
bg_inner = re.sub(r'</?svg[^>]*>', '', bg_svg)
p_inner = re.sub(r'</?svg[^>]*>', '', p_svg)

composite = f'''<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<g>{bg_inner}</g>
<g>{p_inner}</g>
</svg>'''

with open("favicon.svg", "w") as f:
    f.write(composite)
print("Generated favicon.svg")
