const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

// Completely remove GodRaysShader and its instantiation
code = code.replace(/window\.godRaysPass = new THREE\.ShaderPass\(GodRaysShader\);/g, '');
code = code.replace(/composer\.addPass\(window\.godRaysPass\);/g, '');
// Rename sample to colorSample just in case it's still somewhere in the shader definition
code = code.replace(/vec4 sample = texture2D/g, 'vec4 colorSample = texture2D');
code = code.replace(/sample \*=/g, 'colorSample *=');
code = code.replace(/color \+= sample;/g, 'color += colorSample;');

fs.writeFileSync('js/main.js', code);
