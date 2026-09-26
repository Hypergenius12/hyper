const fs = require('fs');
let content = fs.readFileSync('js/terrain.js', 'utf8');

// Remove isMountain from getColor
content = content.replace(/        let mountainBiome = simplex\.noise2D\(0\.0015 \* 0\.3 \* gx - 3000, 0\.0015 \* 0\.3 \* gz - 3000\);\n        mountainBiome = \(mountainBiome \+ 1\) \/ 2;\n        let isMountain = mountainBiome > 0\.5;/g, '');

content = content.replace(/        if \(isMountain\) \{\n            \/\/ Rocky, gray\n            color\.push\(100 \+ Math\.random\(\)\*20, 100 \+ Math\.random\(\)\*20, 100 \+ Math\.random\(\)\*20\);\n        \} else if \(temp > 0\.3\) \{/g, '        if (temp > 0.3) {');

fs.writeFileSync('js/terrain.js', content);
