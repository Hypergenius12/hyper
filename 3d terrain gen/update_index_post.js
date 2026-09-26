const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
// Remove all three.js postprocessing script tags (EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, FilmPass, BokehPass, SAOPass, etc.)
html = html.replace(/<script src=\"https:\/\/cdn.jsdelivr.net\/npm\/three@0\.128\.0\/examples\/js\/postprocessing\/[^\"]+\"\>[\s\S]*?<\/script>\n/g, '');
// Ensure postprocessing.min.js is included once
if (!html.includes('postprocessing.min.js')) {
  html = html.replace(/<script src=\"https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/three\.js\/r128\/three.min.js[^\"]*\"\>[\s\S]*?<\/script>/, match => {
    return match + "\n    <script src=\"https://cdn.jsdelivr.net/npm/postprocessing@6.30.2/build/postprocessing.min.js\"></script>";
  });
}
fs.writeFileSync('index.html', html);
