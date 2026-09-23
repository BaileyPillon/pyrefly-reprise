"""Living-portrait v4.1 (FFX-2 only plate; the tool is generic): dense
registration between adjacent yaw keys, so the two paintings of a bracket land
on the same pixels feature by feature (iris, catchlight, lash, jaw line, hair
strand), not only at the 25 sparse landmarks.

Why: the v4 check found two paintings on screen for 42 of 169 degrees with
doubled irises, lashes and jaw lines: the sparse landmark mesh (25 points)
registers the face's frame but nothing between the points. Here, per pair:

  1. the sparse two-sided map (the runtime's own: Delaunay of the midpoint
     landmarks + the fixed frame and shoulder pins) warps both keys onto the
     pair's midpoint shape
  2. DIS optical flow (OpenCV) between the two warped keys, both directions,
     kept only where forward and backward agree and where there is paint,
     filled and smoothed by normalised convolution, capped, and faded out
     below the shoulder pins and at the canvas border
  3. each midpoint grid vertex m gets its texel in key A, pA(m), and in key B,
     pB(m); at bracket weight g it is drawn at (1 - g) pA + g pB, so at g = 0
     key A is drawn exactly as painted, at g = 1 key B is, and in between
     both paintings sit on the same, feature-registered geometry
  4. headW(m): 1 at the landmarks, 0 at the fixed points (the sparse mesh's
     own barycentric), so the head's idle sway still rides the head only

Output per pair: art/v4/flow/<a>__<b>.bin, float32 little-endian, per vertex
(pA.x, pA.y, pB.x, pB.y, headW), row-major over an nx * ny grid; the grid and
the pair list go into rig.json artMeta.v4.flow. Diagnostics (--check): per
pair, the midpoint mix of the two keys with the sparse map and with the dense
map, 1:1 crops of the eyes and jaw, and the mean absolute difference between
the two warped keys inside the face (lower = better registered).

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe   # the only Python here with OpenCV
    $PY tools/gen/rig-flow.py build [--step 8] [--check]
"""
from __future__ import annotations

import argparse
import json
import pathlib

import cv2
import numpy as np
from PIL import Image

REPO = pathlib.Path(__file__).resolve().parents[2]
ART = REPO / "docs/concepts/pause-until-dawn/prototype-v2/art"
RIG = ART / "rig.json"
OUT = ART / "v4/flow"
W, H = 832, 1216
PIN_Y = 870  # the shoulder pins' row (artMeta.v3.warp.pins): no yaw displacement below it
FLOW_CAP = 36.0  # px: the residual is a correction of the landmark mesh, never a new turn
FB_TOL = 2.5  # px: forward-backward disagreement above this is not trusted
PASSES = 2
TOTAL_CAP = 56.0  # px, both passes together
EDGE_BAND = 96.0  # px over which the landmark map fades to the identity at the frame


def placed(canvas, path, box):
    im = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)
    x, y = int(box[0]), int(box[1])
    h, w = im.shape[:2]
    xa, xb, ya, yb = max(0, x), min(W, x + w), max(0, y), min(H, y + h)
    if xa >= xb or ya >= yb:
        return
    sub = im[ya - y:yb - y, xa - x:xb - x]
    a = sub[..., 3:4] / 255.0
    canvas[ya:yb, xa:xb, :3] = canvas[ya:yb, xa:xb, :3] * (1 - a) + sub[..., :3] * a
    canvas[ya:yb, xa:xb, 3:4] = canvas[ya:yb, xa:xb, 3:4] * (1 - a) + 255 * a


def composite(rig, key_id):
    """The key as the runtime draws it at rest, without the tassel (drawn apart): RGBA on the canvas."""
    v3 = rig["artMeta"]["v3"]
    c = np.zeros((H, W, 4), np.float32)
    body = v3["frontal"].get("bodyTurned")
    if key_id == "frontal":
        for l in v3["frontal"]["layers"]:
            if l["name"] == "earring":
                continue
            if l["motion"] == "chest":
                l = body or l
            placed(c, ART / l["file"], l["box"])
    else:
        k = v3["keys"][key_id]
        placed(c, ART / k["back"]["file"], k["back"]["box"])
        if body:
            placed(c, ART / body["file"], body["box"])
        placed(c, ART / k["front"]["file"], k["front"]["box"])
    return c


def delaunay(pts):
    sub = cv2.Subdiv2D((-2000, -2000, 5000, 6000))
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


def sparse_fields(la, lb, fixed):
    """Per midpoint-space pixel: its texel in A, in B (the sparse piecewise-affine map), and headW."""
    n = len(la)
    A = np.vstack([la, fixed]).astype(np.float64)
    B = np.vstack([lb, fixed]).astype(np.float64)
    M = (A + B) / 2
    hw = np.r_[np.ones(n), np.zeros(len(fixed))]
    tris = delaunay(M)
    pa = np.full((H, W, 2), np.nan, np.float64)
    pb = np.full((H, W, 2), np.nan, np.float64)
    hwf = np.zeros((H, W), np.float64)
    for i, j, k in tris:
        m0, m1, m2 = M[i], M[j], M[k]
        x0, x1 = int(max(0, np.floor(min(m0[0], m1[0], m2[0])))), int(min(W - 1, np.ceil(max(m0[0], m1[0], m2[0]))))
        y0, y1 = int(max(0, np.floor(min(m0[1], m1[1], m2[1])))), int(min(H - 1, np.ceil(max(m0[1], m1[1], m2[1]))))
        if x0 > x1 or y0 > y1:
            continue
        yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1].astype(np.float64)
        d = (m1[1] - m2[1]) * (m0[0] - m2[0]) + (m2[0] - m1[0]) * (m0[1] - m2[1])
        if abs(d) < 1e-9:
            continue
        u = ((m1[1] - m2[1]) * (xx - m2[0]) + (m2[0] - m1[0]) * (yy - m2[1])) / d
        v = ((m2[1] - m0[1]) * (xx - m2[0]) + (m0[0] - m2[0]) * (yy - m2[1])) / d
        w = 1 - u - v
        inside = (u >= -1e-6) & (v >= -1e-6) & (w >= -1e-6)
        sl = (slice(y0, y1 + 1), slice(x0, x1 + 1))
        for dst, P in ((pa, A), (pb, B)):
            for c in range(2):
                val = u * P[i, c] + v * P[j, c] + w * P[k, c]
                dst[sl][..., c] = np.where(inside, val, dst[sl][..., c])
        hwf[sl] = np.where(inside, u * hw[i] + v * hw[j] + w * hw[k], hwf[sl])
    return pa, pb, hwf, tris, M


def remap(img, field):
    f = field.astype(np.float32)
    return cv2.remap(img, f[..., 0], f[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def sample_field(field, xy):
    """Bilinear sample of an (H, W, C) field at float positions xy (..., 2), clamped to the canvas."""
    f = field.astype(np.float32)
    mx = np.clip(xy[..., 0], 0, W - 1).astype(np.float32)
    my = np.clip(xy[..., 1], 0, H - 1).astype(np.float32)
    return cv2.remap(f, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def gray(rgba):
    a = rgba[..., 3:4] / 255.0
    rgb = rgba[..., :3] * a
    g = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    return np.clip(g, 0, 255).astype(np.uint8)


def dis():
    d = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    d.setFinestScale(0)
    d.setPatchSize(12)
    d.setPatchStride(4)
    d.setGradientDescentIterations(40)
    d.setVariationalRefinementIterations(10)
    d.setVariationalRefinementAlpha(40.0)
    return d


def norm_conv(v, w, sigma):
    num = cv2.GaussianBlur(v * w[..., None] if v.ndim == 3 else v * w, (0, 0), sigma)
    den = cv2.GaussianBlur(w, (0, 0), sigma)
    den = np.maximum(den, 1e-6)
    return num / (den[..., None] if v.ndim == 3 else den)


def residual(Am, Bm):
    """Symmetric residual flow r(m): Am(m - r/2) matches Bm(m + r/2); trusted where both directions agree."""
    ga, gb = gray(Am), gray(Bm)
    d = dis()
    fw = d.calc(ga, gb, None)  # Am(x) ~ Bm(x + fw(x))
    bw = d.calc(gb, ga, None)  # Bm(x) ~ Am(x + bw(x))
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    tgt = np.dstack([xx + fw[..., 0], yy + fw[..., 1]])
    back = sample_field(bw, tgt)
    err = np.linalg.norm(fw + back, axis=-1)
    paint = (Am[..., 3] > 200) & (Bm[..., 3] > 200)
    conf = ((err < FB_TOL) & paint).astype(np.float32)
    # texture matters: a flat skin patch gives the flow nothing to lock on, so its trust is the gradient's
    gm = np.hypot(cv2.Sobel(ga, cv2.CV_32F, 1, 0), cv2.Sobel(ga, cv2.CV_32F, 0, 1))
    conf *= np.clip(gm / 40.0, 0.15, 1.0)
    mag = np.linalg.norm(fw, axis=-1)
    conf *= (mag < FLOW_CAP).astype(np.float32)
    r = norm_conv(fw, conf, 3.0)
    wide = norm_conv(fw, conf, 18.0)
    cov = cv2.GaussianBlur(conf, (0, 0), 3.0)
    t = np.clip(cov / 0.25, 0, 1)[..., None]
    r = r * t + wide * (1 - t)  # sparse trust: the wider average; none at all: zero (below)
    cov_w = cv2.GaussianBlur(conf, (0, 0), 18.0)
    r *= np.clip(cov_w / 0.05, 0, 1)[..., None]
    r = cv2.GaussianBlur(r, (0, 0), 2.0)
    m = np.linalg.norm(r, axis=-1, keepdims=True)
    r = np.where(m > FLOW_CAP, r * FLOW_CAP / np.maximum(m, 1e-6), r)
    return r.astype(np.float64), conf


def edge_keep(band):
    """Per axis, how much of the landmark map's motion survives near the frame: across the left and right
    edges no horizontal motion (a texel from past the edge would be stretched in), across the top edge no
    vertical motion; motion ALONG an edge is kept (hair slides along the top of the frame). Smoothstep over
    `band` px; the bottom is below the pins."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    s = lambda e: (lambda c: c * c * (3 - 2 * c))(np.clip(e / band, 0, 1))
    return s(np.minimum(xx, W - 1 - xx)), s(yy)


def taper(r):
    """No residual below the shoulder pins or at the canvas border (the frame and the pinned body never move)."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    ky = np.clip((PIN_Y - yy) / 80.0, 0, 1)
    edge = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy])
    ke = np.clip(edge / 24.0, 0, 1)
    return r * (ky * ke)[..., None]


def grid(step):
    xs = np.arange(0, W + step, step, dtype=np.float64)
    ys = np.arange(0, H + step, step, dtype=np.float64)
    xs[-1] = W
    ys[-1] = H
    xs = np.unique(np.minimum(xs, W))
    ys = np.unique(np.minimum(ys, H))
    return xs, ys


def fold_mask(P):
    """Grid cells (ny-1, nx-1) whose two triangles turn over (signed area <= 0) for a vertex set P (ny, nx, 2)."""
    a, b, c, d = P[:-1, :-1], P[:-1, 1:], P[1:, :-1], P[1:, 1:]
    cr = lambda p, q, r: (q[..., 0] - p[..., 0]) * (r[..., 1] - p[..., 1]) - (q[..., 1] - p[..., 1]) * (r[..., 0] - p[..., 0])
    return (cr(a, b, c) <= 0.05) | (cr(b, d, c) <= 0.05)


def occlusion_landmarks(rig, a, b, la, lb):
    """The wide brackets (-85 | -60, +60 | +85): the 60-degree key's far-side hair edge is a point the
    profile does not have (that hair is behind the profile's face). Pairing it with the profile's own
    hair edge stretched the profile's forehead spikes and lashes into horizontal streaks (the v4 check at
    -75, -72, +72). Here, for this pair only, the 60-degree key's far-side hair landmarks are put where the
    profile's are, carried by the face's own shift (nose to nose): both silhouettes correspond, the profile
    is never stretched, and the far hair past it is simply the 60-degree painting's own, until the paint
    changes."""
    if max(abs(a["yawDeg"]), abs(b["yawDeg"])) < 70:
        return la, lb
    order = rig["artMeta"]["commonLandmarkOrder"]
    nose = order.index("noseTip")
    la, lb = la.copy(), lb.copy()
    if a["yawDeg"] < 0:  # (-85, -60): the far side is her right, screen-left
        prof, sixty = la, lb
        names = ("hairSide_R", "hairSide_R400", "hairSide_R650")
    else:  # (+60, +85): the far side is her left, screen-right
        prof, sixty = lb, la
        names = ("hairSide_L", "hairSide_L400", "hairSide_L650")
    shift = sixty[nose, 0] - prof[nose, 0]
    for n in names:
        i = order.index(n)
        sixty[i] = [np.clip(prof[i, 0] + shift, 0, W - 1), prof[i, 1]]
    return la, lb


def build_pair(rig, a, b, fixed, step, check_dir):
    ca, cb = composite(rig, a["id"]), composite(rig, b["id"])
    la, lb = np.array(a["landmarks"], np.float64), np.array(b["landmarks"], np.float64)
    la, lb = occlusion_landmarks(rig, a, b, la, lb)
    pa0, pb0, hw, _, _ = sparse_fields(la, lb, fixed)
    # the canvas is inside the frame's hull, so every pixel has a triangle; guard anyway
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    ident = np.dstack([xx, yy])
    pa0 = np.where(np.isnan(pa0), ident, pa0)
    pb0 = np.where(np.isnan(pb0), ident, pb0)
    # the canvas edge is the frame: at it both keys sample their own edge texel and nothing sways, so
    # no strip of edge texels is ever stretched into the picture (v4: bars at x 800-832 at -75 and +72)
    kx, ky = edge_keep(EDGE_BAND)
    k2 = np.dstack([kx, ky])
    pa0 = ident + (pa0 - ident) * k2
    pb0 = ident + (pb0 - ident) * k2
    hw = hw * np.minimum(kx, ky)
    xs, ys = grid(step)
    gx, gy = np.meshgrid(xs, ys)
    G = np.dstack([gx, gy])
    # two passes: the second flow is measured between the keys already registered by the first
    r = np.zeros((H, W, 2), np.float64)
    for _ in range(PASSES):
        Ad = remap(ca, sample_field(pa0, ident - r / 2))
        Bd = remap(cb, sample_field(pb0, ident + r / 2))
        dr, conf = residual(Ad, Bd)
        r = taper(r + dr)
        m = np.linalg.norm(r, axis=-1, keepdims=True)
        r = np.where(m > TOTAL_CAP, r * TOTAL_CAP / np.maximum(m, 1e-6), r)
    # fold repair, local: where a grid cell turns over at any g, damp the residual around it and retry
    def grid_maps(r):
        rg = sample_field(r, G)
        return sample_field(pa0, G - rg / 2), sample_field(pb0, G + rg / 2)
    def fold_cells(PA, PB):
        bad = np.zeros((len(ys) - 1, len(xs) - 1), bool)
        for g in np.linspace(0, 1, 21):
            bad |= fold_mask(PA * (1 - g) + PB * g)
        return bad
    def relax(PA, PB, bad, limit):
        # the sparse map itself is fold-free, but an 8 px grid sampled across a thin, strongly
        # compressed triangle (the mouth and jaw of a wide turn) can turn a cell over:
        # Laplacian-relax only the vertices of the cells that still fold
        n = 0
        while bad.any() and n < limit:
            n += 1
            k = np.zeros((len(ys), len(xs)), bool)
            k[:-1, :-1] |= bad; k[1:, :-1] |= bad; k[:-1, 1:] |= bad; k[1:, 1:] |= bad
            k[0, :] = k[-1, :] = False
            k[:, 0] = k[:, -1] = False
            for P in (PA, PB):
                avg = (np.roll(P, 1, 0) + np.roll(P, -1, 0) + np.roll(P, 1, 1) + np.roll(P, -1, 1)) / 4
                P[k] = 0.5 * P[k] + 0.5 * avg[k]
            bad = fold_cells(PA, PB)
        return bad, n
    PA, PB = grid_maps(r)
    bad = fold_cells(PA, PB)
    rounds = 0
    while bad.any() and rounds < 12:
        rounds += 1
        cy, cx = np.nonzero(bad)
        hit = np.zeros((H, W), np.float32)
        for y, x in zip(cy, cx):
            hit[int(ys[y]):int(ys[y + 1]) + 1, int(xs[x]):int(xs[x + 1]) + 1] = 1
        att = np.clip(cv2.GaussianBlur(hit, (0, 0), step * 1.5) * 4, 0, 1)
        r = r * (1 - 0.35 * att)[..., None]
        PA, PB = grid_maps(r)
        bad = fold_cells(PA, PB)
    HW = sample_field(hw, G)
    rn = np.linalg.norm(r, axis=-1)
    stats = {"pair": f"{a['id']}|{b['id']}", "foldRepairRounds": rounds,
             "residualP95px": round(float(np.percentile(rn[rn > 0.5], 95)) if (rn > 0.5).any() else 0.0, 2),
             "residualMaxpx": round(float(rn.max()), 2), "trusted": round(float(conf.mean()), 3)}
    bad, n = relax(PA, PB, bad, 200)
    stats.update({"relaxRounds": n, "folds": int(bad.sum())})
    if check_dir is not None:
        stats.update(check_pair(ca, cb, pa0, pb0, r, a["id"], b["id"], la, lb, check_dir))
    data = np.dstack([PA, PB, HW[..., None]]).astype("<f4")
    return data, stats, (len(xs), len(ys))


def check_pair(ca, cb, pa0, pb0, r, ida, idb, la, lb, d):
    """Midpoint mix of the two keys with the sparse map vs the dense map, and the face's registration error."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    G = np.dstack([xx, yy])
    Ad = remap(ca, sample_field(pa0, G - r / 2))
    Bd = remap(cb, sample_field(pb0, G + r / 2))
    As, Bs = remap(ca, pa0), remap(cb, pb0)
    mid = (la + lb) / 2
    x0, y0 = int(max(0, mid[:, 0].min() - 40)), int(max(0, mid[:, 1].min() - 60))
    x1, y1 = int(min(W, mid[:17, 0].max() + 40)), int(min(H, mid[:, 1].max() + 20))
    face = (slice(y0, y1), slice(x0, x1))
    both = lambda P, Q: (P[..., 3] > 200) & (Q[..., 3] > 200)
    def mad(P, Q):
        m = both(P, Q)[face]
        return float(np.abs(P[face][..., :3] - Q[face][..., :3]).mean(-1)[m].mean())
    out = {"faceMADsparse": round(mad(As, Bs), 2), "faceMADdense": round(mad(Ad, Bd), 2)}
    mix = lambda P, Q: np.clip((P[..., :3] + Q[..., :3]) / 2, 0, 255).astype(np.uint8)
    ey = int(mid[[0, 8], 1].mean())
    ex0, ex1 = int(max(0, min(mid[[0, 8, 9, 10], 0]) - 70)), int(min(W, max(mid[[0, 8, 9, 10], 0]) + 70))
    eye = (slice(max(0, ey - 80), ey + 80), slice(ex0, ex1))
    tiles = [mix(As, Bs)[eye], mix(Ad, Bd)[eye]]
    jy = int(mid[6, 1])
    jaw = (slice(max(0, jy - 200), min(H, jy + 60)), slice(x0, x1))
    sheet = np.vstack([np.hstack(tiles), np.hstack([mix(As, Bs)[jaw], mix(Ad, Bd)[jaw]])[:, :tiles[0].shape[1] * 2]]) if mix(As, Bs)[jaw].shape[1] * 2 == tiles[0].shape[1] * 2 else np.hstack(tiles)
    d.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.hstack(tiles)).save(d / f"{ida}__{idb}.eyes.png")
    Image.fromarray(np.hstack([mix(As, Bs)[jaw], mix(Ad, Bd)[jaw]])).save(d / f"{ida}__{idb}.jaw.png")
    Image.fromarray(np.hstack([mix(As, Bs), mix(Ad, Bd)])).resize((W, H // 2)).save(d / f"{ida}__{idb}.whole.jpg", quality=88)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["build"])
    ap.add_argument("--step", type=int, default=8)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--no-write-rig", action="store_true")
    args = ap.parse_args()
    rig = json.loads(RIG.read_text(encoding="utf-8"))
    keys = sorted(rig["keys"], key=lambda k: k["yawDeg"])
    wm = rig["artMeta"]["v3"]["warp"]
    fixed = np.array(wm["frame"] + wm["pins"], np.float64)
    OUT.mkdir(parents=True, exist_ok=True)
    pairs, report = {}, []
    for a, b in zip(keys, keys[1:]):
        tag = f"{a['id']}__{b['id']}"
        if args.only and tag not in args.only.split(","):
            continue
        data, stats, (nx, ny) = build_pair(rig, a, b, fixed, args.step, OUT / "check" if args.check else None)
        (OUT / f"{tag}.bin").write_bytes(data.tobytes())
        pairs[f"{a['id']}|{b['id']}"] = f"v4/flow/{tag}.bin"
        report.append(stats)
        print(json.dumps(stats))
    (OUT / "report.json").write_text(json.dumps(report, indent=1), encoding="utf-8")
    if not args.no_write_rig and not args.only:
        xs, ys = grid(args.step)
        rig["artMeta"]["v4"]["flow"] = {
            "_readme": "tools/gen/rig-flow.py: per adjacent pair a midpoint grid (nx * ny vertices, row-major), float32 LE per vertex: pA.x, pA.y (texel in the lower-yaw key), pB.x, pB.y (texel in the higher), headW (1 = rides the head's sway, 0 = the chest's). At bracket weight g a vertex is drawn at (1 - g) pA + g pB.",
            "nx": len(xs), "ny": len(ys), "step": args.step, "pairs": pairs,
        }
        RIG.write_text(json.dumps(rig, indent=2) + chr(10), encoding="utf-8")


if __name__ == "__main__":
    main()
