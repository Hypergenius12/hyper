window.rufflePlayer = null;
window.xptourLoading = false;
var ruffleScriptLoading = false;

window.initXpTour = function() {
    let content = document.getElementById('xptour-content');
    if (!content) return;

    // Prevent duplicate re-initialization if already loaded or loading
    if (window.rufflePlayer && content.contains(window.rufflePlayer)) {
        console.log('[XP Tour] Tour is already initialized and running.');
        return;
    }
    if (window.xptourLoading) {
        console.log('[XP Tour] Tour initialization already in progress.');
        return;
    }
    window.xptourLoading = true;

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
        "polyfills": true,
        "autoplay": "on",
        "unmuteOverlay": "hidden",
        "letterbox": "on"
    };

    if (!window.RufflePlayer.newest) {
        if (ruffleScriptLoading) return;
        ruffleScriptLoading = true;
        content.innerHTML = '<div style="color:white; text-align:center; padding-top:100px; font-family:Tahoma; font-size:14px;">Loading Windows XP Tour...</div>';
        var script = document.createElement('script');
        script.src = 'https://unpkg.com/@ruffle-rs/ruffle/ruffle.js';
        script.onload = function() {
            ruffleScriptLoading = false;
            console.log('[XP Tour] Modern Ruffle script loaded');
            setTimeout(function() { startTour(content, swfUrl, swfBase); }, 300);
        };
        script.onerror = function() {
            ruffleScriptLoading = false;
            window.xptourLoading = false;
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

    // Fully tear down any previous player and audio
    if (window.rufflePlayer) {
        try {
            window.rufflePlayer.pause();
            window.rufflePlayer.volume = 0;
            if (typeof window.rufflePlayer.mute === 'function') window.rufflePlayer.mute();
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
            window.xptourLoading = false;
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
            unmuteOverlay: "hidden",
            splashScreen: false
        }).then(function() {
            console.log('[XP Tour] SWF loaded successfully');
            window.xptourLoading = false;
            if (typeof player.unmute === 'function') player.unmute();
            if (player.audioContext && player.audioContext.state === 'suspended') {
                player.audioContext.resume().catch(function(){});
            }
        }).catch(function(e) {
            console.error('[XP Tour] SWF load error:', e);
            window.xptourLoading = false;
        });

        // Ensure user gestures unlock audio once without multiplying event listeners
        var unlockTourAudio = function() {
            try {
                if (window.rufflePlayer) {
                    if (typeof window.rufflePlayer.unmute === 'function') window.rufflePlayer.unmute();
                    if (window.rufflePlayer.audioContext && window.rufflePlayer.audioContext.state === 'suspended') {
                        window.rufflePlayer.audioContext.resume().catch(function(){});
                    }
                }
            } catch(e) {}
        };
        ['click', 'mousedown', 'keydown'].forEach(function(evt) {
            window.addEventListener(evt, unlockTourAudio, { passive: true, once: true });
        });
    } catch(e) {
        window.xptourLoading = false;
        console.error('[XP Tour] Error creating player:', e);
        content.innerHTML = '<div style="color:yellow; text-align:center; padding-top:100px; font-family:Tahoma;">Error: ' + e.message + '</div>';
    }
}

window.stopXpTour = function() {
    window.xptourLoading = false;
    if (window.rufflePlayer) {
        try {
            window.rufflePlayer.pause();
            window.rufflePlayer.volume = 0;
            if (typeof window.rufflePlayer.mute === 'function') window.rufflePlayer.mute();
            window.rufflePlayer.remove();
        } catch(e) {}
        window.rufflePlayer = null;
    }
    var content = document.getElementById('xptour-content');
    if (content) content.innerHTML = '';
};
