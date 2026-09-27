const fs = require('fs');

let styleCss = fs.readFileSync('slopcraft 3D/css/style.css', 'utf8');

// Replace start screen (exact match instead of regex)
const startScreenOld = `#start-screen {
    position: fixed;
    inset: 0;
    z-index: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at center, #1b1b26 0%, #0a0a0f 100%);
}`;
const startScreenNew = `#start-screen {
    position: fixed;
    inset: 0;
    z-index: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    background: url('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.16.5/assets/minecraft/textures/gui/options_background.png') repeat;
    background-size: 64px 64px;
}`;
styleCss = styleCss.replace(startScreenOld, startScreenNew);

const pauseScreenOld = `#pause-screen {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
}`;
const pauseScreenNew = `#pause-screen {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
}`;
styleCss = styleCss.replace(pauseScreenOld, pauseScreenNew);

const menuBtnOld = `.menu-btn {
    display: block;
    width: 100%;
    padding: 12px 20px;
    margin-bottom: 8px;
    background: #1a1a24;
    border: 2px solid #333344;
    color: var(--text-primary);
    font-family: var(--font-main);
    font-size: 15px;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s;
}`;
const menuBtnNew = `.menu-btn {
    display: block;
    width: 100%;
    padding: 12px 20px;
    margin-bottom: 8px;
    background: #c6c6c6;
    color: #000;
    border: 2px solid #000;
    box-shadow: inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #555555;
    font-size: 15px;
    font-weight: bold;
    font-family: 'Minecraft', 'JetBrains Mono', monospace;
    cursor: pointer;
    text-shadow: none;
    border-radius: 0;
    text-align: center;
}`;
styleCss = styleCss.replace(menuBtnOld, menuBtnNew);

styleCss = styleCss.replace(/\.menu-btn:hover \{[\s\S]*?\}/, `.menu-btn:hover {
    background: #a8a8a8;
    box-shadow: inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #555555;
}`);

styleCss = styleCss.replace(/\.menu-btn:active \{[\s\S]*?\}/, `.menu-btn:active {
    box-shadow: inset 2px 2px 0px 0px #555555, inset -2px -2px 0px 0px #ffffff;
    background: #c6c6c6;
}`);

// Add overrides at the end
styleCss += `

/* Minecraft UI Text Overrides */
.inv-wrapper, .window-panel, .crafting-col {
    color: #3f3f3f !important;
}
.inv-wrapper div, .window-panel div {
    color: #3f3f3f !important;
    text-shadow: none !important;
    opacity: 1 !important;
}
.inv-wrapper .item-count, #geometric-hotbar .item-count {
    color: white !important;
    text-shadow: 1px 1px 0 #000 !important;
}
.crafting-col button {
    background: #c6c6c6 !important;
    border: 2px solid #000 !important;
    color: #000 !important;
    box-shadow: inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #555555 !important;
}
.crafting-col button:active {
    box-shadow: inset 2px 2px 0px 0px #555555, inset -2px -2px 0px 0px #ffffff !important;
}
`;

fs.writeFileSync('slopcraft 3D/css/style.css', styleCss);
