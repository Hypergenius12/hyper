const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/audio.js', 'utf8');

const regex = /    playFootstep\(blockType\) \{[\s\S]*?    playWaterSplash\(\) \{[\s\S]*?\n    \}/;

const replacement = `    playFootstep(blockType) {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        const doFallback = () => {
            this.playNoise(0.05, 0.1);
        };
        if (useMC) {
            const v = Math.floor(Math.random() * 4) + 1;
            let path = \`step/stone\${v}\`;
            if ([BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.PORTAL_FRAME, BLOCKS.ACACIA_WOOD].includes(blockType)) path = \`step/wood\${v}\`;
            else if ([BLOCKS.SAND, BLOCKS.RED_SAND].includes(blockType)) path = \`step/sand\${v}\`;
            else if ([BLOCKS.GRAVEL].includes(blockType)) path = \`step/gravel\${v}\`;
            else if ([BLOCKS.DIRT, BLOCKS.GRASS].includes(blockType)) path = \`step/grass\${v}\`;
            else if ([BLOCKS.SNOW].includes(blockType)) path = \`step/snow\${v}\`;
            
            this.playMC(path, 0.4).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }

    playWaterSplash() {
        const useMC = localStorage.getItem('slopcraft_mc_textures') === 'true';
        const doFallback = () => {
            this.playNoise(0.3, 0.4);
        };
        if (useMC) {
            this.playMC('random/splash', 0.6).then(s => { if(!s) doFallback(); });
            return;
        }
        doFallback();
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/audio.js', code);
