class Tutorial {
    constructor() {
        this.steps = [
            {
                element: 'btn-play',
                title: 'Step 1: Start the Engine',
                text: 'Welcome to Nexus Sound Designer! A synthesizer makes sound by rapidly playing back waves. Make sure your device volume is on and hit Play to start the engine!',
                position: 'bottom'
            },
            {
                element: 'btn-add-track',
                title: 'Step 2: Add a Layer',
                text: 'Synths can stack different sounds on top of each other. Click here to add your first sound layer to get started.',
                position: 'bottom',
                requireClick: true
            },
            {
                element: 'edit-waveType',
                title: 'Step 3: Choose a Waveform',
                text: 'This is your Source. A \'Sine\' wave sounds smooth like a flute, while a \'Sawtooth\' sounds buzzy like brass. Try changing it to hear the difference!',
                position: 'right',
                needsTrack: true
            },
            {
                element: 'drawer-canvas',
                title: 'Step 4: Draw Your Wave',
                text: 'Want something totally unique? Select \'Custom\' for the waveform and physically draw your own wave here! The math buttons below can instantly smooth it out or add noise.',
                position: 'top',
                needsTrack: true
            },
            {
                element: 'edit-attack',
                title: 'Step 5: Shape the Envelope',
                text: 'This is the Envelope. It shapes volume over time. Want the sound to fade in slowly like a violin? Turn up the \'Attack\'. Want it to ring out like a bell? Turn up \'Release\'.',
                position: 'right',
                needsTrack: true
            },
            {
                element: 'edit-filterType',
                title: 'Step 6: Apply a Filter',
                text: 'Filters carve out frequencies. Use a \'Lowpass\' filter and turn down the Cutoff to muffle the sound and make it deep. Turn up \'Resonance\' to make it squelchy!',
                position: 'right',
                needsTrack: true
            },
            {
                element: 'edit-lfoTarget',
                title: 'Step 7: Add Movement with LFO',
                text: 'LFOs (Low Frequency Oscillators) wiggle knobs for you! Route an LFO to \'Pitch\' and turn up the Depth to create a vibrating vibrato effect.',
                position: 'right',
                needsTrack: true
            },
            {
                element: 'edit-fmDepth',
                title: 'Step 8: Try FM Synthesis',
                text: 'FM Synthesis multiplies waves together. Turn up FM Depth to get crazy, metallic, Sega-Genesis style bells. This is advanced but very fun.',
                position: 'right',
                needsTrack: true
            },
            {
                element: 'btn-export-wav',
                title: 'Step 9: Export Your Sound',
                text: 'Once you design the perfect sound, export it as a high-quality WAV or MP3 to use in your own games or music. That\'s it, you\'re ready to synthesize!',
                position: 'bottom'
            }
        ];
        
        this.currentStepIndex = 0;
        this.overlay = null;
        this.tooltipBox = null;
        this.activeElement = null;
        this._pollTimer = null;
    }

    start() {
        if (this.overlay) return;
        this.currentStepIndex = 0;
        this.createOverlay();
        this.showStep();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.72); z-index: 1000; pointer-events: auto;
        `;

        this.tooltipBox = document.createElement('div');
        this.tooltipBox.style.cssText = `
            position: fixed; z-index: 1002; max-width: 320px; min-width: 260px;
            background: var(--bg-panel); border: 2px solid var(--accent);
            border-radius: var(--radius-lg); padding: 1.25rem;
            color: #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        `;
        this.tooltipBox.innerHTML = `
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;" id="tutorial-title"></div>
            <p id="tutorial-text" style="margin-bottom: 1rem; line-height: 1.5; font-size: 0.875rem;"></p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span id="tutorial-progress" style="color: var(--text-secondary); font-size: 0.75rem;"></span>
                <div style="display: flex; gap: 0.5rem;">
                    <button id="tutorial-close" class="btn small" style="background: transparent; border: 1px solid var(--border-color);">Close</button>
                    <button id="tutorial-next" class="btn small primary">Next</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.tooltipBox);

        document.getElementById('tutorial-close').addEventListener('click', () => this.end());
        document.getElementById('tutorial-next').addEventListener('click', () => {
            this.currentStepIndex++;
            if (this.currentStepIndex >= this.steps.length) {
                this.end();
            } else {
                this.showStep();
            }
        });
    }

    // Find the element, retrying every 80ms up to maxTries times
    _findElement(selector, callback, maxTries = 20) {
        clearTimeout(this._pollTimer);
        let tries = 0;
        const attempt = () => {
            const el = document.getElementById(selector) || document.querySelector(selector);
            if (el) {
                callback(el);
            } else {
                tries++;
                if (tries < maxTries) {
                    this._pollTimer = setTimeout(attempt, 80);
                } else {
                    // Give up and move to next step
                    this.currentStepIndex++;
                    if (this.currentStepIndex < this.steps.length) this.showStep();
                    else this.end();
                }
            }
        };
        attempt();
    }

    showStep() {
        clearTimeout(this._pollTimer);

        // Remove highlight from previous element
        if (this.activeElement) {
            this.activeElement.classList.remove('tutorial-highlight');
            this.activeElement = null;
        }

        const step = this.steps[this.currentStepIndex];

        // If this step needs a track, ensure one exists first
        if (step.needsTrack) {
            const editorEl = document.getElementById('edit-attack');
            if (!editorEl) {
                // No track loaded yet — add one and wait
                const addBtn = document.getElementById('btn-add-track') || document.getElementById('btn-add-track-side');
                if (addBtn) addBtn.click();
            }
        }

        // Poll until the element appears in DOM
        this._findElement(step.element, (el) => {
            this.activeElement = el;
            this._renderStep(step);
        });
    }

    _renderStep(step) {
        const el = this.activeElement;

        // Scroll into view, then wait for scroll to finish before computing rect
        el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
        el.classList.add('tutorial-highlight');

        // Use rAF + small timeout to ensure layout is stable after scroll
        requestAnimationFrame(() => {
            setTimeout(() => {
                // Compute highlight rect — expand to control-group or editor-section for inputs/selects
                let rectEl = el;
                const tag = el.tagName.toLowerCase();
                if (tag === 'input' || tag === 'select') {
                    rectEl = el.closest('.control-group') || el.closest('.editor-section') || el;
                }

                const rect = rectEl.getBoundingClientRect();
                const p = 12;
                const t = Math.max(0, rect.top - p);
                const l = Math.max(0, rect.left - p);
                const r = Math.min(window.innerWidth, rect.right + p);
                const b = Math.min(window.innerHeight, rect.bottom + p);

                // Cutout overlay
                this.overlay.style.clipPath = `polygon(
                    0% 0%, 0% 100%,
                    ${l}px 100%, ${l}px ${t}px,
                    ${r}px ${t}px, ${r}px ${b}px,
                    ${l}px ${b}px, ${l}px 100%,
                    100% 100%, 100% 0%
                )`;

                // Update text
                const titleEl = document.getElementById('tutorial-title');
                const textEl = document.getElementById('tutorial-text');
                const progressEl = document.getElementById('tutorial-progress');
                const nextBtn = document.getElementById('tutorial-next');

                if (!textEl) return; // tooltip already closed

                titleEl.innerText = step.title || '';
                progressEl.innerText = `${this.currentStepIndex + 1} / ${this.steps.length}`;
                nextBtn.innerText = this.currentStepIndex === this.steps.length - 1 ? 'Finish' : 'Next';

                if (step.requireClick) {
                    nextBtn.disabled = true;
                    nextBtn.style.opacity = '0.5';
                    textEl.innerHTML = step.text + '<br><br><em style="color:var(--accent);">Click the highlighted button to continue.</em>';
                    const advanceOnClick = () => {
                        nextBtn.disabled = false;
                        nextBtn.style.opacity = '1';
                        el.removeEventListener('click', advanceOnClick);
                        setTimeout(() => {
                            this.currentStepIndex++;
                            if (this.currentStepIndex < this.steps.length) this.showStep();
                            else this.end();
                        }, 300);
                    };
                    el.addEventListener('click', advanceOnClick);
                } else {
                    nextBtn.disabled = false;
                    nextBtn.style.opacity = '1';
                    textEl.innerText = step.text;
                }

                // Position tooltip
                let top, left;
                const tooltipW = 320;
                const tooltipH = 180;
                const margin = 18;

                if (step.position === 'bottom') {
                    top = b + margin;
                    left = l + (r - l) / 2 - tooltipW / 2;
                } else if (step.position === 'top') {
                    top = t - tooltipH - margin;
                    left = l + (r - l) / 2 - tooltipW / 2;
                } else if (step.position === 'right') {
                    top = t + (b - t) / 2 - tooltipH / 2;
                    left = r + margin;
                } else {
                    top = b + margin;
                    left = l + (r - l) / 2 - tooltipW / 2;
                }

                // Clamp to viewport
                if (left < margin) left = margin;
                if (left + tooltipW > window.innerWidth - margin) left = window.innerWidth - tooltipW - margin;
                if (top < margin) top = b + margin;
                if (top + tooltipH > window.innerHeight - margin) top = t - tooltipH - margin;
                if (top < margin) top = margin;

                this.tooltipBox.style.top = `${top}px`;
                this.tooltipBox.style.left = `${left}px`;

            }, 80);
        });
    }

    end() {
        clearTimeout(this._pollTimer);
        if (this.activeElement) {
            this.activeElement.classList.remove('tutorial-highlight');
            this.activeElement = null;
        }
        if (this.overlay) {
            this.overlay.remove();
            this.tooltipBox.remove();
            this.overlay = null;
            this.tooltipBox = null;
        }
        localStorage.setItem('nexus-tutorial-completed', 'true');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.tutorial = new Tutorial();

    if (!localStorage.getItem('nexus-tutorial-completed')) {
        setTimeout(() => {
            window.tutorial.start();
        }, 600);
    }
});
