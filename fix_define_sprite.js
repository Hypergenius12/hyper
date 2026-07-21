const fs = require('fs');
let code = fs.readFileSync('genesis/engine.js', 'utf8');

const oldFunc = `function defineSprite(id, width, height, drawFnOrString, imagePrompt) {
    let drawCode, drawFn;
    if (typeof drawFnOrString === 'function') {
        drawCode = drawFnOrString.toString();
        drawFn = drawFnOrString;
    } else {
        drawCode = drawFnOrString || '() => {}';
        try { drawFn = new Function('return ' + drawCode)(); } catch(e) { drawFn = () => {}; }
    }`;

const newFunc = `function defineSprite(id, width, height, drawFnOrString, imagePrompt) {
    let drawCode, drawFn;
    
    // Check if drawFnOrString is actually the imagePrompt (user skipped drawCode)
    if (typeof drawFnOrString === 'string' && !imagePrompt && !drawFnOrString.includes('ctx')) {
        imagePrompt = drawFnOrString;
        drawFnOrString = null;
    }

    if (typeof drawFnOrString === 'function') {
        drawCode = drawFnOrString.toString();
        drawFn = drawFnOrString;
    } else {
        drawCode = drawFnOrString || '() => {}';
        try { drawFn = new Function('return ' + drawCode)(); } catch(e) { drawFn = () => {}; }
    }`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('genesis/engine.js', code);
console.log("Fixed defineSprite polymorphism");
