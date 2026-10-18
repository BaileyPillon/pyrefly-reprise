"""Auron's format v2 variants, pass 2 (the rig program, 2026-10-18; FFX only: Auron is an FFX figure). A pose that needs a limb or a prop the idle's costume does not have brings its OWN, cut from that pose's painting.

No SAM and no generative model: a variant is the pose painting's own pixels under a mask (polygons, capsules and colour tests, the same predicate language as the cut: `rig_pred.py`), resampled once and
placed where the pose model registers that painting (`targets/targets.json` `place`: the same registration the fitter's target and the gate's reading use), so a variant lies in the bind frame exactly where the painted
limb lies in the registered painting. It is rigid on a bone (`root` for a held pose: the body is fitted around it), and a key swaps it in (`fit.keys.<pose>.image`) and hides the idle's limb it replaces.

A spec (`variants_cut` in the config), coordinates in the pose painting's @2x pixels (the grids the lane looked at):
  { "part": "armR", "variant": "cast", "pose": "cast", "d": 1.25, "bone": "root",
    "polys": {name: [[x, y], ...]}, "include": [pred, ...], "exclude": [pred, ...], "close": 3, "min_island": 80,
    "fade": {"poly": name, "px": 30},                      optional: the alpha ramps up over `px` from the edge of the polygon's side that faces outward (a cut end the body hides)
    "marks": {"fist": [x, y], ...}                          optional: painting points (@2x px) that become landmarks `<name><Pose>` on the variant's bone, at their registered bind position
    "rimless": [poly names] }                               optional: no rim light inside these polygons (a cut edge, not a painted outline)
`d` is PNG px per idle-1x px (the idle's own parts are at 2.0: this file's variants are lighter, the budget is 9 MB of PNG).
"""
from __future__ import annotations

import json

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

IDLE_W = 799.0  # the idle's 1x width (the pose model's `place.W` of the costume)


def registration(T: dict, pose: str, S: int):
    """The map from a pose painting's (possibly flipped) pixels to the bind frame: returns (r, X0, Y0, flip) with  X = X0 + S x'/(d r)... see `bind_xy`. `T` is `targets/targets.json`."""
    c = T["costume"]
    pl = T["poses"][pose]["place"]
    upp_i, anchor_i = c["upp"], c["anchor1"]
    r = pl["upp"] / upp_i
    flip = pl["mirror"] < 0
    X0 = S * (-pl["W"] * r / 2.0 + pl["shift"] / upp_i + c["size"][0] / 2.0)
    Y0 = S * (anchor_i - pl["anchor"] * r)
    return r, X0, Y0, flip


def bind_of_painting_point(T: dict, pose: str, S: int, x: float, y: float, px_per_1x: float = 1.0) -> tuple[float, float]:
    """A point of the pose's painting (pixels of a grid `px_per_1x` per 1x px; the config's marks are 1x) -> bind master px, through the registered placement (the flip included)."""
    r, X0, Y0, flip = registration(T, pose, S)
    pl = T["poses"][pose]["place"]
    x1, y1 = x / px_per_1x, y / px_per_1x
    if flip:
        x1 = pl["W"] - x1
    c = T["costume"]
    return X0 + S * r * x1, Y0 + S * r * y1


def _mask(spec: dict, rgba: np.ndarray, polys_mask: dict, R, Pred):
    H, W = rgba.shape[:2]
    pred = Pred((H, W), 1, rgba, {}, polys_mask)
    m = pred.any_of(spec["include"]) & ~pred.any_of(spec.get("exclude")) & pred.alpha
    if spec.get("close", 0):
        m = ndi.binary_closing(m, iterations=int(spec["close"])) & (rgba[..., 3] > 24)
    m = R.clean_mask(m, min_island=spec.get("min_island", 80), close=0)
    return m, pred


def cut_variant(spec: dict, art_dir, T: dict, S: int, R, Pred, out_dir, name_png: str, say=print):
    """Cut one variant: write its PNG and rim mask into `out_dir` and return (variant record, `{mark name: [bind x, bind y]}`, the mask at @2x, the placement)."""
    pose = spec["pose"]
    src = np.array(Image.open(f"{art_dir}/characters/auron/{pose}@2x.png").convert("RGBA"))
    rgba = R.defringe_alpha(src)
    H, W = rgba.shape[:2]
    polys = {n: R.poly_mask((H, W), [pts], 1.0) for n, pts in (spec.get("polys") or {}).items()}
    m, pred = _mask(spec, rgba, polys, R, Pred)
    alpha = np.where(m, rgba[..., 3], 0).astype(np.float32)
    fade = spec.get("fade")
    if fade:  # the end the body hides: alpha ramps from 0 at the polygon's edge facing out to full `px` in (the polygon is the region to ramp over, `toward` the point the ramp rises toward)
        zone = polys[fade["poly"]]
        tx, ty = fade["toward"]
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d_to = np.hypot(xx - tx, yy - ty)
        d0 = float(d_to[zone & m].max()) if (zone & m).any() else 1.0
        ramp = np.clip((d0 - d_to) / max(float(fade["px"]), 1.0), 0.0, 1.0)  # 0 at the far end of the zone (farthest from `toward`), 1 `px` closer
        alpha = np.where(zone, alpha * ramp, alpha)
    rgba = rgba.copy()
    rgba[..., 3] = alpha.astype(np.uint8)
    yy_, xx_ = np.nonzero(alpha > 8)
    if len(xx_) == 0:
        raise SystemExit(f"auron variants: {spec['part']}:{spec['variant']} is empty (check its mask)")
    # one resample: the painting's 2x pixels -> `d` PNG px per idle-1x px (one painting-1x px is r idle-1x px, so Z = d r PNG px per painting-1x px), premultiplied so the edge does not pull grey in
    r, X0, Y0, flip = registration(T, pose, S)
    d = float(spec.get("d", 1.25))
    Z = d * r
    if flip:
        rgba = rgba[:, ::-1]
    im = Image.fromarray(np.ascontiguousarray(rgba), "RGBA").convert("RGBa")
    rw, rh = max(1, int(round(W / 2.0 * Z))), max(1, int(round(H / 2.0 * Z)))
    arr = np.array(im.resize((rw, rh), Image.LANCZOS).convert("RGBA"))
    a = arr[..., 3]
    ys, xs = np.nonzero(a > 8)
    pad = 3
    a0, a1 = max(0, xs.min() - pad), min(rw, xs.max() + 1 + pad)
    b0, b1 = max(0, ys.min() - pad), min(rh, ys.max() + 1 + pad)
    crop = R.dilate_rgb(arr[b0:b1, a0:a1], 8)
    pw, ph = crop.shape[1], crop.shape[0]
    Image.fromarray(crop, "RGBA").save(f"{out_dir}/{name_png}.png", optimize=True)
    rim = (R.outer_edge_mask(crop[..., 3]) * 255).astype(np.uint8)
    for pn in spec.get("rimless", []):  # a cut edge, not a painted outline: no rim light there
        pm = polys[pn]
        if flip:
            pm = pm[:, ::-1]
        pmr = np.array(Image.fromarray((pm * 255).astype(np.uint8)).resize((rw, rh), Image.BILINEAR))[b0:b1, a0:a1] > 40
        rim[pmr] = 0
    Image.fromarray(rim, "L").save(f"{out_dir}/{name_png}.rim.png", optimize=True)
    P, Tri = R.build_mesh(crop[..., 3] > 8, edge_step=spec.get("edge", 18.0), inner_step=spec.get("inner", 36.0), domain_grow=8, seed=1)
    k = S / d  # master px per PNG px
    bx, by = X0 + k * a0, Y0 + k * b0  # the crop's top-left in the bind frame
    verts = np.stack([bx + P[:, 0] * k, by + P[:, 1] * k], 1)
    uvs = P / np.array([pw, ph], np.float64)
    rec = {"png": f"{name_png}.png", "rim": f"{name_png}.rim.png", "box": [0, 0, pw, ph],
           "verts": [round(float(v), 2) for v in verts.reshape(-1)], "uvs": [round(float(v), 5) for v in uvs.reshape(-1)],
           "triangles": [int(t) for t in Tri.reshape(-1)], "bone": spec.get("bone", "root")}
    marks = {}
    for n, (mx, my) in (spec.get("marks") or {}).items():
        bx_, by_ = bind_of_painting_point(T, pose, S, mx, my, 2.0)
        marks[n] = [round(bx_, 2), round(by_, 2)]
    info = {"pose": pose, "px": [pw, ph], "verts": len(verts), "tris": len(Tri) // 3, "area": int((crop[..., 3] > 8).sum()), "origin": [round(bx, 1), round(by, 1)], "d": d, "flip": flip}
    return rec, marks, m, info


def preview(spec: dict, art_dir, T: dict, S: int, R, Pred, out_png: str, box=None, scale: float = 0.6):
    """The painting with the cut's mask tinted green and the exclude in red, for the eye: `box` (x0, y0, x1, y1) in @2x px."""
    pose = spec["pose"]
    src = np.array(Image.open(f"{art_dir}/characters/auron/{pose}@2x.png").convert("RGBA"))
    rgba = R.defringe_alpha(src)
    H, W = rgba.shape[:2]
    polys = {n: R.poly_mask((H, W), [pts], 1.0) for n, pts in (spec.get("polys") or {}).items()}
    m, pred = _mask(spec, rgba, polys, R, Pred)
    bg = np.zeros((H, W, 3), np.float32) + np.array([70, 70, 80], np.float32)
    a = (src[..., 3:4].astype(np.float32) / 255.0)
    img = bg * (1 - a) + src[..., :3].astype(np.float32) * a
    img[m] = img[m] * 0.45 + np.array([40, 255, 90], np.float32) * 0.55
    out = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    if box:
        out = out.crop(tuple(box))
    out = out.resize((int(out.width * scale), int(out.height * scale)), Image.LANCZOS)
    out.save(out_png)
    return out.size
