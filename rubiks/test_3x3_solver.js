const fs = require('fs');
const vm = require('vm');
const Cube = require('./js/cubejs.js');

const context = { Cube, console };
context.window = context;

vm.runInNewContext(fs.readFileSync('./js/solve.js', 'utf8'), context);
vm.runInNewContext(fs.readFileSync('./js/solver3x3.js', 'utf8'), context);

for (const [wideMove, expected] of [['Rw', 'r'], ['dw', 'd'], ["Fw'", "f'"]]) {
    if (context.toCubeJsMove(wideMove) !== expected) {
        throw new Error(`Wide move conversion failed for ${wideMove}`);
    }
}

for (const history of [['R', 'U'], ['M', 'E', 'S'], ["R", 'U', "R'", "U'"]]) {
    const solution = context.solve3x3(history, 'optimal');
    const verificationCube = new Cube().move(history.join(' '));
    verificationCube.move(solution.join(' '));

    if (!verificationCube.isSolved()) {
        throw new Error(`Failed to solve: ${history.join(' ')}`);
    }

    if (solution.length > history.length) {
        throw new Error(`Returned an unnecessarily long solution for: ${history.join(' ')}`);
    }

    console.log(`${history.join(' ')} -> ${solution.join(' ')}`);
}

for (const history of [['R', 'Ui', "F'", 'L2i'], ['Ri', 'D2', 'Bi', "U'"]]) {
    const solution = context.solveByHistory(history);
    const combined = context.simplifySequence([...history, ...solution]);

    if (combined.length !== 0) {
        throw new Error(`History solution did not reverse: ${history.join(' ')}`);
    }

    console.log(`${history.join(' ')} -> ${solution.join(' ')}`);
}

const sixBySixHistory = ['R', 'Ri', 'R2i', 'U2', 'Ui', 'U2i', 'F', 'F2i', 'D', "Li'", 'B2'];
const sixBySixSolution = context.solveByHistory(sixBySixHistory);
if (context.simplifySequence([...sixBySixHistory, ...sixBySixSolution]).length !== 0) {
    throw new Error('6x6 solution did not reverse every inner layer');
}
console.log(`6x6 replay -> ${sixBySixSolution.join(' ')}`);
