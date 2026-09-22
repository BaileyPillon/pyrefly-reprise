# Survey strip (FFX-2 only): every candidate of one state whole on grey, scaled to a common height.
# Survey only; judging is done from 1:1 crops (crops.py).
import sys, pathlib
from PIL import Image, ImageDraw, ImageFont
HERE = pathlib.Path(__file__).resolve().parent
state, H = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 700
ims = sorted((HERE / "renders").glob(f"{state}.*.png"))
ims = [p for p in ims if not p.name.endswith(".raw.png")]
tiles = []
for p in ims:
    im = Image.open(p).convert("RGBA"); s = H / im.height
    im = im.resize((round(im.width * s), H), Image.LANCZOS)
    bg = Image.new("RGBA", (im.width, H + 30), (150, 150, 160, 255)); bg.alpha_composite(im, (0, 30))
    ImageDraw.Draw(bg).text((4, 4), p.stem, fill=(255, 255, 255), font=ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 20))
    tiles.append(bg)
W = sum(t.width for t in tiles) + 8 * len(tiles)
out = Image.new("RGB", (W, H + 30), (60, 60, 70)); x = 0
for t in tiles: out.paste(t.convert("RGB"), (x, 0)); x += t.width + 8
out.save(HERE / f"_strip-{state}.jpg", quality=85)
print(out.size)
