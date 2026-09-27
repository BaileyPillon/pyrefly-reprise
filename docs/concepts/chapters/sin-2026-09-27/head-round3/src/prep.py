"""Sin's head, round 3 (FFX only): prepare the creature job, painted INTO the chosen plate.

  python prep.py <plate-stem> <sketch_dir> <out_dir>
      mask       where our creature sketch differs from our plate sketch (the silhouette), grown 10 px so the
                 paint can shape the edges; mask-sin.png (1344x768) and mask-sin-full.png (2352x1344)
      composite  the plate painting (base size) with the creature sketch pasted inside the silhouette:
                 comp-sin.png. gen.py `mouth` mode repaints only inside the mask, so every pixel outside it stays
                 the plate's own, and rig.py can find the creature as "where the master differs from the plate".
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter


def main(plate, sk, out):
    os.makedirs(out, exist_ok=True)
    a = np.asarray(Image.open(f'{sk}/sketch-sin.png').convert('RGB'), float)
    b = np.asarray(Image.open(f'{sk}/sketch-plate.png').convert('RGB'), float)
    core = Image.fromarray(((np.abs(a - b).max(axis=2) > 16) * 255).astype(np.uint8))
    core = core.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    paste = core.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
    base = Image.open(plate + '.base.png').convert('RGB')
    Image.composite(Image.open(f'{sk}/sketch-sin.png').convert('RGB'), base, paste).save(f'{out}/comp-sin.png')
    grow = core.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(3))
    grow.save(f'{out}/mask-sin.png')
    grow.resize((2352, 1344), Image.BILINEAR).save(f'{out}/mask-sin-full.png')
    print('silhouette px', int((np.asarray(core) > 0).sum()), 'of', 1344 * 768)


if __name__ == '__main__':
    main(*sys.argv[1:4])
