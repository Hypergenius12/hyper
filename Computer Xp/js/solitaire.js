/* ============================================================
   SOLITAIRE (KLONDIKE) — FULL GAME ENGINE
   Click-to-select, click-to-place card movement system.
   ============================================================ */

(function() {
    'use strict';

    const SUITS = ['spade','heart','diamond','club'];
    const SUIT_SYMBOLS = {spade:'♠', heart:'♥', diamond:'♦', club:'♣'};
    const SUIT_COLORS = {spade:'black', club:'black', heart:'#cc0000', diamond:'#cc0000'};
    const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const CARD_W = 71, CARD_H = 96, OVERLAP = 18, FACE_OVERLAP = 22;

    let stock = [], waste = [], foundations = [[],[],[],[]], tableau = [[],[],[],[],[],[],[]];
    let score = 0, timerVal = 0, timerInterval = null;
    let selected = null; // { cards:[], source:'waste'|'tableau'|'foundation', col:number, row:number }

    // --- Inject CSS ---
    

    // --- Helpers ---
    function makeDeck(){let d=[];for(let s of SUITS)for(let r of RANKS)d.push({suit:s,rank:r,faceUp:false});return d;}
    function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
    function ri(r){return RANKS.indexOf(r);}
    function cc(c){return SUIT_COLORS[c.suit];}
    function isRed(c){return c.suit==='heart'||c.suit==='diamond';}

    // --- Card DOM ---
    function makeCardEl(card, clickHandler){
        let el=document.createElement('div');
        el.className='sol-card';
        if(!card.faceUp){el.classList.add('sol-card-back');return el;}
        let color = cc(card);
        el.style.color = color;
        let sym = SUIT_SYMBOLS[card.suit];
        el.innerHTML=`<div class="sol-inner"><div class="sol-tl">${card.rank}<br>${sym}</div><div class="sol-center">${sym}</div><div class="sol-br">${card.rank}<br>${sym}</div></div>`;
        if(clickHandler) el.onclick = clickHandler;
        return el;
    }

    // --- Render entire board ---
    function render(){
        renderStock(); renderWaste(); renderFoundations(); renderTableau();
        let se=document.getElementById('sol-score');
        if(se) se.innerText='Score: '+score;
    }

    function renderStock(){
        let el=document.getElementById('sol-stock');
        if(!el) return;
        el.innerHTML='';
        el.className='sol-slot';
        el.onclick = null;
        if(stock.length===0){
            el.classList.add('sol-empty-stock');
            el.innerHTML='<div class="sol-slot-label">↻</div>';
            el.onclick = recycleWaste;
        } else {
            let c = makeCardEl({suit:'spade',rank:'A',faceUp:false});
            c.style.position='relative';
            el.appendChild(c);
            el.onclick = drawFromStock;
        }
    }

    function renderWaste(){
        let el=document.getElementById('sol-waste');
        if(!el) return;
        el.innerHTML='';
        el.className='sol-slot';
        if(waste.length>0){
            let card=waste[waste.length-1];
            card.faceUp=true;
            let c=makeCardEl(card, ()=>selectCard('waste',0,waste.length-1));
            c.style.position='relative';
            if(selected && selected.source==='waste') c.classList.add('sol-selected');
            el.appendChild(c);
        }
    }

    function renderFoundations(){
        let container=document.getElementById('sol-foundations');
        if(!container) return;
        container.innerHTML='';
        for(let i=0;i<4;i++){
            let slot=document.createElement('div');
            slot.className='sol-slot';
            slot.style.position='relative';
            let fPile = foundations[i];
            if(fPile.length===0){
                slot.innerHTML='<div class="sol-slot-label">A</div>';
            } else {
                let card=fPile[fPile.length-1];
                card.faceUp=true;
                let c=makeCardEl(card, null);
                c.style.position='relative';
                slot.appendChild(c);
            }
            // Click to place onto foundation
            let fi = i;
            slot.onclick = ()=>placeOnFoundation(fi);
            container.appendChild(slot);
        }
    }

    function renderTableau(){
        let container=document.getElementById('sol-tableau');
        if(!container) return;
        container.innerHTML='';
        for(let col=0;col<7;col++){
            let colDiv=document.createElement('div');
            colDiv.className='sol-tab-col';
            let pile=tableau[col];
            if(pile.length===0){
                let emptySlot=document.createElement('div');
                emptySlot.className='sol-slot';
                emptySlot.style.position='relative';
                let ci=col;
                emptySlot.onclick=()=>placeOnTableau(ci);
                colDiv.appendChild(emptySlot);
            } else {
                for(let row=0;row<pile.length;row++){
                    let card=pile[row];
                    let offset = 0;
                    for(let r2=0;r2<row;r2++) offset += pile[r2].faceUp ? FACE_OVERLAP : OVERLAP;
                    let c=makeCardEl(card, card.faceUp ? (()=>{let cr=col,rr=row;selectCard('tableau',cr,rr);}) : null);
                    c.style.top=offset+'px';
                    c.style.left='0';
                    c.style.zIndex=row+1;
                    // If it's the last face-down card, clicking flips it
                    if(!card.faceUp && row===pile.length-1){
                        c.style.cursor='pointer';
                        let ci2=col;
                        c.onclick=()=>{flipTop(ci2);};
                    }
                    // Highlight selected
                    if(selected && selected.source==='tableau' && selected.col===col && row>=selected.row){
                        c.classList.add('sol-selected');
                    }
                    colDiv.appendChild(c);
                }
                // Click empty area below cards to place
                let ci3=col;
                colDiv.onclick=(e)=>{
                    if(e.target===colDiv) placeOnTableau(ci3);
                };
            }
            container.appendChild(colDiv);
        }
    }

    // --- Selection & Placement ---
    function selectCard(source, col, row){
        if(selected){
            // If clicking same selection, deselect
            if(selected.source===source && selected.col===col && selected.row===row){
                selected=null; render(); return;
            }
            // If clicking a tableau card while something is selected, try to place
            if(source==='tableau'){
                placeOnTableau(col);
                return;
            }
        }
        // Select new cards
        if(source==='waste'){
            selected={cards:[waste[waste.length-1]], source:'waste', col:0, row:waste.length-1};
        } else if(source==='tableau'){
            let pile=tableau[col];
            let cards=pile.slice(row);
            selected={cards:cards, source:'tableau', col:col, row:row};
        }
        render();
    }

    function placeOnTableau(destCol){
        if(!selected) return;
        let card = selected.cards[0];
        if(canPlaceOnTableau(card, destCol)){
            // Move cards
            if(selected.source==='waste'){
                tableau[destCol].push(waste.pop());
                score+=5;
            } else if(selected.source==='tableau'){
                let removed = tableau[selected.col].splice(selected.row);
                tableau[destCol] = tableau[destCol].concat(removed);
                flipTopAuto(selected.col);
                score+=3;
            } else if(selected.source==='foundation'){
                tableau[destCol].push(foundations[selected.col].pop());
                score = Math.max(0, score-15);
            }
            selected=null;
            render(); checkWin();
        } else {
            // Invalid, try selecting instead
            let pile = tableau[destCol];
            if(pile.length>0){
                // Find the first face up card to select
                for(let i=pile.length-1;i>=0;i--){
                    if(pile[i].faceUp){
                        selected={cards:pile.slice(i), source:'tableau', col:destCol, row:i};
                        render(); return;
                    }
                }
            }
            selected=null; render();
        }
    }

    function placeOnFoundation(fIdx){
        if(!selected || selected.cards.length!==1) {
            // Try auto-move: if nothing selected but user double-clicked, ignore
            if(!selected) return;
            selected=null; render(); return;
        }
        let card = selected.cards[0];
        if(canPlaceOnFoundation(card, fIdx)){
            if(selected.source==='waste') waste.pop();
            else if(selected.source==='tableau'){
                tableau[selected.col].pop();
                flipTopAuto(selected.col);
            }
            foundations[fIdx].push(card);
            score+=10;
            selected=null;
            render(); checkWin();
        } else {
            selected=null; render();
        }
    }

    // Auto-move to foundation on double-click
    function autoFoundation(card, source, col, row){
        for(let i=0;i<4;i++){
            if(canPlaceOnFoundation(card, i)){
                if(source==='waste') waste.pop();
                else if(source==='tableau'){
                    if(row!==tableau[col].length-1) return;
                    tableau[col].pop();
                    flipTopAuto(col);
                }
                foundations[i].push(card);
                score+=10;
                selected=null;
                render(); checkWin(); return;
            }
        }
    }

    // --- Rules ---
    function canPlaceOnFoundation(card,fIdx){
        let pile=foundations[fIdx];
        if(pile.length===0) return card.rank==='A';
        let top=pile[pile.length-1];
        return card.suit===top.suit && ri(card.rank)===ri(top.rank)+1;
    }
    function canPlaceOnTableau(card,colIdx){
        let pile=tableau[colIdx];
        if(pile.length===0) return card.rank==='K';
        let top=pile[pile.length-1];
        if(!top.faceUp) return false;
        return isRed(card)!==isRed(top) && ri(card.rank)===ri(top.rank)-1;
    }
    function flipTopAuto(colIdx){
        let pile=tableau[colIdx];
        if(pile.length>0 && !pile[pile.length-1].faceUp){pile[pile.length-1].faceUp=true;score+=5;}
    }
    function flipTop(colIdx){
        let pile=tableau[colIdx];
        if(pile.length>0 && !pile[pile.length-1].faceUp){
            pile[pile.length-1].faceUp=true;score+=5;render();
        }
    }

    // --- Stock / Waste ---
    function drawFromStock(e){
        if(e) e.stopPropagation();
        selected=null;
        if(stock.length===0) return;
        let card=stock.pop(); card.faceUp=true; waste.push(card);
        render();
    }
    function recycleWaste(e){
        if(e) e.stopPropagation();
        selected=null;
        if(waste.length===0) return;
        stock=waste.reverse().map(c=>{c.faceUp=false;return c;});
        waste=[];
        score=Math.max(0,score-20);
        render();
    }

    // --- Win ---
    function checkWin(){
        if(foundations.reduce((s,f)=>s+f.length,0)===52){
            clearInterval(timerInterval);
            if(typeof window.xpDialog==='function')
                window.xpDialog('Congratulations!','You won Solitaire!\n\nScore: '+score+'\nTime: '+timerVal+' seconds','info');
        }
    }

    // --- New Game ---
    window.solNewGame = function(){
        let deck = shuffle(makeDeck());
        stock=[];waste=[];foundations=[[],[],[],[]];tableau=[[],[],[],[],[],[],[]];
        score=0;timerVal=0;selected=null;
        let idx=0;
        for(let col=0;col<7;col++){
            for(let row=0;row<=col;row++){
                let card=deck[idx++];
                card.faceUp = (row===col);
                tableau[col].push(card);
            }
        }
        stock=deck.slice(idx);
        stock.forEach(c=>c.faceUp=false);
        clearInterval(timerInterval);
        timerInterval=setInterval(()=>{
            timerVal++;
            let te=document.getElementById('sol-time');
            if(te) te.innerText='Time: '+timerVal;
        },1000);
        render();
    };

    // Don't auto-init, wait for user to open the window
})();

