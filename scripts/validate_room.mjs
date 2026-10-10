import fs from 'fs';

// Helper to pad or check row lengths
export function validateRoom(room, index) {
  const name = room.name || `Room ${index + 1}`;
  if (!Array.isArray(room.map) || room.map.length === 0) {
    throw new Error(`Room ${index} (${name}) has invalid map`);
  }
  const rows = room.map.length;
  const cols = room.map[0].length;

  for (let r = 0; r < rows; r++) {
    if (room.map[r].length !== cols) {
      throw new Error(`Room ${index} (${name}) row ${r} length ${room.map[r].length} !== cols ${cols}`);
    }
  }

  // Count P, E, F
  let pCount = 0;
  let eCount = 0;
  let fCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = room.map[r][c];
      if (ch === 'P') pCount++;
      if (ch === 'E') eCount++;
      if (ch === 'F') fCount++;
    }
  }

  if (pCount !== 1) {
    throw new Error(`Room ${index} (${name}) must have exactly 1 spawn 'P', found ${pCount}`);
  }

  if (index === 39) {
    if (fCount !== 1) {
      throw new Error(`Room 40 (${name}) must have exactly 1 summit flag 'F', found ${fCount}`);
    }
  } else {
    if (eCount !== 1) {
      throw new Error(`Room ${index + 1} (${name}) must have exactly 1 exit 'E', found ${eCount}`);
    }
  }

  return { name, rows, cols };
}

console.log('Validator loaded.');
