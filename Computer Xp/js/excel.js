/* ============================================================
   MICROSOFT EXCEL (SIMULATION) - FULL XP EDITION
   Features: Multi-Sheet Tabs, Draggable Resizing, Formula Bar (fx)
             with Function Wizard (SUM, AVERAGE, COUNT, MAX, MIN, IF)
   ============================================================ */

(function() {
    'use strict';

    const COLS = 26; // A to Z
    const ROWS = 100;

    let sheets = {
        'Sheet1': {},
        'Sheet2': {},
        'Sheet3': {}
    };
    let activeSheetName = 'Sheet1';
    let data = sheets[activeSheetName];
    let colWidths = {};
    let rowHeights = {};

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
        #excel-grid th { background: #ECE9D8; border: 1px solid #ACA899; padding: 2px 5px; font-weight: normal; cursor: pointer; text-align: center; position: relative; user-select: none; }
        #excel-grid td { border: 1px solid #D4D0C8; width: 80px; height: 20px; padding: 0 4px; overflow: hidden; white-space: nowrap; cursor: cell; text-align: left; background: white; user-select: none; }
        #excel-grid td.selected { border: 2px solid #000; outline: 1px solid #fff; outline-offset: -2px; }
        #excel-grid td.in-range { background-color: #E2ECF5; }
        #excel-grid td input.cell-editor { width: 100%; height: 100%; border: none; outline: none; font: inherit; background: transparent; padding: 0; margin: 0; box-sizing: border-box; }
        #excel-grid tbody th { width: 35px; }
        .excel-col-resizer { position: absolute; right: 0; top: 0; bottom: 0; width: 5px; cursor: col-resize; z-index: 10; }
        .excel-row-resizer { position: absolute; left: 0; right: 0; bottom: 0; height: 5px; cursor: row-resize; z-index: 10; }
        .excel-sheet-tab {
            padding: 3px 12px;
            font-family: Tahoma, sans-serif;
            font-size: 11px;
            cursor: pointer;
            border-top: 1px solid #ACA899;
            border-left: 1px solid #ACA899;
            border-right: 1px solid #ACA899;
            border-bottom: none;
            background: #ECE9D8;
            color: #000;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .excel-sheet-tab.active {
            background: #FFFFFF;
            font-weight: bold;
            border-top: 2px solid #3A6EA5;
            border-left: 1px solid #7F9DB9;
            border-right: 1px solid #7F9DB9;
            box-shadow: 0 -1px 3px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);

    function initGrid() {
        if (!head || !body) return;
        head.innerHTML = '';
        body.innerHTML = '';

        // Headers (A-Z)
        let trHead = document.createElement('tr');
        let thCorner = document.createElement('th');
        thCorner.style.width = '35px';
        trHead.appendChild(thCorner);
        for(let i=0; i<COLS; i++) {
            let th = document.createElement('th');
            let colChar = String.fromCharCode(65 + i);
            th.innerText = colChar;
            th.dataset.col = i;
            if(colWidths[i]) {
                th.style.width = colWidths[i] + 'px';
            }

            // Draggable Col Resizer
            let resizer = document.createElement('div');
            resizer.className = 'excel-col-resizer';
            resizer.addEventListener('mousedown', (e) => startColResize(i, th, e));
            th.appendChild(resizer);

            trHead.appendChild(th);
        }
        head.appendChild(trHead);

        // Rows (1-100)
        for(let r=1; r<=ROWS; r++) {
            let tr = document.createElement('tr');
            tr.dataset.row = r;
            if(rowHeights[r]) {
                tr.style.height = rowHeights[r] + 'px';
            }

            let th = document.createElement('th');
            th.innerText = r;

            // Draggable Row Resizer
            let resizer = document.createElement('div');
            resizer.className = 'excel-row-resizer';
            resizer.addEventListener('mousedown', (e) => startRowResize(r, tr, e));
            th.appendChild(resizer);

            tr.appendChild(th);

            for(let c=0; c<COLS; c++) {
                let td = document.createElement('td');
                let cellId = String.fromCharCode(65 + c) + r;
                td.id = 'cell-' + cellId;
                td.dataset.col = c;
                td.dataset.row = r;
                if(colWidths[c]) {
                    td.style.width = colWidths[c] + 'px';
                    td.style.minWidth = colWidths[c] + 'px';
                }
                td.onmousedown = (e) => startDrag(cellId, e);
                td.onmouseover = (e) => dragOver(cellId, e);
                td.onmouseup = () => endDrag();
                td.ondblclick = () => editCell(cellId);
                tr.appendChild(td);
            }
            body.appendChild(tr);
        }
        document.body.addEventListener('mouseup', endDrag); // Backup
        renderExcelSheetTabs();
        selectCell("A1");
    }

    // --- Draggable Resizing Handlers ---
    function startColResize(colIdx, th, e) {
        e.stopPropagation();
        e.preventDefault();
        let startX = e.clientX;
        let startW = th.offsetWidth;

        function onMouseMove(ev) {
            let diff = ev.clientX - startX;
            let newW = Math.max(25, startW + diff);
            colWidths[colIdx] = newW;
            th.style.width = newW + 'px';
            let cells = body.querySelectorAll(`td[data-col="${colIdx}"]`);
            cells.forEach(td => {
                td.style.width = newW + 'px';
                td.style.minWidth = newW + 'px';
            });
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function startRowResize(rowNum, tr, e) {
        e.stopPropagation();
        e.preventDefault();
        let startY = e.clientY;
        let startH = tr.offsetHeight;

        function onMouseMove(ev) {
            let diff = ev.clientY - startY;
            let newH = Math.max(16, startH + diff);
            rowHeights[rowNum] = newH;
            tr.style.height = newH + 'px';
            let th = tr.querySelector('th');
            if (th) th.style.height = newH + 'px';
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    // --- Multi-Sheet Tabs Management ---
    function renderExcelSheetTabs() {
        let container = document.getElementById('excel-sheet-tabs');
        if (!container) return;
        container.innerHTML = '';

        Object.keys(sheets).forEach(sName => {
            let tab = document.createElement('div');
            tab.className = 'excel-sheet-tab' + (sName === activeSheetName ? ' active' : '');
            tab.innerText = sName;
            tab.onclick = () => window.excelSwitchSheet(sName);
            tab.ondblclick = (e) => {
                e.stopPropagation();
                window.excelRenameSheet(sName);
            };
            container.appendChild(tab);
        });
    }

    window.excelSwitchSheet = function(sName) {
        if (!sheets[sName]) return;
        if (isEditing) finishEdit();
        sheets[activeSheetName] = data;
        activeSheetName = sName;
        data = sheets[sName] || (sheets[sName] = {});
        renderExcelSheetTabs();
        refreshGrid();
        selectCell("A1");
    };

    window.excelAddSheet = function() {
        let count = Object.keys(sheets).length + 1;
        let nextName = 'Sheet' + count;
        while (sheets[nextName]) {
            count++;
            nextName = 'Sheet' + count;
        }
        sheets[nextName] = {};
        window.excelSwitchSheet(nextName);
    };

    window.excelRenameSheet = function(oldName) {
        if (typeof window.xpDialog === 'function') {
            window.xpDialog('Rename Sheet', 'Enter new worksheet name:', 'prompt').then(newName => {
                if (newName && newName.trim() && newName.trim() !== oldName) {
                    let clean = newName.trim();
                    if (sheets[clean]) {
                        window.xpDialog('Excel', 'A sheet with that name already exists.', 'error');
                        return;
                    }
                    sheets[clean] = sheets[oldName];
                    delete sheets[oldName];
                    if (activeSheetName === oldName) activeSheetName = clean;
                    renderExcelSheetTabs();
                }
            });
        }
    };

    window.excelScrollTabs = function(dir) {
        let container = document.getElementById('excel-sheet-tabs');
        if (container) {
            container.scrollLeft += dir * 80;
        }
    };

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
        if(activeCellBox) activeCellBox.innerText = id;
        
        let cellData = data[id] || { v: "" };
        if(formulaBar) formulaBar.value = cellData.v || "";
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
        if(formulaBar) formulaBar.value = data[activeCell]?.v || "";
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
                    cell.style.cssText = "";
                    if(colWidths[c]) {
                        cell.style.width = colWidths[c] + 'px';
                        cell.style.minWidth = colWidths[c] + 'px';
                    }
                }
            }
        }
    }

    function startDrag(id, e) {
        if(e && e.target.nodeName === 'INPUT') return;
        
        if (formulaBar && document.activeElement === formulaBar && formulaBar.value.startsWith('=')) {
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

    // Helper: evaluate values from a range string (e.g. A1:B3)
    function getRangeCells(rangeStr) {
        let parts = rangeStr.toUpperCase().trim().split(':');
        if (parts.length === 1) return [parts[0]];
        let start = parts[0], end = parts[1];
        let sCol = start.charCodeAt(0) - 65, sRow = parseInt(start.substring(1));
        let eCol = end.charCodeAt(0) - 65, eRow = parseInt(end.substring(1));
        let cells = [];
        for(let r = Math.min(sRow, eRow); r <= Math.max(sRow, eRow); r++) {
            for(let c = Math.min(sCol, eCol); c <= Math.max(sCol, eCol); c++) {
                cells.push(String.fromCharCode(65 + c) + r);
            }
        }
        return cells;
    }

    // --- FORMULA EVALUATION ENGINE ---
    // Supports: SUM, AVERAGE, COUNT, MAX, MIN, IF, cell references and basic arithmetic
    function evaluateFormula(expr, depth = 0) {
        if(depth > 12) return "#REF!";
        if(!expr || typeof expr !== 'string' || !expr.startsWith('=')) return expr;
        let content = expr.substring(1).trim();

        // 1. Function: IF(condition, value_if_true, value_if_false)
        let ifMatch = content.match(/^IF\s*\((.*)\)$/i);
        if (ifMatch) {
            let inner = ifMatch[1];
            // Split by comma outside quotes/parentheses
            let args = [];
            let current = '', inQuote = false, pLevel = 0;
            for(let i=0; i<inner.length; i++) {
                let ch = inner[i];
                if(ch === '"' && (i === 0 || inner[i-1] !== '\\')) inQuote = !inQuote;
                else if(ch === '(' && !inQuote) pLevel++;
                else if(ch === ')' && !inQuote) pLevel--;
                else if(ch === ',' && !inQuote && pLevel === 0) {
                    args.push(current.trim());
                    current = '';
                    continue;
                }
                current += ch;
            }
            if(current) args.push(current.trim());

            if (args.length >= 2) {
                let condStr = args[0];
                let trueVal = args[1];
                let falseVal = args.length >= 3 ? args[2] : "";

                // Replace cell references inside condition
                let resolvedCond = condStr.replace(/[A-Z][0-9]+/gi, function(ref) {
                    let d = data[ref.toUpperCase()];
                    let v = d ? evaluateFormula(d.v, depth + 1) : "0";
                    return isNaN(v) ? JSON.stringify(v) : v;
                });
                
                // Replace single '=' with '===' in condition if not already >= or <=
                resolvedCond = resolvedCond.replace(/([^><=!])=([^=])/g, '$1===$2');

                let condResult = false;
                try {
                    condResult = Boolean(new Function('return ' + resolvedCond)());
                } catch(e) {
                    condResult = false;
                }

                let picked = condResult ? trueVal : falseVal;
                // If wrapped in quotes, strip them
                if((picked.startsWith('"') && picked.endsWith('"')) || (picked.startsWith("'") && picked.endsWith("'"))) {
                    return picked.slice(1, -1);
                }
                if(picked.startsWith('=')) return evaluateFormula(picked, depth + 1);
                // Check if it's a cell ref
                if(/^[A-Z][0-9]+$/i.test(picked)) {
                    let d = data[picked.toUpperCase()];
                    return d ? evaluateFormula(d.v, depth + 1) : "";
                }
                return picked;
            }
        }

        // 2. Statistical Functions: SUM, AVERAGE, COUNT, MAX, MIN
        let statMatch = content.match(/^(SUM|AVERAGE|COUNT|MAX|MIN)\s*\(([A-Z0-9:, ]+)\)$/i);
        if (statMatch) {
            let op = statMatch[1].toUpperCase();
            let rangeArg = statMatch[2];
            let cells = [];
            rangeArg.split(',').forEach(part => {
                cells.push(...getRangeCells(part.trim()));
            });

            let nums = [];
            cells.forEach(cid => {
                let cellItem = data[cid];
                let rawVal = cellItem ? evaluateFormula(cellItem.v, depth + 1) : "";
                let n = parseFloat(rawVal);
                if (!isNaN(n)) nums.push(n);
            });

            if (op === 'SUM') {
                let s = nums.reduce((a, b) => a + b, 0);
                return s.toString();
            }
            if (op === 'AVERAGE') {
                if (nums.length === 0) return "#DIV/0!";
                let s = nums.reduce((a, b) => a + b, 0);
                return (s / nums.length).toFixed(2).replace(/\.00$/, '');
            }
            if (op === 'COUNT') {
                return nums.length.toString();
            }
            if (op === 'MAX') {
                if (nums.length === 0) return "0";
                return Math.max(...nums).toString();
            }
            if (op === 'MIN') {
                if (nums.length === 0) return "0";
                return Math.min(...nums).toString();
            }
        }

        // 3. Basic arithmetic with cell references (e.g. =A1+B1 or =A1*2)
        let safeMath = content.replace(/[A-Z][0-9]+/gi, function(ref) {
            let d = data[ref.toUpperCase()];
            let val = d ? evaluateFormula(d.v, depth + 1) : "0";
            let n = parseFloat(val);
            return isNaN(n) ? "0" : n;
        });

        if(/^[0-9+\-*/().\s]+$/.test(safeMath)) {
            try {
                let res = new Function('return ' + safeMath)();
                return Number.isFinite(res) ? res.toString() : "#ERROR";
            } catch(e) {
                return "#ERROR";
            }
        }

        return "#ERROR";
    }

    // --- FUNCTION WIZARD (fx) DIALOG ---
    const FX_INFO = {
        'SUM': {
            syntax: 'SUM(number1, [number2], ...)',
            desc: 'Adds all the numbers in a range of cells.',
            fields: [{ id: 'fx-param-range', label: 'Range:', default: 'A1:A5' }]
        },
        'AVERAGE': {
            syntax: 'AVERAGE(number1, [number2], ...)',
            desc: 'Returns the average (arithmetic mean) of arguments.',
            fields: [{ id: 'fx-param-range', label: 'Range:', default: 'A1:A5' }]
        },
        'COUNT': {
            syntax: 'COUNT(value1, [value2], ...)',
            desc: 'Counts the number of cells in a range that contain numbers.',
            fields: [{ id: 'fx-param-range', label: 'Range:', default: 'A1:A5' }]
        },
        'MAX': {
            syntax: 'MAX(number1, [number2], ...)',
            desc: 'Returns the largest value in a set of values.',
            fields: [{ id: 'fx-param-range', label: 'Range:', default: 'A1:A5' }]
        },
        'MIN': {
            syntax: 'MIN(number1, [number2], ...)',
            desc: 'Returns the smallest value in a set of values.',
            fields: [{ id: 'fx-param-range', label: 'Range:', default: 'A1:A5' }]
        },
        'IF': {
            syntax: 'IF(logical_test, value_if_true, value_if_false)',
            desc: 'Checks whether a condition is met, returning one value if TRUE, and another if FALSE.',
            fields: [
                { id: 'fx-param-test', label: 'Logical_test:', default: 'A1>10' },
                { id: 'fx-param-true', label: 'Value_if_true:', default: '"Pass"' },
                { id: 'fx-param-false', label: 'Value_if_false:', default: '"Fail"' }
            ]
        }
    };

    window.excelOpenFunctionWizard = function() {
        let dlg = document.getElementById('excel-fx-dialog');
        if (!dlg) return;
        dlg.style.display = 'block';
        if (typeof window.bringToFront === 'function') window.bringToFront(dlg);

        let select = document.getElementById('excel-fx-select');
        let currentFn = (select && select.value) ? select.value : 'SUM';
        window.excelSelectFunction(currentFn);
    };

    window.excelCloseFunctionWizard = function() {
        let dlg = document.getElementById('excel-fx-dialog');
        if (dlg) dlg.style.display = 'none';
    };

    window.excelSelectFunction = function(fnName) {
        let info = FX_INFO[fnName] || FX_INFO['SUM'];
        let syntaxEl = document.getElementById('excel-fx-syntax');
        let descEl = document.getElementById('excel-fx-desc');
        let container = document.getElementById('excel-fx-inputs-container');

        if (syntaxEl) syntaxEl.innerText = info.syntax;
        if (descEl) descEl.innerText = info.desc;
        if (container) {
            // Suggest selected range or range above active cell
            let suggestedRange = 'A1:A5';
            if (selectedRange.length > 1) {
                suggestedRange = selectedRange[0] + ':' + selectedRange[selectedRange.length - 1];
            } else if (activeCell) {
                let col = activeCell.charAt(0);
                let row = parseInt(activeCell.substring(1));
                if (row > 1) {
                    suggestedRange = col + '1:' + col + (row - 1);
                }
            }

            let html = '';
            info.fields.forEach(f => {
                let val = (f.id === 'fx-param-range') ? suggestedRange : f.default;
                html += `
                    <div style="display:flex; align-items:center; margin-bottom:6px;">
                        <label style="width:95px; font-weight:bold; color:#000;">${f.label}</label>
                        <input type="text" id="${f.id}" value="${val}" style="flex:1; border:2px inset #D5D2C2; padding:2px 4px; font-family:Tahoma; font-size:11px;">
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    };

    window.excelApplyFunctionWizard = function() {
        let select = document.getElementById('excel-fx-select');
        let fnName = (select && select.value) ? select.value : 'SUM';
        let formula = '';

        if (fnName === 'IF') {
            let testEl = document.getElementById('fx-param-test');
            let trueEl = document.getElementById('fx-param-true');
            let falseEl = document.getElementById('fx-param-false');
            let test = testEl ? testEl.value.trim() : 'A1>0';
            let tVal = trueEl ? trueEl.value.trim() : '1';
            let fVal = falseEl ? falseEl.value.trim() : '0';
            formula = `=IF(${test}, ${tVal}, ${fVal})`;
        } else {
            let rangeEl = document.getElementById('fx-param-range');
            let range = rangeEl ? rangeEl.value.trim() : 'A1:A5';
            formula = `=${fnName}(${range})`;
        }

        if (!data[activeCell]) data[activeCell] = { v: "", f: getDefaultFormat() };
        data[activeCell].v = formula;
        if (formulaBar) formulaBar.value = formula;
        refreshGrid();
        window.excelCloseFunctionWizard();
    };

    // --- Global Hooks & Actions ---
    window.excelFormulaInput = function() {
        if(isEditing) {
            let input = document.getElementById('cell-' + activeCell)?.querySelector('input');
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
        sheets[activeSheetName] = data;
        return {
            sheets: sheets,
            activeSheet: activeSheetName,
            colWidths: colWidths,
            rowHeights: rowHeights
        };
    };

    window.excelNew = function() {
        sheets = {
            'Sheet1': {},
            'Sheet2': {},
            'Sheet3': {}
        };
        activeSheetName = 'Sheet1';
        data = sheets[activeSheetName];
        colWidths = {};
        rowHeights = {};
        currentFileName = "Book1";
        document.querySelector('#excel-window .title-bar span').innerHTML = '<img src="Windows XP Icons/Graph View.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> Microsoft Excel - Book1';
        initGrid();
        refreshGrid();
    };

    window.excelSave = function() {
        if(typeof window.openFileDialog === 'function') {
            window.openFileDialog('save', currentFileName + '.xls', (info) => {
                let name = info.name || info.filename;
                if(!name) return;
                if(!name.toLowerCase().endsWith('.xls')) name += '.xls';
                let dir = window.resolvePath(info.path);
                if(dir) {
                    sheets[activeSheetName] = data;
                    let payload = JSON.stringify({
                        sheets: sheets,
                        activeSheet: activeSheetName,
                        colWidths: colWidths,
                        rowHeights: rowHeights
                    });
                    dir[name] = { type: 'file', extension: 'xls', content: payload, icon: 'excel' };
                    currentFileName = name.replace('.xls', '');
                    document.querySelector('#excel-window .title-bar span').innerHTML = '<img src="Windows XP Icons/Graph View.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> Microsoft Excel - ' + name;
                    if(typeof window.saveFileSystem === 'function') window.saveFileSystem();
                    if(typeof window.renderDesktop === 'function') window.renderDesktop();
                    if(typeof window.showBalloon === 'function') window.showBalloon('Excel', 'Saved ' + name);
                    if(typeof window.markAppSaved === 'function') window.markAppSaved('excel-window', payload);
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
                            let parsed = JSON.parse(item.content);
                            if (parsed.sheets) {
                                sheets = parsed.sheets;
                                activeSheetName = parsed.activeSheet || Object.keys(sheets)[0];
                                colWidths = parsed.colWidths || {};
                                rowHeights = parsed.rowHeights || {};
                            } else {
                                sheets = { 'Sheet1': parsed };
                                activeSheetName = 'Sheet1';
                            }
                            data = sheets[activeSheetName];
                            currentFileName = name.replace('.xls', '');
                            document.querySelector('#excel-window .title-bar span').innerHTML = '<img src="Windows XP Icons/Graph View.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> Microsoft Excel - ' + name;
                            renderExcelSheetTabs();
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
            let parsed = JSON.parse(item.content);
            if (parsed.sheets) {
                sheets = parsed.sheets;
                activeSheetName = parsed.activeSheet || Object.keys(sheets)[0];
                colWidths = parsed.colWidths || {};
                rowHeights = parsed.rowHeights || {};
            } else {
                sheets = { 'Sheet1': parsed };
                activeSheetName = 'Sheet1';
            }
            data = sheets[activeSheetName];
            currentFileName = filename.replace('.xls', '');
            document.querySelector('#excel-window .title-bar span').innerHTML = '<img src="Windows XP Icons/Graph View.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> Microsoft Excel - ' + filename;
            renderExcelSheetTabs();
            refreshGrid();
        } catch(e) {}
    };

    window.excelClearAll = function() {
        data = {};
        sheets[activeSheetName] = data;
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
        let col = activeCell.charAt(0);
        let row = parseInt(activeCell.substring(1));
        if(row > 1) {
            let formula = '=SUM(' + col + '1:' + col + (row-1) + ')';
            if(!data[activeCell]) data[activeCell] = { v: '', f: getDefaultFormat() };
            data[activeCell].v = formula;
            if (formulaBar) formulaBar.value = formula;
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
