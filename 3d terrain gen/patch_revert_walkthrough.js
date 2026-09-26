const fs = require('fs');
let lines = fs.readFileSync('/Users/2013mbp4gb128gb/.gemini/antigravity/brain/c370d10d-7df9-4a96-94d5-2333229e8d46/walkthrough.md', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('### Graphics Overhaul'));
if (startIdx > -1) {
    lines.splice(startIdx, lines.length - startIdx);
    fs.writeFileSync('/Users/2013mbp4gb128gb/.gemini/antigravity/brain/c370d10d-7df9-4a96-94d5-2333229e8d46/walkthrough.md', lines.join('\n'));
}
