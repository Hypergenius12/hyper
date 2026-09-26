const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[uncaught] ${err.toString()}`);
  });

  await page.goto('http://localhost:8011/', { waitUntil: 'networkidle2' });
  
  // Wait a bit to let things render/initialize
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
