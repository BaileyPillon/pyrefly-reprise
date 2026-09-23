"""Art method r3 pilot, P4 (FFX-2 only, chapter 6 Leblanc): the hurt bake, idle pixels only.

    D:/Tools/sd-scripts/.venv/Scripts/python.exe docs/concepts/chapters/leblanc/r3-method/hurt-bake.py --pose hurt.json [--out p4]

METHOD-CHECK step 3, option (b). The idle (the provisional anchor) is moved by joint
rotations given as landmark moves (hurt.json): the upper body turns back about the hips,
the head turns back about the neck, the fan arm drops about the elbow. No pixel is drawn:
every opaque pixel of the bake is an idle pixel, moved or not; only the areas the arm
uncovers are pre-filled (amber) for the P4 repaint.

- Body: a dense displacement field built from the rotations. Inside the core (head, torso,
  fan arm, choker; SAM atlas masks blurred by coreSigma) a point turns about the hips by
  theta1 * w_up(y); outside it (sleeves, robe, far arm) it follows the spine point of its
  own row, so a sleeve 200 px from the pivot is carried, not swung (a rigid swing about the
  hips would pull the robe edge 45 px down and fold it). w_up is 1 above ramp[0] and 0 below
  ramp[1] (legs and hem stay), scaled down to farSide.min on the far (left) side. The head
  then turns by theta2 * w_head about the moved neck point. The inverse map is found by a
  fixed-point iteration q <- p - D(q) (smooth field, 25 steps), sampled with cv2.remap on a
  2x Lanczos canvas and brought down once, as in transplant.py.
- Arm: the fan and fan arm (SAM masks, closed 5 px, cut at armCutY) are a rigid layer:
  theta1 about the hips, then theta3 about the moved elbow. The body under the arm is
  pre-filled first (Telea inpaint of the straight colour, or rig-lib push-pull with
  fill: pushpull; alpha from the nearest known pixel), then moved with the body.
- The canvas is padded equally left and right (the engine centres a pose horizontally, so
  equal padding keeps the feet where idle's are); baselineY is idle's plus the top pad and
  the sidecar scale is 1.0 by construction.
Outputs in D:/Tools/pyrefly-lora/leblanc/r3/<out>/: bake.png, holes.png (revealed, amber),
joints.png (area change over 6 %), eyes.png (the eye box), provenance.png, bake.json.
"""
from __future__ import annotations

import argparse
import math
import pathlib
import sys

import cv2
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import r3lib as R  # noqa: E402


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def rot(v, deg):
    t = math.radians(deg)
    c, s = math.cos(t), math.sin(t)
    return np.stack([v[..., 0] * c - v[..., 1] * s, v[..., 0] * s + v[..., 1] * c], -1)


def push_pull_fill(rgb, known):
    """rig-lib.py push_pull_fill, with cv2.blur in place of scipy's uniform_filter."""
    rgb = rgb.astype(np.float32)
    wgt = known.astype(np.float32)
    levels = []
    c, wt = rgb * wgt[..., None], wgt
    while min(wt.shape) > 2:
        levels.append((c, wt))
        h, w = wt.shape
        h2, w2 = (h + 1) // 2, (w + 1) // 2
        cp = np.zeros((h2 * 2, w2 * 2, rgb.shape[2]), np.float32); cp[:h, :w] = c
        wp = np.zeros((h2 * 2, w2 * 2), np.float32); wp[:h, :w] = wt
        c = cp.reshape(h2, 2, w2, 2, rgb.shape[2]).sum((1, 3))
        wt = wp.reshape(h2, 2, w2, 2).sum((1, 3))
    col = c / np.maximum(wt, 1e-6)[..., None]
    for c_l, w_l in reversed(levels):
        h, w = w_l.shape
        up = np.repeat(np.repeat(col, 2, 0), 2, 1)[:h, :w]
        up = cv2.blur(up, (3, 3), borderType=cv2.BORDER_REPLICATE)
        a = np.clip(w_l, 0, 1)[..., None]
        col = np.where(w_l[..., None] > 0, c_l / np.maximum(w_l, 1e-6)[..., None], up) * a + up * (1 - a)
    out = rgb.copy()
    out[~known] = col[~known]
    return out


def up2(img):
    return np.stack([np.asarray(Image.fromarray(img[..., c].astype(np.float32), "F").resize((img.shape[1] * 2, img.shape[0] * 2), Image.LANCZOS))
                     for c in range(img.shape[2])], -1)


def sample_back(src_premult, qx, qy):
    """Sample a premultiplied (H, W, C) source at source coords (qx, qy) given on a 2x destination grid; returns 1x."""
    up = up2(src_premult)
    mx = (2 * (qx + 0.5) - 0.5).astype(np.float32); my = (2 * (qy + 0.5) - 0.5).astype(np.float32)
    w2 = np.stack([cv2.remap(up[..., c], mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=0) for c in range(up.shape[2])], -1)
    H, W = qx.shape[0] // 2, qx.shape[1] // 2
    return cv2.resize(w2, (W, H), interpolation=cv2.INTER_AREA)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pose", required=True)
    ap.add_argument("--out", default="p4")
    a = ap.parse_args()
    P = R.read_json(a.pose)
    out = R.SCR / a.out; out.mkdir(parents=True, exist_ok=True)
    pad = P["pad"]; px, py = pad["left"], pad["top"]
    idle0 = R.load_rgba(R.IDLE)
    h0, w0 = idle0.shape[:2]
    H, W = h0 + pad["top"] + pad["bottom"], w0 + pad["left"] + pad["right"]
    idle = np.zeros((H, W, 4), np.float32); idle[py:py + h0, px:px + w0] = idle0

    def mask(name):
        m = np.zeros((H, W), bool); m[py:py + h0, px:px + w0] = R.load_mask(R.ATLAS / f"idle.{name}.png"); return m

    off = np.array([px, py], np.float64)
    c1 = np.array(P["hips"], np.float64) + off
    c2 = np.array(P["neck"], np.float64) + off
    el = np.array(P["elbow"], np.float64) + off
    t1, t2, t3 = P["theta1"], P["theta2"], P["theta3"]

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    pts = np.stack([xx, yy], -1)
    # weights on the source grid
    w_up = 1 - smoothstep(P["ramp"][0] + py, P["ramp"][1] + py, yy)
    fs = P["farSide"]
    side = fs["min"] + (1 - fs["min"]) * smoothstep(fs["x0"] + px, fs["x1"] + px, xx)
    w_up *= 1 - (1 - side) * smoothstep(fs.get("y0", 230) + py, fs.get("y1", 290) + py, yy)  # the head and shoulders turn whole
    head = mask("head")
    # SAM's head mask leaves out the hair tips that fall past the jaw on the far side; anything opaque in the
    # hair box (hurt.json hairBox) that is not the arm turns with the head too, or it tears off the outline
    hb = P.get("hairBox")
    if hb:
        hbm = np.zeros((H, W), bool); hbm[hb[1] + py:hb[3] + py, hb[0] + px:hb[2] + px] = True
        head |= hbm & (idle[..., 3] > 8) & ~mask("fan") & ~mask("fanarm")
    # the part of the face the fan covered belongs to the head too (SAM stops at the fan)
    hy, hx = np.nonzero(head)
    hh = np.zeros((H, W), np.uint8)
    cv2.fillConvexPoly(hh, cv2.convexHull(np.stack([hx, hy], 1).astype(np.int32)), 1)
    head |= hh.astype(bool) & (yy < c2[1]) & (idle[..., 3] > 8)
    core = np.zeros((H, W), bool)
    for n in P["core"]:
        core |= mask(n)
    core |= head  # the hair box too, or its tips follow the rows while the head turns
    # rigid inside a grown mask, blurred only beyond it (a blur that reaches into the hair shears its outline)
    grow = lambda m, r: cv2.dilate(m.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))).astype(bool)
    # continuous falloff by distance from the grown mask (a max() of a blur and a mask left a step: a tear)
    ramp = lambda m, g, sig: 1 - smoothstep(0, 3 * sig, cv2.distanceTransform((~grow(m, g)).astype(np.uint8), cv2.DIST_L2, 5).astype(np.float64))
    k = ramp(core, P.get("coreGrow", 16) // 2, P["coreSigma"])
    wh = ramp(head, P.get("headGrow", 14) // 2, P["headSigma"])
    nr = P.get("neckRamp", [10, 30])
    wh *= 1 - smoothstep(c2[1] + nr[0], c2[1] + nr[1], yy)  # nothing below the neck turns with the head

    # forward displacement D(p) on the source grid
    ang = t1 * w_up
    tt = np.radians(ang); cs, sn = np.cos(tt), np.sin(tt)
    v = pts - c1
    rot_p = np.stack([v[..., 0] * cs - v[..., 1] * sn, v[..., 0] * sn + v[..., 1] * cs], -1) + c1
    vs = np.stack([np.zeros_like(yy), yy - c1[1]], -1)  # the spine point of the row
    row_t = np.stack([vs[..., 0] * cs - vs[..., 1] * sn, vs[..., 0] * sn + vs[..., 1] * cs], -1) - vs
    p1 = k[..., None] * rot_p + (1 - k[..., None]) * (pts + row_t)
    c2m = rot(c2 - c1, t1) + c1
    ta = np.radians(t2 * wh); cs2, sn2 = np.cos(ta), np.sin(ta)
    v2 = p1 - c2m
    p2 = np.stack([v2[..., 0] * cs2 - v2[..., 1] * sn2, v2[..., 0] * sn2 + v2[..., 1] * cs2], -1) + c2m
    D = (p2 - pts).astype(np.float32)

    # area change of the body map (joints)
    gx0 = np.gradient(p2[..., 0], axis=1); gx1 = np.gradient(p2[..., 0], axis=0)
    gy0 = np.gradient(p2[..., 1], axis=1); gy1 = np.gradient(p2[..., 1], axis=0)
    det = gx0 * gy1 - gx1 * gy0

    # the arm layer and the body under it
    arm = np.zeros((H, W), bool)
    for n in P["arm"]:
        arm |= mask(n)
    arm = cv2.morphologyEx(arm.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))).astype(bool)
    # the closed fan is a straight wedge: its convex hull catches the handle end SAM left out
    fy, fx = np.nonzero(mask("fan"))
    hull = np.zeros((H, W), np.uint8)
    cv2.fillConvexPoly(hull, cv2.convexHull(np.stack([fx, fy], 1).astype(np.int32)), 1)
    arm |= hull.astype(bool) & (idle[..., 3] > 8)
    arm &= (yy < P["armCutY"] + py) & (idle[..., 3] > 8)
    hole = cv2.dilate(arm.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    known = ~hole
    al = idle[..., 3:4] / 255.0
    prem = np.concatenate([idle[..., :3] * al, idle[..., 3:4]], -1)
    body = prem.copy()
    straight = prem[..., :3] / np.maximum(al, 1e-3) * (al > 0)
    if P.get("fill", "telea") == "telea":
        # Telea carries the border colours in along the edge (skin under the jaw stays skin); push-pull averaged
        # skin, hair shadow and choker into a flat grey block the 0.3 to 0.45 repaint could not lift (first look)
        unk = (hole | (idle[..., 3] <= 200)).astype(np.uint8) * 255
        tel = cv2.inpaint(np.clip(straight, 0, 255).astype(np.uint8)[..., ::-1].copy(), unk, 7, cv2.INPAINT_TELEA)[..., ::-1]
        body[..., :3] = np.where(hole[..., None], tel.astype(np.float32), straight)
    else:
        body[..., :3] = push_pull_fill(straight, known & (idle[..., 3] > 200))
    _, lab = cv2.distanceTransformWithLabels(hole.astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    kn = np.nonzero((~hole).ravel())[0]
    # labels index the zero (known) pixels in scan order
    body_a = idle[..., 3].ravel()[kn][lab.ravel() - 1].reshape(H, W)
    # inside the hull of the head, neck and torso the uncovered pixels are the body (neck under the jaw), not background
    bh = head | mask("torso") | mask("choker")
    by, bx = np.nonzero(bh)
    hull_b = np.zeros((H, W), np.uint8)
    cv2.fillConvexPoly(hull_b, cv2.convexHull(np.stack([bx, by], 1).astype(np.int32)), 1)
    body_a = np.where(hull_b.astype(bool) & (yy > c2[1] - 40), 255.0, body_a)
    body[..., 3] = np.where(hole, body_a, idle[..., 3])
    body[..., :3] = np.where(hole[..., None], body[..., :3] * (body[..., 3:4] / 255.0), prem[..., :3])
    armf = cv2.GaussianBlur(arm.astype(np.float32), (0, 0), 0.8)
    arm_layer = prem * armf[..., None]

    # inverse of the body field by fixed-point iteration, on the 2x destination grid
    U, V = np.meshgrid(np.arange(2 * W), np.arange(2 * H))
    X = (U + 0.5) / 2 - 0.5; Y = (V + 0.5) / 2 - 0.5
    qx, qy = X.copy(), Y.copy()
    Dx, Dy = D[..., 0], D[..., 1]
    for _ in range(25):
        dx = cv2.remap(Dx, qx.astype(np.float32), qy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        dy = cv2.remap(Dy, qx.astype(np.float32), qy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        qx, qy = X - dx, Y - dy
    body_w = sample_back(body, qx, qy)
    hole_w = cv2.resize(cv2.remap(cv2.resize(hole.astype(np.float32), (2 * W, 2 * H), interpolation=cv2.INTER_NEAREST), (2 * qx + 0.5).astype(np.float32), (2 * qy + 0.5).astype(np.float32), cv2.INTER_LINEAR), (W, H), interpolation=cv2.INTER_AREA)
    det_w = cv2.resize(cv2.remap(det.astype(np.float32), qx.astype(np.float32), qy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE), (W, H), interpolation=cv2.INTER_AREA)
    disp_w = cv2.resize(np.hypot(X - qx, Y - qy).astype(np.float32), (W, H), interpolation=cv2.INTER_AREA)

    # the arm: rigid, theta1 about the hips then theta3 about the moved elbow (inverse in closed form)
    elm = rot(el - c1, t1) + c1
    Q = np.stack([X, Y], -1)
    s1 = rot(Q - elm, -t3) + elm
    s0 = rot(s1 - c1, -t1) + c1
    arm_w = sample_back(arm_layer, s0[..., 0], s0[..., 1])

    # composite: premultiplied over
    aa = np.clip(arm_w[..., 3:4] / 255.0, 0, 1)
    comp = arm_w + body_w * (1 - aa)
    alpha = np.clip(comp[..., 3], 0, 255)
    rgb = np.where(alpha[..., None] > 0.5, comp[..., :3] / np.maximum(alpha[..., None] / 255.0, 1e-3), 0)
    bake = np.concatenate([np.clip(rgb, 0, 255), alpha[..., None]], -1)
    # where the map moves a pixel by under a quarter pixel (legs, hem, feet) the idle pixel itself, exactly:
    # the 2x resample otherwise leaves faint alpha a row below the feet (a 15 px margin where idle has 16)
    still = cv2.resize(np.hypot(X - qx, Y - qy).astype(np.float32), (W, H), interpolation=cv2.INTER_AREA) < 0.25
    still &= aa[..., 0] < 1e-3
    bake[still] = idle[still]
    alpha = bake[..., 3]
    R.save_rgba(bake, out / "bake.png")

    opaque = alpha > 127
    holes = (hole_w > 0.5) & (aa[..., 0] < 0.5) & opaque
    joints = (np.abs(det_w - 1) > P.get("jointDet", 0.06)) & opaque & ~holes
    R.save_l(holes, out / "holes.png"); R.save_l(joints, out / "joints.png")
    R.save_l((det < 0.05) & (idle[..., 3] > 8), out / "folds-src.png")
    # the SAM head mask (not the grown weight) carried through the body map, for the head-chord gate
    R.save_l(cv2.resize(cv2.remap(mask("head").astype(np.float32), qx.astype(np.float32), qy.astype(np.float32), cv2.INTER_LINEAR), (W, H), interpolation=cv2.INTER_AREA) > 0.5, out / "head.png")
    R.save_l(mask("head"), out / "head-idle.png")
    # the eye box moves with the head: carry its corners through the forward map
    eb = P["eyeBox"]
    corners = np.array([[eb[0], eb[1]], [eb[2], eb[1]], [eb[0], eb[3]], [eb[2], eb[3]]], np.float64) + off
    moved = np.array([p2[int(round(c[1])), int(round(c[0]))] for c in corners])
    eyes = np.zeros((H, W), np.uint8)
    cv2.fillConvexPoly(eyes, cv2.convexHull(moved.astype(np.int32)), 1)
    R.save_l(eyes.astype(bool), out / "eyes.png")

    prov = np.zeros((H, W, 4), np.float32)
    prov[..., 3] = opaque * 255
    same = (disp_w < 0.5)
    prov[same] = [150, 150, 150, 255]
    prov[~same] = [60, 110, 240, 255]
    prov[holes] = [240, 170, 40, 255]
    prov[~opaque] = 0
    R.save_rgba(prov, out / "provenance.png")

    # measurements
    ys, xs = np.nonzero(idle[..., 3] > 127); ys2, xs2 = np.nonzero(opaque)
    hd = head
    hy, hx = np.nonzero(hd)
    rep = {
        "pose": P, "canvas": [W, H], "baselineY": int(R.read_json(R.SCR / "idle.json")["baselineY"]) + py, "scale": 1.0,
        "opaquePx": int(opaque.sum()), "holesPx": int(holes.sum()), "jointsPx": int(joints.sum()),
        "holeShare": round(float(holes.sum() / opaque.sum()), 4), "jointShare": round(float(joints.sum() / opaque.sum()), 4),
        "idleHeight": int(ys.max() - ys.min() + 1), "bakeHeight": int(ys2.max() - ys2.min() + 1),
        "heightRatio": round(float((ys2.max() - ys2.min() + 1) / (ys.max() - ys.min() + 1)), 4),
        "bboxIdle": [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1],
        "bboxBake": [int(xs2.min()), int(ys2.min()), int(xs2.max()) + 1, int(ys2.max()) + 1],
        "unchangedShare": round(float((same & opaque).sum() / opaque.sum()), 4),
        "detRange": [round(float(np.percentile(det_w[opaque], 1)), 3), round(float(np.percentile(det_w[opaque], 99)), 3)],
        "armPx": int(arm.sum()),
        "foldPx": int(((det < 0.05) & (idle[..., 3] > 8)).sum()),
    }
    R.write_json(rep, out / "bake.json")
    print({k: v for k, v in rep.items() if k != "pose"})


if __name__ == "__main__":
    main()
