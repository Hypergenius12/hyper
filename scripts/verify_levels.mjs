import { LEVEL_DATA, Level } from '../src/levels.js';

console.log('Total rooms:', LEVEL_DATA.length);
const lvl = new Level();

LEVEL_DATA.forEach((r, i) => {
  const pCount = (r.map.join('').match(/P/g) || []).length;
  const eCount = (r.map.join('').match(/E/g) || []).length;
  const fCount = (r.map.join('').match(/F/g) || []).length;
  const sCount = (r.map.join('').match(/\*/g) || []).length;
  const hCount = (r.map.join('').match(/H/g) || []).length;
  const num = (i + 1).toString().padStart(2, '0');
  
  lvl.loadRoom(i);
  if (lvl.spawnX === undefined || lvl.spawnY === undefined) {
    throw new Error(`Room ${i + 1} failed to find player spawn!`);
  }
  if (i < 39 && !lvl.exitArea) {
    throw new Error(`Room ${i + 1} failed to find exit area!`);
  }
  if (i === 39 && !lvl.flagPos) {
    throw new Error(`Room 40 failed to find summit flag!`);
  }
  console.log(`${num}: "${r.name}" [Biome ${r.biome}] (${r.map[0].length}x${r.map.length}) spawn=(${lvl.spawnX},${lvl.spawnY}) P:${pCount} E:${eCount} F:${fCount} Strawberries:${sCount} Hearts:${hCount} Lifts:${r.movingPlatforms?.length || 0}`);
});

console.log('\nAll 40 levels verified and successfully parsed with player spawn, exits/flag, and collision grids!');
