const CHUNK_SIZE = 64;
const WATER_LEVEL = 18;

// With the voxel engine removed, ground height is exactly the heightmap
window.getPlayerGroundHeight = function(px, py, pz) {
    return getExactHeight(px, pz); 
};

function generateChunkMesh(chunkX, chunkZ) {
    // 32 segments across 64 units = 2 units per segment (matches old VOXEL_SIZE)
    const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 32, 32);
    geometry.rotateX(-Math.PI / 2); // Lay flat
    
    const worldOffsetX = chunkX * CHUNK_SIZE;
    const worldOffsetZ = chunkZ * CHUNK_SIZE;
    
    // Position mesh at chunk center so the PlaneGeometry aligns correctly
    // A PlaneGeometry is centered at 0,0,0.
    const meshCenterX = worldOffsetX + CHUNK_SIZE / 2;
    const meshCenterZ = worldOffsetZ + CHUNK_SIZE / 2;
    
    const posAttr = geometry.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const uvs = new Float32Array(posAttr.count * 2);
    
    const colorSand = new THREE.Color(0xe3d69a);
    const colorGrass = new THREE.Color(0x3eb13e);
    const colorTaiga = new THREE.Color(0xf2f7f7);
    const colorRock = new THREE.Color(0x666666);
    
    function getColor(gx, gy, gz) {
        let temp = simplex.noise2D(gx * 0.0005 + 5000, gz * 0.0005 + 5000);
        const isTaiga = temp < -0.5;
        let vColor = new THREE.Color();
        
        if (gy <= WATER_LEVEL + 0.1 && isTaiga) {
            vColor.setHex(0x55aaff);
        } else if (gy < WATER_LEVEL + 0.8 && !isTaiga) {
            vColor.copy(colorSand);
        } else {
            if (temp < -0.4) {
                let t = (temp + 0.5) / 0.1; 
                vColor.copy(colorTaiga).lerp(colorGrass, Math.max(0, Math.min(1, t)));
            } else if (temp > 0.25) {
                let t = (temp - 0.25) / 0.15;
                vColor.copy(colorGrass).lerp(new THREE.Color(0xe6caa8), Math.max(0, Math.min(1, t)));
            } else {
                vColor.copy(colorGrass);
            }
            // High altitude rock coloring
            if (gy > WATER_LEVEL + 20) {
                let tRock = (gy - (WATER_LEVEL + 20)) / 30;
                vColor.lerp(colorRock, Math.max(0, Math.min(1, tRock)));
            }
        }
        return vColor;
    }
    
    // Build vertex grid for prop placement (sampled less frequently to save prop count)
    const vertexGrid = [];
    
    for (let i = 0; i < posAttr.count; i++) {
        // PlaneGeometry coordinates are local to the center
        let localX = posAttr.getX(i);
        let localZ = posAttr.getZ(i);
        
        let worldX = meshCenterX + localX;
        let worldZ = meshCenterZ + localZ;
        
        let worldY = getExactHeight(worldX, worldZ);
        posAttr.setY(i, worldY);
        
        // UV mapping - tile texture every 16 units
        uvs[i * 2] = (worldX / CHUNK_SIZE) * 16;
        uvs[i * 2 + 1] = (worldZ / CHUNK_SIZE) * 16;
        
        // Vertex coloring
        let c = getColor(worldX, worldY, worldZ);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        
        // Populate vertex grid (sample every other vertex roughly)
        // A 32x32 plane has 33x33 vertices. We only want a subset for props.
        if (i % 2 === 0) {
            vertexGrid.push({x: worldX, y: worldY, z: worldZ});
        }
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
        map: Textures.base,
        vertexColors: true,
        flatShading: true,
        roughness: 1.0,
        metalness: 0.0,
        dithering: true
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(meshCenterX, 0, meshCenterZ);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    
    return { mesh, chunkX, chunkZ, geometry, vertexGrid };
}
