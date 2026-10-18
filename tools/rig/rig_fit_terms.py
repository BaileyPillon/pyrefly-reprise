"""The pieces of the fitter that do not change with the subject (the rig program; both games): the landmark term (a painting's marks on the grid, the error of a posed landmark), the stance read, the
coordinate polish and the parameter blocks of the search. `rig_fit.Fitter` inherits them; they use the fitter's `m` (the RigModel), `T`, `GS`, `figH`, `free`, `off_idx` and `scl_idx`."""
from __future__ import annotations

import math

import numpy as np
from scipy import ndimage as ndi

MARK_FREE = 0.02   # a landmark this close (idle heights) to the painting's costs nothing
MARK_SOFT = 0.03   # ... and the cost reaches `mark_w` at MARK_FREE + MARK_SOFT = 0.05 (the gate's limit is 0.06)


def grid_point(place: dict, grid: dict, x: float, y: float) -> tuple[float, float]:
    """A pixel (x, y) of a pose's approved painting (1x px) on the pose model's grid, the way `rig-read.mjs#approvedTarget` places that painting: u = (x - W/2) upp mirror + shift, v = (anchor - y) upp."""
    u = (x - place["W"] / 2.0) * place["upp"] * place["mirror"] + place["shift"]
    v = (place["anchor"] - y) * place["upp"]
    return (u - grid["GU0"]) * grid["GS"], (grid["GV1"] - v) * grid["GS"]


class Terms:
    """Methods of `rig_fit.Fitter` (see the module docstring)."""

    def stance_x(self, mask):
        """The x (grid cells, the whole grid's) of the stance of a silhouette the way `posescale` reads it (`stanceFromHem`: the silhouette opened by a disc of 2 percent of its height, the last row with
        two opened cells, then the 3rd to 97th percentile of the columns of the silhouette in the band above it), or None."""
        ys = np.flatnonzero(mask.any(1))
        if not len(ys):
            return None
        bh = int(ys[-1] - ys[0] + 1)
        r = max(1, int(round(0.02 * bh)))
        yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
        # only the lowest fifth of the silhouette can hold the last opened row (a thin limb or tail that reaches lower is opened away): the opening runs on that strip, not on the whole window
        top = max(0, int(ys[-1]) - int(0.25 * bh) - r)
        op = ndi.binary_opening(mask[top:].astype(bool), structure=(xx * xx + yy * yy) <= r * r)
        rows = np.flatnonzero(op.sum(1) >= 2)
        if not len(rows):
            return None
        fb = int(rows[-1]) + top
        band = max(2, int(0.04 * bh))
        cnt = mask[max(0, fb - band):min(mask.shape[0], fb + 3)].sum(0).astype(np.float64)
        tot = cnt.sum()
        if tot <= 0:
            return None
        cum = np.cumsum(cnt) / tot
        return (int(np.searchsorted(cum, 0.03, side="left")) + int(np.searchsorted(cum, 0.97, side="left")) + 1) / 2.0 + self.m.win[0]

    def grid_marks(self, tinfo, marks):
        """The painting's landmark marks of one pose as [(rig landmark, grid x, grid y)]: the ones the rig has, placed the way the pose's painting is (`tinfo['place']`, from rig-targets)."""
        if not marks or not tinfo.get("place"):
            return []
        return [(n, *grid_point(tinfo["place"], self.T["grid"], float(pt[0]), float(pt[1]))) for n, pt in marks.items() if n in self.m.landmarks and not n.startswith("_")]

    def mark_errors(self, marks):
        """How far each posed landmark is from the painting's mark, in idle heights (after a `measures`/`pose`)."""
        out = {}
        for n, gx, gy in marks:
            px, py = self.m.to_grid(*self.m.landmark(n))
            out[n] = math.hypot(px - gx, py - gy) / self.GS / self.figH
        return out

    def descend(self, loss, x0, lo, hi, sweeps=(1.0, 0.25, 0.08, 0.03, 0.01), n=15):
        x = np.clip(x0.copy(), lo, hi)
        best = loss(x)
        for span in sweeps:
            for j in range(len(x)):
                if hi[j] <= lo[j]:
                    continue
                if j < len(self.free):  # one bone's angle: only the parts it moves are redrawn
                    self.measures(x)
                    self.m.begin_block([self.free[j]])
                else:
                    self.m.end_block()
                half = span * (hi[j] - lo[j]) / 2
                cand = np.linspace(max(lo[j], x[j] - half), min(hi[j], x[j] + half), n)
                for c in cand:
                    if c == x[j]:
                        continue
                    old = x[j]
                    x[j] = c
                    L = loss(x)
                    if L < best:
                        best = L
                    else:
                        x[j] = old
        self.m.end_block()
        return x, best

    def blocks(self):
        """The parameter blocks of the search: each LIMB (a bone and all its descendants, when that is six bones or fewer: an arm, a leg, the head, a tail, the spear) and the TRUNK (the whole
        figure's offset and every bone not in a limb: pelvis, spine, chest). A silhouette's angles are far too many to search at once, but a limb moves only its own pixels."""
        m = self.m
        free = set(self.free)
        kids = {i: [c for c in range(m.nb) if m.parent[c] == i] for i in range(m.nb)}

        def subtree(i):
            out = [i] if i in free else []
            for c in kids[i]:
                out += subtree(c)
            return out

        limbs, seen = [], set()

        def walk(i):
            sub = subtree(i)
            if i in free and 0 < len(sub) <= 6:
                limbs.append(sub)
                seen.update(sub)
            else:
                for c in kids[i]:
                    walk(c)

        for r in [i for i in range(m.nb) if m.parent[i] < 0]:
            for c in kids[r]:
                walk(c)
        n = len(self.free)
        pos = {bi: k for k, bi in enumerate(self.free)}
        # a limb's block also takes the offset and the scale of its own bones (the spear's dx, dy and length move with its angle), so they are searched together, not with the whole figure
        extra = [k for k in range(n, n + 2 * len(self.off_idx) + len(self.scl_idx)) if self.bone_of(k) in seen]
        trunk = [pos[bi] for bi in self.free if bi not in seen] + [k for k in range(n, n + 2 * len(self.off_idx) + len(self.scl_idx)) if k not in extra] + [len(self.free) + 2 * len(self.off_idx) + len(self.scl_idx) + j for j in range(3)]
        return [np.array(trunk)] + [np.array([pos[bi] for bi in l] + [k for k in extra if self.bone_of(k) in l]) for l in limbs]

    def bone_of(self, k):
        """The bone parameter `k` belongs to (its rotation, offset or scale), None for the whole-figure offset and rotation."""
        n, no = self.nr, len(self.off_idx)
        if k < n:
            return self.free[k]
        if k < n + 2 * no:
            return self.off_idx[(k - n) // 2]
        if k < n + 2 * no + len(self.scl_idx):
            return self.scl_idx[k - n - 2 * no]
        return None

    def block_bones(self, idx):
        """The bones whose subtrees a block of parameters moves (the parts they skin are the only ones to redraw), or None when the block moves the whole figure."""
        out = [self.bone_of(int(k)) for k in idx]
        return None if any(b is None for b in out) else out
