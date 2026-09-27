const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/entities.js', 'utf8');

code = code.replace(
    /        const inWater = blockProps && \(blockProps\.isLiquid \|\| blockProps\.isWaterlogged\) && blockIn !== BLOCKS\.LAVA;/,
    "        const inWater = blockProps && (blockProps.isLiquid || blockProps.isWaterlogged) && blockIn !== BLOCKS.LAVA;\n        this.inWater = inWater;"
);

fs.writeFileSync('slopcraft 3D/js/entities.js', code);
