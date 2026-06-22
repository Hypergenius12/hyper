

class BotAI {
    constructor(game, id, name, color) {
        this.game = game;
        this.id = id;
        this.name = name;
        this.color = color;
        this.tickCount = 0;
        this.targetX = MathUtils.randomRange(0, Config.MAP_WIDTH);
        this.targetY = MathUtils.randomRange(0, Config.MAP_HEIGHT);
        this.personality = Math.random() < 0.5 ? 'aggro' : 'timid';
    }

    update() {
        this.tickCount++;
        
        if (this.tickCount % Config.BOT_UPDATE_INTERVAL !== 0) {
            this.applyTarget();
            return;
        }

        if (this.isBoss) this.personality = 'boss';

        const myCells = this.game.cellsArray.filter(e => e.ownerId === this.id);
        if (myCells.length === 0) return; // Dead

        let myMass = 0;
        let cx = 0, cy = 0;
        for (let cell of myCells) {
            myMass += cell.mass;
            cx += cell.x * cell.mass;
            cy += cell.y * cell.mass;
        }
        cx /= myMass;
        cy /= myMass;

        // Reduce vision radius slightly for performance and realistic reaction times
        let visionRadius = this.personality === 'boss' ? 2000 : 1200;
        if (this.personality === 'timid') visionRadius = 1500; // Timid bots look further out to run away early

        const nearbyEntities = this.game.queryGrid(cx, cy, visionRadius);
        
        let bestFood = null;
        let bestFoodDist = Infinity;
        
        let bestPrey = null;
        let bestPreyScore = -Infinity; // Combine distance and mass
        
        let worstThreat = null;
        let worstThreatDist = Infinity;

        // Evaluate surroundings once
        for (let i = 0; i < nearbyEntities.length; i++) {
            let entity = nearbyEntities[i];
            if (entity.ownerId === this.id || entity.killedBy) continue;
            
            let dx = entity.x - cx;
            let dy = entity.y - cy;
            
            // Fast AABB check
            if (Math.abs(dx) > visionRadius || Math.abs(dy) > visionRadius) continue;
            
            let distSq = dx * dx + dy * dy;
            if (distSq > visionRadius * visionRadius) continue;
            
            // Analyze entity type
            if (entity.type === 'food' || entity.type === 'ejected') {
                if (distSq < bestFoodDist) {
                    bestFoodDist = distSq;
                    bestFood = entity;
                }
            } else if (entity.type === 'virus' || entity.type === 'mothercell') {
                if (myMass > entity.mass * 1.15) {
                    // Virus is a threat if we are bigger than it (it will pop us)
                    if (distSq < worstThreatDist) {
                        worstThreatDist = distSq;
                        worstThreat = entity;
                    }
                }
            } else if (entity.type === 'cell') {
                if (entity.mass > myMass * 1.15) {
                    // Threat cell
                    if (distSq < worstThreatDist) {
                        worstThreatDist = distSq;
                        worstThreat = entity;
                    }
                } else if (myMass > entity.mass * 1.15) {
                    // Prey cell
                    let score = entity.mass / Math.sqrt(distSq); // Higher mass and lower distance = better score
                    if (score > bestPreyScore) {
                        bestPreyScore = score;
                        bestPrey = entity;
                    }
                }
            }
        }

        let isRunning = false;

        // 1. Threat Avoidance (Highest Priority)
        if (worstThreat) {
            let threatDist = Math.sqrt(worstThreatDist);
            // Panic threshold depends on personality
            let panicDist = this.personality === 'timid' ? 1200 : (this.personality === 'boss' ? 500 : 800);
            
            if (threatDist < panicDist) {
                // Run directly away from the threat
                let dx = cx - worstThreat.x;
                let dy = cy - worstThreat.y;
                
                // If perfectly overlapping, pick a random direction
                if (dx === 0 && dy === 0) { dx = 1; dy = 1; }
                
                let dist = Math.sqrt(dx * dx + dy * dy);
                dx /= dist;
                dy /= dist;
                
                this.targetX = cx + dx * 1000;
                this.targetY = cy + dy * 1000;
                isRunning = true;
            }
        }

        // 2. Hunting Prey
        if (!isRunning && bestPrey && this.personality !== 'timid') {
            this.targetX = bestPrey.x;
            this.targetY = bestPrey.y;
            
            // Check if we should split to kill
            let dist = Math.sqrt(bestPreyScore > 0 ? (bestPrey.mass / bestPreyScore) * (bestPrey.mass / bestPreyScore) : 1000); // Inverse score to dist approximation
            if (myMass > bestPrey.mass * 2.5 && dist < 600 && Math.random() < 0.1) {
                this.game.splitPlayer(this.id);
            }
            isRunning = true; // Not running away, but we have a target
        }

        // 3. Foraging Food
        if (!isRunning && bestFood) {
            this.targetX = bestFood.x;
            this.targetY = bestFood.y;
            isRunning = true;
        }

        // 4. Wall Avoidance overrides everything if too close
        const wallMargin = 100;
        if (cx < wallMargin) this.targetX = cx + 500;
        else if (cx > Config.MAP_WIDTH - wallMargin) this.targetX = cx - 500;
        if (cy < wallMargin) this.targetY = cy + 500;
        else if (cy > Config.MAP_HEIGHT - wallMargin) this.targetY = cy - 500;

        // 5. Wander if nothing to do
        if (!isRunning && Math.random() < 0.1) {
            this.targetX = cx + MathUtils.randomRange(-500, 500);
            this.targetY = cy + MathUtils.randomRange(-500, 500);
        }

        // Keep target in bounds
        this.targetX = Math.max(0, Math.min(Config.MAP_WIDTH, this.targetX));
        this.targetY = Math.max(0, Math.min(Config.MAP_HEIGHT, this.targetY));

        this.applyTarget();
    }

    applyTarget() {
        const myCells = this.game.cellsArray.filter(e => e.ownerId === this.id);
        for (let i = 0; i < myCells.length; i++) {
            myCells[i].targetX = this.targetX;
            myCells[i].targetY = this.targetY;
        }
    }
}
