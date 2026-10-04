"""Contact sheets of the worst rims: before (the library's master), after (the rebuilt master) and the approved painting, 4x zoom, over black, white and the chapter plate."""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import alphafix as af

Image.MAX_IMAGE_PIXELS = None
ART = 'D:/pyrefly-r39-int/public/art'
OLD = 'D:/Tools/pyrefly-art-backup/hires'
NEW = os.environ.get('R39_FIXED_OUT', 'D:/Tools/pyrefly-art-backup/hires-alpha-fixed')
MAIN = __name__ == '__main__'
OUTDIR = sys.argv[1] if MAIN and len(sys.argv) > 1 else 'D:/Tools/pyrefly-scratch/2026-10-04/r39-repair/sheets'
N_SHEETS = int(sys.argv[2]) if MAIN and len(sys.argv) > 2 else 20
if MAIN:
    os.makedirs(OUTDIR, exist_ok=True)
man = json.load(open(f'{OLD}/manifest.json', encoding='utf8'))

# the chapter plate a figure is fought in (src/data: sceneKey of the chapter that holds it); FFX figures default to Chapter I, FFX-2 figures to Chapter IV
PLATE_BY_PREFIX = [
    ('yunalesca', 'zanarkand-dome'), ('braskas-final-aeon', 'dreams-end'), ('ffx2-bahamut', 'bevelle-underground'),
    ('ffx2-vegnagun', 'farplane'), ('ffx2-leblanc', 'leblanc-last-room'), ('seymour-anima', 'macalania-temple'), ('x2-anima', 'macalania-temple'),
    ('seymour-natus', 'bevelle-highbridge'), ('seymour-omnis', 'gagazet'), ('seymour-flux', 'gagazet'), ('evrae', 'evrae-airship-deck'),
    ('yojimbo', 'cavern-stolen-fayth'), ('isaaru', 'macalania-temple'), ('sin-', 'sin-fahrenheit-flight'), ('vegnagun', 'farplane'),
    ('mortiorchis', 'bevelle-underground'), ('mortiphasm', 'bevelle-underground'),
]


def plate_for(asset_id):
    sid = asset_id.split('/')[1]
    for pre, key in PLATE_BY_PREFIX:
        if sid.startswith(pre):
            return key
    game = man['assets'][asset_id].get('game') or ''
    return 'bevelle-underground' if 'FFX-2' in game else 'gagazet'


def font(sz):
    for f in ('C:/Windows/Fonts/consola.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def worst_spot(P, M):
    h, w = P.shape[:2]
    pm, ad = af.down_premult(M, (w, h))
    ca = af.comp(P.astype(np.float32), 128.0)
    cm = pm + 128.0 * (1 - ad[..., None] / 255.0)
    bm = af.box_mean((P[..., 3] > 127).astype(np.float32), 5)
    band = np.zeros((h, w), bool)
    band[2:-2, 2:-2] = ((bm > 0.04) & (bm < 0.96))[2:-2, 2:-2]
    d = np.abs(af.lum(cm) - af.lum(ca)) * band
    k = 21
    sm = af.box_mean(d, k)
    sm[:k, :] = 0
    sm[-k:, :] = 0
    sm[:, :k] = 0
    sm[:, -k:] = 0
    y, x = np.unravel_index(int(np.argmax(sm)), sm.shape)
    return int(x), int(y)


def make_sheet(rec, rank):
    aid = rec['id']
    sid, state = aid.split('/')[1], aid.split('/')[2]
    P = af.load_rgba(f'{ART}/{man["assets"][aid]["src"].replace("public/art/", "")}')
    M0 = af.load_rgba(f'{OLD}/characters/{sid}/{state}@4x.png')
    M1 = af.load_rgba(f'{NEW}/characters/{sid}/{state}@4x.png')
    cx, cy = worst_spot(P, M0)
    half = 60                                      # 120 x 120 master pixels
    x0 = max(0, min(M0.shape[1] - 2 * half, cx * 4 - half))
    y0 = max(0, min(M0.shape[0] - 2 * half, cy * 4 - half))
    box = (x0, y0, x0 + 2 * half, y0 + 2 * half)
    plate_key = plate_for(aid)
    plate = Image.open(f'{ART}/backdrops/{plate_key}.png').convert('RGB')
    pw, ph = plate.size
    # a patch of the plate, resized so its texture is of the same order as the figure's
    patch = plate.crop((pw // 2 - 90, ph // 2 - 90, pw // 2 + 90, ph // 2 + 90)).resize((2 * half, 2 * half), Image.BICUBIC)
    cells = {}
    Pup = Image.fromarray(P).resize((P.shape[1] * 4, P.shape[0] * 4), Image.NEAREST)
    for name, arr in (('before', M0), ('after', M1), ('approved', None)):
        im = Pup if arr is None else Image.fromarray(arr)
        c = im.crop(box)
        row = []
        for bgname, bg in (('black', Image.new('RGB', c.size, (0, 0, 0))), ('white', Image.new('RGB', c.size, (255, 255, 255))), ('plate', patch)):
            base = bg.convert('RGBA')
            row.append(Image.alpha_composite(base, c).convert('RGB').resize((480, 480), Image.NEAREST))
        cells[name] = row
    pad, head = 8, 78
    W = 3 * 480 + 4 * pad + 90
    H = head + 3 * 480 + 4 * pad
    sheet = Image.new('RGB', (W, H), (22, 22, 22))
    d = ImageDraw.Draw(sheet)
    b, a = rec['before'], rec['after']
    d.text((pad, 6), f'#{rank:02d}  {aid}  @4x   game: {man["assets"][aid].get("game", "?")}   plate: {plate_key}   window {box} of {M0.shape[1]}x{M0.shape[0]} (4x zoom, nearest)', fill=(235, 235, 235), font=font(17))
    d.text((pad, 30), f'rim bias {b["rim_bias"]:+.2f} -> {a["rim_bias"]:+.2f}   rim MAD {b["rim_mad"]:.2f} -> {a["rim_mad"]:.2f}   SSIM(1x) {b["ssim_gray"]:.4f} -> {a["ssim_gray"]:.4f}   alpha IoU {b["alpha_iou"]:.4f} -> {a["alpha_iou"]:.4f}   edge specks {b["rim_specks"]} -> {a["rim_specks"]}', fill=(200, 220, 255), font=font(17))
    d.text((pad, 54), 'columns: over black | over white | over the chapter plate        rows: library master (before) | rebuilt master (after) | approved 1x painting (reference)', fill=(160, 160, 160), font=font(14))
    for ri, name in enumerate(('before', 'after', 'approved')):
        y = head + pad + ri * (480 + pad)
        d.text((pad, y + 220), name, fill=(255, 255, 255), font=font(15))
        for ci, im in enumerate(cells[name]):
            sheet.paste(im, (90 + pad + ci * (480 + pad), y))
    path = f'{OUTDIR}/rim-{rank:02d}-{sid}-{state}.png'
    sheet.save(path)
    # the plate column of before and after, for the index
    thumb = Image.new('RGB', (2 * 300 + 6, 300), (22, 22, 22))
    thumb.paste(cells['before'][2].resize((300, 300), Image.NEAREST), (0, 0))
    thumb.paste(cells['after'][2].resize((300, 300), Image.NEAREST), (306, 0))
    return path, thumb, rec


if __name__ == '__main__':
    worst = json.load(open('D:/Tools/pyrefly-scratch/2026-10-04/r39-repair/worst40.json'))
    res = {}
    out = []
    thumbs = []
    n = 0
    for w in worst:
        if n >= N_SHEETS:
            break
        r = json.load(open(f'{NEW}/reports/results/{w["id"].replace("/", "__")}.json', encoding='utf8'))
        o4 = [o for o in r['outputs'] if o['scale'] == 4 and o.get('accepted')]
        if not o4:
            continue
        n += 1
        rec = dict(id=w['id'], before=o4[0]['before'], after=o4[0]['after'])
        path, thumb, _ = make_sheet(rec, n)
        out.append(dict(rank=n, id=w['id'], sheet=path, bias_before=rec['before']['rim_bias'], bias_after=rec['after']['rim_bias'], mad_before=rec['before']['rim_mad'], mad_after=rec['after']['rim_mad'], specks_before=rec['before']['rim_specks'], specks_after=rec['after']['rim_specks'], ssim_before=rec['before']['ssim_gray'], ssim_after=rec['after']['ssim_gray']))
        thumbs.append((n, w['id'], thumb))
        print('sheet', n, w['id'], flush=True)
    json.dump(out, open(f'{OUTDIR}/sheets.json', 'w'), indent=1)
    # the index: before | after over the plate, three per row
    cols, cw, ch = 3, 612, 330
    rows = (len(thumbs) + cols - 1) // cols
    idx = Image.new('RGB', (cols * cw, rows * ch), (14, 14, 14))
    dd = ImageDraw.Draw(idx)
    for i, (n, aid, th) in enumerate(thumbs):
        x, y = (i % cols) * cw + 3, (i // cols) * ch + 26
        idx.paste(th, (x, y))
        dd.text((x + 2, y - 22), f'#{n:02d} {aid}  before | after', fill=(235, 235, 235), font=font(15))
    idx.save(f'{OUTDIR}/index.png')
    print('index', idx.size)
