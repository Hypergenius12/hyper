const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/systems.js', 'utf8');

const hook = `                const dataURL = iconCanvas.toDataURL();
                inner = \`<img src="\${dataURL}" class="item-icon" draggable="false" />\`;
            } else if (slot.item.type === 'wand') {`;

const newCode = `                const dataURL = iconCanvas.toDataURL();
                inner = \`<img src="\${dataURL}" class="item-icon" draggable="false" />\`;
            } else {
                let cvs;
                const updateImg = (canvas) => {
                    if (el._cacheKey === cacheKey) {
                        const img = el.querySelector('img.item-icon');
                        if (img) img.src = canvas.toDataURL();
                    }
                };
                if (slot.item.type === 'wand') cvs = generateItemTexture('wand', slot.item.subtype || 'wand_basic', updateImg);
                else if (slot.item.type === 'spell') cvs = generateItemTexture('spell', slot.item.data.spell.element || 'spell_basic', updateImg);
                else if (slot.item.type === 'material') cvs = generateItemTexture('material', slot.item.subtype, updateImg);
                else if (slot.item.type === 'equipment') cvs = generateItemTexture('equipment', slot.item.subtype, updateImg);
                else if (slot.item.type === 'modifier') cvs = generateItemTexture('modifier', slot.item.subtype, updateImg);
                else if (slot.item.type === 'food') cvs = generateItemTexture('food', slot.item.subtype, updateImg);
                
                if (cvs) {
                    inner = \`<img src="\${cvs.toDataURL()}" class="item-icon" draggable="false" style="image-rendering: pixelated; width: 100%; height: 100%;" />\`;
                } else {
                    inner = \`<div style="text-align:center; line-height:100%;">\${slot.item.name.substring(0,2).toUpperCase()}</div>\`;
                }
            }
            if (slot.count > 1) inner += \`<span class="item-count">\${slot.count}</span>\`;`;

// regex to replace from `} else if (slot.item.type === 'wand') {` down to `if (slot.count > 1)`
code = code.substring(0, code.indexOf(hook)) + newCode + code.substring(code.indexOf('if (slot.count > 1)') + 'if (slot.count > 1) inner += `<span class="item-count">${slot.count}</span>`;'.length);

fs.writeFileSync('slopcraft 3D/js/systems.js', code);
