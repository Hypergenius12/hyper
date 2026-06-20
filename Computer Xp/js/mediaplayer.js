window.openMediaPlayer = function(filename, item, currentDir) {
    let win = document.getElementById('mediaplayer-window');
    let audio = document.getElementById('media-audio');
    let title = document.getElementById('media-title');
    
    if (item && item.content) {
        if (item.content.startsWith('RIFF') || item.content.startsWith('base64')) {
            audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEF/AAACABAAZGF0YQAAAAA="; 
        } else {
            audio.src = item.content; 
        }
        title.innerText = filename;
        audio.play().catch(e => console.log('Audio play blocked:', e));
    }
    
    if (typeof window.openProgram === 'function') {
        window.openProgram('mediaplayer-window');
    }
};

let audioCtx = null;
let analyser = null;
let dataArray = null;
let canvasCtx = null;
let visualizerCanvas = null;
let isVisualizerInit = false;

function initVisualizer() {
    if(isVisualizerInit) return;
    
    let container = document.getElementById('media-visualizer');
    if(!container) return;
    
    container.style.position = 'relative';
    
    visualizerCanvas = document.createElement('canvas');
    visualizerCanvas.width = 300;
    visualizerCanvas.height = 150;
    visualizerCanvas.style.width = '100%';
    visualizerCanvas.style.height = '100%';
    visualizerCanvas.style.position = 'absolute';
    visualizerCanvas.style.top = '0';
    visualizerCanvas.style.left = '0';
    visualizerCanvas.style.background = '#000';
    container.appendChild(visualizerCanvas);
    
    canvasCtx = visualizerCanvas.getContext('2d');
    
    try {
        let audio = document.getElementById('media-audio');
        let AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        let source = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        let bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        isVisualizerInit = true;
        drawVisualizer();
    } catch(e) {
        console.error("Audio API error:", e);
    }
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    if(!analyser || !canvasCtx) return;
    
    let audio = document.getElementById('media-audio');
    
    // Draw background
    canvasCtx.fillStyle = 'black';
    canvasCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    
    if(audio.paused || audio.ended) {
        // Draw idle waves if paused
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        canvasCtx.beginPath();
        let y = visualizerCanvas.height / 2;
        canvasCtx.moveTo(0, y);
        for(let i=0; i<visualizerCanvas.width; i+=5) {
            canvasCtx.lineTo(i, y + Math.sin(Date.now() / 200 + i) * 5);
        }
        canvasCtx.stroke();
        return;
    }
    
    analyser.getByteFrequencyData(dataArray);
    
    // Draw classic green bars
    let barWidth = (visualizerCanvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;
    
    for(let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;
        
        canvasCtx.fillStyle = 'rgb(0, ' + (barHeight + 100) + ', 0)';
        canvasCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let audio = document.getElementById('media-audio');
    if(audio) {
        audio.addEventListener('play', () => {
            if(!isVisualizerInit) initVisualizer();
            if(audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        });
    }

    let mpBtn = document.querySelector('#mediaplayer-window .win-btn:last-child');
    if(mpBtn) {
        mpBtn.addEventListener('click', () => {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }
});

window.triggerMediaPlayerOpen = function() {
    if(typeof window.openFileDialog === 'function') {
        window.openFileDialog('open', '', (pInfo) => {
            let dir = window.resolvePath(pInfo.path);
            if(dir && dir[pInfo.filename]) {
                let item = dir[pInfo.filename];
                if(item.extension === 'wav' || item.extension === 'mp3' || (item.content && item.content.startsWith('data:audio'))) {
                    window.openMediaPlayer(pInfo.filename, item, pInfo.path);
                } else {
                    window.xpDialog("Windows Media Player", "Cannot play file format.", "error");
                }
            }
        });
    }
};
window.toggleMediaPlayerCompact = function() {
    let win = document.getElementById('mediaplayer-window');
    if(!win) return;
    
    let isCompact = win.classList.toggle('compact-mode');
    let vis = document.getElementById('media-visualizer');
    let title = document.getElementById('media-title');
    let extraControls = document.getElementById('media-controls-extra');
    let menuBar = win.querySelector('.menu-bar');
    
    if(isCompact) {
        win.style.height = '160px';
        if(vis) vis.style.display = 'none';
        if(menuBar) menuBar.style.display = 'none';
        if(title) title.style.display = 'none';
        if(extraControls) extraControls.style.marginTop = '0';
    } else {
        win.style.height = '350px';
        if(vis) vis.style.display = 'block';
        if(menuBar) menuBar.style.display = 'flex';
        if(title) title.style.display = 'block';
        if(extraControls) extraControls.style.marginTop = '10px';
    }
};
