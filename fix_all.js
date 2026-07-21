const fs = require('fs');
let code = fs.readFileSync('genesis/engine.js', 'utf8');

// 1. processCommand signature
code = code.replace(/async function processCommand\(userInput\) \{/, 'async function processCommand(userInput, retryCount = 0) {');

// 2. Undo stack protection
code = code.replace(/pushUndo\(\);\n\n    world\.commandHistory\.push\(userInput\);/, 
`if (retryCount === 0) {
        pushUndo();
        world.commandHistory.push(userInput);
    }`);

// 3. parseAIResponse throw
code = code.replace(/return \{ message: 'Failed to parse AI response' \};/, 'throw new Error("Failed to parse valid JSON from AI response.");');

// 4. processCommand execution error
const execErrorMatch = /catch \(codeErr\) \{\n\s+console\.error\('AI code execution error:', codeErr\);\n\s+showToast\(\`Code error: \$\{codeErr\.message\}\`, 'error'\);\n\s+\}/;
const execErrorReplacement = `catch (codeErr) {
                console.error('AI code execution error:', codeErr);
                showToast(\`Code error: \${codeErr.message}\`, 'error');
                if (retryCount < 3) {
                    showToast('AI is fixing its own code...', 'info');
                    world.commandHistory.push(\`[SYSTEM ERROR DURING EXECUTION]: \${codeErr.message}. Fix the syntax or logic error and try again.\`);
                    return processCommand("Your previous code failed. Read the SYSTEM ERROR in the command history, find your mistake, and rewrite the code to fix it.", retryCount + 1);
                }
            }`;
code = code.replace(execErrorMatch, execErrorReplacement);

// 5. Global catch error
const globalCatchMatch = /catch \(err\) \{\n\s+console\.error\('Command failed:', err\);\n\s+showToast\(\`Failed: \$\{err\.message\}\`, 'error'\);\n\s+\/\/ Revert on error without overwriting the error toast\n\s+performUndo\(true\);\n\s+\}/;
const globalCatchReplacement = `catch (err) {
        console.error('Command failed:', err);
        showToast(\`Failed: \${err.message}\`, 'error');
        if (retryCount < 3 && err.message.includes("parse valid JSON")) {
            showToast('AI is fixing JSON format...', 'info');
            return processCommand("Your previous response was not valid JSON. Please respond with ONLY valid JSON.", retryCount + 1);
        } else if (retryCount === 0) {
            performUndo(true);
        }
    }`;
code = code.replace(globalCatchMatch, globalCatchReplacement);

// 6. spawnEntity physics anchor and position
const spawnEntityMatch = /sprite\.anchor\.set\(options\.anchorX \?\? 0\.5, options\.anchorY \?\? 1\.0\); \/\/ Bottom center by default\n    sprite\.position\.set\(options\.x \?\? 0, options\.y \?\? CONFIG\.groundY\);\n    sprite\.scale\.set\(options\.scaleX \?\? 1, options\.scaleY \?\? 1\);\n    sprite\.rotation = options\.rotation \?\? 0;\n    sprite\.zIndex = options\.zIndex \?\? 0;\n\n    \/\/ Make interactive for selection\n    sprite\.eventMode = 'static';\n    sprite\.cursor = 'pointer';\n\n    worldContainer\.addChild\(sprite\);\n\n    \/\/ Physics body\n    let physicsBody = null;\n    const pc = options\.physics;\n    if \(pc && pc\.type !== 'none'\) \{/s;

const spawnEntityReplacement = `// Physics body
    let physicsBody = null;
    const pc = options.physics;
    
    // Auto-adjust anchor and Y position for physics
    if (pc && pc.type !== 'none') {
        options.anchorX = options.anchorX ?? 0.5;
        options.anchorY = options.anchorY ?? 0.5; // Physics objects need center anchor
        if (options.y === undefined || options.y === CONFIG.groundY) {
            // Offset starting position so it doesn't spawn half-buried
            options.y = CONFIG.groundY - (def.height * (options.scaleY ?? 1) * 0.5);
        }
    }

    sprite.anchor.set(options.anchorX ?? 0.5, options.anchorY ?? 1.0); // Bottom center by default
    sprite.position.set(options.x ?? 0, options.y ?? CONFIG.groundY);
    sprite.scale.set(options.scaleX ?? 1, options.scaleY ?? 1);
    sprite.rotation = options.rotation ?? 0;
    sprite.zIndex = options.zIndex ?? 0;

    // Make interactive for selection
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    worldContainer.addChild(sprite);

    if (pc && pc.type !== 'none') {`;
code = code.replace(spawnEntityMatch, spawnEntityReplacement);

// 7. Physics body creation coordinate fix
// Find options.y ?? CONFIG.groundY in physicsBody creation and replace with options.y
const circleMatch = /physicsBody = Matter\.Bodies\.circle\(\n                options\.x \?\? 0,\n                options\.y \?\? CONFIG\.groundY,\n                pc\.radius \?\? 20,\n                bodyOptions\n            \);/s;
const circleReplacement = `physicsBody = Matter.Bodies.circle(
                options.x ?? 0,
                options.y,
                pc.radius ?? 20,
                bodyOptions
            );`;
code = code.replace(circleMatch, circleReplacement);

const rectMatch = /physicsBody = Matter\.Bodies\.rectangle\(\n                options\.x \?\? 0,\n                \(options\.y \?\? CONFIG\.groundY\) - bh \/ 2,\n                bw, bh,\n                bodyOptions\n            \);/s;
const rectReplacement = `physicsBody = Matter.Bodies.rectangle(
                options.x ?? 0,
                options.y,
                bw, bh,
                bodyOptions
            );`;
code = code.replace(rectMatch, rectReplacement);

// 8. buildSystemPrompt update
const promptUpdate1Match = /- imagePrompt \(OPTIONAL string\): A description of the asset for high-quality Grok Image generation \(e\.g\. "a highly detailed oak tree"\)\. If provided, the engine will fetch a photorealistic image and replace the canvas placeholder seamlessly!/;
const promptUpdate1Replacement = `- imagePrompt (OPTIONAL string): A description of the asset for high-quality Grok Image generation. **CRITICAL:** DO NOT use imagePrompt for simple primitives (e.g. "a red sphere", "a blue box"). For simple geometry, write procedural Canvas2D code. ONLY use imagePrompt for complex or photorealistic assets (e.g. "a detailed oak tree", "a character").`;
code = code.replace(promptUpdate1Match, promptUpdate1Replacement);

const promptUpdate2Match = /api\.defineSprite\('oak_tree', 100, 150, \(ctx, w, h\) => \{\n    \/\/ Placeholder drawing \(fast\)\n    ctx\.fillStyle = '#795548'; ctx\.fillRect\(40, 50, 20, 100\);\n    ctx\.fillStyle = '#4CAF50'; ctx\.beginPath\(\); ctx\.arc\(50, 40, 40, 0, Math\.PI\*2\); ctx\.fill\(\);\n\}, "a majestic oak tree with vibrant green leaves and detailed bark, transparent background, isolated 2d game asset"\);/;
const promptUpdate2Replacement = `api.defineSprite('oak_tree', 100, 150, (ctx, w, h) => {
    // Placeholder drawing (fast)
    ctx.fillStyle = '#795548'; ctx.fillRect(40, 50, 20, 100);
    ctx.fillStyle = '#4CAF50'; ctx.beginPath(); ctx.arc(50, 40, 40, 0, Math.PI*2); ctx.fill();
}, "a majestic oak tree with vibrant green leaves and detailed bark, transparent background, isolated 2d game asset");

Example red sphere (NO imagePrompt):
api.defineSprite('red_sphere', 50, 50, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(15, 15, 5, 25, 25, 25);
    grad.addColorStop(0, '#ffaaaa'); grad.addColorStop(1, '#aa0000');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(25, 25, 25, 0, Math.PI*2); ctx.fill();
});`;
code = code.replace(promptUpdate2Match, promptUpdate2Replacement);

const promptUpdate3Match = /## IMPORTANT RULES/;
const promptUpdate3Replacement = `## IMPORTANT RULES
0. ESCAPE YOUR CODE: Your JavaScript code must be structurally valid inside the JSON. Do NOT use unescaped backticks or quotes that break the JSON string!`;
code = code.replace(promptUpdate3Match, promptUpdate3Replacement);

fs.writeFileSync('genesis/engine.js', code);
console.log("All fixes applied successfully.");
