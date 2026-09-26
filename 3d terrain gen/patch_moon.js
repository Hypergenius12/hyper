const fs = require('fs');
let code = fs.readFileSync('js/sky.js', 'utf8');

if (!code.includes('moonMat.color.multiplyScalar')) {
    code = code.replace(/const moonMat = new THREE\.MeshBasicMaterial\(\{ color: 0xc2d1e0 \}\);/,
    'const moonMat = new THREE.MeshBasicMaterial({ color: 0xc2d1e0 });\n        moonMat.color.multiplyScalar(2.0); // Slight bloom for moon');
    fs.writeFileSync('js/sky.js', code);
}
