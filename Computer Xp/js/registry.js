(function() {
    'use strict';

    const defaultRegistry = {
        "HKEY_CLASSES_ROOT": {
            ".txt": { "(Default)": { type: "REG_SZ", data: "txtfile" } },
            ".bmp": { "(Default)": { type: "REG_SZ", data: "Paint.Picture" } },
            ".jpg": { "(Default)": { type: "REG_SZ", data: "jpegfile" } },
            ".png": { "(Default)": { type: "REG_SZ", data: "pngfile" } },
            ".wav": { "(Default)": { type: "REG_SZ", data: "soundrec" } },
            ".mp3": { "(Default)": { type: "REG_SZ", data: "WMP.Play" } },
            ".exe": { "(Default)": { type: "REG_SZ", data: "exefile" } },
            ".lnk": { "(Default)": { type: "REG_SZ", data: "lnkfile" } },
            ".xls": { "(Default)": { type: "REG_SZ", data: "Excel.Sheet.8" } },
            ".htm": { "(Default)": { type: "REG_SZ", data: "htmlfile" } },
            ".html": { "(Default)": { type: "REG_SZ", data: "htmlfile" } },
            ".zip": { "(Default)": { type: "REG_SZ", data: "CompressedFolder" } },
            "txtfile": { "(Default)": { type: "REG_SZ", data: "Text Document" } },
            "Paint.Picture": { "(Default)": { type: "REG_SZ", data: "Bitmap Image" } },
            "CLSID": {
                "{20D04FE0-3AEA-1069-A2D8-08002B30309D}": { "(Default)": { type: "REG_SZ", data: "My Computer" } },
                "{450D8FBA-AD25-11D0-98E8-0050C5877549}": { "(Default)": { type: "REG_SZ", data: "My Documents" } },
                "{645FF040-5081-101B-9F08-00AA002F954E}": { "(Default)": { type: "REG_SZ", data: "Recycle Bin" } },
                "{21EC2020-3AEA-1069-A2DD-08002B30309D}": { "(Default)": { type: "REG_SZ", data: "Control Panel" } }
            }
        },
        "HKEY_CURRENT_USER": {
            "AppEvents": {
                "EventLabels": {
                    ".Default": { "(Default)": { type: "REG_SZ", data: "Default Beep" } },
                    "SystemStart": { "(Default)": { type: "REG_SZ", data: "Start Windows" } },
                    "SystemExit": { "(Default)": { type: "REG_SZ", data: "Exit Windows" } },
                    "SystemAsterisk": { "(Default)": { type: "REG_SZ", data: "Asterisk" } },
                    "SystemExclamation": { "(Default)": { type: "REG_SZ", data: "Exclamation" } },
                    "SystemHand": { "(Default)": { type: "REG_SZ", data: "Critical Stop" } },
                    "Navigating": { "(Default)": { type: "REG_SZ", data: "Start Navigation" } },
                    "Notification": { "(Default)": { type: "REG_SZ", data: "System Notification" } }
                },
                "Schemes": {
                    "Apps": {
                        ".Default": {
                            ".Default": { "(Default)": { type: "REG_SZ", data: "C:\\WINDOWS\\Media\\ding.wav" } },
                            "SystemStart": { "(Default)": { type: "REG_SZ", data: "C:\\WINDOWS\\Media\\Windows XP Startup.wav" } },
                            "SystemExit": { "(Default)": { type: "REG_SZ", data: "C:\\WINDOWS\\Media\\Windows XP Shutdown.wav" } },
                            "SystemAsterisk": { "(Default)": { type: "REG_SZ", data: "C:\\WINDOWS\\Media\\Windows XP Error.wav" } },
                            "SystemExclamation": { "(Default)": { type: "REG_SZ", data: "C:\\WINDOWS\\Media\\Windows XP Exclamation.wav" } },
                            "SystemHand": { "(Default)": { type: "REG_SZ", data: "C:\\WINDOWS\\Media\\Windows XP Critical Stop.wav" } }
                        },
                        "Explorer": {
                            "Navigating": { "(Default)": { type: "REG_SZ", data: "C:\\WINDOWS\\Media\\Windows Navigation Start.wav" } },
                            "EmptyRecycleBin": { "(Default)": { type: "REG_SZ", data: "C:\\WINDOWS\\Media\\Windows XP Recycle.wav" } },
                            "Notification": { "(Default)": { type: "REG_SZ", data: "C:\\WINDOWS\\Media\\Windows XP Balloon.wav" } }
                        }
                    }
                }
            },
            "Control Panel": {
                "Desktop": {
                    "Wallpaper": { type: "REG_SZ", data: "C:\\WINDOWS\\Web\\Wallpaper\\Bliss.bmp" },
                    "WallpaperStyle": { type: "REG_SZ", data: "2" },
                    "TileWallpaper": { type: "REG_SZ", data: "0" },
                    "ScreenSaveActive": { type: "REG_SZ", data: "1" },
                    "ScreenSaveTimeOut": { type: "REG_SZ", data: "600" },
                    "DragFullWindows": { type: "REG_SZ", data: "1" },
                    "FontSmoothing": { type: "REG_SZ", data: "2" }
                },
                "Colors": {
                    "Background": { type: "REG_SZ", data: "0 78 152" },
                    "Window": { type: "REG_SZ", data: "255 255 255" },
                    "WindowText": { type: "REG_SZ", data: "0 0 0" },
                    "Menu": { type: "REG_SZ", data: "236 233 216" },
                    "MenuText": { type: "REG_SZ", data: "0 0 0" },
                    "ActiveTitle": { type: "REG_SZ", data: "0 84 227" },
                    "TitleText": { type: "REG_SZ", data: "255 255 255" }
                },
                "Mouse": {
                    "MouseSpeed": { type: "REG_SZ", data: "1" },
                    "DoubleClickSpeed": { type: "REG_SZ", data: "500" },
                    "SwapMouseButtons": { type: "REG_SZ", data: "0" }
                },
                "Sound": {
                    "Beep": { type: "REG_SZ", data: "yes" },
                    "ExtendedSounds": { type: "REG_SZ", data: "yes" }
                }
            },
            "Software": {
                "Microsoft": {
                    "Windows": {
                        "CurrentVersion": {
                            "Explorer": {
                                "Advanced": {
                                    "Hidden": { type: "REG_DWORD", data: 0 },
                                    "HideFileExt": { type: "REG_DWORD", data: 0 },
                                    "ShowSuperHidden": { type: "REG_DWORD", data: 0 },
                                    "TaskbarSizeMove": { type: "REG_DWORD", data: 0 },
                                    "EnableBalloonTips": { type: "REG_DWORD", data: 1 },
                                    "Start_ShowRun": { type: "REG_DWORD", data: 1 },
                                    "Start_ShowControlPanel": { type: "REG_DWORD", data: 1 },
                                    "Start_ShowMyDocs": { type: "REG_DWORD", data: 1 },
                                    "Start_ShowMyComputer": { type: "REG_DWORD", data: 1 }
                                }
                            },
                            "Themes": {
                                "CurrentTheme": { type: "REG_SZ", data: "Luna" }
                            },
                            "Run": {
                                "MSMSGS": { type: "REG_SZ", data: "\"C:\\Program Files\\Messenger\\msmsgs.exe\" /background" }
                            }
                        }
                    }
                }
            }
        },
        "HKEY_LOCAL_MACHINE": {
            "HARDWARE": {
                "DESCRIPTION": {
                    "System": {
                        "CentralProcessor": {
                            "0": {
                                "ProcessorNameString": { type: "REG_SZ", data: "Intel(R) Pentium(R) 4 CPU 3.00GHz" },
                                "Identifier": { type: "REG_SZ", data: "x86 Family 15 Model 2 Stepping 9" },
                                "~MHz": { type: "REG_DWORD", data: 2992 },
                                "VendorIdentifier": { type: "REG_SZ", data: "GenuineIntel" }
                            }
                        },
                        "BIOS": {
                            "BIOSVendor": { type: "REG_SZ", data: "Award Software, Inc." },
                            "BIOSVersion": { type: "REG_SZ", data: "ASUS P4P800 ACPI BIOS 1019" }
                        }
                    }
                }
            },
            "SOFTWARE": {
                "Microsoft": {
                    "Windows NT": {
                        "CurrentVersion": {
                            "ProductName": { type: "REG_SZ", data: "Microsoft Windows XP" },
                            "CurrentVersion": { type: "REG_SZ", data: "5.1" },
                            "CurrentBuildNumber": { type: "REG_SZ", data: "2600" },
                            "CSDVersion": { type: "REG_SZ", data: "Service Pack 3" },
                            "RegisteredOwner": { type: "REG_SZ", data: "Administrator" },
                            "RegisteredOrganization": { type: "REG_SZ", data: "Microsoft" },
                            "SystemRoot": { type: "REG_SZ", data: "C:\\WINDOWS" }
                        }
                    },
                    "Windows": {
                        "CurrentVersion": {
                            "ProgramFilesDir": { type: "REG_SZ", data: "C:\\Program Files" },
                            "CommonFilesDir": { type: "REG_SZ", data: "C:\\Program Files\\Common Files" }
                        }
                    }
                }
            },
            "SYSTEM": {
                "CurrentControlSet": {
                    "Control": {
                        "ComputerName": {
                            "ComputerName": {
                                "ComputerName": { type: "REG_SZ", data: "WINXP-PRO" }
                            }
                        }
                    }
                }
            }
        },
        "HKEY_USERS": {
            ".DEFAULT": {}
        },
        "HKEY_CURRENT_CONFIG": {
            "System": {
                "CurrentControlSet": {
                    "Control": {
                        "VIDEO": {}
                    }
                }
            }
        }
    };

    window.xpRegistry = JSON.parse(JSON.stringify(defaultRegistry));

    function deepMergeRegistry(target, source) {
        for (let key in source) {
            if (source[key] && typeof source[key] === 'object' && source[key].type) {
                if (!target[key]) {
                    target[key] = JSON.parse(JSON.stringify(source[key]));
                }
            } else if (source[key] && typeof source[key] === 'object') {
                if (!target[key] || typeof target[key] !== 'object' || target[key].type) {
                    target[key] = {};
                }
                deepMergeRegistry(target[key], source[key]);
            }
        }
    }

    window.saveRegistry = function() {
        try {
            localStorage.setItem('xp_virtual_registry', JSON.stringify(window.xpRegistry));
        } catch(e) {
            console.error("Registry save error:", e);
        }
    };

    window.loadRegistry = function() {
        let saved = localStorage.getItem('xp_virtual_registry');
        if (saved) {
            try {
                let parsed = JSON.parse(saved);
                window.xpRegistry = parsed;
                deepMergeRegistry(window.xpRegistry, defaultRegistry);
            } catch (e) {
                console.error("Registry parse error.");
                window.xpRegistry = JSON.parse(JSON.stringify(defaultRegistry));
            }
        } else {
            window.xpRegistry = JSON.parse(JSON.stringify(defaultRegistry));
        }
        window.saveRegistry();
    };

    // Initial load
    window.loadRegistry();

    // Helper to get a registry key path (e.g. "HKEY_CURRENT_USER\\Software\\Microsoft")
    window.getRegistryKey = function(pathStr) {
        if (!pathStr) return null;
        let parts = pathStr.split('\\').filter(p => p !== '');
        let curr = window.xpRegistry;
        for (let p of parts) {
            if (curr && curr[p] && typeof curr[p] === 'object' && !curr[p].type) {
                curr = curr[p];
            } else {
                return null;
            }
        }
        return curr;
    };

    // Helper to get a registry value
    window.getRegistryValue = function(pathStr, valueName) {
        let key = window.getRegistryKey(pathStr);
        if (key && key[valueName]) {
            return key[valueName].data;
        }
        return null;
    };

    // Helper to set a registry value
    window.setRegistryValue = function(pathStr, valueName, type, data) {
        if (data === undefined && type !== undefined) {
            data = type;
            type = typeof data === 'number' ? 'REG_DWORD' : 'REG_SZ';
        }
        let key = window.getRegistryKey(pathStr);
        if (key) {
            if (type === 'REG_DWORD') {
                if (typeof data === 'string') data = parseInt(data, 10) || 0;
            }
            key[valueName] = { type: type, data: data };
            window.saveRegistry();
            
            // Apply all changes reactively to the OS
            window.applyAllRegistrySettings();

            // Refresh desktop and explorer if file views might be affected
            if (pathStr.includes('Explorer\\Advanced') && (valueName === 'Hidden' || valueName === 'HideFileExt')) {
                if (typeof window.renderDesktop === 'function') window.renderDesktop();
                if (window.currentPath && typeof window.renderExplorer === 'function') window.renderExplorer(window.currentPath);
            }
            if (pathStr.includes('CLSID')) {
                if (typeof window.renderDesktop === 'function') window.renderDesktop();
                if (window.currentPath && typeof window.renderExplorer === 'function') window.renderExplorer(window.currentPath);
            }

            return true;
        }
        return false;
    };

    window.applyAllRegistrySettings = function() {
        if (!window.xpRegistry) return;

        // 1. ProductName -> document.title, login banner, help center
        let prodName = window.getRegistryValue("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", "ProductName") || "Microsoft Windows XP";
        document.title = prodName;
        let loginTitle = document.querySelector('#login-title, .login-title, .login-banner h2');
        if (loginTitle) loginTitle.innerText = prodName;
        let helpBanner = document.querySelector('#help-window .help-banner-title, #help-banner-title');
        if (helpBanner) helpBanner.innerText = prodName + " Help and Support Center";

        // 2. ComputerName -> window.computerName, status bar, sysinfo
        let compName = window.getRegistryValue("HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\ComputerName\\ComputerName", "ComputerName") || "WINXP-PRO";
        window.computerName = compName;
        let statusComp = document.getElementById('explorer-status-computer') || document.querySelector('#explorer-status-bar div:last-child');
        if (statusComp) statusComp.innerText = compName;

        // 3. RegisteredOwner -> Start menu username & profile display
        let regOwner = window.getRegistryValue("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", "RegisteredOwner");
        if (regOwner) {
            let startUser = document.getElementById('start-menu-username') || document.querySelector('.start-menu-header span');
            if (startUser) startUser.innerText = regOwner;
        }

        // 4. CLSID Aliases for desktop & start menu
        let myCompAlias = window.getRegistryValue("HKEY_CLASSES_ROOT\\CLSID\\{20D04FE0-3AEA-1069-A2D8-08002B30309D}", "(Default)");
        if (myCompAlias) {
            document.querySelectorAll('.desktop-icon[data-name*="My Computer"] span, #start-menu-item-mycomputer span').forEach(el => el.innerText = myCompAlias);
        }
        let myDocsAlias = window.getRegistryValue("HKEY_CLASSES_ROOT\\CLSID\\{450D8FBA-AD25-11D0-98E8-0050C5877549}", "(Default)");
        if (myDocsAlias) {
            document.querySelectorAll('.desktop-icon[data-name*="My Documents"] span, #start-menu-item-mydocs span').forEach(el => el.innerText = myDocsAlias);
        }
        let recycleAlias = window.getRegistryValue("HKEY_CLASSES_ROOT\\CLSID\\{645FF040-5081-101B-9F08-00AA002F954E}", "(Default)");
        if (recycleAlias) {
            document.querySelectorAll('.desktop-icon[data-name*="Recycle Bin"] span').forEach(el => el.innerText = recycleAlias);
        }
        let controlPanelAlias = window.getRegistryValue("HKEY_CLASSES_ROOT\\CLSID\\{21EC2020-3AEA-1069-A2DD-08002B30309D}", "(Default)");
        if (controlPanelAlias) {
            document.querySelectorAll('#start-menu-item-controlpanel span').forEach(el => el.innerText = controlPanelAlias);
        }

        // 5. Start Menu Policies (Start_Show...)
        let showRun = window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "Start_ShowRun");
        let runItem = document.getElementById('start-menu-item-run');
        if (runItem && showRun !== null) runItem.style.display = (parseInt(showRun, 10) === 0) ? 'none' : 'flex';

        let showCP = window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "Start_ShowControlPanel");
        let cpItem = document.getElementById('start-menu-item-controlpanel');
        if (cpItem && showCP !== null) cpItem.style.display = (parseInt(showCP, 10) === 0) ? 'none' : 'flex';

        let showDocs = window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "Start_ShowMyDocs");
        let docsItem = document.getElementById('start-menu-item-mydocs');
        if (docsItem && showDocs !== null) docsItem.style.display = (parseInt(showDocs, 10) === 0) ? 'none' : 'flex';

        let showComp = window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "Start_ShowMyComputer");
        let compItem = document.getElementById('start-menu-item-mycomputer');
        if (compItem && showComp !== null) compItem.style.display = (parseInt(showComp, 10) === 0) ? 'none' : 'flex';

        let showPrinters = window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "Start_ShowPrinters");
        let printersItem = document.getElementById('start-menu-item-printers');
        if (printersItem && showPrinters !== null) printersItem.style.display = (parseInt(showPrinters, 10) === 0) ? 'none' : 'flex';

        let showHelp = window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "Start_ShowHelp");
        let helpItem = document.getElementById('start-menu-item-help');
        if (helpItem && showHelp !== null) helpItem.style.display = (parseInt(showHelp, 10) === 0) ? 'none' : 'flex';

        // 6. CurrentTheme
        let themeVal = localStorage.getItem('xp_theme') || window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes", "CurrentTheme");
        if (themeVal) {
            let t = themeVal.toLowerCase();
            if (typeof window.applyTheme === 'function') {
                window.applyTheme(t, false);
            } else {
                document.body.classList.remove('theme-blue', 'theme-silver', 'theme-olive', 'theme-classic');
                if (t.includes('silver')) document.body.classList.add('theme-silver');
                else if (t.includes('olive') || t.includes('green')) document.body.classList.add('theme-olive');
                else if (t.includes('classic') || t.includes('2000')) document.body.classList.add('theme-classic');
                else document.body.classList.add('theme-blue');
            }
        }

        // 7. SystemFont
        let sysFont = window.getRegistryValue("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\FontSubstitutes", "SystemFont") || window.getRegistryValue("HKEY_CURRENT_USER\\Control Panel\\Desktop\\WindowMetrics", "SystemFont");
        if (sysFont && typeof window.applySystemFont === 'function') {
            window.applySystemFont(sysFont, false);
        }

        // 8. Wallpaper & Background
        let wpVal = window.getRegistryValue("HKEY_CURRENT_USER\\Control Panel\\Desktop", "Wallpaper");
        let colorVal = window.getRegistryValue("HKEY_CURRENT_USER\\Control Panel\\Colors", "Background");
        if (wpVal && typeof window.applyWallpaper === 'function') {
            let col = colorVal;
            if (colorVal && colorVal.includes(' ')) {
                let p = colorVal.split(' ').filter(x => x !== '');
                if (p.length === 3) col = 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')';
            }
            window.applyWallpaper(wpVal, col);
        }

        // 9. Taskbar lock
        let taskbarVal = window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "TaskbarSizeMove");
        if (taskbarVal !== null) {
            let locked = parseInt(taskbarVal, 10) === 0;
            window.isTaskbarLocked = locked;
            let check = document.getElementById('check-lock-taskbar');
            if (check) check.innerHTML = locked ? '&#10003;' : '&nbsp;';
        }

        // 10. Balloon Tips
        let balloonVal = window.getRegistryValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "EnableBalloonTips");
        if (balloonVal !== null) {
            window.enableBalloonTips = parseInt(balloonVal, 10) !== 0;
        }

        // 11. System sound / Beep
        let beepVal = window.getRegistryValue("HKEY_CURRENT_USER\\Control Panel\\Sound", "Beep");
        if (beepVal !== null) {
            let muted = (beepVal === 'no' || beepVal === '0' || beepVal === 0);
            window.sysMuted = muted;
        }

        // 12. Refresh System Info window if open
        let sysWindow = document.getElementById('sysinfo-window');
        if (sysWindow && sysWindow.style.display !== 'none' && typeof window.showSysInfo === 'function') {
            window.showSysInfo('summary');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.applyAllRegistrySettings();
        });
    } else {
        window.applyAllRegistrySettings();
    }
})();
