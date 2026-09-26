const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const script = `
<script>
window.onerror = function(msg, url, line, col, error) {
  fetch('/log', { method: 'POST', body: 'ERROR: ' + msg + ' ' + (error ? error.stack : '') });
};
const ogLog = console.log, ogErr = console.error, ogWarn = console.warn;
console.log = function(...args) { fetch('/log', { method: 'POST', body: 'LOG: ' + args.join(' ') }); ogLog(...args); };
console.error = function(...args) { fetch('/log', { method: 'POST', body: 'ERR: ' + args.join(' ') }); ogErr(...args); };
console.warn = function(...args) { fetch('/log', { method: 'POST', body: 'WARN: ' + args.join(' ') }); ogWarn(...args); };
</script>
`;
if (!html.includes('window.onerror')) {
  html = html.replace('<head>', '<head>' + script);
  fs.writeFileSync('index.html', html);
}
