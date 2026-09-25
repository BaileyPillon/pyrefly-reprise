# Small numpy-only colour kit for the Isaaru production repairs (no GPU, no cv2/skimage on this machine).
import numpy as np

def _lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def _gam(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)

_M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
_Mi = np.linalg.inv(_M)
_W = np.array([0.95047, 1.0, 1.08883])

def rgb2lab(rgb):
    """rgb uint8 or float 0..255, shape (...,3) -> Lab float."""
    x = _lin(np.asarray(rgb, np.float64) / 255.0) @ _M.T / _W
    f = np.where(x > (6 / 29) ** 3, np.cbrt(x), x / (3 * (6 / 29) ** 2) + 4 / 29)
    L = 116 * f[..., 1] - 16
    a = 500 * (f[..., 0] - f[..., 1])
    b = 200 * (f[..., 1] - f[..., 2])
    return np.stack([L, a, b], -1)

def lab2rgb(lab):
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    fy = (L + 16) / 116
    fx = fy + a / 500
    fz = fy - b / 200
    f = np.stack([fx, fy, fz], -1)
    x = np.where(f > 6 / 29, f ** 3, 3 * (6 / 29) ** 2 * (f - 4 / 29)) * _W
    return np.clip(_gam(x @ _Mi.T) * 255, 0, 255)

def rgb2hsv(rgb):
    c = np.asarray(rgb, np.float64) / 255.0
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    mx = c.max(-1); mn = c.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-9
    rr = m & (mx == r); gg = m & (mx == g) & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6
    h[gg] = (b - r)[gg] / d[gg] + 2
    h[bb] = (r - g)[bb] / d[bb] + 4
    h = h * 60
    s = np.where(mx > 1e-9, d / np.maximum(mx, 1e-9), 0)
    return np.stack([h, s, mx], -1)

def ramp_map(src_lab, ref_lab, lo=0.0, hi=1.0, lift=0.0):
    """Rank-map each source pixel's L into the reference's L distribution between quantiles lo..hi,
    and take a*/b* from the reference pixels of the nearest L (a Lab quantile lock onto the picture's own colours)."""
    order = np.argsort(ref_lab[:, 0])
    ref = ref_lab[order]
    n = len(ref)
    rank = np.argsort(np.argsort(src_lab[:, 0])) / max(1, len(src_lab) - 1)
    q = lo + rank * (hi - lo)
    idx = np.clip((q * (n - 1)).round().astype(int), 0, n - 1)
    # smooth a*/b* along the ramp so the recolour carries no speckle
    k = max(1, n // 60)
    cs = np.cumsum(np.vstack([np.zeros((1, 3)), ref]), 0)
    lo_i = np.clip(idx - k, 0, n - 1); hi_i = np.clip(idx + k, 0, n - 1)
    mean = (cs[hi_i + 1] - cs[lo_i]) / (hi_i - lo_i + 1)[:, None]
    out = np.empty_like(src_lab)
    out[:, 0] = mean[:, 0] + lift
    out[:, 1] = mean[:, 1]
    out[:, 2] = mean[:, 2]
    return out
