/* Data Miner Clicker Game Logic - Mega Expansion Version */

let state = {
    bytes: 0,
    totalBytesGenerated: 0,
    bytesPerClick: 1,
    bytesPerSecond: 0,
    totalUpgradesOwned: 0,
    globalMultiplier: 1,
    servicePack: 0,
    lastSaveTime: Date.now(),
    turboActive: false,
    turboTimeLeft: 0,
    turboCooldown: 0,
    currentTab: 'hardware',
    upgrades: {
        // --- INPUT DEVICES (Clicks) ---
        mouse: { count: 0, baseCost: 15, costMult: 1.3, bps: 0, bpc: 1, name: "Optical Mouse", desc: "+1 Byte/Click", cat: "input" },
        ergonomic: { count: 0, baseCost: 60, costMult: 1.3, bps: 0, bpc: 2, name: "Ergonomic Pad", desc: "+2 Bytes/Click", cat: "input" },
        ball_mouse: { count: 0, baseCost: 150, costMult: 1.3, bps: 0, bpc: 5, name: "Trackball Mouse", desc: "+5 Bytes/Click", cat: "input" },
        mech_kb: { count: 0, baseCost: 600, costMult: 1.3, bps: 0, bpc: 12, name: "Mechanical Keyboard", desc: "+12 Bytes/Click", cat: "input" },
        macro_pad: { count: 0, baseCost: 2000, costMult: 1.3, bps: 0, bpc: 35, name: "Macro Pad", desc: "+35 Bytes/Click", cat: "input" },
        laser_mouse: { count: 0, baseCost: 5000, costMult: 1.3, bps: 0, bpc: 100, name: "Laser Mouse", desc: "+100 Bytes/Click", cat: "input" },
        dual_mouse: { count: 0, baseCost: 15000, costMult: 1.3, bps: 0, bpc: 250, name: "Dual-Mouse Setup", desc: "+250 Bytes/Click", cat: "input" },
        gamer_mouse: { count: 0, baseCost: 50000, costMult: 1.3, bps: 0, bpc: 600, name: "RGB Gaming Mouse", desc: "+600 Bytes/Click", cat: "input" },
        foot_pedal: { count: 0, baseCost: 150000, costMult: 1.3, bps: 0, bpc: 1500, name: "USB Foot Pedal", desc: "+1,500 Bytes/Click", cat: "input" },
        auto_clicker_pro: { count: 0, baseCost: 500000, costMult: 1.3, bps: 0, bpc: 4000, name: "AutoClicker Pro", desc: "+4,000 Bytes/Click", cat: "input" },
        haptic_glove: { count: 0, baseCost: 2000000, costMult: 1.3, bps: 0, bpc: 12000, name: "Haptic Glove", desc: "+12,000 Bytes/Click", cat: "input" },
        quantum_mouse: { count: 0, baseCost: 10000000, costMult: 1.3, bps: 0, bpc: 50000, name: "Quantum Mouse", desc: "+50,000 Bytes/Click", cat: "input" },
        thought_interface: { count: 0, baseCost: 50000000, costMult: 1.3, bps: 0, bpc: 200000, name: "Neural Interface", desc: "+200,000 Bytes/Click", cat: "input" },
        brain_uplink: { count: 0, baseCost: 250000000, costMult: 1.3, bps: 0, bpc: 1000000, name: "Brain Stem Uplink", desc: "+1M Bytes/Click", cat: "input" },
        reality_input: { count: 0, baseCost: 1000000000, costMult: 1.3, bps: 0, bpc: 5000000, name: "Reality Matrix Input", desc: "+5M Bytes/Click", cat: "input" },
        existence_tap: { count: 0, baseCost: 10000000000, costMult: 1.3, bps: 0, bpc: 25000000, name: "Existence Tap", desc: "+25M Bytes/Click", cat: "input" },
        god_click: { count: 0, baseCost: 100000000000, costMult: 1.3, bps: 0, bpc: 100000000, name: "Divine Command", desc: "+100M Bytes/Click", cat: "input" },
        
        // --- HARDWARE (BPS) ---
        abacus: { count: 0, baseCost: 50, costMult: 1.15, bps: 1, bpc: 0, name: "Wooden Abacus", desc: "+1 Byte/Sec", cat: "hardware" },
        eniac: { count: 0, baseCost: 250, costMult: 1.15, bps: 6, bpc: 0, name: "ENIAC Vacuum Tube", desc: "+6 Bytes/Sec", cat: "hardware" },
        calc_8086: { count: 0, baseCost: 800, costMult: 1.15, bps: 18, bpc: 0, name: "8086 Processor", desc: "+18 Bytes/Sec", cat: "hardware" },
        ram_32kb: { count: 0, baseCost: 3000, costMult: 1.15, bps: 50, bpc: 0, name: "32KB RAM Module", desc: "+50 Bytes/Sec", cat: "hardware" },
        cpu_386: { count: 0, baseCost: 10000, costMult: 1.15, bps: 150, bpc: 0, name: "386SX Processor", desc: "+150 Bytes/Sec", cat: "hardware" },
        math_co: { count: 0, baseCost: 35000, costMult: 1.15, bps: 450, bpc: 0, name: "Math Co-Processor", desc: "+450 Bytes/Sec", cat: "hardware" },
        cpu_486: { count: 0, baseCost: 100000, costMult: 1.15, bps: 1200, bpc: 0, name: "486DX Overdrive", desc: "+1,200 Bytes/Sec", cat: "hardware" },
        pentium: { count: 0, baseCost: 400000, costMult: 1.15, bps: 4000, bpc: 0, name: "Pentium 4", desc: "+4,000 Bytes/Sec", cat: "hardware" },
        zip_drive: { count: 0, baseCost: 1200000, costMult: 1.15, bps: 10000, bpc: 0, name: "Iomega Zip Drive", desc: "+10,000 Bytes/Sec", cat: "hardware" },
        voodoo_card: { count: 0, baseCost: 5000000, costMult: 1.15, bps: 35000, bpc: 0, name: "3dfx Voodoo", desc: "+35,000 Bytes/Sec", cat: "hardware" },
        sdram_128: { count: 0, baseCost: 20000000, costMult: 1.15, bps: 120000, bpc: 0, name: "128MB SDRAM", desc: "+120,000 Bytes/Sec", cat: "hardware" },
        scsi_raid: { count: 0, baseCost: 80000000, costMult: 1.15, bps: 400000, bpc: 0, name: "SCSI RAID Array", desc: "+400,000 Bytes/Sec", cat: "hardware" },
        core_2_duo: { count: 0, baseCost: 300000000, costMult: 1.15, bps: 1200000, bpc: 0, name: "Core 2 Duo", desc: "+1.2M Bytes/Sec", cat: "hardware" },
        titan_gpu: { count: 0, baseCost: 1000000000, costMult: 1.15, bps: 4000000, bpc: 0, name: "Titan GTX GPU", desc: "+4M Bytes/Sec", cat: "hardware" },
        server_rack: { count: 0, baseCost: 5000000000, costMult: 1.15, bps: 15000000, bpc: 0, name: "Server Rack", desc: "+15M Bytes/Sec", cat: "hardware" },
        mainframe_hw: { count: 0, baseCost: 25000000000, costMult: 1.15, bps: 60000000, bpc: 0, name: "Hardware Mainframe", desc: "+60M Bytes/Sec", cat: "hardware" },
        supercomp: { count: 0, baseCost: 100000000000, costMult: 1.15, bps: 200000000, bpc: 0, name: "Cray Supercomputer", desc: "+200M Bytes/Sec", cat: "hardware" },
        quantum_chip: { count: 0, baseCost: 5e11, costMult: 1.15, bps: 1e9, bpc: 0, name: "Quantum Chipset", desc: "+1B Bytes/Sec", cat: "hardware" },
        dyson_swarm: { count: 0, baseCost: 2e12, costMult: 1.15, bps: 5e9, bpc: 0, name: "Dyson Swarm", desc: "+5B Bytes/Sec", cat: "hardware" },
        galaxy_brain: { count: 0, baseCost: 1e13, costMult: 1.15, bps: 25e9, bpc: 0, name: "Galactic Processor", desc: "+25B Bytes/Sec", cat: "hardware" },
        
        // --- NETWORKING (BPS) ---
        acoust_coupl: { count: 0, baseCost: 150, costMult: 1.15, bps: 3, bpc: 0, name: "Acoustic Coupler", desc: "+3 Bytes/Sec", cat: "network" },
        modem_14k: { count: 0, baseCost: 700, costMult: 1.15, bps: 14, bpc: 0, name: "14.4k Modem", desc: "+14 Bytes/Sec", cat: "network" },
        modem_33k: { count: 0, baseCost: 2500, costMult: 1.15, bps: 45, bpc: 0, name: "33.6k Modem", desc: "+45 Bytes/Sec", cat: "network" },
        modem_56k: { count: 0, baseCost: 8000, costMult: 1.15, bps: 120, bpc: 0, name: "56k Dial-Up", desc: "+120 Bytes/Sec", cat: "network" },
        isdn_line: { count: 0, baseCost: 25000, costMult: 1.15, bps: 350, bpc: 0, name: "ISDN Line", desc: "+350 Bytes/Sec", cat: "network" },
        dsl_light: { count: 0, baseCost: 80000, costMult: 1.15, bps: 1000, bpc: 0, name: "DSL Lite", desc: "+1,000 Bytes/Sec", cat: "network" },
        broadband: { count: 0, baseCost: 250000, costMult: 1.15, bps: 3500, bpc: 0, name: "Cable Broadband", desc: "+3,500 Bytes/Sec", cat: "network" },
        wifi_b: { count: 0, baseCost: 1000000, costMult: 1.15, bps: 12000, bpc: 0, name: "802.11b Wi-Fi", desc: "+12,000 Bytes/Sec", cat: "network" },
        fast_eth: { count: 0, baseCost: 4000000, costMult: 1.15, bps: 45000, bpc: 0, name: "Fast Ethernet", desc: "+45,000 Bytes/Sec", cat: "network" },
        gigabit: { count: 0, baseCost: 15000000, costMult: 1.15, bps: 150000, bpc: 0, name: "Gigabit Link", desc: "+150,000 Bytes/Sec", cat: "network" },
        t1_conn: { count: 0, baseCost: 60000000, costMult: 1.15, bps: 500000, bpc: 0, name: "T1 Connection", desc: "+500,000 Bytes/Sec", cat: "network" },
        t3_trunk: { count: 0, baseCost: 200000000, costMult: 1.15, bps: 1.5e6, bpc: 0, name: "T3 Fiber Trunk", desc: "+1.5M Bytes/Sec", cat: "network" },
        fiber_node: { count: 0, baseCost: 1000000000, costMult: 1.15, bps: 6e6, bpc: 0, name: "Fiber Node", desc: "+6M Bytes/Sec", cat: "network" },
        sat_uplink: { count: 0, baseCost: 5000000000, costMult: 1.15, bps: 25e6, bpc: 0, name: "Satellite Link", desc: "+25M Bytes/Sec", cat: "network" },
        datacenter_net: { count: 0, baseCost: 20000000000, costMult: 1.15, bps: 80e6, bpc: 0, name: "Datacenter Net", desc: "+80M Bytes/Sec", cat: "network" },
        backbone: { count: 0, baseCost: 1e11, costMult: 1.15, bps: 400e6, bpc: 0, name: "Internet Backbone", desc: "+400M Bytes/Sec", cat: "network" },
        dark_fiber: { count: 0, baseCost: 5e11, costMult: 1.15, bps: 1.5e9, bpc: 0, name: "Dark Fiber", desc: "+1.5B Bytes/Sec", cat: "network" },
        tachyon_link: { count: 0, baseCost: 2e12, costMult: 1.15, bps: 6e9, bpc: 0, name: "Tachyonic Link", desc: "+6B Bytes/Sec", cat: "network" },
        quantum_net: { count: 0, baseCost: 1e13, costMult: 1.15, bps: 25e9, bpc: 0, name: "Quantum Entangler", desc: "+25B Bytes/Sec", cat: "network" },
        reality_link: { count: 0, baseCost: 5e13, costMult: 1.15, bps: 100e9, bpc: 0, name: "Reality Link", desc: "+100B Bytes/Sec", cat: "network" },
        
        // --- SOFTWARE & AI (BPS/MULT) ---
        script_vb: { count: 0, baseCost: 100, costMult: 1.15, bps: 2, bpc: 0, name: "VBScript Bot", desc: "+2 Bytes/Sec", cat: "software" },
        macro_excel: { count: 0, baseCost: 500, costMult: 1.15, bps: 10, bpc: 0, name: "Excel Macro", desc: "+10 Bytes/Sec", cat: "software" },
        batch_proc: { count: 0, baseCost: 2000, costMult: 1.15, bps: 35, bpc: 0, name: "Batch Processor", desc: "+35 Bytes/Sec", cat: "software" },
        sql_db: { count: 0, baseCost: 10000, costMult: 1.15, bps: 140, bpc: 0, name: "SQL Database", desc: "+140 Bytes/Sec", cat: "software" },
        web_crawler: { count: 0, baseCost: 40000, costMult: 1.15, bps: 500, bpc: 0, name: "Web Crawler", desc: "+500 Bytes/Sec", cat: "software" },
        cloud_compute: { count: 0, baseCost: 150000, costMult: 1.15, bps: 1800, bpc: 0, name: "Cloud Compute", desc: "+1,800 Bytes/Sec", cat: "software" },
        botnet_script: { count: 0, baseCost: 600000, costMult: 1.15, bps: 6500, bpc: 0, name: "Botnet Script", desc: "+6,500 Bytes/Sec", cat: "software" },
        deep_learning: { count: 0, baseCost: 2500000, costMult: 1.15, bps: 25000, bpc: 0, name: "Deep Learning", desc: "+25,000 Bytes/Sec", cat: "software" },
        neural_net_sw: { count: 0, baseCost: 10000000, costMult: 1.15, bps: 100000, bpc: 0, name: "Neural Network", desc: "+100,000 Bytes/Sec", cat: "software" },
        ag_intelligence: { count: 0, baseCost: 50000000, costMult: 1.15, bps: 400000, bpc: 0, name: "AGI Core", desc: "+400,000 Bytes/Sec", cat: "software" },
        ai_mining: { count: 0, baseCost: 200000000, costMult: 1.15, bps: 1.2e6, bpc: 0, name: "AI Mining Rig", desc: "+1.2M Bytes/Sec", cat: "software" },
        skynet_sw: { count: 0, baseCost: 1e9, costMult: 1.15, bps: 5e6, bpc: 0, name: "Skynet OS", desc: "+5M Bytes/Sec", cat: "software" },
        oracle_ai: { count: 0, baseCost: 5e9, costMult: 1.15, bps: 20e6, bpc: 0, name: "Oracle AI", desc: "+20M Bytes/Sec", cat: "software" },
        singularity_sw: { count: 0, baseCost: 25e9, costMult: 1.15, bps: 80e6, bpc: 0, name: "Singularity App", desc: "+80M Bytes/Sec", cat: "software" },
        omni_ai: { count: 0, baseCost: 150e9, costMult: 1.15, bps: 300e6, bpc: 0, name: "Omniscient AI", desc: "+300M Bytes/Sec", cat: "software" },
        universal_os: { count: 0, baseCost: 800e9, costMult: 1.15, bps: 1.2e9, bpc: 0, name: "Universal OS", desc: "+1.2B Bytes/Sec", cat: "software" },
        cosmic_code: { count: 0, baseCost: 4e12, costMult: 1.15, bps: 5e9, bpc: 0, name: "Cosmic Source", desc: "+5B Bytes/Sec", cat: "software" },
        existence_pkg: { count: 0, baseCost: 20e12, costMult: 1.15, bps: 20e9, bpc: 0, name: "Existence.pkg", desc: "+20B Bytes/Sec", cat: "software" },
        trans_kernel: { count: 0, baseCost: 100e12, costMult: 1.15, bps: 80e9, bpc: 0, name: "Transcendent Kernel", desc: "+80B Bytes/Sec", cat: "software" },
        void_compiler: { count: 0, baseCost: 500e12, costMult: 1.15, bps: 300e9, bpc: 0, name: "Void Compiler", desc: "+300B Bytes/Sec", cat: "software" },
    },
    achievements: {
        ach_1: { name: "Hello World", desc: "Mine 100 bytes.", req: () => state.totalBytesGenerated >= 100, unlocked: false },
        ach_2: { name: "Kilobyte", desc: "Mine 1,024 bytes.", req: () => state.totalBytesGenerated >= 1024, unlocked: false },
        ach_3: { name: "Megabyte", desc: "Mine 1,048,576 bytes.", req: () => state.totalBytesGenerated >= 1048576, unlocked: false },
        ach_4: { name: "Gigabyte", desc: "Mine 1 Billion bytes.", req: () => state.totalBytesGenerated >= 1000000000, unlocked: false },
        ach_5: { name: "Terabyte", desc: "Mine 1 Trillion bytes.", req: () => state.totalBytesGenerated >= 1000000000000, unlocked: false },
        ach_6: { name: "Petabyte", desc: "Mine 1 Quadrillion bytes.", req: () => state.totalBytesGenerated >= 1e15, unlocked: false },
        ach_7: { name: "Speed Demon", desc: "Reach 1,000 BPS.", req: () => state.bytesPerSecond >= 1000, unlocked: false },
        ach_8: { name: "Tech Mogul", desc: "Reach 1,000,000 BPS.", req: () => state.bytesPerSecond >= 1000000, unlocked: false },
        ach_9: { name: "Click Champion", desc: "Reach 1,000 BPC.", req: () => state.bytesPerClick >= 1000, unlocked: false },
        ach_10: { name: "Hardware Enthusiast", desc: "Buy 100 total upgrades.", req: () => state.totalUpgradesOwned >= 100, unlocked: false },
        ach_11: { name: "Service Pack 1", desc: "Upgrade to SP1.", req: () => state.servicePack >= 1, unlocked: false },
        ach_12: { name: "Turbo King", desc: "Have Turbo active 5 times.", req: () => turboCount >= 5, unlocked: false }
    }
};

let manualClicks = 0;
let turboCount = 0;

const PRESTIGE_THRESHOLD = 1e12; // 1 Trillion

window.getCost = function(id) {
    let up = state.upgrades[id];
    return Math.floor(up.baseCost * Math.pow(up.costMult, up.count));
};

window.clickMain = function(e) {
    let val = state.bytesPerClick;
    state.bytes += val;
    state.totalBytesGenerated += val;
    manualClicks++;
    
    updateUI();
};

window.buyUpgrade = function(id) {
    let cost = getCost(id);
    if (state.bytes >= cost) {
        state.bytes -= cost;
        state.upgrades[id].count++;
        state.totalUpgradesOwned++;
        recalculateStats();
        updateUI();
    }
};

function recalculateStats() {
    let bpc = 1;
    let bps = 0;
    
    for (let key in state.upgrades) {
        let up = state.upgrades[key];
        let milestoneMult = Math.pow(2, Math.floor(up.count / 25));
        bpc += (up.bpc || 0) * up.count * milestoneMult;
        bps += (up.bps || 0) * up.count * milestoneMult;
    }
    
    let totalMult = state.globalMultiplier;
    if (state.turboActive) totalMult *= 5;
    
    state.bytesPerClick = Math.floor(bpc * totalMult);
    state.bytesPerSecond = Math.floor(bps * totalMult);
}

function formatNumber(num) {
    if (num >= 1e18) return (num / 1e18).toFixed(2) + " E";
    if (num >= 1e15) return (num / 1e15).toFixed(2) + " Q";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + " T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + " G";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + " M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + " K";
    return Math.floor(num).toLocaleString();
}

window.setClickerTab = function(tab) {
    state.currentTab = tab;
    
    // Update active tab UI
    let tabs = document.querySelectorAll('.cl-tab');
    if(tabs.length > 0) {
        tabs.forEach(t => {
            t.classList.remove('active');
            if(t.dataset.tab === tab) t.classList.add('active');
        });
    }
    
    initUpgradesUI();
};

window.initUpgradesUI = function() {
    const container = document.getElementById('upgrades-container');
    if(!container) return;
    container.innerHTML = ''; 
    
    for (let key in state.upgrades) {
        let up = state.upgrades[key];
        if(up.cat !== state.currentTab) continue;
        
        let div = document.createElement('div');
        div.className = 'upgrade-item';
        let nextMilestone = (Math.floor(up.count / 25) + 1) * 25;
        let progress = (up.count % 25) / 25 * 100;
        
        div.innerHTML = `
            <div class="upgrade-info" style="flex:1;">
                <span class="upgrade-name" style="font-weight:bold; font-size:11px;">${up.name}</span>
                <span style="color:#555; font-size:10px; display:block;">${up.desc}</span>
                <div style="width:100%; height:4px; background:#ddd; margin:4px 0; border-radius:2px;">
                    <div style="width:${progress}%; height:100%; background:#0055E5; border-radius:2px;"></div>
                </div>
                <span style="font-size:9px;">Owned: <span id="count-${key}">0</span> (Goal: ${nextMilestone})</span>
            </div>
            <button id="btn-${key}" onclick="buyUpgrade('${key}')" style="min-width:60px; font-size:10px; padding:2px 5px;">Install</button>
        `;
        container.appendChild(div);
    }
    updateUI();
};

function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if(!container) return;
    container.innerHTML = '';
    let unlockedCount = 0;
    for (let key in state.achievements) {
        let ach = state.achievements[key];
        let div = document.createElement('div');
        div.className = 'achievement ' + (ach.unlocked ? 'unlocked' : '');
        div.innerHTML = ach.unlocked ? `[Unlocked] <b>${ach.name}</b>: ${ach.desc}` : `[Locked] <i>${ach.name}</i>: ???`;
        container.appendChild(div);
        if (ach.unlocked) unlockedCount++;
    }
    const achCountEl = document.getElementById('ach-count');
    if(achCountEl) achCountEl.innerText = unlockedCount;
}

function updateUI() {
    if(!document.getElementById('byte-count')) return;
    document.getElementById('byte-count').innerText = formatNumber(state.bytes);
    document.getElementById('bps-count').innerText = formatNumber(state.bytesPerSecond);
    document.getElementById('bpc-count').innerText = formatNumber(state.bytesPerClick);
    const totalUpEl = document.getElementById('total-upgrades');
    if(totalUpEl) totalUpEl.innerText = state.totalUpgradesOwned;
    
    let spText = document.getElementById('service-pack-info');
    if(spText) spText.innerText = "Service Pack " + state.servicePack + " (x" + state.globalMultiplier + ")";
    
    let prestigeBtn = document.getElementById('prestige-btn');
    if(prestigeBtn) prestigeBtn.style.display = (state.bytes >= PRESTIGE_THRESHOLD) ? 'block' : 'none';

    let turboBtn = document.getElementById('turbo-btn');
    if(turboBtn) {
        if(state.turboActive) {
            turboBtn.innerText = "TURBO: " + Math.ceil(state.turboTimeLeft) + "s";
            turboBtn.disabled = true;
            document.getElementById('main-clicker').classList.add('turbo-glow');
        } else if(state.turboCooldown > 0) {
            turboBtn.innerText = "Cool: " + Math.ceil(state.turboCooldown) + "s";
            turboBtn.disabled = true;
            document.getElementById('main-clicker').classList.remove('turbo-glow');
        } else {
            turboBtn.innerText = "TURBO BOOST"; turboBtn.disabled = false;
            document.getElementById('main-clicker').classList.remove('turbo-glow');
        }
    }

    for (let key in state.upgrades) {
        if(state.upgrades[key].cat !== state.currentTab) continue;
        let cost = getCost(key);
        let btn = document.getElementById('btn-' + key);
        if(btn) {
            let countEl = document.getElementById('count-' + key);
            if(countEl) countEl.innerText = state.upgrades[key].count;
            btn.disabled = (state.bytes < cost);
        }
    }
}

window.activateTurbo = function() {
    if(!state.turboActive && state.turboCooldown <= 0) {
        state.turboActive = true; state.turboTimeLeft = 15;
        turboCount++;
        recalculateStats(); updateUI();
    }
};

window.reinstallOS = async function() {
    if(state.bytes < PRESTIGE_THRESHOLD) return;
    if(typeof xpDialog === 'function') {
        let confirmed = await xpDialog("Update Service Pack", "Reinstall OS for Service Pack " + (state.servicePack + 1) + "?\n\nResets progress but gives permanent x5 to all gains.", "confirm");
        if(!confirmed) return;
    }
    state.servicePack++; state.globalMultiplier *= 5;
    state.bytes = 0; state.totalUpgradesOwned = 0;
    for(let key in state.upgrades) state.upgrades[key].count = 0;
    recalculateStats(); saveGame(); location.reload();
};


let lastTime = Date.now();
setInterval(() => {
    let now = Date.now();
    let deltaTime = (now - lastTime) / 1000;
    lastTime = now;

    if(state.turboActive) {
        state.turboTimeLeft -= deltaTime;
        if(state.turboTimeLeft <= 0) { state.turboActive = false; state.turboCooldown = 60; recalculateStats(); }
    } else if(state.turboCooldown > 0) state.turboCooldown -= deltaTime;

    if (state.bytesPerSecond > 0) {
        let gain = state.bytesPerSecond * deltaTime;
        state.bytes += gain; state.totalBytesGenerated += gain;
        updateUI();
    }


    let newlyUnlocked = false;
    for (let key in state.achievements) {
        let ach = state.achievements[key];
        if (!ach.unlocked && ach.req()) { ach.unlocked = true; newlyUnlocked = true; if(typeof showBalloon === 'function') showBalloon("Achievement Unlocked!", `${ach.name}`); }
    }
    if (newlyUnlocked) renderAchievements();
}, 100);

window.saveGame = function() {
    state.lastSaveTime = Date.now();
    try { localStorage.setItem('xpClickerSave_v5', JSON.stringify(state)); } catch(e) {}
};

window.loadGame = function() {
    let savedData = null;
    try { savedData = localStorage.getItem('xpClickerSave_v5'); } catch(e) {}
    if (savedData) {
        let parsed = JSON.parse(savedData);
        for (let k in parsed) {
            if (k === 'achievements') {
                for (let a in parsed.achievements) {
                    if (state.achievements[a]) state.achievements[a].unlocked = parsed.achievements[a].unlocked;
                }
            } else if (k === 'upgrades') {
                for (let u in parsed.upgrades) {
                    if (state.upgrades[u]) state.upgrades[u].count = parsed.upgrades[u].count;
                }
            } else {
                state[k] = parsed[k];
            }
        }
        let offTime = (Date.now() - state.lastSaveTime) / 1000;
        if(offTime > 30) {
            recalculateStats();
            let offGain = state.bytesPerSecond * offTime * 0.15;
            state.bytes += offGain; state.totalBytesGenerated += offGain;
        }
    }
    recalculateStats(); initUpgradesUI(); renderAchievements();
};

window.resetGame = async function() {
    if(typeof xpDialog === 'function' && await xpDialog("Format C:", "WIPE ALL DATA?", "confirm")) { try { localStorage.clear(); } catch(e) {} location.reload(); }
};

setInterval(saveGame, 30000);
loadGame();