"""fxmask.py : the painted-in effects of a pose (a magic circle on the ground, a swirl round the hand) as their own mask, so the party rig can cut them into a part (`fx`) that is bound to the root and does not
ride the limbs it overlaps (the ring split between both legs and tore in a move; the swirl split between the arm and the torso).

The `party.fx` block of the config: `{pose: {name: {"ellipse": [cx, cy, rx, ry], "box": [x0, y0, x1, y1], "keep": [[a, b, r], ...]}}}`, all in 1x px of the POSE'S OWN painting; `a`/`b` are keypoint names of that pose
or [x, y]; `keep` is a hull of capsules (radius r) whose pixels stay with the body. A name's mask is every painted pixel inside its ellipse and/or box and outside its keep hull; the pose's fx is the union.
"""
from __future__ import annotations

import numpy as np


def _grid(party, pose: str, T: dict, shape: tuple[int, int], pad: int):
    """Every master-frame pixel's position in the pose painting's own 1x px."""
    ax, bx, ay, by = party.reg(T, pose)
    H, W = shape
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    return (X - pad - bx) / (ax * party.S), (Y - pad - by) / (ay * party.S)


def _seg(px, py, a, b):
    vx, vy = b[0] - a[0], b[1] - a[1]
    t = np.clip(((px - a[0]) * vx + (py - a[1]) * vy) / max(vx * vx + vy * vy, 1e-6), 0, 1)
    return np.hypot(px - (a[0] + t * vx), py - (a[1] + t * vy))


def fx_mask(party, pose: str, T: dict, rgba: np.ndarray, pad: int) -> np.ndarray | None:
    """The pose's painted-in effect pixels in the master frame (bool, same shape as `rgba`'s), or None when the config names none for the pose."""
    spec = (party.party.get("fx") or {}).get(pose)
    if not spec:
        return None
    px, py = _grid(party, pose, T, rgba.shape[:2], pad)
    F = rgba[..., 3] > 60
    kp = {k: tuple(v) for k, v in party.kp[pose].items()}
    pt = lambda p: kp[p] if isinstance(p, str) else tuple(p)  # noqa: E731
    out = np.zeros(F.shape, bool)
    for _name, s in spec.items():
        reg = np.ones(F.shape, bool)
        if "ellipse" in s:
            cx, cy, rx, ry = s["ellipse"]
            reg &= ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1.0
        if "box" in s:
            x0, y0, x1, y1 = s["box"]
            reg &= (px >= x0) & (px <= x1) & (py >= y0) & (py <= y1)
        for a, b, r in s.get("keep", []):
            if (isinstance(a, str) and a not in kp) or (isinstance(b, str) and b not in kp):
                continue
            reg &= _seg(px, py, pt(a), pt(b)) > float(r)
        out |= reg & F
    return out
