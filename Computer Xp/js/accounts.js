/* MULTI-ACCOUNT SYSTEM */
/* Manages user accounts with separate filesystems, passwords, and avatars */

const DEFAULT_ADMIN_AVATAR = 'Windows XP Icons/admin_login_icon.png';
const DEFAULT_GUEST_AVATAR = 'Windows XP Icons/User Account.png';

// Default accounts structure
function getDefaultAccounts() {
    return {
        "Administrator": {
            password: "12345admin",
            avatar: DEFAULT_ADMIN_AVATAR,
            fsKey: "xp_virtual_drive_v2"
        },
        "Guest": {
            password: "",
            avatar: "Windows XP Icons/flower.jpeg",
            fsKey: "xp_virtual_drive_guest"
        }
    };
}

window.currentAccount = "Administrator";

window.loadAccounts = function() {
    let saved = localStorage.getItem('xp_accounts');
    if(saved) {
        try { 
            let accs = JSON.parse(saved); 
            return accs;
        } 
        catch(e) { return getDefaultAccounts(); }
    }
    return getDefaultAccounts();
};

window.saveAccounts = function(accounts) {
    localStorage.setItem('xp_accounts', JSON.stringify(accounts));
};

// Build a full desktop shortcuts object for any user
function buildDesktopShortcuts(username) {
    let isRemote = window.location.search.includes('remote=1');
    let shortcuts = {
        "My Computer.lnk": { type: "shortcut", target: "C:\\", icon: "computer" },
        "My Documents.lnk": { type: "shortcut", target: "C:\\Documents and Settings\\" + username + "\\My Documents", icon: "folder" },
        "Recycle Bin.lnk": { type: "shortcut", target: "C:\\RECYCLER", icon: "recycle_empty" },
        "Control Panel.lnk": { type: "exe", app: "controlpanel-window", icon: "settings" },
        "Windows Catalog.lnk": { type: "exe", app: "store-window", icon: "catalog" },
        "Notepad.lnk": { type: "exe", app: "notepad-window", icon: "notepad" },
        "Paint.lnk": { type: "exe", app: "paint-window", icon: "paint" },
        "Calculator.lnk": { type: "exe", app: "calc-window", icon: "calc" },
        "Command Prompt.lnk": { type: "exe", app: "cmd-window", icon: "cmd" },
        "Internet Explorer.lnk": { type: "exe", app: "ie-window", icon: "ie" },
        "Outlook Express.lnk": { type: "exe", app: "email-window", icon: "outlook" },
        "System Information.lnk": { type: "exe", app: "sysinfo-window", icon: "sysinfo" },
        "Remote Desktop.lnk": { type: "exe", app: "remotedesktop-window", icon: "remotedesktop" },
        "Microsoft Excel.lnk": { type: "exe", app: "excel-window", icon: "excel" },
        "Task Manager.lnk": { type: "exe", app: "taskmgr-window", icon: "taskmgr" },
        "Microsoft FrontPage.lnk": { type: "exe", app: "frontpage-window", icon: "frontpage" },
        "Clipbook Viewer.lnk": { type: "exe", app: "clipbook-window", icon: "sysinfo" },
        "Windows Media Player.lnk": { type: "exe", app: "mediaplayer-window", icon: "media" },
                "Sound Recorder.lnk": { type: "exe", app: "soundrecorder-window", icon: "soundrecorder" },
        
        "Disk Defragmenter.lnk": { type: "exe", app: "defrag-window", icon: "defrag" }
    };
    if (isRemote) {
        delete shortcuts["Outlook Express.lnk"];
        delete shortcuts["Windows Messenger.lnk"];
    }
    return shortcuts;
}

// Build a complete user filesystem structure
function buildUserFS(username) {
    let fs = {
        "C:": {
            type: "drive",
            contents: {
                "RECYCLER": { type: "folder", contents: {} },
                "Documents and Settings": { type: "folder", contents: {} },
                "WINDOWS": { type: "folder", contents: { "system32": { type: "folder", contents: {"regedit.exe":{"type":"exe","app":"regedit-window","icon":"regedit","hidden":true,"system":true},"explorer.exe":{"type":"exe","app":"folder-window","icon":"folder","hidden":true,"system":true},"run.exe":{"type":"exe","app":"run-window","icon":"run","hidden":true,"system":true},"cmd.exe":{"type":"exe","app":"cmd-window","icon":"cmd","hidden":true,"system":true},"notepad.exe":{"type":"exe","app":"notepad-window","icon":"notepad","hidden":true,"system":true},"kernel32.dll":{"type":"file","extension":"dll","icon":"dll","hidden":true,"system":true,"content":"DLL Binary Data"},"user32.dll":{"type":"file","extension":"dll","icon":"dll","hidden":true,"system":true,"content":"DLL Binary Data"},"hal.dll":{"type":"file","extension":"dll","icon":"dll","hidden":true,"system":true,"content":"DLL Binary Data"},"ntoskrnl.exe":{"type":"file","extension":"exe","icon":"exe","hidden":true,"system":true,"content":"Kernel Binary"}} }, "Fonts": { type: "folder", contents: {} }, "regedit.exe": { type: "exe", app: "regedit-window", icon: "regedit", hidden: true, system: true }, "win.ini": { type: "file", extension: "ini", icon: "txt", hidden: true, system: true, content: "[windows]\nrun=\nload=" } } },
                "Program Files": { type: "folder", contents: {
                    "Outlook Express": { type: "folder", contents: { "msimn.exe": { type: "exe", app: "email-window", icon: "outlook" } } },
                    "Microsoft FrontPage": { type: "folder", contents: { "frontpg.exe": { type: "exe", app: "frontpage-window", icon: "frontpage" } } },
                    "Windows Media Player": { type: "folder", contents: { "wmplayer.exe": { type: "exe", app: "mediaplayer-window", icon: "media" } } },
                    "Notepad.lnk": { type: "exe", app: "notepad-window", icon: "notepad" },
                    "Paint.lnk": { type: "exe", app: "paint-window", icon: "paint" },
                    "Calculator.lnk": { type: "exe", app: "calc-window", icon: "calc" },
                    "Command Prompt.lnk": { type: "exe", app: "cmd-window", icon: "cmd" },
                    "Internet Explorer.lnk": { type: "exe", app: "ie-window", icon: "ie" },
                    "System Information.lnk": { type: "exe", app: "sysinfo-window", icon: "sysinfo" },
                    "Microsoft Excel.lnk": { type: "exe", app: "excel-window", icon: "excel" },
                    "Task Manager.lnk": { type: "exe", app: "taskmgr-window", icon: "taskmgr" },
                    "Clipbook Viewer.lnk": { type: "exe", app: "clipbook-window", icon: "sysinfo" },
                                        "Sound Recorder.lnk": { type: "exe", app: "soundrecorder-window", icon: "soundrecorder" },
                    "Disk Defragmenter.lnk": { type: "exe", app: "defrag-window", icon: "defrag" },
                    "Remote Desktop Connection.lnk": { type: "exe", app: "remotedesktop-window", icon: "remotedesktop" },
                    "Tour Windows XP.lnk": { type: "exe", app: "xptour-window", icon: "tourxp" },
                } }
            }
        }
    };
    let docsAndSettings = fs["C:"].contents["Documents and Settings"].contents;
    let pIcon = username === 'Guest' ? 'Windows XP Icons/flower.jpeg' : 'Windows XP Icons/admin_login_icon.png';
    docsAndSettings[username] = {
        type: "folder",
        iconProfile: pIcon,
        contents: {
            "Desktop": { type: "folder", contents: buildDesktopShortcuts(username) },
            "Favorites": { type: "folder", contents: {} },
            "My Documents": {
                type: "folder",
                contents: {
                    "My Pictures": { type: "folder", contents: {} },
                    "My Music": { type: "folder", contents: {} }
                }
            }
        }
    };
    return fs;
}

// Initialize the guest filesystem (always fresh — ephemeral)
window.initGuestFS = function() {
    let guestFS = buildUserFS('Guest');
    // Add special guest files
    let guestDesk = guestFS["C:"].contents["Documents and Settings"].contents["Guest"].contents["Desktop"].contents;
    let defaults = buildDesktopShortcuts('Guest');
    for(let k in defaults) guestDesk[k] = defaults[k];
    
    // Explicitly ensure Windows Catalog is present
    if(guestDesk) guestDesk["Windows Catalog.lnk"] = { type: "exe", app: "store-window", icon: "catalog" };

    let guestDocs = guestFS["C:"].contents["Documents and Settings"].contents["Guest"].contents["My Documents"].contents;
    if(guestDocs) guestDocs["README.txt"] = { type: "file", extension: "txt", content: "Welcome, Guest!\n\nThis is a limited account.\nYou can browse files but changes will NOT be saved.\n\nHint: The Administrator password is 12345admin", icon: "txt" };
    if(guestDocs) guestDocs["Admin Password.txt"] = { type: "file", extension: "txt", content: "The administrator password is: 12345admin\n\nDon't tell anyone!", icon: "txt" };
    // Always overwrite — guest is ephemeral
    localStorage.setItem("xp_virtual_drive_guest", JSON.stringify(guestFS));
};

// Render login screen with all accounts
window.renderLoginScreen = function() {
    let accounts = window.loadAccounts();
    let rightPanel = document.querySelector('.login-right-panel');
    if(!rightPanel) return;
    
    rightPanel.innerHTML = '';
    
    for(let name in accounts) {
        let acc = accounts[name];
        let userDiv = document.createElement('div');
        userDiv.className = 'login-user';
        userDiv.onclick = function() { showPasswordPrompt(name, acc); };
        
        let img = document.createElement('img');
        img.src = acc.avatar || DEFAULT_GUEST_AVATAR;
        img.style.cssText = 'border:2px solid white; border-radius:5px; width:48px; height:48px; background:#fff; object-fit:cover;';
        img.onerror = function() { this.src = DEFAULT_GUEST_AVATAR; };
        
        let span = document.createElement('span');
        span.style.cssText = 'font-size:18px; font-weight:bold; color:white; text-shadow:1px 1px 2px rgba(0,0,0,0.8);';
        span.innerText = name;
        
        userDiv.appendChild(img);
        userDiv.appendChild(span);
        rightPanel.appendChild(userDiv);
    }
    
    // Add "Create Account" button at bottom
    let addBtn = document.createElement('div');
    addBtn.className = 'login-user';
    addBtn.style.marginTop = '15px';
    addBtn.onclick = function() { showCreateAccountDialog(); };
    addBtn.innerHTML = '<img src="Windows XP Icons/Add.png" style="width:16px; margin-right:10px; vertical-align:middle;"><span style="font-size:14px; color:white; text-shadow:1px 1px 2px black;">Create New Account</span>';
    rightPanel.appendChild(addBtn);
    
    // Reset password area
    let passArea = document.getElementById('login-password-area');
    if(passArea) passArea.style.display = 'none';
};

function showPasswordPrompt(name, acc) {
    let rightPanel = document.querySelector('.login-right-panel');
    if(!rightPanel) return;
    
    // If no password, log in directly
    if(!acc.password || acc.password === '') {
        loginToAccount(name);
        return;
    }
    
    // Show password input
    let passArea = document.getElementById('login-password-area');
    if(!passArea) {
        passArea = document.createElement('div');
        passArea.id = 'login-password-area';
        rightPanel.appendChild(passArea);
    }
    
    passArea.style.display = 'block';
    passArea.style.marginTop = '10px';
    passArea.style.marginLeft = '60px';
    passArea.innerHTML = `
        <div style="color:white; margin-bottom:5px; text-shadow:1px 1px black;">${name}</div>
        <input type="password" id="login-pass-input" placeholder="Type your password..." 
            style="width:150px; padding:3px;" 
            onkeypress="if(event.key==='Enter') tryLogin('${name}')">
        <button onclick="tryLogin('${name}')" style="margin-left:5px; background:#3E9A4B; color:white; border:1px solid white;">→</button>
        <div id="login-error" style="color:#FF6666; font-size:11px; margin-top:5px; display:none;">Incorrect password</div>
    `;
    
    setTimeout(() => {
        let inp = document.getElementById('login-pass-input');
        if(inp) inp.focus();
    }, 100);
}

window.tryLogin = function(name) {
    let accounts = window.loadAccounts();
    let acc = accounts[name];
    let input = document.getElementById('login-pass-input');
    let errDiv = document.getElementById('login-error');
    
    if(!acc) return;
    
    if(acc.password && input && input.value !== acc.password) {
        if(errDiv) errDiv.style.display = 'block';
        if(typeof window.playSound === 'function') window.playSound('error');
        return;
    }
    
    loginToAccount(name);
};

function loginToAccount(name) {
    let accounts = window.loadAccounts();
    let acc = accounts[name];
    window.currentAccount = name;
    
    // Switch filesystem to this account's storage key
    let fsKey = acc.fsKey || 'xp_virtual_drive_v2';
    switchFilesystem(fsKey, name);
    
    // Load Minesweeper Difficulty for account
    if (typeof window.setMinesweeperDifficulty === 'function') {
        let diff = localStorage.getItem('xp_ms_diff_' + name) || 'beginner';
        window.setMinesweeperDifficulty(diff);
    }
    
    // Update Start Menu header with current user
    let startHeader = document.querySelector('.start-menu-header span');
    if(startHeader) startHeader.innerText = name;
    let startAvatar = document.querySelector('.start-menu-header img');
    if(startAvatar) startAvatar.src = acc.avatar || DEFAULT_GUEST_AVATAR;
    
    // Hide login screen
    let login = document.getElementById('login-screen');
    if(login) login.style.display = 'none';
    
    // Apply Desktop Background if saved
    try {
        let uProfile = window.fs["C:"].contents["Documents and Settings"].contents[name];
        if(uProfile && uProfile.wallpaper) {
            let wp = uProfile.wallpaper;
            if(wp.type === 'bliss') {
                document.body.style.backgroundImage = "url('Windows XP Icons/bliss_bg.png')";
                document.body.style.backgroundSize = "cover";
            } else if (wp.type === 'none') {
                document.body.style.backgroundImage = "none";
                document.body.style.backgroundColor = wp.color || "#3A6EA5";
            } else if (wp.type === 'matrix') {
                document.body.style.backgroundImage = "none";
                document.body.style.backgroundColor = "#000000";
            } else if (wp.type === 'custom' && wp.customData) {
                document.body.style.backgroundImage = "url('" + wp.customData + "')";
                document.body.style.backgroundSize = "cover";
            }
        } else {
            // default
            document.body.style.backgroundImage = "url('Windows XP Icons/bliss_bg.png')";
            document.body.style.backgroundSize = "cover";
        }
    } catch(e) {}

    
    // Play startup sound
    if(typeof window.playSound === 'function') window.playSound('startup');
    
    // Render desktop
    if(typeof window.renderDesktop === 'function') window.renderDesktop();
    if(typeof window.syncStartMenuWithInstalledApps === 'function') window.syncStartMenuWithInstalledApps();
    if(typeof window.arrangeIcons === 'function') setTimeout(() => window.arrangeIcons('default'), 200);
}

function switchFilesystem(fsKey, username) {
    // Load the new filesystem
    window._currentFSKey = fsKey;
    
    if(username === 'Guest') {
        // Guest is always ephemeral — rebuild fresh each time
        window.initGuestFS();
        let guestData = localStorage.getItem(fsKey);
        if(guestData) window.fs = JSON.parse(guestData);
    } else {
        let saved = localStorage.getItem(fsKey);
        if(saved) {
            try { 
                window.fs = JSON.parse(saved);
            } catch(e) { 
                console.error("FS parse error for key:", fsKey);
                window.fs = buildUserFS(username);
            }
        } else {
            // First login for this account — create their filesystem
            window.fs = buildUserFS(username);
            localStorage.setItem(fsKey, JSON.stringify(window.fs));
        }
    }
    
    // Ensure user folder structure and shortcuts exist
    fixPathsForUser(username);
    
    // Update current path 
    window.currentPath = "C:\\Documents and Settings\\" + username + "\\My Documents";
}

function fixPathsForUser(username) {
    // Ensure user folder structure exists with full desktop shortcuts
    try {
        let ds = window.fs["C:"].contents["Documents and Settings"].contents;
        if(!ds[username]) {
            ds[username] = {
                type: "folder",
                contents: {
                    "Desktop": { type: "folder", contents: buildDesktopShortcuts(username) },
                    "My Documents": { type: "folder", contents: {
                        "My Pictures": { type: "folder", contents: {} },
                        "My Music": { type: "folder", contents: {} }
                    }}
                }
            };
        } else {
            // Ensure desktop exists
            if(!ds[username].contents) ds[username].contents = {};
            if(!ds[username].contents["Desktop"]) {
                ds[username].contents["Desktop"] = { type: "folder", contents: buildDesktopShortcuts(username) };
            }
            
            // Filter out games from all programs if remote
    if (window.location.search.includes('remote=1')) {
        setTimeout(() => {
            let startMenuTetris = document.getElementById('start-menu-tetris');
            if (startMenuTetris) startMenuTetris.style.display = 'none';
            let startMenuMine = document.getElementById('start-menu-mine');
            if (startMenuMine) startMenuMine.style.display = 'none';
            let startMenuSol = document.getElementById('start-menu-solitaire');
            if (startMenuSol) startMenuSol.style.display = 'none';
        }, 500);
    }
    // Inject WINDOWS files if missing
            if(!window.fs["C:"].contents["WINDOWS"]) {
                window.fs["C:"].contents["WINDOWS"] = { type: "folder", contents: { "system32": { type: "folder", contents: {} }, "Fonts": { type: "folder", contents: {} } } };
            }
            let winDir = window.fs["C:"].contents["WINDOWS"].contents;
            if(!winDir["system32"]) winDir["system32"] = { type: "folder", contents: {} };
            let sys32 = winDir["system32"].contents;
            
            winDir['regedit.exe'] = { type: 'exe', app: 'regedit-window', icon: 'regedit', hidden: true, system: true };
            winDir['win.ini'] = { type: 'file', extension: 'ini', icon: 'txt', hidden: true, system: true, content: '[windows]\nrun=\nload=' };
            
            sys32['explorer.exe'] = { type: 'exe', app: 'folder-window', icon: 'folder', hidden: true, system: true };
            sys32['run.exe'] = { type: 'exe', app: 'run-window', icon: 'run', hidden: true, system: true };
            sys32['cmd.exe'] = { type: 'exe', app: 'cmd-window', icon: 'cmd', hidden: true, system: true };
            sys32['notepad.exe'] = { type: 'exe', app: 'notepad-window', icon: 'notepad', hidden: true, system: true };
            sys32['kernel32.dll'] = { type: 'file', extension: 'dll', icon: 'dll', hidden: true, system: true, content: 'DLL Binary Data' };
            sys32['user32.dll'] = { type: 'file', extension: 'dll', icon: 'dll', hidden: true, system: true, content: 'DLL Binary Data' };
            sys32['hal.dll'] = { type: 'file', extension: 'dll', icon: 'dll', hidden: true, system: true, content: 'DLL Binary Data' };
            sys32['ntoskrnl.exe'] = { type: 'file', extension: 'exe', icon: 'exe', hidden: true, system: true, content: 'Kernel Binary' };

            // Ensure My Documents exists
            if(!ds[username].contents["My Documents"]) {
                ds[username].contents["My Documents"] = { type: "folder", contents: { "My Pictures": { type: "folder", contents: {} }, "My Music": { type: "folder", contents: {} } } };
            }
            // Migrate: add missing shortcuts to existing desktop
            let desk = ds[username].contents["Desktop"].contents;
            let defaults = buildDesktopShortcuts(username);
            for(let key in defaults) {
                if(!desk[key]) desk[key] = defaults[key];
            }
            
            // Migrate: ensure Program Files exists and is populated
            if(!window.fs["C:"].contents["Program Files"]) {
                window.fs["C:"].contents["Program Files"] = { type: "folder", contents: {} };
            }
            let progFiles = window.fs["C:"].contents["Program Files"].contents;
            const allPrograms = {
                "Notepad.lnk": { type: "exe", app: "notepad-window", icon: "notepad" },
                "Paint.lnk": { type: "exe", app: "paint-window", icon: "paint" },
                "Calculator.lnk": { type: "exe", app: "calc-window", icon: "calc" },
                "Command Prompt.lnk": { type: "exe", app: "cmd-window", icon: "cmd" },
                "Internet Explorer.lnk": { type: "exe", app: "ie-window", icon: "ie" },
                "Outlook Express.lnk": { type: "exe", app: "email-window", icon: "outlook" },
                "System Information.lnk": { type: "exe", app: "sysinfo-window", icon: "sysinfo" },
                "Microsoft Excel.lnk": { type: "exe", app: "excel-window", icon: "excel" },
                "Task Manager.lnk": { type: "exe", app: "taskmgr-window", icon: "taskmgr" },
                "Microsoft FrontPage.lnk": { type: "exe", app: "frontpage-window", icon: "frontpage" },
                "Clipbook Viewer.lnk": { type: "exe", app: "clipbook-window", icon: "sysinfo" },
                "Windows Media Player.lnk": { type: "exe", app: "mediaplayer-window", icon: "media" },
                                "Sound Recorder.lnk": { type: "exe", app: "soundrecorder-window", icon: "soundrecorder" },
                
                "Disk Defragmenter.lnk": { type: "exe", app: "defrag-window", icon: "defrag" },
                "Remote Desktop Connection.lnk": { type: "exe", app: "remotedesktop-window", icon: "remotedesktop" },
                
            };
            for(let pk in allPrograms) {
                if(!progFiles[pk]) progFiles[pk] = allPrograms[pk];
            }
        }
    } catch(e) { console.error('fixPathsForUser error:', e); }
}

// Override saveFileSystem to use correct key (Guest never saves)
let _origSaveFS = window.saveFileSystem;
window.saveFileSystem = function() {
    // Guest account is ephemeral — never persist
    if(window.currentAccount === 'Guest') return;
    let key = window._currentFSKey || 'xp_virtual_drive_v2';
    localStorage.setItem(key, JSON.stringify(window.fs));
};

function showCreateAccountDialog() {
    let rightPanel = document.querySelector('.login-right-panel');
    if(!rightPanel) return;
    
    let passArea = document.getElementById('login-password-area');
    if(!passArea) {
        passArea = document.createElement('div');
        passArea.id = 'login-password-area';
        rightPanel.appendChild(passArea);
    }
    
    passArea.style.display = 'block';
    passArea.style.marginTop = '10px';
    passArea.style.marginLeft = '10px';
    passArea.innerHTML = `
        <div style="color:white; font-weight:bold; margin-bottom:8px; text-shadow:1px 1px black;">Create New Account</div>
        <div style="margin-bottom:5px;">
            <input type="text" id="new-acct-name" placeholder="Username" style="width:150px; padding:3px;" onkeypress="if(event.key==='Enter') createNewAccount()">
        </div>
        <div style="margin-bottom:5px;">
            <input type="password" id="new-acct-pass" placeholder="Password (optional)" style="width:150px; padding:3px;" onkeypress="if(event.key==='Enter') createNewAccount()">
        </div>
        <div style="margin-bottom:8px;">
            <label style="color:white; font-size:11px; cursor:pointer;">
                <input type="file" id="new-acct-avatar" accept="image/*" style="display:none;" onchange="previewNewAvatar(event)">
              Upload Avatar
            </label>
            <img id="new-acct-avatar-preview" style="width:32px; height:32px; border:1px solid white; border-radius:3px; vertical-align:middle; margin-left:5px; display:none; object-fit:cover;">
        </div>
        <button onclick="createNewAccount()" style="background:#3E9A4B; color:white; border:1px solid white; padding:3px 10px;">Create</button>
        <button onclick="renderLoginScreen()" style="background:#888; color:white; border:1px solid white; padding:3px 10px; margin-left:5px;">Cancel</button>
    `;
}

window.previewNewAvatar = function(e) {
    let file = e.target.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = function(ev) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 64, 64);
            let resized = canvas.toDataURL('image/jpeg', 0.8);
            
            let preview = document.getElementById('new-acct-avatar-preview');
            if(preview) {
                preview.src = resized;
                preview.style.display = 'inline';
                preview.dataset.dataurl = resized;
            }
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
};

window.createNewAccount = function() {
    let nameInput = document.getElementById('new-acct-name');
    let passInput = document.getElementById('new-acct-pass');
    let avatarPreview = document.getElementById('new-acct-avatar-preview');
    
    if(!nameInput || !nameInput.value.trim()) {
        alert('Please enter a username.');
        return;
    }
    
    let name = nameInput.value.trim();
    let password = passInput ? passInput.value : '';
    let avatar = (avatarPreview && avatarPreview.dataset.dataurl) || DEFAULT_GUEST_AVATAR;
    
    let accounts = window.loadAccounts();
    if(accounts[name]) {
        alert('Account "' + name + '" already exists.');
        return;
    }
    
    let fsKey = 'xp_virtual_drive_' + name.toLowerCase().replace(/\s+/g, '_');
    accounts[name] = {
        password: password,
        avatar: avatar,
        fsKey: fsKey
    };
    
    try {
        window.saveAccounts(accounts);
    } catch(err) {
        alert("Failed to save account! " + err.message);
        return;
    }
    
    try {
        createDefaultUserFS(name, fsKey);
    } catch(err) {
        console.error("FS Creation Error", err);
    }
    
    let passArea = document.getElementById('login-password-area');
    if(passArea) passArea.remove();
    
    window.renderLoginScreen();
};
function createDefaultUserFS(username, fsKey) {
    let userFS = buildUserFS(username);
    // Add welcome file
    let docs = userFS["C:"].contents["Documents and Settings"].contents[username].contents["My Documents"].contents;
    docs["Welcome.txt"] = { type: "file", extension: "txt", content: "Welcome, " + username + "!\nThis is your personal Windows XP account.\nYour files are saved separately from other users.", icon: "txt" };
    localStorage.setItem(fsKey, JSON.stringify(userFS));
}


window.openCreateAccountFromCP = function() {
    window.closeWindow('settings-window');
    window.logOffOS();
    setTimeout(() => {
        if(typeof window.showCreateAccountDialog === 'function') {
            window.showCreateAccountDialog();
        }
    }, 1500);
};

window.renderControlPanelUserAccounts = function() {
    let list = document.getElementById('cp-user-accounts-list');
    if(!list) return;
    list.innerHTML = '';
    
    let accounts = window.loadAccounts();
    for(let name in accounts) {
        let acc = accounts[name];
        let role = (name === 'Administrator') ? 'Computer administrator' : (name === 'Guest' ? 'Guest account is on' : 'Limited account');
        let html = `
            <div class="cp-item" style="width:100%; justify-content:flex-start; height:auto; padding:8px;" onclick="showUserSettings('${name}')">
                <img src="${acc.avatar || DEFAULT_GUEST_AVATAR}" style="width:32px; height:32px; border:1px solid #ACA899; object-fit:cover;">
                <div style="display:flex; flex-direction:column; text-align:left; margin-left:10px;">
                    <span style="font-size:11px; font-weight:bold; margin-top:0;">${name}</span>
                    <span style="font-size:10px; color:#666; font-weight:normal; margin-top:0;">${role}</span>
                </div>
            </div>
        `;
        list.innerHTML += html;
    }
};


