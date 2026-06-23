window.initXpTour = function() {
    let content = document.getElementById('xptour-content');
    if (!content) return;
    
    // Ruffle fails to properly emulate the Windows XP Tour's complex ActionScript 2 timeline navigation, 
    // resulting in a blank white screen. We are embedding a high-quality YouTube capture of the tour instead.
    content.innerHTML = `
        <iframe width="100%" height="100%" 
                src="https://www.youtube.com/embed/ysbS8ELv3RQ?autoplay=1&rel=0" 
                title="Windows XP Tour" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
        </iframe>
    `;
};

window.stopXpTour = function() {
    let content = document.getElementById('xptour-content');
    if (content) {
        content.innerHTML = '';
    }
};
