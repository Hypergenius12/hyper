const fs = require('fs');
let code = fs.readFileSync('js/terrain.js', 'utf8');

const oldFunc = `window.getPlayerGroundHeight = function(px, py, pz) {
    let checkY = py + 2; 
    while(getDensity(px, checkY, pz) > 0 && checkY < 150) {
        checkY += 1;
    }
    while(checkY > -100) {
        if (getDensity(px, checkY, pz) > 0) {
            return checkY;
        }
        checkY -= 0.5;
    }
    return getExactHeight(px, pz);
}`;

const newFunc = `window.getPlayerGroundHeight = function(px, py, pz) {
    let checkY = py + 2; 
    // Only search up a small amount so we don't teleport to the top of mountains
    let stepsUp = 0;
    while(getDensity(px, checkY, pz) > 0 && stepsUp < 5) {
        checkY += 1;
        stepsUp++;
    }
    
    while(checkY > -100) {
        if (getDensity(px, checkY, pz) > 0) {
            // Found ground! But wait, if this ground is WAY higher than where we were, we shouldn't snap up.
            // But since checkY started at py+2 and only went up to py+7, the max step up is 7 units.
            return checkY;
        }
        checkY -= 0.5;
    }
    return getExactHeight(px, pz);
}`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('js/terrain.js', code);
