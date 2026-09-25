# Oversoul Paragon options sheet: engine frames (1600x900, shown at 610x343), 1:1 engine crops of the boss, labels.
import sys
from PIL import Image, ImageDraw, ImageFont
fr, out = sys.argv[1], sys.argv[2]
names = [('base', 'Normal Paragon (installed candidate, for comparison)'), ('a', 'A  Blue cast only (engine shader term)'),
         ('b', 'B  Blue cast + blue rim + blue pyrefly motes (engine)'), ('c', 'C  Painted blue recolour (GPU, d 0.18) + rim + motes')]
try: F = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22); S = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
except Exception: F = S = ImageFont.load_default()
W, H, CH = 610, 343, 420
sheet = Image.new('RGB', (W * 4, 40 + H + 40 + CH + 120), (24, 26, 32)); d = ImageDraw.Draw(sheet)
for i, (k, lab) in enumerate(names):
    im = Image.open(f'{fr}/{k}-clean.png').convert('RGB')
    sheet.paste(im.resize((W, H), Image.LANCZOS), (i * W, 40)); d.text((i * W + 8, 8), lab, fill=(235, 235, 240), font=F)
    sheet.paste(im.crop((575, 115, 575 + W, 115 + CH)), (i * W, 40 + H + 40))
d.text((8, 40 + H + 8), 'Engine crops at 1:1 (the boss as the game draws it at 1600x900)', fill=(200, 205, 215), font=S)
y = 40 + H + 40 + CH + 10
lines = ['Source: FF Wiki "Oversoul (Final Fantasy X-2)" revid 4041089: an Oversouled fiend "absorbs pyreflies, acquiring a blue cast".',
         'Its screenshot (File:Oversoul FFX-2.jpg, revid 2493543) shows blue motes streaming into the fiends and an "Oversoul!" action caption.',
         "Nothing found describes Paragon's own Oversoul look. The name stays Paragon (wiki infobox, both forms). FFX-2 only (Chapter XIII).",
         'Recommendation: B. CANDIDATES only; nothing installed, nothing approved.']
for j, t in enumerate(lines): d.text((8, y + j * 26), t, fill=(215, 220, 230), font=S)
sheet.save(out, quality=88); print(sheet.size)
