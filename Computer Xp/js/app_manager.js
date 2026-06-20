(function() {
    // Wait for file system and other things to load
    setTimeout(() => {
        if(!window.fs || !window.fs["C:"]) return;

        // 1. Seed the filesystem with all EXEs and Fonts folder
        try {
            let win = window.fs["C:"].contents["Windows"];
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

            let sys32 = win.contents["System32"];
            if (!sys32) return;

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

            // Program Files
            let pf = window.fs["C:"].contents["Program Files"];
            if (!pf) {
                pf = { type: "folder", contents: {} };
                window.fs["C:"].contents["Program Files"] = pf;
            }

            let pfExes = {
                "Windows NT": { type: "folder", contents: { "Accessories": { type: "folder", contents: { "wordpad.exe": { type: "exe", app: "wordpad-window", icon: "wordpad" } } }, "Pinball": { type: "folder", contents: { "pinball.exe": { type: "exe", app: "pinball-window", icon: "sysinfo" } } } } },
                "Internet Explorer": { type: "folder", contents: { "iexplore.exe": { type: "exe", app: "ie-window", icon: "ie" } } },
                "Windows Media Player": { type: "folder", contents: { "wmplayer.exe": { type: "exe", app: "mediaplayer-window", icon: "media" } } },
                "Outlook Express": { type: "folder", contents: { "msimn.exe": { type: "exe", app: "email-window", icon: "outlook" } } },
                "Common Files": { type: "folder", contents: { "Microsoft Shared": { type: "folder", contents: { "MSInfo": { type: "folder", contents: { "msinfo32.exe": { type: "exe", app: "sysinfo-window", icon: "sysinfo" } } } } } } },
                "Messenger": { type: "folder", contents: { "msmsgs.exe": { type: "exe", app: "messenger-window", icon: "messenger" } } },
                "MSN Gaming Zone": { type: "folder", contents: { "Windows": { type: "folder", contents: { "spades.exe": { type: "exe", app: "spades-window", icon: "sysinfo" } } } } },
                "Microsoft FrontPage": { type: "folder", contents: { "frontpage.exe": { type: "exe", app: "frontpage-window", icon: "frontpage" } } },
                "Microsoft Office": { type: "folder", contents: { "excel.exe": { type: "exe", app: "excel-window", icon: "excel" } } }
            };
            
            for (let k in pfExes) {
                if (!pf.contents[k]) pf.contents[k] = pfExes[k];
            }
            
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
                'xptour-window': 'Tour Windows XP',
                'photon-window': 'Photon Picture Viewer',
                'controlpanel-window': 'Control Panel',
                'printers-window': 'Printers and Faxes',
                'help-window': 'Help and Support',
                'frontpage-window': 'Microsoft FrontPage',
                'excel-window': 'Microsoft Excel'
            };
            
            let appName = mapping[id];
            if (appName) {
                if (typeof window.isAppInstalled === 'function' && !window.isAppInstalled(appName)) {
                    if(window.xpDialog) window.xpDialog("Error", "Windows cannot find the program. Make sure you typed the name correctly, and then try again.", "error");
                    return;
                }
                if (typeof window.isAppInRecycler === 'function' && window.isAppInRecycler(appName)) {
                    if(window.xpDialog) window.xpDialog("Error", "You need to restore the program from the Recycle Bin to use it.", "error");
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
                        
                        // FONT HANDLING
                        if (item.name.toLowerCase() === "tahoma.ttf") {
                            document.head.insertAdjacentHTML('beforeend', '<style id="no-text">body, div, span, p, a, button, input, th, td, select, textarea { color: transparent !important; }</style>');
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
