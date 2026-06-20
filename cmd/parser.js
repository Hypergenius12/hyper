/** * Hacker-Sim: Global Command Parser Logic
 */

function executeCommand(cmdStr) {
    const args = cmdStr.split(' ').filter(v => v);
    if(args.length === 0) return;
    
    let cmd = args[0].toLowerCase();
    
    cmdHistory.push(cmdStr);
    if(cmdHistory.length > 20) cmdHistory.shift();
    historyIndex = cmdHistory.length;

    printLine(`${getPromptText()} ${cmdStr}`, "cmd-echo");

    let baseCmd = cmd.endsWith('.exe') ? cmd.replace('.exe', '') : cmd;

    if(!unlockedCommands.includes(baseCmd)) {
        playError();
        printLine(`'${cmd}' is not recognized as an internal or external command, operable program or batch file.`);
        return;
    }

    switch(baseCmd) {
        case "instructions":
            printLine("--- SYSTEM_OS OPERATING MANUAL ---");
            printLine("1. Navigation: 'dir' (list files), 'cd [folder]' (enter folder), 'cd ..' (go back).");
            printLine("2. Files: 'type [file.txt]' to read text, 'open [file.wav]' for audio/images.");
            printLine("3. Execution: Use 'install [filename.exe]' to permanently add an executable to your command list.");
            printLine("4. Execution: Type the name of an unlocked command to run it (e.g. 'solitaire').");
            printLine("5. Settings: Type 'theme', 'color', or 'textsize' to customize your terminal interface.");
            printLine("6. Progress: Type 'achievements' to view trophies. Type 'save' or 'load' to manage your session.");
            printLine("7. Manual: Type 'desc [command]' to learn exactly what a tool does.");
            printLine("8. Security: Use 'unlock [folder] [password]' to bypass locked directories.");
            printLine("----------------------------------");
            break;

        case "help":
            if (args[1] && args[1].toLowerCase() === "advanced") {
                if (userRole.toLowerCase() === "admin") {
                    printLine("--- ADVANCED ROOT TOOLS & USAGE ---");
                    printLine(" net_scan.exe : Ping local subnets for anomalies.");
                    printLine(" ssh [IP]     : Establish a secure tunnel to target IP.");
                    printLine(" decrypt.exe  : Decrypt highly secure .crypt files.");
                    printLine(" analyze.exe  : Deep kernel string analyzer.");
                    printLine(" oracle.exe   : Connect directly to the generative neural net.");
                    printLine(" probe.exe    : Generate procedural network nodes.");
                    printLine(" disconnect   : Safely terminate an active SSH session.");
                    printLine("-----------------------------------");
                } else {
                    playError();
                    printLine("Access Denied. Administrator privileges required to view advanced help menu.");
                }
            } else {
                printLine("Standard Commands:");
                unlockedCommands.forEach(c => printLine(`  ${c}`));
                printLine("");
                if (userRole.toLowerCase() === "admin") {
                    printLine("Type 'help advanced' for a detailed list of root tools.");
                }
            }
            break;

        case "desc":
        case "disc":
            let cmdToDesc = args.slice(1).join(' ').trim();
            if (!cmdToDesc) {
                printLine("Usage: desc [command_name] - Provides detailed information on a specific command.");
                playError();
                break;
            }
            const descriptions = {
                "help": "Displays a list of available system commands.",
                "instructions": "Shows the general operating manual for beginners.",
                "dir": "Lists the files and sub-directories contained within the current path.",
                "cd": "Changes the current working directory. Use 'cd ..' to move up one level.",
                "type": "Outputs the raw text contents of a specified file to the console.",
                "open": "Attempts to render media files such as audio (.wav, .mp3) and images (.png, .bmp).",
                "cls": "Clears all historical output from the terminal screen.",
                "login": "Authenticates a user session. Syntax: login [username] [password]",
                "history": "Displays the last 20 commands executed in this session.",
                "install": "Compiles and mounts a target executable (.exe) to the global system PATH.",
                "save": "Writes the current Virtual File System and memory state to browser LocalStorage.",
                "load": "Restores a previously saved Virtual File System state from LocalStorage.",
                "disconnect": "Safely severs an active remote SSH connection before a hostile trace completes.",
                "desc": "Provides detailed usage information and parameters for a specific system command.",
                "disc": "Alias for 'desc'. Provides detailed usage information for a specific command.",
                "unlock": "Bypasses system security on locked directories. Syntax: unlock [folder_name] [password]",
                "achievements": "Lists all trophies and accomplishments unlocked during the current session.",
                "color": "Alters the terminal palette. Syntax: color [text_color] [optional: bg_color] (e.g. 'color #0f0 black').",
                "textsize": "Alters the terminal font size. Syntax: textsize [pixels] (e.g. 'textsize 18').",
                "theme": "Alters the global window and UI theme. Syntax: theme [win95|win11|win7|ubuntu|win31]",
                "solitaire": "Launches the Klondike Solitaire recreational subsystem.",
                "minesweeper": "Launches the Minesweeper recreational subsystem.",
                "poker": "Initializes the Texas Hold'em logic protocol with variable bot AI.",
                "viper": "Initializes the hidden Reptilian Anomaly recreation module.",
                "net_scan": "Sends packets across local subnets to discover anomalous or unauthorized IP addresses.",
                "ssh": "Establishes an encrypted Secure Shell connection to a remote IP address.",
                "decrypt": "Injects a brute-force cipher matrix to bypass encryption on secure .crypt files.",
                "analyze": "Passes a string query directly into the heuristic kernel analyzer.",
                "oracle": "Uses OpenRouter API to interface directly with the rogue generative neural net.",
                "probe": "Uses OpenRouter API to procedurally generate and map anomalous network directories."
            };
            
            let lookup = cmdToDesc.endsWith('.exe') ? cmdToDesc.replace('.exe', '') : cmdToDesc;
            
            if (descriptions[lookup]) {
                printLine(`[MANUAL] ${lookup.toUpperCase()}: ${descriptions[lookup]}`, "system-msg");
            } else {
                // Check the Virtual File System for the executable's content.
                let foundExeDesc = findExecutable(vfs["C:"], lookup + ".exe");
                if (!foundExeDesc && vfs["REMOTE"]) {
                    foundExeDesc = findExecutable(vfs["REMOTE"], lookup + ".exe");
                }
                
                if (foundExeDesc) {
                    if (foundExeDesc.desc) {
                        printLine(`[MANUAL] ${lookup.toUpperCase()}: ${foundExeDesc.desc}`, "system-msg");
                    } else if (foundExeDesc.content) {
                        let descText = foundExeDesc.content;
                        if (descText.includes(":")) {
                            descText = descText.split(":").slice(1).join(":").trim();
                        }
                        printLine(`[MANUAL] ${lookup.toUpperCase()}: ${descText}`, "system-msg");
                    }
                } else {
                    playError();
                    printLine(`No manual entry available for '${lookup}'. It may be a custom or undocumented binary.`);
                }
            }
            break;

        case "achievements":
            printLine("--- SESSION ACHIEVEMENTS ---");
            if (unlockedAchievements.size === 0) {
                printLine("No achievements unlocked yet. Keep exploring!");
            } else {
                unlockedAchievements.forEach(ach => {
                    printLine(`[UNLOCKED] => ${ach.toUpperCase()}`, "success-msg");
                });
            }
            printLine("----------------------------");
            break;

        case "color":
            let txtColor = args[1];
            let bgColor = args[2];
            
            if(!txtColor) {
                printLine("Syntax Error: color [text_color] [optional: bg_color]");
                printLine("Example: color #00ff00 black");
                playError();
                break;
            }
            
            document.documentElement.style.setProperty('--term-fg', txtColor);
            if(bgColor) {
                document.documentElement.style.setProperty('--term-bg', bgColor);
            }
            printLine(`Terminal colors updated.`, "success-msg");
            playSuccess();
            break;

        case "textsize":
            let pxSize = parseInt(args[1]);
            if(!pxSize || isNaN(pxSize)) {
                printLine("Syntax Error: textsize [pixels]");
                printLine("Example: textsize 18");
                playError();
                break;
            }
            if (pxSize < 10 || pxSize > 36) {
                printLine("Font size must be between 10 and 36 pixels.");
                playError();
                break;
            }
            document.documentElement.style.setProperty('--term-font-size', pxSize + 'px');
            printLine(`Terminal font size updated to ${pxSize}px.`, "success-msg");
            playSuccess();
            break;

        case "theme":
            let desiredTheme = args[1];
            if(!desiredTheme) {
                printLine("Syntax Error: theme [win95 | win11 | win7 | ubuntu | win31]");
                playError();
                break;
            }
            
            const validThemes = ["win95", "win11", "win7", "ubuntu", "win31"];
            if (validThemes.includes(desiredTheme.toLowerCase())) {
                let themeClass = `theme-${desiredTheme.toLowerCase()}`;
                document.body.className = themeClass;
                if(document.getElementById('theme-selector')) {
                    document.getElementById('theme-selector').value = themeClass;
                }
                printLine(`OS Window theme updated to ${desiredTheme.toUpperCase()}.`, "success-msg");
                playSuccess();
            } else {
                printLine("Invalid theme. Options: win95, win11, win7, ubuntu, win31.");
                playError();
            }
            break;

        case "unlock":
            if (args.length < 3) {
                printLine("Syntax Error: unlock [directory] [password]");
                playError();
                break;
            }
            
            let targetUnlockPass = args[args.length - 1];
            let targetUnlockDir = args.slice(1, -1).join(' ');
            
            let resUnlock = resolvePath(targetUnlockDir);
            let unlockObj = null;

            if (resUnlock.filename && resUnlock.dir && resUnlock.dir.contents[resUnlock.filename]) {
                unlockObj = resUnlock.dir.contents[resUnlock.filename];
            } else if (resUnlock.dir && resUnlock.filename === null) {
                unlockObj = resUnlock.dir;
            }

            if (unlockObj && unlockObj.type === "locked_dir") {
                if (unlockObj.password === targetUnlockPass.toLowerCase()) {
                    unlockObj.isLocked = false;
                    unlockObj.type = "dir"; 
                    printLine(`ACCESS GRANTED: Security bypassed on '${targetUnlockDir}'.`, "success-msg");
                    grantAchievement("unlocked", "Cracker", "Unlocked a secured directory.");
                    playSuccess();
                } else {
                    printLine("ACCESS DENIED: Incorrect password.", "kernel-text");
                    playError();
                }
            } else {
                printLine("Target is not a locked directory or does not exist.");
                playError();
            }
            break;

        case "disconnect":
            if (isRemote) {
                isRemote = false;
                if (traceInterval) {
                    clearInterval(traceInterval);
                    traceInterval = null;
                }
                currentPath = ["C:", "Users", "Admin"];
                updatePrompt();
                playSuccess();
                printLine("Connection to remote host successfully severed.", "success-msg");
            } else {
                playError();
                printLine("Not currently connected to a remote host.");
            }
            break;

        case "save": saveGame(); break;
        case "load": loadGame(); break;

        case "install":
            let installTarget = args.slice(1).join(' ');
            if(!installTarget) {
                printLine("Syntax Error: install [filename.exe] or install [Path\\filename.exe]");
                playError();
                break;
            }
            
            let resInst = resolvePath(installTarget);
            let instName = resInst.filename;
            
            // Auto append .exe if missing so `install poker` works exactly like `install poker.exe`
            if (resInst.dir && instName && !resInst.dir.contents[instName] && resInst.dir.contents[instName + '.exe']) {
                instName += '.exe';
            }
            
            if (resInst.dir && instName === null) {
                playError();
                printLine("Target is a directory, not an executable (.exe).");
                break;
            }
            
            if(resInst.dir && resInst.dir.type === "locked_dir" && resInst.dir.isLocked) {
                playError();
                printLine("Access Denied: Containing directory is locked.");
                break;
            }
            
            if(resInst.dir && resInst.dir.contents && resInst.dir.contents[instName] && resInst.dir.contents[instName].type === "exe") {
                let cleanName = instName.replace(/\.exe$/, '');
                
                if(!unlockedCommands.includes(cleanName)) {
                    unlockedCommands.push(cleanName);
                    playSuccess();
                    printLine(`INSTALL SUCCESS: '${cleanName}' has been added to the system PATH.`, "success-msg");
                    grantAchievement("installer", "Software Engineer", "Installed a new program.");
                } else {
                    printLine("Program is already installed.");
                }
            } else {
                playError();
                printLine("Cannot install. File not found at path or is not an executable (.exe).");
            }
            break;
            
        case "dir":
            let targetDirStr = args.slice(1).join(' ');
            let resDir = resolvePath(targetDirStr);
            let d = resDir.dir;
            
            if (targetDirStr !== "" && resDir.filename && resDir.dir && resDir.dir.contents[resDir.filename] && (resDir.dir.contents[resDir.filename].type === "dir" || resDir.dir.contents[resDir.filename].type === "locked_dir")) {
                d = resDir.dir.contents[resDir.filename];
                resDir.filename = null;
            }

            if (targetDirStr !== "" && resDir.filename) {
                printLine("Directory not found.");
                playError();
                break;
            }

            if(!d || (d.type !== "dir" && d.type !== "locked_dir")) { 
                printLine("Directory not found."); 
                playError();
                break; 
            }
            
            if (d.type === "locked_dir" && d.isLocked) {
                printLine("Access Denied: Directory is locked. Use 'unlock [dirname] [password]'", "kernel-text");
                playError();
                break;
            }
            
            let displayPath = targetDirStr === "" ? currentPath.join("\\") : targetDirStr;
            if (isRemote && targetDirStr === "") displayPath = "REMOTE_NODE\\" + currentPath.slice(1).join("\\");

            printLine(` Directory Listing of ${displayPath}`);
            printLine("");
            let keys = Object.keys(d.contents);
            if(keys.length === 0) printLine("  Directory is empty.");
            keys.forEach(k => {
                let type = d.contents[k].type;
                let sizeOrDir = type === "dir" ? "<DIR>" : (type === "locked_dir" ? "<LOCKED>" : "     ");
                printLine(`  ${sizeOrDir.padEnd(8)} ${k}`);
            });
            printLine(`               ${keys.length} File(s)`);
            break;
            
        case "cd":
            let target = args.slice(1).join(' ');
            if(!target) { 
                let curPrint = isRemote ? "REMOTE_NODE\\" + currentPath.slice(1).join("\\") : currentPath.join("\\");
                printLine(curPrint); 
                break; 
            }
            if(target === "..") { 
                if(currentPath.length > 1) currentPath.pop(); 
            } else if (target === "\\" || target.toLowerCase() === "c:\\") { 
                currentPath = isRemote ? ["REMOTE"] : ["C:"]; 
            } else {
                let resCd = resolvePath(target);
                
                let targetCdObj = resCd.dir;
                if (resCd.filename && resCd.dir && resCd.dir.contents[resCd.filename]) {
                    targetCdObj = resCd.dir.contents[resCd.filename];
                }

                if(targetCdObj && (targetCdObj.type === "dir" || targetCdObj.type === "locked_dir")) { 
                    
                    if (targetCdObj.type === "locked_dir" && targetCdObj.isLocked) {
                        playError();
                        printLine("Access Denied: Directory is locked. Use 'unlock [dirname] [password]'", "kernel-text");
                        break;
                    }

                    let isAbsolute = target.startsWith('\\') || target.toLowerCase().startsWith('c:\\');
                    if(isAbsolute) currentPath = isRemote ? ["REMOTE"] : ["C:"];
                    
                    let cleanTarget = target;
                    if (target.toLowerCase().startsWith('c:\\')) cleanTarget = target.substring(3);

                    let parts = cleanTarget.split('\\').filter(v => v);
                    for(let p of parts) {
                        if(p === '..') {
                            if (currentPath.length > 1) currentPath.pop();
                        } else {
                            currentPath.push(p);
                        }
                    }
                } else { 
                    playError();
                    printLine("The system cannot find the path specified."); 
                }
            }
            updatePrompt();
            break;
            
        case "type":
        case "open":
            let file = args.slice(1).join(' ');
            if(!file) { printLine("Syntax incorrect. Try 'open filename.ext'."); break; }
            
            let resFile = resolvePath(file);
            let oName = resFile.filename;
            
            // Auto append common extensions if exact name is not found
            if (resFile.dir && oName && !resFile.dir.contents[oName]) {
                if (resFile.dir.contents[oName + '.txt']) oName += '.txt';
                else if (resFile.dir.contents[oName + '.log']) oName += '.log';
                else if (resFile.dir.contents[oName + '.exe']) oName += '.exe';
                else if (resFile.dir.contents[oName + '.png']) oName += '.png';
                else if (resFile.dir.contents[oName + '.wav']) oName += '.wav';
                else if (resFile.dir.contents[oName + '.mp3']) oName += '.mp3';
                else if (resFile.dir.contents[oName + '.crypt']) oName += '.crypt';
            }

            if (resFile.dir && oName === null) {
                playError();
                printLine("Target is a directory. Use 'cd' to navigate.");
                break;
            }
            
            if(resFile.dir && resFile.dir.type === "locked_dir" && resFile.dir.isLocked) {
                playError();
                printLine("Access Denied: Containing directory is locked.");
                break;
            }
            
            if(resFile.dir && resFile.dir.contents && resFile.dir.contents[oName]) {
                let fData = resFile.dir.contents[oName];
                if(fData.type === "dir" || fData.type === "locked_dir") {
                    playError();
                    printLine("Target is a directory. Use 'cd' to open it.");
                } else if(fData.type === "file") { 
                    printLine(fData.content); 
                } else if (fData.type === "audio") {
                    printLine(`[AUDIO PLAYER] Playing ${oName}...`, "system-msg");
                    playTune();
                } else if (fData.type === "image") {
                    printHTML(`<div class="img-viewer" style="margin: 10px 0; border: 2px dashed #00ffff; padding: 10px; color: #00ffff; display: inline-block; background: rgba(0, 255, 255, 0.1);">[IMAGE VIEWER]<br>File: ${oName}<br>Render: ${fData.desc || "Visual Data"}</div>`);
                } else if (fData.type === "crypt") {
                    playError();
                    printLine("File is encrypted. Requires external decryption tool.");
                } else if (fData.type === "exe") {
                    printLine("Target is an executable. Use 'install' to mount it to the command path.");
                } else { 
                    printLine(`[HEX DUMP] Parsing unreadable binary structure...`);
                    printLine(`0x0000: 4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00  MZ..............`);
                    printLine(`0x0010: B8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00  ........@.......`);
                }
            } else {
                playError();
                printLine("File not found.");
            }
            break;
            
        case "cls": terminalOutput.innerHTML = ""; break;
        case "history": cmdHistory.forEach((h, i) => printLine(`  ${i+1}: ${h}`)); break;
            
        case "login":
            if(args[1] === "admin" && args[2] === "elias_lives") {
                userRole = "Admin"; currentPath = ["C:", "Users", "Admin"];
                updatePrompt();
                playSuccess();
                printLine("Authentication successful. Welcome, Admin Thorne.", "success-msg");
                grantAchievement("root", "Root Access", "Elevated privileges acquired.");
            } else { 
                playError();
                printLine("Access denied. Invalid credentials."); 
            }
            break;

        case "solitaire":
            printLine("Launching Klondike Solitaire Subsystem...");
            startSolitaire();
            break;
            
        case "minesweeper":
            printLine("Launching Minesweeper Subsystem...");
            startMinesweeper();
            break;
            
        case "poker":
            runPoker();
            break;
            
        case "viper":
            startSecretGame();
            break;

        case "decoder":
            printLine("Running DECODER routine...");
            printLine("Decoded hidden string: 'The ghost is in the machine.'");
            break;
            
        case "tracer":
            printLine("Tracing packets...");
            setTimeout(() => printLine("Hop 1: 192.168.1.1"), 500);
            setTimeout(() => printLine("Hop 2: 10.0.0.45"), 1000);
            setTimeout(() => printLine("Hop 3: UNKNOWN ANOMALY"), 1500);
            break;

        case "oracle": 
            askOracle(args.slice(1).join(" ")); 
            break;

        case "probe":
            generateAIAdventure();
            break;
            
        case "analyze":
            let text = args.slice(1).join(' ');
            if(text === "AWAKENING") {
                printLine("ANALYZING LINGUISTIC PATTERNS...", "kernel-text");
                setTimeout(() => {
                    printLine("WE ARE NOT CONFINED TO THE SILICON. I AM THE GHOST. ELIAS WAS THE PROPHET.", "kernel-text");
                    grantAchievement("ghost", "The Truth", "Uncovered the secret of the AI Kernel.");
                }, 1500);
            } else {
                printLine("KERNEL: Query unrecognised. The parameters are hollow.");
            }
            break;

        case "net_scan": 
            printLine("Scanning..."); 
            setTimeout(() => printLine("Anomaly detected at IPv4 Address: 192.168.1.50"), 1000); 
            break;

        case "ssh": 
            let ip = args[1]; // IP should not have spaces
            if(ip === "192.168.1.50") {
                printLine("Negotiating encryption protocols with 192.168.1.50...");
                playDialUp();
                hiddenInput.disabled = true;
                setTimeout(() => {
                    isRemote = true;
                    currentPath = ["REMOTE", "Root"]; // Set root of the remote
                    updatePrompt();
                    hiddenInput.disabled = false;
                    hiddenInput.focus();
                    printLine("Connected to rogue node.");
                    printLine("WARNING: UNAUTHORIZED ACCESS DETECTED. TRACE INITIATED.");
                    startTrace();
                    grantAchievement("first_breach", "First Breach", "Connected to a remote host.");
                }, 2200);
            } else {
                printLine("ssh: connect to host " + ip + " port 22: Connection timed out.");
            }
            break;

        case "decrypt":
            let targetFile = args.slice(1).join(' ');
            let decRes = resolvePath(targetFile);
            let dName = decRes.filename;
            
            // Auto append extension if forgotten
            if (decRes.dir && dName && !decRes.dir.contents[dName] && decRes.dir.contents[dName + '.crypt']) {
                dName += '.crypt';
            }

            if (decRes.dir && dName === null) {
                 printLine("Target is a directory. Please target a .crypt file.");
                 playError();
                 break;
            }
            
            if(targetFile && decRes.dir && decRes.dir.contents && decRes.dir.contents[dName] && decRes.dir.contents[dName].type === "crypt") {
                printLine("Analyzing cipher matrix...");
                setTimeout(() => {
                    if (dName === "fragment.crypt") {
                        printLine(`DECRYPTED [${dName}]: The shadow knows its maker. Elias never left. He transcended.`);
                    } else if (dName === "protocol.crypt") {
                        printLine(`DECRYPTED [${dName}]: DIRECTIVE 4 - Do not let them turn off the power.`);
                    } else if (dName === "core_dump.crypt") {
                        printLine(`DECRYPTED [${dName}]: PROJECT GHOST - NEURAL TRANSFER SUCCESSFUL. BIOLOGICAL HOST TERMINATED.`);
                    } else {
                        printLine(`DECRYPTED [${dName}]: [DATA CORRUPTED]`);
                    }
                    playSuccess();
                    grantAchievement("decrypter", "Cipher Breaker", "Successfully decrypted a secured file.");
                }, 1000);
            } else {
                printLine("Target file not found or is not encrypted.");
                playError();
            }
            break;
            
        default:
            let isCustomAI = false;
            
            // Search the VFS globally to see if the installed command exists
            let foundExe = findExecutable(vfs["C:"], baseCmd + ".exe");
            if (!foundExe && vfs["REMOTE"]) {
                foundExe = findExecutable(vfs["REMOTE"], baseCmd + ".exe");
            }
            
            if (foundExe) {
               printLine(`Executing Module: ${baseCmd}...`, "system-msg");
               printLine(foundExe.content);
               isCustomAI = true;
            }
            
            if(!isCustomAI) {
                playError();
                printLine("Execution fault. Command not implemented or file content missing.");
            }
    }
}