const fs = require('fs');

// Fix main.js hand item
let mainCode = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');
const handRegex = /const iconCanvas = generateItemTexture\(slot\.item\.type, slot\.item\.subtype\);\n                const tex = new THREE\.CanvasTexture\(iconCanvas\);/;
const handReplace = `const iconCanvas = generateItemTexture(slot.item.type, slot.item.subtype, (c) => {
                    if (this.heldItemMesh && this.heldItemMesh.material && this.heldItemMesh.material.map) {
                        this.heldItemMesh.material.map.needsUpdate = true;
                    }
                });
                const tex = new THREE.CanvasTexture(iconCanvas);`;
mainCode = mainCode.replace(handRegex, handReplace);
fs.writeFileSync('slopcraft 3D/js/main.js', mainCode);

// Fix systems.js crafting table
let sysCode = fs.readFileSync('slopcraft 3D/js/systems.js', 'utf8');
const craftRegex = /const iconCanvas = generateItemTexture\(def\.type, def\.subtype\);\n                dataURL = iconCanvas\.toDataURL\(\);/;
const craftReplace = `const iconCanvas = generateItemTexture(def.type, def.subtype, (c) => {
                    const elImg = el.querySelector('img');
                    if (elImg) elImg.src = c.toDataURL();
                });
                dataURL = iconCanvas.toDataURL();`;
sysCode = sysCode.replace(craftRegex, craftReplace);
fs.writeFileSync('slopcraft 3D/js/systems.js', sysCode);

