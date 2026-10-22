"""jm.py <rigdir> <pose> <out.png> <x0,y0,x1,y1> [--zoom 0.5] : the painting with each bone's posed pivot (red dot + name) under the pose's key, the part silhouettes dimmed."""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from xl import *
a = sys.argv[1:]
rigdir, pose, out, crop = a[0], a[1], a[2], tuple(int(v) for v in a[3].split(','))
zoom = float(a[a.index('--zoom') + 1]) if '--zoom' in a else 0.5
PAD = 600
W, H = rig_size()
rig, T, model = load_model(rigdir)
key = rig['keys'][pose]
pose_key(model, rig, key)
x0, y0, x1, y1 = crop
box = (x0 + PAD, y0 + PAD, x1 + PAD, y1 + PAD)
p = over(BG, painting_in_master(pose, pad=PAD).crop(box))
im = p.resize((int((x1 - x0) * zoom), int((y1 - y0) * zoom)), Image.LANCZOS)
grid(im, x0, y0, zoom, 100)
d = ImageDraw.Draw(im)
for b in rig['bones']:
    if b.get('parent', None) is None and b['name'] == 'root':
        pass
    q = bone_affine = None
    k = model.k[model.idx[b['name']]]
    M = np.array([[k[0], k[2], k[4]], [k[1], k[3], k[5]], [0, 0, 1]])
    q = M @ np.array([b['x'], b['y'], 1.0])
    X, Y = (q[0] - x0) * zoom, (q[1] - y0) * zoom
    d.ellipse((X - 4, Y - 4, X + 4, Y + 4), fill=(255, 40, 40))
    d.text((X + 6, Y - 5), b['name'], fill=(255, 255, 255))
im.save(out)
print(im.size)
