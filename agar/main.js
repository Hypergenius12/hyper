

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let game;
let renderer;
let player;
let lastTime = 0;
let animationId;
let myId = "player_1"; // Static for single player

// UI Elements
const startMenu = document.getElementById('startMenu');
const playBtn = document.getElementById('playBtn');
const playerNameInput = document.getElementById('playerNameInput');
const overlays = document.getElementById('overlays');
const scoreDisplay = document.getElementById('scoreDisplay');
const leaderboardList = document.getElementById('leaderboardList');
const leaderboard = document.getElementById('leaderboard');
const scoreBox = document.getElementById('scoreBox');
const spectateBtn = document.getElementById('spectateBtn');
const spectateTip = document.getElementById('spectateTip');

let spectating = false;
let globalMouseX = window.innerWidth / 2;
let globalMouseY = window.innerHeight / 2;
let spectateZoom = 0.2;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function init() {
    game = new Game();
    renderer = new Renderer(canvas, ctx, game);
    
    // Inputs
    window.addEventListener('mousemove', (e) => {
        globalMouseX = e.clientX;
        globalMouseY = e.clientY;
        if (player) {
            player.mouseX = e.clientX;
            player.mouseY = e.clientY;
        }
    });

    window.addEventListener('wheel', (e) => {
        if (spectating) {
            spectateZoom += e.deltaY * -0.0005;
            spectateZoom = Math.max(0.05, Math.min(1.5, spectateZoom));
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && spectating) {
            spectating = false;
            startMenu.classList.remove('hidden');
            leaderboard.classList.add('hidden');
            spectateTip.classList.add('hidden');
            return;
        }
        
        if (!player) return;
        
        if (e.code === 'Space') {
            game.splitPlayer(myId);
        } else if (e.code === 'KeyW') {
            game.ejectMass(myId);
        }
    });

    playBtn.addEventListener('click', startGame);
    
    spectateBtn.addEventListener('click', () => {
        spectating = true;
        startMenu.classList.add('hidden');
        leaderboard.classList.remove('hidden');
        scoreBox.classList.add('hidden');
        spectateTip.classList.remove('hidden');
        
        if (player) {
            game.removePlayer(myId);
            player = null;
        }
    });
    
    // UI Setup for Leaderboard Tabs
    const tabGlobal = document.getElementById('tabGlobal');
    const tabPersonal = document.getElementById('tabPersonal');
    
    if (tabGlobal) {
        tabGlobal.addEventListener('click', () => {
            currentTab = 'global';
            tabGlobal.style.background = '#2ecc71';
            tabGlobal.style.color = 'white';
            tabPersonal.style.background = '#ecf0f1';
            tabPersonal.style.color = '#333';
            renderMenuLeaderboard();
        });
    }

    if (tabPersonal) {
        tabPersonal.addEventListener('click', () => {
            currentTab = 'personal';
            tabPersonal.style.background = '#2ecc71';
            tabPersonal.style.color = 'white';
            tabGlobal.style.background = '#ecf0f1';
            tabGlobal.style.color = '#333';
            renderMenuLeaderboard();
        });
    }

    // Start game loop in background to let bots move
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    // Fetch initial global leaderboard
    fetchGlobalLeaderboard();
}

const GLOBAL_LB_API = "https://api.restful-api.dev/objects/ff8081819d82fab6019eefc8cc9f4964";
let myHighScore = 0;
let globalScores = [];
let myPersonalScores = JSON.parse(localStorage.getItem('hyper_agar_scores')) || [];
let currentTab = 'global';

const SWEAR_WORDS = ["fuck", "shit", "bitch", "asshole", "cunt", "nigger", "nigga", "fag", "dick", "pussy", "cock", "slut", "whore", "bastard"];

function containsSwear(name) {
    const lowerName = name.toLowerCase();
    return SWEAR_WORDS.some(swear => lowerName.includes(swear));
}

// UI Setup for Leaderboard Tabs will be attached in init()

async function fetchGlobalLeaderboard() {
    try {
        const response = await fetch(GLOBAL_LB_API);
        const data = await response.json();
        if (data && data.data && data.data.scores) {
            globalScores = data.data.scores;
            globalScores.sort((a, b) => b.score - a.score);
            renderMenuLeaderboard();
        }
    } catch (e) {
        console.error("Failed to fetch global leaderboard", e);
    }
}

function renderMenuLeaderboard() {
    const list = document.getElementById('menuLeaderboardList');
    if (!list) return;
    list.innerHTML = '';
    
    const targetArray = currentTab === 'global' ? globalScores : myPersonalScores;
    
    if (targetArray.length === 0) {
        list.innerHTML = '<li>No scores yet!</li>';
        return;
    }
    
    targetArray.slice(0, 10).forEach(entry => {
        const li = document.createElement('li');
        li.innerText = `${entry.name} - ${entry.score}`;
        list.appendChild(li);
    });
}

async function submitScoreToGlobal(name, score) {
    if (score < 100) return; // Don't submit very low scores
    
    try {
        const response = await fetch(GLOBAL_LB_API);
        const data = await response.json();
        let scores = [];
        if (data && data.data && data.data.scores) {
            scores = data.data.scores;
        }
        
        scores.push({ name: name, score: score });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 100); // Keep top 100
        
        await fetch(GLOBAL_LB_API, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: "hyper-agar-leaderboard",
                data: { scores: scores }
            })
        });
        
        fetchGlobalLeaderboard();
    } catch (e) {
        console.error("Failed to submit score", e);
    }
}

function startGame() {
    let name = playerNameInput.value || "An unnamed cell";
    
    if (containsSwear(name)) {
        alert("Please choose a different name without inappropriate words.");
        return;
    }
    
    const colorInput = document.getElementById('playerColor');
    const selectedColor = colorInput ? colorInput.value : null;
    
    // Clear previous if respawning
    if (player) {
        game.removePlayer(myId);
    }
    
    myHighScore = 0;
    
    // Spawn human player at massive 1500 mass!
    const { color } = game.addPlayer(myId, name, selectedColor, 1500);
    player = new Player(game, myId, name, color);
    
    startMenu.classList.add('hidden');
    leaderboard.classList.remove('hidden');
    scoreBox.classList.remove('hidden');
    
    // Focus canvas
    canvas.focus();
}

function updateUI() {
    if (!player) return;

    // Check if player died without slow array filter
    let hasMyCells = false;
    for (let i = 0; i < game.entities.length; i++) {
        const e = game.entities[i];
        if (e.type === 'cell' && e.ownerId === myId && !e.killedBy) {
            hasMyCells = true;
            break;
        }
    }
    
    const score = game.getPlayerScore(myId);
    if (score > myHighScore) {
        myHighScore = score;
    }
    
    if (!hasMyCells && startMenu.classList.contains('hidden') && document.getElementById('deathPopup').classList.contains('hidden')) {
        // Player died
        handlePlayerDeath();
        player = null;
        return;
    }

    scoreDisplay.innerText = score;

    const lb = game.getLeaderboard();
    leaderboardList.innerHTML = '';
    
    for (let i = 0; i < lb.length; i++) {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.innerText = `${i + 1}. ${lb[i].name || 'An unnamed cell'} - ${lb[i].score}`;
        if (lb[i].name === (player ? player.name : null)) {
            nameSpan.style.color = '#FFAAAA';
            nameSpan.style.fontWeight = 'bold';
        }
        
        item.appendChild(nameSpan);
        leaderboardList.appendChild(item);
    }
}

async function handlePlayerDeath() {
    const deathPopup = document.getElementById('deathPopup');
    startMenu.classList.add('hidden');
    leaderboard.classList.add('hidden');
    scoreBox.classList.add('hidden');
    spectateTip.classList.add('hidden');
    
    deathPopup.classList.remove('hidden');
    
    document.getElementById('deathScoreDisplay').innerText = myHighScore;
    
    // Calculate personal rank
    let personalRank = 1;
    for (let s of myPersonalScores) {
        if (s.score > myHighScore) personalRank++;
    }
    document.getElementById('personalPlacementDisplay').innerText = `#${personalRank}`;
    
    // Fetch latest global to calculate global rank accurately
    document.getElementById('globalPlacementDisplay').innerText = "Loading...";
    try {
        const response = await fetch(GLOBAL_LB_API);
        const data = await response.json();
        if (data && data.data && data.data.scores) {
            globalScores = data.data.scores;
            globalScores.sort((a, b) => b.score - a.score);
        }
    } catch (e) {
        console.error("Failed to fetch global leaderboard on death", e);
    }
    
    let globalRank = 1;
    for (let s of globalScores) {
        if (s.score > myHighScore) globalRank++;
    }
    document.getElementById('globalPlacementDisplay').innerText = `#${globalRank}`;
    
    window.lastDeathName = player.name;
    window.lastDeathScore = myHighScore;
}

document.getElementById('submitScoreBtn').addEventListener('click', async () => {
    if (!window.lastDeathName) return;
    const btn = document.getElementById('submitScoreBtn');
    btn.disabled = true;
    btn.innerText = "Submitting...";
    
    await submitScoreToGlobal(window.lastDeathName, window.lastDeathScore);
    savePersonalScore(window.lastDeathName, window.lastDeathScore);
    
    btn.disabled = false;
    btn.innerText = "Submit to Global Leaderboard";
    
    document.getElementById('deathPopup').classList.add('hidden');
    startMenu.classList.remove('hidden');
});

document.getElementById('skipScoreBtn').addEventListener('click', () => {
    if (!window.lastDeathName) return;
    savePersonalScore(window.lastDeathName, window.lastDeathScore);
    document.getElementById('deathPopup').classList.add('hidden');
    startMenu.classList.remove('hidden');
});

function savePersonalScore(name, score) {
    myPersonalScores.push({ name: name, score: score });
    myPersonalScores.sort((a, b) => b.score - a.score);
    myPersonalScores = myPersonalScores.slice(0, 100);
    localStorage.setItem('hyper_agar_scores', JSON.stringify(myPersonalScores));
    renderMenuLeaderboard();
}

function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (player) {
        player.updateTarget(renderer.cameraX, renderer.cameraY, renderer.zoom, canvas.width, canvas.height);
    }

    game.update(dt);
    
    if (player) {
        renderer.updateCamera(myId);
    } else if (spectating) {
        // Free cam movement based on mouse distance from center
        const dx = globalMouseX - canvas.width / 2;
        const dy = globalMouseY - canvas.height / 2;
        
        // Pan camera
        renderer.cameraX += (dx * 0.03) / renderer.zoom;
        renderer.cameraY += (dy * 0.03) / renderer.zoom;
        
        // Keep in bounds
        renderer.cameraX = Math.max(0, Math.min(Config.MAP_WIDTH, renderer.cameraX));
        renderer.cameraY = Math.max(0, Math.min(Config.MAP_HEIGHT, renderer.cameraY));
        
        renderer.targetZoom = spectateZoom;
        renderer.zoom = MathUtils.lerp(renderer.zoom, renderer.targetZoom, 0.1);
    } else {
        // If dead or main menu, just gently pan camera
        renderer.cameraX += 0.5;
        renderer.cameraY += 0.5;
        renderer.zoom = 0.5;
    }
    
    renderer.draw();
    
    // Throttle UI updates to save performance
    if (Math.random() < 0.2) {
        updateUI();
    }

    requestAnimationFrame(gameLoop);
}

init();
