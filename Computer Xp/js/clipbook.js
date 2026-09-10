/* CLIPBOOK VIEWER AND CLIPBOARD MANAGER WITH HISTORY */

window.xpInternalClipboard = "";
window.clipHistory = [];

window.addClipHistory = function(text) {
    if (!text || text.trim() === "") return;
    // Don't add if it's the same as the last one
    if (window.clipHistory.length > 0 && window.clipHistory[0] === text) return;
    
    window.clipHistory.unshift(text);
    if (window.clipHistory.length > 50) window.clipHistory.pop(); // Keep last 50
    window.xpInternalClipboard = text;
    window.updateClipbook();
};

document.addEventListener('copy', (e) => {
    let selected = window.getSelection().toString();
    if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
        selected = document.activeElement.value.substring(document.activeElement.selectionStart, document.activeElement.selectionEnd);
    }
    if(document.activeElement && document.activeElement.tagName === 'IFRAME') {
        try {
            let innerDoc = document.activeElement.contentDocument || document.activeElement.contentWindow.document;
            let innerSelect = innerDoc.getSelection().toString();
            if(innerSelect) selected = innerSelect;
        } catch(err) {} 
    }

    if (selected) {
        window.addClipHistory(selected);
    }
});

document.addEventListener('cut', (e) => {
    let selected = window.getSelection().toString();
    if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
        selected = document.activeElement.value.substring(document.activeElement.selectionStart, document.activeElement.selectionEnd);
    }
    if(document.activeElement && document.activeElement.tagName === 'IFRAME') {
        try {
            let innerDoc = document.activeElement.contentDocument || document.activeElement.contentWindow.document;
            let innerSelect = innerDoc.getSelection().toString();
            if(innerSelect) selected = innerSelect;
        } catch(err) {} 
    }

    if (selected) {
        window.addClipHistory(selected);
    }
});

window.updateClipbook = function() {
    let contentDiv = document.getElementById('clipbook-content');
    if (!contentDiv) return;

    if (window.clipHistory.length === 0) {
        contentDiv.innerHTML = '<div style="color:#666; padding:10px;">(Clipboard is currently empty)</div>';
        return;
    }

    let html = "";
    window.clipHistory.forEach((item, index) => {
        let display = item.length > 100 ? item.substring(0, 100) + "..." : item;
        let activeStyle = index === 0 ? "background:#3169C6; color:white;" : "background:white; color:black;";
        html += `
            <div onclick="window.setClipActive(${index})" style="padding:5px 10px; border-bottom:1px solid #eee; cursor:pointer; font-family:Tahoma; font-size:11px; ${activeStyle}" title="Double click to copy this back to active clipboard">
                <div style="font-weight:bold; margin-bottom:3px;">Item ${window.clipHistory.length - index}</div>
                <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:0.8;">${display}</div>
            </div>
        `;
    });
    contentDiv.innerHTML = html;
};

window.setClipActive = function(index) {
    if (index === 0) {
        try { navigator.clipboard.writeText(window.clipHistory[0]); } catch(e) {}
        if(typeof window.showBalloon === 'function') window.showBalloon('Clipbook', 'Copied to clipboard!');
        return;
    }
    let item = window.clipHistory[index];
    
    // Move to top
    window.clipHistory.splice(index, 1);
    window.clipHistory.unshift(item);
    window.xpInternalClipboard = item;
    window.updateClipbook();
    
    // Copy to system clipboard
    try {
        navigator.clipboard.writeText(item);
        if(typeof window.showBalloon === 'function') window.showBalloon('Clipbook', 'Copied to clipboard!');
    } catch(e) {}
};

window.clearClipbook = function() {
    window.xpInternalClipboard = "";
    window.clipHistory = [];
    window.updateClipbook();
    if (typeof window.showBalloon === 'function') {
        window.showBalloon('Clipbook', 'Clipboard history has been cleared.');
    }
};

// Periodic sync with system clipboard
setInterval(async () => {
    try {
        let sysClip = await navigator.clipboard.readText();
        if(sysClip && sysClip !== window.xpInternalClipboard) {
            window.addClipHistory(sysClip);
        }
    } catch(e) {}
}, 2000);
