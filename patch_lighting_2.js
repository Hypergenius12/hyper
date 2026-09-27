const fs = require('fs');
let sysJs = fs.readFileSync('slopcraft 3D/js/systems.js', 'utf8');

// Day
sysJs = sysJs.replace(/{ t: 0\.3, amb: new THREE\.Color\(0xdddddd\), bg: new THREE\.Color\(0xcceeff\), top: new THREE\.Color\(0x88ccff\), sun: 0\.8, moon: 0\.0, hemi: 0\.85 }/g, 
'{ t: 0.3, amb: new THREE.Color(0xdddddd), bg: new THREE.Color(0xcceeff), top: new THREE.Color(0x88ccff), sun: 0.5, moon: 0.0, hemi: 1.1 }');
sysJs = sysJs.replace(/{ t: 0\.7, amb: new THREE\.Color\(0xdddddd\), bg: new THREE\.Color\(0xcceeff\), top: new THREE\.Color\(0x88ccff\), sun: 0\.8, moon: 0\.0, hemi: 0\.85 }/g, 
'{ t: 0.7, amb: new THREE.Color(0xdddddd), bg: new THREE.Color(0xcceeff), top: new THREE.Color(0x88ccff), sun: 0.5, moon: 0.0, hemi: 1.1 }');

// Sunrise/Sunset
sysJs = sysJs.replace(/{ t: 0\.25, amb: new THREE\.Color\(0x8a6b52\), bg: new THREE\.Color\(0xffa65a\), top: new THREE\.Color\(0x82a6ff\), sun: 0\.6, moon: 0\.1, hemi: 0\.6 }/g, 
'{ t: 0.25, amb: new THREE.Color(0x8a6b52), bg: new THREE.Color(0xffa65a), top: new THREE.Color(0x82a6ff), sun: 0.4, moon: 0.1, hemi: 0.8 }');
sysJs = sysJs.replace(/{ t: 0\.75, amb: new THREE\.Color\(0x8a5050\), bg: new THREE\.Color\(0xff5a5a\), top: new THREE\.Color\(0x5a82f2\), sun: 0\.6, moon: 0\.1, hemi: 0\.6 }/g, 
'{ t: 0.75, amb: new THREE.Color(0x8a5050), bg: new THREE.Color(0xff5a5a), top: new THREE.Color(0x5a82f2), sun: 0.4, moon: 0.1, hemi: 0.8 }');

// Night
sysJs = sysJs.replace(/{ t: 0\.0, amb: new THREE\.Color\(0x666677\), bg: new THREE\.Color\(0x181822\), top: new THREE\.Color\(0x11111c\), sun: 0\.0, moon: 0\.4, hemi: 0\.4 }/g, 
'{ t: 0.0, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.3, hemi: 0.6 }');
sysJs = sysJs.replace(/{ t: 0\.2, amb: new THREE\.Color\(0x666677\), bg: new THREE\.Color\(0x181822\), top: new THREE\.Color\(0x11111c\), sun: 0\.0, moon: 0\.4, hemi: 0\.4 }/g, 
'{ t: 0.2, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.3, hemi: 0.6 }');
sysJs = sysJs.replace(/{ t: 0\.8, amb: new THREE\.Color\(0x666677\), bg: new THREE\.Color\(0x181822\), top: new THREE\.Color\(0x11111c\), sun: 0\.0, moon: 0\.4, hemi: 0\.4 }/g, 
'{ t: 0.8, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.3, hemi: 0.6 }');
sysJs = sysJs.replace(/{ t: 1\.0, amb: new THREE\.Color\(0x666677\), bg: new THREE\.Color\(0x181822\), top: new THREE\.Color\(0x11111c\), sun: 0\.0, moon: 0\.4, hemi: 0\.4 }/g, 
'{ t: 1.0, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.3, hemi: 0.6 }');

fs.writeFileSync('slopcraft 3D/js/systems.js', sysJs);
