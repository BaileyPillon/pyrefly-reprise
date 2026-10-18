"""Lulu's hooks (the rig program, 2026-10-18; FFX only: Lulu is an FFX figure).

Her skirt is the one part the declarative config cannot skin: it is a single long panel that is planted at the hem and follows the hips at the waist. Each vertex blends three things:

- the `pelvis` bone, by how high it sits: above `TOP` (1x px) a vertex is the pelvis's alone (the hips and waist are rigid with it, which the gate's hole test at the pelvis joint needs), below `BOT` the
  pelvis has no say, between them a smoothstep (a long one: the flare grows toward the hem and the belts keep their spacing);
- `skirtL` and `skirtR`, two bones at the hem's centre that are held at rest and only SCALED (the fitter's `scales`): the left and the right of the skirt flare or narrow independently about the hem
  (her idle's train trails to the left; the paintings that flare the skirt flare it to the right too), split by x across a ramp around the hem's centre line.
A vertex keeps its two heaviest influences (the rig file holds two).
"""
from __future__ import annotations

import numpy as np

TOP = 600.0  # 1x painting rows: above this a vertex is the pelvis's alone
BOT = 1120.0  # below this it is the skirt bones' alone
XC = 245.0  # 1x painting column of the hem's centre: the line between the left and the right of the skirt
RAMP = 45.0  # the left/right blend reaches this far to each side of it


def _smooth(t: float) -> float:
    t = float(np.clip(t, 0.0, 1.0))
    return t * t * (3 - 2 * t)


def skin_skirt(state):
    S = state.S
    pel, left, right = state.BI["pelvis"], state.BI["skirtL"], state.BI["skirtR"]

    def fn(verts):
        out = []
        for x, y in verts:
            p = 1.0 - _smooth((y / S - TOP) / (BOT - TOP))  # the pelvis's share
            a = _smooth(((x / S) - (XC - RAMP)) / (2 * RAMP))  # 0 at the far left, 1 at the far right
            w = {pel: p, left: (1.0 - p) * (1.0 - a), right: (1.0 - p) * a}
            top2 = sorted(((wt, b) for b, wt in w.items() if wt > 1e-4), reverse=True)[:2]
            tot = sum(wt for wt, _ in top2)
            out.append([(b, wt / tot) for wt, b in top2])
        return out

    return fn
