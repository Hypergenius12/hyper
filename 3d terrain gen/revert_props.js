const fs = require('fs');
let code = fs.readFileSync('js/props.js', 'utf8');

code = code.replace(
    /let geo = child\.geometry\.clone\(\);\n\s*if \(geo\.index\) geo = geo\.toNonIndexed\(\);\n\s*\/\/ Ensure UVs exist so merge doesn't fail\n\s*if \(!geo\.attributes\.uv\) \{\n\s*const uvArray = new Float32Array\(\(geo\.attributes\.position\.count\) \* 2\);\n\s*geo\.setAttribute\('uv', new THREE\.BufferAttribute\(uvArray, 2\)\);\n\s*\}/g,
    'let geo = child.geometry.clone();\n            if (geo.index) geo = geo.toNonIndexed();\n            if (!geo.attributes.uv) { const uvArray = new Float32Array((geo.attributes.position.count) * 2); geo.setAttribute("uv", new THREE.BufferAttribute(uvArray, 2)); }'
);
fs.writeFileSync('js/props.js', code);
