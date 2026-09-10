window.rufflePlayer = null;

window.initXpTour = function() {
    let content = document.getElementById('xptour-content');
    if (!content) return;

    // Build absolute base URL for the xptour directory so Ruffle can resolve
    // relative loadMovie/loadVariables calls from within the SWF files.
    // This is critical on GitHub Pages where relative paths can break.
    var baseUrl = window.location.href;
    // Strip query/hash
    baseUrl = baseUrl.split('?')[0].split('#')[0];
    // Strip filename if present (e.g., index.html)
    if (baseUrl.lastIndexOf('/') > baseUrl.indexOf('//') + 1) {
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    }
    var swfBase = baseUrl + 'xptour/';
    var swfUrl = swfBase + 'A-tour.swf';

    console.log('[XP Tour] Base URL:', swfBase);
    console.log('[XP Tour] SWF URL:', swfUrl);

    // Configure Ruffle before loading
    window.RufflePlayer = window.RufflePlayer || {};
    window.RufflePlayer.config = {
        "publicPath": undefined,
        "polyfills": true
    };

    if (!window.RufflePlayer.newest) {
        content.innerHTML = '<div style="color:white; text-align:center; padding-top:100px; font-family:Tahoma; font-size:14px;">Loading Windows XP Tour...</div>';
        var script = document.createElement('script');
        script.src = 'https://unpkg.com/@ruffle-rs/ruffle@0.3.0/ruffle.js';
        script.onload = function() {
            console.log('[XP Tour] Ruffle script loaded');
            setTimeout(function() { startTour(content, swfUrl, swfBase); }, 500);
        };
        script.onerror = function() {
            console.error('[XP Tour] Failed to load Ruffle script');
            content.innerHTML = '<div style="color:red; text-align:center; padding-top:100px; font-family:Tahoma;">Failed to load Flash emulator.</div>';
        };
        document.head.appendChild(script);
    } else {
        startTour(content, swfUrl, swfBase);
    }
};

function startTour(content, swfUrl, swfBase) {
    console.log('[XP Tour] Starting tour...');

    // Always create a fresh player
    if (window.rufflePlayer) {
        try {
            window.rufflePlayer.remove();
        } catch(e) {}
        window.rufflePlayer = null;
    }

    content.innerHTML = '';

    try {
        var ruffle = window.RufflePlayer.newest();
        if (!ruffle) {
            console.error('[XP Tour] RufflePlayer.newest() returned null');
            content.innerHTML = '<div style="color:red; text-align:center; padding-top:100px; font-family:Tahoma;">Ruffle player not available.</div>';
            return;
        }

        var player = ruffle.createPlayer();
        player.style.width = '100%';
        player.style.height = '100%';
        content.appendChild(player);
        window.rufflePlayer = player;

        console.log('[XP Tour] Player created, loading SWF:', swfUrl);

        player.load({
            url: swfUrl,
            base: swfBase,
            allowScriptAccess: true,
            quality: "high",
            salign: "",
            scale: "showAll",
            autoplay: "on",
            splashScreen: false
        }).then(function() {
            console.log('[XP Tour] SWF loaded successfully');
        }).catch(function(e) {
            console.error('[XP Tour] SWF load error:', e);
        });
    } catch(e) {
        console.error('[XP Tour] Error creating player:', e);
        content.innerHTML = '<div style="color:yellow; text-align:center; padding-top:100px; font-family:Tahoma;">Error: ' + e.message + '</div>';
    }
}

window.stopXpTour = function() {
    if (window.rufflePlayer) {
        try {
            window.rufflePlayer.pause();
            window.rufflePlayer.remove();
        } catch(e) {}
        window.rufflePlayer = null;
    }
    var content = document.getElementById('xptour-content');
    if (content) content.innerHTML = '';
};
