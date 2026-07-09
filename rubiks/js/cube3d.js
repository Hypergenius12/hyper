/**
 * 3D Renderer for 2x2 Rubik's Cube
 */
let COLORS = {
    U: 0xffffff, // White
    D: 0xffd500, // Yellow
    F: 0x009e60, // Green
    B: 0x0051ba, // Blue
    R: 0xc41e3a, // Red
    L: 0xff5800, // Orange
    X: 0x222222  // Interior (Black/Dark Grey)
};

class Cube3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(4, 4, 6);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xffffff, 1); // White bg for minimal css
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
        this.controls.rotateSpeed = 3.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        this.controls.noPan = true; // Prevents panning the cube off center

        // Lighting
        let ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);

        this.pieces = []; // length 8, stores the 3D meshes in logical index order
        this.isAnimating = false;
        this.animationQueue = [];
        this.animSpeed = 8;
        this.gridSize = 2; // Default to 2x2
        this.initCube();

        // Raycasting for interactive turning
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.dragInfo = null;

        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this), { capture: true });
        window.addEventListener('pointermove', this.onPointerMove.bind(this), { capture: true });
        window.addEventListener('pointerup', this.onPointerUp.bind(this), { capture: true });
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setSize(sizeStr) {
        this.gridSize = parseInt(sizeStr.charAt(0));
        this.initCube();
    }

    getMaterials(x, y, z, maxCoord) {
        let cols = Array(6).fill(COLORS.X);
        let eps = 0.1;
        
        // Right, Left, Top, Bottom, Front, Back
        if (x > maxCoord - eps) cols[0] = COLORS.R;
        if (x < -maxCoord + eps) cols[1] = COLORS.L;
        if (y > maxCoord - eps) cols[2] = COLORS.U;
        if (y < -maxCoord + eps) cols[3] = COLORS.D;
        if (z > maxCoord - eps) cols[4] = COLORS.F;
        if (z < -maxCoord + eps) cols[5] = COLORS.B;

        return cols.map(c => new THREE.MeshBasicMaterial({ 
            color: c, 
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        }));
    }

    setSpeed(speedVal) {
        if (speedVal === 'slow') this.animSpeed = 16;
        else if (speedVal === 'fast') this.animSpeed = 4;
        else if (speedVal === 'instant') this.animSpeed = 1;
        else this.animSpeed = 8;
    }

    setColors(scheme) {
        if (scheme === 'pastel') {
            COLORS = { U: 0xffffff, D: 0xfdfd96, F: 0x77dd77, B: 0x84b6f4, R: 0xff6961, L: 0xffb347, X: 0x222222 };
        } else if (scheme === 'neon') {
            COLORS = { U: 0xffffff, D: 0xccff00, F: 0x39ff14, B: 0x04d9ff, R: 0xff003f, L: 0xff7300, X: 0x111111 };
        } else {
            COLORS = { U: 0xffffff, D: 0xffd500, F: 0x009e60, B: 0x0051ba, R: 0xc41e3a, L: 0xff5800, X: 0x222222 };
        }
        
        if (this.pieces && this.pieces.length > 0) {
            for (let i = 0; i < this.pieces.length; i++) {
                let mesh = this.pieces[i];
                let p = mesh.userData.startPos;
                let maxC = this.gridSize === 1 ? 0 : (this.gridSize === 2 ? 0.51 : 1.02);
                mesh.material = this.getMaterials(p[0], p[1], p[2], maxC);
            }
        } else {
            this.initCube();
        }
    }

    setAutoRotate(enabled) {
        this.controls.autoRotate = enabled;
        this.controls.autoRotateSpeed = 2.0;
    }

    setCamera(type) {
        let aspect = window.innerWidth / window.innerHeight;
        let d = 4;
        
        if (type === 'orthographic' || type === 'isometric') {
            if (!(this.camera instanceof THREE.OrthographicCamera)) {
                let currentPos = this.camera.position.clone();
                this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 100);
                this.camera.position.copy(currentPos);
                this.controls.object = this.camera;
            }
        } else {
            if (!(this.camera instanceof THREE.PerspectiveCamera)) {
                let currentPos = this.camera.position.clone();
                this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
                this.camera.position.copy(currentPos);
                this.controls.object = this.camera;
            }
        }
        
        if (type === 'isometric') {
            this.camera.position.set(5, 5, 5);
        }
        
        this.camera.lookAt(0,0,0);
        this.controls.target.set(0,0,0);
        this.camera.updateProjectionMatrix();
        this.controls.update();
    }

    setStyle(type) {
        this.stickerStyle = type;
        this.initCube();
    }

    initCube() {
        if (this.pieces.length > 0) {
            this.pieces.forEach(p => {
                if (p.parent) p.parent.remove(p);
            });
            this.pieces = [];
        }
        
        this.animationQueue.forEach(anim => {
            if (anim.group && anim.group.parent) anim.group.parent.remove(anim.group);
        });
        this.animationQueue = [];
        this.isAnimating = false;

        const offset = 0.51;
        let positions = [];
        let maxC = 0;
        
        if (this.gridSize === 1) {
            positions = [ [0,0,0] ];
            maxC = 0;
        } else if (this.gridSize === 2) {
            positions = [
                [offset, offset, offset],   // 0: URF
                [-offset, offset, offset],  // 1: UFL
                [-offset, offset, -offset], // 2: ULB
                [offset, offset, -offset],  // 3: UBR
                [offset, -offset, offset],  // 4: DFR
                [-offset, -offset, offset], // 5: DFL
                [-offset, -offset, -offset],// 6: DBL
                [offset, -offset, -offset]  // 7: DBR
            ];
            maxC = offset;
        } else if (this.gridSize === 3) {
            let step = 1.02;
            for (let y = 1; y >= -1; y--) {
                for (let z = 1; z >= -1; z--) {
                    for (let x = 1; x >= -1; x--) {
                        positions.push([x * step, y * step, z * step]);
                    }
                }
            }
            maxC = step;
        }

        let geoType = this.stickerStyle || 'block';
        let geometry;
        if (this.gridSize === 1) {
            geometry = geoType === 'floating' ? new THREE.BoxGeometry(0.75, 0.75, 0.75) : new THREE.BoxGeometry(0.98, 0.98, 0.98);
        } else {
            geometry = geoType === 'floating' ? new THREE.BoxGeometry(0.75, 0.75, 0.75) : new THREE.BoxGeometry(0.98, 0.98, 0.98);
        }

        for (let i = 0; i < positions.length; i++) {
            let p = positions[i];
            let materials = this.getMaterials(p[0], p[1], p[2], maxC);
            if (geoType === 'wireframe') {
                materials.forEach(m => {
                    m.transparent = true;
                    m.opacity = 0.15;
                });
            }
            let mesh = new THREE.Mesh(geometry, materials);
            
            let geo = new THREE.EdgesGeometry(mesh.geometry);
            let edgeColor = geoType === 'wireframe' ? 0xaaaaaa : 0x000000;
            let mat = new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 2 });
            let wireframe = new THREE.LineSegments(geo, mat);
            mesh.add(wireframe);

            mesh.position.set(...p);
            mesh.userData = { logicalIndex: i, startPos: p };
            this.scene.add(mesh);
            this.pieces.push(mesh);
        }
    }

    onPointerDown(event) {
        if (this.isAnimating) return;
        
        // Convert mouse position to normalized device coordinates
        let rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        let intersects = this.raycaster.intersectObjects(this.pieces);
        
        if (intersects.length > 0) {
            event.stopImmediatePropagation();
            let hit = intersects[0];
            
            // Ignore drag on interior (black) faces
            if (hit.object.material[hit.face.materialIndex].color.getHex() === COLORS.X) {
                return;
            }
            
            // Get normal in world space
            let normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
            let worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize().round();

            this.dragInfo = {
                mesh: hit.object,
                normal: worldNormal,
                startX: event.clientX,
                startY: event.clientY,
                moveDetermined: false
            };
        }
    }

    onPointerMove(event) {
        if (!this.dragInfo || this.dragInfo.moveDetermined || this.isAnimating) {
            this.dragInfo = null;
            return;
        }
        event.stopImmediatePropagation();
        
        let dx = event.clientX - this.dragInfo.startX;
        let dy = event.clientY - this.dragInfo.startY;

        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            this.dragInfo.moveDetermined = true;
            
            let N = this.dragInfo.normal;
            let P = this.dragInfo.mesh.position;
            
            // Find tangent axes
            let T1, T2;
            if (Math.abs(N.y) === 1) { T1 = new THREE.Vector3(1,0,0); T2 = new THREE.Vector3(0,0,1); }
            else if (Math.abs(N.x) === 1) { T1 = new THREE.Vector3(0,1,0); T2 = new THREE.Vector3(0,0,1); }
            else { T1 = new THREE.Vector3(1,0,0); T2 = new THREE.Vector3(0,1,0); }

            // Project tangents to screen
            let w = window.innerWidth / 2;
            let h = window.innerHeight / 2;
            
            let p0 = P.clone().project(this.camera);
            let p0_px = new THREE.Vector2(p0.x * w, p0.y * h);
            
            let p1 = P.clone().add(T1).project(this.camera);
            let p1_px = new THREE.Vector2(p1.x * w, p1.y * h);
            let vT1 = new THREE.Vector2().subVectors(p1_px, p0_px).normalize();
            
            let p2 = P.clone().add(T2).project(this.camera);
            let p2_px = new THREE.Vector2(p2.x * w, p2.y * h);
            let vT2 = new THREE.Vector2().subVectors(p2_px, p0_px).normalize();
            
            // Note: screen Y goes down, but NDC Y goes up. So we negate dy to match NDC space.
            let drag2D = new THREE.Vector2(dx, -dy).normalize();
            
            let dot1 = drag2D.dot(vT1);
            let dot2 = drag2D.dot(vT2);
            
            let D;
            if (Math.abs(dot1) > Math.abs(dot2)) {
                D = T1.clone().multiplyScalar(Math.sign(dot1));
            } else {
                D = T2.clone().multiplyScalar(Math.sign(dot2));
            }
            
            // Rotation axis = Normal x Drag Direction
            let A = new THREE.Vector3().crossVectors(N, D).round();
            
            if (this.gridSize === 1) {
                let moveStr = '';
                if (Math.abs(A.x) === 1) moveStr = A.x > 0 ? "x'" : "x";
                else if (Math.abs(A.y) === 1) moveStr = A.y > 0 ? "y'" : "y";
                else if (Math.abs(A.z) === 1) moveStr = A.z > 0 ? "z'" : "z";
                
                if (moveStr) {
                    window.dispatchEvent(new CustomEvent('manualMove', { detail: moveStr }));
                }
            } else {
                let layer = null;
                let standardMoveVec = null;
                let thresh = this.gridSize === 3 ? 0.5 : 0;
                
                if (Math.abs(A.x) === 1) {
                    if (P.x > thresh) layer = 'R';
                    else if (P.x < -thresh) layer = 'L';
                    standardMoveVec = layer === 'R' ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(1, 0, 0);
                } else if (Math.abs(A.y) === 1) {
                    if (P.y > thresh) layer = 'U';
                    else if (P.y < -thresh) layer = 'D';
                    standardMoveVec = layer === 'U' ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 1, 0);
                } else if (Math.abs(A.z) === 1) {
                    if (P.z > thresh) layer = 'F';
                    else if (P.z < -thresh) layer = 'B';
                    standardMoveVec = layer === 'F' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);
                }
                
                if (layer) {
                    let moveStr = layer;
                    // If the desired axis matches the standard vector, it's a normal move. Else, it's Prime.
                    if (A.dot(standardMoveVec) < 0) {
                        moveStr += "'";
                    }
                    window.dispatchEvent(new CustomEvent('manualMove', { detail: moveStr }));
                }
            }
            
            this.dragInfo = null;
        }
    }

    onPointerUp(event) {
        if (this.dragInfo) {
            event.stopImmediatePropagation();
            this.dragInfo = null;
        }
    }

    applyMoveAnim(moveStr, callback) {
        let axis, dir, piecesToMove;
        let isPrime = false;
        let isDouble = false;
        let baseMove = moveStr[0];
        let angle = Math.PI / 2;
        if (moveStr.endsWith("'")) {
            isPrime = true;
            angle = -Math.PI / 2;
        } else if (moveStr.endsWith("2")) {
            isDouble = true;
            angle = Math.PI;
        }
        
        if (this.gridSize === 1) {
            let axisMapping = {
                'x': { axis: new THREE.Vector3(1, 0, 0), dir: -1 },
                'y': { axis: new THREE.Vector3(0, 1, 0), dir: -1 },
                'z': { axis: new THREE.Vector3(0, 0, 1), dir: -1 },
                'R': { axis: new THREE.Vector3(1, 0, 0), dir: -1 },
                'L': { axis: new THREE.Vector3(1, 0, 0), dir: 1 },
                'U': { axis: new THREE.Vector3(0, 1, 0), dir: -1 },
                'D': { axis: new THREE.Vector3(0, 1, 0), dir: 1 },
                'F': { axis: new THREE.Vector3(0, 0, 1), dir: -1 },
                'B': { axis: new THREE.Vector3(0, 0, 1), dir: 1 }
            };
            let map = axisMapping[baseMove];
            if (!map) return;
            axis = map.axis;
            dir = map.dir;
            piecesToMove = [0];
        } else if (this.gridSize === 2) {
            if (baseMove === 'U') {
                axis = new THREE.Vector3(0, 1, 0); dir = -1; piecesToMove = [0, 1, 2, 3];
            } else if (baseMove === 'D') {
                axis = new THREE.Vector3(0, 1, 0); dir = 1; piecesToMove = [4, 5, 6, 7];
            } else if (baseMove === 'R') {
                axis = new THREE.Vector3(1, 0, 0); dir = -1; piecesToMove = [0, 3, 7, 4];
            } else if (baseMove === 'L') {
                axis = new THREE.Vector3(1, 0, 0); dir = 1; piecesToMove = [1, 2, 6, 5];
            } else if (baseMove === 'F') {
                axis = new THREE.Vector3(0, 0, 1); dir = -1; piecesToMove = [0, 1, 5, 4];
            } else if (baseMove === 'B') {
                axis = new THREE.Vector3(0, 0, 1); dir = 1; piecesToMove = [3, 7, 6, 2];
            } else return;
        } else if (this.gridSize === 3) {
            let eps = 0.5;
            let activeIndices = [];
            
            if (baseMove === 'U') {
                axis = new THREE.Vector3(0, 1, 0); dir = -1;
                activeIndices = this.pieces.map((p, i) => p.position.y > eps ? i : -1).filter(i => i !== -1);
            } else if (baseMove === 'D') {
                axis = new THREE.Vector3(0, 1, 0); dir = 1;
                activeIndices = this.pieces.map((p, i) => p.position.y < -eps ? i : -1).filter(i => i !== -1);
            } else if (baseMove === 'R') {
                axis = new THREE.Vector3(1, 0, 0); dir = -1;
                activeIndices = this.pieces.map((p, i) => p.position.x > eps ? i : -1).filter(i => i !== -1);
            } else if (baseMove === 'L') {
                axis = new THREE.Vector3(1, 0, 0); dir = 1;
                activeIndices = this.pieces.map((p, i) => p.position.x < -eps ? i : -1).filter(i => i !== -1);
            } else if (baseMove === 'F') {
                axis = new THREE.Vector3(0, 0, 1); dir = -1;
                activeIndices = this.pieces.map((p, i) => p.position.z > eps ? i : -1).filter(i => i !== -1);
            } else if (baseMove === 'B') {
                axis = new THREE.Vector3(0, 0, 1); dir = 1;
                activeIndices = this.pieces.map((p, i) => p.position.z < -eps ? i : -1).filter(i => i !== -1);
            } else return;
            
            piecesToMove = activeIndices;
        }

        let targetAngle = angle * dir;
        
        let group = new THREE.Group();
        this.scene.add(group);
        let activeMeshes = piecesToMove.map(idx => this.pieces[idx]);
        
        activeMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            group.add(mesh);
        });

        this.animationQueue.push({
            group,
            activeMeshes,
            axis,
            targetAngle,
            currentAngle: 0,
            piecesToMove,
            isPrime,
            isDouble,
            callback
        });
        
        this.isAnimating = true;
    }

    updateAnimation() {
        if (this.animationQueue.length === 0) {
            this.isAnimating = false;
            return;
        }

        this.isAnimating = true;
        let anim = this.animationQueue[0];
        
        // Speed
        let step = (Math.PI / 2) / this.animSpeed; 
        if (anim.targetAngle < 0) step = -step;

        anim.currentAngle += step;
        
        if (Math.abs(anim.currentAngle) >= Math.abs(anim.targetAngle)) {
            let diff = anim.targetAngle - (anim.currentAngle - step);
            anim.group.rotateOnAxis(anim.axis, diff);
            
            anim.activeMeshes.forEach(mesh => {
                mesh.updateMatrixWorld();
                this.scene.attach(mesh);
            });
            this.scene.remove(anim.group);

            if (this.gridSize === 2) {
                // Correct cyclic array mapping!
                let newPieces = [...this.pieces];
                let p = anim.piecesToMove;
                let perm;
                
                if (anim.isPrime) {
                    // CCW: Shift right (piece at end goes to start)
                    perm = [p[3], p[0], p[1], p[2]];
                } else if (anim.isDouble) {
                    // 180: Swap pairs
                    perm = [p[2], p[3], p[0], p[1]];
                } else {
                    // CW: Shift left (piece at start goes to end)
                    perm = [p[1], p[2], p[3], p[0]];
                }

                for (let i = 0; i < 4; i++) {
                    newPieces[p[i]] = this.pieces[perm[i]];
                }
                this.pieces = newPieces;
            }

            this.animationQueue.shift();
            if (anim.callback) anim.callback();
        } else {
            anim.group.rotateOnAxis(anim.axis, step);
        }
    }

    onWindowResize() {
        let aspect = window.innerWidth / window.innerHeight;
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.aspect = aspect;
        } else {
            let d = 4;
            this.camera.left = -d * aspect;
            this.camera.right = d * aspect;
            this.camera.top = d;
            this.camera.bottom = -d;
        }
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.controls.handleResize();
    }

    animate() {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.updateAnimation();
        this.renderer.render(this.scene, this.camera);
    }
}
