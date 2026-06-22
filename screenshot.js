const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:7000/paths.html', {
    waitUntil: 'networkidle2'
  });
  
  await page.screenshot({ path: 'screenshot_paths.png', type: 'png' });
  await browser.close();
})();
