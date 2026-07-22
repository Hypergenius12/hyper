// ========================================
// Car.js — 2D Top-Down Car Physics
// ========================================
const CAR_IMAGES = {
    'f1': new Image(),
    'rally': new Image(),
    'lambo': new Image(),
    'sport': new Image(),
    'limo': new Image()
};
CAR_IMAGES['f1'].src = 'img/car_sprite.png';
CAR_IMAGES['rally'].src = 'img/car_rally.png';
CAR_IMAGES['lambo'].src = 'img/car_lambo.png';
CAR_IMAGES['sport'].src = 'img/car_sport.png';
CAR_IMAGES['limo'].src = 'img/car_limo.png';

class Car {
    constructor(x, y, angle, color) {
        this.x = x || 0;
        this.y = y || 0;
        this.angle = angle || 0;
        this.velocityAngle = this.angle;
        this.speed = 0;
        this.color = color || '#ef4444';
        const carType = window.userCarType || 'f1';
        this.width = carType === 'limo' ? 49 : 28;
        this.height = 14;
        this.alive = true;
        this.crossroadAxis = null;
        this.z = 0;
        this.vz = 0;
        this.airborne = false;
        this.gravity = 500;

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

    update(dt, keys, collisionGrid, sensorGrid) {
        if (!this.alive) return;

        this.isAccelerating = false;
        this.isTurning = false;

        let currentMaxSpeed = this.maxSpeed;
        let currentAccel = this.acceleration;
        let currentTurnRate = this.turnRate;
        
        let centerCol = Math.floor(this.x / 100);
        let centerRow = Math.floor(this.y / 100);
        let centerTileId = 0;

        if (typeof currentTrack !== 'undefined' && currentTrack && typeof TILE_TYPES !== 'undefined') {
            centerTileId = currentTrack.getTile(centerCol, centerRow);
            
            // Ice Physics
            if (centerTileId >= TILE_TYPES.ICE_STRAIGHT_V.id && centerTileId <= TILE_TYPES.ICE_CURVE_TL.id) {
                currentTurnRate = this.turnRate * 0.4; // 40% turning ability (down from 100%)
                currentAccel = this.acceleration * 0.5; // Slippery acceleration
            }
            // Rough Physics
            if (centerTileId >= TILE_TYPES.ROUGH_STRAIGHT_V.id && centerTileId <= TILE_TYPES.ROUGH_CURVE_TL.id) {
                currentMaxSpeed = this.maxSpeed * 0.4;
                currentAccel = this.acceleration * 0.4;
                this.speed *= (1 - 3.0 * dt); // Active slowdown drag, framerate independent
            }
        }

        // AI input
        if (this.brain && this.sensors.length) {
            const expectedMemoryCount = this.brain.layerSizes[0] - this.sensorCount - 1;
            if (!this.memory || this.memory.length !== expectedMemoryCount) {
                this.memory = new Array(Math.max(0, expectedMemoryCount)).fill(0);
            }

            const inputs = this.sensors.map(s => s.dist / this.sensorLength);
            inputs.push(this.speed / this.maxSpeed); // Use absolute maxSpeed so input stays <= 1.0 even if currentMaxSpeed drops
            for (let i = 0; i < this.memory.length; i++) {
                inputs.push(this.memory[i]);
            }

            const outputs = this.brain.feedforward(inputs);

            // Map outputs to allow reaching 100% force while maintaining analog control
            // Multiply by 1.2 to allow reaching 1.0 even if sigmoid output is ~0.85
            const accelForce = Math.min(1, outputs[0] * 1.2);
            const brakeForce = Math.min(1, outputs[1] * 1.2);
            
            // For steering, subtract left from right, then amplify so they can turn sharply if needed
            let steer = outputs[3] - outputs[2];
            steer = Math.max(-1, Math.min(1, steer * 1.5));

            // Store recurrent memory for next frame
            for (let i = 0; i < this.memory.length; i++) {
                this.memory[i] = outputs[4 + i] || 0;
            }

            if (!this.airborne) {
                this.speed += currentAccel * accelForce * dt;
                this.speed -= this.brakeForce * brakeForce * dt;
            }
            if (accelForce > 0.1 || brakeForce > 0.1) {
                this.started = true;
                if (accelForce > 0.1 && !this.airborne) this.isAccelerating = true;
            }

            if (Math.abs(this.speed) > 0.1 && !this.airborne) {
                const dir = this.speed > 0 ? 1 : -1;
                if (Math.abs(steer) > 0.05) this.isTurning = true;
                this.angle += currentTurnRate * steer * dt * dir;
            }

            // Prevent boolean key overrides
            keys = null;
        }

        if (keys && !this.airborne) {
            if (keys.up) {
                this.speed += currentAccel * dt;
                this.started = true;
                this.isAccelerating = true;
            }
            if (keys.down) this.speed -= this.brakeForce * dt;

            if (Math.abs(this.speed) > 0.1) {
                const dir = this.speed > 0 ? 1 : -1;
                if (keys.left) { this.angle -= currentTurnRate * dt * dir; this.isTurning = true; }
                if (keys.right) { this.angle += currentTurnRate * dt * dir; this.isTurning = true; }
            }
        }

        if (typeof currentTrack !== 'undefined' && currentTrack && typeof TILE_TYPES !== 'undefined') {
            if (centerTileId >= TILE_TYPES.BOOST_UP.id && centerTileId <= TILE_TYPES.BOOST_LEFT.id) {
                this.speed += 1200 * dt; // Apply massive boost
                currentMaxSpeed = this.maxSpeed * 1.8; // Allow overspeed
            }

            let onRamp = false;
            let rampDir = null;
            if (centerTileId === TILE_TYPES.RAMP_UP.id) { onRamp = true; rampDir = 'UP'; }
            if (centerTileId === TILE_TYPES.RAMP_RIGHT.id) { onRamp = true; rampDir = 'RIGHT'; }
            if (centerTileId === TILE_TYPES.RAMP_DOWN.id) { onRamp = true; rampDir = 'DOWN'; }
            if (centerTileId === TILE_TYPES.RAMP_LEFT.id) { onRamp = true; rampDir = 'LEFT'; }
            
            if (onRamp && !this.airborne) {
                const tileCenterX = centerCol * 100 + 50;
                const tileCenterY = centerRow * 100 + 50;
                let pastLip = false;
                
                if (rampDir === 'RIGHT' && Math.cos(this.angle) > 0 && this.x > tileCenterX + 10) pastLip = true;
                if (rampDir === 'LEFT' && Math.cos(this.angle) < 0 && this.x < tileCenterX - 10) pastLip = true;
                if (rampDir === 'DOWN' && Math.sin(this.angle) > 0 && this.y > tileCenterY + 10) pastLip = true;
                if (rampDir === 'UP' && Math.sin(this.angle) < 0 && this.y < tileCenterY - 10) pastLip = true;
                
                if (pastLip) {
                    this.airborne = true;
                    this.vz = 200; // Airborne time T = 0.8s
                    this.z = 1;
                    this.speed = Math.max(this.speed, 250); // Guarantee minimum jump speed
                }
            }

            // Teleporters
            if (centerTileId >= TILE_TYPES.TELEPORT_UP.id && centerTileId <= TILE_TYPES.TELEPORT_LEFT.id) {
                const tileCenterX = centerCol * 100 + 50;
                const tileCenterY = centerRow * 100 + 50;
                const distToCenter = Math.hypot(this.x - tileCenterX, this.y - tileCenterY);
                
                if (distToCenter > 40) {
                    this.justTeleported = false;
                }
                
                if (distToCenter < 20 && !this.justTeleported) {
                    // Find all teleporters on the grid
                    let teleporters = [];
                    for (let c = 0; c < currentTrack.cols; c++) {
                        for (let r = 0; r < currentTrack.rows; r++) {
                            const tid = currentTrack.getTile(c, r);
                            if (tid >= TILE_TYPES.TELEPORT_UP.id && tid <= TILE_TYPES.TELEPORT_LEFT.id) {
                                teleporters.push({c, r, tid});
                            }
                        }
                    }
                    
                    if (teleporters.length === 2) {
                        const outTeleporter = teleporters.find(t => t.c !== centerCol || t.r !== centerRow);
                        if (outTeleporter) {
                            this.x = outTeleporter.c * 100 + 50;
                            this.y = outTeleporter.r * 100 + 50;
                            
                            const inAngles = { 32: -Math.PI/2, 33: 0, 34: Math.PI/2, 35: Math.PI };
                            const outAngles = { 32: Math.PI/2, 33: Math.PI, 34: -Math.PI/2, 35: 0 };
                            const entryBaseAngle = inAngles[centerTileId];
                            const exitBaseAngle = outAngles[outTeleporter.tid];
                            
                            const relativeAngle = this.angle - entryBaseAngle;
                            this.angle = exitBaseAngle + relativeAngle;
                            this.justTeleported = true;
                        }
                    }
                }
            } else {
                this.justTeleported = false;
            }
        }
        
        if (this.airborne) {
            this.z += this.vz * dt;
            this.vz -= this.gravity * dt;
            if (this.z <= 0) {
                this.z = 0;
                this.airborne = false;
                // Add tiny speed penalty on landing
                this.speed *= 0.95; 
            }
        }

        // Friction: Apply full friction when coasting, minimal drag when accelerating
        const currentFriction = this.isAccelerating ? (this.friction * 0.1) : this.friction;
        if (!this.airborne) {
            this.speed *= (1 - currentFriction * dt);
        } else {
            this.speed *= (1 - 0.2 * dt); // Light air drag instead of rolling friction
        }
        
        this.speed = Math.max(-currentMaxSpeed * 0.4, Math.min(currentMaxSpeed, this.speed));
        if (Math.abs(this.speed) < 0.5) this.speed = 0;

        const prevX = this.x;
        const prevY = this.y;

        if (this.vx === undefined) {
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        // Drifting physics
        if (window.enableDrift && !this.airborne) {
            let targetVx = Math.cos(this.angle) * this.speed;
            let targetVy = Math.sin(this.angle) * this.speed;
            
            let currentVAngle = Math.atan2(this.vy, this.vx);
            if (Math.hypot(this.vx, this.vy) < 10) currentVAngle = this.angle;

            let diff = this.angle - currentVAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            
            let grip = 8.0; 
            
            // Break traction for sick power slides
            if (this.isTurning && Math.abs(this.speed) > this.maxSpeed * 0.4 && Math.abs(diff) > 0.15) {
                grip = 2.0;
            }
            
            // Regain traction extremely fast if we stopped steering
            if (!this.isTurning) {
                grip = 12.0;
            }
            
            this.vx += (targetVx - this.vx) * Math.min(1, grip * dt);
            this.vy += (targetVy - this.vy) * Math.min(1, grip * dt);
            
            // Snap to target if very close to prevent endless sliding
            if (Math.hypot(targetVx - this.vx, targetVy - this.vy) < 2) {
                this.vx = targetVx;
                this.vy = targetVy;
            }
            
            this.velocityAngle = Math.atan2(this.vy, this.vx);
        } else {
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
            this.velocityAngle = this.angle;
        }

        // Move
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Track collision
        if (collisionGrid) {
            this.castSensors(sensorGrid || collisionGrid);
            
            if (!this.airborne) {
                const corners = this.getCorners();
                if (typeof currentTrack !== 'undefined' && currentTrack && typeof TILE_TYPES !== 'undefined') {
                    let touchingCrossroad = false;
                    for (const c of corners) {
                        const col = Math.floor(c.x / 100);
                        const row = Math.floor(c.y / 100);
                        const tileId = currentTrack.getTile(col, row);
                        if (tileId === TILE_TYPES.CROSSROAD.id || (tileId >= TILE_TYPES.SPLIT_UP.id && tileId <= TILE_TYPES.SPLIT_LEFT.id)) {
                            touchingCrossroad = true;
                            break;
                        }
                    }
                    
                    if (touchingCrossroad) {
                        if (!this.crossroadAxis) {
                            this.crossroadAxis = Math.abs(Math.cos(this.angle)) > Math.abs(Math.sin(this.angle)) ? 'H' : 'V';
                        }
                    } else {
                        this.crossroadAxis = null;
                    }
                }

                let offCount = 0;
                let crossroadViolation = false;
                
                for (const c of corners) {
                    const check = this.isPointOnTrack(c.x, c.y, collisionGrid);
                    if (check === false) offCount++;
                    if (check === 'crossroad_violation') {
                        crossroadViolation = true;
                        offCount++;
                    }
                }
                
                const centerCheck = this.isPointOnTrack(this.x, this.y, collisionGrid);
                if (centerCheck === 'crossroad_violation') crossroadViolation = true;
                
                if (crossroadViolation) {
                    this.x = prevX;
                    this.y = prevY;
                    this.speed *= -0.5; // bounce
                } else {
                    if (offCount >= 1) {
                        this.speed *= this.offTrackPenalty;
                    }
                    if (centerCheck === false) {
                        if (this.alive && !this.brain && typeof playCrashSound === 'function') {
                            playCrashSound();
                        }
                        this.alive = false;
                    }
                }
            }
        }

        if (this.started) {
            this.lapTime += dt;
            this.totalTime += dt;
        }
        
        // Calculate progress to next checkpoint for a smooth fitness gradient
        let progress = 0;
        if (typeof currentTrack !== 'undefined' && currentTrack && currentTrack.checkpoints && currentTrack.checkpoints.length) {
            const targetIndex = this.checkpointIndex % currentTrack.checkpoints.length;
            const cp = currentTrack.checkpoints[targetIndex];
            
            let prevCp = null;
            if (this.totalCheckpoints === 0 && this.checkpointIndex === 0) {
                prevCp = currentTrack.startPos;
            } else {
                let pIdx = (this.checkpointIndex - 1 + currentTrack.checkpoints.length) % currentTrack.checkpoints.length;
                prevCp = currentTrack.checkpoints[pIdx];
            }
            
            if (cp && prevCp) {
                const totalDist = Math.hypot(cp.x - prevCp.x, cp.y - prevCp.y) || 1;
                const currentDist = Math.hypot(this.x - cp.x, this.y - cp.y);
                progress = Math.max(0, Math.min(1, 1 - (currentDist / totalDist)));
            }
        }
        
        // Fitness: checkpoint progress is king (worth 10 each), fractional progress fills in the gaps
        // Speed bonus rewards fast driving, survival bonus is tiny and capped to prevent idle-farming
        const checkpointScore = (this.totalCheckpoints + this.checkpointIndex) * 10 + progress * 10;
        const speedBonus = Math.max(0, this.speed / this.maxSpeed) * 0.5;
        const survivalBonus = Math.min(this.totalTime * 0.02, 1.0); // capped at 1.0
        let newFitness = checkpointScore + speedBonus + survivalBonus;
        
        // Ensure penalty is initialized
        if (typeof this.accumulatedWallPenalty === 'undefined') this.accumulatedWallPenalty = 0;
        
        // Wall scraping penalty
        if (this.sensors && this.sensors.length > 0) {
            for (const s of this.sensors) {
                if (s.dist < 15) this.accumulatedWallPenalty += (15 - s.dist) * 0.05 * dt;
            }
        }
        
        // Only increase base fitness based on progress
        if (newFitness > this.baseFitness || typeof this.baseFitness === 'undefined') {
            this.baseFitness = newFitness;
        }
        
        this.fitness = this.baseFitness - this.accumulatedWallPenalty;
        
        if (this.brain && this.speed <= 10 && this.started && this.totalTime > 1.5) {
            this.alive = false; // Kill car if it's crawling/stuck/reversing for too long
        }
    }

    isPointOnTrack(px, py, collisionGrid) {
        const ix = px | 0;
        const iy = py | 0;
        if (ix < 0 || iy < 0 || ix >= collisionGrid.width || iy >= collisionGrid.height) return false;
        
        // For crossroad tiles, use the crossroadAxis to detect if the car is going the wrong way.
        // We use a more generous 5% margin (vs the 10% collision canvas margin) to avoid false
        // violations caused by diagonal corners on the pixel boundary.
        if (typeof currentTrack !== 'undefined' && currentTrack && typeof TILE_TYPES !== 'undefined') {
            const pointCol = (px / 100) | 0;
            const pointRow = (py / 100) | 0;
            if (currentTrack.getTile(pointCol, pointRow) === TILE_TYPES.CROSSROAD.id && this.crossroadAxis) {
                const isCarHorizontal = this.crossroadAxis === 'H';
                const localX = px - pointCol * 100;
                const localY = py - pointRow * 100;
                
                if (isCarHorizontal) {
                    // Driving H: the top and bottom edges (y < 5 or y > 95) are off-limits
                    if (localY < 5 || localY > 95) return 'crossroad_violation';
                } else {
                    // Driving V: the left and right edges (x < 5 or x > 95) are off-limits
                    if (localX < 5 || localX > 95) return 'crossroad_violation';
                }
                // Within the crossroad the pixel data alone decides the rest
                return true;
            }
        }

        const index = (iy * collisionGrid.width + ix) << 2;
        const data = collisionGrid.data;
        // Track is drawn in white (255,255,255), grass is black
        return data[index] > 200 && data[index + 1] > 200 && data[index + 2] > 200;
    }

    castSensors(collisionGrid) {
        this.sensors = [];
        const spreadAngle = Math.PI * 0.7;
        for (let i = 0; i < this.sensorCount; i++) {
            const frac = this.sensorCount === 1 ? 0 : (i / (this.sensorCount - 1)) - 0.5;
            const sAngle = this.angle + frac * spreadAngle;
            
            const cos = Math.cos(sAngle);
            const sin = Math.sin(sAngle);
            let dist = this.sensorLength;
            
            for (let d = 5; d <= this.sensorLength; d += 5) {
                const sx = this.x + cos * d;
                const sy = this.y + sin * d;
                const check = this.isPointOnTrack(sx, sy, collisionGrid);
                if (check === false || check === 'crossroad_violation') {
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
        
        // Clear the last hit lock if we have driven out of it
        if (this.lastCheckpointHitIndex !== undefined) {
            const lastCp = checkpoints[this.lastCheckpointHitIndex % checkpoints.length];
            if (lastCp) {
                const dxLast = this.x - lastCp.x;
                const dyLast = this.y - lastCp.y;
                if (Math.sqrt(dxLast * dxLast + dyLast * dyLast) > lastCp.radius) {
                    this.lastCheckpointHitIndex = undefined;
                }
            }
        }

        const LOOKAHEAD = Math.min(30, checkpoints.length);
        
        for (let i = 0; i < LOOKAHEAD; i++) {
            const checkIndex = this.checkpointIndex + i;
            const targetIndex = checkIndex % checkpoints.length;
            const cp = checkpoints[targetIndex];
            if (!cp) continue;
            
            const dx = this.x - cp.x;
            const dy = this.y - cp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < cp.radius) {
                if (this.lastCheckpointHitIndex !== targetIndex) {
                    this.lastCheckpointHitIndex = targetIndex;
                    
                    this.checkpointIndex += (i + 1);
                    
                    if (this.checkpointIndex >= checkpoints.length) {
                        // Completed a lap
                        this.lapCount++;
                        this.totalCheckpoints += checkpoints.length;
                        if (this.lapTime < this.bestLap) this.bestLap = this.lapTime;
                        this.lapTime = 0;
                        this.checkpointIndex = this.checkpointIndex % checkpoints.length;
                    }
                }
                break; // We hit one, stop looking further ahead
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        let scale = 1.0;
        if (this.airborne) {
            scale = 1.0 + (this.z / 150); 
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(-this.width/2 - this.z/4, -this.height/2 + this.z/2, this.width, this.height);
        }
        
        ctx.scale(scale, scale);
        ctx.globalAlpha = this.alive ? 1.0 : 0.4;
        
        const carType = window.userCarType || 'f1';
        const hueShift = window.userHueShift || 0;
        const brightness = window.userBrightness !== undefined ? window.userBrightness : 100;
        const currentSprite = CAR_IMAGES[carType];

        if (currentSprite.complete && currentSprite.naturalWidth > 0) {
            ctx.filter = `hue-rotate(${hueShift}deg) brightness(${brightness}%)`;
            ctx.drawImage(currentSprite, -this.width/2 * 1.5, -this.height/2 * 1.5, this.width * 1.5, this.height * 1.5);
            ctx.filter = 'none';
        } else {
            ctx.fillStyle = this.alive ? this.color : '#333333';
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
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
        this.crossroadAxis = null;
        this.memory = [];
    }
}

window.Car = Car;
