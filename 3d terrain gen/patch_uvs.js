const fs = require('fs');
let code = fs.readFileSync('js/terrain.js', 'utf8');
code = code.replace(
    'uvs[i*2] = posAttr.getX(i) / (GRID_SIZE * VOXEL_SIZE);',
    'uvs[i*2] = (posAttr.getX(i) / (GRID_SIZE * VOXEL_SIZE)) * 16;'
);
code = code.replace(
    'uvs[i*2+1] = posAttr.getZ(i) / (GRID_SIZE * VOXEL_SIZE);',
    'uvs[i*2+1] = (posAttr.getZ(i) / (GRID_SIZE * VOXEL_SIZE)) * 16;'
);
fs.writeFileSync('js/terrain.js', code);
