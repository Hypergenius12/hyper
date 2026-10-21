import re

with open('script.js', 'r') as f:
    content = f.read()

# 1. Fix line 2405 (initial bgImg.src in renderInventory)
# Replace `bgImg.src = ...` with standard one
content = re.sub(r'bgImg\.src = `https://florr\.io/petals/0_\$\{slotDiv\.classList\.contains\(\'disabled\'\) \? \'6\' : rData\.id\}\.svg`;',
                 r'bgImg.src = `https://florr.io/petals/0_${rData.id}.svg`;',
                 content)

# 2. Fix line 2591 (bgImg.src in renderCrafting)
content = re.sub(r'bgImg\.src = `https://florr\.io/petals/0_\$\{slotDiv\.classList\.contains\(\'disabled\'\) \? \'6\' : rData\.id\}\.svg`;',
                 r'bgImg.src = `https://florr.io/petals/0_${rData.id}.svg`;',
                 content)

# 3. Update the logic that sets the disabled state in renderInventory
new_update_logic = """            const countDiv = el.querySelector('.count');
            const bgImg = el.querySelector('.bg-img');
            if (currentMode === 'forge') {
                let req = forgeCosts[petalName];
                countDiv.innerText = `${formatNumber(item.count)}/${formatNumber(req)}`;
                if (totalOwned < req) {
                    el.classList.add('disabled');
                    if (bgImg) bgImg.src = 'https://florr.io/petals/0_6.svg';
                } else {
                    el.classList.remove('disabled');
                    if (bgImg) bgImg.src = `https://florr.io/petals/0_${rData.id}.svg`;
                }
            } else {
                countDiv.innerText = `x${formatNumber(item.count)}`;
                if (!rData.next || totalOwned >= 5) {
                    el.classList.remove('disabled');
                    if (bgImg) bgImg.src = `https://florr.io/petals/0_${rData.id}.svg`;
                } else {
                    el.classList.add('disabled');
                    if (bgImg) bgImg.src = 'https://florr.io/petals/0_6.svg';
                }
            }"""

old_update_logic = """            const countDiv = el.querySelector('.count');
            if (currentMode === 'forge') {
                let req = forgeCosts[petalName];
                countDiv.innerText = `${formatNumber(item.count)}/${formatNumber(req)}`;
                if (totalOwned < req) el.classList.add('disabled');
                else el.classList.remove('disabled');
            } else {
                countDiv.innerText = `x${formatNumber(item.count)}`;
                if (!rData.next || totalOwned >= 5) el.classList.remove('disabled');
                else el.classList.add('disabled');
            }"""

content = content.replace(old_update_logic, new_update_logic)

with open('script.js', 'w') as f:
    f.write(content)
