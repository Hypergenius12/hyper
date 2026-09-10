import { getBiomeParams, getColumnInfo } from './generation.js';
import { createNoise2D } from './noise.js';

export class BiomeMap {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('biome-map-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = document.getElementById('biome-map-tooltip');
        this.isOpen = false;
        
        // Map State
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetZ = 0;
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        
        // Setup events
        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseZ = e.clientY - rect.top;
            
            const worldX = Math.floor(this.offsetX + (mouseX - this.canvas.width / 2) / this.zoom);
            const worldZ = Math.floor(this.offsetZ + (mouseZ - this.canvas.height / 2) / this.zoom);
            
            // Set or remove waypoint
            if (!this.game.waypoints) this.game.waypoints = [];
            
            // Check if clicking near an existing waypoint to remove it
            let clickedExisting = false;
            for (let i = 0; i < this.game.waypoints.length; i++) {
                const wp = this.game.waypoints[i];
                if (wp.dim !== this.game.currentDimension) continue;
                
                const screenX = this.canvas.width / 2 + (wp.x - this.offsetX) * this.zoom;
                const screenZ = this.canvas.height / 2 + (wp.z - this.offsetZ) * this.zoom;
                
                const dist = Math.hypot(mouseX - screenX, mouseZ - screenZ);
                if (dist < 15) {
                    this.game.waypoints.splice(i, 1);
                    clickedExisting = true;
                    break;
                }
            }
            
            if (!clickedExisting) {
                this.game.waypoints.push({ x: worldX, z: worldZ, dim: this.game.currentDimension });
            }
            
            this.draw();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 2) return; // Right click handles waypoints
            this.isDragging = true;
            this.lastMouse = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isOpen) {
                if (this.isDragging) {
                    const dx = e.clientX - this.lastMouse.x;
                    const dy = e.clientY - this.lastMouse.y;
                    this.offsetX -= dx * (1 / this.zoom);
                    this.offsetZ -= dy * (1 / this.zoom);
                    this.lastMouse = { x: e.clientX, y: e.clientY };
                    this.draw();
                } else {
                    this.updateTooltip(e);
                }
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            if (!this.isOpen) return;
            e.preventDefault();
            const zoomAmount = 0.1;
            const delta = e.deltaY > 0 ? -zoomAmount : zoomAmount;
            const newZoom = Math.max(0.1, Math.min(10, this.zoom + delta));
            
            // Adjust offset to zoom towards mouse center
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseZ = e.clientY - rect.top;
            
            const worldX = this.offsetX + (mouseX - this.canvas.width / 2) / this.zoom;
            const worldZ = this.offsetZ + (mouseZ - this.canvas.height / 2) / this.zoom;
            
            this.zoom = newZoom;
            
            this.offsetX = worldX - (mouseX - this.canvas.width / 2) / this.zoom;
            this.offsetZ = worldZ - (mouseZ - this.canvas.height / 2) / this.zoom;
            
            this.draw();
        }, { passive: false });

        document.getElementById('btn-close-map').addEventListener('click', () => {
            this.close();
        });

        document.getElementById('btn-clear-waypoints').addEventListener('click', () => {
            if (this.game.waypoints) {
                // Only clear waypoints for current dimension
                this.game.waypoints = this.game.waypoints.filter(w => w.dim !== this.game.currentDimension);
                this.draw();
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            if (this.isOpen) this.resizeCanvas();
        });
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.draw();
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        this.isOpen = true;
        document.getElementById('biome-map-screen').classList.remove('hidden');
        this.resizeCanvas();
        
        // Center on player
        if (this.game.player) {
            this.offsetX = this.game.player.position.x;
            this.offsetZ = this.game.player.position.z;
        } else {
            this.offsetX = 0;
            this.offsetZ = 0;
        }
        
        if (this.game.input && this.game.input.isPointerLocked()) {
            document.exitPointerLock();
        }
        
        this.draw();
    }

    close() {
        this.isOpen = false;
        document.getElementById('biome-map-screen').classList.add('hidden');
        if (this.game.input && !this.game.input.isPointerLocked() && !this.game.input.menuKeys.inventory) {
            this.game.input.requestPointerLock();
        }
    }

    getGenerationParams() {
        return this.game.planetParams;
    }

    getMapBiome(worldX, worldZ) {
        const params = this.getGenerationParams();
        if (!params) return 'Unknown';
        
        const dim = this.game.currentDimension || 'overworld';
        
        if (dim === 'nether') {
            const temp = (params.tempNoise(worldX * 0.005, worldZ * 0.005) + 1) / 2;
            const moist = (params.moistNoise(worldX * 0.005, worldZ * 0.005) + 1) / 2;
            if (temp > 0.6) return 'Crimson Forest';
            if (moist < 0.4) return 'Soul Sand Valley';
            return 'Nether Wastes';
        } 
        if (dim === 'caverns') {
            const biomeNoise = params.tempNoise(worldX * 0.005, worldZ * 0.005);
            if (biomeNoise > 0.4) return 'Magma Caves';
            if (biomeNoise < -0.4) return 'Crystal Caves';
            return 'Caverns';
        }
        if (dim === 'highlands') {
            const biomeNoiseVal = params.noise2D(worldX * 0.002 + 5000, worldZ * 0.002 + 5000);
            if (biomeNoiseVal < -0.3) return 'Volcanic Peaks';
            if (biomeNoiseVal < 0.2) return 'Meadows';
            if (biomeNoiseVal < 0.6) return 'Frozen Wastes';
            return 'Jagged Peaks';
        }
        if (dim === 'aether') {
            return 'Aether Islands';
        }
        
        // Overworld
        const colInfo = getColumnInfo(worldX, worldZ, params);
        if (colInfo.bData && colInfo.bData.lakeSurfaceY > 0 && colInfo.surfaceY <= colInfo.bData.lakeSurfaceY) {
            return 'Lake';
        }
        return colInfo.biome.name;
    }

    updateTooltip(e) {
        if (!this.isOpen) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseZ = e.clientY - rect.top;
        
        const worldX = Math.floor(this.offsetX + (mouseX - this.canvas.width / 2) / this.zoom);
        const worldZ = Math.floor(this.offsetZ + (mouseZ - this.canvas.height / 2) / this.zoom);
        
        const biomeName = this.getMapBiome(worldX, worldZ);
        
        this.tooltip.style.left = (e.clientX + 10) + 'px';
        this.tooltip.style.top = (e.clientY + 10) + 'px';
        this.tooltip.style.display = 'block';
        this.tooltip.innerText = `${biomeName}`;

        const coordsEl = document.getElementById('biome-map-coords');
        if (coordsEl) {
            coordsEl.innerText = `X: ${worldX}, Z: ${worldZ}`;
        }
    }

    draw() {
        if (!this.isOpen || !this.ctx) return;
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);
        
        const params = this.getGenerationParams();
        
        // Define rendering resolution (pixels per sample to improve performance)
        const sampleSize = Math.max(1, Math.floor(4 / this.zoom)); 
        
        for (let x = 0; x < w; x += sampleSize) {
            for (let z = 0; z < h; z += sampleSize) {
                const worldX = this.offsetX + (x - w / 2) / this.zoom;
                const worldZ = this.offsetZ + (z - h / 2) / this.zoom;
                
                const biomeName = this.getMapBiome(worldX, worldZ);
                
                // Base color based on biome name
                let color = '#000000';
                switch (biomeName) {
                    case 'Deep Ocean': color = '#000055'; break;
                    case 'Ocean': color = '#0000AA'; break;
                    case 'Lake': color = '#2277BB'; break;
                    case 'Coral Reef': color = '#3333AA'; break;
                    case 'Beach': color = '#E6D28A'; break;
                    case 'Desert': color = '#D9B340'; break;
                    case 'Oasis': color = '#33CC33'; break;
                    case 'Badlands': color = '#D98A40'; break;
                    case 'Savanna': color = '#A8A64B'; break;
                    case 'Plains': color = '#6BCC47'; break;
                    case 'Forest': color = '#2E8C19'; break;
                    case 'Jungle': color = '#156105'; break;
                    case 'Swamp': color = '#38592A'; break;
                    case 'Dark Forest': color = '#1C3312'; break;
                    case 'Cherry Grove': color = '#FFB7C5'; break;
                    case 'Autumn Forest': color = '#D2691E'; break;
                    case 'Tundra': color = '#FFFFFF'; break;
                    case 'Ice Spikes': color = '#B3E6FF'; break;
                    case 'Mountains': color = '#A0A0A0'; break;
                    case 'Volcanic': color = '#331111'; break;
                    case 'Mushroom': color = '#FF66FF'; break;
                    case 'Alien': color = '#8800FF'; break;
                    case 'Glow Forest': color = '#00FFFF'; break;
                    case 'Crystal': color = '#a36ddb'; break;
                    // Nether
                    case 'Nether Wastes': color = '#5c1717'; break;
                    case 'Crimson Forest': color = '#8a0a1a'; break;
                    case 'Soul Sand Valley': color = '#4e3f36'; break;
                    // Caverns
                    case 'Caverns': color = '#444444'; break;
                    case 'Magma Caves': color = '#cc3300'; break;
                    case 'Crystal Caves': color = '#3399ff'; break;
                    // Highlands
                    case 'Jagged Peaks': color = '#DDDDDD'; break;
                    case 'Volcanic Peaks': color = '#222222'; break;
                    case 'Meadows': color = '#44AA55'; break;
                    case 'Frozen Wastes': color = '#EEEEFF'; break;
                    // Aether
                    case 'Aether Islands': color = '#FFFFEE'; break;
                    
                    default: color = '#555555'; break;
                }
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, z, sampleSize, sampleSize);
            }
        }
        
        // Draw player indicator
        if (this.game.player) {
            const px = this.game.player.position.x;
            const pz = this.game.player.position.z;
            
            const screenX = w / 2 + (px - this.offsetX) * this.zoom;
            const screenY = h / 2 + (pz - this.offsetZ) * this.zoom;
            
            this.ctx.fillStyle = 'red';
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Draw waypoints
        if (this.game.waypoints) {
            for (const wp of this.game.waypoints) {
                if (wp.dim !== this.game.currentDimension) continue;
                const screenX = w / 2 + (wp.x - this.offsetX) * this.zoom;
                const screenY = h / 2 + (wp.z - this.offsetZ) * this.zoom;
                
                this.ctx.fillStyle = '#00FF00';
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, screenY);
                this.ctx.lineTo(screenX - 5, screenY - 10);
                this.ctx.lineTo(screenX + 5, screenY - 10);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY - 10, 5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }
}
