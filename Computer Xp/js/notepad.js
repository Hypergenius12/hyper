/* NOTEPAD APPLICATION LOGIC */

function getActiveNotepadElement(selector) {
    let notepads = Array.from(document.querySelectorAll('.window')).filter(w => w.id.startsWith('notepad-window') && w.style.display !== 'none');
    notepads.sort((a,b) => (parseInt(b.style.zIndex)||0) - (parseInt(a.style.zIndex)||0));
    let active = notepads[0];
    if (active) {
        if (selector === 'textarea') return active.querySelector('textarea');
        if (selector === 'filepath') return active.querySelector('input[type="hidden"]');
        if (selector === 'title') return active.querySelector('.window-title');
    }
    return document.getElementById('notepad-' + selector); // Fallback to template if none open
}

window.clearNotepad = function() {
    let ta = getActiveNotepadElement('textarea');
    let path = getActiveNotepadElement('filepath');
    let title = getActiveNotepadElement('title');
    
    if(ta) ta.value = '';
    if(path) path.value = '';
    if(title) title.innerText = 'Untitled - Notepad';
};

window.openNotepadFile = function(name, content, currentDir) {
    let ta = getActiveNotepadElement('textarea');
    let path = getActiveNotepadElement('filepath');
    let title = getActiveNotepadElement('title');
    
    if(title) title.innerText = name + " - Notepad";
    if(ta) ta.value = content || "";
    if(path) path.value = currentDir + "\\" + name;
    
    // Command the OS to render the Notepad container
    if(typeof window.openProgram === 'function') {
        window.openProgram('notepad-window');
    }
};

window.saveNotepadFile = async function() {
    let pathEl = getActiveNotepadElement('filepath');
    let taEl = getActiveNotepadElement('textarea');
    if(!pathEl || !taEl) return;

    let fullPath = pathEl.value;
    let content = taEl.value;
    
    // Overwriting existing file
    if(fullPath && fullPath !== "") {
        let parts = fullPath.split('\\');
        let filename = parts.pop();
        let dirPath = parts.join('\\');
        
        if(typeof window.resolvePath === 'function') {
            let dir = window.resolvePath(dirPath); 
            if(dir && dir[filename]) {
                dir[filename].content = content;
                if(typeof window.saveFileSystem === 'function') window.saveFileSystem(); 
                if(typeof window.showBalloon === 'function') window.showBalloon("Notepad", "File saved successfully.");
                
                let activeWin = getActiveNotepadElement('window');
                if (activeWin && typeof window.markAppSaved === 'function') {
                    window.markAppSaved(activeWin.id, content);
                }
            } else {
                // If the file doesn't exist anymore for some reason, trigger Save As
                triggerNotepadSaveAs();
            }
        }
    } 
    // Saving brand new unsaved file
    else {
        triggerNotepadSaveAs();
    }
};

window.triggerNotepadSaveAs = function() {
    if(typeof window.openFileDialog === 'function') {
        let titleEl = getActiveNotepadElement('title');
        let currentName = "";
        if(titleEl && titleEl.innerText) {
            currentName = titleEl.innerText.replace(' - Notepad', '').trim();
            if(currentName === 'Untitled') currentName = "";
        }
        
        window.openFileDialog('save', currentName, (info) => {
            let name = info.name || info.filename;
            if(!name) return;
            if(!name.toLowerCase().endsWith('.txt') && !name.toLowerCase().endsWith('.ini') && !name.toLowerCase().endsWith('.log')) name += '.txt';
            
            let dir = window.resolvePath(info.path);
            if(dir) {
                let ta = getActiveNotepadElement('textarea');
                let content = ta ? ta.value : "";
                dir[name] = { type: 'file', extension: name.split('.').pop(), content: content, icon: 'notepad' };
                
                let activeWin = getActiveNotepadElement('window');
                let pathEl = getActiveNotepadElement('filepath');
                if(pathEl) pathEl.value = info.path;
                if(titleEl && activeWin) {
                    titleEl.innerHTML = '<span style="display:flex; align-items:center; gap:5px;"><img src="Windows XP Icons/Notepad.png" class="sys-icon-small"> ' + name + ' - Notepad</span>' +
                    '<div class="window-controls">' +
                        '<div class="win-btn" onclick="minimizeWindow(\'' + activeWin.id + '\')"><img src="Windows XP Icons/Minimize.png" alt="-" style="width:14px;height:12px;display:block;"></div>' +
                        '<div class="win-btn" onclick="maximizeWindow(\'' + activeWin.id + '\')"><img src="Windows XP Icons/Maximize.png" alt="[]" style="width:14px;height:12px;display:block;"></div>' +
                        '<div class="win-btn" onclick="requestCloseWindow(\'' + activeWin.id + '\')"><img src="Windows XP Icons/Exit.png" alt="X" style="width:14px;height:12px;display:block;"></div>' +
                    '</div>';
                }
                
                if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
                if(typeof window.renderDesktop === 'function') window.renderDesktop();
                if(typeof window.showBalloon === 'function') window.showBalloon('Notepad', 'Saved ' + name);
                
                if (activeWin && typeof window.markAppSaved === 'function') {
                    window.markAppSaved(activeWin.id, content);
                }
            }
        }, ['.txt', '.log', '.ini']);
    }
};




