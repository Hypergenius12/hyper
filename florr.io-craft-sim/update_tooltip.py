import re

with open('script.js', 'r') as f:
    content = f.read()

new_logic = """        let statHtml = '';
        const stats = data.stats?.[item.rarity] || {};
        if (stats.damage) statHtml += `<div style="color:#f66">⚔ Damage: ${stats.damage}</div>`;
        if (stats.health) statHtml += `<div style="color:#5f5">♥ Health: ${stats.health}</div>`;
        if (stats.usage_reload) statHtml += `<div style="color:#5df">⏱ Use Reload: ${stats.usage_reload}</div>`;
        
        function formatSpecial(text) {
            if (!text) return "";
            if (text.startsWith("Mana") || text.startsWith("Base Max Mana") || text.startsWith("Spawn Cost (mana)") || text.startsWith("Maint. Cost (mana")) {
                return `<div style="color:#5df">${text}</div>`;
            } else if (text.startsWith("Poison")) {
                return `<div style="color:#a5f">${text}</div>`;
            } else {
                return `<div style="color:#fd5">★ ${text}</div>`;
            }
        }
        
        if (stats.special) statHtml += formatSpecial(stats.special);
        if (stats.special2) statHtml += formatSpecial(stats.special2);
        if (stats.special3) statHtml += formatSpecial(stats.special3);
        
        document.getElementById('tt-stats').innerHTML = statHtml;
        if (stats.reload) {
            document.getElementById('tt-cooldown').innerText = stats.reload + ' \u21BB';
        } else {
            document.getElementById('tt-cooldown').innerText = '';
        }"""

content = re.sub(r"        let statHtml = '';\s*const stats = data\.stats\?\.\[item\.rarity\] \|\| \{\};\s*if \(stats\.damage\)[\s\S]*?document\.getElementById\('tt-cooldown'\)\.innerText = '';", new_logic, content)

with open('script.js', 'w') as f:
    f.write(content)
