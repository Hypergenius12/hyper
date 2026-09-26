const simplex = new SimplexNoise('seed' + Math.random());

function getNoise(x, z) {
    const scale = 0.0015;
    
    let elevation = simplex.noise2D(scale * 0.5 * x, scale * 0.5 * z);
    elevation = (elevation + 1) / 2; 
    
    let roughness = simplex.noise2D(scale * 0.3 * x + 1000, scale * 0.3 * z + 1000);
    roughness = (roughness + 1) / 2; 
    
    let detail = 1 * simplex.noise2D(scale * 2 * x, scale * 2 * z)
               + 0.5 * simplex.noise2D(scale * 4 * x, scale * 4 * z)
               + 0.25 * simplex.noise2D(scale * 8 * x, scale * 8 * z);
    detail = (detail + 1.75) / 3.5; 
    
    // Base height raised to compensate for removal of mountain multipliers
    let height = elevation * 0.4 + 0.15;
    
    if (roughness > 0.4) {
        let hillIntensity = (roughness - 0.4) / 0.6;
        hillIntensity = Math.pow(hillIntensity, 1.5);
        
        const temp = simplex.noise2D(x * 0.0005 + 5000, z * 0.0005 + 5000);
        let desertFactor = 0;
        
        // Fade into desert faster
        if (temp > 0.25) {
            desertFactor = (temp - 0.25) / 0.05;
            desertFactor = Math.min(1.0, desertFactor);
        }
        
        hillIntensity *= (1.0 - (desertFactor * 0.5));
        
        height += detail * hillIntensity * 1.5;
    }
    
    // Prevent lakes from forming near biome borders
    const tempBorder = simplex.noise2D(x * 0.0005 + 5000, z * 0.0005 + 5000);
    const distToTaiga = Math.abs(tempBorder - (-0.5));
    const distToDesert = Math.abs(tempBorder - 0.5);
    const borderDist = Math.min(distToTaiga, distToDesert);
    
    const NO_WATER_ZONE = 0.15;
    if (borderDist < NO_WATER_ZONE) {
        let bump = 1.0 - (borderDist / NO_WATER_ZONE);
        bump = Math.sin(bump * Math.PI / 2); 
        
        const deficit = Math.max(0, 0.33 - height);
        height += deficit * bump;
    }
    
    return height;
}

function getExactHeight(x, z) {
    return getNoise(x, z) * 60;
}
window.getExactHeight = getExactHeight;
window.getNoise = getNoise;
