const fs = require('fs');
let code = fs.readFileSync('js/props.js', 'utf8');

// 1. Wind sway shader injection
const windShaderCode = `
    if (!window.windShaderParams) {
        window.windShaderParams = {
            time: { value: 0 },
            windStrength: { value: 1.0 }
        };
    }
    
    function addWindSway(material) {
        material.onBeforeCompile = function(shader) {
            shader.uniforms.time = window.windShaderParams.time;
            shader.uniforms.windStrength = window.windShaderParams.windStrength;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                \`
                #include <begin_vertex>
                float sway = max(0.0, position.y) * 0.05 * windStrength;
                transformed.x += sin(time * 2.0 + position.x * 0.5 + position.z * 0.5) * sway;
                transformed.z += cos(time * 1.5 + position.z * 0.5) * sway;
                \`
            );
        };
    }
`;

if (!code.includes('addWindSway')) {
    code = code.replace('function initPropMaterials() {', windShaderCode + '\nfunction initPropMaterials() {');
    code = code.replace(/window\.PropMaterials\.leavesForest = new THREE\.MeshStandardMaterial\(\{.*?\}\);/, 
        '$&\n    addWindSway(window.PropMaterials.leavesForest);');
    code = code.replace(/window\.PropMaterials\.leavesTaiga = new THREE\.MeshStandardMaterial\(\{.*?\}\);/, 
        '$&\n    addWindSway(window.PropMaterials.leavesTaiga);');
    code = code.replace(/window\.PropMaterials\.flowerRed = new THREE\.MeshStandardMaterial\(\{.*?\}\);/, 
        '$&\n    addWindSway(window.PropMaterials.flowerRed);');
    code = code.replace(/window\.PropMaterials\.flowerYellow = new THREE\.MeshStandardMaterial\(\{.*?\}\);/, 
        '$&\n    addWindSway(window.PropMaterials.flowerYellow);');
}

// 2. Increase tree density
code = code.replace(/let spawnChance = 0\.005 \+ \(\(densityNoise \+ 1\) \/ 2\) \* 0\.08;/, 'let spawnChance = 0.01 + ((densityNoise + 1) / 2) * 0.12;');

// 3. Smaller trees
code = code.replace(/const trunkGeo = new THREE\.CylinderGeometry\(0\.4, 0\.5, height, 5\);/, 'const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, height * 0.85, 5);');
code = code.replace(/const coneGeo = new THREE\.ConeGeometry\(radius, 3\.5, 6\);/g, 'const coneGeo = new THREE.ConeGeometry(radius * 0.85, 3.5 * 0.85, 6);');
code = code.replace(/const trunkGeo = new THREE\.CylinderGeometry\(0\.3, 0\.4, height, 5\);/, 'const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, height * 0.85, 5);'); // the non-taiga one
code = code.replace(/const leavesGeo = new THREE\.IcosahedronGeometry\(2\.5, 1\);/g, 'const leavesGeo = new THREE.IcosahedronGeometry(2.0, 1);');
code = code.replace(/const leavesGeo2 = new THREE\.IcosahedronGeometry\(1\.8, 1\);/g, 'const leavesGeo2 = new THREE.IcosahedronGeometry(1.5, 1);');

// The translate for Taiga was using height/2
code = code.replace(/trunkGeo\.translate\(0, height \/ 2, 0\);/g, 'trunkGeo.translate(0, (height * 0.85) / 2, 0);');
code = code.replace(/coneGeo\.translate\(0, height \+ 0\.5 \+ \(i \* 2\.0\), 0\);/g, 'coneGeo.translate(0, (height * 0.85) + 0.5 + (i * 1.7), 0);');

fs.writeFileSync('js/props.js', code);
