"""Living-portrait v4.1 (FFX-2 only): the repaints behind the v4 check's
fixes, prepared for `tools/gen/lora-repaint.mjs` and merged back into the
key layers.

  prep  --key v4-r60 --region clip [--grow 14]
        the key's composite on white (as the LoRA keys were painted) and a
        feathered mask of the region, into WORK/<key>.<region>.{init,mask}.png
  merge --key v4-r60 --region clip --pick WORK/<key>.<region>.c2.png [--part back]
        the repainted pixels inside the mask, feathered, written into the key's
        layer (its alpha kept, so the silhouette never changes); the merged
        crop and a before/after sheet under WORK/

Regions: `clip` is the SAM clip mask (on +60 / +85 the mirrored far clip,
which her right side does not wear).

    PY=D:/Tools/ComfyUI/python_embeded/python.exe
    $PY -s tools/gen/rig-v41fix.py prep --key v4-r60 --region clip
"""
from __future__ import annotations

import argparse
import json
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

REPO = pathlib.Path(__file__).resolve().parents[2]
ART = REPO / "docs/concepts/pause-until-dawn/prototype-v2/art"
RIG = ART / "rig.json"
WORK = pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v41")
W, H = 832, 1216
YAW_DIR = {"v4-l85": "yaw-85", "v4-l60": "yaw-60", "v4-l40": "yaw-40", "v4-l20": "yaw-20", "frontal": "yaw0",
           "v4-r20": "yaw+20", "v4-r40": "yaw+40", "v4-r60": "yaw+60", "v4-r85": "yaw+85"}


def to_canvas(path, box):
    im = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)
    c = np.zeros((H, W, 4), np.float32)
    x, y = box[0], box[1]
    h, w = im.shape[:2]
    xa, xb, ya, yb = max(0, x), min(W, x + w), max(0, y), min(H, y + h)
    c[ya:yb, xa:xb] = im[ya - y:yb - y, xa - x:xb - x]
    return c


def over(dst, src):
    a = src[..., 3:4] / 255
    dst[..., :3] = dst[..., :3] * (1 - a) + src[..., :3] * a
    dst[..., 3:4] = dst[..., 3:4] * (1 - a) + 255 * a
    return dst


def composite(rig, key):
    v3 = rig["artMeta"]["v3"]
    c = np.zeros((H, W, 4), np.float32)
    k = v3["keys"][key]
    body = v3["frontal"]["bodyTurned"]
    for m in (k["back"], body, k["front"]):
        over(c, to_canvas(ART / m["file"], m["box"]))
    return c


def region_mask(key, region, grow):
    m = np.asarray(Image.open(ART / "v4/masks" / YAW_DIR[key] / f"{region}.png").convert("L")) > 127
    if grow:
        m = ndi.binary_dilation(m, iterations=grow)
    return m


def feather(m, px):
    d_in = ndi.distance_transform_edt(m)
    return np.clip(d_in / px, 0, 1)


def prep(args, rig):
    WORK.mkdir(parents=True, exist_ok=True)
    c = composite(rig, args.key)
    white = c[..., :3] * (c[..., 3:4] / 255) + 255 * (1 - c[..., 3:4] / 255)
    m = region_mask(args.key, args.region, args.grow)
    if args.prefill:
        # nearest paint from outside the mask, blurred: the sampler never sees the thing it is to paint over
        # (the ring's median colour, not the nearest texel: a cyan strand at the edge must not grow inward)
        ring = ndi.binary_dilation(m, iterations=16) & ~m & (c[..., 3] > 200)
        rgb = white[ring]
        cyan = (rgb[:, 2] > rgb[:, 0] + 20) & (rgb[:, 1] > rgb[:, 0])
        med = np.median(rgb[~cyan] if (~cyan).sum() > 50 else rgb, axis=0)
        idx = ndi.distance_transform_edt(m, return_distances=False, return_indices=True)
        near = white[idx[0], idx[1]]
        near_cyan = (near[..., 2] > near[..., 0] + 20) & (near[..., 1] > near[..., 0])
        near = np.where(near_cyan[..., None], med, near)
        blur = np.dstack([ndi.gaussian_filter(near[..., i], 8) for i in range(3)])
        white = np.where(m[..., None], blur, white)
    stem = WORK / f"{args.key}.{args.region}"
    Image.fromarray(np.clip(white, 0, 255).astype(np.uint8)).save(f"{stem}.init.png")
    Image.fromarray((m * 255).astype(np.uint8)).save(f"{stem}.mask.png")
    print(json.dumps({"init": f"{stem}.init.png", "mask": f"{stem}.mask.png", "px": int(m.sum())}))


def merge(args, rig):
    v3 = rig["artMeta"]["v3"]
    meta = v3["keys"][args.key][args.part]
    layer = to_canvas(ART / meta["file"], meta["box"])
    pick = np.asarray(Image.open(args.pick).convert("RGB")).astype(np.float32)
    m = region_mask(args.key, args.region, args.grow)
    f = feather(m, args.feather)[..., None]
    before = layer.copy()
    layer[..., :3] = layer[..., :3] * (1 - f) + pick * f
    x, y, w, h = meta["box"]
    out = np.zeros((h, w, 4), np.float32)
    xa, xb, ya, yb = max(0, x), min(W, x + w), max(0, y), min(H, y + h)
    out[ya - y:yb - y, xa - x:xb - x] = layer[ya:yb, xa:xb]
    old = np.asarray(Image.open(ART / meta["file"]).convert("RGBA")).astype(np.float32)
    out[..., 3] = old[..., 3]  # the silhouette is the key's own
    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(ART / meta["file"])
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = max(0, ys.min() - 40), min(H, ys.max() + 40), max(0, xs.min() - 40), min(W, xs.max() + 40)
    sheet = np.hstack([before[y0:y1, x0:x1, :3], layer[y0:y1, x0:x1, :3]])
    Image.fromarray(np.clip(sheet, 0, 255).astype(np.uint8)).save(WORK / f"{args.key}.{args.region}.merged.png")
    rest_meta = rig["artMeta"]["v4"]["layers"].get(args.key, {}).get("rest")
    if rest_meta:
        # the key's composite, which the runtime seam-matches its patches against, carries the same fix
        rp = ART / rest_meta
        rest = np.asarray(Image.open(rp).convert("RGBA")).astype(np.float32)
        rest[..., :3] = rest[..., :3] * (1 - f) + pick * f
        Image.fromarray(np.clip(rest + 0.5, 0, 255).astype(np.uint8)).save(rp)
    rec = rig["artMeta"]["v4"].setdefault("repaints", {})
    rec[f"{args.key}.{args.region}"] = {"pick": pathlib.Path(args.pick).name, "part": args.part, "grow": args.grow, "featherPx": args.feather,
                                        "tool": "tools/gen/lora-repaint.mjs + rig-v41fix.py merge"}
    RIG.write_text(json.dumps(rig, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"merged": meta["file"], "px": int(m.sum())}))


def faceover(args, rig):
    """Per key on the tassel's side of the turn, the cheek and jaw beside the tassel as a layer of its own.

    The runtime draws it over the plate's tassel while her right ear turns away (yaw < 0), so the tassel
    passes BEHIND the cheek instead of across it (the v4 check: its cap drawn on the cheek beside the mouth
    at -22 and -26, a ghost over cheek and mouth at -30 and -34). Only the face below the eyes and left of
    the mouth: the eyes blink and the mouth moves, so neither may be frozen under it. On the frontal key
    the plate's own tassel footprint is left out, so at rest (yaw 0) it redraws exactly the pixels already there.
    """
    v3, v4 = rig["artMeta"]["v3"], rig["artMeta"]["v4"]
    order = rig["artMeta"]["commonLandmarkOrder"]
    ix = {n: i for i, n in enumerate(order)}
    keys = {k["id"]: k for k in rig["keys"]}
    ear = next(l for l in v3["frontal"]["layers"] if l["name"] == "earring")
    tassel = ndi.binary_dilation(to_canvas(ART / ear["file"], ear["box"])[..., 3] > 8, iterations=3)
    out = {}
    for key in ("frontal", "v4-l20", "v4-l40", "v4-l60", "v4-l85"):
        face = np.asarray(Image.open(ART / "v4/masks" / YAW_DIR[key] / "face.png").convert("L")) > 127
        lm = keys[key]["landmarks"]
        mouth_x = lm[ix["mouthCorner_R"]][0]
        eye_y = max(lm[ix["pupil_R"]][1], lm[ix["pupil_L"]][1])
        yy, xx = np.mgrid[0:H, 0:W]
        chin_y = lm[ix["chin"]][1]
        if key == "frontal":
            region = face & (xx < mouth_x - 10) & (yy > eye_y + 40)
        else:
            # the cheek left of the mouth and, below the chin, the whole neck: past -40 the ear is behind
            # the jaw and the tassel hangs behind the neck, not across the chin
            m = v3["keys"][key]["front"]
            fa = to_canvas(ART / m["file"], m["box"])[..., 3] > 0
            jr, jl = lm[ix["jaw_R"]][0], lm[ix["jaw_L"]][0]
            neck = (yy > chin_y - 10) & (xx > jr - 10) & (xx < jl + 10)
            region = (face | fa) & (yy > eye_y + 40) & (face | neck)
        if key == "frontal":
            region &= ~tassel
            src = np.asarray(Image.open(ART / "keys/frontal.png").convert("RGBA")).astype(np.float32)
        else:
            m = v3["keys"][key]["front"]
            src = to_canvas(ART / m["file"], m["box"])
        # a 1.5 px soft edge inside the region, so the cut never shows as a line
        soft = np.clip(ndi.distance_transform_edt(region) / 1.5, 0, 1)
        layer = src.copy()
        layer[..., 3] = src[..., 3] * soft
        if key == "frontal":
            layer[..., 3] = np.where(region, src[..., 3], 0)  # exact texels: rest stays the plate
        if layer[..., 3].max() == 0:
            continue
        ys, xs = np.nonzero(layer[..., 3] > 0)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        d = ART / "v4/layers" / ("frontal" if key == "frontal" else key)
        d.mkdir(parents=True, exist_ok=True)
        Image.fromarray(np.clip(layer[y0:y1, x0:x1] + 0.5, 0, 255).astype(np.uint8)).save(d / "faceover.png")
        out[key] = {"file": f"v4/layers/{d.name}/faceover.png", "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]}
    v4.setdefault("tassel", {})["faceOver"] = out
    RIG.write_text(json.dumps(rig, indent=2) + chr(10), encoding="utf-8")
    print(json.dumps({k: v["box"] for k, v in out.items()}))


JOBS = pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v4/patches-jobs")
TAG_KEY = {"0": "frontal", "m20": "v4-l20", "m40": "v4-l40", "p20": "v4-r20", "p40": "v4-r40"}


def mouth(args, rig):
    """A mouth state as the WHOLE repainted mouth region (the job's soft ellipse), not the mouth's dark
    features cut out of it: v4 cut the lines and let the key's own lines show between them, so a pressed
    mouth broke into dark fragments beside the key's own line, and a slight smile laid its lip colour as
    a smear under the key's lip. Here the patch replaces the region; the runtime's seam fit
    (src/patch-blend.ts) matches its tone at the ellipse's edge."""
    v3 = rig["artMeta"]["v3"]
    kid = TAG_KEY[args.tag]
    plan = json.loads((JOBS / "plan.json").read_text(encoding="utf-8"))
    job = f"{args.tag}-{args.state}"
    soft = np.asarray(Image.open(JOBS / f"{job}.mask.png").convert("L")).astype(np.float32) / 255
    pick = np.asarray(Image.open(args.pick).convert("RGB")).astype(np.float32)
    x, y, w, h = plan[job]["box"]
    pad = 8
    x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(W, x + w + pad), min(H, y + h + pad)
    a = np.clip(soft[y0:y1, x0:x1] * 1.15, 0, 1)
    arr = np.dstack([pick[y0:y1, x0:x1], a * 255])
    d = ART / "v4/patches" / kid / "mouth"
    d.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(arr + 0.5, 0, 255).astype(np.uint8)).save(d / f"{args.state}.png")
    meta = {"file": f"v4/patches/{kid}/mouth/{args.state}.png", "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]}
    if kid == "frontal":
        v3["patches"]["mouth"][args.state] = meta
    else:
        v3["keyPatches"][kid]["mouth"][args.state] = meta
    rig["artMeta"]["v4"]["expressions"].setdefault(kid, {}).setdefault("mouth", {})[args.state] = f"v4.1 {pathlib.Path(args.pick).name} (whole region)"
    RIG.write_text(json.dumps(rig, indent=2) + chr(10), encoding="utf-8")
    print(json.dumps({"key": kid, "state": args.state, **meta}))


def heal(args, rig):
    """A stray red mark inside a box (the v4 check: a red dash under the -40 key's left mouth corner):
    its saturated-red texels, grown 2 px, refilled as a harmonic membrane from the skin around them,
    in the key's front layer, its composite and every mouth patch that covers the box."""
    from skimage import color
    x, y, w, h = (int(v) for v in args.box.split(","))
    v3, v4 = rig["artMeta"]["v3"], rig["artMeta"]["v4"]
    front = v3["keys"][args.key]["front"]
    targets = [(ART / front["file"], front["box"]), (ART / v4["layers"][args.key]["rest"], [0, 0, W, H])]
    targets += [(ART / m["file"], m["box"]) for m in v3["keyPatches"].get(args.key, {}).get("mouth", {}).values()]
    ref = to_canvas(*targets[0])
    hsv = color.rgb2hsv(np.clip(ref[..., :3] / 255, 0, 1))
    red = (hsv[..., 1] > 0.45) & ((hsv[..., 0] < 0.04) | (hsv[..., 0] > 0.93)) & (hsv[..., 2] < 0.95)
    box = np.zeros((H, W), bool)
    box[y:y + h, x:x + w] = True
    hole = ndi.binary_dilation(red & box, iterations=2) & box
    # one fill, on the front layer's canvas; every target takes the same texels at the hole
    f = ref[..., :3].copy()
    known = ~hole & (ref[..., 3] > 200)
    f[hole] = np.median(ref[..., :3][ndi.binary_dilation(hole, iterations=4) & known], axis=0)
    for _ in range(400):
        avg = (np.roll(f, 1, 0) + np.roll(f, -1, 0) + np.roll(f, 1, 1) + np.roll(f, -1, 1)) / 4
        f[hole] = avg[hole]
    for path, pbox in targets:
        img = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)
        px, py = pbox[0], pbox[1]
        hh, ww = img.shape[:2]
        ya, yb, xa, xb = max(0, py), min(H, py + hh), max(0, px), min(W, px + ww)
        sub = hole[ya:yb, xa:xb]
        if not sub.any():
            continue
        region = img[ya - py:yb - py, xa - px:xb - px, :3]
        region[sub] = f[ya:yb, xa:xb][sub]
        Image.fromarray(np.clip(img + 0.5, 0, 255).astype(np.uint8)).save(path)
        print(json.dumps({"healed": str(path.relative_to(ART)), "px": int(sub.sum())}))
    v4.setdefault("repaints", {})[f"{args.key}.heal"] = {"box": [x, y, w, h], "what": "red dash under the mouth corner, refilled from the skin around it"}
    RIG.write_text(json.dumps(rig, indent=2) + chr(10), encoding="utf-8")


def clean(args, rig):
    """The collar under a turned key's head layers: texels that are the plate body's own cloth copied into the
    head layer (within 10 levels of the body under them) are dropped, and small islands of paint low on the
    layer (the v4 check's comb-like dashes along the collar at -80) removed. Invisible where the copy matched."""
    mir = _load_mirror()
    v3 = rig["artMeta"]["v3"]
    bt = v3["frontal"]["bodyTurned"]
    body = to_canvas(ART / bt["file"], bt["box"]).astype(np.int16)
    from skimage import color
    bh = color.rgb2hsv(np.clip(body[..., :3], 0, 255) / 255.0)
    hue, lum = bh[..., 0] * 360, bh[..., 2]
    cloth = ((hue >= 285) | (hue <= 12)) & (bh[..., 1] > 0.12) | (lum < 0.3)
    for part in ("back", "front"):
        meta = v3["keys"][args.key][part]
        c = to_canvas(ART / meta["file"], meta["box"])
        same = (np.abs(c[..., :3].astype(np.int16) - body[..., :3]).max(-1) <= mir.BODY_TOL) & (body[..., 3] > 250) & cloth
        c[same] = 0
        c = mir.despeckle(c.astype(np.uint8)).astype(np.float32)
        before = int((to_canvas(ART / meta["file"], meta["box"])[..., 3] > 0).sum())
        im, box = mir.trim(c.astype(np.uint8))
        Image.fromarray(im).save(ART / f"v4/layers/{args.key}/{part}.png")
        v3["keys"][args.key][part] = {"file": f"v4/layers/{args.key}/{part}.png", "box": box}
        print(json.dumps({"key": args.key, "part": part, "px": before, "dropped": before - int((c[..., 3] > 0).sum())}))
    RIG.write_text(json.dumps(rig, indent=2) + chr(10), encoding="utf-8")


def _load_mirror():
    import importlib.util
    spec = importlib.util.spec_from_file_location("rigmirror", pathlib.Path(__file__).with_name("rig-mirror.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--box")
    ap.add_argument("cmd", choices=["prep", "merge", "faceover", "mouth", "heal", "clean"])
    ap.add_argument("--tag")
    ap.add_argument("--state")
    ap.add_argument("--key")
    ap.add_argument("--region", default="clip")
    ap.add_argument("--grow", type=int, default=14)
    ap.add_argument("--feather", type=float, default=6)
    ap.add_argument("--pick")
    ap.add_argument("--part", default="back")
    ap.add_argument("--prefill", action="store_true")
    args = ap.parse_args()
    rig = json.loads(RIG.read_text(encoding="utf-8"))
    {"prep": prep, "merge": merge, "faceover": faceover, "mouth": mouth, "heal": heal, "clean": clean}[args.cmd](args, rig)


if __name__ == "__main__":
    main()
