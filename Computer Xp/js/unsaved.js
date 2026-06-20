window.appSavedStates = {};

window.pendingCloseApp = null;

window.markAppSaved = function(id, content) {
    window.appSavedStates[id] = content;
    if (window.pendingCloseApp === id) {
        window.pendingCloseApp = null;
        if(typeof window.forceCloseWindow === 'function') {
            window.forceCloseWindow(id);
        }
    }
};

window.getAppCurrentState = function(id) {
    if (id.startsWith('notepad-window')) {
        let ta = document.querySelector('#' + id + ' textarea');
        return ta ? ta.value : "";
    }
    if (id === 'wordpad-window') {
        let ed = document.getElementById('wordpad-content');
        return ed ? ed.innerHTML : "";
    }
    if (id === 'frontpage-window') {
        let ca = document.getElementById('fp-code-area');
        return ca ? ca.value : "";
    }
    if (id === 'paint-window') {
        let pc = document.getElementById('paint-canvas');
        return pc ? pc.toDataURL() : "";
    }
    if (id === 'excel-window') {
        let inputs = document.querySelectorAll('#excel-grid td input');
        let data = [];
        inputs.forEach(inp => data.push(inp.value));
        return JSON.stringify(data);
    }
    return null;
};

window.triggerAppSave = function(id) {
    if (id.startsWith('notepad-window')) {
        window.bringToFront(document.getElementById(id));
        if (typeof window.saveNotepadFile === 'function') window.saveNotepadFile();
    }
    else if (id === 'wordpad-window') {
        if (typeof window.triggerWordpadSave === 'function') window.triggerWordpadSave();
    }
    else if (id === 'frontpage-window') {
        if (typeof window.triggerFpSave === 'function') window.triggerFpSave();
    }
    else if (id === 'paint-window') {
        if (typeof window.triggerPaintSaveAs === 'function') window.triggerPaintSaveAs();
    }
    else if (id === 'excel-window') {
        if (typeof window.triggerExcelSave === 'function') window.triggerExcelSave();
    }
};

window.checkUnsavedChanges = function(id, callback) {
    let currentState = window.getAppCurrentState(id);
    if (currentState !== null) {
        let savedState = window.appSavedStates[id] !== undefined ? window.appSavedStates[id] : "";
        
        // Setup default empty states if undefined
        if (window.appSavedStates[id] === undefined) {
            if (id === 'paint-window') {
                let pc = document.getElementById('paint-canvas');
                if (pc) {
                    let tmpCtx = pc.getContext('2d');
                    let oldData = tmpCtx.getImageData(0, 0, pc.width, pc.height);
                    tmpCtx.fillStyle = '#ffffff';
                    tmpCtx.fillRect(0, 0, pc.width, pc.height);
                    savedState = pc.toDataURL();
                    tmpCtx.putImageData(oldData, 0, 0); // Restore
                }
            }
            if (id === 'excel-window') {
                let emptyData = new Array(26 * 50).fill("");
                savedState = JSON.stringify(emptyData);
            }
            if (id === 'frontpage-window') {
                savedState = "<html>\n<head>\n<title>Untitled Normal Page</title>\n</head>\n<body>\n<h1>Welcome to Microsoft FrontPage</h1><p>Edit your webpage here.</p>\n</body>\n</html>";
            }
            if (id === 'wordpad-window') {
                savedState = "";
            }
        }

        if (currentState !== savedState) {
            let docName = "this file";
            if (id.startsWith('notepad')) {
                let titleEl = document.querySelector('#' + id + ' .window-title');
                if(titleEl && titleEl.innerText) docName = titleEl.innerText.replace(' - Notepad', '').trim();
            }
            if (id === 'wordpad-window') {
                let titleEl = document.getElementById('wordpad-window-title');
                if(titleEl && titleEl.innerText) docName = titleEl.innerText.replace(' - WordPad', '').replace('Document', 'Document').trim();
            }
            if (id === 'frontpage-window') {
                if(typeof fpCurrentFile !== 'undefined' && fpCurrentFile) docName = fpCurrentFile;
                else docName = 'index.html';
            }
            if (id === 'paint-window') {
                if(typeof paintCurrentFile !== 'undefined' && paintCurrentFile) docName = paintCurrentFile;
                else docName = 'Untitled';
            }
            if (id === 'excel-window') {
                let titleEl = document.querySelector('#excel-window .title-bar');
                if(titleEl && titleEl.innerText) {
                    let text = titleEl.innerText.replace('Microsoft Excel - ', '').trim();
                    if(text) docName = text;
                }
            }
            
            // Show custom Yes/No/Cancel dialog
            let appName = "Notepad";
            if(id === 'wordpad-window') appName = "WordPad";
            if(id === 'frontpage-window') appName = "FrontPage";
            if(id === 'paint-window') appName = "Paint";
            if(id === 'excel-window') appName = "Microsoft Excel";

            window.showUnsavedDialog(id, appName, docName, callback);
            return;
        }
    }
    callback(true);
};

window.showUnsavedDialog = function(id, appName, docName, callback) {
    let dlgId = 'unsaved-dlg-' + Date.now();
    let dlg = document.createElement('div');
    dlg.className = 'window';
    dlg.id = dlgId;
    dlg.style.width = '350px';
    dlg.style.height = '150px';
    dlg.style.position = 'absolute';
    dlg.style.left = 'calc(50% - 175px)';
    dlg.style.top = 'calc(50% - 75px)';
    dlg.style.zIndex = '10000';
    dlg.style.display = 'flex';
    dlg.style.flexDirection = 'column';
    
    dlg.innerHTML = `
        <div class="title-bar" id="${dlgId}-title">
            <div class="title-bar-text">${appName}</div>
            <div class="window-controls">
                <div class="win-btn" onclick="window.handleUnsavedCancel('${id}', '${dlgId}')"><img src="Windows XP Icons/Exit.png" alt="X" style="width:14px;height:12px;display:block;"></div>
            </div>
        </div>
        <div class="window-body" style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#ece9d8; padding:10px;">
            <div style="display:flex; align-items:center; margin-bottom:20px; width:100%;">
                <img src="Windows XP Icons/Alert.png" style="width:32px; height:32px; margin-right:15px;" onerror="this.style.display='none'">
                <span style="font-family:Tahoma; font-size:11px;">Do you want to save changes to ${docName}?</span>
            </div>
            <div style="display:flex; justify-content:center; gap:10px;">
                <button style="width:75px; margin: 0 5px;" onclick="window.handleUnsavedYes('${id}', '${dlgId}')">Yes</button>
                <button style="width:75px; margin: 0 5px;" onclick="window.handleUnsavedNo('${id}', '${dlgId}')">No</button>
                <button style="width:75px; margin: 0 5px;" onclick="window.handleUnsavedCancel('${id}', '${dlgId}')">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(dlg);
    if(typeof window.makeDraggable === 'function') {
        window.makeDraggable(dlg.id, dlg.id + '-title');
    }
    
    window.unsavedCallbacks = window.unsavedCallbacks || {};
    window.unsavedCallbacks[id] = callback;
};window.handleUnsavedYes = function(id, dlgId) {
    let dlg = document.getElementById(dlgId);
    if(dlg) dlg.remove();
    
    window.pendingCloseApp = id;
    window.triggerAppSave(id);
    
    let cb = window.unsavedCallbacks[id];
    if (cb) cb(false); // Wait for markAppSaved to force close
};window.handleUnsavedNo = function(id, dlgId) {
    let dlg = document.getElementById(dlgId);
    if(dlg) dlg.remove();
    
    // Force close without saving
    window.appSavedStates[id] = undefined;
    
    // Clear content for instantiated apps so they are blank next time
    if(id.startsWith('notepad-window')) {
        let ta = document.querySelector('#' + id + ' textarea');
        if(ta) ta.value = '';
    } else if (id === 'wordpad-window') {
        let ed = document.getElementById('wordpad-content');
        if(ed) ed.innerHTML = '';
    } else if (id === 'excel-window') {
        let inputs = document.querySelectorAll('#excel-grid td input');
        inputs.forEach(inp => inp.value = '');
    } else if (id === 'frontpage-window') {
        let ca = document.getElementById('fp-code-area');
        if(ca) ca.value = "<html>\n<head>\n<title>Untitled Normal Page</title>\n</head>\n<body>\n<h1>Welcome to Microsoft FrontPage</h1><p>Edit your webpage here.</p>\n</body>\n</html>";
    }
    
    let cb = window.unsavedCallbacks[id];
    if (cb) cb(true); // Close it
};

window.handleUnsavedCancel = function(id, dlgId) {
    let dlg = document.getElementById(dlgId);
    if(dlg) dlg.remove();
    let cb = window.unsavedCallbacks[id];
    if (cb) cb(false); // Do not close
};













