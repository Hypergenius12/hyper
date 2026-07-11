const fs = require('fs');
const vm = require('vm');
const Cube = require('./js/cubejs.js');

const context = { Cube, console };
context.window = context;

vm.runInNewContext(fs.readFileSync('./js/solve.js', 'utf8'), context);
vm.runInNewContext(fs.readFileSync('./js/solver3x3.js', 'utf8'), context);

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
