document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Visualizer
    const visualizer = new Visualizer('master-visualizer', audioEngine.analyser);
    document.getElementById('btn-toggle-visualizer').addEventListener('click', () => {
        visualizer.toggleMode();
    });
    
    // Visualizer Settings UI
    const visSettingsPanel = document.getElementById('visualizer-settings-panel');
    document.getElementById('btn-visualizer-settings').addEventListener('click', () => {
        const panel = document.getElementById('visualizer-settings-panel');
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    });
    
    document.getElementById('btn-close-vis-settings').addEventListener('click', () => {
        document.getElementById('visualizer-settings-panel').style.display = 'none';
    });
    
    document.getElementById('vis-blur').addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        document.getElementById('vis-blur-val').innerText = val + '%';
        visualizer.blurAmount = val / 100.0;
    });
    
    document.getElementById('vis-smooth').addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        document.getElementById('vis-smooth-val').innerText = val + '%';
        visualizer.setSmoothing(val / 100.0);
    });
    
    document.getElementById('vis-freeze').addEventListener('change', (e) => {
        visualizer.isFrozen = e.target.checked;
    });
    
    document.getElementById('vis-color-mode').addEventListener('change', (e) => {
        visualizer.colorMode = e.target.value;
    });
    
    const btnResetGlobal = document.getElementById('btn-reset-global');
    if (btnResetGlobal) {
        btnResetGlobal.addEventListener('click', () => {
            document.getElementById('vis-blur').value = 0;
            document.getElementById('vis-blur-val').innerText = '0%';
            visualizer.blurAmount = 0;
            
            document.getElementById('vis-smooth').value = 80;
            document.getElementById('vis-smooth-val').innerText = '80%';
            visualizer.setSmoothing(0.8);
            
            document.getElementById('vis-freeze').checked = false;
            visualizer.isFrozen = false;
            
            document.getElementById('vis-color-mode').value = 'accent';
            visualizer.colorMode = 'accent';
            
            const defaultColor = '#ff6b00';
            document.getElementById('theme-color-picker').value = defaultColor;
            document.documentElement.style.setProperty('--accent', defaultColor);
            
            alert('Studio settings and theme reset to factory default!');
        });
    }

    // 2. Initialize Wave Drawer
    const waveDrawer = new WaveDrawer('drawer-canvas');
    
    // 3. UI State
    let trackCount = 0;
    let selectedTrackId = null;
    let currentOctave = 0; // -2 to +2 (default 0 is C4-C5)
    
    // DOM Elements
    const tracksContainer = document.getElementById('tracks-container');
    const editorContainer = document.getElementById('editor-container');
    const editorEmptyState = document.getElementById('editor-empty-state');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    
    // Theme Color Picker
    const colorPicker = document.getElementById('theme-color-picker');
    colorPicker.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--accent', e.target.value);
    });
    
    // Tutorial Button
    document.getElementById('btn-tutorial').addEventListener('click', () => {
        if (window.tutorial) window.tutorial.start();
    });
    
    // 4. Global Controls & Transport
    const playBtn = document.getElementById('btn-play');
    playBtn.addEventListener('click', () => {
        if (!audioEngine.isPlaying) {
            audioEngine.play();
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
            playBtn.classList.add('playing');
        } else {
            audioEngine.stop();
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
            playBtn.classList.remove('playing');
        }
    });
    
    document.getElementById('btn-stop').addEventListener('click', () => {
        audioEngine.stop();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
        playBtn.classList.remove('playing');
        document.querySelectorAll('.piano-key').forEach(k => k.classList.remove('active'));
    });
    
    // 5. Track Management
    document.getElementById('btn-add-track').addEventListener('click', () => {
        createTrack();
    });
    document.getElementById('btn-add-track-side').addEventListener('click', () => {
        createTrack();
    });
    
    // 6. Preset Manager
    document.getElementById('btn-save-preset').addEventListener('click', () => {
        if (audioEngine.tracks.length === 0) {
            alert('No tracks to save!');
            return;
        }
        const presetName = prompt('Enter a name for this Studio Preset:', 'Analog Lead Synth');
        if (!presetName) return;
        
        const presetData = {
            name: presetName,
            tracks: audioEngine.tracks.map(t => t.toJSON())
        };
        
        let presets = JSON.parse(localStorage.getItem('nexus-presets') || '[]');
        presets.push(presetData);
        localStorage.setItem('nexus-presets', JSON.stringify(presets));
        alert(`Preset "${presetName}" saved to studio library!`);
    });
    
    document.getElementById('btn-load-preset').addEventListener('click', () => {
        const presets = JSON.parse(localStorage.getItem('nexus-presets') || '[]');
        if (presets.length === 0) {
            alert('No saved presets found in studio library.');
            return;
        }
        
        const presetNames = presets.map((p, i) => `${i + 1}: ${p.name}`).join('\n');
        const choice = prompt(`Select a studio preset to load (enter number):\n${presetNames}`);
        const idx = parseInt(choice) - 1;
        
        if (idx >= 0 && idx < presets.length) {
            const preset = presets[idx];
            [...audioEngine.tracks].forEach(t => audioEngine.removeTrack(t.id));
            selectedTrackId = null;
            renderTracksList();
            renderEditor();
            
            preset.tracks.forEach(tData => {
                const track = new Track(tData.id, tData.name, audioEngine.ctx);
                track.fromJSON(tData);
                audioEngine.addTrack(track);
            });
            
            renderTracksList();
            if (audioEngine.tracks.length > 0) {
                selectTrack(audioEngine.tracks[0].id);
            }
        }
    });

    function getTrackIcon(track) {
        if (track.type === 'buffer') return 'fa-file-audio';
        if (track.waveType === 'sine') return 'fa-wave-square';
        if (track.waveType === 'square') return 'fa-square';
        if (track.waveType === 'sawtooth') return 'fa-caret-up';
        if (track.waveType === 'triangle') return 'fa-play fa-rotate-270';
        if (track.waveType === 'custom') return 'fa-pen-ruler';
        return 'fa-music';
    }

    function createTrack(name = `Layer ${trackCount + 1}`, type = 'oscillator', buffer = null) {
        trackCount++;
        const id = `track-${Date.now()}`;
        const track = new Track(id, name, audioEngine.ctx);
        
        if (type === 'buffer' && buffer) {
            track.type = 'buffer';
            track.buffer = buffer;
        }
        
        audioEngine.addTrack(track);
        renderTracksList();
        selectTrack(id);
    }
    
    function renderTracksList() {
        tracksContainer.innerHTML = '';
        audioEngine.tracks.forEach(track => {
            const el = document.createElement('div');
            el.className = `track-item ${track.id === selectedTrackId ? 'active' : ''}`;
            el.innerHTML = `
                <div class="track-header">
                    <div class="track-title-wrapper">
                        <i class="fa-solid ${getTrackIcon(track)} track-icon"></i>
                        <span class="track-name">${track.name}</span>
                    </div>
                    <div class="track-actions">
                        <button class="track-btn mute ${track.isMuted ? 'active' : ''}" data-id="${track.id}" title="Mute Layer">M</button>
                        <button class="track-btn solo ${track.isSolo ? 'active' : ''}" data-id="${track.id}" title="Solo Layer">S</button>
                        <button class="track-btn mutate" data-id="${track.id}" title="Mutate Synthesizer Parameters"><i class="fa-solid fa-dice"></i></button>
                        <button class="track-btn delete" data-id="${track.id}" title="Delete Layer"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
            
            el.addEventListener('click', (e) => {
                if (e.target.closest('.track-btn')) return;
                selectTrack(track.id);
            });
            
            tracksContainer.appendChild(el);
        });
        
        // Bind Track Buttons
        document.querySelectorAll('.track-btn.mute').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const track = audioEngine.getTrack(id);
                track.isMuted = !track.isMuted;
                renderTracksList();
            });
        });
        
        document.querySelectorAll('.track-btn.solo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const track = audioEngine.getTrack(id);
                track.isSolo = !track.isSolo;
                audioEngine.tracks.forEach(t => {
                    if (t.id !== id) t.isMuted = track.isSolo;
                });
                renderTracksList();
            });
        });

        document.querySelectorAll('.track-btn.mutate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const track = audioEngine.getTrack(id);
                track.mutate();
                if (selectedTrackId === id) renderEditor();
                renderTracksList();
            });
        });
        
        document.querySelectorAll('.track-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                audioEngine.removeTrack(id);
                if (selectedTrackId === id) {
                    const remaining = audioEngine.tracks;
                    selectTrack(remaining.length > 0 ? remaining[0].id : null);
                } else {
                    renderTracksList();
                }
            });
        });
    }
    
    function selectTrack(id) {
        selectedTrackId = id;
        renderTracksList();
        renderEditor();
    }
    
    // 7. Dynamic ADSR & Filter Graphics
    function drawADSRCurve(canvas, track) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        
        // Background Grid
        ctx.strokeStyle = '#181824';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < w; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 0; y < h; y += 15) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        const totalTime = Math.max(0.5, track.attack + track.decay + 1.0 + track.release);
        const pad = 8;
        const availW = w - pad * 2;
        const availH = h - pad * 2;
        
        const aW = (track.attack / totalTime) * availW;
        const dW = (track.decay / totalTime) * availW;
        const sW = (1.0 / totalTime) * availW;
        const rW = (track.release / totalTime) * availW;
        
        const x0 = pad;
        const y0 = h - pad;
        const x1 = x0 + aW;
        const y1 = pad;
        const x2 = x1 + dW;
        const y2 = h - pad - (track.sustain * availH);
        const x3 = x2 + sW;
        const y3 = y2;
        const x4 = x3 + rW;
        const y4 = y0;

        // Gradient Fill
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(255, 107, 0, 0.4)');
        grad.addColorStop(1, 'rgba(255, 107, 0, 0.02)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();

        // Stroke Line
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff6b00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.stroke();

        // Control Points
        const points = [[x0,y0], [x1,y1], [x2,y2], [x3,y3], [x4,y4]];
        ctx.fillStyle = '#fff';
        points.forEach(([px, py]) => {
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // 8. Editor Rendering
    function renderEditor() {
        if (!selectedTrackId) {
            editorContainer.innerHTML = '';
            editorContainer.appendChild(editorEmptyState);
            editorEmptyState.style.display = 'block';
            return;
        }
        
        editorEmptyState.style.display = 'none';
        const track = audioEngine.getTrack(selectedTrackId);
        if (!track) return;
        
        let oscControls = '';
        if (track.type === 'oscillator') {
            oscControls = `
                <div class="editor-section">
                    <div class="editor-section-header">
                        <h3><i class="fa-solid fa-wave-square"></i> VCO 1 (Oscillator & FM)</h3>
                    </div>
                    <div class="control-grid">
                        <div class="control-group">
                            <label class="control-label">Waveform</label>
                            <select id="edit-waveType">
                                <option value="sine" ${track.waveType==='sine'?'selected':''}>∿ Sine</option>
                                <option value="square" ${track.waveType==='square'?'selected':''}>⊓ Square</option>
                                <option value="sawtooth" ${track.waveType==='sawtooth'?'selected':''}>⩓ Sawtooth</option>
                                <option value="triangle" ${track.waveType==='triangle'?'selected':''}>△ Triangle</option>
                                <option value="custom" ${track.waveType==='custom'?'selected':''}>✎ Custom (Drawn)</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label class="control-label">Base Pitch <i class="fa-solid fa-circle-info info-tooltip" title="Carrier frequency (Hz)"></i></label>
                            <input type="range" id="edit-freq" min="20" max="2000" step="1" value="${track.frequency}">
                            <span class="val-display">${track.frequency} Hz</span>
                        </div>
                        <div class="control-group">
                            <label class="control-label">Detune <i class="fa-solid fa-circle-info info-tooltip" title="Fine pitch in cents (100 cents = 1 semitone)"></i></label>
                            <input type="range" id="edit-detune" min="-1200" max="1200" step="1" value="${track.detune}">
                            <span class="val-display">${track.detune} cents</span>
                        </div>
                        <div class="control-group">
                            <label class="control-label">FM Ratio <i class="fa-solid fa-circle-info info-tooltip" title="Frequency ratio of the FM modulator oscillator"></i></label>
                            <input type="range" id="edit-fmRatio" min="0.1" max="10" step="0.1" value="${track.fmRatio}">
                            <span class="val-display">${track.fmRatio}x</span>
                        </div>
                        <div class="control-group">
                            <label class="control-label">FM Depth <i class="fa-solid fa-circle-info info-tooltip" title="Intensity of frequency modulation synthesis"></i></label>
                            <input type="range" id="edit-fmDepth" min="0" max="1000" step="1" value="${track.fmDepth}">
                            <span class="val-display">${track.fmDepth}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            oscControls = `
                <div class="editor-section">
                    <div class="editor-section-header">
                        <h3><i class="fa-solid fa-file-audio"></i> Sample Playback Engine</h3>
                    </div>
                    <div class="control-grid">
                        <div class="control-group">
                            <label class="control-label">Pitch Scale (Ref 440 Hz)</label>
                            <input type="range" id="edit-freq" min="20" max="2000" step="1" value="${track.frequency}">
                            <span class="val-display">${track.frequency} Hz</span>
                        </div>
                    </div>
                </div>
            `;
        }

        const editorHTML = `
            ${oscControls}
            <div class="editor-section">
                <div class="editor-section-header">
                    <h3><i class="fa-solid fa-chart-area"></i> VCA Envelope (ADSR)</h3>
                </div>
                <canvas id="adsr-canvas" class="graph-preview-canvas" width="400" height="80"></canvas>
                <div class="control-grid">
                    <div class="control-group">
                        <label class="control-label">Attack <i class="fa-solid fa-circle-info info-tooltip" title="Rise time to peak volume"></i></label>
                        <input type="range" id="edit-attack" min="0" max="5" step="0.01" value="${track.attack}">
                        <span class="val-display">${track.attack}s</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Decay <i class="fa-solid fa-circle-info info-tooltip" title="Time to fall to sustain level"></i></label>
                        <input type="range" id="edit-decay" min="0" max="5" step="0.01" value="${track.decay}">
                        <span class="val-display">${track.decay}s</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Sustain <i class="fa-solid fa-circle-info info-tooltip" title="Sustained volume level during hold"></i></label>
                        <input type="range" id="edit-sustain" min="0" max="1" step="0.01" value="${track.sustain}">
                        <span class="val-display">${track.sustain}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Release <i class="fa-solid fa-circle-info info-tooltip" title="Fadeout time upon note release"></i></label>
                        <input type="range" id="edit-release" min="0" max="5" step="0.01" value="${track.release}">
                        <span class="val-display">${track.release}s</span>
                    </div>
                </div>
            </div>
            
            <div class="editor-section">
                <div class="editor-section-header">
                    <h3><i class="fa-solid fa-filter"></i> VCF Filter & Sound Shaper</h3>
                </div>
                <div class="control-grid">
                    <div class="control-group">
                        <label class="control-label">Filter Type</label>
                        <select id="edit-filterType">
                            <option value="lowpass" ${track.filterType==='lowpass'?'selected':''}>Lowpass 24dB</option>
                            <option value="highpass" ${track.filterType==='highpass'?'selected':''}>Highpass 24dB</option>
                            <option value="bandpass" ${track.filterType==='bandpass'?'selected':''}>Bandpass</option>
                            <option value="notch" ${track.filterType==='notch'?'selected':''}>Notch Filter</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Cutoff <i class="fa-solid fa-circle-info info-tooltip" title="Filter cutoff threshold frequency"></i></label>
                        <input type="range" id="edit-filterFreq" min="20" max="20000" step="1" value="${track.filterFreq}">
                        <span class="val-display">${track.filterFreq} Hz</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Resonance (Q) <i class="fa-solid fa-circle-info info-tooltip" title="Resonance peak boost at cutoff"></i></label>
                        <input type="range" id="edit-filterQ" min="0.0001" max="100" step="0.1" value="${track.filterQ}">
                        <span class="val-display">${track.filterQ}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Drive Distortion <i class="fa-solid fa-circle-info info-tooltip" title="Analog soft-clipping harmonics"></i></label>
                        <input type="range" id="edit-distortionAmount" min="0" max="100" step="1" value="${track.distortionAmount}">
                        <span class="val-display">${track.distortionAmount}</span>
                    </div>
                </div>
            </div>

            <div class="editor-section">
                <div class="editor-section-header">
                    <h3><i class="fa-solid fa-arrows-spin"></i> Modulation LFO</h3>
                </div>
                <div class="control-grid">
                    <div class="control-group">
                        <label class="control-label">LFO Target</label>
                        <select id="edit-lfoTarget">
                            <option value="none" ${track.lfoTarget==='none'?'selected':''}>None (Bypassed)</option>
                            <option value="pitch" ${track.lfoTarget==='pitch'?'selected':''}>Pitch (Vibrato)</option>
                            <option value="filter" ${track.lfoTarget==='filter'?'selected':''}>Filter (Wobble)</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label class="control-label">LFO Rate <i class="fa-solid fa-circle-info info-tooltip" title="LFO modulation speed in Hz"></i></label>
                        <input type="range" id="edit-lfoRate" min="0.1" max="20" step="0.1" value="${track.lfoRate}">
                        <span class="val-display">${track.lfoRate} Hz</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">LFO Depth <i class="fa-solid fa-circle-info info-tooltip" title="Modulation intensity"></i></label>
                        <input type="range" id="edit-lfoDepth" min="0" max="100" step="1" value="${track.lfoDepth}">
                        <span class="val-display">${track.lfoDepth}</span>
                    </div>
                </div>
            </div>
            
            <div class="editor-section">
                <div class="editor-section-header">
                    <h3><i class="fa-solid fa-wand-magic-sparkles"></i> Studio Effects & Spatial Radar</h3>
                </div>
                <div class="control-grid">
                    <div class="control-group">
                        <label class="control-label">Delay Time</label>
                        <input type="range" id="edit-delayTime" min="0" max="2" step="0.01" value="${track.delayTime}">
                        <span class="val-display">${track.delayTime}s</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Delay Feedback</label>
                        <input type="range" id="edit-delayFeedback" min="0" max="0.9" step="0.01" value="${track.delayFeedback}">
                        <span class="val-display">${track.delayFeedback}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Reverb Mix</label>
                        <input type="range" id="edit-reverbMix" min="0" max="1" step="0.01" value="${track.reverbMix}">
                        <span class="val-display">${track.reverbMix}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Chorus Mix</label>
                        <input type="range" id="edit-chorusMix" min="0" max="1" step="0.01" value="${track.chorusMix}">
                        <span class="val-display">${track.chorusMix}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Track Gain</label>
                        <input type="range" id="edit-gain" min="0" max="2" step="0.01" value="${track.gain}">
                        <span class="val-display">${track.gain}</span>
                    </div>
                    <div class="control-group" style="grid-column: span 2;">
                        <label class="control-label">3D HRTF Spatial Scope <i class="fa-solid fa-circle-info info-tooltip" title="Position sound in 3D binaural space"></i></label>
                        <canvas id="radar-${track.id}" width="120" height="120" style="background: #090e12; border: 1px solid #1e3a2e; border-radius: 50%; cursor: crosshair; display: block; margin: 0 auto; box-shadow: inset 0 0 12px rgba(0,255,150,0.15);"></canvas>
                        <span class="val-display" id="radar-val-${track.id}">X: ${track.panX.toFixed(1)}, Z: ${track.panZ.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        `;
        
        editorContainer.innerHTML = editorHTML;
        
        const adsrCanvas = document.getElementById('adsr-canvas');
        drawADSRCurve(adsrCanvas, track);

        // Bind UI to track updates
        const bindInput = (id, prop, isFloat = true) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => {
                const val = isFloat ? parseFloat(e.target.value) : e.target.value;
                track[prop] = val;
                if (e.target.nextElementSibling && (e.target.nextElementSibling.classList.contains('val-display') || e.target.nextElementSibling.classList.contains('val'))) {
                    e.target.nextElementSibling.innerText = e.target.value + (id.includes('freq') || id.includes('Freq') ? ' Hz' : id.includes('detune') ? ' cents' : id.includes('attack')||id.includes('decay')||id.includes('release')||id.includes('delayTime') ? 's' : id.includes('fmRatio') ? 'x' : '');
                }
                track.updateNodes();
                
                if (['edit-attack', 'edit-decay', 'edit-sustain', 'edit-release'].includes(id)) {
                    drawADSRCurve(adsrCanvas, track);
                }

                if (audioEngine.isPlaying && track.activeSources.length > 0) {
                    track.activeSources.forEach(({source, lfoOsc}) => {
                        if (id === 'edit-freq' && track.type === 'oscillator') {
                            source.frequency.setValueAtTime(val, audioEngine.ctx.currentTime);
                        } else if (id === 'edit-freq' && track.type === 'buffer') {
                            source.playbackRate.setValueAtTime(val / 440, audioEngine.ctx.currentTime);
                        } else if (id === 'edit-detune') {
                            source.detune.setValueAtTime(val, audioEngine.ctx.currentTime);
                        } else if (id === 'edit-lfoRate' && lfoOsc) {
                            lfoOsc.frequency.setValueAtTime(val, audioEngine.ctx.currentTime);
                        }
                    });
                }
            });
        };
        
        bindInput('edit-waveType', 'waveType', false);
        bindInput('edit-freq', 'frequency');
        bindInput('edit-detune', 'detune');
        bindInput('edit-fmRatio', 'fmRatio');
        bindInput('edit-fmDepth', 'fmDepth');
        bindInput('edit-chorusMix', 'chorusMix');
        
        bindInput('edit-attack', 'attack');
        bindInput('edit-decay', 'decay');
        bindInput('edit-sustain', 'sustain');
        bindInput('edit-release', 'release');
        
        bindInput('edit-lfoTarget', 'lfoTarget', false);
        bindInput('edit-lfoRate', 'lfoRate');
        bindInput('edit-lfoDepth', 'lfoDepth');
        bindInput('edit-distortionAmount', 'distortionAmount');
        
        bindInput('edit-filterType', 'filterType', false);
        bindInput('edit-filterFreq', 'filterFreq');
        bindInput('edit-filterQ', 'filterQ');
        
        bindInput('edit-delayTime', 'delayTime');
        bindInput('edit-delayFeedback', 'delayFeedback');
        bindInput('edit-reverbMix', 'reverbMix');
        
        bindInput('edit-gain', 'gain');

        // Initialize 3D Sonar Radar
        const radarCanvas = document.getElementById(`radar-${track.id}`);
        if (radarCanvas) {
            const ctx = radarCanvas.getContext('2d');
            let isDragging = false;
            
            const drawRadar = () => {
                ctx.clearRect(0, 0, 120, 120);
                
                // Radar Rings
                ctx.strokeStyle = '#1e4030';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(60, 60, 25, 0, Math.PI * 2);
                ctx.arc(60, 60, 50, 0, Math.PI * 2);
                ctx.moveTo(60, 0); ctx.lineTo(60, 120);
                ctx.moveTo(0, 60); ctx.lineTo(120, 60);
                ctx.stroke();
                
                // Listener Head Icon in Center
                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.arc(60, 60, 4, 0, Math.PI * 2);
                ctx.fill();

                // Sound Source Dot
                const px = ((track.panX + 10) / 20) * 120;
                const pz = ((track.panZ + 10) / 20) * 120;
                
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff6b00';
                ctx.beginPath();
                ctx.arc(px, pz, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowBlur = 0;
            };
            drawRadar();
            
            const updateRadar = (e) => {
                const rect = radarCanvas.getBoundingClientRect();
                const x = Math.max(0, Math.min(120, e.clientX - rect.left));
                const y = Math.max(0, Math.min(120, e.clientY - rect.top));
                
                track.panX = ((x / 120) * 20) - 10;
                track.panZ = ((y / 120) * 20) - 10;
                
                document.getElementById(`radar-val-${track.id}`).innerText = `X: ${track.panX.toFixed(1)}, Z: ${track.panZ.toFixed(1)}`;
                track.updateNodes();
                drawRadar();
            };
            
            radarCanvas.addEventListener('mousedown', (e) => { isDragging = true; updateRadar(e); });
            window.addEventListener('mousemove', (e) => { if (isDragging) updateRadar(e); });
            window.addEventListener('mouseup', () => { isDragging = false; });
        }

        document.getElementById('edit-waveType')?.addEventListener('change', (e) => {
            if (e.target.value === 'custom' && !track.customWave) {
                alert("Draw and apply a custom wave in the Wave Lab panel first.");
                e.target.value = 'sine';
                track.waveType = 'sine';
            }
        });
    }

    // 9. Interactive Piano Keybed (GarageBand Experience)
    const pianoNotes = [
        { note: 'C4', key: 'a', isBlack: false, baseFreq: 261.63 },
        { note: 'C#4', key: 'w', isBlack: true, baseFreq: 277.18, offset: '9.25%' },
        { note: 'D4', key: 's', isBlack: false, baseFreq: 293.66 },
        { note: 'D#4', key: 'e', isBlack: true, baseFreq: 311.13, offset: '21.75%' },
        { note: 'E4', key: 'd', isBlack: false, baseFreq: 329.63 },
        { note: 'F4', key: 'f', isBlack: false, baseFreq: 349.23 },
        { note: 'F#4', key: 't', isBlack: true, baseFreq: 369.99, offset: '46.75%' },
        { note: 'G4', key: 'g', isBlack: false, baseFreq: 392.00 },
        { note: 'G#4', key: 'y', isBlack: true, baseFreq: 415.30, offset: '59.25%' },
        { note: 'A4', key: 'h', isBlack: false, baseFreq: 440.00 },
        { note: 'A#4', key: 'u', isBlack: true, baseFreq: 466.16, offset: '71.75%' },
        { note: 'B4', key: 'j', isBlack: false, baseFreq: 493.88 },
        { note: 'C5', key: 'k', isBlack: false, baseFreq: 523.25 }
    ];

    const keybedEl = document.getElementById('piano-keybed');
    let isMouseDown = false;
    window.addEventListener('mousedown', () => isMouseDown = true);
    window.addEventListener('mouseup', () => {
        isMouseDown = false;
        // Stop any active notes that were mouse-held
        Object.keys(activeKeys).forEach(key => {
            if (activeKeys[key] && !physicalKeysHeld[key]) {
                stopKeyNote(key);
            }
        });
    });

    function getShiftedFreq(baseFreq) {
        return baseFreq * Math.pow(2, currentOctave);
    }

    function renderPianoKeybed() {
        if (!keybedEl) return;
        keybedEl.innerHTML = '';
        
        // Render White Keys First
        pianoNotes.filter(n => !n.isBlack).forEach(n => {
            const keyEl = document.createElement('div');
            keyEl.className = 'white-key piano-key';
            keyEl.dataset.key = n.key;
            keyEl.innerHTML = `
                <span class="key-label" style="font-size: 0.6rem; opacity: 0.6;">${n.note.replace('4', 4 + currentOctave).replace('5', 5 + currentOctave)}</span>
                <span class="key-label">${n.key.toUpperCase()}</span>
            `;
            
            keyEl.addEventListener('mousedown', (e) => {
                e.preventDefault();
                triggerKeyNote(n.key);
            });
            keyEl.addEventListener('mouseenter', () => {
                if (isMouseDown) triggerKeyNote(n.key);
            });
            keyEl.addEventListener('mouseleave', () => {
                if (!physicalKeysHeld[n.key]) stopKeyNote(n.key);
            });
            
            keybedEl.appendChild(keyEl);
        });

        // Render Black Keys
        pianoNotes.filter(n => n.isBlack).forEach(n => {
            const keyEl = document.createElement('div');
            keyEl.className = 'black-key piano-key';
            keyEl.dataset.key = n.key;
            keyEl.style.left = n.offset;
            keyEl.innerHTML = `
                <span class="key-label" style="font-size: 0.55rem; opacity: 0.6;">${n.note.replace('4', 4 + currentOctave)}</span>
                <span class="key-label">${n.key.toUpperCase()}</span>
            `;
            
            keyEl.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                triggerKeyNote(n.key);
            });
            keyEl.addEventListener('mouseenter', () => {
                if (isMouseDown) triggerKeyNote(n.key);
            });
            keyEl.addEventListener('mouseleave', () => {
                if (!physicalKeysHeld[n.key]) stopKeyNote(n.key);
            });
            
            keybedEl.appendChild(keyEl);
        });
    }

    // Octave Shifting
    const octDownBtn = document.getElementById('btn-oct-down');
    const octUpBtn = document.getElementById('btn-oct-up');
    const lcdOctaveVal = document.getElementById('lcd-octave-val');

    if (octDownBtn && octUpBtn) {
        octDownBtn.addEventListener('click', () => {
            if (currentOctave > -2) {
                currentOctave--;
                updateOctaveDisplay();
            }
        });
        octUpBtn.addEventListener('click', () => {
            if (currentOctave < 2) {
                currentOctave++;
                updateOctaveDisplay();
            }
        });
    }

    function updateOctaveDisplay() {
        const baseStart = 4 + currentOctave;
        const baseEnd = 5 + currentOctave;
        if (lcdOctaveVal) lcdOctaveVal.innerText = `C${baseStart}-C${baseEnd}`;
        renderPianoKeybed();
    }

    renderPianoKeybed();

    // 10. Playback & Arpeggiator Voice Logic
    const activeKeys = {};
    const physicalKeysHeld = {};
    let arpEnabled = false;
    let arpBPM = 120;
    let heldNotes = [];
    let arpInterval = null;
    let currentArpIndex = 0;
    let lastArpFreq = null;
    
    const arpToggle = document.getElementById('arp-toggle');
    const arpBpmSlider = document.getElementById('arp-bpm');
    const arpBpmVal = document.getElementById('arp-bpm-val');
    const lcdBpmVal = document.getElementById('lcd-bpm-val');
    
    if (arpToggle) {
        arpToggle.addEventListener('change', (e) => {
            arpEnabled = e.target.checked;
            if (arpEnabled) {
                heldNotes = [];
                Object.keys(activeKeys).forEach(k => {
                    const noteObj = pianoNotes.find(n => n.key === k);
                    if (activeKeys[k] && noteObj) {
                        heldNotes.push(getShiftedFreq(noteObj.baseFreq));
                    }
                });
                heldNotes.sort((a,b) => a - b);
                startArp();
            } else {
                stopArp();
            }
        });
    }
    
    if (arpBpmSlider) {
        arpBpmSlider.addEventListener('input', (e) => {
            arpBPM = parseInt(e.target.value, 10);
            if (arpBpmVal) arpBpmVal.innerText = arpBPM;
            if (lcdBpmVal) lcdBpmVal.innerText = arpBPM;
            if (arpEnabled) {
                stopArp();
                startArp();
            }
        });
    }
    
    function startArp() {
        if (arpInterval) clearInterval(arpInterval);
        const msPer16th = (60000 / arpBPM) / 4;
        
        arpInterval = setInterval(() => {
            if (heldNotes.length === 0) return;
            const track = audioEngine.getTrack(selectedTrackId);
            if (!track) return;
            
            if (lastArpFreq) {
                track.stop(audioEngine.ctx.currentTime, lastArpFreq);
            }
            
            if (currentArpIndex >= heldNotes.length) currentArpIndex = 0;
            const freq = heldNotes[currentArpIndex];
            
            if (audioEngine.ctx.state === 'suspended') audioEngine.ctx.resume();
            track.play(audioEngine.ctx.currentTime, freq);
            
            const stopTime = audioEngine.ctx.currentTime + (msPer16th / 1000) * 0.9;
            track.stop(stopTime, freq);
            
            lastArpFreq = freq;
            currentArpIndex++;
        }, msPer16th);
    }
    
    function stopArp() {
        if (arpInterval) clearInterval(arpInterval);
        arpInterval = null;
        if (lastArpFreq && selectedTrackId) {
            const track = audioEngine.getTrack(selectedTrackId);
            if (track) track.stop(audioEngine.ctx.currentTime, lastArpFreq);
            lastArpFreq = null;
        }
    }

    function triggerKeyNote(key) {
        const noteObj = pianoNotes.find(n => n.key === key);
        if (!noteObj || !selectedTrackId) return;
        
        if (audioEngine.ctx.state === 'suspended') audioEngine.ctx.resume();
        activeKeys[key] = true;
        
        // Highlight Visual Key
        const keyEl = document.querySelector(`.piano-key[data-key="${key}"]`);
        if (keyEl) keyEl.classList.add('active');
        
        const freq = getShiftedFreq(noteObj.baseFreq);
        if (arpEnabled) {
            if (!heldNotes.includes(freq)) {
                heldNotes.push(freq);
                heldNotes.sort((a,b) => a - b);
            }
        } else {
            const track = audioEngine.getTrack(selectedTrackId);
            if (track) track.play(audioEngine.ctx.currentTime, freq);
        }
    }

    function stopKeyNote(key) {
        const noteObj = pianoNotes.find(n => n.key === key);
        if (!noteObj || !selectedTrackId) return;
        
        activeKeys[key] = false;
        
        // Unhighlight Visual Key
        const keyEl = document.querySelector(`.piano-key[data-key="${key}"]`);
        if (keyEl) keyEl.classList.remove('active');
        
        const freq = getShiftedFreq(noteObj.baseFreq);
        if (arpEnabled) {
            heldNotes = heldNotes.filter(f => f !== freq);
            if (heldNotes.length === 0) currentArpIndex = 0;
        } else {
            const track = audioEngine.getTrack(selectedTrackId);
            if (track) track.stop(audioEngine.ctx.currentTime, freq);
        }
    }

    window.addEventListener('keydown', (e) => {
        if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const key = e.key.toLowerCase();
        if (pianoNotes.some(n => n.key === key)) {
            physicalKeysHeld[key] = true;
            triggerKeyNote(key);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const key = e.key.toLowerCase();
        if (pianoNotes.some(n => n.key === key)) {
            physicalKeysHeld[key] = false;
            stopKeyNote(key);
        }
    });

    // 11. Wave Lab Application
    document.getElementById('btn-drawer-apply').addEventListener('click', () => {
        if (!selectedTrackId) {
            alert("Select a sound layer first.");
            return;
        }
        const track = audioEngine.getTrack(selectedTrackId);
        if (track.type !== 'oscillator') {
            alert("Wave lab only compiles to Synthesizer oscillator tracks.");
            return;
        }
        
        const harmonics = parseInt(document.getElementById('drawer-harmonics').value, 10);
        const { periodicWave } = waveDrawer.createPeriodicWave(audioEngine.ctx, harmonics);
        track.customWave = periodicWave;
        track.waveType = 'custom';
        
        const waveSelect = document.getElementById('edit-waveType');
        if (waveSelect) waveSelect.value = 'custom';
        
        if (audioEngine.isPlaying && track.activeSources.length > 0) {
            track.activeSources.forEach(({source}) => {
                try { source.setPeriodicWave(periodicWave); } catch(e) {}
            });
        }
        
        const btn = document.getElementById('btn-drawer-apply');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Applied!';
        setTimeout(() => btn.innerHTML = orig, 1000);
    });
    
    document.getElementById('btn-drawer-clear').addEventListener('click', () => waveDrawer.clear());
    document.getElementById('btn-drawer-smooth').addEventListener('click', () => waveDrawer.smooth());
    document.getElementById('btn-drawer-invert').addEventListener('click', () => waveDrawer.invert());
    document.getElementById('btn-drawer-noise').addEventListener('click', () => waveDrawer.noise());
    document.getElementById('btn-drawer-normalize').addEventListener('click', () => waveDrawer.normalize());

    // Preset waves in drawer
    document.querySelectorAll('.preset-waves .btn[data-wave]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const wave = e.currentTarget.dataset.wave;
            waveDrawer.clear();
            const points = [];
            const w = waveDrawer.width;
            const h = waveDrawer.height;
            for (let x = 0; x < w; x++) {
                let y = h/2;
                const phase = (x / w) * Math.PI * 2;
                if (wave === 'sine') {
                    y = h/2 - Math.sin(phase) * (h/2 - 10);
                } else if (wave === 'square') {
                    y = phase < Math.PI ? 10 : h - 10;
                } else if (wave === 'sawtooth') {
                    y = h - 10 - ((x / w) * (h - 20));
                } else if (wave === 'triangle') {
                    y = phase < Math.PI ? (h-10) - (phase/Math.PI)*(h-20) : 10 + ((phase-Math.PI)/Math.PI)*(h-20);
                }
                points.push({x, y});
            }
            waveDrawer.points = points;
            waveDrawer.render();
        });
    });

    // 12. Audio Sample Import
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const arrayBuffer = ev.target.result;
            try {
                const audioBuffer = await audioEngine.ctx.decodeAudioData(arrayBuffer);
                createTrack(file.name.replace(/\.[^/.]+$/, ""), 'buffer', audioBuffer);
            } catch (err) {
                alert("Error decoding audio file.");
            }
        };
        reader.readAsArrayBuffer(file);
    });

    // 13. Export Engine
    async function doExport(format) {
        if (audioEngine.tracks.length === 0) {
            alert("No tracks to export! Add a layer first.");
            return;
        }
        
        loadingText.innerText = `Rendering ${format.toUpperCase()} Mixdown...`;
        loadingOverlay.classList.remove('hidden');
        await new Promise(r => setTimeout(r, 100));
        
        try {
            const renderedBuffer = await audioEngine.renderOffline(6);
            if (format === 'wav') {
                await AudioExporter.exportWAV(renderedBuffer);
            } else if (format === 'mp3') {
                await AudioExporter.exportMP3(renderedBuffer);
            }
        } catch(e) {
            console.error(e);
            alert("Export failed: " + e.message);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }

    document.getElementById('btn-export-wav').addEventListener('click', () => doExport('wav'));
    document.getElementById('btn-export-mp3').addEventListener('click', () => doExport('mp3'));

    // 14. 16-Step Matrix Sequencer
    const numSteps = 16;
    const seqNotes = [523.25, 493.88, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63];
    const seqGrid = document.getElementById('sequencer-grid');
    let seqState = Array(seqNotes.length).fill(0).map(() => Array(numSteps).fill(false));
    let seqPlaying = false;
    let seqStep = 0;
    let seqInterval = null;
    let seqElements = [];
    
    if (seqGrid) {
        seqNotes.forEach((freq, rowIdx) => {
            const label = document.createElement('div');
            label.style.color = 'var(--text-secondary)';
            label.style.fontSize = '0.65rem';
            label.style.fontFamily = 'monospace';
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.innerText = Math.round(freq) + 'Hz';
            seqGrid.appendChild(label);
            
            const rowElements = [];
            for (let colIdx = 0; colIdx < numSteps; colIdx++) {
                const cell = document.createElement('div');
                cell.className = 'seq-cell';
                cell.dataset.row = rowIdx;
                cell.dataset.col = colIdx;
                
                cell.addEventListener('click', () => {
                    seqState[rowIdx][colIdx] = !seqState[rowIdx][colIdx];
                    cell.classList.toggle('active', seqState[rowIdx][colIdx]);
                });
                
                seqGrid.appendChild(cell);
                rowElements.push(cell);
            }
            seqElements.push(rowElements);
        });
        
        document.getElementById('btn-seq-play').addEventListener('click', (e) => {
            seqPlaying = !seqPlaying;
            e.currentTarget.innerHTML = seqPlaying ? '<i class="fa-solid fa-stop"></i> Stop' : '<i class="fa-solid fa-play"></i> Run';
            if (seqPlaying) {
                if (audioEngine.ctx.state === 'suspended') audioEngine.ctx.resume();
                seqStep = 0;
                const msPer16th = (60000 / arpBPM) / 4;
                seqInterval = setInterval(tickSequencer, msPer16th);
            } else {
                clearInterval(seqInterval);
                seqElements.forEach(row => row.forEach(cell => {
                    cell.style.boxShadow = '';
                }));
            }
        });
        
        document.getElementById('btn-seq-clear').addEventListener('click', () => {
            seqState = Array(seqNotes.length).fill(0).map(() => Array(numSteps).fill(false));
            seqElements.forEach(row => row.forEach(cell => {
                cell.classList.remove('active');
            }));
        });
        
        const seqPanelContainer = document.getElementById('sequencer-panel-container');
        document.getElementById('btn-toggle-sequencer').addEventListener('click', () => {
            seqPanelContainer.style.display = seqPanelContainer.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    function tickSequencer() {
        if (!selectedTrackId) return;
        const track = audioEngine.getTrack(selectedTrackId);
        if (!track) return;
        
        const prevStep = (seqStep - 1 + numSteps) % numSteps;
        seqElements.forEach(row => {
            row[prevStep].style.boxShadow = '';
        });
        
        seqElements.forEach(row => {
            row[seqStep].style.boxShadow = '0 0 10px #ffffff';
        });
        
        for (let rowIdx = 0; rowIdx < seqNotes.length; rowIdx++) {
            if (seqState[rowIdx][seqStep]) {
                const freq = getShiftedFreq(seqNotes[rowIdx]);
                track.play(audioEngine.ctx.currentTime, freq);
                const msPer16th = (60000 / arpBPM) / 4;
                track.stop(audioEngine.ctx.currentTime + (msPer16th / 1000) * 0.9, freq);
            }
        }
        
        seqStep = (seqStep + 1) % numSteps;
    }

    // 15. Studio VU Meter & Voice Telemetry Loop
    const vuSegmentsLeft = document.querySelectorAll('#vu-left .vu-segment');
    const vuSegmentsRight = document.querySelectorAll('#vu-right .vu-segment');
    const lcdVoicesEl = document.getElementById('lcd-voices-val');
    const timeDomainData = new Uint8Array(audioEngine.analyser.frequencyBinCount);

    function updateStudioMeters() {
        requestAnimationFrame(updateStudioMeters);
        
        audioEngine.analyser.getByteTimeDomainData(timeDomainData);
        let sum = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
            const v = (timeDomainData[i] - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / timeDomainData.length);
        const level = Math.min(6, Math.floor(rms * 16));

        vuSegmentsLeft.forEach((seg, idx) => {
            seg.className = 'vu-segment';
            if (idx < level) {
                if (idx < 3) seg.classList.add('active-green');
                else if (idx < 5) seg.classList.add('active-yellow');
                else seg.classList.add('active-red');
            }
        });

        vuSegmentsRight.forEach((seg, idx) => {
            seg.className = 'vu-segment';
            if (idx < level) {
                if (idx < 3) seg.classList.add('active-green');
                else if (idx < 5) seg.classList.add('active-yellow');
                else seg.classList.add('active-red');
            }
        });

        // Count Active Voices
        let totalVoices = 0;
        audioEngine.tracks.forEach(t => {
            if (t.activeSources) totalVoices += t.activeSources.length;
        });
        if (lcdVoicesEl) lcdVoicesEl.innerText = totalVoices;
    }

    updateStudioMeters();

    // Initial Default Track
    createTrack('Analog Lead 1');
});
