const fs = require('fs');
let content = fs.readFileSync('js/noise.js', 'utf8');

// Remove mountainBiome block 1
content = content.replace(/\/\/ Increase frequency slightly so mountains are more frequent[\s\S]*?roughness = Math\.max\(roughness, 0\.5 \+ p \* 0\.5\); \n    \}/g, '');

// Remove extremeMultiplier and mountainBiome block 2
content = content.replace(/const tempCheck = temp;\n        let extremeMultiplier = 1\.0;[\s\S]*?extremeMultiplier = 1\.0 \+ Math\.pow\(finalP, 2\.0\) \* 12\.0; \n        \}/g, '');

// Fix extreme multiplier in height
content = content.replace(/height \+= detail \* mountainIntensity \* 1\.5 \* extremeMultiplier;/g, 'height += detail * mountainIntensity * 1.5;');

fs.writeFileSync('js/noise.js', content);
