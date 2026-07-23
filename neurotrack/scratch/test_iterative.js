const dirs = [
    { dx: 0, dy: -1 }, // 0: Top
    { dx: 1, dy: 0 },  // 1: Right
    { dx: 0, dy: 1 },  // 2: Bottom
    { dx: -1, dy: 0 }  // 3: Left
];

const startC = 0;
const startR = 0;
const startDir = 1;

const cols = 5;
const rows = 5;
const grid = {
    '0,0': { id: 1, ports: [false, true, true, false] },
    '1,0': { id: 1, ports: [false, true, false, true] },
    '2,0': { id: 1, ports: [false, false, true, true] },
    '2,1': { id: 1, ports: [true, false, false, true] }, // go left
    '1,1': { id: 1, ports: [false, true, false, true] },
    '0,1': { id: 1, ports: [true, true, false, false] } // loop back to 0,0 
};

function getTileType(c, r) {
    if (grid[`${c},${r}`]) return grid[`${c},${r}`];
    return { id: 0, ports: [false,false,false,false] };
}

let foundPath = null;
let longestPath = [];
let currentPath = [];
let visited = new Set();
const stack = [{
    c: startC, r: startR, dir: startDir,
    phase: 0
}];

while (stack.length > 0) {
    if (foundPath) break;
    const state = stack[stack.length - 1];

    if (state.phase === 0) {
        if (currentPath.length > longestPath.length) {
            longestPath = [...currentPath];
        }

        if (state.c === startC && state.r === startR && currentPath.length > 0) {
            foundPath = [...currentPath];
            break;
        }

        const axis = state.dir % 2;
        const key = `${state.c},${state.r},${axis}`;
        if (visited.has(key)) {
            stack.pop();
            continue;
        }

        visited.add(key);
        currentPath.push({c: state.c, r: state.r});
        state.key = key;

        state.nc = state.c + dirs[state.dir].dx;
        state.nr = state.r + dirs[state.dir].dy;
        state.phase = 1;
    } 
    else if (state.phase === 1) {
        let pushedNext = false;
        if (state.nc >= 0 && state.nc < cols && state.nr >= 0 && state.nr < rows) {
            const type = getTileType(state.nc, state.nr);
            if (type.id !== 0) {
                const incomingPort = (state.dir + 2) % 4;
                if (type.ports[incomingPort]) {
                    // Ignore teleport for this basic test
                    const straightDir = (incomingPort + 2) % 4;
                    state.tryDirs = [];
                    if (type.ports[straightDir]) state.tryDirs.push(straightDir);
                    for (let i = 0; i < 4; i++) {
                        if (i !== incomingPort && i !== straightDir && type.ports[i]) {
                            state.tryDirs.push(i);
                        }
                    }
                    state.dirIndex = 0;
                    state.phase = 2; // Normal branches
                    pushedNext = true;
                }
            }
        }
        
        if (!pushedNext) {
            currentPath.pop();
            visited.delete(state.key);
            stack.pop();
        }
    } 
    else if (state.phase === 2) { 
        if (state.dirIndex < state.tryDirs.length) {
            const nextDir = state.tryDirs[state.dirIndex++];
            stack.push({
                c: state.nc, r: state.nr, dir: nextDir, phase: 0
            });
        } else {
            currentPath.pop();
            visited.delete(state.key);
            stack.pop();
        }
    } 
}

console.log("Found:", foundPath);
console.log("Longest:", longestPath);
