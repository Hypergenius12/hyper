const fs = require('fs');
let code = fs.readFileSync('js/props.js', 'utf8');

if (!code.includes('PropMaterials.leavesCherry')) {
    // Add material
    code = code.replace(/window\.PropMaterials\.leavesTaiga = new THREE\.MeshStandardMaterial\(\{ map: Textures\.leaves, color: 0x2e4f3a, flatShading: true, transparent: false, depthWrite: true, depthTest: true \}\);/g,
    `window.PropMaterials.leavesTaiga = new THREE.MeshStandardMaterial({ map: Textures.leaves, color: 0x2e4f3a, flatShading: true, transparent: false, depthWrite: true, depthTest: true });
    window.PropMaterials.leavesCherry = new THREE.MeshStandardMaterial({ map: Textures.leavesCherry, color: 0xffffff, flatShading: true, transparent: false, depthWrite: true, depthTest: true });`);
    
    // Modify createTree to accept isCherry
    code = code.replace(/function createTree\(x, y, z, isTaiga = false\) \{/g, 'function createTree(x, y, z, isTaiga = false, isCherry = false) {');
    
    code = code.replace(/const leaf = new THREE\.Mesh\(leavesGeo, isTaiga \? window\.PropMaterials\.leavesTaiga : window\.PropMaterials\.leavesForest\);/g,
    `let mat = window.PropMaterials.leavesForest;
        if (isTaiga) mat = window.PropMaterials.leavesTaiga;
        else if (isCherry) mat = window.PropMaterials.leavesCherry;
        const leaf = new THREE.Mesh(leavesGeo, mat);`);
        
    code = code.replace(/leavesTaiga: \[\],/g, 'leavesTaiga: [],\n        leavesCherry: [],');
    
    code = code.replace(/else if \(child\.material === window\.PropMaterials\.leavesTaiga\) \{[\s\S]*?\}\n/g,
    `else if (child.material === window.PropMaterials.leavesTaiga) {
                geometries.leavesTaiga.push(geo);
            }
            else if (child.material === window.PropMaterials.leavesCherry) {
                geometries.leavesCherry.push(geo);
            }\n`);
            
    code = code.replace(/if \(geometries\.leavesTaiga\.length > 0\) \{[\s\S]*?\}\n/g,
    `if (geometries.leavesTaiga.length > 0) {
        const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries.leavesTaiga, false);
        const mesh = new THREE.Mesh(merged, window.PropMaterials.leavesTaiga);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }
    if (geometries.leavesCherry.length > 0) {
        const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries.leavesCherry, false);
        const mesh = new THREE.Mesh(merged, window.PropMaterials.leavesCherry);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }\n`);
    
    // Biome logic: Temp < -0.5 Taiga, Temp > 0.25 Desert. 
    // Let's make Cherry Blossom Biome at Temp between 0.1 and 0.25.
    code = code.replace(/const isDesert = temp > 0\.25;/g, 'const isDesert = temp > 0.25;\n        const isCherry = temp > 0.1 && temp <= 0.25;');
    
    code = code.replace(/tempGroup\.add\(createTree\(v\.x, v\.y, v\.z, isTaiga\)\);/g, 'tempGroup.add(createTree(v.x, v.y, v.z, isTaiga, isCherry));');

    fs.writeFileSync('js/props.js', code);
}
