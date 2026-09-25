"""Judge-pass measurements (JUDGE.md method): opaque px, alpha islands (8-conn), soft alpha, near-white opaque pockets
(min channel > 235, alpha > 200), edge halo (share of 1 px edge pixels > 50 brighter than the 9 px interior mean)."""
import sys, json, hashlib, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
A = 'D:/Final Fantasy/public/art/portraits/'
files = {'current seymour-omnis': A + 'seymour-omnis.png', 'approved seymour-macalania': A + 'seymour-macalania.png',
         'approved seymour-natus': A + 'seymour-natus.png', 'A': 'work/opt-a.png', 'B': 'work/opt-b.png', 'C': 'work/opt-c.png'}
for k, f in files.items():
    p = np.array(Image.open(f).convert('RGBA')); al = p[..., 3]; rgb = p[..., :3].astype(float); o = al > 127
    isl = ndi.label(o, structure=np.ones((3, 3)))[1]; soft = int(((al > 0) & (al < 255)).sum())
    wt = (p[..., :3].min(2) > 235) & (al > 200); wl, wn = ndi.label(wt); ws = sorted([int(x) for x in ndi.sum(wt, wl, range(1, wn + 1))], reverse=True)[:3]
    er = lambda s: np.array(Image.fromarray((o * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(s))) > 127
    edge = o & ~er(3); inner = er(9); lum = rgb @ [0.299, 0.587, 0.114]
    ls = ndi.uniform_filter(lum * inner, 9); ms = ndi.uniform_filter(inner.astype(float), 9); ok = ms > 1e-6
    inter = np.where(ok, ls / np.maximum(ms, 1e-9), 0); fr = np.zeros_like(o); fr[0, :] = fr[-1, :] = fr[:, 0] = fr[:, -1] = True
    e = edge & ok & ~fr; h = e & (lum > inter + 50)
    print(json.dumps({'file': k, 'size': list(al.shape[::-1]), 'opaque': int(o.sum()), 'islands': isl, 'softAlpha': soft, 'nearWhite': ws,
                      'edgeHalo%': round(100 * h.sum() / max(e.sum(), 1), 1), 'sha12': hashlib.sha256(open(f, 'rb').read()).hexdigest()[:12]}))
