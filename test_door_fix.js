const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/generation.js', 'utf8');

const regex = /                \/\/ Doorway: place a single door column at the exact center\n                if \(room\.type === 'doorway'\) \{[\s\S]*?                    continue;\n                \}/;

const replacement = `                // Doorway: place a single door column at the exact center, carve the rest
                if (room.type === 'doorway') {
                    const dx = Math.abs(wx - Math.floor(room.x));
                    const dz = Math.abs(wz - Math.floor(room.z));
                    const rw = room.w / 2;
                    const rd = room.d / 2;

                    if (dx <= rw && dz <= rd) {
                        if (dx === 0 && dz === 0) {
                            // Exact center column: place door
                            if (wy === minY + 1 || wy === minY + 2) {
                                safeSetBlock(blocks, lx, wy, lz, BLOCKS.DUNGEON_DOOR);
                            } else if (wy > minY + 2 && wy <= minY + 3) {
                                safeSetBlock(blocks, lx, wy, lz, BLOCKS.AIR); // Headroom above door
                            } else if (wy === minY) {
                                safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.floor : BLOCKS.STONE_BRICKS);
                            } else {
                                safeSetBlock(blocks, lx, wy, lz, BLOCKS.AIR);
                            }
                        } else {
                            // Sides of the doorway (carve air)
                            if (wy > minY && wy <= minY + 3) {
                                safeSetBlock(blocks, lx, wy, lz, BLOCKS.AIR);
                            } else if (wy === minY) {
                                safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.floor : BLOCKS.STONE_BRICKS);
                            } else if (wy === minY + 4) {
                                safeSetBlock(blocks, lx, wy, lz, room.theme ? room.theme.wall : BLOCKS.STONE_BRICKS);
                            }
                        }
                    }
                    continue;
                }`;

if (!code.match(regex)) console.log("REGEX FAILED");
else {
    code = code.replace(regex, replacement);
    fs.writeFileSync('slopcraft 3D/js/generation.js', code);
    console.log("REPLACED SUCCESSFULLY");
}
