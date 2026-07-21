// ========================================
// Camera.js — 2D Camera with smooth follow
// ========================================
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.smoothing = 8;
    }

    follow(target) {
        this.targetX = target.x;
        this.targetY = target.y;
    }

    setPosition(x, y) {
        this.x = this.targetX = x;
        this.y = this.targetY = y;
    }

    update(dt) {
        const s = Math.min(this.smoothing * dt, 1);
        this.x += (this.targetX - this.x) * s;
        this.y += (this.targetY - this.y) * s;
        this.zoom += (this.targetZoom - this.zoom) * s;
    }

    applyTransform(ctx, canvas) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    restore(ctx) {
        ctx.restore();
    }

    screenToWorld(sx, sy, canvas) {
        return {
            x: (sx - canvas.width / 2) / this.zoom + this.x,
            y: (sy - canvas.height / 2) / this.zoom + this.y
        };
    }

    worldToScreen(wx, wy, canvas) {
        return {
            x: (wx - this.x) * this.zoom + canvas.width / 2,
            y: (wy - this.y) * this.zoom + canvas.height / 2
        };
    }
}

window.Camera = Camera;
