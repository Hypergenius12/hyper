const fs = require('fs');
let code = fs.readFileSync('js/textureGen.js', 'utf8');

// Generate lens flare texture
const flareCode = `
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
`;
if (!code.includes('generateFlareTexture')) {
    code = code.replace('function initTextures() {', flareCode + '\nfunction initTextures() {');
    code = code.replace('Textures.wood = createSeamlessTexture(16, [80, 50, 30], 30, \'wood\');', 
    'Textures.wood = createSeamlessTexture(16, [80, 50, 30], 30, \'wood\');\n    Textures.flare = generateFlareTexture();');
    fs.writeFileSync('js/textureGen.js', code);
}

let skyCode = fs.readFileSync('js/sky.js', 'utf8');
if (!skyCode.includes('THREE.Lensflare')) {
    skyCode = skyCode.replace('scene.add(this.sunLight);', 
    `scene.add(this.sunLight);
        
        // Lens flare
        if (typeof THREE.Lensflare !== 'undefined') {
            const lensflare = new THREE.Lensflare();
            lensflare.addElement(new THREE.LensflareElement(Textures.flare, 700, 0, this.sunLight.color));
            lensflare.addElement(new THREE.LensflareElement(Textures.flare, 60, 0.6));
            lensflare.addElement(new THREE.LensflareElement(Textures.flare, 70, 0.7));
            lensflare.addElement(new THREE.LensflareElement(Textures.flare, 120, 0.9));
            lensflare.addElement(new THREE.LensflareElement(Textures.flare, 70, 1.0));
            this.sunLight.add(lensflare);
        }`);
    fs.writeFileSync('js/sky.js', skyCode);
}
