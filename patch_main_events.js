const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

// Chest open
code = code.replace(
    /this\.audio\.playClick\(\); \/\/ Or a specific chest open sound\n                const key = \`\$\{hit\.blockPos\.x\},\$\{hit\.blockPos\.y\},\$\{hit\.blockPos\.z\}\`;/,
    "this.audio.playChestOpen();\n                const key = `${hit.blockPos.x},${hit.blockPos.y},${hit.blockPos.z}`;"
);

// Chest close
code = code.replace(
    /this\.ui\.toggleChest\(hit\.blockPos\.x, hit\.blockPos\.y, hit\.blockPos\.z, this\.chests\.get\(key\), \(\) => \{\n                    \/\/ onClose callback\n                    const visual = this\.chestVisuals\.get\(key\);\n                    if \(visual\) visual\.isOpen = false;\n                \}\);/,
    "this.ui.toggleChest(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, this.chests.get(key), () => {\n                    this.audio.playChestClose();\n                    const visual = this.chestVisuals.get(key);\n                    if (visual) visual.isOpen = false;\n                });"
);

// Door toggle
const regexDoor = /                let door = this\.doors\.get\(key\);\n                if \(!door\) door = this\.doors\.get\(keyLower\);\n                if \(door\) \{\n                    door\.isOpen = !door\.isOpen;\n                    const targetRotation = door\.isOpen \? Math\.PI \/ 2 : 0;/;

const replacementDoor = `                let door = this.doors.get(key);
                if (!door) door = this.doors.get(keyLower);
                if (door) {
                    door.isOpen = !door.isOpen;
                    if (door.isOpen) this.audio.playDoorOpen();
                    else this.audio.playDoorClose();
                    const targetRotation = door.isOpen ? Math.PI / 2 : 0;`;

code = code.replace(regexDoor, replacementDoor);

// Remove the `this.audio.playClick();` right before the door logic
code = code.replace(
    /                this\.audio\.playClick\(\);\n                \n                const key = \`\$\{hit\.blockPos\.x\},\$\{hit\.blockPos\.y\},\$\{hit\.blockPos\.z\}\`;\n                const keyLower = \`\$\{hit\.blockPos\.x\},\$\{hit\.blockPos\.y - 1\},\$\{hit\.blockPos\.z\}\`;/,
    "                const key = `${hit.blockPos.x},${hit.blockPos.y},${hit.blockPos.z}`;\n                const keyLower = `${hit.blockPos.x},${hit.blockPos.y - 1},${hit.blockPos.z}`;"
);

fs.writeFileSync('slopcraft 3D/js/main.js', code);
