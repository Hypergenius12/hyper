/**
 * 3x3 Solver Wrapper using cubejs
 */

function toCubeJsMove(move) {
    const wideMove = /^([URFDLB])w([2']?)$/i.exec(move);
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

    const splitMove = move => {
        const suffix = move.endsWith("'") || move.endsWith('2') ? move.slice(-1) : '';
        return { key: suffix ? move.slice(0, -1) : move, suffix };
    };

    // Turns around the same physical axis commute, even when they are on
    // different layers (for example R L R' is simply L). Canonicalising each
    // uninterrupted axis run finds a shorter equivalent path than cancelling
    // only adjacent moves, without claiming to be a global large-cube solver.
    const axisByFace = {
        r: 'x', l: 'x', m: 'x', x: 'x',
        u: 'y', d: 'y', e: 'y', y: 'y',
        f: 'z', b: 'z', s: 'z', z: 'z'
    };
    const moveAxis = key => {
        const match = /[rlmudefbsxyz]/i.exec(key);
        return match ? axisByFace[match[0].toLowerCase()] : null;
    };

    const reduceAxisRun = axis => {
        let start = result.length;
        while (start > 0 && moveAxis(splitMove(result[start - 1]).key) === axis) start--;
        const run = result.splice(start);
        const order = [];
        const amounts = new Map();

        for (const move of run) {
            const { key, suffix } = splitMove(move);
            if (!amounts.has(key)) order.push(key);
            amounts.set(key, ((amounts.get(key) || 0) + turns[suffix]) % 4);
        }

        for (const key of order) {
            const total = amounts.get(key);
            if (total) result.push(key + (total === 1 ? '' : total === 2 ? '2' : "'"));
        }
    };

    for (const move of sequence) {
        result.push(move);
        const axis = moveAxis(splitMove(move).key);
        if (axis) reduceAxisRun(axis);
    }

    return result;
}

function solveByHistory(moveHistory, isVisiblySolved) {
    const inverseHistory = moveHistory.slice().reverse().map(invertMove);
    const compactSolution = simplifySequence(inverseHistory);

    // Keep the shorter, compact behavior for normal play. If an existing
    // hand-move history collapses to nothing, preserve the inverse sequence
    // instead of falsely presenting a zero-move solution.
    if (compactSolution.length > 0 || moveHistory.length === 0) return compactSolution;

    // A non-empty history reducing to zero is normally solved. Check the
    // rendered cube before showing a zero-move result; if animations were
    // interrupted and it is visibly mixed, replay the tracked inverse safely.
    return typeof isVisiblySolved === 'function' && isVisiblySolved()
        ? []
        : inverseHistory;
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
    const reverseHistorySolution = solveByHistory(moveHistory.map(toCubeJsMove));
    const shortestFound = reverseHistorySolution.length <= solverSolution.length
        ? reverseHistorySolution
        : solverSolution;

    if (method === 'cfop' && window.getCFOPSolution) {
        // CFOP requires standard centers. Find the rotation to make it upright.
        const uprightClone = cube.clone();
        const uprightMoves = uprightClone.upright();
        if (uprightMoves) uprightClone.move(uprightMoves);

        const cfop = window.getCFOPSolution(uprightClone.asString());
        if (Array.isArray(cfop) && cfop.length > 0) {
            // Prepend the upright rotation so the solution applies to the original offset cube
            const finalCfop = uprightMoves ? [...uprightMoves.split(' ').filter(Boolean), ...cfop] : cfop;
            try {
                const verificationCube = cube.clone();
                verificationCube.move(finalCfop.map(toCubeJsMove).join(' '));
                if (verificationCube.isSolved()) return finalCfop;
            } catch (error) {
                console.warn('CFOP solution could not be verified:', error);
            }
        }
        return ["[CFOP unavailable; using a short solution]", ...shortestFound];
    }

    return shortestFound;
}
