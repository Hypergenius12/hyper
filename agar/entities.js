

class Entity {
    constructor(id, x, y, mass, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.killedBy = null;
        this.type = 'entity';
    }

    get radius() {
        return MathUtils.massToRadius(this.mass);
    }

    update(dt) {
        let dtClamped = Math.min(dt || 16.666, 50);
        let timeScale = dtClamped / 16.666;
        
        if (this.displayRadius === undefined) {
            this.displayRadius = this.radius;
        }
        // Smoothly interpolate visual size
        this.displayRadius = MathUtils.lerp(this.displayRadius, this.radius, 0.1 * timeScale);

        // Apply velocity (momentum)
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;

        // Apply friction/decay to velocity
        this.vx *= Math.pow(Config.SPEED_DECAY, timeScale);
        this.vy *= Math.pow(Config.SPEED_DECAY, timeScale);

        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        if (Math.abs(this.vy) < 0.1) this.vy = 0;

        // Keep within bounds
        this.x = Math.max(this.radius, Math.min(Config.MAP_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(Config.MAP_HEIGHT - this.radius, this.y));
    }
}

class Food extends Entity {
    constructor(id, x, y, color) {
        super(id, x, y, Config.FOOD_MASS, color);
        this.type = 'food';
    }
}

class Virus extends Entity {
    constructor(id, x, y) {
        // Viruses are typically green
        super(id, x, y, Config.VIRUS_MASS, '#33FF33');
        this.type = 'virus';
        this.wobble = Math.random() * Math.PI * 2;
    }
}

class MotherCell extends Entity {
    constructor(id, x, y) {
        super(id, x, y, Config.MOTHER_CELL_MASS, '#8B4513'); // Brown
        this.type = 'mothercell';
        this.wobble = Math.random() * Math.PI * 2;
        this.foodToSpawn = 0;
    }
}

class EjectedMass extends Entity {
    constructor(id, x, y, color, vx, vy) {
        super(id, x, y, Config.EJECTED_MASS, color);
        this.type = 'ejected';
        this.vx = vx;
        this.vy = vy;
    }
}

class Cell extends Entity {
    constructor(id, ownerId, name, x, y, mass, color) {
        super(id, x, y, mass, color);
        this.ownerId = ownerId; // Which player/bot owns this cell
        this.name = name;
        this.type = 'cell';
        this.targetX = x;
        this.targetY = y;
        this.isBot = false;
        
        this.timeToMerge = 0; // Ticks until it can merge
    }

    update(dt) {
        super.update(dt);
        
        let dtClamped = Math.min(dt || 16.666, 50);
        let timeScale = dtClamped / 16.666;
        
        // Decrease merge timer
        if (this.timeToMerge > 0) {
            this.timeToMerge -= timeScale;
            if (this.timeToMerge < 0) this.timeToMerge = 0;
        }

        // Only move towards target if we are not being heavily affected by momentum
        if (Math.abs(this.vx) < 1 && Math.abs(this.vy) < 1) {
            let dx = this.targetX - this.x;
            let dy = this.targetY - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                let speed = Config.BASE_SPEED * Math.pow(this.mass, -Config.SPEED_SCALE) * timeScale; 
                
                // Authentic smooth stop without jitter
                if (dist < speed) {
                    speed = dist; 
                }
                
                this.x += (dx / dist) * speed;
                this.y += (dy / dist) * speed;
            }
        }
    }
    
    // Set merge time based on current mass
    setMergeTime() {
        const seconds = Config.MERGE_TIME_BASE + (this.mass * Config.MERGE_TIME_SCALE);
        this.timeToMerge = Math.floor(seconds * 60); // Assuming 60 fps
    }
}

if (typeof module !== 'undefined') module.exports = { Entity, Food, Virus, MotherCell, EjectedMass, Cell };
