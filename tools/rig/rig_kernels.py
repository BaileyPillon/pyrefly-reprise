"""The numba kernels of the rig fitter: skin matrices, skinned vertices, the silhouette rasteriser, coverage, smoothing, overlap and chamfer distance.

The maths is the runtime's (`src/engine/rig/RigSkeleton.ts`) and the Node gate's (`tools/rig/rig-pose.mjs`): a bone's pose is a rotation about its own joint (clockwise on screen, y down), a scale
and an offset, applied after its parent's; skinning is linear blend, at most two bones a vertex. Angles are RADIANS, as in the rig file's keys.
The rasteriser draws a part's texture alpha through its triangles (nearest texel, 2x2 supersampling). It is NOT the gate's: the gate re-reads every key with its own code (tools/rig/rig-raster.mjs).
"""
from __future__ import annotations

import math

import numpy as np
from numba import njit


@njit(cache=True)
def solve(parent, jx, jy, bx, by, rot, ox, oy, sx, sy, root, k):
    """Skin matrices `k` (nb x 6): bind point -> posed place. `root` = [dx, dy, rot] applied to every parentless bone."""
    nb = parent.shape[0]
    m = np.zeros((nb, 6))
    for i in range(nb):
        r = rot[i]
        dx = ox[i]
        dy = oy[i]
        if parent[i] < 0:
            r += root[2]
            dx += root[0]
            dy += root[1]
        c = math.cos(r)
        s = math.sin(r)
        la = c * sx[i]
        lb = s * sx[i]
        lc = -s * sy[i]
        ld = c * sy[i]
        le = bx[i] + dx
        lf = by[i] + dy
        p = parent[i]
        if p >= 0:
            m[i, 0] = m[p, 0] * la + m[p, 2] * lb
            m[i, 1] = m[p, 1] * la + m[p, 3] * lb
            m[i, 2] = m[p, 0] * lc + m[p, 2] * ld
            m[i, 3] = m[p, 1] * lc + m[p, 3] * ld
            m[i, 4] = m[p, 0] * le + m[p, 2] * lf + m[p, 4]
            m[i, 5] = m[p, 1] * le + m[p, 3] * lf + m[p, 5]
        else:
            m[i, 0] = la
            m[i, 1] = lb
            m[i, 2] = lc
            m[i, 3] = ld
            m[i, 4] = le
            m[i, 5] = lf
        k[i, 0] = m[i, 0]
        k[i, 1] = m[i, 1]
        k[i, 2] = m[i, 2]
        k[i, 3] = m[i, 3]
        k[i, 4] = m[i, 4] - (m[i, 0] * jx[i] + m[i, 2] * jy[i])
        k[i, 5] = m[i, 5] - (m[i, 1] * jx[i] + m[i, 3] * jy[i])


@njit(cache=True)
def skin_verts(V, B, W, k, out):
    for i in range(V.shape[0]):
        x = V[i, 0]
        y = V[i, 1]
        a = B[i, 0]
        X = W[i, 0] * (k[a, 0] * x + k[a, 2] * y + k[a, 4])
        Y = W[i, 0] * (k[a, 1] * x + k[a, 3] * y + k[a, 5])
        b = B[i, 1]
        if b >= 0:
            X += W[i, 1] * (k[b, 0] * x + k[b, 2] * y + k[b, 4])
            Y += W[i, 1] * (k[b, 1] * x + k[b, 3] * y + k[b, 5])
        out[i, 0] = X
        out[i, 1] = Y


@njit(cache=True, fastmath=True, boundscheck=False)
def raster(P, TUV, tri, live, tri_part, tex_off, tex_w, tex_h, TEX, ax, bx, ay, by, GW, GH, hi, base):
    """Alpha of the posed rig at 2x the grid resolution into `hi` (uint8, 2GH x 2GW), max over `base` (what is already drawn: zeros, or the parts a fit step does not move) and the `live`
    triangles (those with any texture alpha under them)."""
    hi[:, :] = base
    for li in range(live.shape[0]):
        t = live[li]
        a = tri[t, 0]
        b = tri[t, 1]
        c = tri[t, 2]
        x0 = (P[a, 0] * ax + bx) * 2.0
        y0 = (P[a, 1] * ay + by) * 2.0
        x1 = (P[b, 0] * ax + bx) * 2.0
        y1 = (P[b, 1] * ay + by) * 2.0
        x2 = (P[c, 0] * ax + bx) * 2.0
        y2 = (P[c, 1] * ay + by) * 2.0
        den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(den) < 1e-9:
            continue
        minx = max(0, int(math.floor(min(x0, min(x1, x2)) - 0.5)))
        maxx = min(2 * GW - 1, int(math.ceil(max(x0, max(x1, x2)) + 0.5)))
        miny = max(0, int(math.floor(min(y0, min(y1, y2)) - 0.5)))
        maxy = min(2 * GH - 1, int(math.ceil(max(y0, max(y1, y2)) + 0.5)))
        inv = 1.0 / den
        pi = tri_part[t]
        off = tex_off[pi]
        tw = tex_w[pi]
        th = tex_h[pi]
        for y in range(miny, maxy + 1):
            qy = y + 0.5
            for x in range(minx, maxx + 1):
                qx = x + 0.5
                l0 = ((y1 - y2) * (qx - x2) + (x2 - x1) * (qy - y2)) * inv
                l1 = ((y2 - y0) * (qx - x2) + (x0 - x2) * (qy - y2)) * inv
                l2 = 1.0 - l0 - l1
                if l0 < -0.02 or l1 < -0.02 or l2 < -0.02:
                    continue
                u = (l0 * TUV[a, 0] + l1 * TUV[b, 0] + l2 * TUV[c, 0]) * tw
                v = (l0 * TUV[a, 1] + l1 * TUV[b, 1] + l2 * TUV[c, 1]) * th
                iu = int(math.floor(u))
                iv = int(math.floor(v))
                if iu < 0 or iv < 0 or iu >= tw or iv >= th:
                    continue
                al = TEX[off + iv * tw + iu]
                if al > hi[y, x]:
                    hi[y, x] = al


@njit(cache=True)
def cover(hi, GW, GH, mask, cov):
    """Grid mask: a cell is on when its four samples average over alpha 0.5 (>= 127.5 of 255); `cov` is that average itself, 0..1 (the fit's smooth overlap works on it)."""
    for j in range(GH):
        for i in range(GW):
            s = 0
            s += hi[2 * j, 2 * i]
            s += hi[2 * j, 2 * i + 1]
            s += hi[2 * j + 1, 2 * i]
            s += hi[2 * j + 1, 2 * i + 1]
            mask[j, i] = 1 if s >= 510 else 0
            cov[j, i] = s / 1020.0


@njit(cache=True)
def blur121(a, tmp, passes):
    """Separable [1 2 1] / 4 smoothing, `passes` times, in place (about a Gaussian of sigma sqrt(passes / 2) cells)."""
    H, W = a.shape
    for _ in range(passes):
        for j in range(H):
            for i in range(W):
                l = a[j, i - 1] if i > 0 else a[j, i]
                r = a[j, i + 1] if i < W - 1 else a[j, i]
                tmp[j, i] = 0.25 * l + 0.5 * a[j, i] + 0.25 * r
        for j in range(H):
            for i in range(W):
                u = tmp[j - 1, i] if j > 0 else tmp[j, i]
                d = tmp[j + 1, i] if j < H - 1 else tmp[j, i]
                a[j, i] = 0.25 * u + 0.5 * tmp[j, i] + 0.25 * d


@njit(cache=True)
def soft_iou(a, b):
    """Sum of the smaller over sum of the larger of two coverages: the overlap, smooth under sub-cell moves."""
    num = 0.0
    den = 0.0
    for j in range(a.shape[0]):
        for i in range(a.shape[1]):
            x = a[j, i]
            y = b[j, i]
            if x < y:
                num += x
                den += y
            else:
                num += y
                den += x
    return num / den if den > 0 else 0.0


@njit(cache=True)
def chamfer(mask, out):
    """Distance (in cells, chamfer 1 / 1.414) from every cell to the nearest ON cell of `mask`."""
    H, W = mask.shape
    big = 1.0e6
    for j in range(H):
        for i in range(W):
            out[j, i] = 0.0 if mask[j, i] else big
    for j in range(H):
        for i in range(W):
            v = out[j, i]
            if i > 0:
                v = min(v, out[j, i - 1] + 1.0)
            if j > 0:
                v = min(v, out[j - 1, i] + 1.0)
                if i > 0:
                    v = min(v, out[j - 1, i - 1] + 1.4142)
                if i < W - 1:
                    v = min(v, out[j - 1, i + 1] + 1.4142)
            out[j, i] = v
    for j in range(H - 1, -1, -1):
        for i in range(W - 1, -1, -1):
            v = out[j, i]
            if i < W - 1:
                v = min(v, out[j, i + 1] + 1.0)
            if j < H - 1:
                v = min(v, out[j + 1, i] + 1.0)
                if i < W - 1:
                    v = min(v, out[j + 1, i + 1] + 1.4142)
                if i > 0:
                    v = min(v, out[j + 1, i - 1] + 1.4142)
            out[j, i] = v


@njit(cache=True)
def chamfer_terms(rig, tgt, dtT, dtR):
    """Mean distance from the rig's cells to the target and from the target's cells to the rig (cells): the smooth part of the fit's loss, alive when nothing overlaps yet."""
    chamfer(rig, dtR)
    a = 0.0
    na = 0
    b = 0.0
    nb = 0
    for j in range(rig.shape[0]):
        for i in range(rig.shape[1]):
            if rig[j, i]:
                a += dtT[j, i]
                na += 1
            if tgt[j, i]:
                b += dtR[j, i]
                nb += 1
    if na == 0:
        return 300.0, 300.0
    return a / na, b / max(nb, 1)


@njit(cache=True)
def iou(a, b):
    inter = 0
    union = 0
    for j in range(a.shape[0]):
        for i in range(a.shape[1]):
            x = a[j, i]
            y = b[j, i]
            if x and y:
                inter += 1
            if x or y:
                union += 1
    return inter / union if union else 0.0
