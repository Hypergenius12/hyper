const fs = require('fs');
const vm = require('vm');

global.THREE = {
    Vector3: class Vector3 {
        constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
    },
    Group: class Group {
        constructor() { this.children = []; }
        add(mesh) { this.children.push(mesh); }
        rotateOnAxis(axis, angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            for (const mesh of this.children) {
                const { x, y, z } = mesh.position;
                if (axis.x) {
                    mesh.position.y = (y * cos) - (z * sin);
                    mesh.position.z = (y * sin) + (z * cos);
                } else if (axis.y) {
                    mesh.position.x = (x * cos) + (z * sin);
                    mesh.position.z = (-x * sin) + (z * cos);
                } else {
                    mesh.position.x = (x * cos) - (y * sin);
                    mesh.position.y = (x * sin) + (y * cos);
                }
            }
        }
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
    cube.scene = { add() {}, remove() {}, attach() {} };
    cube.animationQueue = [];
    cube.animSpeed = 1;
    cube.pieces = [];

    for (let x = -halfSize; x <= halfSize; x++) {
        for (let y = -halfSize; y <= halfSize; y++) {
            for (let z = -halfSize; z <= halfSize; z++) {
                cube.pieces.push({
                    position: { x: x * step, y: y * step, z: z * step },
                    updateMatrixWorld() {}
                });
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

for (const [size, faceMove, innerMove] of [[4, 'R', 'Ri'], [5, 'U', 'Ui'], [6, 'R', 'Ri']]) {
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

if (!movedCoordinates(6, 'Ri', 'x').every(value => Math.abs(value - 1.53) < 0.01)) {
    throw new Error('6x6 Ri incorrectly selects the first inner layer');
}

if (!movedCoordinates(6, 'Ri2', 'x').every(value => Math.abs(value - 0.51) < 0.01)) {
    throw new Error('6x6 Ri2 incorrectly selects the second inner layer');
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

function invert(move) {
    if (move.endsWith("'")) return move.slice(0, -1);
    if (move.endsWith('2')) return move;
    return `${move}'`;
}

function playSequence(cube, moves) {
    for (const move of moves) {
        cube.applyMoveAnim(move);
        while (cube.animationQueue.length > 0) cube.updateAnimation();
    }
}

const sixBySix = buildCube(6);
const originalPositions = sixBySix.pieces.map(piece => ({ ...piece.position }));
const sixBySixMoves = ['R', 'Ri', 'Ri2', 'U', 'Ui2', "Fi'", 'D2', 'Li', 'B', 'Bi2'];
playSequence(sixBySix, sixBySixMoves);
playSequence(sixBySix, sixBySixMoves.slice().reverse().map(invert));

sixBySix.pieces.forEach((piece, index) => {
    const original = originalPositions[index];
    if (Math.abs(piece.position.x - original.x) > 0.01 || Math.abs(piece.position.y - original.y) > 0.01 || Math.abs(piece.position.z - original.z) > 0.01) {
        throw new Error('6x6 renderer did not return to the solved lattice');
    }
});

console.log('6x6 animated scramble and inverse: valid');
