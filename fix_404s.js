const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

// Fix loadMinecraftTexture to avoid 404s for explicit paths
const loaderRegex = /        img\.src = MINECRAFT_ASSETS_BASE \+ 'block\/' \+ name \+ '\.png';/;
const loaderFixed = `        if (name.includes('/')) img.src = MINECRAFT_ASSETS_BASE + name + '.png';
        else img.src = MINECRAFT_ASSETS_BASE + 'block/' + name + '.png';`;
code = code.replace(loaderRegex, loaderFixed);

// Fix magma
code = code.replace(
    /\[BLOCKS\.MAGMA_STONE\]: 'magma_block',/,
    "[BLOCKS.MAGMA_STONE]: 'magma',"
);

// Fix end gateway
code = code.replace(
    /\[BLOCKS\.AETHER_PORTAL\]: 'end_gateway_beam',/,
    "[BLOCKS.AETHER_PORTAL]: 'entity/end_gateway_beam',"
);

// Fix seashell mappings (to avoid initial block/ 404)
code = code.replace(
    /\[BLOCKS\.SEASHELL_2\]: 'nautilus_shell',/,
    "[BLOCKS.SEASHELL_2]: 'item/nautilus_shell',"
);
code = code.replace(
    /\[BLOCKS\.SEASHELL_3\]: 'scute',/,
    "[BLOCKS.SEASHELL_3]: 'item/turtle_scute',"
);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
