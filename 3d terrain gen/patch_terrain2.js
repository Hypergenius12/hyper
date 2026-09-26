const fs = require('fs');
let content = fs.readFileSync('js/terrain.js', 'utf8');

// Remove isMountain from getDensity
content = content.replace(/        let mountainBiome = simplex\.noise2D\(0\.0015 \* 0\.3 \* gx - 3000, 0\.0015 \* 0\.3 \* gz - 3000\);\n        mountainBiome = \(mountainBiome \+ 1\) \/ 2;\n        let isMountain = mountainBiome > 0\.5;\n        \n        let caveThreshold = isMountain \? 0\.3 : 0\.6;/g, '        let caveThreshold = 0.6;');

// Remove isMountain from getColor
content = content.replace(/            if \(isMountain && gy > WATER_LEVEL \+ 45\) \{\n                color\.push\(255, 255, 255\); \/\/ Snow capped\n            \} else \{\n                \/\/ Rock\n                color\.push\(100 \+ Math\.random\(\)\*20, 100 \+ Math\.random\(\)\*20, 100 \+ Math\.random\(\)\*20\);\n            \}/g, '            color.push(100 + Math.random()*20, 100 + Math.random()*20, 100 + Math.random()*20);');

fs.writeFileSync('js/terrain.js', content);
