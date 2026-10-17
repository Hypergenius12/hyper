// ============================================
// lighting-studio.js — Live In-Game Lighting Tuner
// ============================================

export function initLightingStudio() {
    // Prevent duplicate injection
    if (document.getElementById('lighting-studio-container')) return;

    const defaultConfig = {
        active: true,
        freezeTime: true,
        timeOfDay: 0.50,
        ambIntensity: 0.75,
        sunIntensity: 0.65,
        ambColor: "#dce5f4",
        sunColor: "#fff8ea",
        skyTopColor: "#78a7ff",
        skyHorizonColor: "#c0d8ff",
        skyBottomColor: "#182030",
        caveFloorAmb: 0.20
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
            background: rgba(18, 24, 38, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 8px;
            color: #fff;
            padding: 8px 14px;
            font-family: 'Space Grotesk', system-ui, sans-serif;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            gap: 8px;
            user-select: none;
            transition: all 0.2s ease;
        }
        #lighting-studio-toggle:hover {
            background: rgba(30, 40, 60, 0.95);
            border-color: #58a6ff;
            transform: translateY(-1px);
        }
        #lighting-studio-panel {
            position: fixed;
            top: 56px;
            right: 14px;
            width: 320px;
            max-height: calc(100vh - 72px);
            background: rgba(14, 18, 28, 0.92);
            backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            box-shadow: 0 12px 36px rgba(0,0,0,0.6);
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
            gap: 12px;
        }
        .ls-section-title {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #7d8590;
            font-weight: 700;
            margin-top: 4px;
            margin-bottom: 2px;
        }
        .ls-row {
            display: flex;
            flex-direction: column;
            gap: 4px;
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
        }
        .ls-color-input {
            width: 32px;
            height: 24px;
            border: 1px solid rgba(255,255,255,0.2);
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
        }
        .ls-presets {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-top: 4px;
        }
        .ls-preset-btn {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
            color: #c9d1d9;
            padding: 6px 8px;
            border-radius: 6px;
            font-size: 11px;
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
            margin-top: 6px;
        }
        .ls-copy-btn:hover {
            background: #2ea043;
            box-shadow: 0 0 12px rgba(46, 160, 67, 0.5);
        }
        .ls-json-box {
            width: 100%;
            height: 80px;
            background: rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 6px;
            color: #7ee787;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
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

    // Stop all clicks/touches from passing through to canvas/pointer lock
    ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'keydown', 'keyup', 'touchstart', 'touchend'].forEach(evt => {
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
            <span>🎨 Live Lighting Studio</span>
            <button class="ls-close-btn" id="ls-close-btn" title="Minimize Panel">✕</button>
        </div>
        <div class="ls-body">
            <div class="ls-section-title">Day/Night Cycle</div>
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

            <div class="ls-section-title">Intensity & Brightness</div>
            <div class="ls-row">
                <div class="ls-label-row">
                    <span>Ambient Light Intensity</span>
                    <span class="ls-val" id="val-ambIntensity">0.75</span>
                </div>
                <input type="range" class="ls-input-range" id="input-ambIntensity" min="0.10" max="2.50" step="0.01" value="0.75">
            </div>
            <div class="ls-row">
                <div class="ls-label-row">
                    <span>Sun Light Intensity</span>
                    <span class="ls-val" id="val-sunIntensity">0.65</span>
                </div>
                <input type="range" class="ls-input-range" id="input-sunIntensity" min="0.00" max="2.50" step="0.01" value="0.65">
            </div>
            <div class="ls-row">
                <div class="ls-label-row">
                    <span>Cave Darkness Floor</span>
                    <span class="ls-val" id="val-caveFloorAmb">0.20</span>
                </div>
                <input type="range" class="ls-input-range" id="input-caveFloorAmb" min="0.05" max="0.80" step="0.01" value="0.20">
            </div>

            <div class="ls-section-title">Colors & Sky</div>
            <div class="ls-color-row">
                <span>Ambient Light Tint</span>
                <input type="color" class="ls-color-input" id="input-ambColor" value="#dce5f4">
            </div>
            <div class="ls-color-row">
                <span>Sun Light Tint</span>
                <input type="color" class="ls-color-input" id="input-sunColor" value="#fff8ea">
            </div>
            <div class="ls-color-row">
                <span>Sky Zenith (Top)</span>
                <input type="color" class="ls-color-input" id="input-skyTopColor" value="#78a7ff">
            </div>
            <div class="ls-color-row">
                <span>Sky Horizon</span>
                <input type="color" class="ls-color-input" id="input-skyHorizonColor" value="#c0d8ff">
            </div>
            <div class="ls-color-row">
                <span>Sky Bottom / Void</span>
                <input type="color" class="ls-color-input" id="input-skyBottomColor" value="#182030">
            </div>

            <div class="ls-section-title">Quick Presets</div>
            <div class="ls-presets">
                <button class="ls-preset-btn" id="preset-radiant">☀️ Radiant Day</button>
                <button class="ls-preset-btn" id="preset-mc">⛏️ Classic MC</button>
                <button class="ls-preset-btn" id="preset-superbright">⚡ Extra Bright</button>
                <button class="ls-preset-btn" id="preset-sunset">🌅 Sunset</button>
                <button class="ls-preset-btn" id="preset-night">🌙 Night</button>
                <button class="ls-preset-btn" id="preset-reset">🔄 Reset</button>
            </div>

            <div class="ls-section-title">Export Config</div>
            <button class="ls-copy-btn" id="ls-copy-btn">📋 Copy Config JSON</button>
            <textarea class="ls-json-box" id="ls-json-box" readonly></textarea>
            <div class="ls-note">Slide to tune. Click "Copy Config JSON" and paste it in chat so Antigravity can bake it as the permanent default!</div>
        </div>
    `;
    container.appendChild(panel);
    document.body.appendChild(container);

    // Elements
    const inputTimeOfDay = panel.querySelector('#input-timeOfDay');
    const valTimeOfDay = panel.querySelector('#val-timeOfDay');
    const inputFreezeTime = panel.querySelector('#input-freezeTime');

    const inputAmbIntensity = panel.querySelector('#input-ambIntensity');
    const valAmbIntensity = panel.querySelector('#val-ambIntensity');

    const inputSunIntensity = panel.querySelector('#input-sunIntensity');
    const valSunIntensity = panel.querySelector('#val-sunIntensity');

    const inputCaveFloorAmb = panel.querySelector('#input-caveFloorAmb');
    const valCaveFloorAmb = panel.querySelector('#val-caveFloorAmb');

    const inputAmbColor = panel.querySelector('#input-ambColor');
    const inputSunColor = panel.querySelector('#input-sunColor');
    const inputSkyTopColor = panel.querySelector('#input-skyTopColor');
    const inputSkyHorizonColor = panel.querySelector('#input-skyHorizonColor');
    const inputSkyBottomColor = panel.querySelector('#input-skyBottomColor');

    const copyBtn = panel.querySelector('#ls-copy-btn');
    const jsonBox = panel.querySelector('#ls-json-box');
    const closeBtn = panel.querySelector('#ls-close-btn');

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
            freezeTime: inputFreezeTime.checked,
            timeOfDay: parseFloat(inputTimeOfDay.value),
            ambIntensity: parseFloat(inputAmbIntensity.value),
            sunIntensity: parseFloat(inputSunIntensity.value),
            ambColor: inputAmbColor.value,
            sunColor: inputSunColor.value,
            skyTopColor: inputSkyTopColor.value,
            skyHorizonColor: inputSkyHorizonColor.value,
            skyBottomColor: inputSkyBottomColor.value,
            caveFloorAmb: parseFloat(inputCaveFloorAmb.value)
        };

        window._customLightingConfig = cfg;

        valTimeOfDay.textContent = getTimeLabel(cfg.timeOfDay);
        valAmbIntensity.textContent = cfg.ambIntensity.toFixed(2);
        valSunIntensity.textContent = cfg.sunIntensity.toFixed(2);
        valCaveFloorAmb.textContent = cfg.caveFloorAmb.toFixed(2);

        jsonBox.value = JSON.stringify(cfg, null, 2);
    }

    function applyPreset(preset) {
        if (preset.timeOfDay !== undefined) inputTimeOfDay.value = preset.timeOfDay;
        if (preset.freezeTime !== undefined) inputFreezeTime.checked = preset.freezeTime;
        if (preset.ambIntensity !== undefined) inputAmbIntensity.value = preset.ambIntensity;
        if (preset.sunIntensity !== undefined) inputSunIntensity.value = preset.sunIntensity;
        if (preset.ambColor !== undefined) inputAmbColor.value = preset.ambColor;
        if (preset.sunColor !== undefined) inputSunColor.value = preset.sunColor;
        if (preset.skyTopColor !== undefined) inputSkyTopColor.value = preset.skyTopColor;
        if (preset.skyHorizonColor !== undefined) inputSkyHorizonColor.value = preset.skyHorizonColor;
        if (preset.skyBottomColor !== undefined) inputSkyBottomColor.value = preset.skyBottomColor;
        if (preset.caveFloorAmb !== undefined) inputCaveFloorAmb.value = preset.caveFloorAmb;
        updateConfig();
    }

    // Event Listeners
    [inputTimeOfDay, inputFreezeTime, inputAmbIntensity, inputSunIntensity, inputCaveFloorAmb, inputAmbColor, inputSunColor, inputSkyTopColor, inputSkyHorizonColor, inputSkyBottomColor].forEach(el => {
        el.addEventListener('input', updateConfig);
        el.addEventListener('change', updateConfig);
    });

    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('minimized');
    });

    closeBtn.addEventListener('click', () => {
        panel.classList.add('minimized');
    });

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
            ambIntensity: 0.75,
            sunIntensity: 0.65,
            ambColor: "#dce5f4",
            sunColor: "#fff8ea",
            skyTopColor: "#78a7ff",
            skyHorizonColor: "#c0d8ff",
            caveFloorAmb: 0.20
        });
    });

    panel.querySelector('#preset-mc').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.50,
            ambIntensity: 0.45,
            sunIntensity: 0.55,
            ambColor: "#dce5f4",
            sunColor: "#fff8ea",
            skyTopColor: "#78a7ff",
            skyHorizonColor: "#c0d8ff",
            caveFloorAmb: 0.16
        });
    });

    panel.querySelector('#preset-superbright').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.50,
            ambIntensity: 1.00,
            sunIntensity: 0.75,
            ambColor: "#e6efff",
            sunColor: "#ffffff",
            skyTopColor: "#6ea0ff",
            skyHorizonColor: "#c8e0ff",
            caveFloorAmb: 0.28
        });
    });

    panel.querySelector('#preset-sunset').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.75,
            ambIntensity: 0.55,
            sunIntensity: 0.35,
            ambColor: "#ffbe98",
            sunColor: "#f57838",
            skyTopColor: "#4e5878",
            skyHorizonColor: "#f08855",
            caveFloorAmb: 0.18
        });
    });

    panel.querySelector('#preset-night').addEventListener('click', () => {
        applyPreset({
            timeOfDay: 0.00,
            ambIntensity: 0.16,
            sunIntensity: 0.00,
            ambColor: "#2c3548",
            sunColor: "#aaccff",
            skyTopColor: "#080c18",
            skyHorizonColor: "#101626",
            caveFloorAmb: 0.12
        });
    });

    panel.querySelector('#preset-reset').addEventListener('click', () => {
        applyPreset(defaultConfig);
    });

    // Initialize initial state
    updateConfig();
}
