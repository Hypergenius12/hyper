let taskMgrTimer = null;
let cpuHistory = Array(60).fill(0);
let selectedTaskId = null;
let activeTab = 'apps';

const appMemoryMap = {
    'main-window': 28140,
    'tetris-window': 14560,
    'minesweeper-window': 4120,
    'solitaire-window': 6780,
    'pinball-window': 32450,
    'notepad-window': 2840,
    'wordpad-window': 5120,
    'paint-window': 18430,
    'mediaplayer-window': 22120,
    'soundrecorder-window': 3450,
    'calc-window': 2180,
    'cmd-window': 3890,
    'ie-window': 44120,
    'email-window': 15480,
    'sysinfo-window': 9870,
    'controlpanel-window': 12320,
    'settings-window': 8760,
    'help-window': 11540,
    'excel-window': 19450,
    'frontpage-window': 34120,
    'charmap-window': 2950,
    'clipbook-window': 1820,
    'store-window': 16340,
    'run-window': 1430
};

window.openTaskManager = function() {
    let win = document.getElementById('taskmgr-window');
    if(!win) return;
    
    if (typeof window.openProgram === 'function') {
        window.openProgram('taskmgr-window');
    }
    
    if (taskMgrTimer) clearInterval(taskMgrTimer);
    refreshTaskManager();
    taskMgrTimer = setInterval(refreshTaskManager, 1000);
};

window.closeTaskManager = function() {
    if (taskMgrTimer) {
        clearInterval(taskMgrTimer);
        taskMgrTimer = null;
    }
    if (typeof window.closeWindow === 'function') {
        window.closeWindow('taskmgr-window');
    }
};

window.switchTaskmgrTab = function(tab) {
    activeTab = tab;
    let appsBtn = document.getElementById('taskmgr-tab-btn-apps');
    let perfBtn = document.getElementById('taskmgr-tab-btn-perf');
    let appsPane = document.getElementById('taskmgr-tab-apps');
    let perfPane = document.getElementById('taskmgr-tab-perf');
    
    if (appsBtn) appsBtn.classList.toggle('active', tab === 'apps');
    if (perfBtn) perfBtn.classList.toggle('active', tab === 'perf');
    
    if (appsPane) appsPane.style.display = tab === 'apps' ? 'flex' : 'none';
    if (perfPane) perfPane.style.display = tab === 'perf' ? 'flex' : 'none';
    
    if (tab === 'perf') {
        setTimeout(drawCpuGraph, 50);
    }
};

window.refreshTaskManager = function() {
    // 1. Calculate active CPU usage per app
    let totalCpu = 1; // background Explorer usage
    let activeIds = Object.keys(window.activeWindows || {});
    
    let tbody = document.getElementById('taskmgr-tbody');
    let getAppCpu = (id) => {
        let baseCpu = 8;
        if (id === 'main-window' || id.includes('pinball') || id.includes('tetris') || id.includes('minesweeper')) baseCpu = 12;
        else if (id.includes('ie-window') || id.includes('excel') || id.includes('frontpage')) baseCpu = 10;
        else if (id.includes('notepad') || id.includes('calc') || id.includes('charmap')) baseCpu = 4;
        return baseCpu + Math.floor(Math.random() * 5);
    };

    if(tbody && activeTab === 'apps') {
        tbody.innerHTML = '';
        
        activeIds.forEach(id => {
            let titleText = (window.windowTitles && window.windowTitles[id]) ? window.windowTitles[id] : id;
            
            let appCpu = getAppCpu(id);
            totalCpu += appCpu;
            
            // Memory footprint formatting
            let baseMem = appMemoryMap[id] || 8500;
            let memVal = baseMem + Math.floor(Math.random() * 200) - 100;
            let memStr = memVal.toLocaleString() + ' K';
            
            let tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            if (selectedTaskId === id) {
                tr.style.background = '#0A246A';
                tr.style.color = 'white';
            }
            
            tr.onclick = () => {
                selectedTaskId = id;
                refreshTaskManager();
            };
            
            let tdTask = document.createElement('td');
            tdTask.style.padding = '2px 5px';
            tdTask.style.borderRight = '1px solid #ACA899';
            tdTask.innerText = titleText;
            
            let tdCpu = document.createElement('td');
            tdCpu.style.padding = '2px 5px';
            tdCpu.style.textAlign = 'right';
            tdCpu.style.borderRight = '1px solid #ACA899';
            tdCpu.innerText = appCpu + '%';
            
            let tdMem = document.createElement('td');
            tdMem.style.padding = '2px 5px';
            tdMem.style.textAlign = 'right';
            tdMem.style.borderRight = '1px solid #ACA899';
            tdMem.innerText = memStr;
            
            let tdStatus = document.createElement('td');
            tdStatus.style.padding = '2px 5px';
            tdStatus.style.textAlign = 'center';
            tdStatus.innerText = 'Running';
            
            tr.appendChild(tdTask);
            tr.appendChild(tdCpu);
            tr.appendChild(tdMem);
            tr.appendChild(tdStatus);
            
            tbody.appendChild(tr);
        });
    } else {
        // Just calculate total CPU even if tab is not active
        activeIds.forEach(id => {
            totalCpu += getAppCpu(id);
        });
    }
    
    if (totalCpu > 100) totalCpu = 100;
    if (totalCpu >= 95) {
        if (typeof window.triggerBSOD === 'function') {
            window.triggerBSOD();
        }
        return;
    }
    
    // 2. Add total CPU to history
    cpuHistory.shift();
    cpuHistory.push(totalCpu);
    
    // 3. Update Performance display
    let cpuPercentText = document.getElementById('taskmgr-cpu-percentage');
    if (cpuPercentText) {
        cpuPercentText.innerText = totalCpu + '%';
    }
    
    if (activeTab === 'perf') {
        drawCpuGraph();
    }
};

window.endSelectedTask = function() {
    if (selectedTaskId) {
        if(typeof window.closeWindow === 'function') {
            window.closeWindow(selectedTaskId);
            let prevSelected = selectedTaskId;
            selectedTaskId = null;
            refreshTaskManager();
            if(typeof window.showBalloon === 'function') {
                let name = (window.windowTitles && window.windowTitles[prevSelected]) ? window.windowTitles[prevSelected] : prevSelected;
                window.showBalloon("Task Manager", `Terminated process: ${name}`);
            }
        }
    } else {
        if(typeof window.xpDialog === 'function') {
            window.xpDialog('Task Manager', 'Please select a task from the list first.', 'info');
        }
    }
};

function drawCpuGraph() {
    let canvas = document.getElementById('taskmgr-cpu-canvas');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    let w = canvas.width = canvas.clientWidth;
    let h = canvas.height = canvas.clientHeight;
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    
    // Draw Grid
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 1;
    let gridSize = 15;
    for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    
    // Draw Line Graph
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    let step = w / (cpuHistory.length - 1);
    for (let i = 0; i < cpuHistory.length; i++) {
        let x = i * step;
        let y = h - (cpuHistory[i] / 100) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'Escape' || e.key === 'Esc')) {
        openTaskManager();
    }
});
