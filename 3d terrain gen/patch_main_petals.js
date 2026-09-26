const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

if (!code.includes('window.petalManager =')) {
    code = code.replace(/window\.rainManager = new RainManager\(scene\);/, 'window.rainManager = new RainManager(scene);\n    window.petalManager = new PetalManager(scene);');
    code = code.replace(/if \(window\.rainManager\) window\.rainManager\.update\(delta, player\.getObject\(\)\.position\);/, 'if (window.rainManager) window.rainManager.update(delta, player.getObject().position);\n    if (window.petalManager) window.petalManager.update(delta, player.getObject().position);');
    fs.writeFileSync('js/main.js', code);
}
