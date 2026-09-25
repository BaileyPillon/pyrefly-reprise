# Paragon hero cast, derived from the idle's own pixels (method r3): the whole beast pitched back ANG degrees about
# its hind-foot contact, so the forelegs leave the floor and the horned head rises (rearing to cast). No pixel is
# repainted; the canvas grows so nothing is cut. Usage: pararear.py idle.png out.png ang
import sys, json, numpy as np
from PIL import Image
inp, out, ang = sys.argv[1], sys.argv[2], float(sys.argv[3])
im = Image.open(inp).convert('RGBA'); W, H = im.size
a = np.asarray(im)[..., 3] > 90
# hind-foot contact: the lowest opaque row in the right third of the body (x 700..1000)
cols = np.arange(W); rows = np.arange(H)
sub = a[:, 700:1000]; ys = np.nonzero(sub.any(1))[0]; fy = int(ys.max()); fx = 700 + int(np.nonzero(sub[fy])[0].mean())
pad = 260
big = Image.new('RGBA', (W + 2 * pad, H + 2 * pad), (0, 0, 0, 0)); big.paste(im, (pad, pad))
# premultiplied, 2x, bicubic rotate (negative = clockwise: the head end, on the left, rises)
arr = np.asarray(big).astype(np.float32); arr[..., :3] *= arr[..., 3:4] / 255
b2 = Image.fromarray(arr.round().astype(np.uint8), 'RGBA').resize((big.width * 2, big.height * 2), Image.LANCZOS)
b2 = b2.rotate(-ang, resample=Image.BICUBIC, center=((fx + pad) * 2, (fy + pad) * 2))
r = np.asarray(b2.resize(big.size, Image.LANCZOS)).astype(np.float32)
al = r[..., 3:4]; r[..., :3] = np.where(al > 0, r[..., :3] * 255 / np.maximum(al, 1), 0)
res = Image.fromarray(r.clip(0, 255).round().astype(np.uint8), 'RGBA')
bb = res.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
m = 16
res = res.crop((bb[0] - m, bb[1] - m, bb[2] + m, bb[3] + m))
fyo = fy + pad - (bb[1] - m); fxo = fx + pad - (bb[0] - m)
A2 = np.asarray(res)[..., 3] >= int(0.35 * 255); low = int(np.nonzero(A2.sum(1) >= 3)[0].max())
res.save(out)
json.dump({'pivot_idle': [fx, fy], 'pivot_out': [fxo, fyo], 'lowestRow': low, 'size': res.size, 'ang': ang}, open(out[:-4] + '-geom.json', 'w'))
print(out, res.size, 'hind-foot contact idle', (fx, fy), '-> out', (fxo, fyo), 'lowest opaque row', low)
