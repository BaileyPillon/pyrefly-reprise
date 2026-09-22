"""Independent judge sheet for Logos round 3 (build: python judge-sheet.py).

One row per installed state: the whole cutout (scaled to 520 px tall) and then
native 1:1 crops of the regions the judge scored (no resampling in the crops).
Reads public/art/characters/logos/<state>.png; writes judge-sheet.jpg (q85).
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[7]
ART = ROOT / "public/art/characters/logos"
OUT = Path(__file__).with_name("judge-sheet.jpg")
BG = (200, 200, 200)
H = 520
CROPS = {
    "idle": [("head/helmet", (180, 0, 420, 200)), ("hands: gun hanging off a finger, stub in fist", (0, 420, 300, 760)),
             ("shoulder emblem", (200, 180, 460, 340)), ("feet: pale foot, tan shin", (100, 900, 450, 1150))],
    "attack": [("head/helmet", (150, 0, 560, 300)), ("near shoulder: claw guard, no emblem", (480, 150, 800, 450)),
               ("right edge: coat cut by the frame", (780, 350, 1024, 950))],
    "cast": [("head/helmet", (60, 0, 360, 240)), ("emblem", (200, 230, 330, 350)), ("feet: strap shoes", (100, 900, 420, 1132))],
    "hurt": [("head/helmet", (400, 0, 706, 280)), ("far gun, no hand", (230, 340, 460, 470)), ("feet", (100, 700, 500, 980))],
    "ko": [("head/helmet", (90, 230, 360, 560)), ("strap, emblem", (170, 120, 620, 330)),
           ("guns", (560, 320, 1160, 667)), ("wraps", (900, 20, 1194, 280))],
}


def flat(state):
    im = Image.open(ART / f"{state}.png").convert("RGBA")
    bg = Image.new("RGBA", im.size, BG + (255,))
    bg.alpha_composite(im)
    return bg.convert("RGB")


rows = []
for state, crops in CROPS.items():
    im = flat(state)
    whole = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    tiles = [(f"{state} installed (scaled)", whole)] + [(lab, im.crop(box)) for lab, box in crops]
    w = sum(t.width for _, t in tiles) + 12 * (len(tiles) + 1)
    h = max(t.height for _, t in tiles) + 34
    row = Image.new("RGB", (w, h), (236, 232, 226))
    d = ImageDraw.Draw(row)
    x = 12
    for lab, t in tiles:
        d.text((x, 6), lab, fill=(30, 30, 30))
        row.paste(t, (x, 24))
        x += t.width + 12
    rows.append(row)

W = max(r.width for r in rows)
sheet = Image.new("RGB", (W, sum(r.height for r in rows)), (236, 232, 226))
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height
sheet.save(OUT, quality=85)
print(OUT, sheet.size)
