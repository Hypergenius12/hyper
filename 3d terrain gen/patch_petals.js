const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/<script src="js\/sky\.js[\s\S]*?"><\/script>/, 
    '$&\n    <script src="js/petals.js"></script>');

fs.writeFileSync('index.html', html);
