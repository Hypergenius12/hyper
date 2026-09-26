class FishManager {
    constructor(scene) {
        this.fishes = [];
        this.group = new THREE.Group();
        scene.add(this.group);
        
        const geo = new THREE.ConeGeometry(0.2, 0.8, 4);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, flatShading: true });
        
        for (let i = 0; i < 15; i++) {
            const fish = new THREE.Mesh(geo, mat);
            fish.userData = {
                angle: Math.random() * Math.PI * 2,
                speed: 1 + Math.random() * 2,
                radius: 3 + Math.random() * 12,
                yOffset: (Math.random() - 0.5) * 6
            };
            this.group.add(fish);
            this.fishes.push(fish);
        }
    }
    
    update(delta, playerPos) {
        if (playerPos.y > WATER_LEVEL + 5) {
            this.group.visible = false;
            return;
        }
        this.group.visible = true;
        
        this.group.position.set(playerPos.x, Math.min(WATER_LEVEL - 2, playerPos.y), playerPos.z);
        
        for (let fish of this.fishes) {
            const data = fish.userData;
            data.angle += data.speed * delta * 0.5;
            
            const fx = Math.cos(data.angle) * data.radius;
            const fz = Math.sin(data.angle) * data.radius;
            let fy = Math.sin(data.angle * 2) * 0.5 + data.yOffset;
            
            const worldX = this.group.position.x + fx;
            const worldZ = this.group.position.z + fz;
            const groundY = getExactHeight(worldX, worldZ);
            
            if (groundY > WATER_LEVEL - 1) {
                fish.visible = false;
            } else {
                fish.visible = true;
                // Keep fish above the ground
                const minLocalY = (groundY - this.group.position.y) + 1.0;
                if (fy < minLocalY) fy = minLocalY;
                
                fish.position.x = fx;
                fish.position.z = fz;
                fish.position.y = fy;
                fish.rotation.y = -data.angle;
            }
        }
    }
}

class WhaleManager {
    constructor(scene) {
        this.fishes = [];
        this.group = new THREE.Group();
        scene.add(this.group);
        
        // Whale is a big cylinder/cone
        const geo = new THREE.ConeGeometry(2.0, 12.0, 6);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x112244, flatShading: true });
        
        for (let i = 0; i < 2; i++) { // Only 2 whales
            const fish = new THREE.Mesh(geo, mat);
            fish.userData = {
                angle: Math.random() * Math.PI * 2,
                speed: 0.2 + Math.random() * 0.1, // very slow
                radius: 30 + Math.random() * 30, // wide circle
                yOffset: -10 - Math.random() * 10
            };
            this.group.add(fish);
            this.fishes.push(fish);
        }
    }
    
    update(delta, playerPos) {
        if (playerPos.y > WATER_LEVEL + 5) {
            this.group.visible = false;
            return;
        }
        
        const scale = 0.0015;
        let elevation = simplex.noise2D(scale * 0.5 * playerPos.x, scale * 0.5 * playerPos.z);
        elevation = (elevation + 1) / 2;
        
        // Only spawn whales in deep ocean
        if (elevation >= 0.2) {
            this.group.visible = false;
            return;
        }
        
        this.group.visible = true;
        this.group.position.set(playerPos.x, WATER_LEVEL, playerPos.z); // Whales swim relative to surface
        
        for (let fish of this.fishes) {
            const data = fish.userData;
            data.angle += data.speed * delta * 0.5;
            
            const fx = Math.cos(data.angle) * data.radius;
            const fz = Math.sin(data.angle) * data.radius;
            
            // Slow undulating dive
            let fy = Math.sin(data.angle * 4) * 5.0 + data.yOffset;
            
            const worldX = this.group.position.x + fx;
            const worldZ = this.group.position.z + fz;
            const groundY = getExactHeight(worldX, worldZ);
            
            // Whales need deep water
            if (groundY > WATER_LEVEL - 8) {
                fish.visible = false;
            } else {
                fish.visible = true;
                const minLocalY = (groundY - this.group.position.y) + 3.0; // Stay 3 units above ocean floor
                if (fy < minLocalY) fy = minLocalY;
                if (fy > -2) fy = -2; // Don't breach surface
                
                fish.position.x = fx;
                fish.position.z = fz;
                fish.position.y = fy;
                
                // Tilt the whale based on vertical movement
                const pitch = Math.cos(data.angle * 4) * 0.2;
                fish.rotation.set(pitch, -data.angle, 0, 'YXZ');
            }
        }
    }
}

class BubbleManager {
    constructor(scene) {
        this.particleCount = 150;
        const geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        
        for(let i=0; i<this.particleCount; i++) {
            this.positions[i*3] = (Math.random() - 0.5) * 40;
            this.positions[i*3+1] = -100; 
            this.positions[i*3+2] = (Math.random() - 0.5) * 40;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        context.beginPath();
        context.arc(16, 16, 12, 0, Math.PI * 2);
        context.strokeStyle = 'white';
        context.lineWidth = 4;
        context.stroke();
        const tex = new THREE.CanvasTexture(canvas);
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.5,
            map: tex,
            depthWrite: false
        });
        
        this.points = new THREE.Points(geometry, material);
        scene.add(this.points);
    }
    
    update(delta, playerPos) {
        if (playerPos.y > WATER_LEVEL + 5) {
            this.points.visible = false;
            return;
        }
        this.points.visible = true;
        
        this.points.position.x = playerPos.x;
        this.points.position.z = playerPos.z;
        
        for(let i=0; i<this.particleCount; i++) {
            let y = this.positions[i*3+1];
            y += delta * 2.0;
            
            if (y > WATER_LEVEL) {
                // reset at bottom
                let groundY = getExactHeight(playerPos.x + this.positions[i*3], playerPos.z + this.positions[i*3+2]);
                if (groundY > WATER_LEVEL - 1) {
                    y = -100; // invalid spawn, wait till player moves
                } else {
                    y = groundY + Math.random() * 2;
                }
            }
            this.positions[i*3+1] = y;
            this.positions[i*3] += Math.sin(y * 2.0 + i) * delta * 0.2;
        }
        
        this.points.geometry.attributes.position.needsUpdate = true;
    }
}

class SandManager {
    constructor(scene) {
        this.particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        
        for(let i=0; i<this.particleCount; i++) {
            this.positions[i*3] = (Math.random() - 0.5) * 80;
            this.positions[i*3+1] = Math.random() * 20 - 10; 
            this.positions[i*3+2] = (Math.random() - 0.5) * 80;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xe6caa8,
            size: 0.15,
            transparent: true,
            opacity: 0.8,
            depthWrite: false
        });
        
        this.points = new THREE.Points(geometry, material);
        scene.add(this.points);
    }
    
    update(delta, playerPos) {
        const temp = simplex.noise2D(playerPos.x * 0.0005 + 5000, playerPos.z * 0.0005 + 5000);
        const isDesert = temp > 0.5;
        
        if (!isDesert || playerPos.y < WATER_LEVEL) {
            this.points.visible = false;
            return;
        }
        this.points.visible = true;
        
        this.points.position.x = playerPos.x;
        this.points.position.z = playerPos.z;
        this.points.position.y = playerPos.y;
        
        for(let i=0; i<this.particleCount; i++) {
            let x = this.positions[i*3];
            let y = this.positions[i*3+1];
            let z = this.positions[i*3+2];
            
            x += delta * 20.0; // strong blowing wind
            y -= delta * 5.0; // gravity
            
            if (x > 40) x -= 80;
            if (y < -10) y += 30;
            
            this.positions[i*3] = x;
            this.positions[i*3+1] = y;
        }
        
        this.points.geometry.attributes.position.needsUpdate = true;
    }
}

class RainManager {
    constructor(scene) {
        this.particleCount = 2000;
        
        // A thin, long box for a rain streak
        const geometry = new THREE.BoxGeometry(0.02, 2.0, 0.02);
        const material = new THREE.MeshBasicMaterial({
            color: 0x6699ff, // Deep blue rain
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });
        
        this.mesh = new THREE.InstancedMesh(geometry, material, this.particleCount);
        this.dummy = new THREE.Object3D();
        
        // Wind rotation
        this.dummy.rotation.z = -0.1; // slight slant
        
        this.positions = new Float32Array(this.particleCount * 3);
        
        for(let i=0; i<this.particleCount; i++) {
            const x = (Math.random() - 0.5) * 80;
            const y = Math.random() * 60; 
            const z = (Math.random() - 0.5) * 80;
            
            this.positions[i*3] = x;
            this.positions[i*3+1] = y;
            this.positions[i*3+2] = z;
            
            this.dummy.position.set(x, y, z);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
        
        this.mesh.instanceMatrix.needsUpdate = true;
        scene.add(this.mesh);
    }
    
    update(delta, playerPos) {
        const temp = simplex.noise2D(playerPos.x * 0.0005 + 5000, playerPos.z * 0.0005 + 5000);
        const isTaiga = temp < -0.5;
        
        
        const intensity = window.sky ? window.sky.weatherIntensity : 0;
        if (isTaiga || playerPos.y < WATER_LEVEL || intensity <= 0.01) {
            this.mesh.visible = false;
            return;
        }
        this.mesh.visible = true;
        this.mesh.material.opacity = 0.5 * intensity;
        
        this.mesh.position.x = playerPos.x;
        this.mesh.position.z = playerPos.z;
        this.mesh.position.y = playerPos.y;
        
        for(let i=0; i<this.particleCount; i++) {
            // Speed of falling
            const fallSpeed = delta * 40.0;
            const windSpeed = delta * (40.0 * Math.tan(0.1)); // matches rotation
            
            this.positions[i*3+1] -= fallSpeed;
            this.positions[i*3] -= windSpeed;
            
            if (this.positions[i*3+1] < -10) {
                this.positions[i*3] = (Math.random() - 0.5) * 80;
                this.positions[i*3+1] = 40 + Math.random() * 20;
                this.positions[i*3+2] = (Math.random() - 0.5) * 80;
            }
            
            this.dummy.position.set(this.positions[i*3], this.positions[i*3+1], this.positions[i*3+2]);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }
}

class SnowManager {
    constructor(scene) {
        this.particleCount = 10000;
        const geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        
        for(let i=0; i<this.particleCount; i++) {
            this.positions[i*3] = (Math.random() - 0.5) * 80;
            this.positions[i*3+1] = Math.random() * 60; 
            this.positions[i*3+2] = (Math.random() - 0.5) * 80;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        context.beginPath();
        context.arc(16, 16, 12, 0, Math.PI * 2);
        context.fillStyle = 'white';
        context.fill();
        const tex = new THREE.CanvasTexture(canvas);
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.4,
            alphaTest: 0.1,
            transparent: true,
            opacity: 0.8,
            map: tex,
            depthWrite: false
        });
        
        this.points = new THREE.Points(geometry, material);
        scene.add(this.points);
    }
    
    update(delta, playerPos) {
        const temp = simplex.noise2D(playerPos.x * 0.0005 + 5000, playerPos.z * 0.0005 + 5000);
        const isTaiga = temp < -0.5;
        
        
        const intensity = window.sky ? window.sky.weatherIntensity : 0;
        
        if (!isTaiga || playerPos.y < WATER_LEVEL || intensity <= 0.01) {
            this.points.visible = false;
            return;
        }
        this.points.visible = true;
        this.points.material.opacity = 0.8 * intensity;
        
        this.points.position.x = playerPos.x;
        this.points.position.z = playerPos.z;
        this.points.position.y = playerPos.y;
        
        const isBlizzard = intensity > 0.7;
        
        for(let i=0; i<this.particleCount; i++) {
            let x = this.positions[i*3];
            let y = this.positions[i*3+1];
            let z = this.positions[i*3+2];
            
            if (isBlizzard) {
                // Horizontal blowing snow
                y -= delta * (10.0 + Math.random() * 5);
                x -= delta * 30.0;
            } else {
                // Gentle snowfall
                y -= delta * (2.0 + Math.random());
                x += Math.sin(y * 0.5 + i) * delta * 0.5;
            }
            
            if (y < -30 || x < -40) {
                y += 60;
                x = (Math.random() - 0.5) * 80;
                if (isBlizzard) x += 40; // spawn further right to blow left
                z = (Math.random() - 0.5) * 80;
            }
            
            this.positions[i*3] = x;
            this.positions[i*3+1] = y;
            this.positions[i*3+2] = z;
        }
        
        this.points.geometry.attributes.position.needsUpdate = true;
    }
}

class TumbleweedManager {
    constructor(scene) {
        this.tumbleweeds = [];
        this.scene = scene;
        
        const mat = new THREE.MeshStandardMaterial({
            color: 0x8b7355, 
            flatShading: true,
            transparent: true,
            opacity: 1.0,
            wireframe: true // looks like a tangle of sticks!
        });
        
        for (let i = 0; i < 5; i++) {
            // Icosahedron with wireframe looks very tumbleweed-y
            const geo = new THREE.IcosahedronGeometry(0.8, 1);
            const mesh = new THREE.Mesh(geo, mat.clone());
            mesh.castShadow = true;
            mesh.visible = false;
            this.scene.add(mesh);
            
            this.tumbleweeds.push({
                mesh: mesh,
                active: false,
                vx: 0,
                vz: 0,
                life: 0
            });
        }
    }
    
    update(delta, playerPos) {
        const temp = simplex.noise2D(playerPos.x * 0.0005 + 5000, playerPos.z * 0.0005 + 5000);
        const playerInDesert = temp > 0.5;
        
        for (let t of this.tumbleweeds) {
            if (!t.active) {
                if (playerInDesert && Math.random() < 0.005) { // rare spawn
                    t.active = true;
                    // Spawn upwind
                    t.mesh.position.set(
                        playerPos.x - 40 - Math.random() * 20,
                        0,
                        playerPos.z + (Math.random() - 0.5) * 40
                    );
                    t.mesh.material.opacity = 1;
                    t.mesh.visible = true;
                    t.vx = 8 + Math.random() * 4; // roll fast
                    t.vz = (Math.random() - 0.5) * 2;
                    t.life = 1.0;
                }
            } else {
                t.mesh.position.x += t.vx * delta;
                t.mesh.position.z += t.vz * delta;
                
                // Roll rotation
                t.mesh.rotation.z -= t.vx * delta * 1.2;
                t.mesh.rotation.x += t.vz * delta * 1.2;
                
                const groundY = getExactHeight(t.mesh.position.x, t.mesh.position.z);
                
                // Bounce slightly based on terrain
                const targetY = groundY + 0.8;
                t.mesh.position.y += (targetY - t.mesh.position.y) * 10 * delta;
                
                // Check biome of current position
                const currentTemp = simplex.noise2D(t.mesh.position.x * 0.0005 + 5000, t.mesh.position.z * 0.0005 + 5000);
                const inDesert = currentTemp > 0.5;
                const inWater = groundY < WATER_LEVEL;
                
                if (!inDesert || inWater) {
                    // fade out
                    t.mesh.material.opacity -= delta * 0.5;
                    if (t.mesh.material.opacity <= 0) {
                        t.active = false;
                        t.mesh.visible = false;
                    }
                } else if (t.mesh.position.distanceTo(playerPos) > 100) {
                    t.active = false;
                    t.mesh.visible = false;
                }
            }
        }
    }
}

class ButterflyManager {
    constructor(scene) {
        this.butterflies = [];
        this.scene = scene;
        
        const colors = [0xff5555, 0x5555ff, 0xffff55, 0xffaa00];
        
        for (let i = 0; i < 12; i++) {
            const geo = new THREE.PlaneGeometry(0.2, 0.2);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length], 
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            this.scene.add(mesh);
            
            this.butterflies.push({
                mesh: mesh,
                active: false,
                target: new THREE.Vector3(),
                time: Math.random() * 100
            });
        }
    }
    
    update(delta, playerPos) {
        const temp = simplex.noise2D(playerPos.x * 0.0005 + 5000, playerPos.z * 0.0005 + 5000);
        // Forest is Grass biome (temp between -0.15 and 0.15 roughly)
        const isForest = temp > -0.5 && temp < 0.5;
        
        for (let b of this.butterflies) {
            if (!b.active) {
                if (isForest && Math.random() < 0.05) {
                    b.active = true;
                    b.mesh.position.set(
                        playerPos.x + (Math.random() - 0.5) * 20,
                        playerPos.y + (Math.random() - 0.5) * 5,
                        playerPos.z + (Math.random() - 0.5) * 20
                    );
                    b.mesh.visible = true;
                    b.target.copy(b.mesh.position);
                }
            } else {
                b.time += delta * 5.0;
                
                // Check if still in forest
                const currentTemp = simplex.noise2D(b.mesh.position.x * 0.0005 + 5000, b.mesh.position.z * 0.0005 + 5000);
                const groundY = getExactHeight(b.mesh.position.x, b.mesh.position.z);
                
                if (currentTemp <= -0.33 || currentTemp >= 0.33 || groundY < WATER_LEVEL || b.mesh.position.distanceTo(playerPos) > 30) {
                    b.active = false;
                    b.mesh.visible = false;
                    continue;
                }
                
                // Wander target
                if (Math.random() < 0.05) {
                    b.target.set(
                        b.mesh.position.x + (Math.random() - 0.5) * 10,
                        groundY + 1.0 + Math.random() * 2.0,
                        b.mesh.position.z + (Math.random() - 0.5) * 10
                    );
                }
                
                // Move towards target
                b.mesh.position.lerp(b.target, delta * 1.5);
                
                // Flutter
                b.mesh.position.y += Math.sin(b.time * 2.0) * delta * 1.0;
                b.mesh.position.x += Math.cos(b.time * 1.5) * delta * 1.0;
                b.mesh.position.z += Math.sin(b.time * 1.2) * delta * 1.0;
                
                // Flap wings (rotate back and forth)
                b.mesh.rotation.x = Math.sin(b.time * 10.0) * 0.5;
                
                // Look forward (roughly)
                b.mesh.lookAt(b.target);
            }
        }
    }
}

class BirdManager {
    constructor(scene) {
        this.birds = [];
        this.scene = scene;
        
        for (let i = 0; i < 8; i++) {
            // Low poly bird shape (V shape)
            const geo = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                0, 0, 0.4,   // nose
                -0.4, 0, -0.2, // left wing
                0, 0, 0,     // tail
                
                0, 0, 0.4,   // nose
                0, 0, 0,     // tail
                0.4, 0, -0.2   // right wing
            ]);
            geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geo.computeVertexNormals();
            
            const mat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            this.scene.add(mesh);
            
            this.birds.push({
                mesh: mesh,
                active: false,
                vx: 0,
                vz: 0,
                flapTime: Math.random() * 100
            });
        }
    }
    
    update(delta, playerPos) {
        const temp = simplex.noise2D(playerPos.x * 0.0005 + 5000, playerPos.z * 0.0005 + 5000);
        const isForest = temp > -0.5 && temp < 0.5;
        
        for (let b of this.birds) {
            if (!b.active) {
                if (isForest && Math.random() < 0.01) {
                    b.active = true;
                    // Spawn high up and slightly away
                    b.mesh.position.set(
                        playerPos.x + (Math.random() - 0.5) * 100,
                        playerPos.y + 20 + Math.random() * 15,
                        playerPos.z + (Math.random() - 0.5) * 100
                    );
                    b.mesh.visible = true;
                    
                    const angle = Math.random() * Math.PI * 2;
                    b.vx = Math.cos(angle) * 8;
                    b.vz = Math.sin(angle) * 8;
                    b.mesh.rotation.y = -angle + Math.PI/2;
                }
            } else {
                b.mesh.position.x += b.vx * delta;
                b.mesh.position.z += b.vz * delta;
                
                b.flapTime += delta * 15.0;
                
                // Flap wings up and down (animate vertices)
                const positions = b.mesh.geometry.attributes.position.array;
                const flap = Math.sin(b.flapTime) * 0.2;
                positions[4] = flap; // left wing y
                positions[16] = flap; // right wing y
                b.mesh.geometry.attributes.position.needsUpdate = true;
                
                if (b.mesh.position.distanceTo(playerPos) > 150) {
                    b.active = false;
                    b.mesh.visible = false;
                }
            }
        }
    }
}
