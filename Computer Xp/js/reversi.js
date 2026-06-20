// Internet Reversi Game Logic
// App ID: reversi-window

let revBoard = [];
let revTurn = 1; // 1 = Black, 2 = White
let revMode = 'easy'; // 'easy', 'hard', '2p'

window.reversiNewGame = function() {
    revBoard = [];
    for (let r = 0; r < 8; r++) {
        let row = [];
        for (let c = 0; c < 8; c++) {
            row.push(0);
        }
        revBoard.push(row);
    }
    revBoard[3][3] = 2;
    revBoard[4][4] = 2;
    revBoard[3][4] = 1;
    revBoard[4][3] = 1;
    
    revTurn = 1; // Black always goes first in Reversi
    updateReversiUI();
    setRevStatus("Black's Turn");
};

window.reversiOptions = function() {
    let panel = document.getElementById('reversi-options-panel');
    if (panel) panel.style.display = 'block';
};

window.reversiApplyOptions = function() {
    let radios = document.getElementsByName('rev-mode');
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            revMode = radios[i].value;
            break;
        }
    }
    // If it's White's turn and we switched to 1-player, trigger AI
    if (revTurn === 2 && revMode !== '2p') {
        setTimeout(reversiAITurn, 500);
    }
};

const revDirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
];

function getRevFlips(board, r, c, player) {
    if (board[r][c] !== 0) return [];
    let flips = [];
    let opp = player === 1 ? 2 : 1;
    
    for (let [dr, dc] of revDirs) {
        let currentFlips = [];
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === opp) {
            currentFlips.push({r: nr, c: nc});
            nr += dr;
            nc += dc;
        }
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === player) {
            flips = flips.concat(currentFlips);
        }
    }
    return flips;
}

function getRevValidMoves(board, player) {
    let moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            let flips = getRevFlips(board, r, c, player);
            if (flips.length > 0) {
                moves.push({r, c, flips});
            }
        }
    }
    return moves;
}

function revCellClicked(r, c) {
    if (revTurn === 2 && revMode !== '2p') return; // AI's turn
    let validMoves = getRevValidMoves(revBoard, revTurn);
    let move = validMoves.find(m => m.r === r && m.c === c);
    
    if (move) {
        executeRevMove(move);
    } else {
        setRevStatus("Invalid move. Must outflank an opponent's disk.");
    }
}

function executeRevMove(move) {
    revBoard[move.r][move.c] = revTurn;
    for (let f of move.flips) {
        revBoard[f.r][f.c] = revTurn;
    }
    if (typeof window.playSound === 'function') window.playSound('Windows XP Ding.wav');
    
    revTurn = revTurn === 1 ? 2 : 1;
    
    // Check if next player has valid moves
    let nextMoves = getRevValidMoves(revBoard, revTurn);
    if (nextMoves.length === 0) {
        // Skip turn
        revTurn = revTurn === 1 ? 2 : 1;
        let nextNextMoves = getRevValidMoves(revBoard, revTurn);
        if (nextNextMoves.length === 0) {
            // Game over
            updateReversiUI();
            let b = 0, w = 0;
            for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
                if(revBoard[r][c]===1) b++;
                if(revBoard[r][c]===2) w++;
            }
            if (b > w) setRevStatus(`Game Over! Black wins ${b} to ${w}.`);
            else if (w > b) setRevStatus(`Game Over! White wins ${w} to ${b}.`);
            else setRevStatus(`Game Over! It's a draw ${b} to ${w}.`);
            return;
        } else {
            // Turn skipped
            setRevStatus(`${revTurn===1 ? 'Black' : 'White'} skipped! ${revTurn===1 ? 'Black' : 'White'}'s Turn`);
            updateReversiUI();
            if (revTurn === 2 && revMode !== '2p') setTimeout(reversiAITurn, 1000);
            return;
        }
    }
    
    setRevStatus(`${revTurn===1 ? 'Black' : 'White'}'s Turn`);
    updateReversiUI();
    
    if (revTurn === 2 && revMode !== '2p') {
        setTimeout(reversiAITurn, 500);
    }
}

function reversiAITurn() {
    let validMoves = getRevValidMoves(revBoard, 2);
    if (validMoves.length === 0) return;

    let chosenMove = null;

    if (revMode === 'easy') {
        chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else {
        // Hard mode: evaluate board (corners are best)
        let bestVal = -Infinity;
        for (let m of validMoves) {
            let bCopy = revBoard.map(row => [...row]);
            bCopy[m.r][m.c] = 2;
            for (let f of m.flips) bCopy[f.r][f.c] = 2;
            
            let val = evaluateRevBoard(bCopy, 2);
            val += Math.random() * 0.1; // Tie-break
            if (val > bestVal) {
                bestVal = val;
                chosenMove = m;
            }
        }
    }

    if (chosenMove) {
        executeRevMove(chosenMove);
    }
}

function evaluateRevBoard(board, player) {
    let score = 0;
    let opp = player === 1 ? 2 : 1;
    let weights = [
        [100, -20,  10,   5,   5,  10, -20, 100],
        [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
        [ 10,  -2,   1,   1,   1,   1,  -2,  10],
        [  5,  -2,   1,   1,   1,   1,  -2,   5],
        [  5,  -2,   1,   1,   1,   1,  -2,   5],
        [ 10,  -2,   1,   1,   1,   1,  -2,  10],
        [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
        [100, -20,  10,   5,   5,  10, -20, 100]
    ];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === player) score += weights[r][c];
            else if (board[r][c] === opp) score -= weights[r][c];
        }
    }
    return score;
}

function updateReversiUI() {
    let b = document.getElementById('reversi-board');
    if (!b) return;
    b.innerHTML = '';
    
    let bScore = 0, wScore = 0;
    
    // Get valid moves for current player to show hints
    let validMoves = getRevValidMoves(revBoard, revTurn);
    let isHumanTurn = (revTurn === 1 || revMode === '2p');
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            let p = revBoard[r] ? revBoard[r][c] : 0;
            if (p === 1) bScore++;
            if (p === 2) wScore++;
            
            let cell = document.createElement('div');
            cell.style.width = '100%';
            cell.style.height = '100%';
            cell.style.borderRight = '1px solid #115522';
            cell.style.borderBottom = '1px solid #115522';
            cell.style.display = 'flex';
            cell.style.justifyContent = 'center';
            cell.style.alignItems = 'center';
            
            let isHint = isHumanTurn && validMoves.some(m => m.r === r && m.c === c);
            
            if (p === 0 && isHint) {
                cell.style.cursor = 'pointer';
                cell.onmouseover = () => { cell.style.background = '#228844'; };
                cell.onmouseout = () => { cell.style.background = 'transparent'; };
            }
            
            cell.onclick = () => revCellClicked(r, c);

            if (p !== 0) {
                let piece = document.createElement('div');
                piece.style.width = '85%';
                piece.style.height = '85%';
                piece.style.borderRadius = '50%';
                piece.style.boxShadow = '2px 2px 4px rgba(0,0,0,0.5)';
                if (p === 1) {
                    piece.style.background = 'radial-gradient(circle at 30% 30%, #555, #000)';
                } else {
                    piece.style.background = 'radial-gradient(circle at 30% 30%, #FFF, #CCC)';
                }
                cell.appendChild(piece);
            } else if (isHint) {
                // Draw a tiny dot for hint
                let dot = document.createElement('div');
                dot.style.width = '20%';
                dot.style.height = '20%';
                dot.style.borderRadius = '50%';
                dot.style.background = 'rgba(0,0,0,0.2)';
                cell.appendChild(dot);
            }
            b.appendChild(cell);
        }
    }
    
    document.getElementById('rev-black-score').innerText = bScore;
    document.getElementById('rev-white-score').innerText = wScore;
}

function setRevStatus(msg) {
    let sb = document.getElementById('reversi-status-bar');
    if (sb) sb.innerText = msg;
}

// Initialize on load
if (document.getElementById('reversi-board')) {
    reversiNewGame();
}
