import re

with open('script.js', 'r') as f:
    content = f.read()

# Add Bean
bean_html = """    "bean": {
        desc: "Deals 1.5x damage when no allied flowers (players) are nearby.",
        stats: {
            "common": { damage: "10", health: "12", reload: "2s" },
            "unusual": { damage: "30", health: "36", reload: "2s" },
            "rare": { damage: "90", health: "108", reload: "2s" },
            "epic": { damage: "270", health: "324", reload: "2s" },
            "legendary": { damage: "810", health: "972", reload: "2s" },
            "mythic": { damage: "2430", health: "2916", reload: "2s" },
            "ultra": { damage: "7290", health: "8748", reload: "2s" },
            "super": { damage: "21870", health: "26244", reload: "2s" },
            "unique": { damage: "65610", health: "78732", reload: "2s" },
        },
    },"""

if '"bean": {' not in content:
    content = content.replace('const PETAL_DATA = {', 'const PETAL_DATA = {\n' + bean_html)

# Fix Beetle Egg
content = content.replace('reload: "2.2s", special: "Contents: Beetle (Epic)"', 'reload: "2.2m", special: "Contents: Beetle (Legendary)"')
content = content.replace('reload: "8.6s", special: "Contents: Beetle (Legendary)"', 'reload: "8.6m", special: "Contents: Beetle (Mythic)"')
content = content.replace('reload: "19.1s", special: "Contents: Beetle (Mythic)"', 'reload: "19.1m", special: "Contents: Beetle (Ultra)"')
content = content.replace('reload: "82.4s", special: "Contents: Beetle (Ultra)"', 'reload: "82.4m", special: "Contents: Beetle (Super)"')
content = content.replace('reload: "7.4s", special: "Contents: Beetle (Ultra)"', 'reload: "7.4h", special: "Contents: Beetle (Unique)"')

# Fix Ant Egg
content = content.replace('reload: "2.4s", special: "Contents: x4 Soldier Ant (Unusual)"', 'reload: "2.4m", special: "Contents: x4 Soldier Ant (Rare)"')
content = content.replace('reload: "3.3s", special: "Contents: x4 Soldier Ant (Rare)"', 'reload: "3.3m", special: "Contents: x4 Soldier Ant (Epic)"')
content = content.replace('reload: "5.1s", special: "Contents: x4 Soldier Ant (Epic)"', 'reload: "5.1m", special: "Contents: x4 Soldier Ant (Legendary)"')
content = content.replace('reload: "15.8s", special: "Contents: x4 Soldier Ant (Legendary)"', 'reload: "15.8m", special: "Contents: x4 Soldier Ant (Mythic)"')
content = content.replace('reload: "33.6s", special: "Contents: x4 Soldier Ant (Mythic)"', 'reload: "33.6m", special: "Contents: x4 Soldier Ant (Ultra)"')
content = content.replace('reload: "140.2s", special: "Contents: x4 Soldier Ant (Ultra)"', 'reload: "140.2m", special: "Contents: x4 Soldier Ant (Super)"')
content = content.replace('reload: "13.8s", special: "Contents: x4 Soldier Ant (Ultra)"', 'reload: "13.8h", special: "Contents: x4 Soldier Ant (Unique)"')


with open('script.js', 'w') as f:
    f.write(content)
