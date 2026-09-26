const chunks = new Map();
window.RENDER_DISTANCE = 5;

function getChunkKey(x, z) {
    return `${x},${z}`;
}

function updateWorld(playerPos, scene) {
    const pChunkX = Math.round(playerPos.x / CHUNK_SIZE);
    const pChunkZ = Math.round(playerPos.z / CHUNK_SIZE);
    
    for (let x = -window.RENDER_DISTANCE; x <= window.RENDER_DISTANCE; x++) {
        for (let z = -window.RENDER_DISTANCE; z <= window.RENDER_DISTANCE; z++) {
            if (x*x + z*z > window.RENDER_DISTANCE*window.RENDER_DISTANCE) continue;
            
            const cx = pChunkX + x;
            const cz = pChunkZ + z;
            const key = getChunkKey(cx, cz);
            
            if (!chunks.has(key)) {
                const chunkData = generateChunkMesh(cx, cz);
                const water = createWaterChunk(cx, cz);
                const props = generatePropsForChunk(cx, cz, scene, chunkData.vertexGrid);
                
                scene.add(chunkData.mesh);
                scene.add(water);
                
                chunks.set(key, {
                    terrain: chunkData.mesh,
                    water: water,
                    props: props,
                    x: cx, z: cz
                });
            }
        }
    }
    
    for (const [key, chunk] of chunks.entries()) {
        const dist = Math.sqrt(Math.pow(chunk.x - pChunkX, 2) + Math.pow(chunk.z - pChunkZ, 2));
        if (dist > window.RENDER_DISTANCE + 1) {
            scene.remove(chunk.terrain);
            chunk.terrain.geometry.dispose();
            chunk.terrain.material.dispose();
            
            scene.remove(chunk.water);
            chunk.water.geometry.dispose();
            chunk.water.material.dispose();
            
            chunk.props.forEach(p => {
                p.traverse(child => {
                    if (child.isMesh) {
                        child.geometry.dispose();
                        // Materials are shared globally now, so we don't dispose them!
                    }
                });
                scene.remove(p);
            });
            
            // Clean up old colliders
            if (window.treeColliders) {
                window.treeColliders = window.treeColliders.filter(c => {
                    const dx = c.x - (chunk.x * CHUNK_SIZE);
                    const dz = c.z - (chunk.z * CHUNK_SIZE);
                    return Math.abs(dx) > CHUNK_SIZE || Math.abs(dz) > CHUNK_SIZE;
                });
            }
            
            chunks.delete(key);
        }
    }
}
