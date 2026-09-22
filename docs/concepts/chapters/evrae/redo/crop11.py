"""1:1 native-pixel crops on mid-grey. usage: crop11.py out.jpg x,y,w,h file1 [file2 ...]
x,y may be 'head' = auto: the leftmost opaque column band (the head faces left)."""
import sys
import numpy as np
from PIL import Image, ImageDraw
out, box, files = sys.argv[1], sys.argv[2], sys.argv[3:]
cells = []
for f in files:
    im = Image.open(f).convert("RGBA")
    if box.startswith("head"):
        w, h = [int(v) for v in box.split(":")[1].split(",")]
        a = np.array(im)[..., 3] > 128
        cols = np.nonzero(a.any(0))[0]; x0 = int(cols[0])
        rows = np.nonzero(a[:, x0:x0 + w].any(1))[0]; yc = int(rows.mean())
        b = (max(0, x0 - 10), max(0, yc - h // 2), max(0, x0 - 10) + w, max(0, yc - h // 2) + h)
    else:
        x, y, w, h = [int(v) for v in box.split(",")]; b = (x, y, x + w, y + h)
    c = im.crop(b); bg = Image.new("RGBA", c.size, (110, 110, 118, 255)); bg.alpha_composite(c)
    cells.append((f.split("/")[-1] + f" {b}", bg.convert("RGB")))
W = sum(c.width for _, c in cells) + 10 * len(cells); H = max(c.height for _, c in cells) + 18
s = Image.new("RGB", (W, H), (30, 30, 34)); d = ImageDraw.Draw(s); x = 0
for n, c in cells:
    s.paste(c, (x, 18)); d.text((x + 3, 3), n, fill=(240, 220, 150)); x += c.width + 10
s.save(out, quality=92)
