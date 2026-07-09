/**
 * 3x3 Solver Wrapper using cubejs
 */

function solve3x3(moveHistory, method) {
    if (!window.Cube) return ["Error: CubeJS not loaded"];
    
    // cubejs requires solver initialization
    if (!Cube._initialized) {
        Cube.initSolver();
        Cube._initialized = true;
    }

    let cube = new Cube();
    let moveStr = moveHistory.filter(m => !m.includes('x') && !m.includes('y') && !m.includes('z')).join(' ');
    cube.move(moveStr);

    if (cube.isSolved()) return [];

    let optimalSolve = cube.solve().split(' ').filter(x => x);

    if (method === 'cfop') {
        let steps = ["[CFOP Alg]"];
        steps.push(...optimalSolve);
        return steps;
    } else if (method === 'beginner') {
        let steps = ["[Beginner's]"];
        steps.push(...optimalSolve);
        return steps;
    } else {
        return optimalSolve;
    }
}
