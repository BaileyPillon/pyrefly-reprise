"""ov.py <rigdir> <pose> <out.png> [--crop x0,y0,x1,y1] [--zoom 0.5] : painting-only (red), rig-only (blue), both (grey) silhouettes in the idle's master frame, with a labelled grid."""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from xl import *

a = sys.argv[1:]
rigdir, pose, out = a[0], a[1], a[2]
crop = tuple(int(v) for v in a[a.index('--crop') + 1].split(',')) if '--crop' in a else (-450, 0, 2000, 2100)
zoom = float(a[a.index('--zoom') + 1]) if '--zoom' in a else 0.5
PAD = 600
W, H = rig_size()
rig, T, model = load_model(rigdir)
pose_key(model, rig, rig['keys'][pose])
r = render_pose(model, W, H, pad=PAD)
p = painting_in_master(pose, pad=PAD)
ra = np.asarray(r.split()[3]) > 127
pa = np.asarray(p.split()[3]) > 127
x0, y0, x1, y1 = crop
box = (x0 + PAD, y0 + PAD, x1 + PAD, y1 + PAD)
ra, pa = ra[box[1]:box[3], box[0]:box[2]], pa[box[1]:box[3], box[0]:box[2]]
img = np.zeros(ra.shape + (3,), np.uint8)
img[:] = (24, 26, 32)
img[pa & ra] = (150, 150, 150)
img[pa & ~ra] = (230, 60, 60)
img[~pa & ra] = (70, 120, 255)
iou = (pa & ra).sum() / max(1, (pa | ra).sum())
im = Image.fromarray(img).resize((int(img.shape[1] * zoom), int(img.shape[0] * zoom)), Image.NEAREST)
grid(im, x0, y0, zoom, 100)
ImageDraw.Draw(im).text((6, im.height - 14), f'{pose} iou {iou:.3f} red = painting only, blue = rig only', fill=(255, 255, 0))
im.save(out)
print(out, im.size, 'iou', round(float(iou), 3))
