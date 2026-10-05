"""ro_view.py: look at a figure: today against candidates (library files or candidate PNGs), whole figure at battle height and the head and the two close-ups at 100 percent of the master.

  python ro_view.py <id> out.jpg label=path [label=path ...]     (the first column is always today's master)
"""
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from ro_common import *
import ro_cpu
from ro_gpu import alpha_bbox
from PIL import Image, ImageDraw, ImageFont

FONT = ImageFont.truetype('arial.ttf', 15)
BG = (58, 60, 70)


def flat(im):
    b = Image.new('RGB', im.size, BG)
    b.paste(im, mask=im.getchannel('A'))
    return b


def view(i, out, cols, h_fig=620, h_crop=260):
    a = [x for x in plan() if x['id'] == i][0]
    P = ro_cpu.approved1x(a)
    pb = alpha_bbox(P)
    head = (load_json(f'{RW}/heads.json', {}).get(i) or {}).get('box')
    boxes = ([('head', head)] if head else []) + [(f'close-up {k + 1}', b) for k, b in enumerate(crop_boxes(a, pb))]
    ims = [('today', ro_cpu.today(a))] + [(lab, Image.open(p).convert('RGBA')) for lab, p in cols]
    S = a['S']
    figs, rows = [], [[] for _ in boxes]
    for lab, im in ims:
        k = im.width / P.width
        fl = flat(im)
        bb = (int(pb[0] * k), int(pb[1] * k), int(pb[2] * k), int(pb[3] * k))
        f = fl.crop(bb)
        figs.append((lab, f.resize((round(f.width * h_fig / f.height), h_fig), Image.LANCZOS)))
        for r, (name, b) in zip(rows, boxes):
            c = fl.crop((int(b[0] * k), int(b[1] * k), int(b[2] * k), int(b[3] * k)))
            r.append(c.resize((max(1, round(c.width * h_crop / c.height)), h_crop), Image.LANCZOS))
    W = max(sum(f.width + 6 for _, f in figs), max(sum(c.width + 6 for c in r) for r in rows) if rows else 0)
    H = 22 + h_fig + len(rows) * (h_crop + 20)
    sh = Image.new('RGB', (W, H), (24, 24, 28))
    d = ImageDraw.Draw(sh)
    x = 0
    for lab, f in figs:
        d.text((x + 4, 3), lab, fill=(235, 235, 235), font=FONT)
        sh.paste(f, (x, 22))
        x += f.width + 6
    y = 22 + h_fig
    for (name, _), r in zip(boxes, rows):
        x = 0
        for (lab, _), c in zip(ims, r):
            d.text((x + 4, y + 2), f'{name}: {lab}', fill=(255, 220, 120), font=FONT)
            sh.paste(c, (x, y + 20))
            x += c.width + 6
        y += h_crop + 20
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sh.save(out, quality=88)
    print(out, sh.size)


if __name__ == '__main__':
    view(sys.argv[1], sys.argv[2], [tuple(x.split('=', 1)) for x in sys.argv[3:]])
