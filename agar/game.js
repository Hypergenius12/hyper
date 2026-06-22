

class Game {
    constructor() {
        this.entities = [];
        this.bots = [];
        this.nextId = 1;
        this.players = new Map(); // id -> score info
        
        // Pre-allocated arrays for performance (avoids GC lag)
        this.cellsArray = [];
        this.ejectedArray = [];
        this.staticsArray = [];
        this.queryResult = [];
        this.grid = []; // Will be populated with arrays once
        this.gridSize = 500;
        this.gridCols = Math.ceil(Config.MAP_WIDTH / this.gridSize);
        for (let i = 0; i < this.gridCols * this.gridCols; i++) {
            this.grid.push([]);
        }
        
        this.init();
    }

    init() {
        // Spawn initial viruses
        for (let i = 0; i < Config.MAX_VIRUSES; i++) {
            this.spawnVirus();
        }
        
        for (let i = 0; i < Config.MAX_MOTHER_CELLS; i++) {
            this.spawnMotherCell();
        }
        
        // Spawn initial food
        for (let i = 0; i < Config.MAX_FOOD; i++) {
            this.spawnFood();
        }
    }

    getId() {
        return this.nextId++;
    }

    spawnFood() {
        const x = MathUtils.randomRange(0, Config.MAP_WIDTH);
        const y = MathUtils.randomRange(0, Config.MAP_HEIGHT);
        const color = MathUtils.getRandomColor();
        this.entities.push(new Food(this.getId(), x, y, color));
    }

    spawnVirus() {
        const x = MathUtils.randomRange(0, Config.MAP_WIDTH);
        const y = MathUtils.randomRange(0, Config.MAP_HEIGHT);
        this.entities.push(new Virus(this.getId(), x, y));
    }

    spawnMotherCell() {
        const x = MathUtils.randomRange(0, Config.MAP_WIDTH);
        const y = MathUtils.randomRange(0, Config.MAP_HEIGHT);
        this.entities.push(new MotherCell(this.getId(), x, y));
    }

    addPlayer(id, name, colorCode = null, startMass = Config.START_MASS) {
        const x = MathUtils.randomRange(100, Config.MAP_WIDTH - 100);
        const y = MathUtils.randomRange(100, Config.MAP_HEIGHT - 100);
        const color = colorCode || MathUtils.getRandomColor();
        
        const cell = new Cell(this.getId(), id, name, x, y, startMass, color);
        cell.spawnTime = Date.now();
        this.entities.push(cell);
        
        // Spawn a cluster of food around the new player
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 400; // Spread radius
            const fx = x + Math.cos(angle) * dist;
            const fy = y + Math.sin(angle) * dist;
            // Keep within map bounds
            if (fx > 0 && fx < Config.MAP_WIDTH && fy > 0 && fy < Config.MAP_HEIGHT) {
                this.entities.push(new Food(this.getId(), fx, fy, MathUtils.getRandomColor()));
            }
        }
        
        this.players.set(id, { name: name, score: startMass });
        return { x, y, color };
    }

    addBot(isBoss = false) {
        const botId = "bot_" + this.getId();
        let name = MathUtils.generateBotName();
        if (isBoss) name = "★ " + name + " ★";
        
        const startMass = isBoss ? 2000 : Config.START_MASS;
        const { color } = this.addPlayer(botId, name, null, startMass);
        
        const cell = this.entities[this.entities.length - 1];
        if (cell && cell.ownerId === botId) {
            cell.isBot = true;
        }
        
        const bot = new BotAI(this, botId, name, color);
        if (isBoss) bot.isBoss = true;
        this.bots.push(bot);
    }

    removePlayer(id) {
        this.entities = this.entities.filter(e => e.ownerId !== id);
        this.bots = this.bots.filter(b => b.id !== id);
        this.players.delete(id);
    }

    getPlayerScore(id) {
        let score = 0;
        for (let e of this.entities) {
            if (e.type === 'cell' && e.ownerId === id) {
                score += e.mass;
            }
        }
        return Math.floor(score);
    }

    getLeaderboard() {
        // Update scores
        for (let [id, info] of this.players.entries()) {
            info.score = this.getPlayerScore(id);
        }
        
        const sorted = Array.from(this.players.entries())
                            .filter(([id, p]) => p.score > 0)
                            .sort((a, b) => b[1].score - a[1].score)
                            .slice(0, 10)
                            .map(([id, p]) => ({ id: id, name: p.name, score: p.score }));
        return sorted;
    }

    splitPlayer(ownerId) {
        const myCells = this.entities.filter(e => e.type === 'cell' && e.ownerId === ownerId);
        
        let totalMass = 0;
        for (let cell of myCells) totalMass += cell.mass;
        
        // Dynamic split limit: base 16, plus 4 more cells for every 500 mass, capped at 128
        const maxCells = Math.min(128, 16 + Math.floor(totalMass / 500) * 4);
        
        for (let cell of myCells) {
            if (cell.mass < Config.MIN_SPLIT_MASS) continue;
            
            // Limit cells per player
            if (this.entities.filter(e => e.type === 'cell' && e.ownerId === ownerId).length >= maxCells) break;

            const halfMass = cell.mass / 2;
            cell.mass = halfMass;
            cell.setMergeTime();

            // Calculate direction towards target
            let dx = cell.targetX - cell.x;
            let dy = cell.targetY - cell.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist === 0) { dx = 1; dy = 0; dist = 1; }

            const newCell = new Cell(this.getId(), cell.ownerId, cell.name, cell.x, cell.y, halfMass, cell.color);
            newCell.isBot = cell.isBot;
            
            // Add momentum
            newCell.vx = (dx / dist) * Config.SPLIT_SPEED;
            newCell.vy = (dy / dist) * Config.SPLIT_SPEED;
            newCell.targetX = cell.targetX;
            newCell.targetY = cell.targetY;
            newCell.setMergeTime();
            
            this.entities.push(newCell);
        }
    }

    ejectMass(ownerId) {
        const myCells = this.entities.filter(e => e.type === 'cell' && e.ownerId === ownerId);
        
        for (let cell of myCells) {
            if (cell.mass < Config.MIN_EJECT_MASS) continue;
            
            cell.mass -= Config.EJECTED_MASS;
            
            let dx = cell.targetX - cell.x;
            let dy = cell.targetY - cell.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist === 0) { dx = 1; dy = 0; dist = 1; }
            
            // Eject from the edge of the cell
            const spawnX = cell.x + (dx / dist) * cell.radius;
            const spawnY = cell.y + (dy / dist) * cell.radius;
            
            const vx = (dx / dist) * Config.EJECT_SPEED;
            const vy = (dy / dist) * Config.EJECT_SPEED;
            
            this.entities.push(new EjectedMass(this.getId(), spawnX, spawnY, cell.color, vx, vy));
        }
    }

    update(dt) {
        this.buildGrid(); // Build spatial grid for the frame

        // Gather counts in a single fast loop instead of multiple .filters
        let foodCount = 0;
        let motherCellCount = 0;
        let bossCount = 0;
        
        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.killedBy) continue;
            if (e.type === 'food') foodCount++;
            else if (e.type === 'mothercell') motherCellCount++;
        }
        for (let i = 0; i < this.bots.length; i++) {
            if (this.bots[i].isBoss) bossCount++;
        }

        // Replenish bots
        while (this.bots.length < Config.MAX_BOTS) {
            if (bossCount < 3) {
                this.addBot(true);
                bossCount++;
            } else {
                this.addBot(false);
            }
        }

        // Replenish food
        while (foodCount < Config.MAX_FOOD) {
            this.spawnFood();
            foodCount++;
        }
        
        while (motherCellCount < Config.MAX_MOTHER_CELLS) {
            this.spawnMotherCell();
            motherCellCount++;
        }

        // Update bots
        for (let bot of this.bots) {
            bot.update();
        }

        // Update all entities
        for (let entity of this.entities) {
            entity.update(dt);
            
            if (entity.type === 'mothercell' && entity.foodToSpawn > 0) {
                // If it's big enough (> 400 mass), it shoots big pellets instead of small food
                if (entity.mass > 400) {
                    let ejectCount = Math.floor(Math.min(entity.foodToSpawn / Config.EJECTED_MASS, 2));
                    
                    if (ejectCount > 0) {
                        entity.foodToSpawn -= ejectCount * Config.EJECTED_MASS;
                        entity.mass = Math.max(Config.MOTHER_CELL_MASS, entity.mass - (ejectCount * Config.EJECTED_MASS * 0.5));
                        
                        for (let i = 0; i < ejectCount; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const speed = Config.EJECT_SPEED;
                            const vx = Math.cos(angle) * speed;
                            const vy = Math.sin(angle) * speed;
                            const color = MathUtils.getRandomColor();
                            const spawnX = entity.x + Math.cos(angle) * entity.radius;
                            const spawnY = entity.y + Math.sin(angle) * entity.radius;
                            
                            this.entities.push(new EjectedMass(this.getId(), spawnX, spawnY, color, vx, vy));
                        }
                    }
                } else {
                    let spawnCount = Math.floor(Math.min(entity.foodToSpawn, 5));
                    entity.foodToSpawn -= spawnCount;
                    
                    // Lose mass as it spawns food, returning to base size
                    entity.mass = Math.max(Config.MOTHER_CELL_MASS, entity.mass - (spawnCount * 0.5));
                    
                    for (let i = 0; i < spawnCount; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = MathUtils.randomRange(Config.EJECT_SPEED * 0.2, Config.EJECT_SPEED * 0.8);
                        const vx = Math.cos(angle) * speed;
                        const vy = Math.sin(angle) * speed;
                        const color = MathUtils.getRandomColor();
                        const spawnX = entity.x + Math.cos(angle) * entity.radius;
                        const spawnY = entity.y + Math.sin(angle) * entity.radius;
                        
                        const f = new Food(this.getId(), spawnX, spawnY, color);
                        f.vx = vx;
                        f.vy = vy;
                        this.entities.push(f);
                    }
                }
            }
        }

        this.checkCollisions();

        // Handle dead entities efficiently
        const aliveBots = new Set();
        const newEntities = [];
        
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (entity.killedBy !== null) continue;
            
            newEntities.push(entity);
            if (entity.type === 'cell' && entity.ownerId.startsWith("bot_")) {
                aliveBots.add(entity.ownerId);
            }
        }
        this.entities = newEntities;
        
        // Remove dead bots
        this.bots = this.bots.filter(b => aliveBots.has(b.id));
    }

    buildGrid() {
        // Clear existing grid bins without reallocating arrays
        const numBins = this.gridCols * this.gridCols;
        for (let i = 0; i < numBins; i++) {
            this.grid[i].length = 0;
        }
        
        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.killedBy) continue;
            
            const gx = Math.max(0, Math.min(this.gridCols - 1, Math.floor(e.x / this.gridSize)));
            const gy = Math.max(0, Math.min(this.gridCols - 1, Math.floor(e.y / this.gridSize)));
            const idx = gy * this.gridCols + gx;
            
            this.grid[idx].push(e);
        }
    }

    queryGrid(x, y, radius) {
        this.queryResult.length = 0; // Clear previous results without reallocating
        
        const minGx = Math.max(0, Math.floor((x - radius) / this.gridSize));
        const maxGx = Math.min(this.gridCols - 1, Math.floor((x + radius) / this.gridSize));
        const minGy = Math.max(0, Math.floor((y - radius) / this.gridSize));
        const maxGy = Math.min(this.gridCols - 1, Math.floor((y + radius) / this.gridSize));
        
        for (let gy = minGy; gy <= maxGy; gy++) {
            for (let gx = minGx; gx <= maxGx; gx++) {
                const gridCell = this.grid[gy * this.gridCols + gx];
                for (let i = 0; i < gridCell.length; i++) {
                    this.queryResult.push(gridCell[i]);
                }
            }
        }
        return this.queryResult;
    }

    checkCollisions() {
        this.cellsArray.length = 0;
        this.ejectedArray.length = 0;
        this.staticsArray.length = 0;
        
        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.killedBy) continue;
            if (e.type === 'cell') this.cellsArray.push(e);
            else if (e.type === 'ejected') this.ejectedArray.push(e);
            else if (e.type === 'virus' || e.type === 'mothercell') this.staticsArray.push(e);
        }
        
        for (let i = 0; i < this.cellsArray.length; i++) {
            const cell = this.cellsArray[i];
            if (cell.killedBy) continue;
            
            const searchRadius = Math.max(cell.radius * 2, 200);
            const nearby = this.queryGrid(cell.x, cell.y, searchRadius);

            for (let j = 0; j < nearby.length; j++) {
                const other = nearby[j];
                if (cell.id === other.id || other.killedBy) continue;

                const rSum = cell.radius + other.radius;
                const dx = cell.x - other.x;
                const dy = cell.y - other.y;
                
                // Extremely fast AABB check before doing multiplication
                if (Math.abs(dx) > rSum || Math.abs(dy) > rSum) continue;

                const distSq = dx * dx + dy * dy;
                
                // Broad phase
                if (distSq > rSum * rSum) continue;
                
                let dist = Math.sqrt(distSq);

                // Handle cell-cell merging or bouncing
                if (other.type === 'cell' && cell.ownerId === other.ownerId) {
                    if (dist === 0) {
                        cell.x += (Math.random() - 0.5) * 0.1;
                        cell.y += (Math.random() - 0.5) * 0.1;
                        dist = 0.1;
                    }

                    if (cell.timeToMerge === 0 && other.timeToMerge === 0) {
                        // Merge (easier condition)
                        if (dist < rSum * 0.8) {
                            if (cell.mass >= other.mass) {
                                cell.mass += other.mass;
                                other.killedBy = cell.id;
                            } else {
                                other.mass += cell.mass;
                                cell.killedBy = other.id;
                            }
                        }
                    } else {
                        // Push away from each other to prevent overlapping own cells
                        if (dist < rSum) {
                            const overlap = rSum - dist;
                            if (dist > 0) {
                                const pushForce = overlap * 0.75;
                                const pushX = ((cell.x - other.x) / dist) * pushForce;
                                const pushY = ((cell.y - other.y) / dist) * pushForce;
                                
                                const totalMass = cell.mass + other.mass;
                                const cellRatio = other.mass / totalMass;
                                const otherRatio = cell.mass / totalMass;

                                cell.x += pushX * cellRatio;
                                cell.y += pushY * cellRatio;
                                other.x -= pushX * otherRatio;
                                other.y -= pushY * otherRatio;
                            }
                        }
                    }
                    continue;
                }

                // Eating logic. To eat, center of smaller must be inside larger, and larger must be 1.15x mass
                if (dist < cell.radius) {
                    if (other.type === 'food') {
                        cell.mass += other.mass;
                        other.killedBy = cell.id;
                    } else if (other.type === 'ejected') {
                        // Needs to be slightly bigger than ejected mass to eat it instantly, or just wait for it to stop
                        if (cell.mass > other.mass * 1.15) {
                            cell.mass += other.mass;
                            other.killedBy = cell.id;
                        }
                    }
                    
                    // Spawn immunity check (3 seconds)
                    const cellImmune = cell.spawnTime && (Date.now() - cell.spawnTime < 3000);
                    const otherImmune = other.spawnTime && (Date.now() - other.spawnTime < 3000);

                    if (other.type === 'cell') {
                        if (cellImmune || otherImmune) continue;
                        if (cell.mass > other.mass * 1.15) {
                            cell.mass += other.mass;
                            other.killedBy = cell.id;
                        }
                    } else if (other.type === 'virus') {
                        if (cellImmune) continue;
                        if (cell.mass > other.mass * 1.15) {
                            // Pop the cell
                            this.popCell(cell);
                            other.killedBy = cell.id;
                        }
                    } else if (other.type === 'mothercell') {
                        if (cellImmune) continue;
                        if (other.mass > cell.mass * 1.15) {
                            other.mass += cell.mass;
                            other.foodToSpawn += cell.mass * 2;
                            cell.killedBy = other.id;
                        } else if (cell.mass > other.mass * 1.15) {
                            // Just gives you that mass
                            cell.mass += other.mass;
                            other.killedBy = cell.id;
                        }
                    }
                }
            }
        }
        
        // Virus and Mothercell eating ejected mass (fix for bug where viruses didn't eat mass)
        for (let i = 0; i < this.ejectedArray.length; i++) {
            const mass = this.ejectedArray[i];
            if (mass.killedBy) continue;
            
            for (let j = 0; j < this.staticsArray.length; j++) {
                const stat = this.staticsArray[j];
                if (stat.killedBy) continue;
                
                const rSum = mass.radius + stat.radius;
                const dx = mass.x - stat.x;
                const dy = mass.y - stat.y;
                
                if (Math.abs(dx) > rSum || Math.abs(dy) > rSum) continue;
                
                const distSq = dx * dx + dy * dy;
                if (distSq < rSum * rSum) {
                    if (stat.type === 'virus') {
                        stat.mass += mass.mass;
                        mass.killedBy = stat.id;
                        if (stat.mass >= Config.VIRUS_MAX_MASS) {
                            this.splitVirus(stat, mass.vx, mass.vy);
                        }
                    } else if (stat.type === 'mothercell') {
                        stat.mass += mass.mass;
                        stat.foodToSpawn += mass.mass * 2;
                        mass.killedBy = stat.id;
                    }
                }
            }
        }
    }

    popCell(cell) {
        // Split cell into many smaller cells
        const numPieces = 8;
        const pieceMass = cell.mass / numPieces;
        
        if (pieceMass < Config.START_MASS) return;

        cell.mass = pieceMass;
        cell.setMergeTime();
        
        for (let i = 1; i < numPieces; i++) {
            const angle = Math.random() * Math.PI * 2;
            const newCell = new Cell(this.getId(), cell.ownerId, cell.name, cell.x, cell.y, pieceMass, cell.color);
            newCell.vx = Math.cos(angle) * Config.SPLIT_SPEED;
            newCell.vy = Math.sin(angle) * Config.SPLIT_SPEED;
            newCell.targetX = cell.targetX;
            newCell.targetY = cell.targetY;
            newCell.setMergeTime();
            this.entities.push(newCell);
        }
    }

    splitVirus(virus, hitVx, hitVy) {
        virus.mass = Config.VIRUS_MASS;
        
        // Spawn new virus flying in direction of ejected mass
        let dist = Math.sqrt(hitVx * hitVx + hitVy * hitVy);
        if (dist === 0) { hitVx = 1; hitVy = 0; dist = 1;}
        
        const dx = hitVx / dist;
        const dy = hitVy / dist;
        
        const newVirus = new Virus(this.getId(), virus.x, virus.y);
        newVirus.vx = dx * Config.SPLIT_SPEED;
        newVirus.vy = dy * Config.SPLIT_SPEED;
        this.entities.push(newVirus);
    }
}
