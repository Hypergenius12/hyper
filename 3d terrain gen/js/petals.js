class PetalManager {
    constructor(scene) {
        this.scene = scene;
        this.particleCount = 500;
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        this.velocities = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            this.positions[i * 3] = (Math.random() - 0.5) * 200;
            this.positions[i * 3 + 1] = Math.random() * 50;
            this.positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            this.velocities.push({
                x: (Math.random() - 0.5) * 2,
                y: -Math.random() * 5 - 2,
                z: (Math.random() - 0.5) * 2
            });
        }
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffb7c5';
        ctx.beginPath();
        ctx.arc(8, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        const tex = new THREE.CanvasTexture(canvas);
        
        this.material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.6,
            map: tex,
            transparent: true,
            opacity: 0.8,
            depthWrite: false
        });
        
        this.points = new THREE.Points(this.geometry, this.material);
        this.points.visible = false;
        this.scene.add(this.points);
    }
    
    update(delta, playerPos) {
        // Check if player is in cherry biome
        const temp = window.getNoise(playerPos.x, playerPos.z) * 60; // Wait, getNoise returns height... 
        const t = simplex.noise2D(playerPos.x * 0.0005 + 5000, playerPos.z * 0.0005 + 5000);
        const isCherry = t > 0.1 && t <= 0.25;
        
        if (!isCherry) {
            this.points.visible = false;
            return;
        }
        
        this.points.visible = true;
        
        const posAttr = this.geometry.attributes.position;
        for (let i = 0; i < this.particleCount; i++) {
            let px = posAttr.getX(i);
            let py = posAttr.getY(i);
            let pz = posAttr.getZ(i);
            
            px += this.velocities[i].x * delta;
            py += this.velocities[i].y * delta;
            pz += this.velocities[i].z * delta;
            
            if (py < playerPos.y - 10) {
                py = playerPos.y + 30 + Math.random() * 20;
                px = playerPos.x + (Math.random() - 0.5) * 100;
                pz = playerPos.z + (Math.random() - 0.5) * 100;
            }
            
            if (px > playerPos.x + 100) px -= 200;
            if (px < playerPos.x - 100) px += 200;
            if (pz > playerPos.z + 100) pz -= 200;
            if (pz < playerPos.z - 100) pz += 200;
            
            posAttr.setXYZ(i, px, py, pz);
        }
        posAttr.needsUpdate = true;
    }
}
window.PetalManager = PetalManager;
