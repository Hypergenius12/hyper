let mediaRecorder;
let audioChunks = [];
let recordingState = 'stopped'; // recording, stopped, playing
let testAudioUrl = null;
let simulatedTimer;

window.initSoundRecorder = function() {
    document.getElementById('sr-time').innerText = "Length: 0.00s";
};

window.startRecord = function() {
    if(recordingState !== 'stopped') return;
    
    recordingState = 'recording';
    document.getElementById('sr-status').innerText = "Recording...";
    audioChunks = [];
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = () => {
                    let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    testAudioUrl = URL.createObjectURL(audioBlob);
                    document.getElementById('sr-status').innerText = "Stopped";
                    recordingState = 'stopped';
                };
                mediaRecorder.start();
            })
            .catch(err => {
                console.log("Microphone access denied or error:", err);
                simulatedRecordFallback();
            });
    } else {
        simulatedRecordFallback();
    }
    
    let startTime = Date.now();
    simulatedTimer = setInterval(() => {
        if(recordingState !== 'recording') {
            clearInterval(simulatedTimer);
            return;
        }
        let length = ((Date.now() - startTime) / 1000).toFixed(2);
        document.getElementById('sr-time').innerText = "Length: " + length + "s";
    }, 100);
};

window.simulatedRecordFallback = function() {
    // Generate dummy audio blob if access fails
    testAudioUrl = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEF/AAACABAAZGF0YQAAAAA="; // extremely short tiny beep
};

window.stopRecord = function() {
    if(recordingState === 'recording') {
        if(mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        } else {
            document.getElementById('sr-status').innerText = "Stopped";
            recordingState = 'stopped';
        }
    }
};

window.playRecord = function() {
    if(recordingState === 'stopped' && testAudioUrl) {
        recordingState = 'playing';
        document.getElementById('sr-status').innerText = "Playing...";
        
        let audio = new Audio(testAudioUrl);
        audio.onended = () => {
            document.getElementById('sr-status').innerText = "Stopped";
            recordingState = 'stopped';
        };
        audio.play().catch(err => {
           console.log("Playback failed", err);
           document.getElementById('sr-status').innerText = "Stopped";
           recordingState = 'stopped';
        });
    }
};

window.saveRecord = function() {
    if(!testAudioUrl && !audioChunks.length) {
        if(typeof window.xpDialog === 'function') window.xpDialog("Sound Recorder", "No sound recorded to save.", "error");
        return;
    }
    
    if(typeof window.openFileDialog === 'function') {
        window.openFileDialog('save', 'Sound.wav', (pInfo) => {
            let filename = pInfo.filename;
            let destPath = pInfo.path;
            
            if(!filename.toLowerCase().endsWith('.wav')) filename += '.wav';
            
            let dir = window.resolvePath(destPath);
            if(dir) {
                let saveToFS = (base64) => {
                    dir[filename] = { type: "file", extension: "wav", content: base64, icon: "wav" };
                    window.saveFileSystem();
                    
                    if(window.currentPath === destPath && typeof window.renderExplorer === 'function') {
                        window.renderExplorer(window.currentPath); 
                    } else if(destPath === "C:\\Documents and Settings\\Administrator\\Desktop" && typeof window.renderDesktop === 'function') {
                        window.renderDesktop();
                    }
                    
                    if(typeof window.showBalloon === 'function') window.showBalloon("Sound Recorder", "Saved " + filename);
                };

                if (audioChunks.length > 0) {
                    let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    let reader = new FileReader();
                    reader.onloadend = function() {
                        saveToFS(reader.result);
                    }
                    reader.readAsDataURL(audioBlob);
                } else {
                    let contentToSave = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEF/AAACABAAZGF0YQAAAAA="; 
                    saveToFS(contentToSave);
                }
            }
        });
    }
};
