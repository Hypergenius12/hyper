const fs = require('fs');

let sys = fs.readFileSync('slopcraft 3D/js/systems.js', 'utf8');

// 1. Allow 'creative' in srcType check for standard drop
sys = sys.replace(
    /const standardTypes = \['inventory', 'crafting', 'chest', 'furnace', 'wand'\];\s*if \(standardTypes\.includes\(srcType\) && standardTypes\.includes\(targetType\)\) \{/,
    `const standardTypes = ['inventory', 'crafting', 'chest', 'furnace', 'wand'];
        if ((standardTypes.includes(srcType) || srcType === 'creative') && standardTypes.includes(targetType)) {`
);

// 2. In setListSlot and getListSlot, handle srcType === 'creative' cleanly
sys = sys.replace(
    /const setListSlot = \(lType, idx, val\) => \{/,
    `const setListSlot = (lType, idx, val) => {
                if (lType === 'creative') return; // Endless creative source, discard swaps`
);

// 3. In the swap/merge branch, if srcType === 'creative' and targetSlot has a different item, overwrite or swap safely
sys = sys.replace(
    /setListSlot\(srcType, srcIndex, targetSlot\);\s*setListSlot\(targetType, targetIndex, itemData\);/,
    `if (srcType !== 'creative') {
                    setListSlot(srcType, srcIndex, targetSlot);
                }
                setListSlot(targetType, targetIndex, itemData);`
);

fs.writeFileSync('slopcraft 3D/js/systems.js', sys);
console.log('Creative drop support added to systems.js!');
