"""Independent judge sheet for the Logos LoRA + OpenPose poses (python judge-sheet.py).

Top row: the anchor, public/art/characters/logos/idle.png, whole (scaled) and native
1:1 crops of head, emblem, hands and feet. Then one row per installed state: the
whole cutout (scaled) and native 1:1 crops (no resampling) of every region the judge
scored below 7. Writes judge-sheet.jpg (q85).
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[6]
ART = ROOT / "public/art/characters/logos"
OUT = Path(__file__).with_name("judge-sheet.jpg")
BG = (200, 200, 200)
H = 420
CROPS = {
    "idle": [("head/helmet (anchor)", (180, 0, 420, 200)), ("emblem: white radial disc, brass ring", (200, 180, 420, 340)),
             ("hands (anchor defect: gun off a finger)", (0, 420, 300, 760)), ("wraps, sandals", (100, 940, 450, 1150))],
    "attack": [("head/helmet", (270, 0, 470, 160)), ("emblem: mesh grille, not radial", (330, 170, 500, 320)),
               ("two revolvers aimed", (0, 120, 260, 480))],
    "cast": [("head/helmet, raised revolver", (100, 0, 370, 220)), ("emblem", (180, 220, 380, 380)),
             ("low hand: gun off a finger, fist on a stub", (200, 560, 340, 780))],
    "hurt": [("face: hidden, blank, no wince", (390, 0, 570, 160)), ("emblem, black ring", (350, 140, 500, 280)),
             ("near hand: fingers over the frame", (20, 290, 280, 400)), ("far hand (gloved)", (480, 360, 640, 470))],
    "ko": [("helmet: glyph band; dark oval on cheek", (0, 0, 360, 240)), ("marks: ring on the sash", (220, 20, 520, 230)),
           ("gun 1", (0, 190, 300, 300)), ("gun 2", (660, 190, 940, 280))],
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
