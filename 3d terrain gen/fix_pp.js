const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

code = code.replace(/new POSTPROCESSING\./g, 'new (window.POSTPROCESSING || window.postprocessing).');
code = code.replace(/const renderPass = new POSTPROCESSING\./g, 'const renderPass = new (window.POSTPROCESSING || window.postprocessing).');

fs.writeFileSync('js/main.js', code);
