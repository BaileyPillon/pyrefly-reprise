"""PR-0096 sheet (FFX-2 only): installed idle | candidate red | candidate magenta | pick B, at 1:1,
a 2x row of the fan, and (if given) the real 1600x900 Chapter VI frame with its 1:1 Leblanc crop.

  python sheet.py <out.jpg> <candidate-dir> [<x0,y0,x1,y1> <ingame-red.png> [<ingame-magenta.png>]]
"""
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

REPO = pathlib.Path(__file__).resolve().parents[5]
out, cdir = sys.argv[1], pathlib.Path(sys.argv[2])
cols = [
    ("Installed idle (fan shut)", REPO / "public/art/characters/leblanc/idle.png"),
    ("Candidate: red leaf (D-036)", cdir / "idle.fan-open.red.png"),
    ("Candidate: warm magenta leaf", cdir / "idle.fan-open.magenta.png"),
    ("Pick B (concept, fan fully open)", REPO / "docs/concepts/chapters/leblanc/renders/leblanc-b.png"),
]
BG, INK, GOLD = (34, 30, 40), (236, 230, 220), (214, 178, 96)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 22)
    small = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 17)
except OSError:
    font = small = ImageFont.load_default()


def flat(p, box=None, scale=1):
    im = Image.open(p).convert("RGBA")
    if box:
        im = im.crop(box)
    if scale != 1:
        im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
    bg = Image.new("RGBA", im.size, (118, 112, 128, 255))
    bg.alpha_composite(im)
    return bg.convert("RGB")


full = [flat(p) for _, p in cols]
FAN = (300, 30, 591, 250)
zoom = [flat(p, FAN, 2) for _, p in cols[:3]]
W = max(sum(i.width for i in full) + 50 * 5, sum(z.width for z in zoom) + 50 * 4)
H = 70 + max(i.height for i in full) + 70 + zoom[0].height + 40
games = []
if len(sys.argv) > 4:
    box = tuple(int(v) for v in sys.argv[3].split(","))
    games = [Image.open(p).convert("RGB") for p in sys.argv[4:]]
    crops = [g.crop(box) for g in games]
    zc = [c.resize((c.width * 3, c.height * 3), Image.NEAREST) for c in crops]
    H += 70 + games[0].height + 40
    W = max(W, games[0].width + sum(z.width + 30 for z in zc) + 100)
sheet = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(sheet)
d.text((50, 18), "PR-0096 Leblanc idle, fan open (FFX-2 only, Chapter VI) - candidates, not installed", font=font, fill=GOLD)
x, y = 50, 70
for (label, _), im in zip(cols, full):
    d.text((x, y - 28), label, font=small, fill=INK)
    sheet.paste(im, (x, y))
    x += im.width + 50
y += max(i.height for i in full) + 70
d.text((50, y - 32), "The fan at 2x (idle pixels unchanged outside the new leaf: MAD 0, 124 matte px)", font=small, fill=INK)
x = 50
for im in zoom:
    sheet.paste(im, (x, y))
    x += im.width + 50
y += zoom[0].height + 40
if games:
    d.text((50, y + 38), "Real Chapter VI frame, 1600x900, link 3 command menu, real keys from the title, candidate by request interception (red shown); right: Leblanc at 3x, red then magenta", font=small, fill=INK)
    y += 70
    sheet.paste(games[0], (50, y))
    d.rectangle([50 + box[0], y + box[1], 50 + box[2], y + box[3]], outline=GOLD, width=2)
    x = 50 + games[0].width + 50
    for z in zc:
        sheet.paste(z, (x, y))
        x += z.width + 30
sheet.save(out, quality=88)
print(out, sheet.size)
