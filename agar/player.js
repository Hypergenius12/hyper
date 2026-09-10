class Player {
    constructor(game, id, name, color) {
        this.game = game;
        this.id = id;
        this.name = name;
        this.color = color;
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Listeners for Space and W are handled in main.js and passed to game
    }

    updateTarget(cameraX, cameraY, zoom, screenW, screenH) {
        // Convert screen coordinates to world coordinates based on camera and zoom
        // Center of screen is cameraX, cameraY
        const worldX = (this.mouseX - screenW / 2) / zoom + cameraX;
        const worldY = (this.mouseY - screenH / 2) / zoom + cameraY;
        
        const myCells = this.game.entities.filter(e => e.type === 'cell' && e.ownerId === this.id);
        for (let cell of myCells) {
            cell.targetX = worldX;
            cell.targetY = worldY;
        }
    }
}

if (typeof module !== 'undefined') module.exports = { Player };
