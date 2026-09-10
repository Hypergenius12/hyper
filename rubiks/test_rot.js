const THREE = require('three');

function testRot(axis, angle, x, z) {
    let v = new THREE.Vector3(x, 1, z);
    v.applyAxisAngle(axis, angle);
    console.log(`(${x}, ${z}) -> (${Math.round(v.x)}, ${Math.round(v.z)})`);
}

console.log("U move with +90 deg:");
testRot(new THREE.Vector3(0, 1, 0), Math.PI / 2, 1, 1); // URF
testRot(new THREE.Vector3(0, 1, 0), Math.PI / 2, -1, 1); // UFL
testRot(new THREE.Vector3(0, 1, 0), Math.PI / 2, -1, -1); // ULB
testRot(new THREE.Vector3(0, 1, 0), Math.PI / 2, 1, -1); // UBR
