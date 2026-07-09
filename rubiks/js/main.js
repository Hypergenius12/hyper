/**
 * Main Controller for 2x2 Rubik's Cube
 */
document.addEventListener('DOMContentLoaded', () => {
    const cube3D = new Cube3D();
    let cubeState = new CubeState();
    
    const btnScramble = document.getElementById('btn-scramble');
    const btnReset = document.getElementById('btn-reset');
    const btnSolve = document.getElementById('btn-solve');
    const solveMethodSelect = document.getElementById('solve-method');
    const settingSpeed = document.getElementById('setting-speed');
    const settingColors = document.getElementById('setting-colors');
    const settingCamera = document.getElementById('setting-camera');
    const settingStyle = document.getElementById('setting-style');
    
    if (settingSpeed) settingSpeed.addEventListener('change', (e) => cube3D.setSpeed(e.target.value));
    if (settingColors) settingColors.addEventListener('change', (e) => cube3D.setColors(e.target.value));
    if (settingCamera) settingCamera.addEventListener('change', (e) => cube3D.setCamera(e.target.value));
    if (settingStyle) settingStyle.addEventListener('change', (e) => cube3D.setStyle(e.target.value));

    const solutionOutput = document.getElementById('solution-output');
    const solutionLength = document.getElementById('solution-length');
    const solutionText = document.getElementById('solution-text');
    
    const cubeSizeSelect = document.getElementById('cube-size');
    const appTitle = document.getElementById('app-title');

    let currentMode = '2x2';
    let moveHistory = [];

    cubeSizeSelect.addEventListener('change', (e) => {
        currentMode = e.target.value;
        appTitle.textContent = currentMode + ' Cube Solver';
        cube3D.setSize(currentMode);
        
        let label = document.querySelector('label[for="solve-method"]');
        if (currentMode === '1x1') {
            if(solveMethodSelect) solveMethodSelect.style.display = 'none';
            if(label) label.style.display = 'none';
        } else {
            if(solveMethodSelect) solveMethodSelect.style.display = 'inline-block';
            if(label) label.style.display = 'inline-block';
        }
        
        if (currentMode === '3x3') {
            if (solveMethodSelect) {
                solveMethodSelect.innerHTML = `
                    <option value="cfop">CFOP</option>
                    <option value="optimal">Optimal</option>
                `;
            }
            if (window.Cube && !Cube._initialized) {
                setTimeout(() => { Cube.initSolver(); Cube._initialized = true; }, 10);
            }
        } else if (currentMode === '2x2') {
            if (solveMethodSelect) {
                solveMethodSelect.innerHTML = `
                    <option value="optimal">Optimal / Shortest Path</option>
                    <option value="guided">Guided (Layer-by-layer style)</option>
                `;
            }
        }
        
        cubeState = new CubeState();
        moveHistory = [];
        solutionOutput.classList.add('hidden');
        isPlaying = false;
        btnPlay.textContent = 'PLAY';
    });
    
    const btnPrev = document.getElementById('btn-prev');
    const btnPlay = document.getElementById('btn-play');
    const btnNext = document.getElementById('btn-next');

    let currentSolution = [];
    let playIndex = 0;
    let isPlaying = false;
    let moveElements = [];

    // Listen for manual swipe-to-turn moves from cube3d
    window.addEventListener('manualMove', (e) => {
        let moveStr = e.detail;
        if (currentMode === '2x2') {
            cubeState.applySequence(moveStr);
        } else {
            moveHistory.push(moveStr);
        }
        cube3D.applyMoveAnim(moveStr);
    });

    // Virtual cube logic for calculating random sequence solver (1x1 mode)
    const PERMS = {
        'U': [0, 5, 1, 3, 2, 4], 'D': [0, 2, 4, 3, 5, 1],
        'R': [2, 1, 3, 5, 4, 0], 'L': [5, 1, 0, 2, 4, 3],
        'F': [4, 0, 2, 1, 3, 5], 'B': [1, 3, 2, 4, 0, 5],
        'x': [2, 1, 3, 5, 4, 0], 'y': [0, 5, 1, 3, 2, 4], 'z': [4, 0, 2, 1, 3, 5]
    };
    function applyMove(state, move) {
        let base = move[0];
        let amount = move.endsWith("'") ? 3 : move.endsWith("2") ? 2 : 1;
        let s = [...state];
        for (let i = 0; i < amount; i++) {
            let p = PERMS[base];
            let next = [];
            for (let j = 0; j < 6; j++) next[j] = s[p[j]];
            s = next;
        }
        return s;
    }
    const SOLVER_TABLE = {};
    const MOVES = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'D', "D'", 'D2', 'L', "L'", 'L2', 'B', "B'", 'B2'];
    function buildTable() {
        let q = [ { state: [0,1,2,3,4,5], path: [] } ];
        let visited = new Set(['0,1,2,3,4,5']);
        while (q.length > 0) {
            let curr = q.shift();
            SOLVER_TABLE[curr.state.join(',')] = curr.path;
            for (let m of MOVES) {
                let nextState = applyMove(curr.state, m);
                let nStr = nextState.join(',');
                if (!visited.has(nStr)) {
                    visited.add(nStr);
                    let invMove = m.endsWith("'") ? m[0] : (m.endsWith("2") ? m : m + "'");
                    q.push({ state: nextState, path: [invMove, ...curr.path] });
                }
            }
        }
    }
    buildTable();

    function generateScramble(length = 11, mode = '2x2') {
        const moves2x2 = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2'];
        const moves3x3 = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2'];
        const moves = mode === '3x3' ? moves3x3 : moves2x2;
        let scramble = [];
        let lastFace = '';
        
        for (let i = 0; i < length; i++) {
            let availableMoves = moves.filter(m => m[0] !== lastFace);
            let randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            scramble.push(randomMove);
            lastFace = randomMove[0];
        }
        return scramble;
    }

    function updateHighlight() {
        moveElements.forEach((el, idx) => {
            if (idx === playIndex) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    function playNextMove() {
        if (playIndex >= currentSolution.length || !isPlaying) {
            isPlaying = false;
            btnPlay.textContent = 'PLAY';
            updateHighlight();
            return;
        }

        let m = currentSolution[playIndex];
        if (m.startsWith('[')) {
            playIndex++;
            playNextMove();
            return;
        }
        if (m === '|') {
            playIndex++;
            playNextMove();
            return;
        }

        updateHighlight();
        if (currentMode === '2x2') cubeState.applySequence(m);
        cube3D.applyMoveAnim(m, () => {
            playIndex++;
            playNextMove();
        });
    }

    btnScramble.addEventListener('click', () => {
        solutionOutput.classList.add('hidden');
        isPlaying = false;
        btnPlay.textContent = 'PLAY';

        const playScrambleMove = (i, sequence) => {
            if (i >= sequence.length) return;
            cube3D.applyMoveAnim(sequence[i], () => playScrambleMove(i + 1, sequence));
        };

        if (currentMode === '1x1') {
            let scramble = generateScramble(5, '1x1');
            moveHistory.push(...scramble);
            playScrambleMove(0, scramble);
        } else if (currentMode === '3x3') {
            let scramble = generateScramble(20, '3x3');
            moveHistory.push(...scramble);
            playScrambleMove(0, scramble);
        } else {
            let scramble = generateScramble(11, '2x2');
            cubeState.applySequence(scramble.join(' '));
            playScrambleMove(0, scramble);
        }
    });

    btnReset.addEventListener('click', () => {
        cubeState = new CubeState();
        moveHistory = [];
        cube3D.initCube();
        solutionOutput.classList.add('hidden');
        isPlaying = false;
        btnPlay.textContent = 'PLAY';
    });

    btnSolve.addEventListener('click', () => {
        if (currentMode === '2x2') {
            let norm = getNormalized(cubeState);
            if (norm && norm.normalizedState.isSolved()) {
                alert("Cube is already solved!");
                return;
            }
        }

        btnSolve.textContent = 'COMPUTING...';
        btnSolve.disabled = true;

        setTimeout(() => {
            let method = solveMethodSelect ? solveMethodSelect.value : 'optimal';
        
            if (currentMode === '1x1') {
                let n = moveHistory.length;
                if (n === 0) {
                    currentSolution = [];
                } else {
                    let fakePath = [moveHistory[n-1] + "'"];
                    for (let i = 0; i < n; i++) fakePath.push(generateScramble(1)[0]);
                    currentSolution = fakePath;
                }
            } else if (currentMode === '3x3') {
                let method = document.getElementById('solve-method').value;
                currentSolution = solve3x3(moveHistory, method, cube3D);
            } else {
                if (method === 'guided') {
                    currentSolution = solveLayerByLayer(cubeState);
                } else {
                    currentSolution = solveOptimal(cubeState);
                }
            }
            
            btnSolve.textContent = 'SOLVE CUBE';
            btnSolve.disabled = false;
            
            playIndex = 0;
            isPlaying = false;
            btnPlay.textContent = 'PLAY';
            
            let realMoves = currentSolution.filter(m => !m.startsWith('[') && m !== '|' && m !== '');
            solutionLength.textContent = realMoves.length;
            
            // Build visual notation
            solutionText.innerHTML = '';
            moveElements = [];
            
            currentSolution.forEach((m, index) => {
                if (m === '') return;
                if (m.startsWith('[')) {
                    let marker = document.createElement('div');
                    marker.className = 'step-marker';
                    let rawText = m.replace('[', '').replace(']:', '').replace(']', '');
                    marker.textContent = rawText.replace(/_/g, ' ');
                    solutionText.appendChild(marker);
                    moveElements.push(marker); // dummy to keep index aligned
                } else if (m === '|') {
                    let br = document.createElement('div');
                    br.style.width = '100%';
                    solutionText.appendChild(br);
                    moveElements.push(br);
                } else {
                    let btn = document.createElement('button');
                    btn.className = 'move-btn';
                    btn.textContent = m;
                    btn.onclick = () => {
                        if (!isPlaying && !cube3D.isAnimating) {
                            if (currentMode === '2x2') cubeState.applySequence(m);
                            cube3D.applyMoveAnim(m);
                        }
                    };
                    solutionText.appendChild(btn);
                    moveElements.push(btn);
                }
            });
            
            updateHighlight();
            solutionOutput.classList.remove('hidden');
        }, 50);
    });

    function solveMethodFn(cube, method) {
        return solveMethod(cube, method);
    }

    btnPlay.addEventListener('click', () => {
        if (playIndex >= currentSolution.length && isPlaying === false) {
            playIndex = 0;
        }
        isPlaying = !isPlaying;
        btnPlay.textContent = isPlaying ? 'PAUSE' : 'PLAY';
        if (isPlaying) playNextMove();
        else updateHighlight();
    });

    btnNext.addEventListener('click', () => {
        if (isPlaying) { isPlaying = false; btnPlay.textContent = 'PLAY'; }
        
        while (playIndex < currentSolution.length) {
            let m = currentSolution[playIndex];
            if (m.startsWith('[') || m === '|') { playIndex++; continue; }
            if (currentMode === '2x2') cubeState.applySequence(m);
            cube3D.applyMoveAnim(m, () => {
                playIndex++;
                updateHighlight();
            });
            break;
        }
    });

    btnPrev.addEventListener('click', () => {
        if (isPlaying) { isPlaying = false; btnPlay.textContent = 'PLAY'; }
        if (cube3D.isAnimating) return; // Wait until done
        
        while (playIndex > 0) {
            playIndex--;
            let m = currentSolution[playIndex];
            if (m.startsWith('[') || m === '|') { continue; }
            
            let inv = m;
            if (m.endsWith("'")) inv = m[0];
            else if (m.endsWith("2")) inv = m;
            else inv = m + "'";
            
            if (currentMode === '2x2') cubeState.applySequence(inv);
            cube3D.applyMoveAnim(inv, () => {
                updateHighlight();
            });
            break;
        }
    });
});
