/* ============================================================
   MICROSOFT EXCEL (SIMULATION)
   ============================================================ */

(function() {
    'use strict';

    const COLS = 26; // A to Z
    const ROWS = 100;

    let data = {}; // Format: "A1": { v: "raw value", f: {bold:false, italic:false, underline:false, color:'black'} }
    let activeCell = "A1";
    let isEditing = false;
    let isDragging = false;
    let dragStartCell = null;
    let selectedRange = []; // array of cell IDs
    let currentFileName = "Book1";

    const head = document.getElementById('excel-head');
    const body = document.getElementById('excel-body');
    const formulaBar = document.getElementById('excel-formula-bar');
    const activeCellBox = document.getElementById('excel-active-cell');

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        #excel-grid th { background: #ECE9D8; border: 1px solid #ACA899; padding: 2px 5px; font-weight: normal; cursor: pointer; text-align: center; }
        #excel-grid td { border: 1px solid #D4D0C8; width: 80px; height: 20px; padding: 0 4px; overflow: hidden; white-space: nowrap; cursor: cell; text-align: left; background: white; user-select: none; }
        #excel-grid td.selected { border: 2px solid #000; outline: 1px solid #fff; outline-offset: -2px; }
        #excel-grid td.in-range { background-color: #E2ECF5; }
        #excel-grid td input.cell-editor { width: 100%; height: 100%; border: none; outline: none; font: inherit; background: transparent; padding: 0; margin: 0; box-sizing: border-box; }
        #excel-grid tbody th { width: 30px; }
    `;
    document.head.appendChild(style);

    function initGrid() {
        if (!head || !body) return;
        head.innerHTML = '';
        body.innerHTML = '';
        data = {};

        // Headers (A-Z)
        let trHead = document.createElement('tr');
        let thCorner = document.createElement('th');
        trHead.appendChild(thCorner);
        for(let i=0; i<COLS; i++) {
            let th = document.createElement('th');
            th.innerText = String.fromCharCode(65 + i);
            trHead.appendChild(th);
        }
        head.appendChild(trHead);

        // Rows (1-100)
        for(let r=1; r<=ROWS; r++) {
            let tr = document.createElement('tr');
            let th = document.createElement('th');
            th.innerText = r;
            tr.appendChild(th);
            for(let c=0; c<COLS; c++) {
                let td = document.createElement('td');
                let cellId = String.fromCharCode(65 + c) + r;
                td.id = 'cell-' + cellId;
                td.dataset.col = c;
                td.dataset.row = r;
                td.onmousedown = (e) => startDrag(cellId, e);
                td.onmouseover = (e) => dragOver(cellId, e);
                td.onmouseup = () => endDrag();
                td.ondblclick = () => editCell(cellId);
                tr.appendChild(td);
            }
            body.appendChild(tr);
        }
        document.body.addEventListener('mouseup', endDrag); // Backup
        selectCell("A1");
    }

    function getDefaultFormat() {
        return { bold: false, italic: false, underline: false, color: 'black' };
    }

    function selectCell(id) {
        if(isEditing) finishEdit();
        clearRange();
        if(activeCell) {
            let prev = document.getElementById('cell-' + activeCell);
            if(prev) prev.classList.remove('selected');
        }
        activeCell = id;
        selectedRange = [id];
        let cell = document.getElementById('cell-' + id);
        if(cell) {
            cell.classList.add('selected');
            cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
        activeCellBox.innerText = id;
        
        let cellData = data[id] || { v: "" };
        formulaBar.value = cellData.v || "";
    }

    function editCell(id) {
        let cell = document.getElementById('cell-' + id);
        if(!cell) return;
        isEditing = true;
        let cellData = data[id] || { v: "" };
        let input = document.createElement('input');
        input.className = 'cell-editor';
        input.value = cellData.v;
        
        // Apply styling to input
        if(cellData.f) {
            input.style.fontWeight = cellData.f.bold ? 'bold' : 'normal';
            input.style.fontStyle = cellData.f.italic ? 'italic' : 'normal';
            input.style.textDecoration = cellData.f.underline ? 'underline' : 'none';
            input.style.color = cellData.f.color;
        }

        input.onblur = finishEdit;
        input.onkeydown = (e) => {
            if(e.key === 'Enter') finishEdit();
        };

        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
    }

    function finishEdit() {
        if(!isEditing) return;
        let cell = document.getElementById('cell-' + activeCell);
        if(!cell) return;
        let input = cell.querySelector('input');
        if(input) {
            let val = input.value;
            if(!data[activeCell]) data[activeCell] = { v: "", f: getDefaultFormat() };
            data[activeCell].v = val;
        }
        isEditing = false;
        refreshGrid();
        formulaBar.value = data[activeCell]?.v || "";
    }

    function refreshGrid() {
        for(let r=1; r<=ROWS; r++) {
            for(let c=0; c<COLS; c++) {
                let id = String.fromCharCode(65 + c) + r;
                let cell = document.getElementById('cell-' + id);
                if(!cell) continue;
                if(isEditing && id === activeCell) continue;

                let cellData = data[id];
                if(cellData) {
                    if (document.getElementById('cell-' + activeCell) !== cell || !isEditing) {
                        cell.innerText = evaluateFormula(cellData.v);
                    }
                    if(cellData.f) {
                        cell.style.fontWeight = cellData.f.bold ? 'bold' : 'normal';
                        cell.style.fontStyle = cellData.f.italic ? 'italic' : 'normal';
                        cell.style.textDecoration = cellData.f.underline ? 'underline' : 'none';
                        cell.style.color = cellData.f.color;
                    }
                } else {
                    cell.innerText = "";
                    cell.style.cssText = ""; // reset
                }
            }
        }
    }

    function startDrag(id, e) {
        if(e && e.target.nodeName === 'INPUT') return;
        
        if (document.activeElement === formulaBar && formulaBar.value.startsWith('=')) {
            formulaBar.value += id;
            if(typeof window.excelFormulaInput === 'function') window.excelFormulaInput();
            setTimeout(() => formulaBar.focus(), 0);
            return;
        }

        if (isEditing) {
            let cell = document.getElementById('cell-' + activeCell);
            if (cell) {
                let input = cell.querySelector('input');
                if (input && input.value.startsWith('=')) {
                    input.value += id;
                    setTimeout(() => input.focus(), 0);
                    return;
                }
            }
        }
        
        isDragging = true;
        dragStartCell = id;
        selectCell(id);
    }

    function dragOver(id, e) {
        if(!isDragging || !dragStartCell) return;
        let startCol = dragStartCell.charCodeAt(0) - 65;
        let startRow = parseInt(dragStartCell.substring(1));
        let currCol = id.charCodeAt(0) - 65;
        let currRow = parseInt(id.substring(1));

        clearRange();
        selectedRange = [];
        for(let r = Math.min(startRow, currRow); r <= Math.max(startRow, currRow); r++) {
            for(let c = Math.min(startCol, currCol); c <= Math.max(startCol, currCol); c++) {
                let cid = String.fromCharCode(65 + c) + r;
                selectedRange.push(cid);
                let cNode = document.getElementById('cell-' + cid);
                if(cNode && cid !== activeCell) cNode.classList.add('in-range');
            }
        }
    }

    function endDrag() {
        isDragging = false;
    }

    function clearRange() {
        selectedRange.forEach(cid => {
            let n = document.getElementById('cell-' + cid);
            if(n) n.classList.remove('in-range');
        });
        selectedRange = [];
    }

    // A very basic parser for =SUM(A1:A5) or =A1+B1 or just math
    function evaluateFormula(expr, depth = 0) {
        if(depth > 10) return "#REF!"; // Prevent infinite recursion
        if(!expr || typeof expr !== 'string' || !expr.startsWith('=')) return expr;
        let content = expr.substring(1).toUpperCase().trim();
        
        // Handle SUM() / AVERAGE()
        let match = content.match(/^(SUM|AVERAGE)\(([A-Z][0-9]+):([A-Z][0-9]+)\)$/);
        if(match) {
            let op = match[1];
            let start = match[2];
            let end = match[3];
            let sum = 0, count = 0;
            
            let sCol = start.charCodeAt(0) - 65, sRow = parseInt(start.substring(1));
            let eCol = end.charCodeAt(0) - 65, eRow = parseInt(end.substring(1));
            
            for(let r = Math.min(sRow, eRow); r <= Math.max(sRow, eRow); r++) {
                for(let c = Math.min(sCol, eCol); c <= Math.max(sCol, eCol); c++) {
                    let cid = String.fromCharCode(65 + c) + r;
                    let cdata = data[cid] ? data[cid].v : "0";
                    // Attempt to parse evaluating it too
                    let valStr = evaluateFormula(cdata, depth + 1);
                    let val = parseFloat(valStr);
                    if(!isNaN(val)) {
                        sum += val;
                        count++;
                    }
                }
            }
            if(op === 'SUM') return sum.toString();
            if(op === 'AVERAGE') return count>0 ? (sum/count).toString() : "0";
        }

        // Extremely basic math evaluation (unsafe, using Function)
        // First replace cell refs with values
        let safeMath = content.replace(/[A-Z][0-9]+/g, function(ref) {
            let d = data[ref];
            let val = d ? evaluateFormula(d.v, depth + 1) : "0";
            return val==="" ? "0" : val;
        });

        // Basic validation so we don't eval arbitrary js easily
        if(/^[0-9+\-*/().\s]+$/.test(safeMath)) {
            try {
                return new Function('return ' + safeMath)().toString();
            } catch(e) {
                return "#ERROR";
            }
        }

        return "#ERROR";
    }

    // Global Hooks
    window.excelFormulaInput = function() {
        if(isEditing) {
            let input = document.getElementById('cell-' + activeCell).querySelector('input');
            if(input) input.value = formulaBar.value;
        } else {
            if(!data[activeCell]) data[activeCell] = { v: "", f: getDefaultFormat() };
            data[activeCell].v = formulaBar.value;
            refreshGrid();
        }
    };

    window.excelFormulaKey = function(e) {
        if(e.key === 'Enter') {
            if(isEditing) finishEdit();
            // Move down
            let col = activeCell.charAt(0);
            let row = parseInt(activeCell.substring(1));
            if(row < ROWS) selectCell(col + (row+1));
        }
    };

    window.excelFormat = function(type) {
        selectedRange.forEach(id => {
            if(!data[id]) data[id] = { v: "", f: getDefaultFormat() };
            let f = data[id].f;
            if(type === 'bold') f.bold = !f.bold;
            if(type === 'italic') f.italic = !f.italic;
            if(type === 'underline') f.underline = !f.underline;
        });
        refreshGrid();
    };

    window.excelColor = function(color) {
        selectedRange.forEach(id => {
            if(!data[id]) data[id] = { v: "", f: getDefaultFormat() };
            data[id].f.color = color;
        });
        refreshGrid();
    };

    window.getExcelData = function() {
        return data;
    };

    window.excelNew = function() {
        data = {};
        initGrid();
        currentFileName = "Book1";
        document.querySelector('#excel-window .title-bar span').innerHTML = '<img src="Windows XP Icons/Excel.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> Microsoft Excel - Book1';
    };

    window.excelSave = function() {
        if(typeof window.openFileDialog === 'function') {
            window.openFileDialog('save', currentFileName + '.xls', (info) => {
                let name = info.name || info.filename;
                if(!name) return;
                if(!name.toLowerCase().endsWith('.xls')) name += '.xls';
                let dir = window.resolvePath(info.path);
                if(dir) {
                    dir[name] = { type: 'file', extension: 'xls', content: JSON.stringify(data), icon: 'excel' };
                    currentFileName = name.replace('.xls', '');
                    document.querySelector('#excel-window .title-bar span').innerHTML = '<img src="Windows XP Icons/Excel.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> Microsoft Excel - ' + name;
                    if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
                    if(typeof window.renderDesktop === 'function') window.renderDesktop();
                    if(typeof window.showBalloon === 'function') window.showBalloon('Excel', 'Saved ' + name);
                    if(typeof window.markAppSaved === 'function') window.markAppSaved('excel-window', JSON.stringify(data));
                }
            }, ['.xls']);
        }
    };

    window.excelOpen = function() {
        if(typeof window.openFileDialog === 'function') {
            window.openFileDialog('open', '', (info) => {
                let name = info.name || info.filename;
                if(!name) return;
                let dir = window.resolvePath(info.path);
                if(dir && dir[name]) {
                    let item = dir[name];
                    if(item.extension === 'xls' && item.content) {
                        try {
                            data = JSON.parse(item.content);
                            currentFileName = name.replace('.xls', '');
                            document.querySelector('#excel-window .title-bar span').innerHTML = '<img src="Windows XP Icons/Excel.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> Microsoft Excel - ' + name;
                            refreshGrid();
                        } catch(e) {
                            if(typeof window.xpDialog === 'function') window.xpDialog('Excel', 'Could not parse file.', 'error');
                        }
                    } else {
                        if(typeof window.xpDialog === 'function') window.xpDialog('Excel', 'Invalid file format. Only .xls files are supported.', 'error');
                    }
                }
            }, ['.xls']);
        }
    };

    window.excelOpenDirect = function(filename, item) {
        try {
            data = JSON.parse(item.content);
            currentFileName = filename.replace('.xls', '');
            document.querySelector('#excel-window .title-bar span').innerHTML = '<img src="Windows XP Icons/Excel.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> Microsoft Excel - ' + filename;
            refreshGrid();
        } catch(e) {}
    };

    // --- Additional Excel Menu Functions ---
    window.excelClearAll = function() {
        data = {};
        refreshGrid();
    };

    window.excelDeleteRow = function() {
        let row = parseInt(activeCell.substring(1));
        for(let c = 0; c < COLS; c++) {
            let id = String.fromCharCode(65 + c) + row;
            delete data[id];
        }
        refreshGrid();
    };

    window.excelDeleteCol = function() {
        let col = activeCell.charAt(0);
        for(let r = 1; r <= ROWS; r++) {
            delete data[col + r];
        }
        refreshGrid();
    };

    window.excelSortAsc = function() {
        if(selectedRange.length < 2) { if(typeof window.xpDialog==='function') window.xpDialog('Sort','Select a range of cells first.','error'); return; }
        let vals = selectedRange.map(id => ({ id, v: data[id] ? data[id].v : '' }));
        vals.sort((a,b) => {
            let na = parseFloat(a.v), nb = parseFloat(b.v);
            if(!isNaN(na) && !isNaN(nb)) return na - nb;
            return (a.v||'').localeCompare(b.v||'');
        });
        selectedRange.forEach((id, i) => {
            if(!data[id]) data[id] = { v: '', f: getDefaultFormat() };
            data[id].v = vals[i].v;
        });
        refreshGrid();
    };

    window.excelSortDesc = function() {
        if(selectedRange.length < 2) { if(typeof window.xpDialog==='function') window.xpDialog('Sort','Select a range of cells first.','error'); return; }
        let vals = selectedRange.map(id => ({ id, v: data[id] ? data[id].v : '' }));
        vals.sort((a,b) => {
            let na = parseFloat(a.v), nb = parseFloat(b.v);
            if(!isNaN(na) && !isNaN(nb)) return nb - na;
            return (b.v||'').localeCompare(a.v||'');
        });
        selectedRange.forEach((id, i) => {
            if(!data[id]) data[id] = { v: '', f: getDefaultFormat() };
            data[id].v = vals[i].v;
        });
        refreshGrid();
    };

    window.excelInsertRow = function() {
        // Shift data down from current row
        let row = parseInt(activeCell.substring(1));
        for(let r = ROWS; r > row; r--) {
            for(let c = 0; c < COLS; c++) {
                let fromId = String.fromCharCode(65+c) + (r-1);
                let toId = String.fromCharCode(65+c) + r;
                if(data[fromId]) { data[toId] = JSON.parse(JSON.stringify(data[fromId])); delete data[fromId]; }
                else delete data[toId];
            }
        }
        for(let c = 0; c < COLS; c++) delete data[String.fromCharCode(65+c) + row];
        refreshGrid();
    };

    window.excelInsertCol = function() {
        let colIdx = activeCell.charCodeAt(0) - 65;
        for(let c = COLS-1; c > colIdx; c--) {
            for(let r = 1; r <= ROWS; r++) {
                let fromId = String.fromCharCode(65+c-1) + r;
                let toId = String.fromCharCode(65+c) + r;
                if(data[fromId]) { data[toId] = JSON.parse(JSON.stringify(data[fromId])); delete data[fromId]; }
                else delete data[toId];
            }
        }
        for(let r = 1; r <= ROWS; r++) delete data[String.fromCharCode(65+colIdx) + r];
        refreshGrid();
    };

    window.excelAutoSum = function() {
        // Insert =SUM for column above current cell
        let col = activeCell.charAt(0);
        let row = parseInt(activeCell.substring(1));
        if(row > 1) {
            let formula = '=SUM(' + col + '1:' + col + (row-1) + ')';
            if(!data[activeCell]) data[activeCell] = { v: '', f: getDefaultFormat() };
            data[activeCell].v = formula;
            formulaBar.value = formula;
            refreshGrid();
        }
    };

    window.excelFindReplace = function() {
        if(typeof window.xpDialog !== 'function') return;
        window.xpDialog('Find', 'Enter text to find:', 'prompt').then(findVal => {
            if(!findVal) return;
            window.xpDialog('Replace', 'Replace "' + findVal + '" with:', 'prompt').then(replaceVal => {
                if(replaceVal === false) return;
                let count = 0;
                for(let key in data) {
                    if(data[key].v && data[key].v.toLowerCase().includes(findVal.toLowerCase())) {
                        data[key].v = data[key].v.toLowerCase().split(findVal.toLowerCase()).join(replaceVal);
                        count++;
                    }
                }
                refreshGrid();
                window.xpDialog('Find and Replace', 'Replaced ' + count + ' occurrence(s).', 'info');
            });
        });
    };

    window.excelFreezeTopRow = function() {
        let grid = document.getElementById('excel-grid-container');
        let thead = document.getElementById('excel-head');
        if(thead) thead.style.position = thead.style.position === 'sticky' ? '' : 'sticky';
        if(thead) thead.style.top = thead.style.top === '0px' ? '' : '0px';
        if(typeof window.xpDialog === 'function') window.xpDialog('View', 'Header row ' + (thead.style.position === 'sticky' ? 'frozen.' : 'unfrozen.'), 'info');
    };

    window.excelCellAlignLeft = function() {
        selectedRange.forEach(id => {
            let cell = document.getElementById('cell-' + id);
            if(cell) cell.style.textAlign = 'left';
        });
    };
    window.excelCellAlignCenter = function() {
        selectedRange.forEach(id => {
            let cell = document.getElementById('cell-' + id);
            if(cell) cell.style.textAlign = 'center';
        });
    };
    window.excelCellAlignRight = function() {
        selectedRange.forEach(id => {
            let cell = document.getElementById('cell-' + id);
            if(cell) cell.style.textAlign = 'right';
        });
    };

    window.excelPrintPreview = function() {
        if(typeof window.xpDialog === 'function') window.xpDialog('Print Preview', 'Printer not found.\n\nPlease install a printer driver to use this feature.', 'error');
    };

    // Auto init
    initGrid();

})();
