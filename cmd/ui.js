/** * Hacker-Sim: UI, DOM Handlers, Window Management, and Initialization
 */

// --- DOM ELEMENTS ---
const windowEl = document.getElementById('window');
const titleBar = document.getElementById('title-bar');
const terminalContainer = document.getElementById('terminal-container');
const terminalOutput = document.getElementById('terminal-output');
const hiddenInput = document.getElementById('hidden-input');
const inputTextSpan = document.getElementById('input-text');
const promptSpan = document.getElementById('prompt');
const achievementsContainer = document.getElementById('achievements');
const btnMinimize = document.getElementById('btn-minimize');
const btnMaximize = document.getElementById('btn-maximize');
const btnClose = document.getElementById('btn-close');
const themeSelector = document.getElementById('theme-selector');

// --- THEME SWITCHER LOGIC ---
if(themeSelector) {
    themeSelector.addEventListener('change', (e) => {
        document.body.className = e.target.value;
        playClick();
    });
}

// --- TASKBAR CLOCK LOGIC ---
setInterval(() => {
    const clock = document.getElementById('taskbar-clock');
    if(clock) {
        const now = new Date();
        clock.innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
}, 1000);

// --- WINDOW CONTROLS LOGIC ---
let isFullscreen = false;
let savedRect = { top: '', left: '', width: '', height: '' };

btnMaximize.addEventListener('click', () => {
    if (!isFullscreen) {
        savedRect.top = windowEl.style.top; 
        savedRect.left = windowEl.style.left;
        windowEl.classList.add('fullscreen'); 
        isFullscreen = true;
    } else {
        windowEl.classList.remove('fullscreen');
        windowEl.style.top = savedRect.top || '10%'; 
        windowEl.style.left = savedRect.left || '15%';
        isFullscreen = false;
    }
    // scrollToBottom is called globally via core.js
    if (typeof scrollToBottom === 'function') scrollToBottom();
});

btnMinimize.addEventListener('click', () => {
    if (windowEl.style.height === '28px') {
        windowEl.style.height = isFullscreen ? 'calc(100vh - 40px)' : '600px';
        terminalContainer.style.display = 'flex';
    } else {
        windowEl.style.height = '28px';
        terminalContainer.style.display = 'none';
    }
});

btnClose.addEventListener('click', () => {
    windowEl.style.display = 'none';
    setTimeout(() => { alert("CRITICAL FAULT. UI KILLED. REFRESH PAGE TO REBOOT."); }, 500);
});

let isDragging = false;
let offsetX = 0; 
let offsetY = 0;

titleBar.addEventListener('mousedown', (e) => {
    if (isFullscreen || e.target.tagName.toLowerCase() === 'button') return;
    isDragging = true;
    offsetX = e.clientX - windowEl.offsetLeft; 
    offsetY = e.clientY - windowEl.offsetTop;
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    windowEl.style.left = (e.clientX - offsetX) + 'px'; 
    windowEl.style.top = (e.clientY - offsetY) + 'px';
});

document.addEventListener('mouseup', () => { 
    isDragging = false; 
});

// --- TERMINAL INITIALIZATION ---
const ASCII_LOGO = `
  _____ __ __ _____ _____ _____ _____   ___  _____ 
 / ___/|  |  |  ___|__ __|  ___|     | /   \\/  ___/
 \\___ \\|  |  |___ \\  | | |  ___|  |  ||  |  |___ \\ 
 /____/ \\___/|_____| | | |_____|__|__| \\___/|____/ 

===================================================
SYSTEM_OS Explorer Node v4.2.1
Neural Subsystem Online (OpenRouter Protocol).
===================================================
`;

window.onload = () => {
    playStartup();
    printLine(ASCII_LOGO);
    printLine("Type 'instructions' if you are new to the system.");
    printLine("Type 'desc [command]' to learn how to use a specific tool.");
    printLine("");
    updatePrompt();
    terminalContainer.click();
};

terminalContainer.addEventListener('click', () => {
    if (!isAITyping) hiddenInput.focus();
});

hiddenInput.addEventListener('input', () => {
    inputTextSpan.textContent = hiddenInput.value;
    playClick();
});

hiddenInput.addEventListener('keydown', (e) => {
    if(activeGame) {
        if(e.key.startsWith('Arrow')) e.preventDefault(); // Prevent scrolling while playing games
        return; 
    }
    if(e.key === 'Enter') {
        const cmdStr = hiddenInput.value.trim();
        if(cmdStr !== "") { 
            // Call to executeCommand located in parser.js
            executeCommand(cmdStr); 
        } else { 
            printLine(getPromptText()); 
        }
        hiddenInput.value = ''; 
        inputTextSpan.textContent = '';
        scrollToBottom();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if(historyIndex > 0) {
            historyIndex--;
            hiddenInput.value = cmdHistory[historyIndex];
            inputTextSpan.textContent = hiddenInput.value;
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if(historyIndex < cmdHistory.length - 1) {
            historyIndex++;
            hiddenInput.value = cmdHistory[historyIndex];
            inputTextSpan.textContent = hiddenInput.value;
        } else {
            historyIndex = cmdHistory.length;
            hiddenInput.value = ""; 
            inputTextSpan.textContent = "";
        }
    }
});