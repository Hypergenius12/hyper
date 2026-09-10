window.initRemoteDesktop = function() {
    let content = document.getElementById('remotedesktop-content');
    if(!content) return;
    
    // Initial UI State
    content.innerHTML = `
        <div id="rdp-login-screen" style="flex:1; display:flex; flex-direction:column; padding:20px; font-family:Tahoma, sans-serif; font-size:11px; background:#ECE9D8; overflow-y:auto;">
            <div style="display:flex; align-items:center; gap:20px; margin-bottom: 20px;">
                <img src="Windows XP Icons/My Computer.png" style="width:48px; height:48px;">
                <div>
                    <h2 style="margin:0; font-size:18px; font-weight:normal;">Remote Desktop Connection</h2>
                    <p style="margin:5px 0 0 0; color:#666;">Type the name of the computer, or choose a computer from the drop-down list.</p>
                </div>
            </div>
            
            <div style="flex:1;">
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td style="width:100px; padding:5px 0;">Computer:</td>
                        <td>
                            <input type="text" id="rdp-ip-input" value="192.168.1.10" style="width:100%; padding:3px; border:1px solid #7F9DB9;" onkeypress="if(event.key === 'Enter') rdpConnect()">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;">User name:</td>
                        <td>
                            <input type="text" id="rdp-user-input" value="Administrator" style="width:100%; padding:3px; border:1px solid #7F9DB9;">
                        </td>
                    </tr>
                </table>
                <div style="margin-top:20px; font-style:italic; color:#666;">
                    You will be asked for credentials when you connect.
                </div>
            </div>
            
            <div id="rdp-options-panel" style="display:none; margin-top:10px; border:1px solid #7F9DB9; padding:10px; background:#fff;">
                <div style="font-weight:bold; border-bottom:1px solid #ccc; margin-bottom:5px;">Connection Settings</div>
                <div><input type="checkbox" checked> Save credentials</div>
                <div><input type="checkbox" id="rdp-fullscreen"> Open in full screen</div>
                <div style="margin-top:5px;">Color Depth: <select id="rdp-color-depth"><option>Highest Quality (32 bit)</option><option>True Color (24 bit)</option></select></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:10px; border-top:1px solid #ACA899;">
                <button onclick="toggleRdpOptions()" style="padding:4px 15px; border:1px solid #003C74; background:linear-gradient(to bottom, #F2F2F2, #EBEBEB); cursor:pointer;">Options >></button>
                <div style="display:flex; gap:10px;">
                    <button onclick="rdpConnect()" style="padding:4px 15px; border:1px solid #003C74; background:linear-gradient(to bottom, #F2F2F2, #EBEBEB); cursor:pointer;">Connect</button>
                    <button onclick="closeWindow('remotedesktop-window')" style="padding:4px 15px; border:1px solid #003C74; background:linear-gradient(to bottom, #F2F2F2, #EBEBEB); cursor:pointer;">Cancel</button>
                </div>
            </div>
        </div>
        
        <div id="rdp-connecting-screen" style="flex:1; display:none; flex-direction:column; justify-content:center; align-items:center; background:#ECE9D8; font-family:Tahoma; font-size:12px;">
            <img src="Windows XP Icons/My Computer.png" style="width:48px; height:48px; margin-bottom:20px; animation: blink 1s infinite alternate;">
            <div>Connecting to <span id="rdp-connecting-ip" style="font-weight:bold;"></span>...</div>
        </div>
        
        <div id="rdp-session-screen" style="flex:1; display:none; background:#000; position:relative;">
            <!-- Remote Session Bar -->
            <div style="position:absolute; top:0; left:50%; transform:translateX(-50%); width:300px; height:24px; background:linear-gradient(to bottom, #FFF, #ECE9D8); border:1px solid #ACA899; border-top:none; border-radius:0 0 5px 5px; display:flex; justify-content:center; align-items:center; gap:10px; z-index:10; box-shadow:0 2px 5px rgba(0,0,0,0.5);">
                <img src="Windows XP Icons/My Computer.png" style="width:16px; height:16px;">
                <span id="rdp-session-ip" style="font-size:11px; font-family:Tahoma; font-weight:bold;"></span>
                <div onclick="rdpDisconnect()" style="cursor:pointer; font-weight:bold; color:red; margin-left:20px;" title="Disconnect">X</div>
            </div>
            
            <!-- Actual Remote Desktop Instance -->
            <iframe id="rdp-iframe" src="" style="width:100%; height:100%; border:none; display:block;"></iframe>
        </div>
    `;
    
    // Add blink keyframes if not exists
    if(!document.getElementById('rdp-styles')) {
        let style = document.createElement('style');
        style.id = 'rdp-styles';
        style.innerHTML = `
            @keyframes blink {
                0% { opacity: 1; }
                100% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
    }
};

window.rdpConnect = function() {
    let ip = document.getElementById('rdp-ip-input').value.trim();
    if(!ip) {
        if(typeof window.xpDialog === 'function') window.xpDialog('Error', 'Please enter a valid computer name or IP address.', 'error');
        return;
    }
    
    document.getElementById('rdp-login-screen').style.display = 'none';
    document.getElementById('rdp-connecting-screen').style.display = 'flex';
    document.getElementById('rdp-connecting-ip').innerText = ip;
    
    // Fullscreen check
    let wantsFullscreen = false;
    let fsCheck = document.getElementById('rdp-fullscreen');
    if(fsCheck && fsCheck.checked) wantsFullscreen = true;

    // Simulate connection delay
    setTimeout(() => {
        document.getElementById('rdp-connecting-screen').style.display = 'none';
        document.getElementById('rdp-session-screen').style.display = 'block';
        document.getElementById('rdp-session-ip').innerText = ip;
        
        if(wantsFullscreen) {
            if(typeof window.maximizeWindow === 'function') window.maximizeWindow('remotedesktop-window');
            try { document.documentElement.requestFullscreen().catch(e=>{}); } catch(err){}
        }

        let iframe = document.getElementById('rdp-iframe');
        if(iframe) {
            iframe.src = 'index.html?remote=1';
            let depth = document.getElementById('rdp-color-depth');
            if (depth && depth.value.includes('24 bit')) {
                iframe.style.filter = 'contrast(1.1) saturate(0.85)';
            } else {
                iframe.style.filter = 'none';
            }
        }
    }, 2000);
};

window.rdpDisconnect = function() {
    document.getElementById('rdp-session-screen').style.display = 'none';
    document.getElementById('rdp-login-screen').style.display = 'flex';
    try { if (document.fullscreenElement) document.exitFullscreen().catch(e=>{}); } catch(err){}
};

window.toggleRdpOptions = function() {
    let p = document.getElementById('rdp-options-panel');
    if(p) {
        let isHidden = p.style.display === 'none';
        p.style.display = isHidden ? 'block' : 'none';
        let btn = document.querySelector('button[onclick="toggleRdpOptions()"]');
        if(btn) btn.innerText = isHidden ? 'Options <<' : 'Options >>';
    }
};
