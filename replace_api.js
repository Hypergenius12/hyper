const fs = require('fs');
let code = fs.readFileSync('genesis/engine.js', 'utf8');

// 1. Add generateImageTexture function
const genImageCode = `
// ══════════════════════════════════════════════════════════════
// ASSET GENERATION
// ══════════════════════════════════════════════════════════════
async function generateImageTexture(prompt, width, height) {
    const apiKey = localStorage.getItem(CONFIG.keys.apiKey);
    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${apiKey}\`,
            'HTTP-Referer': window.location.href,
            'X-Title': 'Genesis'
        },
        body: JSON.stringify({
            model: "x-ai/grok-imagine-image-quality",
            prompt: prompt + ", transparent background, 2d game asset png, isolated, high quality, masterpiece",
            response_format: "b64_json"
        })
    });
    
    if (!response.ok) throw new Error("Image gen failed: " + response.status);
    const data = await response.json();
    
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;
    
    if (b64) {
        return PIXI.Texture.from('data:image/png;base64,' + b64);
    } else if (url) {
        return await PIXI.Assets.load(url);
    }
    throw new Error("No image data returned");
}

function generateCanvasTexture(width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    try { drawFn(ctx, width, height); } catch (err) {
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ERR', width / 2, height / 2 + 4);
    }
    return PIXI.Texture.from(canvas);
}
`;

if (!code.includes('generateImageTexture')) {
    code = code.replace('// SPRITE FACTORY', genImageCode + '\n// SPRITE FACTORY');
}

// 2. Update defineSprite
const defineSpriteMatch = /function defineSprite.*?return texture;\n}/s;
const newDefineSprite = `function defineSprite(id, width, height, drawFnOrString, imagePrompt) {
    let drawCode, drawFn;
    if (typeof drawFnOrString === 'function') {
        drawCode = drawFnOrString.toString();
        drawFn = drawFnOrString;
    } else {
        drawCode = drawFnOrString || '() => {}';
        try { drawFn = new Function('return ' + drawCode)(); } catch(e) { drawFn = () => {}; }
    }

    world.spriteDefinitions[id] = { width, height, drawCode, imagePrompt };

    const texture = generateCanvasTexture(width, height, drawFn);
    world.spriteTextures[id] = texture;

    if (imagePrompt) {
        generateImageTexture(imagePrompt, width, height).then(newTexture => {
            world.spriteTextures[id] = newTexture;
            for (const e of world.entities) {
                if (e.spriteId === id && e.pixiSprite) {
                    e.pixiSprite.texture = newTexture;
                }
            }
        }).catch(err => {
            console.error('Image gen failed:', err);
            showToast('Image gen failed: ' + err.message, 'error');
        });
    }

    return texture;
}`;
code = code.replace(defineSpriteMatch, newDefineSprite);

// 3. Update getOrCreateTexture
const gocMatch = /return defineSprite\(spriteId, def\.width, def\.height, def\.drawCode\);/;
code = code.replace(gocMatch, 'return defineSprite(spriteId, def.width, def.height, def.drawCode, def.imagePrompt);');

// 4. Update api.defineSprite
const apiMatch = /defineSprite\(id, width, height, drawFn\) \{.*?return id;\n    \}/s;
const newApi = `defineSprite(id, width, height, drawFn, imagePrompt) {
        defineSprite(id, width, height, drawFn, imagePrompt);
        return id;
    }`;
code = code.replace(apiMatch, newApi);

// 5. Update prompt
const promptMatch = /api\.defineSprite\(id, width, height, drawFunction\)\n- drawFunction receives.*?call defineSprite BEFORE spawning entities that use it\./s;
const newPrompt = `api.defineSprite(id, width, height, drawFunction, imagePrompt)
- drawFunction receives (ctx, w, h) where ctx is a Canvas2D context. This acts as a loading placeholder.
- imagePrompt (OPTIONAL string): A description of the asset for high-quality Grok Image generation (e.g. "a highly detailed oak tree"). If provided, the engine will fetch a photorealistic image and replace the canvas placeholder seamlessly!
- Call defineSprite BEFORE spawning entities that use it.`;
code = code.replace(promptMatch, newPrompt);

// 6. Update example in prompt
const exampleMatch = /api\.defineSprite\('oak_tree', 100, 150, \(ctx, w, h\) => \{.*?\}\);/s;
const newExample = `api.defineSprite('oak_tree', 100, 150, (ctx, w, h) => {
    // Placeholder drawing (fast)
    ctx.fillStyle = '#795548'; ctx.fillRect(40, 50, 20, 100);
    ctx.fillStyle = '#4CAF50'; ctx.beginPath(); ctx.arc(50, 40, 40, 0, Math.PI*2); ctx.fill();
}, "a majestic oak tree with vibrant green leaves and detailed bark, transparent background, isolated 2d game asset");`;
code = code.replace(exampleMatch, newExample);

// 7. Update deserializeWorld
const desMatch = /try \{ defineSprite\(id, def\.width, def\.height, def\.drawCode\); \}/;
code = code.replace(desMatch, 'try { defineSprite(id, def.width, def.height, def.drawCode, def.imagePrompt); }');

fs.writeFileSync('genesis/engine.js', code);
console.log("Replaced API successfully");
