const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

code = code.replace(
    /    DUNGEON_DOOR: 76,/,
    "    DUNGEON_DOOR: 76,\n    DUNGEON_DOOR_TOP: 194,"
);

code = code.replace(
    /    \[BLOCKS\.DUNGEON_DOOR\]:  \{ name: 'Dungeon Door',   health: 5, transparent: true, emissive: 0, solid: true, drops: BLOCKS\.DUNGEON_DOOR \},/,
    "    [BLOCKS.DUNGEON_DOOR]:  { name: 'Dungeon Door',   health: 5, transparent: true, emissive: 0, solid: true, drops: BLOCKS.DUNGEON_DOOR },\n    [BLOCKS.DUNGEON_DOOR_TOP]:  { name: 'Dungeon Door Top', health: 5, transparent: true, emissive: 0, solid: true, drops: null },"
);

code = code.replace(
    /        case BLOCKS\.DUNGEON_DOOR:/,
    "        case BLOCKS.DUNGEON_DOOR_TOP:\n            ctx.fillStyle = '#654321';\n            ctx.fillRect(0,0,16,16);\n            ctx.fillStyle = '#111';\n            ctx.fillRect(2,2,4,4);\n            ctx.fillRect(10,2,4,4);\n            ctx.fillRect(2,10,4,4);\n            ctx.fillRect(10,10,4,4);\n            break;\n        case BLOCKS.DUNGEON_DOOR:"
);

// Add to MC_TEXTURE_MAP
const mcMapInsert = `    [BLOCKS.BARREL]: {
        top: 'block/barrel_top',
        bottom: 'block/barrel_bottom',
        side: 'block/barrel_side'
    },
    [BLOCKS.DUNGEON_DOOR]: { all: 'block/oak_door_bottom' },
    [BLOCKS.DUNGEON_DOOR_TOP]: { all: 'block/oak_door_top' },`;
    
code = code.replace(/    \[BLOCKS\.BARREL\]: \{\n        top: 'block\/barrel_top',\n        bottom: 'block\/barrel_bottom',\n        side: 'block\/barrel_side'\n    \},/, mcMapInsert);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
