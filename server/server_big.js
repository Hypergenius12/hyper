const WebSocket = require('ws');

// Setup Globals for game engine compatibility
global.Config = require('../agar/config.js');
// OVERRIDE FOR BIG MAP
global.Config.MAP_WIDTH = 20000;
global.Config.MAP_HEIGHT = 20000;
global.Config.FOOD_COUNT = 10000;
global.Config.VIRUS_COUNT = 300;

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

const port = process.env.PORT || 8081;
const wss = new WebSocket.Server({ port: port }); // DIFFERENT PORT
const game = new Game();
const clients = new Map(); // ws -> playerId

console.log("Hyper Agar.io Dedicated BIG Server starting on ws://localhost:8081");

wss.on('connection', (ws) => {
    let playerId = "player_" + Math.random().toString(36).substr(2, 9);
    console.log(`[+] Client connected (BIG): ${playerId}`);
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'join') {
                clients.set(ws, playerId);
                const { color } = game.addPlayer(playerId, data.name || "Guest", data.color || null, 400);            ws.send(JSON.stringify({
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
        console.log(`[-] Client disconnected (BIG): ${playerId}`);
        game.removePlayer(playerId);
        clients.delete(ws);
    });
});

// Tweak config for free server limits on big map
Config.MAX_BOTS = 60;
Config.MAX_FOOD = 4000;

setInterval(() => {
    game.update(66);
    
    const leaderboard = game.getLeaderboard();
    
    // Broadcast state
    for (const [ws, playerId] of clients.entries()) {
        if (ws.readyState !== WebSocket.OPEN) continue;
        
        const myCells = game.entities.filter(e => e.ownerId === playerId && e.type === 'cell');
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

        const VIEW_RADIUS = 1500; // reduced to prevent lag
        const visibleEntities = [];
        
        for (let i = 0; i < game.entities.length; i++) {
            const e = game.entities[i];
            
            if (Math.abs(e.x - camX) < VIEW_RADIUS && Math.abs(e.y - camY) < VIEW_RADIUS) {
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
