const fs = require('fs');

function fixMountain(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace all usages of isMountain with high altitude checks, or just add the const back
    // But since I deleted the line, let's just add `const isMountain = ...` where it was deleted.
    // Actually it's easier to just do a string replacement.
    content = content.replace(/isMountain/g, '(playerPos ? playerPos.y > WATER_LEVEL + 45 : (typeof y !== "undefined" ? y > WATER_LEVEL + 45 : false))');
    
    fs.writeFileSync(file, content);
}

fixMountain('js/audio.js');
fixMountain('js/fish.js');
fixMountain('js/sky.js');
