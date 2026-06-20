import asyncio
from playwright.async_api import async_playwright

async def take_screenshots():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        urls = [
            ("http://localhost:7000/Cyber/index.html", "screenshot_cyber.png"),
            ("http://localhost:7000/trillion/index.html", "screenshot_trillion.png")
        ]
        
        for url, filename in urls:
            try:
                print(f"Loading {url}...")
                await page.goto(url, wait_until="networkidle", timeout=15000)
                await asyncio.sleep(2)  # extra wait for rendering
                await page.screenshot(path=filename)
                print(f"Saved {filename}")
            except Exception as e:
                print(f"Failed to screenshot {url}: {e}")
                
        await browser.close()

asyncio.run(take_screenshots())
