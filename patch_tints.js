const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

const hook = `                        const requiresTint = (texName === 'grass_block_top' || texName.includes('leaves') || texName === 'water_flow' || texName === 'vine' || texName.includes('tall_grass') || texName === 'fern' || texName === 'lily_pad');
                        
                        if (requiresTint) {
                            // Draw the image first to a temporary canvas so we can tint it
                            const tCanvas = document.createElement('canvas');
                            tCanvas.width = TEX_SIZE; tCanvas.height = TEX_SIZE;
                            const tCtx = tCanvas.getContext('2d');
                            tCtx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                            
                            // Determine tint color
                            let tint = '#55ff55'; // default vibrant green
                            if (texName === 'water_flow') tint = '#3f76e4';
                            else if (bt === BLOCKS.SWAMP_GRASS || bt === BLOCKS.AUTUMN_LEAVES) tint = '#8a9947';
                            else if (bt === BLOCKS.SAVANNA_GRASS) tint = '#bfb755';
                            else if (bt === BLOCKS.PINE_LEAVES) tint = '#3d6e4b';
                            else if (bt === BLOCKS.CHERRY_LEAVES) tint = '#ffb7c5';
                            else if (texName.includes('leaves')) tint = '#48b518';
                            else tint = '#79c05a'; // grass default`;

const newCode = `                        const requiresTint = (texName === 'grass_block_top' || texName.includes('leaves') || texName === 'water_flow' || texName === 'vine' || texName.includes('tall_grass') || texName === 'fern' || texName === 'lily_pad');
                        
                        if (requiresTint) {
                            // Draw the image first to a temporary canvas so we can tint it
                            const tCanvas = document.createElement('canvas');
                            tCanvas.width = TEX_SIZE; tCanvas.height = TEX_SIZE;
                            const tCtx = tCanvas.getContext('2d');
                            tCtx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                            
                            // Determine tint color
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
                            }`;

code = code.replace(hook, newCode);
fs.writeFileSync('slopcraft 3D/js/textures.js', code);
