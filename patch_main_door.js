const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/main.js', 'utf8');

const regexDoorGeom = /        \/\/ Build material from texture atlas\n        const uvInfo = this\.atlas\.getUV\(window\.BLOCKS\.DUNGEON_DOOR\);\n        \n        \/\/ Map the UVs correctly so the door texture maps cleanly to the 1x1 face\n        const uvs = doorGeom\.attributes\.uv\.array;\n        for \(let i = 0; i < 6; i\+\+\) \{\n            for \(let v = 0; v < 6; v\+\+\) \{\n                const baseU = uvs\[i \* 12 \+ v \* 2\];\n                const baseV = uvs\[i \* 12 \+ v \* 2 \+ 1\];\n                uvs\[i \* 12 \+ v \* 2\] = uvInfo\.u \+ baseU \* uvInfo\.uSize;\n                uvs\[i \* 12 \+ v \* 2 \+ 1\] = uvInfo\.v \+ baseV \* uvInfo\.vSize;\n            \}\n        \}\n        \n        const mat = new THREE\.MeshLambertMaterial\(\{ \n            map: this\.atlas\.texture, \n            transparent: false, \n            alphaTest: 0\.5,\n            side: THREE\.DoubleSide\n        \}\);\n        \n        \/\/ Pivot point should be on the edge, not center\n        doorGeom\.translate\(0\.5, 0\.5, 0\); \n        \n        const doorGroup = new THREE\.Group\(\);\n        const meshBot = new THREE\.Mesh\(doorGeom, mat\);\n        const meshTop = new THREE\.Mesh\(doorGeom, mat\);/;

const replacementDoorGeom = `        // Create materials from texture atlas
        const uvInfoBot = this.atlas.getUV(window.BLOCKS.DUNGEON_DOOR);
        const uvInfoTop = this.atlas.getUV(window.BLOCKS.DUNGEON_DOOR_TOP);
        
        const doorGeomBot = doorGeom.clone();
        const doorGeomTop = doorGeom.clone();

        const uvsBot = doorGeomBot.attributes.uv.array;
        for (let i = 0; i < 6; i++) {
            for (let v = 0; v < 6; v++) {
                const baseU = uvsBot[i * 12 + v * 2];
                const baseV = uvsBot[i * 12 + v * 2 + 1];
                uvsBot[i * 12 + v * 2] = uvInfoBot.u + baseU * uvInfoBot.uSize;
                uvsBot[i * 12 + v * 2 + 1] = uvInfoBot.v + baseV * uvInfoBot.vSize;
            }
        }
        
        const uvsTop = doorGeomTop.attributes.uv.array;
        for (let i = 0; i < 6; i++) {
            for (let v = 0; v < 6; v++) {
                const baseU = uvsTop[i * 12 + v * 2];
                const baseV = uvsTop[i * 12 + v * 2 + 1];
                uvsTop[i * 12 + v * 2] = uvInfoTop.u + baseU * uvInfoTop.uSize;
                uvsTop[i * 12 + v * 2 + 1] = uvInfoTop.v + baseV * uvInfoTop.vSize;
            }
        }
        
        const mat = new THREE.MeshLambertMaterial({ 
            map: this.atlas.texture, 
            transparent: true, 
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });
        
        doorGeomBot.translate(0.5, 0.5, 0); 
        doorGeomTop.translate(0.5, 0.5, 0); 
        
        const doorGroup = new THREE.Group();
        const meshBot = new THREE.Mesh(doorGeomBot, mat);
        const meshTop = new THREE.Mesh(doorGeomTop, mat);`;

code = code.replace(regexDoorGeom, replacementDoorGeom);

fs.writeFileSync('slopcraft 3D/js/main.js', code);
