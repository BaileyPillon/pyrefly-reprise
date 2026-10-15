# Rikku dressphere colour correction: the library (colour maths, the driver's two measures, the correction).
# Read-only on the art; every output goes under D:/Tools/pyrefly-scratch/2026-10-14/rikku-colour/.
# Run other scripts with `python -I`; they add this folder to sys.path themselves.
#
# The correction works in OKLab / OKLCH (Bjorn Ottosson's matrices):
#   1. gamut-relative chroma  rho = C / Cmax(L, h)   (1.0 = on the sRGB surface = "full saturation")
#      is squeezed by a soft knee: untouched up to the knee k (0.30), then eased so that rho = 1 lands on `top`;
#      a gentle extra chroma gain s on top. Hue h is never changed.
#   2. the squeeze is weighted by lightness: w(L) = smoothstep((L - d0) / (d1 - d0)). Below d0 nothing changes
#      (outlines, deep shadows, dark fabric: the original bytes are copied back); above d1 it acts in full.
#   3. a token highlight shoulder: L above Lk (0.80) is pulled down by up to sh0 at L = 1 (quadratic ease-in, monotone).
#      A visible shoulder (white 255 -> 245) dulled pale highlights and emptied the clipped share, so it was cut back.
#      sh1 (chroma-aware shoulder) and con (mid-tone S-curve) exist but are 0 in every strength: tried, not used.
#   4. the result is gamut-mapped by chroma at constant L and hue (never by per-channel clipping alone).
# One dial: params_for(t) turns every parameter into a straight line in t; STRENGTHS = light 0.30, medium 0.50, strong 0.85.
# Alpha is never touched; RGB under alpha 0 is never touched; nothing is resampled.
import os, sys, io, math
import numpy as np
from PIL import Image

ROOT = r'D:\pyrefly-art-r44\characters'

# ---------------------------------------------------------------- colour maths
M1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929],
               [0.2119034982, 0.6806995451, 0.1073969566],
               [0.0883024619, 0.2817188376, 0.6299787005]])
M2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468],
               [1.9779984951, -2.4285922050, 0.4505937099],
               [0.0259040371, 0.7827717662, -0.8086757660]])
M1I = np.linalg.inv(M1)
M2I = np.linalg.inv(M2)

_c = np.arange(256, dtype=np.float64) / 255.0
LIN8 = np.where(_c <= 0.04045, _c / 12.92, ((_c + 0.055) / 1.055) ** 2.4)   # sRGB byte -> linear


def lin_to_oklab(lin):
    lms = np.cbrt(lin @ M1.T)
    lab = lms @ M2.T
    return lab[..., 0], lab[..., 1], lab[..., 2]


def oklab_to_lin(L, a, b):
    lab = np.stack([L, a, b], axis=-1)
    lms = (lab @ M2I.T) ** 3
    return lms @ M1I.T


def encode_srgb(lin):
    lin = np.clip(lin, 0.0, 1.0)
    return np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(lin, 1 / 2.4) - 0.055) * 255.0


def rgb8_to_oklch(rgb8):
    L, a, b = lin_to_oklab(LIN8[rgb8])
    return L, np.hypot(a, b), np.arctan2(b, a) % (2 * math.pi)


# ---------------------------------------------------------------- gamut ceiling Cmax(L, h)
_NL, _NH = 1025, 721
_LUT = None


def _cmax_lut():
    global _LUT
    if _LUT is not None:
        return _LUT
    Ls = np.linspace(0, 1, _NL)
    hs = np.linspace(0, 2 * math.pi, _NH)
    Lg, hg = np.meshgrid(Ls, hs, indexing='ij')
    ca, sa = np.cos(hg), np.sin(hg)
    lo = np.zeros_like(Lg)
    hi = np.full_like(Lg, 0.45)
    for _ in range(28):
        mid = (lo + hi) / 2
        rgb = oklab_to_lin(Lg, mid * ca, mid * sa)
        ok = np.all((rgb >= -1e-6) & (rgb <= 1 + 1e-6), axis=-1)
        lo = np.where(ok, mid, lo)
        hi = np.where(ok, hi, mid)
    lo[0, :] = 0.0
    lo[-1, :] = 0.0
    _LUT = lo
    return _LUT


def cmax_lookup(L, h):
    lut = _cmax_lut()
    fy = np.clip(L, 0, 1) * (_NL - 1)
    fx = (h % (2 * math.pi)) / (2 * math.pi) * (_NH - 1)
    y0 = np.minimum(fy.astype(np.int64), _NL - 2)
    x0 = np.minimum(fx.astype(np.int64), _NH - 2)
    wy = fy - y0
    wx = fx - x0
    return ((lut[y0, x0] * (1 - wx) + lut[y0, x0 + 1] * wx) * (1 - wy)
            + (lut[y0 + 1, x0] * (1 - wx) + lut[y0 + 1, x0 + 1] * wx) * wy)


# ---------------------------------------------------------------- the correction
def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def m_for_top(k, top):
    """Ceiling m of the exponential knee so that rho = 1 lands exactly on `top`."""
    lo, hi = k + 1e-6, 60.0
    for _ in range(70):
        mid = (lo + hi) / 2
        t = k + (mid - k) * (1 - math.exp(-(1 - k) / (mid - k)))
        if t < top:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def make_params(k=0.5, top=1.0, s=1.0, d0=0.30, d1=0.65, Lk=0.80, sh0=0.0, sh1=0.0, cref=0.06, con=0.0):
    """k: relative chroma where the squeeze starts; top: where rho = 1 (full saturation) lands at full weight;
    s: extra chroma gain; d0..d1: the lightness ramp of the weight (nothing below d0, full at d1);
    Lk, sh0, sh1, cref: highlight shoulder (neutral near-white drops by sh0 at L = 1, tinted near-white by sh0 + sh1);
    con: mid-tone S-curve amount."""
    return dict(k=k, top=top, m=(m_for_top(k, top) if top < 1.0 else 1.0), s=s, d0=d0, d1=d1,
                Lk=Lk, sh0=sh0, sh1=sh1, cref=cref, con=con)


IDENTITY = make_params()

# The one dial. t = 0 is the untouched painting; light / medium / strong are three settings of t.
STRENGTHS = {'light': 0.30, 'medium': 0.50, 'strong': 0.85}


def params_for(t, k=0.30):
    """One parameterised function: every parameter is a plain line in t, so the three strengths differ only by t."""
    return make_params(k=k,
                       top=1.0 - 0.34 * t,        # where a fully saturated colour (rho = 1) is sent (1 = no change)
                       s=1.0 - 0.06 * t,          # extra gentle chroma gain on top of the squeeze
                       d0=0.45 - 0.13 * t,        # below this lightness nothing is touched (outlines, deep shadows)
                       d1=0.90 - 0.14 * t,        # from this lightness up the squeeze acts in full
                       Lk=0.80, sh0=0.006 * t,    # token highlight shoulder: pure white loses about 1.5 levels at t = 1
                       sh1=0.0, con=0.0)


def knee(rho, k, m):
    """Identity up to k, then an exponential ease towards the ceiling m (slope 1 at k, so the curve is smooth)."""
    if m <= k + 1e-9 or k >= 1.0:
        return rho
    over = np.maximum(rho - k, 0.0)
    return np.where(rho > k, k + (m - k) * (1 - np.exp(-over / (m - k))), rho)


def correct_rgb8(rgb8, p):
    """(n,3) uint8 -> (n,3) uint8, the correction with parameter dict p."""
    L, C, h = rgb8_to_oklch(rgb8)
    cm = cmax_lookup(L, h)
    rho = np.clip(np.divide(C, cm, out=np.zeros_like(C), where=cm > 1e-6), 0.0, 1.0)
    w = smoothstep((L - p['d0']) / (p['d1'] - p['d0']))
    rho2 = knee(rho, p['k'], p['m'])
    g_knee = np.divide(rho2, rho, out=np.ones_like(rho), where=rho > 1e-9)
    gain = (1 + w * (g_knee - 1)) * (1 + w * (p['s'] - 1))
    x = np.clip((L - p['Lk']) / (1 - p['Lk']), 0, 1)
    amp = p['sh0'] + p['sh1'] * np.minimum(C * gain / p['cref'], 1.0)
    L2 = L - amp * x * x
    if p['con']:
        L2 = L2 + w * p['con'] * (smoothstep(L2) - L2)
    C2 = C * gain
    mod = (np.abs(L2 - L) > 1e-9) | (np.abs(gain - 1) > 1e-9)
    C2 = np.where(mod, np.minimum(C2, cmax_lookup(L2, h) * 0.9995), C2)
    lin = oklab_to_lin(L2, C2 * np.cos(h), C2 * np.sin(h))
    if STATS is not None:
        STATS['px'] += int(len(L))
        STATS['changed'] += int(mod.sum())
        STATS['oog'] += int(np.sum(mod & np.any((lin < -0.0005) | (lin > 1.0005), axis=1)))
    out = np.rint(encode_srgb(lin)).astype(np.uint8)
    out[~mod] = rgb8[~mod]
    return out


STATS = None   # set to {'px': 0, 'changed': 0, 'oog': 0} to count pixels changed / left outside the sRGB gamut before the final clip


def correct_array(arr, p, chunk=600000):
    """(H,W,4) uint8 RGBA -> corrected copy. Alpha plane identical; RGB under alpha 0 identical."""
    out = arr.copy()
    flat_in = arr.reshape(-1, 4)
    flat_out = out.reshape(-1, 4)
    n = flat_in.shape[0]
    for i in range(0, n, chunk):
        blk = flat_in[i:i + chunk]
        idx = np.nonzero(blk[:, 3] > 0)[0]
        if idx.size:
            flat_out[i + idx, :3] = correct_rgb8(blk[idx, :3], p)
    return out


def load_rgba(path):
    return Image.open(path).convert('RGBA')


# ---------------------------------------------------------------- the driver's measures (sat-survey.py, vectorised)
def thumb256(im):
    t = im.copy()
    t.thumbnail((256, 256))
    return np.asarray(t, dtype=np.uint8)


def measures_from_thumb(a):
    """a: (h,w,4) uint8 of the 256 px thumbnail. Returns dict with vivid, clip (fractions), meanS, meanV, n."""
    px = a.reshape(-1, 4)
    px = px[px[:, 3] > 200]
    if px.shape[0] == 0:
        return None
    rgb = px[:, :3].astype(np.float64) / 255.0
    mx = rgb.max(axis=1)
    mn = rgb.min(axis=1)
    s = np.divide(mx - mn, mx, out=np.zeros_like(mx), where=mx > 0)
    vivid = float(np.mean((s > 0.85) & (mx > 0.6)))
    clip = float(np.mean(px[:, :3].max(axis=1) >= 250))
    return dict(vivid=vivid, clip=clip, meanS=float(s.mean()), meanV=float(mx.mean()), n=int(px.shape[0]))


def measures(im_or_arr):
    im = Image.fromarray(im_or_arr) if isinstance(im_or_arr, np.ndarray) else im_or_arr
    return measures_from_thumb(thumb256(im))


def lightness_stats(a):
    """OKLCH stats of the opaque pixels of a thumbnail array (for analysis only)."""
    px = a.reshape(-1, 4)
    px = px[px[:, 3] > 200]
    L, C, h = rgb8_to_oklch(px[:, :3])
    cm = cmax_lookup(L, h)
    rho = np.clip(np.divide(C, cm, out=np.zeros_like(C), where=cm > 1e-6), 0, 1)
    q = lambda x, p: float(np.percentile(x, p))
    return dict(meanL=float(L.mean()), stdL=float(L.std()), p5L=q(L, 5), p50L=q(L, 50), p95L=q(L, 95),
                hiL=float(np.mean(L > 0.93)), meanC=float(C.mean()), p90rho=q(rho, 90), meanrho=float(rho.mean()))


_UTF8_DONE = False


def out_stdout_utf8():
    """Make stdout utf-8; safe to call from several modules (only the first call wraps)."""
    global _UTF8_DONE
    if not _UTF8_DONE:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        _UTF8_DONE = True
