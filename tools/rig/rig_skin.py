"""The rig in numbers: bones, skin matrices, skinned vertices and a fast silhouette rasteriser on the pose model's grid, for the fitter (rig_fit.py) and the contact sheets.

The maths is the runtime's (`src/engine/rig/RigSkeleton.ts`) and the Node gate's (`tools/rig/rig-pose.mjs`): a bone's pose is a rotation about its own joint (clockwise on screen, y down), a scale
and an offset, applied after its parent's; skinning is linear blend, at most two bones a vertex. Angles here are RADIANS, as in the rig file keys.
The rasteriser draws a part's texture alpha through its triangles (nearest texel, 2x2 supersampling) and is NOT the gate's: the gate re-reads every key with its own code (tools/rig/rig-raster.mjs).
"""
from __future__ import annotations

import math
import pathlib

import numpy as np
from PIL import Image

from rig_kernels import blur121, chamfer, chamfer_terms, cover, iou, raster, skin_verts, soft_iou, solve  # noqa: F401  (re-exported: the fitter and the tests import them from here)


def _touches(a_small, pts, tw, th):
    """For each triangle's sample points (T x 7 x 2, uv in 0..1), is any texel at or next to one of them opaque?"""
    iu = (pts[..., 0] * tw).astype(int)
    iv = (pts[..., 1] * th).astype(int)
    out = np.zeros(pts.shape[0], bool)
    for dv in (-1, 0, 1):
        for du in (-1, 0, 1):
            u = np.clip(iu + du, 0, tw - 1)
            v = np.clip(iv + dv, 0, th - 1)
            out |= (a_small[v, u] > 0).any(1)
    return out


class RigModel:
    """build.json + the part PNGs as flat arrays."""

    def __init__(self, build: dict, parts_dir: pathlib.Path, grid_affine=None, grid=None, window=None, tex_downsample: int = 4):
        self.build = build
        self.ds = tex_downsample
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
        Vs, Bs, Ws, Ts, tris, tparts, offs, tws, ths, texs, rgba, lives = [], [], [], [], [], [], [], [], [], [], [], []
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
            elif "bones" in p:  # the prototype form: two entries a vertex each
                b = np.array(p["bones"], np.int64).reshape(-1, 2)
                w = np.array(p["weights"], np.float64).reshape(-1, 2)
            else:  # four numbers a vertex: b0, w0, b1, w1
                q = np.array(p["weights"], np.float64).reshape(-1, 4)
                b = q[:, [0, 2]].astype(np.int64)
                w = q[:, [1, 3]].copy()
                w[b[:, 1] < 0, 1] = 0.0
            bx_, by_, bw_, bh_ = p["box"]
            if "uvs" in p:  # v DOWN like the painting px
                tuv = np.array(p["uvs"], np.float64).reshape(-1, 2)
            elif "uv" in p:  # the prototype alias: v UP
                uv = np.array(p["uv"], np.float64).reshape(-1, 2)
                tuv = np.stack([uv[:, 0], 1 - uv[:, 1]], 1)
            else:
                tuv = np.stack([(v[:, 0] - bx_) / bw_, (v[:, 1] - by_) / bh_], 1)
            tr = np.array(p["triangles"], np.int64).reshape(-1, 3) + base
            img = np.array(Image.open(parts_dir / p["png"]).convert("RGBA"))
            alpha_img = Image.fromarray(img[..., 3], "L")
            if self.ds > 1:  # the fit never needs more than a texel every few master px: a small texture stays in the cache
                alpha_img = alpha_img.resize((max(1, img.shape[1] // self.ds), max(1, img.shape[0] // self.ds)), Image.BOX)
            a_small = np.array(alpha_img)
            th_, tw_ = a_small.shape[:2]
            # triangles with no texture alpha under them (the mesh margin) are never drawn: sample corners, edge midpoints and centre, and one texel around each
            tri_uv = tuv[tr - base]
            pts = np.concatenate([tri_uv, (tri_uv[:, 0:1] + tri_uv[:, 1:2]) / 2, (tri_uv[:, 1:2] + tri_uv[:, 2:3]) / 2, (tri_uv[:, 2:3] + tri_uv[:, 0:1]) / 2, tri_uv.mean(1, keepdims=True)], 1)
            lives.append(np.nonzero(_touches(a_small, pts, tw_, th_))[0] + sum(len(x) for x in tris))
            Vs.append(v)
            Bs.append(b)
            Ws.append(w)
            Ts.append(tuv)
            tris.append(tr)
            tparts.append(np.full(len(tr), pi))
            offs.append(off)
            tws.append(tw_)
            ths.append(th_)
            texs.append(a_small.reshape(-1))
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
        self.live_all = np.concatenate(lives).astype(np.int64)
        self.live = self.live_all
        self.part_live = [l.astype(np.int64) for l in lives]
        self.tex_off = np.array(offs, np.int64)
        self.tex_w = np.array(tws, np.int64)
        self.tex_h = np.array(ths, np.int64)
        self.TEX = np.concatenate(texs).astype(np.uint8)
        self.rgba = rgba
        self.k = np.zeros((nb, 6))
        self.P = np.zeros_like(self.V)
        self.landmarks = build.get("landmarks", {})
        if grid_affine is not None:
            self.set_grid(grid_affine, grid, window)

    def set_grid(self, aff, grid, window=None):
        """The grid the silhouette is drawn on. `aff` maps master px to grid cells (X = ax x + bx, Y = ay y + by); `window` = (x0, y0, x1, y1) draws only that part of the grid
        (a fit works on a crop around the targets: several times faster); `to_grid` and `aff` stay in whole-grid cells."""
        self.aff = aff
        self.GW, self.GH = int(grid["GW"]), int(grid["GH"])
        x0, y0, x1, y1 = window or (0, 0, self.GW, self.GH)
        self.win = (x0, y0, x1, y1)
        self.waff = {"ax": aff["ax"], "ay": aff["ay"], "bx": aff["bx"] - x0, "by": aff["by"] - y0}
        self.WW, self.WH = x1 - x0, y1 - y0
        self.hi = np.zeros((2 * self.WH, 2 * self.WW), np.uint8)
        self.base = np.zeros_like(self.hi)
        self.live = self.live_all
        self.mask = np.zeros((self.WH, self.WW), np.uint8)
        self.cov = np.zeros((self.WH, self.WW), np.float32)

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
        a = self.waff
        raster(self.P, self.TUV, self.tri, self.live, self.tri_part, self.tex_off, self.tex_w, self.tex_h, self.TEX, a["ax"], a["bx"], a["ay"], a["by"], self.WW, self.WH, self.hi, self.base)
        cover(self.hi, self.WW, self.WH, self.mask, self.cov)
        return self.mask

    def begin_block(self, bones):
        """Until `end_block`, only the parts skinned to `bones` (or their descendants) are redrawn on each `grid_mask`; every other part is drawn once, now, at the pose last solved. A fit step
        that moves one limb costs a limb's triangles, not the figure's."""
        moved = set(int(b) for b in bones)
        for i in range(self.nb):
            p = int(self.parent[i])
            if p in moved:
                moved.add(i)
        mv = np.zeros(self.nb, bool)
        mv[list(moved)] = True
        aff_parts = []
        rest = []
        for pi, (s0, s1) in enumerate(self.part_span):
            used = self.B[s0:s1]
            hit = bool(mv[used[used >= 0]].any())
            (aff_parts if hit else rest).append(pi)
        self.live = np.concatenate([self.part_live[pi] for pi in aff_parts]).astype(np.int64) if aff_parts else np.zeros(0, np.int64)
        self.base[:, :] = 0
        if rest:
            a = self.waff
            others = np.concatenate([self.part_live[pi] for pi in rest]).astype(np.int64)
            raster(self.P, self.TUV, self.tri, others, self.tri_part, self.tex_off, self.tex_w, self.tex_h, self.TEX, a["ax"], a["bx"], a["ay"], a["by"], self.WW, self.WH, self.hi, self.base)
            self.base[:, :] = self.hi

    def end_block(self):
        self.live = self.live_all
        self.base[:, :] = 0

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
