const fs = require('fs');
const vm = require('vm');

// Mock DOM
global.window = {};
global.document = { addEventListener: () => {} };

// Load code
vm.runInThisContext(fs.readFileSync('js/cubeState.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/solver.js', 'utf8'));

let c = new CubeState();
c.applySequence("U R2 F' U' R");

console.log("Scrambled state id:", stateId(c));
console.log("Optimal solve:", solveOptimal(c).join(" "));
console.log("Guided solve:", solveGuided(c).join(" "));

let c2 = new CubeState();
c2.applySequence("R U R' U R U2 R'"); // Sune
console.log("Sune Guided solve:", solveGuided(c2).join(" "));
