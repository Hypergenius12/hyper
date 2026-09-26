const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

// Re-enable BokehPass for normal gameplay but very subtle
code = code.replace(/window\.bokehPass\.enabled = false; \/\/ Disable distance blur entirely to fix leaf artifacts/g,
`window.bokehPass.enabled = true;
                window.bokehPass.uniforms['focus'].value = 80.0;
                window.bokehPass.uniforms['aperture'].value = 0.00001;
                window.bokehPass.uniforms['maxblur'].value = 0.005;`);

fs.writeFileSync('js/main.js', code);
