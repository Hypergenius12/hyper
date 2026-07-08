const fs = require('fs');
eval(fs.readFileSync('./js/cubeState.js', 'utf8'));
eval(fs.readFileSync('./js/solver.js', 'utf8'));

function runTests() {
    let cube = new CubeState();
    let scramble = "R U R' U' R' F R2 U' R' U' R U R' F'"; // T-perm (corners)
    cube.applySequence(scramble);
    console.log("Scramble:", scramble);
    console.time("Solve");
    let solution = solveOptimal(cube);
    console.timeEnd("Solve");
    console.log("Solution:", solution.join(' '));
    
    // Verify
    let test = cube.clone();
    test.applySequence(solution.join(' '));
    console.log("Is Solved?", test.isSolved());
}
runTests();
