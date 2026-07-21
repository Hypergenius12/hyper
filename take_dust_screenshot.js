const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto('http://localhost:8000/dust/index.html', { waitUntil: 'networkidle0' });
    
    // Inject some sand
    await page.evaluate(() => {
        if (window.ELEMENTS && window.ELEMENTS.SAND) {
            for (let x = window.WIDTH/2 - 100; x < window.WIDTH/2 + 100; x++) {
                for (let y = 10; y < 100; y++) {
                    const idx = Math.floor(x) + Math.floor(y) * window.WIDTH;
                    if(idx >= 0 && idx < window.grid.length) {
                        window.grid[idx] = window.ELEMENTS.SAND.id;
                    }
                }
            }
        }
    });
    
    // Wait for sand to fall
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ path: '/Users/2013mbp4gb128gb/Downloads/hypergenius12/screenshot_dust.png' });
    await browser.close();
    console.log('Screenshot saved to screenshot_dust.png');
})();
