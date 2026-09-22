# Native-pixel region crops on grey, side by side: region.py <out.jpg> <tag>@x,y,w,h ...
import sys, pathlib
from PIL import Image
HERE = pathlib.Path(__file__).resolve().parent
cs = []
for a in sys.argv[2:]:
    tag, box = a.split("@"); x, y, w, h = map(int, box.split(","))
    im = Image.open(HERE / "renders" / f"{tag}.png").convert("RGBA") if tag != "idle" else \
         Image.open(HERE.parents[6] / "public/art/characters/leblanc/idle.png").convert("RGBA")
    bg = Image.new("RGBA", im.size, (150, 150, 160, 255)); bg.alpha_composite(im); cs.append(bg.crop((x, y, x + w, y + h)))
W = sum(c.width + 10 for c in cs); H = max(c.height for c in cs)
out = Image.new("RGB", (W, H), (30, 30, 36)); x = 0
for c in cs: out.paste(c.convert("RGB"), (x, 0)); x += c.width + 10
out.save(HERE / sys.argv[1], quality=90); print(out.size)
