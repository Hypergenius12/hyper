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

if (!movedCoordinates(6, 'R2i', 'x').every(value => Math.abs(value - 0.51) < 0.01)) {
    throw new Error('6x6 R2i incorrectly selects the second inner layer');
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

for (const [move, coordinate] of [['R', 4.59], ['Ri', 3.57], ['R2i', 2.55], ['R3i', 1.53], ['R4i', 0.51]]) {
    const moved = movedCoordinates(10, move, 'x');
    if (moved.length !== 100 || !moved.every(value => Math.abs(value - coordinate) < 0.01)) {
        throw new Error(`10x10 layer selection failed for ${move}`);
    }
}

const parsedSize = {
    initCube() {},
    fitCameraToCube() {}
};
global.Cube3DForTest.prototype.setSize.call(parsedSize, '10x10');
if (parsedSize.gridSize !== 10) throw new Error('10x10 size parsing failed');
console.log('10x10: all layers and two-digit size parsing are valid');

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
const sixBySixMoves = ['R', 'Ri', 'R2i', 'U', 'U2i', "F2i'", 'D2', 'Li', 'B', 'B2i'];
playSequence(sixBySix, sixBySixMoves);
playSequence(sixBySix, sixBySixMoves.slice().reverse().map(invert));

sixBySix.pieces.forEach((piece, index) => {
    const original = originalPositions[index];
    if (Math.abs(piece.position.x - original.x) > 0.01 || Math.abs(piece.position.y - original.y) > 0.01 || Math.abs(piece.position.z - original.z) > 0.01) {
        throw new Error('6x6 renderer did not return to the solved lattice');
    }
});

console.log('6x6 animated scramble and inverse: valid');

const tenByTen = buildCube(10);
const tenByTenOriginal = tenByTen.pieces.map(piece => ({ ...piece.position }));
const tenByTenMoves = ['R', 'Ri', 'R2i', 'R3i', 'R4i', 'U', 'Ui', 'U2i', 'U3i', 'U4i', 'F', 'Fi', 'F2i', 'F3i', 'F4i'];
playSequence(tenByTen, tenByTenMoves);
playSequence(tenByTen, tenByTenMoves.slice().reverse().map(invert));

tenByTen.pieces.forEach((piece, index) => {
    const original = tenByTenOriginal[index];
    if (Math.abs(piece.position.x - original.x) > 0.01 || Math.abs(piece.position.y - original.y) > 0.01 || Math.abs(piece.position.z - original.z) > 0.01) {
        throw new Error('10x10 renderer did not return to the solved lattice');
    }
});

console.log('10x10 animated scramble and inverse: valid');

const solverSandbox = { console };
vm.createContext(solverSandbox);
vm.runInContext(fs.readFileSync('./js/solver3x3.js', 'utf8'), solverSandbox);

const optimizedTenByTen = buildCube(10);
const optimizedOriginal = optimizedTenByTen.pieces.map(piece => ({ ...piece.position }));
const trackedMoves = ['R', 'L', "R'", 'U', 'D', "U'", 'R2i', 'L2i', "R2i'"];
const optimizedSolution = solverSandbox.solveByHistory(trackedMoves, () => false);
playSequence(optimizedTenByTen, trackedMoves);
playSequence(optimizedTenByTen, optimizedSolution);

if (optimizedSolution.length >= trackedMoves.length) {
    throw new Error('10x10 optimizer did not shorten the tracked solution');
}
optimizedTenByTen.pieces.forEach((piece, index) => {
    const original = optimizedOriginal[index];
    if (Math.abs(piece.position.x - original.x) > 0.01 || Math.abs(piece.position.y - original.y) > 0.01 || Math.abs(piece.position.z - original.z) > 0.01) {
        throw new Error('10x10 optimized solution did not restore the solved lattice');
    }
});

console.log(`10x10 optimized replay (${trackedMoves.length} -> ${optimizedSolution.length}): valid`);
