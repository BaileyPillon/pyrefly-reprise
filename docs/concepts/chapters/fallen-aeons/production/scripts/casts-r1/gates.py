# gates.py name pad ang : MAD outside (repaint mask U rotated arm), invented-colour share, margins, provenance map
import sys, json, numpy as np
from PIL import Image
from scipy.spatial import cKDTree
name, pad, ang = sys.argv[1], int(sys.argv[2]), sys.argv[3]
new = np.asarray(Image.open(f'work/{name}-cast-new.png').convert('RGBA')).astype(np.int32)
idle = np.asarray(Image.open(f'work/{name}-idle-oncast.png').convert('RGBA')).astype(np.int32)
H, W = idle.shape[:2]
I = np.zeros_like(new); I[:, pad:] = idle
rm = np.zeros(new.shape[:2], bool); rm[:, pad:] = np.asarray(Image.open(f'work/{name}-rmask.png')) > 0
# rotated arm support on the new canvas: where new differs from the repaint-only image is the arm; recompute simply:
arm = np.asarray(Image.open(f'work/{name}-armrot{ang}.png'))[..., 3] > 0  # on the old canvas (clipped): shift
armN = np.zeros(new.shape[:2], bool); armN[:, pad:] = arm
# any arm pixels that the old canvas clipped sit left of pad: count them as arm
armN[:, :pad] = new[:, :pad, 3] > 0
changed = np.abs(new - I).max(2) > 0
outside = ~(rm | armN)
print(name, 'changed px', int(changed.sum()), 'changed outside masks', int((changed & outside).sum()),
      'MAD outside', float(np.abs(new - I)[outside].mean()))
# invented colour: generated pixels (rm, not arm, opaque) farther than dE 10 (Lab) from every idle colour
def lab(rgb):
    c = rgb / 255.0; c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    X = c @ np.array([[0.4124, 0.2126, 0.0193], [0.3576, 0.7152, 0.1192], [0.1805, 0.0722, 0.9505]])
    X = X / np.array([0.95047, 1.0, 1.08883]); f = np.where(X > 0.008856, np.cbrt(X), 7.787 * X + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)
ip = idle[idle[..., 3] > 200][:, :3]; ip = np.unique(ip // 2 * 2, axis=0)
tree = cKDTree(lab(ip.astype(np.float64)))
gen = rm & ~armN & (new[..., 3] > 200)
d, _ = tree.query(lab(new[gen][:, :3].astype(np.float64)))
print(' generated px', int(gen.sum()), 'invented share (dE>10)', round(float((d > 10).mean()) * 100, 2), '%', 'median dE', round(float(np.median(d)), 2))
a = new[..., 3]; ys, xs = np.nonzero(a > 8)
print(' size', new.shape[1], new.shape[0], 'margins L T R B', xs.min(), ys.min(), new.shape[1] - 1 - xs.max(), new.shape[0] - 1 - ys.max())
# provenance: grey = idle unchanged, blue = idle pixels rotated (arm), magenta = generated inside the repaint mask
pv = np.zeros(new.shape[:3], np.uint8); op = a > 8
pv[op & ~changed] = [150, 150, 150, 255]
pv[op & armN & (new[..., 3] > 0)] = [60, 110, 255, 255]
pv[op & gen & changed] = [255, 0, 255, 255]
pv[op & changed & ~armN & ~gen] = [255, 170, 0, 255]  # amber: edge blend / feather band
Image.fromarray(pv, 'RGBA').save(f'work/{name}-cast-provenance.png')
json.dump({'changedOutsideMasks': int((changed & outside).sum()), 'generatedPx': int(gen.sum()), 'inventedSharePct': round(float((d > 10).mean()) * 100, 2)}, open(f'work/{name}-gates.json', 'w'))
