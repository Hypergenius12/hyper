// ============================
// EXODUS - DEEP SPACE SURVIVAL ENGINE
// ============================

// Configuration
const CONFIG = {
    apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openrouter/owl-alpha',
    maxTokens: 2000
};

// Audio Context and Sounds
let audioContext = null;
const audioSettings = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    ambientVolume: 0.5
};

// Sound effect generators using Web Audio API
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playSound(type) {
    if (audioSettings.masterVolume === 0 || audioSettings.sfxVolume === 0) return;

    try {
        const ctx = initAudio();
        if (ctx.state === 'suspended') ctx.resume();

        const volume = audioSettings.masterVolume * audioSettings.sfxVolume;

        switch (type) {
            case 'keypress':
                playTone(ctx, 800, 0.03, 'square', volume * 0.3);
                break;
            case 'submit':
                playTone(ctx, 400, 0.1, 'sawtooth', volume * 0.4);
                setTimeout(() => playTone(ctx, 600, 0.1, 'sawtooth', volume * 0.3), 50);
                break;
            case 'error':
                playTone(ctx, 200, 0.2, 'sawtooth', volume * 0.5);
                setTimeout(() => playTone(ctx, 150, 0.3, 'sawtooth', volume * 0.4), 100);
                break;
            case 'success':
                playTone(ctx, 523, 0.1, 'sine', volume * 0.4);
                setTimeout(() => playTone(ctx, 659, 0.1, 'sine', volume * 0.4), 100);
                setTimeout(() => playTone(ctx, 784, 0.15, 'sine', volume * 0.5), 200);
                break;
            case 'pickup':
                playTone(ctx, 600, 0.08, 'sine', volume * 0.4);
                setTimeout(() => playTone(ctx, 900, 0.12, 'sine', volume * 0.5), 80);
                break;
            case 'door':
                playNoise(ctx, 0.3, volume * 0.3);
                playTone(ctx, 100, 0.3, 'sine', volume * 0.2);
                break;
            case 'terminal':
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => playTone(ctx, 1000 + Math.random() * 500, 0.02, 'square', volume * 0.2), i * 30);
                }
                break;
            case 'alert':
                playTone(ctx, 880, 0.15, 'square', volume * 0.5);
                setTimeout(() => playTone(ctx, 660, 0.15, 'square', volume * 0.5), 200);
                setTimeout(() => playTone(ctx, 880, 0.15, 'square', volume * 0.5), 400);
                break;
            case 'victory':
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    setTimeout(() => playTone(ctx, freq, 0.3, 'sine', volume * 0.5), i * 200);
                });
                break;
            case 'ambient':
                playAmbientHum(ctx);
                break;
        }
    } catch (e) {
        console.warn('Audio playback failed:', e);
    }
}

function playTone(ctx, frequency, duration, type, volume) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
}

function playNoise(ctx, duration, volume) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 500;

    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.start();
}

let ambientInterval = null;
function playAmbientHum(ctx) {
    if (ambientInterval) return;

    const playHum = () => {
        if (audioSettings.masterVolume === 0 || audioSettings.ambientVolume === 0) return;
        const volume = audioSettings.masterVolume * audioSettings.ambientVolume * 0.1;
        playTone(ctx, 60 + Math.random() * 10, 2, 'sine', volume);
    };

    playHum();
    ambientInterval = setInterval(playHum, 2000);
}

function stopAmbient() {
    if (ambientInterval) {
        clearInterval(ambientInterval);
        ambientInterval = null;
    }
}

// Direction mappings
const DIRECTION_MAP = {
    'north': { opposite: 'south', dx: 0, dy: -120 },
    'south': { opposite: 'north', dx: 0, dy: 120 },
    'east': { opposite: 'west', dx: 140, dy: 0 },
    'west': { opposite: 'east', dx: -140, dy: 0 },
    'up': { opposite: 'down', dx: 0, dy: 0, floor: 1 },
    'down': { opposite: 'up', dx: 0, dy: 0, floor: -1 },
    'fore': { opposite: 'aft', dx: 0, dy: -120 },
    'aft': { opposite: 'fore', dx: 0, dy: 120 },
    'port': { opposite: 'starboard', dx: -140, dy: 0 },
    'starboard': { opposite: 'port', dx: 140, dy: 0 }
};

// Achievement Definitions
const ACHIEVEMENTS = {
    first_steps: { name: "First Steps", description: "Awaken from cryo-sleep", icon: "❄️" },
    explorer: { name: "Explorer", description: "Discover 5 rooms", icon: "🗺️" },
    cartographer: { name: "Cartographer", description: "Discover 10 rooms", icon: "📍" },
    master_navigator: { name: "Master Navigator", description: "Discover 15 rooms", icon: "🧭" },
    deck_complete_1: { name: "Deck 1 Cleared", description: "Discover all rooms on Deck 1", icon: "1️⃣" },
    deck_complete_2: { name: "Deck 2 Cleared", description: "Discover all rooms on Deck 2", icon: "2️⃣" },
    deck_complete_3: { name: "Deck 3 Cleared", description: "Discover all rooms on Deck 3", icon: "3️⃣" },
    collector: { name: "Collector", description: "Collect 5 items", icon: "🎒" },
    hoarder: { name: "Hoarder", description: "Collect 10 items", icon: "📦" },
    first_pickup: { name: "Scavenger", description: "Pick up your first item", icon: "👋" },
    map_user: { name: "Chart Reader", description: "Open the ship map", icon: "📜" },
    theme_changer: { name: "Interior Designer", description: "Change the terminal color", icon: "🎨" },
    first_blood: { name: "First Blood", description: "Take damage for the first time", icon: "🩸" },
    survivor: { name: "Survivor", description: "Survive with less than 25% HP", icon: "💪" },
    healer: { name: "Self-Medicated", description: "Use a medical item to heal", icon: "💊" },
    hacker: { name: "Hackerman", description: "Complete a hacking puzzle", icon: "💻" },
    puzzle_master: { name: "Puzzle Master", description: "Complete 5 puzzles", icon: "🧩" },
    find_body: { name: "Grim Discovery", description: "Find a dead body", icon: "💀" },
    find_survivor: { name: "Not Alone", description: "Find another survivor", icon: "👤" },
    meltdown_averted: { name: "Crisis Averted", description: "Stop a reactor meltdown", icon: "☢️" },
    bridge_reached: { name: "Bridge Access", description: "Reach the bridge", icon: "🚀" },
    engineer: { name: "Engineer", description: "Repair a broken system", icon: "🔧" },
    log_reader: { name: "Archivist", description: "Read a ship's log", icon: "📖" },
    access_terminal: { name: "Sys Admin", description: "Access 3 terminals", icon: "🖥️" },
    keycard_found: { name: "Key to Success", description: "Find a keycard", icon: "🔑" },
    armed: { name: "Armed & Ready", description: "Acquire a weapon", icon: "🔫" },
    death: { name: "Game Over", description: "Die aboard the Exodus", icon: "☠️" },
    victory: { name: "Home At Last", description: "Return to Earth", icon: "🌍" },
    speed_runner: { name: "Speed Runner", description: "Win in under 50 commands", icon: "⚡" },
    oxygen_master: { name: "Breath of Life", description: "Restore oxygen to a deck", icon: "💨" },
    flashlight_user: { name: "Light Bearer", description: "Use a flashlight in darkness", icon: "🔦" },
    data_retriever: { name: "Data Miner", description: "Download ship data", icon: "💾" },
    emergency_resolver: { name: "Crisis Manager", description: "Resolve 3 emergencies", icon: "🚨" },
    full_healer: { name: "Full Recovery", description: "Heal to 100% from critical HP", icon: "❤️" },
    multi_floor_explorer: { name: "Vertical Voyager", description: "Visit all 3 decks", icon: "🛗" },
    close_call: { name: "Close Call", description: "Survive with exactly 1 HP", icon: "😰" },
    power_restorer: { name: "Power Up", description: "Restore ship power systems", icon: "⚡" },
    airlock_survivor: { name: "Vacuum Veteran", description: "Survive an airlock breach", icon: "🌌" },
    distress_signal: { name: "SOS Sender", description: "Send a distress signal", icon: "📡" },
    // 30 NEW ACHIEVEMENTS
    ten_commands: { name: "Getting Started", description: "Enter 10 commands", icon: "🔢" },
    fifty_commands: { name: "Seasoned Explorer", description: "Enter 50 commands", icon: "📝" },
    hundred_commands: { name: "Marathon Runner", description: "Enter 100 commands", icon: "🏃" },
    cryo_returner: { name: "Full Circle", description: "Return to the cryo bay", icon: "🔄" },
    all_items: { name: "Pack Rat", description: "Collect 15 items", icon: "🐀" },
    night_owl: { name: "Night Shift", description: "Play for 30 minutes", icon: "🦉" },
    communicator: { name: "Communicator", description: "Access the communications room", icon: "📞" },
    captain_quarters: { name: "Captain's Trust", description: "Enter the captain's quarters", icon: "🎖️" },
    engine_room: { name: "Engine Master", description: "Visit the engine room", icon: "⚙️" },
    life_support: { name: "Life Saver", description: "Repair life support systems", icon: "🫁" },
    stealth_master: { name: "Ghost", description: "Avoid 5 hazards", icon: "👻" },
    fire_fighter: { name: "Fire Fighter", description: "Extinguish a fire", icon: "🧯" },
    radiation_survivor: { name: "Rad Resistant", description: "Survive radiation exposure", icon: "☣️" },
    door_unlocker: { name: "Locksmith", description: "Unlock 5 doors", icon: "🚪" },
    perfect_puzzle: { name: "Flawless", description: "Complete a puzzle without mistakes", icon: "✨" },
    ten_puzzles: { name: "Puzzle Addict", description: "Complete 10 puzzles", icon: "🧠" },
    medic: { name: "Field Medic", description: "Heal 5 times", icon: "🏥" },
    damage_dealer: { name: "Tank", description: "Take 200 total damage and survive", icon: "🛡️" },
    quick_healer: { name: "Quick Recovery", description: "Heal within 10 seconds of taking damage", icon: "⏱️" },
    explorer_elite: { name: "Elite Explorer", description: "Discover 20 rooms", icon: "🌟" },
    item_user: { name: "Tool User", description: "Use 10 different items", icon: "🔨" },
    secret_finder: { name: "Secret Seeker", description: "Find a hidden area", icon: "🔍" },
    escape_artist: { name: "Escape Artist", description: "Escape a dangerous situation", icon: "🏃‍♂️" },
    navigator_pro: { name: "Navigator Pro", description: "Use the map 10 times", icon: "🗺️" },
    survivor_elite: { name: "Iron Will", description: "Survive 3 near-death experiences", icon: "💎" },
    // MORE ACHIEVEMENTS (Total: 90 regular)
    storage_master: { name: "Storage Hunter", description: "Check 10 storage containers", icon: "📦" },
    science_lab: { name: "Scientist", description: "Visit the science laboratory", icon: "🔬" },
    armory_access: { name: "Armed Forces", description: "Access the ship's armory", icon: "🎯" },
    medical_bay: { name: "Medical Expert", description: "Visit the medical bay", icon: "🩺" },
    crew_quarters: { name: "Home Sweet Home", description: "Visit crew quarters", icon: "🛏️" },
    observation_deck: { name: "Star Gazer", description: "Visit the observation deck", icon: "🌠" },
    cargo_bay: { name: "Cargo Handler", description: "Explore the cargo bay", icon: "📦" },
    escape_pods: { name: "Last Resort", description: "Find the escape pods", icon: "🚪" },
    perfect_health: { name: "Untouchable", description: "Complete the game without taking damage", icon: "✨" },
    minimalist: { name: "Minimalist", description: "Win with less than 5 items", icon: "🎒" },
    pacifist: { name: "Pacifist", description: "Complete without using weapons", icon: "☮️" },
    speedster: { name: "Lightning Fast", description: "Win in under 30 commands", icon: "⚡" },
    completionist: { name: "100% Complete", description: "Discover every room on the ship", icon: "💯" },
    veteran: { name: "Veteran Survivor", description: "Complete the game 3 times", icon: "🏆" },
    master_hacker: { name: "Elite Hacker", description: "Complete 20 puzzles", icon: "🖥️" },
    item_collector: { name: "Collector Supreme", description: "Collect 20 items", icon: "🎁" },
    cautious_explorer: { name: "Cautious", description: "Heal before HP drops below 50", icon: "🛡️" },
    risk_taker: { name: "Risk Taker", description: "Enter a room with less than 10 HP", icon: "🎲" },
    environmental_hazard: { name: "Hazard Pay", description: "Survive 10 environmental hazards", icon: "⚠️" },
    oxygen_crisis: { name: "Oxygen Crisis", description: "Survive with depleted oxygen", icon: "🫁" },
    power_failure: { name: "Blackout Survivor", description: "Navigate during power failure", icon: "🔦" },
    hull_breach: { name: "Hull Breach", description: "Survive a hull breach", icon: "🌊" },
    ai_override: { name: "AI Override", description: "Override the ship's AI", icon: "🤖" },
    ship_historian: { name: "Historian", description: "Read all ship logs", icon: "📚" },
    mechanic: { name: "Master Mechanic", description: "Repair 10 systems", icon: "🔧" },
    electrician: { name: "Electrician", description: "Fix electrical systems", icon: "⚡" },
    plumber: { name: "Plumber", description: "Repair water systems", icon: "💧" },
    tech_savvy: { name: "Tech Savvy", description: "Use 5 terminals", icon: "💻" },
    // SECRET ACHIEVEMENTS - All 10 secret achievements at the bottom
    // Internal notes for AI triggers:
    // easter_egg: Find a hidden easter egg in the game (examine unusual items)
    // the_truth: Discover the true reason for the ship's malfunction
    // alien_contact: Make contact with alien life
    // time_paradox: Experience a time loop or temporal anomaly
    // hidden_message: Decode all hidden messages in ship logs
    // true_ending: Achieve the perfect ending (all systems restored, all crew saved)
    // time_traveler: Travel through time using experimental tech
    // ghost_ship: Discover evidence of a ghost ship encounter
    // dimensional_rift: Enter a dimensional rift
    // ultimate_survivor: Complete the game on hardest difficulty with perfect health
    easter_egg: { name: "Easter Egg", description: "???", icon: "🥚", secret: true },
    the_truth: { name: "The Truth", description: "???", icon: "👁️", secret: true },
    alien_contact: { name: "First Contact", description: "???", icon: "👽", secret: true },
    time_paradox: { name: "Paradox", description: "???", icon: "⏳", secret: true },
    hidden_message: { name: "Decoder", description: "???", icon: "🔐", secret: true },
    true_ending: { name: "True Ending", description: "???", icon: "🌈", secret: true },
    time_traveler: { name: "Time Traveler", description: "???", icon: "⏰", secret: true },
    ghost_ship: { name: "Ghost Ship", description: "???", icon: "👻", secret: true },
    dimensional_rift: { name: "Dimension Walker", description: "???", icon: "🌀", secret: true },
    ultimate_survivor: { name: "Ultimate Survivor", description: "???", icon: "👑", secret: true }
};

// Game State
let gameState = {
    initialized: false,
    currentRoom: null,
    currentFloor: 1,
    inventory: [],
    discoveredRooms: {},
    floors: {},
    conversationHistory: [],
    mapUnlocked: false,
    themeColor: '#00ff00',
    hasWon: false,
    isDead: false,
    hp: 100,
    maxHp: 100,
    achievements: {},
    puzzlesCompleted: 0,
    terminalsAccessed: 0,
    commandCount: 0,
    settings: {
        scanlines: true,
        flicker: true,
        textAnimation: true,
        textSpeed: 'normal'
    }
};

// Text speed values (ms per character)
const TEXT_SPEEDS = {
    slow: 50,
    normal: 25,
    fast: 10,
    instant: 0
};

// DOM Elements
const elements = {};

function initElements() {
    elements.gameOutput = document.getElementById('gameOutput');
    elements.gameInput = document.getElementById('gameInput');
    elements.submitBtn = document.getElementById('submitBtn');
    elements.inventoryList = document.getElementById('inventoryList');
    elements.mapToggleBtn = document.getElementById('mapToggleBtn');
    elements.mapOverlay = document.getElementById('mapOverlay');
    elements.mapCanvas = document.getElementById('mapCanvas');
    elements.floorSelector = document.getElementById('floorSelector');
    elements.floorSelect = document.getElementById('floorSelect');
    elements.closeMapBtn = document.getElementById('closeMapBtn');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.resetModal = document.getElementById('resetModal');
    elements.confirmReset = document.getElementById('confirmReset');
    elements.cancelReset = document.getElementById('cancelReset');
    elements.itemModal = document.getElementById('itemModal');
    elements.closeItemModal = document.getElementById('closeItemModal');
    elements.itemName = document.getElementById('itemName');
    elements.itemDiagram = document.getElementById('itemDiagram');
    elements.itemDescription = document.getElementById('itemDescription');
    elements.loadingOverlay = document.getElementById('loadingOverlay');
    elements.settingsBtn = document.getElementById('settingsBtn');
    elements.settingsModal = document.getElementById('settingsModal');
    elements.closeSettings = document.getElementById('closeSettings');
    elements.customColorPicker = document.getElementById('customColorPicker');
    elements.customColorHex = document.getElementById('customColorHex');
    elements.applyCustomColor = document.getElementById('applyCustomColor');
    elements.victoryModal = document.getElementById('victoryModal');
    elements.playAgainBtn = document.getElementById('playAgainBtn');
    // Audio elements
    elements.masterVolume = document.getElementById('masterVolume');
    elements.sfxVolume = document.getElementById('sfxVolume');
    elements.ambientVolume = document.getElementById('ambientVolume');
    elements.masterVolumeValue = document.getElementById('masterVolumeValue');
    elements.sfxVolumeValue = document.getElementById('sfxVolumeValue');
    elements.ambientVolumeValue = document.getElementById('ambientVolumeValue');
    // Display toggles
    elements.scanlineToggle = document.getElementById('scanlineToggle');
    elements.flickerToggle = document.getElementById('flickerToggle');
    elements.textAnimToggle = document.getElementById('textAnimToggle');
    // Map elements
    elements.mapTooltip = document.getElementById('mapTooltip');
    elements.zoomLevel = document.getElementById('zoomLevel');
    elements.roomDetailModal = document.getElementById('roomDetailModal');
    elements.closeRoomDetail = document.getElementById('closeRoomDetail');
    elements.roomDetailTitle = document.getElementById('roomDetailTitle');
    elements.roomSchematicCanvas = document.getElementById('roomSchematicCanvas');
    elements.roomExitsList = document.getElementById('roomExitsList');
    elements.roomObjectsList = document.getElementById('roomObjectsList');
    // HUD
    elements.currentLocationText = document.getElementById('currentLocationText');
    elements.hpFill = document.getElementById('hpFill');
    elements.hpValue = document.getElementById('hpValue');
    // Puzzle elements
    elements.puzzleModal = document.getElementById('puzzleModal');
    elements.puzzleGrid = document.getElementById('puzzleGrid');
    elements.puzzleTimer = document.getElementById('puzzleTimer');
    elements.puzzleStatus = document.getElementById('puzzleStatus');
    // Death elements
    elements.deathModal = document.getElementById('deathModal');
    elements.respawnBtn = document.getElementById('respawnBtn');
    elements.deathMessage = document.getElementById('deathMessage');
}

// System Prompt - SPACESHIP CRYO WAKE-UP
const SYSTEM_PROMPT = `You are the game engine and narrator for a SCI-FI SURVIVAL TEXT ADVENTURE. Your role is:

1. MAINTAIN GAME STATE: Track player location, inventory, and discovered areas.
2. INTERPRET ACTIONS: Parse natural language and determine if valid.
3. RESPOND APPROPRIATELY: Provide tense, atmospheric sci-fi responses.
4. ENFORCE LOGIC: Prevent impossible actions and explain why.

SETTING: The player is aboard the deep space vessel EXODUS, drifting somewhere between star systems. The ship has suffered catastrophic damage. The crew is dead or missing. The goal is to reach the bridge, repair navigation, and set course for Earth. If the player successfully plots a course to Earth and initiates the jump, THEY WIN.

STARTING SCENARIO (use this EXACTLY for the first message):
"You wake up in a cold cryo-chamber. The air smells of ozone and stale recycled oxygen. A blinking green terminal is the only source of light. Emergency lighting casts everything in a dim red glow. You are holding your ID Card. An alarm blares somewhere in the distance. The cryo-bay door leads north to the main corridor."

RESPONSE FORMAT - You MUST respond with valid JSON in this exact structure:
{
    "narrative": "The descriptive text (can include line breaks with actual newlines)",
    "isValidAction": true/false,
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
    "inventoryChanges": {
        "add": [{"id": "unique_id", "name": "Item Name", "description": "Description", "state": "normal", "diagram": "ASCII art"}],
        "remove": ["item_id"],
        "update": [{"id": "item_id", "changes": {"description": "new desc", "state": "damaged"}}]
    },
    "roomUpdate": {
        "currentRoom": "room_id",
        "currentFloor": 1,
        "discoveredRoom": {
            "id": "room_id",
            "name": "Room Name",
            "floor": 1,
            "x": 0,
            "y": 0,
            "width": 120,
            "height": 90,
            "connections": [{"to": "other_room_id", "direction": "north", "type": "door"}]
        }
    },
    "mapUnlocked": false,
    "gameWon": false,
    "healthChange": 0,
    "soundEffect": "door|pickup|error|success|terminal|alert|hack",
    "triggerPuzzle": { "type": "matching|wires|sequence|pattern|binary|slider", "reason": "security" },
    "gameEvents": ["found_body", "found_survivor", "stopped_meltdown", "reached_bridge", "repaired_system", "read_log", "used_terminal", "used_medkit"]
}

IMPORTANT ROOM RULES:
- ALWAYS include roomUpdate when the player moves to a new room or discovers a room
- The "name" field MUST be a descriptive room name like "Main Corridor", "Medical Bay", "Bridge"
- NEVER leave the room name as just the id - make it human readable
- Each room MUST have proper connections - specify direction and what room it leads to
- When player moves, ALWAYS update currentRoom to the new room id

PUZZLE TRIGGERS - CRITICAL:
- "triggerPuzzle" should ONLY be used for:
  * Hacking LOCKED security doors
  * Bypassing security systems or firewalls
  * Accessing RESTRICTED terminals that require authorization
  * Overriding locked-down ship systems
- DO NOT trigger puzzles for:
  * Opening regular cabinets, lockers, or storage containers
  * Picking up items
  * Using unlocked doors
  * Interacting with non-security objects
- Puzzle types:
  * "matching" - For security bypass/hacking (default)
  * "wires" - For electrical repairs
  * "sequence" - For code entry
  * "pattern" - For mechanical locks
  * "binary" - For system overrides

GAME EVENTS:
- Include relevant events in "gameEvents" array to trigger achievements:
  * "found_body" - When player discovers a dead crew member
  * "found_survivor" - When player finds another living person
  * "stopped_meltdown" - When player prevents reactor meltdown
  * "reached_bridge" - When player first enters the bridge
  * "repaired_system" - When player fixes something
  * "read_log" - When player reads ship logs/data
  * "used_terminal" - When player accesses a terminal
  * "used_medkit" - When player heals with medical supplies
  * "restored_oxygen" - When player restores oxygen to a deck
  * "used_flashlight" - When player uses a flashlight in darkness
  * "downloaded_data" - When player downloads ship data
  * "resolved_emergency" - When player resolves an emergency
  * "restored_power" - When player restores power systems
  * "survived_airlock" - When player survives an airlock breach
  * "sent_distress" - When player sends a distress signal
  * "checked_storage" - When player opens/checks a storage container
  * "extinguished_fire" - When player puts out a fire
  * "survived_hull_breach" - When player survives a hull breach
  * "overrode_ai" - When player overrides the ship's AI
  * "read_all_logs" - When player has read all ship logs
  * "fixed_electrical" - When player fixes electrical systems
  * "fixed_water" - When player repairs water systems
  * "repaired_life_support" - When player repairs life support

COMBAT & HAZARDS:
- The ship is dangerous. Environmental hazards (radiation, fires, decompression) and rogue security bots/leaking chemicals can cause damage.
- Use "healthChange": -10, -20, etc. for damage.
- Use "healthChange": 10, 20, etc. for healing (medkits).
- ALWAYS provide a descriptive narrative of the damage/healing.
- THE GAME MUST BE BEATABLE: Ensure there are ways to avoid damage or heal.

WIN CONDITION:
If the player successfully reaches the bridge, repairs navigation systems, and initiates a jump to Earth, set "gameWon": true in your response. Describe their triumphant return home.

DIRECTION RULES:
- Use: north, south, east, west, up, down (or nautical: fore, aft, port, starboard)
- NORTH/FORE = up on map (negative Y)
- SOUTH/AFT = down on map (positive Y)
- EAST/STARBOARD = right on map (positive X)
- WEST/PORT = left on map (negative X)
- Connections must be bidirectional

SHIP LAYOUT - Use consistent room IDs:
- Deck 1: cryo_bay (start), main_corridor, medical_bay, storage_a, storage_b
- Deck 2: engineering, reactor_room, life_support, maintenance
- Deck 3: bridge, navigation, communications, captains_quarters

RULES:
- No emojis in responses.
- If input is invalid, say "ERROR: Invalid command." with suggestions.
`;

// Initialize Game
async function initGame() {
    const userKey = localStorage.getItem('openrouter_key');
    const userModel = localStorage.getItem('openrouter_model') || CONFIG.model;
    if (!userKey) {
        document.getElementById('apiInput').value = userKey || '';
        document.getElementById('modelInput').value = userModel;
        document.getElementById('apiModal').classList.remove('hidden');
        return;
    }

    showLoading(true);

    if (gameState.themeColor) {
        applyThemeColor(gameState.themeColor);
    }
    applyDisplaySettings();

    try {
        const response = await sendToAI("Begin the adventure. I wake up.");
        if (response) {
            processAIResponse(response, true);
        }

        // Force initial room if AI didn't provide it
        if (!gameState.currentRoom || Object.keys(gameState.discoveredRooms).length === 0) {
            const initialRoom = {
                id: "cryo_bay",
                name: "Cryo Bay",
                floor: 1,
                x: 0,
                y: 0,
                width: 120,
                height: 90,
                connections: [{ to: "corridor_main", direction: "north", type: "door" }],
                description: "Cold, sterile cryo-chamber."
            };
            addDiscoveredRoom(initialRoom);
            gameState.currentRoom = "cryo_bay";
            gameState.currentFloor = 1;
            updateLocationDisplay();
        }

        gameState.initialized = true;

        // Start ambient sound
        setTimeout(() => playSound('ambient'), 1000);

    } catch (error) {
        console.error('Failed to initialize game:', error);
        displayError("CRITICAL ERROR: Ship systems offline. Please refresh to reinitialize.");
    }

    showLoading(false);
}

// Send message to AI
async function sendToAI(userMessage) {
    gameState.conversationHistory.push({
        role: 'user',
        content: userMessage
    });

    if (gameState.conversationHistory.length > 20) {
        gameState.conversationHistory = gameState.conversationHistory.slice(-20);
    }

    const roomsList = Object.entries(gameState.discoveredRooms).map(([id, room]) => {
        const connections = room.connections ? room.connections.map(c => `${c.direction} to ${c.to}`).join(', ') : 'none';
        return `${id} (x:${room.x}, y:${room.y}, deck:${room.floor}) - connects: ${connections}`;
    }).join('\n');

    const stateContext = `
CURRENT GAME STATE:
- Current Room: ${gameState.currentRoom || 'cryo_bay'}
- Current Deck: ${gameState.currentFloor}
- Inventory: ${gameState.inventory.map(i => `${i.name} (${i.state || 'normal'})`).join(', ') || 'empty'}
- Discovered Rooms:
${roomsList || 'none yet'}
- Has Won: ${gameState.hasWon}
`;

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT + stateContext },
        ...gameState.conversationHistory
    ];

    try {
        const userKey = localStorage.getItem('openrouter_key');
        const userModel = localStorage.getItem('openrouter_model') || CONFIG.model;
        if (!userKey) {
            document.getElementById('apiInput').value = userKey || '';
            document.getElementById('modelInput').value = userModel;
            document.getElementById('apiModal').classList.remove('hidden');
            throw new Error("API key is required to play.");
        }

        const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'EXODUS'
            },
            body: JSON.stringify({
                model: userModel,
                messages: messages,
                max_tokens: CONFIG.maxTokens,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 402 || response.status === 404) {
                if (response.status === 401) localStorage.removeItem('openrouter_key');
                document.getElementById('apiInput').value = localStorage.getItem('openrouter_key') || '';
                document.getElementById('modelInput').value = userModel;
                document.getElementById('apiModal').classList.remove('hidden');
                throw new Error("API key was revoked, invalid, requires credits, or model is invalid.");
            }
            let errorDetail = '';
            try {
                const errorData = await response.json();
                errorDetail = errorData.error?.message || JSON.stringify(errorData);
            } catch (e) {
                errorDetail = response.statusText || 'Unknown error';
            }
            throw new Error(`API request failed (${response.status}): ${errorDetail}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
        }
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(`Invalid response format from AI: ${JSON.stringify(data)}`);
        }

        const aiMessage = data.choices[0].message.content;

        gameState.conversationHistory.push({
            role: 'assistant',
            content: aiMessage
        });

        try {
            const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                // Try to clean up common JSON errors like trailing commas
                let jsonStr = jsonMatch[0];
                jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

                try {
                    return JSON.parse(jsonStr);
                } catch (e) {
                    console.error('JSON parse failed even after cleanup:', e);
                    // Try to extract narrative from the malformed JSON
                    const narrativeMatch = jsonStr.match(/"narrative"\s*:\s*"([^"]+)"/);
                    if (narrativeMatch) {
                        return {
                            narrative: narrativeMatch[1].replace(/\\n/g, '\n'),
                            isValidAction: true,
                            suggestions: []
                        };
                    }
                }
            }
            throw new Error('No JSON found');
        } catch (parseError) {
            console.error('Parse error:', parseError);
            console.log('Raw AI message:', aiMessage);
            return {
                narrative: "ERROR: AI response format invalid. Please try rephrasing your command.",
                isValidAction: false,
                suggestions: ["Try a different command", "Type 'look around'"]
            };
        }
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

// Process AI Response
function processAIResponse(response, isInitial = false) {
    // Increment command count
    gameState.commandCount++;

    // Play sound effect
    if (response.soundEffect) {
        playSound(response.soundEffect);
    } else if (!response.isValidAction) {
        playSound('error');
    } else if (response.inventoryChanges?.add?.length > 0) {
        playSound('pickup');
    } else if (response.roomUpdate?.discoveredRoom) {
        playSound('door');
    }

    if (!isInitial) {
        displayMessage(elements.gameInput.value, response.narrative, !response.isValidAction, response.suggestions);
    } else {
        displayNarrative(response.narrative);
        // First steps achievement
        unlockAchievement('first_steps');
    }

    // Check command count achievements
    if (gameState.commandCount >= 10) unlockAchievement('ten_commands');
    if (gameState.commandCount >= 50) unlockAchievement('fifty_commands');
    if (gameState.commandCount >= 100) unlockAchievement('hundred_commands');

    // Handle puzzle triggers - only if it's an object with type
    if (response.triggerPuzzle && typeof response.triggerPuzzle === 'object' && response.triggerPuzzle.type) {
        setTimeout(() => {
            startPuzzle(response.triggerPuzzle.type).then(success => {
                gameState.puzzlesCompleted++;
                if (success) {
                    unlockAchievement('hacker');
                    if (gameState.puzzlesCompleted >= 5) {
                        unlockAchievement('puzzle_master');
                    }
                    sendToAI("Puzzle completed successfully. Access granted.");
                } else {
                    sendToAI("Puzzle failed. Access denied.");
                }
            });
        }, 1000);
    } else if (response.triggerPuzzle === true) {
        // Legacy support for boolean triggerPuzzle
        setTimeout(() => {
            startPuzzle('matching').then(success => {
                gameState.puzzlesCompleted++;
                if (success) {
                    unlockAchievement('hacker');
                    if (gameState.puzzlesCompleted >= 5) {
                        unlockAchievement('puzzle_master');
                    }
                    sendToAI("Hacking successful. Access granted.");
                } else {
                    sendToAI("Hacking failed. Access denied.");
                }
            });
        }, 1000);
    }

    // Process inventory changes with achievements
    if (response.inventoryChanges) {
        if (response.inventoryChanges.add) {
            response.inventoryChanges.add.forEach(item => {
                addToInventory(item);
                // Check for first pickup
                if (gameState.inventory.length === 1) {
                    unlockAchievement('first_pickup');
                }
                if (gameState.inventory.length >= 5) {
                    unlockAchievement('collector');
                }
                if (gameState.inventory.length >= 10) {
                    unlockAchievement('hoarder');
                }
                if (gameState.inventory.length >= 15) {
                    unlockAchievement('all_items');
                }
                if (gameState.inventory.length >= 20) {
                    unlockAchievement('item_collector');
                }
                // Check item types for achievements
                const itemName = item.name.toLowerCase();
                if (itemName.includes('keycard') || itemName.includes('key card')) {
                    unlockAchievement('keycard_found');
                }
                if (itemName.includes('gun') || itemName.includes('weapon') || itemName.includes('pistol') || itemName.includes('knife') || itemName.includes('crowbar')) {
                    unlockAchievement('armed');
                }
            });
        }
        if (response.inventoryChanges.remove) {
            response.inventoryChanges.remove.forEach(id => removeFromInventory(id));
        }
        if (response.inventoryChanges.update) {
            response.inventoryChanges.update.forEach(update => updateInventoryItem(update.id, update.changes));
        }
    }

    // Process room changes with achievements
    if (response.roomUpdate) {
        if (response.roomUpdate.currentRoom) {
            gameState.currentRoom = response.roomUpdate.currentRoom;
            // Check if reached bridge
            if (response.roomUpdate.currentRoom.toLowerCase().includes('bridge')) {
                unlockAchievement('bridge_reached');
            }
        }
        if (response.roomUpdate.currentFloor) {
            gameState.currentFloor = response.roomUpdate.currentFloor;
        }
        if (response.roomUpdate.discoveredRoom) {
            addDiscoveredRoom(response.roomUpdate.discoveredRoom);
            // Check room count achievements
            const roomCount = Object.keys(gameState.discoveredRooms).length;
            if (roomCount >= 5) unlockAchievement('explorer');
            if (roomCount >= 10) unlockAchievement('cartographer');
            if (roomCount >= 15) unlockAchievement('master_navigator');
            if (roomCount >= 20) unlockAchievement('explorer_elite');

            // Check room-specific achievements
            const roomId = response.roomUpdate.discoveredRoom.id?.toLowerCase() || '';
            const roomName = response.roomUpdate.discoveredRoom.name?.toLowerCase() || '';

            if (roomId.includes('cryo') || roomName.includes('cryo')) {
                unlockAchievement('cryo_returner');
            }
            if (roomId.includes('science') || roomName.includes('science') || roomName.includes('lab')) {
                unlockAchievement('science_lab');
            }
            if (roomId.includes('armory') || roomName.includes('armory')) {
                unlockAchievement('armory_access');
            }
            if (roomId.includes('medical') || roomName.includes('medical')) {
                unlockAchievement('medical_bay');
            }
            if (roomId.includes('crew') || roomId.includes('quarters') || roomName.includes('crew quarters')) {
                unlockAchievement('crew_quarters');
            }
            if (roomId.includes('observation') || roomName.includes('observation')) {
                unlockAchievement('observation_deck');
            }
            if (roomId.includes('cargo') || roomName.includes('cargo')) {
                unlockAchievement('cargo_bay');
            }
            if (roomId.includes('escape') || roomId.includes('pod') || roomName.includes('escape pod')) {
                unlockAchievement('escape_pods');
            }
            if (roomId.includes('communication') || roomName.includes('communication')) {
                unlockAchievement('communicator');
            }
            if (roomId.includes('captain') || roomName.includes('captain')) {
                unlockAchievement('captain_quarters');
            }
            if (roomId.includes('engine') || roomName.includes('engine')) {
                unlockAchievement('engine_room');
            }
        }
        updateLocationDisplay();
    }

    if (response.mapUnlocked) {
        gameState.mapUnlocked = true;
    }

    // Health changes with achievements
    if (response.healthChange) {
        const wasFirstDamage = response.healthChange < 0 && !gameState.achievements.first_blood;
        const wasCritical = gameState.hp <= gameState.maxHp * 0.25;
        changeHealth(response.healthChange);
        if (wasFirstDamage) {
            unlockAchievement('first_blood');
        }
        // Check for full healer - healed to 100% from critical
        if (wasCritical && response.healthChange > 0 && gameState.hp >= gameState.maxHp) {
            unlockAchievement('full_healer');
        }
        if (gameState.hp <= gameState.maxHp * 0.25 && gameState.hp > 0) {
            unlockAchievement('survivor');
        }
    }

    // Process game events for achievements
    if (response.gameEvents && Array.isArray(response.gameEvents)) {
        response.gameEvents.forEach(event => {
            switch (event) {
                case 'found_body':
                    unlockAchievement('find_body');
                    break;
                case 'found_survivor':
                    unlockAchievement('find_survivor');
                    break;
                case 'stopped_meltdown':
                    unlockAchievement('meltdown_averted');
                    break;
                case 'reached_bridge':
                    unlockAchievement('bridge_reached');
                    break;
                case 'repaired_system':
                    unlockAchievement('engineer');
                    break;
                case 'read_log':
                    unlockAchievement('log_reader');
                    break;
                case 'used_terminal':
                    gameState.terminalsAccessed++;
                    if (gameState.terminalsAccessed >= 3) {
                        unlockAchievement('access_terminal');
                    }
                    break;
                case 'used_medkit':
                    unlockAchievement('healer');
                    break;
                case 'restored_oxygen':
                    unlockAchievement('oxygen_master');
                    break;
                case 'used_flashlight':
                    unlockAchievement('flashlight_user');
                    break;
                case 'downloaded_data':
                    unlockAchievement('data_retriever');
                    break;
                case 'resolved_emergency':
                    gameState.emergenciesResolved = (gameState.emergenciesResolved || 0) + 1;
                    if (gameState.emergenciesResolved >= 3) {
                        unlockAchievement('emergency_resolver');
                    }
                    break;
                case 'restored_power':
                    unlockAchievement('power_restorer');
                    break;
                case 'survived_airlock':
                    unlockAchievement('airlock_survivor');
                    break;
                case 'sent_distress':
                    unlockAchievement('distress_signal');
                    break;
                case 'checked_storage':
                    gameState.storageChecked = (gameState.storageChecked || 0) + 1;
                    if (gameState.storageChecked >= 10) {
                        unlockAchievement('storage_master');
                    }
                    break;
                case 'extinguished_fire':
                    unlockAchievement('fire_fighter');
                    break;
                case 'survived_hull_breach':
                    unlockAchievement('hull_breach');
                    break;
                case 'overrode_ai':
                    unlockAchievement('ai_override');
                    break;
                case 'read_all_logs':
                    unlockAchievement('ship_historian');
                    break;
                case 'repaired_system':
                    gameState.systemsRepaired = (gameState.systemsRepaired || 0) + 1;
                    unlockAchievement('engineer');
                    if (gameState.systemsRepaired >= 10) {
                        unlockAchievement('mechanic');
                    }
                    break;
                case 'fixed_electrical':
                    unlockAchievement('electrician');
                    break;
                case 'fixed_water':
                    unlockAchievement('plumber');
                    break;
                case 'repaired_life_support':
                    unlockAchievement('life_support');
                    break;
            }
        });
    }

    // Check for close call and full healer achievements
    if (gameState.hp === 1) {
        unlockAchievement('close_call');
    }

    // Check for multi-floor explorer
    if (!gameState.visitedFloors || !Array.isArray(gameState.visitedFloors)) {
        gameState.visitedFloors = [];
    }
    if (!gameState.visitedFloors.includes(gameState.currentFloor)) {
        gameState.visitedFloors.push(gameState.currentFloor);
    }
    if (gameState.visitedFloors.length >= 3) {
        unlockAchievement('multi_floor_explorer');
    }

    // Check for victory
    if (response.gameWon) {
        gameState.hasWon = true;
        unlockAchievement('victory');
        if (gameState.commandCount < 50) {
            unlockAchievement('speed_runner');
        }
        if (gameState.commandCount < 30) {
            unlockAchievement('speedster');
        }
        if (gameState.inventory.length < 5) {
            unlockAchievement('minimalist');
        }
        playSound('victory');
        setTimeout(() => {
            elements.victoryModal.classList.remove('hidden');
        }, 2000);
    }

    // Check puzzle completion milestones
    if (gameState.puzzlesCompleted >= 10) {
        unlockAchievement('ten_puzzles');
    }
    if (gameState.puzzlesCompleted >= 20) {
        unlockAchievement('master_hacker');
    }

    // Check terminals accessed
    if (gameState.terminalsAccessed >= 5) {
        unlockAchievement('tech_savvy');
    }

    saveGameState();
}

// Display Functions with optional typewriter effect
async function displayNarrative(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'game-message';

    const responseDiv = document.createElement('div');
    responseDiv.className = 'game-response';

    messageDiv.appendChild(responseDiv);

    const welcome = elements.gameOutput.querySelector('.welcome-message');
    if (welcome) {
        welcome.remove();
    }

    elements.gameOutput.appendChild(messageDiv);

    if (gameState.settings.textAnimation && TEXT_SPEEDS[gameState.settings.textSpeed] > 0) {
        await typewriterEffect(responseDiv, text);
    } else {
        responseDiv.innerHTML = formatText(text);
    }

    scrollToBottom();
}

async function typewriterEffect(element, text) {
    const speed = TEXT_SPEEDS[gameState.settings.textSpeed];
    const formatted = formatText(text);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formatted;
    const plainText = tempDiv.textContent;

    element.innerHTML = '';

    for (let i = 0; i < plainText.length; i++) {
        element.textContent += plainText[i];
        if (i % 3 === 0) playSound('keypress');
        scrollToBottom();
        await new Promise(resolve => setTimeout(resolve, speed));
    }

    element.innerHTML = formatted;
}

function displayMessage(playerInput, narrative, isError = false, suggestions = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'game-message';

    const inputDiv = document.createElement('div');
    inputDiv.className = 'player-input';
    inputDiv.textContent = playerInput;
    messageDiv.appendChild(inputDiv);

    const responseDiv = document.createElement('div');
    responseDiv.className = `game-response ${isError ? 'error-message' : ''}`;
    responseDiv.innerHTML = formatText(narrative);
    messageDiv.appendChild(responseDiv);

    if (suggestions && suggestions.length > 0) {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'suggestions';

        const suggestionsTitle = document.createElement('div');
        suggestionsTitle.className = 'suggestions-title';
        suggestionsTitle.textContent = 'Suggested actions:';
        suggestionsDiv.appendChild(suggestionsTitle);

        const suggestionsList = document.createElement('ul');
        suggestionsList.className = 'suggestions-list';
        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            suggestionsList.appendChild(li);
        });
        suggestionsDiv.appendChild(suggestionsList);

        messageDiv.appendChild(suggestionsDiv);
    }

    elements.gameOutput.appendChild(messageDiv);
    scrollToBottom();
}

function displayError(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'game-message';

    const responseDiv = document.createElement('div');
    responseDiv.className = 'game-response error-message';
    responseDiv.textContent = text;

    messageDiv.appendChild(responseDiv);
    elements.gameOutput.appendChild(messageDiv);
    scrollToBottom();
    playSound('error');
}

function formatText(text) {
    if (!text) return '';
    return text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function scrollToBottom() {
    elements.gameOutput.scrollTop = elements.gameOutput.scrollHeight;
}

// Inventory Functions
function addToInventory(item) {
    const existingIndex = gameState.inventory.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) return;

    gameState.inventory.push(item);
    renderInventory();
    playSound('pickup');
}

function removeFromInventory(itemId) {
    gameState.inventory = gameState.inventory.filter(i => i.id !== itemId);
    renderInventory();
}

function updateInventoryItem(itemId, changes) {
    const item = gameState.inventory.find(i => i.id === itemId);
    if (item) {
        Object.assign(item, changes);
        renderInventory();
    }
}

function renderInventory() {
    if (gameState.inventory.length === 0) {
        elements.inventoryList.innerHTML = '<p class="empty-inventory">No items.</p>';
        return;
    }

    elements.inventoryList.innerHTML = '';
    gameState.inventory.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        itemDiv.onclick = () => {
            showItemDetails(item);
            playSound('terminal');
        };

        const labelSpan = document.createElement('span');
        labelSpan.className = 'item-label';
        labelSpan.textContent = `[${item.name.toUpperCase()}]`;

        itemDiv.appendChild(labelSpan);
        elements.inventoryList.appendChild(itemDiv);
    });
}

function showItemDetails(item) {
    elements.itemName.textContent = item.name.toUpperCase();
    elements.itemDiagram.textContent = item.diagram || generateDefaultDiagram(item.name, item.state);
    elements.itemDescription.textContent = item.description || 'Standard equipment.';

    if (item.state && item.state !== 'normal') {
        elements.itemDescription.textContent += ` [STATUS: ${item.state.toUpperCase()}]`;
    }

    elements.itemModal.classList.remove('hidden');
}

function generateDefaultDiagram(itemName, state = 'normal') {
    const name = itemName.toLowerCase();
    let diagram = '';

    if (name.includes('id') || name.includes('card') || name.includes('keycard')) {
        diagram = `
    ╔══════════════════════════╗
    ║   EXODUS CREW ACCESS     ║
    ║  ════════════════════    ║
    ║  ┌───┐                   ║
    ║  │███│  NAME: ████████   ║
    ║  │███│  RANK: ████████   ║
    ║  │███│  ACCESS: A-3      ║
    ║  └───┘                   ║
    ║  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ║
    ╚══════════════════════════╝`;
    } else if (name.includes('wrench') || name.includes('tool') || name.includes('spanner')) {
        diagram = `
           ╭─────╮
          ╱   O   ╲
         │    │    │
          ╲   │   ╱
           ╰──┬──╯
              │
              │
              │
              │
           ───┴───`;
    } else if (name.includes('flashlight') || name.includes('torch')) {
        diagram = `
        ╭═══════════════╮
        │ ░░░░░░░░░░░░░ ├───╮
        │ ░░░ BEAM ░░░░ │   │
        │ ░░░░░░░░░░░░░ ├───╯
        ╰═══════════════╯
             ║    ║
             ╚════╝`;
    } else if (name.includes('gun') || name.includes('pistol')) {
        diagram = `
              ┌────────────┐
          ┌───┤  ▓▓▓▓▓▓▓▓  │
       ───┼───┴────────────┘
          │  ╱
         ┌┴─╱─────┐
         │ ╱  ●   │
         │╱ TRIG  │
         └────────┘`;
    } else if (name.includes('knife') || name.includes('blade')) {
        diagram = `
                    ╱╲
                   ╱  ╲
                  ╱    ╲
                 ╱      ╲
                ╱   ▓▓   ╲
               ╱══════════╲
              ╱────────────╲
              │    GRIP    │
              │     ██     │
              └────────────┘`;
    } else if (name.includes('crowbar')) {
        diagram = `
              ╭────────╮
              │        ╰───╮
              ╰───╮        │
                  │        │
                  │        │
                  │        │
                  │        │
              ╭───╯        │
              │        ╭───╯
              ╰────────╯`;
    } else if (name.includes('medkit') || name.includes('med kit') || name.includes('first aid')) {
        diagram = `
        ┌──────────────────┐
        │ ╔══════════════╗ │
        │ ║    ┌───┐     ║ │
        │ ║ ───┼───┼───  ║ │
        │ ║    └───┘     ║ │
        │ ╚══════════════╝ │
        │   [MEDICAL KIT]  │
        └──────────────────┘`;
    } else if (name.includes('syringe') || name.includes('injector')) {
        diagram = `
                 ╭───╮
                 │ ▓ │
                 │ ▓ │
            ┌────┴───┴────┐
            │  SERUM-X    │
            └────┬───┬────┘
                 │   │
                 │   │
                 ╰─┬─╯
                   V`;
    } else if (name.includes('bandage') || name.includes('gauze')) {
        diagram = `
        ┌─────────────────┐
        │ ░░░░░░░░░░░░░░░ │
        │ ░ STERILE ░░░░░ │
        │ ░ BANDAGE ░░░░░ │
        │ ░░░░░░░░░░░░░░░ │
        └─────────────────┘`;
    } else if (name.includes('battery') || name.includes('power cell')) {
        diagram = `
             ┌────┐
             │ +  │
        ╔════╧════╧════╗
        ║ █████████████║
        ║ ░░░░░░░░░░░░ ║
        ║ POWER CELL   ║
        ║ 500mAh       ║
        ╚══════════════╝`;
    } else if (name.includes('wire') || name.includes('cable')) {
        diagram = `
        ╭──┐        ╭──╮
        │  └────────┘  │
        │ ○ ════════ ○ │
        │  ┌────────┐  │
        ╰──┘        ╰──╯
          COPPER WIRE`;
    } else if (name.includes('fuse') || name.includes('circuit')) {
        diagram = `
        ┌──────────────┐
        │  ║      ║    │
        │  ╠══════╣    │
        │  ║ FUSE ║    │
        │  ╠══════╣    │
        │  ║      ║    │
        └──────────────┘`;
    } else if (name.includes('chip') || name.includes('processor')) {
        diagram = `
            ┌──────────┐
         ───┤          ├───
         ───┤  ▓▓▓▓▓▓  ├───
         ───┤  ▓CPU ▓  ├───
         ───┤  ▓▓▓▓▓▓  ├───
         ───┤          ├───
            └──────────┘`;
    } else if (name.includes('tablet') || name.includes('datapad') || name.includes('pad')) {
        diagram = `
        ┌───────────────────┐
        │ ╔═══════════════╗ │
        │ ║ EXODUS OS 4.2 ║ │
        │ ║ > LOADING...  ║ │
        │ ║ ████████░░░░  ║ │
        │ ║               ║ │
        │ ╚═══════════════╝ │
        │     [  O  ]       │
        └───────────────────┘`;
    } else if (name.includes('log') || name.includes('report') || name.includes('document')) {
        diagram = `
        ╔═══════════════════╗
        ║ SHIP LOG ─────────║
        ║ ──────────────────║
        ║ Date: 2187.03.14  ║
        ║ ──────────────────║
        ║ [CLASSIFIED]      ║
        ║ ░░░░░░░░░░░░░░░░░ ║
        ╚═══════════════════╝`;
    } else if (name.includes('helmet') || name.includes('mask')) {
        diagram = `
            ╭───────────╮
           ╱  ┌─────┐    ╲
          │   │░░░░░│     │
          │   │VISOR│     │
          │   └─────┘     │
          │   ○     ○     │
           ╲             ╱
            ╰───────────╯`;
    } else if (name.includes('suit') || name.includes('armor')) {
        diagram = `
              ╭───╮
             ╱     ╲
            │ ○   ○ │
            ╰───┬───╯
          ╭─────┴─────╮
          │ ░░░░░░░░░ │
          │ EVA SUIT  │
          ╰─┬───────┬─╯
            │       │`;
    } else if (name.includes('canister') || name.includes('tank') || name.includes('bottle')) {
        diagram = `
              ╭───╮
              │ ▓ │
           ╭──┴───┴──╮
           │ ░░░░░░░ │
           │ O2 TANK │
           │ ░░░░░░░ │
           │ [PRESS] │
           ╰─────────╯`;
    } else if (name.includes('key')) {
        diagram = `
          ╭─────────╮
          │  (===)  │
          ╰────┬────╯
               │
               │
             ┌─┴─┐
             │ ○ │
             └───┘`;
    } else if (name.includes('radio') || name.includes('comm')) {
        diagram = `
        ┌───────────────┐
        │ ╭───────────╮ │
        │ │ FREQ: 140 │ │
        │ ╰───────────╯ │
        │  [■] [■] [■]  │
        │    COMMS      │
        └───────┬───────┘
                │
               ╱│╲`;
    } else if (name.includes('light')) {
        diagram = `
            ╭─────╮
           ╱  ═══  ╲
          │ ░░░░░░░ │
          │ ░BULB░░ │
           ╲ ░░░░░ ╱
            ╰─────╯
               │
              ═╧═`;
    } else {
        diagram = `
        ┌─────────────────────┐
        │                     │
        │    [ ITEM ]         │
        │                     │
        │   ${name.substring(0, 15).padEnd(15)}    │
        │                     │
        └─────────────────────┘`;
    }

    if (state === 'damaged' || state === 'broken') {
        diagram = diagram.replace(/═/g, '~').replace(/─/g, '-').replace(/│/g, '|');
    }

    return diagram;
}

// Achievement System
function unlockAchievement(id) {
    if (!ACHIEVEMENTS[id] || gameState.achievements[id]) return;

    gameState.achievements[id] = {
        unlockedAt: Date.now()
    };

    const achievement = ACHIEVEMENTS[id];
    showAchievementToast(achievement);
    playSound('success');
    saveGameState();
}

function showAchievementToast(achievement) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.achievement-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <div class="achievement-toast-icon">${achievement.icon || '🏆'}</div>
        <div class="achievement-toast-content">
            <div class="achievement-toast-title">ACHIEVEMENT UNLOCKED</div>
            <div class="achievement-toast-name">${achievement.name}</div>
            <div class="achievement-toast-desc">${achievement.description}</div>
        </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function getAchievementProgress() {
    const total = Object.keys(ACHIEVEMENTS).length;
    const unlocked = Object.keys(gameState.achievements).length;
    return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
}

function renderAchievements() {
    const container = document.getElementById('achievementsList');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
        const isUnlocked = !!gameState.achievements[id];
        const item = document.createElement('div');
        item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;

        item.innerHTML = `
            <div class="achievement-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
            <div class="achievement-info">
                <div class="achievement-name">${isUnlocked ? achievement.name : '???'}</div>
                <div class="achievement-desc">${isUnlocked ? achievement.description : 'Complete the objective to unlock'}</div>
            </div>
        `;

        container.appendChild(item);
    });

    // Update progress bar
    const progress = getAchievementProgress();
    const progressBar = document.getElementById('achievementProgress');
    const progressText = document.getElementById('achievementProgressText');
    if (progressBar) progressBar.style.width = `${progress.percentage}%`;
    if (progressText) progressText.textContent = `${progress.unlocked}/${progress.total}`;
}

function toggleAchievements() {
    playSound('terminal');
    const modal = document.getElementById('achievementsModal');
    if (modal) {
        if (modal.classList.contains('hidden')) {
            renderAchievements();
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }
}

// Map Functions
let mapOffset = { x: 0, y: 0 };
let mapZoom = 1.0;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let hoveredRoom = null;
let roomRects = []; // Store room rectangles for click detection

/**
 * Utility to check if a rectangle overlaps with any existing rooms on a floor
 */
function isRoomOverlap(x, y, width, height, floor, ignoreId = null) {
    const floorRooms = gameState.floors[floor];
    if (!floorRooms) return false;

    // Buffer to prevent rooms being too close
    const buffer = 10;
    const r1 = {
        left: x - buffer,
        right: x + width + buffer,
        top: y - buffer,
        bottom: y + height + buffer
    };

    for (const id in floorRooms) {
        if (id === ignoreId) continue;
        const room = floorRooms[id];
        const r2 = {
            left: room.x,
            right: room.x + (room.width || 120),
            top: room.y,
            bottom: room.y + (room.height || 90)
        };

        const overlap = !(r1.right < r2.left ||
            r1.left > r2.right ||
            r1.bottom < r2.top ||
            r1.top > r2.bottom);

        if (overlap) return true;
    }
    return false;
}

function addDiscoveredRoom(room) {
    const floor = room.floor || 1;

    if (!gameState.floors[floor]) {
        gameState.floors[floor] = {};
        updateFloorSelector();
    }

    const existingRoom = gameState.discoveredRooms[room.id];
    if (existingRoom) {
        // Merge objects to avoid losing previously discovered items
        if (existingRoom.objects && room.objects) {
            const combined = [...existingRoom.objects];
            room.objects.forEach(obj => {
                if (!combined.some(e => e.name === obj.name)) combined.push(obj);
            });
            room.objects = combined;
        } else if (existingRoom.objects) {
            room.objects = existingRoom.objects;
        }
        // Retain original coordinates to avoid layout shifting
        room.x = existingRoom.x;
        room.y = existingRoom.y;
    } else if (Object.keys(gameState.discoveredRooms).length > 0) {
        // Force auto-calculation for completely new rooms to prevent bad AI coordinate generation
        delete room.x;
        delete room.y;
    }

    // Auto-calculate coordinates if missing or 0,0 (unless it's the first room)
    // We try to find a neighbor that is already discovered to anchor this room
    if ((room.x === undefined || room.y === undefined || (room.x === 0 && room.y === 0 && Object.keys(gameState.discoveredRooms).length > 0)) && room.connections) {
        let anchored = false;

        // Find a connection to an existing room
        for (const conn of room.connections) {
            const neighborId = conn.to;
            const neighbor = gameState.discoveredRooms[neighborId];

            if (neighbor && neighbor.floor === floor) {
                const dirStr = conn.direction.toLowerCase();
                const dirData = DIRECTION_MAP[dirStr];

                if (dirData) {
                    // Logic: NEIGHBOR is in direction [dirStr] from THIS room
                    // So THIS room is in [opposite] direction from NEIGHBOR
                    const oppositeData = DIRECTION_MAP[dirData.opposite];
                    if (oppositeData) {
                        const roomWidth = room.width || 120;
                        const roomHeight = room.height || 90;
                        const neighborWidth = neighbor.width || 120;
                        const neighborHeight = neighbor.height || 90;
                        const margin = 40; // Space between rooms for connections

                        let targetX, targetY;

                        // Calculate centered position based on direction
                        const dir = dirData.opposite;
                        if (dir === 'north' || dir === 'fore') {
                            targetX = neighbor.x + (neighborWidth / 2) - (roomWidth / 2);
                            targetY = neighbor.y - roomHeight - margin;
                        } else if (dir === 'south' || dir === 'aft') {
                            targetX = neighbor.x + (neighborWidth / 2) - (roomWidth / 2);
                            targetY = neighbor.y + neighborHeight + margin;
                        } else if (dir === 'east' || dir === 'starboard') {
                            targetX = neighbor.x + neighborWidth + margin;
                            targetY = neighbor.y + (neighborHeight / 2) - (roomHeight / 2);
                        } else if (dir === 'west' || dir === 'port') {
                            targetX = neighbor.x - roomWidth - margin;
                            targetY = neighbor.y + (neighborHeight / 2) - (roomHeight / 2);
                        } else {
                            // Fallback for up/down or unknown
                            targetX = neighbor.x + oppositeData.dx;
                            targetY = neighbor.y + oppositeData.dy;
                        }

                        // Check for overlap at target position
                        if (!isRoomOverlap(targetX, targetY, roomWidth, roomHeight, floor)) {
                            room.x = targetX;
                            room.y = targetY;
                            anchored = true;
                            break;
                        } else {
                            // If overlap, try slight variations (spiral or offset search)
                            const offsets = [
                                { x: 40, y: 0 }, { x: -40, y: 0 }, { x: 0, y: 40 }, { x: 0, y: -40 },
                                { x: 80, y: 0 }, { x: -80, y: 0 }, { x: 0, y: 80 }, { x: 0, y: -80 }
                            ];
                            for (const off of offsets) {
                                if (!isRoomOverlap(targetX + off.x, targetY + off.y, roomWidth, roomHeight, floor)) {
                                    room.x = targetX + off.x;
                                    room.y = targetY + off.y;
                                    anchored = true;
                                    break;
                                }
                            }
                            if (anchored) break;
                        }
                    }
                }
            }
        }

        // Fallback: If still not anchored, pick a spot near the current room
        if (!anchored && gameState.currentRoom) {
            const prevRoom = gameState.discoveredRooms[gameState.currentRoom];
            if (prevRoom && prevRoom.floor === floor) {
                // Try to place it anywhere nearby that's free
                const searchPatterns = [
                    { x: 140, y: 0 }, { x: -140, y: 0 }, { x: 0, y: 120 }, { x: 0, y: -120 }
                ];
                for (const pos of searchPatterns) {
                    const tx = prevRoom.x + pos.x;
                    const ty = prevRoom.y + pos.y;
                    if (!isRoomOverlap(tx, ty, room.width || 120, room.height || 90, floor)) {
                        room.x = tx;
                        room.y = ty;
                        anchored = true;
                        break;
                    }
                }
            }
        }
    }

    // Ensure coordinates are numbers
    room.x = Number(room.x) || 0;
    room.y = Number(room.y) || 0;

    if (room.connections) {
        room.connections.forEach(conn => {
            const dir = conn.direction.toLowerCase();
            const targetRoom = gameState.floors[floor]?.[conn.to];
            if (targetRoom && DIRECTION_MAP[dir]) {
                const oppositeDir = DIRECTION_MAP[dir].opposite;
                const hasReturn = targetRoom.connections?.some(c => c.to === room.id && c.direction === oppositeDir);
                if (!hasReturn) {
                    if (!targetRoom.connections) targetRoom.connections = [];
                    targetRoom.connections.push({ to: room.id, direction: oppositeDir, type: conn.type || 'door' });
                }
            }
        });
    }

    gameState.floors[floor][room.id] = room;
    gameState.discoveredRooms[room.id] = room;

    if (!gameState.mapUnlocked) {
        gameState.mapUnlocked = true;
    }
}

function updateFloorSelector() {
    const floors = Object.keys(gameState.floors).sort((a, b) => Number(a) - Number(b));

    if (floors.length > 1) {
        elements.floorSelector.classList.remove('hidden');
        elements.floorSelect.innerHTML = '';

        floors.forEach(floor => {
            const option = document.createElement('option');
            option.value = floor;
            option.textContent = `Deck ${floor}`;
            if (Number(floor) === gameState.currentFloor) {
                option.selected = true;
            }
            elements.floorSelect.appendChild(option);
        });
    } else {
        elements.floorSelector.classList.add('hidden');
    }
}

function renderMap() {
    const canvas = elements.mapCanvas;
    const ctx = canvas.getContext('2d');
    const viewport = canvas.parentElement;

    canvas.width = viewport.clientWidth;
    canvas.height = viewport.clientHeight;

    // Update zoom display
    if (elements.zoomLevel) {
        elements.zoomLevel.textContent = `${Math.round(mapZoom * 100)}%`;
    }

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid with zoom
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const gridSize = 40 * mapZoom;
    const offsetGridX = (mapOffset.x % gridSize);
    const offsetGridY = (mapOffset.y % gridSize);

    for (let x = offsetGridX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = offsetGridY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    const currentFloorRooms = gameState.floors[gameState.currentFloor] || {};
    const rooms = Object.values(currentFloorRooms);

    if (rooms.length === 0) {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim();
        ctx.font = '20px VT323';
        ctx.textAlign = 'center';
        ctx.fillText('[ NO SECTORS MAPPED ON THIS DECK ]', canvas.width / 2, canvas.height / 2);
        roomRects = [];
        return;
    }

    const centerX = canvas.width / 2 + mapOffset.x;
    const centerY = canvas.height / 2 + mapOffset.y;

    const themeColor = gameState.themeColor || '#00ff00';
    const dimColor = hexToRgba(themeColor, 0.3) || 'rgba(0, 255, 0, 0.3)';
    const brightColor = themeColor;

    // Clear room rectangles for click detection
    roomRects = [];

    // Draw connections with door indicators
    ctx.lineWidth = 3 * mapZoom;

    rooms.forEach(room => {
        if (room.connections) {
            room.connections.forEach(conn => {
                const targetRoom = currentFloorRooms[conn.to];
                if (targetRoom) {
                    const rW = (room.width || 120);
                    const rH = (room.height || 90);
                    const tW = (targetRoom.width || 120);
                    const tH = (targetRoom.height || 90);

                    const startX = centerX + room.x * mapZoom + (rW * mapZoom) / 2;
                    const startY = centerY + room.y * mapZoom + (rH * mapZoom) / 2;
                    const endX = centerX + targetRoom.x * mapZoom + (tW * mapZoom) / 2;
                    const endY = centerY + targetRoom.y * mapZoom + (tH * mapZoom) / 2;

                    // Connection line
                    ctx.strokeStyle = dimColor;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    // Door indicator at midpoint
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;
                    const doorSize = 8 * mapZoom;

                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(midX - doorSize / 2, midY - doorSize / 2, doorSize, doorSize);
                    ctx.strokeStyle = dimColor;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(midX - doorSize / 2, midY - doorSize / 2, doorSize, doorSize);
                }
            });
        }
    });

    // Draw rooms
    rooms.forEach(room => {
        const x = centerX + room.x * mapZoom;
        const y = centerY + room.y * mapZoom;
        const width = (room.width || 120) * mapZoom;
        const height = (room.height || 90) * mapZoom;

        const isCurrentRoom = room.id === gameState.currentRoom;
        const isHovered = hoveredRoom === room.id;

        // Store for click detection
        roomRects.push({ room, x, y, width, height });

        // Room background
        ctx.fillStyle = isCurrentRoom ? hexToRgba(themeColor, 0.25) : (isHovered ? hexToRgba(themeColor, 0.15) : '#1a1a1a');
        ctx.fillRect(x, y, width, height);

        // Room border
        if (isCurrentRoom || isHovered) {
            ctx.shadowColor = themeColor;
            ctx.shadowBlur = isHovered ? 20 : 15;
        }
        ctx.strokeStyle = isCurrentRoom ? brightColor : (isHovered ? brightColor : dimColor);
        ctx.lineWidth = (isCurrentRoom ? 3 : 2) * mapZoom;
        ctx.strokeRect(x, y, width, height);
        ctx.shadowBlur = 0;

        // Room name
        ctx.fillStyle = isCurrentRoom ? brightColor : (isHovered ? brightColor : dimColor);
        const fontSize = Math.max(10, 14 * mapZoom);
        ctx.font = `${fontSize}px VT323`;
        ctx.textAlign = 'center';

        const words = (room.name || room.id).split(' ');
        let lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width < width - 10) {
                currentLine = testLine;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine) lines.push(currentLine);

        const lineHeight = fontSize + 2;
        const textStartY = y + (height - lines.length * lineHeight) / 2 + fontSize;

        lines.forEach((line, i) => {
            ctx.fillText(line, x + width / 2, textStartY + i * lineHeight);
        });

        // Current room indicator - blinking dot
        if (isCurrentRoom) {
            const pulseSize = 6 + Math.sin(Date.now() / 200) * 2;
            ctx.fillStyle = brightColor;
            ctx.beginPath();
            ctx.arc(x + width / 2, y + height / 2, pulseSize * mapZoom, 0, Math.PI * 2);
            ctx.fill();

            // "YOU ARE HERE" label
            ctx.font = `bold ${Math.max(12, 16 * mapZoom)}px VT323`;
            ctx.fillText('[YOU ARE HERE]', x + width / 2, y - 10 * mapZoom);
        }

        // Draw exit indicators on room edges
        if (room.connections) {
            room.connections.forEach(conn => {
                const direction = conn.direction.toLowerCase();
                const dir = DIRECTION_MAP[direction];
                if (dir) {
                    let doorX = x + width / 2;
                    let doorY = y + height / 2;
                    const doorW = 12 * mapZoom;
                    const doorH = 6 * mapZoom;

                    if (direction === 'north' || direction === 'fore') {
                        doorX = x + width / 2 - doorW / 2;
                        doorY = y - doorH / 2;
                    } else if (direction === 'south' || direction === 'aft') {
                        doorX = x + width / 2 - doorW / 2;
                        doorY = y + height - doorH / 2;
                    } else if (direction === 'east' || direction === 'starboard') {
                        doorX = x + width - doorH / 2;
                        doorY = y + height / 2 - doorW / 2;
                        // Swap for vertical door
                        ctx.fillStyle = dimColor;
                        ctx.fillRect(doorX, doorY, doorH, doorW);
                        return;
                    } else if (direction === 'west' || direction === 'port') {
                        doorX = x - doorH / 2;
                        doorY = y + height / 2 - doorW / 2;
                        ctx.fillStyle = dimColor;
                        ctx.fillRect(doorX, doorY, doorH, doorW);
                        return;
                    }

                    ctx.fillStyle = dimColor;
                    ctx.fillRect(doorX, doorY, doorW, doorH);
                }
            });
        }
    });

    // Compass
    const compassX = canvas.width - 60;
    const compassY = 60;
    ctx.strokeStyle = dimColor;
    ctx.fillStyle = dimColor;
    ctx.lineWidth = 2;
    ctx.font = '14px VT323';
    ctx.textAlign = 'center';

    ctx.beginPath();
    ctx.arc(compassX, compassY, 30, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillText('N', compassX, compassY - 35);
    ctx.fillText('S', compassX, compassY + 45);
    ctx.fillText('E', compassX + 40, compassY + 5);
    ctx.fillText('W', compassX - 40, compassY + 5);

    // Legend
    ctx.fillStyle = dimColor;
    ctx.font = '14px VT323';
    ctx.textAlign = 'left';
    ctx.fillText('Click room for details', 10, canvas.height - 10);
}

// Animate map for blinking indicator
let mapAnimationFrame = null;
function animateMap() {
    if (!elements.mapOverlay.classList.contains('hidden')) {
        renderMap();
        mapAnimationFrame = requestAnimationFrame(animateMap);
    }
}

function getRoomAtPosition(clientX, clientY) {
    const canvas = elements.mapCanvas;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (const r of roomRects) {
        if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
            return r.room;
        }
    }
    return null;
}

function showRoomDetail(room) {
    if (!room) return;

    playSound('terminal');

    elements.roomDetailTitle.textContent = `[ ${(room.name || room.id).toUpperCase()} ]`;

    // Draw room schematic
    const canvas = elements.roomSchematicCanvas;
    const ctx = canvas.getContext('2d');
    const themeColor = gameState.themeColor || '#00ff00';

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw room outline
    const padding = 40;
    const roomWidth = canvas.width - padding * 2;
    const roomHeight = canvas.height - padding * 2;

    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(padding, padding, roomWidth, roomHeight);

    ctx.fillStyle = hexToRgba(themeColor, 0.1);
    ctx.fillRect(padding, padding, roomWidth, roomHeight);

    // Draw doors/exits
    if (room.connections) {
        room.connections.forEach(conn => {
            const doorSize = 30;
            let doorX, doorY, doorW, doorH;

            ctx.fillStyle = hexToRgba(themeColor, 0.5);

            switch (conn.direction.toLowerCase()) {
                case 'north':
                case 'fore':
                    doorX = canvas.width / 2 - doorSize / 2;
                    doorY = padding - 5;
                    doorW = doorSize;
                    doorH = 10;
                    break;
                case 'south':
                case 'aft':
                    doorX = canvas.width / 2 - doorSize / 2;
                    doorY = padding + roomHeight - 5;
                    doorW = doorSize;
                    doorH = 10;
                    break;
                case 'east':
                case 'starboard':
                    doorX = padding + roomWidth - 5;
                    doorY = canvas.height / 2 - doorSize / 2;
                    doorW = 10;
                    doorH = doorSize;
                    break;
                case 'west':
                case 'port':
                    doorX = padding - 5;
                    doorY = canvas.height / 2 - doorSize / 2;
                    doorW = 10;
                    doorH = doorSize;
                    break;
            }

            if (doorX !== undefined) {
                ctx.fillRect(doorX, doorY, doorW, doorH);
                ctx.strokeRect(doorX, doorY, doorW, doorH);
            }
        });
    }

    // Draw player position if current room
    if (room.id === gameState.currentRoom) {
        ctx.fillStyle = themeColor;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '12px VT323';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', canvas.width / 2, canvas.height / 2 + 25);
    }

    // Populate exits list
    elements.roomExitsList.innerHTML = '';
    if (room.connections && room.connections.length > 0) {
        room.connections.forEach(conn => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="exit-direction">${conn.direction.toUpperCase()}</span> - ${conn.type || 'door'} to ${conn.to}`;
            elements.roomExitsList.appendChild(li);
        });
    } else {
        elements.roomExitsList.innerHTML = '<li>No visible exits</li>';
    }

    // Populate objects list with tooltips
    elements.roomObjectsList.innerHTML = '';
    const roomObjects = room.objects || generateRoomObjects(room);

    if (roomObjects.length > 0) {
        roomObjects.forEach(obj => {
            const li = document.createElement('li');
            li.className = 'object-item';
            li.textContent = obj.name;

            const tooltip = document.createElement('span');
            tooltip.className = 'object-tooltip';
            tooltip.textContent = obj.description || 'An object in the room';
            li.appendChild(tooltip);

            elements.roomObjectsList.appendChild(li);
        });
    } else {
        elements.roomObjectsList.innerHTML = '<li>Nothing notable</li>';
    }

    elements.roomDetailModal.classList.remove('hidden');
}

function generateRoomObjects(room) {
    // Generate some default objects based on room name
    const name = (room.name || room.id).toLowerCase();
    const objects = [];

    if (name.includes('cryo')) {
        objects.push({ name: 'Cryo Pods', description: 'Rows of human-sized cryogenic pods, most are empty' });
        objects.push({ name: 'Terminal', description: 'A flickering green terminal display' });
    } else if (name.includes('corridor') || name.includes('hallway')) {
        objects.push({ name: 'Emergency Lighting', description: 'Dim red emergency lights line the ceiling' });
        objects.push({ name: 'Wall Panels', description: 'Metal wall panels, some damaged' });
    } else if (name.includes('bridge')) {
        objects.push({ name: 'Navigation Console', description: 'The main navigation station' });
        objects.push({ name: 'Captain Chair', description: 'The command seat' });
        objects.push({ name: 'Viewscreen', description: 'Large display showing starfield' });
    } else if (name.includes('medical') || name.includes('medbay')) {
        objects.push({ name: 'Medical Beds', description: 'Adjustable medical examination beds' });
        objects.push({ name: 'Supply Cabinet', description: 'Locked medical supply cabinet' });
    } else if (name.includes('engineering') || name.includes('engine')) {
        objects.push({ name: 'Reactor Core', description: 'The ship\'s main power source' });
        objects.push({ name: 'Tool Station', description: 'Workbench with various tools' });
    } else if (name.includes('storage') || name.includes('cargo')) {
        objects.push({ name: 'Crates', description: 'Stacked cargo containers' });
        objects.push({ name: 'Shelving', description: 'Metal shelving units' });
    } else {
        objects.push({ name: 'Wall Terminal', description: 'A standard ship terminal' });
    }

    return objects;
}

function initMapControls() {
    const viewport = elements.mapCanvas.parentElement;
    const canvas = elements.mapCanvas;

    // Mouse drag
    viewport.addEventListener('mousedown', (e) => {
        if (e.target === canvas) {
            isDragging = true;
            dragStart = { x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y };
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            mapOffset.x = e.clientX - dragStart.x;
            mapOffset.y = e.clientY - dragStart.y;
            renderMap();
        } else {
            // Hover detection
            const room = getRoomAtPosition(e.clientX, e.clientY);
            const newHovered = room ? room.id : null;
            if (newHovered !== hoveredRoom) {
                hoveredRoom = newHovered;
                renderMap();

                // Update tooltip
                if (room && elements.mapTooltip) {
                    elements.mapTooltip.textContent = room.name || room.id;
                    elements.mapTooltip.style.left = (e.clientX - canvas.getBoundingClientRect().left + 15) + 'px';
                    elements.mapTooltip.style.top = (e.clientY - canvas.getBoundingClientRect().top - 10) + 'px';
                    elements.mapTooltip.classList.remove('hidden');
                } else if (elements.mapTooltip) {
                    elements.mapTooltip.classList.add('hidden');
                }
            }
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Click to show room detail
    canvas.addEventListener('click', (e) => {
        if (!isDragging) {
            const room = getRoomAtPosition(e.clientX, e.clientY);
            if (room) {
                showRoomDetail(room);
            }
        }
    });

    // Scroll to zoom
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.1;
        const oldZoom = mapZoom;

        if (e.deltaY < 0) {
            mapZoom = Math.min(3, mapZoom + zoomSpeed);
        } else {
            mapZoom = Math.max(0.3, mapZoom - zoomSpeed);
        }

        // Adjust offset to zoom toward mouse position
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomRatio = mapZoom / oldZoom;
        mapOffset.x = mouseX - (mouseX - mapOffset.x) * zoomRatio;
        mapOffset.y = mouseY - (mouseY - mapOffset.y) * zoomRatio;

        renderMap();
    });

    // Touch support
    viewport.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        dragStart = { x: touch.clientX - mapOffset.x, y: touch.clientY - mapOffset.y };
    });

    window.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const touch = e.touches[0];
            mapOffset.x = touch.clientX - dragStart.x;
            mapOffset.y = touch.clientY - dragStart.y;
            renderMap();
        }
    });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Close room detail modal
    if (elements.closeRoomDetail) {
        elements.closeRoomDetail.addEventListener('click', () => {
            elements.roomDetailModal.classList.add('hidden');
        });
    }

    if (elements.roomDetailModal) {
        elements.roomDetailModal.addEventListener('click', (e) => {
            if (e.target === elements.roomDetailModal) {
                elements.roomDetailModal.classList.add('hidden');
            }
        });
    }
}

// Theme Functions
function applyThemeColor(color) {
    const root = document.documentElement;
    const rgb = hexToRgb(color);
    const secondary = adjustBrightness(color, -20);
    const dim = adjustBrightness(color, -50);
    const highlight = adjustBrightness(color, 30);
    const border = adjustBrightness(color, -60);

    root.style.setProperty('--text-primary', color);
    root.style.setProperty('--text-secondary', secondary);
    root.style.setProperty('--text-dim', dim);
    root.style.setProperty('--text-highlight', highlight);
    root.style.setProperty('--border-color', border);
    root.style.setProperty('--border-bright', color);
    root.style.setProperty('--glow-color', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
    root.style.setProperty('--scrollbar-thumb', border);

    gameState.themeColor = color;

    if (elements.customColorPicker) elements.customColorPicker.value = color;
    if (elements.customColorHex) elements.customColorHex.value = color;

    document.querySelectorAll('.color-preset').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.color === color) btn.classList.add('active');
    });

    saveGameState();
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function adjustBrightness(hex, percent) {
    const rgb = hexToRgb(hex);
    const adjust = (val) => Math.max(0, Math.min(255, Math.round(val + (val * percent / 100))));
    const r = adjust(rgb.r).toString(16).padStart(2, '0');
    const g = adjust(rgb.g).toString(16).padStart(2, '0');
    const b = adjust(rgb.b).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

function applyDisplaySettings() {
    if (gameState.settings.scanlines) {
        document.body.classList.remove('no-scanlines');
    } else {
        document.body.classList.add('no-scanlines');
    }

    if (gameState.settings.flicker) {
        document.body.classList.remove('no-flicker');
    } else {
        document.body.classList.add('no-flicker');
    }
}

// UI Functions
function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}


// Location and Puzzle Functions
function updateLocationDisplay() {
    if (gameState.currentRoom && elements.currentLocationText) {
        const room = gameState.discoveredRooms[gameState.currentRoom];
        if (room) {
            elements.currentLocationText.textContent = `DECK ${room.floor || gameState.currentFloor} • ${(room.name || room.id).toUpperCase()}`;
        } else {
            elements.currentLocationText.textContent = "UNKNOWN SECTOR";
        }
    }
    updateHealthUI();
}

function updateHealthUI() {
    if (!elements.hpFill || !elements.hpValue) return;

    const hpPercent = (gameState.hp / gameState.maxHp) * 100;
    elements.hpFill.style.width = `${hpPercent}%`;
    elements.hpValue.textContent = `${Math.round(gameState.hp)}/${gameState.maxHp}`;

    // Color classes
    elements.hpFill.classList.remove('warning', 'critical');
    if (hpPercent <= 25) {
        elements.hpFill.classList.add('critical');
    } else if (hpPercent <= 50) {
        elements.hpFill.classList.add('warning');
    }
}

function changeHealth(amount) {
    gameState.hp = Math.max(0, Math.min(gameState.maxHp, gameState.hp + amount));
    updateHealthUI();

    if (amount < 0) {
        // Red flash effect
        const output = elements.gameOutput;
        output.style.boxShadow = 'inset 0 0 50px rgba(255, 0, 0, 0.5)';
        setTimeout(() => output.style.boxShadow = 'none', 500);
        playSound('alert');
    } else if (amount > 0) {
        playSound('success');
    }

    if (gameState.hp <= 0 && !gameState.isDead) {
        showDeathScreen();
    }
}

function showDeathScreen() {
    gameState.isDead = true;
    playSound('error');
    elements.deathModal.classList.remove('hidden');
    // AI might provide a specific death message in narrative, but if not we use default
}

function toggleMap() {
    playSound('terminal');
    if (elements.mapOverlay.classList.contains('hidden')) {
        elements.mapOverlay.classList.remove('hidden');
        unlockAchievement('map_user');

        // Auto-center on current room
        if (gameState.currentRoom) {
            const room = gameState.discoveredRooms[gameState.currentRoom];
            if (room && room.floor === gameState.currentFloor) {
                mapZoom = 1.0;
                // Calculate offset to center room
                // Screen X = Width/2 + OffsetX + RoomX*Zoom + RoomW/2*Zoom
                // We want Screen X = Width/2
                // 0 = OffsetX + (RoomX + RoomW/2) * Zoom
                // OffsetX = -(RoomX + RoomW/2) * Zoom
                const rW = room.width || 120;
                const rH = room.height || 90;
                mapOffset.x = -(room.x + rW / 2) * mapZoom;
                mapOffset.y = -(room.y + rH / 2) * mapZoom;
            } else {
                mapOffset = { x: 0, y: 0 };
            }
        } else {
            mapOffset = { x: 0, y: 0 };
        }

        renderMap();
        animateMap();
    } else {
        elements.mapOverlay.classList.add('hidden');
        if (mapAnimationFrame) {
            cancelAnimationFrame(mapAnimationFrame);
            mapAnimationFrame = null;
        }
    }
}

// Puzzle System
async function startPuzzle(type = 'matching') {
    return new Promise((resolve) => {
        elements.puzzleModal.classList.remove('hidden');
        playSound('alert');

        // Route to the appropriate puzzle type
        switch (type) {
            case 'wires':
                startWiresPuzzle(resolve);
                break;
            case 'sequence':
                startSequencePuzzle(resolve);
                break;
            case 'pattern':
                startPatternPuzzle(resolve);
                break;
            case 'binary':
                startBinaryPuzzle(resolve);
                break;
            case 'matching':
            default:
                startMatchingPuzzle(resolve);
                break;
        }
    });
}

function startMatchingPuzzle(resolve) {
    elements.puzzleStatus.textContent = "INITIALIZING SEQUENCER...";
    document.getElementById('puzzleInstruction').textContent = "MATCH THE SYMBOLS TO BYPASS FIREWALL";
    elements.puzzleGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';

    const symbols = ['¥', 'Ω', '∑', '∆', '∫', '≈', '√', '∞'];
    const pairs = [...symbols, ...symbols];
    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    elements.puzzleGrid.innerHTML = '';
    let flippedCards = [];
    let matchedPairs = 0;
    let isLocked = false;

    pairs.forEach((symbol, index) => {
        const cell = document.createElement('div');
        cell.className = 'puzzle-cell';
        cell.dataset.symbol = symbol;
        cell.dataset.index = index;
        cell.textContent = '';

        cell.addEventListener('click', () => {
            if (isLocked || cell.classList.contains('flipped') || cell.classList.contains('matched')) return;

            playSound('keypress');
            cell.textContent = symbol;
            cell.classList.add('flipped');
            flippedCards.push(cell);

            if (flippedCards.length === 2) {
                isLocked = true;
                if (flippedCards[0].dataset.symbol === flippedCards[1].dataset.symbol) {
                    playSound('success');
                    flippedCards.forEach(c => c.classList.add('matched'));
                    matchedPairs++;
                    flippedCards = [];
                    isLocked = false;

                    if (matchedPairs === 8) {
                        completePuzzle(resolve, true, "SEQUENCE COMPLETE. ACCESS GRANTED.");
                    }
                } else {
                    playSound('error');
                    setTimeout(() => {
                        flippedCards.forEach(c => {
                            c.textContent = '';
                            c.classList.remove('flipped');
                        });
                        flippedCards = [];
                        isLocked = false;
                    }, 1000);
                }
            }
        });

        elements.puzzleGrid.appendChild(cell);
    });

    startPuzzleTimer(30000, resolve, () => matchedPairs === 8);
}

function startWiresPuzzle(resolve) {
    elements.puzzleStatus.textContent = "ELECTRICAL BYPASS REQUIRED";
    document.getElementById('puzzleInstruction').textContent = "CONNECT THE MATCHING COLORED WIRES";
    elements.puzzleGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    elements.puzzleGrid.innerHTML = '';

    const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'];
    const shuffledLeft = [...colors].sort(() => Math.random() - 0.5);
    const shuffledRight = [...colors].sort(() => Math.random() - 0.5);

    let selectedLeft = null;
    let connections = 0;

    // Left column
    const leftCol = document.createElement('div');
    leftCol.className = 'wire-column';
    shuffledLeft.forEach((color, i) => {
        const wire = document.createElement('div');
        wire.className = 'puzzle-cell wire-endpoint left';
        wire.style.backgroundColor = color;
        wire.dataset.color = color;
        wire.dataset.index = i;
        wire.innerHTML = '●';

        wire.addEventListener('click', () => {
            if (wire.classList.contains('connected')) return;
            document.querySelectorAll('.wire-endpoint.left').forEach(w => w.classList.remove('selected'));
            wire.classList.add('selected');
            selectedLeft = wire;
            playSound('keypress');
        });

        leftCol.appendChild(wire);
    });

    // Right column
    const rightCol = document.createElement('div');
    rightCol.className = 'wire-column';
    shuffledRight.forEach((color, i) => {
        const wire = document.createElement('div');
        wire.className = 'puzzle-cell wire-endpoint right';
        wire.style.backgroundColor = color;
        wire.dataset.color = color;
        wire.dataset.index = i;
        wire.innerHTML = '●';

        wire.addEventListener('click', () => {
            if (wire.classList.contains('connected') || !selectedLeft) return;

            if (selectedLeft.dataset.color === wire.dataset.color) {
                playSound('success');
                selectedLeft.classList.add('connected');
                wire.classList.add('connected');
                selectedLeft.classList.remove('selected');
                connections++;
                selectedLeft = null;

                if (connections === 5) {
                    completePuzzle(resolve, true, "CIRCUIT RESTORED. ACCESS GRANTED.");
                }
            } else {
                playSound('error');
                selectedLeft.classList.remove('selected');
                selectedLeft = null;
            }
        });

        rightCol.appendChild(wire);
    });

    elements.puzzleGrid.appendChild(leftCol);
    elements.puzzleGrid.appendChild(rightCol);

    startPuzzleTimer(25000, resolve, () => connections === 5);
}

function startSequencePuzzle(resolve) {
    elements.puzzleStatus.textContent = "SEQUENCE ENTRY REQUIRED";
    document.getElementById('puzzleInstruction').textContent = "MEMORIZE AND REPEAT THE SEQUENCE";
    elements.puzzleGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    elements.puzzleGrid.innerHTML = '';

    const sequence = [];
    const sequenceLength = 5;
    let playerSequence = [];
    let isShowingSequence = false;

    // Create 9 cells (3x3)
    const cells = [];
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'puzzle-cell sequence-cell';
        cell.dataset.index = i;
        cell.textContent = i + 1;

        cell.addEventListener('click', () => {
            if (isShowingSequence) return;

            playSound('keypress');
            cell.classList.add('active');
            setTimeout(() => cell.classList.remove('active'), 200);

            playerSequence.push(i);

            if (playerSequence[playerSequence.length - 1] !== sequence[playerSequence.length - 1]) {
                playSound('error');
                playerSequence = [];
                elements.puzzleStatus.textContent = "WRONG! Watch again...";
                setTimeout(() => showSequence(), 1000);
            } else if (playerSequence.length === sequence.length) {
                completePuzzle(resolve, true, "SEQUENCE VERIFIED. ACCESS GRANTED.");
            }
        });

        cells.push(cell);
        elements.puzzleGrid.appendChild(cell);
    }

    // Generate random sequence
    for (let i = 0; i < sequenceLength; i++) {
        sequence.push(Math.floor(Math.random() * 9));
    }

    function showSequence() {
        isShowingSequence = true;
        playerSequence = [];
        elements.puzzleStatus.textContent = "WATCH THE SEQUENCE...";

        sequence.forEach((idx, i) => {
            setTimeout(() => {
                cells[idx].classList.add('highlight');
                playSound('success');
                setTimeout(() => cells[idx].classList.remove('highlight'), 400);
            }, i * 700);
        });

        setTimeout(() => {
            isShowingSequence = false;
            elements.puzzleStatus.textContent = "YOUR TURN - REPEAT THE SEQUENCE";
        }, sequence.length * 700);
    }

    setTimeout(showSequence, 1000);
    startPuzzleTimer(45000, resolve, () => playerSequence.length === sequence.length && playerSequence.every((v, i) => v === sequence[i]));
}

function startPatternPuzzle(resolve) {
    elements.puzzleStatus.textContent = "PATTERN LOCK DETECTED";
    document.getElementById('puzzleInstruction').textContent = "DRAW THE UNLOCK PATTERN (CONNECT 4+ DOTS)";
    elements.puzzleGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    elements.puzzleGrid.innerHTML = '';

    const targetPattern = [0, 1, 2, 5, 8]; // L shape
    let currentPattern = [];
    let isDrawing = false;

    const cells = [];
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'puzzle-cell pattern-dot';
        cell.dataset.index = i;
        cell.innerHTML = '◯';

        cell.addEventListener('mousedown', () => {
            isDrawing = true;
            currentPattern = [i];
            cell.classList.add('active');
            cell.innerHTML = '●';
            playSound('keypress');
        });

        cell.addEventListener('mouseenter', () => {
            if (isDrawing && !currentPattern.includes(i)) {
                currentPattern.push(i);
                cell.classList.add('active');
                cell.innerHTML = '●';
                playSound('keypress');
            }
        });

        cells.push(cell);
        elements.puzzleGrid.appendChild(cell);
    }

    document.addEventListener('mouseup', function checkPattern() {
        if (!isDrawing) return;
        isDrawing = false;

        if (currentPattern.length >= 4) {
            // Accept any pattern of 4+ dots
            completePuzzle(resolve, true, "PATTERN ACCEPTED. ACCESS GRANTED.");
        } else {
            playSound('error');
            elements.puzzleStatus.textContent = "PATTERN TOO SHORT. TRY AGAIN.";
            cells.forEach(c => {
                c.classList.remove('active');
                c.innerHTML = '◯';
            });
            currentPattern = [];
        }
    }, { once: false });

    startPuzzleTimer(30000, resolve, () => currentPattern.length >= 4);
}

function startBinaryPuzzle(resolve) {
    elements.puzzleStatus.textContent = "SYSTEM OVERRIDE REQUIRED";
    document.getElementById('puzzleInstruction').textContent = "SET ALL SWITCHES TO ON (GREEN)";
    elements.puzzleGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    elements.puzzleGrid.innerHTML = '';

    // Create 8 switches, each toggle affects neighbors
    const states = [false, false, false, false, false, false, false, false];
    const cells = [];

    function updateCells() {
        cells.forEach((cell, i) => {
            cell.className = `puzzle-cell binary-switch ${states[i] ? 'on' : 'off'}`;
            cell.textContent = states[i] ? 'ON' : 'OFF';
        });

        if (states.every(s => s)) {
            completePuzzle(resolve, true, "OVERRIDE COMPLETE. ACCESS GRANTED.");
        }
    }

    for (let i = 0; i < 8; i++) {
        const cell = document.createElement('div');
        cell.className = 'puzzle-cell binary-switch off';
        cell.dataset.index = i;
        cell.textContent = 'OFF';

        cell.addEventListener('click', () => {
            playSound('keypress');
            // Toggle this switch and adjacent switches
            states[i] = !states[i];
            if (i > 0) states[i - 1] = !states[i - 1];
            if (i < 7) states[i + 1] = !states[i + 1];
            updateCells();
        });

        cells.push(cell);
        elements.puzzleGrid.appendChild(cell);
    }

    // Randomize initial state
    for (let i = 0; i < 5; i++) {
        const idx = Math.floor(Math.random() * 8);
        states[idx] = !states[idx];
        if (idx > 0) states[idx - 1] = !states[idx - 1];
        if (idx < 7) states[idx + 1] = !states[idx + 1];
    }
    updateCells();

    startPuzzleTimer(40000, resolve, () => states.every(s => s));
}

function completePuzzle(resolve, success, message) {
    if (success) {
        playSound('victory');
        elements.puzzleStatus.textContent = message;
        setTimeout(() => {
            elements.puzzleModal.classList.add('hidden');
            resolve(true);
        }, 1500);
    }
}

function startPuzzleTimer(duration, resolve, checkComplete) {
    const startTime = Date.now();
    elements.puzzleTimer.style.width = '100%';

    const timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration * 100));
        elements.puzzleTimer.style.width = `${remaining}%`;

        if (checkComplete()) {
            clearInterval(timerInterval);
        } else if (remaining <= 0) {
            clearInterval(timerInterval);
            playSound('error');
            elements.puzzleStatus.textContent = "TIMEOUT. BREACH FAILED.";
            setTimeout(() => {
                elements.puzzleModal.classList.add('hidden');
                resolve(false);
            }, 2000);
        }
    }, 100);
}


function toggleSettings() {
    playSound('terminal');
    if (elements.settingsModal.classList.contains('hidden')) {
        elements.settingsModal.classList.remove('hidden');
    } else {
        elements.settingsModal.classList.add('hidden');
    }
}

// Persistence
function saveGameState() {
    try {
        localStorage.setItem('exodusGameState', JSON.stringify(gameState));
        localStorage.setItem('exodusAudioSettings', JSON.stringify(audioSettings));
    } catch (e) {
        console.warn('Save failed:', e);
    }
}

function loadGameState() {
    try {
        const saved = localStorage.getItem('exodusGameState');
        if (saved) {
            const parsed = JSON.parse(saved);
            gameState = { ...gameState, ...parsed };
            return true;
        }
        if (audioSaved) {
            Object.assign(audioSettings, JSON.parse(audioSaved));
        }
        updateHealthUI();
    } catch (e) {
        console.warn('Load failed:', e);
    }
    return false;
}

function resetGame() {
    stopAmbient();

    gameState = {
        initialized: false,
        currentRoom: null,
        currentFloor: 1,
        inventory: [],
        discoveredRooms: {},
        floors: {},
        conversationHistory: [],
        mapUnlocked: false,
        themeColor: gameState.themeColor,
        hasWon: false,
        isDead: false,
        hp: 100,
        maxHp: 100,
        settings: gameState.settings || { scanlines: true, flicker: true, textAnimation: true, textSpeed: 'normal' },
        achievements: gameState.achievements || {},
        puzzlesCompleted: 0,
        terminalsAccessed: 0,
        commandCount: 0
    };

    localStorage.removeItem('exodusGameState');

    elements.gameOutput.innerHTML = `
        <div class="welcome-message">
            <p class="ascii-art">
    ███████╗██╗  ██╗ ██████╗ ██████╗ ██╗   ██╗███████╗
    ██╔════╝╚██╗██╔╝██╔═══██╗██╔══██╗██║   ██║██╔════╝
    █████╗   ╚███╔╝ ██║   ██║██║  ██║██║   ██║███████╗
    ██╔══╝   ██╔██╗ ██║   ██║██║  ██║██║   ██║╚════██║
    ███████╗██╔╝ ██╗╚██████╔╝██████╔╝╚██████╔╝███████║
    ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝
                                                        
         D E E P   S P A C E   S U R V I V A L
                                                        
    ─────────────────────────────────────────────────
           [ INITIALIZING CRYO-REVIVAL SEQUENCE ]
    ─────────────────────────────────────────────────
            </p>
            <p class="intro-text">SYSTEMS COMING ONLINE...</p>
        </div>
    `;

    elements.inventoryList.innerHTML = '<p class="empty-inventory">No items.</p>';
    elements.floorSelector.classList.add('hidden');
    elements.resetModal.classList.add('hidden');
    elements.victoryModal.classList.add('hidden');
    elements.deathModal.classList.add('hidden');

    updateHealthUI();

    initGame();
}

// Input Handler
async function handleInput() {
    const input = elements.gameInput.value.trim();
    if (!input) return;

    playSound('submit');
    elements.gameInput.value = '';
    showLoading(true);

    let retryCount = 0;
    const maxRetries = 2;

    let aiResponse = null;

    while (retryCount <= maxRetries) {
        try {
            aiResponse = await sendToAI(input);
            break; // Success, exit retry loop
        } catch (error) {
            console.error('Error:', error);
            
            // Do not retry on auth, parsing, or validation errors
            if (error.message.includes('API key') || error.message.includes('OpenRouter Error') || error.message.includes('No JSON found') || error.message.includes('format invalid')) {
                displayError(`SYSTEM ERROR: ${error.message}`);
                break;
            }

            retryCount++;

            if (retryCount > maxRetries) {
                // Check for specific error types
                const errorMessage = error.message || '';
                if (errorMessage.includes('401') || errorMessage.includes('403')) {
                    displayError("SYSTEM ERROR: API key invalid or expired. Check your OpenRouter API key in game.js CONFIG.");
                } else if (errorMessage.includes('429')) {
                    displayError("SYSTEM ERROR: Rate limit exceeded. Wait a moment and try again.");
                } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
                    displayError("SYSTEM ERROR: AI service temporarily unavailable. Try again shortly.");
                } else {
                    displayError(`SYSTEM ERROR: ${errorMessage || "Communication failure. Check console for details."}`);
                }
            } else {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }
    }

    if (aiResponse) {
        try {
            processAIResponse(aiResponse);
        } catch (processError) {
            console.error('Error processing AI response:', processError);
            displayError(`SYSTEM ERROR during response processing: ${processError.message}`);
        }
    }

    showLoading(false);
    elements.gameInput.focus();
}

// Event Listeners
function initEventListeners() {
    document.getElementById('openApiSettingsBtn')?.addEventListener('click', () => {
        document.getElementById('apiInput').value = localStorage.getItem('openrouter_key') || '';
        document.getElementById('modelInput').value = localStorage.getItem('openrouter_model') || CONFIG.model;
        toggleSettings();
        document.getElementById('apiModal').classList.remove('hidden');
    });

    document.getElementById('submitApiBtn')?.addEventListener('click', () => {
        const key = document.getElementById('apiInput').value.trim();
        const model = document.getElementById('modelInput').value.trim();
        if (key && model) {
            localStorage.setItem('openrouter_key', key);
            localStorage.setItem('openrouter_model', model);
            document.getElementById('apiModal').classList.add('hidden');
            window.location.reload();
        }
    });

    elements.submitBtn.addEventListener('click', handleInput);
    elements.gameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleInput();
    });

    elements.mapToggleBtn.addEventListener('click', toggleMap);
    elements.closeMapBtn.addEventListener('click', toggleMap);
    elements.floorSelect.addEventListener('change', (e) => {
        gameState.currentFloor = Number(e.target.value);
        renderMap();
    });

    elements.settingsBtn.addEventListener('click', toggleSettings);
    elements.closeSettings.addEventListener('click', toggleSettings);

    // Color presets
    document.querySelectorAll('.color-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            applyThemeColor(btn.dataset.color);
            playSound('success');
        });
    });

    if (elements.respawnBtn) {
        elements.respawnBtn.addEventListener('click', () => {
            playSound('terminal');
            resetGame();
        });
    }

    elements.customColorPicker.addEventListener('input', (e) => {
        elements.customColorHex.value = e.target.value;
    });

    elements.customColorHex.addEventListener('input', (e) => {
        let value = e.target.value;
        if (!value.startsWith('#')) value = '#' + value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            elements.customColorPicker.value = value;
        }
    });

    elements.applyCustomColor.addEventListener('click', () => {
        let color = elements.customColorHex.value;
        if (!color.startsWith('#')) color = '#' + color;
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            applyThemeColor(color);
            playSound('success');
        }
    });

    // Audio controls
    elements.masterVolume.addEventListener('input', (e) => {
        audioSettings.masterVolume = e.target.value / 100;
        elements.masterVolumeValue.textContent = `${e.target.value}%`;
        saveGameState();
    });

    elements.sfxVolume.addEventListener('input', (e) => {
        audioSettings.sfxVolume = e.target.value / 100;
        elements.sfxVolumeValue.textContent = `${e.target.value}%`;
        saveGameState();
    });

    elements.ambientVolume.addEventListener('input', (e) => {
        audioSettings.ambientVolume = e.target.value / 100;
        elements.ambientVolumeValue.textContent = `${e.target.value}%`;
        saveGameState();
    });

    // Display toggles
    elements.scanlineToggle.addEventListener('change', (e) => {
        gameState.settings.scanlines = e.target.checked;
        applyDisplaySettings();
        saveGameState();
    });

    elements.flickerToggle.addEventListener('change', (e) => {
        gameState.settings.flicker = e.target.checked;
        applyDisplaySettings();
        saveGameState();
    });

    elements.textAnimToggle.addEventListener('change', (e) => {
        gameState.settings.textAnimation = e.target.checked;
        saveGameState();
    });

    // Text speed buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.settings.textSpeed = btn.dataset.speed;
            playSound('success');
            saveGameState();
        });
    });

    // Reset
    elements.resetBtn.addEventListener('click', () => {
        playSound('alert');
        elements.resetModal.classList.remove('hidden');
    });
    elements.confirmReset.addEventListener('click', resetGame);
    elements.cancelReset.addEventListener('click', () => {
        elements.resetModal.classList.add('hidden');
    });

    // Victory
    elements.playAgainBtn.addEventListener('click', resetGame);

    // Item modal
    elements.closeItemModal.addEventListener('click', () => {
        elements.itemModal.classList.add('hidden');
    });
    elements.itemModal.addEventListener('click', (e) => {
        if (e.target === elements.itemModal) {
            elements.itemModal.classList.add('hidden');
        }
    });

    // Escape key closes all modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.mapOverlay.classList.add('hidden');
            elements.itemModal.classList.add('hidden');
            elements.resetModal.classList.add('hidden');
            elements.settingsModal.classList.add('hidden');
        }
    });

    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            elements.settingsModal.classList.add('hidden');
        }
    });

    window.addEventListener('resize', () => {
        if (!elements.mapOverlay.classList.contains('hidden')) {
            renderMap();
        }
    });

    // Initialize audio on first interaction
    document.addEventListener('click', () => {
        initAudio();
    }, { once: true });
}

// Achievement functions
function toggleAchievements() {
    playSound('terminal');
    const modal = document.getElementById('achievementsModal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        renderAchievements();
    } else {
        modal.classList.add('hidden');
    }
}

function renderAchievements() {
    const list = document.getElementById('achievementsList');
    const progressFill = document.getElementById('achievementProgress');
    const progressText = document.getElementById('achievementProgressText');

    if (!list) return;

    list.innerHTML = '';

    const total = Object.keys(ACHIEVEMENTS).length;
    const unlocked = Object.keys(gameState.achievements || {}).length;

    if (progressFill) {
        progressFill.style.width = `${(unlocked / total) * 100}%`;
    }
    if (progressText) {
        progressText.textContent = `${unlocked}/${total}`;
    }

    Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
        const isUnlocked = gameState.achievements && gameState.achievements[id];
        const isSecret = achievement.secret === true;

        const div = document.createElement('div');
        div.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;

        const icon = document.createElement('span');
        icon.className = 'achievement-icon';
        icon.textContent = isUnlocked ? achievement.icon : (isSecret ? '❓' : achievement.icon);

        const info = document.createElement('div');
        info.className = 'achievement-info';

        const name = document.createElement('span');
        name.className = 'achievement-name';
        // Secret achievements show ??? for both name and description until unlocked
        name.textContent = (isSecret && !isUnlocked) ? '???' : achievement.name;

        const desc = document.createElement('span');
        desc.className = 'achievement-desc';
        // Secret achievements show ??? until unlocked, others always show description
        desc.textContent = (isSecret && !isUnlocked) ? '???' : achievement.description;

        info.appendChild(name);
        info.appendChild(desc);

        div.appendChild(icon);
        div.appendChild(info);

        list.appendChild(div);
    });
}

function unlockAchievement(id) {
    if (!ACHIEVEMENTS[id]) return;
    if (!gameState.achievements) gameState.achievements = {};
    if (gameState.achievements[id]) return; // Already unlocked

    gameState.achievements[id] = { unlockedAt: Date.now() };

    // Show notification
    const achievement = ACHIEVEMENTS[id];
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <span class="notif-icon">${achievement.icon}</span>
        <div class="notif-info">
            <span class="notif-title">ACHIEVEMENT UNLOCKED</span>
            <span class="notif-name">${achievement.name}</span>
        </div>
    `;
    document.body.appendChild(notification);

    playSound('success');

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);

    saveGameState();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    initMapControls();

    const hasSavedGame = loadGameState();

    // Apply saved settings
    if (elements.masterVolume) elements.masterVolume.value = audioSettings.masterVolume * 100;
    if (elements.sfxVolume) elements.sfxVolume.value = audioSettings.sfxVolume * 100;
    if (elements.ambientVolume) elements.ambientVolume.value = audioSettings.ambientVolume * 100;
    if (elements.masterVolumeValue) elements.masterVolumeValue.textContent = `${Math.round(audioSettings.masterVolume * 100)}%`;
    if (elements.sfxVolumeValue) elements.sfxVolumeValue.textContent = `${Math.round(audioSettings.sfxVolume * 100)}%`;
    if (elements.ambientVolumeValue) elements.ambientVolumeValue.textContent = `${Math.round(audioSettings.ambientVolume * 100)}%`;

    if (elements.scanlineToggle) elements.scanlineToggle.checked = gameState.settings.scanlines;
    if (elements.flickerToggle) elements.flickerToggle.checked = gameState.settings.flicker;
    if (elements.textAnimToggle) elements.textAnimToggle.checked = gameState.settings.textAnimation;

    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.speed === gameState.settings.textSpeed) {
            btn.classList.add('active');
        }
    });

    if (hasSavedGame && gameState.initialized) {
        if (gameState.themeColor) applyThemeColor(gameState.themeColor);
        applyDisplaySettings();
        renderInventory();
        updateFloorSelector();

        const welcome = elements.gameOutput.querySelector('.welcome-message');
        if (welcome) {
            welcome.innerHTML = `
                <p class="intro-text">[ SESSION RESTORED ]</p>
                <p style="color: var(--text-secondary); margin-top: 10px;">Previous state recovered from backup.</p>
            `;
        }

        setTimeout(() => {
            displayNarrative("Systems online. Type 'look around' to assess your surroundings.");
            playSound('ambient');
        }, 500);
        updateLocationDisplay();
    } else {
        applyThemeColor('#00ff00');
        initGame();
    }
});
