const fs = require('fs');

// ==========================================
// 1. engine.js
// ==========================================
let eng = fs.readFileSync('slopcraft 3D/js/engine.js', 'utf8');

// Ensure double-tap Space toggles _creativeFlying in onKeyDown
eng = eng.replace(
    /case 'Space': this\.keys\.jump = true; break;/,
    `case 'Space':
                this.keys.jump = true;
                if (this.creativeMode) {
                    const now = Date.now();
                    if (now - this._lastSpaceTime < 300) {
                        this._creativeFlying = !this._creativeFlying;
                        const toast = document.getElementById('creative-toast');
                        if (toast) {
                            toast.textContent = this._creativeFlying ? '✈ Flying ON' : '✈ Flying OFF';
                            toast.classList.remove('hidden');
                            clearTimeout(this._toastTimer);
                            this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 1500);
                        }
                    }
                    this._lastSpaceTime = now;
                }
                break;`
);

fs.writeFileSync('slopcraft 3D/js/engine.js', eng);

// ==========================================
// 2. main.js: pass _creativeFlying into keys for player.update
// ==========================================
let main = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

main = main.replace(
    /this\.player\.update\(dt, this\.input\.keys, this\.input\.mouse, this\.world\);/,
    `this.input.keys._creativeFlying = this.input.creativeMode && this.input._creativeFlying;
            this.player.update(dt, this.input.keys, this.input.mouse, this.world);`
);

fs.writeFileSync('slopcraft 3D/js/main.js', main);

// ==========================================
// 3. entities.js: handle flying physics properly
// ==========================================
let ent = fs.readFileSync('slopcraft 3D/js/entities.js', 'utf8');

// In Player.update:
ent = ent.replace(
    /let speedMult = 1\.0;\s*let flying = false;\s*\/\/ Boots\s*const boots = this\.inventory\.armor\[3\];\s*if \(boots && boots\.item\.data\.equipData\) \{\s*if \(boots\.item\.data\.equipData\.speedMult\) speedMult = boots\.item\.data\.equipData\.speedMult;\s*if \(boots\.item\.data\.equipData\.flying\) flying = true;\s*\}/,
    `let speedMult = 1.0;
        let flying = false;
        
        // Boots
        const boots = this.inventory.armor[3];
        if (boots && boots.item.data.equipData) {
            if (boots.item.data.equipData.speedMult) speedMult = boots.item.data.equipData.speedMult;
            if (boots.item.data.equipData.flying) flying = true;
        }
        if (keys._creativeFlying) {
            flying = true;
        }`
);

// Gravity & vertical flying movement:
ent = ent.replace(
    /let gravity = \(inWater \|\| inLava\) \? -1\.5 : -25;[\s\S]*?if \(onLadder\) \{\s*gravity = 0; \/\/ Cancel gravity on ladder\s*drag = 15; \/\/ Higher drag so you stop quickly\s*\}/,
    `let gravity = (inWater || inLava) ? -1.5 : -25;
        let drag = (inWater || inLava) ? 6 : 10;
        let jumpForce = (inWater || inLava) ? 3.5 : 9;
        
        if (flying) {
            gravity = 0; // Zero gravity when flying
            drag = 12;   // Stop floating drift
        } else if (onLadder) {
            gravity = 0; // Cancel gravity on ladder
            drag = 15; // Higher drag so you stop quickly
        }`
);

// Vertical flight controls (jump to rise, crouch/shift to descend):
ent = ent.replace(
    /\} else if \(keys\.jump\) \{\s*if \(flying\) \{\s*this\.velocity\.y \+= 35 \* dt;\s*if \(this\.velocity\.y > 10\) this\.velocity\.y = 10; \/\/ Cap fly speed\s*\} else if \(this\.grounded\) \{/,
    `} else if (flying) {
            if (keys.jump) {
                this.velocity.y = 12;
            } else if (keys.crouch) {
                this.velocity.y = -12;
            } else {
                this.velocity.y -= this.velocity.y * drag * dt;
            }
        } else if (keys.jump) {
            if (this.grounded) {`
);

fs.writeFileSync('slopcraft 3D/js/entities.js', ent);

// ==========================================
// 4. systems.js: Fix creative inventory icons & tooltips & EVERY block
// ==========================================
let sys = fs.readFileSync('slopcraft 3D/js/systems.js', 'utf8');

// Replace _renderCreativeInventory:
const oldRenderCreative = sys.match(/_renderCreativeInventory\(\) \{[\s\S]*?\n    \}/);
if (oldRenderCreative) {
    const newRenderCreative = `_renderCreativeInventory() {
        const panel = document.getElementById('creative-items-grid');
        if (!panel) return;
        panel.innerHTML = '';

        const BLOCKS = window.BLOCKS_REF || window.BLOCKS;
        if (!BLOCKS) return;

        // Skip AIR and internal invisible blocks
        const skip = new Set([0, 27, 77, 119, 126, 131, 194]);
        const entries = Object.entries(BLOCKS)
            .filter(([name, id]) => !skip.has(id) && typeof id === 'number')
            .sort((a,b) => a[1] - b[1]);

        for (const [name, id] of entries) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot creative-item-slot';
            const readableName = name.replace(/_/g,' ').toLowerCase().replace(/\\b\\w/g, c => c.toUpperCase());
            slot.title = readableName;
            slot.dataset.blockId = id;
            slot.dataset.blockName = readableName;

            if (this.atlas) {
                try {
                    // Pass numeric block id so getBlockProperties and uvMap resolve correctly!
                    const icon = this.atlas.getBlockIcon(id);
                    if (icon) {
                        const img = document.createElement('img');
                        img.src = icon.toDataURL();
                        img.className = 'item-icon';
                        img.style.imageRendering = 'pixelated';
                        img.style.width = '100%'; 
                        img.style.height = '100%';
                        img.draggable = false;
                        slot.appendChild(img);
                    }
                } catch(e) {
                    console.warn('Failed to render icon for block', name, id, e);
                }
            }

            // Hover tooltip
            slot.onmouseenter = (e) => {
                if (this.dragState.isDragging || !this.isOpen) return;
                const html = \`<strong style="color:#7c5cff; font-size:16px;">\${readableName}</strong><br/><span style="color:#aaa;">Block (ID: \${id})</span>\`;
                this.elements.tooltip.innerHTML = html;
                this.elements.tooltip.classList.remove('hidden');
                this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
                this.elements.tooltip.style.top = (e.clientY + 15) + 'px';
            };
            slot.onmouseleave = () => {
                this.elements.tooltip.classList.add('hidden');
            };

            // Click / drag to take stack of 64
            slot.onmousedown = (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                const fakeSlot = {
                    item: { 
                        type: 'block', 
                        subtype: id, // numeric ID matching game standard
                        name: readableName, 
                        id: 'block_' + id, 
                        stackable: true, 
                        maxStack: 64 
                    },
                    count: 64
                };
                this.dragState.isDragging = true;
                this.dragState.sourceType = 'creative';
                this.dragState.sourceIndex = -1;
                this.dragState.itemData = fakeSlot;
                this.dragState.isSplit = false;
                this.dragState.offsetX = 0;
                this.dragState.offsetY = 0;
                this.elements.dragIcon.classList.remove('hidden');
                this.renderSlotItem(this.elements.dragIcon, fakeSlot);
                this.updateDragIconPos(e.clientX, e.clientY);
                this.elements.tooltip.classList.add('hidden');
            };

            panel.appendChild(slot);
        }
    }`;
    sys = sys.replace(oldRenderCreative[0], newRenderCreative);
}

fs.writeFileSync('slopcraft 3D/js/systems.js', sys);
console.log('Successfully patched engine, main, entities, and systems!');
