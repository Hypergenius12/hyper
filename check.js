const { JSDOM } = require('jsdom');
JSDOM.fromFile('genesis/index.html', { runScripts: "dangerously", resources: "usable" }).then(dom => {
  dom.window.console.error = (...args) => console.log('ERROR:', ...args);
  dom.window.console.log = (...args) => console.log('LOG:', ...args);
  dom.window.console.warn = (...args) => console.log('WARN:', ...args);
  setTimeout(() => {
    console.log("Done");
  }, 2000);
}).catch(err => console.log(err));
