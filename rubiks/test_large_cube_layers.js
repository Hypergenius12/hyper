const fs = require('fs');
const vm = require('vm');

global.THREE = {
    Vector3: class Vector3 {
        constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
    },
    Group: class Group {
        add() {}
    }
};

vm.runInThisContext(
    `${fs.readFileSync('./js/cube3d.js', 'utf8')}\nglobalThis.Cube3DForTest = Cube3D;`
);

function buildCube(size) {
    const cube = Object.create(global.Cube3DForTest.prototype);
    const halfSize = (size - 1) / 2;
    const step = 1.02;
    cube.gridSize = size;
    cube.scene = { add() {}, remove() {} };
    cube.animationQueue = [];
    cube.pieces = [];

    for (let x = -halfSize; x <= halfSize; x++) {
        for (let y = -halfSize; y <= halfSize; y++) {
            for (let z = -halfSize; z <= halfSize; z++) {
                cube.pieces.push({ position: { x: x * step, y: y * step, z: z * step } });
            }
        }
    }

    return cube;
}

function countMovedPieces(size, move) {
    const cube = buildCube(size);
    cube.applyMoveAnim(move);
    return cube.animationQueue[0].activeMeshes.length;
}

function movedCoordinates(size, move, axis) {
    const cube = buildCube(size);
    cube.applyMoveAnim(move);
    return cube.animationQueue[0].activeMeshes.map(piece => piece.position[axis]);
}

for (const [size, faceMove, innerMove] of [[4, 'R', 'Ri'], [5, 'U', 'Ui']]) {
    const faceCount = countMovedPieces(size, faceMove);
    const innerCount = countMovedPieces(size, innerMove);
    const expected = size * size;

    if (faceCount !== expected || innerCount !== expected) {
        throw new Error(`${size}x${size} layer selection failed for ${faceMove}/${innerMove}`);
    }

    console.log(`${size}x${size}: ${faceMove}=${faceCount}, ${innerMove}=${innerCount}`);
}

if (!movedCoordinates(4, 'Ri', 'x').every(value => Math.abs(value - 0.51) < 0.01)) {
    throw new Error('4x4 Ri incorrectly includes the outer layer');
}

if (!movedCoordinates(5, 'Ui', 'y').every(value => Math.abs(value - 1.02) < 0.01)) {
    throw new Error('5x5 Ui incorrectly includes the outer layer');
}

if (countMovedPieces(5, 'M') !== 25) {
    throw new Error('5x5 middle slice selection failed');
}

console.log('5x5: M=25');

const evenCube = buildCube(4);
for (const value of [-1.53, -0.51, 0.51, 1.53]) {
    if (Math.abs(evenCube.snapCoordinate(value) - value) > 0.01) {
        throw new Error(`4x4 snap moved a valid coordinate: ${value}`);
    }
}

console.log('4x4: half-step coordinate snapping is stable');
