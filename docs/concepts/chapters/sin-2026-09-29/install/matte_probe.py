"""Sin production art (FFX only, 2026-09-29): probe the difference matte of a masked repaint against its base plate.

Every Sin creature was painted INTO its plate as a masked repaint (gen.py mouth mode), so outside the creature the
pixels are the plate's, give or take the detail pass. The matte is where the painting differs from the plate, inside
the repaint mask. This probe writes the matte on magenta so it can be LOOKED at before any cut is made.

  python matte_probe.py <painting.full.png> <base.full.png> <mask-full.png> <out.jpg> [lo=8] [span=22]
"""
import sys
import numpy as np
from PIL import Image, ImageFilter


def diff_matte(paint, base, mask, lo=8.0, span=22.0):
    d = np.abs(paint.astype(float) - base.astype(float)).max(axis=2)
    m = np.clip((d - lo) / span, 0, 1)
    mi = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    return np.asarray(mi, float) / 255 * mask


def main(p, b, mk, out, lo='8', span='22'):
    paint = np.asarray(Image.open(p).convert('RGB'))
    base = np.asarray(Image.open(b).convert('RGB'))
    mask = np.asarray(Image.open(mk).convert('L').resize(paint.shape[1::-1]), float) / 255
    m = diff_matte(paint, base, mask, float(lo), float(span))
    mag = np.array((255, 0, 255), float)
    o = paint * m[..., None] + mag * (1 - m[..., None])
    Image.fromarray(o.astype(np.uint8)).resize((1176, 672), Image.LANCZOS).save(out, quality=85)
    print(out, 'matte>0.5', round(float((m > 0.5).mean()), 4), 'mask>0.5', round(float((mask > 0.5).mean()), 4))


if __name__ == '__main__':
    main(*sys.argv[1:])
