const fs = require('fs');
let code = fs.readFileSync('genesis/engine.js', 'utf8');

// 1. api.spawn isUserSpawn
const spawnMatch = /spawn\(spriteId, options = \{\}\) \{\n\s+const y = options\.y \?\? CONFIG\.groundY;\n\s+return spawnEntity\(spriteId, \{ \.\.\.options, y \}\)\?\.id \|\| null;\n\s+\},/s;
const spawnReplacement = `spawn(spriteId, options = {}) {
        const y = options.y ?? CONFIG.groundY;
        return spawnEntity(spriteId, { ...options, y, isUserSpawn: true })?.id || null;
    },`;
code = code.replace(spawnMatch, spawnReplacement);

// 2 & 3. spawnEntity isUserSpawn and options.id
const spawnEntityMatch = /const def = world\.spriteDefinitions\[spriteId\];\n\s+const id = \`\$\{spriteId\}_\$\{\+\+world\.entityCounter\}\`;\n\n\s+const sprite = new PIXI\.Sprite\(texture\);\n\s+\/\/ Physics body\n\s+let physicsBody = null;\n\s+const pc = options\.physics;\n\s+\n\s+\/\/ Auto-adjust anchor and Y position for physics\n\s+if \(pc && pc\.type !== 'none'\) \{\n\s+options\.anchorX = options\.anchorX \?\? 0\.5;\n\s+options\.anchorY = options\.anchorY \?\? 0\.5; \/\/ Physics objects need center anchor\n\s+if \(options\.y === undefined || options\.y === CONFIG\.groundY\) \{\n\s+\/\/ Offset starting position so it doesn't spawn half-buried\n\s+options\.y = CONFIG\.groundY - \(def\.height \* \(options\.scaleY \?\? 1\) \* 0\.5\);\n\s+\}\n\s+\}/s;

const spawnEntityReplacement = `const def = world.spriteDefinitions[spriteId];
    const id = options.id || \`\${spriteId}_\${++world.entityCounter}\`;

    const sprite = new PIXI.Sprite(texture);
    // Physics body
    let physicsBody = null;
    const pc = options.physics;
    
    // Auto-adjust anchor and Y position for physics
    if (pc && pc.type !== 'none') {
        options.anchorX = options.anchorX ?? 0.5;
        options.anchorY = options.anchorY ?? 0.5; // Physics objects need center anchor
        if (options.isUserSpawn && (options.y === undefined || options.y === CONFIG.groundY)) {
            // Offset starting position so it doesn't spawn half-buried
            options.y = CONFIG.groundY - (def.height * (options.scaleY ?? 1) * 0.5);
        }
    }`;
code = code.replace(spawnEntityMatch, spawnEntityReplacement);

// 4. deserializeWorld options.id
const deserializeMatch = /const ent = spawnEntity\(ed\.spriteId, \{\n\s+x: ed\.x, y: ed\.y, scaleX: ed\.scaleX, scaleY: ed\.scaleY,\n\s+rotation: ed\.rotation, anchorX: ed\.anchorX, anchorY: ed\.anchorY,\n\s+zIndex: ed\.zIndex, physics: ed\.physicsConfig, properties: ed\.properties,\n\s+behaviors: ed\.behaviors,\n\s+\}\);\n\s+if \(ent\) ent\.id = ed\.id; \/\/ Preserve original ID/s;

const deserializeReplacement = `const ent = spawnEntity(ed.spriteId, {
            id: ed.id,
            x: ed.x, y: ed.y, scaleX: ed.scaleX, scaleY: ed.scaleY,
            rotation: ed.rotation, anchorX: ed.anchorX, anchorY: ed.anchorY,
            zIndex: ed.zIndex, physics: ed.physicsConfig, properties: ed.properties,
            behaviors: ed.behaviors,
        });`;
code = code.replace(deserializeMatch, deserializeReplacement);

// 5. modifyEntity scale
const modifyScaleMatch = /if \(changes\.scaleX !== undefined\) \{ ent\.scaleX = changes\.scaleX; if \(ent\.pixiSprite\) ent\.pixiSprite\.scale\.x = changes\.scaleX; \}\n\s+if \(changes\.scaleY !== undefined\) \{ ent\.scaleY = changes\.scaleY; if \(ent\.pixiSprite\) ent\.pixiSprite\.scale\.y = changes\.scaleY; \}/s;

const modifyScaleReplacement = `if (changes.scaleX !== undefined || changes.scaleY !== undefined) {
            const newScaleX = changes.scaleX ?? ent.scaleX;
            const newScaleY = changes.scaleY ?? ent.scaleY;
            if (ent.physicsBody) {
                // Matter.js scale is relative to current scale
                Matter.Body.scale(ent.physicsBody, newScaleX / ent.scaleX, newScaleY / ent.scaleY);
            }
            ent.scaleX = newScaleX;
            ent.scaleY = newScaleY;
            if (ent.pixiSprite) {
                ent.pixiSprite.scale.x = newScaleX;
                ent.pixiSprite.scale.y = newScaleY;
            }
        }`;
code = code.replace(modifyScaleMatch, modifyScaleReplacement);

// 6. defineSprite Texture memory leak
const defineSpriteMatch = /const texture = generateCanvasTexture\(width, height, drawFn\);\n\s+world\.spriteTextures\[id\] = texture;/s;
const defineSpriteReplacement = `const texture = generateCanvasTexture(width, height, drawFn);
    if (world.spriteTextures[id]) world.spriteTextures[id].destroy(true); // Prevent VRAM leak
    world.spriteTextures[id] = texture;`;
code = code.replace(defineSpriteMatch, defineSpriteReplacement);

const imageGenMatch = /world\.spriteTextures\[id\] = newTexture;\n\s+for \(const e of world\.entities\)/s;
const imageGenReplacement = `if (world.spriteTextures[id]) world.spriteTextures[id].destroy(true);
            world.spriteTextures[id] = newTexture;
            for (const e of world.entities)`;
code = code.replace(imageGenMatch, imageGenReplacement);


fs.writeFileSync('genesis/engine.js', code);
console.log("Applied logical fixes!");
