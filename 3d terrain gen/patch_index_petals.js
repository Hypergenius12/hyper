const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
if (!code.includes('petals.js')) {
    code = code.replace(/<script src="js\/weather\.js"><\/script>/, '<script src="js/weather.js"></script>\n    <script src="js/petals.js"></script>');
    fs.writeFileSync('index.html', code);
}
