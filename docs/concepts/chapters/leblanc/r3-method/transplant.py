"""Art method r3 pilot, P2 (FFX-2 only, chapter 6 Leblanc): idle-pixel transplant onto cast.r2.2.

    D:/Tools/sd-scripts/.venv/Scripts/python.exe docs/concepts/chapters/leblanc/r3-method/transplant.py \
        --landmarks docs/concepts/chapters/leblanc/r3-method/cast-landmarks.json [--out p2] [--lock on|off]

Per part (tassel, obi band + knot, choker; cast-landmarks.json):
1. Warp. Piecewise-affine over the Delaunay triangulation of the destination
   landmarks (the method of tools/gen/rig-flow.py: barycentric per triangle,
   cv2.remap), a least-squares affine outside the hull. Done on a 2x Lanczos
   canvas of the idle (premultiplied RGBA) and brought down once (INTER_AREA).
2. Light match. Lab quantile lock measured on a ring just outside the mask
   (3 to 12 px) in both files: monotone L map through the 5/25/50/75/95
   quantiles, each shift clamped to 35 L (0.35 of the range), chroma scaled by
   the ring's median-chroma ratio clamped to 0.6..1.4. Ink (L < 15) is left out
   of both rings, since a black line is not light. --lock ring compares the two
   rings as they are (first run: the rings hold different materials, thigh skin
   against white dress, so it bleached the crimson and cut the choker's chroma
   to 0.6); --lock matched (default) pairs each base ring pixel with the idle
   ring pixel of the same material (nearest a*b* within 8, L within 25) and
   takes the quantiles over the pairs only, so it measures light, not content.
3. The cast's own obi, knot, tassels and choker (atlas masks) are first
   removed by a Telea inpaint from the surrounding cast pixels (amber), so the
   feathered edge of the new part blends into the fill, not into the old part.
4. Feathered paste: alpha from the signed distance to the warped mask edge,
   a 4 px ramp (2 px each side of the line).
Cast alpha is kept exactly. Outputs in D:/Tools/pyrefly-lora/leblanc/r3/<out>/:
cast.png, layer.<part>.png (the warped, locked idle pixels with the feather
alpha, for the P3 interior re-paste), paste.png (hard union), fill.png,
provenance.png, transplant.json. Nothing under public/ is written.
"""
from __future__ import annotations

import argparse
import pathlib
import sys

import cv2
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import r3lib as R  # noqa: E402


def delaunay(pts):
    sub = cv2.Subdiv2D((-4000, -4000, 8000, 8000))
    for p in pts:
        sub.insert((float(p[0]), float(p[1])))
    lut = {(round(float(p[0]), 3), round(float(p[1]), 3)): i for i, p in enumerate(pts)}
    tris = []
    for t in sub.getTriangleList():
        idx = []
        for j in range(3):
            q = (round(float(t[2 * j]), 3), round(float(t[2 * j + 1]), 3))
            if q not in lut:
                break
            idx.append(lut[q])
        if len(idx) == 3:
            tris.append(idx)
    return np.array(tris, np.int32)


def affine_fit(dst, src):
    """Least-squares affine taking dst points to src points (2x3)."""
    A = np.c_[dst, np.ones(len(dst))]
    X, *_ = np.linalg.lstsq(A, src, rcond=None)
    return X.T


def backward_map(src_pts, dst_pts, xx, yy):
    """For destination coordinates (xx, yy) the source coordinates (piecewise affine, affine outside)."""
    src_pts = np.asarray(src_pts, np.float64); dst_pts = np.asarray(dst_pts, np.float64)
    M = affine_fit(dst_pts, src_pts)
    sx = M[0, 0] * xx + M[0, 1] * yy + M[0, 2]
    sy = M[1, 0] * xx + M[1, 1] * yy + M[1, 2]
    if len(dst_pts) >= 3:
        for i, j, k in delaunay(dst_pts):
            m0, m1, m2 = dst_pts[i], dst_pts[j], dst_pts[k]
            d = (m1[1] - m2[1]) * (m0[0] - m2[0]) + (m2[0] - m1[0]) * (m0[1] - m2[1])
            if abs(d) < 1e-9:
                continue
            u = ((m1[1] - m2[1]) * (xx - m2[0]) + (m2[0] - m1[0]) * (yy - m2[1])) / d
            v = ((m2[1] - m0[1]) * (xx - m2[0]) + (m0[0] - m2[0]) * (yy - m2[1])) / d
            w = 1 - u - v
            inside = (u >= -1e-6) & (v >= -1e-6) & (w >= -1e-6)
            P = src_pts
            sx = np.where(inside, u * P[i, 0] + v * P[j, 0] + w * P[k, 0], sx)
            sy = np.where(inside, u * P[i, 1] + v * P[j, 1] + w * P[k, 1], sy)
    return sx, sy


def warp(src_rgba, src_mask, src_pts, dst_pts, shape, margin=40):
    """Warp the idle (and the part mask) into the cast frame on a 2x canvas; returns RGBA (straight) and mask prob."""
    H, W = shape
    d = np.asarray(dst_pts, np.float64)
    x0 = int(max(0, np.floor(d[:, 0].min() - margin))); x1 = int(min(W, np.ceil(d[:, 0].max() + margin)))
    y0 = int(max(0, np.floor(d[:, 1].min() - margin))); y1 = int(min(H, np.ceil(d[:, 1].max() + margin)))
    # premultiplied idle + mask as a 5th channel, upscaled 2x with Lanczos
    a = src_rgba[..., 3:4] / 255.0
    stack = np.concatenate([src_rgba[..., :3] * a, src_rgba[..., 3:4], src_mask[..., None].astype(np.float32) * 255], -1)
    up = np.stack([np.asarray(Image.fromarray(stack[..., c].astype(np.float32), "F").resize((stack.shape[1] * 2, stack.shape[0] * 2), Image.LANCZOS))
                   for c in range(5)], -1)
    # destination 2x canvas over the bbox
    U = np.arange((x1 - x0) * 2); V = np.arange((y1 - y0) * 2)
    uu, vv = np.meshgrid(U, V)
    xx = x0 + (uu + 0.5) / 2 - 0.5
    yy = y0 + (vv + 0.5) / 2 - 0.5
    sx, sy = backward_map(src_pts, dst_pts, xx, yy)
    mx = (2 * (sx + 0.5) - 0.5).astype(np.float32); my = (2 * (sy + 0.5) - 0.5).astype(np.float32)
    chans = [cv2.remap(up[..., c].astype(np.float32), mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=0) for c in range(5)]
    w2 = np.stack(chans, -1)
    w1 = cv2.resize(w2, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
    out = np.zeros((H, W, 5), np.float32)
    out[y0:y1, x0:x1] = w1
    alpha = np.clip(out[..., 3], 0, 255)
    rgb = np.where(alpha[..., None] > 1e-3, out[..., :3] / np.maximum(alpha[..., None] / 255.0, 1e-3), 0)
    rgba = np.concatenate([np.clip(rgb, 0, 255), alpha[..., None]], -1)
    return rgba, np.clip(out[..., 4] / 255.0, 0, 1)


def ring(m, r0=3, r1=12):
    mu = m.astype(np.uint8)
    k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    return cv2.dilate(mu, k(r1)).astype(bool) & ~cv2.dilate(mu, k(r0)).astype(bool)


def ring_stats(rgba, rmask):
    sel = rmask & (rgba[..., 3] > 200)
    lab = R.rgb2lab(rgba[..., :3][sel])
    lab = lab[lab[:, 0] >= 15]
    if len(lab) < 20:
        return None
    return {"n": int(len(lab)), "Lq": np.percentile(lab[:, 0], [5, 25, 50, 75, 95]).tolist(),
            "C": float(np.median(np.hypot(lab[:, 1], lab[:, 2])))}


def lock(layer, src_ring, dst_ring, max_shift=35.0):
    """Monotone L map through the ring quantiles (shift clamped), chroma ratio clamped 0.6..1.4."""
    if src_ring is None or dst_ring is None:
        return layer, {"applied": False}
    qs = np.array(src_ring["Lq"]); qd = np.array(dst_ring["Lq"])
    qd = qs + np.clip(qd - qs, -max_shift, max_shift)
    qd = np.maximum.accumulate(qd)  # monotone
    xs = np.r_[0.0, qs, 100.0]; ys = np.r_[0.0, qd, 100.0]
    ys = np.maximum.accumulate(ys)
    cr = float(np.clip(dst_ring["C"] / max(src_ring["C"], 1e-3), 0.6, 1.4))
    lab = R.rgb2lab(layer[..., :3])
    L2 = np.interp(lab[..., 0], xs, ys)
    lab2 = np.stack([L2, lab[..., 1] * cr, lab[..., 2] * cr], -1)
    out = layer.copy(); out[..., :3] = R.lab2rgb(lab2)
    return out, {"applied": True, "srcQ": [round(v, 2) for v in qs], "dstQ": [round(float(v), 2) for v in qd], "chroma": round(cr, 3)}


def matched_rings(src_rgba, src_ring, dst_rgba, dst_ring, tol_ab=8.0, tol_L=25.0):
    """Material-matched ring pairs: each base ring pixel is paired with the idle ring pixel of the
    nearest a*b* (within tol_ab, and L within tol_L); ink (L < 15) left out. Returns (src L, dst L, src C, dst C)."""
    s = R.rgb2lab(src_rgba[..., :3][src_ring & (src_rgba[..., 3] > 200)]); s = s[s[:, 0] >= 15]
    d = R.rgb2lab(dst_rgba[..., :3][dst_ring & (dst_rgba[..., 3] > 200)]); d = d[d[:, 0] >= 15]
    if len(s) < 20 or len(d) < 20:
        return None
    dab = ((d[:, None, 1:] - s[None, :, 1:]) ** 2).sum(-1) + ((d[:, None, 0] - s[None, :, 0]) / (tol_L / tol_ab)) ** 2 * 0.25
    j = dab.argmin(1)
    ok = (np.sqrt(((d[:, 1:] - s[j, 1:]) ** 2).sum(-1)) <= tol_ab) & (np.abs(d[:, 0] - s[j, 0]) <= tol_L)
    if ok.sum() < 20:
        return None
    sm, dm = s[j[ok]], d[ok]
    return {"n": int(ok.sum()), "share": round(float(ok.mean()), 3),
            "src": {"Lq": np.percentile(sm[:, 0], [5, 25, 50, 75, 95]).tolist(), "C": float(np.median(np.hypot(sm[:, 1], sm[:, 2])))},
            "dst": {"Lq": np.percentile(dm[:, 0], [5, 25, 50, 75, 95]).tolist(), "C": float(np.median(np.hypot(dm[:, 1], dm[:, 2])))}}


def feather_alpha(m, ramp=2.0):
    mu = m.astype(np.uint8)
    din = cv2.distanceTransform(mu, cv2.DIST_L2, 5)
    dout = cv2.distanceTransform(1 - mu, cv2.DIST_L2, 5)
    sd = np.where(m, din - 0.5, -(dout - 0.5))
    return np.clip((sd + ramp) / (2 * ramp), 0, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--landmarks", required=True)
    ap.add_argument("--out", default="p2")
    ap.add_argument("--lock", default="matched", choices=["matched", "ring", "off"])
    ap.add_argument("--grow-old", dest="grow_old", type=int, default=1,
                    help="px the old parts are grown before the Telea fill (P6: 3, so their ink outline goes too)")
    a = ap.parse_args()
    spec = R.read_json(a.landmarks)
    out = R.SCR / a.out
    out.mkdir(parents=True, exist_ok=True)
    idle = R.load_rgba(R.IDLE); cast = R.load_rgba(R.CAST)
    H, W = cast.shape[:2]
    rep = {"landmarks": str(pathlib.Path(a.landmarks).as_posix()), "parts": {}}

    # 1. remove the cast's own parts (Telea inpaint from the surrounding cast pixels)
    old = np.zeros((H, W), bool)
    for n in spec["remove"]:
        old |= R.load_mask(R.ATLAS / f"{n}.png")
    g = a.grow_old
    old = cv2.dilate(old.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * g + 1, 2 * g + 1))).astype(bool) & (cast[..., 3] > 0)
    a_c = cast[..., 3:4] / 255.0
    base_rgb = (cast[..., :3] * a_c + 255 * (1 - a_c)).astype(np.uint8)
    filled = cv2.inpaint(np.ascontiguousarray(base_rgb[..., ::-1]), old.astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)[..., ::-1].astype(np.float32)
    work = cast.copy()
    work[..., :3] = np.where(old[..., None], filled, cast[..., :3])

    # 2. warp, lock and paste each part
    paste = np.zeros((H, W), bool)
    blue = np.zeros((H, W), np.float32)
    for p in spec["parts"]:
        sm = np.zeros(idle.shape[:2], bool)
        for n in p["srcMask"]:
            sm |= R.load_mask(R.ATLAS / f"{n}.png")
        layer, prob = warp(idle, sm, p["src"], p["dst"], (H, W))
        dm = (prob > 0.5) & (cast[..., 3] > 0)
        sr = ring_stats(idle, ring(sm)); dr = ring_stats(np.where(old[..., None], cast * 0, cast), ring(dm) & ~old)
        if a.lock == "ring":
            layer, info = lock(layer, sr, dr)
            info["mode"] = "ring"
        elif a.lock == "matched":
            mr = matched_rings(idle, ring(sm), cast, ring(dm) & ~old)
            layer, info = lock(layer, mr["src"] if mr else None, mr["dst"] if mr else None)
            info.update({"mode": "matched", "pairs": mr and mr["n"], "pairShare": mr and mr["share"]})
        else:
            info = {"applied": False, "mode": "off"}
        fa = feather_alpha(dm) * (layer[..., 3] / 255.0)
        layer_out = layer.copy(); layer_out[..., 3] = fa * 255
        R.save_rgba(layer_out, out / f"layer.{p['name']}.png")
        R.save_l(dm, out / f"mask.{p['name']}.png")
        work[..., :3] = work[..., :3] * (1 - fa[..., None]) + layer[..., :3] * fa[..., None]
        paste |= dm
        blue = np.maximum(blue, fa)
        rep["parts"][p["name"]] = {"px": int(dm.sum()), "ringSrc": sr, "ringDst": dr, "lock": info,
                                   "labWarped": R.lab_stats(layer_out, dm), "labIdle": R.lab_stats(idle, sm)}
        print(p["name"], int(dm.sum()), info, flush=True)
    work[..., 3] = cast[..., 3]
    fill = old & (blue < 0.999)
    R.save_rgba(work, out / "cast.png")
    R.save_l(paste, out / "paste.png")
    R.save_l(fill, out / "fill.png")
    prov = np.zeros((H, W, 4), np.float32)
    prov[..., :3] = 150; prov[..., 3] = (cast[..., 3] > 0) * 255
    prov[fill] = [240, 170, 40, 255]
    b = blue > 0.5
    prov[b] = [60, 110, 240, 255]
    R.save_rgba(prov, out / "provenance.png")
    rep["removedPx"] = int(old.sum()); rep["fillPx"] = int(fill.sum()); rep["pastePx"] = int(paste.sum())
    R.write_json(rep, out / "transplant.json")


if __name__ == "__main__":
    main()
