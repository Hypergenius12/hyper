const fs = require('fs');
let carCode = fs.readFileSync('js/car.js', 'utf8');

const newRender = `
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.moveTo(this.width/2 + 4, 4);
        ctx.lineTo(-this.width/2 + 4, this.height/2 + 4);
        ctx.lineTo(-this.width/2 + 4, -this.height/2 + 4);
        ctx.fill();

        // Car Body (Angular F1 style)
        ctx.fillStyle = this.alive ? (this.color === '#ef4444' ? '#ff2a2a' : '#ffffff') : '#333333';
        ctx.beginPath();
        ctx.moveTo(this.width/2, 0); // Nose
        ctx.lineTo(this.width/4, this.height/2); // Right wing
        ctx.lineTo(-this.width/2, this.height/2); // Right tail
        ctx.lineTo(-this.width/2.5, 0); // Center tail indent
        ctx.lineTo(-this.width/2, -this.height/2); // Left tail
        ctx.lineTo(this.width/4, -this.height/2); // Left wing
        ctx.closePath();
        ctx.fill();
        
        // Stroke
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#111';
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(this.width/6, 0);
        ctx.lineTo(-this.width/6, this.height/4);
        ctx.lineTo(-this.width/4, 0);
        ctx.lineTo(-this.width/6, -this.height/4);
        ctx.fill();

        // Thruster glow if accelerating (only visual if alive)
        if (this.alive && this.speed > 5) {
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(-this.width/2 - 2, 0, Math.random() * 4 + 2, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }
`;

carCode = carCode.replace(/render\(ctx\) \{[\s\S]*?renderSensors\(ctx\)/, newRender.trim() + '\n\n    renderSensors(ctx)');

fs.writeFileSync('js/car.js', carCode);
console.log("Updated car.js");
