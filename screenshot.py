import asyncio
from playwright.async_api import async_playwright

async def take_screenshots():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        urls = [
            ("http://localhost:8000/index.html", "screenshot_main.png")
        ]
        
        for url, filename in urls:
            try:
                print(f"Loading {url}...")
                await page.goto(url, wait_until="load", timeout=15000)
                await asyncio.sleep(3)  # wait for three.js and things to load
                await page.screenshot(path=filename)
                print(f"Saved {filename}")
            except Exception as e:
                print(f"Failed to screenshot {url}: {e}")
                
        await browser.close()

asyncio.run(take_screenshots())
