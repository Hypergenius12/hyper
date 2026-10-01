
window.isAppInstalled = function(appName) {
    let appPaths = {
        'Notepad': 'C:\\Windows\\System32\\notepad.exe',
        'notepad-window': 'C:\\Windows\\System32\\notepad.exe',
        'WordPad': 'C:\\Program Files\\Windows NT\\Accessories\\wordpad.exe',
        'wordpad-window': 'C:\\Program Files\\Windows NT\\Accessories\\wordpad.exe',
        'Paint': 'C:\\Windows\\System32\\mspaint.exe',
        'paint-window': 'C:\\Windows\\System32\\mspaint.exe',
        'Calculator': 'C:\\Windows\\System32\\calc.exe',
        'calc-window': 'C:\\Windows\\System32\\calc.exe',
        'Character Map': 'C:\\Windows\\System32\\charmap.exe',
        'charmap-window': 'C:\\Windows\\System32\\charmap.exe',
        'Sound Recorder': 'C:\\Windows\\System32\\sndrec32.exe',
        'soundrecorder-window': 'C:\\Windows\\System32\\sndrec32.exe',
        'Clipboard Viewer': 'C:\\Windows\\System32\\clipbrd.exe',
        'clipbook-window': 'C:\\Windows\\System32\\clipbrd.exe',
        'Minesweeper': 'C:\\Windows\\System32\\winmine.exe',
        'minesweeper-window': 'C:\\Windows\\System32\\winmine.exe',
        'Solitaire': 'C:\\Windows\\System32\\sol.exe',
        'solitaire-window': 'C:\\Windows\\System32\\sol.exe',
        'FreeCell': 'C:\\Windows\\System32\\freecell.exe',
        'freecell-window': 'C:\\Windows\\System32\\freecell.exe',
        'Hearts': 'C:\\Windows\\System32\\mshearts.exe',
        'hearts-window': 'C:\\Windows\\System32\\mshearts.exe',
        'Internet Spades': 'C:\\Program Files\\MSN Gaming Zone\\Windows\\spades.exe',
        'spades-window': 'C:\\Program Files\\MSN Gaming Zone\\Windows\\spades.exe',
        'Internet Checkers': 'C:\\Program Files\\Internet Checkers\\chkrs.exe',
        'checkers-window': 'C:\\Program Files\\Internet Checkers\\chkrs.exe',
        'Internet Reversi': 'C:\\Program Files\\Internet Reversi\\reversi.exe',
        'reversi-window': 'C:\\Program Files\\Internet Reversi\\reversi.exe',
        '3D Pinball': 'C:\\Program Files\\Windows NT\\Pinball\\pinball.exe',
        'pinball-window': 'C:\\Program Files\\Windows NT\\Pinball\\pinball.exe',
        'Disk Defragmenter': 'C:\\Windows\\System32\\dfrg.msc',
        'defrag-window': 'C:\\Windows\\System32\\dfrg.msc',
        'System Information': 'C:\\Program Files\\Common Files\\Microsoft Shared\\MSInfo\\msinfo32.exe',
        'sysinfo-window': 'C:\\Program Files\\Common Files\\Microsoft Shared\\MSInfo\\msinfo32.exe',
        'Registry Editor': 'C:\\Windows\\regedit.exe',
        'regedit-window': 'C:\\Windows\\regedit.exe',
        'Task Manager': 'C:\\Windows\\System32\\taskmgr.exe',
        'taskmgr-window': 'C:\\Windows\\System32\\taskmgr.exe',
        'Command Prompt': 'C:\\Windows\\System32\\cmd.exe',
        'cmd-window': 'C:\\Windows\\System32\\cmd.exe',
        'Internet Explorer': 'C:\\Program Files\\Internet Explorer\\iexplore.exe',
        'ie-window': 'C:\\Program Files\\Internet Explorer\\iexplore.exe',
        'Outlook Express': 'C:\\Program Files\\Outlook Express\\msimn.exe',
        'email-window': 'C:\\Program Files\\Outlook Express\\msimn.exe',
        'Windows Media Player': 'C:\\Program Files\\Windows Media Player\\wmplayer.exe',
        'mediaplayer-window': 'C:\\Program Files\\Windows Media Player\\wmplayer.exe',
        'Windows Messenger': 'C:\\Program Files\\Messenger\\msmsgs.exe',
        'messenger-window': 'C:\\Program Files\\Messenger\\msmsgs.exe',
        'Remote Desktop': 'C:\\Windows\\System32\\mstsc.exe',
        'remotedesktop-window': 'C:\\Windows\\System32\\mstsc.exe',
        'Tour Windows XP': 'C:\\Windows\\Help\\Tours\\htmlTour\\tour.exe',
        'xptour-window': 'C:\\Windows\\Help\\Tours\\htmlTour\\tour.exe',
        'Photon Picture Viewer': 'C:\\Windows\\System32\\photon.exe',
        'photon-window': 'C:\\Windows\\System32\\photon.exe',
        'Control Panel': 'C:\\Windows\\System32\\control.exe',
        'controlpanel-window': 'C:\\Windows\\System32\\control.exe',
        'Printers and Faxes': 'C:\\Windows\\System32\\printers.exe',
        'printers-window': 'C:\\Windows\\System32\\printers.exe',
        'Help and Support': 'C:\\Windows\\PCHealth\\HelpCtr\\Binaries\\helpctr.exe',
        'help-window': 'C:\\Windows\\PCHealth\\HelpCtr\\Binaries\\helpctr.exe',
        'Microsoft FrontPage': 'C:\\Program Files\\Microsoft FrontPage\\frontpage.exe',
        'frontpage-window': 'C:\\Program Files\\Microsoft FrontPage\\frontpage.exe',
        'Microsoft Excel': 'C:\\Program Files\\Microsoft Office\\excel.exe',
        'excel-window': 'C:\\Program Files\\Microsoft Office\\excel.exe'
    };
    
    if (appPaths[appName]) {
        let p = appPaths[appName];
        let parentDir = p.substring(0, p.lastIndexOf("\\"));
        let exeName = p.substring(p.lastIndexOf("\\") + 1);
        
        let node = window.resolvePath(parentDir);
        let inOriginal = !!(node && node[exeName]);
        
        return inOriginal;
    }
    
    let pfNode = window.resolvePath("C:\\Program Files");
    if (pfNode && pfNode[appName]) return true;
    return false;
};

window.isAppInRecycler = function(appName) {
    let appPaths = {
        'Notepad': 'C:\\Windows\\System32\\notepad.exe',
        'notepad-window': 'C:\\Windows\\System32\\notepad.exe',
        'WordPad': 'C:\\Program Files\\Windows NT\\Accessories\\wordpad.exe',
        'wordpad-window': 'C:\\Program Files\\Windows NT\\Accessories\\wordpad.exe',
        'Paint': 'C:\\Windows\\System32\\mspaint.exe',
        'paint-window': 'C:\\Windows\\System32\\mspaint.exe',
        'Calculator': 'C:\\Windows\\System32\\calc.exe',
        'calc-window': 'C:\\Windows\\System32\\calc.exe',
        'Character Map': 'C:\\Windows\\System32\\charmap.exe',
        'charmap-window': 'C:\\Windows\\System32\\charmap.exe',
        'Sound Recorder': 'C:\\Windows\\System32\\sndrec32.exe',
        'soundrecorder-window': 'C:\\Windows\\System32\\sndrec32.exe',
        'Clipboard Viewer': 'C:\\Windows\\System32\\clipbrd.exe',
        'clipbook-window': 'C:\\Windows\\System32\\clipbrd.exe',
        'Minesweeper': 'C:\\Windows\\System32\\winmine.exe',
        'minesweeper-window': 'C:\\Windows\\System32\\winmine.exe',
        'Solitaire': 'C:\\Windows\\System32\\sol.exe',
        'solitaire-window': 'C:\\Windows\\System32\\sol.exe',
        'FreeCell': 'C:\\Windows\\System32\\freecell.exe',
        'freecell-window': 'C:\\Windows\\System32\\freecell.exe',
        'Hearts': 'C:\\Windows\\System32\\mshearts.exe',
        'hearts-window': 'C:\\Windows\\System32\\mshearts.exe',
        'Internet Spades': 'C:\\Program Files\\MSN Gaming Zone\\Windows\\spades.exe',
        'spades-window': 'C:\\Program Files\\MSN Gaming Zone\\Windows\\spades.exe',
        'Internet Checkers': 'C:\\Program Files\\Internet Checkers\\chkrs.exe',
        'checkers-window': 'C:\\Program Files\\Internet Checkers\\chkrs.exe',
        'Internet Reversi': 'C:\\Program Files\\Internet Reversi\\reversi.exe',
        'reversi-window': 'C:\\Program Files\\Internet Reversi\\reversi.exe',
        '3D Pinball': 'C:\\Program Files\\Windows NT\\Pinball\\pinball.exe',
        'pinball-window': 'C:\\Program Files\\Windows NT\\Pinball\\pinball.exe',
        'Disk Defragmenter': 'C:\\Windows\\System32\\dfrg.msc',
        'defrag-window': 'C:\\Windows\\System32\\dfrg.msc',
        'System Information': 'C:\\Program Files\\Common Files\\Microsoft Shared\\MSInfo\\msinfo32.exe',
        'sysinfo-window': 'C:\\Program Files\\Common Files\\Microsoft Shared\\MSInfo\\msinfo32.exe',
        'Registry Editor': 'C:\\Windows\\regedit.exe',
        'regedit-window': 'C:\\Windows\\regedit.exe',
        'Task Manager': 'C:\\Windows\\System32\\taskmgr.exe',
        'taskmgr-window': 'C:\\Windows\\System32\\taskmgr.exe',
        'Command Prompt': 'C:\\Windows\\System32\\cmd.exe',
        'cmd-window': 'C:\\Windows\\System32\\cmd.exe',
        'Internet Explorer': 'C:\\Program Files\\Internet Explorer\\iexplore.exe',
        'ie-window': 'C:\\Program Files\\Internet Explorer\\iexplore.exe',
        'Outlook Express': 'C:\\Program Files\\Outlook Express\\msimn.exe',
        'email-window': 'C:\\Program Files\\Outlook Express\\msimn.exe',
        'Windows Media Player': 'C:\\Program Files\\Windows Media Player\\wmplayer.exe',
        'mediaplayer-window': 'C:\\Program Files\\Windows Media Player\\wmplayer.exe',
        'Windows Messenger': 'C:\\Program Files\\Messenger\\msmsgs.exe',
        'messenger-window': 'C:\\Program Files\\Messenger\\msmsgs.exe',
        'Remote Desktop': 'C:\\Windows\\System32\\mstsc.exe',
        'remotedesktop-window': 'C:\\Windows\\System32\\mstsc.exe',
        'Tour Windows XP': 'C:\\Windows\\Help\\Tours\\htmlTour\\tour.exe',
        'xptour-window': 'C:\\Windows\\Help\\Tours\\htmlTour\\tour.exe',
        'Photon Picture Viewer': 'C:\\Windows\\System32\\photon.exe',
        'photon-window': 'C:\\Windows\\System32\\photon.exe',
        'Control Panel': 'C:\\Windows\\System32\\control.exe',
        'controlpanel-window': 'C:\\Windows\\System32\\control.exe',
        'Printers and Faxes': 'C:\\Windows\\System32\\printers.exe',
        'printers-window': 'C:\\Windows\\System32\\printers.exe',
        'Help and Support': 'C:\\Windows\\PCHealth\\HelpCtr\\Binaries\\helpctr.exe',
        'help-window': 'C:\\Windows\\PCHealth\\HelpCtr\\Binaries\\helpctr.exe',
        'Microsoft FrontPage': 'C:\\Program Files\\Microsoft FrontPage\\frontpage.exe',
        'frontpage-window': 'C:\\Program Files\\Microsoft FrontPage\\frontpage.exe',
        'Microsoft Excel': 'C:\\Program Files\\Microsoft Office\\excel.exe',
        'excel-window': 'C:\\Program Files\\Microsoft Office\\excel.exe'
    };
    
    if (appPaths[appName]) {
        let p = appPaths[appName];
        let parentDir = p.substring(0, p.lastIndexOf("\\"));
        let exeName = p.substring(p.lastIndexOf("\\") + 1);
        
        let node = window.resolvePath(parentDir);
        let inOriginal = (node && node[exeName]);
        if (inOriginal) return false;
        
        let recycler = window.resolvePath("C:\\RECYCLER");
        return !!(recycler && recycler[exeName]);
    }
    return false;
};
/* VIRTUAL FILE SYSTEM, CLIPBOARD & ICON MANAGER */

// Custom Retro Tetris Icon built in SVG
const customTetrisSVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><rect x='4' y='12' width='8' height='8' fill='%23FF0D72' stroke='black' stroke-width='1'/><rect x='12' y='12' width='8' height='8' fill='%23FF0D72' stroke='black' stroke-width='1'/><rect x='20' y='12' width='8' height='8' fill='%23FF0D72' stroke='black' stroke-width='1'/><rect x='12' y='4' width='8' height='8' fill='%23FF0D72' stroke='black' stroke-width='1'/><rect x='12' y='20' width='8' height='8' fill='%230DC2FF' stroke='black' stroke-width='1'/><rect x='20' y='20' width='8' height='8' fill='%230DC2FF' stroke='black' stroke-width='1'/><rect x='28' y='20' width='8' height='8' fill='%230DC2FF' stroke='black' stroke-width='1'/><rect x='28' y='12' width='8' height='8' fill='%230DC2FF' stroke='black' stroke-width='1'/></svg>`;

const sysIcons = {
    messenger: "Windows XP Icons/Windows Messenger.png",
    defrag: "Windows XP Icons/Disk Defragmenter.png",
    computer: "Windows XP Icons/My Computer.png",
    folder: "Windows XP Icons/Folder Closed.png",
    fonts: "Windows XP Icons/Fonts.png",
    ttf: "Windows XP Icons/Font.png",
    txt: "Windows XP Icons/TXT.png",
    exe: "Windows XP Icons/Application Window.png",
    settings: "Windows XP Icons/Control Panel.png",
    tetris: 'Windows XP Icons/tetris.webp', 
    mine: "Windows XP Icons/Minesweeper.png",
    solitaire: "Windows XP Icons/Solitaire.png",
    recycle_empty: "Windows XP Icons/Recycle Bin (empty).png",
    recycle_full: "Windows XP Icons/Recycle Bin (full).png",
    media: "Windows XP Icons/Windows Media Player 9.png",
    image: "Windows XP Icons/Windows Picture and Fax Viewer.png",
    paint: "Windows XP Icons/Paint.png",
    frontpage: "Windows XP Icons/CSS.png",
    video: "Windows XP Icons/Generic Video.png",
    wav: "Windows XP Icons/WMP Library.png",
    jpg: "Windows XP Icons/JPG.png",
    bmp: "Windows XP Icons/Bitmap.png",
    soundrecorder: "Windows XP Icons/Generic Audio.png",
    mydocs: "Windows XP Icons/My Documents.png",
    mymusic: "Windows XP Icons/My Music.png",
    mypictures: "Windows XP Icons/My Pictures.png",
    myvideos: "Windows XP Icons/My Videos.png",
    calc: "Windows XP Icons/Calculator.png",
    setup: "Windows XP Icons/Setup.png",
    cmd: "Windows XP Icons/Command Prompt.png",
    ie: "Windows XP Icons/Internet Explorer 6.png",
    outlook: "Windows XP Icons/Outlook Express.png",
    sysinfo: "Windows XP Icons/System Information.png",
    tourxp: "Windows XP Icons/Tour XP.png",
    notepad: "Windows XP Icons/Notepad.png",
    wordpad: "Windows XP Icons/Wordpad.png",
    hearts: "Windows XP Icons/Hearts.png",
    freecell: "Windows XP Icons/Freecell.png",
    spades: "Windows XP Icons/Internet Spades.png",
    regedit: "Windows XP Icons/Registry Editor.png",
    taskmgr: "Windows XP Icons/Task Manager.png",
    excel: "Windows XP Icons/Graph View.png",
    zip: "Windows XP Icons/Zip folder.png",
    frontpage: "Windows XP Icons/CSS.png",
    charmap: "Windows XP Icons/Charmap.png",
    pinball: "Windows XP Icons/Pinball.png",
    mouse: "Windows XP Icons/Mouse.png",
    catalog: "Windows XP Icons/Windows Catalog.png",
    remotedesktop: "Windows XP Icons/Remote Desktop.png"
};

let lastClickTime = 0;
let lastClickId = null;

window.triggerRename = function (div, key, path) {
    if (div.querySelector('.rename-input')) return;
    let span = div.querySelector('span');
    let originalText = span.innerText;
    let input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'rename-input';
    input.style.width = '100%';
    input.style.fontFamily = 'Tahoma';
    input.style.fontSize = '10px';
    span.style.display = 'none';
    div.appendChild(input);
    input.focus();
    input.select();
    input.onblur = finishRename;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') finishRename();
        if (e.key === 'Escape') cancelRename();
    };

    function cancelRename() {
        if (input.parentNode) {
            span.style.display = 'block';
            div.removeChild(input);
        }
    }

    function finishRename() {
        if (!input.parentNode) return;
        let newName = input.value.trim();
        let dir = window.resolvePath(path);

        let finalName = newName;

        if (finalName && finalName !== key && dir && !dir[finalName]) {
            let item = dir[key];
            
            let oldExt = key.includes('.') ? key.split('.').pop().toLowerCase() : '';
            let newExt = finalName.includes('.') ? finalName.split('.').pop().toLowerCase() : '';
            
            if (oldExt && newExt && oldExt !== newExt) {
                item.corrupted = true;
                item.originalExtension = oldExt;
                item.extension = newExt;
                item.content = window.generateCorruptedText(finalName);
            }
            
            dir[finalName] = item;
            delete dir[key];
            window.saveFileSystem();
            if (path.includes("Desktop")) window.renderDesktop();
            else window.renderExplorer(path);
        } else {
            cancelRename();
        }
    }
};

window.generateCorruptedText = function(filename) {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:<>?~-=[]\\;',./ ¦¦¦¦_¯¦";
    let len = 500 + Math.floor(Math.random() * 1000);
    let res = "An error occurred reading " + filename + ".\r\n";
    for(let i=0; i<len; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
};

window.bypassCorruptAndOpen = function(dir, name) {
    let d = window.resolvePath(dir);
    if(d && d[name]) {
        if(typeof window.openNotepadFile === 'function') {
            window.openNotepadFile(name, d[name].content, dir);
        }
    }
};

var fs = {
    "C:": {
        type: "drive",
        contents: {
            "RECYCLER": { type: "folder", contents: {} },
            "Documents and Settings": {
                type: "folder",
                contents: {
                    "Administrator": {
                        type: "folder",
                        contents: {
                            "Desktop": {
                                type: "folder",
                                contents: {
                                    "My Computer.lnk": { type: "shortcut", target: "C:\\", icon: "computer" },
                                    "My Documents.lnk": { type: "shortcut", target: "C:\\Documents and Settings\\Administrator\\My Documents", icon: "folder" },
                                    "Control Panel.lnk": { type: "exe", app: "settings-window", icon: "settings" },                                    "Disk Defragmenter.lnk": { type: "exe", app: "defrag-window", icon: "defrag" },
                                    "Recycle Bin.lnk": { type: "shortcut", target: "C:\\RECYCLER", icon: "recycle_empty" },
                                    "Paint.lnk": { type: "exe", app: "paint-window", icon: "paint" },
                                    "Sound Recorder.lnk": { type: "exe", app: "soundrecorder-window", icon: "soundrecorder" },
                                    "Calculator.lnk": { type: "exe", app: "calc-window", icon: "calc" },
                                    "Command Prompt.lnk": { type: "exe", app: "cmd-window", icon: "cmd" },
                                    "Internet Explorer.lnk": { type: "exe", app: "ie-window", icon: "ie" },
                                    "Outlook Express.lnk": { type: "exe", app: "email-window", icon: "outlook" },
                                    "System Information.lnk": { type: "exe", app: "sysinfo-window", icon: "sysinfo" },
                                    "WordPad.lnk": { type: "exe", app: "wordpad-window", icon: "wordpad" },
                                    "Task Manager.lnk": { type: "exe", app: "taskmgr-window", icon: "taskmgr" },
                                    "Microsoft FrontPage.lnk": { type: "exe", app: "frontpage-window", icon: "frontpage" },
                                    "Clipbook Viewer.lnk": { type: "exe", app: "clipbook-window", icon: "sysinfo" },
                                    "Photon.lnk": { type: "exe", app: "photon-window", icon: "image" },
                                    "Data Miner.lnk": { type: "exe", app: "main-window", icon: "mouse" }
                                }
                            },
                            "My Documents": {
                                type: "folder",
                                icon: "mydocs",
                                contents: {
                                    "passwords.txt": { type: "file", extension: "txt", content: "admin: password123\\nbank: 4092\\nDO NOT DELETE", icon: "txt" },
                                    "journal.txt": { type: "file", extension: "txt", content: "Day 42 of simulating an OS\\nStill searching for the perfect blue screen.", icon: "txt" },
                                    "My Music": {
                                        type: "folder",
                                        icon: "mymusic",
                                        contents: {
                                            "tada.wav": { type: "file", extension: "wav", content: "RIFF...", icon: "wav" }
                                        }
                                    },
                                    "My Pictures": {
                                        type: "folder",
                                        icon: "mypictures",
                                        contents: {
                                            "sample.jpg": { type: "file", extension: "jpg", content: "data:image/jpeg;base64,...", icon: "jpg" },
                                            "bliss.png": { type: "file", extension: "png", content: "Windows XP Icons/bliss_bg.png", icon: "jpg" }
                                        }
                                    },
                                    "My Videos": {
                                        type: "folder",
                                        icon: "myvideos",
                                        contents: {}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "Program Files": {
                type: "folder",
                contents: {
                    "Outlook Express": { type: "folder", contents: { "msimn.exe": { type: "exe", app: "email-window", icon: "outlook" } } },
                    "Microsoft FrontPage": { type: "folder", contents: { "frontpg.exe": { type: "exe", app: "frontpage-window", icon: "frontpage" } } },
                    "Windows Media Player": { type: "folder", contents: { "wmplayer.exe": { type: "exe", app: "mediaplayer-window", icon: "media" } } },
                    
                    "Games": {
                        type: "folder", contents: {
                            "3D Pinball for Windows.lnk": { type: "exe", app: "pinball-window", icon: "pinball" },
                            "Minesweeper.lnk": { type: "exe", app: "minesweeper-window", icon: "mine" },
                            "Solitaire.lnk": { type: "exe", app: "solitaire-window", icon: "solitaire" },
                            "Tetris XP.lnk": { type: "exe", app: "tetris-window", icon: "tetris" }
                        }
                    },
                    "Accessories": {
                        type: "folder", contents: {
                            "mspaint.exe": { type: "exe", app: "paint-window", icon: "paint" },
                            "sndrec32.exe": { type: "exe", app: "soundrecorder-window", icon: "soundrecorder" },
                            "calc.exe": { type: "exe", app: "calc-window", icon: "calc" },
                            
                        }
                    }
                }
            },
            "WINDOWS": {
                type: "folder",
                contents: {
                    "win.ini": {
                        type: "file",
                        extension: "ini",
                        icon: "txt",
                        content: "; for 16-bit app support\n[fonts]\nSystemFont=Tahoma\n\n[Desktop]\nWallpaper=Bliss.bmp\nTileWallpaper=0\nWallpaperStyle=2\n"
                    },
                    "system.ini": {
                        type: "file",
                        extension: "ini",
                        icon: "txt",
                        content: "; for 16-bit app support\n[drivers]\nwave=mmdrv.dll\ntimer=timer.drv\n\n[boot]\nfonts.fon=vgasys.fon\n386grabber=vga.3gr\noemfonts.fon=vgaoem.fon\nfixedfon.fon=vgafix.fon\n"
                    },
                    "Fonts": {
                        type: "folder", icon: "fonts", contents: (function() {
                            if (typeof window !== 'undefined' && window.XP_SYSTEM_FONTS) {
                                return JSON.parse(JSON.stringify(window.XP_SYSTEM_FONTS));
                            }
                            return {
                                "Tahoma.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Tahoma", name: "Tahoma", size: "138 KB" },
                                "Arial.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Arial", name: "Arial", size: "290 KB" }
                            };
                        })()
                    },
                    "system32": {
                        type: "folder",
                        contents: {
                            "kernel32.dll": { type: "file", extension: "dll", content: "MZ...", icon: "exe" },
                            "user32.dll": { type: "file", extension: "dll", content: "MZ...", icon: "exe" },
                            "gdi32.dll": { type: "file", extension: "dll", content: "MZ...", icon: "exe" },
                            "shell32.dll": { type: "file", extension: "dll", content: "MZ...", icon: "exe" },
                            "win32k.sys": { type: "file", extension: "sys", content: "...", icon: "exe" },
                            "notepad.exe": { type: "exe", app: "notepad-window", icon: "txt" },
                            "calc.exe": { type: "exe", app: "calc-window", icon: "calc" },
                            "mspaint.exe": { type: "exe", app: "paint-window", icon: "paint" },
                            "cmd.exe": { type: "exe", app: "cmd-window", icon: "cmd" },
                            "taskmgr.exe": { type: "exe", app: "taskmgr-window", icon: "taskmgr" },
                            "regedit.exe": { type: "exe", app: "regedit-window", icon: "regedit" },
                            "sndrec32.exe": { type: "exe", app: "soundrecorder-window", icon: "soundrecorder" },
                            "explorer.exe": { type: "exe", app: "folder-window", icon: "computer" },
                            "cleanmgr.exe": { type: "exe", app: "settings-window", icon: "settings" },
                            "sol.exe": { type: "exe", app: "solitaire-window", icon: "solitaire" },
                            "winmine.exe": { type: "exe", app: "minesweeper-window", icon: "mine" },
                            "pinball.exe": { type: "exe", app: "pinball-window", icon: "pinball" },
                            "dfrg.msc": { type: "exe", app: "defrag-window", icon: "defrag" },
                            "charmap.exe": { type: "exe", app: "charmap-window", icon: "charmap" },
                            "clipbrd.exe": { type: "exe", app: "clipbook-window", icon: "clipbrd" },
                            "msinfo32.exe": { type: "exe", app: "sysinfo-window", icon: "sysinfo" },
                            "mstsc.exe": { type: "exe", app: "mstsc-window", icon: "remotedesktop" },
                            "photon.exe": { type: "exe", app: "photon-window", icon: "photon" },
                            "control.exe": { type: "exe", app: "control-window", icon: "settings" },
                            "printers.exe": { type: "exe", app: "printers-window", icon: "printers" },
                            "mshearts.exe": { type: "exe", app: "hearts-window", icon: "hearts" },
                            "freecell.exe": { type: "exe", app: "freecell-window", icon: "freecell" }
                        }
                    },
                    "Web": {
                        type: "folder",
                        icon: "folder",
                        contents: {
                            "Wallpaper": {
                                type: "folder",
                                icon: "folder",
                                contents: (function() {
                                    let walls = {};
                                    let source = (typeof window !== 'undefined' && window.XP_WALLPAPERS) ? window.XP_WALLPAPERS : {
                                        "Bliss.bmp": { ext: "bmp", content: "Windows XP Icons/bliss_bg.png", icon: "bmp" },
                                        "Ascent.jpg": { ext: "jpg", content: "wallpapers/Ascent.jpg", icon: "jpg" },
                                        "Autumn.jpg": { ext: "jpg", content: "wallpapers/Autumn.jpg", icon: "jpg" },
                                        "Azul.jpg": { ext: "jpg", content: "wallpapers/Azul.jpg", icon: "jpg" },
                                        "Crystal.jpg": { ext: "jpg", content: "wallpapers/Crystal.jpg", icon: "jpg" },
                                        "Follow.jpg": { ext: "jpg", content: "wallpapers/Follow.jpg", icon: "jpg" },
                                        "Friend.jpg": { ext: "jpg", content: "wallpapers/Friend.jpg", icon: "jpg" },
                                        "Home.jpg": { ext: "jpg", content: "wallpapers/Home.jpg", icon: "jpg" },
                                        "Moon flower.jpg": { ext: "jpg", content: "wallpapers/Moon flower.jpg", icon: "jpg" },
                                        "Peace.jpg": { ext: "jpg", content: "wallpapers/Peace.jpg", icon: "jpg" },
                                        "Power.jpg": { ext: "jpg", content: "wallpapers/Power.jpg", icon: "jpg" },
                                        "Purple flower.jpg": { ext: "jpg", content: "wallpapers/Purple flower.jpg", icon: "jpg" },
                                        "Radiance.jpg": { ext: "jpg", content: "wallpapers/Radiance.jpg", icon: "jpg" },
                                        "Red moon desert.jpg": { ext: "jpg", content: "wallpapers/Red moon desert.jpg", icon: "jpg" },
                                        "Ripple.jpg": { ext: "jpg", content: "wallpapers/Ripple.jpg", icon: "jpg" },
                                        "Stonehenge.jpg": { ext: "jpg", content: "wallpapers/Stonehenge.jpg", icon: "jpg" },
                                        "Tulips.jpg": { ext: "jpg", content: "wallpapers/Tulips.jpg", icon: "jpg" },
                                        "Vortec space.jpg": { ext: "jpg", content: "wallpapers/Vortec space.jpg", icon: "jpg" },
                                        "Wind.jpg": { ext: "jpg", content: "wallpapers/Wind.jpg", icon: "jpg" },
                                        "Windows XP.jpg": { ext: "jpg", content: "wallpapers/Windows XP.jpg", icon: "jpg" }
                                    };
                                    for (let k in source) {
                                        walls[k] = {
                                            type: "file",
                                            extension: source[k].ext,
                                            content: source[k].content,
                                            icon: source[k].icon || "jpg"
                                        };
                                    }
                                    return walls;
                                })()
                            }
                        }
                    },
                    "Media": {
                        type: "folder",
                        icon: "folder",
                        contents: {
                            "Windows XP Startup.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Startup.wav", icon: "wav" },
                            "Windows XP Shutdown.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Shutdown.wav", icon: "wav" },
                            "Windows XP Logon Sound.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Logon Sound.wav", icon: "wav" },
                            "Windows XP Logoff Sound.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Logoff Sound.wav", icon: "wav" },
                            "Windows XP Error.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Error.wav", icon: "wav" },
                            "Windows XP Critical Stop.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Critical Stop.wav", icon: "wav" },
                            "Windows XP Exclamation.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Exclamation.wav", icon: "wav" },
                            "Windows XP Ding.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Ding.wav", icon: "wav" },
                            "Windows XP Notify.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Notify.wav", icon: "wav" },
                            "Windows XP Balloon.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Balloon.wav", icon: "wav" },
                            "Windows XP Recycle.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Recycle.wav", icon: "wav" },
                            "Windows XP Minimize.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Minimize.wav", icon: "wav" },
                            "Windows XP Restore.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Restore.wav", icon: "wav" },
                            "Windows XP Menu Command.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Menu Command.wav", icon: "wav" },
                            "Windows XP Print complete.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Print complete.wav", icon: "wav" },
                            "Windows XP Hardware Insert.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Hardware Insert.wav", icon: "wav" },
                            "Windows XP Hardware Remove.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Hardware Remove.wav", icon: "wav" },
                            "Windows XP Hardware Fail.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Hardware Fail.wav", icon: "wav" },
                            "Windows XP Pop-up Blocked.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Pop-up Blocked.wav", icon: "wav" },
                            "Windows XP Battery Low.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Battery Low.wav", icon: "wav" },
                            "Windows XP Battery Critical.wav": { type: "file", extension: "wav", content: "XP sounds/Windows XP Battery Critical.wav", icon: "wav" },
                            "Windows Navigation Start.wav": { type: "file", extension: "wav", content: "XP sounds/Windows Navigation Start.wav", icon: "wav" },
                            "Windows Information Bar.wav": { type: "file", extension: "wav", content: "XP sounds/Windows Information Bar.wav", icon: "wav" },
                            "Windows Feed Discovered.wav": { type: "file", extension: "wav", content: "XP sounds/Windows Feed Discovered.wav", icon: "wav" },
                            "chimes.wav": { type: "file", extension: "wav", content: "XP sounds/chimes.wav", icon: "wav" },
                            "chord.wav": { type: "file", extension: "wav", content: "XP sounds/chord.wav", icon: "wav" },
                            "ding.wav": { type: "file", extension: "wav", content: "XP sounds/ding.wav", icon: "wav" },
                            "notify.wav": { type: "file", extension: "wav", content: "XP sounds/notify.wav", icon: "wav" },
                            "recycle.wav": { type: "file", extension: "wav", content: "XP sounds/recycle.wav", icon: "wav" },
                            "ringin.wav": { type: "file", extension: "wav", content: "XP sounds/ringin.wav", icon: "wav" },
                            "ringout.wav": { type: "file", extension: "wav", content: "XP sounds/ringout.wav", icon: "wav" },
                            "start.wav": { type: "file", extension: "wav", content: "XP sounds/start.wav", icon: "wav" },
                            "tada.wav": { type: "file", extension: "wav", content: "XP sounds/tada.wav", icon: "wav" }
                        }
                    }
                }
            }
        }
    }
};

window.currentPath = "C:\\Documents and Settings\\Administrator\\My Documents";
// Helper: get current user desktop path (works with multi-account system)
window.getDesktopPath = function () {
    let user = window.currentAccount || 'Administrator';
    return "C:\\Documents and Settings\\" + user + "\\Desktop";
};
let navHistory = [];
let draggedFile = null;

window.fsClipboard = null;
window.selectedFileContext = null;

window.saveFileSystem = function saveFileSystem(key) {
    if (!key) key = window._currentFSKey || 'xp_virtual_drive_v3';
    let targetFs = window.fs || fs;
    fs = targetFs;
    window.fs = targetFs;
    
    try {
        let sys32 = window.resolvePath("C:\\Windows\\System32");
        let win = window.resolvePath("C:\\Windows");
        if (!sys32 || !sys32["win32k.sys"] || !sys32["kernel32.dll"] || !win || !win["explorer.exe"]) {
            if (typeof window.triggerBSOD === 'function' && !window.bsodTriggered) {
                setTimeout(() => window.triggerBSOD(), 500);
            }
        }
    } catch(e) {}
    
    localStorage.setItem(key, JSON.stringify(targetFs));
}

function loadFileSystem() {
    let saved = localStorage.getItem('xp_virtual_drive_v3') || localStorage.getItem('xp_virtual_drive_v2');
    if (saved) {
        // MIGRATION: Fix capitalizations that cause 404s on GitHub Pages
        saved = saved.replace(/Tetris\.png/g, 'tetris.webp');
        saved = saved.replace(/tetris\.png/g, 'tetris.webp');
        saved = saved.replace(/Happy\.png/g, 'happy.png');
        saved = saved.replace(/minesweeper icons\/happy\.png/gi, 'Minesweeper Icons/happy.png');
        saved = saved.replace(/volume alt\.png/gi, 'Volume.png');
        saved = saved.replace(/Volume Alt\.png/gi, 'Volume.png');
        localStorage.setItem('xp_virtual_drive_v3', saved);
        try { 
            fs = JSON.parse(saved); 
            window.fs = fs;
        }
        catch (e) { console.error("Filesystem parse error."); }
    } else {
        window.fs = fs;
    }

    // Auto-migrate: ensure new desktop shortcuts exist for ALL accounts in the current FS
    try {
        let docsDir = fs["C:"].contents["Documents and Settings"].contents;
        for (let user in docsDir) {
            if (docsDir[user].contents && docsDir[user].contents["Desktop"]) {
                let desk = docsDir[user].contents["Desktop"].contents;
                let defaults = {
                    "Command Prompt.lnk": { type: "exe", app: "cmd-window", icon: "cmd" },
                    "Internet Explorer.lnk": { type: "exe", app: "ie-window", icon: "ie" },
                    "Outlook Express.lnk": { type: "exe", app: "email-window", icon: "outlook" },
                    "System Information.lnk": { type: "exe", app: "sysinfo-window", icon: "sysinfo" },
                    "WordPad.lnk": { type: "exe", app: "wordpad-window", icon: "wordpad" },
                    "Task Manager.lnk": { type: "exe", app: "taskmgr-window", icon: "taskmgr" },
                    "Control Panel.lnk": { type: "exe", app: "controlpanel-window", icon: "settings" },                    "Disk Defragmenter.lnk": { type: "exe", app: "defrag-window", icon: "defrag" },
                    "Microsoft FrontPage.lnk": { type: "exe", app: "frontpage-window", icon: "frontpage" },
                    "Clipbook Viewer.lnk": { type: "exe", app: "clipbook-window", icon: "sysinfo" },
                    "Photon.lnk": { type: "exe", app: "photon-window", icon: "image" },
                    "Data Miner.lnk": { type: "exe", app: "main-window", icon: "mouse" }
                };
                
                // Delete removed/deprecated shortcuts
                if (desk["Windows Picture and Fax Viewer.lnk"]) delete desk["Windows Picture and Fax Viewer.lnk"];
                  if (desk["MSN Messenger.lnk"]) delete desk["MSN Messenger.lnk"];
                if (desk["Windows Catalog.lnk"]) delete desk["Windows Catalog.lnk"];

                // Fix pinball icon - safely check Games folder exists
                try {
                    let progFiles = fs["C:"].contents["Program Files"].contents;
                    if (progFiles["Games"] && progFiles["Games"].contents) {
                        let gamesDir = progFiles["Games"].contents;
                        if (gamesDir["3D Pinball for Windows.lnk"]) {
                            gamesDir["3D Pinball for Windows.lnk"].icon = "pinball";
                        }
                    } else {
                        // Add Games folder if missing
                        progFiles["Games"] = {
                            type: "folder", contents: {
                                "3D Pinball for Windows.lnk": { type: "exe", app: "pinball-window", icon: "pinball" },
                                "Minesweeper.lnk": { type: "exe", app: "minesweeper-window", icon: "mine" },
                                "Solitaire.lnk": { type: "exe", app: "solitaire-window", icon: "solitaire" },
                                "Tetris XP.lnk": { type: "exe", app: "tetris-window", icon: "tetris" }
                            }
                        };
                    }
                } catch(ge) { /* ignore */ }

                // Migrate Tetris XP icon if it has the old SVG string
                if (desk["Tetris XP.lnk"] && (desk["Tetris XP.lnk"].icon.includes('<svg') || desk["Tetris XP.lnk"].icon.includes('Setup.png') || desk["Tetris XP.lnk"].icon === 'tetris')) {
                    desk["Tetris XP.lnk"].icon = "Windows XP Icons/tetris.webp";
                }

                // Ensure Outlook Express and FrontPage are properly installed (have folder + exe in Program Files)
                try {
                    let progFiles = fs["C:"].contents["Program Files"].contents;
                    if (!progFiles["Outlook Express"] || !progFiles["Outlook Express"].contents) {
                        progFiles["Outlook Express"] = { type: "folder", contents: { "msimn.exe": { type: "exe", app: "email-window", icon: "outlook" } } };
                    }
                    if (!progFiles["Microsoft FrontPage"] || !progFiles["Microsoft FrontPage"].contents) {
                        progFiles["Microsoft FrontPage"] = { type: "folder", contents: { "frontpg.exe": { type: "exe", app: "frontpage-window", icon: "frontpage" } } };
                    }
                    if (!progFiles["Windows Media Player"] || !progFiles["Windows Media Player"].contents) {
                        progFiles["Windows Media Player"] = { type: "folder", contents: { "wmplayer.exe": { type: "exe", app: "mediaplayer-window", icon: "media" } } };
                    }
                    if (!progFiles["Windows Defender"] || !progFiles["Windows Defender"].contents) {
                        progFiles["Windows Defender"] = { type: "folder", contents: { "MSASCui.exe": { type: "exe", app: "defender-window", icon: "Windows XP Icons/Virus Protection.png" } } };
                    }
                    
                try {
                    let docsDir = fs["C:"].contents["Documents and Settings"].contents;
                    for (let user in docsDir) {
                        if (docsDir[user].contents && docsDir[user].contents["Desktop"]) {
                            let desk = docsDir[user].contents["Desktop"].contents;
                            if (!desk["Windows Defender.lnk"]) {
                                desk["Windows Defender.lnk"] = { type: "exe", app: "defender-window", icon: "Windows XP Icons/Virus Protection.png" };
                            }
                        }
                        if (docsDir[user].contents && docsDir[user].contents["Start Menu"] && docsDir[user].contents["Start Menu"].contents["Programs"]) {
                            let progs = docsDir[user].contents["Start Menu"].contents["Programs"].contents;
                            if (!progs["Windows Defender.lnk"]) {
                                progs["Windows Defender.lnk"] = { type: "exe", app: "defender-window", icon: "Windows XP Icons/Virus Protection.png" };
                            }
                        }
                    }
                } catch(e) {}
                } catch(pe) { /* ignore */ }

                // Auto-migrate System folders (Fonts, system32, Web/Wallpaper, Media)
                try {
                    let winKey = Object.keys(fs["C:"].contents).find(k => k.toLowerCase() === 'windows');
                    if (!winKey) {
                        winKey = "WINDOWS";
                        fs["C:"].contents[winKey] = { type: "folder", contents: {} };
                    }
                    let winDir = fs["C:"].contents[winKey];
                    if (!winDir.contents) winDir.contents = {};

                    // Fonts
                    if (!winDir.contents["Fonts"]) {
                        winDir.contents["Fonts"] = { type: "folder", icon: "fonts", contents: {} };
                    } else {
                        winDir.contents["Fonts"].icon = "fonts";
                    }
                    let fontsDir = winDir.contents["Fonts"].contents;
                    if (window.XP_SYSTEM_FONTS) {
                        for (let fn in window.XP_SYSTEM_FONTS) {
                            if (!fontsDir[fn] || !fontsDir[fn].family) {
                                fontsDir[fn] = Object.assign({}, window.XP_SYSTEM_FONTS[fn]);
                            }
                        }
                    }

                    // Critical ini files (win.ini, system.ini)
                    if (!winDir.contents["win.ini"]) {
                        winDir.contents["win.ini"] = {
                            type: "file", extension: "ini", icon: "txt",
                            content: "; for 16-bit app support\n[fonts]\nSystemFont=Tahoma\n\n[Desktop]\nWallpaper=Bliss.bmp\nTileWallpaper=0\nWallpaperStyle=2\n"
                        };
                    }
                    if (!winDir.contents["system.ini"]) {
                        winDir.contents["system.ini"] = {
                            type: "file", extension: "ini", icon: "txt",
                            content: "; for 16-bit app support\n[drivers]\nwave=mmdrv.dll\ntimer=timer.drv\n\n[boot]\nfonts.fon=vgasys.fon\n386grabber=vga.3gr\noemfonts.fon=vgaoem.fon\nfixedfon.fon=vgafix.fon\n"
                        };
                    }

                    // system32 executables
                    let sys32Key = Object.keys(winDir.contents).find(k => k.toLowerCase() === 'system32');
                    if (!sys32Key) {
                        sys32Key = "system32";
                        winDir.contents[sys32Key] = { type: "folder", contents: {} };
                    }
                    let sys32Dir = winDir.contents[sys32Key].contents;
                    let sysExes = {
                        "kernel32.dll": { type: "file", extension: "dll", content: "MZ...", icon: "exe" },
                        "user32.dll": { type: "file", extension: "dll", content: "MZ...", icon: "exe" },
                        "gdi32.dll": { type: "file", extension: "dll", content: "MZ...", icon: "exe" },
                        "shell32.dll": { type: "file", extension: "dll", content: "MZ...", icon: "exe" },
                        "win32k.sys": { type: "file", extension: "sys", content: "...", icon: "exe" },
                        "notepad.exe": { type: "exe", app: "notepad-window", icon: "txt" },
                        "calc.exe": { type: "exe", app: "calc-window", icon: "calc" },
                        "mspaint.exe": { type: "exe", app: "paint-window", icon: "paint" },
                        "cmd.exe": { type: "exe", app: "cmd-window", icon: "cmd" },
                        "taskmgr.exe": { type: "exe", app: "taskmgr-window", icon: "taskmgr" },
                        "regedit.exe": { type: "exe", app: "regedit-window", icon: "regedit" },
                        "sndrec32.exe": { type: "exe", app: "soundrecorder-window", icon: "soundrecorder" },
                        "explorer.exe": { type: "exe", app: "folder-window", icon: "computer" },
                        "cleanmgr.exe": { type: "exe", app: "settings-window", icon: "settings" },
                        "sol.exe": { type: "exe", app: "solitaire-window", icon: "solitaire" },
                        "winmine.exe": { type: "exe", app: "minesweeper-window", icon: "mine" },
                        "pinball.exe": { type: "exe", app: "pinball-window", icon: "pinball" },
                        "dfrg.msc": { type: "exe", app: "defrag-window", icon: "defrag" },
                        "charmap.exe": { type: "exe", app: "charmap-window", icon: "charmap" },
                        "clipbrd.exe": { type: "exe", app: "clipbook-window", icon: "clipbrd" },
                        "msinfo32.exe": { type: "exe", app: "sysinfo-window", icon: "sysinfo" },
                        "mstsc.exe": { type: "exe", app: "mstsc-window", icon: "remotedesktop" },
                        "photon.exe": { type: "exe", app: "photon-window", icon: "photon" },
                        "control.exe": { type: "exe", app: "control-window", icon: "settings" },
                        "printers.exe": { type: "exe", app: "printers-window", icon: "printers" },
                        "mshearts.exe": { type: "exe", app: "hearts-window", icon: "hearts" },
                        "freecell.exe": { type: "exe", app: "freecell-window", icon: "freecell" }
                    };
                    for (let se in sysExes) {
                        if (!sys32Dir[se]) sys32Dir[se] = sysExes[se];
                    }

                    // Help & Tours
                    if (!winDir.contents["Help"]) {
                        winDir.contents["Help"] = { type: "folder", icon: "folder", contents: {} };
                    }
                    if (!winDir.contents["Help"].contents["Tours"]) {
                        winDir.contents["Help"].contents["Tours"] = { type: "folder", icon: "folder", contents: {} };
                    }
                    if (!winDir.contents["Help"].contents["Tours"].contents["htmlTour"]) {
                        winDir.contents["Help"].contents["Tours"].contents["htmlTour"] = { type: "folder", icon: "folder", contents: {} };
                    }
                    if (!winDir.contents["Help"].contents["Tours"].contents["htmlTour"].contents["tour.exe"]) {
                        winDir.contents["Help"].contents["Tours"].contents["htmlTour"].contents["tour.exe"] = { type: "exe", app: "xptour-window", icon: "tourxp" };
                    }

                    // Web & Wallpaper
                    if (!winDir.contents["Web"] || !winDir.contents["Web"].contents) {
                        winDir.contents["Web"] = { type: "folder", icon: "folder", contents: {} };
                    }
                    if (!winDir.contents["Web"].contents["Wallpaper"] || !winDir.contents["Web"].contents["Wallpaper"].contents) {
                        winDir.contents["Web"].contents["Wallpaper"] = { type: "folder", icon: "folder", contents: {} };
                    }
                    let wallDir = winDir.contents["Web"].contents["Wallpaper"].contents;
                    if (window.XP_WALLPAPERS) {
                        for (let wn in window.XP_WALLPAPERS) {
                            let wpData = window.XP_WALLPAPERS[wn];
                            if (!wallDir[wn] || (wn !== 'Bliss.bmp' && (wallDir[wn].content === 'Windows XP Icons/bliss_bg.png' || (typeof wallDir[wn].content === 'string' && (wallDir[wn].content.startsWith('data:image/svg') || !wallDir[wn].content.startsWith('wallpapers/')))))) {
                                wallDir[wn] = {
                                    type: "file",
                                    extension: wpData.ext,
                                    content: wpData.content,
                                    icon: wpData.icon || "jpg"
                                };
                            }
                        }
                    }

                    // Media (Sounds)
                    if (!winDir.contents["Media"] || !winDir.contents["Media"].contents) {
                        winDir.contents["Media"] = { type: "folder", icon: "folder", contents: {} };
                    }
                    let mediaDir = winDir.contents["Media"].contents;
                    let sounds = [
                        "Windows XP Startup.wav", "Windows XP Shutdown.wav", "Windows XP Logon Sound.wav", "Windows XP Logoff Sound.wav",
                        "Windows XP Error.wav", "Windows XP Critical Stop.wav", "Windows XP Exclamation.wav", "Windows XP Ding.wav",
                        "Windows XP Notify.wav", "Windows XP Balloon.wav", "Windows XP Recycle.wav", "Windows XP Minimize.wav",
                        "Windows XP Restore.wav", "Windows XP Menu Command.wav", "Windows XP Print complete.wav", "Windows XP Hardware Insert.wav",
                        "Windows XP Hardware Remove.wav", "Windows XP Hardware Fail.wav", "Windows XP Pop-up Blocked.wav", "Windows XP Battery Low.wav",
                        "Windows XP Battery Critical.wav", "Windows Navigation Start.wav", "Windows Information Bar.wav", "Windows Feed Discovered.wav",
                        "chimes.wav", "chord.wav", "ding.wav", "notify.wav", "recycle.wav", "ringin.wav", "ringout.wav", "start.wav", "tada.wav"
                    ];
                    sounds.forEach(s => {
                        if (!mediaDir[s]) {
                            mediaDir[s] = { type: "file", extension: "wav", content: "XP sounds/" + s, icon: "wav" };
                        }
                    });
                } catch(fe) { /* ignore */ }

                if (Object.keys(desk).length === 0) {
                    for (let key in defaults) {
                        desk[key] = defaults[key];
                    }
                } else {
                    for (let key in defaults) {
                        if (desk[key]) {
                            desk[key].app = defaults[key].app;
                            desk[key].icon = defaults[key].icon;
                        }
                    }
                }
                if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
            }
        }
    } catch (e) { console.warn('FS migrate error:', e); }
}

function bindSysIcons() {
    document.querySelectorAll('.sys-icon-tetris').forEach(el => {
        el.innerHTML = '<img src="Windows XP Icons/tetris.webp" style="width:16px;height:16px;">';
    });
}

window.resolvePath = function (path) {
    if (!path) return null;
    let parts = path.split('\\').filter(p => p !== '');
    let curr = window.fs || fs;
    for (let p of parts) {
        if (!curr || typeof curr !== 'object') return null;
        let actualKey = curr[p] !== undefined ? p : Object.keys(curr).find(k => k.toLowerCase() === p.toLowerCase());
        if (actualKey && curr[actualKey]) {
            let node = curr[actualKey];
            if (node.extension === 'zip' && node._zippedData) {
                let temp = {};
                temp[node._zippedName] = node._zippedData;
                curr = temp;
            } else if (typeof node.content === 'object' && node.extension === 'zip') {
                curr = node.content;
            } else if (typeof node.content === 'string' && node.extension === 'zip') {
                try { curr = JSON.parse(node.content); } catch(e) { curr = {}; }
            } else {
                curr = node.contents !== undefined ? node.contents : node;
            }
        } else {
            return null;
        }
    }
    return curr;
};

window.triggerSearch = function () {
    if (typeof window.xpDialog === 'function') {
        window.xpDialog('Search', 'Enter filename to search for:', 'prompt').then(query => {
            if (!query) return;
            query = query.toLowerCase();
            let results = [];

            function recurse(dir, pathStr) {
                if (!dir) return; // skip if undefined
                for (let key in dir) {
                    if (key.toLowerCase().includes(query)) results.push(pathStr + "\\" + key);
                    if (dir[key].type === 'folder' && dir[key].contents) {
                        recurse(dir[key].contents, pathStr + "\\" + key);
                    }
                }
            }
            let root = window.resolvePath("C:\\");
            if (root) recurse(root, "C:");

            if (results.length > 0) {
                if (typeof window.showSearchResults === 'function') {
                    window.showSearchResults(query, results);
                } else {
                    window.xpDialog("Search Results", "Matches found:\n" + results.join("\n"), "info");
                }
            } else {
                window.xpDialog("Search Results", "No files found matching '" + query + "'.", "error");
            }
        });
    }
};

window.populateOpenWith = function(filename, item, path) {
    let openWithItem = document.getElementById('menu-item-open-with');
    let submenu = document.getElementById('submenu-open-with');
    if (!openWithItem || !submenu) return;
    
    if (item.type === 'folder' || !filename.includes('.')) {
        openWithItem.style.display = 'none';
        return;
    }
    
    let ext = filename.split('.').pop().toLowerCase();
    let apps = [];
    
    if (ext === 'txt' || ext === 'ini' || ext === 'log' || ext === 'js' || ext === 'css') {
        apps.push({ name: 'Notepad', icon: sysIcons.notepad, fn: () => { if(window.openNotepadFile) window.openNotepadFile(filename, item.content, path); } });
        apps.push({ name: 'WordPad', icon: sysIcons.wordpad, fn: () => { if(window.openWordpadFile) window.openWordpadFile(filename, item.content, path); } });
    }
    if (ext === 'html' || ext === 'htm') {
        if(window.isAppInstalled("Microsoft FrontPage")) apps.push({ name: 'Microsoft FrontPage', icon: sysIcons.frontpage, fn: () => { if(window.openFrontpageFile) window.openFrontpageFile(filename, item.content, path); } });
        apps.push({ name: 'Internet Explorer', icon: sysIcons.ie, fn: () => { if(window.openIEFile) window.openIEFile(filename, item.content, path); } });
        apps.push({ name: 'Notepad', icon: sysIcons.notepad, fn: () => { if(window.openNotepadFile) window.openNotepadFile(filename, item.content, path); } });
    }
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'bmp' || ext === 'webp') {
        if(window.isAppInstalled("Photon Picture Viewer")) apps.push({ name: 'Photon', icon: sysIcons.image, fn: () => { if(window.openPhotonImage) window.openPhotonImage(filename, item.content, path); } });
        apps.push({ name: 'Windows Picture and Fax Viewer', icon: 'Windows XP Icons/Windows Picture and Fax Viewer.png', fn: () => { if(window.openPhotonImage) window.openPhotonImage(filename, item.content, path); } });
        apps.push({ name: 'Paint', icon: 'Windows XP Icons/Paint.png', fn: () => { 
            if(window.initPaint) {
                window.initPaint(item, path);
                let title = document.querySelector('#paint-window .title-bar span');
                if (title) title.innerHTML = '<img src="Windows XP Icons/Paint.png" class="sys-icon-small"> ' + filename + ' - Paint';
                if(typeof window.paintCurrentFile !== 'undefined') window.paintCurrentFile = filename;
                if(typeof window.paintCurrentPath !== 'undefined') window.paintCurrentPath = path;
            }
        }});
    }
    if (ext === 'wav' || ext === 'mp3') {
        apps.push({ name: 'Windows Media Player', icon: sysIcons.media, fn: () => { if(window.openMediaPlayerFile) window.openMediaPlayerFile(filename, item.content, path); } });
        apps.push({ name: 'Sound Recorder', icon: sysIcons.sound, fn: () => { if(window.openSoundRecorderFile) window.openSoundRecorderFile(filename, item.content, path); } });
    }
    if (ext === 'xls' || ext === 'csv') {
        apps.push({ name: 'Microsoft Excel', icon: sysIcons.excel, fn: () => { if(window.openExcelFile) window.openExcelFile(filename, item.content, path); } });
        apps.push({ name: 'Notepad', icon: sysIcons.notepad, fn: () => { if(window.openNotepadFile) window.openNotepadFile(filename, item.content, path); } });
    }

    if (apps.length > 0) {
        openWithItem.style.display = 'block';
        submenu.innerHTML = '';
        apps.forEach(app => {
            let div = document.createElement('div');
            div.className = 'context-item';
            div.innerHTML = `<img src="${app.icon}" style="width:16px; height:16px; margin-right:5px; vertical-align:middle;"> ${app.name}`;
            div.onclick = () => {
                document.getElementById('context-menu-file').style.display = 'none';
                app.fn();
            };
            submenu.appendChild(div);
        });
    } else {
        openWithItem.style.display = 'none';
    }
};
window.renderDesktop = function () {
    let desktopDiv = document.getElementById('desktop');
    if (!desktopDiv) return;
    desktopDiv.innerHTML = '';
    let deskPath = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop";
    let desktopContents = window.resolvePath(deskPath);

    if (desktopContents) {
        let index = 0;
        let lastClickTime = 0;
        let lastClickId = null;
        
        let keys = Object.keys(desktopContents);
        keys.sort((a, b) => {
            let itemA = desktopContents[a];
            let itemB = desktopContents[b];
            let typeWeight = { 'shortcut': 1, 'folder': 2, 'exe': 3, 'file': 4 };
            let specialPriority = {
                'My Documents.lnk': -10,
                'My Computer.lnk': -9,
                'My Network Places.lnk': -8.5,
                'Recycle Bin.lnk': -8,
                'Internet Explorer.lnk': -7
            };
            let wA = specialPriority[a] !== undefined ? specialPriority[a] : (typeWeight[itemA.type] || 5);
            let wB = specialPriority[b] !== undefined ? specialPriority[b] : (typeWeight[itemB.type] || 5);
            if (wA !== wB) return wA - wB;
            
            // Apply current sort from OS (if defined), otherwise don't force ABC sort
            if (typeof window.currentSort !== 'undefined' && window.currentSort === 'name') {
                return a.localeCompare(b);
            }
            return 0;
        });
        for (let key of keys) {
            let item = desktopContents[key];
            if (item.hidden && (window.getRegistryValue('HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'Hidden') !== 1)) continue;
            if (window.showOnlyFavorites && !item.favorited) continue;
            let div = document.createElement('div');
            div.className = 'desktop-icon';
            div.id = 'desktop-' + index;
            div.setAttribute('data-name', key);
            div.setAttribute('data-path', deskPath);
            div.draggable = true;
            let hideExtExp = window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "HideFileExt");
            let displayNameExp = key;
            if (hideExtExp === 1 && item.type === 'file' && key.includes('.')) {
                displayNameExp = key.substring(0, key.lastIndexOf('.'));
            }
            if (item.type === 'shortcut' || key.endsWith('.lnk')) {
                displayNameExp = key.replace(/\.lnk$/i, '');
            }
            if (key === 'My Computer.lnk' || key === 'My Computer') {
                let alias = window.getRegistryValue && window.getRegistryValue("HKEY_CLASSES_ROOT\\CLSID\\{20D04FE0-3AEA-1069-A2D8-08002B30309D}", "(Default)");
                if (alias) displayNameExp = alias;
            } else if (key === 'My Documents.lnk' || key === 'My Documents') {
                let alias = window.getRegistryValue && window.getRegistryValue("HKEY_CLASSES_ROOT\\CLSID\\{450D8FBA-AD25-11D0-98E8-0050C5877549}", "(Default)");
                if (alias) displayNameExp = alias;
            } else if (key === 'Recycle Bin.lnk' || key === 'Recycle Bin') {
                let alias = window.getRegistryValue && window.getRegistryValue("HKEY_CLASSES_ROOT\\CLSID\\{645FF040-5081-101B-9F08-00AA002F954E}", "(Default)");
                if (alias) displayNameExp = alias;
            }
            div.ondragstart = (e) => {
                draggedFile = { name: key, path: deskPath, source: "desktop" };
                e.dataTransfer.setData("text", div.id);
            };

            // Tooltip events
            let displayName = displayNameExp || key.replace('.lnk', '');
            div.onmouseenter = (e) => {
                if (typeof window.showDesktopTooltip === 'function') window.showDesktopTooltip(e, displayName);
            };
            div.onmouseleave = () => {
                if (typeof window.hideDesktopTooltip === 'function') window.hideDesktopTooltip();
            };

            // Right-click context for individual files
            div.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!div.classList.contains('selected')) {
                    window.xpClearSelection('desktop');
                    div.classList.add('selected');
                }
                window.selectedFileContext = { name: key, path: deskPath };
                window.contextMenuTarget = 'desktop';
                let menu = document.getElementById('context-menu-file');
                if (menu) {
                    window.populateOpenWith(key, item, deskPath);
                    menu.style.display = 'flex'; menu.style.left = e.pageX + 'px'; menu.style.top = e.pageY + 'px';
                    document.getElementById('menu-item-restore').style.display = 'none';
                    document.getElementById('menu-item-extract').style.display = 'none';
                    let isImg = /\.(jpg|jpeg|png|bmp|gif|webp)$/i.test(key) || (item && item.type === 'file' && ['jpg','jpeg','png','bmp','gif','webp'].includes(item.extension));
                    let setWpItem = document.getElementById('menu-item-set-wallpaper');
                    if (setWpItem) setWpItem.style.display = isImg ? 'block' : 'none';
                    let canPin = item.app || (item.type === 'shortcut' && item.target && window.resolvePath(item.target) && window.resolvePath(item.target).app);
                    document.getElementById('menu-item-pin').style.display = canPin ? 'block' : 'none';
                    document.getElementById('menu-item-unpin').style.display = 'none';
                    document.getElementById('menu-item-open-location').style.display = (item.type === 'shortcut' && item.target) ? 'block' : 'none';
                }
            };

            div.onmousedown = (e) => {
                e.stopPropagation();
                let wasSelected = div.classList.contains('selected');
                let parentDiv = document.getElementById('desktop');
                
                if (e.ctrlKey) {
                    div.classList.toggle('selected');
                    window.lastSelectedDesktopDiv = div;
                } else if (e.shiftKey && window.lastSelectedDesktopDiv) {
                    e.preventDefault();
                    let children = Array.from(parentDiv.querySelectorAll('.desktop-icon'));
                    let start = children.indexOf(window.lastSelectedDesktopDiv);
                    let end = children.indexOf(div);
                    if (start !== -1 && end !== -1) {
                        window.xpClearSelection('desktop');
                        let min = Math.min(start, end);
                        let max = Math.max(start, end);
                        for(let i=min; i<=max; i++) children[i].classList.add('selected');
                    }
                } else if (!wasSelected) {
                    window.xpClearSelection('desktop');
                    div.classList.add('selected');
                    window.lastSelectedDesktopDiv = div;
                }
                
                window.draggedFiles = [];
                document.querySelectorAll('.desktop-icon.selected, .file-icon.selected').forEach(el => {
                    let p = el.getAttribute('data-path');
                    let n = el.getAttribute('data-name');
                    if (p && n) window.draggedFiles.push({path: p, name: n, source: "desktop"});
                });
                
                if (window.draggedFiles.length > 0) {
                    window.selectedFileContext = window.draggedFiles[0];
                } else {
                    window.selectedFileContext = { name: key, path: deskPath };
                    div.classList.add('selected');
                    window.draggedFiles = [{name: key, path: deskPath, source: "desktop"}];
                }

                let now = Date.now();
                if (lastClickId === key && (now - lastClickTime) > 600 && (now - lastClickTime) < 1500) {
                    window.triggerRename(div, key, deskPath);
                    lastClickTime = 0;
                } else {
                    lastClickTime = now;
                    lastClickId = key;
                }

                if (typeof window.dragIconAbsolute === 'function') {
                    window.dragIconAbsolute(e, div);
                }
            };

            if (window.singleClickToOpen) {
                div.onclick = (e) => executeFile(key, item, deskPath);
            } else {
                div.ondblclick = () => executeFile(key, item, deskPath);
            }

            if (item.x !== undefined && item.y !== undefined) {
                if (typeof window.gridAlign !== 'undefined' && window.gridAlign) {
                    let gridStep = typeof window.getGridStep === 'function' ? window.getGridStep() : 85;
                    div.style.left = Math.max(10, Math.round((item.x - 10) / gridStep) * gridStep + 10) + "px";
                    div.style.top = Math.max(10, Math.round((item.y - 10) / gridStep) * gridStep + 10) + "px";
                } else {
                    div.style.left = item.x + "px";
                    div.style.top = item.y + "px";
                }
            } else {
                let gridStep = typeof window.getGridStep === 'function' ? window.getGridStep() : 85;
                let occ = new Set();
                for (let k of keys) {
                    let itm = desktopContents[k];
                    if (itm.x !== undefined && itm.y !== undefined) {
                        let r = Math.round((itm.y - 10) / gridStep);
                        let c = Math.round((itm.x - 10) / gridStep);
                        occ.add(r + ',' + c);
                    }
                }
                let r = 0, c = 0;
                while (occ.has(r + ',' + c)) {
                    r++;
                    if (r >= 6) { r = 0; c++; }
                }
                div.style.top = (10 + r * gridStep) + "px";
                div.style.left = (10 + c * gridStep) + "px";
                item.x = 10 + c * gridStep;
                item.y = 10 + r * gridStep;
                window.saveFileSystem();
            }

            let iconType = item.type === 'folder' ? 'folder' : (item.icon || 'txt');
            let iconSrc = sysIcons[iconType] || (iconType && (iconType.includes('/') || iconType.includes('\\')) ? iconType : sysIcons.txt);
            if (key === 'Recycle Bin.lnk') {
                let binObj = window.resolvePath("C:\\RECYCLER") || {};
                iconSrc = Object.keys(binObj).length > 0 ? sysIcons.recycle_full : sysIcons.recycle_empty;
                div.ondrop = window.dropRecycle;
                div.ondragover = window.allowDrop;
            } else if (item.type === 'folder' || (item.type === 'shortcut' && window.resolvePath(item.target) && window.resolvePath(item.target).type === 'folder')) {
                div.ondrop = function(ev) {
                    let targetPath = item.type === 'shortcut' ? item.target : deskPath + (deskPath.endsWith('\\') ? '' : '\\') + key;
                    window.dropIntoFolderIcon(ev, targetPath);
                };
                div.ondragover = window.allowDrop;
            }

            let innerImgHTML = `<img src="${iconSrc}" onerror="this.src='Windows XP Icons/Generic Document.png'">`;
            if (item.isUserShortcut || key.includes(' - Shortcut.lnk')) {
                innerImgHTML = `<div style="position:relative; width:32px; height:32px; margin-bottom:5px;">
                    <img src="${iconSrc}" onerror="this.src='Windows XP Icons/Generic Document.png'" style="width:100%; height:100%; margin:0;">
                    <img src="Windows XP Icons/Shortcut overlay.png" style="position:absolute; bottom:-8px; left:-8px; width:28px; height:28px; margin:0; pointer-events:none; image-rendering:pixelated;">
                </div>`;
            } else {
                innerImgHTML = `<img src="${iconSrc}" onerror="this.src='Windows XP Icons/Generic Document.png'" style="margin-bottom:5px;">`;
            }
            div.innerHTML = `${innerImgHTML}<span>${displayNameExp}</span>`;
            desktopDiv.appendChild(div);
            index++;
        }
    }
    
    if (typeof window.arrangeIcons === 'function') {
        if (typeof window.autoArrange !== 'undefined' && window.autoArrange) {
            window.arrangeIcons(typeof window.currentSort !== 'undefined' ? window.currentSort : 'type');
        }
    }
}

window.renderExplorer = function (path) {
    let emptyDiv1 = document.getElementById('empty-recycle-menu-divider');
    let emptyDiv2 = document.getElementById('empty-recycle-menu-item');
    if (emptyDiv1 && emptyDiv2) {
        if (path === "C:\\RECYCLER") {
            emptyDiv1.style.display = 'block';
            emptyDiv2.style.display = 'block';
        } else {
            emptyDiv1.style.display = 'none';
            emptyDiv2.style.display = 'none';
        }
    }
    window.currentPath = path;
    let addressBar = document.getElementById('explorer-address-bar');
    let titleText = document.getElementById('explorer-title-text');
    if (addressBar) addressBar.value = path;
    if (titleText) titleText.innerText = path;

    let contentDiv = document.getElementById('explorer-content');
    if (!contentDiv) return;

    contentDiv.innerHTML = '';
    let folderContents = window.resolvePath(path);

    if (folderContents) {
        for (let key in folderContents) {
            let item = folderContents[key];
            if (item.hidden && (window.getRegistryValue('HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'Hidden') !== 1)) continue;
            let div = document.createElement('div');
            div.className = 'file-icon';
            div.setAttribute('data-name', key);
            div.setAttribute('data-path', window.currentPath);
            div.id = 'explorer-icon-' + key.replace(/[^a-zA-Z0-9]/g, '');
            div.draggable = true;
            if (item.hidden) div.style.opacity = '0.5';

            let hideExtExp2 = window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "HideFileExt");
            let displayNameExp2 = key;
            if (hideExtExp2 === 1 && item.type === 'file' && key.includes('.')) {
                let isShortcut = key.toLowerCase().endsWith('.lnk');
                let isUrl = key.toLowerCase().endsWith('.url');
                if(!isShortcut && !isUrl) {
                    displayNameExp2 = key.substring(0, key.lastIndexOf('.'));
                }
            }
            if (item.type === 'file' && (key.toLowerCase().endsWith('.lnk') || key.toLowerCase().endsWith('.url'))) {
                displayNameExp2 = key.substring(0, key.lastIndexOf('.'));
            }
            div.innerHTML = `<img src="${window.getIconForExtension(key, item)}" alt="icon" style="image-rendering:pixelated;"><br><span>${displayNameExp2}</span>`;

            if (item.type === 'folder' || (item.type === 'shortcut' && window.resolvePath(item.target) && window.resolvePath(item.target).type === 'folder')) {
                div.ondrop = function(ev) {
                    let targetPath = item.type === 'shortcut' ? item.target : window.currentPath + (window.currentPath.endsWith('\\') ? '' : '\\') + key;
                    window.dropIntoFolderIcon(ev, targetPath);
                };
                div.ondragover = window.allowDrop;
            }

            div.ondragstart = (e) => {
                window.draggedFiles = [];
                document.querySelectorAll('#folder-window .file-icon.selected').forEach(el => {
                    let p = el.getAttribute('data-path');
                    let n = el.getAttribute('data-name');
                    if (p && n) window.draggedFiles.push({path: p, name: n, source: "folder"});
                });
                
                if (window.draggedFiles.length === 0 || !window.draggedFiles.some(f => f.name === key)) {
                    window.draggedFiles = [{name: key, path: window.currentPath, source: "folder"}];
                }
                
                draggedFile = window.draggedFiles[0];
                e.dataTransfer.setData("text", div.id);
            };

            div.onmousedown = (e) => {
                e.stopPropagation();
                let wasSelected = div.classList.contains('selected');
                let parentDiv = document.getElementById('explorer-content');
                
                if (e.ctrlKey) {
                    div.classList.toggle('selected');
                    window.lastSelectedExplorerDiv = div;
                } else if (e.shiftKey && window.lastSelectedExplorerDiv) {
                    e.preventDefault();
                    let children = Array.from(parentDiv.querySelectorAll('.file-icon'));
                    let start = children.indexOf(window.lastSelectedExplorerDiv);
                    let end = children.indexOf(div);
                    if (start !== -1 && end !== -1) {
                        window.xpClearSelection('folder');
                        let min = Math.min(start, end);
                        let max = Math.max(start, end);
                        for(let i=min; i<=max; i++) children[i].classList.add('selected');
                    }
                } else if (!wasSelected) {
                    window.xpClearSelection('folder');
                    div.classList.add('selected');
                    window.lastSelectedExplorerDiv = div;
                }
                
                window.draggedFiles = [];
                document.querySelectorAll('#explorer-content .file-icon.selected').forEach(el => {
                    let p = el.getAttribute('data-path');
                    let n = el.getAttribute('data-name');
                    if (p && n) window.draggedFiles.push({path: p, name: n, source: "folder"});
                });
                
                if (window.draggedFiles.length > 0) {
                    window.selectedFileContext = window.draggedFiles[0];
                } else {
                    window.selectedFileContext = { name: key, path: window.currentPath };
                    div.classList.add('selected');
                    window.draggedFiles = [{name: key, path: window.currentPath, source: "folder"}];
                }

                let now = Date.now();
                if (lastClickId === key && (now - lastClickTime) > 600 && (now - lastClickTime) < 1500) {
                    window.triggerRename(div, key, window.currentPath);
                    lastClickTime = 0;
                } else {
                    lastClickTime = now;
                    lastClickId = key;
                }
            };
            div.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!div.classList.contains('selected')) {
                    window.xpClearSelection('folder');
                    div.classList.add('selected');
                }
                
                window.draggedFiles = [];
                document.querySelectorAll('#explorer-content .file-icon.selected').forEach(el => {
                    let p = el.getAttribute('data-path');
                    let n = el.getAttribute('data-name');
                    if (p && n) window.draggedFiles.push({path: p, name: n, source: "folder"});
                });
                
                if (window.draggedFiles.length === 0 || !window.draggedFiles.some(f => f.name === key)) {
                    window.draggedFiles = [{name: key, path: window.currentPath, source: "folder"}];
                }
                window.selectedFileContext = { name: key, path: window.currentPath };
                
                if(typeof window.populateOpenWith === 'function') window.populateOpenWith(key, item, window.currentPath);
                if(typeof window.showContextMenu === 'function') window.showContextMenu(e, window.currentPath, key, item);
            };
            if (window.singleClickToOpen) {
                div.onclick = (e) => executeFile(key, item, window.currentPath);
            } else {
                div.ondblclick = () => executeFile(key, item, window.currentPath);
            }

            contentDiv.appendChild(div);
        }
    }
}

window.xpClearSelection = function (area) {
    let selector = area === 'desktop' ? '.desktop-icon' : '.file-icon';
    document.querySelectorAll(selector).forEach(i => i.classList.remove('selected'));
    window.selectedFileContext = null;
}

function executeFile(name, item, currentDir = "") {
    if (!item) return;

    // Check corrupted file
    if (item.corrupted || item.extension === 'corrupt' || (item.content && typeof item.content === 'string' && item.content.startsWith('An error occurred reading '))) {
        if (typeof window.triggerCorruptBSOD === 'function') {
            window.triggerCorruptBSOD(name);
            return;
        } else if (typeof window.triggerBSOD === 'function') {
            window.triggerBSOD("NTFS_FILE_SYSTEM (0x00000024): Corruption in " + name);
            return;
        }
    }

    // Check if in Recycle Bin
    if (currentDir === "C:\\RECYCLER" || (typeof window.isAppInRecycler === 'function' && item.app && window.isAppInRecycler(item.app))) {
        let appTitle = name.replace(/\.lnk$/i, '').replace(/\.exe$/i, '');
        if (typeof window.playSound === 'function') window.playSound('recycle');
        if (typeof window.showBalloon === 'function') {
            window.showBalloon("Recycle Bin", "You must restore " + appTitle + " from the Recycle Bin before opening it.");
        }
        if (typeof window.xpDialog === 'function') {
            window.xpDialog('Recycle Bin', "The item '" + appTitle + "' is in the Recycle Bin.\n\nYou must restore it first before you can open it.", 'info');
        }
        return;
    }

    // Check permanently deleted
    if (item.app && typeof window.isAppInstalled === 'function' && !window.isAppInstalled(item.app)) {
        let appTitle = name.replace(/\.lnk$/i, '').replace(/\.exe$/i, '');
        if (typeof window.playSound === 'function') window.playSound('error');
        if (typeof window.xpDialog === 'function') {
            window.xpDialog(appTitle, `Windows cannot open '${appTitle}'. The application has been permanently deleted or is not installed.`, 'error');
        }
        return;
    }

    if (item.type === 'folder' || (item.type === 'file' && item.extension === 'zip')) {
        let basePath = currentDir || window.currentPath || (window.getDesktopPath ? window.getDesktopPath() : "C:\\");
        let newPath;
        if (basePath === "C:\\" || basePath === "C:") {
            newPath = "C:\\" + name;
        } else {
            newPath = basePath.replace(/\\+$/, "") + "\\" + name;
        }
        if (window.currentPath) navHistory.push(window.currentPath);
        window.renderExplorer(newPath);
        if (typeof window.openProgram === 'function') window.openProgram('folder-window');
        if (typeof window.playSound === 'function') window.playSound('click');
    }
    else if (item.type === 'shortcut' && item.target && item.target.startsWith('C:')) {
        let targetName = item.target.split('\\').filter(p=>p!=='').pop();
        let targetDir = item.target.substring(0, item.target.lastIndexOf('\\'));
        if (targetDir === "C:" || item.target === "C:\\") targetDir = "C:\\";
        
        let actualNode = null;
        if (item.target === "C:\\") {
            actualNode = fs["C:"];
        } else {
            let resolvedParent = window.resolvePath(targetDir);
            actualNode = resolvedParent ? resolvedParent[targetName] : null;
        }

        if (actualNode) {
            if (actualNode.type === 'folder' || actualNode.type === 'drive') {
                navHistory.push(window.currentPath);
                window.renderExplorer(item.target);
                if (typeof window.openProgram === 'function') window.openProgram('folder-window');
                if (typeof window.playSound === 'function') window.playSound('click');
            } else {
                executeFile(targetName, actualNode, targetDir);
            }
        } else {
            if (typeof window.xpDialog === 'function') {
                window.xpDialog("Shortcut Error", "The target of this shortcut does not exist.", "error");
            }
        }
    }
    else if (item.type === 'exe' || (item.type === 'shortcut' && item.app)) {
        let appName = item.app;
        if (typeof window.isAppInRecycler === 'function' && window.isAppInRecycler(appName)) {
            let appTitle = name.replace(/\.lnk$/i, '').replace(/\.exe$/i, '');
            if (typeof window.playSound === 'function') window.playSound('recycle');
            if (typeof window.showBalloon === 'function') {
                window.showBalloon("Recycle Bin", "You must restore " + appTitle + " from the Recycle Bin before opening it.");
            }
            if (typeof window.xpDialog === 'function') {
                window.xpDialog('Recycle Bin', "The item '" + appTitle + "' is in the Recycle Bin.\n\nYou must restore it first before you can open it.", 'info');
            }
            return;
        }
        if (typeof window.isAppInstalled === 'function' && !window.isAppInstalled(appName)) {
            let appTitle = name.replace(/\.lnk$/i, '').replace(/\.exe$/i, '');
            if (typeof window.playSound === 'function') window.playSound('error');
            if (typeof window.xpDialog === 'function') {
                window.xpDialog(appTitle, `Windows cannot open '${appTitle}'. The application has been permanently deleted or is not installed.`, 'error');
            }
            return;
        }
        // Special initialization for certain apps
        if (item.app === 'cmd-window' && typeof window.initCmd === 'function') window.initCmd();
        if (item.app === 'taskmgr-window' && typeof window.openTaskManager === 'function') { window.openTaskManager(); return; }
        if (item.app === 'paint-window' && typeof window.initPaint === 'function') window.initPaint();
        if (item.app === 'solitaire-window' && typeof window.solNewGame === 'function') window.solNewGame();
        if (typeof window.openProgram === 'function') window.openProgram(item.app, name);
    }
    else if (item.type === 'file' && (item.extension === 'html' || item.extension === 'htm')) {
        if (typeof window.isAppInstalled === 'function' && !window.isAppInstalled("Microsoft FrontPage")) {
            if (typeof window.openCatalogApp === 'function') {
                window.openCatalogApp("Microsoft FrontPage");
                return;
            }
        }
        if (typeof window.openFrontpageFile === 'function') {
            window.openFrontpageFile(name, item.content, currentDir);
        } else if (typeof window.openIEFile === 'function') {
            window.openIEFile(name, item.content, currentDir);
        }
    }
    else if (item.type === 'file' && item.extension === 'txt') {
        if (typeof window.isAppInstalled === 'function' && !window.isAppInstalled("Notepad")) {
            if (typeof window.openCatalogApp === 'function') {
                window.openCatalogApp("Notepad");
                return;
            }
        }
        if (typeof window.openNotepadFile === 'function') {
            window.openNotepadFile(name, item.content, currentDir);
        }
    }
    else if (item.type === 'file' && item.extension === 'xls') {
        if (typeof window.isAppInstalled === 'function' && !window.isAppInstalled("Microsoft Excel")) {
            if (typeof window.openCatalogApp === 'function') {
                window.openCatalogApp("Microsoft Excel");
                return;
            }
        }
        if (typeof window.openProgram === 'function') window.openProgram('excel-window', name);
        setTimeout(() => {
            if(typeof window.excelOpenDirect === 'function') window.excelOpenDirect(name, item);
        }, 100);
    }
    else if (item.type === 'file' && item.extension === 'wav') {
        if (typeof window.openMediaPlayer === 'function') window.openMediaPlayer(name, item, currentDir);
    }
    else if (item.type === 'file' && (item.extension === 'jpg' || item.extension === 'png' || item.extension === 'bmp' || item.extension === 'gif' || item.extension === 'webp')) {
        if (typeof window.isAppInstalled === 'function' && !window.isAppInstalled("Photon Picture Viewer")) {
            if (typeof window.openCatalogApp === 'function') {
                window.openCatalogApp("Photon Picture Viewer");
                return;
            }
        }
        if (typeof window.openPhotonImage === 'function') {
            window.openPhotonImage(name, item.content, currentDir);
        }
    }
    else if (item.type === 'file' && (item.extension === 'ttf' || item.extension === 'fon' || item.extension === 'otf' || /\.(ttf|fon|otf)$/i.test(name))) {
        if (typeof window.openFontViewer === 'function') {
            window.openFontViewer(name, item, currentDir);
        }
    }
    else if (item.type === 'file' && (item.extension === 'ini' || item.extension === 'inf' || item.extension === 'log' || item.extension === 'bat' || /\.(ini|inf|log|bat)$/i.test(name))) {
        if (typeof window.openNotepadFile === 'function') {
            window.openNotepadFile(name, item.content, currentDir);
        }
    }
}

window.navigateTo = function (path) {
    if (window.resolvePath(path)) {
        navHistory.push(window.currentPath);
        window.renderExplorer(path);
        if (typeof window.playSound === 'function') window.playSound('click');
    } else {
        if (typeof window.xpDialog === 'function') {
            window.xpDialog("Explorer", "Cannot find '" + path + "'. Check spelling.", "error");
        }
        document.getElementById('explorer-address-bar').value = window.currentPath;
    }
}

window.explorerGoBack = function () {
    if (navHistory.length > 0) {
        let prev = navHistory.pop();
        window.renderExplorer(prev);
        if (typeof window.playSound === 'function') window.playSound('click');
    }
}

window.explorerGoUp = function () {
    if (!window.currentPath) return;
    let parts = window.currentPath.split('\\').filter(p => p !== '');
    if (parts.length > 1) {
        parts.pop();
        let parentPath = parts.join('\\') + (parts.length === 1 ? '\\' : '');
        navHistory.push(window.currentPath);
        window.renderExplorer(parentPath);
        if (typeof window.playSound === 'function') window.playSound('click');
    }
};

window.createNew = async function (type) {
    let context = window.contextMenuTarget === 'desktop' ? (window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop") : (window.currentPath || (window.getDesktopPath ? window.getDesktopPath() : "C:\\"));
    let dir = window.resolvePath(context);
    if (!dir) return;

    if (type === 'folder') {
        let defaultName = "New Folder";
        if (dir[defaultName]) {
            let i = 2;
            while (dir[`New Folder (${i})`]) i++;
            defaultName = `New Folder (${i})`;
        }
        let name = await window.xpDialog("New Folder", "New Folder Name:", "prompt", defaultName);
        if (name) {
            name = name.trim();
            if (name) {
                if (dir[name]) {
                    let base = name;
                    let i = 2;
                    while (dir[`${base} (${i})`]) i++;
                    name = `${base} (${i})`;
                }
                dir[name] = { type: "folder", contents: {} };
                window.saveFileSystem();
            }
        }
    } else if (type === 'txt') {
        let defaultName = "New Text Document.txt";
        if (dir[defaultName]) {
            let i = 2;
            while (dir[`New Text Document (${i}).txt`]) i++;
            defaultName = `New Text Document (${i}).txt`;
        }
        let name = await window.xpDialog("New Document", "New Text Document Name:", "prompt", defaultName);
        if (name) {
            name = name.trim();
            if (name) {
                if (!name.toLowerCase().endsWith('.txt')) name += '.txt';
                if (dir[name]) {
                    let base = name.replace(/\.txt$/i, '');
                    let i = 2;
                    while (dir[`${base} (${i}).txt`]) i++;
                    name = `${base} (${i}).txt`;
                }
                dir[name] = { type: "file", extension: "txt", content: "", icon: "txt" };
                window.saveFileSystem();
            }
        }
    }

    if (context.includes("Desktop") || (window.getDesktopPath && context === window.getDesktopPath())) window.renderDesktop();
    if (context === window.currentPath) window.renderExplorer(context);
};

function getSelectedFilesInfo() {
    let isDesktop = false;
    let menuOpen = (document.getElementById('context-menu-desktop') && document.getElementById('context-menu-desktop').style.display === 'flex') || 
                   (document.getElementById('context-menu-folder') && document.getElementById('context-menu-folder').style.display === 'flex') ||
                   (document.getElementById('context-menu-file') && document.getElementById('context-menu-file').style.display === 'flex');
                   
    if (menuOpen) {
        isDesktop = window.contextMenuTarget === 'desktop';
    } else {
        let activeWinTitle = document.querySelector('.title-bar:not(.inactive)');
        let activeWin = activeWinTitle ? activeWinTitle.closest('.window') : null;
        if (!activeWin || activeWin.style.display === 'none' || activeWin.id !== 'folder-window') {
            isDesktop = true;
        }
    }

    let defaultDesk = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\" + (window.currentAccount || 'Administrator') + "\\Desktop";
    let context = isDesktop ? defaultDesk : (window.currentPath || defaultDesk);
    let selector = isDesktop ? '.desktop-icon.selected' : '#folder-window .file-icon.selected';
    
    let els = document.querySelectorAll(selector);
    let items = [];
    
    if (els.length > 0) {
        els.forEach(el => {
            let name = el.getAttribute('data-name');
            items.push({ name: name, path: context });
        });
    } else if (window.selectedFileContext) {
        items.push({ name: window.selectedFileContext.name, path: window.selectedFileContext.path });
    }
    return items;
}

window.triggerCopy = function () {
    document.querySelectorAll('.desktop-icon, #folder-window .file-icon').forEach(el => {
        if (el.style.opacity === '0.5') el.style.opacity = '1';
    });
    let items = getSelectedFilesInfo();
    if (items.length > 0) {
        window.fsClipboard = { items: [], action: 'copy' };
        items.forEach(item => {
            let dir = window.resolvePath(item.path);
            if (dir && dir[item.name]) {
                window.fsClipboard.items.push({
                    name: item.name,
                    path: item.path,
                    data: JSON.parse(JSON.stringify(dir[item.name]))
                });
            }
        });
        if (typeof window.showBalloon === 'function' && window.fsClipboard.items.length > 0) {
            window.showBalloon("Explorer", "Copied " + window.fsClipboard.items.length + " item(s)");
        }
    }
};

window.triggerCutContextMenu = function () {
    document.querySelectorAll('.desktop-icon, #folder-window .file-icon').forEach(el => {
        if (el.style.opacity === '0.5') el.style.opacity = '1';
    });
    let items = getSelectedFilesInfo();
    if (items.length > 0) {
        window.fsClipboard = { items: [], action: 'cut' };
        items.forEach(item => {
            let dir = window.resolvePath(item.path);
            if (dir && dir[item.name]) {
                window.fsClipboard.items.push({
                    name: item.name,
                    path: item.path,
                    data: JSON.parse(JSON.stringify(dir[item.name]))
                });
                // Make the UI look semi-transparent to indicate cut
                let selector = item.path.includes('Desktop') ? `.desktop-icon[data-name="${item.name}"]` : `#folder-window .file-icon[data-name="${item.name}"]`;
                let el = document.querySelector(selector);
                if (el) el.style.opacity = '0.5';
            }
        });
        if (typeof window.showBalloon === 'function' && window.fsClipboard.items.length > 0) {
            window.showBalloon("Explorer", "Cut " + window.fsClipboard.items.length + " item(s)");
        }
    }
};
window.triggerCut = window.triggerCutContextMenu;

window.triggerPaste = function () {
    if (!window.fsClipboard || !window.fsClipboard.items || window.fsClipboard.items.length === 0) return;
    
    let isDesktop = false;
    let menuOpen = (document.getElementById('context-menu-desktop') && document.getElementById('context-menu-desktop').style.display === 'flex') || 
                   (document.getElementById('context-menu-folder') && document.getElementById('context-menu-folder').style.display === 'flex') ||
                   (document.getElementById('context-menu-file') && document.getElementById('context-menu-file').style.display === 'flex');
                   
    if (menuOpen) {
        isDesktop = window.contextMenuTarget === 'desktop';
    } else {
        let activeWinTitle = document.querySelector('.title-bar:not(.inactive)');
        let activeWin = activeWinTitle ? activeWinTitle.closest('.window') : null;
        if (!activeWin || activeWin.style.display === 'none' || activeWin.id !== 'folder-window') {
            isDesktop = true;
        }
    }

    let defaultDesk = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\" + (window.currentAccount || 'Administrator') + "\\Desktop";
    let targetPath = isDesktop ? defaultDesk : (window.currentPath || defaultDesk);
    let dir = window.resolvePath(targetPath);

    if (dir) {
        for (let item of window.fsClipboard.items) {
            let srcFullPath = item.path + (item.path.endsWith('\\') ? '' : '\\') + item.name;
            if (srcFullPath.toLowerCase() === targetPath.toLowerCase() || targetPath.toLowerCase().startsWith(srcFullPath.toLowerCase() + '\\')) {
                if (typeof window.triggerRSOD === 'function') {
                    window.triggerRSOD(item.name);
                    return;
                }
            }
        }
        window.fsClipboard.items.forEach(item => {
            let newName = item.name;
            let counter = 1;
            // If it's a copy action or we are pasting into the SAME directory, we might need to rename
            if (window.fsClipboard.action === 'copy' || dir[newName]) {
                while (dir[newName]) {
                    let parts = item.name.split('.');
                    if (parts.length > 1) {
                        let ext = parts.pop();
                        newName = parts.join('.') + " - Copy (" + counter + ")." + ext;
                    } else {
                        newName = item.name + " - Copy (" + counter + ")";
                    }
                    counter++;
                }
            }

            dir[newName] = JSON.parse(JSON.stringify(item.data));
            delete dir[newName].x;
            delete dir[newName].y;
            
            // If cut, remove from source directory
            if (window.fsClipboard.action === 'cut') {
                let sourceDir = window.resolvePath(item.path);
                if (sourceDir && sourceDir[item.name]) {
                    delete sourceDir[item.name];
                }
            }
        });

        // If cut, clear clipboard so it can only be pasted once
        if (window.fsClipboard.action === 'cut') {
            window.fsClipboard = null;
        }

        window.saveFileSystem();

        // Re-render everything
        window.renderDesktop();
        if (window.currentPath) window.renderExplorer(window.currentPath);
        
        if (typeof window.showBalloon === 'function') window.showBalloon("Explorer", "Pasted items");
    }
};

// Drag & Drop cross-compatibility
window.dropRecycle = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    let filesToDrop = window.draggedFiles && window.draggedFiles.length > 0 ? window.draggedFiles : (typeof draggedFile !== 'undefined' && draggedFile ? [draggedFile] : []);
    
    let hasChanges = false;
    let pathsToRender = new Set();
    
    filesToDrop.forEach(f => {
        let dir = window.resolvePath(f.path);
        if (dir && dir[f.name]) {
            if (!window.fs["C:"].contents["RECYCLER"]) window.fs["C:"].contents["RECYCLER"] = { type: "folder", contents: {} };

            let itemToMove = JSON.parse(JSON.stringify(dir[f.name]));
            itemToMove._originalPath = f.path;

            window.fs["C:"].contents["RECYCLER"].contents[f.name] = itemToMove;
            if (typeof window.onFileSystemItemDeleted === 'function') {
                window.onFileSystemItemDeleted(f.path, f.name, dir[f.name]);
            }
            delete dir[f.name];
            hasChanges = true;
            pathsToRender.add(f.path);
            if(f.source === 'desktop') pathsToRender.add('desktop');
        }
    });
    
    if (hasChanges) {
        window.saveFileSystem();
        if (pathsToRender.has('desktop')) window.renderDesktop();
        if (pathsToRender.has(window.currentPath)) window.renderExplorer(window.currentPath);
        if (typeof window.playSound === 'function') window.playSound('recycle');
        
        window.draggedFiles = [];
        if(typeof draggedFile !== 'undefined') draggedFile = null;
    }
}

window.dropIntoFolderIcon = function(ev, targetPath) {
    if (ev && ev.preventDefault) ev.preventDefault();
    if (ev && ev.stopPropagation) ev.stopPropagation();
    
    let filesToDrop = window.draggedFiles && window.draggedFiles.length > 0 ? window.draggedFiles : (typeof draggedFile !== 'undefined' && draggedFile ? [draggedFile] : []);
    
    // Immediate check: dropping folder into itself or subfolder triggers RSOD
    for (let f of filesToDrop) {
        let srcFullPath = f.path + (f.path.endsWith('\\') ? '' : '\\') + f.name;
        if (srcFullPath.toLowerCase() === targetPath.toLowerCase() || targetPath.toLowerCase().startsWith(srcFullPath.toLowerCase() + '\\')) {
            if (typeof window.triggerRSOD === 'function') {
                window.triggerRSOD(f.name);
            }
            return;
        }
    }
    
    let hasChanges = false;
    let pathsToRender = new Set();
    
    let parts = targetPath.split('\\').filter(p => p !== '');
    let folderName = parts.pop();
    let parentPath = parts.join('\\') || "C:";
    
    let parentDir = window.resolvePath(parentPath);
    if (!parentDir || !parentDir[folderName] || parentDir[folderName].type !== 'folder') return;
    
    let targetDir = parentDir[folderName];
    if (!targetDir.contents) targetDir.contents = {};
        
    filesToDrop.forEach(f => {
        let sDir = window.resolvePath(f.path);
        if(sDir && sDir[f.name]) {
            targetDir.contents[f.name] = sDir[f.name];
            delete targetDir.contents[f.name].x;
            delete targetDir.contents[f.name].y;
            delete sDir[f.name];
            hasChanges = true;
            pathsToRender.add(f.path);
            if(f.source === 'desktop') pathsToRender.add('desktop');
        }
    });
    
    if (hasChanges) {
        window.saveFileSystem();
        if (pathsToRender.has('desktop')) window.renderDesktop();
        if (pathsToRender.has(window.currentPath)) window.renderExplorer(window.currentPath);
        
        window.draggedFiles = [];
        if(typeof draggedFile !== 'undefined') draggedFile = null;
    }
};

window.restoreFile = function () {
    let ctx = window.selectedFileContext;
    if (!ctx || ctx.path !== "C:\\RECYCLER") return;

    let recycler = window.resolvePath("C:\\RECYCLER");
    let item = recycler[ctx.name];
    if (!item) return;

    let targetPath = item._originalPath || "C:\\Documents and Settings\\Administrator\\Desktop";
    let targetDir = window.resolvePath(targetPath);

    if (targetDir) {
        delete item._originalPath;
        targetDir[ctx.name] = item;
        delete recycler[ctx.name];
        window.saveFileSystem();
        window.renderDesktop();
        window.renderExplorer(window.currentPath);
        if (typeof window.onFileSystemItemRestored === 'function') {
            window.onFileSystemItemRestored(targetPath, ctx.name, item);
        }
        if (typeof window.showBalloon === 'function') window.showBalloon("Recycle Bin", "Restored " + ctx.name);
    }
};

window.zipSelected = function () {
    let ctx = window.selectedFileContext;
    if (!ctx) return;
    let dir = window.resolvePath(ctx.path);
    let item = dir[ctx.name];
    if (!item) return;

    let zipName = ctx.name.split('.')[0] + ".zip";
    dir[zipName] = {
        type: "file",
        extension: "zip",
        icon: "zip",
        _zippedData: JSON.parse(JSON.stringify(item)),
        _zippedName: ctx.name
    };
    window.saveFileSystem();
    window.renderDesktop();
    if (window.currentPath) window.renderExplorer(window.currentPath);
    if (typeof window.showBalloon === 'function') window.showBalloon("Explorer", "Created " + zipName);
};

window.unzipSelected = function () {
    let ctx = window.selectedFileContext;
    if (!ctx) return;
    let dir = window.resolvePath(ctx.path);
    let item = dir[ctx.name];
    if (!item || item.extension !== 'zip' || !item._zippedData) return;

    // Trigger Extraction Animation UI
    if(typeof window.showExtractionDialog === 'function') {
        window.showExtractionDialog(ctx.name, () => {
            let newName = item._zippedName;
            let counter = 1;
            while (dir[newName]) {
                newName = "Extracted_" + counter + "_" + item._zippedName;
                counter++;
            }
            dir[newName] = JSON.parse(JSON.stringify(item._zippedData));
            window.saveFileSystem();
            window.renderDesktop();
            if (window.currentPath) window.renderExplorer(window.currentPath);
            if(window.xpDialog) window.xpDialog('Extraction Complete', 'Files have been extracted successfully.', 'info');
        });
    } else {
        // Fallback if no animation
        let newName = item._zippedName;
        let counter = 1;
        while (dir[newName]) {
            newName = "Extracted_" + counter + "_" + item._zippedName;
            counter++;
        }
        dir[newName] = JSON.parse(JSON.stringify(item._zippedData));
        window.saveFileSystem();
        window.renderDesktop();
        if (window.currentPath) window.renderExplorer(window.currentPath);
    }
};

window.sendToMailRecipient = function() {
    let ctx = window.selectedFileContext;
    let name = ctx ? ctx.name : (window.draggedFiles && window.draggedFiles[0] ? window.draggedFiles[0].name : null);
    if (!name) {
        let sel = document.querySelector('#desktop .desktop-icon.selected span');
        if(sel) name = sel.innerText;
    }
    if (!name) { if(window.xpDialog) window.xpDialog('Send To', 'Please select a file first.', 'error'); return; }
    
    if(typeof window.openEmailCompose === 'function') {
        // Use new opts-based signature with attachment
        let att = { name: name, icon: 'Windows XP Icons/Briefcase.png' };
        window.openEmailCompose({
            subject: 'Emailing: ' + name,
            body: '<br><br>The message is ready to be sent with the following file or link attachments:<br><br>' + name,
            attachments: [att]
        });
    } else {
        if(window.xpDialog) window.xpDialog('Send To', 'No mail client configured.', 'error');
    }
};

window.emptyRecycleBin = function () {
    if (fs["C:"].contents["RECYCLER"] && Object.keys(fs["C:"].contents["RECYCLER"].contents).length > 0) {
        if(typeof window.xpDialog === 'function') {
            window.xpDialog('Confirm File Delete', 'Are you sure you want to permanently delete all of these items?', 'confirm').then(ok => {
                if(ok) {
                    fs["C:"].contents["RECYCLER"].contents = {};
                    window.saveFileSystem();
                    window.renderDesktop();
                    if (window.currentPath === "C:\\RECYCLER") window.renderExplorer(window.currentPath);
                    if (typeof window.playSound === 'function') window.playSound('recycle');
                    if (typeof window.showBalloon === 'function') window.showBalloon("Recycle Bin", "Emptied successfully.");
                }
            });
        }
    }
}

function parseCSVToExcelJSON(csvText) {
    let rows = csvText.split(/\\r?\\n/);
    let excelData = {};
    for (let r = 0; r < Math.min(rows.length, 100); r++) {
        let cols = rows[r].split(',');
        for (let c = 0; c < Math.min(cols.length, 26); c++) {
            let val = cols[c].trim();
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
            }
            let cellId = String.fromCharCode(65 + c) + (r + 1);
            excelData[cellId] = {
                v: val,
                f: { bold: false, italic: false, underline: false, color: 'black' }
            };
        }
    }
    return JSON.stringify(excelData);
}

window.triggerCreateShortcut = function() {
    let ctx = window.selectedFileContext;
    if (!ctx) return;
    
    let dir = window.resolvePath(ctx.path);
    let item = dir ? dir[ctx.name] : null;
    if (!item) return;
    
    let baseName = ctx.name.replace(/\.[^.]+$/, '');
    let shortcutName = baseName + " - Shortcut.lnk";
    
    let counter = 1;
    while (dir[shortcutName]) {
        shortcutName = baseName + ` - Shortcut (${counter}).lnk`;
        counter++;
    }
    
    let fullTarget = ctx.path + (ctx.path.endsWith('\\') ? '' : '\\') + ctx.name;
    
    let shortcutNode = {
        type: "shortcut",
        target: fullTarget,
        icon: item.icon || (item.type === 'folder' ? 'folder' : 'txt')
    };
    
    if (item.app) {
        shortcutNode.app = item.app;
    }
    
    dir[shortcutName] = shortcutNode;
    window.saveFileSystem();
    
    if (ctx.path.includes("Desktop")) window.renderDesktop();
    window.renderExplorer(window.currentPath);
    
    if (typeof window.playSound === 'function') window.playSound('click');
    if (typeof window.showBalloon === 'function') {
        window.showBalloon("Explorer", `Created shortcut for ${ctx.name}`);
    }
};

window.importHostFiles = function(dPath) {
    if (!dPath) {
        dPath = window.getDesktopPath ? window.getDesktopPath() : "C:\\Documents and Settings\\Administrator\\Desktop";
    }
    let input = document.getElementById('hidden-file-input');
    if (input) {
        input.remove();
    }
    input = document.createElement('input');
    input.type = 'file';
    input.id = 'hidden-file-input';
    input.multiple = true;
    input.style.display = 'none';
    input.onchange = function(e) {
        if (e.target.files && e.target.files.length > 0) {
            window.handleHostFilesImport(e.target.files, dPath);
        }
        input.value = "";
    };
    document.body.appendChild(input);
    input.click();
};

window.handleHostFilesImport = function(files, targetPath, x, y) {
    let targetDir = window.resolvePath(targetPath);
    if (!targetDir) {
        console.error("Target path not found: " + targetPath);
        return;
    }
    
    let isDesktop = targetPath.includes("Desktop");
    let filePromises = Array.from(files).map(file => {
        return new Promise((resolve) => {
            let reader = new FileReader();
            let ext = file.name.split('.').pop().toLowerCase();
            
            let textExtensions = ['txt', 'js', 'css', 'html', 'htm', 'xml', 'json', 'ini', 'log', 'csv'];
            let isText = textExtensions.includes(ext);
            
            if (isText) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
            
            reader.onload = function(e) {
                let content = e.target.result;
                let finalContent = content;
                let finalExt = ext;
                let finalName = file.name;
                
                if (ext === 'csv') {
                    finalContent = parseCSVToExcelJSON(content);
                    finalExt = 'xls';
                    if (finalName.toLowerCase().endsWith('.csv')) {
                        finalName = finalName.substring(0, finalName.length - 4) + '.xls';
                    }
                }
                
                let iconType = 'txt';
                if (['txt', 'ini', 'log'].includes(finalExt)) iconType = 'notepad';
                else if (['jpg', 'jpeg', 'png', 'gif'].includes(finalExt)) iconType = 'image';
                else if (finalExt === 'bmp') iconType = 'bmp';
                else if (['wav', 'mp3'].includes(finalExt)) iconType = 'wav';
                else if (['xls', 'xlsx'].includes(finalExt)) iconType = 'excel';
                else if (finalExt === 'zip') iconType = 'zip';
                else if (['html', 'htm'].includes(finalExt)) iconType = 'ie';
                
                let fileNode = {
                    type: "file",
                    extension: finalExt,
                    content: finalContent,
                    icon: iconType,
                    size: file.size
                };
                
                if (isDesktop && x !== undefined && y !== undefined) {
                    fileNode.x = x;
                    fileNode.y = y;
                    x += 20;
                    y += 20;
                }
                
                targetDir[finalName] = fileNode;
                resolve();
            };
            
            reader.onerror = function() {
                console.error("Failed to read file: " + file.name);
                resolve();
            };
        });
    });
    
    Promise.all(filePromises).then(() => {
        window.saveFileSystem();
        if (isDesktop) window.renderDesktop();
        window.renderExplorer(window.currentPath);
        if (typeof window.playSound === 'function') window.playSound('notify');
        if (typeof window.showBalloon === 'function') {
            window.showBalloon("Import Complete", `Successfully imported ${files.length} file(s).`);
        }
    });
};

function getAppIdFromItem(item) {
    if (!item) return null;
    let appVal = item.app;
    if (!appVal && item.type === 'shortcut' && item.target) {
        return null;
    }
    let found = typeof ALL_START_APPS !== 'undefined' ? ALL_START_APPS.find(a => a.app === appVal) : null;
    return found ? found.id : null;
}

window.addEventListener('DOMContentLoaded', () => {
    loadFileSystem();
    bindSysIcons();
    window.renderDesktop();
    window.renderExplorer(window.currentPath);
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        let items = typeof getSelectedFilesInfo === 'function' ? getSelectedFilesInfo() : [];
        if (items.length > 0) {
            items.forEach(file => {
                let dir = window.resolvePath(file.path);
                if (dir && dir[file.name] && typeof window.executeFile === 'function') {
                    executeFile(file.name, dir[file.name], file.path);
                }
            });
        }
    }
});

window.showOnlyFavorites = false;

window.toggleShowOnlyFavorites = function() {
    window.showOnlyFavorites = !window.showOnlyFavorites;
    let menuBtn = document.getElementById('menu-view-favorites');
    if (menuBtn) {
        menuBtn.innerHTML = window.showOnlyFavorites ? 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Show only favorites' : 'Show only favorites';
    }
    if (window.currentPath) window.renderExplorer(window.currentPath);
};

window.addToFavorites = function() {
    let items = typeof getSelectedFilesInfo === 'function' ? getSelectedFilesInfo() : [];
    if (items.length === 0) return;
    
    let favPath = "C:\\Documents and Settings\\" + window.currentAccount + "\\Favorites";
    let favDir = window.resolvePath(favPath);
    if (!favDir) {
        if(typeof window.xpDialog === 'function') window.xpDialog('Error', 'Favorites folder not found.', 'error');
        return;
    }
    
    let addedCount = 0;
    items.forEach(item => {
        let dir = window.resolvePath(item.path);
        if (dir && dir[item.name]) {
            let original = dir[item.name];
            original.favorited = true;
            favDir[item.name] = JSON.parse(JSON.stringify(original));
            addedCount++;
        }
    });
    
    if (typeof window.saveFileSystem === 'function') window.saveFileSystem();
    
    if (window.currentPath) window.renderExplorer(window.currentPath);
    if (window.currentPath === "Desktop") window.renderDesktop();
    
    if(typeof window.xpDialog === 'function') {
        window.xpDialog('Favorites', `Added ${addedCount} item(s) to Favorites folder.`, 'info');
    }
};
window.executeFile = executeFile;


// Marquee Selection Logic
(function() {
    let selectionBox = null;
    let startX = 0, startY = 0;
    let container = null;
    let type = '';

    document.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Only left click
        let desk = document.getElementById('desktop');
        let exp = document.getElementById('explorer-content');
        
        let targetArea = null;
        if (e.target === desk || e.target.id === 'desktop-container') {
            targetArea = desk;
            type = 'desktop';
        } else if (e.target === exp || (exp && exp.contains(e.target) && !e.target.closest('.file-icon'))) {
            targetArea = exp;
            type = 'folder';
        }

        if (targetArea) {
            container = targetArea;
            window.xpClearSelection(type);
            
            startX = e.pageX;
            startY = e.pageY;
            
            selectionBox = document.createElement('div');
            selectionBox.style.position = 'absolute';
            selectionBox.style.border = '1px solid #3399FF';
            selectionBox.style.backgroundColor = 'rgba(51, 153, 255, 0.4)';
            selectionBox.style.zIndex = '9999';
            selectionBox.style.pointerEvents = 'none';
            document.body.appendChild(selectionBox);
            
            updateBox(e.pageX, e.pageY);
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (selectionBox && container) {
            updateBox(e.pageX, e.pageY);
            checkIntersections();
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (selectionBox) {
            selectionBox.remove();
            selectionBox = null;
            container = null;
            
            // Update draggedFiles for desktop
            if (type === 'desktop') {
                window.draggedFiles = [];
                document.querySelectorAll('.desktop-icon.selected').forEach(el => {
                    let p = el.getAttribute('data-path');
                    let n = el.getAttribute('data-name');
                    if (p && n) window.draggedFiles.push({path: p, name: n, source: "desktop"});
                });
                if (window.draggedFiles.length > 0) window.selectedFileContext = window.draggedFiles[0];
            } else if (type === 'folder') {
                let first = document.querySelector('#folder-window .file-icon.selected');
                if (first) window.selectedFileContext = { name: first.getAttribute('data-name'), path: window.currentPath };
            }
        }
    });

    function updateBox(mouseX, mouseY) {
        let x = Math.min(startX, mouseX);
        let y = Math.min(startY, mouseY);
        let w = Math.abs(startX - mouseX);
        let h = Math.abs(startY - mouseY);
        selectionBox.style.left = x + 'px';
        selectionBox.style.top = y + 'px';
        selectionBox.style.width = w + 'px';
        selectionBox.style.height = h + 'px';
    }

    function checkIntersections() {
        let boxRect = selectionBox.getBoundingClientRect();
        let items = container.querySelectorAll(type === 'desktop' ? '.desktop-icon' : '.file-icon');
        
        items.forEach(item => {
            let itemRect = item.getBoundingClientRect();
            if (!(boxRect.right < itemRect.left || 
                  boxRect.left > itemRect.right || 
                  boxRect.bottom < itemRect.top || 
                  boxRect.top > itemRect.bottom)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
})();

window.toggleHiddenFiles = function() {
    let regVal = window.getRegistryValue('HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'Hidden');
    let newVal = regVal === 1 ? 0 : 1;
    window.setRegistryValue('HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'Hidden', 'REG_DWORD', newVal);
    
    let menuBtn1 = document.getElementById('menu-item-hidden-files');
    let menuBtn2 = document.getElementById('context-item-hidden-files');
    
    if(menuBtn1) menuBtn1.innerHTML = (newVal === 1 ? 'âœ“ ' : '') + 'Show Hidden Files';
    if(menuBtn2) menuBtn2.innerHTML = (newVal === 1 ? 'âœ“ ' : '') + 'Show Hidden Files';
    
    if(typeof window.renderDesktop === 'function') window.renderDesktop();
    if(window.currentPath && typeof window.renderExplorer === 'function') window.renderExplorer(window.currentPath);
};


setTimeout(() => {
    let regVal = window.getRegistryValue('HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'Hidden');
    let menuBtn1 = document.getElementById('menu-item-hidden-files');
    let menuBtn2 = document.getElementById('context-item-hidden-files');
    if(menuBtn1) menuBtn1.innerHTML = (regVal === 1 ? 'âœ“ ' : '') + 'Show Hidden Files';
}, 1000);

// Load persistent filesystem state
try {
    loadFileSystem();
} catch(e) {}





















