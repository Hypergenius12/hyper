(function() {
    'use strict';

    const SUITS = ['spade','heart','diamond','club'];
    const SUIT_SYMBOLS = {spade:'♠', heart:'♥', diamond:'♦', club:'♣'};
    const SUIT_COLORS = {spade:'black', club:'black', heart:'#cc0000', diamond:'#cc0000'};
    const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const CARD_W = 71, CARD_H = 96, OVERLAP = 22;

    let freecells = [null, null, null, null]; // 4 cells
    let foundations = [[],[],[],[]]; // 4 piles
    let cascades = [[],[],[],[],[],[],[],[]]; // 8 columns
    let score = 0, timerVal = 0, timerInterval = null;
    let selected = null; // { cards:[], source:'cascade'|'freecell'|'foundation', col:number, row:number }

    // --- Helpers ---
    function makeDeck(){let d=[];for(let s of SUITS)for(let r of RANKS)d.push({suit:s,rank:r,faceUp:true});return d;}
    function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
    function ri(r){return RANKS.indexOf(r);}
    function cc(c){return SUIT_COLORS[c.suit];}
    function isRed(c){return c.suit==='heart'||c.suit==='diamond';}

    // --- Card DOM ---
    function makeCardEl(card, clickHandler){
        let el=document.createElement('div');
        el.className='sol-card';
        let color = cc(card);
        el.style.color = color;
        let sym = SUIT_SYMBOLS[card.suit];
        el.innerHTML=`<div class="sol-inner"><div class="sol-tl">${card.rank}<br>${sym}</div><div class="sol-center">${sym}</div><div class="sol-br">${card.rank}<br>${sym}</div></div>`;
        if(clickHandler) el.onclick = clickHandler;
        return el;
    }

    // --- Render entire board ---
    function render(){
        let container = document.getElementById('freecell-container');
        if(!container) return;
        container.innerHTML = `
            <div id="fc-status" style="position:absolute; bottom:0; left:0; right:0; height:20px; background:#006000; border-top:1px solid #004000; display:flex; align-items:center; justify-content:space-between; padding:0 10px; color:#aaffaa; font-family:Tahoma; font-size:11px;">
                <span id="fc-score">Score: ${score}</span>
                <span id="fc-time">Time: ${timerVal}</span>
            </div>
            <div id="fc-top-area" style="position:absolute; top:10px; left:10px; right:10px; display:flex; justify-content:space-between;">
                <div id="fc-freecells" style="display:flex; gap:8px;"></div>
                <div id="fc-foundations" style="display:flex; gap:8px;"></div>
            </div>
            <div id="fc-cascades" style="position:absolute; top:120px; left:10px; right:10px; display:flex; gap:8px; justify-content:center;"></div>
        `;
        
        renderFreeCells();
        renderFoundations();
        renderCascades();
    }

    function renderFreeCells(){
        let container=document.getElementById('fc-freecells');
        if(!container) return;
        for(let i=0;i<4;i++){
            let slot=document.createElement('div');
            slot.className='sol-slot';
            let card = freecells[i];
            if(card){
                let c = makeCardEl(card, (e) => { e.stopPropagation(); selectCard('freecell', i, 0); });
                if(selected && selected.source==='freecell' && selected.col===i) c.classList.add('sol-selected');
                slot.appendChild(c);
            } else {
                let ci=i;
                slot.onclick = () => placeOnFreeCell(ci);
            }
            container.appendChild(slot);
        }
    }

    function renderFoundations(){
        let container=document.getElementById('fc-foundations');
        if(!container) return;
        for(let i=0;i<4;i++){
            let slot=document.createElement('div');
            slot.className='sol-slot';
            let fPile = foundations[i];
            if(fPile.length===0){
                slot.innerHTML='<div class="sol-slot-label">A</div>';
            } else {
                let card=fPile[fPile.length-1];
                let c=makeCardEl(card, (e)=>{e.stopPropagation(); selectCard('foundation', i, fPile.length-1);});
                if(selected && selected.source==='foundation' && selected.col===i) c.classList.add('sol-selected');
                slot.appendChild(c);
            }
            let fi = i;
            slot.onclick = ()=>placeOnFoundation(fi);
            container.appendChild(slot);
        }
    }

    function renderCascades(){
        let container=document.getElementById('fc-cascades');
        if(!container) return;
        for(let col=0;col<8;col++){
            let colDiv=document.createElement('div');
            colDiv.className='sol-tab-col';
            let pile=cascades[col];
            if(pile.length===0){
                let emptySlot=document.createElement('div');
                emptySlot.className='sol-slot';
                let ci=col;
                emptySlot.onclick=()=>placeOnCascade(ci);
                colDiv.appendChild(emptySlot);
            } else {
                for(let row=0;row<pile.length;row++){
                    let card=pile[row];
                    let offset = row * OVERLAP;
                    let cr=col,rr=row;
                    let c=makeCardEl(card, (e)=>{e.stopPropagation(); selectCard('cascade',cr,rr);});
                    c.style.top=offset+'px';
                    c.style.left='0';
                    c.style.zIndex=row+1;
                    if(selected && selected.source==='cascade' && selected.col===col && row>=selected.row){
                        c.classList.add('sol-selected');
                    }
                    colDiv.appendChild(c);
                }
                let ci=col;
                colDiv.onclick=(e)=>{ if(e.target===colDiv) placeOnCascade(ci); };
            }
            container.appendChild(colDiv);
        }
    }

    // --- Selection & Placement ---
    function selectCard(source, col, row){
        if(selected){
            if(selected.source===source && selected.col===col && selected.row===row){
                selected=null; render(); return;
            }
            if(source==='cascade'){
                placeOnCascade(col); return;
            } else if(source==='freecell') {
                placeOnFreeCell(col); return;
            } else if(source==='foundation') {
                placeOnFoundation(col); return;
            }
        }
        
        // Can only pick single cards from freecells and foundations
        if(source==='freecell'){
            selected={cards:[freecells[col]], source:'freecell', col:col, row:0};
        } else if(source==='foundation'){
            let p = foundations[col];
            selected={cards:[p[p.length-1]], source:'foundation', col:col, row:p.length-1};
        } else if(source==='cascade'){
            let pile=cascades[col];
            let cards=pile.slice(row);
            // Verify if sequence is movable
            let validSeq = true;
            for(let i=0; i<cards.length-1; i++){
                if(isRed(cards[i]) === isRed(cards[i+1]) || ri(cards[i].rank) !== ri(cards[i+1].rank)+1){
                    validSeq = false; break;
                }
            }
            if(validSeq){
                selected={cards:cards, source:'cascade', col:col, row:row};
            }
        }
        render();
    }

    function maxMovableCards() {
        let emptyCells = freecells.filter(c => c===null).length;
        let emptyCascades = cascades.filter(c => c.length===0).length;
        // Formula: (emptyFreecells + 1) * 2^(emptyCascades)
        // Note: moving to an empty cascade reduces emptyCascades by 1 for the calculation.
        return (emptyCells + 1) * Math.pow(2, emptyCascades);
    }

    function placeOnCascade(destCol){
        if(!selected) return;
        let pile = cascades[destCol];
        let card = selected.cards[0];
        
        let movingToEmpty = (pile.length === 0);
        let maxCards = maxMovableCards();
        if(movingToEmpty && selected.source==='cascade') {
            maxCards = (freecells.filter(c => c===null).length + 1) * Math.pow(2, cascades.filter(c => c.length===0).length - 1);
        }
        
        if(selected.cards.length > maxCards) {
            selected = null; render(); return;
        }

        let canPlace = false;
        if(pile.length===0) canPlace = true;
        else {
            let top=pile[pile.length-1];
            if(isRed(card)!==isRed(top) && ri(card.rank)===ri(top.rank)-1) canPlace = true;
        }

        if(canPlace){
            moveCards(destCol);
        } else {
            // Invalid, try select instead
            let cPile = cascades[destCol];
            if(cPile.length>0){
                selected={cards:[cPile[cPile.length-1]], source:'cascade', col:destCol, row:cPile.length-1};
            } else {
                selected=null;
            }
        }
        render();
    }

    function placeOnFreeCell(fIdx){
        if(!selected || selected.cards.length!==1) { selected=null; render(); return; }
        if(freecells[fIdx]===null){
            let card = selected.cards[0];
            removeSelected();
            freecells[fIdx] = card;
            selected=null; render();
        } else {
            selected=null; render();
        }
    }

    function placeOnFoundation(fIdx){
        if(!selected || selected.cards.length!==1) { selected=null; render(); return; }
        let card = selected.cards[0];
        let pile=foundations[fIdx];
        let canPlace = false;
        if(pile.length===0) canPlace = (card.rank==='A');
        else {
            let top=pile[pile.length-1];
            canPlace = (card.suit===top.suit && ri(card.rank)===ri(top.rank)+1);
        }
        
        if(canPlace){
            removeSelected();
            foundations[fIdx].push(card);
            score+=10;
            selected=null; render(); checkWin();
        } else {
            selected=null; render();
        }
    }

    function removeSelected(){
        if(selected.source==='freecell') freecells[selected.col] = null;
        else if(selected.source==='cascade') cascades[selected.col].splice(selected.row);
        else if(selected.source==='foundation') foundations[selected.col].pop();
    }

    function moveCards(destCol){
        let removed = [];
        if(selected.source==='freecell') {
            removed = [freecells[selected.col]];
            freecells[selected.col] = null;
        } else if(selected.source==='cascade'){
            removed = cascades[selected.col].splice(selected.row);
        } else if(selected.source==='foundation'){
            removed = [foundations[selected.col].pop()];
        }
        cascades[destCol] = cascades[destCol].concat(removed);
        selected=null;
    }

    // --- Win ---
    function checkWin(){
        if(foundations.reduce((s,f)=>s+f.length,0)===52){
            clearInterval(timerInterval);
            if(typeof window.xpDialog==='function')
                window.xpDialog('Congratulations!','You won FreeCell!\n\nScore: '+score+'\nTime: '+timerVal+' seconds','info');
        }
    }

    // --- New Game ---
    window.freecellNewGame = function(){
        let deck = shuffle(makeDeck());
        freecells=[null,null,null,null]; foundations=[[],[],[],[]]; cascades=[[],[],[],[],[],[],[],[]];
        score=0;timerVal=0;selected=null;
        
        for(let i=0; i<52; i++){
            cascades[i % 8].push(deck[i]);
        }
        
        clearInterval(timerInterval);
        timerInterval=setInterval(()=>{
            timerVal++;
            let te=document.getElementById('fc-time');
            if(te) te.innerText='Time: '+timerVal;
        },1000);
        render();
    };

})();
