const fs = require('fs');

let trackCode = fs.readFileSync('js/track.js', 'utf8');

// Update Grass Rendering
trackCode = trackCode.replace(
    /ctx\.fillStyle = '#2d5a27'; \/\/ Dark green grass\n\s*ctx\.fillRect\(0, 0, this\.cols \* TILE_SIZE, this\.rows \* TILE_SIZE\);/,
    `ctx.fillStyle = '#111111'; // Dark background
        ctx.fillRect(0, 0, this.cols * TILE_SIZE, this.rows * TILE_SIZE);
        
        // Background grid dots
        ctx.fillStyle = '#333';
        for (let r = 0; r < this.rows * 5; r++) {
            for (let c = 0; c < this.cols * 5; c++) {
                ctx.fillRect(c * (TILE_SIZE/5), r * (TILE_SIZE/5), 2, 2);
            }
        }`
);

// Update Road Rendering function drawRoadPath
trackCode = trackCode.replace(
    /function drawRoadPath\(ctx, x1, y1, x2, y2, size\) \{[\s\S]*?\}/,
    `function drawRoadPath(ctx, x1, y1, x2, y2, size) {
    // Outer border
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = size * 0.85; ctx.lineCap = 'butt'; ctx.strokeStyle = '#fff'; ctx.stroke();
    // Inner road
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = size * 0.75; ctx.lineCap = 'butt'; ctx.strokeStyle = '#222'; ctx.stroke();
    // Center line
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = 2; ctx.setLineDash([20, 20]); ctx.strokeStyle = '#ff2a2a'; ctx.stroke(); ctx.setLineDash([]);
}`
);

// Update Road Rendering function drawRoadCurve
trackCode = trackCode.replace(
    /function drawRoadCurve\(ctx, cx, cy, radius, startAngle, endAngle, size\) \{[\s\S]*?\}/,
    `function drawRoadCurve(ctx, cx, cy, radius, startAngle, endAngle, size) {
    // Outer border
    ctx.beginPath(); ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = size * 0.85; ctx.lineCap = 'butt'; ctx.strokeStyle = '#fff'; ctx.stroke();
    // Inner road
    ctx.beginPath(); ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = size * 0.75; ctx.lineCap = 'butt'; ctx.strokeStyle = '#222'; ctx.stroke();
    // Center line
    ctx.beginPath(); ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 2; ctx.setLineDash([20, 20]); ctx.strokeStyle = '#ff2a2a'; ctx.stroke(); ctx.setLineDash([]);
}`
);

// Start line
trackCode = trackCode.replace(
    /function drawStartLine\(ctx, px, py, size, isVertical\) \{[\s\S]*?\}/,
    `function drawStartLine(ctx, px, py, size, isVertical) {
    const rw = size * 0.75;
    ctx.fillStyle = '#fff';
    if (isVertical) {
        for(let i=0; i<rw; i+=10) {
            ctx.fillStyle = (i/10)%2===0 ? '#fff' : '#111';
            ctx.fillRect(px, py - 6 + (i%20===0?0:6), 12, 10);
        }
    } else {
        for(let i=0; i<rw; i+=10) {
            ctx.fillStyle = (i/10)%2===0 ? '#fff' : '#111';
            ctx.fillRect(px - 6 + (i%20===0?0:6), py, 10, 12);
        }
    }
}`
);

fs.writeFileSync('js/track.js', trackCode);
console.log("Updated track.js");
