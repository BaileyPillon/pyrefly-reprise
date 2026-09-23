"""Living-portrait v4 (FFX-2 only): cut every finished v4 key into the rig's
back/front head layers and wire them into art/rig.json.

Per key (the finished key without its tassel, rig-v4lib key_path "notassel"; masks from
rig-sam.py --src notassel):

  head    SAM's head mask (neck, background and the untouched plate body cut
          away): hair, face, the clip. Not the tassel: the runtime draws the
          plate's own tassel over (or, turned away, under) every key.
  back    the WHOLE head, opaque, so nothing under the front layer can show
          through when the layers move; plus, under the pinned body, the hair
          continued (push-pull from the hair next to it) as far as the key's
          jaw and cheek points can travel against the body while the key is
          painted (tools/gen/rig-range.mjs --warp -> art/v4/range-warp.json,
          clamped to 60 px): the hidden region of this key.
  front   what sits IN FRONT of the pinned body and of a turned-away tassel:
          the face (holes filled, so strands across it come along) and every
          head pixel over the body. 3 px feather on its inner edge.
  edges   the silhouette against the painted white backdrop is decontaminated
          (edge colour taken from inside, alpha eased over 1.5 px): no white
          halo on the dark stage.

The drawing order is back, tassel if turned away, body, front, tassel if
toward the camera; the frontal key keeps the v3 layer stack (rest = the plate).
Writes art/v4/layers/<id>/{back,front}.png (trimmed, box on the canvas) and
rest.png (the key's composite, the patches' seam reference), then rig.json:
keys[] (frontal + the eight v4 keys with their landmarks), artMeta.v3.keys,
artMeta.v4 (tassel offsets, paint mode, provenance); the v3 turns move to
retiredKeys.

    python -s tools/gen/rig-v4layers.py [--only -40]
"""
from __future__ import annotations

import importlib.util
import pathlib
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = pathlib.Path(__file__).resolve().parent
_v = importlib.util.spec_from_file_location("rigv4", HERE / "rig-v4lib.py")
V = importlib.util.module_from_spec(_v); _v.loader.exec_module(V)
L = V.L

OUT = V.V4 / "layers"
MASKS = V.V4 / "masks"
FEATHER = 3.0
ENV_CAP = 60.0
NECK_FADE = (790.0, 835.0)  # rows: the key's neck is whole above the first, gone at the second (the plate's collar)


def mask(yaw, layer):
    return np.asarray(Image.open(MASKS / V.NAMES[yaw] / f"{layer}.png")) > 127


def trimmed(rgba, dst):
    ys, xs = np.nonzero(rgba[..., 3] > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    L.save_rgba(rgba[y0:y1, x0:x1], dst)
    return {"file": L.rel(dst).split("prototype-v2/art/")[1], "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]}


def decontaminate(rgb, m):
    """Silhouette edge px carry the white backdrop: their colour from 2 px inside, alpha eased."""
    inner = L.erode(m, 2)
    col = L.push_pull_fill(rgb, inner)
    d = ndi.distance_transform_edt(m)
    alpha = np.clip((d - 0.25) / 1.5, 0, 1)
    edge = m & ~inner
    out = rgb.copy()
    out[edge] = col[edge]
    return out, alpha


def cut(yaw, env):
    name, kid = V.NAMES[yaw], V.IDS[yaw]
    rgb = np.asarray(Image.open(V.key_path(yaw, "notassel")).convert("RGB")).astype(np.float32)
    head = mask(yaw, "head")
    body = V.body_alpha() > 0.5
    if V.tassel_visible(yaw):
        # the key's own tassel left over the neck and hood (the hole was filled only over the head):
        # never part of the head; the runtime draws the plate's tassel there
        old = V.tassel_footprint(yaw) > 0.05
        p = MASKS / V.NAMES[yaw] / "tassel.png"
        if p.exists():
            old |= np.asarray(Image.open(p)) > 127
        head &= ~(L.dilate(old, 4) & body)
    face = mask(yaw, "face") | mask(yaw, "eyeR") | mask(yaw, "eyeL")
    face = ndi.binary_fill_holes(ndi.binary_closing(face, iterations=4)) & head
    # the key's OWN neck, as painted under its own jaw (the brief said drop it for the plate's:
    # at every turned key that left the plate's hidden neck fill showing as a grey slab beside
    # the moved chin, and a second neck line in profile). It fades into the plate's neck above
    # the collar (NECK_FADE), so the collar and the hood stay the pinned plate's.
    neck = V.neck_mask(rgb, mask(yaw, "face")) & V.repaint_mask(yaw) & ~V.background(rgb)
    yy = np.arange(V.H, dtype=np.float32)[:, None]
    neck_fade = np.where(body, np.clip((NECK_FADE[1] - yy) / (NECK_FADE[1] - NECK_FADE[0]), 0, 1), 1.0) * np.ones((1, V.W), np.float32)
    neck &= neck_fade > 0
    head |= neck
    # the painted white backdrop seen between strands of the lower hair is backdrop, not hair
    s_ = V.hsv(ndi.median_filter(rgb, size=(3, 3, 1)))
    gaps = (s_[..., 2] > 0.93) & (s_[..., 1] < 0.07) & (yy > 450) & ~L.dilate(mask(yaw, "face") | mask(yaw, "eyeR") | mask(yaw, "eyeL"), 4)
    head &= ~gaps
    rgb_d, a_head = decontaminate(rgb, head)
    # back: the whole head + the hidden hair under the pinned body, as far as this key can travel
    e = env.get(kid, {"dxMin": -20, "dxMax": 20, "dyMin": -15, "dyMax": 15})
    ex = (max(-ENV_CAP, e["dxMin"]), min(ENV_CAP, e["dxMax"]))
    ey = (max(-ENV_CAP, e["dyMin"]), min(ENV_CAP, e["dyMax"]))
    hair = head & ~face
    under = body & L.shift_union(hair, ex, ey, step=4) & ~head
    back_rgb = L.push_pull_fill(rgb_d, head & ~(ndi.distance_transform_edt(head) < 2))
    back_rgb[head] = rgb_d[head]
    a_back = np.maximum(a_head, under.astype(np.float32))
    back = np.dstack([back_rgb, a_back * 255])
    back[a_back <= 0] = 0
    # front: the face and whatever head paint lies over the body, feathered on its inner edge
    fr = head & (face | body)
    d_in = ndi.distance_transform_edt(fr)
    a_front = np.where(L.dilate(~head, 1), a_head, np.clip(d_in / FEATHER, 0, 1)) * fr
    a_front = np.where(neck & body, a_front * neck_fade, a_front)
    front = np.dstack([rgb_d, a_front * 255])
    front[a_front <= 0] = 0
    d = OUT / kid
    d.mkdir(parents=True, exist_ok=True)
    rec = {"back": trimmed(back, d / "back.png"), "front": trimmed(front, d / "front.png")}
    rest = np.dstack([rgb_d, a_head * 255])
    L.save_rgba(rest, d / "rest.png")
    rec["rest"] = L.rel(d / "rest.png").split("prototype-v2/art/")[1]
    rec["hiddenPx"] = int(under.sum())
    rec["envelopeUsed"] = {"dx": [round(ex[0], 1), round(ex[1], 1)], "dy": [round(ey[0], 1), round(ey[1], 1)]}
    # overlay: back (magenta outside) and front outline, for a look at 1:1
    ov = rgb.copy()
    ov[~head] = ov[~head] * 0.45 + L.MAGENTA * 0.55
    ov[fr & ~L.erode(fr, 1)] = [0, 255, 255]
    ov[under] = ov[under] * 0.5 + np.array([255, 255, 0]) * 0.5
    Image.fromarray(np.clip(ov, 0, 255).astype(np.uint8)).save(d / "overlay.jpg", quality=85)
    return rec, head


def silhouette(head, row=180):
    band = head[row - 3:row + 4].any(0)
    xs = np.nonzero(band)[0]
    return [int(xs.min()), row], [int(xs.max()), row]


EXTRA = ["clip_L", "hairSide_R400", "hairSide_L400", "hairSide_R650", "hairSide_L650"]
# measured points moved the least that clears a fold in the mesh (tests/unit/pause-living-portrait-warp
# "never folds"); found by a search over 4-32 px moves of the silhouette-type points
EXTRA_FIX = {60: {"hairSide_L650": [815, 650]}}


def extra_points(yaw, head):
    """v4: five more shared points, measured, so the warp also carries what the 20 face points
    leave loose between keys 20-25 degrees apart: the hair clip at her left temple (its centre
    where it shows; where the turn hides it, the head's right silhouette at the clip's height)
    and the head's silhouette at rows 400 and 650 (the mid-turn frames of v4's first pass showed
    two clips and two back-of-head outlines 60-70 px apart)."""
    def side(row):
        xs = np.nonzero(head[row - 3:row + 4].any(0))[0]
        return [int(xs.min()), row], [int(xs.max()), row]
    clip = clip_by_colour(yaw) if yaw <= 20 else None
    if clip is not None and clip.sum() > 800:
        cy, cx = ndi.center_of_mass(clip)
        c = [round(float(cx), 1), round(float(cy), 1)]
    else:
        c = side(230)[1]
    r4, l4 = side(400)
    r6, l6 = side(650)
    pts = dict(zip(EXTRA, [c, r4, l4, r6, l6]))
    pts.update(EXTRA_FIX.get(yaw, {}))
    return [pts[n] for n in EXTRA]


def clip_by_colour(yaw):
    """The clip's own colours (red rim, cyan body) at her left temple, as one blob. SAM's clip
    masks were fine for cutting but their centroids strayed into the hair on two keys."""
    rgb = V.key_rgb(yaw, "notassel")
    h = V.hsv(rgb)
    hue, sat, val = h[..., 0] * 360, h[..., 1], h[..., 2]
    red = (sat > 0.6) & ((hue < 12) | (hue > 348)) & (val > 0.45)
    cyan = (sat > 0.45) & (hue > 168) & (hue < 205) & (val > 0.6)
    lm = V.landmarks(yaw)
    zone = np.zeros(red.shape, bool)
    zone[:int(lm["pupil_L"][1]) - 45, int(lm["pupil_L"][0]) + 30:] = True  # above and beyond her left eye (its iris is cyan too)
    m = ndi.binary_closing(cyan & zone, iterations=4)  # cyan only: this hair runs red-saturated
    lab, n = ndi.label(m)
    if n == 0:
        return None
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
    return lab == 1 + int(np.argmax(sizes))


def plate_head():
    own = np.load(L.V3 / "masks/owner.npy")
    z = L.read_json(L.V3 / "masks/owners.json")["z"]
    return np.isin(own, [z.index(k) for k in ("hairBack", "headCore", "irisR", "irisL", "eyeApertureR", "eyeApertureL", "hairFront", "strand1", "strand2")])


def wire(recs, heads):
    rig = L.read_json(L.ART / "rig.json")
    spec = L.read_json(V.V4 / "warp/landmarks.json")
    order = spec["order"]
    v3 = rig["artMeta"]["v3"]
    retired = v3.setdefault("retiredKeys", {"ids": []})
    for kid in list(v3["keys"]):
        if not kid.startswith("v4-"):
            retired.setdefault("v3turns", {})[kid] = v3["keys"].pop(kid)
            if kid not in retired["ids"]:
                retired["ids"].append(kid)
    retired["_readmeV4"] = "v4 (rig-v4layers.py): the v3 turns (different paintings from the plate) are retired; their layers stay on disk."
    for kid in list(v3.get("keyLids", {})):
        if not kid.startswith("v4-"):
            v3["keyLids"].pop(kid)
    keys = [k for k in rig["keys"] if k["id"] == "frontal"]
    base = order[:20]
    order = base + EXTRA
    spec["order"] = order
    fr = keys[0]
    fr["landmarks"] = fr["landmarks"][:20] + extra_points(0, plate_head())
    spec["keys"]["0"] = fr["landmarks"]
    for yaw in V.YAWS:
        if yaw == 0 or yaw not in recs:
            continue
        kid = V.IDS[yaw]
        v3["keys"][kid] = {"back": recs[yaw]["back"], "front": recs[yaw]["front"]}
        lm = [list(map(float, p)) for p in spec["keys"][str(yaw)][:20]] + extra_points(yaw, heads[yaw])
        r, l = silhouette(heads[yaw])
        lm[order.index("hairSide_R")], lm[order.index("hairSide_L")] = r, l
        spec["keys"][str(yaw)] = lm
        keys.append({"id": kid, "yawDeg": yaw, "file": recs[yaw]["front"]["file"], "landmarks": lm})
    rig["keys"] = keys
    rig["artMeta"]["commonLandmarkOrder"] = order
    L.write_json(spec, V.V4 / "warp/landmarks.json")
    v4 = rig["artMeta"].setdefault("v4", {})
    v4.update({
        "_readme": "Living-portrait v4 (FFX-2 only): nine keys every ~20 deg (-85..85), each the plate turned in 2.5D and repainted with the plate's LoRA (art/v4/keys.md), finished by rig-v4fix.py, masked by rig-sam.py, cut by rig-v4layers.py. The runtime warps adjacent keys continuously (paint = 'warp'); 'switch' is the v3.3 one-painting-at-a-time fallback (?paint=switch).",
        "paint": "warp",
        "tassel": {"dx": {V.IDS[y]: V.TASSEL_DX[y] for y in V.YAWS}, "overFromDeg": -20, "underToDeg": -40, "hiddenBelowDeg": -55,
                   "_readme": "The plate's earring layer, drawn un-warped at dx (px) interpolated over the bracket; on top of the head from -20 up, under the face (between back and body) from -40 down, cross-faded between; gone behind the head by -55 (the far ear is behind the skull and under the far hair)."},
        "layers": {V.IDS[y]: {k: v for k, v in recs[y].items() if k not in ("back", "front")} for y in recs},
        "range": "v4/range-warp.json",
        "masks": "v4/masks/choice.json",
    })
    L.write_json(rig, L.ART / "rig.json")


def main():
    only = [int(sys.argv[sys.argv.index("--only") + 1])] if "--only" in sys.argv else [y for y in V.YAWS if y != 0]
    env = L.read_json(V.V4 / "range-warp.json")["envelopePx"]
    recs, heads = {}, {}
    for yaw in only:
        recs[yaw], heads[yaw] = cut(yaw, env)
        print(V.IDS[yaw], recs[yaw]["back"]["box"], recs[yaw]["front"]["box"], "hidden", recs[yaw]["hiddenPx"])
    if len(only) == len(V.YAWS) - 1:
        wire(recs, heads)


if __name__ == "__main__":
    main()
