(function() {
    // Wait for file system and other things to load
    setTimeout(() => {
        if(!window.fs || !window.fs["C:"]) return;

        // 1. Seed the filesystem with all EXEs and Fonts folder
        try {
            let winKey = Object.keys(window.fs["C:"].contents).find(k => k.toLowerCase() === 'windows');
            let win = winKey ? window.fs["C:"].contents[winKey] : null;
            if (!win) return;

            // Seed Fonts folder
            if (!win.contents["Fonts"]) {
                win.contents["Fonts"] = { type: "folder", contents: {} };
            }
            if (!win.contents["Fonts"].contents) {
                win.contents["Fonts"].contents = {};
            }
            
            // Force icon and fonts
            win.contents["Fonts"].icon = "fonts";
            
            let fontFiles = {
                "Tahoma.ttf": { type: "file", extension: "ttf", content: "Font data", icon: "ttf" },
                "Arial.ttf": { type: "file", extension: "ttf", content: "Font data", icon: "ttf" },
                "Times New Roman.ttf": { type: "file", extension: "ttf", content: "Font data", icon: "ttf" },
                "Courier New.ttf": { type: "file", extension: "ttf", content: "Font data", icon: "ttf" }
            };
            
            let changedFonts = false;
            for (let f in fontFiles) {
                if (!win.contents["Fonts"].contents[f]) {
                    win.contents["Fonts"].contents[f] = fontFiles[f];
                    changedFonts = true;
                }
            }
            
            if (changedFonts) {
                if (typeof window.saveFileSystem === 'function') window.saveFileSystem();
                if (window.currentPath === "C:\\Windows\\Fonts" && typeof window.renderExplorer === 'function') {
                    window.renderExplorer(window.currentPath);
                }
            }

            let sys32Key = Object.keys(win.contents).find(k => k.toLowerCase() === 'system32');
            if (!sys32Key) {
                sys32Key = "system32";
                win.contents[sys32Key] = { type: "folder", contents: {} };
            }
            let sys32 = win.contents[sys32Key];
            if (!sys32 || !sys32.contents) return;

            // System32 EXEs
            let sys32Exes = {
                "mspaint.exe": { type: "exe", app: "paint-window", icon: "paint" },
                "calc.exe": { type: "exe", app: "calc-window", icon: "calc" },
                "charmap.exe": { type: "exe", app: "charmap-window", icon: "sysinfo" },
                "sndrec32.exe": { type: "exe", app: "soundrecorder-window", icon: "soundrecorder" },
                "clipbrd.exe": { type: "exe", app: "clipbook-window", icon: "sysinfo" },
                "winmine.exe": { type: "exe", app: "minesweeper-window", icon: "mine" },
                "sol.exe": { type: "exe", app: "solitaire-window", icon: "solitaire" },
                "freecell.exe": { type: "exe", app: "freecell-window", icon: "sysinfo" },
                "mshearts.exe": { type: "exe", app: "hearts-window", icon: "sysinfo" },
                "dfrg.msc": { type: "exe", app: "defrag-window", icon: "defrag" },
                "taskmgr.exe": { type: "exe", app: "taskmgr-window", icon: "taskmgr" },
                "cmd.exe": { type: "exe", app: "cmd-window", icon: "cmd" },
                "mstsc.exe": { type: "exe", app: "remotedesktop-window", icon: "sysinfo" },
                "photon.exe": { type: "exe", app: "photon-window", icon: "image" },
                "control.exe": { type: "exe", app: "controlpanel-window", icon: "settings" },
                "printers.exe": { type: "exe", app: "printers-window", icon: "sysinfo" }
            };
            for (let k in sys32Exes) {
                if (!sys32.contents[k]) sys32.contents[k] = sys32Exes[k];
            }

            // Regedit
            if (!win.contents["regedit.exe"]) {
                win.contents["regedit.exe"] = { type: "exe", app: "regedit-window", icon: "sysinfo" };
            }

            // PCHealth (Help)
            if (!win.contents["PCHealth"]) {
                win.contents["PCHealth"] = { type: "folder", contents: { "HelpCtr": { type: "folder", contents: { "Binaries": { type: "folder", contents: { "helpctr.exe": { type: "exe", app: "help-window", icon: "sysinfo" } } } } } } };
            }

            // Help Tours
            if (!win.contents["Help"]) {
                win.contents["Help"] = { type: "folder", contents: { "Tours": { type: "folder", contents: { "htmlTour": { type: "folder", contents: { "tour.exe": { type: "exe", app: "xptour-window", icon: "sysinfo" } } } } } } };
            }

            // Program Files and executables setup
            let ensureFile = (pathStr, nodeData) => {
                let parts = pathStr.split('\\').filter(p => p !== '');
                let curr = window.fs["C:"].contents;
                for (let i = 1; i < parts.length - 1; i++) {
                    let folderName = parts[i];
                    if (!curr[folderName]) curr[folderName] = { type: "folder", contents: {} };
                    if (!curr[folderName].contents) curr[folderName].contents = {};
                    curr = curr[folderName].contents;
                }
                let fileName = parts[parts.length - 1];
                if (!curr[fileName]) curr[fileName] = nodeData;
            };

            ensureFile("C:\\Program Files\\Internet Explorer\\iexplore.exe", { type: "exe", app: "ie-window", icon: "ie" });
            ensureFile("C:\\Program Files\\Windows NT\\Accessories\\wordpad.exe", { type: "exe", app: "wordpad-window", icon: "wordpad" });
            ensureFile("C:\\Program Files\\Windows NT\\Pinball\\pinball.exe", { type: "exe", app: "pinball-window", icon: "pinball" });
            ensureFile("C:\\Program Files\\Common Files\\Microsoft Shared\\MSInfo\\msinfo32.exe", { type: "exe", app: "sysinfo-window", icon: "sysinfo" });
            ensureFile("C:\\Program Files\\Outlook Express\\msimn.exe", { type: "exe", app: "email-window", icon: "outlook" });
            ensureFile("C:\\Program Files\\Windows Media Player\\wmplayer.exe", { type: "exe", app: "mediaplayer-window", icon: "media" });
            ensureFile("C:\\Program Files\\Messenger\\msmsgs.exe", { type: "exe", app: "messenger-window", icon: "messenger" });
            ensureFile("C:\\Program Files\\MSN Gaming Zone\\Windows\\spades.exe", { type: "exe", app: "spades-window", icon: "spades" });
            ensureFile("C:\\Program Files\\Microsoft FrontPage\\frontpage.exe", { type: "exe", app: "frontpage-window", icon: "frontpage" });
            ensureFile("C:\\Program Files\\Microsoft FrontPage\\frontpg.exe", { type: "exe", app: "frontpage-window", icon: "frontpage" });
            ensureFile("C:\\Program Files\\Microsoft Office\\excel.exe", { type: "exe", app: "excel-window", icon: "excel" });
            ensureFile("C:\\Program Files\\Internet Checkers\\chkrs.exe", { type: "exe", app: "checkers-window", icon: "checkers" });
            ensureFile("C:\\Program Files\\Internet Reversi\\reversi.exe", { type: "exe", app: "reversi-window", icon: "reversi" });
            ensureFile("C:\\Program Files\\Tetris XP\\tetris.exe", { type: "exe", app: "tetris-window", icon: "tetris" });
            ensureFile("C:\\Program Files\\Data Miner\\dataminer.exe", { type: "exe", app: "main-window", icon: "mouse" });
            ensureFile("C:\\Program Files\\Windows Defender\\MSASCui.exe", { type: "exe", app: "defender-window", icon: "Windows XP Icons/Virus Protection.png" });
            
            if (typeof window.saveFileSystem === 'function') window.saveFileSystem();

        } catch (e) {}

        // 2. Wrap openProgram
        let origOpenProgram = window.openProgram;
        window.openProgram = function(id, extraArg) {
            let mapping = {
                'notepad-window': 'Notepad',
                'wordpad-window': 'WordPad',
                'paint-window': 'Paint',
                'calc-window': 'Calculator',
                'charmap-window': 'Character Map',
                'soundrecorder-window': 'Sound Recorder',
                'clipbook-window': 'Clipboard Viewer',
                'minesweeper-window': 'Minesweeper',
                'solitaire-window': 'Solitaire',
                'freecell-window': 'FreeCell',
                'hearts-window': 'Hearts',
                'spades-window': 'Internet Spades',
                'pinball-window': '3D Pinball',
                'defrag-window': 'Disk Defragmenter',
                'sysinfo-window': 'System Information',
                'regedit-window': 'Registry Editor',
                'taskmgr-window': 'Task Manager',
                'cmd-window': 'Command Prompt',
                'ie-window': 'Internet Explorer',
                'email-window': 'Outlook Express',
                'mediaplayer-window': 'Windows Media Player',
                'messenger-window': 'Windows Messenger',
                'remotedesktop-window': 'Remote Desktop',
                'mstsc-window': 'Remote Desktop',
                'xptour-window': 'Tour Windows XP',
                'photon-window': 'Photon Picture Viewer',
                'controlpanel-window': 'Control Panel',
                'printers-window': 'Printers and Faxes',
                'help-window': 'Help and Support',
                'frontpage-window': 'Microsoft FrontPage',
                'excel-window': 'Microsoft Excel',
                'checkers-window': 'Internet Checkers',
                'reversi-window': 'Internet Reversi',
                'tetris-window': 'Tetris XP',
                'main-window': 'Data Miner',
                'defender-window': 'Windows Defender'
            };
            
            let appName = mapping[id];
            if (appName) {
                if (typeof window.isAppInRecycler === 'function' && window.isAppInRecycler(appName)) {
                    if (typeof window.playSound === 'function') window.playSound('recycle');
                    if (typeof window.showBalloon === 'function') {
                        window.showBalloon("Recycle Bin", "You must restore " + appName + " from the Recycle Bin before opening it.");
                    }
                    if (typeof window.xpDialog === 'function') {
                        window.xpDialog("Recycle Bin", "The application '" + appName + "' is in the Recycle Bin.\n\nYou must restore it first before you can open it.", "info");
                    }
                    return;
                }
                if (typeof window.isAppInstalled === 'function' && !window.isAppInstalled(appName)) {
                    if (typeof window.playSound === 'function') window.playSound('error');
                    if (typeof window.xpDialog === 'function') {
                        window.xpDialog(appName, `Windows cannot open '${appName}'. The application has been permanently deleted or is not installed.`, 'error');
                    }
                    return;
                }
            }
            if (typeof origOpenProgram === 'function') {
                origOpenProgram(id, extraArg);
            }
        };

        // 3. Wrap file deletion (interception inside triggerDeleteContextMenu is hard because it uses an internal variable 'processDelete').
        // Instead, we will wrap the function that is called when delete is confirmed. Wait, we can't do that easily.
        // We can just redefine triggerDeleteContextMenu completely!
        
        let origTriggerDeleteContextMenu = window.triggerDeleteContextMenu;
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
                        
                        if (typeof window.onFileSystemItemDeleted === 'function') {
                            window.onFileSystemItemDeleted(item.path, item.name, dir[item.name]);
                        }

                        // PROGRAM DELETION HANDLING
                        let isExe = item.name.toLowerCase().endsWith('.exe') || dir[item.name].type === 'exe' || dir[item.name].type === 'msc';
                        let deletedAppId = dir[item.name].app;
                        
                        if (isExe) {
                            if (!deletedAppId) {
                                let mapping = {
                                    'notepad.exe': 'notepad-window',
                                    'wordpad.exe': 'wordpad-window',
                                    'mspaint.exe': 'paint-window',
                                    'calc.exe': 'calc-window',
                                    'charmap.exe': 'charmap-window',
                                    'sndrec32.exe': 'soundrecorder-window',
                                    'clipbrd.exe': 'clipbook-window',
                                    'winmine.exe': 'minesweeper-window',
                                    'sol.exe': 'solitaire-window',
                                    'freecell.exe': 'freecell-window',
                                    'mshearts.exe': 'hearts-window',
                                    'spades.exe': 'spades-window',
                                    'pinball.exe': 'pinball-window',
                                    'dfrg.msc': 'defrag-window',
                                    'msinfo32.exe': 'sysinfo-window',
                                    'regedit.exe': 'regedit-window',
                                    'taskmgr.exe': 'taskmgr-window',
                                    'cmd.exe': 'cmd-window',
                                    'iexplore.exe': 'ie-window',
                                    'msimn.exe': 'email-window',
                                    'wmplayer.exe': 'mediaplayer-window',
                                    'msmsgs.exe': 'messenger-window',
                                    'mstsc.exe': 'remotedesktop-window',
                                    'tour.exe': 'xptour-window',
                                    'photon.exe': 'photon-window',
                                    'control.exe': 'controlpanel-window',
                                    'printers.exe': 'printers-window',
                                    'helpctr.exe': 'help-window',
                                    'frontpage.exe': 'frontpage-window',
                                    'excel.exe': 'excel-window'
                                };
                                deletedAppId = mapping[item.name.toLowerCase()];
                            }
                            
                            if (deletedAppId) {
                                // Close the window if it's currently open
                                if (typeof window.closeWindow === 'function') window.closeWindow(deletedAppId);
                            }
                        }

                        if (!permanentlyDelete && recycler && item.name !== "Recycle Bin.lnk") {
                            recycler[item.name] = dir[item.name];
                        } else if (permanentlyDelete && typeof window.findStoreApp === 'function') {
                            let sApp = window.findStoreApp(item.name) || (deletedAppId && window.findStoreApp(deletedAppId));
                            if (sApp) {
                                let uninst = typeof window.getUninstalledApps === 'function' ? window.getUninstalledApps() : [];
                                if (!uninst.includes(sApp.id)) uninst.push(sApp.id);
                                if (!uninst.includes(sApp.name)) uninst.push(sApp.name);
                                if (typeof window.setUninstalledApps === 'function') window.setUninstalledApps(uninst);
                                if (typeof window.renderStore === 'function') window.renderStore();
                            }
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

    }, 2500); // Allow time for window.fs to be initialized
})();
