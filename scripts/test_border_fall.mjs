import { Level } from '../src/levels.js';

// Test level with an open pit / no blocks on bottom border
const testRoom = {
  name: "Open Abyss",
  map: [
    "################",
    "#P.............#",
    "#..............#",
    "#..............#",
    "#..............#",
    "................" // NO BLOCKS ON BOTTOM BORDER (row 5)
  ]
};

const level = new Level();
level.rows = testRoom.map.length;
level.cols = testRoom.map[0].length;
level.width = level.cols * 10;
level.height = level.rows * 10;
level.grid = testRoom.map.map(row => row.split('').map(ch => ch === '#' ? 1 : 0));

console.log('Testing isSolidTile:');
console.log('Tile at r=5 (bottom row of map, empty air):', level.isSolidTile(5, 5));
console.log('Tile at r=6 (r >= this.rows, below map):', level.isSolidTile(5, 6));

// Mock player falling down through the bottom border
const player = {
  x: 50,
  y: 10,
  width: 6,
  height: 9,
  dead: false,
  yRem: 0,
  vy: 200,
  onGround: false,
  isDreamPhasing: false,
  isDashing: false,
  kill(particles, shake, freeze) {
    this.dead = true;
    console.log('PLAYER KILLED! Died falling into abyss at y =', this.y);
  },
  collideAt(px, py, lvl) {
    const left = Math.floor(px / 10);
    const right = Math.floor((px + this.width - 1) / 10);
    const top = Math.floor(py / 10);
    const bottom = Math.floor((py + this.height - 1) / 10);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (lvl.isSolidTile(c, r)) return true;
      }
    }
    return false;
  },
  moveY(dy, lvl) {
    this.yRem += dy;
    let move = Math.round(this.yRem);
    if (move !== 0) {
      this.yRem -= move;
      const sign = Math.sign(move);
      while (move !== 0) {
        if (!this.collideAt(this.x, this.y + sign, lvl)) {
          this.y += sign;
          move -= sign;
        } else {
          this.vy = 0;
          break;
        }
      }
    }
  }
};

const particles = { emitDeathBurst: () => {} };
const shake = { add: () => {} };

console.log('\nSimulating fall through bottom border:');
for (let frame = 0; frame < 60; frame++) {
  player.moveY(player.vy * 0.016, level);
  level.update(0.016, player, particles, shake, () => {}, () => {}, () => {});
  if (player.dead) break;
}

if (!player.dead) {
  console.error('ERROR: Player did not die!');
} else {
  console.log('SUCCESS: Player fell through bottom border into the abyss and died cleanly!');
}
