const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

if (!code.includes('postprocessing.min.js')) {
    code = code.replace(/<!-- Three\.js Addons -->/, `<!-- Three.js Addons -->\n    <script src="https://cdn.jsdelivr.net/npm/postprocessing@6.30.2/build/postprocessing.min.js"></script>`);
    fs.writeFileSync('index.html', code);
}
