/**
 * Abstract representation of a 2x2 Rubik's Cube.
 * 8 corners. Indexes:
 * 0: URF, 1: UFL, 2: ULB, 3: UBR
 * 4: DFR, 5: DFL, 6: DBL, 7: DBR
 */
class CubeState {
    constructor() {
        this.p = [0, 1, 2, 3, 4, 5, 6, 7]; // Permutation
        this.o = [0, 0, 0, 0, 0, 0, 0, 0]; // Orientation (0, 1, 2)
    }

    clone() {
        let c = new CubeState();
        c.p = [...this.p];
        c.o = [...this.o];
        return c;
    }

    isSolved() {
        for (let i = 0; i < 8; i++) {
            if (this.p[i] !== i || this.o[i] !== 0) return false;
        }
        return true;
    }

    applyMove(moveState) {
        let newP = new Array(8);
        let newO = new Array(8);
        for (let i = 0; i < 8; i++) {
            newP[i] = this.p[moveState.p[i]];
            newO[i] = (this.o[moveState.p[i]] + moveState.o[i]) % 3;
        }
        this.p = newP;
        this.o = newO;
    }

    applySequence(seq) {
        if (!seq) return;
        const moves = typeof seq === 'string' ? seq.split(' ') : seq;
        for (let m of moves) {
            if (m === '') continue;
            let moveObj = MOVES[m];
            if (moveObj) {
                this.applyMove(moveObj);
            }
        }
    }
}

// Base Moves
const MOVES = {};

let U = new CubeState();
U.p = [3, 0, 1, 2, 4, 5, 6, 7];
U.o = [0, 0, 0, 0, 0, 0, 0, 0];

let D = new CubeState();
D.p = [0, 1, 2, 3, 5, 6, 7, 4];
D.o = [0, 0, 0, 0, 0, 0, 0, 0];

let R = new CubeState();
R.p = [4, 1, 2, 0, 7, 5, 6, 3];
R.o = [2, 0, 0, 1, 1, 0, 0, 2];

let L = new CubeState();
L.p = [0, 2, 6, 3, 4, 1, 5, 7];
L.o = [0, 1, 2, 0, 0, 2, 1, 0];

let F = new CubeState();
F.p = [1, 5, 2, 3, 0, 4, 6, 7];
F.o = [1, 2, 0, 0, 2, 1, 0, 0];

let B = new CubeState();
B.p = [0, 1, 3, 7, 4, 5, 2, 6];
B.o = [0, 0, 1, 2, 0, 0, 2, 1];

function initMoves() {
    const baseMoves = { 'U': U, 'R': R, 'F': F, 'D': D, 'L': L, 'B': B };
    for (const [name, state] of Object.entries(baseMoves)) {
        MOVES[name] = state;
        
        let state2 = state.clone();
        state2.applyMove(state);
        MOVES[name + '2'] = state2;
        
        let state3 = state2.clone();
        state3.applyMove(state);
        MOVES[name + "'"] = state3;
    }
}
initMoves();
