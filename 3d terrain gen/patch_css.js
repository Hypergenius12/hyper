const fs = require('fs');
let code = fs.readFileSync('css/style.css', 'utf8');

if (!code.includes('@keyframes caustics')) {
    code = code.replace('#underwater-overlay {', 
`@keyframes caustics {
    0% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
}
#underwater-overlay {
    background-image: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at bottom right, rgba(255,255,255,0.1) 0%, transparent 50%);
    background-size: 200% 200%;
    animation: caustics 10s ease-in-out infinite;
    mix-blend-mode: overlay;
    box-shadow: inset 0 0 100px rgba(0, 100, 150, 0.8);`);
    fs.writeFileSync('css/style.css', code);
}
