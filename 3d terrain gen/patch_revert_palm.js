const fs = require('fs');
let lines = fs.readFileSync('js/props.js', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('topPivot.position.y = segH * 0.7; // Embed in trunk'));
const endIdx = lines.findIndex(l => l.includes('        leaf.rotation.x = 0.4 + Math.random() * 0.2; // angle upward at base')) + 3;

if (startIdx > -1) {
    const orig = `    topPivot.position.y = segH;
    currentObject.add(topPivot);
    
    const numLeaves = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numLeaves; i++) {
        // Less blocky leaf: PlaneGeometry with tapered shape
        const leafGeo = new THREE.PlaneGeometry(3.0, 1.2, 4, 1);
        leafGeo.rotateX(-Math.PI / 2);
        leafGeo.translate(1.5, 0, 0); // hinge
        
        const positions = leafGeo.attributes.position.array;
        for (let j = 0; j < positions.length; j += 3) {
            const lx = positions[j];
            const lz = positions[j+2];
            // Taper width based on length
            const taper = 1.0 - Math.abs((lx - 1.5) / 1.5); 
            positions[j+2] = lz * taper; 
            // Curve down
            positions[j+1] -= (lx * lx) * 0.15;
        }
        leafGeo.computeVertexNormals();
        
        const leaf = new THREE.Mesh(leafGeo, window.PropMaterials.palmLeaf);
        // Ensure double sided material for planes
        window.PropMaterials.palmLeaf.side = THREE.DoubleSide;
        
        leaf.rotation.y = (Math.PI * 2 / numLeaves) * i + Math.random() * 0.2;
        leaf.rotation.z = 0.4 + Math.random() * 0.2; // angle upward slightly at base
        
        topPivot.add(leaf);
    }`;
    lines.splice(startIdx, endIdx - startIdx, ...orig.split('\n'));
}
fs.writeFileSync('js/props.js', lines.join('\n'));
