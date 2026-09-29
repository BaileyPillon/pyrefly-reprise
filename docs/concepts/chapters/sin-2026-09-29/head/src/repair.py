"""Sin's head, option C (FFX only, 2026-09-29): the repair list on round 3's layered rig.

Round 3 (docs/concepts/chapters/sin-2026-09-27/head-round3/) is option C (three-quarter, the whale-like head turned to
the ship, golden hour over Bevelle) with the wings the sources describe (feathery, purple at the tips) and the white
tower under the claw. Its one painting is cut into layers and only the lower jaw turns, so the five mouth stages are one
creature. This pass mends what its README and round 1 left open, each fix made ONCE, so it holds in every stage:

  1 the stage-4 tusk      a pair of oversized curved fangs and a dark ring at the chin: our paint-over of a small crop,
                          blended by a masked pass (gen.py patch), pasted back and smoothed (tusk-*)
  2 the back of the mouth a violet strip of mouth interior sat under the painted upper lip in the static top layer,
  3 the teeth fringe      and the lower teeth showed under the top row at stage 0. The turned jaw is clipped under the
                          skull's edge (rig), and stage 0 darkens the strip to a shut seam (lip-seam). Dropped routes:
                          moving the strip to the throat by colour (it took hide), and a GPU lip patch (it painted an
                          open slit); see ../README.md.
  4 the chin sliver       a faint outline of the open jaw's underside sat in the static top layer, and the jaw's edge
                          carried sky-coloured pixels that ride along with it: both cleared (rig)
  + the white glints      small white specks over the head (round 3's list): replaced by their surroundings (glints)

  python repair.py tusk-prep  <master.png> <out_dir> <plate.png>
  python repair.py tusk-sketch <out_dir>
  python repair.py tusk-paste <master.png> <patch.png> <out.png>
  python repair.py tusk-smooth <in.png> <out.png>
  python repair.py glints     <in.png> <plate.png> <out.png> [rig.json]
  python repair.py rig        <plate.png> <master.png> <rig.json> <out_dir> <dressedPlate.png> <regionMask.png> [shutDeg]
  python repair.py lip-prep   <rig_dir> <rig.json>
  python repair.py lip-seam   <rig_dir> <rig.json>
  python repair.py lip-paste  <rig_dir> <patch.png>
Our own pixels only (the master is round 3's b1-final, painted from our code-drawn sketch); no retail image anywhere.
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# the crop for the tusk repair, full-size painting pixels (2352x1344), aspect 1344:768
CROP = (968, 580, 1240, 735.4)
TUSK = [(1030, 655), (1050, 640), (1085, 628), (1125, 628), (1146, 650), (1150, 690), (1137, 707), (1090, 716), (1060, 728), (1030, 724), (1022, 700)]


def poly(size, pts, grow=0, blur=0.0):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255)
    if grow > 0:
        m = m.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    elif grow < 0:
        m = m.filter(ImageFilter.MinFilter(-grow * 2 + 1))
    if blur:
        m = m.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(m, float) / 255


def rgba(rgb, alpha):
    a = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), a]), 'RGBA')


# ---- 1 the tusk ----------------------------------------------------------------------------------------------------
def tusk_prep(master, out, plate=None):
    os.makedirs(out, exist_ok=True)
    im = Image.open(master).convert('RGB')
    x0, y0, x1, y1 = CROP
    sc = 1344 / (x1 - x0)
    im.crop((int(x0), int(y0), int(round(x1)), int(round(y1)))).resize((1344, 768), Image.LANCZOS).save(f'{out}/tusk-crop.png')
    if plate:
        Image.open(plate).convert('RGB').crop((int(x0), int(y0), int(round(x1)), int(round(y1)))).resize((1344, 768), Image.LANCZOS).save(f'{out}/tusk-plate.png')
    m = Image.new('L', (1344, 768), 0)
    ImageDraw.Draw(m).polygon([((x - x0) * sc, (y - y0) * sc) for x, y in TUSK], fill=255)
    m.filter(ImageFilter.GaussianBlur(6)).save(f'{out}/tusk-mask.png')
    print('crop x', sc)


def tusk_sketch(out):
    """After LOOKING at pass 1 (0.62 and 0.74 kept a big central fang and turned the chin to pebbles): paint the fix
    into the crop ourselves, then let a low-strength pass blend it. In crop pixels (1344x768): above the lower lip
    line the mouth interior's own colours, below it the jaw's own dark lip band and pale plates, then a row of short
    even teeth along the lip, the size of the jaw's other teeth."""
    im = Image.open(f'{out}/tusk-crop.png').convert('RGB')
    a = np.asarray(im, float)
    lip = [(300, 584), (350, 570), (520, 524), (720, 476), (920, 424), (1120, 366), (1340, 296)]
    Hh, Ww = a.shape[:2]
    yy, xx = np.mgrid[0:Hh, 0:Ww]
    ly = np.interp(xx, [p[0] for p in lip], [p[1] for p in lip])
    m = np.asarray(Image.open(f'{out}/tusk-mask.png').convert('L'), float) / 255
    pl = np.asarray(Image.open(f'{out}/tusk-plate.png').convert('RGB'), float)
    creature = np.asarray(Image.fromarray(((np.abs(a - pl).max(axis=2) > 30) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.MinFilter(47)), float) / 255
    lumc = a.mean(axis=2)
    pick = (m > 0.5) & (yy < ly) & (lumc < 70) & (creature > 0.5)
    inner = np.median(a[pick], axis=0) if pick.sum() > 50 else a[200:320, 760:1040].reshape(-1, 3).mean(axis=0)
    band = a[380:410, 1120:1280].reshape(-1, 3).mean(axis=0)             # the jaw's dark lip band
    plate = a[600:660, 940:1120].reshape(-1, 3).mean(axis=0)            # the jaw's pale lower plates
    fill = np.where((yy < ly)[..., None], inner * (0.85 + 0.15 * np.clip((ly - yy) / 120, 0, 1))[..., None],
                    np.where((yy < ly + 60)[..., None], band, plate))
    rng = np.random.default_rng(5)
    fill = fill + rng.normal(0, 4, fill.shape)
    w = (np.clip(m * 1.4, 0, 1) * creature)[..., None]
    res = Image.fromarray(np.clip(a * (1 - w) + fill * w, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(res)
    for x0 in range(380, 960, 72):                                     # short even teeth standing on the lip
        y0 = float(np.interp(x0, [p[0] for p in lip], [p[1] for p in lip])) + 6
        d.polygon([(x0 - 22, y0), (x0 - 4, y0 - 86), (x0 + 22, y0)], fill=(226, 218, 200))
        d.polygon([(x0 + 1, y0 - 76), (x0 + 22, y0), (x0 + 5, y0)], fill=(176, 164, 152))
    # pass 3 (after LOOKING at pass 2): a rounded chin cap in the jaw's own colours, and the seam line kept inside the
    # creature (pass 2 drew it on into the sky)
    d.ellipse([300, 560, 430, 700], fill=tuple(int(v) for v in band))
    d.ellipse([318, 618, 440, 712], fill=tuple(int(v) for v in plate))
    ln = Image.new('L', res.size, 0)
    ImageDraw.Draw(ln).line([(p[0], p[1] + 60) for p in lip], fill=255, width=6)
    lm = np.asarray(ln, float)[..., None] / 255 * creature[..., None]
    r = np.asarray(res, float)
    r = r * (1 - lm) + np.array((46, 46, 56), float) * lm
    Image.fromarray(np.clip(r, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)).save(f'{out}/tusk-sketched.png')


def tusk_smooth(src, out):
    """After LOOKING at stage 1 with tusk-5 in: the patch painted thin vertical streaks in the mouth interior above the
    new teeth (they read as curtains, a round-2 fault). Inside the tusk region (grown), every dark interior pixel (not a
    tooth, not the grey jaw) takes a heavy blur of the interior's own dark pixels, plus a faint grain."""
    im = Image.open(src).convert('RGB')
    a = np.asarray(im, float)
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).polygon(TUSK, fill=255)
    reg = np.asarray(m.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.GaussianBlur(6)), float) / 255
    lum = a.mean(axis=2)
    dark = np.clip((95 - lum) / 20, 0, 1) * ((a[..., 0] - a[..., 1]) > 8)
    w = reg * dark
    def bl(x, r):
        return np.asarray(Image.fromarray(np.clip(x, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), float)
    den = bl(dark * 255, 10)[..., None] / 255
    num = np.dstack([bl(a[..., c] * dark, 10) for c in range(3)])
    sm = np.where(den > 0.05, num / np.maximum(den, 1e-3), a) + np.random.default_rng(3).normal(0, 1.5, a.shape)
    res = a * (1 - w[..., None]) + sm * w[..., None]
    Image.fromarray(np.clip(res, 0, 255).astype(np.uint8)).save(out)
    print('tusk interior smoothed:', int((w > 0.5).sum()), 'px')


def tusk_paste(master, patch, out):
    im = Image.open(master).convert('RGB')
    x0, y0, x1, y1 = CROP
    w, h = int(round(x1)) - int(x0), int(round(y1)) - int(y0)
    p = Image.open(patch).convert('RGB').resize((w, h), Image.LANCZOS)
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).polygon(TUSK, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(2.5)).crop((int(x0), int(y0), int(x0) + w, int(y0) + h))
    im.paste(p, (int(x0), int(y0)), m)
    im.save(out)
    print('pasted', patch, '->', out)


# ---- + the glints ---------------------------------------------------------------------------------------------------
def glints(src, plate, out, rig_p=None):
    """Small bright specks on the creature (not on the plate, not the teeth, not the eye): replaced by the median of
    their surroundings. A speck = a pixel far brighter than its 9x9 median, in a bright blob under ~60 px."""
    im = Image.open(src).convert('RGB')
    a = np.asarray(im, float)
    pl = np.asarray(Image.open(plate).convert('RGB'), float)
    creature = np.abs(a - pl).max(axis=2) > 30
    lum = a.mean(axis=2)
    med = np.asarray(im.filter(ImageFilter.MedianFilter(9)), float)
    bright = (lum - med.mean(axis=2) > 45) & creature
    # teeth are big pale blobs: drop any bright region that survives a 5x5 opening
    b = Image.fromarray((bright * 255).astype(np.uint8))
    big = np.asarray(b.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(9)), float) > 0
    spk = bright & ~big
    # never touch the amber eye (the most saturated orange on the creature) or the teeth rows (pale, warm)
    sat = a.max(axis=2) - a.min(axis=2)
    warm = (a[..., 0] > 150) & (a[..., 0] - a[..., 2] > 40)
    spk &= ~(warm & (sat > 60))
    # never touch the teeth either (after LOOKING at the repaired chin: the new small teeth were taken for specks): the
    # tusk region, grown, and a band along both lip lines
    keep = Image.new('L', im.size, 0)
    dk = ImageDraw.Draw(keep)
    dk.polygon(TUSK, fill=255)
    if rig_p:
        R = json.load(open(rig_p))
        dk.line([tuple(p) for p in R['upperLip']], fill=255, width=90)
        dk.line([tuple(p) for p in R['lowerLipOpen']], fill=255, width=90)
    spk &= np.asarray(keep.filter(ImageFilter.MaxFilter(41)), float) < 128
    m = Image.fromarray((spk * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    mm = np.asarray(m, float)[..., None] / 255
    med15 = np.asarray(im.filter(ImageFilter.MedianFilter(15)), float)
    res = a * (1 - mm) + med15 * mm
    Image.fromarray(np.clip(res, 0, 255).astype(np.uint8)).save(out)
    print('glints: specks', int(spk.sum()), 'px, mask', int((mm[..., 0] > 0.5).sum()), 'px')


# ---- 2-4 the rig ----------------------------------------------------------------------------------------------------
def lip_y(pts, x):
    """y of a polyline (x increasing) at x, extended flat past its ends."""
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return float(np.interp(x, xs, ys))


def rig(plate_p, master_p, rig_p, out, dressed_p, region_p, shut_deg=26.0, jaw_grow=14):
    """Round 3's rig.py `layers` (same cut), with the four repairs. Stage k turns the jaw back by
    turns[k] = [shut, 19.5, 13, 6.5, 0] degrees (stages 1-4 as round 3; stage 0 further, see 3)."""
    os.makedirs(out, exist_ok=True)
    R = json.load(open(rig_p))
    plate = np.asarray(Image.open(plate_p).convert('RGB'), float)
    master = np.asarray(Image.open(master_p).convert('RGB'), float)
    size = (plate.shape[1], plate.shape[0])
    diff = np.abs(master - plate).max(axis=2)
    m = np.clip((diff - 8) / 22, 0, 1)
    mi = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
    matte = np.asarray(mi, float) / 255
    matte *= np.asarray(Image.open(region_p).convert('L').resize(size), float) / 255
    plate = np.asarray(Image.open(dressed_p).convert('RGB'), float)
    deck = poly(size, R['deck'], 0, 1.2)
    head = poly(size, R['head'])
    jaw_g = poly(size, R['jawOpen'], jaw_grow, 1.0)
    jaw_raw = poly(size, R['jawOpen'])
    jaw_core = poly(size, R['jawOpen'], -6)
    mouth = poly(size, R['mouthOpen'], 3, 1.0)
    mouth_g = poly(size, R['mouthOpen'], 10, 1.5)
    hg = R['hinge']; ul = [tuple(p) for p in R['upperLip']]
    yy, xx = np.mgrid[0:size[1], 0:size[0]]
    below_lip = yy > np.interp(xx, [p[0] for p in ul], [p[1] for p in ul])        # under the sketch's upper lip line
    # --- the jaw (as round 3)
    jaw_a = jaw_g * (1 - head) * np.maximum(matte, jaw_core) * (1 - mouth * (1 - jaw_raw))
    lip = R['lowerLipOpen']; tooth = R['tooth'] * 1.25
    a = math.radians(R['openDeg'])
    up = (-math.sin(a) * tooth, -math.cos(a) * tooth)
    band = [tuple(p) for p in lip] + [(p[0] + up[0], p[1] + up[1]) for p in lip[::-1]]
    jaw_a = np.maximum(jaw_a, poly(size, band, 2, 1.0) * (1 - head))
    jb = Image.fromarray(((jaw_a > 0.35) * 255).astype(np.uint8)).copy()
    ys, xs = np.nonzero((poly(size, R['jawOpen'], -20) > 0.5) & (jaw_a > 0.35))
    ImageDraw.floodfill(jb, (int(xs[len(xs) // 2]), int(ys[len(ys) // 2])), 128)
    keep = np.asarray(Image.fromarray(((np.asarray(jb) == 128) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)), float) / 255
    jaw_a = jaw_a * keep
    # 4a: the jaw's edge carried the plate's sky: pull the edge in by 1 px and colour every soft edge pixel from the
    # jaw's own opaque pixels nearby (a normalised blur), so nothing sky-coloured rides along with the jaw
    jaw_a = np.minimum(jaw_a, np.asarray(Image.fromarray((jaw_a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)), float) / 255 + 0.0)
    solid = (jaw_a > 0.97).astype(float)
    def nblur(x, r):
        return np.asarray(Image.fromarray(np.clip(x, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), float)
    num = np.dstack([nblur(master[..., c] * solid, 4) for c in range(3)])
    den = nblur(solid * 255, 4)[..., None] / 255
    edge_rgb = np.where(den > 0.02, num / np.maximum(den, 1e-3), master)
    soft = ((jaw_a > 0) & (jaw_a < 0.97))[..., None]
    jaw_rgb = np.where(soft, edge_rgb, master)
    # --- the throat and the top (as round 3)
    throat_a = mouth_g * np.maximum(matte, mouth)
    near = np.clip((150 - np.hypot(xx - hg[0], yy - hg[1])) / 30, 0, 1) * np.clip((xx - hg[0] + 20) / 20, 0, 1)
    under_a = jaw_a * near
    front = poly(size, [(ul[0][0] - 90, ul[0][1] - 6)] + ul + [(hg[0], size[1]), (ul[0][0] - 90, size[1])], 0, 1.5)
    front = front * (1 - head) * (1 - jaw_g)
    throat_a = np.maximum(throat_a, matte * front)
    top_a = matte * (1 - np.maximum(np.maximum(jaw_a, mouth * (1 - head)), front))
    top_a = np.maximum(top_a, matte * head * (1 - mouth))
    und = [p for p in R['jawOpen'][len(R['lowerLipOpen']):] if p[0] < hg[0]]
    xs_ = [p[0] for p in und]
    below = poly(size, und + [(max(xs_), size[1]), (min(xs_) - 60, size[1]), (min(xs_) - 60, und[-1][1])], 0, 2.0)
    top_a = top_a * (1 - below * (1 - jaw_g))
    lum = master.mean(axis=2)
    # 4b: the ghost of the open jaw's underside in the top layer: in front of the hinge, nothing static may sit more
    # than a fang's length below the upper lip
    ghost = (yy > np.interp(xx, [p[0] for p in ul], [p[1] for p in ul]) + 48) & (xx < hg[0] - 20)
    ghost_before = top_a * ghost
    top_a = top_a * (1 - ghost)
    print('ghost cleared', int((ghost_before > 0.02).sum()), 'px of the top layer')
    Image.fromarray(plate.astype(np.uint8)).save(f'{out}/L0-plate.png')
    rgba(master, throat_a).save(f'{out}/L1-throat.png')
    rgba(jaw_rgb, jaw_a).save(f'{out}/L2-jaw.png')
    rgba(master, under_a).save(f'{out}/L1b-hinge.png')
    rgba(master, top_a).save(f'{out}/L3-top.png')
    rgba(plate, deck).save(f'{out}/L4-deck.png')
    turns = [shut_deg, 19.5, 13.0, 6.5, 0.0]
    # 3: the jaw's clip. Nothing of the turned jaw may show above the painted upper lip: the skull's lower edge, found
    # per column as the lowest opaque skull pixel in front of the hinge (the sketch line where the skull is thin)
    top_solid = (top_a > 0.5) & (lum > 0)
    fangs = (lum > 150) & below_lip
    skull_edge = np.full(size[0], -1.0)
    for x in range(int(ul[0][0]) - 40, int(hg[0]) + 1):
        col = np.nonzero(top_solid[:, x] & ~fangs[:, x])[0]
        ly = lip_y(ul, x)
        col = col[(col > ly - 80) & (col < ly + 30)]
        skull_edge[x] = col.max() if len(col) else ly
    clip = np.ones(size[::-1], float)
    for x in range(size[0]):
        if skull_edge[x] >= 0:
            clip[: int(skull_edge[x]) - 2, x] = 0
    clip = np.asarray(Image.fromarray((clip * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), float) / 255
    json.dump({'game': 'FFX only', 'hinge': hg, 'jawTurnBackDeg': turns,
               'order': ['L0-plate', 'L1-throat (masked by the mouth at this stage)', 'L1b-hinge', 'L2-jaw (turned, then clipped under the skull edge)', 'L3-top', 'L4-deck'],
               'repairs': ['tusk: a masked repaint of the chin, once (repair.py tusk-*)', 'the turned jaw clipped under the skull edge',
                           "the jaw edge recoloured from its own pixels; the open jaw's ghost cleared from the top layer",
                           'glints', 'stage 0: a shut-lip patch painted once over the mouth seam (repair.py lip-*), shown only while the mouth is shut'],
               'note': 'stage k: turn L2 clockwise (chin up) by jawTurnBackDeg[k] about hinge; clip it below the skull edge (clip.png)'},
              open(f'{out}/rig-out.json', 'w'), indent=1)
    Image.fromarray((clip * 255).astype(np.uint8)).save(f'{out}/clip.png')
    L = {n: Image.open(f'{out}/{n}.png').convert('RGBA') for n in ['L1-throat', 'L1b-hinge', 'L2-jaw', 'L3-top', 'L4-deck']}
    lipo = R['lowerLipOpen']
    for k, t in enumerate(turns):
        im = Image.open(f'{out}/L0-plate.png').convert('RGBA')
        c, s_ = math.cos(math.radians(t)), math.sin(math.radians(t))
        turned = [(hg[0] + (x - hg[0]) * c - (y - hg[1]) * s_, hg[1] + (x - hg[0]) * s_ + (y - hg[1]) * c) for x, y in lipo]
        if k == 0:
            wedge = np.zeros(size[::-1])
        else:
            wedge = poly(size, [(ul[0][0] - 90, ul[0][1])] + ul + turned[::-1] + [(turned[0][0] - 90, turned[0][1])], 4, 1.0)
        th = L['L1-throat'].copy()
        th.putalpha(Image.fromarray((np.asarray(th.split()[3], float) * wedge).astype(np.uint8)))
        im.alpha_composite(th)
        im.alpha_composite(L['L1b-hinge'])
        jw = L['L2-jaw'].rotate(-t, resample=Image.BICUBIC, center=tuple(hg))
        jw.putalpha(Image.fromarray((np.asarray(jw.split()[3], float) * clip).astype(np.uint8)))
        im.alpha_composite(jw)
        im.alpha_composite(L['L3-top'])
        im.alpha_composite(L['L4-deck'])
        im.convert('RGB').save(f'{out}/stage-{k}.png')
        im.convert('RGB').save(f'{out}/stage-{k}.jpg', quality=92)
        print('stage', k, f'jaw turned back {t:.1f} deg')


# ---- 2/3 the shut lips (stage 0) ------------------------------------------------------------------------------------
LIPCROP = (960, 250, 1660, 650)       # full-size pixels, aspect 1344:768


def lip_band(size, R):
    """The seam band at stage 0: 26 px above the sketch's upper lip to 22 px below it, snout to hinge."""
    ul = [tuple(p) for p in R['upperLip']]
    top = [(ul[0][0] - 14, ul[0][1] - 30)] + [(x, y - 26) for x, y in ul]
    bot = [(x, y + 22) for x, y in ul[::-1]] + [(ul[0][0] - 14, ul[0][1] + 26)]
    return poly(size, top + bot, 0, 3.0)


def lip_prep(rig_dir, rig_p):
    """(Dropped route, kept for the record: run4.sh's lip-1/lip-2 painted an open slit) the crop and band mask."""
    R = json.load(open(rig_p))
    im = Image.open(f'{rig_dir}/stage-0.png').convert('RGB')
    x0, y0, x1, y1 = LIPCROP
    im.crop(LIPCROP).resize((1344, 768), Image.LANCZOS).save(f'{rig_dir}/lip-crop.png')
    band = lip_band(im.size, R)
    Image.fromarray((band * 255).astype(np.uint8)).crop(LIPCROP).resize((1344, 768), Image.LANCZOS).save(f'{rig_dir}/lip-mask.png')
    Image.fromarray((band * 255).astype(np.uint8)).save(f'{rig_dir}/lip-band.png')
    print('lip crop x', 1344 / (x1 - x0))


def lip_seam(rig_dir, rig_p):
    """Stage 0 only. After LOOKING at lip-1/lip-2 (0.55 and 0.66 painted an open slit with gums on both jaws) and at a
    per-column fill (it found the edges badly and streaked): in the band from 24 px above the sketch's upper lip (the
    painted lip sits 15-20 px above it) to 8 px below, in front of the hinge, every pixel that shows the mouth's violet
    interior (and is not a fang) is darkened to a neutral shadow seam, so the shut mouth reads as one dark line with the
    fangs over it. The engine would show this as a static mask on the top layer while the mouth is shut."""
    R = json.load(open(rig_p))
    im = np.asarray(Image.open(f'{rig_dir}/stage-0.png').convert('RGB'), float)
    ul = [tuple(p) for p in R['upperLip']]; hg = R['hinge']
    Hh, Ww = im.shape[:2]
    yy, xx = np.mgrid[0:Hh, 0:Ww]
    ly = np.interp(xx, [p[0] for p in ul], [p[1] for p in ul])
    band = (yy > ly - 24) & (yy < ly + 8) & (xx > ul[0][0] - 14) & (xx < hg[0] - 6)
    lum = im.mean(axis=2); r_, g_, b_ = im[..., 0], im[..., 1], im[..., 2]
    violet = (((r_ - g_ >= 6) | (b_ - g_ >= 12)) & (lum < 110)) | (lum < 62)
    m = (band & violet & (lum < 150)).astype(float)
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5)), float) / 255
    m = m * band
    seam = np.array((30.0, 28.0, 36.0))
    out = im * (1 - 0.9 * m[..., None]) + seam * 0.9 * m[..., None]
    lay = rgba(np.broadcast_to(seam, im.shape), 0.9 * m)
    lay.save(f'{rig_dir}/L2s-shut-seam.png')
    res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    res.save(f'{rig_dir}/stage-0.png'); res.save(f'{rig_dir}/stage-0.jpg', quality=92)
    print('stage 0 seam:', int((m > 0.5).sum()), 'px darkened')


def lip_paste(rig_dir, patch):
    """(Dropped route, kept for the record) the patch as L2s-shut-lip.png (the band only), over the stage-0 composite."""
    im = Image.open(f'{rig_dir}/stage-0.png').convert('RGB')
    x0, y0, x1, y1 = LIPCROP
    p = Image.open(patch).convert('RGB').resize((x1 - x0, y1 - y0), Image.LANCZOS)
    full = Image.new('RGB', im.size); full.paste(p, (x0, y0))
    band = np.asarray(Image.open(f'{rig_dir}/lip-band.png'), float) / 255
    lay = rgba(np.asarray(full, float), band)
    lay.save(f'{rig_dir}/L2s-shut-lip.png')
    out = im.convert('RGBA'); out.alpha_composite(lay)
    out.convert('RGB').save(f'{rig_dir}/stage-0.png'); out.convert('RGB').save(f'{rig_dir}/stage-0.jpg', quality=92)
    print('stage 0 shut lips from', patch)


if __name__ == '__main__':
    cmd, a = sys.argv[1], sys.argv[2:]
    if cmd == 'tusk-prep':
        tusk_prep(*a)
    elif cmd == 'tusk-sketch':
        tusk_sketch(*a)
    elif cmd == 'tusk-smooth':
        tusk_smooth(*a)
    elif cmd == 'tusk-paste':
        tusk_paste(*a)
    elif cmd == 'lip-prep':
        lip_prep(*a)
    elif cmd == 'lip-seam':
        lip_seam(*a)
    elif cmd == 'lip-paste':
        lip_paste(*a)
    elif cmd == 'glints':
        glints(*a)
    elif cmd == 'rig':
        rig(a[0], a[1], a[2], a[3], a[4], a[5], float(a[6]) if len(a) > 6 else 26.0)
    else:
        raise SystemExit('unknown command ' + cmd)
