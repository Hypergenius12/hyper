let defragBlocks = [];
let defragInterval = null;
let defragState = 'idle'; // idle, analyzing, defragmenting, paused
const NUM_BLOCKS = 800;
let currentBlocks = [];

function updateStatus(text, pct = null, subtext = '') {
    let tableStatus = document.getElementById('defrag-status-table');
    let bottomStatus = document.getElementById('defrag-status-bottom');
    let progContainer = document.getElementById('defrag-progress-container');
    
    if(tableStatus) tableStatus.innerText = text;
    
    let bottomStr = text;
    if(pct !== null) {
        bottomStr = `Defragmenting... ${pct}% ${subtext}`;
        if(progContainer) {
            progContainer.style.display = 'flex';
            progContainer.innerHTML = '';
            let numGreen = Math.floor((pct / 100) * 15);
            for(let i=0; i<numGreen; i++) {
                progContainer.innerHTML += '<div style="width:5px; height:8px; background:#00ff00;"></div>';
            }
        }
    } else {
        if(progContainer) progContainer.style.display = 'none';
    }
    if(bottomStatus) bottomStatus.innerText = bottomStr;
}

window.initDefrag = function() {
    let beforeDiv = document.getElementById('defrag-before');
    let afterDiv = document.getElementById('defrag-after');
    if(!beforeDiv || !afterDiv) return;
    
    beforeDiv.innerHTML = '';
    afterDiv.innerHTML = '';
    
    updateStatus('Idle');
    document.getElementById('defrag-btn-pause').innerText = 'Pause';
    
    let savedState = localStorage.getItem('xp_defrag_state');
    let lastSavedTime = localStorage.getItem('xp_defrag_time');
    let now = Date.now();
    
    if (savedState) {
        try {
            defragBlocks = JSON.parse(savedState);
            
            // Degrade over time
            if (lastSavedTime) {
                let elapsedMs = now - parseInt(lastSavedTime);
                let elapsedSeconds = elapsedMs / 1000;
                
                // For every 5 seconds elapsed, fragment 1% of contiguous/free space up to 50%
                let fragPercent = Math.min(0.5, (elapsedSeconds / 5) * 0.01);
                if (fragPercent > 0) {
                    defragBlocks.forEach(b => {
                        if ((b.type === 'contiguous' || b.type === 'free') && Math.random() < fragPercent) {
                            b.type = 'fragmented';
                        }
                    });
                    localStorage.setItem('xp_defrag_state', JSON.stringify(defragBlocks));
                    localStorage.setItem('xp_defrag_time', now.toString());
                }
            }
        } catch(e) {
            defragBlocks = null;
        }
    }
    
    if (!defragBlocks || defragBlocks.length !== NUM_BLOCKS) {
        defragBlocks = [];
        for(let i=0; i<NUM_BLOCKS; i++) {
            let type = 'free'; // white
            let r = Math.random();
            if(r < 0.35) type = 'fragmented'; // red
            else if(r < 0.65) type = 'contiguous'; // blue
            else if(r < 0.70) type = 'unmovable'; // green
            defragBlocks.push({ type: type, originalIndex: i });
        }
        localStorage.setItem('xp_defrag_state', JSON.stringify(defragBlocks));
        localStorage.setItem('xp_defrag_time', now.toString());
    }
    
    window.persistedDefragBlocks = JSON.parse(JSON.stringify(defragBlocks));
    renderDefragGrid(beforeDiv, defragBlocks);
};

function renderDefragGrid(container, blocks) {
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.alignContent = 'flex-start';
    container.style.width = '100%';
    
    let html = '';
    blocks.forEach(b => {
        let bg = 'white';
        if(b.type === 'fragmented') bg = 'red';
        else if(b.type === 'contiguous') bg = 'blue';
        else if(b.type === 'unmovable') bg = '#00ff00';
        html += `<div style="flex:1; height:100%; background:${bg};"></div>`;
    });
    container.innerHTML = html;
}

window.defragAnalyze = function() {
    if(defragState === 'analyzing' || defragState === 'defragmenting') return;
    defragState = 'analyzing';
    document.getElementById('defrag-btn-pause').innerText = 'Pause';
    updateStatus('Analyzing...');
    
    let beforeDiv = document.getElementById('defrag-before');
    let steps = 0;
    
    defragInterval = setInterval(() => {
        steps++;
        let pct = Math.floor((steps / 40) * 100);
        updateStatus(`Analyzing... ${pct}%`);
        
        let rIndex = Math.floor(Math.random() * NUM_BLOCKS);
        let blockDiv = beforeDiv.children[rIndex];
        if(blockDiv) blockDiv.style.background = 'yellow';
        
        setTimeout(() => {
            if(blockDiv && defragBlocks[rIndex]) {
                let type = defragBlocks[rIndex].type;
                let bg = 'white';
                if(type === 'fragmented') bg = 'red';
                else if(type === 'contiguous') bg = 'blue';
                else if(type === 'unmovable') bg = '#00ff00';
                blockDiv.style.background = bg;
            }
        }, 100);
        
        if(steps > 40) {
            clearInterval(defragInterval);
            defragState = 'idle';
            updateStatus('Analyzed');
            
            let total = defragBlocks.length;
            let fragmented = defragBlocks.filter(b => b.type === 'fragmented').length;
            let fragPct = Math.round((fragmented / total) * 100);
            let freeFragPct = Math.round((Math.random() * fragPct) * 0.3);
            let fileFragPct = Math.max(0, fragPct - freeFragPct);
            
            if(typeof window.xpDialog === 'function') {
                let msg = `Analysis is complete for: (C:)<br><br><b>Volume fragmentation</b><br>Total fragmentation: ${fragPct}%<br>File fragmentation: ${fileFragPct}%<br>Free space fragmentation: ${freeFragPct}%<br><br>`;
                if (fragPct > 15) {
                    msg += `You should defragment this volume.`;
                } else {
                    msg += `You do not need to defragment this volume.`;
                }
                window.xpDialog('Analysis Complete', msg, 'info');
            }
        }
    }, 50);
};

window.defragStart = function(resume = false) {
    if(defragState === 'defragmenting' || defragState === 'analyzing') return;
    defragState = 'defragmenting';
    document.getElementById('defrag-btn-pause').innerText = 'Pause';
    
    let afterDiv = document.getElementById('defrag-after');
    
    if(!resume) {
        currentBlocks = JSON.parse(JSON.stringify(defragBlocks));
        renderDefragGrid(afterDiv, currentBlocks);
    }
    
    let totalRed = currentBlocks.filter(b => b.type === 'fragmented').length;
    let initialRed = defragBlocks.filter(b => b.type === 'fragmented').length || 1;
    
    defragInterval = setInterval(() => {
        let redIndex = currentBlocks.findIndex(b => b.type === 'fragmented');
        
        if(redIndex === -1) {
            let whiteIndex = currentBlocks.findIndex(b => b.type === 'free');
            let blueAfterWhiteIndex = currentBlocks.findIndex((b, i) => b.type === 'contiguous' && i > whiteIndex);
            
            if(whiteIndex !== -1 && blueAfterWhiteIndex !== -1) {
                let temp = currentBlocks[whiteIndex];
                currentBlocks[whiteIndex] = currentBlocks[blueAfterWhiteIndex];
                currentBlocks[blueAfterWhiteIndex] = temp;
                renderDefragGrid(afterDiv, currentBlocks);
                updateStatus('Defragmenting...', 99, 'Compacting Files...');
            } else {
                clearInterval(defragInterval);
                defragState = 'idle';
                updateStatus('Defragmentation Complete');
                window.persistedDefragBlocks = JSON.parse(JSON.stringify(currentBlocks));
                defragBlocks = JSON.parse(JSON.stringify(currentBlocks));
                
                localStorage.setItem('xp_defrag_state', JSON.stringify(defragBlocks));
                localStorage.setItem('xp_defrag_time', Date.now().toString());
                
                if(typeof window.xpDialog === 'function') {
                    window.xpDialog('Defragmentation Complete', 'Defragmentation is complete for: (C:).<br><br>Total fragmentation: 0%', 'info');
                }
            }
            return;
        }
        
        currentBlocks[redIndex].type = 'contiguous';
        let swapIndex = Math.max(0, redIndex - Math.floor(Math.random() * 5 + 1));
        if(currentBlocks[swapIndex].type === 'unmovable') swapIndex = redIndex; // don't swap unmovable
        
        let temp = currentBlocks[redIndex];
        currentBlocks[redIndex] = currentBlocks[swapIndex];
        currentBlocks[swapIndex] = temp;
        
        totalRed--;
        let pct = Math.floor(((initialRed - totalRed) / initialRed) * 100);
        updateStatus('Defragmenting...', pct, 'Moving Files...');
        
        renderDefragGrid(afterDiv, currentBlocks);
        
    }, 40);
};

window.defragPause = function() {
    let btn = document.getElementById('defrag-btn-pause');
    if(defragState === 'defragmenting' || defragState === 'analyzing') {
        clearInterval(defragInterval);
        defragState = 'paused';
        updateStatus('Paused');
        if(btn) btn.innerText = 'Resume';
    } else if(defragState === 'paused') {
        if(btn) btn.innerText = 'Pause';
        defragStart(true);
    }
};

window.defragStop = function() {
    clearInterval(defragInterval);
    defragState = 'idle';
    updateStatus('Stopped');
    document.getElementById('defrag-btn-pause').innerText = 'Pause';
};

window.showDefragReport = function() {
    if (!defragBlocks && defragState === 'idle') {
        if (typeof window.xpDialog === 'function') window.xpDialog('Report', 'No report available yet. Run analysis first.', 'info');
        return;
    }
    
    let blocks = defragBlocks;
    let total = blocks.length;
    let fragmented = blocks.filter(b => b.type === 'fragmented').length;
    
    let fragPct = Math.round((fragmented / total) * 100);
    let freeFragPct = Math.round((Math.random() * fragPct) * 0.3); 
    let fileFragPct = Math.max(0, fragPct - freeFragPct);
    
    let msg = `Analysis report for: (C:)<br><br>
    <b>Volume fragmentation</b><br>
    Total fragmentation: ${fragPct}%<br>
    File fragmentation: ${fileFragPct}%<br>
    Free space fragmentation: ${freeFragPct}%<br><br>
    `;
    
    if (fragPct > 15) {
        msg += `You should defragment this volume.`;
    } else {
        msg += `You do not need to defragment this volume.`;
    }
    
    if (typeof window.xpDialog === 'function') window.xpDialog('Defragmentation Report', msg, 'info');
};
