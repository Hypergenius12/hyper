window.setMinesweeperDifficulty = function(diff) {
    if (diff === 'beginner') { msRows = 9; msCols = 9; msMines = 10; }
    else if (diff === 'intermediate') { msRows = 16; msCols = 16; msMines = 40; }
    else if (diff === 'expert') { msRows = 16; msCols = 30; msMines = 99; }
    
    if (window.currentAccount) {
        try { localStorage.setItem('xp_ms_diff_' + window.currentAccount, diff); } catch(e) { console.error('LocalStorage full', e); }
    }
    
    let grid = document.getElementById('minesweeper-grid');
    if (grid) {
        grid.style.gridTemplateColumns = 'repeat(' + msCols + ', 20px)';
    }

    let win = document.getElementById('minesweeper-window');
    if (win) {
        win.style.width = (msCols * 20 + 36) + 'px';
        win.style.height = (msRows * 20 + 130) + 'px';
    }
    
    initMinesweeper();
};

/* Minesweeper Logic */

let msBoard = [];
let msRows = 9;
let msCols = 9;
let msMines = 10;
let msMinesLeft = 10;
let msGameOver = false;
let msFirstClick = true;
let msTimer = 0;
let msTimerInterval = null;

function initMinesweeper() {
    msGameOver = false;
    msFirstClick = true;
    msMinesLeft = msMines;
    msTimer = 0;
    clearInterval(msTimerInterval);
    document.getElementById('mine-count').innerText = msMinesLeft.toString().padStart(3, '0');
    document.getElementById('mine-timer').innerText = '000';
    document.getElementById('mine-face').innerHTML = '<img src="minesweeper icons/happy.png" style="height:80%;">';
    
    let grid = document.getElementById('minesweeper-grid');
    grid.innerHTML = '';
    msBoard = [];

    for (let r = 0; r < msRows; r++) {
        let row = [];
        for (let c = 0; c < msCols; c++) {
            let cell = { isMine: false, isRevealed: false, isFlagged: false, neighbors: 0 };
            row.push(cell);
            
            let div = document.createElement('div');
            div.className = 'ms-cell';
            div.id = `ms-${r}-${c}`;
            
            // Left click
            div.addEventListener('click', () => revealCell(r, c));
            // Right click
            div.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                flagCell(r, c);
            });
            // Face reaction
            div.addEventListener('mousedown', (e) => { if(!msGameOver && e.button===0) document.getElementById('mine-face').innerHTML = '<img src="minesweeper icons/sad.png" style="height:80%;">'; });
            div.addEventListener('mouseup', () => { if(!msGameOver) document.getElementById('mine-face').innerHTML = '<img src="minesweeper icons/happy.png" style="height:80%;">'; });
            div.addEventListener('mouseleave', () => { if(!msGameOver) document.getElementById('mine-face').innerHTML = '<img src="minesweeper icons/happy.png" style="height:80%;">'; });
            
            grid.appendChild(div);
        }
        msBoard.push(row);
    }
}

function placeMines(firstR, firstC) {
    let placed = 0;
    while (placed < msMines) {
        let r = Math.floor(Math.random() * msRows);
        let c = Math.floor(Math.random() * msCols);
        // Don't place on first click or already placed
        if (!msBoard[r][c].isMine && !(r === firstR && c === firstC)) {
            msBoard[r][c].isMine = true;
            placed++;
        }
    }
    // Calculate neighbors
    for (let r = 0; r < msRows; r++) {
        for (let c = 0; c < msCols; c++) {
            if (!msBoard[r][c].isMine) {
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (r+i >= 0 && r+i < msRows && c+j >= 0 && c+j < msCols && msBoard[r+i][c+j].isMine) {
                            count++;
                        }
                    }
                }
                msBoard[r][c].neighbors = count;
            }
        }
    }
}

function revealCell(r, c) {
    if (msGameOver || msBoard[r][c].isRevealed || msBoard[r][c].isFlagged) return;

    if (msFirstClick) {
        placeMines(r, c);
        msFirstClick = false;
        msTimerInterval = setInterval(() => {
            msTimer++;
            document.getElementById('mine-timer').innerText = Math.min(msTimer, 999).toString().padStart(3, '0');
        }, 1000);
    }

    msBoard[r][c].isRevealed = true;
    let div = document.getElementById(`ms-${r}-${c}`);
    div.classList.add('revealed');

    if (msBoard[r][c].isMine) {
        div.classList.add('bomb');
        div.innerHTML = '<img src="minesweeper icons/bomb.png" style="width:14px;height:14px;">';
        gameOver(false);
    } else {
        if (msBoard[r][c].neighbors > 0) {
            div.innerText = msBoard[r][c].neighbors;
            div.classList.add(`ms-${msBoard[r][c].neighbors}`);
        } else {
            // Reveal neighbors
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (r+i >= 0 && r+i < msRows && c+j >= 0 && c+j < msCols) {
                        revealCell(r+i, c+j);
                    }
                }
            }
        }
        checkWin();
    }
}

function flagCell(r, c) {
    if (msGameOver || msBoard[r][c].isRevealed) return;
    let div = document.getElementById(`ms-${r}-${c}`);
    
    if (!msBoard[r][c].isFlagged) {
        msBoard[r][c].isFlagged = true;
        div.innerHTML = '<img src="minesweeper icons/flag.png" style="width:18px;height:18px;">';
        div.style.color = 'red';
        msMinesLeft--;
    } else {
        msBoard[r][c].isFlagged = false;
        div.innerText = '';
        msMinesLeft++;
    }
    document.getElementById('mine-count').innerText = msMinesLeft.toString().padStart(3, '0');
}

function gameOver(win) {
    msGameOver = true;
    clearInterval(msTimerInterval);
    document.getElementById('mine-face').innerHTML = win ? '<img src="minesweeper icons/cool.png" style="height:80%;">' : '<img src="minesweeper icons/sad.png" style="height:80%;">';
    
    for (let r = 0; r < msRows; r++) {
        for (let c = 0; c < msCols; c++) {
            let cell = msBoard[r][c];
            let div = document.getElementById(`ms-${r}-${c}`);
            if (!win && cell.isMine && !cell.isFlagged) {
                div.classList.add('revealed');
                div.innerHTML = '<img src="minesweeper icons/bomb.png" style="width:14px;height:14px;">';
            } else if (!win && !cell.isMine && cell.isFlagged) {
                div.innerHTML = '<span style="color:red; font-weight:bold;">X</span>'; // Wrong flag
            }
        }
    }
}

function checkWin() {
    let unrevealed = 0;
    for (let r = 0; r < msRows; r++) {
        for (let c = 0; c < msCols; c++) {
            if (!msBoard[r][c].isRevealed) unrevealed++;
        }
    }
    if (unrevealed === msMines) gameOver(true);
}


