const fs = require('fs');

// ==============================================================
// 1. engine.js: Water opacity 0.85, lava opacity, flammable check, fire tick
// ==============================================================
let eng = fs.readFileSync('slopcraft 3D/js/engine.js', 'utf8');

// A: Make water and lava more opaque
eng = eng.replace(
    /const matWater = new THREE\.MeshPhongMaterial\(\{[\s\S]*?opacity:\s*0\.8,[\s\S]*?\}\);/,
    `const matWater = new THREE.MeshPhongMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: true,
            opacity: 0.88, // slightly more opaque water
            side: THREE.DoubleSide,
            shininess: 80,
            specular: new THREE.Color(0x4488bb)
        });`
);

// B: Improve isFlammable to use getBlockProperties(block).flammable
eng = eng.replace(
    /isFlammable\(block\) \{[\s\S]*?return block === window\.BLOCKS\.WOOD[\s\S]*?DEAD_BUSH;\s*\}/,
    `isFlammable(block) {
        if (!block || block === window.BLOCKS.AIR) return false;
        const props = getBlockProperties(block);
        return (props && props.flammable === true) || block === window.BLOCKS.TNT;
    }`
);

// C: In tickRandomBlocks:
// - tick faster (0.5s instead of 1.2s, 160 blocks per chunk)
// - burning wood/flammable blocks burns them over time and can ignite TNT!
eng = eng.replace(
    /if \(this\.tickTimer >= 1\.2\) \{ \/\/ tick every 1\.2s\s*this\.tickTimer = 0;\s*this\.tickFluids\(\);\s*this\.tickRandomBlocks\(\);\s*\}/,
    `if (this.tickTimer >= 0.5) { // tick every 0.5s for responsive fire and burning
                this.tickTimer = 0;
                this.tickFluids();
                this.tickRandomBlocks();
            }`
);

eng = eng.replace(
    /for \(let i = 0; i < 96; i\+\+\) \{/,
    `for (let i = 0; i < 160; i++) {`
);

// In fire block processing, if adjacent is TNT, ignite TNT immediately!
eng = eng.replace(
    /\/\/ 3\. Destroy adjacent flammable blocks \(burn them up\)[\s\S]*?if \(Math\.random\(\) < 0\.2\) \{[\s\S]*?dirs\.sort\(\(\) => Math\.random\(\) - 0\.5\);[\s\S]*?for \(const \[dx, dy, dz\] of dirs\) \{[\s\S]*?const nx = wx \+ dx, ny = wy \+ dy, nz = wz \+ dz;[\s\S]*?if \(this\.isFlammable\(this\.getBlock\(nx, ny, nz\)\)\) \{[\s\S]*?this\.setBlock\(nx, ny, nz, window\.BLOCKS\.AIR\);[\s\S]*?break; \/\/ Only burn one at a time[\s\S]*?\}[\s\S]*?\}[\s\S]*?\}/,
    `// 3. Destroy adjacent flammable blocks (burn them up over time) or ignite TNT
                    dirs.sort(() => Math.random() - 0.5);
                    for (const [dx, dy, dz] of dirs) {
                        const nx = wx + dx, ny = wy + dy, nz = wz + dz;
                        const adjBlock = this.getBlock(nx, ny, nz);
                        if (adjBlock === window.BLOCKS.TNT) {
                            if (window.game && window.game.igniteTNT) {
                                window.game.igniteTNT(nx, ny, nz);
                            } else {
                                this.setBlock(nx, ny, nz, window.BLOCKS.AIR);
                            }
                            break;
                        } else if (this.isFlammable(adjBlock) && Math.random() < 0.45) {
                            // Turn burned block into fire or air!
                            this.setBlock(nx, ny, nz, Math.random() < 0.6 ? window.BLOCKS.FIRE : window.BLOCKS.AIR);
                            break;
                        }
                    }`
);

// In lava block processing: if adjacent to TNT, ignite TNT!
eng = eng.replace(
    /\} else if \(block === window\.BLOCKS\.LAVA\) \{[\s\S]*?if \(Math\.random\(\) < 0\.1\) \{[\s\S]*?const wx = chunk\.cx \* 16 \+ rx;/,
    `} else if (block === window.BLOCKS.LAVA) {
                    const wx = chunk.cx * 16 + rx;
                    const wy = ry;
                    const wz = chunk.cz * 16 + rz;
                    // Check immediate neighbors for TNT!
                    const dirs6 = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
                    for (const [dx, dy, dz] of dirs6) {
                        const nx = wx + dx, ny = wy + dy, nz = wz + dz;
                        if (this.getBlock(nx, ny, nz) === window.BLOCKS.TNT) {
                            if (window.game && window.game.igniteTNT) {
                                window.game.igniteTNT(nx, ny, nz);
                            }
                        }
                    }
                    if (Math.random() < 0.25) {`
);

fs.writeFileSync('slopcraft 3D/js/engine.js', eng);

// ==============================================================
// 2. textures.js: Make lava texture slightly more opaque in procedural / material
// ==============================================================
let tex = fs.readFileSync('slopcraft 3D/js/textures.js', 'utf8');
// In BLOCK_PROPS for LAVA:
tex = tex.replace(
    /\[BLOCKS\.LAVA\]:\s*\{\s*name:\s*'Lava',\s*health:\s*0,\s*transparent:\s*true,\s*emissive:\s*1\.0,\s*solid:\s*false,\s*isLiquid:\s*true,\s*drops:\s*null\s*\}/,
    `[BLOCKS.LAVA]:          { name: 'Lava',           health: 0, transparent: false, emissive: 1.0, solid: false, isLiquid: true, drops: null }`
);
// Changing transparent: false for Lava makes it completely opaque like Minecraft lava!
fs.writeFileSync('slopcraft 3D/js/textures.js', tex);

// ==============================================================
// 3. main.js:
// - Flint and steel can place fire anywhere (on any solid face except water/liquid)
// - Cool pulsing flash fuse for primed TNT with physics/model before exploding!
// ==============================================================
let main = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

// A: In constructor, add primedTNT list
main = main.replace(
    /this\.breakTimer = 0;/,
    `this.breakTimer = 0;
        this.primedTNT = [];`
);

// B: Improve Flint and Steel right-click handling:
main = main.replace(
    /if \(slot && slot\.item\.subtype === 'flint_and_steel' && hit\.hit\) \{[\s\S]*?this\.input\.mouse\.rightClick = false;\s*return;\s*\}/,
    `if (slot && slot.item.subtype === 'flint_and_steel' && hit.hit) {
                // If clicked on Obsidian/Glowstone/etc, try to light a portal first
                let portalLit = false;
                if (hit.blockType === window.BLOCKS.OBSIDIAN || hit.blockType === window.BLOCKS.GLOWSTONE || hit.blockType === window.BLOCKS.PORTAL_FRAME) {
                    portalLit = this.tryLightPortal(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                    if (portalLit) this.audio.playHit();
                }

                if (!portalLit) {
                    if (hit.blockType === window.BLOCKS.TNT) {
                        this.igniteTNT(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z);
                        this.audio.playFizz();
                    } else if (hit.face) {
                        const nx = hit.blockPos.x + hit.face.x;
                        const ny = hit.blockPos.y + hit.face.y;
                        const nz = hit.blockPos.z + hit.face.z;
                        const targetBlock = this.world.getBlock(nx, ny, nz);
                        // Can light fire in air, on top of any non-liquid block (not water/swamp water)
                        if (targetBlock === window.BLOCKS.AIR) {
                            const belowBlock = this.world.getBlock(nx, ny - 1, nz);
                            if (belowBlock !== window.BLOCKS.WATER && belowBlock !== window.BLOCKS.SWAMP_WATER) {
                                this.world.setBlock(nx, ny, nz, window.BLOCKS.FIRE);
                                this.audio.playHit();
                                this.particles.emit({x: nx + 0.5, y: ny + 0.5, z: nz + 0.5}, 'fire', 8, 0xff5500);
                            }
                        }
                    }
                }
                this.input.mouse.rightClick = false;
                return;
            }`
);

// C: Rewrite igniteTNT and explodeTNT with cool flashing white fuse animation and block breaking
main = main.replace(
    /igniteTNT\(x, y, z\) \{[\s\S]*?explodeTNT\(x, y, z\) \{[\s\S]*?this\.audio\.playExplode\(\);\s*\}/,
    `igniteTNT(x, y, z) {
        // Prevent double ignition of the same block
        const key = \`\${x},\${y},\${z}\`;
        if (this.world.getBlock(x, y, z) !== window.BLOCKS.TNT) return;

        // Remove the block from the voxel world
        this.world.setBlock(x, y, z, window.BLOCKS.AIR);

        // Spawn a 3D Primed TNT mesh that flashes white like real Minecraft
        const geom = new THREE.BoxGeometry(0.98, 0.98, 0.98);
        const tntTopUV = this.atlas ? this.atlas.getUV(window.BLOCKS.TNT, 'top') : null;
        const tntSideUV = this.atlas ? this.atlas.getUV(window.BLOCKS.TNT, 'side') : null;
        const tntBotUV = this.atlas ? this.atlas.getUV(window.BLOCKS.TNT, 'bottom') : null;

        // Use Phong material with flashing white emissive
        const mat = new THREE.MeshPhongMaterial({
            map: this.atlas ? this.atlas.texture : null,
            emissive: new THREE.Color(0x000000),
            shininess: 0
        });

        // Set UVs for the BoxGeometry
        if (this.atlas && tntSideUV && tntTopUV && tntBotUV) {
            const uvAttr = geom.attributes.uv;
            const setFaceUV = (faceIdx, uvInfo) => {
                const u0 = uvInfo.u0, v0 = uvInfo.v0, u1 = uvInfo.u1, v1 = uvInfo.v1;
                // 4 vertices per face, 2 triangles: [0,1], [2,3], [4,5], [6,7]
                const base = faceIdx * 8;
                uvAttr.array[base + 0] = u0; uvAttr.array[base + 1] = v1;
                uvAttr.array[base + 2] = u1; uvAttr.array[base + 3] = v1;
                uvAttr.array[base + 4] = u0; uvAttr.array[base + 5] = v0;
                uvAttr.array[base + 6] = u1; uvAttr.array[base + 7] = v0;
            };
            setFaceUV(0, tntSideUV); // right (+X)
            setFaceUV(1, tntSideUV); // left (-X)
            setFaceUV(2, tntTopUV);  // top (+Y)
            setFaceUV(3, tntBotUV);  // bottom (-Y)
            setFaceUV(4, tntSideUV); // front (+Z)
            setFaceUV(5, tntSideUV); // back (-Z)
            uvAttr.needsUpdate = true;
        }

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        this.engine.scene.add(mesh);

        // Sound effect
        if (this.audio && this.audio.playFizz) this.audio.playFizz();

        // Primed TNT object with fuse countdown and jump velocity
        const primed = {
            mesh,
            mat,
            fuse: 3.2, // 3.2 seconds
            maxFuse: 3.2,
            velY: 3.5, // slight pop up
            x: x + 0.5,
            y: y + 0.5,
            z: z + 0.5
        };
        this.primedTNT.push(primed);
    }

    explodeTNT(x, y, z) {
        const radius = 4; // Expanded destruction radius
        const radiusSq = radius * radius;
        const blockAIR = window.BLOCKS.AIR;
        const blockBEDROCK = window.BLOCKS.BEDROCK;
        const blockWATER = window.BLOCKS.WATER;

        for (let ix = Math.floor(x - radius); ix <= Math.ceil(x + radius); ix++) {
            for (let iy = Math.floor(y - radius); iy <= Math.ceil(y + radius); iy++) {
                for (let iz = Math.floor(z - radius); iz <= Math.ceil(z + radius); iz++) {
                    const distSq = (ix - x) ** 2 + (iy - y) ** 2 + (iz - z) ** 2;
                    if (distSq <= radiusSq) {
                        const block = this.world.getBlock(ix, iy, iz);
                        if (block !== blockAIR && block !== blockBEDROCK && block !== blockWATER) {
                            if (block === window.BLOCKS.TNT) {
                                // Chain reaction!
                                this.igniteTNT(ix, iy, iz);
                            } else {
                                this.world.setBlock(ix, iy, iz, blockAIR);
                                // Spawn block debris particles
                                if (Math.random() < 0.2) {
                                    this.particles.emit(new THREE.Vector3(ix + 0.5, iy + 0.5, iz + 0.5), 'block_break', 1, 0x888888);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Damage nearby entities (mobs & bosses)
        for (const mob of this.entityManager.mobs) {
            const dist = mob.position.distanceTo(new THREE.Vector3(x, y, z));
            if (dist < radius + 2.5) {
                const dmg = Math.floor(65 * (1 - dist / (radius + 2.5)));
                mob.health -= dmg;
                // Knockback
                const knockDir = mob.position.clone().sub(new THREE.Vector3(x, y, z)).normalize();
                mob.velocity.add(knockDir.multiplyScalar(14));
                this.particles.emit(mob.position, 'blood', 6, 0xff0000);
            }
        }

        // Damage player
        const pDist = this.player.position.distanceTo(new THREE.Vector3(x, y, z));
        if (pDist < radius + 3.0) {
            const dmg = Math.floor(65 * (1 - pDist / (radius + 3.0)));
            this.player.takeDamage(dmg);
            // Knockback player
            const knockDir = this.player.position.clone().sub(new THREE.Vector3(x, y, z)).normalize();
            this.player.velocity.add(knockDir.multiplyScalar(15));
        }

        // Spectacular visual effects
        this.particles.emit(new THREE.Vector3(x, y, z), 'explosion', 70, 0xffaa00);
        this.particles.emit(new THREE.Vector3(x, y + 0.5, z), 'smoke', 25, 0x444444);
        if (this.audio && this.audio.playExplode) this.audio.playExplode();
    }`
);

// D: In loop update, update primedTNT (physics + white flashing + fuse trigger)
main = main.replace(
    /this\.particles\.update\(dt\);/,
    `this.particles.update(dt);

        // Update Primed TNT entities
        if (this.primedTNT && this.primedTNT.length > 0) {
            for (let i = this.primedTNT.length - 1; i >= 0; i--) {
                const tnt = this.primedTNT[i];
                tnt.fuse -= dt;

                // Physics: apply gravity and vertical velocity
                tnt.velY -= 15 * dt;
                tnt.y += tnt.velY * dt;
                
                // Collision with floor below
                const floorY = Math.floor(tnt.y - 0.45);
                const blockBelow = this.world.getBlock(Math.floor(tnt.x), floorY, Math.floor(tnt.z));
                if (blockBelow !== window.BLOCKS.AIR && blockBelow !== window.BLOCKS.WATER) {
                    tnt.y = floorY + 1 + 0.49;
                    tnt.velY = 0;
                }
                tnt.mesh.position.set(tnt.x, tnt.y, tnt.z);

                // Flashing white fuse animation!
                // Frequency increases as fuse gets closer to 0
                const flashFreq = 3 + (1 - tnt.fuse / tnt.maxFuse) * 15;
                const flash = Math.sin(tnt.fuse * flashFreq * Math.PI) > 0;
                if (flash) {
                    tnt.mat.emissive.setHex(0xffffff);
                    tnt.mesh.scale.set(1.08, 1.08, 1.08); // Slight swell
                } else {
                    tnt.mat.emissive.setHex(0x000000);
                    tnt.mesh.scale.set(1.0, 1.0, 1.0);
                }

                // Smoke puff while ticking
                if (Math.random() < dt * 6) {
                    this.particles.emit(new THREE.Vector3(tnt.x, tnt.y + 0.5, tnt.z), 'smoke', 2, 0xcccccc);
                }

                if (tnt.fuse <= 0) {
                    // Detonate!
                    this.engine.scene.remove(tnt.mesh);
                    tnt.mesh.geometry.dispose();
                    tnt.mat.dispose();
                    this.primedTNT.splice(i, 1);
                    this.explodeTNT(tnt.x, tnt.y, tnt.z);
                }
            }
        }`
);

fs.writeFileSync('slopcraft 3D/js/main.js', main);

console.log('Fire, TNT, Water, and Lava update complete!');
