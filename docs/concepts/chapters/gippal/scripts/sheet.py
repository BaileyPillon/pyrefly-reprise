# Phone-readable decision sheet (JPEG), one column. Every word on the sheet is drawn at 12.5 px or
# more when the whole sheet is shown 390 px wide (sizes are in units of W/390).
# Usage: phonesheet.py spec.json out.jpg
# spec: {width: 1200 (desktop frames) | 780 (one 390x844@2x phone mockup per row, full bleed),
#        title, question, rec?, note?, blocks: [
#          {head: text} | {text: text} |
#          {key?, cap, img, crop?: [x0,y0,x1,y1]}              one image, full width, caption above
#          {grid: [{key?, cap, img, crop?, bg?}], cols: n, h?}  small images, caption under each
#        ]}
import json, sys
from PIL import Image, ImageDraw, ImageFont

spec = json.load(open(sys.argv[1], encoding='utf-8')); out = sys.argv[2]
W = spec.get('width', 1200); u = W / 390.0
PHONE = W <= 800
PAD = round(12 * u) if PHONE else 40
INK = (11, 10, 18); PAPER = (244, 241, 232); GOLD = (227, 185, 74); DIM = (196, 190, 206); CELL = (36, 34, 48)
MIN_PX = 12.5

def font(px, bold=False):
    f = ImageFont.truetype('bahnschrift.ttf', round(px))
    try: f.set_variation_by_name('Bold' if bold else 'Regular')
    except Exception: pass
    return f
SIZES = {'title': 19, 'q': 13, 'cap': 13, 'key': 14, 'grid': 12.5, 'head': 14.5, 'stamp': 13}
F = {k: font(v * u, k in ('title', 'cap', 'key', 'head', 'stamp')) for k, v in SIZES.items()}
assert min(SIZES.values()) >= MIN_PX

def lh(f): return round(f.size * 1.25)
tmp = ImageDraw.Draw(Image.new('RGB', (10, 10)))
def wrap(text, f, width):
    lines = []
    for para in text.split('\n'):
        cur = ''
        for w in para.split():
            t = (cur + ' ' + w).strip()
            if tmp.textlength(t, font=f) <= width or not cur: cur = t
            else: lines.append(cur); cur = w
        lines.append(cur)
    return lines

def load(it, tw=None):
    im = Image.open(it['img']).convert('RGB')
    if it.get('crop'): im = im.crop(tuple(it['crop']))
    return im

TW = W - 2 * PAD
ops = []  # (height, draw(y))
def add_text(text, f, fill, bar=False, indent=0):
    ls = wrap(text, f, TW - indent)
    h = len(ls) * lh(f)
    def dr(d, sh, y):
        if bar: d.rectangle((PAD, y + 4, PAD + round(2.5 * u), y + h - 4), fill=GOLD)
        for i, l in enumerate(ls): d.text((PAD + indent, y + i * lh(f)), l, font=f, fill=fill)
    ops.append((h, dr))
def gap(px): ops.append((round(px), lambda d, sh, y: None))

add_text(spec['title'], F['title'], PAPER); gap(4 * u)
add_text(spec['question'], F['q'], DIM); gap(4 * u)
if spec.get('rec'): add_text(spec['rec'], F['q'], GOLD, bar=True, indent=round(6 * u)); gap(4 * u)
if spec.get('note'): add_text(spec['note'], F['q'], PAPER, bar=False); gap(4 * u)
gap(6 * u)

keyw = round(22 * u)
for b in spec['blocks']:
    if 'head' in b:
        add_text(b['head'], F['head'], GOLD); gap(3 * u)
    elif 'text' in b:
        add_text(b['text'], F['q'], DIM); gap(5 * u)
    elif 'grid' in b:
        cols = b.get('cols', len(b['grid'])); g = round(5 * u)
        cw = (TW - g * (cols - 1)) // cols
        items = b['grid']
        for r0 in range(0, len(items), cols):
            row = items[r0:r0 + cols]; ims = []
            for it in row:
                im = load(it); s = min(cw / im.width, b.get('h', 10 ** 6) / im.height)
                ims.append(im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS))
            caps = [wrap(it['cap'], F['grid'], cw) for it in row]
            mh = max(i.height for i in ims); ch = max(len(c) for c in caps) * lh(F['grid'])
            def dr(d, sh, y, row=row, ims=ims, caps=caps, mh=mh, cw=cw, g=g):
                for k, (it, im, cl) in enumerate(zip(row, ims, caps)):
                    x = PAD + k * (cw + g)
                    d.rectangle((x, y, x + cw, y + mh), fill=tuple(it.get('bg', CELL)))
                    sh.paste(im, (x + (cw - im.width) // 2, y + (mh - im.height) // 2))
                    if it.get('key'):
                        kw = round(18 * u); d.rectangle((x, y, x + kw, y + kw), fill=GOLD)
                        d.text((x + kw // 2, y + kw // 2), it['key'], font=F['key'], fill=INK, anchor='mm')
                    for i, l in enumerate(cl): d.text((x, y + mh + round(2 * u) + i * lh(F['grid'])), l, font=F['grid'], fill=PAPER)
            ops.append((mh + round(2 * u) + ch, dr)); gap(6 * u)
    else:
        im = load(b)
        iw = W if (PHONE and b.get('full', True)) else TW
        im = im.resize((iw, round(im.height * iw / im.width)), Image.LANCZOS)
        ind = keyw + round(4 * u) if b.get('key') else 0
        cl = wrap(b['cap'], F['cap'], TW - ind)
        ch = max(keyw if b.get('key') else 0, len(cl) * lh(F['cap']))
        def dr(d, sh, y, b=b, im=im, cl=cl, ch=ch, ind=ind, iw=iw):
            if b.get('key'):
                d.rectangle((PAD, y, PAD + keyw, y + keyw), fill=GOLD)
                d.text((PAD + keyw // 2, y + keyw // 2), b['key'], font=F['key'], fill=INK, anchor='mm')
            for i, l in enumerate(cl): d.text((PAD + ind, y + i * lh(F['cap'])), l, font=F['cap'], fill=PAPER)
            x = (W - iw) // 2; yy = y + ch + round(3 * u)
            sh.paste(im, (x, yy)); d.rectangle((x, yy, x + iw - 1, yy + im.height - 1), outline=(80, 70, 50), width=2)
        ops.append((ch + round(3 * u) + im.height, dr)); gap(8 * u)

H = PAD + sum(h for h, _ in ops) + round(20 * u)
sh = Image.new('RGB', (W, H), INK); d = ImageDraw.Draw(sh)
if not PHONE: d.rectangle((0, 0, 12, H), fill=GOLD)
else: d.rectangle((0, 0, W, round(2 * u)), fill=GOLD)
y = PAD
for h, dr in ops: dr(d, sh, y); y += h
d.text((W - PAD, H - round(4 * u)), 'CONCEPT', font=F['stamp'], fill=GOLD, anchor='rd')
sh.save(out, quality=84, optimize=True)
print(out, sh.size, 'smallest sheet text at 390 px wide: %.1f px' % min(SIZES.values()))
