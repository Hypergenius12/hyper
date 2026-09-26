const fs = require('fs');
let code = fs.readFileSync('js/player.js', 'utf8');

code = code.replace(/scene\.fog\.color\.setHex\(0x1a4a6b\);/, 'scene.fog.color.setHex(0x006677);');
code = code.replace(/scene\.fog\.density = 0\.03;/, 'scene.fog.density = 0.04;');

fs.writeFileSync('js/player.js', code);
