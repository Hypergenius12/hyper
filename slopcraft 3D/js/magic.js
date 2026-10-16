// ============================================
// magic.js � Spells, Modifiers, Wands, Projectiles
// ============================================
import * as THREE from 'three';
import { generateSpellTexture } from './textures.js?v=116';

const _tempVecProj1 = new THREE.Vector3();
const _tempVecProj2 = new THREE.Vector3();

let MAGIC_ID_COUNTER = 0;
function getUniqueId() { return `magic_${MAGIC_ID_COUNTER++}`; }

export const SPELL_TYPES = {
    BOLT: { name: 'Arcane Bolt', baseDamage: 15, baseManaCost: 5, baseCooldown: 0, projectileSpeed: 20, projectileCount: 1, element: 'ICE', color: 0x0088ff, description: 'Fires a fast moving magical bolt.' },
    BURST: { name: 'Fire Burst', baseDamage: 25, baseManaCost: 15, baseCooldown: 0, projectileSpeed: 10, projectileCount: 5, element: 'FIRE', color: 0xff4422, description: 'Fires a spread of burning projectiles.' },
    HEAL: { name: 'Nature Grace', baseDamage: -20, baseManaCost: 30, baseCooldown: 0, projectileSpeed: 5, projectileCount: 1, element: 'HEAL', color: 0xadff2f, description: 'Heals the caster instantly.' },
    MISSILE: { name: 'Magic Missile', baseDamage: 30, baseManaCost: 20, baseCooldown: 0, projectileSpeed: 8, projectileCount: 1, element: 'arcane', color: 0x4488ff, description: 'A slow but powerful homing missile.', homing: true },
    METEOR: { name: 'Meteor Strike', baseDamage: 100, baseManaCost: 50, baseCooldown: 0, projectileSpeed: 15, projectileCount: 1, element: 'FIRE', color: 0xffaa00, description: 'Calls down a massive meteor.' },
    EARTH: { name: 'Boulder Toss', baseDamage: 40, baseManaCost: 25, baseCooldown: 0, projectileSpeed: 12, projectileCount: 1, element: 'EARTH', color: 0x8B4513, description: 'Hurls a massive boulder that deals heavy damage.' },
    THUNDER: { name: 'Lightning Strike', baseDamage: 60, baseManaCost: 35, baseCooldown: 0, projectileSpeed: 40, projectileCount: 1, element: 'THUNDER', color: 0xFFFF00, description: 'A lightning-fast bolt that strikes instantly.' },
    DARK: { name: 'Shadow Drain', baseDamage: 20, baseManaCost: 15, baseCooldown: 0, projectileSpeed: 14, projectileCount: 1, element: 'DARK', color: 0x6600CC, description: 'Drains life from enemies to heal the caster.' },
    WIND: { name: 'Gale Force', baseDamage: 10, baseManaCost: 8, baseCooldown: 0, projectileSpeed: 30, projectileCount: 3, element: 'WIND', color: 0x99FFCC, description: 'Fires a spread of fast wind blades.' },
    CHAIN: { name: 'Chain Lightning', baseDamage: 25, baseManaCost: 30, baseCooldown: 0, projectileSpeed: 25, projectileCount: 4, element: 'THUNDER', color: 0x88CCFF, description: 'Shoots multiple bolts that arc between targets.' },
    POISON: { name: 'Toxic Spit', baseDamage: 5, baseManaCost: 15, baseCooldown: 0, projectileSpeed: 10, projectileCount: 1, element: 'POISON', color: 0x33CC33, description: 'Fires a venomous blob that poisons enemies.' },
    WATER: { name: 'Aqua Jet', baseDamage: 0, baseManaCost: 10, baseCooldown: 0, projectileSpeed: 18, projectileCount: 1, element: 'WATER', color: 0x3399FF, description: 'High knockback. Extinguishes fire and turns lava to obsidian.' },
    LAVA: { name: 'Magma Bomb', baseDamage: 40, baseManaCost: 40, baseCooldown: 0, projectileSpeed: 8, projectileCount: 1, element: 'LAVA', color: 0xFF6600, description: 'Heavy projectile that spawns lava on impact.' },
    VOID: { name: 'Void Sphere', baseDamage: 150, baseManaCost: 80, baseCooldown: 0, projectileSpeed: 5, projectileCount: 1, element: 'VOID', color: 0x8800CC, description: 'Slow moving orb that destroys blocks on impact.' },
    LIGHT: { name: 'Sunbeam', baseDamage: 20, baseManaCost: 20, baseCooldown: 0, projectileSpeed: 80, projectileCount: 1, element: 'LIGHT', color: 0xFFFF88, description: 'Extremely fast beam that pierces targets.', pierce: true },
    FROST: { name: 'Frost Nova', baseDamage: 0, baseManaCost: 30, baseCooldown: 0, projectileSpeed: 15, projectileCount: 1, element: 'FROST', color: 0x00FFFF, description: 'Freezes all nearby entities on impact.' },
    BUILDER: { name: 'Stone Wall', baseDamage: 0, baseManaCost: 20, baseCooldown: 0, projectileSpeed: 25, projectileCount: 1, element: 'BUILDER', color: 0xAAAAAA, description: 'Instantly builds a stone wall where it hits.' }
};

export const MODIFIER_TYPES = {
    DAMAGE_UP: { name: 'Damage +25%', rarity: 'common', stackable: true, maxStacks: 5, effect: (s) => { s.damageMult += 0.25; }, description: 'Increases spell damage by 25%.' },
    SPEED_UP: { name: 'Speed +50%', rarity: 'common', stackable: true, maxStacks: 3, effect: (s) => { s.speedMult += 0.50; }, description: 'Increases projectile speed by 50%.' },
    MANA_EFF: { name: 'Mana Cost -20%', rarity: 'common', stackable: true, maxStacks: 3, effect: (s) => { s.manaMult *= 0.8; }, description: 'Reduces mana cost by 20%.' },
    PIERCE: { name: 'Pierce', rarity: 'uncommon', stackable: false, maxStacks: 1, effect: (s) => { s.pierce = true; }, description: 'Projectiles pass through enemies.' },
    HOMING: { name: 'Homing', rarity: 'uncommon', stackable: false, maxStacks: 1, effect: (s) => { s.homing = true; }, description: 'Projectiles seek out the nearest target.' },
    BURN: { name: 'Burn', rarity: 'uncommon', stackable: false, maxStacks: 1, effect: (s) => { s.statusEffects.push('burn'); }, description: 'Sets enemies on fire for 5 seconds.' },
    MULTIPLY: { name: 'Multiply', rarity: 'rare', stackable: true, maxStacks: 2, effect: (s) => { s.projCountMult += 1; }, description: 'Doubles the number of projectiles.' },
    CAST_TWO: { name: 'Cast Two', rarity: 'epic', stackable: false, maxStacks: 1, effect: (s) => { s.castTwo = true; }, description: 'Doubles all projectile counts.' }
};

export class Modifier {
    constructor(typeKey) {
        const config = MODIFIER_TYPES[typeKey];
        this.type = typeKey;
        this.name = config.name;
        this.rarity = config.rarity;
        this.config = config;
        this.id = getUniqueId();
    }
}

export class Spell {
    constructor(typeKey) {
        this.type = typeKey;
        const config = SPELL_TYPES[typeKey];
        this.name = config.name;
        this.baseDamage = config.baseDamage;
        this.baseManaCost = config.baseManaCost;
        this.baseCooldown = config.baseCooldown;
        this.baseProjSpeed = config.projectileSpeed;
        this.baseProjCount = config.projectileCount;
        this.element = config.element;
        this.color = config.color;
        
        this.modifiers = [];
        this.id = getUniqueId();
    }

    addModifier(mod) {
        if (!mod.config.stackable && this.modifiers.some(m => m.type === mod.type)) return false;
        if (mod.config.stackable && this.modifiers.filter(m => m.type === mod.type).length >= mod.config.maxStacks) return false;
        this.modifiers.push(mod);
        return true;
    }

    removeModifier(index) {
        this.modifiers.splice(index, 1);
    }

    getCalculatedStats() {
        const config = SPELL_TYPES[this.type];
        const stats = {
            damageMult: 1.0, speedMult: 1.0, manaMult: 1.0, projCountMult: 1.0,
            pierce: config.pierce || false, homing: config.homing || false, statusEffects: [], castTwo: false
        };
        for (const mod of this.modifiers) {
            mod.config.effect(stats);
        }
        return {
            damage: this.baseDamage * stats.damageMult,
            manaCost: this.baseManaCost * stats.manaMult,
            cooldown: this.baseCooldown, // simple for now
            speed: this.baseProjSpeed * stats.speedMult,
            count: Math.floor(this.baseProjCount * stats.projCountMult) * (stats.castTwo ? 2 : 1),
            pierce: stats.pierce, homing: stats.homing,
            effects: stats.statusEffects, castTwo: stats.castTwo,
            element: this.element
        };
    }
}

export class Wand {
    constructor(name, maxSlots, innateSpell = null) {
        this.name = name;
        this.maxSlots = maxSlots;
        this.innateSpell = innateSpell;
        this.spellSlots = new Array(maxSlots).fill(null);
        this.cooldowns = new Array(maxSlots).fill(0);
        this.id = getUniqueId();
    }

    equipSpell(index, spell) {
        if (index >= 0 && index < this.maxSlots) this.spellSlots[index] = spell;
    }

    updateCooldowns(dt) {
        for(let i=0; i<this.cooldowns.length; i++) {
            if (this.cooldowns[i] > 0) this.cooldowns[i] -= dt;
        }
    }

    cast(index, player) {
        if (index < 0 || index >= this.maxSlots) return null;
        let spellItem = this.spellSlots[index];
        if (!spellItem) return null;
        
        // Unwrap spell if it is an Item object
        let spell = spellItem;
        if (spellItem.type === 'spell' && spellItem.data && spellItem.data.spell) spell = spellItem.data.spell;
        else if (spellItem.item && spellItem.item.type === 'spell' && spellItem.item.data && spellItem.item.data.spell) spell = spellItem.item.data.spell;
        
        if (typeof spell.getCalculatedStats !== 'function') return null;

        const stats = spell.getCalculatedStats();
        if (!player.isCreative && !player.useMana(stats.manaCost)) return null;

        return { spell, stats };
    }

    castCombined(player) {
        // Gather all valid spells and modifiers
        const spells = [];
        const wandModifiers = [];

        for (let i = 0; i < this.maxSlots; i++) {
            let item = this.spellSlots[i];
            if (!item) continue;
            
            // Unwrap slot container if present
            let obj = item;
            if (item.item) item = item.item;
            
            if (item.data && item.data.spell) obj = item.data.spell;
            else if (item.data && item.data.mod) obj = item.data.mod;
            else if (item instanceof Spell || (item.getCalculatedStats && typeof item.getCalculatedStats === 'function')) obj = item;
            else if (item instanceof Modifier || (item.config && typeof item.config.effect === 'function')) obj = item;
            else if (item.type === 'spell' || item.spellType) {
                const rawKey = (item.subtype || item.spellType || item.name || '').toUpperCase().replace(/\s+/g, '_');
                const matchedKey = Object.keys(SPELL_TYPES).find(k => k === rawKey || SPELL_TYPES[k].name.toUpperCase() === rawKey.replace(/_/g, ' '));
                if (matchedKey) {
                    obj = new Spell(matchedKey);
                    if (!item.data) item.data = {};
                    item.data.spell = obj;
                }
            } else if (item.type === 'modifier' || item.modType) {
                const rawKey = (item.subtype || item.modType || item.name || '').toUpperCase().replace(/\s+/g, '_');
                const matchedMod = Object.keys(MODIFIER_TYPES).find(k => k === rawKey || MODIFIER_TYPES[k].name.toUpperCase() === rawKey.replace(/_/g, ' '));
                if (matchedMod) {
                    obj = new Modifier(matchedMod);
                    if (!item.data) item.data = {};
                    item.data.mod = obj;
                }
            }

            if (obj && typeof obj.getCalculatedStats === 'function') spells.push(obj);
            else if (obj && obj.config && typeof obj.config.effect === 'function') wandModifiers.push(obj);
        }
        
        // If no custom spells are loaded, fall back to innate wand spell so wands ALWAYS fire!
        if (spells.length === 0) {
            let fallbackKey = 'BOLT';
            const wName = (this.name || '').toLowerCase();
            const wSub = (this.subtype || '').toLowerCase();
            if (this.innateSpell && SPELL_TYPES[this.innateSpell]) fallbackKey = this.innateSpell;
            else if (wName.includes('fire') || wSub.includes('fire')) fallbackKey = 'BURST';
            else if (wName.includes('ice') || wSub.includes('ice')) fallbackKey = 'BOLT';
            else if (wName.includes('nature') || wSub.includes('nature')) fallbackKey = 'HEAL';
            else if (wName.includes('master') || wSub.includes('master')) fallbackKey = 'THUNDER';
            else if (wName.includes('void') || wSub.includes('void')) fallbackKey = 'VOID';
            else if (wName.includes('meteor') || wSub.includes('meteor')) fallbackKey = 'METEOR';
            spells.push(new Spell(fallbackKey));
        }

        // Combine stats: sum damage, sum mana cost, average speed, sum projectile count, merge effects
        let totalDamage = 0, totalMana = 0, totalSpeed = 0, totalCount = 0;
        let pierce = false, homing = false, castTwo = false;
        const effects = [];
        const elements = [];
        let dominantSpell = spells[0];
        let maxDmg = -1; // Use -1 so 0-damage spells can still become dominant if they are the only ones

        for (const spell of spells) {
            const stats = spell.getCalculatedStats();
            totalDamage += stats.damage;
            totalMana += stats.manaCost;
            totalSpeed += stats.speed;
            totalCount += stats.count;
            if (stats.pierce) pierce = true;
            if (stats.homing) homing = true;
            if (stats.castTwo) castTwo = true;
            if (stats.effects) effects.push(...stats.effects);
            elements.push(stats.element);
            // The spell with the highest absolute damage is dominant. If multiple 0 damage spells, the first is dominant.
            if (Math.abs(stats.damage) > maxDmg) { maxDmg = Math.abs(stats.damage); dominantSpell = spell; }
        }

        // Apply wand-level modifiers
        const modStats = {
            damageMult: 1.0, speedMult: 1.0, manaMult: 1.0, projCountMult: 1.0,
            pierce: false, homing: false, statusEffects: [], castTwo: false
        };
        for (const mod of wandModifiers) {
            mod.config.effect(modStats);
        }

        totalDamage *= modStats.damageMult;
        totalMana *= modStats.manaMult;
        totalSpeed *= modStats.speedMult;
        totalCount = Math.floor(totalCount * modStats.projCountMult);
        if (modStats.pierce) pierce = true;
        if (modStats.homing) homing = true;
        if (modStats.castTwo) castTwo = true;
        if (modStats.statusEffects) effects.push(...modStats.statusEffects);

        // Synergies
        let element = dominantSpell.element;
        let isSteam = elements.includes('FIRE') && elements.includes('WATER');
        let isMagma = elements.includes('FIRE') && elements.includes('EARTH');
        let isStorm = elements.includes('WATER') && elements.includes('THUNDER');
        let isVampiric = elements.includes('DARK') && elements.includes('HEAL');

        if (isSteam) element = 'STEAM';
        else if (isMagma) element = 'MAGMA';
        else if (isStorm) element = 'STORM';
        else if (isVampiric) element = 'VAMPIRIC';
        else element = elements.includes('FIRE') ? 'FIRE' : (elements.includes('ICE') ? 'ICE' : (elements.includes('HEAL') ? 'HEAL' : dominantSpell.element));

        totalMana = Math.min(100, totalMana);

        const combinedStats = {
            damage: totalDamage,
            manaCost: totalMana,
            speed: (totalSpeed / spells.length),
            count: Math.max(1, totalCount),
            pierce, homing, castTwo,
            effects: [...new Set(effects)],
            elements: [...new Set(elements)],
            spellTypes: spells.map(s => s.type),
            element: element,
            cooldown: 0
        };
        if (castTwo) combinedStats.count *= 2;

        if (!player.useMana(combinedStats.manaCost)) return null;
        return { spell: dominantSpell, stats: combinedStats };
    }
}

export class SpellProjectile {
    constructor(origin, direction, stats, spellColor) {
        this.position = origin.clone();
        this.previousPosition = origin.clone();
        this.velocity = direction.clone().normalize().multiplyScalar(stats.speed);
        this.stats = stats;
        this.color = spellColor;
        this.element = stats.element;
        this.elements = stats.elements ? [...stats.elements] : [stats.element];
        this.spellTypes = stats.spellTypes ? [...stats.spellTypes] : (stats.spell ? [stats.spell.type] : []);

        if (this.element === 'FIRE') this.color = 0xff3300;
        if (this.element === 'ICE') this.color = 0x00aaff;
        if (this.element === 'HEAL') this.color = 0x44ff44;
        if (this.element === 'EARTH') this.color = 0x8B5A2B;
        if (this.element === 'THUNDER') this.color = 0xFFFF22;
        if (this.element === 'DARK') this.color = 0x7700EE;
        if (this.element === 'WIND') this.color = 0x88FFEE;
        if (this.element === 'POISON') this.color = 0x33DD33;
        if (this.element === 'WATER') this.color = 0x2299FF;
        if (this.element === 'LAVA') this.color = 0xFF5500;
        if (this.element === 'VOID') this.color = 0x9900FF;
        if (this.element === 'LIGHT') this.color = 0xFFFFAA;
        if (this.element === 'FROST') this.color = 0x44FFFF;
        if (this.element === 'BUILDER') this.color = 0xAAAAAA;
        if (this.element === 'STEAM') this.color = 0xEEEEEE;
        if (this.element === 'MAGMA') this.color = 0xDD3300;
        if (this.element === 'STORM') this.color = 0x33FFFF;
        if (this.element === 'VAMPIRIC') this.color = 0xAA0033;
        this.alive = true;
        this.age = 0;
        this.maxAge = 5;
        this.mesh = null;
    }

    hasElement(el) {
        return (this.elements && this.elements.includes(el)) || this.element === el;
    }

    hasSpell(st) {
        return (this.spellTypes && this.spellTypes.includes(st)) || (this.stats && this.stats.spell && this.stats.spell.type === st);
    }

    getMesh() {
        if (!this.mesh) {
            const group = new THREE.Group();

            // Minecraft Mod-Style 3D Voxel/Runic Projectile Structure
            if (this.hasElement('BUILDER')) {
                // Stone Wall / Builder: Floating runic chiseled stone brick with glowing cyan glyph aura
                const coreGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
                const coreMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
                const coreMesh = new THREE.Mesh(coreGeo, coreMat);
                group.add(coreMesh);

                const runeGeo = new THREE.OctahedronGeometry(0.28);
                const runeMat = new THREE.MeshBasicMaterial({ color: 0x55ffff, wireframe: true });
                const runeMesh = new THREE.Mesh(runeGeo, runeMat);
                group.add(runeMesh);
                group.userData.outerRune = runeMesh;
            } else if (this.element === 'FIRE' || this.element === 'LAVA' || this.element === 'MAGMA') {
                // Blaze Fire / Magma: 3D blazing magma voxel with outer flame diamond
                const coreGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
                const coreMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
                const coreMesh = new THREE.Mesh(coreGeo, coreMat);
                group.add(coreMesh);

                const flameGeo = new THREE.OctahedronGeometry(0.26);
                const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
                const flameMesh = new THREE.Mesh(flameGeo, flameMat);
                group.add(flameMesh);
                group.userData.outerRune = flameMesh;
            } else if (this.element === 'ICE' || this.element === 'FROST') {
                // Frost Nova / Arcane Ice: Faceted ice crystal with crystalline gleam
                const coreGeo = new THREE.OctahedronGeometry(0.25);
                const coreMat = new THREE.MeshBasicMaterial({ color: 0x66eeff });
                const coreMesh = new THREE.Mesh(coreGeo, coreMat);
                group.add(coreMesh);

                const shellGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
                const shellMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 });
                const shellMesh = new THREE.Mesh(shellGeo, shellMat);
                group.add(shellMesh);
                group.userData.outerRune = shellMesh;
            } else if (this.element === 'THUNDER' || this.element === 'STORM') {
                // Lightning Bolt / Storm: Electric discharge beam and spinning core
                const boltGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8);
                const boltMat = new THREE.MeshBasicMaterial({ color: 0xffff22 });
                const boltMesh = new THREE.Mesh(boltGeo, boltMat);
                _tempVecProj1.set(0, 1, 0);
                boltMesh.quaternion.setFromUnitVectors(_tempVecProj1, _tempVecProj2.copy(this.velocity).normalize());
                group.add(boltMesh);

                const sparkGeo = new THREE.OctahedronGeometry(0.22);
                const sparkMat = new THREE.MeshBasicMaterial({ color: 0x55ffff, wireframe: true });
                const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
                group.add(sparkMesh);
                group.userData.outerRune = sparkMesh;
            } else if (this.element === 'VOID' || this.element === 'DARK') {
                // Void Sphere / Dark Drain: Black hole singularity with swirling nether-purple aura
                const coreGeo = new THREE.SphereGeometry(this.element === 'VOID' ? 0.45 : 0.28, 12, 12);
                const coreMat = new THREE.MeshBasicMaterial({ color: 0x110022 });
                const coreMesh = new THREE.Mesh(coreGeo, coreMat);
                group.add(coreMesh);

                const auraGeo = new THREE.OctahedronGeometry(this.element === 'VOID' ? 0.65 : 0.38);
                const auraMat = new THREE.MeshBasicMaterial({ color: 0x9900ff, wireframe: true });
                const auraMesh = new THREE.Mesh(auraGeo, auraMat);
                group.add(auraMesh);
                group.userData.outerRune = auraMesh;
            } else if (this.element === 'HEAL') {
                // Nature Grace: Glistening emerald/gold essence with blooming rune
                const coreGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
                const coreMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
                const coreMesh = new THREE.Mesh(coreGeo, coreMat);
                group.add(coreMesh);

                const petalGeo = new THREE.OctahedronGeometry(0.28);
                const petalMat = new THREE.MeshBasicMaterial({ color: 0xffff44, wireframe: true });
                const petalMesh = new THREE.Mesh(petalGeo, petalMat);
                group.add(petalMesh);
                group.userData.outerRune = petalMesh;
            } else if (this.element === 'EARTH') {
                // Boulder: Craggy geometric boulder
                const rockGeo = new THREE.BoxGeometry(0.44, 0.44, 0.44);
                const rockMat = new THREE.MeshBasicMaterial({ color: 0x8b5a2b });
                const rockMesh = new THREE.Mesh(rockGeo, rockMat);
                group.add(rockMesh);
            } else if (this.element === 'WIND') {
                // Gale Force: Swirling slipstream ring
                const ringGeo = new THREE.TorusGeometry(0.28, 0.08, 6, 16);
                const ringMat = new THREE.MeshBasicMaterial({ color: 0x88ffee, wireframe: true });
                const ringMesh = new THREE.Mesh(ringGeo, ringMat);
                group.add(ringMesh);
                group.userData.outerRune = ringMesh;
            } else if (this.element === 'POISON') {
                // Toxic Spit: Slime-droplet icosahedron
                const slimeGeo = new THREE.IcosahedronGeometry(0.28, 0);
                const slimeMat = new THREE.MeshBasicMaterial({ color: 0x33cc33 });
                const slimeMesh = new THREE.Mesh(slimeGeo, slimeMat);
                group.add(slimeMesh);
            } else {
                // Default Arcane: Glowing runic cube with diamond shroud
                const coreGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
                const coreMat = new THREE.MeshBasicMaterial({ color: this.color || 0x4488ff });
                const coreMesh = new THREE.Mesh(coreGeo, coreMat);
                group.add(coreMesh);

                const runeGeo = new THREE.OctahedronGeometry(0.26);
                const runeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.7 });
                const runeMesh = new THREE.Mesh(runeGeo, runeMat);
                group.add(runeMesh);
                group.userData.outerRune = runeMesh;
            }
            
            group.position.copy(this.position);
            this.mesh = group;
        }
        return this.mesh;
    }

    update(dt, entities) {
        this.age += dt;
        if (this.age >= this.maxAge) {
            this.alive = false;
            return;
        }

        if (this.stats.homing && entities && entities.length > 0) {
            let closestDist = Infinity;
            let closestMob = null;
            for (let mob of entities) {
                if (!mob.alive) continue;
                const d = this.position.distanceTo(mob.position);
                if (d < 15 && d < closestDist) {
                    closestDist = d;
                    closestMob = mob;
                }
            }
            if (closestMob) {
                _tempVecProj1.copy(closestMob.position);
                _tempVecProj1.y += closestMob.size/2;
                const dirToMob = _tempVecProj1.sub(this.position).normalize();
                this.velocity.lerp(_tempVecProj2.copy(dirToMob).multiplyScalar(this.stats.speed), dt * 4);
            }
        }
        
        this.previousPosition = this.position.clone();
        this.position.addScaledVector(this.velocity, dt);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.x += dt * 5;
            this.mesh.rotation.y += dt * 7;
            this.mesh.rotation.z += dt * 3;
            if (this.mesh.userData && this.mesh.userData.outerRune) {
                this.mesh.userData.outerRune.rotation.x -= dt * 6;
                this.mesh.userData.outerRune.rotation.y -= dt * 8;
            }
            if (this.element === 'THUNDER') {
                _tempVecProj1.set(0, 1, 0);
                this.mesh.quaternion.setFromUnitVectors(_tempVecProj1, _tempVecProj2.copy(this.velocity).normalize());
            } else if (this.element === 'POISON' || this.element === 'LAVA') {
                this.velocity.y -= dt * (this.element === 'LAVA' ? 15 : 5); // Gravity
            }
        }

        // Emit vibrant Minecraft mod-style trail particles
        if (window.game && window.game.particles && Math.random() < 0.75) {
            let pType = 'magic';
            let pCol = this.color;
            if (this.hasElement('FIRE') || this.hasElement('LAVA') || this.hasElement('MAGMA')) {
                pType = 'fire';
                pCol = 0xff6600;
            } else if (this.hasElement('ICE') || this.hasElement('FROST')) {
                pType = 'snow';
                pCol = 0xbbffff;
            } else if (this.hasElement('BUILDER')) {
                pType = 'magic';
                pCol = Math.random() < 0.5 ? 0xaaaaaa : 0x55ffff;
            } else if (this.hasElement('VOID') || this.hasElement('DARK')) {
                pType = 'portal';
                pCol = 0x9900ff;
            } else if (this.hasElement('HEAL')) {
                pType = 'bonemeal';
                pCol = 0x55ff55;
            }
            window.game.particles.emit(this.position, pType, 2, pCol);
        }
    }

    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}

export class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
    }

    add(proj) {
        this.projectiles.push(proj);
        this.scene.add(proj.getMesh());
    }

    update(dt, checkHit, entities) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(dt, entities);
            
            if (!p.alive) {
                p.dispose();
                this.projectiles.splice(i, 1);
                continue;
            }

            const hitResult = checkHit(p);
            if (hitResult && hitResult.hit) {
                // Apply damage/effects to hitResult.entity is handled in callback
                // If it pierced, it should only continue if it hit an entity. Blocks always destroy it.
                if (!p.stats.pierce || hitResult.hitType === 'block') {
                    p.alive = false;
                }
            }
        }
    }
}

export function generateRandomWand() {
    return new Wand("Apprentice Wand", 3);
}

export function generateRandomSpell() {
    const keys = Object.keys(SPELL_TYPES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return new Spell(key);
}

export function generateRandomModifier() {
    const keys = Object.keys(MODIFIER_TYPES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return new Modifier(key);
}

