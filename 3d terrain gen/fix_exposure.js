const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

if (!html.includes('GammaCorrectionShader')) {
    html = html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\/shaders\/CopyShader\.js"><\/script>/, 
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>\n    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/GammaCorrectionShader.js"></script>');
    fs.writeFileSync('index.html', html);
}

let main = fs.readFileSync('js/main.js', 'utf8');

const setupOld = `    // Bloom
    if (THREE.UnrealBloomPass) {
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.15, // strength
            0.4, // radius
            0.85 // threshold
        );
        composer.addPass(bloomPass);
    }`;

const setupNew = `    // Bloom
    if (THREE.UnrealBloomPass) {
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.15, // strength
            0.4, // radius
            0.85 // threshold
        );
        composer.addPass(bloomPass);
    }
    
    // Fix the "super exposed" look by applying tone mapping and sRGB conversion
    if (THREE.GammaCorrectionShader) {
        const gammaPass = new THREE.ShaderPass(THREE.GammaCorrectionShader);
        composer.addPass(gammaPass);
    }`;

if (main.includes(setupOld)) {
    main = main.replace(setupOld, setupNew);
    fs.writeFileSync('js/main.js', main);
}

