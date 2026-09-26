const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/<script>\s*window\.onerror[\s\S]*?<\/script>\n\n/g, '');

fs.writeFileSync('index.html', html);
