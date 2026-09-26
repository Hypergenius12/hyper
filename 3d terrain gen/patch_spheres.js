const fs = require('fs');
let code = fs.readFileSync('js/sky.js', 'utf8');

code = code.replace(/new THREE\.IcosahedronGeometry\(12, 0\);/, 'new THREE.IcosahedronGeometry(12, 3);');
code = code.replace(/new THREE\.IcosahedronGeometry\(10, 0\);/, 'new THREE.IcosahedronGeometry(10, 3);');

fs.writeFileSync('js/sky.js', code);
