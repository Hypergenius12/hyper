let currentZoom = 1.0;

window.openImageViewer = function(filename, item, currentDir) {
    let win = document.getElementById('imageviewer-window');
    let img = document.getElementById('viewer-img');
    let emptyState = document.getElementById('viewer-empty-state');
    
    if (item && item.content) {
        img.src = item.content;
        img.style.display = 'block';
        if(emptyState) emptyState.style.display = 'none';
        
        let title = document.querySelector('#imageviewer-window-title span');
        if(title) title.innerHTML = '<img src="Windows XP Icons/Windows Picture and Fax Viewer.png" class="sys-icon-small"> ' + (filename || 'Image') + ' - Windows Picture and Fax Viewer';
    } else {
        img.src = '';
        img.style.display = 'none';
        if(emptyState) emptyState.style.display = 'flex';
        let title = document.querySelector('#imageviewer-window-title span');
        if(title) title.innerHTML = '<img src="Windows XP Icons/Windows Picture and Fax Viewer.png" class="sys-icon-small"> Windows Picture and Fax Viewer';
    }
    window.resetZoomImage();
    
    if (typeof window.openProgram === 'function') {
        window.openProgram('imageviewer-window');
    }
};

window.triggerViewerOpen = function() {
    if(typeof window.openFileDialog === 'function') {
        window.openFileDialog('open', '', (pInfo) => {
            let name = pInfo.name || pInfo.filename;
            if(!name) return;
            let dir = window.resolvePath(pInfo.path);
            let item = dir && dir.contents ? dir.contents[name] : (dir ? dir[name] : null);
            if(item) {
                if(item.content && item.content.startsWith('data:image')) {
                    window.openImageViewer(name, item, pInfo.path);
                } else {
                    window.xpDialog("Windows Picture and Fax Viewer", "Cannot open this file format.", "error");
                }
            }
        }, ['.png', '.jpg', '.bmp', '.gif', '.webp']);
    }
};

window.zoomImage = function(factor) {
    let img = document.getElementById('viewer-img');
    if(img) {
        currentZoom *= factor;
        img.style.transform = `scale(${currentZoom})`;
    }
};

window.resetZoomImage = function() {
    currentZoom = 1.0;
    let img = document.getElementById('viewer-img');
    if(img) {
        img.style.transform = `scale(${currentZoom})`;
    }
};

// Also hook openProgram to clear it if opened directly
let origOpenProgramForViewer = window.openProgram;
window.openProgram = function(id) {
    if(id === 'imageviewer-window') {
        // If it's already open, do nothing, otherwise open empty
        let win = document.getElementById('imageviewer-window');
        if(!win || win.style.display === 'none') {
            window.openImageViewer();
            return; // openImageViewer will call openProgram inside
        }
    }
    if(typeof origOpenProgramForViewer === 'function') origOpenProgramForViewer(id);
};
