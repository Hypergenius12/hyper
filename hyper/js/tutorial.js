class Tutorial {
    constructor() {
        this.steps = [
            {
                element: 'btn-play',
                text: 'Welcome to Nexus Sound Designer! A synthesizer makes sound by rapidly playing back waves. Make sure your device volume is on and hit Play to start the engine!',
                position: 'bottom'
            },
            {
                element: 'btn-add-track',
                text: 'Synths can stack different sounds on top of each other. Let\'s start by adding a new sound layer here.',
                position: 'bottom'
            },
            {
                element: 'edit-waveType',
                text: 'This is your Source. A \'Sine\' wave sounds smooth like a flute, while a \'Sawtooth\' sounds buzzy like brass. Try changing it to hear the difference!',
                position: 'top'
            },
            {
                element: 'drawer-canvas',
                text: 'Want something totally unique? Select \'Custom\' for the waveform and physically draw your own wave here! The math buttons below can instantly smooth it out or add noise.',
                position: 'top'
            },
            {
                element: 'edit-attack',
                text: 'This is the Envelope. It shapes volume over time. Want the sound to fade in slowly like a violin? Turn up the \'Attack\'. Want it to ring out like a bell? Turn up \'Release\'.',
                position: 'top'
            },
            {
                element: 'edit-filterType',
                text: 'Filters carve out frequencies. Use a \'Lowpass\' filter and turn down the Cutoff to muffle the sound and make it deep. Turn up \'Resonance\' to make it squelchy!',
                position: 'top'
            },
            {
                element: 'edit-lfoTarget',
                text: 'LFOs (Low Frequency Oscillators) wiggle knobs for you! Route an LFO to \'Pitch\' and turn up the Depth to create a vibrating vibrato effect.',
                position: 'top'
            },
            {
                element: 'edit-fmDepth',
                text: 'FM Synthesis multiplies waves together. Turn up FM Depth to get crazy, metallic, Sega-Genesis style bells. This is advanced but very fun.',
                position: 'top'
            },
            {
                element: 'btn-export-wav',
                text: 'Once you design the perfect sound, export it as a high-quality WAV or MP3 to use in your own games or music. That\'s it, you\'re ready to synthesize!',
                position: 'bottom'
            }
        ];
        
        this.currentStepIndex = 0;
        this.overlay = null;
        this.tooltipBox = null;
        this.activeElement = null;
    }

    start() {
        if (this.overlay) return;
        this.currentStepIndex = 0;
        this.createOverlay();
        this.showStep();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100vw';
        this.overlay.style.height = '100vh';
        this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.overlay.style.zIndex = '1000';
        this.overlay.style.transition = 'opacity 0.3s ease';
        this.overlay.style.pointerEvents = 'auto'; // Block clicks outside hole
        
        this.tooltipBox = document.createElement('div');
        this.tooltipBox.style.position = 'absolute';
        this.tooltipBox.style.backgroundColor = 'var(--bg-panel)';
        this.tooltipBox.style.border = '2px solid var(--accent)';
        this.tooltipBox.style.borderRadius = 'var(--radius-lg)';
        this.tooltipBox.style.padding = '1.5rem';
        this.tooltipBox.style.maxWidth = '300px';
        this.tooltipBox.style.color = '#fff';
        this.tooltipBox.style.zIndex = '1002';
        this.tooltipBox.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        this.tooltipBox.innerHTML = `
            <p id="tutorial-text" style="margin-bottom: 1rem; line-height: 1.4;"></p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span id="tutorial-progress" style="color: var(--text-secondary); font-size: 0.8rem;"></span>
                <div>
                    <button id="tutorial-close" class="btn" style="margin-right: 0.5rem; background: transparent; border: 1px solid var(--border-color);">Close</button>
                    <button id="tutorial-next" class="btn primary">Next</button>
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

    showStep() {
        if (this.activeElement) {
            this.activeElement.classList.remove('tutorial-highlight');
        }

        const step = this.steps[this.currentStepIndex];
        this.activeElement = document.getElementById(step.element) || document.querySelector(step.element);

        if (!this.activeElement) {
            if (step.element.startsWith('edit-') || step.element === 'drawer-canvas') {
                const addBtn = document.getElementById('btn-add-track') || document.getElementById('btn-add-track-side');
                if (addBtn) addBtn.click();
                setTimeout(() => {
                    this.activeElement = document.getElementById(step.element) || document.querySelector(step.element);
                    if (this.activeElement) {
                        this.showStep();
                    } else {
                        this.currentStepIndex++;
                        this.showStep();
                    }
                }, 200);
                return;
            } else {
                this.currentStepIndex++;
                if (this.currentStepIndex >= this.steps.length) this.end();
                else this.showStep();
                return;
            }
        }

        this.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.activeElement.classList.add('tutorial-highlight');
        
        setTimeout(() => {
            const rect = this.activeElement.getBoundingClientRect();
            
            const p = 8;
            const topPos = Math.max(0, rect.top - p);
            const leftPos = Math.max(0, rect.left - p);
            const rightPos = Math.min(window.innerWidth, rect.right + p);
            const bottomPos = Math.min(window.innerHeight, rect.bottom + p);
            
            this.overlay.style.clipPath = `polygon(0% 0%, 0% 100%, ${leftPos}px 100%, ${leftPos}px ${topPos}px, ${rightPos}px ${topPos}px, ${rightPos}px ${bottomPos}px, ${leftPos}px ${bottomPos}px, ${leftPos}px 100%, 100% 100%, 100% 0%)`;
            
            const textEl = document.getElementById('tutorial-text');
            const progressEl = document.getElementById('tutorial-progress');
            const nextBtn = document.getElementById('tutorial-next');
        
            if (step.element === 'btn-add-track' || step.element === 'btn-add-track-side') {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.5';
                textEl.innerHTML = step.text + '<br><br><strong>(Click the highlighted button to proceed)</strong>';
                
                const advanceListener = () => {
                    nextBtn.disabled = false;
                    nextBtn.style.opacity = '1';
                    this.activeElement.removeEventListener('click', advanceListener);
                    setTimeout(() => nextBtn.click(), 100);
                };
                this.activeElement.addEventListener('click', advanceListener);
            } else {
                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                textEl.innerText = step.text;
            }

            progressEl.innerText = `${this.currentStepIndex + 1} / ${this.steps.length}`;
            if (this.currentStepIndex === this.steps.length - 1) {
                nextBtn.innerText = "Finish";
            }

            let top, left;
            if (step.position === 'bottom') {
                top = rect.bottom + 15;
                left = rect.left + (rect.width / 2) - 150;
            } else if (step.position === 'top') {
                top = rect.top - 150;
                left = rect.left + (rect.width / 2) - 150;
            }

            if (left < 10) left = 10;
            if (left + 300 > window.innerWidth) left = window.innerWidth - 310;
            if (top < 10) top = rect.bottom + 15;

            this.tooltipBox.style.top = `${top}px`;
            this.tooltipBox.style.left = `${left}px`;
        }, 100);
    }

    end() {
        if (this.activeElement) {
            this.activeElement.classList.remove('tutorial-highlight');
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
        }, 500);
    }
});
