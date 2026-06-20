

class BotAI {
    constructor(game, id, name, color) {
        this.game = game;
        this.id = id;
        this.name = name;
        this.color = color;
        this.tickCount = 0;
        this.targetX = MathUtils.randomRange(0, Config.MAP_WIDTH);
        this.targetY = MathUtils.randomRange(0, Config.MAP_HEIGHT);
    }

    update() {
        this.tickCount++;
        
        if (this.tickCount % Config.BOT_UPDATE_INTERVAL !== 0) {
            this.applyTarget();
            return;
        }

        const myCells = this.game.entities.filter(e => e.type === 'cell' && e.ownerId === this.id);
        // AI Constants
        const visionRadius = this.isBoss ? Config.BOT_VISION_RADIUS * 2.5 : Config.BOT_VISION_RADIUS;
        const visionRadiusSq = visionRadius * visionRadius;

        let myMass = 0;
        let cx = 0, cy = 0;
        if (myCells.length === 0) return; // Dead
        for (let cell of myCells) {
            myMass += cell.mass;
            cx += cell.x * cell.mass;
            cy += cell.y * cell.mass;
        }
        cx /= myMass;
        cy /= myMass;

        // Potential field vectors
        let vectorX = 0;
        let vectorY = 0;
        
        let canSplit = myCells.length < 16 && myMass > Config.MIN_SPLIT_MASS * 2;
        let splitTarget = null;
        let splitDistSq = Infinity;

        const nearbyEntities = this.game.queryGrid(cx, cy, visionRadius);
        
        // Evaluate surroundings
        for (let entity of nearbyEntities) {
            if (entity.ownerId === this.id) continue;
            
            let dx = entity.x - cx;
            let dy = entity.y - cy;
            
            if (Math.abs(dx) > visionRadius || Math.abs(dy) > visionRadius) continue;
            
            let distSq = dx * dx + dy * dy;
            if (distSq > visionRadiusSq) continue;
            
            let dist = Math.sqrt(distSq);
            if (dist === 0) continue;
            
            dx = dx / dist;
            dy = dy / dist;
            
            // Influence based on distance (closer = stronger)
            let influence = 1 - (dist / visionRadius);
            
            let weight = 0;

            if (entity.type === 'food' || entity.type === 'ejected') {
                weight = this.isBoss ? 20 * influence : 10 * influence; // Bosses are hungrier for food too
                vectorX += dx * weight;
                vectorY += dy * weight;
            } else if (entity.type === 'virus' || entity.type === 'mothercell') {
                if (myMass > entity.mass * 1.15) {
                    // Threat! Strong negative weight
                    vectorX -= dx * influence * 50;
                    vectorY -= dy * influence * 50;
                }
            } else if (entity.type === 'cell') {
                let isPlayer = !entity.isBot;
                let multiplier = isPlayer ? 0.5 : 1; // Prioritize bots slightly over players

                if (entity.mass > myMass * 1.15) {
                    // Threat cell
                    vectorX -= dx * influence * 100 * multiplier;
                    vectorY -= dy * influence * 100 * multiplier;
                } else if (myMass > entity.mass * 1.15) {
                    // Prey cell
                    let preyWeight = this.isBoss && isPlayer ? 30 : 10; // Bosses heavily target players
                    vectorX += dx * influence * preyWeight * multiplier;
                    vectorY += dy * influence * preyWeight * multiplier;
                    
                    if (myMass > entity.mass * 2.5 && distSq < splitDistSq) {
                        splitDistSq = distSq;
                        splitTarget = entity;
                    }
                }
            }
        }

        // Avoid walls heavily
        const wallInfluence = 50;
        if (cx < 500) vectorX += (1 - cx / 500) * wallInfluence;
        if (cx > Config.MAP_WIDTH - 500) vectorX -= (1 - (Config.MAP_WIDTH - cx) / 500) * wallInfluence;
        if (cy < 500) vectorY += (1 - cy / 500) * wallInfluence;
        if (cy > Config.MAP_HEIGHT - 500) vectorY -= (1 - (Config.MAP_HEIGHT - cy) / 500) * wallInfluence;

        // Normalize vector
        let length = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
        
        if (length > 0) {
            this.targetX = cx + (vectorX / length) * 500;
            this.targetY = cy + (vectorY / length) * 500;
        } else {
            // Wander
            if (Math.random() < 0.1) {
                this.targetX = cx + MathUtils.randomRange(-500, 500);
                this.targetY = cy + MathUtils.randomRange(-500, 500);
            }
        }
        
        if (splitTarget && Math.random() < 0.05) {
            this.game.splitPlayer(this.id);
        }

        // Keep target in bounds
        this.targetX = Math.max(0, Math.min(Config.MAP_WIDTH, this.targetX));
        this.targetY = Math.max(0, Math.min(Config.MAP_HEIGHT, this.targetY));

        this.applyTarget();
    }

    applyTarget() {
        const myCells = this.game.entities.filter(e => e.type === 'cell' && e.ownerId === this.id);
        for (let cell of myCells) {
            cell.targetX = this.targetX;
            cell.targetY = this.targetY;
        }
    }
}
