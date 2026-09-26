class Sky {
    constructor(scene) {
        this.scene = scene;
        this.dayDuration = 2400; // 40 minutes per cycle
        this.time = this.dayDuration * 0.20; // Start a little before midday (0.25 is midday)
        
        this.weatherTimer = 30; // Start with clear weather for 30s
        this.isPrecipitating = false;
        this.weatherIntensity = 0;
        
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x445544, 0.4);
        scene.add(this.hemiLight);
        
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.1); 
        scene.add(this.ambientLight);
        
        this.sunLight = new THREE.DirectionalLight(0xfff5b6, 1.0); 
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.bias = -0.0005;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 250;
        this.sunLight.shadow.radius = 4; // Soft fading shadows
        const d = 120;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        scene.add(this.sunLight);
        
        // Lens flare
        if (typeof THREE.Lensflare !== 'undefined') {
            const lensflare = new THREE.Lensflare();
            lensflare.addElement(new THREE.LensflareElement(Textures.flare, 700, 0, this.sunLight.color));
            lensflare.addElement(new THREE.LensflareElement(Textures.flare, 60, 0.6));
            lensflare.addElement(new THREE.LensflareElement(Textures.flare, 70, 0.7));
            lensflare.addElement(new THREE.LensflareElement(Textures.flare, 120, 0.9));
            lensflare.addElement(new THREE.LensflareElement(Textures.flare, 70, 1.0));
            this.sunLight.add(lensflare);
        }
        
        this.moonLight = new THREE.DirectionalLight(0xaaccff, 0.2);
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.width = 1024;
        this.moonLight.shadow.mapSize.height = 1024;
        this.moonLight.shadow.bias = -0.0005;
        this.moonLight.shadow.camera.near = 0.5;
        this.moonLight.shadow.camera.far = 250;
        this.moonLight.shadow.camera.left = -d;
        this.moonLight.shadow.camera.right = d;
        this.moonLight.shadow.camera.top = d;
        this.moonLight.shadow.camera.bottom = -d;
        scene.add(this.moonLight);
        
        // Stars
        const starGeo = new THREE.BufferGeometry();
        this.starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0 });
        const starVertices = [];
        for (let i = 0; i < 800; i++) {
            const r = 200;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            starVertices.push(r * Math.sin(phi) * Math.cos(theta));
            starVertices.push(r * Math.sin(phi) * Math.sin(theta));
            starVertices.push(r * Math.cos(phi));
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        this.stars = new THREE.Points(starGeo, this.starMat);
        scene.add(this.stars);

        // Moon Mesh
        const moonGeo = new THREE.IcosahedronGeometry(12, 3);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xc2d1e0 });
        moonMat.color.multiplyScalar(2.0); // Slight bloom for moon
        this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
        scene.add(this.moonMesh);
        
        // Sun Mesh
        const sunGeo = new THREE.IcosahedronGeometry(10, 3);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff5b6 });
        sunMat.color.multiplyScalar(5.0); // Make it bloom intensely
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        scene.add(this.sunMesh);
        
        this.clouds = new THREE.Group();
        this.createClouds();
        scene.add(this.clouds);
    }
    
    createClouds() {
        const cloudGeo = new THREE.IcosahedronGeometry(5, 0);
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            flatShading: true,
            transparent: true,
            opacity: 0.8,
            roughness: 1.0,
            metalness: 0.0
        });
        
        for(let i=0; i<30; i++) {
            const cloud = new THREE.Group();
            const numPuffs = 3 + Math.floor(Math.random() * 4);
            for(let j=0; j<numPuffs; j++) {
                const puff = new THREE.Mesh(cloudGeo, cloudMat);
                puff.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 8);
                puff.scale.setScalar(0.5 + Math.random());
                cloud.add(puff);
            }
            cloud.scale.setScalar(2.5 + Math.random() * 1.5); // make them massive
            cloud.position.set((Math.random() - 0.5) * 500, 120 + Math.random() * 60, (Math.random() - 0.5) * 500); // much higher in the sky
            this.clouds.add(cloud);
        }
    }
    
    update(delta, playerPos, isSwimming) {
        this.time += delta;
        const cycle = (this.time / this.dayDuration) * Math.PI * 2;
        const sunHeight = Math.sin(cycle);
        
        const sunDist = 180;
        this.sunLight.position.x = playerPos.x;
        this.sunLight.position.y = sunHeight * sunDist;
        this.sunLight.position.z = playerPos.z + Math.cos(cycle) * sunDist;
        this.sunLight.target.position.copy(playerPos);
        this.sunLight.target.updateMatrixWorld();
        
        this.moonLight.position.x = playerPos.x;
        this.moonLight.position.y = -sunHeight * sunDist;
        this.moonLight.position.z = playerPos.z - Math.cos(cycle) * sunDist;
        this.moonLight.target.position.copy(playerPos);
        this.moonLight.target.updateMatrixWorld();
        
        this.sunMesh.position.copy(this.sunLight.position);
        this.moonMesh.position.copy(this.moonLight.position);
        this.stars.position.copy(playerPos); // Stars follow player
        
        const colorDay = new THREE.Color(0x78c6ff);
        const colorSunset = new THREE.Color(0xe07b38);
        const colorNight = new THREE.Color(0x050510);
        let skyColor = new THREE.Color();
        
        if (sunHeight > 0.4) {
            skyColor.copy(colorDay);
            this.starMat.opacity = 0;
            if (!isSwimming) this.scene.fog.density = 0.004;
        } else if (sunHeight > 0) {
            const t = sunHeight / 0.4;
            skyColor.copy(colorSunset).lerp(colorDay, t);
            this.starMat.opacity = (1 - t) * 0.8;
            if (!isSwimming) this.scene.fog.density = 0.004 + (1 - t) * 0.004; // Thicker glowing fog at sunset
        } else if (sunHeight > -0.4) {
            const t = (sunHeight + 0.4) / 0.4;
            skyColor.copy(colorNight).lerp(colorSunset, t);
            this.starMat.opacity = 0.8;
            if (!isSwimming) this.scene.fog.density = 0.004 + t * 0.004; // Thicker glowing fog at sunrise
        } else {
            skyColor.copy(colorNight);
            this.starMat.opacity = 0.8;
            if (!isSwimming) this.scene.fog.density = 0.004;
        }
        
        // Weather logic
        this.weatherTimer -= delta;
        if (this.weatherTimer <= 0) {
            this.isPrecipitating = !this.isPrecipitating;
            this.weatherTimer = this.isPrecipitating ? (30 + Math.random() * 45) : (180 + Math.random() * 240);
        }
        const temp = simplex.noise2D(playerPos.x * 0.0005 + 5000, playerPos.z * 0.0005 + 5000);
        
        const isHotBiome = temp > 0.25; // Desert biome - no rain
        
        let targetIntensity = this.isPrecipitating ? 1.0 : 0.0;
        if (isHotBiome) {
            targetIntensity = 0.0;
        }
        if (this.weatherIntensity < targetIntensity) {
            this.weatherIntensity = Math.min(1.0, this.weatherIntensity + delta * 0.1);
        } else if (this.weatherIntensity > targetIntensity) {
            this.weatherIntensity = Math.max(0.0, this.weatherIntensity - delta * 0.1);
        }
        
        // Darken sky significantly during storms
        skyColor.lerp(new THREE.Color(0x334455), this.weatherIntensity * 0.6);
        this.scene.background = skyColor;
        
        if (!isSwimming) {
            this.scene.fog.color.copy(skyColor);
            // Thick rain fog
            this.scene.fog.density += this.weatherIntensity * 0.015; 
        }
        
        if (sunHeight > 0) {
            // Dim the sun and ambient light heavily during storms
            const weatherDim = 1.0 - (this.weatherIntensity * 0.7); // 70% darker during storms
            this.sunLight.intensity = Math.max(0, sunHeight) * 0.9 * weatherDim; // Brighter sun
            this.moonLight.intensity = 0;
            this.hemiLight.intensity = 0.5 * weatherDim;
            this.ambientLight.intensity = 0.5 * weatherDim;
        } else {
            this.sunLight.intensity = 0;
            this.moonLight.intensity = Math.max(0, -sunHeight) * 0.4;
            this.hemiLight.intensity = 0.15;
            this.ambientLight.intensity = 0.2;
        }
        
        // Cloud darkening
        this.clouds.children.forEach(c => {
            c.children.forEach(puff => {
                const puffBase = 1.0;
                const puffDark = 0.4;
                const val = puffBase - (this.weatherIntensity * (puffBase - puffDark));
                puff.material.color.setRGB(val, val, val);
            });
        });
        
        this.clouds.position.x += delta * 2;
        this.clouds.children.forEach(c => {
            const worldX = c.position.x + this.clouds.position.x;
            if (worldX - playerPos.x > 150) c.position.x -= 300;
        });
    }
}
