const fs = require('fs');
let lines = fs.readFileSync('js/props.js', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('function addSway(material, amount, freq) {'));
const endIdx = lines.findIndex(l => l.includes('addSway(window.PropMaterials.palmLeaf, 0.4, 2.5);'));

if (startIdx > -1 && endIdx > -1) {
    lines.splice(startIdx, endIdx - startIdx + 1);
}
fs.writeFileSync('js/props.js', lines.join('\n'));
