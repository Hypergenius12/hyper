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
            
            alert('Settings and Theme reset to defaults!');
        });
    }

    // 2. Initialize Wave Drawer
    const waveDrawer = new WaveDrawer('drawer-canvas');
    let customWaveformCache = null;
    
    // 3. UI State
    let trackCount = 0;
    let selectedTrackId = null;
    
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
    
    // 4. Global Controls
    document.getElementById('btn-play').addEventListener('click', () => {
        if (!audioEngine.isPlaying) {
            audioEngine.play();
            document.getElementById('btn-play').innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        } else {
            audioEngine.stop();
            document.getElementById('btn-play').innerHTML = '<i class="fa-solid fa-play"></i> Play';
        }
    });
    
    document.getElementById('btn-stop').addEventListener('click', () => {
        audioEngine.stop();
        document.getElementById('btn-play').innerHTML = '<i class="fa-solid fa-play"></i> Play';
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
        const presetName = prompt('Enter a name for this preset:', 'My Cool Synth');
        if (!presetName) return;
        
        const presetData = {
            name: presetName,
            tracks: audioEngine.tracks.map(t => t.toJSON())
        };
        
        let presets = JSON.parse(localStorage.getItem('nexus-presets') || '[]');
        presets.push(presetData);
        localStorage.setItem('nexus-presets', JSON.stringify(presets));
        alert('Preset saved successfully!');
    });
    
    document.getElementById('btn-load-preset').addEventListener('click', () => {
        const presets = JSON.parse(localStorage.getItem('nexus-presets') || '[]');
        if (presets.length === 0) {
            alert('No saved presets found.');
            return;
        }
        
        const presetNames = presets.map((p, i) => `${i + 1}: ${p.name}`).join('\n');
        const choice = prompt(`Select a preset to load (enter number):\n${presetNames}`);
        const idx = parseInt(choice) - 1;
        
        if (idx >= 0 && idx < presets.length) {
            const preset = presets[idx];
            // Clear current
            [...audioEngine.tracks].forEach(t => audioEngine.removeTrack(t.id));
            selectedTrackId = null;
            renderTracks();
            renderEditor();
            
            // Load new
            preset.tracks.forEach(tData => {
                const track = new Track(tData.id, tData.name, audioEngine.ctx);
                track.fromJSON(tData);
                audioEngine.addTrack(track);
            });
            
            renderTracks();
        }
    });

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
                    <span class="track-name">${track.name}</span>
                    <div class="track-actions">
                        <button class="track-btn mute ${track.isMuted ? 'active' : ''}" data-id="${track.id}" title="Mute">M</button>
                        <button class="track-btn solo ${track.isSolo ? 'active' : ''}" data-id="${track.id}" title="Solo">S</button>
                        <button class="track-btn delete" data-id="${track.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
            
            el.addEventListener('click', (e) => {
                if (e.target.closest('.track-btn')) return; // Ignore button clicks
                selectTrack(track.id);
            });
            
            tracksContainer.appendChild(el);
        });
        
        // Bind buttons
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
                
                // Mute others if this is soloed
                audioEngine.tracks.forEach(t => {
                    if (t.id !== id) t.isMuted = track.isSolo;
                });
                
                renderTracksList();
            });
        });
        
        document.querySelectorAll('.track-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                audioEngine.removeTrack(id);
                if (selectedTrackId === id) selectTrack(null);
                renderTracksList();
            });
        });
    }
    
    function selectTrack(id) {
        selectedTrackId = id;
        renderTracksList(); // Update active class
        renderEditor();
    }
    
    // 6. Editor Rendering
    function renderEditor() {
        if (!selectedTrackId) {
            editorContainer.innerHTML = '';
            editorContainer.appendChild(editorEmptyState);
            editorEmptyState.style.display = 'block';
            return;
        }
        
        editorEmptyState.style.display = 'none';
        const track = audioEngine.getTrack(selectedTrackId);
        
        let oscControls = '';
        if (track.type === 'oscillator') {
            oscControls = `
                <div class="editor-section">
                    <h3>Oscillator Source</h3>
                    <div class="control-grid">
                        <div class="control-group">
                            <label class="control-label">Waveform</label>
                            <select id="edit-waveType">
                                <option value="sine" ${track.waveType==='sine'?'selected':''}>Sine</option>
                                <option value="square" ${track.waveType==='square'?'selected':''}>Square</option>
                                <option value="sawtooth" ${track.waveType==='sawtooth'?'selected':''}>Sawtooth</option>
                                <option value="triangle" ${track.waveType==='triangle'?'selected':''}>Triangle</option>
                                <option value="custom" ${track.waveType==='custom'?'selected':''}>Custom (Drawn)</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label class="control-label">Frequency (Hz) <i class="fa-solid fa-circle-info info-tooltip" title="Base pitch of the oscillator"></i></label>
                            <input type="range" id="edit-freq" min="20" max="2000" step="1" value="${track.frequency}">
                            <span class="val-display">${track.frequency} Hz</span>
                        </div>
                        <div class="control-group">
                            <label class="control-label">Detune (cents) <i class="fa-solid fa-circle-info info-tooltip" title="Fine-tune pitch shifting (100 cents = 1 semitone)"></i></label>
                            <input type="range" id="edit-detune" min="-1200" max="1200" step="1" value="${track.detune}">
                            <span class="val-display">${track.detune} cents</span>
                        </div>
                    
                        <div class="control-group">
                            <label class="control-label">FM Ratio <i class="fa-solid fa-circle-info info-tooltip" title="Frequency multiplier for the hidden FM modulator"></i></label>
                            <input type="range" id="edit-fmRatio" min="0.1" max="10" step="0.1" value="${track.fmRatio}">
                            <span class="val-display">${track.fmRatio}x</span>
                        </div>
                        <div class="control-group">
                            <label class="control-label">FM Depth <i class="fa-solid fa-circle-info info-tooltip" title="Intensity of FM modulation (creates metallic tones)"></i></label>
                            <input type="range" id="edit-fmDepth" min="0" max="1000" step="1" value="${track.fmDepth}">
                            <span class="val-display">${track.fmDepth}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            oscControls = `
                <div class="editor-section">
                    <h3>Sample Source</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Loaded audio buffer playing back.</p>
                    <div class="control-grid" style="margin-top:1rem;">
                        <div class="control-group">
                            <label class="control-label">Pitch Scale (Hz ref 440)</label>
                            <input type="range" id="edit-freq" min="20" max="2000" step="1" value="${track.frequency}">
                            <span class="val-display">${track.frequency}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        const editorHTML = `
            ${oscControls}
            <div class="editor-section">
                <h3>Envelope (ADSR)</h3>
                <div class="control-grid">
                    <div class="control-group">
                        <label class="control-label">Attack (s) <i class="fa-solid fa-circle-info info-tooltip" title="Time it takes to reach maximum volume when a note starts"></i></label>
                        <input type="range" id="edit-attack" min="0" max="5" step="0.01" value="${track.attack}">
                        <span class="val-display">${track.attack}s</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Decay (s) <i class="fa-solid fa-circle-info info-tooltip" title="Time it takes to drop to sustain level"></i></label>
                        <input type="range" id="edit-decay" min="0" max="5" step="0.01" value="${track.decay}">
                        <span class="val-display">${track.decay}s</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Sustain <i class="fa-solid fa-circle-info info-tooltip" title="Volume level held while the note is playing"></i></label>
                        <input type="range" id="edit-sustain" min="0" max="1" step="0.01" value="${track.sustain}">
                        <span class="val-display">${track.sustain}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Release (s) <i class="fa-solid fa-circle-info info-tooltip" title="Time it takes for the sound to fade out after stopping"></i></label>
                        <input type="range" id="edit-release" min="0" max="5" step="0.01" value="${track.release}">
                        <span class="val-display">${track.release}s</span>
                    </div>
                </div>
            </div>
            
            <div class="editor-section">
                <h3>Filter & Effects</h3>
                <div class="control-grid">
                    <div class="control-group">
                        <label class="control-label">Filter <i class="fa-solid fa-circle-info info-tooltip" title="Shape the frequency content. Lowpass cuts highs, Highpass cuts lows"></i></label>
                        <select id="edit-filterType">
                            <option value="lowpass" ${track.filterType==='lowpass'?'selected':''}>Lowpass</option>
                            <option value="highpass" ${track.filterType==='highpass'?'selected':''}>Highpass</option>
                            <option value="bandpass" ${track.filterType==='bandpass'?'selected':''}>Bandpass</option>
                            <option value="notch" ${track.filterType==='notch'?'selected':''}>Notch</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Cutoff (Hz) <i class="fa-solid fa-circle-info info-tooltip" title="The frequency where the filter begins to take effect"></i></label>
                        <input type="range" id="edit-filterFreq" min="20" max="20000" step="1" value="${track.filterFreq}">
                        <span class="val-display">${track.filterFreq} Hz</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Resonance <i class="fa-solid fa-circle-info info-tooltip" title="Boosts the volume exactly at the cutoff frequency"></i></label>
                        <input type="range" id="edit-filterQ" min="0.0001" max="1000" step="0.1" value="${track.filterQ}">
                        <span class="val-display">${track.filterQ}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Delay Time</label>
                        <input type="range" id="edit-delayTime" min="0" max="2" step="0.01" value="${track.delayTime}">
                        <span class="val-display">${track.delayTime}s</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Delay Fdbk</label>
                        <input type="range" id="edit-delayFeedback" min="0" max="0.9" step="0.01" value="${track.delayFeedback}">
                        <span class="val-display">${track.delayFeedback}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Reverb Mix</label>
                        <input type="range" id="edit-reverbMix" min="0" max="1" step="0.01" value="${track.reverbMix}">
                        <span class="val-display">${track.reverbMix}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Chorus Mix <i class="fa-solid fa-circle-info info-tooltip" title="Thickens the sound by doubling and modulating it"></i></label>
                        <input type="range" id="edit-chorusMix" min="0" max="1" step="0.01" value="${track.chorusMix}">
                        <span class="val-display">${track.chorusMix}</span>
                    </div>
                </div>
            </div>
            
                        <div class="editor-section">
                <h3>Modulation (LFO) & Distortion</h3>
                <div class="control-grid">
                    <div class="control-group">
                        <label class="control-label">LFO Target <i class="fa-solid fa-circle-info info-tooltip" title="What the LFO changes over time"></i></label>
                        <select id="edit-lfoTarget">
                            <option value="none" ${track.lfoTarget==='none'?'selected':''}>None</option>
                            <option value="pitch" ${track.lfoTarget==='pitch'?'selected':''}>Pitch (Vibrato)</option>
                            <option value="filter" ${track.lfoTarget==='filter'?'selected':''}>Filter (Wobble)</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label class="control-label">LFO Rate (Hz) <i class="fa-solid fa-circle-info info-tooltip" title="Speed of the LFO wobble"></i></label>
                        <input type="range" id="edit-lfoRate" min="0.1" max="20" step="0.1" value="${track.lfoRate}">
                        <span class="val-display">${track.lfoRate} Hz</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">LFO Depth <i class="fa-solid fa-circle-info info-tooltip" title="Intensity of the LFO modulation"></i></label>
                        <input type="range" id="edit-lfoDepth" min="0" max="100" step="1" value="${track.lfoDepth}">
                        <span class="val-display">${track.lfoDepth}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Distortion <i class="fa-solid fa-circle-info info-tooltip" title="Adds grit and harmonics by clipping the wave"></i></label>
                        <input type="range" id="edit-distortionAmount" min="0" max="100" step="1" value="${track.distortionAmount}">
                        <span class="val-display">${track.distortionAmount}</span>
                    </div>
                </div>
            </div>
            
            <div class="editor-section">
                <h3>Output Mix</h3>
                <div class="control-grid">
                    <div class="control-group">
                        <label class="control-label">Volume</label>
                        <input type="range" id="edit-gain" min="0" max="2" step="0.01" value="${track.gain}">
                        <span class="val-display">${track.gain}</span>
                    </div>
                    <div class="control-group">
                        <label class="control-label">3D Spatial Radar <i class="fa-solid fa-circle-info info-tooltip" title="Drag the dot to position the sound in a 3D room. Center is inside your head!"></i></label>
                        <canvas id="radar-${track.id}" width="120" height="120" style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 50%; cursor: crosshair; display: block; margin: 0 auto;"></canvas>
                        <div style="text-align: center; margin-top: 5px;">
                            <span class="val-display" id="radar-val-${track.id}">X: ${track.panX.toFixed(1)}, Z: ${track.panZ.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        editorContainer.innerHTML = editorHTML;
        
        // Bind UI to track updates
        const bindInput = (id, prop, isFloat = true) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => {
                const val = isFloat ? parseFloat(e.target.value) : e.target.value;
                track[prop] = val;
                if (e.target.nextElementSibling && e.target.nextElementSibling.classList && (e.target.nextElementSibling.classList.contains('val') || e.target.nextElementSibling.classList.contains('val-display'))) {
                    e.target.nextElementSibling.innerText = e.target.value + (id.includes('freq') || id.includes('Freq') ? ' Hz' : id.includes('detune') ? ' cents' : id.includes('attack')||id.includes('decay')||id.includes('release')||id.includes('delayTime') ? 's' : '');
                }
                track.updateNodes();
                // Real-time update for parameters attached directly to the source
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

        // Initialize Radar
        const radarCanvas = document.getElementById(`radar-${track.id}`);
        if (radarCanvas) {
            const ctx = radarCanvas.getContext('2d');
            let isDragging = false;
            
            const drawRadar = () => {
                ctx.clearRect(0, 0, 120, 120);
                // Grid lines
                ctx.strokeStyle = '#444';
                ctx.beginPath();
                ctx.moveTo(60, 0); ctx.lineTo(60, 120);
                ctx.moveTo(0, 60); ctx.lineTo(120, 60);
                ctx.stroke();
                
                // User dot (mapped -10 to 10 for X and Z)
                const px = ((track.panX + 10) / 20) * 120;
                const pz = ((track.panZ + 10) / 20) * 120;
                
                ctx.fillStyle = 'var(--accent)';
                ctx.beginPath();
                ctx.arc(px, pz, 6, 0, Math.PI * 2);
                ctx.fill();
            };
            drawRadar();
            
            const updateRadar = (e) => {
                const rect = radarCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Map 0-120 back to -10 to 10
                track.panX = ((x / 120) * 20) - 10;
                track.panZ = ((y / 120) * 20) - 10;
                
                document.getElementById(`radar-val-${track.id}`).innerText = `X: ${track.panX.toFixed(1)}, Z: ${track.panZ.toFixed(1)}`;
                track.updateNodes();
                drawRadar();
            };
            
            radarCanvas.addEventListener('mousedown', (e) => { isDragging = true; updateRadar(e); });
            radarCanvas.addEventListener('mousemove', (e) => { if (isDragging) updateRadar(e); });
            window.addEventListener('mouseup', () => { isDragging = false; });
        }

        
        
        document.getElementById('edit-waveType')?.addEventListener('change', (e) => {
            if (e.target.value === 'custom' && !track.customWave) {
                alert("Apply a custom wave from the Drawer first.");
                e.target.value = 'sine';
                track.waveType = 'sine';
            }
        });
    }

    // Visualizer Toggle
    document.getElementById('btn-toggle-visualizer').addEventListener('click', () => {
        visualizer.toggleMode();
    });
    
    // Keyboard Piano mapping
    const keyMap = {
        'a': 261.63, // C4
        'w': 277.18, // C#4
        's': 293.66, // D4
        'e': 311.13, // D#4
        'd': 329.63, // E4
        'f': 349.23, // F4
        't': 369.99, // F#4
        'g': 392.00, // G4
        'y': 415.30, // G#4
        'h': 440.00, // A4
        'u': 466.16, // A#4
        'j': 493.88, // B4
        'k': 523.25  // C5
    };
    
    const activeKeys = {};
    
    // Arpeggiator State
    let arpEnabled = false;
    let arpBPM = 120;
    let heldNotes = []; // Array of frequencies
    let arpInterval = null;
    let currentArpIndex = 0;
    let lastArpFreq = null;
    
    const arpToggle = document.getElementById('arp-toggle');
    const arpBpmSlider = document.getElementById('arp-bpm');
    const arpBpmVal = document.getElementById('arp-bpm-val');
    
    if (arpToggle) {
        arpToggle.addEventListener('change', (e) => {
            arpEnabled = e.target.checked;
            if (arpEnabled) {
                // Populate heldNotes from activeKeys if any are already held
                heldNotes = [];
                Object.keys(activeKeys).forEach(key => {
                    if (activeKeys[key] && keyMap[key]) {
                        heldNotes.push(keyMap[key]);
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
            arpBpmVal.innerText = arpBPM;
            if (arpEnabled) {
                stopArp();
                startArp();
            }
        });
    }
    
    function startArp() {
        if (arpInterval) clearInterval(arpInterval);
        const msPerBeat = 60000 / arpBPM;
        const msPer16th = msPerBeat / 4; // 16th note arpeggiation
        
        arpInterval = setInterval(() => {
            if (heldNotes.length === 0) return;
            
            const track = audioEngine.getTrack(selectedTrackId);
            if (!track) return;
            
            // Stop previous note if it exists to avoid infinite build up
            if (lastArpFreq) {
                track.stop(audioEngine.ctx.currentTime, lastArpFreq);
            }
            
            // Play next note
            if (currentArpIndex >= heldNotes.length) currentArpIndex = 0;
            const freq = heldNotes[currentArpIndex];
            
            if (audioEngine.ctx.state === 'suspended') audioEngine.ctx.resume();
            track.play(audioEngine.ctx.currentTime, freq);
            
            // Automatically schedule stop
            const stopTime = audioEngine.ctx.currentTime + (msPer16th / 1000) * 0.9; // 90% gate
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
    
    window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        const freq = keyMap[e.key.toLowerCase()];
        if (freq && selectedTrackId) {
            if (audioEngine.ctx.state === 'suspended') audioEngine.ctx.resume();
            activeKeys[e.key.toLowerCase()] = true;
            
            if (arpEnabled) {
                if (!heldNotes.includes(freq)) {
                    heldNotes.push(freq);
                    heldNotes.sort((a,b) => a - b); // Always arpeggiate Up
                }
            } else {
                const track = audioEngine.getTrack(selectedTrackId);
                track.play(audioEngine.ctx.currentTime, freq);
            }
        }
    });
    
    window.addEventListener('keyup', (e) => {
        const freq = keyMap[e.key.toLowerCase()];
        if (freq && selectedTrackId && activeKeys[e.key.toLowerCase()]) {
            activeKeys[e.key.toLowerCase()] = false;
            
            if (arpEnabled) {
                heldNotes = heldNotes.filter(f => f !== freq);
                if (heldNotes.length === 0) {
                    currentArpIndex = 0;
                }
            } else {
                const track = audioEngine.getTrack(selectedTrackId);
                track.stop(audioEngine.ctx.currentTime, freq);
            }
        }
    });

    // 7. Drawer Application
    document.getElementById('btn-drawer-apply').addEventListener('click', () => {
        if (!selectedTrackId) {
            alert("Select a track first.");
            return;
        }
        const track = audioEngine.getTrack(selectedTrackId);
        if (track.type !== 'oscillator') {
            alert("Drawer only applies to Synthesizer tracks.");
            return;
        }
        
        const harmonics = parseInt(document.getElementById('drawer-harmonics').value, 10);
        const { periodicWave } = waveDrawer.createPeriodicWave(audioEngine.ctx, harmonics);
        track.customWave = periodicWave;
        track.waveType = 'custom';
        
        // Update UI
        const waveSelect = document.getElementById('edit-waveType');
        if (waveSelect) waveSelect.value = 'custom';
        
        // Real-time update for actively playing sounds
        if (audioEngine.isPlaying && track.activeSources.length > 0) {
            track.activeSources.forEach(({source}) => {
                try {
                    source.setPeriodicWave(periodicWave);
                } catch(e) {
                    console.log("Could not update periodic wave on active source (browser dependent)", e);
                }
            });
        }
        
        const btn = document.getElementById('btn-drawer-apply');
        const orig = btn.innerText;
        btn.innerText = "Applied!";
        setTimeout(() => btn.innerText = orig, 1000);
    });
    
    document.getElementById('btn-drawer-clear').addEventListener('click', () => {
        waveDrawer.clear();
    });
    
    document.getElementById('btn-drawer-smooth').addEventListener('click', () => {
        waveDrawer.smooth();
    });
    
    document.getElementById('btn-drawer-invert').addEventListener('click', () => {
        waveDrawer.invert();
    });
    
    document.getElementById('btn-drawer-noise').addEventListener('click', () => {
        waveDrawer.noise();
    });
    
    document.getElementById('btn-drawer-normalize').addEventListener('click', () => {
        waveDrawer.normalize();
    });

    // Preset waves in drawer
    document.querySelectorAll('.preset-waves .btn').forEach(btn => {
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

    // 8. Import
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
                createTrack(file.name, 'buffer', audioBuffer);
            } catch (err) {
                alert("Error decoding audio file.");
            }
        };
        reader.readAsArrayBuffer(file);
    });

    // 9. Export
    async function doExport(format) {
        if (audioEngine.tracks.length === 0) {
            alert("Nothing to export! Add a layer first.");
            return;
        }
        
        loadingText.innerText = `Exporting ${format.toUpperCase()}...`;
        loadingOverlay.classList.remove('hidden');
        
        // Wait a frame for UI to update
        await new Promise(r => setTimeout(r, 100));
        
        try {
            const renderedBuffer = await audioEngine.renderOffline(5); // Export 5 seconds for now
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

    // Init
    createTrack('Oscillator 1');

    // 8. Step Sequencer
    const numSteps = 16;
    const seqNotes = [523.25, 493.88, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63]; // C5 to C4
    const seqGrid = document.getElementById('sequencer-grid');
    let seqState = Array(seqNotes.length).fill(0).map(() => Array(numSteps).fill(false));
    let seqPlaying = false;
    let seqStep = 0;
    let seqInterval = null;
    let seqElements = [];
    
    if (seqGrid) {
        // Initialize Grid UI
        seqNotes.forEach((freq, rowIdx) => {
            const label = document.createElement('div');
            label.style.color = 'var(--text-secondary)';
            label.style.fontSize = '0.7rem';
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.innerText = Math.round(freq) + 'Hz';
            seqGrid.appendChild(label);
            
            const rowElements = [];
            for (let colIdx = 0; colIdx < numSteps; colIdx++) {
                const cell = document.createElement('div');
                cell.style.border = '1px solid rgba(255,255,255,0.1)';
                cell.style.borderRadius = '2px';
                cell.style.cursor = 'pointer';
                cell.style.height = '20px';
                cell.style.backgroundColor = 'transparent';
                cell.dataset.row = rowIdx;
                cell.dataset.col = colIdx;
                
                cell.addEventListener('click', () => {
                    seqState[rowIdx][colIdx] = !seqState[rowIdx][colIdx];
                    cell.style.backgroundColor = seqState[rowIdx][colIdx] ? 'var(--accent)' : 'transparent';
                });
                
                seqGrid.appendChild(cell);
                rowElements.push(cell);
            }
            seqElements.push(rowElements);
        });
        
        document.getElementById('btn-seq-play').addEventListener('click', (e) => {
            seqPlaying = !seqPlaying;
            e.currentTarget.innerHTML = seqPlaying ? '<i class="fa-solid fa-stop"></i>' : '<i class="fa-solid fa-play"></i>';
            if (seqPlaying) {
                if (audioEngine.ctx.state === 'suspended') audioEngine.ctx.resume();
                seqStep = 0;
                const msPer16th = (60000 / arpBPM) / 4;
                seqInterval = setInterval(tickSequencer, msPer16th);
            } else {
                clearInterval(seqInterval);
                // Clear highlights
                seqElements.forEach(row => row.forEach(cell => {
                    cell.style.border = '1px solid rgba(255,255,255,0.1)';
                }));
            }
        });
        
        document.getElementById('btn-seq-clear').addEventListener('click', () => {
            seqState = Array(seqNotes.length).fill(0).map(() => Array(numSteps).fill(false));
            seqElements.forEach(row => row.forEach(cell => {
                cell.style.backgroundColor = 'transparent';
            }));
        });
        

        // Sequencer Toggle
        const seqPanelContainer = document.getElementById('sequencer-panel-container');
        document.getElementById('btn-toggle-sequencer').addEventListener('click', () => {
            if (seqPanelContainer.style.display === 'none') {
                seqPanelContainer.style.display = 'block';
            } else {
                seqPanelContainer.style.display = 'none';
            }
        });
        
        // Listen to BPM changes to update sequencer speed

        if (arpBpmSlider) {
            arpBpmSlider.addEventListener('input', () => {
                if (seqPlaying) {
                    clearInterval(seqInterval);
                    const msPer16th = (60000 / arpBPM) / 4;
                    seqInterval = setInterval(tickSequencer, msPer16th);
                }
            });
        }
    }
    
    function tickSequencer() {
        if (!selectedTrackId) return;
        const track = audioEngine.getTrack(selectedTrackId);
        if (!track) return;
        
        // Remove highlight from previous step
        const prevStep = (seqStep - 1 + numSteps) % numSteps;
        seqElements.forEach(row => {
            row[prevStep].style.border = '1px solid rgba(255,255,255,0.1)';
        });
        
        // Highlight current step
        seqElements.forEach(row => {
            row[seqStep].style.border = '1px solid white';
        });
        
        // Play notes
        for (let rowIdx = 0; rowIdx < seqNotes.length; rowIdx++) {
            if (seqState[rowIdx][seqStep]) {
                const freq = seqNotes[rowIdx];
                track.play(audioEngine.ctx.currentTime, freq);
                const msPer16th = (60000 / arpBPM) / 4;
                track.stop(audioEngine.ctx.currentTime + (msPer16th / 1000) * 0.9, freq);
            }
        }
        
        seqStep = (seqStep + 1) % numSteps;
    }

});
