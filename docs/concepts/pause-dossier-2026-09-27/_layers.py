"""Split a real pause capture into (painting model, text layer) so the text blocks can be
moved onto a re-framed painting for the option frames.

No browser, no engine: reads the checker's existing base (= live) captures and their JSON
(plate rect, face box), and the shipped plate master from public/art (local only).

  painting model  B = G * P   P = the master placed at the captured plate rect,
                              G = a smooth per-pixel gain (the falloff, vignette, tint),
                              fitted as a robust local ratio C / P with the text ignored.
  text layer      each pixel is paper (244,241,232) or gold (#e3b94a) at alpha a, solved
                  from C = a*ink + (1-a)*B; the snapshot thumbnails are copied opaque.
"""
import json
import numpy as np
from PIL import Image, ImageFilter

ROOT = 'D:/Final Fantasy'
CHECK = 'D:/pyrefly-t1-b3b/docs/screenshots/t1-b3b-recheck/base'
PAPER = np.array([244, 241, 232], np.float32)
GOLD = np.array([227, 185, 74], np.float32)
VOID = np.array([4, 4, 10], np.float32)

CASES = {
    ('ch2', 1600): ('pause-chapter-yunalesca-1600x900-battle.jpg', 'pausechapter-1600x900-yunalesca_yojimbo-cavern.json', 'yunalesca'),
    ('ch2', 2000): ('pause-chapter-yunalesca-2000x1012-battle.jpg', 'pausechapter-2000x1012-yunalesca_yojimbo-cavern.json', 'yunalesca'),
    ('ch9', 1600): ('pause-chapter-yojimbo-cavern-1600x900-battle.jpg', 'pausechapter-1600x900-yunalesca_yojimbo-cavern.json', 'yojimbo-cavern'),
    ('ch9', 2000): ('pause-chapter-yojimbo-cavern-2000x1012-battle.jpg', 'pausechapter-2000x1012-yunalesca_yojimbo-cavern.json', 'yojimbo-cavern'),
}


def state_for(case):
    img, js, cid = CASES[case]
    data = json.load(open(f'{CHECK}/{js}', encoding='utf8'))
    for e in data:
        if e['id'] == cid:
            for s in e['states']:
                if s.get('tag') == 'battle':
                    return f'{CHECK}/{img}', s
    raise KeyError(case)


_masters = {}


def master(plate_id):
    if plate_id not in _masters:
        _masters[plate_id] = Image.open(f'{ROOT}/public/art/pause/{plate_id}.2x.webp').convert('RGB')
    return _masters[plate_id]


def place(plate_id, rect, size, feather_void=False):
    """The master scaled into rect = (left, top, right, bottom) on a void page."""
    w, h = size
    l, t, r, b = rect
    pw, ph = int(round(r - l)), int(round(b - t))
    m = master(plate_id).resize((pw, ph), Image.LANCZOS)
    page = Image.new('RGB', size, tuple(int(v) for v in VOID))
    page.paste(m, (int(round(l)), int(round(t))))
    arr = np.asarray(page, np.float32)
    if feather_void:
        # the slide rule's mask: the plate's own edge feathers into the page (80 px)
        cov = np.zeros((h, w), np.float32)
        x0, x1 = max(0, int(round(l))), min(w, int(round(r)))
        y0, y1 = max(0, int(round(t))), min(h, int(round(b)))
        cov[y0:y1, x0:x1] = 1
        xs = np.arange(w, dtype=np.float32)
        ramp = np.ones(w, np.float32)
        F = 80.0
        if l > 0:
            ramp *= np.clip((xs - l) / F, 0, 1)
        if r < w:
            ramp *= np.clip((r - xs) / F, 0, 1)
        cov *= ramp[None, :]
        arr = arr * cov[..., None] + VOID[None, None, :] * (1 - cov[..., None])
    return arr


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def gain_map(C, P):
    """Robust smooth per-channel gain: median of C/P over big windows (thin text ignored)."""
    h, w = C.shape[:2]
    out = np.zeros_like(C)
    small = (w // 8, h // 8)
    for ch in range(3):
        ratio = (C[..., ch] + 2) / (P[..., ch] + 6)
        ratio = np.clip(ratio, 0, 1.6)
        im = Image.fromarray((ratio * 150).astype(np.uint8)).resize(small, Image.BILINEAR)
        im = im.filter(ImageFilter.MedianFilter(9)).filter(ImageFilter.MedianFilter(5))
        im = im.filter(ImageFilter.GaussianBlur(3)).resize((w, h), Image.BICUBIC)
        out[..., ch] = np.asarray(im, np.float32) / 150
    return out


def split(case):
    path, s = state_for(case)
    C = np.asarray(Image.open(path).convert('RGB'), np.float32)
    h, w = C.shape[:2]
    P = place(s['plateId'], s['plateRect'], (w, h))
    G = gain_map(C, P)
    B = np.clip(G * P, 0, 255)
    # second pass: a smooth additive residual (tint / grain), text ignored by the median
    for ch in range(3):
        r = np.clip(C[..., ch] - B[..., ch] + 64, 0, 255).astype(np.uint8)
        im = Image.fromarray(r).resize((w // 8, h // 8), Image.BILINEAR)
        im = im.filter(ImageFilter.MedianFilter(9)).filter(ImageFilter.GaussianBlur(2)).resize((w, h), Image.BICUBIC)
        B[..., ch] = np.clip(B[..., ch] + np.asarray(im, np.float32) - 64, 0, 255)
    L_resid = True
    # alpha against paper and against gold; keep the ink that explains the pixel best
    best_a = np.zeros((h, w), np.float32)
    best_ink = np.zeros((h, w, 3), np.float32)
    best_res = np.full((h, w), 1e9, np.float32)
    for ink in (PAPER, GOLD):
        d = ink[None, None, :] - B
        a = ((C - B) * d).sum(-1) / np.maximum((d * d).sum(-1), 1)
        a = np.clip(a, 0, 1)
        res = ((C - (a[..., None] * ink + (1 - a[..., None]) * B)) ** 2).sum(-1)
        better = res < best_res
        best_res = np.where(better, res, best_res)
        best_a = np.where(better, a, best_a)
        best_ink = np.where(better[..., None], ink[None, None, :], best_ink)
    # quiet the painting noise the model did not explain
    # (the dim brand line at the top keeps a lower floor)
    floor = np.full((h, 1), 0.14, np.float32)
    floor[: int(h * 0.06)] = 0.05
    best_a = np.where(best_a < floor, 0, best_a)
    return dict(C=C, P=P, G=G, B=B, R=B - np.clip(G * P, 0, 255), a=best_a, ink=best_ink, state=s, size=(w, h))


if __name__ == '__main__':
    import sys
    case = (sys.argv[1], int(sys.argv[2]))
    L = split(case)
    out = 'D:/Tools/pyrefly-scratch/pause-dossier'
    Image.fromarray(L['B'].astype(np.uint8)).save(f'{out}/model-{case[0]}-{case[1]}.jpg', quality=85)
    T = L['a'][..., None] * L['ink'] + (1 - L['a'][..., None]) * VOID
    Image.fromarray(T.astype(np.uint8)).save(f'{out}/text-{case[0]}-{case[1]}.jpg', quality=85)


# ------------------------------------------------------------------ the CSS grade, analytically
def _radial(w, h, cx, cy, rx, ry):
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    return np.sqrt(((xs - cx) / rx) ** 2 + ((ys - cy) / ry) ** 2)


def _ramp(t, stops):
    """Piecewise-linear alpha over t from [(pos, alpha), ...]."""
    ps = [p for p, _ in stops]
    al = [a for _, a in stops]
    return np.interp(t, ps, al).astype(np.float32)


def grade(raw, mirror=False):
    """pause-screen.css: plate filter, tint (multiply + gold screen), falloff, vignette.
    `raw` is the unfiltered plate placed on the page (void where there is no plate)."""
    h, w = raw.shape[:2]
    s = 0.58
    M = np.array([[0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
                  [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
                  [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s]], np.float32)
    v = np.clip(raw @ M.T, 0, 255)
    v = np.clip(v * 1.05 + (0.5 - 0.5 * 1.05) * 255, 0, 255)
    v = v * 0.66
    # tint: multiply #120d14 at 0.54
    tint = np.array([0x12, 0x0d, 0x14], np.float32) / 255
    v = v * (1 - 0.54) + v * tint * 0.54
    # tint::after: screen, gold radial 0.17 at 60% 40%, radii 74% 58%, clear by 72%
    d = _radial(w, h, 0.6 * w, 0.4 * h, 0.74 * w, 0.58 * h)
    ga = _ramp(d, [(0, 0.17), (0.72, 0), (10, 0)])[..., None]
    gold = np.array([227, 185, 74], np.float32)
    scr = 255 - (255 - v) * (255 - gold) / 255
    v = v * (1 - ga) + scr * ga
    # falloff
    xs = np.arange(w, dtype=np.float32) / w
    ys = np.arange(h, dtype=np.float32) / h
    side = _ramp(xs, [(0, 0.94), (0.22, 0.88), (0.42, 0.5), (0.62, 0.06), (0.74, 0), (1, 0)])
    far = _ramp(1 - xs, [(0, 0.72), (0.18, 0), (1, 0)])
    if mirror:
        side, far = side[::-1], far[::-1]
    top = _ramp(ys, [(0, 0.72), (0.16, 0), (1, 0)])
    bot = _ramp(1 - ys, [(0, 0.8), (0.26, 0), (1, 0)])
    for a in (side[None, :].repeat(h, 0), far[None, :].repeat(h, 0), top[:, None].repeat(w, 1), bot[:, None].repeat(w, 1)):
        a = a[..., None]
        v = v * (1 - a) + VOID * a
    # vignette: radial 120% 90% at 58% 40%, clear to 38%, 0.72 at 100%
    d = _radial(w, h, 0.58 * w, 0.4 * h, 1.2 * w, 0.9 * h)
    va = _ramp(d, [(0, 0), (0.38, 0), (1, 0.72), (10, 0.72)])[..., None]
    v = v * (1 - va) + VOID * va
    # calibration: the browser's result is darker than this arithmetic by a steady
    # per-channel factor, fitted on the text-free pixels of all four captures
    # (0.843 to 0.863 red, 0.863 to 0.875 green, 0.969 to 0.974 blue)
    return v * np.array([0.855, 0.87, 0.97], np.float32)
