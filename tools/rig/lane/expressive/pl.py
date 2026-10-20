"""pl.py <rigdir> <pose> <out.png> <x0,y0,x1,y1> [--zoom 0.5] [--parts a,b] : the painting (darkened) with each rig part's key silhouette in its own colour, a legend, a labelled grid. Env XID, XWORK."""
import colorsys
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from xl import *

a = sys.argv[1:]
rigdir, pose, out, crop = a[0], a[1], a[2], tuple(int(v) for v in a[3].split(','))
zoom = float(a[a.index('--zoom') + 1]) if '--zoom' in a else 0.5
only = a[a.index('--parts') + 1].split(',') if '--parts' in a else None
PAD = 600
W, H = rig_size()
rig, T, model = load_model(rigdir)
key = rig['keys'][pose]
base = state_of(rig['parts'], key.get('parts'))
x0, y0, x1, y1 = crop
box = (x0 + PAD, y0 + PAD, x1 + PAD, y1 + PAD)
p = over(BG, painting_in_master(pose, pad=PAD).crop(box)).convert('RGBA')
p.alpha_composite(Image.new('RGBA', p.size, (0, 0, 0, 110)))
names = [q['name'] for q in rig['parts'] if (only is None or q['name'] in only)]
legend = []
for i, n in enumerate(names):
    st = {m: {'shown': m == n and base[m]['shown'], 'image': base[m]['image']} for m in base}
    pose_key(model, rig, key)
    model.set_state(st)
    al = np.asarray(render_pose(model, W, H, pad=PAD).split()[3].crop(box)) > 60
    col = tuple(int(255 * c) for c in colorsys.hsv_to_rgb(i / max(1, len(names)), 0.9, 1.0))
    ov = np.zeros(al.shape + (4,), np.uint8)
    # outline only: the part's silhouette edge plus a faint fill
    from scipy import ndimage as ndi
    edge = al & ~ndi.binary_erosion(al, iterations=2)
    ov[al] = col + (45,)
    ov[edge] = col + (255,)
    p.alpha_composite(Image.fromarray(ov, 'RGBA'))
    legend.append((n, col))
im = p.convert('RGB').resize((int((x1 - x0) * zoom), int((y1 - y0) * zoom)), Image.LANCZOS)
grid(im, x0, y0, zoom, 100)
d = ImageDraw.Draw(im)
for i, (n, col) in enumerate(legend):
    d.rectangle((6, 6 + i * 14, 16, 16 + i * 14), fill=col)
    d.text((20, 6 + i * 14), n, fill=(255, 255, 255))
im.save(out)
print(im.size)
