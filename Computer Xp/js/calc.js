window.calcInput = function(val) {
    let win = document.querySelector('.window.active') || document.getElementById('calc-window');
    if (!win || !win.id.startsWith('calc-window')) win = document.getElementById('calc-window');
    if (!win) return;
    
    let display = win.querySelector('[id^="calc-display"]');
    if (!display) return;
    
    let calcExpression = win.dataset.expr || "0";
    let calcState = win.dataset.state || "number";
    
    if(calcState === "result" || (calcExpression === "0" && val !== ".")) {
        calcExpression = val;
        calcState = "number";
    } else {
        calcExpression += val;
    }
    
    win.dataset.expr = calcExpression;
    win.dataset.state = calcState;
    display.innerText = calcExpression;
};

window.calcOp = function(op) {
    let win = document.querySelector('.window.active') || document.getElementById('calc-window');
    if (!win || !win.id.startsWith('calc-window')) win = document.getElementById('calc-window');
    if (!win) return;
    
    let display = win.querySelector('[id^="calc-display"]');
    if (!display) return;
    
    let calcExpression = win.dataset.expr || "0";
    let calcState = win.dataset.state || "number";
    
    if(calcState !== "operator") {
        calcExpression += " " + op + " ";
        calcState = "operator";
    } else {
        calcExpression = calcExpression.slice(0, -3) + " " + op + " ";
    }
    
    win.dataset.expr = calcExpression;
    win.dataset.state = calcState;
    display.innerText = calcExpression;
};

window.calcEval = function() {
    let win = document.querySelector('.window.active') || document.getElementById('calc-window');
    if (!win || !win.id.startsWith('calc-window')) win = document.getElementById('calc-window');
    if (!win) return;
    
    let display = win.querySelector('[id^="calc-display"]');
    if (!display) return;
    
    let calcExpression = win.dataset.expr || "0";
    let calcState = win.dataset.state || "number";
    
    try {
        let result = eval(calcExpression.replace(/x/g, "*").replace(/÷/g, "/"));
        calcExpression = result.toString();
        calcState = "result";
        display.innerText = calcExpression;
    } catch(e) {
        display.innerText = "Error";
        calcExpression = "0";
        calcState = "number";
    }
    
    win.dataset.expr = calcExpression;
    win.dataset.state = calcState;
};

window.calcClear = function() {
    let win = document.querySelector('.window.active') || document.getElementById('calc-window');
    if (!win || !win.id.startsWith('calc-window')) win = document.getElementById('calc-window');
    if (!win) return;
    
    let display = win.querySelector('[id^="calc-display"]');
    if (!display) return;
    
    win.dataset.expr = "0";
    win.dataset.state = "number";
    display.innerText = "0";
};

window.calcSci = function(func) {
    let win = document.querySelector('.window.active') || document.getElementById('calc-window');
    if (!win || !win.id.startsWith('calc-window')) win = document.getElementById('calc-window');
    if (!win) return;
    
    let display = win.querySelector('[id^="calc-display"]');
    if (!display) return;
    
    let calcExpression = win.dataset.expr || "0";
    let calcState = win.dataset.state || "number";
    
    try {
        let val = parseFloat(calcExpression.split(" ").pop() || 0);
        let res = 0;
        switch(func) {
            case 'sin': res = Math.sin(val); break;
            case 'cos': res = Math.cos(val); break;
            case 'tan': res = Math.tan(val); break;
            case 'log': res = Math.log10(val); break;
            case 'ln': res = Math.log(val); break;
            case 'sqrt': res = Math.sqrt(val); break;
            case 'sq': res = val * val; break;
        }
        
        let parts = calcExpression.split(" ");
        parts[parts.length-1] = res.toString();
        calcExpression = parts.join(" ");
        calcState = "number";
        display.innerText = calcExpression;
    } catch (e) {
        display.innerText = "Error";
        calcExpression = "0";
        calcState = "number";
    }
    
    win.dataset.expr = calcExpression;
    win.dataset.state = calcState;
};

window.toggleSciView = function(isSci) {
    let win = document.querySelector('.window.active') || document.getElementById('calc-window');
    if (!win || !win.id.startsWith('calc-window')) win = document.getElementById('calc-window');
    if (!win) return;
    
    let sciPanel = win.querySelector('[id^="calc-sci-panel"]');
    let stdPanel = win.querySelector('[id^="calc-std-panel"]');
    let progPanel = win.querySelector('[id^="calc-prog-panel"]');
    
    if(isSci === 'sci') {
        win.style.width = '420px';
        if(sciPanel) sciPanel.style.display = 'grid';
        if(stdPanel) stdPanel.style.gridColumn = '3 / 6';
        if(progPanel) progPanel.style.display = 'none';
    } else if(isSci === 'prog') {
        win.style.width = '420px';
        if(sciPanel) sciPanel.style.display = 'none';
        if(stdPanel) stdPanel.style.gridColumn = '3 / 6';
        if(progPanel) progPanel.style.display = 'grid';
    } else {
        win.style.width = '260px';
        if(sciPanel) sciPanel.style.display = 'none';
        if(progPanel) progPanel.style.display = 'none';
        if(stdPanel) stdPanel.style.gridColumn = '1 / 5';
    }
};

window.calcCopy = function() {
    let win = document.querySelector('.window.active') || document.getElementById('calc-window');
    if (!win || !win.id.startsWith('calc-window')) win = document.getElementById('calc-window');
    if (!win) return;
    
    let display = win.querySelector('[id^="calc-display"]');
    if (display && navigator.clipboard) {
        navigator.clipboard.writeText(display.innerText);
    }
};

window.calcPaste = function() {
    let win = document.querySelector('.window.active') || document.getElementById('calc-window');
    if (!win || !win.id.startsWith('calc-window')) win = document.getElementById('calc-window');
    if (!win) return;
    
    if (navigator.clipboard) {
        navigator.clipboard.readText().then(text => {
            if (!isNaN(text)) {
                let calcExpression = win.dataset.expr || "0";
                let calcState = win.dataset.state || "number";
                
                if(calcState === "result" || (calcExpression === "0")) {
                    calcExpression = text;
                    calcState = "number";
                } else {
                    calcExpression += text;
                }
                
                win.dataset.expr = calcExpression;
                win.dataset.state = calcState;
                let display = win.querySelector('[id^="calc-display"]');
                if(display) display.innerText = calcExpression;
            }
        });
    }
};

window.calcBaseToggle = function(base) {
    let win = document.querySelector('.window.active') || document.getElementById('calc-window');
    if (!win || !win.id.startsWith('calc-window')) win = document.getElementById('calc-window');
    if (!win) return;
    
    let display = win.querySelector('[id^="calc-display"]');
    if (!display) return;
    
    let calcExpression = win.dataset.expr || "0";
    let val = parseInt(calcExpression.split(" ").pop() || 0, 10);
    if(isNaN(val)) return;
    
    let res = "";
    switch(base) {
        case 'hex': res = val.toString(16).toUpperCase(); break;
        case 'dec': res = val.toString(10); break;
        case 'oct': res = val.toString(8); break;
        case 'bin': res = val.toString(2); break;
    }
    
    let parts = calcExpression.split(" ");
    parts[parts.length-1] = res;
    calcExpression = parts.join(" ");
    win.dataset.expr = calcExpression;
    display.innerText = calcExpression;
};
