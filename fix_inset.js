const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

code = code.replace(
    /const epU = \(1\.0 \/ atlasW\) \* 0\.1;/,
    "const epU = (1.0 / atlasW) * 0.49;"
);
code = code.replace(
    /const epV = \(1\.0 \/ atlasH\) \* 0\.1;/,
    "const epV = (1.0 / atlasH) * 0.49;"
);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
