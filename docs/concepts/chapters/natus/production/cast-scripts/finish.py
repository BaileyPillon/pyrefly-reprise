"""Natus hero cast, step 3 (FFX only): both seam picks merged inside their masks, the white-ground
fringe peeled on the new edges, painted pixels snapped to the idle's own palette (dE76 > 6), canvas
trimmed sideways to the content + 16 px (height and baseline stay the idle's). Gates printed.
   python finish.py <left pick> <right pick>"""
import sys, os, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nlib import *
here = os.path.dirname(os.path.abspath(__file__)); PY = sys.executable
L, R = sys.argv[1], sys.argv[2]
seam = f'{OUT}/t1.seam.png'
subprocess.run([PY, f'{here}/merge.py', f'{OUT}/t1.png', f'{SCR}/jobs/L', L, seam, f'{OUT}/f1.png', 'paint'], check=True)
subprocess.run([PY, f'{here}/merge.py', f'{OUT}/f1.png', f'{SCR}/jobs/R2', R, seam, f'{OUT}/f2.png', 'paint'], check=True)
t1 = load(f'{OUT}/t1.png'); f = load(f'{OUT}/f2.png'); sm = cv2.imread(seam, 0) > 127
meta = json.load(open(f'{OUT}/t1.json')); PADL = meta['pad'][0]
idle = load(IDLE); H, W = idle.shape[:2]
# peel: near-white pixels on the silhouette border inside the seam mask (the white ground bled in)
for _ in range(2):
    sil = f[:, :, 3] > 0
    bd = sil & ~(cv2.erode(sil.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)
    hsv = cv2.cvtColor(f[:, :, :3], cv2.COLOR_RGB2HSV)
    pale = (hsv[:, :, 2] > 185) & (hsv[:, :, 1] < 60)
    peel = bd & pale & sm
    f[peel] = 0
print('peeled', int(peel.sum()))
# palette snap inside the seam mask
ipal = np.unique(idle[idle[:, :, 3] > 127][:, :3], axis=0); lp = to_lab(ipal)
Rm = sm & (f[:, :, 3] > 0); px = f[Rm][:, :3].copy(); lx = to_lab(px)
best = np.empty(len(px), int); dmin = np.empty(len(px))
for i in range(0, len(px), 1024):
    d = np.sqrt(((lx[i:i + 1024, None] - lp[None]) ** 2).sum(2)); best[i:i + 1024] = d.argmin(1); dmin[i:i + 1024] = d.min(1)
fix = dmin > 6; px[fix] = ipal[best[fix]]; tmp = f[Rm]; tmp[:, :3] = px; f[Rm] = tmp
print('snapped', int(fix.sum()), 'of', len(px))
f[f[:, :, 3] == 0, :3] = 0
# gates against the padded idle
cvI = np.zeros_like(f); cvI[:, PADL:PADL + W] = idle
pieces = np.zeros(f.shape[:2], bool)
for k, p in meta['pieces'].items(): pieces |= poly_mask(f.shape, [(x + PADL, y) for x, y in p['poly']]) > 0
movedA = np.zeros(f.shape[:2], bool)
for k, p in meta['pieces'].items():
    M = cv2.getRotationMatrix2D((p['pivot'][0] + PADL, p['pivot'][1]), -p['deg'], 1.0)
    mk = poly_mask(f.shape, [(x + PADL, y) for x, y in p['poly']])
    movedA |= cv2.warpAffine(mk, M, (f.shape[1], f.shape[0]), flags=cv2.INTER_NEAREST) > 0
allowed = pieces | movedA | sm
d = np.abs(f.astype(int) - cvI.astype(int)).max(2)
op = f[:, :, 3] > 0
g = {'madOutsidePiecesAndSeam': int(d[~allowed].max()),
     'shares': {'idleUnchanged': round(float((op & (d == 0) & ~sm).sum() / op.sum()), 4),
                'idleMoved': round(float((op & (d > 0) & ~sm).sum() / op.sum()), 4),
                'painted': round(float((op & sm).sum() / op.sum()), 4)},
     'inventedColourShareOfPainted': round(invented_share(idle, f, sm.astype(np.uint8))[0], 4),
     'opaqueRatio': round(float(op.sum() / (idle[:, :, 3] > 0).sum()), 4),
     'softAlphaPx': int(((f[:, :, 3] > 0) & (f[:, :, 3] < 255)).sum())}
g['idlePixelShare'] = round(g['shares']['idleUnchanged'] + g['shares']['idleMoved'], 4)
# trim sideways to content + 16 px
cols = np.where(op.any(0))[0]; lp_ = max(0, 16 - cols[0])
f = np.pad(f, ((0, 0), (lp_, 0), (0, 0))); t1 = np.pad(t1, ((0, 0), (lp_, 0), (0, 0))); sm = np.pad(sm, ((0, 0), (lp_, 0))); PADL += lp_
op = f[:, :, 3] > 0; cols = np.where(op.any(0))[0]
x0 = max(0, cols[0] - 16); x1 = min(f.shape[1], cols[-1] + 17)
out = f[:, x0:x1]
rows = np.where(op.any(1))[0]
save(out, f'{OUT}/cast.png'); save(t1[:, x0:x1], f'{OUT}/cast.transplant.png')
cv2.imwrite(f'{OUT}/cast.seam.png', (sm[:, x0:x1] * 255).astype(np.uint8))
json.dump({'gates': g, 'trim': [int(x0), int(x1)], 'idleOffsetX': int(PADL - x0), 'size': [int(out.shape[1]), int(out.shape[0])],
           'contentRows': [int(rows[0]), int(rows[-1])], 'idleContentRows': [int(np.where((idle[:, :, 3] > 0).any(1))[0][0]), int(np.where((idle[:, :, 3] > 0).any(1))[0][-1])]},
          open(f'{OUT}/cast.gates.json', 'w'), indent=1)
print(json.dumps(g), 'size', out.shape[1], 'x', out.shape[0], 'idle offset x', PADL - x0)
