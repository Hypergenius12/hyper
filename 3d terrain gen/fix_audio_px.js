const fs = require('fs');
let code = fs.readFileSync('js/audio.js', 'utf8');

// The block we injected starts with:
// // Update Spatial Audio Listener
// and ends with:
// this.windFilter.frequency.value = 200 + targetWind * 800 + Math.sin(windTime) * 100;

const startToken = '// Update Spatial Audio Listener';
const endToken = 'this.windFilter.frequency.value = 200 + targetWind * 800 + Math.sin(windTime) * 100;';

const startIndex = code.indexOf(startToken);
const endIndex = code.indexOf(endToken) + endToken.length;

if (startIndex !== -1 && endIndex !== -1) {
    const injectedBlock = code.substring(startIndex, endIndex);
    // Remove it from its current position
    code = code.replace(injectedBlock, '');
    
    // We want to insert it AFTER px and pz are defined
    const insertAfter = 'const pz = player.yawObject.position.z;\n';
    code = code.replace(insertAfter, insertAfter + '\n        ' + injectedBlock + '\n');
    
    fs.writeFileSync('js/audio.js', code);
}
