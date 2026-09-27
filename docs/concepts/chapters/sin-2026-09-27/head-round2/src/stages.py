"""Sin's head, round 2 (FFX only): the mouth stages, from their own sketches.

  python stages.py prep <pick-stem> <out_dir>
      For each stage k = 1..4: the mask is where sketch-s<k> differs from sketch-s0 (the jaw, the mouth, the teeth),
      grown a little; the composite is the stage-0 painting with sketch-s<k> pasted inside that mask. Writes
      comp-s<k>.png (1344x768), mask-s<k>.png (1344x768) and mask-s<k>-full.png (2352x1344).
      Nothing is cut out of the painting and turned: the new jaw is drawn in the sketch at its own angle.
  python stages.py blend <pick-stem> <render-stem> <k> <out.png>
      Sets the repainted region into the stage-0 full painting with a feathered mask, so every pixel outside the
      mouth region is the stage-0 painting's own.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2'
FULL = (2352, 1344)


def arr(p):
    return np.asarray(Image.open(p).convert('RGB'), float)


def diff_mask(k):
    s0, sk = arr(f'{C}/sketches/sketch-s0.png'), arr(f'{C}/sketches/sketch-s{k}.png')
    m = (np.abs(sk - s0).max(axis=2) > 14).astype(np.uint8) * 255
    im = Image.fromarray(m).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))   # close pin holes
    return im


def prep(pick, out):
    os.makedirs(out, exist_ok=True)
    base = Image.open(pick + '.base.png').convert('RGB')
    for k in range(1, 5):
        core = diff_mask(k)
        paste = core.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2))
        sk = Image.open(f'{C}/sketches/sketch-s{k}.png').convert('RGB')
        comp = Image.composite(sk, base, paste)
        comp.save(f'{out}/comp-s{k}.png')
        grow = core.filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.GaussianBlur(4))
        grow.save(f'{out}/mask-s{k}.png')
        grow.resize(FULL, Image.BILINEAR).save(f'{out}/mask-s{k}-full.png')
        print('stage', k, 'mask px', int((np.asarray(core) > 0).sum()), 'of', 1344 * 768)


def blend(pick, render, k, out):
    s0 = Image.open(pick + '.full.png').convert('RGB')
    rk = Image.open(render + '.full.png').convert('RGB')
    m = Image.open(f'{C}/stages/mask-s{k}-full.png').convert('L').filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(6))
    Image.composite(rk, s0, m).save(out)
    changed = (np.asarray(m) > 8).mean()
    print('blended stage', k, f'{changed:.1%} of the picture repainted ->', out)


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        prep(sys.argv[2], sys.argv[3])
    else:
        blend(sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5])
