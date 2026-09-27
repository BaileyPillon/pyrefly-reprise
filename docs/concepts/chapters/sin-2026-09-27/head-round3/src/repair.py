"""Sin's head, round 3 (FFX only): one-time repairs on the picked creature painting BEFORE it is cut into layers.

In the rig every layer except the jaw's position is shared by all five stages, so a repair made here is made once and
holds in every stage by construction (round 2 had to repair each stage apart).

  python repair.py mask <name> <out_dir>
      writes fix-<name>.png (1344x768) and fix-<name>-full.png (2352x1344) for one repair region:
        wing    the near (left) wing, from our sketch's fan geometry
        cheek   the cheek behind the eye, where b1 grew a hose-like loop and a cog
        patch2  the shoulder (an orange strap after the wing repair) and the cheek by the hinge (wire-like loops)
  python repair.py blend <master.png> <render-stem> <name> <out.png>
      sets a masked repaint back into the master with a feathered mask: outside the region every pixel is the master's.
  python repair.py mend <master.png> <out.png>
      clones the painting's own nearby scales over two spots (see CLONES), greys out the orange strap and the warm
      band at the snout tip.
  python repair.py throat <master.png> <rig.json> <out.png>
      smooths the mouth interior into dark wet flesh (b1's throat had thin string-like streaks), keeping both rows of teeth:
      inside the (grown) mouth polygon, every dark pixel (not a tooth, not the grey jaw, not the tongue) is replaced by the interior's own colours,
      blurred with the teeth left out, plus a faint grain, a little darker. Our own pixels only; no new structure appears.
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sketch as sk

K = 2352 / 1344


def region(name):
    if name == 'wing':
        rx, ry = sk.T((1150, 124))
        L = 270 * sk.SIN_SCALE * 1.15
        pts = [(rx + 46, ry + 40), (rx - 50, ry + 40)]
        for i in range(25):
            a = math.radians(190 + (288 - 190) * i / 24)
            pts.append((rx + L * math.cos(a), ry + L * math.sin(a)))
        return pts
    if name == 'cheek':
        return [(850, 196), (1012, 196), (1016, 292), (952, 296), (850, 262)]
    if name == 'patch2':      # after LOOKING at the first repairs: an orange strap over the shoulder, wire-like loops by the hinge
        return [(1022, 108), (1142, 108), (1142, 204), (1022, 204), (1022, 206), (1020, 306), (920, 306), (918, 206)]
    raise SystemExit('unknown region ' + name)


def mask(name, out):
    os.makedirs(out, exist_ok=True)
    m = Image.new('L', (1344, 768), 0)
    ImageDraw.Draw(m).polygon(region(name), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(3))
    m.save(f'{out}/fix-{name}.png')
    m.resize((2352, 1344), Image.BILINEAR).save(f'{out}/fix-{name}-full.png')
    print('mask', name, int((np.asarray(m) > 127).sum()), 'px')


def blend(master, render, name, out):
    a = Image.open(master).convert('RGB'); b = Image.open(render + '.full.png').convert('RGB')
    d = os.path.dirname(render)
    m = Image.open(f'{d}/fix-{name}-full.png').convert('L').filter(ImageFilter.GaussianBlur(6))
    Image.composite(b, a, m).save(out)
    print('blended', name, '->', out)


def throat(master, rig, out):
    R = json.load(open(rig))
    im = Image.open(master).convert('RGB')
    size = im.size
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in R['mouthOpen']], fill=255)
    m = m.filter(ImageFilter.MaxFilter(41))                                   # the painted mouth is a little larger
    a = np.asarray(im, float)
    lum = a.mean(axis=2)
    teeth = Image.fromarray(((lum > 150) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(13))
    dark = np.clip((105 - lum) / 25, 0, 1)                                     # the dark interior only, not the grey jaw or the tongue
    w = (np.asarray(m, float) / 255) * (1 - np.asarray(teeth, float) / 255) * dark
    w = np.asarray(Image.fromarray((w * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), float) / 255
    # the interior's own colours, blurred with the teeth left out (a normalised masked blur), so nothing bright bleeds in
    def blur(x, r):
        return np.asarray(Image.fromarray(np.clip(x, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), float)
    wb = blur(w * 255, 16) / 255 + 1e-3
    soft = np.stack([blur(a[..., c] * w, 16) / wb for c in range(3)], axis=2)
    grain = np.random.default_rng(3).normal(0, 1, a.shape[:2])
    grain = blur(grain * 18 + 128, 2.5) - 128
    flesh = soft * 0.9 + grain[..., None] * 0.35
    outp = a * (1 - w[..., None]) + flesh * w[..., None]
    Image.fromarray(np.clip(outp, 0, 255).astype(np.uint8)).save(out)
    print('throat smoothed ->', out, f'{(w > 0.5).mean():.1%} of the picture')


# after LOOKING at passes 8 and 9: z-image kept growing gold wires, beads and straps in these two places whatever the
# words, so they are mended with the painting's OWN nearby scales instead (full-size pixels; dst polygon, source offset)
CLONES = [
    ([(1498, 348), (1646, 348), (1650, 452), (1498, 456)], (0, -104)),      # the hose-like loop behind the eye
    ([(1684, 432), (1752, 432), (1752, 500), (1684, 500)], (110, 0)),        # the cog by the hinge
]
ROPE_BOX = (1796, 196, 1972, 344)                                             # the orange strap over the shoulder
SNOUT_BOX = (950, 350, 1075, 430)                                              # a warm orange and blue gum band at the snout tip


def mend(master, out):
    im = Image.open(master).convert('RGB')
    a = np.asarray(im, float).copy()
    for poly_, (ox, oy) in CLONES:
        m = Image.new('L', im.size, 0); ImageDraw.Draw(m).polygon(poly_, fill=255)
        w = np.asarray(m.filter(ImageFilter.GaussianBlur(9)), float)[..., None] / 255
        src = np.roll(np.roll(a, -oy, axis=0), -ox, axis=1)
        a = a * (1 - w) + src * w
    # the strap: orange/brown pixels in its box become the dark grey of the scales around them
    x0, y0, x1, y1 = ROPE_BOX
    b = a[y0:y1, x0:x1]
    r, g, bl = b[..., 0], b[..., 1], b[..., 2]
    orange = np.clip(((r - bl) - 40) / 40, 0, 1) * (r > g)
    orange = np.asarray(Image.fromarray((orange * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2)), float) / 255
    grey = np.full_like(b, 0); grey[...] = np.array([74, 72, 84], float)
    a[y0:y1, x0:x1] = b * (1 - orange[..., None]) + grey * orange[..., None]
    # the snout tip stays the same dark grey as the head (the judge's round-2 finding was a pink snout tip)
    x0, y0, x1, y1 = SNOUT_BOX
    b = a[y0:y1, x0:x1]
    r, g, bl = b[..., 0], b[..., 1], b[..., 2]
    warm = np.clip(((r - bl) - 30) / 30, 0, 1) * (r > g)
    cold = np.clip(((bl - r) - 30) / 30, 0, 1)
    dim = np.clip((160 - b.mean(axis=2)) / 20, 0, 1)                            # the creature, not the bright sky beside it
    hue = np.asarray(Image.fromarray((np.maximum(warm, cold) * dim * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5)), float) / 255
    lum = b.mean(axis=2, keepdims=True)
    greyed = np.concatenate([lum * 0.62, lum * 0.62, lum * 0.7], axis=2)
    a[y0:y1, x0:x1] = b * (1 - hue[..., None]) + greyed * hue[..., None]
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(out)
    print('mended ->', out)


if __name__ == '__main__':
    c = sys.argv[1]
    if c == 'mend':
        mend(sys.argv[2], sys.argv[3]); sys.exit()
    if c == 'mask':
        mask(sys.argv[2], sys.argv[3])
    elif c == 'blend':
        blend(*sys.argv[2:6])
    else:
        throat(*sys.argv[2:5])
