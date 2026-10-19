"""Meshes, skin weights, chains and rim masks of the rig pipeline (split from rig_geom.py to stay under 400 lines). Pure numpy/scipy/skimage; no retail asset, no generative model."""
from __future__ import annotations

import math

import numpy as np
from scipy import ndimage as ndi
from scipy.spatial import Delaunay
from skimage import measure, morphology

from rig_geom import grow, shrink

# --------------------------------------------------------------------------- meshes


def mask_contours(m: np.ndarray, tol: float = 2.0):
    """Sub-pixel contours of a mask (list of (N,2) arrays of (x,y)), simplified with Douglas-Peucker at `tol` px."""
    pad = np.pad(m.astype(np.float32), 1)
    cs = measure.find_contours(pad, 0.5)
    out = []
    for c in cs:
        c = c[:, ::-1] - 1.0  # (row, col) -> (x, y), undo padding
        if len(c) < 6:
            continue
        c = measure.approximate_polygon(c, tol)
        if len(c) >= 4:
            out.append(c)
    return out


def resample_polyline(pts: np.ndarray, step: float) -> np.ndarray:
    """Points along a closed polyline at ~`step` spacing (the original corners are kept)."""
    out = []
    n = len(pts)
    for i in range(n - 1):
        a, b = pts[i], pts[i + 1]
        seg = float(np.hypot(*(b - a)))
        k = max(1, int(math.ceil(seg / step)))
        for j in range(k):
            out.append(a + (b - a) * (j / k))
    return np.array(out)


def build_mesh(mask: np.ndarray, edge_step: float = 20.0, inner_step: float = 38.0, domain_grow: int = 16, seed: int = 1):
    """A triangle mesh covering `mask` and a margin of `domain_grow` px around it (the texture's own alpha makes the shape, so thin strands of hair and
    fur are never cut off by a tight mesh). Vertices: the simplified contours of the grown domain resampled every `edge_step` px plus a jittered hex grid
    inside every `inner_step` px. A triangle is kept when its centroid lies in the domain. Returns (verts (N,2) float, tris (M,3) int)."""
    rng = np.random.default_rng(seed)
    dom = grow(mask, domain_grow) if domain_grow > 0 else mask
    dom = ndi.binary_fill_holes(shrink(grow(dom, 6), 6))  # close pin-gaps between strands
    pts = []
    for c in mask_contours(dom, 2.5):
        pts.append(resample_polyline(c, edge_step))
    if not pts:
        raise ValueError("empty mask")
    edge = np.vstack(pts)
    h, w = dom.shape
    ys, xs = np.nonzero(dom)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    depth = ndi.distance_transform_edt(dom)
    inner = []
    row = 0
    for y in np.arange(y0, y1 + inner_step, inner_step * 0.866):
        off = (inner_step / 2) if (row % 2) else 0.0
        for x in np.arange(x0 + off, x1 + inner_step, inner_step):
            jx, jy = rng.uniform(-0.18, 0.18, 2) * inner_step
            px, py = x + jx, y + jy
            ix, iy = int(round(px)), int(round(py))
            if 0 <= ix < w and 0 <= iy < h and depth[iy, ix] > edge_step * 0.6:
                inner.append((px, py))
        row += 1
    P = np.vstack([edge, np.array(inner)]) if inner else edge
    tri = Delaunay(P)
    keep = []
    for t in tri.simplices:
        a_, b_, c_ = P[t[0]], P[t[1]], P[t[2]]
        cen = (a_ + b_ + c_) / 3.0
        qx, qy = int(round(cen[0])), int(round(cen[1]))
        if 0 <= qx < w and 0 <= qy < h and dom[qy, qx]:
            area = abs((b_[0] - a_[0]) * (c_[1] - a_[1]) - (c_[0] - a_[0]) * (b_[1] - a_[1])) / 2
            if area > 0.5:
                keep.append(t)
    return P, np.array(keep, dtype=np.int32)


def grid_mesh(box_wh, nx: int = 4, ny: int = 8):
    """A plain quad grid over a w x h crop (rigid props: the texture's alpha is the shape)."""
    w, h = box_wh
    xs = np.linspace(0, w, nx + 1)
    ys = np.linspace(0, h, ny + 1)
    P = np.array([(x, y) for y in ys for x in xs], np.float64)
    T = []
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            b = a + 1
            c = a + nx + 1
            d = c + 1
            T += [[a, b, c], [b, d, c]]
    return P, np.array(T, np.int32)


def chain_weights(verts: np.ndarray, chain: list[list[float]], ramp: float | list[float]):
    """Skin weights along a bone chain. `chain` = joint positions [[x,y], ...] of k+1 joints (bone i runs joint i -> i+1); the vertex's
    position along the chain polyline picks the bone, and across each inner joint the weight ramps over +-ramp px (smoothstep).
    Returns a list of (bone_index, weight) pairs per vertex (at most 2)."""
    J = np.array(chain, dtype=np.float64)
    seg = J[1:] - J[:-1]
    seglen = np.hypot(seg[:, 0], seg[:, 1])
    cum = np.concatenate([[0], np.cumsum(seglen)])
    k = len(seg)
    ramps = ramp if isinstance(ramp, (list, tuple)) else [ramp] * max(0, k - 1)
    out = []
    for v in verts:
        # nearest point on the polyline -> parameter s
        best_s, best_d = 0.0, 1e18
        for i in range(k):
            d = seg[i]
            L2 = float(d @ d)
            t = 0.0 if L2 <= 0 else float(np.clip(((v - J[i]) @ d) / L2, 0, 1))
            p = J[i] + t * d
            dist = float(np.hypot(*(v - p)))
            if dist < best_d:
                best_d, best_s = dist, cum[i] + t * seglen[i]
        if k == 1:
            out.append([(0, 1.0)])
            continue
        # g_j = share of the vertex that belongs to bones >= j (a smoothstep across joint j, +-ramp), so bone i's weight is g_i - g_(i+1)
        g = [1.0] + [0.0] * k
        for j in range(1, k):
            r = max(1e-6, ramps[j - 1])
            tt = float(np.clip((best_s - (cum[j] - r)) / (2 * r), 0, 1))
            g[j] = tt * tt * (3 - 2 * tt)
        w = np.array([max(0.0, g[i] - g[i + 1]) for i in range(k)])
        w = w / max(1e-9, w.sum())
        pairs = [(int(i), float(w[i])) for i in np.argsort(-w)[:2] if w[i] > 1e-4]
        s2 = sum(p[1] for p in pairs)
        out.append([(i, wt / s2) for i, wt in pairs])
    return out




# --------------------------------------------------------------------------- chains and rims


def centerline_chain(mask: np.ndarray, start_xy, n_bones: int, scale: int = 2, smooth: int = 9):
    """The medial path of a mask from the skeleton point nearest `start_xy` (x, y in mask px) to the geodesically farthest tip,
    smoothed and resampled to n_bones + 1 equally spaced points ((x, y) in mask px)."""
    sm = mask[::scale, ::scale]
    sk = morphology.skeletonize(sm)
    ys, xs = np.nonzero(sk)
    if len(xs) == 0:
        raise ValueError("empty skeleton")
    pts = {(int(y), int(x)) for y, x in zip(ys, xs)}
    sx, sy = start_xy[0] / scale, start_xy[1] / scale
    start = min(pts, key=lambda p: (p[1] - sx) ** 2 + (p[0] - sy) ** 2)

    def bfs(src):
        dist = {src: 0}
        prev = {}
        q = [src]
        qi = 0
        while qi < len(q):
            cur = q[qi]
            qi += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dy == 0 and dx == 0:
                        continue
                    nb = (cur[0] + dy, cur[1] + dx)
                    if nb in pts and nb not in dist:
                        dist[nb] = dist[cur] + (1.4142 if dy and dx else 1.0)
                        prev[nb] = cur
                        q.append(nb)
        far = max(dist, key=dist.get)
        return far, prev

    far, prev = bfs(start)
    path = [far]
    while path[-1] != start:
        path.append(prev[path[-1]])
    path = path[::-1]
    P = np.array([[x * scale + scale / 2, y * scale + scale / 2] for y, x in path], np.float64)
    if len(P) > smooth:
        k = np.ones(smooth) / smooth
        pad = smooth // 2
        Pp = np.vstack([np.repeat(P[:1], pad, 0), P, np.repeat(P[-1:], pad, 0)])
        P = np.stack([np.convolve(Pp[:, 0], k, "valid"), np.convolve(Pp[:, 1], k, "valid")], 1)
    seg = np.hypot(*(P[1:] - P[:-1]).T)
    cum = np.concatenate([[0], np.cumsum(seg)])
    ts = np.linspace(0, cum[-1], n_bones + 1)
    return np.stack([np.interp(ts, cum, P[:, 0]), np.interp(ts, cum, P[:, 1])], 1)


def outer_edge_mask(alpha_full: np.ndarray, reach: float = 12.0, inner: float = 2.0) -> np.ndarray:
    """1 within `inner` px of the painting's OUTER silhouette, fading to 0 at `reach` px: the rim light may only run along the painting's own outline,
    never along the cut between two parts."""
    solid = alpha_full > 24
    d = ndi.distance_transform_edt(solid)
    return np.clip(1.0 - (d - inner) / (reach - inner), 0.0, 1.0)


def seg_dist(shape_hw, p0, p1):
    """Distance of every pixel to the segment p0-p1 (x, y)."""
    h, w = shape_hw
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    p0 = np.array(p0, np.float32)
    p1 = np.array(p1, np.float32)
    d = p1 - p0
    L2 = float(d @ d)
    t = np.clip(((xx - p0[0]) * d[0] + (yy - p0[1]) * d[1]) / max(L2, 1e-9), 0, 1)
    return np.hypot(xx - (p0[0] + t * d[0]), yy - (p0[1] + t * d[1]))
