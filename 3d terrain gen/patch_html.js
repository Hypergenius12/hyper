const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Remove existing EffectComposer and passes
code = code.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\/postprocessing\/EffectComposer\.js"><\/script>\n/g, '');
code = code.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\/postprocessing\/RenderPass\.js"><\/script>\n/g, '');
code = code.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\/postprocessing\/ShaderPass\.js"><\/script>\n/g, '');
code = code.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\/postprocessing\/UnrealBloomPass\.js"><\/script>\n/g, '');
code = code.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\/postprocessing\/BokehPass\.js"><\/script>\n/g, '');

// Add postprocessing
if (!code.includes('postprocessing.min.js')) {
    code = code.replace(/<!-- Three\.js Addons -->/, `<!-- Three.js Addons -->
    <script src="https://cdn.jsdelivr.net/npm/postprocessing@6.30.2/build/postprocessing.min.js"></script>`);
}

fs.writeFileSync('index.html', code);
