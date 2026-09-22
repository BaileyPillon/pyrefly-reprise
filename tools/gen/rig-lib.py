"""Shared helpers for the living-portrait v3 art assembly (rig-masks.py,
rig-fill.py, rig-assemble.py). Loaded by path (the file name has a hyphen):

    import importlib.util, pathlib
    spec = importlib.util.spec_from_file_location(
        "riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
    riglib = importlib.util.module_from_spec(spec); spec.loader.exec_module(riglib)

Run everything with ComfyUI's embedded python (numpy + scipy + PIL):
``D:/Tools/ComfyUI/python_embeded/python.exe -s tools/gen/rig-*.py``.

Nothing here writes under ``public/``; every output lives in the prototype's
own ``art/`` folder. The approved painting is only ever read.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra

REPO = Path(__file__).resolve().parents[2]
PROTO = REPO / "docs/concepts/pause-until-dawn/prototype-v2"
ART = PROTO / "art"
V3 = ART / "v3"
PLATE = REPO / "public/art/portraits/yuna-x2.png"
MAGENTA = np.array([255, 0, 255], np.float32)


def rel(p: Path | str) -> str:
    return Path(p).resolve().relative_to(REPO).as_posix()


def load_rgba(path: Path | str) -> np.ndarray:
    """float32 HxWx4 in 0..255 (straight alpha)."""
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)


def save_rgba(arr: np.ndarray, path: Path | str) -> None:
    os.makedirs(Path(path).parent, exist_ok=True)
    Image.fromarray(np.clip(np.rint(arr), 0, 255).astype(np.uint8), "RGBA").save(path)


def save_l(mask: np.ndarray, path: Path | str) -> None:
    os.makedirs(Path(path).parent, exist_ok=True)
    m = mask.astype(np.float32)
    if m.max() <= 1.0:
        m = m * 255
    Image.fromarray(np.clip(np.rint(m), 0, 255).astype(np.uint8), "L").save(path)


def load_l(path: Path | str) -> np.ndarray:
    return np.asarray(Image.open(path).convert("L")).astype(np.float32) / 255.0


def poly_mask(shape, polys, brushes=()) -> np.ndarray:
    """Boolean mask from polygons [[x,y],...] and brushes {"pts":[[x,y]..],"r":n}."""
    h, w = shape
    im = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(im)
    for p in polys:
        d.polygon([tuple(v) for v in p], fill=255)
    for b in brushes:
        pts = [tuple(v) for v in b["pts"]]
        r = b.get("r", 6)
        if len(pts) > 1:
            d.line(pts, fill=255, width=int(2 * r), joint="curve")
        for x, y in pts:
            d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    return np.asarray(im) > 127


def ellipses_mask(shape, ellipses) -> np.ndarray:
    """Boolean mask from [[cx, cy, rx, ry], ...] (curved regions: no straight edge)."""
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w]
    m = np.zeros(shape, bool)
    for cx, cy, rx, ry in ellipses:
        m |= ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1.0
    return m


def disk(r: float) -> np.ndarray:
    k = int(np.ceil(r))
    y, x = np.mgrid[-k:k + 1, -k:k + 1]
    return (x * x + y * y) <= r * r + 1e-6


def dilate(m: np.ndarray, r: float) -> np.ndarray:
    if r <= 0:
        return m.copy()
    return ndi.distance_transform_edt(~m) <= r


def erode(m: np.ndarray, r: float) -> np.ndarray:
    if r <= 0:
        return m.copy()
    return ndi.distance_transform_edt(m) > r


def shift_union(m: np.ndarray, dx: tuple[float, float], dy: tuple[float, float], step: int = 2) -> np.ndarray:
    """Union of m translated by every (dx, dy) in the box envelope (px)."""
    out = np.zeros_like(m)
    xs = sorted(set([int(np.floor(dx[0])), int(np.ceil(dx[1]))] + list(range(int(np.floor(dx[0])), int(np.ceil(dx[1])) + 1, step))))
    ys = sorted(set([int(np.floor(dy[0])), int(np.ceil(dy[1]))] + list(range(int(np.floor(dy[0])), int(np.ceil(dy[1])) + 1, step))))
    h, w = m.shape
    for sx in xs:
        for sy in ys:
            src = m[max(0, -sy):h - max(0, sy), max(0, -sx):w - max(0, sx)]
            out[max(0, sy):max(0, sy) + src.shape[0], max(0, sx):max(0, sx) + src.shape[1]] |= src
    return out


def uncoverable(upper: np.ndarray, env: dict, margin: float = 2.0) -> np.ndarray:
    """Pixels under `upper` (at rest) that some displacement in `env` exposes:
    upper minus the intersection of all its shifted copies (= erosion by the
    reflected envelope). env = {dxMin,dxMax,dyMin,dyMax} in px."""
    dx = (env["dxMin"] - margin, env["dxMax"] + margin)
    dy = (env["dyMin"] - margin, env["dyMax"] + margin)
    # A pixel p stays covered for every shift d iff p-d is in upper for all d,
    # i.e. p is outside the union of the complement shifted by the envelope.
    return upper & shift_union(~upper, dx, dy)


def luminance(rgb: np.ndarray) -> np.ndarray:
    return (rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114) / 255.0


def geodesic_labels(rgba: np.ndarray, seeds: np.ndarray, domain: np.ndarray,
                    ink_weight: float = 40.0, grad_weight: float = 25.0) -> np.ndarray:
    """Multi-source geodesic assignment. seeds: int array, -1 = unknown, k>=0
    = class. Edge cost grows across dark ink lines and colour edges, so the
    boundary between two classes snaps to the painting's own linework instead
    of to a hand-drawn line. Returns int labels (-1 outside the domain)."""
    h, w = domain.shape
    rgb = rgba[..., :3] / 255.0
    lum = luminance(rgba[..., :3])
    ink = np.clip((0.32 - lum) / 0.18, 0, 1)
    idx = np.full((h, w), -1, np.int64)
    idx[domain] = np.arange(domain.sum())
    rows, cols, vals = [], [], []
    for oy, ox, base in ((0, 1, 1.0), (1, 0, 1.0), (1, 1, 1.4142), (1, -1, 1.4142)):
        ys = slice(0, h - oy)
        xa = slice(max(0, -ox), w - max(0, ox))
        xb = slice(max(0, ox), w - max(0, -ox) if ox < 0 else w)
        a = idx[ys, xa]
        b = idx[oy:, xb][: a.shape[0], : a.shape[1]]
        ok = (a >= 0) & (b >= 0)
        ra = rgb[ys, xa][: a.shape[0], : a.shape[1]]
        rb = rgb[oy:, xb][: a.shape[0], : a.shape[1]]
        ia = ink[ys, xa][: a.shape[0], : a.shape[1]]
        ib = ink[oy:, xb][: a.shape[0], : a.shape[1]]
        g = np.sqrt(((ra - rb) ** 2).sum(-1))
        c = base * (1.0 + ink_weight * np.maximum(ia, ib) ** 2 + grad_weight * g)
        rows.append(a[ok]); cols.append(b[ok]); vals.append(c[ok])
    r = np.concatenate(rows); c = np.concatenate(cols); v = np.concatenate(vals)
    n = int(domain.sum())
    g = coo_matrix((np.concatenate([v, v]), (np.concatenate([r, c]), np.concatenate([c, r]))), shape=(n, n)).tocsr()
    seed_flat = seeds[domain]
    src = np.nonzero(seed_flat >= 0)[0]
    _, _, sources = dijkstra(g, directed=False, indices=src, min_only=True, return_predecessors=True)
    lab_flat = np.where(sources >= 0, seed_flat[np.clip(sources, 0, n - 1)], -1)
    out = np.full((h, w), -1, np.int64)
    out[domain] = lab_flat
    return out


def push_pull_fill(rgb: np.ndarray, known: np.ndarray) -> np.ndarray:
    """Fill unknown pixels smoothly from known ones (pyramid push-pull)."""
    rgb = rgb.astype(np.float32)
    wgt = known.astype(np.float32)
    levels = []
    c, wt = rgb * wgt[..., None], wgt
    while min(wt.shape) > 2:
        levels.append((c, wt))
        h, w = wt.shape
        h2, w2 = (h + 1) // 2, (w + 1) // 2
        cp = np.zeros((h2 * 2, w2 * 2, 3), np.float32); cp[:h, :w] = c
        wp = np.zeros((h2 * 2, w2 * 2), np.float32); wp[:h, :w] = wt
        c = cp.reshape(h2, 2, w2, 2, 3).sum((1, 3))
        wt = wp.reshape(h2, 2, w2, 2).sum((1, 3))
    col = c / np.maximum(wt, 1e-6)[..., None]
    for c_l, w_l in reversed(levels):
        h, w = w_l.shape
        up = np.repeat(np.repeat(col, 2, 0), 2, 1)[:h, :w]
        up = ndi.uniform_filter(up, size=(3, 3, 1), mode="nearest")
        a = np.clip(w_l, 0, 1)[..., None]
        col = np.where(w_l[..., None] > 0, c_l / np.maximum(w_l, 1e-6)[..., None], up) * a + up * (1 - a)
    out = rgb.copy()
    out[~known] = col[~known]
    return out


def over(dst: np.ndarray, layer: np.ndarray, x: int = 0, y: int = 0) -> np.ndarray:
    """Straight-alpha 'over' of a float RGBA layer onto a float RGBA canvas, in place."""
    h, w = layer.shape[:2]
    H, W = dst.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x1 <= x0 or y1 <= y0:
        return dst
    L = layer[y0 - y:y1 - y, x0 - x:x1 - x]
    D = dst[y0:y1, x0:x1]
    la = L[..., 3:4] / 255.0
    da = D[..., 3:4] / 255.0
    oa = la + da * (1 - la)
    oc = (L[..., :3] * la + D[..., :3] * da * (1 - la)) / np.maximum(oa, 1e-9)
    D[..., :3] = np.where(oa > 0, oc, 0)
    D[..., 3:4] = oa * 255.0
    return dst


def on_magenta(rgba: np.ndarray) -> np.ndarray:
    a = rgba[..., 3:4] / 255.0
    return rgba[..., :3] * a + MAGENTA * (1 - a)


def write_json(obj, path: Path | str) -> None:
    os.makedirs(Path(path).parent, exist_ok=True)
    Path(path).write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")


def read_json(path: Path | str):
    return json.loads(Path(path).read_text(encoding="utf-8"))
