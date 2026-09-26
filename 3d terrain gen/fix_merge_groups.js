const fs = require('fs');
let code = fs.readFileSync('js/props.js', 'utf8');

// Replace the Map grouping by material to group by a signature instead
const oldCode = `    const geometriesByMaterial = new Map();
    tempGroup.updateMatrixWorld(true);
    
    tempGroup.traverse((child) => {
        if (child.isMesh) {
            if (!geometriesByMaterial.has(child.material)) {
                geometriesByMaterial.set(child.material, []);
            }
            let geo = child.geometry.clone();
            if (geo.index) geo = geo.toNonIndexed();
            geo.applyMatrix4(child.matrixWorld);
            geometriesByMaterial.get(child.material).push(geo);
        }
    });
    
    const chunkProps = new THREE.Group();
    for (const [mat, geos] of geometriesByMaterial.entries()) {`;

const newCode = `    const geometriesByMaterial = new Map();
    tempGroup.updateMatrixWorld(true);
    
    tempGroup.traverse((child) => {
        if (child.isMesh) {
            let geo = child.geometry.clone();
            if (geo.index) geo = geo.toNonIndexed();
            geo.applyMatrix4(child.matrixWorld);
            
            // Create a unique key for the material + attribute signature
            let sig = child.material.uuid + (geo.attributes.uv ? "_uv" : "_nouv") + (geo.attributes.normal ? "_norm" : "_nonorm");
            
            if (!geometriesByMaterial.has(sig)) {
                geometriesByMaterial.set(sig, {mat: child.material, geos: []});
            }
            geometriesByMaterial.get(sig).geos.push(geo);
        }
    });
    
    const chunkProps = new THREE.Group();
    for (const [sig, data] of geometriesByMaterial.entries()) {
        const mat = data.mat;
        const geos = data.geos;`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('js/props.js', code);
