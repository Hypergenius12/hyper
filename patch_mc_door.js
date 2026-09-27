const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

code = code.replace(
    /    \[BLOCKS\.GLOWSTONE\]: 'glowstone',/,
    "    [BLOCKS.GLOWSTONE]: 'glowstone',\n    [BLOCKS.DUNGEON_DOOR]: 'oak_door_bottom',\n    [BLOCKS.DUNGEON_DOOR_TOP]: 'oak_door_top',"
);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
