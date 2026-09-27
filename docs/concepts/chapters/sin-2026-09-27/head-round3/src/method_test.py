"""Sin's head, round 3 method check (FFX only, 2026-09-27): the smallest test that tells the two methods apart.

Test A (layered rig, no GPU): take round 2's own stage-4 painting (our render), cut it into a skull layer, a
throat layer and a lower-jaw layer along round 2's sketch geometry, and turn ONLY the jaw layer about its hinge to
the five stage angles, over round 2's stage-0 painting as the plate. Outside the jaw's path every pixel is the
same in all five results by construction. What we look for: does the turned jaw read as the same jaw at every
angle, and where do holes or seams open (hinge, chin, the revealed sky)?

Test B (masked inpaint at low denoise) is one ComfyUI render made by gen.py (mode `mouth`), measured by `measure`
here: how many pixels outside the mouth mask change, and whether a 0.40 denoise can move a jaw at all.

  python method_test.py rig  <out_dir>
  python method_test.py measure <a.png> <b.png> <mask.png>
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

R2 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2'
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'head-round2', 'src'))
import sketch as s2  # round 2's sketch geometry (read only)

K = 1.75  # base pixels -> full painting pixels


def full(p):
    x, y = s2.QT(*p)
    return (x / 2 * K, y / 2 * K)


def poly_mask(pts, size, grow=0, blur=1.5):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    if grow:
        m = m.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


def rig(out):
    os.makedirs(out, exist_ok=True)
    open4 = Image.open(f'{R2}/final/stage-4.png').convert('RGBA')
    plate = Image.open(f'{R2}/final/stage-0.png').convert('RGBA')
    size = open4.size
    deg = 24
    hinge = full(s2.HINGE)
    jaw = [full(s2.rot(p, deg)) for p in s2.JAW]
    mouth = [full(p) for p in s2.UPPER_LIP] + [full(s2.rot(p, deg)) for p in s2.LOWER_LIP[::-1]]
    jm = poly_mask(jaw, size, 6)
    mm = poly_mask(mouth, size, 4)
    jaw_l = open4.copy(); jaw_l.putalpha(jm)
    thr_l = open4.copy(); thr_l.putalpha(mm)
    sk = Image.fromarray(np.clip(255 - np.maximum(np.asarray(jm, int), np.asarray(mm, int)), 0, 255).astype(np.uint8))
    # the skull layer = the stage-4 painting outside the jaw and the mouth, only where it is creature (not the plate)
    skull_l = open4.copy(); skull_l.putalpha(sk)
    outs = []
    for k, a in enumerate([0, 6, 12, 18, 24]):
        im = plate.copy()
        im.alpha_composite(thr_l)
        # turn the jaw layer back up by (24 - a) degrees about the hinge (PIL rotates counter-clockwise for +angle)
        j = jaw_l.rotate(-(deg - a), resample=Image.BICUBIC, center=hinge)
        im.alpha_composite(j)
        im.alpha_composite(skull_l)
        p = os.path.join(out, f'rig-s{k}.png'); im.convert('RGB').save(p); outs.append(p)
        print('wrote', p)
    return outs


def measure(a, b, mask):
    A = np.asarray(Image.open(a).convert('RGB'), float); B = np.asarray(Image.open(b).convert('RGB'), float)
    M = np.asarray(Image.open(mask).convert('L').resize((A.shape[1], A.shape[0])), float) / 255
    d = np.abs(A - B).max(axis=2) > 6
    out = M < 0.02
    print(f'changed outside the mask: {(d & out).sum() / out.sum():.3%}; inside: {(d & ~out).sum() / max(1, (~out).sum()):.1%}')


def bprep(out):
    """Test B's tight mask: exactly where round 2's sketch 2 differs from sketch 0, grown only enough to cover the
    pasted sketch (7 px), none of round 2's 41 px growth."""
    s0 = np.asarray(Image.open(f'{R2}/sketches/sketch-s0.png').convert('RGB'), float)
    sk = np.asarray(Image.open(f'{R2}/sketches/sketch-s2.png').convert('RGB'), float)
    m = Image.fromarray(((np.abs(sk - s0).max(axis=2) > 14) * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(7))
    m.save(f'{out}/b-mask.png'); m.resize((2352, 1344), Image.BILINEAR).save(f'{out}/b-mask-full.png')
    print('mask px', int((np.asarray(m) > 0).sum()))


if __name__ == '__main__':
    if sys.argv[1] == 'bprep':
        bprep(sys.argv[2])
    elif sys.argv[1] == 'rig':
        rig(sys.argv[2])
    else:
        measure(*sys.argv[2:5])
