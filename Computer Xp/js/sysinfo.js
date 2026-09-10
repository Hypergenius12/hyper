window.sysInfoData = {
    summary: [
        { item: 'OS Name', value: () => window.getRegistryValue("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", "ProductName") || 'Microsoft Windows XP' },
        { item: 'Version', value: () => "5.1.2600 " + (window.getRegistryValue("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion", "CSDVersion") || 'Service Pack 3') },
        { item: 'OS Manufacturer', value: 'Microsoft Corporation' },
        { item: 'System Name', value: 'ANTIGRAVITY-PC' },
        { item: 'System Manufacturer', value: 'Google Deepmind' },
        { item: 'System Model', value: 'Virtual JS Environment' },
        { item: 'System Type', value: 'X86-based PC' },
        { item: 'Processor', value: () => window.getRegistryValue("HKEY_LOCAL_MACHINE\\HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0", "ProcessorNameString") || 'x86 Family 6 Model 158' },
        { item: 'BIOS Version/Date', value: 'American Megatrends Inc. 0804, 1/1/2001' },
        { item: 'SMBIOS Version', value: '2.8' },
        { item: 'Windows Directory', value: 'C:\\WINDOWS' },
        { item: 'System Directory', value: 'C:\\WINDOWS\\system32' },
        { item: 'Boot Device', value: '\\Device\\HarddiskVolume1' },
        { item: 'Hardware Abstraction Layer', value: 'Version = "5.1.2600.5512 (xpsp.080413-2111)"' },
        { item: 'Total Physical Memory', value: '16,384.00 MB' },
        { item: 'Available Physical Memory', value: '12,542.45 MB' },
        { item: 'Total Virtual Memory', value: '2.00 GB' },
        { item: 'Available Virtual Memory', value: '1.96 GB' },
        { item: 'Page File Space', value: '24.00 GB' }
    ],
    hardware: [
        { item: 'Memory Address', value: '0xA0000-0xBFFFF' },
        { item: 'I/O Port', value: '0x00000000-0x00000CF7' },
        { item: 'IRQ Channel', value: 'IRQ 9' },
        { item: 'DMA Channel', value: 'Channel 4' },
        { item: 'Status', value: 'OK' }
    ],
    components: [
        { item: 'Multimedia', value: 'Audio Codecs, Video Codecs, CD-ROM' },
        { item: 'Display', value: 'NVIDIA GeForce Mock Virtual Display' },
        { item: 'Infrared', value: 'Not Installed' },
        { item: 'Input', value: 'Standard PS/2 Keyboard, HID-compliant mouse' },
        { item: 'Network', value: 'MAC Bridge Miniport' },
        { item: 'Ports', value: 'Serial (COM1), Parallel (LPT1)' }
    ],
    
    directx: [
        { item: 'DirectX Version', value: 'DirectX 9.0c (4.09.0000.0904)' },
        { item: 'DxDiag Version', value: '5.03.2600.5512 32-bit Unicode' },
        { item: 'DirectDraw Acceleration', value: 'Enabled' },
        { item: 'Direct3D Acceleration', value: 'Enabled' },
        { item: 'AGP Texture Acceleration', value: 'Enabled' },
        { item: 'WHQL Logo\'d', value: 'Yes' },
        { item: 'DDI Version', value: '9 (or higher)' }
    ],
    network: [
        { item: 'IP Address', value: '192.168.1.104' },
        { item: 'Subnet Mask', value: '255.255.255.0' },
        { item: 'Default Gateway', value: '192.168.1.1' },
        { item: 'DHCP Server', value: '192.168.1.1' },
        { item: 'DNS Servers', value: '8.8.8.8, 8.8.4.4' },
        { item: 'MAC Address', value: '00:1A:2B:3C:4D:5E' },
        { item: 'Connection Status', value: 'Connected' },
        { item: 'Adapter Type', value: 'Ethernet 802.3' }
    ],
    software: [
        { item: 'System Drivers', value: 'Running' },
        { item: 'Signed Drivers', value: 'Not Available' },
        { item: 'Environment Variables', value: 'PATH, TEMP, TMP' },
        { item: 'Print Jobs', value: '0' },
        { item: 'Network Connections', value: 'Local Area Connection' },
        { item: 'Running Tasks', value: 'explorer.exe, svchost.exe' },
        { item: 'Loaded Modules', value: 'ntdll.dll, kernel32.dll, user32.dll' },
        { item: 'Services', value: 'Stopped: 14, Running: 42' }
    ]
};

window.showSysInfo = function(category) {
    let table = document.getElementById('sysinfo-table');
    if (!table) return;
    
    // reset table
    table.innerHTML = '<tr style="background:#ECE9D8; border-bottom:1px solid #ACA899;"><th style="text-align:left; padding:3px; width:40%;">Item</th><th style="text-align:left; padding:3px;">Value</th></tr>';
    
    let data = window.sysInfoData[category] || window.sysInfoData['summary'];
    
    data.forEach(row => {
        let tr = document.createElement('tr');
        let td1 = document.createElement('td');
        td1.style.cssText = "padding:3px; border-bottom:1px solid #f0f0f0; border-right:1px solid #f0f0f0;";
        td1.innerText = row.item;
        
        let td2 = document.createElement('td');
        td2.style.cssText = "padding:3px; border-bottom:1px solid #f0f0f0;";
        td2.innerText = typeof row.value === "function" ? row.value() : row.value;
        
        tr.appendChild(td1);
        tr.appendChild(td2);
        table.appendChild(tr);
    });
};

// Auto-run when opened
window.showSysInfo('summary');


window.findSysInfo = function() {
    let input = document.getElementById('sysinfo-search-input');
    if (!input) return;
    let query = input.value.toLowerCase();
    
    let table = document.getElementById('sysinfo-table');
    if (!table) return;
    
    let rows = table.getElementsByTagName('tr');
    let foundAny = false;
    // Skip the header row (index 0)
    for (let i = 1; i < rows.length; i++) {
        let text = rows[i].innerText.toLowerCase();
        if (text.includes(query)) {
            rows[i].style.display = '';
            foundAny = true;
        } else {
            rows[i].style.display = 'none';
        }
    }
    
    if(!foundAny && query !== '') {
        if(typeof window.xpDialog === 'function') window.xpDialog('System Information', 'Windows cannot find "' + query + '".', 'info');
    }
};