/* Tetris XP Game Logic */

const canvas = document.getElementById('tetris-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

if(ctx) ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

let board = [];
let tetrisScore = 0;
let tetrisLines = 0;
let tetrisLevel = 1;
let dropCounter = 0;
let dropInterval = 1000;
let lastTimeT = 0;
let tetrisAnimationId;
let tetrisActive = false;

const colors = [ null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF' ];

const pieces = [
    [],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]], // I
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]], // J
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]], // L
    [[4, 4], [4, 4]], // O
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]], // S
    [[0, 6, 0], [6, 6, 6], [0, 0, 0]], // T
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]]  // Z
];

let player = { pos: {x: 0, y: 0}, matrix: null };

function createMatrix(w, h) {
    const matrix = [];
    while (h--) { matrix.push(new Array(w).fill(0)); }
    return matrix;
}

function createPiece(type) { return pieces[type]; }

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                ctx.lineWidth = 0.05;
                ctx.strokeStyle = '#000';
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(x + offset.x, y + offset.y, 1, 0.2);
            }
        });
    });
}

function drawTetris() {
    if(!ctx) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if(board.length) drawMatrix(board, {x: 0, y: 0});
    if(player.matrix) drawMatrix(player.matrix, player.pos);
}

function collide(board, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        arenaSweep();
        updateTetrisScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(board, player)) { player.pos.x -= dir; }
}

function playerReset() {
    const piecesTypes = [1, 2, 3, 4, 5, 6, 7];
    player.matrix = createPiece(piecesTypes[piecesTypes.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (board[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(board, player)) {
        board.forEach(row => row.fill(0));
        tetrisScore = 0;
        tetrisLines = 0;
        tetrisLevel = 1;
        updateTetrisScore();
        if(typeof showBalloon === 'function') showBalloon("Tetris Game Over", "Try again!");
        tetrisActive = false;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) { matrix.forEach(row => row.reverse()); } 
    else { matrix.reverse(); }
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) { continue outer; }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        tetrisScore += rowCount * 10;
        tetrisLines++;
        rowCount *= 2;
        
        if(tetrisLines % 5 === 0) {
            tetrisLevel++;
            dropInterval *= 0.8; 
        }
    }
}

function updateTetrisScore() {
    document.getElementById('tetris-score').innerText = tetrisScore;
    document.getElementById('tetris-lines').innerText = tetrisLines;
    document.getElementById('tetris-level').innerText = tetrisLevel;
}

function updateTetris(time = 0) {
    if(!tetrisActive) return;
    const deltaTime = time - lastTimeT;
    lastTimeT = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) { playerDrop(); }
    drawTetris();
    tetrisAnimationId = requestAnimationFrame(updateTetris);
}

function startTetris() {
    if(!tetrisActive) {
        board = createMatrix(COLS, ROWS);
        playerReset();
        updateTetrisScore();
        tetrisActive = true;
        updateTetris();
    }
}

function resetTetris() {
    cancelAnimationFrame(tetrisAnimationId);
    board = createMatrix(COLS, ROWS);
    tetrisScore = 0; tetrisLines = 0; tetrisLevel = 1; dropInterval = 1000;
    updateTetrisScore();
    playerReset();
    drawTetris();
    if(!tetrisActive) { tetrisActive = true; updateTetris(); }
}

document.addEventListener('keydown', event => {
    let tWin = document.getElementById('tetris-window');
    // Ensure currentZIndex is accessible from os.js
    if (tWin && tWin.style.display !== 'none' && tWin.style.zIndex == window.currentZIndex && tetrisActive) {
        if (event.keyCode === 37) { playerMove(-1); } // left
        else if (event.keyCode === 39) { playerMove(1); } // right
        else if (event.keyCode === 40) { playerDrop(); } // down
        else if (event.keyCode === 38) { playerRotate(1); } // up
    }
});