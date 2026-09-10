#!/bin/bash
osascript -l JavaScript -e "
var app = Application.currentApplication();
app.includeStandardAdditions = true;
var cubeState = app.doShellScript('cat /Users/2013mbp4gb128gb/Downloads/rubiks-2x2/js/cubeState.js');
var solver = app.doShellScript('cat /Users/2013mbp4gb128gb/Downloads/rubiks-2x2/js/solver.js');
eval(cubeState);
eval(solver);
var testCube = new CubeState();
testCube.applySequence('U R F U R F');
var sol = solveOptimal(testCube);
sol.join(' ');
"
