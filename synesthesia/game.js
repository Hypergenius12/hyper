// ═══════════════════════════════════════════
// SYNESTHESIA — Infinite Color Mixer
// Game Engine & AI Integration
// ═══════════════════════════════════════════

const CONFIG = {
    apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'poolside/laguna-xs-2.1:free',
    maxTokens: 300,
    temperature: 0.8,
    storageKeys: {
        apiKey: 'synesthesia_api_key',
        model: 'synesthesia_model',
        colors: 'synesthesia_colors',
        cache: 'synesthesia_cache'
    }
};

const BASE_COLORS = [
    { id: 'red',    name: 'Red',    hex: '#FF0000', isBase: true },
    { id: 'blue',   name: 'Blue',   hex: '#0055FF', isBase: true },
    { id: 'yellow', name: 'Yellow', hex: '#FFD700', isBase: true },
    { id: 'white',  name: 'White',  hex: '#FAFAFA', isBase: true },
    { id: 'black',  name: 'Black',  hex: '#111111', isBase: true },
];

// ── State ──
let gameState = {
    colors: [...BASE_COLORS],
    mergeCache: {},
    slots: [null, null],
    isMerging: false
};

// ── DOM refs ──
const $ = id => document.getElementById(id);

// ── Init ──
window.addEventListener('DOMContentLoaded', () => {
    loadGame();

    const savedKey = localStorage.getItem(CONFIG.storageKeys.apiKey);
    if (savedKey) {
        $('api-modal').classList.add('hidden');
        $('game').classList.remove('hidden');
    }

    $('api-key-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') submitApiKey();
    });

    renderPalette();
    updateCounter();
});

// ═══════════════════════════════════════════
// API Key & Settings
// ═══════════════════════════════════════════

function submitApiKey() {
    const key = $('api-key-input').value.trim();
    if (!key) return;
    localStorage.setItem(CONFIG.storageKeys.apiKey, key);
    $('api-modal').classList.add('hidden');
    $('game').classList.remove('hidden');
    renderPalette();
}

function openSettings() {
    $('settings-api-key').value = localStorage.getItem(CONFIG.storageKeys.apiKey) || '';
    $('settings-model').value = localStorage.getItem(CONFIG.storageKeys.model) || CONFIG.defaultModel;
    $('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    $('settings-modal').classList.add('hidden');
}

function saveSettings() {
    const key = $('settings-api-key').value.trim();
    const model = $('settings-model').value;
    if (key) localStorage.setItem(CONFIG.storageKeys.apiKey, key);
    localStorage.setItem(CONFIG.storageKeys.model, model);
    closeSettings();
    showToast('Settings saved');
}

function resetGame() {
    if (!confirm('This will erase all your discovered colors. Are you sure?')) return;
    gameState.colors = [...BASE_COLORS];
    gameState.mergeCache = {};
    gameState.slots = [null, null];
    saveGame();
    renderPalette();
    renderSlots();
    hideResult();
    updateCounter();
    closeSettings();
    showToast('All progress reset');
}

// ═══════════════════════════════════════════
// Persistence
// ═══════════════════════════════════════════

function saveGame() {
    localStorage.setItem(CONFIG.storageKeys.colors, JSON.stringify(gameState.colors));
    localStorage.setItem(CONFIG.storageKeys.cache, JSON.stringify(gameState.mergeCache));
}

function loadGame() {
    try {
        const savedColors = localStorage.getItem(CONFIG.storageKeys.colors);
        const savedCache = localStorage.getItem(CONFIG.storageKeys.cache);
        if (savedColors) gameState.colors = JSON.parse(savedColors);
        if (savedCache) gameState.mergeCache = JSON.parse(savedCache);
    } catch (e) {
        console.warn('Failed to load saved game:', e);
    }
}

// ═══════════════════════════════════════════
// Color Math (HSL Blending)
// ═══════════════════════════════════════════

function hexToRGB(hex) {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substring(0, 2), 16) / 255,
        g: parseInt(hex.substring(2, 4), 16) / 255,
        b: parseInt(hex.substring(4, 6), 16) / 255
    };
}

function rgbToHex(r, g, b) {
    const toHex = v => Math.round(Math.min(255, Math.max(0, v * 255))).toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

function rgbToHSL(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRGB(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return { r, g, b };
}

function blendColors(hex1, hex2) {
    const rgb1 = hexToRGB(hex1);
    const rgb2 = hexToRGB(hex2);
    const hsl1 = rgbToHSL(rgb1.r, rgb1.g, rgb1.b);
    const hsl2 = rgbToHSL(rgb2.r, rgb2.g, rgb2.b);

    // Blend hue via shortest path around the wheel
    let hDiff = hsl2.h - hsl1.h;
    if (hDiff > 180) hDiff -= 360;
    if (hDiff < -180) hDiff += 360;
    let blendedH = hsl1.h + hDiff * 0.5;
    if (blendedH < 0) blendedH += 360;
    if (blendedH >= 360) blendedH -= 360;

    // Handle achromatic colors (very low saturation)
    let blendedS, blendedL;
    if (hsl1.s < 5 && hsl2.s < 5) {
        // Both are near-grey/black/white: average lightness, keep low sat
        blendedS = (hsl1.s + hsl2.s) / 2;
        blendedL = (hsl1.l + hsl2.l) / 2;
        blendedH = 0;
    } else if (hsl1.s < 5) {
        // First is achromatic: take hue of second, reduce saturation
        blendedH = hsl2.h;
        blendedS = hsl2.s * 0.55;
        blendedL = (hsl1.l + hsl2.l) / 2;
    } else if (hsl2.s < 5) {
        blendedH = hsl1.h;
        blendedS = hsl1.s * 0.55;
        blendedL = (hsl1.l + hsl2.l) / 2;
    } else {
        blendedS = (hsl1.s + hsl2.s) / 2;
        blendedL = (hsl1.l + hsl2.l) / 2;
    }

    const rgb = hslToRGB(blendedH, blendedS, blendedL);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// Get a text-safe contrast color for a given hex
function getContrastColor(hex) {
    const rgb = hexToRGB(hex);
    const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    return luminance > 0.55 ? '#111' : '#fff';
}

// ═══════════════════════════════════════════
// AI Integration
// ═══════════════════════════════════════════

async function askAI(colorA, colorB, blendedHex) {
    const apiKey = localStorage.getItem(CONFIG.storageKeys.apiKey);
    const model = localStorage.getItem(CONFIG.storageKeys.model) || CONFIG.defaultModel;

    if (!apiKey) {
        $('api-modal').classList.remove('hidden');
        throw new Error('API key required');
    }

    const prompt = `Two colors were mixed:
Color 1: "${colorA.name}" (${colorA.hex})
Color 2: "${colorB.name}" (${colorB.hex})
The mathematical blend is: ${blendedHex}

Give this new color a creative, evocative name — like something from a professional paint catalog, design system, or art supply brand. The name should be 1-4 words, no ALL CAPS. It should feel premium and specific to this exact shade, not generic.

You may adjust the hex code slightly if your name would better match a nearby shade.

Return ONLY valid JSON, no markdown fences:
{"name": "Color Name Here", "hex": "#XXXXXX"}`;

    const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.href,
            'X-Title': 'Synesthesia'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: 'You are a color naming expert. You respond ONLY with valid JSON. No markdown, no explanations.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: CONFIG.maxTokens,
            temperature: CONFIG.temperature
        })
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem(CONFIG.storageKeys.apiKey);
            $('api-modal').classList.remove('hidden');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error (${response.status})`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response (handle markdown fences)
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.name || !parsed.hex) throw new Error('Missing fields in AI response');

    // Validate hex
    if (!/^#[0-9a-fA-F]{6}$/.test(parsed.hex)) {
        parsed.hex = blendedHex;
    }

    return parsed;
}

// ═══════════════════════════════════════════
// Merge Logic
// ═══════════════════════════════════════════

function getMergeKey(a, b) {
    return [a.id, b.id].sort().join('+');
}

async function performMerge() {
    const [a, b] = gameState.slots;
    if (!a || !b || gameState.isMerging) return;

    gameState.isMerging = true;
    $('merge-btn-wrap').classList.add('hidden');
    $('merge-loading').classList.remove('hidden');
    $('merge-result').classList.add('hidden');

    const cacheKey = getMergeKey(a, b);
    const blendedHex = blendColors(a.hex, b.hex);

    try {
        let result;

        // Check cache first
        if (gameState.mergeCache[cacheKey]) {
            result = gameState.mergeCache[cacheKey];
        } else {
            // Ask AI
            const aiResult = await askAI(a, b, blendedHex);
            result = {
                name: aiResult.name,
                hex: aiResult.hex
            };

            // Cache the result
            gameState.mergeCache[cacheKey] = result;
        }

        // Check if this color already exists (by name match)
        const existingIndex = gameState.colors.findIndex(
            c => c.name.toLowerCase() === result.name.toLowerCase()
        );

        let isNew = false;
        let colorObj;

        if (existingIndex === -1) {
            // New discovery!
            colorObj = {
                id: result.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''),
                name: result.name,
                hex: result.hex,
                isBase: false,
                parents: [a.name, b.name]
            };
            gameState.colors.push(colorObj);
            isNew = true;
        } else {
            colorObj = gameState.colors[existingIndex];
        }

        saveGame();
        showResult(colorObj, isNew);
        renderPalette();
        updateCounter();

    } catch (err) {
        console.error('Merge failed:', err);
        showMergeError(err.message);
    } finally {
        gameState.isMerging = false;
        $('merge-loading').classList.add('hidden');
    }
}

// ═══════════════════════════════════════════
// UI — Slots
// ═══════════════════════════════════════════

function selectColor(color) {
    if (gameState.isMerging) return;

    if (!gameState.slots[0]) {
        gameState.slots[0] = color;
    } else if (!gameState.slots[1]) {
        if (gameState.slots[0].id === color.id) {
            // Allow merging same color with itself
        }
        gameState.slots[1] = color;
    } else {
        // Both full — restart
        gameState.slots = [color, null];
        hideResult();
    }

    renderSlots();
    renderPalette();
}

function clearSlot(index) {
    if (gameState.isMerging) return;
    gameState.slots[index] = null;
    renderSlots();
    renderPalette();
    hideResult();
}

function renderSlots() {
    for (let i = 0; i < 2; i++) {
        const slotEl = $(`slot-${i + 1}`);
        const swatch = slotEl.querySelector('.slot-swatch');
        const nameEl = slotEl.querySelector('.slot-name');
        const color = gameState.slots[i];

        if (color) {
            slotEl.classList.remove('empty');
            slotEl.classList.add('filling');
            swatch.style.background = color.hex;
            swatch.style.boxShadow = `0 0 24px ${color.hex}40, 0 0 48px ${color.hex}20`;
            nameEl.textContent = color.name;
            nameEl.style.color = '';
            setTimeout(() => slotEl.classList.remove('filling'), 400);
        } else {
            slotEl.classList.add('empty');
            swatch.style.background = 'rgba(255, 255, 255, 0.06)';
            swatch.style.boxShadow = 'none';
            nameEl.textContent = 'pick a color';
            nameEl.style.color = '';
        }
    }

    // Show/hide merge button
    const bothFilled = gameState.slots[0] && gameState.slots[1];
    $('merge-btn-wrap').classList.toggle('hidden', !bothFilled);
}

// ═══════════════════════════════════════════
// UI — Result
// ═══════════════════════════════════════════

function showResult(color, isNew) {
    const resultEl = $('merge-result');
    const swatch = $('result-swatch');
    const nameEl = $('result-name');
    const hexEl = $('result-hex');
    const badge = $('result-badge');

    swatch.style.background = color.hex;
    swatch.style.boxShadow = `0 0 30px ${color.hex}50, 0 0 60px ${color.hex}25`;
    nameEl.textContent = color.name;
    nameEl.style.color = color.hex;
    hexEl.textContent = color.hex.toUpperCase();
    hexEl.onclick = () => copyHex(color.hex);

    badge.classList.toggle('hidden', !isNew);
    resultEl.classList.remove('hidden');

    // Re-trigger animation
    resultEl.style.animation = 'none';
    resultEl.offsetHeight;
    resultEl.style.animation = '';
}

function hideResult() {
    $('merge-result').classList.add('hidden');
}

function showMergeError(msg) {
    // Show error in result area
    const resultEl = $('merge-result');
    $('result-swatch').style.background = 'rgba(248,113,113,0.15)';
    $('result-swatch').style.boxShadow = 'none';
    $('result-name').textContent = 'Mix Failed';
    $('result-name').style.color = '#f87171';
    $('result-hex').textContent = msg;
    $('result-hex').onclick = null;
    $('result-badge').classList.add('hidden');
    resultEl.classList.remove('hidden');
    resultEl.style.animation = 'none';
    resultEl.offsetHeight;
    resultEl.style.animation = '';
}

// ═══════════════════════════════════════════
// UI — Palette
// ═══════════════════════════════════════════

function renderPalette() {
    const grid = $('palette-grid');
    const search = ($('palette-search')?.value || '').toLowerCase();

    let filtered = gameState.colors;
    if (search) {
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(search) ||
            c.hex.toLowerCase().includes(search)
        );
    }

    grid.innerHTML = '';

    filtered.forEach(color => {
        const item = document.createElement('div');
        item.className = 'palette-item';
        if (color.isBase) item.classList.add('base-color');

        // Highlight if selected in a slot
        const isSelected = gameState.slots.some(s => s && s.id === color.id);
        if (isSelected) item.classList.add('selected');

        const swatch = document.createElement('div');
        swatch.className = 'palette-swatch';
        swatch.style.background = color.hex;
        swatch.style.boxShadow = `0 4px 16px ${color.hex}30`;

        const name = document.createElement('div');
        name.className = 'palette-name';
        name.textContent = color.name;

        const hex = document.createElement('div');
        hex.className = 'palette-hex';
        hex.textContent = color.hex.toUpperCase();

        item.appendChild(swatch);
        item.appendChild(name);
        item.appendChild(hex);

        item.addEventListener('click', () => selectColor(color));

        grid.appendChild(item);
    });
}

function updateCounter() {
    $('color-count').textContent = gameState.colors.length;
}

// ═══════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════

function copyHex(hex) {
    navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
        showToast(`Copied ${hex.toUpperCase()}`);
    }).catch(() => {});
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
}
