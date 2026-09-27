const fs = require('fs');
let code = fs.readFileSync('slopcraft 3D/js/engine.js', 'utf8');

// 1. Add new materials in init()
const newMats = `        const matSlightGlowOpaque = new THREE.MeshPhongMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: false,
            side: THREE.FrontSide,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: textureAtlas.texture,
            emissiveIntensity: 0.2,
            shininess: 0, specular: new THREE.Color(0x000000)
        });
        const matSlightGlowTransparent = new THREE.MeshPhongMaterial({
            map: textureAtlas.texture,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: textureAtlas.texture,
            emissiveIntensity: 0.2,
            shininess: 0, specular: new THREE.Color(0x000000)
        });
        this.sharedMaterials = [matOpaque, matCross, matGlowCross, matWater, matTransparent, matGlowOpaque, matGlowTransparent, matSlightGlowOpaque, matSlightGlowTransparent];
`;
code = code.replace(/        this.sharedMaterials = \[matOpaque, matCross, matGlowCross, matWater, matTransparent, matGlowOpaque, matGlowTransparent\];/g, newMats);

// 2. Modify chunk building to use these new materials
// First, add the index arrays
const indicesLogicOld = `        let opaqueIndexCount = 0;
        let crossIndexCount = 0;
        let glowCrossIndexCount = 0;
        let waterIndexCount = 0;
        let transparentIndexCount = 0;
        let glowOpaqueIndexCount = 0;
        let glowTransparentIndexCount = 0;`;
const indicesLogicNew = `        let opaqueIndexCount = 0;
        let crossIndexCount = 0;
        let glowCrossIndexCount = 0;
        let waterIndexCount = 0;
        let transparentIndexCount = 0;
        let glowOpaqueIndexCount = 0;
        let glowTransparentIndexCount = 0;
        let slightGlowOpaqueIndexCount = 0;
        let slightGlowTransparentIndexCount = 0;`;
code = code.replace(indicesLogicOld, indicesLogicNew);

// Add to totalIndices
code = code.replace(/        const totalIndices = opaqueIndexCount \+ crossIndexCount \+ glowCrossIndexCount \+ waterIndexCount \+ transparentIndexCount \+ glowOpaqueIndexCount \+ glowTransparentIndexCount;/g, 
'        const totalIndices = opaqueIndexCount + crossIndexCount + glowCrossIndexCount + waterIndexCount + transparentIndexCount + glowOpaqueIndexCount + glowTransparentIndexCount + slightGlowOpaqueIndexCount + slightGlowTransparentIndexCount;');

// Add groups
const groupsOld = `        geometry.addGroup(offset, opaqueIndexCount, 0); offset += opaqueIndexCount;
        geometry.addGroup(offset, crossIndexCount, 1); offset += crossIndexCount;
        geometry.addGroup(offset, glowCrossIndexCount, 2); offset += glowCrossIndexCount;
        geometry.addGroup(offset, waterIndexCount, 3); offset += waterIndexCount;
        geometry.addGroup(offset, transparentIndexCount, 4); offset += transparentIndexCount;
        geometry.addGroup(offset, glowOpaqueIndexCount, 5); offset += glowOpaqueIndexCount;
        geometry.addGroup(offset, glowTransparentIndexCount, 6); offset += glowTransparentIndexCount;`;
const groupsNew = `        geometry.addGroup(offset, opaqueIndexCount, 0); offset += opaqueIndexCount;
        geometry.addGroup(offset, crossIndexCount, 1); offset += crossIndexCount;
        geometry.addGroup(offset, glowCrossIndexCount, 2); offset += glowCrossIndexCount;
        geometry.addGroup(offset, waterIndexCount, 3); offset += waterIndexCount;
        geometry.addGroup(offset, transparentIndexCount, 4); offset += transparentIndexCount;
        geometry.addGroup(offset, glowOpaqueIndexCount, 5); offset += glowOpaqueIndexCount;
        geometry.addGroup(offset, glowTransparentIndexCount, 6); offset += glowTransparentIndexCount;
        geometry.addGroup(offset, slightGlowOpaqueIndexCount, 7); offset += slightGlowOpaqueIndexCount;
        geometry.addGroup(offset, slightGlowTransparentIndexCount, 8); offset += slightGlowTransparentIndexCount;`;
code = code.replace(groupsOld, groupsNew);

fs.writeFileSync('slopcraft 3D/js/engine.js', code);
