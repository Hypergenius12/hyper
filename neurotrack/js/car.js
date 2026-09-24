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
        this.checkpointIndex = (typeof currentTrack !== 'undefined' && currentTrack && currentTrack.checkpoints && currentTrack.checkpoints.length > 1) ? 1 : 0;
        this.checkpointsInLap = 0;
        this.recentCheckpoints = [];
        this.totalCheckpoints = 0;
        this.lapCount = 0;
        this.lapTime = 0;
        this.bestLap = Infinity;
        this.totalTime = 0;
        this.started = false;
        this.stoppedTime = 0;

        // Sensors (for AI)
        this.sensors = [];
        this.sensorLength = (typeof window !== 'undefined' && window.fitnessRewards && window.fitnessRewards.sensorRange) ? window.fitnessRewards.sensorRange : 280;
        this.sensorCount = 7;
        this.crashed = false;

        // Neural network brain (null for human player)
        this.brain = null;

        // Physics tuning
        this.maxSpeed = 380;
        this.acceleration = 420;
        this.brakeForce = 650;
        this.friction = 1.8;
        this.turnRate = 4.0;
        this.offTrackPenalty = 0.92;
    }

    update(dt, keys, collisionGrid, sensorGrid) {
        if (!this.alive) return;

        this.prevX = this.x;
        this.prevY = this.y;

        this.isAccelerating = false;
        this.isTurning = false;

        let currentMaxSpeed = this.maxSpeed;
        let currentAccel = this.acceleration;
        let currentTurnRate = this.turnRate;
        let currentBrakeForce = this.brakeForce;
        
        let centerCol = Math.floor(this.x / 100);
        let centerRow = Math.floor(this.y / 100);
        let centerTileId = 0;

        if (typeof currentTrack !== 'undefined' && currentTrack && typeof TILE_TYPES !== 'undefined') {
            centerTileId = currentTrack.getTile(centerCol, centerRow);
            const tileAttrs = typeof currentTrack.getTileAttrs === 'function'
                ? currentTrack.getTileAttrs(centerCol, centerRow)
                : { road: 'default', wall: 'default' };
            
            // Ice Physics (attribute or legacy tile)
            if (tileAttrs.road === 'ice' || (centerTileId >= TILE_TYPES.ICE_STRAIGHT_V.id && centerTileId <= TILE_TYPES.ICE_CURVE_TL.id)) {
                currentTurnRate = this.turnRate * 0.4; // 40% turning ability (down from 100%)
                currentAccel = this.acceleration * 0.5; // Slippery acceleration
            }
            // Rough Physics (attribute or legacy tile)
            if (tileAttrs.road === 'rough' || (centerTileId >= TILE_TYPES.ROUGH_STRAIGHT_V.id && centerTileId <= TILE_TYPES.ROUGH_CURVE_TL.id)) {
                currentMaxSpeed = this.maxSpeed * 0.4;
                currentAccel = this.acceleration * 0.4;
                this.speed *= (1 - 3.0 * dt); // Active slowdown drag, framerate independent
            }
            // Puddle Physics (attribute or legacy tile)
            if (tileAttrs.road === 'puddle' || (centerTileId >= TILE_TYPES.PUDDLE_STRAIGHT_V.id && centerTileId <= TILE_TYPES.PUDDLE_CURVE_TL.id)) {
                currentTurnRate = 0; // No steering
                currentAccel = 0; // No accelerating
                currentBrakeForce = 0; // No braking
            }
            // Unlimited Speed (Fast) Physics (attribute or legacy tile)
            if (tileAttrs.road === 'fast' || (centerTileId >= TILE_TYPES.FAST_STRAIGHT_V.id && centerTileId <= TILE_TYPES.FAST_CURVE_TL.id)) {
                currentMaxSpeed = this.maxSpeed * 2.5; // Huge speed limit increase
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

            // High-performance racing throttle & braking:
            // outputs[0]: throttle intent, outputs[1]: brake intent
            // Scale throttle so forward output (>= 0.65) delivers 100% full racing acceleration
            const rawThrottle = Math.min(1, Math.max(0, (outputs[0] - 0.2) / 0.45));
            // Brake triggers when neuron 1 is actively excited (> 0.45)
            const rawBrake = Math.min(1, Math.max(0, (outputs[1] - 0.45) / 0.4));
            const netThrottle = rawThrottle * Math.max(0, 1 - rawBrake * 1.5);
            const netBrake = rawBrake;

            // For steering, subtract left from right, amplified for agile cornering
            let steer = Math.max(-1, Math.min(1, (outputs[3] - outputs[2]) * 1.8));

            // Store recurrent memory for next frame
            for (let i = 0; i < this.memory.length; i++) {
                this.memory[i] = outputs[4 + i] || 0;
            }

            if (!this.airborne) {
                if (netThrottle > 0) {
                    this.speed += currentAccel * netThrottle * dt;
                }
                if (netBrake > 0) {
                    // AI braking slows the car down smoothly without flipping into reverse
                    this.speed = Math.max(0, this.speed - currentBrakeForce * netBrake * dt);
                }
            }
            if (netThrottle > 0.05 || netBrake > 0.05) {
                this.started = true;
            }
            if (netThrottle > 0.05 && !this.airborne) {
                this.isAccelerating = true;
            }

            if (!this.airborne) {
                // Allow AI to steer smoothly (dir=1 for forward or stopped, dir=-1 for reverse)
                const dir = this.speed >= 0 ? 1 : -1;
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
            if (keys.down) {
                this.speed -= currentBrakeForce * dt;
                this.started = true;
            }
            if (Math.abs(this.speed) > 0.1) {
                const dir = this.speed > 0 ? 1 : -1;
                if (keys.left) { this.angle -= currentTurnRate * dt * dir; this.isTurning = true; }
                if (keys.right) { this.angle += currentTurnRate * dt * dir; this.isTurning = true; }
                
                // Human cornering scrub: turning sharply bleeds excess speed above safe cornering limit
                if (keys.left || keys.right) {
                    const vSafe = 50 * currentTurnRate;
                    if (this.speed > vSafe) {
                        const excess = this.speed - vSafe;
                        this.speed -= Math.min(excess, (currentBrakeForce * 0.4) * dt);
                    }
                }
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
                    const partner = typeof currentTrack.getPortalPartner === 'function'
                        ? currentTrack.getPortalPartner(centerCol, centerRow)
                        : null;
                    
                    if (partner) {
                        this.x = partner.c * 100 + 50;
                        this.y = partner.r * 100 + 50;
                        
                        const inAngles = { 32: -Math.PI/2, 33: 0, 34: Math.PI/2, 35: Math.PI };
                        const outAngles = { 32: Math.PI/2, 33: Math.PI, 34: -Math.PI/2, 35: 0 };
                        const entryBaseAngle = inAngles[centerTileId];
                        const exitBaseAngle = outAngles[partner.tid];
                        
                        const relativeAngle = this.angle - entryBaseAngle;
                        this.angle = exitBaseAngle + relativeAngle;
                        
                        // Push slightly forward along exit direction so the car exits smoothly
                        this.x += Math.cos(this.angle) * 12;
                        this.y += Math.sin(this.angle) * 12;
                        
                        this.justTeleported = true;
                        if (typeof playTeleportSound === 'function') {
                            playTeleportSound();
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

        // Friction: Smooth scaling so cars can cruise at intermediate and lower speeds
        let currentFriction = this.isAccelerating ? (this.friction * 0.45) : this.friction;
        
        if (typeof currentTrack !== 'undefined' && currentTrack && typeof TILE_TYPES !== 'undefined') {
            if (centerTileId >= TILE_TYPES.PUDDLE_STRAIGHT_V.id && centerTileId <= TILE_TYPES.PUDDLE_CURVE_TL.id) {
                currentFriction = 0; // Hydroplaning!
            }
        }

        if (!this.airborne) {
            this.speed *= (1 - currentFriction * dt);
        } else {
            this.speed *= (1 - 0.2 * dt); // Light air drag instead of rolling friction
        }
        
        this.speed = Math.max(-currentMaxSpeed * 0.4, Math.min(currentMaxSpeed, this.speed));
        if (Math.abs(this.speed) < 0.5) this.speed = 0;

        const prevX = this.x;
        const prevY = this.y;
        this.prevX = prevX;
        this.prevY = prevY;

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
                        if (tileId === TILE_TYPES.CROSSROAD_H_OVER.id || tileId === TILE_TYPES.CROSSROAD_V_OVER.id || (tileId >= TILE_TYPES.SPLIT_UP.id && tileId <= TILE_TYPES.SPLIT_LEFT.id)) {
                            touchingCrossroad = true;
                            break;
                        }
                    }
                    
                    if (touchingCrossroad) {
                        if (!this.crossroadAxis) {
                            this.crossroadAxis = Math.abs(Math.cos(this.angle)) > Math.abs(Math.sin(this.angle)) ? 'H' : 'V';
                        }
                        
                        // Determine if car is on the overpass for rendering order
                        this.isOnOverpass = false;
                        const centerTileId = currentTrack.getTile(Math.floor(this.x / 100), Math.floor(this.y / 100));
                        if (centerTileId === TILE_TYPES.CROSSROAD_H_OVER.id && this.crossroadAxis === 'H') this.isOnOverpass = true;
                        if (centerTileId === TILE_TYPES.CROSSROAD_V_OVER.id && this.crossroadAxis === 'V') this.isOnOverpass = true;
                    } else {
                        this.crossroadAxis = null;
                        this.isOnOverpass = false;
                    }
                }

                let offCount = 0;
                
                for (const c of corners) {
                    const check = this.isPointOnTrack(c.x, c.y, collisionGrid);
                    if (check === false) offCount++;
                }
                
                const centerCheck = this.isPointOnTrack(this.x, this.y, collisionGrid);
                const isSlide = (typeof currentTrack !== 'undefined' && currentTrack) ? this.isSlideContact(currentTrack) : false;

                if (isSlide) {
                    // SLIDE WALL: NEVER SLOW DOWN! Maintain full momentum and glide along wall
                    if (offCount >= 1 || centerCheck === false) {
                        const norm = this.getTrackNormal(this.x, this.y, collisionGrid);
                        let tx = -norm.ny, ty = norm.nx;
                        const fwdX = Math.cos(this.angle);
                        const fwdY = Math.sin(this.angle);
                        if (fwdX * tx + fwdY * ty < 0) {
                            tx = -tx;
                            ty = -ty;
                        }

                        // Repel from wall into the track
                        if (centerCheck === false) {
                            this.x = prevX + norm.nx * 2;
                            this.y = prevY + norm.ny * 2;
                        }
                        for (let step = 0; step < 4; step++) {
                            let anyOff = false;
                            for (const c of this.getCorners()) {
                                if (!this.isPointOnTrack(c.x, c.y, collisionGrid)) {
                                    anyOff = true;
                                    break;
                                }
                            }
                            if (anyOff) {
                                this.x += norm.nx * 2;
                                this.y += norm.ny * 2;
                            } else {
                                break;
                            }
                        }

                        // Align angle to tangent
                        const targetAngle = Math.atan2(ty, tx);
                        let angleDiff = targetAngle - this.angle;
                        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                        this.angle += angleDiff * Math.min(1, 16 * dt);

                        // Maintain full forward momentum without speed penalties
                        const curSpeed = Math.max(Math.abs(this.speed), Math.hypot(this.vx, this.vy));
                        this.speed = Math.max(curSpeed, 20);
                        this.vx = Math.cos(this.angle) * this.speed;
                        this.vy = Math.sin(this.angle) * this.speed;
                        this.velocityAngle = this.angle;
                        this.alive = true;
                    }
                } else {
                    if (offCount >= 1) {
                        this.speed *= Math.pow(this.offTrackPenalty, dt * 60);
                    }
                }

                if (centerCheck === false && !isSlide) {
                    let checkCol = Math.floor(this.x / 100);
                    let checkRow = Math.floor(this.y / 100);
                    let tileAttrs = (typeof currentTrack !== 'undefined' && currentTrack && typeof currentTrack.getTileAttrs === 'function') 
                        ? currentTrack.getTileAttrs(checkCol, checkRow) : null;
                    if (!tileAttrs || (tileAttrs.wall === 'default' && currentTrack.getTile(checkCol, checkRow) === 0)) {
                        const pCol = Math.floor(prevX / 100);
                        const pRow = Math.floor(prevY / 100);
                        const pAttrs = (typeof currentTrack !== 'undefined' && currentTrack && typeof currentTrack.getTileAttrs === 'function')
                            ? currentTrack.getTileAttrs(pCol, pRow) : null;
                        if (pAttrs && pAttrs.wall !== 'default') {
                            tileAttrs = pAttrs;
                            checkCol = pCol;
                            checkRow = pRow;
                        }
                    }
                    const wallAttr = tileAttrs ? tileAttrs.wall : 'default';
                    const isBouncy = (wallAttr === 'bouncy') || (centerTileId >= TILE_TYPES.BOUNCY_STRAIGHT_V.id && centerTileId <= TILE_TYPES.BOUNCY_CURVE_TL.id);

                    if (isBouncy) {
                        // Revert position to prevent getting stuck in wall
                        this.x = prevX;
                        this.y = prevY;
                        if (offCount >= 1) this.speed /= this.offTrackPenalty; // Revert friction

                        // Apply bounce penalty for AI
                        if (this.brain) {
                            this.accumulatedWallPenalty += 50;
                        }

                        // Vector reflection based on wall type
                        let nx = 0, ny = 0; // Normal vector
                        if (centerTileId === TILE_TYPES.BOUNCY_STRAIGHT_V.id) {
                            nx = 1; ny = 0; 
                        } else if (centerTileId === TILE_TYPES.BOUNCY_STRAIGHT_H.id) {
                            nx = 0; ny = 1; 
                        } else if (centerTileId === TILE_TYPES.BOUNCY_CURVE_TR.id) {
                            nx = -0.707; ny = 0.707; 
                        } else if (centerTileId === TILE_TYPES.BOUNCY_CURVE_BR.id) {
                            nx = -0.707; ny = -0.707; 
                        } else if (centerTileId === TILE_TYPES.BOUNCY_CURVE_BL.id) {
                            nx = 0.707; ny = -0.707; 
                        } else if (centerTileId === TILE_TYPES.BOUNCY_CURVE_TL.id) {
                            nx = 0.707; ny = 0.707; 
                        } else {
                            const canX = this.isPointOnTrack(this.x + Math.cos(this.angle) * 6, prevY, collisionGrid);
                            const canY = this.isPointOnTrack(prevX, this.y + Math.sin(this.angle) * 6, collisionGrid);
                            if (canX && !canY) {
                                nx = 0; ny = Math.sin(this.angle) > 0 ? -1 : 1;
                            } else if (canY && !canX) {
                                nx = Math.cos(this.angle) > 0 ? -1 : 1; ny = 0;
                            } else {
                                nx = -Math.cos(this.angle);
                                ny = -Math.sin(this.angle);
                            }
                        }

                        // Incoming velocity vector
                        const vx = Math.cos(this.angle) * this.speed;
                        const vy = Math.sin(this.angle) * this.speed;

                        // Dot product (v . n)
                        const dotProduct = vx * nx + vy * ny;

                        // Reflected velocity: v_new = v - 2(v . n)n
                        let vxNew = vx;
                        let vyNew = vy;
                        
                        if (dotProduct > 0) {
                            vxNew = vx - 2 * dotProduct * nx;
                            vyNew = vy - 2 * dotProduct * ny;
                        } else if (dotProduct < 0) {
                            vxNew = vx - 2 * dotProduct * nx;
                            vyNew = vy - 2 * dotProduct * ny;
                        }

                        // Set new angle and speed (bounce multiplier)
                        this.angle = Math.atan2(vyNew, vxNew);
                        this.speed = Math.min(Math.sqrt(vxNew * vxNew + vyNew * vyNew) * 1.5, this.maxSpeed * 1.2);
                        
                        this.x += Math.cos(this.angle) * 2;
                        this.y += Math.sin(this.angle) * 2;
                    } else {
                        const crashSpeed = Math.abs(this.speed);
                        this.speed = 0;
                        if (this.alive && !this.brain && typeof playCrashSound === 'function') {
                            playCrashSound();
                        }
                        this.alive = false;
                        this.crashed = true;
                        const speedRatio = Math.min(1, crashSpeed / this.maxSpeed);
                        this.accumulatedWallPenalty = (this.accumulatedWallPenalty || 0) + 25 + speedRatio * 35;
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
        let targetVelocityBonus = 0;
        if (typeof currentTrack !== 'undefined' && currentTrack && currentTrack.checkpoints && currentTrack.checkpoints.length) {
            const targetIndex = this.checkpointIndex % currentTrack.checkpoints.length;
            const cp = currentTrack.checkpoints[targetIndex];
            
            let prevCp = null;
            if (this.totalCheckpoints === 0 && (this.checkpointsInLap || 0) === 0 && this.checkpointIndex === 0) {
                prevCp = currentTrack.startPos || currentTrack.checkpoints[0];
            } else {
                let pIdx = (this.checkpointIndex - 1 + currentTrack.checkpoints.length) % currentTrack.checkpoints.length;
                prevCp = currentTrack.checkpoints[pIdx];
            }
            
            if (cp && prevCp) {
                const segX = cp.x - prevCp.x;
                const segY = cp.y - prevCp.y;
                const segLenSq = segX * segX + segY * segY;
                if (segLenSq > 1) {
                    // Vector projection along track segment:
                    // Cars taking wide racing lines or center lines advance down the track identically without penalty
                    const carX = this.x - prevCp.x;
                    const carY = this.y - prevCp.y;
                    const proj = (carX * segX + carY * segY) / segLenSq;
                    progress = Math.max(0, Math.min(1, proj));

                    // Forward velocity along track direction:
                    const segLen = Math.sqrt(segLenSq);
                    const nx = segX / segLen;
                    const ny = segY / segLen;
                    const forwardVelocity = (this.vx * nx + this.vy * ny);
                    targetVelocityBonus = Math.max(0, forwardVelocity / this.maxSpeed) * 1.5;
                } else {
                    const currentDist = Math.hypot(this.x - cp.x, this.y - cp.y);
                    progress = Math.max(0, Math.min(1, 1 - (currentDist / 100)));
                }
            }
        }

        const rewards = (typeof window !== 'undefined' && window.fitnessRewards) ? window.fitnessRewards : null;
        const cpWeight = (rewards && rewards.checkpointReward !== undefined) ? rewards.checkpointReward : 10;
        const lapWeight = (rewards && rewards.lapReward !== undefined) ? rewards.lapReward : 10000;
        const spdMult = (rewards && rewards.speedReward !== undefined) ? rewards.speedReward : 1.0;
        const wallMult = (rewards && rewards.wallPenalty !== undefined) ? rewards.wallPenalty : 1.0;
        const survMult = (rewards && rewards.survivalReward !== undefined) ? rewards.survivalReward : 1.0;
        const idleLimit = (rewards && rewards.idleTimeout !== undefined) ? rewards.idleTimeout : 3.5;

        const currentLapProgress = (this.checkpointIndex === 0 && (this.checkpointsInLap || 0) > 0 && typeof currentTrack !== 'undefined' && currentTrack && currentTrack.checkpoints && currentTrack.checkpoints.length > 0)
            ? currentTrack.checkpoints.length
            : this.checkpointIndex;
        const checkpointScore = (this.totalCheckpoints + currentLapProgress) * cpWeight + progress * cpWeight;
        const rawSpeedBonus = this.isTurning
            ? (targetVelocityBonus * 0.2) // During cornering, reward heading toward the checkpoint without penalizing safe cornering speed
            : (Math.max(0, this.speed / this.maxSpeed) * 0.15 + (targetVelocityBonus * 0.2));
        const speedBonus = rawSpeedBonus * spdMult;
        const survivalBonus = Math.min(this.totalTime * 0.02, 1.0) * survMult; // capped at 1.0 * survMult
        
        // Prioritize speed of completion: Massive bonus for completing a lap, scaled by how fast they did it!
        const lapBonus = this.lapCount * lapWeight;
        const lapTimePenalty = (this.bestLap > 0 && this.bestLap !== Infinity) ? (1000 / this.bestLap) : 0;
        
        let newFitness = checkpointScore + speedBonus + survivalBonus + lapBonus + lapTimePenalty;
        
        // Ensure penalty is initialized
        if (typeof this.accumulatedWallPenalty === 'undefined') this.accumulatedWallPenalty = 0;
        
        // Wall scraping penalty
        if (this.sensors && this.sensors.length > 0 && wallMult > 0) {
            for (const s of this.sensors) {
                if (s.dist < 15) {
                    const severity = (15 - s.dist);
                    this.accumulatedWallPenalty += severity * 0.15 * dt * wallMult;
                }
            }
        }
        
        // Only increase base fitness based on progress
        if (newFitness > this.baseFitness || typeof this.baseFitness === 'undefined') {
            this.baseFitness = newFitness;
        }
        
        this.fitness = Math.max(0, this.baseFitness - this.accumulatedWallPenalty);
        
        if (this.brain && this.started) {
            // Only count if completely motionless (< 1 px/s).
            // Cars are allowed to slow down to navigate corners without dying!
            if (Math.abs(this.speed) < 1.0) {
                this.stoppedTime = (this.stoppedTime || 0) + dt;
                // If completely motionless for > idleLimit seconds, retire the car to avoid hanging generations.
                if (this.stoppedTime > idleLimit) {
                    this.alive = false;
                }
            } else {
                this.stoppedTime = 0;
            }
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
            const tileId = currentTrack.getTile(pointCol, pointRow);
            if ((tileId === TILE_TYPES.CROSSROAD_H_OVER.id || tileId === TILE_TYPES.CROSSROAD_V_OVER.id) && this.crossroadAxis) {
                const isCarHorizontal = this.crossroadAxis === 'H';
                const localX = px - pointCol * 100;
                const localY = py - pointRow * 100;
                
                if (isCarHorizontal) {
                    // Driving H: the top and bottom edges (y < 10 or y > 90) are off-limits
                    if (localY < 10 || localY > 90) return false;
                } else {
                    // Driving V: the left and right edges (x < 10 or x > 90) are off-limits
                    if (localX < 10 || localX > 90) return false;
                }
            }
        }

        const index = (iy * collisionGrid.width + ix) << 2;
        const data = collisionGrid.data;
        // Track is drawn in white (255,255,255), grass is black
        return data[index] > 200 && data[index + 1] > 200 && data[index + 2] > 200;
    }

    isSlideContact(currentTrack) {
        if (!currentTrack || typeof currentTrack.getTileAttrs !== 'function') return false;
        const cCol = Math.floor(this.x / 100);
        const cRow = Math.floor(this.y / 100);
        const cur = currentTrack.getTileAttrs(cCol, cRow);
        if (cur && cur.wall === 'slide') return true;

        if (this.prevX !== undefined && this.prevY !== undefined) {
            const pCol = Math.floor(this.prevX / 100);
            const pRow = Math.floor(this.prevY / 100);
            const prev = currentTrack.getTileAttrs(pCol, pRow);
            if (prev && prev.wall === 'slide') return true;
        }

        for (const c of this.getCorners()) {
            const col = Math.floor(c.x / 100);
            const row = Math.floor(c.y / 100);
            const attrs = currentTrack.getTileAttrs(col, row);
            if (attrs && attrs.wall === 'slide') return true;
        }

        if (this.sensors && this.sensors.length > 0) {
            for (const s of this.sensors) {
                if (s.dist < 30) {
                    const hx = Math.floor((this.x + Math.cos(s.angle) * s.dist) / 100);
                    const hy = Math.floor((this.y + Math.sin(s.angle) * s.dist) / 100);
                    const sAttrs = currentTrack.getTileAttrs(hx, hy);
                    if (sAttrs && sAttrs.wall === 'slide') return true;
                }
            }
        }
        return false;
    }

    getTrackNormal(px, py, collisionGrid) {
        let sampleX = px;
        let sampleY = py;
        if (typeof this.getCorners === 'function') {
            for (const c of this.getCorners()) {
                if (!this.isPointOnTrack(c.x, c.y, collisionGrid)) {
                    sampleX = c.x;
                    sampleY = c.y;
                    break;
                }
            }
        }

        const step = 8;
        let gx = 0, gy = 0;
        const rOn = this.isPointOnTrack(sampleX + step, sampleY, collisionGrid);
        const lOn = this.isPointOnTrack(sampleX - step, sampleY, collisionGrid);
        if (rOn && !lOn) gx = 1;
        else if (!rOn && lOn) gx = -1;

        const dOn = this.isPointOnTrack(sampleX, sampleY + step, collisionGrid);
        const uOn = this.isPointOnTrack(sampleX, sampleY - step, collisionGrid);
        if (dOn && !uOn) gy = 1;
        else if (!dOn && uOn) gy = -1;

        let len = Math.hypot(gx, gy);
        if (len > 0.001) {
            return { nx: gx / len, ny: gy / len };
        }
        if (this.prevX !== undefined && this.prevY !== undefined) {
            const dx = this.prevX - px;
            const dy = this.prevY - py;
            len = Math.hypot(dx, dy);
            if (len > 0.001) return { nx: dx / len, ny: dy / len };
        }
        return { nx: -Math.cos(this.angle), ny: -Math.sin(this.angle) };
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
        
        if (!this.recentCheckpoints) this.recentCheckpoints = [];

        function segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
            function ccw(ax, ay, bx, by, cx, cy) {
                return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
            }
            return (ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4)) &&
                   (ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4));
        }

        function distToSegmentSquared(px, py, x1, y1, x2, y2) {
            const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
            if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
            let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
            t = Math.max(0, Math.min(1, t));
            const nx = x1 + t * (x2 - x1);
            const ny = y1 + t * (y2 - y1);
            return (px - nx) * (px - nx) + (py - ny) * (py - ny);
        }

        if (!checkpoints || checkpoints.length === 0) return;
        const totalCp = checkpoints.length;
        if (this.checkpointIndex >= totalCp) {
            this.checkpointIndex = this.checkpointIndex % totalCp;
        }

        const isLineMode = checkpoints.some(cp => cp.isLine);

        // Strict sequential progression:
        // - Manual gate mode (lines): strict 1-by-1 (LOOKAHEAD = 1).
        // - Tiny tracks (< 4 checkpoints): strict 1-by-1 (LOOKAHEAD = 1).
        // - When targeting finish line (checkpointIndex === 0): strictly 1 (LOOKAHEAD = 1), must cross finish line.
        // - Auto tile tracks (circles): max lookahead of 2 (target and target+1) allowing apex cutting,
        //   while strictly preventing cutting across parallel lanes, hairpins, or loops.
        const LOOKAHEAD = (isLineMode || totalCp < 4 || this.checkpointIndex === 0) ? 1 : 2;

        for (let i = 0; i < LOOKAHEAD; i++) {
            const targetIndex = (this.checkpointIndex + i) % totalCp;
            const cp = checkpoints[targetIndex];
            if (!cp) continue;
            
            let hit = false;
            if (cp.isLine) {
                const prevX = (typeof this.prevX !== 'undefined') ? this.prevX : this.x;
                const prevY = (typeof this.prevY !== 'undefined') ? this.prevY : this.y;
                hit = segmentsIntersect(prevX, prevY, this.x, this.y, cp.x1, cp.y1, cp.x2, cp.y2) ||
                      (distToSegmentSquared(this.x, this.y, cp.x1, cp.y1, cp.x2, cp.y2) < 25 * 25);
            } else {
                const dx = this.x - cp.x;
                const dy = this.y - cp.y;
                hit = (dx * dx + dy * dy) < (cp.radius * cp.radius);
            }
            
            if (hit) {
                // Prevent hitting a checkpoint if it occupies the exact same physical coordinates 
                // as ANY of the last 5 checkpoints we recently hit (e.g. crossroad underpass/overpass).
                let isOverlap = false;
                if (!cp.isLine && this.recentCheckpoints) {
                    for (const recent of this.recentCheckpoints) {
                        if (recent.x === cp.x && recent.y === cp.y) {
                            isOverlap = true;
                            break;
                        }
                    }
                }
                
                if (isOverlap) continue;
                
                if (!this.recentCheckpoints) this.recentCheckpoints = [];
                this.recentCheckpoints.push({x: cp.x, y: cp.y});
                if (this.recentCheckpoints.length > 5) {
                    this.recentCheckpoints.shift();
                }

                const advance = i + 1;
                this.checkpointsInLap = (this.checkpointsInLap || 0) + advance;

                // Did we hit the finish line (targetIndex === 0)?
                // Note: checkpoints[0] is the Start/Finish line.
                if (targetIndex === 0) {
                    const minRequired = isLineMode
                        ? Math.max(1, totalCp)
                        : Math.max(2, Math.floor(totalCp * 0.70));

                    if (this.checkpointsInLap >= minRequired && this.lapTime >= 1.0) {
                        // Legitimate lap completed!
                        this.lapCount++;
                        this.totalCheckpoints += totalCp;
                        if (this.lapTime < this.bestLap) this.bestLap = this.lapTime;
                        this.lapTime = 0;
                        this.checkpointsInLap = 0;
                        this.checkpointIndex = (totalCp > 1) ? 1 : 0;
                    } else {
                        // Premature trigger without visiting track checkpoints or during spawn
                        this.checkpointIndex = (totalCp > 1) ? 1 : 0;
                        this.checkpointsInLap = 0;
                    }
                } else {
                    this.checkpointIndex = (targetIndex + 1) % totalCp;
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

    static renderGhost(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.45;
        
        const carType = window.userCarType || 'f1';
        const currentSprite = CAR_IMAGES[carType];

        if (currentSprite && currentSprite.complete && currentSprite.naturalWidth > 0) {
            ctx.filter = 'hue-rotate(180deg) brightness(140%) drop-shadow(0 0 6px rgba(0,255,255,0.7))';
            ctx.drawImage(currentSprite, -15 * 1.5, -7.5 * 1.5, 30 * 1.5, 15 * 1.5);
            ctx.filter = 'none';
        } else {
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8;
            ctx.fillRect(-15, -7.5, 30, 15);
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
        this.crashed = false;
        this.fitness = 0;
        this.baseFitness = 0;
        this.accumulatedWallPenalty = 0;
        this.checkpointIndex = (typeof currentTrack !== 'undefined' && currentTrack && currentTrack.checkpoints && currentTrack.checkpoints.length > 1) ? 1 : 0;
        this.checkpointsInLap = 0;
        this.recentCheckpoints = [];
        this.totalCheckpoints = 0;
        this.lapCount = 0;
        this.lapTime = 0;
        this.bestLap = Infinity;
        this.totalTime = 0;
        this.started = false;
        this.stoppedTime = 0;
        this.sensors = [];
        this.sensorLength = (typeof window !== 'undefined' && window.fitnessRewards && window.fitnessRewards.sensorRange) ? window.fitnessRewards.sensorRange : 280;
        this.crossroadAxis = null;
        this.memory = [];
    }
}

window.Car = Car;
