const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

// First, fix animatedFrames push logic in generateAtlas
// I want to modify the updateAnimatedTextures to handle MC strips.
// The easiest way is to intercept the drawImage in useMinecraft block!

const mcDrawRegex = /                            tCtx\.drawImage\(img, 0, 0, TEX_SIZE, TEX_SIZE\);(\s+)\/\/ Determine tint color[\s\S]*?ctx\.drawImage\(tCanvas, entry\.col \* TEX_SIZE, entry\.row \* TEX_SIZE, TEX_SIZE, TEX_SIZE\);\n                        \} else \{\n                            ctx\.drawImage\(img, entry\.col \* TEX_SIZE, entry\.row \* TEX_SIZE, TEX_SIZE, TEX_SIZE\);\n                        \}/;

const replacement = `                            tCtx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);$1// Determine tint color
                            let tint = '#79c05a'; // default grass
                            
                            if (texName === 'water_flow') {
                                if (bt === BLOCKS.SWAMP_WATER) tint = '#4c6559';
                                else tint = '#3f76e4';
                            }
                            else if (bt === BLOCKS.SWAMP_GRASS) tint = '#6a7039';
                            else if (bt === BLOCKS.SAVANNA_GRASS) tint = '#bfb755';
                            else if (bt === BLOCKS.HIGHLANDS_GRASS) tint = '#507a32'; // Dark forest style
                            else if (bt === BLOCKS.AETHER_GRASS) tint = '#b3ffb3';
                            
                            else if (texName.includes('leaves') || texName === 'vine' || texName === 'fern' || texName.includes('tall_grass') || texName === 'lily_pad') {
                                if (bt === BLOCKS.ACACIA_LEAVES) tint = '#aea42a'; // Savanna leaves
                                else if (bt === BLOCKS.PINE_LEAVES) tint = '#3d6e4b'; // Taiga/Pine
                                else if (bt === BLOCKS.AUTUMN_LEAVES) tint = '#507a32'; // Dark Forest leaves
                                else if (bt === BLOCKS.CHERRY_LEAVES) tint = '#ffffff'; // Don't heavily tint cherry leaves, Minecraft cherry leaves are intrinsically pink
                                else if (bt === BLOCKS.AETHER_LEAVES) tint = '#b3ffb3';
                                else tint = '#59ae30'; // default leaves
                            }
                            
                            tCtx.globalCompositeOperation = 'multiply';
                            tCtx.fillStyle = tint;
                            tCtx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
                            
                            // Restore alpha channel using destination-in
                            tCtx.globalCompositeOperation = 'destination-in';
                            tCtx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                            
                            ctx.drawImage(tCanvas, entry.col * TEX_SIZE, entry.row * TEX_SIZE);
                        } else {
                            ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                        }
                        
                        // If animated strip, save it to animatedFrames and clear the old procedural canvas
                        if (img.height > TEX_SIZE) {
                            const frameInfo = animatedFrames.find(f => f.x === entry.col * TEX_SIZE && f.y === entry.row * TEX_SIZE);
                            if (frameInfo) {
                                frameInfo.isMC = true;
                                frameInfo.img = img;
                                frameInfo.frames = img.height / TEX_SIZE;
                                frameInfo.tint = requiresTint ? tCanvas : null; // Pass tint canvas if needed
                            } else {
                                animatedFrames.push({
                                    x: entry.col * TEX_SIZE,
                                    y: entry.row * TEX_SIZE,
                                    isMC: true,
                                    img: img,
                                    frames: img.height / TEX_SIZE
                                });
                            }
                        }`;

if (!code.match(mcDrawRegex)) console.log("FAILED REGEX 1");
else code = code.replace(mcDrawRegex, replacement);

const updateAnimRegex = /    function updateAnimatedTextures\(time\) \{[\s\S]*?        texture\.needsUpdate = true;\n    \}/;

const updateAnimReplacement = `    function updateAnimatedTextures(time) {
        if (animatedFrames.length === 0) return;
        const shift = Math.floor(time * 0.05) % TEX_SIZE;
        let didUpdate = false;
        
        for (const frame of animatedFrames) {
            if (frame.isMC) {
                const totalFrames = frame.frames || 1;
                const currentFrame = Math.floor(time / 100) % totalFrames;
                if (frame.lastFrame === currentFrame) continue;
                frame.lastFrame = currentFrame;
                
                ctx.clearRect(frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(frame.img, 0, currentFrame * TEX_SIZE, TEX_SIZE, TEX_SIZE, frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                
                // If it requires tint, multiply tint color over it
                if (frame.tint) {
                    // Extract tinted frame
                    tmpCtx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                    tmpCtx.drawImage(frame.img, 0, currentFrame * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                    tmpCtx.globalCompositeOperation = 'multiply';
                    tmpCtx.drawImage(frame.tint, 0, 0); // we used tCanvas as a solid color mask basically
                    // Restore alpha
                    tmpCtx.globalCompositeOperation = 'destination-in';
                    tmpCtx.drawImage(frame.img, 0, currentFrame * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                    tmpCtx.globalCompositeOperation = 'source-over';
                    
                    ctx.clearRect(frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                    ctx.drawImage(tmp, 0, 0, TEX_SIZE, TEX_SIZE, frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                }
                
                didUpdate = true;
            } else {
                if (texture.userData.lastShift === shift) continue;
                tmpCtx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                tmpCtx.drawImage(frame.canvas, 0, shift);
                tmpCtx.drawImage(frame.canvas, 0, shift - TEX_SIZE);
                ctx.clearRect(frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(tmp, frame.x, frame.y);
                didUpdate = true;
            }
        }
        
        texture.userData.lastShift = shift;
        if (didUpdate) texture.needsUpdate = true;
    }`;

if (!code.match(updateAnimRegex)) console.log("FAILED REGEX 2");
else code = code.replace(updateAnimRegex, updateAnimReplacement);

fs.writeFileSync('slopcraft 3D/js/textures.js', code);
