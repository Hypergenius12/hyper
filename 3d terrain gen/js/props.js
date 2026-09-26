window.PropMaterials = {
    trunk: null,
    leavesForest: null,
    leavesTaiga: null,
    kelp: null,
    blade: null,
    stem: null,
    flowerYellow: null,
    flowerRed: null,
    cactus: null,
    deadStick: null,
    snow: null,
    palmLeaf: null
};


    if (!window.windShaderParams) {
        window.windShaderParams = {
            time: { value: 0 },
            windStrength: { value: 1.0 }
        };
    }
    
    
function initPropMaterials() {
    if (window.PropMaterials.trunk) return;
    window.PropMaterials.log = new THREE.MeshStandardMaterial({ map: Textures.wood, color: 0x888888, flatShading: true });
    window.PropMaterials.trunk = new THREE.MeshStandardMaterial({ map: Textures.wood, flatShading: true });
    window.PropMaterials.leavesForest = new THREE.MeshStandardMaterial({ map: Textures.leaves, color: 0xffffff, flatShading: true, transparent: false, depthWrite: true, depthTest: true });
    
    window.PropMaterials.leavesTaiga = new THREE.MeshStandardMaterial({ map: Textures.leaves, color: 0x2e4f3a, flatShading: true, transparent: false, depthWrite: true, depthTest: true });
    window.PropMaterials.leavesCherry = new THREE.MeshStandardMaterial({ map: Textures.leavesCherry, color: 0xffffff, flatShading: true, transparent: false, depthWrite: true, depthTest: true });
     // dark green
    window.PropMaterials.snow = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, transparent: false, depthWrite: true, depthTest: true });
    window.PropMaterials.kelp = new THREE.MeshStandardMaterial({ color: 0x1c5c1c, flatShading: true });
    
    // Inject custom wiggle vertex shader for kelp
    window.PropMaterials.kelp.onBeforeCompile = function(shader) {
        shader.uniforms.time = { value: 0 };
        window.PropMaterials.kelp.userData.shader = shader;
        shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            vec3 transformed = vec3(position);
            // Kelp roots are lower, tops are higher.
            float wiggle = sin(transformed.y * 2.0 + time * 2.0) * 0.15;
            transformed.x += wiggle;
            `
        );
    };
    
    window.PropMaterials.blade = new THREE.MeshStandardMaterial({ color: 0x4a934a, flatShading: true });
    window.PropMaterials.stem = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, flatShading: true });
    window.PropMaterials.flowerYellow = new THREE.MeshStandardMaterial({ color: 0xe5e533, flatShading: true });
    
    window.PropMaterials.flowerRed = new THREE.MeshStandardMaterial({ color: 0xe53333, flatShading: true });
    
    window.PropMaterials.cactus = new THREE.MeshStandardMaterial({ color: 0x4f874f, flatShading: true });
    window.PropMaterials.deadStick = new THREE.MeshStandardMaterial({ color: 0x8b7355, flatShading: true });
    window.PropMaterials.palmLeaf = new THREE.MeshStandardMaterial({ color: 0x5a9e3a, flatShading: true });
}

function createTree(x, y, z, isTaiga = false, isDead = false) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);
    
    if (isTaiga && !isDead) {
        // Spruce Tree (Stacked Cones)
        const height = 5; // Taller trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, height * 0.85, 5);
        trunkGeo.translate(0, (height * 0.85) / 2, 0);
        const trunk = new THREE.Mesh(trunkGeo, window.PropMaterials.trunk);
        treeGroup.add(trunk);
        
        const numLayers = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numLayers; i++) {
            const radius = 3.5 - (i * 0.7);
            const coneGeo = new THREE.ConeGeometry(radius * 0.85, 3.5 * 0.85, 6);
            coneGeo.translate(0, (height * 0.85) + 0.5 + (i * 1.7), 0); // Cones start higher up
            const leaves = new THREE.Mesh(coneGeo, window.PropMaterials.leavesTaiga);
            treeGroup.add(leaves);
            
            // Snowcap
            const snowGeo = new THREE.ConeGeometry(radius * 0.95, 3.5, 6);
            snowGeo.translate(0, height + 0.5 + (i * 2.0) + 0.1, 0);
            const snow = new THREE.Mesh(snowGeo, window.PropMaterials.snow);
            treeGroup.add(snow);
        }
        
        window.treeColliders = window.treeColliders || [];
        window.treeColliders.push({x: x, z: z, radius: 0.6 * 1.5});
    } else {
        // Standard Tree (or Dead Tree)
        const height = 8 + Math.random() * 6; // Taller trunk
        const trunkWidth = 0.6;
        const trunkGeo = new THREE.CylinderGeometry(trunkWidth, trunkWidth, height, 5);
        trunkGeo.translate(0, (height * 0.85) / 2, 0);
        const trunk = new THREE.Mesh(trunkGeo, window.PropMaterials.trunk);
        treeGroup.add(trunk);
        
        if (!isDead) {
            const leafSize = 4.0 + Math.random() * 1.5;
            const leafGeo = new THREE.IcosahedronGeometry(leafSize, 0);
            leafGeo.translate(0, height + (leafSize * 0.6), 0);
            const leaves = new THREE.Mesh(leafGeo, window.PropMaterials.leavesForest);
            treeGroup.add(leaves);
        } else {
            // Dead branches
            const numBranches = 2 + Math.floor(Math.random() * 3);
            for(let i=0; i<numBranches; i++) {
                const branchGeo = new THREE.CylinderGeometry(0.1, 0.2, 3, 4);
                branchGeo.translate(0, 1.5, 0);
                const branch = new THREE.Mesh(branchGeo, window.PropMaterials.trunk);
                branch.position.set(0, height * (0.5 + Math.random()*0.4), 0);
                branch.rotation.set((Math.random()-0.5)*2, Math.random()*Math.PI, (Math.random()-0.5)*2);
                treeGroup.add(branch);
            }
        }
        
        window.treeColliders = window.treeColliders || [];
        window.treeColliders.push({x: x, z: z, radius: (trunkWidth + 0.2) * 1.5});
    }
    
    if (isTaiga) {
        treeGroup.scale.setScalar(1.5);
    } else {
        treeGroup.scale.setScalar(1.2);
    }
    return treeGroup;
}

function createFlower(x, y, z, type) {
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(x, y, z);
    
    if (type === 3) {
        const numSegments = 3 + Math.floor(Math.random() * 4);
        let currentY = 0;
        for (let i = 0; i < numSegments; i++) {
            const h = 0.8 + Math.random() * 0.5;
            const geo = new THREE.BoxGeometry(0.3, h, 0.3);
            geo.translate(0, h/2, 0);
            const segment = new THREE.Mesh(geo, window.PropMaterials.kelp);
            segment.position.y = currentY;
            segment.rotation.set((Math.random()-0.5)*0.2, Math.random()*Math.PI, (Math.random()-0.5)*0.2);
            flowerGroup.add(segment);
            currentY += h - 0.1;
        }
    } else if (type === 2) {
        const numBlades = 3 + Math.floor(Math.random() * 3);
        for(let i=0; i<numBlades; i++) {
            const h = 0.5 + Math.random() * 0.8;
            const bladeGeo = new THREE.BoxGeometry(0.1, h, 0.1);
            bladeGeo.translate(0, h/2, 0);
            const blade = new THREE.Mesh(bladeGeo, window.PropMaterials.blade);
            blade.position.set((Math.random()-0.5)*0.6, 0, (Math.random()-0.5)*0.6);
            blade.rotation.set((Math.random()-0.5)*0.3, Math.random()*Math.PI, (Math.random()-0.5)*0.3);
            flowerGroup.add(blade);
        }
    } else {
        const stemGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        stemGeo.translate(0, 0.4, 0);
        const stem = new THREE.Mesh(stemGeo, window.PropMaterials.stem);
        
        const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const head = new THREE.Mesh(headGeo, type === 1 ? window.PropMaterials.flowerYellow : window.PropMaterials.flowerRed);
        head.position.y = 0.8;
        head.rotation.set(Math.random(), Math.random(), Math.random());
        
        flowerGroup.add(stem);
        flowerGroup.add(head);
    }
    
    return flowerGroup;
}

function generatePropsForChunk(chunkX, chunkZ, scene, vertexGrid) {
    initPropMaterials();
    const tempGroup = new THREE.Group();
    
    for (let i = 0; i < vertexGrid.length; i++) {
        const v = vertexGrid[i];
        
        const temp = simplex.noise2D(v.x * 0.0005 + 5000, v.z * 0.0005 + 5000);
        
        const isTaiga = temp < -0.5;
        const isDesert = temp > 0.25;
        const isCherry = temp > 0.1 && temp <= 0.25;
        
        if (v.y > WATER_LEVEL + 2) {
            if (isDesert) {
                if (Math.random() < 0.008) {
                    tempGroup.add(createSaguaro(v.x, v.y, v.z));
                } else if (Math.random() < 0.02) {
                    tempGroup.add(createCactus(v.x, v.y, v.z));
                } else if (Math.random() < 0.04) {
                    tempGroup.add(createDeadStick(v.x, v.y, v.z));
                }
            } else {
                let densityNoise = simplex.noise2D(v.x * 0.002 + 8000, v.z * 0.002 + 8000);
                let spawnChance = 0.01 + ((densityNoise + 1) / 2) * 0.12; // 0.005 to 0.085
                if (isTaiga) spawnChance *= 1.4; // Slightly denser winter forests
                if (Math.random() < spawnChance) {
                    tempGroup.add(createTree(v.x, v.y, v.z, isTaiga, isCherry));
                    if (Math.random() < 0.05) {
                        const log = new THREE.Mesh(createLog(v.x + (Math.random()-0.5)*4, v.y, v.z + (Math.random()-0.5)*4), window.PropMaterials.log);
                        tempGroup.add(log);
                    }
                    if (Math.random() < 0.1) {
                        const shrubObj = createShrub(v.x + (Math.random()-0.5)*5, v.y, v.z + (Math.random()-0.5)*5, isCherry);
                        const mat = isCherry ? window.PropMaterials.leavesCherry : window.PropMaterials.leavesForest;
                        const shrub = new THREE.Mesh(shrubObj.geo, mat);
                        tempGroup.add(shrub);
                    }
                } else if (Math.random() < 0.08 && !isTaiga) {
                    tempGroup.add(createFlower(v.x, v.y, v.z, Math.floor(Math.random() * 2)));
                }
            }
        } else if (v.y < WATER_LEVEL - 2) {
            if (Math.random() < 0.15) {
                tempGroup.add(createFlower(v.x, v.y, v.z, 3));
            }
        } else if (v.y >= WATER_LEVEL && v.y <= WATER_LEVEL + 2 && !isTaiga && !isDesert) {
            // Beach logic
            if (Math.random() < 0.02) {
                tempGroup.add(createPalmTree(v.x, v.y, v.z));
            }
        }
        

    }
    
    // Merge Geometries for massive performance boost
    const geometriesByMaterial = new Map();
    tempGroup.updateMatrixWorld(true);
    
    tempGroup.traverse((child) => {
        if (child.isMesh) {
            let geo = child.geometry.clone();
            if (geo.index) geo = geo.toNonIndexed();
            geo.applyMatrix4(child.matrixWorld);
            
            // Create a unique key for the material + attribute signature
            let sig = child.material.uuid + (geo.attributes.uv ? "_uv" : "_nouv") + (geo.attributes.normal ? "_norm" : "_nonorm");
            
            if (!geometriesByMaterial.has(sig)) {
                geometriesByMaterial.set(sig, {mat: child.material, geos: []});
            }
            geometriesByMaterial.get(sig).geos.push(geo);
        }
    });
    
    const chunkProps = new THREE.Group();
    for (const [sig, data] of geometriesByMaterial.entries()) {
        const mat = data.mat;
        const geos = data.geos;
        if (geos.length > 0) {
            const mergedGeo = THREE.BufferGeometryUtils.mergeBufferGeometries(geos, false);
            const mesh = new THREE.Mesh(mergedGeo, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            chunkProps.add(mesh);
        }
    }
    
    scene.add(chunkProps);
    return [chunkProps];
}

function createCactus(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    
    // Small barrel / prickly pear cactus
    const numPads = 2 + Math.floor(Math.random() * 3);
    for(let i=0; i<numPads; i++) {
        const geo = new THREE.IcosahedronGeometry(0.4, 0);
        geo.scale(1, 1.5, 0.3); // flatten
        const pad = new THREE.Mesh(geo, window.PropMaterials.cactus);
        pad.position.set((Math.random()-0.5)*0.5, i * 0.6 + 0.3, (Math.random()-0.5)*0.5);
        pad.rotation.set((Math.random()-0.5)*0.3, Math.random()*Math.PI, (Math.random()-0.5)*0.3);
        group.add(pad);
    }
    return group;
}

function createSaguaro(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    
    const height = 3.0 + Math.random() * 2;
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, height, 8);
    trunkGeo.translate(0, (height * 0.85) / 2, 0);
    const trunk = new THREE.Mesh(trunkGeo, window.PropMaterials.cactus);
    group.add(trunk);
    
    const numArms = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numArms; i++) {
        const armH = 1.0 + Math.random() * 1.5;
        const armW = 0.6 + Math.random() * 0.4;
        
        // Horizontal piece
        const horizGeo = new THREE.CylinderGeometry(0.2, 0.2, armW, 6);
        horizGeo.rotateZ(Math.PI / 2);
        horizGeo.translate(armW / 2, 0, 0);
        const horiz = new THREE.Mesh(horizGeo, window.PropMaterials.cactus);
        
        horiz.position.y = height * (0.4 + i * 0.2); // space out arms vertically
        // rotate arm around trunk
        const angle = (i * Math.PI) + (Math.random() - 0.5) * 1.0; 
        horiz.rotation.y = angle;
        
        // Vertical piece on end of horizontal
        const vertGeo = new THREE.CylinderGeometry(0.2, 0.2, armH, 6);
        vertGeo.translate(0, armH / 2, 0);
        const vert = new THREE.Mesh(vertGeo, window.PropMaterials.cactus);
        vert.position.set(armW, 0, 0);
        horiz.add(vert);
        
        group.add(horiz);
    }
    
    window.treeColliders = window.treeColliders || [];
    window.treeColliders.push({x: x, z: z, radius: 1.25});
    
    group.scale.setScalar(2.5);
    return group;
}


function createLog(x, y, z) {
    const geo = new THREE.CylinderGeometry(0.3, 0.4, 3, 5);
    geo.rotateZ(Math.PI / 2);
    geo.rotateY(Math.random() * Math.PI);
    geo.translate(x, y + 0.3, z);
    return geo;
}

function createShrub(x, y, z, isCherry) {
    const geo = new THREE.IcosahedronGeometry(1.0 + Math.random(), 1);
    geo.translate(x, y + 0.5, z);
    return { geo, isCherry };
}

function createDeadStick(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    
    const height = 0.5 + Math.random() * 1.5;
    const geo = new THREE.BoxGeometry(0.1, height, 0.1);
    geo.translate(0, height/2, 0);
    
    const stick = new THREE.Mesh(geo, window.PropMaterials.deadStick);
    stick.rotation.set((Math.random()-0.5)*0.5, Math.random()*Math.PI, (Math.random()-0.5)*0.5);
    group.add(stick);
    
    return group;
}

function createPalmTree(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    
    const height = 4 + Math.random() * 3;
    const segments = 4;
    const segH = height / segments;
    
    // Curved trunk
    const curveDir = Math.random() * Math.PI * 2;
    const curveAmount = 0.2 + Math.random() * 0.3;
    
    let currentObject = group;
    
    for (let i = 0; i < segments; i++) {
        const pivot = new THREE.Group();
        pivot.position.y = (i === 0) ? 0 : segH;
        currentObject.add(pivot);
        
        const tilt = curveAmount * (i / segments);
        pivot.rotation.z = Math.cos(curveDir) * tilt;
        pivot.rotation.x = Math.sin(curveDir) * tilt;
        
        const trunkGeo = new THREE.CylinderGeometry(0.3 - (i*0.05), 0.4 - (i*0.05), segH, 5);
        trunkGeo.translate(0, segH / 2, 0);
        const trunk = new THREE.Mesh(trunkGeo, window.PropMaterials.trunk);
        pivot.add(trunk);
        
        currentObject = pivot;
    }
    
    // Leaves at the top pivot
    const topPivot = new THREE.Group();
    topPivot.position.y = segH;
    currentObject.add(topPivot);
    const numLeaves = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numLeaves; i++) {
        const leafGeo = new THREE.PlaneGeometry(3.0, 1.2, 4, 1);
        leafGeo.rotateX(-Math.PI / 2);
        leafGeo.translate(1.5, 0, 0); // hinge
        
        const positions = leafGeo.attributes.position.array;
        for (let j = 0; j < positions.length; j += 3) {
            const lx = positions[j];
            const lz = positions[j+2];
            // Taper width based on length
            const taper = 1.0 - Math.abs((lx - 1.5) / 1.5); 
            positions[j+2] = lz * taper; 
            // Curve down
            positions[j+1] -= (lx * lx) * 0.15;
        }
        leafGeo.computeVertexNormals();
        
        const leaf = new THREE.Mesh(leafGeo, window.PropMaterials.palmLeaf);
        // Ensure double sided material for planes
        window.PropMaterials.palmLeaf.side = THREE.DoubleSide;
        
        leaf.rotation.y = (Math.PI * 2 / numLeaves) * i + Math.random() * 0.2;
        leaf.rotation.z = 0.4 + Math.random() * 0.2; // angle upward slightly at base
        
        topPivot.add(leaf);
    }
    
    window.treeColliders = window.treeColliders || [];
    window.treeColliders.push({x: x, z: z, radius: 1.0});
    
    group.scale.setScalar(2.0);
    return group;
}

function createDeadBush(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    
    if (!window.PropMaterials.deadBush) {
        window.PropMaterials.deadBush = new THREE.MeshStandardMaterial({ color: 0x8a6b4e, flatShading: true });
    }
    
    const numSticks = 3 + Math.floor(Math.random() * 3);
    for(let i = 0; i < numSticks; i++) {
        const height = 0.5 + Math.random() * 0.5;
        const geo = new THREE.CylinderGeometry(0.02, 0.05, height, 4);
        geo.translate(0, height / 2, 0);
        const stick = new THREE.Mesh(geo, window.PropMaterials.deadBush);
        stick.rotation.set((Math.random()-0.5)*1.5, Math.random()*Math.PI, (Math.random()-0.5)*1.5);
        group.add(stick);
    }
    return group;
}

function createArch(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    
    if (!window.PropMaterials.badlandsRock) {
        window.PropMaterials.badlandsRock = new THREE.MeshStandardMaterial({ color: 0xb56345, flatShading: true });
    }
    
    // Left pillar
    const p1Geo = new THREE.CylinderGeometry(2.5, 3.5, 14, 6);
    p1Geo.translate(-5, 7, 0);
    const p1 = new THREE.Mesh(p1Geo, window.PropMaterials.badlandsRock);
    p1.rotation.z = -0.15; // Lean in slightly
    p1.rotation.y = Math.random() * Math.PI;
    
    // Right pillar
    const p2Geo = new THREE.CylinderGeometry(2.5, 3.5, 14, 6);
    p2Geo.translate(5, 7, 0);
    const p2 = new THREE.Mesh(p2Geo, window.PropMaterials.badlandsRock);
    p2.rotation.z = 0.15; // Lean in slightly
    p2.rotation.y = Math.random() * Math.PI;
    
    // Roof
    const roofGeo = new THREE.CylinderGeometry(3, 3.5, 14, 6);
    roofGeo.rotateZ(Math.PI / 2); // Lay it flat across
    roofGeo.translate(0, 14, 0);
    const roof = new THREE.Mesh(roofGeo, window.PropMaterials.badlandsRock);
    roof.rotation.y = Math.random() * Math.PI;
    
    group.add(p1, p2, roof);
    group.rotation.y = Math.random() * Math.PI;
    
    // Colliders for the pillars
    window.treeColliders = window.treeColliders || [];
    const p1Pos = new THREE.Vector3(-6, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), group.rotation.y);
    const p2Pos = new THREE.Vector3(6, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), group.rotation.y);
    window.treeColliders.push({x: x + p1Pos.x, z: z + p1Pos.z, radius: 2.5});
    window.treeColliders.push({x: x + p2Pos.x, z: z + p2Pos.z, radius: 2.5});
    
    return group;
}

function createHoodoo(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    
    if (!window.PropMaterials.hoodooRock) {
        window.PropMaterials.hoodooRock = new THREE.MeshStandardMaterial({ color: 0xdeb887, flatShading: true }); // Tan/sandstone
    }
    
    const height = 15 + Math.random() * 20;
    
    // The pillar
    const numSegments = 4 + Math.floor(Math.random() * 3);
    let currentY = 0;
    for(let i=0; i<numSegments; i++) {
        const segHeight = height / numSegments;
        // Pillars are thin and jagged
        const radius = 1.0 + Math.random() * 1.5 - (i * 0.15); 
        const geo = new THREE.CylinderGeometry(radius * 0.8, radius, segHeight, 5 + Math.floor(Math.random()*3));
        geo.translate(0, segHeight/2, 0);
        const mesh = new THREE.Mesh(geo, window.PropMaterials.hoodooRock);
        mesh.position.y = currentY;
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.rotation.z = (Math.random() - 0.5) * 0.1;
        mesh.rotation.x = (Math.random() - 0.5) * 0.1;
        group.add(mesh);
        currentY += segHeight * 0.95;
    }
    
    // The Cap (wide, flat mushroom top)
    const capGeo = new THREE.CylinderGeometry(4 + Math.random()*3, 3 + Math.random()*2, 1.5 + Math.random(), 6);
    capGeo.translate(0, 1, 0);
    const cap = new THREE.Mesh(capGeo, window.PropMaterials.hoodooRock);
    cap.position.y = currentY - 0.5;
    cap.rotation.z = (Math.random() - 0.5) * 0.2;
    cap.rotation.x = (Math.random() - 0.5) * 0.2;
    group.add(cap);
    
    window.treeColliders = window.treeColliders || [];
    window.treeColliders.push({x: x, z: z, radius: 2.0});
    
    return group;
}

