# Round 2 correction: the perceptual-target version of the OKLab function. Same rules as round 1 (see rikku_colour.py):
# hue, alpha, RGB under alpha 0, dark pixels (OKLab L below d0) and everything the function does not change are untouched / copied back byte for byte,
# nothing is resampled, gamut mapping is by chroma at constant lightness and hue.
#
# What changed, on the coordinator's brief:
#  1. The chroma reduction scales with chroma itself: C' = C / (1 + (C / Cc)^q)^(1/q), a smooth limiter (the most saturated pixels lose the most),
#     blended in by the lightness weight w(L) = smoothstep((L - d0) / (d1 - d0)); a gentle extra gain s on top.
#  2. Glare control: only for high-chroma pixels (weight rises from C = cg0 to cg1, so near-whites and near-greys are never touched) and only in the
#     bright band (weight rises from L = Lg0 to Lg1), lightness is pulled down by up to g.
#  3. Skin: the Songstress's thighs and midriff are far above the skin chroma of the FFX painting "rikku" (.175 against .100 to .129), so the skin hue band
#     (orange hues, mid to light lightness) gets a floor: its chroma is never pushed below min(C, skin_lo), skin_lo = the FFX skin's 5th percentile.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
import rikku_colour as rc

STATS = None


def make_params2(**kw):
    p = dict(Cc=1.0, q=2.0, s=1.0, d0=0.30, d1=0.55, g=0.0, Lg0=0.62, Lg1=0.90, cg0=0.04, cg1=0.10,
             kb=0.0, Lb0=0.78, Lb1=0.92, gy=0.0,
             area_rf=1.0, loud_C=0.14, r_frac=0.009, a0=0.20, a1=0.60,
             skin_lo=0.100, sk_h0=30.0, sk_h1=80.0, sk_L0=0.45, sk_L1=0.92, sk_on=1.0)
    p.update(kw)
    return p


def area_map(arr, p, chunk=600000):
    """Accent relief: per pixel, the multiplier m in [rf, 1] on the colour reduction. m is 1 inside big flat areas of loud colour and falls to rf for small
    isolated accents (eyes, beads, gems), measured as the share of loud pixels (OKLCH C above loud_C) in a window of radius r_frac * image height.
    Pure function of the picture and scale-free (the window grows with the tier), so every pose and every tier gets the same look."""
    H, W = arr.shape[:2]
    flat = arr.reshape(-1, 4)
    loud = np.zeros(H * W, bool)
    for i in range(0, H * W, chunk):
        blk = flat[i:i + chunk]
        idx = np.nonzero(blk[:, 3] > 200)[0]
        if idx.size:
            L, C, h = rc.rgb8_to_oklch(blk[idx, :3])
            loud[i + idx] = (C > p['loud_C']) & (L > 0.40)
    loud = loud.reshape(H, W).astype(np.int32)
    r = max(2, int(round(p['r_frac'] * H)))
    ii = np.zeros((H + 1, W + 1), np.int64)
    ii[1:, 1:] = loud.cumsum(0).cumsum(1)
    y0 = np.clip(np.arange(H) - r, 0, H)
    y1 = np.clip(np.arange(H) + r + 1, 0, H)
    x0 = np.clip(np.arange(W) - r, 0, W)
    x1 = np.clip(np.arange(W) + r + 1, 0, W)
    box = ii[y1][:, x1] - ii[y0][:, x1] - ii[y1][:, x0] + ii[y0][:, x0]
    dens = box / float((2 * r + 1) ** 2)
    m = p['area_rf'] + (1.0 - p['area_rf']) * rc.smoothstep((dens - p['a0']) / (p['a1'] - p['a0']))
    return m.reshape(-1)


def correct_rgb8_v2(rgb8, p, area=None):
    L, C, h = rc.rgb8_to_oklch(rgb8)
    hd = np.degrees(h)
    wd = rc.smoothstep((L - p['d0']) / (p['d1'] - p['d0']))
    if area is not None:
        wd = wd * area
    if p['kb']:        # bright-band relief: in the very bright band the lightness pull (glare control) does more of the work, the chroma squeeze less
        wd = wd * (1.0 - p['kb'] * rc.smoothstep((L - p['Lb0']) / (p['Lb1'] - p['Lb0'])))
    lim = C / (1.0 + (C / p['Cc']) ** p['q']) ** (1.0 / p['q'])
    C2 = C + wd * (lim - C)
    C2 = C2 * (1.0 - wd * (1.0 - p['s']))
    if p['sk_on']:
        wh = rc.smoothstep((hd - (p['sk_h0'] - 6.0)) / 6.0) * (1.0 - rc.smoothstep((hd - p['sk_h1']) / 6.0))
        wl = rc.smoothstep((L - (p['sk_L0'] - 0.04)) / 0.04) * (1.0 - rc.smoothstep((L - p['sk_L1']) / 0.04))
        C2 = np.maximum(C2, wh * wl * np.minimum(C, p['skin_lo']))
    wg = rc.smoothstep((L - p['Lg0']) / (p['Lg1'] - p['Lg0']))
    wc = rc.smoothstep((C - p['cg0']) / (p['cg1'] - p['cg0']))
    if p['gy']:        # yellow-green hues turn olive when they get darker: the lightness pull is eased there
        wy = rc.smoothstep((hd - 75.0) / 15.0) * (1.0 - rc.smoothstep((hd - 125.0) / 15.0))
        wg = wg * (1.0 - p['gy'] * wy)
    L2 = L - p['g'] * wg * wc
    mod = (np.abs(L2 - L) > 1e-9) | (np.abs(C2 - C) > 1e-9)
    C2 = np.where(mod, np.minimum(C2, rc.cmax_lookup(L2, h) * 0.9995), C2)
    lin = rc.oklab_to_lin(L2, C2 * np.cos(h), C2 * np.sin(h))
    if STATS is not None:
        STATS['px'] += int(len(L))
        STATS['changed'] += int(mod.sum())
        STATS['oog'] += int(np.sum(mod & np.any((lin < -0.0005) | (lin > 1.0005), axis=1)))
    out = np.rint(rc.encode_srgb(lin)).astype(np.uint8)
    out[~mod] = rgb8[~mod]
    return out


def correct_array2(arr, p, chunk=600000):
    out = arr.copy()
    flat_in = arr.reshape(-1, 4)
    flat_out = out.reshape(-1, 4)
    amap = area_map(arr, p) if p.get('area_rf', 1.0) < 1.0 else None
    for i in range(0, flat_in.shape[0], chunk):
        blk = flat_in[i:i + chunk]
        idx = np.nonzero(blk[:, 3] > 0)[0]
        if idx.size:
            flat_out[i + idx, :3] = correct_rgb8_v2(blk[idx, :3], p, None if amap is None else amap[i + idx])
    return out


def stats_of(arr):
    """mean OKLCH chroma, mean HSV saturation, 90th-percentile chroma, mean L of the opaque pixels (alpha > 200) on the 256 px thumbnail."""
    t = rc.thumb256(Image.fromarray(arr))
    px = t.reshape(-1, 4)
    px = px[px[:, 3] > 200]
    rgb = px[:, :3].astype(np.float64) / 255.0
    mx, mn = rgb.max(1), rgb.min(1)
    s = np.divide(mx - mn, mx, out=np.zeros_like(mx), where=mx > 0)
    L, C, h = rc.rgb8_to_oklch(px[:, :3])
    return dict(meanC=float(C.mean()), meanS=float(s.mean()), p90C=float(np.percentile(C, 90)), meanL=float(L.mean()))


def load_arr(who, d, pose='idle', tier=''):
    return np.array(Image.open(os.path.join(rc.ROOT, f'{who}-{d}', f'{pose}{tier}.png')).convert('RGBA'), dtype=np.uint8)
