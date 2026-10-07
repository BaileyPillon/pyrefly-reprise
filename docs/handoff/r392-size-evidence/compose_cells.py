"""Compose battle-size cells of transition strips (continuity harness, probe ring at 1.0) into a before/after picture.
    python compose_cells.py <out.jpg> <title> "<label>|<strip.jpg>|<cells e.g. 3,5,6,8>" ["<label>|<strip.jpg>|<cells>" ...]
A strip is 12 cells of the figure cropped out of consecutive frames, a 24 px title bar above and a 16 px caption bar below, 2 px between cells (critic/runner/lib/continuity-strips.mjs);
the swap's cell is the 7th (index 6), frames -6 .. -1, swap, +1 .. +5. Every cell is shown as it is, 1:1 with the 1600x900 battle, with the harness's own guides (green = the head,
orange = the feet, both from the frame before the swap) and crosses (where the head and the feet were measured to be in that frame). One row per strip, one tile per chosen cell."""
import sys
from PIL import Image, ImageDraw, ImageFont

out, title = sys.argv[1], sys.argv[2]
rows = [a.split("|") for a in sys.argv[3:]]
font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 22)
small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 17)
HEAD, FOOT, GAP = 24, 16, 2
tiles = []
for label, path, cells in rows:
    im = Image.open(path).convert("RGB")
    W, H = im.size
    cellH = H - HEAD - FOOT
    # 12 cells, 11 gaps of 2 px
    cellW = (W - 11 * GAP) // 12
    picks = [int(c) for c in cells.split(",")]
    row = []
    for i in picks:
        x0 = i * (cellW + GAP)
        row.append((im.crop((x0, HEAD, x0 + cellW, HEAD + cellH)), i - 6))
    title_bar = im.crop((0, 0, min(W, 1700), HEAD))
    tiles.append((label, row, title_bar))
cw = max(t.size[0] for _, row, _ in tiles for t, _ in row)
ch = max(t.size[1] for _, row, _ in tiles for t, _ in row)
n = max(len(row) for _, row, _ in tiles)
pad = 6
W = n * (cw + pad) + pad
H = 40 + sum(30 + HEAD + ch + pad for _ in tiles)
sheet = Image.new("RGB", (W, H), (20, 20, 24))
d = ImageDraw.Draw(sheet)
d.text((pad, 8), title, fill=(255, 230, 120), font=font)
y = 40
for label, row, title_bar in tiles:
    d.text((pad, y + 4), label, fill=(255, 255, 255), font=font)
    y += 30
    sheet.paste(title_bar, (pad, y))
    y += HEAD
    for j, (t, off) in enumerate(row):
        x = pad + j * (cw + pad)
        sheet.paste(t, (x, y))
        cap = "swap" if off == 0 else (f"+{off}" if off > 0 else str(off))
        d.rectangle([x, y, x + 70, y + 22], fill=(0, 0, 0))
        d.text((x + 4, y + 2), cap, fill=(255, 107, 107) if off == 0 else (220, 220, 220), font=small)
        if off == 0:
            d.rectangle([x, y, x + t.size[0] - 1, y + t.size[1] - 1], outline=(255, 45, 45), width=3)
    y += ch + pad
sheet.save(out, quality=88)
print(out, sheet.size)
