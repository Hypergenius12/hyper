// ══════════════════════════════════════════════════════════════
// GENESIS ENGINE v0.1 — AI-Powered Infinite 2D World Sandbox
// ══════════════════════════════════════════════════════════════

(function () {
'use strict';

const $ = id => document.getElementById(id);

// ── CONFIG ──────────────────────────────────────────────────
const CONFIG = {
    groundY: 500,
    worldMinX: -10000,
    worldMaxX: 10000,
    zoomMin: 0.05,
    zoomMax: 5,
    zoomSpeed: 0.1,
    physicsTimestep: 1000 / 60,
    apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    maxTokens: 4096,
    temperature: 0.4,
    keys: {
        apiKey: 'genesis_api_key',
        model: 'genesis_model',
        saves: 'genesis_saves',
    },
};

// ── WORLD STATE ─────────────────────────────────────────────
const world = {
    entities: [],
    spriteDefinitions: {},      // id → { width, height, drawCode (string) }
    spriteTextures: {},         // id → PIXI.Texture (not serialized)
    clickHandlers: [],          // [{ fn, source }]
    keyHandlers: {},            // key → [{ fn, source }]
    environment: {
        gravity: { x: 0, y: 1 },
        skyTop: '#4a90d9',
        skyBottom: '#87CEEB',
        groundColor: '#4a7c3f',
        groundDirtColor: '#5D4037',
    },
    commandHistory: [],
    entityCounter: 0,
};

const undoStack = [];
let selectedEntity = null;

// ── PIXI & MATTER REFS ─────────────────────────────────────
let app, worldContainer, skyGraphics, groundGraphics, uiLayer;
let mEngine, mRunner, mWorld, groundBody;

// ── CAMERA ──────────────────────────────────────────────────
const camera = { x: 0, y: 0, zoom: 1, dragging: false, dragStart: null };

// ══════════════════════════════════════════════════════════════
// RENDERER
// ══════════════════════════════════════════════════════════════

function initRenderer() {
    app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x87CEEB,
        resizeTo: window,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    });
    $('canvas-container').appendChild(app.view);

    // World container holds everything that pans/zooms
    worldContainer = new PIXI.Container();
    worldContainer.sortableChildren = true;
    app.stage.addChild(worldContainer);

    // Sky background (drawn behind everything in world container)
    skyGraphics = new PIXI.Graphics();
    skyGraphics.zIndex = -100;
    worldContainer.addChild(skyGraphics);

    // Ground
    groundGraphics = new PIXI.Graphics();
    groundGraphics.zIndex = -50;
    worldContainer.addChild(groundGraphics);

    drawSky();
    drawGround();

    // Center camera
    camera.x = window.innerWidth / 2;
    camera.y = window.innerHeight * 0.4 - CONFIG.groundY;
    applyCamera();

    // Resize handler
    window.addEventListener('resize', () => {
        drawSky();
        drawGround();
    });

    // Pan & zoom
    const canvas = app.view;
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

function drawSky() {
    skyGraphics.clear();
    // Draw a massive sky rectangle
    const left = CONFIG.worldMinX - 5000;
    const width = (CONFIG.worldMaxX - CONFIG.worldMinX) + 10000;
    skyGraphics.beginFill(0x87CEEB);
    skyGraphics.drawRect(left, -10000, width, CONFIG.groundY + 10000);
    skyGraphics.endFill();

    // Lighter horizon band
    skyGraphics.beginFill(0xB8DFF0, 0.5);
    skyGraphics.drawRect(left, CONFIG.groundY - 200, width, 200);
    skyGraphics.endFill();
}

function drawGround() {
    groundGraphics.clear();

    const left = CONFIG.worldMinX - 5000;
    const width = (CONFIG.worldMaxX - CONFIG.worldMinX) + 10000;

    // Grass surface
    groundGraphics.beginFill(0x4a7c3f);
    groundGraphics.drawRect(left, CONFIG.groundY, width, 12);
    groundGraphics.endFill();

    // Topsoil
    groundGraphics.beginFill(0x6B4423);
    groundGraphics.drawRect(left, CONFIG.groundY + 12, width, 60);
    groundGraphics.endFill();

    // Deep dirt
    groundGraphics.beginFill(0x5D4037);
    groundGraphics.drawRect(left, CONFIG.groundY + 72, width, 200);
    groundGraphics.endFill();

    // Bedrock
    groundGraphics.beginFill(0x37474F);
    groundGraphics.drawRect(left, CONFIG.groundY + 272, width, 5000);
    groundGraphics.endFill();

    // Grass tufts
    groundGraphics.lineStyle(2, 0x5ca04e);
    for (let x = left; x < left + width; x += 25 + Math.random() * 15) {
        const h = 4 + Math.random() * 6;
        groundGraphics.moveTo(x, CONFIG.groundY);
        groundGraphics.lineTo(x - 2 + Math.random() * 4, CONFIG.groundY - h);
    }
    groundGraphics.lineStyle(0);
}

function applyCamera() {
    worldContainer.position.set(camera.x, camera.y);
    worldContainer.scale.set(camera.zoom);
}

function screenToWorld(sx, sy) {
    return {
        x: (sx - camera.x) / camera.zoom,
        y: (sy - camera.y) / camera.zoom,
    };
}

function worldToScreen(wx, wy) {
    return {
        x: wx * camera.zoom + camera.x,
        y: wy * camera.zoom + camera.y,
    };
}

// ── Camera Controls ──

function onWheel(e) {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const factor = 1 + CONFIG.zoomSpeed * dir;
    const newZoom = Math.max(CONFIG.zoomMin, Math.min(CONFIG.zoomMax, camera.zoom * factor));

    // Zoom towards mouse position
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const worldBefore = screenToWorld(mouseX, mouseY);

    camera.zoom = newZoom;
    camera.x = mouseX - worldBefore.x * newZoom;
    camera.y = mouseY - worldBefore.y * newZoom;

    applyCamera();
}

let pointerBtn = -1;
function onPointerDown(e) {
    pointerBtn = e.button;
    // Middle mouse (1), right mouse (2), or space+left held
    if (e.button === 1 || e.button === 2 || (e.button === 0 && spaceHeld)) {
        camera.dragging = true;
        camera.dragStart = { x: e.clientX - camera.x, y: e.clientY - camera.y };
        document.body.classList.add('grabbing');
        e.preventDefault();
    } else if (e.button === 0 && !spaceHeld) {
        // Left click — check entity hit or fire click handlers
        const wp = screenToWorld(e.clientX, e.clientY);
        handleWorldClick(wp.x, wp.y, e);
    }
}

function onPointerMove(e) {
    // Update coord display
    const wp = screenToWorld(e.clientX, e.clientY);
    $('coord-display').textContent = `${Math.round(wp.x)}, ${Math.round(wp.y)}`;

    if (camera.dragging) {
        camera.x = e.clientX - camera.dragStart.x;
        camera.y = e.clientY - camera.dragStart.y;
        applyCamera();
    }
}

function onPointerUp(e) {
    if (camera.dragging) {
        camera.dragging = false;
        document.body.classList.remove('grabbing');
    }
    pointerBtn = -1;
}

let spaceHeld = false;
document.addEventListener('keydown', e => {
    if (e.code === 'Space' && document.activeElement !== $('command-input')) {
        spaceHeld = true;
        e.preventDefault();
    }
    // Key handlers registered by AI
    const key = e.key.toLowerCase();
    if (world.keyHandlers[key] && document.activeElement !== $('command-input')) {
        for (const handler of world.keyHandlers[key]) {
            try { handler.fn(key, e); } catch (err) { console.error('Key handler error:', err); }
        }
    }
    // Ctrl+Z for undo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); performUndo(); }
});
document.addEventListener('keyup', e => { if (e.code === 'Space') spaceHeld = false; });

function handleWorldClick(wx, wy, event) {
    // Check entity hits (iterate in reverse for top-most)
    let hitEntity = null;
    for (let i = world.entities.length - 1; i >= 0; i--) {
        const ent = world.entities[i];
        if (!ent.pixiSprite) continue;
        const bounds = ent.pixiSprite.getBounds();
        const sp = worldToScreen(wx, wy);
        if (sp.x >= bounds.x && sp.x <= bounds.x + bounds.width &&
            sp.y >= bounds.y && sp.y <= bounds.y + bounds.height) {
            hitEntity = ent;
            break;
        }
    }

    if (hitEntity) {
        selectEntity(hitEntity);
    } else {
        deselectEntity();
    }

    // Fire user-defined click handlers
    for (const handler of world.clickHandlers) {
        try { handler.fn(wx, wy, event, hitEntity); } catch (err) { console.error('Click handler error:', err); }
    }
}

// ══════════════════════════════════════════════════════════════
// PHYSICS
// ══════════════════════════════════════════════════════════════

function initPhysics() {
    mEngine = Matter.Engine.create();
    mWorld = mEngine.world;
    mEngine.gravity.x = world.environment.gravity.x;
    mEngine.gravity.y = world.environment.gravity.y;

    // Ground body
    const gw = CONFIG.worldMaxX - CONFIG.worldMinX + 10000;
    groundBody = Matter.Bodies.rectangle(0, CONFIG.groundY + 2500, gw, 5000, {
        isStatic: true,
        friction: 0.9,
        restitution: 0.1,
        label: 'ground',
    });
    Matter.Composite.add(mWorld, groundBody);

    // Collision events
    Matter.Events.on(mEngine, 'collisionStart', onCollision);
}

function onCollision(event) {
    // Could trigger behaviors — placeholder for now
    for (const pair of event.pairs) {
        const a = findEntityByBody(pair.bodyA);
        const b = findEntityByBody(pair.bodyB);
        // Behaviors can be expanded here
    }
}

function findEntityByBody(body) {
    return world.entities.find(e => e.physicsBody === body) || null;
}

function physicsStep(delta) {
    Matter.Engine.update(mEngine, delta);
}

function syncPhysicsToRenderer() {
    for (const ent of world.entities) {
        if (ent.physicsBody && ent.pixiSprite) {
            ent.pixiSprite.position.set(ent.physicsBody.position.x, ent.physicsBody.position.y);
            ent.pixiSprite.rotation = ent.physicsBody.angle;
        }
    }
}

// ══════════════════════════════════════════════════════════════
// SPRITE FACTORY
// ══════════════════════════════════════════════════════════════

function defineSprite(id, width, height, drawFnOrString) {
    // Accept function or string
    let drawCode, drawFn;
    if (typeof drawFnOrString === 'function') {
        drawCode = drawFnOrString.toString();
        drawFn = drawFnOrString;
    } else {
        drawCode = drawFnOrString;
        drawFn = new Function('return ' + drawCode)();
    }

    // Store definition for serialization
    world.spriteDefinitions[id] = { width, height, drawCode };

    // Render to offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;   // 2x for retina
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    try {
        drawFn(ctx, width, height);
    } catch (err) {
        console.error(`Sprite draw error [${id}]:`, err);
        // Fallback: draw a colored rectangle
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ERR', width / 2, height / 2 + 4);
    }

    const texture = PIXI.Texture.from(canvas);
    world.spriteTextures[id] = texture;
    return texture;
}

function getOrCreateTexture(spriteId) {
    if (world.spriteTextures[spriteId]) return world.spriteTextures[spriteId];

    const def = world.spriteDefinitions[spriteId];
    if (!def) return null;

    return defineSprite(spriteId, def.width, def.height, def.drawCode);
}

// ══════════════════════════════════════════════════════════════
// ENTITY SYSTEM
// ══════════════════════════════════════════════════════════════

function spawnEntity(spriteId, options = {}) {
    const texture = getOrCreateTexture(spriteId);
    if (!texture) {
        console.error(`Unknown sprite: ${spriteId}`);
        return null;
    }

    const def = world.spriteDefinitions[spriteId];
    const id = `${spriteId}_${++world.entityCounter}`;

    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(options.anchorX ?? 0.5, options.anchorY ?? 1.0); // Bottom center by default
    sprite.position.set(options.x ?? 0, options.y ?? CONFIG.groundY);
    sprite.scale.set(options.scaleX ?? 1, options.scaleY ?? 1);
    sprite.rotation = options.rotation ?? 0;
    sprite.zIndex = options.zIndex ?? 0;

    // Make interactive for selection
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    worldContainer.addChild(sprite);

    // Physics body
    let physicsBody = null;
    const pc = options.physics;
    if (pc && pc.type !== 'none') {
        const bodyOptions = {
            isStatic: pc.type === 'static',
            friction: pc.friction ?? 0.6,
            restitution: pc.restitution ?? 0.2,
            density: pc.density ?? 0.001,
            label: id,
        };

        if (pc.shape === 'circle') {
            physicsBody = Matter.Bodies.circle(
                options.x ?? 0,
                options.y ?? CONFIG.groundY,
                pc.radius ?? 20,
                bodyOptions
            );
        } else {
            // Default: rectangle
            const bw = pc.width ?? def.width * 0.5;
            const bh = pc.height ?? def.height * 0.8;
            physicsBody = Matter.Bodies.rectangle(
                options.x ?? 0,
                (options.y ?? CONFIG.groundY) - bh / 2,
                bw, bh,
                bodyOptions
            );
        }
        Matter.Composite.add(mWorld, physicsBody);
    }

    const entity = {
        id,
        type: spriteId,
        spriteId,
        x: options.x ?? 0,
        y: options.y ?? CONFIG.groundY,
        scaleX: options.scaleX ?? 1,
        scaleY: options.scaleY ?? 1,
        rotation: options.rotation ?? 0,
        anchorX: options.anchorX ?? 0.5,
        anchorY: options.anchorY ?? 1.0,
        zIndex: options.zIndex ?? 0,
        pixiSprite: sprite,
        physicsBody: physicsBody,
        physicsConfig: pc || null,
        properties: { ...(options.properties || {}) },
        behaviors: options.behaviors || [],
    };

    world.entities.push(entity);
    updateEntityCount();
    return entity;
}

function removeEntity(idOrFilter) {
    const toRemove = typeof idOrFilter === 'function'
        ? world.entities.filter(idOrFilter)
        : world.entities.filter(e => e.id === idOrFilter);

    for (const ent of toRemove) {
        if (ent.pixiSprite) { worldContainer.removeChild(ent.pixiSprite); ent.pixiSprite.destroy(); }
        if (ent.physicsBody) { Matter.Composite.remove(mWorld, ent.physicsBody); }
        if (selectedEntity === ent) deselectEntity();
    }

    world.entities = world.entities.filter(e => !toRemove.includes(e));
    updateEntityCount();
    return toRemove.length;
}

function modifyEntity(idOrFilter, changes) {
    const targets = typeof idOrFilter === 'function'
        ? world.entities.filter(idOrFilter)
        : world.entities.filter(e => e.id === idOrFilter);

    for (const ent of targets) {
        if (changes.x !== undefined) { ent.x = changes.x; if (ent.pixiSprite) ent.pixiSprite.x = changes.x; }
        if (changes.y !== undefined) { ent.y = changes.y; if (ent.pixiSprite) ent.pixiSprite.y = changes.y; }
        if (changes.scaleX !== undefined) { ent.scaleX = changes.scaleX; if (ent.pixiSprite) ent.pixiSprite.scale.x = changes.scaleX; }
        if (changes.scaleY !== undefined) { ent.scaleY = changes.scaleY; if (ent.pixiSprite) ent.pixiSprite.scale.y = changes.scaleY; }
        if (changes.rotation !== undefined) { ent.rotation = changes.rotation; if (ent.pixiSprite) ent.pixiSprite.rotation = changes.rotation; }
        if (changes.zIndex !== undefined) { ent.zIndex = changes.zIndex; if (ent.pixiSprite) ent.pixiSprite.zIndex = changes.zIndex; }
        if (changes.tint !== undefined && ent.pixiSprite) { ent.pixiSprite.tint = changes.tint; }
        if (changes.alpha !== undefined && ent.pixiSprite) { ent.pixiSprite.alpha = changes.alpha; }
        if (changes.visible !== undefined && ent.pixiSprite) { ent.pixiSprite.visible = changes.visible; }

        if (changes.spriteId && changes.spriteId !== ent.spriteId) {
            const tex = getOrCreateTexture(changes.spriteId);
            if (tex && ent.pixiSprite) { ent.pixiSprite.texture = tex; ent.spriteId = changes.spriteId; }
        }

        if (changes.properties) {
            Object.assign(ent.properties, changes.properties);
        }

        // Sync physics body position
        if (ent.physicsBody && (changes.x !== undefined || changes.y !== undefined)) {
            Matter.Body.setPosition(ent.physicsBody, { x: ent.x, y: ent.y });
        }
    }

    if (selectedEntity && targets.includes(selectedEntity)) showInspector(selectedEntity);
    return targets.length;
}

function queryEntities(filter) {
    if (typeof filter === 'string') return world.entities.filter(e => e.type === filter);
    if (typeof filter === 'function') return world.entities.filter(filter);
    return [...world.entities];
}

function updateEntityCount() {
    $('entity-count').textContent = `${world.entities.length} entities`;
}

// ══════════════════════════════════════════════════════════════
// INSPECTOR
// ══════════════════════════════════════════════════════════════

function selectEntity(ent) {
    selectedEntity = ent;
    showInspector(ent);
}

function deselectEntity() {
    selectedEntity = null;
    $('inspector').classList.add('hidden');
}

function showInspector(ent) {
    const panel = $('inspector');
    const content = $('inspector-content');
    panel.classList.remove('hidden');

    let html = '';
    const row = (k, v) => `<div class="prop-row"><span class="prop-key">${k}</span><span class="prop-val">${v}</span></div>`;

    html += row('id', ent.id);
    html += row('type', ent.type);
    html += row('x', Math.round(ent.x));
    html += row('y', Math.round(ent.y));
    html += row('scale', `${ent.scaleX.toFixed(2)} × ${ent.scaleY.toFixed(2)}`);
    html += row('rotation', `${(ent.rotation * 180 / Math.PI).toFixed(1)}°`);

    if (ent.physicsConfig) {
        html += row('physics', ent.physicsConfig.type);
        html += row('shape', ent.physicsConfig.shape || 'rect');
    }

    html += '<div style="margin: 10px 0 6px; font-weight: 600; color: var(--accent); font-size: 11px;">PROPERTIES</div>';
    for (const [k, v] of Object.entries(ent.properties)) {
        html += row(k, String(v));
    }

    content.innerHTML = html;
}

$('inspector-close').addEventListener('click', deselectEntity);
$('inspector-delete').addEventListener('click', () => {
    if (selectedEntity) {
        pushUndo();
        removeEntity(selectedEntity.id);
        deselectEntity();
    }
});

// ══════════════════════════════════════════════════════════════
// PARTICLE SYSTEM (Lightweight)
// ══════════════════════════════════════════════════════════════

function spawnParticles(x, y, config = {}) {
    const count = config.count || 20;
    const color = config.color || 0xffffff;
    const speed = config.speed || 3;
    const life = config.life || 1000;
    const size = config.size || 4;
    const gravity = config.gravity ?? 0.05;
    const spread = config.spread ?? Math.PI * 2;
    const angle = config.angle ?? 0;

    const particles = [];
    const container = new PIXI.Container();
    container.zIndex = 1000;
    worldContainer.addChild(container);

    for (let i = 0; i < count; i++) {
        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawCircle(0, 0, size * (0.5 + Math.random() * 0.5));
        g.endFill();
        g.position.set(x, y);

        const a = angle - spread / 2 + Math.random() * spread;
        const s = speed * (0.3 + Math.random() * 0.7);
        particles.push({ g, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.5 + Math.random() * 0.5), age: 0 });
        container.addChild(g);
    }

    const startTime = Date.now();
    const ticker = () => {
        const elapsed = Date.now() - startTime;
        let alive = false;
        for (const p of particles) {
            p.age += 16;
            if (p.age >= p.life) { p.g.visible = false; continue; }
            alive = true;
            p.vy += gravity;
            p.g.x += p.vx;
            p.g.y += p.vy;
            p.g.alpha = 1 - p.age / p.life;
            p.g.scale.set(1 - (p.age / p.life) * 0.5);
        }
        if (!alive) {
            app.ticker.remove(ticker);
            worldContainer.removeChild(container);
            container.destroy({ children: true });
        }
    };
    app.ticker.add(ticker);
}

// ══════════════════════════════════════════════════════════════
// AUDIO ENGINE
// ══════════════════════════════════════════════════════════════

let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playSound(config = {}) {
    const ctx = getAudioCtx();
    const type = config.type || 'sine';      // sine, square, sawtooth, triangle
    const freq = config.frequency || 440;
    const duration = config.duration || 0.3;
    const volume = config.volume || 0.3;
    const attack = config.attack || 0.01;
    const decay = config.decay || duration;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (config.freqEnd) osc.frequency.exponentialRampToValueAtTime(config.freqEnd, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + decay);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.1);
}

// ══════════════════════════════════════════════════════════════
// API (Exposed to AI-generated code)
// ══════════════════════════════════════════════════════════════

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

const api = {
    // ── Sprites ──
    defineSprite(id, width, height, drawFn) {
        defineSprite(id, width, height, drawFn);
        return id;
    },

    // ── Entities ──
    spawn(spriteId, options = {}) {
        const y = options.y ?? CONFIG.groundY;
        return spawnEntity(spriteId, { ...options, y })?.id || null;
    },

    remove(idOrFilter) {
        return removeEntity(idOrFilter);
    },

    modify(idOrFilter, changes) {
        return modifyEntity(idOrFilter, changes);
    },

    query(filter) {
        return queryEntities(filter).map(e => ({
            id: e.id, type: e.type, x: e.x, y: e.y,
            scaleX: e.scaleX, scaleY: e.scaleY, rotation: e.rotation,
            properties: { ...e.properties },
        }));
    },

    getAll() { return api.query(() => true); },

    getEntity(id) {
        const ent = world.entities.find(e => e.id === id);
        if (!ent) return null;
        return { id: ent.id, type: ent.type, x: ent.x, y: ent.y, scaleX: ent.scaleX, scaleY: ent.scaleY, rotation: ent.rotation, properties: { ...ent.properties } };
    },

    // ── Physics ──
    applyForce(entityId, fx, fy) {
        const ent = world.entities.find(e => e.id === entityId);
        if (ent?.physicsBody) Matter.Body.applyForce(ent.physicsBody, ent.physicsBody.position, { x: fx, y: fy });
    },

    applyImpulse(entityId, ix, iy) {
        const ent = world.entities.find(e => e.id === entityId);
        if (ent?.physicsBody) Matter.Body.setVelocity(ent.physicsBody, {
            x: ent.physicsBody.velocity.x + ix,
            y: ent.physicsBody.velocity.y + iy,
        });
    },

    setGravity(gx, gy) {
        mEngine.gravity.x = gx;
        mEngine.gravity.y = gy;
        world.environment.gravity = { x: gx, y: gy };
    },

    explosion(x, y, radius = 200, force = 0.05) {
        for (const ent of world.entities) {
            if (!ent.physicsBody || ent.physicsBody.isStatic) continue;
            const dx = ent.physicsBody.position.x - x;
            const dy = ent.physicsBody.position.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius && dist > 0) {
                const intensity = (1 - dist / radius) * force;
                Matter.Body.applyForce(ent.physicsBody, ent.physicsBody.position, {
                    x: (dx / dist) * intensity,
                    y: (dy / dist) * intensity,
                });
            }
        }
        spawnParticles(x, y, { count: 40, color: 0xFF6B35, speed: 6, life: 800, size: 5, gravity: 0.02 });
        spawnParticles(x, y, { count: 20, color: 0xFFD93D, speed: 4, life: 600, size: 3, gravity: 0.01 });
        playSound({ type: 'sawtooth', frequency: 100, freqEnd: 30, duration: 0.5, volume: 0.4, decay: 0.5 });
    },

    getGroundY(x) { return CONFIG.groundY; },

    // ── Interactions ──
    onClick(handler) {
        const source = typeof handler === 'function' ? handler.toString() : handler;
        const fn = typeof handler === 'function' ? handler : new Function('return ' + handler)();
        world.clickHandlers.push({ fn, source: typeof source === 'string' ? source : source.toString() });
    },

    onKey(key, handler) {
        const source = typeof handler === 'function' ? handler.toString() : handler;
        const fn = typeof handler === 'function' ? handler : new Function('return ' + handler)();
        if (!world.keyHandlers[key.toLowerCase()]) world.keyHandlers[key.toLowerCase()] = [];
        world.keyHandlers[key.toLowerCase()].push({ fn, source: typeof source === 'string' ? source : source.toString() });
    },

    clearClickHandlers() { world.clickHandlers = []; },
    clearKeyHandlers(key) { if (key) delete world.keyHandlers[key.toLowerCase()]; else world.keyHandlers = {}; },

    // ── Particles ──
    particles(x, y, config) { spawnParticles(x, y, config); },

    // ── Audio ──
    sound(config) { playSound(config); },

    // ── Camera ──
    panTo(x, y) {
        camera.x = window.innerWidth / 2 - x * camera.zoom;
        camera.y = window.innerHeight / 2 - y * camera.zoom;
        applyCamera();
    },

    zoomTo(level) {
        camera.zoom = Math.max(CONFIG.zoomMin, Math.min(CONFIG.zoomMax, level));
        applyCamera();
    },

    getCamera() { return { ...camera }; },

    // ── Environment ──
    setBackground(topColor, bottomColor) {
        world.environment.skyTop = topColor || world.environment.skyTop;
        world.environment.skyBottom = bottomColor || world.environment.skyBottom;
        const hex = parseInt((bottomColor || '#87CEEB').replace('#', ''), 16);
        app.renderer.background.color = hex;
        drawSky();
    },

    // ── Animation ──
    animate(entityId, property, to, duration = 1000, easing = 'linear') {
        const ent = world.entities.find(e => e.id === entityId);
        if (!ent || !ent.pixiSprite) return;

        const start = Date.now();
        const from = property === 'x' ? ent.x : property === 'y' ? ent.y :
                     property === 'scaleX' ? ent.scaleX : property === 'scaleY' ? ent.scaleY :
                     property === 'rotation' ? ent.rotation : property === 'alpha' ? ent.pixiSprite.alpha : 0;

        const ticker = () => {
            const t = Math.min(1, (Date.now() - start) / duration);
            const val = from + (to - from) * t;
            if (property === 'x') { ent.x = val; ent.pixiSprite.x = val; }
            else if (property === 'y') { ent.y = val; ent.pixiSprite.y = val; }
            else if (property === 'scaleX') { ent.scaleX = val; ent.pixiSprite.scale.x = val; }
            else if (property === 'scaleY') { ent.scaleY = val; ent.pixiSprite.scale.y = val; }
            else if (property === 'rotation') { ent.rotation = val; ent.pixiSprite.rotation = val; }
            else if (property === 'alpha') { ent.pixiSprite.alpha = val; }
            if (t >= 1) app.ticker.remove(ticker);
        };
        app.ticker.add(ticker);
    },

    // ── DOM / Code Access ──
    addCSS(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    },

    setHTML(selector, html) {
        const el = document.querySelector(selector);
        if (el) el.innerHTML = html;
    },

    exec(code) {
        const fn = new AsyncFunction('api', 'world', 'app', 'Matter', 'PIXI', code);
        return fn(api, world, app, Matter, PIXI);
    },

    // ── Utilities ──
    log(msg) { showToast(msg, 'success'); },
    warn(msg) { showToast(msg, 'error'); },
    random(min, max) { return min + Math.random() * (max - min); },
    randomInt(min, max) { return Math.floor(api.random(min, max + 1)); },
    wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },
    getWorldBounds() { return { left: CONFIG.worldMinX, right: CONFIG.worldMaxX, top: -5000, bottom: CONFIG.groundY + 5000 }; },
};

// ══════════════════════════════════════════════════════════════
// AI COMMANDER
// ══════════════════════════════════════════════════════════════

function buildSystemPrompt() {
    // Snapshot world state for context
    const entitySummary = world.entities.map(e => ({
        id: e.id, type: e.type, x: Math.round(e.x), y: Math.round(e.y),
        scaleX: e.scaleX, scaleY: e.scaleY, properties: e.properties,
    }));

    return `You are the AI brain of GENESIS, an infinite 2D world sandbox engine built with PixiJS + Matter.js.
The user types natural language commands. You translate them into JavaScript code that uses the Genesis API.

## RESPONSE FORMAT
Respond with ONLY a valid JSON object. No markdown fences. No extra text.
{
    "thinking": "Brief reasoning about what to do",
    "code": "JavaScript code using the api object (can be async, use await)",
    "message": "Short message to show the user (1-2 sentences)"
}

## AVAILABLE API

### Sprites
api.defineSprite(id, width, height, drawFunction)
- drawFunction receives (ctx, w, h) where ctx is a Canvas2D context
- Draw at coordinates (0,0) to (w,h). Use gradients, curves, shadows for detail.
- Call defineSprite BEFORE spawning entities that use it.

### Entities
api.spawn(spriteId, { x, y, scaleX, scaleY, rotation, anchorX, anchorY, zIndex, physics: {...}, properties: {...} }) → entityId
- physics: { type:'static'|'dynamic'|'none', shape:'rect'|'circle', width, height, radius, friction, restitution, density }
- Default anchor is (0.5, 1.0) = bottom center. Ground is at y=${CONFIG.groundY}.
api.remove(entityId) or api.remove(filterFunction) → count removed
api.modify(entityId, { x, y, scaleX, scaleY, rotation, tint, alpha, visible, properties:{...}, spriteId }) → count modified  
api.query(filterFn) → [{id, type, x, y, scaleX, scaleY, rotation, properties}]
api.getAll() → all entities
api.getEntity(id) → single entity

### Physics
api.applyForce(entityId, forceX, forceY)
api.applyImpulse(entityId, impulseX, impulseY)
api.setGravity(gx, gy) — default (0, 1)
api.explosion(x, y, radius, force) — physics explosion with particles + sound
api.getGroundY(x) → y position of ground surface (currently flat at ${CONFIG.groundY})

### Interactions
api.onClick(handler) — handler receives (worldX, worldY, event, hitEntity)
api.onKey(key, handler) — handler receives (key, event). key is lowercase.
api.clearClickHandlers()
api.clearKeyHandlers(key?)

### Particles
api.particles(x, y, { count, color (hex int 0xRRGGBB), speed, life, size, gravity, spread, angle })

### Audio
api.sound({ type:'sine'|'square'|'sawtooth'|'triangle', frequency, freqEnd, duration, volume, attack, decay })

### Camera
api.panTo(worldX, worldY)
api.zoomTo(level) — 1.0 is default, 0.05-5.0 range

### Animation
api.animate(entityId, property, targetValue, durationMs)
- property: 'x', 'y', 'scaleX', 'scaleY', 'rotation', 'alpha'

### Environment
api.setBackground(topColorHex, bottomColorHex) — e.g. api.setBackground('#1a1a2e', '#16213e')

### DOM / Code
api.addCSS(cssString) — inject CSS
api.setHTML(selector, html) — set innerHTML of element
api.exec(codeString) — execute arbitrary JS with full access

### Utilities
api.log(message) — show success toast
api.warn(message) — show error toast  
api.random(min, max) → float
api.randomInt(min, max) → integer
api.wait(ms) → Promise
api.getWorldBounds() → { left, right, top, bottom }

## ART STYLE GUIDE
When writing sprite drawFunctions, create beautiful semi-realistic illustrated art:
- Use createLinearGradient and createRadialGradient for depth
- Use shadowColor/shadowBlur for soft shadows
- Use bezierCurveTo and quadraticCurveTo for organic shapes
- Layer multiple shapes for complexity
- Add fine detail lines (bark texture, leaf veins, wood grain)
- Use earthy, natural palettes for nature; vivid for artificial objects
- IMPORTANT: Sprites should look professional, not cartoony

Example tree sprite:
api.defineSprite('oak_tree', 100, 150, (ctx, w, h) => {
    // Trunk
    const trunk = ctx.createLinearGradient(w*0.42, h, w*0.58, h*0.3);
    trunk.addColorStop(0, '#5D4037'); trunk.addColorStop(1, '#795548');
    ctx.fillStyle = trunk;
    ctx.beginPath();
    ctx.moveTo(w*0.38, h); ctx.quadraticCurveTo(w*0.35, h*0.5, w*0.42, h*0.35);
    ctx.lineTo(w*0.58, h*0.35); ctx.quadraticCurveTo(w*0.65, h*0.5, w*0.62, h);
    ctx.closePath(); ctx.fill();
    // Bark lines
    ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.8;
    for(let i=0;i<5;i++){const yy=h*0.4+i*h*0.12; ctx.beginPath(); ctx.moveTo(w*0.42,yy); ctx.quadraticCurveTo(w*0.5,yy-3,w*0.58,yy); ctx.stroke();}
    // Canopy
    const canopy = ctx.createRadialGradient(w*0.5,h*0.2,w*0.05, w*0.5,h*0.25,w*0.4);
    canopy.addColorStop(0,'#81C784'); canopy.addColorStop(0.6,'#4CAF50'); canopy.addColorStop(1,'#2E7D32');
    ctx.fillStyle = canopy;
    [[w*0.3,h*0.28,w*0.22],[w*0.7,h*0.28,w*0.2],[w*0.5,h*0.15,w*0.28],[w*0.4,h*0.22,w*0.18],[w*0.6,h*0.2,w*0.17]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();});
    // Leaf highlights
    ctx.fillStyle='rgba(200,230,201,0.3)';
    [[w*0.45,h*0.12,w*0.1],[w*0.35,h*0.22,w*0.07]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();});
});

## IMPORTANT RULES
1. ALWAYS define sprites before spawning entities that use them.
2. Use api.getGroundY(x) for y-positions when placing on ground.
3. Entities placed on ground should have y = api.getGroundY(x) (which is ${CONFIG.groundY}).
4. When asked to add interactivity (click handlers, key bindings), use api.onClick / api.onKey.
5. For multi-step visual effects, use api.wait() with await.
6. If unsure what the user wants, make reasonable creative assumptions.
7. If asked to modify existing things, use api.query() to find them first.
8. You can use loops, conditionals, and any JavaScript in your code.
9. If the user asks to change game code or site code, use api.exec() or api.addCSS().

## CONSISTENCY CHECK
Before executing a command that conflicts with existing world state, mention it in your message.
Example: "Note: Adding rain will gradually extinguish any active fires."

## CURRENT WORLD STATE
${JSON.stringify({ entities: entitySummary, environment: world.environment, clickHandlersCount: world.clickHandlers.length, keyHandlers: Object.keys(world.keyHandlers) }, null, 2)}

## COMMAND HISTORY (last 10)
${world.commandHistory.slice(-10).map(c => `> ${c}`).join('\n') || '(none)'}`;
}

async function processCommand(userInput) {
    if (!userInput.trim()) return;

    const apiKey = localStorage.getItem(CONFIG.keys.apiKey);
    const model = localStorage.getItem(CONFIG.keys.model) || 'google/gemini-2.5-flash';

    if (!apiKey) {
        $('settings-modal').classList.remove('hidden');
        showToast('Please set your API key first', 'error');
        return;
    }

    // Show loading
    $('command-loading').classList.remove('hidden');
    $('command-input').value = '';

    // Push undo state before executing
    pushUndo();

    world.commandHistory.push(userInput);

    try {
        const systemPrompt = buildSystemPrompt();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'Genesis',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userInput },
                ],
                max_tokens: CONFIG.maxTokens,
                temperature: CONFIG.temperature,
            }),
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 401) { localStorage.removeItem(CONFIG.keys.apiKey); $('settings-modal').classList.remove('hidden'); }
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API error ${response.status}`);
        }

        const data = await response.json();
        const raw = (data.choices?.[0]?.message?.content || '').trim();

        // Parse AI response
        let parsed = parseAIResponse(raw);

        if (parsed.thinking) console.log('[Genesis AI]', parsed.thinking);

        // Execute the code
        if (parsed.code) {
            try {
                const fn = new AsyncFunction('api', 'world', 'app', 'Matter', 'PIXI', 'worldContainer', parsed.code);
                await fn(api, world, app, Matter, PIXI, worldContainer);
            } catch (codeErr) {
                console.error('AI code execution error:', codeErr);
                showToast(`Code error: ${codeErr.message}`, 'error');
            }
        }

        // Show message
        if (parsed.message) showToast(parsed.message, 'success');

    } catch (err) {
        console.error('Command failed:', err);
        showToast(`Failed: ${err.message}`, 'error');
        // Revert on error
        performUndo();
    } finally {
        $('command-loading').classList.add('hidden');
    }
}

function parseAIResponse(raw) {
    // Try direct JSON parse
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) {}

    // Try stripping markdown fences
    if (!parsed) {
        const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        try { parsed = JSON.parse(stripped); } catch (e) {}
    }

    // Try extracting JSON object
    if (!parsed) {
        const match = raw.match(/\{[\s\S]*"code"[\s\S]*\}/);
        if (match) try { parsed = JSON.parse(match[0]); } catch (e) {}
    }

    // Fallback: treat entire response as code
    if (!parsed) {
        return { thinking: '', code: raw, message: 'Executed command' };
    }

    return {
        thinking: parsed.thinking || '',
        code: parsed.code || '',
        message: parsed.message || '',
    };
}

// ══════════════════════════════════════════════════════════════
// SAVE / LOAD
// ══════════════════════════════════════════════════════════════

function serializeWorld() {
    return {
        version: 1,
        timestamp: Date.now(),
        entities: world.entities.map(e => ({
            id: e.id, type: e.type, spriteId: e.spriteId,
            x: e.x, y: e.y, scaleX: e.scaleX, scaleY: e.scaleY,
            rotation: e.rotation, anchorX: e.anchorX, anchorY: e.anchorY,
            zIndex: e.zIndex, physicsConfig: e.physicsConfig,
            properties: { ...e.properties }, behaviors: e.behaviors,
        })),
        spriteDefinitions: { ...world.spriteDefinitions },
        clickHandlers: world.clickHandlers.map(h => h.source),
        keyHandlers: Object.fromEntries(
            Object.entries(world.keyHandlers).map(([k, arr]) => [k, arr.map(h => h.source)])
        ),
        environment: { ...world.environment },
        commandHistory: world.commandHistory,
        entityCounter: world.entityCounter,
        camera: { x: camera.x, y: camera.y, zoom: camera.zoom },
    };
}

function deserializeWorld(data) {
    // Clear current world
    for (const ent of [...world.entities]) {
        if (ent.pixiSprite) { worldContainer.removeChild(ent.pixiSprite); ent.pixiSprite.destroy(); }
        if (ent.physicsBody) { Matter.Composite.remove(mWorld, ent.physicsBody); }
    }
    world.entities = [];
    world.spriteTextures = {};
    world.clickHandlers = [];
    world.keyHandlers = {};

    // Restore sprite definitions and recreate textures
    world.spriteDefinitions = data.spriteDefinitions || {};
    for (const id of Object.keys(world.spriteDefinitions)) {
        const def = world.spriteDefinitions[id];
        try { defineSprite(id, def.width, def.height, def.drawCode); }
        catch (e) { console.error(`Failed to restore sprite ${id}:`, e); }
    }

    // Restore entities
    world.entityCounter = data.entityCounter || 0;
    for (const ed of (data.entities || [])) {
        const ent = spawnEntity(ed.spriteId, {
            x: ed.x, y: ed.y, scaleX: ed.scaleX, scaleY: ed.scaleY,
            rotation: ed.rotation, anchorX: ed.anchorX, anchorY: ed.anchorY,
            zIndex: ed.zIndex, physics: ed.physicsConfig, properties: ed.properties,
            behaviors: ed.behaviors,
        });
        if (ent) ent.id = ed.id; // Preserve original ID
    }

    // Restore handlers
    for (const source of (data.clickHandlers || [])) {
        try {
            const fn = new Function('return ' + source)();
            world.clickHandlers.push({ fn, source });
        } catch (e) { console.error('Failed to restore click handler:', e); }
    }
    for (const [key, sources] of Object.entries(data.keyHandlers || {})) {
        world.keyHandlers[key] = [];
        for (const source of sources) {
            try {
                const fn = new Function('return ' + source)();
                world.keyHandlers[key].push({ fn, source });
            } catch (e) { console.error(`Failed to restore key handler [${key}]:`, e); }
        }
    }

    // Restore environment
    if (data.environment) Object.assign(world.environment, data.environment);
    mEngine.gravity.x = world.environment.gravity.x;
    mEngine.gravity.y = world.environment.gravity.y;

    // Restore camera
    if (data.camera) {
        camera.x = data.camera.x; camera.y = data.camera.y; camera.zoom = data.camera.zoom;
        applyCamera();
    }

    // Restore history
    world.commandHistory = data.commandHistory || [];

    updateEntityCount();
    deselectEntity();
}

// ── Save Slots ──

function getSaveSlots() {
    try { return JSON.parse(localStorage.getItem(CONFIG.keys.saves) || '[]'); }
    catch { return []; }
}

function saveToSlot(name) {
    const slots = getSaveSlots();
    const data = serializeWorld();
    data.name = name || `World ${slots.length + 1}`;
    const existing = slots.findIndex(s => s.name === data.name);
    if (existing >= 0) slots[existing] = data;
    else slots.push(data);
    localStorage.setItem(CONFIG.keys.saves, JSON.stringify(slots));
    showToast(`Saved: ${data.name}`, 'success');
    renderSaveSlots();
}

function loadFromSlot(index) {
    const slots = getSaveSlots();
    if (slots[index]) {
        deserializeWorld(slots[index]);
        showToast(`Loaded: ${slots[index].name}`, 'success');
        $('save-modal').classList.add('hidden');
    }
}

function deleteSlot(index) {
    const slots = getSaveSlots();
    slots.splice(index, 1);
    localStorage.setItem(CONFIG.keys.saves, JSON.stringify(slots));
    renderSaveSlots();
}

function renderSaveSlots() {
    const container = $('save-slots');
    const slots = getSaveSlots();
    if (slots.length === 0) {
        container.innerHTML = '<p style="color: var(--text-dim); text-align: center; padding: 20px;">No saved worlds yet</p>';
        return;
    }
    container.innerHTML = slots.map((s, i) => `
        <div class="save-slot">
            <div class="save-slot-info">
                <div class="save-slot-name">${s.name}</div>
                <div class="save-slot-meta">${(s.entities || []).length} entities · ${new Date(s.timestamp).toLocaleString()}</div>
            </div>
            <div class="save-slot-actions">
                <button class="btn-secondary" onclick="Genesis.loadFromSlot(${i})">Load</button>
                <button class="btn-danger" style="width:auto;padding:4px 10px" onclick="Genesis.deleteSlot(${i})">✕</button>
            </div>
        </div>
    `).join('');
}

function downloadWorld() {
    const data = serializeWorld();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `genesis-world-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('World downloaded!', 'success');
}

function uploadWorld(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            deserializeWorld(data);
            showToast('World loaded from file!', 'success');
            $('save-modal').classList.add('hidden');
        } catch (e) {
            showToast('Invalid save file', 'error');
        }
    };
    reader.readAsText(file);
}

// ── Undo ──

function pushUndo() {
    undoStack.push(serializeWorld());
    if (undoStack.length > 50) undoStack.shift(); // Cap at 50
}

function performUndo() {
    if (undoStack.length === 0) { showToast('Nothing to undo', 'error'); return; }
    const prev = undoStack.pop();
    deserializeWorld(prev);
    showToast('Undone', 'success');
}

// ══════════════════════════════════════════════════════════════
// UI HANDLERS
// ══════════════════════════════════════════════════════════════

function showToast(msg, type = 'info') {
    const toast = $('ai-toast');
    toast.textContent = msg;
    toast.className = type;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'hidden'; }, 5000);
}

// Command input
$('command-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); processCommand($('command-input').value); }
});
$('command-send').addEventListener('click', () => processCommand($('command-input').value));

// Settings
$('settings-btn').addEventListener('click', () => {
    $('api-key-input').value = localStorage.getItem(CONFIG.keys.apiKey) || '';
    $('model-select').value = localStorage.getItem(CONFIG.keys.model) || 'google/gemini-2.5-flash';
    $('settings-modal').classList.remove('hidden');
});
$('settings-save').addEventListener('click', () => {
    const key = $('api-key-input').value.trim();
    const model = $('model-select').value;
    if (key) localStorage.setItem(CONFIG.keys.apiKey, key);
    localStorage.setItem(CONFIG.keys.model, model);
    $('settings-modal').classList.add('hidden');
    showToast('Settings saved', 'success');
});
$('settings-cancel').addEventListener('click', () => $('settings-modal').classList.add('hidden'));

// Save / Load
$('save-btn').addEventListener('click', () => { renderSaveSlots(); $('save-modal').classList.remove('hidden'); });
$('save-new').addEventListener('click', () => { const name = prompt('Save name:', `World ${getSaveSlots().length + 1}`); if (name) saveToSlot(name); });
$('save-download').addEventListener('click', downloadWorld);
$('save-close').addEventListener('click', () => $('save-modal').classList.add('hidden'));
$('file-upload').addEventListener('change', e => { if (e.target.files[0]) uploadWorld(e.target.files[0]); e.target.value = ''; });

// Undo
$('undo-btn').addEventListener('click', performUndo);

// Close modals on backdrop click
document.querySelectorAll('.modal-backdrop').forEach(el => {
    el.addEventListener('click', () => el.parentElement.classList.add('hidden'));
});

// ══════════════════════════════════════════════════════════════
// GAME LOOP
// ══════════════════════════════════════════════════════════════

function gameLoop(delta) {
    // Physics step
    physicsStep(delta * 16.666);

    // Sync physics bodies → PixiJS sprites
    syncPhysicsToRenderer();
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════

function init() {
    initRenderer();
    initPhysics();

    // Start game loop
    app.ticker.add(gameLoop);

    // Check for API key
    if (!localStorage.getItem(CONFIG.keys.apiKey)) {
        setTimeout(() => {
            $('settings-modal').classList.remove('hidden');
            showToast('Welcome to Genesis! Set your API key to get started.', 'info');
        }, 500);
    } else {
        showToast('Genesis ready. Type a command to start building your world.', 'success');
    }

    console.log('%c🌍 GENESIS ENGINE v0.1', 'color: #38bdf8; font-size: 16px; font-weight: bold;');
    console.log('%cType anything in the command bar to create your world.', 'color: #888;');
}

// ── Expose for save slot buttons & debugging ──
window.Genesis = {
    api, world, camera, CONFIG,
    loadFromSlot, deleteSlot, saveToSlot,
    processCommand, serializeWorld, deserializeWorld,
};

// Boot
init();

})();
