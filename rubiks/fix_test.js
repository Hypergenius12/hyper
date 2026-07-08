// verify it compiles
const fs = require('fs');
try {
  let js = fs.readFileSync('js/cube3d.js', 'utf8');
  new Function(js);
  console.log("Syntax OK");
} catch (e) {
  console.log("Error:", e);
}
