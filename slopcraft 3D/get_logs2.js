const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE EXCEPTION:', err.toString()));
    
    await page.goto('http://localhost:8080/');
    
    try {
        await page.waitForSelector('#btn-new-game', {timeout: 5000});
        await page.click('#btn-new-game');
        await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
        console.log('Failed to start game:', e.message);
    }
    
    await browser.close();
})();
