const fs = require('fs');
const vm = require('vm');
vm.runInThisContext(fs.readFileSync('./js/cubeState.js', 'utf8'));

// Generate 24 solved states
let yMove = new CubeState();
yMove.applyMove(MOVES['U']);
yMove.applyMove(MOVES["D'"]);

let xMove = new CubeState();
xMove.applyMove(MOVES['R']);
xMove.applyMove(MOVES["L'"]);

let zMove = new CubeState();
zMove.applyMove(MOVES['F']);
zMove.applyMove(MOVES["B'"]);

let solvedStates = new Set();
let queue = [new CubeState()];

function stateId(cube) {
    let id = 0;
    for (let i = 0; i < 8; i++) id = (id * 8) + cube.p[i];
    for (let i = 0; i < 7; i++) id = (id * 3) + cube.o[i];
    return id;
}

let visitedIds = new Set();
let results = [];

while(queue.length > 0) {
    let curr = queue.shift();
    let id = stateId(curr);
    if (!visitedIds.has(id)) {
        visitedIds.add(id);
        results.push(curr);
        
        let nextY = curr.clone(); nextY.applyMove(yMove);
        queue.push(nextY);
        
        let nextX = curr.clone(); nextX.applyMove(xMove);
        queue.push(nextX);
        
        let nextZ = curr.clone(); nextZ.applyMove(zMove);
        queue.push(nextZ);
    }
}

console.log("Found", results.length, "solved states!");
