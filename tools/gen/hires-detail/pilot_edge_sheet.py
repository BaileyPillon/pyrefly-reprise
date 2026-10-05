"""pilot_edge_sheet.py: the edge-treatment (E) crops of the figure-detail pilot, at 100 percent: Today 1x | without E | with E.
Windows are in 4x master pixels. Output: <candidates>/2026-10-04-detail/sheets/edge-<name>.jpg
"""
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from r39lib import *
from PIL import ImageDraw, ImageFont

ART39 = 'D:/pyrefly-r39-art/public/art'
OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-detail'
BG = (58, 60, 70)
FONT = ImageFont.truetype('arial.ttf', 16)

# name: (subject/state, [(row label, x0, y0, w, h, zoom)])
EDGES = {
    'kimahri': ('kimahri/idle', [('hair outline', 1690, 470, 380, 130, 2.0), ('horn', 1930, 640, 260, 230, 3.0)]),
    'evrae': ('evrae/idle', [('crest', 150, 150, 520, 380, 1.5), ('jaw', 60, 640, 520, 300, 1.5)]),
    'tidus': ('tidus/idle', [('hair outline (left)', 1180, 440, 560, 420, 1.0), ('hair outline (top spikes)', 1560, 100, 520, 330, 1.0)]),
    'seymour-flux': ('seymour-flux-body/idle', [('feather tips', 1980, 160, 760, 640, 1.0), ('robe and hand', 60, 1900, 640, 480, 1.0)]),
}


def flat(im):
    if im.mode != 'RGBA':
        return im.convert('RGB')
    bg = Image.new('RGB', im.size, BG)
    bg.paste(im, mask=im.getchannel('A'))
    return bg


def sheet(name):
    item, rows = EDGES[name]
    sid, state = item.split('/')
    d = f'{OUT}/masters/{item.replace("/", "-")}'
    a = Image.open(f'{ART39}/characters/{sid}/{state}.png').convert('RGBA')
    today = a.resize((a.width * 4, a.height * 4), Image.BICUBIC)
    wo = Image.open(f'{d}/r39@4x.png').convert('RGBA')
    we = Image.open(f'{d}/r39+E@4x.png').convert('RGBA')
    panels_rows = []
    for lab, x0, y0, w, h, z in rows:
        ps = []
        for im in (today, wo, we):
            c = flat(im.crop((x0, y0, x0 + w, y0 + h)))
            if z != 1.0:
                c = c.resize((int(w * z), int(h * z)), Image.NEAREST if z > 1 else Image.LANCZOS)
            ps.append(c)
        panels_rows.append((lab, z, ps))
    W = max(sum(p.width for p in ps) + 12 for _, _, ps in panels_rows)
    Ht = sum(ps[0].height + 26 for _, _, ps in panels_rows) + 8
    sh = Image.new('RGB', (W, Ht), (24, 24, 28))
    d_ = ImageDraw.Draw(sh)
    y = 4
    for lab, z, ps in panels_rows:
        x = 0
        for t, p in zip(('Today 1x (bicubic)', 'without E (R39 master)', 'with E'), ps):
            d_.text((x + 4, y), f'{lab}: {t}  ({int(z * 100)}% of the 4x master)', fill=(235, 235, 235), font=FONT)
            sh.paste(p, (x, y + 22))
            x += p.width + 6
        y += ps[0].height + 26
    os.makedirs(f'{OUT}/sheets', exist_ok=True)
    out = f'{OUT}/sheets/edge-{name}.jpg'
    sh.save(out, quality=88)
    say(f'{out} {sh.size}')


if __name__ == '__main__':
    for n in (sys.argv[1:] or list(EDGES)):
        sheet(n)
