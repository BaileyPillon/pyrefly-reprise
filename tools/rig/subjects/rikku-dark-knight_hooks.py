"""Hooks for rikku-dark-knight (FFX-2 only: Rikku's Dark Knight dressphere; the rig program, 2026-10-18).

Her long skirt is one hanging panel in two parts, the column (`skirt`: the chain-mail faulds and the blue pleats) and the left sweep (`train`: the black cape that trails to the left with its gold fringe), the same
recipe as Lulu's (tools/rig/subjects/lulu_hooks.py): both are the pelvis's alone above `TOP` (the hips and waist stay rigid with it, which the gate's hole test at the pelvis joint needs), the flare bones'
alone below `BOT`, a smoothstep between. `skirtL` and `skirtR` sit at the hips and are ROTATED and SCALED by a key (the fitter's `scales`): the left and the right of the skirt swing out, or shorten for the
paintings that draw a short skirt. `train` is a child of `skirtL`, so the cape swings with the left of the skirt and may also shrink on its own.
A vertex keeps its two heaviest influences (the rig file holds two).
"""
from __future__ import annotations

import numpy as np

TOP = 640.0  # 1x painting rows: above this a vertex is the pelvis's alone
BOT = 800.0  # below this it is the skirt bones' alone
XC = 250.0  # 1x painting column of the line between the left and the right of the skirt
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
            p = 1.0 - _smooth((y / S - TOP) / (BOT - TOP))
            a = _smooth(((x / S) - (XC - RAMP)) / (2 * RAMP))
            w = {pel: p, left: (1.0 - p) * (1.0 - a), right: (1.0 - p) * a}
            top2 = sorted(((wt, b) for b, wt in w.items() if wt > 1e-4), reverse=True)[:2]
            tot = sum(wt for wt, _ in top2)
            out.append([(b, wt / tot) for wt, b in top2])
        return out

    return fn


def skin_train(state):
    """The train is blended like the skirt's own left side: the pelvis above `TOP`, the `train` bone below `BOT` (a child of `skirtL`), a smoothstep between."""
    pel, tr = state.BI["pelvis"], state.BI["train"]

    def fn(verts):
        out = []
        for x, y in verts:
            p = 1.0 - _smooth((y / state.S - TOP) / (BOT - TOP))
            out.append([(pel, p), (tr, 1.0 - p)] if 0.0 < p < 1.0 else [(pel, 1.0)] if p >= 1.0 else [(tr, 1.0)])
        return out

    return fn


# ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# Knee and hip caps. A leg is one chain-skinned part, and a chain-skinned part bent about its knee draws a wedge of background on the OUTER side of the bend inside the disc the gate watches around the knee
# (a linear blend of two bones shrinks the contour there: `rig-holes.mjs`). The cap is a disc of the leg's OWN pixels (the painting's gold knee guard, copied, not repainted) centred on the knee joint and
# rigid on the shin bone: it turns about its own centre, so the joint stays under it at any bend. At rest it is the same pixels as the leg under it.
# ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
CAPS = {  # part: (the leg it copies, the joint in 1x painting px, the radius in 1x px)
    "kneeL": ("legL", (215.0, 865.0), 52.0),
    "kneeR": ("legR", (322.0, 870.0), 47.0),
    "hipL": ("legL", (275.0, 730.0), 76.0),  # the hips: the same wedge opens at the top of a leg swung far forward (the thigh's joint is the watched one)
    "hipR": ("legR", (350.0, 730.0), 60.0),
    "handCap": ("armR", (610.0, 200.0), 50.0),  # the wrist, where a hand swung far from the forearm opens a wedge
    "trainCap": ("train", (200.0, 700.0), 46.0),  # the cape's own joint: a key that swings the left of the skirt far leaves a wedge behind it
}


def cut_parts(state):
    import numpy as np

    S = state.S
    yy, xx = np.mgrid[0:state.H, 0:state.W].astype(np.float32)
    for name, (leg, (jx, jy), r) in CAPS.items():
        disc = ((xx / S - jx) ** 2 + (yy / S - jy) ** 2) <= r * r
        m = disc & state.cut[leg]
        state.cut[name] = m
        state.full[name][m] = state.full[leg][m]
