const STORE_APPS = [
    { id: 'ie', name: 'Internet Explorer', desc: 'Browse the World Wide Web.', icon: 'ie', size: '20 MB', exe: 'iexplore.exe', appId: 'ie-window', shortcut: 'Internet Explorer.lnk', cost: 0, systemApp: true },
    { id: 'outlook', name: 'Outlook Express', desc: 'Send and receive email messages.', icon: 'outlook', size: '3.1 MB', exe: 'msimn.exe', appId: 'email-window', shortcut: 'Outlook Express.lnk', cost: 0, systemApp: true },
    { id: 'explorer', name: 'Windows Explorer', desc: 'Explore files and folders.', icon: 'folder', size: '1.2 MB', exe: 'explorer.exe', appId: 'folder-window', shortcut: 'Windows Explorer.lnk', cost: 0, systemApp: true },
    { id: 'controlpanel', name: 'Control Panel', desc: 'Change computer settings.', icon: 'settings', size: '1.5 MB', exe: 'control.exe', appId: 'settings-window', shortcut: 'Control Panel.lnk', cost: 0, systemApp: true },
    { id: 'cmd', name: 'Command Prompt', desc: 'Execute text-based commands.', icon: 'cmd', size: '50 KB', exe: 'cmd.exe', appId: 'cmd-window', shortcut: 'Command Prompt.lnk', cost: 0, systemApp: true },
    { id: 'sysinfo', name: 'System Information', desc: 'View details about your system.', icon: 'sysinfo', size: '250 KB', exe: 'msinfo32.exe', appId: 'sysinfo-window', shortcut: 'System Information.lnk', cost: 0, systemApp: true },
    { id: 'taskmgr', name: 'Task Manager', desc: 'Manage running processes and performance.', icon: 'taskmgr', size: '150 KB', exe: 'taskmgr.exe', appId: 'taskmgr-window', shortcut: 'Task Manager.lnk', cost: 0, systemApp: true },
    { id: 'notepad', name: 'Notepad', desc: 'A simple text editor for plain text files.', icon: 'notepad', size: '64 KB', exe: 'notepad.exe', appId: 'notepad-window', shortcut: 'Notepad.lnk', cost: 0 },
    { id: 'paint', name: 'Paint', desc: 'Create and edit drawings and images.', icon: 'paint', size: '340 KB', exe: 'mspaint.exe', appId: 'paint-window', shortcut: 'Paint.lnk', cost: 0 },
    { id: 'calc', name: 'Calculator', desc: 'Perform basic and advanced mathematical calculations.', icon: 'calc', size: '120 KB', exe: 'calc.exe', appId: 'calc-window', shortcut: 'Calculator.lnk', cost: 0 },
    { id: 'wordpad', name: 'WordPad', desc: 'Advanced text editor with rich text support.', icon: 'wordpad', size: '1.5 MB', exe: 'wordpad.exe', appId: 'wordpad-window', shortcut: 'WordPad.lnk', cost: 0 },
    { id: 'charmap', name: 'Character Map', desc: 'View and copy special characters.', icon: 'charmap', size: '150 KB', exe: 'charmap.exe', appId: 'charmap-window', shortcut: 'Character Map.lnk', cost: 0 },
    { id: 'photon', name: 'Photon Picture Viewer', desc: 'View and edit digital images.', icon: 'image', size: '2.5 MB', exe: 'Photon.exe', appId: 'photon-window', shortcut: 'Photon Picture Viewer.lnk', cost: 0 },
    { id: 'soundrecorder', name: 'Sound Recorder', desc: 'Record and edit audio clips.', icon: 'soundrecorder', size: '450 KB', exe: 'sndrec32.exe', appId: 'soundrecorder-window', shortcut: 'Sound Recorder.lnk', cost: 0 },
    { id: 'mediaplayer', name: 'Windows Media Player', desc: 'Play your digital media.', icon: 'media', size: '4.5 MB', exe: 'wmplayer.exe', appId: 'mediaplayer-window', shortcut: 'Windows Media Player.lnk', cost: 0 },
    { id: 'messenger', name: 'Windows Messenger', desc: 'Instant messaging and communications.', icon: 'messenger', size: '2.2 MB', exe: 'msmsgs.exe', appId: 'messenger-window', shortcut: 'Windows Messenger.lnk', cost: 0 },
    { id: 'frontpage', name: 'Microsoft FrontPage', desc: 'Create and edit websites easily.', icon: 'frontpage', size: '8.4 MB', exe: 'frontpg.exe', appId: 'frontpage-window', shortcut: 'Microsoft FrontPage.lnk', cost: 0 },
    { id: 'checkers', name: 'Internet Checkers', desc: 'Play Checkers online or against the computer.', icon: 'Windows XP Icons/Internet Checkers.png', size: '500 KB', exe: 'chkrs.exe', appId: 'checkers-window', shortcut: 'Internet Checkers.lnk', cost: 0 },
    { id: 'reversi', name: 'Internet Reversi', desc: 'Play classic Reversi/Othello against the computer.', icon: 'Windows XP Icons/Internet Reversi.png', size: '550 KB', exe: 'reversi.exe', appId: 'reversi-window', shortcut: 'Internet Reversi.lnk', cost: 0 },
    { id: 'mine', name: 'Minesweeper', desc: 'Classic Minesweeper puzzle game.', icon: 'mine', size: '120 KB', exe: 'winmine.exe', appId: 'minesweeper-window', shortcut: 'Minesweeper.lnk', cost: 0 },
    { id: 'solitaire', name: 'Solitaire', desc: 'Classic Klondike Solitaire card game.', icon: 'solitaire', size: '180 KB', exe: 'sol.exe', appId: 'solitaire-window', shortcut: 'Solitaire.lnk', cost: 0 },
    { id: 'spades', name: 'Internet Spades', desc: 'Play Spades online.', icon: 'spades', size: '480 KB', exe: 'shvlzm.exe', appId: 'spades-window', shortcut: 'Internet Spades.lnk', cost: 0 },
    { id: 'hearts', name: 'Internet Hearts', desc: 'Play Hearts online.', icon: 'hearts', size: '490 KB', exe: 'mshearts.exe', appId: 'hearts-window', shortcut: 'Internet Hearts.lnk', cost: 0 },
    { id: 'freecell', name: 'FreeCell', desc: 'Classic FreeCell Solitaire card game.', icon: 'freecell', size: '160 KB', exe: 'freecell.exe', appId: 'freecell-window', shortcut: 'FreeCell.lnk', cost: 0 },
    { id: 'pinball', name: '3D Pinball', desc: '3D Pinball for Windows - Space Cadet.', icon: 'pinball', size: '1.2 MB', exe: 'pinball.exe', appId: 'pinball-window', shortcut: '3D Pinball.lnk', cost: 0 },
    { id: 'dataminer', name: 'Data Miner', desc: 'A fun incremental idle game.', icon: 'mouse', size: '200 KB', exe: 'dataminer.exe', appId: 'main-window', shortcut: 'Data Miner.lnk', cost: 0 },
    { id: 'tetris', name: 'Tetris XP', desc: 'Classic Tetris clone for Windows XP.', icon: 'tetris', size: '300 KB', exe: 'tetris.exe', appId: 'tetris-window', shortcut: 'Tetris XP.lnk', cost: 0 }
];

let storeCurrentTab = 'all';
window.activeStoreInstalls = window.activeStoreInstalls || {};

function parseSizeString(str) {
    if(!str) return 0;
    str = str.toUpperCase();
    let val = parseFloat(str);
    if(str.includes('MB')) return val * 1024 * 1024;
    if(str.includes('KB')) return val * 1024;
    if(str.includes('GB')) return val * 1024 * 1024 * 1024;
    return val;
}

window.isAppInstalled = function(app) {
    let appName = typeof app === 'string' ? app : app.name;
    if (appName === "Notepad" || appName === "WordPad" || appName === "Internet Explorer" || appName === "Paint" || appName === "Windows Media Player" || appName === "Sound Recorder" || appName === "Task Manager" || appName === "Calculator" || appName === "Command Prompt") return true;

    let pfNode = window.resolvePath('C:\\\\Program Files');
    if (!pfNode || !pfNode[appName]) return false;
    
    if (typeof app === 'object' && app.exe) {
        if (pfNode[appName].contents && pfNode[appName].contents[app.exe]) return true;
        if (pfNode[appName][app.exe]) return true;
        return false;
    }
    
    return true;
};
// Keep local alias for internal store.js use
function isAppInstalled(app) { return window.isAppInstalled(app); }

window.renderStore = function() {
    let container = document.getElementById('store-list-container');
    if (!container) return;
    container.innerHTML = '';

    let toShow = [];
        STORE_APPS.forEach(app => {
        if (app.systemApp) return;
        let isInst = isAppInstalled(app);
        if (storeCurrentTab === 'all' && !isInst) toShow.push(app);
        if (storeCurrentTab === 'installed' && isInst) toShow.push(app);
    });

    if (toShow.length === 0) {
        container.innerHTML = `<div style="padding:20px; color:#555; font-family:Tahoma; font-size:12px;">No programs found in this category.</div>`;
        return;
    }

    toShow.forEach(app => {
        let isInst = isAppInstalled(app);
        let activeInst = window.activeStoreInstalls[app.id];
        
        let btnText = isInst ? "Uninstall" : (activeInst ? "Installing..." : "Install");
        let btnFunc = isInst ? `uninstallApp('${app.id}')` : (activeInst ? "" : `installApp('${app.id}')`);
        let iconSrc = "Windows XP Icons/Setup.png";
        if (app.icon && app.icon.includes('/')) iconSrc = app.icon;
        else if (typeof sysIcons !== 'undefined' && sysIcons[app.icon]) iconSrc = sysIcons[app.icon];
        
        let installText = "";
        if (isInst) installText = `<span style="color:#555; font-style:italic;">Installed</span>`;

        let progStyle = activeInst ? "display:block;" : "display:none;";
        
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #ddd;">
                <div style="display:flex; align-items:center; gap:10px; width:75%;">
                    <img src="${iconSrc}" onerror="this.src='Windows XP Icons/Setup.png'" style="width:32px; height:32px;">
                    <div style="width:100%;">
                        <div style="font-family:Tahoma; font-size:13px; font-weight:bold; color:#000;">${app.name}</div>
                        <div style="font-family:Tahoma; font-size:11px; color:#333; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${app.desc} ${app.size ? '('+app.size+')' : ''}</div>
                        
                        <div id="store-prog-${app.id}" style="${progStyle} margin-top:5px; height:14px; width:100%; max-width:200px; background:white; border:1px solid #7F9DB9; position:relative; overflow:hidden; box-sizing:border-box;">
                            <div id="store-prog-bar-${app.id}" style="position:absolute; top:0; left:0; height:100%; width:0%; background:linear-gradient(to bottom, #91c26b, #43BD42);"></div>
                        </div>
                        <div id="store-prog-text-${app.id}" style="${progStyle} font-family:Tahoma; font-size:10px; color:#555; margin-top:2px;"></div>
                    </div>
                </div>
                <div>
                    <button id="store-btn-${app.id}" onclick="${btnFunc}" style="padding:5px 15px; font-family:Tahoma; font-size:11px; cursor:pointer; min-width:80px; ${isInst ? '' : 'font-weight:bold;'}" ${activeInst ? 'disabled' : ''}>${btnText}</button>
                </div>
            </div>
        `;
    });
};

window.installApp = function(appId) {
    let app = STORE_APPS.find(a => a.id === appId);
    if(!app) return;

    // Cost check removed per user request

    let totalBytes = parseSizeString(app.size) || 102400; 
    window.activeStoreInstalls[appId] = {
        total: totalBytes,
        current: 0
    };
    
    renderStore();

    if(!window.storeInstallLoopRunning) {
        window.storeInstallLoopRunning = true;
        setInterval(() => {
            let activeKeys = Object.keys(window.activeStoreInstalls);
            if(activeKeys.length === 0) return;
            
            activeKeys.forEach(id => {
                let inst = window.activeStoreInstalls[id];
                let a = STORE_APPS.find(x => x.id === id);
                
                inst.current += (50000 + Math.random() * 200000); 
                
                let isDone = false;
                if (inst.current >= inst.total) {
                    inst.current = inst.total;
                    isDone = true;
                }
                
                let pText = document.getElementById('store-prog-text-' + id);
                let pBar = document.getElementById('store-prog-bar-' + id);
                if (pText && pBar) {
                    let pct = Math.min(100, Math.floor((inst.current / inst.total) * 100));
                    pBar.style.width = pct + '%';
                    
                    let cMB = (inst.current / (1024*1024)).toFixed(2);
                    let tMB = (inst.total / (1024*1024)).toFixed(2);
                    if (inst.total < 1024 * 1024) {
                        pText.innerText = (inst.current / 1024).toFixed(0) + ' KB / ' + (inst.total / 1024).toFixed(0) + ' KB (' + pct + '%)';
                    } else {
                        pText.innerText = cMB + ' MB / ' + tMB + ' MB (' + pct + '%)';
                    }
                }
                
                if (isDone) {
                    delete window.activeStoreInstalls[id];
                    executeInstall(a);
                }
            });
        }, 50);
    }
};

function executeInstall(app) {
    let deskNode = window.resolvePath(window.getDesktopPath());
    let rawBytes = parseSizeString(app.size) || 0;
    if (deskNode) {
        deskNode[app.shortcut] = { type: "exe", app: app.appId, icon: app.icon };
    }
    
    let pfNode = window.resolvePath("C:\\\\Program Files");
    if(pfNode) {
        if(!pfNode[app.name]) {
            pfNode[app.name] = { type: 'folder', contents: {} };
        }
        if (pfNode[app.name].contents) {
            pfNode[app.name].contents[app.exe] = { type: "exe", app: app.appId, icon: app.icon, sizeRaw: rawBytes };
        } else {
            pfNode[app.name][app.exe] = { type: "exe", app: app.appId, icon: app.icon, sizeRaw: rawBytes };
        }
    }

    window.saveFileSystem();
    window.renderDesktop();
    
    let startItem = document.getElementById('start-menu-' + app.id);
    if(startItem) startItem.style.display = 'block';
    let smItem = document.querySelector('.start-menu-item[data-name="' + app.name + '"]');
    if(smItem) smItem.style.display = 'block';

    renderStore();
    if(typeof window.showBalloon === 'function') window.showBalloon("Installation Complete", `${app.name} has been successfully installed.`);
    if(typeof window.syncStartMenuWithInstalledApps === 'function') window.syncStartMenuWithInstalledApps();
}

window.uninstallApp = function(appId) {
    let app = STORE_APPS.find(a => a.id === appId);
    if(!app) return;

    let deskNode = window.resolvePath(window.getDesktopPath());
    if (deskNode && deskNode[app.shortcut]) {
        delete deskNode[app.shortcut];
    }
    
    let pfNode = window.resolvePath("C:\\\\Program Files");
    if(pfNode && pfNode[app.name]) {
        delete pfNode[app.name];
    }

    window.saveFileSystem();
    window.renderDesktop();
    
    let startItem = document.getElementById('start-menu-' + app.id);
    if(startItem) startItem.style.display = 'none';
    let smItem = document.querySelector('.start-menu-item[data-name="' + app.name + '"]');
    if(smItem) smItem.style.display = 'none';

    renderStore();
    if(typeof window.showBalloon === 'function') window.showBalloon("Uninstallation Complete", `${app.name} has been successfully uninstalled.`);
    if(typeof window.syncStartMenuWithInstalledApps === 'function') window.syncStartMenuWithInstalledApps();
};

window.switchStoreTab = function(tab) {
    storeCurrentTab = tab;
    
    document.getElementById('store-nav-all').style.background = tab === 'all' ? '#436a99' : 'transparent';
    document.getElementById('store-nav-all').style.fontWeight = tab === 'all' ? 'bold' : 'normal';
    document.getElementById('store-nav-all').style.boxShadow = tab === 'all' ? 'inset 1px 1px 2px rgba(0,0,0,0.3)' : 'none';
    
    document.getElementById('store-nav-installed').style.background = tab === 'installed' ? '#436a99' : 'transparent';
    document.getElementById('store-nav-installed').style.fontWeight = tab === 'installed' ? 'bold' : 'normal';
    document.getElementById('store-nav-installed').style.boxShadow = tab === 'installed' ? 'inset 1px 1px 2px rgba(0,0,0,0.3)' : 'none';
    
    renderStore();
};





