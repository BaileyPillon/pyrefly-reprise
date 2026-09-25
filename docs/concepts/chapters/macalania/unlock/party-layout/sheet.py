# Composites the party-layout option sheet from the real captures in this folder.
#   python docs/concepts/chapters/macalania/unlock/party-layout/sheet.py
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
ROWS = [
    ("current", "CURRENT (as built): the Chapter I arc from before D-041"),
    ("a", "A: party re-laid right of the stack, fiends where the solver puts them"),
    ("b", "B (recommended): A's arc, fiends pinned one step right and back"),
    ("c", "C: Chapter I's approved D-041 arc, copied as is"),
]
COLS = [("1600x900", 760), ("2000x1012", 760), ("390x844", 200)]
PAD, HEAD = 16, 64
try:
    FONT = ImageFont.truetype("arialbd.ttf", 22)
    SMALL = ImageFont.truetype("arial.ttf", 17)
except OSError:
    FONT = SMALL = ImageFont.load_default()

data = {s: {r["name"]: r["m"] for r in json.loads((HERE / f"data-{s}.json").read_text())} for s, _ in COLS}


def line(name: str) -> str:
    parts = []
    for size in ("1600x900", "390x844"):
        m = data[size][name]
        who = " ".join(
            f"{k.capitalize()} {m[k]['headTorsoUnderRows']}%" for k in ("tidus", "yuna", "rikku")
        )
        off = [k for k, v in m.items() if not v["inView"]]
        tail = f", not whole in frame: {', '.join(off)}" if off else ""
        parts.append(f"{size}: head+torso under rows {who}{tail}")
    return "   |   ".join(parts)


tiles = {}
for name, _ in ROWS:
    for size, w in COLS:
        im = Image.open(HERE / f"{name}-{size}.jpg").convert("RGB")
        h = round(im.height * w / im.width)
        tiles[(name, size)] = im.resize((w, h), Image.LANCZOS)
row_h = max(t.height for t in tiles.values())
W = PAD + sum(w + PAD for _, w in COLS)
H = PAD + len(ROWS) * (HEAD + row_h + PAD)
sheet = Image.new("RGB", (W, H), (14, 16, 24))
d = ImageDraw.Draw(sheet)
y = PAD
for name, title in ROWS:
    d.text((PAD, y), title, fill=(236, 200, 110), font=FONT)
    d.text((PAD, y + 30), line(name), fill=(220, 224, 232), font=SMALL)
    x = PAD
    for size, w in COLS:
        sheet.paste(tiles[(name, size)], (x, y + HEAD))
        x += w + PAD
    y += HEAD + row_h + PAD
sheet.save(HERE / "sheet.jpg", quality=86)
print("sheet.jpg", sheet.size)
