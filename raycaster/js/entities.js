// entities.js
// Entity Component System, Animation States, and A* Pathfinding AI

const EntityTypes = {
    SKULL: 9,
    BARREL: 10,
    EYE: 11,
    SLIME: 12,
    MEDKIT: 20,
    AMMOBOX: 21,
    PROJECTILE: 22
};

// A* Node
class Node {
    constructor(x, y, g, h, parent = null) {
        this.x = x;
        this.y = y;
        this.g = g; // Cost from start
        this.h = h; // Heuristic cost to end
        this.f = g + h; // Total cost
        this.parent = parent;
    }
}

// A* Pathfinding
function findPath(startX, startY, endX, endY) {
    const startNode = new Node(Math.floor(startX), Math.floor(startY), 0, 0);
    const endNode = new Node(Math.floor(endX), Math.floor(endY), 0, 0);
    
    // Quick exit if player is out of bounds or in a wall
    if (endNode.x < 0 || endNode.x >= MAP_SIZE || endNode.y < 0 || endNode.y >= MAP_SIZE) return [];
    if (mapGrid[endNode.y * MAP_SIZE + endNode.x] !== 0) return [];

    let openList = [startNode];
    let closedList = new Set();

    // Limit iterations to prevent freezing if map is complex
    let iterations = 0;
    const MAX_ITERATIONS = 200;

    while (openList.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        
        // Get node with lowest f cost
        let currentIndex = 0;
        for (let i = 1; i < openList.length; i++) {
            if (openList[i].f < openList[currentIndex].f) {
                currentIndex = i;
            }
        }
        
        let currentNode = openList[currentIndex];
        
        // Reached target
        if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
            let path = [];
            let current = currentNode;
            while (current !== null) {
                path.push({ x: current.x + 0.5, y: current.y + 0.5 }); // Center of tile
                current = current.parent;
            }
            return path.reverse();
        }
        
        openList.splice(currentIndex, 1);
        closedList.add(`${currentNode.x},${currentNode.y}`);
        
        // Generate children
        const neighbors = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 },
            // Diagonals
            { x: -1, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 1 }, { x: 1, y: 1 }
        ];
        
        for (let neighbor of neighbors) {
            let nodeX = currentNode.x + neighbor.x;
            let nodeY = currentNode.y + neighbor.y;
            
            // Bounds check
            if (nodeX < 0 || nodeX >= MAP_SIZE || nodeY < 0 || nodeY >= MAP_SIZE) continue;
            
            // Wall check
            if (mapGrid[nodeY * MAP_SIZE + nodeX] !== 0) continue;
            
            // Prevent corner cutting
            if (Math.abs(neighbor.x) === 1 && Math.abs(neighbor.y) === 1) {
                if (mapGrid[currentNode.y * MAP_SIZE + nodeX] !== 0 || mapGrid[nodeY * MAP_SIZE + currentNode.x] !== 0) continue;
            }
            
            if (closedList.has(`${nodeX},${nodeY}`)) continue;
            
            let gCost = currentNode.g + (Math.abs(neighbor.x) === 1 && Math.abs(neighbor.y) === 1 ? 1.414 : 1);
            let hCost = Math.abs(nodeX - endNode.x) + Math.abs(nodeY - endNode.y); // Manhattan distance
            
            let childNode = new Node(nodeX, nodeY, gCost, hCost, currentNode);
            
            let inOpenList = openList.find(n => n.x === childNode.x && n.y === childNode.y);
            if (inOpenList && gCost >= inOpenList.g) continue;
            
            openList.push(childNode);
        }
    }
    
    return []; // No path found
}

class Entity {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.state = 'idle'; // idle, chase, dead
        this.animTimer = 0;
        this.path = [];
        this.pathRecalcTimer = 0;
        
        // Stats based on type
        switch(type) {
            case EntityTypes.SKULL:
                this.health = 2;
                this.speed = 1.5;
                this.isStatic = false;
                break;
            case EntityTypes.EYE:
                this.health = 1;
                this.speed = 2.5;
                this.isStatic = false;
                break;
            case EntityTypes.SLIME:
                this.health = 4;
                this.speed = 0.8;
                this.isStatic = false;
                break;
            case EntityTypes.BARREL:
                this.health = 1;
                this.speed = 0;
                this.isStatic = true;
                break;
            case EntityTypes.MEDKIT:
            case EntityTypes.AMMOBOX:
                this.health = 1;
                this.speed = 0;
                this.isStatic = true;
                this.isItem = true;
                break;
            case EntityTypes.PROJECTILE:
                this.health = 1;
                this.speed = 8.0;
                this.isStatic = false;
                this.isProjectile = true;
                this.dirX = 0;
                this.dirY = 0;
                break;
            default:
                this.health = 1;
                this.speed = 0;
                this.isStatic = true;
        }
    }

    damage(amount) {
        if (this.state === 'dead') return;
        this.health -= amount;
        if (this.health <= 0) {
            this.state = 'dead';
            this.animTimer = 0;
        } else {
            // Wake up if shot from afar
            if (this.state === 'idle' && !this.isStatic) {
                this.state = 'chase';
            }
        }
    }

    update(dt) {
        this.animTimer += dt;
        
        if (this.state === 'dead' || this.isStatic) return;

        const distToPlayerSq = (player.x - this.x)*(player.x - this.x) + (player.y - this.y)*(player.y - this.y);

        if (this.state === 'idle') {
            // Wake up if player gets close (within 10 blocks)
            if (distToPlayerSq < 100) {
                this.state = 'chase';
            }
        } else if (this.state === 'chase') {
            // Stop chasing if too far
            if (distToPlayerSq > 400) {
                this.state = 'idle';
                this.path = [];
                return;
            }

            // Recalculate A* path periodically
            this.pathRecalcTimer -= dt;
            if (this.pathRecalcTimer <= 0) {
                this.path = findPath(this.x, this.y, player.x, player.y);
                this.pathRecalcTimer = 0.5; // Recalc every 0.5s
            }

            // Move along path
            if (this.path && this.path.length > 1) {
                // path[0] is usually current block, path[1] is next block
                let target = this.path[1];
                
                // If we're very close to the next node, target the one after it
                const distToTargetSq = (target.x - this.x)*(target.x - this.x) + (target.y - this.y)*(target.y - this.y);
                if (distToTargetSq < 0.1 && this.path.length > 2) {
                    target = this.path[2];
                }

                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist > 0) {
                    const moveX = (dx / dist) * this.speed * dt;
                    const moveY = (dy / dist) * this.speed * dt;
                    
                    // Collision check (sliding)
                    const padding = 0.3;
                    if (getTile(this.x + moveX + (moveX > 0 ? padding : -padding), this.y) === 0) {
                        this.x += moveX;
                    }
                    if (getTile(this.x, this.y + moveY + (moveY > 0 ? padding : -padding)) === 0) {
                        this.y += moveY;
                    }
                }
            } else if (distToPlayerSq < 4) {
                 // Close enough to attack or just slide towards player
                 const dx = player.x - this.x;
                 const dy = player.y - this.y;
                 const dist = Math.sqrt(dx*dx + dy*dy);
                 if (dist > 0.5) {
                    const moveX = (dx / dist) * this.speed * dt;
                    const moveY = (dy / dist) * this.speed * dt;
                    const padding = 0.3;
                    if (getTile(this.x + moveX + (moveX > 0 ? padding : -padding), this.y) === 0) this.x += moveX;
                    if (getTile(this.x, this.y + moveY + (moveY > 0 ? padding : -padding)) === 0) this.y += moveY;
                 }
            }
            
            // Ranged Attack Logic for EYE
            if (this.type === EntityTypes.EYE && distToPlayerSq < 64 && distToPlayerSq > 4) {
                if (!this.attackTimer) this.attackTimer = 0;
                this.attackTimer -= dt;
                
                // Shoot projectile every 2 seconds if in line of sight (simplified to just distance check)
                if (this.attackTimer <= 0) {
                    let proj = new Entity(this.x, this.y, EntityTypes.PROJECTILE);
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    proj.dirX = dx / dist;
                    proj.dirY = dy / dist;
                    entities.push(proj);
                    this.attackTimer = 2.0;
                }
            }
        }
    }
    
    // Get current texture frame based on state and type
    getTextureId() {
        if (this.type === EntityTypes.BARREL) {
            return this.state === 'dead' ? 10 : 10; // Assuming barrel explodes and vanishes in engine
        }
        
        let baseTex = this.type; 
        // We map textures:
        // 9 = Skull, 10 = Barrel, 11 = Eye, 12 = Slime
        // We will generate frames dynamically in textures.js
        // e.g. Skull: 9 (idle 1), 13 (idle 2), 14 (dead)
        // Eye: 11 (idle 1), 15 (idle 2), 16 (dead)
        // Slime: 12 (idle 1), 17 (idle 2), 18 (dead)
        
        let frameOffset = 0;
        
        if (this.state === 'dead') {
            // Death frame
            frameOffset = 2; // Offset for dead frame
        } else {
            // Walking animation toggles every 0.3s
            if (this.state === 'chase' || this.type === EntityTypes.EYE) {
                if (Math.floor(this.animTimer / 0.3) % 2 === 1) {
                    frameOffset = 1; // Walk frame
                }
            }
        }
        
        // Calculate exact texture ID (This requires textures.js to be setup predictably)
        if (this.type === EntityTypes.SKULL) {
            if (frameOffset === 0) return 9;
            if (frameOffset === 1) return 13;
            if (frameOffset === 2) return 14;
        } else if (this.type === EntityTypes.EYE) {
            if (frameOffset === 0) return 11;
            if (frameOffset === 1) return 15;
            if (frameOffset === 2) return 16;
        } else if (this.type === EntityTypes.SLIME) {
            if (frameOffset === 0) return 12;
            if (frameOffset === 1) return 17;
            if (frameOffset === 2) return 18;
        }
        
        return baseTex;
    }
}

// Global update function for all entities
function updateEntities(dt) {
    for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        entity.update(dt);
        
        const distToPlayerSq = (player.x - entity.x)*(player.x - entity.x) + (player.y - entity.y)*(player.y - entity.y);
        
        // Item Pickup Logic
        if (entity.isItem && entity.state !== 'dead' && distToPlayerSq < 0.5) {
            if (entity.type === EntityTypes.MEDKIT && player.health < player.maxHealth) {
                player.health = Math.min(player.maxHealth, player.health + 25);
                entity.state = 'dead';
                if (typeof playPickupSFX === 'function') playPickupSFX();
                if (typeof updateHUD === 'function') updateHUD();
            } else if (entity.type === EntityTypes.AMMOBOX && player.ammo < player.maxAmmo) {
                player.ammo = Math.min(player.maxAmmo, player.ammo + 20);
                entity.state = 'dead';
                if (typeof playPickupSFX === 'function') playPickupSFX();
                if (typeof updateHUD === 'function') updateHUD();
            }
        }
        
        // Enemy Melee Attack Logic
        if (!entity.isStatic && entity.state === 'chase' && distToPlayerSq < 0.6) {
            if (!entity.attackTimer) entity.attackTimer = 0;
            entity.attackTimer -= dt;
            if (entity.attackTimer <= 0) {
                if (typeof damagePlayer === 'function') damagePlayer(10);
                entity.attackTimer = 1.0; // Attack cooldown
            }
        }
        
        // Projectile Logic
        if (entity.isProjectile && entity.state !== 'dead') {
            entity.x += entity.dirX * entity.speed * dt;
            entity.y += entity.dirY * entity.speed * dt;
            
            // Check wall collision
            if (getTile(entity.x, entity.y) !== 0) {
                entity.state = 'dead';
            }
            
            // Check player collision
            if (distToPlayerSq < 0.5) {
                if (typeof damagePlayer === 'function') damagePlayer(15);
                entity.state = 'dead';
            }
        }
        
        // Remove dead entities after 5 seconds to clean up (instantly for items/projectiles)
        if (entity.state === 'dead') {
            if (entity.isItem || entity.isProjectile) {
                entities.splice(i, 1);
            } else if (entity.animTimer > 5) {
                entities.splice(i, 1);
            }
        }
    }
}
