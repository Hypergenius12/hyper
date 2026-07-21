// ========================================
// Car.js — 2D Top-Down Car Physics
// ========================================
const carSprite = new Image();
carSprite.src = 'img/car_sprite.png';

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

    update(dt, keys, collisionGrid) {
        if (!this.alive) return;

        this.isAccelerating = false;

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
                currentTurnRate = this.turnRate * 0.15;
            }
            // Rough Physics
            if (centerTileId >= TILE_TYPES.ROUGH_STRAIGHT_V.id && centerTileId <= TILE_TYPES.ROUGH_CURVE_TL.id) {
                currentMaxSpeed = this.maxSpeed * 0.4;
                currentAccel = this.acceleration * 0.4;
                this.speed *= 0.95; // Active slowdown drag
            }
        }

        // AI input
        if (this.brain && this.sensors.length) {
            const expectedMemoryCount = this.brain.layerSizes[0] - this.sensorCount - 1;
            if (!this.memory || this.memory.length !== expectedMemoryCount) {
                this.memory = new Array(Math.max(0, expectedMemoryCount)).fill(0);
            }

            const inputs = this.sensors.map(s => s.dist / this.sensorLength);
            inputs.push(this.speed / currentMaxSpeed);
            for (let i = 0; i < this.memory.length; i++) {
                inputs.push(this.memory[i]);
            }

            const outputs = this.brain.feedforward(inputs);

            // Variable throttle/steering (raw outputs 0.0 - 1.0)
            const accelForce = outputs[0];
            const brakeForce = outputs[1];
            const leftForce = outputs[2];
            const rightForce = outputs[3];

            // Store recurrent memory for next frame
            for (let i = 0; i < this.memory.length; i++) {
                this.memory[i] = outputs[4 + i] || 0;
            }

            this.speed += currentAccel * accelForce * dt;
            this.speed -= this.brakeForce * brakeForce * dt;
            if (accelForce > 0.1 || brakeForce > 0.1) {
                this.started = true;
                if (accelForce > 0.1) this.isAccelerating = true;
            }

            if (Math.abs(this.speed) > 0.1) {
                const dir = this.speed > 0 ? 1 : -1;
                const steer = rightForce - leftForce;
                this.angle += currentTurnRate * steer * dt * dir;
            }

            // Prevent boolean key overrides
            keys = null;
        }

        if (keys) {
            if (keys.up) {
                this.speed += currentAccel * dt;
                this.started = true;
                this.isAccelerating = true;
            }
            if (keys.down) this.speed -= this.brakeForce * dt;

            if (Math.abs(this.speed) > 0.1) {
                const dir = this.speed > 0 ? 1 : -1;
                if (keys.left) this.angle -= currentTurnRate * dt * dir;
                if (keys.right) this.angle += currentTurnRate * dt * dir;
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
        this.speed *= (1 - currentFriction * dt);
        
        this.speed = Math.max(-currentMaxSpeed * 0.4, Math.min(currentMaxSpeed, this.speed));
        if (Math.abs(this.speed) < 0.5) this.speed = 0;

        const prevX = this.x;
        const prevY = this.y;

        // Move
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        // Track collision
        if (collisionGrid) {
            this.castSensors(collisionGrid);
            
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
                
                if (crossroadViolation) {
                    this.x = prevX;
                    this.y = prevY;
                    this.speed *= -0.5; // bounce
                } else {
                    if (offCount >= 1) {
                        this.speed *= this.offTrackPenalty;
                    }
                    if (offCount >= 3) {
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
                progress = Math.max(0, 1 - (currentDist / totalDist));
            }
        }
        
        const speedBonus = Math.max(0, this.speed / this.maxSpeed) * 0.1;
        const survivalBonus = this.totalTime * 0.05;
        let newFitness = this.totalCheckpoints + this.checkpointIndex + progress + speedBonus + survivalBonus;
        
        // Wall scraping penalty
        let wallPenalty = 0;
        if (this.sensors && this.sensors.length > 0) {
            for (const s of this.sensors) {
                if (s.dist < 15) wallPenalty += (15 - s.dist) * 0.1 * dt;
            }
        }
        
        // Only increase fitness based on progress, but allow penalty to decrease it
        if (newFitness > this.fitness) {
            this.fitness = newFitness;
        }
        
        this.fitness -= wallPenalty;
        
        if (this.speed <= 10 && this.started && this.totalTime > 1.5) {
            this.alive = false; // Kill car if it's crawling/stuck/reversing for too long
        }
    }

    isPointOnTrack(px, py, collisionGrid) {
        const ix = Math.floor(px);
        const iy = Math.floor(py);
        if (ix < 0 || iy < 0 || ix >= collisionGrid.width || iy >= collisionGrid.height) return false;
        
        if (typeof currentTrack !== 'undefined' && currentTrack && typeof TILE_TYPES !== 'undefined') {
            const pointCol = Math.floor(px / 100);
            const pointRow = Math.floor(py / 100);
            if (currentTrack.getTile(pointCol, pointRow) === TILE_TYPES.CROSSROAD.id) {
                const isCarHorizontal = this.crossroadAxis ? (this.crossroadAxis === 'H') : (Math.abs(Math.cos(this.angle)) > Math.abs(Math.sin(this.angle)));
                const localX = px - pointCol * 100;
                const localY = py - pointRow * 100;
                
                if (isCarHorizontal) {
                    if (localY < 10 || localY > 90) return 'crossroad_violation';
                } else {
                    if (localX < 10 || localX > 90) return 'crossroad_violation';
                }
            }
        }

        const index = (iy * collisionGrid.width + ix) * 4;
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
            let dist = this.sensorLength;
            for (let d = 5; d <= this.sensorLength; d += 3) {
                const sx = this.x + Math.cos(sAngle) * d;
                const sy = this.y + Math.sin(sAngle) * d;
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

        const targetIndex = this.checkpointIndex % checkpoints.length;
        const cp = checkpoints[targetIndex];
        if (!cp) return;
        
        const dx = this.x - cp.x;
        const dy = this.y - cp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < cp.radius) {
            if (this.lastCheckpointHitIndex !== targetIndex) {
                this.lastCheckpointHitIndex = targetIndex;
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
        
        if (carSprite.complete && carSprite.naturalWidth > 0) {
            ctx.drawImage(carSprite, -this.width/2 * 1.5, -this.height/2 * 1.5, this.width * 1.5, this.height * 1.5);
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
