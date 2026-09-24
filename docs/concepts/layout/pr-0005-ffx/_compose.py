from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(__file__)

INK = (11, 10, 18)
PAPER = (244, 241, 232)
GOLD = (227, 185, 74)
GOLD_ON_PAPER = (184, 134, 42)
DIM = (170, 165, 178)
GREEN = (40, 110, 66)

W, H = 1600, 900
canvas = Image.new("RGB", (W, H), INK)
draw = ImageDraw.Draw(canvas)

FONT_DIR = "C:/Windows/Fonts/"
serif_italic_big = ImageFont.truetype(FONT_DIR + "georgiaz.ttf", 40)
serif_italic_lbl = ImageFont.truetype(FONT_DIR + "georgiai.ttf", 24)
sans_bold_chip = ImageFont.truetype(FONT_DIR + "arialbd.ttf", 20)
sans_q = ImageFont.truetype(FONT_DIR + "arial.ttf", 19)
sans_cap = ImageFont.truetype(FONT_DIR + "arial.ttf", 16)
sans_cap_b = ImageFont.truetype(FONT_DIR + "arialbd.ttf", 16)
sans_tiny = ImageFont.truetype(FONT_DIR + "arialbd.ttf", 13)

# ---- header -----------------------------------------------------------
MX = 40
draw.text((MX, 20), "PR-0005 \u2014 FFX Turn Cut-in vs. Command Menu", font=serif_italic_big, fill=GOLD)
q = ("Since db7b832 the menu takes keys while the Turn cut-in slab plays \u2014 but in FFX the slab "
     "covers the bottom-left command menu for about 0.76s. Which fix?")
draw.text((MX, 68), q, font=sans_q, fill=PAPER)
draw.line([(MX, 96), (W - MX, 96)], fill=GOLD, width=2)

# ---- grid ---------------------------------------------------------------
GRID_TOP = 112
GRID_BOTTOM = H - 14
GAP = 18
COL_W = (W - 2 * MX - GAP) // 2
ROW_H = (GRID_BOTTOM - GRID_TOP - GAP) // 2

options = [
    dict(
        key="A", file="a-band.png", title="Slab above the menu", recommended=False,
        line1="Slab confined to a band above y\u2248465 (@1440); the command menu is clear at all times.",
        line2="Cost: the approved 620\u00d7880 portrait plays 43% shorter than the approved art.",
    ),
    dict(
        key="B", file="b-under.png", title="Slab under the menu", recommended=True,
        line1="Same full 620\u00d7880 slab, unchanged art; the live command cascade is drawn in a layer above it.",
        line2="Cost: one stacking-order fix in the HUD port; no art, timing, or scope change.",
    ),
    dict(
        key="C", file="c-short.png", title="Shorter slab, 0.4s", recommended=False,
        line1="Same footprint and z-order as today; CUT_IN_HOLD_MS drops from ~0.76s to 0.4s.",
        line2="Cost: still blocks the menu for the first 0.4s of every first turn, every time.",
    ),
    dict(
        key="D", file="d-firstturn.png", title="First turn only", recommended=False,
        line1="Already shipped (TurnCutIn.ts): plays once per member per battle, not a new fix.",
        line2="Cost: doesn't touch the 0.76s cover on the turn it does play \u2014 needs A, B or C too.",
    ),
]

for i, opt in enumerate(options):
    col = i % 2
    row = i // 2
    cx = MX + col * (COL_W + GAP)
    cy = GRID_TOP + row * (ROW_H + GAP)

    # label chip + title
    chip_w = 34
    draw.rectangle([cx, cy, cx + chip_w, cy + 30], fill=INK, outline=GOLD, width=2)
    draw.text((cx + 10, cy + 4), opt["key"], font=sans_bold_chip, fill=GOLD)
    draw.text((cx + chip_w + 12, cy + 4), opt["title"], font=serif_italic_lbl, fill=PAPER)
    if opt["recommended"]:
        rec_w = 158
        rx = cx + COL_W - rec_w
        draw.rectangle([rx, cy + 2, rx + rec_w, cy + 27], fill=GOLD)
        draw.text((rx + 10, cy + 5), "RECOMMENDED", font=sans_tiny, fill=INK)

    # image
    img_top = cy + 38
    img_h = 258
    img_w = int(img_h * 16 / 9)
    img_path = os.path.join(BASE, opt["file"])
    im = Image.open(img_path).convert("RGB").resize((img_w, img_h), Image.LANCZOS)
    img_x = cx + (COL_W - img_w) // 2
    canvas.paste(im, (img_x, img_top))
    draw.rectangle([img_x, img_top, img_x + img_w, img_top + img_h], outline=GOLD, width=2)

    # captions
    cap_top = img_top + img_h + 10
    draw.text((cx, cap_top), opt["line1"], font=sans_cap, fill=PAPER)
    draw.text((cx, cap_top + 22), opt["line2"], font=sans_cap, fill=DIM)

out_path = os.path.join(BASE, "sheet.png")
canvas.save(out_path)
print("wrote", out_path, canvas.size)
