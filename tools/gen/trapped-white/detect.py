"""Trapped-backdrop detector (fast: every per-component step runs in its padded bbox window).

A pure-white component is a trapped backdrop wedge when it is
  - opaque, min channel >= CUT, channel spread <= SPREAD, area >= MINA (scaled)
  - not touching the outside transparency (flood from the canvas border), 8-neighbour
  - thick (max inscribed radius*1 >= MINTHICK px at 1x), so thin highlight lines are skipped
  - ringed (2px band around it) by dark ink / transparent pixels >= MINDARK: a backdrop wedge is bounded
    by the limbs' black outline, a highlight or white cloth is bounded by colour.
"""
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi

P = dict(CUT=228, SPREAD=22, MINA=40, MINTHICK=2.5, MINDARK=0.85, DARKLUM=80)
S8 = np.ones((3, 3), bool)


def load(p):
    return np.array(Image.open(p).convert('RGBA'))


def detect(a, scale=1, params=None):
    q = dict(P)
    if params:
        q.update(params)
    a16 = a.astype(np.int16)
    rgb = a16[..., :3]
    al = a16[..., 3]
    op = al > 8
    mn = rgb.min(2)
    sp = rgb.max(2) - mn
    nw = op & (mn >= q['CUT']) & (sp <= q['SPREAD'])
    tr = ~op
    tl, _ = ndi.label(tr, structure=S8)
    border = set(np.unique(np.concatenate([tl[0], tl[-1], tl[:, 0], tl[:, -1]]))) - {0}
    outside = np.isin(tl, list(border)) if border else np.zeros_like(tr)
    out_d = ndi.binary_dilation(outside, structure=S8, iterations=1)
    lab, n = ndi.label(nw, structure=S8)
    touch = set(np.unique(lab[nw & out_d])) - {0}
    lum = rgb[..., 0] * 0.3 + rgb[..., 1] * 0.59 + rgb[..., 2] * 0.11
    H, W = al.shape
    comps = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        if sl is None:
            continue
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        m = lab[sl] == i
        area = int(m.sum())
        if area < q['MINA'] * scale * scale:
            continue
        pad = 3
        wy0, wy1, wx0, wx1 = max(0, y0 - pad), min(H, y1 + pad), max(0, x0 - pad), min(W, x1 + pad)
        full = np.zeros((wy1 - wy0, wx1 - wx0), bool)
        full[y0 - wy0:y1 - wy0, x0 - wx0:x1 - wx0] = m
        thick = float(ndi.distance_transform_edt(np.pad(full, 1)).max()) / scale
        ring = ndi.binary_dilation(full, structure=S8, iterations=2) & ~ndi.binary_dilation(full, structure=S8, iterations=1)
        w_op = op[wy0:wy1, wx0:wx1]
        w_lum = lum[wy0:wy1, wx0:wx1]
        rn = int(ring.sum())
        dark = float(((w_lum < q['DARKLUM']) & w_op & ring).sum() + (ring & ~w_op).sum()) / max(1, rn)
        sub = rgb[sl][m]
        comps.append(dict(id=i, area=area, box=[x0, y0, x1, y1], mean=[int(v) for v in sub.mean(0)],
                          thick=round(thick, 1), ringDark=round(dark, 2),
                          touchesOutside=(i in touch)))
    return lab, comps


def select(comps, scale=1, params=None):
    q = dict(P)
    if params:
        q.update(params)
    return [c for c in comps if (not c['touchesOutside']) and c['thick'] >= q['MINTHICK']
            and c['ringDark'] >= q['MINDARK'] and c['area'] >= q['MINA'] * scale * scale]


def hair_mask(a):
    """Blonde hair pixels: hue 28-62 deg, saturation >= 0.28, value >= 0.55 (opaque only)."""
    hsv = np.array(Image.fromarray(a[..., :3]).convert('HSV')).astype(np.float32)
    h = hsv[..., 0] * 360.0 / 255.0
    s = hsv[..., 1] / 255.0
    v = hsv[..., 2] / 255.0
    return (a[..., 3] > 8) & (((h >= 0) & (h <= 62)) | (h >= 345)) & (s >= 0.30) & (v >= 0.45)


def detect_open(a, scale=1, params=None):
    """Open (outside-touching) white wedges whose neighbourhood is blonde hair: hair-tip backdrop leftovers."""
    q = dict(CUT=222, SPREAD=28, MINA=8, MINHAIR=0.5, MINTHICK=1.2)
    if params:
        q.update(params)
    a16 = a.astype(np.int16)
    rgb = a16[..., :3]
    al = a16[..., 3]
    op = al > 8
    mn = rgb.min(2)
    sp = rgb.max(2) - mn
    nw = op & (mn >= q['CUT']) & (sp <= q['SPREAD'])
    hm = hair_mask(a)
    lab, n = ndi.label(nw, structure=S8)
    H, W = al.shape
    comps = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        if sl is None:
            continue
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        m = lab[sl] == i
        area = int(m.sum())
        if area < q['MINA'] * scale * scale:
            continue
        pad = 4
        wy0, wy1, wx0, wx1 = max(0, y0 - pad), min(H, y1 + pad), max(0, x0 - pad), min(W, x1 + pad)
        full = np.zeros((wy1 - wy0, wx1 - wx0), bool)
        full[y0 - wy0:y1 - wy0, x0 - wx0:x1 - wx0] = m
        thick = float(ndi.distance_transform_edt(np.pad(full, 1)).max()) / scale
        ring = ndi.binary_dilation(full, structure=S8, iterations=2 * scale) & ~full
        w_op = op[wy0:wy1, wx0:wx1]
        rr = ring & w_op
        hf = float((hm[wy0:wy1, wx0:wx1] & rr).sum()) / max(1, int(rr.sum()))
        # share of the component's own boundary that touches transparency (open wedge)
        edge = full & ndi.binary_dilation(~w_op, structure=S8, iterations=1)
        comps.append(dict(id=i, area=area, box=[x0, y0, x1, y1], thick=round(thick, 1), hairFrac=round(hf, 2),
                          openEdge=int(edge.sum()), touchesOutside=bool(edge.any())))
    return lab, comps


def select_open(comps, scale=1, params=None):
    q = dict(MINHAIR=0.5, MINTHICK=1.2, MINA=8)
    if params:
        q.update(params)
    return [c for c in comps if c['touchesOutside'] and c['hairFrac'] >= q['MINHAIR'] and c['thick'] >= q['MINTHICK'] and c['area'] >= q['MINA'] * scale * scale]
