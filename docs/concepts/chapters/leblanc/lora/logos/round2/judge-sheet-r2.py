"""Independent judge sheet, Logos round 2 (python judge-sheet-r2.py).

Top row: the anchor, public/art/characters/logos/idle.png (the repaired idle), whole
(scaled) and native 1:1 crops of head, emblem, near hand and feet, plus the in-game idle.
Then one row per installed state: the whole cutout (scaled), native 1:1 crops (no
resampling) of every region the judge scored below 7 (and the fixes the round claimed),
and the painter's in-game screenshot of that state (ingame-after-<state>.png, same battle,
same camera as the idle's). Writes judge-sheet.jpg (q85).
"""
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[6]
ART = ROOT / "public/art/characters/logos"
OUT = HERE / "judge-sheet.jpg"
BG = (200, 200, 200)
H = 420
CROPS = {
    "idle": [("head/helmet (anchor)", (200, 0, 400, 200)), ("emblem: white radial disc, brass-rimmed lens", (200, 150, 400, 330)),
             ("near hand after the repair: grips", (150, 520, 300, 740)), ("wraps, open-toe slides", (100, 940, 450, 1150))],
    "attack": [("helmet, face", (260, 0, 470, 230)), ("marks 6: small grey lens-like disc; buckle, no brass lens", (290, 180, 560, 350)),
               ("weapon 6: lower gun snub barrel, pink glint", (0, 190, 300, 310)), ("outfit 6: front knot + lilac tail", (280, 380, 560, 720)),
               ("feet: thongs, black floor pad", (90, 780, 790, 1111))],
    "cast": [("helmet, smirk (8)", (120, 30, 290, 200)), ("emblem (7)", (100, 200, 300, 360)),
             ("raised revolver (7)", (0, 0, 120, 190)), ("low hand now grips (7)", (100, 530, 260, 730))],
    "hurt": [("helmet 6: dome shaded near black; face 7: wince", (450, 0, 643, 180)), ("emblem after the paste (7)", (370, 150, 560, 310)),
             ("outfit 6: lilac sash tail at the front", (130, 280, 360, 560)), ("far hand, glove (7)", (0, 120, 250, 240))],
    "ko": [("helmet 5: slatted crown panel, black side lens", (90, 10, 300, 220)), ("marks (7)", (280, 60, 520, 240)),
           ("weapon 6: one revolver only", (0, 230, 220, 327)), ("anatomy 5: one foot, short legs; hard shadow", (520, 40, 1106, 327))],
}


def flat(state):
    im = Image.open(ART / f"{state}.png").convert("RGBA")
    bg = Image.new("RGBA", im.size, BG + (255,))
    bg.alpha_composite(im)
    return bg.convert("RGB")


rows = []
for state, crops in CROPS.items():
    im = flat(state)
    if im.width > im.height:
        whole = im.resize((560, round(im.height * 560 / im.width)), Image.LANCZOS)
    else:
        whole = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    tiles = [(f"{state} whole (scaled)", whole)] + [(lab, im.crop(box)) for lab, box in crops]
    ig = HERE / f"ingame-after-{state}.png"
    tiles.append((f"in battle (after, native)", Image.open(ig).convert("RGB")))
    w = sum(max(t.width, 6 * len(lab)) for lab, t in tiles) + 12 * (len(tiles) + 1)
    h = max(t.height for _, t in tiles) + 34
    row = Image.new("RGB", (w, h), (236, 232, 226))
    d = ImageDraw.Draw(row)
    x = 12
    for lab, t in tiles:
        d.text((x, 6), lab, fill=(30, 30, 30))
        row.paste(t, (x, 24))
        x += max(t.width, 6 * len(lab)) + 12
    rows.append(row)

W = max(r.width for r in rows)
sheet = Image.new("RGB", (W, sum(r.height for r in rows)), (236, 232, 226))
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height
sheet.save(OUT, quality=85)
print(OUT, sheet.size, OUT.stat().st_size)
