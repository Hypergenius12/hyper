import { Item, Mob, MOB_TYPES } from './entities.js';

export class DevMode {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.container = document.getElementById('dev-mode-screen');
        
        // Stats elements
        this.fpsEl = document.getElementById('dev-fps');
        this.chunkTimeEl = document.getElementById('dev-chunk-time');
        this.chunksEl = document.getElementById('dev-chunks');
        this.entitiesEl = document.getElementById('dev-entities');
        this.particlesEl = document.getElementById('dev-particles');
        this.drawCallsEl = document.getElementById('dev-draw-calls');
        this.geometriesEl = document.getElementById('dev-geometries');
        this.texturesEl = document.getElementById('dev-textures');
        this.warningsEl = document.getElementById('dev-lag-warnings');
        
        // Console elements
        this.consoleLog = document.getElementById('dev-console-log');
        this.consoleInput = document.getElementById('dev-console-input');
        
        this.lastStatsUpdate = 0;
        this.recentChunkTimes = [];
        
        this.setupConsole();
    }

    setupConsole() {
        this.consoleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.consoleInput.value.trim();
                if (cmd) {
                    this.executeCommand(cmd);
                    this.consoleInput.value = '';
                }
            } else if (e.key === 'Escape') {
                this.consoleInput.blur();
                this.toggle();
            }
            e.stopPropagation(); // Prevent game from eating keystrokes
        });
        this.consoleInput.addEventListener('keyup', (e) => e.stopPropagation());
    }

    log(msg, color = '#00FF00') {
        const div = document.createElement('div');
        div.style.color = color;
        div.textContent = `> ${msg}`;
        this.consoleLog.appendChild(div);
        this.consoleLog.scrollTop = this.consoleLog.scrollHeight;
    }

    executeCommand(cmdStr) {
        this.log(cmdStr, '#FFFFFF');
        const args = cmdStr.split(' ');
        const cmd = args.shift().toLowerCase();
        
        try {
            switch(cmd) {
                case 'help':
                    this.log("Available Commands:");
                    this.log("  help - List commands");
                    this.log("  tp <x> <y> <z> - Teleport to coordinates");
                    this.log("  give <item> [count] - Give an item");
                    this.log("  settime <0-24000> - Set time of day");
                    this.log("  kill - Die instantly");
                    this.log("  heal - Restore health and mana");
                    this.log("  speed <multiplier> - Change movement speed");
                    this.log("  spawn <mob> - Spawn a mob");
                    this.log("  dim <nether|overworld|aether|caverns|highlands> - Switch dimension");
                    this.log("  clear - Clear console");
                    break;
                case 'clear':
                    this.consoleLog.innerHTML = '';
                    this.log("Dev Console Initialized. Type 'help' for commands.");
                    break;
                case 'tp':
                    if (args.length >= 3) {
                        const x = parseFloat(args[0]);
                        const y = parseFloat(args[1]);
                        const z = parseFloat(args[2]);
                        this.game.player.position.set(x, y, z);
                        this.game.player.velocity.set(0, 0, 0);
                        this.log(`Teleported to ${x}, ${y}, ${z}`);
                    } else {
                        this.log("Usage: tp <x> <y> <z>", "#FF5555");
                    }
                    break;
                case 'heal':
                    this.game.player.health = this.game.player.maxHealth;
                    this.game.player.mana = this.game.player.maxMana;
                    this.log("Fully healed.");
                    break;
                case 'kill':
                    this.game.player.takeDamage(9999);
                    this.log("Oof.");
                    break;
                case 'speed':
                    if (args.length >= 1) {
                        const mult = parseFloat(args[0]);
                        this.game.player.speedMultiplier = mult;
                        this.log(`Speed multiplier set to ${mult}`);
                    }
                    break;
                case 'settime':
                    if (args.length >= 1) {
                        const t = parseFloat(args[0]);
                        this.game.timeOfDay = t;
                        this.log(`Time set to ${t}`);
                    }
                    break;
                case 'dim':
                    if (args.length >= 1) {
                        const dim = args[0].toLowerCase();
                        if (['overworld', 'nether', 'aether', 'caverns', 'highlands'].includes(dim)) {
                            this.game.switchDimension(dim);
                            this.log(`Switching to ${dim}...`);
                        } else {
                            this.log(`Unknown dimension. Try nether, overworld, aether, caverns, highlands`, "#FF5555");
                        }
                    }
                    break;
                case 'give':
                    if (args.length >= 1) {
                        const itemName = args[0].toUpperCase();
                        const count = args.length > 1 ? parseInt(args[1]) || 1 : 1;
                        let itemObj = null;

                        // Check blocks
                        if (window.BLOCKS && window.BLOCKS[itemName]) {
                            itemObj = Item.blockItem(window.BLOCKS[itemName]);
                        } else {
                            // Assume material/item
                            itemObj = Item.materialItem(itemName, itemName.charAt(0) + itemName.slice(1).toLowerCase());
                        }
                        
                        if (itemObj) {
                            if (this.game.player.inventory.addItem(itemObj, count)) {
                                this.log(`Gave ${count}x ${itemName}`);
                            } else {
                                this.log(`Inventory full!`, "#FF5555");
                            }
                        } else {
                            this.log(`Unknown item: ${itemName}`, "#FF5555");
                        }
                    } else {
                        this.log("Usage: give <item> [count]", "#FF5555");
                    }
                    break;
                case 'spawn':
                    if (args.length >= 1) {
                        const mobType = args[0].toUpperCase();
                        if (MOB_TYPES[mobType]) {
                            const count = args.length > 1 ? parseInt(args[1]) || 1 : 1;
                            for (let i = 0; i < count; i++) {
                                const pos = this.game.player.position.clone();
                                pos.x += (Math.random() - 0.5) * 4;
                                pos.z += (Math.random() - 0.5) * 4;
                                pos.y += 1;
                                const mob = new Mob(mobType, pos);
                                this.game.entityManager.addMob(mob);
                            }
                            this.log(`Spawned ${count}x ${mobType}`);
                        } else {
                            this.log(`Unknown mob: ${mobType}. Try ZOMBIE, SKELETON, SLIME...`, "#FF5555");
                        }
                    } else {
                        this.log("Usage: spawn <mob> [count]", "#FF5555");
                    }
                    break;
                default:
                    this.log(`Unknown command: ${cmd}`, "#FF5555");
            }
        } catch (e) {
            this.log(`Error: ${e.message}`, "#FF0000");
        }
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.container.classList.remove('hidden');
            if (this.game.input && this.game.input.isPointerLocked()) {
                document.exitPointerLock();
            }
            // focus a tiny bit later to avoid capturing the 'u' keyup if needed
            setTimeout(() => this.consoleInput.focus(), 10);
        } else {
            this.container.classList.add('hidden');
            this.consoleInput.blur();
            if (this.game.input && !this.game.input.isPointerLocked() && !this.game.input.menuKeys.inventory) {
                this.game.input.requestPointerLock();
            }
        }
    }

    reportChunkGenTime(timeMs) {
        this.recentChunkTimes.push(timeMs);
        if (this.recentChunkTimes.length > 10) this.recentChunkTimes.shift();
    }

    update(dt) {
        if (!this.isOpen) return;

        const now = performance.now();
        if (now - this.lastStatsUpdate > 500) {
            this.lastStatsUpdate = now;
            
            // FPS
            this.fpsEl.textContent = Math.round(this.game.fps || 0);
            
            // Chunk time avg
            if (this.recentChunkTimes.length > 0) {
                const avg = this.recentChunkTimes.reduce((a, b) => a + b, 0) / this.recentChunkTimes.length;
                this.chunkTimeEl.textContent = avg.toFixed(1);
            }
            
            // Chunks active
            let chunks = 0;
            if (this.game.world && this.game.world.chunks) {
                chunks = this.game.world.chunks.size;
            }
            this.chunksEl.textContent = chunks;
            
            // Entities
            let entities = 0;
            if (this.game.entityManager) {
                entities = this.game.entityManager.mobs.length + this.game.entityManager.items.length;
            }
            this.entitiesEl.textContent = entities;
            
            // Particles
            let particles = 0;
            if (this.game.particles && this.game.particles.particles) {
                particles = this.game.particles.particles.length;
            }
            this.particlesEl.textContent = particles;
            
            // WebGL Stats
            if (this.game.engine && this.game.engine.renderer) {
                const info = this.game.engine.renderer.info;
                this.drawCallsEl.textContent = info.render.calls;
                this.geometriesEl.textContent = info.memory.geometries;
                this.texturesEl.textContent = info.memory.textures;
            }
            
            // Lag Diagnostics
            let warnings = [];
            if (this.game.fps < 30) warnings.push("LOW FPS: Check draw calls or physics updates.");
            if (chunks > 1000) warnings.push("HIGH CHUNK COUNT: Consider lowering render distance.");
            if (entities > 100) warnings.push("HIGH ENTITY COUNT: Many mobs/items active.");
            if (this.game.engine && this.game.engine.renderer && this.game.engine.renderer.info.render.calls > 2000) {
                warnings.push("HIGH DRAW CALLS: Check chunk meshing efficiency or transparent blocks.");
            }
            
            if (warnings.length > 0) {
                this.warningsEl.textContent = warnings.join('\n');
            } else {
                this.warningsEl.textContent = "All Systems Nominal.";
            }
        }
    }
}
