const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

code = code.replace(
    /    DARK_OAK_LEAVES: 192/,
    "    DARK_OAK_LEAVES: 192,\n    DARK_OAK_PLANKS: 193"
);

code = code.replace(
    /    \[BLOCKS.DARK_OAK_LEAVES\]: \{ name: 'Dark Oak Leaves',  health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true \}/,
    "    [BLOCKS.DARK_OAK_LEAVES]: { name: 'Dark Oak Leaves',  health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },\n    [BLOCKS.DARK_OAK_PLANKS]: { name: 'Dark Oak Planks',  health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true }"
);

code = code.replace(
    /        case BLOCKS.PINE_PLANKS:/,
    "        case BLOCKS.PINE_PLANKS:\n        case BLOCKS.DARK_OAK_PLANKS:"
);

code = code.replace(
    /    \[BLOCKS.DARK_OAK_LEAVES\]: 'dark_oak_leaves',/,
    "    [BLOCKS.DARK_OAK_LEAVES]: 'dark_oak_leaves',\n    [BLOCKS.DARK_OAK_PLANKS]: 'dark_oak_planks',"
);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
