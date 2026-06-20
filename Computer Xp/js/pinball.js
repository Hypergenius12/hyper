// Pinball initialization and iframe handling
let initIntPinball = setInterval(() => {
    if(window.makeDraggable && document.getElementById('pinball-window-title')) {
        window.makeDraggable('pinball-window', 'pinball-window-title');
        clearInterval(initIntPinball);
    }
}, 500);

let oldOpPin = window.openProgram;
window.openProgram = function(id, icon) {
    if (oldOpPin) oldOpPin(id, icon); // call parent open program first
    
    if (id === 'pinball-window') {
        let frame = document.getElementById('pinball-frame');
        if (frame && (!frame.src || frame.src === 'about:blank' || frame.src.includes('about:blank'))) {
            frame.src = frame.getAttribute('data-src');
        }
        // Attempt to focus the iframe automatically so controls work out of the box
        setTimeout(() => {
            if (frame) frame.focus();
        }, 500);
    }
};

let oldClPin = window.closeWindow;
window.closeWindow = function(id) {
    if (oldClPin) oldClPin(id);
    if (id === 'pinball-window') {
        // Clear iframe to stop audio/gameplay when closed
        let frame = document.getElementById('pinball-frame');
        if (frame) {
            frame.src = 'about:blank';
        }
    }
};
