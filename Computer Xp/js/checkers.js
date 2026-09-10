// Checkers Game Logic
// App ID: checkers-window

let chkBoard = [];
let chkTurn = 1; // 1 = Red, -1 = Black
let chkSelected = null;
let chkMode = 'easy'; // 'easy', 'hard', '2p'
let chkMustJumpFrom = null; // {r, c} if in the middle of a multi-jump

// 1 = Red Man, 2 = Red King
// -1 = Black Man, -2 = Black King
// 0 = Empty

window.checkersNewGame = function() {
    chkBoard = [];
    for (let r = 0; r < 8; r++) {
        let row = [];
        for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) {
                if (r < 3) row.push(-1);
                else if (r > 4) row.push(1);
                else row.push(0);
            } else {
                row.push(0);
            }
        }
        chkBoard.push(row);
    }
    chkTurn = 1;
    chkSelected = null;
    chkMustJumpFrom = null;
    updateCheckersUI();
    setStatus("Red's Turn - Select a piece.");
};

window.checkersOptions = function() {
    let panel = document.getElementById('checkers-options-panel');
    if (panel) panel.style.display = 'block';
};

window.checkersApplyOptions = function() {
    let radios = document.getElementsByName('chk-mode');
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            chkMode = radios[i].value;
            break;
        }
    }
    // If it's Black's turn and we switched to 1-player, trigger AI
    if (chkTurn === -1 && chkMode !== '2p') {
        setTimeout(checkersAITurn, 500);
    }
};

function getValidMovesForPlayer(player, boardState, specificPiece = null) {
    let moves = [];
    let jumps = [];

    let startR = 0, endR = 8, startC = 0, endC = 8;
    if (specificPiece) {
        startR = specificPiece.r;
        endR = specificPiece.r + 1;
        startC = specificPiece.c;
        endC = specificPiece.c + 1;
    }

    for (let r = startR; r < endR; r++) {
        for (let c = startC; c < endC; c++) {
            let p = boardState[r][c];
            if (p !== 0 && Math.sign(p) === player) {
                let isKing = Math.abs(p) === 2;
                let dirs = [];
                if (player === 1 || isKing) dirs.push({dr: -1, dc: -1}, {dr: -1, dc: 1}); // Red moves up
                if (player === -1 || isKing) dirs.push({dr: 1, dc: -1}, {dr: 1, dc: 1}); // Black moves down

                dirs.forEach(d => {
                    // Check normal move
                    let nr = r + d.dr, nc = c + d.dc;
                    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && boardState[nr][nc] === 0) {
                        moves.push({ from: {r, c}, to: {r: nr, c: nc}, jump: null });
                    }
                    // Check jump
                    let jr = r + d.dr * 2, jc = c + d.dc * 2;
                    if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && boardState[jr][jc] === 0) {
                        let midP = boardState[nr][nc];
                        if (midP !== 0 && Math.sign(midP) === -player) {
                            jumps.push({ from: {r, c}, to: {r: jr, c: jc}, jump: {r: nr, c: nc} });
                        }
                    }
                });
            }
        }
    }
    return jumps.length > 0 ? jumps : moves; // Forced jumps
}

function cellClicked(r, c) {
    if (chkTurn === -1 && chkMode !== '2p') return; // AI's turn
    
    let p = chkBoard[r][c];
    
    // Select piece
    if (p !== 0 && Math.sign(p) === chkTurn) {
        if (chkMustJumpFrom && (chkMustJumpFrom.r !== r || chkMustJumpFrom.c !== c)) {
            setStatus("You must continue jumping with the selected piece!");
            return;
        }
        
        let validMoves = getValidMovesForPlayer(chkTurn, chkBoard, chkMustJumpFrom || null);
        let canMoveThis = validMoves.some(m => m.from.r === r && m.from.c === c);
        if (!canMoveThis) {
            setStatus("This piece cannot move" + (validMoves.length > 0 && validMoves[0].jump ? " (You must jump!)" : ""));
            return;
        }

        chkSelected = {r, c};
        updateCheckersUI();
        setStatus("Piece selected.");
        return;
    }

    // Move piece
    if (chkSelected && p === 0) {
        let validMoves = getValidMovesForPlayer(chkTurn, chkBoard, chkMustJumpFrom || null);
        let move = validMoves.find(m => m.from.r === chkSelected.r && m.from.c === chkSelected.c && m.to.r === r && m.to.c === c);
        
        if (move) {
            executeMove(move);
        } else {
            setStatus("Invalid move.");
        }
    }
}

function executeMove(move) {
    let p = chkBoard[move.from.r][move.from.c];
    chkBoard[move.to.r][move.to.c] = p;
    chkBoard[move.from.r][move.from.c] = 0;

    let justKinged = false;
    if (move.jump) {
        chkBoard[move.jump.r][move.jump.c] = 0;
        if (typeof window.playSound === 'function') window.playSound('Windows XP Ding.wav');
    }

    // Kinging
    if (chkTurn === 1 && move.to.r === 0 && p === 1) {
        chkBoard[move.to.r][move.to.c] = 2;
        justKinged = true;
    } else if (chkTurn === -1 && move.to.r === 7 && p === -1) {
        chkBoard[move.to.r][move.to.c] = -2;
        justKinged = true;
    }

    chkSelected = null;

    // Multi-jump check
    if (move.jump && !justKinged) {
        let nextMoves = getValidMovesForPlayer(chkTurn, chkBoard, move.to);
        if (nextMoves.length > 0 && nextMoves[0].jump) {
            chkMustJumpFrom = move.to;
            chkSelected = move.to;
            updateCheckersUI();
            setStatus((chkTurn === 1 ? "Red" : "Black") + " must double jump!");
            
            if (chkTurn === -1 && chkMode !== '2p') {
                setTimeout(checkersAITurn, 500);
            }
            return;
        }
    }

    // End turn
    chkMustJumpFrom = null;
    chkTurn = -chkTurn;
    updateCheckersUI();

    let winState = checkWinCondition();
    if (winState) {
        setStatus(winState);
        return;
    }

    setStatus(chkTurn === 1 ? "Red's Turn." : "Black's Turn.");

    if (chkTurn === -1 && chkMode !== '2p') {
        setTimeout(checkersAITurn, 500);
    }
}

function checkWinCondition() {
    let p1 = getValidMovesForPlayer(1, chkBoard);
    let p2 = getValidMovesForPlayer(-1, chkBoard);
    if (p1.length === 0 && p2.length === 0) return "It's a draw!";
    if (p1.length === 0) return "Black Wins!";
    if (p2.length === 0) return "Red Wins!";
    return null;
}

function checkersAITurn() {
    let validMoves = getValidMovesForPlayer(-1, chkBoard, chkMustJumpFrom || null);
    if (validMoves.length === 0) return;

    let chosenMove = null;

    if (chkMode === 'easy') {
        chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else {
        // Hard mode: basic minimax depth 3
        let bestVal = -Infinity;
        for (let i = 0; i < validMoves.length; i++) {
            let val = minimaxMove(chkBoard, validMoves[i], 3, -1, -Infinity, Infinity);
            // Add a tiny bit of randomness to tie-breaks
            val += Math.random() * 0.1;
            if (val > bestVal) {
                bestVal = val;
                chosenMove = validMoves[i];
            }
        }
    }

    if (chosenMove) {
        executeMove(chosenMove);
    }
}

function minimaxMove(board, move, depth, maximizingPlayer, alpha, beta) {
    let bCopy = board.map(row => [...row]);
    
    // Apply move
    let p = bCopy[move.from.r][move.from.c];
    bCopy[move.to.r][move.to.c] = p;
    bCopy[move.from.r][move.from.c] = 0;
    
    let justKinged = false;
    if (move.jump) {
        bCopy[move.jump.r][move.jump.c] = 0;
    }
    
    if (maximizingPlayer === -1 && move.to.r === 7 && p === -1) { bCopy[move.to.r][move.to.c] = -2; justKinged = true; }
    if (maximizingPlayer === 1 && move.to.r === 0 && p === 1) { bCopy[move.to.r][move.to.c] = 2; justKinged = true; }

    let isDoubleJump = false;
    if (move.jump && !justKinged) {
        let nextMoves = getValidMovesForPlayer(maximizingPlayer, bCopy, move.to);
        if (nextMoves.length > 0 && nextMoves[0].jump) isDoubleJump = true;
    }

    if (depth === 0) return evaluateBoard(bCopy);

    if (isDoubleJump) {
        // Same player continues
        let nextMoves = getValidMovesForPlayer(maximizingPlayer, bCopy, move.to);
        let best = maximizingPlayer === -1 ? -Infinity : Infinity;
        for (let m of nextMoves) {
            let val = minimaxMove(bCopy, m, depth - 1, maximizingPlayer, alpha, beta);
            if (maximizingPlayer === -1) { best = Math.max(best, val); alpha = Math.max(alpha, best); }
            else { best = Math.min(best, val); beta = Math.min(beta, best); }
            if (beta <= alpha) break;
        }
        return best;
    } else {
        // Next player
        let nextPlayer = -maximizingPlayer;
        let nextMoves = getValidMovesForPlayer(nextPlayer, bCopy);
        if (nextMoves.length === 0) return maximizingPlayer === -1 ? 1000 : -1000;

        let best = nextPlayer === -1 ? -Infinity : Infinity;
        for (let m of nextMoves) {
            let val = minimaxMove(bCopy, m, depth - 1, nextPlayer, alpha, beta);
            if (nextPlayer === -1) { best = Math.max(best, val); alpha = Math.max(alpha, best); }
            else { best = Math.min(best, val); beta = Math.min(beta, best); }
            if (beta <= alpha) break;
        }
        return best;
    }
}

function evaluateBoard(board) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            let p = board[r][c];
            if (p === -1) score += 10 + (r * 1); // Black man favors moving down
            else if (p === -2) score += 30; // Black King
            else if (p === 1) score -= 10 + ((7 - r) * 1); // Red man favors moving up
            else if (p === 2) score -= 30; // Red King
        }
    }
    return score;
}

function updateCheckersUI() {
    let b = document.getElementById('checkers-board');
    if (!b) return;
    b.innerHTML = '';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            let isDark = (r + c) % 2 === 1;
            let cell = document.createElement('div');
            cell.style.width = '100%';
            cell.style.height = '100%';
            cell.style.backgroundColor = isDark ? '#AA5533' : '#F0D9B5';
            cell.style.display = 'flex';
            cell.style.justifyContent = 'center';
            cell.style.alignItems = 'center';
            
            if (isDark) {
                cell.style.cursor = 'pointer';
                cell.onclick = () => cellClicked(r, c);
            }

            let p = chkBoard[r] ? chkBoard[r][c] : 0;
            if (p !== 0) {
                let piece = document.createElement('div');
                piece.style.width = '80%';
                piece.style.height = '80%';
                piece.style.borderRadius = '50%';
                piece.style.boxShadow = 'inset 2px 2px 4px rgba(255,255,255,0.4), inset -2px -2px 4px rgba(0,0,0,0.6), 2px 2px 5px rgba(0,0,0,0.5)';
                piece.style.display = 'flex';
                piece.style.justifyContent = 'center';
                piece.style.alignItems = 'center';
                piece.style.fontSize = '20px';
                piece.style.fontWeight = 'bold';
                piece.style.userSelect = 'none';
                
                if (Math.sign(p) === 1) {
                    piece.style.backgroundColor = '#DD2222';
                    piece.style.color = '#FFAAAA';
                } else {
                    piece.style.backgroundColor = '#222222';
                    piece.style.color = '#777777';
                }
                
                if (Math.abs(p) === 2) {
                    piece.innerHTML = '&#9819;'; // Crown
                }

                if (chkSelected && chkSelected.r === r && chkSelected.c === c) {
                    piece.style.border = '3px solid #FFFF00';
                    piece.style.boxSizing = 'border-box';
                }

                cell.appendChild(piece);
            }
            b.appendChild(cell);
        }
    }
}

function setStatus(msg) {
    let sb = document.getElementById('checkers-status-bar');
    if (sb) sb.innerText = msg;
}

// Ensure the game initializes when loaded
if (document.getElementById('checkers-board')) {
    checkersNewGame();
}
