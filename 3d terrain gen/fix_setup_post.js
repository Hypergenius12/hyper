const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const newSetup = `
function setupPostProcessing() {
    composer = new THREE.EffectComposer(renderer);
    
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // SAO (Screen Space Ambient Occlusion)
    if (THREE.SAOPass) {
        const saoPass = new THREE.SAOPass(scene, camera, false, true);
        saoPass.params.saoBias = 0.5;
        saoPass.params.saoIntensity = 0.005; // very subtle contact shadows
        saoPass.params.saoScale = 20;
        saoPass.params.saoKernelRadius = 40;
        saoPass.params.saoMinResolution = 0;
        composer.addPass(saoPass);
    }
    
    // Color Grading
    if (typeof ColorGradeShader !== 'undefined') {
        const gradePass = new THREE.ShaderPass(ColorGradeShader);
        composer.addPass(gradePass);
    }
    
    // Bloom
    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.6, // strength
        0.4, // radius
        0.85 // threshold
    );
    composer.addPass(bloomPass);
}
`;

code = code.replace(/function setupPostProcessing\(\) \{[\s\S]*?\n\}\n/g, newSetup);
fs.writeFileSync('js/main.js', code);
