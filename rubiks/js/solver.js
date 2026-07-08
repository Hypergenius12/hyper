/**
 * 2x2 Solver Engine
 */

// Convert CubeState to a unique 53-bit safe integer for fast Set/Map lookups
function stateId(cube) {
    let id = 0;
    for (let i = 0; i < 8; i++) id = (id * 8) + cube.p[i];
    for (let i = 0; i < 7; i++) id = (id * 3) + cube.o[i];
    return id;
}

const SOLVE_MOVES = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2'];
const FACE_AXIS = { 'U': 0, 'D': 0, 'R': 1, 'L': 1, 'F': 2, 'B': 2 };
const FACE_ORDER = { 'U': 0, 'D': 1, 'R': 2, 'L': 3, 'F': 4, 'B': 5 };

// Normalization logic to handle whole-cube rotations
let NORMALIZATIONS = [];

function buildNormalizations() {
    let yMove = new CubeState(); yMove.applyMove(MOVES['U']); yMove.applyMove(MOVES["D'"]);
    let xMove = new CubeState(); xMove.applyMove(MOVES['R']); xMove.applyMove(MOVES["L'"]);
    let zMove = new CubeState(); zMove.applyMove(MOVES['F']); zMove.applyMove(MOVES["B'"]);

    const Y_MAP = { 'U':'U', 'D':'D', 'R':'B', 'L':'F', 'F':'R', 'B':'L' };
    const X_MAP = { 'U':'F', 'D':'B', 'R':'R', 'L':'L', 'F':'D', 'B':'U' };
    const Z_MAP = { 'U':'L', 'D':'R', 'R':'U', 'L':'D', 'F':'F', 'B':'B' };

    function composeFaceMap(m1, m2) {
        let res = {};
        for (let f of ['U', 'D', 'R', 'L', 'F', 'B']) res[f] = m1[m2[f]];
        return res;
    }

    let queue = [{
        state: new CubeState(),
        faceMap: { 'U':'U', 'D':'D', 'R':'R', 'L':'L', 'F':'F', 'B':'B' }
    }];
    let visited = new Set();

    while (queue.length > 0) {
        let curr = queue.shift();
        let id = stateId(curr.state);
        if (!visited.has(id)) {
            visited.add(id);
            NORMALIZATIONS.push(curr);

            let ny = curr.state.clone(); ny.applyMove(yMove);
            queue.push({ state: ny, faceMap: composeFaceMap(curr.faceMap, Y_MAP) });

            let nx = curr.state.clone(); nx.applyMove(xMove);
            queue.push({ state: nx, faceMap: composeFaceMap(curr.faceMap, X_MAP) });

            let nz = curr.state.clone(); nz.applyMove(zMove);
            queue.push({ state: nz, faceMap: composeFaceMap(curr.faceMap, Z_MAP) });
        }
    }
}
buildNormalizations();

function getNormalized(cube) {
    for (let norm of NORMALIZATIONS) {
        let test = cube.clone();
        test.applyMove(norm.state);
        // Fix DBL (index 6) to index 6 with orientation 0
        if (test.p[6] === 6 && test.o[6] === 0) {
            return { normalizedState: test, faceMap: norm.faceMap };
        }
    }
    return null;
}

function mapSequence(seq, faceMap) {
    return seq.map(move => {
        if (move.startsWith('[') || move === '|') return move;
        let face = move[0];
        let suffix = move.substring(1);
        return faceMap[face] + suffix;
    });
}

// Bidirectional BFS for optimal 2x2 solving (Max 11 moves) using ONLY U, R, F
function solveOptimal(cube) {
    if (cube.isSolved()) return [];

    let norm = getNormalized(cube);
    if (!norm) return ["Error: Could not normalize cube"];

    // Check if normalized state is already solved
    if (norm.normalizedState.isSolved()) return [];

    let forwardQueue = [{ state: norm.normalizedState, path: [] }];
    let backwardQueue = [{ state: new CubeState(), path: [] }];
    
    let forwardVisited = new Map();
    let backwardVisited = new Map();
    
    forwardVisited.set(stateId(norm.normalizedState), []);
    backwardVisited.set(stateId(new CubeState()), []);

    // 2x2 God's number is 11 (half-turn metric) for U, R, F only
    let maxDepth = 6; 
    
    for (let depth = 1; depth <= maxDepth; depth++) {
        // Expand Forward
        let nextForwardQueue = [];
        for (let node of forwardQueue) {
            for (let move of SOLVE_MOVES) {
                if (node.path.length > 0) {
                    let lastFace = node.path[node.path.length - 1][0];
                    let currFace = move[0];
                    if (lastFace === currFace) continue; 
                }

                let nextState = node.state.clone();
                nextState.applyMove(MOVES[move]);
                let id = stateId(nextState);

                let newPath = [...node.path, move];
                
                if (backwardVisited.has(id)) {
                    let fullPath = [...newPath, ...invertSequence(backwardVisited.get(id))];
                    return mapSequence(fullPath, norm.faceMap);
                }

                if (!forwardVisited.has(id)) {
                    forwardVisited.set(id, newPath);
                    nextForwardQueue.push({ state: nextState, path: newPath });
                }
            }
        }
        forwardQueue = nextForwardQueue;

        // Expand Backward
        if (depth === maxDepth) break; // Don't need to expand backward on final depth

        let nextBackwardQueue = [];
        for (let node of backwardQueue) {
            for (let move of SOLVE_MOVES) {
                if (node.path.length > 0) {
                    let lastFace = node.path[node.path.length - 1][0];
                    let currFace = move[0];
                    if (lastFace === currFace) continue;
                }

                let nextState = node.state.clone();
                nextState.applyMove(MOVES[move]);
                let id = stateId(nextState);

                let newPath = [...node.path, move];

                if (forwardVisited.has(id)) {
                    let fullPath = [...forwardVisited.get(id), ...invertSequence(newPath)];
                    return mapSequence(fullPath, norm.faceMap);
                }

                if (!backwardVisited.has(id)) {
                    backwardVisited.set(id, newPath);
                    nextBackwardQueue.push({ state: nextState, path: newPath });
                }
            }
        }
        backwardQueue = nextBackwardQueue;
    }
    
    return ["Error: No solution found (Depth limit)"];
}

// Invert a sequence of moves (e.g. U R2 F' -> F R2 U')
function invertSequence(seq) {
    let inv = [];
    for (let i = seq.length - 1; i >= 0; i--) {
        let m = seq[i];
        if (m.endsWith("'")) inv.push(m[0]);
        else if (m.endsWith("2")) inv.push(m);
        else inv.push(m + "'");
    }
    return inv;
}

function solveFirstLayer(cube) {
    let isFirstLayerSolved = (state) => {
        for (let i = 4; i <= 7; i++) {
            if (state.p[i] !== i || state.o[i] !== 0) return false;
        }
        return true;
    };
    
    if (isFirstLayerSolved(cube)) return [];
    
    let forwardQueue = [{ state: cube, path: [] }];
    let visited = new Set();
    visited.add(stateId(cube));

    let maxDepth = 11; 
    
    for (let depth = 1; depth <= maxDepth; depth++) {
        let nextForwardQueue = [];
        for (let node of forwardQueue) {
            for (let move of SOLVE_MOVES) {
                if (node.path.length > 0) {
                    let lastFace = node.path[node.path.length - 1][0];
                    if (lastFace === move[0]) continue; 
                }

                let nextState = node.state.clone();
                nextState.applyMove(MOVES[move]);
                let id = stateId(nextState);

                if (isFirstLayerSolved(nextState)) {
                    return [...node.path, move];
                }

                if (!visited.has(id)) {
                    visited.add(id);
                    nextForwardQueue.push({ state: nextState, path: [...node.path, move] });
                }
            }
        }
        forwardQueue = nextForwardQueue;
    }
    return ["Error: First layer BFS failed"];
}

function solveGuided(cube) {
    let norm = getNormalized(cube);
    if (!norm) return ["Error: Could not normalize cube"];
    if (norm.normalizedState.isSolved()) return [];
    
    let path1 = solveFirstLayer(norm.normalizedState);
    if (path1[0] && path1[0].startsWith("Error")) return path1;
    
    let intermediate = norm.normalizedState.clone();
    path1.forEach(m => intermediate.applyMove(MOVES[m]));
    
    if (intermediate.isSolved()) {
        let fullPath = ["[Solve_Bottom_Layer]"].concat(path1);
        return mapSequence(fullPath, norm.faceMap);
    }
    
    let forwardQueue = [{ state: intermediate, path: [] }];
    let backwardQueue = [{ state: new CubeState(), path: [] }];
    
    let forwardVisited = new Map();
    let backwardVisited = new Map();
    
    forwardVisited.set(stateId(intermediate), []);
    backwardVisited.set(stateId(new CubeState()), []);

    let path2 = [];
    let maxDepth = 6; 
    let found = false;

    for (let depth = 1; depth <= maxDepth && !found; depth++) {
        let nextForwardQueue = [];
        for (let node of forwardQueue) {
            for (let move of SOLVE_MOVES) {
                if (node.path.length > 0) {
                    if (node.path[node.path.length - 1][0] === move[0]) continue; 
                }
                let nextState = node.state.clone();
                nextState.applyMove(MOVES[move]);
                let id = stateId(nextState);
                let newPath = [...node.path, move];
                
                if (backwardVisited.has(id)) {
                    path2 = [...newPath, ...invertSequence(backwardVisited.get(id))];
                    found = true; break;
                }
                if (!forwardVisited.has(id)) {
                    forwardVisited.set(id, newPath);
                    nextForwardQueue.push({ state: nextState, path: newPath });
                }
            }
            if (found) break;
        }
        forwardQueue = nextForwardQueue;
        if (found) break;
        if (depth === maxDepth) break;

        let nextBackwardQueue = [];
        for (let node of backwardQueue) {
            for (let move of SOLVE_MOVES) {
                if (node.path.length > 0) {
                    if (node.path[node.path.length - 1][0] === move[0]) continue;
                }
                let nextState = node.state.clone();
                nextState.applyMove(MOVES[move]);
                let id = stateId(nextState);
                let newPath = [...node.path, move];

                if (forwardVisited.has(id)) {
                    path2 = [...forwardVisited.get(id), ...invertSequence(newPath)];
                    found = true; break;
                }
                if (!backwardVisited.has(id)) {
                    backwardVisited.set(id, newPath);
                    nextBackwardQueue.push({ state: nextState, path: newPath });
                }
            }
            if (found) break;
        }
        backwardQueue = nextBackwardQueue;
    }

    if (!found) path2 = ["Error: CLL BFS failed"];
    
    let fullPath = [];
    if (path1.length > 0) {
        fullPath.push("[Solve_Bottom_Layer]");
        fullPath.push(...path1);
        fullPath.push("|");
    }
    if (path2.length > 0) {
        fullPath.push("[Solve_Top_Layer]");
        fullPath.push(...path2);
    }
    
    return mapSequence(fullPath, norm.faceMap);
}

function solveMethod(cube, method) {
    if (method === 'guided') return solveGuided(cube).join(' ');
    return solveOptimal(cube).join(' ');
}
