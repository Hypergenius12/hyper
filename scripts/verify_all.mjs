import { LEVEL_DATA, getTotalStrawberries } from '../src/levels.js';
import { LevelEditor, DEFAULT_CUSTOM_LEVEL } from '../src/editor.js';

console.log('--- VERIFICATION SUITE ---');
console.log(`Campaign level count: ${LEVEL_DATA.length} (Expected: 40)`);
if (LEVEL_DATA.length !== 40) {
  throw new Error(`Expected 40 levels, got ${LEVEL_DATA.length}`);
}

const room40 = LEVEL_DATA[39];
console.log(`Room 40 name: "${room40.name}"`);
const hasFlag = room40.map.some(row => row.includes('F'));
console.log(`Room 40 contains summit flag (F): ${hasFlag}`);
if (!hasFlag) throw new Error('Room 40 missing summit flag F');

const totalBerries = getTotalStrawberries();
console.log(`Total campaign strawberries: ${totalBerries}`);

console.log(`Default custom level: "${DEFAULT_CUSTOM_LEVEL.name}" (${DEFAULT_CUSTOM_LEVEL.map[0].length}x${DEFAULT_CUSTOM_LEVEL.map.length})`);
console.log('All verifications passed!');
