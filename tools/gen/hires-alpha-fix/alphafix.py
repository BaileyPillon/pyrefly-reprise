"""Alpha and rim repair of the hi-res masters (release 39 repair, 2026-10-04).

Rebuilds each master's alpha from the APPROVED 1x alpha (bicubic upscale, a smooth contour, a one-pixel feather) and puts the approved
rim back (the outer band takes the approved colours, bled and upscaled; the interior keeps the master's own detail), with colour bled
under the transparent pixels beside the silhouette so a bilinear or mip sample never blends in black or white.

Pure numpy + Pillow (no scipy). Game case: both games (shared pipeline over every figure and boss master).
"""
import os
import math
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None


# ----------------------------------------------------------------------------------------------------------------- io
def load_rgba(path):
    return np.asarray(Image.open(path).convert('RGBA'))


def save_png(arr, path, level=6):
    Image.fromarray(arr, 'RGBA').save(path, format='PNG', compress_level=level)


# ------------------------------------------------------------------------------------------------------------ filters
def resize_f(a, size_wh, resample=Image.BICUBIC):
    """float32 2-D -> float32 2-D resize."""
    return np.asarray(Image.fromarray(np.ascontiguousarray(a, np.float32), mode='F').resize(size_wh, resample), np.float32)


def _box_axis(a, r, axis):
    if r <= 0:
        return a
    n = a.shape[axis]
    pad = [(0, 0), (0, 0)]
    pad[axis] = (r + 1, r)
    ap = np.pad(a, pad, mode='edge')
    c = np.cumsum(ap, axis=axis, dtype=np.float64)
    hi = [slice(None), slice(None)]
    lo = [slice(None), slice(None)]
    hi[axis] = slice(2 * r + 1, 2 * r + 1 + n)
    lo[axis] = slice(0, n)
    return ((c[tuple(hi)] - c[tuple(lo)]) / (2 * r + 1)).astype(np.float32)


def box_sizes(sigma, n=3):
    w_ideal = math.sqrt(12.0 * sigma * sigma / n + 1.0)
    wl = int(math.floor(w_ideal))
    if wl % 2 == 0:
        wl -= 1
    wl = max(wl, 1)
    wu = wl + 2
    m = round((12.0 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4.0 * wl - 4.0))
    m = max(0, min(n, m))
    return [wl if i < m else wu for i in range(n)]


def gauss(a, sigma):
    """Gaussian blur by three box passes per axis (float32, edge-replicated)."""
    a = np.asarray(a, np.float32)
    if sigma < 0.3:
        return a
    for w in box_sizes(sigma):
        r = w // 2
        a = _box_axis(_box_axis(a, r, 0), r, 1)
    return a


def box_mean(a, w):
    """Mean over a w x w window (w odd), edge-replicated."""
    r = w // 2
    return _box_axis(_box_axis(np.asarray(a, np.float32), r, 0), r, 1)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def phi(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def dilate_max(a, r):
    """Max filter, square (2r+1)^2, via Pillow (8-bit domain on a 0..1 float)."""
    if r <= 0:
        return a
    im = Image.fromarray(np.clip(a * 255.0 + 0.5, 0, 255).astype(np.uint8), 'L').filter(__import__('PIL.ImageFilter', fromlist=['MaxFilter']).MaxFilter(2 * r + 1))
    return np.asarray(im, np.float32) / 255.0


# ------------------------------------------------------------------------------------------------------- colour bleed
def bleed_colour(rgb, valid, iters):
    """Extend `rgb` (h,w,3 float32) outward from `valid` (h,w float32 0/1) by `iters` pixels: each pass fills the invalid pixels beside a
    valid one with the mean of their valid 3x3 neighbours. Returns (rgb, reach) where reach is 1 where a colour now exists."""
    rgb = rgb.copy()
    v = (valid > 0.5).astype(np.float32)
    for _ in range(iters):
        wsum = box_mean(v, 3) * 9.0
        need = (v < 0.5) & (wsum > 0.5)
        if not need.any():
            break
        for c in range(3):
            num = box_mean(rgb[..., c] * v, 3) * 9.0
            rgb[..., c] = np.where(need, num / np.maximum(wsum, 1e-6), rgb[..., c])
        v = np.where(need, 1.0, v).astype(np.float32)
    return rgb, v


# --------------------------------------------------------------------------------------------------------- the repair
DEFAULTS = dict(
    ka=0.6,          # alpha smoothing sigma, in 1x pixels
    feather=1.0,     # alpha edge ramp, in master pixels
    d0=1.5,          # rim band: fully the approved colours inside this distance (1x px)
    d1=3.0,          # ... fading to the master's own colours by this distance (1x px)
    ring=6,          # colour kept under alpha 0, in 1x px (24 px at 4x, 12 at 2x)
    soft_dilate=2,   # 1x px around partial-alpha pixels where the alpha stays the plain bicubic upscale
    u_blur=0.0,      # Gaussian blur (1x px) of the approved colour field before use: joins the beads a 1-px stair-stepped outline upscales into
)


def repair(P, M, s, **kw):
    """P: approved 1x RGBA uint8 (h,w,4). M: the master RGBA uint8 (h*s, w*s, 4). Returns the fixed master RGBA uint8 and a dict of facts."""
    p = {**DEFAULTS, **kw}
    h, w = P.shape[:2]
    H, W = h * s, w * s
    assert M.shape[0] == H and M.shape[1] == W, (M.shape, P.shape, s)
    A1 = P[..., 3].astype(np.float32) / 255.0

    # ---- alpha: bicubic upscale, smooth contour, one-pixel feather; plateaus of partial alpha stay the plain upscale
    Aup = resize_f(A1, (W, H), Image.BICUBIC)
    sig = max(0.5, p['ka'] * s)
    G = gauss(Aup, sig)
    A_hard = np.clip(0.5 + (G - 0.5) * sig * math.sqrt(2.0 * math.pi) / p['feather'], 0.0, 1.0)
    # a partial-alpha pixel (15..240 of 255; the matte noise of 1..14 and 241..254 counts as transparent and opaque) is an EDGE ramp (an
    # antialiased cut: a transparent and an opaque pixel both within 2 px) or part of a PLATEAU (a glow, a ghost: not); only plateaus keep
    # the plain upscale, the ramps are rebuilt like any other silhouette
    semi_all = (A1 >= 15.0 / 255.0) & (A1 <= 240.0 / 255.0)
    near_z = dilate_max((A1 < 15.0 / 255.0).astype(np.float32), 2) > 0.5
    near_o = dilate_max((A1 > 240.0 / 255.0).astype(np.float32), 2) > 0.5
    semi1 = (semi_all & ~(near_z & near_o)).astype(np.float32)
    n_semi = float(semi1.sum())
    if n_semi > 0:
        S1 = dilate_max(semi1, p['soft_dilate'])
        S = np.clip(gauss(resize_f(S1, (W, H), Image.BILINEAR), 0.5 * s), 0.0, 1.0)
        A_soft = np.clip(Aup, 0.0, 1.0)
        A = A_hard * (1.0 - S) + A_soft * S
        del S1, A_soft
    else:
        S = None
        A = A_hard
    del Aup, G, A_hard
    A = A.astype(np.float32)

    # ---- the approved colours, bled outward at 1x, then upscaled: the rim and the ring under alpha 0
    Pf = P[..., :3].astype(np.float32)
    Pb, _ = bleed_colour(Pf, (A1 > 0.02).astype(np.float32), p['ring'])
    U = np.empty((H, W, 3), np.float32)
    for c in range(3):
        U[..., c] = resize_f(Pb[..., c], (W, H), Image.BICUBIC)
    np.clip(U, 0, 255, out=U)
    if p['u_blur'] > 0:
        for c in range(3):
            U[..., c] = gauss(U[..., c], p['u_blur'] * s)
    del Pb, Pf

    # ---- the band weight from the blurred new alpha (a Gaussian-blurred step reads Phi(d / sigma) at distance d inside)
    sig2 = max(1.5, p['d1'] * s / 1.6)
    G2 = gauss(A, sig2)
    g0, g1 = phi(p['d0'] * s / sig2), phi(p['d1'] * s / sig2)
    wband = 1.0 - smoothstep(g0, g1, G2)
    del G2
    if S is not None:
        wband = wband * (1.0 - S)

    # ---- master colour, valid where its own alpha is solid enough
    Mrgb = M[..., :3].astype(np.float32)
    Ma = M[..., 3].astype(np.float32) / 255.0
    valid = smoothstep(0.05, 0.4, Ma)
    wmix = np.maximum(wband, 1.0 - valid)      # where the master has no reliable colour, use the approved one
    out = np.empty((H, W, 4), np.uint8)
    for c in range(3):
        col = wmix * U[..., c] + (1.0 - wmix) * Mrgb[..., c]
        out[..., c] = np.clip(col + 0.5, 0, 255).astype(np.uint8)
    out[..., 3] = np.clip(A * 255.0 + 0.5, 0, 255).astype(np.uint8)

    # ---- under alpha 0: the approved colour within the ring, nothing beyond (keeps the PNG small)
    ring_px = p['ring'] * s
    near = gauss((A > 0.0).astype(np.float32), max(1.0, ring_px / 2.05)) > 0.02   # reaches about `ring_px` beyond the silhouette (Phi(-2.05) = 0.02)
    trans = out[..., 3] == 0
    keep = trans & near
    for c in range(3):
        ch = out[..., c]
        ch[keep] = np.clip(U[..., c][keep] + 0.5, 0, 255).astype(np.uint8)
        ch[trans & ~near] = 0
    return out, dict(semi_px=int(n_semi))


# -------------------------------------------------------------------------------------------------------- 4x -> 2x
def reduce_half(M):
    """Colour and alpha resized apart (straight, Lanczos), the way the 3x is derived: the colour ring under alpha 0 survives."""
    h, w = M.shape[:2]
    out = np.empty((h // 2, w // 2, 4), np.uint8)
    for c in range(4):
        out[..., c] = np.clip(np.asarray(Image.fromarray(M[..., c]).resize((w // 2, h // 2), Image.LANCZOS), np.float32) + 0.0, 0, 255).astype(np.uint8)
    return out


# ------------------------------------------------------------------------------------------------------------ metrics
def lum(rgb):
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]


def comp(rgba_f, bg):
    a = rgba_f[..., 3:4] / 255.0
    return rgba_f[..., :3] * a + bg * (1 - a)


def down_premult(M, size_wh):
    """The check's reduction: premultiplied colour and alpha Lanczos-reduced to the approved size (float32 h,w,4: straight RGB + alpha 0..255 as a premult composite helper)."""
    a16 = M[..., 3].astype(np.uint16)
    pre = np.empty(M.shape[:2] + (3,), np.uint8)
    for c in range(3):
        pre[..., c] = ((M[..., c].astype(np.uint16) * a16 + 127) // 255).astype(np.uint8)
    pm = Image.fromarray(pre, 'RGB').resize(size_wh, Image.LANCZOS)
    ad = Image.fromarray(np.ascontiguousarray(M[..., 3]), 'L').resize(size_wh, Image.LANCZOS)
    return np.asarray(pm, np.float32), np.asarray(ad, np.float32)


def run_labels(mask):
    """8-connected components of a bool mask via run-length union-find. Returns (sizes array).  Pure numpy."""
    H, W = mask.shape
    m = np.zeros((H, W + 2), np.int8)
    m[:, 1:-1] = mask
    d = np.diff(m, axis=1)
    st = np.argwhere(d == 1)
    en = np.argwhere(d == -1)
    n = len(st)
    if n == 0:
        return np.zeros(0, np.int64)
    rows = st[:, 0]
    s_ = st[:, 1].astype(np.int64)
    e_ = en[:, 1].astype(np.int64)         # exclusive end
    K = W + 3
    skey = rows.astype(np.int64) * K + s_
    ekey = rows.astype(np.int64) * K + e_
    # for run i (row r) find runs j of row r+1 with e_j >= s_i and s_j <= e_i
    lo = np.searchsorted(ekey, (rows + 1).astype(np.int64) * K + s_, side='left')
    hi = np.searchsorted(skey, (rows + 1).astype(np.int64) * K + e_, side='right')
    # keep only j in row r+1 (searchsorted may spill to row r+2 / before)
    cnt = np.maximum(hi - lo, 0)
    ei = np.repeat(np.arange(n), cnt)
    off = np.arange(cnt.sum()) - np.repeat(np.cumsum(cnt) - cnt, cnt)
    ej = lo[ei] + off
    ok = (rows[ej] == rows[ei] + 1)
    ei, ej = ei[ok], ej[ok]
    lab = np.arange(n)
    for _ in range(64):
        a, b = lab[ei], lab[ej]
        mn = np.minimum(a, b)
        new = lab.copy()
        np.minimum.at(new, ei, mn)
        np.minimum.at(new, ej, mn)
        new = new[new]
        if np.array_equal(new, lab):
            break
        lab = new
    length = (e_ - s_)
    return np.bincount(lab, weights=length, minlength=n)[np.unique(lab)]


def metrics(P, M, s, edge_t=48.0):
    """Before/after numbers for one master against the approved 1x P. All at 1x unless named."""
    h, w = P.shape[:2]
    af = P.astype(np.float32)
    pm, ad = down_premult(M, (w, h))
    ca = comp(af, 128.0)
    cm = pm + 128.0 * (1 - ad[..., None] / 255.0)
    la, lm = lum(ca), lum(cm)
    # edge band of the check: within ~2 px of the 1x silhouette
    bm = box_mean((af[..., 3] > 127).astype(np.float32), 5)
    band = np.zeros((h, w), bool)
    band[2:-2, 2:-2] = ((bm > 0.04) & (bm < 0.96))[2:-2, 2:-2]
    out = {}
    if band.sum() >= 200:
        dl = lm - la
        out['band_px'] = int(band.sum())
        out['rim_bias'] = float(dl[band].mean())
        out['rim_mad'] = float(np.abs(dl[band]).mean())
        bad = band & (np.abs(dl) > edge_t)
        out['rim_bad_frac'] = float(bad.sum() / band.sum())
        sizes = run_labels(bad)
        out['rim_specks'] = int((sizes <= 6).sum())       # blobs of 6 px or less at 1x in the rim band
        out['rim_blobs'] = int(len(sizes))
    # alpha against the approved alpha, upscaled (bicubic, threshold 0.5), at the master's scale
    H, W = M.shape[:2]
    Aup = resize_f(af[..., 3] / 255.0, (W, H), Image.BICUBIC)
    ref = Aup >= 0.5
    mine = M[..., 3] >= 128
    un = (ref | mine).sum()
    out['alpha_iou'] = float((ref & mine).sum() / un) if un else 1.0
    out['alpha_mad'] = float(np.abs(np.clip(Aup, 0, 1) * 255.0 - M[..., 3].astype(np.float32)).mean())
    # tiny alpha islands and holes (area <= 64 px at 4x, scaled by (s/4)^2), master against the reference
    lim = max(4, int(64 * (s / 4.0) ** 2))
    isl = run_labels(mine)
    hol = run_labels(~mine)
    isl_ref = run_labels(ref)
    hol_ref = run_labels(~ref)
    out['alpha_islands'] = int((isl <= lim).sum() + (hol <= lim).sum())
    out['alpha_islands_ref'] = int((isl_ref <= lim).sum() + (hol_ref <= lim).sum())
    # SSIM of the reduced master against the approved painting, luminance over grey (the check's ssim_gray) and over the visible region
    sm = ssim(la, lm)
    out['ssim_gray'] = float(sm.mean())
    vis = ((af[..., 3] > 8) | (ad > 8))[3:-3, 3:-3]
    out['ssim_vis'] = float(sm[vis].mean()) if vis.any() else None
    return out


def box_valid(a, w):
    """Mean over valid w x w windows (the independent check's `box`)."""
    c = np.cumsum(np.cumsum(a, 0, dtype=np.float64), 1, dtype=np.float64)
    c = np.pad(c, ((1, 0), (1, 0)))
    t = c[w:, w:] - c[:-w, w:] - c[w:, :-w] + c[:-w, :-w]
    return t / (w * w)


def ssim(a, b, win=7):
    """The check's SSIM map (valid windows, luminance 0..255)."""
    a = a.astype(np.float64)
    b = b.astype(np.float64)
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    ma, mb = box_valid(a, win), box_valid(b, win)
    saa = box_valid(a * a, win) - ma * ma
    sbb = box_valid(b * b, win) - mb * mb
    sab = box_valid(a * b, win) - ma * mb
    return ((2 * ma * mb + c1) * (2 * sab + c2)) / ((ma * ma + mb * mb + c1) * (saa + sbb + c2))
