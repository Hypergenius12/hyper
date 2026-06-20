/* BIOS SETUP UTILITY */

let biosActive = false;
let biosSelectedIndex = 0;
const biosMenuCount = 13;

window.addEventListener('keydown', (e) => {
    // If during boot sequence, they press DEL to enter setup:
    let bootScr = document.getElementById('boot-screen');
    let biosScr = document.getElementById('bios-screen');
    let setupScr = document.getElementById('bios-setup-screen');
    
    // DEL key or F2 or Delete
    if((e.key === 'Delete' || e.key === 'Del' || e.key === 'F2') && biosScr && biosScr.style.display === 'block' && (!setupScr || setupScr.style.display === 'none')) {
        let setup = document.getElementById('bios-setup-screen');
        if(setup) {
            setup.style.display = 'block';
            biosActive = true;
            biosSelectedIndex = 0;
            updateBiosMenu();
        }
    }

    if(!biosActive) return;

    if(e.key === 'ArrowDown') {
        biosSelectedIndex++;
        if(biosSelectedIndex > 5 && biosSelectedIndex < 6) biosSelectedIndex = 6;
        if(biosSelectedIndex > biosMenuCount - 1) biosSelectedIndex = 0;
        updateBiosMenu();
    } else if(e.key === 'ArrowUp') {
        biosSelectedIndex--;
        if(biosSelectedIndex < 0) biosSelectedIndex = biosMenuCount - 1;
        updateBiosMenu();
    } else if(e.key === 'ArrowRight') {
        if(biosSelectedIndex < 6) biosSelectedIndex += 6;
        if(biosSelectedIndex > biosMenuCount - 1) biosSelectedIndex = biosMenuCount - 1;
        updateBiosMenu();
    } else if(e.key === 'ArrowLeft') {
        if(biosSelectedIndex >= 6) biosSelectedIndex -= 6;
        if(biosSelectedIndex < 0) biosSelectedIndex = 0;
        updateBiosMenu();
    } else if(e.key === 'Enter') {
        biosItemClick(biosSelectedIndex);
    } else if(e.key === 'Escape') {
        exitBios(false);
    } else if(e.key === 'F10') {
        exitBios(true);
    }
});

function updateBiosMenu() {
    let items = document.querySelectorAll('.bios-menu-item');
    items.forEach((item, index) => {
        if(index === biosSelectedIndex) {
            item.style.backgroundColor = '#AA0000';
            item.style.color = '#FFFFFF';
            // Update bottom msg
            let msgs = [
                "Time, Date, Hard Disk Type...",
                "Virus Warning, Boot Sequence...",
                "VGA Setting, RAM Timing...",
                "Port Configuration, IDE...",
                "Power Management, Wake Up...",
                "IRQ Settings, Latency...",
                "CPU Temp, Fan Speed, VCore...",
                "Load default fail-safe values",
                "Load optimal performance values",
                "Change Supervisor Password",
                "Change User Password",
                "Save Data to CMOS and Exit",
                "Abandon all changes and Exit"
            ];
            let msgBox = document.getElementById('bios-bottom-msg');
            if(msgBox) msgBox.innerText = msgs[index] || "";
        } else {
            item.style.backgroundColor = 'transparent';
            if(index >= 11) {
                item.style.color = '#FFFF00'; // Save & Exit colors
            } else {
                item.style.color = '#FFFFFF';
            }
        }
    });
}

window.biosSettings = JSON.parse(localStorage.getItem('xp_bios_settings')) || { fastBoot: false, bootOrder: 'HDD' };

window.biosItemClick = function(index) {
    biosSelectedIndex = index;
    updateBiosMenu();
    
    if(index === 0) {
        showBiosDialog("Standard CMOS Features", "System Time: " + new Date().toLocaleTimeString() + "<br>System Date: " + new Date().toLocaleDateString() + "<br><br>IDE Channel 0 Master: [Auto]<br>IDE Channel 0 Slave:  [None]");
    } else if (index === 1) {
        window.biosSettings.fastBoot = !window.biosSettings.fastBoot;
        showBiosDialog("Advanced BIOS Features", "Fast Boot (skip POST delay): [" + (window.biosSettings.fastBoot ? "Enabled" : "Disabled") + "]<br><br><i>Setting toggled!</i>");
    } else if (index === 2) {
        showBiosDialog("Advanced Chipset Features", "Memory Frequency: [Auto]<br>AGP Aperture Size: [64MB]");
    } else if (index === 3) {
        showBiosDialog("Integrated Peripherals", "Onboard Audio: [Auto]<br>USB Controller: [Enabled]");
    } else if (index === 4) {
        showBiosDialog("Power Management Setup", "ACPI Function: [Enabled]<br>Power on by Keyboard: [Disabled]");
    } else if (index === 5) {
        showBiosDialog("PnP/PCI Configurations", "Plug and Play OS: [Yes]<br>PCI Latency Timer: [32]");
    } else if (index === 6) {
        showBiosDialog("PC Health Status", "CPU Temperature: 45°C<br>System Temperature: 32°C<br>CPU Fan Speed: 2400 RPM<br>VCore: 1.35V");
    } else if (index === 7 || index === 8) {
        window.biosSettings = { fastBoot: false, bootOrder: 'HDD' };
        showBiosDialog("Load Defaults", "Defaults loaded successfully.");
    } else if (index === 9 || index === 10) {
        showBiosDialog("Password Setup", "Password cannot be changed in simulation mode.");
    } else if (index === 11) {
        // Save & Exit
        localStorage.setItem('xp_bios_settings', JSON.stringify(window.biosSettings));
        exitBios(true);
    } else if (index === 12) {
        // Exit Without Saving
        exitBios(false);
    } else {
        showBiosDialog("Feature Locked", "This feature is currently locked by the OEM.");
    }
};

function showBiosDialog(title, content) {
    let dlg = document.getElementById('bios-dialog');
    if(dlg) {
        document.getElementById('bios-dialog-title').innerText = title;
        document.getElementById('bios-dialog-content').innerHTML = content;
        dlg.style.display = 'block';
    }
}

window.closeBiosDialog = function() {
    let dlg = document.getElementById('bios-dialog');
    if(dlg) dlg.style.display = 'none';
}

function exitBios(save) {
    let setupScr = document.getElementById('bios-setup-screen');
    if(setupScr) setupScr.style.display = 'none';
    biosActive = false;
    closeBiosDialog();
    
    // Simulate re-boot
    if(save) {
        location.reload();
    } else {
        // Just let it continue the doBootSequence flow, but we can't easily resume if we hijacked it visually.
        // Easiest is just to reload to do a proper boot.
        location.reload();
    }
}

// Hook for CMD command
window.launchBiosSetup = function() {
    let setup = document.getElementById('bios-setup-screen');
    if(setup) {
        setup.style.display = 'block';
        biosActive = true;
        biosSelectedIndex = 0;
        updateBiosMenu();
    }
};
