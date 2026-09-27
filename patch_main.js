const fs = require('fs');

let mainJs = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

// Add to UI listeners at the bottom
const blurToggleLogic = `
    const startBlurToggle = document.getElementById('start-blur-toggle');
    const pauseBlurToggle = document.getElementById('pause-blur-toggle');
    const useBlur = localStorage.getItem('slopcraft_blur') !== 'false'; // default true
    if (startBlurToggle) {
        startBlurToggle.checked = useBlur;
        startBlurToggle.addEventListener('change', (e) => {
            localStorage.setItem('slopcraft_blur', e.target.checked);
            if (window.game && window.game.bokehPass) window.game.bokehPass.enabled = e.target.checked;
        });
    }
    if (pauseBlurToggle) {
        pauseBlurToggle.checked = useBlur;
        pauseBlurToggle.addEventListener('change', (e) => {
            localStorage.setItem('slopcraft_blur', e.target.checked);
            if (window.game && window.game.bokehPass) window.game.bokehPass.enabled = e.target.checked;
        });
    }
`;

mainJs = mainJs.replace("pauseMcToggle.addEventListener('change', (e) => localStorage.setItem('slopcraft_mc_textures', e.target.checked));\n    }", 
"pauseMcToggle.addEventListener('change', (e) => localStorage.setItem('slopcraft_mc_textures', e.target.checked));\n    }\n" + blurToggleLogic);

// Add initial setup in Game constructor
mainJs = mainJs.replace("this.composer.addPass(this.bokehPass);", 
`this.composer.addPass(this.bokehPass);
        this.bokehPass.enabled = localStorage.getItem('slopcraft_blur') !== 'false';`);

fs.writeFileSync('slopcraft 3D/js/main.js', mainJs);
