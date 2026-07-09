import solver from 'https://esm.sh/rubiks-cube-solver@1.2.0';

window.getCFOPSolution = function(cubejsStr) {
    try {
        let U = cubejsStr.substr(0, 9);
        let R = cubejsStr.substr(9, 9);
        let F = cubejsStr.substr(18, 9);
        let D = cubejsStr.substr(27, 9);
        let L = cubejsStr.substr(36, 9);
        let B = cubejsStr.substr(45, 9);
        
        let cfopStr = (F + R + U + D + L + B).toLowerCase();
        
        let solution = solver(cfopStr, { partitioned: true });
        
        // Format the output
        let steps = [];
        
        if (solution.cross && solution.cross.length > 0) {
            steps.push(...solution.cross.join(' ').split(' ').filter(m => m));
        }
        if (solution.f2l && solution.f2l.length > 0) {
            steps.push(...solution.f2l.join(' ').split(' ').filter(m => m));
        }
        if (solution.oll) {
            steps.push(...solution.oll.split(' ').filter(m => m));
        }
        if (solution.pll) {
            steps.push(...solution.pll.split(' ').filter(m => m));
        }
        
        // Convert 'prime' to "'"
        steps = steps.map(m => m.replace('prime', "'"));
        
        // Also uppercase the single letter lowercases which are wide moves
        steps = steps.map(m => {
            if (m.length === 1 || (m.length === 2 && (m.endsWith("'") || m.endsWith("2")))) {
                if (m[0] === m[0].toLowerCase()) {
                    return m[0] + "w" + (m[1] || "");
                }
            }
            return m;
        });
        
        return steps;
    } catch(e) {
        console.error("CFOP Solver error:", e);
        return null;
    }
};
