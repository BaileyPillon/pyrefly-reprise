"""Sin's head, round 3 (FFX only, 2026-09-27): the LAYERED RIG. It cuts one painting into layers and builds the five
clock stages by turning only the lower jaw about its hinge.

  python rig.py layers <plate.png> <master.png> <rig.json> <out_dir> [jawGrow] [shutDeg|-] [dressedPlate.png] [regionMask.png]
      plate   the scene with no creature (sky, city, tower, deck), full size 2352x1344
      master  the same scene with the creature painted in, mouth fully open (OPEN_DEG)
      Writes into out_dir:
        L0-plate.png   the plate (sky, city, the white tower)
        L1-throat.png  RGBA: the mouth interior (static; shown only inside the mouth as it is at each stage)
        L1b-hinge.png  RGBA: the jaw's rear pixels near the hinge, a static patch under the jaw
        L2-jaw.png     RGBA: the lower jaw with its teeth, as painted open; the engine turns this about `hinge`
        L3-top.png     RGBA: skull, upper jaw, cheek, neck, arm, claw, both wings (static, over the jaw)
        L4-deck.png    RGBA: the Fahrenheit's deck and rails, cut from the plate (static, over everything)
        stage-0..4.png the five stages; rig-out.json (hinge, the angle turned per stage, layer order)
      shutDeg: how far the jaw is turned back up for stage 0 (defaults to the sketch's OPEN_DEG; fitted by eye).
      The stages turn it back by shutDeg * (1 - k/4).

The alpha of every layer comes from the painting itself: the creature is where the master differs from the plate,
split along the sketch's jaw, mouth and head polygons. Outside the jaw's path every stage is the same pixels.
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

STAGES = 5


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
    return Image.fromarray(np.dstack([rgb.astype(np.uint8), a]), 'RGBA')


def layers(plate_p, master_p, rig_p, out, jaw_grow=14, shut_deg=None, dressed_p=None, region_p=None):
    os.makedirs(out, exist_ok=True)
    R = json.load(open(rig_p))
    plate = np.asarray(Image.open(plate_p).convert('RGB'), float)
    master = np.asarray(Image.open(master_p).convert('RGB'), float)
    size = (plate.shape[1], plate.shape[0])
    # the creature matte: where the master differs from the plate, soft, with pin holes closed
    diff = np.abs(master - plate).max(axis=2)
    m = np.clip((diff - 8) / 22, 0, 1)
    mi = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
    matte = np.asarray(mi, float) / 255
    if region_p:                        # only inside the creature job's own repaint mask (the VAE round trip moves other pixels a little)
        matte *= np.asarray(Image.open(region_p).convert('L').resize(size), float) / 255
    if dressed_p:                       # the deck lettering and dial ring, dressed on the plate (dress.py): L0 and L4 carry it
        plate = np.asarray(Image.open(dressed_p).convert('RGB'), float)
    deck = poly(size, R['deck'], 0, 1.2)
    head = poly(size, R['head'])
    jaw_raw = poly(size, R['jawOpen'])
    jaw_g = poly(size, R['jawOpen'], jaw_grow, 1.0)
    jaw_core = poly(size, R['jawOpen'], -6)
    mouth = poly(size, R['mouthOpen'], 3, 1.0)
    mouth_g = poly(size, R['mouthOpen'], 10, 1.5)
    # jaw: inside the grown jaw polygon, not the head, creature by the matte (the jaw's own core is always creature)
    jaw_a = jaw_g * (1 - head) * np.maximum(matte, jaw_core) * (1 - mouth * (1 - jaw_raw))
    # the lower teeth stand inside the mouth polygon: keep the band just above the lower lip with the jaw
    lip = R['lowerLipOpen']; hg = R['hinge']; tooth = R['tooth'] * 1.25
    a = math.radians(R['openDeg'])
    up = (-math.sin(a) * tooth, -math.cos(a) * tooth)
    band = [tuple(p) for p in lip] + [(p[0] + up[0], p[1] + up[1]) for p in lip[::-1]]
    teeth = poly(size, band, 2, 1.0)
    jaw_a = np.maximum(jaw_a, teeth * (1 - head))
    # keep only the jaw itself: drop stray specks that are not connected to its body (they would ride along with it)
    jb = Image.fromarray(((jaw_a > 0.35) * 255).astype(np.uint8)).copy()     # a copy: floodfill cannot write into an array view
    ys, xs = np.nonzero((poly(size, R['jawOpen'], -20) > 0.5) & (jaw_a > 0.35))
    cy, cx = int(ys[len(ys) // 2]), int(xs[len(xs) // 2])     # a seed inside the jaw's core (the jaw is curved)
    ImageDraw.floodfill(jb, (cx, cy), 128)
    keep = np.asarray(Image.fromarray(((np.asarray(jb) == 128) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)), float) / 255
    jaw_a = jaw_a * keep
    print(f'jaw layer: {(jaw_a > 0.5).sum()} px kept after dropping unconnected specks')
    throat_a = mouth_g * np.maximum(matte, mouth)
    # the hinge underlay: the jaw's own rear pixels near the hinge, left in place under the turning jaw, so closing the
    # jaw never opens a notch of sky under the cheek (in the engine: a static patch under the jaw)
    yy, xx = np.mgrid[0:size[1], 0:size[0]]
    near = np.clip((150 - np.hypot(xx - hg[0], yy - hg[1])) / 30, 0, 1) * np.clip((xx - hg[0] + 20) / 20, 0, 1)
    under_a = jaw_a * near
    # in front of the hinge and below the upper lip, nothing is static skull: what the painting has there (the painted
    # mouth reaches a little past our sketch's lip lines at the front) belongs to the throat, which each stage masks
    ul = [tuple(p) for p in R['upperLip']]
    front = poly(size, [(ul[0][0] - 90, ul[0][1] - 6)] + ul + [(hg[0], size[1]), (ul[0][0] - 90, size[1])], 0, 1.5)
    front = front * (1 - head) * (1 - jaw_g)
    throat_a = np.maximum(throat_a, matte * front)
    top_a = matte * (1 - np.maximum(np.maximum(jaw_a, mouth * (1 - head)), front))
    top_a = np.maximum(top_a, matte * head * (1 - mouth))
    # nothing static may hang under the open jaw (b1 painted a thin whisker there from our sketch's pleat lines):
    # clear the static layer in the sky below the jaw's underside, in front of the hinge
    und = [p for p in R['jawOpen'][len(R['lowerLipOpen']):] if p[0] < hg[0]]
    xs_ = [p[0] for p in und]
    below = poly(size, und + [(max(xs_), size[1]), (min(xs_) - 60, size[1]), (min(xs_) - 60, und[-1][1])], 0, 2.0)
    top_a = top_a * (1 - below * (1 - jaw_g))
    Image.fromarray(plate.astype(np.uint8)).save(f'{out}/L0-plate.png')
    rgba(master, throat_a).save(f'{out}/L1-throat.png')
    rgba(master, jaw_a).save(f'{out}/L2-jaw.png')
    rgba(master, under_a).save(f'{out}/L1b-hinge.png')
    rgba(master, top_a).save(f'{out}/L3-top.png')
    rgba(plate, deck).save(f'{out}/L4-deck.png')
    shut = R['openDeg'] if shut_deg is None else shut_deg
    turns = [shut * (1 - k / (STAGES - 1)) for k in range(STAGES)]
    json.dump({'game': 'FFX only', 'hinge': hg, 'order': ['L0-plate', 'L1-throat (masked by the mouth at this stage)', 'L1b-hinge', 'L2-jaw (turned)', 'L3-top', 'L4-deck'],
               'jawTurnBackDeg': turns, 'note': 'stage k: turn L2 clockwise (chin up) by jawTurnBackDeg[k] about hinge'},
              open(f'{out}/rig-out.json', 'w'), indent=1)
    L = {n: Image.open(f'{out}/{n}.png').convert('RGBA') for n in ['L1-throat', 'L1b-hinge', 'L2-jaw', 'L3-top', 'L4-deck']}
    for k, t in enumerate(turns):
        im = Image.open(f'{out}/L0-plate.png').convert('RGBA')
        # the throat shows only inside the mouth as it is at this stage: between the upper lip and the turned lower lip
        # (in the engine, a mask that turns with the jaw)
        c, s_ = math.cos(math.radians(t)), math.sin(math.radians(t))
        turned = [(hg[0] + (x - hg[0]) * c - (y - hg[1]) * s_, hg[1] + (x - hg[0]) * s_ + (y - hg[1]) * c) for x, y in lip]
        ul = [tuple(p) for p in R['upperLip']]
        wedge = poly(size, [(ul[0][0] - 90, ul[0][1])] + ul + turned[::-1] + [(turned[0][0] - 90, turned[0][1])], 4, 1.0)
        th = L['L1-throat'].copy()
        th.putalpha(Image.fromarray((np.asarray(th.split()[3], float) * wedge).astype(np.uint8)))
        im.alpha_composite(th)
        im.alpha_composite(L['L1b-hinge'])
        im.alpha_composite(L['L2-jaw'].rotate(-t, resample=Image.BICUBIC, center=tuple(hg)))
        im.alpha_composite(L['L3-top'])
        im.alpha_composite(L['L4-deck'])
        im.convert('RGB').save(f'{out}/stage-{k}.png')
        print('stage', k, f'jaw turned back {t:.1f} deg')


if __name__ == '__main__':
    if sys.argv[1] == 'layers':
        a = sys.argv[2:]
        layers(a[0], a[1], a[2], a[3], int(a[4]) if len(a) > 4 else 14, float(a[5]) if len(a) > 5 and a[5] != '-' else None,
               a[6] if len(a) > 6 else None, a[7] if len(a) > 7 else None)
