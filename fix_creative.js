const fs = require('fs');

// ─── 1. engine.js: detect "creative" typed, track double-space for fly toggle ───
let eng = fs.readFileSync('slopcraft 3D/js/engine.js', 'utf8');

// Add creative mode state variables alongside devModeUnlocked
eng = eng.replace(
    '        this.devModeUnlocked = false;',
    `        this.devModeUnlocked = false;
        this.creativeMode = false;
        this._lastSpaceTime = 0;
        this._creativeFlying = false;`
);

// Extend onKeyDown to detect "creative" word and double-space fly toggle
eng = eng.replace(
    `        if (!this.devModeUnlocked) {
            this.keySequence += e.key.toLowerCase();
            if (this.keySequence.length > 6) {
                this.keySequence = this.keySequence.substring(this.keySequence.length - 6);
            }
            if (this.keySequence.endsWith('1001')) {
                this.devModeUnlocked = true;
                this.keySequence = '';
                console.log("Dev Mode Unlocked! Press 'U' to toggle.");
            }`,
    `        if (!this.devModeUnlocked) {
            this.keySequence += e.key.toLowerCase();
            if (this.keySequence.length > 10) {
                this.keySequence = this.keySequence.substring(this.keySequence.length - 10);
            }
            if (this.keySequence.endsWith('1001')) {
                this.devModeUnlocked = true;
                this.keySequence = '';
                console.log("Dev Mode Unlocked! Press 'U' to toggle.");
            }
            if (this.keySequence.endsWith('creative')) {
                this.creativeMode = !this.creativeMode;
                this.keySequence = '';
                this._creativeFlying = false;
                console.log('Creative mode ' + (this.creativeMode ? 'ON' : 'OFF'));
                // Show toast
                const toast = document.getElementById('creative-toast');
                if (toast) {
                    toast.textContent = this.creativeMode ? '✦ Creative Mode Enabled' : '✦ Creative Mode Disabled';
                    toast.classList.remove('hidden');
                    clearTimeout(this._toastTimer);
                    this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
                }
            }`
);

// Handle double-space fly toggle in the Space key press handler
// Find where Space is processed (keys.jump)
eng = eng.replace(
    `        if (e.code === 'Space') {`,
    `        if (e.code === 'Space') {
            // Double-tap space = toggle fly in creative mode
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
            }`
);

fs.writeFileSync('slopcraft 3D/js/engine.js', eng);

// ─── 2. entities.js: use creativeMode flying from input ───
let ent = fs.readFileSync('slopcraft 3D/js/entities.js', 'utf8');
// Find where flying is set from boots and add creative override
ent = ent.replace(
    `        let flying = false;\n        const boots = this.inventory.armor[3];\n        if (boots && boots.item.data.equipData) {\n            if (boots.item.data.equipData.speedMult) speedMult = boots.item.data.equipData.speedMult;\n            if (boots.item.data.equipData.flying) flying = true;\n        }`,
    `        let flying = false;
        const boots = this.inventory.armor[3];
        if (boots && boots.item.data.equipData) {
            if (boots.item.data.equipData.speedMult) speedMult = boots.item.data.equipData.speedMult;
            if (boots.item.data.equipData.flying) flying = true;
        }
        // Creative mode fly override
        if (keys._creativeFlying) flying = true;`
);

// Pass _creativeFlying from input to keys
// In update(world, keys, dt), keys comes from input.getKeys()
// We need to inject it. The cleanest spot is to piggyback on the keys object in main.js
fs.writeFileSync('slopcraft 3D/js/entities.js', ent);

// ─── 3. main.js: pass creativeFlying to player update keys, open creative inventory on E ───
let main = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

// Find where player.update is called and inject _creativeFlying
main = main.replace(
    `this.player.update(this.world, keys, dt);`,
    `keys._creativeFlying = this.input.creativeMode && this.input._creativeFlying;
            this.player.update(this.world, keys, dt);`
);

// Intercept the E key / inventory toggle to open creative inventory instead
main = main.replace(
    `        if (this.input.menuKeys.inventory) {
            this.ui.toggle();
            if (this.ui.isOpen) {
                if (this.input.isPointerLocked()) document.exitPointerLock();
            } else {
                this.input.requestPointerLock();
            }
        }`,
    `        if (this.input.menuKeys.inventory) {
            if (this.input.creativeMode) {
                this.ui.toggleCreative(this.atlas);
                if (this.ui.isOpen) {
                    if (this.input.isPointerLocked()) document.exitPointerLock();
                } else {
                    this.input.requestPointerLock();
                }
            } else {
                this.ui.toggle();
                if (this.ui.isOpen) {
                    if (this.input.isPointerLocked()) document.exitPointerLock();
                } else {
                    this.input.requestPointerLock();
                }
            }
        }`
);

fs.writeFileSync('slopcraft 3D/js/main.js', main);

// ─── 4. systems.js: add toggleCreative and renderCreativeInventory ───
let sys = fs.readFileSync('slopcraft 3D/js/systems.js', 'utf8');

// After the last method before the closing brace of UISystem, add creative methods
// Find the last method signature near the end

// Add creative panel state variable in constructor
sys = sys.replace(
    `        this.currentPlayer = null;`,
    `        this.currentPlayer = null;
        this.isCreativeOpen = false;`
);

// Add toggleCreative method right before the closing } of the class
// Find a reliable insertion point just before end of class
sys = sys.replace(
    `    updateHUD(player, fps, atlas) {`,
    `    toggleCreative(atlas) {
        this.atlas = atlas;
        if (this.isCreativeOpen) {
            // Close creative
            this.isCreativeOpen = false;
            this.isOpen = false;
            document.getElementById('creative-inventory-panel').classList.add('hidden');
            document.getElementById('geometric-ui').classList.add('hidden');
            this.elements.tooltip.classList.add('hidden');
            if (this.dragState.isDragging) this.cancelDrag();
            return;
        }
        // Close any other open panel first
        if (this.chestPos) this.toggleChest(null, null, null, null, null);
        this.isCreativeOpen = true;
        this.isOpen = true;
        this._renderCreativeInventory();
        document.getElementById('creative-inventory-panel').classList.remove('hidden');
        document.getElementById('geometric-ui').classList.remove('hidden');
        // Also show the player's own inventory and hotbar
        document.getElementById('main-inventory-grid').style.display = '';
        document.getElementById('inv-hotbar-grid').style.display = '';
        document.getElementById('crafting-panel').classList.add('hidden');
        this._renderInventory(this.currentPlayer);
        this._renderHotbar(this.currentPlayer);
    }

    _renderCreativeInventory() {
        const panel = document.getElementById('creative-items-grid');
        if (!panel) return;
        panel.innerHTML = '';
        // All placeable/solid-ish blocks grouped sensibly, skip AIR, PORTAL, BOSS_SPAWNER, internal blocks
        const skip = new Set([0,5,25,27,28,111,119,126,131,76,77,194]);
        const BLOCKS = window.BLOCKS_REF;
        if (!BLOCKS) return;
        const entries = Object.entries(BLOCKS)
            .filter(([name, id]) => !skip.has(id) && id > 0 && id < 250)
            .sort((a,b) => a[1] - b[1]);

        for (const [name, id] of entries) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot creative-item-slot';
            slot.title = name.replace(/_/g,' ');
            slot.dataset.blockId = id;

            if (this.atlas) {
                try {
                    const icon = this.atlas.getBlockIcon(name);
                    if (icon) {
                        const img = document.createElement('img');
                        img.src = icon.toDataURL();
                        img.className = 'item-icon';
                        img.style.imageRendering = 'pixelated';
                        img.style.width = '100%'; img.style.height = '100%';
                        img.draggable = false;
                        slot.appendChild(img);
                    }
                } catch(e) {}
            }

            // Click to pick up one stack
            slot.onmousedown = (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                // Give player 64 of this block
                const fakeSlot = {
                    item: { type: 'block', subtype: name, name: name.replace(/_/g,' '), id: 'block_'+id, stackable: true, maxStack: 64 },
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
            };

            panel.appendChild(slot);
        }
    }

    updateHUD(player, fps, atlas) {`
);

// Make cancelDrag handle 'creative' source (just cancel, don't return items)
sys = sys.replace(
    `    cancelDrag() {
        if (!this.dragState.isDragging) return;`,
    `    cancelDrag() {
        if (!this.dragState.isDragging) return;
        if (this.dragState.sourceType === 'creative') {
            this.dragState.isDragging = false;
            this.elements.dragIcon.classList.add('hidden');
            this.dragState.itemData = null;
            return;
        }`
);

fs.writeFileSync('slopcraft 3D/js/systems.js', sys);

// ─── 5. index.html: add creative panel HTML, toast, expose BLOCKS_REF ───
let html = fs.readFileSync('slopcraft 3D/index.html', 'utf8');

// Add creative toast notification
html = html.replace(
    `    <div id="drag-item-icon" class="hidden"></div>`,
    `    <div id="drag-item-icon" class="hidden"></div>
    <div id="creative-toast" class="hidden" style="position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:8px 20px;border-radius:8px;font-family:monospace;font-size:14px;z-index:9999;border:1px solid rgba(255,255,255,0.2);pointer-events:none;"></div>`
);

// Add creative inventory panel before </body>
html = html.replace(
    `    <div id="drag-item-icon" class="hidden"></div>`,
    `    <div id="drag-item-icon" class="hidden"></div>
    <!-- Creative Inventory Panel -->
    <div id="creative-inventory-panel" class="hidden" style="position:fixed;top:50%;right:20px;transform:translateY(-50%);background:rgba(10,10,20,0.97);border:1px solid rgba(124,92,255,0.4);border-radius:12px;padding:16px;z-index:2000;width:400px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 0 30px rgba(100,60,255,0.3);">
      <div style="color:white;font-weight:bold;font-size:1rem;margin-bottom:10px;letter-spacing:2px;opacity:0.8;display:flex;justify-content:space-between;align-items:center;">
        <span>✦ CREATIVE INVENTORY</span>
        <span style="font-size:0.7rem;opacity:0.5;">Drag to inventory or hotbar</span>
      </div>
      <input id="creative-search" placeholder="Search blocks…" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:white;padding:6px 10px;border-radius:6px;margin-bottom:10px;font-family:monospace;font-size:0.85rem;width:100%;box-sizing:border-box;" />
      <div id="creative-items-grid" style="display:grid;grid-template-columns:repeat(7,52px);gap:6px;overflow-y:auto;max-height:60vh;padding-right:4px;"></div>
    </div>`
);

fs.writeFileSync('slopcraft 3D/index.html', html);

// ─── 6. CSS for creative slots ───
let css = fs.readFileSync('slopcraft 3D/css/geometric.css', 'utf8');
css += `
/* Creative inventory slots */
.creative-item-slot {
    width: 52px;
    height: 52px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    cursor: grab;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s;
    user-select: none;
}
.creative-item-slot:hover {
    background: rgba(124,92,255,0.25);
    border-color: rgba(124,92,255,0.6);
}
`;
fs.writeFileSync('slopcraft 3D/css/geometric.css', css);

console.log('Creative mode patch done');
