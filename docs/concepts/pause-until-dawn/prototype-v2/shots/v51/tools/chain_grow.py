"""Living portrait v5.1 (game case: both): grow one key 10 degrees out of the one before it (method (d)).

A step K -> K+10 pushes key K through the v4.1 pair mesh at the half step (chain_core.STEPS) and carries WITH it,
through the very same map: the key's hair-back and front, its map back to the plate (the neck is re-drawn from the
plate through it, eased to none at the collar: chain_face.py; never repainted), every
expression patch of key K (8 lid frames, 4 mouths, 2 brows: the pilot's grown keys had none, so they could not
blink), the area scale since the paint was last fresh, and the tassel anchor. Holes = uncovered | stretch outside
[0.7, 1.3] | forward-backward > 2.5 px, inside the head; the LoRA repaints those (chain-repaint.mjs) and nothing else.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY chain_grow.py propagate --side r --to 30
    $PY chain_grow.py merge --key v5-r30 --cands <png> ...       # offline cut estimate + a 1:1 candidate sheet
    $PY chain_grow.py pick --key v5-r30 --cand <png> [--mag-only] # (or --none: the push alone)
"""
from __future__ import annotations

import argparse
import json

import cv2
import numpy as np
from PIL import Image

import chain_core as C
import chain_face as F

OPT = {"magOnly": False}


def iris_dx(side):
    return (1 if side == "r" else -1) * C.IRIS_TRAVEL_X * 10 / 85.0


def plate_key(rig, idx, plain_hb=False):
    """The plate as a key: hair-back (behind the body; with the repainted tassel footprint once chain_face made it),
    front (headCore .. strands, no tassel), the neck, and the map back to itself (identity)."""
    hb = np.zeros((C.H, C.W, 4), np.float32)
    fr = np.zeros((C.H, C.W, 4), np.float32)
    behind = True
    for l in F.frontal_layers(rig):
        if l["name"] == "earring":
            continue
        if l["motion"] == "chest":
            behind = False
            continue
        C.over(hb if behind else fr, C.placed(C.ART / l["file"], l["box"], idx if l["motion"] == "iris" else 0.0))
    if not plain_hb and (C.WORK / "face/hairback-fp.png").exists():
        hb = C.rgba(C.WORK / "face/hairback-fp.png")
    patches = {k: v[0] for k, v in F.plate_patches(rig).items()}
    yy, xx = np.mgrid[0:C.H, 0:C.W].astype(np.float32)
    return {"hb": hb, "fr": fr, "neck": face_layer("neck"), "scale": np.ones((C.H, C.W), np.float32), "patches": patches,
            "anchor": F.tassel_anchor(rig), "cmap": np.dstack([xx, yy])}


def face_layer(name):
    return C.placed(C.WORK / f"face/{name}.png", json.loads((C.WORK / "face/neck.json").read_text())[name]["box"])


def neck_for(cmap):
    """The plate's neck drawn through the key's map back to the plate, eased from the full map (down to the chin) to
    none (the collar)."""
    yy, xx = np.mgrid[0:C.H, 0:C.W].astype(np.float32)
    w = F.neck_weight(yy)[..., None].astype(np.float32)
    grid = np.dstack([xx, yy])
    return C.remap(face_layer("neck"), grid + w * (cmap - grid))


def load_key(rig, k, idx=0.0):
    if k == "frontal":
        return plate_key(rig, idx)
    d = C.keydir(k)
    pj = json.loads((d / "propagate.json").read_text())
    patches = {n: C.rgba(d / "patches" / f"{n.replace('/', '__')}.png") for n in pj["patches"]}
    return {"hb": C.rgba(d / "hairback.png"), "fr": C.rgba(d / "front.png"), "neck": C.rgba(d / "neck.png"),
            "scale": np.load(d / "scale.npy"), "patches": patches, "anchor": pj["anchor"], "cmap": np.load(d / "cmap.npy")}


def body_clean():
    """The pinned body of a turned key: the tassel footprint filled (rig-collar.py), the neck taken out (chain_face)."""
    return face_layer("turned-minus")


def tassel(rig, anchor_dx):
    e = next(l for l in F.frontal_layers(rig) if l["name"] == "earring")
    return C.placed(C.ART / e["file"], e["box"], anchor_dx)


def composite(rig, key, dx, patch=None):
    c = np.zeros((C.H, C.W, 4), np.float32)
    layers = [key["hb"], body_clean(), key["neck"], key["fr"]]
    if patch is not None:
        layers.append(key["patches"][patch])
    for layer in layers + [tassel(rig, dx)]:
        C.over(c, layer)
    return c


def propagate(args, rig):
    side, to = args.side, args.to
    frm = to - 10
    src = C.kid(side, frm)
    K = load_key(rig, src, iris_dx(side))
    bmap, fmap, cov = C.step_map(side, to)
    bm = bmap[..., :2]
    hb2, fr2 = C.remap(K["hb"], bm), C.remap(K["fr"], bm)
    cmap2 = np.dstack([cv2.remap(K["cmap"][..., c], bm[..., 0].astype(np.float32), bm[..., 1].astype(np.float32),
                                 cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) for c in range(2)])
    neck2 = neck_for(cmap2)
    sc2 = np.where(cov, C.remap(K["scale"], bm) * bmap[..., 2], 1.0).astype(np.float32)
    yy, xx = np.mgrid[0:C.H, 0:C.W].astype(np.float64)
    fb_pt = np.dstack([cv2.remap(fmap[..., c].astype(np.float32), bm[..., 0].astype(np.float32), bm[..., 1].astype(np.float32),
                                 cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) for c in range(2)])
    fb = np.hypot(fb_pt[..., 0] - xx, fb_pt[..., 1] - yy)
    head = np.maximum(hb2[..., 3], fr2[..., 3]) > 127
    uncovered = ~cov & head
    stretch = ((sc2 < C.STRETCH[0]) | (sc2 > C.STRETCH[1])) & head
    fbbad = (fb > C.FB_TOL) & head
    holes = uncovered | stretch | fbbad
    grown = cv2.dilate(holes.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * C.GROW + 1,) * 2)) > 0
    anchor = C.points_step(side, to, [K["anchor"]])[0]
    dx = anchor[0] - F.tassel_anchor(rig)[0]
    k = C.kid(side, to)
    d = C.keydir(k)
    d.mkdir(parents=True, exist_ok=True)
    C.save(d / "warp.hairback.png", hb2)
    C.save(d / "warp.front.png", fr2)
    C.save(d / "neck.png", neck2)
    np.save(d / "cmap.npy", cmap2.astype(np.float32))
    np.save(d / "warp.scale.npy", sc2)
    np.save(d / "holes.npy", holes)
    np.save(d / "grown.npy", grown)
    pover = {}
    for n, p in K["patches"].items():
        p2 = C.remap(p, bm)
        C.save(d / "patches" / f"{n.replace('/', '__')}.png", p2)
        pa = p2[..., 3] > 8
        pover[n] = round(float((pa & grown).sum()) / max(1, int(pa.sum())), 4)
    key = {"hb": hb2, "fr": fr2, "neck": neck2, "patches": {}}
    comp = composite(rig, key, dx)
    Image.fromarray(np.clip(C.white(comp), 0, 255).astype(np.uint8)).save(d / "init.png")
    Image.fromarray((grown * 255).astype(np.uint8)).save(d / "mask.png")
    vis = C.white(comp).copy()
    vis[holes] = vis[holes] * 0.35 + np.array([255, 0, 255]) * 0.65
    Image.fromarray(np.clip(vis, 0, 255).astype(np.uint8)).save(d / "holes.png")
    hn = int(head.sum())
    rep = {"key": k, "from": src, "step": list(C.step_of(side, to)), "headPx": hn,
           "holeShare": round(holes.sum() / hn, 4), "grownShare": round(float((grown & head).sum()) / hn, 4),
           "uncoveredShare": round(uncovered.sum() / hn, 4), "stretchShare": round(stretch.sum() / hn, 4), "fbShare": round(fbbad.sum() / hn, 4),
           "scaleRange": [round(float(sc2[head].min()), 3), round(float(sc2[head].max()), 3)], "fbMaxPx": round(float(fb[head].max()), 2),
           "anchor": [round(anchor[0], 2), round(anchor[1], 2)], "tasselDx": round(dx, 2),
           "patches": sorted(K["patches"]), "patchInGrownHoles": pover}
    (d / "propagate.json").write_text(json.dumps(rep, indent=1), encoding="utf-8")
    print(json.dumps({x: rep[x] for x in ("key", "holeShare", "grownShare", "stretchShare", "uncoveredShare", "fbShare", "tasselDx")}),
          "patch-in-holes max", max(pover.values()))


def feather_mask(grown):
    dist = cv2.distanceTransform(grown.astype(np.uint8), cv2.DIST_L2, 5)
    return np.clip(dist / C.FEATHER, 0, 1).astype(np.float32)


def protect_mask(d):
    """v5.1: the eyes, brows and mouth never take new paint (the union of the key's pushed expression patches, grown
    4 px): a repainted eye would no longer match the lid frames pushed with it (a double lash line on the blink) and
    could change the iris (identity). A magnified feature stays the plate's own, a little softer."""
    pj = json.loads((d / "propagate.json").read_text())
    u = np.zeros((C.H, C.W), bool)
    for n in pj["patches"]:
        u |= C.rgba(d / "patches" / f"{n.replace('/', '__')}.png")[..., 3] > 8
    return cv2.dilate(u.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0


def grown_mask(d):
    """All holes, or (--mag-only) only what the push MAGNIFIED (compressed pixels lost nothing: they keep their paint);
    never the protected features."""
    if not OPT["magOnly"]:
        g = np.load(d / "grown.npy")
    else:
        holes = np.load(d / "holes.npy") & ~(np.load(d / "warp.scale.npy") < C.STRETCH[0])
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * C.GROW + 1,) * 2)
        g = cv2.dilate(holes.astype(np.uint8), k) > 0
    return g & ~protect_mask(d) if OPT.get("protect") else g


def write_mask(args, rig):
    """The mask the LoRA actually paints (the merge's own mask): mask-rep.png next to init.png."""
    d = C.keydir(args.key)
    g = grown_mask(d)
    hb, fr = C.rgba(d / "warp.hairback.png"), C.rgba(d / "warp.front.png")
    hd = (fr[..., 3] > 127) | (hb[..., 3] > 127)
    Image.fromarray((g * 255).astype(np.uint8)).save(d / "mask-rep.png")
    print(json.dumps({"key": args.key, "repaintShareOfHead": round(float((g & hd).sum() / hd.sum()), 4), "magOnly": OPT["magOnly"], "protect": OPT.get("protect", False)}))


def merged(rig, k, cand):
    """The pushed key with a candidate's pixels in its feathered holes: opaque paint only, never under the tassel,
    the body or the neck, never the silhouette's alpha."""
    d = C.keydir(k)
    pj = json.loads((d / "propagate.json").read_text())
    hb, fr = C.rgba(d / "warp.hairback.png"), C.rgba(d / "warp.front.png")
    if cand is None:
        return hb, fr
    f = feather_mask(grown_mask(d))
    tas = tassel(rig, pj["tasselDx"])[..., 3] / 255.0
    body = np.maximum(body_clean()[..., 3], C.rgba(d / "neck.png")[..., 3]) / 255.0
    pick = np.asarray(Image.open(cand).convert("RGB")).astype(np.float32)
    ff = f * (1 - tas) * (fr[..., 3] >= 250)
    fh = f * (1 - tas) * (1 - body) * (fr[..., 3] <= 5) * (hb[..., 3] >= 250)
    # never behind the neck: where the neck turns away the LoRA painted skin into the hair-back (a pale patch at -40)
    yy, xx = np.mgrid[0:C.H, 0:C.W]
    fh = fh * ~((yy > 600) & (xx > 300) & (xx < 700))
    fr2, hb2 = fr.copy(), hb.copy()
    fr2[..., :3] = fr[..., :3] * (1 - ff[..., None]) + pick * ff[..., None]
    hb2[..., :3] = hb[..., :3] * (1 - fh[..., None]) + pick * fh[..., None]
    return hb2, fr2


def cut_metric(rig, k, hb, fr):
    """Offline swap estimate: key K+10 posed back to the bracket midpoint vs key K posed forward to it; MAD over the
    head box (x 96..832, y 0..800) and the face box (x 250..700, y 330..720)."""
    side, deg = k[3], int(k[4:])
    _, _, tag, g0, g1 = C.step_of(side, deg)
    gm = (g0 + g1) / 2
    P = load_key(rig, C.kid(side, deg - 10), iris_dx(side))
    d = C.keydir(k)
    neck = C.rgba(d / "neck.png")
    b_prev = C.mesh_map(side, tag, g0, gm)[0][..., :2]
    b_this = C.mesh_map(side, tag, g1, gm)[0][..., :2]
    pj = json.loads((d / "propagate.json").read_text())
    dx = (pj["tasselDx"] + (P["anchor"][0] - F.tassel_anchor(rig)[0])) / 2
    A = composite(rig, {"hb": C.remap(P["hb"], b_prev), "fr": C.remap(P["fr"], b_prev), "neck": C.remap(P["neck"], b_prev)}, dx)
    B = composite(rig, {"hb": C.remap(hb, b_this), "fr": C.remap(fr, b_this), "neck": C.remap(neck, b_this)}, dx)
    a, b = C.white(A), C.white(B)
    head = np.abs(a[0:800, 96:832] - b[0:800, 96:832]).mean()
    face = np.abs(a[330:720, 250:700] - b[330:720, 250:700]).mean()
    return round(float(head), 3), round(float(face), 3)


def merge(args, rig):
    k = args.key
    d = C.keydir(k)
    pj = json.loads((d / "propagate.json").read_text())
    neck = C.rgba(d / "neck.png")
    rows, tiles = [], []
    for c in [None] + args.cands:
        hb, fr = merged(rig, k, c)
        hm, fm = cut_metric(rig, k, hb, fr)
        rows.append({"cand": c or "push only (no repaint)", "cutHeadMAD": hm, "cutFaceMAD": fm})
        comp = C.white(composite(rig, {"hb": hb, "fr": fr, "neck": neck}, pj["tasselDx"]))
        tiles.append(comp[250:770, 150:720])
        print(json.dumps(rows[-1]))
    blank = np.full_like(tiles[0], 255)
    grid = [np.hstack(tiles[i:i + 4] + [blank] * (4 - len(tiles[i:i + 4]))) for i in range(0, len(tiles), 4)]
    sfx = "-mag" if OPT["magOnly"] else ""
    Image.fromarray(np.clip(np.vstack(grid), 0, 255).astype(np.uint8)).save(d / f"cands-1to1{sfx}.png")
    (d / f"merge{sfx}.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")


def pick(args, rig):
    k = args.key
    d = C.keydir(k)
    hb, fr = merged(rig, k, None if args.none else args.cand)
    C.save(d / "hairback.png", hb)
    C.save(d / "front.png", fr)
    sc = np.load(d / "warp.scale.npy")
    gm = grown_mask(d)
    if not args.none:
        sc = np.where(gm, 1.0, sc).astype(np.float32)  # repainted: fresh paint
    np.save(d / "scale.npy", sc)
    hd = (fr[..., 3] > 127) | (hb[..., 3] > 127)
    (d / "pick.json").write_text(json.dumps({"key": k, "pick": None if args.none else str(args.cand), "magOnly": OPT["magOnly"], "protect": OPT.get("protect", False),
                                             "repaintShareOfHead": 0 if args.none else round(float((gm & hd).sum() / hd.sum()), 4)}), encoding="utf-8")
    print("picked", k, args.cand)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["propagate", "merge", "pick", "mask"])
    ap.add_argument("--side", choices=["r", "l"])
    ap.add_argument("--to", type=int)
    ap.add_argument("--key")
    ap.add_argument("--cands", nargs="*", default=[])
    ap.add_argument("--cand")
    ap.add_argument("--none", action="store_true")
    ap.add_argument("--mag-only", action="store_true")
    ap.add_argument("--protect", action="store_true", help="eyes, brows and mouth keep the pushed paint")
    a = ap.parse_args()
    OPT["magOnly"] = a.mag_only
    OPT["protect"] = a.protect
    rig = C.load_rig()
    {"propagate": propagate, "merge": merge, "pick": pick, "mask": write_mask}[a.cmd](a, rig)


if __name__ == "__main__":
    main()
