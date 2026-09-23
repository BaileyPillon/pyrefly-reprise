"""Living-portrait v4.1 (FFX-2 only): the +60 and +85 keys as mirrors of the
judged -60 and -85 keys, with her own asymmetry put back.

Why: the v4 check found +80..+85 a different painting (flat, glossy light
brown hair with a cel band, almost no pink or orange tips, a teal smear, a
jagged jaw) whose face sat 60 to 90 px higher than every other key, and +60
with a straight vertical seam where mirrored far hair met and no far eye.
The -60 and -85 keys carry the plate's hair (orange and pink tips), line and
head height. Mirrored about the head's axis they are the same head turned the
other way; three things are then hers only on one side and are put right:

  eyes    green is her right eye, blue her left: after the flip each iris is
          recoloured to its own side's plate hue (hue shift inside the SAM iris
          masks, saturation and value kept, so the catchlights stay white)
  clip    the red and cyan clip sits at her LEFT temple, which faces away at
          +60 / +85: its mirrored copy is cut out here (`clip` masks, written
          for `tools/gen/lora-repaint.mjs`, which repaints it as hair)
  tassel  her right ear wears the tassel; the runtime draws the plate's own
          (artMeta.v4.tassel.dx is set from the ear position, `--ear`)

The pinned body is never mirrored: only the head layers (back, front), the
key's composite (rest), its masks and its landmarks (x' = S - x, with the
_R/_L names swapped).

    python -s tools/gen/rig-mirror.py --src v4-l60 --dst v4-r60 --axis 946
    python -s tools/gen/rig-mirror.py --src v4-l85 --dst v4-r85 --axis 946
"""
from __future__ import annotations

import argparse
import json
import pathlib

import numpy as np
from PIL import Image
from skimage import color

REPO = pathlib.Path(__file__).resolve().parents[2]
ART = REPO / "docs/concepts/pause-until-dawn/prototype-v2/art"
RIG = ART / "rig.json"
W, H = 832, 1216
# plate iris hues (median over the SAM iris masks on the plate, saturation > 0.3): her right (green), her left (blue)
HUE = {"R": 165.6, "L": 221.6}
BODY_TOL = 10  # levels: a head-layer texel this close to the plate body under it is the body's own copy
YAW_DIR = {"v4-l60": "yaw-60", "v4-l85": "yaw-85", "v4-r60": "yaw+60", "v4-r85": "yaw+85"}


def swap_name(n: str) -> str:
    for a, b in (("_R", "_L"), ("_L", "_R")):
        if a in n:
            return n.replace(a, b)
    return n


def flip_canvas(img: np.ndarray, S: int) -> np.ndarray:
    """Canvas-sized image mirrored about x = S / 2 (pixel x -> S - x); what falls off the canvas is dropped."""
    out = np.zeros_like(img)
    xs = np.arange(W)
    src = S - xs
    ok = (src >= 0) & (src < W)
    out[:, xs[ok]] = img[:, src[ok]]
    return out


def to_canvas(path: pathlib.Path, box) -> np.ndarray:
    im = np.asarray(Image.open(path).convert("RGBA"))
    c = np.zeros((H, W, 4), np.uint8)
    x, y = box[0], box[1]
    h, w = im.shape[:2]
    xa, xb, ya, yb = max(0, x), min(W, x + w), max(0, y), min(H, y + h)
    c[ya:yb, xa:xb] = im[ya - y:yb - y, xa - x:xb - x]
    return c


def trim(c: np.ndarray):
    a = c[..., 3] > 0
    ys, xs = np.nonzero(a)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return c[y0:y1, x0:x1], [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def recolour(c: np.ndarray, mask: np.ndarray, hue: float) -> np.ndarray:
    """Shift the saturated iris pixels inside `mask` so their median hue becomes `hue` (degrees)."""
    rgb = c[..., :3].astype(np.float64) / 255
    hsv = color.rgb2hsv(rgb)
    sel = mask & (hsv[..., 1] > 0.25) & (c[..., 3] > 0)
    h = hsv[..., 0] * 360
    band = sel & (h > 90) & (h < 290)
    if band.sum() < 20:
        return c
    shift = hue - float(np.median(h[band]))
    hsv[..., 0] = np.where(band, ((h + shift) % 360) / 360, hsv[..., 0])
    out = c.copy()
    out[..., :3] = np.clip(color.hsv2rgb(hsv) * 255 + 0.5, 0, 255).astype(np.uint8)
    return out


def despeckle(c: np.ndarray, min_px: int = 600, below: int = 700) -> np.ndarray:
    """Drop small islands of paint low on the layer (the dashes and flecks left where the body copy was cut)."""
    from scipy import ndimage as ndi
    lab, n = ndi.label(c[..., 3] > 20)
    if n == 0:
        return c
    sizes = ndi.sum(np.ones_like(lab), lab, index=np.arange(1, n + 1))
    objs = ndi.find_objects(lab)
    out = c.copy()
    for i, (sz, sl) in enumerate(zip(sizes, objs), start=1):
        if sz < min_px and sl[0].start >= below:
            out[lab == i] = 0
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--dst", required=True)
    ap.add_argument("--axis", type=int, default=946, help="S: pixel x -> S - x (2 x the head axis)")
    args = ap.parse_args()
    S = args.axis
    rig = json.loads(RIG.read_text(encoding="utf-8"))
    v3, v4 = rig["artMeta"]["v3"], rig["artMeta"]["v4"]
    order = rig["artMeta"]["commonLandmarkOrder"]
    keys = {k["id"]: k for k in rig["keys"]}
    src, dst = keys[args.src], keys[args.dst]
    mdir_s, mdir_d = ART / "v4/masks" / YAW_DIR[args.src], ART / "v4/masks" / YAW_DIR[args.dst]
    mdir_d.mkdir(parents=True, exist_ok=True)
    # masks: flipped, left/right names swapped (her right eye stays her right eye)
    masks = {}
    for f in sorted(mdir_s.glob("*.png")):
        m = np.asarray(Image.open(f).convert("L"))
        name = f.stem
        new = {"eyeL": "eyeR", "eyeR": "eyeL", "irisL": "irisR", "irisR": "irisL"}.get(name, name)
        fm = flip_canvas(m[..., None], S)[..., 0]
        masks[new] = fm > 127
        Image.fromarray(fm).save(mdir_d / f"{new}.png")
    ldir = ART / "v4/layers" / args.dst
    ldir.mkdir(parents=True, exist_ok=True)
    # the source key's head layers carry copies of the plate's own collar and neck where the key was not
    # repainted; unmirrored they match the body under them, mirrored they would lay a flipped collar over
    # the real one (the v4 check's comb-like dashes and flat patches at the collar). They are dropped here,
    # which changes nothing on the source key (the body under them is the same pixels).
    bt = v3["frontal"]["bodyTurned"]
    body = to_canvas(ART / bt["file"], bt["box"]).astype(np.int16)
    bh = color.rgb2hsv(np.clip(body[..., :3], 0, 255) / 255.0)
    hue, lum = bh[..., 0] * 360, bh[..., 2]
    # only the cloth (the pink hood, its red and dark edges): the neck skin stays the key's own, whole
    cloth = ((hue >= 285) | (hue <= 12)) & (bh[..., 1] > 0.12) | (lum < 0.3)
    for part in ("back", "front"):
        meta = v3["keys"][args.src][part]
        src_c = to_canvas(ART / meta["file"], meta["box"])
        same = (np.abs(src_c[..., :3].astype(np.int16) - body[..., :3]).max(-1) <= BODY_TOL) & (body[..., 3] > 250) & cloth
        src_c = src_c.copy()
        src_c[same] = 0
        c = flip_canvas(src_c, S)
        for side in ("R", "L"):
            if f"iris{side}" in masks:
                grown = masks[f"iris{side}"]
                c = recolour(c, grown, HUE[side])
        c = despeckle(c)
        im, box = trim(c)
        Image.fromarray(im).save(ldir / f"{part}.png")
        v3["keys"][args.dst][part] = {"file": f"v4/layers/{args.dst}/{part}.png", "box": box}
    rest = np.asarray(Image.open(ART / v4["layers"][args.src]["rest"]).convert("RGBA"))
    rest = flip_canvas(rest, S)
    for side in ("R", "L"):
        if f"iris{side}" in masks:
            rest = recolour(rest, masks[f"iris{side}"], HUE[side])
    Image.fromarray(rest).save(ldir / "rest.png")
    v4["layers"][args.dst] = {"rest": f"v4/layers/{args.dst}/rest.png", "mirrorOf": args.src, "axisS": S,
                              "_readme": "tools/gen/rig-mirror.py: the head layers of the source key mirrored about x = S/2, irises recoloured by side, the far clip cut for a repaint"}
    lm = src["landmarks"]
    by = {n: lm[i] for i, n in enumerate(order)}
    pick = lambda n: by.get(swap_name(n), by[n])  # clip_L has no twin: its mirror is a hair point on the far side
    # a hair point the flip puts past the frame sits on it, as every other key's cropped hair does (x 831)
    dst["landmarks"] = [[min(W - 1, max(0, S - pick(n)[0])), pick(n)[1]] for n in order]
    dst["file"] = f"v4/layers/{args.dst}/front.png"
    RIG.write_text(json.dumps(rig, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"dst": args.dst, "back": v3["keys"][args.dst]["back"]["box"], "front": v3["keys"][args.dst]["front"]["box"],
                      "clipPx": int(masks.get("clip", np.zeros(1)).sum())}))


if __name__ == "__main__":
    main()
