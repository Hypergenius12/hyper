/* Windows XP Wallpapers Collection & Management */
(function() {
    const XP_WALLPAPERS = {
        "Bliss.bmp": {
            "name": "Bliss",
            "ext": "bmp",
            "content": "Windows XP Icons/bliss_bg.png",
            "icon": "bmp"
        },
        "Ascent.jpg": {
            "name": "Ascent",
            "ext": "jpg",
            "content": "wallpapers/Ascent.jpg",
            "icon": "jpg"
        },
        "Autumn.jpg": {
            "name": "Autumn",
            "ext": "jpg",
            "content": "wallpapers/Autumn.jpg",
            "icon": "jpg"
        },
        "Azul.jpg": {
            "name": "Azul",
            "ext": "jpg",
            "content": "wallpapers/Azul.jpg",
            "icon": "jpg"
        },
        "Crystal.jpg": {
            "name": "Crystal",
            "ext": "jpg",
            "content": "wallpapers/Crystal.jpg",
            "icon": "jpg"
        },
        "Follow.jpg": {
            "name": "Follow",
            "ext": "jpg",
            "content": "wallpapers/Follow.jpg",
            "icon": "jpg"
        },
        "Friend.jpg": {
            "name": "Friend",
            "ext": "jpg",
            "content": "wallpapers/Friend.jpg",
            "icon": "jpg"
        },
        "Home.jpg": {
            "name": "Home",
            "ext": "jpg",
            "content": "wallpapers/Home.jpg",
            "icon": "jpg"
        },
        "Moon flower.jpg": {
            "name": "Moon flower",
            "ext": "jpg",
            "content": "wallpapers/Moon flower.jpg",
            "icon": "jpg"
        },
        "Peace.jpg": {
            "name": "Peace",
            "ext": "jpg",
            "content": "wallpapers/Peace.jpg",
            "icon": "jpg"
        },
        "Power.jpg": {
            "name": "Power",
            "ext": "jpg",
            "content": "wallpapers/Power.jpg",
            "icon": "jpg"
        },
        "Purple flower.jpg": {
            "name": "Purple flower",
            "ext": "jpg",
            "content": "wallpapers/Purple flower.jpg",
            "icon": "jpg"
        },
        "Radiance.jpg": {
            "name": "Radiance",
            "ext": "jpg",
            "content": "wallpapers/Radiance.jpg",
            "icon": "jpg"
        },
        "Red moon desert.jpg": {
            "name": "Red moon desert",
            "ext": "jpg",
            "content": "wallpapers/Red moon desert.jpg",
            "icon": "jpg"
        },
        "Ripple.jpg": {
            "name": "Ripple",
            "ext": "jpg",
            "content": "wallpapers/Ripple.jpg",
            "icon": "jpg"
        },
        "Stonehenge.jpg": {
            "name": "Stonehenge",
            "ext": "jpg",
            "content": "wallpapers/Stonehenge.jpg",
            "icon": "jpg"
        },
        "Tulips.jpg": {
            "name": "Tulips",
            "ext": "jpg",
            "content": "wallpapers/Tulips.jpg",
            "icon": "jpg"
        },
        "Vortec space.jpg": {
            "name": "Vortec space",
            "ext": "jpg",
            "content": "wallpapers/Vortec space.jpg",
            "icon": "jpg"
        },
        "Wind.jpg": {
            "name": "Wind",
            "ext": "jpg",
            "content": "wallpapers/Wind.jpg",
            "icon": "jpg"
        },
        "Windows XP.jpg": {
            "name": "Windows XP",
            "ext": "jpg",
            "content": "wallpapers/Windows XP.jpg",
            "icon": "jpg"
        }
    };
    window.XP_WALLPAPERS = XP_WALLPAPERS;

    // Helper: get image content for wallpaper
    window.getWallpaperContent = function(name) {
        if (!name) return 'Windows XP Icons/bliss_bg.png';
        let cleanName = (name || '').toString().split(/[\\/]/).pop();
        if (cleanName === 'none' || cleanName === '(None)') return 'none';
        if (cleanName === 'matrix') return 'matrix';
        if (cleanName === 'custom' && window.customBgDataUrl) return window.customBgDataUrl;
        if (cleanName.toLowerCase() === 'bliss' || cleanName.toLowerCase() === 'bliss.bmp') {
            return 'Windows XP Icons/bliss_bg.png';
        }
        
        // 1. Try finding in filesystem C:\WINDOWS\Web\Wallpaper
        if (window.fs && window.fs["C:"]) {
            let wallDir = null;
            try {
                let win = window.fs["C:"].contents["WINDOWS"] || window.fs["C:"].contents["Windows"];
                if (win && win.contents["Web"] && win.contents["Web"].contents["Wallpaper"]) {
                    wallDir = win.contents["Web"].contents["Wallpaper"].contents;
                }
            } catch(e) {}
            
            if (wallDir) {
                // Exact or case-insensitive match
                let match = Object.keys(wallDir).find(k => k.toLowerCase() === cleanName.toLowerCase() || k.toLowerCase().replace(/\.[^.]+$/, '') === cleanName.toLowerCase());
                if (match && wallDir[match].content) {
                    return wallDir[match].content;
                }
            }
        }
        
        // 2. Fallback to XP_WALLPAPERS
        let key = Object.keys(XP_WALLPAPERS).find(k => k.toLowerCase() === cleanName.toLowerCase() || XP_WALLPAPERS[k].name.toLowerCase() === cleanName.toLowerCase());
        if (key) return XP_WALLPAPERS[key].content;

        // 3. Fallback to wallpapers/ directory
        if (cleanName.includes('.')) {
            return 'wallpapers/' + cleanName;
        }
        
        return 'Windows XP Icons/bliss_bg.png';
    };

    // Helper: apply wallpaper to desktop
    window.applyWallpaper = function(name, color) {
        if (!name || name.toLowerCase() === 'bliss' || name.toLowerCase() === 'bliss.bmp') {
            name = 'Bliss.bmp';
        }
        color = color || localStorage.getItem('xp_wallpaper_color') || '#004E98';
        let bgIframe = document.getElementById('bg-iframe');
        if (bgIframe) bgIframe.style.display = 'none';

        if (name === 'none' || name === '(None)') {
            document.body.style.backgroundImage = 'none';
            document.body.style.backgroundColor = color;
            let desk = document.getElementById('desktop');
            if (desk) {
                desk.style.backgroundImage = 'none';
                desk.style.backgroundColor = color;
            }
        } else if (name === 'matrix') {
            document.body.style.backgroundImage = 'none';
            document.body.style.backgroundColor = '#000000';
            let desk = document.getElementById('desktop');
            if (desk) {
                desk.style.backgroundImage = 'none';
                desk.style.backgroundColor = '#000000';
            }
            if (bgIframe) {
                bgIframe.src = 'matrix.html';
                bgIframe.style.display = 'block';
            }
        } else {
            let content = window.getWallpaperContent(name);
            document.body.style.backgroundImage = 'url("' + content + '")';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundColor = color;
            let desk = document.getElementById('desktop');
            if (desk) {
                desk.style.backgroundImage = 'url("' + content + '")';
                desk.style.backgroundSize = 'cover';
                desk.style.backgroundPosition = 'center';
                desk.style.backgroundRepeat = 'no-repeat';
                desk.style.backgroundColor = color;
            }
        }

        // Save
        localStorage.setItem('xp_wallpaper', name);
        localStorage.setItem('xp_wallpaper_color', color);
        try {
            let key = typeof window.getRegistryKey === 'function' ? window.getRegistryKey("HKEY_CURRENT_USER\\Control Panel\\Desktop") : null;
            if (key) {
                key["Wallpaper"] = { type: "REG_SZ", data: "C:\\WINDOWS\\Web\\Wallpaper\\" + name };
                if (typeof window.saveRegistry === 'function') window.saveRegistry();
            }
        } catch(e) {}
    };

    // Helper: populate wallpaper dropdown in Display Properties
    window.populateWallpaperDropdown = function() {
        let sel = document.getElementById('bg-select');
        if (!sel) return;

        let curVal = localStorage.getItem('xp_wallpaper') || 'Bliss.bmp';
        sel.innerHTML = '';

        // Add (None)
        let optNone = document.createElement('option');
        optNone.value = 'none';
        optNone.textContent = '(None)';
        sel.appendChild(optNone);

        // Get files from filesystem C:\WINDOWS\Web\Wallpaper
        let wallFiles = [];
        try {
            let win = window.fs["C:"].contents["WINDOWS"] || window.fs["C:"].contents["Windows"];
            if (win && win.contents["Web"] && win.contents["Web"].contents["Wallpaper"]) {
                wallFiles = Object.keys(win.contents["Web"].contents["Wallpaper"].contents);
            }
        } catch(e) {}

        if (wallFiles.length === 0) {
            wallFiles = Object.keys(XP_WALLPAPERS);
        }

        wallFiles.sort((a, b) => a.localeCompare(b));
        wallFiles.forEach(f => {
            let opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f.replace(/\.[^.]+$/, '');
            sel.appendChild(opt);
        });

        // Add Matrix
        let optMat = document.createElement('option');
        optMat.value = 'matrix';
        optMat.textContent = 'Matrix';
        sel.appendChild(optMat);

        // Add Custom if exists
        if (window.customBgDataUrl) {
            let optC = document.createElement('option');
            optC.value = 'custom';
            optC.textContent = 'Custom Upload';
            sel.appendChild(optC);
        }

        // Match current value
        let found = Array.from(sel.options).find(o => 
            o.value.toLowerCase() === curVal.toLowerCase() || 
            o.value.toLowerCase().replace(/\.[^.]+$/, '') === curVal.toLowerCase()
        );
        if (found) sel.value = found.value;
        else sel.value = 'Bliss.bmp';

        if (typeof window.updateDesktopPreview === 'function') {
            window.updateDesktopPreview();
        }
    };

    // Helper: Set selected image as desktop background
    window.setAsDesktopBackground = function() {
        let ctx = window.selectedFileContext;
        if (!ctx) return;
        let dir = window.resolvePath ? window.resolvePath(ctx.path) : null;
        let item = dir ? dir[ctx.name] : null;
        if (!item) return;

        let content = item.content || window.getWallpaperContent(ctx.name);
        if (content) {
            window.applyWallpaper(ctx.name);
            if (typeof window.showBalloon === 'function') {
                window.showBalloon("Display Properties", `Desktop background set to '${ctx.name}'.`, "info");
            }
        }
    };

    // Auto-apply saved wallpaper on startup
    function initWallpaper() {
        let wp = localStorage.getItem('xp_wallpaper');
        if (!wp || wp.toLowerCase() === 'bliss' || wp.toLowerCase() === 'bliss.bmp') {
            wp = 'Bliss.bmp';
        }
        let clr = localStorage.getItem('xp_wallpaper_color') || '#004E98';
        window.applyWallpaper(wp, clr);
        if (typeof window.populateWallpaperDropdown === 'function') {
            window.populateWallpaperDropdown();
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWallpaper);
    } else {
        initWallpaper();
    }
})();
