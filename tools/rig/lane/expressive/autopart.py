"""autopart.py <rigdir> <pose> <outdir> [--pad 600] [--k 16] [--sigma 6] [--kpart head=4,hair=10] : partition the pose's PAINTING among the rig's parts by where the baseline rig's key puts them
(inside a part's posed silhouette -> that part, the front-most wins; outside every part -> the nearest), smooth the labels, dilate each label by k px into its neighbours (the underlap) and write
<outdir>/<pose>.<part>.png (8-bit masks in master px of the idle frame with `pad` px of margin: rig_vcut's `mask`). Also <outdir>/<pose>.labels.png (a colour picture of the partition). Env XID, XWORK."""
import colorsys
import json
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from scipy import ndimage as ndi
from xl import *

a = sys.argv[1:]
rigdir, pose, outdir = a[0], a[1], pathlib.Path(a[2])
g = lambda n, d: type(d)(a[a.index(n) + 1]) if n in a else d  # noqa: E731
PAD = g('--pad', 600)
K = g('--k', 16)
SIG = g('--sigma', 6.0)
SEEDS = json.load(open(a[a.index('--seeds') + 1])) if '--seeds' in a else {}  # parts named here are placed by hand-drawn seed shapes (as autoseed.py reads them) instead of by the baseline key's silhouette
kpart = {}
if '--kpart' in a:
    for kv in a[a.index('--kpart') + 1].split(','):
        n, _, v = kv.partition('=')
        kpart[n] = int(v)
outdir.mkdir(parents=True, exist_ok=True)
W, H = rig_size()
rig, T, model = load_model(rigdir)
key = rig['keys'][pose]
base = state_of(rig['parts'], key.get('parts'))
names = [p['name'] for p in rig['parts']]  # back to front
PA = np.asarray(painting_in_master(pose, pad=PAD).split()[3])
F = PA > 8
dist = []
for n in names:
    if n in SEEDS:
        h_, w_ = F.shape
        im_ = Image.new('L', (w_, h_), 0)
        d_ = ImageDraw.Draw(im_)
        for sd_ in SEEDS[n]:
            if 'poly' in sd_:
                d_.polygon([(x + PAD, y + PAD) for x, y in sd_['poly']], fill=255)
            elif 'line' in sd_:
                d_.line([(x + PAD, y + PAD) for x, y in sd_['line']], fill=255, width=int(sd_.get('w', 30)), joint='curve')
                for x, y in sd_['line']:
                    r_ = sd_.get('w', 30) / 2
                    d_.ellipse((x + PAD - r_, y + PAD - r_, x + PAD + r_, y + PAD + r_), fill=255)
        m_ = np.asarray(im_) > 0
        dist.append(ndi.distance_transform_edt(~m_) if m_.any() else np.full(F.shape, 1e6))
        continue
    st = {m: {'shown': m == n, 'image': None} for m in base}
    pose_key(model, rig, key)
    model.set_state(st)
    al = np.asarray(render_pose(model, W, H, pad=PAD).split()[3]) > 60
    d = ndi.distance_transform_edt(~al) if al.any() else np.full(al.shape, 1e6)
    dist.append(d)
dist = np.stack(dist)  # parts x h x w
order = np.arange(len(names))[:, None, None]
score = dist - 1e-3 * order  # the front-most wins a tie
L = np.argmin(score, axis=0).astype(np.int16)
L[~F] = -1
# smooth: each label's blurred indicator, argmax (keeps the partition connected-ish, removes specks)
sm = np.stack([ndi.gaussian_filter((L == i).astype(np.float32), SIG) for i in range(len(names))])
L2 = np.argmax(sm, axis=0).astype(np.int16)
L2[~F] = -1
cols = [tuple(int(255 * c) for c in colorsys.hsv_to_rgb(i / len(names), 0.85, 1.0)) for i in range(len(names))]
vis = np.zeros(L2.shape + (3,), np.uint8)
for i in range(len(names)):
    vis[L2 == i] = cols[i]
Image.fromarray(vis).save(outdir / f'{pose}.labels.png')
for i, n in enumerate(names):
    k = kpart.get(n, K)
    m = L2 == i
    if k > 0:
        m = ndi.binary_dilation(m, iterations=k)
    m &= F
    Image.fromarray((m * 255).astype(np.uint8)).save(outdir / f'{pose}.{n}.png')
    print(n, 'px', int((L2 == i).sum()), 'with underlap', int(m.sum()))
print('pad', PAD, 'frame', W, H)
