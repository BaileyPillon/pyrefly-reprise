"""Independent judge sheet for Ormi round 3 (one-off, not part of tools/gen).

Row 1: the five installed files whole (idle, attack, cast, hurt, ko), same pixel
scale as the engine uses (one px-per-unit for the subject), on grey.
Rows 2-3: native 1:1 crops: head band, then shield/costume band, per state.
Writes judge-sheet.jpg (q85). Run from the repo root.
"""
from PIL import Image, ImageDraw

ART = "public/art/characters/ormi/"
OUT = "docs/concepts/chapters/leblanc/sets/ormi/round3/judge-sheet.jpg"
STATES = ["idle", "attack", "cast", "hurt", "ko"]
HEAD = {"idle": (150, 0, 489, 330), "attack": (560, 0, 995, 330),
        "cast": (180, 0, 560, 330), "hurt": (480, 0, 809, 330), "ko": (100, 0, 500, 380)}
BODY = {"idle": (0, 150, 489, 1000), "attack": (0, 60, 700, 700),
        "cast": (0, 200, 720, 850), "hurt": (0, 100, 809, 900), "ko": (50, 40, 1000, 700)}
GREY = (200, 200, 200, 255)


def flat(name):
    im = Image.open(ART + name + ".png").convert("RGBA")
    bg = Image.new("RGBA", im.size, GREY)
    bg.alpha_composite(im)
    return bg.convert("RGB")


def row(ims, h, gap=10):
    ims = [i.resize((max(1, int(i.width * h / i.height)), h)) for i in ims]
    w = sum(i.width for i in ims) + gap * (len(ims) - 1)
    r = Image.new("RGB", (w, h), "white")
    x = 0
    for i in ims:
        r.paste(i, (x, 0))
        x += i.width + gap
    return r


full = {s: flat(s) for s in STATES}
# Row 1 keeps one px scale for the subject: scale every file by the same factor.
k = 520 / 1189
r1 = [full[s].resize((int(full[s].width * k), int(full[s].height * k))) for s in STATES]
W1 = sum(i.width for i in r1) + 10 * 4
row1 = Image.new("RGB", (W1, max(i.height for i in r1)), "white")
x = 0
for i in r1:
    row1.paste(i, (x, row1.height - i.height))
    x += i.width + 10
row2 = row([full[s].crop(HEAD[s]) for s in STATES], 330)   # 1:1 (crops are 330-380 tall)
row3 = row([full[s].crop(BODY[s]) for s in STATES], 520)
W = max(row1.width, row2.width, row3.width)
sheet = Image.new("RGB", (W, row1.height + row2.height + row3.height + 60), "white")
y = 0
for r in (row1, row2, row3):
    sheet.paste(r, (0, y))
    y += r.height + 30
ImageDraw.Draw(sheet).text((8, 8), "idle | attack | cast | hurt | ko  (row 1 same px scale; rows 2-3 native crops, row 3 reduced)", fill=(0, 0, 0))
sheet.save(OUT, quality=85)
print(OUT, sheet.size)
