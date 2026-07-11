/**
 * 3x3 Solver Wrapper using cubejs
 */

function toCubeJsMove(move) {
    const wideMove = /^([URFDLB])w([2']?)$/.exec(move);
    return wideMove ? wideMove[1].toLowerCase() + wideMove[2] : move;
}

function invertMove(move) {
    if (move.endsWith("'")) return move.slice(0, -1);
    if (move.endsWith('2')) return move;
    return move + "'";
}

function simplifySequence(sequence) {
    const result = [];
    const turns = { '': 1, '2': 2, "'": 3 };

    for (const move of sequence) {
        const base = move[0];
        const suffix = move.slice(1);
        const previous = result[result.length - 1];

        if (previous && previous[0] === base) {
            const total = (turns[previous.slice(1)] + turns[suffix]) % 4;
            result.pop();
            if (total) result.push(base + (total === 1 ? '' : total === 2 ? '2' : "'"));
        } else {
            result.push(move);
        }
    }

    return result;
}

function solve3x3(moveHistory, method) {
    if (!window.Cube) throw new Error('CubeJS not loaded');

    if (!Cube._initialized) {
        Cube.initSolver();
        Cube._initialized = true;
    }

    // Use the recorded moves instead of reading the animated meshes. This
    // remains correct while moves are queued and avoids floating-point drift.
    const cube = new Cube();
    try {
        cube.move(moveHistory.map(toCubeJsMove).join(' '));
    } catch (error) {
        console.error('3x3 move history error:', error);
        throw new Error('Invalid 3x3 move history');
    }

    if (cube.isSolved()) return [];

    const solverSolution = cube.solve().split(' ').filter(Boolean);
    const reverseHistorySolution = simplifySequence(
        moveHistory.map(toCubeJsMove).reverse().map(invertMove)
    );
    const shortestFound = reverseHistorySolution.length <= solverSolution.length
        ? reverseHistorySolution
        : solverSolution;

    if (method === 'cfop' && window.getCFOPSolution) {
        const cfop = window.getCFOPSolution(cube.asString());
        if (Array.isArray(cfop) && cfop.length > 0) {
            try {
                const verificationCube = cube.clone();
                verificationCube.move(cfop.map(toCubeJsMove).join(' '));
                if (verificationCube.isSolved()) return cfop;
            } catch (error) {
                console.warn('CFOP solution could not be verified:', error);
            }
        }
        return ["[CFOP unavailable; using a short solution]", ...shortestFound];
    }

    return shortestFound;
}
