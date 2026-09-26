const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const newSetup = `
function setupPostProcessing() {
    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
}
`;

code = code.replace(/function setupPostProcessing\(\) \{[\s\S]*?\n\}\n/g, newSetup);
fs.writeFileSync('js/main.js', code);
