const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

code = code.replace(
    /frameInfo\.tint = requiresTint \? tCanvas : null; \/\/ Pass tint canvas if needed/,
    "frameInfo.tint = requiresTint ? tint : null;"
);
code = code.replace(
    /isMC: true,\n                                    img: img,\n                                    frames: img\.height \/ TEX_SIZE/,
    "isMC: true,\n                                    img: img,\n                                    frames: img.height / TEX_SIZE,\n                                    tint: requiresTint ? tint : null"
);

const updateAnimFixRegex = /\/\/ If it requires tint, multiply tint color over it[\s\S]*?ctx\.drawImage\(tmp, 0, 0, TEX_SIZE, TEX_SIZE, frame\.x, frame\.y, TEX_SIZE, TEX_SIZE\);\n                \}/;

const updateAnimFix = `// If it requires tint, multiply tint color over it
                if (frame.tint) {
                    tmpCtx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                    tmpCtx.drawImage(frame.img, 0, currentFrame * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                    tmpCtx.globalCompositeOperation = 'multiply';
                    tmpCtx.fillStyle = frame.tint;
                    tmpCtx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
                    // Restore alpha
                    tmpCtx.globalCompositeOperation = 'destination-in';
                    tmpCtx.drawImage(frame.img, 0, currentFrame * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                    tmpCtx.globalCompositeOperation = 'source-over';
                    
                    ctx.clearRect(frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                    ctx.drawImage(tmp, 0, 0, TEX_SIZE, TEX_SIZE, frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                }`;
                
code = code.replace(updateAnimFixRegex, updateAnimFix);
fs.writeFileSync('slopcraft 3D/js/textures.js', code);
