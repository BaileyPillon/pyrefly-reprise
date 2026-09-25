"""White-ground matte + fringe peel for an Omnis portrait option (FFX only). Same method as the production
portrait_matte.py / o5_b_matte.py / o5_b_fringe.py: near-white connected to the border (plus enclosed white pockets
of 60 px or more outside the face box) is ground; the pale edge fringe is peeled; RGB = the raw render inside the alpha,
except edge pixels brighter than the 9 px interior mean by 50+, which are recoloured to it.
usage: matte.py raw.png out.png fx0 fy0 fx1 fy1"""
import sys, json, hashlib, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
src, dst = sys.argv[1], sys.argv[2]; fb = [int(v) for v in sys.argv[3:7]]
raw = np.array(Image.open(src).convert('RGB')).astype(np.int32); H, W = raw.shape[:2]
mn, mx = raw.min(2), raw.max(2)
white = (mn >= 236) & ((mx - mn) <= 16)
lab, n = ndi.label(white, structure=np.ones((3, 3)))
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
sizes = ndi.sum(white, lab, range(1, n + 1))
face = np.zeros((H, W), bool); face[fb[1]:fb[3], fb[0]:fb[2]] = True
enc = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 60 and (i + 1) not in border]) & ~face
bg = np.isin(lab, list(border)) | enc
bg = bg | (ndi.binary_dilation(bg, iterations=1) & (mn >= 205) & ((mx - mn) <= 36))
a = ~bg
for it in range(3):
    edge = a & ~ndi.binary_erosion(a, structure=np.ones((3, 3)), border_value=0)
    edge[0, :] = edge[-1, :] = False; edge[:, 0] = edge[:, -1] = False
    kill = edge & (mn >= 212) & ((mx - mn) <= 30)
    if not kill.any(): break
    a &= ~kill
rgb = raw.astype(float)
def halo(rgb, al):
    er = lambda s: np.array(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(s))) > 127
    edge = al & ~er(3); inner = er(7); lum = rgb @ [0.299, 0.587, 0.114]
    ls = ndi.uniform_filter(lum * inner, 9); ms = ndi.uniform_filter(inner.astype(float), 9); ok = ms * 81 > 0.5
    inter = np.where(ok, ls / np.maximum(ms, 1e-9), 0)
    fr = np.zeros_like(al); fr[0, :] = fr[-1, :] = fr[:, 0] = fr[:, -1] = True
    return edge & ok & (lum > inter + 50) & ~fr, edge & ok
h, e = halo(rgb, a); before = h.sum() / max(e.sum(), 1); a &= ~h
h2, _ = halo(rgb, a)
inner = np.array(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(7))) > 127
cs = np.stack([ndi.uniform_filter(rgb[..., c] * inner, 9) for c in range(3)], -1); cm = ndi.uniform_filter(inner.astype(float), 9)
rgb[h2] = (cs / np.maximum(cm, 1e-9)[..., None])[h2]
l4, n4 = ndi.label(~a); b4 = set(np.unique(np.concatenate([l4[0], l4[-1], l4[:, 0], l4[:, -1]]))) - {0}; s4 = ndi.sum(~a, l4, range(1, n4 + 1))
a |= np.isin(l4, [i + 1 for i, s in enumerate(s4) if s < 10 and (i + 1) not in b4])
l3, n3 = ndi.label(a, structure=np.ones((3, 3))); s3 = ndi.sum(a, l3, range(1, n3 + 1)); a &= ~np.isin(l3, [i + 1 for i, s in enumerate(s3) if s < 40])
out = np.zeros((H, W, 4), np.uint8); out[..., :3] = np.where(a[..., None], np.clip(np.rint(rgb), 0, 255), 0); out[..., 3] = np.where(a, 255, 0)
Image.fromarray(out).save(dst)
h3, e3 = halo(out[..., :3].astype(float), a)
wt = (out[..., :3].min(2) > 235) & (out[..., 3] > 0); wl, wn = ndi.label(wt)
print(json.dumps({'haloBefore': round(float(before), 4), 'haloAfter': round(float(h3.sum() / max(e3.sum(), 1)), 4), 'islands': int(ndi.label(a, structure=np.ones((3, 3)))[1]),
  'opaque': round(float(a.mean()), 4), 'nearWhiteComps': sorted([int(x) for x in ndi.sum(wt, wl, range(1, wn + 1))], reverse=True)[:4],
  'sha256': hashlib.sha256(open(dst, 'rb').read()).hexdigest()}))
