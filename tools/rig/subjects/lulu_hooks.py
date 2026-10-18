"""Lulu's hooks (the rig program, 2026-10-18; FFX only: Lulu is an FFX figure).

Her skirt is the one part the declarative config cannot skin: it is a single long panel that is planted at the hem and follows the hips at the waist, so each vertex blends the `skirt` bone
(a child of the root at the hem's centre: it is held at rest and only scaled, which flares or narrows the skirt about its hem) with the `pelvis` bone by how high it sits. Above `TOP` (1x px) a
vertex is the pelvis's alone (the waist bends and thrusts with the hips); below `BOT` it is the skirt bone's alone (the hem stays where she stands); between them a smoothstep.
"""
from __future__ import annotations

import numpy as np

TOP = 500.0  # 1x painting rows
BOT = 800.0


def skin_skirt(state):
    S = state.S
    pel, skirt = state.BI["pelvis"], state.BI["skirt"]

    def fn(verts):
        out = []
        for _x, y in verts:
            t = float(np.clip((y / S - TOP) / (BOT - TOP), 0.0, 1.0))
            t = t * t * (3 - 2 * t)
            if t <= 1e-4:
                out.append([(pel, 1.0)])
            elif t >= 1 - 1e-4:
                out.append([(skirt, 1.0)])
            else:
                out.append([(pel, 1.0 - t), (skirt, t)])
        return out

    return fn
