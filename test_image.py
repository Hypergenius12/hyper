from PIL import Image

img = Image.open('screenshot.png')
width, height = img.size
# Check the bottom 72 pixels (the bottom bar)
bottom_bar = img.crop((0, height - 72, width, height))
colors = bottom_bar.getcolors(maxcolors=1000)
print(f"Colors in bottom 72px: {colors}")
