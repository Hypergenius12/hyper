const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/entities.js', 'utf8');

const hook = `            } else if (this.item.type === 'material' || this.item.type === 'equipment' || this.item.type === 'wand' || this.item.type === 'spell' || this.item.type === 'modifier' || this.item.type === 'food') {`;

const newCode = `            } else if (this.item.type === 'material' || this.item.type === 'equipment' || this.item.type === 'wand' || this.item.type === 'spell' || this.item.type === 'modifier' || this.item.type === 'food') {
                let cvs;
                let tex;
                const updateTex = (canvas) => {
                    if (tex) {
                        tex.image = canvas;
                        tex.needsUpdate = true;
                    }
                };
                if (this.item.type === 'material' || this.item.type === 'equipment' || this.item.type === 'food') {
                    cvs = generateItemTexture(this.item.type, this.item.subtype, updateTex);
                } else if (this.item.type === 'wand') {
                    cvs = generateItemTexture('wand', this.item.subtype || 'wand_basic', updateTex);
                } else if (this.item.type === 'spell') {
                    cvs = generateItemTexture('spell', this.item.data.spell.element || 'spell_basic', updateTex);
                } else if (this.item.type === 'modifier') {
                    cvs = generateItemTexture('modifier', this.item.subtype, updateTex);
                }
                tex = new THREE.CanvasTexture(cvs);
                tex.magFilter = THREE.NearestFilter;
                tex.colorSpace = THREE.SRGBColorSpace;
                const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
                this.mesh = new THREE.Sprite(mat);
                this.mesh.scale.set(0.4, 0.4, 0.4);
            } else {`;

code = code.substring(0, code.indexOf(hook)) + newCode + code.substring(code.indexOf('            } else {\n                const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);'));

fs.writeFileSync('slopcraft 3D/js/entities.js', code);
