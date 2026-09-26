const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');

code = code.replace(/if \(document\.pointerLockElement !== document\.body\) \{[\s\S]*?\}\n\s*else \{/g, 
`if (document.pointerLockElement !== document.body) {
        const t = time * 0.0001;
        camera.position.set(Math.cos(t) * 120, 80, Math.sin(t) * 120);
        camera.lookAt(0, -20, 0);
    } else {`);

fs.writeFileSync('js/main.js', code);
