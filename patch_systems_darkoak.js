const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/systems.js', 'utf8');

code = code.replace(
    /            \[B.CRIMSON_STEM\]: \{ block: B.CRIMSON_PLANKS, name: 'Crimson Planks' \}/,
    "            [B.CRIMSON_STEM]: { block: B.CRIMSON_PLANKS, name: 'Crimson Planks' },\n            [B.DARK_OAK_WOOD]: { block: B.DARK_OAK_PLANKS, name: 'Dark Oak Planks' }"
);

code = code.replace(
    /        const isPlank = \(t\) => \[B.PLANKS, B.ACACIA_PLANKS, B.CHERRY_PLANKS, B.AUTUMN_PLANKS, B.PALM_PLANKS, B.PINE_PLANKS, B.CRIMSON_PLANKS\].includes\(t\);/,
    "        const isPlank = (t) => [B.PLANKS, B.ACACIA_PLANKS, B.CHERRY_PLANKS, B.AUTUMN_PLANKS, B.PALM_PLANKS, B.PINE_PLANKS, B.CRIMSON_PLANKS, B.DARK_OAK_PLANKS].includes(t);"
);

fs.writeFileSync('slopcraft 3D/js/systems.js', code);
