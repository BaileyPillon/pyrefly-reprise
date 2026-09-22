# Survey helper: contenders downscaled with a 100 px grid in CUTOUT coordinates, to read face boxes off.
import sys, pathlib
from PIL import Image, ImageDraw, ImageFont
HERE = pathlib.Path(__file__).resolve().parent
state, seeds = sys.argv[1], sys.argv[2:]
F = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 14)
tiles = []
for s in seeds:
    im = Image.open(HERE / "renders" / f"{state}.{s}.png").convert("RGBA"); k = 0.5
    bg = Image.new("RGBA", im.size, (150, 150, 160, 255)); bg.alpha_composite(im)
    bg = bg.resize((int(im.width * k), int(im.height * k))); d = ImageDraw.Draw(bg)
    for x in range(0, im.width, 100): d.line([(x * k, 0), (x * k, bg.height)], fill=(255, 255, 0, 255)); d.text((x * k + 2, 2), str(x), fill=(0, 0, 0), font=F)
    for y in range(0, im.height, 100): d.line([(0, y * k), (bg.width, y * k)], fill=(0, 255, 255, 255)); d.text((2, y * k + 2), str(y), fill=(0, 0, 0), font=F)
    d.text((bg.width - 90, 2), s, fill=(255, 255, 255), font=F); tiles.append(bg)
W = sum(t.width + 6 for t in tiles); H = max(t.height for t in tiles)
out = Image.new("RGB", (W, H), (40, 40, 40)); x = 0
for t in tiles: out.paste(t.convert("RGB"), (x, 0)); x += t.width + 6
out.save(HERE / f"_grid-{state}.jpg", quality=85); print(out.size)
