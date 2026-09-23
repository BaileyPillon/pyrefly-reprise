"""Erase a polygon of an Ormi round-2 render to white (FFX-2 only, Chapter 6).

The erase.py method (../poses/erase.py) with a polygon instead of an ellipse: the
region is filled with white and a dark 2 px line is drawn where the new edge meets the
figure, to match the cel outline. Used on ko.a.980305, whose shield stood on edge
behind his head and ran off the right frame edge (a straight cut in the cut-out).

    python erase-poly.py <in.raw.png> <out.raw.png> x,y,x,y,...
"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, dst, pts = sys.argv[1], sys.argv[2], list(map(float, sys.argv[3].split(',')))
im = Image.open(src).convert('RGB')
S = 4
m = Image.new('L', (im.width * S, im.height * S), 0)
ImageDraw.Draw(m).polygon([(pts[i] * S, pts[i + 1] * S) for i in range(0, len(pts), 2)], fill=255)
m = m.resize(im.size, Image.LANCZOS)
a = np.asarray(im).astype(np.float32)
mk = np.asarray(m).astype(np.float32)[..., None] / 255.0
out = a * (1 - mk) + 255.0 * mk
hard = np.asarray(m) > 127
ring = np.asarray(Image.fromarray((hard * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 127
edge = ring & ~hard & (a.min(axis=2) < 235)
out[edge] = out[edge] * 0.25 + np.array([30, 20, 40]) * 0.75
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
Image.fromarray((hard * 255).astype(np.uint8)).save(dst.replace('.raw.png', '.mask.png'))
print('erased', int(hard.sum()), 'px; outline', int(edge.sum()), 'px')
