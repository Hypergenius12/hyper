const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/entities.js', 'utf8');

code = code.replace(/this\._updateHealthBar\(\);\n/g, "");

fs.writeFileSync('slopcraft 3D/js/entities.js', code);
