# Ormi round 3 sheet (FFX-2 only).
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/leblanc/sets/ormi/round3/build-sheet.py
# One row per state: idle whole (left, for comparison), the INSTALLED file
# whole (both at 560 px tall), then a 1:1 face crop and a 1:1 costume/shield
# crop at native pixels. Writes sheet.jpg (JPEG q85).
import pathlib
from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[6]
ART = ROOT / "public/art/characters/ormi"
H = 560
BG = (232, 232, 236)

# Boxes in each installed PNG's own pixels (judged, then drawn here).
ROWS = [
    ("idle (anchor, unchanged)", "idle", (170, 20, 390, 240), (0, 160, 489, 820)),
    ("attack  940001 + heart 950002", "attack", (590, 20, 880, 300), (0, 60, 900, 620)),
    ("cast  940105", "cast", (170, 20, 440, 290), (0, 150, 700, 900)),
    ("hurt  940204", "hurt", (510, 0, 800, 230), (0, 50, 780, 760)),
    ("ko  940302 + heart 950304", "ko", (140, 10, 430, 300), (40, 60, 1000, 700)),
]

try:
    FONT = ImageFont.truetype("arial.ttf", 22)
except OSError:
    FONT = ImageFont.load_default()


def flat(im):
    bg = Image.new("RGB", im.size, BG)
    bg.paste(im, mask=im.split()[-1])
    return bg


def whole(im):
    s = H / im.height
    if im.width * s > 900:
        s = 900 / im.width
    return flat(im).resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)


idle = Image.open(ART / "idle.png").convert("RGBA")
rows = []
for label, name, face, cos in ROWS:
    im = Image.open(ART / f"{name}.png").convert("RGBA")
    parts = [whole(idle), whole(im), flat(im.crop(face)), flat(im.crop(cos))]
    h = max(p.height for p in parts) + 36
    w = sum(p.width for p in parts) + 20 * (len(parts) + 1)
    row = Image.new("RGB", (w, h), (255, 255, 255))
    d = ImageDraw.Draw(row)
    d.text((20, 6), f"{label}   |   idle  |  installed whole  |  1:1 face  |  1:1 costume / shield", fill=(20, 20, 20), font=FONT)
    x = 20
    for p in parts:
        row.paste(p, (x, 36))
        x += p.width + 20
    rows.append(row)

W = max(r.width for r in rows)
sheet = Image.new("RGB", (W, sum(r.height for r in rows) + 10 * len(rows)), (255, 255, 255))
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height + 10
sheet.save(HERE / "sheet.jpg", quality=85)
print("sheet.jpg", sheet.size)
