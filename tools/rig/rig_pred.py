"""The mask predicates of a subject config (tools/rig/subjects/<name>.json): a small declarative language over the costume painting's pixels.

A predicate is an object; all of its keys must hold (AND). Coordinates are the 1x painting's pixels (x right, y down).

  {"sam": "head"}                 a SAM mask by name (a list is an OR)            {"poly": "hand"}            a polygon of cut.polys (a list is an OR)
  {"part": "arm"}                 the pixels a part has been labelled (fills/skirts only)
  {"x_ge": 335, "x_lt": 400, "y_ge": 806, "y_lt": 900}                            half-planes
  {"seg": {"p0": [x, y], "p1": [x, y], "r": 17}}                                  within r of a segment
  {"colour": {"sat_lt": 0.2, "val_gt": 0.55, "r_minus_b_ge": -0.02}}             per-pixel colour tests; feature: r g b sat val r_minus_b r_minus_g g_minus_b r_over_g; op: gt lt ge le
  {"grown": {"of": <predicate>, "px": 8}}  /  {"shrunk": {"of": <predicate>, "px": 3}}
  {"all": [...]}  {"any": [...]}  {"not": <predicate>}  {"opaque": true}
"""
from __future__ import annotations

import numpy as np

import rig_geom as R

_OPS = {"gt": np.greater, "lt": np.less, "ge": np.greater_equal, "le": np.less_equal}


class Pred:
    def __init__(self, shape_hw, scale: int, rgba: np.ndarray, sam: dict, polys: dict, parts=None):
        self.H, self.W = shape_hw
        self.S = scale
        self.sam = sam
        self.polys = polys
        self.parts = parts if parts is not None else {}
        rgb = rgba[..., :3].astype(np.float32) / 255.0
        mx, mn = rgb.max(-1), rgb.min(-1)
        sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
        self.feat = {
            "r": rgb[..., 0], "g": rgb[..., 1], "b": rgb[..., 2], "sat": sat, "val": mx,
            "r_minus_b": rgb[..., 0] - rgb[..., 2], "r_minus_g": rgb[..., 0] - rgb[..., 1], "g_minus_b": rgb[..., 1] - rgb[..., 2],
            "r_over_g": rgb[..., 0] / np.maximum(rgb[..., 1], 1e-3),
        }
        self.alpha = rgba[..., 3] > 24
        self._yy = None

    def _grid(self):
        if self._yy is None:
            yy, xx = np.mgrid[0:self.H, 0:self.W].astype(np.float32)
            self._yy, self._xx = yy / self.S, xx / self.S
        return self._xx, self._yy

    def ev(self, p) -> np.ndarray:
        if p is None:
            return np.zeros((self.H, self.W), bool)
        out = np.ones((self.H, self.W), bool)
        for k, v in p.items():
            if k == "sam":
                m = np.zeros_like(out)
                for n in ([v] if isinstance(v, str) else v):
                    if n not in self.sam:
                        raise SystemExit(f"rig: predicate names SAM mask {n!r}, which was not cut (run `cut --sam` first, or add it to sam.parts)")
                    m |= self.sam[n]
                out &= m
            elif k == "poly":
                m = np.zeros_like(out)
                for n in ([v] if isinstance(v, str) else v):
                    if n not in self.polys:
                        raise SystemExit(f"rig: predicate names polygon {n!r}, which is not in cut.polys")
                    m |= self.polys[n]
                out &= m
            elif k == "part":
                m = np.zeros_like(out)
                for n in ([v] if isinstance(v, str) else v):
                    m |= self.parts.get(n, np.zeros_like(out))
                out &= m
            elif k in ("x_ge", "x_lt", "y_ge", "y_lt"):
                xx, yy = self._grid()
                arr = xx if k[0] == "x" else yy
                out &= (arr >= v) if k.endswith("ge") else (arr < v)
            elif k == "seg":
                out &= R.seg_dist((self.H, self.W), [c * self.S for c in v["p0"]], [c * self.S for c in v["p1"]]) < v["r"] * self.S
            elif k == "colour":
                for ck, cv in v.items():
                    feat, op = ck.rsplit("_", 1)
                    out &= _OPS[op](self.feat[feat], cv)
            elif k == "grown":
                out &= R.grow(self.ev(v["of"]), v["px"] * self.S)
            elif k == "shrunk":
                out &= R.shrink(self.ev(v["of"]), v["px"] * self.S)
            elif k == "all":
                for q in v:
                    out &= self.ev(q)
            elif k == "any":
                m = np.zeros_like(out)
                for q in v:
                    m |= self.ev(q)
                out &= m
            elif k == "not":
                out &= ~self.ev(v)
            elif k == "opaque":
                out &= self.alpha if v else ~self.alpha
            else:
                raise SystemExit(f"rig: unknown predicate key {k!r}")
        return out

    def any_of(self, preds) -> np.ndarray:
        m = np.zeros((self.H, self.W), bool)
        for q in preds or []:
            m |= self.ev(q)
        return m
