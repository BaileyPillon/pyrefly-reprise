"""PR-0096 (FFX-2 only, Chapter VI): derive an open-fan Leblanc idle from the installed idle.

Method r3 (docs/plans/art-method-r3/METHOD-CHECK.md): the idle's own pixels everywhere except
the fan; the fan leaf is transplanted from Leblanc's own installed cast.png (the red leaf with
silver ribs that D-036 names, whose black guard with blue stripes is exactly the idle's closed
fan), polar-remapped so its rivet sits in the idle's end cap and it opens upward beside her
face. The idle's hand and end cap are re-pasted on top, so the model/transplant owns only the
fan. Nothing under public/ is written.

  python fan_open.py --out D:/Tools/pyrefly-scratch/leblanc-fan/v1 [--theta0 187 --theta1 285
                     --r0 152 --r1 165 --hue red|magenta]
"""
from __future__ import annotations

import argparse
import json
import math
import pathlib

import cv2
import numpy as np
from PIL import Image

REPO = pathlib.Path(__file__).resolve().parents[5]
IDLE = REPO / "public/art/characters/leblanc/idle.png"
CAST = REPO / "public/art/characters/leblanc/cast.png"

SRC_PIVOT = (304.0, 163.0)       # cast.png: where the ribs converge (checked with a radial overlay)
SRC_PHI = (252.0, 350.0)         # cast.png: left guard edge .. right gold-banded edge, degrees, y down
# (the 252-268 degree part is the black guard with blue stripes, i.e. the idle's closed fan itself)
DST_PIVOT = (498.0, 222.0)       # idle.png: the closed fan's rivet end cap
# idle.png: the closed fan's band from its tip at her lips to where the hand takes it (traced at 5x)
OLD_FAN = [(342, 188), (354, 167), (364, 166), (442, 187), (452, 216), (440, 219)]


def rgba(p):
    return np.asarray(Image.open(p).convert("RGBA")).astype(np.float32)


def src_outer_radius(cast: np.ndarray, phis: np.ndarray) -> np.ndarray:
    """Outer edge of the cast's fan along each source angle (alpha scan outward)."""
    out = np.zeros_like(phis)
    h, w = cast.shape[:2]
    for i, ph in enumerate(phis):
        c, s = math.cos(math.radians(ph)), math.sin(math.radians(ph))
        last = 0.0
        for r in np.arange(20, 320, 0.5):
            x, y = SRC_PIVOT[0] + r * c, SRC_PIVOT[1] + r * s
            if not (0 <= x < w - 1 and 0 <= y < h - 1):
                break
            if cast[int(round(y)), int(round(x)), 3] > 128:
                last = r
        out[i] = last
    return out


def skin(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (r >= 165) & (r - b >= 14) & (r - g >= 4) & (g >= 110)


def hue_to_magenta(rgba_img: np.ndarray, m: np.ndarray) -> np.ndarray:
    """Pick B's 'warm magenta': rotate only the saturated red leaf hues (not ink, not silver)."""
    rgb = np.clip(rgba_img[..., :3], 0, 255).astype(np.uint8)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    red = m & (hsv[..., 1] > 90) & (hsv[..., 2] > 60) & ((hsv[..., 0] < 21) | (hsv[..., 0] > 235))
    hsv[..., 0] = np.where(red, (hsv[..., 0] - 22) % 256, hsv[..., 0])   # red -> magenta-rose
    out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB_FULL).astype(np.float32)
    res = rgba_img.copy()
    res[..., :3] = np.where(red[..., None], out, rgba_img[..., :3])
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--theta0", type=float, default=187.0)
    ap.add_argument("--theta1", type=float, default=285.0)
    ap.add_argument("--r0", type=float, default=152.0)
    ap.add_argument("--r1", type=float, default=165.0)
    ap.add_argument("--hand-r", type=float, default=24.0, help="keep idle pixels within this radius of the rivet")
    ap.add_argument("--hue", default="red")
    ap.add_argument("--phi0", type=float, default=SRC_PHI[0], help="first source angle; 268 skips the cast's guard stack")
    ap.add_argument("--defringe", type=int, default=0, help="px: near-white cut-out fringe of the idle over the new leaf becomes transparent")
    ap.add_argument("--ss", type=int, default=4)
    ap.add_argument("--layer", default="front", help="front: leaf over the face; behind: leaf behind head and hair; guard: behind, and the idle's closed fan stays as the front guard")
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    idle = rgba(IDLE)
    cast = rgba(CAST)
    H, W = idle.shape[:2]

    # --- the new fan, supersampled polar remap -------------------------------------------
    S = a.ss
    ys, xs = np.mgrid[0:H * S, 0:W * S].astype(np.float32)
    X = (xs + 0.5) / S - DST_PIVOT[0]
    Y = (ys + 0.5) / S - DST_PIVOT[1]
    r = np.hypot(X, Y)
    th = np.degrees(np.arctan2(Y, X)) % 360
    t = (th - a.theta0) / (a.theta1 - a.theta0)
    Rt = a.r0 + (a.r1 - a.r0) * np.clip(t, 0, 1)
    phis = np.linspace(a.phi0, SRC_PHI[1], 400)
    Rs_tab = src_outer_radius(cast, phis)
    phi = a.phi0 + t * (SRC_PHI[1] - a.phi0)
    Rs = np.interp(phi, phis, Rs_tab)
    inside = (t >= 0) & (t <= 1) & (r <= Rt)
    rs = r / Rt * Rs
    mx = (SRC_PIVOT[0] + rs * np.cos(np.radians(phi))).astype(np.float32)
    my = (SRC_PIVOT[1] + rs * np.sin(np.radians(phi))).astype(np.float32)
    samp = cv2.remap(cast, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    samp = np.clip(samp, 0, 255)
    samp[..., 3] = np.where(inside, samp[..., 3], 0)
    # premultiplied box-downsample back to 1x
    pm = samp.copy()
    pm[..., :3] *= pm[..., 3:4] / 255.0
    pm = pm.reshape(H, S, W, S, 4).mean(axis=(1, 3))
    fan = pm.copy()
    al = np.maximum(fan[..., 3:4], 1e-6)
    fan[..., :3] = np.where(fan[..., 3:4] > 0, fan[..., :3] * 255.0 / al, 0)
    fanmask = fan[..., 3] > 1
    if a.hue == "magenta":
        fan = hue_to_magenta(fan, fanmask)

    # --- the idle's hand and rivet end cap stay on top --------------------------------------
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rr = np.hypot(xx - DST_PIVOT[0], yy - DST_PIVOT[1])
    box = (xx >= 420) & (xx <= 512) & (yy >= 168) & (yy <= 245)
    hand = box & skin(idle[..., :3]) & (idle[..., 3] > 128)
    hand = cv2.morphologyEx(hand.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    hand = cv2.dilate(hand, np.ones((3, 3), np.uint8), iterations=1).astype(bool)   # the finger ink
    cap = (rr <= a.hand_r) & (idle[..., 3] > 128)
    keep = (hand | cap) & box

    # --- composite ------------------------------------------------------------------------
    old = np.zeros((H, W), np.uint8)
    cv2.fillPoly(old, [np.array(OLD_FAN, np.int32)], 1)
    old = cv2.dilate(old, np.ones((5, 5), np.uint8)).astype(bool) & ~keep
    if a.layer == "guard":
        old[:] = False                                     # nothing of the idle is removed
    fringe = np.zeros((H, W), bool)
    if a.defringe and a.layer != "front":
        # the matte left outside the ink line: grow from the transparent area through non-ink pixels
        rgb = idle[..., :3]
        matte = (rgb.min(-1) > 130) & (rgb.max(-1) - rgb.min(-1) <= 22)   # grey-white, not blonde (chroma ~40)
        grow = idle[..., 3] < 40
        for _ in range(a.defringe):
            grow = cv2.dilate(grow.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & (matte | (idle[..., 3] < 40))
        poly = np.zeros((H, W), np.uint8)
        cv2.fillPoly(poly, [np.array(OLD_FAN, np.int32)], 1)
        # plus enclosed pockets of the old white background (between hair and the closed fan)
        pocket = (rgb.min(-1) > 225) & (rgb.max(-1) - rgb.min(-1) <= 12)
        pocket = cv2.morphologyEx(pocket.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)).astype(bool)
        pocket = cv2.dilate(pocket.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & matte
        fringe = (grow | pocket) & (idle[..., 3] > 0) & (fan[..., 3] > 1) & ~keep & ~poly.astype(bool)
        old = old | fringe
        Image.fromarray((fringe * 255).astype(np.uint8), "L").save(out / "fringe.png")
    if a.layer == "front":
        top, bot = fan, idle
    else:
        base = idle.copy()
        base[..., 3] = np.where(old, 0, base[..., 3])      # the closed fan leaves; the hole is repainted later
        top, bot = base, fan
    ta = top[..., 3:4] / 255.0
    ba = bot[..., 3:4] / 255.0
    out_a = ta + ba * (1 - ta)
    out_rgb = np.where(out_a > 0, (top[..., :3] * ta + bot[..., :3] * ba * (1 - ta)) / np.maximum(out_a, 1e-6), 0)
    res = idle.copy()
    res[..., :3] = out_rgb
    res[..., 3:4] = out_a * 255
    res = np.where(keep[..., None], idle, res)
    Image.fromarray((old * 255).astype(np.uint8), "L").save(out / "old-fan-hole.png")

    changed = np.any(np.abs(np.rint(res) - idle) > 0, axis=-1)
    Image.fromarray(np.clip(np.rint(res), 0, 255).astype(np.uint8), "RGBA").save(out / f"idle.fan-open.{a.layer}.{a.hue}.png")
    Image.fromarray((changed * 255).astype(np.uint8), "L").save(out / f"changed.{a.layer}.{a.hue}.png")
    Image.fromarray((keep * 255).astype(np.uint8), "L").save(out / "keep-hand.png")
    Image.fromarray((fanmask * 255).astype(np.uint8), "L").save(out / "fan-mask.png")
    meta = {"params": vars(a), "srcPivot": SRC_PIVOT, "srcPhi": SRC_PHI, "dstPivot": DST_PIVOT,
            "changedPx": int(changed.sum()), "fringePx": int(fringe.sum()), "fanPx": int(fanmask.sum()), "keptIdlePx": int(keep.sum())}
    (out / f"transplant.{a.layer}.{a.hue}.json").write_text(json.dumps(meta, indent=1))
    print(json.dumps(meta))


if __name__ == "__main__":
    main()
