const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.toString()));
  
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:8006/genesis/index.html', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'screenshot.png' });
  console.log("Screenshot saved.");
  
  await browser.close();
})();
