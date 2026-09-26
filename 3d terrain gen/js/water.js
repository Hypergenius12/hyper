const waterPlanes = [];

function createWaterChunk(chunkX, chunkZ) {
    const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 8, 8);
    geometry.rotateX(-Math.PI / 2);
    
    const uvs = geometry.attributes.uv.array;
    for (let i = 0; i < uvs.length; i += 2) {
        uvs[i] *= CHUNK_SIZE / 5;
        uvs[i+1] *= CHUNK_SIZE / 5;
    }
    
    window.waterMaterial = new THREE.MeshStandardMaterial({
        map: Textures.water,
        transparent: true,
        opacity: 0.65,
        depthWrite: false, 
        flatShading: true,
        roughness: 0.1,
        metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, window.waterMaterial);
    // Center the water plane in the chunk (terrain starts at chunkX*CHUNK_SIZE, spans CHUNK_SIZE)
    mesh.position.set(chunkX * CHUNK_SIZE + CHUNK_SIZE / 2, WATER_LEVEL - 0.2, chunkZ * CHUNK_SIZE + CHUNK_SIZE / 2);
    
    mesh.userData = {
        initialY: [],
        chunkX, chunkZ
    };
    const positions = geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
        mesh.userData.initialY.push(positions[i]);
    }
    
    waterPlanes.push(mesh);
    return mesh;
}

function animateWater(time) {
    for (const plane of waterPlanes) {
        const positions = plane.geometry.attributes.position.array;
        let vIndex = 0;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i] + plane.position.x;
            const z = positions[i+2] + plane.position.z;
            
            const groundY = getExactHeight(x, z);
            const depth = WATER_LEVEL - groundY;
            
            let waveAmp = 0;
            if (depth > 0) {
                waveAmp = Math.min(depth * 0.15, 0.6); 
            }
            
            const largeWave = (Math.sin(x * 0.5 + time) + Math.cos(z * 0.5 + time)) * waveAmp;
            const ripple = (Math.sin(x * 4.0 + time * 3.0) + Math.cos(z * 4.0 + time * 3.0)) * (waveAmp * 0.1);
            
            positions[i+1] = plane.userData.initialY[vIndex] + largeWave + ripple;
            vIndex++;
        }
        plane.geometry.computeVertexNormals();
        plane.geometry.attributes.position.needsUpdate = true;
    }
}
