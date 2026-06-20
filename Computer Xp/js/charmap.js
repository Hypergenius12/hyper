/* CHARACTER MAP APPLICATION */
(function() {
    'use strict';
    
    let selectedChar = "";
    
    window.renderCharmapGrid = function() {
        let grid = document.getElementById('charmap-grid');
        if(!grid) return;
        grid.innerHTML = '';
        
        let font = document.getElementById('charmap-font-select').value;
        
        for (let i = 32; i < 300; i++) {
            let char = String.fromCharCode(i);
            let cell = document.createElement('div');
            cell.className = 'charmap-cell';
            cell.style.fontFamily = font;
            cell.style.background = 'white';
            cell.style.textAlign = 'center';
            cell.style.padding = '4px 0';
            cell.style.border = '1px solid #c0c0c0';
            cell.style.cursor = 'pointer';
            cell.style.fontSize = '14px';
            cell.innerText = char;
            
            cell.onmousedown = () => {
                // Remove selected border from all cells
                document.querySelectorAll('.charmap-cell').forEach(c => {
                    c.style.outline = 'none';
                    c.style.background = 'white';
                    c.style.color = 'black';
                });
                cell.style.background = '#0a246a';
                cell.style.color = 'white';
                selectedChar = char;
                let status = document.getElementById('charmap-status');
                if (status) {
                    status.innerText = `Character: ${char} (U+${i.toString(16).toUpperCase().padStart(4, '0')})`;
                }
            };
            
            grid.appendChild(cell);
        }
    };
    
    window.charmapSelect = function() {
        if(selectedChar) {
            let box = document.getElementById('charmap-copy-text');
            if(box) box.value += selectedChar;
        }
    };
    
    window.charmapCopy = function() {
        let box = document.getElementById('charmap-copy-text');
        if(box && box.value) {
            navigator.clipboard.writeText(box.value).then(() => {
                if(typeof window.showBalloon === 'function') {
                    window.showBalloon('Character Map', 'Copied to clipboard!');
                }
            });
        }
    };
    
    // Auto-init
    let charmapInt = setInterval(() => {
        let grid = document.getElementById('charmap-grid');
        if(grid && grid.children.length === 0) {
            window.renderCharmapGrid();
            // Drag support
            if(window.makeDraggable && document.getElementById('charmap-window-title')) {
                window.makeDraggable('charmap-window', 'charmap-window-title');
            }
            clearInterval(charmapInt);
        }
    }, 1000);
})();
