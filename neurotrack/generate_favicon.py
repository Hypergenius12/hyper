from PIL import Image

size = 16
squares = 4 # 4x4 squares
sq_size = size // squares

img = Image.new('RGB', (size, size))
pixels = img.load()

for y in range(size):
    for x in range(size):
        sx = x // sq_size
        sy = y // sq_size
        if (sx + sy) % 2 == 0:
            pixels[x, y] = (255, 255, 255)
        else:
            pixels[x, y] = (17, 17, 17)

img.save('favicon.png')
