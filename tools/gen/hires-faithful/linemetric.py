"""linemetric.py: how many hard dark hairlines a backdrop master has that its approved painting (bicubic up) does not.

Two numbers per backdrop (both over the whole image, then the worst 400x400 window of the master at 2x):
  hair   : pixels darker than their 11x11 mean by more than 30 levels (thin dark features), master density / approved density (and the excess in per mille)
  hrun   : length of long (>= 120 px) horizontal dark runs per megapixel (a pixel darker than the pixels 4 rows above and below by more than 14)
Also a general 'excess ridge' map for windows: ridge density of the master minus the approved one.
Usage as a module: metrics(master_gray, approved_gray_at_master_size) -> dict ; worst_windows(...)
"""
import numpy as np
from scipy.ndimage import uniform_filter, uniform_filter1d


def box_mean(g, win):
    return uniform_filter(g, size=win, mode='reflect')


def ridges(g, win=11, thr=30.0):
    return (box_mean(g, win) - g) > thr


def hridge(g, off=4, thr=14.0):
    up = np.roll(g, off, 0)
    dn = np.roll(g, -off, 0)
    return ((up + dn) * 0.5 - g) > thr


def long_hruns(mask, minlen=120):
    H, W = mask.shape
    m = np.zeros((H, W + 2), np.int8)
    m[:, 1:-1] = mask
    d = np.diff(m, axis=1)
    st = np.argwhere(d == 1)
    en = np.argwhere(d == -1)
    length = en[:, 1] - st[:, 1]
    keep = length >= minlen
    return float(length[keep].sum() / (H * W / 1e6)), int(keep.sum())


def metrics(gm, ga):
    """gm: master luminance float32 HxW; ga: approved painting luminance bicubic-resized to the same size."""
    rm, ra = ridges(gm), ridges(ga)
    dm, da = float(rm.mean()), float(ra.mean())
    lm, nm = long_hruns(hridge(gm))
    la, na = long_hruns(hridge(ga))
    return {'hair_master': dm, 'hair_approved': da, 'hair_ratio': dm / max(da, 1e-7), 'hair_excess_permille': (dm - da) * 1000,
            'hrun_master': lm, 'hrun_approved': la, 'hrun_n_master': nm, 'hrun_n_approved': na}


def worst_windows(gm, ga, win=400, top=3):
    """The top windows (x, y, w, h in master pixels) by ridge density excess of the master over the approved painting."""
    ex = ridges(gm).astype(np.float32) - ridges(ga).astype(np.float32)
    H, W = ex.shape
    s = uniform_filter(ex, size=win, mode='constant')
    out = []
    taken = np.zeros_like(s, bool)
    flat = np.argsort(s.ravel())[::-1]
    for idx in flat:
        y, x = divmod(int(idx), W)
        if taken[y, x]:
            continue
        x0, y0 = max(0, min(W - win, x - win // 2)), max(0, min(H - win, y - win // 2))
        out.append((x0, y0, win, win, float(s[y, x])))
        taken[max(0, y - win):y + win, max(0, x - win):x + win] = True
        if len(out) >= top:
            break
    return out


def hrun_excess_map(gm, ga, minlen=120):
    """Per-pixel map of pixels lying on long horizontal dark runs of the master that the approved painting lacks (1 where master has a run pixel and approved does not)."""
    def runs(mask):
        H, W = mask.shape
        out = np.zeros((H, W), np.uint8)
        m = np.zeros((H, W + 2), np.int8)
        m[:, 1:-1] = mask
        d = np.diff(m, axis=1)
        st = np.argwhere(d == 1)
        en = np.argwhere(d == -1)
        length = en[:, 1] - st[:, 1]
        keep = np.nonzero(length >= minlen)[0]
        for k in keep:
            y, x0, x1 = st[k, 0], st[k, 1], en[k, 1]
            out[y, x0:x1] = 1
        return out
    rm = runs(hridge(gm))
    ra = runs(hridge(ga))
    return np.clip(rm.astype(np.int16) - ra.astype(np.int16), 0, 1).astype(np.float32)


def worst_hrun_windows(gm, ga, win=500, top=3):
    ex = hrun_excess_map(gm, ga)
    s = uniform_filter(ex, size=win, mode='constant')
    H, W = ex.shape
    out = []
    taken = np.zeros_like(s, bool)
    for idx in np.argsort(s.ravel())[::-1]:
        y, x = divmod(int(idx), W)
        if taken[y, x]:
            continue
        x0, y0 = max(0, min(W - win, x - win // 2)), max(0, min(H - win, y - win // 2))
        out.append((x0, y0, win, win, float(s[y, x])))
        taken[max(0, y - win):y + win, max(0, x - win):x + win] = True
        if len(out) >= top:
            break
    return out
