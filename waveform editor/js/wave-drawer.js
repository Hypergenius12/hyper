class WaveDrawer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.points = [];
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.clear();
        
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        
        document.getElementById('btn-drawer-clear').addEventListener('click', () => this.clear());
        const micBtn = document.getElementById('btn-drawer-mic');
        if (micBtn) micBtn.addEventListener('click', () => this.recordMic());
    }
    
    
    async recordMic() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];
            
            const micBtn = document.getElementById('btn-drawer-mic');
            micBtn.style.color = '#fff';
            micBtn.style.backgroundColor = 'var(--danger)';
            micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            
            mediaRecorder.ondataavailable = e => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                micBtn.style.color = 'var(--danger)';
                micBtn.style.backgroundColor = '';
                micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                
                const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
                const arrayBuffer = await blob.arrayBuffer();
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                
                // Extract channel data
                const data = audioBuffer.getChannelData(0);
                
                // Find a decent chunk (e.g., middle 1024 samples)
                const startIdx = Math.floor(data.length / 2) - 512;
                const chunk = data.slice(Math.max(0, startIdx), Math.max(0, startIdx) + 1024);
                
                // Map to points
                this.points = [];
                for (let i = 0; i < this.width; i++) {
                    const dataIdx = Math.floor((i / this.width) * chunk.length);
                    const val = chunk[dataIdx] || 0; // -1 to 1
                    
                    const y = (1 - val) * (this.height / 2);
                    this.points.push({ x: i, y: y });
                }
                
                // Ensure it wraps correctly by forcing endpoints to 0
                this.normalize();
                this.render();
                
                // Auto-apply if track is selected
                document.getElementById('btn-drawer-apply').click();
            };
            
            mediaRecorder.start();
            // Record for exactly 200ms to get a short vocal cycle
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                    stream.getTracks().forEach(t => t.stop());
                }
            }, 200);
            
        } catch (err) {
            console.error("Mic access denied:", err);
            alert("Microphone access is required to use the Voice-to-Waveform feature.");
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.points = [];
        this.addPoint(e);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        this.addPoint(e);
        this.render();
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.interpolatePoints();
        this.render();
    }
    
    addPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        this.points.push({
            x: Math.max(0, Math.min(this.width, x)),
            y: Math.max(0, Math.min(this.height, y))
        });
    }
    
    // Fill in gaps horizontally so we have exactly 1 value per X pixel
    interpolatePoints() {
        if (this.points.length === 0) return;
        
        this.points.sort((a, b) => a.x - b.x);
        const wave = new Array(this.width).fill(this.height / 2);
        
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i+1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            
            for (let x = Math.floor(p1.x); x < Math.floor(p2.x); x++) {
                if (x >= 0 && x < this.width) {
                    const progress = dx === 0 ? 0 : (x - p1.x) / dx;
                    // Ease instead of linear for less wonkiness
                    const t = progress;
                    const easeProgress = t * t * (3 - 2 * t); // Smoothstep
                    wave[x] = p1.y + easeProgress * dy;
                }
            }
        }
        
        // Edge cases
        const first = this.points[0];
        const last = this.points[this.points.length - 1];
        for (let x = 0; x < Math.floor(first.x); x++) wave[x] = first.y;
        for (let x = Math.floor(last.x); x < this.width; x++) wave[x] = last.y;
        
        // Convert to points array
        this.points = wave.map((y, x) => ({x, y}));
    }
    
    smooth() {
        if (this.points.length === 0) return;
        const newPoints = [];
        for (let i = 0; i < this.points.length; i++) {
            let sum = 0;
            let count = 0;
            for (let j = -5; j <= 5; j++) {
                if (this.points[i + j]) {
                    sum += this.points[i + j].y;
                    count++;
                }
            }
            newPoints.push({ x: this.points[i].x, y: sum / count });
        }
        this.points = newPoints;
        this.render();
    }
    
    invert() {
        if (this.points.length === 0) return;
        const mid = this.height / 2;
        this.points = this.points.map(p => ({ x: p.x, y: mid - (p.y - mid) }));
        this.render();
    }
    
    noise() {
        if (this.points.length === 0) return;
        this.points = this.points.map(p => {
            const noiseOffset = (Math.random() - 0.5) * 20;
            return { x: p.x, y: Math.max(0, Math.min(this.height, p.y + noiseOffset)) };
        });
        this.render();
    }
    
    normalize() {
        if (this.points.length === 0) return;
        const mid = this.height / 2;
        let maxDev = 0.001;
        this.points.forEach(p => {
            const dev = Math.abs(p.y - mid);
            if (dev > maxDev) maxDev = dev;
        });
        
        const scale = (this.height / 2 - 2) / maxDev;
        this.points = this.points.map(p => ({
            x: p.x,
            y: mid + (p.y - mid) * scale
        }));
        this.render();
    }
    
    clear() {
        this.points = [];
        for (let x = 0; x < this.width; x++) {
            this.points.push({x, y: this.height / 2});
        }
        this.render();
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Center line
        this.ctx.strokeStyle = '#3e3e42';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height / 2);
        this.ctx.lineTo(this.width, this.height / 2);
        this.ctx.stroke();
        
        if (this.points.length === 0) return;
        
        this.ctx.strokeStyle = '#5ab15a';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            this.ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        this.ctx.stroke();
    }
    
    // Normalize and extract waveform as values from -1 to 1
    getNormalizedWaveform() {
        return this.points.map(p => {
            // Y is 0 at top, height at bottom.
            return 1 - (p.y / (this.height / 2));
        });
    }
    
    // Compute DFT to get PeriodicWave for AudioContext
    createPeriodicWave(audioCtx, harmonics = 64) {
        const wave = this.getNormalizedWaveform();
        const L = wave.length;
        
        const real = new Float32Array(harmonics);
        const imag = new Float32Array(harmonics);
        
        for (let k = 0; k < harmonics; k++) {
            let sumReal = 0;
            let sumImag = 0;
            for (let n = 0; n < L; n++) {
                const angle = 2 * Math.PI * k * n / L;
                sumReal += wave[n] * Math.cos(angle);
                sumImag += wave[n] * -Math.sin(angle);
            }
            real[k] = (2 / L) * sumReal;
            imag[k] = (2 / L) * sumImag;
        }
        
        // DC offset
        real[0] = real[0] / 2;
        imag[0] = 0;
        
        const periodicWave = audioCtx.createPeriodicWave(real, imag, {disableNormalization: false});
        return { periodicWave, real, imag };
    }
}
