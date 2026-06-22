

class Renderer {
    constructor(canvas, ctx, game) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.game = game;
        
        this.cameraX = Config.MAP_WIDTH / 2;
        this.cameraY = Config.MAP_HEIGHT / 2;
        this.zoom = 1;
        this.targetZoom = 1;
    }

    updateCamera(playerId) {
        const myCells = this.game.entities.filter(e => e.type === 'cell' && e.ownerId === playerId);
        
        if (myCells.length === 0) return; // Dead, leave camera where it is
        
        let cx = 0, cy = 0, totalMass = 0;
        for (let cell of myCells) {
            cx += cell.x * cell.mass;
            cy += cell.y * cell.mass;
            totalMass += cell.mass;
        }
        
        if (totalMass > 0) {
            cx /= totalMass;
            cy /= totalMass;
            
            // Smooth camera interpolation
            this.cameraX = MathUtils.lerp(this.cameraX, cx, 0.1);
            this.cameraY = MathUtils.lerp(this.cameraY, cy, 0.1);
            
            // Zoom out as we get bigger
            const targetZoom = Math.pow(Config.START_MASS / totalMass, 0.4) * 1.5;
            this.targetZoom = Math.max(0.05, Math.min(1.5, targetZoom));
        }
        
        this.zoom = MathUtils.lerp(this.zoom, this.targetZoom, 0.05);
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#f2fbff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        
        // Center camera
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.cameraX, -this.cameraY);

        this.drawGrid();

        // Calculate view bounds for culling
        const viewLeft = this.cameraX - (this.canvas.width / 2 / this.zoom);
        const viewRight = this.cameraX + (this.canvas.width / 2 / this.zoom);
        const viewTop = this.cameraY - (this.canvas.height / 2 / this.zoom);
        const viewBottom = this.cameraY + (this.canvas.height / 2 / this.zoom);

        const visibleEntities = [];
        for (let i = 0; i < this.game.entities.length; i++) {
            const entity = this.game.entities[i];
            
            // Optimization: If we are huge and zoomed way out, don't render tiny passive food
            if (entity.type === 'food' && this.zoom < 0.15) {
                continue;
            }
            
            const renderRadius = entity.displayRadius !== undefined ? entity.displayRadius : entity.radius;

            // View culling: don't draw if completely outside camera bounds
            if (entity.x + renderRadius < viewLeft ||
                entity.x - renderRadius > viewRight ||
                entity.y + renderRadius < viewTop ||
                entity.y - renderRadius > viewBottom) {
                continue;
            }
            visibleEntities.push(entity);
        }

        // Sort ONLY visible entities by radius to draw smaller ones first
        visibleEntities.sort((a, b) => {
            // Food always on bottom, then viruses, then cells
            if (a.type === 'food' && b.type !== 'food') return -1;
            if (b.type === 'food' && a.type !== 'food') return 1;
            return a.radius - b.radius;
        });

        for (let i = 0; i < visibleEntities.length; i++) {
            this.drawEntity(visibleEntities[i]);
        }

        // Draw Map Border
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 10;
        this.ctx.strokeRect(0, 0, Config.MAP_WIDTH, Config.MAP_HEIGHT);

        this.ctx.restore();
        
        // Draw minimap on top of everything
        this.drawMinimap();
    }

    drawGrid() {
        if (this.zoom < 0.1) return; // Don't draw grid if heavily zoomed out
        
        let gridSize = 50;
        if (this.zoom < 0.5) gridSize = 100;
        if (this.zoom < 0.25) gridSize = 250;
        
        const width = Config.MAP_WIDTH;
        const height = Config.MAP_HEIGHT;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Only draw grid where camera sees
        const startX = Math.max(0, Math.floor((this.cameraX - this.canvas.width / 2 / this.zoom) / gridSize) * gridSize);
        const endX = Math.min(width, Math.ceil((this.cameraX + this.canvas.width / 2 / this.zoom) / gridSize) * gridSize);
        const startY = Math.max(0, Math.floor((this.cameraY - this.canvas.height / 2 / this.zoom) / gridSize) * gridSize);
        const endY = Math.min(height, Math.ceil((this.cameraY + this.canvas.height / 2 / this.zoom) / gridSize) * gridSize);

        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }
        this.ctx.stroke();
    }

    drawEntity(entity) {
        if (entity.type === 'food') {
            const renderRadius = entity.displayRadius !== undefined ? entity.displayRadius : entity.radius;
            this.ctx.fillStyle = entity.color;
            // Drawing rectangles is vastly faster than drawing arcs/circles in HTML5 Canvas
            this.ctx.fillRect(entity.x - renderRadius, entity.y - renderRadius, renderRadius * 2, renderRadius * 2);
            return;
        }

        this.ctx.beginPath();
        
        if (entity.type === 'cell' && entity.spawnTime && Date.now() - entity.spawnTime < 3000) {
            this.ctx.globalAlpha = 0.4; // Semi-transparent for spawn immunity
        }
        
        if (entity.type === 'virus' || entity.type === 'mothercell') {
            this.drawVirus(entity);
            this.ctx.globalAlpha = 1.0;
            return;
        }

        const renderRadius = entity.displayRadius !== undefined ? entity.displayRadius : entity.radius;
        this.ctx.arc(entity.x, entity.y, renderRadius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = entity.color;
        this.ctx.fill();
        
        // Border
        if (entity.type === 'cell' || entity.type === 'ejected') {
            this.ctx.lineWidth = Math.max(2, entity.radius * 0.1);
            this.ctx.strokeStyle = this.shadeColor(entity.color, -20);
            this.ctx.stroke();
        }

        // Text
        if (entity.type === 'cell') {
            if (entity.radius > 20) {
                this.ctx.fillStyle = 'white';
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 3;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                // Name
                if (entity.name) {
                    const fontSize = Math.max(10, entity.radius * 0.4);
                    this.ctx.font = `bold ${fontSize}px "Ubuntu", sans-serif`;
                    this.ctx.strokeText(entity.name, entity.x, entity.y);
                    this.ctx.fillText(entity.name, entity.x, entity.y);
                }
            }
        }
        
        this.ctx.globalAlpha = 1.0;
    }

    drawVirus(virus) {
        const renderRadius = virus.displayRadius !== undefined ? virus.displayRadius : virus.radius;
        const spikes = 30;
        const step = Math.PI * 2 / spikes;
        const outerRadius = renderRadius;
        const innerRadius = renderRadius * 0.85;

        this.ctx.save();
        this.ctx.translate(virus.x, virus.y);
        
        // Wobble effect
        virus.wobble += 0.05;
        this.ctx.rotate(Math.sin(virus.wobble) * 0.05);

        this.ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
            const angle = i * step;
            const radius = (i % 2 === 0) ? outerRadius : innerRadius;
            this.ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        this.ctx.closePath();

        this.ctx.fillStyle = virus.color;
        this.ctx.fill();
        this.ctx.lineWidth = outerRadius * 0.1;
        this.ctx.strokeStyle = this.shadeColor(virus.color, -20);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    // Helper to darken colors for borders
    shadeColor(color, percent) {
        let R = parseInt(color.substring(1,3),16);
        let G = parseInt(color.substring(3,5),16);
        let B = parseInt(color.substring(5,7),16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R<255)?R:255;  
        G = (G<255)?G:255;  
        B = (B<255)?B:255;  

        let RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
        let GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
        let BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

        return "#"+RR+GG+BB;
    }

    drawMinimap() {
        if (!this.game) return;
        
        const size = 150; // Size of minimap on screen
        const padding = 20;
        const x = this.canvas.width - size - padding;
        const y = this.canvas.height - size - padding;
        
        this.ctx.save();
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x, y, size, size);
        
        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, size, size);
        
        // Draw entities (only players/bots and mothercells to save performance)
        const scaleX = size / Config.MAP_WIDTH;
        const scaleY = size / Config.MAP_HEIGHT;
        
        for (let entity of this.game.entities) {
            if (entity.type === 'cell') {
                const mapX = x + entity.x * scaleX;
                const mapY = y + entity.y * scaleY;
                const mapRadius = Math.max(1.5, entity.radius * Math.max(scaleX, scaleY));
                
                this.ctx.beginPath();
                this.ctx.arc(mapX, mapY, mapRadius, 0, 2 * Math.PI);
                
                // Highlight my player
                if (typeof myId !== 'undefined' && entity.ownerId === myId) {
                    this.ctx.fillStyle = '#ffffff'; // Make my cells white on minimap
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                } else {
                    this.ctx.fillStyle = entity.color;
                }
                this.ctx.fill();
            } else if (entity.type === 'mothercell') {
                const mapX = x + entity.x * scaleX;
                const mapY = y + entity.y * scaleY;
                const mapRadius = Math.max(1, entity.radius * Math.max(scaleX, scaleY));
                
                this.ctx.beginPath();
                this.ctx.arc(mapX, mapY, mapRadius, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fill();
            }
        }
        
        // Draw Viewport on Minimap
        const viewWidth = this.canvas.width / this.zoom;
        const viewHeight = this.canvas.height / this.zoom;
        const viewX = this.cameraX - viewWidth / 2;
        const viewY = this.cameraY - viewHeight / 2;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            x + viewX * scaleX, 
            y + viewY * scaleY, 
            viewWidth * scaleX, 
            viewHeight * scaleY
        );
        
        this.ctx.restore();
    }
}
