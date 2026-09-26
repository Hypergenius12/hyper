const fs = require('fs');
let code = fs.readFileSync('js/props.js', 'utf8');

const newProps = `
function createLog(x, y, z) {
    const geo = new THREE.CylinderGeometry(0.3, 0.4, 3, 5);
    geo.rotateZ(Math.PI / 2);
    geo.rotateY(Math.random() * Math.PI);
    geo.translate(x, y + 0.3, z);
    return geo;
}

function createShrub(x, y, z, isCherry) {
    const geo = new THREE.IcosahedronGeometry(1.0 + Math.random(), 1);
    geo.translate(x, y + 0.5, z);
    return { geo, isCherry };
}
`;

if (!code.includes('function createLog')) {
    code = code.replace(/function createDeadStick\(x, y, z\) \{/, newProps + '\nfunction createDeadStick(x, y, z) {');
    
    // Add to geometries dictionary
    code = code.replace(/trunk: \[\],/g, 'trunk: [],\n        log: [],\n        shrubForest: [],\n        shrubCherry: [],');
    
    // Add to materials
    code = code.replace(/window\.PropMaterials\.trunk = new THREE\.MeshStandardMaterial/g, 'window.PropMaterials.log = new THREE.MeshStandardMaterial({ map: Textures.wood, color: 0x888888, flatShading: true });\n    window.PropMaterials.trunk = new THREE.MeshStandardMaterial');
    
    // Spawn logic
    code = code.replace(/tempGroup\.add\(createTree\(v\.x, v\.y, v\.z, isTaiga, isCherry\)\);/g, 
    `tempGroup.add(createTree(v.x, v.y, v.z, isTaiga, isCherry));
                    if (Math.random() < 0.05) {
                        const log = new THREE.Mesh(createLog(v.x + (Math.random()-0.5)*4, v.y, v.z + (Math.random()-0.5)*4), window.PropMaterials.log);
                        tempGroup.add(log);
                    }
                    if (Math.random() < 0.1) {
                        const shrubObj = createShrub(v.x + (Math.random()-0.5)*5, v.y, v.z + (Math.random()-0.5)*5, isCherry);
                        const mat = isCherry ? window.PropMaterials.leavesCherry : window.PropMaterials.leavesForest;
                        const shrub = new THREE.Mesh(shrubObj.geo, mat);
                        tempGroup.add(shrub);
                    }`);
                    
    // Merge logic
    const mergeLogic = `
            else if (child.material === window.PropMaterials.log) {
                geometries.log.push(geo);
            }
    `;
    code = code.replace(/else if \(child\.material === window\.PropMaterials\.trunk\) \{[\s\S]*?\}\n/g, 
    `else if (child.material === window.PropMaterials.trunk) {
                geometries.trunk.push(geo);
            }
            else if (child.material === window.PropMaterials.log) {
                geometries.log.push(geo);
            }\n`);
            
    code = code.replace(/if \(geometries\.trunk\.length > 0\) \{[\s\S]*?\}\n/g,
    `if (geometries.trunk.length > 0) {
        const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries.trunk, false);
        const mesh = new THREE.Mesh(merged, window.PropMaterials.trunk);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }
    if (geometries.log.length > 0) {
        const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries.log, false);
        const mesh = new THREE.Mesh(merged, window.PropMaterials.log);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }\n`);

    fs.writeFileSync('js/props.js', code);
}
