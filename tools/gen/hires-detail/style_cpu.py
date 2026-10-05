"""style_cpu.py: the CPU half of the style pilot (candidates only).

  python style_cpu.py masters <subject/state> ...   4x RGBA cut-outs of every style output: S1 on the approved alpha (+ the rim repair, + E); S2 and S3 matted with rembg
                                                    (isnet-anime) because their silhouettes moved, then E with the matte as its own contour
  python style_cpu.py sheets <subject/state> ...    per subject: Today (R39 + E) | S1 | S2 | S3 : the whole figure at its 4K battle size, the face and the torso at 100 percent
  python style_cpu.py frames                        four faked 3840x2160 battle frames (Today, S1, S2, S3): the approved Gagazet painting, Tidus and Seymour Flux at the size and place
                                                    the release 39 frame (docs/screenshots/r39-int/ch1-seymour-flux-2560x1440-first-menu.jpg) gives them
Output: D:/Tools/pyrefly-art-backup/candidates/2026-10-04-style/ (masters/<subject>-<state>/<dir>-s<seed>+E@4x.png, sheets/, frames/).
"""
import json
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
sys.path.insert(0, 'D:/pyrefly-r39-art/tools/gen/hires-alpha-fix')
from r39lib import *
import edge_e
import pilot_cpu as PC
from PIL import ImageDraw, ImageFont, ImageFilter

ART39 = 'D:/pyrefly-r39-art/public/art'
SWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/style-work'
PWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/pilot-work'
OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-style'
DETAIL = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-detail'
ITEMS = ['tidus/idle', 'seymour-flux-body/idle', 'yuna-gunner/idle']
S3 = os.environ.get('STYLE_S3', 's3z')   # kept for the unattended runner; every direction that has outputs is used
DIRS = {'s1': [424242, 20261004], 's2': [9101, 9102], 's3z': [9201, 9202], 's3k': [9101, 9102]}
LABEL = {'s1': 'S1 Premium cel', 's2': 'S2 Painterly', 's3z': 'S3a Semi-real (Z-Image)', 's3k': 'S3b Semi-real (Klein)'}
FILE = {'today': 'today', 's1': 's1-premium-cel', 's2': 's2-painterly', 's3z': 's3a-semireal-zimage', 's3k': 's3b-semireal-klein'}
BG = (58, 60, 70)
FONT = ImageFont.truetype('arial.ttf', 16)
FIG_H_4K = {'tidus/idle': 713, 'yuna-gunner/idle': 713, 'seymour-flux-body/idle': 864}
FACE = {'tidus/idle': (405, 150), 'yuna-gunner/idle': (235, 130), 'seymour-flux-body/idle': (365, 235)}
TORSO = {'tidus/idle': (420, 300), 'yuna-gunner/idle': (235, 330), 'seymour-flux-body/idle': (430, 430)}
CELL = 440
_session = [None]


def mdir(item):
    d = f'{OUT}/masters/{item.replace("/", "-")}'
    os.makedirs(d, exist_ok=True)
    return d


def matte(rgb_img):
    if _session[0] is None:
        os.environ.setdefault('U2NET_HOME', 'D:/Tools/ComfyUI/rembg-models')
        from rembg import new_session
        _session[0] = new_session('isnet-anime')
    from rembg import remove
    return remove(rgb_img.convert('RGB'), session=_session[0])


def masters(item):
    sid, state = item.split('/')
    d = mdir(item)
    P = np.asarray(Image.open(f'{ART39}/characters/{sid}/{state}.png').convert('RGBA'))
    res_p = f'{d}/results.json'
    res = json.load(open(res_p)) if os.path.exists(res_p) else {}
    for dr, seeds in DIRS.items():
        for sd in seeds:
            name = f'{dr}-s{sd}'
            src = f'{SWORK}/{item.replace("/", "-")}/{name}-4x.png'
            dst = f'{d}/{name}+E@4x.png'
            if not os.path.exists(src) or os.path.exists(dst):
                continue
            t0 = time.time()
            if dr == 's1':
                _, N, ref, plain = PC.finish(item, name, src)       # the approved alpha, rim repair, colour bled (same as every pilot master)
                NE, met = edge_e.apply_E(P, N, 4)
            else:
                im = Image.open(src).convert('RGB')
                rgba = np.asarray(matte(im))
                NE, met = edge_e.apply_E(rgba, rgba, 1, sigma=2.5, delta=2.4, ramp=1.5, band=8, bleed_px=24, core_px=10)
            Image.fromarray(NE, 'RGBA').save(dst + '.tmp', 'PNG', compress_level=6)
            os.replace(dst + '.tmp', dst)
            res[name] = {'E': met, 'seconds': round(time.time() - t0, 1)}
            json.dump(res, open(res_p, 'w'), indent=1)
            say(f'{item} {name}: matte+E done in {time.time() - t0:.0f}s, iou {met["alpha_iou_vs_approved_up"]} move {met["edge_displacement_px_at_S"]} px')


def flat(im):
    bg = Image.new('RGB', im.size, BG)
    bg.paste(im, mask=im.getchannel('A'))
    return bg


def bbox_of(im):
    a = np.asarray(im.getchannel('A'))
    ys, xs = np.nonzero(a > 128)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def columns(item, seed_idx):
    d = mdir(item)
    cols = [('Today (R39 + E)', Image.open(f'{DETAIL}/masters/{item.replace("/", "-")}/r39+E@4x.png').convert('RGBA'))]
    for dr, seeds in DIRS.items():
        p = f'{d}/{dr}-s{seeds[seed_idx]}+E@4x.png'
        if os.path.exists(p):
            cols.append((f'{LABEL[dr]} (seed {seed_idx + 1})', Image.open(p).convert('RGBA')))
    return cols


def sheets(item, seed_idx=0):
    sid, state = item.split('/')
    P = Image.open(f'{ART39}/characters/{sid}/{state}.png').convert('RGBA')
    pb = bbox_of(P)
    pw, ph = pb[2] - pb[0], pb[3] - pb[1]

    def centre(pt, bb):   # the same fractions of the figure's own box
        fx, fy = (pt[0] - pb[0]) / pw, (pt[1] - pb[1]) / ph
        return bb[0] + fx * (bb[2] - bb[0]), bb[1] + fy * (bb[3] - bb[1])
    cols = columns(item, seed_idx)
    H = FIG_H_4K[item]
    figs, faces, torsos = [], [], []
    for lab, im in cols:
        bb = bbox_of(im)
        r = H / (bb[3] - bb[1])
        figs.append(flat(im.crop(bb).resize((round((bb[2] - bb[0]) * r), H), Image.LANCZOS)))
        for pt, store in ((FACE[item], faces), (TORSO[item], torsos)):
            cx, cy = centre(pt, bb)
            sc = (bb[3] - bb[1]) / ph / 4.0      # a variant's 4x master drawn at the same size as the painting's: crop a window of the same painting-space size
            half = CELL // 2
            box = (int(cx - half), int(cy - half), int(cx + half), int(cy + half))
            store.append(flat(im.crop(box)))
    W = sum(f.width for f in figs) + 6 * (len(figs) - 1)
    top = H + 28
    sheet = Image.new('RGB', (max(W, len(cols) * (CELL + 6)), top + 2 * (CELL + 22)), (24, 24, 28))
    dr = ImageDraw.Draw(sheet)
    x = 0
    for (lab, _), f in zip(cols, figs):
        short = lab.split(' (')[0].split(' ')[0] if f.width < 420 else None      # a narrow figure gets the short label (Today, S1, S2, S3a, S3b)
        dr.text((x + 4, 4), short if short else f'{lab}  ({H} px tall = a 4K battle frame)', fill=(235, 235, 235), font=FONT)
        sheet.paste(f, (x, 28))
        x += f.width + 6
    for ri, (name, store) in enumerate((('face', faces), ('torso', torsos))):
        y = top + ri * (CELL + 22)
        for ci, c in enumerate(store):
            dr.text((ci * (CELL + 6) + 4, y), f'{name}: {cols[ci][0]}', fill=(255, 220, 120), font=FONT)
            sheet.paste(c, (ci * (CELL + 6), y + 20))
    os.makedirs(f'{OUT}/sheets', exist_ok=True)
    out = f'{OUT}/sheets/{item.replace("/", "-")}-style-seed{seed_idx + 1}.jpg'
    sheet.save(out, quality=88)
    say(f'{out} {sheet.size}')


# ------------------------------------------------------------------------------------------------- the faked frames
# Display coordinates in the 2000-px-wide view of docs/screenshots/r39-int/ch1-seymour-flux-2560x1440-first-menu.jpg x 1.92 = 3840x2160 coordinates.
TIDUS_READY_BOX = (697 * 1.92, 563 * 1.92, 1015 * 1.92, 918 * 1.92)      # the ready pose's box in the frame (left, top, right, bottom)
SEYMOUR_BOX = (1421 * 1.92, 92 * 1.92, 1700 * 1.92, None)                 # left, top, right (the bottom is behind the Mortiorchis panel)


def frame_scales():
    """Pixels per painting pixel at 4K, from the two boxes: Tidus from the ready painting's height, Seymour Flux from the idle painting's width."""
    tr = Image.open(f'{ART39}/characters/tidus/ready.png').convert('RGBA')
    tb = bbox_of(tr)
    rs = json.load(open(f'{ART39}/characters/tidus/ready.json')).get('scale') or 1.0   # the ready painting is drawn at its sidecar scale times the idle's pixel scale
    k_t = (TIDUS_READY_BOX[3] - TIDUS_READY_BOX[1]) / (tb[3] - tb[1]) / rs
    sy = Image.open(f'{ART39}/characters/seymour-flux-body/idle.png').convert('RGBA')
    sb = bbox_of(sy)
    k_s = (SEYMOUR_BOX[2] - SEYMOUR_BOX[0]) / (sb[2] - sb[0])
    return k_t, k_s


def paste_fig(canvas, im, k4, anchor, mode):
    """im: 4x RGBA master; k4: px per painting px at 4K; anchor (x, y): bottom-centre for 'feet', top-left for 'top'."""
    bb = bbox_of(im)
    c = im.crop(bb)
    s = k4 / 4.0
    c = c.resize((max(1, round(c.width * s)), max(1, round(c.height * s))), Image.LANCZOS)
    if mode == 'feet':
        x, y = int(anchor[0] - c.width / 2), int(anchor[1] - c.height)
    else:
        x, y = int(anchor[0]), int(anchor[1])
    canvas.alpha_composite(c, (x, y))
    return c.size


def frames():
    k_t, k_s = frame_scales()
    bd = Image.open(f'{ART39}/backdrops/gagazet.png').convert('RGB')
    bd = bd.resize((3840, round(bd.height * 3840 / bd.width)), Image.LANCZOS)
    top = (bd.height - 2160) // 2
    bd = bd.crop((0, top, 3840, top + 2160)).convert('RGBA')
    os.makedirs(f'{OUT}/frames', exist_ok=True)
    tidus_cols = dict(columns('tidus/idle', 0))
    sey_cols = dict(columns('seymour-flux-body/idle', 0))
    order = [('today', 'Today (R39 + E)')] + [(k, f'{LABEL[k]} (seed 1)') for k in ('s1', 's2', 's3z', 's3k')]
    for key, lab in order:
        canvas = bd.copy()
        sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(sh)
        feet_x = (TIDUS_READY_BOX[0] + TIDUS_READY_BOX[2]) / 2 - 40
        feet_y = TIDUS_READY_BOX[3]
        d.ellipse((feet_x - 230, feet_y - 26, feet_x + 230, feet_y + 40), fill=(0, 0, 10, 120))
        sh = sh.filter(ImageFilter.GaussianBlur(18))
        canvas.alpha_composite(sh)
        t_im = tidus_cols.get('Today (R39 + E)') if key == 'today' else tidus_cols.get(lab)
        s_im = sey_cols.get('Today (R39 + E)') if key == 'today' else sey_cols.get(lab)
        if t_im is not None:
            paste_fig(canvas, t_im, k_t, (feet_x, feet_y), 'feet')
        if s_im is not None:
            paste_fig(canvas, s_im, k_s, (SEYMOUR_BOX[0], SEYMOUR_BOX[1]), 'top')
        out = f'{OUT}/frames/battle-frame-{FILE[key]}.jpg'
        canvas.convert('RGB').save(out, quality=90)
        say(f'{out}')


if __name__ == '__main__':
    mode = sys.argv[1]
    its = sys.argv[2:] or ITEMS
    if mode == 'masters':
        for it in its:
            masters(it)
    elif mode == 'sheets':
        for it in its:
            for si in (0, 1):
                sheets(it, si)
    elif mode == 'frames':
        frames()
