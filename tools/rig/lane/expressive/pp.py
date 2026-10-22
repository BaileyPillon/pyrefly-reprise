"""pp.py <rigdir> <pose> <out.png> <part[,part..]> <x0,y0,x1,y1> [--zoom 0.8] [--other] : the painting with the named rig parts' key silhouette (green) overlaid; --other tints the rest of the rig (blue). Env XID, XWORK."""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from xl import *

a = sys.argv[1:]
rigdir, pose, out, parts, crop = a[0], a[1], a[2], a[3].split(','), tuple(int(v) for v in a[4].split(','))
zoom = float(a[a.index('--zoom') + 1]) if '--zoom' in a else 0.8
PAD = 600
W, H = rig_size()
rig, T, model = load_model(rigdir)
key = rig['keys'][pose]
base = state_of(rig['parts'], key.get('parts'))


def layer(sel):
    st = {n: {'shown': (n in sel) and base[n]['shown'], 'image': base[n]['image']} for n in base}
    pose_key(model, rig, key)
    model.set_state(st)
    return render_pose(model, W, H, pad=PAD)


x0, y0, x1, y1 = crop
box = (x0 + PAD, y0 + PAD, x1 + PAD, y1 + PAD)
p = over(BG, painting_in_master(pose, pad=PAD).crop(box)).convert('RGBA')
dark = Image.new('RGBA', p.size, (0, 0, 0, 120))
p.alpha_composite(dark)
g = np.asarray(layer(set(parts)).split()[3].crop(box)) > 60
ov = np.zeros(g.shape + (4,), np.uint8)
ov[g] = (40, 255, 120, 110)
p.alpha_composite(Image.fromarray(ov, 'RGBA'))
if '--other' in a:
    o = np.asarray(layer(set(base) - set(parts)).split()[3].crop(box)) > 60
    ov = np.zeros(o.shape + (4,), np.uint8)
    ov[o & ~g] = (60, 100, 255, 70)
    p.alpha_composite(Image.fromarray(ov, 'RGBA'))
im = p.convert('RGB').resize((int((x1 - x0) * zoom), int((y1 - y0) * zoom)), Image.LANCZOS)
grid(im, x0, y0, zoom, 50)
im.save(out)
print(im.size)
