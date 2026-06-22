const WebSocket = require('ws');

// Setup Globals for game engine compatibility
global.Config = require('../agar/config.js');
global.MathUtils = require('../agar/utils.js').MathUtils;
const entities = require('../agar/entities.js');
global.Cell = entities.Cell;
global.Player = require('../agar/player.js').Player;
global.Food = entities.Food;
global.Virus = entities.Virus;
global.MotherCell = entities.MotherCell;
global.EjectedMass = entities.EjectedMass;
global.BotAI = require('../agar/bot.js');
const Game = require('../agar/game.js');

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: port });
const game = new Game();
const clients = new Map(); // ws -> playerId

console.log("Hyper Agar.io Dedicated Server starting on ws://localhost:8080");

wss.on('connection', (ws) => {
    let playerId = "player_" + Math.random().toString(36).substr(2, 9);
    console.log(`[+] Client connected: ${playerId}`);
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'join') {
                clients.set(ws, playerId);
                const { color } = game.addPlayer(playerId, data.name || "Guest", data.color || null, 400);
                ws.send(JSON.stringify({
                    type: 'init',
                    id: playerId,
                    color: color,
                    mapWidth: Config.MAP_WIDTH,
                    mapHeight: Config.MAP_HEIGHT
                }));
            }
            
            else if (data.type === 'input') {
                ws.camX = data.camX;
                ws.camY = data.camY;
                
                const myCells = game.entities.filter(e => e.type === 'cell' && e.ownerId === playerId);
                for (let cell of myCells) {
                    cell.targetX = data.camX;
                    cell.targetY = data.camY;
                }
            }
            
            else if (data.type === 'split') {
                game.splitPlayer(playerId);
            }
            
            else if (data.type === 'eject') {
                game.ejectMass(playerId);
            }
        } catch (e) {
            console.error("Error processing message", e);
        }
    });

    ws.on('close', () => {
        console.log(`[-] Client disconnected: ${playerId}`);
        game.removePlayer(playerId);
        clients.delete(ws);
    });
});

// Game Loop: 60 FPS
// Tweak config for free server limits
Config.MAX_BOTS = 40;
Config.MAX_FOOD = 2500;

setInterval(() => {
    game.update(66);
    
    const leaderboard = game.getLeaderboard();
    
    // Broadcast state
    for (const [ws, playerId] of clients.entries()) {
        if (ws.readyState !== WebSocket.OPEN) continue;
        
        // Find player's center of mass
        const myCells = game.cellsArray.filter(e => e.ownerId === playerId && e.type === 'cell');
        let camX = Config.MAP_WIDTH / 2;
        let camY = Config.MAP_HEIGHT / 2;
        let alive = false;
        
        if (myCells.length > 0) {
            alive = true;
            let sumX = 0, sumY = 0, totalMass = 0;
            for (let c of myCells) {
                sumX += c.x * c.mass;
                sumY += c.y * c.mass;
                totalMass += c.mass;
            }
            camX = sumX / totalMass;
            camY = sumY / totalMass;
        } else if (ws.camX !== undefined) {
            camX = ws.camX;
            camY = ws.camY;
        }

        // View Culling: Only send entities within 1500 units of the player
        const VIEW_RADIUS = 1500; 
        const visibleEntities = [];
        
        for (let i = 0; i < game.entities.length; i++) {
            const e = game.entities[i];
            
            // Fast distance check
            if (Math.abs(e.x - camX) < VIEW_RADIUS && Math.abs(e.y - camY) < VIEW_RADIUS) {
                // Compress entity data to save bandwidth
                // Map fields to what renderer.js expects
                visibleEntities.push({
                    type: e.type,
                    id: e.id,
                    x: Math.round(e.x),
                    y: Math.round(e.y),
                    mass: Math.round(e.mass),
                    displayRadius: Math.round(e.displayRadius !== undefined ? e.displayRadius : e.radius),
                    radius: Math.round(e.radius),
                    color: e.color,
                    name: e.name,
                    ownerId: e.ownerId,
                    spawnTime: e.spawnTime
                });
            }
        }

        ws.send(JSON.stringify({
            type: 'update',
            entities: visibleEntities,
            leaderboard: leaderboard,
            score: game.getPlayerScore(playerId),
            alive: alive
        }));
    }
}, 66);
