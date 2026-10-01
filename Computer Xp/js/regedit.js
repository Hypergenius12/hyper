(function() {
    'use strict';

    let selectedKeyPath = null;
    let selectedValueName = null;
    let expandedPaths = new Set(['']); // root always expanded
    let lastFindQuery = '';
    let findMatches = [];
    let findIndex = -1;

    function initRegistry() {
        if (typeof window.loadRegistry === 'function') window.loadRegistry();
        renderTree();
        updateStatusBar();
    }

    function updateStatusBar() {
        let sb = document.getElementById('regedit-statusbar');
        if (!sb) return;
        if (selectedKeyPath && selectedKeyPath.length > 0) {
            sb.innerText = 'My Computer\\' + selectedKeyPath.join('\\');
        } else {
            sb.innerText = 'My Computer';
        }
    }

    function getRegistryNode(pathArr) {
        let node = window.xpRegistry;
        if (!pathArr || pathArr.length === 0) return node;
        for (let i = 0; i < pathArr.length; i++) {
            if (node && node[pathArr[i]] && typeof node[pathArr[i]] === 'object' && !node[pathArr[i]].type) {
                node = node[pathArr[i]];
            } else {
                return null;
            }
        }
        return node;
    }

    function renderTree(node = window.xpRegistry, container = document.getElementById('regedit-tree'), pathArr = []) {
        if (!container) return;
        
        let ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.paddingLeft = pathArr.length === 0 ? '0' : '15px';
        ul.style.margin = '0';
        
        let keys = Object.keys(node).filter(k => typeof node[k] === 'object' && !node[k].type);
        keys.sort((a,b) => a.localeCompare(b));
        
        keys.forEach(k => {
            let li = document.createElement('li');
            li.style.cursor = 'pointer';
            li.style.whiteSpace = 'nowrap';
            li.style.padding = '2px 0';
            
            let currentPathArr = [...pathArr, k];
            let pathStr = currentPathArr.join('\\');
            let isSelected = selectedKeyPath && pathStr === selectedKeyPath.join('\\');
            let isExpanded = expandedPaths.has(pathStr);
            
            let subNode = node[k];
            let subKeys = Object.keys(subNode).filter(sk => typeof subNode[sk] === 'object' && !subNode[sk].type);
            let hasChildren = subKeys.length > 0;
            
            let expander = document.createElement('span');
            expander.style.display = 'inline-block';
            expander.style.width = '10px';
            expander.style.marginRight = '5px';
            expander.style.fontFamily = 'monospace';
            expander.style.border = hasChildren ? '1px solid gray' : 'none';
            expander.style.backgroundColor = hasChildren ? 'white' : 'transparent';
            expander.style.textAlign = 'center';
            expander.style.lineHeight = '8px';
            expander.style.height = '10px';
            expander.style.fontSize = '10px';
            expander.innerText = hasChildren ? (isExpanded ? '-' : '+') : '';
            
            expander.onclick = (e) => {
                e.stopPropagation();
                if(!hasChildren) return;
                if(isExpanded) expandedPaths.delete(pathStr);
                else expandedPaths.add(pathStr);
                renderTree(window.xpRegistry, document.getElementById('regedit-tree'), []);
            };
            
            let icon = document.createElement('img');
            icon.src = isExpanded && hasChildren ? "Windows XP Icons/Folder Opened.png" : "Windows XP Icons/Folder Closed.png";
            icon.style.width = "14px";
            icon.style.marginRight = "5px";
            icon.style.verticalAlign = "middle";
            
            let text = document.createElement('span');
            text.innerText = k;
            if(isSelected) {
                text.style.backgroundColor = '#316AC5';
                text.style.color = '#FFF';
            }
            
            li.appendChild(expander);
            li.appendChild(icon);
            li.appendChild(text);
            
            li.onclick = (e) => {
                e.stopPropagation();
                selectedKeyPath = currentPathArr;
                selectedValueName = null;
                renderTree(window.xpRegistry, document.getElementById('regedit-tree'), []);
                renderValues();
                updateStatusBar();
            };
            
            li.ondblclick = (e) => {
                e.stopPropagation();
                if(hasChildren) {
                    if(isExpanded) expandedPaths.delete(pathStr);
                    else expandedPaths.add(pathStr);
                }
                renderTree(window.xpRegistry, document.getElementById('regedit-tree'), []);
                renderValues();
                updateStatusBar();
            };
            
            li.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                selectedKeyPath = currentPathArr;
                selectedValueName = null;
                renderTree(window.xpRegistry, document.getElementById('regedit-tree'), []);
                renderValues();
                updateStatusBar();
                
                let menu = document.getElementById('context-menu-regedit');
                if(menu) {
                    document.querySelectorAll('.context-menu-container').forEach(m => m.style.display = 'none');
                    menu.style.display = 'flex';
                    menu.style.left = e.pageX + 'px';
                    menu.style.top = e.pageY + 'px';
                }
            };
            
            ul.appendChild(li);
            
            if (hasChildren && isExpanded) {
                let subContainer = document.createElement('div');
                renderTree(subNode, subContainer, currentPathArr);
                ul.appendChild(subContainer);
            }
        });
        
        container.innerHTML = '';
        container.appendChild(ul);
    }

    function renderValues() {
        let list = document.getElementById('regedit-values-list');
        if(!list) return;
        list.innerHTML = '';
        
        if(!selectedKeyPath) return;
        
        let node = getRegistryNode(selectedKeyPath);
        if(!node) return;
        
        // Add Default value
        let defaultVal = node['(Default)'] ? node['(Default)'].data : '(value not set)';
        addValueRow('(Default)', 'REG_SZ', defaultVal, true);
        
        let vals = Object.keys(node).filter(k => k !== '(Default)' && typeof node[k] === 'object' && node[k].type);
        vals.sort((a,b) => a.localeCompare(b));
        
        vals.forEach(k => {
            addValueRow(k, node[k].type, node[k].data, false);
        });
    }

    function addValueRow(name, type, data, isDefault) {
        let list = document.getElementById('regedit-values-list');
        let tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        
        if (selectedValueName === name) {
            tr.style.backgroundColor = '#316AC5';
            tr.style.color = '#FFF';
        }
        
        let tdName = document.createElement('td');
        let icon = type === 'REG_SZ' ? 'Windows XP Icons/TXT.png' : 'Windows XP Icons/Setup.png';
        tdName.innerHTML = `<img src="${icon}" style="width:14px; margin-right:5px; verticalAlign:middle;"> ${name}`;
        
        let tdType = document.createElement('td');
        tdType.innerText = type;
        
        let tdData = document.createElement('td');
        tdData.innerText = data !== undefined ? String(data) : '';
        
        tr.appendChild(tdName);
        tr.appendChild(tdType);
        tr.appendChild(tdData);
        
        tr.onclick = () => {
            selectedValueName = name;
            renderValues();
        };
        
        tr.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectedValueName = name;
            renderValues();
            
            let menu = document.getElementById('context-menu-regedit');
            if(menu) {
                document.querySelectorAll('.context-menu-container').forEach(m => m.style.display = 'none');
                menu.style.display = 'flex';
                menu.style.left = e.pageX + 'px';
                menu.style.top = e.pageY + 'px';
            }
        };
        
        tr.ondblclick = () => {
            let pStr = selectedKeyPath.join('\\');
            let currentVal = data === '(value not set)' ? '' : data;
            if(typeof window.xpDialog === 'function') {
                window.xpDialog(`Edit ${type}`, `Value data for ${name}:`, 'prompt', currentVal).then(newVal => {
                    if (newVal !== null && newVal !== undefined) {
                        window.setRegistryValue(pStr, name, type, newVal);
                        renderValues();
                    }
                });
            } else {
                let newVal = prompt(`Value data for ${name}:`, currentVal);
                if (newVal !== null && newVal !== undefined) {
                    window.setRegistryValue(pStr, name, type, newVal);
                    renderValues();
                }
            }
        };
        
        list.appendChild(tr);
    }

    window.regeditNewKey = function() {
        if(!selectedKeyPath) return;
        let node = getRegistryNode(selectedKeyPath);
        if(!node) return;
        
        let baseName = "New Key";
        let name = baseName;
        let count = 1;
        while(node[name]) {
            name = baseName + " #" + count;
            count++;
        }
        
        if(typeof window.xpDialog === 'function') {
            window.xpDialog("New Key", "Enter name for new key:", 'prompt', name).then(val => {
                if(val && !node[val]) {
                    node[val] = {};
                    window.saveRegistry();
                    expandedPaths.add(selectedKeyPath.join('\\'));
                    renderTree();
                }
            });
        }
    };

    window.regeditNewString = function() {
        if(!selectedKeyPath) return;
        let node = getRegistryNode(selectedKeyPath);
        if(!node) return;
        
        if(typeof window.xpDialog === 'function') {
            window.xpDialog("New String Value", "Enter value name:", "prompt", "New Value #1").then(val => {
                if(val && !node[val]) {
                    let pStr = selectedKeyPath.join('\\');
                    window.setRegistryValue(pStr, val, 'REG_SZ', "");
                    renderValues();
                }
            });
        }
    };

    window.regeditNewDword = function() {
        if(!selectedKeyPath) return;
        let node = getRegistryNode(selectedKeyPath);
        if(!node) return;
        
        if(typeof window.xpDialog === 'function') {
            window.xpDialog("New DWORD Value", "Enter value name:", "prompt", "New Value #1").then(val => {
                if(val && !node[val]) {
                    let pStr = selectedKeyPath.join('\\');
                    window.setRegistryValue(pStr, val, 'REG_DWORD', 0);
                    renderValues();
                }
            });
        }
    };

    window.regeditDeleteSelected = function() {
        if(selectedValueName && selectedValueName !== '(Default)') {
            if(confirm(`Delete value '${selectedValueName}'?`)) {
                let node = getRegistryNode(selectedKeyPath);
                if(node && node[selectedValueName]) {
                    delete node[selectedValueName];
                    selectedValueName = null;
                    window.saveRegistry();
                    renderValues();
                }
            }
        } else if (selectedKeyPath && selectedKeyPath.length > 1) { // Prevent deleting roots
            let keyName = selectedKeyPath[selectedKeyPath.length - 1];
            if(confirm(`Delete key '${keyName}' and all its subkeys?`)) {
                let parentPath = selectedKeyPath.slice(0, -1);
                let parentNode = getRegistryNode(parentPath);
                if(parentNode && parentNode[keyName]) {
                    delete parentNode[keyName];
                    selectedKeyPath = parentPath;
                    selectedValueName = null;
                    window.saveRegistry();
                    renderTree();
                    renderValues();
                    updateStatusBar();
                }
            }
        }
    };

    window.regeditRenameSelected = function() {
        if(selectedValueName && selectedValueName !== '(Default)') {
            if(typeof window.xpDialog === 'function') {
                window.xpDialog("Rename Value", "Enter new name for value:", "prompt", selectedValueName).then(newVal => {
                    if (newVal && newVal !== selectedValueName) {
                        let node = getRegistryNode(selectedKeyPath);
                        if(node && !node[newVal]) {
                            node[newVal] = node[selectedValueName];
                            delete node[selectedValueName];
                            selectedValueName = newVal;
                            window.saveRegistry();
                            renderValues();
                        }
                    }
                });
            }
        } else if (selectedKeyPath && selectedKeyPath.length > 1) {
            let keyName = selectedKeyPath[selectedKeyPath.length - 1];
            if(typeof window.xpDialog === 'function') {
                window.xpDialog("Rename Key", "Enter new name for key:", "prompt", keyName).then(newVal => {
                    if (newVal && newVal !== keyName) {
                        let parentPath = selectedKeyPath.slice(0, -1);
                        let parentNode = getRegistryNode(parentPath);
                        if(parentNode && !parentNode[newVal]) {
                            parentNode[newVal] = parentNode[keyName];
                            delete parentNode[keyName];
                            selectedKeyPath = [...parentPath, newVal];
                            window.saveRegistry();
                            renderTree();
                            renderValues();
                            updateStatusBar();
                        }
                    }
                });
            }
        }
    };

    /* --- FIND IMPLEMENTATION --- */
    window.regeditFind = function() {
        if (typeof window.xpDialog === 'function') {
            window.xpDialog('Find', 'Find what:', 'prompt', lastFindQuery).then(query => {
                if (query) {
                    lastFindQuery = query;
                    performFind(query);
                }
            });
        } else {
            let query = prompt('Find what:', lastFindQuery);
            if (query) {
                lastFindQuery = query;
                performFind(query);
            }
        }
    };

    window.regeditFindNext = function() {
        if (!lastFindQuery) {
            window.regeditFind();
            return;
        }
        if (findMatches.length === 0) {
            performFind(lastFindQuery);
        } else {
            findIndex = (findIndex + 1) % findMatches.length;
            goToMatch(findMatches[findIndex]);
        }
    };

    function performFind(query) {
        let q = query.toLowerCase();
        findMatches = [];
        findIndex = -1;

        function traverseKeys(node, path) {
            let keys = Object.keys(node).filter(k => typeof node[k] === 'object' && !node[k].type);
            for (let k of keys) {
                let nextPath = [...path, k];
                if (k.toLowerCase().includes(q)) {
                    findMatches.push({ path: nextPath, valueName: null });
                }
                let subNode = node[k];
                let vals = Object.keys(subNode).filter(vk => typeof subNode[vk] === 'object' && subNode[vk].type);
                for (let vk of vals) {
                    let vObj = subNode[vk];
                    let valDataStr = String(vObj.data !== undefined ? vObj.data : '');
                    if (vk.toLowerCase().includes(q) || valDataStr.toLowerCase().includes(q)) {
                        findMatches.push({ path: nextPath, valueName: vk });
                    }
                }
                traverseKeys(subNode, nextPath);
            }
        }

        traverseKeys(window.xpRegistry, []);

        if (findMatches.length === 0) {
            if (typeof window.xpDialog === 'function') {
                window.xpDialog('Registry Editor', `Finished searching through the registry. The search string '${query}' was not found.`, 'info');
            } else {
                alert(`Finished searching through the registry. The search string '${query}' was not found.`);
            }
            return;
        }

        findIndex = 0;
        goToMatch(findMatches[0]);
    }

    function goToMatch(match) {
        if (!match) return;
        let running = [];
        for (let p of match.path) {
            running.push(p);
            expandedPaths.add(running.join('\\'));
        }
        selectedKeyPath = match.path;
        selectedValueName = match.valueName;
        renderTree(window.xpRegistry, document.getElementById('regedit-tree'), []);
        renderValues();
        updateStatusBar();

        if (match.valueName) {
            setTimeout(() => {
                let list = document.getElementById('regedit-values-list');
                if (list) {
                    let rows = list.querySelectorAll('tr');
                    rows.forEach(r => {
                        if (r.innerText.includes(match.valueName)) {
                            r.scrollIntoView({ block: 'nearest' });
                        }
                    });
                }
            }, 50);
        }
    }

    // Keyboard shortcut handler for Regedit
    window.addEventListener('keydown', (e) => {
        let regWin = document.getElementById('regedit-window');
        if (!regWin || regWin.style.display === 'none') return;
        let isFocused = document.activeElement && regWin.contains(document.activeElement);
        let isActive = regWin.querySelector('.title-bar:not(.inactive)');
        if (isFocused || isActive) {
            if (e.ctrlKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                window.regeditFind();
            } else if (e.key === 'F3') {
                e.preventDefault();
                window.regeditFindNext();
            }
        }
    });

    window.regeditModifySelected = function() {
        if (!selectedKeyPath) return;
        let node = getRegistryNode(selectedKeyPath);
        if (!node) return;

        let valName = selectedValueName || '(Default)';
        let valObj = node[valName];
        let type = valObj ? valObj.type : 'REG_SZ';
        let currentVal = valObj ? valObj.data : '';
        if (currentVal === undefined || currentVal === '(value not set)') currentVal = '';

        let pStr = selectedKeyPath.join('\\');
        if (typeof window.xpDialog === 'function') {
            window.xpDialog(`Edit ${type}`, `Value data for ${valName}:`, 'prompt', currentVal).then(newVal => {
                if (newVal !== null && newVal !== undefined) {
                    window.setRegistryValue(pStr, valName, type, newVal);
                    renderValues();
                }
            });
        } else {
            let newVal = prompt(`Value data for ${valName}:`, currentVal);
            if (newVal !== null && newVal !== undefined) {
                window.setRegistryValue(pStr, valName, type, newVal);
                renderValues();
            }
        }
    };

    // Make sure init runs when window opens or at start
    setTimeout(() => {
        initRegistry();
    }, 500);

})();
