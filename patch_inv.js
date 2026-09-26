const fs = require('fs');
let geoCss = fs.readFileSync('slopcraft 3D/css/geometric.css', 'utf8');

geoCss = geoCss.replace(/\.inv-wrapper \{[\s\S]*?box-shadow: 0 0 20px rgba\(0,0,0,0.8\);\n\}/, `.inv-wrapper {
    display: flex;
    gap: 20px;
    background: #c6c6c6;
    padding: 20px;
    border: 2px solid #000;
    box-shadow: inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #555555;
}`);

// Also fix chest inventory UI
geoCss = geoCss.replace(/\#chest-ui \{[\s\S]*?\}/, `#chest-ui {
    background: #c6c6c6;
    padding: 20px;
    border: 2px solid #000;
    box-shadow: inset 2px 2px 0px 0px #ffffff, inset -2px -2px 0px 0px #555555;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
}`);

// Check if #chest-ui exists or if we need to find it differently
fs.writeFileSync('slopcraft 3D/css/geometric.css', geoCss);
