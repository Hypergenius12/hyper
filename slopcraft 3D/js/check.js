const fs = require("fs");
const code = fs.readFileSync("engine.js", "utf8");
let depth = 0;
const lines = code.split("\n");
for(let i=0; i<lines.length; i++) {
    let open = (lines[i].match(/\{/g) || []).length;
    let close = (lines[i].match(/\}/g) || []).length;
    depth += open - close;
    if(lines[i].includes("dispose() {")) {
        console.log("Line " + (i+1) + " depth after: " + depth);
    }
}
