"""Auron's hooks (the rig program, 2026-10-18; FFX only: Auron is an FFX figure). His long coat is the one thing the declarative config cannot skin: the lower coat hangs from the hips, never from the hem.

The `coat` blends three bones, as Lulu's skirt does: the `pelvis` by how high a vertex sits (above `TOP` (1x rows) a vertex is the pelvis's alone, below `BOT` it has no say, a smoothstep between) and `coatL` / `coatR`, two bones
at the hips (joint (450, 620)) that a key SWINGS (a positive rotation flares the left side out), split by x across a ramp. The `tail` (the trailing red left panel) is blended exactly like the coat's own left side
(`skin_tail`) and hangs from `coatL`, so it can swing or shrink and open no wedge. A vertex keeps its two heaviest influences (the rig file holds two)."""
from __future__ import annotations

import numpy as np

TOP = 620.0  # 1x painting rows: above this a vertex is the pelvis's alone
BOT = 800.0  # below this it is the coat bones' alone
XC = 450.0  # 1x column of the hips: the line between the left and the right of the coat
RAMP = 60.0  # the left/right blend reaches this far to each side of it


def _smooth(t: float) -> float:
    t = float(np.clip(t, 0.0, 1.0))
    return t * t * (3 - 2 * t)


def skin_coat(state):
    S = state.S
    pel, left, right = state.BI["pelvis"], state.BI["coatL"], state.BI["coatR"]

    def fn(verts):
        out = []
        for x, y in verts:
            p = 1.0 - _smooth((y / S - TOP) / (BOT - TOP))
            a = _smooth(((x / S) - (XC - RAMP)) / (2 * RAMP))  # 0 at the far left, 1 at the far right
            w = {pel: p, left: (1.0 - p) * (1.0 - a), right: (1.0 - p) * a}
            top2 = sorted(((wt, b) for b, wt in w.items() if wt > 1e-4), reverse=True)[:2]
            tot = sum(wt for wt, _ in top2)
            out.append([(b, wt / tot) for wt, b in top2])
        return out

    return fn


def skin_tail(state):
    pel, tr = state.BI["pelvis"], state.BI["tail"]

    def fn(verts):
        out = []
        for x, y in verts:
            p = 1.0 - _smooth((y / state.S - TOP) / (BOT - TOP))
            out.append([(pel, p), (tr, 1.0 - p)] if 0.0 < p < 1.0 else [(pel, 1.0)] if p >= 1.0 else [(tr, 1.0)])
        return out

    return fn
