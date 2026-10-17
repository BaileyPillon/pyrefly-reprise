"""The rig in numbers: bones, skin matrices, skinned vertices and a fast silhouette rasteriser on the pose model's grid, for the fitter (rig_fit.py) and the contact sheets.

The maths is the runtime's (`src/engine/rig/RigSkeleton.ts`) and the Node gate's (`tools/rig/rig-pose.mjs`): a bone's pose is a rotation about its own joint (clockwise on screen, y down), a scale
and an offset, applied after its parent's; skinning is linear blend, at most two bones a vertex. Angles here are RADIANS; the rig file's are degrees (rig_export.py converts).
The rasteriser draws a part's texture alpha through its triangles (nearest texel, 2x2 supersampling) and is NOT the gate's: the gate re-reads every key with its own code (tools/rig/rig-raster.mjs).
"""
from __future__ import annotations

import math
import pathlib

import numpy as np
from numba import njit
from PIL import Image


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


@njit(cache=True)
def raster(P, TUV, tri, tri_part, tex_off, tex_w, tex_h, TEX, ax, bx, ay, by, GW, GH, hi):
    """Alpha of the posed rig at 2x the grid's resolution into `hi` (uint8, 2GH x 2GW), max over triangles; then the grid's coverage (GH x GW, float32)."""
    hi[:, :] = 0
    for t in range(tri.shape[0]):
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
def cover(hi, GW, GH, mask):
    """Grid mask: a cell is on when its four samples average over alpha 0.5 (>= 127.5 of 255)."""
    for j in range(GH):
        for i in range(GW):
            s = 0
            s += hi[2 * j, 2 * i]
            s += hi[2 * j, 2 * i + 1]
            s += hi[2 * j + 1, 2 * i]
            s += hi[2 * j + 1, 2 * i + 1]
            mask[j, i] = 1 if s >= 510 else 0


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


class RigModel:
    """build.json + the part PNGs as flat arrays."""

    def __init__(self, build: dict, parts_dir: pathlib.Path, grid_affine=None, grid=None):
        self.build = build
        self.scale = build["scale"]
        bones = build["bones"]
        self.names = [b["name"] for b in bones]
        self.idx = {n: i for i, n in enumerate(self.names)}
        self.parent = np.array([b["parent"] for b in bones], np.int64)
        self.jx = np.array([b["x"] for b in bones], np.float64)
        self.jy = np.array([b["y"] for b in bones], np.float64)
        self.bx = np.array([b["x"] - (bones[b["parent"]]["x"] if b["parent"] >= 0 else 0) for b in bones], np.float64)
        self.by = np.array([b["y"] - (bones[b["parent"]]["y"] if b["parent"] >= 0 else 0) for b in bones], np.float64)
        nb = len(bones)
        self.nb = nb
        Vs, Bs, Ws, Ts, tris, tparts, offs, tws, ths, texs, rgba = [], [], [], [], [], [], [], [], [], [], []
        base = 0
        self.part_names = []
        self.part_span = []
        off = 0
        for pi, p in enumerate(sorted(build["parts"], key=lambda r: r["order"])):
            self.part_names.append(p["name"])
            v = np.array(p["verts"], np.float64).reshape(-1, 2)
            n = len(v)
            if "bone" in p:
                bi = self.idx[p["bone"]] if isinstance(p["bone"], str) else int(p["bone"])
                b = np.stack([np.full(n, bi), np.full(n, -1)], 1)
                w = np.stack([np.ones(n), np.zeros(n)], 1)
            else:
                b = np.array(p["bones"], np.int64).reshape(-1, 2)
                w = np.array(p["weights"], np.float64).reshape(-1, 2)
            bx_, by_, bw_, bh_ = p["box"]
            if "uvs" in p:
                uv = np.array(p["uvs"], np.float64).reshape(-1, 2)
                tuv = np.stack([uv[:, 0], 1 - uv[:, 1]], 1)
            else:
                tuv = np.stack([(v[:, 0] - bx_) / bw_, (v[:, 1] - by_) / bh_], 1)
            tr = np.array(p["triangles"], np.int64).reshape(-1, 3) + base
            img = np.array(Image.open(parts_dir / p["png"]).convert("RGBA"))
            th_, tw_ = img.shape[:2]
            Vs.append(v)
            Bs.append(b)
            Ws.append(w)
            Ts.append(tuv)
            tris.append(tr)
            tparts.append(np.full(len(tr), pi))
            offs.append(off)
            tws.append(tw_)
            ths.append(th_)
            texs.append(img[..., 3].reshape(-1))
            rgba.append(img)
            self.part_span.append((base, base + n))
            base += n
            off += tw_ * th_
        self.V = np.vstack(Vs)
        self.B = np.vstack(Bs).astype(np.int64)
        self.W = np.vstack(Ws)
        self.TUV = np.vstack(Ts)
        self.tri = np.vstack(tris).astype(np.int64)
        self.tri_part = np.concatenate(tparts).astype(np.int64)
        self.tex_off = np.array(offs, np.int64)
        self.tex_w = np.array(tws, np.int64)
        self.tex_h = np.array(ths, np.int64)
        self.TEX = np.concatenate(texs).astype(np.uint8)
        self.rgba = rgba
        self.k = np.zeros((nb, 6))
        self.P = np.zeros_like(self.V)
        self.landmarks = build.get("landmarks", {})
        if grid_affine is not None:
            self.set_grid(grid_affine, grid)

    def set_grid(self, aff, grid):
        self.aff = aff
        self.GW, self.GH = int(grid["GW"]), int(grid["GH"])
        self.hi = np.zeros((2 * self.GH, 2 * self.GW), np.uint8)
        self.mask = np.zeros((self.GH, self.GW), np.uint8)

    def pose(self, rot=None, root=(0.0, 0.0, 0.0), off=None, scl=None):
        """Solve a pose. rot: radians per bone (array or {name: rad}); off: {name: (dx, dy)}; scl: {name: (sx, sy)}."""
        nb = self.nb
        r = np.zeros(nb)
        if isinstance(rot, dict):
            for n, v in rot.items():
                r[self.idx[n]] = v
        elif rot is not None:
            r[:] = rot
        ox = np.zeros(nb)
        oy = np.zeros(nb)
        sx = np.ones(nb)
        sy = np.ones(nb)
        for n, (dx, dy) in (off or {}).items():
            ox[self.idx[n]], oy[self.idx[n]] = dx, dy
        for n, (a, b) in (scl or {}).items():
            sx[self.idx[n]], sy[self.idx[n]] = a, b
        solve(self.parent, self.jx, self.jy, self.bx, self.by, r, ox, oy, sx, sy, np.array(root, np.float64), self.k)
        skin_verts(self.V, self.B, self.W, self.k, self.P)
        return self.k

    def grid_mask(self) -> np.ndarray:
        a = self.aff
        raster(self.P, self.TUV, self.tri, self.tri_part, self.tex_off, self.tex_w, self.tex_h, self.TEX, a["ax"], a["bx"], a["ay"], a["by"], self.GW, self.GH, self.hi)
        cover(self.hi, self.GW, self.GH, self.mask)
        return self.mask

    def landmark(self, name):
        """Posed place of a landmark in master px (after `pose`)."""
        l = self.landmarks[name]
        k = self.k[self.idx[l["bone"]] if isinstance(l["bone"], str) else int(l["bone"])]
        return (k[0] * l["x"] + k[2] * l["y"] + k[4], k[1] * l["x"] + k[3] * l["y"] + k[5])

    def to_grid(self, x, y):
        a = self.aff
        return a["ax"] * x + a["bx"], a["ay"] * y + a["by"]

    def render_rgba(self, W, H, scale_down=1.0) -> np.ndarray:
        """Colour preview of the posed rig on a W x H canvas of master px / scale_down (parts back to front, straight alpha, nearest texel). Slow (numpy); sheets only."""
        out = np.zeros((int(H / scale_down), int(W / scale_down), 4), np.float32)
        for pi, (s0, s1) in enumerate(self.part_span):
            sel = (self.tri_part == pi)
            tris = self.tri[sel]
            img = self.rgba[pi].astype(np.float32)
            th, tw = img.shape[:2]
            P = self.P / scale_down
            for t in tris:
                pa, pb, pc = P[t[0]], P[t[1]], P[t[2]]
                x_lo, x_hi = int(max(0, math.floor(min(pa[0], pb[0], pc[0])))), int(min(out.shape[1] - 1, math.ceil(max(pa[0], pb[0], pc[0]))))
                y_lo, y_hi = int(max(0, math.floor(min(pa[1], pb[1], pc[1])))), int(min(out.shape[0] - 1, math.ceil(max(pa[1], pb[1], pc[1]))))
                if x_hi < x_lo or y_hi < y_lo:
                    continue
                den = (pb[1] - pc[1]) * (pa[0] - pc[0]) + (pc[0] - pb[0]) * (pa[1] - pc[1])
                if abs(den) < 1e-9:
                    continue
                yy, xx = np.mgrid[y_lo:y_hi + 1, x_lo:x_hi + 1]
                qx, qy = xx + 0.5, yy + 0.5
                l0 = ((pb[1] - pc[1]) * (qx - pc[0]) + (pc[0] - pb[0]) * (qy - pc[1])) / den
                l1 = ((pc[1] - pa[1]) * (qx - pc[0]) + (pa[0] - pc[0]) * (qy - pc[1])) / den
                l2 = 1 - l0 - l1
                ins = (l0 >= -0.02) & (l1 >= -0.02) & (l2 >= -0.02)
                if not ins.any():
                    continue
                u = (l0 * self.TUV[t[0], 0] + l1 * self.TUV[t[1], 0] + l2 * self.TUV[t[2], 0]) * tw
                v = (l0 * self.TUV[t[0], 1] + l1 * self.TUV[t[1], 1] + l2 * self.TUV[t[2], 1]) * th
                iu, iv = np.floor(u).astype(int), np.floor(v).astype(int)
                ok = ins & (iu >= 0) & (iv >= 0) & (iu < tw) & (iv < th)
                if not ok.any():
                    continue
                tex = img[iv[ok], iu[ok]]
                a = tex[:, 3:4] / 255.0
                region = out[y_lo:y_hi + 1, x_lo:x_hi + 1]
                cur = region[ok]
                ca = cur[:, 3:4] / 255.0
                na = a + ca * (1 - a)
                rgb = (tex[:, :3] * a + cur[:, :3] * ca * (1 - a)) / np.maximum(na, 1e-6)
                region[ok] = np.concatenate([rgb, na * 255.0], 1)
        return out.clip(0, 255).astype(np.uint8)
