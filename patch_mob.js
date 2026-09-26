const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/entities.js', 'utf8');

const hook = `function getMobMaterial(type) {
    if (!mobTextureCache[type]) {
        const tex = new THREE.CanvasTexture(generateMobTexture(type));`;

const newCode = `function getMobMaterial(type) {
    if (!mobTextureCache[type]) {
        let tex;
        const updateTex = (canvas) => {
            if (tex) {
                tex.image = canvas;
                tex.needsUpdate = true;
            }
        };
        const cvs = generateMobTexture(type, updateTex);
        tex = new THREE.CanvasTexture(cvs);`;

code = code.replace(hook, newCode);
fs.writeFileSync('slopcraft 3D/js/entities.js', code);
