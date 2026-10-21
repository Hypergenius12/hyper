import re

with open('script.js', 'r') as f:
    content = f.read()

# 1. Update updateModeUI()
new_update_ui = """function updateModeUI() {
    if (currentMode === 'craft') {
        document.body.classList.remove('forge-mode');
        topBarTitle.innerText = 'Craft';
        modeToggleBtn.querySelector('.bg-img').src = 'https://florr.io/mobs/0_9.svg'; // Titan bg
        modeToggleBtn.querySelector('.petal-img').src = 'titan.png'; // Titan face
        btnCraft.innerText = 'Craft';
        const helper = document.getElementById('forge-helper-text');
        if (helper) helper.style.display = 'none';
    } else {
        document.body.classList.add('forge-mode');
        topBarTitle.innerText = 'Forge';
        modeToggleBtn.querySelector('.bg-img').src = 'https://florr.io/mobs/0_0.svg'; // Trader bg
        modeToggleBtn.querySelector('.petal-img').src = 'trader.png'; // Trader face
        btnCraft.innerText = 'Forge';
        const helper = document.getElementById('forge-helper-text');
        if (helper) helper.style.display = 'block';
    }"""
content = re.sub(r'function updateModeUI\(\) \{[\s\S]*?btnCraft\.innerText = \'Forge\';\n    \}', new_update_ui, content, count=1)

# 2. Add random favicon to the very end
favicon_script = """
// Random Favicon
const faviconLink = document.querySelector("link[rel~='icon']");
if (faviconLink) {
    const keys = Object.keys(KNOWN_PETALS);
    const randomPetalName = keys[Math.floor(Math.random() * keys.length)];
    const randomPetalId = KNOWN_PETALS[randomPetalName];
    const rarities = ["1", "2", "3", "4", "5", "6", "7", "8"];
    const randomRarityId = rarities[Math.floor(Math.random() * rarities.length)];
    faviconLink.href = `https://florr.io/petals/${randomPetalId}_${randomRarityId}.svg`;
}
"""
content += favicon_script

# 3. Update descriptive stats
content = content.replace('"Can see ghosts. -20% Vision"', '"-20% Vision"')
content = content.replace('"+Petal Health, +5% Reload Time"', '"+5% Reload Time"')
content = content.replace('"Warps player, grants 3s immunity."', '"3s Immunity"')

with open('script.js', 'w') as f:
    f.write(content)
