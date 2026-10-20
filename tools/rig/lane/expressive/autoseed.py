"""autoseed.py <pose> <seeds.json> <outdir> [--pad 600] [--k 16] [--sigma 6] [--kpart name=n,..] : partition the pose's PAINTING among parts from rough SEED shapes drawn by hand (master px of the idle frame):
{"part": [{"poly": [[x, y], ...]}, {"line": [[x, y], ...], "w": 40}, ...], ...}   (a part with no seeds gets nothing; the file's order is back to front: a tie goes to the later part).
Every painting pixel (alpha > 8) goes to the part whose seed is nearest, the labels are smoothed, each label is dilated by k px into its neighbours (the underlap), and <outdir>/<pose>.<part>.png (rig_vcut's `mask`) and
<pose>.labels.png (a picture) are written. Env XID, XWORK."""
import colorsys
import json
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from scipy import ndimage as ndi
from xl import *

a = sys.argv[1:]
pose, seeds_path, outdir = a[0], a[1], pathlib.Path(a[2])
g = lambda n, d: type(d)(a[a.index(n) + 1]) if n in a else d  # noqa: E731
PAD = g('--pad', 600)
K = g('--k', 16)
SIG = g('--sigma', 6.0)
kpart = {}
if '--kpart' in a:
    for kv in a[a.index('--kpart') + 1].split(','):
        n, _, v = kv.partition('=')
        kpart[n] = int(v)
seeds = json.load(open(seeds_path))
outdir.mkdir(parents=True, exist_ok=True)
W, H = rig_size()
PA = np.asarray(painting_in_master(pose, pad=PAD).split()[3])
F = PA > 8
h, w = F.shape
names = list(seeds)
dist = []
for n in names:
    im = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(im)
    for s in seeds[n]:
        if 'poly' in s:
            d.polygon([(x + PAD, y + PAD) for x, y in s['poly']], fill=255)
        elif 'line' in s:
            d.line([(x + PAD, y + PAD) for x, y in s['line']], fill=255, width=int(s.get('w', 30)), joint='curve')
            for x, y in s['line']:
                r = s.get('w', 30) / 2
                d.ellipse((x + PAD - r, y + PAD - r, x + PAD + r, y + PAD + r), fill=255)
    m = np.asarray(im) > 0
    dist.append(ndi.distance_transform_edt(~m) if m.any() else np.full((h, w), 1e6))
dist = np.stack(dist)
score = dist - 1e-3 * np.arange(len(names))[:, None, None]
L = np.argmin(score, axis=0).astype(np.int16)
L[~F] = -1
sm = np.stack([ndi.gaussian_filter((L == i).astype(np.float32), SIG) for i in range(len(names))])
L2 = np.argmax(sm, axis=0).astype(np.int16)
L2[~F] = -1
cols = [tuple(int(255 * c) for c in colorsys.hsv_to_rgb(i / len(names), 0.85, 1.0)) for i in range(len(names))]
vis = np.zeros(L2.shape + (3,), np.uint8)
for i in range(len(names)):
    vis[L2 == i] = cols[i]
Image.fromarray(vis).save(outdir / f'{pose}.labels.png')
for i, n in enumerate(names):
    m = L2 == i
    k = kpart.get(n, K)
    if k > 0:
        m = ndi.binary_dilation(m, iterations=k)
    m &= F
    Image.fromarray((m * 255).astype(np.uint8)).save(outdir / f'{pose}.{n}.png')
    print(n, 'px', int((L2 == i).sum()), 'with underlap', int(m.sum()))
