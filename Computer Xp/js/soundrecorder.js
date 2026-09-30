/* ============================================================
   SOUND RECORDER (sndrec32.exe) - WITH EFFECTS
   Effects: Increase Speed (100%), Decrease Speed, Add Echo, Reverse
   ============================================================ */

let mediaRecorder;
let audioChunks = [];
let recordingState = 'stopped'; // recording, stopped, playing
let testAudioUrl = null;
let simulatedTimer;
window.srAudioBuffer = null;

let srAudioCtx = null;
function getAudioContext() {
    if (!srAudioCtx) {
        let AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) srAudioCtx = new AudioContextClass();
    }
    if (srAudioCtx && srAudioCtx.state === 'suspended') {
        srAudioCtx.resume();
    }
    return srAudioCtx;
}

window.initSoundRecorder = function() {
    let t = document.getElementById('sr-time');
    if (t) t.innerText = "Length: 0.00s";
    let s = document.getElementById('sr-status');
    if (s) s.innerText = "Stopped";
};

// Generate default retro XP sound sample if nothing recorded yet
function generateDefaultSampleBuffer(ctx) {
    let sampleRate = ctx.sampleRate || 44100;
    let duration = 2.0; // 2 seconds
    let length = Math.floor(sampleRate * duration);
    let buffer = ctx.createBuffer(1, length, sampleRate);
    let data = buffer.getChannelData(0);

    // Chime chords: E5 (659.25Hz), G#5 (830.61Hz), B5 (987.77Hz), E6 (1318.51Hz)
    let freqs = [659.25, 830.61, 987.77, 1318.51];
    for (let i = 0; i < length; i++) {
        let t = i / sampleRate;
        let sample = 0;
        freqs.forEach((f, idx) => {
            let noteStart = idx * 0.25;
            if (t >= noteStart) {
                let noteT = t - noteStart;
                let env = Math.exp(-noteT * 3.5);
                sample += Math.sin(2 * Math.PI * f * noteT) * env * 0.25;
            }
        });
        data[i] = Math.max(-1, Math.min(1, sample));
    }
    return buffer;
}

// Convert AudioBuffer to standard 16-bit PCM WAV Blob
function audioBufferToWavBlob(buffer) {
    let numOfChan = buffer.numberOfChannels;
    let length = buffer.length * numOfChan * 2 + 44;
    let outBuffer = new ArrayBuffer(length);
    let view = new DataView(outBuffer);
    let channels = [];
    let pos = 0;

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }
    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    // "RIFF" chunk descriptor
    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    // "fmt " sub-chunk
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16); // 16-bit

    // "data" sub-chunk
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    let offset = 0;
    while (offset < buffer.length) {
        for (let i = 0; i < numOfChan; i++) {
            let sample = Math.max(-1, Math.min(1, channels[i][offset]));
            let intSample = sample < 0 ? sample * 32768 : sample * 32767;
            view.setInt16(pos, intSample | 0, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([outBuffer], { type: "audio/wav" });
}

// Ensure active AudioBuffer is loaded
async function ensureAudioBuffer() {
    let ctx = getAudioContext();
    if (!ctx) return null;

    if (window.srAudioBuffer) return window.srAudioBuffer;

    if (audioChunks.length > 0) {
        let blob = new Blob(audioChunks, { type: 'audio/wav' });
        let arrayBuf = await blob.arrayBuffer();
        try {
            window.srAudioBuffer = await ctx.decodeAudioData(arrayBuf);
            return window.srAudioBuffer;
        } catch(e) {}
    }

    if (testAudioUrl) {
        try {
            let res = await fetch(testAudioUrl);
            let arrayBuf = await res.arrayBuffer();
            window.srAudioBuffer = await ctx.decodeAudioData(arrayBuf);
            return window.srAudioBuffer;
        } catch(e) {}
    }

    // Fallback: Generate sample buffer
    window.srAudioBuffer = generateDefaultSampleBuffer(ctx);
    let blob = audioBufferToWavBlob(window.srAudioBuffer);
    testAudioUrl = URL.createObjectURL(blob);
    audioChunks = [blob];
    updateLengthDisplay(window.srAudioBuffer.duration);
    return window.srAudioBuffer;
}

function updateBufferState(newBuffer) {
    window.srAudioBuffer = newBuffer;
    let blob = audioBufferToWavBlob(newBuffer);
    testAudioUrl = URL.createObjectURL(blob);
    audioChunks = [blob];
    updateLengthDisplay(newBuffer.duration);
    let s = document.getElementById('sr-status');
    if (s) s.innerText = "Stopped";
    recordingState = 'stopped';
}

function updateLengthDisplay(dur) {
    let t = document.getElementById('sr-time');
    if (t) t.innerText = "Length: " + (dur || 0).toFixed(2) + "s";
}

// --- Effects Implementation ---

// 1. Increase Speed (100% = 2x speed, half duration)
window.srIncreaseSpeed = async function() {
    let buf = await ensureAudioBuffer();
    if (!buf) return;
    let ctx = getAudioContext();

    let newLen = Math.floor(buf.length / 2);
    if (newLen < 10) return;

    let newBuf = ctx.createBuffer(buf.numberOfChannels, newLen, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
        let src = buf.getChannelData(c);
        let dst = newBuf.getChannelData(c);
        for (let i = 0; i < newLen; i++) {
            dst[i] = src[i * 2];
        }
    }
    updateBufferState(newBuf);
    if (typeof window.showBalloon === 'function') window.showBalloon("Sound Recorder", "Speed increased by 100%.");
};

// 2. Decrease Speed (0.5x speed, double duration)
window.srDecreaseSpeed = async function() {
    let buf = await ensureAudioBuffer();
    if (!buf) return;
    let ctx = getAudioContext();

    let newLen = buf.length * 2;
    let newBuf = ctx.createBuffer(buf.numberOfChannels, newLen, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
        let src = buf.getChannelData(c);
        let dst = newBuf.getChannelData(c);
        for (let i = 0; i < newLen; i++) {
            let srcIdx = i / 2;
            let i0 = Math.floor(srcIdx);
            let i1 = Math.min(buf.length - 1, i0 + 1);
            let frac = srcIdx - i0;
            dst[i] = src[i0] * (1 - frac) + src[i1] * frac;
        }
    }
    updateBufferState(newBuf);
    if (typeof window.showBalloon === 'function') window.showBalloon("Sound Recorder", "Speed decreased.");
};

// 3. Add Echo
window.srAddEcho = async function() {
    let buf = await ensureAudioBuffer();
    if (!buf) return;
    let ctx = getAudioContext();

    let delaySamples = Math.floor(buf.sampleRate * 0.22); // ~220ms delay
    let feedback = 0.45;
    let newLen = buf.length + delaySamples;

    let newBuf = ctx.createBuffer(buf.numberOfChannels, newLen, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
        let src = buf.getChannelData(c);
        let dst = newBuf.getChannelData(c);
        for (let i = 0; i < newLen; i++) {
            let direct = (i < buf.length) ? src[i] : 0;
            let echo = (i >= delaySamples && (i - delaySamples < buf.length)) ? src[i - delaySamples] * feedback : 0;
            let val = direct + echo;
            dst[i] = Math.max(-1, Math.min(1, val));
        }
    }
    updateBufferState(newBuf);
    if (typeof window.showBalloon === 'function') window.showBalloon("Sound Recorder", "Echo added.");
};

// 4. Reverse
window.srReverse = async function() {
    let buf = await ensureAudioBuffer();
    if (!buf) return;
    let ctx = getAudioContext();

    let newBuf = ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
        let src = buf.getChannelData(c);
        let dst = newBuf.getChannelData(c);
        let len = buf.length;
        for (let i = 0; i < len; i++) {
            dst[i] = src[len - 1 - i];
        }
    }
    updateBufferState(newBuf);
    if (typeof window.showBalloon === 'function') window.showBalloon("Sound Recorder", "Sound reversed.");
};

// Volume adjustments
window.srIncreaseVolume = async function() {
    let buf = await ensureAudioBuffer();
    if (!buf) return;
    for (let c = 0; c < buf.numberOfChannels; c++) {
        let src = buf.getChannelData(c);
        for (let i = 0; i < buf.length; i++) {
            src[i] = Math.max(-1, Math.min(1, src[i] * 1.25));
        }
    }
    updateBufferState(buf);
};

window.srDecreaseVolume = async function() {
    let buf = await ensureAudioBuffer();
    if (!buf) return;
    for (let c = 0; c < buf.numberOfChannels; c++) {
        let src = buf.getChannelData(c);
        for (let i = 0; i < buf.length; i++) {
            src[i] = src[i] * 0.75;
        }
    }
    updateBufferState(buf);
};

// --- Record & Playback Controls ---

window.startRecord = function() {
    if(recordingState !== 'stopped') return;
    
    recordingState = 'recording';
    let s = document.getElementById('sr-status');
    if (s) s.innerText = "Recording...";
    audioChunks = [];
    window.srAudioBuffer = null;
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = async () => {
                    let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    testAudioUrl = URL.createObjectURL(audioBlob);
                    let st = document.getElementById('sr-status');
                    if (st) st.innerText = "Stopped";
                    recordingState = 'stopped';
                    // Decode to buffer
                    let ctx = getAudioContext();
                    if (ctx) {
                        try {
                            let ab = await audioBlob.arrayBuffer();
                            window.srAudioBuffer = await ctx.decodeAudioData(ab);
                            updateLengthDisplay(window.srAudioBuffer.duration);
                        } catch(e) {}
                    }
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
        let t = document.getElementById('sr-time');
        if (t) t.innerText = "Length: " + length + "s";
    }, 100);
};

window.simulatedRecordFallback = function() {
    let ctx = getAudioContext();
    if (ctx) {
        window.srAudioBuffer = generateDefaultSampleBuffer(ctx);
        let blob = audioBufferToWavBlob(window.srAudioBuffer);
        testAudioUrl = URL.createObjectURL(blob);
        audioChunks = [blob];
        updateLengthDisplay(window.srAudioBuffer.duration);
    }
    let st = document.getElementById('sr-status');
    if (st) st.innerText = "Stopped";
    recordingState = 'stopped';
};

window.stopRecord = function() {
    if(recordingState === 'recording') {
        if(mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        } else {
            let st = document.getElementById('sr-status');
            if (st) st.innerText = "Stopped";
            recordingState = 'stopped';
        }
    }
};

window.playRecord = function() {
    if(recordingState === 'stopped') {
        ensureAudioBuffer().then(() => {
            if(!testAudioUrl) return;
            recordingState = 'playing';
            let st = document.getElementById('sr-status');
            if (st) st.innerText = "Playing...";
            
            let audio = new Audio(testAudioUrl);
            audio.onended = () => {
                if (st) st.innerText = "Stopped";
                recordingState = 'stopped';
            };
            audio.play().catch(err => {
                console.log("Playback failed", err);
                if (st) st.innerText = "Stopped";
                recordingState = 'stopped';
            });
        });
    }
};

window.saveRecord = function() {
    if(!testAudioUrl && !audioChunks.length && !window.srAudioBuffer) {
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
                    if (typeof window.saveFileSystem === 'function') window.saveFileSystem();
                    
                    if(window.currentPath === destPath && typeof window.renderExplorer === 'function') {
                        window.renderExplorer(window.currentPath); 
                    } else if(destPath.includes("Desktop") && typeof window.renderDesktop === 'function') {
                        window.renderDesktop();
                    }
                    
                    if(typeof window.showBalloon === 'function') window.showBalloon("Sound Recorder", "Saved " + filename);
                };

                if (window.srAudioBuffer) {
                    let blob = audioBufferToWavBlob(window.srAudioBuffer);
                    let reader = new FileReader();
                    reader.onloadend = function() {
                        saveToFS(reader.result);
                    };
                    reader.readAsDataURL(blob);
                } else if (audioChunks.length > 0) {
                    let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    let reader = new FileReader();
                    reader.onloadend = function() {
                        saveToFS(reader.result);
                    };
                    reader.readAsDataURL(audioBlob);
                }
            }
        });
    }
};
