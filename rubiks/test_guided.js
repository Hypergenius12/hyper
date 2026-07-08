const fs = require('fs');

// Mock DOM
global.window = {};
global.document = { addEventListener: () => {} };

// Load code
eval(fs.readFileSync('js/cubeState.js', 'utf8'));
eval(fs.readFileSync('js/solver.js', 'utf8'));

let c = new CubeState();
c.applySequence("U R2 F' U' R");

console.log("Scrambled state id:", stateId(c));
console.log("Optimal solve:", solveOptimal(c).join(" "));
console.log("Guided solve:", solveGuided(c).join(" "));

let c2 = new CubeState();
c2.applySequence("R U R' U R U2 R'"); // Sune
console.log("Sune Guided solve:", solveGuided(c2).join(" "));
