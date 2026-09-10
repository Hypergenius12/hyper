const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('PAGE ERROR:', msg.text());
        }
    });
    
    page.on('pageerror', err => {
        console.log('PAGE EXCEPTION:', err.toString());
    });

    await page.goto('http://localhost:8080/');
    
    // Click the new game button
    try {
        await page.waitForSelector('#btn-new-game');
        await page.click('#btn-new-game');
        // Wait a bit to let the crash happen
        await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
        console.log('Failed to click new game:', e.message);
    }
    
    await browser.close();
})();
