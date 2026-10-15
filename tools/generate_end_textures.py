import zlib, struct, os

def make_png(w, h, rgba_bytes):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    raw = b''.join(b'\x00' + rgba_bytes[y*w*4:(y+1)*w*4] for y in range(h))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')

def get_frame_top_rgba(path):
    with open(path, 'rb') as f: data = f.read()
    pos, idat, pal, trns = 8, b'', [], b''
    w, h = 0, 0
    while pos < len(data):
        l = struct.unpack('>I', data[pos:pos+4])[0]
        tag = data[pos+4:pos+8]
        cd = data[pos+8:pos+8+l]
        pos += 12 + l
        if tag == b'IHDR': w, h = struct.unpack('>II', cd[:8])
        elif tag == b'PLTE': pal = [tuple(cd[i:i+3]) for i in range(0, len(cd), 3)]
        elif tag == b'tRNS': trns = cd
        elif tag == b'IDAT': idat += cd
    raw = zlib.decompress(idat)
    pixels = []
    stride = 1 + w
    for y in range(h):
        line = raw[y*stride+1 : (y+1)*stride]
        for idx in line:
            r, g, b = pal[idx]
            a = trns[idx] if idx < len(trns) else 255
            pixels.append((r, g, b, a))
    return w, h, pixels

# 1. Eye of Ender Item (16x16)
# Pixel art representation of the Minecraft Eye of Ender
eye_item_hex = [
    "................",
    ".....XXXXXX.....",
    "...XXAAAAAAXX...",
    "..XABBBBBBAAX...",
    ".XABCCDDEEBBAX..",
    ".XABCDEFEEBBAX..",
    "XABCCDGHEEBBAAX.",
    "XABCDEGEEBBAAAX.",
    "XABCCDGHEEBBAAX.",
    "XABCDEFEEBBAAAX.",
    ".XABCCDDEEBBAX..",
    ".XABBBEEEEBBAX..",
    "..XABEEEEBAAX...",
    "...XXAAAAAAXX...",
    ".....XXXXXX.....",
    "................",
]
eye_palette = {
    '.': (0, 0, 0, 0),
    'X': (9, 28, 24, 255),    # dark border
    'A': (14, 52, 44, 255),   # deep teal
    'B': (22, 85, 71, 255),   # teal green
    'C': (43, 142, 116, 255), # vibrant sea green
    'D': (65, 196, 155, 255), # bright emerald
    'E': (18, 68, 56, 255),   # dark shadow
    'F': (110, 240, 195, 255),# cyan-lime highlight
    'G': (10, 14, 12, 255),   # slit pupil dark core
    'H': (28, 48, 38, 255),   # pupil edge
}
eye_bytes = bytearray()
for row in eye_item_hex:
    for ch in row:
        c = eye_palette[ch]
        eye_bytes.extend(c)

# 2. Blaze Powder Item (16x16)
blaze_powder_hex = [
    "................",
    ".......A........",
    "......AAA.......",
    ".....ABBBA......",
    "....ABCCCBA.....",
    "...ABCCDDCBA....",
    "...ABCDFFDCBA...",
    "..ABCCDFGFDCBA..",
    "..ABCDFFFFDCBA..",
    ".ABCCCCDDDDCCBA.",
    ".ABBBCCCCCCCCBA.",
    "..ABBBCCCCCCBA..",
    "...ABBBBBBBBA...",
    "....AAAAAAAA....",
    "................",
    "................",
]
blaze_palette = {
    '.': (0, 0, 0, 0),
    'A': (110, 20, 0, 255),    # burnt border
    'B': (190, 50, 0, 255),    # deep orange-red
    'C': (245, 115, 0, 255),   # blazing orange
    'D': (255, 175, 10, 255),  # fire orange-yellow
    'F': (255, 225, 50, 255),  # bright yellow
    'G': (255, 255, 180, 255), # core hot white-yellow
}
blaze_bytes = bytearray()
for row in blaze_powder_hex:
    for ch in row:
        c = blaze_palette[ch]
        blaze_bytes.extend(c)

# 3. End Portal Frame Eye (16x16 Block)
# Re-use end_portal_frame_top.png and draw the eye in the 6x6 / 8x8 center socket
w, h, base_pixels = get_frame_top_rgba('slopcraft 3D/assets/mc/block/end_portal_frame_top.png')
frame_eye_px = [list(p) for p in base_pixels]

# Socket coordinates: x: 4..11, y: 4..11
eye_socket_art = [
    "..XXXX..",
    ".XABBAX.",
    "XACDDBAX",
    "XACEEDAX",
    "XACEEDAX",
    "XACDDBAX",
    ".XABBAX.",
    "..XXXX..",
]
socket_colors = {
    'X': (8, 24, 20, 255),
    'A': (14, 58, 48, 255),
    'B': (24, 98, 80, 255),
    'C': (55, 180, 140, 255),
    'D': (12, 16, 14, 255),   # slit pupil
    'E': (95, 235, 180, 255), # bright pupil highlight
}
for dy, row in enumerate(eye_socket_art):
    for dx, ch in enumerate(row):
        if ch != '.':
            target_x = 4 + dx
            target_y = 4 + dy
            frame_eye_px[target_y * 16 + target_x] = list(socket_colors[ch])

frame_eye_bytes = bytearray()
for p in frame_eye_px:
    frame_eye_bytes.extend(p)

# 4. End Portal Block (16x16 Animated or Rich Static Starry Void)
# Deep space cosmic void with multi-colored stars
starry_art = [
    "0000001000000000",
    "0020000000300000",
    "0000000000000400",
    "0000500000000000",
    "0300000020000000",
    "0000000000001000",
    "0000100000000020",
    "0000000400000000",
    "0030000000050000",
    "0000000000000000",
    "0000020000000100",
    "0400000003000000",
    "0000000000000000",
    "0000100000020000",
    "0000000500000000",
    "0020000000000300",
]
star_palette = {
    '0': (5, 2, 12, 255),      # deep void
    '1': (180, 60, 255, 255),  # magenta star
    '2': (50, 220, 255, 255),  # cyan star
    '3': (255, 255, 255, 255), # white star
    '4': (120, 255, 160, 255), # green star
    '5': (120, 40, 180, 255),  # purple nebula
}
portal_bytes = bytearray()
for row in starry_art:
    for ch in row:
        portal_bytes.extend(star_palette[ch])

# 5. Dragon Egg Block (16x16)
dragon_egg_art = [
    "................",
    "......XXXX......",
    ".....XAAAAB.....",
    "....XACCAAABB...",
    "...XACDCCAABBB..",
    "...XACCCCAABBB..",
    "..XACCCCCCAABBB.",
    "..XACDCCCCAABBB.",
    "..XACCCCCCAABBB.",
    "..XACCCCDCAABBB.",
    "...XACCCCAABBB..",
    "...XACCCCAABBB..",
    "....XACCAABBB...",
    ".....XAAAABB....",
    "......XXXXBB....",
    "........BBB.....",
]
egg_palette = {
    '.': (0, 0, 0, 0),
    'X': (14, 8, 22, 255),    # dark outline
    'B': (10, 5, 16, 255),    # shaded back
    'A': (25, 14, 38, 255),   # body dark obsidian
    'C': (38, 20, 56, 255),   # purple obsidian
    'D': (125, 45, 190, 255), # glowing violet specks
}
egg_bytes = bytearray()
for row in dragon_egg_art:
    for ch in row:
        egg_bytes.extend(egg_palette[ch])

# Write files
os.makedirs('slopcraft 3D/assets/mc/item', exist_ok=True)
os.makedirs('slopcraft 3D/assets/mc/block', exist_ok=True)

with open('slopcraft 3D/assets/mc/item/eye_of_ender.png', 'wb') as f:
    f.write(make_png(16, 16, eye_bytes))
print("Saved eye_of_ender.png")

with open('slopcraft 3D/assets/mc/item/blaze_powder.png', 'wb') as f:
    f.write(make_png(16, 16, blaze_bytes))
print("Saved blaze_powder.png")

with open('slopcraft 3D/assets/mc/block/end_portal_frame_eye.png', 'wb') as f:
    f.write(make_png(16, 16, frame_eye_bytes))
print("Saved end_portal_frame_eye.png")

with open('slopcraft 3D/assets/mc/block/end_portal.png', 'wb') as f:
    f.write(make_png(16, 16, portal_bytes))
print("Saved end_portal.png")

with open('slopcraft 3D/assets/mc/block/dragon_egg.png', 'wb') as f:
    f.write(make_png(16, 16, egg_bytes))
print("Saved dragon_egg.png")
