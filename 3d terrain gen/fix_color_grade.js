const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

const setupOld = `    // Bloom
    if (THREE.UnrealBloomPass) {`;

const setupNew = `    // Custom Color Grading (Acts as tone mapping)
    if (typeof ColorGradeShader !== 'undefined') {
        const gradePass = new THREE.ShaderPass(ColorGradeShader);
        composer.addPass(gradePass);
    }
    
    // Bloom
    if (THREE.UnrealBloomPass) {`;

if (code.includes(setupOld)) {
    code = code.replace(setupOld, setupNew);
    fs.writeFileSync('js/main.js', code);
}

