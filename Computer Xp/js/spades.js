(function() {
    'use strict';

    const SUITS = ['club','diamond','heart','spade'];
    const SUIT_SYMBOLS = {spade:'♠', heart:'♥', diamond:'♦', club:'♣'};
    const SUIT_COLORS = {spade:'black', club:'black', heart:'#cc0000', diamond:'#cc0000'};
    const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    
    let hands = [[],[],[],[]]; // 0=Player, 1=Left, 2=Top (Partner), 3=Right
    let teamScores = [0, 0]; // 0=Player+Top, 1=Left+Right
    let teamBags = [0, 0];
    let bids = [0,0,0,0];
    let tricksWon = [0,0,0,0];
    let trick = [];
    let spadesBroken = false;
    let turn = 0;
    let turnLeader = 0;
    let roundBidTurn = 0;
    let gameState = 'deal'; // deal, bid, play, end

    // --- Helpers ---
    function makeDeck(){let d=[];for(let s of SUITS)for(let r of RANKS)d.push({suit:s,rank:r});return d;}
    function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
    function ri(r){return RANKS.indexOf(r);}
    function cc(c){return SUIT_COLORS[c.suit];}
    function isSpade(c){return c.suit==='spade';}
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
        let container = document.getElementById('spades-container');
        if(!container) return;
        
        let t0Bid = bids[0]+bids[2];
        let t1Bid = bids[1]+bids[3];
        let t0Won = tricksWon[0]+tricksWon[2];
        let t1Won = tricksWon[1]+tricksWon[3];
        
        container.innerHTML = `
            <div style="position:absolute; top:0; left:0; right:0; height:30px; background:#005000; color:#fff; display:flex; justify-content:space-between; padding:0 10px; align-items:center; font-family:Tahoma; font-size:12px;">
                <span>Score: US (${teamScores[0]}) vs THEM (${teamScores[1]})</span>
                <span>${spadesBroken ? '♠ Spades Broken ♠' : 'Spades Intact'}</span>
            </div>
            
            <div style="position:absolute; top:35px; left:10px; color:#fff; font-size:12px; font-family:Tahoma;">
                US Bid: ${t0Bid} | Won: ${t0Won}<br>
                THEM Bid: ${t1Bid} | Won: ${t1Won}
            </div>
            
            <div id="s-top" style="position:absolute; top:40px; left:50%; transform:translateX(-50%); color:#fff; text-align:center;">
                Top AI (Partner)<br>${hands[2].length} cards<br>${gameState!=='bid'?'Bid: '+bids[2]:''}
            </div>
            <div id="s-left" style="position:absolute; top:50%; left:20px; transform:translateY(-50%); color:#fff; writing-mode:vertical-rl; text-align:center;">
                Left AI<br>${hands[1].length} cards<br>${gameState!=='bid'?'Bid: '+bids[1]:''}
            </div>
            <div id="s-right" style="position:absolute; top:50%; right:20px; transform:translateY(-50%); color:#fff; writing-mode:vertical-rl; text-align:center;">
                Right AI<br>${hands[3].length} cards<br>${gameState!=='bid'?'Bid: '+bids[3]:''}
            </div>
            
            <div id="s-center" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:150px; height:150px; position:relative;">
            </div>
            
            <div id="s-msg" style="position:absolute; bottom:120px; width:100%; text-align:center; color:yellow; font-family:Tahoma; font-weight:bold; font-size:14px; text-shadow:1px 1px 2px #000;"></div>
            
            <div id="s-player" style="position:absolute; bottom:10px; left:10px; right:10px; display:flex; justify-content:center;"></div>
        `;
        
        let msg = document.getElementById('s-msg');
        
        if(gameState==='bid'){
            if(roundBidTurn === 0){
                msg.innerHTML = `Your Bid: <input type="number" id="s-bid-val" min="0" max="13" value="3" style="width:40px;"> <button id="s-bid-btn">Place Bid</button>`;
                let btn = document.getElementById('s-bid-btn');
                if(btn) btn.onclick = placePlayerBid;
            } else {
                msg.innerText = `Waiting for others to bid...`;
            }
        } else if (gameState==='play') {
            msg.innerText = `Your Bid: ${bids[0]} | Won: ${tricksWon[0]}`;
        }

        renderTrick();
        renderPlayerHand();
    }

    function renderTrick(){
        let center = document.getElementById('s-center');
        if(!center) return;
        trick.forEach((t, i) => {
            let c = makeCardEl(t.card, false);
            c.style.position = 'absolute';
            if(t.player===0) { c.style.bottom='-40px'; c.style.left='40px'; }
            if(t.player===1) { c.style.top='30px'; c.style.left='-40px'; }
            if(t.player===2) { c.style.top='-40px'; c.style.left='40px'; }
            if(t.player===3) { c.style.top='30px'; c.style.left='120px'; }
            center.appendChild(c);
        });
    }

    function renderPlayerHand(){
        let ph = document.getElementById('s-player');
        if(!ph) return;
        hands[0].forEach((card, idx) => {
            let c = makeCardEl(card, false);
            c.style.position = 'relative';
            if(idx > 0) c.style.marginLeft = '-45px';
            if(gameState==='play' && turn===0){
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
    
    function aiBid(playerIdx){
        // Basic bidding strategy
        let hand = hands[playerIdx];
        let bid = 0;
        hand.forEach(c=>{
            if(c.suit==='spade') { if(ri(c.rank)>=8) bid++; } // high spades
            else { if(c.rank==='A' || c.rank==='K') bid++; } // high off-suit
        });
        if(bid === 0) {
            let hasHighSpades = hand.some(c => c.suit === 'spade' && ri(c.rank) >= 10);
            if (!hasHighSpades) bid = 0; // Bid Nil!
            else bid = 1;
        }
        return bid;
    }

    function processBids(){
        if(roundBidTurn === 0){
            render();
            return; // wait for player
        }
        bids[roundBidTurn] = aiBid(roundBidTurn);
        roundBidTurn = (roundBidTurn + 1) % 4;
        
        if(roundBidTurn === turnLeader){
            // all bids placed
            startPlayPhase();
        } else {
            setTimeout(processBids, 500);
        }
    }

    function placePlayerBid(){
        let v = parseInt(document.getElementById('s-bid-val').value);
        if(isNaN(v) || v<0 || v>13) return;
        bids[0] = v;
        roundBidTurn = (roundBidTurn + 1) % 4;
        
        if(roundBidTurn === turnLeader){
            startPlayPhase();
        } else {
            render();
            setTimeout(processBids, 500);
        }
    }

    function startPlayPhase(){
        gameState = 'play';
        spadesBroken = false;
        trick = [];
        turn = turnLeader;
        render();
        if(turn !== 0) setTimeout(aiTurn, 800);
    }

    function isValidPlay(hand, card, currentTrick){
        if(currentTrick.length === 0){
            if(!spadesBroken && isSpade(card)){
                let hasNonSpades = hand.some(c=>!isSpade(c));
                if(hasNonSpades) return false;
            }
            return true;
        } else {
            let leadSuit = currentTrick[0].card.suit;
            if(hasSuit(hand, leadSuit)){
                return card.suit === leadSuit;
            }
            return true;
        }
    }

    function playCard(playerIdx, cardIdx){
        if(gameState !== 'play') return;
        let card = hands[playerIdx].splice(cardIdx, 1)[0];
        if(isSpade(card)) spadesBroken = true;
        
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
        
        let bid = bids[turn];
        let won = tricksWon[turn];
        let needsTricks = won < bid;
        
        let chosenCard = validCards[0];
        if(trick.length > 0){
            let leadSuit = trick[0].card.suit;
            let suitCards = validCards.filter(c=>c.suit===leadSuit);
            if(suitCards.length>0){
                suitCards.sort((a,b)=>ri(a.rank)-ri(b.rank));
                if (needsTricks) chosenCard = suitCards[suitCards.length-1];
                else chosenCard = suitCards[0];
            } else {
                let spades = validCards.filter(c=>isSpade(c));
                validCards.sort((a,b)=>ri(a.rank)-ri(b.rank));
                if (spades.length > 0) {
                    spades.sort((a,b)=>ri(a.rank)-ri(b.rank));
                    if (needsTricks) chosenCard = spades[0];
                    else {
                        let nonSpades = validCards.filter(c=>!isSpade(c));
                        if (nonSpades.length > 0) chosenCard = nonSpades[nonSpades.length-1];
                        else chosenCard = spades[spades.length-1];
                    }
                } else {
                    chosenCard = validCards[validCards.length-1];
                }
            }
        } else {
             let nonSpades = validCards.filter(c=>!isSpade(c));
             validCards.sort((a,b)=>ri(a.rank)-ri(b.rank));
             if (nonSpades.length > 0) {
                 nonSpades.sort((a,b)=>ri(a.rank)-ri(b.rank));
                 if (needsTricks) chosenCard = nonSpades[nonSpades.length-1];
                 else chosenCard = nonSpades[0];
             } else {
                 if (needsTricks) chosenCard = validCards[validCards.length-1];
                 else chosenCard = validCards[0];
             }
        }

        let idx = hand.indexOf(chosenCard);
        playCard(turn, idx);
    }

    function resolveTrick(){
        let leadSuit = trick[0].card.suit;
        let highestRank = -1;
        let winner = -1;
        let trumpPlayed = trick.some(t=>isSpade(t.card));
        
        trick.forEach(t=>{
            if(trumpPlayed){
                if(isSpade(t.card) && ri(t.card.rank) > highestRank){
                    highestRank = ri(t.card.rank);
                    winner = t.player;
                }
            } else {
                if(t.card.suit === leadSuit && ri(t.card.rank) > highestRank){
                    highestRank = ri(t.card.rank);
                    winner = t.player;
                }
            }
        });
        
        tricksWon[winner]++;
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
        
        // Calculate scores
        for (let team = 0; team < 2; team++) {
            let p1 = team;
            let p2 = team + 2;
            let bid1 = bids[p1];
            let bid2 = bids[p2];
            let won1 = tricksWon[p1];
            let won2 = tricksWon[p2];
            
            let teamPoints = 0;
            let teamBagsEarned = 0;
            
            if (bid1 === 0) {
                if (won1 === 0) teamPoints += 100;
                else { teamPoints -= 100; teamBagsEarned += won1; }
            }
            if (bid2 === 0) {
                if (won2 === 0) teamPoints += 100;
                else { teamPoints -= 100; teamBagsEarned += won2; }
            }
            
            let regBid = (bid1 === 0 ? 0 : bid1) + (bid2 === 0 ? 0 : bid2);
            let regWon = (bid1 === 0 ? 0 : won1) + (bid2 === 0 ? 0 : won2);
            
            if (regBid > 0) {
                if (regWon >= regBid) {
                    teamPoints += (regBid * 10) + (regWon - regBid);
                    teamBagsEarned += (regWon - regBid);
                } else {
                    teamPoints -= (regBid * 10);
                }
            }
            
            teamScores[team] += teamPoints;
            teamBags[team] += teamBagsEarned;
            
            while (teamBags[team] >= 10) {
                teamScores[team] -= 100;
                teamBags[team] -= 10;
            }
        }
        
        render();
        
        if(teamScores[0] >= 500 || teamScores[1] >= 500){
            let winner = teamScores[0] > teamScores[1] ? "US!" : "THEM!";
            if (typeof window.playSound === 'function') window.playSound('notify');
            if(window.xpDialog) {
                window.xpDialog("Game Over", `Winner is ${winner}\nFinal Score:\nUS: ${teamScores[0]}\nTHEM: ${teamScores[1]}`, "info", () => {
                    window.spadesNewGame(false);
                });
            }
        } else {
            setTimeout(()=>{
                if(window.xpDialog) window.xpDialog("Round Over", "Next round starting...", "info", ()=>{
                    window.spadesNewGame(true);
                });
            }, 1000);
        }
    }

    // --- New Game ---
    window.spadesNewGame = function(keepScores = false){
        if(!keepScores) { teamScores = [0,0]; teamBags = [0,0]; turnLeader = 0; }
        else { turnLeader = (turnLeader + 1) % 4; }
        
        let deck = shuffle(makeDeck());
        hands = [[],[],[],[]];
        bids = [0,0,0,0];
        tricksWon = [0,0,0,0];
        for(let i=0; i<52; i++) hands[i%4].push(deck[i]);
        for(let i=0; i<4; i++) sortHand(hands[i]);
        
        spadesBroken = false;
        roundBidTurn = turnLeader;
        gameState = 'bid';
        
        render();
        processBids();
    };

})();
