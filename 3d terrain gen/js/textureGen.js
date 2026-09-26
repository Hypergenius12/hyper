const Textures = {};

function createSeamlessTexture(size, baseColor, noiseVariation, patternType) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`;
    ctx.fillRect(0, 0, size, size);
    
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        let x = (i / 4) % size;
        let y = Math.floor((i / 4) / size);
        
        let variation = (Math.random() - 0.5) * noiseVariation;
        
        if (patternType === 'wood') {
            let woodGrain = Math.sin(y * 0.8 + Math.random()) * 20; // Vertical grain
            variation += woodGrain;
        } else if (patternType === 'leaves') {
            variation += (Math.random() > 0.5 ? 20 : -20);
        } else if (patternType === 'tall_grass') {
            if (Math.random() > 0.6 && y > 4) {
                // Random green vertical streaks
                data[i] = 30 + Math.random()*40; data[i+1] = 130 + Math.random()*50; data[i+2] = 30;
                continue;
            } else {
                // Transparent
                data[i+3] = 0;
                continue;
            }
        } else if (patternType === 'flower_red') {
            if (Math.random() > 0.7) {
                data[i] = 200 + Math.random()*50; data[i+1] = 50; data[i+2] = 50; // Red petals
                continue;
            } else if (Math.random() > 0.8) {
                data[i] = 255; data[i+1] = 255; data[i+2] = 0; // Yellow center
                continue;
            }
        } else if (patternType === 'flower_yellow') {
             if (Math.random() > 0.7) {
                data[i] = 200 + Math.random()*55; data[i+1] = 200 + Math.random()*55; data[i+2] = 50;
                continue;
            }
        }
        
        data[i] = Math.max(0, Math.min(255, baseColor[0] + variation));
        data[i+1] = Math.max(0, Math.min(255, baseColor[1] + variation));
        data[i+2] = Math.max(0, Math.min(255, baseColor[2] + variation));
    }
    ctx.putImageData(imgData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    
    return texture;
}


function generateFlareTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.1, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.3, 'rgba(255,200,100,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(canvas);
}
Textures.flare = null; // Wait for init

function initTextures() {
    // 16x16 for that crisp retro Minecraft feel
    Textures.base = createSeamlessTexture(16, [200, 200, 200], 40, 'noise'); // Grayscale for vertex coloring
    Textures.grass = createSeamlessTexture(16, [70, 160, 70], 40, 'noise');
    Textures.dirt = createSeamlessTexture(16, [101, 67, 33], 20, 'noise');
    Textures.wood = createSeamlessTexture(16, [80, 50, 30], 30, 'wood');
    Textures.flare = generateFlareTexture();
    Textures.leaves = createSeamlessTexture(16, [40, 110, 40], 50, 'leaves');
    Textures.leavesCherry = createSeamlessTexture(16, [255, 183, 197], 50, 'leaves');
    Textures.water = createSeamlessTexture(16, [50, 120, 200], 10, 'noise');
    Textures.flowerRed = createSeamlessTexture(8, [40, 120, 40], 20, 'flower_red');
    Textures.flowerYellow = createSeamlessTexture(8, [40, 120, 40], 20, 'flower_yellow');
    Textures.tallGrass = createSeamlessTexture(8, [0, 0, 0], 0, 'tall_grass');
}
