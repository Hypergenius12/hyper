const fs = require('fs');

function fix(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\(playerPos \? playerPos\.y > WATER_LEVEL \+ 45 : \(typeof y !== "undefined" \? y > WATER_LEVEL \+ 45 : false\)\)/g, '(typeof y !== "undefined" ? y > WATER_LEVEL + 45 : (typeof playerPos !== "undefined" ? playerPos.y > WATER_LEVEL + 45 : false))');
    fs.writeFileSync(file, content);
}

fix('js/audio.js');
fix('js/fish.js');
fix('js/sky.js');
