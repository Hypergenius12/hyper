const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

const regexDoor = /                let door = this\.doors\.get\(key\);\n                if \(\!door\) door = this\.doors\.get\(keyLower\);\n                \n                if \(door\) \{\n                    door\.isOpen = \!door\.isOpen;\n                    const targetRotation = door\.isOpen \? Math\.PI \/ 2 : 0;/;
const replacementDoor = `                let door = this.doors.get(key);
                if (!door) door = this.doors.get(keyLower);
                
                if (door) {
                    door.isOpen = !door.isOpen;
                    if (door.isOpen) this.audio.playDoorOpen(hit.blockPos);
                    else this.audio.playDoorClose(hit.blockPos);
                    const targetRotation = door.isOpen ? Math.PI / 2 : 0;`;

code = code.replace(regexDoor, replacementDoor);

fs.writeFileSync('slopcraft 3D/js/main.js', code);
