/** * Hacker-Sim: Minigames (Poker, Minesweeper, Solitaire, Viper)
 */

function runPoker() {
    const wrapper = document.createElement('div'); wrapper.className = 'poker-wrapper';
    const header = document.createElement('div'); header.className = 'poker-header'; header.textContent = 'TEXAS HOLD\'EM SUBSYSTEM';
    
    const settingsDiv = document.createElement('div'); settingsDiv.className = 'poker-settings';
    settingsDiv.innerHTML = `Bots (1-3): <input type="number" id="botCount" value="3" min="1" max="3" style="width: 40px; background: #000; color: #0f0; border: 1px solid #fff; text-align: center;"> <button class="poker-btn" id="startPokerBtn">Initialize Table</button>`;
    
    const tableDiv = document.createElement('div'); tableDiv.className = 'poker-table'; tableDiv.style.display = 'none';
    const botsDiv = document.createElement('div'); botsDiv.className = 'poker-bots';
    const commDiv = document.createElement('div'); commDiv.className = 'poker-community';
    const playerDiv = document.createElement('div'); playerDiv.className = 'poker-player';
    
    const infoDiv = document.createElement('div'); infoDiv.className = 'poker-info';
    const controlsDiv = document.createElement('div'); controlsDiv.className = 'poker-controls';
    
    playerDiv.innerHTML = `<div class="poker-player-cards" id="playerCards"></div><div id="playerChips" style="margin-top: 10px; font-weight: bold;">Chips: 1000</div>`;
    controlsDiv.innerHTML = `
        <button class="poker-btn" id="btnFold">Fold</button>
        <button class="poker-btn" id="btnCall">Call / Check</button>
        <button class="poker-btn" id="btnRaise">Raise (50)</button>
        <button class="poker-btn" id="btnNext" style="display:none;">Next Hand</button>
    `;
    playerDiv.appendChild(controlsDiv);
    
    tableDiv.appendChild(botsDiv); 
    tableDiv.appendChild(commDiv); 
    tableDiv.appendChild(infoDiv); 
    tableDiv.appendChild(playerDiv);
    
    wrapper.appendChild(header); 
    wrapper.appendChild(settingsDiv); 
    wrapper.appendChild(tableDiv);
    terminalOutput.appendChild(wrapper);

    // Poker State
    let deck = [];
    let community = [];
    let bots = [];
    let playerChips = 1000;
    let pot = 0;
    let currentBet = 0;
    let phase = 0; // 0=PreFlop, 1=Flop, 2=Turn, 3=River, 4=Showdown
    let activePlayers = []; // Indices: 0 is player, 1+ are bots
    
    document.getElementById('startPokerBtn').onclick = () => {
        let count = parseInt(document.getElementById('botCount').value) || 3;
        if(count < 1) count = 1; if(count > 3) count = 3;
        bots = Array(count).fill(0).map((_, i) => ({ id: i+1, chips: 1000, cards: [], inHand: true, currentBet: 0 }));
        settingsDiv.style.display = 'none'; 
        tableDiv.style.display = 'flex';
        startHand();
    };

    function buildDeck() {
        const suits = [{s: '♥', c: 'red'}, {s: '♦', c: 'red'}, {s: '♣', c: 'black'}, {s: '♠', c: 'black'}];
        const values = [{v:'2', r:2},{v:'3', r:3},{v:'4', r:4},{v:'5', r:5},{v:'6', r:6},{v:'7', r:7},{v:'8', r:8},{v:'9', r:9},{v:'10', r:10},{v:'J', r:11},{v:'Q', r:12},{v:'K', r:13},{v:'A', r:14}];
        let d = [];
        for(let suit of suits) for(let val of values) d.push({ ...suit, ...val });
        for (let i = d.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1)); 
            [d[i], d[j]] = [d[j], d[i]]; 
        }
        return d;
    }

    function renderCard(card, hidden=false) {
        if(hidden) {
            return `<div class="sol-card back" style="position:relative; display:inline-flex; justify-content:center; align-items:center; width:45px; height:65px; margin: 2px; border: 1px solid black; border-radius: 4px; background: repeating-linear-gradient(45deg, #000080, #000080 5px, #ffffff 5px, #ffffff 10px); color: transparent;">X</div>`;
        }
        // Force explicit inline styles so terminal global CSS doesn't override the card colors
        const textColor = card.color === 'red' ? '#ff0000' : '#000000';
        return `<div class="sol-card" style="position:relative; display:inline-flex; justify-content:center; align-items:center; width:45px; height:65px; margin: 2px; background: white; color: ${textColor}; font-weight: bold; font-size: 16px; border: 1px solid black; border-radius: 4px; text-shadow: none;">${card.v}${card.s}</div>`;
    }

    function updateUI() {
        botsDiv.innerHTML = '';
        bots.forEach(b => {
            botsDiv.innerHTML += `
                <div class="poker-bot-ui ${b.inHand ? '' : 'folded'}" style="opacity: ${b.inHand ? '1' : '0.5'}; border: 1px solid ${b.inHand ? '#0f0' : '#f00'}; padding: 10px; border-radius: 5px;">
                    Bot ${b.id}<br>Chips: ${b.chips}<br><br>
                    <div style="display:flex; gap:5px; justify-content:center;">
                        ${b.inHand ? (phase === 4 ? renderCard(b.cards[0]) + renderCard(b.cards[1]) : renderCard(null, true) + renderCard(null, true)) : 'FOLDED'}
                    </div>
                </div>`;
        });
        
        commDiv.innerHTML = community.map(c => renderCard(c)).join('');
        while(commDiv.children.length < 5) {
            commDiv.innerHTML += `<div class="sol-slot" style="position:relative; width:45px; height:65px; display:inline-block; border: 1px dashed #fff; margin: 2px;"></div>`;
        }
        
        document.getElementById('playerChips').textContent = `Your Chips: ${playerChips} | Current Pot: ${pot} | Bet to Call: ${currentBet}`;
    }

    function startHand() {
        deck = buildDeck(); 
        community = []; 
        pot = 0; 
        currentBet = 20; 
        phase = 0;
        
        bots.forEach(b => { 
            b.inHand = b.chips > 0; 
            b.cards = [deck.pop(), deck.pop()]; 
            b.currentBet = 0; 
        });
        
        activePlayers = [true, ...bots.map(b => b.inHand)];
        
        if(playerChips <= 0) { 
            infoDiv.textContent = "BANKRUPT. REBOOT SUBSYSTEM TO TRY AGAIN."; 
            toggleButtons(true);
            return; 
        }
        
        let pCards = [deck.pop(), deck.pop()];
        document.getElementById('playerCards').innerHTML = renderCard(pCards[0]) + renderCard(pCards[1]);
        
        // Antes
        playerChips -= 20; pot += 20;
        bots.forEach(b => { if(b.inHand) { b.chips -= 20; pot += 20; } });
        
        infoDiv.innerHTML = "<strong>Pre-Flop:</strong> Antes collected. Place your bets.";
        toggleButtons(false);
        updateUI();
        grantAchievement("gambler", "High Roller", "Initialized the Poker Subsystem.");
    }

    function toggleButtons(disabled) {
        document.getElementById('btnFold').style.display = disabled ? 'none' : 'inline-block';
        document.getElementById('btnCall').style.display = disabled ? 'none' : 'inline-block';
        document.getElementById('btnRaise').style.display = disabled ? 'none' : 'inline-block';
    }

    function botActions() {
        let actionLog = [];
        bots.forEach(b => {
            if(!b.inHand) return;
            let callAmt = currentBet - b.currentBet;
            
            if(Math.random() < 0.20 && callAmt > 0) { 
                b.inHand = false; 
                actionLog.push(`Bot ${b.id} folded.`);
            } else {
                if(b.chips >= callAmt) { 
                    b.chips -= callAmt; 
                    pot += callAmt; 
                    b.currentBet += callAmt; 
                    actionLog.push(`Bot ${b.id} ${callAmt > 0 ? 'called' : 'checked'}.`);
                } else { 
                    pot += b.chips; 
                    b.currentBet += b.chips; 
                    b.chips = 0; 
                    actionLog.push(`Bot ${b.id} went ALL IN.`);
                } 
            }
        });
        return actionLog.join(" ");
    }

    function advancePhase() {
        let botLog = botActions();
        let activeCount = activePlayers[0] ? 1 : 0;
        bots.forEach(b => { if(b.inHand) activeCount++; });
        
        if(activeCount === 1 && activePlayers[0]) {
            infoDiv.innerHTML = `${botLog}<br><span style="color:#0f0">All bots folded. YOU WIN the pot!</span>`;
            playerChips += pot; 
            showNextBtn(); 
            updateUI(); 
            playSuccess();
            return;
        } else if (!activePlayers[0] && activeCount === 1) {
            infoDiv.innerHTML = "You folded. Bots resolve hand... A Bot wins the pot.";
            while(phase < 4) { if(phase===0) community.push(deck.pop(), deck.pop(), deck.pop()); else community.push(deck.pop()); phase++; }
            showNextBtn();
            updateUI();
            return;
        } else if (!activePlayers[0]) {
            infoDiv.innerHTML = "You folded. Fast-forwarding to showdown.";
            while(phase < 4) { if(phase===0) community.push(deck.pop(), deck.pop(), deck.pop()); else community.push(deck.pop()); phase++; }
        } else {
            phase++;
            let phaseName = "";
            if(phase === 1) { community.push(deck.pop(), deck.pop(), deck.pop()); phaseName = "Flop"; }
            if(phase === 2) { community.push(deck.pop()); phaseName = "Turn"; }
            if(phase === 3) { community.push(deck.pop()); phaseName = "River"; }
            infoDiv.innerHTML = `${botLog}<br><strong>${phaseName} dealt.</strong> Your action.`;
        }
        
        currentBet = 0; 
        bots.forEach(b => b.currentBet = 0);
        updateUI();
        
        if(phase >= 4) { evaluateShowdown(); }
    }

    function evaluateShowdown() {
        toggleButtons(true);
        infoDiv.innerHTML = "<strong>SHOWDOWN.</strong><br>";
        
        let candidates = [];
        if(activePlayers[0]) candidates.push("Player");
        bots.forEach(b => { if(b.inHand) candidates.push("Bot " + b.id); });
        
        let winner = candidates[Math.floor(Math.random() * candidates.length)];
        infoDiv.innerHTML += `<span style="color:${winner === 'Player' ? '#0f0' : '#f00'}; font-size: 1.2em;">WINNER: ${winner}!</span>`;
        
        if(winner === "Player") { 
            playerChips += pot; 
            playSuccess(); 
        } else { 
            let winningBot = bots.find(b => `Bot ${b.id}` === winner);
            if (winningBot) winningBot.chips += pot;
            playError(); 
        }
        
        updateUI();
        showNextBtn();
    }

    function showNextBtn() {
        toggleButtons(true);
        document.getElementById('btnNext').style.display = 'inline-block';
    }

    document.getElementById('btnFold').onclick = () => { 
        activePlayers[0] = false; 
        playClick(); 
        advancePhase(); 
    };
    
    document.getElementById('btnCall').onclick = () => { 
        let callAmt = currentBet; 
        if(playerChips >= callAmt) { 
            playerChips -= callAmt; 
            pot += callAmt; 
        } else {
            pot += playerChips;
            playerChips = 0;
        }
        playClick(); 
        advancePhase(); 
    };
    
    document.getElementById('btnRaise').onclick = () => { 
        let raise = currentBet + 50; 
        if(playerChips >= raise) { 
            playerChips -= raise; 
            pot += raise; 
            currentBet = raise; 
        } 
        playClick(); 
        advancePhase(); 
    };
    
    document.getElementById('btnNext').onclick = () => { 
        document.getElementById('btnNext').style.display = 'none'; 
        startHand(); 
    };

    scrollToBottom();
}

function startMinesweeper() {
    const rows = 9; const cols = 9; const mines = 10;
    let board = []; let gameOver = false; let minesLeft = mines;
    
    const wrapper = document.createElement('div'); wrapper.className = 'ms-container';
    const header = document.createElement('div'); header.className = 'ms-header';
    header.innerHTML = `<span>Mines: <span class="ms-mine-count">${mines}</span></span><span>Minesweeper</span>`;
    const grid = document.createElement('div'); grid.className = 'ms-board';
    grid.style.gridTemplateColumns = `repeat(${cols}, 20px)`;
    wrapper.appendChild(header); wrapper.appendChild(grid); terminalOutput.appendChild(wrapper);
    
    for(let r=0; r<rows; r++) {
        board[r] = [];
        for(let c=0; c<cols; c++) {
            board[r][c] = { mine: false, revealed: false, flagged: false, count: 0, el: document.createElement('div') };
            let cell = board[r][c].el; cell.className = 'ms-cell';
            cell.addEventListener('click', () => reveal(r, c));
            cell.addEventListener('contextmenu', (e) => { e.preventDefault(); flag(r, c); });
            grid.appendChild(cell);
        }
    }
    
    let placed = 0;
    while(placed < mines) {
        let r = Math.floor(Math.random() * rows); let c = Math.floor(Math.random() * cols);
        if(!board[r][c].mine) { board[r][c].mine = true; placed++; }
    }
    
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            if(board[r][c].mine) continue;
            let count = 0;
            for(let dr=-1; dr<=1; dr++) { for(let dc=-1; dc<=1; dc++) { if(r+dr>=0 && r+dr<rows && c+dc>=0 && c+dc<cols && board[r+dr][c+dc].mine) count++; } }
            board[r][c].count = count;
        }
    }
    
    function flag(r, c) {
        if(gameOver || board[r][c].revealed) return;
        board[r][c].flagged = !board[r][c].flagged;
        board[r][c].el.textContent = board[r][c].flagged ? "⚑" : "";
        board[r][c].el.classList.toggle('flagged');
        minesLeft += board[r][c].flagged ? -1 : 1;
        header.querySelector('.ms-mine-count').textContent = minesLeft;
        playClick();
    }
    
    function reveal(r, c) {
        if(gameOver || board[r][c].revealed || board[r][c].flagged) return;
        board[r][c].revealed = true;
        let cell = board[r][c].el; cell.classList.add('revealed');
        playClick();
        
        if(board[r][c].mine) {
            cell.classList.add('mine'); cell.textContent = "☀"; gameOver = true;
            header.innerHTML = "SYSTEM FAILURE - MINE DETONATED"; playError();
            grantAchievement("mine_fail", "Boom.", "You blew up in Minesweeper.");
            return;
        }
        
        if(board[r][c].count > 0) {
            cell.textContent = board[r][c].count;
            const colors = ['', 'blue', 'green', 'red', 'purple', 'maroon', 'turquoise', 'black', 'gray'];
            cell.style.color = colors[board[r][c].count];
        } else {
            for(let dr=-1; dr<=1; dr++) { for(let dc=-1; dc<=1; dc++) { if(r+dr>=0 && r+dr<rows && c+dc>=0 && c+dc<cols) reveal(r+dr, c+dc); } }
        }
        checkWin();
    }
    
    function checkWin() {
        let won = true;
        for(let r=0; r<rows; r++) { for(let c=0; c<cols; c++) { if(!board[r][c].mine && !board[r][c].revealed) won = false; } }
        if(won) { gameOver = true; header.innerHTML = "VICTORY"; playSuccess(); grantAchievement("mine_win", "Sweeper Expert", "Cleared the hidden minefield."); }
    }
    scrollToBottom();
}

function startSolitaire() {
    const suits = [{s: '♥', c: 'red'}, {s: '♦', c: 'red'}, {s: '♣', c: 'black'}, {s: '♠', c: 'black'}];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    let deck = [];
    let state = { stock: [], waste: [], foundations: [[],[],[],[]], tableaus: [[],[],[],[],[],[],[]] };
    let selectedCard = null; 
    
    const wrapper = document.createElement('div'); wrapper.className = 'solitaire-wrapper';
    const header = document.createElement('div'); header.className = 'sol-header'; header.innerHTML = `<span>Solitaire.exe</span><span>Wins: 0</span>`;
    const topRow = document.createElement('div'); topRow.className = 'sol-row-top';
    const bottomRow = document.createElement('div'); bottomRow.className = 'sol-row-bottom';
    
    wrapper.appendChild(header); wrapper.appendChild(topRow); wrapper.appendChild(bottomRow);
    terminalOutput.appendChild(wrapper);

    suits.forEach(suit => {
        values.forEach((val, valIdx) => {
            deck.push({ suit: suit.s, color: suit.c, val: val, rank: valIdx + 1, faceUp: false });
        });
    });
    
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    let deckIndex = 0;
    for(let i=0; i<7; i++) {
        for(let j=0; j<=i; j++) {
            let card = deck[deckIndex++];
            if(j === i) card.faceUp = true;
            state.tableaus[i].push(card);
        }
    }
    while(deckIndex < deck.length) { state.stock.push(deck[deckIndex++]); }

    function getCardHTML(card, isSelected) {
        if(!card) return '';
        if(!card.faceUp) return `<div class="sol-card back" style="position:relative; display:inline-flex; justify-content:center; align-items:center; width:45px; height:65px; margin: 2px; border: 1px solid black; border-radius: 4px; background: repeating-linear-gradient(45deg, #000080, #000080 5px, #ffffff 5px, #ffffff 10px); color: transparent;">X</div>`;
        const selClass = isSelected ? 'selected' : '';
        const textColor = card.color === 'red' ? '#ff0000' : '#000000';
        return `<div class="sol-card ${selClass}" style="position:relative; display:inline-flex; justify-content:center; align-items:center; width:45px; height:65px; margin: 2px; background: white; color: ${textColor}; font-weight: bold; font-size: 16px; border: 1px solid black; border-radius: 4px; text-shadow: none;">${card.val}${card.suit}</div>`;
    }

    function canMove(card, destType, destIndex) {
        if(destType === 'foundation') {
            const f = state.foundations[destIndex];
            if(f.length === 0) return card.rank === 1; // Ace
            const top = f[f.length-1];
            return card.suit === top.suit && card.rank === top.rank + 1;
        }
        if(destType === 'tableau') {
            const t = state.tableaus[destIndex];
            if(t.length === 0) return card.rank === 13; // King
            const top = t[t.length-1];
            return card.color !== top.color && card.rank === top.rank - 1;
        }
        return false;
    }

    function handleStockClick() {
        if(state.stock.length > 0) {
            let c = state.stock.pop();
            c.faceUp = true;
            state.waste.push(c);
        } else {
            while(state.waste.length > 0) {
                let c = state.waste.pop();
                c.faceUp = false;
                state.stock.push(c);
            }
        }
        selectedCard = null;
        playClick();
        render();
    }

    function handleCardClick(locType, locIndex, cardIndex) {
        let pile = [];
        if(locType === 'waste') pile = state.waste;
        if(locType === 'foundation') pile = state.foundations[locIndex];
        if(locType === 'tableau') pile = state.tableaus[locIndex];
        
        let card = pile[cardIndex];
        
        if(selectedCard && selectedCard.locationType === locType && selectedCard.locationIndex === locIndex && selectedCard.cardIndex === cardIndex) {
            selectedCard = null;
            render();
            return;
        }

        if(!selectedCard) {
            if(card && card.faceUp) {
                selectedCard = { locationType: locType, locationIndex: locIndex, cardIndex: cardIndex };
            }
        } else {
            let srcPile = [];
            if(selectedCard.locationType === 'waste') srcPile = state.waste;
            if(selectedCard.locationType === 'foundation') srcPile = state.foundations[selectedCard.locationIndex];
            if(selectedCard.locationType === 'tableau') srcPile = state.tableaus[selectedCard.locationIndex];
            
            let movingCards = srcPile.slice(selectedCard.cardIndex);
            let targetCard = movingCards[0];
            
            if(locType === 'foundation' && movingCards.length > 1) {
                selectedCard = null; render(); return; 
            }

            if(canMove(targetCard, locType, locIndex)) {
                if(locType === 'foundation') state.foundations[locIndex].push(...movingCards);
                if(locType === 'tableau') state.tableaus[locIndex].push(...movingCards);
                
                srcPile.splice(selectedCard.cardIndex, movingCards.length);
                
                if(selectedCard.locationType === 'tableau' && srcPile.length > 0) {
                    srcPile[srcPile.length-1].faceUp = true;
                }
                playClick();
            } else {
                playError();
            }
            selectedCard = null;
        }
        render();
    }

    function render() {
        topRow.innerHTML = ''; bottomRow.innerHTML = '';
        
        let stockDiv = document.createElement('div'); stockDiv.className = 'sol-slot';
        if(state.stock.length > 0) stockDiv.innerHTML = `<div class="sol-card back" style="position:relative; display:inline-flex; justify-content:center; align-items:center; width:45px; height:65px; margin: 2px; border: 1px solid black; border-radius: 4px; background: repeating-linear-gradient(45deg, #000080, #000080 5px, #ffffff 5px, #ffffff 10px); color: transparent;">X</div>`;
        stockDiv.onclick = handleStockClick;
        topRow.appendChild(stockDiv);
        
        let wasteDiv = document.createElement('div'); wasteDiv.className = 'sol-slot';
        if(state.waste.length > 0) {
            let isSel = selectedCard && selectedCard.locationType === 'waste';
            wasteDiv.innerHTML = getCardHTML(state.waste[state.waste.length-1], isSel);
            wasteDiv.onclick = () => handleCardClick('waste', 0, state.waste.length-1);
        }
        topRow.appendChild(wasteDiv);
        
        let spacer = document.createElement('div'); spacer.className = 'sol-spacer';
        topRow.appendChild(spacer);
        
        for(let i=0; i<4; i++) {
            let fDiv = document.createElement('div'); fDiv.className = 'sol-slot';
            let f = state.foundations[i];
            if(f.length > 0) {
                let isSel = selectedCard && selectedCard.locationType === 'foundation' && selectedCard.locationIndex === i;
                fDiv.innerHTML = getCardHTML(f[f.length-1], isSel);
                fDiv.onclick = () => handleCardClick('foundation', i, f.length-1);
            } else {
                fDiv.onclick = () => { if(selectedCard) handleCardClick('foundation', i, 0); };
            }
            topRow.appendChild(fDiv);
        }
        
        for(let i=0; i<7; i++) {
            let tDiv = document.createElement('div'); tDiv.className = 'sol-tableau-slot';
            let t = state.tableaus[i];
            
            if(t.length === 0) {
                tDiv.innerHTML = `<div class="sol-slot" style="position:absolute;"></div>`;
                tDiv.onclick = () => { if(selectedCard) handleCardClick('tableau', i, 0); };
            } else {
                t.forEach((card, cIdx) => {
                    let cardLayer = document.createElement('div');
                    cardLayer.className = 'sol-card-layer';
                    cardLayer.style.top = `${cIdx * 20}px`;
                    
                    let isSel = selectedCard && selectedCard.locationType === 'tableau' && selectedCard.locationIndex === i && selectedCard.cardIndex === cIdx;
                    if(selectedCard && selectedCard.locationType === 'tableau' && selectedCard.locationIndex === i && cIdx >= selectedCard.cardIndex) isSel = true;

                    cardLayer.innerHTML = getCardHTML(card, isSel);
                    
                    cardLayer.onclick = (e) => { e.stopPropagation(); handleCardClick('tableau', i, cIdx); };
                    tDiv.appendChild(cardLayer);
                });
                tDiv.style.minHeight = `${70 + (t.length-1)*20}px`;
            }
            bottomRow.appendChild(tDiv);
        }
        
        let won = state.foundations.every(f => f.length === 13);
        if(won) {
            header.innerHTML = "<span>Solitaire.exe</span><span>YOU WIN!</span>";
            playSuccess();
            grantAchievement("solitaire_win", "Card Shark", "Won a game of Klondike Solitaire.");
        }
    }
    
    render();
    scrollToBottom();
}

function startSecretGame() {
    activeGame = 'snake';
    const wrapper = document.createElement('div'); wrapper.className = 'sec-wrapper';
    const header = document.createElement('div'); header.className = 'sec-header';
    header.innerHTML = `<span>VIPER.EXE</span><span id="snkScore">Score: 0</span>`;
    const board = document.createElement('div'); board.className = 'sec-board';
    const controls = document.createElement('div'); controls.className = 'sec-controls';
    controls.innerHTML = "Use Arrow Keys to move. Press 'Q' to quit.";
    
    wrapper.appendChild(header); wrapper.appendChild(board); wrapper.appendChild(controls);
    terminalOutput.appendChild(wrapper);

    for(let i=0; i<400; i++) {
        let cell = document.createElement('div'); cell.className = 'sec-cell';
        board.appendChild(cell);
    }

    let snake = [{x: 10, y: 10}];
    let food = {x: 5, y: 5};
    let dx = 1, dy = 0;
    let score = 0;
    let loop;

    function draw() {
        const cells = board.children;
        for(let i=0; i<400; i++) cells[i].className = 'sec-cell';
        cells[food.y * 20 + food.x].classList.add('sec-food');
        snake.forEach((seg, i) => {
            cells[seg.y * 20 + seg.x].classList.add(i === 0 ? 'sec-head' : 'sec-body');
        });
    }

    function update() {
        let head = {x: snake[0].x + dx, y: snake[0].y + dy};
        if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || snake.some(s => s.x === head.x && s.y === head.y)) {
            clearInterval(loop);
            header.innerHTML = `<span>VIPER.EXE - FATAL COLLISION</span><span>Score: ${score}</span>`;
            playError();
            activeGame = null;
            return;
        }
        snake.unshift(head);
        if(head.x === food.x && head.y === food.y) {
            score += 10;
            document.getElementById('snkScore').innerText = `Score: ${score}`;
            playClick();
            food = {x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20)};
        } else {
            snake.pop();
        }
        draw();
    }

    document.addEventListener('keydown', function snakeKeys(e) {
        if(activeGame !== 'snake') {
            document.removeEventListener('keydown', snakeKeys);
            return;
        }
        if(e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; e.preventDefault(); }
        if(e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; e.preventDefault(); }
        if(e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; e.preventDefault(); }
        if(e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; e.preventDefault(); }
        if(e.key.toLowerCase() === 'q') {
            clearInterval(loop);
            header.innerHTML = `<span>VIPER.EXE - TERMINATED</span><span>Score: ${score}</span>`;
            activeGame = null;
            document.removeEventListener('keydown', snakeKeys);
        }
    });

    playSuccess();
    draw();
    loop = setInterval(update, 120);
    scrollToBottom();
}