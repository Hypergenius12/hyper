import urllib.request, os

assets = {
    'slopcraft 3D/assets/mc/item/eye_of_ender.png': 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.4/assets/minecraft/textures/item/ender_eye.png',
    'slopcraft 3D/assets/mc/item/blaze_powder.png': 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.4/assets/minecraft/textures/item/blaze_powder.png',
    'slopcraft 3D/assets/mc/block/dragon_egg.png': 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.4/assets/minecraft/textures/block/dragon_egg.png',
    'slopcraft 3D/assets/mc/block/end_portal.png': 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.4/assets/minecraft/textures/entity/end_portal.png',
    'slopcraft 3D/assets/mc/block/end_portal_frame_eye.png': 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.4/assets/minecraft/textures/block/end_portal_frame_eye.png',
}

os.makedirs('slopcraft 3D/assets/mc/item', exist_ok=True)
os.makedirs('slopcraft 3D/assets/mc/block', exist_ok=True)

for path, url in assets.items():
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
            with open(path, 'wb') as f:
                f.write(data)
            print(f'Wrote official texture {path} ({len(data)} bytes)')
    except Exception as e:
        print(f'Error downloading {path}: {e}')
