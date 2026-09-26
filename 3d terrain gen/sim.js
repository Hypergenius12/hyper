const SimplexNoise = require('./simplex.js');
const simplex = new SimplexNoise('seed');
let above20 = 0, total = 0, above18 = 0;
for(let x = 0; x < 1000; x+=10) {
    for(let z = 0; z < 1000; z+=10) {
        const scale = 0.0015;
        let elevation = simplex.noise2D(scale * 0.5 * x, scale * 0.5 * z);
        elevation = (elevation + 1) / 2; 
        
        let roughness = simplex.noise2D(scale * 0.3 * x + 1000, scale * 0.3 * z + 1000);
        roughness = (roughness + 1) / 2; 
        
        let detail = 1 * simplex.noise2D(scale * 2 * x, scale * 2 * z)
                   + 0.5 * simplex.noise2D(scale * 4 * x, scale * 4 * z)
                   + 0.25 * simplex.noise2D(scale * 8 * x, scale * 8 * z);
        detail = (detail + 1.75) / 3.5; 
        
        let height = elevation * 0.4 + 0.15;
        
        if (roughness > 0.4) {
            let hillIntensity = (roughness - 0.4) / 0.6;
            hillIntensity = Math.pow(hillIntensity, 1.5);
            const temp = simplex.noise2D(x * 0.0005 + 5000, z * 0.0005 + 5000);
            let desertFactor = 0;
            if (temp > 0.25) {
                desertFactor = (temp - 0.25) / 0.05;
                desertFactor = Math.min(1.0, desertFactor);
            }
            hillIntensity *= (1.0 - (desertFactor * 0.5));
            height += detail * hillIntensity * 1.5;
        }
        
        let finalY = height * 60;
        if(finalY > 20) above20++;
        if(finalY > 18) above18++;
        total++;
    }
}
console.log('above 20 (trees):', above20 / total);
console.log('above 18 (land):', above18 / total);
