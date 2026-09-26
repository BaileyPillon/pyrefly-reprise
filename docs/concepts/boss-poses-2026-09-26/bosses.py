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
    if boss in ('leblanc', 'logos') and pose == 'hurt':
        # the knocked-back recoil (Trema's), facing screen-left like both idles; Leblanc stands
        # nearer three-quarter than profile, so her shoulders are drawn wider.
        W, H = 832, 1216
        prof = dict(sh=34, hp=28, turn=18) if boss == 'leblanc' else dict(sh=24, hp=20, turn=22)
        k = base.body((430, 660), 253, s=0.97, head_deg=230, rarm=(128, 112), larm=(20, 45),
                      rleg=(120, 100), lleg=(70, 92), **prof)
        return (W, H), base.mirror(k, W)
    if boss in ('ffx2-dr-goon', 'ffx2-fem-goon') and pose == 'hurt':
        # both goon idles face screen-RIGHT: the right-facing draft of the same knocked-back recoil,
        # not mirrored (the torso tips back toward screen-left, away from the party).
        W, H = 832, 1216
        prof = dict(sh=32, hp=26, turn=18)
        k = base.body((430, 660), 253, s=0.97, head_deg=230, rarm=(128, 112), larm=(20, 45),
                      rleg=(120, 100), lleg=(70, 92), **prof)
        return (W, H), k
    if boss == 'ormi' and pose == 'hurt':
        # Ormi's idle faces screen-RIGHT (not mirrored). Short and stout: a thick torso and wide
        # shoulders, the legs drawn at 60% so ControlNet does not stretch him tall; knocked back
        # toward screen-left, arms flung out.
        W, H = 832, 1216
        k = base.body((440, 760), 257, s=0.9, head_deg=242, rarm=(160, 135), larm=(20, 55),
                      rleg=(112, 96), lleg=(70, 88), sh=46, hp=40, turn=20)
        for hip, knee, ank in ((8, 9, 10), (11, 12, 13)):
            hx, hy = k[hip]
            k[knee] = (hx + (k[knee][0] - hx) * 0.6, hy + (k[knee][1] - hy) * 0.6)
            k[ank] = (hx + (k[ank][0] - hx) * 0.6, hy + (k[ank][1] - hy) * 0.6)
        return (W, H), k
    if boss == 'trema':
        # Profile facing screen-left like his idle; the same knocked-back recoil as Yojimbo's hurt
        # (the stopped run's skeleton), drawn on a narrower canvas for the long robe.
        W, H = 832, 1216
        prof = dict(sh=24, hp=20, turn=22)
        if pose == 'hurt':
            k = base.body((430, 660), 253, s=0.97, head_deg=230, rarm=(128, 112), larm=(20, 45),
                          rleg=(120, 100), lleg=(70, 92), **prof)
        else:
            raise SystemExit(f'no skeleton for {boss}/{pose}')
        return (W, H), base.mirror(k, W)
    if boss == 'seymour-natus':
        # Front three-quarter, hovering (the idle: floating, feet pointed down below the hem, body
        # turned slightly left). Not mirrored: the idle faces the camera, not a side.
        W, H = 1024, 1216
        fr = dict(sh=40, hp=30, turn=8)
        if pose == 'hurt':
            # thrown sideways by the blow: torso tipped ~10 deg, head knocked to the side, both arms
            # flung out and down (the blades go with the forearms), legs dangling, one knee bent.
            k = base.body((512, 690), 262, s=1.0, head_deg=240, rarm=(155, 140), larm=(20, 40),
                          rleg=(100, 92), lleg=(78, 100), **fr)
        elif pose == 'ko':
            # limp in the air: torso sagging to one side, head lolling down past the shoulder,
            # both arms hanging straight down, legs trailing.
            k = base.body((512, 700), 258, s=1.0, head_deg=205, rarm=(95, 92), larm=(85, 88),
                          rleg=(96, 100), lleg=(84, 92), **fr)
        else:
            raise SystemExit(f'no skeleton for {boss}/{pose}')
        return (W, H), k
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


# Yojimbo's drawn katana is built in katana.py (`python bosses.py katana`)


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


# sheets live in sheets.py (house rule: files under 400 lines)


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
        from katana import katana
        katana()
    elif cmd == 'comp':
        comp(a[0], a[1], a[2], a[3], float(a[4]), *(float(x) for x in a[5:7]), *(a[7:8] or []))
    elif cmd == 'comp2':
        comp2(a[0], a[1], a[2], a[3])
    elif cmd == 'sheet2':
        from sheets import sheet2
        sheet2(a[0], a[1], a[2], a[3])
    elif cmd == 'sheet':
        from sheets import sheet
        sheet(a[0])
    else:
        print(__doc__)
