const fs = require('fs');

let geoCss = fs.readFileSync('slopcraft 3D/css/geometric.css', 'utf8');

// Replace geometric-hotbar
geoCss = geoCss.replace(/#geometric-hotbar \{[\s\S]*?z-index: 500;\n\}/, `#geometric-hotbar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #c6c6c6;
    padding: 6px;
    border: 2px solid #000;
    box-shadow: inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #555555;
    z-index: 500;
}`);

// Replace inv-slot
geoCss = geoCss.replace(/\.inv-slot \{[\s\S]*?box-sizing: border-box;\n\}/, `.inv-slot {
    width: 44px;
    height: 44px;
    background: #8b8b8b;
    border: 2px solid;
    border-color: #373737 #ffffff #ffffff #373737;
    position: relative;
    cursor: pointer;
    box-sizing: border-box;
}`);

geoCss = geoCss.replace(/\.inv-slot:hover \{[\s\S]*?\}/, `.inv-slot:hover {
    background: #9d9d9d;
}`);

geoCss = geoCss.replace(/\.inv-slot\.active \{[\s\S]*?\}/, `.inv-slot.active {
    border: 2px solid #ffffff;
    box-shadow: inset 0 0 0 2px #c6c6c6;
}`);

// Replace window panels
geoCss = geoCss.replace(/\.window-panel \{[\s\S]*?\}/, `.window-panel {
    background: #c6c6c6;
    border: 2px solid #000;
    box-shadow: inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #555555;
    color: #3f3f3f;
    padding: 20px;
    pointer-events: auto;
}`);

geoCss = geoCss.replace(/\.window-header \{[\s\S]*?\}/, `.window-header {
    font-size: 1.2rem;
    color: #3f3f3f;
    border-bottom: none;
    margin-bottom: 15px;
    text-transform: none;
    text-align: left;
}`);

// Replace item-count styling
geoCss = geoCss.replace(/\.item-count \{[\s\S]*?\}/, `.item-count {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 14px;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 0 #000;
    font-family: 'Minecraft', 'JetBrains Mono', sans-serif;
    pointer-events: none;
}`);

fs.writeFileSync('slopcraft 3D/css/geometric.css', geoCss);

let styleCss = fs.readFileSync('slopcraft 3D/css/style.css', 'utf8');

// Replace start screen
styleCss = styleCss.replace(/\#start-screen \{[\s\S]*?justify-content: center;\n\}/, `#start-screen {
    position: fixed;
    inset: 0;
    z-index: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    background: url('https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.16.5/assets/minecraft/textures/gui/options_background.png') repeat;
    background-size: 64px 64px;
}`);

styleCss = styleCss.replace(/\#pause-screen \{[\s\S]*?justify-content: center;\n\}/, `#pause-screen {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
}`);

// Menu buttons
styleCss = styleCss.replace(/\.menu-btn \{[\s\S]*?cursor: pointer;\n\}/, `.menu-btn {
    background: #c6c6c6;
    color: #000;
    border: 2px solid #000;
    box-shadow: inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #555555;
    padding: 10px 20px;
    font-size: 1.1rem;
    font-family: 'Minecraft', 'JetBrains Mono', monospace;
    cursor: pointer;
    text-shadow: none;
    border-radius: 0;
}`);

styleCss = styleCss.replace(/\.menu-btn:hover \{[\s\S]*?\}/, `.menu-btn:hover {
    background: #a8a8a8;
    box-shadow: inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #555555;
}`);

styleCss = styleCss.replace(/\.menu-btn:active \{[\s\S]*?\}/, `.menu-btn:active {
    box-shadow: inset 2px 2px 0px 0px #555555, inset -2px -2px 0px 0px #ffffff;
    background: #c6c6c6;
}`);

fs.writeFileSync('slopcraft 3D/css/style.css', styleCss);
