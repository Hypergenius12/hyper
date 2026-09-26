const fs = require('fs');

// 1. Player jump out of water bug
let playerCode = fs.readFileSync('js/player.js', 'utf8');
playerCode = playerCode.replace(/this\.velocity\.y \+= 10\.0 \* delta;/g, 'this.velocity.y += 10.0 * delta;\n                if (this.velocity.y > 6.0) this.velocity.y = 6.0;');
fs.writeFileSync('js/player.js', playerCode);

// 2. Water looks too dark
let waterCode = fs.readFileSync('js/water.js', 'utf8');
// Revert to original beautiful water material
waterCode = waterCode.replace(/roughness: 0\.1,\n\s*metalness: 0\.8/g, 'roughness: 0.1,\n        metalness: 0.1');
fs.writeFileSync('js/water.js', waterCode);

// 3. Underwater is too blurry & Fix the environment map entirely
let mainCode = fs.readFileSync('js/main.js', 'utf8');
// Completely disable BokehPass underwater as it's too blurry
mainCode = mainCode.replace(/window\.bokehPass\.enabled = true;\n\s*window\.bokehPass\.uniforms\['focus'\]\.value = 10\.0;\n\s*window\.bokehPass\.uniforms\['aperture'\]\.value = 0\.005; \/\/ Blurry underwater/g, 'window.bokehPass.enabled = false;');

// Remove the cubeCamera logic from animate to stop it from making things weird
mainCode = mainCode.replace(/if \(window\.cubeCamera && time % 3 === 0\) \{[\s\S]*?chunksToHide\.forEach\(c => c\.visible = true\);\n\s*\}/g, '');
fs.writeFileSync('js/main.js', mainCode);

// 4. Fix leaves transparency
// Let's ensure leaves are opaque and standard
let propsCode = fs.readFileSync('js/props.js', 'utf8');
propsCode = propsCode.replace(/color: 0xffffff, flatShading: true/g, 'color: 0xffffff, flatShading: true, transparent: false, depthWrite: true, depthTest: true');
propsCode = propsCode.replace(/color: 0x2e4f3a, flatShading: true/g, 'color: 0x2e4f3a, flatShading: true, transparent: false, depthWrite: true, depthTest: true');
fs.writeFileSync('js/props.js', propsCode);
