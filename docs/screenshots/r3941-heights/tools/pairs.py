"""pairs.py: one side-by-side JPEG per chapter and viewport (BEFORE | AFTER), labelled, from frames/<chapter>-<WxH>-before|after.png.
   python pairs.py --frames frames --analysis analysis.json --out <dir>
"""
import argparse
import json
import os
from PIL import Image, ImageDraw, ImageFont

CH = {
    'seymour-flux': ('01', 'I', 'Seymour Flux'),
    'yunalesca': ('02', 'II', 'Yunalesca'),
    'braskas-final-aeon': ('03', 'III', "Braska's Final Aeon"),
    'seymour-anima-macalania': ('07', 'VII', 'Seymour and Anima'),
    'evrae-airship': ('08', 'VIII', 'Evrae'),
    'yojimbo-cavern': ('09', 'IX', 'Yojimbo'),
    'seymour-natus': ('10', 'X', 'Seymour Natus'),
    'seymour-omnis': ('12', 'XII', 'Seymour Omnis'),
    'isaaru-via-purifico': ('14', 'XIV', 'Isaaru'),
    'sin-fins-core': ('17', 'XVII', 'Sin: the Fins and the Core'),
    'sin-face': ('18', 'XVIII', 'Sin: the Face'),
}

ap = argparse.ArgumentParser()
ap.add_argument('--frames', default='frames')
ap.add_argument('--analysis', default='analysis.json')
ap.add_argument('--out', required=True)
ap.add_argument('--quality', type=int, default=86)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)

def font(size):
    for p in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

rows = json.load(open(a.analysis))
total = 0
for r in rows:
    nn, roman, title = CH[r['chapter']]
    vp = r['viewport']
    b = Image.open(os.path.join(a.frames, f"{r['chapter']}-{vp}-before.png")).convert('RGB')
    f = Image.open(os.path.join(a.frames, f"{r['chapter']}-{vp}-after.png")).convert('RGB')
    w, h = b.size
    phone = w < 600
    bar = 54 if phone else 44
    gutter = 10
    sheet = Image.new('RGB', (w * 2 + gutter, h + bar), (11, 10, 18))
    sheet.paste(b, (0, bar))
    sheet.paste(f, (w + gutter, bar))
    d = ImageDraw.Draw(sheet)
    big, small = font(15 if phone else 20), font(11 if phone else 14)
    tag = font(11 if phone else 15)
    def tagged(x0, ox, who, top, label, after):
        cx = ox + x0 + who / 2
        tw = d.textlength(label, font=tag)
        tx = max(ox + 2, min(ox + w - tw - 8, cx - tw / 2 - 4))
        ty = bar + max(2, top - (18 if not phone else 15))
        d.rounded_rectangle((tx, ty, tx + tw + 8, ty + (16 if not phone else 13)), radius=3, fill=(11, 10, 18), outline=(240, 207, 146) if after else (120, 114, 100))
        d.text((tx + 4, ty + 1), label, fill=(240, 207, 146) if after else (185, 177, 154), font=tag)
    for x in r['figs']:
        if x['topMinBefore'] is not None:
            tagged(x['xBefore'], 0, x['wBefore'], x['topMinBefore'], x['id'].capitalize(), False)
        if x['topMinAfter'] is not None:
            tagged(x['xAfter'], w + gutter, x['wAfter'], x['topMinAfter'], f"{x['id'].capitalize()} {x['ratio']:.3f}", True)
    who = '  '.join(f"{x['id'].capitalize()} {x['ratio']:.3f}" for x in r['figs'])
    d.text((8, 4), f"{roman}  {title}", fill=(240, 207, 146), font=big)
    d.text((8, 4 + (19 if phone else 25)), f"BEFORE (?stature=off): all equal   {vp}", fill=(185, 177, 154), font=small)
    d.text((w + gutter + 8, 4), who, fill=(240, 207, 146), font=big)
    worlds = ', '.join(f"{x['id'].capitalize()} {x['worldAfter']}" for x in r['figs'])
    d.text((w + gutter + 8, 4 + (19 if phone else 25)), f"AFTER: world heights {worlds}", fill=(185, 177, 154), font=small)
    out = os.path.join(a.out, f"ch{nn}-{r['chapter']}-{vp}-before-after.jpg")
    sheet.save(out, 'JPEG', quality=a.quality, optimize=True, progressive=True)
    total += os.path.getsize(out)
    print(out, os.path.getsize(out) // 1024, 'KB')
print('total', total // 1024, 'KB')
