const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const newSetup = `
function setupPostProcessing() {
    // Prefer pmndrs/postprocessing if available, otherwise fall back to Three.js built‑ins.
    if (window.POSTPROCESSING || window.postprocessing) {
        const PP = window.POSTPROCESSING || window.postprocessing;
        composer = new PP.EffectComposer(renderer);
        const renderPass = new PP.RenderPass(scene, camera);
        composer.addPass(renderPass);
        // Bloom
        const bloomEffect = new PP.BloomEffect({
            luminanceThreshold: 0.85,
            luminanceSmoothing: 0.1,
            intensity: 2.0,
            radius: 0.5
        });
        // God Rays (pmndrs implementation)
        window.godRaysEffect = new PP.GodRaysEffect(camera, window.sky.sunMesh, {
            density: 0.96,
            decay: 0.93,
            weight: 0.4,
            exposure: 0.6,
            samples: 60,
            clampMax: 1.0,
            resolutionScale: 0.5
        });
        const effectPass = new PP.EffectPass(camera, bloomEffect, window.godRaysEffect);
        effectPass.renderToScreen = true;
        composer.addPass(effectPass);
    } else {
        // Fallback to the original Three.js post‑processing classes (already loaded via CDN).
        composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.6, // strength
            0.4, // radius
            0.85 // threshold
        );
        composer.addPass(bloomPass);
        // No God Rays in fallback mode.
    }
}
`;

code = code.replace(/function setupPostProcessing\([\s\S]*?\n\}/, newSetup);
fs.writeFileSync('js/main.js', code);
