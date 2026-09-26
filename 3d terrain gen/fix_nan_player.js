const fs = require('fs');
let code = fs.readFileSync('js/player.js', 'utf8');

const oldCode = `        let newX = this.yawObject.position.x + movement.x;
        let newZ = this.yawObject.position.z + movement.z;`;

const newCode = `        let newX = this.yawObject.position.x + movement.x;
        let newZ = this.yawObject.position.z + movement.z;
        if (isNaN(newX) || isNaN(newZ)) {
            console.error("NaN detected in player position!", {x: this.yawObject.position.x, z: this.yawObject.position.z, movX: movement.x, movZ: movement.z, velX: this.velocity.x, velZ: this.velocity.z, delta: delta});
            newX = 0;
            newZ = 0;
            this.velocity.set(0,0,0);
        }`;

code = code.replace(oldCode, newCode);

const oldCode2 = `        this.yawObject.position.x = newX;
        this.yawObject.position.z = newZ;
        this.yawObject.position.y += (this.velocity.y * delta);`;

const newCode2 = `        this.yawObject.position.x = newX;
        this.yawObject.position.z = newZ;
        if (isNaN(this.velocity.y)) this.velocity.y = 0;
        this.yawObject.position.y += (this.velocity.y * delta);
        if (isNaN(this.yawObject.position.y)) this.yawObject.position.y = 50;
`;

code = code.replace(oldCode2, newCode2);

fs.writeFileSync('js/player.js', code);
