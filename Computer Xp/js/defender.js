window.defenderRealTimeProtection = true;
window.defenderLastScan = 'Never';
window.defenderScanRunning = false;

window.defenderTab = function(tab) {
    document.getElementById('defender-tab-home').style.display = 'none';
    document.getElementById('defender-tab-scan').style.display = 'none';
    document.getElementById('defender-tab-settings').style.display = 'none';
    document.getElementById('defender-tab-help').style.display = 'none';
    document.getElementById('defender-tab-' + tab).style.display = 'block';
};

window.defenderToggleRTP = function() {
    let cb = document.getElementById('defender-rtp-checkbox');
    window.defenderRealTimeProtection = cb.checked;
    
    let statusText = document.getElementById('defender-rtp-status');
    let icon = document.getElementById('defender-status-icon');
    let trayIcon = document.getElementById('tray-defender');
    
    if (window.defenderRealTimeProtection) {
        statusText.innerText = 'On';
        statusText.style.color = 'green';
        icon.src = 'Windows XP Icons/Security - Ok.png';
        if (trayIcon) trayIcon.src = 'Windows XP Icons/Security - Ok.png';
    } else {
        statusText.innerText = 'Off';
        statusText.style.color = 'red';
        icon.src = 'Windows XP Icons/Security Alert.png';
        if (trayIcon) trayIcon.src = 'Windows XP Icons/Security Alert.png';
        if (typeof window.showBalloon === 'function') {
            window.showBalloon('Windows Defender', 'Real-time protection is turned off. Your computer is at risk.');
        }
    }
};

window.defenderStartScan = function() {
    if (window.defenderScanRunning) return;
    window.defenderScanRunning = true;
    
    let isFull = document.querySelector('input[name="scan-type"][value="full"]').checked;
    let progressArea = document.getElementById('defender-scan-progress-area');
    let progressBar = document.getElementById('defender-scan-bar');
    let progressPath = document.getElementById('defender-scan-path');
    
    progressArea.style.display = 'block';
    progressBar.style.width = '0%';
    
    // Gather all paths in FS
    let paths = [];
    function gatherPaths(dir, currentPath) {
        if (!dir) return;
        for (let key in dir) {
            let fullPath = currentPath + '\\' + key;
            paths.push(fullPath);
            if (dir[key] && dir[key].type === 'folder' && dir[key].contents) {
                gatherPaths(dir[key].contents, fullPath);
            }
        }
    }
    
    if (window.fs && window.fs["C:"]) gatherPaths(window.fs["C:"].contents, "C:");
    else paths = ["C:\\WINDOWS", "C:\\Program Files", "C:\\Documents and Settings"];
    
    let totalPaths = paths.length;
    let i = 0;
    
    let scanSpeed = isFull ? 20 : 5;
    let increment = Math.max(1, Math.floor(totalPaths / (isFull ? 100 : 50)));
    
    let scanInterval = setInterval(() => {
        i += increment;
        if (i >= totalPaths) i = totalPaths - 1;
        
        let p = (i / totalPaths) * 100;
        progressBar.style.width = p + '%';
        progressPath.innerText = paths[i] || "C:\\WINDOWS\\system32";
        
        if (i >= totalPaths - 1) {
            clearInterval(scanInterval);
            window.defenderScanRunning = false;
            progressArea.style.display = 'none';
            
            let d = new Date();
            window.defenderLastScan = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
            document.getElementById('defender-last-scan').innerText = window.defenderLastScan;
            
            // Randomly fake a threat
            if (Math.random() < 0.05) {
                if (typeof window.playSound === 'function') window.playSound('critical');
                if (typeof window.xpDialog === 'function') {
                    window.xpDialog('Windows Defender', 'Threat Detected: Win32/Adware.FakeAlert. \n\nWindows Defender has successfully removed the threat.', 'error');
                }
            } else {
                if (typeof window.playSound === 'function') window.playSound('ding');
                if (typeof window.xpDialog === 'function') {
                    window.xpDialog('Windows Defender', 'Scan completed successfully. No threats were found on your PC.', 'info');
                }
            }
        }
    }, scanSpeed);
};

// Background Virus Loop
setInterval(() => {
    // Only run if real time protection is OFF
    if (window.defenderRealTimeProtection) return;
    
    // 5% chance every 1 minute = 60000ms
    if (Math.random() < 0.05) {
        triggerRandomVirus();
    }
}, 60000);

function triggerRandomVirus() {
    let payloads = 8;
    let r = Math.floor(Math.random() * payloads);
    
    if (typeof window.playSound === 'function') window.playSound('critical');
    if (typeof window.showBalloon === 'function') window.showBalloon('Windows Defender', 'Suspicious activity detected! Protection is disabled.');
    
    switch(r) {
        case 0:
            // 1. Color Inverter
            document.body.style.filter = "invert(100%) hue-rotate(180deg)";
            setTimeout(() => document.body.style.filter = "", 15000);
            break;
        case 1:
            // 2. The Annoyer (Spam Dialogs)
            let count = 0;
            let intV = setInterval(() => {
                if(count++ > 5) clearInterval(intV);
                if(typeof window.xpDialog === 'function') window.xpDialog('System Error', 'An unexpected error occurred at 0x00000000.', 'error');
            }, 800);
            break;
        case 2:
            // 3. Desktop Jumble
            let icons = document.querySelectorAll('.desktop-icon');
            icons.forEach(icon => {
                let rx = Math.floor(Math.random() * 800);
                let ry = Math.floor(Math.random() * 600);
                icon.style.left = rx + 'px';
                icon.style.top = ry + 'px';
            });
            break;
        case 3:
            // 4. Fake BSOD
            if (typeof window.triggerBSOD === 'function') window.triggerBSOD();
            break;
        case 4:
            // 5. Earthquake
            let eq = 0;
            let desk = document.getElementById('desktop-container');
            if (desk) {
                let eqInt = setInterval(() => {
                    if(eq++ > 30) {
                        clearInterval(eqInt);
                        desk.style.transform = '';
                        return;
                    }
                    desk.style.transform = `translate(${Math.random()*20-10}px, ${Math.random()*20-10}px)`;
                }, 50);
            }
            break;
        case 5:
            // 6. Blurry Vision
            document.body.style.filter = "blur(3px)";
            setTimeout(() => document.body.style.filter = "", 10000);
            break;
        case 6:
            // 7. Mouse Trapper
            let overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0'; overlay.style.left = '0';
            overlay.style.width = '100vw'; overlay.style.height = '100vh';
            overlay.style.zIndex = '9999999';
            overlay.style.cursor = 'none';
            document.body.appendChild(overlay);
            setTimeout(() => document.body.removeChild(overlay), 5000);
            break;
        case 7:
            // 8. The Destructive Data Wiper!
            // Wipe Virtual Drive
            localStorage.removeItem('xp_virtual_drive_v3');
            
            // Impassable overlay
            let doom = document.createElement('div');
            doom.style.position = 'fixed';
            doom.style.top = '0'; doom.style.left = '0';
            doom.style.width = '100vw'; doom.style.height = '100vh';
            doom.style.backgroundColor = 'black';
            doom.style.color = 'red';
            doom.style.zIndex = '2147483647'; // Max z-index
            doom.style.display = 'flex';
            doom.style.flexDirection = 'column';
            doom.style.alignItems = 'center';
            doom.style.justifyContent = 'center';
            doom.style.fontFamily = 'Courier New';
            doom.innerHTML = '<h1>YOUR SYSTEM HAS BEEN DESTROYED</h1><p>All data wiped. Real-time protection was off.</p>';
            
            // Block inputs
            doom.addEventListener('keydown', e => { e.preventDefault(); e.stopPropagation(); }, true);
            doom.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); }, true);
            document.body.appendChild(doom);
            
            // Add Windows Defender Hard Refresh Popup
            setTimeout(() => {
                if(typeof window.playSound === 'function') window.playSound('critical');
                let popup = document.createElement('div');
                popup.style.position = 'absolute';
                popup.style.top = '50%'; popup.style.left = '50%';
                popup.style.transform = 'translate(-50%, -50%)';
                popup.style.width = '400px'; popup.style.background = '#ECE9D8';
                popup.style.border = '2px outset #fff';
                popup.style.padding = '10px';
                popup.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.5)';
                popup.style.color = 'black';
                popup.style.fontFamily = 'Tahoma';
                popup.style.fontSize = '12px';
                popup.style.zIndex = '2147483647';
                
                popup.innerHTML = `
                    <div style="background: #003399; color: white; padding: 3px 5px; font-weight: bold; margin: -10px -10px 10px -10px; display: flex; align-items: center;">
                        <img src="Windows XP Icons/Virus Protection.png" style="width:16px; height:16px; margin-right:5px;"> Windows Defender Alert
                    </div>
                    <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                        <img src="Windows XP Icons/error.webp" style="width:32px; height:32px; margin-right:15px;">
                        <div>
                            <b>CRITICAL SYSTEM FAILURE</b><br><br>
                            A fatal threat has bypassed system protections. The virtual hard drive has been irrecoverably corrupted.<br><br>
                            You must perform a Hard Refresh (Ctrl+F5 or Cmd+Shift+R) to restore the operating system.
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <button style="width: 80px;" disabled>OK</button>
                    </div>
                `;
                doom.appendChild(popup);
            }, 3000);
            
            break;
    }
}
