const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

code = code.replace(
    /\[BLOCKS.AUTUMN_WOOD\]: \{ top: 'spruce_log_top', side: 'spruce_log', bottom: 'spruce_log_top' \},/g,
    "[BLOCKS.AUTUMN_WOOD]: { top: 'pale_oak_log_top', side: 'pale_oak_log', bottom: 'pale_oak_log_top' },"
);
code = code.replace(
    /\[BLOCKS.AUTUMN_LEAVES\]: 'spruce_leaves',/g,
    "[BLOCKS.AUTUMN_LEAVES]: 'pale_oak_leaves',"
);
code = code.replace(
    /\[BLOCKS.ALGAE\]: 'lily_pad',/g,
    "[BLOCKS.ALGAE]: 'seagrass',"
);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
