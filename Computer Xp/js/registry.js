window.xpRegistry = {
    "HKEY_CLASSES_ROOT": {
        ".txt": { "(Default)": { type: "REG_SZ", data: "txtfile" } },
        ".bmp": { "(Default)": { type: "REG_SZ", data: "Paint.Picture" } },
        "txtfile": { "(Default)": { type: "REG_SZ", data: "Text Document" } }
    },
    "HKEY_CURRENT_USER": {
        "AppEvents": {
            "Schemes": {
                "Apps": {
                    "Explorer": {
                        "Navigating": { "(Default)": { type: "REG_SZ", data: "C:\\Windows\\Media\\Windows XP Start.wav" } }
                    }
                }
            }
        },
        "Control Panel": {
            "Desktop": {
                "Wallpaper": { type: "REG_SZ", data: "C:\\Windows\\Web\\Wallpaper\\Bliss.bmp" }
            }
        },
        "Software": {
            "Microsoft": {
                "Windows": {
                    "CurrentVersion": {
                        "Explorer": {
                            "Advanced": {
                                "Hidden": { type: "REG_DWORD", data: 0 },
                                "HideFileExt": { type: "REG_DWORD", data: 0 }
                            }
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
                            "ProcessorNameString": { type: "REG_SZ", data: "Intel(R) Pentium(R) 4 CPU 3.00GHz" }
                        }
                    }
                }
            }
        },
        "SOFTWARE": {
            "Microsoft": {
                "Windows NT": {
                    "CurrentVersion": {
                        "ProductName": { type: "REG_SZ", data: "Microsoft Windows XP" },
                        "CSDVersion": { type: "REG_SZ", data: "Service Pack 3" }
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

window.saveRegistry = function() {
    localStorage.setItem('xp_virtual_registry', JSON.stringify(window.xpRegistry));
};

window.loadRegistry = function() {
    let saved = localStorage.getItem('xp_virtual_registry');
    if (saved) {
        try {
            window.xpRegistry = JSON.parse(saved);
        } catch (e) {
            console.error("Registry parse error.");
        }
    }
};

// Initial load
window.loadRegistry();

// Helper to get a registry key path (e.g. "HKEY_CURRENT_USER\\Software\\Microsoft")
window.getRegistryKey = function(pathStr) {
    let parts = pathStr.split('\\').filter(p => p !== '');
    let curr = window.xpRegistry;
    for (let p of parts) {
        if (curr[p]) {
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
    let key = window.getRegistryKey(pathStr);
    if (key) {
        if(type === 'REG_DWORD' && typeof data === 'string') data = parseInt(data) || 0;
        key[valueName] = { type: type, data: data };
        window.saveRegistry();
        
        // Triggers
        if(pathStr.includes('Explorer\\Advanced') && (valueName === 'Hidden' || valueName === 'HideFileExt')) {
            if(typeof window.renderDesktop === 'function') window.renderDesktop();
            if(window.currentPath && typeof window.renderExplorer === 'function') window.renderExplorer(window.currentPath);
        }
        if(pathStr.includes('Desktop') && valueName === 'Wallpaper') {
            let desk = document.getElementById('desktop');
            if(desk) {
                 if(data) {
                     let file = window.resolvePath ? window.resolvePath(data) : null;
                     if(file) desk.style.backgroundImage = 'url("' + file.content + '")';
                     else desk.style.backgroundImage = 'url("' + data + '")';
                 } else {
                     desk.style.backgroundImage = 'none';
                 }
            }
        }
        
        return true;
    }
    return false;
};
