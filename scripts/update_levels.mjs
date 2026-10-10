import fs from 'fs';

// Read levels.js
const levelsJs = fs.readFileSync('src/levels.js', 'utf8');

// Find start of LEVEL_DATA
const markerStart = 'export const LEVEL_DATA = [';
const idxStart = levelsJs.indexOf(markerStart);
if (idxStart === -1) {
  throw new Error('Could not find LEVEL_DATA in src/levels.js');
}

// Find export class Level
const markerEnd = 'export class Level {';
const idxEnd = levelsJs.indexOf(markerEnd);
if (idxEnd === -1) {
  throw new Error('Could not find export class Level in src/levels.js');
}

// Read new levels json
const newLevelsJson = JSON.parse(fs.readFileSync('scripts/new_levels.json', 'utf8'));

// Format new LEVEL_DATA code
const formatted = `export const LEVEL_DATA = ${JSON.stringify(newLevelsJson, null, 2)};\n\n`;

const newLevelsJs = levelsJs.slice(0, idxStart) + formatted + levelsJs.slice(idxEnd);
fs.writeFileSync('src/levels.js', newLevelsJs, 'utf8');
console.log('Successfully updated src/levels.js with new levels!');
