// ============================================
// lighting-studio.js — Live In-Game Lighting Tuner
// ============================================

export function initLightingStudio() {
    // Prevent duplicate injection
    if (document.getElementById('lighting-studio-container')) return;

    const defaultConfig = {
        active: true,
        // Celestial & Sun
        freezeTime: true,
        timeOfDay: 0.50,
        dayLength: 600,
        sunTilt: 32,
        sunIntensity: 0.65,
        sunColor: "#fff8ea",
        moonIntensity: 0.20,
        moonColor: "#3c4a6e",
        celestialScale: 1.0,

        // Ambient & Brightness
        ambIntensity: 0.75,
        ambColor: "#dce5f4",
        brightnessMultiplier: 1.0,

        // Caves & Underground
        caveFloorAmb: 0.20,
        caveFogDensity: 0.012,

        // Sky Dome & Horizon
        skyTopColor: "#78a7ff",
        skyHorizonColor: "#c0d8ff",
        skyBottomColor: "#182030",
        skyExponent: 1.15,
        sunGlowIntensity: 0.70,
        sunGlowColor: "#ffa458",

        // Fog & Atmosphere
        fogDensity: 0.0030,
        fogMatchHorizon: true,
        customFogColor: "#c0d8ff",

        // Torches & Point Lights
        torchIntensity: 8.0,
        torchDistance: 60,
        torchColor: "#ff7711",
        torchFlicker: 0.20,

        // Clouds, Stars & Weather
        cloudVisible: true,
        cloudOpacity: 0.82,
        cloudColor: "#ffffff",
        cloudAltitude: 128,
        starBrightness: 1.0,
        weatherForce: 'clear'
    };

    window._customLightingConfig = { ...defaultConfig };

    // Inject Styles
    const style = document.createElement('style');
    style.textContent = `
        #lighting-studio-toggle {
            position: fixed;
            top: 14px;
            right: 14px;
            z-index: 100000;
            background: rgba(18, 24, 38, 0.90);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 8px;
            color: #fff;
            padding: 8px 14px;
            font-family: 'Space Grotesk', system-ui, sans-serif;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            backdrop-filter: blur(12px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.45);
            display: flex;
            align-items: center;
            gap: 8px;
            user-select: none;
            transition: all 0.2s ease;
        }
        #lighting-studio-toggle:hover {
            background: rgba(30, 42, 64, 0.98);
            border-color: #58a6ff;
            transform: translateY(-1px);
        }
        #lighting-studio-panel {
            position: fixed;
            top: 56px;
            right: 14px;
            width: 340px;
            max-height: calc(100vh - 72px);
            background: rgba(14, 18, 28, 0.94);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.65);
            z-index: 100000;
            color: #e6edf3;
            font-family: 'Space Grotesk', system-ui, sans-serif;
            font-size: 12px;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            user-select: none;
        }
        #lighting-studio-panel.minimized {
            display: none;
        }
        .ls-header {
            padding: 12px 14px;
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: 0.3px;
        }
        .ls-close-btn {
            background: none;
            border: none;
            color: #8b949e;
            font-size: 16px;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 4px;
        }
        .ls-close-btn:hover {
            color: #fff;
            background: rgba(255,255,255,0.1);
        }
        .ls-body {
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .ls-accordion {
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.02);
            overflow: hidden;
        }
        .ls-accordion-header {
            padding: 8px 10px;
            background: rgba(255, 255, 255, 0.05);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #8b949e;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .ls-accordion-header:hover {
            background: rgba(255, 255, 255, 0.09);
            color: #e6edf3;
        }
        .ls-accordion-content {
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 9px;
        }
        .ls-accordion.collapsed .ls-accordion-content {
            display: none;
        }
        .ls-accordion-arrow {
            font-size: 9px;
            transition: transform 0.2s ease;
        }
        .ls-accordion.collapsed .ls-accordion-arrow {
            transform: rotate(-90deg);
        }
        .ls-row {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .ls-label-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #c9d1d9;
        }
        .ls-val {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #58a6ff;
            font-weight: 600;
        }
        .ls-input-range {
            width: 100%;
            accent-color: #388bfd;
            cursor: pointer;
            height: 6px;
            background: rgba(255,255,255,0.12);
            border-radius: 3px;
        }
        .ls-color-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2px 0;
            font-size: 11px;
        }
        .ls-color-right {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .ls-color-hex {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: #8b949e;
        }
        .ls-color-input {
            width: 28px;
            height: 22px;
            border: 1px solid rgba(255,255,255,0.25);
            border-radius: 4px;
            background: none;
            cursor: pointer;
            padding: 0;
        }
        .ls-checkbox-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            cursor: pointer;
            color: #c9d1d9;
        }
        .ls-btn-group {
            display: flex;
            gap: 4px;
        }
        .ls-group-btn {
            flex: 1;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            color: #c9d1d9;
            padding: 5px 6px;
            border-radius: 4px;
            font-size: 10px;
            cursor: pointer;
            text-align: center;
            transition: all 0.15s ease;
        }
        .ls-group-btn:hover {
            background: rgba(56, 139, 253, 0.25);
            border-color: #388bfd;
            color: #fff;
        }
        .ls-group-btn.active {
            background: #238636;
            border-color: #3fb950;
            color: #fff;
            font-weight: 600;
        }
        .ls-presets {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
        }
        .ls-preset-btn {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
            color: #c9d1d9;
            padding: 6px 8px;
            border-radius: 6px;
            font-size: 10.5px;
            cursor: pointer;
            transition: all 0.15s ease;
            text-align: center;
        }
        .ls-preset-btn:hover {
            background: rgba(56, 139, 253, 0.25);
            border-color: #388bfd;
            color: #fff;
        }
        .ls-copy-btn {
            background: #238636;
            border: 1px solid rgba(255,255,255,0.2);
            color: #fff;
            padding: 10px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s ease;
            margin-top: 4px;
        }
        .ls-copy-btn:hover {
            background: #2ea043;
            box-shadow: 0 0 12px rgba(46, 160, 67, 0.5);
        }
        .ls-json-box {
            width: 100%;
            height: 90px;
            background: rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 6px;
            color: #7ee787;
            font-family: 'JetBrains Mono', monospace;
            font-size: 9.5px;
            padding: 6px;
            box-sizing: border-box;
            resize: vertical;
        }
        .ls-note {
            font-size: 10px;
            color: #8b949e;
            line-height: 1.4;
            margin-top: 2px;
        }
    `;
    document.head.appendChild(style);

    // Container
    const container = document.createElement('div');
    container.id = 'lighting-studio-container';

    // Stop all clicks/touches/keys from leaking into the game
    ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'keydown', 'keyup', 'touchstart', 'touchend', 'wheel'].forEach(evt => {
        container.addEventListener(evt, e => e.stopPropagation());
    });

    // Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'lighting-studio-toggle';
    toggleBtn.innerHTML = `<span>💡</span> <span>Lighting Settings</span>`;
    container.appendChild(toggleBtn);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'lighting-studio-panel';
    panel.innerHTML = `
        <div class="ls-header">
            <span>🎨 Slopcraft Lighting Studio</span>
            <button class="ls-close-btn" id="ls-close-btn" title="Minimize Panel">✕</button>
        </div>
        <div class="ls-body">

            <!-- 1. Celestial & Sun -->
            <div class="ls-accordion" id="sec-celestial">
                <div class="ls-accordion-header">
                    <span>☀️ Celestial & Sun Mechanics</span>
                    <span class="ls-accordion-arrow">▼</span>
                </div>
                <div class="ls-accordion-content">
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Time of Day</span>
                            <span class="ls-val" id="val-timeOfDay">0.50 (Noon)</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-timeOfDay" min="0" max="1" step="0.005" value="0.50">
                    </div>
                    <label class="ls-checkbox-row">
                        <input type="checkbox" id="input-freezeTime" checked>
                        <span>Freeze Time of Day</span>
                    </label>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Day Cycle Length (s)</span>
                            <span class="ls-val" id="val-dayLength">600s</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-dayLength" min="30" max="1800" step="10" value="600">
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Sun Orbit Tilt (Z-Offset)</span>
                            <span class="ls-val" id="val-sunTilt">32</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-sunTilt" min="-80" max="80" step="1" value="32">
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Sun Light Intensity</span>
                            <span class="ls-val" id="val-sunIntensity">0.65</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-sunIntensity" min="0.00" max="2.50" step="0.01" value="0.65">
                    </div>
                    <div class="ls-color-row">
                        <span>Sun Light Tint</span>
                        <div class="ls-color-right">
                            <span class="ls-color-hex" id="hex-sunColor">#fff8ea</span>
                            <input type="color" class="ls-color-input" id="input-sunColor" value="#fff8ea">
                        </div>
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Moon Light Intensity</span>
                            <span class="ls-val" id="val-moonIntensity">0.20</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-moonIntensity" min="0.00" max="1.00" step="0.01" value="0.20">
                    </div>
                    <div class="ls-color-row">
                        <span>Moon Light Tint</span>
                        <div class="ls-color-right">
                            <span class="ls-color-hex" id="hex-moonColor">#3c4a6e</span>
                            <input type="color" class="ls-color-input" id="input-moonColor" value="#3c4a6e">
                        </div>
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Sun/Moon Sky Mesh Size</span>
                            <span class="ls-val" id="val-celestialScale">1.00x</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-celestialScale" min="0.4" max="3.0" step="0.1" value="1.0">
                    </div>
                </div>
            </div>

            <!-- 2. Ambient & Surface -->
            <div class="ls-accordion" id="sec-ambient">
                <div class="ls-accordion-header">
                    <span>💡 Ambient & Surface Lighting</span>
                    <span class="ls-accordion-arrow">▼</span>
                </div>
                <div class="ls-accordion-content">
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Ambient Light Intensity</span>
                            <span class="ls-val" id="val-ambIntensity">0.75</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-ambIntensity" min="0.10" max="2.50" step="0.01" value="0.75">
                    </div>
                    <div class="ls-color-row">
                        <span>Ambient Light Tint</span>
                        <div class="ls-color-right">
                            <span class="ls-color-hex" id="hex-ambColor">#dce5f4</span>
                            <input type="color" class="ls-color-input" id="input-ambColor" value="#dce5f4">
                        </div>
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Global Brightness Multiplier</span>
                            <span class="ls-val" id="val-brightnessMultiplier">1.00x</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-brightnessMultiplier" min="0.50" max="2.00" step="0.05" value="1.00">
                    </div>
                </div>
            </div>

            <!-- 3. Caves & Underground -->
            <div class="ls-accordion" id="sec-caves">
                <div class="ls-accordion-header">
                    <span>⛏️ Caves & Underground</span>
                    <span class="ls-accordion-arrow">▼</span>
                </div>
                <div class="ls-accordion-content">
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Cave Darkness Floor</span>
                            <span class="ls-val" id="val-caveFloorAmb">0.20</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-caveFloorAmb" min="0.00" max="0.80" step="0.01" value="0.20">
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Deep Cave Fog Density</span>
                            <span class="ls-val" id="val-caveFogDensity">0.012</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-caveFogDensity" min="0.000" max="0.040" step="0.001" value="0.012">
                    </div>
                </div>
            </div>

            <!-- 4. Sky Dome & Atmosphere -->
            <div class="ls-accordion" id="sec-sky">
                <div class="ls-accordion-header">
                    <span>🌫️ Sky Dome & Atmosphere</span>
                    <span class="ls-accordion-arrow">▼</span>
                </div>
                <div class="ls-accordion-content">
                    <div class="ls-color-row">
                        <span>Sky Zenith (Top)</span>
                        <div class="ls-color-right">
                            <span class="ls-color-hex" id="hex-skyTopColor">#78a7ff</span>
                            <input type="color" class="ls-color-input" id="input-skyTopColor" value="#78a7ff">
                        </div>
                    </div>
                    <div class="ls-color-row">
                        <span>Sky Horizon Haze</span>
                        <div class="ls-color-right">
                            <span class="ls-color-hex" id="hex-skyHorizonColor">#c0d8ff</span>
                            <input type="color" class="ls-color-input" id="input-skyHorizonColor" value="#c0d8ff">
                        </div>
                    </div>
                    <div class="ls-color-row">
                        <span>Sky Void / Bottom</span>
                        <div class="ls-color-right">
                            <span class="ls-color-hex" id="hex-skyBottomColor">#182030</span>
                            <input type="color" class="ls-color-input" id="input-skyBottomColor" value="#182030">
                        </div>
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Sky Gradient Curve (Exponent)</span>
                            <span class="ls-val" id="val-skyExponent">1.15</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-skyExponent" min="0.40" max="3.00" step="0.05" value="1.15">
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Sunrise/Sunset Glow Intensity</span>
                            <span class="ls-val" id="val-sunGlowIntensity">0.70</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-sunGlowIntensity" min="0.00" max="1.50" step="0.05" value="0.70">
                    </div>
                    <div class="ls-color-row">
                        <span>Sunrise/Sunset Glow Color</span>
                        <div class="ls-color-right">
                            <span class="ls-color-hex" id="hex-sunGlowColor">#ffa458</span>
                            <input type="color" class="ls-color-input" id="input-sunGlowColor" value="#ffa458">
                        </div>
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Overworld Fog Density</span>
                            <span class="ls-val" id="val-fogDensity">0.0030</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-fogDensity" min="0.0000" max="0.0150" step="0.0005" value="0.0030">
                    </div>
                    <label class="ls-checkbox-row">
                        <input type="checkbox" id="input-fogMatchHorizon" checked>
                        <span>Fog Auto-Matches Horizon Color</span>
                    </label>
                    <div class="ls-color-row" id="row-customFogColor">
                        <span>Custom Fog Color</span>
                        <div class="ls-color-right">
                            <span class="ls-color-hex" id="hex-customFogColor">#c0d8ff</span>
                            <input type="color" class="ls-color-input" id="input-customFogColor" value="#c0d8ff">
                        </div>
                    </div>
                </div>
            </div>

            <!-- 5. Torches & Point Lights -->
            <div class="ls-accordion" id="sec-torches">
                <div class="ls-accordion-header">
                    <span>🔥 Torches & Point Lights</span>
                    <span class="ls-accordion-arrow">▼</span>
                </div>
                <div class="ls-accordion-content">
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Torch Light Intensity</span>
                            <span class="ls-val" id="val-torchIntensity">8.0</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-torchIntensity" min="0.0" max="25.0" step="0.5" value="8.0">
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Torch Light Radius / Range</span>
                            <span class="ls-val" id="val-torchDistance">60m</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-torchDistance" min="10" max="100" step="5" value="60">
                    </div>
                    <div class="ls-color-row">
                        <span>Torch Light Tint</span>
                        <div class="ls-color-right">
                            <span class="ls-color-hex" id="hex-torchColor">#ff7711</span>
                            <input type="color" class="ls-color-input" id="input-torchColor" value="#ff7711">
                        </div>
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Torch Flame Flicker Amount</span>
                            <span class="ls-val" id="val-torchFlicker">0.20</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-torchFlicker" min="0.00" max="0.80" step="0.02" value="0.20">
                    </div>
                </div>
            </div>

            <!-- 6. Clouds, Stars & Weather -->
            <div class="ls-accordion" id="sec-clouds">
                <div class="ls-accordion-header">
                    <span>☁️ Clouds, Stars & Weather</span>
                    <span class="ls-accordion-arrow">▼</span>
                </div>
                <div class="ls-accordion-content">
                    <label class="ls-checkbox-row">
                        <input type="checkbox" id="input-cloudVisible" checked>
                        <span>Render 3D Volumetric Clouds</span>
                    </label>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Cloud Opacity</span>
                            <span class="ls-val" id="val-cloudOpacity">0.82</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-cloudOpacity" min="0.10" max="1.00" step="0.02" value="0.82">
                    </div>
                    <div class="ls-color-row">
                        <span>Cloud Tint</span>
                        <div class="ls-color-right">
                            <span class="ls-color-hex" id="hex-cloudColor">#ffffff</span>
                            <input type="color" class="ls-color-input" id="input-cloudColor" value="#ffffff">
                        </div>
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Cloud Altitude Y</span>
                            <span class="ls-val" id="val-cloudAltitude">128</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-cloudAltitude" min="64" max="192" step="4" value="128">
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row">
                            <span>Night Stars Brightness</span>
                            <span class="ls-val" id="val-starBrightness">1.00x</span>
                        </div>
                        <input type="range" class="ls-input-range" id="input-starBrightness" min="0.00" max="2.50" step="0.05" value="1.00">
                    </div>
                    <div class="ls-row">
                        <div class="ls-label-row"><span>Weather Mode</span></div>
                        <div class="ls-btn-group" id="weather-buttons">
                            <button class="ls-group-btn active" data-weather="clear">☀️ Clear</button>
                            <button class="ls-group-btn" data-weather="rain">🌧️ Rain</button>
                            <button class="ls-group-btn" data-weather="thunder">⚡ Thunder</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 7. Presets -->
            <div class="ls-accordion" id="sec-presets">
                <div class="ls-accordion-header">
                    <span>🎨 Lighting Presets</span>
                    <span class="ls-accordion-arrow">▼</span>
                </div>
                <div class="ls-accordion-content">
                    <div class="ls-presets">
                        <button class="ls-preset-btn" id="preset-radiant">☀️ Modern 1.20 Day</button>
                        <button class="ls-preset-btn" id="preset-mc">⛏️ Classic Beta 1.7</button>
                        <button class="ls-preset-btn" id="preset-sunset">🌅 Golden Sunset</button>
                        <button class="ls-preset-btn" id="preset-night">🌙 Moody Midnight</button>
                        <button class="ls-preset-btn" id="preset-campfire">🕯️ Cozy Campfire</button>
                        <button class="ls-preset-btn" id="preset-horror">👻 Deep Horror</button>
                        <button class="ls-preset-btn" id="preset-desert">🏜️ Desert High Noon</button>
                        <button class="ls-preset-btn" id="preset-superbright">⚡ Extra Bright</button>
                        <button class="ls-preset-btn" style="grid-column: span 2;" id="preset-reset">🔄 Reset to Defaults</button>
                    </div>
                </div>
            </div>

            <!-- 8. Export Config -->
            <div class="ls-accordion" id="sec-export">
                <div class="ls-accordion-header">
                    <span>📋 Export & Save Config</span>
                    <span class="ls-accordion-arrow">▼</span>
                </div>
                <div class="ls-accordion-content">
                    <button class="ls-copy-btn" id="ls-copy-btn">📋 Copy Config JSON</button>
                    <textarea class="ls-json-box" id="ls-json-box" readonly></textarea>
                    <div class="ls-note">Slide to tune any setting. Click "Copy Config JSON" and paste it in chat so Antigravity can bake it as the permanent default!</div>
                </div>
            </div>

        </div>
    `;
    container.appendChild(panel);
    document.body.appendChild(container);

    // Accordion Toggle Handling
    panel.querySelectorAll('.ls-accordion-header').forEach(hdr => {
        hdr.addEventListener('click', () => {
            hdr.parentElement.classList.toggle('collapsed');
        });
    });

    // Elements Lookup
    const inputs = {
        // Celestial
        timeOfDay: panel.querySelector('#input-timeOfDay'),
        freezeTime: panel.querySelector('#input-freezeTime'),
        dayLength: panel.querySelector('#input-dayLength'),
        sunTilt: panel.querySelector('#input-sunTilt'),
        sunIntensity: panel.querySelector('#input-sunIntensity'),
        sunColor: panel.querySelector('#input-sunColor'),
        moonIntensity: panel.querySelector('#input-moonIntensity'),
        moonColor: panel.querySelector('#input-moonColor'),
        celestialScale: panel.querySelector('#input-celestialScale'),

        // Ambient & Brightness
        ambIntensity: panel.querySelector('#input-ambIntensity'),
        ambColor: panel.querySelector('#input-ambColor'),
        brightnessMultiplier: panel.querySelector('#input-brightnessMultiplier'),

        // Caves
        caveFloorAmb: panel.querySelector('#input-caveFloorAmb'),
        caveFogDensity: panel.querySelector('#input-caveFogDensity'),

        // Sky & Atmosphere
        skyTopColor: panel.querySelector('#input-skyTopColor'),
        skyHorizonColor: panel.querySelector('#input-skyHorizonColor'),
        skyBottomColor: panel.querySelector('#input-skyBottomColor'),
        skyExponent: panel.querySelector('#input-skyExponent'),
        sunGlowIntensity: panel.querySelector('#input-sunGlowIntensity'),
        sunGlowColor: panel.querySelector('#input-sunGlowColor'),
        fogDensity: panel.querySelector('#input-fogDensity'),
        fogMatchHorizon: panel.querySelector('#input-fogMatchHorizon'),
        customFogColor: panel.querySelector('#input-customFogColor'),

        // Torches
        torchIntensity: panel.querySelector('#input-torchIntensity'),
        torchDistance: panel.querySelector('#input-torchDistance'),
        torchColor: panel.querySelector('#input-torchColor'),
        torchFlicker: panel.querySelector('#input-torchFlicker'),

        // Clouds & Stars
        cloudVisible: panel.querySelector('#input-cloudVisible'),
        cloudOpacity: panel.querySelector('#input-cloudOpacity'),
        cloudColor: panel.querySelector('#input-cloudColor'),
        cloudAltitude: panel.querySelector('#input-cloudAltitude'),
        starBrightness: panel.querySelector('#input-starBrightness')
    };

    const labels = {
        timeOfDay: panel.querySelector('#val-timeOfDay'),
        dayLength: panel.querySelector('#val-dayLength'),
        sunTilt: panel.querySelector('#val-sunTilt'),
        sunIntensity: panel.querySelector('#val-sunIntensity'),
        moonIntensity: panel.querySelector('#val-moonIntensity'),
        celestialScale: panel.querySelector('#val-celestialScale'),
        ambIntensity: panel.querySelector('#val-ambIntensity'),
        brightnessMultiplier: panel.querySelector('#val-brightnessMultiplier'),
        caveFloorAmb: panel.querySelector('#val-caveFloorAmb'),
        caveFogDensity: panel.querySelector('#val-caveFogDensity'),
        skyExponent: panel.querySelector('#val-skyExponent'),
        sunGlowIntensity: panel.querySelector('#val-sunGlowIntensity'),
        fogDensity: panel.querySelector('#val-fogDensity'),
        torchIntensity: panel.querySelector('#val-torchIntensity'),
        torchDistance: panel.querySelector('#val-torchDistance'),
        torchFlicker: panel.querySelector('#val-torchFlicker'),
        cloudOpacity: panel.querySelector('#val-cloudOpacity'),
        cloudAltitude: panel.querySelector('#val-cloudAltitude'),
        starBrightness: panel.querySelector('#val-starBrightness')
    };

    const hexLabels = {
        sunColor: panel.querySelector('#hex-sunColor'),
        moonColor: panel.querySelector('#hex-moonColor'),
        ambColor: panel.querySelector('#hex-ambColor'),
        skyTopColor: panel.querySelector('#hex-skyTopColor'),
        skyHorizonColor: panel.querySelector('#hex-skyHorizonColor'),
        skyBottomColor: panel.querySelector('#hex-skyBottomColor'),
        sunGlowColor: panel.querySelector('#hex-sunGlowColor'),
        customFogColor: panel.querySelector('#hex-customFogColor'),
        torchColor: panel.querySelector('#hex-torchColor'),
        cloudColor: panel.querySelector('#hex-cloudColor')
    };

    let currentWeather = 'clear';

    function getTimeLabel(t) {
        const totalMinutes = Math.floor(t * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayH = hours % 12 === 0 ? 12 : hours % 12;
        const displayM = mins < 10 ? '0' + mins : mins;
        let desc = '';
        if (t >= 0.23 && t <= 0.27) desc = ' (Sunrise)';
        else if (t >= 0.48 && t <= 0.52) desc = ' (Noon)';
        else if (t >= 0.73 && t <= 0.77) desc = ' (Sunset)';
        else if (t <= 0.05 || t >= 0.95) desc = ' (Midnight)';
        return `${t.toFixed(2)} (${displayH}:${displayM} ${ampm}${desc})`;
    }

    function updateConfig() {
        const cfg = {
            active: true,
            freezeTime: inputs.freezeTime.checked,
            timeOfDay: parseFloat(inputs.timeOfDay.value),
            dayLength: parseFloat(inputs.dayLength.value),
            sunTilt: parseFloat(inputs.sunTilt.value),
            sunIntensity: parseFloat(inputs.sunIntensity.value),
            sunColor: inputs.sunColor.value,
            moonIntensity: parseFloat(inputs.moonIntensity.value),
            moonColor: inputs.moonColor.value,
            celestialScale: parseFloat(inputs.celestialScale.value),

            ambIntensity: parseFloat(inputs.ambIntensity.value),
            ambColor: inputs.ambColor.value,
            brightnessMultiplier: parseFloat(inputs.brightnessMultiplier.value),

            caveFloorAmb: parseFloat(inputs.caveFloorAmb.value),
            caveFogDensity: parseFloat(inputs.caveFogDensity.value),

            skyTopColor: inputs.skyTopColor.value,
            skyHorizonColor: inputs.skyHorizonColor.value,
            skyBottomColor: inputs.skyBottomColor.value,
            skyExponent: parseFloat(inputs.skyExponent.value),
            sunGlowIntensity: parseFloat(inputs.sunGlowIntensity.value),
            sunGlowColor: inputs.sunGlowColor.value,

            fogDensity: parseFloat(inputs.fogDensity.value),
            fogMatchHorizon: inputs.fogMatchHorizon.checked,
            customFogColor: inputs.customFogColor.value,

            torchIntensity: parseFloat(inputs.torchIntensity.value),
            torchDistance: parseFloat(inputs.torchDistance.value),
            torchColor: inputs.torchColor.value,
            torchFlicker: parseFloat(inputs.torchFlicker.value),

            cloudVisible: inputs.cloudVisible.checked,
            cloudOpacity: parseFloat(inputs.cloudOpacity.value),
            cloudColor: inputs.cloudColor.value,
            cloudAltitude: parseFloat(inputs.cloudAltitude.value),
            starBrightness: parseFloat(inputs.starBrightness.value),
            weatherForce: currentWeather
        };

        window._customLightingConfig = cfg;

        // Update labels
        labels.timeOfDay.textContent = getTimeLabel(cfg.timeOfDay);
        labels.dayLength.textContent = `${cfg.dayLength}s`;
        labels.sunTilt.textContent = cfg.sunTilt.toString();
        labels.sunIntensity.textContent = cfg.sunIntensity.toFixed(2);
        labels.moonIntensity.textContent = cfg.moonIntensity.toFixed(2);
        labels.celestialScale.textContent = `${cfg.celestialScale.toFixed(1)}x`;
        labels.ambIntensity.textContent = cfg.ambIntensity.toFixed(2);
        labels.brightnessMultiplier.textContent = `${cfg.brightnessMultiplier.toFixed(2)}x`;
        labels.caveFloorAmb.textContent = cfg.caveFloorAmb.toFixed(2);
        labels.caveFogDensity.textContent = cfg.caveFogDensity.toFixed(3);
        labels.skyExponent.textContent = cfg.skyExponent.toFixed(2);
        labels.sunGlowIntensity.textContent = cfg.sunGlowIntensity.toFixed(2);
        labels.fogDensity.textContent = cfg.fogDensity.toFixed(4);
        labels.torchIntensity.textContent = cfg.torchIntensity.toFixed(1);
        labels.torchDistance.textContent = `${cfg.torchDistance}m`;
        labels.torchFlicker.textContent = cfg.torchFlicker.toFixed(2);
        labels.cloudOpacity.textContent = cfg.cloudOpacity.toFixed(2);
        labels.cloudAltitude.textContent = cfg.cloudAltitude.toString();
        labels.starBrightness.textContent = `${cfg.starBrightness.toFixed(2)}x`;

        // Update hex indicators
        for (const [key, el] of Object.entries(hexLabels)) {
            if (el && cfg[key]) el.textContent = cfg[key];
        }

        const jsonBox = panel.querySelector('#ls-json-box');
        if (jsonBox) jsonBox.value = JSON.stringify(cfg, null, 2);
    }

    function applyPreset(p) {
        for (const [k, v] of Object.entries(p)) {
            if (inputs[k] !== undefined) {
                if (inputs[k].type === 'checkbox') {
                    inputs[k].checked = v;
                } else {
                    inputs[k].value = v;
                }
            }
        }
        if (p.weatherForce) {
            currentWeather = p.weatherForce;
            panel.querySelectorAll('.ls-group-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.weather === currentWeather);
            });
        }
        updateConfig();
    }

    // Attach listeners
    Object.values(inputs).forEach(input => {
        if (!input) return;
        input.addEventListener('input', updateConfig);
        input.addEventListener('change', updateConfig);
    });

    // Weather buttons
    panel.querySelectorAll('#weather-buttons button').forEach(btn => {
        btn.addEventListener('click', () => {
            panel.querySelectorAll('#weather-buttons button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWeather = btn.dataset.weather;
            updateConfig();
        });
    });

    // Toggle and Close
    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('minimized');
    });

    panel.querySelector('#ls-close-btn').addEventListener('click', () => {
        panel.classList.add('minimized');
    });

    // Copy Button
    const copyBtn = panel.querySelector('#ls-copy-btn');
    const jsonBox = panel.querySelector('#ls-json-box');

    copyBtn.addEventListener('click', () => {
        updateConfig();
        const str = jsonBox.value;
        navigator.clipboard.writeText(str).then(() => {
            const oldText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied to Clipboard!';
            copyBtn.style.background = '#1f6feb';
            setTimeout(() => {
                copyBtn.textContent = oldText;
                copyBtn.style.background = '#238636';
            }, 2000);
        }).catch(() => {
            jsonBox.select();
            document.execCommand('copy');
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy Config JSON'; }, 2000);
        });
    });

    jsonBox.addEventListener('click', () => jsonBox.select());

    // Presets
    panel.querySelector('#preset-radiant').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.50,
            freezeTime: true,
            ambIntensity: 0.78,
            sunIntensity: 0.68,
            ambColor: "#dce5f4",
            sunColor: "#fff8ea",
            skyTopColor: "#78a7ff",
            skyHorizonColor: "#c0d8ff",
            skyBottomColor: "#182030",
            skyExponent: 1.15,
            caveFloorAmb: 0.22,
            sunTilt: 32,
            torchIntensity: 8.5,
            torchColor: "#ff7711",
            torchDistance: 60,
            cloudOpacity: 0.85,
            cloudColor: "#ffffff",
            cloudAltitude: 128,
            fogDensity: 0.0028,
            weatherForce: 'clear'
        });
    });

    panel.querySelector('#preset-mc').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.50,
            freezeTime: true,
            ambIntensity: 0.60,
            sunIntensity: 0.80,
            ambColor: "#b0c4de",
            sunColor: "#ffffff",
            skyTopColor: "#5b8cff",
            skyHorizonColor: "#9ec4ff",
            skyBottomColor: "#000000",
            skyExponent: 1.00,
            caveFloorAmb: 0.14,
            sunTilt: 45,
            torchIntensity: 7.0,
            torchColor: "#ff8800",
            torchDistance: 50,
            fogDensity: 0.0040,
            weatherForce: 'clear'
        });
    });

    panel.querySelector('#preset-sunset').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.75,
            freezeTime: true,
            ambIntensity: 0.62,
            sunIntensity: 0.45,
            ambColor: "#ffc8a0",
            sunColor: "#ff8844",
            skyTopColor: "#58648c",
            skyHorizonColor: "#ff9955",
            skyBottomColor: "#1a1220",
            skyExponent: 1.30,
            sunGlowIntensity: 1.10,
            sunGlowColor: "#ff6a22",
            caveFloorAmb: 0.16,
            sunTilt: 20,
            torchIntensity: 10.0,
            torchColor: "#ff6600",
            fogDensity: 0.0035,
            cloudColor: "#ffbaa0",
            cloudOpacity: 0.90,
            weatherForce: 'clear'
        });
    });

    panel.querySelector('#preset-night').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.00,
            freezeTime: true,
            ambIntensity: 0.18,
            sunIntensity: 0.00,
            moonIntensity: 0.28,
            moonColor: "#5577aa",
            ambColor: "#202a40",
            skyTopColor: "#060914",
            skyHorizonColor: "#0f1628",
            skyBottomColor: "#020408",
            skyExponent: 1.20,
            caveFloorAmb: 0.12,
            torchIntensity: 12.0,
            torchColor: "#ff6a00",
            torchDistance: 70,
            starBrightness: 1.5,
            cloudOpacity: 0.50,
            cloudColor: "#404c64",
            fogDensity: 0.0045,
            weatherForce: 'clear'
        });
    });

    panel.querySelector('#preset-campfire').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.78,
            freezeTime: true,
            ambIntensity: 0.35,
            sunIntensity: 0.10,
            ambColor: "#403848",
            skyTopColor: "#1c2238",
            skyHorizonColor: "#5a4858",
            skyBottomColor: "#0a0c14",
            caveFloorAmb: 0.10,
            torchIntensity: 15.0,
            torchColor: "#ff8c1a",
            torchDistance: 80,
            torchFlicker: 0.35,
            starBrightness: 1.2,
            fogDensity: 0.0035,
            weatherForce: 'clear'
        });
    });

    panel.querySelector('#preset-horror').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.97,
            freezeTime: true,
            ambIntensity: 0.10,
            sunIntensity: 0.00,
            moonIntensity: 0.08,
            moonColor: "#2a3548",
            ambColor: "#0d111a",
            skyTopColor: "#020306",
            skyHorizonColor: "#080c14",
            skyBottomColor: "#000000",
            caveFloorAmb: 0.00,
            caveFogDensity: 0.035,
            torchIntensity: 6.5,
            torchDistance: 35,
            torchColor: "#ff5500",
            torchFlicker: 0.40,
            fogDensity: 0.0090,
            fogMatchHorizon: false,
            customFogColor: "#080c14",
            cloudOpacity: 0.30,
            starBrightness: 0.4,
            weatherForce: 'thunder'
        });
    });

    panel.querySelector('#preset-desert').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.50,
            freezeTime: true,
            ambIntensity: 0.88,
            sunIntensity: 0.85,
            ambColor: "#fff4e0",
            sunColor: "#fff2d0",
            skyTopColor: "#6ea4ff",
            skyHorizonColor: "#e6ecf8",
            skyBottomColor: "#2a2218",
            skyExponent: 1.05,
            caveFloorAmb: 0.25,
            sunTilt: 10,
            fogDensity: 0.0020,
            cloudOpacity: 0.40,
            cloudColor: "#ffffff",
            cloudAltitude: 140,
            weatherForce: 'clear'
        });
    });

    panel.querySelector('#preset-superbright').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.50,
            freezeTime: true,
            ambIntensity: 1.20,
            sunIntensity: 0.90,
            ambColor: "#ffffff",
            sunColor: "#ffffff",
            skyTopColor: "#78a7ff",
            skyHorizonColor: "#c0d8ff",
            skyBottomColor: "#202838",
            caveFloorAmb: 0.50,
            brightnessMultiplier: 1.30,
            sunTilt: 32,
            torchIntensity: 10.0,
            fogDensity: 0.0010,
            cloudOpacity: 0.80,
            weatherForce: 'clear'
        });
    });

    panel.querySelector('#preset-reset').addEventListener('click', () => {
        applyPreset(defaultConfig);
    });

    // Initialize display values
    updateConfig();
}
