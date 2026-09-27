"""Contact sheet: python sheet.py <out.jpg> <title> <cellH> <path=label> ... (rows wrap at 2000 px wide).
Cut-outs (RGBA) are shown on the dark reactor grey so any halo shows. Output kept under 1 MB and
at most 2000 px tall (quality steps down until it fits)."""
import io, sys
from PIL import Image, ImageDraw, ImageFont

out, title, ch = sys.argv[1], sys.argv[2], int(sys.argv[3])
items = [a.split('=', 1) for a in sys.argv[4:]]
try:
    font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
    tfont = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)
except OSError:
    font = tfont = ImageFont.load_default()
cells = []
for p, label in items:
    im = Image.open(p)
    im = im.resize((max(1, round(im.width * ch / im.height)), ch), Image.LANCZOS)
    bg = Image.new('RGB', im.size, (22, 26, 28))
    if im.mode == 'RGBA':
        bg.paste(im, (0, 0), im)
    else:
        bg = im.convert('RGB')
    cells.append((bg, label))
rows, row, x = [], [], 0
for c in cells:
    if row and x + c[0].width > 2000:
        rows.append(row); row, x = [], 0
    row.append(c); x += c[0].width + 8
rows.append(row)
W = min(2000, max(sum(c[0].width + 8 for c in r) for r in rows))
H = 44 + len(rows) * (ch + 34)
sheet = Image.new('RGB', (W, H), (12, 14, 16))
d = ImageDraw.Draw(sheet)
d.text((10, 8), title, fill=(240, 236, 224), font=tfont)
y = 44
for r in rows:
    x = 0
    for im, label in r:
        sheet.paste(im, (x, y))
        d.text((x + 4, y + ch + 4), label, fill=(210, 210, 200), font=font)
        x += im.width + 8
    y += ch + 34
if sheet.height > 2000:
    sheet = sheet.resize((round(sheet.width * 2000 / sheet.height), 2000), Image.LANCZOS)
for q in (88, 82, 76, 70, 62, 55):
    b = io.BytesIO(); sheet.save(b, 'JPEG', quality=q)
    if b.tell() < 1_000_000:
        break
open(out, 'wb').write(b.getvalue())
print(out, sheet.size, b.tell())
