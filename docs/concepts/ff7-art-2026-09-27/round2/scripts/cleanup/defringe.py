# FF7 art cleanup round (2026-09-27): remove the pale fringe a white-background cut leaves on the
# silhouette (the canon judge saw it on Cloud's hair and arm edges).
#
# An edge pixel (opaque, next to a transparent one) is fringe when it is clearly LIGHTER than the
# figure just inside it and not more colourful than it: that is white background bleeding into the
# edge, not a lit edge of the figure. Fringe pixels are made transparent, up to `passes` pixels
# deep. White clothing is safe: its inside is as light as its edge, so it never qualifies.
# Last, every remaining edge pixel gets its colour pulled halfway toward the colour just inside
# (a colour decontamination), and the alpha stays binary so the strict one-component check holds.
#
# Usage: defringe.py <in.png> <out.png> [passes=2]
import json
import sys
import numpy as np
from PIL import Image
from scipy import ndimage


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def chroma(a):
    return a.max(-1) - a.min(-1)


def inner_ref(rgb, alpha, depth=3):
    core = ndimage.binary_erosion(alpha, iterations=depth)
    if not core.any():
        core = alpha
    _, (iy, ix) = ndimage.distance_transform_edt(~core, return_indices=True)
    ref = rgb[iy, ix]
    return np.stack([ndimage.uniform_filter(ref[..., c], 3) for c in range(3)], -1)


def main(src, out, passes=2):
    im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
    rgb, alpha = im[..., :3].copy(), im[..., 3] >= 8
    removed = 0
    for _ in range(passes):
        edge = alpha & ndimage.binary_dilation(~alpha)
        ref = inner_ref(rgb, alpha)
        fringe = edge & (lum(rgb) > lum(ref) + 22) & (lum(rgb) > 150) & (chroma(rgb) < chroma(ref) + 12)
        removed += int(fringe.sum())
        alpha &= ~fringe
    # removing fringe can strand a few edge pixels; specks under 24 px (the strict check's own
    # threshold) are dropped so the figure stays ONE piece. Anything larger is left for the check.
    lab, n = ndimage.label(alpha, structure=np.ones((3, 3)))
    specks = 0
    if n > 1:
        sizes = ndimage.sum(alpha, lab, range(1, n + 1))
        for i, s in enumerate(sizes):
            if s < 24:
                alpha[lab == i + 1] = False
                specks += int(s)
    edge = alpha & ndimage.binary_dilation(~alpha)
    ref = inner_ref(rgb, alpha)
    lighter = edge & (lum(rgb) > lum(ref))
    rgb[lighter] = (rgb[lighter] + ref[lighter]) / 2
    outa = np.dstack([rgb, alpha * 255.0])
    Image.fromarray(np.clip(outa, 0, 255).astype(np.uint8), 'RGBA').save(out)
    print(json.dumps({'fringeRemoved': removed, 'specksDropped': specks, 'edgeDecontaminated': int(lighter.sum())}))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 2)
