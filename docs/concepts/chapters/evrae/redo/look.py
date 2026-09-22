"""Quick look sheet: each cutout on mid-grey (so white holes and fringes show), labelled.
usage: look.py out.jpg cellW file1 file2 ..."""
import sys
from PIL import Image, ImageDraw
out, cw, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
cells = []
for f in files:
    im = Image.open(f).convert("RGBA")
    s = cw / im.width
    im = im.resize((cw, max(1, int(im.height * s))), Image.LANCZOS)
    bg = Image.new("RGBA", im.size, (110, 110, 118, 255)); bg.alpha_composite(im)
    cells.append((f.split("/")[-1], bg))
cols = 2 if len(cells) > 1 else 1
rows = (len(cells) + cols - 1) // cols
ch = max(c[1].height for c in cells) + 20
sheet = Image.new("RGB", (cols * (cw + 10), rows * ch), (30, 30, 34))
d = ImageDraw.Draw(sheet)
for i, (n, c) in enumerate(cells):
    x, y = (i % cols) * (cw + 10), (i // cols) * ch
    sheet.paste(c.convert("RGB"), (x, y + 18)); d.text((x + 4, y + 3), n, fill=(240, 220, 150))
sheet.save(out, quality=88)
