const fs = require('fs');

// ─── systems.js: fix _renderInventory → use correct inline render calls ───
let sys = fs.readFileSync('slopcraft 3D/js/systems.js', 'utf8');
sys = sys.replace(
    `        document.getElementById('main-inventory-grid').style.display = '';
        document.getElementById('inv-hotbar-grid').style.display = '';
        document.getElementById('crafting-panel').classList.add('hidden');
        this._renderInventory(this.currentPlayer);
        this._renderHotbar(this.currentPlayer);`,
    `        document.getElementById('crafting-panel').classList.add('hidden');
        if (this.currentPlayer) {
            this.renderGrid(this.elements.mainGrid, this.currentPlayer.inventory.slots.slice(9, 36), 9, this.currentPlayer, 'inventory');
            this.renderGrid(this.elements.invHotbar, this.currentPlayer.inventory.slots.slice(0, 9), 0, this.currentPlayer, 'inventory');
        }`
);
fs.writeFileSync('slopcraft 3D/js/systems.js', sys);

// ─── engine.js: replace "type creative" trigger with C key ───
let eng = fs.readFileSync('slopcraft 3D/js/engine.js', 'utf8');

// Remove the keySequence creative check
eng = eng.replace(
    `            if (this.keySequence.endsWith('creative')) {
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
            }`,
    ``
);

// Add C key handling alongside the U key handler
eng = eng.replace(
    `        } else if (e.key.toLowerCase() === 'u') {`,
    `        if (e.key.toLowerCase() === 'c' && !this._menuKeysDown.creative) {
            this._menuKeysDown.creative = true;
            this.creativeMode = !this.creativeMode;
            this._creativeFlying = false;
            const toast = document.getElementById('creative-toast');
            if (toast) {
                toast.textContent = this.creativeMode ? '✦ Creative Mode ON' : '✦ Creative Mode OFF';
                toast.classList.remove('hidden');
                clearTimeout(this._toastTimer);
                this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 2000);
            }
        } else if (e.key.toLowerCase() === 'u') {`
);

// Also clear creative key on keyup
const keyupSection = eng.match(/onKeyUp[\s\S]*?_menuKeysDown\.(map|inventory) = false/);
// Find the keyup handler to clear creative key
eng = eng.replace(
    `        this._menuKeysDown.map = false;`,
    `        this._menuKeysDown.map = false;
        this._menuKeysDown.creative = false;`
);

fs.writeFileSync('slopcraft 3D/js/engine.js', eng);

console.log('Done');
