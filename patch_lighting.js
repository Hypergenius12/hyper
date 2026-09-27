const fs = require('fs');

let sysJs = fs.readFileSync('slopcraft 3D/js/systems.js', 'utf8');

// Lower Torch Intensity
sysJs = sysJs.replace(/light\.intensity = 20\.0 \* \(1 \+ flicker\);/, 'light.intensity = 8.0 * (1 + flicker);');

// Adjust LightingSystem day/night values to prevent blowout without ToneMapping
sysJs = sysJs.replace(/{ t: 0\.0, amb: new THREE\.Color\(0x666677\), bg: new THREE\.Color\(0x181822\), top: new THREE\.Color\(0x11111c\), sun: 0\.0, moon: 0\.6, hemi: 0\.7 }/g, 
'{ t: 0.0, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.4, hemi: 0.4 }');
sysJs = sysJs.replace(/{ t: 0\.2, amb: new THREE\.Color\(0x666677\), bg: new THREE\.Color\(0x181822\), top: new THREE\.Color\(0x11111c\), sun: 0\.0, moon: 0\.6, hemi: 0\.7 }/, 
'{ t: 0.2, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.4, hemi: 0.4 }');

sysJs = sysJs.replace(/{ t: 0\.25, amb: new THREE\.Color\(0x8a6b52\), bg: new THREE\.Color\(0xffa65a\), top: new THREE\.Color\(0x82a6ff\), sun: 0\.8, moon: 0\.2, hemi: 0\.8 }/, 
'{ t: 0.25, amb: new THREE.Color(0x8a6b52), bg: new THREE.Color(0xffa65a), top: new THREE.Color(0x82a6ff), sun: 0.6, moon: 0.1, hemi: 0.6 }');

sysJs = sysJs.replace(/{ t: 0\.3, amb: new THREE\.Color\(0xdddddd\), bg: new THREE\.Color\(0xcceeff\), top: new THREE\.Color\(0x88ccff\), sun: 1\.5, moon: 0\.0, hemi: 1\.2 }/, 
'{ t: 0.3, amb: new THREE.Color(0xdddddd), bg: new THREE.Color(0xcceeff), top: new THREE.Color(0x88ccff), sun: 0.8, moon: 0.0, hemi: 0.85 }');
sysJs = sysJs.replace(/{ t: 0\.7, amb: new THREE\.Color\(0xdddddd\), bg: new THREE\.Color\(0xcceeff\), top: new THREE\.Color\(0x88ccff\), sun: 1\.5, moon: 0\.0, hemi: 1\.2 }/, 
'{ t: 0.7, amb: new THREE.Color(0xdddddd), bg: new THREE.Color(0xcceeff), top: new THREE.Color(0x88ccff), sun: 0.8, moon: 0.0, hemi: 0.85 }');

sysJs = sysJs.replace(/{ t: 0\.75, amb: new THREE\.Color\(0x8a5050\), bg: new THREE\.Color\(0xff5a5a\), top: new THREE\.Color\(0x5a82f2\), sun: 0\.8, moon: 0\.2, hemi: 0\.8 }/, 
'{ t: 0.75, amb: new THREE.Color(0x8a5050), bg: new THREE.Color(0xff5a5a), top: new THREE.Color(0x5a82f2), sun: 0.6, moon: 0.1, hemi: 0.6 }');

sysJs = sysJs.replace(/{ t: 0\.8, amb: new THREE\.Color\(0x666677\), bg: new THREE\.Color\(0x181822\), top: new THREE\.Color\(0x11111c\), sun: 0\.0, moon: 0\.6, hemi: 0\.7 }/, 
'{ t: 0.8, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.4, hemi: 0.4 }');
sysJs = sysJs.replace(/{ t: 1\.0, amb: new THREE\.Color\(0x666677\), bg: new THREE\.Color\(0x181822\), top: new THREE\.Color\(0x11111c\), sun: 0\.0, moon: 0\.6, hemi: 0\.7 }/, 
'{ t: 1.0, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.4, hemi: 0.4 }');

fs.writeFileSync('slopcraft 3D/js/systems.js', sysJs);

let engJs = fs.readFileSync('slopcraft 3D/js/engine.js', 'utf8');

// Remove shininess and specular to make blocks perfectly matte (like Minecraft)
engJs = engJs.replace(/shininess: 5,\s*specular: new THREE\.Color\(0x111111\)/g, 'shininess: 0, specular: new THREE.Color(0x000000)');
engJs = engJs.replace(/shininess: 5,\s*specular: new THREE\.Color\(0x333333\)/g, 'shininess: 0, specular: new THREE.Color(0x000000)');
engJs = engJs.replace(/shininess: 5/g, 'shininess: 0');

fs.writeFileSync('slopcraft 3D/js/engine.js', engJs);
