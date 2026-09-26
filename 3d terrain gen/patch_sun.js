const fs = require('fs');
let code = fs.readFileSync('js/sky.js', 'utf8');

if (!code.includes('sunMat.color.multiplyScalar')) {
    code = code.replace(/const sunMat = new THREE\.MeshBasicMaterial\(\{ color: 0xfff5b6 \}\);/,
    'const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff5b6 });\n        sunMat.color.multiplyScalar(5.0); // Make it bloom intensely');
    fs.writeFileSync('js/sky.js', code);
}
