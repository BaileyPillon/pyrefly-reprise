"""Ormi LoRA step pick sheet: the installed idle, then per checkpoint (no LoRA, 500..2000)
two seeds whole at one scale, and under each a native-pixel head crop and costume crop.

  python pick-sheet.py [cand_dir[,cand_dir2...]] [out.jpg]   (one block per dir, stacked)
"""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont
try:
    FONT = ImageFont.truetype('arial.ttf', 26)
except OSError:
    FONT = None

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), *['..'] * 6))
CANDS = (sys.argv[1] if len(sys.argv) > 1 else 'D:/Tools/pyrefly-lora/ormi/cand/steptest,D:/Tools/pyrefly-lora/ormi/cand/bgtest,D:/Tools/pyrefly-lora/ormi/cand/posetest').split(',')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), 'pick-sheet.jpg')
H = 700  # whole-figure row height
C = 300  # crop tile


def flat(p):
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
    return bg.convert('RGB')


def bbox(im):
    g = im.convert('L').point(lambda v: 255 if v < 240 else 0)
    return g.getbbox() or (0, 0, im.width, im.height)


def head_crop(im):
    x0, y0, x1, y1 = bbox(im)
    h = y1 - y0
    cx = (x0 + x1) // 2
    s = int(h * 0.26)
    # head is the top of the figure; centre on the topmost third of its width band
    top = im.crop((x0, y0, x1, y0 + s)).convert('L').point(lambda v: 255 if v < 240 else 0).getbbox()
    if top: cx = x0 + (top[0] + top[2]) // 2
    return im.crop((cx - s // 2, y0 - 10, cx + s // 2, y0 - 10 + s)).resize((C, C), Image.LANCZOS)


def costume_crop(im):
    x0, y0, x1, y1 = bbox(im)
    h = y1 - y0
    s = int(h * 0.4)
    cx = (x0 + x1) // 2
    return im.crop((cx - s // 2, y0 + int(h * 0.25), cx + s // 2, y0 + int(h * 0.25) + s)).resize((C, C), Image.LANCZOS)


def block(CAND):
    rows = [('installed idle (anchor)', [flat(os.path.join(REPO, 'public/art/characters/ormi/idle.png'))])]
    tags = sorted({os.path.basename(p).rsplit('.', 2)[0] for p in glob.glob(f'{CAND}/*.png')}, key=lambda t: (t != 'none', t))
    for t in tags:
        rows.append((os.path.basename(CAND) + ' ' + t, [flat(p) for p in sorted(glob.glob(f'{CAND}/{t}.*.png'))]))

    tiles = []
    for label, ims in rows:
        cells = []
        for im in ims:
            x0, y0, x1, y1 = bbox(im)
            fig = im.crop((max(0, x0 - 8), max(0, y0 - 8), min(im.width, x1 + 8), min(im.height, y1 + 8)))
            fig = fig.resize((int(fig.width * H / fig.height), H), Image.LANCZOS)
            col = Image.new('RGB', (max(fig.width, C * 2 + 6), H + C + 6), 'white')
            col.paste(fig, ((col.width - fig.width) // 2, 0))
            col.paste(head_crop(im), (0, H + 6)); col.paste(costume_crop(im), (C + 6, H + 6))
            cells.append(col)
        w = sum(c.width for c in cells) + 12 * (len(cells) - 1)
        t = Image.new('RGB', (w, H + C + 40), 'white')
        ImageDraw.Draw(t).text((4, 2), label, fill=(0, 0, 0), font=FONT)
        x = 0
        for c in cells: t.paste(c, (x, 34)); x += c.width + 12
        tiles.append(t)

    W = sum(t.width for t in tiles) + 30 * (len(tiles) - 1)
    sheet = Image.new('RGB', (W, tiles[0].height), 'white')
    x = 0
    for t in tiles:
        sheet.paste(t, (x, 0)); x += t.width + 30
        ImageDraw.Draw(sheet).line([(x - 16, 0), (x - 16, sheet.height)], fill=(180, 180, 180), width=2)
    return sheet


blocks = [block(c) for c in CANDS]
sheet = Image.new('RGB', (max(b.width for b in blocks), sum(b.height for b in blocks) + 20 * (len(blocks) - 1)), 'white')
y = 0
for b in blocks:
    sheet.paste(b, (0, y)); y += b.height + 20
sheet.save(OUT, quality=85)
print(OUT, sheet.size)
