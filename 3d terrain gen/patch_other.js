const fs = require('fs');

function removeMountain(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Specifically target the exact lines in the grep output
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('let mountainBiome = simplex.noise2D(') ||
            lines[i].includes('mountainBiome = (mountainBiome + 1) / 2;') ||
            lines[i].includes('const isMountain = mountainBiome > 0.5')) {
            continue; // Skip these lines
        }
        newLines.push(lines[i]);
    }
    
    fs.writeFileSync(file, newLines.join('\n'));
}

removeMountain('js/audio.js');
removeMountain('js/fish.js');
removeMountain('js/sky.js');
