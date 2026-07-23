// ========================================
// Track.js — Grid-based Track Editor and Rendering
// ========================================

const TILE_SIZE = 100;
const TILE_COLOR_GRASS = '#2b303a';
const TILE_COLOR_ROAD = '#1e1e24';
const TILE_COLOR_STRIPE = '#eebc1f';
const TILE_COLOR_WALL = '#ff3366';
const TILE_COLOR_BOOST = '#ff0055';
const TILE_COLOR_START = '#00ffcc';
const TILE_COLOR_ROUGH = '#5c4033'; // Mud brown
const TILE_COLOR_ICE = '#a0e6ff'; // Ice blue

const teleporterImg = new Image();
teleporterImg.src = 'img/teleporter.png';

// Tile types with their connection ports (top, right, bottom, left)
const TILE_TYPES = {
    EMPTY: { id: 0, ports: [0, 0, 0, 0], render: null },
    AUTO_DRAW: { id: 99, ports: [0, 0, 0, 0], render: renderAutoDraw },
    STRAIGHT_V: { id: 1, ports: [1, 0, 1, 0], render: renderStraightV },
    STRAIGHT_H: { id: 2, ports: [0, 1, 0, 1], render: renderStraightH },
    CURVE_TR: { id: 3, ports: [1, 1, 0, 0], render: renderCurveTR }, // Top & Right
    CURVE_BR: { id: 4, ports: [0, 1, 1, 0], render: renderCurveBR }, // Bottom & Right
    CURVE_BL: { id: 5, ports: [0, 0, 1, 1], render: renderCurveBL }, // Bottom & Left
    CURVE_TL: { id: 6, ports: [1, 0, 0, 1], render: renderCurveTL }, // Top & Left
    START_H: { id: 7, ports: [0, 1, 0, 1], render: renderStartH, isStart: true },
    START_V: { id: 8, ports: [1, 0, 1, 0], render: renderStartV, isStart: true },
    CROSSROAD_H_OVER: { id: 9, ports: [1, 1, 1, 1], render: renderCrossroadHOver },
    START_CURVE_TR: { id: 10, ports: [1, 1, 0, 0], render: renderStartCurveTR, isStart: true },
    START_CURVE_BR: { id: 11, ports: [0, 1, 1, 0], render: renderStartCurveBR, isStart: true },
    START_CURVE_BL: { id: 12, ports: [0, 0, 1, 1], render: renderStartCurveBL, isStart: true },
    START_CURVE_TL: { id: 13, ports: [1, 0, 0, 1], render: renderStartCurveTL, isStart: true },
    BOTTLENECK_H: { id: 14, ports: [0, 1, 0, 1], render: renderBottleneckH },
    BOTTLENECK_V: { id: 15, ports: [1, 0, 1, 0], render: renderBottleneckV },
    BOOST_UP: { id: 16, ports: [1, 0, 1, 0], render: renderBoostUp },
    BOOST_RIGHT: { id: 17, ports: [0, 1, 0, 1], render: renderBoostRight },
    BOOST_DOWN: { id: 18, ports: [1, 0, 1, 0], render: renderBoostDown },
    BOOST_LEFT: { id: 19, ports: [0, 1, 0, 1], render: renderBoostLeft },
    BOTTLENECK_CURVE_TR: { id: 20, ports: [1, 1, 0, 0], render: renderBottleneckCurveTR },
    BOTTLENECK_CURVE_BR: { id: 21, ports: [0, 1, 1, 0], render: renderBottleneckCurveBR },
    BOTTLENECK_CURVE_BL: { id: 22, ports: [0, 0, 1, 1], render: renderBottleneckCurveBL },
    BOTTLENECK_CURVE_TL: { id: 23, ports: [1, 0, 0, 1], render: renderBottleneckCurveTL },
    SPLIT_UP: { id: 24, ports: [0, 1, 1, 1], render: renderSplitUp },
    SPLIT_RIGHT: { id: 25, ports: [1, 0, 1, 1], render: renderSplitRight },
    SPLIT_DOWN: { id: 26, ports: [1, 1, 0, 1], render: renderSplitDown },
    SPLIT_LEFT: { id: 27, ports: [1, 1, 1, 0], render: renderSplitLeft },
    RAMP_UP: { id: 28, ports: [1, 0, 1, 0], render: renderRampUp },
    RAMP_RIGHT: { id: 29, ports: [0, 1, 0, 1], render: renderRampRight },
    RAMP_DOWN: { id: 30, ports: [1, 0, 1, 0], render: renderRampDown },
    RAMP_LEFT: { id: 31, ports: [0, 1, 0, 1], render: renderRampLeft },
    TELEPORT_UP: { id: 32, ports: [0, 0, 1, 0], render: renderTeleportUp },
    TELEPORT_RIGHT: { id: 33, ports: [0, 0, 0, 1], render: renderTeleportRight },
    TELEPORT_DOWN: { id: 34, ports: [1, 0, 0, 0], render: renderTeleportDown },
    TELEPORT_LEFT: { id: 35, ports: [0, 1, 0, 0], render: renderTeleportLeft },
    ROUGH_STRAIGHT_V: { id: 36, ports: [1, 0, 1, 0], render: renderRoughStraightV },
    ROUGH_STRAIGHT_H: { id: 37, ports: [0, 1, 0, 1], render: renderRoughStraightH },
    ROUGH_CURVE_TR: { id: 38, ports: [1, 1, 0, 0], render: renderRoughCurveTR },
    ROUGH_CURVE_BR: { id: 39, ports: [0, 1, 1, 0], render: renderRoughCurveBR },
    ROUGH_CURVE_BL: { id: 40, ports: [0, 0, 1, 1], render: renderRoughCurveBL },
    ROUGH_CURVE_TL: { id: 41, ports: [1, 0, 0, 1], render: renderRoughCurveTL },
    ICE_STRAIGHT_V: { id: 42, ports: [1, 0, 1, 0], render: renderIceStraightV },
    ICE_STRAIGHT_H: { id: 43, ports: [0, 1, 0, 1], render: renderIceStraightH },
    ICE_CURVE_TR: { id: 44, ports: [1, 1, 0, 0], render: renderIceCurveTR },
    ICE_CURVE_BR: { id: 45, ports: [0, 1, 1, 0], render: renderIceCurveBR },
    ICE_CURVE_BL: { id: 46, ports: [0, 0, 1, 1], render: renderIceCurveBL },
    ICE_CURVE_TL: { id: 47, ports: [1, 0, 0, 1], render: renderIceCurveTL },
    INTERSECTION: { id: 48, ports: [1, 1, 1, 1], render: renderIntersection },
    BOUNCY_STRAIGHT_V: { id: 49, ports: [1, 0, 1, 0], render: renderBouncyStraightV },
    BOUNCY_STRAIGHT_H: { id: 50, ports: [0, 1, 0, 1], render: renderBouncyStraightH },
    BOUNCY_CURVE_TR: { id: 51, ports: [1, 1, 0, 0], render: renderBouncyCurveTR },
    BOUNCY_CURVE_BR: { id: 52, ports: [0, 1, 1, 0], render: renderBouncyCurveBR },
    BOUNCY_CURVE_BL: { id: 53, ports: [0, 0, 1, 1], render: renderBouncyCurveBL },
    BOUNCY_CURVE_TL: { id: 54, ports: [1, 0, 0, 1], render: renderBouncyCurveTL },
    PUDDLE_STRAIGHT_V: { id: 55, ports: [1, 0, 1, 0], render: renderPuddleStraightV },
    PUDDLE_STRAIGHT_H: { id: 56, ports: [0, 1, 0, 1], render: renderPuddleStraightH },
    PUDDLE_CURVE_TR: { id: 57, ports: [1, 1, 0, 0], render: renderPuddleCurveTR },
    PUDDLE_CURVE_BR: { id: 58, ports: [0, 1, 1, 0], render: renderPuddleCurveBR },
    PUDDLE_CURVE_BL: { id: 59, ports: [0, 0, 1, 1], render: renderPuddleCurveBL },
    PUDDLE_CURVE_TL: { id: 60, ports: [1, 0, 0, 1], render: renderPuddleCurveTL },
    FAST_STRAIGHT_V: { id: 61, ports: [1, 0, 1, 0], render: renderFastStraightV },
    FAST_STRAIGHT_H: { id: 62, ports: [0, 1, 0, 1], render: renderFastStraightH },
    FAST_CURVE_TR: { id: 63, ports: [1, 1, 0, 0], render: renderFastCurveTR },
    FAST_CURVE_BR: { id: 64, ports: [0, 1, 1, 0], render: renderFastCurveBR },
    FAST_CURVE_BL: { id: 65, ports: [0, 0, 1, 1], render: renderFastCurveBL },
    FAST_CURVE_TL: { id: 66, ports: [1, 0, 0, 1], render: renderFastCurveTL },
    CROSSROAD_V_OVER: { id: 67, ports: [1, 1, 1, 1], render: renderCrossroadVOver }
};

// ========================================
// Tile Render Functions
// ========================================

function renderIntersection(ctx, x, y, size) {
    const hw = size * 0.85; 
    const iw = size * 0.80; 
    
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x + (size - hw) / 2, y, hw, size);
    ctx.fillRect(x, y + (size - hw) / 2, size, hw);
    
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(x + (size - iw) / 2, y, iw, size);
    ctx.fillRect(x, y + (size - iw) / 2, size, iw);
}

function renderAutoDraw(ctx, x, y, size) {
    ctx.fillStyle = 'rgba(200, 100, 255, 0.5)';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#c864ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x + 5, y + 5, size - 10, size - 10);
    ctx.setLineDash([]);
}

function renderStraightV(ctx, x, y, size) { drawRoadPath(ctx, x + size / 2, y, x + size / 2, y + size, size); }
function renderStraightH(ctx, x, y, size) { drawRoadPath(ctx, x, y + size / 2, x + size, y + size / 2, size); }
function renderCurveTR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y, size / 2, Math.PI / 2, Math.PI, size); }
function renderCurveBR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y + size, size / 2, Math.PI, Math.PI * 1.5, size); }
function renderCurveBL(ctx, x, y, size) { drawRoadCurve(ctx, x, y + size, size / 2, Math.PI * 1.5, Math.PI * 2, size); }
function renderCurveTL(ctx, x, y, size) { drawRoadCurve(ctx, x, y, size / 2, 0, Math.PI / 2, size); }

function renderRoughStraightV(ctx, x, y, size) { drawRoadPath(ctx, x + size / 2, y, x + size / 2, y + size, size, TILE_COLOR_ROUGH); }
function renderRoughStraightH(ctx, x, y, size) { drawRoadPath(ctx, x, y + size / 2, x + size, y + size / 2, size, TILE_COLOR_ROUGH); }
function renderRoughCurveTR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y, size / 2, Math.PI / 2, Math.PI, size, TILE_COLOR_ROUGH); }
function renderRoughCurveBR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y + size, size / 2, Math.PI, Math.PI * 1.5, size, TILE_COLOR_ROUGH); }
function renderRoughCurveBL(ctx, x, y, size) { drawRoadCurve(ctx, x, y + size, size / 2, Math.PI * 1.5, Math.PI * 2, size, TILE_COLOR_ROUGH); }
function renderRoughCurveTL(ctx, x, y, size) { drawRoadCurve(ctx, x, y, size / 2, 0, Math.PI / 2, size, TILE_COLOR_ROUGH); }

function renderIceStraightV(ctx, x, y, size) { drawRoadPath(ctx, x + size / 2, y, x + size / 2, y + size, size, TILE_COLOR_ICE, '#ffffff'); }
function renderIceStraightH(ctx, x, y, size) { drawRoadPath(ctx, x, y + size / 2, x + size, y + size / 2, size, TILE_COLOR_ICE, '#ffffff'); }
function renderIceCurveTR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y, size / 2, Math.PI / 2, Math.PI, size, TILE_COLOR_ICE, '#ffffff'); }
function renderIceCurveBR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y + size, size / 2, Math.PI, Math.PI * 1.5, size, TILE_COLOR_ICE, '#ffffff'); }
function renderIceCurveBL(ctx, x, y, size) { drawRoadCurve(ctx, x, y + size, size / 2, Math.PI * 1.5, Math.PI * 2, size, TILE_COLOR_ICE, '#ffffff'); }
function renderIceCurveTL(ctx, x, y, size) { drawRoadCurve(ctx, x, y, size / 2, 0, Math.PI / 2, size, TILE_COLOR_ICE, '#ffffff'); }

const TILE_COLOR_BOUNCY = '#800080';
function renderBouncyStraightV(ctx, x, y, size) { drawRoadPath(ctx, x + size / 2, y, x + size / 2, y + size, size, TILE_COLOR_ROAD, TILE_COLOR_BOUNCY); }
function renderBouncyStraightH(ctx, x, y, size) { drawRoadPath(ctx, x, y + size / 2, x + size, y + size / 2, size, TILE_COLOR_ROAD, TILE_COLOR_BOUNCY); }
function renderBouncyCurveTR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y, size / 2, Math.PI / 2, Math.PI, size, TILE_COLOR_ROAD, TILE_COLOR_BOUNCY); }
function renderBouncyCurveBR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y + size, size / 2, Math.PI, Math.PI * 1.5, size, TILE_COLOR_ROAD, TILE_COLOR_BOUNCY); }
function renderBouncyCurveBL(ctx, x, y, size) { drawRoadCurve(ctx, x, y + size, size / 2, Math.PI * 1.5, Math.PI * 2, size, TILE_COLOR_ROAD, TILE_COLOR_BOUNCY); }
function renderBouncyCurveTL(ctx, x, y, size) { drawRoadCurve(ctx, x, y, size / 2, 0, Math.PI / 2, size, TILE_COLOR_ROAD, TILE_COLOR_BOUNCY); }

const TILE_COLOR_PUDDLE = '#0066aa';
function renderPuddleStraightV(ctx, x, y, size) { drawRoadPath(ctx, x + size / 2, y, x + size / 2, y + size, size, TILE_COLOR_PUDDLE, '#3399ff'); }
function renderPuddleStraightH(ctx, x, y, size) { drawRoadPath(ctx, x, y + size / 2, x + size, y + size / 2, size, TILE_COLOR_PUDDLE, '#3399ff'); }
function renderPuddleCurveTR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y, size / 2, Math.PI / 2, Math.PI, size, TILE_COLOR_PUDDLE, '#3399ff'); }
function renderPuddleCurveBR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y + size, size / 2, Math.PI, Math.PI * 1.5, size, TILE_COLOR_PUDDLE, '#3399ff'); }
function renderPuddleCurveBL(ctx, x, y, size) { drawRoadCurve(ctx, x, y + size, size / 2, Math.PI * 1.5, Math.PI * 2, size, TILE_COLOR_PUDDLE, '#3399ff'); }
function renderPuddleCurveTL(ctx, x, y, size) { drawRoadCurve(ctx, x, y, size / 2, 0, Math.PI / 2, size, TILE_COLOR_PUDDLE, '#3399ff'); }

const TILE_COLOR_FAST = '#ffaa00'; // Orange
function renderFastStraightV(ctx, x, y, size) { drawRoadPath(ctx, x + size / 2, y, x + size / 2, y + size, size, TILE_COLOR_FAST, '#ffdd44'); }
function renderFastStraightH(ctx, x, y, size) { drawRoadPath(ctx, x, y + size / 2, x + size, y + size / 2, size, TILE_COLOR_FAST, '#ffdd44'); }
function renderFastCurveTR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y, size / 2, Math.PI / 2, Math.PI, size, TILE_COLOR_FAST, '#ffdd44'); }
function renderFastCurveBR(ctx, x, y, size) { drawRoadCurve(ctx, x + size, y + size, size / 2, Math.PI, Math.PI * 1.5, size, TILE_COLOR_FAST, '#ffdd44'); }
function renderFastCurveBL(ctx, x, y, size) { drawRoadCurve(ctx, x, y + size, size / 2, Math.PI * 1.5, Math.PI * 2, size, TILE_COLOR_FAST, '#ffdd44'); }
function renderFastCurveTL(ctx, x, y, size) { drawRoadCurve(ctx, x, y, size / 2, 0, Math.PI / 2, size, TILE_COLOR_FAST, '#ffdd44'); }

function renderStartH(ctx, x, y, size) {
    renderStraightH(ctx, x, y, size);
    drawStartLine(ctx, x + size / 2, y + size / 2, size, false);
}
function renderStartV(ctx, x, y, size) {
    renderStraightV(ctx, x, y, size);
    drawStartLine(ctx, x + size / 2, y + size / 2, size, true);
}
function renderCrossroadHOver(ctx, x, y, size) {
    // Underpass
    renderStraightV(ctx, x, y, size);

    // Overpass
    renderStraightH(ctx, x, y, size);
}

function renderCrossroadVOver(ctx, x, y, size) {
    // Underpass
    renderStraightH(ctx, x, y, size);

    // Overpass
    renderStraightV(ctx, x, y, size);
}

function renderStartCurveTR(ctx, x, y, size) {
    renderCurveTR(ctx, x, y, size);
    const cx = x + size, cy = y, R = size / 2, a = 3 * Math.PI / 4;
    drawStartLineRotated(ctx, cx + Math.cos(a)*R, cy + Math.sin(a)*R, size, a);
}
function renderStartCurveBR(ctx, x, y, size) {
    renderCurveBR(ctx, x, y, size);
    const cx = x + size, cy = y + size, R = size / 2, a = 5 * Math.PI / 4;
    drawStartLineRotated(ctx, cx + Math.cos(a)*R, cy + Math.sin(a)*R, size, a);
}
function renderStartCurveBL(ctx, x, y, size) {
    renderCurveBL(ctx, x, y, size);
    const cx = x, cy = y + size, R = size / 2, a = 7 * Math.PI / 4;
    drawStartLineRotated(ctx, cx + Math.cos(a)*R, cy + Math.sin(a)*R, size, a);
}
function renderStartCurveTL(ctx, x, y, size) {
    renderCurveTL(ctx, x, y, size);
    const cx = x, cy = y, R = size / 2, a = Math.PI / 4;
    drawStartLineRotated(ctx, cx + Math.cos(a)*R, cy + Math.sin(a)*R, size, a);
}

function drawBottleneckShape(ctx, cx, cy, size, isVertical, isWhiteCollision = false) {
    ctx.save();
    ctx.translate(cx, cy);
    if (isVertical) ctx.rotate(Math.PI / 2);

    const length = size; // no overlap needed with cache
    const l2 = length / 2;
    
    const drawShape = (wBig, wSmall, color) => {
        const wb = wBig / 2;
        const ws = wSmall / 2;
        ctx.beginPath();
        ctx.moveTo(-l2, -wb);
        ctx.bezierCurveTo(-l2 * 0.4, -wb, -l2 * 0.4, -ws, 0, -ws);
        ctx.bezierCurveTo( l2 * 0.4, -ws,  l2 * 0.4, -wb, l2, -wb);
        
        ctx.lineTo(l2, wb);
        ctx.bezierCurveTo( l2 * 0.4, wb,  l2 * 0.4, ws, 0, ws);
        ctx.bezierCurveTo(-l2 * 0.4, ws, -l2 * 0.4, wb, -l2, wb);
        ctx.closePath();
        
        ctx.fillStyle = color;
        ctx.fill();
    };

    if (isWhiteCollision) {
        drawShape(size * 0.8, size * 0.4, '#ffffff');
    } else {
        drawShape(size * 0.85, size * 0.45, '#cccccc'); // border
        drawShape(size * 0.80, size * 0.40, '#1e1e24'); // road
        
        // Center line
        ctx.beginPath(); ctx.moveTo(-l2, 0); ctx.lineTo(l2, 0);
        ctx.lineWidth = 2; ctx.setLineDash([15, 15]);
        ctx.strokeStyle = '#eebc1f';
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    ctx.restore();
}

function renderBottleneckV(ctx, x, y, size) {
    drawBottleneckShape(ctx, x + size / 2, y + size / 2, size, true);
}
function renderBottleneckH(ctx, x, y, size) {
    drawBottleneckShape(ctx, x + size / 2, y + size / 2, size, false);
}

function drawBoostArrows(ctx, cx, cy, angle, size) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;
    
    for (let i = -0.5; i <= 0.5; i += 1) {
        ctx.beginPath();
        const ox = i * (size * 0.3);
        ctx.moveTo(ox - size * 0.1, -size * 0.3);
        ctx.lineTo(ox + size * 0.2, 0);
        ctx.lineTo(ox - size * 0.1, size * 0.3);
        ctx.lineTo(ox - size * 0.0, 0);
        ctx.fill();
    }
    ctx.restore();
}

function renderBoostUp(ctx, x, y, size) {
    renderStraightV(ctx, x, y, size);
    drawBoostArrows(ctx, x + size/2, y + size/2, -Math.PI/2, size);
}
function renderBoostRight(ctx, x, y, size) {
    renderStraightH(ctx, x, y, size);
    drawBoostArrows(ctx, x + size/2, y + size/2, 0, size);
}
function renderBoostDown(ctx, x, y, size) {
    renderStraightV(ctx, x, y, size);
    drawBoostArrows(ctx, x + size/2, y + size/2, Math.PI/2, size);
}
function renderBoostLeft(ctx, x, y, size) {
    renderStraightH(ctx, x, y, size);
    drawBoostArrows(ctx, x + size/2, y + size/2, Math.PI, size);
}

// ========================================
// Road Drawing Helpers
// ========================================

// Seeded simple hash for deterministic "random" tire marks per position
function _tireHash(a, b, i) {
    let h = (a * 2654435761 + b * 40503 + i * 12345) >>> 0;
    return (h % 1000) / 1000;
}

function drawRoadPath(ctx, x1, y1, x2, y2, size, roadColor = '#1e1e24', borderColor = '#cccccc') {
    // Outer border (clean white/grey)
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = size * 0.85; ctx.lineCap = 'butt';
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Inner dark road (matte asphalt)
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = size * 0.80;
    ctx.strokeStyle = roadColor;
    ctx.stroke();

    // Center line (clean yellow/white dashes)
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = 2; ctx.setLineDash([15, 15]);
    ctx.strokeStyle = '#eebc1f';
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawRoadCurve(ctx, cx, cy, radius, startAngle, endAngle, size, roadColor = '#1e1e24', borderColor = '#cccccc') {
    // Outer border
    ctx.beginPath(); ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = size * 0.85; ctx.lineCap = 'butt';
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Inner dark road
    ctx.beginPath(); ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = size * 0.80;
    ctx.strokeStyle = roadColor;
    ctx.stroke();

    // Center line
    ctx.beginPath(); ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 2; ctx.setLineDash([15, 15]);
    ctx.strokeStyle = '#eebc1f';
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawBottleneckCurveShape(ctx, cx, cy, radius, startAngle, endAngle, size, isWhiteCollision = false) {
    const drawArcShape = (wMax, wMin, color) => {
        const steps = 20;
        const angleRange = endAngle - startAngle;
        
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const currentAngle = startAngle + t * angleRange;
            const blend = (1 - Math.cos(t * Math.PI * 2)) / 2;
            const w = wMax - blend * (wMax - wMin);
            const rOuter = radius + w / 2;
            ctx.lineTo(cx + Math.cos(currentAngle) * rOuter, cy + Math.sin(currentAngle) * rOuter);
        }
        for (let i = steps; i >= 0; i--) {
            const t = i / steps;
            const currentAngle = startAngle + t * angleRange;
            const blend = (1 - Math.cos(t * Math.PI * 2)) / 2;
            const w = wMax - blend * (wMax - wMin);
            const rInner = radius - w / 2;
            ctx.lineTo(cx + Math.cos(currentAngle) * rInner, cy + Math.sin(currentAngle) * rInner);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    };

    if (isWhiteCollision) {
        drawArcShape(size * 0.8, size * 0.4, '#ffffff');
    } else {
        drawArcShape(size * 0.85, size * 0.45, '#cccccc');
        drawArcShape(size * 0.80, size * 0.40, '#1e1e24');
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.lineWidth = 2; ctx.setLineDash([15, 15]);
        ctx.strokeStyle = '#eebc1f';
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function renderBottleneckCurveTR(ctx, x, y, size) {
    drawBottleneckCurveShape(ctx, x + size, y, size / 2, Math.PI / 2, Math.PI, size);
}
function renderBottleneckCurveBR(ctx, x, y, size) {
    drawBottleneckCurveShape(ctx, x + size, y + size, size / 2, Math.PI, 3 * Math.PI / 2, size);
}
function renderBottleneckCurveBL(ctx, x, y, size) {
    drawBottleneckCurveShape(ctx, x, y + size, size / 2, 3 * Math.PI / 2, 2 * Math.PI, size);
}
function renderBottleneckCurveTL(ctx, x, y, size) {
    drawBottleneckCurveShape(ctx, x, y, size / 2, 0, Math.PI / 2, size);
}

function drawSplitLines(ctx, x, y, size, ports) {
    const cx = x + size / 2, cy = y + size / 2;
    ctx.beginPath();
    if (ports[0]) { ctx.moveTo(cx, cy); ctx.lineTo(cx, y); }
    if (ports[1]) { ctx.moveTo(cx, cy); ctx.lineTo(x + size, cy); }
    if (ports[2]) { ctx.moveTo(cx, cy); ctx.lineTo(cx, y + size); }
    if (ports[3]) { ctx.moveTo(cx, cy); ctx.lineTo(x, cy); }
    ctx.lineWidth = 2; ctx.setLineDash([15, 15]);
    ctx.strokeStyle = '#eebc1f';
    ctx.stroke();
    ctx.setLineDash([]);
}

function renderSplitUp(ctx, x, y, size) {
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x, y + size * 0.075, size, size * 0.85); // horizontal
    ctx.fillRect(x + size * 0.075, y + size * 0.075, size * 0.85, size * 0.925); // center to bottom
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(x, y + size * 0.1, size, size * 0.8);
    ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.9);
    drawSplitLines(ctx, x, y, size, TILE_TYPES.SPLIT_UP.ports);
}
function renderSplitRight(ctx, x, y, size) {
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x + size * 0.075, y, size * 0.85, size); // vertical
    ctx.fillRect(x, y + size * 0.075, size * 0.925, size * 0.85); // center to left
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(x + size * 0.1, y, size * 0.8, size);
    ctx.fillRect(x, y + size * 0.1, size * 0.9, size * 0.8);
    drawSplitLines(ctx, x, y, size, TILE_TYPES.SPLIT_RIGHT.ports);
}
function renderSplitDown(ctx, x, y, size) {
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x, y + size * 0.075, size, size * 0.85); // horizontal
    ctx.fillRect(x + size * 0.075, y, size * 0.85, size * 0.925); // top to center
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(x, y + size * 0.1, size, size * 0.8);
    ctx.fillRect(x + size * 0.1, y, size * 0.8, size * 0.9);
    drawSplitLines(ctx, x, y, size, TILE_TYPES.SPLIT_DOWN.ports);
}
function renderSplitLeft(ctx, x, y, size) {
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x + size * 0.075, y, size * 0.85, size); // vertical
    ctx.fillRect(x + size * 0.075, y + size * 0.075, size * 0.925, size * 0.85); // center to right
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(x + size * 0.1, y, size * 0.8, size);
    ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.9, size * 0.8);
    drawSplitLines(ctx, x, y, size, TILE_TYPES.SPLIT_LEFT.ports);
}

function renderRamp(ctx, x, y, size, direction) {
    ctx.save();
    ctx.translate(x + size/2, y + size/2);
    if (direction === 'RIGHT') ctx.rotate(0);
    else if (direction === 'DOWN') ctx.rotate(Math.PI/2);
    else if (direction === 'LEFT') ctx.rotate(Math.PI);
    else if (direction === 'UP') ctx.rotate(-Math.PI/2);
    
    const lipX = size * 0.3;
    const entryX = -size / 2 - 1; // Slight overlap to avoid seams
    
    // Draw Border
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(entryX, -size * 0.45);
    ctx.lineTo(lipX, -size * 0.45);
    ctx.lineTo(lipX, size * 0.45);
    ctx.lineTo(entryX, size * 0.45);
    ctx.fill();
    
    // Draw Road
    ctx.fillStyle = '#1e1e24';
    ctx.beginPath();
    ctx.moveTo(entryX, -size * 0.4);
    ctx.lineTo(lipX - 5, -size * 0.4);
    ctx.lineTo(lipX - 5, size * 0.4);
    ctx.lineTo(entryX, size * 0.4);
    ctx.fill();
    
    // Draw dashed center line
    ctx.beginPath();
    ctx.moveTo(entryX, 0);
    ctx.lineTo(lipX, 0); // Stop at the lip so it doesn't peek out
    ctx.lineWidth = 2; ctx.setLineDash([15, 15]);
    ctx.strokeStyle = '#eebc1f';
    ctx.stroke();
    ctx.setLineDash([]);
    
    const rampWidth = size * 0.7;
    const rampLength = size * 0.6;
    const rampStartX = lipX - rampLength;
    
    const grad = ctx.createLinearGradient(rampStartX, 0, lipX, 0);
    grad.addColorStop(0, '#1e1e24');
    grad.addColorStop(1, '#666666');
    
    ctx.fillStyle = grad;
    ctx.fillRect(rampStartX, -rampWidth/2, rampLength, rampWidth);
    
    ctx.fillStyle = '#ff5500';
    ctx.fillRect(lipX - 5, -rampWidth/2, 5, rampWidth);
    
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(lipX - rampLength/2 - 10, -rampWidth/4, rampLength/2, 2);
    ctx.fillRect(lipX - rampLength/4 - 10, rampWidth/4, rampLength/4, 2);
    
    ctx.restore();
}

function renderRampUp(ctx, x, y, size) { renderRamp(ctx, x, y, size, 'UP'); }
function renderRampRight(ctx, x, y, size) { renderRamp(ctx, x, y, size, 'RIGHT'); }
function renderRampDown(ctx, x, y, size) { renderRamp(ctx, x, y, size, 'DOWN'); }
function renderRampLeft(ctx, x, y, size) { renderRamp(ctx, x, y, size, 'LEFT'); }



// ========================================
// Teleporters
// ========================================

function renderTeleport(ctx, x, y, size, dir) {
    ctx.save();
    ctx.translate(x + size/2, y + size/2);
    
    if (dir === 'RIGHT') ctx.rotate(Math.PI/2);
    else if (dir === 'DOWN') ctx.rotate(Math.PI);
    else if (dir === 'LEFT') ctx.rotate(-Math.PI/2);
    
    // Draw the road from the bottom edge to the center, ending abruptly.
    ctx.strokeStyle = '#cccccc';
    ctx.lineCap = 'butt';
    ctx.lineWidth = size * 0.85;
    ctx.beginPath(); ctx.moveTo(0, size/2); ctx.lineTo(0, 0); ctx.stroke();
    
    ctx.strokeStyle = '#1e1e24';
    ctx.lineWidth = size * 0.8;
    ctx.beginPath(); ctx.moveTo(0, size/2); ctx.lineTo(0, 0); ctx.stroke();
    
    ctx.strokeStyle = '#eebc1f';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 15]);
    ctx.beginPath(); ctx.moveTo(0, size/2); ctx.lineTo(0, 0); ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw the portal image instead of Canvas geometry!
    const imgSize = size * 0.7; // size is 100, so 70x70
    if (teleporterImg.complete) {
        ctx.drawImage(teleporterImg, -imgSize/2, -imgSize/2, imgSize, imgSize);
    } else {
        // fallback
        ctx.fillStyle = '#0055ff';
        ctx.beginPath(); ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2); ctx.fill();
    }
    
    ctx.restore();
}

function renderTeleportUp(ctx, x, y, size) { renderTeleport(ctx, x, y, size, 'UP'); }
function renderTeleportRight(ctx, x, y, size) { renderTeleport(ctx, x, y, size, 'RIGHT'); }
function renderTeleportDown(ctx, x, y, size) { renderTeleport(ctx, x, y, size, 'DOWN'); }
function renderTeleportLeft(ctx, x, y, size) { renderTeleport(ctx, x, y, size, 'LEFT'); }

// ========================================
// Start/Finish Line
// ========================================

function drawStartLine(ctx, cx, cy, size, isVertical) {
    const roadW = size * 0.75;
    const squares = 8;
    const sqSize = roadW / squares;

    if (isVertical) {
        // Checkerboard across horizontal band on a vertical road
        const startX = cx - roadW / 2;
        const startY = cy - sqSize;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < squares; col++) {
                ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#111111';
                ctx.fillRect(startX + col * sqSize, startY + row * sqSize, sqSize, sqSize);
            }
        }
    } else {
        // Checkerboard across vertical band on a horizontal road
        const startX = cx - sqSize;
        const startY = cy - roadW / 2;
        for (let row = 0; row < squares; row++) {
            for (let col = 0; col < 2; col++) {
                ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#111111';
                ctx.fillRect(startX + col * sqSize, startY + row * sqSize, sqSize, sqSize);
            }
        }
    }
}

function drawStartLineRotated(ctx, cx, cy, size, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    drawStartLine(ctx, 0, 0, size, true);
    ctx.restore();
}

// ========================================
// Track Class
// ========================================

class Track {
    constructor(cols = 16, rows = 12) {
        this.cols = cols;
        this.rows = rows;
        this.grid = new Uint8Array(cols * rows);
        this.autoGrid = new Uint32Array(cols * rows); // Tracks auto-drawn strokes (0 = manual, >0 = stroke ID)
        this.checkpoints = [];
        this.startPos = { x: 0, y: 0, angle: 0 };

        this.cacheCanvas = null;
        this.cacheCtx = null;
        this.isDirty = true;
    }

    markDirty() {
        this.isDirty = true;
    }

    setTile(c, r, typeId, strokeId = 0) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
        this.grid[r * this.cols + c] = typeId;
        this.autoGrid[r * this.cols + c] = strokeId;
        this.markDirty();
    }

    getTile(c, r) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return 0;
        return this.grid[r * this.cols + c];
    }

    isAuto(c, r) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
        return this.autoGrid[r * this.cols + c] > 0;
    }

    getStrokeId(c, r) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return 0;
        return this.autoGrid[r * this.cols + c];
    }

    // Validates if the tile connections match up
    isValid() {
        let startCount = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const id = this.getTile(c, r);
                if (id === 0) continue;

                const type = Object.values(TILE_TYPES).find(t => t.id === id);
                if (type.isStart) startCount++;

                const ports = type.ports;
                
                // Helper to check if a missing connection is actually a valid ramp jump
                const isRampJump = (dir) => {
                    // dir: 0=Top, 1=Right, 2=Bottom, 3=Left
                    
                    // 1. Is this tile a ramp launching in this direction? (Exit port of a ramp is always valid)
                    if (dir === 0 && id === TILE_TYPES.RAMP_UP.id) return true;
                    if (dir === 1 && id === TILE_TYPES.RAMP_RIGHT.id) return true;
                    if (dir === 2 && id === TILE_TYPES.RAMP_DOWN.id) return true;
                    if (dir === 3 && id === TILE_TYPES.RAMP_LEFT.id) return true;
                    
                    // 2. Is this tile a landing pad receiving a car from a ramp?
                    // Scan in the direction of the missing connection for an opposing ramp
                    if (dir === 0) { // missing top connection, scan up for RAMP_DOWN
                        for (let y = r - 1; y >= 0; y--) {
                            const scanId = this.getTile(c, y);
                            if (scanId === TILE_TYPES.RAMP_DOWN.id) return true;
                            if (scanId !== 0) break; // blocked by another tile
                        }
                    } else if (dir === 1) { // missing right connection, scan right for RAMP_LEFT
                        for (let x = c + 1; x < this.cols; x++) {
                            const scanId = this.getTile(x, r);
                            if (scanId === TILE_TYPES.RAMP_LEFT.id) return true;
                            if (scanId !== 0) break;
                        }
                    } else if (dir === 2) { // missing bottom connection, scan down for RAMP_UP
                        for (let y = r + 1; y < this.rows; y++) {
                            const scanId = this.getTile(c, y);
                            if (scanId === TILE_TYPES.RAMP_UP.id) return true;
                            if (scanId !== 0) break;
                        }
                    } else if (dir === 3) { // missing left connection, scan left for RAMP_RIGHT
                        for (let x = c - 1; x >= 0; x--) {
                            const scanId = this.getTile(x, r);
                            if (scanId === TILE_TYPES.RAMP_RIGHT.id) return true;
                            if (scanId !== 0) break;
                        }
                    }
                    
                    return false;
                };

                // Top
                if (ports[0]) {
                    const adj = this.getTileType(c, r - 1);
                    if (!adj || !adj.ports[2]) {
                        if (!isRampJump(0)) return { valid: false, reason: `Tile at (${c}, ${r}) has an open top connection.` };
                    }
                }
                // Right
                if (ports[1]) {
                    const adj = this.getTileType(c + 1, r);
                    if (!adj || !adj.ports[3]) {
                        if (!isRampJump(1)) return { valid: false, reason: `Tile at (${c}, ${r}) has an open right connection.` };
                    }
                }
                // Bottom
                if (ports[2]) {
                    const adj = this.getTileType(c, r + 1);
                    if (!adj || !adj.ports[0]) {
                        if (!isRampJump(2)) return { valid: false, reason: `Tile at (${c}, ${r}) has an open bottom connection.` };
                    }
                }
                // Left
                if (ports[3]) {
                    const adj = this.getTileType(c - 1, r);
                    if (!adj || !adj.ports[1]) {
                        if (!isRampJump(3)) return { valid: false, reason: `Tile at (${c}, ${r}) has an open left connection.` };
                    }
                }
            }
        }
        
        if (startCount !== 1) {
            return { valid: false, reason: `Track must have exactly one START tile. Found ${startCount}.` };
        }
        
        return { valid: true };
    }

    getTileType(c, r) {
        const id = this.getTile(c, r);
        return Object.values(TILE_TYPES).find(t => t.id === id) || TILE_TYPES.EMPTY;
    }

    autoResolveTile(c, r, prefDx = 0, prefDy = 0, strokeId = 0) {
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
        if (!this.isAuto(c, r)) return; // Only modify auto-drawn tiles
        
        const currentId = this.getTile(c, r);
        if (currentId === 0) return; // Don't resolve empty grass
        
        const type = this.getTileType(c, r);
        if (type.isStart) return; // Don't overwrite Start tiles
        // Find if this tile already had ports open in these directions
        const oldPorts = type.ports || [false, false, false, false];

        // Check neighbors that have ports pointing to this tile, or are auto-drawn WITH THE SAME STROKE ID
        let nUp = false, nRight = false, nDown = false, nLeft = false;
        if (r > 0) {
            let t = this.getTileType(c, r - 1);
            let sameStroke = this.isAuto(c, r - 1) && (!strokeId || this.getStrokeId(c, r - 1) === strokeId);
            if ((t.id !== 0 && t.ports[2]) || sameStroke) nUp = true;
        }
        if (c < this.cols - 1) {
            let t = this.getTileType(c + 1, r);
            let sameStroke = this.isAuto(c + 1, r) && (!strokeId || this.getStrokeId(c + 1, r) === strokeId);
            if ((t.id !== 0 && t.ports[3]) || sameStroke) nRight = true;
        }
        if (r < this.rows - 1) {
            let t = this.getTileType(c, r + 1);
            let sameStroke = this.isAuto(c, r + 1) && (!strokeId || this.getStrokeId(c, r + 1) === strokeId);
            if ((t.id !== 0 && t.ports[0]) || sameStroke) nDown = true;
        }
        if (c > 0) {
            let t = this.getTileType(c - 1, r);
            let sameStroke = this.isAuto(c - 1, r) && (!strokeId || this.getStrokeId(c - 1, r) === strokeId);
            if ((t.id !== 0 && t.ports[1]) || sameStroke) nLeft = true;
        }

        // Filter based on preferred movement direction to prioritize straights
        // Only ignore a direction if the tile didn't already have a connection there!
        if (Math.abs(prefDx) > 0) {
            if (!oldPorts[0]) nUp = false;
            if (!oldPorts[2]) nDown = false;
        } else if (Math.abs(prefDy) > 0) {
            if (!oldPorts[3]) nLeft = false;
            if (!oldPorts[1]) nRight = false;
        }

        let bestMatch = TILE_TYPES.STRAIGHT_H;
        const connections = (nUp ? 1 : 0) + (nRight ? 1 : 0) + (nDown ? 1 : 0) + (nLeft ? 1 : 0);

        if (connections === 4) {
            bestMatch = TILE_TYPES.CROSSROAD_H_OVER;
        } else if (connections === 3) {
            if (nUp && nDown) bestMatch = TILE_TYPES.STRAIGHT_V;
            else if (nLeft && nRight) bestMatch = TILE_TYPES.STRAIGHT_H;
            else if (nUp && nRight) bestMatch = TILE_TYPES.CURVE_TR;
            else if (nDown && nRight) bestMatch = TILE_TYPES.CURVE_BR;
            else if (nDown && nLeft) bestMatch = TILE_TYPES.CURVE_BL;
            else if (nUp && nLeft) bestMatch = TILE_TYPES.CURVE_TL;
        } else if (connections === 2) {
            if (nUp && nDown) bestMatch = TILE_TYPES.STRAIGHT_V;
            else if (nLeft && nRight) bestMatch = TILE_TYPES.STRAIGHT_H;
            else if (nUp && nRight) bestMatch = TILE_TYPES.CURVE_TR;
            else if (nDown && nRight) bestMatch = TILE_TYPES.CURVE_BR;
            else if (nDown && nLeft) bestMatch = TILE_TYPES.CURVE_BL;
            else if (nUp && nLeft) bestMatch = TILE_TYPES.CURVE_TL;
        } else if (connections === 1) {
            if (nUp || nDown) bestMatch = TILE_TYPES.STRAIGHT_V;
            else if (nLeft || nRight) bestMatch = TILE_TYPES.STRAIGHT_H;
        }

        this.setTile(c, r, bestMatch.id, strokeId || 1);
    }

    computeCheckpoints() {
        this.checkpoints = [];
        let startC = -1, startR = -1, startType = null;

        // 1. Find Start Tile
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.getTileType(c, r);
                if (type.isStart) {
                    startC = c; startR = r; startType = type;
                    break;
                }
            }
            if (startType) break;
        }

        if (!startType) {
            // Fallback if no start tile
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const type = this.getTileType(c, r);
                    if (type.id !== 0) {
                        this.checkpoints.push({ x: c * TILE_SIZE + TILE_SIZE / 2, y: r * TILE_SIZE + TILE_SIZE / 2, radius: TILE_SIZE * 0.85 });
                    }
                }
            }
            return;
        }

        // We calculate this later depending on whether it's a straight or a curve

        // 2. Determine initial direction.
        const dirs = [
            { dx: 0, dy: -1 }, // 0: Top
            { dx: 1, dy: 0 },  // 1: Right
            { dx: 0, dy: 1 },  // 2: Bottom
            { dx: -1, dy: 0 }  // 3: Left
        ];

        let currentDir = -1;
        for (let i = 0; i < 4; i++) {
            if (startType.ports[i]) {
                const nc = startC + dirs[i].dx;
                const nr = startR + dirs[i].dy;
                if (nc >= 0 && nc < this.cols && nr >= 0 && nr < this.rows) {
                    const nextType = this.getTileType(nc, nr);
                    const incomingPort = (i + 2) % 4;
                    if (nextType.ports && nextType.ports[incomingPort]) {
                        currentDir = i;
                        break; // Pick the first valid connected path
                    }
                }
            }
        }

        if (currentDir === -1) {
            this.startPos.angle = 0;
            return;
        }

        // Set start angle and exact position
        const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
        let sx = startC * TILE_SIZE + TILE_SIZE / 2;
        let sy = startR * TILE_SIZE + TILE_SIZE / 2;
        let sAngle = angles[currentDir];

        if (startType.id === TILE_TYPES.START_CURVE_TR.id) {
            const cx = startC * TILE_SIZE + TILE_SIZE;
            const cy = startR * TILE_SIZE;
            sx = cx + Math.cos(3*Math.PI/4) * (TILE_SIZE/2);
            sy = cy + Math.sin(3*Math.PI/4) * (TILE_SIZE/2);
            sAngle = (currentDir === 0) ? 5*Math.PI/4 : Math.PI/4;
        } else if (startType.id === TILE_TYPES.START_CURVE_BR.id) {
            const cx = startC * TILE_SIZE + TILE_SIZE;
            const cy = startR * TILE_SIZE + TILE_SIZE;
            sx = cx + Math.cos(5*Math.PI/4) * (TILE_SIZE/2);
            sy = cy + Math.sin(5*Math.PI/4) * (TILE_SIZE/2);
            sAngle = (currentDir === 1) ? 7*Math.PI/4 : 3*Math.PI/4;
        } else if (startType.id === TILE_TYPES.START_CURVE_BL.id) {
            const cx = startC * TILE_SIZE;
            const cy = startR * TILE_SIZE + TILE_SIZE;
            sx = cx + Math.cos(7*Math.PI/4) * (TILE_SIZE/2);
            sy = cy + Math.sin(7*Math.PI/4) * (TILE_SIZE/2);
            sAngle = (currentDir === 2) ? Math.PI/4 : 5*Math.PI/4;
        } else if (startType.id === TILE_TYPES.START_CURVE_TL.id) {
            const cx = startC * TILE_SIZE;
            const cy = startR * TILE_SIZE;
            sx = cx + Math.cos(Math.PI/4) * (TILE_SIZE/2);
            sy = cy + Math.sin(Math.PI/4) * (TILE_SIZE/2);
            sAngle = (currentDir === 3) ? 3*Math.PI/4 : 7*Math.PI/4;
        }

        this.startPos.x = sx;
        this.startPos.y = sy;
        this.startPos.angle = sAngle;

        // 3. Trace the path (DFS to find a closed loop back to start)
        const stack = [{
            c: startC, r: startR, dir: currentDir,
            phase: 0,
            nc: 0, nr: 0, tryDirs: [], dirIndex: 0,
            other: null
        }];
        
        let currentPath = [];
        let visited = new Set();
        let foundPath = null;
        let longestPath = [];

        while (stack.length > 0) {
            if (foundPath) break;
            const state = stack[stack.length - 1];

            if (state.phase === 0) {
                if (currentPath.length > longestPath.length) {
                    longestPath = [...currentPath];
                }
                
                if (state.c === startC && state.r === startR && currentPath.length > 0) {
                    foundPath = [...currentPath];
                    break;
                }

                const axis = state.dir % 2;
                const key = `${state.c},${state.r},${axis}`;
                if (visited.has(key)) {
                    stack.pop();
                    continue;
                }

                visited.add(key);
                currentPath.push({c: state.c, r: state.r});
                state.key = key;

                state.nc = state.c + dirs[state.dir].dx;
                state.nr = state.r + dirs[state.dir].dy;
                state.phase = 1;
            } 
            else if (state.phase === 1) {
                let pushedNext = false;
                if (state.nc >= 0 && state.nc < this.cols && state.nr >= 0 && state.nr < this.rows) {
                    const type = this.getTileType(state.nc, state.nr);
                    if (type.id !== 0) {
                        const incomingPort = (state.dir + 2) % 4;
                        if (type.ports[incomingPort]) {
                            if (type.id >= TILE_TYPES.TELEPORT_UP.id && type.id <= TILE_TYPES.TELEPORT_LEFT.id) {
                                let other = null;
                                for (let _r = 0; _r < this.rows; _r++) {
                                    for (let _c = 0; _c < this.cols; _c++) {
                                        if (_c !== state.nc || _r !== state.nr) {
                                            const tType = this.getTileType(_c, _r);
                                            if (tType.id >= TILE_TYPES.TELEPORT_UP.id && tType.id <= TILE_TYPES.TELEPORT_LEFT.id) {
                                                other = {c: _c, r: _r, type: tType};
                                            }
                                        }
                                    }
                                }
                                if (other) {
                                    state.other = other;
                                    currentPath.push({c: state.nc, r: state.nr});
                                    visited.add(`${state.nc},${state.nr},0`);
                                    
                                    let outDir = 0;
                                    if (other.type.id === TILE_TYPES.TELEPORT_UP.id) outDir = 2; // Exits going DOWN
                                    else if (other.type.id === TILE_TYPES.TELEPORT_RIGHT.id) outDir = 3; // Exits going LEFT
                                    else if (other.type.id === TILE_TYPES.TELEPORT_DOWN.id) outDir = 0; // Exits going UP
                                    else if (other.type.id === TILE_TYPES.TELEPORT_LEFT.id) outDir = 1; // Exits going RIGHT
                                    
                                    stack.push({
                                        c: other.c, r: other.r, dir: outDir, phase: 0
                                    });
                                    state.phase = 3; // Teleport return phase
                                    pushedNext = true;
                                }
                            } else {
                                const straightDir = (incomingPort + 2) % 4;
                                state.tryDirs = [];
                                if (type.ports[straightDir]) state.tryDirs.push(straightDir);
                                for (let i = 0; i < 4; i++) {
                                    if (i !== incomingPort && i !== straightDir && type.ports[i]) {
                                        state.tryDirs.push(i);
                                    }
                                }
                                state.dirIndex = 0;
                                state.phase = 2; // Normal branches
                            }
                        }
                    }
                }
                
                if (!pushedNext && state.phase === 1) {
                    currentPath.pop();
                    visited.delete(state.key);
                    stack.pop();
                }
            } 
            else if (state.phase === 2) { 
                if (state.dirIndex < state.tryDirs.length) {
                    const nextDir = state.tryDirs[state.dirIndex++];
                    stack.push({
                        c: state.nc, r: state.nr, dir: nextDir, phase: 0
                    });
                } else {
                    currentPath.pop();
                    visited.delete(state.key);
                    stack.pop();
                }
            } 
            else if (state.phase === 3) {
                visited.delete(`${state.nc},${state.nr},0`);
                currentPath.pop(); // teleport cleanup
                currentPath.pop(); // main tile cleanup
                visited.delete(state.key);
                stack.pop();
            }
        }

        const finalPath = foundPath || longestPath;
        if (finalPath.length > 0) {
            for (const pt of finalPath) {
                this.checkpoints.push({
                    x: pt.c * TILE_SIZE + TILE_SIZE / 2,
                    y: pt.r * TILE_SIZE + TILE_SIZE / 2,
                    radius: TILE_SIZE * 0.85
                });
            }
            // Add the start line again as the final checkpoint to complete the loop
            if (foundPath) {
                this.checkpoints.push({
                    x: finalPath[0].c * TILE_SIZE + TILE_SIZE / 2,
                    y: finalPath[0].r * TILE_SIZE + TILE_SIZE / 2,
                    radius: TILE_SIZE * 0.85
                });
            }
        }
    }

    // ========================================
    // Render — rich background with crosshatch, ticks, and grass tint
    // ========================================
    render(ctx, inEditor = false) {
        // Create or resize cache canvas if needed
        if (!this.cacheCanvas) {
            this.cacheCanvas = document.createElement('canvas');
            this.cacheCtx = this.cacheCanvas.getContext('2d', { alpha: false });
            this.isDirty = true;
        }
        
        const expectedWidth = this.cols * TILE_SIZE;
        const expectedHeight = this.rows * TILE_SIZE;
        
        if (this.cacheCanvas.width !== expectedWidth || this.cacheCanvas.height !== expectedHeight) {
            this.cacheCanvas.width = expectedWidth;
            this.cacheCanvas.height = expectedHeight;
            this.isDirty = true;
        }

        if (this.isDirty) {
            // Rebuild the cached track image
            // We use integer coordinates internally, so strokes connect perfectly
            this.cacheCtx.fillStyle = '#050508'; 
            this.cacheCtx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height);

            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const type = this.getTileType(c, r);
                    if (type.id === TILE_TYPES.CROSSROAD_H_OVER.id) {
                        // Render ONLY the underpass (Vertical) in the base layer.
                        renderStraightV(this.cacheCtx, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE);
                    } else if (type.id === TILE_TYPES.CROSSROAD_V_OVER.id) {
                        // Render ONLY the underpass (Horizontal) in the base layer.
                        renderStraightH(this.cacheCtx, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE);
                    } else if (type.render) {
                        type.render(this.cacheCtx, c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE);
                    }
                }
            }
            this.isDirty = false;
        }

        // Draw the cached track onto the main context (this prevents 1px anti-aliasing gaps between tiles)
        ctx.drawImage(this.cacheCanvas, 0, 0);

        if (inEditor) {
            // 2) Subtle cross-hatch pattern
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, this.cols * TILE_SIZE, this.rows * TILE_SIZE);
            ctx.clip();
            ctx.strokeStyle = 'rgba(255,255,255,0.015)';
            ctx.lineWidth = 0.5;
            const diagSpacing = 20;
            const w = this.cols * TILE_SIZE;
            const h = this.rows * TILE_SIZE;
            // Forward diagonals (\)
            for (let d = -h; d < w; d += diagSpacing) {
                ctx.beginPath();
                ctx.moveTo(d, 0);
                ctx.lineTo(d + h, h);
                ctx.stroke();
            }
            // Backward diagonals (/)
            for (let d = -h; d < w; d += diagSpacing) {
                ctx.beginPath();
                ctx.moveTo(d + h, 0);
                ctx.lineTo(d, h);
                ctx.stroke();
            }
            ctx.restore();

            // 3) Subtle green tint on empty cells
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const type = this.getTileType(c, r);
                    if (type.id === 0) {
                        ctx.fillStyle = 'rgba(20, 60, 20, 0.15)';
                        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
            }

            // 4) Small corner tick marks at each grid intersection
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            const tickLen = 6;
            for (let r = 0; r <= this.rows; r++) {
                for (let c = 0; c <= this.cols; c++) {
                    const gx = c * TILE_SIZE;
                    const gy = r * TILE_SIZE;
                    // Horizontal tick
                    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + tickLen, gy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - tickLen, gy); ctx.stroke();
                    // Vertical tick
                    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + tickLen); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - tickLen); ctx.stroke();
                }
            }
        }

        if (inEditor) {
            // 6) Faint grid lines (for editor)
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            for (let r = 0; r <= this.rows; r++) {
                ctx.beginPath(); ctx.moveTo(0, r * TILE_SIZE); ctx.lineTo(this.cols * TILE_SIZE, r * TILE_SIZE); ctx.stroke();
            }
            for (let c = 0; c <= this.cols; c++) {
                ctx.beginPath(); ctx.moveTo(c * TILE_SIZE, 0); ctx.lineTo(c * TILE_SIZE, this.rows * TILE_SIZE); ctx.stroke();
            }
        }
    }

    renderOverlays(ctx) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.getTileType(c, r);
                if (type.id === TILE_TYPES.CROSSROAD_H_OVER.id) {
                    const x = c * TILE_SIZE;
                    const y = r * TILE_SIZE;
                    const size = TILE_SIZE;
                    
                    renderStraightH(ctx, x, y, size);
                } else if (type.id === TILE_TYPES.CROSSROAD_V_OVER.id) {
                    const x = c * TILE_SIZE;
                    const y = r * TILE_SIZE;
                    const size = TILE_SIZE;
                    
                    renderStraightV(ctx, x, y, size);
                }
            }
        }
    }

    // ========================================
    // Collision Canvas — white road on black
    // ========================================
    renderCollisionCanvas(collisionCanvas) {
        collisionCanvas.width = this.cols * TILE_SIZE;
        collisionCanvas.height = this.rows * TILE_SIZE;
        const ctx = collisionCanvas.getContext('2d', { willReadFrequently: true });

        // Grass (black/false)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, collisionCanvas.width, collisionCanvas.height);

        // Road (white/true)
        const drawCollisionPath = (c, x1, y1, x2, y2, size) => {
            c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
            c.lineWidth = size * 0.8; c.lineCap = 'butt'; c.strokeStyle = '#ffffff'; c.stroke();
        };
        const drawCollisionCurve = (c, cx, cy, radius, sA, eA, size) => {
            c.beginPath(); c.arc(cx, cy, radius, sA, eA);
            c.lineWidth = size * 0.8; c.lineCap = 'butt'; c.strokeStyle = '#ffffff'; c.stroke();
        };

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.getTileType(c, r);
                if (!type.render) continue;

                const px = c * TILE_SIZE;
                const py = r * TILE_SIZE;

                if (
                    type.id === TILE_TYPES.STRAIGHT_V.id || type.id === TILE_TYPES.START_V.id || 
                    type.id === TILE_TYPES.BOOST_UP.id || type.id === TILE_TYPES.BOOST_DOWN.id ||
                    type.id === TILE_TYPES.ROUGH_STRAIGHT_V.id || type.id === TILE_TYPES.ICE_STRAIGHT_V.id ||
                    type.id === TILE_TYPES.BOUNCY_STRAIGHT_V.id || type.id === TILE_TYPES.PUDDLE_STRAIGHT_V.id || type.id === TILE_TYPES.FAST_STRAIGHT_V.id
                ) {
                    drawCollisionPath(ctx, px + TILE_SIZE / 2, py, px + TILE_SIZE / 2, py + TILE_SIZE, TILE_SIZE);
                } else if (
                    type.id === TILE_TYPES.STRAIGHT_H.id || type.id === TILE_TYPES.START_H.id || 
                    type.id === TILE_TYPES.BOOST_LEFT.id || type.id === TILE_TYPES.BOOST_RIGHT.id ||
                    type.id === TILE_TYPES.ROUGH_STRAIGHT_H.id || type.id === TILE_TYPES.ICE_STRAIGHT_H.id ||
                    type.id === TILE_TYPES.BOUNCY_STRAIGHT_H.id || type.id === TILE_TYPES.PUDDLE_STRAIGHT_H.id || type.id === TILE_TYPES.FAST_STRAIGHT_H.id
                ) {
                    drawCollisionPath(ctx, px, py + TILE_SIZE / 2, px + TILE_SIZE, py + TILE_SIZE / 2, TILE_SIZE);
                } else if (type.id === TILE_TYPES.BOTTLENECK_V.id) {
                    drawBottleneckShape(ctx, px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE, true, true);
                } else if (type.id === TILE_TYPES.BOTTLENECK_H.id) {
                    drawBottleneckShape(ctx, px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE, false, true);
                } else if (type.id === TILE_TYPES.BOTTLENECK_CURVE_TR.id) {
                    drawBottleneckCurveShape(ctx, px + TILE_SIZE, py, TILE_SIZE / 2, Math.PI / 2, Math.PI, TILE_SIZE, true);
                } else if (type.id === TILE_TYPES.BOTTLENECK_CURVE_BR.id) {
                    drawBottleneckCurveShape(ctx, px + TILE_SIZE, py + TILE_SIZE, TILE_SIZE / 2, Math.PI, 3 * Math.PI / 2, TILE_SIZE, true);
                } else if (type.id === TILE_TYPES.BOTTLENECK_CURVE_BL.id) {
                    drawBottleneckCurveShape(ctx, px, py + TILE_SIZE, TILE_SIZE / 2, 3 * Math.PI / 2, 2 * Math.PI, TILE_SIZE, true);
                } else if (type.id === TILE_TYPES.BOTTLENECK_CURVE_TL.id) {
                    drawBottleneckCurveShape(ctx, px, py, TILE_SIZE / 2, 0, Math.PI / 2, TILE_SIZE, true);
                } else if (type.id === TILE_TYPES.CROSSROAD_H_OVER.id || type.id === TILE_TYPES.CROSSROAD_V_OVER.id || type.id === TILE_TYPES.INTERSECTION.id || (type.id >= TILE_TYPES.SPLIT_UP.id && type.id <= TILE_TYPES.SPLIT_LEFT.id)) {
                    // Splits and Crossroads use the same open box collision
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(px, py + TILE_SIZE * 0.1, TILE_SIZE, TILE_SIZE * 0.8);
                    ctx.fillRect(px + TILE_SIZE * 0.1, py, TILE_SIZE * 0.8, TILE_SIZE);
                } else if (type.id >= TILE_TYPES.RAMP_UP.id && type.id <= TILE_TYPES.RAMP_LEFT.id) {
                    // Ramps are just normal straights for collision
                    if (type.id === TILE_TYPES.RAMP_UP.id || type.id === TILE_TYPES.RAMP_DOWN.id) {
                        drawCollisionPath(ctx, px + TILE_SIZE / 2, py, px + TILE_SIZE / 2, py + TILE_SIZE, TILE_SIZE);
                    } else {
                        drawCollisionPath(ctx, px, py + TILE_SIZE / 2, px + TILE_SIZE, py + TILE_SIZE / 2, TILE_SIZE);
                    }
                } else if (type.id >= TILE_TYPES.TELEPORT_UP.id && type.id <= TILE_TYPES.TELEPORT_LEFT.id) {
                    if ([32, 34].includes(type.id)) { // UP/DOWN variants
                        drawCollisionPath(ctx, px + TILE_SIZE / 2, py, px + TILE_SIZE / 2, py + TILE_SIZE, TILE_SIZE);
                    } else {
                        drawCollisionPath(ctx, px, py + TILE_SIZE / 2, px + TILE_SIZE, py + TILE_SIZE / 2, TILE_SIZE);
                    }
                } else if (type.id === TILE_TYPES.CURVE_TR.id || type.id === TILE_TYPES.START_CURVE_TR.id || type.id === TILE_TYPES.ROUGH_CURVE_TR.id || type.id === TILE_TYPES.ICE_CURVE_TR.id || type.id === TILE_TYPES.BOUNCY_CURVE_TR.id || type.id === TILE_TYPES.PUDDLE_CURVE_TR.id || type.id === TILE_TYPES.FAST_CURVE_TR.id) {
                    drawCollisionCurve(ctx, px + TILE_SIZE, py, TILE_SIZE / 2, Math.PI / 2, Math.PI, TILE_SIZE);
                } else if (type.id === TILE_TYPES.CURVE_BR.id || type.id === TILE_TYPES.START_CURVE_BR.id || type.id === TILE_TYPES.ROUGH_CURVE_BR.id || type.id === TILE_TYPES.ICE_CURVE_BR.id || type.id === TILE_TYPES.BOUNCY_CURVE_BR.id || type.id === TILE_TYPES.PUDDLE_CURVE_BR.id || type.id === TILE_TYPES.FAST_CURVE_BR.id) {
                    drawCollisionCurve(ctx, px + TILE_SIZE, py + TILE_SIZE, TILE_SIZE / 2, Math.PI, Math.PI * 1.5, TILE_SIZE);
                } else if (type.id === TILE_TYPES.CURVE_BL.id || type.id === TILE_TYPES.START_CURVE_BL.id || type.id === TILE_TYPES.ROUGH_CURVE_BL.id || type.id === TILE_TYPES.ICE_CURVE_BL.id || type.id === TILE_TYPES.BOUNCY_CURVE_BL.id || type.id === TILE_TYPES.PUDDLE_CURVE_BL.id || type.id === TILE_TYPES.FAST_CURVE_BL.id) {
                    drawCollisionCurve(ctx, px, py + TILE_SIZE, TILE_SIZE / 2, Math.PI * 1.5, Math.PI * 2, TILE_SIZE);
                } else if (type.id === TILE_TYPES.CURVE_TL.id || type.id === TILE_TYPES.START_CURVE_TL.id || type.id === TILE_TYPES.ROUGH_CURVE_TL.id || type.id === TILE_TYPES.ICE_CURVE_TL.id || type.id === TILE_TYPES.BOUNCY_CURVE_TL.id || type.id === TILE_TYPES.PUDDLE_CURVE_TL.id || type.id === TILE_TYPES.FAST_CURVE_TL.id) {
                    drawCollisionCurve(ctx, px, py, TILE_SIZE / 2, 0, Math.PI / 2, TILE_SIZE);
                }
            }
        }
    }

    // ========================================
    // Sensor Canvas — overlays bridges on jumps
    // ========================================
    renderSensorCanvas(sensorCanvas) {
        // Start by rendering the standard collision canvas
        this.renderCollisionCanvas(sensorCanvas);
        const ctx = sensorCanvas.getContext('2d', { willReadFrequently: true });
        
        // Now overlay bridges for jumps
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.getTileType(c, r);
                if (!type) continue;
                
                // Helper to draw a bridge
                const drawBridge = (x, y, dx, dy, length) => {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + dx * length * TILE_SIZE, y + dy * length * TILE_SIZE);
                    ctx.lineWidth = TILE_SIZE * 0.8;
                    ctx.lineCap = 'butt';
                    ctx.strokeStyle = '#ffffff';
                    ctx.stroke();
                };

                const px = c * TILE_SIZE;
                const py = r * TILE_SIZE;
                
                // Check if it's a ramp and find how long the jump is
                if (type.id === TILE_TYPES.RAMP_UP.id) {
                    for (let y = r - 1; y >= 0; y--) {
                        if (this.getTile(c, y) !== 0) {
                            drawBridge(px + TILE_SIZE / 2, py, 0, -1, r - y);
                            break;
                        }
                    }
                } else if (type.id === TILE_TYPES.RAMP_DOWN.id) {
                    for (let y = r + 1; y < this.rows; y++) {
                        if (this.getTile(c, y) !== 0) {
                            drawBridge(px + TILE_SIZE / 2, py + TILE_SIZE, 0, 1, y - r);
                            break;
                        }
                    }
                } else if (type.id === TILE_TYPES.RAMP_LEFT.id) {
                    for (let x = c - 1; x >= 0; x--) {
                        if (this.getTile(x, r) !== 0) {
                            drawBridge(px, py + TILE_SIZE / 2, -1, 0, c - x);
                            break;
                        }
                    }
                } else if (type.id === TILE_TYPES.RAMP_RIGHT.id) {
                    for (let x = c + 1; x < this.cols; x++) {
                        if (this.getTile(x, r) !== 0) {
                            drawBridge(px + TILE_SIZE, py + TILE_SIZE / 2, 1, 0, x - c);
                            break;
                        }
                    }
                }
            }
        }
    }

    // ========================================
    // Serialize / Deserialize
    // ========================================
    serialize() {
        return JSON.stringify({
            cols: this.cols,
            rows: this.rows,
            grid: this.grid,
            autoGrid: this.autoGrid
        });
    }

    deserialize(dataStr) {
        try {
            const data = JSON.parse(dataStr);
            this.cols = data.cols;
            this.rows = data.rows;
            this.grid = data.grid;
            this.autoGrid = data.autoGrid || new Array(this.cols * this.rows).fill(false);
            this.computeCheckpoints();
        } catch (e) {
            console.error("Failed to load track data");
        }
    }

    // ========================================
    // Serialization
    // ========================================
    exportJSON() {
        return JSON.stringify({
            cols: this.cols,
            rows: this.rows,
            grid: Array.from(this.grid),
            autoGrid: Array.from(this.autoGrid)
        });
    }

    static importJSON(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            const track = new Track(data.cols, data.rows);
            track.grid.set(data.grid);
            if (data.autoGrid) {
                track.autoGrid.set(data.autoGrid);
            }
            track.computeCheckpoints();
            return track;
        } catch(e) {
            console.error("Failed to import track", e);
            return null;
        }
    }

    // ========================================
    // Tile Preview — renders a single tile onto a 60x60 canvas
    // ========================================
    static renderTilePreview(tileId, previewCanvas) {
        previewCanvas.width = 60;
        previewCanvas.height = 60;
        const ctx = previewCanvas.getContext('2d');

        // Dark background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 60, 60);

        if (tileId === 0) return; // Empty tile — just dark

        const type = Object.values(TILE_TYPES).find(t => t.id === tileId);
        if (!type || !type.render) return;

        // Scale down: tile renders at TILE_SIZE but we want 60px
        const scale = 60 / TILE_SIZE;
        ctx.save();
        ctx.scale(scale, scale);
        type.render(ctx, 0, 0, TILE_SIZE);
        ctx.restore();

        // Subtle border
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, 59, 59);
    }

    // ========================================
    // Built-in Track: Default Oval (32x24 grid)
    // ========================================
    static createDefaultOval() {
        const track = new Track(32, 24);

        // Oval in the centre of the larger grid
        // Top row: r=9, c=11..20
        track.setTile(11, 9, TILE_TYPES.CURVE_BR.id);
        track.setTile(12, 9, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(13, 9, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(14, 9, TILE_TYPES.START_H.id);
        track.setTile(15, 9, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(16, 9, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(17, 9, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(18, 9, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(19, 9, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(20, 9, TILE_TYPES.CURVE_BL.id);

        // Right side: r=10..13
        track.setTile(20, 10, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(20, 11, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(20, 12, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(20, 13, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(20, 14, TILE_TYPES.CURVE_TL.id);

        // Bottom row: c=12..19
        track.setTile(19, 14, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(18, 14, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(17, 14, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(16, 14, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(15, 14, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(14, 14, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(13, 14, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(12, 14, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(11, 14, TILE_TYPES.CURVE_TR.id);

        // Left side: r=10..13
        track.setTile(11, 13, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(11, 12, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(11, 11, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(11, 10, TILE_TYPES.STRAIGHT_V.id);

        track.computeCheckpoints();
        return track;
    }

    // ========================================
    // Built-in Track: Figure Eight (32x24 grid)
    // ========================================
    static createFigureEight() {
        const track = new Track(32, 24);
        
        // Center Intersection
        track.setTile(16, 12, TILE_TYPES.CROSSROAD_H_OVER.id);

        // --- Top/Left Loop ---
        track.setTile(16, 11, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(16, 10, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(16, 9, TILE_TYPES.CURVE_BL.id);
        
        track.setTile(15, 9, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(14, 9, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(13, 9, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(12, 9, TILE_TYPES.STRAIGHT_H.id);
        
        track.setTile(11, 9, TILE_TYPES.CURVE_BR.id);
        track.setTile(11, 10, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(11, 11, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(11, 12, TILE_TYPES.CURVE_TR.id);
        
        track.setTile(12, 12, TILE_TYPES.START_H.id); // Face Right
        track.setTile(13, 12, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(14, 12, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(15, 12, TILE_TYPES.STRAIGHT_H.id);

        // --- Bottom/Right Loop ---
        track.setTile(17, 12, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(18, 12, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(19, 12, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(20, 12, TILE_TYPES.STRAIGHT_H.id);
        
        track.setTile(21, 12, TILE_TYPES.CURVE_BL.id);
        track.setTile(21, 13, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(21, 14, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(21, 15, TILE_TYPES.CURVE_TL.id);
        
        track.setTile(20, 15, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(19, 15, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(18, 15, TILE_TYPES.STRAIGHT_H.id);
        track.setTile(17, 15, TILE_TYPES.STRAIGHT_H.id);
        
        track.setTile(16, 15, TILE_TYPES.CURVE_TR.id);
        track.setTile(16, 14, TILE_TYPES.STRAIGHT_V.id);
        track.setTile(16, 13, TILE_TYPES.STRAIGHT_V.id);

        track.computeCheckpoints();
        return track;
    }
}

// ========================================
// Exports
// ========================================
window.TILE_TYPES = TILE_TYPES;
window.TILE_SIZE = TILE_SIZE;
window.Track = Track;
