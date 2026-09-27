"""Contact sheet: python sheet.py out.jpg title cellW cellH cols img1 [img2 ...]
Cutouts are laid on a mid-grey card so both light and dark edges show; captions are file stems.
Output is a JPEG, quality stepped down until it is under 1 MB."""
import sys, os
from PIL import Image, ImageDraw, ImageFont

out, title, cw, ch, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
paths = sys.argv[6:]
rows = (len(paths) + cols - 1) // cols
pad, cap, head = 12, 26, 44
W = cols * (cw + pad) + pad
H = head + rows * (ch + cap + pad) + pad
sheet = Image.new('RGB', (W, H), (38, 36, 44))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
    tfont = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 22)
except Exception:
    font = tfont = ImageFont.load_default()
d.text((pad, 10), title, fill=(236, 214, 150), font=tfont)
for i, p in enumerate(paths):
    r, c = divmod(i, cols)
    x = pad + c * (cw + pad)
    y = head + r * (ch + cap + pad)
    card = Image.new('RGB', (cw, ch), (128, 126, 132))
    im = Image.open(p).convert('RGBA')
    s = min(cw / im.width, ch / im.height)
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    card.paste(im, ((cw - im.width) // 2, (ch - im.height) // 2), im)
    sheet.paste(card, (x, y))
    stem = os.path.splitext(os.path.basename(p))[0]
    parent = os.path.basename(os.path.dirname(p))
    d.text((x + 4, y + ch + 2), f'{parent}/{stem}', fill=(220, 220, 225), font=font)
q = 90
while True:
    sheet.save(out, 'JPEG', quality=q, optimize=True)
    if os.path.getsize(out) < 1_000_000 or q <= 50:
        break
    q -= 6
print(out, sheet.size, os.path.getsize(out))
