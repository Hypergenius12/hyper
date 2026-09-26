const fs = require('fs');
let code = fs.readFileSync('js/props.js', 'utf8');

// Remove addWindSway function call from materials
code = code.replace(/addWindSway\(window\.PropMaterials\.leavesForest\);/g, '');
code = code.replace(/addWindSway\(window\.PropMaterials\.leavesTaiga\);/g, '');
code = code.replace(/addWindSway\(window\.PropMaterials\.flowerRed\);/g, '');
code = code.replace(/addWindSway\(window\.PropMaterials\.flowerYellow\);/g, '');
// To completely remove the possibility of shader messing things up, redefine the materials clean
code = code.replace(/function addWindSway\(material\) \{[\s\S]*?\}\n/g, '');

fs.writeFileSync('js/props.js', code);
