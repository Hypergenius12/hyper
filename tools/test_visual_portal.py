import time
from playwright.sync_api import sync_playwright

def capture_portal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--use-gl=angle', '--use-angle=swiftshader'])
        page = browser.new_page()

        print("Navigating to game...")
        page.goto("http://127.0.0.1:8000/slopcraft%203D/index.html", wait_until="networkidle")
        time.sleep(2)

        page.click("#btn-new-game")
        for _ in range(30):
            if page.evaluate("() => window.game && window.game.isReady"):
                break
            time.sleep(1)

        page.evaluate("""() => {
            const B = window.BLOCKS;
            const px = Math.floor(window.game.player.position.x);
            const py = Math.floor(window.game.player.position.y);
            const pz = Math.floor(window.game.player.position.z);

            if (window.game.ui && window.game.ui.isMenuOpen) {
                window.game.ui.closeGameMenu();
            }

            // Clear space in front of player (North is -Z)
            for (let dx = -3; dx <= 3; dx++) {
                for (let dy = 0; dy <= 4; dy++) {
                    for (let dz = -1; dz >= -7; dz--) {
                        window.game.world.setBlock(px + dx, py + dy, pz + dz, B.AIR);
                    }
                }
            }

            // Create flat platform at py - 1
            for (let dx = -3; dx <= 3; dx++) {
                for (let dz = -1; dz >= -7; dz--) {
                    window.game.world.setBlock(px + dx, py - 1, pz + dz, B.STONE);
                }
            }

            // Place portal frame and portal at py (-Z is forward)
            // Center is (px, py, pz - 4)
            for (let dx = -2; dx <= 2; dx++) {
                for (let dz = -2; dz >= -6; dz--) {
                    const isBorder = (Math.abs(dx) === 2 || dz === -2 || dz === -6);
                    if (isBorder && !(Math.abs(dx) === 2 && (dz === -2 || dz === -6))) {
                        window.game.world.setBlock(px + dx, py, pz + dz, B.END_PORTAL_FRAME_EYE);
                    } else if (!isBorder) {
                        window.game.world.setBlock(px + dx, py, pz + dz, B.END_PORTAL);
                    }
                }
            }

            // Position player slightly elevated and look down at portal
            window.game.player.position.set(px, py + 2.5, pz - 0.5);
            window.game.player.rotation.pitch = -0.7;
            window.game.player.rotation.yaw = 0;
        }""")

        time.sleep(2)

        page.evaluate("""() => {
            window.game.player.rotation.pitch = -0.7;
            window.game.player.rotation.yaw = 0;
        }""")

        page.screenshot(path="C:/Users/Caleb.Abbe/.gemini/antigravity/brain/55f77d6a-45e3-4a1f-bd91-3a7ef8a480dc/end_portal_visual.png")
        print("Visual portal screenshot captured!")
        browser.close()

if __name__ == "__main__":
    capture_portal()
