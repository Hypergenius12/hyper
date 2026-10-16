// ============================================
// chat.js  -  In-Game Chat & Command System
// ============================================
import * as THREE from 'three';
import { BLOCKS, getBlockName } from './textures.js?v=116';
import { BIOMES, getBiomeParams, getClosestStrongholdPosition, getClosestIglooPosition, getClosestWitchHutPosition, getClosestVillagePosition } from './generation.js?v=116';
import { Mob, MOB_TYPES, Item } from './entities.js?v=116';

export class ChatSystem {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.messages = [];
        this.history = [];
        this.historyIndex = -1;
        this.currentDraft = '';
        this.fadeTimeout = null;

        this.container = null;
        this.messagesEl = null;
        this.inputBar = null;
        this.inputEl = null;
        this.autocompleteEl = null;

        this.commandsList = [
            'tp', 'find', 'locate', 'kill', 'summon', 'spawn', 'give',
            'gamemode', 'time', 'weather', 'clear', 'heal', 'fly',
            'speed', 'dimension', 'seed', 'tps', 'help'
        ];
    }

    init() {
        this.container = document.getElementById('chat-container');
        this.messagesEl = document.getElementById('chat-messages');
        this.inputBar = document.getElementById('chat-input-bar');
        this.inputEl = document.getElementById('chat-input');
        this.autocompleteEl = document.getElementById('chat-autocomplete');

        if (!this.container || !this.inputEl) {
            console.error('ChatSystem: Required DOM elements not found.');
            return;
        }

        // Input keydown listener
        this.inputEl.addEventListener('keydown', (e) => {
            e.stopPropagation(); // Prevent engine from receiving keys while typing

            if (e.code === 'Escape') {
                e.preventDefault();
                this.close(true);
            } else if (e.code === 'Enter') {
                e.preventDefault();
                this.submit();
            } else if (e.code === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            } else if (e.code === 'Tab') {
                e.preventDefault();
                this.handleTabAutocomplete();
            }
        });

        // Input change for live autocomplete suggestions
        this.inputEl.addEventListener('input', () => {
            this.updateAutocomplete();
        });

        // Wire engine chat open handler
        if (this.game.input) {
            this.game.input.onChatOpen = (initialText) => {
                const startScreen = document.getElementById('start-screen');
                if (startScreen && !startScreen.classList.contains('hidden')) return;
                const pauseScreen = document.getElementById('pause-screen');
                if (pauseScreen && !pauseScreen.classList.contains('hidden')) return;
                if (this.game.ui && this.game.ui.isOpen) return;

                this.open(initialText);
            };
        }

        // Welcome hint message in chat
        this.addMessage("Slopcraft 3D Chat & Command System active.", "#ffff55");
        this.addMessage("Press 'T' to chat, '/' for commands. (Commands require Creative Mode!)", "#aaaaaa");
    }

    open(initialText = '') {
        if (this.isOpen) return;
        this.isOpen = true;

        if (this.fadeTimeout) {
            clearTimeout(this.fadeTimeout);
            this.fadeTimeout = null;
        }

        this.container.classList.add('active');
        this.inputBar.classList.remove('hidden');

        // Dismiss pause screen if visible so chat is active
        const pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) pauseScreen.classList.add('hidden');
        this.game.isPaused = false;

        // Restore full opacity to all messages while chat is open
        const msgItems = this.messagesEl.querySelectorAll('.chat-message');
        msgItems.forEach(el => el.style.opacity = '1');

        if (document.pointerLockElement) {
            try {
                document.exitPointerLock();
            } catch (err) {
                // Ignore
            }
        }

        this.inputEl.value = initialText;
        this.historyIndex = -1;
        this.currentDraft = initialText;

        // Ensure focused after pointer lock releases
        setTimeout(() => {
            this.inputEl.focus();
            this.inputEl.selectionStart = this.inputEl.selectionEnd = this.inputEl.value.length;
            this.updateAutocomplete();
            this.scrollToBottom();
        }, 10);
    }

    close(restorePointerLock = true) {
        if (!this.isOpen) return;
        this.isOpen = false;

        this.container.classList.remove('active');
        this.inputBar.classList.add('hidden');
        if (this.autocompleteEl) this.autocompleteEl.classList.add('hidden');

        this.inputEl.blur();
        this.inputEl.value = '';
        this.historyIndex = -1;

        // Schedule messages fade-out after 8 seconds
        this.scheduleFade();

        if (restorePointerLock) {
            const startScreen = document.getElementById('start-screen');
            const pauseScreen = document.getElementById('pause-screen');
            const isStartOpen = startScreen && !startScreen.classList.contains('hidden');
            const isPauseOpen = pauseScreen && !pauseScreen.classList.contains('hidden');
            const isUiOpen = this.game.ui && this.game.ui.isOpen;

            if (!isStartOpen && !isPauseOpen && !isUiOpen) {
                this.game.input.requestPointerLock();
            }
        }
    }

    scheduleFade() {
        if (this.fadeTimeout) clearTimeout(this.fadeTimeout);
        this.fadeTimeout = setTimeout(() => {
            if (this.isOpen) return;
            const msgItems = this.messagesEl.querySelectorAll('.chat-message');
            msgItems.forEach(el => el.style.opacity = '0');
        }, 8000);
    }

    scrollToBottom() {
        if (this.messagesEl) {
            this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        }
    }

    addMessage(text, color = '#ffffff') {
        if (!this.messagesEl) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.style.color = color;
        msgDiv.textContent = text;
        msgDiv.style.opacity = '1';

        this.messagesEl.appendChild(msgDiv);
        this.messages.push({ text, color, timestamp: Date.now() });

        // Keep maximum 100 messages in DOM
        while (this.messagesEl.children.length > 100) {
            this.messagesEl.removeChild(this.messagesEl.firstChild);
        }

        this.scrollToBottom();

        // If chat is currently closed, schedule fade
        if (!this.isOpen) {
            this.scheduleFade();
        }
    }

    submit() {
        const raw = this.inputEl.value;
        const text = raw.trim();

        if (!text) {
            this.close(true);
            return;
        }

        // Add to history
        if (this.history.length === 0 || this.history[this.history.length - 1] !== text) {
            this.history.push(text);
            if (this.history.length > 50) this.history.shift();
        }

        if (text.startsWith('/')) {
            this.executeCommand(text);
        } else {
            // Regular chat message
            this.addMessage(`<Player> ${text}`, '#ffffff');
        }

        this.close(true);
    }

    navigateHistory(direction) {
        if (this.history.length === 0) return;

        if (this.historyIndex === -1) {
            this.currentDraft = this.inputEl.value;
            this.historyIndex = this.history.length;
        }

        this.historyIndex += direction;

        if (this.historyIndex < 0) {
            this.historyIndex = 0;
        } else if (this.historyIndex >= this.history.length) {
            this.historyIndex = -1;
            this.inputEl.value = this.currentDraft;
            this.updateAutocomplete();
            return;
        }

        this.inputEl.value = this.history[this.historyIndex];
        this.inputEl.selectionStart = this.inputEl.selectionEnd = this.inputEl.value.length;
        this.updateAutocomplete();
    }

    handleTabAutocomplete() {
        const val = this.inputEl.value;
        if (!val.startsWith('/')) return;

        const text = val.slice(1).trim();
        const tokens = text.split(/\s+/);
        if (tokens.length === 1) {
            const prefix = tokens[0].toLowerCase();
            const matches = this.commandsList.filter(c => c.startsWith(prefix));
            if (matches.length === 1) {
                this.inputEl.value = '/' + matches[0] + ' ';
                this.updateAutocomplete();
            } else if (matches.length > 1) {
                this.addMessage('Commands: ' + matches.join(', '), '#ffff55');
            }
        }
    }

    updateAutocomplete() {
        if (!this.autocompleteEl) return;
        const val = this.inputEl.value;

        if (!val.startsWith('/')) {
            this.autocompleteEl.classList.add('hidden');
            return;
        }

        const text = val.slice(1);
        const tokens = text.split(/\s+/);

        if (tokens.length <= 1) {
            const prefix = tokens[0].toLowerCase();
            const matches = this.commandsList.filter(c => c.startsWith(prefix));
            if (matches.length > 0 && prefix.length > 0) {
                this.autocompleteEl.textContent = matches.map(c => '/' + c).slice(0, 8).join('  ');
                this.autocompleteEl.classList.remove('hidden');
            } else if (prefix.length === 0) {
                this.autocompleteEl.textContent = 'Type a command: /tp, /find, /kill, /summon, /give, /time, /weather, /help';
                this.autocompleteEl.classList.remove('hidden');
            } else {
                this.autocompleteEl.classList.add('hidden');
            }
        } else {
            const cmd = tokens[0].toLowerCase();
            if (cmd === 'find' || cmd === 'locate') {
                this.autocompleteEl.textContent = 'Usage: /find <stronghold | village | igloo | witch_hut | biome <name> | spawn>';
                this.autocompleteEl.classList.remove('hidden');
            } else if (cmd === 'give') {
                this.autocompleteEl.textContent = 'Usage: /give <item> [count]';
                this.autocompleteEl.classList.remove('hidden');
            } else if (cmd === 'tp' || cmd === 'teleport') {
                this.autocompleteEl.textContent = 'Usage: /tp <x y z | ~ ~ ~ | mob_name>';
                this.autocompleteEl.classList.remove('hidden');
            } else if (cmd === 'summon') {
                this.autocompleteEl.textContent = 'Usage: /summon <zombie|skeleton|creeper|blaze|ender_dragon|...> [x y z]';
                this.autocompleteEl.classList.remove('hidden');
            } else if (cmd === 'gamemode') {
                this.autocompleteEl.textContent = 'Usage: /gamemode <creative|survival>';
                this.autocompleteEl.classList.remove('hidden');
            } else if (cmd === 'time') {
                this.autocompleteEl.textContent = 'Usage: /time set <day|noon|night|midnight|ticks>';
                this.autocompleteEl.classList.remove('hidden');
            } else if (cmd === 'weather') {
                this.autocompleteEl.textContent = 'Usage: /weather <clear|rain|thunder>';
                this.autocompleteEl.classList.remove('hidden');
            } else {
                this.autocompleteEl.classList.add('hidden');
            }
        }
    }

    // ============================================
    // Command Execution & Creative Verification
    // ============================================
    executeCommand(commandString) {
        const trimmed = commandString.slice(1).trim();
        if (!trimmed) return;

        const tokens = trimmed.split(/\s+/);
        const cmd = tokens[0].toLowerCase();
        const args = tokens.slice(1);

        // Strict Creative mode requirement for cheat/builder commands, but allow informational queries (/tps, /help, /seed) in all modes
        const isInfoCmd = (cmd === 'tps' || cmd === 'help' || cmd === 'seed');
        const isCreative = (this.game.player && this.game.player.isCreative) || (this.game.input && this.game.input.creativeMode);

        if (!isCreative && !isInfoCmd) {
            this.addMessage("Commands are only available in Creative mode! (Press 'C' to switch to Creative)", "#ff5555");
            return;
        }

        switch (cmd) {
            case 'tps':
                this.cmdTps();
                break;

            case 'tp':
            case 'teleport':
                this.cmdTp(args);
                break;

            case 'find':
            case 'locate':
                this.cmdFind(args);
                break;

            case 'kill':
                this.cmdKill(args);
                break;

            case 'summon':
            case 'spawnmob':
                this.cmdSummon(args);
                break;

            case 'spawn':
                this.cmdSpawn();
                break;

            case 'spawnpoint':
            case 'setspawn':
            case 'setworldspawn':
                this.cmdSpawnpoint(args);
                break;

            case 'give':
            case 'item':
                this.cmdGive(args);
                break;

            case 'gamemode':
            case 'gm':
                this.cmdGamemode(args);
                break;

            case 'time':
                this.cmdTime(args);
                break;

            case 'weather':
                this.cmdWeather(args);
                break;

            case 'clear':
                this.cmdClear();
                break;

            case 'heal':
                this.cmdHeal();
                break;

            case 'fly':
                this.cmdFly();
                break;

            case 'speed':
                this.cmdSpeed(args);
                break;

            case 'dimension':
            case 'dim':
                this.cmdDimension(args);
                break;

            case 'seed':
                this.cmdSeed();
                break;

            case 'help':
                this.cmdHelp(args);
                break;

            default:
                this.addMessage(`Unknown command: /${cmd}. Type '/help' for a list of commands.`, "#ff5555");
                break;
        }
    }

    // --------------------------------------------
    // /tp [target | x y z | ~ ~ ~]
    // --------------------------------------------
    cmdTp(args) {
        if (args.length === 0) {
            this.addMessage("Usage: /tp <x y z> or /tp <mob_name>", "#ff5555");
            return;
        }

        const p = this.game.player.position;

        // Check if argument is a mob name
        if (args.length === 1 && isNaN(Number(args[0])) && !args[0].startsWith('~')) {
            const query = args[0].toLowerCase().replace(/[\s\-]/g, '_');
            const mobs = this.game.entityManager ? this.game.entityManager.mobs : [];
            let targetMob = null;
            let minDist = Infinity;

            for (const mob of mobs) {
                const mobType = (mob.type || '').toLowerCase();
                if (mobType.includes(query) || (mob.name && mob.name.toLowerCase().includes(query))) {
                    const dist = mob.position.distanceTo(p);
                    if (dist < minDist) {
                        minDist = dist;
                        targetMob = mob;
                    }
                }
            }

            if (targetMob) {
                const targetY = targetMob.position.y + 1;
                this.teleportPlayer(targetMob.position.x, targetY, targetMob.position.z);
                this.addMessage(`Teleported to ${targetMob.type || 'Mob'} at ${targetMob.position.x.toFixed(1)}, ${targetY.toFixed(1)}, ${targetMob.position.z.toFixed(1)}`, "#55ff55");
                return;
            } else {
                this.addMessage(`No matching entity "${args[0]}" found in loaded world.`, "#ff5555");
                return;
            }
        }

        // Handle target prefix like /tp @s x y z or /tp player x y z
        let coordArgs = args;
        if (args.length >= 4 && (args[0] === '@s' || args[0].toLowerCase() === 'player')) {
            coordArgs = args.slice(1);
        }

        if (coordArgs.length < 3) {
            this.addMessage("Usage: /tp <x> <y> <z>", "#ff5555");
            return;
        }

        const parseCoord = (arg, current) => {
            if (arg.startsWith('~')) {
                const offset = parseFloat(arg.slice(1)) || 0;
                return current + offset;
            }
            return parseFloat(arg);
        };

        const targetX = parseCoord(coordArgs[0], p.x);
        const targetY = parseCoord(coordArgs[1], p.y);
        const targetZ = parseCoord(coordArgs[2], p.z);

        if (isNaN(targetX) || isNaN(targetY) || isNaN(targetZ)) {
            this.addMessage("Invalid coordinates. Usage: /tp <x> <y> <z>", "#ff5555");
            return;
        }

        this.teleportPlayer(targetX, targetY, targetZ);
        this.addMessage(`Teleported Player to ${targetX.toFixed(1)}, ${targetY.toFixed(1)}, ${targetZ.toFixed(1)}`, "#55ff55");
    }

    teleportPlayer(x, y, z) {
        this.game.player.position.set(x, y, z);
        this.game.player.velocity.set(0, 0, 0);
        this.game.player.fallDistance = 0;
        this.game.player.fallStartY = y;

        // Force chunk update around new location
        if (this.game.world && this.game.loadChunksAroundPlayer) {
            this.game.loadChunksAroundPlayer();
        }
    }

    // --------------------------------------------
    // /find or /locate [stronghold | biome <name> | spawn]
    // --------------------------------------------
    cmdFind(args) {
        if (args.length === 0) {
            this.addMessage("Usage: /find <stronghold | biome <name> | spawn>", "#ff5555");
            return;
        }

        const target = args[0].toLowerCase();
        const p = this.game.player.position;
        const seed = (this.game.planetParams && this.game.planetParams.seed) ? this.game.planetParams.seed : 12345;

        if (target === 'stronghold' || target === 'structure') {
            const sh = getClosestStrongholdPosition(p.x, p.z, seed);
            if (sh) {
                const dist = Math.round(Math.hypot(sh.x - p.x, sh.z - p.z));
                this.addMessage(`The nearest Stronghold is at [X: ${sh.x}, Y: ${sh.y}, Z: ${sh.z}] (~${dist} blocks away)`, "#55ff55");
                this.addMessage(`Type '/tp ${sh.x} 25 ${sh.z}' to teleport there directly.`, "#aaaaaa");
            } else {
                this.addMessage("No stronghold found in this dimension.", "#ff5555");
            }
            return;
        }

        if (target === 'village' || target === 'villages') {
            const v = getClosestVillagePosition(p.x, p.z, seed);
            if (v) {
                const dist = Math.round(Math.hypot(v.x - p.x, v.z - p.z));
                const vy = v.y || 64;
                this.addMessage(`The nearest Village is at [X: ${v.x}, Y: ${vy}, Z: ${v.z}] (~${dist} blocks away)`, "#55ff55");
                this.addMessage(`Type '/tp ${v.x} ${vy + 2} ${v.z}' to teleport there directly.`, "#aaaaaa");
            } else {
                this.addMessage("No village found in this dimension.", "#ff5555");
            }
            return;
        }

        if (target === 'igloo') {
            const ig = getClosestIglooPosition(p.x, p.z, seed);
            if (ig) {
                const dist = Math.round(Math.hypot(ig.x - p.x, ig.z - p.z));
                this.addMessage(`The nearest Igloo is at [X: ${ig.x}, Y: ${ig.y}, Z: ${ig.z}] (~${dist} blocks away)`, "#55ff55");
                this.addMessage(`Type '/tp ${ig.x} ${ig.y + 1} ${ig.z}' to teleport there directly.`, "#aaaaaa");
            } else {
                this.addMessage("No igloo found nearby.", "#ff5555");
            }
            return;
        }

        if (target === 'witch_hut' || target === 'witchhut' || target === 'hut' || target === 'swamphut') {
            const wh = getClosestWitchHutPosition(p.x, p.z, seed);
            if (wh) {
                const dist = Math.round(Math.hypot(wh.x - p.x, wh.z - p.z));
                this.addMessage(`The nearest Witch Hut is at [X: ${wh.x}, Y: ${wh.y}, Z: ${wh.z}] (~${dist} blocks away)`, "#55ff55");
                this.addMessage(`Type '/tp ${wh.x} ${wh.y + 3} ${wh.z}' to teleport there directly.`, "#aaaaaa");
            } else {
                this.addMessage("No witch hut found nearby.", "#ff5555");
            }
            return;
        }

        if (target === 'spawn') {
            const sp = this.game.player.spawnPoint || { x: 0, y: 64, z: 0 };
            const dist = Math.round(Math.hypot(sp.x - p.x, sp.z - p.z));
            this.addMessage(`World spawn is at [X: ${Math.round(sp.x)}, Y: ${Math.round(sp.y)}, Z: ${Math.round(sp.z)}] (~${dist} blocks away)`, "#55ff55");
            return;
        }

        // Biome search
        let biomeTarget = target;
        if (target === 'biome' && args.length > 1) {
            biomeTarget = args.slice(1).join('_').toLowerCase();
        }

        // Check if matches any biome
        const px = Math.floor(p.x);
        const pz = Math.floor(p.z);
        const curBiomeInfo = getBiomeParams(px, pz, this.game.planetParams);
        const curName = (curBiomeInfo && curBiomeInfo.biome && curBiomeInfo.biome.name) ? curBiomeInfo.biome.name.toLowerCase() : '';

        if (curName.includes(biomeTarget)) {
            this.addMessage(`You are already inside biome: ${curBiomeInfo.biome.name}!`, "#55ff55");
            return;
        }

        // Search outward in rings
        let found = null;
        for (let r = 32; r <= 3200; r += 48) {
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                const sx = Math.floor(px + Math.cos(angle) * r);
                const sz = Math.floor(pz + Math.sin(angle) * r);
                const bInfo = getBiomeParams(sx, sz, this.game.planetParams);
                if (bInfo && bInfo.biome) {
                    const bName = (bInfo.biome.name || '').toLowerCase();
                    if (bName.includes(biomeTarget) || biomeTarget.includes(bName)) {
                        found = { x: sx, z: sz, name: bInfo.biome.name, dist: r };
                        break;
                    }
                }
            }
            if (found) break;
        }

        if (found) {
            this.addMessage(`The nearest ${found.name} is at [X: ${found.x}, Z: ${found.z}] (~${found.dist} blocks away)`, "#55ff55");
            this.addMessage(`Type '/tp ${found.x} ~ ${found.z}' to teleport there.`, "#aaaaaa");
        } else {
            this.addMessage(`Biome matching "${biomeTarget}" not found within 3,200 blocks.`, "#ff5555");
        }
    }

    // --------------------------------------------
    // /kill [@s | @e | player | mob_name]
    // --------------------------------------------
    cmdKill(args) {
        const target = (args[0] || '@s').toLowerCase();

        if (target === '@s' || target === 'player' || target === 'self') {
            this.game.player.spawnGraceTimer = 0;
            this.game.player.health = 0;
            this.addMessage("Killed Player", "#ffffff");
            return;
        }

        if (!this.game.entityManager) {
            this.addMessage("No entities active.", "#ff5555");
            return;
        }

        if (target === '@e' || target === 'all' || target === 'mobs') {
            const count = this.game.entityManager.mobs.length;
            for (const mob of this.game.entityManager.mobs) {
                if (mob.getMesh()) this.game.engine.scene.remove(mob.getMesh());
            }
            this.game.entityManager.mobs = [];
            this.addMessage(`Killed ${count} entities`, "#ffffff");
            return;
        }

        // Kill specific mob type
        const query = target.replace(/[\s\-]/g, '_');
        const remaining = [];
        let count = 0;

        for (const mob of this.game.entityManager.mobs) {
            const mType = (mob.type || '').toLowerCase();
            const mName = (mob.name || '').toLowerCase();
            if (mType.includes(query) || mName.includes(query)) {
                if (mob.getMesh()) this.game.engine.scene.remove(mob.getMesh());
                count++;
                if (mob.type === 'ENDER_DRAGON' && this.game.entityManager.onDragonDefeated) {
                    this.game.entityManager.onDragonDefeated(mob.position);
                }
            } else {
                remaining.push(mob);
            }
        }

        this.game.entityManager.mobs = remaining;
        this.addMessage(`Killed ${count} ${target}(s)`, "#ffffff");
    }

    // --------------------------------------------
    // /summon <mob_type> [x y z]
    // --------------------------------------------
    cmdSummon(args) {
        if (args.length === 0) {
            const types = Object.keys(MOB_TYPES).map(k => k.toLowerCase()).slice(0, 10).join(', ');
            this.addMessage(`Usage: /summon <mob_type> [x y z]. Types: ${types}...`, "#ff5555");
            return;
        }

        const rawType = args[0].toUpperCase().replace(/[\s\-]/g, '_');
        let mobKey = null;

        // Exact match or partial match in MOB_TYPES
        if (MOB_TYPES[rawType]) {
            mobKey = rawType;
        } else {
            for (const k of Object.keys(MOB_TYPES)) {
                if (k.toLowerCase() === rawType.toLowerCase() || k.replace(/_/g, '') === rawType.replace(/_/g, '')) {
                    mobKey = k;
                    break;
                }
            }
        }

        if (!mobKey) {
            this.addMessage(`Unknown mob type "${args[0]}". Examples: zombie, creeper, enderman, blaze, ender_dragon, cow, sheep`, "#ff5555");
            return;
        }

        let spawnPos;
        const p = this.game.player.position;

        if (args.length >= 4) {
            const parseCoord = (arg, cur) => arg.startsWith('~') ? (cur + (parseFloat(arg.slice(1)) || 0)) : parseFloat(arg);
            const x = parseCoord(args[1], p.x);
            const y = parseCoord(args[2], p.y);
            const z = parseCoord(args[3], p.z);
            spawnPos = new THREE.Vector3(x, y, z);
        } else {
            // Spawn 2.5 blocks in front of Steve
            const look = this.game.player.getLookDirection();
            spawnPos = new THREE.Vector3(p.x + look.x * 2.5, p.y + 0.5, p.z + look.z * 2.5);
        }

        const mob = new Mob(mobKey, spawnPos);
        this.game.entityManager.addMob(mob);

        if (this.game.particles) {
            this.game.particles.emit(spawnPos, 'smoke', 15, 0xcccccc);
        }
        if (this.game.audio && this.game.audio.playPop) {
            this.game.audio.playPop();
        }

        this.addMessage(`Summoned new ${MOB_TYPES[mobKey].name || mobKey} at [${spawnPos.x.toFixed(1)}, ${spawnPos.y.toFixed(1)}, ${spawnPos.z.toFixed(1)}]`, "#55ff55");
    }

    // --------------------------------------------
    // /spawn
    // --------------------------------------------
    cmdSpawn() {
        const sp = (this.game.resolveSafeOverworldSpawn && this.game.currentDimension === 'overworld') 
            ? this.game.resolveSafeOverworldSpawn() 
            : (this.game.player.spawnPoint || { x: 0.5, y: 64, z: 0.5 });
        this.teleportPlayer(sp.x, sp.y, sp.z);
        this.addMessage(`Teleported to spawn [X: ${Math.round(sp.x)}, Y: ${Math.round(sp.y)}, Z: ${Math.round(sp.z)}]`, "#55ff55");
    }

    // --------------------------------------------
    // /spawnpoint [x y z]
    // --------------------------------------------
    cmdSpawnpoint(args) {
        let x = this.game.player.position.x;
        let y = this.game.player.position.y;
        let z = this.game.player.position.z;

        if (args.length >= 3) {
            const px = parseFloat(args[0]);
            const py = parseFloat(args[1]);
            const pz = parseFloat(args[2]);
            if (!isNaN(px) && !isNaN(py) && !isNaN(pz)) {
                x = px; y = py; z = pz;
            }
        }

        this.game.player.spawnPoint = { x, y, z, isBed: false, dimension: this.game.currentDimension || 'overworld' };
        this.addMessage(`Set spawn point to [X: ${x.toFixed(1)}, Y: ${y.toFixed(1)}, Z: ${z.toFixed(1)}]`, "#55ff55");
        if (this.game.audio && this.game.audio.playPop) this.game.audio.playPop();
    }

    // --------------------------------------------
    // /give <item> [count]
    // --------------------------------------------
    cmdGive(args) {
        if (args.length === 0) {
            this.addMessage("Usage: /give <item> [count]", "#ff5555");
            return;
        }

        // Support /give @s <item> [count]
        let itemArg = args[0];
        let countArg = args[1];
        if (args.length >= 2 && (args[0] === '@s' || args[0].toLowerCase() === 'player')) {
            itemArg = args[1];
            countArg = args[2];
        }

        const itemObj = this.resolveItem(itemArg);
        if (!itemObj) {
            this.addMessage(`Unknown item: "${itemArg}". Try: diamond, diamond_sword, ender_pearl, eye_of_ender, blaze_rod, tnt, bread, etc.`, "#ff5555");
            return;
        }

        let count = 1;
        if (countArg !== undefined) {
            count = parseInt(countArg, 10);
            if (isNaN(count) || count <= 0) count = 1;
            if (count > 640) count = 640; // Clamped sanity check
        } else if (itemObj.stackable) {
            count = itemObj.maxStack || 64;
        }

        const added = this.game.player.inventory.addItem(itemObj, count);
        if (!added && this.game.entityManager) {
            // Drop overflow in front of player
            this.game.entityManager.spawnItem(itemObj, count, this.game.player.getEyePosition());
        }

        // Refresh UI hotbar
        if (this.game.ui) {
            if (this.game.ui.elements.mainHotbar) {
                this.game.ui.renderGrid(this.game.ui.elements.mainHotbar, this.game.player.inventory.slots.slice(0, 9), 0, this.game.player, 'inventory');
            }
            if (this.game.ui.elements.invHotbar) {
                this.game.ui.renderGrid(this.game.ui.elements.invHotbar, this.game.player.inventory.slots.slice(0, 9), 0, this.game.player, 'inventory');
            }
        }

        this.addMessage(`Gave ${count} [${itemObj.name}] to Player`, "#55ff55");
    }

    // --------------------------------------------
    // Item Resolution for /give
    // --------------------------------------------
    resolveItem(query) {
        if (!query) return null;
        const clean = query.trim().toLowerCase().replace(/[\s\-]/g, '_');

        // Common materials & items
        const itemMap = {
            'diamond': { type: 'material', subtype: 'diamond', name: 'Diamond', stackable: true, maxStack: 64 },
            'iron_ingot': { type: 'material', subtype: 'iron_ingot', name: 'Iron Ingot', stackable: true, maxStack: 64 },
            'iron': { type: 'material', subtype: 'iron_ingot', name: 'Iron Ingot', stackable: true, maxStack: 64 },
            'gold_ingot': { type: 'material', subtype: 'gold_ingot', name: 'Gold Ingot', stackable: true, maxStack: 64 },
            'gold': { type: 'material', subtype: 'gold_ingot', name: 'Gold Ingot', stackable: true, maxStack: 64 },
            'coal': { type: 'material', subtype: 'coal', name: 'Coal', stackable: true, maxStack: 64 },
            'emerald': { type: 'material', subtype: 'emerald', name: 'Emerald', stackable: true, maxStack: 64 },
            'netherite_ingot': { type: 'material', subtype: 'netherite_ingot', name: 'Netherite Ingot', stackable: true, maxStack: 64 },
            'netherite': { type: 'material', subtype: 'netherite_ingot', name: 'Netherite Ingot', stackable: true, maxStack: 64 },
            'ruby': { type: 'material', subtype: 'ruby', name: 'Ruby', stackable: true, maxStack: 64 },
            'sapphire': { type: 'material', subtype: 'sapphire', name: 'Sapphire', stackable: true, maxStack: 64 },
            'zanite_gemstone': { type: 'material', subtype: 'zanite_gemstone', name: 'Zanite Gemstone', stackable: true, maxStack: 64 },
            'zanite': { type: 'material', subtype: 'zanite_gemstone', name: 'Zanite Gemstone', stackable: true, maxStack: 64 },
            'stick': { type: 'material', subtype: 'stick', name: 'Stick', stackable: true, maxStack: 64 },
            'feather': { type: 'material', subtype: 'feather', name: 'Feather', stackable: true, maxStack: 64 },
            'string': { type: 'material', subtype: 'string', name: 'String', stackable: true, maxStack: 64 },
            'bone': { type: 'material', subtype: 'bone', name: 'Bone', stackable: true, maxStack: 64 },
            'bone_meal': { type: 'material', subtype: 'bone_meal', name: 'Bone Meal', stackable: true, maxStack: 64 },
            'gunpowder': { type: 'material', subtype: 'gunpowder', name: 'Gunpowder', stackable: true, maxStack: 64 },
            'leather': { type: 'material', subtype: 'leather', name: 'Leather', stackable: true, maxStack: 64 },
            'paper': { type: 'material', subtype: 'paper', name: 'Paper', stackable: true, maxStack: 64 },
            'book': { type: 'material', subtype: 'book', name: 'Book', stackable: true, maxStack: 64 },
            'clock': { type: 'material', subtype: 'clock', name: 'Clock', stackable: true, maxStack: 64 },
            'compass': { type: 'material', subtype: 'compass', name: 'Compass', stackable: true, maxStack: 64 },
            'ender_pearl': { type: 'material', subtype: 'ender_pearl', name: 'Ender Pearl', stackable: true, maxStack: 16 },
            'pearl': { type: 'material', subtype: 'ender_pearl', name: 'Ender Pearl', stackable: true, maxStack: 16 },
            'eye_of_ender': { type: 'material', subtype: 'eye_of_ender', name: 'Eye of Ender', stackable: true, maxStack: 64 },
            'ender_eye': { type: 'material', subtype: 'eye_of_ender', name: 'Eye of Ender', stackable: true, maxStack: 64 },
            'blaze_rod': { type: 'material', subtype: 'blaze_rod', name: 'Blaze Rod', stackable: true, maxStack: 64 },
            'blaze_powder': { type: 'material', subtype: 'blaze_powder', name: 'Blaze Powder', stackable: true, maxStack: 64 },
            'mana_crystal': { type: 'material', subtype: 'mana_crystal', name: 'Mana Crystal', stackable: true, maxStack: 64 },

            // Foods
            'apple': { type: 'food', subtype: 'apple', name: 'Apple', stackable: true, maxStack: 64, data: { heal: 15 } },
            'golden_apple': { type: 'food', subtype: 'golden_apple', name: 'Golden Apple', stackable: true, maxStack: 64, data: { heal: 40 } },
            'bread': { type: 'food', subtype: 'bread', name: 'Bread', stackable: true, maxStack: 64, data: { heal: 20 } },
            'cooked_beef': { type: 'food', subtype: 'cooked_beef', name: 'Steak', stackable: true, maxStack: 64, data: { heal: 30 } },
            'steak': { type: 'food', subtype: 'cooked_beef', name: 'Steak', stackable: true, maxStack: 64, data: { heal: 30 } },
            'raw_beef': { type: 'food', subtype: 'raw_beef', name: 'Raw Beef', stackable: true, maxStack: 64, data: { heal: 12 } },
            'cooked_porkchop': { type: 'food', subtype: 'cooked_porkchop', name: 'Cooked Porkchop', stackable: true, maxStack: 64, data: { heal: 30 } },
            'porkchop': { type: 'food', subtype: 'cooked_porkchop', name: 'Cooked Porkchop', stackable: true, maxStack: 64, data: { heal: 30 } },
            'raw_porkchop': { type: 'food', subtype: 'raw_porkchop', name: 'Raw Porkchop', stackable: true, maxStack: 64, data: { heal: 12 } },
            'cooked_chicken': { type: 'food', subtype: 'cooked_chicken', name: 'Cooked Chicken', stackable: true, maxStack: 64, data: { heal: 24 } },
            'raw_chicken': { type: 'food', subtype: 'raw_chicken', name: 'Raw Chicken', stackable: true, maxStack: 64, data: { heal: 8 } },
            'cooked_mutton': { type: 'food', subtype: 'cooked_mutton', name: 'Cooked Mutton', stackable: true, maxStack: 64, data: { heal: 25 } },
            'raw_mutton': { type: 'food', subtype: 'raw_mutton', name: 'Raw Mutton', stackable: true, maxStack: 64, data: { heal: 10 } },
            'cooked_fish': { type: 'food', subtype: 'cooked_fish', name: 'Cooked Fish', stackable: true, maxStack: 64, data: { heal: 25 } },
            'raw_fish': { type: 'food', subtype: 'raw_fish', name: 'Raw Fish', stackable: true, maxStack: 64, data: { heal: 10 } },
            'cookie': { type: 'food', subtype: 'cookie', name: 'Cookie', stackable: true, maxStack: 64, data: { heal: 10 } },
            'carrot': { type: 'food', subtype: 'carrot', name: 'Carrot', stackable: true, maxStack: 64, data: { heal: 15 } },
            'baked_potato': { type: 'food', subtype: 'baked_potato', name: 'Baked Potato', stackable: true, maxStack: 64, data: { heal: 20 } },
            'potato': { type: 'food', subtype: 'potato', name: 'Potato', stackable: true, maxStack: 64, data: { heal: 10 } },
            'sweet_berries': { type: 'food', subtype: 'sweet_berries', name: 'Sweet Berries', stackable: true, maxStack: 64, data: { heal: 10 } },
            'melon_slice': { type: 'food', subtype: 'melon_slice', name: 'Melon Slice', stackable: true, maxStack: 64, data: { heal: 10 } },

            // Equipment & Tools
            'bow': { type: 'equipment', subtype: 'bow', name: 'Bow', stackable: false, maxStack: 1 },
            'bucket': { type: 'equipment', subtype: 'bucket', name: 'Bucket', stackable: true, maxStack: 16 },
            'water_bucket': { type: 'equipment', subtype: 'water_bucket', name: 'Water Bucket', stackable: false, maxStack: 1 },
            'lava_bucket': { type: 'equipment', subtype: 'lava_bucket', name: 'Lava Bucket', stackable: false, maxStack: 1 },
            'flint_and_steel': { type: 'equipment', subtype: 'flint_and_steel', name: 'Flint and Steel', stackable: false, maxStack: 1 },
            'shears': { type: 'equipment', subtype: 'shears', name: 'Shears', stackable: false, maxStack: 1 },
        };

        // Tools (sword, pickaxe, axe, shovel)
        const tools = ['sword', 'pickaxe', 'axe', 'shovel'];
        const mats = ['diamond', 'netherite', 'iron', 'gold', 'stone', 'wood', 'ruby', 'sapphire', 'zanite', 'gravitite'];
        for (const m of mats) {
            for (const t of tools) {
                const sub = `${t}_${m}`;
                const name = `${m.charAt(0).toUpperCase() + m.slice(1)} ${t.charAt(0).toUpperCase() + t.slice(1)}`;
                itemMap[`${m}_${t}`] = { type: 'equipment', subtype: sub, name, stackable: false, maxStack: 1 };
                itemMap[`${t}_${m}`] = { type: 'equipment', subtype: sub, name, stackable: false, maxStack: 1 };
            }
        }

        // Armor (helmet, chestplate, leggings, boots)
        const armors = ['helmet', 'chestplate', 'leggings', 'boots'];
        const armorPrefix = { 'helmet': 'head', 'chestplate': 'chest', 'leggings': 'legs', 'boots': 'boots' };
        for (const m of mats) {
            for (const a of armors) {
                const sub = `${armorPrefix[a]}_${m}`;
                const name = `${m.charAt(0).toUpperCase() + m.slice(1)} ${a.charAt(0).toUpperCase() + a.slice(1)}`;
                itemMap[`${m}_${a}`] = { type: 'equipment', subtype: sub, name, stackable: false, maxStack: 1 };
                itemMap[`${sub}`] = { type: 'equipment', subtype: sub, name, stackable: false, maxStack: 1 };
            }
        }

        // Check spawn eggs
        if (clean.includes('spawn') || clean.endsWith('_egg')) {
            for (const mobKey of Object.keys(MOB_TYPES)) {
                const lowerMob = mobKey.toLowerCase();
                const readableMob = lowerMob.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                itemMap[`${lowerMob}_spawn_egg`] = { type: 'spawn_egg', subtype: lowerMob, name: `${readableMob} Spawn Egg`, stackable: true, maxStack: 64 };
                itemMap[`spawn_${lowerMob}`] = { type: 'spawn_egg', subtype: lowerMob, name: `${readableMob} Spawn Egg`, stackable: true, maxStack: 64 };
            }
        }

        // Check match in itemMap
        if (itemMap[clean]) {
            const proto = itemMap[clean];
            return new Item(proto.type, proto.subtype, proto.data || {}, proto.name);
        }

        // Check BLOCKS
        const blockDefs = (typeof BLOCKS !== 'undefined' && BLOCKS) ? BLOCKS : (window.BLOCKS || {});
        for (const [key, id] of Object.entries(blockDefs)) {
            const lKey = key.toLowerCase();
            if (lKey === clean || lKey === 'block_' + clean || lKey.replace(/_block$/, '') === clean) {
                return Item.blockItem(id, getBlockName(id));
            }
        }

        // Partial block match
        for (const [key, id] of Object.entries(blockDefs)) {
            const lKey = key.toLowerCase();
            if (lKey.includes(clean) || clean.includes(lKey)) {
                return Item.blockItem(id, getBlockName(id));
            }
        }

        return null;
    }

    // --------------------------------------------
    // /gamemode <creative|survival>
    // --------------------------------------------
    cmdGamemode(args) {
        if (args.length === 0) {
            const current = this.game.input.creativeMode ? 'Creative' : 'Survival';
            this.addMessage(`Current game mode is: ${current}. Usage: /gamemode <creative|survival>`, "#ff5555");
            return;
        }

        const mode = args[0].toLowerCase();
        if (mode === 'c' || mode === 'creative' || mode === '1') {
            this.game.input.creativeMode = true;
            this.game.player.isCreative = true;
            this.game.player.health = this.game.player.maxHealth;
            this.addMessage("Set game mode to Creative Mode", "#ffffff");
        } else if (mode === 's' || mode === 'survival' || mode === '0') {
            this.game.input.creativeMode = false;
            this.game.input._creativeFlying = false;
            this.game.player.isCreative = false;
            this.addMessage("Set game mode to Survival Mode", "#ffffff");
        } else {
            this.addMessage(`Unknown game mode: "${args[0]}". Options: creative, survival`, "#ff5555");
        }
    }

    // --------------------------------------------
    // /time set <day|noon|night|midnight|number>
    // --------------------------------------------
    cmdTime(args) {
        if (!this.game.lighting) {
            this.addMessage("Lighting system not ready.", "#ff5555");
            return;
        }

        if (args.length === 0 || args[0].toLowerCase() === 'query') {
            const ticks = Math.round(((this.game.lighting.timeOfDay - 0.25 + 1.0) % 1.0) * 24000);
            this.addMessage(`The time is ${ticks} ticks (timeOfDay: ${this.game.lighting.timeOfDay.toFixed(2)})`, "#55ff55");
            return;
        }

        let val = args[0].toLowerCase();
        if (val === 'set' && args.length > 1) {
            val = args[1].toLowerCase();
        }

        if (val === 'day' || val === 'morning') {
            this.game.lighting.timeOfDay = 0.3; // 1000 ticks
            this.addMessage("Set the time to 1000 (Day)", "#55ff55");
        } else if (val === 'noon' || val === 'midday') {
            this.game.lighting.timeOfDay = 0.5; // 6000 ticks
            this.addMessage("Set the time to 6000 (Noon)", "#55ff55");
        } else if (val === 'sunset' || val === 'dusk') {
            this.game.lighting.timeOfDay = 0.75; // 12000 ticks
            this.addMessage("Set the time to 12000 (Sunset)", "#55ff55");
        } else if (val === 'night') {
            this.game.lighting.timeOfDay = 0.85; // 14000 ticks
            this.addMessage("Set the time to 14000 (Night)", "#55ff55");
        } else if (val === 'midnight') {
            this.game.lighting.timeOfDay = 0.0; // 18000 ticks
            this.addMessage("Set the time to 18000 (Midnight)", "#55ff55");
        } else {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                if (num <= 1.0) {
                    this.game.lighting.timeOfDay = num % 1.0;
                } else {
                    // Minecraft ticks: 24,000 per day
                    this.game.lighting.timeOfDay = ((num / 24000) + 0.25) % 1.0;
                }
                this.addMessage(`Set the time to ${Math.round(num)}`, "#55ff55");
            } else {
                this.addMessage("Usage: /time set <day|noon|night|midnight|ticks>", "#ff5555");
            }
        }
    }

    // --------------------------------------------
    // /weather <clear|rain|thunder>
    // --------------------------------------------
    cmdWeather(args) {
        if (!this.game.lighting) {
            this.addMessage("Weather system not ready.", "#ff5555");
            return;
        }

        if (args.length === 0) {
            const current = this.game.lighting.weather || 'clear';
            this.addMessage(`Weather is currently: ${current}. Usage: /weather <clear|rain|thunder>`, "#55ff55");
            return;
        }

        const type = args[0].toLowerCase();
        if (type === 'clear' || type === 'sun') {
            this.game.lighting.weather = 'clear';
            this.addMessage("Set weather to clear", "#55ff55");
        } else if (type === 'rain' || type === 'snow') {
            this.game.lighting.weather = 'rain';
            this.addMessage("Set weather to rain", "#55ff55");
        } else if (type === 'thunder' || type === 'storm') {
            this.game.lighting.weather = 'thunder';
            this.addMessage("Set weather to thunder", "#55ff55");
        } else {
            this.addMessage(`Unknown weather "${args[0]}". Options: clear, rain, thunder`, "#ff5555");
        }
    }

    // --------------------------------------------
    // /clear
    // --------------------------------------------
    cmdClear() {
        this.game.player.inventory.slots.fill(null);
        if (this.game.ui) {
            if (this.game.ui.elements.mainHotbar) {
                this.game.ui.renderGrid(this.game.ui.elements.mainHotbar, this.game.player.inventory.slots.slice(0, 9), 0, this.game.player, 'inventory');
            }
            if (this.game.ui.elements.invHotbar) {
                this.game.ui.renderGrid(this.game.ui.elements.invHotbar, this.game.player.inventory.slots.slice(0, 9), 0, this.game.player, 'inventory');
            }
            if (this.game.ui.elements.mainGrid) {
                this.game.ui.renderGrid(this.game.ui.elements.mainGrid, this.game.player.inventory.slots.slice(9, 36), 9, this.game.player, 'inventory');
            }
        }
        this.addMessage("Cleared the inventory of Player", "#55ff55");
    }

    // --------------------------------------------
    // /heal
    // --------------------------------------------
    cmdHeal() {
        this.game.player.health = this.game.player.maxHealth || 100;
        this.game.player.mana = this.game.player.maxMana || 100;
        this.game.player.burnTimer = 0;
        this.game.player.burnTickTimer = 0;
        this.addMessage("Healed Player to full health", "#55ff55");
    }

    // --------------------------------------------
    // /fly
    // --------------------------------------------
    cmdFly() {
        this.game.input._creativeFlying = !this.game.input._creativeFlying;
        this.addMessage(`Creative flying: ${this.game.input._creativeFlying ? 'ON' : 'OFF'}`, "#55ff55");
    }

    // --------------------------------------------
    // /speed [multiplier]
    // --------------------------------------------
    cmdSpeed(args) {
        if (args.length === 0) {
            const cur = this.game.player.speedMultiplier || 1.0;
            this.addMessage(`Current speed multiplier: ${cur}x. Usage: /speed <number>`, "#55ff55");
            return;
        }

        const mult = parseFloat(args[0]);
        if (isNaN(mult) || mult <= 0 || mult > 20) {
            this.addMessage("Speed must be a number between 0.1 and 20.", "#ff5555");
            return;
        }

        this.game.player.speedMultiplier = mult;
        this.addMessage(`Player speed multiplier set to ${mult}x`, "#55ff55");
    }

    // --------------------------------------------
    // /dimension <overworld|nether|end|aether>
    // --------------------------------------------
    cmdDimension(args) {
        if (args.length === 0) {
            this.addMessage(`Current dimension: ${this.game.currentDimension || 'overworld'}. Usage: /dimension <overworld|nether|end|aether>`, "#55ff55");
            return;
        }

        const dim = args[0].toLowerCase();
        if (['overworld', 'nether', 'end', 'aether'].includes(dim)) {
            this.addMessage(`Warping to dimension: ${dim}...`, "#55ff55");
            this.game.warpToNewPlanet(dim);
        } else {
            this.addMessage(`Unknown dimension: "${args[0]}". Options: overworld, nether, end, aether`, "#ff5555");
        }
    }

    // --------------------------------------------
    // /seed
    // --------------------------------------------
    cmdSeed() {
        const seed = (this.game.planetParams && this.game.planetParams.seed) ? this.game.planetParams.seed : '-';
        this.addMessage(`World Seed: ${seed}`, "#55ffff");
    }

    // --------------------------------------------
    // /help [command]
    // --------------------------------------------
    cmdHelp(args) {
        if (args.length > 0) {
            const topic = args[0].toLowerCase();
            const helpMap = {
                'tp': "/tp <x y z> or /tp <mob_name>  -  Teleport to coordinates or to a nearby mob",
                'find': "/find <stronghold | igloo | witch_hut | biome <name> | spawn>  -  Locate structures, biomes, or world spawn",
                'locate': "/locate <stronghold | igloo | witch_hut | biome <name> | spawn>  -  Locate structures or biomes",
                'kill': "/kill [@s | @e | mob_name]  -  Kill player or mobs",
                'summon': "/summon <mob_type> [x y z]  -  Spawn any mob (zombie, creeper, enderman, blaze, ender_dragon, etc.)",
                'spawn': "/spawn  -  Teleport to the world spawn location",
                'spawnpoint': "/spawnpoint [x y z]  -  Set your respawn point at current location or coordinates",
                'give': "/give <item> [count]  -  Add items/blocks to inventory (diamond, sword, pearl, etc.)",
                'gamemode': "/gamemode <creative|survival>  -  Change game mode",
                'time': "/time set <day|noon|night|midnight|ticks>  -  Set time of day",
                'weather': "/weather <clear|rain|thunder>  -  Change weather",
                'clear': "/clear  -  Clear inventory slots",
                'heal': "/heal  -  Restore full health and mana",
                'fly': "/fly  -  Toggle creative flight",
                'speed': "/speed <multiplier>  -  Change movement speed",
                'dimension': "/dimension <overworld|nether|end|aether>  -  Travel to any dimension",
                'seed': "/seed  -  Display current world seed"
            };
            if (helpMap[topic]) {
                this.addMessage(helpMap[topic], "#55ff55");
                return;
            }
        }

        this.addMessage("=== Slopcraft 3D Commands (Creative Only) ===", "#ffff55");
        this.addMessage("/tp <x y z | mob>  -  Teleport to coordinates or mob", "#ffffff");
        this.addMessage("/find <stronghold | biome <name> | spawn>  -  Locate structures or biomes", "#ffffff");
        this.addMessage("/kill [@s | @e | mob]  -  Kill self or mobs", "#ffffff");
        this.addMessage("/summon <mob> [x y z]  -  Summon any mob into the world", "#ffffff");
        this.addMessage("/spawnpoint [x y z]  -  Set respawn point", "#ffffff");
        this.addMessage("/spawn  -  Teleport to world spawn", "#ffffff");
        this.addMessage("/give <item> [count]  -  Give any block or item", "#ffffff");
        this.addMessage("/gamemode <c|s>  -  Switch Creative / Survival", "#ffffff");
        this.addMessage("/time set <day|noon|night|midnight>  -  Change time of day", "#ffffff");
        this.addMessage("/weather <clear|rain|thunder>  -  Change weather", "#ffffff");
        this.addMessage("/heal  -  Restore full HP & mana", "#ffffff");
        this.addMessage("/clear  -  Clear player inventory", "#ffffff");
        this.addMessage("/dimension <overworld|nether|end|aether>  -  Warp dimensions", "#ffffff");
        this.addMessage("/tps  -  Display ticks per second and tick latency", "#ffffff");
    }

    // --------------------------------------------
    // /tps
    // --------------------------------------------
    cmdTps() {
        const tpsData = (this.game && typeof this.game.getTPS === 'function')
            ? this.game.getTPS()
            : { tps1s: 20.0, tps5s: 20.0, tps15s: 20.0, mspt: 16.6 };

        const colorVal = (val) => {
            return (typeof val === 'number') ? val.toFixed(1) : val;
        };

        const tpsColor = tpsData.tps1s >= 19.0 ? '#55ff55' : (tpsData.tps1s >= 15.0 ? '#ffff55' : '#ff5555');
        this.addMessage(`TPS from last 1s, 5s, 15s: ${colorVal(tpsData.tps1s)}, ${colorVal(tpsData.tps5s)}, ${colorVal(tpsData.tps15s)}`, tpsColor);
        this.addMessage(`Tick time: ${tpsData.mspt.toFixed(1)}ms (Target: 20.0 TPS, 50.0ms)`, '#aaaaaa');
    }
}

