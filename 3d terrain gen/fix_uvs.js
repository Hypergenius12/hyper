const fs = require('fs');
let code = fs.readFileSync('js/props.js', 'utf8');

// Instead of deleting UVs, let's add dummy UVs to any geometry that is missing them,
// OR if a geometry is missing normal, add normals, etc.
code = code.replace(
    'let geo = child.geometry.clone();\n            if (geo.index) geo = geo.toNonIndexed();\n            if (geo.attributes.uv) delete geo.attributes.uv;',
    `let geo = child.geometry.clone();
            if (geo.index) geo = geo.toNonIndexed();
            // Ensure UVs exist so merge doesn't fail
            if (!geo.attributes.uv) {
                const uvArray = new Float32Array((geo.attributes.position.count) * 2);
                geo.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
            }`
);

fs.writeFileSync('js/props.js', code);
