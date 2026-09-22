"""redo/sheet.jpg: one row per Evrae item. Columns: the picked concept (identity anchor),
the 2026-09-21 install it replaces, the new CANDIDATE whole, then two 1:1 native-pixel
crops of the new file (head/detail, body/detail). Cutouts sit on mid-grey so white holes
and fringes show. JPEG q85."""
from PIL import Image, ImageDraw
BK = "D:/Tools/pyrefly-art-backup/candidates/2026-09-22-evrae-redo/before"
NEW = "../../../../../public/art"
CONCEPT = "../renders/evrae-b.png"
CW, CH = 330, 300
rows = [
  ("idle-near", f"{BK}/characters/evrae/idle-near.png", f"{NEW}/characters/evrae/idle-near.png", (80, 10), (450, 250)),
  ("idle-far", f"{BK}/characters/evrae/idle-far.png", f"{NEW}/characters/evrae/idle-far.png", (0, 0), (600, 170)),
  ("breath-charge", f"{BK}/characters/evrae/breath-charge.png", f"{NEW}/characters/evrae/breath-charge.png", (110, 10), (450, 250)),
  ("hurt", f"{BK}/characters/evrae/hurt.png", f"{NEW}/characters/evrae/hurt.png", (100, 0), (420, 300)),
  ("ko", f"{BK}/characters/evrae/ko.png", f"{NEW}/characters/evrae/ko.png", (40, 400), (200, 100)),
  ("chapter card", f"{BK}/pause/evrae-chapter-card.png", f"{NEW}/pause/evrae-chapter-card.png", (560, 50), (0, 460)),
]
def on_grey(im):
    im = im.convert("RGBA"); bg = Image.new("RGBA", im.size, (110, 110, 118, 255)); bg.alpha_composite(im); return bg.convert("RGB")
def fit(im):
    im = on_grey(im); s = min(CW / im.width, CH / im.height)
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    c = Image.new("RGB", (CW, CH), (40, 40, 46)); c.paste(im, ((CW - im.width) // 2, (CH - im.height) // 2)); return c
def crop(im, xy):
    x, y = xy; return on_grey(im.crop((x, y, x + CW, y + CH)))
LW = 120; HDR = 24
sheet = Image.new("RGB", (LW + 5 * (CW + 8), HDR + len(rows) * (CH + 22)), (24, 24, 28))
d = ImageDraw.Draw(sheet)
for i, t in enumerate(["picked concept B (anchor)", "2026-09-21 install (replaced)", "NEW candidate, whole", "NEW 1:1 native crop A", "NEW 1:1 native crop B"]):
    d.text((LW + i * (CW + 8) + 4, 6), t, fill=(240, 220, 150))
concept = Image.open(CONCEPT)
for r, (name, old, new, a, b) in enumerate(rows):
    y = HDR + r * (CH + 22)
    d.text((6, y + 8), name, fill=(240, 240, 240)); d.text((6, y + 24), "CANDIDATE", fill=(230, 120, 90))
    n = Image.open(new)
    cells = [fit(concept) if name != "chapter card" else Image.new("RGB", (CW, CH), (40, 40, 46)),
             fit(Image.open(old)), fit(n), crop(n, a), crop(n, b)]
    for c_, cell in enumerate(cells):
        sheet.paste(cell, (LW + c_ * (CW + 8), y + 18))
    d.text((LW + 3 * (CW + 8) + 4, y + 4), f"{a}", fill=(150, 150, 160)); d.text((LW + 4 * (CW + 8) + 4, y + 4), f"{b}", fill=(150, 150, 160))
sheet.save("sheet.jpg", quality=85)
print(sheet.size)
