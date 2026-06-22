var paintMouseUpListener;

window.paintUndoStack = [];
window.paintRedoStack = [];

window.savePaintState = function() {
    if(!paintCanvas) return;
    let pCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
    window.paintUndoStack.push(pCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
    if(window.paintUndoStack.length > 50) window.paintUndoStack.shift();
    window.paintRedoStack = [];
};

window.paintUndo = function() {
    if(window.paintUndoStack.length > 0) {
        let pCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
        window.paintRedoStack.push(pCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
        let state = window.paintUndoStack.pop();
        pCtx.putImageData(state, 0, 0);
    }
};

window.paintRedo = function() {
    if(window.paintRedoStack.length > 0) {
        let pCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
        window.paintUndoStack.push(pCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
        let state = window.paintRedoStack.pop();
        pCtx.putImageData(state, 0, 0);
    }
};

window.paintClear = function() {
    savePaintState();
    let pCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
    pCtx.fillStyle = '#FFFFFF';
    pCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
};

window.floodFill = function(x, y, colorStr) {
    if(!paintCanvas) return;
    let pCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
    let imageData = pCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
    let data = imageData.data;
    let w = paintCanvas.width;
    let h = paintCanvas.height;
    
    // Convert named colors or hex to RGB
    let tempCtx = document.createElement('canvas').getContext('2d');
    tempCtx.fillStyle = colorStr;
    let computedColor = tempCtx.fillStyle; // Should return #RRGGBB
    
    let fillR = parseInt(computedColor.slice(1,3), 16);
    let fillG = parseInt(computedColor.slice(3,5), 16);
    let fillB = parseInt(computedColor.slice(5,7), 16);
    let fillA = 255;
    
    let startIndex = (y * w + x) * 4;
    let startR = data[startIndex];
    let startG = data[startIndex+1];
    let startB = data[startIndex+2];
    let startA = data[startIndex+3];
    
    if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;
    
    let matchColor = function(i) {
        return data[i] === startR && data[i+1] === startG && data[i+2] === startB && data[i+3] === startA;
    };
    
    let colorPixel = function(i) {
        data[i] = fillR;
        data[i+1] = fillG;
        data[i+2] = fillB;
        data[i+3] = fillA;
    };
    
    let pixelStack = [[x, y]];
    
    while(pixelStack.length > 0) {
        let newPos = pixelStack.pop();
        let currX = newPos[0];
        let currY = newPos[1];
        
        let i = (currY * w + currX) * 4;
        while(currY >= 0 && matchColor(i)) {
            currY--;
            i -= w * 4;
        }
        currY++;
        i += w * 4;
        
        let reachLeft = false;
        let reachRight = false;
        
        while(currY < h && matchColor(i)) {
            colorPixel(i);
            
            if (currX > 0) {
                if (matchColor(i - 4)) {
                    if (!reachLeft) {
                        pixelStack.push([currX - 1, currY]);
                        reachLeft = true;
                    }
                } else if (reachLeft) {
                    reachLeft = false;
                }
            }
            
            if (currX < w - 1) {
                if (matchColor(i + 4)) {
                    if (!reachRight) {
                        pixelStack.push([currX + 1, currY]);
                        reachRight = true;
                    }
                } else if (reachRight) {
                    reachRight = false;
                }
            }
            
            currY++;
            i += w * 4;
        }
    }
    
    pCtx.putImageData(imageData, 0, 0);
};

window.setPaintBrushSize = function(size) {
    paintBrushSize = size;
};

let isPainting = false;
let paintStartX = 0;
let paintStartY = 0;
let paintBrushSize = 5;
let paintColor = '#000000';
let paintSecondaryColor = '#FFFFFF';
let paintActiveColor = '#000000';
let paintTool = 'brush';
let paintCurrentFile = 'Untitled.png';
let paintCurrentPath = null;
window.initPaint = function(fileItem, path) {
    let win = document.getElementById('paint-window');
    paintCanvas = document.getElementById('paint-canvas');
    if(!paintCanvas) return;
    
    pCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
    
    if(paintCanvas.dataset.initialized !== 'true') {
        pCtx.fillStyle = '#FFFFFF';
        pCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
        paintCanvas.dataset.initialized = 'true';
    }
    
    if(fileItem && fileItem.content && fileItem.content.startsWith('data:image')) {
        let img = new Image();
        img.onload = () => {
            pCtx.fillStyle = '#FFFFFF';
            pCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
            pCtx.drawImage(img, 0, 0);
        };
        img.src = fileItem.content;
    }
    
    paintCanvas.oncontextmenu = (e) => e.preventDefault();
    paintCanvas.onmousedown = function(e) {
        if (e.button !== 0 && e.button !== 2) return;
        savePaintState();
        isPainting = true;
        
        if (paintTool === 'eraser') {
            paintActiveColor = '#FFFFFF';
        } else {
            paintActiveColor = (e.button === 2) ? paintSecondaryColor : paintColor;
        }
        
        let rect = paintCanvas.getBoundingClientRect();
        let x = Math.floor((e.clientX - rect.left) / (window.paintZoomLevel || 1));
        let y = Math.floor((e.clientY - rect.top) / (window.paintZoomLevel || 1));
        
        paintStartX = x;
        paintStartY = y;
        
        if(paintTool === 'bucket') {
            floodFill(x, y, paintActiveColor);
            isPainting = false;
        } else if (paintTool === 'brush' || paintTool === 'eraser') {
            pCtx.beginPath();
            pCtx.moveTo(x, y);
        }
    };
    
    paintCanvas.onmousemove = function(e) {
        if(!isPainting || paintTool === 'bucket') return;
        let rect = paintCanvas.getBoundingClientRect();
        let x = Math.floor((e.clientX - rect.left) / (window.paintZoomLevel || 1));
        let y = Math.floor((e.clientY - rect.top) / (window.paintZoomLevel || 1));
        
        if (paintTool === 'rect' || paintTool === 'circle' || paintTool === 'line') {
            // Restore last state to clear previous preview
            if (paintUndoStack.length > 0) {
                pCtx.putImageData(paintUndoStack[paintUndoStack.length - 1], 0, 0);
            }
            pCtx.lineWidth = paintBrushSize;
            pCtx.strokeStyle = paintActiveColor;
            pCtx.beginPath();
            
            if (paintTool === 'rect') {
                pCtx.rect(paintStartX, paintStartY, x - paintStartX, y - paintStartY);
            } else if (paintTool === 'circle') {
                let radius = Math.sqrt(Math.pow(x - paintStartX, 2) + Math.pow(y - paintStartY, 2));
                pCtx.arc(paintStartX, paintStartY, radius, 0, 2 * Math.PI);
            } else if (paintTool === 'line') {
                pCtx.moveTo(paintStartX, paintStartY);
                pCtx.lineTo(x, y);
            }
            pCtx.stroke();
        } else {
            // Brush / Eraser
            pCtx.lineWidth = paintTool === 'eraser' ? Math.max(8, paintBrushSize * 2) : paintBrushSize;
            pCtx.strokeStyle = paintActiveColor;
            pCtx.lineCap = 'round';
            
            pCtx.beginPath();
            pCtx.moveTo(paintStartX, paintStartY);
            pCtx.lineTo(x, y);
            pCtx.stroke();
            
            paintStartX = x;
            paintStartY = y;
        }
    };
    
    if (!paintMouseUpListener) {
        paintMouseUpListener = function() {
            if(isPainting) {
                isPainting = false;
                if (paintTool === 'brush' || paintTool === 'eraser') {
                    pCtx.closePath();
                }
            }
        };
        document.addEventListener('mouseup', paintMouseUpListener);
    }
};
window.setPaintTool = function(tool) {
    paintTool = tool;
};

window.setPaintColor = function(color, e) {
    if (e && e.button === 2) {
        paintSecondaryColor = color;
        let ui = document.getElementById('paint-secondary-color-ui');
        if(ui) ui.style.background = color;
    } else {
        paintColor = color;
        let ui = document.getElementById('paint-primary-color-ui');
        if(ui) ui.style.background = color;
    }
};

window.openPaintImage = function(content) {
    let img = new Image();
    img.onload = function() {
        if(!pCtx) initPaint();
        pCtx.fillStyle = '#FFFFFF';
        pCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
        pCtx.drawImage(img, 0, 0);
    }
    img.src = content;
};

window.triggerPaintOpen = function() {
    if(typeof window.openFileDialog === 'function') {
        window.openFileDialog('open', '', (pInfo) => {
            let name = pInfo.name || pInfo.filename;
            if(!name) return;
            let dir = window.resolvePath(pInfo.path);
            let item = dir && dir.contents ? dir.contents[name] : (dir ? dir[name] : null);
            if(item) {
                if(item.content && item.content.startsWith('data:image')) {
                    window.openPaintImage(item.content);
                    document.querySelector('#paint-window .title-bar span').innerText = name + ' - Paint';
                } else {
                    window.xpDialog("Paint", "Cannot open file format.", "error");
                }
            }
        }, ['.png', '.jpg', '.bmp']);
    }
};

window.triggerPaintSaveAs = function() {
    if(typeof window.openFileDialog === 'function') {
        window.openFileDialog('save', paintCurrentFile, (info) => {
            let name = info.name || info.filename;
            if(!name) return;
            if(!name.toLowerCase().endsWith('.png') && !name.toLowerCase().endsWith('.jpg')) name += '.png';
            
            let dir = window.resolvePath(info.path);
            if(dir) {
                let dataUrl = window.paintCanvas.toDataURL();
                dir[name] = { type: 'file', extension: name.split('.').pop(), content: dataUrl, icon: 'paint' };
                paintCurrentFile = name;
                document.querySelector('#paint-window-title span').innerHTML = '<img src="Windows XP Icons/Paint.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> ' + name + ' - Paint';
                
                if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
                if(typeof window.renderDesktop === 'function') window.renderDesktop();
                if(typeof window.showBalloon === 'function') window.showBalloon('Paint', 'Saved ' + name);
                
                if (typeof window.markAppSaved === 'function') window.markAppSaved('paint-window', dataUrl);
            }
        }, ['.png', '.jpg']);
    }
};




// Paint keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (window.activeWindow === 'paint-window' && e.ctrlKey) {
        if (e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (typeof window.paintUndo === 'function') window.paintUndo();
        } else if (e.key.toLowerCase() === 'y') {
            e.preventDefault();
            if (typeof window.paintRedo === 'function') window.paintRedo();
        }
    }
});


// Zoom functionality
window.paintZoomLevel = 1;

window.paintZoomIn = function() {
    window.paintZoomLevel = Math.min(window.paintZoomLevel * 1.1, 5);
    let c = document.getElementById('paint-canvas');
    if(c) c.style.transform = "scale(" + window.paintZoomLevel + ")";
};

window.paintZoomOut = function() {
    window.paintZoomLevel = Math.max(window.paintZoomLevel / 1.1, 0.25);
    let c = document.getElementById('paint-canvas');
    if(c) c.style.transform = "scale(" + window.paintZoomLevel + ")";
};

document.addEventListener('DOMContentLoaded', function() {
    let paintCanvas = document.getElementById('paint-canvas');
    if (paintCanvas) {
        paintCanvas.addEventListener('wheel', function(e) {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    window.paintZoomIn();
                } else {
                    window.paintZoomOut();
                }
            }
        }, {passive: false});
    }
});

let globalPaintCanvas = document.getElementById('paint-canvas');
if (globalPaintCanvas) {
    globalPaintCanvas.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                if(typeof window.paintZoomIn === 'function') window.paintZoomIn();
            } else {
                if(typeof window.paintZoomOut === 'function') window.paintZoomOut();
            }
        }
    }, {passive: false});
}


