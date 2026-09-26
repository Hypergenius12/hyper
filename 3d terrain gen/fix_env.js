const fs = require('fs');

let code = fs.readFileSync('js/main.js', 'utf8');
code = code.replace(/scene\.environment = window\.cubeRenderTarget\.texture;/g, 'if (window.waterMaterial) window.waterMaterial.envMap = window.cubeRenderTarget.texture;\n    // scene.environment = window.cubeRenderTarget.texture; // Removed globally as it makes trees look transparent');
fs.writeFileSync('js/main.js', code);

// Make waterMaterial globally accessible
let waterCode = fs.readFileSync('js/water.js', 'utf8');
waterCode = waterCode.replace(/const material = new THREE\.MeshStandardMaterial/g, 'window.waterMaterial = new THREE.MeshStandardMaterial');
waterCode = waterCode.replace(/const mesh = new THREE\.Mesh\(waterGeo, material\);/g, 'const mesh = new THREE.Mesh(waterGeo, window.waterMaterial);');
fs.writeFileSync('js/water.js', waterCode);
