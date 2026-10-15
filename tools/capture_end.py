from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={'width': 1280, 'height': 720})
    page.goto('http://127.0.0.1:8000/slopcraft%203D/index.html')
    page.wait_for_timeout(3000)
    page.click('#btn-new-game')
    page.wait_for_timeout(2000)
    page.evaluate("() => window.game.warpToNewPlanet('end')")
    page.wait_for_timeout(5000)
    page.evaluate("""() => {
        window.game.cameraMode = 0;
        window.game.player.position.set(0, 56, 30);
        window.game.engine.camera.position.set(0, 58, 30);
        window.game.engine.camera.lookAt(0, 75, 0);
    }""")
    page.wait_for_timeout(1000)
    page.screenshot(path="C:/Users/Caleb.Abbe/.gemini/antigravity/brain/55f77d6a-45e3-4a1f-bd91-3a7ef8a480dc/end_dragon_island.png")
    print("SCREENSHOT_DONE")
    b.close()
