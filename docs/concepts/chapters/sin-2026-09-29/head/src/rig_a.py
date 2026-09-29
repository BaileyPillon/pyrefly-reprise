"""Sin's head, option A (FFX only, 2026-09-29): the head-on face, as a layered rig with one moving jaw.

Option A of round 1 (docs/concepts/chapters/sin-2026-09-27/head-pilot/, the dusk leviathan, head-on, wings spread) had
the best clock read but no rig. Here it is painted ONCE into round 3's plate p6, mouth fully open, and cut into layers:

  L0-plate   sky, Bevelle, the white tower (round 3's dressed plate)            static
  L1-throat  the mouth interior; each stage shows it only between the upper lip and the jaw's lip at that stage
  L2-jaw     the lower jaw with its teeth                                        MOVES: straight up by lift[k]
  L3-top     skull, brow, eyes, upper fangs, both wings, the arm and claw        static
  L4-deck    the Fahrenheit's prow (round 3's)                                   static

Seen from the front a jaw that drops mostly moves down, so a translation stands in for the turn (our estimate). The jaw
is clipped under the skull's lower edge, so its teeth never show above the upper lip; at stage 0 its lip meets the upper
lip. Every surface except the jaw's position is the same pixels in all five stages.

  python rig_a.py layers <plate.png> <master.png> <geometry-a.json> <out_dir> <dressedPlate.png> <regionMask.png> <rig3.json> [shutLift]
"""
import json, os, sys
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
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), (np.clip(alpha, 0, 1) * 255).astype(np.uint8)]), 'RGBA')


def layers(plate_p, master_p, geo_p, out, dressed_p, region_p, rig3_p, shut_lift=None):
    os.makedirs(out, exist_ok=True)
    G = json.load(open(geo_p))
    R3 = json.load(open(rig3_p))
    plate = np.asarray(Image.open(plate_p).convert('RGB'), float)
    master = np.asarray(Image.open(master_p).convert('RGB'), float)
    size = (plate.shape[1], plate.shape[0])
    diff = np.abs(master - plate).max(axis=2)
    m = np.clip((diff - 8) / 22, 0, 1)
    mi = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
    matte = np.asarray(mi, float) / 255 * np.asarray(Image.open(region_p).convert('L').resize(size), float) / 255
    dressed = np.asarray(Image.open(dressed_p).convert('RGB'), float)
    deck = poly(size, R3['deck'], 0, 1.2)
    ul = G['upperLip']; ll = G['lowerLip']
    yy, xx = np.mgrid[0:size[1], 0:size[0]]
    ul_y = np.interp(xx, [p[0] for p in ul], [p[1] for p in ul])
    xs_ll = [p[0] for p in ll][::-1]; ys_ll = [p[1] for p in ll][::-1]
    ll_y = np.interp(xx, xs_ll, ys_ll)
    x_in = (xx > min(xs_ll) - 10) & (xx < max(xs_ll) + 10)
    # the jaw: the sketch's U grown, plus the band where the lower teeth stand above its lip
    jaw_poly = poly(size, G['jaw'], 18, 1.0)
    teeth = ((yy > ll_y - 52) & (yy <= ll_y + 4) & x_in).astype(float)
    jaw_a = np.maximum(jaw_poly, teeth) * matte
    jaw_a *= (yy > ul_y + 40)                              # nothing of the upper jaw rides along
    # keep the jaw's connected body only
    jb = Image.fromarray(((jaw_a > 0.35) * 255).astype(np.uint8)).copy()
    cy = int(np.interp(G['faceCentreX'], xs_ll, ys_ll)) + 40
    ImageDraw.floodfill(jb, (int(G['faceCentreX']), cy), 128)
    keep = np.asarray(Image.fromarray(((np.asarray(jb) == 128) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)), float) / 255
    jaw_a = jaw_a * keep
    # after LOOKING at the first stages: the repaint left a band of hazy sky round the creature that the matte counts as
    # creature; lifted with the jaw it showed as a pale halo. Drop sky-coloured pixels (warm, bright) and pull the edge in
    r_, g_, b_ = master[..., 0], master[..., 1], master[..., 2]
    skyish = ((r_ - b_) > 40) & ((r_ - g_) > 20) & (master.mean(axis=2) > 125)
    jaw_cut = jaw_a.copy()                                  # the layer split uses the untrimmed jaw: trimmed pixels drop
    jaw_a = jaw_a * (1 - np.asarray(Image.fromarray((skyish * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1)), float) / 255)
    jaw_a = np.asarray(Image.fromarray((np.clip(jaw_a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7)), float) / 255
    # colour the jaw's soft edge from its own opaque pixels (no sky riding along)
    solid = (jaw_a > 0.97).astype(float)
    def nb(x, r):
        return np.asarray(Image.fromarray(np.clip(x, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), float)
    den = nb(solid * 255, 4)[..., None] / 255
    num = np.dstack([nb(master[..., c] * solid, 4) for c in range(3)])
    jaw_rgb = np.where(((jaw_a > 0) & (jaw_a < 0.97))[..., None] & (den > 0.02), num / np.maximum(den, 1e-3), master)
    # the throat: the mouth between the upper lip and the jaw's lip, as painted (fully open)
    mouth = ((yy > ul_y - 6) & (yy < ll_y + 6) & x_in).astype(float)
    throat_a = mouth * matte * (1 - jaw_a)                 # behind the trimmed jaw: no seam of plate inside the mouth
    top_a = matte * (1 - np.maximum(jaw_cut, mouth * matte * (1 - jaw_cut)))
    # the upper fangs hang into the mouth: keep pale pixels within a fang's length under the upper lip on the top layer
    lum = master.mean(axis=2)
    fang = (lum > 150) & (yy > ul_y - 6) & (yy < ul_y + 60) & x_in
    fang_s = np.asarray(Image.fromarray((fang * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)), float) / 255
    top_a = np.maximum(top_a, throat_a * fang_s)
    throat_a = throat_a * (1 - fang_s)
    # the lift that closes the mouth: the jaw's lip up to the upper lip at the face's centre
    cx = int(G['faceCentreX'])
    lift0 = float(shut_lift) if shut_lift is not None else float(np.interp(cx, xs_ll, ys_ll) - np.interp(cx, [p[0] for p in ul], [p[1] for p in ul]))
    lifts = [lift0 * (1 - k / (STAGES - 1)) for k in range(STAGES)]
    Image.fromarray(dressed.astype(np.uint8)).save(f'{out}/L0-plate.png')
    rgba(master, throat_a).save(f'{out}/L1-throat.png')
    rgba(jaw_rgb, jaw_a).save(f'{out}/L2-jaw.png')
    rgba(master, top_a).save(f'{out}/L3-top.png')
    rgba(dressed, deck).save(f'{out}/L4-deck.png')
    clip = np.clip((yy - (ul_y - 2)) / 3, 0, 1)            # the jaw shows only below the upper lip
    Image.fromarray((clip * 255).astype(np.uint8)).save(f'{out}/clip.png')
    json.dump({'game': 'FFX only', 'jawLiftPx': lifts, 'upperLip': ul, 'lowerLipOpen': ll,
               'order': ['L0-plate', 'L1-throat (between the upper lip and the lifted jaw lip)', 'L2-jaw (lifted, clipped under the upper lip)', 'L3-top', 'L4-deck'],
               'note': 'stage k: move L2 up by jawLiftPx[k] px; a translation stands in for the turn seen head-on (our estimate)'},
              open(f'{out}/rig-out.json', 'w'), indent=1)
    L = {n: Image.open(f'{out}/{n}.png').convert('RGBA') for n in ['L1-throat', 'L2-jaw', 'L3-top', 'L4-deck']}
    for k, lift in enumerate(lifts):
        im = Image.open(f'{out}/L0-plate.png').convert('RGBA')
        wedge = ((yy > ul_y - 6) & (yy < ll_y - lift + 6) & x_in).astype(float)
        th = L['L1-throat'].copy()
        th.putalpha(Image.fromarray((np.asarray(th.split()[3], float) * wedge).astype(np.uint8)))
        im.alpha_composite(th)
        jw = Image.new('RGBA', size, (0, 0, 0, 0))
        jw.paste(L['L2-jaw'], (0, -int(round(lift))))
        jw.putalpha(Image.fromarray((np.asarray(jw.split()[3], float) * clip).astype(np.uint8)))
        im.alpha_composite(jw)
        im.alpha_composite(L['L3-top'])
        im.alpha_composite(L['L4-deck'])
        im.convert('RGB').save(f'{out}/stage-{k}.png')
        im.convert('RGB').save(f'{out}/stage-{k}.jpg', quality=92)
        print('stage', k, f'jaw lifted {lift:.0f} px')


if __name__ == '__main__':
    if sys.argv[1] == 'layers':
        a = sys.argv[2:]
        layers(*a[:7], a[7] if len(a) > 7 else None)
