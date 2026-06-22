/* remoteOSInit */
if(window.location.search.includes('remote=1')) {
    // Modify initial state for Remote Desktop inception
    document.title = "Remote Desktop Session";
    // Change wallpaper to none for performance feeling
try {     localStorage.setItem('xp_wallpaper', 'none');
    localStorage.setItem('xp_wallpaper_color', '#000000'); } catch(e){console.error(e);}
    // Hide volume, network, etc to avoid doubling up
    window.onload = function(orig) {
        return function() {
            if(orig) orig();
            let trays = document.querySelectorAll('.system-tray .sys-icon-small');
            trays.forEach(i => {
                if(!i.src.includes('volume') && !i.src.includes('Network')) i.style.display = 'none';
            });
            // Force solid background
            document.body.style.backgroundImage = 'none';
            document.body.style.backgroundColor = '#004E98';
        };
    }(window.onload);
}

/* Window Management, Desktop Icon Dragging, Settings, Sort Menus and Boot Sequence */

window.currentZIndex = 1000; 
let activeWindows = {};
window.activeWindows = activeWindows;
window.contextMenuTarget = 'desktop';

let customBgDataUrl = null;

const ALL_START_APPS = [
    { id: 'ie', name: 'Internet Explorer', app: 'ie-window', icon: 'ie' },
    { id: 'outlook', name: 'Outlook Express', app: 'email-window', icon: 'Email' },
    { id: 'explorer', name: 'Windows Explorer', app: 'folder-window', icon: 'folder' },
    { id: 'controlpanel', name: 'Control Panel', app: 'settings-window', icon: 'settings' },
    { id: 'cmd', name: 'Command Prompt', app: 'cmd-window', icon: 'cmd', initFn: 'initCmd' },
    { id: 'sysinfo', name: 'System Information', app: 'sysinfo-window', icon: 'sysinfo' },
    { id: 'notepad', name: 'Notepad', app: 'notepad-window', icon: 'notepad', initFn: 'clearNotepad' },
    { id: 'excel', name: 'Microsoft Excel', app: 'excel-window', icon: 'excel' },
    { id: 'wordpad', name: 'WordPad', app: 'wordpad-window', icon: 'wordpad' },
    { id: 'paint', name: 'Paint', app: 'paint-window', icon: 'paint', initFn: 'initPaint' },
    { id: 'calc', name: 'Calculator', app: 'calc-window', icon: 'calc' },
    { id: 'media', name: 'Windows Media Player', app: 'mediaplayer-window', icon: 'media' },
    { id: 'soundrecorder', name: 'Sound Recorder', app: 'soundrecorder-window', icon: 'soundrecorder', initFn: 'initSoundRecorder' },
    { id: 'store', name: 'Windows Catalog', app: 'store-window', icon: 'setup' },
    { id: 'charmap', name: 'Character Map', app: 'charmap-window', icon: 'charmap' },
    { id: 'taskmgr', name: 'Task Manager', app: 'taskmgr-window', icon: 'taskmgr', initFn: 'openTaskManager' },
    { id: 'dataminer', name: 'Data Miner', app: 'main-window', icon: 'mouse', catalog: true },
    { id: 'tetris', name: 'Tetris XP', app: 'tetris-window', icon: 'tetris', catalog: true },
    { id: 'mine', name: 'Minesweeper', app: 'minesweeper-window', icon: 'mine', catalog: true },
    { id: 'solitaire', name: 'Solitaire', app: 'solitaire-window', icon: 'solitaire', catalog: true, initFn: 'solNewGame' },
    { id: 'pinball', name: '3D Pinball', app: 'pinball-window', icon: 'pinball', catalog: true, initFn: 'initPinball' },
    { id: 'photon', name: 'Photon', app: 'photon-window', icon: 'image' },
    { id: 'hearts', name: 'Hearts', app: 'hearts-window', icon: 'hearts', catalog: true, initFn: 'heartsNewGame' },
    { id: 'freecell', name: 'FreeCell', app: 'freecell-window', icon: 'freecell', catalog: true, initFn: 'freecellNewGame' },
    { id: 'spades', name: 'Spades', app: 'spades-window', icon: 'spades', catalog: true, initFn: 'spadesNewGame' },
    { id: 'defrag', name: 'Disk Defragmenter', app: 'defrag-window', icon: 'defrag' },
    { id: 'regedit', name: 'Registry Editor', app: 'regedit-window', icon: 'regedit' },
    { id: 'messenger', name: 'Windows Messenger', app: 'messenger-window', icon: 'messenger', catalog: true, initFn: 'initMessenger' },
    { id: 'defrag', name: 'Disk Defragmenter', app: 'defrag-window', icon: 'defrag', initFn: 'initDefrag' }
];
window.ALL_START_APPS = ALL_START_APPS;

// Sort State
window.currentSort = 'default';
window.autoArrange = false;
window.gridAlign = true;

/* --- SYSTEM SOUNDS (Classic XP WAV Files) --- */
(function() {
    window.sysVolume = 80;
    window.sysMuted = false;
    try {
        window.sysVolume = localStorage.getItem('xp_sys_volume') !== null ? parseInt(localStorage.getItem('xp_sys_volume')) : 80;
        window.sysMuted = localStorage.getItem('xp_sys_muted') === 'true';
    } catch(e){ console.error(e); }

    window.playSound = function(type) {
        if (window.sysMuted) return;

        let soundMap = {
            'startup': 'Windows XP Startup.wav',
            'shutdown': 'Windows XP Shutdown.wav',
            'logon': 'Windows XP Logon Sound.wav',
            'logoff': 'Windows XP Logoff Sound.wav',
            'error': 'Windows XP Error.wav',
            'critical': 'Windows XP Critical Stop.wav',
            'notify': 'Windows XP Notify.wav',
            'balloon': 'Windows XP Balloon.wav',
            'recycle': 'Windows XP Recycle.wav',
            'click': 'Windows Navigation Start.wav',
            'navigate': 'Windows Navigation Start.wav',
            'minimize': 'Windows XP Minimize.wav',
            'restore': 'Windows XP Restore.wav',
            'print': 'Windows XP Print complete.wav',
            'hw_insert': 'Windows XP Hardware Insert.wav',
            'hw_remove': 'Windows XP Hardware Remove.wav',
            'hw_fail': 'Windows XP Hardware Fail.wav',
            'popup_blocked': 'Windows XP Pop-up Blocked.wav',
            'menu': 'Windows XP Menu Command.wav',
            'ding': 'ding.wav',
            'chimes': 'chimes.wav',
            'chord': 'chord.wav',
            'tada': 'tada.wav'
        };

        let file = soundMap[type] || 'Windows XP Default.wav';
        try {
            let audio = new Audio('XP sounds/' + file);
            audio.volume = (window.sysVolume !== undefined ? window.sysVolume : 80) / 100;
            audio.play().catch(e => console.log('Audio playback prevented or error:', e));
        } catch (e) {
            console.error('Failed to play system sound:', e);
        }
    };
})();

/* --- FILESYSTEM MIGRATION: Patch new apps into existing saved desktops --- */
(function() {
    try {
        let deskPath = window.getDesktopPath();
        let deskNode = window.resolvePath(deskPath);
        if(deskNode && deskNode["Windows Messenger.lnk"]) {
            delete deskNode["Windows Messenger.lnk"];
            window.saveFileSystem();
            if (typeof window.renderDesktop === 'function') window.renderDesktop();
        }
    } catch(e) {}
})();

(function() {
    let newShortcuts = {
        "Solitaire.lnk": { type: "exe", app: "solitaire-window", icon: "solitaire" },
        "Outlook Express.lnk": { type: "exe", app: "email-window", icon: "outlook" },
        "System Information.lnk": { type: "exe", app: "sysinfo-window", icon: "sysinfo" },
        "Microsoft Excel.lnk": { type: "exe", app: "excel-window", icon: "excel" },
        "Microsoft FrontPage.lnk": { type: "exe", app: "frontpage-window", icon: "frontpage" },
        "Clipbook Viewer.lnk": { type: "exe", app: "clipbook-window", icon: "sysinfo" }
    };
    // Wait for filesystem to be ready
    setTimeout(() => {
        if(!window.fs || !window.fs["C:"]) return;
        try {
            let users = window.fs["C:"].contents["Documents and Settings"];
            if(!users) return;
            for(let uName in users.contents) {
                let user = users.contents[uName];
                if(!user || !user.contents || !user.contents["Desktop"]) continue;
                let desk = user.contents["Desktop"].contents;
                for(let key in newShortcuts) {
                    if(!desk[key]) desk[key] = newShortcuts[key];
                }
            }
            if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
        } catch(e) {}
    }, 1500);
})();

/* --- DESKTOP ICON TOOLTIPS --- */
const tooltipDescriptions = {
    'Recycle Bin': 'Use the Recycle Bin to retrieve or permanently remove files you have deleted.',
    'My Computer': 'Gives you access to the drives, folders, and files on your computer.',
    'My Documents': 'A place to store and manage your documents.',
    'Control Panel': 'Provides options to customize the appearance and functionality of your computer, add or remove programs, and set up network connections and user accounts.',
    'Data Miner': 'Idle clicker game — mine data bytes and upgrade your system.',
    'Tetris XP': 'Arrange falling blocks to clear lines in this classic puzzle game.',
    'Minesweeper': 'Clear a minefield without detonating a mine in this classic logic game.',
    'Solitaire': 'Plays the classic card game of Klondike Solitaire.',
    'Paint': 'Create and edit pictures using drawing tools, brushes, and color palettes.',
    'Media Player': 'Play audio CDs, audio files, and video files.',
    'Sound Recorder': 'Record, mix, play, and edit audio clips.',
    'Calculator': 'Perform basic and scientific calculations.',
    'Command Prompt': 'Opens a window where you can type MS-DOS commands.',
    'Internet Explorer': 'Browse the World Wide Web and access online resources.',
    'Outlook Express': 'Send and receive e-mail and newsgroup messages.',
    'System Information': 'View detailed information about your computer hardware, software, and components.',
    'WordPad': 'Creates and edits text documents with complex formatting.',
    'Task Manager': 'Provides information about programs and processes running on your computer and the overall system performance.',
    'Notepad': 'A basic text editor you can use to create simple documents or web pages.',
    'Microsoft Excel': 'Perform calculations, analyze information, and manage lists in spreadsheets or web pages by using Microsoft Excel.',
    'Microsoft FrontPage': 'Create and manage professional web pages with a powerful "WYSIWYG" editor.'
};

let tooltipTimer = null;
window.hideDesktopTooltip = function() {
    clearTimeout(tooltipTimer);
    let tt = document.getElementById('xp-tooltip');
    if(tt) tt.style.display = 'none';
};

window.showDesktopTooltip = function(e, name) {
    clearTimeout(tooltipTimer);
    let desc = tooltipDescriptions[name];
    if(!desc) return;
    tooltipTimer = setTimeout(() => {
        let tt = document.getElementById('xp-tooltip');
        if(!tt) return;
        tt.innerText = desc;
        tt.style.display = 'block';
        tt.style.left = (e.pageX + 15) + 'px';
        tt.style.top = (e.pageY + 15) + 'px';
    }, 600);
};

window.switchPropTab = function(btn, tabName) {
    let win = btn.closest('.window');
    if(!win) return;
    let tabs = ['general', 'details'];
    tabs.forEach(t => {
        let b = win.querySelector('#prop-tab-btn-' + t) || win.querySelector('[id^="prop-tab-btn-' + t + '"]');
        let pane = win.querySelector('#prop-tab-' + t);
        if(b) b.classList.remove('active');
        if(pane) pane.style.display = 'none';
    });
    let actBtn = win.querySelector('#prop-tab-btn-' + tabName);
    let actPane = win.querySelector('#prop-tab-' + tabName);
    if(actBtn) actBtn.classList.add('active');
    if(actPane) actPane.style.display = 'block';
};

window.browsePropIcon = function() {
    let icons = ["Windows XP Icons/Application Window.png", "Windows XP Icons/Computer.png", "Windows XP Icons/Control Panel.png", "Windows XP Icons/Desktop.png", "Windows XP Icons/Display Properties.png", "Windows XP Icons/Folder Opened.png", "Windows XP Icons/Folder Closed.png", "Windows XP Icons/Internet Explorer 6.png", "Windows XP Icons/Minesweeper.png", "Windows XP Icons/My Computer.png", "Windows XP Icons/My Documents.png", "Windows XP Icons/Notepad.png", "Windows XP Icons/Paint.png", "Windows XP Icons/Properties.png", "Windows XP Icons/Recycle Bin (empty).png", "Windows XP Icons/Recycle Bin (full).png", "Windows XP Icons/Run.png", "Windows XP Icons/Solitaire.png", "Windows XP Icons/System Properties.png", "Windows XP Icons/TXT.png", "Windows XP Icons/calc.png", "Windows XP Icons/cmd.png"];
    let html = '<div style="display:flex;flex-wrap:wrap;gap:5px;max-height:200px;overflow-y:auto;background:#fff;padding:5px;border:2px inset #ECE9D8;width:300px;">';
    icons.forEach(ic => { html += `<img src="${ic}" style="width:32px;height:32px;cursor:pointer;image-rendering:pixelated;" onclick="document.getElementById('prop-icon').src=this.getAttribute('src'); closeDialog(true);" onmouseover="this.style.background='#D1E8FF'" onmouseout="this.style.background='transparent'">`; });
    html += '</div>';
    if(typeof window.xpDialog === 'function') {
        window.xpDialog('Browse Icons', html, 'info');
    }
};

window.applyFileProperties = function(closeAfter) {
    if(!window.selectedFileContext) return;
    if(!newNameInput) return;
    let newDisplayName = newNameInput.value.trim();
    if(!newDisplayName) return;

    let ctx = window.selectedFileContext;
    let dir = window.resolvePath(ctx.path);
    if(!dir || !dir[ctx.name]) return;
    let item = dir[ctx.name];

    let oldName = ctx.name;
    let ext = oldName.includes('.') ? oldName.substring(oldName.lastIndexOf('.')) : '';
    let isShortcut = oldName.toLowerCase().endsWith('.lnk');
    if(isShortcut) ext = '.lnk';

    let newName = newDisplayName;
    if (isShortcut && !newName.toLowerCase().endsWith('.lnk')) {
        newName += '.lnk';
    }

    let hasChanges = false;
    let imgEl = document.getElementById('prop-icon');
    if(imgEl && imgEl.hasAttribute('src')) {
        let srcAtt = imgEl.getAttribute('src');
        if (srcAtt && item.icon !== srcAtt) {
            item.icon = srcAtt;
            hasChanges = true;
        }
    }

    if(oldName !== newName) {
        if(dir[newName]) {
            if(typeof window.xpDialog === 'function') window.xpDialog('Error', 'A file with that name already exists.', 'error');
            return;
        }
        
        let newExt = newName.includes('.') ? newName.substring(newName.lastIndexOf('.')) : '';
        if (!isShortcut && newExt.toLowerCase() !== ext.toLowerCase()) {
            if (item.icon && item.icon.startsWith('Windows XP Icons/')) {
                delete item.icon; // Force icon recalculation on extension change
            }
            if (item.extension) {
                item.extension = newExt.replace('.', '');
            }
        }
        
        dir[newName] = item;
        delete dir[oldName];
        window.selectedFileContext.name = newName;
        hasChanges = true;
    }

    if(hasChanges) {
        if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
        if(ctx.path.includes('Desktop') && typeof window.renderDesktop === 'function') window.renderDesktop();
        if(ctx.path === window.currentPath && typeof window.renderExplorer === 'function') window.renderExplorer(window.currentPath);
    }

    if (closeAfter) {
        let propWin = document.getElementById('properties-window');
        if(propWin) propWin.style.display = 'none';
    }
};

window.triggerFileOpen = function() {
    if(window.selectedFileContext) {
        let path = window.selectedFileContext.path;
        let name = window.selectedFileContext.name;
        let dir = window.resolvePath(path);
        if(dir && dir[name]) {
            if(typeof executeFile === 'function') executeFile(name, dir[name], path);
        }
    }
};

window.triggerCutContextMenu = function() {
    if(typeof window.showBalloon === 'function') window.showBalloon('Notice', 'Cut functionality is not yet fully implemented. Try Copy.');
};

window.triggerDeleteContextMenu = function() {
    let items = typeof getSelectedFilesInfo === 'function' ? getSelectedFilesInfo() : (window.selectedFileContext ? [window.selectedFileContext] : []);
    if (items.length === 0) return;
    
    let permanentlyDelete = items.some(item => item.path === "C:\\RECYCLER");
    
    let processDelete = () => {
        let hasChanges = false;
        let pathsToRender = new Set();
        let recycler = window.resolvePath("C:\\RECYCLER");
        if (!recycler && !permanentlyDelete) {
            window.fs['C:'].contents['RECYCLER'] = {type:'folder',contents:{}};
            recycler = window.fs['C:'].contents['RECYCLER'].contents;
        }
        
        items.forEach(item => {
            let dir = window.resolvePath(item.path);
            if(dir && dir[item.name]) {
                if (dir[item.name].system) {
                    if(typeof window.triggerBSOD === 'function') {
                        window.triggerBSOD("CRITICAL_PROCESS_DIED");
                    }
                }
                if (!permanentlyDelete && recycler && item.name !== "Recycle Bin.lnk") {
                    recycler[item.name] = dir[item.name];
                }
                if (typeof window.unpinStartItem === 'function') {
                    window.unpinStartItem(item.name.replace(/\.lnk$/i, '').replace(/\.exe$/i, ''));
                }
                delete dir[item.name];
                hasChanges = true;
                pathsToRender.add(item.path);
            }
        });
        
        if (hasChanges) {
            window.saveFileSystem();
            let dPath = typeof window.getDesktopPath === 'function' ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop";
            if(pathsToRender.has(dPath)) window.renderDesktop();
            pathsToRender.forEach(p => {
                if(p === window.currentPath) window.renderExplorer(p);
            });
            if(!permanentlyDelete && window.currentPath === "C:\\RECYCLER") window.renderExplorer("C:\\RECYCLER");
            window.renderDesktop();
        }
    };

    if (permanentlyDelete) {
        let msg = items.length === 1 ? "Are you sure you want to permanently delete '" + items[0].name + "'?" : "Are you sure you want to permanently delete these " + items.length + " items?";
        if(typeof window.xpDialog === 'function') {
            window.xpDialog('Confirm File Delete', msg, 'confirm').then(ok => {
                if(ok) processDelete();
            });
        }
    } else {
        processDelete();
    }
};

window.triggerRenameContextMenu = function() {
    if(!window.selectedFileContext) return;
    let path = window.selectedFileContext.path;
    let name = window.selectedFileContext.name;
    
    // Find matching div
    let selector = path.includes('Desktop') ? '.desktop-icon' : '.file-icon';
    let iconDivs = document.querySelectorAll(selector);
    let targetDiv = null;
    iconDivs.forEach(div => {
        if(div.querySelector('span').innerText === name.replace('.lnk', '')) targetDiv = div;
    });
    
    if(targetDiv && typeof window.triggerRename === 'function') {
        window.triggerRename(targetDiv, name, path);
    }
};

window.singleClickToOpen = false;

const windowTitles = {
    'main-window': 'Data Miner',
    'tetris-window': 'Tetris XP',
    'minesweeper-window': 'Minesweeper',
    'folder-window': 'Explorer',
    'notepad-window': 'Notepad',
    'settings-window': 'Display Properties',
    'xp-dialog': 'Message',
    'mediaplayer-window': 'Windows Media Player',
    'imageviewer-window': 'Windows Picture and Fax Viewer',
    'paint-window': 'Paint',
    'soundrecorder-window': 'Sound Recorder',
    'calc-window': 'Calculator',
    'taskmgr-window': 'Task Manager',
    'cmd-window': 'Command Prompt',
    'ie-window': 'Internet Explorer',
    'wordpad-window': 'WordPad',
    'controlpanel-window': 'Control Panel',
    'properties-window': 'Properties',
    'run-window': 'Run',
    'help-window': 'Help and Support Center',
    'charmap-window': 'Character Map',
    'pinball-window': '3D Pinball for Windows - Space Cadet',
    'photon-window': 'Photon Picture Viewer'
};
window.windowTitles = windowTitles;

/* --- CONTROL PANEL FUNCTIONS --- */
window.openSoundSettings = function() {
    window.openProgram('settings-window');
    setTimeout(() => { if(typeof window.switchSettingsTab === 'function') window.switchSettingsTab('sounds'); }, 100);
};

window.openSystemProperties = function() {
    window.openProgram('settings-window');
    setTimeout(() => { if(typeof window.switchSettingsTab === 'function') window.switchSettingsTab('system'); }, 100);
};

window.openUserAccountSettings = function() {
    window.openProgram('settings-window');
    setTimeout(() => { if(typeof window.switchSettingsTab === 'function') window.switchSettingsTab('user'); }, 100);
};

window.openDateTimeSettings = function() {
    window.openProgram('settings-window');
    setTimeout(() => { if(typeof window.switchSettingsTab === 'function') window.switchSettingsTab('datetime'); }, 100);
};

window.openMouseSettings = function() {
    window.openProgram('settings-window');
    setTimeout(() => { if(typeof window.switchSettingsTab === 'function') window.switchSettingsTab('mouse'); }, 100);
};

window.openKeyboardSettings = function() {
    window.openProgram('settings-window');
    setTimeout(() => { if(typeof window.switchSettingsTab === 'function') window.switchSettingsTab('keyboard'); }, 100);
};

window.openFolderOptions = function() {
    window.openProgram('settings-window');
    setTimeout(() => { if(typeof window.switchSettingsTab === 'function') window.switchSettingsTab('folder'); }, 100);
};

window.openAddRemovePrograms = function() {
    window.openProgram('settings-window');
    setTimeout(() => { if(typeof window.switchSettingsTab === 'function') window.switchSettingsTab('addremove'); }, 100);
};

/* --- POWER STATE MANAGEMENT --- */
window.logOffOS = function() {
    if(typeof window.toggleStartMenu === 'function') window.toggleStartMenu();
    // Close all windows on log off
    Object.keys(activeWindows).forEach(id => window.closeWindow(id));
    let login = document.getElementById('login-screen');
    if(login) login.style.display = 'flex';
    if(typeof window.renderLoginScreen === 'function') window.renderLoginScreen();
};

window.loginOS = function() {
    // Legacy: direct login for Administrator (kept for backwards compat)
    let login = document.getElementById('login-screen');
    let passArea = document.getElementById('login-password-area');
    if(login) login.style.display = 'none';
    if(passArea) {
        passArea.style.display = 'none';
        let input = passArea.querySelector('input');
        if(input) input.value = '';
    }
    if(typeof window.playSound === 'function') window.playSound('startup');
};


window.setMasterVolume = function(val) {
    let vol = parseInt(val);
    if (isNaN(vol)) return;
    window.sysVolume = vol;
    localStorage.setItem('xp_sys_volume', window.sysVolume);

    // Sync UI elements
    let slider1 = document.getElementById('vol-slider');
    if (slider1 && slider1.value != vol) slider1.value = vol;
    
    let slider2 = document.getElementById('setting-volume');
    if (slider2 && slider2.value != vol) slider2.value = vol;
    
    let valText = document.getElementById('vol-val');
    if (valText) valText.innerText = vol + '%';

    // Apply to all audio and video elements
    let mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(el => {
        el.volume = window.sysVolume / 100;
    });
};

window.setMasterMute = function(isMuted) {
    window.sysMuted = !!isMuted;
    localStorage.setItem('xp_sys_muted', window.sysMuted ? 'true' : 'false');

    // Sync UI elements
    let mute1 = document.getElementById('vol-mute');
    if (mute1 && mute1.checked !== window.sysMuted) mute1.checked = window.sysMuted;
    
    let mute2 = document.getElementById('setting-mute');
    if (mute2 && mute2.checked !== window.sysMuted) mute2.checked = window.sysMuted;

    // Apply to all audio and video elements
    let mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(el => {
        el.muted = window.sysMuted;
    });
};

window.toggleStartMenu = function() {
    let menu = document.getElementById('start-menu');
    if(!menu) return;
    if(menu.style.display === 'flex' || menu.style.display === 'block') {
        menu.style.display = 'none';
        // Also hide All Programs overlay and reset button
        let overlay = document.getElementById('all-programs-overlay');
        if (overlay) overlay.style.display = 'none';
        let btn = document.querySelector('.all-programs-btn span');
        if (btn) btn.textContent = 'All Programs';
    } else {
        menu.style.display = 'flex';
        // Bring start menu above other things
        if(typeof window.currentZIndex !== 'undefined') {
            window.currentZIndex++;
            menu.style.zIndex = window.currentZIndex;
        }
        // Sync start menu left panel with installed apps
        if(typeof window.syncStartMenuWithInstalledApps === 'function') {
            window.syncStartMenuWithInstalledApps();
        }
    }
};

window.toggleAllPrograms = function() {
    let overlay = document.getElementById('all-programs-overlay');
    if (!overlay) return;

    let isVisible = overlay.style.display === 'flex' || overlay.style.display === 'block';
    if (isVisible) {
        overlay.style.display = 'none';
        // Restore the normal start menu left side
        let left = document.getElementById('start-menu-left');
        if (left) left.style.display = 'flex';
        // Update "All Programs" button arrow
        let btn = document.querySelector('.all-programs-btn span');
        if (btn) btn.textContent = 'All Programs';
    } else {
        window.renderAllPrograms();
        overlay.style.display = 'flex';
        // Update "All Programs" button arrow
        let btn = document.querySelector('.all-programs-btn span');
        if (btn) btn.textContent = '← Back';
    }
};

window.renderAllPrograms = function() {
    let overlay = document.getElementById('all-programs-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    
    // Add a dedicated Back button at the very top
    let backBtn = document.createElement('div');
    backBtn.className = 'start-menu-item';
    backBtn.style.fontWeight = 'bold';
    backBtn.style.borderBottom = '1px solid #ACA899';
    backBtn.style.paddingBottom = '5px';
    backBtn.style.marginBottom = '5px';
    backBtn.innerHTML = '← Back to Main Menu';
    backBtn.onclick = function() { window.toggleAllPrograms(); };
    overlay.appendChild(backBtn);


    // Define categories with their programs
    let categories = [
        {
            name: 'Accessories',
            icon: 'Windows XP Icons/Folder Closed.png',
            apps: [
                { name: 'Notepad', icon: 'Windows XP Icons/Notepad.png', fn: "if(typeof clearNotepad==='function')clearNotepad(); openProgram('notepad-window'); toggleStartMenu();" },
                { name: 'WordPad', icon: 'Windows XP Icons/Wordpad.png', fn: "openProgram('wordpad-window'); toggleStartMenu();" },
                { name: 'Paint', icon: 'Windows XP Icons/Paint.png', fn: "if(typeof initPaint==='function')initPaint(); openProgram('paint-window'); toggleStartMenu();" },
                { name: 'Calculator', icon: 'Windows XP Icons/Calculator.png', fn: "openProgram('calc-window'); toggleStartMenu();" },
                { name: 'Character Map', icon: 'Windows XP Icons/Charmap.png', fn: "openProgram('charmap-window'); toggleStartMenu();" },
                { name: 'Sound Recorder', icon: 'Windows XP Icons/Generic Audio.png', fn: "openProgram('soundrecorder-window'); toggleStartMenu();" },
                { name: 'Command Prompt', icon: 'Windows XP Icons/Command Prompt.png', fn: "if(typeof initCmd==='function')initCmd(); openProgram('cmd-window'); toggleStartMenu();" },
                { name: 'Clipboard Viewer', icon: 'Windows XP Icons/System Properties.png', fn: "openProgram('clipbook-window'); toggleStartMenu();" },
            ]
        },
        {
            name: 'Games',
            icon: 'Windows XP Icons/Folder Closed.png',
            apps: [
                { name: 'Minesweeper', icon: 'Windows XP Icons/Minesweeper.png', fn: "openProgram('minesweeper-window'); toggleStartMenu();" },
                { name: 'Solitaire', icon: 'Windows XP Icons/Solitaire.png', fn: "openProgram('solitaire-window'); toggleStartMenu();" },
                { name: 'FreeCell', icon: 'Windows XP Icons/Freecell.png', fn: "openProgram('freecell-window'); toggleStartMenu();" },
                { name: 'Hearts', icon: 'Windows XP Icons/Hearts.png', fn: "openProgram('hearts-window'); toggleStartMenu();" },
                { name: 'Internet Spades', icon: 'Windows XP Icons/Internet Spades.png', fn: "openProgram('spades-window'); toggleStartMenu();" },
                { name: '3D Pinball', icon: 'Windows XP Icons/Pinball.png', fn: "openProgram('pinball-window'); toggleStartMenu();" },
            ]
        },
        {
            name: 'System Tools',
            icon: 'Windows XP Icons/Folder Closed.png',
            apps: [
                { name: 'Disk Defragmenter', icon: 'Windows XP Icons/Disk Defragmenter.png', fn: "openProgram('defrag-window'); toggleStartMenu();" },
                { name: 'System Information', icon: 'Windows XP Icons/System Properties.png', fn: "openProgram('sysinfo-window'); toggleStartMenu();" },
                { name: 'Registry Editor', icon: 'Windows XP Icons/Registry Editor.png', fn: "openProgram('regedit-window'); toggleStartMenu();" },
                { name: 'Task Manager', icon: 'Windows XP Icons/Task Manager.png', fn: "if(typeof window.openTaskManager==='function'){window.openTaskManager();}else{openProgram('taskmgr-window');} toggleStartMenu();" },
            ]
        }
    ];

    // Add installed STORE_APPS that aren't already in the categories above
    let coreNames = new Set(['Notepad','WordPad','Paint','Calculator','Character Map','Sound Recorder','Command Prompt','Clipboard Viewer','Minesweeper','Solitaire','FreeCell','Hearts','Internet Spades','3D Pinball','Disk Defragmenter','System Information','Registry Editor','Task Manager']);
    let extras = [];
    if (typeof STORE_APPS !== 'undefined' && typeof window.isAppInstalled === 'function') {
        STORE_APPS.forEach(app => {
            if (window.isAppInstalled(app) && !coreNames.has(app.name)) {
                extras.push({ name: app.name, icon: app.icon, fn: `openProgram('${app.appId}'); toggleStartMenu();` });
            }
        });
    }

    // Render categories
    categories.forEach(cat => {
        // Category header
        let catDiv = document.createElement('div');
        catDiv.style.cssText = 'display:flex; align-items:center; padding:3px 8px 2px 8px; font-size:11px; font-weight:bold; color:#00136B; cursor:default; gap:4px;';
        catDiv.innerHTML = `<img src="${cat.icon}" style="width:16px;height:16px;image-rendering:pixelated;" onerror="this.style.display='none'"><span>${cat.name}</span>`;
        overlay.appendChild(catDiv);

        // Apps in this category
        cat.apps.forEach(app => {
            let item = document.createElement('div');
            item.className = 'start-menu-item';
            item.style.cssText = 'padding-left:24px;';
            item.setAttribute('onclick', app.fn);
            item.innerHTML = `<img src="${app.icon}" class="sys-icon-small" style="margin-right:8px;" onerror="this.style.display='none'"><span>${app.name}</span>`;
            overlay.appendChild(item);
        });
    });

    // Extras from store
    if (extras.length > 0) {
        let catDiv = document.createElement('div');
        catDiv.style.cssText = 'display:flex; align-items:center; padding:3px 8px 2px 8px; font-size:11px; font-weight:bold; color:#00136B; cursor:default; gap:4px; margin-top:4px;';
        catDiv.innerHTML = `<img src="Windows XP Icons/Setup.png" style="width:16px;height:16px;image-rendering:pixelated;" onerror="this.style.display='none'"><span>Installed Programs</span>`;
        overlay.appendChild(catDiv);
        extras.forEach(app => {
            let item = document.createElement('div');
            item.className = 'start-menu-item';
            item.style.cssText = 'padding-left:24px;';
            item.setAttribute('onclick', app.fn);
            let iconSrc = app.icon.startsWith('data:') || app.icon.includes('/') ? app.icon : ('Windows XP Icons/' + app.icon + '.png');
            item.innerHTML = `<img src="${iconSrc}" class="sys-icon-small" style="margin-right:8px;" onerror="this.style.display='none'"><span>${app.name}</span>`;
            overlay.appendChild(item);
        });
    }

    // Separator
    let sep = document.createElement('div');
    sep.className = 'start-menu-divider';
    sep.style.margin = '4px 8px';
    overlay.appendChild(sep);

    // Internet Explorer & Outlook always show at top as XP does
    let topApps = [
        { name: 'Internet Explorer', icon: 'Windows XP Icons/Internet Explorer 6.png', fn: "openProgram('ie-window'); toggleStartMenu();" },
        { name: 'Outlook Express', icon: 'Windows XP Icons/Outlook Express.png', fn: "openProgram('email-window'); toggleStartMenu();" },
        { name: 'Windows Media Player', icon: 'Windows XP Icons/Windows Media Player 9.png', fn: "openProgram('mediaplayer-window'); toggleStartMenu();" },
        { name: 'Windows Messenger', icon: 'Windows XP Icons/Windows Messenger.png', fn: "openProgram('messenger-window'); toggleStartMenu();" },
        { name: 'Remote Desktop', icon: 'Windows XP Icons/Remote Desktop.png', fn: "if(typeof initRemoteDesktop==='function')initRemoteDesktop(); openProgram('remotedesktop-window'); toggleStartMenu();" },
        { name: 'Tour Windows XP', icon: 'Windows XP Icons/Tour XP.png', fn: "openProgram('xptour-window'); toggleStartMenu();" },
        { name: 'Microsoft Excel', icon: 'Windows XP Icons/Graph View.png', fn: "openProgram('excel-window'); toggleStartMenu();" },
        { name: 'Photon Picture Viewer', icon: 'Windows XP Icons/Windows Picture and Fax Viewer.png', fn: "openProgram('photon-window'); toggleStartMenu();" },
    ];

    topApps.forEach(app => {
        let item = document.createElement('div');
        item.className = 'start-menu-item';
        item.setAttribute('onclick', app.fn);
        item.innerHTML = `<img src="${app.icon}" class="sys-icon-small" style="margin-right:8px;" onerror="this.style.display='none'"><span>${app.name}</span>`;
        overlay.insertBefore(item, overlay.firstChild);
    });

    // Top separator after the always-shown apps
    let topSep = document.createElement('div');
    topSep.className = 'start-menu-divider';
    topSep.style.margin = '4px 8px';
    overlay.insertBefore(topSep, overlay.children[topApps.length]);
};
window.shutdownOS = function() {
    if(typeof window.playSound === 'function') window.playSound('shutdown');
    let login = document.getElementById('login-screen');
    let menu = document.getElementById('start-menu');
    let black = document.getElementById('black-screen');
    if(login) login.style.display = 'none';
    if(menu) menu.style.display = 'none';
    setTimeout(() => {
        if(black) black.style.display = 'flex';
        // Reload page to simulate cold boot
        setTimeout(() => location.reload(), 2000);
    }, 800);
};

window.doBootSequence = function() {
    let preOverlay = document.getElementById('pre-boot-overlay');
    if(preOverlay) preOverlay.style.display = 'none';
    let bios = document.getElementById('bios-screen');
    let boot = document.getElementById('boot-screen');
    let login = document.getElementById('login-screen');
    
    if(bios) bios.style.display = 'block';
    if(boot) boot.style.display = 'none';
    if(login) login.style.display = 'none';
    let biosSettings = { fastBoot: false };
    try { biosSettings = JSON.parse(localStorage.getItem('xp_bios_settings')) || { fastBoot: false }; } catch(e){}
    
    if(biosSettings.fastBoot) {
        if(bios) bios.style.display = 'none';
        if(boot) boot.style.display = 'none';
        if(login) {
            if(typeof window.initGuestFS === 'function') window.initGuestFS();
            if(typeof window.renderLoginScreen === 'function') window.renderLoginScreen();
            login.style.display = 'flex';
        }
        return;
    }

    let mem = 0;
    let memInterval = setInterval(() => {
        mem += 20485;
        if(mem >= 1048576) mem = 1048576;
        let memSpan = document.getElementById('bios-mem');
        if(memSpan) memSpan.innerText = mem;
        
        if(mem === 1048576) {
            clearInterval(memInterval);
            let log = document.getElementById('bios-log');
            if(log) {
                log.innerHTML = "Detecting IDE Primary Master ... [Press DEL to enter Setup]<br>";
                setTimeout(() => { log.innerHTML += "Detecting IDE Primary Slave ... None<br>"; }, 600);
                setTimeout(() => { log.innerHTML += "Detecting IDE Secondary Master ... CD-ROM<br>"; }, 1200);
                setTimeout(() => { log.innerHTML += "<br>Booting from Hard Disk...<br>"; }, 1800);
                setTimeout(() => { 
                    if(bios) bios.style.display = 'none';
                    if(boot) boot.style.display = 'flex';
                    // Show Boot screen for 3.5 seconds
                    setTimeout(() => {
                        if(boot) boot.style.display = 'none';
                        if(login) {
                            if(typeof window.initGuestFS === 'function') window.initGuestFS();
                            if(typeof window.renderLoginScreen === 'function') window.renderLoginScreen();
                            login.style.display = 'flex';
                        }
                    }, 3500);
                }, 2800);
            }
        }
    }, 10);
};

/* --- KEYBOARD SHORTCUTS --- */
document.addEventListener('keydown', (e) => {
    // Allow Ctrl+Shift+Esc always (Task Manager)
    if(e.ctrlKey && e.shiftKey && (e.key === 'Escape' || e.key === 'Esc')) {
        e.preventDefault();
        if(typeof window.openTaskManager === 'function') window.openTaskManager();
        return;
    }

    // Globally intercept Ctrl+R to open Run dialog or refresh in-sim IE
    if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        let isWeb = false;
        let activeWinTitle = document.querySelector('.title-bar:not(.inactive)');
        if(activeWinTitle && activeWinTitle.parentElement.id === 'ie-window') {
            isWeb = true;
        }
        if(isWeb) {
            let ifr = document.getElementById('ie-iframe');
            if(ifr) ifr.src = ifr.src;
            else if(typeof window.refreshDesktop === 'function') window.refreshDesktop();
        } else {
            if(typeof window.openProgram === 'function') window.openProgram('run-window');
            setTimeout(() => {
                let runInput = document.getElementById('run-input');
                if(runInput) runInput.focus();
            }, 100);
        }
        return;
    }

    // F5 = refresh desktop
    if(e.key === 'F5') {
        e.preventDefault();
        if(typeof window.refreshDesktop === 'function') window.refreshDesktop();
        return;
    }

    // Let browser handle shortcuts if inside text inputs
    let tag = document.activeElement.tagName;
    let isEditable = document.activeElement.isContentEditable;
    let inTextInput = (tag === 'TEXTAREA' || tag === 'INPUT' || isEditable);
    if (inTextInput) return;

    // Determine what is currently active
    // If there is ANY active window, we DO NOT process desktop shortcuts (unless the window is folder-window)
    let activeWinTitle = document.querySelector('.title-bar:not(.inactive)');
    let activeWin = activeWinTitle ? activeWinTitle.closest('.window') : null;
    let isDesktopFocused = !activeWin || activeWin.style.display === 'none';
    let isFolderFocused = activeWin && activeWin.id === 'folder-window' && activeWin.style.display !== 'none';

    // F2 = rename selected file
    if(e.key === 'F2') {
        if(isDesktopFocused || isFolderFocused) {
            e.preventDefault();
            if(window.selectedFileContext) {
                let sel = document.querySelector('.desktop-icon.selected, .file-icon.selected');
                if(sel && typeof window.triggerRename === 'function') {
                    window.triggerRename(sel, window.selectedFileContext.name, window.selectedFileContext.path);
                }
            }
        }
        return;
    }

    // Delete = delete selected file
    if(e.key === 'Delete') {
        if((isDesktopFocused || isFolderFocused) && window.selectedFileContext) {
            e.preventDefault();
            if(typeof window.triggerDeleteContextMenu === 'function') {
                window.triggerDeleteContextMenu();
            }
        }
        return;
    }

    if (e.ctrlKey) {
        if (e.key === 'a' || e.key === 'A') {
            if (isFolderFocused) {
                e.preventDefault();
                let icons = activeWin.querySelectorAll('.file-icon');
                icons.forEach(ic => ic.classList.add('selected'));
            } else if (isDesktopFocused) {
                e.preventDefault();
                let icons = document.querySelectorAll('.desktop-icon');
                icons.forEach(ic => ic.classList.add('selected'));
            }
        }
        else if (e.key === 'c' || e.key === 'C') { 
            if (isDesktopFocused || isFolderFocused) {
                e.preventDefault(); 
                if(typeof window.triggerCopy === 'function') window.triggerCopy(); 
            }
        }
        else if (e.key === 'x' || e.key === 'X') {
            if (isDesktopFocused || isFolderFocused) {
                e.preventDefault();
                if(typeof window.triggerCopy === 'function') window.triggerCopy();
                if(window.selectedFileContext) {
                    let sfc = window.selectedFileContext;
                    let dir = window.resolvePath(sfc.path);
                    if(dir && dir[sfc.name]) {
                        delete dir[sfc.name];
                        window.saveFileSystem();
                        if(sfc.path.includes('Desktop')) window.renderDesktop();
                        if(sfc.path === window.currentPath) window.renderExplorer(window.currentPath);
                    }
                }
            }
        }
        else if (e.key === 'v' || e.key === 'V') { 
            if (isDesktopFocused || isFolderFocused) {
                e.preventDefault(); 
                if(typeof window.triggerPaste === 'function') window.triggerPaste(); 
            }
        }
    }
});

window.browseRunDialog = function() {
    let runnables = [];
    function traverse(node, path) {
        if (!node) return;
        if (node.type === 'folder' && node.contents) {
            for (let k in node.contents) {
                traverse(node.contents[k], path + '\\\\' + k);
            }
        } else if (node.type === 'exe' || (node.type === 'file' && node.app)) {
            let name = path.split('\\\\').pop();
            if (!name.toLowerCase().includes('dll')) {
                runnables.push({ name: name, cmd: path });
            }
        }
    }
    
    let pfNode = window.resolvePath('C:\\\\Program Files');
    if (pfNode) traverse(pfNode, 'C:\\\\Program Files');
    
    let winNode = window.resolvePath('C:\\\\Windows');
    if (winNode) traverse(winNode, 'C:\\\\Windows');
    
    let html = '<div style="max-height: 250px; overflow-y: auto; text-align: left; padding: 5px; border: 1px solid #ACA899; background: white;">';
    for (let r of runnables) {
        let escapedCmd = r.cmd.replace(/\\/g, '\\\\');
        html += `<div style="padding: 3px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="document.getElementById('run-input').value = '${escapedCmd}'; document.getElementById('xp-dialog-overlay').style.display='none'; document.getElementById('xp-dialog').style.display='none';" onmouseover="this.style.background='#316AC5'; this.style.color='white';" onmouseout="this.style.background='transparent'; this.style.color='black';">${r.name}</div>`;
    }
    html += '</div>';
    
    if(typeof window.xpDialog === 'function') {
        window.xpDialog('Browse Programs', 'Select a program or file to open:<br>' + html, 'info');
    }
};

window.executeRunCmd = function() {
    let input = document.getElementById('run-input');
    if(!input) return;
    let rawCmd = input.value.trim();
    let cmd = rawCmd.toLowerCase();
    
    let mapping = {
        'cmd': 'cmd-window',
        'calc': 'calc-window',
        'notepad': 'notepad-window',
        'mspaint': 'paint-window',
        'explorer': 'folder-window',
        'taskmgr': 'taskmgr-window',
        'control': 'controlpanel-window',
        'winmine': 'minesweeper-window',
        'sol': 'solitaire-window',
        'pinball': 'pinball-window',
        'msimn': 'email-window',
        'msinfo32': 'sysinfo-window',
        'wordpad': 'wordpad-window',
        'write': 'wordpad-window',
        'iexplore': 'ie-window',
        'excel': 'excel-window',
        'charmap': 'charmap-window',
        'wmplayer': 'mediaplayer-window',
        'sndrec32': 'soundrecorder-window',
        'regedit': 'regedit-window',
        'photon': 'photon-window',
        'hearts': 'hearts-window',
        'freecell': 'freecell-window',
        'spades': 'spades-window'
    };
    
    function isAppInstalled(appName) {
        if (!window.resolvePath) return true;
        
        let found = false;
        function checkFolder(node) {
            if (found || !node || node.type !== 'folder' || !node.contents) return;
            
            let match = Object.keys(node.contents).find(f => f.toLowerCase() === appName.toLowerCase() || f.toLowerCase() === appName.toLowerCase() + '.exe');
            if (match) {
                found = true;
                return;
            }
            
            for (let k in node.contents) {
                checkFolder(node.contents[k]);
                if (found) return;
            }
        }

        let sys32 = window.resolvePath('C:\\Windows\\System32');
        if (sys32) checkFolder(sys32);
        if (found) return true;

        let win = window.resolvePath('C:\\Windows');
        if (win) checkFolder(win);
        if (found) return true;

        let prog = window.resolvePath('C:\\Program Files');
        if (prog) checkFolder(prog);
        return found;
    }

    if (rawCmd.startsWith('http://') || rawCmd.startsWith('https://') || rawCmd.startsWith('www.')) {
        window.openProgram('ie-window');
        let url = rawCmd;
        if (url.startsWith('www.')) url = 'http://' + url;
        let addressBar = document.getElementById('ie-address-bar');
        if (addressBar) {
            addressBar.value = url;
            if (typeof window.ieNavigate === 'function') window.ieNavigate(url);
        }
    } else if (rawCmd.startsWith('C:') || rawCmd.startsWith('c:')) {
        let node = window.resolvePath(rawCmd);
        if (node) {
            if (node.type === 'folder' || node.type === 'drive') {
                window.openProgram('folder-window');
                window.navigateTo(rawCmd);
            } else {
                let parts = rawCmd.split('\\');
                let fileName = parts.pop();
                let parentPath = parts.join('\\');
                if (parentPath === "C:") parentPath = "C:\\";
                if (typeof executeFile === 'function') executeFile(fileName, node, parentPath);
            }
        } else {
            window.xpDialog('Run', "Windows cannot find '" + rawCmd + "'. Make sure you typed the name correctly, and then try again.", 'error');
        }
    } else {
        let cleanName = cmd.replace('.exe', '');
        
        if (!isAppInstalled(cleanName)) {
            window.xpDialog('Run', "Windows cannot find '" + rawCmd + "'. Make sure you typed the name correctly, and then try again.", 'error');
            return;
        }

        if (mapping[cleanName]) {
            window.openProgram(mapping[cleanName]);
            if(cleanName === 'sol' && typeof window.solNewGame === 'function') window.solNewGame();
        } else {
            let fallbackApp = typeof ALL_START_APPS !== 'undefined' ? ALL_START_APPS.find(a => a.app.replace('-window', '') === cleanName || a.id === cleanName || (a.name && a.name.toLowerCase() === cleanName)) : null;
            if (fallbackApp) {
                window.openProgram(fallbackApp.app);
                if(fallbackApp.initFn && typeof window[fallbackApp.initFn] === 'function') window[fallbackApp.initFn]();
            } else {
                window.xpDialog('Run', "Windows cannot find '" + rawCmd + "'. Make sure you typed the name correctly, and then try again.", 'error');
            }
        }
    }
    
    let runWin = document.getElementById('run-dialog');
    if(runWin) runWin.style.display = 'none';
};

let fileDialogCallback = null;
let fileDialogMode = 'open'; // 'open', 'save'
let fileDialogExts = null;
let currentFileDialogDir = "C:\\Documents and Settings\\Administrator\\My Documents";

window.openFileDialog = function(mode, defaultFilename, callback, allowedExtensions = null) {
    fileDialogMode = mode;
    fileDialogCallback = callback;
    fileDialogExts = allowedExtensions;
    
    let dlg = document.getElementById('xp-file-dialog');
    let title = document.getElementById('xp-file-dialog-title');
    let btn = document.getElementById('xp-file-dialog-btn');
    let input = document.getElementById('xp-file-dialog-input');
    let dirSelect = document.getElementById('xp-file-dialog-dir');
    
    title.innerText = mode === 'save' ? 'Save As...' : 'Open';
    btn.innerText = mode === 'save' ? 'Save' : 'Open';
    input.value = defaultFilename || '';
    
    if(dirSelect) {
        let user = window.currentAccount || 'Administrator';
        dirSelect.innerHTML = `
            <option value="C:\\">My Computer</option>
            <option value="C:\\Documents and Settings\\${user}\\Desktop">Desktop</option>
            <option value="C:\\Documents and Settings\\${user}\\My Documents" selected>My Documents</option>
        `;
        dirSelect.value = "C:\\Documents and Settings\\" + user + "\\My Documents";
        currentFileDialogDir = dirSelect.value;
    }
    
    let typeSelect = document.getElementById('xp-file-dialog-type');
    if (typeSelect) {
        if (allowedExtensions) {
            let exts = Array.isArray(allowedExtensions) ? allowedExtensions : [allowedExtensions];
            typeSelect.innerHTML = `<option value="filtered">Supported Files (${exts.join(', ')})</option><option value="all">All Files (*.*)</option>`;
        } else {
            typeSelect.innerHTML = `<option value="all">All Files (*.*)</option>`;
        }
    }

    dlg.style.display = 'flex';
    let overlay = document.getElementById('xp-dialog-overlay');
    if(overlay) {
        overlay.style.display = 'flex';
        let zOverlay = ++window.currentZIndex + 1000000;
        overlay.style.zIndex = zOverlay;
        dlg.style.zIndex = zOverlay + 1;
    }
    
    window.renderFileDialogList(dirSelect.value);
};

window.closeFileDialog = function() {
    document.getElementById('xp-file-dialog').style.display = 'none';
    if(document.getElementById('xp-dialog').style.display === 'none') {
        document.getElementById('xp-dialog-overlay').style.display = 'none';
    }
    fileDialogCallback = null;
    if (typeof window.pendingCloseApp !== 'undefined') {
        window.pendingCloseApp = null;
    }
};window.triggerBSOD = function() {
    window.bsodTriggered = true;
    try {
        let audio = new Audio('Windows XP Icons/Windows XP Critical Stop.wav');
        audio.loop = false;
        audio.play().catch(e=>{});
    } catch(e) {}
    // Hide absolutely everything
    document.body.innerHTML = `
        <div style="background-color:#0000AA; color:#FFFFFF; font-family:'Lucida Console', monospace; font-size:16px; padding:30px; height:100vh; display:flex; flex-direction:column; overflow:hidden;">
            <div style="width: 100%; text-align: center; margin-bottom: 20px;">
                <span style="background-color:#FFFFFF; color:#0000AA; padding: 0 10px;">Windows</span>
            </div>
            <div>
                A problem has been detected and Windows has been shut down to prevent damage to your computer.<br><br>
                MULTIPLE_IRP_COMPLETE_REQUESTS<br><br>
                If this is the first time you've seen this Stop error screen, restart your computer. If this screen appears again, follow these steps:<br><br>
                Check to make sure any new hardware or software is properly installed. If this is a new installation, ask your hardware or software manufacturer for any Windows updates you might need.<br><br>
                If problems continue, disable or remove any newly installed hardware or software. Disable BIOS memory options such as caching or shadowing. If you need to use Safe Mode to remove or disable components, restart your computer, press F8 to select Advanced Startup Options, and then select Safe Mode.<br><br>
                Technical information:<br><br>
                *** STOP: 0x00000044 (0x807B4DE0, 0x00001B98, 0x00000000, 0x00000000)<br><br>
                Beginning dump of physical memory<br>
                Physical memory dump complete.<br>
                Contact your system administrator or technical support group for further assistance.
            </div>
            <div style="margin-top:auto; text-align:center; cursor:pointer; color:#AAA;" onclick="location.reload()">
                Press any key to restart...
            </div>
        </div>
    `;
    
    // Play error sound and hook up key listener to restart
    if(typeof window.playSound === 'function') window.playSound('error');
    document.addEventListener('keydown', () => location.reload(), {once: true});
};

window.renderFileDialogList = function(pathStr) {
    let list = document.getElementById('xp-file-dialog-list');
    if(!list) return;
    list.innerHTML = '';
    currentFileDialogDir = pathStr;
    
    let dir = window.resolvePath(pathStr);
    if (!dir) return;
    
    let contents = dir;
    for (let key in contents) {
        let item = contents[key];
        
        let el = document.createElement('div');
        el.style.width = '60px';
        el.style.height = '60px';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.cursor = 'pointer';
        el.style.padding = '2px';
        
        let iconPath = "Windows XP Icons/Folder Closed.png";
        if(item.icon && sysIcons[item.icon]) iconPath = sysIcons[item.icon];
        
        let img = document.createElement('img');
        img.src = iconPath;
        img.style.width = '32px';
        img.style.height = '32px';
        if(iconPath.startsWith('data:image/svg+xml')) img.style.content = `url("${iconPath}")`;
        
        let span = document.createElement('span');
        span.innerText = key;
        span.style.fontSize = '10px';
        span.style.fontFamily = 'Tahoma';
        span.style.textAlign = 'center';
        span.style.whiteSpace = 'nowrap';
        span.style.overflow = 'hidden';
        span.style.textOverflow = 'ellipsis';
        span.style.width = '100%';
        
        let typeSelect = document.getElementById('xp-file-dialog-type');
        let filterActive = typeSelect && typeSelect.value === 'filtered' && fileDialogExts && fileDialogExts.length > 0;
        
        if (item.type !== 'folder' && filterActive) {
            let match = fileDialogExts.some(ext => key.toLowerCase().endsWith(ext.toLowerCase()));
            if (!match) continue; // skip non-matching files
        }

        el.onclick = () => {
            if(item.type === 'folder') {
                let nPath = pathStr.endsWith('\\') ? pathStr + key : pathStr + "\\" + key;
                window.renderFileDialogList(nPath);
                let sel = document.getElementById('xp-file-dialog-dir');
                if(sel && !Array.from(sel.options).some(o => o.value === nPath)) {
                    let opt = document.createElement('option');
                    opt.value = nPath; opt.innerText = key;
                    sel.appendChild(opt);
                }
                if(sel) sel.value = nPath;
            } else {
                let input = document.getElementById('xp-file-dialog-input');
                if(input) input.value = key;
            }
        };
        el.ondblclick = () => {
            if(item.type === 'file') {
                let input = document.getElementById('xp-file-dialog-input');
                if(input) input.value = key;
                window.submitFileDialog();
            }
        };
        el.appendChild(img);
        el.appendChild(span);
        list.appendChild(el);
    }
};

window.submitFileDialog = function() {
    let input = document.getElementById('xp-file-dialog-input');
    if(!input) return;
    let val = input.value;
    if(val && fileDialogCallback) {
        let pathStr = currentFileDialogDir;
        
        if (pathStr === "C:\\RECYCLER" || pathStr.startsWith("C:\\RECYCLER\\")) {
            if(typeof window.xpDialog === 'function') {
                window.xpDialog('Recycle Bin', 'You cannot open or save files directly in the Recycle Bin. Please restore the file first or choose another location.', 'error');
            }
            return;
        }

        let finalVal = val;
        if (fileDialogMode === 'save' && fileDialogExts && fileDialogExts.length > 0) {
            let hasExt = false;
            for (let ext of fileDialogExts) {
                if (finalVal.toLowerCase().endsWith(ext.toLowerCase())) {
                    hasExt = true;
                    break;
                }
            }
            if (!hasExt) finalVal += fileDialogExts[0];
        }
        
        if (fileDialogMode === 'save') {
            let dir = window.resolvePath(pathStr);
            if (dir) {
                let item = dir[finalVal] || (dir.contents && dir.contents[finalVal]);
                if (item) {
                    window.xpDialog('Save As', finalVal + ' already exists.\\nDo you want to replace it?', 'confirm').then(res => {
                        if (res) {
                            fileDialogCallback({ path: pathStr, filename: val });
                            window.closeFileDialog();
                        }
                    });
                    return; // Don't close or callback yet
                }
            }
        }
        
        let pInfo = { path: pathStr, filename: val };
        fileDialogCallback(pInfo);
    }
    window.closeFileDialog();
};

window.toggleNetConnection = function() {
    let btn = document.getElementById('net-toggle-btn');
    if (!btn) return;
    let netIcon = document.getElementById('tray-network');
    
    if (btn.innerText === "Disable") {
        btn.innerText = "Enable";
        if (netIcon) netIcon.style.opacity = '0.5';
        if (typeof window.xpDialog === 'function') window.xpDialog('Network Connections', 'Local Area Connection is now disabled.', 'info');
    } else {
        btn.innerText = "Disable";
        if (netIcon) netIcon.style.opacity = '1';
        if (typeof window.xpDialog === 'function') window.xpDialog('Network Connections', 'Local Area Connection is now enabled.', 'info');
    }
};

/* --- APP DROPDOWN MENUS --- */
window.toggleAppMenu = function(element, event) {
    event.stopPropagation();
    document.querySelectorAll('.app-menu-dropdown').forEach(menu => {
        if (menu !== element.nextElementSibling) menu.style.display = 'none';
    });
    let dropdown = element.nextElementSibling;
    if(dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
};

document.addEventListener("click", function(event) {
    let ctxD = document.getElementById("context-menu-desktop");
    let ctxF = document.getElementById("context-menu-file");
    let ctxR = document.getElementById("context-menu-regedit");
    let ctxS = document.getElementById("context-menu-startitem");
    if(ctxD && !event.target.closest('.has-submenu')) ctxD.style.display = "none";
    if(ctxF && !event.target.closest('.has-submenu')) ctxF.style.display = "none";
    if(ctxR && !event.target.closest('.has-submenu')) ctxR.style.display = "none";
    if(ctxS && !event.target.closest('.has-submenu')) ctxS.style.display = "none";
    if(event.target.id === 'desktop' && typeof window.xpClearSelection === 'function' && !window.justFinishedLasso) window.xpClearSelection('desktop');
    if(event.target.id === 'explorer-content' && typeof window.xpClearSelection === 'function' && !window.justFinishedLasso) window.xpClearSelection('folder');
    document.querySelectorAll('.app-menu-dropdown').forEach(menu => menu.style.display = 'none');
});

/* --- WINDOW MANAGEMENT --- */
window.bringToFront = function(element) {
    if (typeof window.xpClearSelection === 'function') window.xpClearSelection('desktop');
    window.currentZIndex++;
    element.style.zIndex = window.currentZIndex;
    document.querySelectorAll('.window .title-bar').forEach(tb => tb.classList.add('inactive'));
    let tb = element.querySelector('.title-bar');
    if(tb) tb.classList.remove('inactive');
    document.querySelectorAll('.task-item').forEach(task => task.classList.remove('active'));
    let taskBtn = document.getElementById('task-' + element.id);
    if(taskBtn) taskBtn.classList.add('active');
};

window.openProgram = function(id) {
    if(id === 'paint-window' && typeof window.initPaint === 'function') window.initPaint();
    if(id === 'defrag-window' && typeof window.initDefrag === 'function') window.initDefrag();
    if(id === 'xptour-window' && typeof window.initXpTour === 'function') window.initXpTour();
    if(id === 'messenger-window' && typeof window.initMessenger === 'function') window.initMessenger();
    if(id === 'remotedesktop-window' && typeof window.initRemoteDesktop === 'function') window.initRemoteDesktop();
    if(id === 'store-window' && typeof window.renderStore === 'function') window.renderStore();
    if(id === 'frontpage-window' && typeof window.initFrontPage === 'function') window.initFrontPage();
    if(id === 'cmd-window' && typeof window.initCmd === 'function') window.initCmd();
    if(id === 'soundrecorder-window' && typeof window.initSoundRecorder === 'function') window.initSoundRecorder();
    // Lazy-load IE iframe so it doesn't block page load
    if(id === 'ie-window') {
        let ieFrame = document.getElementById('ie-frame');
        if(ieFrame && ieFrame.src === 'about:blank' && ieFrame.dataset.src) {
            ieFrame.src = ieFrame.dataset.src;
        }
    }
    let win = document.getElementById(id);
    if (!win) return;
    
    let wasMinimized = win.classList.contains('minimized');
    win.style.setProperty('display', 'flex', 'important');
    win.classList.remove('minimized');
    
    if (wasMinimized) {
        win.classList.add('restoring');
        setTimeout(() => win.classList.remove('restoring'), 200);
        if (typeof window.playSound === 'function') window.playSound('restore');
    }
    
    if(!win.style.top || parseInt(win.style.top) < 0) win.style.top = "50px";
    if(!win.style.left || parseInt(win.style.left) < 0) win.style.left = "100px";

    if(!activeWindows[id]) {
        let tasks = document.getElementById('taskbar-tasks');
        let btn = document.createElement('div');
        btn.className = 'task-item';
        btn.id = 'task-' + id;
        btn.oncontextmenu = function(e) {
            e.preventDefault();
            if(typeof window.showTaskbarContextMenu === 'function') {
                window.showTaskbarContextMenu(e, id);
            }
        };
        
        if(id === 'spades-window' && typeof window.spadesNetworkWait === 'function') {
            window.spadesNetworkWait();
        }
        
        let titleEl = document.getElementById(id + '-title');
        let titleText = id;
        if (titleEl) {
            let span = titleEl.querySelector('span');
            if (span) {
                titleText = (span.innerText || span.textContent).trim();
            } else {
                let clone = titleEl.cloneNode(true);
                let toRemove = clone.querySelectorAll('.win-btn, .app-menu-item, .window-controls');
                toRemove.forEach(b => b.remove());
                titleText = (clone.innerText || clone.textContent).trim();
            }
        }
        
        let iconHtml = window.appIcons && window.appIcons[id] ? '<img src="' + window.appIcons[id] + '" style="width:16px;height:16px;flex-shrink:0;"> ' : '';
        btn.innerHTML = iconHtml + '<span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + (titleText || 'Window') + '</span>';
        
        btn.onclick = () => {
            let w = document.getElementById(id);
            if(w.style.display !== 'none' && w.style.zIndex == window.currentZIndex && !w.classList.contains('minimized')) {
                window.minimizeWindow(id);
            } else {
                window.openProgram(id);
            }
        };
        tasks.appendChild(btn);
        activeWindows[id] = true;
    }
    window.bringToFront(win);
    
    if(id === 'explorer-window' && typeof window.renderExplorer === 'function') {
        setTimeout(() => {
            if(typeof window.autoArrange !== 'undefined' && window.autoArrange && window.currentPath === window.getDesktopPath()) window.arrangeIcons(typeof window.currentSort !== 'undefined' ? window.currentSort : 'default');
        }, 50);
    }
};

window.minimizeWindow = function(id) {
    let win = document.getElementById(id);
    if(win) {
        let taskBtn = document.getElementById('task-' + id);
        win.classList.add('minimizing');
        setTimeout(() => {
            win.style.display = 'none';
            win.classList.remove('minimizing');
            win.classList.add('minimized');
        }, 200);
        if (typeof window.playSound === 'function') window.playSound('minimize');
    }
    let taskBtn = document.getElementById('task-' + id);
    if(taskBtn) taskBtn.classList.remove('active');
};

window.maximizeWindow = function(id) {
    let win = document.getElementById(id);
    if(win) { 
        win.style.display = 'block';
        if(win.id === 'ie-window' || win.id === 'email-window' || win.id === 'email-compose-window' || win.id === 'email-read-window' || win.id === 'frontpage-window' || win.id === 'cmd-window') win.style.display = 'flex';
        win.classList.remove('minimized');
        win.classList.toggle('maximized');
        window.bringToFront(win);
        let taskBtn = document.getElementById('task-' + id);
        if(taskBtn) taskBtn.classList.add('active');
    }
};

/* --- CUSTOM XP ASYNC DIALOG SYSTEM --- */
let dialogResolve = null;

window.xpDialog = function(title, text, type = 'info', defaultValue = '') {
    document.querySelectorAll('.app-menu-dropdown').forEach(menu => menu.style.display = 'none');
    return new Promise((resolve) => {
        let overlay = document.getElementById('xp-dialog-overlay');
        if(!overlay) return resolve(null);
        
        overlay.style.display = 'flex';
        window.currentZIndex += 10;
        let zOverlay = window.currentZIndex + 1000000;
        overlay.style.zIndex = zOverlay;
        
        let dialogWin = document.getElementById('xp-dialog');
        if(dialogWin) {
            dialogWin.style.display = 'flex';
            dialogWin.style.zIndex = zOverlay + 1;
        }
        
        let dTitle = document.getElementById('xp-dialog-title');
        let dText = document.getElementById('xp-dialog-text');
        if(dTitle) dTitle.innerText = title;
        if(dText) dText.innerHTML = text.replace(/\\n/g, '<br>');
        
        let input = document.getElementById('xp-dialog-input');
        let btnCancel = document.getElementById('xp-dialog-cancel');
        let icon = document.getElementById('xp-dialog-icon');

        if(input) input.style.display = 'none';
        if(btnCancel) btnCancel.style.display = 'none';
        if(icon) {
            if(type === 'error') {
                icon.innerHTML = '<img src="Windows XP Icons/error.webp" style="width:32px; height:32px;">';
            } else {
                icon.innerHTML = (type === 'prompt' ? '<img src="Windows XP Icons/Help.png" style="width:24px">' : '<img src="Windows XP Icons/Info.png" style="width:24px">');
            }
        }
        // Play sounds for dialogs
        if(type === 'error' && typeof window.playSound === 'function') {
            window.playSound('error');
        } else if(typeof window.playSound === 'function') {
            window.playSound('ding');
        }

        if (type === 'prompt') {
            if(input) { input.style.display = 'block'; input.value = defaultValue; input.focus(); }
            if(btnCancel) btnCancel.style.display = 'inline-block';
        } else if (type === 'confirm') {
            if(btnCancel) btnCancel.style.display = 'inline-block';
                if(icon) icon.innerHTML = '<img src="Windows XP Icons/Help.png" style="width:24px">';
        }

        dialogResolve = resolve;
    });
};

window.closeDialog = function(isOk) {
    let dialogWin = document.getElementById('xp-dialog');
    if(dialogWin) dialogWin.style.display = 'none';

    let fd = document.getElementById('xp-file-dialog');
    if(!fd || fd.style.display === 'none') {
        let overlay = document.getElementById('xp-dialog-overlay');
        if(overlay) overlay.style.display = 'none';
    }
    if (dialogResolve) {
        let input = document.getElementById('xp-dialog-input');
        let type = (input && input.style.display === 'block') ? 'prompt' : 'other';
        if (type === 'prompt') dialogResolve(isOk ? input.value : null);
        else dialogResolve(isOk);
        dialogResolve = null;
    }
};

window.forceCloseWindow = function(id) {
    let win = document.getElementById(id);
    if(win) win.style.display = 'none';
    let taskBtn = document.getElementById('task-' + id);
    if(taskBtn) { taskBtn.remove(); delete activeWindows[id]; }
    
    // Outlook Express custom closing logic
    if (id === 'email-window' && window.emailOptions && window.emailOptions.emptyDeleted && window.emailData) {
        window.emailData.deleted = [];
    }
};

window.closeWindow = function(id) {
    if (typeof window.checkUnsavedChanges === 'function' && 
       (id.startsWith('notepad-window') || id === 'wordpad-window' || id === 'frontpage-window' || id === 'paint-window' || id === 'excel-window')) {
        window.checkUnsavedChanges(id, function(canClose) {
            if(canClose) window.forceCloseWindow(id);
        });
    } else {
        window.forceCloseWindow(id);
    }
};window.makeDraggable = function(windowId, handleId) {
    let elmnt = typeof windowId === 'string' ? document.getElementById(windowId) : windowId;
    let handle = typeof handleId === 'string' ? document.getElementById(handleId) : handleId;
    if(!elmnt || !handle) return;
    
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = function(e) {
        if(e.target.className.includes('win-btn') || elmnt.classList.contains('maximized')) return; 
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        if(typeof window.bringToFront === 'function') window.bringToFront(elmnt);
    };
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        let newTop = elmnt.offsetTop - pos2;
        if(newTop < 0) newTop = 0;
        elmnt.style.top = newTop + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
    function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }

    let lockedWindows = ['xp-dialog', 'run-window', 'folder-options-window', 'xptour-window', 'sysinfo-window', 'calc-window', 'soundrecorder-window', 'charmap-window', 'properties-window'];
    let wId = typeof windowId === 'string' ? windowId : elmnt.id;
    if(wId && lockedWindows.includes(wId)) return;
    if(elmnt.querySelector('.resize-handle')) return;

    let resizer = document.createElement('div');
    resizer.className = 'resize-handle';
    elmnt.appendChild(resizer);
    
    let rpos1 = 0, rpos2 = 0, startW = 0, startH = 0;
    resizer.onmousedown = function(e) {
        if(elmnt.classList.contains('maximized')) return;
        e = e || window.event;
        e.preventDefault();
        rpos1 = e.clientX;
        rpos2 = e.clientY;
        startW = elmnt.offsetWidth;
        startH = elmnt.offsetHeight;
        document.onmouseup = closeResizeElement;
        document.onmousemove = elementResize;
        if(typeof window.bringToFront === 'function') window.bringToFront(elmnt);
    };
    function elementResize(e) {
        e = e || window.event;
        e.preventDefault();
        let nw = startW + (e.clientX - rpos1);
        let nh = startH + (e.clientY - rpos2);
        if(nw > 150) elmnt.style.width = nw + "px";
        if(nh > 100) elmnt.style.height = nh + "px";
    }
    function closeResizeElement() { document.onmouseup = null; document.onmousemove = null; }
};

window.getGridStep = function() {
    let spacing = localStorage.getItem('xp_icon_spacing') || 'normal';
    if (spacing === 'tight') return 65;
    else if (spacing === 'wide') return 105;
    else if (spacing === 'very_wide') return 125;
    return 85;
};

window.dragIconAbsolute = function(e, elmnt) {
    e = e || window.event;
    let startMouseX = e.clientX, startMouseY = e.clientY;
    let dragged = false;

    if (!elmnt.classList.contains('selected')) {
        document.querySelectorAll('.desktop-icon.selected').forEach(el => el.classList.remove('selected'));
        elmnt.classList.add('selected');
        let p = elmnt.getAttribute('data-path');
        let n = elmnt.getAttribute('data-name');
        if(p && n) window.selectedFileContext = {path: p, name: n};
        window.draggedFiles = window.selectedFileContext ? [window.selectedFileContext] : [];
    }

    let selectedEls = Array.from(document.querySelectorAll('.desktop-icon.selected'));
    
    // Store original style left/top
    let originalPositions = selectedEls.map(el => {
        return {
            el: el,
            startLeft: parseInt(el.style.left) || el.offsetLeft,
            startTop: parseInt(el.style.top) || el.offsetTop
        };
    });

    document.onmouseup = function() {
        document.onmouseup = null;
        document.onmousemove = null;
        if (dragged && typeof window.resolvePath === 'function') {
            let gridStep = typeof window.getGridStep === 'function' ? window.getGridStep() : 85;
            originalPositions.forEach(obj => {
                let p = obj.el.getAttribute('data-path');
                let n = obj.el.getAttribute('data-name');
                if(p && n) {
                    let dir = window.resolvePath(p);
                    if(dir && dir[n]) {
                        let finalLeft = parseInt(obj.el.style.left) || obj.startLeft;
                        let finalTop = parseInt(obj.el.style.top) || obj.startTop;
                        if (typeof window.gridAlign !== 'undefined' && window.gridAlign) {
                            dir[n].x = Math.max(10, Math.round((finalLeft - 10) / gridStep) * gridStep + 10);
                            dir[n].y = Math.max(10, Math.round((finalTop - 10) / gridStep) * gridStep + 10);
                        } else {
                            dir[n].x = finalLeft;
                            dir[n].y = finalTop;
                        }
                    }
                }
            });
            if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
            if(typeof window.renderDesktop === 'function') window.renderDesktop();
        }
    };
    
    document.onmousemove = function(e) {
        e = e || window.event;
        e.preventDefault(); 
        dragged = true;
        
        let deltaX = e.clientX - startMouseX;
        let deltaY = e.clientY - startMouseY;
        
        originalPositions.forEach(obj => {
            let newLeft = obj.startLeft + deltaX;
            let newTop = obj.startTop + deltaY;
            
            if(newLeft < 0) newLeft = 0;
            if(newTop < 0) newTop = 0;
            
            obj.el.style.left = newLeft + "px";
            obj.el.style.top = newTop + "px";
        });
    };

};
/* --- DRAG AND DROP INTEGRATION --- */
window.allowDrop = function(ev) { ev.preventDefault(); };

window.dropDesktop = function(ev) {
    ev.preventDefault();
    if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
        let dPath = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop";
        window.handleHostFilesImport(ev.dataTransfer.files, dPath, ev.clientX, ev.clientY);
        return;
    }
    
    let filesToDrop = window.draggedFiles && window.draggedFiles.length > 0 ? window.draggedFiles : (typeof draggedFile !== 'undefined' && draggedFile ? [draggedFile] : []);
    
    let hasChanges = false;
    let dPath = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop";
    let dDir = window.resolvePath(dPath);
    
    if (dDir) {
        let offset = 0;
        filesToDrop.forEach(f => {
            if(f.source !== 'desktop') {
                let sDir = window.resolvePath(f.path);
                if(sDir && sDir[f.name]) {
                    dDir[f.name] = sDir[f.name];
                    dDir[f.name].x = ev.clientX - 20 + offset;
                    dDir[f.name].y = ev.clientY - 20 + offset;
                    delete sDir[f.name];
                    hasChanges = true;
                    offset += 20;
                }
            }
        });
        
        if (hasChanges) {
            window.saveFileSystem();
            window.renderDesktop();
            let uniquePaths = [...new Set(filesToDrop.map(f => f.path))];
            if(uniquePaths.includes(window.currentPath)) window.renderExplorer(window.currentPath);
        }
    }
};

window.dropExplorer = function(ev) {
    ev.preventDefault();
    if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
        let dPath = window.currentPath || "C:\\";
        window.handleHostFilesImport(ev.dataTransfer.files, dPath);
        return;
    }
    
    let filesToDrop = window.draggedFiles && window.draggedFiles.length > 0 ? window.draggedFiles : (typeof draggedFile !== 'undefined' && draggedFile ? [draggedFile] : []);
    let hasChanges = false;
    let dDir = window.resolvePath(window.currentPath);
    
    if (dDir) {
        let processDrop = () => {
            filesToDrop.forEach(f => {
                if (f.path !== window.currentPath) {
                    let sDir = window.resolvePath(f.path);
                    if(sDir && sDir[f.name]) {
                        dDir[f.name] = sDir[f.name];
                        delete dDir[f.name].x; 
                        delete dDir[f.name].y;
                        delete sDir[f.name];
                        hasChanges = true;
                    }
                }
            });
            if (hasChanges) {
                if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
                if(typeof window.renderDesktop === 'function') window.renderDesktop();
                if(typeof window.renderExplorer === 'function') window.renderExplorer(window.currentPath);
            }
        };

        if(typeof window.showExtractionDialog === 'function' && filesToDrop.length > 0) {
            window.showExtractionDialog(filesToDrop[0].name + (filesToDrop.length > 1 ? ` and ${filesToDrop.length - 1} more` : ''), processDrop);
        } else {
            processDrop();
        }
    }
};

/* --- MENUS AND DISPLAY --- */
window.showContextMenu = function(event, target) {
    event.preventDefault();
    window.contextMenuTarget = target;
    
    if(target === 'desktop' || target === 'folder') {
        if(typeof window.xpClearSelection === 'function') window.xpClearSelection(target);
        window.selectedFileContext = null;
    }
    
    let deskMenu = document.getElementById('context-menu-desktop');
    let fileMenu = document.getElementById('context-menu-file');
    let regeditMenu = document.getElementById('context-menu-regedit');
    if(deskMenu) deskMenu.style.display = 'none';
    if(fileMenu) fileMenu.style.display = 'none';
    if(regeditMenu) regeditMenu.style.display = 'none';
    
    let pinItem = document.getElementById('menu-item-pin');
    let unpinItem = document.getElementById('menu-item-unpin');
    if (pinItem) pinItem.style.display = 'none';
    if (unpinItem) unpinItem.style.display = 'none';

    if (window.selectedFileContext) {
        let dir = window.resolvePath(window.selectedFileContext.path);
        let item = dir ? dir[window.selectedFileContext.name] : null;
        if (item && (item.type === 'exe' || item.type === 'folder' || window.selectedFileContext.name.toLowerCase().endsWith('.lnk'))) {
            let identifier = window.selectedFileContext.path === window.getDesktopPath() ? window.selectedFileContext.name : window.selectedFileContext.path + '\\' + window.selectedFileContext.name;
            let pinned = window.getPinnedApps();
            let isPinned = pinned.some(p => (typeof p === 'string' && p === identifier) || (p.path === identifier) || (typeof p === 'string' && p === window.selectedFileContext.name));
            if (isPinned) {
                if (unpinItem) unpinItem.style.display = 'flex';
            } else {
                if (pinItem) pinItem.style.display = 'flex';
            }
        }
    }
    
    let menu = window.selectedFileContext ? fileMenu : deskMenu;
    if(menu) { 
        menu.style.display = 'flex'; 
        let mWidth = menu.offsetWidth;
        let mHeight = menu.offsetHeight;
        let posX = event.pageX;
        let posY = event.pageY;
        
        // Prevent menu from going off screen or overlapping taskbar
        if (posX + mWidth > window.innerWidth) posX = window.innerWidth - mWidth;
        if (posY + mHeight > window.innerHeight - 40) posY = window.innerHeight - mHeight - 40;
        if(p && n) window.selectedFileContext = {path: p, name: n};
        window.draggedFiles = window.selectedFileContext ? [window.selectedFileContext] : [];
    }

    let selectedEls = Array.from(document.querySelectorAll('.desktop-icon.selected'));
    
    // Store original style left/top
    let originalPositions = selectedEls.map(el => {
        return {
            el: el,
            startLeft: parseInt(el.style.left) || el.offsetLeft,
            startTop: parseInt(el.style.top) || el.offsetTop
        };
    });

    document.onmouseup = function(e) {
        document.onmouseup = null;
        document.onmousemove = null;
        if (dragged && typeof window.resolvePath === 'function') {
            e = e || window.event;
            
            originalPositions.forEach(obj => obj.el.style.pointerEvents = 'none');
            let dropTarget = document.elementFromPoint(e.clientX, e.clientY);
            originalPositions.forEach(obj => obj.el.style.pointerEvents = '');
            
            let handledAsDrop = false;
            let targetDiv = dropTarget ? dropTarget.closest('.desktop-icon, .file-icon, .start-menu-item, #start-menu-button') : null;
            
            if (targetDiv && targetDiv.classList.contains('desktop-icon') && !targetDiv.classList.contains('selected')) {
                let tName = targetDiv.getAttribute('data-name');
                let tPath = targetDiv.getAttribute('data-path');
                
                if (tName && tPath) {
                    let dDir = window.resolvePath(tPath);
                    if (dDir && dDir[tName]) {
                        if (tName === 'Recycle Bin.lnk' && typeof window.dropRecycle === 'function') {
                            window.dropRecycle({preventDefault: ()=>{}, stopPropagation: ()=>{}});
                            handledAsDrop = true;
                        } else if ((dDir[tName].type === 'folder' || (dDir[tName].type === 'shortcut' && window.resolvePath(dDir[tName].target) && window.resolvePath(dDir[tName].target).type === 'folder')) && typeof window.dropIntoFolderIcon === 'function') {
                            let targetFolder = dDir[tName].type === 'shortcut' ? dDir[tName].target : tPath + (tPath.endsWith('\\') ? '' : '\\') + tName;
                            window.dropIntoFolderIcon({preventDefault: ()=>{}, stopPropagation: ()=>{}}, targetFolder);
                            handledAsDrop = true;
                        }
                    }
                }
            } else if (!handledAsDrop && dropTarget) {
                 let explorerContent = dropTarget.closest('.explorer-content');
                 if (explorerContent) {
                      let folderPath = explorerContent.getAttribute('data-path');
                      if (folderPath && typeof window.dropIntoFolderIcon === 'function') {
                           window.dropIntoFolderIcon({preventDefault: ()=>{}, stopPropagation: ()=>{}}, folderPath);
                           handledAsDrop = true;
                      }
                 }
            }
            
            if (!handledAsDrop) {
                let gridStep = typeof window.getGridStep === 'function' ? window.getGridStep() : 85;
                let deskPath = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop";
                let dir = window.resolvePath(deskPath);
                
                let occ = new Set();
                if(dir && typeof window.gridAlign !== 'undefined' && window.gridAlign) {
                    Object.keys(dir).forEach(k => {
                        if (!window.draggedFiles.some(f => f.name === k)) {
                            let itm = dir[k];
                            if (itm.x !== undefined && itm.y !== undefined) {
                                let r = Math.round((itm.y - 10) / gridStep);
                                let c = Math.round((itm.x - 10) / gridStep);
                                occ.add(r + ',' + c);
                            }
                        }
                    });
                }

                originalPositions.forEach(obj => {
                    let p = obj.el.getAttribute('data-path');
                    let n = obj.el.getAttribute('data-name');
                    if(p && n) {
                        let dDir = window.resolvePath(p);
                        if(dDir && dDir[n]) {
                            let finalLeft = parseInt(obj.el.style.left) || obj.startLeft;
                            let finalTop = parseInt(obj.el.style.top) || obj.startTop;
                            if (typeof window.gridAlign !== 'undefined' && window.gridAlign) {
                                let c = Math.round((finalLeft - 10) / gridStep);
                                let r = Math.round((finalTop - 10) / gridStep);
                                
                                c = Math.max(0, c);
                                r = Math.max(0, r);
                                
                                while(occ.has(r + ',' + c)) {
                                    r++;
                                    if (r >= 6) { r = 0; c++; }
                                }
                                occ.add(r + ',' + c);
                                
                                dDir[n].x = Math.max(10, c * gridStep + 10);
                                dDir[n].y = Math.max(10, r * gridStep + 10);
                            } else {
                                dDir[n].x = finalLeft;
                                dDir[n].y = finalTop;
                            }
                        }
                    }
                });
                if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
                if(typeof window.renderDesktop === 'function') window.renderDesktop();
            }
        }
    };
    
    document.onmousemove = function(e) {
        e = e || window.event;
        e.preventDefault(); 
        dragged = true;
        
        let deltaX = e.clientX - startMouseX;
        let deltaY = e.clientY - startMouseY;
        
        originalPositions.forEach(obj => {
            let newLeft = obj.startLeft + deltaX;
            let newTop = obj.startTop + deltaY;
            
            if(newLeft < 0) newLeft = 0;
            if(newTop < 0) newTop = 0;
            
            obj.el.style.left = newLeft + "px";
            obj.el.style.top = newTop + "px";
        });
    };

};
/* --- DRAG AND DROP INTEGRATION --- */
window.allowDrop = function(ev) { ev.preventDefault(); };

window.dropDesktop = function(ev) {
    ev.preventDefault();
    if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
        let dPath = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop";
        window.handleHostFilesImport(ev.dataTransfer.files, dPath, ev.clientX, ev.clientY);
        return;
    }
    
    let filesToDrop = window.draggedFiles && window.draggedFiles.length > 0 ? window.draggedFiles : (typeof draggedFile !== 'undefined' && draggedFile ? [draggedFile] : []);
    
    let hasChanges = false;
    let dPath = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop";
    let dDir = window.resolvePath(dPath);
    
    if (dDir) {
        let offset = 0;
        filesToDrop.forEach(f => {
            if(f.source !== 'desktop') {
                let sDir = window.resolvePath(f.path);
                if(sDir && sDir[f.name]) {
                    dDir[f.name] = sDir[f.name];
                    dDir[f.name].x = ev.clientX - 20 + offset;
                    dDir[f.name].y = ev.clientY - 20 + offset;
                    delete sDir[f.name];
                    hasChanges = true;
                    offset += 20;
                }
            }
        });
        
        if (hasChanges) {
            window.saveFileSystem();
            window.renderDesktop();
            let uniquePaths = [...new Set(filesToDrop.map(f => f.path))];
            if(uniquePaths.includes(window.currentPath)) window.renderExplorer(window.currentPath);
        }
    }
};

window.dropExplorer = function(ev) {
    ev.preventDefault();
    if (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
        let dPath = window.currentPath || "C:\\";
        window.handleHostFilesImport(ev.dataTransfer.files, dPath);
        return;
    }
    
    let filesToDrop = window.draggedFiles && window.draggedFiles.length > 0 ? window.draggedFiles : (typeof draggedFile !== 'undefined' && draggedFile ? [draggedFile] : []);
    let hasChanges = false;
    let dDir = window.resolvePath(window.currentPath);
    
    if (dDir) {
        let processDrop = () => {
            filesToDrop.forEach(f => {
                if (f.path !== window.currentPath) {
                    let sDir = window.resolvePath(f.path);
                    if(sDir && sDir[f.name]) {
                        dDir[f.name] = sDir[f.name];
                        delete dDir[f.name].x; 
                        delete dDir[f.name].y;
                        delete sDir[f.name];
                        hasChanges = true;
                    }
                }
            });
            if (hasChanges) {
                if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
                if(typeof window.renderDesktop === 'function') window.renderDesktop();
                if(typeof window.renderExplorer === 'function') window.renderExplorer(window.currentPath);
            }
        };

        if(typeof window.showExtractionDialog === 'function' && filesToDrop.length > 0) {
            window.showExtractionDialog(filesToDrop[0].name + (filesToDrop.length > 1 ? ` and ${filesToDrop.length - 1} more` : ''), processDrop);
        } else {
            processDrop();
        }
    }
};

/* --- MENUS AND DISPLAY --- */
window.showContextMenu = function(event, target) {
    event.preventDefault();
    window.contextMenuTarget = target;
    
    if(target === 'desktop' || target === 'folder') {
        if(typeof window.xpClearSelection === 'function') window.xpClearSelection(target);
        window.selectedFileContext = null;
    }
    
    let deskMenu = document.getElementById('context-menu-desktop');
    let fileMenu = document.getElementById('context-menu-file');
    let regeditMenu = document.getElementById('context-menu-regedit');
    if(deskMenu) deskMenu.style.display = 'none';
    if(fileMenu) fileMenu.style.display = 'none';
    if(regeditMenu) regeditMenu.style.display = 'none';
    
    let pinItem = document.getElementById('menu-item-pin');
    let unpinItem = document.getElementById('menu-item-unpin');
    if (pinItem) pinItem.style.display = 'none';
    if (unpinItem) unpinItem.style.display = 'none';

    if (window.selectedFileContext) {
        let dir = window.resolvePath(window.selectedFileContext.path);
        let item = dir ? dir[window.selectedFileContext.name] : null;
        if (item && (item.type === 'exe' || item.type === 'folder' || window.selectedFileContext.name.toLowerCase().endsWith('.lnk'))) {
            let identifier = window.selectedFileContext.path === window.getDesktopPath() ? window.selectedFileContext.name : window.selectedFileContext.path + '\\' + window.selectedFileContext.name;
            let pinned = window.getPinnedApps();
            let isPinned = pinned.some(p => (typeof p === 'string' && p === identifier) || (p.path === identifier) || (typeof p === 'string' && p === window.selectedFileContext.name));
            if (isPinned) {
                if (unpinItem) unpinItem.style.display = 'flex';
            } else {
                if (pinItem) pinItem.style.display = 'flex';
            }
        }
    }
    
    let menu = window.selectedFileContext ? fileMenu : deskMenu;
    if(menu) { 
        menu.style.display = 'flex'; 
        let mWidth = menu.offsetWidth;
        let mHeight = menu.offsetHeight;
        let posX = event.pageX;
        let posY = event.pageY;
        
        // Prevent menu from going off screen or overlapping taskbar
        if (posX + mWidth > window.innerWidth) posX = window.innerWidth - mWidth;
        if (posY + mHeight > window.innerHeight - 40) posY = window.innerHeight - mHeight - 40;
        if (posX < 0) posX = 0;
        if (posY < 0) posY = 0;
        
        menu.style.left = posX + 'px';
        menu.style.top = posY + 'px';
    }
};

window.arrangeIcons = function(sortBy = 'default') {
    window.currentSort = sortBy;
    
    let ctxD = document.getElementById("context-menu-desktop");
    if (ctxD) ctxD.style.display = "none";
    
    // Update Checks visually
    ['default', 'name', 'size', 'type', 'modified'].forEach(type => {
        let el = document.getElementById('check-' + type);
        if(el) el.innerHTML = type === sortBy ? '<div class="menu-check-icon"></div>' : '';
    });
    
    let deskArea = document.getElementById('desktop');
    let icons = Array.from(document.querySelectorAll('.desktop-icon'));

    icons.sort((a, b) => {
        if (sortBy === 'default') {
            let nameA = a.getAttribute('data-name') || a.querySelector('span').innerText;
            let nameB = b.getAttribute('data-name') || b.querySelector('span').innerText;
            
            let deskPath = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop";
            let dir = window.resolvePath(deskPath) || {};
            let itemA = dir[nameA] || {type: 'file'};
            let itemB = dir[nameB] || {type: 'file'};
            
            let typeWeight = { 'shortcut': 1, 'folder': 2, 'exe': 3, 'file': 4 };
            let specialPriority = {
                'My Documents.lnk': -10,
                'My Computer.lnk': -9,
                'My Network Places.lnk': -8.5,
                'Recycle Bin.lnk': -8,
                'Internet Explorer.lnk': -7
            };
            
            let wA = specialPriority[nameA] !== undefined ? specialPriority[nameA] : (typeWeight[itemA.type] || 5);
            let wB = specialPriority[nameB] !== undefined ? specialPriority[nameB] : (typeWeight[itemB.type] || 5);
            
            if (wA !== wB) return wA - wB;
            return nameA.localeCompare(nameB);
        }
        
        let nameA = a.querySelector('span').innerText.toLowerCase();
        let nameB = b.querySelector('span').innerText.toLowerCase();
        if(sortBy === 'name') return nameA.localeCompare(nameB);
        if(sortBy === 'size') return nameA.length - nameB.length; 

        if(sortBy === 'type') return nameA.localeCompare(nameB); // just fallback to name for type since we don't have types easily here
        if(sortBy === 'modified') return Math.random() - 0.5; 
        return 0;
    });

    let xOffset = 10, yOffset = 10;
    // Desktop grid limited to 6 rows
    let colHeight = 6;
    let gridStep = typeof window.getGridStep === 'function' ? window.getGridStep() : 85;
    
    let hasChanges = false;
    icons.forEach((icon, index) => {
        let row = index % colHeight;
        let col = Math.floor(index / colHeight);
        
        let newTop = (yOffset + row * gridStep) + 'px';
        let newLeft = (xOffset + col * gridStep) + 'px';
        
        icon.style.top = newTop;
        icon.style.left = newLeft;
        
        if(typeof window.resolvePath === 'function') {
            let name = icon.getAttribute('data-name') || icon.querySelector('span').innerText;
            if(name === 'Recycle Bin') name += '.lnk'; 
            
            let deskPath = window.getDesktopPath ? window.getDesktopPath() : 'C:\\Documents and Settings\\Administrator\\Desktop';
            let dir = window.resolvePath(deskPath);
            if(dir && dir[name]) { 
                dir[name].x = parseInt(newLeft);
                dir[name].y = parseInt(newTop);
                hasChanges = true;
            }
        }
        deskArea.appendChild(icon);
    });
    
    if(hasChanges && typeof window.saveFileSystem === 'function') window.saveFileSystem();
};

window.refreshDesktop = function() {
    let d = document.getElementById('desktop');
    if(d) {
        d.style.opacity = '0';
        setTimeout(() => { d.style.opacity = '1'; if(typeof window.renderDesktop === 'function') window.renderDesktop(); }, 200);
    }
};

window.showFileProperties = function() {
    let filesToOpen = window.draggedFiles && window.draggedFiles.length > 0 ? window.draggedFiles : (window.selectedFileContext ? [window.selectedFileContext] : []);
    if (filesToOpen.length === 0) {
        if(window.contextMenuTarget === 'desktop') {
            if(typeof window.openSettings === 'function') window.openSettings('desktop');
        } else {
            if(typeof window.xpDialog === 'function') window.xpDialog('Properties', 'No file selected.', 'info');
        }
        return;
    }
    
    if(!window.propWinCounter) window.propWinCounter = 0;

    filesToOpen.forEach((ctx, index) => {
        let dir = window.resolvePath(ctx.path);
        if(!dir || !dir[ctx.name]) return;
        let item = dir[ctx.name];
        let displayName = ctx.name.replace('.lnk', '');
        let fileType = item.type === 'folder' ? 'File Folder' : 
                       item.type === 'exe' ? 'Application' :
                       item.type === 'shortcut' ? 'Shortcut' :
                       (item.extension || 'Unknown').toUpperCase() + ' File';
        let size = '0 bytes';
        if (item.sizeRaw !== undefined) {
            size = item.sizeRaw.toLocaleString() + ' bytes';
            if (item.sizeRaw > 1024 * 1024) size += ' (' + (item.sizeRaw / (1024*1024)).toFixed(2) + ' MB)';
            else if (item.sizeRaw > 1024) size += ' (' + (item.sizeRaw / 1024).toFixed(2) + ' KB)';
        } else if (item.content) {
            size = item.content.length.toLocaleString() + ' bytes';
            if (item.content.length > 1024 * 1024) size += ' (' + (item.content.length / (1024*1024)).toFixed(2) + ' MB)';
            else if (item.content.length > 1024) size += ' (' + (item.content.length / 1024).toFixed(2) + ' KB)';
        } else if (item.type === 'folder') {
            size = '—';
        }
        let icon = item.icon && typeof sysIcons !== 'undefined' && sysIcons[item.icon] ? sysIcons[item.icon] : (item.icon && (item.icon.includes('/') || item.icon.includes('\\')) ? item.icon : '');
        let created = new Date().toLocaleDateString();

        let baseWin = document.getElementById('properties-window');
        if(!baseWin) return;
        let newWin = baseWin.cloneNode(true);
        window.propWinCounter++;
        let winId = 'properties-window-' + window.propWinCounter;
        newWin.id = winId;
        newWin.style.display = 'block';
        newWin.style.left = (200 + (index * 20)) + 'px';
        newWin.style.top = (150 + (index * 20)) + 'px';

        let titleBar = newWin.querySelector('.title-bar');
        if (titleBar) titleBar.id = winId + '-title';

        let winBtns = newWin.querySelectorAll('.win-btn');
        winBtns.forEach(btn => {
            if (btn.innerText === 'X') {
                btn.onclick = () => { newWin.remove(); };
            } else if (btn.innerText === '_') {
                btn.onclick = () => { newWin.style.display = 'none'; };
            }
        });

        let propIcon = newWin.querySelector('#prop-icon');
        if(propIcon) { propIcon.id = ''; propIcon.src = icon || 'Windows XP Icons/TXT.png'; }
        
        let nameInput = newWin.querySelector('#prop-name-input');
        if(nameInput) { nameInput.id = ''; nameInput.value = displayName; }
        
        let typeEl = newWin.querySelector('#prop-type');
        if(typeEl) { typeEl.id = ''; typeEl.innerText = fileType; }
        
        let locEl = newWin.querySelector('#prop-location');
        if(locEl) { locEl.id = ''; locEl.innerText = ctx.path; }
        
        let sizeEl = newWin.querySelector('#prop-size');
        if(sizeEl) { sizeEl.id = ''; sizeEl.innerText = size; }
        
        let createdEl = newWin.querySelector('#prop-created');
        if(createdEl) { createdEl.id = ''; createdEl.innerText = created; }
        
        let buttons = newWin.querySelectorAll('button');
        buttons.forEach(btn => {
            if(btn.innerText === 'OK' || btn.innerText === 'Cancel') {
                btn.onclick = () => newWin.remove();
            }
        });
        
        // Let's clear out all other IDs so we don't have duplicates
        newWin.querySelectorAll('[id]').forEach(el => el.id = '');
        
        document.body.appendChild(newWin);
        if(typeof dragElement === 'function') dragElement(newWin);
        if(typeof window.bringToFront === 'function') window.bringToFront(newWin);
    });
};

/* --- SETTINGS & THEMES --- */
window.openSettings = function(tabName = 'themes') {
    window.openProgram('settings-window');
    window.switchSettingsTab(tabName);
    let vol = document.getElementById('setting-volume');
    if(vol) vol.value = window.sysVolume !== undefined ? window.sysVolume : 80;
    let mute = document.getElementById('setting-mute');
    if(mute) mute.checked = window.sysMuted === true;

    let iconSizeSel = document.getElementById('icon-size-select');
    let iconSpacingSel = document.getElementById('icon-spacing-select');
    if (iconSizeSel) iconSizeSel.value = localStorage.getItem('xp_icon_size') || 'normal';
    if (iconSpacingSel) iconSpacingSel.value = localStorage.getItem('xp_icon_spacing') || 'normal';
};;

window.switchSettingsTab = function(tabName) {
    let tabs = ['themes', 'desktop', 'screensaver', 'appearance', 'settings', 'folder', 'sounds', 'system', 'user', 'datetime', 'mouse', 'keyboard', 'network', 'power', 'accessibility', 'addremove', 'fonts'];
    let titles = {
        'themes': 'Display Properties',
        'desktop': 'Display Properties',
        'screensaver': 'Display Properties',
        'appearance': 'Display Properties',
        'settings': 'Display Properties',
        'folder': 'Folder Options',
        'sounds': 'Sounds and Audio Devices Properties',
        'system': 'System Properties',
        'user': 'User Accounts',
        'datetime': 'Date and Time Properties',
        'mouse': 'Mouse Properties',
        'keyboard': 'Keyboard Properties',
        'network': 'Network Connections',
        'power': 'Power Options Properties',
        'accessibility': 'Accessibility Options',
        'addremove': 'Add or Remove Programs',
        'fonts': 'Fonts'
    };
    
    let titleElem = document.querySelector('#settings-window-title span');
    let btnSource = document.getElementById('tab-btn-' + tabName);
    if(titleElem && btnSource) {
        let iconSrc = btnSource.querySelector('img').src;
        titleElem.innerHTML = `<img src="${iconSrc}" class="sys-icon-small"> ` + (titles[tabName] || 'Settings');
    }

    tabs.forEach(t => {
        let btn = document.getElementById('tab-btn-' + t);
        let pane = document.getElementById('tab-' + t);
        if(btn) btn.classList.remove('active');
        if(pane) pane.style.display = 'none';
    });
    let actBtn = document.getElementById('tab-btn-' + tabName);
    let actPane = document.getElementById('tab-' + tabName);
    if(actBtn) actBtn.classList.add('active');
    if(actPane) actPane.style.display = 'block';

    if(tabName === 'datetime') updateSettingsClock();
    if(tabName === 'user') { if(typeof window.renderControlPanelUserAccounts === 'function') window.renderControlPanelUserAccounts(); }
};

function updateSettingsClock() {
    let clock = document.getElementById('settings-clock');
    let date = document.getElementById('settings-date');
    if(!clock || !date) return;
    setInterval(() => {
        let d = new Date();
        clock.innerText = d.toLocaleTimeString();
        date.innerText = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }, 1000);
}

window.customMouseSpeed = 1;
window.showUserSettings = function(username) {
    document.getElementById('user-settings-main').style.display = 'none';
    document.getElementById('user-settings-detail').style.display = 'block';
    document.getElementById('user-detail-name').innerText = username;
    
    let btnPass = document.getElementById('btn-change-pass');
    let btnPic = document.getElementById('btn-change-pic');
    let btnType = document.getElementById('btn-change-type');
    let btnDel = document.getElementById('btn-delete-account');
    
    if(username === 'Guest') {
        btnPass.style.opacity = '0.5'; btnPass.onclick = () => xpDialog('Security', 'Guest accounts cannot have passwords.', 'error');
        btnType.style.opacity = '0.5'; btnType.onclick = () => xpDialog('Type', 'The Guest account type cannot be changed.', 'error');
        btnDel.style.display = 'none';
    } else if (username === 'Administrator') {
        btnPass.style.opacity = '1'; btnPass.onclick = () => changeAccountPassword(username);
        btnType.style.opacity = '0.5'; btnType.onclick = () => xpDialog('Type', 'The default Administrator account type cannot be changed.', 'error');
        btnDel.style.display = 'none';
    } else {
        btnPass.style.opacity = '1'; btnPass.onclick = () => changeAccountPassword(username);
        btnType.style.opacity = '1'; btnType.onclick = () => changeAccountType(username);
        btnDel.style.display = 'block'; btnDel.onclick = () => deleteAccount(username);
    }
    
    btnPic.onclick = () => changeAccountPicture(username);
};

window.changeAccountType = async function(username) {
    let res = await xpDialog('Change Type', 'Do you want to make this account a Computer Administrator?', 'prompt');
    if(res !== null) {
        let accounts = window.loadAccounts();
        if(accounts[username]) {
            accounts[username].type = (res.toLowerCase() === 'yes' || res.toLowerCase() === 'y' || res.toLowerCase() === 'true') ? 'Administrator' : 'Limited';
            window.saveAccounts(accounts);
            xpDialog('Success', 'Account type updated to ' + accounts[username].type, 'info');
            if(typeof renderControlPanelUserAccounts === 'function') renderControlPanelUserAccounts();
        }
    }
};

window.deleteAccount = async function(username) {
    let confirm = await xpDialog('Delete Account', 'Are you sure you want to delete the account "' + username + '" and all its files? Type "yes" to confirm.', 'prompt');
    if(confirm !== null && (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y')) {
        let accounts = window.loadAccounts();
        if(accounts[username]) {
            let fsKey = accounts[username].fsKey;
            if(fsKey) localStorage.removeItem(fsKey);
            delete accounts[username];
            window.saveAccounts(accounts);
            xpDialog('Success', 'Account deleted.', 'info');
            document.getElementById('user-settings-detail').style.display='none';
            document.getElementById('user-settings-main').style.display='block';
            if(typeof renderControlPanelUserAccounts === 'function') renderControlPanelUserAccounts();
        }
    }
};

window.changeAccountPicture = function(username) {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        let file = e.target.files[0];
        if(!file) return;
        let reader = new FileReader();
        reader.onload = function(ev) {
            let img = new Image();
            img.onload = function() {
                let canvas = document.createElement('canvas');
                canvas.width = 64; canvas.height = 64;
                canvas.getContext('2d').drawImage(img, 0, 0, 64, 64);
                let resized = canvas.toDataURL('image/jpeg', 0.8);
                let accounts = window.loadAccounts();
                if(accounts[username]) {
                    accounts[username].avatar = resized;
                    window.saveAccounts(accounts);
                    xpDialog('Success', 'Account picture updated!', 'info');
                    if(typeof renderControlPanelUserAccounts === 'function') renderControlPanelUserAccounts();
                }
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
};

window.changeAccountPassword = async function(username) {
    let newPass = await xpDialog('Change Password', `Enter new password for ${username}:`, 'prompt');
    if(newPass !== null) {
        let accounts = window.loadAccounts();
        if(accounts[username]) accounts[username].password = newPass;
        window.saveAccounts(accounts);
        xpDialog('Success', 'Password updated successfully.', 'info');
    }
};

window.updateDesktopPreview = function() {
    let bg = document.getElementById('bg-select').value;
    let color = document.getElementById('bg-color-picker').value;
    let preview = document.getElementById('desktop-preview');
    if(!preview) return;
    
    if(bg === 'bliss') preview.style.background = "url('Windows XP Icons/bliss_bg.png') center/cover";
    else if(bg === 'matrix') {
        preview.style.background = "url('Windows XP Icons/matrix_preview.png') center/cover";
        preview.style.backgroundColor = "#000";
    }
    else if(bg === 'custom' && typeof customBgDataUrl !== 'undefined' && customBgDataUrl) {
        preview.style.background = "url('" + customBgDataUrl + "') center/cover";
    }
    else preview.style.background = color;
};

window.updateScreensaverPreview = function() {
    let ss = document.getElementById('screensaver-select').value;
    let preview = document.getElementById('screensaver-preview');
    if(!preview) return;
    if(ss === 'none') {
        preview.style.display = 'none';
        return;
    }
    preview.style.display = 'block';
    
    let src = '';
    if (ss === 'matrix') src = 'matrix.html';
    else if (ss === 'pipes') src = 'Windows-XP-Pipes-Screensaver-main/index.html';
    
    if (src) {
        preview.innerHTML = '<iframe src="' + src + '" style="width:1000px; height:800px; border:none; transform: scale(0.1); transform-origin: 0 0; pointer-events:none;"></iframe>';
    } else {
        preview.innerHTML = '<div style="width:100%; height:100%; background:#000; color:#0f0; display:flex; align-items:center; justify-content:center; font-size:10px;">' + ss + ' preview</div>';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    let sel = document.getElementById('screensaver-select');
    if(sel) sel.addEventListener('change', window.updateScreensaverPreview);
});


window.uploadBackground = function(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            customBgDataUrl = e.target.result;
            let sel = document.getElementById('bg-select');
            if(sel) {
                sel.value = 'custom';
                if(!document.querySelector('option[value="custom"]')){
                    let opt = document.createElement('option');
                    opt.value = 'custom';
                    opt.innerHTML = 'Custom Upload';
                    sel.appendChild(opt);
                    sel.value = 'custom';
                }
            }
        };
        reader.readAsDataURL(file);
    }
};

window.applySettings = function(closeAfter) {
    let themeElem = document.getElementById('theme-select-themes') || document.getElementById('theme-select-appearance');
    let theme = themeElem ? themeElem.value : 'blue';
    
    let bgVal = document.getElementById('bg-select').value;
    let bgColor = document.getElementById('bg-color-picker').value;
    let body = document.body;
    
    let bgIframe = document.getElementById('bg-iframe');
    if (bgIframe) bgIframe.style.display = 'none';

    if(bgVal === 'bliss') {
        document.body.style.backgroundImage = "url('Windows XP Icons/bliss_bg.png')";
        document.body.style.backgroundSize = "cover";
    } else if (bgVal === 'none') {
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = bgColor;
    } else if (bgVal === 'matrix') {
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "#000000";
        if (bgIframe) {
            bgIframe.src = 'matrix.html';
            bgIframe.style.display = 'block';
        }
    } else if (bgVal === 'custom' && typeof customBg !== 'undefined' && customBg) {
        document.body.style.backgroundImage = "url('" + customBg + "')";
        document.body.style.backgroundSize = "cover";
    }
    
    // Save to user profile
    let uName = window.currentAccount || 'Administrator';
    try {
        let uProfile = window.fs["C:"].contents["Documents and Settings"].contents[uName];
        if(uProfile) {
            uProfile.wallpaper = {
                type: bgVal,
                color: bgColor,
                customData: customBgDataUrl
            };
            window.saveFileSystem();
        }
    } catch(e) {}

    // Mouse functionality
    let speed = document.getElementById('mouse-speed-range').value;
    window.customMouseSpeed = 0.5 + (speed / 10);
    let mTrail = document.getElementById('mouse-trail').checked;
    if(mTrail) {
        document.body.style.cursor = 'crosshair';
    } else {
        document.body.style.cursor = 'auto';
    }
    
    // Accessibility functionality
    let accHighContrast = document.getElementById('acc-highcontrast').checked;
    if(accHighContrast) {
        document.body.style.filter = 'contrast(1.5) brightness(1.2)';
    } else {
        document.body.style.filter = 'none';
    }
    
    document.body.className = ''; 
    document.body.classList.add('theme-' + theme);
    
    // Font Size
    let fSizeSel = document.getElementById('font-size-select');
    if(fSizeSel) {
        document.body.style.fontSize = fSizeSel.value;
    }

    // Icon Settings
    let iconSizeSel = document.getElementById('icon-size-select');
    let iconSpacingSel = document.getElementById('icon-spacing-select');
    if (iconSizeSel) localStorage.setItem('xp_icon_size', iconSizeSel.value);
    if (iconSpacingSel) localStorage.setItem('xp_icon_spacing', iconSpacingSel.value);
    if (typeof window.applyIconSettings === 'function') window.applyIconSettings();
    
    // Folder Options
    let fClickSingle = document.getElementById('folder-click-single');
    if (fClickSingle && fClickSingle.checked) {
        window.singleClickToOpen = true;
    } else {
        window.singleClickToOpen = false;
    }
    
    // Re-render desktop and explorer to apply the single click setting
    if (typeof window.renderDesktop === 'function') window.renderDesktop();
    if (typeof window.renderExplorer === 'function') window.renderExplorer(window.currentPath || "C:\\");
    
    // Keyboard and mouse settings
    let mouseSpeed = document.getElementById('mouse-speed-range');
    if (mouseSpeed) localStorage.setItem('xp_mouse_speed', mouseSpeed.value);
    
    // Save settings to localStorage
    localStorage.setItem('xp_theme', theme);
    localStorage.setItem('xp_wallpaper', bgVal);
    localStorage.setItem('xp_wallpaper_color', bgColor);
    if (customBgDataUrl) {
        try {
            localStorage.setItem('xp_custom_bg', customBgDataUrl);
        } catch(e) {
            if(typeof window.xpDialog === 'function') window.xpDialog('Error', 'Background image is too large to save in local storage. Try a smaller image.', 'error');
            localStorage.removeItem('xp_custom_bg');
        }
    }
    localStorage.setItem('xp_mouse_speed', speed);
    localStorage.setItem('xp_mouse_trail', mTrail ? 'true' : 'false');
    localStorage.setItem('xp_accessibility_highcontrast', accHighContrast ? 'true' : 'false');
    
    // Keyboard settings
    let kbDelayElem = document.getElementById('setting-kb-delay');
    let kbRateElem = document.getElementById('setting-kb-rate');
    if (kbDelayElem) localStorage.setItem('xp_keyboard_speed_delay', kbDelayElem.value);
    if (kbRateElem) localStorage.setItem('xp_keyboard_speed_rate', kbRateElem.value);
    
    // Folder Options
    if (fClickSingle) localStorage.setItem('xp_single_click', fClickSingle.checked ? 'true' : 'false');
    
    // Screen Saver settings
    let ssSelect = document.getElementById('screensaver-select');
    let ssVal = ssSelect ? ssSelect.value : 'none';
    localStorage.setItem('xp_screensaver', ssVal);
    
    let ssTimeoutInput = document.getElementById('screensaver-timeout');
    let ssTimeoutVal = ssTimeoutInput ? ssTimeoutInput.value : '1';
    localStorage.setItem('xp_screensaver_timeout', ssTimeoutVal);
    
    // Keyboard repeat rate settings
    let kbDelay = document.getElementById('setting-kb-delay');
    if (kbDelay) localStorage.setItem('xp_keyboard_speed_delay', kbDelay.value);
    let kbRate = document.getElementById('setting-kb-rate');
    if (kbRate) localStorage.setItem('xp_keyboard_speed_rate', kbRate.value);

    // Volume & Mute settings
    let volInput = document.getElementById('setting-volume');
    if (volInput) {
        window.sysVolume = parseInt(volInput.value);
        localStorage.setItem('xp_sys_volume', window.sysVolume);
    }
    let muteChk = document.getElementById('setting-mute');
    if (muteChk) {
        window.sysMuted = muteChk.checked;
        localStorage.setItem('xp_sys_muted', window.sysMuted ? 'true' : 'false');
    }

    // Setup screensaver timer
    clearTimeout(ssTimer);
    if (ssVal !== 'none' && ssVal !== '(None)') {
        let timeoutMs = parseInt(ssTimeoutVal) * 60000;
        if(isNaN(timeoutMs) || timeoutMs <= 0) timeoutMs = 60000;
        ssTimer = setTimeout(startScreenSaver, timeoutMs);
    }
    
    if(typeof window.showBalloon === 'function') {
        window.showBalloon("Control Panel", "System, Mouse, and Keyboard settings saved.");
    }

    if (closeAfter) {
        window.closeWindow('settings-window');
    }
};

window.cancelSettings = function() {
    window.closeWindow('settings-window');
};

/* --- TRUE MATHEMATICAL SCREENSAVERS --- */
let ssTimer;
let ssActive = false;
let ssCanvas, ssCtx, ssAnimFrame;
let ssStart = 0;
const SS_TIMEOUT = 60000; 

function resetActivity(e) {
    if (window.ssActive) {
        if (Date.now() - window.ssStart < 500) return;
        stopScreenSaver();
    }
    clearTimeout(ssTimer);
    let selectObj = document.getElementById('screensaver-select');
    let type = selectObj ? selectObj.value : 'none';
    if(type !== 'none' && type !== '(None)') {
        let ssTimeoutInput = document.getElementById('screensaver-timeout');
        let ssTimeoutVal = ssTimeoutInput ? ssTimeoutInput.value : '1';
        let timeoutMs = parseInt(ssTimeoutVal) * 60000;
        if(isNaN(timeoutMs) || timeoutMs <= 0) timeoutMs = 60000;
        ssTimer = setTimeout(startScreenSaver, timeoutMs);
    }
}
document.addEventListener('mousemove', resetActivity);
document.addEventListener('keypress', resetActivity);
document.addEventListener('mousedown', resetActivity);

window.startScreenSaver = function(previewType = null) {
    let selectObj = document.getElementById('screensaver-select');
    let type = previewType || (selectObj ? selectObj.value : 'none');
    
    if (previewType && previewType.type) {
        type = selectObj ? selectObj.value : 'none';
    }
    
    if (type === 'none' || type === '(None)') return;
    
    window.ssActive = true;
    window.ssStart = Date.now();
    let ssCanvas = document.getElementById('screensaver-overlay');
    if(!ssCanvas) return;
    
    ssCanvas.style.display = 'block';
    ssCanvas.width = window.innerWidth;
    ssCanvas.height = window.innerHeight;
    let ssCtx = ssCanvas.getContext('2d');
    
    let w = ssCanvas.width, h = ssCanvas.height;
    
    let ssIframe = document.getElementById('screensaver-iframe');
    if(!ssIframe) {
        ssIframe = document.createElement('iframe');
        ssIframe.id = 'screensaver-iframe';
        ssIframe.style.position = 'absolute';
        ssIframe.style.top = '0';
        ssIframe.style.left = '0';
        ssIframe.style.width = '100%';
        ssIframe.style.height = '100%';
        ssIframe.style.border = 'none';
        ssIframe.style.zIndex = '9998';
        ssIframe.style.pointerEvents = 'none';
        document.body.appendChild(ssIframe);
    }
    ssIframe.style.display = 'none';
    
    if (type === 'pipes' || type === 'matrix') {
        // use iframe instead of canvas
        ssCanvas.style.display = 'none';
        ssIframe.src = (type === 'pipes') ? 'Windows-XP-Pipes-Screensaver-main/index.html' : 'matrix.html';
        ssIframe.style.display = 'block';
    } else if (type === 'mystify') {
        ssCtx.fillStyle = 'black'; ssCtx.fillRect(0, 0, w, h);
        let shapes = [
            { pts: [{x:Math.random()*w, y:Math.random()*h, dx:2, dy:3}, {x:Math.random()*w, y:Math.random()*h, dx:-3, dy:2}, {x:Math.random()*w, y:Math.random()*h, dx:1, dy:-3}, {x:Math.random()*w, y:Math.random()*h, dx:-2, dy:-2}], color: 0 },
            { pts: [{x:Math.random()*w, y:Math.random()*h, dx:-2, dy:4}, {x:Math.random()*w, y:Math.random()*h, dx:4, dy:-2}, {x:Math.random()*w, y:Math.random()*h, dx:-1, dy:-4}, {x:Math.random()*w, y:Math.random()*h, dx:3, dy:1}], color: 120 }
        ];

        function drawMystify() {
            if(!window.ssActive) return;
            ssCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ssCtx.fillRect(0, 0, w, h);
            
            shapes.forEach(shape => {
                shape.color = (shape.color + 0.5) % 360;
                ssCtx.strokeStyle = `hsl(${shape.color}, 100%, 50%)`;
                ssCtx.lineWidth = 1;
                ssCtx.beginPath();
                
                shape.pts.forEach((pt, i) => {
                    pt.x += pt.dx; pt.y += pt.dy;
                    if(pt.x <= 0 || pt.x >= w) pt.dx *= -1;
                    if(pt.y <= 0 || pt.y >= h) pt.dy *= -1;
                    
                    if(i === 0) ssCtx.moveTo(pt.x, pt.y);
                    else ssCtx.lineTo(pt.x, pt.y);
                });
                ssCtx.closePath();
                ssCtx.stroke();
            });
            window.ssAnimFrame = requestAnimationFrame(drawMystify);
        }
        drawMystify();
        
    } else if (type === 'starfield') {
        let stars = Array.from({length: 400}, () => ({
            x: (Math.random() - 0.5) * w * 2,
            y: (Math.random() - 0.5) * h * 2,
            z: Math.random() * w
        }));

        function drawStarfield() {
            if(!window.ssActive) return;
            ssCtx.fillStyle = 'black'; ssCtx.fillRect(0, 0, w, h);
            ssCtx.fillStyle = 'white';
            
            stars.forEach(s => {
                s.z -= 4; 
                if(s.z <= 0) { 
                    s.x = (Math.random() - 0.5) * w * 2; 
                    s.y = (Math.random() - 0.5) * h * 2; 
                    s.z = w; 
                }
                let sx = (s.x / s.z) * 200 + w/2;
                let sy = (s.y / s.z) * 200 + h/2;
                let r = Math.max(0.5, 400 / s.z); 
                
                if (sx > 0 && sx < w && sy > 0 && sy < h) {
                    ssCtx.beginPath(); 
                    ssCtx.arc(sx, sy, r, 0, Math.PI*2); 
                    ssCtx.fill();
                }
            });
            window.ssAnimFrame = requestAnimationFrame(drawStarfield);
        }
        drawStarfield();
    }
};

window.stopScreenSaver = function() {
    if(!window.ssActive) return;
    window.ssActive = false;
    let ssCanvas = document.getElementById('screensaver-overlay');
    if(ssCanvas) {
        ssCanvas.style.display = 'none';
    }
    let ssIframe = document.getElementById('screensaver-iframe');
    if(ssIframe) {
        ssIframe.style.display = 'none';
        ssIframe.src = 'about:blank';
    }
    if (window.ssAnimFrame) {
        cancelAnimationFrame(window.ssAnimFrame);
        window.ssAnimFrame = null;
    }
};

window.getIconForExtension = function(key, item) {
    if (item && item.icon) {
        if (typeof sysIcons !== 'undefined' && sysIcons[item.icon]) return sysIcons[item.icon];
        if (item.icon.includes('/') || item.icon.includes('\\')) return item.icon;
    }
    if (item && item.type === 'folder') return 'Windows XP Icons/Folder Closed.png';
    if (item && item.type === 'exe') return 'Windows XP Icons/Application Window.png';
    if (item && item.type === 'shortcut') return 'Windows XP Icons/Shortcut.png'; // Fallback
    
    // Fallback based on extension
    let ext = key.split('.').pop().toLowerCase();
    if (ext === 'txt' || ext === 'ini' || ext === 'log' || ext === 'js' || ext === 'css' || ext === 'html' || ext === 'md') return 'Windows XP Icons/TXT.png';
    if (ext === 'exe' || ext === 'bat' || ext === 'com') return 'Windows XP Icons/Application Window.png';
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'bmp' || ext === 'ico') return 'Windows XP Icons/Paint.png';
    
    return 'Windows XP Icons/TXT.png';
};

window.previewScreenSaver = function() {
    let sel = document.getElementById('screensaver-select');
    if (sel && sel.value !== 'none') {
        window.startScreenSaver(sel.value);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    let windows = document.querySelectorAll('.window');
    windows.forEach(win => {
        if(win.id && typeof window.makeDraggable === 'function') {
            let titleId = win.id + '-title';
            if(document.getElementById(titleId)) {
                window.makeDraggable(win.id, titleId);
            }
        }
    });
});


// == Appended Missing Functions ==

window.defaultPinnedApps = ['Internet Explorer', 'Outlook Express', 'Windows Media Player', 'Windows Messenger', 'Notepad'];

window.getPinnedApps = function() {
    let acc = window.currentAccount || 'Administrator';
    let saved = localStorage.getItem('xp_pinned_apps_' + acc);
    if(saved) {
        try { return JSON.parse(saved); } catch(e){}
    }
    return window.defaultPinnedApps.slice();
};

window.savePinnedApps = function(apps) {
    let acc = window.currentAccount || 'Administrator';
    localStorage.setItem('xp_pinned_apps_' + acc, JSON.stringify(apps));
};

window.pinStartItem = function(appName) {
    let pinned = window.getPinnedApps();
    if(!pinned.includes(appName)) {
        pinned.push(appName);
        window.savePinnedApps(pinned);
        if (typeof window.syncStartMenuWithInstalledApps === 'function') {
            window.syncStartMenuWithInstalledApps();
        }
    }
};

window.unpinStartItem = function(appName) {
    let pinned = window.getPinnedApps();
    let idx = pinned.findIndex(p => (typeof p === 'string' && p === appName) || (p.path === appName) || (p.name === appName));
    if(idx !== -1) {
        pinned.splice(idx, 1);
        window.savePinnedApps(pinned);
        if (typeof window.syncStartMenuWithInstalledApps === 'function') {
            window.syncStartMenuWithInstalledApps();
        }
    }
};

window.pinSelectedFile = function() {
    let ctx = window.selectedFileContext;
    if (!ctx) return;
    let dir = window.resolvePath(ctx.path);
    let item = dir ? dir[ctx.name] : null;
    if (!item) return;
    
    let identifier = ctx.path === window.getDesktopPath() ? ctx.name : ctx.path + '\\' + ctx.name;
    let pinObj = {
        name: ctx.name.replace(/\.lnk$/i, '').replace(/\.exe$/i, ''),
        path: identifier,
        icon: item.icon || 'file',
        app: item.app || 'folder-window',
        type: item.type
    };
    
    let pinned = window.getPinnedApps();
    if (!pinned.some(p => (typeof p === 'string' && p === identifier) || (p.path === identifier) || (typeof p === 'string' && p === ctx.name))) {
        pinned.push(pinObj);
        window.savePinnedApps(pinned);
        if (typeof window.syncStartMenuWithInstalledApps === 'function') window.syncStartMenuWithInstalledApps();
    }
    document.getElementById('context-menu-file').style.display = 'none';
};

window.unpinSelectedFile = function() {
    let ctx = window.selectedFileContext;
    if (!ctx) return;
    let identifier = ctx.path === window.getDesktopPath() ? ctx.name : ctx.path + '\\' + ctx.name;
    
    let pinned = window.getPinnedApps();
    let idx = pinned.findIndex(p => (typeof p === 'string' && p === identifier) || (p.path === identifier) || (typeof p === 'string' && p === ctx.name));
    if (idx !== -1) {
        pinned.splice(idx, 1);
        window.savePinnedApps(pinned);
        if (typeof window.syncStartMenuWithInstalledApps === 'function') window.syncStartMenuWithInstalledApps();
    }
    document.getElementById('context-menu-file').style.display = 'none';
};

window.syncStartMenuWithInstalledApps = function() {
    if(typeof STORE_APPS === 'undefined') return;
    
    let pinnedContainer = document.getElementById('start-menu-pinned-container');
    let recentContainer = document.getElementById('start-menu-recent-container');
    
    // Fallback if containers don't exist (user might not have new index.html)
    if(!pinnedContainer || !recentContainer) return;
    
    let pinnedApps = window.getPinnedApps();
    
    let pinnedHtml = '';
    let recentHtml = '';
    
    let recentCount = 0;
    
    STORE_APPS.forEach(app => {
        let isInst = typeof window.isAppInstalled === 'function' ? window.isAppInstalled(app) : false;
        if(isInst) {
            let isPinned = pinnedApps.includes(app.name) || pinnedApps.some(p => typeof p === 'object' && p.name === app.name);
            if(!isPinned && recentCount < 6) {
                let iconSrc = app.icon;
                if (typeof sysIcons !== 'undefined' && sysIcons[app.icon]) iconSrc = sysIcons[app.icon];
                else if (!iconSrc.includes('/')) iconSrc = 'Windows XP Icons/' + (iconSrc.charAt(0).toUpperCase() + iconSrc.slice(1)) + '.png';

                let icon = iconSrc.startsWith('<svg') ? 
                    `data:image/svg+xml;utf8,${iconSrc}` : 
                    (iconSrc.startsWith('data:') ? iconSrc : iconSrc);
                    
                let imgTag = iconSrc.startsWith('<svg') ?
                    `<img src='${icon}' class='sys-icon-small' style='margin-right:8px;'>` :
                    `<img src='${icon}' class='sys-icon-small' style='margin-right:8px;' onerror="this.src='Windows XP Icons/Application Window.png'">`;
                
                let clickAttr = `onclick="openProgram('${app.id}-window'); toggleStartMenu();"`;
                if(app.id === 'cmd') clickAttr = `onclick="if(typeof initCmd==='function') initCmd(); openProgram('cmd-window'); toggleStartMenu();"`;
                if(app.id === 'paint') clickAttr = `onclick="if(typeof initPaint==='function') initPaint(); openProgram('paint-window'); toggleStartMenu();"`;
                if(app.id === 'soundrecorder') clickAttr = `onclick="if(typeof initSoundRecorder==='function') initSoundRecorder(); openProgram('soundrecorder-window'); toggleStartMenu();"`;
                if(app.id === 'notepad') clickAttr = `onclick="if(typeof clearNotepad==='function') clearNotepad(); openProgram('notepad-window'); toggleStartMenu();"`;
                if(app.id === 'remotedesktop') clickAttr = `onclick="if(typeof initRemoteDesktop==='function') initRemoteDesktop(); openProgram('remotedesktop-window'); toggleStartMenu();"`;
                
                recentHtml += `<div class="start-menu-item" data-name="${app.name}" ${clickAttr} oncontextmenu="showStartItemContext(event, '${app.name}', false)">
                    ${imgTag} <span>${app.name}</span>
                </div>`;
                recentCount++;
            }
        }
    });
    
    pinnedApps.forEach(pData => {
        let isCustom = typeof pData === 'object';
        let pName = isCustom ? pData.name : pData;
        let app = STORE_APPS.find(a => a.name === pName);
        let iconStr = isCustom ? pData.icon : (app ? app.icon : 'Setup');
        
        // If not in STORE_APPS but is a custom pinned item, just render it anyway
        if(app && !(typeof window.isAppInstalled === 'function' ? window.isAppInstalled(app) : false)) return;
        if (!app && !isCustom) return;
        
        let iconSrc = iconStr;
        if (typeof sysIcons !== 'undefined' && sysIcons[iconStr]) iconSrc = sysIcons[iconStr];
        else if (!iconSrc.includes('/')) iconSrc = 'Windows XP Icons/' + (iconStr.charAt(0).toUpperCase() + iconStr.slice(1)) + '.png';

        let icon = iconSrc.startsWith('<svg') ? 
            `data:image/svg+xml;utf8,${iconSrc}` : 
            (iconSrc.startsWith('data:') ? iconSrc : iconSrc);
            
        let imgTag = iconSrc.startsWith('<svg') ?
            `<img src='${icon}' class='sys-icon-small' style='margin-right:8px;'>` :
            `<img src='${icon}' class='sys-icon-small' style='margin-right:8px;' onerror="this.src='Windows XP Icons/Application Window.png'">`;
        
        let clickAttr = `onclick="xpDialog('Error', 'Cannot launch.', 'error')"`;
        if (app) {
            clickAttr = `onclick="openProgram('${app.id}-window'); toggleStartMenu();"`;
            if(app.id === 'cmd') clickAttr = `onclick="if(typeof initCmd==='function') initCmd(); openProgram('cmd-window'); toggleStartMenu();"`;
            if(app.id === 'paint') clickAttr = `onclick="if(typeof initPaint==='function') initPaint(); openProgram('paint-window'); toggleStartMenu();"`;
            if(app.id === 'soundrecorder') clickAttr = `onclick="if(typeof initSoundRecorder==='function') initSoundRecorder(); openProgram('soundrecorder-window'); toggleStartMenu();"`;
            if(app.id === 'notepad') clickAttr = `onclick="if(typeof clearNotepad==='function') clearNotepad(); openProgram('notepad-window'); toggleStartMenu();"`;
            if(app.id === 'remotedesktop') clickAttr = `onclick="if(typeof initRemoteDesktop==='function') initRemoteDesktop(); openProgram('remotedesktop-window'); toggleStartMenu();"`;
        } else if (isCustom) {
            if (pData.type === 'folder') {
                clickAttr = `onclick="openProgram('folder-window'); if(typeof window.navigateTo==='function') window.navigateTo('${pData.path.replace(/\\/g, '\\\\')}'); toggleStartMenu();"`;
            } else if (pData.app && pData.app !== 'folder-window') {
                clickAttr = `onclick="openProgram('${pData.app}'); toggleStartMenu();"`;
            } else {
                let parts = pData.path.split('\\');
                let fileName = parts.pop();
                let parentPath = parts.join('\\');
                clickAttr = `onclick="if(typeof executeFile==='function') executeFile('${fileName.replace(/'/g, "\\'")}', window.resolvePath('${pData.path.replace(/\\/g, '\\\\')}'), '${parentPath.replace(/\\/g, '\\\\')}'); toggleStartMenu();"`;
            }
        }
        
        let safeName = (isCustom ? pData.path : pName).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        
        pinnedHtml += `<div class="start-menu-item" data-name="${pName}" ${clickAttr} oncontextmenu="showStartItemContext(event, '${safeName}', true)">
            ${imgTag} <span style="font-weight:bold;">${pName}</span>
        </div>`;
    });
    
    pinnedContainer.innerHTML = pinnedHtml;
    recentContainer.innerHTML = recentHtml;
}

window.showStartItemContext = function(e, appName, isPinned) {
    e.preventDefault();
    e.stopPropagation();
    
    let ctx = document.getElementById('context-menu-startitem');
    if(!ctx) return;
    
    window.contextMenuTarget = 'startitem';
    window.selectedStartItem = { name: appName, isPinned: isPinned };
    
    let pinBtn = document.getElementById('ctx-startitem-pin');
    let openBtn = document.getElementById('ctx-startitem-open');
    
    if(isPinned) {
        pinBtn.innerText = "Unpin from Start menu";
        pinBtn.onclick = function() { window.unpinStartItem(appName); ctx.style.display='none'; };
    } else {
        pinBtn.innerText = "Pin to Start menu";
        pinBtn.onclick = function() { window.pinStartItem(appName); ctx.style.display='none'; };
    }
    
    openBtn.onclick = function() {
        let app = typeof STORE_APPS !== 'undefined' ? STORE_APPS.find(a => a.name === appName) : null;
        if(app) {
            let id = app.id;
            if(id === 'cmd' && typeof initCmd === 'function') initCmd();
            if(id === 'paint' && typeof initPaint === 'function') initPaint();
            if(id === 'soundrecorder' && typeof initSoundRecorder === 'function') initSoundRecorder();
            if(id === 'notepad' && typeof clearNotepad === 'function') clearNotepad();
            openProgram(id + '-window');
            toggleStartMenu();
        }
        ctx.style.display='none';
    };
    
    ctx.style.display = 'flex';
    
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + ctx.offsetWidth > window.innerWidth) x = window.innerWidth - ctx.offsetWidth;
    if (y + ctx.offsetHeight > window.innerHeight - 40) y = window.innerHeight - 40 - ctx.offsetHeight;
    
    ctx.style.left = x + 'px';
    ctx.style.top = y + 'px';
    
    document.querySelectorAll('.context-menu, .app-menu-dropdown').forEach(c => {
        if(c.id !== 'context-menu-startitem') c.style.display = 'none';
    });
};

window.openFileLocation = function() {
    let item = null;
    let fromStartMenu = false;
    if (window.contextMenuTarget === 'startitem' && window.selectedStartItem) {
        item = window.selectedStartItem;
        fromStartMenu = true;
    } else if (window.selectedFileContext) {
        item = window.selectedFileContext;
    }

    if (!item) return;

    let targetPath = null;
    if (fromStartMenu) {
        let exeFound = null;
        let pName = item.name + ".lnk";
        let root = window.resolvePath("C:\\");
        function searchFs(dir, p) {
            if (!dir) return;
            for(let k in dir) {
                if (k.replace('.lnk','') === item.name) {
                    exeFound = {path: p, name: k, obj: dir[k]};
                    return;
                }
                if (dir[k].type === 'folder' && dir[k].contents) searchFs(dir[k].contents, p + "\\" + k);
            }
        }
        if (root) searchFs(root, "C:");
        
        if (exeFound) {
            if (exeFound.obj.type === 'shortcut' && exeFound.obj.target) {
                targetPath = exeFound.obj.target;
            } else {
                targetPath = exeFound.path + "\\" + exeFound.name;
            }
        } else {
            if(typeof window.xpDialog === 'function') window.xpDialog("Error", "Could not locate file for " + item.name, "error");
            return;
        }
    } else {
        let dir = window.resolvePath(item.path);
        if (dir && dir[item.name]) {
            let obj = dir[item.name];
            if (obj.type === 'shortcut' && obj.target) {
                targetPath = obj.target;
            } else {
                targetPath = item.path + "\\" + item.name;
            }
        }
    }

    if (targetPath) {
        let parentDir = targetPath.substring(0, targetPath.lastIndexOf('\\'));
        if (parentDir === "C:" || targetPath === "C:\\") parentDir = "C:\\";
        let fileName = targetPath.split('\\').filter(p=>p!=='').pop();

        if (typeof window.openProgram === 'function') window.openProgram('folder-window');
        if (typeof window.renderExplorer === 'function') {
            window.renderExplorer(parentDir);
            setTimeout(() => {
                let els = document.querySelectorAll('#explorer-content .file-icon');
                els.forEach(el => {
                    if (el.getAttribute('data-name') === fileName) {
                        if (typeof window.xpClearSelection === 'function') window.xpClearSelection('folder');
                        el.classList.add('selected');
                        el.scrollIntoView({behavior: "smooth", block: "center"});
                        window.selectedFileContext = {path: parentDir, name: fileName};
                    }
                });
            }, 100);
        }
    }
};

window.zIndexCounter = window.currentZIndex || 1000;

if (typeof window.syncThemeDropdowns === 'undefined') {
    window.syncThemeDropdowns = function(sourceId) {
        let val = document.getElementById(sourceId).value;
        if(sourceId === 'theme-select-appearance') {
            let other = document.getElementById('theme-select-display');
            if(other) other.value = val;
        } else {
            let other = document.getElementById('theme-select-appearance');
            if(other) other.value = val;
        }
        if (typeof changeTheme === 'function') changeTheme();
    };
}



window.addPrinterWizard = async function() {
    let name = await window.xpDialog('Add Printer', 'Enter a name for the new printer:', 'prompt', 'HP LaserJet ' + Math.floor(Math.random() * 9000));
    if (name) {
        window.installedPrinters.push({
            name: name,
            type: 'Local Printer',
            port: 'LPT1:',
            status: 'Ready'
        });
        window._renderPrintersList();
        window.xpDialog('Add Printer Wizard', 'Printer "' + name + '" was installed successfully.', 'info');
    }
};

window.setupFaxing = async function() {
    let fax = await window.xpDialog('Fax Setup', 'Enter a fax number to send a test page:', 'prompt', '555-0199');
    if (fax) {
        window.xpDialog('Fax Setup', 'Dialing ' + fax + '...\n\nFax test page sent successfully.', 'info');
    }
};



window.seeWhatsPrinting = function() {
    window.xpDialog('Print Queue', 'There are currently 0 documents in the print queue.', 'info');
};

window.pausePrinting = function() {
    window.xpDialog('Printers', 'Printing has been paused for the selected printer.', 'info');
};

window.cancelAllDocuments = async function() {
    let confirm = await window.xpDialog('Cancel All Documents', 'Are you sure you want to cancel all documents for this printer?', 'confirm');
    if(confirm) {
        window.xpDialog('Printers', 'All documents have been canceled.', 'info');
    }
};

window.setPrinterProperties = function() {
    window.xpDialog('Printer Properties', 'General\n- Location: Office\n- Comment: Main Printer\n\nAdvanced\n- Driver: Microsoft XPS Document Writer v4\n- Spool print documents: Yes', 'info');
};

window.renamePrinter = async function() {
    let name = await window.xpDialog('Rename Printer', 'Enter a new name for this printer:', 'prompt', 'My Printer');
    if(name) {
        window.xpDialog('Success', 'Printer renamed to: ' + name, 'info');
    }
};

window.deletePrinter = async function() {
    let confirm = await window.xpDialog('Delete Printer', 'Are you sure you want to delete this printer?', 'confirm');
    if(confirm) {
        window.xpDialog('Success', 'The printer has been deleted.', 'info');
    }
};



window.installedPrinters = [
    {id: 'xps', name: 'Microsoft XPS Document Writer', status: 'Ready', paused: false, queue: 0}
];
window.selectedPrinterId = null;

window.renderPrinters = function() {
    let area = document.getElementById('printers-list-area');
    if(!area) return;
    area.innerHTML = '';
    window.installedPrinters.forEach(p => {
        let isSelected = (window.selectedPrinterId === p.id);
        let bg = isSelected ? 'rgba(49, 106, 197, 1)' : 'transparent';
        let fg = isSelected ? '#fff' : '#000';
        let subColor = isSelected ? '#ccc' : '#666';
        let statusText = p.status;
        if(p.paused) statusText = 'Paused';
        
        let el = document.createElement('div');
        el.style.cssText = `display:flex; flex-direction:column; align-items:center; width:80px; text-align:center; cursor:default; padding:5px; background:${bg}; color:${fg};`;
        el.onmouseover = () => { if(!isSelected) el.style.background='rgba(49, 106, 197, 0.1)'; };
        el.onmouseout = () => { if(!isSelected) el.style.background='transparent'; };
        el.onclick = (e) => { e.stopPropagation(); window.selectPrinter(p.id); };
        
        el.innerHTML = `
            <img src="Windows XP Icons/Printers and Faxes.png" style="width:32px;height:32px;margin-bottom:5px;">
            <span style="font-size:11px;word-break:break-word;">${p.name}<br><span style="color:${subColor};">${statusText}</span></span>
        `;
        area.appendChild(el);
    });
};

window.selectPrinter = function(id) {
    window.selectedPrinterId = id;
    window.renderPrinters();
};

window.addPrinterWizard = async function() {
    let name = await window.xpDialog('Add Printer', 'Enter a name for the new printer:', 'prompt', 'New Printer');
    if(name) {
        let id = 'p_' + Date.now();
        window.installedPrinters.push({id: id, name: name, status: 'Ready', paused: false, queue: 0});
        window.selectPrinter(id);
    }
};

window.seeWhatsPrinting = function() {
    let p = window.installedPrinters.find(x => x.id === window.selectedPrinterId);
    if(!p) return window.xpDialog('Printers', 'Please select a printer first.', 'info');
    window.xpDialog('Print Queue - ' + p.name, 'There are currently ' + p.queue + ' documents in the print queue.', 'info');
};

window.pausePrinting = function() {
    let p = window.installedPrinters.find(x => x.id === window.selectedPrinterId);
    if(!p) return window.xpDialog('Printers', 'Please select a printer first.', 'info');
    p.paused = !p.paused;
    window.renderPrinters();
};

window.setPrinterProperties = function() {
    let p = window.installedPrinters.find(x => x.id === window.selectedPrinterId);
    if(!p) return window.xpDialog('Printers', 'Please select a printer first.', 'info');
    window.xpDialog(p.name + ' Properties', 'General\n- Status: ' + (p.paused ? 'Paused' : p.status) + '\n- Documents in queue: ' + p.queue, 'info');
};

window.renamePrinter = async function() {
    let p = window.installedPrinters.find(x => x.id === window.selectedPrinterId);
    if(!p) return window.xpDialog('Printers', 'Please select a printer first.', 'info');
    let name = await window.xpDialog('Rename Printer', 'Enter a new name for this printer:', 'prompt', p.name);
    if(name) {
        p.name = name;
        window.renderPrinters();
    }
};

window.deletePrinter = async function() {
    let p = window.installedPrinters.find(x => x.id === window.selectedPrinterId);
    if(!p) return window.xpDialog('Printers', 'Please select a printer first.', 'info');
    let confirm = await window.xpDialog('Delete Printer', 'Are you sure you want to delete ' + p.name + '?', 'confirm');
    if(confirm) {
        window.installedPrinters = window.installedPrinters.filter(x => x.id !== p.id);
        window.selectedPrinterId = null;
        window.renderPrinters();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.renderPrinters, 500);
});

// hook into openProgram directly
let originalOpenProgramForPrinters = window.openProgram;
window.openProgram = function(id) {
    if(typeof originalOpenProgramForPrinters === 'function') originalOpenProgramForPrinters(id);
    if(id === 'printers-window') {
        setTimeout(window.renderPrinters, 50);
    }
};

// Also initial render in case it's already open
window.renderPrinters();


window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if(window.fs && window.fs['C:'] && window.fs['C:'].contents['Documents and Settings']) {
            let users = window.fs['C:'].contents['Documents and Settings'].contents;
            for(let u in users) {
                if(users[u] && users[u].contents && users[u].contents['Desktop'] && users[u].contents['Desktop'].contents) {
                    if(users[u].contents['Desktop'].contents['Windows Picture and Fax Viewer.lnk']) {
                        delete users[u].contents['Desktop'].contents['Windows Picture and Fax Viewer.lnk'];
                    }
                }
            }
            if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
            if(typeof window.renderDesktop === 'function') window.renderDesktop();
        }
    }, 1000);
});


window.pinnedAppMeta = window.pinnedAppMeta || {};
window.pinnedAppMeta['Network Connections'] = { name: 'Network Connections', icon: 'Windows XP Icons/Network Connection.png', fn: "xpDialog('Network Connections', 'No network adapters found.', 'error'); toggleStartMenu();" };
window.pinnedAppMeta['My Network Places'] = { name: 'My Network Places', icon: 'Windows XP Icons/My Network Places.png', fn: "xpDialog('My Network Places', 'You are not connected to a network.', 'error'); toggleStartMenu();" };

// Intercept getAppMetadata to return these
let origGetAppMeta = window.getAppMetadata;
window.getAppMetadata = function(name) {
    if(window.pinnedAppMeta && window.pinnedAppMeta[name]) return window.pinnedAppMeta[name];
    if(typeof origGetAppMeta === 'function') return origGetAppMeta(name);
    return null;
};

// Search functionality
window.startMenuSearch = function(query, executeFirst) {
    let q = (query || '').trim().toLowerCase();
    
    let pinnedContainer = document.getElementById('start-menu-pinned-container');
    let recentContainer = document.getElementById('start-menu-recent-container');
    let allBtn = document.querySelector('.all-programs-btn');
    let div1 = document.querySelectorAll('.start-menu-divider')[0];
    let div2 = document.querySelectorAll('.start-menu-divider')[1];
    let resultsContainer = document.getElementById('start-menu-search-results');
    let overlay = document.getElementById('all-programs-overlay');
    
    if(!resultsContainer) return;
    
    if(q === '') {
        // Show normal start menu
        if(pinnedContainer) pinnedContainer.style.display = 'flex';
        if(recentContainer) recentContainer.style.display = 'flex';
        if(allBtn) allBtn.style.display = 'flex';
        if(div1) div1.style.display = 'block';
        if(div2) div2.style.display = 'block';
        resultsContainer.style.display = 'none';
        if(overlay) overlay.style.display = 'none';
        return;
    }
    
    // Hide normal start menu
    if(pinnedContainer) pinnedContainer.style.display = 'none';
    if(recentContainer) recentContainer.style.display = 'none';
    if(allBtn) allBtn.style.display = 'none';
    if(div1) div1.style.display = 'none';
    if(div2) div2.style.display = 'none';
    if(overlay) overlay.style.display = 'none';
    
    resultsContainer.style.display = 'flex';
    resultsContainer.innerHTML = '';
    
    // Collect all apps
    let allApps = [];
    
    // Hardcoded missing ones
    allApps.push({ name: 'Control Panel', icon: 'Windows XP Icons/Control Panel.png', fn: "openProgram('controlpanel-window'); toggleStartMenu();" });
    allApps.push({ name: 'Printers and Faxes', icon: 'Windows XP Icons/Printers and Faxes.png', fn: "openProgram('printers-window'); toggleStartMenu();" });
    allApps.push({ name: 'Help and Support', icon: 'Windows XP Icons/Help and Support.png', fn: "if(typeof openHelpForSelected==='function'){openHelpForSelected();}else{openProgram('help-window'); showHelpTopic('home');} toggleStartMenu();" });
    allApps.push({ name: 'Command Prompt', icon: 'Windows XP Icons/Command Prompt.png', fn: "if(typeof initCmd==='function')initCmd(); openProgram('cmd-window'); toggleStartMenu();" });
    
    // Top apps
    let topApps = [
        { name: 'Internet Explorer', icon: 'Windows XP Icons/Internet Explorer 6.png', fn: "openProgram('ie-window'); toggleStartMenu();" },
        { name: 'Outlook Express', icon: 'Windows XP Icons/Outlook Express.png', fn: "openProgram('email-window'); toggleStartMenu();" },
        { name: 'Windows Media Player', icon: 'Windows XP Icons/Windows Media Player 9.png', fn: "openProgram('mediaplayer-window'); toggleStartMenu();" },
        { name: 'Windows Messenger', icon: 'Windows XP Icons/Windows Messenger.png', fn: "openProgram('messenger-window'); toggleStartMenu();" },
        { name: 'Remote Desktop', icon: 'Windows XP Icons/Remote Desktop.png', fn: "if(typeof initRemoteDesktop==='function')initRemoteDesktop(); openProgram('remotedesktop-window'); toggleStartMenu();" },
        { name: 'Tour Windows XP', icon: 'Windows XP Icons/Tour XP.png', fn: "openProgram('xptour-window'); toggleStartMenu();" },
        { name: 'Microsoft Excel', icon: 'Windows XP Icons/Graph View.png', fn: "openProgram('excel-window'); toggleStartMenu();" },
        { name: 'Photon Picture Viewer', icon: 'Windows XP Icons/Windows Picture and Fax Viewer.png', fn: "openProgram('photon-window'); toggleStartMenu();" }
    ];
    allApps = allApps.concat(topApps);
    
    // Add pinned apps missing
    if(window.pinnedAppMeta) {
        for(let k in window.pinnedAppMeta) {
            allApps.push(window.pinnedAppMeta[k]);
        }
    }
    
    // Categories apps
    let catApps = [
        { name: 'Notepad', icon: 'Windows XP Icons/Notepad.png', fn: "if(typeof clearNotepad==='function')clearNotepad(); openProgram('notepad-window'); toggleStartMenu();" },
        { name: 'WordPad', icon: 'Windows XP Icons/Wordpad.png', fn: "openProgram('wordpad-window'); toggleStartMenu();" },
        { name: 'Paint', icon: 'Windows XP Icons/Paint.png', fn: "if(typeof initPaint==='function')initPaint(); openProgram('paint-window'); toggleStartMenu();" },
        { name: 'Calculator', icon: 'Windows XP Icons/Calculator.png', fn: "openProgram('calc-window'); toggleStartMenu();" },
        { name: 'Character Map', icon: 'Windows XP Icons/Charmap.png', fn: "openProgram('charmap-window'); toggleStartMenu();" },
        { name: 'Sound Recorder', icon: 'Windows XP Icons/Generic Audio.png', fn: "openProgram('soundrecorder-window'); toggleStartMenu();" },
        { name: 'Clipboard Viewer', icon: 'Windows XP Icons/System Properties.png', fn: "openProgram('clipbook-window'); toggleStartMenu();" },
        { name: 'Minesweeper', icon: 'Windows XP Icons/Minesweeper.png', fn: "openProgram('minesweeper-window'); toggleStartMenu();" },
        { name: 'Solitaire', icon: 'Windows XP Icons/Solitaire.png', fn: "openProgram('solitaire-window'); toggleStartMenu();" },
        { name: 'FreeCell', icon: 'Windows XP Icons/Freecell.png', fn: "openProgram('freecell-window'); toggleStartMenu();" },
        { name: 'Hearts', icon: 'Windows XP Icons/Hearts.png', fn: "openProgram('hearts-window'); toggleStartMenu();" },
        { name: 'Internet Spades', icon: 'Windows XP Icons/Internet Spades.png', fn: "openProgram('spades-window'); toggleStartMenu();" },
        { name: '3D Pinball', icon: 'Windows XP Icons/Pinball.png', fn: "openProgram('pinball-window'); toggleStartMenu();" },
        { name: 'Disk Defragmenter', icon: 'Windows XP Icons/Disk Defragmenter.png', fn: "openProgram('defrag-window'); toggleStartMenu();" },
        { name: 'System Information', icon: 'Windows XP Icons/System Properties.png', fn: "openProgram('sysinfo-window'); toggleStartMenu();" },
        { name: 'Registry Editor', icon: 'Windows XP Icons/Registry Editor.png', fn: "openProgram('regedit-window'); toggleStartMenu();" },
        { name: 'Task Manager', icon: 'Windows XP Icons/Task Manager.png', fn: "if(typeof window.openTaskManager==='function'){window.openTaskManager();}else{openProgram('taskmgr-window');} toggleStartMenu();" }
    ];
    allApps = allApps.concat(catApps);
    
    // Store apps
    if (typeof STORE_APPS !== 'undefined' && typeof window.isAppInstalled === 'function') {
        STORE_APPS.forEach(app => {
            if (window.isAppInstalled(app)) {
                allApps.push({ name: app.name, icon: app.icon.startsWith('data:') || app.icon.includes('/') ? app.icon : ('Windows XP Icons/' + app.icon + '.png'), fn: `openProgram('${app.appId}'); toggleStartMenu();` });
            }
        });
    }
    
    // Desktop apps (fallback)
    let desk = null;
    if(window.fs && window.fs['C:'] && window.fs['C:'].contents['Documents and Settings']) {
        let acc = window.currentAccount || 'Administrator';
        if(window.fs['C:'].contents['Documents and Settings'].contents[acc]) {
            desk = window.fs['C:'].contents['Documents and Settings'].contents[acc].contents['Desktop'].contents;
        }
    }
    if(desk) {
        for(let k in desk) {
            if(k.toLowerCase().endsWith('.lnk') || desk[k].type === 'exe') {
                let n = k.replace(/.lnk$/i, '');
                if(!allApps.find(a => a.name === n)) {
                    // Try to resolve icon
                    let icon = desk[k].icon;
    if(icon && window.sysIcons && window.sysIcons[icon]) {
        icon = window.sysIcons[icon];
    } else if(icon && !icon.includes('/') && !icon.startsWith('data:')) {
        icon = 'Windows XP Icons/' + icon + '.png';
    }
                    let appId = desk[k].app || 'notepad-window';
                    allApps.push({ name: n, icon: icon || 'Windows XP Icons/Executable.png', fn: `openProgram('${appId}'); toggleStartMenu();` });
                }
            }
        }
    }

    // Filter using 'includes'      // Filter out ANY apps that are uninstalled or deleted
      let finalApps = [];
      if (typeof window.isAppInstalled === 'function') {
          allApps.forEach(a => {
              // Try to find app name to check. Some names in allApps differ slightly from isAppInstalled mapping.
              let checkName = a.name;
              
              // Direct checks for apps added from STORE_APPS
              let sApp;
              if (typeof STORE_APPS !== 'undefined') {
                  sApp = STORE_APPS.find(sa => sa.name.toLowerCase() === a.name.toLowerCase() || (a.fn && sa.appId && a.fn.includes(sa.appId)));
              }
              
              if (sApp) {
                  if (window.isAppInstalled(sApp.name)) finalApps.push(a);
              } else {
                  // Standard apps - we just ask isAppInstalled. If it returns true, we keep it.
                  // It will return false if the exe is deleted (or if it's an unrecognized random desktop shortcut).
                  // So we only filter out apps that are explicitly recognized by isAppInstalled mapping but return false.
                  // Wait, if it's a random desktop shortcut that isn't in isAppInstalled mapping, isAppInstalled returns false.
                  // So we must check if it's a KNOWN app.
                  let knownAppNames = [
                      'Notepad', 'WordPad', 'Paint', 'Calculator', 'Character Map', 'Sound Recorder', 'Clipboard Viewer',
                      'Minesweeper', 'Solitaire', 'FreeCell', 'Hearts', 'Internet Spades', '3D Pinball', 'Disk Defragmenter',
                      'System Information', 'Registry Editor', 'Task Manager', 'Command Prompt', 'Internet Explorer',
                      'Outlook Express', 'Windows Media Player', 'Windows Messenger', 'Remote Desktop', 'Tour Windows XP',
                      'Photon Picture Viewer', 'Control Panel', 'Printers and Faxes', 'Help and Support', 'Microsoft FrontPage', 'Microsoft Excel'
                  ];
                  
                  let isKnown = knownAppNames.find(k => k.toLowerCase() === a.name.toLowerCase());
                  if (isKnown) {
                      if (window.isAppInstalled(isKnown)) finalApps.push(a);
                  } else {
                      // It's a custom shortcut or random file on desktop, just keep it.
                      finalApps.push(a);
                  }
              }
          });
          allApps = finalApps;
      }

    let seen = new Set();
    let matches = [];
    allApps.forEach(a => {
        if(!seen.has(a.name) && a.name.toLowerCase().includes(q)) {
            seen.add(a.name);
            matches.push(a);
        }
    });
    
    if(executeFirst && matches.length > 0) {
        // Execute the first match
        eval(matches[0].fn);
        return;
    }
    
    if(matches.length === 0) {
        resultsContainer.innerHTML = '<div style="padding:10px; color:#555; text-align:center;">No results found.</div>';
    } else {
        matches.forEach(app => {
            let item = document.createElement('div');
            item.className = 'start-menu-item';
            item.setAttribute('onclick', app.fn);
            item.innerHTML = `<img src="${app.icon}" class="sys-icon-small" style="margin-right:8px;" onerror="this.style.display='none'"><span>${app.name}</span>`;
            resultsContainer.appendChild(item);
        });
    }
};

// Clear search when opening start menu
let origToggleStartMenu = window.toggleStartMenu;
window.toggleStartMenu = function() {
    origToggleStartMenu();
    let inp = document.getElementById('start-menu-search-input');
    let sm = document.getElementById('start-menu');
    if(sm && sm.style.display === 'flex' && inp) {
        inp.value = '';
        window.startMenuSearch('');
        setTimeout(() => inp.focus(), 50);
    }
};

// Also patch default pinned apps in current localStorage if possible
window.addEventListener('DOMContentLoaded', () => {
    let acc = window.currentAccount || 'Administrator';
    let saved = localStorage.getItem('xp_pinned_apps_' + acc);
    if(saved) {
        try {
            let p = JSON.parse(saved);
            if(!p.includes('Network Connections')) p.push('Network Connections');
            if(!p.includes('My Network Places')) p.push('My Network Places');
            localStorage.setItem('xp_pinned_apps_' + acc, JSON.stringify(p));
        } catch(e){}
    }
});


// Game auto-initializer
let origOpenProgramForGames = window.openProgram;
window.openProgram = function(id) {
    if(id === 'freecell-window' && typeof freecellNewGame === 'function' && !window.freecellInit) { freecellNewGame(); window.freecellInit = true; }
    if(id === 'hearts-window' && typeof heartsNewGame === 'function' && !window.heartsInit) { heartsNewGame(); window.heartsInit = true; }
    if(id === 'spades-window' && typeof spadesNewGame === 'function' && !window.spadesInit) { spadesNewGame(); window.spadesInit = true; }
    if(id === 'solitaire-window' && typeof solNewGame === 'function' && !window.solInit) { solNewGame(); window.solInit = true; }
    
    if(typeof origOpenProgramForGames === 'function') origOpenProgramForGames(id);
};


window.startDesktopSelection = function(e) {
    if(e.target.id !== 'desktop') return;
    if(e.button !== 0) return;
    e.preventDefault();
    
    if(typeof window.xpClearSelection === 'function') window.xpClearSelection('desktop');
    
    let box = document.getElementById('desktop-selection-box');
    if(!box) {
        box = document.createElement('div');
        box.id = 'desktop-selection-box';
        box.style.position = 'absolute';
        box.style.border = '1px solid rgba(0, 0, 150, 0.7)';
        box.style.background = 'rgba(0, 50, 255, 0.2)';
        box.style.zIndex = '9000';
        box.style.pointerEvents = 'none';
        document.getElementById('desktop').appendChild(box);
    }
    
    let startX = e.clientX;
    let startY = e.clientY;
    box.style.left = startX + 'px';
    box.style.top = startY + 'px';
    box.style.width = '0px';
    box.style.height = '0px';
    box.style.display = 'block';
    
    let lastFrameTime = 0;
    
    function move(e2) {
        e2.preventDefault();
        
        let now = Date.now();
        // 24fps is roughly 41ms per frame. Throttle updates to achieve this stuttery effect.
        if (now - lastFrameTime < 41) {
            return;
        }
        lastFrameTime = now;
        
        let currentX = e2.clientX;
        let currentY = e2.clientY;
        box.style.left = Math.min(startX, currentX) + 'px';
        box.style.top = Math.min(startY, currentY) + 'px';
        box.style.width = Math.abs(currentX - startX) + 'px';
        box.style.height = Math.abs(currentY - startY) + 'px';
        
        let boxRect = box.getBoundingClientRect();
        let icons = document.querySelectorAll('#desktop .desktop-icon');
        window.draggedFiles = [];
        icons.forEach(icon => {
            let rect = icon.getBoundingClientRect();
            if (!(rect.right < boxRect.left || 
                  rect.left > boxRect.right || 
                  rect.bottom < boxRect.top || 
                  rect.top > boxRect.bottom)) {
                icon.classList.add('selected');
                let title = icon.querySelector('span');
                if(title) {
                    let name = title.innerText;
                    if(window.guestDesk && window.guestDesk[name]) {
                        window.draggedFiles.push({source:'desktop', path: 'C:/Documents and Settings/Guest/Desktop', name: name});
                    } else {
                        window.draggedFiles.push({source:'desktop', path: 'C:/Documents and Settings/Administrator/Desktop', name: name});
                    }
                }
            } else {
                icon.classList.remove('selected');
            }
        });
    }
    
    function up(e2) {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        box.style.display = 'none';
        
        window.justFinishedLasso = true;
        setTimeout(() => window.justFinishedLasso = false, 200);
        
        if(box.style.width === '0px' && box.style.height === '0px') {
             window.draggedFiles = [];
        } else if (window.draggedFiles && window.draggedFiles.length > 0) {
             window.selectedFileContext = window.draggedFiles[0];
        }
    }
    
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
};


// ===== TOGGLE TRAY POPUP =====
window.toggleTrayPopup = function(id) {
    let popup = document.getElementById(id);
    if (!popup) return;
    let isVisible = popup.style.display !== 'none';
    // Close all other popups first
    ['vol-popup', 'net-popup'].forEach(pid => {
        let el = document.getElementById(pid);
        if (el) el.style.display = 'none';
    });
    popup.style.display = isVisible ? 'none' : 'block';
    
    // Dismiss on outside click
    if (!isVisible) {
        setTimeout(() => {
            function outsideClick(e) {
                if (!popup.contains(e.target)) {
                    popup.style.display = 'none';
                    document.removeEventListener('mousedown', outsideClick);
                }
            }
            document.addEventListener('mousedown', outsideClick);
        }, 50);
    }
};

// ===== MULTI-INSTANCE WINDOW SYSTEM =====
// Registry of apps that support multi-instance
window._multiInstances = {}; // appId -> count

window.openNewAppInstance = function(templateId, appName, appIcon) {
    if (!window._multiInstances[templateId]) window._multiInstances[templateId] = 0;
    window._multiInstances[templateId]++;
    let count = window._multiInstances[templateId];
    
    let template = document.getElementById(templateId);
    if (!template) { console.warn('No template for', templateId); return; }
    
    let newId = templateId + '-inst-' + count;
    if (document.getElementById(newId)) {
        window.openProgram(newId);
        return;
    }
    
    // Clone the template
    let clone = template.cloneNode(true);
    clone.id = newId;
    clone.style.display = 'block';
    let baseTop = parseInt(template.style.top) || 50;
    let baseLeft = parseInt(template.style.left) || 50;
    clone.style.top = (baseTop + count * 24) + 'px';
    clone.style.left = (baseLeft + count * 24) + 'px';
    clone.removeAttribute('onmousedown');
    
    // Make the clone's title bar id unique so makeDraggable works
    let titleBarId = newId + '-title';
    let titleBar = clone.querySelector('.title-bar');
    if (titleBar) titleBar.id = titleBarId;
    
    // Fix all other IDs inside to be unique (but not title bar, already done)
    clone.querySelectorAll('[id]').forEach(el => {
        if (el.id !== titleBarId) {
            el.id = el.id + '-inst-' + count;
        }
    });
    
    // Clear content areas
    let textarea = clone.querySelector('textarea');
    if (textarea) textarea.value = '';
    let contentEditable = clone.querySelector('[contenteditable]');
    if (contentEditable) contentEditable.innerHTML = '';
    let canvas = clone.querySelector('canvas');
    if (canvas) {
        // Defer canvas clear until after it's in DOM
        setTimeout(() => {
            let ctx2 = canvas.getContext('2d');
            if (ctx2) {
                ctx2.fillStyle = 'white';
                ctx2.fillRect(0, 0, canvas.width, canvas.height);
            }
        }, 50);
    }
    
    // Fix title bar control buttons
    let btns = clone.querySelectorAll('.win-btn');
    if (btns[0]) btns[0].setAttribute('onclick', 'minimizeWindow("' + newId + '")');
    if (btns[1]) btns[1].setAttribute('onclick', 'maximizeWindow("' + newId + '")');
    if (btns[2]) btns[2].setAttribute('onclick', 'closeWindow("' + newId + '")');
    
    // Add mousedown for bringToFront
    clone.addEventListener('mousedown', function() { window.bringToFront(this); });
    
    document.body.appendChild(clone);
    
    // Make the new window draggable via its title bar
    if (typeof window.makeDraggable === 'function' && document.getElementById(titleBarId)) {
        window.makeDraggable(newId, titleBarId);
    }
    
    // Add to taskbar using the same exact pattern as openProgram in os_core.js
    let tasks = document.getElementById('taskbar-tasks');
    if (tasks && !document.getElementById('task-' + newId)) {
        let btn = document.createElement('div');
        btn.className = 'task-item';
        btn.id = 'task-' + newId;
        btn.oncontextmenu = function(e) {
            e.preventDefault();
            if(typeof window.showTaskbarContextMenu === 'function') {
                window.showTaskbarContextMenu(e, newId);
            }
        };
        let iconHtml = appIcon ? '<img src="' + appIcon + '" style="width:16px;height:16px;flex-shrink:0;" onerror="this.style.display=\'none\'"> ' : '';
        btn.innerHTML = iconHtml + '<span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + appName + '</span>';
        btn.onclick = function() {
            let w = document.getElementById(newId);
            if (!w) return;
            if (w.style.display !== 'none' && !w.classList.contains('minimized')) {
                window.minimizeWindow(newId);
            } else {
                w.style.display = 'block';
                w.classList.remove('minimized');
                window.bringToFront(w);
            }
        };
        tasks.appendChild(btn);
    }
    
    window.bringToFront(clone);
    return newId;
};

// Override clearNotepad to instead open a new notepad window
window._origClearNotepad = window.clearNotepad;
window.clearNotepad = function() {
    window.openNewAppInstance('notepad-window', 'Notepad', 'Windows XP Icons/Notepad.png');
};

// WordPad new
window.wordpadNew = function() {
    window.openNewAppInstance('wordpad-window', 'WordPad', 'Windows XP Icons/Wordpad.png');
};

// Paint new
window.paintNew = function() {
    window.openNewAppInstance('paint-window', 'Paint', 'Windows XP Icons/Paint.png');
};

// Excel new
window._origExcelNew = window.excelNew;
window.excelNew = function() {
    window.openNewAppInstance('excel-window', 'Microsoft Excel', 'Windows XP Icons/Graph View.png');
};

// ===== NOTEPAD FONT DIALOG =====
window.openNotepadFontDialog = function() {
    // Close existing if open
    let existing = document.getElementById('font-dialog-overlay');
    if (existing) { existing.remove(); return; }
    
    let overlay = document.createElement('div');
    overlay.id = 'font-dialog-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);z-index:99999;display:flex;align-items:center;justify-content:center;';
    
    let fonts = [
        'Courier New', 'Lucida Console', 'Times New Roman', 'Arial', 'Tahoma',
        'Verdana', 'MS Sans Serif', 'Comic Sans MS', 'Trebuchet MS', 'Georgia'
    ];
    let sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    
    let notepads = Array.from(document.querySelectorAll('.window')).filter(w => w.id.startsWith('notepad-window') && w.style.display !== 'none');
    notepads.sort((a,b) => (parseInt(b.style.zIndex)||0) - (parseInt(a.style.zIndex)||0));
    let activeNotepad = notepads[0];
    let ta = activeNotepad ? activeNotepad.querySelector('textarea') : document.getElementById('notepad-textarea');
    let curFont = ta ? ta.style.fontFamily || 'Lucida Console' : 'Lucida Console';
    let curSize = ta ? parseInt(ta.style.fontSize) || 14 : 14;
    let curBold = ta ? ta.style.fontWeight === 'bold' : false;
    let curItalic = ta ? ta.style.fontStyle === 'italic' : false;
    
    overlay.innerHTML = `
        <div style="background:#ECE9D8;border:2px outset #fff;padding:0;font-family:Tahoma;font-size:11px;width:420px;box-shadow:4px 4px 10px rgba(0,0,0,0.4);">
            <div style="background:linear-gradient(to right,#003087,#3a6ec8);color:white;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;">
                <span style="display:flex;align-items:center;gap:5px;"><img src="Windows XP Icons/Notepad.png" style="width:16px;height:16px;" onerror="this.style.display='none'"> Font</span>
                <span style="cursor:pointer;font-size:12px;font-weight:bold;" onclick="document.getElementById('font-dialog-overlay').remove()">✕</span>
            </div>
            <div style="padding:12px;display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;gap:10px;">
                    <div style="flex:2;">
                        <div style="margin-bottom:3px;font-weight:bold;">Font:</div>
                        <select id="fd-font" size="6" style="width:100%;font-family:Tahoma;font-size:11px;border:1px inset #999;padding:2px;">
                            ${fonts.map(f => `<option value="${f}" ${f.replace(/'/g,'') === curFont.replace(/'/g,'').trim() ? 'selected' : ''}>${f}</option>`).join('')}
                        </select>
                        <input type="text" id="fd-font-input" value="${curFont.replace(/'/g,'')}" style="width:100%;margin-top:2px;font-family:Tahoma;font-size:11px;border:1px inset #999;padding:2px;box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <div style="margin-bottom:3px;font-weight:bold;">Style:</div>
                        <select id="fd-style" size="6" style="width:100%;font-family:Tahoma;font-size:11px;border:1px inset #999;padding:2px;">
                            <option value="regular" ${(!curBold && !curItalic) ? 'selected' : ''}>Regular</option>
                            <option value="italic" ${(!curBold && curItalic) ? 'selected' : ''}>Italic</option>
                            <option value="bold" ${(curBold && !curItalic) ? 'selected' : ''}>Bold</option>
                            <option value="bold-italic" ${(curBold && curItalic) ? 'selected' : ''}>Bold Italic</option>
                        </select>
                        <input type="text" id="fd-style-input" value="${curBold && curItalic ? 'Bold Italic' : curBold ? 'Bold' : curItalic ? 'Italic' : 'Regular'}" style="width:100%;margin-top:2px;font-family:Tahoma;font-size:11px;border:1px inset #999;padding:2px;box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <div style="margin-bottom:3px;font-weight:bold;">Size:</div>
                        <select id="fd-size" size="6" style="width:100%;font-family:Tahoma;font-size:11px;border:1px inset #999;padding:2px;">
                            ${sizes.map(s => `<option value="${s}" ${s === curSize ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                        <input type="text" id="fd-size-input" value="${curSize}" style="width:100%;margin-top:2px;font-family:Tahoma;font-size:11px;border:1px inset #999;padding:2px;box-sizing:border-box;">
                    </div>
                </div>
                <div style="background:white;border:1px inset #999;padding:8px;height:50px;display:flex;align-items:center;justify-content:center;" id="fd-preview">
                    <span id="fd-preview-text" style="font-family:${curFont};font-size:${curSize}px;font-weight:${curBold?'bold':'normal'};font-style:${curItalic?'italic':'normal'};">AaBbYyZz</span>
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button id="fd-ok" style="font-family:Tahoma;font-size:11px;padding:3px 20px;">OK</button>
                    <button onclick="document.getElementById('font-dialog-overlay').remove()" style="font-family:Tahoma;font-size:11px;padding:3px 20px;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Live preview
    function updatePreview() {
        let font = document.getElementById('fd-font-input').value || document.getElementById('fd-font').value;
        let style = document.getElementById('fd-style').value;
        let size = document.getElementById('fd-size-input').value || document.getElementById('fd-size').value;
        let preview = document.getElementById('fd-preview-text');
        if (preview) {
            preview.style.fontFamily = font;
            preview.style.fontSize = size + 'px';
            preview.style.fontWeight = style.includes('bold') ? 'bold' : 'normal';
            preview.style.fontStyle = style.includes('italic') ? 'italic' : 'normal';
        }
    }
    
    document.getElementById('fd-font').addEventListener('change', function() {
        document.getElementById('fd-font-input').value = this.value;
        updatePreview();
    });
    document.getElementById('fd-style').addEventListener('change', function() {
        let labels = {regular:'Regular', italic:'Italic', bold:'Bold', 'bold-italic':'Bold Italic'};
        document.getElementById('fd-style-input').value = labels[this.value];
        updatePreview();
    });
    document.getElementById('fd-size').addEventListener('change', function() {
        document.getElementById('fd-size-input').value = this.value;
        updatePreview();
    });
    document.getElementById('fd-font-input').addEventListener('input', updatePreview);
    document.getElementById('fd-size-input').addEventListener('input', updatePreview);
    
    // OK
    document.getElementById('fd-ok').addEventListener('click', function() {
        let font = document.getElementById('fd-font-input').value || document.getElementById('fd-font').value;
        let style = document.getElementById('fd-style').value;
        let size = parseInt(document.getElementById('fd-size-input').value) || parseInt(document.getElementById('fd-size').value) || 14;
        // ta is already defined in outer scope, capturing active textarea
        if (ta) {
            ta.style.fontFamily = font;
            ta.style.fontSize = size + 'px';
            ta.style.fontWeight = style.includes('bold') ? 'bold' : 'normal';
            ta.style.fontStyle = style.includes('italic') ? 'italic' : 'normal';
        }
        overlay.remove();
    });
};


// ===== OPEN FILE LOCATION =====
window.openFileLocation = function() {
    let ctx = window.selectedFileContext || window.draggedFiles && window.draggedFiles[0];
    let path = ctx && ctx.path ? ctx.path : null;
    
    if (!path) {
        // Try from desktop selection
        let sel = document.querySelector('#desktop .desktop-icon.selected');
        if (sel) path = sel.getAttribute('data-path') || 'C:\\Documents and Settings\\Administrator\\Desktop';
    }
    
    if (path) {
        // Open folder window at that path
        if (typeof window.openFolderWindow === 'function') {
            window.openFolderWindow(path);
        } else {
            window.openProgram('folder-window');
            if (typeof window.navigateTo === 'function') {
                setTimeout(() => window.navigateTo(path), 100);
            } else if (typeof window.renderFolder === 'function') {
                setTimeout(() => window.renderFolder(path), 100);
            }
        }
    } else {
        window.openProgram('folder-window');
    }
};

// ===== OPEN HELP FOR SELECTED =====
window.openHelpForSelected = function() {
    let ctx = window.selectedFileContext;
    let name = ctx && ctx.name ? ctx.name.replace(/\.lnk$/i, '') : null;
    
    if (!name) {
        let sel = document.querySelector('#desktop .desktop-icon.selected span');
        if (sel) name = sel.innerText;
    }
    
    window.openProgram('help-window');
    setTimeout(() => {
        if (typeof window.showHelpTopic === 'function') {
            // Map some names to topics (lowercase keys)
            let topicMap = {
                'my computer': 'basics',
                'my documents': 'basics',
                'internet explorer': 'ie',
                'recycle bin': 'recycling',
                'control panel': 'basics',
                'notepad': 'notepad',
                'paint': 'paint',
                'calculator': 'calculator',
                'minesweeper': 'minesweeper',
                'solitaire': 'solitaire',
                'spider solitaire': 'solitaire',
                'hearts': 'hearts',
                'freecell': 'freecell',
                'spades': 'spades',
                'internet checkers': 'checkers',
                'checkers': 'checkers',
                'internet reversi': 'reversi',
                'reversi': 'reversi',
                'tetris xp': 'tetris',
                'wordpad': 'wordpad',
                'windows media player': 'media',
                'command prompt': 'cmd',
                'system information': 'sysinfo',
                'disk defragmenter': 'defrag',
                'registry editor': 'regedit',
                'outlook express': 'outlook',
                'remote desktop connection': 'remotedesktop',
                '3d pinball for windows - space cadet': 'pinball',
                '3d pinball for windows': 'pinball',
                'run': 'run',
                'microsoft frontpage': 'frontpage',
                'microsoft excel': 'excel',
                'clipbook viewer': 'clipbook',
                'character map': 'charmap',
                'windows messenger': 'messenger'
            };
            let lookupName = name ? name.toLowerCase() : null;
            let topic = (lookupName && topicMap[lookupName]) ? topicMap[lookupName] : 'home';
            window.showHelpTopic(topic);
        }
    }, 100);
};


// ===== GLOBAL PRINT QUEUE & FAKE PRINTING =====
window.printQueue = window.printQueue || [];

window.fakePrint = function(docName, previewHTML) {
    window._currentPrintDoc = docName || 'Untitled Document';
    window._currentPrintContent = previewHTML || '<p>No preview available.</p>';
    
    let dlg = document.getElementById('print-dialog-window');
    if (dlg) {
        // Populate select
        let sel = dlg.querySelector('select');
        if (sel) {
            sel.innerHTML = '';
            window.installedPrinters.forEach(p => {
                let opt = document.createElement('option');
                opt.value = p.name;
                opt.innerText = p.name;
                sel.appendChild(opt);
            });
            sel.onchange = function() {
                let p = window.installedPrinters.find(x => x.name === this.value);
                if (p) {
                    let infoDiv = sel.parentNode;
                    let textNodes = Array.from(infoDiv.childNodes).filter(n => n.nodeType === 3); // text nodes
                    // Very brittle, instead let's add IDs to status/type/where in index.html in the next step,
                    // but for now, we just let it be or rebuild the HTML.
                    let statusSpan = document.getElementById('print-dialog-status');
                    let typeSpan = document.getElementById('print-dialog-type');
                    let whereSpan = document.getElementById('print-dialog-where');
                    if(statusSpan) statusSpan.innerText = p.status;
                    if(typeSpan) typeSpan.innerText = p.type;
                    if(whereSpan) whereSpan.innerText = p.port;
                }
            };
        }
        
        dlg.style.display = 'block';
        window.bringToFront(dlg);
    }
};

window.fakePrintPreview = function(docName, previewHTML) {
    window._currentPrintDoc = docName || 'Untitled Document';
    window._currentPrintContent = previewHTML || '<p>No preview available.</p>';
    let dlg = document.getElementById('print-preview-window');
    let content = document.getElementById('print-preview-content');
    if (dlg && content) {
        content.innerHTML = window._currentPrintContent;
        dlg.style.display = 'block';
        window.bringToFront(dlg);
    }
};

window._executePrintFromPreview = function() {
    let dlg = document.getElementById('print-preview-window');
    if (dlg) dlg.style.display = 'none';
    window.fakePrint(window._currentPrintDoc, window._currentPrintContent);
};


window._executePrintJob = function() {
    let dlg = document.getElementById('print-dialog-window');
    if (dlg) dlg.style.display = 'none';
    
    let prog = document.getElementById('printing-progress-window');
    let docNameEl = document.getElementById('printing-doc-name');
    let bar = document.getElementById('printing-progress-bar');
    
    if (prog) {
        docNameEl.innerText = 'Now printing document: ' + window._currentPrintDoc;
        bar.style.width = '0%';
        prog.style.display = 'block';
        window.bringToFront(prog);
        
        let copiesInput = document.querySelector('#print-dialog-window input[type="number"]');
        let numCopies = parseInt(copiesInput ? copiesInput.value : 1);
        if(isNaN(numCopies) || numCopies < 1) numCopies = 1;
        if(numCopies > 1000) numCopies = 1000;
        
        let intervalTime = (2500 * numCopies) / 5;
        
        window._printInterval = setInterval(() => {
            let currentWidth = parseInt(bar.style.width) || 0;
            currentWidth += 20;
            bar.style.width = currentWidth + '%';
            if (currentWidth >= 100) {
                clearInterval(window._printInterval);
                prog.style.display = 'none';
                
                // Add to queue
                let date = new Date();
                let timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' ' + date.toLocaleDateString();
                let sel = document.querySelector('#print-dialog-window select');
                let printerName = sel ? sel.value : 'HP LaserJet 4 (Virtual)';
                window.printQueue.push({
                    id: Date.now(),
                    name: window._currentPrintDoc,
                    status: 'Printing',
                    owner: window.currentAccount || 'Administrator',
                    pages: numCopies,
                    submitted: timeStr,
                    printer: printerName,
                    html: window._currentPrintHTML
                });
                window._renderPrintQueue();
                
                // Show balloon notification
                if (typeof window.showBalloon === 'function') {
                    let sel2 = document.querySelector('#print-dialog-window select');
                    let pName2 = sel2 ? sel2.value : 'HP LaserJet 4 (Virtual)';
                    window.showBalloon('Document printed', window._currentPrintDoc + ' was sent to ' + pName2 + '.');
                }
                
                // Remove from queue after a short delay to simulate completion
                setTimeout(() => {
                    if (window.printQueue.length > 0) {
                        let job = window.printQueue.shift(); // remove oldest
                        job.status = 'Completed';
                        window.printHistory = window.printHistory || [];
                        window.printHistory.push(job);
                        window._renderPrintQueue();
                    }
                }, 5000);
            }
        }, intervalTime);
    }
};

window.viewPrintHistory = function() {
    window.printHistory = window.printHistory || [];
    if (window.printHistory.length === 0) {
        window.xpDialog('Print History', 'There are no printed documents in the history.', 'info');
        return;
    }
    
    let histList = window.printHistory.map(j => j.name + ' - ' + j.submitted).join('\\n');
    window.xpDialog('Print History', 'Completed Print Jobs:\\n\\n' + histList, 'info');
};

window._cancelPrintJob = function() {
    clearInterval(window._printInterval);
    let prog = document.getElementById('printing-progress-window');
    if (prog) prog.style.display = 'none';
};

window.seeWhatsPrinting = function() {
    let win = document.getElementById('print-queue-window');
    if (win) {
        if (win.style.display === 'none') {
            window.openProgram('print-queue-window');
        } else {
            window.bringToFront(win);
        }
        window._renderPrintQueue();
    }
};

window._renderPrintQueue = function() {
    let list = document.getElementById('print-queue-list');
    let status = document.getElementById('print-queue-status');
    if (!list) return;
    
    list.innerHTML = '';
    window.printQueue.forEach(job => {
        let row = document.createElement('div');
        row.style.cssText = 'display: flex; padding: 2px 5px; border-bottom: 1px solid #f0f0f0;';
        row.innerHTML = `
            <div style="width: 200px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding-left: 2px;">${job.name}</div>
            <div style="width: 80px; padding-left: 2px;">${job.status}</div>
            <div style="width: 100px; padding-left: 2px;">${job.owner}</div>
            <div style="width: 50px; padding-left: 2px;">${job.pages}</div>
            <div style="flex: 1; padding-left: 2px;">${job.submitted}</div>
        `;
        list.appendChild(row);
    });
    if (status) status.innerText = window.printQueue.length + ' document(s) in queue';
};

window._clearPrintQueue = function() {
    window.printQueue = [];
    window._renderPrintQueue();
};

window.setPrinterProperties = function() {
    if (typeof window.xpDialog === 'function') {
        window.xpDialog('Properties', 'HP LaserJet 4 (Virtual) properties cannot be changed.', 'info');
    }
};

window.pausePrinting = function() {
    if (typeof window.xpDialog === 'function') {
        window.xpDialog('Pause', 'Printer is paused. Pending jobs will not be processed.', 'info');
    }
};

window.renamePrinter = function() {
    if (typeof window.xpDialog === 'function') {
        window.xpDialog('Rename', 'You do not have permission to rename the virtual printer.', 'error');
    }
};

// ===== DUAL FILE PICKER PROMPT =====
window._importSourceChoice = function(source) {
    let dlg = document.getElementById('import-source-dialog');
    if (dlg) dlg.style.display = 'none';
    if (typeof window._importSourceCallback === 'function') {
        window._importSourceCallback(source);
    }
};

window._triggerPrintPreviewFromDialog = function() {
    let dlg = document.getElementById('print-dialog-window');
    // REMOVED: if (dlg) dlg.style.display = 'none';
    if (typeof window.fakePrintPreview === 'function') {
        window.fakePrintPreview(window._currentPrintDoc, window._currentPrintContent);
    }
};

window.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault(); // prevent real browser print
        let act = window.activeWindow;
        if (!act) return;
        
        if (act === 'notepad-window') {
            let content = '<pre>' + document.querySelector('#notepad-window textarea').value + '</pre>';
            window.fakePrint('Untitled.txt', content);
        } else if (act === 'paint-window') {
            let c = document.getElementById('paintCanvas');
            if(c) window.fakePrint('Image.bmp', '<img src="' + c.toDataURL() + '" style="width:100%">');
        } else if (act === 'wordpad-window') {
            let p = document.getElementById('wordpad-content');
            if(p) window.fakePrint('Document.rtf', p.innerHTML);
        } else if (act === 'photon-window') {
            let p = document.getElementById('photon-img');
            if(p && p.src) window.fakePrint('Image.jpg', '<img src="' + p.src + '" style="max-width:100%">');
        } else if (act === 'email-window') {
            if (typeof window.emailPrint === 'function') window.emailPrint(false);
        } else if (act === 'email-compose-window') {
            if (typeof window.emailComposePrint === 'function') window.emailComposePrint(false);
        } else if (act === 'excel-window') {
            window.fakePrint('Book1.xls', '<p>Excel sheet preview not available.</p>');
        }
    }
});

window._printZoomLevel = 1.0;

window._printPreviewZoomIn = function() {
    window._printZoomLevel += 0.2;
    let contentDiv = document.getElementById('print-preview-content');
    if (contentDiv) {
        contentDiv.style.transform = 'scale(' + window._printZoomLevel + ')';
        contentDiv.style.transformOrigin = 'top center';
    }
};

window._printPreviewZoomOut = function() {
    window._printZoomLevel = Math.max(0.2, window._printZoomLevel - 0.2);
    let contentDiv = document.getElementById('print-preview-content');
    if (contentDiv) {
        contentDiv.style.transform = 'scale(' + window._printZoomLevel + ')';
        contentDiv.style.transformOrigin = 'top center';
    }
};

window._applyPrintSettingsToPreview = function(contentDiv) {
    // Read orientation
    let isLandscape = false;
    let landscapeRadio = document.querySelector('input[name="print_orientation"][value="landscape"]');
    if (landscapeRadio && landscapeRadio.checked) isLandscape = true;
    
    // Read margins
    let marginSel = document.getElementById('print_margins');
    let marginVal = marginSel ? marginSel.value : 'normal';
    
    // Apply sizes
    if (isLandscape) {
        contentDiv.style.width = '11in';
        contentDiv.style.minHeight = '8.5in';
        contentDiv.style.height = '8.5in';
    } else {
        contentDiv.style.width = '8.5in';
        contentDiv.style.minHeight = '11in';
        contentDiv.style.height = '11in';
    }
    
    if (marginVal === 'narrow') {
        contentDiv.style.padding = '0.5in';
    } else if (marginVal === 'wide') {
        contentDiv.style.padding = '1.5in';
    } else {
        contentDiv.style.padding = '1in';
    }
};

let oldFakePrintPreview = window.fakePrintPreview;
window.fakePrintPreview = function(docName, contentHtml) {
    window._currentPrintDoc = docName || 'Untitled Document';
    window._currentPrintContent = contentHtml || '';
    let pv = document.getElementById('print-preview-window');
    let contentDiv = document.getElementById('print-preview-content');
    if(pv && contentDiv) {
        contentDiv.innerHTML = window._currentPrintContent;
        window._printZoomLevel = 1.0; // reset zoom
        contentDiv.style.transform = 'scale(1)';
        
        window._applyPrintSettingsToPreview(contentDiv);
        
        pv.style.display = 'flex';
        window.bringToFront(pv);
    }
};

setTimeout(() => {
    if (typeof makeDraggable === 'function') {
        let w1 = document.getElementById('print-dialog-window');
        let w2 = document.getElementById('print-preview-window');
        let w3 = document.getElementById('email-read-window');
        let w4 = document.getElementById('printing-progress-window');
        let w5 = document.getElementById('print-queue-window');
        if(w1) makeDraggable('print-dialog-window', 'print-dialog-title');
        if(w2) makeDraggable('print-preview-window', 'print-preview-title');
        if(w3) {
            let emailTitle = document.getElementById('email-read-subject-title');
            if(emailTitle) emailTitle.id = 'email-read-title'; // Ensure it has the right ID for draggable
            makeDraggable('email-read-window', 'email-read-title');
        }
        if(w4) makeDraggable('printing-progress-window', 'printing-progress-title');
        if(w5) makeDraggable('print-queue-window', 'print-queue-title');
    }
}, 3000);

window.openIEFile = function(name, content, path) {
    if(typeof window.openProgram === 'function') window.openProgram('ie-window', name);
    let toolbar = document.querySelector('#ie-window .explorer-toolbar');
    let tabsContainer = document.getElementById('ie-fake-tabs');
    if(!tabsContainer) {
        tabsContainer = document.createElement('div');
        tabsContainer.id = 'ie-fake-tabs';
        tabsContainer.style.cssText = 'display:flex; gap:2px; background:#ECE9D8; border-bottom:1px solid #ACA899; padding: 2px 2px 0 2px; height: 22px;';
        toolbar.parentNode.insertBefore(tabsContainer, toolbar.nextSibling);
    }
    
    let tab = document.createElement('div');
    tab.className = 'ie-fake-tab';
    tab.style.cssText = 'background:#fff; border:1px solid #ACA899; border-bottom:none; border-radius:3px 3px 0 0; padding:2px 10px; cursor:pointer; font-size:11px; display:flex; align-items:center; gap:5px; margin-bottom:-1px; position:relative; z-index:2;';
    tab.innerHTML = `<img src="Windows XP Icons/IE Document.png" style="width:14px; height:14px;" onerror="this.src='Windows XP Icons/Internet Explorer 6.png'"> ${name} <span style="margin-left:5px; font-weight:bold; color:red; cursor:pointer;" onclick="this.parentNode.remove(); if(document.querySelectorAll('.ie-fake-tab').length===0) document.getElementById('ie-fake-tabs').remove(); event.stopPropagation();">x</span>`;
    
    tab.onclick = function() {
        document.querySelectorAll('.ie-fake-tab').forEach(t => {
            t.style.background = '#ECE9D8';
            t.style.zIndex = '1';
        });
        tab.style.background = '#fff';
        tab.style.zIndex = '2';
        let blob = new Blob([content], {type: 'text/html'});
        document.getElementById('ie-frame').src = URL.createObjectURL(blob);
    };
    
    tabsContainer.appendChild(tab);
    tab.click();
};

window.toggleNotepadStatusBar = function() {
    let sb = document.getElementById('notepad-status-bar');
    let mnu = document.querySelector('.menu-dropdown-item[onclick="toggleNotepadStatusBar()"]');
    if(sb) {
        if(sb.style.display === 'none') {
            sb.style.display = 'block';
            if(mnu) mnu.innerHTML = '&#10003; Status Bar';
        } else {
            sb.style.display = 'none';
            if(mnu) mnu.innerHTML = '&nbsp;&nbsp;Status Bar';
        }
    }
};

window.updateNotepadStatus = function(textarea) {
    let sb = document.getElementById('notepad-status-bar');
    if(sb && sb.style.display !== 'none') {
        let text = textarea.value;
        let pos = textarea.selectionStart;
        let lines = text.substr(0, pos).split("\n");
        let line = lines.length;
        let col = lines[lines.length - 1].length + 1;
        sb.innerText = `Ln ${line}, Col ${col}`;
    }
};

window.toggleMediaPlayerCompact = function() {
    let win = document.getElementById('media-player-window');
    if(win) {
        if(win.style.height === '120px') {
            win.style.height = '350px';
        } else {
            win.style.height = '120px';
        }
    }
};

window.showTaskbarContextMenu = function(e, winId) {
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll('.context-menu-container').forEach(m => m.style.display = 'none');
    let ctx = document.getElementById('context-menu-taskbar');
    if (!ctx) return;
    window.contextTaskbarWinId = winId;
    let x = e.clientX;
    let y = e.clientY;
    ctx.style.display = 'flex';
    if(y + ctx.offsetHeight > window.innerHeight) y = window.innerHeight - ctx.offsetHeight - 5;
    ctx.style.left = x + 'px';
    ctx.style.top = y + 'px';
};
window.toggleExplorerStatusBar = function() {
    let sb = document.getElementById('explorer-status-bar');
    let menus = document.querySelectorAll('.app-menu-item');
    let mnu = Array.from(menus).find(m => m.innerText.includes('Status Bar') && m.getAttribute('onclick') && m.getAttribute('onclick').includes('toggleExplorerStatusBar'));
    if(sb) {
        if(sb.style.display === 'none') {
            sb.style.display = 'flex';
            if(mnu) mnu.innerHTML = '&#10003; Status Bar';
        } else {
            sb.style.display = 'none';
            if(mnu) mnu.innerHTML = '&nbsp;&nbsp;Status Bar';
        }
    }
};


window.restoreWindow = function(id) {
    let win = document.getElementById(id);
    if(win) {
        win.style.display = 'block';
        if(win.id === 'ie-window' || win.id === 'email-window' || win.id === 'email-compose-window' || win.id === 'email-read-window' || win.id === 'frontpage-window' || win.id === 'cmd-window') {
           win.style.display = 'flex';
        }
        win.classList.remove('minimized');
        win.classList.remove('maximized');
        window.bringToFront(win);
        
        let taskBtn = document.getElementById('task-' + id);
        if(taskBtn) taskBtn.classList.add('active');
    }
};





window.makeResizable = function(win) {
    let handle = document.createElement('div');
    handle.style.position = 'absolute';
    handle.style.right = '0';
    handle.style.bottom = '0';
    handle.style.width = '15px';
    handle.style.height = '15px';
    handle.style.cursor = 'nwse-resize';
    handle.style.zIndex = '999';
    win.appendChild(handle);
    
    handle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        let isResizing = true;
        let resizeStartX = e.clientX;
        let resizeStartY = e.clientY;
        let resizeStartW = win.offsetWidth;
        let resizeStartH = win.offsetHeight;
        
        let moveHandler = function(e) {
            if (!isResizing) return;
            let dw = e.clientX - resizeStartX;
            let dh = e.clientY - resizeStartY;
            let nw = resizeStartW + dw;
            let nh = resizeStartH + dh;
            if (nw > 150) win.style.width = nw + 'px';
            if (nh > 100) win.style.height = nh + 'px';
        };
        
        let upHandler = function(e) {
            isResizing = false;
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    });
};

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.window').forEach(w => {
        if(w.id !== 'taskbar') window.makeResizable(w);
    });
});


window.applyIconSettings = function() {
    let size = localStorage.getItem('xp_icon_size') || 'normal';
    let spacing = localStorage.getItem('xp_icon_spacing') || 'normal';

    let width = 75, height = 75, imgSize = 32, margin = 5;

    if (size === 'small') { imgSize = 24; }
    else if (size === 'large') { imgSize = 48; }

    if (spacing === 'tight') { width = 60; height = 60; margin = 2; }
    else if (spacing === 'wide') { width = 90; height = 90; margin = 10; }
    else if (spacing === 'very_wide') { width = 110; height = 110; margin = 15; }

    let styleId = 'custom-icon-settings';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
        .desktop-icon, .file-icon {
            width: ${width}px !important;
            height: ${height}px !important;
            margin: ${margin}px !important;
        }
        .desktop-icon img, .file-icon img {
            width: ${imgSize}px !important;
            height: ${imgSize}px !important;
        }
    `;
};


document.addEventListener('DOMContentLoaded', function() {
    if(typeof window.applyIconSettings === 'function') window.applyIconSettings();
});


(function(){
    const origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {
        if(typeof window.sysMuted !== 'undefined') {
            this.muted = window.sysMuted;
        }
        return origPlay.apply(this, arguments);
    };
})();
window._updatePrintPreview = function() {
    let previewWindow = document.getElementById('print-preview-window');
    let previewContent = document.getElementById('print-preview-content');
    if (previewWindow && previewWindow.style.display !== 'none' && previewContent) {
        window._applyPrintSettingsToPreview(previewContent);
    }
};
window.switchPrintTab = function(tabName) {
    let tq = document.getElementById('tab-queue');
    let th = document.getElementById('tab-history');
    if(tq) tq.classList.remove('active');
    if(th) th.classList.remove('active');
    let pq = document.getElementById('print-tab-queue');
    let ph = document.getElementById('print-tab-history');
    if(pq) pq.style.display = 'none';
    if(ph) ph.style.display = 'none';
    
    let tab = document.getElementById('tab-' + tabName);
    if(tab) tab.classList.add('active');
    let content = document.getElementById('print-tab-' + tabName);
    if(content) content.style.display = 'flex';
    
    if (tabName === 'history' && typeof window._renderPrintHistory === 'function') {
        window._renderPrintHistory();
    } else if (typeof window._renderPrintQueue === 'function') {
        window._renderPrintQueue();
    }
};

window.viewPrintHistory = function() {
    let q = document.getElementById('print-queue-window');
    if(q) {
        q.style.display = 'flex';
        window.bringToFront(q);
        if(typeof window.switchPrintTab === 'function') {
            window.switchPrintTab('history');
        }
    }
};

window.previewHistoryJob = function(htmlContent) {
    window._currentPrintHTML = htmlContent;
    let pw = document.getElementById('print-preview-window');
    if(pw) {
        pw.style.display = 'flex';
        window.bringToFront(pw);
        let pc = document.getElementById('print-preview-content');
        if(pc) {
            pc.innerHTML = htmlContent;
            window._applyPrintSettingsToPreview(pc);
        }
    }
};

window._renderPrintHistory = function() {
    let list = document.getElementById('print-history-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (!window.printHistory || window.printHistory.length === 0) {
        list.innerHTML = '<div style="padding:10px; color:#666;">No completed print jobs.</div>';
        return;
    }
    
    window.printHistory.forEach(job => {
        let row = document.createElement('div');
        row.style.cssText = 'display: flex; padding: 2px 5px; border-bottom: 1px solid #f0f0f0; align-items: center;';
        
        let safeHTML = encodeURIComponent(job.html || '');
        
        row.innerHTML = `
            <div style="width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">` + job.name + `</div>
            <div style="width: 80px;">` + job.pages + `</div>
            <div style="flex: 1;">` + job.submitted + `</div>
            <div style="width: 100px;">
                <button style="padding: 1px 5px;" onclick="window.previewHistoryJob(decodeURIComponent('` + safeHTML + `'))">Preview</button>
            </div>
        `;
        list.appendChild(row);
    });
};




window.toggleAutoArrange = function() {
    window.autoArrange = !window.autoArrange;
    let autoCheck = document.getElementById('check-auto');
    if (autoCheck) {
        autoCheck.innerHTML = window.autoArrange ? '<div class="menu-check-icon"></div>' : '';
    }
    if (window.autoArrange) {
        if (typeof window.arrangeIcons === 'function') window.arrangeIcons(window.currentSort || 'default');
    }
};

window.toggleGridAlign = function() {
    window.gridAlign = !window.gridAlign;
    let gridCheck = document.getElementById('check-grid');
    if (gridCheck) {
        gridCheck.innerHTML = window.gridAlign ? '<div class="menu-check-icon"></div>' : '';
    }
    if (window.autoArrange) {
        if (typeof window.arrangeIcons === 'function') window.arrangeIcons(window.currentSort || 'default');
    }
};









window.goToFileLocation = function(targetPath) {
    if (typeof window.openProgram === 'function') window.openProgram('folder-window');
    
    let parts = targetPath.split('\\').filter(p => p !== '');
    let fileName = parts.pop();
    let parentDir = parts.join('\\');
    if (!parentDir || parentDir === 'C:') parentDir = 'C:\\';

    if (typeof window.renderExplorer === 'function') {
        window.renderExplorer(parentDir);
        setTimeout(() => {
            let els = document.querySelectorAll('#explorer-content .file-icon');
            els.forEach(el => {
                if (el.getAttribute('data-name') === fileName) {
                    if (typeof window.xpClearSelection === 'function') window.xpClearSelection('folder');
                    el.classList.add('selected');
                    el.scrollIntoView({behavior: "smooth", block: "center"});
                    window.selectedFileContext = {path: parentDir, name: fileName};
                }
            });
        }, 150);
    }
};

window.showSearchResults = function(query, results) {
    let listContainer = document.getElementById('search-results-list');
    let titleText = document.getElementById('search-query-text');
    if (!listContainer || !titleText) return;
    
    titleText.innerText = "Matches found for '" + query + "':";
    listContainer.innerHTML = '';
    
    results.forEach(res => {
        let div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '5px';
        div.style.borderBottom = '1px solid #eee';
        
        let pText = document.createElement('div');
        pText.style.fontFamily = 'Tahoma';
        pText.style.fontSize = '11px';
        pText.innerText = res;
        
        let btn = document.createElement('button');
        btn.innerText = 'Go to Location';
        btn.onclick = function() {
            window.goToFileLocation(res);
        };
        
        div.appendChild(pText);
        div.appendChild(btn);
        listContainer.appendChild(div);
    });
    
    if (typeof window.openProgram === 'function') window.openProgram('search-window');
};


// Wordpad Integration
window.openWordpadFile = function(name, content, currentDir) {
    window.openProgram('wordpad-window');
    setTimeout(() => {
        let ed = document.getElementById('wordpad-content');
        if(ed) ed.innerHTML = content || "";
        let titleEl = document.getElementById('wordpad-window-title');
        if(titleEl) {
            let span = titleEl.querySelector('span');
            if (span) span.innerHTML = '<img src="Windows XP Icons/Wordpad.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> ' + name + ' - WordPad';
        }
        if (typeof window.markAppSaved === 'function') window.markAppSaved('wordpad-window', content || "");
    }, 50);
};

window.triggerWordpadSaveAs = function() {
    if(typeof window.openFileDialog === 'function') {
        let titleEl = document.getElementById('wordpad-window-title');
        let currentName = "";
        if(titleEl && titleEl.innerText) {
            currentName = titleEl.innerText.replace(' - WordPad', '').replace('Document', '').trim();
        }
        window.openFileDialog('save', currentName, (info) => {
            let name = info.name || info.filename;
            if(!name) return;
            if(!name.toLowerCase().endsWith('.rtf') && !name.toLowerCase().endsWith('.txt') && !name.toLowerCase().endsWith('.doc')) name += '.rtf';
            
            let dir = window.resolvePath(info.path);
            if(dir) {
                let ed = document.getElementById('wordpad-content');
                let content = ed ? ed.innerHTML : "";
                dir[name] = { type: 'file', extension: name.split('.').pop(), content: content, icon: 'wordpad' };
                
                if(titleEl) {
                    let span = titleEl.querySelector('span');
                    if (span) span.innerHTML = '<img src="Windows XP Icons/Wordpad.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> ' + name + ' - WordPad';
                }
                
                if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
                if(typeof window.renderDesktop === 'function') window.renderDesktop();
                if(typeof window.showBalloon === 'function') window.showBalloon('WordPad', 'Saved ' + name);
                
                if (typeof window.markAppSaved === 'function') window.markAppSaved('wordpad-window', content);
            }
        }, ['.rtf', '.txt', '.doc']);
    }
};

window.triggerWordpadSave = function() {
    window.triggerWordpadSaveAs();
};

// Excel Integration
window.openExcelFile = function(name, content, currentDir) {
    window.openProgram('excel-window');
    setTimeout(() => {
        try {
            let parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                let migrated = {};
                for(let i=0; i<parsed.length; i++) {
                    if (parsed[i] !== "") {
                        let col = String.fromCharCode(65 + (i % 26));
                        let row = Math.floor(i / 26) + 1;
                        migrated[col + row] = { v: parsed[i], f: { bold: false, italic: false, underline: false, color: '#000000', align: 'left', bg: '#ffffff' } };
                    }
                }
                content = JSON.stringify(migrated);
            }
        } catch(e) {}
        if (typeof window.excelOpenDirect === 'function') {
            window.excelOpenDirect(name, { content: content });
        }
    }, 100);
};

window.triggerExcelSave = function() {
    if (typeof window.excelSave === 'function') {
        window.excelSave();
    }
};




