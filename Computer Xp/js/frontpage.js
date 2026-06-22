/* MICROSOFT FRONTPAGE SIMULATOR */

let fpCurrentFile = 'index.html';
let fpActiveTab = 'design';

window.initFrontPage = function() {
    let fpIframe = document.getElementById('fp-editor-frame');
    if(fpIframe) {
        let doc = fpIframe.contentDocument || fpIframe.contentWindow.document;
        doc.designMode = "on";
        doc.body.style.fontFamily = "Times New Roman, serif";
        doc.body.style.margin = "8px";
        doc.body.innerHTML = "<h1>Welcome to Microsoft FrontPage</h1><p>Edit your webpage here.</p>";
        
        fpIframe.contentWindow.addEventListener('keyup', syncFpCode);
        fpIframe.contentWindow.addEventListener('mouseup', syncFpCode);
        fpIframe.contentWindow.addEventListener('blur', window.pushFpHistory);
        
        let codeArea = document.getElementById('fp-code-area');
        if (codeArea) {
             codeArea.addEventListener('blur', window.pushFpHistory);
        }
    }
};window.fpUndoStack = [];
window.fpRedoStack = [];
window.fpIsTracking = true;

window.pushFpHistory = function() {
    if (!window.fpIsTracking) return;
    let codeArea = document.getElementById('fp-code-area');
    if(!codeArea) return;
    
    let currentState;
    if(fpActiveTab === 'design' || fpActiveTab === 'split') {
        let fpIframe = document.getElementById('fp-editor-frame');
        let doc = fpIframe.contentDocument || fpIframe.contentWindow.document;
        let html = doc.body.innerHTML;
        html = html.replace(/(<(div|p|h[1-6]|ul|ol|li|table|tr|td|th)>)/gi, '\n$1');
        html = html.replace(/(<\/(div|p|h[1-6]|ul|ol|li|table|tr|td|th)>)/gi, '$1\n');
        
        let currentCode = codeArea.value;
        let bodyRegex = /(<body[^>]*>)([\s\S]*)(<\/body>)/i;
        if (bodyRegex.test(currentCode)) {
            currentState = currentCode.replace(bodyRegex, "$1\n" + html.trim() + "\n$3");
        } else {
            currentState = "<html>\n<head>\n<title>Untitled Normal Page</title>\n</head>\n<body>\n" + html.trim() + "\n</body>\n</html>";
        }
    } else {
        currentState = codeArea.value;
    }

    if(window.fpUndoStack.length === 0 || window.fpUndoStack[window.fpUndoStack.length-1] !== currentState) {
        window.fpUndoStack.push(currentState);
        if(window.fpUndoStack.length > 50) window.fpUndoStack.shift();
        window.fpRedoStack = [];
    }
};

window.triggerFpUndo = function() {
    if(window.fpUndoStack.length > 0) {
        let codeArea = document.getElementById('fp-code-area');
        
        // Before undoing, save current state to redo stack
        let fpIframe = document.getElementById('fp-editor-frame');
        let doc = fpIframe.contentDocument || fpIframe.contentWindow.document;
        let currentHtml = doc.body.innerHTML;
        let currentCode = codeArea.value;
        let bodyRegex = /(<body[^>]*>)([\s\S]*)(<\/body>)/i;
        let exactCurrentState = currentCode;
        if ((fpActiveTab === 'design' || fpActiveTab === 'split') && bodyRegex.test(currentCode)) {
             exactCurrentState = currentCode.replace(bodyRegex, "$1\n" + currentHtml.trim() + "\n$3");
        }
        window.fpRedoStack.push(exactCurrentState);
        
        let state = window.fpUndoStack.pop();
        window.fpIsTracking = false;
        codeArea.value = state;
        if(fpActiveTab === 'design' || fpActiveTab === 'split') {
            syncFpDesign();
        }
        window.fpIsTracking = true;
    }
};

window.triggerFpRedo = function() {
    if(window.fpRedoStack.length > 0) {
        let codeArea = document.getElementById('fp-code-area');
        
        // Before redoing, save current state to undo stack
        let fpIframe = document.getElementById('fp-editor-frame');
        let doc = fpIframe.contentDocument || fpIframe.contentWindow.document;
        let currentHtml = doc.body.innerHTML;
        let currentCode = codeArea.value;
        let bodyRegex = /(<body[^>]*>)([\s\S]*)(<\/body>)/i;
        let exactCurrentState = currentCode;
        if ((fpActiveTab === 'design' || fpActiveTab === 'split') && bodyRegex.test(currentCode)) {
             exactCurrentState = currentCode.replace(bodyRegex, "$1\n" + currentHtml.trim() + "\n$3");
        }
        window.fpUndoStack.push(exactCurrentState);
        
        let state = window.fpRedoStack.pop();
        window.fpIsTracking = false;
        codeArea.value = state;
        if(fpActiveTab === 'design' || fpActiveTab === 'split') {
            syncFpDesign();
        }
        window.fpIsTracking = true;
    }
};

window.fpExecCmd = function(command, value = null) {
    if(command === 'undo') {
        window.triggerFpUndo();
        return;
    }
    if(command === 'redo') {
        window.triggerFpRedo();
        return;
    }

    let fpIframe = document.getElementById('fp-editor-frame');
    if(!fpIframe) return;
    
    if(fpActiveTab !== 'design' && fpActiveTab !== 'split') {
        if(typeof window.xpDialog === 'function') window.xpDialog("FrontPage", "You must be in Design view to apply formatting.", "info");
        return;
    }
    
    let doc = fpIframe.contentDocument || fpIframe.contentWindow.document;
    
    if(command === 'insertImage' || command === 'createLink') {
        value = prompt(command === 'insertImage' ? 'Enter Image URL:' : 'Enter Link URL:');
        if(!value) return;
    }
    
    window.pushFpHistory(); // Push state before executing the command
    doc.execCommand(command, false, value);
    fpIframe.contentWindow.focus();
    syncFpCode();
};window.syncFpCode = function() {
    let fpIframe = document.getElementById('fp-editor-frame');
    let codeArea = document.getElementById('fp-code-area');
    if(!fpIframe || !codeArea) return;
    
    if(fpActiveTab === 'design' || fpActiveTab === 'split') {
        let doc = fpIframe.contentDocument || fpIframe.contentWindow.document;
        // Basic pretty print
        let html = doc.body.innerHTML;
        // Format common block tags
        html = html.replace(/(<(div|p|h[1-6]|ul|ol|li|table|tr|td|th)>)/gi, '\n$1');
        html = html.replace(/(<\/(div|p|h[1-6]|ul|ol|li|table|tr|td|th)>)/gi, '$1\n');
        
        let currentCode = codeArea.value;
        let bodyRegex = /(<body[^>]*>)([\s\S]*)(<\/body>)/i;
        
        if (bodyRegex.test(currentCode)) {
            codeArea.value = currentCode.replace(bodyRegex, "$1\n" + html.trim() + "\n$3");
        } else {
            codeArea.value = "<html>\n<head>\n<title>Untitled Normal Page</title>\n</head>\n<body>\n" + html.trim() + "\n</body>\n</html>";
        }
    }
};window.syncFpDesign = function() {
    let fpIframe = document.getElementById('fp-editor-frame');
    let codeArea = document.getElementById('fp-code-area');
    if(!fpIframe || !codeArea) return;
    
    if(fpActiveTab === 'code' || fpActiveTab === 'split') {
        let doc = fpIframe.contentDocument || fpIframe.contentWindow.document;
        
        // Extract body content if present
        let code = codeArea.value;
        let bodyMatch = code.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if(bodyMatch) {
            doc.body.innerHTML = bodyMatch[1];
        } else {
            doc.body.innerHTML = code;
        }
    }
};

window.setFpTab = function(tabName) {
    if(fpActiveTab === 'code') syncFpDesign();
    else if(fpActiveTab === 'design') syncFpCode();

    fpActiveTab = tabName;
    
    // Update active tab visuals
    document.querySelectorAll('#fp-tabs .tab').forEach(t => t.classList.remove('active'));
    document.getElementById('fp-tab-' + tabName).classList.add('active');
    
    let frameContainer = document.getElementById('fp-frame-container');
    let codeContainer = document.getElementById('fp-code-container');
    
    if(tabName === 'design') {
        frameContainer.style.display = 'block';
        frameContainer.style.height = '100%';
        codeContainer.style.display = 'none';
        let fpIframe = document.getElementById('fp-editor-frame');
        let doc = fpIframe.contentDocument || fpIframe.contentWindow.document;
        doc.designMode = "on";
    } else if(tabName === 'code') {
        frameContainer.style.display = 'none';
        codeContainer.style.display = 'block';
        codeContainer.style.height = '100%';
    } else if(tabName === 'split') {
        frameContainer.style.display = 'block';
        frameContainer.style.height = '50%';
        codeContainer.style.display = 'block';
        codeContainer.style.height = '50%';
        let fpIframe = document.getElementById('fp-editor-frame');
        let doc = fpIframe.contentDocument || fpIframe.contentWindow.document;
        doc.designMode = "on";
    } else if(tabName === 'preview') {
        frameContainer.style.display = 'block';
        frameContainer.style.height = '100%';
        codeContainer.style.display = 'none';
        let fpIframe = document.getElementById('fp-editor-frame');
        let doc = fpIframe.contentDocument || fpIframe.contentWindow.document;
        doc.designMode = "off"; // Readonly for preview
    }
};

window.triggerFpOpen = function() {
    if(typeof window.openFileDialog === 'function') {
        window.openFileDialog('open', '', (info) => {
            let name = info.name || info.filename;
            if(!name) return;
            let dir = window.resolvePath(info.path);
            if(dir && dir[name]) {
                let item = dir[name];
                if(item.content !== undefined) {
                    let codeArea = document.getElementById('fp-code-area');
                    codeArea.value = item.content;
                    fpCurrentFile = name;
                    let span = document.querySelector('#frontpage-window-title span');
                    if (span) span.innerHTML = `<img src="Windows XP Icons/Internet Explorer 6.png" class="sys-icon-small" onerror="this.style.display='none'"> Microsoft FrontPage - ${info.path}\\${name}`;
                    
                    if(fpActiveTab === 'design' || fpActiveTab === 'split') {
                        syncFpDesign();
                    }
                }
            }
        }, ['.htm', '.html', '.txt']);
    }
};

window.triggerFpSaveAs = function() {
    if(typeof window.openFileDialog === 'function') {
        window.openFileDialog('save', fpCurrentFile, (info) => {
            let name = info.name || info.filename;
            if(!name) return;
            if(!name.toLowerCase().endsWith('.html') && !name.toLowerCase().endsWith('.htm')) name += '.html';
            
            let dir = window.resolvePath(info.path);
            if(dir) {
                if(fpActiveTab === 'design') syncFpCode(); 
                
                let content = document.getElementById('fp-code-area').value;
                dir[name] = { type: 'file', extension: name.split('.').pop(), content: content, icon: 'ie' };
                fpCurrentFile = name;
                let titleSpan = document.querySelector('#frontpage-window-title > span');
                if (titleSpan) titleSpan.innerHTML = '<img src="Windows XP Icons/Internet Explorer 6.png" class="sys-icon-small"> Microsoft FrontPage - ' + info.path + '\\' + name;
                
                if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
                if(typeof window.renderDesktop === 'function') window.renderDesktop();
                if(typeof window.showBalloon === 'function') window.showBalloon('FrontPage', 'Saved ' + name);
                
                if (typeof window.markAppSaved === 'function') window.markAppSaved('frontpage-window', content);
            }
        }, ['.htm', '.html']);
    }
};window.triggerFpSave = function() {
    if(fpCurrentFile === 'index.html') {
        triggerFpSaveAs();
    } else {
        // Technically we need to track full path for quick save, but we'll approximate with Desktop
        triggerFpSaveAs();
    }
};

window.openFpTableDialog = function() {
    let dlg = document.getElementById('fp-table-dialog-window');
    if(dlg) {
        if(typeof window.bringToFront === 'function') window.bringToFront(dlg);
        dlg.style.display = 'block';
    }
};

window.insertFpTable = function() {
    let rows = parseInt(document.getElementById('fp-table-rows').value) || 2;
    let cols = parseInt(document.getElementById('fp-table-cols').value) || 2;
    let border = parseInt(document.getElementById('fp-table-border').value) || 0;
    let width = parseInt(document.getElementById('fp-table-width').value) || 100;
    
    let html = '<table border="' + border + '" width="' + width + '%">';
    for(let r=0; r<rows; r++) {
        html += '<tr>';
        for(let c=0; c<cols; c++) {
            html += '<td>&nbsp;</td>';
        }
        html += '</tr>';
    }
    html += '</table>';
    
    let iframe = document.getElementById('fp-editor');
    if(iframe && iframe.contentWindow) iframe.contentWindow.focus();
    
    if(typeof fpExecCmd === 'function') fpExecCmd('insertHTML', html);
    document.getElementById('fp-table-dialog-window').style.display = 'none';
};

window.openFrontpageFile = function(name, content, currentDir) {
    if(typeof window.initFrontPage === 'function') window.initFrontPage();
    let codeArea = document.getElementById('fp-code-area');
    if (codeArea) {
        codeArea.value = content || "";
        if (typeof window.syncFpDesign === 'function') window.syncFpDesign();
        if (typeof window.markAppSaved === 'function') window.markAppSaved('frontpage-window', codeArea.value);
    }
    fpCurrentFile = name;
    
    let titleEl = document.getElementById('frontpage-window-title');
    if (titleEl) {
        let span = titleEl.querySelector('span');
        if (span) span.innerHTML = '<img src="Windows XP Icons/Internet Explorer 6.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> Microsoft FrontPage - ' + currentDir + '\\' + name;
    }
    
    if(fpActiveTab === 'design' || fpActiveTab === 'split') {
        if(typeof window.syncFpDesign === 'function') window.syncFpDesign();
    }
    
    if(typeof window.openProgram === 'function') {
        window.openProgram('frontpage-window');
    }
    
    if (typeof window.markAppSaved === 'function') window.markAppSaved('frontpage-window', content || "");
};



