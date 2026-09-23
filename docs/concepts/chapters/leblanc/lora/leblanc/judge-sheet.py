"""Independent judge sheet for the Leblanc LoRA + OpenPose poses (python judge-sheet.py).

Top row: the anchor, public/art/characters/leblanc/idle.png, whole (scaled) and native
1:1 crops of head, fan and feet. Then one row per installed state: the whole cutout
(scaled) and native 1:1 crops (no resampling) of every region the judge scored below 7.
Writes judge-sheet.jpg (q85).
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[6]
ART = ROOT / "public/art/characters/leblanc"
OUT = Path(__file__).with_name("judge-sheet.jpg")
BG = (200, 200, 200)
H = 420
CROPS = {
    "idle": [("head, choker, heart (anchor)", (220, 0, 520, 330)), ("fan: black, closed", (330, 130, 530, 270)),
             ("open-toe lavender boot", (270, 880, 440, 1118))],
    "attack": [("head, heart, fan leading", (0, 170, 480, 420)), ("robe flares into wing lobes", (440, 0, 832, 320)),
               ("folded leg: no shin, boot reversed", (300, 480, 640, 700)), ("closed-toe boot", (690, 730, 832, 983))],
    "cast": [("open fan: lavender leaf (unsourced)", (180, 0, 480, 220)),
             ("black patch under the jaw, plain choker, notched heart", (250, 180, 450, 380)), ("boots (match)", (150, 1000, 420, 1186))],
    "hurt": [("wince: one eye shut, teeth", (380, 20, 600, 240)), ("fan (match)", (470, 330, 715, 450)),
             ("far leg missing: empty under the hem", (0, 860, 715, 1166))],
    "ko": [("eyes shut; white cheek smear, orange mouth nick", (90, 100, 300, 260)), ("fan: tan guard", (60, 250, 300, 340)),
           ("closed-toe boots; painted ground shadow", (850, 190, 1216, 400))],
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
