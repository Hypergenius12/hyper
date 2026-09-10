// Grab the elements we need for dragging
const xpWindow = document.getElementById('draggable-window');
const titleBar = document.getElementById('window-title-bar');

// Variables to store the mouse and window positions
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

// Dragging Logic
titleBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    const windowRect = xpWindow.getBoundingClientRect();
    offsetX = e.clientX - windowRect.left;
    offsetY = e.clientY - windowRect.top;
    titleBar.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;
    xpWindow.style.left = `${newLeft}px`;
    xpWindow.style.top = `${newTop}px`;
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        titleBar.style.cursor = 'default';
    }
});


// ---------------------------------------------------
// WINDOW TABS LOGIC
// ---------------------------------------------------
const tabs = document.querySelectorAll('.window-tab');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and panels
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding panel
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});


// ---------------------------------------------------
// THEME & OS TOGGLE LOGIC
// ---------------------------------------------------

// Dictionary of themes available for each OS
const osThemes = {
    'os-win31': [
        { value: 'theme-classic', text: 'Classic Standard' }
    ],
    'os-win95': [
        { value: 'theme-classic', text: 'Classic Standard' }
    ],
    'os-win2000': [
        { value: 'theme-classic', text: 'Professional Beige' }
    ],
    'os-xp': [
        { value: 'theme-luna', text: 'Luna (Blue)' },
        { value: 'theme-olive', text: 'Olive Green' },
        { value: 'theme-silver', text: 'Silver' }
    ],
    'os-vista': [
        { value: 'theme-aero', text: 'Aero Glass' },
        { value: 'theme-basic', text: 'Windows Basic' }
    ],
    'os-win7': [
        { value: 'theme-aero', text: 'Aero Glass' },
        { value: 'theme-basic', text: 'Windows Basic' }
    ],
    'os-win8': [
        { value: 'theme-light', text: 'Light Mode' },
        { value: 'theme-dark', text: 'Dark Mode' }
    ],
    'os-win10': [
        { value: 'theme-light', text: 'Light Mode' },
        { value: 'theme-dark', text: 'Dark Mode' }
    ],
    'os-win11': [
        { value: 'theme-light', text: 'Light Mode' },
        { value: 'theme-dark', text: 'Dark Mode' }
    ],
    'os-macsys7': [
        { value: 'theme-bw', text: 'Black & White' }
    ],
    'os-macos9': [
        { value: 'theme-platinum', text: 'Platinum' }
    ],
    'os-macosx': [
        { value: 'theme-aqua', text: 'Aqua' },
        { value: 'theme-graphite', text: 'Graphite' }
    ],
    'os-osx-yosemite': [
        { value: 'theme-light', text: 'Light Mode' }
    ],
    'os-macos': [
        { value: 'theme-light', text: 'Light Mode' },
        { value: 'theme-dark', text: 'Dark Mode' }
    ],
    'os-ubuntu': [
        { value: 'theme-yaru', text: 'Yaru (Dark)' },
        { value: 'theme-ambiance', text: 'Ambiance (Classic)' }
    ],
    'os-mint': [
        { value: 'theme-dark', text: 'Mint-Y Dark' }
    ],
    'os-kali': [
        { value: 'theme-dark', text: 'Kali Undercover Dark' }
    ],
    'os-chromeos': [
        { value: 'theme-light', text: 'Light Mode' },
        { value: 'theme-dark', text: 'Dark Mode' }
    ]
};

// Array of all possible theme classes to strip out easily
const allThemeClasses = [];
for (const os in osThemes) {
    osThemes[os].forEach(theme => {
        if (!allThemeClasses.includes(theme.value)) {
            allThemeClasses.push(theme.value);
        }
    });
}

// Elements
const applyBtn = document.getElementById('apply-btn');
const themeSelect = document.getElementById('xp-dropdown');
const osToggle = document.getElementById('os-toggle');
const progressBar = document.getElementById('theme-progress');
const progressText = document.getElementById('progress-text');
const allButtons = document.querySelectorAll('.xp-button');

// 1. Handling the "Apply" Button for Themes with Animation
applyBtn.addEventListener('click', () => {
    // Disable buttons to simulate working
    allButtons.forEach(btn => btn.disabled = true);
    
    const selectedTheme = themeSelect.value;
    let width = 0;
    progressText.innerText = "Applying...";
    
    // Fake Progress Animation
    const interval = setInterval(() => {
        width += Math.floor(Math.random() * 15) + 5;
        if (width >= 100) {
            width = 100;
            clearInterval(interval);
            
            // Apply the actual theme visually
            document.body.classList.remove(...allThemeClasses);
            document.body.classList.add(selectedTheme);
            
            // Finish up
            progressText.innerText = "Applied successfully.";
            setTimeout(() => {
                progressBar.style.width = '0%';
                progressText.innerText = "Ready.";
                allButtons.forEach(btn => btn.disabled = false);
            }, 1000);
        }
        progressBar.style.width = width + '%';
    }, 100);
});

// 2. Handling the OS Switcher (now using the universal floating widget)
osToggle.addEventListener('change', (e) => {
    const selectedOS = e.target.value;

    // Remove all OS classes
    document.body.classList.remove(
        'os-win31', 'os-win95', 'os-win2000', 'os-xp', 'os-vista', 'os-win7', 'os-win8', 'os-win10', 'os-win11', 
        'os-macsys7', 'os-macos9', 'os-macosx', 'os-osx-yosemite', 'os-macos', 'os-ubuntu', 'os-mint', 'os-kali', 'os-chromeos'
    );
    
    // Add the newly selected OS class
    document.body.classList.add(selectedOS);

    // Update the Theme Dropdown based on the selected OS
    themeSelect.innerHTML = ''; // Clear current options
    
    const availableThemes = osThemes[selectedOS];
    availableThemes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.value;
        option.textContent = theme.text;
        themeSelect.appendChild(option);
    });

    // Automatically apply the first theme of the new OS
    const defaultTheme = availableThemes[0].value;
    document.body.classList.remove(...allThemeClasses);
    document.body.classList.add(defaultTheme);
    
    // Logic specifically to center the start button for Windows 11
    // (Other OSes keep it left-aligned)
    const startButton = document.querySelector('.start-button');
    const taskbarContainer = document.getElementById('taskbar');
    const centerAppsContainer = document.querySelector('.taskbar-center-apps');
    
    if (selectedOS === 'os-win11') {
        centerAppsContainer.appendChild(startButton);
    } else {
        taskbarContainer.insertBefore(startButton, taskbarContainer.firstChild);
    }
});