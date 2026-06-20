window.rufflePlayer = null;

window.initXpTour = function() {
    let content = document.getElementById('xptour-content');
    if (!content) return;
    
    // Check if Ruffle is loaded
    window.RufflePlayer = window.RufflePlayer || {};
    window.RufflePlayer.config = { "splashScreen": false };
    
    if (!window.RufflePlayer.newest) {
        let script = document.createElement('script');
        script.src = 'https://unpkg.com/@ruffle-rs/ruffle';
        script.onload = () => {
            startTour();
        };
        document.head.appendChild(script);
        content.innerHTML = '<div style="color:white; text-align:center; padding-top:20px; font-family:Tahoma;">Loading Tour Engine...</div>';
    } else {
        startTour();
    }
    
    function startTour() {
        if (!window.rufflePlayer) {
            content.innerHTML = '';
            const ruffle = window.RufflePlayer.newest();
            window.rufflePlayer = ruffle.createPlayer();
            window.rufflePlayer.style.width = '100%';
            window.rufflePlayer.style.height = '100%';
            content.appendChild(window.rufflePlayer);
        } else {
            try { window.rufflePlayer.volume = 1; window.rufflePlayer.play(); } catch(e){}
        }
        
        window.rufflePlayer.load({
            url: "xp tour/A-tour.swf",
            base: "xp tour/",
            allowScriptAccess: true
        });
    }
};

window.stopXpTour = function() {
    if (window.rufflePlayer) {
        try { window.rufflePlayer.pause(); window.rufflePlayer.volume = 0; } catch(e){}
    }
};
