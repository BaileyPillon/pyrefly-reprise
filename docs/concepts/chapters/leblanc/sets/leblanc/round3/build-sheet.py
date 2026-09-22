# Leblanc round 3 sheet (FFX-2 only) -> sheet.jpg (q85).
# One row per state: idle, then the INSTALLED attack / hurt / cast. Each row: the whole
# figure (scaled to 600 px tall, labelled), then 1:1 native crops of the face, the obi and
# the feet. Face centres were read off gridded cutouts (_grid-*.jpg), in cutout pixels.
import pathlib, sys
from PIL import Image, ImageDraw, ImageFont
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from crops import crops  # noqa: E402  (same crop rules the judging used)
ROOT = HERE.parents[6]
ART = ROOT / "public/art/characters/leblanc"
ROWS = [("idle", (330, 125), "idle (anchor, installed, unchanged)"),
        ("attack", (240, 110), "attack  <- round3 attack.22101  (CANDIDATE, self-judged 5)"),
        ("hurt", (250, 100), "hurt  <- round3 hurt.b.22303 + feet repaint f3  (CANDIDATE, 5)"),
        ("cast", (665, 110), "cast  <- round3 cast.b.22501  (CANDIDATE, 5)")]
F = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 22)
out_rows = []
for state, fc, label in ROWS:
    im = Image.open(ART / f"{state}.png").convert("RGBA")
    k = 600 / im.height
    whole = Image.new("RGBA", im.size, (150, 150, 160, 255)); whole.alpha_composite(im)
    whole = whole.resize((round(im.width * k), 600), Image.LANCZOS)
    cs = [whole] + crops(ART / f"{state}.png", fc)
    W = sum(c.width + 12 for c in cs); H = 640
    row = Image.new("RGB", (W, H), (40, 40, 48)); d = ImageDraw.Draw(row)
    d.text((8, 4), label + "   |   whole (scaled)  ·  face 1:1  ·  obi 1:1  ·  feet 1:1", fill=(240, 240, 240), font=F)
    x = 0
    for c in cs:
        row.paste(c.convert("RGB"), (x, 36)); x += c.width + 12
    out_rows.append(row)
W = max(r.width for r in out_rows); H = sum(r.height + 6 for r in out_rows)
sheet = Image.new("RGB", (W, H), (20, 20, 24)); y = 0
for r in out_rows:
    sheet.paste(r, (0, y)); y += r.height + 6
sheet.save(HERE / "sheet.jpg", quality=85); print(sheet.size)
