// ═══════════════════════════════════════════
// SYNESTHESIA — Infinite Color Mixer
// Engine v2: Sound, Achievements, WebGL
// ═══════════════════════════════════════════

const CONFIG = {
    apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'poolside/laguna-xs-2.1:free',
    maxTokens: 300,
    temperature: 0.75,
    keys: {
        apiKey: 'synesthesia_api_key',
        model:  'synesthesia_model',
        colors: 'synesthesia_colors',
        cache:  'synesthesia_cache',
        recent: 'synesthesia_recent',
        streak: 'synesthesia_streak',
        sound:  'synesthesia_sound',
        theme:  'synesthesia_theme',
    }
};

const BASE_COLORS = [
    { id: 'red',     name: 'Red',     hex: '#FF0000', isBase: true },
    { id: 'blue',    name: 'Blue',    hex: '#0055FF', isBase: true },
    { id: 'yellow',  name: 'Yellow',  hex: '#FFD700', isBase: true },
    { id: 'green',   name: 'Green',   hex: '#00CC66', isBase: true },
    { id: 'purple',  name: 'Purple',  hex: '#8B5CF6', isBase: true },
    { id: 'orange',  name: 'Orange',  hex: '#FF6B00', isBase: true },
    { id: 'pink',    name: 'Pink',    hex: '#FF69B4', isBase: true },
    { id: 'cyan',    name: 'Cyan',    hex: '#00CED1', isBase: true },
    { id: 'white',   name: 'White',   hex: '#FAFAFA', isBase: true },
    { id: 'black',   name: 'Black',   hex: '#141414', isBase: true },
];

const ACHIEVEMENTS = [
    { at: 1,   title: 'First Blend',        desc: 'You created your first color' },
    { at: 10,  title: 'Emerging Artist',     desc: '10 unique colors discovered' },
    { at: 25,  title: 'Color Explorer',      desc: '25 unique colors discovered' },
    { at: 50,  title: 'Palette Master',      desc: '50 unique colors discovered' },
    { at: 100, title: 'Chromatic Savant',    desc: '100 unique colors discovered' },
    { at: 250, title: 'Spectrum Architect',  desc: '250 unique colors discovered' },
    { at: 500, title: 'Color God',           desc: '500 unique colors discovered' },
];

// ── Themes ──
const THEMES = {
    underwater: {
        name: 'Deep Ocean',
        icon: '🌊',
        bodyClass: 'theme-underwater',
        orbOpacity: [0.04, 0.06],
        orbBlur: 50,
        particleGravity: 0.03,
    },
    nebula: {
        name: 'Cosmic Nebula',
        icon: '🌌',
        bodyClass: 'theme-nebula',
        orbOpacity: [0.06, 0.10],
        orbBlur: 70,
        particleGravity: 0.01,
    },
    cellular: {
        name: 'Microscopic',
        icon: '🔬',
        bodyClass: 'theme-cellular',
        orbOpacity: [0.03, 0.05],
        orbBlur: 30,
        particleGravity: 0.02,
    },
    arcane: {
        name: 'Arcane Alchemist',
        icon: '⚗️',
        bodyClass: 'theme-arcane',
        orbOpacity: [0.05, 0.08],
        orbBlur: 40,
        particleGravity: 0.06,
    },
};

// ── State ──
let state = {
    colors: [...BASE_COLORS],
    cache: {},
    slots: [null, null],
    merging: false,
    mouse: { x: 0.5, y: 0.5 },
    recentColors: ['#a78bfa', '#60a5fa', '#f472b6'],
    recentMixes: [],  // [{name, hex, parentA, parentB, hexA, hexB}]
    streak: 0,
    soundOn: true,
    discoveredCount: 0, // non-base colors
    theme: 'underwater',
};

const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
    loadGame();

    const key = localStorage.getItem(CONFIG.keys.apiKey);
    if (key) {
        $('api-modal').classList.add('hidden');
        $('game').classList.remove('hidden');
    }

    $('api-key-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') submitApiKey();
    });

    applyTheme(state.theme);
    initWebGL();
    initParallax();
    initParticles();
    renderPalette();
    renderRecent();
    updateCounter();
    updateStreak();
    updateSoundBtn();

    document.addEventListener('mousemove', e => {
        state.mouse.x = e.clientX / window.innerWidth;
        state.mouse.y = e.clientY / window.innerHeight;
        updateParallax();
    });
});

// Wire up selectColorById for evolution tree
window.selectColorById = function(id) {
    const color = state.colors.find(c => c.id === id);
    if (color) selectColor(color);
};

// ═══════════════════════════════════════════
// SOUND ENGINE (Web Audio API)
// ═══════════════════════════════════════════

let audioCtx = null;

function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playTone(freq, dur, type = 'sine', vol = 0.15, attack = 0.01, decay = dur) {
    if (!state.soundOn) return;
    try {
        const ctx = getAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + decay + 0.05);
    } catch(e) {}
}

function playSelect() {
    playTone(600, 0.08, 'sine', 0.1, 0.005, 0.08);
    playTone(900, 0.06, 'sine', 0.06, 0.01, 0.06);
}

function playMixStart() {
    playTone(300, 0.3, 'sine', 0.08, 0.01, 0.3);
    playTone(400, 0.4, 'sine', 0.06, 0.05, 0.4);
}

function playDiscovery() {
    const ctx = getAudio();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.25, 'sine', 0.12, 0.01, 0.25), i * 80);
    });
}

function playExisting() {
    playTone(400, 0.15, 'triangle', 0.08, 0.01, 0.15);
}

function playAchievement() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.35, 'sine', 0.15, 0.005, 0.35), i * 100);
    });
}

function toggleSound() {
    state.soundOn = !state.soundOn;
    localStorage.setItem(CONFIG.keys.sound, state.soundOn ? '1' : '0');
    updateSoundBtn();
    if (state.soundOn) playSelect();
}

function updateSoundBtn() {
    $('sound-btn').classList.toggle('muted', !state.soundOn);
}

// ═══════════════════════════════════════════
// WEBGL BACKGROUND — MULTI-THEME SHADERS
// ═══════════════════════════════════════════

let gl, shaderProgram, glU = {};
let glQuadBuf = null;

// Common GLSL prefix: simplex noise + uniforms
const SHADER_PREFIX = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_color1, u_color2, u_color3;
uniform vec2 u_mouse;

vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 mod289v(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}

float snoise(vec2 v){
    const vec4 C=vec4(.211324865,.366025403,-.577350269,.024390243);
    vec2 i=floor(v+dot(v,C.yy));
    vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
    vec4 x12=x0.xyxy+C.xxzz;
    x12.xy-=i1;
    i=mod289v(i);
    vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
    vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
    m=m*m; m=m*m;
    vec3 x_=2.*fract(p*C.www)-1.;
    vec3 h=abs(x_)-.5;
    vec3 ox=floor(x_+.5);
    vec3 a0=x_-ox;
    m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x=a0.x*x0.x+h.x*x0.y;
    g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.*dot(m,g);
}
`;

// ── Theme-specific fragment shaders ──

const SHADER_UNDERWATER = SHADER_PREFIX + `
void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float aspect=u_resolution.x/u_resolution.y;
    vec2 p=vec2(uv.x*aspect,uv.y);
    vec2 mp=vec2(u_mouse.x*aspect,u_mouse.y);
    float md=length(p-mp);
    float t=u_time*.05;

    // Fluid distortion
    vec2 q = p + vec2(snoise(p*1.5+vec2(t*.5)), snoise(p*1.8-vec2(t*.4))) * 0.15;
    
    // Deep overlapping caustics
    float c1 = max(0.0, sin(snoise(q*3.0+vec2(t*1.1))*3.14));
    float c2 = max(0.0, cos(snoise(q*4.0-vec2(t*0.8))*3.14));
    float c3 = max(0.0, sin(snoise(q*5.0+vec2(t*1.5))*3.14));
    float caustic = pow(c1*c2*c3, 0.8) * 2.5;

    // Dark water base (darker towards bottom)
    float baseNoise = snoise(p*0.8+vec2(t*.3))*.5+.5;
    vec3 col = mix(u_color1*0.8, u_color2*0.6, baseNoise);
    col = mix(col, u_color3*0.5, snoise(p*1.2-vec2(t*.2))*.5+.5);
    col *= 0.15 * uv.y; // Depth darkening

    // Add caustics (cyan/white tint)
    col += caustic * 0.25 * mix(vec3(1.0), u_color1, 0.3) * uv.y;

    // Distinct light rays
    float ray = snoise(vec2(p.x*3.0 - p.y*1.5 - t*0.4, -t*0.1));
    ray = pow(max(0.0, ray), 3.0);
    col += ray * 0.15 * u_color2 * uv.y;

    // Plankton (tiny floating specks)
    float plankton = snoise(p*40.0 + vec2(t*0.5, t*1.0));
    plankton = pow(max(0.0, plankton), 20.0) * 1.5;
    col += plankton * u_color3;

    // Mouse glow
    col += smoothstep(0.8, 0.0, md) * 0.08 * u_color3;

    // Heavy vignette
    float vig = 1.0 - smoothstep(0.1, 2.0, length(uv-0.5)*2.2);
    col *= vig;
    float grain = (fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5)*0.015;
    col += grain;
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}`;

const SHADER_NEBULA = SHADER_PREFIX + `
void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float aspect=u_resolution.x/u_resolution.y;
    vec2 p=vec2(uv.x*aspect,uv.y);
    vec2 mp=vec2(u_mouse.x*aspect,u_mouse.y);
    float t=u_time*.03;

    // Galaxy swirl distortion
    vec2 center = vec2(aspect*0.5, 0.5);
    vec2 d = p - center;
    float dist = length(d);
    float angle = atan(d.y, d.x) + dist*2.0 - t*0.5; // Swirl
    vec2 sp = center + vec2(cos(angle), sin(angle)) * dist;

    // Rich volumetric clouds based on swirled coords
    float gas1 = snoise(sp*1.5+vec2(t*.3,0.0))*.5+.5;
    float gas2 = snoise(sp*3.0-vec2(t*.2,t*.1))*.5+.5;
    float gas3 = snoise(sp*5.0+vec2(0.0,t*.4))*.5+.5;

    // Highly saturated nebula colors
    vec3 col = mix(u_color1, u_color2*1.5, gas1);
    col = mix(col, u_color3*2.0, gas2*gas2);
    col *= 0.1 + (gas1*gas2*gas3)*0.15;

    // Accretion disk glow (bright center)
    float core = smoothstep(0.6, 0.0, dist);
    col += core * 0.1 * u_color1;
    col += pow(core, 4.0) * 0.2 * vec3(1.0);

    // Sharp stars (layered)
    float stars1 = pow(max(0.0, snoise(p*30.0)), 30.0) * 2.0;
    float stars2 = pow(max(0.0, snoise(p*50.0 + 10.0)), 40.0) * 1.5;
    col += stars1 + stars2 * u_color3;

    // Mouse gravity lens
    float md = length(p-mp);
    col += smoothstep(0.4, 0.0, md) * 0.1 * u_color2;

    float vig = 1.0 - smoothstep(0.4, 2.2, length(uv-0.5)*2.0);
    col *= vig;
    float grain = (fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5)*0.01;
    col += grain;
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}`;

const SHADER_CELLULAR = SHADER_PREFIX + `
float metaball(vec2 p, vec2 c, float r) { return r / dot(p-c, p-c); }
void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float aspect=u_resolution.x/u_resolution.y;
    vec2 p=vec2(uv.x*aspect,uv.y)*5.0; // Zoomed out more
    vec2 mp=vec2(u_mouse.x*aspect,u_mouse.y)*5.0;
    float t=u_time*.04;

    // Dividing cell clusters
    float mb = 0.0;
    // Cluster 1 (dividing)
    vec2 c1a = vec2(aspect*2.5 + sin(t)*0.5, 2.5 + cos(t)*0.5);
    vec2 c1b = vec2(aspect*2.5 + sin(t+3.14)*0.5, 2.5 + cos(t+3.14)*0.5);
    mb += metaball(p, c1a, 0.3) + metaball(p, c1b, 0.25);
    
    // Cluster 2
    vec2 c2 = vec2(aspect*2.5 + cos(t*0.7)*2.0, 2.5 + sin(t*1.2)*1.5);
    mb += metaball(p, c2, 0.4);
    mb += metaball(p, c2 + vec2(sin(t*2.0)*0.4, cos(t*2.0)*0.4), 0.15); // tiny attached

    // Cluster 3
    vec2 c3 = vec2(aspect*2.5 + sin(t*0.5+2.0)*2.5, 2.5 + cos(t*0.9+1.0)*2.0);
    mb += metaball(p, c3, 0.35);

    // Mouse cell
    mb += metaball(p, mp, 0.2);

    // Strict membrane threshold
    float membrane = smoothstep(0.9, 1.0, mb) - smoothstep(1.0, 1.15, mb);
    float interior = smoothstep(1.0, 1.2, mb);

    // Background fluid (petri dish)
    float bgNoise = snoise(p*0.5 + vec2(t*0.1))*.5+.5;
    vec3 col = mix(vec3(0.01, 0.02, 0.03), u_color1*0.05, bgNoise);

    // Cell interior (complex organic noise)
    float cellNoise = snoise(p*3.0 - vec2(t*0.5))*.5+.5;
    float cellNoise2 = snoise(p*5.0 + vec2(t*0.3))*.5+.5;
    vec3 intCol = mix(u_color1, u_color2, cellNoise);
    intCol = mix(intCol, u_color3, cellNoise2);
    col = mix(col, intCol*0.2, interior);

    // Bright glowing membrane
    col += membrane * 0.8 * mix(u_color3, vec3(1.0), 0.5);

    // Nucleus / Organelles inside cells
    float nuc = snoise(p*10.0 + vec2(t*0.2));
    nuc = pow(max(0.0, nuc), 15.0) * 2.0;
    col += nuc * interior * u_color2;

    float vig = 1.0 - smoothstep(0.2, 1.8, length(uv-0.5)*2.2);
    col *= vig;
    float grain = (fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5)*0.015;
    col += grain;
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}`;

const SHADER_ARCANE = SHADER_PREFIX + `
void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float aspect=u_resolution.x/u_resolution.y;
    vec2 p=vec2(uv.x*aspect,uv.y);
    vec2 mp=vec2(u_mouse.x*aspect,u_mouse.y);
    float md=length(p-mp);
    float t=u_time*.04;
    vec3 gold = vec3(1.0, 0.8, 0.3);

    // Base parchment/smoke
    float smoke = snoise(p*1.5 + vec2(0.0, -t*0.3))*.5+.5;
    vec3 col = mix(vec3(0.05, 0.02, 0.01), u_color1*0.08, smoke);

    // Magic Circles (Geometric rotating rings)
    vec2 center = vec2(aspect*0.5, 0.5);
    vec2 d = p - center;
    float dist = length(d);
    float angle = atan(d.y, d.x);

    // Outer runic ring
    float ring1 = abs(dist - 0.4);
    float ring1Glow = smoothstep(0.02, 0.0, ring1);
    // Add dashes to ring
    float dashes = step(0.0, sin(angle*20.0 + t));
    col += ring1Glow * dashes * 0.4 * gold;

    // Inner pentagram/star approximation via noise & math
    float star = cos(angle*5.0 - t*1.5);
    float starLine = abs(dist - 0.2 - star*0.05);
    col += smoothstep(0.015, 0.0, starLine) * 0.3 * mix(gold, u_color2, 0.4);

    // Orbiting embers (particles)
    float emberAngle = angle*3.0 - t*2.0;
    float ember = snoise(vec2(emberAngle, dist*10.0));
    ember = pow(max(0.0, ember), 15.0) * 1.5;
    col += ember * mix(gold, vec3(1.0, 0.2, 0.0), 0.5);

    // Swirling magic dust
    float dust = abs(snoise(p*4.0 + vec2(t*0.5, -t*0.2)));
    dust = pow(1.0 - dust, 5.0) * 0.15;
    col += dust * u_color3;

    // Mouse interaction (Summoning flare)
    float flare = smoothstep(0.15, 0.0, md);
    col += flare * 0.1 * gold;

    float vig = 1.0 - smoothstep(0.2, 1.5, length(uv-0.5)*2.0);
    col *= vig;
    float grain = (fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5)*0.015;
    col += grain;
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}`;

const THEME_SHADERS = {
    underwater: SHADER_UNDERWATER,
    nebula: SHADER_NEBULA,
    cellular: SHADER_CELLULAR,
    arcane: SHADER_ARCANE,
};

function initWebGL() {
    const canvas = $('bg-canvas');
    gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    resizeCanvas(canvas);
    window.addEventListener('resize', () => resizeCanvas(canvas));

    // Create shared quad buffer once
    glQuadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glQuadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    // Build shader for current theme
    buildShaderProgram(state.theme);

    requestAnimationFrame(renderGL);
}

function buildShaderProgram(themeKey) {
    if (!gl) return;
    const vsSource = `attribute vec2 a_position; void main(){gl_Position=vec4(a_position,0.,1.);}`;
    const fsSource = THEME_SHADERS[themeKey] || SHADER_UNDERWATER;

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    if (shaderProgram) gl.deleteProgram(shaderProgram);
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vs);
    gl.attachShader(shaderProgram, fs);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Shader link failed'); return;
    }
    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, glQuadBuf);
    const pos = gl.getAttribLocation(shaderProgram, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    glU = {};
    ['time','resolution','color1','color2','color3','mouse'].forEach(n => {
        glU[n] = gl.getUniformLocation(shaderProgram, 'u_' + n);
    });
}

function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s)); gl.deleteShader(s); return null;
    }
    return s;
}

function resizeCanvas(c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    c.style.width = window.innerWidth + 'px';
    c.style.height = window.innerHeight + 'px';
    if (gl) gl.viewport(0, 0, c.width, c.height);
}

function renderGL(time) {
    if (!gl || !shaderProgram) return;
    requestAnimationFrame(renderGL);
    const t = time * 0.001;
    const [c1,c2,c3] = state.recentColors.map(hexToVec3);
    gl.uniform1f(glU.time, t);
    gl.uniform2f(glU.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform3f(glU.color1, c1[0], c1[1], c1[2]);
    gl.uniform3f(glU.color2, c2[0], c2[1], c2[2]);
    gl.uniform3f(glU.color3, c3[0], c3[1], c3[2]);
    gl.uniform2f(glU.mouse, state.mouse.x, 1.0 - state.mouse.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function hexToVec3(hex) {
    hex = hex.replace('#','');
    return [parseInt(hex.substring(0,2),16)/255, parseInt(hex.substring(2,4),16)/255, parseInt(hex.substring(4,6),16)/255];
}

// ═══════════════════════════════════════════
// THEME SYSTEM
// ═══════════════════════════════════════════

function applyTheme(themeKey) {
    if (!THEMES[themeKey]) themeKey = 'underwater';
    state.theme = themeKey;

    // Apply body class
    Object.values(THEMES).forEach(t => document.body.classList.remove(t.bodyClass));
    document.body.classList.add(THEMES[themeKey].bodyClass);

    // Rebuild shader if GL is ready
    if (gl) buildShaderProgram(themeKey);

    // Update orb visuals
    const theme = THEMES[themeKey];
    orbData.forEach(o => {
        o.el.style.filter = `blur(${theme.orbBlur}px)`;
        o.el.style.opacity = theme.orbOpacity[0] + Math.random() * (theme.orbOpacity[1] - theme.orbOpacity[0]);
    });
}

function setTheme(themeKey) {
    applyTheme(themeKey);
    localStorage.setItem(CONFIG.keys.theme, themeKey);
    showToast(`Theme: ${THEMES[themeKey].name}`);
}

// ═══════════════════════════════════════════
// PARALLAX ORBS
// ═══════════════════════════════════════════

const orbData = [];

function initParallax() {
    const layer = $('parallax-layer');
    for (let i = 0; i < 7; i++) {
        const orb = document.createElement('div');
        orb.className = 'parallax-orb';
        const size = 180 + Math.random() * 450;
        const x = Math.random() * 100, y = Math.random() * 100;
        const depth = 0.25 + Math.random() * 0.75;
        const hue = Math.random() * 360;
        orb.style.cssText = `width:${size}px;height:${size}px;left:${x}%;top:${y}%;background:hsl(${hue},55%,45%);opacity:${0.04+Math.random()*0.06}`;
        layer.appendChild(orb);
        orbData.push({ el: orb, baseX: x, baseY: y, depth });
    }
}

function updateParallax() {
    const dx = (state.mouse.x - 0.5) * 2, dy = (state.mouse.y - 0.5) * 2;
    orbData.forEach(o => {
        o.el.style.transform = `translate(${dx*o.depth*35}px, ${dy*o.depth*35}px)`;
    });
}

// ═══════════════════════════════════════════
// PARTICLE SYSTEM
// ═══════════════════════════════════════════

let particles = [], particleCtx;

function initParticles() {
    const c = $('particle-canvas');
    particleCtx = c.getContext('2d');
    resizePC();
    window.addEventListener('resize', resizePC);
    tickParticles();
}

function resizePC() {
    const c = $('particle-canvas');
    c.width = window.innerWidth; c.height = window.innerHeight;
}

function spawnParticles(x, y, hex1, hex2, hexResult) {
    const colors = [hex1, hex2, hexResult, hexResult, hexResult];
    for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 5;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: 1.5 + Math.random() * 5,
            life: 1,
            decay: 0.007 + Math.random() * 0.014,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

function spawnConfetti(x, y) {
    const colors = ['#fbbf24','#f87171','#34d399','#60a5fa','#a78bfa','#f472b6','#fff'];
    for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            size: 2 + Math.random() * 4,
            life: 1,
            decay: 0.005 + Math.random() * 0.01,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

function tickParticles() {
    requestAnimationFrame(tickParticles);
    if (!particleCtx) return;
    const c = $('particle-canvas');
    particleCtx.clearRect(0, 0, c.width, c.height);

    particles = particles.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += (THEMES[state.theme]?.particleGravity || 0.05); p.vx *= 0.99;
        p.life -= p.decay;
        if (p.life <= 0) return false;

        particleCtx.globalAlpha = p.life * p.life;
        particleCtx.fillStyle = p.color;
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        particleCtx.fill();
        return true;
    });
    particleCtx.globalAlpha = 1;
}

// ═══════════════════════════════════════════
// API KEY & SETTINGS
// ═══════════════════════════════════════════

function submitApiKey() {
    const key = $('api-key-input').value.trim();
    if (!key) return;
    localStorage.setItem(CONFIG.keys.apiKey, key);
    $('api-modal').classList.add('hidden');
    $('game').classList.remove('hidden');
    renderPalette();
    playSelect();
}

function openSettings() {
    $('settings-api-key').value = localStorage.getItem(CONFIG.keys.apiKey) || '';
    $('settings-model').value = localStorage.getItem(CONFIG.keys.model) || CONFIG.defaultModel;
    $('settings-theme').value = state.theme;
    $('settings-modal').classList.remove('hidden');
}

function closeSettings() { $('settings-modal').classList.add('hidden'); }

function saveSettings() {
    const key = $('settings-api-key').value.trim();
    const model = $('settings-model').value;
    const theme = $('settings-theme').value;
    if (key) localStorage.setItem(CONFIG.keys.apiKey, key);
    localStorage.setItem(CONFIG.keys.model, model);
    if (theme !== state.theme) setTheme(theme);
    closeSettings();
    showToast('Settings saved');
}

function resetGame() {
    if (!confirm('Erase all discovered colors?')) return;
    state.colors = [...BASE_COLORS];
    state.cache = {};
    state.slots = [null, null];
    state.recentMixes = [];
    state.streak = 0;
    state.recentColors = ['#a78bfa', '#60a5fa', '#f472b6'];
    saveGame();
    renderPalette(); renderRecent(); renderSlots();
    hideResult(); updateCounter(); updateStreak();
    closeSettings();
    showToast('Progress reset');
}

// ═══════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════

function saveGame() {
    localStorage.setItem(CONFIG.keys.colors, JSON.stringify(state.colors));
    localStorage.setItem(CONFIG.keys.cache, JSON.stringify(state.cache));
    localStorage.setItem(CONFIG.keys.recent, JSON.stringify(state.recentMixes));
    localStorage.setItem(CONFIG.keys.streak, String(state.streak));
}

function loadGame() {
    try {
        const sc = localStorage.getItem(CONFIG.keys.colors);
        const cc = localStorage.getItem(CONFIG.keys.cache);
        const rc = localStorage.getItem(CONFIG.keys.recent);
        const st = localStorage.getItem(CONFIG.keys.streak);
        const sn = localStorage.getItem(CONFIG.keys.sound);
        const th = localStorage.getItem(CONFIG.keys.theme);
        if (sc) state.colors = JSON.parse(sc);
        if (cc) state.cache = JSON.parse(cc);
        if (rc) state.recentMixes = JSON.parse(rc);
        if (st) state.streak = parseInt(st) || 0;
        if (sn !== null) state.soundOn = sn === '1';
        if (th && THEMES[th]) state.theme = th;
    } catch(e) { console.warn('Load failed:', e); }

    state.discoveredCount = state.colors.filter(c => !c.isBase).length;
    updateShaderColors();
}

function updateShaderColors() {
    const discovered = state.colors.filter(c => !c.isBase);
    if (discovered.length >= 3) {
        state.recentColors = discovered.slice(-3).map(c => c.hex);
    } else if (discovered.length > 0) {
        const d = discovered;
        state.recentColors = [
            d[d.length-1]?.hex || '#a78bfa',
            d[d.length-2]?.hex || '#60a5fa',
            d[d.length-3]?.hex || '#f472b6',
        ];
    }
}

// ═══════════════════════════════════════════
// COLOR MATH
// ═══════════════════════════════════════════

function hexToRGB(hex) {
    hex = hex.replace('#','');
    return { r: parseInt(hex.substring(0,2),16)/255, g: parseInt(hex.substring(2,4),16)/255, b: parseInt(hex.substring(4,6),16)/255 };
}

function rgbToHex(r, g, b) {
    const h = v => Math.round(Math.min(255,Math.max(0,v*255))).toString(16).padStart(2,'0');
    return '#' + h(r) + h(g) + h(b);
}

function rgbToHSL(r, g, b) {
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h, s, l=(max+min)/2;
    if (max===min) { h=s=0; } else {
        const d=max-min;
        s = l > 0.5 ? d/(2-max-min) : d/(max+min);
        switch(max) {
            case r: h=((g-b)/d+(g<b?6:0))/6; break;
            case g: h=((b-r)/d+2)/6; break;
            case b: h=((r-g)/d+4)/6; break;
        }
    }
    return { h:h*360, s:s*100, l:l*100 };
}

function hslToRGB(h, s, l) {
    h/=360; s/=100; l/=100;
    if (s===0) return {r:l,g:l,b:l};
    const hue2rgb = (p,q,t) => { if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p; };
    const q = l < 0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l - q;
    return { r:hue2rgb(p,q,h+1/3), g:hue2rgb(p,q,h), b:hue2rgb(p,q,h-1/3) };
}

function blendColors(hex1, hex2) {
    const rgb1=hexToRGB(hex1), rgb2=hexToRGB(hex2);
    const hsl1=rgbToHSL(rgb1.r,rgb1.g,rgb1.b), hsl2=rgbToHSL(rgb2.r,rgb2.g,rgb2.b);

    let hDiff = hsl2.h - hsl1.h;
    if (hDiff > 180) hDiff -= 360;
    if (hDiff < -180) hDiff += 360;
    let bH = hsl1.h + hDiff * 0.5;
    if (bH < 0) bH += 360; if (bH >= 360) bH -= 360;

    let bS, bL;
    if (hsl1.s < 5 && hsl2.s < 5) {
        bS = (hsl1.s+hsl2.s)/2; bL = (hsl1.l+hsl2.l)/2; bH = 0;
    } else if (hsl1.s < 5) {
        bH=hsl2.h; bS=hsl2.s*0.55; bL=(hsl1.l+hsl2.l)/2;
    } else if (hsl2.s < 5) {
        bH=hsl1.h; bS=hsl1.s*0.55; bL=(hsl1.l+hsl2.l)/2;
    } else {
        bS=(hsl1.s+hsl2.s)/2; bL=(hsl1.l+hsl2.l)/2;
    }

    const rgb = hslToRGB(bH, bS, bL);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// ═══════════════════════════════════════════
// FALLBACK NAMING
// ═══════════════════════════════════════════

function fallbackColorName(hex) {
    const rgb = hexToRGB(hex);
    const hsl = rgbToHSL(rgb.r, rgb.g, rgb.b);

    const hueNames = ['Scarlet','Amber','Saffron','Chartreuse','Jade','Viridian','Cerulean','Cobalt','Indigo','Violet','Magenta','Cerise'];
    const idx = Math.floor(hsl.h / 30) % 12;

    let prefix = '';
    if (hsl.l > 82) prefix = 'Pale ';
    else if (hsl.l > 68) prefix = 'Light ';
    else if (hsl.l < 12) prefix = 'Midnight ';
    else if (hsl.l < 28) prefix = 'Deep ';

    if (hsl.s < 8) {
        if (hsl.l > 88) return 'Porcelain';
        if (hsl.l > 65) return 'Silver';
        if (hsl.l > 40) return 'Pewter';
        if (hsl.l > 18) return 'Graphite';
        return 'Obsidian';
    }

    return prefix + hueNames[idx];
}

// ═══════════════════════════════════════════
// AI INTEGRATION
// ═══════════════════════════════════════════

async function askAI(colorA, colorB, blendedHex, exactName) {
    const apiKey = localStorage.getItem(CONFIG.keys.apiKey);
    const model = localStorage.getItem(CONFIG.keys.model) || CONFIG.defaultModel;

    if (!apiKey) { $('api-modal').classList.remove('hidden'); throw new Error('API key required'); }

    const prompt = `Two colors were mixed:

"${colorA.name}" (${colorA.hex}) + "${colorB.name}" (${colorB.hex})

The mathematical blend produced: ${blendedHex}
The technical database name for this exact hex is: "${exactName || 'Unknown'}"

Name this color. Give it a sophisticated, evocative name like a professional paint brand — 1 to 3 words. Not generic. Think: "Burnt Sienna", "Midnight Orchid", "Arctic Slate", "Molten Copper", "Velvet Dusk".

CRITICAL INSTRUCTIONS:
1. Be extremely sensitive to subtle differences in the hex value. Even a slight shift in hue, saturation, or lightness MUST result in a completely unique and different name. Do NOT reuse common names. Give every subtle variation its own distinct identity.
2. You can incorporate the technical database name into your evocative name if it makes sense (e.g. if technical name is 'Stratos', you could output 'Midnight Stratos' or just 'Stratos').

You may adjust the hex slightly if a nearby shade better fits your name.

Respond with ONLY a JSON object, no other text:
{"name":"YourColorName","hex":"#XXXXXX"}`;

    const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.href,
            'X-Title': 'Synesthesia'
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You name colors. Respond ONLY with JSON: {"name":"...","hex":"#XXXXXX"}. No markdown. No extra text.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: CONFIG.maxTokens,
            temperature: CONFIG.temperature
        })
    });

    if (!response.ok) {
        if (response.status === 401) { localStorage.removeItem(CONFIG.keys.apiKey); $('api-modal').classList.remove('hidden'); }
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const raw = (data.choices?.[0]?.message?.content || '').trim();

    let parsed = null;
    try { parsed = JSON.parse(raw); } catch(e) {}
    if (!parsed) { const m = raw.match(/\{[^{}]*"name"\s*:\s*"[^"]+"\s*[,}][^{}]*\}/); if (m) try { parsed = JSON.parse(m[0]); } catch(e) {} }
    if (!parsed) { const nm = raw.match(/"name"\s*:\s*"([^"]+)"/); const hm = raw.match(/"hex"\s*:\s*"(#[0-9a-fA-F]{6})"/); if (nm) parsed = { name: nm[1], hex: hm ? hm[1] : blendedHex }; }
    if (!parsed && raw.length > 0 && raw.length < 50 && !raw.includes('{')) { const cn = raw.replace(/['"`]/g,'').trim(); if (cn) parsed = { name: cn, hex: blendedHex }; }
    if (!parsed || !parsed.name) throw new Error('Could not parse AI response');
    if (!parsed.hex || !/^#[0-9a-fA-F]{6}$/.test(parsed.hex)) parsed.hex = blendedHex;

    return parsed;
}

// ═══════════════════════════════════════════
// MERGE LOGIC
// ═══════════════════════════════════════════

function getMergeKey(a, b) { return [a.id, b.id].sort().join('+'); }

function colorDistance(hex1, hex2) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

async function performMerge() {
    const [a, b] = state.slots;
    if (!a || !b || state.merging) return;

    state.merging = true;
    $('merge-btn-wrap').classList.add('hidden');
    $('merge-loading').classList.remove('hidden');
    $('merge-result').classList.add('hidden');
    playMixStart();

    const cacheKey = getMergeKey(a, b);
    const blendedHex = blendColors(a.hex, b.hex);

    try {
        let exactName = null;
        try {
            const colorRes = await fetch(`https://www.thecolorapi.com/id?hex=${blendedHex.substring(1)}`);
            if (colorRes.ok) {
                const colorData = await colorRes.json();
                exactName = colorData.name.value;
            }
        } catch(e) {}

        let result;
        if (state.cache[cacheKey]) {
            result = state.cache[cacheKey];
        } else {
            try { result = await askAI(a, b, blendedHex, exactName); }
            catch (aiErr) {
                console.warn('AI failed, using fallback:', aiErr.message);
                result = { name: exactName || fallbackColorName(blendedHex), hex: blendedHex };
            }
            state.cache[cacheKey] = result;
        }

        // Distance matching to ensure similar hexes don't incorrectly collapse due to AI naming collisions
        let closestIdx = -1;
        let minDistance = Infinity;
        for (let i = 0; i < state.colors.length; i++) {
            const d = colorDistance(state.colors[i].hex, result.hex);
            if (d < minDistance) {
                minDistance = d;
                closestIdx = i;
            }
        }

        let isNew = false, colorObj;

        // Threshold of 15 means it must be extremely mathematically close to an existing color (max is 441)
        if (minDistance < 15 && closestIdx !== -1) {
            colorObj = state.colors[closestIdx];
            state.streak = 0;
            playExisting();
        } else {
            // New color discovered! Make sure the name doesn't clash with an existing color.
            let finalName = result.name;
            let numeral = 2;
            const toRoman = (num) => {
                const roman = ["", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                return roman[num - 1] || num.toString();
            };
            while (state.colors.some(c => c.name.toLowerCase() === finalName.toLowerCase())) {
                finalName = `${result.name} ${toRoman(numeral)}`;
                numeral++;
            }

            colorObj = {
                id: finalName.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,''),
                name: finalName, hex: result.hex, isBase: false,
                parents: [a.name, b.name]
            };
            state.colors.push(colorObj);
            isNew = true;
            state.discoveredCount++;
            state.streak++;
            state.recentColors = [state.recentColors[1], state.recentColors[2], result.hex];

            playDiscovery();
            checkAchievements();
        }

        // Add to recent mixes
        state.recentMixes.unshift({
            name: colorObj.name, hex: colorObj.hex,
            parentA: a.name, parentB: b.name,
            hexA: a.hex, hexB: b.hex
        });
        if (state.recentMixes.length > 12) state.recentMixes.pop();

        saveGame();

        // Particle burst
        const btnRect = $('merge-btn-wrap').getBoundingClientRect?.() || { left: window.innerWidth/2, top: window.innerHeight/2, width: 0 };
        spawnParticles(btnRect.left + btnRect.width/2, btnRect.top, a.hex, b.hex, result.hex);

        showResult(colorObj, isNew, a, b);
        renderPalette();
        renderRecent();
        updateCounter();
        updateStreak();

    } catch (err) {
        console.error('Merge failed:', err);
        showMergeError(err.message);
    } finally {
        state.merging = false;
        $('merge-loading').classList.add('hidden');
    }
}

function randomMix() {
    if (state.merging) return;
    const pool = state.colors;
    const a = pool[Math.floor(Math.random() * pool.length)];
    let b = pool[Math.floor(Math.random() * pool.length)];
    // Try to pick a different color
    let attempts = 0;
    while (b.id === a.id && attempts < 10) {
        b = pool[Math.floor(Math.random() * pool.length)];
        attempts++;
    }
    state.slots = [a, b];
    renderSlots();
    hideResult();
    playSelect();

    // Auto-merge after a short delay
    setTimeout(() => performMerge(), 400);
}

// ═══════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════

function checkAchievements() {
    const count = state.discoveredCount;
    const ach = ACHIEVEMENTS.find(a => a.at === count);
    if (ach) {
        showAchievement(ach.title, ach.desc);
        playAchievement();
        spawnConfetti(window.innerWidth / 2, window.innerHeight / 3);
    }
}

function showAchievement(title, desc) {
    const el = $('achievement');
    $('ach-title').textContent = title;
    $('ach-desc').textContent = desc;
    el.classList.remove('hidden', 'show');
    void el.offsetHeight;
    el.classList.add('show');
    setTimeout(() => { el.classList.remove('show'); el.classList.add('hidden'); }, 4200);
}

// ═══════════════════════════════════════════
// UI — SLOTS
// ═══════════════════════════════════════════

function selectColor(color) {
    if (state.merging) return;
    playSelect();

    if (!state.slots[0]) {
        state.slots[0] = color;
    } else if (!state.slots[1]) {
        state.slots[1] = color;
    } else {
        state.slots = [color, null];
        hideResult();
    }
    renderSlots();
    updatePaletteSelection();
}

function dropColor(e, slotIndex) {
    e.preventDefault();
    if (state.merging) return;
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const color = state.colors.find(c => c.id === id);
    if (!color) return;

    playSelect();
    state.slots[slotIndex] = color;
    
    // Auto-clear result if we're preparing a new mix
    if (state.slots[0] && state.slots[1]) {
        // We have both, but is this a brand new mix or replacing one slot of a finished mix?
        // Let's just always hide result when they modify slots manually.
        hideResult();
    } else {
        hideResult();
    }
    
    renderSlots();
    updatePaletteSelection();
}

function clearSlot(index) {
    if (state.merging) return;
    state.slots[index] = null;
    renderSlots(); updatePaletteSelection(); hideResult();
}

function renderSlots() {
    for (let i = 0; i < 2; i++) {
        const el = $(`slot-${i}`);
        const swatch = el.querySelector('.slot-swatch');
        const ring = el.querySelector('.slot-ring');
        const name = el.querySelector('.slot-name');
        const c = state.slots[i];

        if (c) {
            el.classList.remove('empty');
            el.classList.add('filling');
            swatch.style.background = c.hex;
            swatch.style.boxShadow = `0 0 28px ${c.hex}40, 0 0 56px ${c.hex}15`;
            ring.style.borderColor = `${c.hex}25`;
            name.textContent = c.name;
            setTimeout(() => el.classList.remove('filling'), 450);
        } else {
            el.classList.add('empty');
            swatch.style.background = 'rgba(255,255,255,0.03)';
            swatch.style.boxShadow = 'none';
            ring.style.borderColor = 'transparent';
            name.textContent = 'select';
        }
    }

    // Show/hide merge button & preview color on it
    const both = state.slots[0] && state.slots[1];
    $('merge-btn-wrap').classList.toggle('hidden', !both);

    if (both) {
        const preview = blendColors(state.slots[0].hex, state.slots[1].hex);
        const btn = $('merge-btn');
        btn.style.borderColor = preview + '50';
        btn.style.color = preview;
        btn.style.boxShadow = `0 0 20px ${preview}15`;
    }
}

// ═══════════════════════════════════════════
// UI — RESULT
// ═══════════════════════════════════════════

function showResult(color, isNew, parentA, parentB) {
    const el = $('merge-result');
    const swatch = $('result-swatch');
    swatch.style.background = color.hex;
    swatch.style.boxShadow = `0 0 40px ${color.hex}45, 0 0 80px ${color.hex}18`;
    $('result-name').textContent = color.name;
    $('result-name').style.color = color.hex;
    $('result-hex').textContent = color.hex.toUpperCase();
    $('result-hex').onclick = () => copyHex(color.hex);
    $('result-badge').classList.toggle('hidden', !isNew);

    if (parentA && parentB) {
        $('result-parents').textContent = `${parentA.name} + ${parentB.name}`;
    } else {
        $('result-parents').textContent = '';
    }

    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = '';
}

function hideResult() { $('merge-result').classList.add('hidden'); }

function showMergeError(msg) {
    $('result-swatch').style.background = 'rgba(248,113,113,0.08)';
    $('result-swatch').style.boxShadow = 'none';
    $('result-name').textContent = 'Mix failed';
    $('result-name').style.color = '#f87171';
    $('result-hex').textContent = msg;
    $('result-hex').onclick = null;
    $('result-badge').classList.add('hidden');
    $('result-parents').textContent = '';
    const el = $('merge-result');
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = '';
}

// ═══════════════════════════════════════════
// UI — RECENT MIXES
// ═══════════════════════════════════════════

function renderRecent() {
    const section = $('recent-section');
    const strip = $('recent-strip');

    if (state.recentMixes.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    strip.innerHTML = '';

    state.recentMixes.forEach(mix => {
        const item = document.createElement('div');
        item.className = 'recent-item';

        item.innerHTML = `
            <div class="recent-parent-swatch" style="background:${mix.hexA}"></div>
            <span class="recent-arrow">+</span>
            <div class="recent-parent-swatch" style="background:${mix.hexB}"></div>
            <span class="recent-arrow">=</span>
            <div class="recent-swatch" style="background:${mix.hex};box-shadow:0 2px 8px ${mix.hex}30"></div>
            <span class="recent-name">${mix.name}</span>
        `;

        item.addEventListener('click', () => {
            const colorObj = state.colors.find(c => c.name.toLowerCase() === mix.name.toLowerCase());
            if (colorObj) selectColor(colorObj);
        });

        const colorObj = state.colors.find(c => c.name.toLowerCase() === mix.name.toLowerCase());
        if (colorObj) {
            item.draggable = true;
            item.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', colorObj.id);
                item.style.opacity = '0.5';
            };
            item.ondragend = () => {
                item.style.opacity = '1';
            };
        }

        strip.appendChild(item);
    });
}

// ═══════════════════════════════════════════
// UI — PALETTE
// ═══════════════════════════════════════════

function renderPalette() {
    const grid = $('palette-grid');
    const search = ($('palette-search')?.value || '').toLowerCase();

    let filtered = state.colors;
    if (search) {
        filtered = filtered.filter(c => c.name.toLowerCase().includes(search) || c.hex.toLowerCase().includes(search));
    }

    grid.innerHTML = '';

    filtered.forEach((color, i) => {
        const item = document.createElement('div');
        item.className = 'palette-item';
        item.dataset.id = color.id;
        if (color.isBase) item.classList.add('base-item');
        if (state.slots.some(s => s && s.id === color.id)) item.classList.add('selected');

        item.draggable = true;
        item.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', color.id);
            item.style.opacity = '0.5';
        };
        item.ondragend = () => {
            item.style.opacity = '1';
        };

        // Staggered entrance animation
        item.style.animationDelay = `${Math.min(i * 0.02, 0.5)}s`;

        const swatch = document.createElement('div');
        swatch.className = 'palette-swatch';
        swatch.style.background = color.hex;
        swatch.style.boxShadow = `0 4px 18px ${color.hex}22`;

        const name = document.createElement('div');
        name.className = 'palette-name';
        name.textContent = color.name;

        const hex = document.createElement('div');
        hex.className = 'palette-hex';
        hex.textContent = color.hex.toUpperCase();

        item.append(swatch, name, hex);
        item.addEventListener('click', () => selectColor(color));
        grid.appendChild(item);
    });
}

function updatePaletteSelection() {
    document.querySelectorAll('.palette-item').forEach(item => {
        const isSelected = state.slots.some(s => s && s.id === item.dataset.id);
        item.classList.toggle('selected', isSelected);
    });
}

function updateCounter() { $('color-count').textContent = state.colors.length; }

function updateStreak() {
    const pill = $('streak-pill');
    const count = $('streak-count');
    if (state.streak > 1) {
        pill.classList.remove('hidden');
        count.textContent = state.streak;
    } else {
        pill.classList.add('hidden');
    }
}

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════

function copyHex(hex) {
    navigator.clipboard.writeText(hex.toUpperCase()).then(() => showToast(`Copied ${hex.toUpperCase()}`)).catch(() => {});
}

function showToast(msg) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
}
