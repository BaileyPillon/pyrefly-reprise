"""Living portrait v5.1 (game case: both; the rigged plate is Yuna X-2): the shared core of the key chain.

Split out of the pilot's 476-line rig-chain.py (shots/v5-pilot/tools) so every file stays under 400 lines:
  chain_core.py   canvas I/O, the pair meshes, the step maps (this file)
  chain_face.py   the neck layer (ghost-jaw fix), the hair under the tassel, the expression patches, the tassel anchor
  chain_grow.py   propagate / merge / pick, one 10-degree step at a time, patches pushed with the key
  chain_rig.py    the rig.json for the prototype (keys -40..+40, lids + mouths + brows per key)

v5.1 changes to the pilot's core: the chain runs to +-40 (the v4.1 pairs v4-r20|v4-r40 and v4-l40|v4-l20 are the
pose guides for the second 20 degrees), and the guide low-pass keeps the SOURCE side of each pair fixed (lower yaw on
the right, higher on the left; the pilot's rule only knew the two pairs that touch the plate).
"""
from __future__ import annotations

import json
import pathlib

import cv2
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve()
PROTO = HERE.parents[3]
ART = PROTO / "art"
RIG = ART / "rig.json"
WORK = pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v51")
W, H = 832, 1216
FB_TOL = 2.5
STRETCH = (0.7, 1.3)
GROW, FEATHER = 8, 6
IRIS_TRAVEL_X = 11.0  # src/motion.ts IRIS_TRAVEL_PX[0], at yawNorm 1 = 85 degrees (the v4.1 range)
SIGMA = 64.0  # px: the pilot's guide low-pass (its work dir s64)
# side -> steps (from deg, to deg, pair file, g of the source key, g of the new key) on the v4.1 pair meshes
STEPS = {
    "r": [(0, 10, "frontal__v4-r20", 0.0, 0.5), (10, 20, "frontal__v4-r20", 0.5, 1.0),
          (20, 30, "v4-r20__v4-r40", 0.0, 0.5), (30, 40, "v4-r20__v4-r40", 0.5, 1.0)],
    "l": [(0, 10, "v4-l20__frontal", 1.0, 0.5), (10, 20, "v4-l20__frontal", 0.5, 0.0),
          (20, 30, "v4-l40__v4-l20", 1.0, 0.5), (30, 40, "v4-l40__v4-l20", 0.5, 0.0)],
}


def step_of(side, to):
    return next(s for s in STEPS[side] if s[1] == to)


def kid(side, deg):
    return "frontal" if deg == 0 else f"v5-{side}{deg}"


def rgba(path):
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)


def save(path, img):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(img + 0.5, 0, 255).astype(np.uint8)).save(path)


def over(dst, src):
    """Straight-alpha src over dst (both canvas RGBA float 0..255), in place."""
    a = src[..., 3:4] / 255.0
    da = dst[..., 3:4] / 255.0
    oa = a + da * (1 - a)
    rgb = (src[..., :3] * a + dst[..., :3] * da * (1 - a)) / np.maximum(oa, 1e-6)
    dst[..., :3] = np.where(oa > 0, rgb, 0)
    dst[..., 3:4] = oa * 255


def unpremul(pm):
    out = pm.copy()
    a = np.maximum(pm[..., 3:4], 1e-6) / 255.0
    out[..., :3] = np.where(pm[..., 3:4] > 1e-3, pm[..., :3] / a, 0)
    return out


def placed(path, box, dx=0.0, dy=0.0):
    """A trimmed layer on the canvas at its box (+ a sub-pixel shift), premultiplied-safe."""
    im = rgba(path)
    pm = im.copy()
    pm[..., :3] *= im[..., 3:4] / 255.0
    M = np.float32([[1, 0, box[0] + dx], [0, 1, box[1] + dy]])
    out = cv2.warpAffine(pm, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return unpremul(out)


def trim(img):
    ys, xs = np.nonzero(img[..., 3] > 0)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    return img[y0:y1, x0:x1], [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def white(c):
    return c[..., :3] * (c[..., 3:4] / 255) + 255 * (1 - c[..., 3:4] / 255)


def load_rig():
    return json.loads(RIG.read_text(encoding="utf-8"))


def load_pair(tag, side, sigma=SIGMA):
    """PA (lower-yaw key texels), PB (higher), headW of a v4.1 pair. sigma > 0: the pair's displacement is low-passed
    and the SOURCE key's texels are kept (the dense residual registers two different paintings strand by strand;
    pushed through one painting it wobbles the strands: the pilot's first look), with rig-flow's frame rule."""
    meta = load_rig()["artMeta"]["v4"]["flow"]
    nx, ny, step = meta["nx"], meta["ny"], meta["step"]
    d = np.fromfile(ART / "v4/flow" / f"{tag}.bin", "<f4").reshape(ny, nx, 5).astype(np.float64)
    PA, PB = d[..., 0:2], d[..., 2:4]
    if sigma > 0:
        dsp = PB - PA
        sm = np.dstack([cv2.GaussianBlur(dsp[..., c].astype(np.float32), (0, 0), sigma / step, borderType=cv2.BORDER_REFLECT) for c in range(2)])
        band = 96.0
        sst = lambda e: (lambda c: c * c * (3 - 2 * c))(np.clip(e / band, 0, 1))
        src = PA if side == "r" else PB
        kx, ky = sst(np.minimum(src[..., 0], W - src[..., 0])), sst(src[..., 1])
        sm = sm * np.dstack([kx, ky])
        if side == "r":
            PB = PA + sm
        else:
            PA = PB - sm
    return PA, PB, d[..., 4], nx, ny


def tris(nx, ny):
    i = (np.arange(ny - 1)[:, None] * nx + np.arange(nx - 1)[None, :]).ravel()
    return np.vstack([np.c_[i, i + 1, i + nx], np.c_[i + 1, i + nx + 1, i + nx]])


def raster(P, vals, T, K=24):
    """Rasterize triangles T with vertex positions P (N, 2) and per-vertex values vals (N, C), linear inside.
    Returns field (H, W, C) and a coverage mask. Triangles wider than K px go through a slower pass."""
    C = vals.shape[1]
    field = np.zeros((H, W, C), np.float64)
    cov = np.zeros((H, W), bool)
    p0, p1, p2 = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
    x0 = np.floor(np.minimum.reduce([p0[:, 0], p1[:, 0], p2[:, 0]])).astype(int)
    y0 = np.floor(np.minimum.reduce([p0[:, 1], p1[:, 1], p2[:, 1]])).astype(int)
    x1 = np.ceil(np.maximum.reduce([p0[:, 0], p1[:, 0], p2[:, 0]])).astype(int)
    y1 = np.ceil(np.maximum.reduce([p0[:, 1], p1[:, 1], p2[:, 1]])).astype(int)
    d = (p1[:, 1] - p2[:, 1]) * (p0[:, 0] - p2[:, 0]) + (p2[:, 0] - p1[:, 0]) * (p0[:, 1] - p2[:, 1])
    ok = np.abs(d) > 1e-9
    size = np.maximum(x1 - x0, y1 - y0) + 1
    for sel, k in ((ok & (size <= K), K), (ok & (size > K), int(size[ok].max()) if ok.any() else K)):
        idx = np.nonzero(sel)[0]
        chunk = max(1, 1_000_000 // (k * k))
        for c0 in range(0, len(idx), chunk):
            t = idx[c0:c0 + chunk]
            oy, ox = np.mgrid[0:k, 0:k]
            px = x0[t, None] + ox.ravel()[None, :]
            py = y0[t, None] + oy.ravel()[None, :]
            xx, yy = px + 0.0, py + 0.0
            a, b, c = p0[t], p1[t], p2[t]
            u = ((b[:, 1] - c[:, 1])[:, None] * (xx - c[:, 0][:, None]) + (c[:, 0] - b[:, 0])[:, None] * (yy - c[:, 1][:, None])) / d[t][:, None]
            v = ((c[:, 1] - a[:, 1])[:, None] * (xx - c[:, 0][:, None]) + (a[:, 0] - c[:, 0])[:, None] * (yy - c[:, 1][:, None])) / d[t][:, None]
            w = 1 - u - v
            inside = (u >= -1e-7) & (v >= -1e-7) & (w >= -1e-7) & (px >= 0) & (px < W) & (py >= 0) & (py < H)
            ti, pi = np.nonzero(inside)
            tt = t[ti]
            val = (u[ti, pi, None] * vals[T[tt, 0]] + v[ti, pi, None] * vals[T[tt, 1]] + w[ti, pi, None] * vals[T[tt, 2]])
            field[py[ti, pi], px[ti, pi]] = val
            cov[py[ti, pi], px[ti, pi]] = True
    return field, cov


def tri_area(P, T):
    a, b, c = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
    return 0.5 * ((b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0]))


_MAPS = {}


def step_map(side, to):
    """The step into key `to`: backward (dst pixel -> src texel, + area scale), forward (src pixel -> dst), coverage."""
    _, _, tag, g0, g1 = step_of(side, to)
    return mesh_map(side, tag, g0, g1)


def mesh_map(side, tag, g0, g1):
    """Maps that move a picture posed at g0 of a pair to g1 (backward + area scale, forward, coverage)."""
    if (side, tag, g0, g1) in _MAPS:
        return _MAPS[(side, tag, g0, g1)]
    PA, PB, _, nx, ny = load_pair(tag, side)
    S = (PA + g0 * (PB - PA)).reshape(-1, 2)
    D = (PA + g1 * (PB - PA)).reshape(-1, 2)
    T = tris(nx, ny)
    aS = tri_area(S, T)
    det = tri_area(D, T) / np.where(np.abs(aS) < 1e-9, 1e-9, aS)
    acc = np.zeros(len(S))
    cnt = np.zeros(len(S))
    for j in range(3):
        np.add.at(acc, T[:, j], det)
        np.add.at(cnt, T[:, j], 1)
    back, cov = raster(D, np.c_[S, acc / np.maximum(cnt, 1)], T)
    fwd, _ = raster(S, D, T)
    _MAPS[(side, tag, g0, g1)] = (back, fwd, cov)
    return back, fwd, cov


def remap(img, bmap):
    """Pull `img` (canvas, RGBA premultiplied-safe, or a single channel) through a backward map."""
    mx, my = bmap[..., 0].astype(np.float32), bmap[..., 1].astype(np.float32)
    if img.ndim == 2 or img.shape[2] != 4:
        return cv2.remap(img.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    pm = img.copy()
    pm[..., :3] *= img[..., 3:4] / 255.0
    out = cv2.remap(pm.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return unpremul(out)


def points_step(side, to, pts):
    """Points of the source key carried into key `to` by the step's own mesh."""
    _, fwd, _ = step_map(side, to)
    p = np.clip(np.asarray(pts, np.float64), 0, [W - 1, H - 1])
    return [[float(cv2.getRectSubPix(fwd[..., c].astype(np.float32), (1, 1), (float(x), float(y)))[0, 0]) for c in range(2)] for x, y in p]


def pair_positions(side, to):
    """Grid positions (lower-yaw key, higher-yaw key) of the runtime pair that ends at key `to` (for the rig)."""
    _, _, tag, g0, g1 = step_of(side, to)
    PA, PB, HW, _, _ = load_pair(tag, side)
    ga, gb = (g0, g1) if side == "r" else (g1, g0)
    return PA + ga * (PB - PA), PA + gb * (PB - PA), HW


def keydir(k):
    return WORK / "keys" / k
