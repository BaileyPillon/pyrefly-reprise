"""Film set: phone-readable sheets. Each sheet is a grid of cut-outs (or full renders) on the dark reactor grey, a
label under each tile, a title bar; JPEG, width 1080, quality stepped down until the file is under 1 MB.
Cut-outs in one sheet share ONE scale (they were resampled to their idle's scale), so relative size reads true.
Usage: python sheet.py <manifest.json>
  manifest = {out, title, note, cols, tileH, items:[{path, label, sub?}], sameScale: true|false}"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

man = json.load(open(sys.argv[1], encoding='utf8'))
W, cols = 1080, man.get('cols', 3)
pad, gap = 16, 10
tw = (W - 2 * pad - (cols - 1) * gap) // cols
th = man.get('tileH', 520)


def font(sz):
    for f in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


F1, F2, F3 = font(34), font(22), font(19)
ims = [Image.open(it['path']).convert('RGBA') for it in man['items']]
if man.get('sameScale', True):
    k = min(min(tw / i.width, (th - 8) / i.height) for i in ims)
    ks = [k] * len(ims)
else:
    ks = [min(tw / i.width, (th - 8) / i.height) for i in ims]
rows = (len(ims) + cols - 1) // cols
lab_h = 62
head = 110 + (34 if man.get('note') else 0)
H = head + rows * (th + lab_h + gap) + pad
sheet = Image.new('RGB', (W, H), (16, 18, 22))
d = ImageDraw.Draw(sheet)
d.text((pad, 18), man['title'], font=F1, fill=(236, 214, 150))
d.text((pad, 64), man.get('sub', 'FF7 only: the hidden Guard Scorpion fight. Original art, our own renders only; nothing mirrored.'), font=F3, fill=(170, 176, 186))
if man.get('note'):
    d.text((pad, 94), man['note'], font=F3, fill=(170, 176, 186))
for n, (it, im, k) in enumerate(zip(man['items'], ims, ks)):
    r, c = divmod(n, cols)
    x, y = pad + c * (tw + gap), head + r * (th + lab_h + gap)
    tile = Image.new('RGBA', (tw, th), (38, 42, 47, 255))
    s = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
    tile.alpha_composite(s, ((tw - s.width) // 2, th - s.height - 4))
    sheet.paste(tile.convert('RGB'), (x, y))
    if it.get('pick'):
        d.rectangle([x - 2, y - 2, x + tw + 1, y + th + 1], outline=(236, 196, 90), width=3)
    d.text((x + 2, y + th + 4), it['label'], font=F2, fill=(236, 236, 236))
    if it.get('sub'):
        d.text((x + 2, y + th + 32), it['sub'], font=F3, fill=(160, 166, 176))
q = 90
while True:
    sheet.save(man['out'], quality=q, optimize=True)
    if os.path.getsize(man['out']) < 1_000_000 or q <= 50:
        break
    q -= 5
print(man['out'], sheet.size, os.path.getsize(man['out']), 'q', q)
