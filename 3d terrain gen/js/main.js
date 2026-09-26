let scene, camera, renderer, player, sky, composer;
let lastTime = performance.now();
let particles;


const GodRaysShader = {
    uniforms: {
        tDiffuse: { value: null },
        lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
        exposure: { value: 0.5 },
        decay: { value: 0.95 },
        density: { value: 0.8 },
        weight: { value: 0.3 },
        clampMax: { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 lightPosition;
        uniform float exposure;
        uniform float decay;
        uniform float density;
        uniform float weight;
        uniform float clampMax;
        varying vec2 vUv;
        
        void main() {
            vec2 texCoord = vUv;
            vec2 deltaTextCoord = texCoord - lightPosition;
            deltaTextCoord *= 1.0 / 100.0 * density;
            
            vec4 color = texture2D(tDiffuse, texCoord);
            float illuminationDecay = 1.0;
            
            for(int i=0; i < 60; i++) {
                texCoord -= deltaTextCoord;
                vec4 colorSample = texture2D(tDiffuse, texCoord);
                
                // Only blur very bright pixels (sky/sun)
                float brightness = dot(sample.rgb, vec3(0.299, 0.587, 0.114));
                if (brightness > 0.8) {
                    colorSample *= illuminationDecay * weight;
                    color += colorSample;
                }
                
                illuminationDecay *= decay;
            }
            gl_FragColor = color * exposure;
        }
    `
};

const ColorGradeShader = {
    uniforms: {
        "tDiffuse": { value: null }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            
            // Slight Contrast
            texel.rgb = (texel.rgb - 0.5) * 1.05 + 0.5;
            
            // Light Teal/Orange Shift
            float luma = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
            vec3 shadows = vec3(0.3, 0.5, 0.6); // Teal
            vec3 highlights = vec3(1.0, 0.9, 0.8); // Orange
            
            vec3 grade = mix(shadows, highlights, luma);
            texel.rgb = mix(texel.rgb, texel.rgb * grade * 1.2, 0.2); // Blend only 20%
            
            gl_FragColor = texel;
        }
    `
};






function setupPostProcessing() {
    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Custom Color Grading (Acts as tone mapping)
    if (typeof ColorGradeShader !== 'undefined') {
        const gradePass = new THREE.ShaderPass(ColorGradeShader);
        composer.addPass(gradePass);
    }
    
    // Bloom
    if (THREE.UnrealBloomPass) {
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.15, // strength
            0.4, // radius
            0.85 // threshold
        );
        composer.addPass(bloomPass);
    }
    
    // Fix the "super exposed" look by applying tone mapping and sRGB conversion
    if (THREE.GammaCorrectionShader) {
        const gammaPass = new THREE.ShaderPass(THREE.GammaCorrectionShader);
        composer.addPass(gammaPass);
    }
}


function init() {
    initTextures();
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.004); 
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); window.camera = camera;
    
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Restore ACES Filmic for the cinematic teal/orange contrast grade
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    // Prevent color banding on sky gradients and dark areas
    renderer.dithering = true;
    
    document.body.appendChild(renderer.domElement);
    
    setupPostProcessing();
    
    // Cinematic Dust Particles
    const particleCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount*3; i++) {
        positions[i] = (Math.random() - 0.5) * 400; // Spread over 400 units
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMaterial = new THREE.PointsMaterial({
        color: 0xffffee,
        size: 0.5,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    particles = new THREE.Points(geometry, pMaterial);
    scene.add(particles);
    
    window.audioManager = new AudioManager();
    window.fishManager = new FishManager(scene);
    window.bubbleManager = new BubbleManager(scene);
    window.sandManager = new SandManager(scene);
    window.snowManager = new SnowManager(scene);
    window.tumbleweedManager = new TumbleweedManager(scene);
    window.birdManager = new BirdManager(scene);
    window.butterflyManager = new ButterflyManager(scene);
    window.whaleManager = new WhaleManager(scene);
    
    window.rainManager = new RainManager(scene);
    window.petalManager = new PetalManager(scene);
    window.caveManager = new CaveManager(scene);
    
    window.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    window.cubeCamera = new THREE.CubeCamera(0.1, 1000, window.cubeRenderTarget);
    scene.add(window.cubeCamera);
    if (window.waterMaterial) window.waterMaterial.envMap = window.cubeRenderTarget.texture;
    // scene.environment = window.cubeRenderTarget.texture; // Removed globally as it makes trees look transparent
    
    window.player = player = new Player(camera, renderer.domElement);
    scene.add(player.getObject());
    
    window.sky = sky = new Sky(scene);
    
    updateWorld(player.getObject().position, scene);
    
    let hasStarted = false;
    const homeMenu = document.getElementById('home-menu');
    const pauseMenu = document.getElementById('pause-menu');
    const startBtn = document.getElementById('start-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const crosshair = document.getElementById('crosshair');
    
    startBtn.addEventListener('click', () => {
        hasStarted = true;
        document.body.requestPointerLock();
        homeMenu.style.display = 'none';
        if (window.audioManager && window.audioManager.ctx) {
            window.audioManager.ctx.resume();
        }
    });
    
    resumeBtn.addEventListener('click', () => {
        document.body.requestPointerLock();
    });
    
    document.addEventListener('pointerlockchange', () => {
        if (!hasStarted) return;
        
        if (document.pointerLockElement === document.body) {
            pauseMenu.style.display = 'none';
            crosshair.style.display = 'block';
        } else {
            pauseMenu.style.display = 'flex';
            crosshair.style.display = 'none';
        }
    });
    
    // Settings
    window.masterVolume = 0.5;
    document.getElementById('vol-slider').addEventListener('input', (e) => {
        window.masterVolume = parseFloat(e.target.value);
    });
    
    document.getElementById('dist-slider').addEventListener('input', (e) => {
        window.RENDER_DISTANCE = parseInt(e.target.value);
    });

    window.addEventListener('resize', onWindowResize, false);
    
    requestAnimationFrame(animate);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now();
    const delta = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    
    if (document.pointerLockElement === document.body) {
        player.update(delta, scene);
        updateWorld(player.getObject().position, scene);
    
    }
    sky.update(delta, player.getObject().position, player.isSwimming);
    
    if (window.windShaderParams) {
        window.windShaderParams.time.value = time * 0.001;
        window.windShaderParams.windStrength.value = 1.0 + (window.sky ? window.sky.weatherIntensity * 2.0 : 0);
    }
    
    
    
    if (window.godRaysPass && window.sky && window.sky.sunLight) {
        let sunPos = window.sky.sunLight.position.clone();
        sunPos.project(camera);
        // Only apply if sun is in front of camera
        if (sunPos.z < 1.0) {
            window.godRaysPass.uniforms.lightPosition.value.set((sunPos.x + 1) / 2, (sunPos.y + 1) / 2);
            // Fade out if looking too far away from sun
            const dist = Math.sqrt(sunPos.x*sunPos.x + sunPos.y*sunPos.y);
            let intensity = Math.max(0, 1.0 - dist * 0.5);
            // Fade out during storms or underwater
            if (player.isSwimming) intensity = 0;
            else intensity *= (1.0 - window.sky.weatherIntensity);
            
            window.godRaysPass.uniforms.exposure.value = 0.5 + intensity * 0.5;
            window.godRaysPass.uniforms.weight.value = intensity * 0.3;
        } else {
            window.godRaysPass.uniforms.weight.value = 0;
            window.godRaysPass.uniforms.exposure.value = 0.5; // Base exposure when no rays
        }
    }
    
    
    // Determine isDay from sky cycle
    const cycle = (sky.time / sky.dayDuration) * Math.PI * 2;
    const isDay = Math.sin(cycle) > 0;
    if (window.audioManager) window.audioManager.update(delta, player, isDay);
    
    if (window.fishManager) window.fishManager.update(delta, player.getObject().position);
    if (window.bubbleManager) window.bubbleManager.update(delta, player.getObject().position);
    if (window.sandManager) window.sandManager.update(delta, player.getObject().position);
    if (window.snowManager) window.snowManager.update(delta, player.getObject().position);
    if (window.rainManager) window.rainManager.update(delta, player.getObject().position);
    if (window.petalManager) window.petalManager.update(delta, player.getObject().position);
    if (window.tumbleweedManager) window.tumbleweedManager.update(delta, player.getObject().position);
    if (window.birdManager) window.birdManager.update(delta, player.getObject().position);
    if (window.butterflyManager) window.butterflyManager.update(delta, player.getObject().position);
    if (window.whaleManager) window.whaleManager.update(delta, player.getObject().position);
    if (window.caveManager) window.caveManager.checkEntrance(player.getObject().position);
    
    animateWater(time * 0.001);
    
    // Animate cinematic dust
    if (particles) {
        particles.position.y += delta * 2.0;
        particles.rotation.y += delta * 0.05;
        // Keep particles centered around player
        const pPos = player.getObject().position;
        if (particles.position.y > pPos.y + 100) particles.position.y -= 200;
        particles.position.x = pPos.x;
        particles.position.z = pPos.z;
    
    }
    if (document.pointerLockElement !== document.body) {
        const t = time * 0.0001;
        camera.position.set(Math.cos(t) * 120, 80, Math.sin(t) * 120);
        camera.lookAt(0, -20, 0);
        
         } else {
        camera.position.set(0, 0, 0);
        camera.rotation.set(0, 0, 0);
        
        
    }
    


    if (composer) {
        composer.render(delta);
    } else {
        renderer.render(scene, camera);
    }
}

init();