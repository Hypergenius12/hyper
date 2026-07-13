const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width: 1200, height: 800});
    await page.goto('http://localhost:8006');
    // Wait for shaders and UI to initialize and render
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({path: 'screenshot_synesthesia.png'});
    await browser.close();
})();
