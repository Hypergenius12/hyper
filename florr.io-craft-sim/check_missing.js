const fs = require('fs');

const content = fs.readFileSync('script.js', 'utf-8');

const knownMatch = content.match(/const KNOWN_PETALS = \{([\s\S]*?)\};/);
let knownPetals = [];
if (knownMatch) {
    const lines = knownMatch[1].split('\n');
    for (const line of lines) {
        const match = line.match(/"?([\w]+)"?\s*:/);
        if (match) {
            knownPetals.push(match[1]);
        }
    }
}

const dataMatch = content.match(/const PETAL_DATA = \{([\s\S]*?)\n\};/);
let dataPetals = [];
if (dataMatch) {
    const lines = dataMatch[1].split('\n');
    for (const line of lines) {
        // match exactly 4 spaces then string then colon
        const match = line.match(/^ {4}"([^"]+)"\s*:\s*\{/);
        if (match) {
            dataPetals.push(match[1]);
        }
    }
}

const missing = knownPetals.filter(p => !dataPetals.includes(p));
console.log(`Total known: ${knownPetals.length}`);
console.log(`Total with data: ${dataPetals.length}`);
console.log(`Missing (${missing.length}):`, missing.join(', '));
