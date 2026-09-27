"""Hi-fi round: close a bite the rembg cut took out of a figure's EDGE (a grey steel blade on the grey studio
background reads as background to rembg). Inside one box (cut-out pixel coords) the alpha gets a morphological
closing of the given radius; every pixel that closing adds is refilled from the full frame, alpha stays binary.
Usage: python close-notch.py <cut.png> <cut.json> <full.png> <out.png> <x0,y0,x1,y1> <radius>"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage
cut_p, js_p, full_p, out_p, box, rad = sys.argv[1:7]
x0, y0, x1, y1 = map(int, box.split(',')); rad = int(rad)
cut = np.asarray(Image.open(cut_p).convert('RGBA')).copy()
cx, cy = json.load(open(js_p))['cropBox'][:2]
full = np.asarray(Image.open(full_p).convert('RGB'))
crop = full[cy:cy + cut.shape[0], cx:cx + cut.shape[1]]
op = cut[..., 3] >= 8
yy, xx = np.mgrid[-rad:rad + 1, -rad:rad + 1]
disk = xx * xx + yy * yy <= rad * rad
sub = np.pad(op[y0:y1, x0:x1], rad + 1)
closed = ndimage.binary_erosion(ndimage.binary_dilation(sub, disk), disk)[rad + 1:-rad - 1, rad + 1:-rad - 1]
add = np.zeros_like(op); add[y0:y1, x0:x1] = closed & ~op[y0:y1, x0:x1]
cut[add, :3] = crop[add]; cut[add, 3] = 255
Image.fromarray(cut).save(out_p)
print(json.dumps({'step': 'close-notch', 'box': [x0, y0, x1, y1], 'radius': rad, 'addedPixels': int(add.sum())}))
