# paste a 1024 inpaint result back into the cut-out at its crop box, inside mask M (feathered), re-matte inside M
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
base, gen, Mp, box, out = sys.argv[1], sys.argv[2], sys.argv[3], tuple(map(int, sys.argv[4].split(','))), sys.argv[5]
B = Image.open(base).convert('RGBA'); w, h = box[2]-box[0], box[3]-box[1]
g = np.array(Image.open(gen).convert('RGB').resize((w, h), Image.LANCZOS)).astype(float)
M = np.array(Image.open(Mp).convert('L')) > 127
soft = np.array(Image.fromarray((M*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(float)/255
soft[~ndi.binary_dilation(M, iterations=3)] = 0
arr = np.array(B).astype(float); sub = arr[box[1]:box[3], box[0]:box[2]]
rgb0 = sub[:, :, :3].copy(); a0 = sub[:, :, 3] > 0
bgwhite = (g.min(2) >= 228) & ((g.max(2)-g.min(2)) <= 20)
outside = ~a0 & ~M
lab, n = ndi.label(bgwhite | outside, structure=np.ones((3,3)))
ext = np.isin(lab, np.unique(lab[outside & (lab > 0)]))
newa = a0.copy(); newa[M] = ~(bgwhite[M] & ext[M])
newa = ndi.binary_opening(newa, iterations=1) | (a0 & ~M)
# colour: where both opaque, blend by soft; where only new opaque, take gen
rgb0[~a0] = g[~a0]
rgb = rgb0*(1-soft[..., None]) + g*soft[..., None]
sub[:, :, :3] = rgb; sub[:, :, 3] = np.where(newa, 255, 0); sub[:, :, :3][~newa] = 0
arr[box[1]:box[3], box[0]:box[2]] = sub
Image.fromarray(arr.clip(0, 255).astype(np.uint8)).save(out)
