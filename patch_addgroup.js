const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/engine.js', 'utf8');

const regex = /        geometry\.addGroup\(groupOffset, glowTransparentIndexCount, 6\); groupOffset \+= glowTransparentIndexCount;/g;
const replacement = "        geometry.addGroup(groupOffset, glowTransparentIndexCount, 6); groupOffset += glowTransparentIndexCount;\n        geometry.addGroup(groupOffset, slightGlowOpaqueIndexCount, 7); groupOffset += slightGlowOpaqueIndexCount;\n        geometry.addGroup(groupOffset, slightGlowTransparentIndexCount, 8); groupOffset += slightGlowTransparentIndexCount;";

code = code.replace(regex, replacement);

fs.writeFileSync('slopcraft 3D/js/engine.js', code);
