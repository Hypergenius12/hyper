const fs = require('fs');
let code = fs.readFileSync('js/props.js', 'utf8');

code = code.replace(
    'let geo = child.geometry.clone();\n            if (geo.index) geo = geo.toNonIndexed();\n            if (!geo.attributes.uv) { const uvArray = new Float32Array((geo.attributes.position.count) * 2); geo.setAttribute("uv", new THREE.BufferAttribute(uvArray, 2)); }',
    'let geo = child.geometry.clone();\n            if (geo.index) geo = geo.toNonIndexed();'
);
fs.writeFileSync('js/props.js', code);
