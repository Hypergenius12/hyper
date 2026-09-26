const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

// 1. Remove FilmPass
code = code.replace(/const filmPass = new THREE\.FilmPass\([\s\S]*?composer\.addPass\(filmPass\);/, '');

// 2. Adjust Vignette
code = code.replace(/vignettePass\.uniforms\["offset"\]\.value = 1\.0;/, 'vignettePass.uniforms["offset"].value = 0.9;');
code = code.replace(/vignettePass\.uniforms\["darkness"\]\.value = 1\.0;/, 'vignettePass.uniforms["darkness"].value = 1.2;');

// 3. Add God Rays Shader
const godRaysCode = `
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
    vertexShader: \`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    \`,
    fragmentShader: \`
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
                vec4 sample = texture2D(tDiffuse, texCoord);
                
                // Only blur very bright pixels (sky/sun)
                float brightness = dot(sample.rgb, vec3(0.299, 0.587, 0.114));
                if (brightness > 0.8) {
                    sample *= illuminationDecay * weight;
                    color += sample;
                }
                
                illuminationDecay *= decay;
            }
            gl_FragColor = color * exposure;
        }
    \`
};
`;

if (!code.includes('GodRaysShader')) {
    code = code.replace('const ColorGradeShader = {', godRaysCode + '\nconst ColorGradeShader = {');
}

// 4. Add GodRaysPass
if (!code.includes('window.godRaysPass = new THREE.ShaderPass(GodRaysShader);')) {
    code = code.replace('const vignettePass = new THREE.ShaderPass(THREE.VignetteShader);', 
    'window.godRaysPass = new THREE.ShaderPass(GodRaysShader);\n    composer.addPass(window.godRaysPass);\n    \n    const vignettePass = new THREE.ShaderPass(THREE.VignetteShader);');
}

// 5. Add CubeCamera for reflections
if (!code.includes('window.cubeRenderTarget')) {
    code = code.replace('window.player = player = new Player(camera, renderer.domElement);',
    `window.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    window.cubeCamera = new THREE.CubeCamera(0.1, 1000, window.cubeRenderTarget);
    scene.add(window.cubeCamera);
    scene.environment = window.cubeRenderTarget.texture;
    
    window.player = player = new Player(camera, renderer.domElement);`);
}

// 6. Update God Rays & CubeCamera in animate loop
if (!code.includes('if (window.cubeCamera)')) {
    code = code.replace('sky.update(delta, player.getObject().position, player.isSwimming);',
    `sky.update(delta, player.getObject().position, player.isSwimming);
    
    if (window.windShaderParams) {
        window.windShaderParams.time.value = time * 0.001;
        window.windShaderParams.windStrength.value = 1.0 + (window.sky ? window.sky.weatherIntensity * 2.0 : 0);
    }
    
    if (window.cubeCamera && time % 3 === 0) { // Update every few frames to save perf
        window.cubeCamera.position.copy(player.getObject().position);
        window.cubeCamera.position.y += 5;
        // Temporarily hide terrain chunks to only capture sky and sun for water reflection
        const chunksToHide = [];
        scene.children.forEach(c => {
            if (c.geometry && c.geometry.type === "PlaneGeometry") {
                chunksToHide.push(c);
                c.visible = false;
            }
        });
        window.cubeCamera.update(renderer, scene);
        chunksToHide.forEach(c => c.visible = true);
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
    `);
}

// 7. Enhance underwater visuals in main.js
code = code.replace(/if \(window\.bokehPass\) \{\n\s*window\.bokehPass\.uniforms\['focus'\]\.value = 50\.0;\n\s*window\.bokehPass\.uniforms\['aperture'\]\.value = 0\.00001; \/\/ Normal gameplay\n\s*\}/g,
`if (window.bokehPass) {
            if (player.isSwimming) {
                window.bokehPass.uniforms['focus'].value = 10.0;
                window.bokehPass.uniforms['aperture'].value = 0.005; // Blurry underwater
            } else {
                window.bokehPass.uniforms['focus'].value = 50.0;
                window.bokehPass.uniforms['aperture'].value = 0.00001; // Normal gameplay
            }
        }`);

fs.writeFileSync('js/main.js', code);
