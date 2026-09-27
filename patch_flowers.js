const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/generation.js', 'utf8');

const regex = /if \(biome === BIOMES.CHERRY_GROVE && fr < 0.3\) \{[\s\S]*?\} else if \(biome === BIOMES.AUTUMN_FOREST/g;
const replacement = `if (biome === BIOMES.CHERRY_GROVE && fr < 0.3) {
                        if (fr < 0.05) {
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.PINK_PETALS, true);
                        } else if (fr < 0.1) {
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.WHITE_FLOWER, true);
                        } else if (fr < 0.15) {
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.PURPLE_FLOWER, true);
                        } else {
                            safeSetBlock(blocks, tx, surfaceY + 1, tz, BLOCKS.TALL_GRASS, true);
                        }
                    } else if (biome === BIOMES.AUTUMN_FOREST`;

code = code.replace(regex, replacement);
fs.writeFileSync('slopcraft 3D/js/generation.js', code);
