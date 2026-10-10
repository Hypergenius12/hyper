import fs from 'fs';
import { validateRoom } from './validate_room.mjs';

// Load existing levels.js to get top and bottom portions
const levelsPath = 'c:/Users/Caleb.Abbe/Documents/antigravity/joyful-rutherford/src/levels.js';
const existingCode = fs.readFileSync(levelsPath, 'utf8');

const levelDataStartMarker = 'export const LEVEL_DATA = [';
const levelDataEndMarker = 'export class Level {';

const startIndex = existingCode.indexOf(levelDataStartMarker);
const endIndex = existingCode.indexOf(levelDataEndMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find markers in levels.js!');
  process.exit(1);
}

const headerPart = existingCode.slice(0, startIndex);
const footerPart = existingCode.slice(endIndex);

console.log('Found markers successfully!');
console.log('Header length:', headerPart.length);
console.log('Footer length:', footerPart.length);
