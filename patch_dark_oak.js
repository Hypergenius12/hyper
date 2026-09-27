const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

// Fix door paths
code = code.replace(
    /    \[BLOCKS\.DUNGEON_DOOR\]: \{ all: 'block\/oak_door_bottom' \},\n    \[BLOCKS\.DUNGEON_DOOR_TOP\]: \{ all: 'block\/oak_door_top' \},/,
    "    [BLOCKS.DUNGEON_DOOR]: { all: 'oak_door_bottom' },\n    [BLOCKS.DUNGEON_DOOR_TOP]: { all: 'oak_door_top' },"
);
code = code.replace(
    /    \[BLOCKS\.BARREL\]: \{\n        top: 'block\/barrel_top',\n        bottom: 'block\/barrel_bottom',\n        side: 'block\/barrel_side'\n    \},/,
    "    [BLOCKS.BARREL]: {\n        top: 'barrel_top',\n        bottom: 'barrel_bottom',\n        side: 'barrel_side'\n    },"
);

// Add missing wood blocks to propertiesTable
const propsRegex = /    \[BLOCKS\.AETHER_WOOD\]:   \{ name: 'Aether Wood',    health: 7, transparent: false, emissive: 0, solid: true, drops: null, flammable: true \},/;
const propsInsert = `    [BLOCKS.AETHER_WOOD]:   { name: 'Aether Wood',    health: 7, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.DARK_OAK_WOOD]: { name: 'Dark Oak Wood',  health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.DARK_OAK_LEAVES]: { name: 'Dark Oak Leaves', health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.DARK_OAK_PLANKS]: { name: 'Dark Oak Planks', health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },`;

code = code.replace(propsRegex, propsInsert);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
