// ============================================
// systems.js — Lighting, Particles, Audio, UI
// ============================================
import * as THREE from 'three';
import { BLOCKS, generateItemTexture } from './textures.js';
import { Spell, SPELL_TYPES } from './magic.js';

export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        this.timeOfDay = 0.3; // start in morning
        this.dayLength = 600; // seconds

        this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x444455, 0.8);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xffffdd, 1.2);
        this.sunLight.castShadow = false; // Disabled for FPS
        this.scene.add(this.sunLight);

        // Sun Mesh
        const sunGeo = new THREE.SphereGeometry(3, 16, 16);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffdd });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(this.sunMesh);

        // Moon Light
        this.moonLight = new THREE.DirectionalLight(0xaaccff, 0.4);
        this.moonLight.castShadow = false; // Disabled for FPS
        this.scene.add(this.moonLight);

        // Moon Mesh
        const moonGeo = new THREE.SphereGeometry(2.5, 16, 16);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xccddff });
        this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
        this.scene.add(this.moonMesh);

        // SkyDome Shader
        const skyGeo = new THREE.SphereGeometry(400, 32, 15);
        this.skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide,
            fog: false
        });
        this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
        this.scene.add(this.skyDome);
    }
    
    _getLightState(time) {
        // 0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1.0 = midnight
        const states = [
            // Midnight - slightly brighter so you can see without torches
            { t: 0.0, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.6, hemi: 0.7 },
            { t: 0.2, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.6, hemi: 0.7 },
            // Sunrise - pink/orange horizon, light blue top
            { t: 0.25, amb: new THREE.Color(0x8a6b52), bg: new THREE.Color(0xffa65a), top: new THREE.Color(0x82a6ff), sun: 0.8, moon: 0.2, hemi: 0.8 },
            // Day - bright Minecraft blue, high ambient light for soft shadows
            { t: 0.3, amb: new THREE.Color(0xdddddd), bg: new THREE.Color(0xcceeff), top: new THREE.Color(0x88ccff), sun: 1.5, moon: 0.0, hemi: 1.2 },
            { t: 0.7, amb: new THREE.Color(0xdddddd), bg: new THREE.Color(0xcceeff), top: new THREE.Color(0x88ccff), sun: 1.5, moon: 0.0, hemi: 1.2 },
            // Sunset - orange/red horizon
            { t: 0.75, amb: new THREE.Color(0x8a5050), bg: new THREE.Color(0xff5a5a), top: new THREE.Color(0x5a82f2), sun: 0.8, moon: 0.2, hemi: 0.8 },
            // Night
            { t: 0.8, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.6, hemi: 0.7 },
            { t: 1.0, amb: new THREE.Color(0x666677), bg: new THREE.Color(0x181822), top: new THREE.Color(0x11111c), sun: 0.0, moon: 0.6, hemi: 0.7 }
        ];

        for (let i = 0; i < states.length - 1; i++) {
            if (time >= states[i].t && time <= states[i+1].t) {
                const fraction = (time - states[i].t) / (states[i+1].t - states[i].t);
                const amb = states[i].amb.clone().lerp(states[i+1].amb, fraction);
                const bg = states[i].bg.clone().lerp(states[i+1].bg, fraction);
                const top = states[i].top.clone().lerp(states[i+1].top, fraction);
                const sun = states[i].sun + (states[i+1].sun - states[i].sun) * fraction;
                const moon = (states[i].moon !== undefined) ? states[i].moon + (states[i+1].moon - states[i].moon) * fraction : 0.0;
                const hemi = states[i].hemi + (states[i+1].hemi - states[i].hemi) * fraction;
                return { amb, bg, top, sun, moon, hemi };
            }
        }
        return states[0]; // fallback
    }
    
    update(dt, cameraPos, isUnderwater = false, currentDimension = 'overworld') {
        this.timeOfDay += dt / this.dayLength;
        if (this.timeOfDay > 1) this.timeOfDay -= 1;

        const angle = (this.timeOfDay - 0.5) * Math.PI * 2;
        const moonAngle = angle + Math.PI;
        
        // Sun position
        const sunDist = 80;
        this.sunLight.position.set(
            cameraPos.x + Math.sin(angle) * sunDist,
            cameraPos.y + Math.cos(angle) * sunDist,
            cameraPos.z
        );
        this.sunLight.target.position.copy(cameraPos);
        this.sunLight.target.updateMatrixWorld();
        this.sunMesh.position.copy(this.sunLight.position);

        // Moon position
        this.moonLight.position.set(
            cameraPos.x + Math.sin(moonAngle) * sunDist,
            cameraPos.y + Math.cos(moonAngle) * sunDist,
            cameraPos.z
        );
        this.moonLight.target.position.copy(cameraPos);
        this.moonLight.target.updateMatrixWorld();
        this.moonMesh.position.copy(this.moonLight.position);

        this.skyDome.position.copy(cameraPos);

        let state;
        if (currentDimension === 'nether') {
            state = {
                amb: new THREE.Color(0x772222),
                bg: new THREE.Color(0x330000),
                top: new THREE.Color(0x993333),
                sun: 0,
                moon: 0,
                hemi: 1.0
            };
        } else if (currentDimension === 'aether') {
            state = {
                amb: new THREE.Color(0xaaffff),
                bg: new THREE.Color(0xddeeff),
                top: new THREE.Color(0xffffff),
                sun: 1.5,
                moon: 0,
                hemi: 1.0
            };
        } else if (currentDimension === 'caverns') {
            state = {
                amb: new THREE.Color(0x2a352a), // Brighter ambient
                bg: new THREE.Color(0x0a100a), // Slightly brighter fog/bg
                top: new THREE.Color(0x334433), // Brighter top
                sun: 0,
                moon: 0,
                hemi: 1.0 // Increased hemi light
            };
        } else if (currentDimension === 'highlands') {
            state = {
                amb: new THREE.Color(0xaaccee),
                bg: new THREE.Color(0x00ffff),
                top: new THREE.Color(0x00aaff),
                sun: 1.5,
                moon: 0,
                hemi: 1.2
            };
        } else {
            state = this._getLightState(this.timeOfDay);
        }

        this.sunLight.intensity = state.sun;
        this.moonLight.intensity = state.moon;

        this.hemiLight.color.copy(state.top);
        this.hemiLight.groundColor.copy(state.amb);
        this.hemiLight.intensity = state.hemi;
        
        this.scene.background = isUnderwater ? new THREE.Color(0x3377aa) : state.bg;
        if (this.scene.fog) {
            this.scene.fog.color.copy(this.scene.background);
            if (isUnderwater) {
                this.scene.fog.density = 0.05;
            } else if (currentDimension === 'aether') {
                this.scene.fog.density = 0.02; // Thicker fog in Aether to feel like clouds
            } else if (currentDimension === 'nether') {
                this.scene.fog.density = 0.015;
            } else if (currentDimension === 'highlands') {
                this.scene.fog.density = 0.005; // Light mist for scale
            } else {
                this.scene.fog.density = this.scene.fog.baseDensity || 0.003;
            }
        }
        
        // Update SkyDome gradient
        this.skyMat.uniforms.topColor.value.copy(state.top);
        this.skyMat.uniforms.bottomColor.value.copy(state.bg);
    }
}

export class TorchLightSystem {
    constructor(scene) {
        this.scene = scene;
        this.lights = new Map();
    }

    addTorch(x, y, z) {
        const key = `${x},${y},${z}`;
        if (this.lights.has(key)) return;
        
        // Brighter intensity, larger distance, less decay so the area is well lit
        const light = new THREE.PointLight(0xffcc55, 12.0, 40);
        light.decay = 1.2;
        light.position.set(x + 0.5, y + 0.5, z + 0.5);
        this.scene.add(light);
        this.lights.set(key, light);
    }

    removeTorch(x, y, z) {
        const key = `${x},${y},${z}`;
        const light = this.lights.get(key);
        if (light) {
            this.scene.remove(light);
            light.dispose();
            this.lights.delete(key);
        }
    }
}

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    }

    emit(pos, type, count = 10, color = 0xffffff) {
        for(let i=0; i<count; i++) {
            const mat = this.material.clone();
            mat.color.setHex(color);
            const mesh = new THREE.Mesh(this.geometry, mat);
            mesh.position.copy(pos);
            
            const vel = new THREE.Vector3(
                (Math.random()-0.5)*5,
                (Math.random()-0.5)*5 + 2,
                (Math.random()-0.5)*5
            );
            
            this.scene.add(mesh);
            this.particles.push({ mesh, vel, age: 0, maxAge: 0.5 + Math.random() });
        }
    }

    update(dt) {
        for(let i=this.particles.length-1; i>=0; i--) {
            const p = this.particles[i];
            p.age += dt;
            if(p.age >= p.maxAge) {
                this.scene.remove(p.mesh);
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            } else {
                p.mesh.position.addScaledVector(p.vel, dt);
                p.vel.y -= 9.8 * dt; // gravity
            }
        }
    }
}

class UISystem {
    constructor() {
        this.elements = {
            geometricUI: document.getElementById('geometric-ui'),
            mainGrid: document.getElementById('main-inventory-grid'),
            invHotbar: document.getElementById('inv-hotbar-grid'),
            mainHotbar: document.getElementById('main-hotbar-grid'),
            wandConfigPanel: document.getElementById('wand-config-panel'),
            wandSlotsGrid: document.getElementById('wand-slots-grid'),
            dragIcon: document.getElementById('drag-item-icon'),
            tooltip: document.getElementById('item-tooltip'),
            craftingGrid: document.getElementById('crafting-grid'),
            craftingOutput: document.getElementById('crafting-output'),
            craftingRecipeName: document.getElementById('crafting-recipe-name'),
            craftingPanel: document.getElementById('crafting-panel'),
            chestPanel: document.getElementById('chest-panel'),
            chestGrid: document.getElementById('chest-grid'),
            furnacePanel: document.getElementById('furnace-panel'),
            furnaceInput: document.getElementById('furnace-input'),
            furnaceFuel: document.getElementById('furnace-fuel'),
            furnaceOutput: document.getElementById('furnace-output'),
            furnaceProgress: document.getElementById('furnace-progress'),
            furnaceFire: document.getElementById('furnace-fire')
        };
        this.isOpen = false;
        this.chestPos = null;
        this.chestInventory = null;
        this.onChestClose = null;
        this.furnacePos = null;
        this.furnaceData = null;
        this.onFurnaceClose = null;
        this.atlas = null;
        
        // 9 crafting slots (3x3 grid)
        this.craftingSlots = new Array(9).fill(null);
        this.is3x3Crafting = false;

        this.dragState = {
            isDragging: false,
            sourceType: null, // 'inventory' | 'wand' | 'crafting' | 'crafting_output'
            sourceIndex: -1,
            itemData: null,
            offsetX: 0, offsetY: 0
        };

        this.currentPlayer = null;

        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));

        this._initCraftingGrid();
        this._initArmorSlots();
        this._initFurnaceSlots();

        const btnRecipeBook = document.getElementById('btn-recipe-book');
        const modalRecipeBook = document.getElementById('recipe-book-modal');
        const btnCloseRecipes = document.getElementById('btn-close-recipes');
        if (btnRecipeBook && modalRecipeBook && btnCloseRecipes) {
            btnRecipeBook.onclick = () => {
                modalRecipeBook.classList.remove('hidden');
                this.showRecipeBook();
            };
            btnCloseRecipes.onclick = () => modalRecipeBook.classList.add('hidden');
        }
    }

    toggle() {
        if (!this.isOpen && this.chestPos) {
            // Can't just toggle inventory if chest is open without closing chest
            this.toggleChest(null, null, null, null, null);
        }

        this.isOpen = !this.isOpen;
        this.is3x3Crafting = false; // normal inventory gets 2x2
        this._updateCraftingUILayout();
        
        if (this.isOpen) {
            this.elements.geometricUI.classList.remove('hidden');
        } else {
            this.elements.geometricUI.classList.add('hidden');
            this.elements.tooltip.classList.add('hidden');
            if (this.dragState.isDragging) this.cancelDrag();
            
            // Close chest if open
            if (this.chestPos) {
                if (this.onChestClose) this.onChestClose();
                this.chestPos = null;
                this.chestInventory = null;
                this.onChestClose = null;
                this.elements.chestPanel.classList.add('hidden');
            }
            // Close furnace if open
            if (this.furnacePos) {
                if (this.onFurnaceClose) this.onFurnaceClose();
                this.furnacePos = null;
                this.furnaceData = null;
                this.onFurnaceClose = null;
                this.elements.furnacePanel.classList.add('hidden');
            }
        }
    }

    toggleCraftingTable(onClose) {
        if (!this.isOpen) {
            this.toggle(); // Open UI
        }
        this.is3x3Crafting = true;
        this._updateCraftingUILayout();
        
        // Hide other panels if any
        this.elements.chestPanel.classList.add('hidden');
        this.elements.furnacePanel.classList.add('hidden');
        this.elements.wandConfigPanel.classList.add('hidden');
        this.elements.craftingPanel.classList.remove('hidden');
        
        // We can hook up an onClose if needed, but closing inventory resets it
    }

    toggleChest(x, y, z, inventory, onClose) {
        if (this.chestPos && this.chestPos.x === x && this.chestPos.y === y && this.chestPos.z === z) {
            this.toggle(); // Close it
            return;
        }

        if (!this.isOpen) {
            this.toggle(); // Open UI
        }

        this.chestPos = {x, y, z};
        this.chestInventory = inventory;
        this.onChestClose = onClose;
        this.elements.chestPanel.classList.remove('hidden');
    }

    toggleFurnace(x, y, z, data, onClose) {
        if (this.furnacePos && this.furnacePos.x === x && this.furnacePos.y === y && this.furnacePos.z === z) {
            this.toggle(); // Close it
            return;
        }

        if (!this.isOpen) {
            this.toggle();
        }

        this.furnacePos = {x, y, z};
        this.furnaceData = data;
        this.onFurnaceClose = onClose;
        this.elements.furnacePanel.classList.remove('hidden');
    }


    updateHUD(player, fps, atlas) {
        if (!player) return;
        this.currentPlayer = player;
        this.atlas = atlas;

        // Render Always-Visible Hotbar
        this.renderGrid(this.elements.mainHotbar, player.inventory.slots.slice(0, 9), 0, player, 'inventory');
        
        // If open, render full inventory
        if (this.isOpen) {
            this.renderGrid(this.elements.mainGrid, player.inventory.slots.slice(9, 36), 9, player, 'inventory');
            this.renderGrid(this.elements.invHotbar, player.inventory.slots.slice(0, 9), 0, player, 'inventory');
            
            // Render Wand Config if holding wand
            const activeSlot = player.inventory.slots[player.selectedSlot];
            if (activeSlot && activeSlot.item.type === 'wand') {
                this.elements.wandConfigPanel.classList.remove('hidden');
                this.renderWandConfig(activeSlot.item);
            } else {
                this.elements.wandConfigPanel.classList.add('hidden');
            }

            // Render crafting slots
            this._updateCraftingSlots();
            this._updateCraftingOutput();

            // Render armor slots
            this._updateArmorSlots();

            // Render chest if open
            if (this.chestPos && this.chestInventory) {
                this.renderGrid(this.elements.chestGrid, this.chestInventory, 0, player, 'chest');
            }

            // Render furnace if open
            if (this.furnacePos && this.furnaceData) {
                this._updateFurnaceSlots();
            }
        }
    }

    renderGrid(container, slotsData, offsetIndex, player, type, forceUpdate = false) {
        if (!container) return;
        if (container.children.length !== slotsData.length) {
            container.innerHTML = '';
            for (let i = 0; i < slotsData.length; i++) {
                const el = document.createElement('div');
                el.className = 'inv-slot';
                const actualIndex = offsetIndex + i;
                
                el.onmousedown = (e) => this.onSlotMouseDown(e, type, actualIndex);
                el.onmouseenter = (e) => this.onSlotEnter(e, type, actualIndex);
                el.onmouseleave = () => this.onSlotLeave();
                el.onmouseup = (e) => this.onSlotMouseUp(e, type, actualIndex);

                container.appendChild(el);
            }
        }

        for (let i = 0; i < slotsData.length; i++) {
            const el = container.children[i];
            const actualIndex = offsetIndex + i;
            const slot = slotsData[i];
            
            if (type === 'inventory' && actualIndex === player.selectedSlot) el.classList.add('active');
            else el.classList.remove('active');

            if (this.dragState.isDragging && this.dragState.sourceType === type && this.dragState.sourceIndex === actualIndex) {
                el.style.opacity = '0.3';
            } else {
                el.style.opacity = '1.0';
            }

            this.renderSlotItem(el, slot, forceUpdate);
        }
    }

    renderWandConfig(wandItem) {
        if (!wandItem || !wandItem.data || !wandItem.data.wand) return;
        const wand = wandItem.data.wand;
        
        // Build array of slots [{item: spell, count: 1}] to reuse renderGrid
        const slotsData = wand.spellSlots.map(obj => {
            if (!obj) return null;
            let wrapped = obj;
            if (wrapped.type !== 'spell' && wrapped.type !== 'modifier') {
                const itemType = wrapped.rarity ? 'modifier' : 'spell';
                wrapped = { type: itemType, subtype: wrapped.type, name: wrapped.name, stackable: false, id: wrapped.id, data: { spell: wrapped, mod: wrapped } };
            }
            return { item: wrapped, count: 1 };
        });
        this.renderGrid(this.elements.wandSlotsGrid, slotsData, 0, this.currentPlayer, 'wand');
    }

    renderSlotItem(el, slot, forceUpdate) {
        const cacheKey = slot ? `${slot.item.id}_${slot.count}` : 'empty';
        if (!forceUpdate && el._cacheKey === cacheKey) return;
        el._cacheKey = cacheKey;
        if (slot && slot.item) {
            let inner = '';
            if (slot.item.type === 'block' && this.atlas) {
                // Use the 3D isometric icon canvas
                const iconCanvas = this.atlas.getBlockIcon(slot.item.subtype);
                const dataURL = iconCanvas.toDataURL();
                inner = `<img src="${dataURL}" class="item-icon" draggable="false" />`;
            } else if (slot.item.type === 'wand') {
                const cvs = generateItemTexture('wand', slot.item.subtype || 'wand_basic');
                inner = `<img src="${cvs.toDataURL()}" class="item-icon" draggable="false" style="image-rendering: pixelated; width: 100%; height: 100%;" />`;
            } else if (slot.item.type === 'spell') {
                const cvs = generateItemTexture('spell', slot.item.data.spell.element || 'spell_basic');
                inner = `<img src="${cvs.toDataURL()}" class="item-icon" draggable="false" style="image-rendering: pixelated; width: 100%; height: 100%;" />`;
            } else if (slot.item.type === 'material') {
                const cvs = generateItemTexture('material', slot.item.subtype);
                inner = `<img src="${cvs.toDataURL()}" class="item-icon" draggable="false" style="image-rendering: pixelated; width: 100%; height: 100%;" />`;
            } else if (slot.item.type === 'equipment') {
                const cvs = generateItemTexture('equipment', slot.item.subtype);
                inner = `<img src="${cvs.toDataURL()}" class="item-icon" draggable="false" style="image-rendering: pixelated; width: 100%; height: 100%;" />`;
            } else if (slot.item.type === 'modifier') {
                const cvs = generateItemTexture('modifier', slot.item.subtype);
                inner = `<img src="${cvs.toDataURL()}" class="item-icon" draggable="false" style="image-rendering: pixelated; width: 100%; height: 100%;" />`;
            } else if (slot.item.type === 'food') {
                const cvs = generateItemTexture('food', slot.item.subtype);
                inner = `<img src="${cvs.toDataURL()}" class="item-icon" draggable="false" style="image-rendering: pixelated; width: 100%; height: 100%;" />`;
            } else {
                inner = `<div style="text-align:center; line-height:100%;">${slot.item.name.substring(0,2).toUpperCase()}</div>`;
            }
            if (slot.count > 1) inner += `<span class="item-count">${slot.count}</span>`;
            el.innerHTML = inner;
        } else {
            el.innerHTML = '';
        }
    }

    // --- Drag & Drop ---
    onSlotMouseDown(e, type, index) {
        if (!this.isOpen || (e.button !== 0 && e.button !== 2)) return;
        let slot = null;
        if (type === 'inventory') slot = this.currentPlayer.inventory.slots[index];
        else if (type === 'crafting') slot = this.craftingSlots[index];
        else if (type === 'chest') slot = this.chestInventory[index];
        else if (type === 'crafting_output') {
            const result = this._matchRecipe();
            if (result) {
                // Prevent partial stack dupe by checking if we have space first
                const inv = this.currentPlayer.inventory;
                let space = 0;
                if (result.item.stackable) {
                    for (const s of inv.slots) {
                        if (!s) space += result.item.maxStack;
                        else if (s.item.type === result.item.type && s.item.subtype === result.item.subtype) {
                            space += (s.item.maxStack - s.count);
                        }
                    }
                } else {
                    space = inv.slots.filter(s => !s).length;
                }
                
                if (space >= result.count) {
                    this._consumeCraftingSlots();
                    inv.addItem(result.item, result.count);
                    this._updateCraftingSlots();
                    this._updateCraftingOutput();
                }
            }
            return;
        } else if (type === 'armor') {
            slot = this.currentPlayer.inventory.armor[index];
        } else if (type === 'wand') {
            const w = this.currentPlayer.inventory.slots[this.currentPlayer.selectedSlot];
            if (w && w.item.type === 'wand') {
                const obj = w.item.data.wand.spellSlots[index];
                if (obj) {
                    let wrapped = obj;
                    if (wrapped.type !== 'spell' && wrapped.type !== 'modifier') {
                        const itemType = wrapped.rarity ? 'modifier' : 'spell';
                        wrapped = { type: itemType, subtype: wrapped.type, name: wrapped.name, stackable: false, id: wrapped.id, data: { spell: wrapped, mod: wrapped } };
                    }
                    slot = { item: wrapped, count: 1 };
                }
            }
        } else if (type === 'furnace') {
            if (index === 0) slot = this.furnaceData.input;
            else if (index === 1) slot = this.furnaceData.fuel;
            else if (index === 2) {
                slot = this.furnaceData.output; // Can pick up output
            }
        }
        
        if (slot) {
            this.dragState.isDragging = true;
            this.dragState.sourceType = type;
            this.dragState.sourceIndex = index;

            if ((e.button === 2 || e.shiftKey) && slot.item.stackable && slot.count > 1) {
                let dragCount = 1;
                if (!e.shiftKey && e.button === 2) {
                    dragCount = Math.floor(slot.count / 2);
                }
                slot.count -= dragCount;
                this.dragState.itemData = { item: slot.item, count: dragCount };
                this.dragState.isSplit = true;
            } else {
                this.dragState.itemData = slot;
                this.dragState.isSplit = false;
                // If not split, temporarily clear the source slot so it doesn't render while dragging
                if (type === 'inventory') this.currentPlayer.inventory.slots[index] = null;
                else if (type === 'crafting') this.craftingSlots[index] = null;
                else if (type === 'chest') this.chestInventory[index] = null;
                else if (type === 'armor') this.currentPlayer.inventory.armor[index] = null;
                else if (type === 'wand') {
                    const w = this.currentPlayer.inventory.slots[this.currentPlayer.selectedSlot];
                    w.item.data.wand.spellSlots[index] = null;
                }
                else if (type === 'furnace') {
                    if (index === 0) this.furnaceData.input = null;
                    else if (index === 1) this.furnaceData.fuel = null;
                    else if (index === 2) this.furnaceData.output = null;
                }
            }
            
            this._updateInventory();
            this._updateCraftingSlots();
            this._updateArmorSlots();
            this._updateFurnaceSlots();
            
            if (type === 'wand') {
                if (window.game && window.game.heldItemMesh) {
                    window.game.viewModel.remove(window.game.heldItemMesh);
                    window.game.heldItemMesh = null;
                }
            }
            
            const el = e.currentTarget;
            const rect = el.getBoundingClientRect();
            this.dragState.offsetX = e.clientX - rect.left - rect.width/2;
            this.dragState.offsetY = e.clientY - rect.top - rect.height/2;
            
            this.elements.dragIcon.classList.remove('hidden');
            this.renderSlotItem(this.elements.dragIcon, this.dragState.itemData);
            this.updateDragIconPos(e.clientX, e.clientY);
            this.elements.tooltip.classList.add('hidden');
        }
    }

    onMouseMove(e) {
        if (this.dragState.isDragging) {
            this.updateDragIconPos(e.clientX, e.clientY);
        } else if (this.isOpen && !this.elements.tooltip.classList.contains('hidden')) {
            this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
            this.elements.tooltip.style.top = (e.clientY + 15) + 'px';
        }
    }

    updateDragIconPos(x, y) {
        this.elements.dragIcon.style.left = (x - this.dragState.offsetX) + 'px';
        this.elements.dragIcon.style.top = (y - this.dragState.offsetY) + 'px';
    }

    onMouseUp(e) {
        if (this.dragState.isDragging) {
            // Handled mostly by onSlotMouseUp if dropped on a slot.
            // If dropped outside, cancel drag (or throw item).
            // Small timeout allows onSlotMouseUp to fire first if over a slot.
            setTimeout(() => {
                if (this.dragState.isDragging) this.cancelDrag();
            }, 10);
        }
    }

    cancelDrag() {
        if (this.dragState.isDragging && this.dragState.itemData) {
            // Return item to source
            const srcType = this.dragState.sourceType;
            const srcIndex = this.dragState.sourceIndex;
            const itemData = this.dragState.itemData;
            
            if (srcType === 'inventory') {
                if (this.dragState.isSplit) {
                    this.currentPlayer.inventory.slots[srcIndex].count += itemData.count;
                } else {
                    this.currentPlayer.inventory.slots[srcIndex] = itemData;
                }
            } else if (srcType === 'crafting') {
                if (this.dragState.isSplit) {
                    this.craftingSlots[srcIndex].count += itemData.count;
                } else {
                    this.craftingSlots[srcIndex] = itemData;
                }
            } else if (srcType === 'armor') {
                this.currentPlayer.inventory.armor[srcIndex] = itemData;
            } else if (srcType === 'chest' && this.chestInventory) {
                if (this.dragState.isSplit) {
                    this.chestInventory[srcIndex].count += itemData.count;
                } else {
                    this.chestInventory[srcIndex] = itemData;
                }
            } else if (srcType === 'furnace' && this.furnaceData) {
                const mapKey = ['input', 'fuel', 'output'][srcIndex];
                if (this.dragState.isSplit) {
                    this.furnaceData[mapKey].count += itemData.count;
                } else {
                    this.furnaceData[mapKey] = itemData;
                }
            }
            this._updateInventory();
            this._updateCraftingSlots();
            this._updateArmorSlots();
            this._updateFurnaceSlots();
            // Since there's no _updateChest, we rely on the main loop's updateHUD for chest redraw
        }
        this.dragState.isDragging = false;
        this.elements.dragIcon.classList.add('hidden');
        this.dragState.itemData = null;
        this.dragState.isSplit = false;
    }

    onSlotMouseUp(e, targetType, targetIndex) {
        if (!this.dragState.isDragging) return;
        
        const srcType = this.dragState.sourceType;
        const srcIndex = this.dragState.sourceIndex;
        const itemData = this.dragState.itemData;
        
        // Prevent dropping onto self
        if (srcType === targetType && srcIndex === targetIndex) {
            this.cancelDrag();
            return;
        }

        const inv = this.currentPlayer.inventory.slots;
        let wand = null;
        if (targetType === 'wand' || srcType === 'wand') {
            const wSlot = inv[this.currentPlayer.selectedSlot];
            if (wSlot && wSlot.item.type === 'wand') wand = wSlot.item.data.wand;
        }

        // --- Execute Move/Swap ---
        if (srcType === 'inventory' && targetType === 'armor') {
            // Equip from inventory to armor
            const targetArmor = this.currentPlayer.inventory.armor[targetIndex];
            this.currentPlayer.inventory.armor[targetIndex] = itemData;
            inv[srcIndex] = targetArmor; // swap back
        } else if (srcType === 'armor' && targetType === 'inventory') {
            // Unequip armor to inventory
            const targetSlot = inv[targetIndex];
            inv[targetIndex] = this.currentPlayer.inventory.armor[srcIndex];
            this.currentPlayer.inventory.armor[srcIndex] = targetSlot;
        } else if (srcType === 'armor' && targetType === 'armor') {
            const temp = this.currentPlayer.inventory.armor[targetIndex];
            this.currentPlayer.inventory.armor[targetIndex] = this.currentPlayer.inventory.armor[srcIndex];
            this.currentPlayer.inventory.armor[srcIndex] = temp;
        }

        const standardTypes = ['inventory', 'crafting', 'chest', 'furnace', 'wand'];
        if (standardTypes.includes(srcType) && standardTypes.includes(targetType)) {
            if ((targetType === 'furnace' && targetIndex === 2) || targetType === 'crafting_output') {
                // Cannot drop into output slots
                this.cancelDrag();
                return;
            }

            const getListSlot = (lType, idx) => {
                if (lType === 'inventory') return inv[idx];
                if (lType === 'crafting') return this.craftingSlots[idx];
                if (lType === 'chest') return this.chestInventory[idx];
                if (lType === 'furnace') {
                    if (!this.furnaceData) return null;
                    return idx === 0 ? this.furnaceData.input : (idx === 1 ? this.furnaceData.fuel : this.furnaceData.output);
                }
                if (lType === 'wand') {
                    const w = inv[this.currentPlayer.selectedSlot];
                    if (!w || w.item.type !== 'wand') return null;
                    const obj = w.item.data.wand.spellSlots[idx];
                    if (!obj) return null;
                    let wrapped = obj;
                    if (wrapped.type !== 'spell' && wrapped.type !== 'modifier') {
                        const itemType = wrapped.rarity ? 'modifier' : 'spell';
                        wrapped = { type: itemType, subtype: wrapped.type, name: wrapped.name, stackable: false, id: wrapped.id, data: { spell: wrapped, mod: wrapped } };
                    }
                    return { item: wrapped, count: 1 };
                }
                return null;
            };
            const setListSlot = (lType, idx, val) => {
                if (lType === 'inventory') inv[idx] = val;
                else if (lType === 'crafting') this.craftingSlots[idx] = val;
                else if (lType === 'chest') this.chestInventory[idx] = val;
                else if (lType === 'furnace') {
                    if (!this.furnaceData) return;
                    if (idx === 0) this.furnaceData.input = val;
                    else if (idx === 1) this.furnaceData.fuel = val;
                    else if (idx === 2) this.furnaceData.output = val;
                }
                else if (lType === 'wand') {
                    const w = inv[this.currentPlayer.selectedSlot];
                    if (w && w.item.type === 'wand') {
                        w.item.data.wand.spellSlots[idx] = val ? val.item : null;
                    }
                }
            };

            const targetSlot = getListSlot(targetType, targetIndex);
            let keepDragging = false;

            if (!targetSlot) {
                if (e.shiftKey && itemData.count > 1) {
                    setListSlot(targetType, targetIndex, { item: itemData.item, count: 1 });
                    itemData.count -= 1;
                    keepDragging = true;
                } else {
                    setListSlot(targetType, targetIndex, itemData);
                }
            } else if (targetSlot.item.type === itemData.item.type && targetSlot.item.subtype === itemData.item.subtype && targetSlot.item.stackable) {
                const add = (e.shiftKey && itemData.count > 1) ? 1 : Math.min(itemData.count, targetSlot.item.maxStack - targetSlot.count);
                if (add > 0) {
                    targetSlot.count += add;
                    itemData.count -= add;
                }
                if (itemData.count > 0) {
                    if (e.shiftKey && add > 0) {
                        keepDragging = true;
                    } else {
                        if (this.dragState.isSplit) {
                            const s = getListSlot(srcType, srcIndex);
                            if (s) s.count += itemData.count;
                            else setListSlot(srcType, srcIndex, itemData);
                        } else {
                            setListSlot(srcType, srcIndex, itemData);
                        }
                    }
                }
            } else {
                // Swap
                if (this.dragState.isSplit) {
                    const s = getListSlot(srcType, srcIndex);
                    if (s) s.count += itemData.count;
                    else setListSlot(srcType, srcIndex, itemData);
                } else {
                    setListSlot(srcType, srcIndex, targetSlot);
                    setListSlot(targetType, targetIndex, itemData);
                }
            }
            
            if (srcType === 'wand' || targetType === 'wand') {
                if (window.game && window.game.heldItemMesh) {
                    window.game.viewModel.remove(window.game.heldItemMesh);
                    window.game.heldItemMesh = null;
                }
            }

            if (keepDragging) {
                this.elements.dragIcon._cacheKey = null; // force update
                this.renderSlotItem(this.elements.dragIcon, this.dragState.itemData);
                this._updateInventory();
                this._updateCraftingSlots();
                this._updateArmorSlots();
                this._updateFurnaceSlots();
                return; // Exit early, do not clear drag state
            }
        }

        // Drag successful, clean up without restoring
        this.dragState.isDragging = false;
        this.dragState.itemData = null;
        this.dragState.isSplit = false;
        this.elements.dragIcon.classList.add('hidden');

        this._updateInventory(true);
        this._updateCraftingSlots(true);
        this._updateArmorSlots();
        this._updateFurnaceSlots();
        this._updateChestSlots();
    }

    // --- Tooltips ---
    onSlotEnter(e, type, index) {
        if (this.dragState.isDragging || !this.isOpen) return;
        let slot = null;
        if (type === 'inventory') slot = this.currentPlayer.inventory.slots[index];
        else if (type === 'crafting') slot = this.craftingSlots[index];
        else if (type === 'crafting_output') slot = this._matchRecipe();
        else if (type === 'armor') slot = this.currentPlayer.inventory.armor[index];
        else if (type === 'furnace') {
            if (!this.furnaceData) return;
            if (index === 0) slot = this.furnaceData.input;
            else if (index === 1) slot = this.furnaceData.fuel;
            else if (index === 2) slot = this.furnaceData.output;
        }
        else if (type === 'wand') {
            const w = this.currentPlayer.inventory.slots[this.currentPlayer.selectedSlot];
            if (w && w.item.type === 'wand') {
                const spell = w.item.data.wand.spellSlots[index];
                if (spell) slot = { item: spell, count: 1 };
            }
        }

        if (slot) {
            let html = `<strong style="color:#7c5cff; font-size:16px;">${slot.item.name}</strong><br/>`;
            if (slot.item.type === 'spell') {
                const sp = slot.item.data.spell || slot.item; // handle both wrapped and unwrapped spell obj
                html += `<span style="color:#aaa;">Element: ${sp.element || 'Arcane'}</span><br/>`;
                html += `<span style="color:#ff8844;">Damage: ${sp.baseDamage || 0}</span><br/>`;
                html += `<span style="color:#4488ff;">Mana: ${sp.baseManaCost || 0}</span><br/>`;
                if (sp.description) html += `<span style="color:#ccc; font-style:italic;">${sp.description}</span><br/>`;
                if (sp.modifiers && sp.modifiers.length > 0) {
                    html += `<span style="color:#ffcc00;">Modifiers:</span><br/>`;
                    for (const m of sp.modifiers) {
                        html += `<span style="color:#ddaa00;">- ${m.name || m.type}</span><br/>`;
                    }
                }
            } else if (slot.item.type === 'wand') {
                const w = slot.item.data.wand;
                html += `<span style="color:#aaa;">Spell Slots: ${w.maxSlots}</span>`;
            } else if (slot.item.type === 'block') {
                html += `<span style="color:#aaa;">Block</span>`;
            } else if (slot.item.type === 'material') {
                html += `<span style="color:#aaa;">Material — used for crafting</span>`;
            } else if (slot.item.type === 'equipment') {
                const ed = slot.item.data.equipData || {};
                if (ed.protection) html += `<span style="color:#88aaff;">Protection: ${ed.protection}</span><br/>`;
                if (ed.mineSpeed) html += `<span style="color:#ffaa44;">Mine Speed: ${ed.mineSpeed}x</span><br/>`;
                if (ed.damage) html += `<span style="color:#ff6666;">Damage: ${ed.damage}</span><br/>`;
                if (ed.speedMult) html += `<span style="color:#44ff88;">Speed: ${ed.speedMult}x</span><br/>`;
                if (ed.flying) html += `<span style="color:#88ffff;">🕊 Can fly</span><br/>`;
                if (slot.item.description) html += `<span style="color:#aaa;">${slot.item.description}</span>`;
            } else if (slot.item.type === 'modifier') {
                const mod = slot.item.data.mod || slot.item;
                html += `<span style="color:#ffcc00;">Modifier</span><br/>`;
                if (mod.config && mod.config.description) html += `<span style="color:#ccc; font-style:italic;">${mod.config.description}</span><br/>`;
                else if (mod.description) html += `<span style="color:#ccc; font-style:italic;">${mod.description}</span><br/>`;
                if (mod.rarity) html += `<span style="color:#aaa;">Rarity: ${mod.rarity}</span>`;
            }
            this.elements.tooltip.innerHTML = html;
            this.elements.tooltip.classList.remove('hidden');
            this.elements.tooltip.style.left = (e.clientX + 15) + 'px';
            this.elements.tooltip.style.top = (e.clientY + 15) + 'px';
        }
    }

    onSlotLeave() {
        this.elements.tooltip.classList.add('hidden');
    }

    // =============================
    // Crafting Grid
    // =============================
    _updateCraftingUILayout() {
        const grid = this.elements.craftingGrid;
        if (!grid) return;
        
        if (this.is3x3Crafting) {
            grid.style.gridTemplateColumns = 'repeat(3, 50px)';
            grid.style.gridTemplateRows = 'repeat(3, 50px)';
            for (let i = 0; i < 9; i++) {
                if (grid.children[i]) grid.children[i].style.display = 'block';
            }
        } else {
            grid.style.gridTemplateColumns = 'repeat(2, 50px)';
            grid.style.gridTemplateRows = 'repeat(2, 50px)';
            for (let i = 0; i < 9; i++) {
                if (!grid.children[i]) continue;
                if (i < 4) grid.children[i].style.display = 'block';
                else grid.children[i].style.display = 'none';
                
                // If switching to 2x2, drop items in hidden slots
                if (i >= 4 && this.craftingSlots[i]) {
                    this.currentPlayer.inventory.addItem(this.craftingSlots[i].item, this.craftingSlots[i].count);
                    this.craftingSlots[i] = null;
                }
            }
        }
        this._matchRecipe(); // refresh
    }

    _initCraftingGrid() {
        const grid = this.elements.craftingGrid;
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const el = document.createElement('div');
            el.className = 'inv-slot';
            el.onmousedown = (e) => this.onSlotMouseDown(e, 'crafting', i);
            el.onmouseup = (e) => this.onSlotMouseUp(e, 'crafting', i);
            el.onmouseenter = (e) => this.onSlotEnter(e, 'crafting', i);
            el.onmouseleave = () => this.onSlotLeave();
            grid.appendChild(el);
        }
        this._updateCraftingUILayout();

        const out = this.elements.craftingOutput;
        if (out) {
            out.onmousedown = (e) => this.onSlotMouseDown(e, 'crafting_output', 0);
            out.onmouseup = (e) => this.onSlotMouseUp(e, 'crafting_output', 0);
            out.onmouseenter = (e) => this.onSlotEnter(e, 'crafting_output', 0);
            out.onmouseleave = () => this.onSlotLeave();
        }
    }

    _initArmorSlots() {
        // Find all armor/offhand slots in the DOM and wire them up
        const ARMOR_NAMES = ['head', 'chest', 'legs', 'boots', 'offhand'];
        ARMOR_NAMES.forEach((slotName, i) => {
            const isOffhand = slotName === 'offhand';
            const el = document.querySelector(isOffhand ? '.offhand-slot' : `[data-slot="${slotName}"]`);
            if (!el) return;
            const armorIndex = isOffhand ? -1 : i;
            el.onmousedown = (e) => this.onSlotMouseDown(e, 'armor', armorIndex);
            el.onmouseup = (e) => this.onSlotMouseUp(e, 'armor', armorIndex);
            el.onmouseenter = (e) => this.onSlotEnter(e, 'armor', armorIndex);
            el.onmouseleave = () => this.onSlotLeave();
        });
    }

    _initFurnaceSlots() {
        if (this.elements.furnaceInput) {
            this.elements.furnaceInput.onmousedown = (e) => this.onSlotMouseDown(e, 'furnace', 0);
            this.elements.furnaceInput.onmouseup = (e) => this.onSlotMouseUp(e, 'furnace', 0);
            this.elements.furnaceInput.onmouseenter = (e) => this.onSlotEnter(e, 'furnace', 0);
            this.elements.furnaceInput.onmouseleave = () => this.onSlotLeave();
        }
        if (this.elements.furnaceFuel) {
            this.elements.furnaceFuel.onmousedown = (e) => this.onSlotMouseDown(e, 'furnace', 1);
            this.elements.furnaceFuel.onmouseup = (e) => this.onSlotMouseUp(e, 'furnace', 1);
            this.elements.furnaceFuel.onmouseenter = (e) => this.onSlotEnter(e, 'furnace', 1);
            this.elements.furnaceFuel.onmouseleave = () => this.onSlotLeave();
        }
        if (this.elements.furnaceOutput) {
            this.elements.furnaceOutput.onmousedown = (e) => this.onSlotMouseDown(e, 'furnace', 2);
            this.elements.furnaceOutput.onmouseup = (e) => this.onSlotMouseUp(e, 'furnace', 2);
            this.elements.furnaceOutput.onmouseenter = (e) => this.onSlotEnter(e, 'furnace', 2);
            this.elements.furnaceOutput.onmouseleave = () => this.onSlotLeave();
        }
    }

    _updateChestSlots(forceUpdate = false) {
        if (this.chestPos && this.chestInventory) {
            this.renderGrid(this.elements.chestGrid, this.chestInventory, 0, this.currentPlayer, 'chest', forceUpdate);
        }
    }

    _updateInventory(forceUpdate = false) {
        if (!this.currentPlayer) return;
        const p = this.currentPlayer;
        this.renderGrid(this.elements.mainHotbar, p.inventory.slots.slice(0, 9), 0, p, 'inventory', forceUpdate);
        if (this.isOpen) {
            this.renderGrid(this.elements.mainGrid, p.inventory.slots.slice(9, 36), 9, p, 'inventory', forceUpdate);
            this.renderGrid(this.elements.invHotbar, p.inventory.slots.slice(0, 9), 0, p, 'inventory', forceUpdate);
        }
    }

    _updateArmorSlots() {
        if (!this.currentPlayer) return;
        const ARMOR_NAMES = ['head', 'chest', 'legs', 'boots'];
        ARMOR_NAMES.forEach((slotName, i) => {
            const el = document.querySelector(`[data-slot="${slotName}"]`);
            if (!el) return;
            this.renderSlotItem(el, this.currentPlayer.inventory.armor[i]);
        });
    }

    _updateCraftingSlots(forceUpdate = false) {
        const grid = this.elements.craftingGrid;
        if (!grid) return;
        const count = this.is3x3Crafting ? 9 : 4;
        for (let i = 0; i < count; i++) {
            this.renderSlotItem(grid.children[i], this.craftingSlots[i], forceUpdate);
        }
        this._updateCraftingOutput();
    }

    _updateCraftingOutput() {
        const out = this.elements.craftingOutput;
        const nameEl = this.elements.craftingRecipeName;
        if (!out) return;
        const result = this._matchRecipe();
        if (result) {
            this.renderSlotItem(out, result);
            if (nameEl) nameEl.textContent = result.item.name;
        } else {
            this.renderSlotItem(out, null);
            if (nameEl) nameEl.textContent = '';
        }
    }

    _updateFurnaceSlots() {
        if (!this.furnaceData) return;
        this.renderSlotItem(this.elements.furnaceInput, this.furnaceData.input);
        this.renderSlotItem(this.elements.furnaceFuel, this.furnaceData.fuel);
        this.renderSlotItem(this.elements.furnaceOutput, this.furnaceData.output);
        if (this.elements.furnaceProgress) {
            this.elements.furnaceProgress.style.width = `${Math.floor(this.furnaceData.progress * 100)}%`;
        }
        if (this.elements.furnaceFire) {
            this.elements.furnaceFire.style.opacity = this.furnaceData.isSmelting ? '1.0' : '0.2';
        }
    }

    _getSlotType(slot) {
        if (!slot || !slot.item) return null;
        if (slot.item.type === 'block') return slot.item.subtype;
        if (slot.item.type === 'material') return slot.item.subtype;
        if (slot.item.type === 'equipment') return slot.item.subtype;
        return null;
    }

    _matchRecipe() {
        const activeSlots = this.craftingSlots.filter(s => s && s.item);
        const spells = activeSlots.filter(s => s.item.type === 'spell');
        const modifiers = activeSlots.filter(s => s.item.type === 'modifier');
        if (spells.length === 1 && modifiers.length >= 1 && spells.length + modifiers.length === activeSlots.length) {
            const baseSpellItem = spells[0].item;
            const baseSpell = baseSpellItem.data && baseSpellItem.data.spell ? baseSpellItem.data.spell : baseSpellItem;
            
            const newSpell = Object.assign(Object.create(Object.getPrototypeOf(baseSpell)), baseSpell);
            newSpell.modifiers = baseSpell.modifiers ? [...baseSpell.modifiers] : [];
            newSpell.id = 'magic_' + Math.random();
            
            for (const modSlot of modifiers) {
                const mod = modSlot.item;
                const modData = mod.data && mod.data.mod ? mod.data.mod : mod;
                if (modData.config && !modData.config.stackable && newSpell.modifiers.some(m => m.type === modData.type)) return null;
                if (typeof newSpell.addModifier === 'function') newSpell.addModifier(modData);
                else newSpell.modifiers.push(modData);
            }
            
            const newItem = Object.assign({}, baseSpellItem);
            newItem.id = newSpell.id;
            if (baseSpellItem.data && baseSpellItem.data.spell) {
                newItem.data = Object.assign({}, baseSpellItem.data, { spell: newSpell });
            } else {
                Object.assign(newItem, newSpell);
            }
            return { item: newItem, count: 1 };
        }

        // Build a 2x2 pattern from crafting slots [tl, tr, bl, br]
        const s = this.craftingSlots.map(s => this._getSlotType(s));
        const [tl, tr, bl, br] = s;

        // Helper: check if a pattern (array of 4 block IDs or null) matches
        const B = (typeof BLOCKS !== 'undefined') ? BLOCKS : window.BLOCKS;
        if (!B) return null;

        // Helper: get count of a specific material/block in the grid
        const getCount = (type) => s.filter(x => x === type).length;
        const totalItems = s.filter(x => x !== null).length;

        const match = (pattern, out) => {
            for (let i = 0; i < 4; i++) {
                if (pattern[i] !== s[i]) return null;
            }
            return out;
        };

        // Utility to make a material item
        const mat = (subType, name, count = 1, icon = null) => ({ item: { type: 'material', subtype: subType, name, stackable: true, maxStack: 64, id: `mat_${subType}`, data: { icon }, description: '' }, count });
        const equip = (subType, data, name, desc, count = 1) => ({ item: { type: 'equipment', subtype: subType, name, stackable: false, maxStack: 1, id: `equip_${subType}_${Date.now()}`, data: { equipData: data }, description: desc }, count });
        const block = (type, name, count = 1) => ({ item: { type: 'block', subtype: type, name, stackable: true, maxStack: 64, id: `block_${type}`, data: {}, description: '' }, count });

        // --- Recipes ---
        const woodToPlankMap = {
            [B.WOOD]: { block: B.PLANKS, name: 'Planks' },
            [B.ACACIA_WOOD]: { block: B.ACACIA_PLANKS, name: 'Acacia Planks' },
            [B.CHERRY_LOG]: { block: B.CHERRY_PLANKS, name: 'Cherry Planks' },
            [B.AUTUMN_WOOD]: { block: B.AUTUMN_PLANKS, name: 'Autumn Planks' },
            [B.PALM_WOOD]: { block: B.PALM_PLANKS, name: 'Palm Planks' },
            [B.PINE_WOOD]: { block: B.PINE_PLANKS, name: 'Pine Planks' },
            [B.CRIMSON_STEM]: { block: B.CRIMSON_PLANKS, name: 'Crimson Planks' }
        };
        const woodType = s.find(x => x !== null && woodToPlankMap[x]);
        const isPlank = (t) => [B.PLANKS, B.ACACIA_PLANKS, B.CHERRY_PLANKS, B.AUTUMN_PLANKS, B.PALM_PLANKS, B.PINE_PLANKS, B.CRIMSON_PLANKS].includes(t);
        const countAnyPlank = s.filter(x => x !== null && isPlank(x)).length;
        const matchesMat = (t, expected) => expected === B.PLANKS ? isPlank(t) : t === expected;

        // Pickaxes: 3 top mat, 2 stick middle
        const pickaxeRecipe = (matType, mineSpeed, damage, chopSpeed, toolName) => {
            if (matchesMat(s[0], matType) && matchesMat(s[1], matType) && matchesMat(s[2], matType) &&
                !s[3] && s[4] === 'stick' && !s[5] &&
                !s[6] && s[7] === 'stick' && !s[8])
                return equip('pickaxe', { mineSpeed, damage, chopSpeed }, toolName, `${toolName}. Mine Speed: ${mineSpeed}x`);
            return null;
        };

        // Swords: 2 mat vertical, 1 stick bottom
        const swordRecipe = (matType, damage, toolName) => {
            if (!s[0] && matchesMat(s[1], matType) && !s[2] &&
                !s[3] && matchesMat(s[4], matType) && !s[5] &&
                !s[6] && s[7] === 'stick' && !s[8])
                return equip('sword', { mineSpeed: 1.0, damage, chopSpeed: 1.0 }, toolName, `${toolName}. Damage: ${damage}`);
            return null;
        };

        // Axes: 3 mat corner, 2 stick
        const axeRecipe = (matType, chopSpeed, damage, toolName) => {
            if (matchesMat(s[0], matType) && matchesMat(s[1], matType) && !s[2] &&
                matchesMat(s[3], matType) && s[4] === 'stick' && !s[5] &&
                !s[6] && s[7] === 'stick' && !s[8])
                return equip('axe', { mineSpeed: 1.0, damage, chopSpeed }, toolName, `${toolName}. Chops fast. Speed: ${chopSpeed}x`);
            return null;
        };

        // Armor Helmet: 5 mat top arch
        const armorRecipe2H = (matType, name, subType, protection) => {
            if (s[0] === matType && s[1] === matType && s[2] === matType &&
                s[3] === matType && !s[4] && s[5] === matType &&
                !s[6] && !s[7] && !s[8])
                return equip(subType, { protection }, name, `Protection: ${protection}`);
            return null;
        };
        // Armor Chestplate: 8 mat ring
        const armorRecipeFull = (matType, name, subType, protection) => {
            if (s[0] === matType && !s[1] && s[2] === matType &&
                s[3] === matType && s[4] === matType && s[5] === matType &&
                s[6] === matType && s[7] === matType && s[8] === matType)
                return equip(subType, { protection }, name, `Protection: ${protection}`);
            return null;
        };
        // Armor Leggings: 7 mat arch
        const armorRecipeLegs = (matType, name, subType, protection) => {
            if (s[0] === matType && s[1] === matType && s[2] === matType &&
                s[3] === matType && !s[4] && s[5] === matType &&
                s[6] === matType && !s[7] && s[8] === matType)
                return equip(subType, { protection }, name, `Protection: ${protection}`);
            return null;
        };
        // Armor Boots: 4 mat sides
        const armorRecipeBoots = (matType, name, subType, protection) => {
            if (!s[0] && !s[1] && !s[2] &&
                s[3] === matType && !s[4] && s[5] === matType &&
                s[6] === matType && !s[7] && s[8] === matType)
                return equip(subType, { protection }, name, `Protection: ${protection}`);
            return null;
        };

        // Spell Recipe: mana crystal center, 4 mats in cross
        const spellRecipe = (matType, spellId) => {
            if (s[4] !== 'mana_crystal') return null;
            if (!s[0] && matchesMat(s[1], matType) && !s[2] &&
                matchesMat(s[3], matType) && matchesMat(s[5], matType) &&
                !s[6] && matchesMat(s[7], matType) && !s[8]) {
                const sp = SPELL_TYPES[spellId];
                if (!sp) return null;
                const spellInst = new Spell(spellId);
                return { 
                    item: { 
                        type: 'spell', subtype: spellId, name: sp.name, 
                        stackable: false, maxStack: 1, id: `spell_${spellId}_${Date.now()}`, 
                        data: { spell: spellInst }, description: sp.description 
                    }, 
                    count: 1 
                };
            }
            return null;
        };

        if (!this.is3x3Crafting) {
            // ONLY 2x2 recipes
            if (woodType !== undefined && totalItems === 1) return block(woodToPlankMap[woodType].block, woodToPlankMap[woodType].name, 4);
            if (countAnyPlank === 2 && totalItems === 2) return mat('stick', 'Stick', 4);
            if (getCount('coal') === 1 && getCount('stick') === 1 && totalItems === 2) return block(B.TORCH, 'Torch', 4);
            
            if (s[0] === 'stick' && s[1] === 'iron_ingot' && !s[2] && !s[3]) return equip('wand_basic', {}, 'Basic Wand', 'Channels raw magic.');
            if (s[0] === 'wand_basic' && s[1] === 'coal' && !s[2] && !s[3]) return equip('wand_fire', { element: 'FIRE' }, 'Fire Wand', 'Shoots fireballs.');
            if (s[0] === 'wand_basic' && s[1] === B.SNOW && !s[2] && !s[3]) return equip('wand_ice', { element: 'ICE' }, 'Ice Wand', 'Shoots ice blasts.');
            if (s[0] === 'wand_basic' && (s[1] === B.LEAVES || s[1] === B.CHERRY_LEAVES || s[1] === B.AUTUMN_LEAVES) && !s[2] && !s[3]) return equip('wand_nature', { element: 'HEAL' }, 'Nature Wand', 'Heals the wielder.');

            if (getCount(B.STONE) === 4) return block(B.STONE_BRICKS, 'Stone Bricks', 4);
            if (getCount(B.CLAY) === 4) return block(B.BRICKS, 'Bricks', 4);
            if (countAnyPlank === 4 && totalItems === 4) return block(B.CRAFTING_TABLE, 'Crafting Table', 1);
            if (getCount('iron_ingot') === 1 && getCount(B.SAND) === 1 && totalItems === 2) return equip('flint_and_steel', { damage: 0 }, 'Flint and Steel', 'Lights fires.');
            if (getCount(B.COBBLESTONE) === 1 && (getCount(B.LEAVES) === 1 || getCount(B.CHERRY_LEAVES) === 1 || getCount(B.AUTUMN_LEAVES) === 1) && totalItems === 2) return block(B.MOSSY_COBBLESTONE, 'Mossy Cobble', 1);
            
            if (getCount(B.SUGARCANE) === 1 && totalItems === 1) return mat('sugar', 'Sugar', 1);
            if (getCount(B.SUGARCANE) === 3 && totalItems === 3) return mat('paper', 'Paper', 3);
            if (getCount('paper') === 3 && getCount('leather') === 1 && totalItems === 4) return mat('book', 'Book', 1);
            if (getCount(B.SANDSTONE) === 4) return block(B.SANDSTONE, 'Smooth Sandstone', 4);

            // Reverse Storage is 1 item -> 9 items. Can be done in 2x2 grid.
            if (getCount(B.IRON_BLOCK) === 1 && totalItems === 1) return mat('iron_ingot', 'Iron Ingot', 9);
            if (getCount(B.GOLD_BLOCK) === 1 && totalItems === 1) return mat('gold_ingot', 'Gold Ingot', 9);
            if (getCount(B.DIAMOND_BLOCK) === 1 && totalItems === 1) return mat('diamond', 'Diamond', 9);

            return null;
        }

        if (this.is3x3Crafting) {
            // ONLY 3x3 recipes
            let r;
            r = pickaxeRecipe('iron_ingot', 3.0, 5, 1.5, 'Iron Pickaxe'); if (r) return r;
            r = pickaxeRecipe('diamond', 6.0, 8, 3.0, 'Diamond Pickaxe'); if (r) return r;
            r = pickaxeRecipe(B.COBBLESTONE, 2.0, 4, 1.2, 'Stone Pickaxe'); if (r) return r;
            r = pickaxeRecipe(B.PLANKS, 1.5, 3, 1.0, 'Wooden Pickaxe'); if (r) return r;
            r = pickaxeRecipe('gold_ingot', 2.5, 4, 2.5, 'Gold Pickaxe'); if (r) return r;

            r = swordRecipe('iron_ingot', 8, 'Iron Sword'); if (r) return r;
            r = swordRecipe('diamond', 12, 'Diamond Sword'); if (r) return r;
            r = swordRecipe(B.COBBLESTONE, 5, 'Stone Sword'); if (r) return r;
            r = swordRecipe(B.PLANKS, 3, 'Wooden Sword'); if (r) return r;
            r = swordRecipe('gold_ingot', 7, 'Gold Sword'); if (r) return r;

            r = axeRecipe('iron_ingot', 3.0, 5, 'Iron Axe'); if (r) return r;
            r = axeRecipe('diamond', 5.0, 7, 'Diamond Axe'); if (r) return r;
            r = axeRecipe(B.COBBLESTONE, 2.0, 4, 'Stone Axe'); if (r) return r;
            r = axeRecipe(B.PLANKS, 1.5, 3, 'Wooden Axe'); if (r) return r;
            r = axeRecipe('gold_ingot', 2.5, 4, 'Gold Axe'); if (r) return r;

            r = armorRecipe2H('iron_ingot', 'Iron Helmet', 'head', 2); if (r) return r;
            r = armorRecipeFull('iron_ingot', 'Iron Chestplate', 'chest', 5); if (r) return r;
            r = armorRecipeLegs('iron_ingot', 'Iron Leggings', 'legs', 3); if (r) return r;
            r = armorRecipeBoots('iron_ingot', 'Iron Boots', 'boots', 2); if (r) return r;

            r = armorRecipe2H('diamond', 'Diamond Helmet', 'head', 5); if (r) return r;
            r = armorRecipeFull('diamond', 'Diamond Chestplate', 'chest', 10); if (r) return r;
            r = armorRecipeLegs('diamond', 'Diamond Leggings', 'legs', 7); if (r) return r;
            r = armorRecipeBoots('diamond', 'Diamond Boots', 'boots', 5); if (r) return r;

            r = armorRecipe2H('gold_ingot', 'Gold Helmet', 'head', 3); if (r) return r;
            r = armorRecipeFull('gold_ingot', 'Gold Chestplate', 'chest', 7); if (r) return r;
            r = armorRecipeLegs('gold_ingot', 'Gold Leggings', 'legs', 4); if (r) return r;
            r = armorRecipeBoots('gold_ingot', 'Gold Boots', 'boots', 3); if (r) return r;

            if (!s[0] && !s[1] && !s[2] && 
                s[3] === 'iron_ingot' && !s[4] && s[5] === 'iron_ingot' && 
                !s[6] && s[7] === 'iron_ingot' && !s[8]) return mat('bucket', 'Bucket', 1);

            if (!s[0] && s[1] === B.SNOW && !s[2] && 
                s[3] === 'iron_ingot' && !s[4] && s[5] === 'iron_ingot' && 
                !s[6] && s[7] === 'iron_ingot' && !s[8]) return mat('water_bucket', 'Water Bucket', 1);

            r = spellRecipe(B.SNOW, 'ICE'); if (r) return r;
            r = spellRecipe('coal', 'FIRE'); if (r) return r;
            r = spellRecipe('gold_ingot', 'THUNDER'); if (r) return r;
            r = spellRecipe(B.STONE, 'EARTH'); if (r) return r;
            r = spellRecipe('gold_nugget', 'THUNDER'); if (r) return r; // Alternative
            r = spellRecipe(B.OBSIDIAN, 'DARK'); if (r) return r;
            r = spellRecipe('sugar', 'WIND'); if (r) return r;
            r = spellRecipe(B.LEAVES, 'POISON'); if (r) return r;
            r = spellRecipe(B.SAND, 'WATER'); if (r) return r;
            r = spellRecipe(B.ALIEN_STONE, 'VOID'); if (r) return r;
            r = spellRecipe(B.GLASS, 'LIGHT'); if (r) return r;
            r = spellRecipe('water_bucket', 'FROST'); if (r) return r; // Or similar
            r = spellRecipe(B.PLANKS, 'BUILDER'); if (r) return r;

            if (getCount(B.SAND) === 8 && totalItems === 8) return block(B.GLASS, 'Glass', 8);
            if (getCount(B.COBBLESTONE) === 8 && totalItems === 8) return block(B.FURNACE, 'Furnace', 1);
            if (countAnyPlank === 8 && totalItems === 8) return block(B.CHEST_BLOCK, 'Chest', 1);
            if (countAnyPlank === 6 && totalItems === 6) return block(B.BOOKSHELF, 'Bookshelf', 1);
            if (getCount('stick') === 7 && totalItems === 7) return block(B.LADDER, 'Ladder', 3);

            if (getCount('iron_ingot') === 9 && totalItems === 9) return block(B.IRON_BLOCK, 'Iron Block', 1);
            if (getCount('gold_ingot') === 9 && totalItems === 9) return block(B.GOLD_BLOCK, 'Gold Block', 1);
            if (getCount('diamond') === 9 && totalItems === 9) return block(B.DIAMOND_BLOCK, 'Diamond Block', 1);
            
            if (getCount(B.SAND) === 4 && getCount('coal') === 5 && totalItems === 9) return block(B.TNT, 'TNT', 1);

            return null;
        }

        return null;
    }

    _consumeCraftingSlots(result) {
        // Remove 1 from each crafting slot
        for (let i = 0; i < 4; i++) {
            if (this.craftingSlots[i]) {
                this.craftingSlots[i].count -= 1;
                if (this.craftingSlots[i].count <= 0) this.craftingSlots[i] = null;
            }
        }
    }

    showRecipeBook() {
        const list = document.getElementById('recipe-list');
        if (!list) return;
        const B = (typeof BLOCKS !== 'undefined') ? BLOCKS : window.BLOCKS;
        if (!B) return;

        const mat = (id) => ({ type: 'material', subtype: id });
        const blk = (id) => ({ type: 'block', subtype: id });
        const eqp = (id) => ({ type: 'equipment', subtype: id });
        const spl = (id) => ({ type: 'spell', subtype: id });
        const wnd = (id) => ({ type: 'wand', subtype: id });
        const _ = null;

        // Structured recipes for visual grid
        const recipes = [
            { name: "Planks (4)", desc: "Basic building block.", grid: [[_,_,_],[_,blk(B.WOOD),_],[_,_,_]], out: blk(B.PLANKS), outCount: 4, needs3x3: false },
            { name: "Stick (4)", desc: "Used for tools.", grid: [[_,_,_],[_,blk(B.PLANKS),_],[_,blk(B.PLANKS),_]], out: mat('stick'), outCount: 4, needs3x3: false },
            { name: "Crafting Table", desc: "Unlocks 3x3 crafting.", grid: [[_,_,_],[blk(B.PLANKS),blk(B.PLANKS),_],[blk(B.PLANKS),blk(B.PLANKS),_]], out: blk(B.CRAFTING_TABLE), outCount: 1, needs3x3: false },
            { name: "Torch (4)", desc: "Lights up the dark.", grid: [[_,_,_],[_,mat('coal'),_],[_,mat('stick'),_]], out: blk(B.TORCH), outCount: 4, needs3x3: false },
            { name: "Iron Sword", desc: "Deals moderate damage.", grid: [[_,mat('iron_ingot'),_],[_,mat('iron_ingot'),_],[_,mat('stick'),_]], out: eqp('sword_iron'), outCount: 1, needs3x3: true },
            { name: "Shark Sword", desc: "High damage weapon.", grid: [[_,mat('shark_tooth'),_],[_,mat('shark_tooth'),_],[_,mat('stick'),_]], out: eqp('sword_shark'), outCount: 1, needs3x3: true },
            { name: "Iron Pickaxe", desc: "Mines ores.", grid: [[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('pickaxe_iron'), outCount: 1, needs3x3: true },
            { name: "Iron Axe", desc: "Chops wood quickly.", grid: [[mat('iron_ingot'),mat('iron_ingot'),_],[mat('iron_ingot'),mat('stick'),_],[_,mat('stick'),_]], out: eqp('axe_iron'), outCount: 1, needs3x3: true },
            { name: "Iron Helmet", desc: "Basic protection.", grid: [[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[mat('iron_ingot'),_,mat('iron_ingot')],[_,_,_]], out: eqp('helmet_iron'), outCount: 1, needs3x3: true },
            { name: "Iron Chestplate", desc: "Solid defense.", grid: [[mat('iron_ingot'),_,mat('iron_ingot')],[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')]], out: eqp('chest_iron'), outCount: 1, needs3x3: true },
            { name: "Basic Wand", desc: "Casts spells.", grid: [[_,_,mat('iron_ingot')],[_,mat('stick'),_],[mat('stick'),_,_]], out: wnd('wand_basic'), outCount: 1, needs3x3: false },
            { name: "Fire Wand", desc: "Empowers fire magic.", grid: [[_,_,mat('coal')],[_,wnd('wand_basic'),_],[_,_,_]], out: wnd('wand_fire'), outCount: 1, needs3x3: false },
            { name: "Ice Wand", desc: "Empowers ice magic.", grid: [[_,_,blk(B.SNOW)],[_,wnd('wand_basic'),_],[_,_,_]], out: wnd('wand_ice'), outCount: 1, needs3x3: false },
            { name: "Furnace", desc: "Smelts ores.", grid: [[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)],[blk(B.COBBLESTONE),_,blk(B.COBBLESTONE)],[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)]], out: blk(B.FURNACE), outCount: 1, needs3x3: true },
            { name: "Chest", desc: "Stores items.", grid: [[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)],[blk(B.PLANKS),_,blk(B.PLANKS)],[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)]], out: blk(B.CHEST_BLOCK), outCount: 1, needs3x3: true },
            { name: "Flint and Steel", desc: "Ignites TNT.", grid: [[_,_,_],[mat('iron_ingot'),_,_],[_,blk(B.SAND),_]], out: eqp('flint_and_steel'), outCount: 1, needs3x3: false },
            { name: "Bucket", desc: "Holds liquids.", grid: [[_,_,_],[mat('iron_ingot'),_,mat('iron_ingot')],[_,mat('iron_ingot'),_]], out: mat('bucket'), outCount: 1, needs3x3: true },
            { name: "Water Bucket", desc: "Crafted from snow.", grid: [[_,blk(B.SNOW),_],[mat('iron_ingot'),_,mat('iron_ingot')],[_,mat('iron_ingot'),_]], out: mat('water_bucket'), outCount: 1, needs3x3: true },
            { name: "Fire Spell", desc: "Crafted magic.", grid: [[_,mat('coal'),_],[mat('coal'),mat('mana_crystal'),mat('coal')],[_,mat('coal'),_]], out: spl('FIRE'), outCount: 1, needs3x3: true },
            { name: "Ice Spell", desc: "Crafted magic.", grid: [[_,blk(B.SNOW),_],[blk(B.SNOW),mat('mana_crystal'),blk(B.SNOW)],[_,blk(B.SNOW),_]], out: spl('ICE'), outCount: 1, needs3x3: true },
            { name: "Thunder Spell", desc: "Crafted magic.", grid: [[_,mat('gold_ingot'),_],[mat('gold_ingot'),mat('mana_crystal'),mat('gold_ingot')],[_,mat('gold_ingot'),_]], out: spl('THUNDER'), outCount: 1, needs3x3: true },
            { name: "Earth Spell", desc: "Crafted magic.", grid: [[_,blk(B.STONE),_],[blk(B.STONE),mat('mana_crystal'),blk(B.STONE)],[_,blk(B.STONE),_]], out: spl('EARTH'), outCount: 1, needs3x3: true },
            { name: "Dark Spell", desc: "Crafted magic.", grid: [[_,blk(B.OBSIDIAN),_],[blk(B.OBSIDIAN),mat('mana_crystal'),blk(B.OBSIDIAN)],[_,blk(B.OBSIDIAN),_]], out: spl('DARK'), outCount: 1, needs3x3: true },
            { name: "Wind Spell", desc: "Crafted magic.", grid: [[_,mat('sugar'),_],[mat('sugar'),mat('mana_crystal'),mat('sugar')],[_,mat('sugar'),_]], out: spl('WIND'), outCount: 1, needs3x3: true },
            { name: "Poison Spell", desc: "Crafted magic.", grid: [[_,blk(B.LEAVES),_],[blk(B.LEAVES),mat('mana_crystal'),blk(B.LEAVES)],[_,blk(B.LEAVES),_]], out: spl('POISON'), outCount: 1, needs3x3: true },

            { name: "Wooden Sword", desc: "Basic weapon.", grid: [[_,blk(B.PLANKS),_],[_,blk(B.PLANKS),_],[_,mat('stick'),_]], out: eqp('sword_wood'), outCount: 1, needs3x3: true },
            { name: "Stone Sword", desc: "Decent weapon.", grid: [[_,blk(B.COBBLESTONE),_],[_,blk(B.COBBLESTONE),_],[_,mat('stick'),_]], out: eqp('sword_stone'), outCount: 1, needs3x3: true },
            { name: "Gold Sword", desc: "Fast but weak.", grid: [[_,mat('gold_ingot'),_],[_,mat('gold_ingot'),_],[_,mat('stick'),_]], out: eqp('sword_gold'), outCount: 1, needs3x3: true },
            { name: "Diamond Sword", desc: "Strongest weapon.", grid: [[_,mat('diamond'),_],[_,mat('diamond'),_],[_,mat('stick'),_]], out: eqp('sword_diamond'), outCount: 1, needs3x3: true },

            { name: "Wooden Pickaxe", desc: "Basic miner.", grid: [[blk(B.PLANKS),blk(B.PLANKS),blk(B.PLANKS)],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('pickaxe_wood'), outCount: 1, needs3x3: true },
            { name: "Stone Pickaxe", desc: "Mines iron.", grid: [[blk(B.COBBLESTONE),blk(B.COBBLESTONE),blk(B.COBBLESTONE)],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('pickaxe_stone'), outCount: 1, needs3x3: true },
            { name: "Gold Pickaxe", desc: "Fast mining.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('pickaxe_gold'), outCount: 1, needs3x3: true },
            { name: "Diamond Pickaxe", desc: "Mines everything.", grid: [[mat('diamond'),mat('diamond'),mat('diamond')],[_,mat('stick'),_],[_,mat('stick'),_]], out: eqp('pickaxe_diamond'), outCount: 1, needs3x3: true },

            { name: "Wooden Axe", desc: "Basic chopper.", grid: [[blk(B.PLANKS),blk(B.PLANKS),_],[blk(B.PLANKS),mat('stick'),_],[_,mat('stick'),_]], out: eqp('axe_wood'), outCount: 1, needs3x3: true },
            { name: "Stone Axe", desc: "Decent chopper.", grid: [[blk(B.COBBLESTONE),blk(B.COBBLESTONE),_],[blk(B.COBBLESTONE),mat('stick'),_],[_,mat('stick'),_]], out: eqp('axe_stone'), outCount: 1, needs3x3: true },
            { name: "Gold Axe", desc: "Fast chopper.", grid: [[mat('gold_ingot'),mat('gold_ingot'),_],[mat('gold_ingot'),mat('stick'),_],[_,mat('stick'),_]], out: eqp('axe_gold'), outCount: 1, needs3x3: true },
            { name: "Diamond Axe", desc: "Best chopper.", grid: [[mat('diamond'),mat('diamond'),_],[mat('diamond'),mat('stick'),_],[_,mat('stick'),_]], out: eqp('axe_diamond'), outCount: 1, needs3x3: true },

            { name: "Gold Helmet", desc: "Shiny protection.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),_,mat('gold_ingot')],[_,_,_]], out: eqp('helmet_gold'), outCount: 1, needs3x3: true },
            { name: "Gold Chestplate", desc: "Shiny protection.", grid: [[mat('gold_ingot'),_,mat('gold_ingot')],[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')]], out: eqp('chest_gold'), outCount: 1, needs3x3: true },
            { name: "Gold Leggings", desc: "Shiny protection.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),_,mat('gold_ingot')],[mat('gold_ingot'),_,mat('gold_ingot')]], out: eqp('legs_gold'), outCount: 1, needs3x3: true },
            { name: "Gold Boots", desc: "Shiny protection.", grid: [[_,_,_],[mat('gold_ingot'),_,mat('gold_ingot')],[mat('gold_ingot'),_,mat('gold_ingot')]], out: eqp('boots_gold'), outCount: 1, needs3x3: true },

            { name: "Diamond Helmet", desc: "Strong protection.", grid: [[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),_,mat('diamond')],[_,_,_]], out: eqp('helmet_diamond'), outCount: 1, needs3x3: true },
            { name: "Diamond Chestplate", desc: "Strong protection.", grid: [[mat('diamond'),_,mat('diamond')],[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),mat('diamond'),mat('diamond')]], out: eqp('chest_diamond'), outCount: 1, needs3x3: true },
            { name: "Diamond Leggings", desc: "Strong protection.", grid: [[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),_,mat('diamond')],[mat('diamond'),_,mat('diamond')]], out: eqp('legs_diamond'), outCount: 1, needs3x3: true },
            { name: "Diamond Boots", desc: "Strong protection.", grid: [[_,_,_],[mat('diamond'),_,mat('diamond')],[mat('diamond'),_,mat('diamond')]], out: eqp('boots_diamond'), outCount: 1, needs3x3: true },

            { name: "Nature Wand", desc: "Heals you.", grid: [[_,_,blk(B.LEAVES)],[_,wnd('wand_basic'),_],[_,_,_]], out: wnd('wand_nature'), outCount: 1, needs3x3: false },

            { name: "Stone Bricks (4)", desc: "Building block.", grid: [[_,_,_],[blk(B.STONE),blk(B.STONE),_],[blk(B.STONE),blk(B.STONE),_]], out: blk(B.STONE_BRICKS), outCount: 4, needs3x3: false },
            { name: "Bricks (4)", desc: "Building block.", grid: [[_,_,_],[blk(B.CLAY),blk(B.CLAY),_],[blk(B.CLAY),blk(B.CLAY),_]], out: blk(B.BRICKS), outCount: 4, needs3x3: false },
            { name: "Sandstone (4)", desc: "Building block.", grid: [[_,_,_],[blk(B.SAND),blk(B.SAND),_],[blk(B.SAND),blk(B.SAND),_]], out: blk(B.SANDSTONE), outCount: 4, needs3x3: false },
            { name: "Mossy Cobble", desc: "Building block.", grid: [[_,_,_],[blk(B.COBBLESTONE),blk(B.LEAVES),_],[_,_,_]], out: blk(B.MOSSY_COBBLESTONE), outCount: 1, needs3x3: false },

            { name: "Sugar", desc: "Sweet dust.", grid: [[_,_,_],[blk(B.SUGARCANE),_,_],[_,_,_]], out: mat('sugar'), outCount: 1, needs3x3: false },
            { name: "Paper (3)", desc: "Writing material.", grid: [[_,_,_],[blk(B.SUGARCANE),blk(B.SUGARCANE),_],[_,blk(B.SUGARCANE),_]], out: mat('paper'), outCount: 3, needs3x3: false },
            { name: "Book", desc: "A readable item.", grid: [[_,_,_],[mat('paper'),mat('paper'),_],[mat('paper'),mat('leather'),_]], out: mat('book'), outCount: 1, needs3x3: false },
            
            { name: "Iron Block", desc: "Storage block.", grid: [[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')],[mat('iron_ingot'),mat('iron_ingot'),mat('iron_ingot')]], out: blk(B.IRON_BLOCK), outCount: 1, needs3x3: true },
            { name: "Gold Block", desc: "Storage block.", grid: [[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')],[mat('gold_ingot'),mat('gold_ingot'),mat('gold_ingot')]], out: blk(B.GOLD_BLOCK), outCount: 1, needs3x3: true },
            { name: "Diamond Block", desc: "Storage block.", grid: [[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),mat('diamond'),mat('diamond')],[mat('diamond'),mat('diamond'),mat('diamond')]], out: blk(B.DIAMOND_BLOCK), outCount: 1, needs3x3: true },

            { name: "Iron Ingot (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.IRON_BLOCK),_,_],[_,_,_]], out: mat('iron_ingot'), outCount: 9, needs3x3: false },
            { name: "Gold Ingot (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.GOLD_BLOCK),_,_],[_,_,_]], out: mat('gold_ingot'), outCount: 9, needs3x3: false },
            { name: "Diamond (9)", desc: "Revert block.", grid: [[_,_,_],[blk(B.DIAMOND_BLOCK),_,_],[_,_,_]], out: mat('diamond'), outCount: 9, needs3x3: false }
        ];

        const filteredRecipes = recipes.filter(r => this.is3x3Crafting ? true : !r.needs3x3);
        let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
        filteredRecipes.forEach((r, idx) => {
            html += `<li class="recipe-item" data-idx="${idx}" style="margin-bottom: 8px; cursor: pointer; padding: 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); transition: background 0.2s;">
                <div style="color: #fff; font-weight: bold; font-size: 1rem; margin-bottom: 2px;">${r.name}</div>
            </li>`;
        });
        html += '</ul>';
        list.innerHTML = html;

        // Add hover styles dynamically via JS (since we don't have CSS classes for it)
        const items = list.querySelectorAll('.recipe-item');
        items.forEach(item => {
            item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.1)');
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('selected')) item.style.background = 'transparent';
            });
            
            item.addEventListener('click', () => {
                items.forEach(i => { i.classList.remove('selected'); i.style.background = 'transparent'; i.style.borderColor = 'rgba(255,255,255,0.1)'; });
                item.classList.add('selected');
                item.style.background = 'rgba(100, 150, 255, 0.2)';
                item.style.borderColor = 'rgba(100, 150, 255, 0.8)';
                
                const idx = parseInt(item.getAttribute('data-idx'));
                this.showRecipeDetails(filteredRecipes[idx]);
            });
        });

        // Select first automatically
        if (items.length > 0) items[0].click();
    }

    showRecipeDetails(recipe) {
        document.getElementById('recipe-viewer-title').innerText = recipe.name;
        document.getElementById('recipe-viewer-desc').innerText = recipe.desc;
        
        const gridContainer = document.getElementById('recipe-viewer-grid');
        gridContainer.innerHTML = '';
        
        // Helper to generate the exact HTML element for a given recipe item definition
        const createSlotEl = (def) => {
            const el = document.createElement('div');
            el.className = 'inv-slot';
            el.style.width = '40px';
            el.style.height = '40px';
            el.style.border = '2px solid rgba(150,150,150,0.5)';
            if (!def) return el;
            
            let dataURL = null;
            if (def.type === 'block') {
                const iconCanvas = this.atlas.getBlockIcon(def.subtype);
                dataURL = iconCanvas.toDataURL();
            } else {
                const iconCanvas = generateItemTexture(def.type, def.subtype);
                dataURL = iconCanvas.toDataURL();
            }
            
            const img = document.createElement('img');
            img.src = dataURL;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            el.appendChild(img);
            return el;
        };

        // Render 3x3
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                gridContainer.appendChild(createSlotEl(recipe.grid[y][x]));
            }
        }

        // Render Output
        const outContainer = document.getElementById('recipe-viewer-output');
        outContainer.innerHTML = '';
        outContainer.style.border = '2px solid #fff';
        const outEl = createSlotEl(recipe.out);
        if (recipe.outCount > 1) {
            const num = document.createElement('div');
            num.className = 'slot-count';
            num.innerText = recipe.outCount;
            num.style.position = 'absolute';
            num.style.bottom = '2px';
            num.style.right = '4px';
            num.style.fontSize = '12px';
            num.style.fontWeight = 'bold';
            num.style.textShadow = '1px 1px 0 #000';
            outEl.appendChild(num);
        }
        // Steal the children out of the slotEl we created
        while (outEl.children.length > 0) {
            outContainer.appendChild(outEl.children[0]);
        }
    }
}

export { UISystem };
export class CloudSystem {
    constructor(scene) {
        this.scene = scene;
        this.clouds = new THREE.Group();
        this.scene.add(this.clouds);
        
        const geo = new THREE.BoxGeometry(8, 4, 8);
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        
        this.clusters = [];
        for(let i=0; i<30; i++) {
            const cluster = new THREE.Group();
            cluster.position.set((Math.random()-0.5)*400, 100 + Math.random()*20, (Math.random()-0.5)*400);
            const numBlocks = 5 + Math.floor(Math.random()*15);
            for(let j=0; j<numBlocks; j++) {
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(Math.floor((Math.random()-0.5)*4)*8, Math.floor((Math.random()-0.5)*2)*4, Math.floor((Math.random()-0.5)*4)*8);
                cluster.add(mesh);
            }
            this.clouds.add(cluster);
            this.clusters.push(cluster);
        }
    }

    update(dt, cameraPos) {
        for(let c of this.clusters) {
            c.position.x += dt * 2;
            if (c.position.x - cameraPos.x > 200) c.position.x -= 400;
            if (c.position.x - cameraPos.x < -200) c.position.x += 400;
            if (c.position.z - cameraPos.z > 200) c.position.z -= 400;
            if (c.position.z - cameraPos.z < -200) c.position.z += 400;
        }
    }
}

export class MeteorShowerSystem {
    constructor(scene, particles, audio, world) {
        this.scene = scene;
        this.particles = particles;
        this.audio = audio;
        this.world = world;
        this.meteors = [];
        this.isActive = false;
        this.timer = 0;
        
        this.geo = new THREE.DodecahedronGeometry(1.0);
        this.mat = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 0.8 });
    }

    startShower() {
        this.isActive = true;
        this.timer = 15.0; // lasts 15 seconds
    }

    update(dt, playerPos) {
        // Randomly start shower
        if (!this.isActive && Math.random() < dt * 0.005) { // 0.5% chance per second
            this.startShower();
        }

        if (this.isActive) {
            this.timer -= dt;
            if (this.timer <= 0) this.isActive = false;

            // Spawn meteors
            if (Math.random() < dt * 2.0) { // 2 meteors per second
                const mesh = new THREE.Mesh(this.geo, this.mat);
                const startPos = new THREE.Vector3(
                    playerPos.x + (Math.random() - 0.5) * 60,
                    playerPos.y + 80 + Math.random() * 20,
                    playerPos.z + (Math.random() - 0.5) * 60
                );
                mesh.position.copy(startPos);
                this.scene.add(mesh);
                
                // Add light
                const light = new THREE.PointLight(0xff4400, 2, 20);
                mesh.add(light);

                this.meteors.push({
                    mesh,
                    velocity: new THREE.Vector3((Math.random()-0.5)*10, -30 - Math.random()*20, (Math.random()-0.5)*10),
                    age: 0
                });
            }
        }

        // Update active meteors
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            m.age += dt;
            m.mesh.position.addScaledVector(m.velocity, dt);
            this.particles.emit(m.mesh.position, 'fire', 2, 0xffaa00);

            let hit = false;
            // Check world collision
            const bx = Math.floor(m.mesh.position.x);
            const by = Math.floor(m.mesh.position.y);
            const bz = Math.floor(m.mesh.position.z);
            if (by < 128 && by >= 0) {
                const type = this.world.getBlock(bx, by, bz);
                if (type !== BLOCKS.AIR && type !== BLOCKS.WATER && type !== BLOCKS.LAVA) {
                    hit = true;
                }
            }
            if (m.mesh.position.y < -10) hit = true;

            if (hit) {
                this.particles.emit(m.mesh.position, 'explosion', 30, 0xff4400);
                this.audio.playHit(); // pseudo explosion sound
                
                // Carve crater
                const radius = 2 + Math.floor(Math.random() * 2);
                for(let dx=-radius; dx<=radius; dx++) {
                    for(let dy=-radius; dy<=radius; dy++) {
                        for(let dz=-radius; dz<=radius; dz++) {
                            if (dx*dx + dy*dy + dz*dz <= radius*radius) {
                                if (this.world.getBlock(bx+dx, by+dy, bz+dz) !== BLOCKS.AIR) {
                                    this.world.setBlock(bx+dx, by+dy, bz+dz, BLOCKS.AIR);
                                }
                            }
                        }
                    }
                }
                
                // Drop something rare maybe
                if (Math.random() < 0.2) {
                    this.world.setBlock(bx, by-radius, bz, BLOCKS.GLOWSTONE);
                }

                this.scene.remove(m.mesh);
                m.mesh.geometry.dispose();
                m.mesh.material.dispose();
                this.meteors.splice(i, 1);
            }
        }
    }
}
