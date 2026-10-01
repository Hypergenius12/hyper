/* Windows XP Font Subsystem, Font Viewer & System Files Reactivity */
(function() {
    const XP_SYSTEM_FONTS = {
        "Tahoma.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Tahoma", name: "Tahoma", size: "138 KB", weight: "normal" },
        "Tahoma Bold.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Tahoma", name: "Tahoma Bold", size: "134 KB", weight: "bold" },
        "Arial.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Arial", name: "Arial", size: "290 KB", weight: "normal" },
        "Arial Bold.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Arial", name: "Arial Bold", size: "288 KB", weight: "bold" },
        "Courier New.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Courier New", name: "Courier New", size: "304 KB", weight: "normal" },
        "Times New Roman.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Times New Roman", name: "Times New Roman", size: "326 KB", weight: "normal" },
        "Comic Sans MS.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Comic Sans MS", name: "Comic Sans MS", size: "124 KB", weight: "normal" },
        "Verdana.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Verdana", name: "Verdana", size: "148 KB", weight: "normal" },
        "Trebuchet MS.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Trebuchet MS", name: "Trebuchet MS", size: "132 KB", weight: "normal" },
        "Impact.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Impact", name: "Impact", size: "136 KB", weight: "normal" },
        "Georgia.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Georgia", name: "Georgia", size: "156 KB", weight: "normal" },
        "Lucida Console.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Lucida Console", name: "Lucida Console", size: "112 KB", weight: "normal" },
        "Marlett.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Marlett", name: "Marlett", size: "28 KB", weight: "normal" },
        "Symbol.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Symbol", name: "Symbol", size: "64 KB", weight: "normal" },
        "Wingdings.ttf": { type: "file", extension: "ttf", icon: "ttf", family: "Wingdings", name: "Wingdings", size: "82 KB", weight: "normal" },
        "Modern.fon": { type: "file", extension: "fon", icon: "ttf", family: "Modern", name: "Modern", size: "8 KB", weight: "normal" },
        "Vgafix.fon": { type: "file", extension: "fon", icon: "ttf", family: "VGA Fix", name: "VGA Fix", size: "5 KB", weight: "normal" }
    };
    window.XP_SYSTEM_FONTS = XP_SYSTEM_FONTS;

    // --- Dynamic System Font Application ---
    window.getCurrentSystemFont = function() {
        return localStorage.getItem('xp_system_font') || 'Tahoma';
    };

    window.applySystemFont = function(fontFamily, save = true) {
        if (!fontFamily) fontFamily = 'Tahoma';
        fontFamily = fontFamily.replace(/['"]/g, '').trim();

        let styleEl = document.getElementById('xp-system-font-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'xp-system-font-style';
            document.head.appendChild(styleEl);
        }

        styleEl.innerHTML = `
            :root {
                --xp-system-font: "${fontFamily}", Tahoma, 'MS Sans Serif', sans-serif;
            }
            body, button, input, select, textarea, .window, .title-bar, .start-menu, .taskbar, .desktop-icon, .context-menu, .stat-box, .explorer-address input, #desktop, #clock {
                font-family: var(--xp-system-font) !important;
            }
        `;
        document.body.style.fontFamily = `"${fontFamily}", Tahoma, sans-serif`;

        if (save) {
            localStorage.setItem('xp_system_font', fontFamily);
            if (typeof window.setRegistryValue === 'function') {
                window.setRegistryValue("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\FontSubstitutes", "MS Shell Dlg", fontFamily);
            }
        }

        // Keep dropdown in sync if present
        let sel = document.getElementById('system-font-select');
        if (sel && sel.value !== fontFamily) {
            let opt = Array.from(sel.options).find(o => o.value.toLowerCase() === fontFamily.toLowerCase());
            if (opt) sel.value = opt.value;
        }
    };

    // Helper: populate system font dropdown in Display Properties
    window.populateSystemFontDropdown = function() {
        let sel = document.getElementById('system-font-select');
        if (!sel) return;

        let curFont = window.getCurrentSystemFont();
        sel.innerHTML = '';

        let fontFamilies = new Set();
        // Check files in C:\WINDOWS\Fonts
        try {
            let win = window.fs["C:"].contents["WINDOWS"] || window.fs["C:"].contents["Windows"];
            if (win && win.contents["Fonts"] && win.contents["Fonts"].contents) {
                let fDir = win.contents["Fonts"].contents;
                Object.keys(fDir).forEach(fn => {
                    let item = fDir[fn];
                    let fam = item.family || fn.replace(/\.(ttf|fon|otf)$/i, '').replace(/ Bold$/i, '').trim();
                    fontFamilies.add(fam);
                });
            }
        } catch(e) {}

        if (fontFamilies.size === 0) {
            Object.values(XP_SYSTEM_FONTS).forEach(f => fontFamilies.add(f.family));
        }

        Array.from(fontFamilies).sort().forEach(fam => {
            let opt = document.createElement('option');
            opt.value = fam;
            opt.textContent = fam;
            opt.style.fontFamily = `"${fam}", sans-serif`;
            sel.appendChild(opt);
        });

        let found = Array.from(sel.options).find(o => o.value.toLowerCase() === curFont.toLowerCase());
        if (found) sel.value = found.value;
        else if (sel.options.length > 0) sel.value = sel.options[0].value;
    };

    // --- Font Deletion & Automatic Fallback ---
    window.handleFontDeleted = function(fontFileName) {
        let activeFont = window.getCurrentSystemFont();
        let baseName = fontFileName.replace(/\.(ttf|fon|otf)$/i, '').trim();

        // Check remaining fonts in C:\WINDOWS\Fonts
        let remainingFamilies = new Set();
        try {
            let win = window.fs["C:"].contents["WINDOWS"] || window.fs["C:"].contents["Windows"];
            if (win && win.contents["Fonts"] && win.contents["Fonts"].contents) {
                let fDir = win.contents["Fonts"].contents;
                Object.keys(fDir).forEach(fn => {
                    let item = fDir[fn];
                    let fam = item.family || fn.replace(/\.(ttf|fon|otf)$/i, '').replace(/ Bold$/i, '').trim();
                    remainingFamilies.add(fam);
                });
            }
        } catch(e) {}

        let isActiveFontGone = !Array.from(remainingFamilies).some(f => f.toLowerCase() === activeFont.toLowerCase());

        if (isActiveFontGone) {
            // Priority fallback list
            let fallbackList = ['Arial', 'Trebuchet MS', 'Verdana', 'Times New Roman', 'Comic Sans MS', 'Courier New', 'Georgia', 'Lucida Console', 'Impact', 'sans-serif'];
            let chosen = fallbackList.find(c => Array.from(remainingFamilies).some(rf => rf.toLowerCase() === c.toLowerCase())) || 'sans-serif';

            window.applySystemFont(chosen, true);

            if (typeof window.showBalloon === 'function') {
                window.showBalloon(
                    "Windows Font Subsystem",
                    `The active system font '${activeFont}' (${fontFileName}) was removed. System font has automatically fallen back to '${chosen}'.`,
                    "warning"
                );
            }
        }

        if (typeof window.populateSystemFontDropdown === 'function') {
            window.populateSystemFontDropdown();
        }
    };

    // --- Font Viewer (fontview.exe) ---
    window.openFontViewer = function(name, item, dirPath) {
        let fontFamily = (item && item.family) ? item.family : name.replace(/\.(ttf|fon|otf)$/i, '').replace(/ Bold$/i, '').trim();
        let fontName = (item && item.name) ? item.name : name.replace(/\.(ttf|fon|otf)$/i, '');
        let size = (item && item.size) ? item.size : '140 KB';
        let weight = (item && item.weight) ? item.weight : (name.toLowerCase().includes('bold') ? 'bold' : 'normal');

        let win = document.getElementById('fontview-window');
        if (!win) {
            win = document.createElement('div');
            win.id = 'fontview-window';
            win.className = 'window';
            win.setAttribute('onmousedown', 'bringToFront(this)');
            win.style.cssText = 'display:none; width: 560px; height: 500px; top: 120px; left: 240px; z-index: 1050;';
            win.innerHTML = `
                <div class="title-bar" id="fontview-window-title">
                    <span id="fontview-title-text" style="display:flex; align-items:center; gap:5px;">
                        <img src="Windows XP Icons/Fonts.png" class="sys-icon-small"> Font Viewer
                    </span>
                    <div class="window-controls">
                        <div class="win-btn" onclick="minimizeWindow('fontview-window')"><img src="Windows XP Icons/Minimize.png" alt="-"></div>
                        <div class="win-btn" onclick="maximizeWindow('fontview-window')"><img src="Windows XP Icons/Maximize.png" alt="[]"></div>
                        <div class="win-btn" onclick="closeWindow('fontview-window')"><img src="Windows XP Icons/Exit.png" alt="X"></div>
                    </div>
                </div>
                <div class="window-body" style="margin:0; padding:8px; display:flex; flex-direction:column; height:calc(100% - 25px); background:#ECE9D8; box-sizing:border-box;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div style="display:flex; gap:6px;">
                            <button onclick="window.print()" style="font-family:Tahoma; font-size:11px; padding:3px 12px; cursor:pointer;">Print</button>
                            <button id="fontview-set-sys-btn" style="font-family:Tahoma; font-size:11px; font-weight:bold; padding:3px 12px; cursor:pointer;">Set as System Font</button>
                        </div>
                        <button onclick="closeWindow('fontview-window')" style="font-family:Tahoma; font-size:11px; padding:3px 14px; cursor:pointer;">Done</button>
                    </div>
                    <div id="fontview-specimen-box" style="flex:1; background:#FFF; border:2px inset #D5D2C2; padding:15px; overflow-y:auto; color:#000;">
                    </div>
                </div>
            `;
            document.body.appendChild(win);
            if (typeof window.makeDraggable === 'function') {
                window.makeDraggable(win, document.getElementById('fontview-window-title'));
            }
        }

        let titleText = document.getElementById('fontview-title-text');
        if (titleText) {
            titleText.innerHTML = `<img src="Windows XP Icons/Fonts.png" class="sys-icon-small"> ${fontName} (TrueType)`;
        }

        let setSysBtn = document.getElementById('fontview-set-sys-btn');
        if (setSysBtn) {
            setSysBtn.onclick = function() {
                window.applySystemFont(fontFamily, true);
                if (typeof window.showBalloon === 'function') {
                    window.showBalloon("Windows Fonts", `System font changed to '${fontFamily}'.`, "info");
                }
            };
        }

        let specimenBox = document.getElementById('fontview-specimen-box');
        if (specimenBox) {
            specimenBox.innerHTML = `
                <div style="font-family:Tahoma; font-size:12px; line-height:1.6; margin-bottom:12px;">
                    <div style="font-size:16px; font-weight:bold; color:#000;">${fontName} (TrueType)</div>
                    <div><b>Typeface name:</b> ${fontFamily}</div>
                    <div><b>File size:</b> ${size}</div>
                    <div><b>Version:</b> Version 3.15</div>
                    <div style="color:#555;">Typeface © Microsoft Corporation. All rights reserved.</div>
                </div>
                <hr style="border:0; border-top:1px solid #ACA899; margin:10px 0;">
                <div style="font-family:'${fontFamily}', sans-serif; font-weight:${weight};">
                    <div style="font-size:14px; margin-bottom:10px;">abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
                    <div style="font-size:14px; margin-bottom:14px;">1234567890.:,;(:*!?')</div>
                    <div style="font-size:12px; margin-bottom:8px; border-bottom:1px dashed #DDD; padding-bottom:4px;">12 The quick brown fox jumps over the lazy dog. 1234567890</div>
                    <div style="font-size:18px; margin-bottom:10px; border-bottom:1px dashed #DDD; padding-bottom:4px;">18 The quick brown fox jumps over the lazy dog. 1234567890</div>
                    <div style="font-size:24px; margin-bottom:12px; border-bottom:1px dashed #DDD; padding-bottom:4px;">24 The quick brown fox jumps over the lazy dog.</div>
                    <div style="font-size:36px; margin-bottom:14px; border-bottom:1px dashed #DDD; padding-bottom:4px;">36 The quick brown fox jumps</div>
                    <div style="font-size:48px; margin-bottom:16px; border-bottom:1px dashed #DDD; padding-bottom:4px;">48 The quick brown</div>
                    <div style="font-size:60px;">60 The quick</div>
                </div>
            `;
        }

        if (typeof window.openProgram === 'function') {
            window.openProgram('fontview-window');
        } else {
            win.style.display = 'block';
            if (typeof window.bringToFront === 'function') window.bringToFront(win);
        }
    };

    // --- Global System File Reactivity Hooks ---
    window.onFileSystemItemDeleted = function(dirPath, filename, itemNode) {
        let p = (dirPath || '').toLowerCase();
        let fn = (filename || '').toLowerCase();

        // 1. Font Deleted
        if (p.includes('fonts')) {
            window.handleFontDeleted(filename);
        }
        // 2. Wallpaper Deleted
        else if (p.includes('wallpaper')) {
            let curWp = localStorage.getItem('xp_wallpaper') || 'Bliss.bmp';
            if (curWp.toLowerCase() === fn || curWp.toLowerCase().replace(/\.[^.]+$/, '') === fn.replace(/\.[^.]+$/, '')) {
                let color = localStorage.getItem('xp_wallpaper_color') || '#004E98';
                if (typeof window.applyWallpaper === 'function') {
                    window.applyWallpaper('none', color);
                }
                if (typeof window.showBalloon === 'function') {
                    window.showBalloon("Display Properties", `The active desktop background '${filename}' was deleted. Background reset to solid color.`, "info");
                }
            }
            if (typeof window.populateWallpaperDropdown === 'function') {
                window.populateWallpaperDropdown();
            }
        }
        // 3. System32 Executable Deleted
        else if (p.includes('system32') && (fn.endsWith('.exe') || fn.endsWith('.msc'))) {
            if (typeof window.showBalloon === 'function') {
                window.showBalloon("System Alert", `Executable '${filename}' was removed from system32.`, "warning");
            }
        }
        // 4. Critical Windows Files
        else if (fn === 'system.ini' || fn === 'win.ini' || fn === 'user32.dll' || fn === 'kernel32.dll') {
            if (typeof window.showBalloon === 'function') {
                window.showBalloon("Windows File Protection", `A critical system file was removed: ${filename}. System stability may be affected.`, "error");
            }
        }
    };

    window.onFileSystemItemRestored = function(dirPath, filename, itemNode) {
        let p = (dirPath || '').toLowerCase();
        if (p.includes('fonts')) {
            if (typeof window.populateSystemFontDropdown === 'function') {
                window.populateSystemFontDropdown();
            }
            if (typeof window.showBalloon === 'function') {
                window.showBalloon("Fonts", `${filename} has been restored to the Fonts directory.`, "info");
            }
        } else if (p.includes('wallpaper')) {
            if (typeof window.populateWallpaperDropdown === 'function') {
                window.populateWallpaperDropdown();
            }
            if (typeof window.showBalloon === 'function') {
                window.showBalloon("Desktop", `${filename} has been restored to Wallpapers.`, "info");
            }
        }
    };

    window.onFileSystemItemSaved = function(dirPath, filename, content) {
        let p = (dirPath || '').toLowerCase();
        let fn = (filename || '').toLowerCase();

        // 1. win.ini update
        if (fn === 'win.ini' && p.includes('windows')) {
            let lines = (content || '').split('\n');
            let currentSection = '';
            lines.forEach(line => {
                line = line.trim();
                if (line.startsWith('[') && line.endsWith(']')) {
                    currentSection = line.substring(1, line.length - 1).toLowerCase();
                } else if (line.includes('=')) {
                    let [key, val] = line.split('=').map(s => s.trim());
                    if (currentSection === 'desktop' && key.toLowerCase() === 'wallpaper') {
                        if (typeof window.applyWallpaper === 'function') window.applyWallpaper(val);
                    } else if (currentSection === 'fonts' && key.toLowerCase() === 'systemfont') {
                        if (typeof window.applySystemFont === 'function') window.applySystemFont(val, true);
                    }
                }
            });
            if (typeof window.showBalloon === 'function') {
                window.showBalloon("win.ini", "Windows configuration has been updated from win.ini.", "info");
            }
        }
        // 2. Wallpaper file modified
        else if (p.includes('wallpaper')) {
            let curWp = localStorage.getItem('xp_wallpaper') || 'Bliss.bmp';
            if (curWp.toLowerCase() === fn || curWp.toLowerCase().replace(/\.[^.]+$/, '') === fn.replace(/\.[^.]+$/, '')) {
                if (typeof window.applyWallpaper === 'function') {
                    window.applyWallpaper(filename);
                }
            }
            if (typeof window.populateWallpaperDropdown === 'function') {
                window.populateWallpaperDropdown();
            }
        }
    };

    // Auto-apply system font on startup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.applySystemFont(window.getCurrentSystemFont(), false);
        });
    } else {
        window.applySystemFont(window.getCurrentSystemFont(), false);
    }
})();
