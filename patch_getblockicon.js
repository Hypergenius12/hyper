const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

const oldCode = `        if (props.isCross) {
            // Flat 2D for cross models
            const tmp = document.createElement('canvas');
            tmp.width = TEX_SIZE; tmp.height = TEX_SIZE;
            const tmpCtx = tmp.getContext('2d');
            tmpCtx.imageSmoothingEnabled = false;
            generateBlockTexture(tmpCtx, blockType, 'side', seededRandom(blockType * 1000 + 77));
            iconCtx.drawImage(tmp, 0, 0, TEX_SIZE, TEX_SIZE, (TEX_SIZE/2)*SCALE, (TEX_SIZE/2)*SCALE, TEX_SIZE*SCALE, TEX_SIZE*SCALE);
            return iconCanvas;
        }

        // Generate 3 faces
        const top = document.createElement('canvas'); top.width = TEX_SIZE; top.height = TEX_SIZE;
        const side1 = document.createElement('canvas'); side1.width = TEX_SIZE; side1.height = TEX_SIZE;
        const side2 = document.createElement('canvas'); side2.width = TEX_SIZE; side2.height = TEX_SIZE;
        
        generateBlockTexture(top.getContext('2d'), blockType, 'top', seededRandom(blockType * 1000 + 77));
        generateBlockTexture(side1.getContext('2d'), blockType, 'side', seededRandom(blockType * 1000 + 78));
        generateBlockTexture(side2.getContext('2d'), blockType, 'side', seededRandom(blockType * 1000 + 79));`;

const newCode = `        const getFaceCanvas = (faceKey) => {
            const map = uvMap[blockType];
            const entry = map ? (map[faceKey] || map.side || map.top) : null;
            const faceCvs = document.createElement('canvas'); 
            faceCvs.width = TEX_SIZE; faceCvs.height = TEX_SIZE;
            const ctx = faceCvs.getContext('2d');
            if (entry && canvas) {
                ctx.drawImage(canvas, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
            } else {
                generateBlockTexture(ctx, blockType, faceKey, seededRandom(blockType * 1000 + 77));
            }
            return faceCvs;
        };

        if (props.isCross) {
            // Flat 2D for cross models
            const tmp = getFaceCanvas('side');
            iconCtx.drawImage(tmp, 0, 0, TEX_SIZE, TEX_SIZE, (TEX_SIZE/2)*SCALE, (TEX_SIZE/2)*SCALE, TEX_SIZE*SCALE, TEX_SIZE*SCALE);
            return iconCanvas;
        }

        // Generate 3 faces from atlas
        const top = getFaceCanvas('top');
        const side1 = getFaceCanvas('side');
        const side2 = getFaceCanvas('side');`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('slopcraft 3D/js/textures.js', code);
