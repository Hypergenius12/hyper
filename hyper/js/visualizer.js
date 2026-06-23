class Visualizer {
    constructor(canvasId, analyser) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.analyser = analyser;
        
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        
        this.modes = ['waveform', 'spectrum', 'circular'];
        this.modeIndex = 0;
        
        // Custom settings
        this.blurAmount = 0.0; // 0.0 means completely clear (no trail)
        this.colorMode = 'accent'; // 'accent', 'rainbow'
        this.smoothing = 0.8;
        
        this.isFrozen = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.draw();
    }
    
    get mode() {
        return this.modes[this.modeIndex];
    }
    
    setSmoothing(val) {
        this.smoothing = val;
        this.analyser.smoothingTimeConstant = this.smoothing;
    }
    
    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }
    
    toggleMode() {
        this.modeIndex = (this.modeIndex + 1) % this.modes.length;
    }
    
    getAccentColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5ab15a';
    }
    
    draw() {
        requestAnimationFrame(() => this.draw());
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        if (this.blurAmount <= 0.01) {
            this.ctx.clearRect(0, 0, width, height);
        } else {
            this.ctx.fillStyle = `rgba(24, 24, 24, ${1.0 - this.blurAmount})`; 
            this.ctx.fillRect(0, 0, width, height);
        }
        
        if (this.mode === 'waveform') {
            this.analyser.getByteTimeDomainData(this.dataArray);
            
            let startIndex = 0;
            if (this.isFrozen) {
                // Find positive zero-crossing to stabilize the waveform
                for (let i = 0; i < this.bufferLength - 1; i++) {
                    if (this.dataArray[i] <= 128 && this.dataArray[i + 1] > 128) {
                        startIndex = i;
                        break;
                    }
                }
            }
            
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            const drawCount = this.bufferLength - startIndex;
            const sliceWidth = width * 1.0 / drawCount; // Stretch to fill screen
            let x = 0;
            
            for (let i = startIndex; i < this.bufferLength; i++) {
                const v = this.dataArray[i] / 128.0; // 0 to 2
                const y = v * height / 2;
                
                // Color Logic
                if (this.colorMode === 'rainbow') {
                    this.ctx.strokeStyle = `hsl(${(i / this.bufferLength) * 360}, 100%, 60%)`;
                } else {
                    this.ctx.strokeStyle = this.getAccentColor();
                }
                
                if (i === startIndex) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
                
                if (this.colorMode === 'rainbow') {
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            this.ctx.lineTo(width, height / 2);
            this.ctx.stroke();
            
        } else if (this.mode === 'spectrum') {
            this.analyser.getByteFrequencyData(this.dataArray);
            
            const barWidth = (width / this.bufferLength) * 2.5;
            let x = 0;
            
            for(let i = 0; i < this.bufferLength; i++) {
                const barHeight = (this.dataArray[i] / 255) * height;
                
                if (this.colorMode === 'rainbow') {
                    const hue = i / this.bufferLength * 360;
                    this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                } else {
                    this.ctx.fillStyle = this.getAccentColor();
                }
                
                this.ctx.globalAlpha = (i / this.bufferLength) * 0.5 + 0.5; // slight fade
                this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
            this.ctx.globalAlpha = 1.0;
            
        } else if (this.mode === 'circular') {
            this.analyser.getByteFrequencyData(this.dataArray);
            
            const centerX = width / 2;
            const centerY = height / 2;
            const baseRadius = Math.min(width, height) * 0.2;
            const maxRadius = Math.min(width, height) * 0.45;
            
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            // Draw a circle of points based on frequency bins
            const steps = 64; // skip some bins for visual clarity
            const stepSize = Math.floor(this.bufferLength / steps);
            
            for (let i = 0; i <= steps; i++) {
                // Loop back to 0 to close the circle
                const dataIndex = (i === steps) ? 0 : i * stepSize;
                const value = this.dataArray[dataIndex];
                
                const amp = value / 255;
                const r = baseRadius + amp * (maxRadius - baseRadius);
                
                const angle = (i / steps) * Math.PI * 2 - (Math.PI / 2);
                
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                
                // Color Logic
                if (this.colorMode === 'rainbow') {
                    this.ctx.strokeStyle = `hsl(${(i / steps) * 360}, 100%, 60%)`;
                } else {
                    this.ctx.strokeStyle = this.getAccentColor();
                }
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
                
                if (this.colorMode === 'rainbow') {
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                }
            }
            if (this.colorMode !== 'rainbow') {
                this.ctx.closePath();
                this.ctx.stroke();
            }
            
            // Inner circle
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, baseRadius * 0.9, 0, Math.PI * 2);
            if (this.colorMode === 'rainbow') {
                this.ctx.fillStyle = '#ff007f';
            } else {
                this.ctx.fillStyle = this.getAccentColor();
            }
            this.ctx.globalAlpha = 0.1;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }
    }
}
