"""ro_restore.py: the CPU restore stage "D+R" of the painterly roll-out (driver's order, 2026-10-05, after the independent prop review of method D).

Method D loses small props (chains, pendants, buckles, rings), drifts blue to violet and changes iris colours: systematic, not seed luck. D+R repairs a finished D master from today's master (T) with no new GPU work:
  a. COLOUR  Lab: the painterly's L, today's a*/b* wherever today's chroma is above a small threshold (weight smoothstep 8..22, feathered). Hues and iris colours are today's exactly.
  b. DETAIL  where today's high band (difference of Gaussians, 0.4 px to 3.5 px of the 1x painting) carries more energy than the painterly's by a margin, today's high band replaces the painterly's
             (L_out = L_D + w * (HB_T - HB_D)); w is feathered and switched off where the two disagree on the large-scale luminance (an edge the painterly moved: no halo, no double edge).
  c. everything else stays D: the soft gradients and the rim light.
  python ro_restore.py <id> [<id> ...]     writes pilot sheets and metrics to candidates/2026-10-05-painterly-cast/pilot-d-r/
Measurements per figure (for D and for D+R): hue_moved = the share of saturated pixels (today's chroma > 20, at 1x) whose Lab hue moved more than 15 degrees; detail_kept = the mean |high band| of the result over a dilated
mask of today's small details divided by today's (1.0 = all of today's small-detail contrast is there).
"""
import json
import os
import sys
import time

sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter, binary_dilation, uniform_filter
from ro_common import *

Image.MAX_IMAGE_PIXELS = None
PAR = dict(c_lo=8.0, c_hi=22.0, c_feather=0.5, s_hi=0.4, s_lo=3.5, margin=1.15, e_min=1.2, e_span=1.6, feather=0.5, align_lo=8.0, align_hi=22.0, ncc_lo=0.3, ncc_hi=0.6, c_sigma=1.2)
OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-05-painterly-cast/pilot-d-r'
LIB = OUTLIB
FONT = ImageFont.truetype('arial.ttf', 15)
BG = (58, 60, 70)


# ----------------------------------------------------------------------------------------------- float32 colour
_M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]], np.float32)
_W = np.array([0.95047, 1.0, 1.08883], np.float32)


def rgb2lab(u8):
    c = u8.astype(np.float32) / 255.0
    lin = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92).astype(np.float32)
    xyz = lin @ _M.T / _W
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16.0 / 116.0).astype(np.float32)
    return np.stack([116.0 * f[..., 1] - 16.0, 500.0 * (f[..., 0] - f[..., 1]), 200.0 * (f[..., 1] - f[..., 2])], -1).astype(np.float32)


def lab2rgb(lab):
    fy = (lab[..., 0] + 16.0) / 116.0
    fx = fy + lab[..., 1] / 500.0
    fz = fy - lab[..., 2] / 200.0
    f = np.stack([fx, fy, fz], -1)
    xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16.0 / 116.0) / 7.787).astype(np.float32) * _W
    lin = xyz @ np.linalg.inv(_M).T.astype(np.float32)
    lin = np.clip(lin, 0, 1)
    c = np.where(lin > 0.0031308, 1.055 * lin ** (1 / 2.4) - 0.055, 12.92 * lin)
    return (np.clip(c, 0, 1) * 255.0 + 0.5).astype(np.uint8)


def sstep(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return (t * t * (3 - 2 * t)).astype(np.float32)


# ----------------------------------------------------------------------------------------------- the restore
def restore(T, M, S, P=PAR):
    """T, M: RGBA PIL images of the same size (today's master, the painterly D master). Returns (RGBA image D+R, dict of the maps for the measurements)."""
    ta = np.asarray(T)
    ma = np.asarray(M)
    alpha = ma[..., 3]
    lt, lm = rgb2lab(ta[..., :3]), rgb2lab(ma[..., :3])
    # a. colour
    ct = np.hypot(lt[..., 1], lt[..., 2])
    wc = sstep(ct, P['c_lo'], P['c_hi'])
    if P['c_feather'] > 0:
        wc = gaussian_filter(wc, P['c_feather'] * S)
    out = lm.copy()
    if P['c_sigma'] > 0:     # the correction of today's colour, low-passed: D keeps its own fine chroma, its regional hue and saturation are brought to today's (no chroma pasted onto an edge that moved)
        den = np.maximum(gaussian_filter(wc, P['c_sigma'] * S), 1e-3)
        for ch in (1, 2):
            out[..., ch] = lm[..., ch] + wc * gaussian_filter(wc * (lt[..., ch] - lm[..., ch]), P['c_sigma'] * S) / den
    else:
        out[..., 1] = lm[..., 1] * (1 - wc) + lt[..., 1] * wc
        out[..., 2] = lm[..., 2] * (1 - wc) + lt[..., 2] * wc
    # b. detail
    hb_t = gaussian_filter(lt[..., 0], P['s_hi'] * S) - gaussian_filter(lt[..., 0], P['s_lo'] * S)
    hb_m = gaussian_filter(lm[..., 0], P['s_hi'] * S) - gaussian_filter(lm[..., 0], P['s_lo'] * S)
    e_t = gaussian_filter(np.abs(hb_t), 1.0 * S)
    e_m = gaussian_filter(np.abs(hb_m), 1.0 * S)
    wd = sstep(e_t - P['margin'] * e_m, P['e_min'] * 0.5, P['e_min'] * 0.5 + P['e_span'])
    wd *= (e_t > P['e_min']).astype(np.float32)
    if P['feather'] > 0:
        wd = gaussian_filter(wd, P['feather'] * S)
    low_d = np.abs(gaussian_filter(lt[..., 0], 2.0 * S) - gaussian_filter(lm[..., 0], 2.0 * S))
    wd *= 1.0 - sstep(low_d, P['align_lo'], P['align_hi'])
    if P['ncc_hi'] > 0:      # structures that the painterly moved or redrew (no local correlation with today's): leave them alone, a transferred high band would only double the edge
        bt = gaussian_filter(lt[..., 0], 1.0 * S) - gaussian_filter(lt[..., 0], 3.5 * S)
        bm = gaussian_filter(lm[..., 0], 1.0 * S) - gaussian_filter(lm[..., 0], 3.5 * S)
        num = gaussian_filter(bt * bm, 2.0 * S)
        den = np.sqrt(gaussian_filter(bt * bt, 2.0 * S) * gaussian_filter(bm * bm, 2.0 * S)) + 1e-3
        wd *= sstep(num / den, P['ncc_lo'], P['ncc_hi'])
        del bt, bm, num, den
    out[..., 0] = np.clip(lm[..., 0] + wd * (hb_t - hb_m), 0, 100)
    rgb = lab2rgb(out)
    res = Image.fromarray(np.dstack([rgb, alpha]), 'RGBA')
    return res, {'wd': wd, 'wc': wc, 'hb_t': hb_t, 'e_t': e_t, 'e_m': e_m}


# ----------------------------------------------------------------------------------------------- measurements
def block_lab(rgba, S):
    """Alpha-weighted block mean of Lab at 1x: (lab (h,w,3), alpha (h,w))."""
    a = rgba[..., 3].astype(np.float32) / 255.0
    lab = rgb2lab(rgba[..., :3])
    h, w = rgba.shape[0] // S, rgba.shape[1] // S
    wgt = a[:h * S, :w * S].reshape(h, S, w, S)
    num = (lab[:h * S, :w * S].reshape(h, S, w, S, 3) * wgt[..., None]).sum((1, 3))
    den = wgt.sum((1, 3))
    return num / np.maximum(den, 1e-4)[..., None], den / (S * S)


def hue_moved(T, X, S):
    lt, at = block_lab(np.asarray(T), S)
    lx, ax = block_lab(np.asarray(X), S)
    ct = np.hypot(lt[..., 1], lt[..., 2])
    sel = (ct > 20) & (at > 0.9) & (ax > 0.9)
    if sel.sum() < 50:
        return None, 0
    ht = np.degrees(np.arctan2(lt[..., 2], lt[..., 1]))
    hx = np.degrees(np.arctan2(lx[..., 2], lx[..., 1]))
    d = np.abs((hx - ht + 180) % 360 - 180)
    return round(float((d[sel] > 15).mean()), 4), int(sel.sum())


def hue_map(T, X, S):
    """Per-1x-pixel flag: today saturated and hue moved more than 15 degrees."""
    lt, at = block_lab(np.asarray(T), S)
    lx, ax = block_lab(np.asarray(X), S)
    ct = np.hypot(lt[..., 1], lt[..., 2])
    ht = np.degrees(np.arctan2(lt[..., 2], lt[..., 1]))
    hx = np.degrees(np.arctan2(lx[..., 2], lx[..., 1]))
    d = np.abs((hx - ht + 180) % 360 - 180)
    return ((ct > 20) & (at > 0.9) & (ax > 0.9) & (d > 15)).astype(np.float32)


def detail_kept(T, X, S, maps_t=None):
    """mean |HB| of X over the dilated mask of today's small details, over today's."""
    lt = rgb2lab(np.asarray(T)[..., :3])[..., 0]
    lx = rgb2lab(np.asarray(X)[..., :3])[..., 0]
    hb = lambda l: gaussian_filter(l, 0.4 * S) - gaussian_filter(l, 2.0 * S)
    ht, hx = hb(lt), hb(lx)
    a = np.asarray(T)[..., 3] > 200
    small = (np.abs(ht) > 5.0) & a
    small = binary_dilation(small, iterations=max(2, int(1.0 * S)))
    if small.sum() < 100:
        return None
    return round(float(np.abs(hx[small]).mean() / np.abs(ht[small]).mean()), 4)


# ----------------------------------------------------------------------------------------------- sheets
def find_master(i):
    a = [x for x in plan() if x['id'] == i][0]
    man = load_json(f'{LIB}/manifest.json')['assets'].get(i, {})
    if man.get('status') == 'ok' and os.path.exists(f'{LIB}/{i}@{a["S"]}x.png'):
        return a, f'{LIB}/{i}@{a["S"]}x.png', f'D library ({man.get("method")} s{man.get("seed")})'
    for d in ('by-eye', '_superseded'):
        for m in ('D', 'C'):
            for sd in (9101, 9102, 9103):
                for pat in (f'{LIB}/{d}/{i}/cand-{m}-s{sd}.png', f'{LIB}/{d}/{i}/{i.split("/")[-1]}@{a["S"]}x.png'):
                    if os.path.exists(pat):
                        return a, pat, f'{d} {os.path.basename(pat)}'
    return a, None, None


def windows(T, M, R, maps, head, S, n_props=2, size=240):
    """Crop windows (x0, y0) in 4x pixels: eyes, neck, the n_props windows where D+R restored the most detail, the window where D drifted most in hue."""
    H, W = np.asarray(T).shape[:2]
    out = []
    if head:
        hx0, hy0, hx1, hy1 = [v * S for v in head]
        cx = (hx0 + hx1) / 2
        out.append(('eyes', int(cx - size / 2), int(hy0 + 0.30 * (hy1 - hy0) - size / 2)))
        out.append(('neck', int(cx - size / 2), int(hy1 - 0.15 * size)))
    gain = maps['wd'] * np.maximum(maps['e_t'] - maps['e_m'], 0)
    g1 = uniform_filter(gain[::4, ::4], size=size // 4)
    taken = [(w[1], w[2]) for w in out]
    for k in range(n_props):
        for _ in range(60):
            yy, xx = np.unravel_index(np.argmax(g1), g1.shape)
            x0, y0 = xx * 4 - size // 2, yy * 4 - size // 2
            if all(abs(x0 - a) > size or abs(y0 - b) > size for a, b in taken):
                out.append((f'detail {k + 1}', int(x0), int(y0)))
                taken.append((x0, y0))
            g1[max(0, yy - size // 8):yy + size // 8, max(0, xx - size // 8):xx + size // 8] = 0
            if len(out) >= (2 if head else 0) + k + 1:
                break
    hm = hue_map(T, M, S)
    h1 = uniform_filter(hm, size=size // S)
    if h1.max() > 0.02:
        yy, xx = np.unravel_index(np.argmax(h1), h1.shape)
        out.append(('hue drift', int(xx * S - size // 2), int(yy * S - size // 2)))
    res = []
    for n, x0, y0 in out:
        x0 = int(np.clip(x0, 0, max(0, W - size))); y0 = int(np.clip(y0, 0, max(0, H - size)))
        res.append((n, x0, y0))
    return res


def flat(im):
    b = Image.new('RGB', im.size, BG)
    b.paste(im, mask=im.getchannel('A'))
    return b


def sheet(i, T, M, R, mets, wins, outp, size=240, h=600):
    ims = [('today', T), (f'D  hue moved {mets["D"]["hue_moved"]}  detail kept {mets["D"]["detail_kept"]}', M), (f'D+R  hue moved {mets["DR"]["hue_moved"]}  detail kept {mets["DR"]["detail_kept"]}', R)]
    a = np.asarray(T)[..., 3]
    ys, xs = np.nonzero(a > 128)
    bb = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    figs = []
    for lab, im in ims:
        f = flat(im.crop(bb))
        figs.append((lab, f.resize((max(1, round(f.width * h / f.height)), h), Image.LANCZOS)))
    fl = [flat(im) for _, im in ims]
    cw = size + 6
    W = max(sum(f.width + 8 for _, f in figs), 3 * cw)
    rows = len(wins)
    sh = Image.new('RGB', (W, 22 + h + rows * (size + 22)), (24, 24, 28))
    d = ImageDraw.Draw(sh)
    x = 0
    for lab, f in figs:
        d.text((x + 4, 3), lab, fill=(235, 235, 235), font=FONT)
        sh.paste(f, (x, 22))
        x += f.width + 8
    y = 22 + h
    for n, x0, y0 in wins:
        for c, (lab, _) in enumerate(ims):
            d.text((c * cw + 4, y + 2), f'{n}: {lab.split()[0]}', fill=(255, 220, 120), font=FONT)
            sh.paste(fl[c].crop((x0, y0, x0 + size, y0 + size)), (c * cw, y + 20))
        y += size + 22
    os.makedirs(os.path.dirname(outp), exist_ok=True)
    sh.save(outp, quality=88)


def run_one(i, P=PAR, save_master=True):
    t0 = time.time()
    a, mp, src = find_master(i)
    if not mp:
        return {'id': i, 'status': 'no master'}
    S = a['S']
    T = Image.open(f'{EDIR}/{i}@{S}x.png').convert('RGBA')
    M = Image.open(mp).convert('RGBA')
    if M.size != T.size:
        return {'id': i, 'status': f'size {M.size} vs {T.size}'}
    head = (load_json(f'{RW}/heads.json', {}).get(i) or {}).get('box')
    R, maps = restore(T, M, S, P)
    mets = {'D': {'hue_moved': hue_moved(T, M, S)[0], 'detail_kept': detail_kept(T, M, S)},
            'DR': {'hue_moved': hue_moved(T, R, S)[0], 'detail_kept': detail_kept(T, R, S)}}
    wins = windows(T, M, R, maps, head, S)
    cid, st = i.split('/')[-2:]
    sheet(i, T, M, R, mets, wins, f'{OUT}/sheets/{cid}-{st}.jpg')
    if save_master:
        os.makedirs(f'{OUT}/masters/{cid}', exist_ok=True)
        R.save(f'{OUT}/masters/{cid}/{st}-DR@4x.png', compress_level=3)
    return {'id': i, 'status': 'ok', 'source': src, 'metrics': mets, 'windows': wins, 'seconds': round(time.time() - t0, 1)}


def _worker_init():
    try:
        import ctypes
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)
    except Exception:
        pass


if __name__ == '__main__':
    from multiprocessing import Pool
    ids = [x if x.startswith('characters/') else 'characters/' + x for x in sys.argv[1:]]
    mp = f'{OUT}/metrics.json'
    res = load_json(mp, {})
    todo = [i for i in ids if res.get(i, {}).get('status') != 'ok']
    with Pool(int(os.environ.get('RO_WORKERS', '1')), initializer=_worker_init, maxtasksperchild=3) as pool:
        for r in pool.imap_unordered(run_one, todo):
            res[r['id']] = r
            save_json(mp, res)
            print(r['id'], r.get('status'), r.get('metrics'), r.get('seconds'), flush=True)
