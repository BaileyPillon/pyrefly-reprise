"""Boss action poses, 2026-09-26 (ART-1 of docs/plans/presentation-program-2026-09-26.md).

CPU helpers for render.mjs (the GPU side). The method is the proven pose pipeline:
docs/concepts/art5/round2/render2.mjs (OpenPose + IP-Adapter from the installed idle, body-only
pose tags, the cutout guard, a black frame stops everything) and, for a drawn weapon,
docs/concepts/art5/round2/METHOD-CHECK.md method 1 (render the body with no weapon, then
composite the approved painting's own weapon into the fist).

    python bosses.py refs <boss>          # idle square-padded on white + head crop (+ weapon-free square)
    python bosses.py skel <boss>          # OpenPose skeletons -> skeletons/<boss>/<pose>.png
    python bosses.py katana               # Yojimbo: the approved cast's drawn blade + the idle's hilt
    python bosses.py comp <boss> <pose> <n> <hx,hy[;hx2,hy2]> <deg> [scale] [handR] [front|back]
    python bosses.py sheet <boss>         # decision sheet parts (under 1 MB, max 2000 px tall)

Reads public/art (read only). Writes candidates under
D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses-v2/<boss>/ and sheets and skeletons in
this folder. Nothing is installed into public/art.
"""
from __future__ import annotations

import json
import math
import pathlib
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[2]
ART = REPO / 'public' / 'art' / 'characters'
OUT = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses-v2')
sys.path.insert(0, str(REPO / 'docs' / 'concepts' / 'art5'))
import skeletons as base  # noqa: E402  (body, mirror, lying_head_left, draw)

CFG = json.loads((HERE / 'bosses.json').read_text(encoding='utf8'))


def flat(im, bg=(255, 255, 255)):
    b = Image.new('RGB', im.size, bg)
    b.paste(im, mask=im.split()[-1])
    return b


# ------------------------------------------------------------------ refs
def refs(boss):
    c = CFG[boss]
    d = OUT / boss / '_refs'
    d.mkdir(parents=True, exist_ok=True)
    idle = Image.open(ART / c['art'] / 'idle.png').convert('RGBA')
    variants = {'full': idle}
    for name, polys in c.get('erase', {}).items():
        a = np.array(idle)
        m = Image.new('L', idle.size, 0)
        for p in polys:
            ImageDraw.Draw(m).polygon([tuple(q) for q in p], fill=255)
        a[..., 3] = np.where(np.array(m) > 0, 0, a[..., 3])
        variants[name] = Image.fromarray(a, 'RGBA')
    for name, im in variants.items():
        im = im.crop(idle.getbbox())
        side = int(max(im.size) * 1.06)
        sq = Image.new('RGB', (side, side), (255, 255, 255))
        sq.paste(flat(im), ((side - im.width) // 2, (side - im.height) // 2))
        sq.save(d / f'idle-{name}-square.png')
        if name != 'full':
            continue
        hs = int(im.height * c.get('headF', 0.24))
        cx = c.get('headCx')
        if cx is None:
            band = im.crop((0, 0, im.width, int(im.height * 0.16))).split()[-1]
            xs = [x for x in range(band.width) for y in range(0, band.height, 4) if band.getpixel((x, y)) > 128]
            cx = sum(xs) / len(xs) if xs else im.width / 2
        x0 = int(min(max(cx - hs / 2, 0), max(im.width - hs, 0)))
        y0 = int(c.get('headY0', 0))
        head = flat(im).crop((x0, y0, x0 + hs, y0 + hs))
        head.resize((512, 512), Image.LANCZOS).save(d / 'head.png')
    print(json.dumps({'refs': sorted(p.name for p in d.iterdir())}))


# ------------------------------------------------------------------ skeletons
def skel_raw(boss, pose):
    """Right-facing drafts in the art5 kinematics, mirrored to face screen-left (bosses face the
    party, which stands on screen-left). Profile figures get narrow shoulder and hip widths."""
    if boss == 'yojimbo':
        W, H = 1024, 1216
        prof = dict(sh=24, hp=20, turn=22)
        if pose == 'attack':
            # Zanmato: the draw-cut's follow-through. A deep lunge toward the party, torso pitched
            # forward, both hands together on the grip driven out ahead at chest height.
            k = base.body((470, 700), 292, s=1.0, head_deg=300, rarm=(18, 352), larm=(30, 358),
                          rleg=(132, 120), lleg=(55, 95), **prof)
        elif pose == 'hurt':
            # knocked back away from the party: shoulders past the hips, head (and hat) thrown back,
            # the near arm flung forward, the far arm low behind; a back step, knees bent.
            k = base.body((520, 660), 253, s=0.97, head_deg=226, rarm=(128, 112), larm=(20, 45),
                          rleg=(120, 100), lleg=(70, 92), **prof)
        elif pose == 'hurt2':
            # v2 hurt: a flinch, not a back-bend. Staggered one step away from the party, the torso
            # tipped back only ~12 deg, the head bowed (chin tucked, so the jingasa shows its
            # cone from above instead of going edge-on), the near forearm up across the chest in
            # a guard, the far arm swung back for balance, knees bent.
            k = base.body((500, 665), 258, s=0.97, head_deg=292, rarm=(140, 118), larm=(35, 285),
                          rleg=(116, 100), lleg=(72, 98), **prof)
        elif pose == 'hurt3':
            # v2 hurt, pilot 2: hurt2 read as a bow (arms folded, head down). A recoil instead:
            # torso tipped back ~20 deg away from the party, head level (the hat stays a cone,
            # not edge-on as in the stopped run's head-thrown-back tries), the near forearm
            # thrown up in front of the face as a guard, the far arm flung down and back,
            # the rear foot stepping back, the front knee bent.
            k = base.body((505, 668), 250, s=0.97, head_deg=268, rarm=(150, 130), larm=(338, 262),
                          rleg=(118, 102), lleg=(70, 96), **prof)
        else:
            raise SystemExit(f'no skeleton for {boss}/{pose}')
        return (W, H), base.mirror(k, W)
    raise SystemExit(f'no skeletons for {boss}')


def skel(boss):
    c = CFG[boss]
    tiles = []
    for pose, p in c['poses'].items():
        size, k = skel_raw(boss, p.get('skel', pose))
        sc, gy = p.get('skelScale', 0.85), p.get('ground', 1160)
        cx = size[0] / 2
        pts = {i: (cx + (x - cx) * sc, gy + (y - 1170) * sc) for i, (x, y) in k.items()}
        dx = p.get('skelDx', 0)
        pts = {i: (x + dx, y) for i, (x, y) in pts.items()}
        im = base.draw(size, pts)
        out = HERE / 'skeletons' / boss / f"{p.get('skel', pose)}.png"
        out.parent.mkdir(parents=True, exist_ok=True)
        im.save(out)
        oob = [i for i, (x, y) in pts.items() if not (8 <= x < size[0] - 8 and 8 <= y < size[1] - 8)]
        print(f'{boss}/{pose} {size} near edge: {oob or "none"}')
        tiles.append(im.resize((im.width // 3, im.height // 3)))
    ov = Image.new('RGB', (sum(t.width for t in tiles) + 8 * len(tiles), max(t.height for t in tiles)), (50, 50, 50))
    x = 0
    for t in tiles:
        ov.paste(t, (x, 0)); x += t.width + 8
    ov.save(HERE / 'skeletons' / boss / 'overview.jpg', quality=80)


# ------------------------------------------------------------------ Yojimbo's katana
def katana():
    """The drawn katana, built from approved pixels only: the blade and tsuba of the installed
    cast (approved 2026-09-24) and the idle's own wrapped hilt and pommel (the cast's hilt is
    under his glove), turned onto the cast's grip line. Coordinates read off gridded crops."""
    cast = np.array(Image.open(ART / 'yojimbo-cavern' / 'cast.png').convert('RGBA')).astype(int)
    idle = Image.open(ART / 'yojimbo-cavern' / 'idle.png').convert('RGBA')
    H, W = cast.shape[:2]
    # 1. blade + habaki + tsuba from the cast, purple glove pixels left out
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon([(0, 45), (35, 48), (130, 138), (205, 243), (230, 262), (228, 288), (214, 297),
                               (190, 295), (176, 280), (163, 255), (95, 170), (0, 82)], fill=255)
    r, g, b, a = (cast[..., i] for i in range(4))
    purple = (b - g > 35) & (r > 70)
    keep = (np.array(m) > 0) & (a > 0) & ~purple
    blade = cast.copy(); blade[..., 3] = np.where(keep, a, 0)
    blade_im = Image.fromarray(blade.astype('uint8'), 'RGBA')
    # 2. the idle's hilt, pommel to just under the tsuba, moved onto the cast's grip line
    S, E = np.array([158.0, 378.0]), np.array([238.0, 448.0])
    u = (E - S) / np.linalg.norm(E - S); n = np.array([-u[1], u[0]]); hw = 17
    hm = Image.new('L', idle.size, 0)
    ImageDraw.Draw(hm).polygon([tuple(S + hw * n), tuple(S - hw * n), tuple(E - hw * n), tuple(E + hw * n)], fill=255)
    ia = np.array(idle).astype(int); ia[..., 3] = np.where(np.array(hm) > 0, ia[..., 3], 0)
    hilt = Image.fromarray(ia.astype('uint8'), 'RGBA')
    src_ang = math.degrees(math.atan2(*(S - E)[::-1]))       # ~221 deg: tsuba -> pommel
    dst_ang = 52.8                                          # cast grip line, tsuba -> pommel
    T0 = np.array([214.0, 290.0])                           # where the grip leaves the cast's tsuba
    d = math.radians(dst_ang - src_ang); c_, s_ = math.cos(d), math.sin(d)
    # inverse affine: dst p -> src q = R^-1 (p - T0) + E
    A = (c_, s_, 0, -s_, c_, 0)
    A = (A[0], A[1], E[0] - (A[0] * T0[0] + A[1] * T0[1]), A[3], A[4], E[1] - (A[3] * T0[0] + A[4] * T0[1]))
    hilt_t = hilt.transform((W + 60, H + 60), Image.AFFINE, A, resample=Image.BICUBIC)
    k = Image.new('RGBA', (W + 60, H + 60), (0, 0, 0, 0))
    k.alpha_composite(hilt_t)
    k.alpha_composite(blade_im, (0, 0))
    bb = k.getbbox(); k = k.crop(bb)
    L = float(np.linalg.norm(E - S))
    pommel = T0 + L * np.array([math.cos(math.radians(dst_ang)), math.sin(math.radians(dst_ang))])
    grip1 = T0 + 0.30 * (pommel - T0); grip2 = T0 + 0.75 * (pommel - T0)
    tip = np.array([8.0, 62.0])
    meta = {'bbox': bb, 'tip': list(tip - bb[:2]), 'grip': list((grip1 + grip2) / 2 - bb[:2]),
            'grip1': list(grip1 - bb[:2]), 'grip2': list(grip2 - bb[:2]), 'pommel': list(pommel - bb[:2]),
            'source': 'blade + tsuba: public/art/characters/yojimbo-cavern/cast.png (installed, approved 2026-09-24); '
                      'hilt: yojimbo-cavern/idle.png, turned %.1f deg onto the cast grip line' % (dst_ang - src_ang)}
    d_ = OUT / 'yojimbo' / '_refs'; d_.mkdir(parents=True, exist_ok=True)
    k.save(d_ / 'katana.png'); json.dump(meta, open(d_ / 'katana.json', 'w'), indent=1)
    prev = Image.new('RGBA', k.size, (200, 200, 200, 255)); prev.alpha_composite(k)
    dd = ImageDraw.Draw(prev)
    for key, col in (('tip', 'red'), ('grip1', 'blue'), ('grip2', 'blue'), ('pommel', 'green')):
        x, y = meta[key]; dd.ellipse([x - 4, y - 4, x + 4, y + 4], outline=col, width=2)
    prev.convert('RGB').save(d_ / 'katana-preview.png')
    print(json.dumps(meta))


# ------------------------------------------------------------------ a weapon cut straight from the idle
def cutw(boss, name):
    """Cut a weapon out of the installed idle by the polygons in bosses.json `weapons.<name>`
    (e.g. Yojimbo's sheathed katana: hilt and scabbard, the same polygons the weapon-free
    reference erases). grip/tip are idle pixels; comp() turns grip->tip onto the chosen angle."""
    c = CFG[boss]; w = c['weapons'][name]
    idle = Image.open(ART / c['art'] / 'idle.png').convert('RGBA')
    m = Image.new('L', idle.size, 0)
    for p in w['polys']:
        ImageDraw.Draw(m).polygon([tuple(q) for q in p], fill=255)
    a = np.array(idle); a[..., 3] = np.where(np.array(m) > 0, a[..., 3], 0)
    im = Image.fromarray(a, 'RGBA'); bb = im.getbbox(); im = im.crop(bb)
    meta = {'bbox': bb, 'grip': [w['grip'][0] - bb[0], w['grip'][1] - bb[1]], 'tip': [w['tip'][0] - bb[0], w['tip'][1] - bb[1]],
            'source': f"public/art/characters/{c['art']}/idle.png (installed idle), cut by polygon, no repaint"}
    d = OUT / boss / '_refs'; im.save(d / f'{name}.png'); json.dump(meta, open(d / f'{name}.json', 'w'), indent=1)
    print(json.dumps(meta))


# ------------------------------------------------------------------ composite
PAD = 160
def comp(boss, pose, n, hands_arg, deg, scale=1.0, hr=24, layer='front'):
    """Paste the weapon into the fist(s) of body-<n>, then lay a feathered disc of the body's own
    hand pixels back over the grip so the fingers sit in front of it (METHOD-CHECK method 1)."""
    d = OUT / boss / pose
    side = json.load(open(d / f'body-{n}.json'))
    wpn = CFG[boss]['poses'][pose].get('weapon', CFG[boss]['weapon'])
    sw = Image.open(OUT / boss / '_refs' / f'{wpn}.png').convert('RGBA')
    meta = json.load(open(OUT / boss / '_refs' / f'{wpn}.json'))
    hands = [tuple(map(float, h.split(','))) for h in hands_arg.split(';')]
    G = meta['grip'] if len(hands) == 1 else meta['grip']
    T = meta['tip']
    pad = PAD  # the drawn blade may reach past the body's canvas: the composite gets a margin
    W, H = side['width'] + 2 * pad, side['height'] + 2 * pad
    hands = [(h[0] + pad, h[1] + pad) for h in hands]
    body = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cb = side['cutout']['cropBox']
    body.paste(Image.open(d / f'body-{n}.png').convert('RGBA'), (cb[0] + pad, cb[1] + pad))
    P = (sum(h[0] for h in hands) / len(hands), sum(h[1] for h in hands) / len(hands))
    cur = math.atan2(T[1] - G[1], T[0] - G[0]); th = math.radians(deg); dd = th - cur
    c, s = math.cos(dd), math.sin(dd)
    A = (c / scale, s / scale, 0, -s / scale, c / scale, 0)
    A = (A[0], A[1], G[0] - (A[0] * P[0] + A[1] * P[1]), A[3], A[4], G[1] - (A[3] * P[0] + A[4] * P[1]))
    swL = sw.transform((W, H), Image.AFFINE, A, resample=Image.BICUBIC)
    out = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    if layer == 'back':
        out.alpha_composite(swL); out.alpha_composite(body)
    else:
        out.alpha_composite(body); out.alpha_composite(swL)
    if layer != 'back' and hr > 0:
        disc = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(disc)
        for h in hands:
            dr.ellipse([h[0] - hr, h[1] - hr, h[0] + hr, h[1] + hr], fill=255)
        disc = disc.filter(ImageFilter.GaussianBlur(2))
        ba = np.array(body).astype(float); ba[..., 3] *= np.array(disc) / 255.0
        out.alpha_composite(Image.fromarray(ba.astype('uint8'), 'RGBA'))
    out.convert('RGB').save(d / f'cand-{n}-comp.png')
    L = scale * math.dist(G, T)
    info = {'size': [W, H], 'pad': pad, 'hands': hands, 'deg': deg, 'scale': scale, 'handR': hr, 'layer': layer,
            'tip': [round(P[0] + math.cos(th) * L), round(P[1] + math.sin(th) * L)], 'weapon': meta['source']}
    json.dump(info, open(d / f'cand-{n}-comp.json', 'w'), indent=1)
    print(json.dumps(info))



# ------------------------------------------------------------------ multi-piece composite (hat + sheath)
def comp2(boss, pose, n, spec_arg):
    """Several approved pieces onto body-<n> (METHOD-CHECK-yojimbo-hurt.md option 1): spec is a JSON
    list of {"piece": "hat"|"sheath"|..., "at": [x, y] (body raw pixels, where the piece's grip goes),
    "deg": grip->tip screen angle, "scale": s, "layer": "front"|"back"}. Pieces are the idle's own
    pixels cut by `cutw` (or `katana`); nothing is painted."""
    d = OUT / boss / pose
    side = json.load(open(d / f'body-{n}.json'))
    spec = json.loads(spec_arg)
    pieces = spec['pieces'] if isinstance(spec, dict) else spec
    erase_polys = spec.get('eraseBody', []) if isinstance(spec, dict) else []
    pad = PAD
    W, H = side['width'] + 2 * pad, side['height'] + 2 * pad
    body = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cb = side['cutout']['cropBox']
    body.paste(Image.open(d / f'body-{n}.png').convert('RGBA'), (cb[0] + pad, cb[1] + pad))
    if erase_polys:  # the body's own head goes under the approved hat and mask: alpha 0, nothing painted
        m = Image.new('L', (W, H), 0)
        for poly in erase_polys:
            ImageDraw.Draw(m).polygon([(x + pad, y + pad) for x, y in poly], fill=255)
        ba = np.array(body); ba[..., 3] = np.where(np.array(m) > 0, 0, ba[..., 3]); body = Image.fromarray(ba, 'RGBA')
    layers = {'back': [], 'front': []}
    for pc in pieces:
        if 'disc' in pc:  # the body's own hand pixels laid back over a grip (fingers in front of the hilt)
            dm = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(dm)
            for x, y, r in pc['disc']:
                dr.ellipse([x + pad - r, y + pad - r, x + pad + r, y + pad + r], fill=255)
            dm = dm.filter(ImageFilter.GaussianBlur(2))
            ba = np.array(body).astype(float); ba[..., 3] *= np.array(dm) / 255.0
            layers['front'].append(Image.fromarray(ba.astype('uint8'), 'RGBA'))
            continue
        sw = Image.open(OUT / boss / '_refs' / f"{pc['piece']}.png").convert('RGBA')
        meta = json.load(open(OUT / boss / '_refs' / f"{pc['piece']}.json"))
        G, T = meta['grip'], meta['tip']
        P = (pc['at'][0] + pad, pc['at'][1] + pad)
        sc = float(pc.get('scale', 1.0))
        cur = math.atan2(T[1] - G[1], T[0] - G[0]); dd = math.radians(float(pc['deg'])) - cur
        c, s_ = math.cos(dd), math.sin(dd)
        A = (c / sc, s_ / sc, 0, -s_ / sc, c / sc, 0)
        A = (A[0], A[1], G[0] - (A[0] * P[0] + A[1] * P[1]), A[3], A[4], G[1] - (A[3] * P[0] + A[4] * P[1]))
        layers[pc.get('layer', 'front')].append(sw.transform((W, H), Image.AFFINE, A, resample=Image.BICUBIC))
        pc['source'] = meta['source']
    out = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    for L in layers['back']:
        out.alpha_composite(L)
    out.alpha_composite(body)
    for L in layers['front']:
        out.alpha_composite(L)
    out.convert('RGB').save(d / f'cand-{n}-comp.png')
    info = {'size': [W, H], 'pad': pad, 'pieces': pieces, 'eraseBody': erase_polys, 'method': 'METHOD-CHECK-yojimbo-hurt.md option 1'}
    json.dump(info, open(d / f'cand-{n}-comp.json', 'w'), indent=1)
    print(json.dumps(info)[:400])

# ------------------------------------------------------------------ pixel erase (no repaint)
def erase(boss, pose, n, poly_arg, why):
    """Erase a stray prop outside the figure: alpha 0 inside a polygon given in the body render's
    raw pixels. The pre-erase file is kept beside it and the polygon goes into the sidecar."""
    d = OUT / boss / pose
    side = json.load(open(d / f'cand-{n}.json'))
    pad = side.get('composite', {}).get('pad', 0)
    cb = side['cutout']['cropBox']
    poly = [tuple(map(float, q.split(','))) for q in poly_arg.split(';')]
    im = Image.open(d / f'cand-{n}.png').convert('RGBA')
    pre = d / f'cand-{n}.pre-erase.png'
    if not pre.exists():
        im.save(pre)
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).polygon([(x + pad - cb[0], y + pad - cb[1]) for x, y in poly], fill=255)
    a = np.array(im); gone = int(((np.array(m) > 0) & (a[..., 3] > 0)).sum())
    a[..., 3] = np.where(np.array(m) > 0, 0, a[..., 3]); Image.fromarray(a, 'RGBA').save(d / f'cand-{n}.png')
    side.setdefault('repairs', []).append({'kind': 'pixel erase, nothing painted', 'why': why, 'polygonRaw': poly, 'pixels': gone})
    json.dump(side, open(d / f'cand-{n}.json', 'w'), indent=1)
    print(json.dumps({'erased': gone}))


# ------------------------------------------------------------------ sheets
def font(sz):
    for f in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def place_on(bg, fig, h, x_frac=0.62, ground=0.86):
    """The figure at in-battle height h over the backdrop crop, feet on a ground line."""
    fig = fig.crop(fig.getbbox())
    fig = fig.resize((max(1, int(fig.width * h / fig.height)), h), Image.LANCZOS)
    x = int(bg.width * x_frac - fig.width / 2); y = int(bg.height * ground - fig.height)
    bg = bg.copy(); bg.alpha_composite(fig, (max(0, x), max(0, y)))
    return bg


def sheet(boss):
    c = CFG[boss]
    picks = json.load(open(HERE / 'looks.json', encoding='utf8')).get(boss, {})
    idle = Image.open(ART / c['art'] / 'idle.png').convert('RGBA')
    bdp = Image.open(REPO / 'public' / 'art' / 'backdrops' / f"{c['backdrop']}.png").convert('RGBA')
    bw = 520; bg = bdp.resize((bw, int(bdp.height * bw / bdp.width)), Image.LANCZOS)
    bg = bg.crop((0, max(0, bg.height - 360), bw, bg.height)) if bg.height > 360 else bg
    F, Fs = font(26), font(18)
    parts = []
    for pose in c['poses']:
        d = OUT / boss / pose
        cands = sorted(d.glob('cand-*.png'), key=lambda p: int(p.stem.split('-')[1]))
        cands = [p for p in cands if p.stem.count('-') == 1]
        if not cands:
            continue
        tile_h = 420
        row_imgs = [('idle (installed)', idle)]
        for p in cands:
            n = int(p.stem.split('-')[1])
            row_imgs.append((f'c{n}', Image.open(p).convert('RGBA')))
        colw = 300
        W = 20 + colw * len(row_imgs)
        H = 60 + tile_h + 12 + bg.height + 70
        sh = Image.new('RGB', (W, H), (24, 26, 34)); dr = ImageDraw.Draw(sh)
        pk = picks.get(pose, {})
        title = f"{c['title']} - {pose}   pick: {pk.get('pick', '-')}   judge: {pk.get('judge', '-')}"
        dr.text((16, 14), title, fill=(236, 214, 150), font=F)
        for i, (lab, im) in enumerate(row_imgs):
            x0 = 10 + i * colw
            t = im.crop(im.getbbox()); sc = min((colw - 16) / t.width, tile_h / t.height)
            t = t.resize((max(1, int(t.width * sc)), max(1, int(t.height * sc))), Image.LANCZOS)
            cell = Image.new('RGBA', (colw - 8, tile_h), (0, 0, 0, 0))
            half = Image.new('RGBA', (colw - 8, tile_h), (128, 128, 128, 255))
            ImageDraw.Draw(half).rectangle([0, tile_h // 2, colw, tile_h], fill=(28, 36, 64, 255))
            half.alpha_composite(t, ((colw - 8 - t.width) // 2, tile_h - t.height))
            sh.paste(half.convert('RGB'), (x0, 56))
            col = (140, 230, 140) if lab == f"c{pk.get('pick', '')}".replace('cc', 'c') else (230, 230, 230)
            dr.text((x0 + 6, 58), lab, fill=col, font=Fs)
            g = place_on(bg, im, int(bg.height * 0.78), x_frac=0.5)
            g = g.resize((colw - 8, int(g.height * (colw - 8) / g.width)), Image.LANCZOS)
            sh.paste(g.convert('RGB'), (x0, 56 + tile_h + 12))
        note = pk.get('note', '')
        dr.text((16, H - 56), note[:200], fill=(210, 210, 210), font=Fs)
        dr.text((16, H - 30), f"{c['game']}. Candidates only; nothing installed. Split grey/navy = 1:1 read; lower row = over {c['backdrop']} at battle scale.",
                fill=(150, 150, 160), font=Fs)
        if W > 2000:
            sh = sh.resize((2000, int(H * 2000 / W)), Image.LANCZOS)
        out = HERE / f'{boss}-{pose}.jpg'
        q = 85
        sh.save(out, quality=q)
        while out.stat().st_size > 1_000_000 and q > 40:
            q -= 8; sh.save(out, quality=q)
        parts.append(out.name)
    print(json.dumps({'sheets': parts}))


# ------------------------------------------------------------------ v2 sheets (explicit candidates, game-scale row)
def sheet2(boss, slot, folder, ns_arg):
    """One phone-readable part per slot: the installed idle and each candidate at 1:1 proportion on
    split grey/navy; below, each over the chapter backdrop at game scale (pixel scale taken from the
    hat/head-match scale, so a lunge shows lower than the idle, as it will in battle); below that the
    looks (maker + second look) from looks.json. Under 1 MB, at most 2000 px wide and tall."""
    c = CFG[boss]
    looks = json.load(open(HERE / 'looks.json', encoding='utf8')).get(boss, {}).get(slot, {})
    ns = [int(x) for x in ns_arg.split(',')]
    idle = Image.open(ART / c['art'] / 'idle.png').convert('RGBA')
    idle_h = idle.getbbox()[3] - idle.getbbox()[1]
    bdp = Image.open(REPO / 'public' / 'art' / 'backdrops' / f"{c['backdrop']}.png").convert('RGBA')
    colw, tile_h, bg_h = 372, 440, 300
    bw = colw - 8
    bgs = bdp.resize((bw, int(bdp.height * bw / bdp.width)), Image.LANCZOS)
    bgs = bgs.crop((0, max(0, bgs.height - bg_h), bw, bgs.height)); bg_h = bgs.height
    k = bg_h * 0.74 / idle_h                      # the idle stands 74% of the backdrop crop
    F, Fs, Ft = font(26), font(17), font(15)
    items = [('idle (installed)', idle, 1.0, None)]
    for n in ns:
        side = json.load(open(OUT / boss / folder / f'cand-{n}.json'))
        pcs = side.get('composite', {}).get('pieces', [])
        sc = next((p['scale'] for p in pcs if p.get('piece') in ('hat', 'head')), side.get('composite', {}).get('scale', 1.0))
        items.append((f'c{n}', Image.open(OUT / boss / folder / f'cand-{n}.png').convert('RGBA'), sc, looks.get('cands', {}).get(str(n), {})))
    W = 16 + colw * len(items)
    text_h = 230
    H = 58 + tile_h + 10 + bgs.height + 10 + text_h + 40
    sh = Image.new('RGB', (W, H), (22, 24, 32)); dr = ImageDraw.Draw(sh)
    dr.text((14, 12), f"{c['title']}: {slot}   maker pick: {looks.get('pick', '-')}", fill=(236, 214, 150), font=F)
    for i, (lab, im, sc, lk) in enumerate(items):
        x0 = 8 + i * colw
        t = im.crop(im.getbbox()); z = min((colw - 16) / t.width, tile_h / t.height)
        t = t.resize((max(1, int(t.width * z)), max(1, int(t.height * z))), Image.LANCZOS)
        half = Image.new('RGBA', (colw - 8, tile_h), (128, 128, 128, 255))
        ImageDraw.Draw(half).rectangle([0, tile_h // 2, colw, tile_h], fill=(28, 36, 64, 255))
        half.alpha_composite(t, ((colw - 8 - t.width) // 2, tile_h - t.height))
        sh.paste(half.convert('RGB'), (x0, 52))
        good = lk and lk.get('verdict') == 'PASS'
        col = (140, 230, 140) if good else ((240, 150, 140) if lk else (230, 230, 230))
        dr.text((x0 + 6, 54), lab + (f"  {lk.get('score', '')} {lk.get('verdict', '')}" if lk else ''), fill=col, font=Fs)
        fig = im.crop(im.getbbox())
        h = max(1, int(fig.height / sc * k)); fig = fig.resize((max(1, int(fig.width * h / fig.height)), h), Image.LANCZOS)
        g = bgs.copy(); g.alpha_composite(fig, (int(bw * 0.55 - fig.width / 2), int(bg_h * 0.9 - fig.height)))
        sh.paste(g.convert('RGB'), (x0, 52 + tile_h + 10))
        ty = 52 + tile_h + 10 + bgs.height + 8
        txt = (lk or {}).get('look', 'Approved idle, for identity and scale.' if lk is None else '')
        words, line, lines = txt.split(), '', []
        for w in words:
            if dr.textlength(line + ' ' + w, font=Ft) > colw - 14:
                lines.append(line); line = w
            else:
                line = (line + ' ' + w).strip()
        lines.append(line)
        for j, L in enumerate(lines[:12]):
            dr.text((x0 + 4, ty + j * 18), L, fill=(215, 215, 215), font=Ft)
    dr.text((14, H - 30), f"{c['game']}. Candidates only, nothing installed. Top: each figure fit to its tile on grey/navy. Middle: over {c['backdrop']} at game scale.",
            fill=(150, 150, 160), font=Ft)
    if W > 2000:
        sh = sh.resize((2000, int(H * 2000 / W)), Image.LANCZOS)
    out = HERE / f'{boss}-{slot}.jpg'
    q = 88
    sh.save(out, quality=q)
    while out.stat().st_size > 1_000_000 and q > 40:
        q -= 6; sh.save(out, quality=q)
    print(json.dumps({'sheet': out.name, 'size': sh.size, 'bytes': out.stat().st_size}))


if __name__ == '__main__':
    cmd, *a = sys.argv[1:]
    if cmd == 'refs':
        refs(a[0])
    elif cmd == 'skel':
        skel(a[0])
    elif cmd == 'cutw':
        cutw(a[0], a[1])
    elif cmd == 'erase':
        erase(a[0], a[1], a[2], a[3], a[4])
    elif cmd == 'katana':
        katana()
    elif cmd == 'comp':
        comp(a[0], a[1], a[2], a[3], float(a[4]), *(float(x) for x in a[5:7]), *(a[7:8] or []))
    elif cmd == 'comp2':
        comp2(a[0], a[1], a[2], a[3])
    elif cmd == 'sheet2':
        sheet2(a[0], a[1], a[2], a[3])
    elif cmd == 'sheet':
        sheet(a[0])
    else:
        print(__doc__)
