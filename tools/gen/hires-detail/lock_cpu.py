"""lock_cpu.py: the CPU half of the painterly identity-lock round (candidates only).

  python lock_cpu.py sweep <item> ...          measure and draw the lock-strength sweep (2x outputs, matted with rembg, no edge treatment)
  python lock_cpu.py build <tag> <facetag> <item> ...    4x masters of the chosen lock for both seeds: L1 (the Klein pass), L2 (+ the face pass), L3 (+ the palette lock), cut out and edge-treated like round one
  python lock_cpu.py numbers                   the tables of the README (numbers.json, tables.md)
  python lock_cpu.py sheets | frames <dir> | yuna <dir>
"""
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
sys.path.insert(0, 'D:/pyrefly-r39-art/tools/gen/hires-alpha-fix')
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/closeup-art/tools')
from lock_lib import *
import edge_e
import qc
from PIL import ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter
from skimage.color import rgb2lab, lab2rgb

SWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/style-work'
BG = (58, 60, 70)
FONT = ImageFont.truetype('arial.ttf', 16)
FIG_H_4K = {'tidus/idle': 713, 'yuna-gunner/idle': 713, 'seymour-flux-body/idle': 864}
LABEL = {'today': 'Today (R39 + E)', 's2': 'S2 (last round)', 'mr': 'A refs only', 'l1': 'B refs + light init lock', 'l2': 'C = B + palette lock', 'l3': 'D = B + face pass + palette lock'}
DIRS = ('mr', 'l1', 'l2', 'l3')
_sess = [None]
_clip = [None]


def matte(rgb_img):
    if _sess[0] is None:
        os.environ.setdefault('U2NET_HOME', 'D:/Tools/ComfyUI/rembg-models')
        from rembg import new_session
        _sess[0] = new_session('isnet-anime')
    from rembg import remove
    return remove(rgb_img.convert('RGB'), session=_sess[0])


def clip():
    if _clip[0] is None:
        import clipsim
        _clip[0] = clipsim
    return _clip[0]


def approved1x(item):
    sid, state = item.split('/')
    return Image.open(f'{ART39}/characters/{sid}/{state}.png').convert('RGBA')


def mdir(item):
    d = f'{OUT}/masters/{item.replace("/", "-")}'
    os.makedirs(d, exist_ok=True)
    return d


def head_window(im, item, scale):
    """The head box (approved 1x px x scale) of an image, on white, 224 px square (the CLIP window)."""
    x0, y0, x1, y1 = [v * scale for v in BOX[item]['head']]
    w = flat_white(im) if im.mode == 'RGBA' else im.convert('RGB')
    return w.crop((int(x0), int(y0), int(x1), int(y1))).resize((224, 224), Image.LANCZOS)


def ref_emb(item):
    return clip().embed(head_window(today4(item), item, 4))


_style = {}


def fig_window(im):
    """The whole figure (its bounding box) on white, padded to a square, 224 px: the CLIP window of the finish."""
    bb = bbox_of(im)
    w = flat_white(im.crop(bb))
    n = max(w.size)
    sq = Image.new('RGB', (n, n), (255, 255, 255))
    sq.paste(w, ((n - w.width) // 2, (n - w.height) // 2))
    return sq.resize((224, 224), Image.LANCZOS)


def style_refs(item):
    if item not in _style:
        s2 = Image.open(f'{STYLE}/masters/{item.replace("/", "-")}/s2-s9101+E@4x.png').convert('RGBA')
        _style[item] = (clip().embed(fig_window(today4(item))), clip().embed(fig_window(s2)))
    return _style[item]


def lab_scaled(im, k):
    """Premultiplied k-times box downscale of an RGBA image: (Lab, alpha)."""
    a = np.asarray(im.getchannel('A'), dtype=np.float32) / 255.0
    rgb = np.asarray(im.convert('RGB'), dtype=np.float32) / 255.0
    h, w = im.height // k, im.width // k
    pm = (rgb[:h * k, :w * k] * a[:h * k, :w * k, None]).reshape(h, k, w, k, 3).mean((1, 3))
    a1 = a[:h * k, :w * k].reshape(h, k, w, k).mean((1, 3))
    rgb1 = np.where(a1[..., None] > 1e-3, pm / np.maximum(a1[..., None], 1e-3), 0.0)
    return rgb2lab(np.clip(rgb1, 0, 1)), a1


def cell_drift(item, rgba, scale, cell=40):
    """Where a costume part changed colour or was lost: the figure is cut into 40 px cells of the approved painting; per cell the mean Lab colour of the candidate against the approved one.
    Returns the 90th percentile of the cells' dE and the share of cells that moved by more than 20 (a hood gone beige, a trouser leg gone to skin, a part turned another colour)."""
    lr, ar = lab_scaled(today4(item), 4)
    lc, ac = lab_scaled(rgba, scale)
    h, w = min(ar.shape[0], ac.shape[0]), min(ar.shape[1], ac.shape[1])
    des = []
    for y in range(0, h - cell + 1, cell):
        for x in range(0, w - cell + 1, cell):
            wr, wc = ar[y:y + cell, x:x + cell], ac[y:y + cell, x:x + cell]
            if min(wr.mean(), wc.mean()) < 0.6:
                continue
            mr_ = (lr[y:y + cell, x:x + cell] * wr[..., None]).sum((0, 1)) / wr.sum()
            mc_ = (lc[y:y + cell, x:x + cell] * wc[..., None]).sum((0, 1)) / wc.sum()
            des.append(float(np.sqrt(((mr_ - mc_) ** 2).sum())))
    des = np.array(des) if des else np.zeros(1)
    return {'cell_dE_p90': round(float(np.percentile(des, 90)), 2), 'cells_over20': round(float((des > 20).mean()), 4), 'cells': int(len(des))}


def measure(item, rgba, scale, emb=None):
    """qc.likeness against the approved 1x painting, the CLIP face likeness of the head window, and the finish margin: how much closer the whole figure is, in CLIP, to last round's
    painterly S2 than to today's cel master (positive = painterly finish kept, negative = back to the cel look)."""
    q = qc.likeness(approved1x(item), rgba)
    q['face_cos'] = round(clip().cos(emb if emb is not None else ref_emb(item), clip().embed(head_window(rgba, item, scale))), 4)
    e = clip().embed(fig_window(rgba))
    et, es = style_refs(item)
    q['finish_margin'] = round(clip().cos(e, es) - clip().cos(e, et), 4)
    q.update(cell_drift(item, rgba, scale))
    return q


def cut(rgb_img, E=True):
    """rembg matte + the edge treatment E with the matte as its own contour (the round-one recipe for S2)."""
    rgba = np.asarray(matte(rgb_img))
    if not E:
        return Image.fromarray(rgba, 'RGBA')
    NE, met = edge_e.apply_E(rgba, rgba, 1, sigma=2.5, delta=2.4, ramp=1.5, band=8, bleed_px=24, core_px=10)
    return Image.fromarray(NE, 'RGBA')


def flat(im, bg=BG):
    b = Image.new('RGB', im.size, bg)
    b.paste(im, mask=im.getchannel('A'))
    return b


def bbox_of(im):
    a = np.asarray(im.getchannel('A'))
    ys, xs = np.nonzero(a > 128)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def mapped_cell(img, bb, pb, box, h):
    """A crop of `img` (flattened) for the approved-painting box `box` (1x px), found through the same fractions of each figure's own bounding box; resized to height h."""
    pw, ph = pb[2] - pb[0], pb[3] - pb[1]
    fx0, fy0, fx1, fy1 = (box[0] - pb[0]) / pw, (box[1] - pb[1]) / ph, (box[2] - pb[0]) / pw, (box[3] - pb[1]) / ph
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    c = img.crop((int(bb[0] + fx0 * bw), int(bb[1] + fy0 * bh), int(bb[0] + fx1 * bw), int(bb[1] + fy1 * bh)))
    return c.resize((max(1, round(c.width * h / c.height)), h), Image.LANCZOS)


def sheet_rows(item, cols, out, h_fig, h_crop=300):
    """cols: [(label, RGBA image)]. Row 0: every whole figure at h_fig; then one row per crop (head, costume boxes), same fractions of each figure's own box."""
    pb = bbox_of(approved1x(item))
    bbs = [bbox_of(im) for _, im in cols]
    figs = []
    for (lab, im), bb in zip(cols, bbs):
        f = flat(im).crop(bb)
        figs.append(f.resize((round(f.width * h_fig / f.height), h_fig), Image.LANCZOS))
    rows = [('head', BOX[item]['head'])] + [(f'costume {i + 1}', b) for i, b in enumerate(BOX[item]['costume'])]
    flats = [flat(im) for _, im in cols]
    crops = [[mapped_cell(f, bb, pb, box, h_crop) for f, bb in zip(flats, bbs)] for _, box in rows]
    Wd = max(sum(f.width for f in figs) + 6 * len(figs), max(sum(c.width for c in cs) + 6 * len(cs) for cs in crops))
    H = 28 + h_fig + sum(h_crop + 22 for _ in rows)
    sheet = Image.new('RGB', (Wd, H), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    x = 0
    for (lab, _), f in zip(cols, figs):
        d.text((x + 4, 4), lab if f.width < 420 else f'{lab}  ({h_fig} px tall = a 4K battle frame)', fill=(235, 235, 235), font=FONT)
        sheet.paste(f, (x, 28))
        x += f.width + 6
    y = 28 + h_fig
    for (name, _), cs in zip(rows, crops):
        x = 0
        for (lab, _), c in zip(cols, cs):
            d.text((x + 4, y + 2), f'{name}: {lab.split(" (")[0]}', fill=(255, 220, 120), font=FONT)
            sheet.paste(c, (x, y + 22))
            x += c.width + 6
        y += h_crop + 22
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.save(out, quality=88)
    say(f'{out} {sheet.size}')


# ----------------------------------------------------------------------------------------------------------------- the sweep
def sweep(item):
    d = tag_dir(item)
    P = approved1x(item)
    emb = ref_emb(item)
    cols = [('Today', today4(item).resize((P.width * 2, P.height * 2), Image.LANCZOS))]
    res = {}
    srcs = [('S2 last round', f'{SWORK}/{item.replace("/", "-")}/s2-s9101-2x.png')] + [(t, f'{d}/{t}-s9101-2x.png') for t in ('mr', 'sA', 'sB', 'sC', 'sD', 'sE', 'sF', 'sG', 'sH', 'sI', 'sGn')] + [(t, f'{d}/{t}-s9102-2x.png') for t in ('mr', 'sE', 'sF', 'sG', 'sGn')]
    for lab, p in srcs:
        if not os.path.exists(p):
            continue
        rgba = cut(Image.open(p).convert('RGB'), E=False)
        lab = lab + (' s2' if p.endswith('s9102-2x.png') else '')
        res[lab] = measure(item, rgba, 2, emb)
        cols.append((lab, rgba))
    json.dump(res, open(f'{d}/sweep-results.json', 'w'), indent=1)
    sheet_rows(item, cols, f'{OUT}/sheets/sweep-{item.replace("/", "-")}.jpg', 620)
    for k, v in res.items():
        print(f'{k:14s} cells>20 {v["cells_over20"]:.3f} p90 {v["cell_dE_p90"]:5.1f} finish {v["finish_margin"]:+.3f} iou {v["alpha_iou"]:.4f} face {v["face_cos"]:.3f} ssim {v["ssim"]:.3f} dE {v["dE_mean"]:.1f} p95 {v["dE_p95"]:.1f} w1 {v["palette_w1"]:.2f} edge {v["edge_corr"]:.3f}')


# ------------------------------------------------------------------------------------------------- L2 face pass, L3 palette lock
def composite_face(item, rgb4, face, ring=0.2):
    """Paste the face pass over the head box of the 4x figure on white: an ellipse with a soft edge, the face pass colour-matched to the figure on the ring around the ellipse."""
    x0, y0, x1, y1 = [int(v * 4) for v in BOX[item]['head']]
    bw, bh = x1 - x0, y1 - y0
    f = face.resize((bw, bh), Image.LANCZOS)
    A = np.asarray(rgb4.crop((x0, y0, x1, y1))).astype(np.float32)
    Fa = np.asarray(f).astype(np.float32)
    yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
    rr = np.sqrt(((xx - (bw - 1) / 2) / (0.38 * bw)) ** 2 + ((yy - (bh - 1) / 2) / (0.44 * bh)) ** 2)
    mask = gaussian_filter(np.clip((1.0 - rr) / ring + 0.5, 0, 1), 0.01 * bw)
    ann = (rr > 0.8) & (rr < 1.3) & (A.min(-1) < 235) & (Fa.min(-1) < 235)
    if ann.sum() > 500:
        la, lf = rgb2lab(A / 255.0), rgb2lab(Fa / 255.0)
        for c in range(3):
            ma, mf = la[..., c][ann].mean(), lf[..., c][ann].mean()
            k = float(np.clip((la[..., c][ann].std() + 1e-3) / (lf[..., c][ann].std() + 1e-3), 0.8, 1.25)) if c else 1.0
            lf[..., c] = (lf[..., c] - mf) * k + ma
        Fa = np.clip(lab2rgb(lf), 0, 1) * 255.0
    out = A * (1 - mask[..., None]) + Fa * mask[..., None]
    res = rgb4.copy()
    res.paste(Image.fromarray(np.uint8(np.clip(out, 0, 255) + 0.5), 'RGB'), (x0, y0))
    return res


def lab1x(im4):
    """Premultiplied 4x -> 1x box downscale of an RGBA image: (Lab, alpha)."""
    a4 = np.asarray(im4.getchannel('A'), dtype=np.float32) / 255.0
    rgb4 = np.asarray(im4.convert('RGB'), dtype=np.float32) / 255.0
    h, w = im4.height // 4, im4.width // 4
    pm = (rgb4[:h * 4, :w * 4] * a4[:h * 4, :w * 4, None]).reshape(h, 4, w, 4, 3).mean((1, 3))
    a1 = a4[:h * 4, :w * 4].reshape(h, 4, w, 4).mean((1, 3))
    rgb1 = np.where(a1[..., None] > 1e-3, pm / np.maximum(a1[..., None], 1e-3), 0.0)
    return rgb2lab(np.clip(rgb1, 0, 1)), a1


def smooth(lab, w, s):
    num = np.stack([gaussian_filter(lab[..., c] * w, s) for c in range(3)], -1)
    den = gaussian_filter(w, s)
    return num / np.maximum(den, 1e-4)[..., None], den


def palette_lock(item, rgba4, strength=0.85, sigma=5.0, lam_l=0.6, dmax=(14.0, 22.0)):
    """Per-region palette lock: the low-frequency Lab colour of the cut-out is moved toward the approved painting's (masked normalised blur at 5 px of the 1x painting, outlines and the
    transparent area left out); the brushwork on top is untouched. Where the two disagree wildly (a part that moved) the move is capped."""
    lr, ar = lab1x(today4(item))
    lo, ao = lab1x(rgba4)
    wr = ar * np.clip((lr[..., 0] - 14.0) / 16.0, 0, 1)
    wo = ao * np.clip((lo[..., 0] - 14.0) / 16.0, 0, 1)
    sr, dr = smooth(lr, wr, sigma)
    so, do = smooth(lo, wo, sigma)
    valid = gaussian_filter(((dr > 0.08) & (do > 0.08)).astype(np.float32), 1.5)
    delta = (sr - so) * valid[..., None]
    delta[..., 0] = np.clip(delta[..., 0] * lam_l, -dmax[0], dmax[0])
    delta[..., 1:] = np.clip(delta[..., 1:], -dmax[1], dmax[1])
    H4, W4 = rgba4.height, rgba4.width
    d4 = np.stack([np.asarray(Image.fromarray(np.ascontiguousarray(delta[..., c], dtype=np.float32), 'F').resize((W4, H4), Image.BICUBIC)) for c in range(3)], -1)
    lab4 = rgb2lab(np.asarray(rgba4.convert('RGB'), dtype=np.float32) / 255.0) + strength * d4
    out = (np.clip(lab2rgb(lab4), 0, 1) * 255.0 + 0.5).astype(np.uint8)
    return Image.fromarray(np.dstack([out, np.asarray(rgba4.getchannel('A'))]), 'RGBA')


def build(tag, facetag, item):
    """The 4x cut-outs of every method, both seeds (the 4x images are ESRGAN of the Klein 2x outputs, on white):
    mr = A, the references alone; l1 = B, the references + the light init lock `tag`; l2 = C, B + the palette lock; l3 = D, B + the face pass `facetag` pasted in + the palette lock."""
    d, md = tag_dir(item), mdir(item)
    rp = f'{md}/results.json'
    res = json.load(open(rp)) if os.path.exists(rp) else {}
    emb = ref_emb(item)

    def keep(key, sd, make):
        dst = f'{md}/{key}-s{sd}+E@4x.png'
        if os.path.exists(dst) and f'{key}-s{sd}' in res:
            return Image.open(dst).convert('RGBA')
        t0 = time.time()
        im = make()
        im.save(dst + '.tmp', 'PNG', compress_level=6)
        os.replace(dst + '.tmp', dst)
        res[f'{key}-s{sd}'] = {'qc': measure(item, im, 4, emb), 'seconds': round(time.time() - t0, 1)}
        json.dump(res, open(rp, 'w'), indent=1)
        say(f'{item} {key}-s{sd}: {res[f"{key}-s{sd}"]["qc"]}')
        return im

    for sd in SEEDS:
        p_mr = f'{d}/mr-s{sd}-4x.png'
        if os.path.exists(p_mr):
            keep('mr', sd, lambda: cut(Image.open(p_mr).convert('RGB')))
        src = f'{d}/{tag}-s{sd}-4x.png'
        if not os.path.exists(src):
            continue
        rgb4 = Image.open(src).convert('RGB')
        l1 = keep('l1', sd, lambda: cut(rgb4))
        keep('l2', sd, lambda: palette_lock(item, l1))
        face_p = f'{d}/{facetag}-s{sd}.png'
        if os.path.exists(face_p):
            keep('l3', sd, lambda: palette_lock(item, cut(composite_face(item, rgb4, Image.open(face_p).convert('RGB')))))


# ------------------------------------------------------------------------------------------------------ numbers, sheets, frames
def master(item, key, seed_idx):
    """Today, last round's S2, or a lock method's 4x cut-out (seed_idx 0 or 1)."""
    sid = item.replace('/', '-')
    if key == 'today':
        return today4(item)
    if key == 's2':
        return Image.open(f'{STYLE}/masters/{sid}/s2-s{SEEDS[seed_idx]}+E@4x.png').convert('RGBA')
    p = f'{mdir(item)}/{key}-s{SEEDS[seed_idx]}+E@4x.png'
    return Image.open(p).convert('RGBA') if os.path.exists(p) else None


def numbers(keys=('s2',) + DIRS):
    """Every measure for every subject, method and seed (cached in numbers.json), plus the seed gap: the face likeness between the two seeds and the silhouette IoU between them."""
    npth = f'{OUT}/numbers.json'
    res = json.load(open(npth)) if os.path.exists(npth) else {}
    for item in ITEMS:
        emb = ref_emb(item)
        r = res.setdefault(item, {})
        for key in keys:
            ims = []
            for si in (0, 1):
                im = master(item, key, si)
                ims.append(im)
                if im is not None and f'{key}-s{SEEDS[si]}' not in r:
                    r[f'{key}-s{SEEDS[si]}'] = measure(item, im, 4, emb)
                    say(f'{item} {key}-s{SEEDS[si]} measured')
            if all(i is not None for i in ims) and f'{key}-gap' not in r:
                e0, e1 = (clip().embed(head_window(i, item, 4)) for i in ims)
                a0, a1 = (np.asarray(i.getchannel('A')) > 127 for i in ims)
                f0, f1 = (clip().embed(fig_window(i)) for i in ims)
                r[f'{key}-gap'] = {'face_cos': round(clip().cos(e0, e1), 4), 'figure_cos': round(clip().cos(f0, f1), 4), 'silhouette_iou': round(float((a0 & a1).sum() / max(1, (a0 | a1).sum())), 4)}
            json.dump(res, open(npth, 'w'), indent=1)
    return res


def sheets(keys=('today', 's2') + DIRS):
    for item in ITEMS:
        for si in (0, 1):
            cols = []
            for k in keys:
                im = master(item, k, si)
                if im is not None:
                    cols.append((LABEL[k], im))
            sheet_rows(item, cols, f'{OUT}/sheets/{item.replace("/", "-")}-lock-seed{si + 1}.jpg', FIG_H_4K[item])


def frames(bests):
    import style_cpu as SC
    k_t, k_s = SC.frame_scales()
    bd = Image.open(f'{ART39}/backdrops/gagazet.png').convert('RGB')
    bd = bd.resize((3840, round(bd.height * 3840 / bd.width)), Image.LANCZOS)
    top = (bd.height - 2160) // 2
    bd = bd.crop((0, top, 3840, top + 2160)).convert('RGBA')
    os.makedirs(f'{OUT}/frames', exist_ok=True)
    for key in ('today', 's2') + tuple(bests):
        canvas = bd.copy()
        sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        feet_x = (SC.TIDUS_READY_BOX[0] + SC.TIDUS_READY_BOX[2]) / 2 - 40
        feet_y = SC.TIDUS_READY_BOX[3]
        ImageDraw.Draw(sh).ellipse((feet_x - 230, feet_y - 26, feet_x + 230, feet_y + 40), fill=(0, 0, 10, 120))
        canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
        t_im, s_im = master('tidus/idle', key, 0), master('seymour-flux-body/idle', key, 0)
        if t_im is not None:
            SC.paste_fig(canvas, t_im, k_t, (feet_x, feet_y), 'feet')
        if s_im is not None:
            SC.paste_fig(canvas, s_im, k_s, (SC.SEYMOUR_BOX[0], SC.SEYMOUR_BOX[1]), 'top')
        out = f'{OUT}/frames/battle-frame-{ {"today": "today", "s2": "s2-last-round", "mr": "A-refs-only", "l1": "B-init-lock", "l2": "C-palette-lock", "l3": "D-face-pass-palette-lock"}[key]}.jpg'
        canvas.convert('RGB').save(out, quality=90)
        say(out)


def yuna(bests, h=1400):
    item = 'yuna-gunner/idle'
    cols = [('Today (R39 + E)', master(item, 'today', 0)), ('S2 (last round), seed 1', master(item, 's2', 0))]
    for b in bests:
        for si in (0, 1):
            cols.append((f'{LABEL[b]}, seed {si + 1}', master(item, b, si)))
    figs = []
    for lab, im in cols:
        f = flat(im).crop(bbox_of(im))
        figs.append((lab, f.resize((round(f.width * h / f.height), h), Image.LANCZOS)))
    W = sum(f.width for _, f in figs) + 8 * len(figs)
    sheet = Image.new('RGB', (W, h + 28), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    x = 0
    for lab, f in figs:
        d.text((x + 4, 4), lab if f.width > 300 else lab.split(' (')[0].split(' ')[0], fill=(235, 235, 235), font=FONT)
        sheet.paste(f, (x, 28))
        x += f.width + 8
    os.makedirs(f'{OUT}/yuna-gunner', exist_ok=True)
    sheet.save(f'{OUT}/yuna-gunner/yuna-gunner-whole-figure.jpg', quality=90)
    say(f'yuna whole figure {sheet.size}')


def head_struct(item, rgba, scale, sigma=2.0):
    """Finish-independent facial structure: the head window (224 px) in luminance, blurred, its gradient magnitude correlated with the approved head's. A painted face with the same
    eyes, brows, nose and mouth in the same places scores high even without the cel outlines; a redrawn face does not."""
    def grad(im):
        g = np.asarray(im.convert('L'), dtype=np.float32)
        g = gaussian_filter(g, sigma)
        gy, gx = np.gradient(g)
        return np.hypot(gx, gy).ravel()
    a = grad(head_window(today4(item), item, 4))
    b = grad(head_window(rgba, item, scale))
    return round(float(np.corrcoef(a, b)[0, 1]), 4)


def extra_numbers():
    npth = f'{OUT}/numbers.json'
    res = json.load(open(npth))
    for item in ITEMS:
        r = res.setdefault(item, {})
        for key in ('s2',) + DIRS:
            for si in (0, 1):
                k = f'{key}-s{SEEDS[si]}'
                im = master(item, key, si)
                if im is not None and k in r:
                    r[k]['head_struct'] = head_struct(item, im, 4)
        r['today-self'] = 1.0
    json.dump(res, open(npth, 'w'), indent=1)
    for item in ITEMS:
        print(item, {k: v.get('head_struct') for k, v in res[item].items() if isinstance(v, dict) and 'head_struct' in v})


def cut_approved(item, rgb4, name):
    """The cut-out for a geometry-locked output: the approved painting's own alpha, the rim rebuilt and the colour bled (the round-one S1 path, pilot_cpu.finish), then E.
    Used where the silhouette is held (B, C, D); where it moved (A, last round's S2) the rembg matte stays."""
    import pilot_cpu as PC
    tmp = f'{LWORK}/_tmp-{os.getpid()}-{name}.png'
    rgb4.save(tmp, compress_level=1)
    try:
        P, N, ref, plain = PC.finish(item, name, tmp)
    finally:
        os.remove(tmp)
    NE, met = edge_e.apply_E(P, N, 4)
    return Image.fromarray(NE, 'RGBA')


def deliver(tag, facetag, item):
    """Re-make B, C, D with the approved alpha. The rembg-cut versions that the numbers were measured on move to masters/<subject>/_rembg-cut/."""
    d, md = tag_dir(item), mdir(item)
    old = f'{md}/_rembg-cut'
    os.makedirs(old, exist_ok=True)
    for sd in SEEDS:
        src = f'{d}/{tag}-s{sd}-4x.png'
        rgb4 = Image.open(src).convert('RGB')
        done = f'{md}/l3-s{sd}+E@4x.png'
        if os.path.exists(f'{old}/l3-s{sd}+E@4x.png'):
            continue
        for key in ('l1', 'l2', 'l3'):
            p = f'{md}/{key}-s{sd}+E@4x.png'
            if os.path.exists(p):
                os.replace(p, f'{old}/{key}-s{sd}+E@4x.png')
        t0 = time.time()
        l1 = cut_approved(item, rgb4, f'l1s{sd}')
        l1.save(f'{md}/l1-s{sd}+E@4x.png', 'PNG', compress_level=6)
        l2 = palette_lock(item, l1)
        l2.save(f'{md}/l2-s{sd}+E@4x.png', 'PNG', compress_level=6)
        face = Image.open(f'{d}/{facetag}-s{sd}.png').convert('RGB')
        l3 = palette_lock(item, cut_approved(item, composite_face(item, rgb4, face), f'l3s{sd}'))
        l3.save(f'{md}/l3-s{sd}+E@4x.png', 'PNG', compress_level=6)
        say(f'{item} seed {sd}: B, C, D cut with the approved alpha in {time.time() - t0:.0f} s')


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'sweep':
        for it in sys.argv[2:]:
            sweep(it)
    elif mode == 'deliver':
        for it in sys.argv[4:]:
            deliver(sys.argv[2], sys.argv[3], it)
    elif mode == 'extra':
        extra_numbers()
    elif mode == 'numbers':
        numbers()
    elif mode == 'sheets':
        sheets()
    elif mode == 'frames':
        frames(sys.argv[2:])
    elif mode == 'yuna':
        yuna(sys.argv[2:])
    elif mode == 'build':
        for it in sys.argv[4:]:
            build(sys.argv[2], sys.argv[3], it)
