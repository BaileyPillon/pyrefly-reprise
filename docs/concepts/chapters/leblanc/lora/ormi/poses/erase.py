"""Erase a second, back-mounted shield from an Ormi pose render (FFX-2 only).

The ormiX2 LoRA learned the shield from one source, the idle, where it is always on
his back; in a shield bash it keeps that back shield AND draws the one he holds.
Where the back shield lies in FRONT of the body (it occludes the collar), erasing it
to white leaves the back contour along the shield's rim; a dark 2 px line is drawn
along the new edge where it meets the figure, to match the cel outline.

    python erase.py <in.raw.png> <out.raw.png> cx cy rx ry angle [grow]
"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
cx, cy, rx, ry, ang = map(float, sys.argv[3:8])
grow = float(sys.argv[8]) if len(sys.argv) > 8 else 3
im = Image.open(src).convert('RGB')
S = 4
m = Image.new('L', (im.width * S, im.height * S), 0)
ImageDraw.Draw(m).ellipse([(cx - rx - grow) * S, (cy - ry - grow) * S, (cx + rx + grow) * S, (cy + ry + grow) * S], fill=255)
m = m.rotate(ang, center=(cx * S, cy * S)).resize(im.size, Image.LANCZOS)
a = np.asarray(im).astype(np.float32)
mk = np.asarray(m).astype(np.float32)[..., None] / 255.0
out = a * (1 - mk) + 255.0 * mk
# outline: pixels just outside the erased region that are figure (not near-white)
hard = np.asarray(m) > 127
ring = np.asarray(Image.fromarray((hard * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 127
edge = ring & ~hard & (a.min(axis=2) < 235)
out[edge] = out[edge] * 0.25 + np.array([30, 20, 40]) * 0.75
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
Image.fromarray((hard * 255).astype(np.uint8)).save(dst.replace('.raw.png', '.mask.png'))
print('erased', int(hard.sum()), 'px; outline', int(edge.sum()), 'px')
