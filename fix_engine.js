const fs = require('fs');
let code = fs.readFileSync('genesis/engine.js', 'utf8');

// 1. Update processCommand signature and add retry logic
const processCommandMatch = /async function processCommand\(userInput\) \{.*?\n\}/s;

// We need to replace it more carefully since processCommand is large.
