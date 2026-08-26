const fs = require("fs");
const code = fs.readFileSync("js/textures.js", "utf8");
const blocksMatch = code.match(/export const BLOCKS = \{([\s\S]*?)\};/);
const blockPropsMatch = code.match(/const BLOCK_PROPS = \{([\s\S]*?)};\n/);

const defined = new Set();
blocksMatch[1].split("\n").forEach(line => {
    const match = line.match(/\s*([A-Z0-9_]+)\s*:/);
    if(match) defined.add(match[1]);
});

const used = new Set();
blockPropsMatch[1].split("\n").forEach(line => {
    const match = line.match(/\[BLOCKS\.([A-Z0-9_]+)\]/);
    if(match) used.add(match[1]);
});

for(const block of used) {
    if(!defined.has(block)) {
        console.log("Missing:", block);
    }
}
