// ========================================
// Track.js — Grid-based Track Editor and Rendering
// ========================================

const TILE_SIZE = 100;

// Tile types with their connection ports (top, right, bottom, left)
const TILE_TYPES = {
    EMPTY: { id: 0, ports: [0, 0, 0, 0], render: null },
    STRAIGHT_V: { id: 1, ports: [1, 0, 1, 0], render: renderStraightV },
    STRAIGHT_H: { id: 2, ports: [0, 1, 0, 1], render: renderStraightH },
    CURVE_TR: { id: 3, ports: [1, 1, 0, 0], render: renderCurveTR }, // Top to Right
    CURVE_BR: { id: 4, ports: [0, 1, 1, 0], render: renderCurveBR }, // Bottom to Right
    CURVE_BL: { id: 5, ports: [0, 0, 1, 1], render: renderCurveBL }, // Bottom to Left
    CURVE_TL: { id: 6, ports: [1, 0, 0, 1], render: renderCurveTL }, // Top to Left
    START_H: { id: 7, ports: [0, 1, 0, 1], render: renderStartH, isStart: true },
    START_V: { id: 8, ports: [1, 0, 1, 0], render: renderStartV, isStart: true }
};

function renderStraightV(ctx, x, y, size) {
    drawRoadPath(ctx, x + size/2, y, x + size/2, y + size, size);
}
function renderStraightH(ctx, x, y, size) {
    drawRoadPath(ctx, x, y + size/2, x + size, y + size/2, size);
}
function renderCurveTR(ctx, x, y, size) {
    drawRoadCurve(ctx, x + size, y, size/2, Math.PI/2, Math.PI, size);
}
function renderCurveBR(ctx, x, y, size) {
    drawRoadCurve(ctx, x + size, y + size, size/2, Math.PI, Math.PI*1.5, size);
}
function renderCurveBL(ctx, x, y, size) {
    drawRoadCurve(ctx, x, y + size, size/2, Math.PI*1.5, Math.PI*2, size);
}
function renderCurveTL(ctx, x, y, size) {
    drawRoadCurve(ctx, x, y, size/2, 0, Math.PI/2, size);
}
function renderStartH(ctx, x, y, size) {
    renderStraightH(ctx, x, y, size);
    drawStartLine(ctx, x + size/2, y, size, false);
}
function renderStartV(ctx, x, y, size) {
    renderStraightV(ctx, x, y, size);
    drawStartLine(ctx, x, y + size/2, size, true);
}

function drawRoadPath(ctx, x1, y1, x2, y2, size) {
    // Outer border
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = size * 0.85; ctx.lineCap = 'butt'; ctx.strokeStyle = '#fff'; ctx.stroke();
    // Inner road
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = size * 0.75; ctx.lineCap = 'butt'; ctx.strokeStyle = '#222'; ctx.stroke();
    // Center line
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = 2; ctx.setLineDash([20, 20]); ctx.strokeStyle = '#ff2a2a'; ctx.stroke(); ctx.setLineDash([]);
}

function drawRoadCurve(ctx, cx, cy, radius, startAngle, endAngle, size) {
    // Outer border
    ctx.beginPath(); ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = size * 0.85; ctx.lineCap = 'butt'; ctx.strokeStyle = '#fff'; ctx.stroke();
    // Inner road
    ctx.beginPath(); ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = size * 0.75; ctx.lineCap = 'butt'; ctx.strokeStyle = '#222'; ctx.stroke();
    // Center line
    ctx.beginPath(); ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 2; ctx.setLineDash([20, 20]); ctx.strokeStyle = '#ff2a2a'; ctx.stroke(); ctx.setLineDash([]);
}

function drawStartLine(ctx, px, py, size, isVertical) {
    const rw = size * 0.75;
    ctx.fillStyle = '#fff';
    if (isVertical) {
        for(let i=0; i<rw; i+=10) {
            ctx.fillStyle = (i/10)%2===0 ? '#fff' : '#111';
            ctx.fillRect(px, py - 6 + (i%20===0?0:6), 12, 10);
        }
    } else {
        for(let i=0; i<rw; i+=10) {
            ctx.fillStyle = (i/10)%2===0 ? '#fff' : '#111';
            ctx.fillRect(px - 6 + (i%20===0?0:6), py, 10, 12);
        }
    }
} else {
        // Line across vertical road
        ctx.fillRect(px - 4, py, 8, rw);
    }
}


class Track {
    constructor(cols = 20, rows = 15) {
        this.cols = cols;
        this.rows = rows;
        this.grid = new Array(cols * rows).fill(0); // 0 = empty
        this.checkpoints = [];
        this.startPos = { x: 0, y: 0, angle: 0 };
    }

    setTile(c, r, typeId) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
        this.grid[r * this.cols + c] = typeId;
    }

    getTile(c, r) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return 0;
        return this.grid[r * this.cols + c];
    }

    // Validates if the tile connections match up
    isValid() {
        let hasStart = false;
        let startCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const id = this.getTile(c, r);
                if (id === 0) continue;
                
                const type = Object.values(TILE_TYPES).find(t => t.id === id);
                if (type.isStart) {
                    hasStart = true;
                    startCount++;
                }

                const ports = type.ports;
                // Top
                if (ports[0]) {
                    const adj = this.getTileType(c, r - 1);
                    if (!adj || !adj.ports[2]) return false;
                }
                // Right
                if (ports[1]) {
                    const adj = this.getTileType(c + 1, r);
                    if (!adj || !adj.ports[3]) return false;
                }
                // Bottom
                if (ports[2]) {
                    const adj = this.getTileType(c, r + 1);
                    if (!adj || !adj.ports[0]) return false;
                }
                // Left
                if (ports[3]) {
                    const adj = this.getTileType(c - 1, r);
                    if (!adj || !adj.ports[1]) return false;
                }
            }
        }
        return hasStart && startCount === 1;
    }

    getTileType(c, r) {
        const id = this.getTile(c, r);
        return Object.values(TILE_TYPES).find(t => t.id === id) || TILE_TYPES.EMPTY;
    }

    computeCheckpoints() {
        this.checkpoints = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.getTileType(c, r);
                if (type.id !== 0) {
                    // Place a checkpoint in the middle of each road tile
                    this.checkpoints.push({
                        x: c * TILE_SIZE + TILE_SIZE / 2,
                        y: r * TILE_SIZE + TILE_SIZE / 2,
                        radius: TILE_SIZE * 0.5
                    });
                    
                    if (type.isStart) {
                        this.startPos.x = c * TILE_SIZE + TILE_SIZE / 2;
                        this.startPos.y = r * TILE_SIZE + TILE_SIZE / 2;
                        this.startPos.angle = type.id === TILE_TYPES.START_H ? 0 : Math.PI/2;
                    }
                }
            }
        }
    }

    render(ctx) {
        // Draw Grass
        ctx.fillStyle = '#111111'; // Dark background
        ctx.fillRect(0, 0, this.cols * TILE_SIZE, this.rows * TILE_SIZE);
        
        // Background grid dots
        ctx.fillStyle = '#333';
        for (let r = 0; r < this.rows * 5; r++) {
            for (let c = 0; c < this.cols * 5; c++) {
                ctx.fillRect(c * (TILE_SIZE/5), r * (TILE_SIZE/5), 2, 2);
            }
        }

        // Draw Road
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.getTileType(c, r);
                if (type.render) {
                    type.render(ctx, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE);
                }
            }
        }
        
        // Draw Grid Lines (only when editing)
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let r = 0; r <= this.rows; r++) {
            ctx.beginPath(); ctx.moveTo(0, r * TILE_SIZE); ctx.lineTo(this.cols * TILE_SIZE, r * TILE_SIZE); ctx.stroke();
        }
        for (let c = 0; c <= this.cols; c++) {
            ctx.beginPath(); ctx.moveTo(c * TILE_SIZE, 0); ctx.lineTo(c * TILE_SIZE, this.rows * TILE_SIZE); ctx.stroke();
        }
    }

    renderCollisionCanvas(collisionCanvas) {
        collisionCanvas.width = this.cols * TILE_SIZE;
        collisionCanvas.height = this.rows * TILE_SIZE;
        const ctx = collisionCanvas.getContext('2d', { willReadFrequently: true });
        
        // Grass (black/false)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, collisionCanvas.width, collisionCanvas.height);
        
        // Road (white/true)
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.getTileType(c, r);
                if (type.render) {
                    // Hack to draw road in white for collision map
                    const originalStroke = ctx.strokeStyle;
                    ctx.strokeStyle = '#ffffff'; 
                    // Override styles for collision drawing
                    const oldDrawRoadPath = drawRoadPath;
                    const oldDrawRoadCurve = drawRoadCurve;
                    
                    const drawCollisionPath = (c, x1, y1, x2, y2, size) => {
                        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
                        c.lineWidth = size * 0.8; c.lineCap = 'butt'; c.strokeStyle = '#ffffff'; c.stroke();
                    };
                    const drawCollisionCurve = (c, cx, cy, radius, sA, eA, size) => {
                        c.beginPath(); c.arc(cx, cy, radius, sA, eA);
                        c.lineWidth = size * 0.8; c.lineCap = 'butt'; c.strokeStyle = '#ffffff'; c.stroke();
                    };
                    
                    // Temp override
                    window.tempDrawPath = drawCollisionPath;
                    window.tempDrawCurve = drawCollisionCurve;
                    
                    if(type.id === TILE_TYPES.STRAIGHT_V.id) drawCollisionPath(ctx, c*TILE_SIZE + TILE_SIZE/2, r*TILE_SIZE, c*TILE_SIZE + TILE_SIZE/2, (r+1)*TILE_SIZE, TILE_SIZE);
                    if(type.id === TILE_TYPES.STRAIGHT_H.id) drawCollisionPath(ctx, c*TILE_SIZE, r*TILE_SIZE + TILE_SIZE/2, (c+1)*TILE_SIZE, r*TILE_SIZE + TILE_SIZE/2, TILE_SIZE);
                    if(type.id === TILE_TYPES.CURVE_TR.id) drawCollisionCurve(ctx, (c+1)*TILE_SIZE, r*TILE_SIZE, TILE_SIZE/2, Math.PI/2, Math.PI, TILE_SIZE);
                    if(type.id === TILE_TYPES.CURVE_BR.id) drawCollisionCurve(ctx, (c+1)*TILE_SIZE, (r+1)*TILE_SIZE, TILE_SIZE/2, Math.PI, Math.PI*1.5, TILE_SIZE);
                    if(type.id === TILE_TYPES.CURVE_BL.id) drawCollisionCurve(ctx, c*TILE_SIZE, (r+1)*TILE_SIZE, TILE_SIZE/2, Math.PI*1.5, Math.PI*2, TILE_SIZE);
                    if(type.id === TILE_TYPES.CURVE_TL.id) drawCollisionCurve(ctx, c*TILE_SIZE, r*TILE_SIZE, TILE_SIZE/2, 0, Math.PI/2, TILE_SIZE);
                    
                    if(type.id === TILE_TYPES.START_H.id) drawCollisionPath(ctx, c*TILE_SIZE, r*TILE_SIZE + TILE_SIZE/2, (c+1)*TILE_SIZE, r*TILE_SIZE + TILE_SIZE/2, TILE_SIZE);
                    if(type.id === TILE_TYPES.START_V.id) drawCollisionPath(ctx, c*TILE_SIZE + TILE_SIZE/2, r*TILE_SIZE, c*TILE_SIZE + TILE_SIZE/2, (r+1)*TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    serialize() {
        return JSON.stringify({
            cols: this.cols,
            rows: this.rows,
            grid: this.grid
        });
    }

    deserialize(dataStr) {
        try {
            const data = JSON.parse(dataStr);
            this.cols = data.cols;
            this.rows = data.rows;
            this.grid = data.grid;
            this.computeCheckpoints();
        } catch (e) {
            console.error("Failed to load track data");
        }
    }

    static createDefaultOval() {
        const track = new Track(10, 8);
        track.setTile(2, 2, TILE_TYPES.CURVE_TL.id);
        track.setTile(3, 2, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(4, 2, TILE_TYPES.START_H.id);
        track.setTile(5, 2, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(6, 2, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(7, 2, TILE_TYPES.CURVE_TR.id);
        
        track.setTile(7, 3, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(7, 4, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(7, 5, TILE_TYPES.CURVE_BR.id);
        
        track.setTile(6, 5, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(5, 5, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(4, 5, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(3, 5, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(2, 5, TILE_TYPES.CURVE_BL.id);
        
        track.setTile(2, 4, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(2, 3, TILE_TYPES.STRAIGHT_V.id);
        
        track.computeCheckpoints();
        return track;
    }
}

window.TILE_TYPES = TILE_TYPES;
window.TILE_SIZE = TILE_SIZE;
window.Track = Track;
