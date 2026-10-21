import re

with open('script.js', 'r') as f:
    content = f.read()

# Add Wax
wax_html = """    "wax": {
        desc: "A defensive petal that drops a large block to physically obstruct mobs.",
        stats: {
            "common": { health: "1000", reload: "30s" },
            "unusual": { health: "3000", reload: "30s" },
            "rare": { health: "9000", reload: "30s" },
            "epic": { health: "27000", reload: "30s" },
            "legendary": { health: "81000", reload: "30s" },
            "mythic": { health: "243000", reload: "30s" },
            "ultra": { health: "729000", reload: "30s" },
            "super": { health: "2187000", reload: "30s" },
            "unique": { health: "6561000", reload: "30s" },
        },
    },"""

if '"wax": {' not in content:
    content = content.replace('const PETAL_DATA = {', 'const PETAL_DATA = {\n' + wax_html)

# Add Reset Forge command
reset_cmd = """    if (parts[0] === 'reset' && parts[1] === 'forge') {
        Object.keys(forgeCosts).forEach(k => {
            forgeCosts[k] = 5;
        });
        localStorage.setItem('florr_forge_costs', JSON.stringify(forgeCosts));
        renderInventory();
        log("Forge costs reset to 5.", "#7eef6d");
        return;
    }
"""

if 'reset forge' not in content:
    content = content.replace("    if (parts[0] === 'help') {", reset_cmd + "\n    if (parts[0] === 'help') {")
    content = content.replace('log("   > clear mythic-super", "#ccc", true);', 'log("   > clear mythic-super", "#ccc", true);\n        log("5. Reset Forge: reset forge", "#fff", true);\n        log("   > resets all forge costs to 5", "#ccc", true);')

with open('script.js', 'w') as f:
    f.write(content)
