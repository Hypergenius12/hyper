(function() {
    'use strict';
    
    let currentImage = null;
    let currentZoom = 1;
    let currentRotation = 0;
    let currentFlipH = 1;
    let currentFlipV = 1;
    let currentFilter = '';

    function updateImageStyle() {
        let img = document.getElementById('photon-img');
        if(!img) return;
        img.style.transform = `scale(${currentZoom * currentFlipH}, ${currentZoom * currentFlipV}) rotate(${currentRotation}deg)`;
        
        let filterStr = '';
        if (currentFilter === 'grayscale') filterStr = 'grayscale(100%)';
        else if (currentFilter === 'invert') filterStr = 'invert(100%)';
        else if (currentFilter === 'brightness') filterStr = 'brightness(150%)';
        else if (currentFilter === 'sepia') filterStr = 'sepia(100%)';
        else if (currentFilter === 'blur') filterStr = 'blur(4px)';
        
        img.style.filter = filterStr;
    }

    window.openPhotonImage = function(filename, url, path) {
        let win = document.getElementById('photon-window');
        if(!win) return;
        
        let doOpen = () => {
            currentZoom = 1;
            currentRotation = 0;
            currentFlipH = 1;
            currentFlipV = 1;
            currentFilter = '';
            
            let img = document.getElementById('photon-img');
            if(img) {
                img.src = url;
                updateImageStyle();
                currentImage = { filename, url, path };
                
                let title = document.getElementById('photon-window-title');
                if(title) {
                    let span = title.querySelector('span');
                    if(span) {
                        span.innerHTML = `<img src="Windows XP Icons/Windows Picture and Fax Viewer.png" class="sys-icon-small" onerror="this.style.display='none'"> ${filename} - Windows Picture and Fax Viewer`;
                    }
                }
            }
            if(typeof window.openProgram === 'function') window.openProgram('photon-window');
        };

        if(win.style.display !== 'none' && currentImage && currentImage.filename !== filename) {
            if(typeof window.xpDialog === 'function') {
                window.xpDialog('Save Changes', 'Do you want to save the current image before opening the new one?', 'confirm').then(ok => {
                    if(ok && typeof window.photonSave === 'function') {
                        window.photonSave();
                    }
                    doOpen();
                });
                return;
            }
        }
        doOpen();
    };;

    window.photonZoom = function(factor) {
        currentZoom *= factor;
        updateImageStyle();
    };
    
    window.photonRotate = function(degrees) {
        currentRotation += degrees;
        updateImageStyle();
    };
    
    window.photonFlip = function(axis) {
        if (axis === 'H') currentFlipH *= -1;
        else if (axis === 'V') currentFlipV *= -1;
        updateImageStyle();
    };
    
    window.photonFilter = function(filterType) {
        if (currentFilter === filterType) currentFilter = ''; // toggle off
        else currentFilter = filterType;
        updateImageStyle();
    };

    function getImagesInDir() {
        if (!currentImage) return [];
        let dir = window.resolvePath(currentImage.path);
        if (!dir) return [];
        let images = [];
        for (let key in dir) {
            let item = dir[key];
            if (item.type === 'file') {
                let ext = key.split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                    images.push({ name: key, content: item.content });
                }
            }
        }
        return images;
    }

    window.photonNext = function() {
        let imgs = getImagesInDir();
        if (imgs.length <= 1) return;
        let idx = imgs.findIndex(i => i.name === currentImage.filename);
        let nextIdx = (idx + 1) % imgs.length;
        window.openPhotonImage(imgs[nextIdx].name, imgs[nextIdx].content, currentImage.path);
    };

    window.photonPrev = function() {
        let imgs = getImagesInDir();
        if (imgs.length <= 1) return;
        let idx = imgs.findIndex(i => i.name === currentImage.filename);
        let prevIdx = (idx - 1 + imgs.length) % imgs.length;
        window.openPhotonImage(imgs[prevIdx].name, imgs[prevIdx].content, currentImage.path);
    };

    window.photonDelete = function() {
        if (!currentImage) return;
        if(typeof window.xpDialog === 'function') {
            window.xpDialog('Confirm Delete', 'Are you sure you want to delete \'' + currentImage.filename + '\'?', 'confirm').then(ok => {
                if(ok) {
                    let dir = window.resolvePath(currentImage.path);
                    if(dir && dir[currentImage.filename]) {
                        delete dir[currentImage.filename];
                        window.saveFileSystem();
                        if(currentImage.path === window.getDesktopPath()) window.renderDesktop();
                        else window.renderExplorer(currentImage.path);
                        
                        window.closeWindow('photon-window');
                    }
                }
            });
        }
    };

    window.photonOpen = function() {
        if (typeof window.openFileDialog === 'function') {
            window.openFileDialog('open', '', (pInfo) => {
                let name = pInfo.name || pInfo.filename;
                if (!name) return;
                let dir = window.resolvePath(pInfo.path);
                if (dir && dir[name]) {
                    window.openPhotonImage(name, dir[name].content, pInfo.path);
                }
            });
        }
    };

    function renderToCanvas(callback) {
        if (!currentImage) return;
        let img = document.getElementById('photon-img');
        if (!img) return;
        
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        
        let naturalWidth = img.naturalWidth;
        let naturalHeight = img.naturalHeight;
        
        if(currentRotation % 180 !== 0) {
            canvas.width = naturalHeight;
            canvas.height = naturalWidth;
        } else {
            canvas.width = naturalWidth;
            canvas.height = naturalHeight;
        }
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((currentRotation * Math.PI) / 180);
        ctx.scale(currentFlipH, currentFlipV);
        
        if (currentFilter === 'grayscale') ctx.filter = 'grayscale(100%)';
        else if (currentFilter === 'invert') ctx.filter = 'invert(100%)';
        else if (currentFilter === 'brightness') ctx.filter = 'brightness(150%)';
        else if (currentFilter === 'sepia') ctx.filter = 'sepia(100%)';
        else if (currentFilter === 'blur') ctx.filter = 'blur(4px)';
        else if (currentFilter === 'red40') ctx.filter = 'sepia(100%) hue-rotate(-50deg) saturate(300%) contrast(150%)';
        else if (currentFilter === 'extra-red40') ctx.filter = 'sepia(100%) hue-rotate(-50deg) saturate(1000%) contrast(200%) brightness(120%)';
        
        ctx.drawImage(img, -naturalWidth / 2, -naturalHeight / 2);
        
        callback(canvas.toDataURL('image/png'));
    }

    window.photonSave = function() {
        if (!currentImage) return;
        renderToCanvas((dataUrl) => {
            let dir = window.resolvePath(currentImage.path);
            if (dir && dir[currentImage.filename]) {
                dir[currentImage.filename].content = dataUrl;
                if (typeof window.saveFileSystem === 'function') window.saveFileSystem();
                currentImage.url = dataUrl; // update internal state
                let img = document.getElementById('photon-img');
                if (img) img.src = dataUrl;
                currentRotation = 0;
                currentFlipH = 1;
                currentFlipV = 1;
                currentFilter = '';
                updateImageStyle();
                
                if (window.currentPath === currentImage.path && typeof window.renderExplorer === 'function') {
                    window.renderExplorer(window.currentPath);
                } else if (currentImage.path.includes("Desktop") && typeof window.renderDesktop === 'function') {
                    window.renderDesktop();
                }
                
                if (typeof window.showBalloon === 'function') window.showBalloon("Photon", "Image saved successfully.");
            }
        });
    };

    window.photonSaveAs = function() {
        if (!currentImage) return;
        if (typeof window.openFileDialog === 'function') {
            window.openFileDialog('save', currentImage.filename, (pInfo) => {
                let name = pInfo.name || pInfo.filename;
                let destPath = pInfo.path;
                if (!name) return;
                
                renderToCanvas((dataUrl) => {
                    let dir = window.resolvePath(destPath);
                    if (dir) {
                        dir[name] = { type: 'file', extension: 'png', content: dataUrl, icon: 'image' };
                        if (typeof window.saveFileSystem === 'function') window.saveFileSystem();
                        
                        currentImage = { filename: name, url: dataUrl, path: destPath };
                        let title = document.getElementById('photon-window-title');
                        if (title) {
                            let span = title.querySelector('span');
                            if(span) span.innerHTML = `<img src="Windows XP Icons/Windows Picture and Fax Viewer.png" class="sys-icon-small" onerror="this.style.display='none'"> ${name} - Photon Picture Viewer`;
                        }
                        
                        currentRotation = 0;
                        currentFlipH = 1;
                        currentFlipV = 1;
                        currentFilter = '';
                        updateImageStyle();
                        let img = document.getElementById('photon-img');
                        if (img) img.src = dataUrl;
                        
                        if (window.currentPath === destPath && typeof window.renderExplorer === 'function') {
                            window.renderExplorer(window.currentPath);
                        } else if (destPath === "C:\\Documents and Settings\\Administrator\\Desktop" && typeof window.renderDesktop === 'function') {
                            window.renderDesktop();
                        }
                        
                        if (typeof window.showBalloon === 'function') window.showBalloon("Photon", "Image saved as " + name);
                    }
                });
            });
        }
    };

    window.photonPrint = function() {
        if (!currentImage) return;
        let img = document.getElementById('photon-img');
        if (!img) return;
        let win = window.open('', '_blank');
        win.document.write('<html><head><title>Print Image</title></head><body style="text-align:center; margin:0; padding:20px;">');
        win.document.write('<img src="' + img.src + '" style="max-width:100%; ' + img.getAttribute('style') + '"/>');
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 500);
    };

})();

window.photonImportFile = function(e) {
    let file = e.target.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = function(ev) {
        let name = file.name;
        let dPath = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop";
        let dDir = window.resolvePath(dPath);
        if(dDir) {
            dDir[name] = {
                type: 'file',
                extension: name.split('.').pop().toLowerCase(),
                content: ev.target.result,
                icon: 'image',
                size: file.size
            };
            try {
                if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
            } catch(err) {
                console.error("Save Error:", err);
                if(typeof window.xpDialog === 'function') {
                    window.xpDialog('Storage Full', 'This image is too large to save permanently to the virtual filesystem, but it will be available until you refresh.', 'error');
                }
            }
            if(typeof window.renderDesktop === 'function') window.renderDesktop();
            window.openPhotonImage(name, ev.target.result, dPath);
        }
    };
    reader.onerror = function(err) {
        console.error("FileReader Error:", err);
        if(typeof window.xpDialog === 'function') {
            window.xpDialog('Import Error', 'Failed to read the file.', 'error');
        }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
};