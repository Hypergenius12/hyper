const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

// Fix the scope of `tint`
const brokenRegex = /                        if \(requiresTint\) \{\n                            \/\/ Draw the image first to a temporary canvas so we can tint it\n                            const tCanvas = document\.createElement\('canvas'\);\n                            tCanvas\.width = TEX_SIZE; tCanvas\.height = TEX_SIZE;\n                            const tCtx = tCanvas\.getContext\('2d'\);\n                            tCtx\.drawImage\(img, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE\);\n                            \n                            \/\/ Determine tint color\n                            let tint = '#79c05a'; \/\/ default grass/;

const fixed = `                        let tintColor = null;
                        if (requiresTint) {
                            // Draw the image first to a temporary canvas so we can tint it
                            const tCanvas = document.createElement('canvas');
                            tCanvas.width = TEX_SIZE; tCanvas.height = TEX_SIZE;
                            const tCtx = tCanvas.getContext('2d');
                            tCtx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                            
                            // Determine tint color
                            let tint = '#79c05a'; // default grass`;
                            
code = code.replace(brokenRegex, fixed);

const applyTintRegex = /                            tCtx\.fillStyle = tint;\n                            tCtx\.fillRect\(0, 0, TEX_SIZE, TEX_SIZE\);/;
const applyTintFixed = `                            tintColor = tint;
                            tCtx.fillStyle = tint;
                            tCtx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);`;
                            
code = code.replace(applyTintRegex, applyTintFixed);

const frameInfoTintRegex = /frameInfo\.tint = requiresTint \? tint : null;/g;
const frameInfoTintFixed = `frameInfo.tint = requiresTint ? tintColor : null;`;
code = code.replace(frameInfoTintRegex, frameInfoTintFixed);

const framePushTintRegex = /tint: requiresTint \? tint : null/g;
const framePushTintFixed = `tint: requiresTint ? tintColor : null`;
code = code.replace(framePushTintRegex, framePushTintFixed);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
