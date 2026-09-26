class Player {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        
        this.isSprinting = false;
        this.isCrouching = false;
        this.isSwimming = false;
        
        this.gravity = 70; 
        this.speed = 50; // Double speed
        this.sprintMultiplier = 2.0;
        this.crouchMultiplier = 0.4;
        this.jumpVelocity = 35;
        this.swimJumpVelocity = 15;
        
        this.lastStepTime = 0;
        
        this.pitchObject = new THREE.Object3D();
        this.pitchObject.add(camera);
        this.pitchObject.position.y = 2.5; // Raised camera height
        
        this.yawObject = new THREE.Object3D();
        this.yawObject.position.y = 15; // Start near the ground
        this.yawObject.add(this.pitchObject);
        
        this.setupControls();
    }
    
    setupControls() {
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement !== document.body) return;
            const movementX = e.movementX || 0;
            const movementY = e.movementY || 0;
            
            this.yawObject.rotation.y -= movementX * 0.002;
            this.pitchObject.rotation.x -= movementY * 0.002;
            this.pitchObject.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.pitchObject.rotation.x));
        });
        
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'KeyW': this.moveForward = true; break;
                case 'KeyA': this.moveLeft = true; break;
                case 'KeyS': this.moveBackward = true; break;
                case 'KeyD': this.moveRight = true; break;
                case 'Space': 
                    if (this.isSwimming) {
                        if (this.yawObject.position.y > WATER_LEVEL - 1.0) {
                            // Dolphin leap out of the water!
                            this.velocity.y = this.jumpVelocity * 1.5;
                        } else {
                            // Paddle up
                            this.velocity.y += this.swimJumpVelocity * 0.5;
                        }
                    } else if (this.canJump) {
                        this.velocity.y = this.jumpVelocity;
                        this.canJump = false;
                    }
                    break;
                case 'ShiftLeft': 
                    this.isCrouching = true; 
                    if (this.isSwimming) this.velocity.y -= this.swimJumpVelocity * 0.5;
                    break;
                case 'ControlLeft': this.isSprinting = true; break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'KeyW': this.moveForward = false; break;
                case 'KeyA': this.moveLeft = false; break;
                case 'KeyS': this.moveBackward = false; break;
                case 'KeyD': this.moveRight = false; break;
                case 'ShiftLeft': this.isCrouching = false; break;
                case 'ControlLeft': this.isSprinting = false; break;
            }
        });
    }
    
    getObject() {
        return this.yawObject;
    }
    
    playFootstep() {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        
        // Generate a short burst of white noise for a 'crunch' sound on land
        const bufferSize = this.audioCtx.sampleRate * 0.1; // 100ms
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000 + Math.random() * 500;
        
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime); 
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        noise.start();
    }
    
    update(delta, scene) {
        const px = this.yawObject.position.x;
        const pz = this.yawObject.position.z;
        const temp = simplex.noise2D(px * 0.0005 + 5000, pz * 0.0005 + 5000);
        const isTaiga = temp < -0.5;
        
        let groundHeightCheck = 0;
        if (typeof getExactHeight === 'function') {
            groundHeightCheck = getExactHeight(px, pz);
        }
        const onIce = isTaiga && groundHeightCheck === WATER_LEVEL;
        
        let drag = this.isSwimming ? 3.0 : 10.0;
        if (onIce) drag = 1.0; // Slippery ice!
        
        this.velocity.x -= this.velocity.x * drag * delta;
        this.velocity.z -= this.velocity.z * drag * delta;
        
        const currentGravity = this.isSwimming ? this.gravity * 0.2 : this.gravity;
        this.velocity.y -= currentGravity * delta;
        
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        const isMoving = Math.abs(this.velocity.x) > 1.0 || Math.abs(this.velocity.z) > 1.0;
        if (isMoving && this.canJump && !this.isSwimming) {
            const now = performance.now();
            const stepDelay = this.isSprinting ? 250 : 400;
            if (now - this.lastStepTime > stepDelay) {
                this.playFootstep();
                this.lastStepTime = now;
            }
        }
        
        let currentSpeed = this.speed;
        if (this.isSprinting) currentSpeed *= this.sprintMultiplier;
        if (this.isCrouching) currentSpeed *= this.crouchMultiplier;
        if (this.isSwimming) currentSpeed *= 0.5;
        if (onIce) currentSpeed *= 0.4; // Less acceleration on ice so you don't go flying
        
        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * currentSpeed * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x += this.direction.x * currentSpeed * delta; 
        
        if (this.isSwimming) {
            // Apply drag to Y velocity as well so you don't sink forever
            this.velocity.y -= this.velocity.y * 3.0 * delta;
            
            // Add forward movement along the Y axis based on camera pitch
            if (this.moveForward || this.moveBackward) {
                 const pitchForce = Math.sin(this.pitchObject.rotation.x) * this.direction.z;
                 this.velocity.y += pitchForce * currentSpeed * delta;
            }
        }
        
        // Calculate movement local to player's rotation
        const movement = new THREE.Vector3(this.velocity.x * delta, 0, this.velocity.z * delta);
        movement.applyQuaternion(this.yawObject.quaternion);
        
        let newX = this.yawObject.position.x + movement.x;
        let newZ = this.yawObject.position.z + movement.z;
        if (isNaN(newX) || isNaN(newZ)) {
            console.error("NaN detected in player position!", {x: this.yawObject.position.x, z: this.yawObject.position.z, movX: movement.x, movZ: movement.z, velX: this.velocity.x, velZ: this.velocity.z, delta: delta});
            newX = 0;
            newZ = 0;
            this.velocity.set(0,0,0);
        }
        
        // Simple tree hitboxes or cave walls
        let colliders = this.inCave ? window.caveColliders : window.treeColliders;
        if (colliders) {
            for (let i = 0; i < colliders.length; i++) {
                const c = colliders[i];
                if (Math.abs(newX - c.x) > 10 || Math.abs(newZ - c.z) > 10) continue;
                
                const dx = newX - c.x;
                const dz = newZ - c.z;
                if (dx*dx + dz*dz < c.radius * c.radius) {
                    const dist = Math.sqrt(dx*dx + dz*dz);
                    const pushOut = c.radius - dist + 0.01;
                    newX += (dx / dist) * pushOut;
                    newZ += (dz / dist) * pushOut;
                }
            }
        }
        
        this.yawObject.position.x = newX;
        this.yawObject.position.z = newZ;
        
        this.yawObject.position.y += (this.velocity.y * delta);
        
        const currentPx = this.yawObject.position.x;
        const currentPz = this.yawObject.position.z;
        let groundHeight = window.getPlayerGroundHeight 
            ? window.getPlayerGroundHeight(currentPx, this.yawObject.position.y, currentPz)
            : getExactHeight(currentPx, currentPz);
        
        const eyeHeight = this.isCrouching ? 1.0 : 1.8;
        
        // Head bobbing & Camera tilt
        if (isMoving && !this.isSwimming && this.yawObject.position.y <= groundHeight + eyeHeight + 0.1) {
            const time = performance.now() * (this.isSprinting ? 0.012 : 0.008);
            this.pitchObject.position.y = eyeHeight + Math.sin(time) * 0.15; // Bob up/down
        } else {
            // Smoothly return to eye height
            this.pitchObject.position.y += (eyeHeight - this.pitchObject.position.y) * 10 * delta;
        }
        
        // Camera tilt based on local sideways velocity
        const targetTilt = this.velocity.x * -0.015; // Negative because A moves left (-x) but tilts left (+z rot)
        this.pitchObject.rotation.z += (targetTilt - this.pitchObject.rotation.z) * 10 * delta;
        
        if (this.framesActive === undefined) {
            this.framesActive = 0;
            this.wasSwimming = this.isSwimming; // initialize without splash
        }
        this.framesActive++;
        
        const previouslySwimming = this.wasSwimming;
        this.isSwimming = (groundHeight < WATER_LEVEL - 0.8);
        
        if ((this.isSwimming && !previouslySwimming) || (!this.isSwimming && previouslySwimming)) {
            const nowSplash = performance.now();
            if ((!this.lastSplashTime || nowSplash - this.lastSplashTime > 500) && this.framesActive > 10) {
                if (window.audioManager) window.audioManager.playSplash();
                this.lastSplashTime = nowSplash;
            }
        }
        this.wasSwimming = this.isSwimming;
        
        const overlay = document.getElementById('underwater-overlay');
        if (this.yawObject.position.y < WATER_LEVEL) {
            overlay.style.opacity = 1;
            scene.fog.density = 0.05; // Make underwater fog super thick so we can't see the void
            scene.fog.color.setHex(0x0a3296);
        } else {
            overlay.style.opacity = 0;
            // Restore sky fog (this is managed by sky.js mostly, but we can just set density)
            scene.fog.density = 0.005;
        }
        
        if (this.yawObject.position.y < groundHeight + eyeHeight) {
            this.velocity.y = Math.max(0, this.velocity.y);
            this.yawObject.position.y = groundHeight + eyeHeight;
            this.canJump = true;
        }
    }
}
