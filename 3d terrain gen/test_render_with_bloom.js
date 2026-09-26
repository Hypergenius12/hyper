const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const newSetup = `
function setupPostProcessing() {
    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
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
}
`;

code = code.replace(/function setupPostProcessing\(\) \{[\s\S]*?\n\}\n/g, newSetup);
fs.writeFileSync('js/main.js', code);
