/**
 * 3x3 Solver Wrapper using cubejs
 */

function solve3x3(moveHistory, method, cube3D) {
    if (!window.Cube) return ["Error: CubeJS not loaded"];
    
    // cubejs requires solver initialization
    if (!Cube._initialized) {
        Cube.initSolver();
        Cube._initialized = true;
    }

    let stateStr = cube3D.getStateString();
    if (!stateStr) return ["Error: invalid state"];
    let cube = Cube.fromString(stateStr);

    if (cube.isSolved()) return [];

    let optimalSolve = cube.solve().split(' ').filter(x => x);

    if (method === 'cfop') {
        if (window.getCFOPSolution) {
            let cfop = window.getCFOPSolution(cube.asString());
            if (cfop) return cfop;
            else return ["[CFOP Failed, falling back to Optimal]", ...optimalSolve];
        } else {
            return ["[CFOP Loading...]", ...optimalSolve];
        }
    } else {
        return optimalSolve;
    }
}
