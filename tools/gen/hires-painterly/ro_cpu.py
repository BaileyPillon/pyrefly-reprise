"""ro_cpu.py: the CPU stage of the painterly roll-out (method D, with C as its fallback), one figure and one seed at a time. Runs in worker processes.

Inputs per figure (made by ro_gpu.py in RW/<id>/): klein-s<seed>.png (Klein's lock pass at its working size), rgb-s<seed>.png (ESRGAN to the master's size, RGB on white), face-s<seed>.png (the face pass, if the
figure has a head box). The approved painting (1x) and the library master "today" (the E library, 4x or 2x) are read from the art tree.
Gates per candidate (the driver's): silhouette IoU of the generated figure's matte against the approved alpha >= 0.95; under 3 percent of 40 px costume cells moved by more than 20 dE; facial structure >= 0.75
where there is a head box. D = refs + init lock + face pass + palette lock; C = D without the face pass; the face pass is used only when it helps (face_rule).
"""
import hashlib
import os
import sys
import time

sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from ro_common import *
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from skimage.color import rgb2lab, lab2rgb

Image.MAX_IMAGE_PIXELS = None
GATE = {'iou': 0.95, 'cells': 0.03, 'struct': 0.75}
_m = {}
_sess = [None]
_clip = [None]


def mods():
    if not _m:
        sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/closeup-art/tools')
        sys.path.insert(0, 'D:/pyrefly-r39-art/tools/gen/hires-alpha-fix')
        import cc
        import hires_lib as H
        import alphafix as af
        import batch as AB
        import edge_e
        _m.update(cc=cc, H=H, af=af, AB=AB, edge_e=edge_e)
    return _m


def worker_init():
    try:
        import ctypes
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)   # BELOW_NORMAL
    except Exception:
        pass


def clipm():
    if _clip[0] is None:
        import clipsim
        _clip[0] = clipsim
    return _clip[0]


def matte(rgb_img):
    if _sess[0] is None:
        os.environ.setdefault('U2NET_HOME', 'D:/Tools/ComfyUI/rembg-models')
        from rembg import new_session
        _sess[0] = new_session('isnet-anime')
    from rembg import remove
    return remove(rgb_img.convert('RGB'), session=_sess[0])


def approved1x(a):
    return Image.open(f'{ART}/{a["id"]}.png').convert('RGBA')


def today(a):
    return Image.open(f'{EDIR}/{a["id"]}@{a["S"]}x.png').convert('RGBA')


def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 22), b''):
            h.update(b)
    return h.hexdigest()


def flat_white(im):
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


# ------------------------------------------------------------------------------------------------------------ measures
def matte_iou(kw_rgb, P):
    """The generated figure's matte (rembg) against the approved alpha at the working size. Returns (raw IoU, core IoU): the core IoU ignores what the generation draws far outside the approved body
    (glows, sparks, a magic circle that the matte keeps or drops) and compares the generated matte near the body (within 2 percent of the figure's size) with the opaque core of the approved alpha."""
    from scipy.ndimage import distance_transform_edt
    al = np.asarray(matte(kw_rgb))[..., 3] > 127
    apa = np.asarray(P.getchannel('A').resize(kw_rgb.size, Image.LANCZOS))
    ap = apa > 127
    raw = float((al & ap).sum() / max(1, (al | ap).sum()))
    core = apa >= 200
    if core.sum() < 500:
        return raw, raw
    r = max(4, int(0.02 * min(kw_rgb.size)))
    near = distance_transform_edt(~core) <= r
    g = al & near
    return raw, float((g & core).sum() / max(1, (g | core).sum()))


def lab_scaled(im, k):
    a = np.asarray(im.getchannel('A'), dtype=np.float32) / 255.0
    rgb = np.asarray(im.convert('RGB'), dtype=np.float32) / 255.0
    h, w = im.height // k, im.width // k
    pm = (rgb[:h * k, :w * k] * a[:h * k, :w * k, None]).reshape(h, k, w, k, 3).mean((1, 3))
    a1 = a[:h * k, :w * k].reshape(h, k, w, k).mean((1, 3))
    rgb1 = np.where(a1[..., None] > 1e-3, pm / np.maximum(a1[..., None], 1e-3), 0.0)
    return rgb2lab(np.clip(rgb1, 0, 1)), a1


def cell_drift(Tm, M, S, cell=40):
    k = S
    lr, ar = lab_scaled(Tm, k)
    lc, ac = lab_scaled(M, k)
    h, w = min(ar.shape[0], ac.shape[0]), min(ar.shape[1], ac.shape[1])
    cell = int(max(12, min(cell, min(h, w) // 6)))
    des = []
    for y in range(0, h - cell + 1, cell):
        for x in range(0, w - cell + 1, cell):
            wr, wc = ar[y:y + cell, x:x + cell], ac[y:y + cell, x:x + cell]
            if min(wr.mean(), wc.mean()) < 0.6:
                continue
            mr_ = (lr[y:y + cell, x:x + cell] * wr[..., None]).sum((0, 1)) / wr.sum()
            mc_ = (lc[y:y + cell, x:x + cell] * wc[..., None]).sum((0, 1)) / wc.sum()
            des.append(float(np.sqrt(((mr_ - mc_) ** 2).sum())))
    d = np.array(des) if des else np.zeros(1)
    return {'cells_over20': round(float((d > 20).mean()), 4), 'cell_dE_p90': round(float(np.percentile(d, 90)), 2), 'cells': int(len(d))}


def head_window(im, head, S, size=224):
    x0, y0, x1, y1 = [v * S for v in head]
    w = flat_white(im) if im.mode == 'RGBA' else im.convert('RGB')
    return w.crop((int(x0), int(y0), int(x1), int(y1))).resize((size, size), Image.LANCZOS)


def head_struct(Tm, M, head, S, sigma=2.0):
    def grad(im):
        g = gaussian_filter(np.asarray(im.convert('L'), dtype=np.float32), sigma)
        gy, gx = np.gradient(g)
        return np.hypot(gx, gy).ravel()
    a, b = grad(head_window(Tm, head, S)), grad(head_window(M, head, S))
    if a.std() < 1e-6 or b.std() < 1e-6:
        return 1.0
    return round(float(np.corrcoef(a, b)[0, 1]), 4)


def face_cos(Tm, M, head, S):
    c = clipm()
    return round(c.cos(c.embed(head_window(Tm, head, S)), c.embed(head_window(M, head, S))), 4)


def face_rule(dc, ds):
    """Use the face pass iff it raises the CLIP face likeness, or raises the facial structure by 0.08 or more without lowering the likeness by more than 0.015
    (calibrated on Tidus, Seymour Flux and Yuna Gunner, both seeds: Tidus -> C, the other two -> D)."""
    return dc >= 0 or (ds >= 0.08 and dc >= -0.015)


# ------------------------------------------------------------------------------------------------------------ the pieces of the master
def composite_face(rgb, face, head, S, ring=0.2):
    """Paste the face pass over the head box of the figure (RGB on white): an ellipse with a soft edge, the face pass colour-matched to the figure on the ring around the ellipse."""
    x0, y0, x1, y1 = [int(v * S) for v in head]
    bw, bh = x1 - x0, y1 - y0
    f = face.resize((bw, bh), Image.LANCZOS)
    A = np.asarray(rgb.crop((x0, y0, x1, y1))).astype(np.float32)
    Fa = np.asarray(f).astype(np.float32)
    yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
    rr = np.sqrt(((xx - (bw - 1) / 2) / (0.38 * bw)) ** 2 + ((yy - (bh - 1) / 2) / (0.44 * bh)) ** 2)
    mask = gaussian_filter(np.clip((1.0 - rr) / ring + 0.5, 0, 1), 0.01 * bw)
    ann = (rr > 0.8) & (rr < 1.3) & (A.min(-1) < 235) & (Fa.min(-1) < 235)
    if ann.sum() > 500:
        la, lf = rgb2lab(A / 255.0), rgb2lab(Fa / 255.0)
        for c in range(3):
            ma, mf = la[..., c][ann].mean(), lf[..., c][ann].mean()
            k = float(np.clip((la[..., c][ann].std() + 1e-3) / (lf[..., c][ann].std() + 1e-3), 0.8, 1.25)) if c else 1.0
            lf[..., c] = (lf[..., c] - mf) * k + ma
        Fa = np.clip(lab2rgb(lf), 0, 1) * 255.0
    out = A * (1 - mask[..., None]) + Fa * mask[..., None]
    res = rgb.copy()
    res.paste(Image.fromarray(np.uint8(np.clip(out, 0, 255) + 0.5), 'RGB'), (x0, y0))
    return res


def smooth(lab, w, s):
    num = np.stack([gaussian_filter(lab[..., c] * w, s) for c in range(3)], -1)
    den = gaussian_filter(w, s)
    return num / np.maximum(den, 1e-4)[..., None], den


def palette_lock(Tm, cand, S, strength=0.9, lam_l=0.95, dmax=(30.0, 28.0)):
    """The cut-out's low-frequency Lab colour moved 85 percent of the way to today's (masked blur of 5 px of the 1x painting, outlines and the transparent area left out)."""
    lr, ar = lab_scaled(Tm, S)
    lo, ao = lab_scaled(cand, S)
    sigma = 5.0 if min(ar.shape) >= 300 else max(2.0, 5.0 * min(ar.shape) / 300.0)
    wr = ar * np.maximum(0.15, np.clip((lr[..., 0] - 14.0) / 16.0, 0, 1))     # thin dark outlines count little, but a dark region (a black coat) still counts: it is what the lock must restore
    wo = ao * np.maximum(0.15, np.clip((lo[..., 0] - 14.0) / 16.0, 0, 1))
    sr, dr = smooth(lr, wr, sigma)
    so, do = smooth(lo, wo, sigma)
    valid = gaussian_filter(((dr > 0.08) & (do > 0.08)).astype(np.float32), 1.5)
    delta = (sr - so) * valid[..., None]
    delta[..., 0] = np.clip(delta[..., 0] * lam_l, -dmax[0], dmax[0])
    delta[..., 1:] = np.clip(delta[..., 1:], -dmax[1], dmax[1])
    H4, W4 = cand.height, cand.width
    d4 = np.stack([np.asarray(Image.fromarray(np.ascontiguousarray(delta[..., c], dtype=np.float32), 'F').resize((W4, H4), Image.BICUBIC)) for c in range(3)], -1)
    lab4 = rgb2lab(np.asarray(cand.convert('RGB'), dtype=np.float32) / 255.0) + strength * d4
    out = (np.clip(lab2rgb(lab4), 0, 1) * 255.0 + 0.5).astype(np.uint8)
    return Image.fromarray(np.dstack([out, np.asarray(cand.getchannel('A'))]), 'RGBA')


def build_master(rgb, Tm, P_img, S):
    """The approved alpha cut (the library's own rim repair, as for the style pilot's S1), the edge treatment E, then the palette lock."""
    m = mods()
    P = np.asarray(P_img)
    w, h = P_img.size
    plain = np.asarray(Tm.convert('RGB'))[:h * S, :w * S]
    ref = np.asarray(rgb.convert('RGB'))[:h * S, :w * S]
    out = m['cc'].finish_figure2(P_img, ref, plain, S)
    out = m['H'].trim_bleed(out, m['H'].BLEED)
    N, _ = m['af'].repair(P, np.asarray(out), S, **m['AB'].PARAMS)
    NE, _ = m['edge_e'].apply_E(P, N, S)
    return palette_lock(Tm, Image.fromarray(NE, 'RGBA'), S)


def gates(Tm, M, S, iou, head):
    g = {'iou': round(iou, 4)}
    g.update(cell_drift(Tm, M, S))
    if head:
        g['head_struct'] = head_struct(Tm, M, head, S)
    g['pass_iou'] = iou >= GATE['iou']
    g['pass_cells'] = g['cells_over20'] < GATE['cells']
    g['pass_face'] = True if not head else g['head_struct'] >= GATE['struct']
    g['pass'] = bool(g['pass_iou'] and g['pass_cells'] and g['pass_face'])
    return g


def write_outputs(a, M, lib):
    """The painterly 4x (or 2x) and every smaller tier derived from it, as new files in the library; an existing file is never touched."""
    af = mods()['af']
    S = a['S']
    cur = np.asarray(M)
    levels = {S: cur}
    s = S
    while s > 1:
        cur = af.reduce_half(cur)
        s //= 2
        levels[s] = cur
    outs = []
    for sc in sorted(levels, reverse=True):
        rel = f'{a["id"]}@{sc}x.png'
        dst = f'{lib}/{rel}'
        if os.path.exists(dst):
            raise FileExistsError(dst)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        tmp = dst + f'.tmp{os.getpid()}'
        Image.fromarray(levels[sc], 'RGBA').save(tmp, 'PNG', compress_level=6)
        os.replace(tmp, dst)
        outs.append({'path': rel, 'scale': sc, 'size': [int(levels[sc].shape[1]), int(levels[sc].shape[0])], 'bytes_png': os.path.getsize(dst), 'sha256': sha256(dst)})
    return outs


def save_candidate(wd, name, M):
    p = f'{wd}/{name}.png'
    M.save(p + f'.tmp{os.getpid()}', 'PNG', compress_level=3)
    os.replace(p + f'.tmp{os.getpid()}', p)


def cpu_task(a, seed, lib, head, final=False):
    """One figure, one seed. Returns the result record (status 'ok' with the chosen method and its library outputs, or 'fail' with the gates of every candidate tried)."""
    t0 = time.time()
    wd = f'{RW}/{a["id"]}'
    S = a['S']
    res = {'id': a['id'], 'seed': seed, 'status': 'fail', 'candidates': {}}
    try:
        P_img = approved1x(a)
        Tm = today(a)
        kw = Image.open(f'{wd}/klein-s{seed}.png').convert('RGB')
        iou_raw, iou_core = matte_iou(kw, P_img)
        iou = max(iou_raw, iou_core)
        res['iou'] = round(iou, 4)
        res['iou_raw'], res['iou_core'] = round(iou_raw, 4), round(iou_core, 4)
        if iou < GATE['iou'] and not final:
            res['reason'] = 'silhouette moved'
            res['seconds'] = round(time.time() - t0, 1)
            return res
        rgb = Image.open(f'{wd}/rgb-s{seed}.png').convert('RGB')
        face_p = f'{wd}/face-s{seed}.png'
        order = ['C']
        rgb_d = None
        if head and os.path.exists(face_p):
            rgb_d = composite_face(rgb, Image.open(face_p).convert('RGB'), head, S)
            c = clipm()
            et = c.embed(head_window(Tm, head, S))
            cc_, cd_ = c.cos(et, c.embed(head_window(rgb, head, S))), c.cos(et, c.embed(head_window(rgb_d, head, S)))
            sc_, sd_ = head_struct(Tm, rgb, head, S), head_struct(Tm, rgb_d, head, S)
            res['face_pre'] = {'cos_C': round(cc_, 4), 'cos_D': round(cd_, 4), 'struct_C': sc_, 'struct_D': sd_, 'dcos': round(cd_ - cc_, 4), 'dstruct': round(sd_ - sc_, 4)}
            order = ['D', 'C'] if face_rule(cd_ - cc_, sd_ - sc_) else ['C', 'D']
        built = {}
        chosen = None
        for meth in order:
            M = build_master(rgb_d if meth == 'D' else rgb, Tm, P_img, S)
            g = gates(Tm, M, S, iou, head)
            res['candidates'][meth] = g
            built[meth] = M
            if g['pass']:
                chosen = meth
                break
        if chosen:
            res['outputs'] = write_outputs(a, built[chosen], lib)
            res['status'] = 'ok'
            res['method'] = chosen
            res['gates'] = res['candidates'][chosen]
        else:
            for meth, M in built.items():
                save_candidate(wd, f'cand-{meth}-s{seed}', M)
    except Exception as e:  # noqa
        import traceback
        res['status'] = 'error'
        res['error'] = repr(e)
        res['trace'] = traceback.format_exc()[-1500:]
    res['seconds'] = round(time.time() - t0, 1)
    return res
