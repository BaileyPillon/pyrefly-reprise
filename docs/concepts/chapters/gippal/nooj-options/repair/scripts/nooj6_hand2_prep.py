"""Nooj shade attempt 6, cane hand try 2 of 2 (FFX-2 only).

Try 1 (seed 976101) gave a gloved fist with no silver fingers, but the glove came out maroon, two pink scraps were
left on its far edge, and the cane between the fist and the crook faded to white (the block-in erased it and the
repaint did not bring it back). This paints over try 1's merged raw: the fist pulled toward black (the bible's glove),
the pink scraps black, the silver shaft and the red-and-blue crook drawn up into the fist, and writes the mask for a
low-denoise refinement pass.

    python nooj6_hand2_prep.py   # writes D:/Tools/pyrefly-scratch/nooj6/prep/idle-hand2-{guide,mask}.png
"""
import pathlib

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/idle-repair/idle-r1.raw.png')
PREP = pathlib.Path('D:/Tools/pyrefly-scratch/nooj6/prep')
im = Image.open(SRC).convert('RGB')
fist = Image.open(PREP / 'idle-hand-mask.png').convert('L')
a = np.asarray(im).astype(np.float32)
m = np.asarray(fist).astype(np.float32) / 255.0
lum = a.mean(axis=2, keepdims=True)
dark = (lum < 150) & (m[..., None] > 0.5)
glove = np.clip(lum * 0.55 + np.array([4, 4, 10]), 0, 255)          # desaturate toward a blue-black glove
a = np.where(dark, glove, a)
im = Image.fromarray(a.astype(np.uint8))
d = ImageDraw.Draw(im)
d.polygon([(250, 636), (262, 632), (266, 672), (256, 676)], fill=(14, 14, 20))      # pink scraps -> glove
# silver shaft from under the fist down to where the render's own shaft resumes
d.polygon([(292, 674), (310, 674), (310, 716), (292, 716)], fill=(10, 10, 14))
d.polygon([(295, 674), (307, 674), (307, 716), (295, 716)], fill=(200, 206, 218))
d.line([(298, 676), (298, 714)], fill=(240, 242, 246), width=2)
# the red-and-blue crook rising into the fist
d.line([(268, 676), (262, 700), (262, 716)], fill=(10, 10, 14), width=16)
d.line([(268, 676), (262, 700), (262, 716)], fill=(60, 110, 190), width=10)
d.line([(271, 678), (266, 700)], fill=(200, 50, 40), width=2)
mask = Image.new('L', im.size, 0); dm = ImageDraw.Draw(mask)
dm.polygon([(270, 572), (330, 576), (346, 620), (340, 680), (318, 722), (254, 724), (238, 650), (250, 600)], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(5))
im.save(PREP / 'idle-hand2-guide.png'); mask.save(PREP / 'idle-hand2-mask.png')
print('ok')
