"""Living portrait v5 PILOT, method (d) (docs/plans/living-portrait-v5-method.md): grow yaw keys out of the plate
every 10 degrees by pushing the previous key through the dense pair flow the v4.1 rig already has
(art/v4/flow, rig-flow.py), and mark the holes the push cannot carry for a LoRA repaint of those pixels only.

Game case: both (the pause is shared plumbing; the pilot plate is the Yuna X-2 one). Pilot tooling: the phase-1
builder moves this file to tools/gen/rig-chain.py (the review: new pair logic here, not in the 418-line rig-flow.py).

The v4 keys are POSE GUIDES only: a step K -> K+10 moves every grid vertex of the pair (frontal|v4-r20 on the right,
v4-l20|frontal on the left) from g_K to g_K+10 ((1 - g) pA + g pB, the runtime's own interpolation) and carries key
K's texels with it. Their paint is never used. Holes = union of
  uncovered   no triangle lands on the pixel (disocclusion)
  stretch     the area scale since the pixel was last painted leaves [0.7, 1.3]
  fb          forward-backward disagreement of the step's own map > 2.5 px (rig-flow FB_TOL)
inside the head. The derived pair meshes are written for the runtime (each key registered to its neighbour by
construction: the same vertices at their two g's).

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY rig-chain.py propagate --side r --to 10        # plate -> v5-r10: warped layers, holes, init + mask
    $PY rig-chain.py merge --key v5-r10 --cands <png> <png> ...   # candidates -> offline cut metric + 1:1 sheet
    $PY rig-chain.py pick --key v5-r10 --cand <png>     # the pick becomes the key (or --none: warp only)
    $PY rig-chain.py rig --out <proto>/art              # pilot rig.json + v5 layers + pair meshes
"""
from __future__ import annotations

import argparse
import json
import pathlib
import shutil

import cv2
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve()
PROTO = HERE.parents[3]
ART = PROTO / "art"
RIG = ART / "rig.json"
WORK = pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v5")
W, H = 832, 1216
FB_TOL = 2.5
STRETCH = (0.7, 1.3)
GROW, FEATHER = 8, 6
IRIS_TRAVEL_X = 11.0  # src/motion.ts IRIS_TRAVEL_PX[0], at yawNorm 1 = 85 degrees (the v4.1 range)
# side -> (pair file, pair id, g of the plate, the g of each 10-degree step)
CHAINS = {
    "r": ("frontal__v4-r20", "frontal|v4-r20", 0.0, {10: 0.5, 20: 1.0}),
    "l": ("v4-l20__frontal", "v4-l20|frontal", 1.0, {10: 0.5, 20: 0.0}),
}
TASSEL_DX = {"frontal": 0.0, "v4-r20": 29.0, "v4-l20": 12.0}


def kid(side, deg):
    return "frontal" if deg == 0 else f"v5-{side}{deg}"


def rgba(path):
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)


def save(path, img):
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(img + 0.5, 0, 255).astype(np.uint8)).save(path)


def over(dst, src):
    """Straight-alpha src over dst (both canvas RGBA float 0..255), in place."""
    a = src[..., 3:4] / 255.0
    da = dst[..., 3:4] / 255.0
    oa = a + da * (1 - a)
    rgb = (src[..., :3] * a + dst[..., :3] * da * (1 - a)) / np.maximum(oa, 1e-6)
    dst[..., :3] = np.where(oa > 0, rgb, 0)
    dst[..., 3:4] = oa * 255


def placed(path, box, dx=0.0, dy=0.0):
    """A trimmed layer on the canvas at its box (+ a sub-pixel shift), premultiplied-safe."""
    im = rgba(path)
    pm = im.copy()
    pm[..., :3] *= im[..., 3:4] / 255.0
    M = np.float32([[1, 0, box[0] + dx], [0, 1, box[1] + dy]])
    out = cv2.warpAffine(pm, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return unpremul(out)


def unpremul(pm):
    out = pm.copy()
    a = np.maximum(pm[..., 3:4], 1e-6) / 255.0
    out[..., :3] = np.where(pm[..., 3:4] > 1e-3, pm[..., :3] / a, 0)
    return out


def plate_layers(rig, iris_dx):
    """The plate's head as two layers: hairBack (behind the body) and front (headCore .. strands), no tassel."""
    v3 = rig["artMeta"]["v3"]
    hb = np.zeros((H, W, 4), np.float32)
    fr = np.zeros((H, W, 4), np.float32)
    behind = True
    for l in v3["frontal"]["layers"]:
        if l["name"] == "earring":
            continue
        if l["motion"] == "chest":
            behind = False
            continue
        over(hb if behind else fr, placed(ART / l["file"], l["box"], iris_dx if l["motion"] == "iris" else 0.0))
    return hb, fr


def body_turned(rig):
    b = rig["artMeta"]["v3"]["frontal"]["bodyTurned"]
    return placed(ART / b["file"], b["box"])


def tassel(rig, dx):
    e = next(l for l in rig["artMeta"]["v3"]["frontal"]["layers"] if l["name"] == "earring")
    return placed(ART / e["file"], e["box"], dx)


GUIDE = {"sigma": 0.0}  # px; > 0: the pair's displacement low-passed (the plate side's texels are kept)


def load_pair(tag):
    meta = json.loads(RIG.read_text(encoding="utf-8"))["artMeta"]["v4"]["flow"]
    nx, ny, step = meta["nx"], meta["ny"], meta["step"]
    d = np.fromfile(ART / "v4/flow" / f"{tag}.bin", "<f4").reshape(ny, nx, 5).astype(np.float64)
    PA, PB = d[..., 0:2], d[..., 2:4]
    s = GUIDE["sigma"]
    if s > 0:
        # the dense residual registers two DIFFERENT paintings strand by strand; pushed through one painting it
        # wobbles the strands (the pilot's first look). Low-pass the displacement, keep the plate's own texels,
        # and keep rig-flow's frame rule (no motion across the left/right edges, none across the top).
        dsp = PB - PA
        sm = np.dstack([cv2.GaussianBlur(dsp[..., c].astype(np.float32), (0, 0), s / step, borderType=cv2.BORDER_REFLECT) for c in range(2)])
        band = 96.0
        sst = lambda e: (lambda c: c * c * (3 - 2 * c))(np.clip(e / band, 0, 1))
        plate = PA if tag.startswith("frontal") else PB
        kx, ky = sst(np.minimum(plate[..., 0], W - plate[..., 0])), sst(plate[..., 1])
        sm = sm * np.dstack([kx, ky])
        if tag.startswith("frontal"):
            PB = PA + sm
        else:
            PA = PB - sm
    return PA, PB, d[..., 4], nx, ny


def tris(nx, ny):
    i = (np.arange(ny - 1)[:, None] * nx + np.arange(nx - 1)[None, :]).ravel()
    return np.vstack([np.c_[i, i + 1, i + nx], np.c_[i + 1, i + nx + 1, i + nx]])


def raster(P, vals, T, K=24):
    """Rasterize triangles T with vertex positions P (N, 2) and per-vertex values vals (N, C), linear inside.
    Returns field (H, W, C) and a coverage mask. Triangles wider than K px are split off into a slower pass."""
    C = vals.shape[1]
    field = np.zeros((H, W, C), np.float64)
    cov = np.zeros((H, W), bool)
    p0, p1, p2 = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
    x0 = np.floor(np.minimum.reduce([p0[:, 0], p1[:, 0], p2[:, 0]])).astype(int)
    y0 = np.floor(np.minimum.reduce([p0[:, 1], p1[:, 1], p2[:, 1]])).astype(int)
    x1 = np.ceil(np.maximum.reduce([p0[:, 0], p1[:, 0], p2[:, 0]])).astype(int)
    y1 = np.ceil(np.maximum.reduce([p0[:, 1], p1[:, 1], p2[:, 1]])).astype(int)
    d = (p1[:, 1] - p2[:, 1]) * (p0[:, 0] - p2[:, 0]) + (p2[:, 0] - p1[:, 0]) * (p0[:, 1] - p2[:, 1])
    ok = np.abs(d) > 1e-9
    size = np.maximum(x1 - x0, y1 - y0) + 1
    for sel, k in ((ok & (size <= K), K), (ok & (size > K), int(size[ok].max()) if ok.any() else K)):
        idx = np.nonzero(sel)[0]
        chunk = max(1, 1_000_000 // (k * k))
        for c0 in range(0, len(idx), chunk):
            t = idx[c0:c0 + chunk]
            oy, ox = np.mgrid[0:k, 0:k]
            px = x0[t, None] + ox.ravel()[None, :]
            py = y0[t, None] + oy.ravel()[None, :]
            xx, yy = px + 0.0, py + 0.0
            a, b, c = p0[t], p1[t], p2[t]
            u = ((b[:, 1] - c[:, 1])[:, None] * (xx - c[:, 0][:, None]) + (c[:, 0] - b[:, 0])[:, None] * (yy - c[:, 1][:, None])) / d[t][:, None]
            v = ((c[:, 1] - a[:, 1])[:, None] * (xx - c[:, 0][:, None]) + (a[:, 0] - c[:, 0])[:, None] * (yy - c[:, 1][:, None])) / d[t][:, None]
            w = 1 - u - v
            inside = (u >= -1e-7) & (v >= -1e-7) & (w >= -1e-7) & (px >= 0) & (px < W) & (py >= 0) & (py < H)
            ti, pi = np.nonzero(inside)
            tt = t[ti]
            val = (u[ti, pi, None] * vals[T[tt, 0]] + v[ti, pi, None] * vals[T[tt, 1]] + w[ti, pi, None] * vals[T[tt, 2]])
            field[py[ti, pi], px[ti, pi]] = val
            cov[py[ti, pi], px[ti, pi]] = True
    return field, cov


def tri_area(P, T):
    a, b, c = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
    return 0.5 * ((b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0]))


def step_map(side, g0, g1):
    """The step's maps: backward (dst pixel -> src texel), forward (src pixel -> dst), per-pixel area scale."""
    tag, _, _, _ = CHAINS[side]
    PA, PB, _, nx, ny = load_pair(tag)
    S = (PA + g0 * (PB - PA)).reshape(-1, 2)
    D = (PA + g1 * (PB - PA)).reshape(-1, 2)
    T = tris(nx, ny)
    det = tri_area(D, T) / np.where(np.abs(tri_area(S, T)) < 1e-9, 1e-9, tri_area(S, T))
    # per-vertex area scale = mean over its triangles (the raster interpolates it)
    acc = np.zeros(len(S))
    cnt = np.zeros(len(S))
    for j in range(3):
        np.add.at(acc, T[:, j], det)
        np.add.at(cnt, T[:, j], 1)
    back, cov = raster(D, np.c_[S, acc / np.maximum(cnt, 1)], T)
    fwd, _ = raster(S, D, T)
    return back, fwd, cov


def remap(img, bmap):
    if img.ndim == 2 or img.shape[2] != 4:
        return cv2.remap(img.astype(np.float32), bmap[..., 0].astype(np.float32), bmap[..., 1].astype(np.float32),
                         cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    pm = img.copy()
    pm[..., :3] *= img[..., 3:4] / 255.0
    out = cv2.remap(pm.astype(np.float32), bmap[..., 0].astype(np.float32), bmap[..., 1].astype(np.float32),
                    cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return unpremul(out)


def keydir(k):
    return WORK / "keys" / k


def load_key(rig, k, iris_dx):
    if k == "frontal":
        hb, fr = plate_layers(rig, iris_dx)
        return hb, fr, np.ones((H, W), np.float32)
    d = keydir(k)
    return rgba(d / "hairback.png"), rgba(d / "front.png"), np.load(d / "scale.npy")


def composite(rig, hb, fr, dx):
    c = np.zeros((H, W, 4), np.float32)
    for layer in (hb, body_turned(rig), fr, tassel(rig, dx)):
        over(c, layer)
    return c


def white(c):
    return c[..., :3] * (c[..., 3:4] / 255) + 255 * (1 - c[..., 3:4] / 255)


def tassel_dx(side, deg):
    far = TASSEL_DX["v4-r20" if side == "r" else "v4-l20"]
    return far * deg / 20.0


def propagate(args, rig):
    side, to = args.side, args.to
    tag, _, g_plate, gs = CHAINS[side]
    frm = to - 10
    g0 = g_plate if frm == 0 else gs[frm]
    g1 = gs[to]
    src = kid(side, frm)
    iris = (1 if side == "r" else -1) * IRIS_TRAVEL_X * 10 / 85.0
    hb, fr, scale = load_key(rig, src, iris)
    bmap, fmap, cov = step_map(side, g0, g1)
    hb2, fr2 = remap(hb, bmap[..., :2]), remap(fr, bmap[..., :2])
    sc2 = remap(scale, bmap[..., :2]) * bmap[..., 2]
    sc2 = np.where(cov, sc2, 1.0).astype(np.float32)
    # forward-backward: F(B(q)) should land on q
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    fb_pt = np.dstack([cv2.remap(fmap[..., c].astype(np.float32), bmap[..., 0].astype(np.float32), bmap[..., 1].astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) for c in range(2)])
    fb = np.hypot(fb_pt[..., 0] - xx, fb_pt[..., 1] - yy)
    head = (np.maximum(hb2[..., 3], fr2[..., 3]) > 127)
    uncovered = ~cov & head
    stretch = ((sc2 < STRETCH[0]) | (sc2 > STRETCH[1])) & head
    fbbad = (fb > FB_TOL) & head
    holes = uncovered | stretch | fbbad
    dx = tassel_dx(side, to)
    comp = composite(rig, hb2, fr2, dx)
    grown = cv2.dilate(holes.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * GROW + 1, 2 * GROW + 1))) > 0 if holes.any() else holes
    k = kid(side, to)
    d = keydir(k)
    d.mkdir(parents=True, exist_ok=True)
    save(d / "warp.hairback.png", hb2)
    save(d / "warp.front.png", fr2)
    np.save(d / "warp.scale.npy", sc2)
    np.save(d / "holes.npy", holes)
    np.save(d / "grown.npy", grown)
    Image.fromarray(np.clip(white(comp), 0, 255).astype(np.uint8)).save(d / "init.png")
    Image.fromarray((grown * 255).astype(np.uint8)).save(d / "mask.png")
    vis = white(comp).copy()
    vis[holes] = vis[holes] * 0.35 + np.array([255, 0, 255]) * 0.65
    Image.fromarray(np.clip(vis, 0, 255).astype(np.uint8)).save(d / "holes.png")
    hn = int(head.sum())
    rep = {"key": k, "from": src, "pair": CHAINS[side][1], "g": [g0, g1], "irisDxBakedPx": round(iris, 2) if src == "frontal" else "inherited",
           "headPx": hn, "holeShare": round(holes.sum() / hn, 4), "grownShare": round(float((grown & head).sum()) / hn, 4),
           "uncoveredShare": round(uncovered.sum() / hn, 4), "stretchShare": round(stretch.sum() / hn, 4), "fbShare": round(fbbad.sum() / hn, 4),
           "scaleRange": [round(float(sc2[head].min()), 3), round(float(sc2[head].max()), 3)], "fbMaxPx": round(float(fb[head].max()), 2),
           "tasselDx": dx}
    (d / "propagate.json").write_text(json.dumps(rep, indent=1), encoding="utf-8")
    print(json.dumps(rep))


def feather_mask(grown):
    dist = cv2.distanceTransform(grown.astype(np.uint8), cv2.DIST_L2, 5)
    return np.clip(dist / FEATHER, 0, 1).astype(np.float32)


def grown_mask(d):
    """The repaint mask: all holes, or (--mag-only) only the pixels the push MAGNIFIED (scale > 1.3; fb and
    uncovered stay in): a compressed pixel lost nothing, so it keeps the painting it has."""
    if not GUIDE.get("magOnly"):
        return np.load(d / "grown.npy")
    holes = np.load(d / "holes.npy") & ~(np.load(d / "warp.scale.npy") < STRETCH[0])
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * GROW + 1, 2 * GROW + 1))
    return cv2.dilate(holes.astype(np.uint8), k) > 0


def merged(rig, k, cand):
    """The warped key with a candidate's pixels in its (grown, feathered) holes: opaque paint only, never under
    the tassel or the body, never the silhouette's alpha."""
    d = keydir(k)
    side, deg = k[3], int(k[4:])
    hb, fr = rgba(d / "warp.hairback.png"), rgba(d / "warp.front.png")
    if cand is None:
        return hb, fr
    f = feather_mask(grown_mask(d))
    tas = tassel(rig, tassel_dx(side, deg))[..., 3] / 255.0
    body = body_turned(rig)[..., 3] / 255.0
    pick = np.asarray(Image.open(cand).convert("RGB")).astype(np.float32)
    ff = f * (1 - tas) * (fr[..., 3] >= 250)
    fh = f * (1 - tas) * (1 - body) * (fr[..., 3] <= 5) * (hb[..., 3] >= 250)
    fr2, hb2 = fr.copy(), hb.copy()
    fr2[..., :3] = fr[..., :3] * (1 - ff[..., None]) + pick * ff[..., None]
    hb2[..., :3] = hb[..., :3] * (1 - fh[..., None]) + pick * fh[..., None]
    return hb2, fr2


def cut_metric(rig, k, hb, fr):
    """Offline swap estimate: key K+10 warped back to the bracket midpoint vs key K warped forward to it,
    MAD over the head box (x 96..832, y 0..800) and the face box (x 250..700, y 330..720)."""
    side, deg = k[3], int(k[4:])
    tag, _, g_plate, gs = CHAINS[side]
    frm = deg - 10
    gk = g_plate if frm == 0 else gs[frm]
    gm = (gk + gs[deg]) / 2
    phb, pfr, _ = load_key(rig, kid(side, frm), (1 if side == "r" else -1) * IRIS_TRAVEL_X * 10 / 85.0)
    b_prev, _, _ = step_map(side, gk, gm)
    b_this, _, _ = step_map(side, gs[deg], gm)
    dx = tassel_dx(side, deg - 5)
    A = composite(rig, remap(phb, b_prev[..., :2]), remap(pfr, b_prev[..., :2]), dx)
    B = composite(rig, remap(hb, b_this[..., :2]), remap(fr, b_this[..., :2]), dx)
    a, b = white(A), white(B)
    head = np.abs(a[0:800, 96:832] - b[0:800, 96:832]).mean()
    face = np.abs(a[330:720, 250:700] - b[330:720, 250:700]).mean()
    return round(float(head), 3), round(float(face), 3), a, b


def merge(args, rig):
    k = args.key
    d = keydir(k)
    rows, tiles = [], []
    for c in [None] + args.cands:
        hb, fr = merged(rig, k, c)
        hm, fm, a, b = cut_metric(rig, k, hb, fr)
        rows.append({"cand": c or "warp only (no repaint)", "cutHeadMAD": hm, "cutFaceMAD": fm})
        comp = white(composite(rig, hb, fr, tassel_dx(k[3], int(k[4:]))))
        tiles.append(comp[300:760, 180:700])
        print(json.dumps(rows[-1]))
    grid = [np.hstack(tiles[i:i + 4] + [np.full_like(tiles[0], 255)] * (4 - len(tiles[i:i + 4]))) for i in range(0, len(tiles), 4)]
    sfx = "-mag" if GUIDE.get("magOnly") else ""
    Image.fromarray(np.clip(np.vstack(grid), 0, 255).astype(np.uint8)).save(d / f"cands-1to1{sfx}.png")
    (d / f"merge{sfx}.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")


def pick(args, rig):
    k = args.key
    d = keydir(k)
    hb, fr = merged(rig, k, None if args.none else args.cand)
    save(d / "hairback.png", hb)
    save(d / "front.png", fr)
    sc = np.load(d / "warp.scale.npy")
    if not args.none:
        sc = np.where(grown_mask(d), 1.0, sc).astype(np.float32)  # repainted: fresh paint
    np.save(d / "scale.npy", sc)
    (d / "pick.json").write_text(json.dumps({"key": k, "pick": None if args.none else str(args.cand), "magOnly": bool(GUIDE.get("magOnly")),
                                             "repaintShareOfHead": (lambda hd: round(float((grown_mask(d) & hd).sum() / hd.sum()), 4))((fr[..., 3] > 127) | (hb[..., 3] > 127)) if not args.none else 0}), encoding="utf-8")
    print("picked", k, args.cand)


def trim(img):
    ys, xs = np.nonzero(img[..., 3] > 0)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    return img[y0:y1, x0:x1], [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def points_map(side, g0, g1, pts):
    """Landmarks (or any points) of the key at g0 carried to g1 by the same mesh."""
    _, fwd, _ = step_map(side, g0, g1)
    p = np.clip(np.asarray(pts, np.float64), 0, [W - 1, H - 1])
    return [[round(float(cv2.getRectSubPix(fwd[..., c].astype(np.float32), (1, 1), (float(x), float(y)))[0, 0]), 1) for c in range(2)] for x, y in p]


def build_rig(args, rig):
    out = pathlib.Path(args.out)
    sides = args.sides.split(",")
    new = json.loads(json.dumps(rig))
    fr_key = next(k for k in rig["keys"] if k["id"] == "frontal")
    keys, v3keys, pairs, dxs, faceover = [fr_key], {}, {}, {"frontal": 0.0}, {"frontal": rig["artMeta"]["v4"]["tassel"]["faceOver"]["frontal"]}
    fo_src = rig["artMeta"]["v4"]["tassel"]["faceOver"]["frontal"]
    fo_plate = placed(ART / fo_src["file"], fo_src["box"])
    for side in sides:
        tag, _, g_plate, gs = CHAINS[side]
        PA, PB, HW, nx, ny = load_pair(tag)
        seq = [(0, g_plate)] + sorted(gs.items())
        for (d0, ga), (d1, gb) in zip(seq, seq[1:]):
            lo, hi = (kid(side, d0), kid(side, d1)) if side == "r" else (kid(side, d1), kid(side, d0))
            glo, ghi = (ga, gb) if side == "r" else (gb, ga)
            data = np.dstack([PA + glo * (PB - PA), PA + ghi * (PB - PA), HW[..., None]]).astype("<f4")
            (out / "v5/flow").mkdir(parents=True, exist_ok=True)
            (out / "v5/flow" / f"{lo}__{hi}.bin").write_bytes(data.tobytes())
            pairs[f"{lo}|{hi}"] = f"v5/flow/{lo}__{hi}.bin"
        for deg, g in sorted(gs.items()):
            k = kid(side, deg)
            d = keydir(k)
            hb, fr = rgba(d / "hairback.png"), rgba(d / "front.png")
            back = hb.copy()
            over(back, fr)
            ent = {}
            for part, img in (("back", back), ("front", fr)):
                t, box = trim(img)
                save(out / "v5/layers" / k / f"{part}.png", t)
                ent[part] = {"file": f"v5/layers/{k}/{part}.png", "box": box}
            v3keys[k] = ent
            keys.append({"id": k, "yawDeg": deg if side == "r" else -deg, "file": ent["front"]["file"],
                         "landmarks": points_map(side, g_plate, g, fr_key["landmarks"])})
            dxs[k] = tassel_dx(side, deg)
            if side == "l":
                # the cheek over the tassel: the plate's faceover region carried to the key, filled with the key's own front
                bmap, _, _ = step_map(side, g_plate, g)
                fo = remap(fo_plate, bmap[..., :2])
                fo[..., :3] = fr[..., :3]
                fo[..., 3] = np.minimum(fo[..., 3], fr[..., 3])
                t, box = trim(fo)
                save(out / "v5/layers" / k / "faceover.png", t)
                faceover[k] = {"file": f"v5/layers/{k}/faceover.png", "box": box}
    new["keys"] = sorted(keys, key=lambda k: k["yawDeg"])
    new["artMeta"]["v3"]["keys"] = v3keys
    new["artMeta"]["v3"]["keyPatches"] = {}
    new["artMeta"]["v3"]["keyLids"] = {}
    new["artMeta"]["v4"]["flow"]["pairs"] = pairs
    new["artMeta"]["v4"]["tassel"]["dx"] = dxs
    new["artMeta"]["v4"]["tassel"]["faceOver"] = faceover
    new["artMeta"]["v5pilot"] = {"method": "d: keys grown from the plate every 10 degrees, holes repainted, hard cut",
                                 "picks": {k: json.loads((keydir(k) / "pick.json").read_text()) for k in v3keys}}
    (out / "rig.json").write_text(json.dumps(new, indent=1) + "\n", encoding="utf-8")
    print("rig:", [k["id"] for k in new["keys"]], "pairs:", list(pairs))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["propagate", "merge", "pick", "rig"])
    ap.add_argument("--side", choices=["r", "l"])
    ap.add_argument("--to", type=int)
    ap.add_argument("--key")
    ap.add_argument("--cands", nargs="*", default=[])
    ap.add_argument("--cand")
    ap.add_argument("--none", action="store_true")
    ap.add_argument("--out")
    ap.add_argument("--sides", default="r")
    ap.add_argument("--sigma", type=float, default=0.0, help="px; low-pass the guide's displacement (0 = the dense flow as is)")
    ap.add_argument("--work", default=str(WORK))
    ap.add_argument("--mag-only", action="store_true", help="repaint only magnified holes (compressed pixels keep their paint)")
    a = ap.parse_args()
    GUIDE["sigma"] = a.sigma
    GUIDE["magOnly"] = a.mag_only
    globals()["WORK"] = pathlib.Path(a.work)
    rig = json.loads(RIG.read_text(encoding="utf-8"))
    {"propagate": propagate, "merge": merge, "pick": pick, "rig": build_rig}[a.cmd](a, rig)


if __name__ == "__main__":
    main()
