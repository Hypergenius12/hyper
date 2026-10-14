import { getBiomeParams, getColumnInfo } from './generation.js?v=100';
import { createNoise2D, seededRandom } from './noise.js?v=100';

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

        // Keydown controls while map is open
        window.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            if (e.code === 'KeyC') {
                if (this.game.player) {
                    this.offsetX = this.game.player.position.x;
                    this.offsetZ = this.game.player.position.z;
                    this.draw();
                }
            }
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

    getMapBiomeInfo(worldX, worldZ) {
        const params = this.getGenerationParams();
        if (!params) return { name: 'Unknown', surfaceY: 64 };
        
        const dim = this.game.currentDimension || 'overworld';
        
        if (dim === 'nether') {
            const bNoise = params.tempNoise(worldX * 0.003, worldZ * 0.003);
            if (bNoise < -0.35) return { name: 'Basalt Deltas', surfaceY: 32 };
            if (bNoise < -0.05) return { name: 'Soul Sand Valley', surfaceY: 32 };
            if (bNoise < 0.25) return { name: 'Warped Forest', surfaceY: 48 };
            if (bNoise < 0.55) return { name: 'Crimson Forest', surfaceY: 48 };
            return { name: 'Nether Wastes', surfaceY: 32 };
        } 
        if (dim === 'aether') {
            return { name: 'Aether Islands', surfaceY: 96 };
        }
        
        // Overworld
        const colInfo = getColumnInfo(worldX, worldZ, params);
        let name = colInfo.biome ? colInfo.biome.name : 'Plains';
        if (colInfo.bData && colInfo.bData.lakeSurfaceY > 0 && colInfo.surfaceY <= colInfo.bData.lakeSurfaceY) {
            name = 'Lake';
        }
        return { name, surfaceY: colInfo.surfaceY };
    }

    getMapBiome(worldX, worldZ) {
        return this.getMapBiomeInfo(worldX, worldZ).name;
    }

    updateTooltip(e) {
        if (!this.isOpen) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseZ = e.clientY - rect.top;
        
        const worldX = Math.floor(this.offsetX + (mouseX - this.canvas.width / 2) / this.zoom);
        const worldZ = Math.floor(this.offsetZ + (mouseZ - this.canvas.height / 2) / this.zoom);
        
        const info = this.getMapBiomeInfo(worldX, worldZ);
        
        this.tooltip.style.left = (e.clientX + 12) + 'px';
        this.tooltip.style.top = (e.clientY + 12) + 'px';
        this.tooltip.style.display = 'block';
        this.tooltip.innerText = `${info.name} (Y: ${Math.round(info.surfaceY)})`;

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
        const isOverworld = (this.game.currentDimension || 'overworld') === 'overworld';
        
        for (let x = 0; x < w; x += sampleSize) {
            for (let z = 0; z < h; z += sampleSize) {
                const worldX = this.offsetX + (x - w / 2) / this.zoom;
                const worldZ = this.offsetZ + (z - h / 2) / this.zoom;
                
                const info = this.getMapBiomeInfo(worldX, worldZ);
                const biomeName = info.name;
                
                // Base color based on biome name
                let r = 85, g = 85, b = 85;
                switch (biomeName) {
                    case 'Deep Ocean': r = 0; g = 0; b = 85; break;
                    case 'Ocean': r = 0; g = 30; b = 170; break;
                    case 'Lake': r = 34; g = 119; b = 187; break;
                    case 'Coral Reef': r = 40; g = 80; b = 190; break;
                    case 'Beach': r = 230; g = 210; b = 138; break;
                    case 'Desert': r = 217; g = 179; b = 64; break;
                    case 'Oasis': r = 51; g = 204; b = 51; break;
                    case 'Badlands': r = 217; g = 138; b = 64; break;
                    case 'Savanna': r = 168; g = 166; b = 75; break;
                    case 'Plains': r = 107; g = 204; b = 71; break;
                    case 'Forest': r = 46; g = 140; b = 25; break;
                    case 'Birch Forest': r = 120; g = 181; b = 72; break;
                    case 'Jungle': r = 21; g = 97; b = 5; break;
                    case 'Swamp': r = 56; g = 89; b = 42; break;
                    case 'Dark Forest': r = 28; g = 51; b = 18; break;
                    case 'Cherry Grove': r = 255; g = 183; b = 197; break;
                    case 'Tundra': r = 240; g = 245; b = 255; break;
                    case 'Taiga': r = 45; g = 90; b = 39; break;
                    case 'Ice Spikes': r = 179; g = 230; b = 255; break;
                    case 'Mountains': r = 160; g = 160; b = 160; break;
                    case 'Volcanic': r = 51; g = 17; b = 17; break;
                    case 'Mystic Grove': r = 216; g = 180; b = 226; break;
                    case 'Redwood Forest': r = 120; g = 53; b = 15; break;
                    case 'Mushroom': r = 255; g = 102; b = 255; break;
                    // Nether
                    case 'Nether Wastes': r = 92; g = 23; b = 23; break;
                    case 'Crimson Forest': r = 138; g = 10; b = 26; break;
                    case 'Warped Forest': r = 13; g = 148; b = 136; break;
                    case 'Soul Sand Valley': r = 78; g = 63; b = 54; break;
                    case 'Basalt Deltas': r = 39; g = 39; b = 42; break;
                    // Aether
                    case 'Aether Islands': r = 255; g = 255; b = 238; break;
                    default: r = 85; g = 85; b = 85; break;
                }
                
                // Topographic relief shading (highlights north slopes, shadows south slopes)
                if (isOverworld && params) {
                    const northY = this.getMapBiomeInfo(worldX, worldZ - 2).surfaceY;
                    const slope = info.surfaceY - northY;
                    let factor = 1.0;
                    if (slope > 0) factor = 0.88; // Shadow on drop
                    else if (slope < 0) factor = 1.12; // Sun highlight on rise
                    r = Math.min(255, Math.floor(r * factor));
                    g = Math.min(255, Math.floor(g * factor));
                    b = Math.min(255, Math.floor(b * factor));
                }

                this.ctx.fillStyle = `rgb(${r},${g},${b})`;
                this.ctx.fillRect(x, z, sampleSize, sampleSize);
            }
        }
        
        // Draw structure markers
        if (this.game.currentDimension === 'overworld') {
            const params = this.getGenerationParams();
            if (params) {
                const iconSize = Math.max(7, Math.min(16, this.zoom * 9));
                const step = 16;
                const viewLeft   = Math.floor((this.offsetX - (w/2) / this.zoom) / step) * step;
                const viewRight  = Math.ceil((this.offsetX  + (w/2) / this.zoom) / step) * step;
                const viewTop    = Math.floor((this.offsetZ - (h/2) / this.zoom) / step) * step;
                const viewBottom = Math.ceil((this.offsetZ  + (h/2) / this.zoom) / step) * step;

                for (let wx = viewLeft; wx <= viewRight; wx += step) {
                    for (let wz = viewTop; wz <= viewBottom; wz += step) {
                        const floraRng = seededRandom(params.seed + wx * 7777 + wz);
                        const r = floraRng();
                        let structType = null;
                        if (r < 0.000022) structType = 'nether';
                        else if (r < 0.000022 + 0.000075) structType = 'cabin';
                        else if (r < 0.000022 + 0.000075 + 0.0000025) structType = 'pyramid';
                        else if (r < 0.000022 + 0.000075 + 0.0000025 + 0.0000008) structType = 'tower';
                        if (!structType) continue;

                        const sx = w / 2 + (wx - this.offsetX) * this.zoom;
                        const sz = h / 2 + (wz - this.offsetZ) * this.zoom;
                        if (sx < -iconSize || sx > w + iconSize || sz < -iconSize || sz > h + iconSize) continue;

                        const half = iconSize / 2;
                        this.ctx.save();
                        this.ctx.lineWidth = 1.5;
                        this.ctx.strokeStyle = '#fff';

                        if (structType === 'nether') {
                            this.ctx.fillStyle = 'rgba(145,0,240,0.95)';
                            this.ctx.fillRect(sx - half * 0.6, sz - half, half * 1.2, iconSize);
                            this.ctx.strokeRect(sx - half * 0.6, sz - half, half * 1.2, iconSize);
                        } else if (structType === 'cabin') {
                            this.ctx.fillStyle = 'rgba(180,120,60,0.95)';
                            this.ctx.fillRect(sx - half * 0.8, sz, half * 1.6, half);
                            this.ctx.strokeRect(sx - half * 0.8, sz, half * 1.6, half);
                            this.ctx.beginPath();
                            this.ctx.moveTo(sx - half, sz);
                            this.ctx.lineTo(sx, sz - half);
                            this.ctx.lineTo(sx + half, sz);
                            this.ctx.closePath();
                            this.ctx.fillStyle = 'rgba(215,85,50,0.95)';
                            this.ctx.fill();
                            this.ctx.stroke();
                        } else if (structType === 'pyramid') {
                            this.ctx.beginPath();
                            this.ctx.moveTo(sx, sz - half);
                            this.ctx.lineTo(sx + half, sz + half);
                            this.ctx.lineTo(sx - half, sz + half);
                            this.ctx.closePath();
                            this.ctx.fillStyle = 'rgba(240,195,60,0.95)';
                            this.ctx.fill();
                            this.ctx.stroke();
                        } else if (structType === 'tower') {
                            this.ctx.fillStyle = 'rgba(40,160,240,0.95)';
                            this.ctx.fillRect(sx - half * 0.4, sz - half, half * 0.8, iconSize);
                            this.ctx.strokeRect(sx - half * 0.4, sz - half, half * 0.8, iconSize);
                        }
                        this.ctx.restore();
                    }
                }

                // Legend at bottom left
                if (this.zoom >= 0.35) {
                    this.ctx.save();
                    const lx = 14, ly = h - 85;
                    this.ctx.fillStyle = 'rgba(15,20,25,0.75)';
                    this.ctx.fillRect(lx - 4, ly - 14, 140, 85);
                    this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(lx - 4, ly - 14, 140, 85);

                    const items = [
                        { name: 'House / Cabin', color: 'rgba(215,85,50,0.95)' },
                        { name: 'Nether Portal', color: 'rgba(145,0,240,0.95)' },
                        { name: 'Desert Pyramid', color: 'rgba(240,195,60,0.95)' },
                        { name: 'Wizard Tower', color: 'rgba(40,160,240,0.95)' }
                    ];
                    items.forEach((item, idx) => {
                        const iy = ly + idx * 18;
                        this.ctx.fillStyle = item.color;
                        this.ctx.fillRect(lx, iy, 10, 10);
                        this.ctx.fillStyle = '#fff';
                        this.ctx.font = '11px sans-serif';
                        this.ctx.textAlign = 'left';
                        this.ctx.fillText(item.name, lx + 16, iy + 9);
                    });
                    this.ctx.restore();
                }
            }
        }
        
        // Draw waypoints
        if (this.game.waypoints) {
            for (const wp of this.game.waypoints) {
                if (wp.dim !== this.game.currentDimension) continue;
                const screenX = w / 2 + (wp.x - this.offsetX) * this.zoom;
                const screenY = h / 2 + (wp.z - this.offsetZ) * this.zoom;
                
                this.ctx.fillStyle = '#00FF66';
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, screenY);
                this.ctx.lineTo(screenX - 6, screenY - 12);
                this.ctx.lineTo(screenX + 6, screenY - 12);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY - 12, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
            }
        }

        // Draw Player Directional Arrow (Minecraft Map style)
        if (this.game.player) {
            const px = this.game.player.position.x;
            const pz = this.game.player.position.z;
            const py = this.game.player.position.y;
            
            const screenX = w / 2 + (px - this.offsetX) * this.zoom;
            const screenY = h / 2 + (pz - this.offsetZ) * this.zoom;
            
            this.ctx.save();
            this.ctx.translate(screenX, screenY);

            // Pulsing radar wave
            const pulse = (Date.now() % 1500) / 1500;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 7 + pulse * 14, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(230, 40, 40, ${0.7 * (1 - pulse)})`;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            // Rotated directional chevron
            const yaw = this.game.player.rotation ? this.game.player.rotation.yaw : 0;
            this.ctx.rotate(-yaw);

            this.ctx.beginPath();
            this.ctx.moveTo(0, -10);
            this.ctx.lineTo(7, 8);
            this.ctx.lineTo(0, 4);
            this.ctx.lineTo(-7, 8);
            this.ctx.closePath();
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
            this.ctx.strokeStyle = '#e53935';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();

            this.ctx.restore();

            // Live HUD Card in top-left
            this.ctx.save();
            const cardX = 14, cardY = 14;
            const curBiome = this.getMapBiome(px, pz);
            const dimName = (this.game.currentDimension || 'overworld').toUpperCase();
            this.ctx.fillStyle = 'rgba(15,20,25,0.85)';
            this.ctx.fillRect(cardX, cardY, 230, 68);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(cardX, cardY, 230, 68);

            this.ctx.fillStyle = '#4ade80';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.fillText(`XYZ: ${Math.round(px)}, ${Math.round(py)}, ${Math.round(pz)}`, cardX + 10, cardY + 18);

            this.ctx.fillStyle = '#e2e8f0';
            this.ctx.font = '11px sans-serif';
            this.ctx.fillText(`Biome: ${curBiome}  [${dimName}]`, cardX + 10, cardY + 36);

            this.ctx.fillStyle = '#94a3b8';
            this.ctx.font = '10px sans-serif';
            this.ctx.fillText(`[C] Center  •  [R-Click] Waypoint  •  ${Math.round(this.zoom * 100)}%`, cardX + 10, cardY + 54);
            this.ctx.restore();

            // Compass Rose in top-right
            this.ctx.save();
            const crX = w - 35, crY = 35;
            this.ctx.fillStyle = 'rgba(15,20,25,0.7)';
            this.ctx.beginPath();
            this.ctx.arc(crX, crY, 20, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            this.ctx.stroke();

            this.ctx.font = 'bold 11px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#ef4444';
            this.ctx.fillText('N', crX, crY - 11);
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText('S', crX, crY + 11);
            this.ctx.fillText('E', crX + 11, crY);
            this.ctx.fillText('W', crX - 11, crY);
            this.ctx.restore();
        }
    }
}
}
