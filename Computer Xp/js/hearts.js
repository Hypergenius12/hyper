(function() {
    'use strict';

    const SUITS = ['club','diamond','spade','heart'];
    const SUIT_SYMBOLS = {spade:'♠', heart:'♥', diamond:'♦', club:'♣'};
    const SUIT_COLORS = {spade:'black', club:'black', heart:'#cc0000', diamond:'#cc0000'};
    const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    
    let hands = [[],[],[],[]]; // 0=Player, 1=Left, 2=Top, 3=Right
    let scores = [0,0,0,0];
    let roundScores = [0,0,0,0];
    let trick = [];
    let heartsBroken = false;
    let turn = 0;
    let turnLeader = 0;
    let passPhase = 0; // 0=none, 1=left, 2=right, 3=across, 4=hold (then mod 4)
    let selectedToPass = [];
    let gameState = 'deal'; // deal, pass, play, end

    // --- Helpers ---
    function makeDeck(){let d=[];for(let s of SUITS)for(let r of RANKS)d.push({suit:s,rank:r});return d;}
    function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
    function ri(r){return RANKS.indexOf(r);}
    function cc(c){return SUIT_COLORS[c.suit];}
    function isHeart(c){return c.suit==='heart';}
    function isQoS(c){return c.suit==='spade' && c.rank==='Q';}
    function hasSuit(hand, s){return hand.some(c=>c.suit===s);}

    function makeCardEl(card, isSmall){
        let el=document.createElement('div');
        el.className='sol-card';
        if(isSmall){
            el.style.width = '50px';
            el.style.height = '68px';
            el.innerHTML=`<div style="font-size:16px;text-align:center;color:${cc(card)};line-height:68px;">${card.rank}${SUIT_SYMBOLS[card.suit]}</div>`;
        } else {
            let color = cc(card);
            el.style.color = color;
            let sym = SUIT_SYMBOLS[card.suit];
            el.innerHTML=`<div class="sol-inner"><div class="sol-tl">${card.rank}<br>${sym}</div><div class="sol-center">${sym}</div><div class="sol-br">${card.rank}<br>${sym}</div></div>`;
        }
        return el;
    }

    function sortHand(hand){
        hand.sort((a,b)=>{
            if(a.suit!==b.suit) return SUITS.indexOf(a.suit)-SUITS.indexOf(b.suit);
            return ri(a.rank)-ri(b.rank);
        });
    }

    function render(){
        let container = document.getElementById('hearts-container');
        if(!container) return;
        
        let passText = "";
        if(gameState==='pass'){
            let pDir = ["", "Left", "Right", "Across", "Hold"][passPhase%4+1];
            if(pDir==="Hold") passText = "Hold Hand (No Passing)";
            else passText = `Select 3 cards to pass ${pDir}`;
        }
        
        container.innerHTML = `
            <div style="position:absolute; top:0; left:0; right:0; height:30px; background:#005000; color:#fff; display:flex; justify-content:space-between; padding:0 10px; align-items:center; font-family:Tahoma; font-size:12px;">
                <span>P: ${scores[0]} | L: ${scores[1]} | T: ${scores[2]} | R: ${scores[3]}</span>
                <span>${heartsBroken ? '♥ Hearts Broken ♥' : 'Hearts Intact'}</span>
            </div>
            
            <div id="h-top" style="position:absolute; top:40px; left:50%; transform:translateX(-50%); color:#fff;">Top AI: ${hands[2].length} cards</div>
            <div id="h-left" style="position:absolute; top:50%; left:20px; transform:translateY(-50%); color:#fff; writing-mode:vertical-rl;">Left AI: ${hands[1].length} cards</div>
            <div id="h-right" style="position:absolute; top:50%; right:20px; transform:translateY(-50%); color:#fff; writing-mode:vertical-rl;">Right AI: ${hands[3].length} cards</div>
            
            <div id="h-center" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:150px; height:150px; position:relative;">
                <!-- Trick cards rendered here -->
            </div>
            
            <div id="h-msg" style="position:absolute; bottom:120px; width:100%; text-align:center; color:yellow; font-family:Tahoma; font-weight:bold; font-size:14px; text-shadow:1px 1px 2px #000;">
                ${passText}
            </div>
            
            ${gameState==='pass' && (passPhase%4)!==3 ? '<button id="h-pass-btn" style="position:absolute; bottom:150px; left:50%; transform:translateX(-50%); padding:5px 15px;">Pass Selected</button>' : ''}
            
            <div id="h-player" style="position:absolute; bottom:10px; left:10px; right:10px; display:flex; justify-content:center;"></div>
        `;
        
        if(gameState==='pass' && (passPhase%4)!==3) {
            let btn = document.getElementById('h-pass-btn');
            if(btn) btn.onclick = executePass;
        }

        renderTrick();
        renderPlayerHand();
    }

    function renderTrick(){
        let center = document.getElementById('h-center');
        if(!center) return;
        trick.forEach((t, i) => {
            let c = makeCardEl(t.card, false);
            c.style.position = 'absolute';
            if(t.player===0) { c.style.bottom='-40px'; c.style.left='40px'; } // Player
            if(t.player===1) { c.style.top='30px'; c.style.left='-40px'; } // Left
            if(t.player===2) { c.style.top='-40px'; c.style.left='40px'; } // Top
            if(t.player===3) { c.style.top='30px'; c.style.left='120px'; } // Right
            center.appendChild(c);
        });
    }

    function renderPlayerHand(){
        let ph = document.getElementById('h-player');
        if(!ph) return;
        hands[0].forEach((card, idx) => {
            let c = makeCardEl(card, false);
            c.style.position = 'relative';
            if(idx > 0) c.style.marginLeft = '-45px';
            if(gameState==='pass'){
                if(selectedToPass.includes(card)) c.style.transform = 'translateY(-15px)';
                c.onclick = () => togglePassSelect(card);
            } else if(gameState==='play' && turn===0){
                if(isValidPlay(hands[0], card, trick)){
                    c.onclick = () => playCard(0, idx);
                    c.style.cursor = 'pointer';
                    c.onmouseenter = ()=>c.style.transform='translateY(-10px)';
                    c.onmouseleave = ()=>c.style.transform='translateY(0)';
                } else {
                    c.style.opacity = '0.5';
                    c.style.cursor = 'not-allowed';
                }
            } else {
                c.style.cursor = 'default';
            }
            ph.appendChild(c);
        });
    }

    function togglePassSelect(card){
        if(selectedToPass.includes(card)){
            selectedToPass.splice(selectedToPass.indexOf(card), 1);
        } else {
            if(selectedToPass.length < 3) selectedToPass.push(card);
        }
        render();
    }

    function executePass(){
        if(selectedToPass.length !== 3){
            if(window.showBalloon) window.showBalloon("Hearts", "Please select 3 cards to pass.");
            return;
        }
        
        let pDir = passPhase % 4; // 0=left, 1=right, 2=across, 3=hold
        
        let ai1Pass = aiSelectPass(1);
        let ai2Pass = aiSelectPass(2);
        let ai3Pass = aiSelectPass(3);
        
        let passes = [selectedToPass.slice(), ai1Pass, ai2Pass, ai3Pass];
        
        for(let i=0; i<4; i++){
            passes[i].forEach(c=>{
                let idx = hands[i].findIndex(hc=>hc.suit===c.suit && hc.rank===c.rank);
                hands[i].splice(idx,1);
            });
        }
        
        if(pDir === 0){ // Left: 0->1, 1->2, 2->3, 3->0
            hands[1] = hands[1].concat(passes[0]);
            hands[2] = hands[2].concat(passes[1]);
            hands[3] = hands[3].concat(passes[2]);
            hands[0] = hands[0].concat(passes[3]);
        } else if(pDir === 1){ // Right: 0->3, 3->2, 2->1, 1->0
            hands[3] = hands[3].concat(passes[0]);
            hands[2] = hands[2].concat(passes[3]);
            hands[1] = hands[1].concat(passes[2]);
            hands[0] = hands[0].concat(passes[1]);
        } else if(pDir === 2){ // Across: 0->2, 2->0, 1->3, 3->1
            hands[2] = hands[2].concat(passes[0]);
            hands[0] = hands[0].concat(passes[2]);
            hands[3] = hands[3].concat(passes[1]);
            hands[1] = hands[1].concat(passes[3]);
        }
        
        for(let i=0;i<4;i++) sortHand(hands[i]);
        
        startPlayPhase();
    }
    
    function aiSelectPass(playerIdx){
        // Basic pass: highest cards, preferring QoS and high Hearts/Spades
        let hand = hands[playerIdx].slice();
        hand.sort((a,b)=>{
            let av = ri(a.rank) + (a.suit==='spade'?5:0) + (a.suit==='heart'?2:0) + (isQoS(a)?100:0);
            let bv = ri(b.rank) + (b.suit==='spade'?5:0) + (b.suit==='heart'?2:0) + (isQoS(b)?100:0);
            return bv - av;
        });
        return hand.slice(0,3);
    }

    function startPlayPhase(){
        gameState = 'play';
        heartsBroken = false;
        trick = [];
        roundScores = [0,0,0,0];
        // find 2 of clubs
        for(let i=0; i<4; i++){
            if(hands[i].some(c=>c.suit==='club' && c.rank==='2')){
                turn = i;
                turnLeader = i;
                break;
            }
        }
        render();
        if(turn !== 0) setTimeout(aiTurn, 800);
    }

    function isValidPlay(hand, card, currentTrick){
        if(currentTrick.length === 0){
            // Lead rules
            let isFirstTrick = hands.reduce((sum, h) => sum + h.length, 0) === 52;
            if(isFirstTrick){
                return card.suit==='club' && card.rank==='2'; // MUST lead 2 of clubs first trick
            }
            if(!heartsBroken && isHeart(card)){
                // Can only lead hearts if nothing else is left
                let hasNonHearts = hand.some(c=>!isHeart(c));
                if(hasNonHearts) return false;
            }
            return true;
        } else {
            // Follow suit rules
            let leadSuit = currentTrick[0].card.suit;
            if(hasSuit(hand, leadSuit)){
                return card.suit === leadSuit;
            } else {
                // First trick: cannot play points
                if(currentTrick[0].card.suit==='club' && currentTrick[0].card.rank==='2'){
                    if(isHeart(card) || isQoS(card)){
                        // Only allowed if hand has ONLY point cards left
                        let onlyPoints = !hand.some(c=>!isHeart(c) && !isQoS(c));
                        return onlyPoints;
                    }
                }
                return true;
            }
        }
    }

    function playCard(playerIdx, cardIdx){
        if(gameState !== 'play') return;
        let card = hands[playerIdx].splice(cardIdx, 1)[0];
        if(isHeart(card)) heartsBroken = true;
        
        trick.push({player: playerIdx, card: card});
        render();
        
        if(trick.length === 4){
            render();
            setTimeout(resolveTrick, 1500);
        } else {
            turn = (turn + 1) % 4;
            render();
            if(turn !== 0) setTimeout(aiTurn, 800);
        }
    }
    
    function aiTurn(){
        if(gameState !== 'play') return;
        let hand = hands[turn];
        let validCards = hand.filter(c => isValidPlay(hand, c, trick));
        
        // Basic AI: Play lowest valid card, unless taking trick is safe
        validCards.sort((a,b)=>ri(a.rank)-ri(b.rank));
        let chosenCard = validCards[0];
        
        // If last to play, and no points in trick, can play highest
        if(trick.length === 3 && trick[0].card.suit!=='club'){
            let hasPoints = trick.some(t=>isHeart(t.card) || isQoS(t.card));
            if(!hasPoints){
                let leadSuit = trick[0].card.suit;
                let suitCards = validCards.filter(c=>c.suit===leadSuit);
                if(suitCards.length>0){
                    let highest = Math.max(...trick.filter(t=>t.card.suit===leadSuit).map(t=>ri(t.card.rank)));
                    // try to duck
                    let duckCards = suitCards.filter(c=>ri(c.rank)<highest);
                    if(duckCards.length>0) chosenCard = duckCards[duckCards.length-1]; // highest duck
                    else chosenCard = suitCards[suitCards.length-1]; // forced to take, dump highest
                } else {
                     // dump highest point card or highest card
                     validCards.sort((a,b)=> (((isQoS(b)?100:0) + (isHeart(b)?10:0) + ri(b.rank)) - ((isQoS(a)?100:0) + (isHeart(a)?10:0) + ri(a.rank))));
                     chosenCard = validCards[0];
                }
            }
        } else if(trick.length > 0) {
            let leadSuit = trick[0].card.suit;
            let suitCards = validCards.filter(c=>c.suit===leadSuit);
            if(suitCards.length>0){
                // Duck if possible
                 let currentHigh = Math.max(...trick.filter(t=>t.card.suit===leadSuit).map(t=>ri(t.card.rank)));
                 let ducks = suitCards.filter(c=>ri(c.rank)<currentHigh);
                 if(ducks.length>0) chosenCard = ducks[ducks.length-1];
            } else {
                // Dump QoS or highest heart
                let dump = validCards.find(c=>isQoS(c)) || validCards.filter(c=>isHeart(c)).sort((a,b)=>ri(b.rank)-ri(a.rank))[0] || validCards[validCards.length-1];
                chosenCard = dump;
            }
        }

        let idx = hand.indexOf(chosenCard);
        playCard(turn, idx);
    }

    function resolveTrick(){
        let leadSuit = trick[0].card.suit;
        let highestRank = -1;
        let winner = -1;
        
        let points = 0;
        trick.forEach(t=>{
            if(t.card.suit === leadSuit && ri(t.card.rank) > highestRank){
                highestRank = ri(t.card.rank);
                winner = t.player;
            }
            if(isHeart(t.card)) points += 1;
            if(isQoS(t.card)) points += 13;
        });
        
        roundScores[winner] += points;
        
        trick = [];
        if(hands[0].length === 0){
            endRound();
        } else {
            turn = winner;
            turnLeader = winner;
            render();
            if(turn !== 0) setTimeout(aiTurn, 800);
        }
    }

    function endRound(){
        gameState = 'end';
        let moonShooter = roundScores.findIndex(s=>s===26);
        if(moonShooter !== -1){
            for(let i=0;i<4;i++){
                if(i !== moonShooter) scores[i] += 26;
            }
        } else {
            for(let i=0;i<4;i++){
                scores[i] += roundScores[i];
            }
        }
        render();
        
        if(scores.some(s=>s>=100)){
            let minScore = Math.min(...scores);
            let pStr = ["You", "Left AI", "Top AI", "Right AI"];
            let winners = [];
            scores.forEach((s,i)=>{if(s===minScore) winners.push(pStr[i])});
            if (typeof window.playSound === 'function') window.playSound('notify');
            if(window.xpDialog) {
                window.xpDialog("Game Over", `${winners.join(" & ")} win with ${minScore} points!`, "info", () => {
                    window.heartsNewGame(false);
                });
            }
        } else {
            passPhase++;
            setTimeout(()=>{
                if(window.xpDialog) window.xpDialog("Round Over", "Next round starting...", "info", ()=>{
                    window.heartsNewGame(true);
                });
            }, 1000);
        }
    }

    // --- New Game ---
    window.heartsNewGame = function(keepScores = false){
        if(!keepScores) { scores = [0,0,0,0]; passPhase = 0; }
        let deck = shuffle(makeDeck());
        hands = [[],[],[],[]];
        for(let i=0; i<52; i++) hands[i%4].push(deck[i]);
        for(let i=0; i<4; i++) sortHand(hands[i]);
        
        selectedToPass = [];
        
        if((passPhase % 4) === 3){ // Hold phase
            startPlayPhase();
        } else {
            gameState = 'pass';
            render();
        }
    };

})();

