import re

with open('script.js', 'r') as f:
    content = f.read()

new_favicon = """// Random Favicon
const faviconLink = document.querySelector("link[rel~='icon']");
if (faviconLink) {
    const keys = Object.keys(KNOWN_PETALS);
    const randomPetalName = keys[Math.floor(Math.random() * keys.length)];
    const randomPetalId = KNOWN_PETALS[randomPetalName];
    const rarities = ["1", "2", "3", "4", "5", "6", "7", "8"];
    const randomRarityId = rarities[Math.floor(Math.random() * rarities.length)];
    const svgString = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <image href="https://florr.io/petals/0_${randomRarityId}.svg" width="100" height="100" />
  <image href="https://florr.io/petals/${randomPetalId}.svg" width="100" height="100" />
</svg>`;
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    faviconLink.href = dataUrl;
}
"""

content = re.sub(r'// Random Favicon[\s\S]*?\}', new_favicon, content, count=1)

with open('script.js', 'w') as f:
    f.write(content)
