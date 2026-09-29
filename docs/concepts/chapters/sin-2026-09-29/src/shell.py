"""Sin art options, 2026-09-29 (FFX only): the shelled state of Genais, painted ON the picked out-of-shell painting.

research/ffx-sin.md 9.3: Genais's "shell state must read at a glance". Two separate paintings would give two different
shells, so the shelled picture is a masked repaint of ONLY the region where our two sketches differ (the body that
leans out, and the shell's mouth), laid on the picked painting: the shell's back, the Core, Sin's back and the sky keep
their pixels. The Core's charge (it gathers energy only while Genais is shelled, research 5.3.2) is a light state added
in the frames, not a painting.

  python shell.py <opt a|b> <picked-stem> <sketch_dir> <out_dir> [x0,y0,x1,y1]
      the optional box (normalised) adds the region where the PAINTING put the body, read off the picked painting
      by eye (the painted head and tentacles reach past our sketch's body); writes genais-<opt>-shell-comp.png, -mask.png, -mask-full.png
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

W, H = 1344, 768
FULL = (2352, 1344)


def main(opt, stem, sk, out, box=None):
    os.makedirs(out, exist_ok=True)
    a = np.asarray(Image.open(f'{sk}/genais-{opt}-comp.png').convert('RGB'), float)
    b = np.asarray(Image.open(f'{sk}/genais-{opt}-shelled-comp.png').convert('RGB'), float)
    core = Image.fromarray(((np.abs(a - b).max(axis=2) > 16) * 255).astype(np.uint8))
    core = core.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    painted = Image.open(stem + '.base.png').convert('RGB')
    shelled = Image.open(f'{sk}/genais-{opt}-shelled-comp.png').convert('RGB')
    paste = core.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
    comp = Image.composite(shelled, painted, paste)
    m = core.filter(ImageFilter.MaxFilter(31))
    if box:                             # inside the box, blur the painted body away so the repaint does not keep a face
        from PIL import ImageDraw
        x0, y0, x1, y1 = (float(v) for v in box.split(','))
        bm = Image.new('L', (W, H), 0)
        ImageDraw.Draw(bm).rectangle([x0 * W, y0 * H, x1 * W, y1 * H], fill=255)
        bm = Image.fromarray((np.asarray(bm, float) * (1 - np.asarray(paste, float) / 255)).astype(np.uint8)).filter(ImageFilter.GaussianBlur(8))
        comp = Image.composite(painted.filter(ImageFilter.GaussianBlur(18)), comp, bm)
        ImageDraw.Draw(m).rectangle([x0 * W, y0 * H, x1 * W, y1 * H], fill=255)
    comp.save(f'{out}/genais-{opt}-shell-comp.png')
    m = m.filter(ImageFilter.GaussianBlur(6))
    m.save(f'{out}/genais-{opt}-shell-mask.png')
    m.resize(FULL, Image.BILINEAR).save(f'{out}/genais-{opt}-shell-mask-full.png')
    print(opt, 'changed px', int((np.asarray(core) > 0).sum()))


if __name__ == '__main__':
    main(*sys.argv[1:6])
