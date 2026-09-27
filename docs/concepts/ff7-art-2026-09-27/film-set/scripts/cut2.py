"""Film set: the cut for grey-steel subjects. isnet-anime (the pipeline's model) drops a grey blade painted on the
dark grey studio background, so the matte is the per-pixel MAX of isnet-anime and isnet-general-use, and any
hole enclosed by that matte whose pixels do not match the background (a blade interior the models left
translucent) is filled; holes that DO match the background (a real gap between arm and body) stay clear.
The background model is the render's own known-background pixels (both models transparent), blurred to a
smooth field. Output and the JSON line match tools/gen/rembg.py so final-cut logic and sidecars are unchanged.
Usage: python cut2.py --in <full.png> --out <cut.png> [--margin 16]"""
import argparse, json, os
os.environ.setdefault('U2NET_HOME', r'D:\Tools\ComfyUI\rembg-models')
import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument('--in', dest='src', required=True)
ap.add_argument('--out', dest='dst', required=True)
ap.add_argument('--margin', type=int, default=16)
a = ap.parse_args()
im = Image.open(a.src).convert('RGB')
src = np.asarray(im).astype(float)
alphas = [np.asarray(remove(im, session=new_session(m), only_mask=True)).astype(float) for m in ('isnet-anime', 'isnet-general-use')]
al = np.maximum(*alphas)
bgk = (alphas[0] < 4) & (alphas[1] < 4)
med = np.median(src[bgk], 0)                             # keep blade pixels both models missed out of the bg model
bgk &= np.abs(src - med).max(-1) < 34
w = ndimage.gaussian_filter(bgk.astype(float), 30)
bgm = np.stack([ndimage.gaussian_filter(src[..., c] * bgk, 30) for c in range(3)], -1) / np.maximum(w, 1e-3)[..., None]
# a floor shadow the second model keeps: only isnet-general-use has it, grey (low chroma), a little darker than
# the background around it, never near-black (ink lines stay) and never brighter (steel stays)
v, vb = src.mean(-1), bgm.mean(-1)
shadow = (alphas[0] < 128) & ((src.max(-1) - src.min(-1)) < 20) & (v <= vb + 4) & (v > vb - 45)
al[shadow] = np.minimum(al[shadow], alphas[0][shadow])
# the floor shadow BOTH models keep (the judge's Guard Scorpion fault): scan every column up from the bottom and
# clear shadow-like pixels (grey, from a little lighter to 50 levels darker than the background) until the first
# pixel that is not: an ink line, a coloured part or a lit surface stops the scan, so steel above the floor stays.
# (A region rule, "clear grey regions touching the outside", ate outlined steel whose ink line has gaps: rejected.)
chroma0 = src.max(-1) - src.min(-1)
shade = (chroma0 < 22) & (v < vb + 6) & (v > vb - 50)
floor_px = 0
Hh = al.shape[0]
for x in range(al.shape[1]):
    col = al[:, x]
    y = Hh - 1
    while y > 0 and (col[y] < 8 or shade[y, x]):
        if col[y] >= 8:
            col[y] = 0
            floor_px += 1
        y -= 1
# SHADEBOX="x0,y0,x1,y1;..." (full-frame px, only after LOOKING): shadow or haze the scan cannot reach (under a
# belly, beside a head) is cleared inside these boxes; the boxes go in the sidecar
boxes = [b.split(',') for b in os.environ.get('SHADEBOX', '').split(';') if b]   # a 5th field 'w' = also the wider shadow band
for bx in boxes:
    x0, y0, x1, y1 = (int(t) for t in bx[:4])
    mv = float(med.mean())                               # the studio grey itself: a nearby cast shadow drags the local model down
    vv, cc = v[y0:y1, x0:x1], chroma0[y0:y1, x0:x1]
    sub = (cc < 22) & (np.abs(vv - mv) < 16)            # the studio grey only: darker steel inside the box stays
    if len(bx) > 4 and bx[4] == 'w':
        sub |= shade[y0:y1, x0:x1]
    floor_px += int((sub & (al[y0:y1, x0:x1] >= 8)).sum())
    al[y0:y1, x0:x1][sub] = 0
# FLOORBAND="y0,vlo,vhi" (after LOOKING: the Guard Scorpion render's floor shadow is a flat, hard-edged dark band whose
# top edge is at y0): below y0, pixels that are grey (chroma < 12), in that value range and FLAT (local spread < 4, so
# steel with its gradients and highlights stays) are cleared; the red legs and the ink lines are never in that range
fb = os.environ.get('FLOORBAND')
floorband_px = 0
if fb:
    fy0, vlo, vhi = (float(t) for t in fb.split(','))
    loc = ndimage.uniform_filter(v, 7)
    spread = np.sqrt(np.maximum(ndimage.uniform_filter(v * v, 7) - loc * loc, 0))
    fbm = (np.arange(al.shape[0])[:, None] >= fy0) & (chroma0 < 12) & (v >= vlo) & (v <= vhi) & (spread < 4)
    floorband_px = int((fbm & (al >= 8)).sum())
    al[fbm] = 0
    # the band's anti-aliased top edge survives as a thin grey thread between the feet: below y0 - 12, grey pixels that
    # a 3-step opening removes (threads under ~7 px thick) go too; red feet and their outlines are not grey
    mm = al >= 8
    thin = mm & ~ndimage.binary_opening(mm, iterations=3) & ((chroma0 < 14) | (v < 40)) & (np.arange(al.shape[0])[:, None] >= fy0 - 12)
    floorband_px += int(thin.sum())
    al[thin] = 0
# KEY=1 (after LOOKING: a lit blade both models cut into): add pixels clearly brighter or more coloured than the
# background model, plus near-black ink within 5 px of them, but only where they touch the main matte
keyed_px = 0
if os.environ.get('KEY') == '1':
    chroma = src.max(-1) - src.min(-1)
    key = ((v > vb + 26) | (np.abs(chroma - (bgm.max(-1) - bgm.min(-1))) > 40)) & ~bgk
    ink = (v < 0.5 * vb) & ndimage.binary_dilation(key, iterations=5)
    cand = key | ink | (al >= 128)
    lab0, n0 = ndimage.label(cand, structure=np.ones((3, 3)))
    core = np.unique(lab0[al >= 200])
    add = np.isin(lab0, core[core > 0]) & (al < 128) & (key | ink)
    al[add] = 255
    keyed_px = int(add.sum())
m = al >= 128
holes = ndimage.binary_fill_holes(m) & ~m
lab, n = ndimage.label(holes)
filled = []
for i in range(1, n + 1):
    reg = lab == i
    diff = np.abs(src[reg] - bgm[reg]).max(-1)
    frac = float((diff > 18).mean())
    if frac > 0.35:
        al[reg] = 255
        filled.append({'pixels': int(reg.sum()), 'nonBackground': round(frac, 2)})
# CLEARBOX="x0,y0,x1,y1;..." (full-frame px, only after LOOKING): a stray floor mark the rules above keep (the recoil
# render's shadow edge line beside a foot) is cleared outright inside these boxes, after the hole fill
clearboxes = [b.split(',') for b in os.environ.get('CLEARBOX', '').split(';') if b]
for bx in clearboxes:
    x0, y0, x1, y1 = (int(t) for t in bx)
    al[y0:y1, x0:x1] = 0
lab, n = ndimage.label(al >= 8, structure=np.ones((3, 3)))   # drop stray specks the second model adds (< 600 px)
sizes = ndimage.sum(np.ones_like(al), lab, range(1, n + 1)) if n else []
dropped = []
keep_largest = os.environ.get('KEEP_LARGEST') == '1'   # only after LOOKING: the loose pieces are artifacts (a stray lens)
big = int(np.argmax(sizes)) + 1 if n else 0
for i, sz in enumerate(sizes, 1):
    if sz < 600 or (keep_largest and i != big):
        al[lab == i] = 0
        dropped.append(int(sz))
rgba = np.dstack([src, al]).clip(0, 255).astype(np.uint8)
ys, xs = np.nonzero(al >= 8)
H, W = al.shape
l, t = max(0, xs.min() - a.margin), max(0, ys.min() - a.margin)
r, b = min(W, xs.max() + 1 + a.margin), min(H, ys.max() + 1 + a.margin)
out = Image.fromarray(rgba).crop((l, t, r, b))
out.save(a.dst)
print(json.dumps({'width': out.width, 'height': out.height, 'baselineY': int(ys.max() - t), 'cropBox': [int(l), int(t), int(r), int(b)],
                  'sourceWidth': W, 'sourceHeight': H, 'model': 'max(isnet-anime, isnet-general-use) + non-background hole fill',
                  'holesFilled': filled, 'specksDropped': dropped, 'keepLargest': keep_largest, 'keyedPixels': keyed_px, 'floorShadowCleared': floor_px, 'floorBand': fb, 'floorBandCleared': floorband_px, 'shadeBoxes': boxes, 'clearBoxes': clearboxes, 'shadowPixelsCleared': int(shadow.sum())}))
