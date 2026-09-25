"""Paste a masked render back into its init inside the feathered mask (everything outside = the init's pixels)."""
import sys, numpy as np
from PIL import Image
init, render, maskL, out = sys.argv[1:5]
i = np.array(Image.open(init).convert('RGB')).astype(float); r = np.array(Image.open(render).convert('RGB')).astype(float)
m = np.array(Image.open(maskL).convert('L')).astype(float)[..., None] / 255
Image.fromarray(np.clip(np.rint(i * (1 - m) + r * m), 0, 255).astype(np.uint8)).save(out)
