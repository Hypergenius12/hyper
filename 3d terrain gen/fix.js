const fs = require('fs');

// 1. Fix main.js
let mainCode = fs.readFileSync('js/main.js', 'utf8');

// Remove GodRaysPass from composer
mainCode = mainCode.replace(/window\.godRaysPass = new THREE\.ShaderPass\(GodRaysShader\);\n\s*composer\.addPass\(window\.godRaysPass\);/g, '');

// Lower exposure slightly so ground isn't white
mainCode = mainCode.replace(/renderer\.toneMappingExposure = 1\.3;/, 'renderer.toneMappingExposure = 1.0;');

// Fix BokehPass so it doesn't cause artifacts on leaves (disable distance blur in normal gameplay)
mainCode = mainCode.replace(/if \(window\.bokehPass\) \{\n\s*if \(player\.isSwimming\) \{[\s\S]*?\} else \{\n\s*window\.bokehPass\.uniforms\['focus'\]\.value = 50\.0;\n\s*window\.bokehPass\.uniforms\['aperture'\]\.value = 0\.00001; \/\/ Normal gameplay\n\s*\}\n\s*\}/g,
`if (window.bokehPass) {
            if (player.isSwimming) {
                window.bokehPass.enabled = true;
                window.bokehPass.uniforms['focus'].value = 10.0;
                window.bokehPass.uniforms['aperture'].value = 0.005; // Blurry underwater
            } else {
                window.bokehPass.enabled = false; // Disable distance blur entirely to fix leaf artifacts
            }
        }`);

fs.writeFileSync('js/main.js', mainCode);

// 2. Fix sky.js
let skyCode = fs.readFileSync('js/sky.js', 'utf8');

// Lower sun intensity back to normal so ground isn't blown out
skyCode = skyCode.replace(/this\.sunLight\.intensity = Math\.max\(0, sunHeight\) \* 1\.2 \* weatherDim;/, 'this.sunLight.intensity = Math.max(0, sunHeight) * 0.9 * weatherDim;');

fs.writeFileSync('js/sky.js', skyCode);
