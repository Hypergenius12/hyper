export class Renderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;

    this.cellSize = 20; // Default, can be updated externally
    this.setupCanvas();
  }

  setupCanvas() {
    const { gridWidth, gridHeight } = this.engine.config;
    this.canvas.width = gridWidth * this.cellSize;
    this.canvas.height = gridHeight * this.cellSize;
  }

  render() {

    const state = this.engine.getState();
    const config = this.engine.config;
    const { ctx, canvas, cellSize } = this;
    const { gridWidth, gridHeight } = config;

    ctx.save();
    
    // Chaos: Invert Colors
    if (config.invertColorsTicks > 0) {
      const cycle = Math.floor(state.tickCount / config.invertColorsTicks);
      if (cycle % 2 === 1) {
        ctx.filter = 'invert(100%)';
      }
    }

    if (state.shakeTicks > 0) {

      const shakeAmt = state.shakeTicks * 2;
      const dx = (Math.random() - 0.5) * shakeAmt;
      const dy = (Math.random() - 0.5) * shakeAmt;
      ctx.translate(dx, dy);
    }
    // Background (Acid mode skips clear to smear!)
    if (!config.acidMode) {
      ctx.fillStyle = config.colorBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (state.tickCount === 0) {
      // Just clear once on start for acid mode
      ctx.fillStyle = config.colorBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }


    // Subtle grid
    if (config.showGrid && !config.acidMode) {
      ctx.strokeStyle = config.colorGrid;
      ctx.lineWidth = 1;
      for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvas.width, y * cellSize);
        ctx.stroke();
      }
    }



    const drawEntity = (x, y, color, scale = 1.0) => {
      ctx.fillStyle = color;
      const size = cellSize * scale;
      const offset = (cellSize - size) / 2;
      
      if (config.renderStyle === 'circle') {
        ctx.beginPath();
        ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x * cellSize + offset, y * cellSize + offset, size, size);
      }
    };


    // Obstacles
    if (state.obstacles && !config.invisibleObstacles) {
      ctx.fillStyle = config.colorObstacle;
      for (const obs of state.obstacles) { drawEntity(obs.x, obs.y, config.colorObstacle); }
    }

    // Foods
    for (const food of state.foods) {
      let col = config.colorFoodNormal;
      if (food.type === 'GOLDEN') col = config.colorFoodGolden;
      else if (food.type === 'POISON') col = config.colorFoodPoison;
      else if (food.type === 'GHOST') col = config.colorFoodGhost || '#06b6d4';
      drawEntity(food.x, food.y, col);
    }


    // Snake
    if (state.ghostTicks > 0) ctx.globalAlpha = 0.5;
    const fatness = config.snakeFatness || 1.0;
    
    state.snake.forEach((seg, idx) => {
      let col;
      if (config.rainbowMode) {
        const hue = (state.tickCount * 5 + idx * -10) % 360;
        col = `hsl(${hue}, 100%, 50%)`;
      } else {
        col = idx === 0 ? config.colorSnakeHead : config.colorSnakeBody;
      }
      drawEntity(seg.x, seg.y, col, fatness);
    });
    ctx.globalAlpha = 1.0;


    
    // Fog of War
    if (config.fogOfWarRadius > 0 && state.snake.length > 0) {
      ctx.save();
      const hx = (state.snake[0].x + 0.5) * cellSize;
      const hy = (state.snake[0].y + 0.5) * cellSize;
      const r = config.fogOfWarRadius * cellSize;

      const grad = ctx.createRadialGradient(hx, hy, r * 0.5, hx, hy, r);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }


    // Overlays
    if (state.status === 'VICTORY') {
      if (!config.acidMode) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }


      ctx.fillStyle = '#15803d'; // green text
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 15);
      
      ctx.fillStyle = '#000000';
      ctx.font = '14px sans-serif';
      ctx.fillText('You reached the target score!', canvas.width / 2, canvas.height / 2 + 10);
      ctx.font = '12px sans-serif';
      ctx.fillText('Press R, Space, or Arrow Key to restart', canvas.width / 2, canvas.height / 2 + 30);
    } else if (state.status === 'GAME_OVER') {
      if (!config.acidMode) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }


      ctx.fillStyle = '#000000';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 12);
      ctx.font = '12px sans-serif';
      ctx.fillText('Press R, Space, or Arrow Key to restart', canvas.width / 2, canvas.height / 2 + 12);
    } else if (state.status === 'PAUSED') {
      if (!config.acidMode) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }


      ctx.fillStyle = '#000000';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
    } else if (state.status === 'IDLE' && !config.autoStart) {
      if (!config.acidMode) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }


      ctx.fillStyle = '#000000';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press Arrow Key or WASD to start', canvas.width / 2, canvas.height / 2);
    }
    this.ctx.restore();
  }
}
