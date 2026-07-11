const fs = require('fs');
const vm = require('vm');

vm.runInThisContext(
    `${fs.readFileSync('./js/pyraminx.js', 'utf8')}\nglobalThis.PyraminxForTest = Pyraminx;`
);

function invert(move) {
    return move.endsWith("'") ? move[0] : `${move}'`;
}

for (const move of ['U', 'L', 'R', 'B']) {
    const puzzle = new global.PyraminxForTest(null);
    puzzle.applyMove(move);
    puzzle.applyMove(move);
    puzzle.applyMove(move);
    if (!puzzle.isSolved()) throw new Error(`${move} does not cycle back to solved`);
}

const scramble = ['U', "L'", 'R', 'B', "U'", 'L', "R'"];
const puzzle = new global.PyraminxForTest(null);
scramble.forEach(move => puzzle.applyMove(move));
scramble.slice().reverse().map(invert).forEach(move => puzzle.applyMove(move));

if (!puzzle.isSolved()) throw new Error('Pyraminx solution did not restore the puzzle');
console.log('Pyraminx scramble and inverse solution: valid');
