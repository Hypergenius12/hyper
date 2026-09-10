(function() {
    'use strict';

    
    let selectedKeyPath = null;

    

    function initRegistry() {
        if(typeof window.loadRegistry === 'function') window.loadRegistry();
        renderTree();
    }

    function getRegistryNode(pathArr) {
        let node = window.xpRegistry;
        for(let i=0; i<pathArr.length; i++) {
            if (node[pathArr[i]] && typeof node[pathArr[i]] === 'object' && !node[pathArr[i]].type) {
                node = node[pathArr[i]];
            } else {
                return null;
            }
        }
        return node;
    }

    
    let expandedPaths = new Set(['']); // root always expanded

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
            };
            
            li.ondblclick = (e) => {
                e.stopPropagation();
                if(hasChildren) {
                    if(isExpanded) expandedPaths.delete(pathStr);
                    else expandedPaths.add(pathStr);
                }
                renderTree(window.xpRegistry, document.getElementById('regedit-tree'), []);
                renderValues();
            };
            
            li.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                selectedKeyPath = currentPathArr;
                selectedValueName = null;
                renderTree(window.xpRegistry, document.getElementById('regedit-tree'), []);
                renderValues();
                
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
        addValueRow('(Default)', 'REG_SZ', '(value not set)', true);
        
        let vals = Object.keys(node).filter(k => typeof node[k] === 'object' && node[k].type);
        vals.sort((a,b) => a.localeCompare(b));
        
        vals.forEach(k => {
            addValueRow(k, node[k].type, node[k].data, false);
        });
    }

    let selectedValueName = null;

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
        tdData.innerText = data;
        
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
            if(typeof window.xpDialog === 'function') {
                window.xpDialog(`Edit ${type}`, `Value data for ${name}:`, 'prompt', data).then(newVal => {
                    if (newVal !== null) {
                        window.setRegistryValue(pStr, name, type, newVal);
                        renderValues();
                    }
                });
            } else {
                let newVal = prompt(`Value data for ${name}:`, data);
                if (newVal !== null) {
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
            window.xpDialog("New String Value", "Enter value name:", "prompt", "New Value").then(val => {
                if(val && !node[val]) {
                    node[val] = { type: 'REG_SZ', data: "" };
                    window.saveRegistry();
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
            window.xpDialog("New DWORD Value", "Enter value name:", "prompt", "New Value").then(val => {
                if(val && !node[val]) {
                    node[val] = { type: 'REG_DWORD', data: "0" };
                    window.saveRegistry();
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
                        }
                    }
                });
            }
        }
    };

    // Make sure init runs when window opens or at start
    setTimeout(() => {
        initRegistry();
    }, 1000);

})();
