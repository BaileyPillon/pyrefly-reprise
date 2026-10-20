"""gv.py <pose> <x0> <y0> <x1> <y1> <out.png> [--rig DIR] [--step 50] [--zoom 1] [--poly cuts.json:key] : the pose's painting (in the idle's master frame) cropped with a labelled grid; with --rig the rig's key beside it; with --poly a polygon drawn on it.
Env XID, XWORK as xl.py."""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from xl import *

a = sys.argv[1:]
pose, x0, y0, x1, y1 = a[0], *map(int, a[1:5])
out = a[5]
g = lambda n, d: ((type(d) if d is not None else str)(a[a.index(n) + 1])) if n in a else d
rigdir = g('--rig', None)
step = g('--step', 50)
zoom = g('--zoom', 1.0)
PAD = 500
W, H = rig_size()
p = painting_in_master(pose, pad=PAD)
box = (x0 + PAD, y0 + PAD, x1 + PAD, y1 + PAD)
tiles = [over(BG, p.crop(box))]
if rigdir:
    rig, T2, model = load_model(rigdir)
    pose_key(model, rig, rig['keys'][pose])
    r = render_pose(model, W, H, pad=PAD)
    tiles.append(over(BG, r.crop(box)))
outs = []
for t in tiles:
    t = t.resize((int(t.width * zoom), int(t.height * zoom)), Image.LANCZOS)
    grid(t, x0, y0, zoom, step)
    outs.append(t)
if '--poly' in a:
    spec = a[a.index('--poly') + 1]
    fn, _, key = spec.rpartition('@')
    cuts = json.load(open(fn))
    cut = cuts[key]
    for t in outs[:1]:
        d = ImageDraw.Draw(t)
        pts = [((x - x0) * zoom, (y - y0) * zoom) for x, y in cut['poly']]
        d.line(pts + [pts[0]], fill=(0, 255, 120), width=2)
        for i, (x, y) in enumerate(pts):
            d.ellipse((x - 3, y - 3, x + 3, y + 3), outline=(255, 80, 80))
            d.text((x + 4, y - 10), str(i), fill=(255, 200, 200))
        for c in cut.get('cutline', []):
            d.line([((x - x0) * zoom, (y - y0) * zoom) for x, y in c], fill=(255, 0, 255), width=2)
s = Image.new('RGB', (sum(t.width for t in outs) + 10 * (len(outs) - 1), outs[0].height), (20, 20, 24))
x = 0
for t in outs:
    s.paste(t, (x, 0))
    x += t.width + 10
s.save(out)
print(s.size)
