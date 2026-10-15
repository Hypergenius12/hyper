import time
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

        print("Clicking Play Game...")
        page.click("#btn-new-game")
        for _ in range(30):
            if page.evaluate("() => window.game && window.game.isReady"):
                break
            time.sleep(1)
        print("Game is ready!")

        # Check Audio methods
        audio_check = page.evaluate("""() => {
            const a = window.game.audio;
            return {
                hasEyePlace: typeof a.playEyePlace === 'function',
                hasEyeLaunch: typeof a.playEnderEyeLaunch === 'function',
                hasPortalSpawn: typeof a.playEndPortalSpawn === 'function'
            };
        }""")
        print("Audio methods check:", audio_check)
        assert audio_check['hasEyePlace'] and audio_check['hasEyeLaunch'] and audio_check['hasPortalSpawn']

        # Check Texture map for END_PORTAL_FRAME_EYE
        tex_check = page.evaluate("""() => {
            const B = window.BLOCKS;
            const uvEye = window.game.atlas.getUV(B.END_PORTAL_FRAME_EYE, 'eye');
            const uvTop = window.game.atlas.getUV(B.END_PORTAL_FRAME_EYE, 'top');
            return {
                uvEyeValid: !!uvEye && typeof uvEye.u === 'number',
                uvTopValid: !!uvTop && typeof uvTop.u === 'number'
            };
        }""")
        print("Texture UV check for END_PORTAL_FRAME_EYE:", tex_check)
        assert tex_check['uvEyeValid'] and tex_check['uvTopValid']

        # Check End Portal material
        mat_check = page.evaluate("""() => {
            const mat = window.game.world.matEndPortal;
            return {
                exists: !!mat,
                isShaderMaterial: mat && mat.isShaderMaterial,
                hasTimeUniform: mat && mat.uniforms && mat.uniforms.time !== undefined,
                hasCameraPosUniform: mat && mat.uniforms && mat.uniforms.cameraPos !== undefined
            };
        }""")
        print("End Portal shader material check:", mat_check)
        assert mat_check['exists'] and mat_check['isShaderMaterial'] and mat_check['hasTimeUniform'] and mat_check['hasCameraPosUniform']

        # Test warp to End
        print("Warping to The End...")
        page.evaluate("() => window.game.warpToNewPlanet('end')")
        time.sleep(4)

        # Check End lighting
        lighting_check = page.evaluate("""() => {
            const l = window.game.lighting;
            return {
                ambColorHex: '#' + l.ambientLight.color.getHexString(),
                ambIntensity: l.ambientLight.intensity,
                fogDensity: window.game.engine.scene.fog ? window.game.engine.scene.fog.density : null,
                currentDim: window.game.currentDimension
            };
        }""")
        print("End lighting check:", lighting_check)
        assert lighting_check['currentDim'] == 'end'
        assert lighting_check['ambIntensity'] >= 1.2, f"End ambient intensity too low: {lighting_check['ambIntensity']}"

        # Check Ender Dragon entity in End
        dragon_health = page.evaluate("""() => {
            const dragon = window.game.entityManager.mobs.find(m => m.type === 'ENDER_DRAGON');
            return dragon ? { health: dragon.health, maxHealth: dragon.maxHealth } : null;
        }""")
        print("Spawned Ender Dragon HP:", dragon_health)
        assert dragon_health and dragon_health['health'] == 2000, f"Spawned dragon health mismatch: {dragon_health}"

        # Test Credits warp to Aether
        print("Triggering End Credits...")
        page.evaluate("() => window.game.showEndCredits()")
        time.sleep(1)

        credits_vis = page.evaluate("() => !document.getElementById('credits-screen').classList.contains('hidden')")
        print("Credits visible:", credits_vis)
        assert credits_vis

        print("Closing End Credits...")
        page.evaluate("() => window.game.closeEndCredits()")
        time.sleep(4)

        dim_after = page.evaluate("() => window.game.currentDimension")
        print("Dimension after credits close:", dim_after)
        assert dim_after == 'aether', f"Expected aether, got {dim_after}"

        # Place End Portal block and verify endPortalMesh creation
        portal_mesh_check = page.evaluate("""() => {
            const B = window.BLOCKS;
            const px = Math.floor(window.game.player.position.x);
            const py = Math.floor(window.game.player.position.y);
            const pz = Math.floor(window.game.player.position.z);
            window.game.world.setBlock(px, py - 1, pz, B.END_PORTAL);
            const chunk = window.game.world.getChunkAt(px, pz);
            if (chunk) {
                const neighbors = [[null,null,null],[null,null,null],[null,null,null]];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        const key = window.game.world.getChunkKey(chunk.cx + dx, chunk.cz + dz);
                        neighbors[dx + 1][dz + 1] = window.game.world.chunks.get(key) || null;
                    }
                }
                chunk.buildMesh(window.game.atlas, neighbors, window.game.world.planetParams);
            }
            return {
                chunkHasEndPortalMesh: !!(chunk && chunk.endPortalMesh),
                meshRenderOrder: chunk && chunk.endPortalMesh ? chunk.endPortalMesh.renderOrder : null
            };
        }""")
        print("Portal mesh check:", portal_mesh_check)
        assert portal_mesh_check['chunkHasEndPortalMesh'], "Chunk did not create endPortalMesh for BLOCKS.END_PORTAL"

        # Capture screenshot
        page.screenshot(path="C:/Users/Caleb.Abbe/.gemini/antigravity/brain/55f77d6a-45e3-4a1f-bd91-3a7ef8a480dc/end_portal_and_aether_test.png")
        print("Screenshot saved!")

        print("\nConsole errors:")
        for err in console_errors:
            print("ERR:", err)

        browser.close()
        print("\nALL VERIFICATIONS PASSED!")

if __name__ == "__main__":
    run_tests()
