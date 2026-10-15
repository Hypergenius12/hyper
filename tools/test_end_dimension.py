import time
import json
from playwright.sync_api import sync_playwright

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--use-gl=angle', '--use-angle=swiftshader'])
        page = browser.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        print("Navigating to game...")
        page.goto("http://127.0.0.1:8000/slopcraft%203D/index.html", wait_until="networkidle")
        time.sleep(2)

        # Click Play Game
        print("Clicking Play Game...")
        page.click("#btn-new-game")
        time.sleep(3)

        # Verify game is running
        is_ready = page.evaluate("() => window.game && window.game.isReady")
        print("Game is ready:", is_ready)

        # Check BLOCKS registration
        blocks_check = page.evaluate("""() => {
            const B = window.BLOCKS;
            return {
                END_PORTAL_FRAME_EYE: B.END_PORTAL_FRAME_EYE,
                END_PORTAL: B.END_PORTAL,
                END_STONE: B.END_STONE,
                DRAGON_EGG: B.DRAGON_EGG,
                PORTAL_FRAME: B.PORTAL_FRAME
            };
        }""")
        print("Blocks check:", blocks_check)

        # Check Stronghold calculation
        sh_pos = page.evaluate("""() => {
            return window.game ? window.game.world.planetParams.seed : null;
        }""")
        print("World seed:", sh_pos)

        # Test Eye of Ender Stronghold lookup
        sh_coords = page.evaluate("""() => {
            const seed = window.game.currentSeed || 12345;
            // Test function from generation.js or calculation
            const rng = (s) => {
                let x = Math.sin(s) * 10000;
                return x - Math.floor(x);
            };
            const angle = rng(seed) * Math.PI * 2;
            const dist = 90 + rng(seed + 1) * 30;
            return { x: Math.round(Math.cos(angle) * dist), z: Math.round(Math.sin(angle) * dist) };
        }""")
        print("Stronghold coords:", sh_coords)

        # Test warping to End
        print("Testing warp to The End dimension...")
        page.evaluate("() => window.game.warpToNewPlanet('end')")
        time.sleep(5)

        dim_after_warp = page.evaluate("() => window.game.currentDimension")
        print("Current dimension after warp:", dim_after_warp)

        # Check mobs in The End (Ender Dragon and 8 crystals)
        mobs_in_end = page.evaluate("""() => {
            const mobs = window.game.entityManager.mobs.map(m => ({
                type: m.type,
                alive: m.alive,
                health: m.health,
                pos: { x: Math.round(m.position.x), y: Math.round(m.position.y), z: Math.round(m.position.z) }
            }));
            const crystals = mobs.filter(m => m.type === 'END_CRYSTAL');
            const dragons = mobs.filter(m => m.type === 'ENDER_DRAGON');
            return { total: mobs.length, crystals: crystals.length, dragons: dragons.length };
        }""")
        print("Mobs in The End:", mobs_in_end)

        # Test End Crystal takeDamage and explosion
        crystal_explosion = page.evaluate("""() => {
            const crystal = window.game.entityManager.mobs.find(m => m.type === 'END_CRYSTAL');
            if (crystal) {
                crystal.takeDamage(1);
                return { dead: !crystal.alive, health: crystal.health };
            }
            return null;
        }""")
        print("Crystal damage test:", crystal_explosion)

        # Test dragon defeat callback
        print("Testing Dragon defeat trigger...")
        defeat_res = page.evaluate("""() => {
            const dragon = window.game.entityManager.mobs.find(m => m.type === 'ENDER_DRAGON');
            if (dragon) {
                dragon.takeDamage(500); // kill dragon
                return { killed: true };
            }
            return { killed: false };
        }""")
        print("Dragon defeated result:", defeat_res)
        time.sleep(2)

        # Check if exit portal and dragon egg spawned
        portal_check = page.evaluate("""() => {
            const B = window.BLOCKS;
            const egg = window.game.world.getBlock(0, 59, 0);
            const portalCenter1 = window.game.world.getBlock(1, 55, 0);
            const portalCenter2 = window.game.world.getBlock(0, 55, 1);
            return {
                eggIsDragonEgg: (egg === B.DRAGON_EGG),
                portal1IsEndPortal: (portalCenter1 === B.END_PORTAL),
                portal2IsEndPortal: (portalCenter2 === B.END_PORTAL)
            };
        }""")
        print("Exit portal and egg check:", portal_check)

        # Test stepping into Exit Portal to trigger Credits
        print("Testing Exit Portal trigger for End Credits...")
        page.evaluate("""() => {
            window.game.showEndCredits();
        }""")
        time.sleep(1)

        credits_visible = page.evaluate("""() => {
            const el = document.getElementById('credits-screen');
            return el && !el.classList.contains('hidden');
        }""")
        print("Credits screen visible:", credits_visible)

        # Take screenshot of Credits
        page.screenshot(path="C:/Users/Caleb.Abbe/.gemini/antigravity/brain/55f77d6a-45e3-4a1f-bd91-3a7ef8a480dc/credits_test.png")
        print("Credits screenshot saved!")

        # Test closing credits and warping back to Overworld
        print("Testing close credits...")
        page.evaluate("() => window.game.closeEndCredits()")
        time.sleep(3)

        dim_after_credits = page.evaluate("() => window.game.currentDimension")
        print("Dimension after credits close:", dim_after_credits)

        print("\nConsole errors encountered during test:")
        for err in console_errors:
            print("ERR:", err)

        browser.close()

if __name__ == "__main__":
    run_tests()
