const fs = require('fs');
let styleCss = fs.readFileSync('slopcraft 3D/css/style.css', 'utf8');

styleCss = styleCss.replace(/\.inv-slot \{[\s\S]*?position: relative;\n\}/, `.inv-slot {
    width: 44px;
    height: 44px;
    background: #8b8b8b;
    border: 2px solid;
    border-color: #373737 #ffffff #ffffff #373737;
    position: relative;
    cursor: pointer;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
}`);

styleCss = styleCss.replace(/\.inventory-grid \.inv-slot:nth-child\(-n\+9\) \{[\s\S]*?margin-bottom: 8px;\n\}/, `.inventory-grid .inv-slot:nth-child(-n+9) {
    margin-bottom: 8px;
}`);

styleCss = styleCss.replace(/\.inv-slot:hover \{[\s\S]*?border-color: #ffffff;\n\}/, `.inv-slot:hover {
    background: #9d9d9d;
}`);

styleCss = styleCss.replace(/\.inv-slot\.selected \{[\s\S]*?background: rgba\(255, 255, 255, 0.2\);\n\}/, `.inv-slot.selected {
    border: 2px solid #ffffff;
    box-shadow: inset 0 0 0 2px #c6c6c6;
}`);

fs.writeFileSync('slopcraft 3D/css/style.css', styleCss);
