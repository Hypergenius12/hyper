// ============================================
// entities.js — Player, Mobs, Bosses, Inventory
// ============================================
import * as THREE from 'three';
import { CHUNK_HEIGHT, CHUNK_SIZE } from './constants.js';
import { generateRandomWand, generateRandomSpell, generateRandomModifier } from './magic.js';
import { getBlockProperties, BLOCKS, generateItemTexture, generateMobTexture, generatePlayerSkinTextures, createSteveBodyMaterials, getMobBoxMaterials, createExtrudedItemMesh } from './textures.js?v=92';

// Pre-allocated buffers for GC-free math
const _tempMin = new THREE.Vector3();
const _tempMax = new THREE.Vector3();
const _tempBox = new THREE.Box3();
const _tempRay = new THREE.Ray();
const _tempHit = new THREE.Vector3();
const _tempMoveDir = new THREE.Vector3();
const _tempVec1 = new THREE.Vector3();
const _tempVec2 = new THREE.Vector3();
const _tempVec3 = new THREE.Vector3();

// ============================================
// Inventory & Items
// ============================================
let itemIdCounter = 0;
export class Item {
    constructor(type, subtype, data = {}, name, desc) {
        this.type = type; // 'block' | 'wand' | 'spell' | 'modifier'
        this.subtype = subtype;
        this.data = data;
        this.name = name || 'Item';
        this.description = desc || '';
        this.stackable = type === 'block' || type === 'material' || type === 'food' || type === 'spawn_egg';
        this.maxStack = this.stackable ? 64 : 1;
        this.id = `item_${itemIdCounter++}`;
    }

    static blockItem(blockType, name) { return new Item('block', blockType, {}, name); }
    static wandItem(wand) { return new Item('wand', 'wand', { wand }, wand.name); }
    static spellItem(spell) { return new Item('spell', spell.type, { spell }, spell.name); }
    static modifierItem(mod) { return new Item('modifier', mod.type, { mod }, mod.name, mod.rarity); }
    static equipmentItem(subType, equipData, name, desc) { return new Item('equipment', subType, { equipData }, name, desc); }
    static materialItem(subType, name, desc) { return new Item('material', subType, {}, name, desc); }
    static foodItem(subType, healAmount, name, desc) { return new Item('food', subType, { heal: healAmount }, name, desc); }
    static spawnEggItem(subType, mobType, name, desc) { return new Item('spawn_egg', subType, { mobType }, name || `${mobType} Spawn Egg`, desc || 'Right-click to spawn mob'); }
}

export class Inventory {
    constructor() {
        this.slots = new Array(36).fill(null); // 0-8 is hotbar, 9-35 is main grid
        this.armor = new Array(4).fill(null); // Head, Chest, Legs, Boots
        this.offhand = null;
    }
    
    addItem(item, count = 1) {
        // Stackable items (not unique like wands)
        if (item.stackable) {
            for (let i = 0; i < this.slots.length; i++) {
                if (this.slots[i] && this.slots[i].item.type === item.type && this.slots[i].item.subtype === item.subtype) {
                    if (this.slots[i].count < item.maxStack) {
                        const add = Math.min(count, item.maxStack - this.slots[i].count);
                        this.slots[i].count += add;
                        count -= add;
                        if (count <= 0) return true;
                    }
                }
            }
        }
        // Find empty slot
        for (let i = 0; i < this.slots.length; i++) {
            if (!this.slots[i]) {
                this.slots[i] = { item, count };
                return true;
            }
        }
        return false;
    }
}

// ============================================
// Player
// ============================================
export class Player {
    constructor() {
        this.position = new THREE.Vector3(0, 100, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = { yaw: 0, pitch: 0 };
        
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 100;
        this.maxMana = 100;
        this.manaRegenRate = 5;

        this.inventory = new Inventory();
        this.selectedSlot = 0; // Index 0-8 in inventory
        this.equippedWand = null;

        this.grounded = false;
        this.sprinting = false;
        
        this.width = 0.6;
        this.height = 1.8;
        this.eyeHeight = 1.62;
        this.speedMult = 1.0;
        this.jumpSpeed = 9.0;

        // Give starting items
        const starterWand = generateRandomWand();
        starterWand.name = "Archmage Wand";
        starterWand.maxSlots = 8;
        starterWand.spellSlots = new Array(8).fill(null);
        starterWand.cooldowns = new Array(8).fill(0);
        
        // Load it up with some cool spells and modifiers
        const spell1 = generateRandomSpell();
        spell1.addModifier(generateRandomModifier());
        starterWand.equipSpell(0, spell1);
        
        const spell2 = generateRandomSpell();
        spell2.addModifier(generateRandomModifier());
        spell2.addModifier(generateRandomModifier());
        starterWand.equipSpell(1, spell2);
        
        starterWand.equipSpell(2, generateRandomSpell());

        this.inventory.addItem(Item.wandItem(starterWand));
        this.inventory.addItem(Item.blockItem(BLOCKS.TORCH, 'Torch'), 64);
        this.equippedWand = starterWand;
        this.burnTimer = 0;
        this.burnTickTimer = 0;
        this.naturalRegenTimer = 0;
        this.isCreative = false;
    }

    update(dt, keys, mouse, world, sensitivity = 0.002) {
        this.isCreative = !!(keys && keys._creativeMode);
        if (this.isCreative) {
            this.burnTimer = 0;
            this.burnTickTimer = 0;
            this.health = this.maxHealth;
        }

        // Mouse Look
        this.rotation.yaw -= mouse.dx * sensitivity;
        this.rotation.pitch -= mouse.dy * sensitivity;
        this.rotation.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.rotation.pitch));

        // Direction vectors
        const forward = _tempVec1.set(-Math.sin(this.rotation.yaw), 0, -Math.cos(this.rotation.yaw)).normalize();
        const right = _tempVec2.set(Math.cos(this.rotation.yaw), 0, -Math.sin(this.rotation.yaw)).normalize();
        // Equipment Effects
        let speedMult = 1.0;
        let flying = false;
        
        // Boots
        const boots = this.inventory.armor[3];
        if (boots && boots.item.data.equipData) {
            if (boots.item.data.equipData.speedMult) speedMult = boots.item.data.equipData.speedMult;
            if (boots.item.data.equipData.flying) flying = true;
        }
        if (keys && keys._creativeFlying) {
            flying = true;
        }

        // Creative mode movement speed boost
        if (this.isCreative) {
            if (flying) {
                speedMult *= (keys.sprint ? 5.5 : 4.0); // Super fast cruising speed when flying
            } else {
                speedMult *= 1.6; // Ground running boost
            }
        }

        // Apply speed bonus
        speedMult *= this.speedMult;

        // Crouch logic
        const NORMAL_HEIGHT = 1.8;
        const NORMAL_EYE = 1.62;
        const CROUCH_HEIGHT = 0.9;
        const CROUCH_EYE = 0.72;

        let shouldCrouch = keys.crouch;

        if (!shouldCrouch && this.height < NORMAL_HEIGHT) {
            // Check if we have headroom to stand up
            // Check for solid blocks in the space between our current head and the normal head
            const minX = Math.floor(this.position.x - this.width/2 + 0.01);
            const maxX = Math.floor(this.position.x + this.width/2 - 0.01);
            const minZ = Math.floor(this.position.z - this.width/2 + 0.01);
            const maxZ = Math.floor(this.position.z + this.width/2 - 0.01);
            const minY = Math.floor(this.position.y + this.height);
            const maxY = Math.floor(this.position.y + NORMAL_HEIGHT - 0.01);
            
            let headroomBlocked = false;
            for(let y=minY; y<=maxY; y++) {
                for(let x=minX; x<=maxX; x++) {
                    for(let z=minZ; z<=maxZ; z++) {
                        const block = world.getBlock(x,y,z);
                        const props = getBlockProperties(block);
                        if (props && props.solid) headroomBlocked = true;
                    }
                }
            }

            if (headroomBlocked) shouldCrouch = true; // Forced to stay crouched
        }

        if (shouldCrouch) {
            this.height = CROUCH_HEIGHT;
            this.eyeHeight = CROUCH_EYE;
            speedMult *= 0.5;
        } else {
            this.height = NORMAL_HEIGHT;
            this.eyeHeight = NORMAL_EYE;
        }

        // Movement input
        const speed = (keys.sprint && !shouldCrouch ? 9.5 : 6.0) * speedMult;
        let moveDir = _tempMoveDir.set(0,0,0);
        
        if (keys.forward) moveDir.add(forward);
        if (keys.backward) moveDir.sub(forward);
        if (keys.right) moveDir.add(right);
        if (keys.left) moveDir.sub(right);
        
        if (moveDir.lengthSq() > 0) moveDir.normalize();

        const blockIn = world.getBlock(this.position.x, this.position.y + 0.1, this.position.z);
        const blockProps = getBlockProperties(blockIn);
        const inWater = blockProps && (blockProps.isLiquid || blockProps.isWaterlogged) && blockIn !== BLOCKS.LAVA;
        this.inWater = inWater;
        const inLava = blockIn === BLOCKS.LAVA;
        const inFire = blockIn === BLOCKS.FIRE;
        const onLadder = blockIn === BLOCKS.LADDER;

        if (inWater) {
            this.burnTimer = 0;
        }

        if (!this.isCreative && (inLava || inFire)) {
            this.burnTimer = 5.0; // Stay burning as long as you're in it
            if (Math.random() < dt * 4) {
                this.takeDamage(inLava ? 5 : 2); // Initial intense damage
                const d = document.getElementById('damage-flash');
                if(d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
            }
        }

        if (!this.isCreative && this.burnTimer > 0) {
            this.burnTimer -= dt;
            this.burnTickTimer -= dt;
            if (this.burnTickTimer <= 0) {
                this.takeDamage(1); // take 1 damage per second
                const d = document.getElementById('damage-flash');
                if(d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                this.burnTickTimer = 1.0;
            }
        }

        // Physics variables
        // Make the player much more floaty in water (lower gravity)
        let gravity = (inWater || inLava) ? -1.5 : -25;
        let drag = (inWater || inLava) ? 6 : 10;
        let jumpForce = (inWater || inLava) ? 3.5 : 9;
        
        if (flying) {
            gravity = 0; // Zero gravity when flying
            drag = 12;   // Stop floating drift
        } else if (onLadder) {
            gravity = 0; // Cancel gravity on ladder
            drag = 15; // Higher drag so you stop quickly
        }

        // X/Z velocity update
        this.velocity.x += moveDir.x * speed * 10 * dt;
        this.velocity.z += moveDir.z * speed * 10 * dt;

        // Drag (friction)
        this.velocity.x -= this.velocity.x * drag * dt;
        this.velocity.z -= this.velocity.z * drag * dt;

        // Y velocity update (gravity)
        this.velocity.y += gravity * dt;

        // Jumping and Climbing
        if (onLadder) {
            if (keys.jump) {
                this.velocity.y = 3.5;
            } else if (keys.crouch) {
                this.velocity.y = -3.5;
            } else {
                this.velocity.y -= this.velocity.y * drag * dt; // Stop vertical movement if not climbing
            }
        } else if (flying) {
            if (keys.jump) {
                this.velocity.y = 12;
            } else if (keys.crouch) {
                this.velocity.y = -12;
            } else {
                this.velocity.y -= this.velocity.y * drag * dt;
            }
        } else if (keys.jump) {
            if (this.grounded) {
                this.velocity.y = this.jumpSpeed; // Normal jump force for regular ground
                this.grounded = false;
            } else if (inWater || inLava) {
                // Minecraft-style liquid swimming: apply upward acceleration instead of instant snap
                this.velocity.y += 18 * dt;
                // Cap upward velocity so we don't shoot out of the water like a rocket
                if (this.velocity.y > 4.5) this.velocity.y = 4.5;
            }
        }

        // Collision
        const velStep = this.velocity.clone().multiplyScalar(dt);
        const colResult = world.collide(this.position, velStep, this.width, this.height, keys.crouch && this.grounded);
        
        // Update state based on collision
        this.position.copy(colResult.position);
        if (colResult.velocity.y === 0 && this.velocity.y < 0) this.grounded = true;
        else this.grounded = false;

        if (colResult.velocity.x === 0) this.velocity.x = 0;
        if (colResult.velocity.z === 0) this.velocity.z = 0;
        if (colResult.velocity.y === 0) this.velocity.y = 0;

        // Anti-stuck / spawn safety: if player is embedded inside solid blocks, nudge upward to open air
        if (world && !flying) {
            const hw = this.width / 2;
            const minX = Math.floor(this.position.x - hw + 0.05);
            const maxX = Math.floor(this.position.x + hw - 0.05);
            const minZ = Math.floor(this.position.z - hw + 0.05);
            const maxZ = Math.floor(this.position.z + hw - 0.05);
            const minY = Math.floor(this.position.y);
            const maxY = Math.floor(this.position.y + this.height - 0.05);

            let isStuck = false;
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        const b = world.getBlock(x, y, z);
                        if (getBlockProperties(b).solid) {
                            if (!(b === window.BLOCKS.DUNGEON_DOOR && world.isDoorOpen && world.isDoorOpen(x, y, z))) {
                                isStuck = true;
                                break;
                            }
                        }
                    }
                    if (isStuck) break;
                }
                if (isStuck) break;
            }

            if (isStuck) {
                // Find next clear vertical space above player
                for (let step = 1; step <= 30; step++) {
                    const testY = Math.floor(this.position.y) + step;
                    let clear = true;
                    for (let y = testY; y <= testY + 1; y++) {
                        for (let x = minX; x <= maxX; x++) {
                            for (let z = minZ; z <= maxZ; z++) {
                                const b = world.getBlock(x, y, z);
                                if (getBlockProperties(b).solid) {
                                    clear = false;
                                    break;
                                }
                            }
                            if (!clear) break;
                        }
                        if (!clear) break;
                    }
                    if (clear) {
                        this.position.y = testY + 0.02;
                        this.velocity.y = 0;
                        break;
                    }
                }
            }
        }

        // Fall clamp
        if (this.velocity.y < -50) this.velocity.y = -50;

        // Void damage (except in Aether where falling drops into the Overworld sky)
        if (!this.isCreative && this.position.y < -10 && (!world || world.dimension !== 'aether')) {
            this.takeDamage(1000);
        }

        // Natural very slow health regeneration (5 HP / half-heart every 4 seconds)
        if (!this.isCreative && this.health > 0 && this.health < this.maxHealth) {
            this.naturalRegenTimer = (this.naturalRegenTimer || 0) + dt;
            if (this.naturalRegenTimer >= 4.0) {
                this.naturalRegenTimer = 0;
                this.health = Math.min(this.maxHealth, this.health + 5);
            }
        } else if (this.isCreative) {
            this.health = this.maxHealth;
            this.naturalRegenTimer = 0;
        } else {
            this.naturalRegenTimer = 0;
        }

        // Mana regen
        if (this.mana < this.maxMana) {
            this.mana += this.manaRegenRate * dt;
            if (this.mana > this.maxMana) this.mana = this.maxMana;
        }

        // Update wand cooldowns
        for (let i = 0; i < this.inventory.slots.length; i++) {
            const slot = this.inventory.slots[i];
            if (slot && slot.item && slot.item.type === 'wand' && slot.item.data && slot.item.data.wand) {
                if (typeof slot.item.data.wand.updateCooldowns === 'function') {
                    slot.item.data.wand.updateCooldowns(dt);
                }
            }
        }

        // Animate Player 3D Character Model
        this.updatePlayerModel(dt, keys);
    }

    createPlayerMesh(assignToPlayer = true) {
        const group = new THREE.Group();
        group.name = 'playerCharacterModel';

        const headMats = createSteveBodyMaterials('head');
        const torsoMats = createSteveBodyMaterials('torso');
        const leftArmMats = createSteveBodyMaterials('leftArm');
        const rightArmMats = createSteveBodyMaterials('rightArm');
        const leftLegMats = createSteveBodyMaterials('leftLeg');
        const rightLegMats = createSteveBodyMaterials('rightLeg');

        // Head Group (pivot at neck y=1.45)
        const headPivot = new THREE.Group();
        headPivot.name = 'head';
        headPivot.position.set(0, 1.45, 0);

        // Head mesh (0.4 x 0.4 x 0.4)
        // In Three.js BoxGeometry face mapping:
        // [4]: +Z (Back of head / hair, facing backward)
        // [5]: -Z (Front face of Steve, facing forward!)
        const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const headMesh = new THREE.Mesh(headGeo, headMats);
        headMesh.position.set(0, 0.2, 0);
        headMesh.rotation.y = 0; // Face faces forward (-Z), NOT on back of head!
        headMesh.castShadow = true;
        headPivot.add(headMesh);

        // Armor: Helmet (open-faced cap with sides, forehead brow, and nose bridge so face remains visible)
        const helmetGroup = new THREE.Group();
        helmetGroup.name = 'armor_helmet';
        const helmetMat = new THREE.MeshLambertMaterial({ color: 0xdcdcdc, emissive: 0x333333 });
        // Helmet top
        const hTop = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.46), helmetMat);
        hTop.position.set(0, 0.39, 0);
        helmetGroup.add(hTop);
        // Helmet back
        const hBack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.08), helmetMat);
        hBack.position.set(0, 0.22, 0.19);
        helmetGroup.add(hBack);
        // Helmet left side
        const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.44), helmetMat);
        hLeft.position.set(-0.19, 0.22, 0.01);
        helmetGroup.add(hLeft);
        // Helmet right side
        const hRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.44), helmetMat);
        hRight.position.set(0.19, 0.22, 0.01);
        helmetGroup.add(hRight);
        // Helmet forehead visor / brow band
        const hBrow = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.10, 0.08), helmetMat);
        hBrow.position.set(0, 0.33, -0.19);
        helmetGroup.add(hBrow);
        // Helmet nose bridge ridge
        const hNose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), helmetMat);
        hNose.position.set(0, 0.21, -0.19);
        helmetGroup.add(hNose);
        helmetGroup.visible = false;
        headPivot.add(helmetGroup);

        group.add(headPivot);

        // Torso (0.45 x 0.65 x 0.25, centered at y=1.05)
        const torsoGeo = new THREE.BoxGeometry(0.45, 0.65, 0.25);
        const torso = new THREE.Mesh(torsoGeo, torsoMats);
        torso.name = 'torso';
        torso.position.set(0, 1.05, 0);
        torso.castShadow = true;

        // Armor: Chestplate Torso
        const chestGeo = new THREE.BoxGeometry(0.52, 0.68, 0.32);
        const chestMat = new THREE.MeshLambertMaterial({ color: 0xdcdcdc, emissive: 0x333333 });
        const chestMesh = new THREE.Mesh(chestGeo, chestMat);
        chestMesh.name = 'armor_chest';
        chestMesh.visible = false;
        torso.add(chestMesh);

        // Armor: Leggings Belt / Hip Guard (sits around lower waist)
        const leggingsMat = new THREE.MeshLambertMaterial({ color: 0xdcdcdc, emissive: 0x333333 });
        const beltArmorGeo = new THREE.BoxGeometry(0.49, 0.22, 0.29);
        const beltArmor = new THREE.Mesh(beltArmorGeo, leggingsMat);
        beltArmor.name = 'armor_legs_belt';
        beltArmor.position.set(0, -0.24, 0);
        beltArmor.visible = false;
        torso.add(beltArmor);

        group.add(torso);

        // Left Arm (pivot at shoulder y=1.35, x=-0.32)
        const leftArmPivot = new THREE.Group();
        leftArmPivot.name = 'leftArm';
        leftArmPivot.position.set(-0.32, 1.35, 0);

        const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
        const leftArmMesh = new THREE.Mesh(armGeo, leftArmMats);
        leftArmMesh.position.set(0, -0.28, 0);
        leftArmMesh.castShadow = true;
        leftArmPivot.add(leftArmMesh);

        // Armor: Left Arm Pauldron / Sleeve (part of Chestplate)
        const armArmorGeo = new THREE.BoxGeometry(0.24, 0.36, 0.24);
        const leftArmArmor = new THREE.Mesh(armArmorGeo, chestMat);
        leftArmArmor.name = 'armor_chest_l_arm';
        leftArmArmor.position.set(0, -0.14, 0);
        leftArmArmor.visible = false;
        leftArmPivot.add(leftArmArmor);

        group.add(leftArmPivot);

        // Right Arm (pivot at shoulder y=1.35, x=0.32)
        const rightArmPivot = new THREE.Group();
        rightArmPivot.name = 'rightArm';
        rightArmPivot.position.set(0.32, 1.35, 0);

        const rightArmMesh = new THREE.Mesh(armGeo, rightArmMats);
        rightArmMesh.position.set(0, -0.28, 0);
        rightArmMesh.castShadow = true;
        rightArmPivot.add(rightArmMesh);

        // Armor: Right Arm Pauldron / Sleeve (part of Chestplate)
        const rightArmArmor = new THREE.Mesh(armArmorGeo, chestMat);
        rightArmArmor.name = 'armor_chest_r_arm';
        rightArmArmor.position.set(0, -0.14, 0);
        rightArmArmor.visible = false;
        rightArmPivot.add(rightArmArmor);

        group.add(rightArmPivot);

        // Left Leg (pivot at hip y=0.72, x=-0.12)
        const leftLegPivot = new THREE.Group();
        leftLegPivot.name = 'leftLeg';
        leftLegPivot.position.set(-0.12, 0.72, 0);

        const legGeo = new THREE.BoxGeometry(0.2, 0.72, 0.2);
        const leftLegMesh = new THREE.Mesh(legGeo, leftLegMats);
        leftLegMesh.position.set(0, -0.36, 0);
        leftLegMesh.castShadow = true;
        leftLegPivot.add(leftLegMesh);

        // Armor: Left Leggings piece
        const legArmorGeo = new THREE.BoxGeometry(0.25, 0.48, 0.25);
        const leftLegArmor = new THREE.Mesh(legArmorGeo, leggingsMat);
        leftLegArmor.name = 'armor_legs_l';
        leftLegArmor.position.set(0, -0.22, 0);
        leftLegArmor.visible = false;
        leftLegPivot.add(leftLegArmor);

        // Armor: Left Boot
        const bootsMat = new THREE.MeshLambertMaterial({ color: 0xdcdcdc, emissive: 0x333333 });
        const bootGeo = new THREE.BoxGeometry(0.26, 0.26, 0.28);
        const leftBoot = new THREE.Mesh(bootGeo, bootsMat);
        leftBoot.name = 'armor_boots_l';
        leftBoot.position.set(0, -0.59, -0.01);
        leftBoot.visible = false;
        leftLegPivot.add(leftBoot);

        group.add(leftLegPivot);

        // Right Leg (pivot at hip y=0.72, x=0.12)
        const rightLegPivot = new THREE.Group();
        rightLegPivot.name = 'rightLeg';
        rightLegPivot.position.set(0.12, 0.72, 0);

        const rightLegMesh = new THREE.Mesh(legGeo, rightLegMats);
        rightLegMesh.position.set(0, -0.36, 0);
        rightLegMesh.castShadow = true;
        rightLegPivot.add(rightLegMesh);

        // Armor: Right Leggings piece
        const rightLegArmor = new THREE.Mesh(legArmorGeo, leggingsMat);
        rightLegArmor.name = 'armor_legs_r';
        rightLegArmor.position.set(0, -0.22, 0);
        rightLegArmor.visible = false;
        rightLegPivot.add(rightLegArmor);

        // Armor: Right Boot
        const rightBoot = new THREE.Mesh(bootGeo, bootsMat);
        rightBoot.name = 'armor_boots_r';
        rightBoot.position.set(0, -0.59, -0.01);
        rightBoot.visible = false;
        rightLegPivot.add(rightBoot);

        group.add(rightLegPivot);

        if (assignToPlayer) {
            this.mesh = group;
        }
        return group;
    }

    updatePlayerModel(dt, keys) {
        if (!this.mesh) return;

        // Position model directly at player feet coordinates
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation.yaw; // Face forward along look direction

        // Head pitch look
        const head = this.mesh.getObjectByName('head');
        if (head) {
            head.rotation.x = this.rotation.pitch;
        }

        // Walk animation
        const isMoving = keys && (keys.forward || keys.backward || keys.left || keys.right);
        const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        if (isMoving || horizontalSpeed > 0.5) {
            this.walkPhase = (this.walkPhase || 0) + dt * (keys.sprint ? 14 : 9);
        } else {
            // Decay to rest
            this.walkPhase = (this.walkPhase || 0) * Math.pow(0.05, dt * 8);
        }

        const swing = Math.sin(this.walkPhase || 0) * 0.7;
        const leftArm = this.mesh.getObjectByName('leftArm');
        const rightArm = this.mesh.getObjectByName('rightArm');
        const leftLeg = this.mesh.getObjectByName('leftLeg');
        const rightLeg = this.mesh.getObjectByName('rightLeg');

        if (leftLeg) leftLeg.rotation.x = -swing;
        if (rightLeg) rightLeg.rotation.x = swing;
        if (leftArm) leftArm.rotation.x = swing;

        // Animate Steve's right arm with swing arc during mining/attacking
        if (rightArm) {
            if (this.isSwinging && this.swingProgress !== undefined) {
                // Minecraft attack/mining swing: raise up and chop forward
                const s = Math.sin(this.swingProgress * Math.PI);
                rightArm.rotation.x = -Math.PI / 2.5 * s - (1 - s) * swing;
                rightArm.rotation.y = -Math.PI / 6 * s;
                rightArm.rotation.z = Math.PI / 8 * s;
            } else {
                rightArm.rotation.set(-swing, 0, 0);
            }
        }

        // Sync held item mesh on Steve's right hand in 3rd person
        this.syncHeldItemDisplay(this.mesh);

        // Sync armor visibility and colors
        this.syncArmorDisplay(this.mesh);
    }

    syncHeldItemDisplay(targetModel) {
        if (!targetModel) return;
        const rightArm = targetModel.getObjectByName('rightArm');
        if (!rightArm) return;

        let heldContainer = rightArm.getObjectByName('heldItemContainer');
        if (!heldContainer) {
            heldContainer = new THREE.Group();
            heldContainer.name = 'heldItemContainer';
            // Position at Steve's hand (bottom of arm)
            heldContainer.position.set(0, -0.32, 0.05);
            rightArm.add(heldContainer);
        }

        const slot = this.inventory ? this.inventory.slots[this.selectedSlot] : null;
        if (!slot) {
            heldContainer.clear();
            heldContainer.userData.currentSubtype = null;
            return;
        }

        const currentKey = `${slot.item.type}_${slot.item.subtype}`;
        if (heldContainer.userData.currentKey === currentKey) return;

        heldContainer.clear();
        heldContainer.userData.currentKey = currentKey;

        if (slot.item.type === 'block') {
            const atlas = window.game && window.game.atlas;
            const blockProps = getBlockProperties ? getBlockProperties(slot.item.subtype) : {};
            if (atlas) {
                const mat = new THREE.MeshLambertMaterial({
                    map: atlas.texture,
                    alphaTest: 0.5,
                    transparent: blockProps.transparent || blockProps.isCross || false,
                    side: blockProps.isCross ? THREE.DoubleSide : THREE.FrontSide
                });

                if (blockProps.isCross || slot.item.subtype === BLOCKS.TORCH) {
                    const geom = new THREE.BufferGeometry();
                    const s = 0.12;
                    const positions = [
                        -s, -s, -s, s, -s, s, s, s, s, -s, s, -s,
                        -s, -s, s, s, -s, -s, s, s, -s, -s, s, s
                    ];
                    const uvInfo = atlas.getUV(slot.item.subtype, 'side');
                    const uvs = [];
                    for (let i = 0; i < 2; i++) {
                        uvs.push(uvInfo.u, uvInfo.v, uvInfo.u + uvInfo.uSize, uvInfo.v, uvInfo.u + uvInfo.uSize, uvInfo.v + uvInfo.vSize, uvInfo.u, uvInfo.v + uvInfo.vSize);
                    }
                    const indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7];
                    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                    geom.setIndex(indices);
                    geom.computeVertexNormals();
                    const m = new THREE.Mesh(geom, mat);
                    heldContainer.add(m);
                } else {
                    const geom = new THREE.BoxGeometry(0.25, 0.25, 0.25).toNonIndexed();
                    const uvs = geom.attributes.uv.array;
                    const faceNames = ['side', 'side', 'top', 'bottom', 'side', 'side'];
                    for (let i = 0; i < 6; i++) {
                        const uvInfo = atlas.getUV(slot.item.subtype, faceNames[i]);
                        for (let v = 0; v < 6; v++) {
                            const baseU = uvs[i * 12 + v * 2];
                            const baseV = uvs[i * 12 + v * 2 + 1];
                            uvs[i * 12 + v * 2] = uvInfo.u + baseU * uvInfo.uSize;
                            uvs[i * 12 + v * 2 + 1] = uvInfo.v + baseV * uvInfo.vSize;
                        }
                    }
                    const m = new THREE.Mesh(geom, mat);
                    m.rotation.set(Math.PI / 8, -Math.PI / 4, 0);
                    heldContainer.add(m);
                }
            }
            return;
        }

        const safeSubtype = String(slot.item.subtype || '');
        const iconCanvas = generateItemTexture(slot.item.type, safeSubtype, (c) => {
            if (heldContainer.userData.currentKey === currentKey) {
                heldContainer.clear();
                const m = createExtrudedItemMesh(c, 0.45, 0.035);
                m.rotation.set(Math.PI / 4, 0, -Math.PI / 4);
                heldContainer.add(m);
            }
        });

        const mesh = createExtrudedItemMesh(iconCanvas, 0.45, 0.035);
        mesh.rotation.set(Math.PI / 4, 0, -Math.PI / 4);
        heldContainer.add(mesh);
    }

    syncArmorDisplay(targetModel) {
        if (!targetModel) return;

        const getArmorColor = (item) => {
            if (!item || !item.subtype) return 0xdcdcdc;
            const sub = item.subtype.toLowerCase();
            if (sub.includes('diamond')) return 0x33ebcb;
            if (sub.includes('gold')) return 0xffd700;
            if (sub.includes('iron')) return 0xdcdcdc;
            if (sub.includes('netherite')) return 0x3b3337;
            if (sub.includes('ruby')) return 0xe0115f;
            if (sub.includes('sapphire')) return 0x1e60ff;
            if (sub.includes('zanite')) return 0x9d4edd;
            if (sub.includes('leather')) return 0x93512b;
            return 0xdcdcdc;
        };

        const applyColor = (mesh, hexColor) => {
            if (!mesh) return;
            mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    if (child.material.color) child.material.color.setHex(hexColor);
                    if (child.material.emissive) child.material.emissive.setHex(hexColor).multiplyScalar(0.25);
                }
            });
        };

        const helmet = this.inventory.armor[0];
        const chest = this.inventory.armor[1];
        const legs = this.inventory.armor[2];
        const boots = this.inventory.armor[3];

        // 1. Helmet
        const helmetMesh = targetModel.getObjectByName('armor_helmet');
        if (helmetMesh) {
            helmetMesh.visible = !!helmet;
            if (helmet) applyColor(helmetMesh, getArmorColor(helmet.item));
        }

        // 2. Chestplate (Torso + Arm Pauldrons)
        const chestMesh = targetModel.getObjectByName('armor_chest');
        const chestArmL = targetModel.getObjectByName('armor_chest_l_arm');
        const chestArmR = targetModel.getObjectByName('armor_chest_r_arm');
        const hasChest = !!chest;
        if (chestMesh) {
            chestMesh.visible = hasChest;
            if (hasChest) applyColor(chestMesh, getArmorColor(chest.item));
        }
        if (chestArmL) {
            chestArmL.visible = hasChest;
            if (hasChest) applyColor(chestArmL, getArmorColor(chest.item));
        }
        if (chestArmR) {
            chestArmR.visible = hasChest;
            if (hasChest) applyColor(chestArmR, getArmorColor(chest.item));
        }

        // 3. Leggings (Belt/Hips + Left Leg + Right Leg)
        const beltMesh = targetModel.getObjectByName('armor_legs_belt');
        const legsL = targetModel.getObjectByName('armor_legs_l');
        const legsR = targetModel.getObjectByName('armor_legs_r');
        const hasLegs = !!legs;
        if (beltMesh) {
            beltMesh.visible = hasLegs;
            if (hasLegs) applyColor(beltMesh, getArmorColor(legs.item));
        }
        if (legsL && legsR) {
            legsL.visible = hasLegs;
            legsR.visible = hasLegs;
            if (hasLegs) {
                const col = getArmorColor(legs.item);
                applyColor(legsL, col);
                applyColor(legsR, col);
            }
        }

        // 4. Boots
        const bootsL = targetModel.getObjectByName('armor_boots_l');
        const bootsR = targetModel.getObjectByName('armor_boots_r');
        const hasBoots = !!boots;
        if (bootsL && bootsR) {
            bootsL.visible = hasBoots;
            bootsR.visible = hasBoots;
            if (hasBoots) {
                const col = getArmorColor(boots.item);
                applyColor(bootsL, col);
                applyColor(bootsR, col);
            }
        }
    }

    getEyePosition() {
        return new THREE.Vector3(this.position.x, this.position.y + this.eyeHeight, this.position.z);
    }

    getLookDirection() {
        return new THREE.Vector3(
            -Math.sin(this.rotation.yaw) * Math.cos(this.rotation.pitch),
            Math.sin(this.rotation.pitch),
            -Math.cos(this.rotation.yaw) * Math.cos(this.rotation.pitch)
        ).normalize();
    }

    takeDamage(amt) {
        if (this.isCreative) return false;
        if (this.health <= 0) return true;
        
        let protection = 0;
        // Sum protection from armor slots
        for (let i = 0; i < 4; i++) {
            const piece = this.inventory.armor[i];
            if (piece && piece.item.data.equipData && piece.item.data.equipData.protection) {
                protection += piece.item.data.equipData.protection;
            }
        }
        
        const damageTaken = Math.max(0.5, amt - protection);
        this.health -= damageTaken;
        return this.health <= 0;
    }

    useMana(amt) {
        if (this.mana >= amt) {
            this.mana -= amt;
            return true;
        }
        return false;
    }
}

// ============================================
// Helper: Build mob body parts
// ============================================

function createMobMaterial(color, emissive = 0x000000, emissiveIntensity = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    // Fill base
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 16, 16);
    
    // Add noise
    const imgData = ctx.getImageData(0, 0, 16, 16);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() - 0.5) * 40;
        d[i] = Math.max(0, Math.min(255, d[i] + v));
        d[i+1] = Math.max(0, Math.min(255, d[i+1] + v));
        d[i+2] = Math.max(0, Math.min(255, d[i+2] + v));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    return new THREE.MeshLambertMaterial({ map: texture, emissive, emissiveIntensity });
}

const mobTextureCache = {};
function getMobMaterial(type, part = 'body') {
    const key = `${type}_${part}`;
    if (!mobTextureCache[key]) {
        let tex;
        const updateTex = (canvas) => {
            if (tex) {
                tex.image = canvas;
                tex.needsUpdate = true;
            }
        };
        const cvs = generateMobTexture(type, part, updateTex);
        tex = new THREE.CanvasTexture(cvs);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        mobTextureCache[key] = new THREE.MeshLambertMaterial({ map: tex });
    }
    return mobTextureCache[key];
}

const mobHeadCache = {};
function getMobHeadMaterials(type) {
    if (!mobHeadCache[type]) {
        const sideMat = getMobMaterial(type, 'head_side');
        const topMat = getMobMaterial(type, 'head_top');
        const bottomMat = getMobMaterial(type, 'head_bottom');
        const frontMat = getMobMaterial(type, 'head_front');
        const backMat = getMobMaterial(type, 'head_back');
        // Three.js BoxGeometry face mapping: [+X, -X, +Y, -Y, +Z, -Z]
        mobHeadCache[type] = [sideMat, sideMat, topMat, bottomMat, frontMat, backMat];
    }
    return mobHeadCache[type];
}

function createMobHead(geo, mobType) {
    const mats = getMobHeadMaterials(mobType);
    const mesh = new THREE.Mesh(geo, mats);
    mesh.castShadow = true;
    return mesh;
}

function createBodyPart(geo, colorOrType, emissive = 0x000000, emissiveIntensity = 0, part = 'body') {
    let mat;
    if (typeof colorOrType === 'string') {
        mat = getMobMaterial(colorOrType, part);
        if (emissive !== 0x000000) {
            mat = mat.clone();
            mat.emissive = new THREE.Color(emissive);
            mat.emissiveIntensity = emissiveIntensity;
        }
    } else {
        mat = createMobMaterial(colorOrType, emissive, emissiveIntensity);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
}

// ============================================
// Mob Type Definitions (Enhanced)
// ============================================

export const MOB_TYPES = {
    COW: {
        name: 'Cow', health: 20, damage: 0, speed: 1.5, hostile: false, color: 0xffffff,
        size: 0.9, xpDrop: 4, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Cow Body: Box (12, 18, 10) in MC coords -> (0.75, 0.625, 1.125)
            // Vanilla MC Cow Body UV: { u: 18, v: 4, w: 12, h: 18, d: 10 }
            const cowBodyFaceUVs = {
                top: [28, 14, 12, 18],
                bottom: [50, 14, 12, 18],
                front: [28, 4, 12, 10],
                back: [40, 4, 12, 10],
                right: [18, 14, 10, 18],
                left: [40, 14, 10, 18]
            };
            const bodyGeo = new THREE.BoxGeometry(0.75, 0.625, 1.125);
            const bodyMats = getMobBoxMaterials('COW', { u: 18, v: 4, w: 12, h: 18, d: 10 }, { part: 'body', faceUVs: cowBodyFaceUVs });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.y = 0.55;
            body.castShadow = true;
            group.add(body);

            // Udder: Vanilla MC Udder UV: { u: 52, v: 0, w: 4, h: 6, d: 2 }
            const udderGeo = new THREE.BoxGeometry(0.25, 0.12, 0.35);
            const udderMats = getMobBoxMaterials('COW', { u: 52, v: 0, w: 4, h: 6, d: 2 }, { part: 'snout' });
            const udder = new THREE.Mesh(udderGeo, udderMats);
            udder.position.set(0, 0.21, -0.2);
            udder.castShadow = true;
            group.add(udder);

            // Head (faces +Z forward): Vanilla MC Cow Head UV: { u: 0, v: 0, w: 8, h: 8, d: 6 }
            const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.375);
            const headMats = getMobBoxMaterials('COW', { u: 0, v: 0, w: 8, h: 8, d: 6 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.8, 0.65);
            head.name = 'head';
            head.castShadow = true;
            group.add(head);

            // Horns: Vanilla MC Horn UV: { u: 22, v: 0, w: 1, h: 3, d: 1 }
            const hornGeo = new THREE.BoxGeometry(0.08, 0.18, 0.08);
            const hornMats = getMobBoxMaterials('COW', { u: 22, v: 0, w: 1, h: 3, d: 1 }, { part: 'horn' });
            const leftHorn = new THREE.Mesh(hornGeo, hornMats);
            leftHorn.position.set(-0.25, 1.05, 0.62);
            leftHorn.rotation.z = 0.15;
            group.add(leftHorn);
            const rightHorn = new THREE.Mesh(hornGeo, hornMats);
            rightHorn.position.set(0.25, 1.05, 0.62);
            rightHorn.rotation.z = -0.15;
            group.add(rightHorn);

            // 4 Legs: Vanilla MC Cow Leg UV: { u: 0, v: 16, w: 4, h: 12, d: 4 }
            const legGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);
            const legMats = getMobBoxMaterials('COW', { u: 0, v: 16, w: 4, h: 12, d: 4 }, { part: 'leg' });
            for(let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeo, legMats);
                const x = (i % 2 === 0 ? -0.26 : 0.26);
                const z = (i < 2 ? 0.38 : -0.38);
                leg.position.set(x, 0.25, z);
                leg.name = `leg_${i}`;
                leg.castShadow = true;
                group.add(leg);
            }
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const leg0 = mesh.getObjectByName('leg_0');
            const leg1 = mesh.getObjectByName('leg_1');
            const leg2 = mesh.getObjectByName('leg_2');
            const leg3 = mesh.getObjectByName('leg_3');
            const head = mesh.getObjectByName('head');
            if (!isMoving) {
                if (leg0) leg0.rotation.x = 0;
                if (leg1) leg1.rotation.x = 0;
                if (leg2) leg2.rotation.x = 0;
                if (leg3) leg3.rotation.x = 0;
                if (head) head.rotation.y = Math.sin(age * 1.5) * 0.05;
            } else {
                const swing = Math.sin(age * 7) * 0.45;
                if (leg0) leg0.rotation.x = swing;
                if (leg1) leg1.rotation.x = -swing;
                if (leg2) leg2.rotation.x = -swing;
                if (leg3) leg3.rotation.x = swing;
                if (head) head.rotation.y = 0;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            if (mob.health < mob.maxHealth) {
                const fleeDir = _tempVec3.subVectors(mob.position, playerPos).normalize();
                fleeDir.y = 0;
                mob.velocity.x = fleeDir.x * mob.speed * 1.5;
                mob.velocity.z = fleeDir.z * mob.speed * 1.5;
                if (mob.mesh) mob.mesh.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);
            } else {
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    if (Math.random() < 0.3) {
                        mob.wanderTimer = 2 + Math.random() * 4;
                        const angle = Math.random() * Math.PI * 2;
                        mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                    } else {
                        mob.wanderTimer = 4 + Math.random() * 5;
                        mob.wanderDir.set(0, 0, 0);
                    }
                }
                mob.velocity.x = mob.wanderDir.x * mob.speed * 0.3;
                mob.velocity.z = mob.wanderDir.z * mob.speed * 0.3;
                if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }
        }
    },
    SHEEP: {
        name: 'Sheep', health: 15, damage: 0, speed: 2.5, hostile: false, color: 0xffffff,
        size: 0.8, xpDrop: 2, lootChance: 1.0,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Sheep Body (Fleece Wool coat)
            // Vanilla MC Sheep Wool body UV: { u: 28, v: 8, w: 12, h: 16, d: 8 }
            const sheepBodyFaceUVs = {
                top: [36, 16, 12, 16],
                bottom: [56, 16, 12, 16],
                front: [36, 8, 12, 8],
                back: [48, 8, 12, 8],
                right: [28, 16, 8, 16],
                left: [48, 16, 8, 16]
            };
            const bodyGeo = new THREE.BoxGeometry(0.75, 0.5, 1.0);
            const bodyMats = getMobBoxMaterials('SHEEP', { u: 28, v: 8, w: 12, h: 16, d: 8 }, { skinKey: 'sheep/sheep_fur.png', part: 'body', faceUVs: sheepBodyFaceUVs });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.y = 0.55;
            body.castShadow = true;
            group.add(body);

            // Head (faces +Z forward): Vanilla MC Sheep Head UV: { u: 0, v: 0, w: 6, h: 6, d: 8 } on sheep.png skin
            const headGeo = new THREE.BoxGeometry(0.375, 0.375, 0.5);
            const headMats = getMobBoxMaterials('SHEEP', { u: 0, v: 0, w: 6, h: 6, d: 8 }, { skinKey: 'sheep/sheep.png', part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.72, 0.6);
            head.name = 'head';
            head.castShadow = true;
            group.add(head);

            // 4 Legs: Vanilla MC Sheep Leg UV: { u: 0, v: 16, w: 4, h: 12, d: 4 } on sheep.png skin
            const legGeo = new THREE.BoxGeometry(0.2, 0.45, 0.2);
            const legMats = getMobBoxMaterials('SHEEP', { u: 0, v: 16, w: 4, h: 12, d: 4 }, { skinKey: 'sheep/sheep.png', part: 'leg' });
            for(let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeo, legMats);
                const x = (i % 2 === 0 ? -0.26 : 0.26);
                const z = (i < 2 ? 0.35 : -0.35);
                leg.position.set(x, 0.225, z);
                leg.name = `leg_${i}`;
                leg.castShadow = true;
                group.add(leg);
            }
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const leg0 = mesh.getObjectByName('leg_0');
            const leg1 = mesh.getObjectByName('leg_1');
            const leg2 = mesh.getObjectByName('leg_2');
            const leg3 = mesh.getObjectByName('leg_3');
            if (!isMoving) {
                if (leg0) leg0.rotation.x = 0;
                if (leg1) leg1.rotation.x = 0;
                if (leg2) leg2.rotation.x = 0;
                if (leg3) leg3.rotation.x = 0;
            } else {
                const swing = Math.sin(age * 8) * 0.4;
                if (leg0) leg0.rotation.x = swing;
                if (leg1) leg1.rotation.x = -swing;
                if (leg2) leg2.rotation.x = -swing;
                if (leg3) leg3.rotation.x = swing;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            if (mob.health < mob.maxHealth) {
                const fleeDir = _tempVec3.subVectors(mob.position, playerPos).normalize();
                fleeDir.y = 0;
                mob.velocity.x = fleeDir.x * mob.speed * 2.0;
                mob.velocity.z = fleeDir.z * mob.speed * 2.0;
                if (mob.mesh) mob.mesh.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);
            } else {
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    if (Math.random() < 0.4) {
                        mob.wanderTimer = 1.5 + Math.random() * 3;
                        const angle = Math.random() * Math.PI * 2;
                        mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                    } else {
                        mob.wanderTimer = 3 + Math.random() * 4;
                        mob.wanderDir.set(0, 0, 0);
                    }
                }
                mob.velocity.x = mob.wanderDir.x * mob.speed * 0.4;
                mob.velocity.z = mob.wanderDir.z * mob.speed * 0.4;
                if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }
        }
    },
    SLIME: {
        name: 'Slime', health: 20, damage: 5, speed: 2.2, hostile: true, color: 0x44cc44,
        size: 0.65, xpDrop: 5, lootChance: 0.3,
        buildMesh: () => {
            const group = new THREE.Group();
            // Outer translucent slime cube (exact Minecraft proportions)
            const outerGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            const outer = createBodyPart(outerGeo, 'SLIME');
            outer.position.y = 0.3;
            outer.material.transparent = true;
            outer.material.opacity = 0.65;
            outer.name = 'outer';
            group.add(outer);

            // Inner solid core cube
            const coreGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
            const core = createBodyPart(coreGeo, 'SLIME');
            core.position.y = 0.28;
            core.name = 'core';
            group.add(core);

            // Eyes on inner core face (+Z)
            const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0a240a });
            const le = new THREE.Mesh(eyeGeo, eyeMat);
            le.position.set(-0.1, 0.34, 0.17);
            le.name = 'le';
            group.add(le);

            const re = new THREE.Mesh(eyeGeo, eyeMat);
            re.position.set(0.1, 0.34, 0.17);
            re.name = 're';
            group.add(re);

            // Mouth
            const mouthGeo = new THREE.BoxGeometry(0.06, 0.04, 0.02);
            const mouth = new THREE.Mesh(mouthGeo, eyeMat);
            mouth.position.set(0, 0.22, 0.17);
            mouth.name = 'mouth';
            group.add(mouth);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            // Authentic Minecraft hop & squash/stretch
            const cycle = (age * 3.5) % Math.PI;
            const isJumping = Math.sin(cycle) > 0.1;
            const stretch = isJumping ? 1.0 + Math.sin(cycle) * 0.3 : 1.0;
            const squish = isJumping ? 1.0 / Math.sqrt(stretch) : 1.0 + Math.abs(Math.sin(age * 7)) * 0.15;
            
            const outer = mesh.getObjectByName('outer');
            const core = mesh.getObjectByName('core');
            if (outer) outer.scale.set(squish, stretch, squish);
            if (core) core.scale.set(squish, stretch, squish);
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.jumpTimer) mob.jumpTimer = 0;
            mob.jumpTimer -= dt;
            const dist = mob.position.distanceTo(playerPos);

            if (mob.grounded && mob.jumpTimer <= 0) {
                mob.jumpTimer = 1.0 + Math.random() * 0.8;
                mob.velocity.y = 5.5; // Minecraft slime hop
                mob.grounded = false;

                if (dist < 16) {
                    const dir = _tempVec3.subVectors(playerPos, mob.position);
                    dir.y = 0;
                    if (dir.lengthSq() > 0) dir.normalize();
                    mob.velocity.x = dir.x * mob.speed * 1.5;
                    mob.velocity.z = dir.z * mob.speed * 1.5;
                    if (mob.mesh) mob.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                } else {
                    const angle = Math.random() * Math.PI * 2;
                    mob.velocity.x = Math.cos(angle) * mob.speed;
                    mob.velocity.z = Math.sin(angle) * mob.speed;
                    if (mob.mesh) mob.mesh.rotation.y = angle;
                }
            } else if (mob.grounded) {
                mob.velocity.x *= 0.5;
                mob.velocity.z *= 0.5;
            }
        }
    },
    LAVASLIME: {
        name: 'Magma Cube', health: 30, damage: 8, speed: 2.2, hostile: true, color: 0xcc4400,
        size: 0.75, xpDrop: 8, lootChance: 0.4,
        buildMesh: () => {
            const group = new THREE.Group();
            // Outer segmented magma shell
            const outerGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
            const outer = createBodyPart(outerGeo, 'LAVASLIME');
            outer.position.y = 0.35;
            outer.name = 'outer';
            group.add(outer);

            // Glowing magma core
            const coreGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
            const core = new THREE.Mesh(coreGeo, coreMat);
            core.position.y = 0.35;
            core.name = 'core';
            group.add(core);

            // Glowing yellow/orange eyes
            const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.02);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff22 });
            const le = new THREE.Mesh(eyeGeo, eyeMat);
            le.position.set(-0.16, 0.4, 0.36);
            group.add(le);
            const re = new THREE.Mesh(eyeGeo, eyeMat);
            re.position.set(0.16, 0.4, 0.36);
            group.add(re);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const cycle = (age * 3.5) % Math.PI;
            const isJumping = Math.sin(cycle) > 0.1;
            const stretch = isJumping ? 1.0 + Math.sin(cycle) * 0.4 : 1.0;
            const squish = isJumping ? 1.0 / Math.sqrt(stretch) : 1.0 + Math.abs(Math.sin(age * 7)) * 0.15;
            
            const outer = mesh.getObjectByName('outer');
            if (outer) outer.scale.set(squish, stretch, squish);
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.jumpTimer) mob.jumpTimer = 0;
            mob.jumpTimer -= dt;
            const dist = mob.position.distanceTo(playerPos);

            if (mob.grounded && mob.jumpTimer <= 0) {
                mob.jumpTimer = 1.0 + Math.random() * 0.8;
                mob.velocity.y = 6.0;
                mob.grounded = false;

                if (dist < 16) {
                    const dir = _tempVec3.subVectors(playerPos, mob.position);
                    dir.y = 0;
                    if (dir.lengthSq() > 0) dir.normalize();
                    mob.velocity.x = dir.x * mob.speed * 1.5;
                    mob.velocity.z = dir.z * mob.speed * 1.5;
                    if (mob.mesh) mob.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                } else {
                    const angle = Math.random() * Math.PI * 2;
                    mob.velocity.x = Math.cos(angle) * mob.speed;
                    mob.velocity.z = Math.sin(angle) * mob.speed;
                    if (mob.mesh) mob.mesh.rotation.y = angle;
                }
            } else if (mob.grounded) {
                mob.velocity.x *= 0.5;
                mob.velocity.z *= 0.5;
            }
        }
    },
    PIG: {
        name: 'Pig', health: 15, damage: 0, speed: 2.0, hostile: false, color: 0xffffff,
        size: 0.7, xpDrop: 3, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Pig Body: Box (10, 16, 8) in MC coords -> (0.625, 0.5, 1.0)
            // Vanilla MC Pig Body UV: { u: 28, v: 8, w: 10, h: 16, d: 8 }
            const pigBodyFaceUVs = {
                top: [36, 16, 10, 16],
                bottom: [54, 16, 10, 16],
                front: [36, 8, 10, 8],
                back: [46, 8, 10, 8],
                right: [28, 16, 8, 16],
                left: [46, 16, 8, 16]
            };
            const bodyGeo = new THREE.BoxGeometry(0.625, 0.5, 1.0);
            const bodyMats = getMobBoxMaterials('PIG', { u: 28, v: 8, w: 10, h: 16, d: 8 }, { part: 'body', faceUVs: pigBodyFaceUVs });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.y = 0.45;
            body.castShadow = true;
            group.add(body);

            // Head (faces +Z forward): Vanilla MC Pig Head UV: { u: 0, v: 0, w: 8, h: 8, d: 8 }
            const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const headMats = getMobBoxMaterials('PIG', { u: 0, v: 0, w: 8, h: 8, d: 8 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.55, 0.55);
            head.name = 'head';
            head.castShadow = true;
            group.add(head);

            // 3D Protruding Snout on front of head: Vanilla MC Pig Snout UV: { u: 16, v: 16, w: 4, h: 3, d: 1 }
            const snoutGeo = new THREE.BoxGeometry(0.25, 0.18, 0.08);
            const snoutMats = getMobBoxMaterials('PIG', { u: 16, v: 16, w: 4, h: 3, d: 1 }, { part: 'snout' });
            const snout = new THREE.Mesh(snoutGeo, snoutMats);
            snout.position.set(0, 0.48, 0.81);
            snout.castShadow = true;
            group.add(snout);

            // 4 Legs with trotters: Vanilla MC Pig Leg UV: { u: 0, v: 16, w: 4, h: 6, d: 4 }
            const legGeo = new THREE.BoxGeometry(0.2, 0.35, 0.2);
            const legMats = getMobBoxMaterials('PIG', { u: 0, v: 16, w: 4, h: 6, d: 4 }, { part: 'leg' });
            for(let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeo, legMats);
                const x = (i % 2 === 0 ? -0.22 : 0.22);
                const z = (i < 2 ? 0.32 : -0.32);
                leg.position.set(x, 0.175, z);
                leg.name = `leg_${i}`;
                leg.castShadow = true;
                group.add(leg);
            }
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const leg0 = mesh.getObjectByName('leg_0');
            const leg1 = mesh.getObjectByName('leg_1');
            const leg2 = mesh.getObjectByName('leg_2');
            const leg3 = mesh.getObjectByName('leg_3');
            if (!isMoving) {
                if (leg0) leg0.rotation.x = 0;
                if (leg1) leg1.rotation.x = 0;
                if (leg2) leg2.rotation.x = 0;
                if (leg3) leg3.rotation.x = 0;
            } else {
                const swing = Math.sin(age * 8) * 0.4;
                if (leg0) leg0.rotation.x = swing;
                if (leg1) leg1.rotation.x = -swing;
                if (leg2) leg2.rotation.x = -swing;
                if (leg3) leg3.rotation.x = swing;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            if (mob.health < mob.maxHealth) {
                const fleeDir = _tempVec3.subVectors(mob.position, playerPos).normalize();
                fleeDir.y = 0;
                mob.velocity.x = fleeDir.x * mob.speed * 2.5;
                mob.velocity.z = fleeDir.z * mob.speed * 2.5;
                if (mob.mesh) mob.mesh.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);
            } else {
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    if (Math.random() < 0.5) {
                        mob.wanderTimer = 1 + Math.random() * 2;
                        const angle = Math.random() * Math.PI * 2;
                        mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                    } else {
                        mob.wanderTimer = 2 + Math.random() * 3;
                        mob.wanderDir.set(0, 0, 0);
                    }
                }
                mob.velocity.x = mob.wanderDir.x * mob.speed * 0.5;
                mob.velocity.z = mob.wanderDir.z * mob.speed * 0.5;
                if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }
        }
    },
    PIGLIN_BRUISER: {
        name: 'Piglin Bruiser', health: 50, damage: 12, speed: 3.5, hostile: true, color: 0xffaaaa,
        size: 0.9, xpDrop: 15, lootChance: 0.6,
        buildMesh: () => {
            const group = new THREE.Group();
            const body = createBodyPart(new THREE.BoxGeometry(0.5, 0.6, 0.3), 'PIGLIN_BRUISER', 0, 0, 'body'); // Dark armor
            body.position.y = 0.7;
            group.add(body);
            const head = createMobHead(new THREE.BoxGeometry(0.45, 0.45, 0.45), 'PIGLIN_BRUISER');
            head.position.set(0, 1.25, 0.05);
            group.add(head);
            // Snout
            const snout = createBodyPart(new THREE.BoxGeometry(0.2, 0.15, 0.1), 'PIGLIN_BRUISER', 0, 0, 'snout');
            snout.position.set(0, 1.15, 0.3);
            group.add(snout);
            const armGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
            const lArm = createBodyPart(armGeo, 'PIGLIN_BRUISER', 0, 0, 'arm');
            lArm.position.set(-0.35, 0.7, 0);
            group.add(lArm);
            const rArm = createBodyPart(armGeo, 'PIGLIN_BRUISER', 0, 0, 'arm');
            rArm.position.set(0.35, 0.7, 0);
            group.add(rArm);
            const legGeo = new THREE.BoxGeometry(0.15, 0.45, 0.15);
            const lLeg = createBodyPart(legGeo, 'PIGLIN_BRUISER', 0, 0, 'leg');
            lLeg.position.set(-0.15, 0.22, 0);
            group.add(lLeg);
            const rLeg = createBodyPart(legGeo, 'PIGLIN_BRUISER', 0, 0, 'leg');
            rLeg.position.set(0.15, 0.22, 0);
            group.add(rLeg);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            if (!isMoving) {
                mesh.children[3].rotation.x = 0;
                mesh.children[4].rotation.x = 0;
                mesh.children[5].rotation.x = 0;
                mesh.children[6].rotation.x = 0;
            } else {
                const swing = Math.sin(age * 10) * 0.5;
                mesh.children[3].rotation.x = swing;
                mesh.children[4].rotation.x = -swing;
                mesh.children[5].rotation.x = -swing;
                mesh.children[6].rotation.x = swing;
            }
        }
    },
    CREEPER: {
        name: 'Creeper', health: 20, damage: 25, speed: 2.2, hostile: true, color: 0x44cc44,
        size: 0.85, xpDrop: 5, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Torso
            const bodyGeo = new THREE.BoxGeometry(0.45, 0.65, 0.25);
            const body = createBodyPart(bodyGeo, 'CREEPER', 0, 0, 'body');
            body.position.y = 0.68;
            body.name = 'body';
            group.add(body);

            // Head (faces +Z forward with authentic Creeper face)
            const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
            const head = createMobHead(headGeo, 'CREEPER');
            head.position.set(0, 1.2, 0);
            head.name = 'head';
            group.add(head);

            // 4 short stubby legs
            const legGeo = new THREE.BoxGeometry(0.18, 0.35, 0.18);
            const legFL = createBodyPart(legGeo, 'CREEPER', 0, 0, 'leg');
            legFL.position.set(-0.13, 0.175, 0.13);
            legFL.name = 'leg_fl';
            group.add(legFL);

            const legFR = createBodyPart(legGeo, 'CREEPER', 0, 0, 'leg');
            legFR.position.set(0.13, 0.175, 0.13);
            legFR.name = 'leg_fr';
            group.add(legFR);

            const legBL = createBodyPart(legGeo, 'CREEPER', 0, 0, 'leg');
            legBL.position.set(-0.13, 0.175, -0.13);
            legBL.name = 'leg_bl';
            group.add(legBL);

            const legBR = createBodyPart(legGeo, 'CREEPER', 0, 0, 'leg');
            legBR.position.set(0.13, 0.175, -0.13);
            legBR.name = 'leg_br';
            group.add(legBR);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const legFL = mesh.getObjectByName('leg_fl');
            const legFR = mesh.getObjectByName('leg_fr');
            const legBL = mesh.getObjectByName('leg_bl');
            const legBR = mesh.getObjectByName('leg_br');
            if (isMoving) {
                // Classic Creeper opposing leg walk cycle
                const swing = Math.sin(age * 8) * 0.45;
                if (legFL) legFL.rotation.x = swing;
                if (legFR) legFR.rotation.x = -swing;
                if (legBL) legBL.rotation.x = -swing;
                if (legBR) legBR.rotation.x = swing;
            } else {
                if (legFL) legFL.rotation.x = 0;
                if (legFR) legFR.rotation.x = 0;
                if (legBL) legBL.rotation.x = 0;
                if (legBR) legBR.rotation.x = 0;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.fuseTimer) mob.fuseTimer = 0;
            if (!mob.isFusing) mob.isFusing = false;

            const dist = mob.position.distanceTo(playerPos);
            // If close to player, start swelling and hissing fuse countdown
            if (dist < 3.2) {
                mob.isFusing = true;
                mob.velocity.x *= 0.5;
                mob.velocity.z *= 0.5;
                mob.fuseTimer += dt;

                // Swell and flash white
                if (mob.mesh) {
                    const swell = 1.0 + (mob.fuseTimer / 1.5) * 0.35;
                    mob.mesh.scale.set(swell, swell, swell);
                    // Flash emissive
                    const flash = Math.sin(mob.fuseTimer * 20) > 0 ? 0.6 : 0.0;
                    mob.mesh.traverse(child => {
                        if (child.isMesh && child.material && child.material.emissive) {
                            child.material.emissive.setHex(0xffffff);
                            child.material.emissiveIntensity = flash;
                        }
                    });
                }

                // Explode when fuse completes
                if (mob.fuseTimer >= 1.5) {
                    mob.alive = false;
                    // Explosion damage to player if in range
                    if (dist < 6) {
                        const dmg = Math.round(35 * (1 - dist / 6));
                        if (world && world.damagePlayer) world.damagePlayer(dmg);
                    }
                    // Destroy blocks in small radius
                    if (world && world.setBlock) {
                        const bx = Math.floor(mob.position.x);
                        const by = Math.floor(mob.position.y);
                        const bz = Math.floor(mob.position.z);
                        for (let dx = -2; dx <= 2; dx++) {
                            for (let dy = -1; dy <= 2; dy++) {
                                for (let dz = -2; dz <= 2; dz++) {
                                    if (dx*dx + dy*dy + dz*dz <= 6) {
                                        const b = world.getBlock(bx + dx, by + dy, bz + dz);
                                        if (b !== BLOCKS.BEDROCK && b !== BLOCKS.AIR) {
                                            world.setBlock(bx + dx, by + dy, bz + dz, BLOCKS.AIR);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return;
                }
            } else {
                // If player fled, defuse and return to normal scale
                if (mob.isFusing) {
                    mob.fuseTimer = Math.max(0, mob.fuseTimer - dt * 2);
                    if (mob.fuseTimer <= 0) {
                        mob.isFusing = false;
                        if (mob.mesh) {
                            mob.mesh.scale.set(1, 1, 1);
                            mob.mesh.traverse(child => {
                                if (child.isMesh && child.material && child.material.emissive) {
                                    child.material.emissive.setHex(0x000000);
                                    child.material.emissiveIntensity = 0;
                                }
                            });
                        }
                    }
                }

                // Approach player
                if (dist < 16) {
                    const dir = _tempVec3.subVectors(playerPos, mob.position);
                    dir.y = 0;
                    if (dir.lengthSq() > 0) dir.normalize();
                    mob.velocity.x = dir.x * mob.speed;
                    mob.velocity.z = dir.z * mob.speed;
                    if (mob.mesh) mob.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                } else {
                    // Wander
                    mob.velocity.x *= 0.8;
                    mob.velocity.z *= 0.8;
                }
            }
        }
    },
    ENDERMAN: {
        name: 'Enderman', health: 40, damage: 7, speed: 3.5, hostile: false, color: 0x161616,
        size: 1.2, xpDrop: 10, lootChance: 0.6,
        buildMesh: () => {
            const group = new THREE.Group();
            // Torso (tall and thin)
            const bodyGeo = new THREE.BoxGeometry(0.35, 0.7, 0.2);
            const body = createBodyPart(bodyGeo, 'ENDERMAN', 0, 0, 'body');
            body.position.y = 1.85;
            body.name = 'body';
            group.add(body);

            // Head (at y = 2.4)
            const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
            const head = createMobHead(headGeo, 'ENDERMAN');
            head.position.set(0, 2.38, 0);
            head.name = 'head';
            group.add(head);

            // Long thin arms
            const armGeo = new THREE.BoxGeometry(0.08, 1.35, 0.08);
            const la = createBodyPart(armGeo, 'ENDERMAN', 0, 0, 'arm');
            la.position.set(-0.24, 1.5, 0);
            la.name = 'leftArm';
            group.add(la);

            const ra = createBodyPart(armGeo, 'ENDERMAN', 0, 0, 'arm');
            ra.position.set(0.24, 1.5, 0);
            ra.name = 'rightArm';
            group.add(ra);

            // Long thin legs
            const legGeo = new THREE.BoxGeometry(0.08, 1.5, 0.08);
            const ll = createBodyPart(legGeo, 'ENDERMAN', 0, 0, 'leg');
            ll.position.set(-0.1, 0.75, 0);
            ll.name = 'leftLeg';
            group.add(ll);

            const rl = createBodyPart(legGeo, 'ENDERMAN', 0, 0, 'leg');
            rl.position.set(0.1, 0.75, 0);
            rl.name = 'rightLeg';
            group.add(rl);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const la = mesh.getObjectByName('leftArm');
            const ra = mesh.getObjectByName('rightArm');
            const ll = mesh.getObjectByName('leftLeg');
            const rl = mesh.getObjectByName('rightLeg');
            const head = mesh.getObjectByName('head');

            if (isMoving) {
                const swing = Math.sin(age * 6) * 0.4;
                if (la) la.rotation.x = swing;
                if (ra) ra.rotation.x = -swing;
                if (ll) ll.rotation.x = -swing * 0.8;
                if (rl) rl.rotation.x = swing * 0.8;
            } else {
                if (la) la.rotation.x *= 0.9;
                if (ra) ra.rotation.x *= 0.9;
                if (ll) ll.rotation.x *= 0.9;
                if (rl) rl.rotation.x *= 0.9;
            }

            // Head vibrating / mouth opening when aggroed
            if (mesh.userData && mesh.userData.aggro && head) {
                head.position.x = (Math.random() - 0.5) * 0.03;
                head.position.z = (Math.random() - 0.5) * 0.03;
            } else if (head) {
                head.position.x = 0;
                head.position.z = 0;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.teleportTimer) mob.teleportTimer = 0;
            const dist = mob.position.distanceTo(playerPos);
            
            // Check if player attacked or got very close
            const isAggro = mob.health < mob.maxHealth || dist < 8;
            if (mob.mesh) mob.mesh.userData.aggro = isAggro;

            mob.teleportTimer -= dt;

            // Teleport randomly if in water or periodically when fighting
            const currentBlock = world ? world.getBlock(Math.floor(mob.position.x), Math.floor(mob.position.y), Math.floor(mob.position.z)) : 0;
            if (currentBlock === BLOCKS.WATER || (isAggro && mob.teleportTimer <= 0 && Math.random() < 0.25)) {
                mob.teleportTimer = 3 + Math.random() * 4;
                // Find random target location within 14 blocks
                const angle = Math.random() * Math.PI * 2;
                const r = 4 + Math.random() * 10;
                const tx = mob.position.x + Math.cos(angle) * r;
                const tz = mob.position.z + Math.sin(angle) * r;
                // Find ground level
                let ty = Math.floor(mob.position.y);
                if (world) {
                    for (let y = Math.min(CHUNK_HEIGHT - 2, ty + 5); y >= Math.max(1, ty - 10); y--) {
                        const b = world.getBlock(Math.floor(tx), y, Math.floor(tz));
                        const bAbove = world.getBlock(Math.floor(tx), y + 1, Math.floor(tz));
                        if (getBlockProperties(b).solid && bAbove === BLOCKS.AIR) {
                            mob.position.set(tx, y + 1, tz);
                            mob.velocity.set(0, 0, 0);
                            break;
                        }
                    }
                }
            }

            if (isAggro && dist > 1.8) {
                const dir = _tempVec3.subVectors(playerPos, mob.position);
                dir.y = 0;
                if (dir.lengthSq() > 0) dir.normalize();
                mob.velocity.x = dir.x * mob.speed;
                mob.velocity.z = dir.z * mob.speed;
                if (mob.mesh) mob.mesh.rotation.y = Math.atan2(dir.x, dir.z);
            } else if (!isAggro) {
                mob.velocity.x *= 0.8;
                mob.velocity.z *= 0.8;
            }
        }
    },
    SKELETON: {
        name: 'Skeleton', health: 30, damage: 8, speed: 3, hostile: true, color: 0xddddcc,
        size: 0.8, xpDrop: 15, lootChance: 0.6,
        buildMesh: () => {
            const group = new THREE.Group();
            // Ribcage/body
            const body = createBodyPart(new THREE.BoxGeometry(0.35, 0.45, 0.2), 'SKELETON', 0, 0, 'body');
            body.position.y = 0.8;
            group.add(body);
            // Skull
            const skull = createMobHead(new THREE.BoxGeometry(0.35, 0.35, 0.35), 'SKELETON');
            skull.position.set(0, 1.2, 0);
            skull.name = 'head';
            group.add(skull);
            // Arms (thin bones)
            const armGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);
            const la = createBodyPart(armGeo, 'SKELETON', 0, 0, 'arm');
            la.position.set(-0.28, 0.65, 0);
            la.name = 'leftArm';
            group.add(la);
            const ra = createBodyPart(armGeo, 'SKELETON', 0, 0, 'arm');
            ra.position.set(0.28, 0.65, 0);
            ra.name = 'rightArm';
            group.add(ra);
            // Legs (thin bones)
            const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
            const ll = createBodyPart(legGeo, 'SKELETON', 0, 0, 'leg');
            ll.position.set(-0.1, 0.25, 0);
            ll.name = 'leftLeg';
            group.add(ll);
            const rl = createBodyPart(legGeo, 'SKELETON', 0, 0, 'leg');
            rl.position.set(0.1, 0.25, 0);
            rl.name = 'rightLeg';
            group.add(rl);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            if (isMoving) {
                const swing = Math.sin(age * 8) * 0.5;
                mesh.getObjectByName('leftArm').rotation.x = swing;
                mesh.getObjectByName('rightArm').rotation.x = -swing;
                mesh.getObjectByName('leftLeg').rotation.x = -swing * 0.7;
                mesh.getObjectByName('rightLeg').rotation.x = swing * 0.7;
            } else {
                mesh.rotation.z = Math.sin(age * 1.5) * 0.02;
                mesh.getObjectByName('leftArm').rotation.x *= 0.9;
                mesh.getObjectByName('rightArm').rotation.x *= 0.9;
                mesh.getObjectByName('leftLeg').rotation.x *= 0.9;
                mesh.getObjectByName('rightLeg').rotation.x *= 0.9;
            }
        }
    },
    SPIDER: {
        name: 'Spider', health: 18, damage: 4, speed: 5, hostile: true, color: 0x332222,
        size: 0.7, xpDrop: 8, lootChance: 0.35,
        buildMesh: () => {
            const group = new THREE.Group();
            // Abdomen (dark bulbous rear)
            const abdomen = createBodyPart(new THREE.BoxGeometry(0.5, 0.4, 0.6), 'SPIDER', 0, 0, 'body');
            abdomen.position.set(0, 0.32, -0.32);
            abdomen.name = 'abdomen';
            group.add(abdomen);
            // Cephalothorax / Head with 8 glowing eyes on front face
            const head = createMobHead(new THREE.BoxGeometry(0.38, 0.28, 0.38), 'SPIDER');
            head.position.set(0, 0.3, 0.16);
            head.name = 'head';
            group.add(head);
            // 8 legs
            const legGeo = new THREE.BoxGeometry(0.06, 0.06, 0.45);
            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 4; i++) {
                    const leg = createBodyPart(legGeo, 'SPIDER', 0, 0, 'leg');
                    const zOff = -0.15 + i * 0.12;
                    leg.position.set(side * 0.32, 0.22, zOff);
                    leg.rotation.y = side * 0.3;
                    leg.rotation.z = side * -0.7;
                    leg.name = `leg_${side > 0 ? 'r' : 'l'}_${i}`;
                    group.add(leg);
                }
            }
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            if (isMoving) {
                for (let s = 0; s < 2; s++) {
                    const side = s === 0 ? 'l' : 'r';
                    for (let i = 0; i < 4; i++) {
                        const leg = mesh.getObjectByName(`leg_${side}_${i}`);
                        if (leg) {
                            const phase = (i + s * 2) * Math.PI / 4;
                            leg.rotation.x = Math.sin(age * 15 + phase) * 0.4;
                        }
                    }
                }
            }
            const ab = mesh.getObjectByName('abdomen');
            const hd = mesh.getObjectByName('head');
            if (ab) ab.position.y = 0.32 + Math.sin(age * 4) * 0.02;
            if (hd) hd.position.y = 0.3 + Math.sin(age * 4 + 0.5) * 0.02;
        }
    },
    ZOMBIE: {
        name: 'Zombie', health: 40, damage: 7, speed: 2, hostile: true, color: 0x557744,
        size: 0.9, xpDrop: 12, lootChance: 0.4,
        buildMesh: () => {
            const group = new THREE.Group();
            // Torso (cyan t-shirt)
            const body = createBodyPart(new THREE.BoxGeometry(0.45, 0.55, 0.3), 'ZOMBIE', 0, 0, 'body');
            body.position.y = 0.75;
            body.name = 'body';
            group.add(body);
            // Head with zombie face on front
            const head = createMobHead(new THREE.BoxGeometry(0.38, 0.38, 0.38), 'ZOMBIE');
            head.position.set(0, 1.2, 0);
            head.name = 'head';
            group.add(head);
            // Arms (stretched forward zombie-style toward +Z)
            const armGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
            const la = createBodyPart(armGeo, 'ZOMBIE', 0, 0, 'arm');
            la.position.set(-0.32, 0.78, 0.18);
            la.rotation.x = Math.PI / 2.2;
            la.name = 'leftArm';
            group.add(la);
            const ra = createBodyPart(armGeo, 'ZOMBIE', 0, 0, 'arm');
            ra.position.set(0.32, 0.78, 0.18);
            ra.rotation.x = Math.PI / 2.2;
            ra.name = 'rightArm';
            group.add(ra);
            // Legs (indigo pants)
            const legGeo = new THREE.BoxGeometry(0.15, 0.45, 0.15);
            const ll = createBodyPart(legGeo, 'ZOMBIE', 0, 0, 'leg');
            ll.position.set(-0.12, 0.225, 0);
            ll.name = 'leftLeg';
            group.add(ll);
            const rl = createBodyPart(legGeo, 'ZOMBIE', 0, 0, 'leg');
            rl.position.set(0.12, 0.225, 0);
            rl.name = 'rightLeg';
            group.add(rl);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            if (isMoving) {
                // Slow shamble
                const swing = Math.sin(age * 5) * 0.35;
                const ll = mesh.getObjectByName('leftLeg');
                const rl = mesh.getObjectByName('rightLeg');
                if (ll) ll.rotation.x = -swing;
                if (rl) rl.rotation.x = swing;
                // Arms wobble slightly forward
                const la = mesh.getObjectByName('leftArm');
                const ra = mesh.getObjectByName('rightArm');
                if (la) la.rotation.x = Math.PI / 2.2 + Math.sin(age * 5 + 1) * 0.1;
                if (ra) ra.rotation.x = Math.PI / 2.2 + Math.sin(age * 5) * 0.1;
                // Body sway
                const bd = mesh.getObjectByName('body');
                if (bd) bd.rotation.z = Math.sin(age * 5) * 0.04;
            } else {
                const ll = mesh.getObjectByName('leftLeg');
                const rl = mesh.getObjectByName('rightLeg');
                if (ll) ll.rotation.x *= 0.9;
                if (rl) rl.rotation.x *= 0.9;
            }
        }
    },
    BAT: {
        name: 'Bat', health: 10, damage: 3, speed: 6, hostile: true, color: 0x333333,
        size: 0.4, xpDrop: 4, lootChance: 0.2, flying: true,
        buildMesh: () => {
            const group = new THREE.Group();
            // Body (small oval)
            const body = createBodyPart(new THREE.SphereGeometry(0.12, 8, 6), 'BAT');
            body.scale.set(1, 0.8, 1.2);
            body.position.y = 0.2;
            group.add(body);
            // Head
            const head = createBodyPart(new THREE.SphereGeometry(0.08, 6, 6), 'BAT');
            head.position.set(0, 0.3, 0.1);
            group.add(head);
            // Eyes (tiny red)
            const eyeGeo = new THREE.SphereGeometry(0.025, 4, 4);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const le = new THREE.Mesh(eyeGeo, eyeMat);
            le.position.set(-0.04, 0.32, 0.17);
            group.add(le);
            const re = new THREE.Mesh(eyeGeo, eyeMat);
            re.position.set(0.04, 0.32, 0.17);
            group.add(re);
            // Wings (flat boxes)
            const wingGeo = new THREE.BoxGeometry(0.35, 0.01, 0.2);
            const wingMat = getMobMaterial('BAT');
            const lw = new THREE.Mesh(wingGeo, wingMat);
            lw.position.set(-0.22, 0.22, 0);
            lw.name = 'leftWing';
            group.add(lw);
            const rw = new THREE.Mesh(wingGeo, wingMat);
            rw.position.set(0.22, 0.22, 0);
            rw.name = 'rightWing';
            group.add(rw);
            // Ears
            const earGeo = new THREE.ConeGeometry(0.03, 0.08, 3);
            const earMat = getMobMaterial('BAT');
            const lear = new THREE.Mesh(earGeo, earMat);
            lear.position.set(-0.04, 0.4, 0.08);
            group.add(lear);
            const rear = new THREE.Mesh(earGeo, earMat);
            rear.position.set(0.04, 0.4, 0.08);
            group.add(rear);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            // Wing flapping
            const flapSpeed = isMoving ? 20 : 12;
            const flapAmt = 0.8;
            const lw = mesh.getObjectByName('leftWing');
            const rw = mesh.getObjectByName('rightWing');
            if (lw) lw.rotation.z = Math.sin(age * flapSpeed) * flapAmt;
            if (rw) rw.rotation.z = -Math.sin(age * flapSpeed) * flapAmt;
            // Hover bob
            mesh.position.y += Math.sin(age * 3) * 0.003;
        }
    },
    GOLEM: {
        name: 'Iron Golem', health: 100, damage: 18, speed: 1.6, hostile: false, color: 0xd4cfc5,
        size: 1.4, xpDrop: 25, lootChance: 0.7,
        buildMesh: () => {
            const group = new THREE.Group();
            // Broad upper chest
            const chestGeo = new THREE.BoxGeometry(0.9, 0.7, 0.5);
            const chest = createBodyPart(chestGeo, 'GOLEM', 0, 0, 'body');
            chest.position.y = 1.05;
            group.add(chest);

            // Narrow lower torso
            const lowerGeo = new THREE.BoxGeometry(0.6, 0.35, 0.4);
            const lower = createBodyPart(lowerGeo, 'GOLEM', 0, 0, 'body');
            lower.position.y = 0.55;
            group.add(lower);

            // Head (authentic Minecraft proportions)
            const headGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
            const head = createMobHead(headGeo, 'GOLEM');
            head.position.set(0, 1.62, 0.05);
            head.name = 'head';
            group.add(head);

            // Protruding 3D Nose
            const noseGeo = new THREE.BoxGeometry(0.1, 0.22, 0.12);
            const noseMat = getMobMaterial('GOLEM', 'head_front');
            const nose = new THREE.Mesh(noseGeo, noseMat);
            nose.position.set(0, 1.52, 0.28);
            group.add(nose);

            // Massive swinging arms
            const armGeo = new THREE.BoxGeometry(0.25, 1.05, 0.25);
            const la = createBodyPart(armGeo, 'GOLEM', 0, 0, 'arm');
            la.position.set(-0.6, 0.85, 0);
            la.name = 'leftArm';
            group.add(la);

            const ra = createBodyPart(armGeo, 'GOLEM', 0, 0, 'arm');
            ra.position.set(0.6, 0.85, 0);
            ra.name = 'rightArm';
            group.add(ra);

            // Heavy legs
            const legGeo = new THREE.BoxGeometry(0.28, 0.65, 0.28);
            const ll = createBodyPart(legGeo, 'GOLEM', 0, 0, 'leg');
            ll.position.set(-0.22, 0.32, 0);
            ll.name = 'leftLeg';
            group.add(ll);

            const rl = createBodyPart(legGeo, 'GOLEM', 0, 0, 'leg');
            rl.position.set(0.22, 0.32, 0);
            rl.name = 'rightLeg';
            group.add(rl);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const la = mesh.getObjectByName('leftArm');
            const ra = mesh.getObjectByName('rightArm');
            const ll = mesh.getObjectByName('leftLeg');
            const rl = mesh.getObjectByName('rightLeg');

            if (isMoving) {
                const swing = Math.sin(age * 4.5) * 0.4;
                if (la) la.rotation.x = swing;
                if (ra) ra.rotation.x = -swing;
                if (ll) ll.rotation.x = -swing * 0.7;
                if (rl) rl.rotation.x = swing * 0.7;
                mesh.position.y += Math.abs(Math.sin(age * 4.5)) * 0.02; // heavy stomp
            } else {
                if (la) la.rotation.x *= 0.9;
                if (ra) ra.rotation.x *= 0.9;
                if (ll) ll.rotation.x *= 0.9;
                if (rl) rl.rotation.x *= 0.9;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();

            // Neutral AI: only attacks if provoked (health decreased)
            if (mob.health < mob.maxHealth) {
                const dist = mob.position.distanceTo(playerPos);
                if (dist > 1.8) {
                    const dir = _tempVec3.subVectors(playerPos, mob.position);
                    dir.y = 0;
                    if (dir.lengthSq() > 0) dir.normalize();
                    mob.velocity.x = dir.x * mob.speed * 1.5;
                    mob.velocity.z = dir.z * mob.speed * 1.5;
                    if (mob.mesh) mob.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                } else {
                    mob.velocity.x = 0;
                    mob.velocity.z = 0;
                }
            } else {
                mob.wanderTimer -= dt;
                if (mob.wanderTimer <= 0) {
                    if (Math.random() < 0.3) {
                        mob.wanderTimer = 2 + Math.random() * 4;
                        const angle = Math.random() * Math.PI * 2;
                        mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                    } else {
                        mob.wanderTimer = 3 + Math.random() * 5;
                        mob.wanderDir.set(0, 0, 0);
                    }
                }
                mob.velocity.x = mob.wanderDir.x * mob.speed * 0.4;
                mob.velocity.z = mob.wanderDir.z * mob.speed * 0.4;
                if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
            }
        }
    },
    COD: {
        name: 'Cod', health: 3, damage: 0, speed: 2.2, hostile: false, color: 0xbbbb99,
        size: 0.3, xpDrop: 1, lootChance: 0.1, waterOnly: true,
        buildMesh: () => {
            const group = new THREE.Group();
            const mat = getMobMaterial('COD');
            const bodyGeo = new THREE.BoxGeometry(0.15, 0.3, 0.6);
            const body = new THREE.Mesh(bodyGeo, mat);
            body.position.y = 0.15; group.add(body);
            const tailGeo = new THREE.BoxGeometry(0.02, 0.12, 0.12);
            const tail = createBodyPart(tailGeo, 'COD'); tail.position.set(0, 0.15, -0.3); tail.name = 'tail'; group.add(tail);
            const finGeo = new THREE.BoxGeometry(0.08, 0.02, 0.06);
            const lf = createBodyPart(finGeo, 'COD'); lf.position.set(-0.08, 0.1, 0); lf.rotation.z = -0.3; lf.name = 'leftFin'; group.add(lf);
            const rf = createBodyPart(finGeo, 'COD'); rf.position.set(0.08, 0.1, 0); rf.rotation.z = 0.3; rf.name = 'rightFin'; group.add(rf);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const speed = isMoving ? 30 : 10;
            const tail = mesh.getObjectByName('tail');
            if (tail) tail.rotation.y = Math.sin(age * speed) * 0.4;
            const lf = mesh.getObjectByName('leftFin');
            const rf = mesh.getObjectByName('rightFin');
            if (lf) lf.rotation.x = Math.sin(age * speed) * 0.3;
            if (rf) rf.rotation.x = Math.sin(age * speed + Math.PI) * 0.3;
        }
    },
    TROPICAL_FISH: {
        name: 'Tropical Fish', health: 3, damage: 0, speed: 2.5, hostile: false, color: 0xff8800,
        size: 0.25, xpDrop: 1, lootChance: 0.1, waterOnly: true,
        buildMesh: () => {
            const group = new THREE.Group();
            // Body (Orange and White)
            const body = createBodyPart(new THREE.BoxGeometry(0.08, 0.15, 0.25), 'TROPICAL_FISH');
            body.position.y = 0.15;
            group.add(body);
            // White stripe
            const stripe = createBodyPart(new THREE.BoxGeometry(0.085, 0.16, 0.05), 0xffffff);
            stripe.position.set(0, 0.15, 0);
            group.add(stripe);
            // Tail
            const tailGeo = new THREE.BoxGeometry(0.02, 0.1, 0.1);
            const tail = createBodyPart(tailGeo, 0xffffff);
            tail.position.set(0, 0.15, -0.15);
            tail.name = 'tail';
            group.add(tail);
            // Fins
            const finGeo = new THREE.BoxGeometry(0.1, 0.02, 0.08);
            const lf = createBodyPart(finGeo, 0xffaa00);
            lf.position.set(-0.06, 0.1, 0);
            lf.rotation.z = -0.3;
            lf.name = 'leftFin';
            group.add(lf);
            const rf = createBodyPart(finGeo, 0xffaa00);
            rf.position.set(0.06, 0.1, 0);
            rf.rotation.z = 0.3;
            rf.name = 'rightFin';
            group.add(rf);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const speed = isMoving ? 25 : 8;
            const tail = mesh.getObjectByName('tail');
            if (tail) tail.rotation.y = Math.sin(age * speed) * 0.4;
            const lf = mesh.getObjectByName('leftFin');
            const rf = mesh.getObjectByName('rightFin');
            if (lf) lf.rotation.x = Math.sin(age * speed) * 0.2;
            if (rf) rf.rotation.x = Math.sin(age * speed) * 0.2;
        }
    },

    SALMON: {
        name: 'Salmon', health: 6, damage: 0, speed: 3.5, hostile: false, color: 0xff5555,
        size: 0.4, xpDrop: 3, lootChance: 0.15, waterOnly: true,
        buildMesh: () => {
            const group = new THREE.Group();
            // Body
            const body = createBodyPart(new THREE.BoxGeometry(0.12, 0.25, 0.45), 'SALMON');
            body.position.y = 0.2;
            group.add(body);
            // Greenish back
            const back = createBodyPart(new THREE.BoxGeometry(0.125, 0.1, 0.45), 0x335533);
            back.position.set(0, 0.28, 0);
            group.add(back);
            // Tail
            const tailGeo = new THREE.BoxGeometry(0.02, 0.2, 0.15);
            const tail = createBodyPart(tailGeo, 0x335533);
            tail.position.set(0, 0.2, -0.28);
            tail.name = 'tail';
            group.add(tail);
            // Fins
            const finGeo = new THREE.BoxGeometry(0.15, 0.02, 0.15);
            const lf = createBodyPart(finGeo, 0xcc3333);
            lf.position.set(-0.08, 0.1, 0);
            lf.rotation.z = -0.2;
            lf.name = 'leftFin';
            group.add(lf);
            const rf = createBodyPart(finGeo, 0xcc3333);
            rf.position.set(0.08, 0.1, 0);
            rf.rotation.z = 0.2;
            rf.name = 'rightFin';
            group.add(rf);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const speed = isMoving ? 18 : 5;
            const tail = mesh.getObjectByName('tail');
            if (tail) tail.rotation.y = Math.sin(age * speed) * 0.5;
            const lf = mesh.getObjectByName('leftFin');
            const rf = mesh.getObjectByName('rightFin');
            if (lf) lf.rotation.x = Math.sin(age * speed) * 0.2;
            if (rf) rf.rotation.x = Math.sin(age * speed) * 0.2;
        }
    },

    PUFFERFISH: {
        name: 'Pufferfish', health: 4, damage: 2, speed: 1.5, hostile: true, color: 0xffee00,
        size: 0.35, xpDrop: 4, lootChance: 0.2, waterOnly: true,
        buildMesh: () => {
            const group = new THREE.Group();
            // Boxy Body
            const body = createBodyPart(new THREE.BoxGeometry(0.3, 0.3, 0.3), 'PUFFERFISH');
            body.position.y = 0.2;
            body.name = 'body';
            group.add(body);
            // Eyes
            const eyeGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const le = new THREE.Mesh(eyeGeo, eyeMat);
            le.position.set(-0.16, 0.25, 0.1);
            group.add(le);
            const re = new THREE.Mesh(eyeGeo, eyeMat);
            re.position.set(0.16, 0.25, 0.1);
            group.add(re);
            // Tail
            const tailGeo = new THREE.BoxGeometry(0.05, 0.1, 0.1);
            const tail = createBodyPart(tailGeo, 'PUFFERFISH');
            tail.position.set(0, 0.2, -0.2);
            tail.name = 'tail';
            group.add(tail);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const speed = isMoving ? 15 : 4;
            const tail = mesh.getObjectByName('tail');
            if (tail) tail.rotation.y = Math.sin(age * speed) * 0.4;
            // Puffs up rhythmically when moving
            const body = mesh.getObjectByName('body');
            if (body) {
                const puff = isMoving ? 1.0 + Math.abs(Math.sin(age * 5)) * 0.4 : 1.0;
                body.scale.set(puff, puff, puff);
            }
        }
    },
    TURTLE: {
        name: 'Turtle', health: 30, damage: 0, speed: 1.2, hostile: false, color: 0x228822,
        size: 0.6, xpDrop: 5, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Shell
            const shell = createBodyPart(new THREE.BoxGeometry(0.6, 0.25, 0.7), 'TURTLE', 0, 0, 'shell');
            shell.position.y = 0.3;
            group.add(shell);
            // Body (under shell)
            const body = createBodyPart(new THREE.BoxGeometry(0.5, 0.15, 0.6), 'TURTLE', 0, 0, 'body');
            body.position.y = 0.2;
            group.add(body);
            // Head with front-facing eyes and pale jaw
            const head = createMobHead(new THREE.BoxGeometry(0.2, 0.15, 0.2), 'TURTLE');
            head.position.set(0, 0.25, 0.4);
            head.name = 'head';
            group.add(head);
            // Flippers
            const flipperGeo = new THREE.BoxGeometry(0.3, 0.05, 0.2);
            const fl1 = createBodyPart(flipperGeo, 'TURTLE', 0, 0, 'flipper');
            fl1.position.set(-0.35, 0.15, 0.2);
            fl1.name = 'fl1';
            group.add(fl1);
            const fl2 = createBodyPart(flipperGeo, 'TURTLE', 0, 0, 'flipper');
            fl2.position.set(0.35, 0.15, 0.2);
            fl2.name = 'fl2';
            group.add(fl2);
            const fl3 = createBodyPart(flipperGeo, 'TURTLE', 0, 0, 'flipper');
            fl3.position.set(-0.3, 0.15, -0.2);
            fl3.name = 'fl3';
            group.add(fl3);
            const fl4 = createBodyPart(flipperGeo, 'TURTLE', 0, 0, 'flipper');
            fl4.position.set(0.3, 0.15, -0.2);
            fl4.name = 'fl4';
            group.add(fl4);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const speed = isMoving ? 5 : 1;
            const swing = Math.sin(age * speed) * 0.3;
            const fl1 = mesh.getObjectByName('fl1');
            const fl2 = mesh.getObjectByName('fl2');
            const fl3 = mesh.getObjectByName('fl3');
            const fl4 = mesh.getObjectByName('fl4');
            const head = mesh.getObjectByName('head');
            
            if (fl1) fl1.rotation.y = swing;
            if (fl2) fl2.rotation.y = -swing;
            if (fl3) fl3.rotation.y = -swing;
            if (fl4) fl4.rotation.y = swing;
            if (head) head.rotation.y = Math.sin(age * 2) * 0.1;
        }
    },

    CHICKEN: {
        name: 'Chicken', health: 4, damage: 0, speed: 2.5, hostile: false, color: 0xffffff,
        size: 0.3, xpDrop: 1, lootChance: 0.1,
        buildMesh: () => {
            const group = new THREE.Group();
            // Authentic Minecraft Chicken Body: Box (6, 8, 6) in MC coords -> (0.35, 0.3, 0.45)
            // Vanilla MC Chicken Body UV: { u: 0, v: 9, w: 6, h: 8, d: 6 }
            const bodyGeo = new THREE.BoxGeometry(0.35, 0.3, 0.45);
            const bodyMats = getMobBoxMaterials('CHICKEN', { u: 0, v: 9, w: 6, h: 8, d: 6 }, { part: 'body' });
            const body = new THREE.Mesh(bodyGeo, bodyMats);
            body.position.y = 0.32;
            body.castShadow = true;
            group.add(body);

            // Head (faces +Z forward): Vanilla MC Chicken Head UV: { u: 0, v: 0, w: 4, h: 6, d: 3 }
            const headGeo = new THREE.BoxGeometry(0.22, 0.28, 0.22);
            const headMats = getMobBoxMaterials('CHICKEN', { u: 0, v: 0, w: 4, h: 6, d: 3 }, { part: 'head_front' });
            const head = new THREE.Mesh(headGeo, headMats);
            head.position.set(0, 0.55, 0.22);
            head.name = 'head';
            head.castShadow = true;
            group.add(head);

            // 3D Beak: Vanilla MC Chicken Beak UV: { u: 14, v: 0, w: 4, h: 2, d: 2 }
            const beakGeo = new THREE.BoxGeometry(0.14, 0.08, 0.1);
            const beakMats = getMobBoxMaterials('CHICKEN', { u: 14, v: 0, w: 4, h: 2, d: 2 }, { part: 'snout' });
            const beak = new THREE.Mesh(beakGeo, beakMats);
            beak.position.set(0, 0.51, 0.35);
            beak.castShadow = true;
            group.add(beak);

            // 3D Red Wattle: Vanilla MC Chicken Wattle UV: { u: 14, v: 4, w: 2, h: 2, d: 2 }
            const wattleGeo = new THREE.BoxGeometry(0.08, 0.1, 0.08);
            const wattleMats = getMobBoxMaterials('CHICKEN', { u: 14, v: 4, w: 2, h: 2, d: 2 }, { part: 'snout' });
            const wattle = new THREE.Mesh(wattleGeo, wattleMats);
            wattle.position.set(0, 0.43, 0.31);
            wattle.castShadow = true;
            group.add(wattle);

            // Wings: Vanilla MC Chicken Wing UV: { u: 24, v: 13, w: 1, h: 4, d: 6 }
            const wingGeo = new THREE.BoxGeometry(0.05, 0.22, 0.32);
            const wingMats = getMobBoxMaterials('CHICKEN', { u: 24, v: 13, w: 1, h: 4, d: 6 }, { part: 'wing' });
            const leftWing = new THREE.Mesh(wingGeo, wingMats);
            leftWing.position.set(-0.2, 0.34, 0);
            leftWing.name = 'leftWing';
            leftWing.castShadow = true;
            group.add(leftWing);
            const rightWing = new THREE.Mesh(wingGeo, wingMats);
            rightWing.position.set(0.2, 0.34, 0);
            rightWing.name = 'rightWing';
            rightWing.castShadow = true;
            group.add(rightWing);

            // 2 Legs with yellow feet: Vanilla MC Chicken Leg UV: { u: 26, v: 0, w: 3, h: 5, d: 3 }
            const legGeo = new THREE.BoxGeometry(0.08, 0.24, 0.12);
            const legMats = getMobBoxMaterials('CHICKEN', { u: 26, v: 0, w: 3, h: 5, d: 3 }, { part: 'leg' });
            const leftLeg = new THREE.Mesh(legGeo, legMats);
            leftLeg.position.set(-0.09, 0.12, 0);
            leftLeg.name = 'leftLeg';
            leftLeg.castShadow = true;
            group.add(leftLeg);
            const rightLeg = new THREE.Mesh(legGeo, legMats);
            rightLeg.position.set(0.09, 0.12, 0);
            rightLeg.name = 'rightLeg';
            rightLeg.castShadow = true;
            group.add(rightLeg);

            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const leftLeg = mesh.getObjectByName('leftLeg');
            const rightLeg = mesh.getObjectByName('rightLeg');
            const leftWing = mesh.getObjectByName('leftWing');
            const rightWing = mesh.getObjectByName('rightWing');
            if (!isMoving) {
                if (leftLeg) leftLeg.rotation.x = 0;
                if (rightLeg) rightLeg.rotation.x = 0;
                if (leftWing) leftWing.rotation.z = 0;
                if (rightWing) rightWing.rotation.z = 0;
            } else {
                const swing = Math.sin(age * 12) * 0.55;
                if (leftLeg) leftLeg.rotation.x = swing;
                if (rightLeg) rightLeg.rotation.x = -swing;
                const flap = Math.sin(age * 16) * 0.3;
                if (leftWing) leftWing.rotation.z = flap;
                if (rightWing) rightWing.rotation.z = -flap;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            if (mob.velocity.y < -2) {
                mob.velocity.y = -2;
                const lw = mob.mesh && mob.mesh.getObjectByName('leftWing');
                const rw = mob.mesh && mob.mesh.getObjectByName('rightWing');
                if (lw) lw.rotation.z = Math.sin(Date.now() * 0.03) * 0.6;
                if (rw) rw.rotation.z = -Math.sin(Date.now() * 0.03) * 0.6;
            }
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                mob.wanderTimer = 0.5 + Math.random() * 1.5;
                const angle = Math.random() * Math.PI * 2;
                mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
            }
            const mult = mob.health < mob.maxHealth ? 3.0 : 1.0;
            mob.velocity.x = mob.wanderDir.x * mob.speed * mult;
            mob.velocity.z = mob.wanderDir.z * mob.speed * mult;
            if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
        }
    },

    CAMEL: {
        name: 'Camel', health: 32, damage: 0, speed: 2.8, hostile: false, color: 0xc2b280,
        size: 1.0, xpDrop: 3, lootChance: 0.5,
        buildMesh: () => {
            const group = new THREE.Group();
            // Body
            const body = createBodyPart(new THREE.BoxGeometry(1.0, 0.8, 1.5), 'CAMEL', 0, 0, 'body');
            body.position.y = 1.2; body.name = 'body'; group.add(body);
            // Hump
            const hump = createBodyPart(new THREE.BoxGeometry(0.65, 0.5, 0.65), 'CAMEL', 0, 0, 'hump');
            hump.position.set(0, 1.7, -0.1); group.add(hump);
            // Neck
            const neck = createBodyPart(new THREE.BoxGeometry(0.35, 0.7, 0.4), 'CAMEL', 0, 0, 'body');
            neck.position.set(0, 1.55, 0.75); neck.name = 'neck'; group.add(neck);
            // Head (facing +Z)
            const head = createMobHead(new THREE.BoxGeometry(0.42, 0.45, 0.55), 'CAMEL');
            head.position.set(0, 1.95, 0.95); head.name = 'head'; group.add(head);
            // 4 Legs: fl, fr, bl, br
            const legGeo = new THREE.BoxGeometry(0.24, 0.85, 0.24);
            const legFL = createBodyPart(legGeo, 'CAMEL', 0, 0, 'leg');
            legFL.position.set(-0.38, 0.42, 0.55); legFL.name = 'leg_fl'; group.add(legFL);
            const legFR = createBodyPart(legGeo, 'CAMEL', 0, 0, 'leg');
            legFR.position.set(0.38, 0.42, 0.55); legFR.name = 'leg_fr'; group.add(legFR);
            const legBL = createBodyPart(legGeo, 'CAMEL', 0, 0, 'leg');
            legBL.position.set(-0.38, 0.42, -0.55); legBL.name = 'leg_bl'; group.add(legBL);
            const legBR = createBodyPart(legGeo, 'CAMEL', 0, 0, 'leg');
            legBR.position.set(0.38, 0.42, -0.55); legBR.name = 'leg_br'; group.add(legBR);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const fl = mesh.getObjectByName('leg_fl');
            const fr = mesh.getObjectByName('leg_fr');
            const bl = mesh.getObjectByName('leg_bl');
            const br = mesh.getObjectByName('leg_br');
            const head = mesh.getObjectByName('head');
            if (isMoving) {
                // Minecraft Camel authentic pacing gait (left side moves, then right side moves)
                const swing = Math.sin(age * 5) * 0.4;
                if (fl) fl.rotation.x = swing;
                if (bl) bl.rotation.x = swing;
                if (fr) fr.rotation.x = -swing;
                if (br) br.rotation.x = -swing;
                if (head) head.rotation.x = Math.sin(age * 5) * 0.08;
            } else {
                if (fl) fl.rotation.x = 0;
                if (fr) fr.rotation.x = 0;
                if (bl) bl.rotation.x = 0;
                if (br) br.rotation.x = 0;
                if (head) head.rotation.x = 0;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                if (Math.random() < 0.4) {
                    mob.wanderTimer = 2.0 + Math.random() * 4.0;
                    const angle = Math.random() * Math.PI * 2;
                    mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                } else {
                    mob.wanderTimer = 3.0 + Math.random() * 5.0;
                    mob.wanderDir.set(0, 0, 0);
                }
            }
            mob.velocity.x = mob.wanderDir.x * mob.speed * 0.4;
            mob.velocity.z = mob.wanderDir.z * mob.speed * 0.4;
            if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
        }
    },
    FROG: {
        name: 'Frog', health: 10, damage: 0, speed: 4.0, hostile: false, color: 0x22cc44,
        size: 0.4, xpDrop: 1, lootChance: 0.2,
        buildMesh: () => {
            const group = new THREE.Group();
            // Body
            const body = createBodyPart(new THREE.BoxGeometry(0.42, 0.22, 0.42), 'FROG', 0, 0, 'body');
            body.position.y = 0.15; group.add(body);
            // Head with wide mouth & eyes
            const head = createMobHead(new THREE.BoxGeometry(0.4, 0.18, 0.3), 'FROG');
            head.position.set(0, 0.22, 0.22); group.add(head);
            // Eye bumps on top
            const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const le = createBodyPart(eyeGeo, 'FROG', 0, 0, 'head_top');
            le.position.set(-0.12, 0.34, 0.26); group.add(le);
            const re = createBodyPart(eyeGeo, 'FROG', 0, 0, 'head_top');
            re.position.set(0.12, 0.34, 0.26); group.add(re);
            // Front legs
            const fLegGeo = new THREE.BoxGeometry(0.08, 0.14, 0.08);
            const fl = createBodyPart(fLegGeo, 'FROG', 0, 0, 'leg');
            fl.position.set(-0.18, 0.07, 0.15); fl.name = 'fl'; group.add(fl);
            const fr = createBodyPart(fLegGeo, 'FROG', 0, 0, 'leg');
            fr.position.set(0.18, 0.07, 0.15); fr.name = 'fr'; group.add(fr);
            // Hind legs (folded)
            const hLegGeo = new THREE.BoxGeometry(0.12, 0.18, 0.22);
            const hl = createBodyPart(hLegGeo, 'FROG', 0, 0, 'leg');
            hl.position.set(-0.2, 0.1, -0.12); hl.name = 'hl'; group.add(hl);
            const hr = createBodyPart(hLegGeo, 'FROG', 0, 0, 'leg');
            hr.position.set(0.2, 0.1, -0.12); hr.name = 'hr'; group.add(hr);
            return group;
        },
        animate: (mesh, dt, age, isMoving) => {
            const hl = mesh.getObjectByName('hl');
            const hr = mesh.getObjectByName('hr');
            const fl = mesh.getObjectByName('fl');
            const fr = mesh.getObjectByName('fr');
            if (isMoving) {
                const stretch = Math.sin(age * 12) * 0.45;
                if (hl) hl.rotation.x = stretch;
                if (hr) hr.rotation.x = stretch;
                if (fl) fl.rotation.x = -stretch * 0.5;
                if (fr) fr.rotation.x = -stretch * 0.5;
            } else {
                if (hl) hl.rotation.x = 0;
                if (hr) hr.rotation.x = 0;
                if (fl) fl.rotation.x = 0;
                if (fr) fr.rotation.x = 0;
            }
        },
        updateAI: (mob, dt, world, playerPos) => {
            if (!mob.wanderTimer) mob.wanderTimer = 0;
            if (!mob.wanderDir) mob.wanderDir = new THREE.Vector3();
            mob.wanderTimer -= dt;
            if (mob.wanderTimer <= 0) {
                mob.wanderTimer = 1.2 + Math.random() * 2.5;
                const angle = Math.random() * Math.PI * 2;
                mob.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                if (mob.grounded) {
                    mob.velocity.y = 5.5; // Minecraft frog hop
                    mob.grounded = false;
                }
            }
            if (!mob.grounded) {
                mob.velocity.x = mob.wanderDir.x * mob.speed;
                mob.velocity.z = mob.wanderDir.z * mob.speed;
            } else {
                mob.velocity.x *= 0.5;
                mob.velocity.z *= 0.5;
            }
            if (mob.wanderDir.lengthSq() > 0 && mob.mesh) mob.mesh.rotation.y = Math.atan2(mob.wanderDir.x, mob.wanderDir.z);
        }
    }
};

// Weighted mob type table for spawning
const MOB_SPAWN_WEIGHTS = [
    { type: 'SHEEP', weight: 20 },
    { type: 'COW', weight: 20 },
    { type: 'PIG', weight: 20 },
    { type: 'CHICKEN', weight: 20 },
    { type: 'ZOMBIE', weight: 15 },
    { type: 'SKELETON', weight: 15 },
    { type: 'SPIDER', weight: 12 },
    { type: 'CREEPER', weight: 12 },
    { type: 'SLIME', weight: 12 },
    { type: 'ENDERMAN', weight: 6 },
    { type: 'BAT', weight: 8 },
    { type: 'TROPICAL_FISH', weight: 15 },
    { type: 'COD', weight: 15 },
    { type: 'SALMON', weight: 15 },
    { type: 'PUFFERFISH', weight: 6 },
    { type: 'TURTLE', weight: 8 },
    { type: 'FROG', weight: 10 },
    { type: 'CAMEL', weight: 6 },
    { type: 'GOLEM', weight: 2 },
];
const TOTAL_MOB_WEIGHT = MOB_SPAWN_WEIGHTS.reduce((s, e) => s + e.weight, 0);

function pickRandomMobType(dimension = 'overworld', biome = 'plains') {
    if (dimension === 'nether') {
        return Math.random() < 0.5 ? 'LAVASLIME' : 'PIGLIN_BRUISER';
    }
    if (dimension === 'aether') {
        return Math.random() < 0.5 ? 'SHEEP' : 'CHICKEN';
    }
    if (dimension === 'caverns') {
        const cavMobs = ['BAT', 'SKELETON', 'ZOMBIE', 'SPIDER', 'CREEPER', 'ENDERMAN'];
        return cavMobs[Math.floor(Math.random() * cavMobs.length)];
    }

    if (biome === 'desert' && Math.random() < 0.5) return 'CAMEL';
    if (biome === 'swamp' && Math.random() < 0.6) return Math.random() < 0.5 ? 'FROG' : 'SLIME';
    if (biome === 'snow' && Math.random() < 0.3) return 'SKELETON';

    let r = Math.random() * TOTAL_MOB_WEIGHT;
    for (const entry of MOB_SPAWN_WEIGHTS) {
        r -= entry.weight;
        if (r <= 0) return entry.type;
    }
    return 'SHEEP';
}

// ============================================
// Mobs & Entities
// ============================================
export class ItemEntity {
    constructor(item, count, position, atlas, velocity = null) {
        this.item = item;
        this.count = count;
        this.position = position.clone();
        if (velocity) {
            this.velocity = velocity.clone();
        } else {
            this.velocity = new THREE.Vector3((Math.random()-0.5)*5, 3, (Math.random()-0.5)*5);
        }
        this.alive = true;
        this.mesh = null;
        this.atlas = atlas;
        this.age = 0;
    }

    getMesh() {
        if (!this.mesh) {
            if (this.item.type === 'block') {
                const iconCanvas = this.atlas.getBlockIcon(this.item.subtype);
                const tex = new THREE.CanvasTexture(iconCanvas);
                tex.magFilter = THREE.NearestFilter;
                tex.colorSpace = THREE.SRGBColorSpace;
                const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
                this.mesh = new THREE.Sprite(mat);
                this.mesh.scale.set(0.4, 0.4, 0.4);
            } else if (this.item.type === 'material' || this.item.type === 'equipment' || this.item.type === 'wand' || this.item.type === 'spell' || this.item.type === 'modifier' || this.item.type === 'food' || this.item.type === 'spawn_egg') {
                let cvs;
                let tex;
                const updateTex = (canvas) => {
                    if (tex) {
                        tex.image = canvas;
                        tex.needsUpdate = true;
                    }
                };
                if (this.item.type === 'material' || this.item.type === 'equipment' || this.item.type === 'food' || this.item.type === 'spawn_egg') {
                    cvs = generateItemTexture(this.item.type, this.item.subtype, updateTex);
                } else if (this.item.type === 'wand') {
                    cvs = generateItemTexture('wand', this.item.subtype || 'wand_basic', updateTex);
                } else if (this.item.type === 'spell') {
                    cvs = generateItemTexture('spell', this.item.data.spell.element || 'spell_basic', updateTex);
                } else if (this.item.type === 'modifier') {
                    cvs = generateItemTexture('modifier', this.item.subtype, updateTex);
                }
                tex = new THREE.CanvasTexture(cvs);
                tex.magFilter = THREE.NearestFilter;
                tex.colorSpace = THREE.SRGBColorSpace;
                const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
                this.mesh = new THREE.Sprite(mat);
                this.mesh.scale.set(0.4, 0.4, 0.4);
            } else {
                const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 }); // generic item color
                this.mesh = new THREE.Mesh(geo, mat);
            }
            this.mesh.position.copy(this.position);
        }
        return this.mesh;
    }

    update(dt, world, playerPos) {
        if (!this.alive) return;
        this.age += dt;
        
        this.velocity.y -= 15 * dt; // gravity
        
        const velStep = this.velocity.clone().multiplyScalar(dt);
        const col = world.collide(this.position, velStep, 0.3, 0.3);
        this.position.copy(col.position);
        
        if (col.velocity.x === 0) this.velocity.x = 0;
        if (col.velocity.y === 0) this.velocity.y = 0;
        if (col.velocity.z === 0) this.velocity.z = 0;
        
        if (col.grounded) {
            this.velocity.x *= 0.5;
            this.velocity.z *= 0.5;
        }

        if (this.mesh) {
            this.mesh.position.copy(this.position);
            // Floating animation
            this.mesh.position.y += Math.sin(this.age * 3) * 0.1 + 0.15;
            if (this.mesh.rotation) {
                this.mesh.rotation.y += dt;
            }
        }

        // Pickup range
        if (this.age > 0.5 && this.position.distanceTo(playerPos) < 1.5) {
            this.alive = false;
        }
    }

    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                this.mesh.material.dispose();
                if (this.mesh.material.map) this.mesh.material.map.dispose();
            }
        }
    }
}

export class Mob {
    constructor(typeKey, position) {
        this.type = typeKey;
        const config = MOB_TYPES[typeKey] || MOB_TYPES.SLIME;
        this.config = config;
        this.position = position.clone();
        this.velocity = new THREE.Vector3(0,0,0);
        this.health = config.health;
        this.maxHealth = config.health;
        this.damage = config.damage;
        this.speed = config.speed;
        this.hostile = config.hostile;
        this.color = config.color;
        this.size = config.size;
        this.flying = config.flying || false;
        this.mesh = null;
        this.alive = true;
        this.grounded = false;
        this.age = 0;
        this.isMoving = false;
        
        this.target = null;
        this.attackCooldown = 0;
        this.tintTimer = 0;
        this.freezeTimer = 0;
        this.burnTimer = 0;
        this.burnTickTimer = 0;
        this.poisonTimer = 0;
        this.poisonTickTimer = 0;
        this.originalSpeed = config.speed;
        
        // Health bar
        this.healthBar = null;
    }

    getMesh() {
        if (!this.mesh) {
            if (this.config.buildMesh) {
                this.mesh = this.config.buildMesh();
            } else {
                // Fallback box
                this.mesh = new THREE.Group();
                const geo = new THREE.BoxGeometry(this.size, this.size, this.size);
                const mat = getMobMaterial(this.type);
                const body = new THREE.Mesh(geo, mat);
                body.position.y = this.size/2;
                body.castShadow = true;
                this.mesh.add(body);
            }
            
            // Ensure unique materials so tinting one doesn't tint all
            this.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(m => m.clone());
                    } else {
                        child.material = child.material.clone();
                    }
                }
            });

            // Add health bar above mob
            const barGroup = new THREE.Group();
            const bgGeo = new THREE.PlaneGeometry(0.6, 0.06);
            const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
            const bg = new THREE.Mesh(bgGeo, bgMat);
            barGroup.add(bg);
            
            const fgGeo = new THREE.PlaneGeometry(0.58, 0.04);
            const fgMat = new THREE.MeshBasicMaterial({ color: 0xff2244, side: THREE.DoubleSide });
            const fg = new THREE.Mesh(fgGeo, fgMat);
            fg.position.z = 0.001;
            this.healthBar = fg;
            barGroup.add(fg);
            
            barGroup.position.y = this.size + 0.3;
            barGroup.name = 'healthBar';
            this.mesh.add(barGroup);
            
            this.mesh.position.copy(this.position);
        }
        return this.mesh;
    }

    update(dt, world, playerPos) {
        if (!this.alive) return;
        this.age += dt;
        
        let inWater = false;
        const currentBlock = world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z));
        
        if (this.config.waterOnly) {
            const props = getBlockProperties(currentBlock);
            inWater = props && (props.isLiquid || props.isWaterlogged);
        }

        if (currentBlock === BLOCKS.FIRE || currentBlock === BLOCKS.LAVA) {
            this.burnTimer = 2.0;
        }

        if (!this.flying) {
            if (this.config.waterOnly && inWater) {
                // Buoyancy/swimming
                this.velocity.y += (Math.sin(this.age * 3) * 2.0 - this.velocity.y) * dt * 2;
            } else {
                this.velocity.y -= 25 * dt; // gravity
            }
        }
        
        // Decrease tint timer
        if (this.tintTimer > 0) {
            this.tintTimer -= dt;
            if (this.tintTimer <= 0 && this.mesh) {
                // Reset all materials to original colors
                this.mesh.traverse(child => {
                    if (child.isMesh && child.userData.originalColor !== undefined) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach((mat, idx) => {
                                if (Array.isArray(child.userData.originalColor) && child.userData.originalColor[idx] !== undefined) {
                                    if (mat.color) mat.color.setHex(child.userData.originalColor[idx]);
                                }
                            });
                        } else if (child.material && child.material.color) {
                            child.material.color.setHex(child.userData.originalColor);
                        }
                    }
                });
            }
        }

        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            this.speed = this.originalSpeed * 0.3;
            if (this.freezeTimer <= 0) {
                this.speed = this.originalSpeed;
            }
        }
        
        if (this.burnTimer > 0) {
            this.burnTimer -= dt;
            this.burnTickTimer -= dt;
            if (this.burnTickTimer <= 0) {
                this.health -= 2;
                this.burnTickTimer = 1.0;
                                if (this.health <= 0) {
                    this.alive = false;
                }
            }
        }

        if (this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            this.poisonTickTimer -= dt;
            if (this.poisonTickTimer <= 0) {
                this.health -= 1; // 1 damage per half second
                this.poisonTickTimer = 0.5;
                                if (this.health <= 0) {
                    this.alive = false;
                }
                // Tint green temporarily
                if (this.mesh && this.tintTimer <= 0) {
                    this.mesh.traverse(child => {
                        if (child.isMesh && child.material) {
                            if (Array.isArray(child.material)) {
                                if (child.userData.originalColor === undefined) {
                                    child.userData.originalColor = child.material.map(m => m.color ? m.color.getHex() : 0xffffff);
                                }
                                child.material.forEach(m => {
                                    if (m.color) m.color.setHex(0x33CC33);
                                });
                            } else if (child.material.color) {
                                if (child.userData.originalColor === undefined) {
                                    child.userData.originalColor = child.material.color.getHex();
                                }
                                child.material.color.setHex(0x33CC33);
                            }
                        }
                    });
                    this.tintTimer = 0.2;
                }
            }
        }

        // AI Delegation
        this.isMoving = false;
        if (this.config.updateAI) {
            this.config.updateAI(this, dt, world, playerPos);
            // Deduce moving state from velocity (ignore small Y adjustments like floating/bobbing)
            if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1) {
                this.isMoving = true;
            }
        } else {
            // Simple Generic AI
            const dist = this.position.distanceTo(playerPos);
        
        if (!this.wanderTimer) this.wanderTimer = 0;
        if (!this.wanderDir) this.wanderDir = new THREE.Vector3(0, 0, 0);
        
        if (this.hostile && dist < 20) {
            const dir = _tempVec3.subVectors(playerPos, this.position);
            if (!this.flying) dir.y = 0;
            if (dir.length() > 0) dir.normalize();
            
            if (dist > 1.5) {
                this.isMoving = true;
                this.velocity.x = dir.x * this.speed;
                this.velocity.z = dir.z * this.speed;
                
                if (this.flying) {
                    const targetY = playerPos.y + 1;
                    this.velocity.y = (targetY - this.position.y) * 2;
                }
                
                // Face player
                if (this.mesh) {
                    this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                }
                
                // Jump over obstacles (non-flying mobs)
                if (!this.flying && this.grounded && Math.random() < dt * 3) {
                    // Check if blocked ahead
                    const aheadX = Math.floor(this.position.x + dir.x);
                    const aheadY = Math.floor(this.position.y);
                    const aheadZ = Math.floor(this.position.z + dir.z);
                    const blockAhead = world.getBlock(aheadX, aheadY, aheadZ);
                    if (getBlockProperties(blockAhead).solid) {
                        this.velocity.y = 7;
                        this.grounded = false;
                    }
                }
            } else {
                this.velocity.x *= 0.8;
                this.velocity.z *= 0.8;
                if (this.attackCooldown <= 0) {
                    this.attackCooldown = 1.0;
                    this.didAttack = true;
                }
            }
        } else {
            // Wander
            if (this.wanderTimer <= 0) {
                if (Math.random() < 0.6) {
                    this.wanderTimer = 2 + Math.random() * 3;
                    const angle = Math.random() * Math.PI * 2;
                    this.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
                } else {
                    this.wanderTimer = 1 + Math.random() * 3;
                    this.wanderDir.set(0, 0, 0); // stop
                }
            }
            this.wanderTimer -= dt;

            if (this.wanderDir.lengthSq() > 0) {
                this.isMoving = true;
                this.velocity.x = this.wanderDir.x * this.speed * 0.4;
                this.velocity.z = this.wanderDir.z * this.speed * 0.4;
                
                if (this.flying) {
                    // Slight bobbing
                    this.velocity.y = Math.sin(this.age * 2) * 1.5;
                }
                
                if (this.mesh) {
                    this.mesh.rotation.y = Math.atan2(this.wanderDir.x, this.wanderDir.z);
                }

                // Jump over obstacles
                if (!this.flying && this.grounded && Math.random() < dt * 2) {
                    const aheadX = Math.floor(this.position.x + this.wanderDir.x);
                    const aheadY = Math.floor(this.position.y);
                    const aheadZ = Math.floor(this.position.z + this.wanderDir.z);
                    const blockAhead = world.getBlock(aheadX, aheadY, aheadZ);
                    if (getBlockProperties(blockAhead).solid) {
                        this.velocity.y = 6;
                        this.grounded = false;
                    }
                }
            } else {
                this.velocity.x *= 0.8;
                this.velocity.z *= 0.8;
                if (this.flying || this.config.waterOnly) this.velocity.y *= 0.9;
            }
        } // End of else Wander
        } // End of else Generic AI

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const velStep = this.velocity.clone().multiplyScalar(dt);
        const col = world.collide(this.position, velStep, this.size * 0.8, this.size);
        this.position.copy(col.position);
        
        if (col.velocity.x === 0) this.velocity.x = 0;
        if (col.velocity.z === 0) this.velocity.z = 0;
        if (col.velocity.y === 0) this.velocity.y = 0;

        if (!this.flying && !this.config.waterOnly) {
            this.grounded = col.grounded;
        } else {
            // Flying / swimming extra boundary checks
            if (this.position.y < 0) {
                this.position.y = 0;
                this.velocity.y *= -0.5;
            }
        }
        
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            
            // Animate
            if (this.config.animate) {
                this.config.animate(this.mesh, dt, this.age, this.isMoving);
            }
            
            // Update health bar
            if (this.healthBar) {
                const pct = this.health / this.maxHealth;
                this.healthBar.scale.x = Math.max(0, pct);
                this.healthBar.position.x = -(1 - pct) * 0.29;
                // Show only when damaged
                const barGroup = this.mesh.getObjectByName('healthBar');
                if (barGroup) barGroup.visible = this.health < this.maxHealth;
            }
        }
    }

    takeDamage(amt, dir) {
        this.health -= amt;
        
        // Damage tint — color all child meshes red
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        if (child.userData.originalColor === undefined) {
                            child.userData.originalColor = child.material.map(m => m.color ? m.color.getHex() : 0xffffff);
                        }
                        child.material.forEach(m => {
                            if (m.color) m.color.setHex(0xff0000);
                        });
                    } else if (child.material.color) {
                        if (child.userData.originalColor === undefined) {
                            child.userData.originalColor = child.material.color.getHex();
                        }
                        child.material.color.setHex(0xff0000);
                    }
                }
            });
            this.tintTimer = 0.2;
        }

        if (dir) {
            this.velocity.add(_tempVec3.copy(dir).multiplyScalar(5));
            this.velocity.y += 3;
            this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        }
        if (this.health <= 0 && this.alive) {
            this.alive = false;
            this.justDied = true;
        }
    }

    freeze(duration) {
        this.freezeTimer = Math.max(this.freezeTimer || 0, duration);
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        if (child.userData.originalColor === undefined) {
                            child.userData.originalColor = child.material.map(m => m.color ? m.color.getHex() : 0xffffff);
                        }
                        child.material.forEach(m => {
                            if (m.color) m.color.setHex(0x88ccff);
                        });
                    } else if (child.material.color) {
                        if (child.userData.originalColor === undefined) {
                            child.userData.originalColor = child.material.color.getHex();
                        }
                        child.material.color.setHex(0x88ccff); // blue tint
                    }
                }
            });
            this.tintTimer = Math.max(this.tintTimer, duration);
        }
    }

    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else if (child.material) {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}

export class Boss extends Mob {
    constructor(typeKey, position, bossTheme = 'normal') {
        super(typeKey, position);
        this.health *= 3;
        this.maxHealth = this.health;
        this.damage *= 2;
        this.speed *= 0.8;
        this.isBoss = true;
        this.phase = 1;
        this.abilityTimer = 0;
        this.didSlam = false;
        this.wantsToSummon = false;
        this.bossTheme = bossTheme;
        this.wantsToCastFireball = false;
        this.wantsToFreeze = false;
        this.wantsToPull = false;
        this.wantsToTeleport = false;
        this.wantsToDrain = false;
    }
    
    getMesh() {
        super.getMesh();
        // Scale boss mesh up significantly
        if (this.mesh) {
            this.mesh.scale.setScalar(2.0);
        }
        return this.mesh;
    }

    update(dt, world, playerPos) {
        super.update(dt, world, playerPos);
        if (!this.alive) return;

        const dist = this.position.distanceTo(playerPos);
        if (dist > 32) return;

        // Phase Transition (Enrage below 50% health)
        const pct = this.health / this.maxHealth;
        if (this.phase === 1 && pct <= 0.5) {
            this.phase = 2;
            this.speed *= 1.3;
            this.damage *= 1.3;
            if (this.mesh) {
                this.mesh.traverse(child => {
                    if (child.isMesh && child.material && child.material.emissive) {
                        child.material.emissive.setHex(0x550000);
                        child.material.emissiveIntensity = 1.5;
                    }
                });
            }
        }

        // Theme-specific abilities
        this.abilityTimer += dt;
        const abilityInterval = this.phase === 1 ? 5.0 : 3.5;

        if (this.abilityTimer > abilityInterval) {
            this.abilityTimer = 0;
            const r = Math.random();

            switch (this.bossTheme) {
                case 'fire':
                    if (r < 0.5) {
                        this.wantsToCastFireball = true; // Fireball barrage
                    } else {
                        this.velocity.y = 8; this.didSlam = true; // Fire slam
                    }
                    break;
                case 'ice':
                    if (r < 0.5) {
                        this.wantsToFreeze = true; // Freeze blast
                    } else {
                        this.wantsToSummon = true;
                    }
                    break;
                case 'jungle':
                    if (r < 0.5) {
                        this.wantsToPull = true; // Vine grab
                    } else {
                        this.velocity.y = 8; this.didSlam = true;
                    }
                    break;
                case 'desert':
                    if (r < 0.5) {
                        this.wantsToTeleport = true; // Teleport behind player
                    } else {
                        this.velocity.y = 8; this.didSlam = true;
                    }
                    break;
                case 'undead':
                    if (r < 0.4) {
                        this.wantsToDrain = true; // Soul drain
                    } else {
                        this.wantsToSummon = true; // Mass summon
                    }
                    break;
                default: // normal
                    if (r < 0.5) {
                        this.velocity.y = 8; this.didSlam = true;
                    } else {
                        this.wantsToSummon = true;
                    }
                    break;
            }
        }
    }
}

export class EntityManager {
    constructor(scene, atlas) {
        this.scene = scene;
        this.atlas = atlas;
        this.mobs = [];
        this.items = [];
        this.spawnTimer = 0;
    }

    addMob(mob) {
        mob.manager = this;
        this.mobs.push(mob);
        this.scene.add(mob.getMesh());
    }

    spawnItem(item, count, position, velocity = null) {
        const iEntity = new ItemEntity(item, count, position, this.atlas, velocity);
        this.items.push(iEntity);
        this.scene.add(iEntity.getMesh());
    }

    update(dt, world, playerPos, playerInventory, player, timeOfDay = 0.5, currentDimension = 'overworld') {
        // Day: 0.25 to 0.75. Night: 0.75-1.0 and 0.0-0.25
        const isDay = timeOfDay >= 0.25 && timeOfDay <= 0.75;
        // Boss spawner detection
        this.bossScanTimer = (this.bossScanTimer || 0) + dt;
        if (this.bossScanTimer > 2.0) {
            this.bossScanTimer = 0;
            const px = Math.floor(playerPos.x);
            const py = Math.floor(playerPos.y);
            const pz = Math.floor(playerPos.z);
            for (let x = -16; x <= 16; x++) {
                for (let y = -16; y <= 16; y++) {
                    for (let z = -16; z <= 16; z++) {
                        if (world.getBlock(px+x, py+y, pz+z) === BLOCKS.BOSS_SPAWNER) {
                            world.setBlock(px+x, py+y, pz+z, BLOCKS.AIR);
                            // Determine boss type based on surrounding blocks (theme)
                            let themeBlock = world.getBlock(px+x, py+y-1, pz+z);
                            let bossType = 'GOLEM';
                            let bossTheme = 'normal';
                            if (themeBlock === BLOCKS.DUNGEON_FIRE_FLOOR || themeBlock === BLOCKS.NETHER_BRICKS) { bossType = 'PIGLIN_BRUISER'; bossTheme = 'fire'; }
                            else if (themeBlock === BLOCKS.DUNGEON_ICE_FLOOR) { bossType = 'SKELETON'; bossTheme = 'ice'; }
                            else if (themeBlock === BLOCKS.DUNGEON_JUNGLE_FLOOR) { bossType = 'SPIDER'; bossTheme = 'jungle'; }
                            else if (themeBlock === BLOCKS.DUNGEON_DESERT_FLOOR) { bossType = 'ZOMBIE'; bossTheme = 'desert'; }
                            else if (themeBlock === BLOCKS.DUNGEON_UNDEAD_FLOOR) { bossType = 'SKELETON'; bossTheme = 'undead'; }
                            const boss = new Boss(bossType, new THREE.Vector3(px+x, py+y, pz+z), bossTheme);
                            this.addMob(boss);
                        }
                    }
                }
            }
        }

        // Mob Spawning with timer
        this.spawnTimer += dt;
        if (this.spawnTimer > 2.0 && this.mobs.length < 20) {
            this.spawnTimer = 0;
            if (Math.random() < 0.4) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 18 + Math.random() * 20;
                const sx = playerPos.x + Math.cos(angle) * dist;
                const sz = playerPos.z + Math.sin(angle) * dist;
                
                // Find surface
                for (let y = 127; y > 0; y--) {
                    const b = world.getBlock(sx, y, sz);
                    if (b !== BLOCKS.AIR && b !== BLOCKS.LAVA) {
                        let type;
                        if (b === BLOCKS.WATER || b === BLOCKS.SWAMP_WATER) {
                            let isReef = false;
                            for (let cx = -2; cx <= 2; cx++) {
                                for (let cz = -2; cz <= 2; cz++) {
                                    const fb = world.getBlock(sx + cx, y - 1, sz + cz);
                                    if (fb >= BLOCKS.TUBE_CORAL && fb <= BLOCKS.HORN_CORAL) {
                                        isReef = true;
                                        break;
                                    }
                                }
                                if (isReef) break;
                            }
                            
                            if (isReef) {
                                const reefAquatic = ['TROPICAL_FISH', 'PUFFERFISH'];
                                type = reefAquatic[Math.floor(Math.random() * reefAquatic.length)];
                            } else {
                                const aquatic = ['SALMON', 'COD', 'TURTLE'];
                                type = aquatic[Math.floor(Math.random() * aquatic.length)];
                            }
                        } else {
                            const biomeBlock = b;
                            let biome = 'plains';
                            if (biomeBlock === BLOCKS.SAND || biomeBlock === BLOCKS.RED_SAND) biome = 'desert';
                            else if (biomeBlock === BLOCKS.SNOW) biome = 'snow';
                            else if (biomeBlock === BLOCKS.SWAMP_GRASS) biome = 'swamp';
                            else if (biomeBlock === BLOCKS.ALIEN_GRASS) biome = 'alien';

                            type = pickRandomMobType(currentDimension, biome);
                            while(MOB_TYPES[type].waterOnly) {
                                type = pickRandomMobType(currentDimension, biome);
                            }
                        }
                // Only allow hostile surface spawns at night (except in Nether)
                        const config = MOB_TYPES[type];
                        const isHostile = (config.damage || 0) > 0;
                        if (isHostile && isDay && !config.flying && !config.waterOnly && currentDimension !== 'nether') break; // Skip surface hostiles during day

                        let spawnY = y + 2;
                        if (config.flying) spawnY = y + 5 + Math.random() * 10;
                        if (config.waterOnly) {
                            // Find highest non-solid block from surface
                            spawnY = y;
                            // Ensure they don't clip into shallow lake floors
                            const floorDist = Math.floor(Math.random() * 2);
                            for (let i = 0; i < floorDist; i++) {
                                const below = world.getBlock(sx, spawnY - 1, sz);
                                if (below === BLOCKS.WATER || below === BLOCKS.SWAMP_WATER) spawnY--;
                                else break;
                            }
                        }
                        
                        const spawnCount = config.waterOnly ? (Math.floor(Math.random() * 3) + 2) : 1; // 2 to 4 fish per spawn attempt
                        
                        for (let i = 0; i < spawnCount; i++) {
                            if (this.mobs.length >= 30) break; // Increased global limit slightly if spawning groups
                            const offsetX = config.waterOnly ? (Math.random() - 0.5) * 4 : 0;
                            const offsetZ = config.waterOnly ? (Math.random() - 0.5) * 4 : 0;
                            const mob = new Mob(type, new THREE.Vector3(sx + offsetX, spawnY, sz + offsetZ));
                            this.addMob(mob);
                        }
                        break;
                    }
                }
            }
        }

        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i];
            mob.update(dt, world, playerPos);
            
            // Mob deals damage to player
            if (player && mob.alive && mob.didAttack && mob.position.distanceTo(playerPos) < 2.0) {
                player.takeDamage(mob.damage);
                mob.didAttack = false;
                // Damage flash
                const d = document.getElementById('damage-flash');
                if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
            }

            // Boss Abilities
            if (mob.isBoss && player && mob.alive) {
                if (mob.didSlam && mob.grounded && mob.velocity.y <= 0) {
                    mob.didSlam = false;
                    const dist = mob.position.distanceTo(playerPos);
                    if (dist < 10) {
                        player.takeDamage(mob.damage * 1.5);
                        player.velocity.y = 6; // Knockup effect
                        const d = document.getElementById('damage-flash');
                        if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                    }
                }
                if (mob.wantsToSummon) {
                    mob.wantsToSummon = false;
                    const count = mob.bossTheme === 'undead' ? 3 : 1;
                    for (let si = 0; si < count; si++) {
                        const sx = mob.position.x + (Math.random() - 0.5) * 6;
                        const sz = mob.position.z + (Math.random() - 0.5) * 6;
                        let minionTypes = ['SKELETON', 'ZOMBIE', 'SPIDER'];
                        if (mob.bossTheme === 'undead') minionTypes = ['SKELETON', 'ZOMBIE'];
                        else if (mob.bossTheme === 'ice') minionTypes = ['SKELETON'];
                        const minion = new Mob(minionTypes[Math.floor(Math.random() * minionTypes.length)], new THREE.Vector3(sx, mob.position.y + 1, sz));
                        this.addMob(minion);
                    }
                }
                if (mob.wantsToCastFireball) {
                    mob.wantsToCastFireball = false;
                    mob.wantsToCastWind = playerPos.clone().sub(mob.position).normalize();
                }
                if (mob.wantsToFreeze) {
                    mob.wantsToFreeze = false;
                    if (player && mob.position.distanceTo(playerPos) < 12) {
                        player.speedMultiplier = 0.3;
                        setTimeout(() => { if (player) player.speedMultiplier = 1.0; }, 3000);
                    }
                }
                if (mob.wantsToPull) {
                    mob.wantsToPull = false;
                    if (player && mob.position.distanceTo(playerPos) < 16) {
                        const pullDir = mob.position.clone().sub(playerPos).normalize().multiplyScalar(8);
                        player.velocity.x += pullDir.x;
                        player.velocity.z += pullDir.z;
                        player.velocity.y += 2;
                    }
                }
                if (mob.wantsToTeleport) {
                    mob.wantsToTeleport = false;
                    if (player) {
                        const behind = playerPos.clone();
                        const facing = new THREE.Vector3(0, 0, -1).applyQuaternion(player.mesh ? player.mesh.quaternion : new THREE.Quaternion());
                        behind.addScaledVector(facing, -3);
                        mob.position.copy(behind);
                        mob.position.y = playerPos.y;
                    }
                }
                if (mob.wantsToDrain) {
                    mob.wantsToDrain = false;
                    if (player && mob.position.distanceTo(playerPos) < 10) {
                        const drainDmg = 8;
                        player.takeDamage(drainDmg);
                        mob.health = Math.min(mob.maxHealth, mob.health + drainDmg * 2);
                        const d = document.getElementById('damage-flash');
                        if (d) { d.classList.add('active'); setTimeout(() => d.classList.remove('active'), 200); }
                    }
                }
            }
            
            if (mob.justDied) {
                if (mob.type === 'SHEEP') {
                    this.spawnItem(Item.blockItem(BLOCKS.WOOL, 'Wool'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                    this.spawnItem(Item.foodItem('raw_mutton', 12, 'Raw Mutton', 'Heals some health.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'COW') {
                    this.spawnItem(Item.foodItem('raw_beef', 15, 'Raw Beef', 'Heals some health.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'PIG') {
                    this.spawnItem(Item.foodItem('raw_porkchop', 15, 'Raw Porkchop', 'Heals some health.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'CHICKEN') {
                    this.spawnItem(Item.foodItem('raw_chicken', 10, 'Raw Chicken', 'Heals a little health.'), 1, mob.position.clone());
                    if (Math.random() < 0.5) this.spawnItem(Item.materialItem('feather', 'Feather', 'Used for crafting.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (['COD', 'SALMON', 'TROPICAL_FISH', 'PUFFERFISH'].includes(mob.type)) {
                    this.spawnItem(Item.foodItem('raw_fish', 10, 'Raw Fish', 'Heals some health.'), 1, mob.position.clone());
                } else if (mob.type === 'TURTLE') {
                    if (Math.random() < 0.3) this.spawnItem(Item.materialItem('turtle_scute', 'Turtle Scute', 'Tough material.'), 1, mob.position.clone());
                } else if (mob.type === 'CREEPER') {
                    this.spawnItem(Item.materialItem('gunpowder', 'Gunpowder', 'Explosive powder.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'ENDERMAN') {
                    if (Math.random() < 0.6) {
                        const pearl = new Item('material', 'ender_pearl', {}, 'Ender Pearl');
                        pearl.stackable = true;
                        pearl.maxStack = 16;
                        this.spawnItem(pearl, 1, mob.position.clone());
                    }
                } else if (mob.type === 'ZOMBIE') {
                    this.spawnItem(Item.materialItem('rotten_flesh', 'Rotten Flesh', 'Gross.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'SKELETON') {
                    this.spawnItem(Item.materialItem('bone', 'Bone', 'Calcium rich.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'SPIDER') {
                    this.spawnItem(Item.materialItem('string', 'String', 'Silk thread.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'SLIME') {
                    this.spawnItem(Item.materialItem('slime_ball', 'Slimeball', 'Sticky green slime.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'LAVASLIME') {
                    this.spawnItem(Item.materialItem('lavaslime_ball', 'Magma Cream', 'Hot and sticky.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                } else if (mob.type === 'PIGLIN_BRUISER') {
                    this.spawnItem(Item.materialItem('nether_scrap', 'Nether Scrap', 'Tough nether metal.'), 1 + Math.floor(Math.random() * 2), mob.position.clone());
                    if (Math.random() < 0.2) this.spawnItem(Item.materialItem('gold_ingot', 'Gold Ingot', 'Shiny.'), 1, mob.position.clone());
                } else if (mob.type === 'GOLEM') {
                    this.spawnItem(Item.materialItem('iron_ingot', 'Iron Ingot', 'Solid iron.'), 3 + Math.floor(Math.random() * 3), mob.position.clone());
                }
                
                // Generic drop logic (Spells/Modifiers)
                if (Math.random() < (mob.config.lootChance || 0.3)) {
                    if (Math.random() < 0.7) {
                        this.spawnItem(Item.spellItem(generateRandomSpell()), 1, mob.position.clone());
                    } else {
                        this.spawnItem(Item.modifierItem(generateRandomModifier()), 1, mob.position.clone());
                    }
                }
                
                // Boss Loot
                if (mob.isBoss) {
                    const r = Math.random();
                    if (r < 0.25) {
                        this.spawnItem(Item.equipmentItem('boss_chestplate', { protection: 5 }, 'Boss Armor', 'Wearable armor that reduces damage.'), 1, mob.position.clone());
                    } else if (r < 0.5) {
                        this.spawnItem(Item.equipmentItem('boss_boots', { flying: true }, 'Flying Boots', 'Allows you to fly.'), 1, mob.position.clone());
                    } else if (r < 0.75) {
                        this.spawnItem(Item.equipmentItem('boss_boots', { speedMult: 2.5 }, 'Speed Boots', 'Run super fast.'), 1, mob.position.clone());
                    } else {
                        this.spawnItem(Item.equipmentItem('boss_axe', { mineSpeed: 5.0 }, 'Super Mine Axe', 'Mines blocks instantly.'), 1, mob.position.clone());
                    }
                    // Boss always drops ender pearls
                    const pearlItem = new Item('material', 'ender_pearl', {}, 'Ender Pearl');
                    pearlItem.stackable = true;
                    pearlItem.maxStack = 16;
                    this.spawnItem(pearlItem, 2 + Math.floor(Math.random() * 3), mob.position.clone().add(new THREE.Vector3(0.5, 0.5, 0)));
                }

                mob.justDied = false;
            }

            // Despawn far mobs
            if (!mob.alive || mob.position.distanceTo(playerPos) > 60) {
                mob.dispose();
                this.mobs.splice(i, 1);
            }
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            const itemE = this.items[i];
            itemE.update(dt, world, playerPos);
            if (!itemE.alive) {
                // Was picked up
                playerInventory.addItem(itemE.item, itemE.count);
                itemE.dispose();
                this.items.splice(i, 1);
            }
        }
    }

    raycast(origin, direction, maxDist = 8) {
        let closestMob = null;
        let closestDist = maxDist;

        // Simple AABB ray intersection
        for (const mob of this.mobs) {
            if (!mob.alive) continue;
            
            // Mob AABB
            _tempMin.set(mob.position.x - mob.size/2, mob.position.y, mob.position.z - mob.size/2);
            _tempMax.set(mob.position.x + mob.size/2, mob.position.y + mob.size, mob.position.z + mob.size/2);
            _tempBox.set(_tempMin, _tempMax);
            _tempRay.set(origin, direction);
            
            if (_tempRay.intersectBox(_tempBox, _tempHit)) {
                const dist = origin.distanceTo(_tempHit);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestMob = mob;
                }
            }
        }
        return { hit: closestMob !== null, mob: closestMob, distance: closestDist };
    }

    // Alias for backwards compatibility
    raycastEntities(origin, direction, maxDist) {
        return this.raycast(origin, direction, maxDist);
    }
}
