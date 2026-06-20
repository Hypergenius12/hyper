/* COMMAND PROMPT (cmd.exe) - Full Virtual Terminal */

let cmdCurrentDir = "C:\\Documents and Settings\\Administrator";
let cmdColor = { bg: '#000000', fg: '#C0C0C0' };
let cmdHistory = [];
let cmdHistoryIndex = -1;

window.initCmd = function() {
    let output = document.getElementById('cmd-output');
    let input = document.getElementById('cmd-input');
    if(!output || !input) return;
    
    output.innerHTML = '';
    cmdCurrentDir = "C:\\Documents and Settings\\Administrator";
    cmdColor = { bg: '#000000', fg: '#C0C0C0' };
    applyCmdColor();
    
    cmdPrint("Microsoft Windows XP [Version 5.1.2600]");
    cmdPrint("(C) Copyright 1985-2001 Microsoft Corp.");
    cmdPrint("");
    updateCmdPrompt();
    
    input.focus();
    
    // Click anywhere in CMD to focus input
    let win = document.getElementById('cmd-window');
    if(win) {
        win.addEventListener('click', () => input.focus());
    }
};

window.cmdKeyDown = function(e) {
    let input = document.getElementById('cmd-input');
    if(!input) return;
    
    if(e.key === 'Enter') {
        let line = input.value;
        cmdPrint(cmdCurrentDir + ">" + line);
        input.value = '';
        cmdHistory.push(line);
        cmdHistoryIndex = cmdHistory.length;
        processCmd(line.trim());
        updateCmdPrompt();
        
        // Scroll to bottom
        let output = document.getElementById('cmd-output');
        if(output) output.scrollTop = output.scrollHeight;
    } else if(e.key === 'ArrowUp') {
        e.preventDefault();
        if(cmdHistoryIndex > 0) {
            cmdHistoryIndex--;
            input.value = cmdHistory[cmdHistoryIndex];
        }
    } else if(e.key === 'ArrowDown') {
        e.preventDefault();
        if(cmdHistoryIndex < cmdHistory.length - 1) {
            cmdHistoryIndex++;
            input.value = cmdHistory[cmdHistoryIndex];
        } else {
            cmdHistoryIndex = cmdHistory.length;
            input.value = '';
        }
    }
};

function cmdPrint(text) {
    let output = document.getElementById('cmd-output');
    if(!output) return;
    let line = document.createElement('div');
    line.style.whiteSpace = 'pre-wrap';
    line.style.wordBreak = 'break-all';
    line.innerText = text;
    output.appendChild(line);
}

function updateCmdPrompt() {
    let prompt = document.getElementById('cmd-prompt');
    if(prompt) prompt.innerText = cmdCurrentDir + ">";
}

function applyCmdColor() {
    let container = document.getElementById('cmd-content-area');
    if(container) {
        container.style.backgroundColor = cmdColor.bg;
        container.style.color = cmdColor.fg;
    }
    let input = document.getElementById('cmd-input');
    if(input) {
        input.style.color = cmdColor.fg;
        input.style.backgroundColor = cmdColor.bg;
    }
    let prompt = document.getElementById('cmd-prompt');
    if(prompt) prompt.style.color = cmdColor.fg;
}

function processCmd(line) {
    if(!line) return;
    
    let parts = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    let cmd = parts[0].toLowerCase();
    let args = parts.slice(1);
    
    if (window.currentAccount === 'Guest') {
        let restricted = ['color', 'mkdir', 'md', 'rmdir', 'rd', 'del', 'erase', 'copy', 'ren', 'rename', 'taskkill', 'format'];
        if (restricted.includes(cmd)) {
            cmdPrint("Access is denied. Your account lacks administrator privileges.");
            return;
        }
    }
    
    switch(cmd) {
        case 'help': cmdHelp(); break;
        case 'dir': cmdDir(args); break;
        case 'cd': case 'chdir': cmdCd(args); break;
        case 'cls': cmdCls(); break;
        case 'echo': cmdEcho(args, line); break;
        case 'color': cmdColorChange(args); break;
        case 'date': cmdDate(); break;
        case 'time': cmdTime(); break;
        case 'ver': cmdPrint(""); cmdPrint("Microsoft Windows XP [Version 5.1.2600]"); cmdPrint(""); break;
        case 'title': cmdTitle(args); break;
        case 'mkdir': case 'md': cmdMkdir(args); break;
        case 'rmdir': case 'rd': cmdRmdir(args); break;
        case 'del': case 'erase': cmdDel(args); break;
        case 'type': cmdType(args); break;
        case 'copy': cmdCopy(args); break;
        case 'ren': case 'rename': cmdRen(args); break;
        case 'tree': cmdTree(args); break;
        case 'tasklist': cmdTasklist(); break;
        case 'taskkill': cmdTaskkill(args); break;
        case 'ipconfig': cmdIpconfig(); break;
        case 'systeminfo': cmdSysteminfo(); break;
        case 'whoami': cmdPrint("administrator"); break;
        case 'hostname': cmdPrint("WINXP-PC"); break;
        case 'ping': cmdPing(args); break;
        case 'tracert': cmdTracert(args); break;
        case 'netstat': cmdNetstat(); break;
        case 'ftp': cmdFtp(args); break;
        case 'format': cmdFormat(args); break;
        case 'exit': window.closeWindow('cmd-window'); break;
        case 'start': cmdStart(args); break;
        case 'set': cmdPrint("SystemRoot=C:\\WINDOWS"); cmdPrint("COMPUTERNAME=WINXP-PC"); cmdPrint("USERNAME=Administrator"); cmdPrint("OS=Windows_NT"); break;
        case 'path': cmdPrint("PATH=C:\\WINDOWS\\system32;C:\\WINDOWS;C:\\WINDOWS\\System32\\Wbem"); break;
        case 'bios': 
            if(typeof window.launchBiosSetup === 'function') window.launchBiosSetup();
            else cmdPrint("BIOS is not accessible right now.");
            break;
        default:
            cmdPrint("'" + parts[0] + "' is not recognized as an internal or external command,");
            cmdPrint("operable program or batch file.");
            break;
    }
}

function cmdHelp() {
    cmdPrint("");
    cmdPrint("For more information on a specific command, type HELP command-name");
    cmdPrint("");
    let cmds = [
        ["CD",        "Displays current directory or changes it."],
        ["CLS",       "Clears the screen."],
        ["COLOR",     "Sets text and background colors. Usage: COLOR [attr]"],
        ["COPY",      "Copies a file."],
        ["DATE",      "Displays the current date."],
        ["DEL",       "Deletes one or more files."],
        ["DIR",       "Displays a list of files and subdirectories."],
        ["ECHO",      "Displays messages."],
        ["EXIT",      "Quits the CMD.EXE program."],
        ["HELP",      "Provides help information for commands."],
        ["HOSTNAME",  "Displays computer name."],
        ["IPCONFIG",  "Displays IP configuration."],
        ["MKDIR",     "Creates a directory."],
        ["PING",      "Sends test packets to a host."],
        ["REN",       "Renames a file."],
        ["RMDIR",     "Removes a directory."],
        ["SET",       "Displays environment variables."],
        ["START",     "Starts a program."],
        ["SYSTEMINFO","Displays system information."],
        ["TASKKILL",  "Kill a running task."],
        ["TASKLIST",  "Displays all running tasks."],
        ["TIME",      "Displays the current time."],
        ["TITLE",     "Sets the window title."],
        ["TREE",      "Displays directory structure."],
        ["TYPE",      "Displays file contents."],
        ["VER",       "Displays the Windows version."],
        ["WHOAMI",    "Displays the current user."]
    ];
    cmds.forEach(c => {
        cmdPrint("  " + c[0].padEnd(14) + c[1]);
    });
    cmdPrint("");
}

function getResolvedDir(path) {
    if(!path) return null;
    let node = window.resolvePath(path);
    if(node && node.type === 'folder') return node.contents || {};
    if(node && typeof node === 'object' && !node.type) return node;
    return null;
}

function cmdDir(args) {
    let targetPath = cmdCurrentDir;
    if(args.length > 0) {
        targetPath = resolveRelativePath(args[0]);
    }
    
    let dir = getResolvedDir(targetPath);
    if(!dir) {
        cmdPrint(" File Not Found");
        return;
    }
    
    cmdPrint("");
    cmdPrint(" Volume in drive C has no label.");
    cmdPrint(" Volume Serial Number is 4C2A-7F1D");
    cmdPrint("");
    cmdPrint(" Directory of " + targetPath);
    cmdPrint("");
    
    let fileCount = 0, dirCount = 0, totalSize = 0;
    let now = new Date();
    let dateStr = (now.getMonth()+1).toString().padStart(2,'0') + "/" + now.getDate().toString().padStart(2,'0') + "/" + now.getFullYear();
    let timeStr = now.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12:true});
    
    // Always show . and ..
    cmdPrint(dateStr + "  " + timeStr + "    <DIR>          .");
    cmdPrint(dateStr + "  " + timeStr + "    <DIR>          ..");
    dirCount += 2;
    
    for(let key in dir) {
        let item = dir[key];
        if(item.type === 'folder') {
            cmdPrint(dateStr + "  " + timeStr + "    <DIR>          " + key);
            dirCount++;
        } else {
            let size = (item.content ? item.content.length : 0);
            totalSize += size;
            cmdPrint(dateStr + "  " + timeStr + "    " + size.toString().padStart(14) + " " + key);
            fileCount++;
        }
    }
    
    cmdPrint("               " + fileCount + " File(s)    " + totalSize.toLocaleString() + " bytes");
    cmdPrint("               " + dirCount + " Dir(s)   2,147,483,648 bytes free");
    cmdPrint("");
}

function resolveRelativePath(rel) {
    if(!rel) return cmdCurrentDir;
    rel = rel.replace(/"/g, '');
    
    if(rel === "\\") return "C:\\";
    if(rel.match(/^[A-Za-z]:\\/)) return rel;
    
    if(rel === '..') {
        let parts = cmdCurrentDir.split('\\');
        if(parts.length > 1) parts.pop();
        return parts.join('\\') || "C:\\";
    }
    if(rel === '.') return cmdCurrentDir;
    
    return cmdCurrentDir + "\\" + rel;
}

function cmdCd(args) {
    if(args.length === 0) {
        cmdPrint(cmdCurrentDir);
        return;
    }
    
    let target = resolveRelativePath(args.join(' '));
    let dir = getResolvedDir(target);
    
    if(dir !== null) {
        cmdCurrentDir = target;
    } else {
        cmdPrint("The system cannot find the path specified.");
    }
}

function cmdCls() {
    let output = document.getElementById('cmd-output');
    if(output) output.innerHTML = '';
}

function cmdEcho(args, line) {
    let text = line.substring(line.toLowerCase().indexOf('echo') + 5);
    cmdPrint(text || "ECHO is on.");
}

function cmdColorChange(args) {
    if(args.length === 0 || !args[0]) {
        cmdPrint("Sets the default console foreground and background colors.");
        cmdPrint("");
        cmdPrint("COLOR [attr]");
        cmdPrint("");
        cmdPrint("  attr        Specifies color attribute of console output");
        cmdPrint("  0 = Black   8 = Gray");
        cmdPrint("  1 = Blue    9 = Light Blue");
        cmdPrint("  2 = Green   A = Light Green");
        cmdPrint("  3 = Aqua    B = Light Aqua");
        cmdPrint("  4 = Red     C = Light Red");
        cmdPrint("  5 = Purple  D = Light Purple");
        cmdPrint("  6 = Yellow  E = Light Yellow");
        cmdPrint("  7 = White   F = Bright White");
        return;
    }
    
    let colorMap = {
        '0': '#000000', '1': '#000080', '2': '#008000', '3': '#008080',
        '4': '#800000', '5': '#800080', '6': '#808000', '7': '#C0C0C0',
        '8': '#808080', '9': '#0000FF', 'a': '#00FF00', 'b': '#00FFFF',
        'c': '#FF0000', 'd': '#FF00FF', 'e': '#FFFF00', 'f': '#FFFFFF'
    };
    
    let attr = args[0].toLowerCase();
    if(attr.length === 1) {
        cmdColor.fg = colorMap[attr] || '#C0C0C0';
    } else if(attr.length === 2) {
        cmdColor.bg = colorMap[attr[0]] || '#000000';
        cmdColor.fg = colorMap[attr[1]] || '#C0C0C0';
    }
    applyCmdColor();
}

function cmdDate() {
    let d = new Date();
    let dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    cmdPrint("The current date is: " + dayNames[d.getDay()] + " " + (d.getMonth()+1).toString().padStart(2,'0') + "/" + d.getDate().toString().padStart(2,'0') + "/" + d.getFullYear());
}

function cmdTime() {
    let d = new Date();
    cmdPrint("The current time is: " + d.toLocaleTimeString('en-US', {hour12:false}) + "." + d.getMilliseconds().toString().padStart(2,'0'));
}

function cmdTitle(args) {
    let titleSpan = document.querySelector('#cmd-window-title span');
    if(titleSpan) titleSpan.innerHTML = '<img src="Windows XP Icons/Command Prompt.png" class="sys-icon-small" onerror="this.style.display=\'none\'"> ' + (args.join(' ') || 'Command Prompt');
}

function cmdMkdir(args) {
    if(args.length === 0) { cmdPrint("The syntax of the command is incorrect."); return; }
    let dirPath = cmdCurrentDir;
    let dir = getResolvedDir(dirPath);
    let node = window.resolvePath(dirPath);
    if(dir && node) {
        let name = args[0].replace(/"/g, '');
        if(dir[name]) { cmdPrint("A subdirectory or file " + name + " already exists."); return; }
        if(node.contents) {
            node.contents[name] = { type: "folder", contents: {} };
        } else {
            dir[name] = { type: "folder", contents: {} };
        }
        window.saveFileSystem();
    }
}

function cmdRmdir(args) {
    if(args.length === 0) { cmdPrint("The syntax of the command is incorrect."); return; }
    let dir = getResolvedDir(cmdCurrentDir);
    let node = window.resolvePath(cmdCurrentDir);
    let name = args[0].replace(/"/g, '');
    if(node && node.contents && node.contents[name] && node.contents[name].type === 'folder') {
        delete node.contents[name];
        window.saveFileSystem();
    } else if(dir && dir[name] && dir[name].type === 'folder') {
        delete dir[name];
        window.saveFileSystem();
    } else {
        cmdPrint("The system cannot find the file specified.");
    }
}

function cmdDel(args) {
    if(args.length === 0) { cmdPrint("The syntax of the command is incorrect."); return; }
    let node = window.resolvePath(cmdCurrentDir);
    let name = args[0].replace(/"/g, '');
    if(node && node.contents && node.contents[name] && node.contents[name].type !== 'folder') {
        delete node.contents[name];
        window.saveFileSystem();
    } else {
        let dir = getResolvedDir(cmdCurrentDir);
        if(dir && dir[name] && dir[name].type !== 'folder') {
            delete dir[name];
            window.saveFileSystem();
        } else {
            cmdPrint("Could Not Find " + name);
        }
    }
}

function cmdType(args) {
    if(args.length === 0) { cmdPrint("The syntax of the command is incorrect."); return; }
    let dir = getResolvedDir(cmdCurrentDir);
    let name = args[0].replace(/"/g, '');
    if(dir && dir[name] && dir[name].content) {
        cmdPrint(dir[name].content);
    } else {
        let node = window.resolvePath(cmdCurrentDir);
        if(node && node.contents && node.contents[name] && node.contents[name].content) {
            cmdPrint(node.contents[name].content);
        } else {
            cmdPrint("The system cannot find the file specified.");
        }
    }
}

function cmdCopy(args) {
    if(args.length < 2) { cmdPrint("The syntax of the command is incorrect."); return; }
    let srcName = args[0].replace(/"/g, '');
    let destName = args[1].replace(/"/g, '');
    let dir = getResolvedDir(cmdCurrentDir);
    let node = window.resolvePath(cmdCurrentDir);
    
    let srcItem = (node && node.contents && node.contents[srcName]) || (dir && dir[srcName]);
    if(!srcItem) { cmdPrint("The system cannot find the file specified."); return; }
    
    let dest = JSON.parse(JSON.stringify(srcItem));
    if(node && node.contents) node.contents[destName] = dest;
    else if(dir) dir[destName] = dest;
    window.saveFileSystem();
    cmdPrint("        1 file(s) copied.");
}

function cmdRen(args) {
    if(args.length < 2) { cmdPrint("The syntax of the command is incorrect."); return; }
    let oldName = args[0].replace(/"/g, '');
    let newName = args[1].replace(/"/g, '');
    let node = window.resolvePath(cmdCurrentDir);
    let dir = getResolvedDir(cmdCurrentDir);
    
    if(node && node.contents && node.contents[oldName]) {
        node.contents[newName] = node.contents[oldName];
        delete node.contents[oldName];
        window.saveFileSystem();
    } else if(dir && dir[oldName]) {
        dir[newName] = dir[oldName];
        delete dir[oldName];
        window.saveFileSystem();
    } else {
        cmdPrint("The system cannot find the file specified.");
    }
}

function cmdTree(args) {
    let targetPath = args.length > 0 ? resolveRelativePath(args[0]) : cmdCurrentDir;
    cmdPrint("Folder PATH listing for volume OS");
    cmdPrint("Volume serial number is 4C2A-7F1D");
    cmdPrint(targetPath);
    
    function printTree(dir, prefix) {
        if(!dir) return;
        let keys = Object.keys(dir);
        keys.forEach((key, i) => {
            let isLast = (i === keys.length - 1);
            let connector = isLast ? "└───" : "├───";
            if(dir[key].type === 'folder') {
                cmdPrint(prefix + connector + key);
                let contents = dir[key].contents || {};
                printTree(contents, prefix + (isLast ? "    " : "│   "));
            }
        });
    }
    
    let dir = getResolvedDir(targetPath);
    printTree(dir, "");
}

function cmdTasklist() {
    cmdPrint("");
    cmdPrint("Image Name                     PID Session Name        Mem Usage");
    cmdPrint("========================= ======== ================ ===========");
    
    let pid = 1000;
    for(let id in activeWindows) {
        let title = windowTitles[id] || id;
        cmdPrint(title.padEnd(26) + (pid++).toString().padStart(8) + " Console".padEnd(17) + "  " + (Math.floor(Math.random()*50000)+1000).toLocaleString().padStart(9) + " K");
    }
    cmdPrint("System Idle Process".padEnd(26) + "0".padStart(8) + " Console".padEnd(17) + "           16 K");
    cmdPrint("");
}

function cmdTaskkill(args) {
    if(args.length < 2) { cmdPrint("ERROR: Invalid syntax. Type \"TASKKILL /?\" for usage."); return; }
    let target = args[1].replace(/"/g, '');
    for(let id in activeWindows) {
        let title = windowTitles[id] || id;
        if(title.toLowerCase() === target.toLowerCase()) {
            window.closeWindow(id);
            cmdPrint("SUCCESS: Sent termination signal to the process \"" + title + "\".");
            return;
        }
    }
    cmdPrint("ERROR: The process \"" + target + "\" not found.");
}

function cmdIpconfig() {
    cmdPrint("");
    cmdPrint("Windows IP Configuration");
    cmdPrint("");
    cmdPrint("Ethernet adapter Local Area Connection:");
    cmdPrint("");
    cmdPrint("   Connection-specific DNS Suffix  . : localdomain");
    cmdPrint("   IP Address. . . . . . . . . . . . : 192.168.1." + Math.floor(Math.random()*250+2));
    cmdPrint("   Subnet Mask . . . . . . . . . . . : 255.255.255.0");
    cmdPrint("   Default Gateway . . . . . . . . . : 192.168.1.1");
    cmdPrint("");
}

function cmdSysteminfo() {
    cmdPrint("");
    cmdPrint("Host Name:                 WINXP-PC");
    cmdPrint("OS Name:                   Microsoft Windows XP Professional");
    cmdPrint("OS Version:                5.1.2600 Service Pack 3 Build 2600");
    cmdPrint("OS Manufacturer:           Microsoft Corporation");
    cmdPrint("OS Configuration:          Standalone Workstation");
    cmdPrint("OS Build Type:             Uniprocessor Free");
    cmdPrint("Registered Owner:          Administrator");
    cmdPrint("System Manufacturer:       ACPI x86-based PC");
    cmdPrint("System Model:              Generic Desktop");
    cmdPrint("System Type:               X86-based PC");
    cmdPrint("Processor(s):              1 Processor(s) Installed.");
    cmdPrint("                           [01]: x86 Family 6 Model 15 ~2400 Mhz");
    cmdPrint("Total Physical Memory:     1,024 MB");
    cmdPrint("Available Physical Memory: 512 MB");
    cmdPrint("Page File Space:           2,048 MB");
    cmdPrint("");
}

function cmdPing(args) {
    if(args.length === 0) { cmdPrint("Usage: ping hostname"); return; }
    let host = args[0];
    cmdPrint("");
    cmdPrint("Pinging " + host + " with 32 bytes of data:");
    cmdPrint("");
    for(let i = 0; i < 4; i++) {
        let time = Math.floor(Math.random()*50+1);
        cmdPrint("Reply from " + host + ": bytes=32 time=" + time + "ms TTL=128");
    }
    cmdPrint("");
    cmdPrint("Ping statistics for " + host + ":");
    cmdPrint("    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),");
    cmdPrint("Approximate round trip times in milli-seconds:");
    cmdPrint("    Minimum = 1ms, Maximum = 50ms, Average = 25ms");
    cmdPrint("");
}

function cmdTracert(args) {
    if(args.length === 0) { cmdPrint("Usage: tracert target_name"); return; }
    let host = args[0];
    cmdPrint("");
    cmdPrint("Tracing route to " + host + " over a maximum of 30 hops:");
    cmdPrint("");
    for(let i=1; i<=8; i++) {
        let t1 = Math.floor(Math.random()*20+1);
        let t2 = Math.floor(Math.random()*20+1);
        let t3 = Math.floor(Math.random()*20+1);
        let ip = `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
        cmdPrint(`  ${i}    ${t1} ms    ${t2} ms    ${t3} ms  ${ip}`);
    }
    cmdPrint("");
    cmdPrint("Trace complete.");
    cmdPrint("");
}

function cmdNetstat() {
    cmdPrint("");
    cmdPrint("Active Connections");
    cmdPrint("");
    cmdPrint("  Proto  Local Address          Foreign Address        State");
    for(let i=0; i<6; i++) {
        let lPort = Math.floor(Math.random()*10000 + 1024);
        let fPort = [80, 443, 21, 22, 3389][Math.floor(Math.random()*5)];
        let fIp = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
        let state = ["ESTABLISHED", "LISTENING", "TIME_WAIT", "CLOSE_WAIT"][Math.floor(Math.random()*4)];
        cmdPrint(`  TCP    127.0.0.1:${lPort}        ${fIp}:${fPort}    ${state}`);
    }
    cmdPrint("");
}

function cmdFtp(args) {
    let host = args.length > 0 ? args[0] : "ftp.microsoft.com";
    cmdPrint(`Connected to ${host}.`);
    cmdPrint("220 Microsoft FTP Service");
    cmdPrint("User ("+host+":(none)): anonymous");
    cmdPrint("331 Anonymous access allowed, send identity (e-mail name) as password.");
    cmdPrint("Password:");
    cmdPrint("230 Anonymous user logged in.");
    cmdPrint("ftp> quit");
    cmdPrint("221 Goodbye.");
}

function cmdFormat(args) {
    if(args.length === 0) { cmdPrint("Required parameter missing."); return; }
    let drive = args[0].toUpperCase();
    cmdPrint(`The type of the file system is NTFS.`);
    cmdPrint(`WARNING, ALL DATA ON NON-REMOVABLE DISK`);
    cmdPrint(`DRIVE ${drive} WILL BE LOST!`);
    cmdPrint(`Proceed with Format (Y/N)? Y`);
    cmdPrint(`Formatting 40960M`);
    cmdPrint(`Format complete.`);
    cmdPrint(`Volume label (11 characters, ENTER for none)?`);
    cmdPrint(`40959 MB total disk space.`);
    cmdPrint(`40959 MB are available.`);
    cmdPrint("");
}

function cmdStart(args) {
    if(args.length === 0) { cmdPrint("The syntax of the command is incorrect."); return; }
    let programName = args.join(' ').toLowerCase();
    
    let mapping = {
        'notepad': 'notepad-window',
        'calc': 'calc-window',
        'mspaint': 'paint-window',
        'explorer': 'folder-window',
        'taskmgr': 'taskmgr-window',
        'cmd': 'cmd-window'
    };
    
    if(mapping[programName]) {
        window.openProgram(mapping[programName]);
        cmdPrint("Started: " + programName);
    } else {
        cmdPrint("Could not start \"" + programName + "\".");
    }
}
