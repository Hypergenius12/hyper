// ============================================
// magic.js — Spells, Modifiers, Wands, Projectiles
// ============================================
import * as THREE from 'three';
import { generateSpellTexture } from './textures.js';

let MAGIC_ID_COUNTER = 0;
function getUniqueId() { return `magic_${MAGIC_ID_COUNTER++}`; }

export const SPELL_TYPES = {
    BOLT: { name: 'Arcane Bolt', baseDamage: 15, baseManaCost: 5, baseCooldown: 0, projectileSpeed: 20, projectileCount: 1, element: 'ICE', color: 0x0088ff, description: 'Fires a fast moving magical bolt.' },
    BURST: { name: 'Fire Burst', baseDamage: 25, baseManaCost: 15, baseCooldown: 0, projectileSpeed: 10, projectileCount: 5, element: 'FIRE', color: 0xff4422, description: 'Fires a spread of burning projectiles.' },
    HEAL: { name: 'Nature Grace', baseDamage: -20, baseManaCost: 30, baseCooldown: 0, projectileSpeed: 5, projectileCount: 1, element: 'HEAL', color: 0xadff2f, description: 'Heals the caster instantly.' },
    MISSILE: { name: 'Magic Missile', baseDamage: 30, baseManaCost: 20, baseCooldown: 0, projectileSpeed: 8, projectileCount: 1, element: 'arcane', color: 0x4488ff, description: 'A slow but powerful homing missile.' },
    METEOR: { name: 'Meteor Strike', baseDamage: 100, baseManaCost: 50, baseCooldown: 0, projectileSpeed: 15, projectileCount: 1, element: 'FIRE', color: 0xffaa00, description: 'Calls down a massive meteor.' },
    EARTH: { name: 'Boulder Toss', baseDamage: 40, baseManaCost: 25, baseCooldown: 0, projectileSpeed: 12, projectileCount: 1, element: 'EARTH', color: 0x8B4513, description: 'Hurls a massive boulder that deals heavy damage.' },
    THUNDER: { name: 'Lightning Strike', baseDamage: 60, baseManaCost: 35, baseCooldown: 0, projectileSpeed: 40, projectileCount: 1, element: 'THUNDER', color: 0xFFFF00, description: 'A lightning-fast bolt that strikes instantly.' },
    DARK: { name: 'Shadow Drain', baseDamage: 20, baseManaCost: 15, baseCooldown: 0, projectileSpeed: 14, projectileCount: 1, element: 'DARK', color: 0x6600CC, description: 'Drains life from enemies to heal the caster.' },
    WIND: { name: 'Gale Force', baseDamage: 10, baseManaCost: 8, baseCooldown: 0, projectileSpeed: 30, projectileCount: 3, element: 'WIND', color: 0x99FFCC, description: 'Fires a spread of fast wind blades.' },
    CHAIN: { name: 'Chain Lightning', baseDamage: 25, baseManaCost: 30, baseCooldown: 0, projectileSpeed: 25, projectileCount: 4, element: 'THUNDER', color: 0x88CCFF, description: 'Shoots multiple bolts that arc between targets.' },
    POISON: { name: 'Toxic Spit', baseDamage: 5, baseManaCost: 15, baseCooldown: 0, projectileSpeed: 10, projectileCount: 1, element: 'POISON', color: 0x33CC33, description: 'Fires a venomous blob that poisons enemies.' },
    WATER: { name: 'Aqua Jet', baseDamage: 0, baseManaCost: 10, baseCooldown: 0, projectileSpeed: 18, projectileCount: 1, element: 'WATER', color: 0x3399FF, description: 'High knockback. Extinguishes fire and turns lava to obsidian.' },
    LAVA: { name: 'Magma Bomb', baseDamage: 40, baseManaCost: 40, baseCooldown: 0, projectileSpeed: 8, projectileCount: 1, element: 'LAVA', color: 0xFF6600, description: 'Heavy projectile that spawns lava on impact.' },
    VOID: { name: 'Void Sphere', baseDamage: 150, baseManaCost: 80, baseCooldown: 0, projectileSpeed: 5, projectileCount: 1, element: 'VOID', color: 0x220033, description: 'Slow moving orb that destroys blocks on impact.' },
    LIGHT: { name: 'Sunbeam', baseDamage: 20, baseManaCost: 20, baseCooldown: 0, projectileSpeed: 80, projectileCount: 1, element: 'LIGHT', color: 0xFFFFFF, description: 'Extremely fast beam that pierces targets.' },
    FROST: { name: 'Frost Nova', baseDamage: 0, baseManaCost: 30, baseCooldown: 0, projectileSpeed: 15, projectileCount: 1, element: 'FROST', color: 0xBBFFFF, description: 'Freezes all nearby entities on impact.' },
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
        const stats = {
            damageMult: 1.0, speedMult: 1.0, manaMult: 1.0, projCountMult: 1.0,
            pierce: false, homing: false, statusEffects: [], castTwo: false
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
    constructor(name, maxSlots) {
        this.name = name;
        this.maxSlots = maxSlots;
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
        if (!player.useMana(stats.manaCost)) return null;

        return { spell, stats };
    }

    castCombined(player) {
        // Gather all valid spells
        const spells = [];
        for (let i = 0; i < this.maxSlots; i++) {
            let spellItem = this.spellSlots[i];
            if (!spellItem) continue;
            let spell = spellItem;
            if (spellItem.type === 'spell' && spellItem.data && spellItem.data.spell) spell = spellItem.data.spell;
            else if (spellItem.item && spellItem.item.type === 'spell' && spellItem.item.data && spellItem.item.data.spell) spell = spellItem.item.data.spell;
            if (typeof spell.getCalculatedStats === 'function') spells.push(spell);
        }
        if (spells.length === 0) return null;

        // Combine stats: sum damage, sum mana cost, average speed, sum projectile count, merge effects
        let totalDamage = 0, totalMana = 0, totalSpeed = 0, totalCount = 0;
        let pierce = false, homing = false, castTwo = false;
        const effects = [];
        const elements = [];
        let dominantSpell = spells[0];
        let maxDmg = 0;

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
            if (Math.abs(stats.damage) > maxDmg) { maxDmg = Math.abs(stats.damage); dominantSpell = spell; }
        }

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
            speed: totalSpeed / spells.length,
            count: Math.max(1, totalCount),
            pierce, homing, castTwo,
            effects: [...new Set(effects)],
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
        this.velocity = direction.clone().normalize().multiplyScalar(stats.speed);
        this.stats = stats;
        this.color = spellColor;
        this.element = stats.element;
        if (this.element === 'FIRE') this.color = 0xff0000;
        if (this.element === 'ICE') this.color = 0x0088ff;
        if (this.element === 'HEAL') this.color = 0xadff2f;
        if (this.element === 'EARTH') this.color = 0x8B4513;
        if (this.element === 'THUNDER') this.color = 0xFFFF00;
        if (this.element === 'DARK') this.color = 0x6600CC;
        if (this.element === 'WIND') this.color = 0x99FFCC;
        if (this.element === 'POISON') this.color = 0x33CC33;
        if (this.element === 'WATER') this.color = 0x3399FF;
        if (this.element === 'LAVA') this.color = 0xFF6600;
        if (this.element === 'VOID') this.color = 0x220033;
        if (this.element === 'LIGHT') this.color = 0xFFFFFF;
        if (this.element === 'FROST') this.color = 0xBBFFFF;
        if (this.element === 'BUILDER') this.color = 0xAAAAAA;
        if (this.element === 'STEAM') this.color = 0xDDDDDD;
        if (this.element === 'MAGMA') this.color = 0xCC2200;
        if (this.element === 'STORM') this.color = 0x44DDFF;
        if (this.element === 'VAMPIRIC') this.color = 0x990022;
        this.alive = true;
        this.age = 0;
        this.maxAge = 5;
        this.mesh = null;
    }

    getMesh() {
        if (!this.mesh) {
            if (this.element === 'EARTH') {
                const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                const mat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
                this.mesh = new THREE.Mesh(geo, mat);
            } else if (this.element === 'THUNDER') {
                const geo = new THREE.CylinderGeometry(0.05, 0.05, 2.0);
                const mat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
                this.mesh = new THREE.Mesh(geo, mat);
            } else if (this.element === 'WIND') {
                const geo = new THREE.TorusGeometry(0.3, 0.1, 4, 16);
                const mat = new THREE.MeshBasicMaterial({ color: 0xadd8e6 });
                this.mesh = new THREE.Mesh(geo, mat);
            } else if (this.element === 'DARK' || this.element === 'VOID') {
                const geo = new THREE.SphereGeometry(this.element === 'VOID' ? 0.8 : 0.4);
                const mat = new THREE.MeshBasicMaterial({ color: this.color });
                this.mesh = new THREE.Mesh(geo, mat);
            } else if (this.element === 'POISON') {
                const geo = new THREE.IcosahedronGeometry(0.3, 0);
                const mat = new THREE.MeshBasicMaterial({ color: this.color });
                this.mesh = new THREE.Mesh(geo, mat);
            } else if (this.element === 'LIGHT') {
                const geo = new THREE.CylinderGeometry(0.02, 0.02, 3.0);
                const mat = new THREE.MeshBasicMaterial({ color: this.color });
                this.mesh = new THREE.Mesh(geo, mat);
                this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.velocity.clone().normalize());
            } else {
                const canvas = generateSpellTexture(this.element);
                const tex = new THREE.CanvasTexture(canvas);
                tex.colorSpace = THREE.SRGBColorSpace;
                const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
                this.mesh = new THREE.Sprite(mat);
                this.mesh.scale.set(0.6, 0.6, 1);
            }
            
            // Removed PointLight to fix massive shader recompilation lag
            this.mesh.position.copy(this.position);
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
                const dirToMob = closestMob.position.clone().add(new THREE.Vector3(0, closestMob.size/2, 0)).sub(this.position).normalize();
                this.velocity.lerp(dirToMob.multiplyScalar(this.stats.speed), dt * 4);
            }
        }

        this.position.add(this.velocity.clone().multiplyScalar(dt));
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            if (this.element === 'EARTH') {
                this.mesh.rotation.x += dt * 5;
                this.mesh.rotation.z += dt * 5;
            } else if (this.element === 'THUNDER') {
                this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.velocity.clone().normalize());
            } else if (this.element === 'WIND') {
                this.mesh.rotation.x += dt * 10;
                this.mesh.rotation.y += dt * 10;
            } else if (this.element === 'DARK' || this.element === 'VOID') {
                const s = 1.0 + 0.2 * Math.sin(this.age * 10);
                this.mesh.scale.set(s, s, s);
            } else if (this.element === 'POISON' || this.element === 'LAVA') {
                this.velocity.y -= dt * (this.element === 'LAVA' ? 15 : 5); // Gravity
                this.mesh.rotation.x += dt * 3;
                this.mesh.rotation.y += dt * 3;
            }
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
            if (hitResult) {
                // Apply damage/effects to hitResult.entity is handled in callback
                if (!p.stats.pierce) {
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
