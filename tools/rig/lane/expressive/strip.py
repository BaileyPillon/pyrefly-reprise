"""strip.py <out.png> <crop x0,y0,x1,y1> <frames comma> <label=rec ko dir> ... [--w 300] : rows = recordings, columns = the given frames of <rec>/frames/f%05d.jpg (the ko mode's ring)."""
import pathlib
import sys

from PIL import Image, ImageDraw

a = sys.argv[1:]
out, crop, frames = a[0], tuple(int(v) for v in a[1].split(',')), [int(f) for f in a[2].split(',')]
w = int(a[a.index('--w') + 1]) if '--w' in a else 300
recs = [x for i, x in enumerate(a[3:], 3) if not x.startswith('--') and (i < 4 or a[i - 1] != '--w')]
h = int(w * (crop[3] - crop[1]) / (crop[2] - crop[0]))
sheet = Image.new('RGB', (len(frames) * (w + 4), len(recs) * (h + 4)), (10, 10, 14))
for r, spec in enumerate(recs):
    lab, _, d = spec.partition('=')
    for c, f in enumerate(frames):
        p = pathlib.Path(d) / 'frames' / f'f{f:05d}.jpg'
        if not p.exists():
            continue
        im = Image.open(p).crop(crop).resize((w, h), Image.LANCZOS)
        ImageDraw.Draw(im).text((4, 4), f'{lab} f{f}', fill=(255, 220, 120))
        sheet.paste(im, (c * (w + 4), r * (h + 4)))
sheet.save(out)
print(sheet.size)
