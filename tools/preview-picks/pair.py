import sys, os
from PIL import Image, ImageDraw, ImageFont
# python pair.py <out.jpg> <live.jpg> <preview.jpg> [crop=x0,y0,x1,y1]   -> LIVE | PREVIEW side by side, 1600 px wide
out, live, prev = sys.argv[1:4]
crop = None
if len(sys.argv) > 4:
    crop = tuple(int(v) for v in sys.argv[4].split(','))
a = Image.open(live).convert('RGB')
b = Image.open(prev).convert('RGB')
if crop:
    a = a.crop(crop)
    b = b.crop(crop)
w = 800
h = int(a.height * w / a.width)
a = a.resize((w, h), Image.LANCZOS)
b = b.resize((w, h), Image.LANCZOS)
S = Image.new('RGB', (1600, h + 28), (12, 12, 16))
S.paste(a, (0, 28))
S.paste(b, (800, 28))
d = ImageDraw.Draw(S)
try:
    f = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 18)
except Exception:
    f = None
d.text((10, 4), 'LIVE (installed art, same build)', fill=(255, 190, 120), font=f)
d.text((810, 4), 'PREVIEW (recommended picks, not installed)', fill=(140, 230, 255), font=f)
os.makedirs(os.path.dirname(out), exist_ok=True)
S.save(out, quality=88)
print(out, S.size)
