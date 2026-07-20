// ========================================
// Car.js — 2D Top-Down Car Physics
// ========================================
class Car {
    constructor(x, y, angle, color) {
        this.x = x || 0;
        this.y = y || 0;
        this.angle = angle || 0;
        this.speed = 0;
        this.color = color || '#ef4444';
        this.width = 28;
        this.height = 14;
        this.alive = true;

        // Lap / timing
        this.fitness = 0;
        this.checkpointIndex = 0;
        this.totalCheckpoints = 0;
        this.lapCount = 0;
        this.lapTime = 0;
        this.bestLap = Infinity;
        this.totalTime = 0;
        this.started = false;

        // Sensors (for AI)
        this.sensors = [];
        this.sensorLength = 150;
        this.sensorCount = 7;

        // Neural network brain (null for human player)
        this.brain = null;

        // Physics tuning
        this.maxSpeed = 380;
        this.acceleration = 420;
        this.brakeForce = 320;
        this.friction = 1.8;
        this.turnRate = 3.2;
        this.offTrackPenalty = 0.92;
    }

    update(dt, keys, collisionCanvas) {
        if (!this.alive) return;

        // AI input
        if (this.brain && this.sensors.length) {
            const inputs = this.sensors.map(s => s.dist / this.sensorLength);
            inputs.push(this.speed / this.maxSpeed);
            const outputs = this.brain.feedforward(inputs);
            keys = {
                up: outputs[0] > 0.5,
                down: outputs[1] > 0.5,
                left: outputs[2] > 0.5,
                right: outputs[3] > 0.5
            };
        }

        if (keys) {
            if (keys.up) {
                this.speed += this.acceleration * dt;
                this.started = true;
            }
            if (keys.down) this.speed -= this.brakeForce * dt;

            if (Math.abs(this.speed) > 10) {
                const dir = this.speed > 0 ? 1 : -1;
                if (keys.left) this.angle -= this.turnRate * dt * dir;
                if (keys.right) this.angle += this.turnRate * dt * dir;
            }
        }

        // Friction
        this.speed *= (1 - this.friction * dt);
        this.speed = Math.max(-this.maxSpeed * 0.4, Math.min(this.maxSpeed, this.speed));
        if (Math.abs(this.speed) < 0.5) this.speed = 0;

        // Move
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        // Track collision
        if (collisionCanvas) {
            this.castSensors(collisionCanvas);
            const corners = this.getCorners();
            let offCount = 0;
            for (const c of corners) {
                if (!this.isPointOnTrack(c.x, c.y, collisionCanvas)) offCount++;
            }
            if (offCount >= 1) {
                this.speed *= this.offTrackPenalty;
            }
            if (offCount >= 3) {
                this.alive = false;
            }
        }

        if (this.started) {
            this.lapTime += dt;
            this.totalTime += dt;
        }
        this.fitness = this.totalCheckpoints + this.checkpointIndex + (this.speed > 0 ? 0.001 : 0);
    }

    isPointOnTrack(px, py, collisionCanvas) {
        const ctx = collisionCanvas.getContext('2d');
        const ix = Math.floor(px);
        const iy = Math.floor(py);
        if (ix < 0 || iy < 0 || ix >= collisionCanvas.width || iy >= collisionCanvas.height) return false;
        const pixel = ctx.getImageData(ix, iy, 1, 1).data;
        // Track is drawn in white (255,255,255), grass is green
        return pixel[0] > 200 && pixel[1] > 200 && pixel[2] > 200;
    }

    castSensors(collisionCanvas) {
        this.sensors = [];
        const spreadAngle = Math.PI * 0.7;
        for (let i = 0; i < this.sensorCount; i++) {
            const frac = this.sensorCount === 1 ? 0 : (i / (this.sensorCount - 1)) - 0.5;
            const sAngle = this.angle + frac * spreadAngle;
            let dist = this.sensorLength;
            for (let d = 5; d <= this.sensorLength; d += 3) {
                const sx = this.x + Math.cos(sAngle) * d;
                const sy = this.y + Math.sin(sAngle) * d;
                if (!this.isPointOnTrack(sx, sy, collisionCanvas)) {
                    dist = d;
                    break;
                }
            }
            this.sensors.push({ angle: sAngle, dist });
        }
    }

    getCorners() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const hw = this.width / 2;
        const hh = this.height / 2;
        return [
            { x: this.x + cos * hw - sin * hh, y: this.y + sin * hw + cos * hh },
            { x: this.x + cos * hw + sin * hh, y: this.y + sin * hw - cos * hh },
            { x: this.x - cos * hw - sin * hh, y: this.y - sin * hw + cos * hh },
            { x: this.x - cos * hw + sin * hh, y: this.y - sin * hw - cos * hh }
        ];
    }

    checkCheckpoints(checkpoints) {
        if (!checkpoints || !checkpoints.length) return;
        const cp = checkpoints[this.checkpointIndex % checkpoints.length];
        if (!cp) return;
        const dx = this.x - cp.x;
        const dy = this.y - cp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cp.radius) {
            this.checkpointIndex++;
            if (this.checkpointIndex >= checkpoints.length) {
                // Completed a lap
                this.lapCount++;
                this.totalCheckpoints += checkpoints.length;
                if (this.lapTime < this.bestLap) this.bestLap = this.lapTime;
                this.lapTime = 0;
                this.checkpointIndex = 0;
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.moveTo(this.width/2 + 4, 4);
        ctx.lineTo(-this.width/2 + 4, this.height/2 + 4);
        ctx.lineTo(-this.width/2 + 4, -this.height/2 + 4);
        ctx.fill();

        // Car Body (Angular F1 style)
        ctx.fillStyle = this.alive ? (this.color === '#ef4444' ? '#ff2a2a' : '#ffffff') : '#333333';
        ctx.beginPath();
        ctx.moveTo(this.width/2, 0); // Nose
        ctx.lineTo(this.width/4, this.height/2); // Right wing
        ctx.lineTo(-this.width/2, this.height/2); // Right tail
        ctx.lineTo(-this.width/2.5, 0); // Center tail indent
        ctx.lineTo(-this.width/2, -this.height/2); // Left tail
        ctx.lineTo(this.width/4, -this.height/2); // Left wing
        ctx.closePath();
        ctx.fill();
        
        // Stroke
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#111';
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(this.width/6, 0);
        ctx.lineTo(-this.width/6, this.height/4);
        ctx.lineTo(-this.width/4, 0);
        ctx.lineTo(-this.width/6, -this.height/4);
        ctx.fill();

        // Thruster glow if accelerating (only visual if alive)
        if (this.alive && this.speed > 5) {
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(-this.width/2 - 2, 0, Math.random() * 4 + 2, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }

    renderSensors(ctx) {
        if (!this.sensors.length || !this.alive) return;
        ctx.save();
        ctx.lineWidth = 1;
        for (const s of this.sensors) {
            const ratio = s.dist / this.sensorLength;
            ctx.strokeStyle = `rgba(${Math.floor(255 - ratio * 255)}, ${Math.floor(ratio * 255)}, 0, 0.4)`;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(s.angle) * s.dist, this.y + Math.sin(s.angle) * s.dist);
            ctx.stroke();
        }
        ctx.restore();
    }

    reset(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 0;
        this.alive = true;
        this.fitness = 0;
        this.checkpointIndex = 0;
        this.totalCheckpoints = 0;
        this.lapCount = 0;
        this.lapTime = 0;
        this.totalTime = 0;
        this.started = false;
        this.sensors = [];
    }
}

window.Car = Car;
