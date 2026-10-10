import fs from 'fs';
import { validateRoom } from './validate_room.mjs';

const levels = JSON.parse(fs.readFileSync('./scripts/user_levels.json', 'utf8'));
console.log('Total rooms:', levels.length);

let errors = 0;
levels.forEach((room, idx) => {
  try {
    const info = validateRoom(room, idx);
    console.log(`Room ${(idx+1).toString().padStart(2, '0')}: "${info.name}" (${info.cols}x${info.rows}) - OK!`);
  } catch (e) {
    console.error(`Room ${(idx+1).toString().padStart(2, '0')}: ERROR - ${e.message}`);
    errors++;
  }
});

if (errors === 0) {
  console.log('\nALL 40 ROOMS IN user_levels.json ARE 100% VALID!');
} else {
  console.log(`\nFound ${errors} errors in user_levels.json`);
}
