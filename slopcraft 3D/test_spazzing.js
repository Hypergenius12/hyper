const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8080/');
    
    try {
        await page.waitForSelector('#btn-new-game', {timeout: 5000});
        await page.click('#btn-new-game');
        
        // Wait for game to start
        await new Promise(r => setTimeout(r, 2000));
        
        for (let i = 0; i < 20; i++) {
            const data = await page.evaluate(() => {
                if (!window.game || !window.game.engine) return 'no game';
                const cam = window.game.engine.camera;
                const pos = cam.position;
                return {
                    x: pos.x, y: pos.y, z: pos.z,
                    calls: window.game.engine.renderer.info.render.calls,
                    geometries: window.game.engine.renderer.info.memory.geometries,
                    fps: window.game.fps
                };
            });
            console.log(JSON.stringify(data));
            await new Promise(r => setTimeout(r, 100)); // Sample every 100ms
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
    
    await browser.close();
})();
