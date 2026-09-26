const fs = require('fs');

// ─── 1. textures.js: fix chest procedural texture + remove wrong MC mapping ───
let tex = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');

// Fix the procedural chest texture
tex = tex.replace(
    /        case BLOCKS\.CHEST_BLOCK:\n            if \(face === 'top' \|\| face === 'bottom'\) \{[\s\S]*?                if \(face === 'front'\) \{[\s\S]*?                \}\n            \}\n            break;/,
    `        case BLOCKS.CHEST_BLOCK:
            if (face === 'top') {
                // Oak plank top with iron band
                fillBase(ctx, 140, 100, 50);
                addNoise(ctx, rng, 8);
                ctx.fillStyle = 'rgba(60,40,10,0.9)';
                ctx.fillRect(0, 7, 16, 2); // horizontal band
                ctx.fillRect(7, 0, 2, 16); // vertical band
                ctx.fillStyle = '#888';
                ctx.fillRect(7, 7, 2, 2); // iron buckle center
            } else if (face === 'bottom') {
                fillBase(ctx, 130, 90, 40);
                addNoise(ctx, rng, 8);
                ctx.fillStyle = 'rgba(60,40,10,0.7)';
                ctx.fillRect(0, 7, 16, 2);
                ctx.fillRect(7, 0, 2, 16);
            } else if (face === 'front') {
                // Front face: wood planks + latch + lock
                fillBase(ctx, 160, 110, 55);
                addNoise(ctx, rng, 8);
                ctx.fillStyle = 'rgba(50,30,5,0.85)';
                ctx.fillRect(0, 9, 16, 2); // lid split line
                ctx.fillRect(1, 1, 14, 1); // top trim
                ctx.fillRect(1, 14, 14, 1); // bottom trim
                // Iron latch
                ctx.fillStyle = '#999';
                ctx.fillRect(6, 8, 4, 3);
                ctx.fillStyle = '#aaa';
                ctx.fillRect(7, 9, 2, 1);
                ctx.fillStyle = '#555';
                ctx.fillRect(7, 10, 2, 1);
            } else {
                // Side / back faces: wood planks + iron band
                fillBase(ctx, 155, 108, 52);
                addNoise(ctx, rng, 8);
                ctx.fillStyle = 'rgba(50,30,5,0.85)';
                ctx.fillRect(0, 9, 16, 2); // lid line
                ctx.fillRect(1, 1, 14, 1);
                ctx.fillRect(1, 14, 14, 1);
            }
            break;`
);

// Remove wrong MC mapping for chest (crafting_table_*)
tex = tex.replace(
    /    \[BLOCKS\.CHEST_BLOCK\]: \{ top: 'crafting_table_top', side: 'crafting_table_side', bottom: 'oak_planks', front: 'crafting_table_front' \},\n/,
    ''
);

// ─── 2. Add CRYING_OBSIDIAN block ───
tex = tex.replace(
    /    DARK_OAK_PLANKS: 193\n/,
    '    DARK_OAK_PLANKS: 193,\n    CRYING_OBSIDIAN: 195\n'
);

// Add properties for CRYING_OBSIDIAN
tex = tex.replace(
    /    \[BLOCKS\.DARK_OAK_PLANKS\]: \{ name: 'Dark Oak Planks', health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true \},/,
    "    [BLOCKS.DARK_OAK_PLANKS]: { name: 'Dark Oak Planks', health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },\n    [BLOCKS.CRYING_OBSIDIAN]: { name: 'Crying Obsidian', health: 15, transparent: false, emissive: 0.6, solid: true, drops: null },"
);

// Add procedural texture for CRYING_OBSIDIAN (after OBSIDIAN case)
tex = tex.replace(
    /        case BLOCKS\.OBSIDIAN:\n            fillBase\(ctx, 20, 10, 30\);\n            addNoise\(ctx, rng, 5\);\n            break;/,
    `        case BLOCKS.OBSIDIAN:
            fillBase(ctx, 20, 10, 30);
            addNoise(ctx, rng, 5);
            break;
        case BLOCKS.CRYING_OBSIDIAN:
            fillBase(ctx, 20, 8, 35);
            addNoise(ctx, rng, 5);
            // Purple glow cracks
            ctx.fillStyle = 'rgba(140,0,255,0.7)';
            for (let ci = 0; ci < 6; ci++) {
                const cx2 = Math.floor(rng() * 14) + 1;
                const cy2 = Math.floor(rng() * 14) + 1;
                ctx.fillRect(cx2, cy2, 1 + Math.floor(rng()*2), 1 + Math.floor(rng()*2));
            }
            ctx.fillStyle = 'rgba(200,100,255,0.5)';
            for (let ci = 0; ci < 4; ci++) {
                const cx2 = Math.floor(rng() * 14) + 1;
                const cy2 = Math.floor(rng() * 14) + 1;
                ctx.fillRect(cx2, cy2, 1, 1);
            }
            break;`
);

// Add MC texture mapping for CRYING_OBSIDIAN + fix chest
tex = tex.replace(
    /    \[BLOCKS\.OBSIDIAN\]: 'obsidian',/,
    "    [BLOCKS.OBSIDIAN]: 'obsidian',\n    [BLOCKS.CRYING_OBSIDIAN]: 'crying_obsidian',"
);

fs.writeFileSync('slopcraft 3D/js/textures.js', tex);

// ─── 3. generation.js: nether portal uses OBSIDIAN + CRYING_OBSIDIAN ───
let gen = fs.readFileSync('slopcraft 3D/js/generation.js', 'utf8');

gen = gen.replace(
    /    if \(type === 'nether'\) \{ frame1 = BLOCKS\.OBSIDIAN; frame2 = BLOCKS\.PORTAL_FRAME; base = BLOCKS\.NETHERRACK; \}/,
    "    if (type === 'nether') { frame1 = BLOCKS.OBSIDIAN; frame2 = BLOCKS.CRYING_OBSIDIAN; base = BLOCKS.NETHERRACK; }"
);

fs.writeFileSync('slopcraft 3D/js/generation.js', gen);

// ─── 4. map.js: fix waypoints by removing roundRect + using ctx.save/restore ───
let map = fs.readFileSync('slopcraft 3D/js/map.js', 'utf8');

// Replace the entire structure drawing block
const oldBlock = /        \/\/ Draw structure markers[\s\S]*?        }\n        \n        \/\/ Draw player indicator/;
const newBlock = `        // Draw structure markers (houses & nether portals)
        if (this.game.currentDimension === 'overworld') {
            const params = this.getGenerationParams();
            if (params) {
                const iconSize = Math.max(6, Math.min(14, this.zoom * 8));
                const step = 16;
                const viewLeft   = Math.floor((this.offsetX - (w/2) / this.zoom) / step) * step;
                const viewRight  = Math.ceil((this.offsetX  + (w/2) / this.zoom) / step) * step;
                const viewTop    = Math.floor((this.offsetZ - (h/2) / this.zoom) / step) * step;
                const viewBottom = Math.ceil((this.offsetZ  + (h/2) / this.zoom) / step) * step;

                for (let wx = viewLeft; wx <= viewRight; wx += step) {
                    for (let wz = viewTop; wz <= viewBottom; wz += step) {
                        const floraRng = seededRandom(params.seed + wx * 7777 + wz);
                        const r = floraRng();
                        let structType = null;
                        if (r < 0.00008) structType = 'nether';
                        else if (r < 0.00013) structType = 'cabin';
                        if (!structType) continue;

                        const sx = w / 2 + (wx - this.offsetX) * this.zoom;
                        const sz = h / 2 + (wz - this.offsetZ) * this.zoom;
                        if (sx < -iconSize || sx > w + iconSize || sz < -iconSize || sz > h + iconSize) continue;

                        const half = iconSize / 2;
                        this.ctx.save();
                        this.ctx.lineWidth = 1.5;
                        this.ctx.strokeStyle = '#fff';

                        if (structType === 'nether') {
                            this.ctx.fillStyle = 'rgba(130,0,220,0.9)';
                            this.ctx.fillRect(sx - half * 0.6, sz - half, half * 1.2, iconSize);
                            this.ctx.strokeRect(sx - half * 0.6, sz - half, half * 1.2, iconSize);
                        } else {
                            this.ctx.fillStyle = 'rgba(180,120,60,0.9)';
                            this.ctx.fillRect(sx - half * 0.8, sz, half * 1.6, half);
                            this.ctx.strokeRect(sx - half * 0.8, sz, half * 1.6, half);
                            this.ctx.beginPath();
                            this.ctx.moveTo(sx - half, sz);
                            this.ctx.lineTo(sx, sz - half);
                            this.ctx.lineTo(sx + half, sz);
                            this.ctx.closePath();
                            this.ctx.fillStyle = 'rgba(200,80,50,0.95)';
                            this.ctx.fill();
                            this.ctx.stroke();
                        }
                        this.ctx.restore();
                    }
                }

                if (this.zoom >= 0.4) {
                    this.ctx.save();
                    const lx = 12, ly = h - 50;
                    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    this.ctx.fillRect(lx - 4, ly - 14, 130, 44);
                    this.ctx.fillStyle = 'rgba(200,80,50,0.95)';
                    this.ctx.fillRect(lx, ly, 10, 10);
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '11px sans-serif';
                    this.ctx.textAlign = 'left';
                    this.ctx.fillText('House', lx + 14, ly + 9);
                    this.ctx.fillStyle = 'rgba(130,0,220,0.9)';
                    this.ctx.fillRect(lx, ly + 16, 10, 10);
                    this.ctx.fillStyle = '#fff';
                    this.ctx.fillText('Nether Portal', lx + 14, ly + 25);
                    this.ctx.restore();
                }
            }
        }
        
        // Draw player indicator`;

if (!map.match(oldBlock)) { console.log("MAP REGEX FAILED"); }
else { map = map.replace(oldBlock, newBlock); }

fs.writeFileSync('slopcraft 3D/js/map.js', map);
console.log("All patches applied");
