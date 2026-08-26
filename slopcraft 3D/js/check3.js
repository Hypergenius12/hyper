const fs = require("fs");
const lines = fs.readFileSync("engine.js", "utf8").split("\n");
let start = 0, end = 0;
for(let i=0; i<lines.length; i++) {
    if(lines[i].includes("if (props.isCross) {")) {
        if(start === 0) start = i;
    }
    if(lines[i].includes("currentBlockType = blockType")) {
        end = i;
        break;
    }
}
console.log(lines.slice(start, end+1).join("\n"));
