/** * Hacker-Sim: Core System Functions, VFS Resolvers, Saving/Loading, and Reboot Mechanisms
 */

function printLine(text, className = "") {
    const div = document.createElement('div');
    div.textContent = text;
    if(className) div.className = className;
    terminalOutput.appendChild(div);
    scrollToBottom();
}

function printHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    terminalOutput.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() { 
    terminalContainer.scrollTop = terminalContainer.scrollHeight; 
}

function getPromptText() {
    if(isRemote) return "root@192.168.1.50>";
    return currentPath.join("\\") + ">";
}

function updatePrompt() { 
    promptSpan.textContent = getPromptText(); 
}

function getDir(pathArr) {
    let rootKey = isRemote && pathArr[0] === "C:" ? "REMOTE" : pathArr[0];
    let current = vfs[rootKey];
    
    if (!current) return null;

    for(let i=1; i<pathArr.length; i++) {
        if(current.contents && current.contents[pathArr[i]]) { 
            current = current.contents[pathArr[i]]; 
        } else { 
            return null; 
        }
    }
    return current;
}

// Safely resolves nested paths completely. Correctly identifying if a path ends on a file or a folder.
function resolvePath(targetStr) {
    if(!targetStr || targetStr.trim() === "") return { dir: getDir(currentPath), filename: null };

    let isAbsolute = targetStr.startsWith('\\') || targetStr.toLowerCase().startsWith('c:\\');
    let cleanTarget = targetStr;
    if (targetStr.toLowerCase().startsWith('c:\\')) {
        cleanTarget = targetStr.substring(3);
    }

    let parts = cleanTarget.split('\\').filter(v => v);
    let walkPath = isAbsolute ? ["C:"] : [...currentPath];

    for(let p of parts) {
        if(p === '..') {
            if (walkPath.length > 1) walkPath.pop();
        } else {
            let currNode = getDir(walkPath);
            if (currNode && currNode.contents && currNode.contents[p] && currNode.contents[p].type === "locked_dir" && currNode.contents[p].isLocked) {
                if (p !== parts[parts.length-1]) {
                    return { dir: null, filename: null };
                }
            }
            walkPath.push(p);
        }
    }

    let finalNode = getDir(walkPath);
    if (finalNode && (finalNode.type === 'dir' || finalNode.type === 'locked_dir')) {
         return { dir: finalNode, filename: null };
    } else {
         let filename = walkPath.pop(); 
         let parentDir = getDir(walkPath);
         return { dir: parentDir, filename: filename };
    }
}

// Recursively searches the entire VFS for an executable file (Skips locked dirs)
function findExecutable(dirObj, exeName) {
    if (!dirObj || (dirObj.type !== 'dir' && dirObj.type !== 'locked_dir') || !dirObj.contents) return null;
    if (dirObj.type === 'locked_dir' && dirObj.isLocked) return null;
    
    if (dirObj.contents[exeName] && dirObj.contents[exeName].type === 'exe') {
        return dirObj.contents[exeName];
    }
    
    for (let key in dirObj.contents) {
        if (dirObj.contents[key].type === 'dir') {
            let found = findExecutable(dirObj.contents[key], exeName);
            if (found) return found;
        }
    }
    return null;
}

function grantAchievement(id, title, desc) {
    if(unlockedAchievements.has(id)) return;
    unlockedAchievements.add(id);
    const achDiv = document.createElement('div');
    achDiv.className = 'achievement';
    achDiv.innerHTML = `<div class="ach-title">Achievement Unlocked: ${title}</div><div>${desc}</div>`;
    achievementsContainer.appendChild(achDiv);
    
    playSuccess();
    
    setTimeout(() => { if(achDiv.parentNode) achDiv.parentNode.removeChild(achDiv); }, 5000);
}

// --- TRACE & REBOOT LOGIC ---
function startTrace() {
    tracePercent = 0;
    if(traceInterval) clearInterval(traceInterval);
    traceInterval = setInterval(() => {
        tracePercent += 5;
        printLine(`[WARNING] HOST TRACE AT ${tracePercent}% - TYPE 'disconnect' TO ABORT!`, "kernel-text");
        scrollToBottom();
        if(tracePercent >= 100) {
            clearInterval(traceInterval);
            traceInterval = null;
            printLine("TRACE COMPLETE. CONNECTION SEVERED. CRITICAL FAULT. SYSTEM REBOOTING...", "kernel-text");
            setTimeout(triggerReboot, 2500);
        }
    }, 1500);
}

function triggerReboot() {
    terminalOutput.innerHTML = "";
    isRemote = false;
    currentPath = ["C:", "Users", "Guest"];
    userRole = "Guest";
    updatePrompt();
    playError();
    
    const bootText = [
        "Microcore BIOS v2.01",
        "Copyright (C) 1985-2026 Microcore Inc.",
        "Checking NVRAM... OK",
        "Initializing USB Controllers... OK",
        "Detecting Primary Master... SYSTEM_OS",
        "WARNING: UNEXPECTED DISCONNECT DETECTED. TRACE MITIGATION DEPLOYED.",
        "Restoring defaults...",
        "Booting..."
    ];
    
    hiddenInput.disabled = true;
    let i = 0;
    let bootInt = setInterval(() => {
        printLine(bootText[i]);
        i++;
        if(i >= bootText.length) {
            clearInterval(bootInt);
            printLine("");
            printLine(ASCII_LOGO);
            printLine("System recovered. Type 'help' or 'instructions' to begin.");
            hiddenInput.disabled = false;
            hiddenInput.focus();
            updatePrompt();
        }
    }, 400);
}

// --- SAVE & LOAD LOGIC (WITH SETTINGS) ---
function saveGame() {
    const gameState = {
        vfs: vfs,
        currentPath: currentPath,
        userRole: userRole,
        unlockedCommands: unlockedCommands,
        achievements: Array.from(unlockedAchievements),
        isRemote: isRemote,
        settings: {
            theme: document.body.className,
            termFg: document.documentElement.style.getPropertyValue('--term-fg'),
            termBg: document.documentElement.style.getPropertyValue('--term-bg'),
            termFontSize: document.documentElement.style.getPropertyValue('--term-font-size')
        }
    };
    localStorage.setItem('hackerSimSave', JSON.stringify(gameState));
    playSuccess();
    printLine("SYSTEM_OS STATE AND CONFIGURATION SAVED.", "save-msg");
}

function loadGame() {
    const saveData = localStorage.getItem('hackerSimSave');
    if (saveData) {
        try {
            const gameState = JSON.parse(saveData);
            vfs = gameState.vfs;
            currentPath = gameState.currentPath;
            userRole = gameState.userRole;
            unlockedCommands = gameState.unlockedCommands || ["help", "instructions", "dir", "cd", "type", "open", "cls", "login", "history", "install", "save", "load", "desc", "disc", "disconnect", "unlock", "achievements", "color", "textsize", "theme"];
            unlockedAchievements = new Set(gameState.achievements);
            isRemote = gameState.isRemote || false;
            
            // Load settings
            if(gameState.settings) {
                document.body.className = gameState.settings.theme || "theme-win95";
                if(document.getElementById('theme-selector')) {
                    document.getElementById('theme-selector').value = gameState.settings.theme || "theme-win95";
                }
                if(gameState.settings.termFg) document.documentElement.style.setProperty('--term-fg', gameState.settings.termFg);
                if(gameState.settings.termBg) document.documentElement.style.setProperty('--term-bg', gameState.settings.termBg);
                if(gameState.settings.termFontSize) document.documentElement.style.setProperty('--term-font-size', gameState.settings.termFontSize);
            }

            updatePrompt();
            playSuccess();
            printLine("SYSTEM_OS STATE LOADED SUCCESSFULLY.", "save-msg");
        } catch (e) {
            playError();
            printLine("ERROR: Save file corrupted.", "kernel-text");
        }
    } else {
        playError();
        printLine("ERROR: No save file found in local storage.");
    }
}