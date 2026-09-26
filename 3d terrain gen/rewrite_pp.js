const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const newSetup = `
function setupPostProcessing() {
    composer = new POSTPROCESSING.EffectComposer(renderer);
    
    const renderPass = new POSTPROCESSING.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Bloom
    const bloomEffect = new POSTPROCESSING.BloomEffect({
        luminanceThreshold: 0.85,
        luminanceSmoothing: 0.1,
        intensity: 2.0,
        radius: 0.5
    });
    
    // God Rays
    window.godRaysEffect = new POSTPROCESSING.GodRaysEffect(camera, window.sky.sunMesh, {
        density: 0.96,
        decay: 0.93,
        weight: 0.4,
        exposure: 0.6,
        samples: 60,
        clampMax: 1.0,
        resolutionScale: 0.5
    });

    const effectPass = new POSTPROCESSING.EffectPass(camera, bloomEffect, window.godRaysEffect);
    effectPass.renderToScreen = true;
    composer.addPass(effectPass);
}
`;

code = code.replace(/function setupPostProcessing\(\) \{[\s\S]*?\}\n/g, newSetup);
fs.writeFileSync('js/main.js', code);
